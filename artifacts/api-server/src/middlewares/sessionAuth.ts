/**
 * sessionAuth — Phase 2 session-based identity middleware.
 *
 * Replaces the Phase 1A devIdentityMiddleware + requireIdentity combo for
 * /api/v1/* routes.
 *
 * Behaviour:
 *
 * Production (NODE_ENV === 'production'):
 *   • Reads req.session.userId (set by express-session after login).
 *   • Loads user, status, session_version, and role assignments from DB.
 *   • Validates: user active, session not revoked/expired, session_version matches.
 *   • Attaches req.auth (AuthenticatedIdentity).
 *   • Returns 401 for any failure — does NOT reveal the failure reason to the client.
 *
 * Development (NODE_ENV !== 'production'):
 *   • If a real session exists and is valid → uses it (req.auth set).
 *   • Otherwise → falls back to devIdentityMiddleware behaviour for demo mode.
 *     In this case req.auth is set to a synthetic dev identity using the
 *     DEV_SEED_ORG_ID / DEV_SEED_FACILITY_ID constants with a synthetic role.
 *
 * This middleware must run AFTER express-session has been registered (in app.ts).
 */

import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { sosUserAccounts, sosSessions, sosRoleAssignments } from "@workspace/db";
import { and, eq, gt, isNull, or, inArray } from "drizzle-orm";
import { getPermissionsForRole, type PermissionCode } from "../lib/permissionPolicy";
import type { AuthenticatedIdentity } from "../lib/authorizationService";
import { logger } from "../lib/logger";
import { DEV_SEED_ORG_ID, DEV_SEED_FACILITY_ID } from "./devIdentity";

// Augment Express.Request with the Phase 2 auth shape.
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

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolveIdentityFromSession(
  req: Request,
): Promise<AuthenticatedIdentity | null> {
  const { userId, orgId, sessionVersion: sessionVer, authenticatedAt } = req.session ?? {};
  if (!userId || !orgId) return null;

  const now = new Date();

  // ── Absolute session timeout (8 hours from authentication time) ───────────
  // The idle timeout is enforced by express-session's maxAge/rolling settings.
  // The absolute timeout is enforced here — the session cookie may still be
  // "fresh" from a recent idle-timeout reset, but we revoke after 8 hours.
  if (authenticatedAt) {
    const ABSOLUTE_TIMEOUT_MS = parseInt(
      process.env.SESSION_ABSOLUTE_TIMEOUT_MS ?? "28800000",
      10,
    );
    if (Date.now() - new Date(authenticatedAt).getTime() > ABSOLUTE_TIMEOUT_MS) {
      logger.info({ userId }, "sessionAuthMiddleware: absolute session timeout exceeded — destroying session");
      req.session.destroy(() => {});
      return null;
    }
  }

  // Load user account — validate status and session version.
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
  // Session version must match — any password reset or admin revocation bumps this.
  if (sessionVer !== undefined && user.sessionVersion !== sessionVer) return null;

  // Check session row is not revoked.
  const [sessionRow] = await db
    .select({ revokedAt: sosSessions.revokedAt })
    .from(sosSessions)
    .where(eq(sosSessions.sid, req.sessionID))
    .limit(1);

  if (sessionRow?.revokedAt) return null;

  // Load active, non-expired role assignments.
  const assignments = await db
    .select({
      roleId:     sosRoleAssignments.roleId,
      facilityId: sosRoleAssignments.facilityId,
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

  const roleIds = [...new Set(assignments.map((a) => a.roleId))];
  const permissionCodes: PermissionCode[] = [
    ...new Set(roleIds.flatMap((r) => getPermissionsForRole(r))),
  ];
  // Org-wide: any assignment with facilityId = null grants org-wide access.
  // Scoped: collect explicit facilityIds from scoped (non-null) assignments.
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
    staffProfileId:       null, // populated on login in Phase 3
    orgId:                user.orgId,
    sessionId:            req.sessionID,
    roleIds,
    permissionCodes,
    facilityIds,
    orgWide,
    authenticationMethod: "password",
    authenticatedAt:      authenticatedAt ?? now.toISOString(),
    sessionVersion:       user.sessionVersion,
  };
}

function makeDevIdentity(): AuthenticatedIdentity {
  return {
    userId:               "00000000-0000-4000-a000-000000000020",
    staffProfileId:       null,
    orgId:                DEV_SEED_ORG_ID,
    sessionId:            "dev-session",
    roleIds:              ["clinical_supervisor"],
    permissionCodes:      getPermissionsForRole("clinical_supervisor"),
    facilityIds:          [DEV_SEED_FACILITY_ID],
    orgWide:              true, // dev identity gets full org access
    authenticationMethod: "dev-identity",
    authenticatedAt:      new Date().toISOString(),
    sessionVersion:       0,
  };
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function sessionAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";

  try {
    const identity = await resolveIdentityFromSession(req);

    if (identity) {
      // Real session — update idle timeout by touching the session.
      req.session.touch();
      req.auth = identity;
      next();
      return;
    }

    if (!isProduction && process.env.DISABLE_AUTH_FALLBACK !== "true") {
      // Development/demo fallback: use synthetic dev identity.
      // Set DISABLE_AUTH_FALLBACK=true to suppress this (used by integration tests
      // that verify unauthenticated requests return 401 — the fallback would mask
      // session destruction and clearCookie behaviour in the test environment).
      req.auth = makeDevIdentity();
      // Also set devIdentity for backward compat with any Phase 1A code.
      req.devIdentity = {
        orgId:      DEV_SEED_ORG_ID,
        facilityId: DEV_SEED_FACILITY_ID,
      };
      next();
      return;
    }

    // No valid session — leave req.auth undefined.
    // Public routes (login, csrf-token, password-reset) work without auth.
    // Protected routes must call requireAuth() or requirePermission() explicitly.
    next();
  } catch (err) {
    logger.error({ err }, "sessionAuthMiddleware: DB error resolving identity");
    res.status(503).json({ error: "Service temporarily unavailable" });
  }
}

/**
 * requireAuth — must be called AFTER sessionAuthMiddleware.
 * Returns 401 if req.auth is not set (should not happen if sessionAuthMiddleware
 * is wired correctly, but defensive guard).
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
