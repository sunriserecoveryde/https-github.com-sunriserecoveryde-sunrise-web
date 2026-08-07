# Phase 4 Scheduling — Implementation Plan
## Branch: feature/phase-4-scheduling-and-appointments
## Phase: Scheduling and Appointments — Staff-Created Bookings
## Status: PROPOSED — awaiting approval before any implementation begins

---

## Scope

Deliver a minimum safe scheduling foundation for staff-created patient appointments.

Staff at a treatment facility can:
- Create appointments for patients they have access to
- View a patient's appointment list (upcoming and past)
- View a facility's appointment schedule
- Edit future appointments they created (supervisors may edit any)
- Cancel appointments they created with a required reason (supervisors may cancel any)

All scheduling operations are server-enforced, audited, and bounded by the existing facility/organization/patient-access model.

---

## Explicit Exclusions

The following are out of scope for Phase 4 and must not be implemented:

- Patient self-scheduling
- Public booking links
- Recurring appointments
- Group appointments / group scheduling
- Waitlists
- Automated reminders (SMS, email, push)
- Insurance eligibility checking
- Billing or claims integration
- Clinical-note linkage beyond a safe appointment reference field (not in Phase 4)
- Calendar synchronization (Google Calendar, iCal)
- Telehealth / video links
- Room or resource scheduling
- Complex provider availability rules
- Overbooking or overbook policies
- Appointment series
- Drag-and-drop calendar editing
- External calendar integrations
- Appointment templates
- Walk-in or ad-hoc workflows without a booked appointment record

---

## Permission Contract

### Codes (5 new, none reused from existing permissions)

```
appointment.create
appointment.view
appointment.edit
appointment.cancel
appointment.view_facility_schedule
```

### Role Matrix

| Role | create | view | edit | cancel | view_facility_schedule |
|---|---|---|---|---|---|
| `clinical_supervisor` | ✓ | ✓ | ✓ (any) | ✓ (any) | ✓ |
| `certified_clinician` | ✓ | ✓ | ✓ (own) | ✓ (own) | ✓ |
| `mh_therapist` | ✓ | ✓ | ✓ (own) | ✓ (own) | ✓ |
| `prescriber` | ✓ | ✓ | ✓ (own) | ✓ (own) | ✓ |
| `nursing` | ✓ | ✓ | ✓ (own) | ✓ (own) | ✓ |
| `bht` | ✗ | ✓ | ✗ | ✗ | ✗ |
| `aftercare_staff` | ✗ | ✓ | ✗ | ✗ | ✗ |
| `billing_user` | ✗ | ✗ | ✗ | ✗ | ✗ |
| `hr_user` | ✗ | ✗ | ✗ | ✗ | ✗ |
| `security_admin` | ✗ | ✗ | ✗ | ✗ | ✗ |

"own" = `created_by_user_id = acting_user_id` (supervisors bypass ownership check)

---

## Appointment Statuses

Minimum required for Phase 4: `scheduled`, `cancelled`

Full proposed set (implement all, but only `scheduled` and `cancelled` are mandatory in Phase 4 workflows):

```
scheduled    — default on creation
confirmed    — staff has confirmed the appointment with the patient
checked_in   — patient has arrived
completed    — appointment has concluded
cancelled    — cancelled with reason; terminal state
no_show      — patient did not attend; terminal state
```

**Transitions allowed:**
- `scheduled` → `confirmed`, `cancelled`, `no_show`
- `confirmed` → `checked_in`, `cancelled`, `no_show`
- `checked_in` → `completed`
- `completed` → (terminal; no edits)
- `cancelled` → (terminal; no edits, no re-cancellation)
- `no_show` → (terminal)

**Edit allowed when:** status is `scheduled` or `confirmed` only.

---

## Database Design

### Primary Table: `sos_appointments`

