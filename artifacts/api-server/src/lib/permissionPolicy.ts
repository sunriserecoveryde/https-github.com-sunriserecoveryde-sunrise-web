/**
 * Permission policy for Sunrise OS.
 *
 * Defines:
 *  1. PermissionCode union — 13 server-side permission codes.
 *  2. ROLE_PERMISSIONS — maps every code-defined role ID to:
 *       - permissions: the set of permission codes it grants
 *       - facilityWide: true = role grants facility-wide patient access without
 *         needing an individual sos_patient_access assignment
 *       - requiresPatientAssignment: true = explicit sos_patient_access row required
 *         (caseload-limited roles; derived from !facilityWide)
 *       - canBeOrgWide: true = this role is valid on an org-wide assignment (facilityId=null)
 *       - canBeFacilityScoped: true = this role is valid on a facility-scoped assignment
 *       - maxGrantableRoles: which roles this role can grant (used by roleGrantPolicy)
 *
 * Architecture decision (Phase 2B):
 *  - Role *definitions* remain code-configured (this file).
 *  - Role *assignments* (which user holds which role at which facility) are
 *    DB-backed in sos_role_assignments.
 *  - Authorization is evaluated per-grant (see authorizationService.ts).
 *    A permission from one assignment never inherits scope from another.
 *
 * Do NOT hardcode permissions based only on role names like "admin" or "nurse".
 * Roles aggregate explicit permission codes declared here.
 */

