# Phase 3 — Proposed Scope

**Phase name:** Clinical Documentation Foundation  
**Date:** 2026-08-02  
**Branch:** `planning/phase-3-scope`  
**Based on:** `main` @ `55cf0604b266358a279bc9b2f3fc5e00bddb5356`

---

## A. Phase Name

**Phase 3 — Clinical Documentation Foundation**

---

## B. Problem Statement

Sunrise OS currently stores no clinical notes in the database. Every
documentation screen (Progress Notes, Chart Review, Treatment Plans, Group
Notes, Co-sign Queue) renders mock data. Clinicians cannot create, save, sign,
or retrieve a real clinical note through the application.

This phase enables the first complete clinical documentation workflow: a
licensed clinician can create a draft individual progress note for an assigned
patient, edit it, sign it, and prevent further editing after signature. The
resulting note is stored in the database, scoped to organization, facility, and
patient, accessible to authorized staff, and fully audited.

This is the minimum coherent vertical slice that exercises the full
backend-to-frontend clinical documentation stack and demonstrates that the
Phase 1 and Phase 2 infrastructure can serve real PHI workflows.

---

## C. Primary Users

| Role | Usage |
|------|-------|
| `clinician` | Creates, edits, signs own notes |
| `supervisor` | Views notes for supervised clinicians; may add supervisor note |
| `nurse` | Creates and signs nursing notes (same workflow, different note types) |
| `admin` | Views any note within their organization |

Co-signature, amendment, and late entry are explicitly out of scope.

---

## D. Current Dependencies

### Phase 1 (already in place)

- PostgreSQL persistence
- `sos_organizations`, `sos_facilities`, `sos_patients`, `sos_episodes_of_care`
- `sos_staff_profiles` for author identity
- `sos_audit_outbox` for reliable audit delivery

### Phase 2 (already in place)

- Authenticated session (`sos_sessions`, `sos_user_accounts`)
- Role assignments (`sos_role_assignments`)
- Patient access grants (`sos_patient_access`) with exact FK binding
- Server-side permission middleware (`requirePermission`)
- CSRF protection
- `sos_auth_audit` for access events
- Patient List and Patient Detail API endpoints (scoped correctly)

---

## E. In-Scope Workflow

1. An authenticated, authorized clinician navigates to the Patient Detail
   screen for an assigned patient.
2. The clinician opens the Progress Notes tab and sees a list of existing notes
   for that patient (empty on first use).
3. The clinician clicks "New Note," selects a note type, and enters content
   in a draft form.
4. The clinician saves the draft. The note is stored in the database with
   `status = 'draft'`.
5. The clinician (or another authorized viewer) can view the note list and
   open any note.
6. The clinician can edit their own draft.
7. The clinician clicks "Sign Note." The note status transitions to `'signed'`.
   The signature timestamp and author identity are recorded.
8. Signed notes cannot be edited. The form becomes read-only.
9. Any authorized user in the same organization and facility can view signed
   notes (subject to patient-access rules).
10. Every create, view, edit, and sign action is written to `sos_auth_audit`
    (or via the outbox for non-blocking writes).

---

## F. Out-of-Scope Items

The following are explicitly excluded from this phase:

- Co-signatures and supervisor co-sign queue
- Amendments to signed notes
- Late entries
- Group notes
- Treatment plans
- Medication administration (MAR)
- ASAM assessments and biopsychosocial intakes
- Discharge summaries
- E-prescribing
- Eligibility verification
- Clearinghouse integration
- FHIR R4 or external document exchange
- AI-generated clinical content or auto-fill
- Wet/digital signatures (PDF, DocuSign)
- Note templates (complex)
- Bulk note export
- Password reset email delivery
- MFA enrollment
- CSP headers

---

## G. Proposed Database Model

### Table: `sos_clinical_notes`

