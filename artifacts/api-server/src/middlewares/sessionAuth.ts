/**
 * sessionAuth — Phase 2B session-based identity middleware.
 *
 * Key change vs Phase 2: resolveIdentityFromSession now builds ScopedGrant[]
 * from each role assignment row independently. Authorization is evaluated
 * through one complete grant — a permission from one assignment never
 * inherits scope from another.
 *
 * Behaviour:
 *
 * Production (NODE_ENV === 'production'):
 *   • Reads req.session.userId (set by express-session after login).
 *   • Loads user, status, session_version, and role assignments from DB.
 *   • Validates: user active, session not revoked/expired, session_version matches.
 *   • Builds ScopedGrant[] from assignments.
 *   • Attaches req.auth (AuthenticatedIdentity with grants).
 *   • Returns 401 for any failure — does NOT reveal the failure reason.
 *
 * Development (NODE_ENV !== 'production'):
 *   • If a real session exists and is valid → uses it.
 *   • Otherwise → falls back to synthetic dev identity (unless DISABLE_AUTH_FALLBACK=true).
 *
 * This middleware must run AFTER express-session has been registered (in app.ts).
 */

import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { sosUserAccounts, sosSessions, sosRoleAssignments } from "@workspace/db";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import {
  getPermissionsForRole,
  isRoleFacilityWide,
  type PermissionCode,
} from "../lib/permissionPolicy";
import type { AuthenticatedIdentity, ScopedGrant } from "../lib/authorizationService";
import { buildScopedGrant } from "../lib/authorizationService";
import { logger } from "../lib/logger";
import { DEV_SEED_ORG_ID, DEV_SEED_FACILITY_ID } from "./devIdentity";

// Augment Express.Request with the Phase 2B auth shape.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthenticatedIdentity;
    }
  }
}

// ── Session data stored inside express-session ────────────────────────────────
declare module "express-session" {
  interface SessionData {
    userId?: string;
    orgId?: string;
    sessionVersion?: number;
    authenticatedAt?: string;
  }
}

// ── Identity resolution ───────────────────────────────────────────────────────

async function resolveIdentityFromSession(
  req: Request,
): Promise<AuthenticatedIdentity | null> {
  const { userId, orgId, sessionVersion: sessionVer, authenticatedAt } = req.session ?? {};
  if (!userId || !orgId) return null;

  // ── Absolute session timeout ───────────────────────────────────────────────
  if (authenticatedAt) {
    const ABSOLUTE_TIMEOUT_MS = parseInt(
      process.env.SESSION_ABSOLUTE_TIMEOUT_MS ?? "28800000",
      10,
    );
    if (Date.now() - new Date(authenticatedAt).getTime() > ABSOLUTE_TIMEOUT_MS) {
      logger.info({ userId }, "sessionAuthMiddleware: absolute session timeout — destroying session");
      req.session.destroy(() => {});
      return null;
    }
  }

  // ── Load user account ──────────────────────────────────────────────────────
  const [user] = await db
    .select({
      id:             sosUserAccounts.id,
      orgId:          sosUserAccounts.orgId,
      status:         sosUserAccounts.status,
      sessionVersion: sosUserAccounts.sessionVersion,
    })
    .from(sosUserAccounts)
    .where(
      and(
        eq(sosUserAccounts.id, userId),
        eq(sosUserAccounts.orgId, orgId),
      ),
    )
    .limit(1);

  if (!user) return null;
  if (user.status !== "active") return null;
  if (sessionVer !== undefined && user.sessionVersion !== sessionVer) return null;

  // ── Validate session row (not revoked) ────────────────────────────────────
  const [sessionRow] = await db
    .select({ sid: sosSessions.sid, revokedAt: sosSessions.revokedAt })
    .from(sosSessions)
    .where(eq(sosSessions.sid, req.sessionID))
    .limit(1);

  if (!sessionRow) return null;
  if (sessionRow.revokedAt !== null) return null;

  // ── Load active role assignments ──────────────────────────────────────────
  const now = new Date();
  const assignments = await db
    .select({
      id:          sosRoleAssignments.id,
      orgId:       sosRoleAssignments.orgId,
      userId:      sosRoleAssignments.userId,
      roleId:      sosRoleAssignments.roleId,
      facilityId:  sosRoleAssignments.facilityId,
      effectiveAt: sosRoleAssignments.effectiveAt,
      expiresAt:   sosRoleAssignments.expiresAt,
    })
    .from(sosRoleAssignments)
    .where(
      and(
        eq(sosRoleAssignments.orgId, orgId),
        eq(sosRoleAssignments.userId, userId),
        eq(sosRoleAssignments.status, "active"),
        or(
          isNull(sosRoleAssignments.expiresAt),
          gt(sosRoleAssignments.expiresAt, now),
        ),
      ),
    );

  if (assignments.length === 0) return null;

  // ── Build scoped grants (Phase 2B) ────────────────────────────────────────
  // Each grant is independent. Permission from one grant NEVER inherits
  // facility scope from another grant.
  const grants: ScopedGrant[] = assignments.map((a) =>
    buildScopedGrant({
      id:          a.id,
      roleId:      a.roleId,
      orgId:       a.orgId,
      facilityId:  a.facilityId ?? null,
      effectiveAt: a.effectiveAt,
      expiresAt:   a.expiresAt,
    }),
  );

  // ── Flat summaries (backward compat — for session response & audit) ────────
  // These MUST NOT be used for authorization decisions. Use grants[].
  const roleIds = [...new Set(assignments.map((a) => a.roleId))];
  const permissionCodes: PermissionCode[] = [
    ...new Set(roleIds.flatMap((r) => getPermissionsForRole(r))),
  ];
  const orgWide = assignments.some((a) => a.facilityId === null);
  const facilityIds = [
    ...new Set(
      assignments
        .map((a) => a.facilityId)
        .filter((f): f is string => f !== null),
    ),
  ];

  return {
    userId:               user.id,
    staffProfileId:       null,
    orgId:                user.orgId,
    sessionId:            req.sessionID,
    grants,
    roleIds,
    permissionCodes,
    facilityIds,
    orgWide,
    authenticationMethod: "password",
    authenticatedAt:      authenticatedAt ?? now.toISOString(),
    sessionVersion:       user.sessionVersion,
  };
}

