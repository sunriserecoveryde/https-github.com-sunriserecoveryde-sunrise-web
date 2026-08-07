/**
 * Browser test seed — Phase 3 True Browser Tests
 *
 * Creates deterministic, idempotent test fixtures that the Playwright
 * browser test suite depends on.  Run this in globalSetup, AFTER authSeed
 * has been run at least once against the target database.
 *
 * Fixtures created:
 *  - BROWSER_SIGNED_NOTE_ID  — a signed progress note authored by the
 *    certified_clinician, used to test supervisor void flow.
 *  - BROWSER_DRAFT_NOTE_ID   — a draft progress note authored by the
 *    certified_clinician, used to test the concurrency / stale-version flow.
 *
 * Both notes are for the test patient (TEST_PATIENT_ID) at FACILITY_1.
 * Uses onConflictDoNothing so repeated runs are idempotent.
 *
 * MUST NOT run in production (enforced below).
 */

if (process.env.NODE_ENV === "production") {
  throw new Error("browserTestSeed.ts must never run in production. Aborting.");
}

import { db, sosUserAccounts, sosClinicalNotes } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

// ── Deterministic IDs ────────────────────────────────────────────────────────
export const BROWSER_SIGNED_NOTE_ID  = "00000000-0000-4000-b000-000000000001";
export const BROWSER_DRAFT_NOTE_ID   = "00000000-0000-4000-b000-000000000002";

// ── Static seed values (must match authSeed.ts) ───────────────────────────────
const ORG_ID         = "00000000-0000-4000-a000-000000000001";
const FACILITY_ID    = "00000000-0000-4000-a000-000000000002";
const TEST_PATIENT_ID = "00000000-0000-4000-a000-000000000099";
const CLINICIAN_EMAIL = "clinician@test.sunrise";
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

  // ── Delete-and-reinsert strategy ─────────────────────────────────────────────
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

  console.log("[browser-seed] Browser test fixture seed complete.");
  void supervisorId; // unused but kept for future fixture needs
}
