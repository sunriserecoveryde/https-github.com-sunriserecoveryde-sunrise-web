---
name: Phase 4 v2 closure
description: Phase 4 Scheduling & Appointments v2 evidence package — all gates met, ZIP built, key fixes documented
---

## Status: CLOSED

All gates met for Phase 4 v2 evidence package.

**ZIP:** `artifacts/sunrise-os/readiness/phase-4-scheduling-appointments-review-v2.zip`  
**SHA256:** `b24a7275202f72a6d0b990e3446c02681a697436cddda20fa7d1593d748a2687`

## Test Counts (final)
- API vitest: 668/668 ×4 clean
- SOS vitest: 136/136 ×4 clean
- Playwright (chromium): 42/42 ×3 clean

## Key Fixes Applied This Session (v2 rebuild)

### 1. UUID variant bug (c000 → a000)
Deterministic fixture UUIDs used `c000` in group 4 which fails Zod v4's strict UUID
validator (must be 8, 9, a, b). Changed to `a000`:
- BROWSER_APT_EDIT_ID: `00000000-0000-4000-a000-000000000011`
- BROWSER_APT_CANCEL_ID: `00000000-0000-4000-a000-000000000012`
- BROWSER_APT_CONCURRENT_ID: `00000000-0000-4000-a000-000000000013`

**Why:** Zod v4 `z.string().uuid()` validates variant bits (group-4 must start with 8/9/a/b).
Phase 3 fixtures used `b000` — always use `b000` or `a000` for future deterministic test UUIDs.

### 2. DB accumulation between test runs
Creation tests (Pos-1, Pos-2, UI-B, UI-C) leave appointments in the DB. On the next
globalSetup run, the same time slots conflict (409). Fix: `browserTestSeed.ts` now
deletes ALL appointments for TEST_PATIENT_ID before seeding fixtures.

**Why:** Seed must clear all prior-run artifacts, not just specific fixture IDs, to keep
creation tests idempotent across runs.

### 3. listPatientAppointments bucketing (time-only → status+time)
Original: `upcoming = startsAt >= pivot` (time-only)  
Fixed: `upcoming = status='scheduled' AND startsAt >= pivot`  
Effect: cancelled appointments with future `startsAt` immediately move to `past` bucket.

**Why:** A future-dated cancelled appointment is no longer "upcoming" from a scheduling
perspective. UI-E cancel test was failing because the cancelled apt stayed in `upcoming`.

### 4. Denial status codes (403 vs 404)
BHT and non-scheduling roles get 404 (not 403) for patient-level appointment endpoints
because `authorizePatientAccess()` checks `sos_patient_access` row-level access BEFORE
the permission check fires. 404 hides patient existence. Spec tests accept [403, 404].
CSRF-protected endpoints always return 403 (CSRF middleware fires first).

### 5. SOS permissions test count
`permissions.test.ts` line 56: updated from 18 to 23 (Phase 4 adds 5 appointment codes).

### 6. Edit modal wired in PatientDetail
New state: `editAptId`, `editAptReason`, `editAptVersion`, `editAptSaving`, `editAptError`  
New button: `data-testid="edit-apt-{id}"` on each upcoming card  
New modal: `data-testid="edit-apt-reason-input"`, `data-testid="confirm-edit-btn"`  
PATCH: `${API_BASE}/v1/appointments/${editAptId}` with CSRF token

### 7. BHT session added
- `e2e/sessions.ts`: `bht: path.join(SESSIONS_DIR, "bht.json")`
- `e2e/global-setup.ts`: `{ key: "bht", email: "readonly@test.sunrise" }` (9th persona)

## Known Flake (not a regression)
`auth-p2d-outbox-worker.test.ts` step-03 (`FOR UPDATE SKIP LOCKED`) is timing-sensitive
and occasionally fails when the DB is under load. Passes in all 4 serial runs. Documented
in Phase 2D Hardening notes.
