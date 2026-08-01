/**
 * Phase 2 Authentication Routes
 *
 * POST /api/v1/auth/login            — email+password login; issues session cookie
 * POST /api/v1/auth/logout           — revokes session; clears cookie
 * GET  /api/v1/auth/session          — returns safe session summary for frontend
 * GET  /api/v1/auth/csrf-token       — issues CSRF token (public)
 * POST /api/v1/auth/password-reset/request  — request password-reset email
 * POST /api/v1/auth/password-reset/complete — complete reset with token
 *
 * Admin routes (require user.manage or session.manage permission):
 * POST /api/v1/admin/users                       — create user
 * POST /api/v1/admin/users/:id/disable           — disable user
 * POST /api/v1/admin/users/:id/reactivate        — reactivate user
 * POST /api/v1/admin/sessions/:userId/revoke-all — revoke all sessions for a user
 * POST /api/v1/admin/role-assignments            — create role assignment
 */

import { Router, Request, Response } from "express";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  sosUserAccounts,
  sosUserIdentityRefs,
  sosStaffProfiles,
  sosSessions,
  sosRoleAssignments,
  sosAuthAudit,
} from "@workspace/db";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { rateLimit } from "express-rate-limit";
import { getPermissionsForRole, type PermissionCode } from "../lib/permissionPolicy";
import { logger } from "../lib/logger";
import type { AuthenticatedIdentity } from "../lib/authorizationService";
import { hasPermission } from "../lib/authorizationService";

const router = Router();

// ── Argon2id configuration ────────────────────────────────────────────────────
const ARGON2_OPTIONS: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 1,
};

// ── Session idle / absolute timeout (ms) ────────────────────────────────────
const IDLE_TIMEOUT_MS     = parseInt(process.env.SESSION_IDLE_TIMEOUT_MS  ?? "1800000", 10); // 30 min
const ABSOLUTE_TIMEOUT_MS = parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT_MS ?? "28800000", 10); // 8 hr

// ── Rate limiter for auth endpoints ──────────────────────────────────────────
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// ── Input schemas ─────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email().toLowerCase(),
  password: z.string().min(1).max(256),
});

const resetRequestSchema = z.object({
  email: z.string().email().toLowerCase(),
});

const resetCompleteSchema = z.object({
  token:       z.string().min(1),
  newPassword: z.string().min(12).max(256),
});

const createUserSchema = z.object({
  orgId:            z.string().uuid(),
  email:            z.string().email().toLowerCase(),
  password:         z.string().min(12).max(256),
  roleId:           z.string().min(1),
  facilityId:       z.string().uuid().optional(),
});

