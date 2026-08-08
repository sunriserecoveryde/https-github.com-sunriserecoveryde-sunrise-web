# Phase 4 Scheduling — Repository Discovery
## Branch: feature/phase-4-scheduling-and-appointments
## Discovery Date: 2026-08-07

---

## 1. Patient Model

**Table:** `sos_patients` — `lib/db/src/schema/sunrise-os.ts`

Key columns:
- `id uuid PK`
- `org_id uuid` → `sos_organizations.id` (cascade)
- `facility_id uuid` → composite FK `(org_id, facility_id)` → `sos_facilities(org_id, id)` (restrict)
- `mrn text` — unique per org via `UNIQUE(org_id, mrn)`
- `first_name`, `last_name`, `date_of_birth date`, `gender`
- `insurance_payer`, `primary_diagnosis`, `status`
- `created_at`, `updated_at` (TIMESTAMPTZ)

Composite unique: `(org_id, id)` — supports tenant-safe FK references from child tables.

Patient access is controlled separately by `sos_patient_access` rows requiring an active `sos_role_assignment`. Clinicians are never implicitly granted access to all patients.

---

## 2. Facility Model

**Table:** `sos_facilities` — `lib/db/src/schema/sunrise-os.ts`

Key columns:
- `id uuid PK`
- `org_id uuid` → `sos_organizations.id` (cascade)
- `name text`
- `status`
- `time_zone text DEFAULT 'America/New_York'` — IANA timezone identifier
- `created_at`, `updated_at` (TIMESTAMPTZ)

Composite unique: `(org_id, id)` — used for safe composite FK references.

**Timezone implication for scheduling:** facility `time_zone` is the authoritative source for appointment display timezone. All DB timestamps are UTC (`TIMESTAMPTZ`); facility timezone is applied at the API/display layer.

---

## 3. Organization Model

**Table:** `sos_organizations` — `lib/db/src/schema/sunrise-os.ts`

Key columns:
- `id uuid PK`
- `name text`, `slug text UNIQUE`
- `status`
- `created_at`, `updated_at` (TIMESTAMPTZ)

Root tenant table. All other tables carry `org_id`. Cross-organization access is impossible by design because every tenant-scoped query filters on `org_id` derived from the session.

---

## 4. Staff / User Model

**Tables:**
- `sos_user_identity_refs` — lightweight identity anchor (`id`, `org_id`, `ext_auth_ref`, `status`)
- `sos_user_accounts` — login accounts (`id`, `org_id`, `email`, `password_hash`, lockout, MFA fields)
- `sos_staff_profiles` — human-readable profile (`id`, `org_id`, `user_id` → identity, `display_name`, `professional_role`, `status`)

Composite FK `(org_id, user_id)` on `sos_staff_profiles` → `sos_user_identity_refs(org_id, id)` enforces tenant isolation.

**For scheduling:** the "assigned staff member" on an appointment will FK to `sos_user_accounts(org_id, id)` and optionally join `sos_staff_profiles` for display names.

---

## 5. Role and Permission Architecture

Roles are **code-defined** in `artifacts/api-server/src/lib/permissionPolicy.ts`. There is no `roles` database table. Role assignments are stored in `sos_role_assignments`.

**Role IDs and scheduling-relevant properties:**

| Role ID | facilityWide | canBeOrgWide | canBeFacilityScoped | Clinical permissions |
|---|---|---|---|---|
| `clinical_supervisor` | true | false | true | create, view, edit_own_draft, sign_own, void |
| `certified_clinician` | true | false | true | create, view, edit_own_draft, sign_own |
| `mh_therapist` | true | false | true | create, view, edit_own_draft, sign_own |
| `prescriber` | true | false | true | view |
| `nursing` | true | false | true | create, view, edit_own_draft, sign_own |
| `bht` | false | false | true | view only |
| `aftercare_staff` | false | false | true | limited (patient.list.view) |
| `billing_user` | false | false | true | none |
| `hr_user` | false | false | true | none |
| `security_admin` | false | true | false | none (admin only) |

**Permission enforcement:** `authorizationService.ts` evaluates each grant individually. A permission from one facility-scoped assignment never inherits scope from another. Patient-access grants (`sos_patient_access`) are also evaluated per-grant with exact FK binding to the source `sos_role_assignment`.

---

## 6. Existing Patient-Assignment Rules

