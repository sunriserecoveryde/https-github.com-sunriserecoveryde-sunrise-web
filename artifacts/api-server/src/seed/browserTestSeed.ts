/**
 * Browser test seed — Phase 3 + Phase 4 True Browser Tests
 *
 * Creates deterministic, idempotent test fixtures that the Playwright
 * browser test suite depends on.  Run this in globalSetup, AFTER authSeed
 * has been run at least once against the target database.
 *
 * Fixtures created:
 *  Phase 3:
 *   - BROWSER_SIGNED_NOTE_ID  — a signed progress note authored by the
 *     certified_clinician, used to test supervisor void flow.
 *   - BROWSER_DRAFT_NOTE_ID   — a draft progress note authored by the
 *     certified_clinician, used to test the concurrency / stale-version flow.
 *
 *  Phase 4 (Scheduling & Appointments):
 *   - BROWSER_APT_EDIT_ID       — a future scheduled appointment for the
 *     edit-appointment browser test (§UI-D).
 *   - BROWSER_APT_CANCEL_ID     — a future scheduled appointment for the
 *     cancel-appointment browser test (§UI-E).
 *   - BROWSER_APT_CONCURRENT_ID — a future scheduled appointment for the
 *     concurrent-update browser test (§Conc-H).
 *
 * All fixtures are for the test patient (TEST_PATIENT_ID) at FACILITY_1.
 * Uses delete-then-insert so every run starts from a known baseline.
 *
 * Also creates TEST_PATIENT_EMPTY_ID — a patient with NO appointments, used
 * by the Empty-state browser test to verify the apt-empty-state UI.
 *
 * MUST NOT run in production (enforced below).
 */

if (process.env.NODE_ENV === "production") {
  throw new Error("browserTestSeed.ts must never run in production. Aborting.");
}

import { db, sosUserAccounts, sosClinicalNotes, sosAppointments, sosPatients } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

// ── Deterministic IDs ────────────────────────────────────────────────────────
export const BROWSER_SIGNED_NOTE_ID  = "00000000-0000-4000-b000-000000000001";
export const BROWSER_DRAFT_NOTE_ID   = "00000000-0000-4000-b000-000000000002";

// Phase 4 appointment fixtures
export const BROWSER_APT_EDIT_ID       = "00000000-0000-4000-a000-000000000011";
export const BROWSER_APT_CANCEL_ID     = "00000000-0000-4000-a000-000000000012";
export const BROWSER_APT_CONCURRENT_ID = "00000000-0000-4000-a000-000000000013";

// Phase 4 empty-state patient — no appointments; used by Empty-2 browser test.
export const TEST_PATIENT_EMPTY_ID = "00000000-0000-4000-a000-000000000098";

// ── Static seed values (must match authSeed.ts) ───────────────────────────────
const ORG_ID          = "00000000-0000-4000-a000-000000000001";
const FACILITY_ID     = "00000000-0000-4000-a000-000000000002";
const TEST_PATIENT_ID = "00000000-0000-4000-a000-000000000099";
const CLINICIAN_EMAIL  = "clinician@test.sunrise";
const SUPERVISOR_EMAIL = "org-admin@test.sunrise";

async function getAccountId(email: string): Promise<string> {
  const [row] = await db
    .select({ id: sosUserAccounts.id })
    .from(sosUserAccounts)
    .where(eq(sosUserAccounts.email, email));
  if (!row) {
    throw new Error(
      `browserTestSeed: user account not found for email "${email}". ` +
      `Run authSeed first.`,
    );
  }
  return row.id;
}

