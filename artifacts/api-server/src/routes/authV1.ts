/**
 * Phase 2B Authentication Routes
 *
 * POST /api/v1/auth/login            — org-slug + email + password login (tenant-deterministic)
 * POST /api/v1/auth/logout           — revokes session; preserves row for audit
 * GET  /api/v1/auth/session          — returns safe session summary for frontend
 * GET  /api/v1/auth/csrf-token       — issues CSRF token (public)
 * POST /api/v1/auth/password-reset/request  — DISABLED: returns 503 (incomplete flow)
 * POST /api/v1/auth/password-reset/complete — DISABLED: returns 503 (incomplete flow)
 *
 * Admin routes (require user.manage or role.manage permission):
 * POST /api/v1/admin/users                       — create user (transactional)
 * POST /api/v1/admin/users/:id/disable           — disable user (transactional)
 * POST /api/v1/admin/users/:id/reactivate        — reactivate user (transactional)
 * POST /api/v1/admin/sessions/:userId/revoke-all — revoke all sessions for a user (transactional)
 * POST /api/v1/admin/role-assignments            — create role assignment (policy-gated)
 *
 * Phase 2B changes:
 *  - Login now requires orgSlug (tenant-deterministic; no global email lookup)
 *  - Rate limiter uses PostgreSQL-backed PgRateLimitStore (shared, restart-safe)
 *  - All admin writes are transactional (change + audit succeed together)
 *  - Password reset is disabled (returns 503 with explanation)
 *  - Role assignment creation is gated by roleGrantPolicy
 */

import { Router, Request, Response } from "express";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  sosOrganizations,
  sosUserAccounts,
  sosUserIdentityRefs,
  sosStaffProfiles,
  sosSessions,
  sosRoleAssignments,
  sosAuthAudit,
} from "@workspace/db";
import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { rateLimit } from "express-rate-limit";
import { PgRateLimitStore } from "../lib/pgRateLimiter";
import { getPermissionsForRole, isRoleFacilityWide, isKnownRole } from "../lib/permissionPolicy";
import { buildScopedGrant } from "../lib/authorizationService";
import { evaluateRoleGrant } from "../lib/roleGrantPolicy";
import { logger } from "../lib/logger";
import type { AuthenticatedIdentity, ScopedGrant } from "../lib/authorizationService";
import { hasPermission } from "../lib/authorizationService";
import type { PermissionCode } from "../lib/permissionPolicy";

const router = Router();

// ── Argon2id configuration ────────────────────────────────────────────────────
const ARGON2_OPTIONS: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 1,
};

// ── Session timeout (ms) ──────────────────────────────────────────────────────
const ABSOLUTE_TIMEOUT_MS = parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT_MS ?? "28800000", 10);

// ── Rate limiter — PostgreSQL-backed (Phase 2B) ───────────────────────────────
// Survives API restarts. Shared across multiple API instances.
// Fail-open: DB unavailability allows the request (see pgRateLimiter.ts).
// Falls back to no-op in test env to avoid polluting the test DB with rate counters.
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const pgStore = process.env.NODE_ENV !== "test"
  ? (() => {
      const s = new PgRateLimitStore(WINDOW_MS);
      s.init();
      return s;
    })()
  : undefined;

const authRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  store: pgStore,                               // PostgreSQL store (undefined = MemoryStore in test)
  skip: () => process.env.NODE_ENV === "test",  // still skip in test to avoid counter noise
});

// ── Input schemas ─────────────────────────────────────────────────────────────

/**
 * Phase 2B login: requires orgSlug for tenant-deterministic lookup.
 * orgSlug + email identifies exactly one account (no global email scan).
 * Falls back to SUNRISE_DEFAULT_ORG_SLUG env var when orgSlug is omitted (dev/demo).
 */
const loginSchema = z.object({
  orgSlug:  z.string().min(1).max(64).toLowerCase().optional(),
  email:    z.string().email().toLowerCase(),
  password: z.string().min(1).max(256),
});