export const PERMISSION_CODES = [
  "patient.list.view",
  "patient.chart.view",
  "patient.demographics.view",
  "patient.episode.view",
  "patient.create",
  "patient.update",
  "patient.export",
  "organization.admin",
  "facility.admin",
  "user.manage",
  "role.manage",
  "session.manage",
  "audit.authentication.view",
  // Phase 3 — Clinical Documentation Foundation
  "clinical_note.create",
  "clinical_note.view",
  "clinical_note.edit_own_draft",
  "clinical_note.sign_own",
  "clinical_note.void",
  "clinical_note.audit_view",
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

export function isPermissionCode(s: string): s is PermissionCode {
  return (PERMISSION_CODES as readonly string[]).includes(s);
}

// ── Role definition ──────────────────────────────────────────────────────────

type RoleDefinition = {
  permissions: PermissionCode[];
  /** true = role grants facility-wide patient access via role assignment alone */
  facilityWide: boolean;
  /** true = this role can be assigned org-wide (facilityId = null) */
  canBeOrgWide: boolean;
  /** true = this role can be assigned to a specific facility */
  canBeFacilityScoped: boolean;
  /**
   * Roles that a holder of this role is permitted to grant.
   * Empty = cannot grant any role.
   * Enforcement: roleGrantPolicy.ts validates this at assignment time.
   */
  grantableRoles: string[];
};

export const ROLE_PERMISSIONS: Record<string, RoleDefinition> = {
  clinical_supervisor: {
    facilityWide: true,
    canBeOrgWide: false,
    canBeFacilityScoped: true,
    grantableRoles: ["certified_clinician", "mh_therapist", "prescriber", "nursing", "bht", "aftercare_staff"],
    permissions: [
      "patient.list.view",
      "patient.chart.view",
      "patient.demographics.view",
      "patient.episode.view",
      "patient.create",
      "patient.update",
      "patient.export",
      // Phase 3 — Clinical Documentation Foundation
      "clinical_note.create",
      "clinical_note.view",
      "clinical_note.edit_own_draft",
      "clinical_note.sign_own",
      "clinical_note.void",
      "clinical_note.audit_view",
    ],
  },
  certified_clinician: {
    facilityWide: true,
    canBeOrgWide: false,
    canBeFacilityScoped: true,
    grantableRoles: [],
    permissions: [
      "patient.list.view",
      "patient.chart.view",
      "patient.demographics.view",
      "patient.episode.view",
      "patient.create",
      "patient.update",
      // Phase 3
      "clinical_note.create",
      "clinical_note.view",
      "clinical_note.edit_own_draft",
      "clinical_note.sign_own",
    ],
  },
  mh_therapist: {
    facilityWide: true,
    canBeOrgWide: false,
    canBeFacilityScoped: true,
    grantableRoles: [],
    permissions: [
      "patient.list.view",
      "patient.chart.view",
      "patient.demographics.view",
      "patient.episode.view",
      "patient.create",
      "patient.update",
      // Phase 3
      "clinical_note.create",
      "clinical_note.view",
      "clinical_note.edit_own_draft",
      "clinical_note.sign_own",
    ],
  },
  cmo: {
    facilityWide: true,
    canBeOrgWide: true,   // CMO is an org-level role
    canBeFacilityScoped: false,
    grantableRoles: [
      "clinical_supervisor", "certified_clinician", "mh_therapist",
      "prescriber", "nursing", "director_of_operations", "bht",
      "ownership", "human_resources", "aftercare_staff", "security_admin",
      "billing_staff", "facility_admin",
    ],
    permissions: [
      "patient.list.view",
      "patient.chart.view",
      "patient.demographics.view",
      "patient.episode.view",
      "patient.create",
      "patient.update",
      "patient.export",
      "organization.admin",
      "facility.admin",
      "user.manage",
      "role.manage",
      "session.manage",
      "audit.authentication.view",
      // Phase 3
      "clinical_note.create",
      "clinical_note.view",
      "clinical_note.edit_own_draft",
      "clinical_note.sign_own",
      "clinical_note.void",
      "clinical_note.audit_view",
    ],
  },
  prescriber: {
    facilityWide: true,
    canBeOrgWide: false,
    canBeFacilityScoped: true,
    grantableRoles: [],
    permissions: [
      "patient.list.view",
      "patient.chart.view",
      "patient.demographics.view",
      "patient.episode.view",
      // Phase 3
      "clinical_note.create",
      "clinical_note.view",
      "clinical_note.sign_own",
    ],
  },
  nursing: {
    facilityWide: true,
    canBeOrgWide: false,
    canBeFacilityScoped: true,
    grantableRoles: [],
    permissions: [
      "patient.list.view",
      "patient.chart.view",
      "patient.demographics.view",
      "patient.episode.view",
      // Phase 3
      "clinical_note.create",
      "clinical_note.view",
      "clinical_note.edit_own_draft",
      "clinical_note.sign_own",
    ],
  },
  director_of_operations: {
    facilityWide: true,
    canBeOrgWide: false,
    canBeFacilityScoped: true,
    grantableRoles: [],
    permissions: [
      "patient.list.view",
      "patient.episode.view",
      "patient.export",
      "facility.admin",
    ],
  },
  facility_admin: {
    facilityWide: true,
    canBeOrgWide: false,   // facility admin is always facility-scoped
    canBeFacilityScoped: true,
    grantableRoles: ["certified_clinician", "mh_therapist", "prescriber", "nursing", "bht", "aftercare_staff", "billing_staff"],
    permissions: [
      "patient.list.view",
      "patient.episode.view",
      "facility.admin",
      "user.manage",
    ],
  },
  bht: {
    facilityWide: false,  // requires explicit patient assignment (caseload-limited)
    canBeOrgWide: false,
    canBeFacilityScoped: true,
    grantableRoles: [],
    permissions: [
      "patient.list.view",
      "patient.chart.view",
      "patient.demographics.view",
      "patient.episode.view",
      // Phase 3 — view-only clinical note access
      "clinical_note.view",
    ],
  },
  billing_staff: {
    facilityWide: false,  // billing sees only explicitly assigned patients
    canBeOrgWide: false,
    canBeFacilityScoped: true,
    grantableRoles: [],
    permissions: [
      "patient.list.view",
      "patient.demographics.view",
    ],
  },
  ownership: {
    facilityWide: true,
    canBeOrgWide: true,
    canBeFacilityScoped: false,
    grantableRoles: [],
    permissions: [
      "patient.list.view",
      "patient.export",
    ],
  },
  human_resources: {
    facilityWide: false,
    canBeOrgWide: true,
    canBeFacilityScoped: false,
    grantableRoles: [],
    permissions: [],  // zero patient access
  },
  aftercare_staff: {
    facilityWide: false,  // caseload-limited
    canBeOrgWide: false,
    canBeFacilityScoped: true,
    grantableRoles: [],
    permissions: [
      "patient.list.view",
    ],
  },
  security_admin: {
    facilityWide: false,
    canBeOrgWide: true,   // org-wide security role (no patient data)
    canBeFacilityScoped: false,
    grantableRoles: [],
    permissions: [
      "organization.admin",
      "user.manage",
      "role.manage",
      "session.manage",
      "audit.authentication.view",
      // Phase 3 — audit view only (no clinical note create/edit/sign; no patient access)
      "clinical_note.audit_view",
    ],
  },
};

// ── Public helpers ────────────────────────────────────────────────────────────

export function getPermissionsForRole(roleId: string): PermissionCode[] {
  return ROLE_PERMISSIONS[roleId]?.permissions ?? [];
}

export function isRoleFacilityWide(roleId: string): boolean {
  return ROLE_PERMISSIONS[roleId]?.facilityWide ?? false;
}

export function roleCanBeOrgWide(roleId: string): boolean {
  return ROLE_PERMISSIONS[roleId]?.canBeOrgWide ?? false;
}

export function roleCanBeFacilityScoped(roleId: string): boolean {
  return ROLE_PERMISSIONS[roleId]?.canBeFacilityScoped ?? false;
}

export function getRoleDefinition(roleId: string): RoleDefinition | undefined {
  return ROLE_PERMISSIONS[roleId];
}

export const KNOWN_ROLE_IDS = Object.keys(ROLE_PERMISSIONS);

export function isKnownRole(roleId: string): boolean {
  return roleId in ROLE_PERMISSIONS;
}
