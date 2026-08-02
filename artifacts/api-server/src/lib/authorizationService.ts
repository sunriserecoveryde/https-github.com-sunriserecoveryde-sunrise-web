/**
 * Central authorization service for Sunrise OS Phase 2B.
 *
 * Key change from Phase 2: replace the flat permissionCodes/facilityIds/orgWide
 * model with per-grant scoped evaluation.
 *
 * Problem with the flat model:
 *   A user with two role assignments — e.g., security_admin (org-wide, no patient
 *   access) + certified_clinician (facility-A, patient access) — produced:
 *     orgWide=true   (from security_admin facilityId=null)
 *     permissionCodes includes patient.list.view  (from clinician)
 *   → The facility scope check was bypassed because orgWide=true,
 *     giving the clinician org-wide patient access they should not have.
 *
 * Fix: evaluate authorization through one complete grant. A permission from
 * one assignment can NEVER inherit scope from another assignment.
 *
 * Decision flow (authorize()):
 *   For each active ScopedGrant on the identity:
 *     1. Grant orgId must match the request orgId.
 *     2. Grant must contain the required permission.
 *     3. If a facilityId is requested: grant must be org-wide OR cover that facility.
 *     4. If a patientId is requested: grant must be facility-wide OR an explicit
 *        sos_patient_access row exists (scoped to this grant's facility).
 *   If any grant satisfies all conditions → ALLOW.
 *   Otherwise → DENY (audit event written).
 *
 * Audit events are written for every denied access.
 * Internal denial reasons are NEVER returned to the caller.
 */

import { db } from "@workspace/db";
import { sosPatientAccess, sosAuthAudit, sosAuditOutbox, sosRoleAssignments } from "@workspace/db";
import { and, eq, isNotNull, isNull, lte, or, gt } from "drizzle-orm";
import {
  isRoleFacilityWide,
  getPermissionsForRole,
  type PermissionCode,
} from "./permissionPolicy";
import { logger } from "./logger";

// ── Scoped Grant ───────────────────────────────────────────────────────────────
// One grant corresponds to one active role assignment row.
// All authorization decisions are made through one complete grant.

export interface ScopedGrant {
  /** ID of the sos_role_assignments row that created this grant. */
  roleAssignmentId: string;
  roleId: string;
  /** Permission codes granted by this role (from ROLE_PERMISSIONS). */
  permissions: PermissionCode[];
  orgId: string;
  /** Explicit facility scope. null = org-wide scope for this grant. */
  facilityId: string | null;
  /** Computed: facilityId === null → org-wide access for this grant. */
  orgWide: boolean;
  /**
   * true = this role grants facility-wide patient access; no sos_patient_access
   * row is needed for patients within the grant's facility scope.
   * false = requires an explicit sos_patient_access row (caseload-limited).
   */
  facilityWide: boolean;
  requiresPatientAssignment: boolean;
  effectiveAt: Date | null;
  expiresAt: Date | null;
}

/**
 * Build a ScopedGrant from a role assignment row.
 * Returns null for unknown roles (deny by default for unknown role strings).
 */
export function buildScopedGrant(assignment: {
  id: string;
  roleId: string;
  orgId: string;
  facilityId: string | null;
  effectiveAt: Date | null;
  expiresAt: Date | null;
}): ScopedGrant {
  const permissions = getPermissionsForRole(assignment.roleId); // [] for unknown roles
  const facilityWide = isRoleFacilityWide(assignment.roleId);   // false for unknown roles
  return {
    roleAssignmentId: assignment.id,
    roleId: assignment.roleId,
    permissions,
    orgId: assignment.orgId,
    facilityId: assignment.facilityId,
    orgWide: assignment.facilityId === null,
    facilityWide,
    requiresPatientAssignment: !facilityWide,
    effectiveAt: assignment.effectiveAt,
    expiresAt: assignment.expiresAt,
  };
}

// ── AuthenticatedIdentity ─────────────────────────────────────────────────────

export interface AuthenticatedIdentity {
  userId: string;
  staffProfileId: string | null;
  orgId: string;
  sessionId: string;

  /**
   * Complete list of scoped grants from active role assignments.
   * Authorization is evaluated through these grants — never through the flat
   * summary fields below.
   */
  grants: ScopedGrant[];

  /**
   * Flat summaries derived from grants (kept for backward compat with
   * session response, audit log, and frontend display).
   * These MUST NOT be used for authorization decisions — use `grants`.
   */
  roleIds: string[];
  permissionCodes: PermissionCode[];
  facilityIds: string[];
  orgWide: boolean;

  authenticationMethod: "password" | "dev-identity";
  authenticatedAt: string;
  sessionVersion: number;
}

// ── Authorization request/response ────────────────────────────────────────────

