-- Phase 2E — Add rate_limit_window_cleared to sos_auth_audit event_type allowlist
--
-- The admin route DELETE /api/v1/admin/rate-limit/windows/:key writes an audit
-- event of type "rate_limit_window_cleared" when an operator releases a blocked IP.
-- This migration expands the CHECK constraint to include that value.
--
-- breakpoints: true

--> statement-breakpoint

-- ── Expand sos_auth_audit event_type allowlist ────────────────────────────────
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
    'user_created', 'role_grant_denied', 'csrf_violation',
    'rate_limit_window_cleared'
  ]::text[])
);