const createUserSchema = z.object({
  orgId:      z.string().uuid(),
  email:      z.string().email().toLowerCase(),
  password:   z.string().min(12).max(256),
  roleId:     z.string().min(1),
  facilityId: z.string().uuid().optional(),
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
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}

function getUserAgentSummary(req: Request): string {
  const ua = req.headers["user-agent"] ?? "";
  return ua.slice(0, 128);
}

interface AuditEventInput {
  orgId?:           string | null;
  userId?:          string | null;
  sessionId?:       string | null;
  eventType:        string;
  outcome:          "success" | "failure" | "error";
  reasonCode?:      string | null;
  targetUserId?:    string | null;
  ipAddress?:       string | null;
  userAgentSummary?: string | null;
  metadata?:        Record<string, unknown> | null;
}

async function writeAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    await db.insert(sosAuthAudit).values({
      orgId:            input.orgId ?? null,
      userId:           input.userId ?? null,
      sessionId:        input.sessionId ?? null,
      eventType:        input.eventType,
      outcome:          input.outcome,
      reasonCode:       input.reasonCode ?? null,
      targetUserId:     input.targetUserId ?? null,
      ipAddress:        input.ipAddress ?? null,
      userAgentSummary: input.userAgentSummary ?? null,
      metadata:         input.metadata ?? null,
    });
  } catch (err) {
    logger.error({ err }, "authV1: failed to write audit event (non-fatal)");
  }
}

async function writeAuditEventTx(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: AuditEventInput,
): Promise<void> {
  await tx.insert(sosAuthAudit).values({
    orgId:            input.orgId ?? null,
    userId:           input.userId ?? null,
    sessionId:        input.sessionId ?? null,
    eventType:        input.eventType,
    outcome:          input.outcome,
    reasonCode:       input.reasonCode ?? null,
    targetUserId:     input.targetUserId ?? null,
    ipAddress:        input.ipAddress ?? null,
    userAgentSummary: input.userAgentSummary ?? null,
    metadata:         input.metadata ?? null,
  });
}

/**
 * requirePermission — middleware factory that checks for a specific permission.
 * Must be used AFTER sessionAuthMiddleware.
 */
function requirePermission(permission: PermissionCode) {
  return (req: Request, res: Response, next: ReturnType<typeof Function>): void => {
    const auth = req.auth;
    if (!auth) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!hasPermission(auth, permission)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    (next as () => void)();
  };
}