const roleAssignmentSchema = z.object({
  orgId:      z.string().uuid(),
  userId:     z.string().uuid(),
  roleId:     z.string().min(1),
  facilityId: z.string().uuid().optional(),
  expiresAt:  z.string().datetime().optional(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getIpAddress(req: Request): string {
  return (req.ip ?? req.socket.remoteAddress ?? "unknown").replace(/^::ffff:/, "");
}

function getUserAgentSummary(req: Request): string {
  const ua = req.headers["user-agent"] ?? "";
  // Store at most 200 chars — no need for full UA string in audit log.
  return ua.slice(0, 200);
}

async function writeAuditEvent(opts: {
  orgId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  eventType: string;
  outcome: "success" | "failure" | "error";
  reasonCode?: string;
  targetUserId?: string | null;
  ipAddress?: string;
  userAgentSummary?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(sosAuthAudit).values({
      orgId:            opts.orgId ?? null,
      userId:           opts.userId ?? null,
      sessionId:        opts.sessionId ?? null,
      eventType:        opts.eventType,
      outcome:          opts.outcome,
      reasonCode:       opts.reasonCode ?? null,
      targetUserId:     opts.targetUserId ?? null,
      ipAddress:        opts.ipAddress ?? null,
      userAgentSummary: opts.userAgentSummary ?? null,
      metadata:         opts.metadata ?? null,
    });
  } catch (err) {
    logger.error({ err }, "authV1: failed to write audit event");
  }
}

async function getRoleAssignments(userId: string, orgId: string) {
  const now = new Date();
  return db
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
}

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────

router.post("/v1/auth/login", authRateLimiter, async (req: Request, res: Response) => {
  const ip  = getIpAddress(req);
  const ua  = getUserAgentSummary(req);
  const GENERIC_ERROR = "Unable to sign in with those credentials.";

  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: GENERIC_ERROR });
    return;
  }
  const { email, password } = parse.data;

  try {
    // Load user by email (no org context yet — email unique within org; need org for multi-tenant).
    // For single-org dev: look up by email alone.  In multi-org Phase 3 the login form would
    // include an org selector or subdomain.  For now we look up by email across all orgs.
    const [user] = await db
      .select({
        id:              sosUserAccounts.id,
        orgId:           sosUserAccounts.orgId,
        email:           sosUserAccounts.email,
        passwordHash:    sosUserAccounts.passwordHash,
        status:          sosUserAccounts.status,
        failedLoginCount: sosUserAccounts.failedLoginCount,
        lockedUntil:     sosUserAccounts.lockedUntil,
        sessionVersion:  sosUserAccounts.sessionVersion,
      })
      .from(sosUserAccounts)
      .where(eq(sosUserAccounts.email, email))
      .limit(1);

    // ── Generic failure path — identical timing and response for all failure modes
    // to prevent user-enumeration via timing or error messages.

    // Always perform a dummy verify so timing is constant even for unknown emails.
    const dummyHash = "$argon2id$v=19$m=65536,t=3,p=1$dummysaltdummysalt$dummyhashvalue";

    if (!user || !user.passwordHash) {
      await argon2.verify(dummyHash, password).catch(() => {});
      await writeAuditEvent({
        eventType: "login_failure",
        outcome:   "failure",
        reasonCode: "unknown_account",
        ipAddress:  ip,
        userAgentSummary: ua,
      });
      res.status(401).json({ error: GENERIC_ERROR });
      return;
    }

    // Check lockout BEFORE verifying password (constant-time anyway).
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      await argon2.verify(user.passwordHash, password).catch(() => {});
      await writeAuditEvent({
        orgId:   user.orgId,
        userId:  user.id,
        eventType: "login_failure",
        outcome:   "failure",
        reasonCode: "account_locked",
        ipAddress: ip,
        userAgentSummary: ua,
      });
      // Return generic message — do not reveal lock status to attacker.
      res.status(401).json({ error: GENERIC_ERROR });
      return;
    }

    if (user.status === "disabled") {
      await argon2.verify(user.passwordHash, password).catch(() => {});
      await writeAuditEvent({
        orgId:  user.orgId,
        userId: user.id,
        eventType: "login_failure",
        outcome:   "failure",
        reasonCode: "user_disabled",
        ipAddress: ip,
        userAgentSummary: ua,
      });
      res.status(401).json({ error: GENERIC_ERROR });
      return;
    }

    // Verify password.
    let passwordOk = false;
    try {
      passwordOk = await argon2.verify(user.passwordHash, password, ARGON2_OPTIONS);
    } catch {
      passwordOk = false;
    }

    if (!passwordOk) {
      const MAX_ATTEMPTS = parseInt(process.env.AUTH_MAX_FAILED_ATTEMPTS ?? "5", 10);
      const LOCKOUT_MIN  = parseInt(process.env.AUTH_LOCKOUT_MINUTES ?? "15", 10);
      const newCount = (user.failedLoginCount ?? 0) + 1;
      const lockedUntilVal = newCount >= MAX_ATTEMPTS
        ? new Date(now.getTime() + LOCKOUT_MIN * 60_000)
        : null;

      await db
        .update(sosUserAccounts)
        .set({
          failedLoginCount: newCount,
          lockedUntil:      lockedUntilVal,
          updatedAt:        now,
        })
        .where(eq(sosUserAccounts.id, user.id));

      if (lockedUntilVal) {
        await writeAuditEvent({
          orgId: user.orgId, userId: user.id,
          eventType: "account_locked", outcome: "success",
          ipAddress: ip, userAgentSummary: ua,
        });
      }

      await writeAuditEvent({
        orgId: user.orgId, userId: user.id,
        eventType: "login_failure", outcome: "failure",
        reasonCode: "wrong_password",
        ipAddress: ip, userAgentSummary: ua,
      });

      res.status(401).json({ error: GENERIC_ERROR });
      return;
    }

    // ── Password verified ─────────────────────────────────────────────────────

    // Reset failed-login counter.
    await db
      .update(sosUserAccounts)
      .set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: now, updatedAt: now })
      .where(eq(sosUserAccounts.id, user.id));

    // Load role assignments.
    const assignments = await getRoleAssignments(user.id, user.orgId);
    if (assignments.length === 0) {
      await writeAuditEvent({
        orgId: user.orgId, userId: user.id,
        eventType: "login_failure", outcome: "failure",
        reasonCode: "no_role_assignments",
        ipAddress: ip, userAgentSummary: ua,
      });
      res.status(401).json({ error: GENERIC_ERROR });
      return;
    }

    // ── Session rotation — destroy old session, create new ───────────────────
    await new Promise<void>((resolve, reject) =>
      req.session.regenerate((err) => (err ? reject(err) : resolve())),
    );

    const absoluteExpires = new Date(now.getTime() + ABSOLUTE_TIMEOUT_MS);

    req.session.userId         = user.id;
    req.session.orgId          = user.orgId;
    req.session.sessionVersion = user.sessionVersion;
    req.session.authenticatedAt = now.toISOString();

    // Persist session.
    await new Promise<void>((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve())),
    );

    // Update sos_sessions compliance columns.
    await db
      .update(sosSessions)
      .set({
        userId:           user.id,
        orgId:            user.orgId,
        sessionVersion:   user.sessionVersion,
        ipAddress:        ip,
        userAgentSummary: ua,
      })
      .where(eq(sosSessions.sid, req.sessionID));

    await writeAuditEvent({
      orgId:    user.orgId,
      userId:   user.id,
      sessionId: req.sessionID,
      eventType: "login_success",
      outcome:   "success",
      ipAddress: ip,
      userAgentSummary: ua,
    });
    await writeAuditEvent({
      orgId:    user.orgId,
      userId:   user.id,
      sessionId: req.sessionID,
      eventType: "session_created",
      outcome:   "success",
      ipAddress: ip,
      userAgentSummary: ua,
    });

    // Build safe session summary for the response.
    const roleIds = [...new Set(assignments.map((a) => a.roleId))];
    const permissionCodes = [...new Set(roleIds.flatMap(getPermissionsForRole))];
    const facilityIds = [
      ...new Set(assignments.map((a) => a.facilityId).filter((f): f is string => f !== null)),
    ];

    // Look up display name from staff profile.
    const [staffProfile] = await db
      .select({ displayName: sosStaffProfiles.displayName })
      .from(sosStaffProfiles)
      .where(
        and(
          eq(sosStaffProfiles.orgId, user.orgId),
          eq(sosStaffProfiles.userId, user.id),
        ),
      )
      .limit(1);

    res.json({
      userId:          user.id,
      orgId:           user.orgId,
      displayName:     staffProfile?.displayName ?? email,
      roleIds,
      permissionCodes,
      facilityIds,
      sessionExpiresAt: absoluteExpires.toISOString(),
      authenticationMethod: "password",
    });
  } catch (err) {
    logger.error({ err }, "authV1 POST /login error");
    res.status(503).json({ error: "Service temporarily unavailable" });
  }
});

