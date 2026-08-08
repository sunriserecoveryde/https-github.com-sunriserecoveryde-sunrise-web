/**
 * Playwright global setup — Phase 3 True Browser Tests
 *
 * Runs once before all tests.  At this point the webServer processes
 * (Vite frontend on port 23456 + test API on port 8099) are already running.
 *
 * Steps:
 *  1. Run the browser test seed (creates/refreshes pre-signed and pre-draft notes).
 *  2. Verify that the test API on port 8099 enforces authentication
 *     (GET /api/v1/patients/:id/clinical-notes without a session → 401).
 *     This proves DISABLE_AUTH_FALLBACK=true is active.
 *  3. Pre-create one authenticated session per persona via HTTP (no browser launch).
 *     Between each login, loopback-IP rate-limit rows are cleared so that
 *     the 8 setup logins never exhaust the 10-attempt window.
 *     After the FIRST login the sos_rate_limit_windows table is queried to
 *     confirm that the rate limiter IS writing to PgStore (active, no bypass).
 *
 * Session files are saved to e2e/sessions/ and consumed by the spec via
 * test.use({ storageState }).  They contain only localhost test cookies.
 *
 * HTTP session creation:
 *   Instead of launching a browser for each persona we use two HTTP round-trips:
 *   GET /api/v1/auth/csrf-token → extract _csrf cookie + csrfToken JSON field.
 *   POST /api/v1/auth/login → extract connect.sid cookie.
 *   The resulting Playwright storageState file contains only the session cookie
 *   so the browser context is pre-authenticated without any page navigation.
 *   This reduces session-creation time from ~48 s (8 browser launches) to <5 s.
 *
 * Rate-limit budget (max = 10 per IP per 15 min):
 *   - globalSetup clears ::1 before each of the 8 persona HTTP logins → net count = 1
 *     (only the last persona's row survives into the test phase)
 *   - A-2 (loginViaUI):  count → 2
 *   - B-1 (loginViaUI):  count → 3
 *   - All other tests use storageState — no further logins
 *   - Final count in window: 3 (well below 10) ✓
 */

import { execSync }           from "child_process";
import fs                      from "fs";
import { runBrowserTestSeed } from "../../api-server/src/seed/browserTestSeed.ts";
import { SESSION_PATHS, SESSIONS_DIR } from "./sessions.ts";

// ── Constants ─────────────────────────────────────────────────────────────────

const TEST_API_PORT = parseInt(process.env.PLAYWRIGHT_API_PORT ?? "8099", 10);
const TEST_PATIENT_ID = "00000000-0000-4000-a000-000000000099";
const _rawTestPwd = process.env.PHASE2D_TEST_PASSWORD;
if (!_rawTestPwd) {
  throw new Error(
    "[global-setup] ABORT: PHASE2D_TEST_PASSWORD environment variable is required.\n" +
    "Set it to the fictitious browser-test account password before running Playwright.\n" +
    "Do not hard-code credentials. Do not use a real credential.\n" +
    "Example: PHASE2D_TEST_PASSWORD=<secret> pnpm exec playwright test ...",
  );
}
const TEST_PWD        = _rawTestPwd;
const API_BASE        = `http://localhost:${TEST_API_PORT}`;

