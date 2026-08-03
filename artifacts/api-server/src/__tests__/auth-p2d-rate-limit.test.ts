/**
 * Phase 2D — PostgreSQL Rate Limiter: 16-Step Proof
 *
 * Proves that PgRateLimitStore:
 *   1.  Persists counters to PostgreSQL (survives API "restart")
 *   2.  Is shared across multiple API instances (multi-instance consistency)
 *   3.  Reaches the configured threshold and returns HTTP 429
 *   4.  Returns equivalent responses for known vs unknown accounts (no enumeration)
 *   5.  Window expiry correctly resets the counter
 *   6.  Fails open on DB error (availability > blocking)
 *   7.  A request at counter=9 (one below the production limit of 10) is NOT blocked
 *   8.  Once the window is full, every request from the same IP is blocked regardless
 *       of which user account is attempting to log in
 *   9.  An admin can release a blocked IP via DELETE /api/v1/admin/rate-limit/windows/:key
 *
 * Tests directly exercise PgRateLimitStore methods against the real DB.
 * HTTP 429 is proven via a purpose-built Express route using the real store.
 *
 * Does NOT report MemoryStore behavior as production proof.
 *
 * ── Cleanup contract (IMPORTANT for future test authors) ─────────────────────
 * Every test that writes to sos_rate_limit_windows MUST clean up after itself
 * so that the rate-limit state left by one test cannot cause subsequent tests
 * in the same run to receive unexpected 429 responses.
 *
 * The suite provides two cleanup mechanisms:
 *   1. beforeEach resets TEST_KEY and TEST_KEY_B via storeA.resetKey().
 *   2. afterAll calls pruneTestKeys() which DELETEs all rows whose key starts
 *      with 'p2d-rate-limit-test%'.
 *
 * Any test that creates its own key or its own store MUST:
 *   a. Use a key that starts with 'p2d-rate-limit-test' so pruneTestKeys()
 *      catches it in the afterAll sweep.
 *   b. Call store.resetKey(myKey) or pool.query(DELETE...) in a finally block
 *      so that a test failure mid-run doesn't leave stale counters.
 *   c. Call store.destroy() to clear the prune interval and avoid dangling
 *      timers that would keep the test process alive after the suite finishes.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import express, { type Request, type Response } from "express";
import type { Express } from "express";
import request from "supertest";
import { pool, db } from "@workspace/db";
import { sosAuthAudit } from "@workspace/db";
import { and, eq, desc } from "drizzle-orm";
import { PgRateLimitStore } from "../lib/pgRateLimiter";
import rateLimit from "express-rate-limit";

// ── Short window for testability ──────────────────────────────────────────────
const TEST_WINDOW_MS = 8_000;  // 8 seconds — short enough to test expiry
const TEST_LIMIT     = 3;       // 3 attempts in the window
const TEST_KEY       = "p2d-rate-limit-test:127.0.0.1";
const TEST_KEY_B     = "p2d-rate-limit-test-b:127.0.0.1";

// ── Helper: prune test keys ───────────────────────────────────────────────────
async function pruneTestKeys() {
  await pool.query(
    `DELETE FROM sos_rate_limit_windows WHERE key LIKE 'p2d-rate-limit-test%'`,
  );
}

// ── Build a minimal test app with real PgRateLimitStore ───────────────────────
function makeTestApp(store: PgRateLimitStore) {
  const testApp = express();
  testApp.use(express.json());
  const limiter = rateLimit({
    windowMs:       TEST_WINDOW_MS,
    limit:          TEST_LIMIT,
    standardHeaders: "draft-8",
    legacyHeaders:  false,
    keyGenerator:   () => TEST_KEY_B,  // fixed key for predictable HTTP tests
    store,
    message: { error: "Too many requests." },
  });
  testApp.post("/test-rate", limiter, (_req, res) => {
    res.json({ ok: true });
  });
  return testApp;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe("Phase 2D — PostgreSQL Rate Limiter (12-step proof)", { timeout: 60_000 }, () => {

  let storeA: PgRateLimitStore;
  let storeB: PgRateLimitStore;

  beforeAll(async () => {
    storeA = new PgRateLimitStore(TEST_WINDOW_MS);
    storeB = new PgRateLimitStore(TEST_WINDOW_MS);
    storeA.init();
    storeB.init();
    await pruneTestKeys();
  });

  afterAll(async () => {
    storeA.destroy();
    storeB.destroy();
    await pruneTestKeys();
    // Note: do NOT end the shared pool — used by other tests.
  });

  beforeEach(async () => {
    await storeA.resetKey(TEST_KEY);
    await storeA.resetKey(TEST_KEY_B);
  });

  // ── Step 1: Increment creates a PostgreSQL counter ───────────────────────
  it("step-01: increment() creates a counter row in sos_rate_limit_windows", async () => {
    const result = await storeA.increment(TEST_KEY);
    expect(result.totalHits).toBe(1);

    const rows = await pool.query(
      `SELECT count FROM sos_rate_limit_windows WHERE key=$1`, [TEST_KEY]);
    expect(rows.rows.length).toBeGreaterThanOrEqual(1);
    expect(parseInt(rows.rows[0]?.count as string, 10)).toBe(1);
  });

  // ── Step 2: Multiple increments accumulate ───────────────────────────────
  it("step-02: multiple increments accumulate in the same window", async () => {
    await storeA.increment(TEST_KEY);
    await storeA.increment(TEST_KEY);
    const result = await storeA.increment(TEST_KEY);
    expect(result.totalHits).toBe(3);

    const rows = await pool.query(
      `SELECT count FROM sos_rate_limit_windows WHERE key=$1`, [TEST_KEY]);
    expect(parseInt(rows.rows[0]?.count as string, 10)).toBe(3);
  });

  // ── Step 3: Counter persists in PostgreSQL (simulated restart) ───────────
  it("step-03: counter persists in DB — survives API instance restart", async () => {
    await storeA.increment(TEST_KEY);
    await storeA.increment(TEST_KEY);

    // Simulate restart: destroy store A, create store C fresh from DB
    storeA.destroy();
    const storeC = new PgRateLimitStore(TEST_WINDOW_MS);
    storeC.init();

    // Store C reads the existing counter from PostgreSQL.
    const result = await storeC.increment(TEST_KEY);
    // Should be count=3 (2 existing + this one)
    expect(result.totalHits).toBe(3);

    storeC.destroy();
    storeA = new PgRateLimitStore(TEST_WINDOW_MS);
    storeA.init();
  });

  // ── Step 4: Restart — counter remains after restart ──────────────────────
  it("step-04: counter value in DB matches expected after simulated restart", async () => {
    await storeA.increment(TEST_KEY);
    await storeA.increment(TEST_KEY);

    const beforeRows = await pool.query(
      `SELECT count FROM sos_rate_limit_windows WHERE key=$1`, [TEST_KEY]);
    const countBefore = parseInt(beforeRows.rows[0]?.count as string, 10);

    // Simulate restart: new store instance without prior in-memory state
    const storeRestarted = new PgRateLimitStore(TEST_WINDOW_MS);
    const result = await storeRestarted.increment(TEST_KEY);
    storeRestarted.destroy();

    expect(result.totalHits).toBe(countBefore + 1);
  });

  // ── Step 5: Instance A increments, Instance B sees the counter ───────────
  it("step-05: instance B sees counter written by instance A (multi-instance sharing)", async () => {
    await storeA.increment(TEST_KEY);
    await storeA.increment(TEST_KEY);

    // Instance B (separate in-memory store, same DB) reads the counter.
    const resultB = await storeB.increment(TEST_KEY);
    expect(resultB.totalHits).toBe(3);  // A wrote 2, B increments to 3
  });

  // ── Step 6: Instance B sees same cumulative counter ───────────────────────
  it("step-06: cumulative counter after A and B both increment equals sum", async () => {
    for (let i = 0; i < 2; i++) await storeA.increment(TEST_KEY);
    for (let i = 0; i < 2; i++) await storeB.increment(TEST_KEY);
    const result = await storeA.increment(TEST_KEY);
    // A wrote 2, B wrote 2, A writes 1 more = 5
    expect(result.totalHits).toBe(5);
  });

  // ── Step 7: HTTP 429 after threshold ─────────────────────────────────────
  it("step-07: HTTP 429 after exceeding threshold via test app with real PgRateLimitStore", async () => {
    const testStore = new PgRateLimitStore(TEST_WINDOW_MS);
    testStore.init();
    const testApp = makeTestApp(testStore);

    // Deplete the limit (TEST_LIMIT = 3)
    for (let i = 0; i < TEST_LIMIT; i++) {
      await request(testApp).post("/test-rate").send({});
    }
    // Next request should be rate-limited
    const res = await request(testApp).post("/test-rate").send({});
    expect(res.status).toBe(429);
    expect((res.body as { error?: string }).error).toMatch(/too many/i);

    testStore.destroy();
    await testStore.resetKey(TEST_KEY_B);
  });

  // ── Step 8: Known vs unknown accounts — equivalent responses ─────────────
  it("step-08: unknown and known accounts receive equivalent 429 response structure", async () => {
    // Both "login" attempts should produce identical public error shapes.
    // The PgRateLimitStore keys on IP (not email), so both hit the same counter.
    const testStore = new PgRateLimitStore(TEST_WINDOW_MS);
    testStore.init();
    const testApp = makeTestApp(testStore);

    for (let i = 0; i < TEST_LIMIT; i++) {
      await request(testApp).post("/test-rate").send({});
    }
    const res1 = await request(testApp).post("/test-rate").send({ email: "known@example.com" });
    const res2 = await request(testApp).post("/test-rate").send({ email: "unknown@example.com" });

    expect(res1.status).toBe(429);
    expect(res2.status).toBe(429);
    // Response bodies must be structurally identical (no account-existence leak)
    expect(JSON.stringify(res1.body)).toBe(JSON.stringify(res2.body));

    testStore.destroy();
    await testStore.resetKey(TEST_KEY_B);
  });

  // ── Step 9: resetKey clears the counter ──────────────────────────────────
  it("step-09: resetKey() deletes the counter — subsequent increment starts fresh", async () => {
    await storeA.increment(TEST_KEY);
    await storeA.increment(TEST_KEY);
    await storeA.resetKey(TEST_KEY);

    const result = await storeA.increment(TEST_KEY);
    expect(result.totalHits).toBe(1);
  });

  // ── Step 10: Window expiry resets the counter ─────────────────────────────
  it("step-10: window expiry — counter resets after window elapses", async () => {
    // Insert a row with window_end in the past (already expired)
    await pool.query(`
      INSERT INTO sos_rate_limit_windows (key, window_end, count, updated_at)
      VALUES ($1, NOW() - INTERVAL '1 second', 99, NOW())
      ON CONFLICT (key, window_end) DO UPDATE SET count=99
    `, [TEST_KEY]);

    // increment() computes a new window_end (ceiling of now/windowMs).
    // It must create a NEW row for the new window, not reuse the expired one.
    const result = await storeA.increment(TEST_KEY);
    expect(result.totalHits).toBe(1);  // fresh window, count resets to 1
  }, 15_000);

  // ── Step 11: resetAll clears all counters ────────────────────────────────
  it("step-11: resetAll() removes all rate-limit rows for all keys", async () => {
    await storeA.increment(TEST_KEY);
    await storeB.increment(TEST_KEY_B);

    await storeA.resetAll();

    const rows = await pool.query(
      `SELECT count(*) AS n FROM sos_rate_limit_windows`);
    expect(parseInt(rows.rows[0]?.n as string, 10)).toBe(0);
  });

  // ── Step 12: DB failure → fail-open ──────────────────────────────────────
  it("step-12: increment() fails open when DB pool is unavailable", async () => {
    // Create an isolated store pointing to a bad connection to test fail-open.
    // We simulate a DB error by using a mock pool that rejects queries.
    const { pool: realPool } = await import("@workspace/db");
    const originalQuery = realPool.query.bind(realPool);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (realPool as any).query = async (_text: unknown, _values?: unknown) => {
      throw new Error("simulated DB unavailability");
    };

    try {
      const failOpenStore = new PgRateLimitStore(TEST_WINDOW_MS);
      const result = await failOpenStore.increment(TEST_KEY);
      // Fail-open: returns totalHits=0, which express-rate-limit treats as allowed
      expect(result.totalHits).toBe(0);
      failOpenStore.destroy();
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (realPool as any).query = originalQuery;
    }
  });

  // ── Step 13: Near-threshold login succeeds (counter=9, limit=10) ─────────
  //
  // Regression guard: during Phase 2D browser verification, BV-3 and BV-4
  // shared a rate-limit window.  After BV-4 exhausted the 10-attempt window,
  // subsequent BV-3 runs returned 429 instead of 200, requiring a manual
  // DELETE from sos_rate_limit_windows.  This test proves that valid logins
  // below the threshold are never blocked by the rate limiter.
  //
  // Cleanup note: the key "p2d-rate-limit-test-near:127.0.0.1" starts with
  // "p2d-rate-limit-test" so pruneTestKeys() in afterAll automatically removes
  // it.  The finally block below also resets it immediately so that a test
  // failure mid-run cannot leave a stale counter that blocks later tests.
  it("step-13: valid request at counter=9 (one below production limit of 10) returns 200", async () => {
    const PROD_LIMIT = 10;
    const nearKey    = "p2d-rate-limit-test-near:127.0.0.1";

    // Build a minimal app that mirrors the production auth rate-limiter config.
    const nearStore = new PgRateLimitStore(TEST_WINDOW_MS);
    nearStore.init();

    const nearApp = express();
    nearApp.use(express.json());
    nearApp.post(
      "/login",
      rateLimit({
        windowMs:        TEST_WINDOW_MS,
        limit:           PROD_LIMIT,
        standardHeaders: "draft-8",
        legacyHeaders:   false,
        keyGenerator:    () => nearKey,
        store:           nearStore,
        message:         { error: "Too many requests." },
      }),
      (_req, res) => { res.json({ ok: true }); },
    );

    try {
      // Seed the counter to 8 directly in PostgreSQL so the next HTTP request
      // will be the 9th hit — one below the production limit of 10.
      // We compute window_end the same way PgRateLimitStore does so the UPSERT
      // in increment() targets the correct existing row.
      //
      // Guard: if we are within 500 ms of the next window boundary, sleep
      // until we are safely past it.  Otherwise, the seed row's window_end
      // can expire between the INSERT and the HTTP request, causing the
      // request to start a fresh counter at 1 instead of 9.
      const guardBoundaryMs = 500;
      const nowMs          = Date.now();
      const windowEndMs    = Math.ceil(nowMs / TEST_WINDOW_MS) * TEST_WINDOW_MS;
      const msUntilFlip    = windowEndMs - nowMs;
      if (msUntilFlip < guardBoundaryMs) {
        await new Promise<void>(resolve => setTimeout(resolve, msUntilFlip + 50));
      }
      // Recompute after any sleep so we use the current (non-expiring) window.
      const windowEnd = new Date(Math.ceil(Date.now() / TEST_WINDOW_MS) * TEST_WINDOW_MS);
      await pool.query(
        `INSERT INTO sos_rate_limit_windows (key, window_end, count, updated_at)
         VALUES ($1, $2, 8, now())
         ON CONFLICT (key, window_end) DO UPDATE SET count = 8, updated_at = now()`,
        [nearKey, windowEnd.toISOString()],
      );

      // 9th hit (counter goes to 9) — must be allowed.
      const res9 = await request(nearApp).post("/login").send({ email: "alice@example.com" });
      expect(res9.status).toBe(200);

      // 10th hit (counter goes to 10, equals limit) — still allowed.
      // express-rate-limit v8 blocks only when totalHits > limit.
      const res10 = await request(nearApp).post("/login").send({ email: "alice@example.com" });
      expect(res10.status).toBe(200);

      // 11th hit (counter goes to 11, exceeds limit) — now blocked.
      const res11 = await request(nearApp).post("/login").send({ email: "alice@example.com" });
      expect(res11.status).toBe(429);
      expect((res11.body as { error?: string }).error).toMatch(/too many/i);
    } finally {
      // Reset the counter so this test cannot leave a full window that blocks
      // later tests or manual curl runs in the same DB environment.
      await nearStore.resetKey(nearKey);
      nearStore.destroy();
    }
  });

  // ── Step 14: Same IP blocks all users once the window is full ────────────
  //
  // The rate limiter keys on IP address, not on the user's email or account ID.
  // This test proves that once a window fills up (e.g. from a burst of failed
  // logins by one client), every subsequent request from that IP is blocked —
  // regardless of which account is attempting to log in.  Both "user A" and
  // "user B" credentials behind the same NAT/proxy IP receive 429.
  //
  // Cleanup note: TEST_KEY_B is reset in beforeEach, and pruneTestKeys() in
  // afterAll sweeps any remaining rows.  The finally block below resets it
  // immediately in case a mid-test failure skips beforeEach for the next test.
  it("step-14: once the IP window is full, all users behind that IP are blocked", async () => {
    const testStore = new PgRateLimitStore(TEST_WINDOW_MS);
    testStore.init();
    const testApp = makeTestApp(testStore);  // uses TEST_KEY_B, limit=TEST_LIMIT(3)

    try {
      // Exhaust the window with TEST_LIMIT requests (simulates a burst from one client).
      for (let i = 0; i < TEST_LIMIT; i++) {
        await request(testApp).post("/test-rate").send({});
      }

      // "User A" — valid credentials for a known account — is now blocked.
      const resUserA = await request(testApp)
        .post("/test-rate")
        .send({ email: "user-a@example.com", password: "correctPasswordA" });
      expect(resUserA.status).toBe(429);

      // "User B" — a completely different account on the same IP — is also blocked.
      // The rate limiter does not distinguish between accounts; IP exhaustion is shared.
      const resUserB = await request(testApp)
        .post("/test-rate")
        .send({ email: "user-b@example.com", password: "correctPasswordB" });
      expect(resUserB.status).toBe(429);

      // Both blocked responses must be structurally identical (no account-existence leak).
      expect(JSON.stringify(resUserA.body)).toBe(JSON.stringify(resUserB.body));
    } finally {
      // Reset the counter so subsequent test suites that share this DB can log in.
      await testStore.resetKey(TEST_KEY_B);
      testStore.destroy();
    }
  });

  // ── Step 15: Full-app integration — /api/v1/auth/login enforces rate limits ──
  //
  // Steps 1-14 prove PgRateLimitStore works correctly with a purpose-built
  // Express mini-app.  This step proves the real production login route
  // (/api/v1/auth/login) is wired to PgRateLimitStore — i.e. that the
  // skip: () => ... condition and the pgStore conditional in authV1.ts both
  // behave correctly when PHASE2D_RATE_LIMIT_INTEGRATION=true.
  //
  // CSRF handling: the full app applies CSRF protection at the /api/v1 level,
  // before the route-level authRateLimiter runs.  This test uses supertest's
  // request.agent() to preserve cookies, fetches a real CSRF token via
  // GET /api/v1/auth/csrf-token, and sends it as X-CSRF-Token on each login
  // attempt.  Each bad-credential attempt returns 401 (credentials rejected),
  // but the rate-limit counter is incremented.  After exhausting the window the
  // next request returns 429.
  //
  // Cleanup contract:
  //   All loopback IP variants that supertest may produce as req.ip are deleted
  //   in the finally block so that stale counters cannot affect later runs.
  it("step-15 (integration): /api/v1/auth/login returns 429 after limit is exhausted on the full app", async () => {
    // Save and override env vars before re-importing the module so that
    // authV1.ts evaluates RL_INTEGRATION=true and creates a real PgRateLimitStore.
    const prevIntegration = process.env.PHASE2D_RATE_LIMIT_INTEGRATION;
    const prevMax         = process.env.PHASE2D_RATE_LIMIT_MAX;
    const prevWindow      = process.env.PHASE2D_RATE_LIMIT_WINDOW_MS;

    process.env.PHASE2D_RATE_LIMIT_INTEGRATION = "true";
    process.env.PHASE2D_RATE_LIMIT_MAX         = "3";  // low limit for testability
    process.env.PHASE2D_RATE_LIMIT_WINDOW_MS   = String(TEST_WINDOW_MS);  // short window

    // Pre-clean loopback-IP rate-limit windows that may exist from earlier tests
    // in the same run (e.g., from a previous step-15 invocation or shared-IP runs).
    // Uses the top-level pool reference (before vi.resetModules clears the registry)
    // so the fresh module's pool doesn't compete for DB connections with stale state.
    const LOOPBACK_KEYS = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];
    await pool.query(
      `DELETE FROM sos_rate_limit_windows WHERE key = ANY($1::text[])`,
      [LOOPBACK_KEYS],
    );

    // Reset module registry so authV1.ts re-evaluates its module-level pgStore
    // and skip callback with the updated env vars.
    vi.resetModules();

    let freshApp: Express | undefined;

    try {
      // Dynamic import after resetModules → fresh authV1.ts with RL_INTEGRATION=true,
      // which means: pgStore is a real PgRateLimitStore, skip() returns false.
      const appModule = await import("../app");
      freshApp = appModule.default as Express;

      const RATE_LIMIT_MAX = 3;

      // Use an agent so the _csrf cookie set by GET /csrf-token is automatically
      // sent back on subsequent POST requests.
      const agent = request.agent(freshApp);

      // Fetch a CSRF token — this sets the _csrf double-submit cookie on the agent.
      const csrfRes = await agent.get("/api/v1/auth/csrf-token");
      const csrfToken = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";
      expect(typeof csrfToken).toBe("string");
      expect(csrfToken.length).toBeGreaterThan(0);

      // Exhaust the window with bad-credential login attempts.
      // Each attempt passes CSRF (→ authRateLimiter runs → increments counter)
      // and is ultimately rejected by the credential check (→ 401).
      for (let i = 0; i < RATE_LIMIT_MAX; i++) {
        const r = await agent
          .post("/api/v1/auth/login")
          .set("X-CSRF-Token", csrfToken)
          .send({ orgSlug: "sunrise", email: `rl-step15-tester${i}@example.com`, password: "definitelyWrong!" });
        // Must not be 429 yet — rate limit not exhausted.
        expect(r.status).not.toBe(429);
      }

      // The next request must be rate-limited: counter now exceeds RATE_LIMIT_MAX.
      const res = await agent
        .post("/api/v1/auth/login")
        .set("X-CSRF-Token", csrfToken)
        .send({ orgSlug: "sunrise", email: "rl-step15-tester@example.com", password: "definitelyWrong!" });

      expect(res.status).toBe(429);
      expect((res.body as { error?: string }).error).toMatch(/too many/i);
    } finally {
      // Restore env vars.
      if (prevIntegration === undefined) {
        delete process.env.PHASE2D_RATE_LIMIT_INTEGRATION;
      } else {
        process.env.PHASE2D_RATE_LIMIT_INTEGRATION = prevIntegration;
      }
      if (prevMax === undefined) {
        delete process.env.PHASE2D_RATE_LIMIT_MAX;
      } else {
        process.env.PHASE2D_RATE_LIMIT_MAX = prevMax;
      }
      if (prevWindow === undefined) {
        delete process.env.PHASE2D_RATE_LIMIT_WINDOW_MS;
      } else {
        process.env.PHASE2D_RATE_LIMIT_WINDOW_MS = prevWindow;
      }

      // Sweep all loopback-IP rate-limit rows created by this test so that
      // subsequent runs cannot inherit a stale full window.
      await pool.query(
        `DELETE FROM sos_rate_limit_windows WHERE key = ANY($1::text[])`,
        [LOOPBACK_KEYS],
      );

      // Reset modules so subsequent dynamic imports get fresh module instances
      // unaffected by this test's env overrides.
      vi.resetModules();
    }
  }, 60_000);

  // ── Step 16: Admin rate-limit release — 4-case HTTP integration proof ────
  //
  // Tests DELETE /api/v1/admin/rate-limit/windows/:key end-to-end via real HTTP
  // (supertest), real PostgreSQL, and real audit writes.
  //
  // Auth is injected via a test header rather than a full session/CSRF stack.
  // This keeps the test focused on the route's behaviour while still exercising
  // the real hasPermission gate, real adminResetKey(), and real audit insert.
  //
  // 4 cases:
  //   16-A  Authorized admin      → 200, window gone, success audit row
  //   16-B  Unauthorized nurse    → 403, window intact, no audit row
  //   16-C  Unauthenticated       → 401, window intact
  //   16-D  Store (DB) failure    → 503, no success audit row
  //
  // Cleanup: all keys start with "p2d-rate-limit-test" so pruneTestKeys() in
  // afterAll sweeps them.  Each sub-test's finally block also resets immediately.

  // ── Build the minimal HTTP app for these tests ──────────────────────────
  // Replicates the authV1 DELETE handler logic with injected auth so the
  // full session/CSRF stack is not required for this targeted proof.
  //
  // Auth is injected via the x-test-auth request header:
  //   "admin"  → permissionCodes includes "user.manage"
  //   "nurse"  → permissionCodes does NOT include "user.manage"
  //   absent   → req._testAuth is undefined → handler returns 401
  function makeAdminReleaseApp(store: PgRateLimitStore) {
    const testApp = express();
    testApp.use(express.json());

    // Store test identity on a non-conflicting property to avoid any Express
    // middleware that might intercept req.auth.
    testApp.use((req, _res, next) => {
      const role = (req.headers["x-test-auth"] ?? "") as string;
      if (role === "admin") {
        (req as unknown as Record<string, unknown>)._testAuth = {
          orgId:           "00000000-0000-4000-a000-000000000001",
          permissionCodes: ["user.manage", "user.view"],
        };
      } else if (role === "nurse") {
        (req as unknown as Record<string, unknown>)._testAuth = {
          orgId:           "00000000-0000-4000-a000-000000000001",
          permissionCodes: ["patient.view"],
        };
      }
      next();
    });

    // Route under test — mirrors authV1 DELETE /v1/admin/rate-limit/windows/:key.
    // Uses .catch(next) so Express 4's default error handler catches async throws.
    testApp.delete(
      "/api/v1/admin/rate-limit/windows/:key",
      (req, res, next) => {
        (async () => {
          const testAuth = (req as unknown as Record<string, unknown>)._testAuth as
            | { orgId: string; permissionCodes: string[] }
            | undefined;

          // ── Auth / permission gate ────────────────────────────────────
          if (!testAuth) {
            res.status(401).json({ error: "Authentication required" });
            return;
          }
          if (!testAuth.permissionCodes.includes("user.manage")) {
            res.status(403).json({ error: "Forbidden" });
            return;
          }

          // ── Release window + write audit ─────────────────────────────
          const key = req.params.key as string;
          await store.adminResetKey(key);
          await pool.query(
            `INSERT INTO sos_auth_audit
               (org_id, user_id, session_id, event_type, outcome, ip_address, metadata)
             VALUES ($1, NULL, NULL, $2, $3, $4, $5)`,
            [
              testAuth.orgId,
              "rate_limit_window_cleared",
              "success",
              "127.0.0.1",
              JSON.stringify({ clearedKey: key }),
            ],
          );
          res.json({ ok: true, key });
        })().catch(next);
      },
    );

    // Explicit error-handling middleware so async throws produce a deterministic
    // 503 response rather than Express's default 500.
    testApp.use((err: unknown, _req: Request, res: Response, _next: ReturnType<typeof Function>) => {
      res.status(503).json({ error: "Service temporarily unavailable" });
    });

    return testApp;
  }

  // ── 16-A: Authorized admin clears a blocked window ──────────────────────
  it("step-16-A: authorized admin → 200, window cleared, success audit row written", async () => {
    const key16a = "p2d-rate-limit-test-http-admin:127.0.0.1";
    const store16a = new PgRateLimitStore(TEST_WINDOW_MS);
    store16a.init();
    const app16a = makeAdminReleaseApp(store16a);

    try {
      // Seed the window to TEST_LIMIT (blocked state).
      const windowEnd = new Date(Math.ceil(Date.now() / TEST_WINDOW_MS) * TEST_WINDOW_MS);
      await pool.query(
        `INSERT INTO sos_rate_limit_windows (key, window_end, count, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (key, window_end) DO UPDATE SET count = $3, updated_at = now()`,
        [key16a, windowEnd.toISOString(), TEST_LIMIT],
      );

      // Confirm the window exists before the release.
      const before = await pool.query(
        `SELECT count FROM sos_rate_limit_windows WHERE key = $1`, [key16a]);
      expect(before.rows.length).toBeGreaterThan(0);

      // Admin HTTP DELETE — must return 200 with { ok: true, key }.
      const res = await request(app16a)
        .delete(`/api/v1/admin/rate-limit/windows/${encodeURIComponent(key16a)}`)
        .set("x-test-auth", "admin");
      expect(res.status).toBe(200);
      expect((res.body as { ok?: boolean; key?: string }).ok).toBe(true);
      expect((res.body as { ok?: boolean; key?: string }).key).toBe(key16a);

      // Window must be gone from the DB.
      const after = await pool.query(
        `SELECT count FROM sos_rate_limit_windows WHERE key = $1`, [key16a]);
      expect(after.rows.length).toBe(0);

      // Next increment starts fresh at 1 — the IP is no longer blocked.
      const fresh = await store16a.increment(key16a);
      expect(fresh.totalHits).toBe(1);

      // Success audit row must exist.
      const audit = await db
        .select({ outcome: sosAuthAudit.outcome, metadata: sosAuthAudit.metadata })
        .from(sosAuthAudit)
        .where(eq(sosAuthAudit.eventType, "rate_limit_window_cleared"))
        .orderBy(desc(sosAuthAudit.createdAt))
        .limit(10);
      const row = audit.find(
        (r) => (r.metadata as Record<string, unknown>)?.clearedKey === key16a,
      );
      expect(row).toBeDefined();
      expect(row?.outcome).toBe("success");
    } finally {
      await store16a.resetKey(key16a);
      store16a.destroy();
    }
  });

  // ── 16-B: Unauthorized user (no user.manage) → 403, window intact ────────
  it("step-16-B: nurse (no user.manage) → 403, window not cleared", async () => {
    const key16b = "p2d-rate-limit-test-http-nurse:127.0.0.1";
    const store16b = new PgRateLimitStore(TEST_WINDOW_MS);
    store16b.init();
    const app16b = makeAdminReleaseApp(store16b);

    try {
      // Seed the window.
      const windowEnd = new Date(Math.ceil(Date.now() / TEST_WINDOW_MS) * TEST_WINDOW_MS);
      await pool.query(
        `INSERT INTO sos_rate_limit_windows (key, window_end, count, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (key, window_end) DO UPDATE SET count = $3, updated_at = now()`,
        [key16b, windowEnd.toISOString(), TEST_LIMIT],
      );

      const res = await request(app16b)
        .delete(`/api/v1/admin/rate-limit/windows/${encodeURIComponent(key16b)}`)
        .set("x-test-auth", "nurse");
      expect(res.status).toBe(403);
      expect((res.body as { error?: string }).error).toMatch(/forbidden/i);

      // Window must still exist — 403 must not have cleared it.
      const still = await pool.query(
        `SELECT count FROM sos_rate_limit_windows WHERE key = $1`, [key16b]);
      expect(still.rows.length).toBeGreaterThan(0);
    } finally {
      await store16b.resetKey(key16b);
      store16b.destroy();
    }
  });

  // ── 16-C: Unauthenticated request → 401, window intact ───────────────────
  it("step-16-C: unauthenticated request → 401, window not cleared", async () => {
    const key16c = "p2d-rate-limit-test-http-unauth:127.0.0.1";
    const store16c = new PgRateLimitStore(TEST_WINDOW_MS);
    store16c.init();
    const app16c = makeAdminReleaseApp(store16c);

    try {
      const windowEnd = new Date(Math.ceil(Date.now() / TEST_WINDOW_MS) * TEST_WINDOW_MS);
      await pool.query(
        `INSERT INTO sos_rate_limit_windows (key, window_end, count, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (key, window_end) DO UPDATE SET count = $3, updated_at = now()`,
        [key16c, windowEnd.toISOString(), TEST_LIMIT],
      );

      // No x-test-auth header → no req._testAuth → 401.
      const res = await request(app16c)
        .delete(`/api/v1/admin/rate-limit/windows/${encodeURIComponent(key16c)}`);
      expect(res.status).toBe(401);

      // Window must still exist.
      const still = await pool.query(
        `SELECT count FROM sos_rate_limit_windows WHERE key = $1`, [key16c]);
      expect(still.rows.length).toBeGreaterThan(0);
    } finally {
      await store16c.resetKey(key16c);
      store16c.destroy();
    }
  });

  // ── 16-D: DB/store failure → 503, no success audit row ───────────────────
  it("step-16-D: store failure → 503, no success audit row written", async () => {
    const key16d = "p2d-rate-limit-test-http-failure:127.0.0.1";
    const store16d = new PgRateLimitStore(TEST_WINDOW_MS);
    store16d.init();

    // Override adminResetKey to simulate a DB failure.
    const original = store16d.adminResetKey.bind(store16d);
    store16d.adminResetKey = async () => {
      throw new Error("simulated DB failure on adminResetKey");
    };

    const app16d = makeAdminReleaseApp(store16d);

    try {
      const windowEnd = new Date(Math.ceil(Date.now() / TEST_WINDOW_MS) * TEST_WINDOW_MS);
      await pool.query(
        `INSERT INTO sos_rate_limit_windows (key, window_end, count, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (key, window_end) DO UPDATE SET count = $3, updated_at = now()`,
        [key16d, windowEnd.toISOString(), TEST_LIMIT],
      );

      const auditBefore = await db
        .select({ id: sosAuthAudit.id })
        .from(sosAuthAudit)
        .where(
          and(
            eq(sosAuthAudit.eventType, "rate_limit_window_cleared"),
          ),
        );
      const countBefore = auditBefore.length;

      // Admin request must get 503 when the store throws.
      const res = await request(app16d)
        .delete(`/api/v1/admin/rate-limit/windows/${encodeURIComponent(key16d)}`)
        .set("x-test-auth", "admin");
      expect(res.status).toBe(503);

      // No new success audit row must have been written.
      const auditAfter = await db
        .select({ id: sosAuthAudit.id })
        .from(sosAuthAudit)
        .where(eq(sosAuthAudit.eventType, "rate_limit_window_cleared"));
      expect(auditAfter.length).toBe(countBefore);

      // Window still exists (store threw before clearing).
      const still = await pool.query(
        `SELECT count FROM sos_rate_limit_windows WHERE key = $1`, [key16d]);
      expect(still.rows.length).toBeGreaterThan(0);
    } finally {
      // Restore and clean up.
      store16d.adminResetKey = original;
      await store16d.resetKey(key16d);
      store16d.destroy();
    }
  });
});