export interface AuthorizationRequest {
  identity: AuthenticatedIdentity;
  permission: PermissionCode;
  orgId: string;
  facilityId?: string;
  patientId?: string;
  episodeId?: string;
  purpose?: string;
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
  /** The grant that authorized the request (only set when allowed=true). */
  authorizedByGrant?: ScopedGrant;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function denied(reasonCode: AuthorizationReasonCode): AuthorizationDecision {
  return { allowed: false, reasonCode };
}

// ── §8: Durable outbox for authorization-denial audit events ──────────────────
//
// Denial events cannot share a DB transaction with the operation they describe
// (denials block state changes — there is no state change to co-commit with).
//
// Strategy: write to sos_audit_outbox first (guaranteed durable), then schedule
// an async drain to sos_auth_audit.  If the drain fails, the outbox retains the
// event for the next drain cycle.  This prevents silent loss of denial events.

async function writeAuditDenial(
  identity: AuthenticatedIdentity | null,
  reasonCode: AuthorizationReasonCode,
  req: Pick<AuthorizationRequest, "orgId" | "permission" | "facilityId" | "patientId" | "ipAddress">,
): Promise<void> {
  try {
    await db.insert(sosAuditOutbox).values({
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
    // Schedule background drain; does not block the current request.
    setImmediate(() => { drainAuditOutbox().catch(() => {}); });
  } catch (err) {
    // Outbox write failed — fall back to direct insert into sos_auth_audit.
    logger.error({ err }, "authorizationService: outbox write failed — attempting direct audit insert");
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
    } catch (fallbackErr) {
      logger.error({ err: fallbackErr }, "authorizationService: both outbox and direct audit write failed");
    }
  }
}

/**
 * Drain unprocessed outbox entries into sos_auth_audit.
 * Called after each outbox write and can be invoked externally for testing.
 * Idempotent — rows are only drained once (processedAt is set atomically).
 */
export async function drainAuditOutbox(limit = 50): Promise<number> {
  let drained = 0;
  try {
    const rows = await db
      .select()
      .from(sosAuditOutbox)
      .where(isNull(sosAuditOutbox.processedAt))
      .orderBy(sosAuditOutbox.createdAt)
      .limit(limit);

    for (const row of rows) {
      try {
        await db.transaction(async (tx) => {
          await tx.insert(sosAuthAudit).values({
            orgId:            row.orgId ?? null,
            userId:           row.userId ?? null,
            sessionId:        row.sessionId ?? null,
            eventType:        row.eventType,
            outcome:          row.outcome as "success" | "failure" | "error",
            reasonCode:       row.reasonCode ?? null,
            targetUserId:     row.targetUserId ?? null,
            ipAddress:        row.ipAddress ?? null,
            userAgentSummary: row.userAgentSummary ?? null,
            metadata:         row.metadata as Record<string, unknown> | null,
          });
          await tx
            .update(sosAuditOutbox)
            .set({ processedAt: new Date(), attempts: (row.attempts ?? 0) + 1 })
            .where(eq(sosAuditOutbox.id, row.id));
        });
        drained++;
      } catch (err) {
        // Bump attempts counter but do not mark as processed — will retry next cycle.
        await db
          .update(sosAuditOutbox)
          .set({
            attempts:    (row.attempts ?? 0) + 1,
            errorDetail: err instanceof Error ? err.message.slice(0, 500) : String(err),
          })
          .where(eq(sosAuditOutbox.id, row.id))
          .catch(() => {});
        logger.error({ err, outboxId: row.id }, "authorizationService: drain failed for outbox entry");
      }
    }
  } catch (err) {
    logger.error({ err }, "authorizationService: drainAuditOutbox query failed");
  }
  return drained;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function checkPatientAccessForGrant(
  orgId: string,
  patientId: string,
  userId: string,
  facilityId: string | null,
  roleAssignmentId: string,
): Promise<boolean> {
  // §6: Patient access is tied to the EXACT authorizing role assignment.
  //
  // Three cases for an access row:
  //   (a) roleAssignmentId IS NULL  — created before Phase 2C; backward compat, allow.
  //   (b) roleAssignmentId = <this assignment>  — must be active/effective (LEFT JOIN).
  //   (c) roleAssignmentId = <different assignment>  — access bound to a different
  //       assignment; even if that assignment is still active, deny (exact binding).
  //
  // If the caller's roleAssignmentId is not a valid UUID (e.g. dev-identity sentinel),
  // fall back to the pre-Phase-2C simple check (no FK binding).
  const now = new Date();

  const baseConditions: ReturnType<typeof eq>[] = [
    eq(sosPatientAccess.orgId, orgId),
    eq(sosPatientAccess.patientId, patientId),
    eq(sosPatientAccess.userId, userId),
    eq(sosPatientAccess.status, "active"),
    or(isNull(sosPatientAccess.expiresAt), gt(sosPatientAccess.expiresAt, now))!,
  ];
  if (facilityId) {
    baseConditions.push(eq(sosPatientAccess.facilityId, facilityId));
  }

  if (!UUID_RE.test(roleAssignmentId)) {
    // Non-UUID assignment ID (dev identity, etc.) — simple check, no FK binding.
    const rows = await db
      .select({ id: sosPatientAccess.id })
      .from(sosPatientAccess)
      .where(and(...baseConditions))
      .limit(1);
    return rows.length > 0;
  }

  // §2D: NULL role_assignment_id is no longer a valid backward-compat path.
  // Every active access row must carry an exact assignment FK (enforced by the
  // Phase 2D migration CHECK constraint and integrity trigger).
  //
  // LEFT JOIN only on the SPECIFIC assignment.  If the access row FK points to a
  // different assignment, the join returns null and the WHERE rejects the row.
  const rows = await db
    .select({ id: sosPatientAccess.id, raId: sosRoleAssignments.id })
    .from(sosPatientAccess)
    .leftJoin(
      sosRoleAssignments,
      and(
        eq(sosRoleAssignments.id, sosPatientAccess.roleAssignmentId),
        eq(sosRoleAssignments.id, roleAssignmentId),           // §6: exact assignment
        eq(sosRoleAssignments.orgId, orgId),
        eq(sosRoleAssignments.userId, userId),
        eq(sosRoleAssignments.status, "active"),
        lte(sosRoleAssignments.effectiveAt, now),
        or(isNull(sosRoleAssignments.expiresAt), gt(sosRoleAssignments.expiresAt, now)),
      ),
    )
    .where(
      and(
        ...baseConditions,
        // §2D: NULL FK rows no longer authorized.  Only rows whose FK exactly
        // matches this assignment AND whose LEFT JOIN confirmed the assignment
        // is active/effective are permitted.
        and(
          eq(sosPatientAccess.roleAssignmentId, roleAssignmentId),
          isNotNull(sosRoleAssignments.id),  // LEFT JOIN succeeded → assignment active
        ),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

// ── Main authorization function ───────────────────────────────────────────────

export async function authorize(
  req: AuthorizationRequest,
): Promise<AuthorizationDecision> {
  const { identity, permission, orgId, facilityId, patientId } = req;

  if (!identity) {
    return denied("unauthenticated");
  }

  // Evaluate each grant independently.
  // A permission from one grant NEVER inherits scope from another grant.
  //
  // Track the "best" denial reason so callers see the most specific reason
  // (e.g. "facility-out-of-scope" rather than "permission-missing" when a
  // grant has the permission but doesn't cover the requested facility).
  let bestDenialReason: AuthorizationReasonCode = "permission-missing";

  for (const grant of identity.grants) {
    // 1. Org must match exactly.
    if (grant.orgId !== orgId) continue;

    // 2. This grant must include the required permission.
    if (!grant.permissions.includes(permission)) continue;

    // Grant has the permission — upgrade any future denial to a scope denial.

    // 3. Facility scope: grant must cover the requested facility.
    if (facilityId !== undefined) {
      const grantCoversFacility = grant.orgWide || grant.facilityId === facilityId;
      if (!grantCoversFacility) {
        bestDenialReason = "facility-out-of-scope";
        continue;
      }
    }

    // 4. Patient scope (only when patientId is provided).
    if (patientId) {
      const effectiveFacilityId = facilityId ?? grant.facilityId;
      if (grant.facilityWide) {
        // Facility-wide roles: no explicit patient_access row required.
        return { allowed: true, reasonCode: "allowed", authorizedByGrant: grant };
      } else {
        // Caseload-limited: requires explicit sos_patient_access row
        // scoped to this grant's facility.
        const hasAccess = await checkPatientAccessForGrant(
          orgId,
          patientId,
          identity.userId,
          effectiveFacilityId ?? null,
          grant.roleAssignmentId,
        );
        if (!hasAccess) {
          bestDenialReason = "patient-out-of-scope";
          continue;
        }
      }
    }

    // This grant satisfies the full request.
    return { allowed: true, reasonCode: "allowed", authorizedByGrant: grant };
  }

  // No grant satisfied the request — return the most specific reason we found.
  await writeAuditDenial(identity, bestDenialReason, req);
  return denied(bestDenialReason);
}

/**
 * Quick synchronous check: does the identity hold the requested permission
 * through ANY active grant?
 * Does NOT check facility or patient scope. Use for UI-gating only.
 * The server always calls the full `authorize()` before returning data.
 */
export function hasPermission(
  identity: AuthenticatedIdentity,
  permission: PermissionCode,
): boolean {
  return identity.grants.some((g) => g.permissions.includes(permission));
}

/**
 * Returns all facility IDs that a permission is authorized for,
 * across all active grants. Used for patient-list filtering.
 */
export function getAuthorizedFacilitiesForPermission(
  identity: AuthenticatedIdentity,
  permission: PermissionCode,
): { facilityId: string | null; orgWide: boolean; facilityWide: boolean; requiresPatientAssignment: boolean; grant: ScopedGrant }[] {
  return identity.grants
    .filter((g) => g.permissions.includes(permission))
    .map((g) => ({
      facilityId: g.facilityId,
      orgWide: g.orgWide,
      facilityWide: g.facilityWide,
      requiresPatientAssignment: g.requiresPatientAssignment,
      grant: g,
    }));
}
