---
name: Sunrise OS Architecture
description: Key architecture decisions, Screen union values, data file field names, and build conventions for the Sunrise OS EHR demo
---

## Artifact
`artifacts/sunrise-os/` — React + Vite + TypeScript + Tailwind + Recharts

## Screen Union (43 values — as of July 19, 2026 session)
Dashboard, CommandCenter, CensusBedBoard, PatientList, Admissions, Discharges,
ChartReview, ProgressNotes, TreatmentPlans, ASAMAssessments, GroupNotes, CosignQueue,
AppointmentCalendar, GroupSchedule, StaffScheduling, RiskDashboard, RecoveryEngagementScore,
OutcomeTracking, UADrugTesting, IncidentReporting, ReferralTracker, BusinessDevelopment,
BedManagement, RevenueCycle, AuditCompliance, Training, Settings, HelpSupport,
MATManagement, FamilyEngagement, PhysicianOrders, PopulationAnalytics, NursingMAR,
ShiftHandoff, QualityImprovement, InsuranceAuthorization, AftercarePlanning, MyCaseload,
BiopsychosocialAssessment, DischargeSummary, CrisisAssessment, AlumniProgram, PatientDetail

**Why:** Every case must be in the App.tsx `renderScreen()` switch; missing cases hit the default fallback.

## Data File Field Names (critical — wrong field name = silent undefined)
- `patient.los` (not `lengthOfStay`)
- `patient.craving` (not `cravingScore`)
- `patient.asam` is an object `{d1,d2,d3,d4,d5,d6}` (not a string)
- `patient.bed` (optional, not `roomNumber`)
- `patient.recoveryScore`, `patient.amaRisk`, `patient.mood`, `patient.lastUa`, `patient.flags`, `patient.notes`, `patient.goals`, `patient.coOccurring`
- No `substanceUseHistory` — derive from `primaryDiagnosis`/`coOccurring`
- `getPatientMedications(id)`, `getPatientVitals(id)`, `getPatientLabs(id)`, `LAB_PANEL_ORDER`

## Tailwind / CSS Conventions
- Custom utility classes: `btn-primary`, `card` (defined in `index.css`)
- Color tokens: `bg-navy`, `bg-orange`/`text-orange`, `text-sunrise-blue`, `bg-success`, `bg-critical`, `bg-purple`, `bg-teal`, `text-slate`, `border-border`, `bg-bg`
- CSS vars: `--topbar-height`, `--banner-height`, `--nav-width`

## Sidebar Structure (sections)
OVERVIEW, CLINICAL, DOCUMENTATION (+ MyCaseload, BiopsychosocialIntake, DischargeSummary),
SCHEDULING, RISK & OUTCOMES (+ CrisisAssessment), NURSING (+ ShiftHandoff),
OPERATIONS (+ InsuranceAuth, AftercarePlanning, AlumniProgram), BILLING & COMPLIANCE (+ QualityImprovement),
HELP + Settings footer

## Common Pitfalls
- Strings with apostrophes (`I've`, `I'd`) inside single-quoted string literals break Babel parser — use `\'` or backticks
- `Record<string, string | string[]>` typed data objects: use typed interfaces when accessing specific keys
- `Legend` must be explicitly imported from recharts (not auto-included)
- lucide-react icons must exist in the version installed — if `Download` causes runtime error, swap for a known-good icon
- The replit-cartographer Babel parse errors are cosmetic (indexer only) — Vite/TypeScript determines actual build correctness

## Key Architectural Decision
Demo mode only — all state in-memory mock files, no database, no auth.
**Why:** Pure demo for sales/investment pitches to addiction treatment centers.
**How to apply:** Never add fetch() calls, database queries, or auth checks. All "saves" are visual only.