```sql
CREATE TABLE sos_appointments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               UUID NOT NULL,
  facility_id          UUID NOT NULL,
  patient_id           UUID NOT NULL,
  assigned_user_id     UUID NOT NULL,
  appointment_type     TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'scheduled',
  starts_at            TIMESTAMPTZ NOT NULL,
  ends_at              TIMESTAMPTZ NOT NULL,
  reason               TEXT NOT NULL,
  internal_note        TEXT,
  created_by_user_id   UUID NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by_user_id   UUID,
  updated_at           TIMESTAMPTZ,
  cancelled_by_user_id UUID,
  cancelled_at         TIMESTAMPTZ,
  cancellation_reason  TEXT,
  version              INTEGER NOT NULL DEFAULT 1,

  -- Tenant FK
  CONSTRAINT fk_apt_org
    FOREIGN KEY (org_id) REFERENCES sos_organizations(id) ON DELETE CASCADE,

  -- Composite FKs (tenant-safe pattern from Phase 3)
  CONSTRAINT fk_apt_facility
    FOREIGN KEY (org_id, facility_id) REFERENCES sos_facilities(org_id, id) ON DELETE RESTRICT,

  CONSTRAINT fk_apt_patient
    FOREIGN KEY (org_id, patient_id) REFERENCES sos_patients(org_id, id) ON DELETE RESTRICT,

  CONSTRAINT fk_apt_assigned_user
    FOREIGN KEY (org_id, assigned_user_id) REFERENCES sos_user_accounts(org_id, id) ON DELETE RESTRICT,

  CONSTRAINT fk_apt_created_by
    FOREIGN KEY (org_id, created_by_user_id) REFERENCES sos_user_accounts(org_id, id) ON DELETE RESTRICT,

  -- Check constraints
  CONSTRAINT ck_sos_appointments_time_order
    CHECK (ends_at > starts_at),

  CONSTRAINT ck_sos_appointments_status
    CHECK (status IN ('scheduled','confirmed','checked_in','completed','cancelled','no_show')),

  -- Cancellation consistency: all-or-nothing
  CONSTRAINT ck_sos_appointments_cancellation
    CHECK (
      (cancelled_by_user_id IS NULL AND cancelled_at IS NULL AND cancellation_reason IS NULL)
      OR
      (cancelled_by_user_id IS NOT NULL AND cancelled_at IS NOT NULL AND cancellation_reason IS NOT NULL)
    ),

  CONSTRAINT ck_sos_appointments_version_positive
    CHECK (version >= 1)
);
```

### Indexes

```sql
-- Conflict check: patient overlap query
CREATE INDEX idx_apt_patient_time
  ON sos_appointments (org_id, patient_id, starts_at, ends_at)
  WHERE status NOT IN ('cancelled', 'no_show');

-- Conflict check: staff overlap query
CREATE INDEX idx_apt_staff_time
  ON sos_appointments (org_id, assigned_user_id, starts_at, ends_at)
  WHERE status NOT IN ('cancelled', 'no_show');

-- Facility schedule query
CREATE INDEX idx_apt_facility_time
  ON sos_appointments (org_id, facility_id, starts_at);

-- Single appointment lookup by org (tenant safety)
CREATE INDEX idx_apt_org_id
  ON sos_appointments (org_id, id);
```

### No additional tables required for Phase 4.

No appointment-type lookup table — `appointment_type` is a validated text enum in the application layer. No separate cancellation log table — cancellation fields are on the primary row (original values are preserved; the appointment is never hard-deleted).

---

## Migration Design

**File:** `lib/db/drizzle/0007_scheduling_and_appointments.sql`

**Contents:**
1. Create `sos_appointments` table with all columns, FKs, check constraints
2. Create all four indexes
3. Extend `ck_sos_auth_audit_event_type` constraint to include:
   - `appointment.created`
   - `appointment.updated`
   - `appointment.cancelled`

**Pattern for extending the event_type constraint** (consistent with migration 0005):
```sql
ALTER TABLE sos_auth_audit DROP CONSTRAINT ck_sos_auth_audit_event_type;
ALTER TABLE sos_auth_audit ADD CONSTRAINT ck_sos_auth_audit_event_type
  CHECK (event_type IN ( ...existing values..., 'appointment.created', 'appointment.updated', 'appointment.cancelled' ));
-- Repeat for sos_audit_outbox
```

**Drizzle schema addition:** `lib/db/src/schema/appointments.ts` (new file, exported from schema index)

---

## API Design

### Base URL: `/api/v1/`

All endpoints require session authentication and CSRF token on mutating methods.

---

