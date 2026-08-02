# Phase 3 — Current-State Inventory

**Date:** 2026-08-02  
**Based on:** `main` @ `55cf0604b266358a279bc9b2f3fc5e00bddb5356`

---

## 1. Existing Platform Capabilities

### Persistence

PostgreSQL 16 via Drizzle ORM (v7). Schema managed through versioned migration
files under `lib/db/drizzle/`. Six migrations applied (0000–0005). Migration
journal reconciled on 2026-08-02 — all six records present and verified.

### Organizations and Facilities

- `sos_organizations` — tenant root, identified by `slug` for login
- `sos_facilities` — facility per org; role assignments and patient access are
  facility-scoped
- Organization status lifecycle: `active / inactive / suspended`
- Facility status lifecycle: `active / inactive / closed`

### Staff Identities

- `sos_user_identity_refs` — identity anchor (org-scoped); linked to
  `sos_staff_profiles` for clinical metadata (name, credentials, license)
- `sos_user_accounts` — local-auth credential record; argon2id password hash,
  account lockout, session versioning, MFA status (disabled/totp_pending/
  totp_active/webauthn_active — enrollment not yet implemented)

### Authentication

- Session-based authentication via express-session + connect-pg-simple
- Login: `POST /api/v1/auth/login` (email + password + org slug)
- CSRF: pre-login token (`GET /api/v1/auth/csrf-token`); double-submit cookie
  pattern
- Password reset: `POST /api/v1/auth/password-reset/request` and `.../complete`
  — email delivery deferred (returns 503)
- MFA enrollment: deferred
- CSP hardening: deferred

### Sessions

- `sos_sessions` table (connect-pg-simple compatible + compliance columns)
- Session versioning: bumping `session_version` on `sos_user_accounts`
  immediately invalidates all existing sessions for that user
- Revocation metadata: `revoked_at`, `revoked_reason` per session row

### Authorization

- Middleware stack: CSRF verification → `sessionAuth` → `requirePermission`
- `devIdentityMiddleware` — development-only identity injection; disabled
  when `DISABLE_AUTH_FALLBACK=true` or `NODE_ENV=production`
- Permission codes enforced server-side via `permissionsMap` (role → Set of
  permission strings)
- Roles implemented: `admin`, `clinician`, `nurse`, `case_manager`,
  `billing_specialist`, `compliance_officer`, `supervisor`, `peer_support`

### Scoped Grants

- `sos_role_assignments` — role assigned at org + optional facility scope;
  `effective_at` / `expires_at` temporal bounds; `status`: active/revoked/expired
- Admin route: `POST /api/v1/admin/role-assignments`

### Patient Access

- `sos_patient_access` — explicit caseload assignments for restricted roles;
  FK-linked to `sos_role_assignments` via `role_assignment_id` (Phase 2D exact
  binding)
- Triggers enforce facility consistency and assignment integrity on
  INSERT/UPDATE
- Backfill of NULL `role_assignment_id` rows completed (Phase 2D)
- `quarantined_reason` column records revocation cause for ambiguous rows

### Patient List

- `GET /api/v1/patients` — returns paginated patient list scoped to the
  authenticated user's org + facility assignment + patient-access grants
- Minimum-necessary field projection applied; no PHI beyond clinically
  necessary fields returned to restricted roles

### Patient Detail

- `GET /api/v1/patients/:id` — full patient record with org/facility/
  access-grant scope enforcement; returns 403 for unauthorized access
- `GET /api/v1/patients/:id/episode` — current episode of care

### Episode Data

- `sos_episodes_of_care` — admission/discharge dates, program, level of care,
  episode status (active/discharged/transferred/completed/void)
- Date-order constraint enforced at DB level

### Audit Events

- `sos_auth_audit` — append-only auth/authorization event log; no UPDATE or
  DELETE (database trigger enforces)
- 25 event types enforced by `ck_sos_auth_audit_event_type`
- Outbox pattern: `sos_audit_outbox` with `failed_permanently` column and
  outbox worker for reliable delivery
- Admin IP-release event: `rate_limit_window_cleared`

### Rate Limiting

