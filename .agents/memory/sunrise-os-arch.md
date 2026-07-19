---
name: Sunrise OS Architecture
description: Screen union (53 values), data files, Sidebar sections, key conventions
---

## Artifact Root
`artifacts/sunrise-os/src/`
Workflow: `artifacts/sunrise-os: web` — must be running for preview.

## Screen Union (54 values — current, includes StaffAdmin added with auth session)
`Dashboard`, `CommandCenter`, `CensusBedBoard`, `PatientList`, `Admissions`, `Discharges`,
`ChartReview`, `ProgressNotes`, `TreatmentPlans`, `ASAMAssessments`, `GroupNotes`, `CosignQueue`,
`MyCaseload`, `AppointmentCalendar`, `GroupSchedule`, `StaffScheduling`, `RiskDashboard`,
`RecoveryEngagementScore`, `OutcomeTracking`, `UADrugTesting`, `IncidentReporting`,
`ReferralTracker`, `BusinessDevelopment`, `BedManagement`, `InsuranceAuthorization`,
`AftercarePlanning`, `RevenueCycle`, `AuditCompliance`, `QualityImprovement`, `Training`,
`Settings`, `HelpSupport`, `MATManagement`, `FamilyEngagement`, `PhysicianOrders`,
`PopulationAnalytics`, `NursingMAR`, `ShiftHandoff`, `BiopsychosocialAssessment`,
`DischargeSummary`, `CrisisAssessment`, `AlumniProgram`, `TelehealthConsults`,
`ClinicalSupervision`, `MedicalRecords`, `PeerSupport`, `FinancialCounseling`,
`GroupTherapyCurriculum`, `CertificationTracker`, `WaitlistManager`, `SecureMessaging`,
`FormularyManagement`, `PatientDetail`

## Data Files
- `data/mockPatients.ts` — `Patient` interface + `MOCK_PATIENTS` (20 patients p1–p20)
- `data/mockReferrals.ts` — 15 referral sources
- `data/mockStaff.ts` — 12 staff members
- `data/mockGroups.ts` — weekly group therapy schedule
- `data/mockMedications.ts` — MAT/psychiatric/medical/PRN; `getPatientMedications(id)`
- `data/mockVitals.ts` — COWS/CIWA/vitals; `getPatientVitals(id)`
- `data/mockLabs.ts` — lab results by panel; `getPatientLabs(id)`, `LAB_PANEL_ORDER`

## Sidebar Sections (current)
- OVERVIEW: Dashboard, Command Center
- CLINICAL: Census & Bed Board, Patient List, Admissions, Discharges, MAT Management, Family Engagement, Physician Orders, Peer Support Program, Telehealth Consults
- DOCUMENTATION: Chart Review, Progress Notes (5), Treatment Plans (3), ASAM Assessments, Biopsychosocial Intake, Discharge Summary, Medical Records/ROI, Group Notes, Co-sign Queue (4), My Caseload
- SCHEDULING: Appointment Calendar, Group Schedule, Group Curriculum Library, Staff Scheduling
- RISK & OUTCOMES: Risk Dashboard, Recovery Engagement Score, Outcome Tracking, Population Analytics, UA/Drug Testing, Incident Reports, Crisis Assessment (C-SSRS)
- NURSING: Medication MAR, Shift Handoff
- OPERATIONS: Referral Tracker, Waitlist Manager, Business Development, Bed Management, Insurance Auth/UR, Aftercare Planning, Alumni Program
- BILLING & COMPLIANCE: Revenue Cycle, Financial Counseling, Audit Readiness, Quality Improvement, Training, Formulary & Drug Ref
- SUPERVISION: Clinical Supervision, Certification Tracker
- COMMUNICATIONS: Secure Messaging (badge: 3)
- Footer: Settings, Help & Support

## Key Conventions
- All pages receive `{ navigate: (s: Screen, patientId?: string) => void }`
- Screen union declared in `App.tsx`, imported by Sidebar and all pages
- All lucide-react icons used in Sidebar MUST be explicitly imported in `Sidebar.tsx` — runtime crash if missing (TS won't catch)
- Recharts throughout for charts — `ResponsiveContainer` + `CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"`
- CSS classes: `btn-primary`, `card`, `bg-navy`, `text-orange`/`bg-orange`, `text-sunrise-blue`, `bg-success`, `bg-critical`, `text-slate`, `border-border`, `bg-bg`
- Color tokens in `tailwind.config.js` — use those, not raw hex

## Known Pitfalls
- Apostrophes in JSX string literals (`I've`, `I'd`) break Babel — use `\'` or backtick template strings
- `Record<string, string | string[]>` on data objects causes TS errors — use explicit interfaces
- All lucide icons in Sidebar must be in its import line — runtime "X is not defined" if missing (even if TS passes)
- Duplicate `];` in Sidebar sections array caused a brief Vite error — the sections array `const sections = [...]` must have exactly one closing `];`
- Replit-cartographer Babel errors are cosmetic (indexer only) — Vite/TypeScript determines build correctness

## What's Next (possible additions)
- Patient messaging / HIPAA inbox from patient portal perspective
- Outcomes report PDF export
- Referral intake form in ReferralTracker
- Crisis stabilization unit board
- Drug interaction checker (now in FormularyManagement — could deepen)
- PatientDetail: Vitals tab sparkline trend, Labs tab trending arrows