async function getRoleAssignments(userId: string, orgId: string) {
  const now = new Date();
  return db
    .select({
      id:          sosRoleAssignments.id,
      roleId:      sosRoleAssignments.roleId,
      facilityId:  sosRoleAssignments.facilityId,
      orgId:       sosRoleAssignments.orgId,
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
}

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
// Phase 2B: tenant-deterministic — looks up by (org_slug, email), not email alone.

router.post("/v1/auth/login", authRateLimiter, async (req: Request, res: Response) => {
  const ip  = getIpAddress(req);
  const ua  = getUserAgentSummary(req);
  const GENERIC_ERROR = "Unable to sign in with those credentials.";

  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: GENERIC_ERROR });
    return;
  }

  // Resolve org slug: from request body, or from SUNRISE_DEFAULT_ORG_SLUG env var.
  const orgSlug = parse.data.orgSlug
    ?? process.env.SUNRISE_DEFAULT_ORG_SLUG
    ?? null;

  if (!orgSlug) {
    res.status(400).json({ error: "Organization is required." });
    return;
  }

  const { email, password } = parse.data;

  try {
    // ── Tenant-deterministic lookup ─────────────────────────────────────────
    // Join sos_organizations + sos_user_accounts on (slug, email).
    // This is a single indexed query: idx_sos_organizations_slug + idx_sos_user_accounts_org_email.
    // No global email scan — duplicate emails across organizations are safe.
    const [user] = await db
      .select({
        id:               sosUserAccounts.id,
        orgId:            sosUserAccounts.orgId,
        email:            sosUserAccounts.email,
        passwordHash:     sosUserAccounts.passwordHash,
        status:           sosUserAccounts.status,
        failedLoginCount: sosUserAccounts.failedLoginCount,
        lockedUntil:      sosUserAccounts.lockedUntil,
        sessionVersion:   sosUserAccounts.sessionVersion,
      })
      .from(sosUserAccounts)
      .innerJoin(
        sosOrganizations,
        and(
          eq(sosOrganizations.id, sosUserAccounts.orgId),
          eq(sosOrganizations.slug, orgSlug),
        ),
      )
      .where(eq(sosUserAccounts.email, email))
      .limit(1);

    // ── Constant-time failure path ───────────────────────────────────────────
    // Always verify a hash to prevent timing-based user enumeration.
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

    const now = new Date();

    // ── Account lockout check ─────────────────────────────────────────────────
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
      res.status(401).json({ error: GENERIC_ERROR });
      return;
    }

    // ── Status check ──────────────────────────────────────────────────────────
    if (user.status !== "active") {
      await argon2.verify(user.passwordHash, password).catch(() => {});
      await writeAuditEvent({
        orgId:  user.orgId,
        userId: user.id,
        eventType: "login_failure",
        outcome:   "failure",
        reasonCode: user.status === "disabled" ? "user_disabled" : "user_inactive",
        ipAddress: ip,
        userAgentSummary: ua,
      });
      res.status(401).json({ error: GENERIC_ERROR });
      return;
    }

    // ── Password verification ─────────────────────────────────────────────────
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
        .set({ failedLoginCount: newCount, lockedUntil: lockedUntilVal, updatedAt: now })
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

    // ── Session rotation ──────────────────────────────────────────────────────
    await new Promise<void>((resolve, reject) =>
      req.session.regenerate((err) => (err ? reject(err) : resolve())),
    );

    const absoluteExpires = new Date(now.getTime() + ABSOLUTE_TIMEOUT_MS);

    req.session.userId          = user.id;
    req.session.orgId           = user.orgId;
    req.session.sessionVersion  = user.sessionVersion;
    req.session.authenticatedAt = now.toISOString();

    await new Promise<void>((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve())),
    );

    // Update sos_sessions compliance columns.
    await db
      .update(sosSessions)
      .set({ userId: user.id, orgId: user.orgId, sessionVersion: user.sessionVersion, ipAddress: ip, userAgentSummary: ua })
      .where(eq(sosSessions.sid, req.sessionID));

    await writeAuditEvent({
      orgId: user.orgId, userId: user.id, sessionId: req.sessionID,
      eventType: "login_success", outcome: "success",
      ipAddress: ip, userAgentSummary: ua,
    });
    await writeAuditEvent({
      orgId: user.orgId, userId: user.id, sessionId: req.sessionID,
      eventType: "session_created", outcome: "success",
      ipAddress: ip, userAgentSummary: ua,
    });

    // Build safe session summary for response.
    const roleIds = [...new Set(assignments.map((a) => a.roleId))];
    const permissionCodes = [...new Set(roleIds.flatMap(getPermissionsForRole))];
    const facilityIds = [
      ...new Set(assignments.map((a) => a.facilityId).filter((f): f is string => f !== null)),
    ];

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
  const ip     = getIpAddress(req);
  const userId = req.session?.userId ?? null;
  const orgId  = req.session?.orgId ?? null;
  const sid    = req.sessionID;

  try {
    if (sid) {
      // Mark session revoked — do NOT destroy the row (preserved for audit trail).
      await db
        .update(sosSessions)
        .set({ revokedAt: new Date(), revokedReason: "logout" })
        .where(eq(sosSessions.sid, sid));
    }

    req.session.userId         = undefined;
    req.session.orgId          = undefined;
    req.session.sessionVersion = undefined;
    req.session.authenticatedAt = undefined;

    await new Promise<void>((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve())),
    );

    res.clearCookie(
      process.env.NODE_ENV === "production" ? "sos_session" : "sos_dev_session",
      { path: "/api" },
    );

    await writeAuditEvent({
      orgId, userId, sessionId: sid,
      eventType: "logout", outcome: "success",
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

    const [sessionRow] = await db
      .select({ expire: sosSessions.expire })
      .from(sosSessions)
      .where(eq(sosSessions.sid, req.sessionID))
      .limit(1);

    const sessionExpiresAt = sessionRow?.expire?.toISOString()
      ?? new Date(Date.now() + ABSOLUTE_TIMEOUT_MS).toISOString();

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

router.get("/v1/auth/csrf-token", (req: Request, res: Response) => {
  const generateToken = req.app.get("csrfGenerateToken") as
    | ((req: Request, res: Response, options?: { overwrite?: boolean; validateOnReuse?: boolean }) => string)
    | undefined;

  if (!generateToken) {
    res.status(500).json({ error: "CSRF token generator not configured" });
    return;
  }

  const token = generateToken(req, res, { overwrite: true, validateOnReuse: false });
  res.json({ csrfToken: token });
});

// ── POST /api/v1/auth/password-reset/request — DISABLED ──────────────────────
// Password reset is disabled until Phase 3 email infrastructure is complete.
// Do not generate or store unusable tokens. Do not pretend the feature works.

router.post(
  "/v1/auth/password-reset/request",
  (_req: Request, res: Response) => {
    res.status(503).json({
      error: "Password reset is not available.",
      detail: "This feature requires email infrastructure that will be added in Phase 3. " +
              "Contact your organization administrator to reset your password.",
    });
  },
);

// ── POST /api/v1/auth/password-reset/complete — DISABLED ─────────────────────

router.post(
  "/v1/auth/password-reset/complete",
  (_req: Request, res: Response) => {
    res.status(503).json({
      error: "Password reset is not available.",
      detail: "This feature requires email infrastructure that will be added in Phase 3.",
    });
  },
);

// ── Admin routes ──────────────────────────────────────────────────────────────

// POST /api/v1/admin/users — create user (TRANSACTIONAL: user + audit succeed together)
router.post(
  "/v1/admin/users",
  requirePermission("user.manage"),
  async (req: Request, res: Response) => {
    const parse = createUserSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Invalid request", details: parse.error.issues });
      return;
    }

    const adminAuth = req.auth!;
    const { orgId, email, password, roleId, facilityId } = parse.data;
    const ip = getIpAddress(req);

    if (adminAuth.orgId !== orgId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (!isKnownRole(roleId)) {
      res.status(400).json({ error: `Unknown role: ${roleId}` });
      return;
    }

    try {
      const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);

      // Transactional: user creation + audit write must both succeed.
      const result = await db.transaction(async (tx) => {
        const [identityRef] = await tx
          .insert(sosUserIdentityRefs)
          .values({ orgId })
          .returning({ id: sosUserIdentityRefs.id });

        const [account] = await tx
          .insert(sosUserAccounts)
          .values({
            orgId,
            userIdentityRefId: identityRef.id,
            email,
            passwordHash,
            status: "active",
          })
          .returning({ id: sosUserAccounts.id });

        if (facilityId) {
          await tx.insert(sosRoleAssignments).values({
            orgId, userId: account.id, roleId, facilityId, status: "active",
            createdByUserId: adminAuth.userId,
          });
        }

        await writeAuditEventTx(tx, {
          orgId, userId: adminAuth.userId,
          eventType: "user_created", outcome: "success",
          targetUserId: account.id, ipAddress: ip,
          metadata: { email, roleId, facilityId: facilityId ?? null },
        });

        return { userId: account.id };
      });

      res.status(201).json(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("unique")) {
        res.status(409).json({ error: "A user with that email already exists in this organization." });
        return;
      }
      logger.error({ err }, "authV1 POST /admin/users error");
      res.status(503).json({ error: "Service temporarily unavailable" });
    }
  },
);

// POST /api/v1/admin/users/:id/disable (TRANSACTIONAL)
router.post(
  "/v1/admin/users/:id/disable",
  requirePermission("user.manage"),
  async (req: Request, res: Response) => {
    const targetUserId = req.params.id as string;
    const adminAuth = req.auth!;
    const ip = getIpAddress(req);

    if (adminAuth.userId === targetUserId) {
      res.status(400).json({ error: "Cannot disable your own account." });
      return;
    }

    try {
      await db.transaction(async (tx) => {
        const [user] = await tx
          .select({ id: sosUserAccounts.id, orgId: sosUserAccounts.orgId })
          .from(sosUserAccounts)
          .where(and(
            eq(sosUserAccounts.id, targetUserId),
            eq(sosUserAccounts.orgId, adminAuth.orgId),
          ))
          .limit(1);

        if (!user) throw new Error("not_found");

        await tx
          .update(sosUserAccounts)
          .set({ status: "disabled", disabledAt: new Date(), updatedAt: new Date(), sessionVersion: sql`session_version + 1` })
          .where(eq(sosUserAccounts.id, targetUserId));

        // Revoke all active sessions.
        await tx
          .update(sosSessions)
          .set({ revokedAt: new Date(), revokedReason: "user_disabled" })
          .where(and(eq(sosSessions.userId, targetUserId), isNull(sosSessions.revokedAt)));

        await writeAuditEventTx(tx, {
          orgId: adminAuth.orgId, userId: adminAuth.userId,
          eventType: "user_disabled", outcome: "success",
          targetUserId, ipAddress: ip,
        });
      });

      res.json({ ok: true });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "not_found") {
        res.status(404).json({ error: "User not found." });
        return;
      }
      logger.error({ err }, "authV1 POST /admin/users/:id/disable error");
      res.status(503).json({ error: "Service temporarily unavailable" });
    }
  },
);

