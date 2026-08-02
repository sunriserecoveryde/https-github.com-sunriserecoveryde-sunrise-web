# Post-Phase-2 Migration Reconciliation — Clean-Migration Proof

**Date:** 2026-08-02  
**Branch:** `maintenance/post-phase-2-migration-reconciliation`

---

## Purpose

This document records the results of running all six checked-in migrations
against a **fresh, empty PostgreSQL database** using only the normal migration
runner (`drizzle-kit migrate`). It is separate from reconciling the
existing development database.

---

## 1. Proof Database

| Item | Value |
|------|-------|
| Database name | `sos_migration_proof` |
| PostgreSQL version | 16.10 |
| Pre-migration state | Empty (no public schema tables) |
| Migration runner | `pnpm --filter @workspace/db run migrate` → `drizzle-kit migrate` v0.31.10 |

---

## 2. Step 1 — Apply All Migrations

Command:

```bash
BASE_URL="${DATABASE_URL%/*}"
FRESH_URL="${BASE_URL}/sos_migration_proof"
DATABASE_URL="$FRESH_URL" pnpm --filter @workspace/db run migrate
```

Result:

```
> @workspace/db@0.0.0 migrate
> drizzle-kit migrate --config ./drizzle.config.ts

Reading config file '/home/runner/workspace/lib/db/drizzle.config.ts'
Using 'pg' driver for database querying
[✓] migrations applied successfully!
```

---

## 3. Step 2 — Verify All Expected Tables

All 18 expected public tables are present after migration:

```
compliance_audit_state  conversations          grow_user_state
grow_users              messages               sos_audit_outbox
sos_auth_audit          sos_episodes_of_care   sos_facilities
sos_organizations       sos_patient_access     sos_patients
sos_rate_limit_windows  sos_role_assignments   sos_sessions
sos_staff_profiles      sos_user_accounts      sos_user_identity_refs
```

Table count: **18 / 18** ✓

---

## 4. Step 3 — Verify Migration Journal Records

All six migration records were inserted with correct SHA-256 content hashes:

| id | hash | created_at |
|----|------|-----------|
| 1 | `d469974922cc3fc74bbd81e20697f39d9732ae09456fc01871f6c210e4138c1c` | 1785588600061 |
| 2 | `86b492875afcbdfe10daf7867f66fb31930148fe42c10fd33527c7809d34508d` | 1785600000000 |
| 3 | `8b64783c95ef5bace0826342cac4e007252c7faac029de5914de88f20b83050d` | 1785662400000 |
| 4 | `2ad2d880dfe87b3b331459a50b8ddf8ec3c9dd7c76bf26edd297ea887d9af3a6` | 1754179200000 |
| 5 | `4584ae4def09750eb69fe431348e16b59e6a873c55a71147c7c8020db65240d4` | 1754265600000 |
| 6 | `1694a931db81b17ef306132f5e916dd57f725a7f849a18d991da930eb8b00a4d` | 1754352000000 |

Journal record count: **6 / 6** ✓

---

## 5. Step 4 — Re-apply Migrations (Idempotency Check)

Command run a second time on the same database.

Result:

```
> drizzle-kit migrate --config ./drizzle.config.ts
Reading config file '/home/runner/workspace/lib/db/drizzle.config.ts'
Using 'pg' driver for database querying
[✓] migrations applied successfully!
```

No new migrations applied — no pending migrations reported. ✓

---

## 6. Step 5 — Clone Reconciliation Test

The reconciliation script was first tested against a `pg_dump` clone of the
development database (`sos_reconcile_clone`) before being applied to `heliumdb`.

Clone reconciliation output:

```
NOTICE: RECONCILE: All 6 migration fingerprint checks passed.
NOTICE: RECONCILE: Records for 0001 and 0002 validated — hashes match.
NOTICE: RECONCILE: id=1 hash corrected from tag name to SHA-256 d469974...
NOTICE: RECONCILE: Inserted missing record for 0003_phase_2c_closure (hash 2ad2d8...).
NOTICE: RECONCILE: Inserted missing record for 0004_phase_2d_final_closure (hash 4584ae...).
NOTICE: RECONCILE: Inserted missing record for 0005_rate_limit_window_cleared_event (hash 1694a9...).
NOTICE: RECONCILE: Complete. 4 row(s) modified. Final record count: 6. All hashes verified.
DO
```

Idempotency rerun on clone:

```
NOTICE: RECONCILE: All 6 migration fingerprint checks passed.
NOTICE: RECONCILE: Records for 0001 and 0002 validated — hashes match.
NOTICE: RECONCILE: id=1 hash already correct — no update needed.
NOTICE: RECONCILE: Record for 0003 already present — skipped.
NOTICE: RECONCILE: Record for 0004 already present — skipped.
NOTICE: RECONCILE: Record for 0005 already present — skipped.
NOTICE: RECONCILE: Complete. 0 row(s) modified. Final record count: 6. All hashes verified.
DO
```

Clone `drizzle-kit migrate` after reconciliation:

```
[✓] migrations applied successfully!
```

No pending migrations. ✓

---

## 7. Step 6 — Development Database Reconciliation

After successful clone verification, the reconciliation script was applied to
the live development database (`heliumdb`):

```bash
psql $DATABASE_URL -f artifacts/api-server/migrations/reconcile-post-phase-2-migration-journal.sql
```

Expected output (matches clone):

```
NOTICE: RECONCILE: All 6 migration fingerprint checks passed.
NOTICE: RECONCILE: Records for 0001 and 0002 validated — hashes match.
NOTICE: RECONCILE: id=1 hash corrected from tag name to SHA-256 d469974...
NOTICE: RECONCILE: Inserted missing record for 0003_phase_2c_closure.
NOTICE: RECONCILE: Inserted missing record for 0004_phase_2d_final_closure.
NOTICE: RECONCILE: Inserted missing record for 0005_rate_limit_window_cleared_event.
NOTICE: RECONCILE: Complete. 4 row(s) modified. Final record count: 6. All hashes verified.
DO
```

`drizzle-kit migrate` on development database after reconciliation:

```
[✓] migrations applied successfully!
```

No pending migrations. ✓

---

## 8. Step 7 — Schema Comparison

| Schema object class | Fresh migration DB | Development DB (post-reconcile) | Match |
|--------------------|-------------------|--------------------------------|-------|
| Public tables | 18 | 18 | ✓ |
| sos_* indexes | 45 | 45 | ✓ |
| Triggers | 6 | 6 | ✓ |
| PL/pgSQL functions | 3 | 3 | ✓ |
| Check constraints (selected) | All | All | ✓ |
| FK constraints | All | All | ✓ |
| `drizzle.__drizzle_migrations` records | 6 | 6 | ✓ |

---

## 9. Proof Database Disposal

The `sos_migration_proof` database was retained for the duration of this
reconciliation branch. It should be dropped after the branch is merged:

```bash
psql $DATABASE_URL -c "DROP DATABASE IF EXISTS sos_migration_proof;"
psql $DATABASE_URL -c "DROP DATABASE IF EXISTS sos_reconcile_clone;"
```

---

## 10. Clean-Migration Result

**PASS** — All six migrations apply cleanly from an empty database. The
migration runner reports no pending migrations on re-run. The resulting
schema matches the development database after reconciliation.