**Purpose:** Stores individual clinical progress notes for a patient within an
episode of care. Append-only for signed records; draft records are mutable by
their author only.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `org_id` | UUID | NOT NULL, FK → sos_organizations(id) ON DELETE CASCADE | Tenant root |
| `facility_id` | UUID | NOT NULL, FK → sos_facilities(org_id, id) ON DELETE RESTRICT | |
| `patient_id` | UUID | NOT NULL, FK → sos_patients(org_id, id) ON DELETE RESTRICT | |
| `episode_id` | UUID | NULL, FK → sos_episodes_of_care(id) ON DELETE RESTRICT | Optional; notes may exist outside an active episode |
| `author_user_id` | UUID | NOT NULL, FK → sos_user_accounts(org_id, id) ON DELETE RESTRICT | Identity of author at write time |
| `author_staff_id` | UUID | NULL, FK → sos_staff_profiles(id) | Denormalized for display; may be NULL for admin-created notes |
| `note_type` | TEXT | NOT NULL | CHECK: `individual_progress / group_progress / nursing / physician / case_management / peer_support` |
| `status` | TEXT | NOT NULL DEFAULT 'draft' | CHECK: `draft / signed / void` |
| `content` | TEXT | NOT NULL | Plain text or lightly structured markdown; no HTML injection |
| `service_date` | DATE | NOT NULL | Date of service (not necessarily today) |
| `service_start_time` | TIME | NULL | Optional billable start time |
| `service_end_time` | TIME | NULL | Optional billable end time |
| `signed_at` | TIMESTAMPTZ | NULL | Set at signature; never updated after set |
| `signed_by_user_id` | UUID | NULL, FK → sos_user_accounts(org_id, id) | Must equal `author_user_id` in Phase 3; co-sign is out of scope |
| `version` | INTEGER | NOT NULL DEFAULT 1 | Incremented on each draft edit; used for optimistic concurrency |
| `void_reason` | TEXT | NULL | Required when status = 'void' |
| `voided_at` | TIMESTAMPTZ | NULL | Set when voided |
| `voided_by_user_id` | UUID | NULL | Who voided it |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

**Required constraints:**

- `ck_sos_clinical_notes_status` — CHECK status IN ('draft', 'signed', 'void')
- `ck_sos_clinical_notes_note_type` — CHECK note_type IN (...)
- `ck_sos_clinical_notes_service_time_order` — CHECK service_end_time IS NULL OR service_start_time IS NULL OR service_end_time >= service_start_time
- `ck_sos_clinical_notes_signed_at_consistency` — CHECK (status = 'signed') = (signed_at IS NOT NULL)
- `ck_sos_clinical_notes_void_reason` — CHECK (status = 'void') = (void_reason IS NOT NULL)
- DB trigger `sos_clinical_notes_no_edit_after_sign` — BEFORE UPDATE: raise exception if OLD.status = 'signed' and any clinical field is changing (allow only voiding)

**Foreign keys:**

- `fk_sos_clinical_notes_org` — (org_id) → sos_organizations(id) ON DELETE CASCADE
- `fk_sos_clinical_notes_facility` — (org_id, facility_id) → sos_facilities(org_id, id) ON DELETE RESTRICT
- `fk_sos_clinical_notes_patient` — (org_id, patient_id) → sos_patients(org_id, id) ON DELETE RESTRICT
- `fk_sos_clinical_notes_episode` — (episode_id) → sos_episodes_of_care(id) ON DELETE RESTRICT (nullable)
- `fk_sos_clinical_notes_author` — (org_id, author_user_id) → sos_user_accounts(org_id, id) ON DELETE RESTRICT
- `fk_sos_clinical_notes_signed_by` — (org_id, signed_by_user_id) → sos_user_accounts(org_id, id) ON DELETE RESTRICT (nullable)

**Indexes:**

- `idx_sos_clinical_notes_patient` — (org_id, patient_id, service_date DESC) — primary query pattern
- `idx_sos_clinical_notes_author` — (org_id, author_user_id, status) — author's draft list
- `idx_sos_clinical_notes_episode` — (episode_id) WHERE episode_id IS NOT NULL
- `idx_sos_clinical_notes_facility_date` — (org_id, facility_id, service_date DESC) — supervisor view

**Soft-delete policy:** Records are not hard-deleted. Draft notes may be voided
by their author. Signed notes may only be voided by a supervisor or admin, with
a documented reason. Void is a status transition, not a DELETE.

**Retention:** No automated deletion. PHI retention per organization policy
and applicable state law. This table has no TTL or purge logic.

---

## H. Authorization Matrix

