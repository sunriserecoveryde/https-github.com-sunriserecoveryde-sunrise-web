#!/usr/bin/env bash
# Phase 4 v4 — Phase 3 → Phase 4 Upgrade Migration Proof
# Proves clean upgrade path from Phase 3 (0000-0006) to Phase 4 (0007).
# Uses drizzle-kit migrate for the actual Phase 4 upgrade step.
set -euo pipefail

WORKSPACE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
MIG_DIR="${WORKSPACE}/lib/db/drizzle"
DB_PACKAGE="${WORKSPACE}/lib/db"

# ── Helpers ──────────────────────────────────────────────────────────────────

PASS_COUNT=0
FAIL_COUNT=0
PROOF_DB_NAME=""
PROOF_DB_URL=""
ADMIN_URL=""

step() {
  echo
  echo "══════════════════════════════════════════════════════════"
  echo "  $1"
  echo "══════════════════════════════════════════════════════════"
}
pass() { echo "  [PASS] $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo "  [FAIL] $1"; cleanup_and_exit 1; }

psql_proof() { psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -t "$@"; }
psql_admin() { psql "${ADMIN_URL}"    -v ON_ERROR_STOP=1 -t "$@"; }

cleanup_and_exit() {
  local code=${1:-1}
  if [[ -n "${PROOF_DB_NAME}" ]]; then
    echo "[cleanup] Dropping proof database: ${PROOF_DB_NAME}"
    psql "${ADMIN_URL}" -c "DROP DATABASE IF EXISTS \"${PROOF_DB_NAME}\";" 2>/dev/null || true
    echo "[cleanup] Done."
  fi
  exit "${code}"
}
trap 'cleanup_and_exit 1' ERR INT TERM

# ── Step 01 ───────────────────────────────────────────────────────────────────

step "Step 01: Verify environment"
psql --version | head -1 || fail "psql not available"
[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL not set"
echo "  DATABASE_URL: set (host omitted)"
pass "Environment verified"

# ── Step 02 ───────────────────────────────────────────────────────────────────

step "Step 02: Create disposable proof database"
BASE_URL="${DATABASE_URL%/*}"
ADMIN_URL="${BASE_URL}/postgres"
SUFFIX="$(shuf -i 10000-99999 -n 1)"
PROOF_DB_NAME="sos_p3p4_proof_${SUFFIX}"
PROOF_DB_URL="${BASE_URL}/${PROOF_DB_NAME}"

psql "${ADMIN_URL}" -c "CREATE DATABASE \"${PROOF_DB_NAME}\";" || fail "Could not create proof DB"
echo "  Created: ${PROOF_DB_NAME}"
pass "Proof database created"

# ── Step 03 ───────────────────────────────────────────────────────────────────

step "Step 03: Verify proof DB empty"
CNT="$(psql "${PROOF_DB_URL}" -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")"
[[ "${CNT}" -eq 0 ]] || fail "Proof DB not empty (${CNT} tables)"
pass "Proof DB is empty"

# ── Step 04 ───────────────────────────────────────────────────────────────────

step "Step 04: Create drizzle tracking schema (Phase 3 baseline)"
psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 <<'ENDSQL'
CREATE SCHEMA IF NOT EXISTS drizzle;
CREATE TABLE drizzle."__drizzle_migrations" (
  id         SERIAL PRIMARY KEY,
  hash       TEXT NOT NULL,
  created_at BIGINT
);
ENDSQL
pass "drizzle.__drizzle_migrations tracking table created"

# ── Step 05 ───────────────────────────────────────────────────────────────────

step "Step 05: Apply Phase 3 migrations 0000-0006 via psql"

# Explicit file names (verified to exist in MIG_DIR)
declare -a PHASE3_FILES=(
  "0000_perpetual_rafael_vega.sql"
  "0001_authentication_authorization.sql"
  "0002_authorization_correction.sql"
  "0003_phase_2c_closure.sql"
  "0004_phase_2d_final_closure.sql"
  "0005_rate_limit_window_cleared_event.sql"
  "0006_clinical_documentation_foundation.sql"
)
# Hashes from production drizzle.__drizzle_migrations (verified)
declare -a PHASE3_HASHES=(
  "d469974922cc3fc74bbd81e20697f39d9732ae09456fc01871f6c210e4138c1c"
  "86b492875afcbdfe10daf7867f66fb31930148fe42c10fd33527c7809d34508d"
  "8b64783c95ef5bace0826342cac4e007252c7faac029de5914de88f20b83050d"
  "2ad2d880dfe87b3b331459a50b8ddf8ec3c9dd7c76bf26edd297ea887d9af3a6"
  "4584ae4def09750eb69fe431348e16b59e6a873c55a71147c7c8020db65240d4"
  "1694a931db81b17ef306132f5e916dd57f725a7f849a18d991da930eb8b00a4d"
  "83072a363b079a404b4286eb1eec2fe637796d0aa905760146cd79db6ed50c0f"
)
declare -a PHASE3_WHENS=(
  "1754007600000" "1754094000000" "1754165400000" "1754179200000"
  "1754265600000" "1754352000000" "1754438400000"
)

for i in "${!PHASE3_FILES[@]}"; do
  FNAME="${PHASE3_FILES[$i]}"
  FPATH="${MIG_DIR}/${FNAME}"
  HASH="${PHASE3_HASHES[$i]}"
  WHEN="${PHASE3_WHENS[$i]}"
  [[ -f "${FPATH}" ]] || fail "Migration file not found: ${FPATH}"
  echo "  Applying $((i+1))/7: ${FNAME}"
  psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -f "${FPATH}" > /dev/null \
    || fail "Failed to apply ${FNAME}"
  psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -c \
    "INSERT INTO drizzle.\"__drizzle_migrations\" (hash, created_at) VALUES ('${HASH}', ${WHEN});" \
    > /dev/null
  echo "  [OK] ${FNAME}"
done
pass "Phase 3 migrations 0000-0006 applied"

# ── Step 06 ───────────────────────────────────────────────────────────────────

step "Step 06: Prove exactly 7 Phase 3 journal rows"
J_P3="$(psql "${PROOF_DB_URL}" -tAc \
  "SELECT count(*) FROM drizzle.__drizzle_migrations;")"
J_P3="${J_P3// /}"
echo "  Journal rows: ${J_P3}"
[[ "${J_P3}" -eq 7 ]] || fail "Expected 7 journal rows; found ${J_P3}"
echo "PHASE 3 JOURNAL ROWS: 7"
pass "Exactly 7 Phase 3 journal rows"

# ── Step 07 ───────────────────────────────────────────────────────────────────

step "Step 07: Prove sos_appointments does NOT exist after Phase 3"
APT_P3="$(psql "${PROOF_DB_URL}" -tAc \
  "SELECT count(*) FROM information_schema.tables
   WHERE table_name='sos_appointments' AND table_schema='public';")"
APT_P3="${APT_P3// /}"
[[ "${APT_P3}" -eq 0 ]] || fail "sos_appointments already exists (Phase 3 should not have it)"
pass "sos_appointments absent at Phase 3 baseline"

# ── Steps 08-14: Seed Phase 3 data ───────────────────────────────────────────

step "Steps 08-14: Seed fictitious valid Phase 3 data"

ORG_ID="11100000-0000-4000-a000-000000000001"
FAC_ID="22200000-0000-4000-a000-000000000001"
IDR_ID="33300000-0000-4000-a000-000000000001"
USR_ID="44400000-0000-4000-a000-000000000001"
STA_ID="55500000-0000-4000-a000-000000000001"
PAT_ID="66600000-0000-4000-a000-000000000001"
EPI_ID="77700000-0000-4000-a000-000000000001"
CLN_ID="88800000-0000-4000-a000-000000000001"

echo "  Seeding organization..."
psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -c "
  INSERT INTO sos_organizations (id, name, status, slug, created_at, updated_at)
  VALUES ('${ORG_ID}', 'Proof Org', 'active', 'proof-org', NOW(), NOW());" > /dev/null

echo "  Seeding facility..."
psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -c "
  INSERT INTO sos_facilities (id, org_id, name, status, time_zone, created_at, updated_at)
  VALUES ('${FAC_ID}', '${ORG_ID}', 'Proof Facility', 'active',
          'America/New_York', NOW(), NOW());" > /dev/null

echo "  Seeding user identity ref..."
psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -c "
  INSERT INTO sos_user_identity_refs
    (id, org_id, ext_auth_ref, status, created_at, updated_at)
  VALUES ('${IDR_ID}', '${ORG_ID}', 'proof@example.com', 'active',
          NOW(), NOW());" > /dev/null

echo "  Seeding user account..."
psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -c "
  INSERT INTO sos_user_accounts
    (id, org_id, user_identity_ref_id, email, status, created_at, updated_at)
  VALUES ('${USR_ID}', '${ORG_ID}', '${IDR_ID}', 'proof@example.com',
          'active', NOW(), NOW());" > /dev/null

echo "  Seeding staff profile..."
# fk_sos_staff_profiles_org_user: (org_id, user_id) → sos_user_identity_refs(org_id, id)
psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -c "
  INSERT INTO sos_staff_profiles
    (id, org_id, user_id, display_name, professional_role, status,
     created_at, updated_at)
  VALUES ('${STA_ID}', '${ORG_ID}', '${IDR_ID}', 'Proof Clinician',
          'certified_clinician', 'active', NOW(), NOW());" > /dev/null

echo "  Seeding role assignment..."
psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -c "
  INSERT INTO sos_role_assignments
    (id, org_id, user_id, role_id, status, effective_at, created_at)
  VALUES (gen_random_uuid(), '${ORG_ID}', '${USR_ID}',
          'certified_clinician', 'active', NOW(), NOW());" > /dev/null

echo "  Seeding patient..."
psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -c "
  INSERT INTO sos_patients
    (id, org_id, facility_id, mrn, first_name, last_name, status, created_at)
  VALUES ('${PAT_ID}', '${ORG_ID}', '${FAC_ID}',
          'PROOF-001', 'ProofFirst', 'ProofLast', 'active', NOW());" > /dev/null

echo "  Seeding episode of care..."
psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -c "
  INSERT INTO sos_episodes_of_care
    (id, org_id, facility_id, patient_id, program, episode_status,
     created_at, updated_at)
  VALUES ('${EPI_ID}', '${ORG_ID}', '${FAC_ID}', '${PAT_ID}',
          'residential', 'active', NOW(), NOW());" > /dev/null

echo "  Seeding Phase 3 clinical note..."
psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -c "
  INSERT INTO sos_clinical_notes
    (id, org_id, facility_id, patient_id, episode_id, author_user_id,
     note_type, status, content, version, created_at, updated_at)
  VALUES ('${CLN_ID}', '${ORG_ID}', '${FAC_ID}', '${PAT_ID}', '${EPI_ID}',
          '${USR_ID}', 'progress_note', 'draft',
          'Phase 3 proof note content', 1, NOW(), NOW());" > /dev/null

echo "  Seeded: org=${ORG_ID} fac=${FAC_ID} user=${USR_ID}"
echo "          patient=${PAT_ID} episode=${EPI_ID} note=${CLN_ID}"
pass "Phase 3 data seeded"

# ── Step 15 ───────────────────────────────────────────────────────────────────

step "Step 15: Apply Phase 4 migration 0007 via drizzle-kit migrate"
echo "  Running: DATABASE_URL=<proof_db> pnpm --filter @workspace/db run migrate"
echo "  Expected: drizzle-kit detects 7 applied + 1 pending → applies only 0007"
(
  cd "${DB_PACKAGE}" && \
  DATABASE_URL="${PROOF_DB_URL}" \
  pnpm exec drizzle-kit migrate --config ./drizzle.config.ts 2>&1
) || fail "drizzle-kit migrate failed during Phase 4 upgrade"
pass "drizzle-kit migrate completed (Phase 4 upgrade)"

# ── Step 16 ───────────────────────────────────────────────────────────────────

step "Step 16: Prove exactly 8 Phase 4 journal rows"
J_P4="$(psql "${PROOF_DB_URL}" -tAc \
  "SELECT count(*) FROM drizzle.__drizzle_migrations;")"
J_P4="${J_P4// /}"
echo "  Journal rows: ${J_P4}"
[[ "${J_P4}" -eq 8 ]] || fail "Expected 8 journal rows; found ${J_P4}"
echo "PHASE 4 JOURNAL ROWS: 8"
pass "Exactly 8 Phase 4 journal rows"

# ── Step 17 ───────────────────────────────────────────────────────────────────

step "Step 17: Prove only migration 0007 was newly applied during upgrade"
# Hash drizzle-kit computes from the current 0007 SQL file content.
# NOTE: Production DB row 8 shows ee6c269a... because the SQL file was
# patched after initial production deployment.  The proof validates the
# PROCESS (7→8 rows, only 0007 applied), and the hash below is the one
# drizzle-kit derives from the CURRENT canonical 0007 file.
HASH_0007="f9584e3e78fb3880bed1e8fed4514759c38cf0cc9d9de73f0cf7ff078c97a135"
ROW8_HASH="$(psql "${PROOF_DB_URL}" -tAc \
  "SELECT hash FROM drizzle.__drizzle_migrations ORDER BY id DESC LIMIT 1;")"
ROW8_HASH="${ROW8_HASH// /}"
echo "  Row 8 hash (drizzle-kit computed): ${ROW8_HASH}"
echo "  Expected:                          ${HASH_0007}"
[[ "${ROW8_HASH}" == "${HASH_0007}" ]] || \
  fail "Row 8 hash mismatch (unexpected migration applied, or wrong hash)"
echo "ONLY 0007 APPLIED DURING UPGRADE: YES"
pass "Only migration 0007 applied during upgrade"

# ── Step 18 ───────────────────────────────────────────────────────────────────

step "Step 18: Prove sos_appointments exists after Phase 4"
APT_P4="$(psql "${PROOF_DB_URL}" -tAc \
  "SELECT count(*) FROM information_schema.tables
   WHERE table_name='sos_appointments' AND table_schema='public';")"
APT_P4="${APT_P4// /}"
[[ "${APT_P4}" -eq 1 ]] || fail "sos_appointments does not exist after Phase 4"
pass "sos_appointments present after Phase 4 upgrade"

# ── Step 19 ───────────────────────────────────────────────────────────────────

step "Step 19: Prove required indexes on sos_appointments"
# Actual index names from migration 0007 (verified against production)
for IDX in idx_apt_facility_time idx_apt_patient_history \
           idx_apt_patient_time idx_apt_staff_time; do
  CNT="$(psql "${PROOF_DB_URL}" -tAc \
    "SELECT count(*) FROM pg_indexes
     WHERE tablename='sos_appointments' AND indexname='${IDX}';")"
  CNT="${CNT// /}"
  echo "  [${IDX}]: ${CNT}"
  [[ "${CNT}" -ge 1 ]] || fail "Required index missing: ${IDX}"
done
pass "All required appointment indexes present"

# ── Step 20 ───────────────────────────────────────────────────────────────────

step "Step 20: Prove all required tenant-safe composite foreign keys"
FK_QUERY="$(psql "${PROOF_DB_URL}" -tAc "
SELECT tc.constraint_name,
       string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS src,
       ccu.table_name AS tgt
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
  AND tc.table_schema = ccu.table_schema
WHERE tc.table_name = 'sos_appointments'
  AND tc.constraint_type = 'FOREIGN KEY'
GROUP BY tc.constraint_name, ccu.table_name
ORDER BY tc.constraint_name;
")"

echo "  All FKs on sos_appointments:"
echo "${FK_QUERY}" | while IFS="|" read -r name src tgt; do
  echo "    constraint: ${name}  src: ${src}  tgt: ${tgt}"
done

for REQUIRED_FK in fk_apt_org_facility fk_apt_org_patient fk_apt_assigned_user fk_apt_created_by; do
  echo "${FK_QUERY}" | grep -q "${REQUIRED_FK}" || \
    fail "Required FK missing: ${REQUIRED_FK}"
  echo "  [PRESENT] ${REQUIRED_FK}"
done
pass "All 4 required tenant-safe composite FKs present"

# ── Step 21-25: Constraint verification ──────────────────────────────────────

step "Steps 21-25: Verify all five CHECK constraints on sos_appointments"
for CNAME in ck_sos_appointments_type ck_sos_appointments_status \
             ck_sos_appointments_time_order ck_sos_appointments_cancellation \
             ck_sos_appointments_version; do
  DEF="$(psql "${PROOF_DB_URL}" -tAc \
    "SELECT pg_get_constraintdef(oid) FROM pg_constraint
     WHERE conrelid='sos_appointments'::regclass AND conname='${CNAME}';")"
  [[ -n "${DEF// /}" ]] || fail "CHECK constraint missing: ${CNAME}"
  echo "  [PRESENT] ${CNAME}: ${DEF// /}"
done
pass "All 5 CHECK constraints verified"

# ── Step 26 ───────────────────────────────────────────────────────────────────

step "Step 26: Prove appointment audit event types accepted in sos_audit_outbox"
for EVT in "appointment.created" "appointment.updated" "appointment.cancelled"; do
  psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -c "
    INSERT INTO sos_audit_outbox (id, org_id, event_type, outcome, created_at)
    VALUES (gen_random_uuid(), '${ORG_ID}', '${EVT}', 'success', NOW());" \
    > /dev/null || fail "Event type rejected: ${EVT}"
  echo "  [ACCEPTED] ${EVT}"
done
pass "All 3 appointment audit event types accepted"

# ── Step 27-30: Behavior verification ────────────────────────────────────────

step "Step 27: Insert valid scheduled appointment"
APT_ID="aaaaaaaa-0000-4000-a000-000000000001"
psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -c "
  INSERT INTO sos_appointments
    (id, org_id, facility_id, patient_id, assigned_user_id, created_by_user_id,
     appointment_type, status, starts_at, ends_at, reason, version, created_at)
  VALUES ('${APT_ID}', '${ORG_ID}', '${FAC_ID}', '${PAT_ID}',
          '${USR_ID}', '${USR_ID}',
          'intake', 'scheduled',
          NOW() + INTERVAL '1 hour', NOW() + INTERVAL '2 hours',
          'proof intake session', 1, NOW());" > /dev/null
pass "Valid scheduled appointment inserted"

step "Step 28: Prove ends_at <= starts_at is rejected"
if psql "${PROOF_DB_URL}" -c "
  INSERT INTO sos_appointments
    (id, org_id, facility_id, patient_id, assigned_user_id, created_by_user_id,
     appointment_type, status, starts_at, ends_at, reason, version, created_at)
  VALUES (gen_random_uuid(), '${ORG_ID}', '${FAC_ID}', '${PAT_ID}',
          '${USR_ID}', '${USR_ID}',
          'intake', 'scheduled',
          NOW() + INTERVAL '2 hours', NOW() + INTERVAL '1 hour',
          'bad time order', 1, NOW());" 2>&1 | grep -qiE "check|constraint|violat"; then
  echo "  ends_at <= starts_at: REJECTED (constraint enforced)"
  pass "Invalid time order correctly rejected"
else
  fail "ends_at <= starts_at was not rejected by constraint"
fi

step "Step 29: Prove invalid cancellation state (no metadata) is rejected"
if psql "${PROOF_DB_URL}" -c "
  INSERT INTO sos_appointments
    (id, org_id, facility_id, patient_id, assigned_user_id, created_by_user_id,
     appointment_type, status, starts_at, ends_at, reason, version, created_at)
  VALUES (gen_random_uuid(), '${ORG_ID}', '${FAC_ID}', '${PAT_ID}',
          '${USR_ID}', '${USR_ID}',
          'intake', 'cancelled',
          NOW() + INTERVAL '1 hour', NOW() + INTERVAL '2 hours',
          'missing cancel metadata', 1, NOW());" 2>&1 | grep -qiE "check|constraint|violat"; then
  echo "  cancelled without metadata: REJECTED (constraint enforced)"
  pass "Invalid cancellation correctly rejected"
else
  fail "cancelled status without metadata was NOT rejected"
fi

step "Step 30: Prove valid cancellation state succeeds"
psql "${PROOF_DB_URL}" -v ON_ERROR_STOP=1 -c "
  INSERT INTO sos_appointments
    (id, org_id, facility_id, patient_id, assigned_user_id, created_by_user_id,
     appointment_type, status, starts_at, ends_at, reason, version,
     cancelled_by_user_id, cancelled_at, cancellation_reason, created_at)
  VALUES (gen_random_uuid(), '${ORG_ID}', '${FAC_ID}', '${PAT_ID}',
          '${USR_ID}', '${USR_ID}',
          'intake', 'cancelled',
          NOW() + INTERVAL '1 hour', NOW() + INTERVAL '2 hours',
          'proof intake session', 1,
          '${USR_ID}', NOW(), 'proof cancellation reason', NOW());" > /dev/null
pass "Valid cancellation state accepted"

# ── Steps 31-32: Preservation ─────────────────────────────────────────────────

step "Steps 31-32: Prove Phase 3 data preserved after upgrade"
declare -A CHECK_ROWS=(
  ["org"]="SELECT count(*) FROM sos_organizations WHERE id='${ORG_ID}';"
  ["fac"]="SELECT count(*) FROM sos_facilities WHERE id='${FAC_ID}';"
  ["user"]="SELECT count(*) FROM sos_user_accounts WHERE id='${USR_ID}';"
  ["patient"]="SELECT count(*) FROM sos_patients WHERE id='${PAT_ID}';"
  ["episode"]="SELECT count(*) FROM sos_episodes_of_care WHERE id='${EPI_ID}';"
  ["note"]="SELECT count(*) FROM sos_clinical_notes WHERE id='${CLN_ID}';"
)

for LABEL in org fac user patient episode note; do
  CNT="$(psql "${PROOF_DB_URL}" -tAc "${CHECK_ROWS[$LABEL]}")"
  CNT="${CNT// /}"
  echo "  ${LABEL}: ${CNT} row(s)"
  [[ "${CNT}" -eq 1 ]] || fail "Phase 3 ${LABEL} row MISSING after upgrade"
done
echo "PHASE 3 CLINICAL NOTE PRESERVED: YES"
pass "All Phase 3 seeded data fully preserved"

# ── Steps 33-35: Idempotency ─────────────────────────────────────────────────

step "Steps 33-35: Prove migration runner is idempotent"
echo "  Re-running drizzle-kit migrate (should apply 0 new migrations)..."
(
  cd "${DB_PACKAGE}" && \
  DATABASE_URL="${PROOF_DB_URL}" \
  pnpm exec drizzle-kit migrate --config ./drizzle.config.ts 2>&1
) || fail "drizzle-kit migrate idempotency run failed"

J_IDEM="$(psql "${PROOF_DB_URL}" -tAc \
  "SELECT count(*) FROM drizzle.__drizzle_migrations;")"
J_IDEM="${J_IDEM// /}"
echo "  Journal rows after idempotency run: ${J_IDEM}"
[[ "${J_IDEM}" -eq 8 ]] || fail "Journal has ${J_IDEM} rows (expected 8 — idempotency broken)"
echo "IDEMPOTENT RERUN: PASS"
pass "Migration runner is idempotent"

# ── Final summary ─────────────────────────────────────────────────────────────

step "FINAL SUMMARY"
echo ""
echo "  Proof database:                ${PROOF_DB_NAME}"
echo "  Phase 3 migrations applied:    7 (0000-0006)"
echo "  Phase 4 migration applied:     1 (0007 via drizzle-kit)"
echo ""
echo "  PHASE 3 JOURNAL ROWS:          7"
echo "  PHASE 4 JOURNAL ROWS:          8"
echo "  ONLY 0007 APPLIED DURING UPGRADE: YES"
echo "  PHASE 3 CLINICAL NOTE PRESERVED:  YES"
echo "  IDEMPOTENT RERUN:              PASS"
echo ""
echo "  Steps passed:  ${PASS_COUNT}"
echo "  EXIT:0 — Phase 3 → Phase 4 upgrade proof COMPLETE"

cleanup_and_exit 0
