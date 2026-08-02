-- ============================================================================
-- Migration 0006: Clinical Documentation Foundation
-- Implementation Phase 3 — Clinical Documentation Foundation
-- (Completes part of the product-audit "Clinical Workflow Completion" phase)
--
-- Adds:
--   sos_clinical_notes          — individual progress and nursing notes
--   sos_clinical_notes_no_edit_after_sign trigger — signed-note immutability
--   Expands ck_sos_auth_audit_event_type to include 6 clinical note events
--
-- All CREATE TABLE / INDEX statements use IF NOT EXISTS for idempotency.
-- Trigger and constraint operations are idempotent via DROP IF EXISTS.
-- ============================================================================

--> statement-breakpoint

-- ── 1. sos_clinical_notes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_clinical_notes (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID        NOT NULL REFERENCES sos_organizations(id) ON DELETE CASCADE,
    facility_id         UUID        NOT NULL,
    patient_id          UUID        NOT NULL,
    episode_id          UUID,
    author_user_id      UUID        NOT NULL,
    note_type           TEXT        NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'draft',
    content             TEXT        NOT NULL,
    version             INTEGER     NOT NULL DEFAULT 1,
    signed_at           TIMESTAMPTZ,
    signed_by_user_id   UUID,
    voided_at           TIMESTAMPTZ,
    voided_by_user_id   UUID,
    void_reason         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Note type: exactly the two approved types; extend via future migration only.
    CONSTRAINT ck_sos_clinical_notes_note_type
        CHECK (note_type IN ('progress_note', 'nursing_note')),

    -- Status lifecycle.
    CONSTRAINT ck_sos_clinical_notes_status
        CHECK (status IN ('draft', 'signed', 'voided')),

    -- Version must be positive.
    CONSTRAINT ck_sos_clinical_notes_version
        CHECK (version > 0),

    -- Signed fields required iff status = 'signed'.
    CONSTRAINT ck_sos_clinical_notes_signed_consistency
        CHECK (
            (status = 'signed') = (signed_at IS NOT NULL AND signed_by_user_id IS NOT NULL)
        ),

    -- Void fields required iff status = 'voided'.
    CONSTRAINT ck_sos_clinical_notes_void_consistency
        CHECK (
            (status = 'voided') = (
                voided_at IS NOT NULL
                AND voided_by_user_id IS NOT NULL
                AND void_reason IS NOT NULL
            )
        ),

    -- Facility consistency: note must belong to a facility in the same org.
    CONSTRAINT fk_sos_clinical_notes_org_facility
        FOREIGN KEY (org_id, facility_id)
        REFERENCES sos_facilities(org_id, id)
        ON DELETE RESTRICT,

    -- Patient must belong to the same org.
    CONSTRAINT fk_sos_clinical_notes_org_patient
        FOREIGN KEY (org_id, patient_id)
        REFERENCES sos_patients(org_id, id)
        ON DELETE RESTRICT,

    -- Episode must exist (nullable: some notes are not linked to an episode).
    CONSTRAINT fk_sos_clinical_notes_episode
        FOREIGN KEY (episode_id)
        REFERENCES sos_episodes_of_care(id)
        ON DELETE RESTRICT,

    -- Author must be a valid user in the same org.
    CONSTRAINT fk_sos_clinical_notes_author
        FOREIGN KEY (org_id, author_user_id)
        REFERENCES sos_user_accounts(org_id, id)
        ON DELETE RESTRICT,

    -- Signer must be a valid user in the same org (nullable until signed).
    CONSTRAINT fk_sos_clinical_notes_signed_by
        FOREIGN KEY (org_id, signed_by_user_id)
        REFERENCES sos_user_accounts(org_id, id)
        ON DELETE RESTRICT,

    -- Void actor must be a valid user in the same org (nullable until voided).
    CONSTRAINT fk_sos_clinical_notes_voided_by
        FOREIGN KEY (org_id, voided_by_user_id)
        REFERENCES sos_user_accounts(org_id, id)
        ON DELETE RESTRICT
);

