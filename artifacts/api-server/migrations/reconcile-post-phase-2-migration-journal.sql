-- ============================================================================
-- reconcile-post-phase-2-migration-journal.sql
--
-- Safe, idempotent reconciliation script for the post-Phase-2 migration journal.
--
-- PURPOSE
-- -------
-- The development database has all six Phase 1–2 migrations applied but the
-- drizzle.__drizzle_migrations tracking table has only three records:
--
--   id 1 — 0000_perpetual_rafael_vega         (hash stored as tag name, not SHA-256)
--   id 2 — 0001_authentication_authorization  (correct SHA-256)
--   id 3 — 0002_authorization_correction      (correct SHA-256)
--
-- Migrations 0003, 0004, and 0005 were applied directly via SQL during
-- Phase 2C, 2D, and 2E hardening without going through drizzle-kit migrate.
-- The 0000 record was inserted manually with the tag name instead of the
-- file-content SHA-256.
--
-- This script:
--   1. Verifies the expected schema fingerprint before touching any rows.
--   2. Refuses to run if required schema objects are absent.
--   3. Refuses to run if conflicting state is detected.
--   4. Fixes the wrong hash on id 1.
--   5. Inserts the three missing records.
--   6. Is fully idempotent — re-running produces no change after first pass.
--   7. Produces a clear NOTICE log of every action taken.
--
-- PREREQUISITES
-- -------------
-- Run ONLY after:
--   (a) pg_dump backup of the database has been taken, AND
--   (b) this script has been tested against a clone database, AND
--   (c) drizzle-kit migrate on the clone reports "no pending migrations".
--
-- VERIFIED HASHES (SHA-256 of migration file content)
-- ----------------------------------------------------
--   0000  d469974922cc3fc74bbd81e20697f39d9732ae09456fc01871f6c210e4138c1c
--   0001  86b492875afcbdfe10daf7867f66fb31930148fe42c10fd33527c7809d34508d
--   0002  8b64783c95ef5bace0826342cac4e007252c7faac029de5914de88f20b83050d
--   0003  2ad2d880dfe87b3b331459a50b8ddf8ec3c9dd7c76bf26edd297ea887d9af3a6
--   0004  4584ae4def09750eb69fe431348e16b59e6a873c55a71147c7c8020db65240d4
--   0005  1694a931db81b17ef306132f5e916dd57f725a7f849a18d991da930eb8b00a4d
-- ============================================================================

DO $$
DECLARE
  -- Expected SHA-256 content hashes (verified against clean migration proof DB)
  HASH_0000 CONSTANT TEXT := 'd469974922cc3fc74bbd81e20697f39d9732ae09456fc01871f6c210e4138c1c';
  HASH_0001 CONSTANT TEXT := '86b492875afcbdfe10daf7867f66fb31930148fe42c10fd33527c7809d34508d';
  HASH_0002 CONSTANT TEXT := '8b64783c95ef5bace0826342cac4e007252c7faac029de5914de88f20b83050d';
  HASH_0003 CONSTANT TEXT := '2ad2d880dfe87b3b331459a50b8ddf8ec3c9dd7c76bf26edd297ea887d9af3a6';
  HASH_0004 CONSTANT TEXT := '4584ae4def09750eb69fe431348e16b59e6a873c55a71147c7c8020db65240d4';
  HASH_0005 CONSTANT TEXT := '1694a931db81b17ef306132f5e916dd57f725a7f849a18d991da930eb8b00a4d';

  -- Journal timestamps from _journal.json (milliseconds, monotonically increasing)
  TS_0003 CONSTANT BIGINT := 1754179200000;
  TS_0004 CONSTANT BIGINT := 1754265600000;
  TS_0005 CONSTANT BIGINT := 1754352000000;

  v_existing_hash TEXT;
  v_count         INTEGER;
  v_actions       INTEGER := 0;
