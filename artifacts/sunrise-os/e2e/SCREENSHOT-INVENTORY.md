# Phase 3 v8 Screenshot Inventory

All 20 screenshots are taken fresh from scratch on every Playwright run.
The `screenshots/` directory is cleared at module load (`fs.rmSync` before
`fs.mkdirSync`) so no screenshot from a prior run (including any v7 run
with demo-mode or stale content) can persist into the evidence package.

## Screenshot Evidence — 20 Required Files

| # | Filename | Flow | Test | Purpose |
|---|----------|------|------|---------|
| 01 | `01-production-login.png` | A-1 | `production login page renders without demo UI` | Confirms `[data-testid="production-login"]` visible; no DemoBanner, no "Skip to Dashboard", no "Demo Mode" text |
| 02 | `02-certified-clinician-dashboard.png` | A-2 | `clinician logs in and reaches authenticated view` | Taken after `await expect(roleLabel).toHaveText("Certified Clinician")` passes — dashboard in authenticated production mode |
| 03 | `03-empty-note-state.png` | A-3 | `Progress Notes tab shows empty state for new patient session` | Progress Notes tab active, no existing note cards (`[data-testid="note-content"]` not visible) |
| 04 | `04-draft-creation.png` | A-4 | `clinician opens compose panel with '+ New Note'` | Compose panel open (`[data-testid="note-content"]` visible) |
| 05 | `05-saved-draft.png` | A-5 | `clinician types content and saves as draft` | Draft card appears in list with `data-status="draft"` |
| 06 | `06-edited-draft.png` | A-6 | `clinician reloads and draft persists; can edit and sign` | Draft reopened and content edited, prior to sign |
| 07 | `07-signed-note-read-only.png` | A-6 | `clinician reloads and draft persists; can edit and sign` | Note signed; `data-status="signed"` card visible; compose panel gone |
| 08 | `08-nursing-note.png` | B-2 | `nurse creates a nursing note and signs it` | Nurse's signed nursing note; `data-status="signed"` card visible |
| 09 | `09-supervisor-void-dialog.png` | C-2 | `void modal opens; short reason is rejected` | Void modal open, reason field empty, Confirm button present |
| 10 | `10-void-reason-validation.png` | C-2 | `void modal opens; short reason is rejected` | Short reason entered ("No"); Confirm button must be disabled |
| 11 | `11-voided-note.png` | C-3 | `valid void reason enables Confirm; submitting voids the note` | Note voided; `data-status="voided"` card visible |
| 12 | `12-other-facility-denial.png` | D-1 | `other-facility clinician cannot access Facility-1 patient chart` | `[data-testid="access-denied"]` visible; no clinical note controls |
| 13 | `13-unassigned-denial.png` | D-1 | `other-facility clinician cannot access Facility-1 patient chart` | Same denial state — confirms other-facility clinician is also unassigned to this patient |
| 14 | `14-another-author-edit-denied.png` | D-5 | `multi-facility clinician cannot edit another author's draft via API` | After 403 PATCH response; compose panel still visible with inline error |
| 15 | `15-another-author-sign-denied.png` | D-6 | `multi-facility clinician cannot sign another author's draft via API` | After 403 POST /sign response; draft card still shows `data-status="draft"` |
| 16 | `16-original-author-void-denied.png` | D-7 | `clinician (no clinical_note.void) cannot void a signed note` | Void button absent; signed note card still visible (`data-testid^="note-card-"`) |
| 17 | `17-security-admin-denial.png` | D-2 | `security-admin has no patient.chart.view — PatientDetail shows AccessDenied` | `[data-testid="access-denied"]` visible; patient API returned 404 |
| 18 | `18-hr-denial.png` | D-3 | `HR has no patient.chart.view — PatientDetail shows AccessDenied` | `[data-testid="access-denied"]` visible; patient API returned 404 |
| 19 | `19-billing-denial.png` | D-4 | `billing staff cannot access Progress Notes compose` | `[data-testid="new-note-btn"]` absent; clinical notes POST returned 404 |
| 20 | `20-concurrency-conflict.png` | E-1 | `two concurrent editors — second write receives stale-version conflict` | Context B's page showing conflict UI ("modified elsewhere") |

## Permission Contract

Exactly 5 permission codes may appear in the permission policy and in all
evidence files:

```
clinical_note.create
clinical_note.view
clinical_note.edit_own_draft
clinical_note.sign_own
clinical_note.void
```

The following codes **must not** appear anywhere in the evidence:
- `clinical_note.sign` (removed in v7)
- `clinical_note.export` (never existed in Phase 3)
- `clinical_note.audit_view` (never existed in Phase 3)

## Test Personas → Session Files

| Session file | Email | Role | Flow |
|---|---|---|---|
| `sessions/clinician.json` | `clinician@test.sunrise` | `certified_clinician` | A, D-7 |
| `sessions/nurse.json` | `nurse@test.sunrise` | `nursing` | B |
| `sessions/supervisor.json` | (org-admin / clinical_supervisor) | `clinical_supervisor` | C |
| `sessions/other-facility.json` | (Facility-2 clinician) | `certified_clinician` | D-1 |
| `sessions/security-admin.json` | `security-admin@test.sunrise` | `security_admin` | D-2 |
| `sessions/hr.json` | `hr@test.sunrise` | `hr` | D-3 |
| `sessions/billing.json` | `billing@test.sunrise` | `billing` | D-4 |
| `sessions/multi-facility.json` | `multi-fac@test.sunrise` | `certified_clinician` (Facility-2) | D-5, D-6 |

## Notes on Denial Status Codes

| Denial | HTTP Status | Server Mechanism |
|---|---|---|
| D-1 (cross-facility patient access) | 404 | `AuthorizationError` → opaque denial |
| D-2 (security-admin, no chart.view) | 404 | `AuthorizationError` → opaque denial |
| D-3 (HR, no chart.view) | 404 | `AuthorizationError` → opaque denial |
| D-4 (billing, no `clinical_note.create`) | 404 | `AuthorizationError` → opaque denial |
| D-5 (edit another's draft) | 403 | `OwnershipError` → explicit ownership denial |
| D-6 (sign another's draft) | 403 | `OwnershipError` → explicit ownership denial |
| D-7 (no `clinical_note.void`) | 404 | `AuthorizationError` → opaque denial |

`AuthorizationError` is always rendered as 404 (never reveals resource existence).
`OwnershipError` is always rendered as 403 (ownership check comes after auth).
