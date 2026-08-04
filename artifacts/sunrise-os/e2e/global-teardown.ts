/**
 * Playwright global teardown — Phase 3 True Browser Tests
 *
 * Runs once after ALL tests finish.
 *
 * Purpose: Remove rate-limit rows written by browser-test login attempts
 * (IP key = ::1 / 127.0.0.1 / ::ffff:127.0.0.1) so that a subsequent
 * Vitest run does not inherit a partially-exhausted window.
 *
 * Determinism contract:
 *   - Vitest's rate-limit integration test (step-15) deletes loopback keys
 *     at its own start.  This teardown provides an additional guarantee
 *     that the table is clean after every Playwright run.
 *   - This teardown removes only loopback-IP rows — it does not touch
 *     production-style records or any other namespace.
 */

import { execSync } from "child_process";

export default async function globalTeardown(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("[global-teardown] DATABASE_URL not set — skipping rate-limit cleanup.");
    return;
  }

  const LOOPBACK_KEYS = "('::1', '127.0.0.1', '::ffff:127.0.0.1')";
  try {
    // Count before deletion for audit log
    const countOut = execSync(
      `psql "${databaseUrl}" -t -c "SELECT count(*) FROM sos_rate_limit_windows WHERE key IN ${LOOPBACK_KEYS}"`,
      { stdio: "pipe" },
    ).toString().trim();
    const rowCount = parseInt(countOut, 10) || 0;

    execSync(
      `psql "${databaseUrl}" -c "DELETE FROM sos_rate_limit_windows WHERE key IN ${LOOPBACK_KEYS}"`,
      { stdio: "pipe" },
    );
    console.log(
      `[global-teardown] Removed ${rowCount} browser-test rate-limit row(s) ` +
      `(keys: ::1, 127.0.0.1, ::ffff:127.0.0.1). No identity or session values logged.`,
    );
  } catch (err) {
    // Non-fatal: log and continue so CI does not fail on cleanup.
    console.warn(
      "[global-teardown] Could not remove rate-limit rows:",
      (err as Error).message,
    );
  }
}