- `sos_rate_limit_windows` — PostgreSQL-backed shared rate-limit store
- Survives API restarts; shared across instances
- Admin release: `DELETE /api/v1/admin/rate-limit/windows/:key`

### Administrative Controls

- `POST /api/v1/admin/users` — create user (admin scope required)
- `POST /api/v1/admin/users/:id/disable` — disable user
- `POST /api/v1/admin/users/:id/reactivate` — reactivate user
- `POST /api/v1/admin/sessions/:userId/revoke-all` — revoke all sessions

### Demo vs Production Modes

- `devIdentityMiddleware` injects a development identity in non-production
  environments when no session is present; disabled in production and when
  `DISABLE_AUTH_FALLBACK=true`
- Seed data: `authSeed.ts` creates 17 test users with argon2id hashes;
  idempotent; used by integration tests

---

## 2. Existing Database Entities

| Table | Responsibility |
|-------|----------------|
| `grow_users` | Grow motivational app user accounts |
| `grow_user_state` | Grow app per-user state blob |
| `conversations` | Anthropic chat conversations |
| `messages` | Chat messages |
| `compliance_audit_state` | SunriseOS compliance audit state per org |
| `sos_organizations` | Tenant root records |
| `sos_facilities` | Facilities per organization |
| `sos_user_identity_refs` | Org-scoped identity anchors |
| `sos_staff_profiles` | Clinical staff metadata (name, credentials, license) |
| `sos_patients` | Patient master records |
| `sos_episodes_of_care` | Admission/discharge episodes per patient |
| `sos_user_accounts` | Local-auth credentials and lockout state |
| `sos_sessions` | Server-side session store |
| `sos_role_assignments` | Role grants per user per org/facility |
| `sos_patient_access` | Explicit caseload assignments (restricted roles) |
| `sos_auth_audit` | Append-only authentication/authorization event log |
| `sos_audit_outbox` | Reliable audit event delivery queue |
| `sos_rate_limit_windows` | Shared PostgreSQL-backed rate-limit store |

---

## 3. Existing API Endpoints

