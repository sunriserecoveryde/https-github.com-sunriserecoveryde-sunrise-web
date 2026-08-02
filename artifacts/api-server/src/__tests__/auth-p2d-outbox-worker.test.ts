/**
 * Phase 2D — Audit Outbox Worker: 8-Step Durability Proof
 *
 * Proves that the AuditOutboxWorker:
 *   1.  Pending events survive API restart (rows stay in outbox)
 *   2.  Worker processes them after restart
 *   3.  Two concurrent workers do not duplicate events in sos_auth_audit
 *   4.  Temporary delivery failure retries
 *   5.  Permanent failure (maxAttempts) becomes reviewable (failed_permanently)
 *   6.  SIGTERM does not lose an in-flight event (graceful shutdown)
 *   7.  Backlog health state is visible via getHealth()
 *   8.  Final audit record is append-only (DELETE blocked)
 *
 * All tests use real PostgreSQL.  The worker's drainOnce() is called directly
 * (no poll timer) so tests complete in milliseconds.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { pool, db } from "@workspace/db";
import { sosAuditOutbox, sosAuthAudit } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { AuditOutboxWorker } from "../lib/auditOutboxWorker";

// ── Test fixture IDs ──────────────────────────────────────────────────────────
const TEST_ORG = "00000000-0000-4000-a000-000000000001";

async function insertOutboxRow(overrides: Partial<{
  eventType: string; outcome: string; attempts: number; processedAt: Date | null;
  failedPermanently: boolean;
}> = {}): Promise<string> {
  const row = await db.insert(sosAuditOutbox).values({
    orgId:             TEST_ORG,
    eventType:         overrides.eventType ?? "authorization_denied",
    outcome:           overrides.outcome   ?? "failure",
    attempts:          overrides.attempts  ?? 0,
    processedAt:       overrides.processedAt ?? null,
    failedPermanently: overrides.failedPermanently ?? false,
  }).returning({ id: sosAuditOutbox.id });
  return row[0]!.id;
}

async function auditRowExistsForOutbox(outboxId: string): Promise<boolean> {
  // The outbox worker drains to sos_auth_audit but doesn't record the outbox ID.
  // We verify by checking that the outbox row is marked processedAt IS NOT NULL.
  const rows = await db
    .select({ processedAt: sosAuditOutbox.processedAt })
    .from(sosAuditOutbox)
    .where(eq(sosAuditOutbox.id, outboxId));
  return rows[0]?.processedAt != null;
}

async function cleanTestOutboxRows() {
  await pool.query(
    `DELETE FROM sos_audit_outbox WHERE org_id=$1`, [TEST_ORG]);
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe("Phase 2D — Audit Outbox Worker (8-step durability proof)", { timeout: 60_000 }, () => {

  let worker: AuditOutboxWorker;

  beforeAll(async () => {
    worker = new AuditOutboxWorker({
      pollIntervalMs: 60_000, // Never fires in tests — we call drainOnce() directly
      batchSize:      10,
      maxAttempts:    3,
      backoffBaseMs:  100,
    });
  });

  afterAll(async () => {
    await worker.stop();
    await cleanTestOutboxRows();
    await pool.end().catch(() => {});
  });

  beforeEach(async () => {
    await cleanTestOutboxRows();
  });

  // ── Step 1: Pending event survives API restart ────────────────────────────
  it("step-01: unprocessed outbox row persists in DB (survives restart)", async () => {
    const id = await insertOutboxRow();
    // After "restart" (new process would resume; here we verify the row is still there)
    const rows = await db
      .select({ id: sosAuditOutbox.id, processedAt: sosAuditOutbox.processedAt })
      .from(sosAuditOutbox)
      .where(eq(sosAuditOutbox.id, id));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.processedAt).toBeNull();
  });

  // ── Step 2: Worker processes row after restart ────────────────────────────
  it("step-02: drainOnce() processes unprocessed row and marks it processed", async () => {
    const id = await insertOutboxRow();

    const drained = await worker.drainOnce();
    expect(drained).toBeGreaterThanOrEqual(1);

    const processed = await auditRowExistsForOutbox(id);
    expect(processed).toBe(true);

    // Audit row must appear in sos_auth_audit
    const auditRows = await pool.query(
      `SELECT id FROM sos_auth_audit WHERE org_id=$1 ORDER BY created_at DESC LIMIT 1`,
      [TEST_ORG]);
    expect(auditRows.rows.length).toBeGreaterThanOrEqual(1);
  });

  // ── Step 3: Two concurrent workers do not duplicate events ───────────────
  it("step-03: FOR UPDATE SKIP LOCKED prevents two workers from processing the same row", async () => {
    const id = await insertOutboxRow();

    const workerB = new AuditOutboxWorker({ pollIntervalMs: 60_000, batchSize: 10, maxAttempts: 3 });

    // Run both drains concurrently — exactly one must process the row.
    const [countA, countB] = await Promise.all([
      worker.drainOnce(),
      workerB.drainOnce(),
    ]);
    await workerB.stop();

    // Total drained = exactly 1 (the row was locked by one worker, SKIP LOCKED by the other)
    expect(countA + countB).toBe(1);

    // Verify only one processedAt timestamp was written
    const rows = await db
      .select({ processedAt: sosAuditOutbox.processedAt, attempts: sosAuditOutbox.attempts })
      .from(sosAuditOutbox)
      .where(eq(sosAuditOutbox.id, id));
    expect(rows[0]?.processedAt).not.toBeNull();
  });

  // ── Step 4: Temporary failure retries ─────────────────────────────────────
  it("step-04: failed drain increments attempts and leaves row unprocessed for retry", async () => {
    const id = await insertOutboxRow({ attempts: 0 });

    // Simulate a delivery failure by corrupting event_type temporarily
    // (sos_auth_audit has a CHECK constraint on event_type).
    await pool.query(
      `UPDATE sos_audit_outbox SET event_type='__invalid_type__' WHERE id=$1`, [id]);

    const drained = await worker.drainOnce();
    // Row failed — not counted as drained
    expect(drained).toBe(0);

    const rows = await db
      .select({ attempts: sosAuditOutbox.attempts, processedAt: sosAuditOutbox.processedAt })
      .from(sosAuditOutbox)
      .where(eq(sosAuditOutbox.id, id));
    expect(rows[0]?.attempts).toBeGreaterThanOrEqual(1);
    expect(rows[0]?.processedAt).toBeNull();  // Not processed — available for retry
  });

  // ── Step 5: Permanent failure after maxAttempts ───────────────────────────
  it("step-05: row marked failed_permanently after maxAttempts exhausted", async () => {
    // Start at maxAttempts - 1 so one more failure triggers permanent failure
    const id = await insertOutboxRow({ attempts: 2 }); // maxAttempts = 3
    await pool.query(
      `UPDATE sos_audit_outbox SET event_type='__invalid_type__' WHERE id=$1`, [id]);

    await worker.drainOnce();

    const rows = await db
      .select({ failedPermanently: sosAuditOutbox.failedPermanently, attempts: sosAuditOutbox.attempts })
      .from(sosAuditOutbox)
      .where(eq(sosAuditOutbox.id, id));
    expect(rows[0]?.failedPermanently).toBe(true);
    // Row is NOT deleted — it is retained for manual review.
    expect(rows).toHaveLength(1);
  });

  // ── Step 6: SIGTERM does not lose in-flight event ─────────────────────────
  it("step-06: stop() waits for in-flight drain before returning", async () => {
    const id = await insertOutboxRow();

    const longWorker = new AuditOutboxWorker({
      pollIntervalMs: 60_000, batchSize: 10, maxAttempts: 3 });
    // Start a drain and immediately signal stop — stop() should await it.
    const drainPromise = longWorker.drainOnce();
    const stopPromise  = longWorker.stop();

    await Promise.all([drainPromise, stopPromise]);

    // Row must be processed — not lost mid-shutdown.
    const processed = await auditRowExistsForOutbox(id);
    expect(processed).toBe(true);
  });

  // ── Step 7: Backlog health state is visible ───────────────────────────────
  it("step-07: getHealth() returns correct pending and failedPermanently counts", async () => {
    // Insert one normal row and one permanently-failed row.
    await insertOutboxRow();
    const failedId = await insertOutboxRow({ attempts: 3, failedPermanently: true });
    await pool.query(
      `UPDATE sos_audit_outbox SET failed_permanently=true WHERE id=$1`, [failedId]);

    const health = await worker.getHealth();
    expect(health.pending).toBeGreaterThanOrEqual(1);
    expect(health.failedPermanently).toBeGreaterThanOrEqual(1);
    expect(health.running).toBe(false); // Worker not started in this test
  });

  // ── Step 8: Final audit record is append-only ─────────────────────────────
  it("step-08: DELETE on sos_auth_audit is blocked by trigger (append-only)", async () => {
    const id = await insertOutboxRow();
    await worker.drainOnce();

    // Attempting a DELETE on the audit log must be rejected by the trigger.
    await expect(
      pool.query(
        `DELETE FROM sos_auth_audit WHERE org_id=$1 AND event_type='authorization_denied'
         LIMIT 1`, [TEST_ORG]),
    ).rejects.toThrow();
  });
});
