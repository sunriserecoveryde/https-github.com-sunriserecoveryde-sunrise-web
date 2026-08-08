---
name: Phase 4 audit record
description: PERMANENT — Phase 4 Scheduling & Appointments merge audit record
---

# PERMANENT AUDIT RECORD — Phase 4 Scheduling & Appointments

## Identity

| Field | Value |
|-------|-------|
| Phase name | Phase 4 — Scheduling and Appointments |
| Feature branch | feature/phase-4-scheduling-and-appointments |
| Approved product/test commit | ee1150fd80f8042f4497215628e60e7db5951a85 |
| Approved evidence ZIP | phase-4-scheduling-appointments-review-v10.zip |
| Evidence SHA-256 | 76c071e51bfb31e9d22f7bf29b51b5eeb2ef6ffc3d9d4be224c58e5bd3f139d8 |
| Independent approval status | PHASE 4 APPROVED FOR MERGE |

## Merge

| Field | Value |
|-------|-------|
| Pre-merge main SHA | 689555f250149ea1186da1797306006f4c4851f1 |
| Merge commit SHA | 25c26227717fba1da5a35346b4d79e0c90d883f8 |
| Merge commit message | merge: Phase 4 scheduling and appointments |
| Post-merge evidence commit | bb8ab2ad9424c040f1524ec6744364abb96829bf |
| Final main HEAD (pre-audit) | bb8ab2ad9424c040f1524ec6744364abb96829bf |
| Merge strategy | --no-ff (explicit merge commit) |
| Conflicts | NONE |

## Post-merge TypeScript / Build gates (7/7)

| Gate | Result |
|------|--------|
| 1. Database typecheck | PASS — exit 0 |
| 2. Database build | PASS — exit 0 (no build script required) |
| 3. API typecheck | PASS — exit 0 |
| 4. API production build | PASS — exit 0 (esbuild ⚡ Done) |
| 5. Sunrise OS typecheck | PASS — exit 0 |
| 6. Sunrise OS production build | PASS — exit 0 (Vite ✓ built) |
| 7. Playwright/e2e typecheck | PASS — exit 0 |

## Post-merge Test Results

| Suite | Result |
|-------|--------|
| API vitest | 679/679 PASS, exit 0 |
| Sunrise OS vitest | 136/136 PASS, exit 0 |
| Full Phase 3 + Phase 4 Playwright | 48/48 PASS, exit 0 (2.4 min) |

## Phase 4 Contract Checks (Step 12)

### Exact five appointment permissions
PASS — exactly: `appointment.create`, `appointment.view`, `appointment.edit`, `appointment.cancel`, `appointment.view_facility_schedule`

### aftercare_staff permission result
PASS — exactly: `appointment.view` only. `appointment.view_facility_schedule` is NOT present.
Test P4EQ-21: ✓ aftercare_staff — exactly 1 scheduling code (appointment.view only)

### Audit event result
PASS — exactly: `appointment.created`, `appointment.updated`, `appointment.cancelled`
Source: `appointmentService.ts` lines 108, 292, 485, 521

### Assigned-user facility-validation result
PASS — `validateAssignedUser()` requires explicit role grant scoped to the appointment's `facilityId`.
Comment (line 196): "An org-wide role (facility_id IS NULL) does NOT qualify for appointment assignment."

### Facility-timezone result
PASS — `AppointmentCalendar.tsx` fetches `facilityTimezone` from API and uses it for date boundary computation and display.

### Facility-schedule row-filter result
PASS — Playwright 48/48 includes SF-01 test validating inaccessible patient appointments are excluded from facility schedule view.

## Migration chain result

PASS — 0000 through 0007, complete chain (8 entries). `0007_scheduling_and_appointments` is the approved Phase 4 scheduling migration.

## Push result

(recorded after push — see final main HEAD in audit commit header)

## Final clean-tree result

PASS — `git status --short` → no output before push.
Post-merge HAR/screenshot refresh committed as evidence-only commit `bb8ab2a`.

## ZIP verification at merge time

SHA-256 of `phase-4-scheduling-appointments-review-v10.zip` at merge: `76c071e51bfb31e9d22f7bf29b51b5eeb2ef6ffc3d9d4be224c58e5bd3f139d8` — matches approved SHA.

## Stop condition

Phase 5 not started. No scheduling enhancements added.
