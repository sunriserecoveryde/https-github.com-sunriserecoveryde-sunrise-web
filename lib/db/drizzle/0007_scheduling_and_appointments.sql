-- ============================================================================
-- Migration 0007: Scheduling and Appointments
-- Implementation Phase 4 — Scheduling and Appointments
--
-- Adds:
--   sos_appointments           — staff-created patient appointments
--   Expands ck_sos_auth_audit_event_type to include 3 appointment events
--   Expands ck_sos_audit_outbox_event_type to include 3 appointment events
--
-- Approved statuses: scheduled, cancelled (Phase 4 only).
-- Approved types: individual_therapy, medication_management, intake,
--                 follow_up, other.
--
-- All CREATE TABLE / INDEX statements use IF NOT EXISTS for idempotency.
-- Constraint operations are idempotent via DROP IF EXISTS.
-- ============================================================================

--> statement-breakpoint

-- ── 1. sos_appointments ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_appointments (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id               UUID        NOT NULL REFERENCES sos_organizations(id) ON DELETE CASCADE,
    facility_id          UUID        NOT NULL,
    patient_id           UUID        NOT NULL,
    assigned_user_id     UUID        NOT NULL,
    appointment_type     TEXT        NOT NULL,
    status               TEXT        NOT NULL DEFAULT 'scheduled',
    starts_at            TIMESTAMPTZ NOT NULL,
    ends_at              TIMESTAMPTZ NOT NULL,
    reason               TEXT        NOT NULL,
    internal_note        TEXT,
    created_by_user_id   UUID        NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id   UUID,
    updated_at           TIMESTAMPTZ,
    cancelled_by_user_id UUID,
    cancelled_at         TIMESTAMPTZ,
    cancellation_reason  TEXT,
    version              INTEGER     NOT NULL DEFAULT 1,

    -- End must be strictly after start.
    CONSTRAINT ck_sos_appointments_time_order
        CHECK (ends_at > starts_at),

    -- Phase 4 approved appointment types only.
    CONSTRAINT ck_sos_appointments_type
        CHECK (appointment_type IN (
            'individual_therapy', 'medication_management',
            'intake', 'follow_up', 'other'
        )),

    -- Phase 4 approved statuses only.
    CONSTRAINT ck_sos_appointments_status
        CHECK (status IN ('scheduled', 'cancelled')),

    -- Cancellation fields: all null when scheduled; all populated when cancelled.
    CONSTRAINT ck_sos_appointments_cancellation
        CHECK (
            (status = 'cancelled') = (
                cancelled_by_user_id IS NOT NULL
                AND cancelled_at IS NOT NULL
                AND cancellation_reason IS NOT NULL
            )
        ),

    -- Version must be positive.
    CONSTRAINT ck_sos_appointments_version
        CHECK (version > 0),

    -- Composite FK: facility must belong to the same org.
    CONSTRAINT fk_apt_org_facility
        FOREIGN KEY (org_id, facility_id)
        REFERENCES sos_facilities(org_id, id)
        ON DELETE RESTRICT,

    -- Composite FK: patient must belong to the same org.
    CONSTRAINT fk_apt_org_patient
        FOREIGN KEY (org_id, patient_id)
        REFERENCES sos_patients(org_id, id)
        ON DELETE RESTRICT,

    -- Composite FK: assigned user must be in the same org.
    CONSTRAINT fk_apt_assigned_user
        FOREIGN KEY (org_id, assigned_user_id)
        REFERENCES sos_user_accounts(org_id, id)
        ON DELETE RESTRICT,

    -- Composite FK: creator must be in the same org.
    CONSTRAINT fk_apt_created_by
        FOREIGN KEY (org_id, created_by_user_id)
        REFERENCES sos_user_accounts(org_id, id)
        ON DELETE RESTRICT
);

--> statement-breakpoint

-- ── 2. Indexes ────────────────────────────────────────────────────────────────

-- Patient time overlap conflict check (partial — excludes cancelled).
CREATE INDEX IF NOT EXISTS idx_apt_patient_time
    ON sos_appointments (org_id, patient_id, starts_at, ends_at)
    WHERE status = 'scheduled';

-- Assigned-staff time overlap conflict check (partial — excludes cancelled).
CREATE INDEX IF NOT EXISTS idx_apt_staff_time
    ON sos_appointments (org_id, assigned_user_id, starts_at, ends_at)
    WHERE status = 'scheduled';

-- Facility schedule day-range queries.
CREATE INDEX IF NOT EXISTS idx_apt_facility_time
    ON sos_appointments (org_id, facility_id, starts_at);

-- Patient appointment history (upcoming + past).
CREATE INDEX IF NOT EXISTS idx_apt_patient_history
    ON sos_appointments (org_id, patient_id, starts_at);

--> statement-breakpoint

-- ── 3. Expand sos_auth_audit event_type allowlist ────────────────────────────
ALTER TABLE sos_auth_audit DROP CONSTRAINT IF EXISTS ck_sos_auth_audit_event_type;
ALTER TABLE sos_auth_audit ADD CONSTRAINT ck_sos_auth_audit_event_type CHECK (
    event_type = ANY (ARRAY[
        -- Authentication events
        'login_success', 'login_failure', 'logout',
        'session_created', 'session_expired', 'session_revoked',
        'account_locked', 'account_unlocked',
        'password_reset_requested', 'password_reset_completed', 'password_changed',
        -- Role and access management
        'role_assignment_created', 'role_assignment_revoked',
        'facility_assignment_changed',
        'patient_access_created', 'patient_access_revoked',
        -- Authorization
        'authorization_denied',
        'admin_session_revocation', 'sessions_revoked_all',
        -- User management
        'user_disabled', 'user_reactivated', 'user_created',
        -- Security events
        'role_grant_denied', 'csrf_violation', 'rate_limit_window_cleared',
        -- Clinical note events (Phase 3)
        'clinical_note_created', 'clinical_note_viewed', 'clinical_note_updated',
        'clinical_note_signed', 'clinical_note_voided', 'clinical_note_access_denied',
        -- Appointment events (Phase 4) — dot-form per approved contract
        'appointment.created', 'appointment.updated', 'appointment.cancelled'
    ]::text[])
);

-- NOTE: sos_audit_outbox intentionally has NO check constraint on event_type.
-- The outbox worker tests rely on being able to insert/update rows with
-- __invalid_type__ to exercise error-handling paths (step-04, step-05).
-- The strict allowlist check lives only on sos_auth_audit (the settled record).
