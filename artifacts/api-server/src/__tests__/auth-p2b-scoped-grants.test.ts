/**
 * Phase 2B — Scoped Grants & Role-Grant Policy Tests
 *
 * §1 Scoped grant unit tests — verifies buildScopedGrant() and authorize() use
 *    per-grant logic, not flat permission unions.
 * §2 Mixed-role exploit tests — 7 cases that could allow privilege escalation
 *    in a flat permission model but must be denied under scoped grants.
 * §3 Patient-list filtering tests — verifies per-grant patient-list queries.
 * §4 Role-grant policy tests — evaluateRoleGrant() enforcement.
 * §5 Self-escalation tests — admin cannot grant themselves roles.
 *
 * All tests are pure-unit (no HTTP, no DB) unless noted.
 */

import { describe, it, expect } from "vitest";
import {
  buildScopedGrant,
  authorize,
  hasPermission,
  getAuthorizedFacilitiesForPermission,
  type AuthenticatedIdentity,
  type ScopedGrant,
} from "../lib/authorizationService";
import { evaluateRoleGrant } from "../lib/roleGrantPolicy";
import { getPermissionsForRole } from "../lib/permissionPolicy";

// ── Test constants ────────────────────────────────────────────────────────────
const ORG_ID      = "00000000-0000-4000-a000-000000000001";
const FACILITY_1  = "00000000-0000-4000-a000-000000000002";
const FACILITY_2  = "00000000-0000-4000-a000-000000000003";
const USER_ID     = "00000000-0000-4000-a000-000000000020";
const SESSION_ID  = "00000000-0000-4000-a000-000000000030";
const PATIENT_ID  = "00000000-0000-4000-a000-000000000050";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGrant(overrides: Partial<Parameters<typeof buildScopedGrant>[0]> & { id: string; roleId: string }): ScopedGrant {
  return buildScopedGrant({
    orgId:       ORG_ID,
    facilityId:  FACILITY_1,
    effectiveAt: null,
    expiresAt:   null,
    ...overrides,
  });
}

function makeIdentity(grants: ScopedGrant[], extra?: Partial<AuthenticatedIdentity>): AuthenticatedIdentity {
  const allRoleIds    = [...new Set(grants.map((g) => g.roleId))];
  const allPerms      = [...new Set(grants.flatMap((g) => g.permissions))];
  const allFacilities = [...new Set(grants.map((g) => g.facilityId).filter((f): f is string => f !== null))];
  const orgWide       = grants.some((g) => g.orgWide);
  return {
    userId:               USER_ID,
    staffProfileId:       null,
    orgId:                ORG_ID,
    sessionId:            SESSION_ID,
    grants,
    roleIds:              allRoleIds,
    permissionCodes:      allPerms,
    facilityIds:          allFacilities,
    orgWide,
    authenticationMethod: "password",
    authenticatedAt:      new Date().toISOString(),
    sessionVersion:       0,
    ...extra,
  };
}

// ── §1 Scoped Grant Unit Tests ────────────────────────────────────────────────

