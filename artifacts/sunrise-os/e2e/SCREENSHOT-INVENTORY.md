# Phase 3 v10 Screenshot Inventory

Final code commit: 75701271fe147a9ee40d0311a9d8b56663414b53
Evidence commit:   6c57c7c95f448f77316f99a0363f91c1a8b899a8
Screenshot count:  20
Spec file:         e2e/clinical-notes-p3-browser.spec.ts

All screenshots are taken fresh each Playwright run. The spec clears the screenshots/
directory before each run (fs.rmSync). Screenshots are numbered sequentially by a
monotonic counter and named `{NN}-{slug}.png`.

| # | Filename | Test / Flow | Persona | Expected State |
|---|----------|-------------|---------|----------------|
| 01 | 01-production-login.png | Flow A — ProductionLogin | (unauthenticated) | Login page rendered |
| 02 | 02-certified-clinician-dashboard.png | Flow A — Dashboard | certified_clinician | Dashboard after login |
| 03 | 03-empty-note-state.png | Flow A — PatientDetail | certified_clinician | No notes in list |
| 04 | 04-draft-creation.png | Flow A — NoteComposer | certified_clinician | Note composer open |
| 05 | 05-saved-draft.png | Flow A — NoteComposer | certified_clinician | Draft saved successfully |
| 06 | 06-edited-draft.png | Flow A — NoteComposer | certified_clinician | Draft edited before signing |
| 07 | 07-signed-read-only-note.png | Flow A — SignedNote | certified_clinician | Signed note — read-only, no edit button |
| 08 | 08-nursing-note.png | Flow B — NursingNote | certified_clinician | Nursing note created |
| 09 | 09-supervisor-void-dialog.png | Flow C — VoidDialog | clinical_supervisor | Void dialog opened |
| 10 | 10-void-validation.png | Flow C — VoidValidation | clinical_supervisor | Void validation error (empty reason) |
| 11 | 11-voided-note.png | Flow C — VoidedNote | clinical_supervisor | Note successfully voided |
| 12 | 12-other-facility-denial.png | Flow D — PermissionDenial | other_facility_clinician | Access denied — wrong facility |
| 13 | 13-unassigned-denial.png | Flow D — PermissionDenial | unassigned_user | Access denied — no role |
| 14 | 14-security-admin-denial.png | Flow D — PermissionDenial | security_admin | Denied — security_admin lacks clinical_note.* |
| 15 | 15-hr-denial.png | Flow D — PermissionDenial | hr_coordinator | Denied — hr_coordinator lacks clinical_note.* |
| 16 | 16-billing-denial.png | Flow D — PermissionDenial | billing_analyst | Denied — billing_analyst lacks clinical_note.* |
| 17 | 17-another-author-edit-denied.png | Flow D — EditDenial | certified_clinician_b | Edit denied — not the note author |
| 18 | 18-another-author-sign-denied.png | Flow D — SignDenial | certified_clinician_b | Sign denied — not the note author |
| 19 | 19-original-author-void-denied.png | Flow D — VoidDenial | certified_clinician | Void denied — original author lacks void permission |
| 20 | 20-concurrency-conflict.png | Flow E — Concurrency | certified_clinician_b | Stale-version conflict on concurrent write |