BEGIN

  -- ── §1 FINGERPRINT CHECKS ──────────────────────────────────────────────────
  -- Verify that every schema object created by migrations 0003–0005 is present.
  -- If any check fails we abort immediately — do not guess.

  -- 0002 fingerprint: sos_rate_limit_windows table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sos_rate_limit_windows'
  ) THEN
    RAISE EXCEPTION
      'RECONCILE ABORT: sos_rate_limit_windows table not found. '
      'Migration 0002 effects are not present. Do not proceed.';
  END IF;

  -- 0003 fingerprint: role_assignment_id column on sos_patient_access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'sos_patient_access'
      AND column_name  = 'role_assignment_id'
  ) THEN
    RAISE EXCEPTION
      'RECONCILE ABORT: sos_patient_access.role_assignment_id column not found. '
      'Migration 0003 effects are not present. Do not proceed.';
  END IF;

  -- 0003 fingerprint: idx_sos_role_assignments_effective_at index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname   = 'idx_sos_role_assignments_effective_at'
  ) THEN
    RAISE EXCEPTION
      'RECONCILE ABORT: idx_sos_role_assignments_effective_at index not found. '
      'Migration 0003 effects are not present. Do not proceed.';
  END IF;

  -- 0004 fingerprint: quarantined_reason column on sos_patient_access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'sos_patient_access'
      AND column_name  = 'quarantined_reason'
  ) THEN
    RAISE EXCEPTION
      'RECONCILE ABORT: sos_patient_access.quarantined_reason column not found. '
      'Migration 0004 effects are not present. Do not proceed.';
  END IF;

  -- 0004 fingerprint: failed_permanently column on sos_audit_outbox
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'sos_audit_outbox'
      AND column_name  = 'failed_permanently'
  ) THEN
    RAISE EXCEPTION
      'RECONCILE ABORT: sos_audit_outbox.failed_permanently column not found. '
      'Migration 0004 effects are not present. Do not proceed.';
  END IF;

  -- 0005 fingerprint: rate_limit_window_cleared in ck_sos_auth_audit_event_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_sos_auth_audit_event_type'
      AND pg_get_constraintdef(oid) LIKE '%rate_limit_window_cleared%'
  ) THEN
    RAISE EXCEPTION
      'RECONCILE ABORT: ck_sos_auth_audit_event_type constraint does not include '
      'rate_limit_window_cleared. Migration 0005 effects are not present. Do not proceed.';
  END IF;

  RAISE NOTICE 'RECONCILE: All 6 migration fingerprint checks passed.';

  -- ── §2 EXISTING RECORD VALIDATION ─────────────────────────────────────────
  -- Records for 0001 and 0002 should already be correct. Abort if they are wrong
  -- (indicates unexpected tampering or a different database state).

  SELECT hash INTO v_existing_hash
    FROM drizzle.__drizzle_migrations WHERE id = 2;
  IF v_existing_hash IS DISTINCT FROM HASH_0001 THEN
    RAISE EXCEPTION
      'RECONCILE ABORT: id=2 hash mismatch. Expected % got %. '
      'This database may not be the expected development instance.',
      HASH_0001, v_existing_hash;
  END IF;

  SELECT hash INTO v_existing_hash
    FROM drizzle.__drizzle_migrations WHERE id = 3;
  IF v_existing_hash IS DISTINCT FROM HASH_0002 THEN
    RAISE EXCEPTION
      'RECONCILE ABORT: id=3 hash mismatch. Expected % got %. '
      'This database may not be the expected development instance.',
      HASH_0002, v_existing_hash;
  END IF;

  RAISE NOTICE 'RECONCILE: Records for 0001 and 0002 validated — hashes match.';

  -- ── §3 FIX WRONG HASH ON id=1 (migration 0000) ────────────────────────────
  -- The 0000 record was inserted with the tag name as the hash instead of the
  -- SHA-256 of the file content. Fix it to match the canonical value.

  SELECT hash INTO v_existing_hash
    FROM drizzle.__drizzle_migrations WHERE id = 1;

  IF v_existing_hash = HASH_0000 THEN
    -- Already correct — idempotent no-op.
    RAISE NOTICE 'RECONCILE: id=1 hash already correct — no update needed.';
  ELSIF v_existing_hash = '0000_perpetual_rafael_vega' THEN
    -- Expected wrong value — apply correction.
    UPDATE drizzle.__drizzle_migrations
       SET hash = HASH_0000
     WHERE id = 1;
    v_actions := v_actions + 1;
    RAISE NOTICE 'RECONCILE: id=1 hash corrected from tag name to SHA-256 %.', HASH_0000;
  ELSE
    RAISE EXCEPTION
      'RECONCILE ABORT: id=1 has unexpected hash value %. '
      'Expected either the known wrong value (0000_perpetual_rafael_vega) or '
      'the correct SHA-256. Manual inspection required.',
      v_existing_hash;
  END IF;

  -- ── §4 INSERT MISSING RECORDS FOR 0003, 0004, 0005 ────────────────────────
  -- Insert each missing record only when no record with that exact hash exists.
  -- Idempotent: if a record already exists with the correct hash, skip it.

  IF NOT EXISTS (
    SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = HASH_0003
  ) THEN
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (HASH_0003, TS_0003);
    v_actions := v_actions + 1;
    RAISE NOTICE 'RECONCILE: Inserted missing record for 0003_phase_2c_closure (hash %).', HASH_0003;
  ELSE
    RAISE NOTICE 'RECONCILE: Record for 0003 already present — skipped.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = HASH_0004
  ) THEN
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (HASH_0004, TS_0004);
    v_actions := v_actions + 1;
    RAISE NOTICE 'RECONCILE: Inserted missing record for 0004_phase_2d_final_closure (hash %).', HASH_0004;
  ELSE
    RAISE NOTICE 'RECONCILE: Record for 0004 already present — skipped.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = HASH_0005
  ) THEN
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (HASH_0005, TS_0005);
    v_actions := v_actions + 1;
    RAISE NOTICE 'RECONCILE: Inserted missing record for 0005_rate_limit_window_cleared_event (hash %).', HASH_0005;
  ELSE
    RAISE NOTICE 'RECONCILE: Record for 0005 already present — skipped.';
  END IF;

  -- ── §5 FINAL STATE VERIFICATION ───────────────────────────────────────────
  SELECT COUNT(*) INTO v_count
    FROM drizzle.__drizzle_migrations;

  IF v_count <> 6 THEN
    RAISE EXCEPTION
      'RECONCILE ABORT: Expected 6 migration records after reconciliation, found %. '
      'Investigate before proceeding.',
      v_count;
  END IF;

  -- Verify all six hashes are present
  SELECT COUNT(*) INTO v_count
    FROM drizzle.__drizzle_migrations
   WHERE hash IN (HASH_0000, HASH_0001, HASH_0002, HASH_0003, HASH_0004, HASH_0005);

  IF v_count <> 6 THEN
    RAISE EXCEPTION
      'RECONCILE ABORT: Not all 6 expected hashes are present after reconciliation (found %). '
      'Investigate before proceeding.',
      v_count;
  END IF;

  RAISE NOTICE 'RECONCILE: Complete. % row(s) modified. Final record count: 6. All hashes verified.',
    v_actions;

END;
$$;