`sos_patient_access` rows bind a user to a patient with:
- Composite FK to `(org_id, facility_id, patient_id, user_id)` — all four must resolve
- `role_assignment_id` FK → `sos_role_assignments.id` (restrict) — exact binding required
- Active, non-expired, non-quarantined check at query time
- `facilityWide` roles bypass per-patient assignment for chart access

**For scheduling:** appointment creation requires the acting user to have patient access to the target patient (same rules as clinical notes). Appointments inherit the same facility boundary — a staff member at Facility A cannot create an appointment for a patient at Facility B.

---

## 7. Existing API Conventions

**Framework:** Express.js with TypeScript (`artifacts/api-server/src/`)

**Route registration:** routes registered in `src/routes/` directory, imported and mounted in `src/app.ts`. Pattern: `router.post('/v1/...', [middleware...], handler)`.

**Middleware stack (in order):**
1. `sessionAuth` — validates HttpOnly session cookie; attaches `req.user`, `req.orgId`; returns 401 if missing
2. `csrfMiddleware` — validates `X-CSRF-Token` header via double-submit; returns 403 on violation
3. `rateLimiter` — PgRateLimiter; returns 429 on excess; skip list for safe read endpoints
4. Route-level authorization (via `authorizationService.ts`)

**DTO validation:** Zod schemas, validated inline; returns 400 with field-level errors on failure.

**Error response shape:**
```json
{ "error": "string message" }
```
or for validation:
```json
{ "errors": [{ "field": "...", "message": "..." }] }
```

**Status codes used:**
- `400` — validation failure
- `401` — no valid session
- `403` — authorization denied (CSRF violation, permission check failure, wrong org/facility)
- `404` — resource not found (used for "not found within tenant scope")
- `409` — conflict (concurrency, duplicate, scheduling overlap)
- `422` — unprocessable (invalid state transition — e.g. editing a cancelled appointment)
- `429` — rate limited

**Authorization pattern:** authorization service receives `(session, operation, resource)`, checks `sos_role_assignments` for active grants, checks `sos_patient_access` where required, returns allow/deny. Denial events are written to `sos_audit_outbox`.

---

## 8. Frontend Routing and Patient-Detail Patterns

**Routing:** Hash-based client-side routing in `App.tsx`. No React Router. Screen names are string literals in a `Screen` union type. Navigation uses `window.location.hash` and `history.pushState`.

**Current Screen union** includes `AppointmentCalendar` and `GroupSchedule` (stubs) but no functional appointment implementation.

**Patient Detail (`pages/PatientDetail.tsx`):**
- Large stateful component with `activeTab` state
- Current tabs: Overview, ASAM Assessment, Progress Notes, Treatment Plan, Medications, Group Notes, Vitals, Labs, History, Discharge Plan, Documents, Consents, Contacts, Allergies, Drug Testing, Incidents, Case Management, Audit History
- **Adding "Appointments" tab follows the exact same pattern**
- Data fetching: raw `fetch` in `useEffect` on mount or tab activation
- Loading/error/empty states: local boolean state (`loading`, `error`, `forbidden`)

**API Client pattern:**
- No shared API client or TanStack Query
- Each page/tab fetches independently with raw `fetch`
- `API_BASE` constant used for the base URL
- `credentials: 'include'` on all requests
- `DEV_HEADERS` object applied in development mode

**CSRF pattern for mutations:**
- Fetch CSRF token from `GET /api/v1/auth/csrf-token` before the mutation
- Include as `X-CSRF-Token` header
- No global interceptor — each mutation path handles it independently

---

## 9. Audit / Outbox Conventions

**Append-only audit table:** `sos_auth_audit`
- Triggers block UPDATE/DELETE (enforced at DB level by migration 0002)
- Transactional events: write audit row in same `db.transaction` as the state change
- Denial events: write to `sos_audit_outbox`; worker (`auditOutboxWorker.ts`) drains into `sos_auth_audit`

**`sos_audit_outbox` columns:** all of `sos_auth_audit` identity columns plus `attempts`, `error_detail`, `processed_at`, `failed_permanently`.

