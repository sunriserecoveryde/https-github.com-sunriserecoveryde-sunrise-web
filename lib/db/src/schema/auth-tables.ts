/**
 * Phase 2 authentication and authorization tables.
 *
 * Five core tables added by migration 0001_authentication_authorization:
 *   sos_user_accounts    — local-auth credentials, lockout, session versioning
 *   sos_sessions         — server-side session store (connect-pg-simple compatible)
 *   sos_role_assignments — DB-backed role ↔ user ↔ facility assignments
 *   sos_patient_access   — explicit patient-access assignments
 *   sos_auth_audit       — append-only authentication/authorization audit log
 *
 * Phase 2B additions (migration 0002_authorization_correction):
 *   sos_rate_limit_windows — shared PostgreSQL-backed rate-limit counter store
 */

import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  check,
  foreignKey,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { sosOrganizations } from "./sunrise-os";
import { sosFacilities } from "./sunrise-os";
import { sosUserIdentityRefs } from "./sunrise-os";
import { sosPatients } from "./sunrise-os";

// ── sos_user_accounts ───────────────────────────────────────────────────────
export const sosUserAccounts = pgTable(
  "sos_user_accounts",
  {
    id:                uuid("id").primaryKey().defaultRandom(),
    orgId:             uuid("org_id").notNull()
                         .references(() => sosOrganizations.id, { onDelete: "cascade" }),
    userIdentityRefId: uuid("user_identity_ref_id").notNull(),
    email:             text("email").notNull(),
    passwordHash:      text("password_hash"),        // Argon2id; NULL for SSO-only
    status:            text("status").notNull().default("active"),
    emailVerifiedAt:   timestamp("email_verified_at", { withTimezone: true }),
    failedLoginCount:  integer("failed_login_count").notNull().default(0),
    lockedUntil:       timestamp("locked_until", { withTimezone: true }),
    lastLoginAt:       timestamp("last_login_at", { withTimezone: true }),
    passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
    sessionVersion:    integer("session_version").notNull().default(0),
    mfaStatus:         text("mfa_status").notNull().default("disabled"),
    createdAt:         timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:         timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    disabledAt:        timestamp("disabled_at", { withTimezone: true }),
  },
  (t) => ({
    idxOrgId:    index("idx_sos_user_accounts_org_id").on(t.orgId),
    uniqueOrgId: uniqueIndex("idx_sos_user_accounts_org_id_id").on(t.orgId, t.id),
    uniqueEmail: uniqueIndex("idx_sos_user_accounts_org_email").on(t.orgId, t.email),
    ckStatus:    check(
      "ck_sos_user_accounts_status",
      sql`${t.status} IN ('active', 'disabled', 'locked', 'pending_verification')`,
    ),
    ckMfaStatus: check(
      "ck_sos_user_accounts_mfa_status",
      sql`${t.mfaStatus} IN ('disabled', 'totp_pending', 'totp_active', 'webauthn_active')`,
    ),
    fkOrgIdentityRef: foreignKey({
      columns: [t.orgId, t.userIdentityRefId],
      foreignColumns: [sosUserIdentityRefs.orgId, sosUserIdentityRefs.id],
      name: "fk_sos_user_accounts_org_identity_ref",
    }).onDelete("cascade"),
  }),
);
export type SosUserAccount = typeof sosUserAccounts.$inferSelect;
export type InsertSosUserAccount = typeof sosUserAccounts.$inferInsert;

// ── sos_sessions ─────────────────────────────────────────────────────────────
// connect-pg-simple requires: sid TEXT PK, sess JSONB, expire TIMESTAMPTZ.
// Extra columns are for compliance tracking and revocation.
export const sosSessions = pgTable(
  "sos_sessions",
  {
    sid:               text("sid").primaryKey(),
    sess:              jsonb("sess").notNull(),
    expire:            timestamp("expire", { withTimezone: true }).notNull(),
    userId:            uuid("user_id"),
    orgId:             uuid("org_id"),
    sessionVersion:    integer("session_version"),
    ipAddress:         text("ip_address"),
    userAgentSummary:  text("user_agent_summary"),
    revokedAt:         timestamp("revoked_at", { withTimezone: true }),
    revokedReason:     text("revoked_reason"),
    createdAt:         timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxExpire:   index("idx_sos_sessions_expire").on(t.expire),
    idxUserId:   index("idx_sos_sessions_user_id").on(t.userId),
  }),
);
export type SosSession = typeof sosSessions.$inferSelect;
export type InsertSosSession = typeof sosSessions.$inferInsert;

