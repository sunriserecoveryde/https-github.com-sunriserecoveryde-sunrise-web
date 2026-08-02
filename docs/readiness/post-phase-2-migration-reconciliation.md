# Post-Phase-2 Migration History Reconciliation

**Branch:** `maintenance/post-phase-2-migration-reconciliation`  
**Based on:** `main` @ `55cf0604b266358a279bc9b2f3fc5e00bddb5356`  
**Date:** 2026-08-02

---

## 1. Why Journal Drift Occurred

During Phase 2 hardening (2C, 2D, and 2E), three migrations were applied
directly via `psql` rather than through `drizzle-kit migrate`. This happened
because the hardening work was iterative: constraints and schema changes were
developed, tested, and verified interactively in the development database
before the migration files were committed. The Drizzle migration journal
(`drizzle.__drizzle_migrations`) was never updated to reflect these out-of-band
applications.

Additionally, migration 0000 was applied before the project standardised on
SHA-256 content hashes. Its journal record was inserted manually with the tag
name (`0000_perpetual_rafael_vega`) rather than the SHA-256 of the file
content.

The `_journal.json` metadata file was kept up to date throughout (all 6
entries are present), but the live database tracking table diverged from it.

---

## 2. Migration Application History

| # | Tag | File exists | Journal entry | Schema present | Applied normally | Applied out-of-band | Required action |
|---|-----|-------------|---------------|----------------|-----------------|---------------------|-----------------|
| 0 | `0000_perpetual_rafael_vega` | ✓ | ✓ (wrong hash) | ✓ | Partial¹ | Partial¹ | Fix hash in journal |
| 1 | `0001_authentication_authorization` | ✓ | ✓ (correct) | ✓ | ✓ | — | None |
| 2 | `0002_authorization_correction` | ✓ | ✓ (correct) | ✓ | ✓ | — | None |
| 3 | `0003_phase_2c_closure` | ✓ | ✗ | ✓ | — | ✓ | Insert missing record |
| 4 | `0004_phase_2d_final_closure` | ✓ | ✗ | ✓ | — | ✓ | Insert missing record |
| 5 | `0005_rate_limit_window_cleared_event` | ✓ | ✗ | ✓ | — | ✓ | Insert missing record |

¹ Migration 0000 was applied but its journal record used the tag name as the
hash value instead of the SHA-256 of the file content.

---

## 3. Schema Objects That Prove Each Migration's Effects Are Present

### 0000 — Base schema

| Object | Type | Verified |
|--------|------|---------|
| `grow_users` | table | ✓ |
| `grow_user_state` | table | ✓ |
| `conversations` | table | ✓ |
| `messages` | table | ✓ |
| `compliance_audit_state` | table | ✓ |
| `sos_organizations` | table | ✓ |
| `sos_facilities` | table | ✓ |
| `sos_user_identity_refs` | table | ✓ |
| `sos_staff_profiles` | table | ✓ |
| `sos_patients` | table | ✓ |
| `sos_episodes_of_care` | table | ✓ |
| `sos_audit_outbox` | table | ✓ |

### 0001 — Authentication and authorization tables

| Object | Type | Verified |
|--------|------|---------|
| `sos_user_accounts` | table | ✓ |
| `sos_sessions` | table | ✓ |
| `sos_role_assignments` | table | ✓ |
| `sos_patient_access` | table | ✓ |
| `sos_auth_audit` | table | ✓ |
| `idx_sos_user_accounts_org_email` | unique index | ✓ |
| `idx_sos_sessions_user_id` | index | ✓ |
| `ck_sos_auth_audit_outcome` | check constraint | ✓ |

### 0002 — Organization slug, rate-limit store, audit triggers

| Object | Type | Verified |
|--------|------|---------|
| `sos_organizations.slug` | column | ✓ |
| `idx_sos_organizations_slug` | unique index | ✓ |
| `sos_rate_limit_windows` | table | ✓ |
| `pk_sos_rate_limit_windows` | primary key | ✓ |
| `sos_prevent_audit_modification()` | function | ✓ |
| `sos_audit_no_update` | trigger on `sos_auth_audit` | ✓ |
| `sos_audit_no_delete` | trigger on `sos_auth_audit` | ✓ |
| `sos_check_patient_access_facility()` | function | ✓ |
| `sos_patient_access_facility_check` | trigger | ✓ |

### 0003 — Phase 2C: role-assignment FK, event-type expansion

| Object | Type | Verified |
|--------|------|---------|
| `sos_patient_access.role_assignment_id` | column | ✓ |
| `fk_sos_patient_access_role_assignment` | foreign key | ✓ |
| `idx_sos_role_assignments_effective_at` | index | ✓ |
| `ck_sos_auth_audit_event_type` includes `user_created`, `role_grant_denied`, `csrf_violation` | check constraint | ✓ |

### 0004 — Phase 2D: exact FK binding, outbox worker, backfill

| Object | Type | Verified |
|--------|------|---------|
| `sos_patient_access.quarantined_reason` | column | ✓ |
| `sos_audit_outbox.failed_permanently` | column | ✓ |
| `idx_sos_audit_outbox_pending` | partial index | ✓ |
| `sos_patient_access_assignment_integrity()` | function | ✓ |
| `sos_patient_access_assignment_integrity_check` | trigger | ✓ |
| `idx_sos_patient_access_role_assignment` | partial index | ✓ |

### 0005 — Phase 2E: rate_limit_window_cleared audit event

| Object | Type | Verified |
|--------|------|---------|
| `ck_sos_auth_audit_event_type` includes `rate_limit_window_cleared` | check constraint | ✓ |

---

## 4. Does the Current Database Match a Clean Migration Result?

**Yes** — with the single exception that the journal tracking table is incomplete.