### `POST /api/v1/appointments`

**Permission:** `appointment.create`
**Authorization:** facility match + patient access check
**Rate-limited:** yes

**Request DTO:**
```json
{
  "facilityId":       "uuid",
  "patientId":        "uuid",
  "assignedUserId":   "uuid",
  "appointmentType":  "string (enum: individual_therapy|group_therapy|medication_management|intake|follow_up|other)",
  "startsAt":         "ISO 8601 with offset",
  "endsAt":           "ISO 8601 with offset",
  "reason":           "string (1–500 chars)",
  "internalNote":     "string (0–1000 chars, optional)"
}
```

**Response:** `201 Created` — full appointment object
**Errors:** `400` validation, `403` auth, `404` patient/facility not found, `409` overlap conflict
**Audit:** `appointment.created` written in same transaction

---

### `GET /api/v1/appointments/:id`

**Permission:** `appointment.view`
**Authorization:** facility match + patient access
**Rate-limited:** no

**Response:** `200` — full appointment object
**Errors:** `401`, `403`, `404`

---

### `GET /api/v1/patients/:patientId/appointments`

**Permission:** `appointment.view`
**Authorization:** facility match + patient access
**Query params:** `status` (optional filter), `from` / `to` (ISO dates, facility timezone interpreted)

**Response:** `200` — `{ upcoming: [...], past: [...] }`
**Errors:** `401`, `403`, `404`

---

### `GET /api/v1/facilities/:facilityId/appointments`

**Permission:** `appointment.view_facility_schedule`
**Authorization:** facility match (no per-patient access check — aggregate view)
**Query params:** `date` (required, YYYY-MM-DD in facility timezone), `status` (optional)

**Response:** `200` — array of appointments for the day
**Errors:** `401`, `403`, `404`

---

### `PATCH /api/v1/appointments/:id`

**Permission:** `appointment.edit`
**Authorization:** facility match + patient access + ownership check (unless supervisor)
**Rate-limited:** yes

**Request DTO:**
```json
{
  "version":          1,
  "assignedUserId":   "uuid (optional)",
  "appointmentType":  "string (optional)",
  "startsAt":         "ISO 8601 (optional)",
  "endsAt":           "ISO 8601 (optional)",
  "reason":           "string (optional)",
  "internalNote":     "string (optional)"
}
```

**Response:** `200` — updated appointment
**Errors:** `400`, `403`, `404`, `409` (stale version or overlap conflict), `422` (terminal status)
**Audit:** `appointment.updated` in same transaction

---

### `POST /api/v1/appointments/:id/cancel`

**Permission:** `appointment.cancel`
**Authorization:** facility match + patient access + ownership check (unless supervisor)
**Rate-limited:** yes

**Request DTO:**
```json
{
  "cancellationReason": "string (5–500 chars required)"
}
```

**Response:** `200` — appointment with `status: "cancelled"`, cancellation fields populated
**Errors:** `400` (missing reason), `403`, `404`, `409` (already cancelled/terminal)
**Audit:** `appointment.cancelled` in same transaction

---

## Conflict Rules

All rules are enforced server-side in `appointmentService.ts` before the INSERT/UPDATE commits.

| Rule | Behavior |
|---|---|
| `ends_at ≤ starts_at` | `400 Bad Request` |
| `starts_at` in the past | `400 Bad Request` |
| Patient time overlap (same patient, active appointment, overlapping time window) | `409 Conflict` |
| Staff time overlap (same assigned user, active appointment, overlapping time window) | `409 Conflict` |
| Exact duplicate (same patient, staff, starts_at, ends_at, non-cancelled) | `409 Conflict` |
| Cancelled appointments | Excluded from all overlap checks |
| `no_show` appointments | Excluded from all overlap checks |
| Concurrent edit (stale `version`) | `409 Conflict` |
| Duplicate `POST` submissions (idempotency) | `409 Conflict` |

**Overlap query definition:** two appointments overlap if `a.starts_at < b.ends_at AND a.ends_at > b.starts_at` (half-open interval). Back-to-back appointments (a ends exactly when b starts) are **not** a conflict.

**Optimistic concurrency:** `PATCH` includes `version` in the request. The update uses `WHERE id = $id AND version = $version`. If 0 rows updated, return `409`.

