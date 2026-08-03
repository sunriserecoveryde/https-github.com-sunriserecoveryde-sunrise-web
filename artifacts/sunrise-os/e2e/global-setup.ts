/**
 * Playwright global setup — Phase 3 True Browser Tests
 *
 * Runs once before all tests.  At this point the webServer processes
 * (Vite frontend on port 23456 + test API on port 8099) are already running.
 *
 * Steps:
 *  1. Clear sos_rate_limit_windows so repeated runs don't exhaust the login limit.
 *  2. Run the browser test seed (creates pre-signed and pre-draft notes).
 *  3. Verify that the test API on port 8099 enforces authentication
 *     (GET /api/v1/patients/:id/clinical-notes without a session → 401).
 *     This proves DISABLE_AUTH_FALLBACK=true is active.
 */

import { execSync } from "child_process";
import { runBrowserTestSeed } from "../../api-server/src/seed/browserTestSeed.ts";

const TEST_API_PORT   = parseInt(process.env.PLAYWRIGHT_API_PORT ?? "8099", 10);
const TEST_PATIENT_ID = "00000000-0000-4000-a000-000000000099";

export default async function globalSetup(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  // ── Step 1: Clear rate-limit windows ───────────────────────────────────────
  if (!databaseUrl) {
    console.warn("[global-setup] DATABASE_URL not set — skipping rate-limit reset.");
  } else {
    try {
      execSync(`psql "${databaseUrl}" -c "DELETE FROM sos_rate_limit_windows"`, {
        stdio: "pipe",
      });
      console.log("[global-setup] Rate-limit windows cleared.");
    } catch (err) {
      // Non-fatal: warn and continue so tests still run.
      console.warn(
        "[global-setup] Could not clear rate-limit windows:",
        (err as Error).message,
      );
    }
  }

  // ── Step 2: Run browser test seed ──────────────────────────────────────────
  await runBrowserTestSeed();

  // ── Step 3: Verify DISABLE_AUTH_FALLBACK=true is active on port 8099 ───────
  //
  // A request without a session cookie must return 401 (not 200 with a dev
  // identity).  If this fails the test suite aborts immediately with a clear
  // message rather than producing misleading passing tests.
  await verifyAuthEnforced();
}

async function verifyAuthEnforced(): Promise<void> {
  const url = `http://localhost:${TEST_API_PORT}/api/v1/patients/${TEST_PATIENT_ID}/clinical-notes`;

  let status: number;
  try {
    const res = await fetch(url, {
      headers: {
        // No session cookie — anonymous request.
        Accept: "application/json",
      },
      // No credentials: "include" so no cookies are sent.
    });
    status = res.status;
  } catch (err) {
    throw new Error(
      `[global-setup] Could not reach test API at ${url}: ${(err as Error).message}. ` +
      `Is the test API (port ${TEST_API_PORT}) running?`,
    );
  }

  if (status !== 401) {
    throw new Error(
      `[global-setup] ABORT: test API at ${url} returned ${status}, expected 401. ` +
      `DISABLE_AUTH_FALLBACK=true may not be active — aborting to prevent ` +
      `tests from running against an unprotected API.`,
    );
  }

  console.log(
    `[global-setup] Auth enforcement verified: GET ${url} → 401 ✓`,
  );
}
