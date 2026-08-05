/**
 * Clinical Notes — Phase 3 True Browser Tests
 *
 * Every test is a real browser UI test backed by a live API with
 * DISABLE_AUTH_FALLBACK=true.  Each test that does not exercise the
 * login form starts from a pre-authenticated session saved in globalSetup
 * (test.use({ storageState }) per describe block).
 *
 * ── Browser pair ─────────────────────────────────────────────────────────────
 * Playwright 1.38.0 + Chromium revision 1080 (NixOS-patched).
 * These are a matched pair (shipped together) — CDP protocol versions align.
 * Trace capture ("trace: on"), HAR recording, and standard locator.click()
 * all work without { force: true } workarounds.
 *
 * ── Session pre-authentication ───────────────────────────────────────────────
 * globalSetup creates session files for all 8 personas in e2e/sessions/.
 * The only tests that call loginViaUI are A-2 and B-1 (which specifically
 * exercise the login form).  All other tests use storageState.
 *
 * Rate-limit budget: globalSetup clears loopback rows before each of 8 logins.
 * A-2 adds 1 login, B-1 adds 1 login → final window count: 3 (well below 10).
 *
 * ── Evidence ─────────────────────────────────────────────────────────────────
 * Screenshots: saved to e2e/screenshots/
 * Traces:      playwright-results/ (one zip per test, includes network HAR)
 * HAR (E-1):   e2e/traces/e1-context-{a,b}.har
 */

import path from "path";
import fs   from "fs";
import { test, expect, type Page, type Browser, type BrowserContext } from "playwright/test";
import { SESSION_PATHS } from "./sessions.ts";

// ── Constants ────────────────────────────────────────────────────────────────

const BROWSER_SIGNED_NOTE_ID = "00000000-0000-4000-b000-000000000001";
const BROWSER_DRAFT_NOTE_ID  = "00000000-0000-4000-b000-000000000002";
const TEST_PATIENT_ID        = "00000000-0000-4000-a000-000000000099";
const _rawTestPwd = process.env.PHASE2D_TEST_PASSWORD;
if (!_rawTestPwd) {
  throw new Error(
    "[browser-spec] ABORT: PHASE2D_TEST_PASSWORD environment variable is required.\n" +
    "Set it to the fictitious browser-test account password. Do not use a real credential.\n" +
    "Do not hard-code a fallback.",
  );
}
const TEST_PWD = _rawTestPwd;

// USERS is kept for A-2 and B-1, which exercise the login form directly.
const USERS = {
  clinician: { email: "clinician@test.sunrise",  password: TEST_PWD },
  nurse:     { email: "nurse@test.sunrise",       password: TEST_PWD },
} as const;

// ── Screenshot helpers ────────────────────────────────────────────────────────

const screenshotDir = path.join(import.meta.dirname, "screenshots");
fs.mkdirSync(screenshotDir, { recursive: true });

let screenshotCounter = 0;

async function snap(page: Page, label: string): Promise<void> {
  screenshotCounter++;
  const n    = String(screenshotCounter).padStart(2, "0");
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const dest = path.join(screenshotDir, `${n}-${slug}.png`);
  await page.screenshot({ path: dest, fullPage: false });
  console.log(`[snap] ${dest}`);
}

// ── Login helper (A-2 and B-1 only) ──────────────────────────────────────────

/**
 * Submit the production login form and wait for the session to be established.
 * Only called in tests that specifically exercise the login UI (A-2, B-1).
 * All other tests load a pre-authenticated session via storageState.
 */
async function loginViaUI(
  page: Page,
  user: { email: string; password: string },
): Promise<void> {
  await page.goto("/");
  await expect(page.locator('[data-testid="production-login"]')).toBeVisible();
  await page.locator('[data-testid="email-input"]').fill(user.email);
  await page.locator('[data-testid="password-input"]').fill(user.password);
  // Standard click — Playwright 1.38.0 + chromium-1080 are a matched pair;
  // { force: true } is not needed.
  await page.locator('[data-testid="submit-btn"]').click();
  await expect(page.locator('[data-testid="production-login"]')).not.toBeVisible({
    timeout: 20_000,
  });
}

// ── SPA-ready helper ──────────────────────────────────────────────────────────

/**
 * Navigate to the SPA root and wait until React has fully bootstrapped.
 *
 * The SPA loads 50+ TypeScript modules via Vite's dev server.  When this is
 * the first (or warm-but-not-hot) load in a test-suite run, dynamic imports
 * can take 2–3 s.  `page.goto("/")` with the default waitUntil:"load" can
 * hang indefinitely in sequential test runs: Playwright's CDP "load" gate
 * never fires because the Vite dev server (running with hmr:false) does not
 * emit the right CDP lifecycle event after the initial load warms the module
 * cache.  React is running and making API calls (Dashboard → /api/alerts)
 * but the CDP "load" checkpoint stalls.
 *
 * Fix (two-part):
 *  1. Use waitUntil:"domcontentloaded" so page.goto resolves as soon as
 *     the HTML is fully parsed.  This fires long before all JS modules are
 *     fetched, but crucially it fires *after* the browser has received the
 *     response body and committed the navigation.  It never hangs (unlike
 *     "load", which stalls indefinitely when Vite's warm module cache
 *     returns 304 responses that don't re-trigger the CDP "load" lifecycle
 *     event in subsequent test contexts).
 *  2. Wait for the first successful /api/v1/auth/session response, which
 *     AuthContext only fires AFTER ALL dynamic imports have resolved and
 *     React has mounted.  Once this resolves, App.tsx's popstate listener
 *     is guaranteed to be registered before navigateToPatient fires.
 *
 * vite.playwright.config.ts: hmr:false ensures Vite never pushes a hot
 * update that would remount AuthContext mid-test, which previously caused
 * hundreds of csrf-token + auth/session pairs per second for the entire
 * 120 s test window (the "HMR storm").
 */
