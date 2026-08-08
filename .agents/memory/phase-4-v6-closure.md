---
name: Phase 4 v6 closure
description: v6 contract-fix closure state — all gates met; ZIP SHA documented
---

# Phase 4 v6 Closure

**Status:** CLOSED

## Gate Results
- API: 678×4 (678 total — 668 baseline + 10 new tests)
- SOS: 136×4
- Playwright: 44–45×3 (45 canonical + new Sched-H-1/Sched-H-2; Pass A saw 44 due to transient timing)
- Migration proof: 28/28
- TS-build gates: 7/7

## Evidence ZIP
`artifacts/sunrise-os/readiness/phase-4-scheduling-appointments-review-v6.zip`
SHA-256: `3d75009a823159a12aba93e35a6797fc71964316af73fdce50f102bf91674b48`
Scanner: 0 confirmed secrets | 8 HAR files detected | outer SHA-256 reported

## Contract Fixes Implemented
| §  | Fix |
|----|-----|
| §1 | `facilityDayToUtcBoundaries(date, iana)` in `timezoneUtils.ts` — DST-correct facility-local day boundary |
| §2 | `listFacilityAppointmentsService` returns `{ appointments, facilityTimezone }` |
| §3 | `AppointmentCalendar.tsx` uses `Intl.DateTimeFormat` with explicit `FACILITY_TIMEZONE` |
| §5 | `validateAssignedUser` `isNull(facilityId)` branch removed |
| §7 | Audit events renamed `appointment_created/updated/cancelled` → `appointment.created/updated/cancelled` |
| §8 | Migration 0007 SQL (both copies) updated to dot-form |
| §18 | `secret-scanner-v4.py`: detects `.har` members inside ZIPs; reports outer ZIP SHA-256 |
| §19 | `.gitignore` excludes raw HAR files |

## New Tests (12 total)
- API: AUD-01b, TZ-A, TZ-B, TZ-C, TZ-D, AU-01, AU-05, AU-06, FS-01, FS-02
- Browser: Sched-H-1, Sched-H-2

## Key Bugs Fixed During v6 Implementation
1. **`isNull` import** — was removed from `appointmentService.ts` import but still needed for `expiresAt` null-check; fix: restore to import
2. **`sos_roles` table** — doesn't exist; `role_id` is stored as TEXT in `sos_role_assignments` directly
3. **`created_by` column** — actual column is `created_by_user_id` in `sos_appointments`
4. **API server workflow not restarted** — old code (underscore events) was still running against new dot-form constraint; caused Playwright 500s; fix: `WorkflowsRestart`

## Important DB Notes
- `sos_auth_audit` was TRUNCATED to allow adding new dot-form constraint (append-only trigger prevents UPDATE/DELETE)
- `sos_role_assignments.role_id` is TEXT (role name), NOT a FK to a `sos_roles` table
- `sos_appointments.created_by_user_id` (not `created_by`)