---

## Timezone Behavior

| Aspect | Rule |
|---|---|
| Storage | All timestamps stored as `TIMESTAMPTZ` (UTC) |
| Facility timezone source | `sos_facilities.time_zone` (IANA string, e.g. `America/New_York`) |
| API input | ISO 8601 with explicit UTC offset (e.g. `2026-08-10T14:00:00-04:00`); server normalizes to UTC |
| API output | UTC ISO 8601 (`2026-08-10T18:00:00.000Z`) |
| Frontend display | `Intl.DateTimeFormat` with facility `time_zone` for all rendered times |
| Date-range queries | `from`/`to` query params are date strings (`YYYY-MM-DD`) interpreted in the facility's timezone |
| Start/end boundary | Start-of-day and end-of-day in facility timezone for date-only queries |
| DST transitions | Stored as UTC — DST ambiguity is resolved at input time when the client provides an explicit offset. The server does not attempt to infer local time from a naive timestamp. |
| Past appointment rejection | Checked against `NOW()` (UTC) |

**Implementation note:** No timezone library is added to the API server in Phase 4. The server accepts ISO 8601 strings with explicit offsets (JavaScript `new Date(isoString)` handles them correctly), stores UTC, and returns UTC. Timezone label for display is returned as a separate `facilityTimezone` field in appointment responses.

---

## Frontend Design

### New: "Appointments" tab on PatientDetail

Added to `artifacts/sunrise-os/src/pages/PatientDetail.tsx` — identical pattern to the "Progress Notes" tab.

**Tab activation trigger:** lazy-load appointments when the tab becomes active (same as clinical notes).

### UI States required

| State | Description |
|---|---|
| Loading | Spinner while fetching appointments |
| Empty | "No upcoming appointments — click Book Appointment to schedule one" |
| List (upcoming) | Cards with date, time (facility timezone), type, assigned staff, status badge |
| List (past) | Collapsed section below upcoming |
| Book form | Modal: facility (pre-filled), patient (pre-filled), date/time picker, type selector, assigned staff selector, reason textarea |
| Validation error | Inline field errors on the form |
| Conflict error | Banner in form: "This time slot conflicts with an existing appointment" |
| Auth denial | "You do not have permission to book appointments" (no Book button if no `appointment.create`) |
| Appointment detail | Expanded card or modal with all fields |
| Edit state | Same form pre-filled; only future non-terminal appointments show Edit |
| Cancellation dialog | Modal: "Cancel this appointment?" + required reason textarea + Confirm button |
| Cancelled state | Card shows "Cancelled" badge, cancellation reason, cancelled-by, cancelled-at |
| Concurrent conflict | "This appointment was modified by someone else. Please refresh and try again." |

### CSRF handling

Same pattern as clinical notes in `PatientDetail.tsx`: fetch `GET /api/v1/auth/csrf-token` immediately before each mutation and include as `X-CSRF-Token`.

### No calendar grid

A list-based view is sufficient. `AppointmentCalendar` screen remains a stub — it is not functional in Phase 4.

---

## Audit / Outbox Design

### Events

| Event type | Trigger | Written via |
|---|---|---|
| `appointment.created` | Successful create | In-transaction insert to `sos_auth_audit` |
| `appointment.updated` | Successful edit | In-transaction insert to `sos_auth_audit` |
| `appointment.cancelled` | Successful cancel | In-transaction insert to `sos_auth_audit` |
| `authorization_denied` | Any scheduling auth denial | `sos_audit_outbox` → worker |

### Event payload (metadata column)

```json
{
  "appointmentId":    "uuid",
  "organizationId":   "uuid",
  "facilityId":       "uuid",
  "patientId":        "uuid",
  "assignedUserId":   "uuid",
  "changedFields":    ["reason", "starts_at"],
  "previousStatus":   "scheduled",
  "newStatus":        "cancelled"
}
```

Fields `reason`, `internal_note` text content are NOT logged in audit metadata. Only field names that changed are logged (`changedFields` array).

---

## Test Matrix Summary

| Category | Count |
|---|---|
| Positive | 6 |
| Validation | 7 |
| Conflict | 5 |
| Authorization | 12 |
| Security | 5 |
| Migration | 5 |
| Browser | 7 |
| **Total** | **47** |