All SunriseOS routes are mounted under `/api`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health/live` | Liveness probe |
| GET | `/api/health/ready` | Readiness probe (DB ping) |
| GET | `/api/v1/auth/csrf-token` | Issue pre-login CSRF token |
| POST | `/api/v1/auth/login` | Authenticate with email + password + org slug |
| POST | `/api/v1/auth/logout` | Destroy session |
| GET | `/api/v1/auth/session` | Return current session identity |
| POST | `/api/v1/auth/password-reset/request` | Request password-reset email (503, email deferred) |
| POST | `/api/v1/auth/password-reset/complete` | Complete password reset |
| POST | `/api/v1/admin/users` | Create user (admin) |
| POST | `/api/v1/admin/users/:id/disable` | Disable user (admin) |
| POST | `/api/v1/admin/users/:id/reactivate` | Reactivate user (admin) |
| POST | `/api/v1/admin/sessions/:userId/revoke-all` | Revoke all sessions for user (admin) |
| DELETE | `/api/v1/admin/rate-limit/windows/:key` | Release rate-limit window (admin) |
| POST | `/api/v1/admin/role-assignments` | Create role assignment (admin) |
| GET | `/api/v1/patients` | List patients (scoped) |
| GET | `/api/v1/patients/:id` | Get patient detail (scoped) |
| GET | `/api/v1/patients/:id/episode` | Get current episode (scoped) |
| GET | `/api/census` | Census data (legacy route) |
| GET/PUT | `/api/compliance/audit-state` | Compliance audit state |
| DELETE | `/api/compliance/audit-log` | Reset audit log |
| POST | `/api/contact` | Contact form submission |
| POST | `/api/subscribe` | Email subscription |
| GET/POST/PATCH/DELETE | `/api/conversations*` | Anthropic chat conversations |
| POST | `/api/alerts/vitals` / GET | Vitals alert store |
| GET/POST | `/api/grow/*` | Grow motivational app routes |

---

## 4. Existing Frontend Screens

The Sunrise OS frontend (`artifacts/sunrise-os`) has 54 screens. All are
currently powered by mock data (`data/mockPatients.ts`, `data/mockStaff.ts`,
etc.). The authentication flow (`/login`) is fully wired to the real API.

**Connected to real API (authentication):**
- Login / session management — real API calls to `/api/v1/auth/*`
- Patient List — reads from `/api/v1/patients` (real API)
- Patient Detail — reads from `/api/v1/patients/:id` (real API)

**Mock data (54 screens):**

| Section | Screens |
|---------|---------|
| Overview | Dashboard, Command Center |
| Clinical | Census & Bed Board, Patient List*, Admissions, Discharges, MAT Management, Family Engagement, Physician Orders, Peer Support, Telehealth Consults |
| Documentation | Chart Review, Progress Notes, Treatment Plans, ASAM Assessments, Biopsychosocial Intake, Discharge Summary, Medical Records/ROI, Group Notes, Co-sign Queue, My Caseload |
| Scheduling | Appointment Calendar, Group Schedule, Group Curriculum Library, Staff Scheduling |
| Risk & Outcomes | Risk Dashboard, Recovery Engagement Score, Outcome Tracking, Population Analytics, UA/Drug Testing, Incident Reports, Crisis Assessment |
| Nursing | Medication MAR, Shift Handoff |
| Operations | Referral Tracker, Waitlist Manager, Business Development, Bed Management, Insurance Auth/UR, Aftercare Planning, Alumni Program |
| Billing & Compliance | Revenue Cycle, Financial Counseling, Audit Readiness, Quality Improvement, Training, Formulary & Drug Ref |
| Supervision | Clinical Supervision, Certification Tracker |
| Communications | Secure Messaging |
| Other | Settings, Help & Support, Patient Detail* |

*Partially connected to real API.

---

## 5. Deferred or Placeholder Functionality

These items are visible in the UI or mentioned in code but do not have a
complete server-side implementation:

| Item | Current State | Notes |
|------|--------------|-------|
| Password reset email delivery | Returns 503 | Email infrastructure not implemented |
| MFA enrollment | Status column exists, enrollment flow absent | `mfa_status` column present; TOTP/WebAuthn not wired |
| CSP headers | Not configured | Noted as Phase 3 item in runbook |
| Clinical note creation | UI mockup only | Progress Notes screen is mock data; no backend note entity |
| Treatment plan workflow | UI mockup only | Treatment Plans screen is mock data; no backend entity |
| Medication administration (MAR) | UI mockup only | NursingMAR screen is mock data; no backend entity |
| Discharge summary finalization | UI mockup only | DischargeSummary screen is mock data; no backend entity |
| Group note workflow | UI mockup only | GroupNotes screen is mock data; no backend entity |
| Co-sign queue | UI mockup only | CosignQueue screen is mock data; no backend entity |
| Drug testing | UI mockup only | UADrugTesting screen is mock data; no backend entity |
| Eligibility verification | Not implemented | Product roadmap Phase 3 item |
| Clearinghouse integration | Not implemented | Product roadmap Phase 3 item |
| E-prescribing | Not implemented | Product roadmap Phase 3 item |
| FHIR R4 interoperability | Not implemented | Product roadmap Phase 3 item |
| AI clinical note generation | UI components exist | Backend AI note generation deferred |
| Wet signatures | UI component exists | Backend storage for signed notes deferred |
| DB-level append-only audit role enforcement | Trigger exists | PostgreSQL role restriction deferred |

---

## 6. Technical Debt Relevant to Phase 3

| Item | Impact on Next Vertical Slice |
|------|-------------------------------|
| No clinical entity tables | Any clinical documentation feature requires new migration; no existing tables to extend |
| All clinical screens are mock-only | Phase 3 must wire the first real clinical endpoint into the existing screen structure |
| `devIdentityMiddleware` present | Must be explicitly disabled in any new production route test |
| Migration journal was out of sync | Reconciled as of this branch; must maintain `drizzle-kit migrate` discipline going forward |
| Password reset deferred | Clinicians cannot self-recover accounts; admin-initiated reset is the only path |
| MFA deferred | High-risk clinical-note signing should eventually require MFA; out of scope for Phase 3 but constrains sign-off requirements |
| No field-level encryption | PHI in clinical notes will be stored as plaintext until a future encryption layer is added |
