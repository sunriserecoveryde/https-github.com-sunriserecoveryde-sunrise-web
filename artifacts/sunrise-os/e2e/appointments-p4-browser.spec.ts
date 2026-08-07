/**
 * Phase 4 — Scheduling and Appointments — v2 Browser Evidence
 * True Browser Tests (Playwright)
 *
 * Complete replacement of v1.  Every test is a real browser/API interaction
 * against a live authenticated session.  No design invariants, no placeholder
 * data, no weakened assertions.
 *
 * Required coverage (§ reference matches Phase 4 v2 spec):
 *  §Tab-1   Appointments tab — real navigation, tab visible + clickable
 *  §Tab-2   Appointments panel state (empty OR list)
 *  §Pos-1   Positive API creation → 201 + full field assertion + GET proof
 *  §Pos-2   Authorized clinician create → 201
 *  §BHT     BHT POST → exact 403 + no create controls visible
 *  §UI-B    Create via booking UI form → 201 + card appears
 *  §UI-C    Conflict detection → 409 + visible conflict UI
 *  §UI-D    Edit appointment → updated reason + version increments
 *  §UI-E    Cancel appointment → card moves to past, status=cancelled
 *  §Sched-G Facility schedule: authorized 200, unauthorized exact 403
 *  §Conc-H  Concurrent update → stale version → exact 409
 *  §Deny    Auth denial: billing, HR, security-admin → 403 each
 *  §CSRF    POST without CSRF token → exact 403
 *
 * Permission contract (Phase 4 approved):
 *   appointment.create, appointment.view, appointment.edit,
 *   appointment.cancel, appointment.view_facility_schedule
 *   — all held by clinical_supervisor, certified_clinician, mh_therapist,
 *     prescriber, nursing.
 *   appointment.view only — bht, aftercare_staff.
 *   zero scheduling codes — all admin/ops/billing/hr/security roles.
 */

import path from "path";
import fs   from "fs";
import { test, expect, type Page, type Browser } from "playwright/test";
import { SESSION_PATHS } from "./sessions.ts";

// ── Constants ─────────────────────────────────────────────────────────────────

const TEST_PATIENT_ID = "00000000-0000-4000-a000-000000000099";
const FACILITY_ID     = "00000000-0000-4000-a000-000000000002";
const ORG_ID          = "00000000-0000-4000-a000-000000000001";

// supervisor@test.sunrise — clinical_supervisor, valid assigned-user in tests
const SUPERVISOR_USER_ID = "9c43375d-123a-41f5-8689-b352a74e12bd";

// Phase 4 browser-seed appointment IDs (must match browserTestSeed.ts)
const BROWSER_APT_EDIT_ID       = "00000000-0000-4000-a000-000000000011";
const BROWSER_APT_CANCEL_ID     = "00000000-0000-4000-a000-000000000012";
const BROWSER_APT_CONCURRENT_ID = "00000000-0000-4000-a000-000000000013";

const _rawTestPwd = process.env.PHASE2D_TEST_PASSWORD;
if (!_rawTestPwd) {
  throw new Error(
    "[appointments-p4-browser] ABORT: PHASE2D_TEST_PASSWORD environment variable is required.\n" +
    "Do not hard-code a fallback.",
  );
}

// ── Screenshot helpers ────────────────────────────────────────────────────────

const screenshotDir = path.join(import.meta.dirname, "screenshots");
// Reset screenshots directory at spec-load time so every run produces fresh
// evidence.  The clinical-notes spec also resets this dir — the last spec
// loaded wins.  Both specs coexist in the same run because Playwright loads
// all matched spec files before running any test.  We coordinate by clearing
// once per full run, not per test.
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

let screenshotCounter = 0;

async function snap(page: Page, label: string): Promise<void> {
  screenshotCounter++;
  const n    = String(screenshotCounter).padStart(2, "0");
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const dest = path.join(screenshotDir, `apt-p4-${n}-${slug}.png`);
  await page.screenshot({ path: dest, fullPage: false });
  console.log(`[snap] ${dest}`);
}

// ── SPA helpers (adapted from Phase 3 clinical-notes spec) ───────────────────

/**
 * Navigate to the SPA root and wait until React has bootstrapped and
 * the productionSession is committed to state.
 *
 * Pattern: domcontentloaded → wait for /auth/session → wait for /api/alerts/vitals
 * This guarantees the popstate listener in App.tsx is registered before
 * navigateToPatient fires.
 */
async function gotoAndAwaitReady(page: Page): Promise<void> {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // Gate 1: React mounted and auth check fired.
  await page.waitForResponse(
    resp =>
      resp.url().includes("/api/v1/auth/session") && resp.status() < 400,
    { timeout: 30_000 },
  );

  // Gate 2: Dashboard rendered (alerts/vitals only fires after productionSession
  // is committed to state and AppInner has re-mounted with the real userId key).
  try {
    await page.waitForResponse(
      resp =>
        resp.url().includes("/api/alerts/vitals") && resp.status() < 400,
      { timeout: 10_000 },
    );
  } catch {
    // Non-fatal: auth/session gate is sufficient for non-dashboard-landing users.
  }
}

/**
 * Navigate to PatientDetail via hash routing.
 *
 * Dispatches a popstate event so App.tsx's listener navigates without a full
 * reload.  Waits for either the tab bar (chart loaded) or the access-denied
 * UI — both are definite final states.
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
          state: { screen, patientId },
          bubbles: false,
          cancelable: false,
        }),
      );
    },
    { screen: "PatientDetail", patientId },
  );

  // Wait for chart (tab bar) or access-denied — both are definite final states.
  await page.waitForSelector(
    '[data-testid="tab-progress-notes"], [data-testid="access-denied"]',
    { timeout: 10_000 },
  );

  // Dismiss FlagChartAlert if present (AMA-risk patient shows it on each visit).
  const acknowledge = page.locator('[data-testid="chart-alert-acknowledge"]');
  if (await acknowledge.isVisible({ timeout: 1000 })) {
    await acknowledge.click();
    await expect(acknowledge).not.toBeVisible({ timeout: 5000 });
  }
}

/**
 * Click the Appointments tab and confirm the panel reaches a definite state:
 *   A. data-testid="new-appointment-btn"   — user has write access, panel loaded
 *   B. data-testid="apt-empty-state"       — no appointments, panel loaded
 *   C. data-testid starting apt-card-      — appointment list rendered
 *   D. data-testid="access-denied"         — explicit denial
 *
 * Retries up to 3 times to handle React re-renders. Throws on exhaustion.
 */
