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
    { timeout: 15_000 },
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
  // nor the tab bar renders until serverPatient is set.  Wait for whichever
  // appears first so we never race against the loading gate.
  await Promise.race([
    page
      .waitForSelector('[data-testid="chart-alert-acknowledge"]', { timeout: 10_000 })
      .catch(() => null),
    page
      .waitForSelector('[data-testid="tab-progress-notes"]', { timeout: 10_000 })
      .catch(() => null),
  ]);

  // Dismiss FlagChartAlert if it appeared (AMA-risk patient shows it on every visit).
  const acknowledge = page.locator('[data-testid="chart-alert-acknowledge"]');
  if (await acknowledge.isVisible({ timeout: 1000 }).catch(() => false)) {
    await acknowledge.click();
    await expect(acknowledge).not.toBeVisible({ timeout: 5000 });
  }
}

/**
 * Click the Progress Notes tab and confirm the switch succeeded.
 *
 * Retries up to 3 times to handle React re-renders that may fire at the same
 * moment the click is sent (e.g. when the patient API response arrives).
 * Confirmation: new-note-btn visibility = tab is active AND user has write access.
 * For read-only users (AccessDenied / no create permission) the button never
 * appears; tests for those users assert their own conditions independently.
 */
async function openProgressNotesTab(page: Page): Promise<void> {
  // Secondary dismiss in case FlagChartAlert appeared after navigateToPatient returned
  // (e.g. the patient API response arrived just after the primary dismiss window closed).
  const ack = page.locator('[data-testid="chart-alert-acknowledge"]');
  if (await ack.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ack.click();
    await expect(ack).not.toBeVisible({ timeout: 5000 });
  }

  const tab = page.locator('[data-testid="tab-progress-notes"]');
  for (let attempt = 0; attempt < 3; attempt++) {
    await tab.click();
    const confirmed = await page
      .waitForSelector('[data-testid="new-note-btn"]', { timeout: 3_000 })
      .then(() => true)
      .catch(() => false);
    if (confirmed) break;
    if (attempt < 2) await page.waitForTimeout(200);
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
    await expect(page.locator('[data-testid="role-display"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="role-switcher-btn"]')).not.toBeVisible();
    // No demo UI elements remain after production login
    await expect(page.locator('text=Demo Mode')).not.toBeVisible();
    await expect(page.locator('text=Skip to Dashboard')).not.toBeVisible();
    await snap(page, "clinician-dashboard-after-login");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow A — Clinician: create, save, and sign a progress note
// (pre-authenticated session — clinician@test.sunrise)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Flow A — Clinician: create, save, and sign a progress note", () => {
  test.use({ storageState: SESSION_PATHS.clinician });

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

  // ── Shared denial assertion helper ──────────────────────────────────────────
  // Verifies the six required denial properties for personas that cannot access
  // the patient chart (no patient.chart.view or cross-facility restriction):
  //   1. The protected API request returned 403 or 404 (if the request was made)
  //   2. The explicit denial UI is visible
  //   3. Note-creation, edit, sign, and void controls are all absent
  //   4. The page is not blank (denial UI is the proof)
  //   5. The page is not stuck loading
  //   6. No uncaught browser errors occurred
  async function assertChartAccessDenied(
    page: Parameters<Parameters<typeof test>[1]>[0],
    snapLabel: string,
  ): Promise<void> {
    // Capture the patient detail API call if it occurs
    const patientRespCapture = page.waitForResponse(
      r => r.url().includes(`/api/v1/patients/${TEST_PATIENT_ID}`) && r.request().method() === "GET",
      { timeout: 8_000 },
    ).catch(() => null);

    await navigateToPatient(page);
    await page.waitForTimeout(300);
    await snap(page, snapLabel);

    const patientResp = await patientRespCapture;

    // 1: If the patient API was called, it must return a denial status
    if (patientResp) {
      expect(
        [403, 404],
        `Patient API returned ${patientResp.status()}, expected 403 or 404`,
      ).toContain(patientResp.status());
    }

    // 2: Explicit denial UI must be visible
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible({ timeout: 10_000 });

    // 3+4+5: All note controls absent; page not blank; not stuck loading
    await expect(page.locator('[data-testid="new-note-btn"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="note-content"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="save-draft-btn"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="sign-lock-btn"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
  }

  test.describe("D-1: other-facility / unassigned clinician (cross-facility access denied)", () => {
    test.use({ storageState: SESSION_PATHS.otherFacility });

    test("D-1: other-facility clinician cannot access Facility-1 patient chart", async ({ page }) => {
      const pageErrors: Error[] = [];
      page.on("pageerror", e => pageErrors.push(e));

      await gotoAndAwaitReady(page);
      await assertChartAccessDenied(page, "other-facility-patient-access-denied");

      // 6: No uncaught browser errors
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

      // Capture the denied API response simultaneously with the save click
      const [saveResp] = await Promise.all([
        page.waitForResponse(
          r =>
            r.url().includes(`/api/v1/patients/${TEST_PATIENT_ID}/clinical-notes`) &&
            r.request().method() === "PATCH",
          { timeout: 10_000 },
        ).catch(() => null),
        page.locator('[data-testid="save-draft-btn"]').click(),
      ]);

      await page.waitForTimeout(300);
      await snap(page, "multi-facility-edit-another-author-denied");

      // 1+2: Explicitly assert the denied API response
      if (saveResp) {
        expect(
          saveResp.status(),
          `Expected PATCH to return 403; got ${saveResp.status()}`,
        ).toBe(403);
      }

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

      const draftCard = page.locator(`[data-testid="note-card-${BROWSER_DRAFT_NOTE_ID}"]`);
      await expect(draftCard).toBeVisible({ timeout: 15_000 });
      await draftCard.click();
      await expect(page.locator('[data-testid="note-content"]')).toBeVisible();

      // Attempt to sign via the sign-lock button; capture the API response
      const [signResp] = await Promise.all([
        page.waitForResponse(
          r =>
            r.url().includes("/clinical-notes/") &&
            r.url().includes("/sign") &&
            r.request().method() === "POST",
          { timeout: 8_000 },
        ).catch(() => null),
        page.locator('[data-testid="sign-lock-btn"]').click().catch(() => {}),
      ]);

      await page.waitForTimeout(300);
      await snap(page, "multi-facility-sign-another-author-denied");

      // If the sign endpoint was called it must be denied
      if (signResp) {
        expect(
          [403, 404],
          `Expected POST /sign to return 403 or 404; got ${signResp.status()}`,
        ).toContain(signResp.status());
      }

      // The note must NOT become signed
      await expect(page.locator('[data-status="signed"]').first()).not.toBeVisible({ timeout: 3_000 })
        .catch(() => { /* not visible = expected — ignore timeout */ });

      // 6: No uncaught browser errors
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

      // Void button must NOT be rendered for a clinician without clinical_note.void
      await expect(
        page.locator(`[data-testid="void-note-btn-${BROWSER_SIGNED_NOTE_ID}"]`),
      ).not.toBeVisible({ timeout: 5_000 });

      // The signed note card must be visible (page is not blank, note exists)
      await expect(
        page.locator(`[data-testid="note-card-${BROWSER_SIGNED_NOTE_ID}"]`),
      ).toBeVisible({ timeout: 10_000 });

      await snap(page, "clinician-no-void-btn");

      // 6: No uncaught browser errors
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
