/**
 * Playwright configuration for Phase 3 real-browser smoke tests.
 *
 * Uses a separate Vite dev server (vite.playwright.config.ts) that:
 *   - Starts the frontend in production-data mode (VITE_SUNRISE_DATA_MODE=production)
 *   - Proxies /api/* to the already-running API server on localhost:8080
 *
 * Pre-conditions:
 *   - API server must already be running: `pnpm --filter @workspace/api-server run dev`
 *   - DATABASE_URL and PHASE2D_TEST_PASSWORD must be set in the environment.
 *
 * Run: pnpm --filter @workspace/sunrise-os exec playwright test
 */

import { defineConfig, devices } from "playwright/test";
import path from "path";

const PLAYWRIGHT_PORT = 23456;

export default defineConfig({
  testDir: path.join(import.meta.dirname, "e2e"),
  testMatch: "**/clinical-notes-p3-browser.spec.ts",
  globalSetup: path.join(import.meta.dirname, "e2e", "global-setup.ts"),
  // Playwright cannot resolve composite-project references in the sunrise-os tsconfig;
  // point it to the e2e-local tsconfig which has no external references.
  tsconfig: path.join(import.meta.dirname, "e2e", "tsconfig.json"),
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // Sequential: tests share a DB and may depend on each other.
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  outputDir: path.join(import.meta.dirname, "playwright-results"),

  use: {
    baseURL: `http://localhost:${PLAYWRIGHT_PORT}`,
    headless: true,
    screenshot: "on",
    trace: "on",
    video: "off",
    // Use the Replit-provided Chromium binary.
    launchOptions: {
      executablePath:
        process.env.CHROMIUM_PATH ??
        "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
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
        "--single-process",
      ],
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // Run from workspace root; vite is invoked inside the package via --filter exec.
    command: [
      `PORT=${PLAYWRIGHT_PORT}`,
      `VITE_SUNRISE_DATA_MODE=production`,
      `pnpm --filter @workspace/sunrise-os exec`,
      `vite --config vite.playwright.config.ts`,
    ].join(" "),
    port: PLAYWRIGHT_PORT,
    timeout: 120_000,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    cwd: path.join(import.meta.dirname, "..", ".."),
  },
});