async function gotoAndAwaitReady(page: Page): Promise<void> {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // Gate 1 — React is mounted and has fired its auth check.
  // AuthContext only calls /auth/session after ALL dynamic imports have
  // resolved and the component has mounted.
  await page.waitForResponse(
    resp =>
      resp.url().includes("/api/v1/auth/session") && resp.status() < 400,
    { timeout: 30_000 },
  );

  // Gate 2 — productionSession is committed to React state.
  //
  // After /auth/session responds, AuthContext calls setProductionSession(data).
  // This triggers a key change on AppInner (keyed by productionSession.userId).
  // AppInner remounts, resetting selectedPatientId and activeScreen to their
  // defaults.  If navigateToPatient fires before this remount, the popstate
  // is silently discarded and PatientDetail never opens.
  //
  // /api/alerts/vitals is Dashboard's first useEffect call.  It only fires
  // after productionSession is fully committed, AppInner has remounted with
  // the real userId key, AND the Dashboard has rendered.  Waiting for it
  // guarantees the SPA is stable before we dispatch the popstate.
  //
  // .catch(): for tests that load an unauthenticated page (e.g. login-form
  // tests) gotoAndAwaitReady is not called, so this branch is unreachable
  // in practice; the catch is a safety net for future edge cases.
  await page
    .waitForResponse(
      resp =>
        resp.url().includes("/api/alerts/vitals") && resp.status() < 400,
      { timeout: 10_000 },
    )
    .catch(() => {
      // Non-fatal: if alerts/vitals never fires (session check returned a
      // non-Dashboard screen, or rate-limit returned 429) the auth/session
      // gate above is sufficient.
    });
}

// ── Navigation helper ─────────────────────────────────────────────────────────

/**
 * Navigate to PatientDetail via hash routing and dismiss any FlagChartAlert.
 *
 * Called by storageState tests after page.goto("/") loads the dashboard.
 * The pushState approach avoids a full page reload while staying on the
 * same authenticated origin.
 */
async function navigateToPatient(
  page: Page,
  patientId: string = TEST_PATIENT_ID,
): Promise<void> {
  await page.evaluate(
    ({ screen, patientId }) => {
      window.history.pushState({ screen, patientId }, "", "#" + screen);
      window.dispatchEvent(
        new PopStateEvent("popstate", {
          state:      { screen, patientId },
          bubbles:    false,
          cancelable: false,
        }),
      );
    },
    { screen: "PatientDetail", patientId },
  );

  // In production mode PatientDetail returns a loading spinner until the server
  // patient record arrives (GET /v1/patients/:id).  Neither the FlagChartAlert
  // nor the tab bar renders until serverPatient is set.
  //
  // Mandatory: patient chart must reach a definite loaded state before any step
  // proceeds.  Using a comma-OR selector waits for EITHER the tab bar (chart
  // loaded successfully) OR the access-denied UI (server returned 403/404 for
  // this persona).  Both are definite final states.  If neither appears within
  // the timeout the test fails immediately — no .catch swallows the timeout.
  await page.waitForSelector(
    '[data-testid="tab-progress-notes"], [data-testid="access-denied"]',
    { timeout: 10_000 },
  );

  // Dismiss FlagChartAlert if it appeared (AMA-risk patient shows it on every visit).
  // locator.isVisible() returns a boolean and does not throw; no .catch needed.
  const acknowledge = page.locator('[data-testid="chart-alert-acknowledge"]');
  if (await acknowledge.isVisible({ timeout: 1000 })) {
    await acknowledge.click();
    await expect(acknowledge).not.toBeVisible({ timeout: 5000 });
  }
}

/**
 * Click the Progress Notes tab and confirm the switch reached a definite final state.
 *
 * Retries up to 3 times to handle React re-renders that may fire at the same
 * moment the click is sent (e.g. when the patient API response arrives).
 *
 * Approved final states (exactly one must be reached):
 *   A. [data-testid="new-note-btn"]   — tab active, user has write access
 *   B. [data-testid="access-denied"]  — explicit access-denied UI visible
 *   C. [data-testid="tab-progress-notes"][aria-selected="true"]
 *                                      — tab selected (read-only user with note list)
 *
 * After all retry attempts, throws unless one approved state is reached.
 * Does NOT use .catch(() => null/false/{}) on mandatory final-state selectors.
 */
