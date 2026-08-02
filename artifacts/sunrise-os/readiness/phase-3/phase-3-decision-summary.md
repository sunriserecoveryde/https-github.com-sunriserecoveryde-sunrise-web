# Phase 3 — Decision Summary

**Date:** 2026-08-02  
**Branch:** `planning/phase-3-scope`  
**Prepared by:** Replit Agent  
**Requires human approval before implementation begins.**

---

## Existing Approved Phase 3 Roadmap Scope Found

**Yes — but at a different abstraction level than the current implementation.**

The repository contains a product audit (`artifacts/sunrise-os/product-audit/
00-executive-summary.md`) that defines the following phase sequence:

| Phase | Name | Scope |
|-------|------|-------|
| Phase 1 | Backend Foundation | Database persistence, authentication, server-side authorization |
| Phase 2 | Clinical Workflow Completion | Note signing, treatment plans, MAR, discharge summary |
| Phase 3 | Integrations | Eligibility verification, clearinghouse, e-prescribing, FHIR R4 |
| Phase 4 | Differentiation | AI pipeline, patient portal, telehealth, bed analytics |

The **Replit implementation phases** do not map 1:1 to the product audit phases.
The Replit system completed authentication and authorization (primarily product
audit Phase 1 items). The product audit's Phase 2 (Clinical Workflow
Completion) — starting with "Note signing with backend persistence" — has not
yet been implemented in the Replit system.

Applying the product audit's Phase 3 (Integrations) at this point would skip
Clinical Workflow Completion entirely and build external integrations on top of
a system that has no clinical note storage. Integrations such as eligibility
verification and clearinghouse claims submission depend on clinical notes,
diagnoses, and treatment plans existing in the database.

---

## Proposed Phase 3 Name

**Clinical Documentation Foundation**

---

## Primary Users

| Role | Workflow |
|------|---------|
| `clinician` | Create, edit, and sign individual progress notes |
| `nurse` | Create and sign nursing notes |
| `supervisor` | View and void notes for supervised staff |
| `admin` | View any note within their organization |

---

## Main Workflow

An authenticated, assigned clinician creates a draft progress note for a
patient, edits it, signs it, and the system locks the record. The note is
stored in the database, scoped to org/facility/patient, audited on every
access, and visible to authorized staff.

---

## Why It Should Be Next

1. **Foundation dependency:** Eligibility verification (product roadmap Phase 3)
   requires clinical notes and treatment plans to exist before it is useful.
   You cannot submit a claim or verify a benefit without a clinical encounter
   record.

2. **Current state:** The Progress Notes, Chart Review, and Co-sign Queue
   screens all exist in the UI but render mock data. Real clinical staff cannot
   use the system for documentation.

3. **Security infrastructure is ready:** Phase 2 delivered scoped patient
   access, exact FK binding, audit trails, and server-enforced permissions. The
   authorization model is ready to protect clinical PHI.

4. **Smallest complete vertical slice:** A single note type (individual
   progress note) with create/read/edit/sign/view covers the full stack from
   migration to UI without requiring billing codes, integrations, or external
   systems.

5. **Deferred complexity:** Co-signatures, amendments, late entries, and AI
   generation are explicitly out of scope and can be delivered independently.

---

## Major Dependencies

All of the following are in place from Phase 1 and Phase 2:

- PostgreSQL with org/facility/patient schema
- Authenticated sessions with session versioning
- Scoped role assignments and patient-access grants
- Server-side permission enforcement middleware
- CSRF protection
- Append-only audit log with outbox worker
- Patient List and Patient Detail API (scoped)

---

## Main Risks

| Risk | Severity | Notes |
|------|----------|-------|
| PHI stored as plaintext | Medium | No field-level encryption; acceptable for development; must be addressed before production |
| No MFA at note signing | Medium | Signing is a legal act; MFA at sign time is best practice; deferred |
| Product roadmap conflict | High | Requires human decision — see below |
| `note_type` allowlist must align with billing codes | Medium | Wrong note type = claim denial; clinical/billing review needed before finalizing the allowlist |
| Time-zone handling for `service_date` | Low | Stored as DATE (no TZ ambiguity); facility time zone used for display |

---

## Estimates

### Database Changes

| Item | Count |
|------|-------|
| New tables | 1 (`sos_clinical_notes`) |
| Modified tables | 0 |
| New migrations | 1 (`0006_clinical_documentation_foundation.sql`) |
| New check constraints | 5 |
| New triggers | 1 |
| New indexes | 4 |

### API Endpoints

| Item | Count |
|------|-------|
| New endpoints | 6 |
| Modified endpoints | 0 |
| New permission codes | 6 |
| New audit event types | 6 |

### Frontend Screens

| Item | Count |
|------|-------|
| Primary new UI surface | Progress Notes tab in PatientDetail (wired) |
| Secondary update | ProgressNotes standalone screen (read list) |
| New major components | NoteForm, NoteDetail, NoteListItem, SignConfirmModal, ConflictBanner |

### Testing

| Category | Estimate |
|----------|---------|
| Automated tests (new) | 116–130 |
| Existing tests (must pass) | 444 |
| Total minimum | 560–574 |
| Browser scenarios | 3 |
| Human personas | 3 (clinician, supervisor, admin) |

---

## Explicit Exclusions

The following are explicitly excluded from Phase 3 and must not be bundled in:

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
- Wet/digital signatures (PDF, DocuSign)
- Complex SOAP/BIRP/DAP structured templates
- Password reset email delivery
- MFA enrollment
- CSP hardening
- Field-level encryption

---

## Decisions Required from the Human Reviewer

Before implementation begins, the following must be decided:

| # | Decision | Why it matters |
|---|----------|---------------|
| 1 | **Confirm Phase 3 = Clinical Documentation Foundation** (not Integrations as stated in product audit Phase 3) | The product audit calls Phase 3 "Integrations." The Replit implementation hasn't yet built clinical documentation. Which takes priority? |
| 2 | **Confirm `note_type` allowlist** | `individual_progress / group_progress / nursing / physician / case_management / peer_support` — align with billing team before coding |
| 3 | **PHI plaintext storage acceptable for Phase 3** | No field-level encryption planned; confirm this is acceptable for development-stage data |
| 4 | **MFA requirement at signing** | Best practice says signing should require MFA; is this deferred to a later phase? |
| 5 | **Void policy for signed notes** | Supervisor/admin can void signed notes with a reason — is this the correct policy, or should voiding require a compliance approval step? |
| 6 | **Content format: plain text only** | Phase 3 stores plain text content; SOAP/BIRP/DAP structured templates are deferred — confirm this is acceptable |

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
PHASE 3 SCOPE REQUIRES PRODUCT DECISION
```

The proposed scope (Clinical Documentation Foundation) is a well-defined,
implementable vertical slice that follows logically from Phase 2 and prepares
the system for the integrations the product roadmap names as Phase 3. However,
the product audit explicitly identifies Phase 3 as Integrations. A human
reviewer must confirm whether to proceed with Clinical Documentation Foundation
or to re-sequence the roadmap before implementation begins.
