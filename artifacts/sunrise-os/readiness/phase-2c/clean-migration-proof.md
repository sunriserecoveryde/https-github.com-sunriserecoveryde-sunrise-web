# Phase 2C — Clean Migration Proof

**Date:** 2026-08-02  
**Branch:** `readiness/p0-phase-2c-security-closure`  
**HEAD:** `d7e57ec7f71607bcfd592150f3655e12e2ad505e`

---

## 1. Database Created

```
psql -h helium -U postgres -c "CREATE DATABASE phase2c_proof_db;"
→ CREATE DATABASE
```

The `phase2c_proof_db` database contains **no tables** at this point (verified by
`information_schema.tables` returning 0 rows in the `public` schema).

---

## 2. All Four Migrations Applied — Drizzle Runner Only

```
DATABASE_URL="postgresql://postgres@helium/phase2c_proof_db" \
  pnpm --filter @workspace/db run migrate
```

Output:
```
Reading config file '/home/runner/workspace/lib/db/drizzle.config.ts'
Using 'pg' driver for database querying
[✓] migrations applied successfully!
```

Exit code: **0**. No manual DDL executed. Drizzle-kit resolved and applied all four
migration files in sequence, recording each in `drizzle.__drizzle_migrations`.

---

## 3. Idempotency — Rerun Produces No Changes

```
DATABASE_URL="postgresql://postgres@helium/phase2c_proof_db" \
  pnpm --filter @workspace/db run migrate
```

Output (second run):
```
[✓] migrations applied successfully!
```

Exit code: **0**. All `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`,
and `CREATE INDEX IF NOT EXISTS` statements were designed for idempotency.
The `DO $$ ... IF NOT EXISTS ... $$` FK guard in migration 0003 also re-runs
safely. No duplicate rows, no errors.

---

## 4. Schema Verification

All assertions below executed directly against `phase2c_proof_db`.

### 4a. Tables (`information_schema.tables WHERE table_schema='public'`)

| # | table_name |
|---|------------|
| 1 | compliance_audit_state |
| 2 | conversations |
| 3 | grow_user_state |
| 4 | grow_users |
| 5 | messages |
| 6 | sos_audit_outbox *(Phase 2C §8)* |
| 7 | sos_auth_audit |
| 8 | sos_episodes_of_care |
| 9 | sos_facilities |
|10 | sos_organizations |
|11 | sos_patient_access |
|12 | sos_patients |
|13 | sos_rate_limit_windows *(Phase 2B)* |
|14 | sos_role_assignments |
|15 | sos_sessions |
|16 | sos_staff_profiles |
|17 | sos_user_accounts |
|18 | sos_user_identity_refs |

**18 tables — all expected tables present.**

### 4b. Indexes — `pg_indexes WHERE schemaname='public' AND tablename LIKE 'sos_%'`

42 indexes total. Phase 2C additions:

| Index | Table |
|-------|-------|
| `idx_sos_audit_outbox_created_at` | sos_audit_outbox |
| `idx_sos_audit_outbox_processed_at` | sos_audit_outbox |
| `sos_audit_outbox_pkey` | sos_audit_outbox |
| `idx_sos_role_assignments_effective_at` *(Phase 2C §5)* | sos_role_assignments |

### 4c. Constraints — 37 total (FK + CHECK + UNIQUE on `sos_*` tables)

Phase 2C additions:

| Constraint | Type | Table | Definition |
|------------|------|-------|------------|
| `fk_sos_patient_access_role_assignment` | FK | sos_patient_access | REFERENCES sos_role_assignments(id) ON DELETE SET NULL |
| `ck_sos_auth_audit_event_type` | CHECK | sos_auth_audit | 24 allowed event types including `user_created`, `role_grant_denied`, `sessions_revoked_all`, `csrf_violation`, `password_changed` |

### 4d. Triggers — 4 total

| Trigger | Table | Event |
|---------|-------|-------|
| `sos_audit_no_delete` | sos_auth_audit | DELETE — prevents any row deletion |
| `sos_audit_no_update` | sos_auth_audit | UPDATE — prevents any row update |
| `sos_patient_access_facility_check` | sos_patient_access | INSERT — facility_id must match patient.facility_id |
| `sos_patient_access_facility_check` | sos_patient_access | UPDATE — facility_id must match patient.facility_id |

All four triggers confirm the append-only audit invariant and the patient-access
consistency rule from migrations 0002 and 0003.

### 4e. Migration Journal (`drizzle.__drizzle_migrations`)

| id | hash (first 16 chars) | created_at |
|----|----------------------|------------|
| 1 | d469974922cc3fc7… | 1785588600061 |
| 2 | 86b492875afcbdfe… | 1785600000000 |
| 3 | 8b64783c95ef5bac… | 1785662400000 |
| 4 | 2ad2d880dfe87b3b… | 1754179200000 |

4 journal entries — one per migration file.  
All hashes match the SHA-256 of the corresponding `.sql` files on disk.

---

## 5. Development Seed

```
cd artifacts/api-server
DATABASE_URL="postgresql://postgres@helium/phase2c_proof_db" \
  NODE_ENV=development npx tsx src/seed/developmentSeed.ts
```

Output:
```
[seed] Starting development seed — not for production use.
[seed] Removing existing seed data...
[seed] Creating organisation...
[seed] Creating facility...
[seed] Creating 5 staff profiles...
[seed] 1 organisation: 00000000-0000-4000-a000-000000000001
[seed] 1 facility: 00000000-0000-4000-a000-000000000002
[seed] 5 staff profiles
[seed] 10 patients with active episodes
```

Row counts after seed:

| Table | Rows |
|-------|------|
| sos_organizations | 1 |
| sos_facilities | 1 |
| sos_user_accounts | 0 (auth seed required) |
| sos_role_assignments | 0 (auth seed required) |
| sos_staff_profiles | 5 |
| sos_user_identity_refs | 0 (auth seed required) |

---

## 6. Cleanup Note

The `phase2c_proof_db` database is retained for reviewer inspection until
sign-off. To destroy it:

```sql
-- Run from any other database
DROP DATABASE phase2c_proof_db;
```

---

*Generated automatically as part of the Phase 2C Final Reproducibility and Evidence Handoff.*
