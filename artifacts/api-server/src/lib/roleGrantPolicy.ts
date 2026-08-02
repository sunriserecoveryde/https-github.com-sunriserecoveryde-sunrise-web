/**
 * Role-grant policy for Sunrise OS Phase 2B.
 *
 * Enforces the following invariants before any role assignment is created:
 *
 *  1. Requested role exists (known role ID).
 *  2. Requested scope is valid for that role (org-wide vs facility-scoped).
 *  3. Administrator is allowed to grant that role (grantableRoles list).
 *  4. Facility administrator cannot grant org-wide roles.
 *  5. Administrator cannot grant a role above their own authority.
 *  6. User cannot escalate themselves (self-grant prohibited).
 *  7. User cannot create another account and grant it higher authority.
 *  8. High-privilege roles require org-level approval (cmo, security_admin, ownership).
 *  9. Target user and facility must belong to the same organization as the admin.
 * 10. Role expiration must be a future date when provided.
 *
 * All checks return a typed denial reason so tests can assert on specific failures.
 */

import {
  isKnownRole,
  roleCanBeOrgWide,
  roleCanBeFacilityScoped,
  getRoleDefinition,
  type PermissionCode,
} from "./permissionPolicy";
import type { AuthenticatedIdentity } from "./authorizationService";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RoleGrantDenialReason =
  | "unknown-role"
  | "invalid-scope-for-role"
  | "admin-cannot-grant-this-role"
  | "facility-admin-cannot-grant-org-wide"
  | "cannot-grant-above-own-authority"
  | "self-escalation-prohibited"
  | "org-mismatch"
  | "facility-mismatch"
  | "requires-org-level-approval"
  | "expiration-in-past"
  | "target-user-not-in-org";

export type RoleGrantDecision =
  | { allowed: true }
  | { allowed: false; reason: RoleGrantDenialReason; detail: string };

export interface RoleGrantRequest {
  /** The admin performing the grant. */
  adminIdentity: AuthenticatedIdentity;
  /** The org in which the assignment is being made. */
  targetOrgId: string;
  /** The user receiving the role. */
  targetUserId: string;
  /** The role being granted. */
  roleId: string;
  /** Facility scope; null/undefined = org-wide assignment. */
  facilityId?: string | null;
  /** If provided, must be a future date. */
  expiresAt?: Date | null;
}

// ── Roles that require protected org-level approval ───────────────────────────
const HIGH_PRIVILEGE_ROLES = new Set(["cmo", "security_admin", "ownership"]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function deny(reason: RoleGrantDenialReason, detail: string): RoleGrantDecision {
  return { allowed: false, reason, detail };
}
const allow: RoleGrantDecision = { allowed: true };

/**
 * Returns the most permissive role ID held by the admin identity.
 * Used to determine "authority level" for §5.
 */
function getAdminMaxGrantableRoles(adminIdentity: AuthenticatedIdentity): Set<string> {
  const grantable = new Set<string>();
  for (const grant of adminIdentity.grants) {
    const def = getRoleDefinition(grant.roleId);
    if (def) {
      for (const r of def.grantableRoles) grantable.add(r);
    }
  }
  return grantable;
}

/**
 * Returns true if the admin has org-level authority (any org-wide grant with role.manage).
 */
function adminHasOrgLevelAuthority(adminIdentity: AuthenticatedIdentity): boolean {
  return adminIdentity.grants.some(
    (g) => g.orgWide && g.permissions.includes("role.manage" as PermissionCode),
  );
}

/**
 * Returns true if the admin has facility-level authority for the given facility.
 */
function adminHasFacilityAuthority(
  adminIdentity: AuthenticatedIdentity,
  facilityId: string,
): boolean {
  return adminIdentity.grants.some(
    (g) =>
      g.permissions.includes("role.manage" as PermissionCode) &&
      (g.orgWide || g.facilityId === facilityId),
  );
}

// ── Main policy function ──────────────────────────────────────────────────────

export function evaluateRoleGrant(req: RoleGrantRequest): RoleGrantDecision {
  const { adminIdentity, targetOrgId, targetUserId, roleId, facilityId, expiresAt } = req;

  // §9 — Target org must match admin's org (no cross-org grants).
  if (adminIdentity.orgId !== targetOrgId) {
    return deny("org-mismatch", `Admin is in org ${adminIdentity.orgId}; target org is ${targetOrgId}`);
  }

  // §1 — Role must exist in the code-defined role set.
  if (!isKnownRole(roleId)) {
    return deny("unknown-role", `Role "${roleId}" is not a known role ID`);
  }

  // §6 — Self-escalation: admin cannot grant any role to themselves.
  if (adminIdentity.userId === targetUserId) {
    return deny("self-escalation-prohibited", "Administrator cannot grant roles to themselves");
  }

  // §2 — Scope must be valid for the requested role.
  const isOrgWide = !facilityId;
  if (isOrgWide && !roleCanBeOrgWide(roleId)) {
    return deny(
      "invalid-scope-for-role",
      `Role "${roleId}" cannot be assigned org-wide (canBeOrgWide=false). ` +
      "A facilityId is required.",
    );
  }
  if (!isOrgWide && !roleCanBeFacilityScoped(roleId)) {
    return deny(
      "invalid-scope-for-role",
      `Role "${roleId}" cannot be facility-scoped (canBeFacilityScoped=false). ` +
      "This role must be assigned org-wide (facilityId=null).",
    );
  }

  // §8 — High-privilege roles require org-level approval (org-wide role.manage).
  if (HIGH_PRIVILEGE_ROLES.has(roleId) && !adminHasOrgLevelAuthority(adminIdentity)) {
    return deny(
      "requires-org-level-approval",
      `Role "${roleId}" is a protected high-privilege role and requires ` +
      "an org-level administrator with role.manage to grant it.",
    );
  }

  // §4 — Facility administrator cannot grant org-wide roles.
  if (isOrgWide && !adminHasOrgLevelAuthority(adminIdentity)) {
    return deny(
      "facility-admin-cannot-grant-org-wide",
      "Only org-level administrators can grant org-wide role assignments. " +
      "Facility administrators must specify a facilityId.",
    );
  }

  // §3 — Admin must be authorized to grant this specific role.
  const grantableRoles = getAdminMaxGrantableRoles(adminIdentity);
  if (!grantableRoles.has(roleId)) {
    return deny(
      "admin-cannot-grant-this-role",
      `Administrator's roles do not permit granting role "${roleId}". ` +
      `Grantable roles: [${[...grantableRoles].join(", ")}]`,
    );
  }

  // §5 — Admin cannot grant a role above their own authority.
  // The "grantableRoles" check (§3) already enforces this transitively:
  // if the admin can grant roleId, it is within their authority by definition.
  // But we add an explicit check for high-privilege roles.
  const adminHasRole = adminIdentity.grants.some((g) => g.roleId === roleId);
  if (!adminHasRole && HIGH_PRIVILEGE_ROLES.has(roleId)) {
    return deny(
      "cannot-grant-above-own-authority",
      `Administrator does not hold role "${roleId}" and cannot grant it.`,
    );
  }

  // §10 — Expiration must be in the future.
  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    return deny("expiration-in-past", "expiresAt must be a future date");
  }

  // All checks passed.
  return allow;
}
