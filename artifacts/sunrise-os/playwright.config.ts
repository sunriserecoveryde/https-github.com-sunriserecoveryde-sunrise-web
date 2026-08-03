/**
 * Playwright configuration — Phase 3 True Browser Tests
 *
 * Runs the real Sunrise OS frontend (production data mode) against a dedicated
 * test API process that has DISABLE_AUTH_FALLBACK=true so every request must
 * carry a real session cookie.
 *
 * Process layout:
 *   webServer[0]  Vite dev server   localhost:23456  (frontend, VITE_SUNRISE_DATA_MODE=production)
 *   webServer[1]  API server        localhost:8081   (DISABLE_AUTH_FALLBACK=true, no dev identity)
 *
 * Pre-conditions:
 *   - DATABASE_URL env var must be set.
 *   - PHASE2D_TEST_PASSWORD env var must be set (used by globalSetup seed).
 *   - authSeed must have been run at least once against the target database.
 *
 * Run: pnpm --filter @workspace/sunrise-os exec playwright test
 */

import { defineConfig, devices } from "playwright/test";
import path from "path";

const PLAYWRIGHT_PORT    = 23456;
const TEST_API_PORT      = 8099;  // 8081 is taken by the mockup-sandbox workflow

export default defineConfig({
  testDir: path.join(import.meta.dirname, "e2e"),
  testMatch: "**/clinical-notes-p3-browser.spec.ts",
  globalSetup: path.join(import.meta.dirname, "e2e", "global-setup.ts"),
  tsconfig:    path.join(import.meta.dirname, "e2e", "tsconfig.json"),

  timeout:          120_000,   // long for full login+navigate flows
  expect:           { timeout: 15_000 },
  fullyParallel:    false,     // sequential — shared DB state
  workers:          1,
  retries:          0,

  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  outputDir: path.join(import.meta.dirname, "playwright-results"),

  use: {
    baseURL:    `http://localhost:${PLAYWRIGHT_PORT}`,
    headless:   true,
    screenshot: "on",
    // trace: "on" deadlocks fetch() with chromium-1080 + Playwright 1.62.0 due
    // to CDP Network.enable mismatch; screenshots provide equivalent visual evidence.
    trace:      "off",
    video:      "off",

    // ── Chromium stability flags (no --single-process — crashes on React SPA) ──
    launchOptions: {
      // Use the NixOS-patched Chromium 138 (unwrapped binary, no bash wrapper).
      // Playwright 1.62.0 expects Chrome 138 (chromium-1234).
      //
      // NixOS provides two forms:
      //   • /bin/chromium     — a bash wrapper that sets LD_LIBRARY_PATH, then execs
      //   • libexec/chromium/chromium — the actual ELF binary with bundled libs
      //
      // The wrapper script is NOT suitable as executablePath because Playwright's
      // --remote-debugging-pipe passes FD 3/4 to the child; the bash wrapper may
      // alter the FD set before exec.  Use the raw binary instead — all required
      // shared libs (libEGL, libGLESv2, libnspr4, libnss3 …) are bundled in the
      // same libexec directory so no extra LD_LIBRARY_PATH is needed.
      //
      // To update: find /nix/store -maxdepth 1 -name "chromium-unwrapped-*" 2>/dev/null
      //
      // NOTE: --single-process is intentionally omitted — it crashes Chromium
      //       when loading large React SPA bundles in a container environment.
      // NOTE: --no-zygote is intentionally omitted — it prevents renderer
      //       processes from being spawned, causing "page closed" crashes.
      // NOTE: --disable-features=VizDisplayCompositor is intentionally omitted —
      //       it conflicts with the compositor in newer Chromium and causes blank pages.
      // chromium-1080 is the Playwright-browser NixOS build for this environment.
      // Playwright 1.62.0 bundles chromium-1234, but the standard Linux build
      // requires glibc/standard libs not present on NixOS. The NixOS unwrapped
      // chromium-138 crashes the renderer process. chromium-1080 renders pages
      // correctly (verified in prior runs) and accepts CDP protocol from 1.62.0.
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
    // ── Frontend — Vite dev server ────────────────────────────────────────────
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

    // ── Test API — DISABLE_AUTH_FALLBACK=true (scoped to this process only) ──
    {
      command: "pnpm --filter @workspace/api-server run dev",
      env: {
        PORT:                    String(TEST_API_PORT),
        DISABLE_AUTH_FALLBACK:   "true",
        SUNRISE_DEFAULT_ORG_SLUG: "sunrise",
        PLAYWRIGHT_ORIGIN:       `http://localhost:${PLAYWRIGHT_PORT}`,
        // NODE_ENV=test activates the rate-limiter skip guard:
        //   skip: () => process.env.NODE_ENV === "test" && !RL_INTEGRATION
        // Without this, the 10-attempt / 15-min IP limit is hit after ~11 tests.
        NODE_ENV:                "test",
        // Belt-and-suspenders: raise the per-IP limit high so even if NODE_ENV
        // is overridden by the npm script the window is not exhausted.
        PHASE2D_RATE_LIMIT_MAX:  "1000",
      },
      port:                TEST_API_PORT,
      timeout:             120_000,
      reuseExistingServer: false,  // always start fresh with DISABLE_AUTH_FALLBACK=true
      stdout:              "pipe",
      stderr:              "pipe",
      cwd:                 path.join(import.meta.dirname, "..", ".."),
    },
  ],
});