--> statement-breakpoint

-- Primary access pattern: patient note timeline (newest first).
CREATE INDEX IF NOT EXISTS idx_sos_clinical_notes_patient
    ON sos_clinical_notes(org_id, patient_id, created_at DESC);

-- Author's drafts lookup.
CREATE INDEX IF NOT EXISTS idx_sos_clinical_notes_author
    ON sos_clinical_notes(org_id, author_user_id, status);

-- Episode-scoped notes.
CREATE INDEX IF NOT EXISTS idx_sos_clinical_notes_episode
    ON sos_clinical_notes(episode_id)
    WHERE episode_id IS NOT NULL;

-- Facility-level supervisory view.
CREATE INDEX IF NOT EXISTS idx_sos_clinical_notes_facility_date
    ON sos_clinical_notes(org_id, facility_id, created_at DESC);

--> statement-breakpoint

-- ── 2. Signed-note immutability trigger ───────────────────────────────────────
--
-- Once a note is signed, the following clinical fields may NEVER be modified:
--   content, note_type, author_user_id, patient_id, facility_id, episode_id,
--   signed_at, signed_by_user_id, org_id.
--
-- Voiding a signed note (status 'signed' → 'voided') IS permitted, as it adds
-- void metadata without altering the original clinical content.
--
CREATE OR REPLACE FUNCTION sos_clinical_notes_immutability_check()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Only applies when the previous state was 'signed'.
    IF OLD.status <> 'signed' THEN
        RETURN NEW;
    END IF;

    -- Voiding a signed note is the only permitted transition.
    -- A void sets status='voided' and populates void fields; nothing else changes.
    IF NEW.status = 'voided' THEN
        -- Ensure content and clinical fields are unchanged during voiding.
        IF NEW.content            IS DISTINCT FROM OLD.content           OR
           NEW.note_type          IS DISTINCT FROM OLD.note_type          OR
           NEW.author_user_id     IS DISTINCT FROM OLD.author_user_id     OR
           NEW.patient_id         IS DISTINCT FROM OLD.patient_id         OR
           NEW.facility_id        IS DISTINCT FROM OLD.facility_id        OR
           NEW.episode_id         IS DISTINCT FROM OLD.episode_id         OR
           NEW.org_id             IS DISTINCT FROM OLD.org_id             OR
           NEW.signed_at          IS DISTINCT FROM OLD.signed_at          OR
           NEW.signed_by_user_id  IS DISTINCT FROM OLD.signed_by_user_id
        THEN
            RAISE EXCEPTION
                'sos_clinical_notes: cannot modify clinical fields on a signed note (id=%). '
                'Only void metadata (voided_at, voided_by_user_id, void_reason, status) '
                'may change during voiding.',
                OLD.id;
        END IF;
        RETURN NEW;
    END IF;

    -- Any other update to a signed note is rejected.
    RAISE EXCEPTION
        'sos_clinical_notes: signed note (id=%) is immutable. '
        'status=% → % is not a permitted transition. '
        'Only voiding (status → voided) is allowed after signing.',
        OLD.id, OLD.status, NEW.status;
END;
$$;

DROP TRIGGER IF EXISTS sos_clinical_notes_no_edit_after_sign ON sos_clinical_notes;
CREATE TRIGGER sos_clinical_notes_no_edit_after_sign
    BEFORE UPDATE ON sos_clinical_notes
    FOR EACH ROW EXECUTE FUNCTION sos_clinical_notes_immutability_check();

--> statement-breakpoint

-- ── 3. Expand sos_auth_audit event_type allowlist ─────────────────────────────
--
-- Six new event types for clinical-note lifecycle actions:
--   clinical_note_created, clinical_note_viewed, clinical_note_updated,
--   clinical_note_signed, clinical_note_voided, clinical_note_access_denied
--
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
        'clinical_note_signed', 'clinical_note_voided', 'clinical_note_access_denied'
    ]::text[])
);
