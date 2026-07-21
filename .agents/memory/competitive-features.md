---
name: Competitive feature adoptions
description: Features adopted from competitor EHRs into Sunrise OS — location of each feature and key implementation notes
---

## MeasurementBasedCare.tsx (Valant-inspired)
- New screen: `artifacts/sunrise-os/src/pages/MeasurementBasedCare.tsx`
- Instruments: PHQ-9 (9 items, 0-27), GAD-7 (7 items, 0-21), PCL-5 (20 items, 0-80)
- Four tabs: Patient Scores (table + sparklines), Administer (step-through Q&A), Trends (Recharts line chart), Analytics (distribution + compliance)
- Severity banding: phq9Severity / gad7Severity / pcl5Severity helper functions
- Safety item alert: PHQ-9 item 9 (index 8) triggers a red warning panel if scored > 0
- Wired into App.tsx (Screen union + withAccessReadOnlyProp case) and Sidebar.tsx (RISK & OUTCOMES section, ClipboardCheck icon)
- Mock data: MOCK_SCORES keyed by patient id (p1–p8), NEXT_DUE for assessment scheduling

## GroupNotes.tsx — per-patient participation grid (Kipu-inspired)
- State: `participationMap: Record<string, Record<string, { level: PartLevel; note: string }>>` keyed sessionId → patientId
- Participation levels: Active | Moderate | Passive | Late | Absent | Excused (each with distinct Tailwind color badge)
- Grid renders above the group narrative textarea when note editor is open
- Patients pulled from MOCK_PATIENTS filtered by session.program (or all if 'All Programs')
- Helper: `setParticipation(sessionId, patientId, field, value)` merges into nested state

## CensusBedBoard.tsx — LOS alert badges (BestNotes-inspired)
- LOS_BENCHMARKS inside BedCard: Residential {target:21, max:35}, PHP {target:10, max:21}, IOP {target:30, max:60}
- Three states: 'normal' | 'approaching' (los >= target) | 'exceeded' (los > max)
- Badge: amber "Near target" or red "LOS ⚠ Exceeded Nd" inline with the existing LOS display
- Implemented as an IIFE inside JSX to avoid extracting a new component

## ProgressNotes.tsx — Templates tab fix
- Bug: templates were rendered inside the Co-sign Queue card, only visible alongside that card
- Fix: moved template gallery into its own `{activeTab === 'Templates' && <div className="card">...}` block above the co-sign queue
- Co-sign queue now conditionally hidden with `{activeTab !== 'Templates' && (...)}`
- "Use Template" button now calls `setShowNewForm(true)` to open the note form (editRoles guarded via LockedButton)
