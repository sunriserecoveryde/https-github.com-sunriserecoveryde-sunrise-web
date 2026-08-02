# Phase 3 — Clinical Documentation Foundation
## Replit Implementation Prompt

**Do not implement this prompt until a human reviewer has approved the
Phase 3 scope.**  
**Do not merge automatically.**

---

## Starting Commit

`55cf0604b266358a279bc9b2f3fc5e00bddb5356` (verified `main` HEAD after Phase 2
post-merge verification and migration journal reconciliation)

---

## Proposed Branch Name

`readiness/p3-clinical-documentation-foundation`

---

## Objective

Implement the Clinical Documentation Foundation vertical slice: a complete,
tested, server-enforced clinical note workflow that allows an authorized
clinician to create, save, edit, sign, and view individual progress notes for
assigned patients. No clinical note capability exists today; this phase
introduces the first real PHI-bearing clinical entity in the system.

The implementation must not change any Phase 1 or Phase 2 behavior. All 444
existing tests must continue to pass.

---

## In-Scope Items

1. One new database table: `sos_clinical_notes`
2. One new migration: `0006_clinical_documentation_foundation.sql`
3. Six new API endpoints under `/api/v1/patients/:patientId/notes`
4. Six new permission codes added to `permissionsMap`
5. Six new audit event types added to `ck_sos_auth_audit_event_type`
6. Progress Notes tab in `PatientDetail` wired to real API
7. Standalone `ProgressNotes` screen updated to call real API for the
   authenticated clinician's notes
8. Full automated test suite covering all acceptance criteria

---

## Out-of-Scope Items

- Co-signatures and supervisor co-sign queue
- Amendments to signed notes
- Late entries
- Group notes
- Treatment plans
- Medication administration (MAR)
- ASAM assessments, biopsychosocial intakes, discharge summaries
- E-prescribing, eligibility, clearinghouse, FHIR
- AI-generated clinical content
- Wet signatures / PDF / DocuSign
- Complex note templates (BIRP, DAP, SOAP structured fields)
- Note export or printing
- Password reset email delivery
- MFA enrollment
- CSP headers
- Field-level encryption

---

## Database Requirements

Create table `sos_clinical_notes` with:

- `id` UUID PK DEFAULT gen_random_uuid()
- `org_id` UUID NOT NULL FK → sos_organizations(id) ON DELETE CASCADE
- `facility_id` UUID NOT NULL FK → sos_facilities(org_id, id) ON DELETE RESTRICT
- `patient_id` UUID NOT NULL FK → sos_patients(org_id, id) ON DELETE RESTRICT
- `episode_id` UUID NULL FK → sos_episodes_of_care(id) ON DELETE RESTRICT
- `author_user_id` UUID NOT NULL FK → sos_user_accounts(org_id, id) ON DELETE RESTRICT
- `author_staff_id` UUID NULL FK → sos_staff_profiles(id)
- `note_type` TEXT NOT NULL CHECK IN ('individual_progress','group_progress','nursing','physician','case_management','peer_support')
- `status` TEXT NOT NULL DEFAULT 'draft' CHECK IN ('draft','signed','void')
- `content` TEXT NOT NULL
- `service_date` DATE NOT NULL
- `service_start_time` TIME NULL
- `service_end_time` TIME NULL
- `signed_at` TIMESTAMPTZ NULL
- `signed_by_user_id` UUID NULL FK → sos_user_accounts(org_id, id)
- `version` INTEGER NOT NULL DEFAULT 1
- `void_reason` TEXT NULL
- `voided_at` TIMESTAMPTZ NULL
- `voided_by_user_id` UUID NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

Required constraints:
- `ck_sos_clinical_notes_status` — CHECK status IN (...)
- `ck_sos_clinical_notes_note_type` — CHECK note_type IN (...)
- `ck_sos_clinical_notes_service_time_order` — end >= start when both present
- `ck_sos_clinical_notes_signed_at_consistency` — signed iff signed_at IS NOT NULL
- `ck_sos_clinical_notes_void_reason` — voided iff void_reason IS NOT NULL

Required trigger:
- `sos_clinical_notes_no_edit_after_sign` — BEFORE UPDATE: raise exception if
  OLD.status = 'signed' and any of (content, service_date, note_type,
  service_start_time, service_end_time) are being changed

Required indexes:
- `idx_sos_clinical_notes_patient` — (org_id, patient_id, service_date DESC)
- `idx_sos_clinical_notes_author` — (org_id, author_user_id, status)
- `idx_sos_clinical_notes_episode` — (episode_id) WHERE episode_id IS NOT NULL
- `idx_sos_clinical_notes_facility_date` — (org_id, facility_id, service_date DESC)

---

## Authorization Requirements

Add six permission codes to the role permission map:

| Permission code | Allowed roles |
|----------------|---------------|
| `notes:create` | clinician, nurse, case_manager, supervisor |
| `notes:read` | clinician, nurse, case_manager, supervisor, admin |
| `notes:edit_own_draft` | clinician, nurse, case_manager, supervisor |
| `notes:sign` | clinician, nurse, case_manager, supervisor |
| `notes:void_own_draft` | clinician, nurse, case_manager, supervisor |
| `notes:void_any` | admin, supervisor |

All note operations require:
- Session authentication (no dev-identity fallback in tests)
- Org-ID match between session and note
- Facility-ID match
- Patient-access grant (sos_patient_access row) for restricted roles
- Ownership check where specified (edit_own_draft, sign, void_own_draft)

