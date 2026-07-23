---
name: AI Note Engine + Wet Signatures + Intelligence Panel
description: Template-based BIRP/DAP/SOAP/GIRP generator; wet signature canvas; 46-topic library; NoteIntelligencePanel co-pilot; quick capture NLP parser
---

## Format union
`NoteFormat = 'BIRP' | 'DAP' | 'SOAP' | 'GIRP'` — must stay in sync across:
- `aiNoteEngine.ts` (definition)
- `mockPatients.ts` (ProgressNote.format)
- `CosignQueue.tsx` (format display)

## Core files
- `src/lib/aiNoteEngine.ts` — `generateProgressNote`, `generateGroupNote`, `getAiFormSections`, `sectionsToString`, `ProgressNoteInput`, `GroupNoteInput`
- `src/lib/topicLibrary.ts` — 46 topics, 11 categories, `getTopicsForStaff(title)`, `getTopicById(id)`
- `src/lib/quickCaptureParser.ts` — NLP parser: `parseQuickCapture(text)` → `{input, signals, parseScore}`; `scoreNoteQuality(values)` → `{score, label, color, issues, strengths}`; `getTopicSuggestionsFromGoals(goals)`; `suggestFormat(staffTitle)`
- `src/components/ui/WetSignatureCanvas.tsx` — Pointer Events canvas
- `src/components/ui/SignatureModal.tsx` — modal wrapper; also exports `SignedBadge`, `SignatureRecord`
- `src/components/ui/TopicPicker.tsx` — searchable, role-filtered chip grid
- `src/components/ui/NoteIntelligencePanel.tsx` — full AI co-pilot for ProgressNotes

## NoteIntelligencePanel (ProgressNotes)
- **Always visible** — no toggle. Replaces the old collapsible AI Draft Assistant.
- Format buttons live inside the panel header; the context row dropped from 3-col to 2-col (patient + note type only).
- `onValuesChange` callback fills note section textareas live.
- State machine: idle → ready (patient selected) → parsed (quick capture typed) → generated → post-actions shown.
- PatientContextCard: shows dx, co-occurring, mood/craving/recovery/AMA strips, active goals, last note, goal-based topic suggestions.
- Quick Capture: debounced 350ms parse → `ParsedSignal` chips → "Generate Note" button enabled at ≥2 signals.
- Post-generation actions: Sign & Submit, Co-sign, Update goal status (if active goals), Flag supervisor (if risk flags).
- Format auto-suggestion via `suggestFormat(staffTitle)` fires on mount.

## GroupNotes AI panel
- **Always visible** — old toggle removed; `aiDraftOpen` now only controls topic picker expansion.
- Quick Capture at top: debounced parse → maps `presentingConcern→notableThemes`, `interventions→groupDynamics`, `plan→followUpActions`, `clientResponse→participantHighlights`.
- Session context strip: group name, type, attendees, facilitator.
- Note quality score inline below the panel when `noteText.length > 20`.
- Topic picker and fine-tune fields remain as collapsibles.

## Topic Library (`src/lib/topicLibrary.ts`)
- 46 topics across 11 clinical categories.
- Each topic has `primaryRoles: StaffTitleFragment[]` for role-aware ordering.
- Medical/MAT topics include SOAP-specific fields; GIRP topics include `goalAddressed`.
- Group-note topics carry a `groupNarrative` string that bypasses engine and sets noteText directly.

## Topic selection is immediate
- ProgressNotes: `handleTopicSelect(id)` → merges `topic.input` into aiInput → `applyInputAndGenerate()` — no extra button.
- GroupNotes: `topic.groupNarrative` exists → `setNoteText` directly; else → `generateGroupNote()` with topic-enriched fields.

## NLP parser design (`quickCaptureParser.ts`)
- Presentation: 12 keyword patterns → maps to clinical phrasing.
- Mood: regex extracts numeric rating (e.g. "mood 7/10") + word patterns.
- Modality: 17 patterns (CBT, DBT, MI, ACT, EMDR, CPT, Seeking Safety, etc.).
- Interventions: 19 action-verb patterns — collects up to 3 for `interventions` string.
- Engagement: 4 levels (Active/Moderate/Passive/Minimal) via regex priority chain.
- Safety: 10 regex patterns for SI/HI denial/presence + safety plan status.
- Plan: 4 future-tense extraction patterns.
- `parseScore` 0–100 weighted by field importance (siHiStatus=20, presentation=15, interventions=15, presentingConcern=15, plan=10, modality=10, engagementLevel=10, etc.).

## Note quality scoring (`scoreNoteQuality`)
- Input: `values: Record<string, string>` (note section map).
- Scoring: first section ≥60 chars (+20), intervention keywords (+20), client response pattern (+15), safety keywords (+20), plan ≥40 chars (+15), clinical specificity (+10). Max = 100.
- Returns `{score, label, color, issues, strengths}`.
- For group notes: pass `{ 'Group Narrative': noteText }` — safety check won't fire (expected, max ~80).

## Goal → topic suggestion map
`getTopicSuggestionsFromGoals(goals)`: filters `status === 'In Progress'`, maps category strings to topic IDs, returns up to 5. Shown in PatientContextCard as orange clickable chips.

## Wet signatures
`SignatureRecord = { dataUrl, signerName, signerRole, signerType: 'client'|'staff', timestamp }` — shared across:
- ProgressNotes (Sign & Submit, per-note Sign & Approve)
- GroupNotes (Sign Note)
- TreatmentPlans (client + clinician)
- DischargeSummary (4 blocks)
- ASAMAssessments (clinician + client)

## Type fixes (pre-existing, not from new code)
- `calendar.tsx` and `spinner.tsx` have `@types/react` dual-version `VoidOrUndefinedOnly` conflicts — pre-existing, runtime unaffected.
- Filter pattern: `grep -v "calendar.tsx\|spinner.tsx"` when checking tsc output.

## Pages wired
- `ProgressNotes.tsx` — `NoteIntelligencePanel` (always open); format selector moved inside panel; context row is 2-col.
- `GroupNotes.tsx` — inline always-visible AI panel with Quick Capture, session context strip, topic picker, fine-tune, quality score.
- `TreatmentPlans.tsx`, `DischargeSummary.tsx`, `ASAMAssessments.tsx` — wet signature blocks only.
- `Sidebar.tsx` — AI TOOLS nav entry added.