**`event_type` constraint** (`ck_sos_auth_audit_event_type`) — current allowlist includes:
login_success, login_failure, logout, session_created, session_expired, session_revoked, account_locked, account_unlocked, password_reset_requested, password_reset_completed, password_changed, role_assignment_created, role_assignment_revoked, facility_assignment_changed, patient_access_created, patient_access_revoked, authorization_denied, admin_session_revocation, sessions_revoked_all, user_disabled, user_reactivated, user_created, role_grant_denied, csrf_violation, rate_limit_window_cleared,
plus Phase 3 clinical note events: `clinical_note.created`, `clinical_note.updated`, `clinical_note.signed`, `clinical_note.void_requested`, `clinical_note.voided`, `clinical_note.sign_denied`.

**Phase 4 must add** scheduling events to this constraint via migration.

---

## 10. Session, CSRF, Rate-Limit, and Authorization Middleware

- **Session:** `connect-pg-simple` backed by `sos_sessions`. HttpOnly cookie. Session carries `userId`, `orgId`, `orgSlug`. `sessionAuth` middleware injects `req.user` and `req.orgId`.
- **CSRF:** Double-submit pattern. Server sets a CSRF token in a non-HttpOnly cookie; client reads it and sends as `X-CSRF-Token` header. `csrfMiddleware` validates the match.
- **Rate limiter:** `PgRateLimiter` — DB-backed sliding window. Applied per IP (and optionally per user). Write endpoints are rate-limited; some read endpoints are skipped.
- **Authorization:** Per-operation checks in `authorizationService.ts`. Supports multi-grant evaluation (user may have multiple role assignments at different facilities). Returns first matching grant or denies.

---

## 11. Database Migration Framework

**Framework:** Drizzle Kit (`lib/db/`)

**Migration files:** `lib/db/drizzle/` — six migrations committed through Phase 3:
- `0000_perpetual_rafael_vega.sql` — base schema
- `0001_authentication_authorization.sql` — auth tables
- `0002_authorization_correction.sql` — auth hardening
- `0003_phase_2c_closure.sql` — Phase 2C security
- `0004_phase_2d_final_closure.sql` — Phase 2D hardening
- `0005_rate_limit_window_cleared_event.sql` — event type addition
- `0006_clinical_documentation_foundation.sql` — Phase 3 clinical notes

**Phase 4 will add:** `0007_scheduling_and_appointments.sql`

**Journal:** `lib/db/drizzle/meta/_journal.json` — SHA-256 tracked. Must be kept in sync.

**Pattern:** migrations are SQL files; Drizzle schema in `lib/db/src/schema/` is the source of truth. `drizzle-kit generate` produces migrations from schema diffs.

---

## 12. Playwright Setup

**Config:** `artifacts/sunrise-os/playwright.config.ts`

**Spec:** `artifacts/sunrise-os/e2e/clinical-notes-p3-browser.spec.ts` (Phase 3 reference)

**Sessions helper:** `artifacts/sunrise-os/e2e/sessions.ts` — manages test user creation, login, session cookies, CSRF tokens for browser tests.

**Global setup/teardown:** creates test users, assigns roles, establishes sessions. Cleans up rate-limit rows on teardown.

**Test users:** org/facility-scoped. Tests use `PHASE2D_TEST_PASSWORD` secret.

**Phase 4 will add:** `artifacts/sunrise-os/e2e/appointments-p4-browser.spec.ts`

---

## 13. Date/Time Utilities

No shared date/time utility module exists. Current patterns:
- `date` type for date-only fields (DOB, admission/discharge dates)
- `timestamp({ withTimezone: true })` (PostgreSQL `TIMESTAMPTZ`) for all event timestamps
- JavaScript `new Date()` used for runtime comparisons (assignment expiry checks)
- Facility carries `time_zone` (IANA string, default `America/New_York`)

**No existing timezone conversion library is imported.** Phase 4 API should accept ISO 8601 timestamps with UTC offset; store as UTC; return UTC. The frontend displays using the facility timezone by formatting with `Intl.DateTimeFormat`.

---

## 14. Existing Scheduling-Related Code

**None found.** The `AppointmentCalendar` and `GroupSchedule` screen names in the `Screen` union are stub entries in `Stubs.tsx` — no API, no database table, no repository, no service.

The competitive requirements matrix at `artifacts/sunrise-os/product-audit/02-competitive-requirements-matrix.csv` explicitly marks Appointment Calendar/Staff Scheduling as "mock or missing / no real appointment records."

**Conclusion:** Phase 4 builds scheduling from scratch. No existing code conflicts with the proposed design.