| Operation | Permission code | Allowed roles | Org scope | Facility scope | Patient-assignment required | Ownership required | Draft vs signed | Minimum-necessary fields | Denial behavior | Audit event |
|-----------|----------------|---------------|-----------|----------------|-----------------------------|--------------------|-----------------|--------------------------|-----------------|-------------|
| Create draft | `notes:create` | clinician, nurse, case_manager, supervisor | Org match | Facility match | Yes (sos_patient_access) | — | Draft only | — | 403 | `clinical_note_created` |
| View note list | `notes:read` | clinician, nurse, case_manager, supervisor, admin | Org match | Facility match | Yes (restricted roles) | — | Both | Exclude full content from list; return note_type, status, service_date, author name | 403 | `clinical_note_list_viewed` |
| View note detail | `notes:read` | clinician, nurse, case_manager, supervisor, admin | Org match | Facility match | Yes (restricted roles) | — | Both | Full content | 403 | `clinical_note_viewed` |
| Edit draft | `notes:edit_own_draft` | clinician, nurse, case_manager, supervisor | Org match | Facility match | Yes | Must be author | Draft only | — | 403 / 409 if signed | `clinical_note_updated` |
| Sign | `notes:sign` | clinician, nurse, case_manager, supervisor | Org match | Facility match | Yes | Must be author | Draft only | — | 403 / 409 if already signed | `clinical_note_signed` |
| Void (own draft) | `notes:void_own_draft` | clinician, nurse, case_manager, supervisor | Org match | Facility match | Yes | Must be author | Draft only | — | 403 | `clinical_note_voided` |
| Void (any) | `notes:void_any` | admin, supervisor | Org match | Facility match | — | — | Both | — | 403 | `clinical_note_voided` |

---

## I. API Proposal

### `POST /api/v1/patients/:patientId/notes`

| Field | Value |
|-------|-------|
| Permission | `notes:create` |
| Request body | `{ note_type, service_date, content, episode_id?, service_start_time?, service_end_time? }` |
| Validation | note_type in allowlist; service_date ≤ today; content non-empty, ≤ 32000 chars; time order if both present |
| Response | `201 { id, patient_id, note_type, status: 'draft', service_date, created_at, version }` |
| Scope | org_id, facility_id, patient_id all derived from session + patient record |
| Audit event | `clinical_note_created` |
| Error responses | 400 (validation), 403 (permission/access), 404 (patient not found) |
| Concurrency | N/A — create is always a new record |

### `GET /api/v1/patients/:patientId/notes`

| Field | Value |
|-------|-------|
| Permission | `notes:read` |
| Query params | `status?`, `note_type?`, `page?`, `page_size?` (max 50) |
| Response | `200 { notes: [{ id, note_type, status, service_date, author_name, signed_at? }], total, page }` — no full content |
| Scope | org_id, facility_id, patient access enforced |
| Audit event | `clinical_note_list_viewed` |
| Error responses | 403, 404 |

### `GET /api/v1/patients/:patientId/notes/:noteId`

| Field | Value |
|-------|-------|
| Permission | `notes:read` |
| Response | `200 { id, note_type, status, service_date, content, author_name, signed_at?, version }` |
| Scope | org_id, facility_id, patient access enforced |
| Audit event | `clinical_note_viewed` |
| Error responses | 403, 404 |

### `PATCH /api/v1/patients/:patientId/notes/:noteId`

| Field | Value |
|-------|-------|
| Permission | `notes:edit_own_draft` |
| Request body | `{ content?, service_date?, service_start_time?, service_end_time?, version }` (version required for concurrency) |
| Validation | Same field rules as create; version must match current record |
| Response | `200 { id, status, version, updated_at }` |
| Scope | Must be author; note must be draft |
| Audit event | `clinical_note_updated` |
| Error responses | 400, 403, 404, 409 (version conflict or already signed) |
| Concurrency | Optimistic: `WHERE id = $id AND version = $version`; if 0 rows updated → 409 |

### `POST /api/v1/patients/:patientId/notes/:noteId/sign`

| Field | Value |
|-------|-------|
| Permission | `notes:sign` |
| Request body | `{ version }` |
| Validation | Note must be draft; version must match |
| Response | `200 { id, status: 'signed', signed_at, version }` |
| Scope | Must be author; org + facility + patient access enforced |
| Audit event | `clinical_note_signed` |
| Error responses | 403, 404, 409 (already signed or version conflict) |
| Concurrency | Optimistic: same version check |

### `POST /api/v1/patients/:patientId/notes/:noteId/void`

| Field | Value |
|-------|-------|
| Permission | `notes:void_own_draft` (draft) or `notes:void_any` (any status) |
| Request body | `{ reason, version }` |
| Validation | reason required and non-empty |
| Response | `200 { id, status: 'void', voided_at }` |
| Audit event | `clinical_note_voided` |
| Error responses | 403, 404, 409 |

---

## J. Frontend Proposal

### Entry Point

Progress Notes tab within `PatientDetail` screen, or via the standalone
`ProgressNotes` screen filtered to the current clinician's caseload.

### Patient Context

All note actions are scoped to a specific patient. The patient's name, MRN,
and current episode dates are shown in the screen header.

### List / Timeline View

