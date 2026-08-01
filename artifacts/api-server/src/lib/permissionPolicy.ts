/**
 * Permission policy for Sunrise OS.
 *
 * Defines:
 *  1. PermissionCode union — 13 server-side permission codes.
 *  2. ROLE_PERMISSIONS — maps every code-defined role ID to the set of
 *     permission codes it grants.
 *  3. FACILITY_WIDE_ROLES — roles that are granted facility-wide patient access
 *     without needing an individual sos_patient_access assignment.
 *
 * Architecture decision (Phase 2):
 *  - Role *definitions* remain code-configured (this file).
 *  - Role *assignments* (which user holds which role at which facility) are
 *    DB-backed in sos_role_assignments.
 *  - This separation mirrors established EHR practice: the permission model is
 *    reviewed and approved as code; the operational assignment is auditable data.
 *
 * Do NOT hardcode permissions based only on role names like "admin" or "nurse".
 * Roles aggregate explicit permission codes declared here.
 *
 * Phase 3 will add photo and write-workflow permissions.
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
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

export function isPermissionCode(s: string): s is PermissionCode {
  return (PERMISSION_CODES as readonly string[]).includes(s);
}

// ── Role → permission matrix ────────────────────────────────────────────────
// For Phase 2 we only enforce the read/view permissions that correspond to the
// existing patient-list and patient-detail API endpoints.
// Write permissions are defined here for future use but not yet enforced
// by server-backed write routes.

type RolePermissions = {
  permissions: PermissionCode[];
  /** true = role grants facility-wide patient access via role assignment alone */
  facilityWide: boolean;
};

export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  clinical_supervisor: {
    facilityWide: true,
    permissions: [
      "patient.list.view",
      "patient.chart.view",
      "patient.demographics.view",
      "patient.episode.view",
      "patient.create",
      "patient.update",
      "patient.export",
    ],
  },
  certified_clinician: {
    facilityWide: true,
    permissions: [
      "patient.list.view",
      "patient.chart.view",
      "patient.demographics.view",
      "patient.episode.view",
      "patient.create",
      "patient.update",
    ],
  },
  mh_therapist: {
    facilityWide: true,
    permissions: [
      "patient.list.view",
      "patient.chart.view",
      "patient.demographics.view",
      "patient.episode.view",
      "patient.create",
      "patient.update",
    ],
  },
  cmo: {
    facilityWide: true,
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
    ],
  },
  prescriber: {
    facilityWide: true,
    permissions: [
      "patient.list.view",
      "patient.chart.view",
      "patient.demographics.view",
      "patient.episode.view",
    ],
  },
  nursing: {
    facilityWide: true,
    permissions: [
      "patient.list.view",
      "patient.chart.view",
      "patient.demographics.view",
      "patient.episode.view",
    ],
  },
  director_of_operations: {
    facilityWide: true,
    permissions: [
      "patient.list.view",
      "patient.episode.view",
      "patient.export",
    ],
  },
  bht: {
    facilityWide: false, // requires explicit patient assignment
    permissions: [
      "patient.list.view",
      "patient.chart.view",
    ],
  },
  bht_supervisor: {
    facilityWide: true,
    permissions: [
      "patient.list.view",
      "patient.chart.view",
    ],
  },
  admin_staff: {
    facilityWide: true,
    permissions: [
      "patient.list.view",
      "patient.demographics.view",
      "patient.create",
    ],
  },
  billing_staff: {
    facilityWide: true,
    permissions: [
      "patient.list.view",
      "patient.export",
    ],
  },
  accounting_staff: {
    facilityWide: true,
    permissions: [
      "patient.list.view",
      "patient.export",
    ],
  },
  // Business development: no patient data access per compliance policy.
  business_development: {
    facilityWide: false,
    permissions: [],
  },
  // Ownership: aggregate financial / operational overview, read-only patient list.
  ownership: {
    facilityWide: true,
    permissions: [
      "patient.list.view",
      "patient.export",
    ],
  },
  // Human resources: zero patient access.
  human_resources: {
    facilityWide: false,
    permissions: [],
  },
  // Aftercare: limited read for own caseload only (facilityWide: false).
  aftercare_staff: {
    facilityWide: false,
    permissions: [
      "patient.list.view",
    ],
  },
  // Security admin: user/session management; no patient data.
  security_admin: {
    facilityWide: false,
    permissions: [
      "organization.admin",
      "user.manage",
      "role.manage",
      "session.manage",
      "audit.authentication.view",
    ],
  },
};

/**
 * Return all permission codes granted by the given role ID.
 * Returns an empty array for unknown roles (deny by default).
 */
export function getPermissionsForRole(roleId: string): PermissionCode[] {
  return ROLE_PERMISSIONS[roleId]?.permissions ?? [];
}

/**
 * Return true if this role is configured for facility-wide patient access
 * (i.e. a role assignment alone is sufficient; no explicit sos_patient_access
 * row is required).
 */
export function isRoleFacilityWide(roleId: string): boolean {
  return ROLE_PERMISSIONS[roleId]?.facilityWide ?? false;
}
