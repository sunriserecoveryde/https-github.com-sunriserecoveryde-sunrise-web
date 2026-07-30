---
name: ClinicalForms admissions screening rewrite
description: Structure, tab layout, credential gate, medication exclusion logic, and BPS pattern for ClinicalForms.tsx
---

## Tab layout (as of Jul 2026 rewrite)
`Screening | PHQ-9 | DAST-10 | MAST | SOGS | SAFE-T | BAM | BPS | Summary`

Previous tabs were purely scored instruments (PHQ-9 through SAFE-T + BAM). Screening and BPS are new.

## Screening tab key logic
- Primary / secondary insurance fields
- Drugs of choice: up to 3 rows (substance, route, frequency, last use)
- Full medication list with dose parsing
- **Auto-exclusion rules (hard-coded thresholds):**
  - Gabapentin > 900 mg/day → fatal exclusion flag
  - Methadone > 120 mg/day → fatal exclusion flag
- Clinical override rationale field if admitting over a fatal exclusion
- History of psychosis enum: none / past / current + managed flag
- Ambulatory status: non-ambulatory is exclusionary for outpatient only, NOT for residential
- Referral source enum + last 3 prior treatment programs
- Clinician wet signature required to save

## BPS (Biopsychosocial Assessment) tab
- 5 sections: Biological, Psychological, Social, Spiritual/Cultural, Clinical Formulation
- **Credential gate:** tab is locked unless `role.description` (from `useRole()`) contains one of: LCADC, CAC-AD, CSC-AD, ADT
- ADT not present in any current mockRoles.ts entry — add "ADT" to a role description to unlock
- Requires clinician signature + formulation text to save

## AI draft assist pattern (Jul 2026)
All note-heavy pages now use `AiDraftAssist` (`components/ui/AiDraftAssist.tsx`):
- Renders an "AI Draft" pill button next to field labels via `FieldLabel`'s `action` prop
- 450 ms simulated generation delay → editable violet review card → Accept/Discard
- Accept pushes the (possibly edited) draft into the parent textarea; never silent
- Generator functions in `aiNoteEngine.ts`: `generateScreeningNarrative`, `generateBPSDraft`, `generateDischargeDraft`, `generateGoalNarrative`
- `FieldLabel` in ClinicalForms.tsx now accepts optional `action` prop for inline buttons
- Wired pages: ClinicalForms (Screening notes + 11 BPS fields), DischargeSummary (Admission Presentation, Clinical Progress, Follow-Up Plan), TreatmentPlans (Long-Term Goal + Short-Term Objective in AsamGoalBuilder)

**Why:** Human-in-the-loop design requirement — AI draft is always editable before accept; no silent fills.

## JSX HTML-entity pitfall
When using `&` in JSX string literals passed as `children`, write `&` directly — JSX escapes it.
Do NOT use `&amp;` in a JSX prop array and then render via `dangerouslySetInnerHTML` on a custom component; custom components don't accept that prop and TypeScript will reject it.
**Fix:** pass label as children, use `&` directly in the string.

**Why:** FieldLabel is a styled `<label>` wrapper that only accepts `children` and `className`; passing dangerouslySetInnerHTML causes a TS error at the call site.
