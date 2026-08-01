/**
 * Central authorization service for Sunrise OS Phase 2.
 *
 * Single entry point for all authorization decisions. Deny by default.
 *
 * Decision flow:
 *  1. Identity must exist and user must be enabled.
 *  2. Organization must match the identity's org.
 *  3. The required permission must appear in the identity's permissionCodes.
 *  4. Facility must be within the identity's authorized facility scope
 *     (from role assignments, NOT from the browser request).
 *  5. For patient / episode access: facility-wide roles are sufficient;
 *     otherwise an explicit sos_patient_access row is required.
 *
 * Audit events are written for every denied access to support compliance logging.
 *
 * Internal denial reasons are NEVER returned to the caller — only
 * "allowed" or "denied" with the appropriate HTTP status guidance.
 */

import { db } from "@workspace/db";
import { sosPatientAccess, sosAuthAudit } from "@workspace/db";
import { and, eq, isNull, or, gt } from "drizzle-orm";
import { isRoleFacilityWide, type PermissionCode } from "./permissionPolicy";
import { logger } from "./logger";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthenticatedIdentity {
  userId: string;
  staffProfileId: string | null;
  orgId: string;
  sessionId: string;
  roleIds: string[];
  permissionCodes: PermissionCode[];
  facilityIds: string[];
  authenticationMethod: "password" | "dev-identity";
  authenticatedAt: string;
  sessionVersion: number;
}

export interface AuthorizationRequest {
  identity: AuthenticatedIdentity;
  permission: PermissionCode;
  orgId: string;
  facilityId?: string;
  patientId?: string;
  episodeId?: string;
  purpose?: string;
  /** IP address for audit log */
  ipAddress?: string;
}

export type AuthorizationReasonCode =
  | "allowed"
  | "unauthenticated"
  | "user-disabled"
  | "role-missing"
  | "permission-missing"
  | "facility-out-of-scope"
  | "patient-out-of-scope"
  | "assignment-required"
  | "assignment-expired"
  | "confidentiality-restricted";

export interface AuthorizationDecision {
  allowed: boolean;
  reasonCode: AuthorizationReasonCode;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function denied(reasonCode: AuthorizationReasonCode): AuthorizationDecision {
  return { allowed: false, reasonCode };
}
const allow: AuthorizationDecision = { allowed: true, reasonCode: "allowed" };

async function writeAuditDenial(
  identity: AuthenticatedIdentity | null,
  reasonCode: AuthorizationReasonCode,
  req: Pick<AuthorizationRequest, "orgId" | "permission" | "facilityId" | "patientId" | "ipAddress">,
): Promise<void> {
  try {
    await db.insert(sosAuthAudit).values({
      orgId:     req.orgId ?? identity?.orgId ?? null,
      userId:    identity?.userId ?? null,
      sessionId: identity?.sessionId ?? null,
      eventType: "authorization_denied",
      outcome:   "failure",
      reasonCode,
      ipAddress: req.ipAddress ?? null,
      metadata:  {
        permission: req.permission,
        facilityId: req.facilityId ?? null,
        patientId:  req.patientId ?? null,
      },
    });
  } catch (err) {
    // Audit failure must not block the response.
    logger.error({ err }, "authorizationService: failed to write denial audit event");
  }
}

// ── Main authorization function ───────────────────────────────────────────────

export async function authorize(
  req: AuthorizationRequest,
): Promise<AuthorizationDecision> {
  const { identity, permission, orgId, facilityId, patientId } = req;

  // 1. Identity must exist
  if (!identity) {
    return denied("unauthenticated");
  }

  // 2. Organization must match exactly (prevents cross-tenant access)
  if (identity.orgId !== orgId) {
    await writeAuditDenial(identity, "facility-out-of-scope", req);
    return denied("facility-out-of-scope");
  }

  // 3. Permission must be granted by one of the user's roles
  if (!identity.permissionCodes.includes(permission)) {
    await writeAuditDenial(identity, "permission-missing", req);
    return denied("permission-missing");
  }

  // 4. Facility scope check (when a facilityId is provided)
  if (facilityId) {
    const hasAccess = identity.facilityIds.includes(facilityId);
    if (!hasAccess) {
      await writeAuditDenial(identity, "facility-out-of-scope", req);
      return denied("facility-out-of-scope");
    }
  }

  // 5. Patient-specific access check
  if (patientId && facilityId) {
    // Determine if any of the user's roles are facility-wide for the given facility.
    const hasFacilityWideRole = identity.roleIds.some((roleId) =>
      isRoleFacilityWide(roleId),
    );

    if (!hasFacilityWideRole) {
      // Require explicit sos_patient_access row.
      const now = new Date();
      const rows = await db
        .select({ id: sosPatientAccess.id })
        .from(sosPatientAccess)
        .where(
          and(
            eq(sosPatientAccess.orgId, orgId),
            eq(sosPatientAccess.patientId, patientId),
            eq(sosPatientAccess.userId, identity.userId),
            eq(sosPatientAccess.status, "active"),
            or(
              isNull(sosPatientAccess.expiresAt),
              gt(sosPatientAccess.expiresAt, now),
            ),
          ),
        )
        .limit(1);

      if (rows.length === 0) {
        await writeAuditDenial(identity, "patient-out-of-scope", req);
        return denied("patient-out-of-scope");
      }
    }
  }

  return allow;
}

/**
 * Quick synchronous check: does the identity hold the requested permission?
 * Does NOT check facility or patient scope. Use for UI-gating only.
 * The server always performs the full `authorize()` call before returning data.
 */
export function hasPermission(
  identity: AuthenticatedIdentity,
  permission: PermissionCode,
): boolean {
  return identity.permissionCodes.includes(permission);
}
