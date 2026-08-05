/**
 * Playwright configuration — Phase 3 True Browser Tests
 *
 * Runs the real Sunrise OS frontend (production data mode) against a dedicated
 * test API process that has DISABLE_AUTH_FALLBACK=true so every request must
 * carry a real session cookie.
 *
 * ── Browser compatibility ─────────────────────────────────────────────────────
 * Package:    playwright@1.38.0  (pinned — not ^1.38)
 * Chromium:   revision 1080  (NixOS-patched build)
 * Pair basis: Playwright 1.38.0 shipped with Chromium at revision 1080.
 *             The CDP protocol versions match by design: traces, HAR capture,
 *             and standard locator.click() all work without workarounds.
 *             A later Playwright (1.62.0) expects revision 1234; that binary
 *             requires glibc/libgobject/libnss absent from NixOS and cannot
 *             launch.  Pinning to 1.38.0 restores the correct pairing.
 *
 * ── Process layout ───────────────────────────────────────────────────────────
 *   webServer[0]  Vite dev server   localhost:23456  (VITE_SUNRISE_DATA_MODE=production)
 *   webServer[1]  API server        localhost:8099   (DISABLE_AUTH_FALLBACK=true)
 *
 * ── Pre-conditions ────────────────────────────────────────────────────────────
 *   - DATABASE_URL env var must be set.
 *   - PHASE2D_TEST_PASSWORD env var must be set (used by globalSetup seed).
 *   - authSeed must have been run at least once against the target database.
 *
 * Run: pnpm --filter @workspace/sunrise-os exec playwright test
 */

import { defineConfig, devices } from "playwright/test";
import path from "path";

const PLAYWRIGHT_PORT = 23456;
const TEST_API_PORT   = 8099;

export default defineConfig({
  testDir:    path.join(import.meta.dirname, "e2e"),
  testMatch:  "**/clinical-notes-p3-browser.spec.ts",
  globalSetup:    path.join(import.meta.dirname, "e2e", "global-setup.ts"),
  globalTeardown: path.join(import.meta.dirname, "e2e", "global-teardown.ts"),
  tsconfig:   path.join(import.meta.dirname, "e2e", "tsconfig.json"),

  timeout:       120_000,  // per-test timeout including login + navigation
  expect:        { timeout: 15_000 },
  fullyParallel: false,    // sequential — shared DB state
  workers:       1,
  retries:       0,

  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  outputDir: path.join(import.meta.dirname, "playwright-results"),

  use: {
    baseURL:    `http://localhost:${PLAYWRIGHT_PORT}`,
    headless:   true,
    screenshot: "on",

    // Traces: Playwright 1.38.0 + chromium-1080 are a matched pair (CDP aligns),
    // so tracing works without deadlock.  Use trace "on" to capture authentic
    // traces for all 19 tests (workers: 1 = one test at a time, memory safe).
    trace: "on",

    // Video: off during stability proof runs to avoid ffmpeg encoding overhead.
    video: "off",

    // ── Chromium launch options ───────────────────────────────────────────────
    launchOptions: {
      // NixOS-patched Playwright-managed Chromium revision 1080.
      // Playwright 1.38.0 shipped this exact revision — CDP matches.
      executablePath:
        process.env.CHROMIUM_PATH ??
        "/nix/store/0n9rl5l9syy808xi9bk4f6dhnfrvhkww-playwright-browsers-chromium/chromium-1080/chrome-linux/chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-sync",
        "--disable-translate",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-first-run",
        "--safebrowsing-disable-auto-update",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        "--disable-ipc-flooding-protection",
        "--font-render-hinting=none",
      ],
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    // ── Frontend — Vite dev server ──────────────────────────────────────────
    {
      command: "pnpm --filter @workspace/sunrise-os exec vite --config vite.playwright.config.ts",
      env: {
        PORT:                   String(PLAYWRIGHT_PORT),
        VITE_SUNRISE_DATA_MODE: "production",
        PLAYWRIGHT_API_PORT:    String(TEST_API_PORT),
      },
      port:                PLAYWRIGHT_PORT,
      timeout:             120_000,
      reuseExistingServer: false,
      stdout:              "pipe",
      stderr:              "pipe",
      cwd:                 path.join(import.meta.dirname, "..", ".."),
    },

    // ── Test API — DISABLE_AUTH_FALLBACK=true ───────────────────────────────
    // Uses `run start` (prebuilt dist) rather than `run dev` so server startup
    // is ~5 s instead of ~35 s (build + start).  Build the dist before running
    // playwright: `pnpm --filter @workspace/api-server run build && playwright test`
    // PHASE2D_RATE_LIMIT_INTEGRATION=true activates PgRateLimitStore so
    // every login attempt is counted in sos_rate_limit_windows.  Without it
    // the limiter uses MemoryStore (no DB writes).
    // PHASE2D_RATE_LIMIT_MAX is intentionally NOT set — the default (10) is
    // used.  globalSetup clears loopback IP rows before each persona login so
    // the 8 setup logins + 2 test logins (A-2, B-1) never exhaust the window.
    {
      command: "pnpm --filter @workspace/api-server run start",
      env: {
        PORT:                             String(TEST_API_PORT),
        NODE_ENV:                         "development",
        DISABLE_AUTH_FALLBACK:            "true",
        SUNRISE_DEFAULT_ORG_SLUG:         "sunrise",
        PLAYWRIGHT_ORIGIN:                `http://localhost:${PLAYWRIGHT_PORT}`,
        PHASE2D_RATE_LIMIT_INTEGRATION:   "true",
      },
      port:                TEST_API_PORT,
      timeout:             120_000,
      reuseExistingServer: false,
      stdout:              "pipe",
      stderr:              "pipe",
      cwd:                 path.join(import.meta.dirname, "..", ".."),
    },
  ],
});
