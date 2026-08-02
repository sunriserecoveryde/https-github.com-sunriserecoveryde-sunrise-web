/**
 * Shared permission constants for Sunrise OS.
 *
 * These codes are used on both the API server (authorization service) and the
 * frontend (RoleContext).  Keeping them in a shared package ensures the two
 * sides never drift apart.
 *
 * Phase 2 scope: patient read, basic org/facility admin, user/session management.
 * Photo permissions are deferred to Phase 3 (see spec §10).
 */

export const PERMISSION_CODES = [
  // Patient access
  "patient.list.view",
  "patient.chart.view",
  "patient.demographics.view",
  "patient.episode.view",
  "patient.create",
  "patient.update",
  "patient.export",
  // Administration
  "organization.admin",
  "facility.admin",
  "user.manage",
  "role.manage",
  "session.manage",
  // Audit
  "audit.authentication.view",
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

/** Type guard */
export function isPermissionCode(s: string): s is PermissionCode {
  return (PERMISSION_CODES as readonly string[]).includes(s);
}
