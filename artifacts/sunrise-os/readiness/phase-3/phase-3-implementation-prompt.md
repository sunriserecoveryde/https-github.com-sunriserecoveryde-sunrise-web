# Phase 3 — Clinical Documentation Foundation
## Replit Implementation Prompt

**Approved — implementation authorized via human review on 2026-08-02.**

---

## Engineering Label

**Implementation Phase 3 — Clinical Documentation Foundation**

## Product-Audit Context

This engineering phase intentionally completes part of the product audit's
**Clinical Workflow Completion** phase. It occurs before the product audit's
**Integrations** phase so foundational clinical workflows exist before
external integrations are added.

---

## Starting Point

- Reconciliation branch `maintenance/post-phase-2-migration-reconciliation` merged and verified
- Planning branch `planning/phase-3-scope` merged to `main` with approved decisions
- Implementation branch: `feature/phase-3-clinical-documentation-foundation`

---

## Objective

Implement the Clinical Documentation Foundation vertical slice: a complete,
tested, server-enforced clinical note workflow that allows an authorized
clinician to create, edit, sign, and view individual progress or nursing notes
for assigned patients. No clinical note capability exists today; this phase
introduces the first real PHI-bearing clinical entity in the system.

The implementation must not change any Phase 1 or Phase 2 behavior. All 444
existing tests must continue to pass.

---

## In-Scope Items

1. One new database table: `sos_clinical_notes`
2. One new migration: `0006_clinical_documentation_foundation.sql`
3. Six new API endpoints under `/api/v1/patients/:patientId/clinical-notes`
4. Six new permission codes (see Approved Decisions)
5. Six new audit event types
6. Progress Notes tab in PatientDetail wired to real API (production data mode)
7. Comprehensive automated test suite

---

## Approved Note Types

- `progress_note`
- `nursing_note`

Note types are NOT coupled to billing codes in this phase.

---

## Approved Permission Codes

| Code | Description |
|------|-------------|
| `clinical_note.create` | Create a draft note |
| `clinical_note.view` | View note list and detail |
| `clinical_note.edit_own_draft` | Edit own draft (author only) |
| `clinical_note.sign_own` | Sign own draft (author only) |
| `clinical_note.void` | Void a signed note (supervisor/admin only) |
| `clinical_note.audit_view` | View clinical note audit trail |

---

## Approved API Endpoints

```
POST   /api/v1/patients/:patientId/clinical-notes
GET    /api/v1/patients/:patientId/clinical-notes
GET    /api/v1/patients/:patientId/clinical-notes/:noteId
PATCH  /api/v1/patients/:patientId/clinical-notes/:noteId
POST   /api/v1/patients/:patientId/clinical-notes/:noteId/sign
POST   /api/v1/patients/:patientId/clinical-notes/:noteId/void
```

---

## Approved Audit Events

- `clinical_note_created`
- `clinical_note_viewed`
- `clinical_note_updated`
- `clinical_note_signed`
- `clinical_note_voided`
- `clinical_note_access_denied`

---

## Key Authorization Rules

1. **Draft ownership**: Only the original author may edit or sign their draft.
2. **Signing**: Requires `clinical_note.sign_own` + patient scope + author match + version match.
3. **Immutability**: Signed notes are immutable (DB trigger + service enforcement).
4. **Voiding**: Requires `clinical_note.void` (clinical_supervisor or cmo only).
   - Voiding preserves original content.
   - Original author cannot void their own note unless they independently hold `clinical_note.void`.
5. **Concurrency**: All draft edits and signing require `expectedVersion`; stale version → HTTP 409.
6. **Audit**: Required audit event inside the same DB transaction as each state change.

---

## Storage Posture (Approved)

- PostgreSQL plaintext storage (no field-level encryption in this phase)
- Sensitive health information — database access restricted, transport encrypted
- Real patient data must NEVER appear in tests, seeds, screenshots, or logs

---

## Acceptance Criteria

Implementation Phase 3 is complete only when:

- Migration reconciliation is merged and verified ✓
- Planning decisions reflected in scope ✓
- Clinical notes use real PostgreSQL persistence
- Authorization is enforced server-side
- Patient assignment is enforced
- Draft ownership is enforced
- Signed notes are immutable (DB trigger verified)
- Voiding preserves the original record
- Optimistic concurrency prevents silent overwrites
- Required audit events are durable (transactional)
- Note content excluded from audit metadata
- Existing 444 tests remain green
- New tests pass with zero required skips
- Clean migrations work from an empty database
- TypeScript passes
- Production builds pass
- Real browser workflow passes
- Review ZIP complete and sanitized