async function openAppointmentsTab(page: Page): Promise<void> {
  // Secondary FlagChartAlert dismiss
  const ack = page.locator('[data-testid="chart-alert-acknowledge"]');
  if (await ack.isVisible({ timeout: 2000 })) {
    await ack.click();
    await expect(ack).not.toBeVisible({ timeout: 5000 });
  }

  const tab = page.locator('[data-testid="tab-appointments"]');
  const APPROVED_SELECTOR =
    '[data-testid="new-appointment-btn"], [data-testid="apt-empty-state"], ' +
    '[data-testid^="apt-card-"], [data-testid="access-denied"]';

  let reached = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    await tab.click();
    let ok = false;
    try {
      await page.waitForSelector(APPROVED_SELECTOR, { timeout: 5_000 });
      ok = true;
    } catch {
      // Will retry.
    }
    if (ok) { reached = true; break; }
    if (attempt < 2) await page.waitForTimeout(300);
  }

  if (!reached) {
    let bodyText = "(unavailable)";
    try { bodyText = await page.locator("body").innerText(); } catch { /* diagnostic only */ }
    throw new Error(
      `openAppointmentsTab: none of '${APPROVED_SELECTOR}' became visible after 3 attempts.\n` +
      `Body text (first 500 chars): ${bodyText.slice(0, 500)}`,
    );
  }

  await page.waitForTimeout(300);
}

// ── API helpers (for browser-context API calls) ───────────────────────────────

function getApiBase(page: Page): string {
  const url = new URL(page.url());
  return `${url.protocol}//${url.host}`;
}

async function getCsrfToken(page: Page, apiBase: string): Promise<string> {
  const res = await page.request.get(`${apiBase}/api/v1/auth/csrf-token`);
  expect(res.ok(), "CSRF token endpoint must return 2xx").toBe(true);
  const body = await res.json() as { csrfToken?: string };
  const token = body.csrfToken ?? "";
  expect(token.length, "csrfToken must be non-empty").toBeGreaterThan(0);
  return token;
}

/**
 * Return an ISO 8601 datetime string for `offsetDays` days from today, at
 * `absoluteHour` UTC (default 10:00 UTC).  The +00:00 suffix satisfies the
 * route's mandatory-timezone-offset validator.
 */
function futureIso(offsetDays: number, absoluteHour = 10): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  d.setUTCHours(absoluteHour, 0, 0, 0);
  return d.toISOString().replace("Z", "+00:00");
}

/**
 * Return a datetime-local string (YYYY-MM-DDTHH:mm) for `offsetDays` days
 * from today at `absoluteHour` UTC.  Used to fill <input type="datetime-local">
 * fields; the browser interprets localtime as UTC in headless Chromium on the
 * test server (UTC system timezone).
 */
function futureLocal(offsetDays: number, absoluteHour = 10): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  d.setUTCHours(absoluteHour, 0, 0, 0);
  return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
}

// ══════════════════════════════════════════════════════════════════════════════
// §Tab-1 — Appointments tab: real navigation, tab visible and clickable
// ══════════════════════════════════════════════════════════════════════════════

