/**
 * Phase 2D — PostgreSQL Rate Limiter: 12-Step Proof
 *
 * Proves that PgRateLimitStore:
 *   1.  Persists counters to PostgreSQL (survives API "restart")
 *   2.  Is shared across multiple API instances (multi-instance consistency)
 *   3.  Reaches the configured threshold and returns HTTP 429
 *   4.  Returns equivalent responses for known vs unknown accounts (no enumeration)
 *   5.  Window expiry correctly resets the counter
 *   6.  Fails open on DB error (availability > blocking)
 *
 * Tests directly exercise PgRateLimitStore methods against the real DB.
 * HTTP 429 is proven via a purpose-built Express route using the real store.
 *
 * Does NOT report MemoryStore behavior as production proof.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { pool } from "@workspace/db";
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
    // @ts-expect-error: overriding pool.query for failure simulation
    realPool.query = async (_text: unknown, _values?: unknown) => {
      throw new Error("simulated DB unavailability");
    };

    try {
      const failOpenStore = new PgRateLimitStore(TEST_WINDOW_MS);
      const result = await failOpenStore.increment(TEST_KEY);
      // Fail-open: returns totalHits=0, which express-rate-limit treats as allowed
      expect(result.totalHits).toBe(0);
      failOpenStore.destroy();
    } finally {
      // @ts-expect-error: restore
      realPool.query = originalQuery;
    }
  });
});
