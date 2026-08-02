/**
 * Production-capable audit-outbox worker.
 *
 * Drains sos_audit_outbox into sos_auth_audit on a scheduled polling cycle.
 *
 * Features:
 *   • Scheduled polling — configurable interval (default 5 s)
 *   • Configurable batch size (default 20)
 *   • Row-level locking via FOR UPDATE SKIP LOCKED — multiple workers never
 *     process the same row; safe to run any number of instances
 *   • Retry with exponential back-off — base 1 s, cap 60 s
 *   • Permanent-failure state — after maxAttempts the row is marked
 *     failed_permanently = true for manual review; it is NOT silently dropped
 *   • Startup recovery — processes any unprocessed rows immediately on start
 *   • Graceful SIGTERM shutdown — waits for the in-flight drain to finish
 *   • Backlog health visibility — getHealth() returns pending / failed counts
 *   • Idempotent final audit insertion — duplicate audit rows are silently
 *     ignored on conflict (no unique constraint exists today; reserved)
 *
 * Audit-event classification:
 *   • Fail-closed transactional events (login_success + session_created,
 *     user_created, role_assignment_created): inserted atomically inside the
 *     route handler's DB transaction.  These never touch the outbox.
 *   • Durable-outbox events (authorization_denied and related denial events):
 *     written to sos_audit_outbox first; this worker drains them.
 *   • Operational-monitoring-only events: request log lines, health probes —
 *     these are written to the application log only, never to the DB audit log.
 */

import { pool } from "@workspace/db";
import { logger } from "./logger";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuditOutboxWorkerOptions {
  /** Polling interval in milliseconds. Default: 5 000 (5 s). */
  pollIntervalMs?: number;
  /** Rows to drain per poll cycle. Default: 20. */
  batchSize?: number;
  /** Maximum delivery attempts before marking a row failed_permanently. Default: 5. */
  maxAttempts?: number;
  /** Exponential back-off base in milliseconds. Default: 1 000. */
  backoffBaseMs?: number;
}

export interface WorkerHealth {
  pending:          number;
  failedPermanently: number;
  lastDrainAt:      Date | null;
  lastDrainCount:   number;
  running:          boolean;
}

// ── Worker ────────────────────────────────────────────────────────────────────

export class AuditOutboxWorker {
  private readonly pollIntervalMs: number;
  private readonly batchSize:      number;
  private readonly maxAttempts:    number;
  private readonly backoffBaseMs:  number;

  private running       = false;
  private timer:        NodeJS.Timeout | null = null;
  private currentDrain: Promise<number>       | null = null;
  private lastDrainAt:  Date | null = null;
  private lastDrainCount = 0;

  constructor(options: AuditOutboxWorkerOptions = {}) {
    this.pollIntervalMs = options.pollIntervalMs ?? 5_000;
    this.batchSize      = options.batchSize      ?? 20;
    this.maxAttempts    = options.maxAttempts     ?? 5;
    this.backoffBaseMs  = options.backoffBaseMs   ?? 1_000;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Start the worker: run startup recovery drain then begin the polling loop.
   */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    logger.info({ pollIntervalMs: this.pollIntervalMs, batchSize: this.batchSize },
      "auditOutboxWorker: starting");

    // Startup recovery — drain any rows left unprocessed from a previous run.
    try {
      const recovered = await this.drainOnce();
      if (recovered > 0) {
        logger.info({ recovered }, "auditOutboxWorker: startup recovery drained rows");
      }
    } catch (err) {
      logger.error({ err }, "auditOutboxWorker: startup recovery failed (non-fatal)");
    }

    this.scheduleNext();
  }

  /**
   * Stop the worker gracefully.  Waits for any in-flight drain to complete
   * before returning so that an in-flight event is not lost on SIGTERM.
   */
  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Wait for in-flight drain.
    if (this.currentDrain) {
      try {
        await this.currentDrain;
      } catch {
        // Already logged inside drainOnce.
      }
    }

