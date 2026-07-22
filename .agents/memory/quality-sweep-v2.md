---
name: Quality sweep v2 — Sunrise OS
description: Comprehensive quality pass after button wiring was complete; covers stale dates, empty states, toast messages, and content improvements.
---

## Status: COMPLETE v3 (July 22, 2026)

## Stale 2024 Dates Fixed
- QualityImprovement.tsx — CARF survey cycle labels 2024 → 2025
- BiopsychosocialAssessment.tsx — HIV status dropdown default "Negative (2024)" → "(2026)"
- PopulationAnalytics.tsx — risk model backtest cohort 2024–2025 → 2025–2026
- MATManagement.tsx — outcome cohort ref 2024–2025 (n=32) → 2025–2026 (n=38)
- AuditCompliance.tsx:92 — intentionally correct (finding describes an old 2024 posted notice vs current 2026); do NOT change

**Why:** The app is set in July 2026. Historical dates for certifications (2024 issue date) or patient history are fine. Data labels like "2024 cohort" or "Q2 2024 cycle" in a July 2026 context look stale and break immersion.

## Empty States Enriched
All bare `<p>` or `<div>` with only text were enriched with icon + sub-text:
- CensusBedBoard.tsx — PHP and IOP empty sections (Users icon + context)
- StaffAdmin.tsx — "No certifications on file" (📋 + action hint)
- FinancialCounseling.tsx — "No payment plan established" (💳 + context)
- CrisisAssessment.tsx — "No safety plan" (✓ + clarifier)
- ShiftHandoff.tsx — "No pending actions" (✓ + clear-for-handoff)
- PatientDetail.tsx + DemoPatientDetail.tsx — "No recent notes" (📋 + sub-text)
- TelehealthConsults.tsx — "No sessions for this view" bare text → emoji + heading + sub-text
- PeerSupport.tsx — "No recent contacts logged" bare text → emoji + heading + sub-text
- FamilyEngagement.tsx — "No family contact logged" italic text → emoji + heading + sub-text
- RecoveryEngagementScore.tsx — "No patients match your filter" bare text → 🔍 + heading + sub-text
- PhysicianOrders.tsx — "No orders in this category" bare text → 📋 + heading + sub-text
- ASAMAssessments.tsx — "No patients match your criteria" bare text → 🔍 + heading + sub-text
- PatientList.tsx — AlertTriangle icon but bare text → icon + font-semibold heading + sub-text
- All Sunrise Staff (mobile) empty states confirmed fully enriched with Ionicons + text

## Toast Message Mismatches Fixed (v1)
- Settings.tsx — "User account created" fired for Edit, Deactivate, Create → changed to "Changes saved"
- ClinicalSupervision.tsx — "View History" button fired noteSaved toast → now toggles expandedNote state
- StaffScheduling.tsx — ChevronLeft/Right week nav showed a "save" toast → changed to no-op onClick with title tooltip

## Toast Message Mismatches Fixed (v2 — String-based contextual toasts)
Upgraded the following pages from boolean → string-based contextual toast:
- RevenueCycle.tsx — single "Claim submitted to payer" for 7 distinct actions → each action now has its own message
- AlumniProgram.tsx — "Follow-up call logged" for Log Call/Invite Alumni/Edit/Use in Marketing → each has own message
- GroupTherapyCurriculum.tsx — "Group added to curriculum library" for Materials/Schedule/Export/Create → each has own message
- Training.tsx — "Training session scheduled" for Register Staff/View certificate/Schedule Session → each has own message
- BedManagement.tsx — "Work order submitted" for Refresh/Add Task/Schedule Discharge/Assign/Mark Ready/Update Note/Release Block/Submit → each has own message
- ClinicalSupervision.tsx — "Supervision note saved" for Add to Calendar + Save Note → each has own message
- StaffScheduling.tsx — "Shift added to schedule" for Submit Request/Approve/Deny/Add Shift → each has own message
- GroupSchedule.tsx — "Group session added to schedule" for Save Attendance/Note/Add to Schedule → each has own message

**How to apply:** When adding a new action to a page that already has a boolean-saved toast, upgrade the state to `useState<string | null>(null)` and add a `saveXxxAction(msg)` helper. Never reuse a boolean toast for multiple distinct actions.

## ChartReview Coding Audit Tab Enhanced
- Added Export Audit header button (`auditExported` state)
- Added per-row Flag button for codes with pct < 100 (`codingFlagged` state with code-specific toast)

## ProgressNotes Co-sign Button Wired
- NoteRow component had `onClick={() => {}}` no-op on the "Sign & Approve" LockedButton
- Added `localSigned` state to NoteRow; button toggles to "✓ Signed" green badge on click

## HelpSupport Release Notes
- v1.3.0 added (2026-07-22) documenting all improvements from this session
- "MedicalRecords export function placeholder only" known issue removed (MedicalRecords is fully implemented)

## MeasurementBasedCare Timeout Fix
- `setSavedFlash` timeout was 4000ms; standardized to 2500ms to match all other pages

## False Positive Patterns (Do NOT act on these)
- Python scanner with 6-line window still misses handlers far below the opening tag; always read 10+ lines of context
- "Bare button" reports from subagent explorers are frequently wrong — always run the Python scanner to verify
- `sidebar.tsx:286` has onClick on line 291 — always appears as bare button in grep
- StaffScheduling chevron `onClick={() => {}}` is intentional (no week navigation data)
- `FE-2024-001` form codes are revision identifiers, not stale dates — leave alone
- Table cell data with `text-center text-slate` in `td` elements are NOT empty states — leave alone
- Italic text in AlumniProgram testimonials, DischargeSummary print, MyCaseload clinical notes, TelehealthConsults session notes — appropriate styling, leave alone
- `App.tsx` default case "Module coming soon" is a safety fallback for unmapped screen values — not a real stub
- Jul 14-18 dates in Dashboard/CommandCenter/SecureMessaging logs are historical data points for a July 22 app — correct

## State of the Codebase (July 22, 2026 — v3)
- 0 bare buttons (verified by Python scanner across all 65 pages + all components)
- 0 console.log / console.warn leaks
- 0 stale 2024 data labels (historical dates in patient records are fine)
- All empty states have icon + context (all 65 pages confirmed)
- All toast messages match their triggering action (all boolean-saved states audited)
- All toast timeouts standardized to 2000–3000ms range
- All tabs across all pages confirmed fully implemented with rich content
- Sunrise Staff (7009+ lines across 6 tabs + patient detail) confirmed fully wired and all empty states enriched
