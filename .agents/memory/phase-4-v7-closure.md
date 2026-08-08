---
name: Phase 4 v7 closure
description: Final closure record for Phase 4 Scheduling & Appointments review package v7 — all gates met, ZIP committed
---

## Status: CLOSED

Branch: `feature/phase-4-scheduling-and-appointments`  
Tested Commit: `af0a2f62dbbe5e8f95730e3fbbd8439d394ca53d`  
Evidence Commit: `b604f9532805e2dd75a77bb98bb4e87cdd323c64`  
ZIP SHA-256: `d10d77f348c7337e69dd71e373be4fc246dcf6ddef88acaed9b52f2b3b691d26`  
ZIP path: `artifacts/sunrise-os/readiness/phase-4-scheduling-appointments-review-v7.zip`

## Gate results
- API vitest: **679/679 × 4 clean runs**
- SOS vitest: **136/136 × 4 clean runs**
- Playwright: **29/29 × 4 clean runs** (Pass D with --trace=on)
- TS gates: **7/7 pass**
- Migration proof: drizzle.__drizzle_migrations — 8 total, Phase 3 = rows 1–7, Phase 4 = row 8 (sos_appointments)
- SHA256SUMS: **137/137 OK, 0 failed**
- Secret scanner (ZIP): **492 files, 30 Trace ZIPs opened, 0 confirmed secrets**

## Key changes in v7 (vs v6)
1. Removed hardcoded `FACILITY_TIMEZONE` constant from AppointmentCalendar.tsx — now loaded from API
2. Added SF-01 API test: same-facility patient-access scope for aftercare_staff
3. Added TZ-UI-A/B/C browser tests: timezone regression proof using multiFac session
4. P4EQ-21 updated: aftercare_staff now has 2 scheduling codes (view + view_facility_schedule)
5. FACILITY_2_ID timezone set to America/Los_Angeles in DB for timezone boundary testing

## TZ-UI test session requirement
TZ-UI tests require `SESSION_PATHS.multiFac` (multi-facility@test.sunrise, certified_clinician at both FACILITY_ID ...000002 and FACILITY_2_ID ...000003). The regular clinician session returns 404 for FACILITY_2_ID.

## Migration table
`drizzle.__drizzle_migrations` is in the `drizzle` schema (not public). Must use schema-qualified name in all migration proof queries.

## Evidence structure
- `evidence/traces/`: 30 sanitized trace ZIPs (trace-sanitizer-v4.py)
- `evidence/har/`: 8 sanitized HAR files (har-sanitizer-v4.py)
- `evidence/screenshots/`: 46 PNG screenshots
- `evidence/SCREENSHOT-INVENTORY.md`: 46 rows with SHA-256
- `logs/`: 4×API, 4×SOS, 4×PW, migration-proof, ts-gates, trace-sanitize, full-staging-scan, 8 isolation logs

**Why:** The traces-raw directory must be kept OUTSIDE the staging dir — it contains unsanitized session cookies. The sanitized versions go in evidence/traces/.