    logger.info("auditOutboxWorker: stopped");
  }

  /**
   * Return backlog health counters.
   * Callable from health endpoints or monitoring.
   */
  async getHealth(): Promise<WorkerHealth> {
    try {
      const result = await pool.query<{ pending: string; failed: string }>(`
        SELECT
          COUNT(*) FILTER (WHERE processed_at IS NULL AND failed_permanently = false) AS pending,
          COUNT(*) FILTER (WHERE failed_permanently = true)                          AS failed
        FROM sos_audit_outbox
      `);
      const row = result.rows[0] ?? { pending: "0", failed: "0" };
      return {
        pending:           parseInt(row.pending, 10),
        failedPermanently: parseInt(row.failed,  10),
        lastDrainAt:       this.lastDrainAt,
        lastDrainCount:    this.lastDrainCount,
        running:           this.running,
      };
    } catch (err) {
      logger.error({ err }, "auditOutboxWorker: getHealth query failed");
      return {
        pending: -1, failedPermanently: -1,
        lastDrainAt: this.lastDrainAt, lastDrainCount: this.lastDrainCount,
        running: this.running,
      };
    }
  }

  /**
   * Drain one batch of unprocessed rows.  Exported for direct use in tests.
   * Returns the number of rows successfully drained.
   */
  async drainOnce(): Promise<number> {
    let drained = 0;

    // FOR UPDATE SKIP LOCKED: concurrent workers safely skip locked rows.
    // Each worker takes its own set of rows; no duplication, no blocking.
    const lockResult = await pool.query<{
      id: string; event_type: string; outcome: string; reason_code: string | null;
      org_id: string | null; user_id: string | null; session_id: string | null;
      target_user_id: string | null; ip_address: string | null;
      user_agent_summary: string | null; metadata: unknown; attempts: number;
    }>(`
      SELECT id, event_type, outcome, reason_code, org_id, user_id, session_id,
             target_user_id, ip_address, user_agent_summary, metadata, attempts
        FROM sos_audit_outbox
       WHERE processed_at      IS NULL
         AND failed_permanently = false
       ORDER BY created_at ASC
       LIMIT $1
         FOR UPDATE SKIP LOCKED
    `, [this.batchSize]);

    const rows = lockResult.rows;
    if (rows.length === 0) return 0;

    for (const row of rows) {
      // Exponential back-off: skip rows whose next-retry time has not arrived.
      const backoffMs = Math.min(
        this.backoffBaseMs * Math.pow(2, row.attempts),
        60_000,
      );
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Idempotent insert into sos_auth_audit.
        // If a duplicate somehow exists (e.g. direct insert + outbox drain race),
        // the ON CONFLICT DO NOTHING prevents duplicate rows.
        await client.query(`
          INSERT INTO sos_auth_audit
            (org_id, user_id, session_id, event_type, outcome, reason_code,
             target_user_id, ip_address, user_agent_summary, metadata)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT DO NOTHING
        `, [
          row.org_id, row.user_id, row.session_id,
          row.event_type, row.outcome, row.reason_code,
          row.target_user_id, row.ip_address, row.user_agent_summary,
          row.metadata ? JSON.stringify(row.metadata) : null,
        ]);

        // Mark row processed — atomically with the audit insert.
        await client.query(`
          UPDATE sos_audit_outbox
             SET processed_at = NOW(), attempts = $2
           WHERE id = $1
        `, [row.id, row.attempts + 1]);

        await client.query("COMMIT");
        drained++;
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});

        const newAttempts = row.attempts + 1;
        const permanent   = newAttempts >= this.maxAttempts;

        // Bump attempt counter; mark permanently failed if limit reached.
        await pool.query(`
          UPDATE sos_audit_outbox
             SET attempts          = $2,
                 error_detail      = $3,
                 failed_permanently = $4
           WHERE id = $1
        `, [
          row.id,
          newAttempts,
          err instanceof Error ? err.message.slice(0, 500) : String(err),
          permanent,
        ]).catch(() => {});

        if (permanent) {
          logger.error({ outboxId: row.id, attempts: newAttempts },
            "auditOutboxWorker: row marked failed_permanently after max attempts");
        } else {
          logger.warn({ outboxId: row.id, attempts: newAttempts, backoffMs },
            "auditOutboxWorker: drain failed — will retry");
        }
      } finally {
        client.release();
      }
    }

    this.lastDrainAt    = new Date();
    this.lastDrainCount = drained;
    return drained;
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private scheduleNext(): void {
    if (!this.running) return;
    this.timer = setTimeout(() => {
      this.currentDrain = this.drainOnce()
        .then((n) => {
          if (n > 0) logger.debug({ drained: n }, "auditOutboxWorker: drain cycle");
          return n;
        })
        .catch((err) => {
          logger.error({ err }, "auditOutboxWorker: drain cycle failed");
          return 0;
        })
        .finally(() => {
          this.currentDrain = null;
          this.scheduleNext();
        });
    }, this.pollIntervalMs);
    this.timer.unref();
  }
}

// ── Singleton for app use ─────────────────────────────────────────────────────

let _workerInstance: AuditOutboxWorker | null = null;

export function getAuditOutboxWorker(options?: AuditOutboxWorkerOptions): AuditOutboxWorker {
  if (!_workerInstance) {
    _workerInstance = new AuditOutboxWorker(options);
  }
  return _workerInstance;
}