// ── Dev identity (demo mode only) ─────────────────────────────────────────────

function makeDevIdentity(): AuthenticatedIdentity {
  const devGrant: ScopedGrant = {
    roleAssignmentId: "dev-assignment",
    roleId:           "clinical_supervisor",
    permissions:      getPermissionsForRole("clinical_supervisor"),
    orgId:            DEV_SEED_ORG_ID,
    facilityId:       DEV_SEED_FACILITY_ID,
    orgWide:          false,
    facilityWide:     isRoleFacilityWide("clinical_supervisor"),
    requiresPatientAssignment: false,
    effectiveAt:      null,
    expiresAt:        null,
  };
  return {
    userId:               "00000000-0000-4000-a000-000000000020",
    staffProfileId:       null,
    orgId:                DEV_SEED_ORG_ID,
    sessionId:            "dev-session",
    grants:               [devGrant],
    roleIds:              ["clinical_supervisor"],
    permissionCodes:      getPermissionsForRole("clinical_supervisor"),
    facilityIds:          [DEV_SEED_FACILITY_ID],
    orgWide:              false,
    authenticationMethod: "dev-identity",
    authenticatedAt:      new Date().toISOString(),
    sessionVersion:       0,
  };
}

// ── Middleware ────────────────────────────────────────────────────────────────

const isProduction = process.env.NODE_ENV === "production";

export function sessionAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  resolveIdentityFromSession(req)
    .then((identity) => {
      if (identity) {
        req.session.touch();
        req.auth = identity;
        next();
        return;
      }

      if (!isProduction && process.env.DISABLE_AUTH_FALLBACK !== "true") {
        req.auth = makeDevIdentity();
        req.devIdentity = {
          orgId:      DEV_SEED_ORG_ID,
          facilityId: DEV_SEED_FACILITY_ID,
        };
        next();
        return;
      }

      next();
    })
    .catch((err) => {
      logger.error({ err }, "sessionAuthMiddleware: DB error resolving identity");
      res.status(503).json({ error: "Service temporarily unavailable" });
    });
}

/**
 * requireAuth — must be called AFTER sessionAuthMiddleware.
 * Returns 401 if req.auth is not set.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.auth) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}
