# Phase 3 — Decision Summary

**Date:** 2026-08-02
**Branch:** `planning/phase-3-scope`
**Prepared by:** Replit Agent
**Status: APPROVED — Implementation authorized.**

---

## Engineering Sequence vs. Product-Audit Sequence

### Engineering label
**Implementation Phase 3 — Clinical Documentation Foundation**

### Product-audit sequence
This engineering phase intentionally completes part of the product audit's
**Clinical Workflow Completion** phase. It occurs before the product audit's
**Integrations** phase because foundational clinical documentation must exist
before external integrations (eligibility, clearinghouse, e-prescribing, FHIR)
can be meaningfully added.

---

## Roadmap Context

The repository contains a product audit that defines the following phase sequence:

| Phase | Name | Scope |
|-------|------|-------|
| Phase 1 | Backend Foundation | Database persistence, authentication, server-side authorization |
| Phase 2 | Clinical Workflow Completion | Note signing, treatment plans, MAR, discharge summary |
| Phase 3 | Integrations | Eligibility verification, clearinghouse, e-prescribing, FHIR R4 |
| Phase 4 | Differentiation | AI pipeline, patient portal, telehealth, bed analytics |

The **Replit implementation phases** do not map 1:1 to the product audit phases.
The Replit system completed authentication and authorization (primarily product
audit Phase 1 items). The product audit's Clinical Workflow Completion
(starting with "Note signing with backend persistence") has not yet been
implemented.

This engineering phase (Implementation Phase 3) implements the first foundational
slice of Clinical Workflow Completion before moving to external integrations.
The product audit roadmap is not discarded — it is being sequenced so
foundational clinical workflows exist before external integrations are added.

---

## Explicitly Not Begun in This Phase

The following product-audit phases are deferred until after this phase:

- Eligibility integrations
- Clearinghouse integrations
- Electronic prescribing
- FHIR integrations
- Claims processing
- Medication administration records
- Treatment plans
- Group notes
- ASAM assessments
- Discharge summaries
- AI-generated clinical content

---

## Phase Name

**Clinical Documentation Foundation**

---

## Primary Users

| Role | Workflow |
|------|---------|
| `certified_clinician` / `mh_therapist` | Create, edit, and sign individual progress notes |
| `nursing` | Create and sign nursing notes |
| `clinical_supervisor` | View any note in their facility; void signed notes with reason |
| `cmo` | View any note org-wide; void signed notes with reason |

---

## Main Workflow

An authenticated, assigned clinician creates a draft progress note for a
patient, edits it, signs it, and the system locks the record. The note is
stored in the database, scoped to org/facility/patient, audited on every
access, and visible to authorized staff.

---

## Approved Product Decisions

### Decision 1 — Note types

The initial allowlist is limited to:
- `progress_note`
- `nursing_note`

Note types are not coupled directly to billing codes.
No billing claim or service-code generation is included.
Future note types require reviewed code and a migration to be added.

### Decision 2 — Draft ownership

A draft note may be edited only by its original author.
Supervisors and administrators may view drafts when their scoped permissions
authorize access, but they may not edit another author's draft.
No draft reassignment is included.

### Decision 3 — Signing

Signing requires:
- A currently authenticated session
- Valid CSRF protection
- Permission to sign the note (`clinical_note.sign_own`)
- Continued authorization for the organization, facility, patient, and episode
- Confirmation that the user is the note author
- Current note version matching the submitted version

MFA is not required in this phase.
Signing without MFA does not, by itself, satisfy every regulatory or
organizational signature policy.

Recorded at signature: signer identity, signature timestamp, final version,
organization, facility, patient, episode (where applicable).

### Decision 4 — Signed-note immutability

A signed note is immutable. After signature:
- Text cannot be edited
- Author cannot change
- Patient cannot change
- Episode cannot change
- Facility cannot change
- Note type cannot change
- Signed timestamp cannot change

Amendments, late entries, addenda, corrections, and co-signatures are not
implemented in this phase.

### Decision 5 — Void behavior

A signed note may be voided only by a separately authorized supervisor or
administrator holding the `clinical_note.void` permission.

Voiding requires:
- `clinical_note.void` permission
- Scoped patient access
- A required reason
- Audit event written inside the same transaction as the void

Voiding does not delete or overwrite the original note.
The original content remains available to appropriately authorized audit and
supervisory users.

The original author may not void their own signed note unless they
independently possess `clinical_note.void` (i.e., they also hold a supervisor
or CMO role assignment).

### Decision 6 — Storage and encryption posture

Clinical note content uses the existing PostgreSQL storage architecture.
Field-level encryption is not implemented in this phase.