- Chronological list of notes (newest first), grouped by date
- Each row: note type badge, service date, author name, status badge
  (draft / signed / void)
- "New Note" button (hidden if user lacks `notes:create`)
- Empty state: "No notes for this patient yet" with a "Create First Note" CTA

### Draft Form

- Note type selector (dropdown from allowlist)
- Service date picker (default today; cannot exceed today)
- Optional: service start/end time
- Content textarea (plain text; character count shown; 32 000-char max)
- "Save Draft" button (disabled while unchanged)
- "Sign Note" button (requires confirmation modal; disabled on unsigned content)
- Unsaved-change warning on navigation away

### Read-Only Signed View

- All fields shown as read-only
- Signed-by name, timestamp, and credential displayed in a signature badge
- "Void" action available to supervisors / admins (requires reason input)

### Loading State

- Skeleton loaders for list and detail views
- Optimistic UI: locally update draft content before server confirms; revert on error

### Empty State

- Patient has no notes: empty-state illustration with "Create First Note"
- Patient has notes but filtered to zero: "No notes match the current filter"

### Validation State

- Inline field errors (note type required, service date range, content length)
- "Sign Note" disabled until form is clean and content is non-empty

### Save Failure

- Toast: "Failed to save draft — your changes are preserved locally"
- Retry button
- Offline draft is not persisted across sessions (browser memory only)

### Permission Denial

- "New Note" button hidden for roles without `notes:create`
- Attempting to access a patient without access → redirect to Patient List + toast

### Concurrent-Edit Conflict

- PATCH returns 409 with `conflict: true`
- UI shows a conflict banner: "Another change was made to this note. Reload to see the latest version."
- Do not silently overwrite

### Demo-Mode Behavior

- In demo mode (devIdentityMiddleware active), use the same real API; demo data is seeded by the test seed
- No special mock path — demo must go through the real authentication and note endpoints

---

## K. Audit-Event Inventory

| Event type | Trigger | Recorded on `sos_auth_audit` |
|------------|---------|------------------------------|
| `clinical_note_created` | Successful POST (create draft) | Yes |
| `clinical_note_list_viewed` | Successful GET (list) | Yes |
| `clinical_note_viewed` | Successful GET (detail) | Yes |
| `clinical_note_updated` | Successful PATCH (edit draft) | Yes |
| `clinical_note_signed` | Successful POST /sign | Yes |
| `clinical_note_voided` | Successful POST /void | Yes |
| `authorization_denied` (existing) | Any 403 response | Yes (existing mechanism) |

The `ck_sos_auth_audit_event_type` constraint must be expanded in the Phase 3
migration to include the six new clinical note event types.

---

## L. Testing Strategy

### Unit Tests

- Zod validation schemas for each request body
- `service_date` boundary (today vs. future)
- Content length boundary
- Note type allowlist
- Time-order validation

### PostgreSQL Integration Tests

- `sos_clinical_notes` table creation and constraint enforcement
- `ck_sos_clinical_notes_signed_at_consistency` — signed notes must have `signed_at`
- `ck_sos_clinical_notes_void_reason` — voided notes must have `void_reason`
- `sos_clinical_notes_no_edit_after_sign` trigger — UPDATE rejected after sign
- Optimistic-concurrency version increment on UPDATE
- FK enforcement (org_id, facility_id, patient_id, author_user_id)

### Migration Tests

- Fresh database: apply all migrations including Phase 3; verify all tables and constraints
- Re-run migrations: confirm no pending changes
- No data loss on upgrade (existing patients, sessions, users unaffected)

### Real HTTP Tests (supertest)

- `POST .../notes` — creates draft, returns 201
- `POST .../notes` without patient access — returns 403
- `GET .../notes` — returns list without full content
- `GET .../notes/:id` — returns full content for authorized user
- `PATCH .../notes/:id` — edits draft; version increments
- `PATCH .../notes/:id` with stale version — returns 409
- `PATCH .../notes/:id` on signed note — returns 409
- `POST .../notes/:id/sign` — transitions to signed; subsequent PATCH rejected
- `POST .../notes/:id/void` — transitions to void with reason
- `POST .../notes/:id/void` without reason — returns 400

### Authorization Tests

- Clinician can create, read, edit, sign own draft
- Clinician cannot edit another clinician's draft
- Clinician cannot sign another clinician's draft
- Supervisor can view any note in their facility
- Admin can view any note in their org
- Billing specialist cannot create notes (lacks `notes:create`)
- Cross-org attempt returns 403 or 404

### Cross-Organization Tests

- Note created for org A is not accessible from org B session

