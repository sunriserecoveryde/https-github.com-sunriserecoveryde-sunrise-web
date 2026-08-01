/**
 * Phase 2B — Frontend-to-API Connectivity (§12)
 *
 * Proves real browser-to-API connectivity using Playwright (no route
 * interception, no mocks).  The frontend Sunrise OS app and the API server
 * must both be running.
 *
 * Requires:
 *   PLAYWRIGHT_BASE_URL   — base URL of the Sunrise OS frontend (default: http://localhost:80/sunrise-os)
 *   API_BASE_URL          — base URL of the API server (default: http://localhost:8080)
 *   DEV_TEST_PASSWORD     — test user password
 *
 * Run: pnpm --filter @workspace/api-server exec playwright test auth-p2b-frontend-connectivity
 */

import { test, expect, type Page } from "@playwright/test";

const FRONTEND_URL  = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:80/sunrise-os";
const API_URL       = process.env.API_BASE_URL         ?? "http://localhost:8080";
const TEST_PASSWORD = process.env.DEV_TEST_PASSWORD    ?? "Sunrise2026!Test";
const ORG_SLUG      = "sunrise";
const CLINICIAN     = "clinician@test.sunrise";

// ── Helper: login via real browser form ──────────────────────────────────────
async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${FRONTEND_URL}/login`);
  await page.waitForLoadState("networkidle");

  // Fill org slug if field exists
  const orgSlugInput = page.locator("input[name='orgSlug'], input[placeholder*='organization'], input[placeholder*='org']");
  if (await orgSlugInput.count() > 0) {
    await orgSlugInput.fill(ORG_SLUG);
  }

  // Fill credentials
  await page.locator("input[type='email'], input[name='email']").fill(email);
  await page.locator("input[type='password'], input[name='password']").fill(password);
  await page.locator("button[type='submit'], button:has-text('Sign in'), button:has-text('Log in')").click();

  // Wait for navigation away from login page
  await page.waitForURL((url) => !url.toString().includes("/login"), { timeout: 15_000 }).catch(() => {});
}

// ── §12.1 Health endpoint reachable ──────────────────────────────────────────

test("§12.1 API /health endpoint returns 200 (real HTTP, no mock)", async ({ request }) => {
  const res = await request.get(`${API_URL}/api/health`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toMatchObject({ status: "ok" });
});

// ── §12.2 CSRF token fetch ────────────────────────────────────────────────────

test("§12.2 API /csrf-token returns a token (real HTTP)", async ({ request }) => {
  const res = await request.get(`${API_URL}/api/v1/auth/csrf-token`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(typeof body.csrfToken).toBe("string");
  expect(body.csrfToken.length).toBeGreaterThan(10);
});

// ── §12.3 Login via API (no browser, proves API connectivity) ─────────────────

test("§12.3 POST /api/v1/auth/login with orgSlug returns 200 and session cookie", async ({ request }) => {
  // Get CSRF token
  const csrfRes = await request.get(`${API_URL}/api/v1/auth/csrf-token`);
  const csrfToken = (await csrfRes.json()).csrfToken as string;

  // POST login
  const loginRes = await request.post(`${API_URL}/api/v1/auth/login`, {
    headers: { "X-CSRF-Token": csrfToken },
    data: { orgSlug: ORG_SLUG, email: CLINICIAN, password: TEST_PASSWORD },
  });

  expect(loginRes.status()).toBe(200);
  const body = await loginRes.json();
  expect(body).toHaveProperty("userId");
  expect(body).toHaveProperty("orgId");
  expect(body).toHaveProperty("roleIds");
  expect(body).toHaveProperty("permissionCodes");
  expect(body).toHaveProperty("sessionExpiresAt");
  expect(body).toHaveProperty("authenticationMethod", "password");

  // Verify Set-Cookie header is present (real session cookie)
  const setCookieHeader = loginRes.headers()["set-cookie"];
  expect(setCookieHeader).toBeTruthy();
});

// ── §12.4 Session endpoint returns user after login ───────────────────────────

test("§12.4 GET /api/v1/auth/session returns user after login (real session cookie flow)", async ({ request }) => {
  // Get CSRF token
  const csrfRes = await request.get(`${API_URL}/api/v1/auth/csrf-token`);
  const csrfToken = (await csrfRes.json()).csrfToken as string;
  const csrfCookieHeader = csrfRes.headers()["set-cookie"] ?? "";

  // Login
  const loginRes = await request.post(`${API_URL}/api/v1/auth/login`, {
    headers: {
      "X-CSRF-Token": csrfToken,
      "Cookie": Array.isArray(csrfCookieHeader) ? csrfCookieHeader.join("; ") : csrfCookieHeader,
    },
    data: { orgSlug: ORG_SLUG, email: CLINICIAN, password: TEST_PASSWORD },
  });
  expect(loginRes.status()).toBe(200);

  const sessionCookieHeader = loginRes.headers()["set-cookie"];
  const allCookies = [
    ...(Array.isArray(csrfCookieHeader) ? csrfCookieHeader : [csrfCookieHeader]),
    ...(Array.isArray(sessionCookieHeader) ? sessionCookieHeader : [sessionCookieHeader ?? ""]),
  ].filter(Boolean).map((c) => c.split(";")[0]).join("; ");

  // GET /session with the cookies
  const sessionRes = await request.get(`${API_URL}/api/v1/auth/session`, {
    headers: {
      "Cookie": allCookies,
      "X-CSRF-Token": csrfToken,
    },
  });
  expect(sessionRes.status()).toBe(200);
  const sessionBody = await sessionRes.json();
  expect(sessionBody).toHaveProperty("userId");
  expect(sessionBody).toHaveProperty("orgId");
});

// ── §12.5 Logout invalidates session ─────────────────────────────────────────

test("§12.5 POST /api/v1/auth/logout invalidates session (no subsequent access)", async ({ request }) => {
  // Get CSRF token
  const csrfRes = await request.get(`${API_URL}/api/v1/auth/csrf-token`);
  const csrfToken = (await csrfRes.json()).csrfToken as string;
  const csrfCookieHeader = csrfRes.headers()["set-cookie"] ?? "";

  // Login
  const loginRes = await request.post(`${API_URL}/api/v1/auth/login`, {
    headers: {
      "X-CSRF-Token": csrfToken,
      "Cookie": Array.isArray(csrfCookieHeader) ? csrfCookieHeader.join("; ") : csrfCookieHeader,
    },
    data: { orgSlug: ORG_SLUG, email: CLINICIAN, password: TEST_PASSWORD },
  });
  expect(loginRes.status()).toBe(200);

  const sessionCookieHeader = loginRes.headers()["set-cookie"];
  const allCookies = [
    ...(Array.isArray(csrfCookieHeader) ? csrfCookieHeader : [csrfCookieHeader]),
    ...(Array.isArray(sessionCookieHeader) ? sessionCookieHeader : [sessionCookieHeader ?? ""]),
  ].filter(Boolean).map((c) => c.split(";")[0]).join("; ");

  // Logout
  const logoutRes = await request.post(`${API_URL}/api/v1/auth/logout`, {
    headers: { "Cookie": allCookies, "X-CSRF-Token": csrfToken },
  });
  expect(logoutRes.status()).toBe(200);

  // Session must be rejected
  const sessionRes = await request.get(`${API_URL}/api/v1/auth/session`, {
    headers: { "Cookie": allCookies, "X-CSRF-Token": csrfToken },
  });
  expect(sessionRes.status()).toBe(401);
});

// ── §12.6 Password reset endpoints are disabled ───────────────────────────────

test("§12.6 Password reset endpoints return 503 (not yet implemented)", async ({ request }) => {
  const reqRes = await request.post(`${API_URL}/api/v1/auth/password-reset/request`, {
    data: { email: CLINICIAN },
  });
  expect(reqRes.status()).toBe(503);

  const cmpRes = await request.post(`${API_URL}/api/v1/auth/password-reset/complete`, {
    data: { token: "test-token", password: "NewPassword123!" },
  });
  expect(cmpRes.status()).toBe(503);
});

// ── §12.7 Browser UI login (real browser, no intercepts) ─────────────────────
// Note: This test requires the frontend to be running at PLAYWRIGHT_BASE_URL.
// Skip gracefully if the frontend is not available.

test("§12.7 UI login form submits to real API — no XHR/fetch intercepts", async ({ page }) => {
  test.setTimeout(30_000);

  // Navigate to the login page
  const response = await page.goto(`${FRONTEND_URL}/login`).catch(() => null);
  if (!response || response.status() === 404 || response.status() >= 500) {
    test.skip(true, `Frontend not reachable at ${FRONTEND_URL}/login — skipping UI connectivity test`);
    return;
  }

  // Capture network requests to verify the login API call is NOT intercepted
  const apiRequests: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/v1/auth/login")) {
      apiRequests.push(req.url());
    }
  });

  await loginViaUI(page, CLINICIAN, TEST_PASSWORD);

  // Verify a real API call was made (not intercepted by MSW or similar)
  expect(apiRequests.length).toBeGreaterThan(0);
  expect(apiRequests[0]).toContain("/api/v1/auth/login");

  // Verify we're no longer on the login page
  const currentUrl = page.url();
  expect(currentUrl).not.toContain("/login");
});
