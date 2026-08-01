---
name: Phase 1A Hardening
description: Hardening items applied on top of the Phase 1A persistence foundation — migrations, DB constraints, auth boundary, health endpoints, browser privacy.
---

## What was hardened

| Area | Implementation |
|---|---|
| Migrations | `drizzle-kit generate` → `lib/db/drizzle/0000_perpetual_rafael_vega.sql`; tracked in `drizzle.__drizzle_migrations`. Composite FKs require index-before-FK ordering (drizzle-kit migrate may fail ordering; apply via psql if needed). |
| Date columns | `date_of_birth`, `admission_date`, `discharge_date` changed from `text` to PostgreSQL `date` type |
| CHECK constraints | status enums on all 6 SOS tables; date-order constraint (`ck_sos_episodes_date_order`) |
| Composite FKs | `fk_sos_patients_org_facility`, `fk_sos_episodes_org_patient`, `fk_sos_episodes_org_facility`, `fk_sos_staff_profiles_org_user` — require composite unique indexes on referenced table first |
| Data mode | `parseDataMode(raw)` in `artifacts/sunrise-os/src/lib/dataMode.ts`; exports `DATA_MODE_ERROR`; only "demo"|"production" valid; PatientList + PatientDetail block on error |
| Auth boundary | `requireIdentity` middleware in `artifacts/api-server/src/middlewares/requireIdentity.ts`; returns 401 when `req.devIdentity` absent; `devIdentityMiddleware` only registered when `NODE_ENV !== 'production'` |
| Health routes | `/health/live` (always 200) and `/health/ready` (200 with DB check, 503 when unavailable); mounted before `requireIdentity` in `app.ts` |
| Browser privacy | `useSidebarPrefs` v2 strips `displayName`/`program` in production mode; key bump v1→v2; UA Drug Testing localStorage conditional on `DATA_MODE === 'demo'` |

## Test count
162 total (54 DB + 108 sunrise-os) — all passing as of this hardening commit.

## Review package
`artifacts/sunrise-os/readiness/phase-1a-hardening-review.zip`
SHA-256: `ade475c9f6decaa46ea30d221540cea4ca5738b09379bda01ef129e1783dc11b`

## Gotchas
- Composite FK migration ordering: unique index on (org_id, id) must be created BEFORE the composite FK that references it. `drizzle-kit migrate` may fail on ordering; apply via psql in 2 passes (CREATE INDEX then ALTER TABLE ADD CONSTRAINT).
- `drizzle-kit push` was NOT used in hardening — only `generate` + `migrate`.
- `pool` is exported from `@workspace/db` (re-exported via `lib/db/src/index.ts`) — needed by health.ts.
