/**
 * PostgreSQL-backed rate-limit store for express-rate-limit v8.
 *
 * Survives API restarts and is shared across multiple API instances.
 * Uses the sos_rate_limit_windows table (added in migration 0002).
 *
 * Algorithm:
 *   - Each request increments a counter for (key, window_end).
 *   - window_end = ceiling of (now / windowMs) * windowMs.
 *   - All requests within the same window share one counter row.
 *   - UPSERT ensures atomicity: concurrent increments never lose a count.
 *   - Expired rows (window_end < now) are pruned on each startup and hourly.
 *
 * Fail-open behaviour:
 *   - If the database is unavailable, increment() returns { totalHits: 0 },
 *     which causes the limiter to allow the request.
 *   - This is the configured safe policy: prefer availability over blocking.
 *   - The DB-backed account lockout (sos_user_accounts.failed_login_count)
 *     provides a durable second layer of protection even when rate limiting fails.
 */

import { pool } from "@workspace/db";
import { logger } from "./logger";
import type { Store, ClientRateLimitInfo } from "express-rate-limit";

export class PgRateLimitStore implements Store {
  readonly windowMs: number;
  private pruneInterval: NodeJS.Timeout | null = null;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  /** Call once at app startup to begin periodic pruning. */
  init(): void {
    // Prune expired windows immediately, then every hour.
    this.prune().catch((err) =>
      logger.error({ err }, "pgRateLimiter: initial prune failed"),
    );
    this.pruneInterval = setInterval(
      () => this.prune().catch((err) => logger.error({ err }, "pgRateLimiter: prune failed")),
      60 * 60 * 1000,
    );
    // Allow the process to exit even if this interval is still active.
    this.pruneInterval.unref();
  }

  destroy(): void {
    if (this.pruneInterval) {
      clearInterval(this.pruneInterval);
      this.pruneInterval = null;
    }
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const windowEnd = this.windowEnd();
    try {
      const result = await pool.query<{ count: string }>(
        `INSERT INTO sos_rate_limit_windows (key, window_end, count, updated_at)
         VALUES ($1, $2, 1, now())
         ON CONFLICT (key, window_end)
         DO UPDATE SET
           count      = sos_rate_limit_windows.count + 1,
           updated_at = now()
         RETURNING count`,
        [key, windowEnd.toISOString()],
      );
      const totalHits = parseInt(result.rows[0]?.count ?? "1", 10);
      return { totalHits, resetTime: windowEnd };
    } catch (err) {
      // Fail-open: log error and allow the request.
      logger.error({ err, key }, "pgRateLimiter: increment failed — allowing request (fail-open)");
      return { totalHits: 0, resetTime: windowEnd };
    }
  }

  async decrement(key: string): Promise<void> {
    const windowEnd = this.windowEnd();
    try {
      await pool.query(
        `UPDATE sos_rate_limit_windows
            SET count = GREATEST(0, count - 1), updated_at = now()
          WHERE key = $1 AND window_end = $2`,
        [key, windowEnd.toISOString()],
      );
    } catch (err) {
      logger.error({ err, key }, "pgRateLimiter: decrement failed (non-fatal)");
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      await pool.query(
        `DELETE FROM sos_rate_limit_windows WHERE key = $1`,
        [key],
      );
    } catch (err) {
      logger.error({ err, key }, "pgRateLimiter: resetKey failed (non-fatal)");
    }
  }

  async resetAll(): Promise<void> {
    try {
      await pool.query(`DELETE FROM sos_rate_limit_windows`);
    } catch (err) {
      logger.error({ err }, "pgRateLimiter: resetAll failed (non-fatal)");
    }
  }

  private async prune(): Promise<void> {
    await pool.query(
      `DELETE FROM sos_rate_limit_windows WHERE window_end < now()`,
    );
  }

  /** The end of the current rate-limit window. */
  private windowEnd(): Date {
    const now = Date.now();
    return new Date(Math.ceil(now / this.windowMs) * this.windowMs);
  }
}