---

## API Requirements

Mount all routes under `/api/v1/patients/:patientId/notes`.

| Method | Path suffix | Permission | Notes |
|--------|------------|------------|-------|
| POST | `/` | `notes:create` | Create draft; 201 |
| GET | `/` | `notes:read` | List; no content field; 200 |
| GET | `/:noteId` | `notes:read` | Full detail; 200 |
| PATCH | `/:noteId` | `notes:edit_own_draft` | Optimistic concurrency; 200 |
| POST | `/:noteId/sign` | `notes:sign` | Optimistic concurrency; 200 |
| POST | `/:noteId/void` | `notes:void_own_draft` or `notes:void_any` | Reason required; 200 |

All endpoints must:
- Verify CSRF token
- Derive scope (org_id, facility_id) from session + patient record, not from request body
- Return 403 for permission failures, 404 for not-found (do not leak existence to unauthorized callers)
- Write the appropriate audit event to sos_auth_audit on success

---

## Frontend Requirements

Wire the Progress Notes tab within `PatientDetail` to the new API:

- Fetch `GET /api/v1/patients/:id/notes` on tab mount
- Show loading skeleton while fetching
- Show empty state when list is empty
- Render note list (note_type, service_date, author name, status badge)
- Open note detail on row click → `GET .../notes/:noteId`
- "New Note" button → form (note_type selector, service_date, content textarea)
- "Save Draft" → `POST .../notes`
- "Sign Note" → confirmation modal → `POST .../notes/:noteId/sign`
- Optimistic-concurrency conflict (409) → conflict banner
- Permission denial → hide "New Note" button; show "View Only" label
- All form validation must also be enforced server-side

Update `ProgressNotes` standalone screen to list the authenticated clinician's
own notes across their caseload (read-only list; link through to PatientDetail
for editing).

---

## Audit Requirements

Add six event types to `ck_sos_auth_audit_event_type`:
- `clinical_note_created`
- `clinical_note_list_viewed`
- `clinical_note_viewed`
- `clinical_note_updated`
- `clinical_note_signed`
- `clinical_note_voided`

Write each event to `sos_auth_audit` (or via `sos_audit_outbox` for async
paths) with `org_id`, `user_id`, `patient_id` (in metadata), `outcome`, and
`ip_address`.

---

## Migration Requirements

1. Generate migration `0006_clinical_documentation_foundation.sql` using
   `drizzle-kit generate`.
2. Apply via `drizzle-kit migrate` on a fresh empty database first.
3. Verify all new tables, constraints, triggers, and indexes are present.
4. Verify no existing Phase 1–2 tables are modified.
5. Verify `ck_sos_auth_audit_event_type` includes all 31 event types.
6. Re-run migrate; confirm no pending migrations.
7. Apply to development database via `drizzle-kit migrate`.
8. Confirm `drizzle.__drizzle_migrations` has exactly 7 records.

---

## Test Requirements

Minimum test counts:

| Category | Minimum tests |
|----------|--------------|
| Unit (Zod validation) | 15–20 |
| PostgreSQL constraint / trigger tests | 10–15 |
| Migration tests (fresh DB) | 5 |
| Real HTTP tests (supertest) | 30–40 |
| Authorization tests | 20–25 |
| Cross-org / cross-facility / cross-patient tests | 10 |
| Ownership tests | 8 |
| Draft/signature state tests | 10 |
| Concurrency tests | 5 |
| Field projection tests | 4 |

**All 444 existing tests must continue to pass.**  
New total minimum: **560 tests** (444 existing + ~116 new).

---

## Browser Evidence

Provide Playwright test covering:

1. Clinician persona: login → Patient List → Patient Detail → Progress Notes tab
   → create draft → save → verify draft appears in list → sign → verify
   signed badge → reload → verify note persists
2. Clinician persona: attempt to edit signed note → verify form is read-only
3. Supervisor persona: login → view signed note → void with reason → verify
   voided badge

Save Playwright test report and at minimum three screenshots as evidence:
- Draft note saved
- Note signed (read-only view with signature badge)
- Concurrent-edit 409 conflict banner (can be provoked in test)

---

## Review-Package Requirements

Create `artifacts/sunrise-os/readiness/phase-3/phase-3-review-package.md`
containing:

- Starting commit
- Final commit hash
- Branch name
- Migration file name and SHA-256
- Test result: pass count / fail count / skip count
- TypeScript result: 0 errors
- Production build result
- `drizzle-kit migrate` result (fresh DB)
- `drizzle-kit migrate` result (dev DB)
- Browser test result
- Screenshot evidence paths
- Known limitations
- Decisions deferred

---

## Required Final Response

Provide:

1. Starting commit
2. Final branch commit
3. Migration filename and SHA-256
4. New tables created
5. New permissions added
6. New API endpoints
7. New audit event types
8. New test count
9. Total test count (existing + new)
10. TypeScript result
11. Production build result
12. Migration result (fresh DB)
13. Migration result (dev DB)
14. `__drizzle_migrations` record count
15. Browser test result
16. All acceptance criteria: pass/fail for each
17. Review-package path

---

## Instruction Not to Merge Automatically

Do not merge `readiness/p3-clinical-documentation-foundation` into `main`
automatically.

Provide the final commit hash for human review. The human reviewer must
inspect the review package, run the browser persona verification, and
explicitly approve the merge.
