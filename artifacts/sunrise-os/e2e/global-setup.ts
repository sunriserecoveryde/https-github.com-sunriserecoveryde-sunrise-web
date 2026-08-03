/**
 * Playwright global setup — runs once before all tests.
 *
 * Clears the sos_rate_limit_windows table so repeated Playwright runs
 * don't exhaust the login rate limit (default: 10 per 15-minute window).
 */
import { execSync } from "child_process";

export default async function globalSetup(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("[global-setup] DATABASE_URL not set — skipping rate-limit reset.");
    return;
  }
  try {
    execSync(`psql "${databaseUrl}" -c "DELETE FROM sos_rate_limit_windows"`, {
      stdio: "pipe",
    });
    console.log("[global-setup] Rate-limit windows cleared.");
  } catch (err) {
    // Non-fatal: warn and continue so tests still run.
    console.warn("[global-setup] Could not clear rate-limit windows:", (err as Error).message);
  }
}