Full test plan: `artifacts/sunrise-os/planning/phase-4-acceptance-test-plan.md`

---

## Evidence Plan

Following the Phase 3 evidence pattern:

- TypeScript builds: `@workspace/db`, `@workspace/api-server`, `@workspace/sunrise-os`, e2e tsconfig
- API vitest: target 47+ API/integration tests
- Sunrise OS vitest: target 136+ (existing) + new scheduling unit tests
- Playwright browser tests: `appointments-p4-browser.spec.ts` covering G-1 through G-7
- Migration proof: clean run + upgrade-from-Phase-3 run
- Secret scan: updated scanner against evidence ZIP
- Evidence archive: `phase-4-scheduling-and-appointments-review-v1.zip`

---

## Risks

| Risk | Mitigation |
|---|---|
| Overlap check performance on large datasets | Partial indexes exclude cancelled/no_show rows; both conflict indexes cover the time window |
| DST ambiguity at clock-change boundaries | Require explicit UTC offset in all API inputs; reject naive timestamps |
| Concurrent appointment creation race (two requests pass conflict check simultaneously) | Use DB-level constraint + `FOR UPDATE` advisory or serializable transaction for the conflict-check-then-insert window |
| PatientDetail tab list growing too large | Consider overflow menu or collapsible groups in a future phase |
| `event_type` constraint expansion breaking existing tests | Constraint is DROP+ADD — all existing values must be preserved exactly |
| Version not sent by client | Require `version` in PATCH DTO; 400 if absent |

---

## Open Decisions Requiring Approval

1. **`appointment.view` for `bht` and `aftercare_staff`** — current proposal grants view-only access. Should these roles see appointment detail, or only the fact that a patient has an appointment?

2. **Past appointment creation window** — current proposal rejects any `starts_at` in the past. Should supervisors be allowed to backfill missed appointments (e.g., entered after the fact)?

3. **Assigned user validation** — must `assigned_user_id` hold an active role at the appointment facility, or only be a valid user in the organization?

4. **Appointment types enum** — proposed: `individual_therapy`, `group_therapy`, `medication_management`, `intake`, `follow_up`, `other`. Confirm this list or provide corrections.

5. **Facility schedule view authorization** — should `appointment.view_facility_schedule` require patient-access checks per row in the schedule response, or return the full schedule to any user with the facility permission?

6. **Status machine for Phase 4** — should Phase 4 implement the full six-status set, or only `scheduled` + `cancelled`? Additional statuses (`confirmed`, `checked_in`, `completed`, `no_show`) add transition logic but no additional UI is proposed.

7. **`internal_note` visibility** — should `internal_note` be visible to all roles with `appointment.view`, or restricted to supervisors and the creator?

---

## Proposed Implementation Order

1. **Permission contract** — add 5 codes to `permissionPolicy.ts` and `permissions.ts`; update `ROLE_PERMISSIONS` entries; add test assertions
2. **Database migration** — `0007_scheduling_and_appointments.sql`; Drizzle schema in `lib/db/src/schema/appointments.ts`
3. **Repository** — `lib/db/src/repositories/appointmentRepository.ts` — CRUD + conflict queries
4. **Service** — `artifacts/api-server/src/lib/appointmentService.ts` — conflict detection, timezone normalization, optimistic concurrency, state-machine enforcement
5. **Authorization policy** — `appointmentAuthorizationService.ts` — facility/patient/ownership checks; denial audit events
6. **API routes and DTOs** — `artifacts/api-server/src/routes/appointmentsV1.ts` — all 6 endpoints with Zod validation, rate limiting, CSRF
7. **Unit and integration tests** — vitest covering all A–F test cases
8. **Patient appointment UI** — Appointments tab in `PatientDetail.tsx`; all required UI states
9. **Browser tests** — `appointments-p4-browser.spec.ts` covering G-1 through G-7
10. **Migration proof** — clean-run and upgrade-from-Phase-3 proof scripts
11. **Build and typecheck verification** — all four `tsc --noEmit` + both builds
12. **Evidence package** — screenshots, HARs, traces, scanner, ZIP