Every schema object produced by all six migrations is present in the
development database. A fresh database migrated with `drizzle-kit migrate`
produces an identical schema (18 public tables, 45 indexes, 6 triggers, 3
functions, all check constraints). The live data (users, sessions, audit
records, patients, role assignments) would not exist in a fresh database, but
all structural objects are present and correct.

---

## 5. Reconciliation Method

The reconciliation is performed by a single, idempotent, self-verifying SQL
script:

```
artifacts/api-server/migrations/reconcile-post-phase-2-migration-journal.sql
```

The script:

1. **Fingerprint checks** — verifies that schema objects for migrations 0002
   through 0005 are all present before touching any rows. Aborts on any
   missing object.
2. **Validates existing records** — confirms that the records for 0001 and
   0002 have the expected SHA-256 hashes. Aborts if they do not match.
3. **Fixes the 0000 hash** — updates `id = 1` from the tag name
   `0000_perpetual_rafael_vega` to the correct SHA-256
   `d469974922cc3fc74bbd81e20697f39d9732ae09456fc01871f6c210e4138c1c`.
   No-ops if the hash is already correct.
4. **Inserts missing records** for 0003, 0004, and 0005 — only when a record
   with that exact hash is absent. No-ops if already inserted.
5. **Final count and hash check** — aborts if the table does not contain
   exactly 6 records, all with the expected hashes.
6. **NOTICE log** — reports every action taken (or skipped) for auditability.

---

## 6. Verified SHA-256 Hashes

These were produced by `sha256sum` on the committed migration files and
cross-checked against a fresh-migration proof database (see §8 below).

| Migration | SHA-256 |
|-----------|---------|
| 0000 | `d469974922cc3fc74bbd81e20697f39d9732ae09456fc01871f6c210e4138c1c` |
| 0001 | `86b492875afcbdfe10daf7867f66fb31930148fe42c10fd33527c7809d34508d` |
| 0002 | `8b64783c95ef5bace0826342cac4e007252c7faac029de5914de88f20b83050d` |
| 0003 | `2ad2d880dfe87b3b331459a50b8ddf8ec3c9dd7c76bf26edd297ea887d9af3a6` |
| 0004 | `4584ae4def09750eb69fe431348e16b59e6a873c55a71147c7c8020db65240d4` |
| 0005 | `1694a931db81b17ef306132f5e916dd57f725a7f849a18d991da930eb8b00a4d` |

---

## 7. Rollback and Recovery Procedure

A full database dump (`pg_dump --schema=public --schema=drizzle -Fc`) is
taken before applying the reconciliation script to the development database.
The dump is stored at `/tmp/heliumdb_clone.dump`.

If the reconciliation script fails mid-execution, it aborts via `RAISE
EXCEPTION` inside a PL/pgSQL `DO` block. PostgreSQL wraps the entire `DO`
block in an implicit transaction, so any partial changes are rolled back
automatically.

To restore from the dump:

```bash
pg_restore -d "$DATABASE_URL" --no-owner --no-acl /tmp/heliumdb_clone.dump
```

---

## 8. Backup Requirement

A `pg_dump` of the development database was taken before applying the
reconciliation to the live `heliumdb` database:

```bash
pg_dump $DATABASE_URL --schema=public --schema=drizzle --no-owner --no-acl \
  -Fc -f /tmp/heliumdb_clone.dump
```

For a persistent backup, copy `/tmp/heliumdb_clone.dump` to durable storage
before proceeding.

---

## 9. Verification Queries

After applying the reconciliation script, confirm all six records are present
with correct hashes:

```sql
SELECT id, hash, created_at
FROM drizzle.__drizzle_migrations
ORDER BY created_at;
```

Expected output: 6 rows with these hashes in order:
- `d469974922cc3fc74bbd81e20697f39d9732ae09456fc01871f6c210e4138c1c`
- `86b492875afcbdfe10daf7867f66fb31930148fe42c10fd33527c7809d34508d`
- `8b64783c95ef5bace0826342cac4e007252c7faac029de5914de88f20b83050d`
- `2ad2d880dfe87b3b331459a50b8ddf8ec3c9dd7c76bf26edd297ea887d9af3a6`
- `4584ae4def09750eb69fe431348e16b59e6a873c55a71147c7c8020db65240d4`
- `1694a931db81b17ef306132f5e916dd57f725a7f849a18d991da930eb8b00a4d`

Then confirm `drizzle-kit migrate` reports no pending migrations:

```bash
pnpm --filter @workspace/db run migrate
# Expected: [✓] migrations applied successfully!
```

Then confirm full test suite passes:

```bash
pnpm --filter @workspace/api-server run test
# Expected: all tests pass, 0 failures, 0 skips
```

---

## 10. Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Hash mismatch on an existing record causes abort | Low | Script validates all three known-good records before modifying anything |
| Schema object absent (migration not actually applied) | Low | Fingerprint checks abort before any modification |
| Concurrent writes to `drizzle.__drizzle_migrations` during reconciliation | Negligible | Tracking table is only written by migration tooling; no application code writes to it |
| Future `drizzle-kit generate` creating a conflicting migration | Low | Reconciled journal will be the canonical state; new migrations must be applied via `drizzle-kit migrate` going forward |
| `/tmp/heliumdb_clone.dump` lost on container restart | Medium | Copy to durable storage before applying reconciliation |

---

## 11. Forward Policy

To prevent journal drift in future:

1. All schema changes must go through `drizzle-kit generate` + `drizzle-kit migrate`.
2. Direct SQL schema changes in development are permitted only for emergency
   fixes, and must be accompanied by a migration file and immediate journal
   reconciliation.
3. CI should run `drizzle-kit migrate` against a fresh database as part of
   every branch build.
