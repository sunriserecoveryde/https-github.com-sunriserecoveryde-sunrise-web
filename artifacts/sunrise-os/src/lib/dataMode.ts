/**
 * Data mode configuration — controls whether Sunrise OS uses the server-backed
 * production database or the built-in mock dataset.
 *
 * Environment variable: VITE_SUNRISE_DATA_MODE
 *   "demo"        — uses MOCK_PATIENTS / local mock data.  Safe default for
 *                   demonstrations and local development.
 *   "production"  — fetches patients from /api/v1/patients.
 *                   Requires the api-server and database to be running.
 *
 * Fail-closed rules:
 *   - Only "demo" and "production" are valid values.
 *   - Any other value (including typos) surfaces as DATA_MODE_ERROR and
 *     blocks the application from rendering any patient data.
 *   - "demo" is the explicit safe default for unset/empty variables.
 *   - Production mode NEVER falls back to mock data on API error — it shows
 *     a safe error state instead.
 *
 * The "Demo Mode" orange banner is shown in demo mode and must be removed
 * or suppressed before production use with real patients.
 */

export type DataMode = "demo" | "production";

const _RAW: string | undefined =
  import.meta.env.VITE_SUNRISE_DATA_MODE as string | undefined;

/**
 * Parse the raw VITE_SUNRISE_DATA_MODE value.
 * Exported for unit testing; application code should use DATA_MODE / DATA_MODE_ERROR.
 */
export function parseDataMode(
  raw: string | undefined,
): { ok: true; mode: DataMode } | { ok: false; reason: string } {
  if (raw === "production") return { ok: true, mode: "production" };
  if (raw === "demo" || raw === undefined || raw === "")
    return { ok: true, mode: "demo" };
  return {
    ok: false,
    reason:
      `VITE_SUNRISE_DATA_MODE="${raw}" is not a recognised mode. ` +
      `Accepted values: "demo" | "production". ` +
      `Fix the environment variable to continue.`,
  };
}

const _parsed = parseDataMode(_RAW);

/**
 * The resolved data mode.
 * In demo mode:       MOCK_PATIENTS are used, no server calls are made.
 * In production mode: /api/v1/* endpoints are called; no mock fallback on error.
 */
export const DATA_MODE: DataMode = _parsed.ok ? _parsed.mode : "demo";

/**
 * Non-null when VITE_SUNRISE_DATA_MODE is set to an unrecognised value.
 * When this is set the application MUST display a blocking configuration
 * error and must NOT render any patient data — demo or production.
 */
export const DATA_MODE_ERROR: string | null = _parsed.ok ? null : _parsed.reason;

/**
 * The API base path for Sunrise OS API calls.
 * Relative so it works in both development and deployed environments.
 */
export const API_BASE = "/api";

/**
 * Dev-identity headers injected with every production-mode API call.
 * These are REPLACED by real auth tokens in Phase 2.
 * They have no effect when DATA_MODE === "demo".
 *
 * ⚠️  These headers only work in NODE_ENV !== "production" server environments.
 *     The api-server devIdentityMiddleware is NOT registered in production,
 *     so these headers are silently ignored and the request returns 401.
 */
export const DEV_HEADERS: Record<string, string> = {
  "X-Dev-Org-Id":      "00000000-0000-4000-a000-000000000001",
  "X-Dev-Facility-Id": "00000000-0000-4000-a000-000000000002",
};