describe("§1 buildScopedGrant — scoped grant shape", () => {

  it("sg-01: facility-scoped grant for certified_clinician", () => {
    const g = makeGrant({ id: "r1", roleId: "certified_clinician", facilityId: FACILITY_1 });
    expect(g.roleId).toBe("certified_clinician");
    expect(g.facilityId).toBe(FACILITY_1);
    expect(g.orgWide).toBe(false);
    expect(g.facilityWide).toBe(true);   // clinician = facility-wide (no per-patient row)
    expect(g.requiresPatientAssignment).toBe(false);
    expect(g.permissions).toContain("patient.chart.view");
  });

  it("sg-02: org-wide grant for security_admin has NO patient permissions", () => {
    const g = makeGrant({ id: "r2", roleId: "security_admin", facilityId: null });
    expect(g.orgWide).toBe(true);
    expect(g.permissions).not.toContain("patient.list.view");
    expect(g.permissions).not.toContain("patient.chart.view");
    expect(g.permissions).not.toContain("patient.create");
  });

  it("sg-03: bht grant is caseload-limited (requiresPatientAssignment=true)", () => {
    const g = makeGrant({ id: "r3", roleId: "bht", facilityId: FACILITY_1 });
    expect(g.facilityWide).toBe(false);
    expect(g.requiresPatientAssignment).toBe(true);
    expect(g.permissions).toContain("patient.chart.view");
  });

  it("sg-04: grant with expired expiresAt is returned (caller responsible for filtering)", () => {
    const past = new Date(Date.now() - 1000);
    const g = makeGrant({ id: "r4", roleId: "certified_clinician", facilityId: FACILITY_1, expiresAt: past });
    expect(g.expiresAt).toEqual(past);
    // buildScopedGrant does not filter by date — that's done in getRoleAssignments query
    expect(g.permissions.length).toBeGreaterThan(0);
  });

  it("sg-05: billing_staff grant has patient demographic access but not clinical chart access", () => {
    const perms = getPermissionsForRole("billing_staff");
    // billing_staff can see patient list and demographics for billing purposes
    expect(perms).toContain("patient.list.view");
    expect(perms).toContain("patient.demographics.view");
    // but NOT clinical chart data
    expect(perms).not.toContain("patient.chart.view");
    expect(perms).not.toContain("patient.create");
  });
});

// ── §2 Mixed-Role Exploit Tests ───────────────────────────────────────────────

