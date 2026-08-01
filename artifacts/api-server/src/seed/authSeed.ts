/**
 * Authentication seed — Phase 2B
 *
 * Creates fictitious test users with Argon2id-hashed passwords.
 * Also seeds the org slug required for tenant-deterministic login.
 * MUST NOT run in production (enforced at the top of this file).
 *
 * Users seeded:
 *  1.  org-admin@test.sunrise        — CMO / org-wide admin
 *  2.  facility-admin@test.sunrise   — Director of Operations, facility-scoped
 *  3.  clinician@test.sunrise        — Certified Clinician, Facility 1
 *  4.  nurse@test.sunrise            — Nursing, Facility 1
 *  5.  billing@test.sunrise          — Billing Staff, Facility 1 (caseload-limited)
 *  6.  readonly@test.sunrise         — BHT, Facility 1 (caseload-limited)
 *  7.  other-facility@test.sunrise   — Clinician, Facility 2 only
 *  8.  disabled@test.sunrise         — Disabled account
 *  9.  expired-role@test.sunrise     — Active account, expired role assignment
 *  10. security-admin@test.sunrise   — Security admin (org-wide, NO patient access)
 *  11. multi-facility@test.sunrise   — Clinician at BOTH facilities
 *  12. mixed-role@test.sunrise       — Security admin (org-wide) + BHT (facility-1 caseload-limited)
 *
 * Phase 2B mixed-role exploit cases:
 *  A. security-admin + BHT: org-wide security admin must NOT get org-wide patient access
 *  B. multi-facility: clinical access limited to assigned facilities only
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
import { eq, and, isNull } from "drizzle-orm";

const ORG_ID      = "00000000-0000-4000-a000-000000000001";
const FACILITY_ID = "00000000-0000-4000-a000-000000000002";
const FACILITY_2_ID = "00000000-0000-4000-a000-000000000003";
const ORG_SLUG    = "sunrise";

const ARGON2_OPTIONS: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
};

interface TestUser {
  email:        string;
  displayName:  string;
  roleId:       string;
  facilityId?:  string;  // undefined = org-wide
  status?:      "active" | "disabled";
  roleExpired?: boolean;
  secondRole?:  { roleId: string; facilityId?: string };  // Phase 2B: mixed-role users
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
    displayName: "[TEST] Sam Okafor, RN",
    roleId:      "nursing",
    facilityId:  FACILITY_ID,
  },
  {
    email:       "billing@test.sunrise",
    displayName: "[TEST] Chris Walsh, Billing",
    roleId:      "billing_staff",
    facilityId:  FACILITY_ID,
  },
  {
    email:       "readonly@test.sunrise",
    displayName: "[TEST] Taylor Nguyen, BHT",
    roleId:      "bht",
    facilityId:  FACILITY_ID,
  },
  {
    email:       "other-facility@test.sunrise",
    displayName: "[TEST] Jamie Flores, LCPC (Facility 2)",
    roleId:      "certified_clinician",
    facilityId:  FACILITY_2_ID,
  },
  {
    email:       "disabled@test.sunrise",
    displayName: "[TEST] Disabled User",
    roleId:      "certified_clinician",
    facilityId:  FACILITY_ID,
    status:      "disabled",
  },
  {
    email:       "expired-role@test.sunrise",
    displayName: "[TEST] Expired Role User",
    roleId:      "certified_clinician",
    facilityId:  FACILITY_ID,
    roleExpired: true,
  },
  {
    email:       "security-admin@test.sunrise",
    displayName: "[TEST] Security Admin (org-wide, no patient access)",
    roleId:      "security_admin",
    facilityId:  undefined,   // org-wide security admin
  },
  {
    email:       "multi-facility@test.sunrise",
    displayName: "[TEST] Multi-facility Clinician (both facilities)",
    roleId:      "certified_clinician",
    facilityId:  FACILITY_ID,
    secondRole:  { roleId: "certified_clinician", facilityId: FACILITY_2_ID },
  },
  {
    // Mixed-role exploit case: org-wide security_admin + facility-1 BHT.
    // Must NOT gain org-wide patient access.
    // Expected: can only see explicitly assigned patients in Facility 1 (BHT caseload).
    email:       "mixed-role@test.sunrise",
    displayName: "[TEST] Mixed-Role User (security_admin + BHT)",
    roleId:      "security_admin",
    facilityId:  undefined,   // org-wide security admin
    secondRole:  { roleId: "bht", facilityId: FACILITY_ID },
  },
];

// ── Seed helper ───────────────────────────────────────────────────────────────

async function upsertOrg(): Promise<void> {
  // Try insert; if the org row already exists, just update slug and name.
  try {
    await db
      .insert(sosOrganizations)
      .values({ id: ORG_ID, name: "Sunrise Recovery Center", slug: ORG_SLUG, status: "active" })
      .onConflictDoUpdate({
        target: sosOrganizations.id,
        set: { slug: ORG_SLUG, name: "Sunrise Recovery Center" },
      });
  } catch {
    // Fallback: ensure slug is set even if onConflictDoUpdate fails for any reason.
    await db
      .update(sosOrganizations)
      .set({ slug: ORG_SLUG, name: "Sunrise Recovery Center" })
      .where(eq(sosOrganizations.id, ORG_ID));
  }
}

async function upsertFacility(id: string, name: string): Promise<void> {
  const existing = await db
    .select({ id: sosFacilities.id })
    .from(sosFacilities)
    .where(eq(sosFacilities.id, id))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(sosFacilities).values({ id, orgId: ORG_ID, name, status: "active" });
  }
}

export async function seed(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("seed() must never run in production");
  }

  const rawPassword = process.env.DEV_TEST_PASSWORD;
  if (!rawPassword) {
    throw new Error("DEV_TEST_PASSWORD env var is required to run authSeed");
  }

  console.log("[authSeed] Hashing passwords (this takes ~30s for 12 users)...");
  const passwordHash = await argon2.hash(rawPassword, ARGON2_OPTIONS);

  // Ensure org slug is set.
  await upsertOrg();

  // Ensure both facilities exist.
  await upsertFacility(FACILITY_ID,   "Sunrise Recovery Center — Main Campus");
  await upsertFacility(FACILITY_2_ID, "Sunrise Recovery Center — Annex");

  for (const user of TEST_USERS) {
    const email = user.email;
    console.log(`[authSeed] Seeding ${email}...`);

    // ── Identity ref ─────────────────────────────────────────────────────────
    let [identityRef] = await db
      .select({ id: sosUserIdentityRefs.id })
      .from(sosUserIdentityRefs)
      .where(
        and(
          eq(sosUserIdentityRefs.orgId, ORG_ID),
          // Derive a deterministic ID from the email for idempotency.
        ),
      )
      .limit(0); // don't filter by email here; use account lookup

    // Use the account to find the identity ref.
    const [existingAccount] = await db
      .select({ id: sosUserAccounts.id, userIdentityRefId: sosUserAccounts.userIdentityRefId })
      .from(sosUserAccounts)
      .where(and(
        eq(sosUserAccounts.orgId, ORG_ID),
        eq(sosUserAccounts.email, email),
      ))
      .limit(1);

    let accountId: string;

    if (existingAccount) {
      accountId = existingAccount.id;
      // Update password hash and status.
      await db
        .update(sosUserAccounts)
        .set({
          passwordHash,
          status: user.status ?? "active",
          failedLoginCount: 0,
          lockedUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(sosUserAccounts.id, accountId));
    } else {
      // Create identity ref.
      const [newIdentityRef] = await db
        .insert(sosUserIdentityRefs)
        .values({ orgId: ORG_ID })
        .returning({ id: sosUserIdentityRefs.id });

      // Create staff profile.
      const [existing_profile] = await db
        .select({ id: sosStaffProfiles.id })
        .from(sosStaffProfiles)
        .where(and(
          eq(sosStaffProfiles.orgId, ORG_ID),
          eq(sosStaffProfiles.userId, newIdentityRef.id),
        ))
        .limit(1);
      if (!existing_profile) {
        await db.insert(sosStaffProfiles).values({
          orgId:       ORG_ID,
          userId:      newIdentityRef.id,
          displayName:      user.displayName,
          professionalRole: user.roleId,
        });
      }

      // Create user account.
      const [newAccount] = await db
        .insert(sosUserAccounts)
        .values({
          orgId:             ORG_ID,
          userIdentityRefId: newIdentityRef.id,
          email,
          passwordHash,
          status: user.status ?? "active",
        })
        .returning({ id: sosUserAccounts.id });

      accountId = newAccount.id;
    }

    // ── Primary role assignment ───────────────────────────────────────────────
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiresAt = user.roleExpired ? yesterday : null;

    // Check if primary assignment already exists.
    const [existingAssignment] = await db
      .select({ id: sosRoleAssignments.id })
      .from(sosRoleAssignments)
      .where(and(
        eq(sosRoleAssignments.orgId, ORG_ID),
        eq(sosRoleAssignments.userId, accountId),
        eq(sosRoleAssignments.roleId, user.roleId),
        user.facilityId
          ? eq(sosRoleAssignments.facilityId, user.facilityId)
          : isNull(sosRoleAssignments.facilityId),
      ))
      .limit(1);

    if (!existingAssignment) {
      await db.insert(sosRoleAssignments).values({
        orgId:      ORG_ID,
        userId:     accountId,
        roleId:     user.roleId,
        facilityId: user.facilityId ?? null,
        status:     "active",
        expiresAt,
      });
    } else {
      await db
        .update(sosRoleAssignments)
        .set({ expiresAt, status: "active" })
        .where(eq(sosRoleAssignments.id, existingAssignment.id));
    }

    // ── Second role assignment (mixed-role users) ─────────────────────────────
    if (user.secondRole) {
      const [existingSecond] = await db
        .select({ id: sosRoleAssignments.id })
        .from(sosRoleAssignments)
        .where(and(
          eq(sosRoleAssignments.orgId, ORG_ID),
          eq(sosRoleAssignments.userId, accountId),
          eq(sosRoleAssignments.roleId, user.secondRole.roleId),
          user.secondRole.facilityId
            ? eq(sosRoleAssignments.facilityId, user.secondRole.facilityId)
            : isNull(sosRoleAssignments.facilityId),
        ))
        .limit(1);

      if (!existingSecond) {
        await db.insert(sosRoleAssignments).values({
          orgId:      ORG_ID,
          userId:     accountId,
          roleId:     user.secondRole.roleId,
          facilityId: user.secondRole.facilityId ?? null,
          status:     "active",
        });
      }
    }
  }

  console.log("[authSeed] Done seeding test users.");
}

// ── Auto-run when executed directly ──────────────────────────────────────────
if (process.argv[1]?.includes("authSeed")) {
  seed()
    .then(() => {
      console.log("[authSeed] Seed complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[authSeed] Seed failed:", err);
      process.exit(1);
    });
}

export { seed as runAuthSeed };
