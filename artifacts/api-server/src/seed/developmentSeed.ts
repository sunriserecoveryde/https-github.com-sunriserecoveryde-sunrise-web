/**
 * Development-only database seed for Sunrise OS Phase 1A.
 *
 * Creates one fictitious organisation, one facility, five staff profiles,
 * ten fictitious patients, and one active episode per patient.
 *
 * SAFETY GUARDS:
 *  1. Throws immediately if NODE_ENV === 'production'.
 *  2. All records use clearly fictitious names and are labelled [TEST].
 *  3. Destructive — deletes existing seed data before re-seeding.
 *     Run with: pnpm --filter @workspace/api-server run seed:dev
 *
 * Deterministic IDs allow the devIdentity middleware to reference the
 * seed organisation and facility without a DB lookup.
 */

if (process.env.NODE_ENV === "production") {
  throw new Error(
    "developmentSeed.ts must never run in production. " +
    "NODE_ENV=production was detected. Aborting.",
  );
}

import {
  db,
  sosOrganizations,
  sosFacilities,
  sosUserIdentityRefs,
  sosStaffProfiles,
  sosPatients,
  sosEpisodesOfCare,
} from "@workspace/db";
import { eq } from "drizzle-orm";

// Deterministic seed IDs — match devIdentity.ts constants.
const ORG_ID = "00000000-0000-4000-a000-000000000001";
const FACILITY_ID = "00000000-0000-4000-a000-000000000002";

const SEED_PATIENTS: Array<{
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  insurance: string;
  dx: string;
  program: string;
  loc: string;
  admitDate: string;
}> = [
  { id: "00000000-0000-4000-a000-000000000101", mrn: "SEED-001", firstName: "Alice", lastName: "Testington", dob: "1988-03-14", gender: "F", insurance: "BlueCross", dx: "Severe Opioid Use Disorder", program: "Residential", loc: "3.7", admitDate: "2026-07-20" },
  { id: "00000000-0000-4000-a000-000000000102", mrn: "SEED-002", firstName: "Bob", lastName: "Sampleson", dob: "1993-11-08", gender: "M", insurance: "Aetna", dx: "Severe Alcohol Use Disorder", program: "PHP", loc: "2.5", admitDate: "2026-07-10" },
  { id: "00000000-0000-4000-a000-000000000103", mrn: "SEED-003", firstName: "Carol", lastName: "Demofield", dob: "1975-06-22", gender: "F", insurance: "Cigna", dx: "Severe Methamphetamine Use Disorder", program: "Residential", loc: "3.5", admitDate: "2026-07-15" },
  { id: "00000000-0000-4000-a000-000000000104", mrn: "SEED-004", firstName: "David", lastName: "Placeholder", dob: "2000-01-30", gender: "M", insurance: "Maryland Medicaid", dx: "Severe Cocaine Use Disorder", program: "IOP", loc: "2.1", admitDate: "2026-07-18" },
  { id: "00000000-0000-4000-a000-000000000105", mrn: "SEED-005", firstName: "Emma", lastName: "Fictional", dob: "1968-09-05", gender: "F", insurance: "Medicare", dx: "Severe Alcohol Use Disorder, Generalized Anxiety Disorder", program: "PHP", loc: "2.5", admitDate: "2026-07-01" },
  { id: "00000000-0000-4000-a000-000000000106", mrn: "SEED-006", firstName: "Frank", lastName: "Testdata", dob: "1991-04-17", gender: "M", insurance: "UnitedHealthcare", dx: "Severe Polysubstance Use Disorder", program: "Residential", loc: "3.7", admitDate: "2026-07-22" },
  { id: "00000000-0000-4000-a000-000000000107", mrn: "SEED-007", firstName: "Grace", lastName: "Sandbox", dob: "1985-12-02", gender: "F", insurance: "Self-Pay", dx: "Severe Opioid Use Disorder, PTSD", program: "Residential", loc: "3.5", admitDate: "2026-07-12" },
  { id: "00000000-0000-4000-a000-000000000108", mrn: "SEED-008", firstName: "Henry", lastName: "Mockperson", dob: "1978-07-19", gender: "M", insurance: "BlueCross", dx: "Severe Alcohol Use Disorder, Bipolar I", program: "IOP", loc: "2.1", admitDate: "2026-07-05" },
  { id: "00000000-0000-4000-a000-000000000109", mrn: "SEED-009", firstName: "Iris", lastName: "Devonly", dob: "2002-02-28", gender: "F", insurance: "Cigna", dx: "Severe Cannabis Use Disorder, Major Depressive Disorder", program: "PHP", loc: "2.5", admitDate: "2026-07-25" },
  { id: "00000000-0000-4000-a000-000000000110", mrn: "SEED-010", firstName: "James", lastName: "Exampledata", dob: "1955-10-11", gender: "M", insurance: "Medicare", dx: "Severe Alcohol Use Disorder", program: "Residential", loc: "3.1", admitDate: "2026-07-08" },
];