async function openProgressNotesTab(page: Page): Promise<void> {
  // Secondary dismiss in case FlagChartAlert appeared after navigateToPatient returned
  // (e.g. the patient API response arrived just after the primary dismiss window closed).
  // locator.isVisible() returns a boolean and does not throw; no .catch needed.
  const ack = page.locator('[data-testid="chart-alert-acknowledge"]');
  if (await ack.isVisible({ timeout: 3000 })) {
    await ack.click();
    await expect(ack).not.toBeVisible({ timeout: 5000 });
  }

  const tab = page.locator('[data-testid="tab-progress-notes"]');

  // Approved final states: new-note-btn (write access) OR access-denied UI.
  // Both are definite: if neither appears within 3 s, the attempt failed.
  const APPROVED_SELECTOR =
    '[data-testid="new-note-btn"], [data-testid="access-denied"]';

  let reachedApprovedState = false;

  for (let attempt = 0; attempt < 3; attempt++) {
    await tab.click();
    // Use .then/.catch only to convert the selector wait into a boolean for
    // the retry loop; the final throw below enforces the mandatory requirement.
    const reached = await page
      .waitForSelector(APPROVED_SELECTOR, { timeout: 3_000 })
      .then(() => true)
      .catch(() => false);
    if (reached) {
      reachedApprovedState = true;
      break;
    }
    if (attempt < 2) await page.waitForTimeout(200);
  }

  // Mandatory: after all retry attempts, one approved final state must be visible.
  // Throwing here (not swallowing) ensures selector/navigation failures surface.
  if (!reachedApprovedState) {
    // Capture what is visible for diagnosis before failing.
    const bodyText = await page.locator("body").innerText().catch(() => "(unavailable)");
    throw new Error(
      `openProgressNotesTab: neither '${APPROVED_SELECTOR}' became visible after 3 attempts.\n` +
      `The Progress Notes tab did not reach a definite final state.\n` +
      `Body text (first 500 chars): ${bodyText.slice(0, 500)}`,
    );
  }

  // Brief settle wait — app has continuous polling so networkidle is never
  // reached; a fixed pause is the honest substitute.
  await page.waitForTimeout(300);
}

