---
name: Phase 3 v9 closure
description: Phase 3 Clinical Documentation Foundation review package v9 — closed state, key lessons from v8→v9 corrections
---

# Phase 3 v9 Closure

## Status: CLOSED

**ZIP:** `artifacts/sunrise-os/readiness/phase-3-clinical-documentation-foundation-review-v9.zip`  
**SHA256:** `49a890aba98908dce742aeaab3dfac859aa25ffdcc2d831aa2a9f47ed01d64c4`  
**Final HEAD commit:** `6b9f380fa2269e9fa36b10d973f9d452b8544e24`  
**Evidence-only commit:** `188a4d24` (screenshots + HARs)  
**Code commit:** `4c2e3ab50c935251cb413f059d2015603afc9b67`

## Gates

- TypeScript builds: db/api/sos/pw-ts all exit=0
- API vitest: 573/573 × 4 runs (api-A/B/C/D)
- SOS vitest: 136/136 × 4 runs (sos-A/B/C/D)
- Playwright: 19/19 × 3 runs (pw-A/B/C)
- Cross-suite checks: 6/6
- Migration proof: 25/25 PASS (disposable DB `sos_migration_proof_v9`)
- Screenshots: 20
- Traces sanitized: 19/19
- HARs sanitized: 4/4
- Secret scanner: 0 CRITICAL/HIGH

## Key v8→v9 Corrections

**Migration proof table names:** The phase2-proof schema uses `sos_organizations` (not `sos_orgs`), `sos_episodes_of_care` (not `sos_episodes`), `sos_user_identity_refs` (not `sos_identities`). `sos_organizations` requires `slug` NOT NULL (added in migration 0001). `sos_user_identity_refs` has `org_id` NOT NULL (no `email`/`full_name`).

**drizzle-kit module resolution:** `node -e "require('drizzle-orm/node-postgres/migrator')"` from workspace root fails. The correct approach for migration proof is `DATABASE_URL=<dispose_url> pnpm --filter @workspace/db exec drizzle-kit migrate --config ./drizzle.phase2.config.ts` (phase2) and `pnpm --filter @workspace/db run migrate` (full). Never inline-eval drizzle from workspace root.

**Pipe + psql error swallowing:** `psql ... << SQL | tee` loses psql exit code even with pipefail. Fix: capture output to temp var and check `$?` separately.

**Evidence-only commit policy:** Screenshots and HARs modified by test runs must be committed as an evidence-only commit (may only change evidence files). This cleans the working tree before ZIP assembly.

**Why:** v8 was rejected for contaminated credentials in raw traces/HARs, stale screenshots, invalid SHA256SUMS format, and only 26 source files.
