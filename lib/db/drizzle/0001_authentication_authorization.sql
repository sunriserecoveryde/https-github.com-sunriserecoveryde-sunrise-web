-- ============================================================================
-- Migration 0001: Authentication and Authorization
-- Branch: readiness/p0-authentication-authorization
--
-- Adds five tables for production auth:
--   sos_user_accounts     — local-auth credentials, account lockout, session versioning
--   sos_sessions          — server-side session store (connect-pg-simple compatible)
--   sos_role_assignments  — DB-backed role ↔ user ↔ facility assignments
--   sos_patient_access    — explicit patient-access assignments for restricted roles
--   sos_auth_audit        — append-only authentication/authorization audit log
--
-- All CREATE TABLE/INDEX statements use IF NOT EXISTS so the migration is
-- idempotent and can be re-applied safely when tables were pre-created.
-- ============================================================================

-- ── sos_user_accounts ────────────────────────────────────────────────────────
-- Local-auth credential record for each Sunrise OS user.
-- Links to sos_user_identity_refs via composite FK (org_id, user_identity_ref_id).
CREATE TABLE IF NOT EXISTS sos_user_accounts (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id               UUID        NOT NULL REFERENCES sos_organizations(id) ON DELETE CASCADE,
    user_identity_ref_id UUID        NOT NULL,
    email                TEXT        NOT NULL,
    password_hash        TEXT,                       -- Argon2id hash; NULL for SSO-only accounts
    status               TEXT        NOT NULL DEFAULT 'active',
    email_verified_at    TIMESTAMPTZ,
    failed_login_count   INTEGER     NOT NULL DEFAULT 0,
    locked_until         TIMESTAMPTZ,
    last_login_at        TIMESTAMPTZ,
    password_changed_at  TIMESTAMPTZ,
    session_version      INTEGER     NOT NULL DEFAULT 0,  -- bump to invalidate all sessions
    mfa_status           TEXT        NOT NULL DEFAULT 'disabled',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    disabled_at          TIMESTAMPTZ,
    CONSTRAINT ck_sos_user_accounts_status
        CHECK (status IN ('active', 'disabled', 'locked', 'pending_verification')),
    CONSTRAINT ck_sos_user_accounts_mfa_status
        CHECK (mfa_status IN ('disabled', 'totp_pending', 'totp_active', 'webauthn_active')),
    CONSTRAINT fk_sos_user_accounts_org_identity_ref
        FOREIGN KEY (org_id, user_identity_ref_id)
        REFERENCES sos_user_identity_refs(org_id, id)
        ON DELETE CASCADE
);

-- Unique email per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_sos_user_accounts_org_email
    ON sos_user_accounts(org_id, email);

-- Fast lookup by org
CREATE INDEX IF NOT EXISTS idx_sos_user_accounts_org_id
    ON sos_user_accounts(org_id);

-- Composite unique: (org_id, id) for FK targets from role_assignments / patient_access
CREATE UNIQUE INDEX IF NOT EXISTS idx_sos_user_accounts_org_id_id
    ON sos_user_accounts(org_id, id);

-- ── sos_sessions ─────────────────────────────────────────────────────────────
-- Server-side session store.  The first three columns (sid, sess, expire) are
-- the schema expected by connect-pg-simple.  Additional columns add revocation
-- tracking and compliance metadata.
CREATE TABLE IF NOT EXISTS sos_sessions (
    sid              TEXT        PRIMARY KEY,
    sess             JSONB       NOT NULL,
    expire           TIMESTAMPTZ NOT NULL,
    -- Compliance / revocation columns
    user_id          UUID,
    org_id           UUID,
    session_version  INTEGER,
    ip_address       TEXT,
    user_agent_summary TEXT,
    revoked_at       TIMESTAMPTZ,
    revoked_reason   TEXT
);

CREATE INDEX IF NOT EXISTS idx_sos_sessions_expire ON sos_sessions(expire);
CREATE INDEX IF NOT EXISTS idx_sos_sessions_user_id ON sos_sessions(user_id) WHERE user_id IS NOT NULL;

