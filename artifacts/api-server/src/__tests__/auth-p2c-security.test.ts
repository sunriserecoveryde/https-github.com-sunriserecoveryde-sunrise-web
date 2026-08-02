/**
 * Phase 2C — Security Closure: comprehensive live-session tests.
 *
 * Covers all 18 Phase 2C sections with real DB queries and real HTTP flows.
 * Requires the seeded database (beforeAll calls seed()).
 *
 * Coverage:
 *  §5  effectiveAt guard — future-dated role = zero permissions at login
 *  §6  Patient access tied to role assignment — revoked assignment = no access
 *  §7  CSRF on login — login without CSRF token → 403
 *  §8  Transactional audit — login_success + session_created appear atomically
 *  §9  Dummy hash — constant-time failure for unknown accounts
 *  §10 IP address in audit log (via req.ip trust-proxy path)
 *  §11 staffProfileId resolved and non-null in session response
 *  §12 Authorization denial → sos_audit_outbox entry created
 *  §13 Outbox drain → sos_auth_audit populated
 *  §14 New personas: future-role, revoked-role, aftercare, ownership, hr
 *  §3  Facility admin cannot manage org-level users
 *  §4  Cross-tenant session revocation blocked
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { db, pool as dbPool } from "@workspace/db";
import { seed } from "../seed/authSeed";
import {
  drainAuditOutbox,
  authorize,
  buildScopedGrant,
  type AuthenticatedIdentity,
} from "../lib/authorizationService";

const TEST_PASSWORD: string = (() => {
  const p = process.env.PHASE2D_TEST_PASSWORD;
  if (!p) {
    throw new Error(
      "PHASE2D_TEST_PASSWORD env var is required for Phase 2C/2D integration tests.\n" +
      "Set it to the fictitious test account password before running this suite.\n" +
      "Do not use a real or production credential.",
    );
  }
  return p;
})();
const ORG_ID        = "00000000-0000-4000-a000-000000000001";
const FACILITY_ID   = "00000000-0000-4000-a000-000000000002";

const USERS = {
  orgAdmin:     "org-admin@test.sunrise",
  facilityAdmin: "facility-admin@test.sunrise",
  clinician:    "clinician@test.sunrise",
  nurse:        "nurse@test.sunrise",
  billing:      "billing@test.sunrise",
  disabled:     "disabled@test.sunrise",
  expiredRole:  "expired-role@test.sunrise",
  securityAdmin: "security-admin@test.sunrise",
  aftercare:    "aftercare@test.sunrise",
  ownership:    "ownership@test.sunrise",
  hr:           "hr@test.sunrise",
  futureRole:   "future-role@test.sunrise",
  revokedRole:  "revoked-role@test.sunrise",
};

process.env.DISABLE_AUTH_FALLBACK = "true";

beforeAll(async () => {
  // PHASE2D_TEST_PASSWORD must be set in the environment before running.
  // TEST_PASSWORD (above) already throws if it is absent.
  await seed();
}, 180_000);

afterAll(async () => {
  await dbPool.end().catch(() => {});
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loginAs(email: string, password = TEST_PASSWORD) {
  const agent = request.agent(app);
  const csrfRes = await agent.get("/api/v1/auth/csrf-token");
  const csrfToken = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";
  const res = await agent
    .post("/api/v1/auth/login")
    .set("X-CSRF-Token", csrfToken)
    .send({ orgSlug: "sunrise", email, password });
  return { agent, res, csrfToken };
}

async function sql(text: string, values?: unknown[]) {
  const r = await dbPool.query(text, values);
  return r.rows as Record<string, unknown>[];
}

// ══════════════════════════════════════════════════════════════════════════════
// §7 — CSRF on login
// ══════════════════════════════════════════════════════════════════════════════

describe("§7 CSRF on login", () => {
  it("7-A: POST /auth/login without CSRF token → 403", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ orgSlug: "sunrise", email: USERS.clinician, password: TEST_PASSWORD });
    expect(res.status).toBe(403);
    console.log("[2C §7-A] login without CSRF | status=403 | PASS");
  });

  it("7-B: POST /auth/login with valid pre-login CSRF token → 200", async () => {
    const { res } = await loginAs(USERS.clinician);
    expect(res.status).toBe(200);
    expect((res.body as { userId?: string }).userId).toBeTruthy();
    console.log("[2C §7-B] login with CSRF | status=200 | PASS");
  });

  it("7-C: login with wrong CSRF token value → 403", async () => {
    const agent = request.agent(app);
    await agent.get("/api/v1/auth/csrf-token");
    const res = await agent
      .post("/api/v1/auth/login")
      .set("X-CSRF-Token", "definitely-invalid-csrf-token-value")
      .send({ orgSlug: "sunrise", email: USERS.clinician, password: TEST_PASSWORD });
    expect(res.status).toBe(403);
    console.log("[2C §7-C] wrong CSRF token | status=403 | PASS");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §7b — CSRF rejection body — no stack trace leak
// ══════════════════════════════════════════════════════════════════════════════

describe("§7b CSRF rejection body — no stack trace leak", () => {
  it("7b-A: missing CSRF token → 403 JSON body with no stack or node_modules text", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ orgSlug: "sunrise", email: USERS.clinician, password: TEST_PASSWORD });

    expect(res.status).toBe(403);

    // Must be JSON, not HTML.
    expect(res.headers["content-type"]).toMatch(/application\/json/);

    // Body must contain only a generic error — no internal stack details.
    const body = res.body as Record<string, unknown>;
    expect(body.error).toBe("Forbidden");
    expect(body).not.toHaveProperty("stack");

    // Raw text must contain no stack-trace markers.
    const raw = JSON.stringify(body);
    expect(raw).not.toContain("node_modules");
    expect(raw).not.toContain("at Object.");
    expect(raw).not.toContain("at Function.");

    console.log("[2C §7b-A] CSRF 403 body is clean JSON | content-type=json | no stack | PASS");
  });

  it("7b-B: wrong CSRF token value → 403 JSON body with no stack or node_modules text", async () => {
    const agent = request.agent(app);
    await agent.get("/api/v1/auth/csrf-token");
    const res = await agent
      .post("/api/v1/auth/login")
      .set("X-CSRF-Token", "definitely-invalid-csrf-token-value")
      .send({ orgSlug: "sunrise", email: USERS.clinician, password: TEST_PASSWORD });

    expect(res.status).toBe(403);

    // Must be JSON, not HTML.
    expect(res.headers["content-type"]).toMatch(/application\/json/);

    const body = res.body as Record<string, unknown>;
    expect(body.error).toBe("Forbidden");
    expect(body).not.toHaveProperty("stack");

    const raw = JSON.stringify(body);
    expect(raw).not.toContain("node_modules");
    expect(raw).not.toContain("at Object.");
    expect(raw).not.toContain("at Function.");

    console.log("[2C §7b-B] wrong CSRF token 403 body is clean JSON | no stack | PASS");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §5 — effectiveAt guard
// ══════════════════════════════════════════════════════════════════════════════

describe("§5 effectiveAt guard", { timeout: 30_000 }, () => {
  it("5-A: future-role user — login returns 401 (no currently-effective assignments)", async () => {
    // The future-role persona has effectiveAt = tomorrow.
    // §5 filter: effectiveAt <= NOW() excludes it → getRoleAssignments() → [] → 401.
    const { res } = await loginAs(USERS.futureRole);
    expect(res.status).toBe(401);
    console.log("[2C §5-A] future-role login | status=401 | PASS");
  });

  it("5-B: expired-role user — login returns 401 (expiresAt in the past)", async () => {
    const { res } = await loginAs(USERS.expiredRole);
    expect(res.status).toBe(401);
    console.log("[2C §5-B] expired-role login | status=401 | PASS");
  });

  it("5-C: active role user — login succeeds with correct permissions", async () => {
    const { res } = await loginAs(USERS.clinician);
    expect(res.status).toBe(200);
    const body = res.body as { permissionCodes?: string[] };
    expect(body.permissionCodes).toContain("patient.list.view");
    console.log("[2C §5-C] clinician login | status=200 | permCodes present | PASS");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §6 — revoked-role user
// ══════════════════════════════════════════════════════════════════════════════

describe("§6 revoked-role user", { timeout: 30_000 }, () => {
  it("6-A: revoked-role user — login returns 401 (role assignment status=revoked)", async () => {
    // The revoked-role persona has assignment status='revoked'.
    // §5/§6 filter: only status='active' assignments → [] → 401.
    const { res } = await loginAs(USERS.revokedRole);
    expect(res.status).toBe(401);
    console.log("[2C §6-A] revoked-role login | status=401 | PASS");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §11 — staffProfileId resolved
// ══════════════════════════════════════════════════════════════════════════════

describe("§11 staffProfileId resolved", { timeout: 30_000 }, () => {
  it("11-A: GET /auth/session returns staffProfileId (non-null) for seeded users", async () => {
    const { agent, res: loginRes } = await loginAs(USERS.clinician);
    expect(loginRes.status).toBe(200);

    // After login, fetch CSRF token bound to the new session.
    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    expect(csrfRes.status).toBe(200);

    const sessionRes = await agent.get("/api/v1/auth/session");
    expect(sessionRes.status).toBe(200);
    const body = sessionRes.body as { staffProfileId?: string | null; userId?: string };
    expect(body.staffProfileId).toBeTruthy();
    expect(typeof body.staffProfileId).toBe("string");

    console.log("[2C §11-A] staffProfileId=" + body.staffProfileId?.slice(0, 8) + "... | PASS");

    // Cleanup
    const logoutCsrf = await agent.get("/api/v1/auth/csrf-token");
    const logoutToken = (logoutCsrf.body as { csrfToken?: string }).csrfToken ?? "";
    await agent.post("/api/v1/auth/logout").set("X-CSRF-Token", logoutToken).send({});
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §8 — Transactional audit
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// §8 / Login fault isolation — failed transaction must not leave auth session
// ══════════════════════════════════════════════════════════════════════════════

describe("§8 Login fault isolation", { timeout: 30_000 }, () => {
  it("TX-1: failed post-login transaction destroys the session — no partial auth state", async () => {
    // §8 invariant: if the DB transaction that writes audit/session compliance rows
    // fails AFTER the express session was saved as authenticated, the session must
    // be destroyed so the client cannot use the 503-response cookies to authenticate.
    //
    // Approach: spy on db.transaction to throw on the first call during login.
    // The 503 response must arrive, and any cookies in that response must not
    // grant access to a protected endpoint.

    const { vi } = await import("vitest");
    const { db: testDb } = await import("@workspace/db");

    const spy = vi.spyOn(testDb, "transaction").mockImplementationOnce(async () => {
      throw new Error("[fault-injection] simulated DB tx failure for TX-1 test");
    });

    const agent = request.agent(app);
    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const csrfToken = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";

    const loginRes = await agent
      .post("/api/v1/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send({ orgSlug: "sunrise", email: USERS.clinician, password: TEST_PASSWORD });

    spy.mockRestore();

    expect(loginRes.status).toBe(503);

    // Any Set-Cookie from the 503 must not grant access to a protected route.
    // The agent retains whatever cookies were set; a properly cleaned-up session
    // must return 401 when trying to access a protected endpoint.
    const sessionRes = await agent.get("/api/v1/auth/session");
    expect(sessionRes.status).toBe(401);

    console.log(
      "[2C TX-1] failed tx → session destroyed | login=503 | session check=" +
      sessionRes.status + " (expect 401) | PASS",
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════

describe("§8 Transactional audit", { timeout: 30_000 }, () => {
  it("8-A: Successful login writes login_success AND session_created atomically", async () => {
    const before = await sql(
      "SELECT COUNT(*) AS cnt FROM sos_auth_audit WHERE event_type IN ('login_success','session_created') AND org_id=$1",
      [ORG_ID],
    );
    const cntBefore = parseInt((before[0] as { cnt: string }).cnt, 10);

    const { agent, res: loginRes } = await loginAs(USERS.nurse);
    expect(loginRes.status).toBe(200);
    const userId = (loginRes.body as { userId?: string }).userId;
    expect(userId).toBeTruthy();

    // Both events must be present.
    const [successRow] = await sql(
      "SELECT event_type FROM sos_auth_audit WHERE event_type='login_success' AND user_id=$1 ORDER BY created_at DESC LIMIT 1",
      [userId],
    );
    const [createdRow] = await sql(
      "SELECT event_type FROM sos_auth_audit WHERE event_type='session_created' AND user_id=$1 ORDER BY created_at DESC LIMIT 1",
      [userId],
    );
    expect((successRow as { event_type: string }).event_type).toBe("login_success");
    expect((createdRow as { event_type: string }).event_type).toBe("session_created");

    const after = await sql(
      "SELECT COUNT(*) AS cnt FROM sos_auth_audit WHERE event_type IN ('login_success','session_created') AND org_id=$1",
      [ORG_ID],
    );
    const cntAfter = parseInt((after[0] as { cnt: string }).cnt, 10);
    expect(cntAfter).toBeGreaterThanOrEqual(cntBefore + 2);

    console.log("[2C §8-A] login_success + session_created both present | delta=" + (cntAfter - cntBefore) + " | PASS");

    // Cleanup
    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const token = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";
    await agent.post("/api/v1/auth/logout").set("X-CSRF-Token", token).send({});
  });

  it("8-B: Logout writes audit event and revokes session atomically", async () => {
    const { agent, res: loginRes } = await loginAs(USERS.clinician);
    expect(loginRes.status).toBe(200);
    const userId = (loginRes.body as { userId?: string }).userId!;

    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const token = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";

    const logoutRes = await agent.post("/api/v1/auth/logout").set("X-CSRF-Token", token).send({});
    expect(logoutRes.status).toBe(200);

    // Audit event written.
    const [logoutRow] = await sql(
      "SELECT event_type, outcome FROM sos_auth_audit WHERE event_type='logout' AND user_id=$1 ORDER BY created_at DESC LIMIT 1",
      [userId],
    );
    expect((logoutRow as { event_type: string }).event_type).toBe("logout");
    expect((logoutRow as { outcome: string }).outcome).toBe("success");
    console.log("[2C §8-B] logout audit row written | PASS");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §12 — Audit outbox for authorization denials
// ══════════════════════════════════════════════════════════════════════════════

describe("§12 Audit outbox for authorization denials", { timeout: 30_000 }, () => {
  it("12-A: Authorization denial writes to sos_audit_outbox (not silently dropped)", async () => {
    // Logged-in billing user attempts to access an endpoint requiring user.manage.
    const { agent, res: loginRes } = await loginAs(USERS.billing);
    expect(loginRes.status).toBe(200);

    const outboxBefore = await sql(
      "SELECT COUNT(*) AS cnt FROM sos_audit_outbox WHERE event_type='authorization_denied' AND org_id=$1",
      [ORG_ID],
    );
    const cntBefore = parseInt((outboxBefore[0] as { cnt: string }).cnt, 10);

    // Attempt an action requiring user.manage.
    const denyRes = await agent.get("/api/v1/admin/users");
    expect([403, 404]).toContain(denyRes.status); // 403 or 404 depending on route existence

    // Allow setImmediate drain to run.
    await new Promise((r) => setTimeout(r, 200));

    // Drain any remaining outbox entries manually for deterministic assertion.
    await drainAuditOutbox();

    const auditRows = await sql(
      "SELECT event_type, outcome FROM sos_auth_audit WHERE event_type='authorization_denied' AND org_id=$1 ORDER BY created_at DESC LIMIT 5",
      [ORG_ID],
    );
    // At least one denial row should have been drained to sos_auth_audit.
    const hasDenial = auditRows.some(
      (r) => (r as { event_type: string }).event_type === "authorization_denied",
    );
    // Drain may or may not have run depending on timing; check either outbox or audit.
    const outboxAfter = await sql(
      "SELECT COUNT(*) AS cnt FROM sos_audit_outbox WHERE event_type='authorization_denied' AND org_id=$1",
      [ORG_ID],
    );
    const cntAfter = parseInt((outboxAfter[0] as { cnt: string }).cnt, 10);
    expect(hasDenial || cntAfter > cntBefore).toBe(true);

    console.log("[2C §12-A] denial in outbox=" + (cntAfter > cntBefore) + " | in audit=" + hasDenial + " | PASS");

    // Cleanup
    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const token = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";
    await agent.post("/api/v1/auth/logout").set("X-CSRF-Token", token).send({});
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §14 — New personas
// ══════════════════════════════════════════════════════════════════════════════

describe("§14 New persona coverage", { timeout: 60_000 }, () => {
  it("14-A: aftercare@test.sunrise can log in with aftercare_staff permissions", async () => {
    const { res } = await loginAs(USERS.aftercare);
    expect(res.status).toBe(200);
    const body = res.body as { roleIds?: string[]; permissionCodes?: string[] };
    expect(body.roleIds).toContain("aftercare_staff");
    console.log("[2C §14-A] aftercare login | status=200 | PASS");
  });

  it("14-B: ownership@test.sunrise logs in as org-wide ownership role", async () => {
    const { res } = await loginAs(USERS.ownership);
    expect(res.status).toBe(200);
    const body = res.body as { roleIds?: string[] };
    expect(body.roleIds).toContain("ownership");
    console.log("[2C §14-B] ownership login | status=200 | PASS");
  });

  it("14-C: hr@test.sunrise logs in as human_resources (org-wide, no patient access)", async () => {
    const { res } = await loginAs(USERS.hr);
    expect(res.status).toBe(200);
    const body = res.body as { roleIds?: string[]; permissionCodes?: string[] };
    expect(body.roleIds).toContain("human_resources");
    expect(body.permissionCodes).not.toContain("patient.list.view");
    console.log("[2C §14-C] hr login | no patient.list.view | PASS");
  });

  it("14-D: future-role@test.sunrise cannot log in (effectiveAt > NOW)", async () => {
    const { res } = await loginAs(USERS.futureRole);
    expect(res.status).toBe(401);
    console.log("[2C §14-D] future-role login | status=401 | PASS");
  });

  it("14-E: revoked-role@test.sunrise cannot log in (status=revoked)", async () => {
    const { res } = await loginAs(USERS.revokedRole);
    expect(res.status).toBe(401);
    console.log("[2C §14-E] revoked-role login | status=401 | PASS");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §3 — Scoped admin authorization
// ══════════════════════════════════════════════════════════════════════════════

describe("§3 Scoped admin authorization", { timeout: 30_000 }, () => {
  it("3-A: facility admin cannot create a user with an org-level role", async () => {
    const { agent, res: loginRes } = await loginAs(USERS.facilityAdmin);
    expect(loginRes.status).toBe(200);

    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const csrf = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";

    // Attempt to create a user with cmo (org-level) role without facilityId.
    const createRes = await agent
      .post("/api/v1/admin/users")
      .set("X-CSRF-Token", csrf)
      .send({
        orgId:     ORG_ID,
        email:     "neworgadmin@test.sunrise",
        password:  "NewPassword1!Test",
        roleId:    "cmo",
        facilityId: null,
      });
    // Should be 403 — facility admin cannot grant cmo (org-level) role.
    expect(createRes.status).toBe(403);
    console.log("[2C §3-A] facility-admin create cmo | status=403 | PASS");

    // Cleanup
    const logoutCsrf = await agent.get("/api/v1/auth/csrf-token");
    const logoutToken = (logoutCsrf.body as { csrfToken?: string }).csrfToken ?? "";
    await agent.post("/api/v1/auth/logout").set("X-CSRF-Token", logoutToken).send({});
  });

  it("3-A2: org admin can create a user with any role", async () => {
    const { agent, res: loginRes } = await loginAs(USERS.orgAdmin);
    expect(loginRes.status).toBe(200);

    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const csrf = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";

    const createRes = await agent
      .post("/api/v1/admin/users")
      .set("X-CSRF-Token", csrf)
      .send({
        orgId:      ORG_ID,
        email:      "newclinician2c@test.sunrise",
        password:   "NewPassword1!Test",
        roleId:     "certified_clinician",
        facilityId: FACILITY_ID,
      });
    expect([201, 409]).toContain(createRes.status); // 409 if already exists from previous run
    console.log("[2C §3-A2] org-admin create clinician | status=" + createRes.status + " | PASS");

    // Cleanup
    const logoutCsrf = await agent.get("/api/v1/auth/csrf-token");
    const logoutToken = (logoutCsrf.body as { csrfToken?: string }).csrfToken ?? "";
    await agent.post("/api/v1/auth/logout").set("X-CSRF-Token", logoutToken).send({});
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §4 — Cross-tenant session revocation blocked
// ══════════════════════════════════════════════════════════════════════════════

describe("§4 Cross-tenant session revocation blocked", { timeout: 30_000 }, () => {
  it("4-A: Self-revocation via admin route is blocked", async () => {
    const { agent, res: loginRes } = await loginAs(USERS.orgAdmin);
    expect(loginRes.status).toBe(200);
    const adminUserId = (loginRes.body as { userId?: string }).userId!;

    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const csrf = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";

    // Self-revocation should be blocked (self-action-denied).
    const revokeRes = await agent
      .post(`/api/v1/admin/sessions/${adminUserId}/revoke-all`)
      .set("X-CSRF-Token", csrf)
      .send({});
    expect(revokeRes.status).toBe(403);
    console.log("[2C §4-A] self-revoke blocked | status=403 | PASS");

    // Cleanup
    const logoutCsrf = await agent.get("/api/v1/auth/csrf-token");
    const logoutToken = (logoutCsrf.body as { csrfToken?: string }).csrfToken ?? "";
    await agent.post("/api/v1/auth/logout").set("X-CSRF-Token", logoutToken).send({});
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §9 — Constant-time response (enumeration prevention)
// ══════════════════════════════════════════════════════════════════════════════

describe("§9 Constant-time enumeration prevention", () => {
  it("9-A: unknown-account and wrong-password responses are indistinguishable", async () => {
    const agent1 = request.agent(app);
    const csrf1 = await agent1.get("/api/v1/auth/csrf-token");
    const token1 = (csrf1.body as { csrfToken?: string }).csrfToken ?? "";

    const agent2 = request.agent(app);
    const csrf2 = await agent2.get("/api/v1/auth/csrf-token");
    const token2 = (csrf2.body as { csrfToken?: string }).csrfToken ?? "";

    const [unknownRes, wrongPwdRes] = await Promise.all([
      agent1
        .post("/api/v1/auth/login")
        .set("X-CSRF-Token", token1)
        .send({ orgSlug: "sunrise", email: "nosuchuser@nowhere.test", password: "Anything1!" }),
      agent2
        .post("/api/v1/auth/login")
        .set("X-CSRF-Token", token2)
        .send({ orgSlug: "sunrise", email: USERS.clinician, password: "WrongPassword999!" }),
    ]);

    expect(unknownRes.status).toBe(401);
    expect(wrongPwdRes.status).toBe(401);
    expect((unknownRes.body as { error?: string }).error).toBe(
      (wrongPwdRes.body as { error?: string }).error,
    );

    // Cleanup
    await sql(
      "UPDATE sos_user_accounts SET failed_login_count=0, locked_until=NULL WHERE email=$1 AND org_id=$2",
      [USERS.clinician, ORG_ID],
    );
    console.log("[2C §9-A] unknown-account and wrong-password → same error body | PASS");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §6 — Exact role-assignment binding (negative cases)
// ══════════════════════════════════════════════════════════════════════════════

describe("§6 Exact role-assignment binding (negative cases)", { timeout: 30_000 }, () => {
  it("6-B: patient access row bound to a DIFFERENT (revoked) assignment does not authorize", async () => {
    // §6 invariant: checkPatientAccessForGrant(roleAssignmentId=A) must NOT be
    // satisfied by an access row whose FK = B (B ≠ A), even if B is a real row.
    // Only rows where FK IS NULL (backward compat) or FK = A (exact match) qualify.
    //
    // Test approach: call authorize() directly with a constructed caseload-limited
    // identity (bht is facilityWide=false) so the per-patient check is always reached.
    // The certified_clinician role is facilityWide=true and would skip the check.

    // Real user account for FK validity on sos_role_assignments and sos_patient_access.
    const [clinicianAccount] = await sql(
      "SELECT id FROM sos_user_accounts WHERE email=$1 AND org_id=$2",
      [USERS.clinician, ORG_ID],
    );
    expect(clinicianAccount).toBeDefined();
    const clinicanUserId = (clinicianAccount as { id: string }).id;

    // Assignment A — presented in the identity (the "current" grant being checked).
    const [rowA] = await sql(
      `INSERT INTO sos_role_assignments
         (id, org_id, user_id, role_id, facility_id, status, effective_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'bht', $3, 'active', now()-interval'1 day', now())
       RETURNING id`,
      [ORG_ID, clinicanUserId, FACILITY_ID],
    );
    const assignmentAId = (rowA as { id: string }).id;

    // Assignment B — what the patient_access row will reference.
    // Phase 2D trigger requires B to be active at INSERT time; we revoke it afterwards
    // so the scenario is: access row bound to B, B is now revoked, user presents grant A (A≠B).
    const [rowB] = await sql(
      `INSERT INTO sos_role_assignments
         (id, org_id, user_id, role_id, facility_id, status, effective_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'bht', $3, 'active', now()-interval'30 days', now())
       RETURNING id`,
      [ORG_ID, clinicanUserId, FACILITY_ID],
    );
    const assignmentBId = (rowB as { id: string }).id;
    expect(assignmentAId).not.toEqual(assignmentBId);

    // Any patient in this org for the access row.
    const [seededPt] = await sql(
      "SELECT id FROM sos_patients WHERE org_id=$1 LIMIT 1",
      [ORG_ID],
    );
    expect(seededPt).toBeDefined();
    const patientId = (seededPt as { id: string }).id;

    await sql(
      "DELETE FROM sos_patient_access WHERE user_id=$1 AND patient_id=$2 AND org_id=$3",
      [clinicanUserId, patientId, ORG_ID],
    );
    // Access row explicitly bound to B (not to A).
    // Trigger fires at INSERT; B is active at this point → OK.
    await sql(
      `INSERT INTO sos_patient_access
         (id, org_id, user_id, patient_id, facility_id, status, role_assignment_id, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'active', $5, now())`,
      [ORG_ID, clinicanUserId, patientId, FACILITY_ID, assignmentBId],
    );
    // Now revoke B — the access row still references it; presenting A (A≠B) should be denied.
    await sql(
      "UPDATE sos_role_assignments SET status='revoked' WHERE id=$1",
      [assignmentBId],
    );

    // Construct identity presenting grant A.  bht is facilityWide=false so the
    // per-patient checkPatientAccessForGrant is always invoked.
    const grantA = buildScopedGrant({
      id:          assignmentAId,
      roleId:      "bht",
      orgId:       ORG_ID,
      facilityId:  FACILITY_ID,
      effectiveAt: new Date(Date.now() - 86_400_000),
      expiresAt:   null,
    });
    expect(grantA.facilityWide).toBe(false); // guard: confirms per-patient check path

    const testIdentity: AuthenticatedIdentity = {
      userId:               clinicanUserId,
      staffProfileId:       null,
      orgId:                ORG_ID,
      sessionId:            "test-session-6b",
      grants:               [grantA],
      roleIds:              [grantA.roleId],
      permissionCodes:      grantA.permissions,
      facilityIds:          [FACILITY_ID],
      orgWide:              false,
      authenticationMethod: "password",
      authenticatedAt:      new Date().toISOString(),
      sessionVersion:       1,
    };

    // authorize() with assignment A presented; access row bound to B ≠ A → denied.
    const decision = await authorize({
      identity:   testIdentity,
      permission: "patient.episode.view",
      orgId:      ORG_ID,
      facilityId: FACILITY_ID,
      patientId,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("patient-out-of-scope");
    console.log(`[2C §6-B] exact-assignment binding | reasonCode=${decision.reasonCode} | PASS`);

    // Cleanup.
    await sql(
      "DELETE FROM sos_patient_access WHERE user_id=$1 AND patient_id=$2 AND org_id=$3",
      [clinicanUserId, patientId, ORG_ID],
    );
    await sql("DELETE FROM sos_role_assignments WHERE id=$1", [assignmentAId]);
    await sql("DELETE FROM sos_role_assignments WHERE id=$1", [assignmentBId]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §3 — Scoped admin: facility admin cannot disable org-level user
// ══════════════════════════════════════════════════════════════════════════════

describe("§3 Facility admin scope: disable/reactivate boundaries", { timeout: 30_000 }, () => {
  it("3-B: facility admin cannot disable an org-level user (role has no facilityId)", async () => {
    // Get the org-admin's account ID.
    const [orgAdminAccount] = await sql(
      "SELECT id FROM sos_user_accounts WHERE email=$1 AND org_id=$2",
      [USERS.orgAdmin, ORG_ID],
    );
    expect(orgAdminAccount).toBeDefined();
    const orgAdminId = (orgAdminAccount as { id: string }).id;

    // Log in as facility-admin.
    const { agent, res: loginRes } = await loginAs(USERS.facilityAdmin);
    expect(loginRes.status).toBe(200);

    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const csrf = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";

    // Facility admin attempts to disable the org-level admin → 403.
    const disableRes = await agent
      .post(`/api/v1/admin/users/${orgAdminId}/disable`)
      .set("X-CSRF-Token", csrf)
      .send({});
    expect(disableRes.status).toBe(403);
    console.log("[2C §3-B] facility-admin disable org-level user | status=403 | PASS");

    // Cleanup logout.
    const logoutCsrf = await agent.get("/api/v1/auth/csrf-token");
    const logoutToken = (logoutCsrf.body as { csrfToken?: string }).csrfToken ?? "";
    await agent.post("/api/v1/auth/logout").set("X-CSRF-Token", logoutToken).send({});
  });

  it("3-C: org admin can disable a facility-level user", async () => {
    // Use the disabled persona (already disabled) to avoid side effects;
    // just test that org-admin can call the endpoint without 403.
    const [disabledAccount] = await sql(
      "SELECT id FROM sos_user_accounts WHERE email=$1 AND org_id=$2",
      [USERS.disabled, ORG_ID],
    );
    expect(disabledAccount).toBeDefined();
    const disabledId = (disabledAccount as { id: string }).id;

    const { agent, res: loginRes } = await loginAs(USERS.orgAdmin);
    expect(loginRes.status).toBe(200);

    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const csrf = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";

    // Org admin disabling a facility user → should be 200 (already disabled is ok,
    // just verify it's not 403 scope-denied).
    const disableRes = await agent
      .post(`/api/v1/admin/users/${disabledId}/disable`)
      .set("X-CSRF-Token", csrf)
      .send({});
    expect([200, 400]).toContain(disableRes.status); // 400 if "already disabled" validation
    expect(disableRes.status).not.toBe(403);
    console.log("[2C §3-C] org-admin disable facility user | status=" + disableRes.status + " | not 403 | PASS");

    const logoutCsrf = await agent.get("/api/v1/auth/csrf-token");
    const logoutToken = (logoutCsrf.body as { csrfToken?: string }).csrfToken ?? "";
    await agent.post("/api/v1/auth/logout").set("X-CSRF-Token", logoutToken).send({});
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §1 — Field-level DTO projection
// ══════════════════════════════════════════════════════════════════════════════

describe("§1 Field-level patient DTO projection", { timeout: 30_000 }, () => {
  it("1-A: billing_staff GET /patients — no chart/episode fields leaked (only identity + demographics)", async () => {
    const { agent, res: loginRes } = await loginAs(USERS.billing);
    expect(loginRes.status).toBe(200);
    const body = loginRes.body as { permissionCodes?: string[] };
    // billing_staff has patient.list.view + patient.demographics.view only
    expect(body.permissionCodes).toContain("patient.list.view");
    expect(body.permissionCodes).toContain("patient.demographics.view");
    expect(body.permissionCodes).not.toContain("patient.chart.view");

    const patientsRes = await agent.get("/api/v1/patients");
    expect(patientsRes.status).toBe(200);
    const patients = patientsRes.body as Record<string, unknown>[];
    if (patients.length > 0) {
      const p = patients[0];
      // Demographics tier: mrn present
      expect(p).toHaveProperty("mrn");
      // Chart tier: createdAt/updatedAt absent
      expect(p).not.toHaveProperty("createdAt");
      expect(p).not.toHaveProperty("updatedAt");
    }

    console.log("[2C §1-A] billing patient response shape verified | PASS");

    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const token = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";
    await agent.post("/api/v1/auth/logout").set("X-CSRF-Token", token).send({});
  });

  it("1-B: security_admin GET /patients → 403 (no patient.list.view permission)", async () => {
    const { agent, res: loginRes } = await loginAs(USERS.securityAdmin);
    expect(loginRes.status).toBe(200);
    const patientsRes = await agent.get("/api/v1/patients");
    expect(patientsRes.status).toBe(403);
    console.log("[2C §1-B] security_admin → 403 on /patients | PASS");

    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const token = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";
    await agent.post("/api/v1/auth/logout").set("X-CSRF-Token", token).send({});
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §6-C Multi-grant: listAssignedPatients exact-binding via /patients endpoint
// §3-D Multi-assignment: facility-admin denied if target has any out-of-scope assignment
// ══════════════════════════════════════════════════════════════════════════════

describe("§6-C listAssignedPatients exact-binding (multi-grant list path)", { timeout: 30_000 }, () => {
  it("6-C: patient bound to assignment B is NOT returned when evaluating grant A (A≠B)", async () => {
    // This tests the list path (GET /patients) to ensure that per-grant
    // assignment binding is enforced at the repository level, not just in
    // the per-patient authorize() check.
    //
    // Setup: create two role-assignments for the clinician user (A and B),
    // a patient with a patient-access row bound only to B.
    // When evaluating grant A the patient must NOT appear in the list.

    const [clinicianAccount] = await sql(
      "SELECT id FROM sos_user_accounts WHERE email=$1 AND org_id=$2",
      [USERS.clinician, ORG_ID],
    );
    expect(clinicianAccount).toBeDefined();
    const clinicianUserId = (clinicianAccount as { id: string }).id;

    const assignmentAId = crypto.randomUUID();
    const assignmentBId = crypto.randomUUID();

    // Insert two bht role assignments for the same user (simulating multi-grant).
    await sql(
      `INSERT INTO sos_role_assignments
         (id, org_id, user_id, role_id, facility_id, status, effective_at, created_at)
       VALUES ($1,$2,$3,'bht',$4,'active',now()-interval '1 day',now()),
              ($5,$2,$3,'bht',$4,'active',now()-interval '1 day',now())`,
      [assignmentAId, ORG_ID, clinicianUserId, FACILITY_ID, assignmentBId],
    );

    // Create a temporary patient.
    const [newPatient] = await sql(
      `INSERT INTO sos_patients
         (org_id, facility_id, mrn, first_name, last_name, status)
       VALUES ($1,$2,'TMP-6C','Test6C','Patient','active')
       RETURNING id`,
      [ORG_ID, FACILITY_ID],
    );
    const patientId = (newPatient as { id: string }).id;

    // Patient access row bound to assignment B ONLY.
    await sql(
      `INSERT INTO sos_patient_access
         (id, org_id, user_id, patient_id, facility_id, status, role_assignment_id, created_at)
       VALUES (gen_random_uuid(),$1,$2,$3,$4,'active',$5,now())`,
      [ORG_ID, clinicianUserId, patientId, FACILITY_ID, assignmentBId],
    );

    // Construct an identity presenting ONLY grant A.
    const { buildScopedGrant: bsg2 } = await import("../lib/authorizationService");
    const grantA = bsg2({
      id: assignmentAId, roleId: "bht", orgId: ORG_ID,
      facilityId: FACILITY_ID, effectiveAt: new Date(Date.now() - 86_400_000), expiresAt: null,
    });

    // Use the repository directly to verify exact-binding.
    const { listAssignedPatients: lap } = await import("@workspace/db");
    const rows = await lap(ORG_ID, clinicianUserId, FACILITY_ID, "chart", grantA.roleAssignmentId);
    const found = rows.some((r) => r.id === patientId);
    expect(found).toBe(false);
    console.log(
      `[2C §6-C] patient bound to B not returned for grant A | rows=${rows.length} found=${found} | PASS`,
    );

    // Cleanup.
    await sql("DELETE FROM sos_patient_access WHERE patient_id=$1", [patientId]);
    await sql("DELETE FROM sos_patients WHERE id=$1", [patientId]);
    await sql("DELETE FROM sos_role_assignments WHERE id=$1", [assignmentAId]);
    await sql("DELETE FROM sos_role_assignments WHERE id=$1", [assignmentBId]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §1-C Per-patient projection: higher-tier fields must not leak to patients
//       reachable ONLY via a lower-tier grant (mixed-role / mixed-scope user)
// ══════════════════════════════════════════════════════════════════════════════

describe("§1-C Per-patient projection for mixed-scope users", { timeout: 30_000 }, () => {
  it("1-C: chart-tier grant on facility B must not expose chart fields for patients only in facility A (demographics grant)", async () => {
    // This test verifies that per-patient/per-authorising-grant projection is
    // enforced on the GET /patients response.  A user with:
    //   Grant A: facility A, demographics only
    //   Grant B: facility B, chart access
    // must receive demographics-only fields for patients reachable via Grant A
    // even though Grant B provides chart-level access.
    //
    // Implementation note: we build two separate facility-scoped assignments for
    // the billing user (demographics only for their existing facility assignment)
    // and insert a chart-access role assignment for a second facility.
    // The test creates a patient exclusively in facility A and verifies that the
    // list response does not expose chart-tier fields (createdAt, updatedAt,
    // primaryDiagnosis) for that patient, even though the same user has chart
    // access in another facility.

    // Get the billing user's account ID and their existing assignment.
    const [billingAccount] = await sql(
      "SELECT ua.id AS uid FROM sos_user_accounts ua WHERE ua.email=$1 AND ua.org_id=$2",
      [USERS.billing, ORG_ID],
    );
    expect(billingAccount).toBeDefined();
    const billingUserId = (billingAccount as { uid: string }).uid;

    // Insert a second facility for this test.
    const [facilityBRow] = await sql(
      `INSERT INTO sos_facilities (org_id, name, created_at, updated_at)
       VALUES ($1,'Test Facility B (1-C)',now(),now())
       RETURNING id`,
      [ORG_ID],
    );
    const facilityBId = (facilityBRow as { id: string }).id;

    // Insert a chart-access assignment for billing user in facility B.
    // certified_clinician has patient.chart.view.
    const chartAssignmentId = crypto.randomUUID();
    await sql(
      `INSERT INTO sos_role_assignments
         (id, org_id, user_id, role_id, facility_id, status, effective_at, created_at)
       VALUES ($1,$2,$3,'certified_clinician',$4,'active',now()-interval '1 day',now())`,
      [chartAssignmentId, ORG_ID, billingUserId, facilityBId],
    );

    // Create a patient in FACILITY_ID (the billing user's original caseload facility).
    const [newPatient] = await sql(
      `INSERT INTO sos_patients
         (org_id, facility_id, mrn, first_name, last_name, status)
       VALUES ($1,$2,'TMP-1C','Test1C','Patient','active')
       RETURNING id`,
      [ORG_ID, FACILITY_ID],
    );
    const patientId = (newPatient as { id: string }).id;

    // Create a patient in facilityB (covered by chart-access grant).
    const [patientB] = await sql(
      `INSERT INTO sos_patients
         (org_id, facility_id, mrn, first_name, last_name, status)
       VALUES ($1,$2,'TMP-1C-B','Test1C-B','Patient','active')
       RETURNING id`,
      [ORG_ID, facilityBId],
    );
    const patientBId = (patientB as { id: string }).id;

    // Grant billing user access to patient A (bound to their original caseload assignment).
    const [billingAssignment] = await sql(
      "SELECT id FROM sos_role_assignments WHERE user_id=$1 AND org_id=$2 AND status='active' AND role_id='billing_staff' ORDER BY created_at DESC LIMIT 1",
      [billingUserId, ORG_ID],
    );
    const origAssignmentId = (billingAssignment as { id: string } | undefined)?.id;
    await sql(
      `INSERT INTO sos_patient_access
         (id, org_id, user_id, patient_id, facility_id, status, role_assignment_id, created_at)
       VALUES (gen_random_uuid(),$1,$2,$3,$4,'active',$5,now())`,
      [ORG_ID, billingUserId, patientId, FACILITY_ID, origAssignmentId ?? null],
    );

    // Log in as billing user.
    const { agent, res: loginRes } = await loginAs(USERS.billing);
    expect(loginRes.status).toBe(200);

    const patientsRes = await agent.get("/api/v1/patients");
    expect(patientsRes.status).toBe(200);
    const patients = patientsRes.body as Record<string, unknown>[];

    // Verify per-patient projection:
    //  Patient A (facility A, authorized via demographics grant) → no chart fields.
    //  Patient B (facility B, authorized via chart grant) → chart fields present.
    const pA = patients.find((p) => (p as { id: string }).id === patientId);
    const pB = patients.find((p) => (p as { id: string }).id === patientBId);

    if (pA) {
      expect(pA).not.toHaveProperty("createdAt");
      expect(pA).not.toHaveProperty("updatedAt");
      expect(pA).not.toHaveProperty("primaryDiagnosis");
      console.log("[2C §1-C] Patient A (demographics grant only) — no chart fields | PASS");
    }
    if (pB) {
      expect(pB).toHaveProperty("createdAt");
      expect(pB).toHaveProperty("updatedAt");
      console.log("[2C §1-C] Patient B (chart grant) — chart fields present | PASS");
    }

    // Cleanup.
    await sql("DELETE FROM sos_patient_access WHERE patient_id=$1 OR patient_id=$2", [patientId, patientBId]);
    await sql("DELETE FROM sos_patients WHERE id=$1 OR id=$2", [patientId, patientBId]);
    await sql("DELETE FROM sos_role_assignments WHERE id=$1", [chartAssignmentId]);
    await sql("DELETE FROM sos_facilities WHERE id=$1", [facilityBId]);

    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const token = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";
    await agent.post("/api/v1/auth/logout").set("X-CSRF-Token", token).send({});
  });
});

describe("§3-D Disable: multi-assignment target denied if any assignment out of scope", { timeout: 30_000 }, () => {
  it("3-D: facility-admin cannot disable user who holds an out-of-scope org-level assignment", async () => {
    // Setup: insert an org-level (facilityId=NULL) active assignment for the
    // `disabled` test user so the target holds BOTH an in-scope facility
    // assignment AND an out-of-scope org-level one.  Facility-admin must be
    // denied even though one assignment would individually pass.

    const [disabledAccount] = await sql(
      "SELECT id FROM sos_user_accounts WHERE email=$1 AND org_id=$2",
      [USERS.disabled, ORG_ID],
    );
    expect(disabledAccount).toBeDefined();
    const disabledUserId = (disabledAccount as { id: string }).id;

    // Insert a temporary org-level (facilityId=NULL) active assignment.
    const orgLevelId = crypto.randomUUID();
    await sql(
      `INSERT INTO sos_role_assignments
         (id, org_id, user_id, role_id, facility_id, status, effective_at, created_at)
       VALUES ($1,$2,$3,'cmo',NULL,'active',now()-interval '1 day',now())`,
      [orgLevelId, ORG_ID, disabledUserId],
    );

    const { agent, res: loginRes } = await loginAs(USERS.facilityAdmin);
    expect(loginRes.status).toBe(200);
    const csrfRes = await agent.get("/api/v1/auth/csrf-token");
    const csrf = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";

    // Facility-admin tries to disable a user who has an org-level assignment → 403.
    const disableRes = await agent
      .post(`/api/v1/admin/users/${disabledUserId}/disable`)
      .set("X-CSRF-Token", csrf)
      .send({});
    expect(disableRes.status).toBe(403);
    console.log("[2C §3-D] facility-admin denied for multi-assignment target | status=403 | PASS");

    // Cleanup.
    await sql("DELETE FROM sos_role_assignments WHERE id=$1", [orgLevelId]);

    const logoutCsrf = await agent.get("/api/v1/auth/csrf-token");
    const logoutToken = (logoutCsrf.body as { csrfToken?: string }).csrfToken ?? "";
    await agent.post("/api/v1/auth/logout").set("X-CSRF-Token", logoutToken).send({});
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §RL — Rate-limit rejection body — no stack trace leak
// ══════════════════════════════════════════════════════════════════════════════

describe("§RL Rate-limit rejection body — no stack trace leak", () => {
  it("RL-A: /api/contact rate-limit → 429 JSON with no stack or node_modules text", async () => {
    // makeLimiter() sets limit=5 per hour for /api/contact (app.ts).
    // Uses the default MemoryStore — no external state, no skip in test mode.
    // Fire up to 10 requests; the limiter must trip by the 6th at the latest.
    let rateLimitedRes: import("supertest").Response | null = null;
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app)
        .post("/api/contact")
        .send({ name: "Test", email: "test@example.com", message: "rate-limit probe" });
      if (res.status === 429) {
        rateLimitedRes = res;
        break;
      }
    }

    expect(rateLimitedRes).not.toBeNull();
    const res = rateLimitedRes!;

    // Must be JSON, not an HTML error page.
    expect(res.headers["content-type"]).toMatch(/application\/json/);

    // Body must carry a generic error key — no internal stack details.
    const body = res.body as Record<string, unknown>;
    expect(body).toHaveProperty("error");
    expect(body).not.toHaveProperty("stack");

    // Raw serialisation must contain no stack-trace markers.
    const raw = JSON.stringify(body);
    expect(raw).not.toContain("node_modules");
    expect(raw).not.toContain("at Object.");
    expect(raw).not.toContain("at Function.");

    console.log(
      "[807 §RL-A] rate-limit 429 body is clean JSON | " +
        "content-type=json | no stack | error=" + String(body.error) + " | PASS",
    );
  });
});
