/**
 * Authentication seed — Phase 2
 *
 * Creates fictitious test users with Argon2id-hashed passwords.
 * MUST NOT run in production (enforced at the top of this file).
 *
 * Users:
 *  1. org-admin@test.sunrise  — CMO / org admin, facility-wide
 *  2. facility-admin@test.sunrise — Director of Operations, facility-scoped
 *  3. clinician@test.sunrise  — Certified Clinician, facility-scoped
 *  4. nurse@test.sunrise      — Nursing, facility-scoped
 *  5. billing@test.sunrise    — Billing Staff, facility-scoped
 *  6. readonly@test.sunrise   — Read-only (BHT, explicit patient access only)
 *  7. other-facility@test.sunrise — Clinician assigned to a SECOND facility only
 *  8. disabled@test.sunrise   — Disabled account (cannot log in)
 *  9. expired-role@test.sunrise — Active account, but role assignment expired yesterday
 *
 * Passwords are set from DEV_TEST_PASSWORD env variable (required) or a
 * generated one printed to stdout — never to a file.
 *
 * Run: pnpm --filter @workspace/api-server run seed:auth
 */

if (process.env.NODE_ENV === "production") {
  throw new Error("authSeed.ts must never run in production. Aborting.");
}

import * as argon2 from "argon2";
import { db } from "@workspace/db";
import {
  sosOrganizations,
  sosFacilities,
  sosUserIdentityRefs,
  sosStaffProfiles,
  sosUserAccounts,
  sosRoleAssignments,
  sosPatientAccess,
  sosPatients,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

const ORG_ID      = "00000000-0000-4000-a000-000000000001";
const FACILITY_ID = "00000000-0000-4000-a000-000000000002";

// Second facility for the cross-facility access test.
const FACILITY_2_ID = "00000000-0000-4000-a000-000000000003";

const ARGON2_OPTIONS: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
};

interface TestUser {
  email:       string;
  displayName: string;
  roleId:      string;
  facilityId?: string;  // undefined = org-wide
  status?:     "active" | "disabled";
  roleExpired?: boolean;
}

const TEST_USERS: TestUser[] = [
  {
    email:       "org-admin@test.sunrise",
    displayName: "[TEST] Alex Rivera, CMO",
    roleId:      "cmo",
    facilityId:  undefined,   // org-wide
  },
  {
    email:       "facility-admin@test.sunrise",
    displayName: "[TEST] Morgan Chen, Dir. Operations",
    roleId:      "director_of_operations",
    facilityId:  FACILITY_ID,
  },
  {
    email:       "clinician@test.sunrise",
    displayName: "[TEST] Jordan Kim, LCPC",
    roleId:      "certified_clinician",
    facilityId:  FACILITY_ID,
  },
  {
    email:       "nurse@test.sunrise",
    displayName: "[TEST] Taylor Patel, RN",
    roleId:      "nursing",
    facilityId:  FACILITY_ID,
  },
  {
    email:       "billing@test.sunrise",
    displayName: "[TEST] Casey Nguyen, Billing",
    roleId:      "billing_staff",
    facilityId:  FACILITY_ID,
  },
  {
    email:       "readonly@test.sunrise",
    displayName: "[TEST] Riley Santos, BHT",
    roleId:      "bht",
    facilityId:  FACILITY_ID,
  },
  {
    email:       "other-facility@test.sunrise",
    displayName: "[TEST] Quinn Okafor, Clinician (Facility 2)",
    roleId:      "certified_clinician",
    facilityId:  FACILITY_2_ID,
  },
  {
    email:       "disabled@test.sunrise",
    displayName: "[TEST] Sam Disabled (no login)",
    roleId:      "certified_clinician",
    facilityId:  FACILITY_ID,
    status:      "disabled",
  },
  {
    email:       "expired-role@test.sunrise",
    displayName: "[TEST] Drew Expired (role expired)",
    roleId:      "certified_clinician",
    facilityId:  FACILITY_ID,
    roleExpired: true,
  },
];

