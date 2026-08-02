-- Phase 2C — Final Security Closure migration
-- §8: Durable audit outbox for authorization-denial events
-- §6: FK constraint tying patient access rows to role assignments
-- §5: Index on sos_role_assignments.effective_at for performant effectiveAt <= NOW() checks

-- breakpoints: true

--> statement-breakpoint

-- ── §8: Durable audit outbox ──────────────────────────────────────────────────
-- Denial events write here first; a background drain moves them to sos_auth_audit.
-- This prevents silent loss of denial events when the main audit INSERT fails.
CREATE TABLE IF NOT EXISTS "sos_audit_outbox" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id"            uuid,
  "user_id"           uuid,
  "session_id"        text,
  "event_type"        text NOT NULL,
  "outcome"           text NOT NULL DEFAULT 'failure',
  "reason_code"       text,
  "target_user_id"    uuid,
  "ip_address"        text,
  "user_agent_summary" text,
  "metadata"          jsonb,
  "attempts"          integer NOT NULL DEFAULT 0,
  "error_detail"      text,
  "processed_at"      timestamptz,
  "created_at"        timestamptz NOT NULL DEFAULT now()
);

--> statement-breakpoint
CREATE INDEX "idx_sos_audit_outbox_created_at"  ON "sos_audit_outbox" ("created_at");

--> statement-breakpoint
CREATE INDEX "idx_sos_audit_outbox_processed_at" ON "sos_audit_outbox" ("processed_at");

--> statement-breakpoint

-- ── §6: Add role_assignment_id column if not yet present ─────────────────────
-- (Column was defined in Drizzle schema for Phase 2B but not always in older DBs)
ALTER TABLE "sos_patient_access" ADD COLUMN IF NOT EXISTS "role_assignment_id" uuid;

--> statement-breakpoint

-- ── §6: FK constraint: patient access tied to role assignment ─────────────────
-- Existing NULL rows are left as-is (ON DELETE SET NULL handles future revocations).
-- New rows created via the updated user-creation flow will always have a FK value.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_sos_patient_access_role_assignment'
  ) THEN
    ALTER TABLE "sos_patient_access"
      ADD CONSTRAINT "fk_sos_patient_access_role_assignment"
      FOREIGN KEY ("role_assignment_id")
      REFERENCES "sos_role_assignments" ("id")
      ON DELETE SET NULL;
  END IF;
END $$;

--> statement-breakpoint

-- ── §5: Index for effectiveAt <= NOW() range scans ───────────────────────────
CREATE INDEX IF NOT EXISTS "idx_sos_role_assignments_effective_at"
  ON "sos_role_assignments" ("effective_at");

--> statement-breakpoint

-- ── §8 / §3 / §2: Expand sos_auth_audit event_type allowlist ─────────────────
-- Phase 2C adds user_created, role_grant_denied, sessions_revoked_all,
-- csrf_violation, and password_changed to the check constraint.
ALTER TABLE "sos_auth_audit" DROP CONSTRAINT IF EXISTS "ck_sos_auth_audit_event_type";
ALTER TABLE "sos_auth_audit" ADD CONSTRAINT "ck_sos_auth_audit_event_type" CHECK (
  event_type = ANY (ARRAY[
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
  ]::text[])
);