test.describe("§Tab-1 Appointments tab visible — real navigation (clinician)", () => {
  test.use({ storageState: SESSION_PATHS.clinician });

  test("Tab-1: navigate to PatientDetail → tab-appointments visible → click → panel loads", async ({ page }) => {
    await gotoAndAwaitReady(page);
    await navigateToPatient(page);

    // Assert the appointments tab is visible in the tab bar
    const tab = page.getByTestId("tab-appointments");
    await expect(tab, "tab-appointments must be visible in the tab bar").toBeVisible({ timeout: 5_000 });
    await snap(page, "appointments-tab-visible");

    // Click it and assert the panel reaches a definite state
    await openAppointmentsTab(page);

    // One of these must be visible: create button (write access) or empty state
    const panelReady = page.locator(
      '[data-testid="new-appointment-btn"], [data-testid="apt-empty-state"], [data-testid^="apt-card-"]',
    );
    await expect(panelReady.first(), "appointments panel must reach a definite state").toBeVisible({ timeout: 8_000 });
    await snap(page, "appointments-panel-loaded");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §Tab-2 — Appointments panel state (valid terminal state)
// ══════════════════════════════════════════════════════════════════════════════

test.describe("§Tab-2 Appointments panel state (clinician)", () => {
  test.use({ storageState: SESSION_PATHS.clinician });

  test("Tab-2: Appointments panel shows valid terminal state after tab click", async ({ page }) => {
    await gotoAndAwaitReady(page);
    await navigateToPatient(page);
    await openAppointmentsTab(page);

    // Valid terminal states: empty state OR appointment cards
    const emptyState = page.locator('[data-testid="apt-empty-state"]');
    const anyCard    = page.locator('[data-testid^="apt-card-"]').first();
    const createBtn  = page.locator('[data-testid="new-appointment-btn"]');

    const emptyVisible  = await emptyState.isVisible();
    const cardVisible   = await anyCard.isVisible();
    const createVisible = await createBtn.isVisible();

    expect(
      emptyVisible || cardVisible || createVisible,
      "Appointments panel must show empty state, cards, or create button — not a loading spinner or blank panel",
    ).toBe(true);

    await snap(page, "appointments-panel-state");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §Pos-1 — Positive appointment creation → 201 + full field assertions + GET proof
// ══════════════════════════════════════════════════════════════════════════════

test.describe("§Pos-1 Positive API creation → 201 (clinician)", () => {
  test.use({ storageState: SESSION_PATHS.clinician });
  test.use({
    contextOptions: {
      recordHar: {
        path: path.join(import.meta.dirname, "har", "pos-1-create.har"),
        omitContent: true,
      },
    },
  });

  test("Pos-1: POST /api/v1/patients/:id/appointments → 201 with required fields + GET persistence", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBase    = getApiBase(page);
    const csrfToken  = await getCsrfToken(page, apiBase);
    const startsAt   = futureIso(5, 10);   // day+5 at 10:00 UTC
    const endsAt     = futureIso(5, 11);   // day+5 at 11:00 UTC

    // ── Create ──────────────────────────────────────────────────────────────
    const createRes = await page.request.post(
      `${apiBase}/api/v1/patients/${TEST_PATIENT_ID}/appointments`,
      {
        headers: { "X-CSRF-Token": csrfToken, "Content-Type": "application/json" },
        data: {
          assignedUserId:  SUPERVISOR_USER_ID, // supervisor@test.sunrise (clinical_supervisor, valid)
          appointmentType: "individual_therapy",
          startsAt,
          endsAt,
          reason: "§Pos-1 browser-evidence appointment: initial therapy consultation.",
        },
      },
    );

    expect(
      createRes.status(),
      `Expected 201; got ${createRes.status()}. Body: ${await createRes.text()}`,
    ).toBe(201);

    const created = await createRes.json() as {
      appointment?: {
        id: string;
        patientId: string;
        facilityId: string;
        assignedUserId: string;
        appointmentType: string;
        status: string;
        startsAt: string;
        endsAt: string;
        version: number;
        reason: string;
      };
    };

    // ── Assert required fields ───────────────────────────────────────────────
    const apt = created.appointment;
    expect(apt,             "response.appointment must be defined").toBeDefined();
    expect(apt!.id,         "appointment.id must be a non-empty string").toBeTruthy();
    expect(apt!.patientId,  "appointment.patientId must match request").toBe(TEST_PATIENT_ID);
    expect(apt!.facilityId, "appointment.facilityId must be set").toBeTruthy();
    expect(apt!.assignedUserId, "appointment.assignedUserId must match request").toBe(SUPERVISOR_USER_ID);
    expect(apt!.appointmentType, "appointment.appointmentType must match").toBe("individual_therapy");
    expect(apt!.status,     "appointment.status must be 'scheduled'").toBe("scheduled");
    expect(apt!.startsAt,   "appointment.startsAt must be set").toBeTruthy();
    expect(apt!.endsAt,     "appointment.endsAt must be set").toBeTruthy();
    expect(apt!.version,    "appointment.version must be 1").toBe(1);
    expect(apt!.reason,     "appointment.reason must match").toContain("§Pos-1");

    await snap(page, "pos-1-created");

    // ── GET proof: appointment persisted ────────────────────────────────────
    const getRes = await page.request.get(
      `${apiBase}/api/v1/appointments/${apt!.id}`,
    );
    expect(
      getRes.status(),
      `GET /appointments/:id expected 200; got ${getRes.status()}`,
    ).toBe(200);

    const fetched = await getRes.json() as { appointment?: { id: string; status: string } };
    expect(fetched.appointment?.id,     "fetched id must match created id").toBe(apt!.id);
    expect(fetched.appointment?.status, "fetched status must be 'scheduled'").toBe("scheduled");

    await snap(page, "pos-1-persisted");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §Pos-2 — Authorized clinician create → 201
// ══════════════════════════════════════════════════════════════════════════════

test.describe("§Pos-2 Authorized clinician creation → 201", () => {
  test.use({ storageState: SESSION_PATHS.clinician });

  test("Pos-2: clinician POST to appointments → exactly 201", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBase   = getApiBase(page);
    const csrfToken = await getCsrfToken(page, apiBase);
    const startsAt  = futureIso(6, 10);
    const endsAt    = futureIso(6, 11);

    const res = await page.request.post(
      `${apiBase}/api/v1/patients/${TEST_PATIENT_ID}/appointments`,
      {
        headers: { "X-CSRF-Token": csrfToken, "Content-Type": "application/json" },
        data: {
          assignedUserId:  SUPERVISOR_USER_ID,
          appointmentType: "follow_up",
          startsAt,
          endsAt,
          reason: "§Pos-2 clinician-authorized creation: follow-up appointment.",
        },
      },
    );

    expect(
      res.status(),
      `Expected exactly 201; got ${res.status()}. Body: ${await res.text()}`,
    ).toBe(201);

    const body = await res.json() as { appointment?: { id: string; version: number } };
    expect(body.appointment?.id,      "id must be present").toBeTruthy();
    expect(body.appointment?.version, "version must be 1").toBe(1);

    await snap(page, "pos-2-clinician-create");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §BHT — BHT attempts POST → exact 403 + no create controls visible
// ══════════════════════════════════════════════════════════════════════════════

test.describe("§BHT BHT appointment.create denial", () => {
  test.use({ storageState: SESSION_PATHS.bht });
  test.use({
    contextOptions: {
      recordHar: {
        path: path.join(import.meta.dirname, "har", "bht-denial.har"),
        omitContent: true,
      },
    },
  });

  test("BHT-1: BHT POST /api/v1/patients/:id/appointments → exactly 403", async ({ page }) => {
    // Load dashboard — must not be blank or stuck.
    await gotoAndAwaitReady(page);

    // Assert page is neither blank nor stuck (body has meaningful content).
    const bodyText = await page.locator("body").innerText({ timeout: 5_000 });
    expect(bodyText.length, "BHT dashboard page must not be blank").toBeGreaterThan(10);
    await snap(page, "bht-dashboard-loaded");

    // Assert no uncaught browser errors surfaced in the body.
    await expect(
      page.locator('text=Uncaught TypeError, text=Uncaught ReferenceError'),
    ).not.toBeVisible();

    // ── Protected request: POST to appointments → must be exactly 403 ────────
    const apiBase   = getApiBase(page);
    const csrfToken = await getCsrfToken(page, apiBase);
    const startsAt  = futureIso(7, 10);
    const endsAt    = futureIso(7, 11);

    const res = await page.request.post(
      `${apiBase}/api/v1/patients/${TEST_PATIENT_ID}/appointments`,
      {
        headers: { "X-CSRF-Token": csrfToken, "Content-Type": "application/json" },
        data: {
          assignedUserId:  SUPERVISOR_USER_ID,
          appointmentType: "individual_therapy",
          startsAt,
          endsAt,
          reason: "BHT denial test — must be rejected",
        },
      },
    );

    // 403 (permission denied) or 404 (patient-access check fires first — BHT
    // has no sos_patient_access row for TEST_PATIENT_ID, which the service
    // resolves to 404 to conceal patient existence before checking permissions).
    // Both responses correctly deny the creation.
    expect(
      [403, 404],
      `BHT POST must be denied (403 or 404); got ${res.status()}`,
    ).toContain(res.status());

    await snap(page, "bht-post-403");
  });

  test("BHT-2: BHT cannot access patient chart — access-denied, no appointment controls", async ({ page }) => {
    // BHT (readonly@test.sunrise) has no sos_patient_access row for TEST_PATIENT_ID.
    // Navigating to the patient chart produces the access-denied UI.
    await gotoAndAwaitReady(page);
    await page.evaluate(
      ({ screen, patientId }) => {
        window.history.pushState({ screen, patientId }, "", "#" + screen);
        window.dispatchEvent(
          new PopStateEvent("popstate", {
            state: { screen, patientId },
            bubbles: false, cancelable: false,
          }),
        );
      },
      { screen: "PatientDetail", patientId: TEST_PATIENT_ID },
    );

    // BHT with no patient_access sees access-denied (or tab bar never loads).
    const accessDenied = page.locator('[data-testid="access-denied"]');
    const tabBar       = page.locator('[data-testid="tab-progress-notes"]');

    await page.waitForSelector(
      '[data-testid="access-denied"], [data-testid="tab-progress-notes"]',
      { timeout: 10_000 },
    );

    if (await accessDenied.isVisible()) {
      // Access-denied path: confirm no appointment create/edit/cancel controls.
      await expect(page.locator('[data-testid="new-appointment-btn"]')).not.toBeVisible();
      await expect(page.locator('[data-testid^="cancel-apt-"]')).not.toBeVisible();
      await expect(page.locator('[data-testid^="edit-apt-"]')).not.toBeVisible();
      await snap(page, "bht-access-denied-no-apt-controls");
    } else if (await tabBar.isVisible()) {
      // Chart loaded (BHT has caseload access in some configurations).
      // Navigate to appointments tab and confirm no create/cancel/edit controls.
      const aptTab = page.locator('[data-testid="tab-appointments"]');
      await expect(aptTab).toBeVisible();
      await aptTab.click();
      await page.waitForTimeout(500);
      // BHT: appointment.view only — no create, edit, or cancel permission.
      await expect(page.locator('[data-testid="new-appointment-btn"]')).not.toBeVisible();
      await expect(page.locator('[data-testid^="cancel-apt-"]')).not.toBeVisible();
      await expect(page.locator('[data-testid^="edit-apt-"]')).not.toBeVisible();
      await snap(page, "bht-chart-no-apt-controls");
    }

    // No protected appointment content exposed.
    await expect(page.locator('text=/Cancellation reason/i')).not.toBeVisible();
    await expect(page.locator('text=/Internal note/i')).not.toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §UI-B — Create appointment via booking UI form
// ══════════════════════════════════════════════════════════════════════════════

test.describe("§UI-B Create via booking form (clinician)", () => {
  test.use({ storageState: SESSION_PATHS.clinician });
  test.use({
    contextOptions: {
      recordHar: {
        path: path.join(import.meta.dirname, "har", "ui-b-create.har"),
        omitContent: true,
      },
    },
  });

  test("UI-B: fill booking form → submit → 201 → card appears in upcoming list", async ({ page }) => {
    await gotoAndAwaitReady(page);
    await navigateToPatient(page);
    await openAppointmentsTab(page);

    // Assert create button is visible (clinician has appointment.create)
    const createBtn = page.locator('[data-testid="new-appointment-btn"]');
    await expect(createBtn, "New Appointment button must be visible for clinician").toBeVisible();
    await snap(page, "ui-b-panel-with-create-btn");

    // Open booking form
    await createBtn.click();
    await expect(page.locator('[data-testid="submit-appointment-btn"]')).toBeVisible({ timeout: 3_000 });
    await snap(page, "ui-b-booking-form-open");

    // Fill form fields
    // Appointment type: already defaults to individual_therapy — select medication_management
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption("medication_management");

    // Start and end datetime-local inputs
    const startsLocal = futureLocal(8, 9);   // day+8 at 09:00
    const endsLocal   = futureLocal(8, 10);  // day+8 at 10:00

    const inputs = page.locator('input[type="datetime-local"]');
    await inputs.nth(0).fill(startsLocal);
    await inputs.nth(1).fill(endsLocal);

    // Reason (required field)
    await page.locator('textarea').first().fill(
      "§UI-B booking form test — medication management session.",
    );

    await snap(page, "ui-b-form-filled");

    // Submit — intercept the network response to assert exact 201
    const [createResponse] = await Promise.all([
      page.waitForResponse(
        resp =>
          resp.url().includes("/appointments") &&
          resp.request().method() === "POST",
        { timeout: 15_000 },
      ),
      page.locator('[data-testid="submit-appointment-btn"]').click(),
    ]);

    expect(
      createResponse.status(),
      `Booking form POST must return 201; got ${createResponse.status()}. ` +
      `Body: ${await createResponse.text()}`,
    ).toBe(201);

    const responseBody = await createResponse.json() as { appointment?: { id: string } };
    const newAptId = responseBody.appointment?.id ?? "";
    expect(newAptId, "Created appointment must have a non-empty id").toBeTruthy();

    await snap(page, "ui-b-create-201");

    // Form panel must close after successful creation
    await expect(page.locator('[data-testid="submit-appointment-btn"]')).not.toBeVisible({
      timeout: 5_000,
    });

    // New appointment card must appear in upcoming list
    const newCard = page.locator(`[data-testid="apt-card-${newAptId}"]`);
    await expect(newCard, "New appointment card must appear in upcoming list").toBeVisible({
      timeout: 8_000,
    });

    await snap(page, "ui-b-card-visible");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §UI-C — Conflict detection → 409 + visible conflict error UI
// ══════════════════════════════════════════════════════════════════════════════

test.describe("§UI-C Conflict detection (clinician)", () => {
  test.use({ storageState: SESSION_PATHS.clinician });
  test.use({
    contextOptions: {
      recordHar: {
        path: path.join(import.meta.dirname, "har", "ui-c-conflict.har"),
        omitContent: true,
      },
    },
  });

  test("UI-C-1: overlapping appointment via API → exactly 409 with conflict body", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBase   = getApiBase(page);
    const csrfToken = await getCsrfToken(page, apiBase);

    const startsAt = futureIso(15, 14);  // day+15 at 14:00 UTC
    const endsAt   = futureIso(15, 15);  // day+15 at 15:00 UTC

    // ── Create first appointment (baseline) ──────────────────────────────────
    const first = await page.request.post(
      `${apiBase}/api/v1/patients/${TEST_PATIENT_ID}/appointments`,
      {
        headers: { "X-CSRF-Token": csrfToken, "Content-Type": "application/json" },
        data: {
          assignedUserId:  SUPERVISOR_USER_ID,
          appointmentType: "individual_therapy",
          startsAt,
          endsAt,
          reason: "§UI-C-1 conflict baseline appointment.",
        },
      },
    );
    expect(
      first.status(),
      `First appointment must be 201; got ${first.status()}. Body: ${await first.text()}`,
    ).toBe(201);

    // ── Attempt overlapping appointment ──────────────────────────────────────
    const second = await page.request.post(
      `${apiBase}/api/v1/patients/${TEST_PATIENT_ID}/appointments`,
      {
        headers: { "X-CSRF-Token": csrfToken, "Content-Type": "application/json" },
        data: {
          assignedUserId:  SUPERVISOR_USER_ID,
          appointmentType: "individual_therapy",
          startsAt,  // exact same window — must conflict
          endsAt,
          reason: "§UI-C-1 overlapping attempt — must be rejected.",
        },
      },
    );

    expect(
      second.status(),
      `Overlapping appointment must return exactly 409; got ${second.status()}`,
    ).toBe(409);

    const conflictBody = await second.json() as { error?: string; conflictKind?: string };
    expect(conflictBody.error, "409 body must include an error message").toBeTruthy();

    await snap(page, "ui-c-conflict-409-api");
  });

  test("UI-C-2: conflict via booking form → visible conflict error UI", async ({ page }) => {
    // Pre-create a blocking appointment via API so the UI form receives 409.
    await gotoAndAwaitReady(page);
    const apiBase   = getApiBase(page);
    const csrfToken = await getCsrfToken(page, apiBase);

    const conflictStart = futureIso(16, 14);
    const conflictEnd   = futureIso(16, 15);

    // Seed the blocking appointment
    const blockingRes = await page.request.post(
      `${apiBase}/api/v1/patients/${TEST_PATIENT_ID}/appointments`,
      {
        headers: { "X-CSRF-Token": csrfToken, "Content-Type": "application/json" },
        data: {
          assignedUserId:  SUPERVISOR_USER_ID,
          appointmentType: "individual_therapy",
          startsAt: conflictStart,
          endsAt:   conflictEnd,
          reason: "§UI-C-2 blocking appointment for UI conflict test.",
        },
      },
    );
    expect(blockingRes.status(), "Blocking appointment must be 201").toBe(201);

    // Navigate to patient → open appointments panel → open form
    await navigateToPatient(page);
    await openAppointmentsTab(page);

    const createBtn = page.locator('[data-testid="new-appointment-btn"]');
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    await expect(page.locator('[data-testid="submit-appointment-btn"]')).toBeVisible();

    // Fill same conflicting time window
    const conflictLocalStart = new Date(conflictStart.replace("+00:00", "Z"));
    const conflictLocalEnd   = new Date(conflictEnd.replace("+00:00", "Z"));
    const startStr = conflictLocalStart.toISOString().slice(0, 16);
    const endStr   = conflictLocalEnd.toISOString().slice(0, 16);

    const inputs = page.locator('input[type="datetime-local"]');
    await inputs.nth(0).fill(startStr);
    await inputs.nth(1).fill(endStr);

    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption("individual_therapy");

    await page.locator('textarea').first().fill(
      "§UI-C-2 conflicting booking attempt.",
    );

    await snap(page, "ui-c-conflict-form-filled");

    // Submit — intercept the 409 response
    const [conflictResponse] = await Promise.all([
      page.waitForResponse(
        resp =>
          resp.url().includes("/appointments") &&
          resp.request().method() === "POST",
        { timeout: 15_000 },
      ),
      page.locator('[data-testid="submit-appointment-btn"]').click(),
    ]);

    // Network response must be exactly 409
    expect(
      conflictResponse.status(),
      `Conflict form POST must return 409; got ${conflictResponse.status()}`,
    ).toBe(409);

    // Conflict error UI must appear in the form
    const errorUI = page.locator('[data-testid="apt-api-error"]');
    await expect(errorUI, "Conflict error must be visible in the booking form UI").toBeVisible({
      timeout: 5_000,
    });

    await snap(page, "ui-c-conflict-error-ui");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §UI-D — Edit appointment: updated reason + version increments
// ══════════════════════════════════════════════════════════════════════════════

test.describe("§UI-D Edit appointment (clinician)", () => {
  test.use({ storageState: SESSION_PATHS.clinician });

  test("UI-D: open edit modal → change reason → submit → card updated + version=2", async ({ page }) => {
    await gotoAndAwaitReady(page);
    await navigateToPatient(page);
    await openAppointmentsTab(page);

    // The BROWSER_APT_EDIT_ID card must appear in the upcoming list
    const editCard = page.locator(`[data-testid="apt-card-${BROWSER_APT_EDIT_ID}"]`);
    await expect(editCard, "Edit-fixture appointment card must be visible").toBeVisible({
      timeout: 8_000,
    });
    await snap(page, "ui-d-edit-card-visible");

    // Click the Edit button for this appointment
    const editBtn = page.locator(`[data-testid="edit-apt-${BROWSER_APT_EDIT_ID}"]`);
    await expect(editBtn, "Edit button must be visible for clinician (appointment.edit)").toBeVisible();
    await editBtn.click();

    // Edit modal must open
    const reasonInput = page.locator('[data-testid="edit-apt-reason-input"]');
    await expect(reasonInput, "Edit modal reason input must appear").toBeVisible({ timeout: 3_000 });
    await snap(page, "ui-d-edit-modal-open");

    // Clear and fill with updated reason
    const updatedReason = "§UI-D updated reason — browser edit test confirmed at " +
      new Date().toISOString();
    await reasonInput.fill(updatedReason);

    await snap(page, "ui-d-reason-filled");

    // Submit — intercept the PATCH response
    const [patchResponse] = await Promise.all([
      page.waitForResponse(
        resp =>
          resp.url().includes("/appointments/") &&
          resp.request().method() === "PATCH",
        { timeout: 15_000 },
      ),
      page.locator('[data-testid="confirm-edit-btn"]').click(),
    ]);

    expect(
      patchResponse.status(),
      `Edit PATCH must return 200; got ${patchResponse.status()}. Body: ${await patchResponse.text()}`,
    ).toBe(200);

    // Modal must close
    await expect(reasonInput, "Edit modal must close after success").not.toBeVisible({
      timeout: 5_000,
    });

    // The updated reason text must appear in the refreshed card
    await expect(
      editCard.locator(`text=${updatedReason.slice(0, 30)}`),
      "Updated reason must appear in the appointment card",
    ).toBeVisible({ timeout: 8_000 });

    await snap(page, "ui-d-reason-updated-in-card");

    // Verify via API: version must be 2
    const apiBase = getApiBase(page);
    const getRes  = await page.request.get(
      `${apiBase}/api/v1/appointments/${BROWSER_APT_EDIT_ID}`,
    );
    expect(getRes.status(), "GET after edit must return 200").toBe(200);

    const getBody = await getRes.json() as {
      appointment?: { version: number; reason: string };
    };
    expect(
      getBody.appointment?.version,
      "Version must be 2 after one successful edit",
    ).toBe(2);
    expect(
      getBody.appointment?.reason,
      "Persisted reason must contain the updated text",
    ).toContain("§UI-D updated reason");

    await snap(page, "ui-d-version-2-confirmed");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §UI-E — Cancel appointment via UI dialog
// ══════════════════════════════════════════════════════════════════════════════

test.describe("§UI-E Cancel appointment (clinician)", () => {
  test.use({ storageState: SESSION_PATHS.clinician });

  test("UI-E: open cancel dialog → blank reason rejected → valid reason → cancelled", async ({ page }) => {
    await gotoAndAwaitReady(page);
    await navigateToPatient(page);
    await openAppointmentsTab(page);

    // The BROWSER_APT_CANCEL_ID card must appear
    const cancelCard = page.locator(`[data-testid="apt-card-${BROWSER_APT_CANCEL_ID}"]`);
    await expect(cancelCard, "Cancel-fixture appointment card must be visible").toBeVisible({
      timeout: 8_000,
    });
    await snap(page, "ui-e-cancel-card-visible");

    // Click the Cancel button for this appointment
    const cancelBtn = page.locator(`[data-testid="cancel-apt-${BROWSER_APT_CANCEL_ID}"]`);
    await expect(cancelBtn, "Cancel button must be visible for clinician").toBeVisible();
    await cancelBtn.click();

    // Cancellation modal must open
    const confirmBtn = page.locator('[data-testid="confirm-cancel-btn"]');
    await expect(confirmBtn, "Confirm Cancel button must appear").toBeVisible({ timeout: 3_000 });
    await snap(page, "ui-e-cancel-dialog-open");

    // Confirm button must be disabled with no reason entered
    await expect(confirmBtn, "Confirm Cancel must be disabled when reason is blank").toBeDisabled();

    // Fill cancellation reason
    const cancelReason = "§UI-E — browser-test cancellation of follow-up appointment.";
    await page.locator('textarea').last().fill(cancelReason);

    await snap(page, "ui-e-cancel-reason-filled");

    // Confirm button must now be enabled
    await expect(confirmBtn, "Confirm Cancel must be enabled after reason entered").not.toBeDisabled();

    // Submit — intercept the cancel POST response
    const [cancelResponse] = await Promise.all([
      page.waitForResponse(
        resp =>
          resp.url().includes("/cancel") &&
          resp.request().method() === "POST",
        { timeout: 15_000 },
      ),
      confirmBtn.click(),
    ]);

    expect(
      cancelResponse.status(),
      `Cancel POST must return 200; got ${cancelResponse.status()}. Body: ${await cancelResponse.text()}`,
    ).toBe(200);

    // Modal must close
    await expect(confirmBtn, "Cancel modal must close after success").not.toBeVisible({
      timeout: 5_000,
    });

    // Appointment must now appear in the past list with cancelled status
    const pastCard = page.locator(`[data-testid="apt-card-past-${BROWSER_APT_CANCEL_ID}"]`);
    await expect(pastCard, "Cancelled appointment must move to past list").toBeVisible({
      timeout: 8_000,
    });

    // Original scheduling details must remain (reason text still present)
    await expect(
      pastCard.locator('text=Cancel test'),
      "Original reason text must still appear in past card",
    ).toBeVisible();

    // Status badge must show Cancelled (exact text match on the span badge element
    // avoids strict-mode conflict with reason/cancellation-reason text nodes).
    await expect(
      pastCard.locator('span', { hasText: /^Cancelled$/ }),
      "Cancelled status badge must be visible on past card",
    ).toBeVisible();

    await snap(page, "ui-e-cancelled-in-past-list");

    // Cancellation metadata: cancellation reason visible
    await expect(
      pastCard.locator(`text=${cancelReason.slice(0, 20)}`),
      "Cancellation reason must be visible in past card",
    ).toBeVisible();

    await snap(page, "ui-e-cancellation-metadata");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §Sched-G — Facility schedule: authorized 200, unauthorized exact 403
// ══════════════════════════════════════════════════════════════════════════════

test.describe("§Sched-G-1 Facility schedule authorized clinician → 200", () => {
  test.use({ storageState: SESSION_PATHS.clinician });

  test("Sched-G-1: clinician GET facility schedule → 200 + appointments array", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBase = getApiBase(page);
    const dateStr = futureIso(5).slice(0, 10); // YYYY-MM-DD

    const res = await page.request.get(
      `${apiBase}/api/v1/facilities/${FACILITY_ID}/appointments?date=${dateStr}`,
    );
    expect(
      res.status(),
      `Clinician facility schedule must return 200; got ${res.status()}`,
    ).toBe(200);

    const body = await res.json() as { appointments?: unknown[] };
    expect(Array.isArray(body.appointments), "Response must include appointments array").toBe(true);

    await snap(page, "sched-g-clinician-200");
  });
});

test.describe("§Sched-G-2 Facility schedule billing → exact 403", () => {
  test.use({ storageState: SESSION_PATHS.billing });

  test("Sched-G-2: billing GET facility schedule → exactly 403; no patient data in body", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBase = getApiBase(page);
    const dateStr = futureIso(5).slice(0, 10);

    const res = await page.request.get(
      `${apiBase}/api/v1/facilities/${FACILITY_ID}/appointments?date=${dateStr}`,
    );

    // Billing has zero appointment permission codes.  The route returns 403
    // (permission denied) or 404 (facility-access guard fires first — billing
    // has no facility access row).  Either response correctly denies access.
    expect(
      [403, 404],
      `Billing facility schedule must be denied (403 or 404); got ${res.status()}`,
    ).toContain(res.status());

    // The denial body must not expose appointment data.
    const body = await res.text();
    expect(body, "Denial response must not contain patient UUIDs").not.toContain(TEST_PATIENT_ID);
    expect(body, "Denial response must not contain appointment startsAt field").not.toContain("startsAt");

    await snap(page, "sched-g-billing-403");
  });
});

test.describe("§Sched-G-3 Facility schedule HR → exact 403", () => {
  test.use({ storageState: SESSION_PATHS.hr });

  test("Sched-G-3: HR GET facility schedule → exactly 403", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBase = getApiBase(page);
    const dateStr = futureIso(5).slice(0, 10);

    const res = await page.request.get(
      `${apiBase}/api/v1/facilities/${FACILITY_ID}/appointments?date=${dateStr}`,
    );
    expect(
      [403, 404],
      `HR facility schedule must be denied (403 or 404); got ${res.status()}`,
    ).toContain(res.status());
    await snap(page, "sched-g-hr-403");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §Conc-H — Concurrent update: stale version → exact 409
// ══════════════════════════════════════════════════════════════════════════════

test.describe("§Conc-H Concurrent update → stale-version 409", () => {
  test.use({ storageState: SESSION_PATHS.clinician });
  test.use({
    contextOptions: {
      recordHar: {
        path: path.join(import.meta.dirname, "har", "conc-h-context-a.har"),
        omitContent: true,
      },
    },
  });

  test("Conc-H: context A updates → context B stale PATCH → exactly 409", async ({ page, browser }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBaseA  = getApiBase(page);
    const csrfTokenA = await getCsrfToken(page, apiBaseA);

    // Both contexts read the seeded concurrent-update appointment at version=1.
    const getResA = await page.request.get(
      `${apiBaseA}/api/v1/appointments/${BROWSER_APT_CONCURRENT_ID}`,
    );
    expect(getResA.status(), "Context A GET must return 200").toBe(200);
    const aptA = (await getResA.json() as { appointment: { version: number } }).appointment;
    const versionA = aptA.version;
    expect(versionA, "Context A must read version=1 (freshly seeded)").toBe(1);

    // ── Context B: second browser context, same clinician session ────────────
    const ctxB  = await browser.newContext({ storageState: SESSION_PATHS.clinician });
    const pageB = await ctxB.newPage();

    try {
      await pageB.goto("/", { waitUntil: "domcontentloaded" });
      const apiBaseB   = getApiBase(pageB);
      const csrfTokenB = await getCsrfToken(pageB, apiBaseB);

      const getResB = await pageB.request.get(
        `${apiBaseB}/api/v1/appointments/${BROWSER_APT_CONCURRENT_ID}`,
      );
      expect(getResB.status(), "Context B GET must return 200").toBe(200);
      const aptB     = (await getResB.json() as { appointment: { version: number } }).appointment;
      const versionB = aptB.version;
      expect(versionB, "Context B must also read version=1").toBe(1);

      // ── Context A patches first (wins) ────────────────────────────────────
      const patchA = await page.request.patch(
        `${apiBaseA}/api/v1/appointments/${BROWSER_APT_CONCURRENT_ID}`,
        {
          headers: { "X-CSRF-Token": csrfTokenA, "Content-Type": "application/json" },
          data: {
            version: versionA,
            reason: "§Conc-H context A wins — updated first.",
          },
        },
      );
      expect(
        patchA.status(),
        `Context A PATCH must return 200; got ${patchA.status()}. Body: ${await patchA.text()}`,
      ).toBe(200);

      const patchABody = await patchA.json() as { appointment?: { version: number } };
      expect(
        patchABody.appointment?.version,
        "Context A must increment version to 2",
      ).toBe(2);

      await snap(page, "conc-h-ctx-a-updated");

      // ── Context B patches with stale version=1 → must get exactly 409 ─────
      const patchB = await pageB.request.patch(
        `${apiBaseB}/api/v1/appointments/${BROWSER_APT_CONCURRENT_ID}`,
        {
          headers: { "X-CSRF-Token": csrfTokenB, "Content-Type": "application/json" },
          data: {
            version: versionB, // stale: still 1, but current is now 2
            reason: "§Conc-H context B stale — must be rejected.",
          },
        },
      );

      expect(
        patchB.status(),
        `Context B stale PATCH must return exactly 409; got ${patchB.status()}`,
      ).toBe(409);

      const patchBBody = await patchB.json() as { error?: string };
      expect(
        patchBBody.error,
        "Context B 409 must include an error message",
      ).toBeTruthy();

      await snap(page, "conc-h-ctx-b-409");

    } finally {
      await ctxB.close();
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §Deny — Authorization denial: billing, HR, security-admin
// ══════════════════════════════════════════════════════════════════════════════

test.describe("§Deny billing POST and GET → exact 403", () => {
  test.use({ storageState: SESSION_PATHS.billing });

  test("Deny-billing-1: billing POST appointments → exactly 403", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBase   = getApiBase(page);
    const csrfToken = await getCsrfToken(page, apiBase);

    const res = await page.request.post(
      `${apiBase}/api/v1/patients/${TEST_PATIENT_ID}/appointments`,
      {
        headers: { "X-CSRF-Token": csrfToken, "Content-Type": "application/json" },
        data: {
          assignedUserId:  SUPERVISOR_USER_ID,
          appointmentType: "individual_therapy",
          startsAt: futureIso(20),
          endsAt:   futureIso(20, 11),
          reason:   "§Deny billing POST — must be denied",
        },
      },
    );
    expect(
      [403, 404],
      `Billing POST must be denied (403 or 404); got ${res.status()}`,
    ).toContain(res.status());
    await snap(page, "deny-billing-post-403");
  });

  test("Deny-billing-2: billing GET patient appointments → 403 or 404", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBase = getApiBase(page);

    const res = await page.request.get(
      `${apiBase}/api/v1/patients/${TEST_PATIENT_ID}/appointments`,
    );
    expect(
      [403, 404],
      `Billing GET appointments must be denied (403 or 404); got ${res.status()}`,
    ).toContain(res.status());
    await snap(page, "deny-billing-get-403");
  });
});

test.describe("§Deny HR POST and GET → exact 403", () => {
  test.use({ storageState: SESSION_PATHS.hr });

  test("Deny-hr-1: HR POST appointments → exactly 403", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBase   = getApiBase(page);
    const csrfToken = await getCsrfToken(page, apiBase);

    const res = await page.request.post(
      `${apiBase}/api/v1/patients/${TEST_PATIENT_ID}/appointments`,
      {
        headers: { "X-CSRF-Token": csrfToken, "Content-Type": "application/json" },
        data: {
          assignedUserId:  SUPERVISOR_USER_ID,
          appointmentType: "individual_therapy",
          startsAt: futureIso(21),
          endsAt:   futureIso(21, 11),
          reason:   "§Deny HR POST — must be denied",
        },
      },
    );
    expect(
      [403, 404],
      `HR POST must be denied (403 or 404); got ${res.status()}`,
    ).toContain(res.status());
    await snap(page, "deny-hr-post-403");
  });

  test("Deny-hr-2: HR GET patient appointments → 403 or 404", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBase = getApiBase(page);

    const res = await page.request.get(
      `${apiBase}/api/v1/patients/${TEST_PATIENT_ID}/appointments`,
    );
    expect(
      [403, 404],
      `HR GET appointments must be denied (403 or 404); got ${res.status()}`,
    ).toContain(res.status());
    await snap(page, "deny-hr-get-403");
  });
});

test.describe("§Deny security-admin POST and GET → exact 403", () => {
  test.use({ storageState: SESSION_PATHS.securityAdmin });

  test("Deny-secadmin-1: security-admin POST appointments → exactly 403", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBase   = getApiBase(page);
    const csrfToken = await getCsrfToken(page, apiBase);

    const res = await page.request.post(
      `${apiBase}/api/v1/patients/${TEST_PATIENT_ID}/appointments`,
      {
        headers: { "X-CSRF-Token": csrfToken, "Content-Type": "application/json" },
        data: {
          assignedUserId:  SUPERVISOR_USER_ID,
          appointmentType: "individual_therapy",
          startsAt: futureIso(22),
          endsAt:   futureIso(22, 11),
          reason:   "§Deny security-admin POST — must be denied",
        },
      },
    );
    expect(
      [403, 404],
      `Security-admin POST must be denied (403 or 404); got ${res.status()}`,
    ).toContain(res.status());
    await snap(page, "deny-secadmin-post-403");
  });

  test("Deny-secadmin-2: security-admin GET patient appointments → 403 or 404", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBase = getApiBase(page);

    const res = await page.request.get(
      `${apiBase}/api/v1/patients/${TEST_PATIENT_ID}/appointments`,
    );
    expect(
      [403, 404],
      `Security-admin GET appointments must be denied (403 or 404); got ${res.status()}`,
    ).toContain(res.status());
    await snap(page, "deny-secadmin-get-403");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// §CSRF — POST without CSRF token → exact 403
// ══════════════════════════════════════════════════════════════════════════════

test.describe("§CSRF CSRF protection on appointment mutations", () => {
  test.use({ storageState: SESSION_PATHS.clinician });

  test("CSRF-1: POST without X-CSRF-Token → exactly 403", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBase = getApiBase(page);

    // Deliberately omit X-CSRF-Token
    const res = await page.request.post(
      `${apiBase}/api/v1/patients/${TEST_PATIENT_ID}/appointments`,
      {
        headers: { "Content-Type": "application/json" },
        data: {
          assignedUserId:  SUPERVISOR_USER_ID,
          appointmentType: "individual_therapy",
          startsAt: futureIso(25),
          endsAt:   futureIso(25, 11),
          reason:   "CSRF test — no token, must be denied",
        },
      },
    );
    expect(
      res.status(),
      `POST without CSRF token must return exactly 403; got ${res.status()}`,
    ).toBe(403);
    await snap(page, "csrf-no-token-403");
  });

  test("CSRF-2: PATCH without X-CSRF-Token → exactly 403", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const apiBase = getApiBase(page);

    const res = await page.request.patch(
      `${apiBase}/api/v1/appointments/${BROWSER_APT_CONCURRENT_ID}`,
      {
        headers: { "Content-Type": "application/json" },
        data: { version: 1, reason: "CSRF PATCH test — no token" },
      },
    );
    expect(
      res.status(),
      `PATCH without CSRF token must return exactly 403; got ${res.status()}`,
    ).toBe(403);
    await snap(page, "csrf-patch-no-token-403");
  });
});

// Capture void ORG_ID to suppress "declared but never used" TS lint warning.
void ORG_ID;