// POST /api/v1/admin/users/:id/reactivate (TRANSACTIONAL)
router.post(
  "/v1/admin/users/:id/reactivate",
  requirePermission("user.manage"),
  async (req: Request, res: Response) => {
    const targetUserId = req.params.id as string;
    const adminAuth = req.auth!;
    const ip = getIpAddress(req);

    try {
      await db.transaction(async (tx) => {
        const [user] = await tx
          .select({ id: sosUserAccounts.id, orgId: sosUserAccounts.orgId })
          .from(sosUserAccounts)
          .where(and(
            eq(sosUserAccounts.id, targetUserId),
            eq(sosUserAccounts.orgId, adminAuth.orgId),
          ))
          .limit(1);

        if (!user) throw new Error("not_found");

        await tx
          .update(sosUserAccounts)
          .set({
            status: "active", disabledAt: null,
            failedLoginCount: 0, lockedUntil: null,
            updatedAt: new Date(),
          })
          .where(eq(sosUserAccounts.id, targetUserId));

        await writeAuditEventTx(tx, {
          orgId: adminAuth.orgId, userId: adminAuth.userId,
          eventType: "user_reactivated", outcome: "success",
          targetUserId, ipAddress: ip,
        });
      });

      res.json({ ok: true });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "not_found") {
        res.status(404).json({ error: "User not found." });
        return;
      }
      logger.error({ err }, "authV1 POST /admin/users/:id/reactivate error");
      res.status(503).json({ error: "Service temporarily unavailable" });
    }
  },
);

