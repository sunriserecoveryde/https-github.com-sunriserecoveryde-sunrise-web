# Phase 4 Scheduling — Acceptance Test Plan
## Branch: feature/phase-4-scheduling-and-appointments
## Status: PROPOSED — define before coding

Total: **47 test cases** across 7 categories.

---

## A. Positive Tests (6)

**A-1: Authorized staff creates appointment**
- Actor: `certified_clinician` with patient access
- Action: `POST /api/v1/appointments` with all required fields, future start time
- Expected: `201 Created`, appointment body returned, `appointment.created` audit event written

**A-2: Appointment appears in patient list**
- Action: `GET /api/v1/patients/:patientId/appointments`
- Expected: `200`, appointment present in list, correct status `scheduled`

**A-3: Appointment detail is readable**
- Action: `GET /api/v1/appointments/:id`
- Expected: `200`, full appointment body, correct field values

**A-4: Authorized staff edits a future appointment**
- Actor: creator or `clinical_supervisor`
- Action: `PATCH /api/v1/appointments/:id` with changed `reason` and new time
- Expected: `200`, updated body, `appointment.updated` audit event, `version` incremented

**A-5: Authorized cancellation succeeds**
- Actor: creator or `clinical_supervisor`
- Action: `POST /api/v1/appointments/:id/cancel` with `cancellationReason`
- Expected: `200`, status becomes `cancelled`, `cancelled_by_user_id`, `cancelled_at`, `cancellation_reason` populated

**A-6: Cancellation preserves original appointment values**
- After A-5: `GET /api/v1/appointments/:id`
- Expected: `starts_at`, `ends_at`, `patient_id`, `assigned_user_id`, `appointment_type` all unchanged

---

## B. Validation Tests (7)

**B-1: Missing required field**
- Action: `POST` without `patient_id`
- Expected: `400`, error referencing `patient_id`

**B-2: Invalid facility (not in org)**
- Action: `POST` with `facility_id` belonging to a different organization
- Expected: `400` or `404`

**B-3: Start time in the past**
- Action: `POST` with `starts_at` set to 1 hour ago
- Expected: `400`

**B-4: End time ≤ start time**
- Action: `POST` with `ends_at` ≤ `starts_at`
- Expected: `400`

**B-5: Unsupported status value**
- Action: `POST` with `status: "pending"` (not in allowed set)
- Expected: `400`

**B-6: Missing cancellation reason**
- Action: `POST /appointments/:id/cancel` with no `cancellationReason` or empty string
- Expected: `400`

**B-7: Assigned user not at facility**
- Action: `POST` with `assigned_user_id` of a user who has no active role at the appointment's facility
- Expected: `400` or `422`

---

## C. Conflict Tests (5)

**C-1: Patient time overlap**
- Setup: existing `scheduled` appointment for patient P, 10:00–11:00
- Action: create appointment for same patient P, 10:30–11:30
- Expected: `409 Conflict`, conflict reason indicates patient overlap

**C-2: Assigned-staff time overlap**
- Setup: existing `scheduled` appointment for staff member U, 14:00–15:00
- Action: create appointment with same `assigned_user_id` U, 14:30–15:30
- Expected: `409 Conflict`, conflict reason indicates staff overlap

**C-3: Exact duplicate**
- Action: submit the same `POST /appointments` payload twice with same patient, staff, start/end times
- Expected: second request returns `409 Conflict`

**C-4: Cancelled appointment excluded from overlap check**
- Setup: existing appointment for patient P, 10:00–11:00, then cancel it
- Action: create new appointment for same patient P, 10:00–11:00
- Expected: `201 Created` (cancelled appointments are ignored in overlap check)

**C-5: Concurrent update conflict (stale version)**
- Setup: fetch appointment — note `version: 1`
- Action A: `PATCH` with `version: 1` → succeeds, appointment now `version: 2`
- Action B: simultaneously `PATCH` same appointment with `version: 1`
- Expected: Action B returns `409 Conflict` (stale version)

---

## D. Authorization Tests (12)

**D-1: Different organization**
- Actor: valid user from Org B
- Action: `GET /api/v1/appointments/:id` for appointment in Org A
- Expected: `404` (no cross-tenant leakage)

**D-2: Same org, different facility**
- Actor: clinician assigned only to Facility A
- Action: `POST /appointments` with `facility_id = Facility B`
- Expected: `403`

**D-3: Unassigned patient (caseload role, no patient access)**
- Actor: `certified_clinician` without `sos_patient_access` for the target patient
- Action: `POST /appointments` for that patient
- Expected: `403`

**D-4: `security_admin`**
- Action: any scheduling endpoint
- Expected: `403`

