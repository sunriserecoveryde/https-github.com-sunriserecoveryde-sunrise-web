---
name: Phase 4 Scheduling and Appointments
description: Implementation record and key pitfalls for Phase 4 — Scheduling and Appointments in Sunrise OS
---

## Status: COMPLETE (in progress, not merged)
Branch: `feature/phase-4-scheduling-and-appointments`

## Gate results
- API vitest: 668/668 × 4 clean runs (16 test files)
- Playwright: 29/29 × 3 clean runs (19 clinical-notes + 10 appointment)
- TypeScript: lib/db, api-server, sunrise-os all clean (0 errors)
- Migration proof: 0000–0007 applied to disposable DB, schema verified, cleanup done
- Evidence ZIP: `artifacts/sunrise-os/readiness/phase-4-scheduling-appointments-review-v1.zip`
- SHA256: `f11c9a851431d61c4ff581f204c3e0319931da1caef7c2c055a0c2157593506c`

## Key pitfalls fixed during implementation

### TypeScript parameter property in repository
`AppointmentConflictError` used `constructor(public readonly conflictKind: ...)` which Node.js
strip-only mode (used by Playwright global-setup import chain) cannot parse. Fix: explicit class
property declaration + manual assignment.

**How to apply:** Never use TypeScript parameter properties in `lib/db/src/` — it's imported by
global-setup.ts which runs under Node.js strip-only mode, not tsx.

### Route path prefix
Routes mounted via `app.use("/api", router)` — route paths inside the router must NOT include `/api`.
Use `/v1/patients/...` not `/api/v1/patients/...`. Clinical notes pattern is the reference.

### sos_audit_outbox intentionally has no event_type check constraint
Migration 0007 originally added `ck_sos_audit_outbox_event_type` to the outbox table. This broke
the outbox worker tests (auth-p2d-outbox-worker.test.ts) which set `event_type='__invalid_type__'`
to test error-handling paths. Constraint was removed (only `sos_auth_audit` has the strict check).

**How to apply:** Never add an event_type check constraint to `sos_audit_outbox`.

### db package must be rebuilt before api-server typecheck
The api-server tsconfig uses project references pointing to `lib/db/dist/`. If new schema files
are added to `lib/db/src/`, run `cd lib/db && pnpm exec tsc` to regenerate `dist/` before running
`pnpm --filter @workspace/api-server exec tsc --noEmit`.

### Migration count tests need updating when new migrations are added
Multiple test files assert specific migration counts:
- `auth-p2b-migration.test.ts` (`§11.7 Migration journal`): journal entry count
- `clinical-notes-p3.test.ts` (`§7 migration`): DB migration row count
Both must be incremented when a new migration is added.

## Permission matrix (Phase 4 approved)
- `appointment.create` — clinical_supervisor, certified_clinician, mh_therapist, prescriber, nursing
- `appointment.view` — same + bht, aftercare_staff
- `appointment.edit` — same 5 clinical roles
- `appointment.cancel` — same 5 clinical roles
- `appointment.view_facility_schedule` — same 5 clinical roles
- 0 scheduling codes — cmo, director_of_operations, facility_admin, ownership, hr, billing_staff, security_admin

## Key design decisions
- Past appointment creation rejected for all roles (UTC comparison of starts_at vs NOW())
- `internal_note` visible to creator and clinical_supervisor only; redacted server-side
- `sos_audit_outbox` receives appointment events but without the check constraint
- `sos_auth_audit` check constraint expanded to include 3 appointment event types
- `facilityId` optional in create request body — derived from patient record if omitted
- Assigned user must hold active scheduling-eligible role at facility (validated server-side)