### Cross-Facility Tests

- Note in facility A is not accessible by a user assigned only to facility B

### Patient-Assignment Tests

- Clinician without `sos_patient_access` row for this patient cannot create or view notes

### Ownership Tests

- Only the author can edit their own draft
- Author can void their own draft; non-author clinician cannot

### Draft/Signature State Tests

- Draft → signed transition is idempotent (second sign attempt returns 409)
- Signed → cannot edit content
- Void reason is required when voiding

### Concurrency Tests

- Two simultaneous PATCH requests with the same version: one succeeds, one gets 409

### Field-Projection Tests

- List response does not include `content` field
- Detail response includes all fields

### Browser Tests (Playwright)

- Clinician persona: login → Patient List → Patient Detail → create draft → save → sign
- Supervisor persona: login → view signed note → attempt edit (must fail gracefully)
- Concurrent edit scenario: two browser contexts, one gets 409 conflict banner

### Human Persona Verification

- Clinician: create, save, sign a note for a real test patient; verify it persists across browser reload
- Supervisor: view the signed note; confirm read-only badge; void attempt with reason
- Admin: view note list for any patient in the organization

---

## M. Migration Strategy

Phase 3 requires one new migration:

`0006_clinical_documentation_foundation.sql`

Steps:
1. Create `sos_clinical_notes` table with all constraints and indexes
2. Add `sos_clinical_notes_no_edit_after_sign` trigger function and trigger
3. Expand `ck_sos_auth_audit_event_type` to add 6 new event types

Apply via `drizzle-kit generate` + `drizzle-kit migrate`. Run against a fresh
empty database first to prove migration applies cleanly. Run again to confirm
no pending changes. Seed test data; run full test suite.

The migration must be fully reversible: dropping `sos_clinical_notes` and the
new trigger/constraint removes all Phase 3 schema without affecting existing
Phase 1–2 tables.

---

## N. Acceptance Criteria

| # | Criterion | Pass/Fail |
|---|-----------|-----------|
| 1 | Authenticated clinician can create a draft note via the API | Pass/Fail |
| 2 | Draft note is retrievable after server restart | Pass/Fail |
| 3 | Clinician can edit their own draft | Pass/Fail |
| 4 | Clinician cannot edit another clinician's draft (403) | Pass/Fail |
| 5 | Clinician can sign their draft; signed_at is set | Pass/Fail |
| 6 | Signed note cannot be edited (409) | Pass/Fail |
| 7 | Signed note content is viewable by authorized users | Pass/Fail |
| 8 | Unauthorized user (no patient access) receives 403 | Pass/Fail |
| 9 | Cross-organization request receives 403 or 404 | Pass/Fail |
| 10 | Optimistic-concurrency conflict returns 409 | Pass/Fail |
| 11 | All 6 audit event types are written to sos_auth_audit | Pass/Fail |
| 12 | All existing 444 tests continue to pass after Phase 3 migration | Pass/Fail |
| 13 | `drizzle-kit migrate` on fresh DB reports no pending migrations | Pass/Fail |
| 14 | TypeScript 0 errors across all packages | Pass/Fail |
| 15 | Browser persona: clinician creates and signs a note end-to-end | Pass/Fail |

---

## O. Risks and Decisions

| # | Risk / Decision | Owner | Notes |
|---|----------------|-------|-------|
| 1 | PHI stored as plaintext — no field-level encryption | Product / Security | Acceptable for development; must be addressed before production go-live with real patients |
| 2 | No MFA requirement for note signing | Security | Signing is the legally binding act; MFA at sign time reduces risk significantly; deferred |
| 3 | `note_type` allowlist must align with billing codes | Clinical / Billing | Progress note types map to CPT service codes; wrong type = claim denial |
| 4 | Time zone for `service_date` | Engineering / Clinical | Server stores in UTC; display converts to facility time zone; `service_date` is a DATE (no TZ ambiguity) |
| 5 | Content format: plain text vs. structured | Product / Clinical | Structured templates (BIRP, DAP, SOAP) exist in the UI but are not in scope for Phase 3 backend; plain text only |
| 6 | DB-level role enforcement for audit immutability | Security | The existing `sos_clinical_notes_no_edit_after_sign` trigger prevents application-level edits; DB-role enforcement deferred |
| 7 | Voiding signed notes | Compliance / Legal | Voiding is a legal act in behavioral health records; requires justification and audit trail; this design satisfies minimum requirement |
| 8 | Product roadmap conflict: Phase 3 should be Integrations | Product | See Phase 3 Decision Summary; human approval required |
