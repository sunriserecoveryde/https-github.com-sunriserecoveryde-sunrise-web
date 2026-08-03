/**
 * Frontend permission codes — must stay in sync with
 * artifacts/api-server/src/lib/permissionPolicy.ts
 *
 * The server is always the authoritative enforcer.
 * The frontend uses these codes only for:
 *   - Hiding/showing navigation items
 *   - Showing read-only banners
 *   - Disabling action buttons
 *
 * Never use these codes as the sole enforcement mechanism.
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
  // Exact approved set — must match server permissionPolicy.ts exactly.
  "clinical_note.create",
  "clinical_note.view",
  "clinical_note.edit_own_draft",
  "clinical_note.sign_own",
  "clinical_note.void",
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

export function hasPermission(
  permissionCodes: PermissionCode[],
  code: PermissionCode,
): boolean {
  return permissionCodes.includes(code);
}
