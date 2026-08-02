---
name: Migration journal reconciliation
description: How the drizzle.__drizzle_migrations drift occurred and how it was fixed; forward policy for migrations
---

## Root cause
Drizzle uses `drizzle.__drizzle_migrations` (schema=drizzle, table=__drizzle_migrations per drizzle.config.ts).
During Phase 2C/2D/2E hardening, migrations 0003–0005 were applied directly via psql without running drizzle-kit migrate. Migration 0000's journal record was inserted manually with the tag name as the hash instead of the SHA-256 of the file content.

## Correct SHA-256 hashes (as of 6 migrations, verified against fresh-migration proof DB)
- 0000: d469974922cc3fc74bbd81e20697f39d9732ae09456fc01871f6c210e4138c1c
- 0001: 86b492875afcbdfe10daf7867f66fb31930148fe42c10fd33527c7809d34508d
- 0002: 8b64783c95ef5bace0826342cac4e007252c7faac029de5914de88f20b83050d
- 0003: 2ad2d880dfe87b3b331459a50b8ddf8ec3c9dd7c76bf26edd297ea887d9af3a6
- 0004: 4584ae4def09750eb69fe431348e16b59e6a873c55a71147c7c8020db65240d4
- 0005: 1694a931db81b17ef306132f5e916dd57f725a7f849a18d991da930eb8b00a4d

**Why:** Drizzle stores SHA-256 of the SQL file content in the hash column. The hash is what drizzle-kit uses to detect already-applied migrations.

## Reconciliation script
`artifacts/api-server/migrations/reconcile-post-phase-2-migration-journal.sql`
Idempotent, self-verifying, fingerprint-checked. Run on clone first, then on live DB.

## Forward policy
All schema changes must go through drizzle-kit generate + drizzle-kit migrate. Direct SQL schema changes must be accompanied by a migration file and immediate journal reconciliation. The next migration will be 0006.

## Proof databases
Created during reconciliation: `sos_migration_proof` (clean run), `sos_reconcile_clone` (clone test). Both may be dropped after branch merge.
