-- Phase 2D — Final Closure migration
--
-- §1  Credential removal  (code-level — no DDL required)
-- §2  Eliminate unbound patient-access: active rows must have exact assignment FK
-- §3  Backfill / revoke / quarantine existing NULL role_assignment_id rows
-- §4  PostgreSQL constraints: CHECK for active rows, ON DELETE RESTRICT,
--     cross-column integrity trigger (user / org / facility consistency)
-- §7  Audit outbox: failed_permanently column for permanent-failure state
--
-- breakpoints: true

--> statement-breakpoint

-- ── 1. Add quarantined_reason to sos_patient_access ──────────────────────────
-- Records why an access row was revoked during the Phase 2D backfill.
ALTER TABLE "sos_patient_access"
  ADD COLUMN IF NOT EXISTS "quarantined_reason" text;

--> statement-breakpoint

-- ── 2. Add failed_permanently to sos_audit_outbox ────────────────────────────
-- Marks outbox rows that have exhausted retry attempts for manual review.
ALTER TABLE "sos_audit_outbox"
  ADD COLUMN IF NOT EXISTS "failed_permanently" boolean NOT NULL DEFAULT false;

--> statement-breakpoint

-- Index for efficient unprocessed-row queries in the outbox worker
CREATE INDEX IF NOT EXISTS "idx_sos_audit_outbox_pending"
  ON "sos_audit_outbox" ("created_at")
  WHERE ("processed_at" IS NULL AND "failed_permanently" = false);

--> statement-breakpoint

-- ── 3. Backfill / revoke / quarantine NULL role_assignment_id rows ────────────
-- For each active sos_patient_access row with no role_assignment_id:
--   Exactly one valid matching assignment → backfill.
--   Zero valid assignments              → revoke with reason no_valid_assignment_found.
--   Multiple valid assignments          → quarantine with reason ambiguous_multiple_assignments.
DO $$
DECLARE
  r                RECORD;
  assignment_ids   UUID[];
  rows_examined    INTEGER := 0;
  rows_backfilled  INTEGER := 0;
  rows_revoked     INTEGER := 0;
  rows_quarantined INTEGER := 0;
BEGIN
  FOR r IN
    SELECT id, org_id, user_id, facility_id
    FROM sos_patient_access
    WHERE role_assignment_id IS NULL
      AND status = 'active'
  LOOP
    rows_examined := rows_examined + 1;

    -- Collect all active, effective, non-expired assignments that could own this row.
    -- Facility match: assignment facility = access facility, OR assignment is org-wide (NULL).
    SELECT ARRAY_AGG(ra.id ORDER BY ra.created_at ASC)
      INTO assignment_ids
      FROM sos_role_assignments ra
     WHERE ra.org_id      = r.org_id
       AND ra.user_id     = r.user_id
       AND ra.status      = 'active'
       AND ra.effective_at <= NOW()
       AND (ra.expires_at IS NULL OR ra.expires_at > NOW())
       AND (
         r.facility_id IS NULL
         OR ra.facility_id = r.facility_id
         OR ra.facility_id IS NULL
       );

    IF assignment_ids IS NULL OR array_length(assignment_ids, 1) = 0 THEN
      -- No valid assignment — revoke the access row.
      UPDATE sos_patient_access
         SET status              = 'revoked',
             quarantined_reason  = 'no_valid_assignment_found'
       WHERE id = r.id;
      rows_revoked := rows_revoked + 1;

    ELSIF array_length(assignment_ids, 1) = 1 THEN
      -- Exactly one valid assignment — backfill.
      UPDATE sos_patient_access
         SET role_assignment_id = assignment_ids[1]
       WHERE id = r.id;
      rows_backfilled := rows_backfilled + 1;

    ELSE
      -- Multiple valid assignments — quarantine for manual review.
      UPDATE sos_patient_access
         SET status             = 'revoked',
             quarantined_reason = 'ambiguous_multiple_assignments'
       WHERE id = r.id;
      rows_quarantined := rows_quarantined + 1;
    END IF;
  END LOOP;

  RAISE NOTICE
    'Phase 2D sos_patient_access backfill: examined=%, backfilled=%, revoked=%, quarantined=%',
    rows_examined, rows_backfilled, rows_revoked, rows_quarantined;
END;
$$;

--> statement-breakpoint