-- ── sos_role_assignments ──────────────────────────────────────────────────────
-- Maps a user to a code-defined role, optionally scoped to a facility.
-- NULL facility_id means an organization-wide assignment.
CREATE TABLE IF NOT EXISTS sos_role_assignments (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            UUID        NOT NULL REFERENCES sos_organizations(id) ON DELETE CASCADE,
    user_id           UUID        NOT NULL,
    staff_profile_id  UUID,                   -- optional link to sos_staff_profiles
    role_id           TEXT        NOT NULL,   -- matches code-defined role IDs
    facility_id       UUID,                   -- NULL = org-wide
    program_id        TEXT,                   -- optional program scope
    status            TEXT        NOT NULL DEFAULT 'active',
    effective_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID,
    CONSTRAINT ck_sos_role_assignments_status
        CHECK (status IN ('active', 'revoked', 'expired')),
    -- User must belong to the same org
    CONSTRAINT fk_sos_role_assignments_org_user
        FOREIGN KEY (org_id, user_id)
        REFERENCES sos_user_accounts(org_id, id)
        ON DELETE CASCADE,
    -- Facility, when set, must belong to the same org
    CONSTRAINT fk_sos_role_assignments_org_facility
        FOREIGN KEY (org_id, facility_id)
        REFERENCES sos_facilities(org_id, id)
        ON DELETE RESTRICT
        DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_sos_role_assignments_org_user
    ON sos_role_assignments(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_sos_role_assignments_facility
    ON sos_role_assignments(facility_id) WHERE facility_id IS NOT NULL;

-- ── sos_patient_access ────────────────────────────────────────────────────────
-- Explicit patient-access assignments.  Used for roles that require an individual
-- assignment record rather than facility-wide access (e.g. restricted caseloads).
CREATE TABLE IF NOT EXISTS sos_patient_access (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id             UUID        NOT NULL REFERENCES sos_organizations(id) ON DELETE CASCADE,
    facility_id        UUID        NOT NULL,
    patient_id         UUID        NOT NULL,
    user_id            UUID        NOT NULL,
    relationship_type  TEXT        NOT NULL DEFAULT 'caseload_member',
    effective_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at         TIMESTAMPTZ,
    status             TEXT        NOT NULL DEFAULT 'active',
    created_by_user_id UUID,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_sos_patient_access_status
        CHECK (status IN ('active', 'revoked', 'expired')),
    CONSTRAINT ck_sos_patient_access_relationship
        CHECK (relationship_type IN (
            'primary_counselor', 'caseload_member', 'covering_staff',
            'observer', 'authorized_reviewer'
        )),
    -- Facility must belong to the org
    CONSTRAINT fk_sos_patient_access_org_facility
        FOREIGN KEY (org_id, facility_id)
        REFERENCES sos_facilities(org_id, id)
        ON DELETE RESTRICT,
    -- Patient must belong to the org
    CONSTRAINT fk_sos_patient_access_org_patient
        FOREIGN KEY (org_id, patient_id)
        REFERENCES sos_patients(org_id, id)
        ON DELETE CASCADE,
    -- User must belong to the org
    CONSTRAINT fk_sos_patient_access_org_user
        FOREIGN KEY (org_id, user_id)
        REFERENCES sos_user_accounts(org_id, id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sos_patient_access_patient
    ON sos_patient_access(org_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_sos_patient_access_user
    ON sos_patient_access(org_id, user_id);

-- ── sos_auth_audit ────────────────────────────────────────────────────────────
-- Append-only authentication and authorization audit log.
-- No UPDATE or DELETE — enforced by application convention; DB trigger planned Phase 3.
CREATE TABLE IF NOT EXISTS sos_auth_audit (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            UUID,
    user_id           UUID,
    staff_id          UUID,
    session_id        TEXT,           -- session reference (NOT the session token)
    event_type        TEXT        NOT NULL,
    outcome           TEXT        NOT NULL DEFAULT 'success',
    reason_code       TEXT,
    target_user_id    UUID,
    ip_address        TEXT,
    user_agent_summary TEXT,
    metadata          JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_sos_auth_audit_outcome
        CHECK (outcome IN ('success', 'failure', 'error')),
    CONSTRAINT ck_sos_auth_audit_event_type CHECK (event_type IN (
        'login_success', 'login_failure', 'account_locked', 'account_unlocked',
        'logout', 'session_created', 'session_expired', 'session_revoked',
        'password_reset_requested', 'password_reset_completed',
        'role_assignment_created', 'role_assignment_revoked',
        'facility_assignment_changed', 'patient_access_created', 'patient_access_revoked',
        'authorization_denied', 'admin_session_revocation',
        'user_disabled', 'user_reactivated'
    ))
);

CREATE INDEX IF NOT EXISTS idx_sos_auth_audit_user_id
    ON sos_auth_audit(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sos_auth_audit_org_id
    ON sos_auth_audit(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sos_auth_audit_created_at
    ON sos_auth_audit(created_at DESC);
