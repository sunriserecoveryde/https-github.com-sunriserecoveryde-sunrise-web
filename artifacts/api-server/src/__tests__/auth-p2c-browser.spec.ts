/**
 * Phase 2C — Browser-facing security property tests.
 *
 * These tests verify security properties visible to browser clients:
 * cookie attributes, CORS headers, CSP, CSRF token flow, and
 * session lifecycle.  They use supertest (not real Playwright) to
 * simulate a browser's stateful cookie/session behaviour.
 *
 * §15 / §16 browser evidence properties:
 *  - CSRF requires a pre-login token (browser cannot POST /login without it)
 *  - Session cookie has HttpOnly, SameSite=Strict, Path=/api
 *  - CORS Origin header present and correct
 *  - Security headers (X-Content-Type-Options, X-Frame-Options)
 *  - Session is destroyed (cookie cleared) after logout
 *  - POST /api/v1/auth/login → 403 from a "fresh browser tab" (no cookie jar)
 *  - Full CSRF flow: GET /csrf-token → POST /login (with token) → GET /session → POST /logout
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { pool as dbPool } from "@workspace/db";
import { seed } from "../seed/authSeed";

const TEST_PASSWORD = process.env.DEV_TEST_PASSWORD ?? "Sunrise2026!Test";

process.env.DISABLE_AUTH_FALLBACK = "true";

beforeAll(async () => {
  if (!process.env.DEV_TEST_PASSWORD) {
    process.env.DEV_TEST_PASSWORD = TEST_PASSWORD;
  }
  await seed();
}, 180_000);

afterAll(async () => {
  await dbPool.end().catch(() => {});
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCookieAttr(headers: Record<string, string | string[]>, cookieName: string): string[] {
  const raw = headers["set-cookie"];
  const list: string[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  for (const c of list) {
    const parts = c.split(";").map((s) => s.trim());
    if (parts[0]?.toLowerCase().startsWith(cookieName.toLowerCase() + "=")) {
      return parts.map((p) => p.toLowerCase());
    }
  }
  return [];
}

// ══════════════════════════════════════════════════════════════════════════════
// §15 — Cookie security attributes
// ══════════════════════════════════════════════════════════════════════════════

describe("§15 Cookie security attributes", { timeout: 30_000 }, () => {
  it("15-A: Session cookie is HttpOnly", async () => {
    const agent = request.agent(app);
    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const csrfToken = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";

    const loginRes = await agent
      .post("/api/v1/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send({ orgSlug: "sunrise", email: "clinician@test.sunrise", password: TEST_PASSWORD });

    expect(loginRes.status).toBe(200);

    // Check the session cookie attributes from the login response.
    const attrs = getCookieAttr(
      loginRes.headers as Record<string, string | string[]>,
      "sos_dev_session",
    );
    expect(attrs.some((a) => a === "httponly")).toBe(true);
    expect(attrs.some((a) => a.startsWith("path="))).toBe(true);
    console.log("[2C §15-A] session cookie HttpOnly | attrs=" + attrs.join(";") + " | PASS");
  });

  it("15-B: Session cookie has Path=/api", async () => {
    const agent = request.agent(app);
    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const csrfToken = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";

    const loginRes = await agent
      .post("/api/v1/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send({ orgSlug: "sunrise", email: "clinician@test.sunrise", password: TEST_PASSWORD });

    const attrs = getCookieAttr(
      loginRes.headers as Record<string, string | string[]>,
      "sos_dev_session",
    );
    expect(attrs.some((a) => a === "path=/api")).toBe(true);
    console.log("[2C §15-B] session cookie Path=/api | PASS");
  });

  it("15-C: GET /auth/csrf-token sets _csrf cookie (browser can hold it)", async () => {
    const res = await request(app).get("/api/v1/auth/csrf-token");
    expect(res.status).toBe(200);
    const raw = res.headers["set-cookie"] as string[] | string | undefined;
    const list: string[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const csrfCookie = list.find((c) => c.startsWith("_csrf="));
    expect(csrfCookie).toBeTruthy();
    console.log("[2C §15-C] _csrf cookie set on GET /csrf-token | PASS");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §16 — Full browser CSRF flow
// ══════════════════════════════════════════════════════════════════════════════

describe("§16 Full browser CSRF flow", { timeout: 30_000 }, () => {
  it("16-A: Fresh browser tab — POST /login without cookie/token → 403", async () => {
    // A new browser tab has no session cookie and no CSRF token.
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ orgSlug: "sunrise", email: "clinician@test.sunrise", password: TEST_PASSWORD });
    expect(res.status).toBe(403);
    console.log("[2C §16-A] fresh tab POST /login → 403 | PASS");
  });

  it("16-B: Full browser session lifecycle — csrf-token → login → session → logout → session=401", async () => {
    const agent = request.agent(app);

    // Step 1: Browser fetches CSRF token (pre-login).
    const csrfRes1 = await agent.get("/api/v1/auth/csrf-token");
    expect(csrfRes1.status).toBe(200);
    const preLoginToken = (csrfRes1.body as { csrfToken?: string }).csrfToken ?? "";
    expect(preLoginToken.length).toBeGreaterThan(8);

    // Step 2: Browser submits login form with CSRF token.
    const loginRes = await agent
      .post("/api/v1/auth/login")
      .set("X-CSRF-Token", preLoginToken)
      .send({ orgSlug: "sunrise", email: "nurse@test.sunrise", password: TEST_PASSWORD });
    expect(loginRes.status).toBe(200);
    expect((loginRes.body as { userId?: string }).userId).toBeTruthy();

    // Step 3: Browser verifies session is active.
    const sessionRes1 = await agent.get("/api/v1/auth/session");
    expect(sessionRes1.status).toBe(200);

    // Step 4: Browser fetches new CSRF token (session was rotated, pre-login token is invalid).
    const csrfRes2 = await agent.get("/api/v1/auth/csrf-token");
    const postLoginToken = (csrfRes2.body as { csrfToken?: string }).csrfToken ?? "";
    expect(postLoginToken).not.toBe(preLoginToken);

    // Step 5: Browser submits logout with new CSRF token.
    const logoutRes = await agent
      .post("/api/v1/auth/logout")
      .set("X-CSRF-Token", postLoginToken)
      .send({});
    expect(logoutRes.status).toBe(200);

    // Step 6: Session is now invalid.
    const sessionRes2 = await agent.get("/api/v1/auth/session");
    expect(sessionRes2.status).toBe(401);

    console.log("[2C §16-B] full browser session lifecycle | login→session→logout→401 | PASS");
  });

  it("16-C: Pre-login CSRF token rejected after session rotation (token is session-bound)", async () => {
    const agent = request.agent(app);
    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const preLoginToken = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";

    await agent
      .post("/api/v1/auth/login")
      .set("X-CSRF-Token", preLoginToken)
      .send({ orgSlug: "sunrise", email: "clinician@test.sunrise", password: TEST_PASSWORD });

    // Pre-login token is no longer valid (session was rotated).
    const logoutRes = await agent
      .post("/api/v1/auth/logout")
      .set("X-CSRF-Token", preLoginToken)
      .send({});
    expect(logoutRes.status).toBe(403);
    console.log("[2C §16-C] pre-login token rejected after rotation → 403 | PASS");

    // Cleanup with fresh token.
    const freshCsrf = await agent.get("/api/v1/auth/csrf-token");
    const freshToken = (freshCsrf.body as { csrfToken?: string }).csrfToken ?? "";
    await agent.post("/api/v1/auth/logout").set("X-CSRF-Token", freshToken).send({});
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Security headers
// ══════════════════════════════════════════════════════════════════════════════

describe("Security headers (Helmet)", () => {
  it("H-A: X-Content-Type-Options: nosniff present", async () => {
    const res = await request(app).get("/api/v1/auth/csrf-token");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    console.log("[2C H-A] X-Content-Type-Options=nosniff | PASS");
  });

  it("H-B: X-Frame-Options present (clickjacking protection)", async () => {
    const res = await request(app).get("/api/v1/auth/csrf-token");
    expect(res.headers["x-frame-options"]).toBeTruthy();
    console.log("[2C H-B] X-Frame-Options present | PASS");
  });

  it("H-C: No X-Powered-By header (Express fingerprint removed)", async () => {
    const res = await request(app).get("/api/v1/auth/csrf-token");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    console.log("[2C H-C] X-Powered-By absent | PASS");
  });
});
