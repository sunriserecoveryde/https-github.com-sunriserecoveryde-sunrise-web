-- Phase 2B — Authorization Correction
-- Migration: 0002_authorization_correction
--
-- Adds:
--   1. org slug for tenant-deterministic login
--   2. sos_rate_limit_windows — shared PostgreSQL-backed rate limiting
--   3. Audit-protection triggers (prevent UPDATE/DELETE on sos_auth_audit)
--   4. Patient-access consistency trigger (access.facility_id must match patient.facility_id)
--   5. Session → user_accounts FK
--
-- All statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE).

---------------------------------------------------------------------------
-- 1. Organization slug (tenant identifier for login)
---------------------------------------------------------------------------
ALTER TABLE sos_organizations ADD COLUMN IF NOT EXISTS slug TEXT;

-- Seed slug from org name (lowercase, non-alphanumeric → hyphen).
-- Only touches rows that do not yet have a slug.
UPDATE sos_organizations
   SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
 WHERE slug IS NULL;

-- Require slug going forward.
ALTER TABLE sos_organizations
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sos_organizations_slug
  ON sos_organizations (slug);

---------------------------------------------------------------------------
-- 2. Shared rate-limit store (survives API restarts; shared across instances)
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sos_rate_limit_windows (
  key        TEXT        NOT NULL,        -- e.g. "login:127.0.0.1"
  window_end TIMESTAMPTZ NOT NULL,        -- when this window expires
  count      INTEGER     NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pk_sos_rate_limit_windows PRIMARY KEY (key, window_end)
);

CREATE INDEX IF NOT EXISTS idx_sos_rate_limit_window_end
  ON sos_rate_limit_windows (window_end);

-- Purge expired windows automatically via a trigger is not worth the
-- complexity; the application prunes them on startup and periodically.

---------------------------------------------------------------------------
-- 3. Audit append-only enforcement (database-level)
---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sos_prevent_audit_modification()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'Modifications to sos_auth_audit are not permitted. '
    'This table is append-only by policy. TG_OP=%', TG_OP;
  RETURN NULL;
END;
$$;

-- Drop and recreate triggers so this migration is re-runnable.
DROP TRIGGER IF EXISTS sos_audit_no_update ON sos_auth_audit;
CREATE TRIGGER sos_audit_no_update
  BEFORE UPDATE ON sos_auth_audit
  FOR EACH ROW EXECUTE FUNCTION sos_prevent_audit_modification();

DROP TRIGGER IF EXISTS sos_audit_no_delete ON sos_auth_audit;
CREATE TRIGGER sos_audit_no_delete
  BEFORE DELETE ON sos_auth_audit
  FOR EACH ROW EXECUTE FUNCTION sos_prevent_audit_modification();

---------------------------------------------------------------------------
-- 4. Patient-access facility consistency
--    sos_patient_access.facility_id must match sos_patients.facility_id
--    for the same patient (when facility_id is not null on the access row).
---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sos_check_patient_access_facility()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_patient_facility_id UUID;
BEGIN
  IF NEW.facility_id IS NULL THEN
    RETURN NEW;  -- org-wide access rows are allowed without a facility check.
  END IF;

  SELECT facility_id INTO v_patient_facility_id
    FROM sos_patients
   WHERE id = NEW.patient_id AND org_id = NEW.org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'sos_patient_access: patient % not found in org %', NEW.patient_id, NEW.org_id;
  END IF;

  IF v_patient_facility_id IS DISTINCT FROM NEW.facility_id THEN
    RAISE EXCEPTION
      'sos_patient_access: facility_id % does not match patient facility_id % for patient %',
      NEW.facility_id, v_patient_facility_id, NEW.patient_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sos_patient_access_facility_check ON sos_patient_access;
CREATE TRIGGER sos_patient_access_facility_check
  BEFORE INSERT OR UPDATE OF facility_id, patient_id ON sos_patient_access
  FOR EACH ROW EXECUTE FUNCTION sos_check_patient_access_facility();

---------------------------------------------------------------------------
-- 5. Session → user_accounts FK (durable integrity)
--    sos_sessions.user_id → sos_user_accounts.id (nullable; set after login)
---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
     WHERE constraint_name = 'fk_sos_sessions_user_account'
       AND table_name = 'sos_sessions'
  ) THEN
    ALTER TABLE sos_sessions
      ADD CONSTRAINT fk_sos_sessions_user_account
      FOREIGN KEY (user_id) REFERENCES sos_user_accounts(id)
      ON DELETE SET NULL NOT VALID;
    -- NOT VALID: new inserts are enforced immediately; existing rows with
    -- orphaned user_id (from sessions predating this migration) are not
    -- retroactively rejected.  Run VALIDATE CONSTRAINT in a maintenance window
    -- after cleaning up orphaned sessions in Phase 3.
  END IF;
END;
$$;

---------------------------------------------------------------------------
-- 6. CHECK constraint: role_assignments.facility_id must belong to the org
--    This is already enforced by the FK fk_sos_role_assignments_org_facility;
--    add an explicit CHECK on status values to be exhaustive.
---------------------------------------------------------------------------
-- (no new CHECK needed — existing FK already enforces org↔facility coupling)

---------------------------------------------------------------------------
-- 7. Seed the test org slug (for isolated-DB migration test)
---------------------------------------------------------------------------
-- The authSeed.ts creates the test org with id '00000000-0000-4000-a000-000000000001'.
-- We must also set its slug here so the migration itself leaves the DB consistent.
-- The UPDATE in §1 above already handles this by deriving from name.
-- The test org is named 'Sunrise Recovery Center' → slug 'sunrise-recovery-center'.
-- authSeed.ts overwrites this with 'sunrise' via upsert after migration.