Documented clearly:
- Clinical note content contains sensitive health information
- Database access must be restricted
- Transport encryption is required
- Backups must be protected
- Production key-management and field-level encryption remain a separate
  security decision
- This implementation is not, by itself, a declaration of HIPAA compliance

Real patient information must not appear in tests, seeds, screenshots, logs,
or review archives.

---

## Why Clinical Documentation Foundation Before Integrations

1. **Foundation dependency:** Eligibility verification and clearinghouse claims
   require clinical notes and treatment plans to exist before they are useful.
   You cannot submit a claim without a clinical encounter record.

2. **Current state:** The Progress Notes, Chart Review, and Co-sign Queue
   screens all render mock data. Real clinical staff cannot document care.

3. **Security infrastructure is ready:** Phase 2 delivered scoped patient
   access, exact FK binding, audit trails, and server-enforced permissions.
   The authorization model is ready to protect clinical PHI.

4. **Smallest complete vertical slice:** Two note types (progress, nursing)
   with create/read/edit/sign/view covers the full stack without requiring
   billing codes, integrations, or external systems.

5. **Deferred complexity:** Co-signatures, amendments, late entries, and AI
   generation are explicitly out of scope and can be delivered independently.

---

## Major Dependencies

All of the following are in place from Phase 1 and Phase 2:

- PostgreSQL with org/facility/patient schema
- Authenticated sessions with session versioning
- Scoped role assignments and patient-access grants
- Server-side permission enforcement (`authorize()`)
- CSRF protection
- Append-only audit log with outbox worker
- Patient List and Patient Detail API (scoped)

---

## Estimates

### Database Changes

| Item | Count |
|------|-------|
| New tables | 1 (`sos_clinical_notes`) |
| New migrations | 1 (`0006_clinical_documentation_foundation.sql`) |
| New check constraints | 5 |
| New triggers | 1 |
| New indexes | 4 |

### API Endpoints

| Item | Count |
|------|-------|
| New endpoints | 6 |
| New permission codes | 6 |
| New audit event types | 6 |

### Frontend Screens

| Item | Count |
|------|-------|
| Primary new UI surface | Progress Notes tab in PatientDetail (wired to real API) |
| New components | NoteTimeline, NoteEditor, NoteReadOnlyView, VoidModal, ConflictBanner |

### Testing

| Category | Estimate |
|----------|---------|
| Automated tests (new) | 80–100 |
| Existing tests (must pass) | 444 |

---

## Explicit Exclusions

- Co-signatures
- Amendments to signed notes
- Late entries
- Group notes
- Treatment plans
- Medication administration records (MAR)
- ASAM assessments
- Discharge summaries
- E-prescribing
- Eligibility verification
- Clearinghouse integration
- FHIR R4
- AI-generated clinical content
- Rich template designers
- Drag-and-drop form builders
- Billing integration

---

## Permission Codes Approved

| Code | Roles |
|------|-------|
| `clinical_note.create` | clinical_supervisor, certified_clinician, mh_therapist, cmo, prescriber, nursing |
| `clinical_note.view` | clinical_supervisor, certified_clinician, mh_therapist, cmo, prescriber, nursing, bht |
| `clinical_note.edit_own_draft` | clinical_supervisor, certified_clinician, mh_therapist, cmo, nursing |
| `clinical_note.sign_own` | clinical_supervisor, certified_clinician, mh_therapist, cmo, prescriber, nursing |
| `clinical_note.void` | clinical_supervisor, cmo |
| `clinical_note.audit_view` | clinical_supervisor, cmo, security_admin |

---

## Artifacts Produced

| Path | Description |
|------|-------------|
| `docs/readiness/post-phase-2-migration-reconciliation.md` | Full reconciliation methodology and evidence |
| `artifacts/sunrise-os/readiness/post-phase-2/migration-reconciliation-proof.md` | Clean-migration proof results |
| `artifacts/api-server/migrations/reconcile-post-phase-2-migration-journal.sql` | Safe, idempotent reconciliation script |
| `docs/readiness/phase-3-current-state-inventory.md` | Current platform capabilities inventory |
| `docs/readiness/phase-3-proposed-scope.md` | Full proposed scope with DB model, auth matrix, API spec, frontend spec, test strategy |
| `artifacts/sunrise-os/readiness/phase-3/phase-3-implementation-prompt.md` | Complete implementation prompt for the engineering task |
| `artifacts/sunrise-os/readiness/phase-3/phase-3-decision-summary.md` | This document |

---

```text
PHASE 3 SCOPE APPROVED
Implementation Phase 3 — Clinical Documentation Foundation
Completes part of the product-audit Clinical Workflow Completion phase.
Intentionally precedes the product-audit Integrations phase.
```