// POST /api/v1/admin/sessions/:userId/revoke-all (TRANSACTIONAL)
router.post(
  "/v1/admin/sessions/:userId/revoke-all",
  requirePermission("session.manage"),
  async (req: Request, res: Response) => {
    const targetUserId = req.params.userId as string;
    const adminAuth = req.auth!;
    const ip = getIpAddress(req);

    try {
      let count = 0;
      await db.transaction(async (tx) => {
        const result = await tx
          .update(sosSessions)
          .set({ revokedAt: new Date(), revokedReason: "admin_revoke_all" })
          .where(and(eq(sosSessions.userId, targetUserId), isNull(sosSessions.revokedAt)));

        // Bump session version so any cached session objects are invalidated.
        await tx
          .update(sosUserAccounts)
          .set({ sessionVersion: sql`session_version + 1` })
          .where(and(
            eq(sosUserAccounts.id, targetUserId),
            eq(sosUserAccounts.orgId, adminAuth.orgId),
          ));

        await writeAuditEventTx(tx, {
          orgId: adminAuth.orgId, userId: adminAuth.userId,
          eventType: "sessions_revoked_all", outcome: "success",
          targetUserId, ipAddress: ip,
        });

        count = result.rowCount ?? 0;
      });

      res.json({ ok: true, revokedCount: count });
    } catch (err) {
      logger.error({ err }, "authV1 POST /admin/sessions/:userId/revoke-all error");
      res.status(503).json({ error: "Service temporarily unavailable" });
    }
  },
);

// POST /api/v1/admin/role-assignments — create role assignment (policy-gated + transactional)
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
    const ip = getIpAddress(req);

    if (adminAuth.orgId !== orgId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // ── Role-grant policy enforcement ────────────────────────────────────────
    const policyDecision = evaluateRoleGrant({
      adminIdentity: adminAuth,
      targetOrgId:   orgId,
      targetUserId:  userId,
      roleId,
      facilityId:    facilityId ?? null,
      expiresAt:     expiresAt ? new Date(expiresAt) : null,
    });

    if (!policyDecision.allowed) {
      await writeAuditEvent({
        orgId, userId: adminAuth.userId,
        eventType: "role_grant_denied", outcome: "failure",
        targetUserId: userId, ipAddress: ip,
        metadata: { roleId, facilityId: facilityId ?? null, reason: policyDecision.reason },
      });
      res.status(403).json({
        error: "Role grant denied by policy.",
        reason: policyDecision.reason,
        detail: policyDecision.detail,
      });
      return;
    }

    try {
      const assignmentId = await db.transaction(async (tx) => {
        const [assignment] = await tx
          .insert(sosRoleAssignments)
          .values({
            orgId, userId, roleId,
            facilityId: facilityId ?? null,
            status: "active",
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdByUserId: adminAuth.userId,
          })
          .returning({ id: sosRoleAssignments.id });

        await writeAuditEventTx(tx, {
          orgId, userId: adminAuth.userId,
          eventType: "role_assignment_created", outcome: "success",
          targetUserId: userId, ipAddress: ip,
          metadata: { roleId, facilityId: facilityId ?? null },
        });

        return assignment.id;
      });

      res.status(201).json({ assignmentId });
    } catch (err) {
      logger.error({ err }, "authV1 POST /admin/role-assignments error");
      res.status(503).json({ error: "Service temporarily unavailable" });
    }
  },
);

export default router;