// ── sos_role_assignments ────────────────────────────────────────────────────
export const sosRoleAssignments = pgTable(
  "sos_role_assignments",
  {
    id:              uuid("id").primaryKey().defaultRandom(),
    orgId:           uuid("org_id").notNull()
                       .references(() => sosOrganizations.id, { onDelete: "cascade" }),
    userId:          uuid("user_id").notNull(),
    staffProfileId:  uuid("staff_profile_id"),
    roleId:          text("role_id").notNull(),    // code-defined role IDs
    facilityId:      uuid("facility_id"),           // NULL = org-wide assignment
    programId:       text("program_id"),
    status:          text("status").notNull().default("active"),
    effectiveAt:     timestamp("effective_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt:       timestamp("expires_at", { withTimezone: true }),
    createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: uuid("created_by_user_id"),
  },
  (t) => ({
    idxOrgUser:  index("idx_sos_role_assignments_org_user").on(t.orgId, t.userId),
    ckStatus:    check(
      "ck_sos_role_assignments_status",
      sql`${t.status} IN ('active', 'revoked', 'expired')`,
    ),
    fkOrgUser: foreignKey({
      columns: [t.orgId, t.userId],
      foreignColumns: [sosUserAccounts.orgId, sosUserAccounts.id],
      name: "fk_sos_role_assignments_org_user",
    }).onDelete("cascade"),
    fkOrgFacility: foreignKey({
      columns: [t.orgId, t.facilityId],
      foreignColumns: [sosFacilities.orgId, sosFacilities.id],
      name: "fk_sos_role_assignments_org_facility",
    }).onDelete("restrict"),
  }),
);
export type SosRoleAssignment = typeof sosRoleAssignments.$inferSelect;
export type InsertSosRoleAssignment = typeof sosRoleAssignments.$inferInsert;

// ── sos_patient_access ─────────────────────────────────────────────────────
// Explicit per-patient access grants for roles that are not facility-wide.
// Facility consistency enforced by trigger (0002 migration).
export const sosPatientAccess = pgTable(
  "sos_patient_access",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    orgId:            uuid("org_id").notNull(),
    facilityId:       uuid("facility_id"),
    patientId:        uuid("patient_id").notNull(),
    userId:           uuid("user_id").notNull(),
    roleAssignmentId:  uuid("role_assignment_id"),  // §6: FK → sos_role_assignments.id; NOT NULL for active rows (CHECK)
    status:            text("status").notNull().default("active"),
    grantedByUserId:   uuid("granted_by_user_id"),
    grantedAt:         timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt:         timestamp("expires_at", { withTimezone: true }),
    createdAt:         timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    // §2D: populated during backfill to record why a row was revoked/quarantined.
    quarantinedReason: text("quarantined_reason"),
  },
  (t) => ({
    idxOrgUser:    index("idx_sos_patient_access_org_user").on(t.orgId, t.userId),
    idxPatient:    index("idx_sos_patient_access_patient").on(t.patientId),
    idxRoleAssignment: index("idx_sos_patient_access_role_assignment").on(t.roleAssignmentId),
    ckStatus:      check(
      "ck_sos_patient_access_status",
      sql`${t.status} IN ('active', 'revoked')`,
    ),
    // §2D: active access rows must reference an exact role assignment.
    ckActiveRequiresAssignment: check(
      "ck_active_access_requires_assignment",
      sql`${t.status} != 'active' OR ${t.roleAssignmentId} IS NOT NULL`,
    ),
    fkOrgFacility: foreignKey({
      columns: [t.orgId, t.facilityId],
      foreignColumns: [sosFacilities.orgId, sosFacilities.id],
      name: "fk_sos_patient_access_org_facility",
    }).onDelete("restrict"),
    fkOrgPatient: foreignKey({
      columns: [t.orgId, t.patientId],
      foreignColumns: [sosPatients.orgId, sosPatients.id],
      name: "fk_sos_patient_access_org_patient",
    }).onDelete("cascade"),
    fkOrgUser: foreignKey({
      columns: [t.orgId, t.userId],
      foreignColumns: [sosUserAccounts.orgId, sosUserAccounts.id],
      name: "fk_sos_patient_access_org_user",
    }).onDelete("cascade"),
    // §2D: ON DELETE RESTRICT — role assignments must be explicitly revoked before
    // deleting; prevents silent null-out of access rows (replaced SET NULL from 2C).
    fkRoleAssignment: foreignKey({
      columns: [t.roleAssignmentId],
      foreignColumns: [sosRoleAssignments.id],
      name: "fk_sos_patient_access_role_assignment",
    }).onDelete("restrict"),
  }),
);
export type SosPatientAccess = typeof sosPatientAccess.$inferSelect;
export type InsertSosPatientAccess = typeof sosPatientAccess.$inferInsert;

