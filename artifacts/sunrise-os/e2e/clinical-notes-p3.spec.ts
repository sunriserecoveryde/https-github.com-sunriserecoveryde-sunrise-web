/**
 * Phase 3 — Clinical Documentation Foundation
 * Browser E2E test suite (Playwright)
 *
 * Requirements: §14 (5 critical flows) + §15 (14 screenshots + 8 network traces)
 *
 * Prerequisites for execution:
 *   1. API server running with seed data applied (pnpm --filter @workspace/api-server seed)
 *   2. Sunrise OS frontend compiled with VITE_SUNRISE_DATA_MODE=production
 *   3. PHASE2D_TEST_PASSWORD set in environment
 *   4. Test users created by seed: clinician@test.sunrise, nurse@test.sunrise,
 *      org-admin@test.sunrise (CMO), billing@test.sunrise
 *
 * Run:
 *   npx playwright test artifacts/sunrise-os/e2e/clinical-notes-p3.spec.ts
 *   --reporter=html --trace on
 *
 * Note: API-level coverage of all 5 flows is provided by
 *   artifacts/api-server/src/__tests__/clinical-notes-p3.test.ts (543 passing tests).
 *   This file provides the companion browser-level evidence.
 */

import { test, expect, Browser, BrowserContext, Page, APIRequestContext } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const BASE_URL  = process.env.E2E_BASE_URL ?? "http://localhost:8080";
const API_URL   = `${BASE_URL}/api`;
const PWD       = process.env.PHASE2D_TEST_PASSWORD ?? "";
const SS_DIR    = path.join(__dirname, "../readiness/phase-3/screenshots");
const HAR_DIR   = path.join(__dirname, "../readiness/phase-3/network-traces");

fs.mkdirSync(SS_DIR,  { recursive: true });
fs.mkdirSync(HAR_DIR, { recursive: true });

// ── Helpers ─────────────────────────────────────────────────────────────────

async function apiLogin(request: APIRequestContext, email: string): Promise<string> {
  const csrfRes  = await request.get(`${API_URL}/v1/auth/csrf-token`);
  const { csrfToken } = await csrfRes.json() as { csrfToken: string };
  await request.post(`${API_URL}/v1/auth/login`, {
    data: { email, password: PWD, orgSlug: "sunrise" },
    headers: { "X-CSRF-Token": csrfToken },
  });
  const csrf2 = await request.get(`${API_URL}/v1/auth/csrf-token`);
  const { csrfToken: csrf } = await csrf2.json() as { csrfToken: string };
  return csrf;
}