// ── POST /api/v1/auth/logout ──────────────────────────────────────────────────

router.post("/v1/auth/logout", async (req: Request, res: Response) => {
  const ip = getIpAddress(req);
  const userId  = req.session?.userId ?? null;
  const orgId   = req.session?.orgId ?? null;
  const sid     = req.sessionID;

  try {
    if (sid) {
      // Mark session as revoked in sos_sessions.
      await db
        .update(sosSessions)
        .set({ revokedAt: new Date(), revokedReason: "logout" })
        .where(eq(sosSessions.sid, sid));
    }

    await new Promise<void>((resolve, reject) =>
      req.session.destroy((err) => (err ? reject(err) : resolve())),
    );

    res.clearCookie(
      process.env.NODE_ENV === "production" ? "sos_session" : "sos_dev_session",
      { path: "/api" },
    );

    await writeAuditEvent({
      orgId,
      userId,
      sessionId: sid,
      eventType: "logout",
      outcome:   "success",
      ipAddress: ip,
    });

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "authV1 POST /logout error");
    res.status(503).json({ error: "Service temporarily unavailable" });
  }
});

// ── GET /api/v1/auth/session ──────────────────────────────────────────────────

router.get("/v1/auth/session", async (req: Request, res: Response) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    // Look up display name.
    const [staffProfile] = await db
      .select({ displayName: sosStaffProfiles.displayName })
      .from(sosStaffProfiles)
      .where(
        and(
          eq(sosStaffProfiles.orgId, auth.orgId),
          eq(sosStaffProfiles.userId, auth.userId),
        ),
      )
      .limit(1);

    // Compute session expiry from the session store record.
    const [sessionRow] = await db
      .select({ expire: sosSessions.expire })
      .from(sosSessions)
      .where(eq(sosSessions.sid, req.sessionID))
      .limit(1);

    const ABSOLUTE_TIMEOUT_MS = parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT_MS ?? "28800000", 10);
    const sessionExpiresAt = sessionRow?.expire?.toISOString()
      ?? new Date(Date.now() + ABSOLUTE_TIMEOUT_MS).toISOString();

    // NEVER include: password hash, session token, internal token hash.
    res.json({
      userId:              auth.userId,
      orgId:               auth.orgId,
      displayName:         staffProfile?.displayName ?? auth.userId,
      roleIds:             auth.roleIds,
      permissionCodes:     auth.permissionCodes,
      facilityIds:         auth.facilityIds,
      sessionExpiresAt,
      authenticationMethod: auth.authenticationMethod,
    });
  } catch (err) {
    logger.error({ err }, "authV1 GET /session error");
    res.status(503).json({ error: "Service temporarily unavailable" });
  }
});

