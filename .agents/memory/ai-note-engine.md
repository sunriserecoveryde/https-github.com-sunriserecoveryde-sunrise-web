---
name: AI Note Engine + Wet Signatures
description: Template-based clinical note draft generator and wet signature capture system added to Sunrise OS. Covers architecture decisions, type fixes, and known pitfalls.
---

## AI Note Engine (`src/lib/aiNoteEngine.ts`)
- Pure TypeScript, no external LLM. Generates BIRP / DAP / SOAP / GIRP progress note drafts and group note drafts from structured clinician-entered fields.
- Exports: `generateProgressNote(format, input)`, `generateGroupNote(input)`, `sectionsToString()`, `getAiFormSections(format)`.
- `ProgressNoteInput` has 20+ optional fields; the engine uses sensible fallbacks for missing fields so partial input always produces a useful draft.

## Wet Signature Components (`src/components/ui/`)
- `WetSignatureCanvas.tsx` — Canvas-based Pointer Events drawing surface (handles mouse/touch/stylus).
- `SignatureModal.tsx` — Modal wrapping the canvas; exports `SignatureModal`, `SignedBadge`, `SignatureRecord`.
- `SignatureRecord`: `{ dataUrl, signerName, signerRole, signerType: 'client'|'staff', timestamp }`.
- `SignedBadge` renders the captured PNG + name + timestamp in a green badge.

## Pages modified
- `ProgressNotes.tsx` — SOAP/GIRP formats added; AI Assist collapsible panel; "Sign & Submit" opens SignatureModal; NoteRow sign button opens SignatureModal; SignedBadge shown after signing.
- `GroupNotes.tsx` — "✨ Generate AI Draft" toggle above Group Narrative textarea; AI fields pre-filled from session metadata; "Sign Note" opens SignatureModal; SignedBadge shown on existing note.
- `TreatmentPlans.tsx` — Client + Clinician signature blocks added inside PatientPlanCard expanded view; state is local to each card.
- `DischargeSummary.tsx` — Replaced 3 static text signature fields with 4 interactive wet-sig blocks (Clinician, Co-signer, Physician, Client Acknowledgment).
- `ASAMAssessments.tsx` — Signature section added in AssessmentDetail (Clinician + Client Acknowledgment blocks); state local to AssessmentDetail.

## Type fixes required
- `src/data/mockPatients.ts` — `SessionNote.format` type expanded from `'BIRP'|'DAP'` to `'BIRP'|'DAP'|'SOAP'|'GIRP'`.
- `src/pages/CosignQueue.tsx` — `format?:` type expanded the same way.

**Why:** Adding new NoteFormat values without updating the union caused TS2345 on the `buildNote()` return in NewNoteForm.

## Known pitfalls
- Apostrophe inside single-quoted TS string literals (e.g. `'Clinician's interpretation…'`) silently breaks esbuild parse — always use double-quote outer delimiters for placeholders containing apostrophes.
- `calendar.tsx` and `spinner.tsx` have pre-existing React ref type errors (duplicate @types/react packages) — not introduced by this session; Vite HMR still works fine.