// Ordered list of personas to pre-authenticate.
const PERSONAS: Array<{ key: keyof typeof SESSION_PATHS; email: string }> = [
  { key: "clinician",     email: "clinician@test.sunrise"     },
  { key: "nurse",         email: "nurse@test.sunrise"          },
  { key: "supervisor",    email: "org-admin@test.sunrise"      },
  { key: "otherFacility", email: "other-facility@test.sunrise" },
  { key: "securityAdmin", email: "security-admin@test.sunrise" },
  { key: "hr",            email: "hr@test.sunrise"             },
  { key: "billing",       email: "billing@test.sunrise"        },
  { key: "multiFac",      email: "multi-facility@test.sunrise" },
  // Phase 4: BHT persona for appointment.view-only denial tests.
  // readonly@test.sunrise holds the bht role at Facility 1.
  { key: "bht",           email: "readonly@test.sunrise"       },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Delete loopback-IP rate-limit rows and log the count removed. */
function clearLoopbackRateLimit(databaseUrl: string): void {
  const LOOPBACK_KEYS = "('::1', '127.0.0.1', '::ffff:127.0.0.1')";
  try {
    // Get count before deletion (for audit logging)
    const countOut = execSync(
      `psql "${databaseUrl}" -t -c "SELECT count(*) FROM sos_rate_limit_windows WHERE key IN ${LOOPBACK_KEYS}"`,
      { stdio: "pipe" },
    ).toString().trim();
    const rowsBefore = parseInt(countOut, 10) || 0;

    // Scoped deletion — only loopback IPs used by the browser test suite
    execSync(
      `psql "${databaseUrl}" -c "DELETE FROM sos_rate_limit_windows WHERE key IN ${LOOPBACK_KEYS}"`,
      { stdio: "pipe" },
    );

    // Log count removed (no session or identity values are logged)
    console.log(
      `[global-setup] Cleared ${rowsBefore} loopback rate-limit row(s) ` +
      `(keys: ::1, 127.0.0.1, ::ffff:127.0.0.1).`,
    );
  } catch {
    console.warn("[global-setup] Could not clear loopback rate-limit rows (non-fatal).");
  }
}

function countLoopbackRateLimitRows(databaseUrl: string): number {
  try {
    // Check all loopback representations — Express's req.ip may produce any of
    // these depending on the IPv6 / dual-stack configuration of the listener.
    const out = execSync(
      `psql "${databaseUrl}" -t -c "SELECT count(*) FROM sos_rate_limit_windows WHERE key IN ('::1', '127.0.0.1', '::ffff:127.0.0.1')"`,
      { stdio: "pipe" },
    ).toString().trim();
    return parseInt(out, 10) || 0;
  } catch {
    return -1; // Unable to check
  }
}

/**
 * Create one authenticated Playwright storageState file for `email` via curl.
 *
 * Why curl instead of Node.js fetch:
 *   The CSRF implementation uses `getSessionIdentifier: req => req.session.id`.
 *   The token is HMAC'd with the session ID.  The GET /csrf-token response sets
 *   BOTH a `_csrf` cookie AND a `connect.sid` session cookie.  The POST /login
 *   request must carry BOTH so the server can re-derive the same session ID for
 *   HMAC validation.  `curl -c/-b` handles the full cookie jar automatically —
 *   a manual fetch approach would need to extract and forward both cookies,
 *   which is fragile with multi-value set-cookie headers.
 *
 * The resulting storageState file carries only the post-login `connect.sid`
 * value.  Playwright loads it with test.use({ storageState }) so tests start
 * fully authenticated without any page navigation or login UI interaction.
 */
async function createSessionViaHttp(
  email: string,
  sessionPath: string,
): Promise<void> {
  // Use a unique temp cookie jar for this persona so concurrent calls (if any)
  // don't clobber each other's state.
  const cookieJar = `/tmp/pw-setup-${process.pid}-${Date.now()}.txt`;

  try {
    // ── Step 1: GET /csrf-token ───────────────────────────────────────────────
    // curl -c saves cookies (both _csrf and connect.sid) to the jar.
    const csrfRaw = execSync(
      `curl -s -c "${cookieJar}" "${API_BASE}/api/v1/auth/csrf-token"`,
      { stdio: "pipe" },
    ).toString().trim();

    const csrfData = JSON.parse(csrfRaw) as { csrfToken?: string };
    const csrfToken = csrfData.csrfToken;
    if (!csrfToken) {
      throw new Error(
        `[global-setup] No csrfToken in CSRF response for ${email}. Body: ${csrfRaw}`,
      );
    }

    // ── Step 2: POST /login ───────────────────────────────────────────────────
    // Use curl -i to include response headers in stdout so we can extract the
    // Set-Cookie header directly — no Netscape cookie jar parsing needed.
    // curl -b sends ALL cookies from the jar (both _csrf AND the session cookie
    // created in step 1) so the server can re-derive the session ID for CSRF
    // HMAC validation.
    //
    // Body written to a temp file — avoids shell-quoting issues with passwords
    // that contain special characters.
    const bodyFile = `${cookieJar}.body.json`;
    fs.writeFileSync(
      bodyFile,
      JSON.stringify({ orgSlug: "sunrise", email, password: TEST_PWD }),
    );

    const loginOut = execSync(
      `curl -s -i -b "${cookieJar}" ` +
      `-X POST "${API_BASE}/api/v1/auth/login" ` +
      `-H "Content-Type: application/json" ` +
      `-H "X-CSRF-Token: ${csrfToken}" ` +
      `--data-binary "@${bodyFile}"`,
      { stdio: "pipe" },
    ).toString();

    // ── Step 3: Extract session cookie from login response headers ────────────
    // curl -i outputs: status line, headers, blank line, body.
    // Split on the first blank line to separate headers from body.
    const blankLineIdx = loginOut.search(/\r?\n\r?\n/);
    const headersSection = blankLineIdx >= 0 ? loginOut.slice(0, blankLineIdx) : "";
    const loginBody      = blankLineIdx >= 0 ? loginOut.slice(blankLineIdx).trim() : loginOut;

    const loginData = JSON.parse(loginBody || "{}") as { error?: string };
    if (loginData.error) {
      throw new Error(
        `[global-setup] Login failed for ${email}: ${loginData.error}\nHeaders:\n${headersSection}`,
      );
    }

    // The session cookie is named "sos_dev_session" (singular — not express-session's
    // default "connect.sid") — confirmed from the Set-Cookie header in app.ts.
    const SESSION_COOKIE_NAME = "sos_dev_session";

    const headerLines   = headersSection.split(/\r?\n/);
    const setCookieLine = headerLines.find(
      (l) =>
        l.toLowerCase().startsWith("set-cookie:") &&
        l.includes(SESSION_COOKIE_NAME),
    );
    if (!setCookieLine) {
      throw new Error(
        `[global-setup] No ${SESSION_COOKIE_NAME} Set-Cookie in login response for ${email}.\n` +
        `Status line: ${headerLines[0] ?? "(none)"}\n` +
        `Headers:\n${headersSection}\nBody:\n${loginBody}`,
      );
    }
    // set-cookie: sos_dev_sessions=VALUE; Path=/api; HttpOnly; SameSite=Lax
    const cookieMatch = setCookieLine.match(
      new RegExp(`${SESSION_COOKIE_NAME}=([^;,\\s]+)`),
    );
    if (!cookieMatch) {
      throw new Error(
        `[global-setup] Could not parse ${SESSION_COOKIE_NAME} value from: ${setCookieLine}`,
      );
    }
    const sidRaw = cookieMatch[1]; // URL-encoded value, e.g. "s%3AXXX"

    // ── Step 4: Write Playwright storageState JSON ────────────────────────────
    // curl stores cookie values as they appear in Set-Cookie (URL-encoded).
    // Playwright loads this into Chromium which stores and sends them the same
    // way; Express's cookie-parser URL-decodes on arrival → session recognised.
    const storageState = {
      cookies: [
        {
          name:     SESSION_COOKIE_NAME, // "sos_dev_sessions" (custom name in app.ts)
          value:    sidRaw, // URL-encoded as stored by curl — do NOT decode
          domain:   "localhost",
          path:     "/",
          expires:  -1,
          httpOnly: true,
          secure:   false,
          sameSite: "Lax" as const,
        },
      ],
      origins: [],
    };

    fs.writeFileSync(sessionPath, JSON.stringify(storageState, null, 2));
    console.log(`[global-setup] Session saved: ${email} → ${sessionPath}`);

  } finally {
    // Clean up temp files (best-effort).
    for (const f of [cookieJar, `${cookieJar}.body.json`]) {
      try { execSync(`rm -f "${f}"`, { stdio: "pipe" }); } catch { /* ignore */ }
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default async function globalSetup(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  // ── Step 1: Run browser test seed ─────────────────────────────────────────
  await runBrowserTestSeed();

  // ── Step 2: Verify DISABLE_AUTH_FALLBACK=true is active on port 8099 ──────
  await verifyAuthEnforced();

  // ── Step 3: Pre-create authenticated sessions for all personas via HTTP ───
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });

  let rateLimiterAsserted = false;

  for (let i = 0; i < PERSONAS.length; i++) {
    const { key, email } = PERSONAS[i];

    // Clear loopback IP rate-limit rows before each persona login so that
    // none of the 8 setup logins count against the test-phase window.
    if (databaseUrl) clearLoopbackRateLimit(databaseUrl);

    await createSessionViaHttp(email, SESSION_PATHS[key]);

    // ── Rate-limiter active assertion (first persona only) ─────────────────
    // After the first login, confirm the rate limiter wrote a row to
    // sos_rate_limit_windows.  This proves PgRateLimitStore is active
    // (not skipped/bypassed) and the configured default threshold (10) is
    // in force — not the 1000 bypass that was present in an earlier version.
    if (!rateLimiterAsserted && databaseUrl) {
      const count = countLoopbackRateLimitRows(databaseUrl);
      if (count === 0) {
        throw new Error(
          "[global-setup] ABORT: Rate limiter is NOT active. " +
          "No sos_rate_limit_windows entry found after login. " +
          "The configured rate limit (10/15 min) may not be enforced. " +
          "Ensure DISABLE_AUTH_FALLBACK=true, PHASE2D_RATE_LIMIT_INTEGRATION=true " +
          "and no RL bypass env vars are set.",
        );
      }
      if (count < 0) {
        console.warn("[global-setup] Could not verify rate limiter (DB check failed) — continuing.");
      } else {
        console.log(
          `[global-setup] Rate limiter confirmed active (default threshold, no bypass): ` +
          `${count} row(s) in sos_rate_limit_windows ✓`,
        );
      }
      rateLimiterAsserted = true;
    }
  }

  console.log("[global-setup] All persona sessions created. Tests may proceed.");
}

// ── Auth enforcement verification ─────────────────────────────────────────────

async function verifyAuthEnforced(): Promise<void> {
  const url = `${API_BASE}/api/v1/patients/${TEST_PATIENT_ID}/clinical-notes`;

  let status: number;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
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

  console.log(`[global-setup] Auth enforcement verified: GET ${url} → 401 ✓`);
}