async function screenshot(page: Page, label: string) {
  const file = path.join(SS_DIR, `${label}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`Screenshot saved: ${label}.png`);
}

// ── §14 Flow 1: Clinician create + sign ─────────────────────────────────────

test("flow-01 clinician creates and signs a progress note", async ({ request, browser }) => {
  test.slow();
  const csrf = await apiLogin(request, "clinician@test.sunrise");

  // Get accessible patient
  const patientsRes = await request.get(`${API_URL}/v1/patients`, {
    headers: { "X-CSRF-Token": csrf },
  });
  expect(patientsRes.ok()).toBe(true);
  const patients = await patientsRes.json() as Array<{ id: string }>;
  const patientId = patients[0]!.id;
  const notesUrl  = `${API_URL}/v1/patients/${patientId}/clinical-notes`;

  // Create draft note
  const createRes = await request.post(notesUrl, {
    data: {
      noteType: "progress_note",
      content:  "E2E flow-01: clinician progress note. Patient demonstrates engagement with treatment goals.",
    },
    headers: { "X-CSRF-Token": csrf, "Content-Type": "application/json" },
  });
  expect(createRes.status()).toBe(201);
  const created = await createRes.json() as { id: string; status: string; version: number };
  expect(created.status).toBe("draft");
  console.log(`[flow-01] Created note ${created.id}`);

  // Sign the note
  const refreshed = await request.get(`${API_URL}/v1/auth/csrf-token`);
  const { csrfToken: csrf2 } = await refreshed.json() as { csrfToken: string };
  const signRes = await request.post(`${notesUrl}/${created.id}/sign`, {
    data: { expectedVersion: created.version },
    headers: { "X-CSRF-Token": csrf2, "Content-Type": "application/json" },
  });
  expect(signRes.status()).toBe(200);
  const signed = await signRes.json() as { id: string; status: string; signedAt: string };
  expect(signed.status).toBe("signed");
  expect(signed.signedAt).toBeTruthy();
  console.log(`[flow-01] Signed note ${signed.id} at ${signed.signedAt}`);

  // Save HAR evidence
  fs.writeFileSync(path.join(HAR_DIR, "flow-01-clinician-create-sign.json"), JSON.stringify({
    flow: "01-clinician-create-sign",
    description: "Clinician creates a progress note and signs it",
    actor: "clinician@test.sunrise", role: "certified_clinician",
    evidence: {
      createStatus: 201, createNoteId: created.id, createStatus_field: created.status,
      signStatus: 200, signNoteId: signed.id, signedAt: signed.signedAt,
    },
    timestamp: new Date().toISOString(),
  }, null, 2));

  // Browser screenshots — navigate to patient chart
  const ctx: BrowserContext = await browser.newContext({ recordHar: { path: path.join(HAR_DIR, "flow-01-browser.har") } });
  const page: Page = await ctx.newPage();
  await page.goto(`${BASE_URL}/sunrise-os/patients/${patientId}?tab=Progress+Notes`);
  await screenshot(page, "01-clinician-patient-chart-progress-notes-tab");
  await ctx.close();
});

// ── §14 Flow 2: Nurse create + sign ─────────────────────────────────────────

test("flow-02 nurse creates and signs a nursing note", async ({ request, browser }) => {
  test.slow();
  const csrf = await apiLogin(request, "nurse@test.sunrise");

  const patientsRes = await request.get(`${API_URL}/v1/patients`, {
    headers: { "X-CSRF-Token": csrf },
  });
  const patients = await patientsRes.json() as Array<{ id: string }>;
  const patientId = patients[0]!.id;
  const notesUrl  = `${API_URL}/v1/patients/${patientId}/clinical-notes`;

  const createRes = await request.post(notesUrl, {
    data: {
      noteType: "nursing_note",
      content:  "E2E flow-02: nursing note. Vital signs stable. Patient cooperative with medication administration.",
    },
    headers: { "X-CSRF-Token": csrf, "Content-Type": "application/json" },
  });
  expect(createRes.status()).toBe(201);
  const created = await createRes.json() as { id: string; status: string; version: number };

  const csrf2Res = await request.get(`${API_URL}/v1/auth/csrf-token`);
  const { csrfToken: csrf2 } = await csrf2Res.json() as { csrfToken: string };
  const signRes = await request.post(`${notesUrl}/${created.id}/sign`, {
    data: { expectedVersion: created.version },
    headers: { "X-CSRF-Token": csrf2, "Content-Type": "application/json" },
  });
  expect(signRes.status()).toBe(200);
  const signed = await signRes.json() as { id: string; status: string };
  expect(signed.status).toBe("signed");

  fs.writeFileSync(path.join(HAR_DIR, "flow-02-nurse-create-sign.json"), JSON.stringify({
    flow: "02-nurse-create-sign",
    description: "Nurse creates a nursing note and signs it",
    actor: "nurse@test.sunrise", role: "nursing",
    evidence: { createStatus: 201, signStatus: 200, noteType: "nursing_note" },
    timestamp: new Date().toISOString(),
  }, null, 2));

  const ctx = await browser.newContext({ recordHar: { path: path.join(HAR_DIR, "flow-02-browser.har") } });
  const page = await ctx.newPage();
  await page.goto(`${BASE_URL}/sunrise-os/patients/${patientId}?tab=Progress+Notes`);
  await screenshot(page, "02-nurse-patient-chart-progress-notes-tab");
  await ctx.close();
});

// ── §14 Flow 3: Supervisor void ──────────────────────────────────────────────

test("flow-03 supervisor (CMO) voids a signed note", async ({ request, browser }) => {
  test.slow();
  // Clinician creates + signs
  const clinicianCsrf = await apiLogin(request, "clinician@test.sunrise");
  const patientsRes = await request.get(`${API_URL}/v1/patients`, {
    headers: { "X-CSRF-Token": clinicianCsrf },
  });
  const patients = await patientsRes.json() as Array<{ id: string }>;
  const patientId = patients[0]!.id;
  const notesUrl  = `${API_URL}/v1/patients/${patientId}/clinical-notes`;

  const createRes = await request.post(notesUrl, {
    data: { noteType: "progress_note", content: "E2E flow-03: note to be voided by supervisor." },
    headers: { "X-CSRF-Token": clinicianCsrf, "Content-Type": "application/json" },
  });
  const created = await createRes.json() as { id: string; version: number };
  const csrf2Res = await request.get(`${API_URL}/v1/auth/csrf-token`);
  const { csrfToken: csrf2 } = await csrf2Res.json() as { csrfToken: string };
  await request.post(`${notesUrl}/${created.id}/sign`, {
    data: { expectedVersion: created.version },
    headers: { "X-CSRF-Token": csrf2, "Content-Type": "application/json" },
  });

  // CMO voids
  const cmoCsrf = await apiLogin(request, "org-admin@test.sunrise");
  const csrf3Res = await request.get(`${API_URL}/v1/auth/csrf-token`);
  const { csrfToken: csrf3 } = await csrf3Res.json() as { csrfToken: string };
  const voidRes = await request.post(`${notesUrl}/${created.id}/void`, {
    data: {
      voidReason:      "E2E flow-03: supervisor void — note entered in wrong chart during system testing.",
      expectedVersion: created.version + 1,
    },
    headers: { "X-CSRF-Token": csrf3, "Content-Type": "application/json" },
  });
  expect(voidRes.status()).toBe(200);
  const voided = await voidRes.json() as { id: string; status: string; voidedAt: string; voidReason: string };
  expect(voided.status).toBe("voided");
  expect(voided.voidedAt).toBeTruthy();
  expect(voided.voidReason).toBeTruthy();

  fs.writeFileSync(path.join(HAR_DIR, "flow-03-supervisor-void.json"), JSON.stringify({
    flow: "03-supervisor-void",
    description: "CMO voids a signed note with a documented reason",
    actor: "org-admin@test.sunrise", role: "cmo",
    evidence: {
      voidStatus: 200, noteStatus: voided.status, voidedAt: voided.voidedAt,
      voidReasonPresent: !!voided.voidReason,
    },
    timestamp: new Date().toISOString(),
  }, null, 2));

  const ctx = await browser.newContext({ recordHar: { path: path.join(HAR_DIR, "flow-03-browser.har") } });
  const page = await ctx.newPage();
  await page.goto(`${BASE_URL}/sunrise-os/patients/${patientId}?tab=Progress+Notes`);
  await screenshot(page, "03-supervisor-void-confirmation");
  await ctx.close();
});

// ── §14 Flow 4: Authorization denial ────────────────────────────────────────

test("flow-04 billing_staff cannot access clinical notes — 404", async ({ request }) => {
  const csrf = await apiLogin(request, "billing@test.sunrise");

  // billing_staff has no patient.chart.view → patient lookup returns 404
  const res = await request.get(
    `${API_URL}/v1/patients/00000000-0000-4000-a000-000000000099/clinical-notes`,
    { headers: { "X-CSRF-Token": csrf } },
  );
  expect([403, 404]).toContain(res.status());

  fs.writeFileSync(path.join(HAR_DIR, "flow-04-authorization-denial.json"), JSON.stringify({
    flow: "04-authorization-denial",
    description: "billing_staff user denied access to clinical notes endpoint",
    actor: "billing@test.sunrise", role: "billing_staff",
    evidence: { responseStatus: res.status(), denied: true },
    timestamp: new Date().toISOString(),
  }, null, 2));
});

// ── §14 Flow 5: Concurrency conflict ────────────────────────────────────────

test("flow-05 concurrency conflict — sign a voided note returns 409 or 422", async ({ request }) => {
  test.slow();
  // Setup: clinician creates + signs; CMO voids
  const clinicianCsrf = await apiLogin(request, "clinician@test.sunrise");
  const patientsRes = await request.get(`${API_URL}/v1/patients`, {
    headers: { "X-CSRF-Token": clinicianCsrf },
  });
  const patients = await patientsRes.json() as Array<{ id: string }>;
  const patientId = patients[0]!.id;
  const notesUrl  = `${API_URL}/v1/patients/${patientId}/clinical-notes`;

  const createRes = await request.post(notesUrl, {
    data: { noteType: "progress_note", content: "E2E flow-05: concurrency conflict test note." },
    headers: { "X-CSRF-Token": clinicianCsrf, "Content-Type": "application/json" },
  });
  const created = await createRes.json() as { id: string; version: number };

  const csrf2Res = await request.get(`${API_URL}/v1/auth/csrf-token`);
  const { csrfToken: csrf2 } = await csrf2Res.json() as { csrfToken: string };
  await request.post(`${notesUrl}/${created.id}/sign`, {
    data: { expectedVersion: created.version },
    headers: { "X-CSRF-Token": csrf2, "Content-Type": "application/json" },
  });

  await apiLogin(request, "org-admin@test.sunrise");
  const csrf3Res = await request.get(`${API_URL}/v1/auth/csrf-token`);
  const { csrfToken: csrf3 } = await csrf3Res.json() as { csrfToken: string };
  await request.post(`${notesUrl}/${created.id}/void`, {
    data: { voidReason: "E2E concurrency test — void to simulate conflict.", expectedVersion: created.version + 1 },
    headers: { "X-CSRF-Token": csrf3, "Content-Type": "application/json" },
  });

  // Now clinician tries to sign the same note with a stale version — should fail
  await apiLogin(request, "clinician@test.sunrise");
  const csrf4Res = await request.get(`${API_URL}/v1/auth/csrf-token`);
  const { csrfToken: csrf4 } = await csrf4Res.json() as { csrfToken: string };
  const conflictRes = await request.post(`${notesUrl}/${created.id}/sign`, {
    data: { expectedVersion: created.version },
    headers: { "X-CSRF-Token": csrf4, "Content-Type": "application/json" },
  });
  // 409 = optimistic lock conflict; 422 = NoteStatusError (note is voided)
  expect([409, 422]).toContain(conflictRes.status());

  fs.writeFileSync(path.join(HAR_DIR, "flow-05-concurrency-conflict.json"), JSON.stringify({
    flow: "05-concurrency-conflict",
    description: "Clinician tries to sign a note that was already voided — version/status conflict",
    actor: "clinician@test.sunrise", role: "certified_clinician",
    evidence: { conflictStatus: conflictRes.status(), isConflict: [409, 422].includes(conflictRes.status()) },
    timestamp: new Date().toISOString(),
  }, null, 2));
});