// ── sos_auth_audit ──────────────────────────────────────────────────────────
// Append-only audit log.
// UPDATE and DELETE are blocked by database triggers (0002 migration).
export const sosAuthAudit = pgTable(
  "sos_auth_audit",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    orgId:            uuid("org_id"),
    userId:           uuid("user_id"),
    staffId:          uuid("staff_id"),
    sessionId:        text("session_id"),     // session reference, NOT the token
    eventType:        text("event_type").notNull(),
    outcome:          text("outcome").notNull().default("success"),
    reasonCode:       text("reason_code"),
    targetUserId:     uuid("target_user_id"),
    ipAddress:        text("ip_address"),
    userAgentSummary: text("user_agent_summary"),
    metadata:         jsonb("metadata"),
    createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxUserId:    index("idx_sos_auth_audit_user_id").on(t.userId),
    idxOrgId:     index("idx_sos_auth_audit_org_id").on(t.orgId),
    idxCreatedAt: index("idx_sos_auth_audit_created_at").on(t.createdAt),
    ckEventType: check(
      "ck_sos_auth_audit_event_type",
      sql`${t.eventType} = ANY (ARRAY[
        'login_success', 'login_failure', 'logout',
        'session_created', 'session_expired', 'session_revoked',
        'account_locked', 'account_unlocked',
        'password_reset_requested', 'password_reset_completed', 'password_changed',
        'role_assignment_created', 'role_assignment_revoked',
        'facility_assignment_changed',
        'patient_access_created', 'patient_access_revoked',
        'authorization_denied',
        'admin_session_revocation', 'sessions_revoked_all',
        'user_disabled', 'user_reactivated',
        'user_created', 'role_grant_denied', 'csrf_violation'
      ]::text[])`,
    ),
    ckOutcome:    check(
      "ck_sos_auth_audit_outcome",
      sql`${t.outcome} IN ('success', 'failure', 'error')`,
    ),
  }),
);
export type SosAuthAudit = typeof sosAuthAudit.$inferSelect;
export type InsertSosAuthAudit = typeof sosAuthAudit.$inferInsert;

// ── sos_audit_outbox ───────────────────────────────────────────────────────
// §8 (Phase 2C): Durable outbox for authorization-denial audit events.
// Denial events cannot share a transaction with the operation they describe
// (there is no state change to co-commit with).  Writing to the outbox first
// guarantees the event is not silently lost when the main audit INSERT fails.
//
// A background drain (see authorizationService.ts) copies processed rows into
// sos_auth_audit.  Rows with processedAt IS NULL are unprocessed.
export const sosAuditOutbox = pgTable(
  "sos_audit_outbox",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    orgId:            uuid("org_id"),
    userId:           uuid("user_id"),
    sessionId:        text("session_id"),
    eventType:        text("event_type").notNull(),
    outcome:          text("outcome").notNull().default("failure"),
    reasonCode:       text("reason_code"),
    targetUserId:     uuid("target_user_id"),
    ipAddress:        text("ip_address"),
    userAgentSummary: text("user_agent_summary"),
    metadata:         jsonb("metadata"),
    attempts:          integer("attempts").notNull().default(0),
    errorDetail:       text("error_detail"),
    processedAt:       timestamp("processed_at", { withTimezone: true }),
    // §7: Phase 2D — marks rows that have exhausted retry attempts for manual review.
    failedPermanently: boolean("failed_permanently").notNull().default(false),
    createdAt:         timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxCreatedAt: index("idx_sos_audit_outbox_created_at").on(t.createdAt),
    idxProcessed: index("idx_sos_audit_outbox_processed_at").on(t.processedAt),
    idxPending:   index("idx_sos_audit_outbox_pending").on(t.createdAt),
  }),
);
export type SosAuditOutbox = typeof sosAuditOutbox.$inferSelect;
export type InsertSosAuditOutbox = typeof sosAuditOutbox.$inferInsert;

// ── sos_rate_limit_windows ─────────────────────────────────────────────────
// PostgreSQL-backed rate limit counter store.
// Survives API restart. Shared across multiple API instances.
// Keyed by (endpoint:ip), windowed by window_end timestamp.
// Pruned periodically by the application.
export const sosRateLimitWindows = pgTable(
  "sos_rate_limit_windows",
  {
    key:       text("key").notNull(),
    windowEnd: timestamp("window_end", { withTimezone: true }).notNull(),
    count:     integer("count").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxWindowEnd: index("idx_sos_rate_limit_window_end").on(t.windowEnd),
  }),
);
export type SosRateLimitWindow = typeof sosRateLimitWindows.$inferSelect;