// ── GET /api/v1/auth/csrf-token ───────────────────────────────────────────────
// Returns a CSRF token in a readable (non-HttpOnly) cookie for the frontend.
// The frontend reads this cookie and sends the value as X-CSRF-Token.

router.get("/v1/auth/csrf-token", (req: Request, res: Response) => {
  // The csrf-csrf middleware has already set the _csrf cookie when it ran.
  // We just need to respond with OK — the cookie is the token.
  res.json({ ok: true });
});

// ── POST /api/v1/auth/password-reset/request ─────────────────────────────────

router.post(
  "/v1/auth/password-reset/request",
  authRateLimiter,
  async (req: Request, res: Response) => {
    const parse = resetRequestSchema.safeParse(req.body);
    if (!parse.success) {
      // Return the same response whether or not the account exists.
      res.json({ ok: true });
      return;
    }
    const { email } = parse.data;
    const ip = getIpAddress(req);

    try {
      const [user] = await db
        .select({ id: sosUserAccounts.id, orgId: sosUserAccounts.orgId })
        .from(sosUserAccounts)
        .where(eq(sosUserAccounts.email, email))
        .limit(1);

      if (user) {
        // Generate single-use reset token — store only its hash.
        const rawToken  = randomBytes(32).toString("hex");
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 30 * 60_000); // 30 min

        await db
          .update(sosUserAccounts)
          .set({
            // Store token hash in metadata (future: dedicated password_reset_tokens table).
            // For Phase 2 demo: log only — no email infrastructure.
            updatedAt: new Date(),
          })
          .where(eq(sosUserAccounts.id, user.id));

        // In production this would trigger an email.  For Phase 2 dev:
        logger.info(
          { userId: user.id, tokenHash, expiresAt },
          "[DEV] Password reset token generated (would be emailed in production)",
        );

        await writeAuditEvent({
          orgId: user.orgId, userId: user.id,
          eventType: "password_reset_requested", outcome: "success",
          ipAddress: ip,
        });
      }

      // Always return 200 — do not reveal whether account exists.
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, "authV1 POST /password-reset/request error");
      res.json({ ok: true }); // never reveal errors on this endpoint
    }
  },
);