async function seed() {
  console.log("[seed] Starting development seed — not for production use.");

  // ── Clean up existing seed data (idempotent) ────────────────────────────
  console.log("[seed] Removing existing seed data...");
  await db.delete(sosEpisodesOfCare).where(eq(sosEpisodesOfCare.orgId, ORG_ID));
  await db.delete(sosPatients).where(eq(sosPatients.orgId, ORG_ID));
  await db.delete(sosStaffProfiles).where(eq(sosStaffProfiles.orgId, ORG_ID));
  await db.delete(sosUserIdentityRefs).where(eq(sosUserIdentityRefs.orgId, ORG_ID));
  await db.delete(sosFacilities).where(eq(sosFacilities.orgId, ORG_ID));
  await db.delete(sosOrganizations).where(eq(sosOrganizations.id, ORG_ID));

  // ── Organisation ─────────────────────────────────────────────────────────
  console.log("[seed] Creating organisation...");
  await db.insert(sosOrganizations).values({
    id: ORG_ID,
    name: "[TEST] Sunrise Health Maryland",
    slug: "test-sunrise-health-maryland",
    status: "active",
  });

  // ── Facility ─────────────────────────────────────────────────────────────
  console.log("[seed] Creating facility...");
  await db.insert(sosFacilities).values({
    id: FACILITY_ID,
    orgId: ORG_ID,
    name: "[TEST] Baltimore Treatment Center",
    status: "active",
    timeZone: "America/New_York",
  });

  // ── Staff profiles ────────────────────────────────────────────────────────
  console.log("[seed] Creating 5 staff profiles...");
  const staffRoles = [
    { displayName: "[TEST] Sarah Jenkins, LCPC", role: "certified_clinician" },
    { displayName: "[TEST] David Odom, LCADC", role: "certified_clinician" },
    { displayName: "[TEST] Dr. Robert Chen", role: "medical_director" },
    { displayName: "[TEST] Jessica Torres, RN", role: "nursing" },
    { displayName: "[TEST] Marcus Williams", role: "director_of_operations" },
  ];
  for (const s of staffRoles) {
    const [userRef] = await db
      .insert(sosUserIdentityRefs)
      .values({ orgId: ORG_ID })
      .returning();
    await db.insert(sosStaffProfiles).values({
      orgId: ORG_ID,
      userId: userRef.id,
      displayName: s.displayName,
      professionalRole: s.role,
    });
  }

  // ── Patients and episodes ─────────────────────────────────────────────────
  console.log("[seed] Creating 10 patients with active episodes...");
  for (const p of SEED_PATIENTS) {
    await db.insert(sosPatients).values({
      id: p.id,
      orgId: ORG_ID,
      facilityId: FACILITY_ID,
      mrn: p.mrn,
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: p.dob,
      gender: p.gender,
      insurancePayer: p.insurance,
      primaryDiagnosis: p.dx,
      status: "active",
    });

    await db.insert(sosEpisodesOfCare).values({
      orgId: ORG_ID,
      facilityId: FACILITY_ID,
      patientId: p.id,
      program: p.program,
      levelOfCare: p.loc,
      admissionDate: p.admitDate,
      dischargeDate: null,
      episodeStatus: "active",
    });
  }

  console.log("[seed] Done. Created:");
  console.log("  1 organisation:", ORG_ID);
  console.log("  1 facility:", FACILITY_ID);
  console.log("  5 staff profiles");
  console.log("  10 patients with active episodes");
  console.log("");
  console.log("[seed] Use these in API calls:");
  console.log("  X-Dev-Org-Id:", ORG_ID);
  console.log("  X-Dev-Facility-Id:", FACILITY_ID);
}

seed().catch((err) => {
  console.error("[seed] Fatal error:", err);
  process.exit(1);
});