**D-5: `hr_user`**
- Action: any scheduling endpoint
- Expected: `403`

**D-6: `billing_user`**
- Action: any scheduling endpoint
- Expected: `403`

**D-7: Role without `appointment.create`**
- Actor: `bht` or `aftercare_staff`
- Action: `POST /appointments`
- Expected: `403`

**D-8: Non-creator attempting edit (non-supervisor)**
- Actor: `certified_clinician` who did NOT create the appointment
- Action: `PATCH /appointments/:id`
- Expected: `403`

**D-9: Non-creator attempting cancel (non-supervisor)**
- Actor: `certified_clinician` who did NOT create the appointment
- Action: `POST /appointments/:id/cancel`
- Expected: `403`

**D-10: Attempt to edit a cancelled appointment**
- Setup: cancel an appointment
- Action: `PATCH` the now-cancelled appointment
- Expected: `422 Unprocessable` (invalid state transition)

**D-11: Attempt to cancel an already-cancelled appointment**
- Setup: cancel an appointment
- Action: `POST /appointments/:id/cancel` again
- Expected: `409` (already in terminal state)

**D-12: `appointment.view_facility_schedule` denied to `billing_user`**
- Action: `GET /api/v1/facilities/:facilityId/appointments`
- Expected: `403`

---

## E. Security Tests (5)

**E-1: CSRF required on all mutating endpoints**
- Action: `POST /appointments`, `PATCH /appointments/:id`, `POST /appointments/:id/cancel` with no `X-CSRF-Token` header
- Expected: `403` with CSRF-violation indicator for each

**E-2: Session required**
- Action: any scheduling endpoint with no session cookie
- Expected: `401`

**E-3: Rate limiting on create**
- Action: rapid-fire `POST /appointments` requests beyond the per-IP rate limit
- Expected: `429` response

**E-4: No cross-tenant data leakage in conflict check**
- Setup: Org A has an appointment for patient P at 10:00–11:00
- Action: Org B's clinician attempts to create an appointment at the same time for a different patient
- Expected: Org A's appointment is never considered in Org B's conflict check; no Org A data visible

**E-5: 403/404 responses reveal no appointment data**
- Action: any denial response
- Expected: response body contains only `{ "error": "..." }` with no appointment fields, patient names, or facility details

---

## F. Migration Tests (5)

**F-1: Clean-database migration**
- Action: apply migration 0007 to an empty schema
- Expected: `EXIT:0`, `sos_appointments` table exists, all constraints and indexes created

**F-2: Upgrade from current main (Phase 3 schema)**
- Action: apply migration 0007 to a database containing Phases 1–3 schema and data
- Expected: `EXIT:0`, all Phase 3 tables and data intact, no column renames or drops on existing tables

**F-3: Phase 3 clinical notes unaffected**
- After F-2: query `sos_clinical_notes` — all rows present, no constraint violations

**F-4: Idempotent rerun**
- Action: apply migration 0007 a second time using the journal mechanism
- Expected: no error (journal prevents rerun)

**F-5: Constraints and indexes verified post-migration**
- After F-1: query `information_schema.table_constraints` and `pg_indexes`
- Expected: `ck_sos_appointments_status`, `ck_sos_appointments_time_order`, FK constraints on `org_id`, `facility_id`, `patient_id`, `assigned_user_id`, `created_by_user_id`; indexes on `(org_id, facility_id, starts_at)` and `(org_id, patient_id, starts_at)` present

---

## G. Browser Tests (7)

**G-1: Patient appointments tab renders with empty state**
- Navigate to PatientDetail → Appointments tab
- Expected: "No upcoming appointments" empty state visible

**G-2: Staff creates appointment via the form**
- Click "Book Appointment" → fill form → submit
- Expected: appointment appears in the list with status `Scheduled`

**G-3: Conflict error displayed correctly**
- Submit a booking that overlaps an existing appointment
- Expected: conflict message shown in form, appointment not created

**G-4: Staff edits an appointment**
- Open appointment detail → click Edit → change reason → save
- Expected: updated reason shown, `version` updated

**G-5: Staff cancels an appointment**
- Open appointment → click Cancel → enter reason → confirm
- Expected: status shown as `Cancelled`, original appointment values preserved in detail view

**G-6: Authorization denial shown**
- Act as a role without `appointment.create`
- Expected: "Book Appointment" button absent; direct API attempt returns 403; UI shows access-denied state

**G-7: Concurrent edit conflict shown**
- Two browser contexts open same appointment; first submits edit; second submits stale version
- Expected: second context sees conflict message, no silent overwrite