async function seed() {
  console.log("[auth-seed] Starting Phase 2 authentication seed...");

  const testPassword = process.env.DEV_TEST_PASSWORD;
  if (!testPassword) {
    const generated = `TestPass_${Math.random().toString(36).slice(2, 10)}!A`;
    console.log("");
    console.log("⚠️  DEV_TEST_PASSWORD not set. Generated password for this run:");
    console.log(`    ${generated}`);
    console.log("    Set DEV_TEST_PASSWORD to use a consistent password across runs.");
    console.log("");
    // Use generated password for this run.
    process.env.DEV_TEST_PASSWORD = generated;
  }
  const password = process.env.DEV_TEST_PASSWORD!;

  // Hash the password once and reuse.
  const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
  console.log("[auth-seed] Password hash computed.");

  // Ensure org and primary facility exist (created by developmentSeed.ts).
  const [org] = await db
    .select({ id: sosOrganizations.id })
    .from(sosOrganizations)
    .where(eq(sosOrganizations.id, ORG_ID))
    .limit(1);
  if (!org) {
    console.error("[auth-seed] Organisation not found. Run seed:dev first.");
    process.exit(1);
  }

  // Create second facility if needed.
  const [fac2] = await db
    .select({ id: sosFacilities.id })
    .from(sosFacilities)
    .where(eq(sosFacilities.id, FACILITY_2_ID))
    .limit(1);
  if (!fac2) {
    console.log("[auth-seed] Creating second test facility...");
    await db.insert(sosFacilities).values({
      id:       FACILITY_2_ID,
      orgId:    ORG_ID,
      name:     "[TEST] Rockville Treatment Center",
      status:   "active",
      timeZone: "America/New_York",
    });
  }

  // Remove existing auth seed accounts.
  console.log("[auth-seed] Removing existing auth seed accounts...");
  for (const u of TEST_USERS) {
    const [existing] = await db
      .select({ id: sosUserAccounts.id })
      .from(sosUserAccounts)
      .where(and(eq(sosUserAccounts.orgId, ORG_ID), eq(sosUserAccounts.email, u.email)))
      .limit(1);
    if (existing) {
      await db.delete(sosRoleAssignments).where(eq(sosRoleAssignments.userId, existing.id));
      await db.delete(sosUserAccounts).where(eq(sosUserAccounts.id, existing.id));
    }
  }

  // Create users.
  for (const u of TEST_USERS) {
    // Create identity ref.
    const [identityRef] = await db
      .insert(sosUserIdentityRefs)
      .values({ orgId: ORG_ID })
      .returning();

    // Create user account.
    const now = new Date();
    const [account] = await db
      .insert(sosUserAccounts)
      .values({
        orgId:             ORG_ID,
        userIdentityRefId: identityRef.id,
        email:             u.email,
        passwordHash,
        status:            u.status ?? "active",
        disabledAt:        u.status === "disabled" ? now : null,
        passwordChangedAt: now,
      })
      .returning({ id: sosUserAccounts.id });

    // Create staff profile.
    // IMPORTANT: sos_staff_profiles.user_id FK → sos_user_identity_refs(org_id, id),
    // NOT sos_user_accounts.id.  Use identityRef.id here.
    await db.insert(sosStaffProfiles).values({
      orgId:            ORG_ID,
      userId:           identityRef.id,
      displayName:      u.displayName,
      professionalRole: u.roleId,
    });

    // Create role assignment.
    const yesterday = new Date(now.getTime() - 24 * 60 * 60_000);
    await db.insert(sosRoleAssignments).values({
      orgId:      ORG_ID,
      userId:     account.id,
      roleId:     u.roleId,
      facilityId: u.facilityId ?? null,
      status:     "active",
      effectiveAt: new Date(now.getTime() - 7 * 24 * 60 * 60_000),
      expiresAt:  u.roleExpired ? yesterday : null,
    });

    // For the read-only BHT user, add explicit patient access to the first seed patient.
    if (u.email === "readonly@test.sunrise") {
      const [patient] = await db
        .select({ id: sosPatients.id })
        .from(sosPatients)
        .where(eq(sosPatients.orgId, ORG_ID))
        .limit(1);
      if (patient) {
        await db.insert(sosPatientAccess).values({
          orgId:            ORG_ID,
          facilityId:       FACILITY_ID,
          patientId:        patient.id,
          userId:           account.id,
          relationshipType: "caseload_member",
          status:           "active",
        });
      }
    }

    console.log(`[auth-seed]   ✓ ${u.email} (${u.roleId}${u.status === "disabled" ? " — DISABLED" : ""}${u.roleExpired ? " — ROLE EXPIRED" : ""})`);
  }

  console.log("");
  console.log("[auth-seed] Done. Test users created:");
  console.log("  Org:      ", ORG_ID);
  console.log("  Facility: ", FACILITY_ID);
  console.log("");
  console.log("  Login at POST /api/v1/auth/login with:");
  console.log(`  { \"email\": \"clinician@test.sunrise\", \"password\": \"${password}\" }`);
  console.log("");
  console.log("  NOTE: passwords are NOT stored in this output beyond this run.");
  console.log("  Set DEV_TEST_PASSWORD in your environment for reproducible seeding.");
}

// Export so test files can call seed() directly from vitest (TS-transpiled context).
export { seed as runAuthSeed };

// Auto-run only when invoked as a standalone script (not when imported by tests).
const isDirectScript =
  process.argv[1]?.includes("authSeed") ||
  process.env.SEED_AUTORUN === "1";

if (isDirectScript) {
  seed().catch((err) => {
    console.error("[auth-seed] Fatal:", err);
    process.exit(1);
  });
}