export async function runBrowserTestSeed(): Promise<void> {
  console.log("[browser-seed] Starting browser test fixture seed…");

  const clinicianId  = await getAccountId(CLINICIAN_EMAIL);
  const supervisorId = await getAccountId(SUPERVISOR_EMAIL);

  const now = new Date();

  // ── Wipe ALL appointments for both test patients ──────────────────────────
  //
  // Creation tests (Pos-1, Pos-2, UI-B, UI-C) accumulate appointments across
  // runs.  Removing them all here ensures each run starts from a known baseline
  // and creation tests don't collide with a previous run's leftovers.
  // This is safe: TEST_PATIENT_ID and TEST_PATIENT_EMPTY_ID are fixture-only
  // patients that only exist in the browser-test database.
  await db.delete(sosAppointments).where(eq(sosAppointments.patientId, TEST_PATIENT_ID));
  await db.delete(sosAppointments).where(eq(sosAppointments.patientId, TEST_PATIENT_EMPTY_ID));
  console.log("[browser-seed] All appointments for test patients cleared.");

  // ── Upsert empty-state patient (no appointments) ───────────────────────────
  //
  // TEST_PATIENT_EMPTY_ID is a second patient fixture used exclusively by the
  // Empty-state browser test (Empty-2).  It must exist in sos_patients so the
  // SPA can navigate to it.  Patient access is granted by role (the clinician's
  // mh_therapist role grants facility-wide chart access), so no separate
  // sos_patient_access row is required — matching the same pattern used by
  // authSeed for TEST_PATIENT_ID.  The patient must never have any
  // appointments — enforced by the DELETE above that runs before every seed.
  await db
    .insert(sosPatients)
    .values({
      id:         TEST_PATIENT_EMPTY_ID,
      orgId:      ORG_ID,
      facilityId: FACILITY_ID,
      mrn:        "TEST-0002",
      firstName:  "[TEST]",
      lastName:   "EmptyPatient",
      status:     "active",
    })
    .onConflictDoNothing();

  console.log(`[browser-seed] Empty-state patient ready: ${TEST_PATIENT_EMPTY_ID} (no appointments)`);

  // ── Phase 3: Delete-and-reinsert clinical note fixtures ─────────────────────
  //
  // Tests leave these notes in mutated states (voided, version bumped, etc.).
  // `onConflictDoNothing` would silently keep the dirty state.  Instead, delete
  // both fixture notes first so every test run starts from a known baseline.
  //
  // The DB trigger `sos_clinical_notes_no_edit_after_sign` only blocks UPDATE
  // on already-signed rows — DELETE is always permitted.
  await db
    .delete(sosClinicalNotes)
    .where(
      and(
        inArray(sosClinicalNotes.id, [BROWSER_SIGNED_NOTE_ID, BROWSER_DRAFT_NOTE_ID]),
        eq(sosClinicalNotes.orgId, ORG_ID),
      ),
    );

  console.log("[browser-seed] Old fixture notes deleted (if any).");

  // ── 1. Pre-signed note for void testing ────────────────────────────────────
  //
  // status="signed" satisfies ckSignedConsistency (signedAt + signedByUserId both set).
  // ckVoidConsistency is satisfied because voidedAt / voidedByUserId / voidReason
  // are all omitted (NULL), consistent with status != 'voided'.
  await db
    .insert(sosClinicalNotes)
    .values({
      id:              BROWSER_SIGNED_NOTE_ID,
      orgId:           ORG_ID,
      facilityId:      FACILITY_ID,
      patientId:       TEST_PATIENT_ID,
      authorUserId:    clinicianId,
      noteType:        "progress_note",
      status:          "signed",
      content:         "[BROWSER-SEED] Pre-signed progress note — authored by clinician for supervisor void testing.",
      version:         2,
      signedAt:        now,
      signedByUserId:  clinicianId,
      episodeId:       null,
    });

  console.log(`[browser-seed] Signed note ready: ${BROWSER_SIGNED_NOTE_ID} (status=signed, version=2)`);

  // ── 2. Pre-draft note for concurrency testing ──────────────────────────────
  //
  // version=1 (draft state).  The E-1 test races two browser contexts against
  // this note and expects the second write to receive 409 (stale-version
  // conflict).  Both contexts read the current version from the list response
  // (whatever it is after seed), so the test is resilient to version number —
  // but status MUST be 'draft' for the compose panel to open.
  await db
    .insert(sosClinicalNotes)
    .values({
      id:           BROWSER_DRAFT_NOTE_ID,
      orgId:        ORG_ID,
      facilityId:   FACILITY_ID,
      patientId:    TEST_PATIENT_ID,
      authorUserId: clinicianId,
      noteType:     "progress_note",
      status:       "draft",
      content:      "[BROWSER-SEED] Pre-seeded draft note — version 1, used for concurrency / stale-version test.",
      version:      1,
      episodeId:    null,
    });

  console.log(`[browser-seed] Draft note ready: ${BROWSER_DRAFT_NOTE_ID} (status=draft, version=1)`);

  // ── Phase 4: Delete-and-reinsert appointment fixtures ───────────────────────
  //
  // These appointments are consumed by the Phase 4 browser tests:
  //  - §UI-D (edit): opens edit modal, changes reason, asserts version=2
  //  - §UI-E (cancel): opens cancel dialog, confirms cancellation
  //  - §Conc-H (concurrent): two contexts race → stale-version 409
  //
  // Delete first so every run starts at version=1, status=scheduled.
  // Future dates (now + 30/31/32 days) keep the appointments in the "upcoming"
  // list throughout the test suite.
  await db
    .delete(sosAppointments)
    .where(
      inArray(sosAppointments.id, [
        BROWSER_APT_EDIT_ID,
        BROWSER_APT_CANCEL_ID,
        BROWSER_APT_CONCURRENT_ID,
      ]),
    );

  console.log("[browser-seed] Old fixture appointments deleted (if any).");

  // Base: 30 days from now at 14:00 UTC
  const editDate = new Date(now);
  editDate.setUTCDate(editDate.getUTCDate() + 30);
  editDate.setUTCHours(14, 0, 0, 0);
  const editDateEnd = new Date(editDate);
  editDateEnd.setUTCHours(15, 0, 0, 0);

  // Cancel apt: 31 days from now at 14:00 UTC
  const cancelDate = new Date(now);
  cancelDate.setUTCDate(cancelDate.getUTCDate() + 31);
  cancelDate.setUTCHours(14, 0, 0, 0);
  const cancelDateEnd = new Date(cancelDate);
  cancelDateEnd.setUTCHours(15, 0, 0, 0);

  // Concurrent apt: 32 days from now at 14:00 UTC
  const concurrentDate = new Date(now);
  concurrentDate.setUTCDate(concurrentDate.getUTCDate() + 32);
  concurrentDate.setUTCHours(14, 0, 0, 0);
  const concurrentDateEnd = new Date(concurrentDate);
  concurrentDateEnd.setUTCHours(15, 0, 0, 0);

  // ── 3. Edit test appointment ────────────────────────────────────────────────
  await db.insert(sosAppointments).values({
    id:               BROWSER_APT_EDIT_ID,
    orgId:            ORG_ID,
    facilityId:       FACILITY_ID,
    patientId:        TEST_PATIENT_ID,
    createdByUserId:  clinicianId,
    assignedUserId:   clinicianId,
    appointmentType:  "individual_therapy",
    status:           "scheduled",
    startsAt:         editDate,
    endsAt:           editDateEnd,
    reason:           "[BROWSER-SEED] Edit test — original reason before browser edit.",
    version:          1,
  });

  console.log(`[browser-seed] Edit apt ready: ${BROWSER_APT_EDIT_ID} (${editDate.toISOString()})`);

  // ── 4. Cancel test appointment ─────────────────────────────────────────────
  await db.insert(sosAppointments).values({
    id:               BROWSER_APT_CANCEL_ID,
    orgId:            ORG_ID,
    facilityId:       FACILITY_ID,
    patientId:        TEST_PATIENT_ID,
    createdByUserId:  clinicianId,
    assignedUserId:   clinicianId,
    appointmentType:  "follow_up",
    status:           "scheduled",
    startsAt:         cancelDate,
    endsAt:           cancelDateEnd,
    reason:           "[BROWSER-SEED] Cancel test — this appointment will be cancelled by browser test.",
    version:          1,
  });

  console.log(`[browser-seed] Cancel apt ready: ${BROWSER_APT_CANCEL_ID} (${cancelDate.toISOString()})`);

  // ── 5. Concurrent update test appointment ──────────────────────────────────
  await db.insert(sosAppointments).values({
    id:               BROWSER_APT_CONCURRENT_ID,
    orgId:            ORG_ID,
    facilityId:       FACILITY_ID,
    patientId:        TEST_PATIENT_ID,
    createdByUserId:  clinicianId,
    assignedUserId:   clinicianId,
    appointmentType:  "medication_management",
    status:           "scheduled",
    startsAt:         concurrentDate,
    endsAt:           concurrentDateEnd,
    reason:           "[BROWSER-SEED] Concurrent update test — two contexts race on this appointment.",
    version:          1,
  });

  console.log(`[browser-seed] Concurrent apt ready: ${BROWSER_APT_CONCURRENT_ID} (${concurrentDate.toISOString()})`);

  console.log("[browser-seed] Browser test fixture seed complete.");
  void supervisorId; // unused but kept for future fixture needs
}