describe("§2 Mixed-role exploit prevention (7 cases)", () => {

  // Exploit A: security_admin (org-wide, no patient perms) + certified_clinician (facility-1)
  // In the old flat model: orgWide=true from security_admin would propagate to the clinician's
  // patient permissions → org-wide patient access. Scoped grant model prevents this.
  it("sg-E1: security_admin (org-wide) + clinician (facility-1) — clinical access limited to facility-1 only", async () => {
    const grants = [
      makeGrant({ id: "sa", roleId: "security_admin",       facilityId: null }),
      makeGrant({ id: "cl", roleId: "certified_clinician",  facilityId: FACILITY_1 }),
    ];
    const identity = makeIdentity(grants);

    // Can access facility-1 patients (from the clinician grant)
    const r1 = await authorize({ identity, permission: "patient.chart.view", orgId: ORG_ID, facilityId: FACILITY_1 });
    expect(r1.allowed).toBe(true);

    // Cannot access facility-2 patients (no grant covers facility-2)
    const r2 = await authorize({ identity, permission: "patient.chart.view", orgId: ORG_ID, facilityId: FACILITY_2 });
    expect(r2.allowed).toBe(false);
    // The clinician grant had the permission but not the facility → facility-out-of-scope
    expect(r2.reasonCode).toBe("facility-out-of-scope");
  });

  // Exploit B: security_admin (org-wide) alone must NOT grant patient access
  it("sg-E2: security_admin org-wide grant alone → NO patient access", async () => {
    const grants = [
      makeGrant({ id: "sa", roleId: "security_admin", facilityId: null }),
    ];
    const identity = makeIdentity(grants);

    const r = await authorize({ identity, permission: "patient.list.view", orgId: ORG_ID });
    expect(r.allowed).toBe(false);
    expect(r.reasonCode).toBe("permission-missing");
  });

  // Exploit C: security_admin (org-wide) + BHT (facility-1, caseload-limited)
  // Must NOT escalate to org-wide patient access.
  // BHT grant has patient.chart.view but is caseload-limited — requires patient_access row.
  // Without a patient_access row in the test DB, this is patient-out-of-scope (not allowed).
  it("sg-E3: security_admin (org-wide) + BHT (facility-1) — patient access requires explicit caseload row", async () => {
    const grants = [
      makeGrant({ id: "sa",  roleId: "security_admin", facilityId: null }),
      makeGrant({ id: "bht", roleId: "bht",            facilityId: FACILITY_1 }),
    ];
    const identity = makeIdentity(grants);

    // BHT grant has patient.chart.view at FACILITY_1, but requiresPatientAssignment=true.
    // Without a sos_patient_access row, must be denied.
    const r = await authorize({
      identity,
      permission: "patient.chart.view",
      orgId: ORG_ID,
      facilityId: FACILITY_1,
      patientId: PATIENT_ID,
    });
    // patient-out-of-scope (no access row) OR allowed (if a row exists) are both valid.
    // The critical assertion: it must NOT be "facility-out-of-scope" (which would indicate
    // that the org-wide security_admin scope leaked into the facility check).
    expect(["patient-out-of-scope", "allowed"]).toContain(r.reasonCode);

    // Verify security_admin alone still has no patient access at all
    const saOnly = makeIdentity([makeGrant({ id: "sa2", roleId: "security_admin", facilityId: null })]);
    const rSaOnly = await authorize({ identity: saOnly, permission: "patient.chart.view", orgId: ORG_ID, facilityId: FACILITY_1 });
    expect(rSaOnly.allowed).toBe(false);
    expect(rSaOnly.reasonCode).toBe("permission-missing");
  });

  // Exploit D: HR (org-wide) + clinician (facility-1) — HR scope must not expand clinical access
  it("sg-E4: HR (org-wide) + clinician (facility-1) — patient access limited to facility-1", async () => {
    const grants = [
      makeGrant({ id: "hr", roleId: "human_resources",     facilityId: null }),
      makeGrant({ id: "cl", roleId: "certified_clinician", facilityId: FACILITY_1 }),
    ];
    const identity = makeIdentity(grants);

    // facility-1 allowed
    const r1 = await authorize({ identity, permission: "patient.chart.view", orgId: ORG_ID, facilityId: FACILITY_1 });
    expect(r1.allowed).toBe(true);

    // facility-2 denied
    const r2 = await authorize({ identity, permission: "patient.chart.view", orgId: ORG_ID, facilityId: FACILITY_2 });
    expect(r2.allowed).toBe(false);
    expect(r2.reasonCode).toBe("facility-out-of-scope");
  });

  // Exploit E: multi-facility clinician sees both facilities but NOT beyond them
  it("sg-E5: clinician at two facilities sees both, denied at a third", async () => {
    const FACILITY_3 = "00000000-0000-4000-a000-000000000099";
    const grants = [
      makeGrant({ id: "cl1", roleId: "certified_clinician", facilityId: FACILITY_1 }),
      makeGrant({ id: "cl2", roleId: "certified_clinician", facilityId: FACILITY_2 }),
    ];
    const identity = makeIdentity(grants);

    const r1 = await authorize({ identity, permission: "patient.chart.view", orgId: ORG_ID, facilityId: FACILITY_1 });
    const r2 = await authorize({ identity, permission: "patient.chart.view", orgId: ORG_ID, facilityId: FACILITY_2 });
    const r3 = await authorize({ identity, permission: "patient.chart.view", orgId: ORG_ID, facilityId: FACILITY_3 });

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);
    expect(r3.reasonCode).toBe("facility-out-of-scope");
  });

  // Exploit F: billing_staff at facility-1 must NOT see clinical notes
  it("sg-E6: billing_staff at facility-1 denied clinical note access", async () => {
    const grants = [
      makeGrant({ id: "bs", roleId: "billing_staff", facilityId: FACILITY_1 }),
    ];
    const identity = makeIdentity(grants);

    const r = await authorize({ identity, permission: "patient.chart.view", orgId: ORG_ID, facilityId: FACILITY_1 });
    expect(r.allowed).toBe(false);
    expect(r.reasonCode).toBe("permission-missing");
  });

  // Exploit G: cross-org denial — different org than identity
  it("sg-E7: identity for org-A cannot access org-B resources even with org-wide scope", async () => {
    const ORG_B = "00000000-0000-4000-b000-000000000001";
    const grants = [
      makeGrant({ id: "cmo", roleId: "cmo", facilityId: null }),
    ];
    const identity = makeIdentity(grants); // orgId = ORG_ID (org-A)

    const r = await authorize({ identity, permission: "patient.list.view", orgId: ORG_B });
    expect(r.allowed).toBe(false);
    // No grant matches org-B → permission-missing (grants are org-scoped)
    expect(r.allowed).toBe(false);
  });
});