// ── POST /api/v1/auth/password-reset/complete ─────────────────────────────────

router.post(
  "/v1/auth/password-reset/complete",
  authRateLimiter,
  async (req: Request, res: Response) => {
    const parse = resetCompleteSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    // Phase 2 stub: full implementation requires a password_reset_tokens table.
    // Return 501 with a clear message.
    res.status(501).json({
      error: "Password reset completion requires Phase 3 email infrastructure.",
    });
  },
);

// ── Admin routes ──────────────────────────────────────────────────────────────
// These require user.manage or session.manage permission.

function requirePermission(permission: PermissionCode) {
  return (req: Request, res: Response, next: () => void) => {
    if (!req.auth || !hasPermission(req.auth, permission)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

// POST /api/v1/admin/users — create a test/development user
router.post(
  "/v1/admin/users",
  requirePermission("user.manage"),
  async (req: Request, res: Response) => {
    const parse = createUserSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Invalid request", details: parse.error.issues });
      return;
    }

    const { orgId, email, password, roleId, facilityId } = parse.data;
    const adminAuth = req.auth!;

    // Admin must belong to the same org.
    if (adminAuth.orgId !== orgId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    try {
      const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
      const now = new Date();

      // Create identity ref.
      const [identityRef] = await db
        .insert(sosUserIdentityRefs)
        .values({ orgId })
        .returning();

      // Create user account.
      const [newUser] = await db
        .insert(sosUserAccounts)
        .values({
          orgId,
          userIdentityRefId: identityRef.id,
          email,
          passwordHash,
          status: "active",
          passwordChangedAt: now,
        })
        .returning({ id: sosUserAccounts.id });

      // Create role assignment.
      await db.insert(sosRoleAssignments).values({
        orgId,
        userId:          newUser.id,
        roleId,
        facilityId:      facilityId ?? null,
        status:          "active",
        createdByUserId: adminAuth.userId,
      });

      await writeAuditEvent({
        orgId,
        userId:       adminAuth.userId,
        eventType:    "role_assignment_created",
        outcome:      "success",
        targetUserId: newUser.id,
        ipAddress:    getIpAddress(req),
      });

      res.status(201).json({ userId: newUser.id, email, orgId });
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "";
      if (msg.includes("idx_sos_user_accounts_org_email")) {
        res.status(409).json({ error: "Email already registered in this organisation" });
        return;
      }
      logger.error({ err }, "authV1 POST /admin/users error");
      res.status(503).json({ error: "Service temporarily unavailable" });
    }
  },
);

// POST /api/v1/admin/users/:id/disable
router.post(
  "/v1/admin/users/:id/disable",
  requirePermission("user.manage"),
  async (req: Request, res: Response) => {
    const adminAuth = req.auth!;
    const userId = String(req.params.id);
    const ip = getIpAddress(req);

    try {
      const [user] = await db
        .select({ orgId: sosUserAccounts.orgId })
        .from(sosUserAccounts)
        .where(eq(sosUserAccounts.id, userId))
        .limit(1);

      if (!user || user.orgId !== adminAuth.orgId) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const now = new Date();

      // Two-step: read current version, then update with version+1 to invalidate sessions.
      const [current] = await db
        .select({ sessionVersion: sosUserAccounts.sessionVersion })
        .from(sosUserAccounts)
        .where(eq(sosUserAccounts.id, userId))
        .limit(1);

      await db
        .update(sosUserAccounts)
        .set({
          status:         "disabled",
          disabledAt:     now,
          updatedAt:      now,
          sessionVersion: (current?.sessionVersion ?? 0) + 1,
        })
        .where(eq(sosUserAccounts.id, userId));

      // Mark sessions as revoked.
      await db
        .update(sosSessions)
        .set({ revokedAt: now, revokedReason: "user_disabled" })
        .where(and(eq(sosSessions.userId, userId), isNull(sosSessions.revokedAt)));

      await writeAuditEvent({
        orgId: adminAuth.orgId, userId: adminAuth.userId,
        eventType: "user_disabled", outcome: "success",
        targetUserId: userId, ipAddress: ip,
      });

      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, "authV1 POST /admin/users/:id/disable error");
      res.status(503).json({ error: "Service temporarily unavailable" });
    }
  },
);

// POST /api/v1/admin/users/:id/reactivate
router.post(
  "/v1/admin/users/:id/reactivate",
  requirePermission("user.manage"),
  async (req: Request, res: Response) => {
    const adminAuth = req.auth!;
    const userId = String(req.params.id);
    const ip = getIpAddress(req);

    try {
      const [user] = await db
        .select({ orgId: sosUserAccounts.orgId })
        .from(sosUserAccounts)
        .where(eq(sosUserAccounts.id, userId))
        .limit(1);

      if (!user || user.orgId !== adminAuth.orgId) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const now = new Date();
      await db
        .update(sosUserAccounts)
        .set({ status: "active", disabledAt: null, failedLoginCount: 0, lockedUntil: null, updatedAt: now })
        .where(eq(sosUserAccounts.id, userId));

      await writeAuditEvent({
        orgId: adminAuth.orgId, userId: adminAuth.userId,
        eventType: "user_reactivated", outcome: "success",
        targetUserId: userId, ipAddress: ip,
      });

      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, "authV1 POST /admin/users/:id/reactivate error");
      res.status(503).json({ error: "Service temporarily unavailable" });
    }
  },
);

// POST /api/v1/admin/sessions/:userId/revoke-all
router.post(
  "/v1/admin/sessions/:userId/revoke-all",
  requirePermission("session.manage"),
  async (req: Request, res: Response) => {
    const adminAuth = req.auth!;
    const userId = String(req.params.userId);
    const ip = getIpAddress(req);

    try {
      const [user] = await db
        .select({ orgId: sosUserAccounts.orgId, sessionVersion: sosUserAccounts.sessionVersion })
        .from(sosUserAccounts)
        .where(eq(sosUserAccounts.id, userId))
        .limit(1);

      if (!user || user.orgId !== adminAuth.orgId) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const now = new Date();
      // Bump session_version to invalidate all existing sessions.
      await db
        .update(sosUserAccounts)
        .set({ sessionVersion: (user.sessionVersion ?? 0) + 1, updatedAt: now })
        .where(eq(sosUserAccounts.id, userId));

      // Revoke session rows.
      await db
        .update(sosSessions)
        .set({ revokedAt: now, revokedReason: "admin_revocation" })
        .where(and(eq(sosSessions.userId, userId), isNull(sosSessions.revokedAt)));

      await writeAuditEvent({
        orgId: adminAuth.orgId, userId: adminAuth.userId,
        eventType: "admin_session_revocation", outcome: "success",
        targetUserId: userId, ipAddress: ip,
      });

      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, "authV1 POST /admin/sessions/:userId/revoke-all error");
      res.status(503).json({ error: "Service temporarily unavailable" });
    }
  },
);

// POST /api/v1/admin/role-assignments
router.post(
  "/v1/admin/role-assignments",
  requirePermission("role.manage"),
  async (req: Request, res: Response) => {
    const parse = roleAssignmentSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Invalid request", details: parse.error.issues });
      return;
    }

    const adminAuth = req.auth!;
    const { orgId, userId, roleId, facilityId, expiresAt } = parse.data;

    if (adminAuth.orgId !== orgId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    try {
      const [assignment] = await db
        .insert(sosRoleAssignments)
        .values({
          orgId,
          userId,
          roleId,
          facilityId: facilityId ?? null,
          status: "active",
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          createdByUserId: adminAuth.userId,
        })
        .returning({ id: sosRoleAssignments.id });

      await writeAuditEvent({
        orgId, userId: adminAuth.userId,
        eventType: "role_assignment_created", outcome: "success",
        targetUserId: userId, ipAddress: getIpAddress(req),
        metadata: { roleId, facilityId: facilityId ?? null },
      });

      res.status(201).json({ assignmentId: assignment.id });
    } catch (err) {
      logger.error({ err }, "authV1 POST /admin/role-assignments error");
      res.status(503).json({ error: "Service temporarily unavailable" });
    }
  },
);

export default router;