// ─────────────────────────────────────────────────────────────────────────────
// Flow A — Production login page and clinician login verification
// (no storageState — these tests exercise the unauthenticated state)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Flow A — Production login page and clinician login verification", () => {
  test("A-1: production login page renders without demo UI", async ({ page }) => {
    await page.goto("/");
    const login = page.locator('[data-testid="production-login"]');
    await expect(login).toBeVisible();
    // DemoBanner must NOT be present in production data mode.
    // App.tsx gates it: {DATA_MODE === 'demo' && <DemoBanner />}
    // Playwright frontend starts with VITE_SUNRISE_DATA_MODE=production → no banner.
    await expect(page.locator('[data-testid="demo-banner"]')).not.toBeVisible();
    await expect(page.locator('text=Skip to Dashboard')).not.toBeVisible();
    await expect(page.locator('text=Demo Mode')).not.toBeVisible();
    await snap(page, "login-page-production-mode");
  });

  test("A-2: clinician logs in and reaches authenticated view", async ({ page }) => {
    await loginViaUI(page, USERS.clinician);
    await expect(page.locator('[data-testid="production-login"]')).not.toBeVisible();
    // Production mode: static role badge visible, no demo role-switcher button
    const roleBadge = page.locator('[data-testid="role-display"]');
    await expect(roleBadge).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="role-switcher-btn"]')).not.toBeVisible();
    // Role badge must show the exact server-session role label — not the demo default.
    // clinician@test.sunrise has roleId="certified_clinician" → label "Certified Clinician".
    const roleLabel = page.locator('[data-testid="role-display-label"]');
    await expect(roleLabel).toHaveText("Certified Clinician");
    // No demo UI elements remain after production login
    await expect(page.locator('text=Demo Mode')).not.toBeVisible();
    await expect(page.locator('text=Skip to Dashboard')).not.toBeVisible();
    // No demo wording on AccessDenied or any visible surface
    await expect(page.locator('text=This demo uses role switching')).not.toBeVisible();
    await expect(page.locator('text=fictitious demo')).not.toBeVisible();
    await snap(page, "clinician-dashboard-after-login");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow A — Clinician: create, save, and sign a progress note
// (pre-authenticated session — clinician@test.sunrise)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Flow A — Clinician: create, save, and sign a progress note", () => {
  test.use({ storageState: SESSION_PATHS.clinician });
  // HAR capture for main clinician workflow evidence.
  // Playwright 1.38.0: recordHar must go inside contextOptions (top-level recordHar
  // in test.use is a BrowserContextOptions key but the test fixture only reads the
  // known PlaywrightTestOptions; contextOptions passes the rest through verbatim).
  test.use({ contextOptions: { recordHar: { path: path.join(import.meta.dirname, "har", "flow-a-clinician.har"), omitContent: true } } });

  test("A-3: Progress Notes tab shows empty state for new patient session", async ({ page }) => {
    await gotoAndAwaitReady(page);
    await navigateToPatient(page);
    await openProgressNotesTab(page);
    await snap(page, "progress-notes-tab-initial-state");
    await expect(page.locator('[data-testid="note-content"]')).not.toBeVisible();
  });

  test("A-4: clinician opens compose panel with '+ New Note'", async ({ page }) => {
    await gotoAndAwaitReady(page);
    await navigateToPatient(page);
    await openProgressNotesTab(page);
    await page.locator('[data-testid="new-note-btn"]').click();
    await expect(page.locator('[data-testid="note-content"]')).toBeVisible();
    await snap(page, "compose-panel-open-new-note");
  });

  test("A-5: clinician types content and saves as draft", async ({ page }) => {
    await gotoAndAwaitReady(page);
    await navigateToPatient(page);
    await openProgressNotesTab(page);
    await page.locator('[data-testid="new-note-btn"]').click();

    const content = "Flow-A browser test draft — clinician progress note created via Playwright.";
    await page.locator('[data-testid="note-content"]').fill(content);

    await expect(page.locator('[data-testid="save-draft-btn"]')).not.toHaveClass(/opacity-40/);
    await snap(page, "draft-note-dirty-before-save");

    await page.locator('[data-testid="save-draft-btn"]').click();
    // Brief settle wait — app has continuous polling so networkidle is never
  // reached; a fixed pause is the honest substitute.
  await page.waitForTimeout(300);
    await snap(page, "draft-saved-note-appears-in-list");

    await expect(page.locator('[data-status="draft"]').first()).toBeVisible();
  });

  test("A-6: clinician reloads and draft persists; can edit and sign", async ({ page }) => {
    await gotoAndAwaitReady(page);
    await navigateToPatient(page);
    await openProgressNotesTab(page);
    await page.locator('[data-testid="new-note-btn"]').click();
    await page.locator('[data-testid="note-content"]').fill("Flow-A persist test draft content.");
    await page.locator('[data-testid="save-draft-btn"]').click();
    // Brief settle wait — app has continuous polling so networkidle is never
  // reached; a fixed pause is the honest substitute.
  await page.waitForTimeout(300);

    // Navigate away and back to simulate a reload.
    await page.evaluate(() => {
      window.history.pushState({ screen: "PatientList" }, "", "#PatientList");
      window.dispatchEvent(new PopStateEvent("popstate", { state: { screen: "PatientList" } }));
    });
    // Brief settle wait — app has continuous polling so networkidle is never
  // reached; a fixed pause is the honest substitute.
  await page.waitForTimeout(300);
    await navigateToPatient(page);
    await openProgressNotesTab(page);

    const draftCard = page.locator('[data-status="draft"]').first();
    await expect(draftCard).toBeVisible();
    await snap(page, "draft-persisted-after-navigation");

    await draftCard.click();
    await expect(page.locator('[data-testid="note-content"]')).toBeVisible();

    await page.locator('[data-testid="note-content"]').fill(
      "Flow-A final signed content — edited for signing via browser test.",
    );
    await snap(page, "draft-opened-for-signing");

    await expect(page.locator('[data-testid="sign-lock-btn"]')).not.toHaveClass(/opacity-40/);
    await page.locator('[data-testid="sign-lock-btn"]').click();
    // Brief settle wait — app has continuous polling so networkidle is never
  // reached; a fixed pause is the honest substitute.
  await page.waitForTimeout(300);
    await snap(page, "note-signed-read-only-state");

    await expect(page.locator('[data-status="signed"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="note-content"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow B — Nurse: login verification
// (no storageState — exercises the login form for the nurse persona)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Flow B — Nurse: login verification", () => {
  test("B-1: nurse logs in and can reach patient chart", async ({ page }) => {
    await loginViaUI(page, USERS.nurse);
    // Production role label must show "Nursing" for nurse@test.sunrise.
    // As with A-2, productionSession.roleIds[0] drives the displayed label;
    // the demo RoleContext default must not bleed into the authenticated view.
    const nurseRoleBadge = page.locator('[data-testid="role-display"]');
    await expect(nurseRoleBadge).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="role-display-label"]')).toHaveText("Nursing");
    await expect(page.locator('text=Demo Mode')).not.toBeVisible();
    await navigateToPatient(page);
    await openProgressNotesTab(page);
    await snap(page, "nurse-progress-notes-tab");
    await expect(page.locator('[data-testid="tab-progress-notes"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow B — Nurse: nursing note workflow
// (pre-authenticated session — nurse@test.sunrise)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Flow B — Nurse: create and sign a nursing note", () => {
  test.use({ storageState: SESSION_PATHS.nurse });

  test("B-2: nurse creates a nursing note and signs it", async ({ page }) => {
    await gotoAndAwaitReady(page);
    await navigateToPatient(page);
    await openProgressNotesTab(page);
    await page.locator('[data-testid="new-note-btn"]').click();

    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption("nursing_note");

    await page.locator('[data-testid="note-content"]').fill(
      "Flow-B nursing note — created by nurse@test.sunrise via Playwright browser test.",
    );
    await snap(page, "nurse-nursing-note-composed");

    await page.locator('[data-testid="sign-lock-btn"]').click();
    // Brief settle wait — app has continuous polling so networkidle is never
  // reached; a fixed pause is the honest substitute.
  await page.waitForTimeout(300);
    await snap(page, "nurse-nursing-note-signed");

    await expect(page.locator('[data-status="signed"]').first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow C — Supervisor: void a signed note
// (pre-authenticated session — org-admin@test.sunrise / clinical_supervisor role)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Flow C — Supervisor: void a signed note with validation", () => {
  test.use({ storageState: SESSION_PATHS.supervisor });

  test("C-1: supervisor sees Void button on pre-seeded signed note", async ({ page }) => {
    await gotoAndAwaitReady(page);
    await navigateToPatient(page);
    await openProgressNotesTab(page);

    const voidBtn = page.locator(`[data-testid="void-note-btn-${BROWSER_SIGNED_NOTE_ID}"]`);
    await expect(voidBtn).toBeVisible({ timeout: 15_000 });
    await snap(page, "supervisor-void-button-visible");
  });

  test("C-2: void modal opens; short reason is rejected", async ({ page }) => {
    await gotoAndAwaitReady(page);
    await navigateToPatient(page);
    await openProgressNotesTab(page);

    await page.locator(`[data-testid="void-note-btn-${BROWSER_SIGNED_NOTE_ID}"]`).click();

    const voidReason = page.locator('[data-testid="void-reason-input"]');
    await expect(voidReason).toBeVisible();
    await snap(page, "void-modal-open-empty");

    await voidReason.fill("No");
    const confirmBtn = page.locator('[data-testid="confirm-void-btn"]');
    await expect(confirmBtn).toBeDisabled();
    await snap(page, "void-confirm-btn-disabled-short-reason");
  });

  test("C-3: valid void reason enables Confirm; submitting voids the note", async ({ page }) => {
    await gotoAndAwaitReady(page);
    await navigateToPatient(page);
    await openProgressNotesTab(page);

    const voidBtn = page.locator(`[data-testid="void-note-btn-${BROWSER_SIGNED_NOTE_ID}"]`);
    await expect(voidBtn).toBeVisible({ timeout: 15_000 });
    await voidBtn.click();

    const voidReason = page.locator('[data-testid="void-reason-input"]');
    await expect(voidReason).toBeVisible();
    await voidReason.fill("Clinical error — voided by supervisor in Playwright browser test run.");

    const confirmBtn = page.locator('[data-testid="confirm-void-btn"]');
    await expect(confirmBtn).not.toBeDisabled();
    await snap(page, "void-reason-entered-confirm-enabled");

    await confirmBtn.click();
    // Brief settle wait — app has continuous polling so networkidle is never
  // reached; a fixed pause is the honest substitute.
  await page.waitForTimeout(300);
    await snap(page, "note-voided-status-shown");

    await expect(page.locator('[data-status="voided"]').first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow D — Authorization denials
// Each sub-describe uses the appropriate persona's storageState.
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Flow D — Authorization denials", () => {
  // HAR capture for authorization-denial workflow evidence.
  // Playwright 1.38.0: recordHar must go inside contextOptions (same reason as
  // Flow A — the test fixture reads contextOptions and merges into the context).
  test.use({ contextOptions: { recordHar: { path: path.join(import.meta.dirname, "har", "flow-d-auth-denial.har"), omitContent: true } } });

  // ── Shared denial assertion helper ──────────────────────────────────────────
  // Verifies 11 required denial properties for personas that cannot access the
  // patient chart (no patient.chart.view or cross-facility restriction):
  //   1. The protected patient API request occurred
  //   2. It returned the exact expected denial status (403 or 404)
  //   3. The explicit access-denied UI is visible (data-testid="access-denied")
  //   4. New-note (create) control is absent
  //   5. Note content (edit) control is absent
  //   6. Save-draft (edit) control is absent
  //   7. Sign control is absent
  //   8. Void control is absent (implied by no signed notes visible)
  //   9. The page is not blank
  //  10. The page is not stuck loading
  //  11. No uncaught browser errors (checked by caller)
  //
  // Mandatory API assertion pattern (no .catch — if API call is absent the test fails):
  //   page.request.get() goes through the Vite proxy to the test API on port 8099.
  //   This guarantees the server-side authorization check actually fired.
  async function assertChartAccessDenied(
    page: Page,
    snapLabel: string,
  ): Promise<void> {
    // 1+2: Mandatory server-side authorization check.
    // page.request shares the page's cookie jar (session cookie) so the request
    // is authenticated as the current persona.  The server must reject it with
    // 403 or 404 — no .catch, no conditional — the assertion must hold.
    const patientApiResp = await page.request.get(
      `/api/v1/patients/${TEST_PATIENT_ID}`,
      { headers: { Accept: "application/json" } },
    );
    expect(
      [403, 404],
      `Patient API returned ${patientApiResp.status()}, expected 403 or 404`,
    ).toContain(patientApiResp.status());

    await navigateToPatient(page);
    await page.waitForTimeout(300);
    await snap(page, snapLabel);

    // 3: Explicit denial UI must be visible (rendered by AccessDenied component or
    //    PatientDetail's serverPatientForbidden gate for 403/404 responses)
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible({ timeout: 10_000 });

    // 4–11: All clinical note controls absent
    await expect(page.locator('[data-testid="new-note-btn"]')).not.toBeVisible();    // 8: create
    await expect(page.locator('[data-testid="note-content"]')).not.toBeVisible();    // 7: clinical content
    await expect(page.locator('[data-testid="save-draft-btn"]')).not.toBeVisible();  // 9: edit
    await expect(page.locator('[data-testid="sign-lock-btn"]')).not.toBeVisible();   // 10: sign
    // 11: void controls — the locator attribute prefix matches all void buttons
    await expect(page.locator('[data-testid^="void-note-btn-"]')).not.toBeVisible(); // 11: void

    // 5: Page is not blank (denial UI is the proof — access-denied asserted above)
    await expect(page.locator('body')).not.toBeEmpty();
    // 6: Page is not stuck loading
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();

    // No demo wording in the access-denied UI
    await expect(page.locator('text=This demo uses role switching')).not.toBeVisible();
    await expect(page.locator('text=fictitious demo')).not.toBeVisible();
    await expect(page.locator('text=Demo Mode')).not.toBeVisible();
  }

  test.describe("D-1: other-facility / unassigned clinician (cross-facility access denied)", () => {
    test.use({ storageState: SESSION_PATHS.otherFacility });

    test("D-1: other-facility clinician cannot access Facility-1 patient chart", async ({ page }) => {
      const pageErrors: Error[] = [];
      page.on("pageerror", e => pageErrors.push(e));

      await gotoAndAwaitReady(page);

      // 1+2: Mandatory server-side authorization check via direct API call.
      // The other-facility persona's session cookie is shared by page.request —
      // the server must reject cross-facility access with 403 or 404.
      const patientApiResp = await page.request.get(
        `/api/v1/patients/${TEST_PATIENT_ID}`,
        { headers: { Accept: "application/json" } },
      );
      expect(
        [403, 404],
        `Patient API returned ${patientApiResp.status()}, expected 403 or 404`,
      ).toContain(patientApiResp.status());

      await navigateToPatient(page);
      await page.waitForTimeout(500);
      await snap(page, "other-facility-patient-access-denied");

      // 3: Explicit access-denied UI must be visible.
      // PatientDetail renders data-testid="access-denied" when the patient API
      // returns 403 or 404 (serverPatientForbidden state).
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible({ timeout: 10_000 });

      // 4–8: No clinical note controls
      await expect(page.locator('[data-testid="new-note-btn"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="note-content"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="save-draft-btn"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="sign-lock-btn"]')).not.toBeVisible();

      // 10: Page not stuck loading
      await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible({ timeout: 5_000 });

      // No demo wording in denial UI
      await expect(page.locator('text=This demo uses role switching')).not.toBeVisible();

      // 11: No uncaught browser errors
      expect(pageErrors.map(e => e.message), "Unexpected browser errors").toHaveLength(0);
    });
  });

  test.describe("D-2: security-admin (no patient.chart.view)", () => {
    test.use({ storageState: SESSION_PATHS.securityAdmin });

    test("D-2: security-admin has no patient.chart.view — PatientDetail shows AccessDenied", async ({ page }) => {
      const pageErrors: Error[] = [];
      page.on("pageerror", e => pageErrors.push(e));

      await gotoAndAwaitReady(page);
      await assertChartAccessDenied(page, "security-admin-patient-access-denied");

      // 6: No uncaught browser errors
      expect(pageErrors.map(e => e.message), "Unexpected browser errors").toHaveLength(0);
    });
  });

  test.describe("D-3: HR (no patient.chart.view)", () => {
    test.use({ storageState: SESSION_PATHS.hr });

    test("D-3: HR has no patient.chart.view — PatientDetail shows AccessDenied", async ({ page }) => {
      const pageErrors: Error[] = [];
      page.on("pageerror", e => pageErrors.push(e));

      await gotoAndAwaitReady(page);
      await assertChartAccessDenied(page, "hr-patient-access-denied");

      // 6: No uncaught browser errors
      expect(pageErrors.map(e => e.message), "Unexpected browser errors").toHaveLength(0);
    });
  });

  test.describe("D-4: billing staff (no Progress Notes compose, no clinical_note.create)", () => {
    test.use({ storageState: SESSION_PATHS.billing });

    test("D-4: billing staff cannot access Progress Notes compose", async ({ page }) => {
      const pageErrors: Error[] = [];
      page.on("pageerror", e => pageErrors.push(e));

      await gotoAndAwaitReady(page);

      // 1+2: Mandatory API assertion — billing staff lacks clinical_note.create.
      // Attempt to POST a new progress note as the billing persona — the server
      // must return 403.  page.request shares the billing persona's session cookie
      // (loaded from storageState at context creation).  No .catch — if the
      // request never fires or returns the wrong status the test fails explicitly.
      const csrfResBilling = await page.request.get("/api/v1/auth/csrf-token");
      const { csrfToken: csrfBilling } = await csrfResBilling.json() as { csrfToken: string };
      const createResp = await page.request.post(
        `/api/v1/patients/${TEST_PATIENT_ID}/clinical-notes`,
        {
          headers: { "X-CSRF-Token": csrfBilling },
          data: { noteType: "progress_note", content: "D-4 billing authorization probe." },
        },
      );
      // The authorization check returns an opaque 403 or 404 denial
      // (AuthorizationError → 404 to avoid revealing endpoint existence;
      //  explicit permission-check denial → 403).  Both are acceptable.
      expect(
        [403, 404],
        `Clinical notes POST returned ${createResp.status()}, expected 403 or 404`,
      ).toContain(createResp.status());

      await navigateToPatient(page);
      await page.waitForTimeout(300);
      await snap(page, "billing-patient-access-denied");

      // Billing staff lacks clinical_note.create — new-note button must be absent
      await expect(page.locator('[data-testid="new-note-btn"]')).not.toBeVisible();
      // Note controls must be absent
      await expect(page.locator('[data-testid="note-content"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="save-draft-btn"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="sign-lock-btn"]')).not.toBeVisible();
      // Page is not blank (some UI element is present) and not stuck loading
      await expect(page.locator('body')).not.toBeEmpty();
      await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();

      // 6: No uncaught browser errors
      expect(pageErrors.map(e => e.message), "Unexpected browser errors").toHaveLength(0);
    });
  });

  test.describe("D-5: multi-facility clinician (cannot edit another author's draft)", () => {
    test.use({ storageState: SESSION_PATHS.multiFac });

    test("D-5: multi-facility clinician cannot edit another author's draft via API", async ({ page }) => {
      const pageErrors: Error[] = [];
      page.on("pageerror", e => pageErrors.push(e));

      await gotoAndAwaitReady(page);
      await navigateToPatient(page);
      await openProgressNotesTab(page);

      const draftCard = page.locator(`[data-testid="note-card-${BROWSER_DRAFT_NOTE_ID}"]`);
      await expect(draftCard).toBeVisible({ timeout: 15_000 });
      await draftCard.click();
      await expect(page.locator('[data-testid="note-content"]')).toBeVisible();
      await page.locator('[data-testid="note-content"]').fill("Multi-facility edit attempt — must fail.");

      // 1+2: Mandatory API assertion — set up response capture BEFORE the save click,
      // then await without .catch so the test fails if the request never fires.
      const saveRespPromise = page.waitForResponse(
        r =>
          r.url().includes(`/api/v1/patients/${TEST_PATIENT_ID}/clinical-notes`) &&
          r.request().method() === "PATCH",
        { timeout: 10_000 },
      );
      await page.locator('[data-testid="save-draft-btn"]').click();
      const saveResp = await saveRespPromise;

      await page.waitForTimeout(300);
      await snap(page, "multi-facility-edit-another-author-denied");

      // The PATCH must return 403 — mandatory, no conditional
      expect(
        saveResp.status(),
        `Expected PATCH to return 403; got ${saveResp.status()}`,
      ).toBe(403);

      // Compose panel stays visible after denial (error shown inline)
      await expect(page.locator('[data-testid="note-content"]')).toBeVisible();

      // 6: No uncaught browser errors
      expect(pageErrors.map(e => e.message), "Unexpected browser errors").toHaveLength(0);
    });
  });

  test.describe("D-6: another author (multi-facility) cannot sign another author's draft", () => {
    test.use({ storageState: SESSION_PATHS.multiFac });

    test("D-6: multi-facility clinician cannot sign another author's draft via API", async ({ page }) => {
      const pageErrors: Error[] = [];
      page.on("pageerror", e => pageErrors.push(e));

      await gotoAndAwaitReady(page);
      await navigateToPatient(page);
      await openProgressNotesTab(page);

      // 1+2: Mandatory direct API sign attempt — no UI button click, no .catch.
      // page.request shares the multi-facility persona's session cookie.
      // We omit the explicit Content-Type header — Playwright automatically sets
      // Content-Type: application/json when `data` is a plain object, which
      // ensures the body is JSON-serialized (not passed as a raw reference).
      // The server must reject the sign attempt with 403/404 (clinical_note.sign_own
      // only permits signing notes the authenticated user authored; an opaque
      // AuthorizationError maps to 404, an OwnershipError maps to 403).
      const csrfRes = await page.request.get("/api/v1/auth/csrf-token");
      const { csrfToken: csrf } = await csrfRes.json() as { csrfToken: string };

      const signResp = await page.request.post(
        `/api/v1/patients/${TEST_PATIENT_ID}/clinical-notes/${BROWSER_DRAFT_NOTE_ID}/sign`,
        {
          // Only non-content headers — Playwright infers Content-Type from `data`
          headers: { "X-CSRF-Token": csrf },
          // expectedVersion is required by signNoteSchema; any positive integer
          // passes schema validation and lets the server reach the ownership check.
          data: { expectedVersion: 1 },
        },
      );

      await snap(page, "multi-facility-sign-another-author-denied");

      // Sign must be denied — mandatory, no conditional
      expect(
        [403, 404],
        `Expected POST /sign to return 403 or 404; got ${signResp.status()}`,
      ).toContain(signResp.status());

      // The draft note must NOT have become signed (status attribute check,
      // not a global query — Flow A signs a separate note so checking for any
      // [data-status="signed"] card would be a false positive).
      // Mandatory: the seeded draft note must be visible and must remain draft
      // (not signed) after the cross-facility sign attempt was denied.
      const draftCard = page.locator(`[data-testid="note-card-${BROWSER_DRAFT_NOTE_ID}"]`);
      await expect(draftCard).toBeVisible({ timeout: 5_000 });
      await expect(draftCard).not.toHaveAttribute("data-status", "signed", { timeout: 3_000 });

      // 11: No uncaught browser errors
      expect(pageErrors.map(e => e.message), "Unexpected browser errors").toHaveLength(0);
    });
  });

  test.describe("D-7: original author without void permission (clinician, no clinical_note.void)", () => {
    test.use({ storageState: SESSION_PATHS.clinician });

    test("D-7: clinician (no clinical_note.void) cannot void a signed note", async ({ page }) => {
      const pageErrors: Error[] = [];
      page.on("pageerror", e => pageErrors.push(e));

      await gotoAndAwaitReady(page);
      await navigateToPatient(page);
      await openProgressNotesTab(page);

      // UI assertion: void button must NOT be rendered for a clinician without clinical_note.void
      await expect(
        page.locator(`[data-testid="void-note-btn-${BROWSER_SIGNED_NOTE_ID}"]`),
      ).not.toBeVisible({ timeout: 5_000 });

      // The signed note card must be visible (page is not blank, note exists)
      await expect(
        page.locator(`[data-testid="note-card-${BROWSER_SIGNED_NOTE_ID}"]`),
      ).toBeVisible({ timeout: 10_000 });

      await snap(page, "clinician-no-void-btn");

      // 1+2: Mandatory direct API void attempt — proves server-side enforcement,
      // not merely the absence of a UI button.
      // page.request shares the clinician's session cookie.
      // We omit the explicit Content-Type header — Playwright automatically sets
      // Content-Type: application/json when `data` is a plain object.
      // The clinician lacks clinical_note.void; the server's authorize() check
      // fires before the note-status check, so the voided state of the note
      // (voided by C-3) does not affect the result.
      const csrfResD7 = await page.request.get("/api/v1/auth/csrf-token");
      const { csrfToken: csrfD7 } = await csrfResD7.json() as { csrfToken: string };

      const voidResp = await page.request.post(
        `/api/v1/patients/${TEST_PATIENT_ID}/clinical-notes/${BROWSER_SIGNED_NOTE_ID}/void`,
        {
          // Only non-content headers — Playwright infers Content-Type from `data`
          headers: { "X-CSRF-Token": csrfD7 },
          // Both fields required by voidNoteSchema; expectedVersion can be any
          // positive integer because the authorization check fires before the
          // optimistic-lock check.
          data: {
            voidReason:      "D-7 browser test — no clinical_note.void permission.",
            expectedVersion: 1,
          },
        },
      );

      // Server must deny the void — mandatory, no conditional.
      // AuthorizationError (missing clinical_note.void) → 404 opaque denial;
      // OwnershipError → 403.  Both are acceptable denial codes.
      expect(
        [403, 404],
        `Expected POST /void to return 403 or 404; got ${voidResp.status()}`,
      ).toContain(voidResp.status());

      // 11: No uncaught browser errors
      expect(pageErrors.map(e => e.message), "Unexpected browser errors").toHaveLength(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow E — Concurrency: stale-version conflict → 409
// (pre-authenticated sessions via browser.newContext({ storageState }) — no logins)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Flow E — Concurrency: stale-version conflict on draft", () => {
  test("E-1: two concurrent editors — second write receives stale-version conflict", async ({
    browser,
  }: { browser: Browser }) => {
    // E-1 spins up two real browser contexts with HAR recording, then runs a
    // multi-step concurrent-save flow.  Give it 3 minutes so HAR overhead and
    // the openProgressNotesTab retry loop (up to 9.6 s per context) don't burn
    // through the default 120 s budget.
    test.setTimeout(180_000);

    // HAR capture is re-enabled.  Playwright 1.38.0 + chromium-1080 are a matched
    // pair — CDP Network.enable works without deadlocking fetch().
    const harDir = path.join(import.meta.dirname, "traces");
    fs.mkdirSync(harDir, { recursive: true });

    // Both contexts load the clinician's pre-authenticated session.
    // loginViaUI is not called — no login rate-limit budget is consumed.
    const ctxA: BrowserContext = await browser.newContext({
      storageState: SESSION_PATHS.clinician,
      recordHar: {
        path:    path.join(harDir, "e1-context-a.har"),
        content: "omit",    // omit response bodies to keep file size small
      },
    });
    const ctxB: BrowserContext = await browser.newContext({
      storageState: SESSION_PATHS.clinician,
      recordHar: {
        path:    path.join(harDir, "e1-context-b.har"),
        content: "omit",
      },
    });

    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      // Both pages navigate to the dashboard (already authenticated).
      // gotoAndAwaitReady waits for the auth/session response which proves
      // React has fully bootstrapped and the popstate listener is registered.
      await Promise.all([
        gotoAndAwaitReady(pageA),
        gotoAndAwaitReady(pageB),
      ]);

      // Parallelise setup so both contexts reach Progress Notes simultaneously.
      // The retry loops in openProgressNotesTab can each cost ≤9.6 s; running
      // them concurrently keeps the total below 120 s.
      await Promise.all([
        (async () => {
          await navigateToPatient(pageA);
          await openProgressNotesTab(pageA);
        })(),
        (async () => {
          await navigateToPatient(pageB);
          await openProgressNotesTab(pageB);
        })(),
      ]);

      // Both open the pre-seeded draft note (version=1).
      const draftCardA = pageA.locator(`[data-testid="note-card-${BROWSER_DRAFT_NOTE_ID}"]`);
      const draftCardB = pageB.locator(`[data-testid="note-card-${BROWSER_DRAFT_NOTE_ID}"]`);

      await expect(draftCardA).toBeVisible({ timeout: 15_000 });
      await expect(draftCardB).toBeVisible({ timeout: 15_000 });

      await draftCardA.click();
      await expect(pageA.locator('[data-testid="note-content"]')).toBeVisible();
      await draftCardB.click();
      await expect(pageB.locator('[data-testid="note-content"]')).toBeVisible();

      await snap(pageA, "concurrency-both-contexts-opened-draft");

      // Context A saves first (version 1 → 2).
      await pageA.locator('[data-testid="note-content"]').fill(
        "Context-A write — first writer wins, version should increment to 2.",
      );
      await pageA.locator('[data-testid="save-draft-btn"]').click();
      await pageA.waitForTimeout(300);
      await snap(pageA, "concurrency-context-a-saved-successfully");

      // Context B saves with stale version=1 → must receive 409 conflict.
      await pageB.locator('[data-testid="note-content"]').fill(
        "Context-B stale write — expectedVersion=1 after A already incremented to 2.",
      );
      await pageB.locator('[data-testid="save-draft-btn"]').click();
      await pageB.waitForTimeout(300);
      await snap(pageB, "concurrency-context-b-conflict-shown");

      await expect(
        pageB.locator("text=modified elsewhere"),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      // Closing contexts flushes the HAR files to disk.
      await ctxA.close();
      await ctxB.close();
    }
  });
});