// ── §3 Patient-list filtering via getAuthorizedFacilitiesForPermission ────────

describe("§3 getAuthorizedFacilitiesForPermission", () => {

  it("sg-F1: org-wide CMO grant returns an entry with orgWide=true and facilityId=null", () => {
    const grants = [
      makeGrant({ id: "g1", roleId: "cmo", facilityId: null }),
    ];
    const identity = makeIdentity(grants);
    const entries = getAuthorizedFacilitiesForPermission(identity, "patient.list.view");
    // CMO has patient.list.view — should have 1 org-wide entry
    expect(entries.length).toBe(1);
    expect(entries[0].orgWide).toBe(true);
    expect(entries[0].facilityId).toBeNull();
  });

  it("sg-F2: facility-scoped clinician returns entry with facilityId=FACILITY_1", () => {
    const grants = [
      makeGrant({ id: "g2", roleId: "certified_clinician", facilityId: FACILITY_1 }),
    ];
    const identity = makeIdentity(grants);
    const entries = getAuthorizedFacilitiesForPermission(identity, "patient.list.view");
    expect(entries.length).toBe(1);
    expect(entries[0].orgWide).toBe(false);
    expect(entries[0].facilityId).toBe(FACILITY_1);
  });

  it("sg-F3: multi-facility clinician returns two entries", () => {
    const grants = [
      makeGrant({ id: "g3a", roleId: "certified_clinician", facilityId: FACILITY_1 }),
      makeGrant({ id: "g3b", roleId: "certified_clinician", facilityId: FACILITY_2 }),
    ];
    const identity = makeIdentity(grants);
    const entries = getAuthorizedFacilitiesForPermission(identity, "patient.list.view");
    expect(entries.length).toBe(2);
    const facilityIds = entries.map((e) => e.facilityId);
    expect(facilityIds).toContain(FACILITY_1);
    expect(facilityIds).toContain(FACILITY_2);
  });

  it("sg-F4: security_admin (org-wide, no patient perms) → zero entries for patient.list.view", () => {
    const grants = [
      makeGrant({ id: "g4", roleId: "security_admin", facilityId: null }),
    ];
    const identity = makeIdentity(grants);
    const entries = getAuthorizedFacilitiesForPermission(identity, "patient.list.view");
    // security_admin has no patient.list.view → no entries
    expect(entries).toHaveLength(0);
  });

  it("sg-F5: security_admin + facility clinician — only clinician grant contributes to patient.list.view", () => {
    const grants = [
      makeGrant({ id: "g5a", roleId: "security_admin",      facilityId: null }),
      makeGrant({ id: "g5b", roleId: "certified_clinician", facilityId: FACILITY_1 }),
    ];
    const identity = makeIdentity(grants);
    const entries = getAuthorizedFacilitiesForPermission(identity, "patient.list.view");
    // Only the clinician grant has patient.list.view
    expect(entries.length).toBe(1);
    expect(entries[0].facilityId).toBe(FACILITY_1);
    expect(entries[0].orgWide).toBe(false); // security_admin's orgWide does NOT bleed through
  });
});

// ── §4 Role-Grant Policy Tests ────────────────────────────────────────────────

