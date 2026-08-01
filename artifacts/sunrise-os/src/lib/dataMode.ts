/**
 * Data mode configuration — controls whether Sunrise OS uses the server-backed
 * production database or the built-in mock dataset.
 *
 * Set the Vite environment variable VITE_SUNRISE_DATA_MODE to switch modes:
 *   - "demo"       (default) — uses MOCK_PATIENTS / local mock data.
 *                              Safe for demonstrations with fictitious data.
 *   - "production" — fetches patients from /api/v1/patients.
 *                    Requires the api-server to be running and
 *                    the database seed to have been executed.
 *
 * In demo mode the visible "Demo Mode" banner remains in the UI.
 * In production mode the banner must be removed before real-patient use.
 *
 * IMPORTANT: production mode does NOT fall back to mock data if the server
 * is unavailable.  It shows a safe error state instead.
 */

export type DataMode = "demo" | "production";

export const DATA_MODE: DataMode =
  (import.meta.env.VITE_SUNRISE_DATA_MODE as DataMode | undefined) === "production"
    ? "production"
    : "demo";

/**
 * The API base path for Sunrise OS API calls.
 * Relative so it works in both development and deployed environments.
 */
export const API_BASE = "/api";

/**
 * Dev-identity headers injected with every production-mode API call.
 * These are replaced by real auth tokens in Phase 2.
 * They have no effect when DATA_MODE === "demo".
 */
export const DEV_HEADERS: Record<string, string> = {
  "X-Dev-Org-Id": "00000000-0000-4000-a000-000000000001",
  "X-Dev-Facility-Id": "00000000-0000-4000-a000-000000000002",
};