-- ── 4. Drop old SET NULL FK; replace with RESTRICT ───────────────────────────
-- After the backfill, NULL active rows no longer exist.
-- Revoked assignment must not silently null-out access rows — use RESTRICT so
-- operators explicitly revoke access before deleting an assignment.
ALTER TABLE "sos_patient_access"
  DROP CONSTRAINT IF EXISTS "fk_sos_patient_access_role_assignment";

--> statement-breakpoint

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
      ON DELETE RESTRICT;
  END IF;
END;
$$;

--> statement-breakpoint

-- ── 5. CHECK: active access requires a non-null assignment FK ─────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'ck_active_access_requires_assignment'
  ) THEN
    ALTER TABLE "sos_patient_access"
      ADD CONSTRAINT "ck_active_access_requires_assignment"
      CHECK (status != 'active' OR role_assignment_id IS NOT NULL);
  END IF;
END;
$$;

--> statement-breakpoint

-- ── 6. Cross-column integrity trigger ─────────────────────────────────────────
-- Enforces at the DB level:
--   • patient_access.user_id     = role_assignment.user_id
--   • patient_access.org_id      = role_assignment.org_id
--   • patient_access.facility_id matches role_assignment.facility_id
--   • active access cannot reference a revoked assignment
-- These constraints cannot be expressed as CHECK constraints (cross-table);
-- a BEFORE INSERT OR UPDATE trigger is the correct mechanism.

CREATE OR REPLACE FUNCTION sos_patient_access_assignment_integrity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_ra_user_id     UUID;
  v_ra_org_id      UUID;
  v_ra_facility_id UUID;
  v_ra_status      TEXT;
BEGIN
  -- NULL role_assignment_id only allowed for revoked/quarantined rows.
  IF NEW.role_assignment_id IS NULL THEN
    IF NEW.status = 'active' THEN
      RAISE EXCEPTION
        'sos_patient_access: active rows must reference an exact role assignment '
        '(role_assignment_id IS NULL for active row id=%)', NEW.id;
    END IF;
    RETURN NEW;
  END IF;

  -- Resolve the referenced assignment.
  SELECT user_id, org_id, facility_id, status
    INTO v_ra_user_id, v_ra_org_id, v_ra_facility_id, v_ra_status
    FROM sos_role_assignments
   WHERE id = NEW.role_assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'sos_patient_access: role_assignment_id % does not exist',
      NEW.role_assignment_id;
  END IF;

  -- User must match exactly.
  IF v_ra_user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION
      'sos_patient_access: user_id (%) does not match role_assignment user_id (%) '
      'for assignment %',
      NEW.user_id, v_ra_user_id, NEW.role_assignment_id;
  END IF;

  -- Organisation must match exactly.
  IF v_ra_org_id IS DISTINCT FROM NEW.org_id THEN
    RAISE EXCEPTION
      'sos_patient_access: org_id (%) does not match role_assignment org_id (%) '
      'for assignment %',
      NEW.org_id, v_ra_org_id, NEW.role_assignment_id;
  END IF;

  -- Facility: when both sides specify a facility, they must agree.
  IF NEW.facility_id IS NOT NULL
     AND v_ra_facility_id IS NOT NULL
     AND NEW.facility_id IS DISTINCT FROM v_ra_facility_id THEN
    RAISE EXCEPTION
      'sos_patient_access: facility_id (%) does not match role_assignment facility_id (%) '
      'for assignment %',
      NEW.facility_id, v_ra_facility_id, NEW.role_assignment_id;
  END IF;

  -- Active access must reference an active assignment.
  IF NEW.status = 'active' AND v_ra_status != 'active' THEN
    RAISE EXCEPTION
      'sos_patient_access: cannot create active access for non-active assignment '
      '(status=%) %',
      v_ra_status, NEW.role_assignment_id;
  END IF;

  RETURN NEW;
END;
$$;

--> statement-breakpoint

DROP TRIGGER IF EXISTS sos_patient_access_assignment_integrity_check
  ON sos_patient_access;

--> statement-breakpoint

CREATE TRIGGER sos_patient_access_assignment_integrity_check
  BEFORE INSERT OR UPDATE ON sos_patient_access
  FOR EACH ROW EXECUTE FUNCTION sos_patient_access_assignment_integrity();

--> statement-breakpoint

-- ── 7. Index: fast lookup of access rows by assignment ───────────────────────
CREATE INDEX IF NOT EXISTS "idx_sos_patient_access_role_assignment"
  ON "sos_patient_access" ("role_assignment_id")
  WHERE ("role_assignment_id" IS NOT NULL);