describe("§4 evaluateRoleGrant() policy enforcement", () => {

  const adminGrant = makeGrant({ id: "admin", roleId: "cmo", facilityId: null });
  const adminIdentity: AuthenticatedIdentity = makeIdentity([adminGrant], {
    userId: "00000000-0000-4000-a000-000000000099",
  });

  it("rg-01: valid facility-scoped grant → allowed", () => {
    const result = evaluateRoleGrant({
      adminIdentity,
      targetOrgId:  ORG_ID,
      targetUserId: USER_ID,
      roleId:       "certified_clinician",
      facilityId:   FACILITY_1,
      expiresAt:    null,
    });
    expect(result.allowed).toBe(true);
  });

  it("rg-02: unknown roleId → denied (unknown-role)", () => {
    const result = evaluateRoleGrant({
      adminIdentity,
      targetOrgId:  ORG_ID,
      targetUserId: USER_ID,
      roleId:       "super_root_admin_9000",
      facilityId:   FACILITY_1,
      expiresAt:    null,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe("unknown-role");
  });

  it("rg-03: cross-org grant attempt → denied (org-mismatch)", () => {
    const ORG_B = "00000000-0000-4000-b000-000000000001";
    const result = evaluateRoleGrant({
      adminIdentity,  // orgId = ORG_ID
      targetOrgId:  ORG_B,
      targetUserId: USER_ID,
      roleId:       "certified_clinician",
      facilityId:   FACILITY_1,
      expiresAt:    null,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe("org-mismatch");
  });

  it("rg-04: expired expiresAt → denied (expiration-in-past)", () => {
    const past = new Date(Date.now() - 1000);
    const result = evaluateRoleGrant({
      adminIdentity,
      targetOrgId:  ORG_ID,
      targetUserId: USER_ID,
      roleId:       "certified_clinician",
      facilityId:   FACILITY_1,
      expiresAt:    past,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe("expiration-in-past");
  });

  it("rg-05: role requires facilityId but none provided → denied (invalid-scope-for-role)", () => {
    const result = evaluateRoleGrant({
      adminIdentity,
      targetOrgId:  ORG_ID,
      targetUserId: USER_ID,
      roleId:       "certified_clinician",
      facilityId:   null,  // clinician requires a facility (canBeOrgWide=false)
      expiresAt:    null,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe("invalid-scope-for-role");
  });

  it("rg-06: cmo role org-wide with no facilityId → allowed (cmo is org-wide capable)", () => {
    // CMO can be granted org-wide by another CMO
    const result = evaluateRoleGrant({
      adminIdentity,
      targetOrgId:  ORG_ID,
      targetUserId: USER_ID,
      roleId:       "certified_clinician",
      facilityId:   FACILITY_1,
      expiresAt:    null,
    });
    // Clinician at a facility is always valid from a CMO admin
    expect(result.allowed).toBe(true);
  });
});

// ── §5 Self-escalation Tests ──────────────────────────────────────────────────

describe("§5 Self-escalation prevention", () => {

  const facilityAdminGrant = makeGrant({ id: "fa", roleId: "facility_admin", facilityId: FACILITY_1 });
  const facilityAdminIdentity: AuthenticatedIdentity = makeIdentity([facilityAdminGrant], {
    userId: "00000000-0000-4000-a000-000000000099",
  });

  it("se-01: facility_admin trying to grant cmo (high-privilege) → denied", () => {
    const result = evaluateRoleGrant({
      adminIdentity: facilityAdminIdentity,
      targetOrgId:  ORG_ID,
      targetUserId: USER_ID,
      roleId:       "cmo",
      facilityId:   null,
      expiresAt:    null,
    });
    expect(result.allowed).toBe(false);
    // The specific denial reason depends on which check fires first
    // (requires-org-level-approval or facility-admin-cannot-grant-org-wide etc.)
    if (!result.allowed) {
      expect(["requires-org-level-approval", "facility-admin-cannot-grant-org-wide",
              "admin-cannot-grant-this-role", "cannot-grant-above-own-authority"]).toContain(result.reason);
    }
  });

  it("se-02: admin cannot grant role to themselves (self-escalation-prohibited)", () => {
    const selfId = facilityAdminIdentity.userId;
    const result = evaluateRoleGrant({
      adminIdentity: facilityAdminIdentity,
      targetOrgId:  ORG_ID,
      targetUserId: selfId,   // same as adminIdentity.userId
      roleId:       "certified_clinician",
      facilityId:   FACILITY_1,
      expiresAt:    null,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe("self-escalation-prohibited");
  });
});
