/**
 * Phase 2C — Scoped Admin Authorization Service (§3)
 *
 * Enforces resource-scoped authorization for all administrative actions.
 *
 * Key invariants:
 *  1. Facility admins can only manage users within their own facility scope.
 *  2. Facility admins cannot affect org-level admins (CMO, security_admin, ownership).
 *  3. Facility admins cannot grant org-wide roles.
 *  4. Org admins can manage all users within their own organization.
 *  5. No admin can manage users in a different organization (cross-tenant).
 *  6. The action determines which permission is required (user.manage vs role.manage
 *     vs session.manage).
 */

import type { AuthenticatedIdentity } from "./authorizationService";
import type { PermissionCode } from "./permissionPolicy";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminAction =
  | "create_user"
  | "disable_user"
  | "reactivate_user"
  | "revoke_sessions"
  | "grant_role"
  | "view_audit";

export interface AdministrativeAuthorizationRequest {
  /** The admin performing the action. */
  adminIdentity: AuthenticatedIdentity;
  /** Organization in which the action is being performed. */
  targetOrgId: string;
  /** User being acted upon (if applicable). */
  targetUserId?: string;
  /**
   * Facility scope of the target user's primary role assignment.
   * null / undefined = target user has an org-level role.
   */
  targetFacilityId?: string | null;
  /** The role being assigned (grant_role action only). */
  targetRoleId?: string;
  /** The action being requested. */
  action: AdminAction;
}

export type AdminAuthDenialReason =
  | "cross-org-denied"
  | "permission-missing"
  | "facility-admin-cannot-manage-org-level-user"
  | "facility-admin-cannot-manage-other-facility"
  | "facility-admin-cannot-grant-org-wide"
  | "self-action-denied"
  | "action-not-permitted-for-role";

export type AdminAuthDecision =
  | { allowed: true }
  | { allowed: false; reason: AdminAuthDenialReason; detail: string };

// ── Constants ─────────────────────────────────────────────────────────────────

/** These roles can only be granted/managed by org-level admins. */
const ORG_LEVEL_ROLES = new Set(["cmo", "security_admin", "ownership", "human_resources"]);

/** Map of action → required permission. */
const ACTION_PERMISSIONS: Record<AdminAction, PermissionCode> = {
  create_user:     "user.manage",
  disable_user:    "user.manage",
  reactivate_user: "user.manage",
  revoke_sessions: "session.manage",
  grant_role:      "role.manage",
  view_audit:      "audit.authentication.view",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function deny(reason: AdminAuthDenialReason, detail: string): AdminAuthDecision {
  return { allowed: false, reason, detail };
}

/** True if the admin has org-level authority for the given permission. */
function adminHasOrgLevelPermission(
  identity: AuthenticatedIdentity,
  permission: PermissionCode,
): boolean {
  return identity.grants.some(
    (g) => g.orgWide && g.permissions.includes(permission),
  );
}

/** Facilities for which the admin has a given permission at facility level. */
function adminFacilityIdsForPermission(
  identity: AuthenticatedIdentity,
  permission: PermissionCode,
): Set<string> {
  const ids = new Set<string>();
  for (const g of identity.grants) {
    if (g.permissions.includes(permission) && !g.orgWide && g.facilityId) {
      ids.add(g.facilityId);
    }
  }
  return ids;
}

// ── Main function ──────────────────────────────────────────────────────────────

export function authorizeAdminAction(
  req: AdministrativeAuthorizationRequest,
): AdminAuthDecision {
  const { adminIdentity, targetOrgId, targetUserId, targetFacilityId, targetRoleId, action } = req;

  // §1 — Cross-org is always denied.
  if (adminIdentity.orgId !== targetOrgId) {
    return deny("cross-org-denied", "Admin cannot manage users in a different organization");
  }

  // Determine required permission for this action.
  const requiredPermission = ACTION_PERMISSIONS[action];

  // §3 — Admin must have the required permission.
  const hasOrgLevel  = adminHasOrgLevelPermission(adminIdentity, requiredPermission);
  const facilityIds  = adminFacilityIdsForPermission(adminIdentity, requiredPermission);
  const hasFacility  = facilityIds.size > 0;

  if (!hasOrgLevel && !hasFacility) {
    return deny(
      "permission-missing",
      `${requiredPermission} permission is required for action "${action}"`,
    );
  }

  // §2 — Facility admin scope checks.
  if (!hasOrgLevel && hasFacility) {
    // Facility admin: cannot manage org-level users.
    if (targetFacilityId === null || targetFacilityId === undefined) {
      // Target user has an org-level role — facility admin cannot touch them.
      if (targetUserId) {
        return deny(
          "facility-admin-cannot-manage-org-level-user",
          "Facility administrators cannot manage users with org-level role assignments",
        );
      }
    }

    // Facility admin: target must be in one of their facilities.
    if (targetFacilityId && !facilityIds.has(targetFacilityId)) {
      return deny(
        "facility-admin-cannot-manage-other-facility",
        `Facility administrator's scope (${[...facilityIds].join(",")}) does not include target facility ${targetFacilityId}`,
      );
    }

    // Facility admin: cannot grant org-wide roles.
    if (action === "grant_role" && targetRoleId && ORG_LEVEL_ROLES.has(targetRoleId)) {
      return deny(
        "facility-admin-cannot-grant-org-wide",
        `Role "${targetRoleId}" is an org-level role and cannot be granted by a facility administrator`,
      );
    }
  }

  // §4 — Self-action guard: admin cannot disable or revoke their own sessions via admin routes.
  if (
    targetUserId === adminIdentity.userId &&
    (action === "disable_user" || action === "revoke_sessions")
  ) {
    return deny(
      "self-action-denied",
      `Action "${action}" cannot be performed on your own account via the admin API`,
    );
  }

  return { allowed: true };
}
