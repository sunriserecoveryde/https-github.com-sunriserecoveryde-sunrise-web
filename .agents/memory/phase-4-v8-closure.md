---
name: Phase 4 v8 closure
description: Final closure record for Phase 4 Scheduling & Appointments review package v8 — role matrix corrected, all gates met, ZIP committed
---

## Status: CLOSED

Branch: `feature/phase-4-scheduling-and-appointments`  
Tested Commit: `ee1150fd80f8042f4497215628e60e7db5951a85`  
Evidence Commit: `cc2d5176654c40e74f6cf83a21d68b8c48d1a8bc`  
ZIP SHA-256: `6be5feb37ad1e546c8ae318fe0d7297b53cdc2a2205b8e22776f8c22b56f7023`  
ZIP path: `artifacts/sunrise-os/readiness/phase-4-scheduling-appointments-review-v8.zip`

## Gate results
- API vitest: **679/679 × 4 clean runs**
- SOS vitest: **136/136 × 4 clean runs**
- Playwright (P3+P4): **48/48 × 3 clean runs** (19 Phase 3 + 29 Phase 4)
- TS gates: **7/7 pass**
- Migration proof: PASS — fresh disposable DB, 7→8 journal rows, 0007 hash `f85f4254bc63e9f15dc7f5da1a74425089032c0ca92e2689ec00e8716a17a901`
- SHA256SUMS: **199/199 OK, 0 failed** (meta.env excluded from both ZIP and SUMS)
- Secret scanner (ZIP): **902 files, 48 Trace ZIPs, 8 HARs, 0 confirmed secrets**
- Isolation scenarios: **8/8** (01-rate-limiter, 02-apts-then-rl, 03-rl-then-apts, 04-cn-then-apts, 05-apts-then-cn, 06-outbox-then-apts, 07-apts-then-outbox, 08-pw-then-rl)

## Key changes in v8 (vs v7)

### Role matrix fix (v8 blocker)
1. Removed `appointment.view_facility_schedule` from `aftercare_staff` in `permissionPolicy.ts`
2. Updated P4EQ-21 in `permission-contract-p4-exact.test.ts` → expects exactly 1 scheduling code (`appointment.view`)
3. Rewrote SF-01 in `appointments-p4.test.ts` — uses `supervisorAgent` (clinical_supervisor, facilityWide=true); tests cross-facility schedule filtering instead of per-row patient-access filter (since ALL roles with `appointment.view_facility_schedule` are facilityWide=true)

### Evidence structure improvements
- Playwright suite now runs BOTH specs: `clinical-notes-p3-browser.spec.ts` + `appointments-p4-browser.spec.ts` (48 total)
- Isolation logs use exact names `isolation-01-...` through `isolation-08-...`
- Migration proof hash for 0007 corrected: `f85f4254...` (was `f9584e3e...` in v7 script)
- SHA256SUMS now excludes `meta.env` explicitly — clean 199/199 verification
- Unsanitized trace ZIPs excluded from staging dir (only `evidence/traces/sanitized/` included)
- Sanitizer/scanner scripts removed from source-snapshot (contain regex that triggers false positives)

## SF-01 design decision
All roles with `appointment.view_facility_schedule` are `facilityWide: true`. The per-row patient-access filter in `listFacilityAppointmentsService` is a no-op for these roles. SF-01 v8 proves cross-facility filtering instead: supervisor at FACILITY_ID sees Patient A's appointment at FACILITY_ID but NOT Patient B's appointment at FACILITY_2_ID.

**Why:** The spec required using a role "already approved for appointment.view_facility_schedule" while keeping an inaccessible-patient scenario. For facilityWide roles, "inaccessible" means a different facility's appointment (SQL-level WHERE clause), not a per-row patient access grant.

## Migration 0007 hash (drizzle-kit computed)
`f85f4254bc63e9f15dc7f5da1a74425089032c0ca92e2689ec00e8716a17a901`
Update `phase3-to-phase4-upgrade-proof.sh` if the SQL file ever changes.

## Evidence archive structure (74 source-snapshot files)
- `source-snapshot/migrations/` — 0000-0007 SQL, journal, drizzle config
- `source-snapshot/schema/` — all schema files + repositories  
- `source-snapshot/api/` — services, routes, middlewares
- `source-snapshot/auth/` — auth and browser test seeds
- `source-snapshot/e2e/` — both browser specs, config, upgrade proof script, sessions helpers
- `source-snapshot/frontend/pages/` — AppointmentCalendar, PatientDetail, PatientList
- `source-snapshot/tests/` — appointment + permission + clinical-note + rate-limit + outbox tests
