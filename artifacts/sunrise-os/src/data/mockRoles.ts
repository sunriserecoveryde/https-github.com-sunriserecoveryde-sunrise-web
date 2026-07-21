export type Permission = 'full' | 'read' | 'none';

export type RoleCategory =
  | 'Clinical'
  | 'Medical'
  | 'Nursing & Direct Care'
  | 'Operations'
  | 'Administrative'
  | 'Leadership'
  | 'IT & Security';

export interface RoleDefinition {
  id: string;
  label: string;
  shortLabel: string;   // fits in topbar badge
  description: string;
  color: string;        // tailwind bg class
  textColor: string;    // tailwind text class
  borderColor: string;  // tailwind border class
  dotColor: string;     // tailwind bg dot class
  category: RoleCategory;
  permissions: Record<string, Permission>;
}

/** Build permission map from explicit full/read lists; everything else → 'none' */
function perms(full: string[], read: string[]): Record<string, Permission> {
  const m: Record<string, Permission> = {};
  for (const s of full) m[s] = 'full';
  for (const s of read) m[s] = 'read';
  return m;
}

// ─── convenience screen-group arrays ────────────────────────────────────────
const SECURITY         = ['StaffAdmin'];
const CLINICAL_DIRECT  = ['PatientList','PatientDetail','CensusBedBoard','Admissions','Discharges','BedManagement'];
const CLINICAL_DOCS    = ['ChartReview','ProgressNotes','TreatmentPlans','ASAMAssessments','BiopsychosocialAssessment','DischargeSummary','GroupNotes','MedicalRecords'];
const CLINICAL_QUEUE   = ['CosignQueue','MyCaseload'];
const CLINICAL_RX      = ['PhysicianOrders','MATManagement','FormularyManagement','NursingMAR'];
const SCHEDULING_BASE  = ['AppointmentCalendar','GroupSchedule','GroupTherapyCurriculum'];
const RISK             = ['RiskDashboard','RecoveryEngagementScore','OutcomeTracking','UADrugTesting','IncidentReporting','CrisisAssessment','PopulationAnalytics'];
const CARE_COORD       = ['FamilyEngagement','AftercarePlanning','PeerSupport','TelehealthConsults','AlumniProgram'];
const SUPERVISION      = ['ClinicalSupervision','CertificationTracker'];
const OVERVIEW         = ['Dashboard','Settings','HelpSupport'];
const COMPLIANCE       = ['AuditCompliance','QualityImprovement','Training'];
const FINANCIAL        = ['RevenueCycle','FinancialCounseling'];
const COMMS            = ['SecureMessaging'];
const DEMO             = ['RoleExplorer']; // always visible to all roles

export const ROLES: RoleDefinition[] = [
  // ── 1. Clinical Supervisor ──────────────────────────────────────────────
  {
    id: 'clinical_supervisor',
    label: 'Clinical Supervisor',
    shortLabel: 'Clinical Supervisor',
    description: 'LCPC or LCSW-C (MD) / __DE_CAADC_CAC-AD__. Must hold Board Approved Supervisor (BAS) per MD BHA, or DSAMH-approved supervisor status (DE). Co-signs notes; documents required supervision hours.',
    color: 'bg-amber-500/20', textColor: 'text-amber-300', borderColor: 'border-amber-500/40', dotColor: 'bg-amber-400',
    category: 'Clinical',
    permissions: perms(
      [...OVERVIEW, ...CLINICAL_DIRECT, ...CLINICAL_DOCS, ...CLINICAL_QUEUE,
       ...SCHEDULING_BASE, ...RISK, ...CARE_COORD, ...SUPERVISION, ...COMMS, ...DEMO],
      ['WaitlistManager','ReferralTracker',...COMPLIANCE,'PhysicianOrders','MATManagement','FormularyManagement','CommandCenter'],
    ),
  },

  // ── 2. Certified Clinician ──────────────────────────────────────────────
  {
    id: 'certified_clinician',
    label: 'Certified Clinician',
    shortLabel: 'Certified Clinician',
    description: 'LPC + CAC-AD (MD) / CAC-AD — IC&RC (DE-DSAMH). Primary counselor; owns individual caseload. Publicly-funded clients require current BHA/DSAMH certification.',
    color: 'bg-blue-500/20', textColor: 'text-blue-300', borderColor: 'border-blue-500/40', dotColor: 'bg-blue-400',
    category: 'Clinical',
    permissions: perms(
      ['Dashboard','HelpSupport','PatientList','PatientDetail','ChartReview','ProgressNotes',
       'TreatmentPlans','ASAMAssessments','BiopsychosocialAssessment','DischargeSummary','GroupNotes',
       'MyCaseload','AppointmentCalendar','GroupSchedule','GroupTherapyCurriculum','CrisisAssessment',
       'FamilyEngagement','AftercarePlanning','TelehealthConsults','SecureMessaging','PeerSupport',...DEMO],
      ['CensusBedBoard','Admissions','Discharges','Settings','RiskDashboard','RecoveryEngagementScore',
       'OutcomeTracking','UADrugTesting','IncidentReporting','MATManagement','MedicalRecords',
       'FormularyManagement','BedManagement','CosignQueue','Training'],
    ),
  },

  // ── 3. Mental Health Therapist ──────────────────────────────────────────
  {
    id: 'mh_therapist',
    label: 'Mental Health Therapist',
    shortLabel: 'MH Therapist',
    description: 'LMFT, LCPC, or LCSW-C (MD) / LPCMH or LCSW (DE). Co-occurring MH focus. Licensed by MBPCT (MD) or DE Board of Mental Health & Chemical Dependency Professionals.',
    color: 'bg-purple-500/20', textColor: 'text-purple-300', borderColor: 'border-purple-500/40', dotColor: 'bg-purple-400',
    category: 'Clinical',
    permissions: perms(
      ['Dashboard','HelpSupport','PatientList','PatientDetail','ChartReview','ProgressNotes',
       'TreatmentPlans','BiopsychosocialAssessment','DischargeSummary','GroupNotes',
       'MyCaseload','AppointmentCalendar','GroupSchedule','GroupTherapyCurriculum','CrisisAssessment',
       'FamilyEngagement','AftercarePlanning','TelehealthConsults','SecureMessaging',...DEMO],
      ['CensusBedBoard','Admissions','Discharges','Settings','RiskDashboard','RecoveryEngagementScore',
       'OutcomeTracking','UADrugTesting','IncidentReporting','ASAMAssessments','MedicalRecords',
       'MATManagement','FormularyManagement','Training'],
    ),
  },

  // ── 4. Chief Medical Officer ────────────────────────────────────────────
  {
    id: 'cmo',
    label: 'Chief Medical Officer',
    shortLabel: 'CMO',
    description: 'Physician executive. Full clinical and operational oversight; final medical authority.',
    color: 'bg-red-500/20', textColor: 'text-red-300', borderColor: 'border-red-500/40', dotColor: 'bg-red-400',
    category: 'Medical',
    permissions: perms(
      ['Dashboard','CommandCenter','Settings','HelpSupport',
       ...CLINICAL_DIRECT,...CLINICAL_DOCS,...CLINICAL_QUEUE,...CLINICAL_RX,
       ...SCHEDULING_BASE,'StaffScheduling',...RISK,...CARE_COORD,...SUPERVISION,
       ...COMMS,...COMPLIANCE,'WaitlistManager','ReferralTracker','InsuranceAuthorization',
       'ShiftHandoff','PopulationAnalytics',...DEMO],
      [...FINANCIAL,'BusinessDevelopment'],
    ),
  },

  // ── 5. Prescriber ───────────────────────────────────────────────────────
  {
    id: 'prescriber',
    label: 'Prescriber',
    shortLabel: 'Prescriber',
    description: 'MD, DO, CRNP, Psychiatric CRNP. Writes orders; manages MAT; conducts telehealth.',
    color: 'bg-green-500/20', textColor: 'text-green-300', borderColor: 'border-green-500/40', dotColor: 'bg-green-400',
    category: 'Medical',
    permissions: perms(
      ['PatientList','PatientDetail','ChartReview','PhysicianOrders','MATManagement','FormularyManagement',
       'NursingMAR','TelehealthConsults','CrisisAssessment','DischargeSummary','BiopsychosocialAssessment',
       'ASAMAssessments','UADrugTesting','MedicalRecords','ProgressNotes','SecureMessaging',
       'AppointmentCalendar','Settings','HelpSupport',...DEMO],
      ['Dashboard','CensusBedBoard','RiskDashboard','TreatmentPlans','GroupNotes','IncidentReporting',
       'InsuranceAuthorization','OutcomeTracking','Training','ShiftHandoff'],
    ),
  },

  // ── 6. Nursing ──────────────────────────────────────────────────────────
  {
    id: 'nursing',
    label: 'Nursing',
    shortLabel: 'Nursing',
    description: 'RN, LPN. Maryland Board of Nursing (MBON) or Delaware Board of Nursing. Medication administration, vitals, COWS/CIWA-Ar, shift handoff, MAT monitoring.',
    color: 'bg-teal-500/20', textColor: 'text-teal-300', borderColor: 'border-teal-500/40', dotColor: 'bg-teal-400',
    category: 'Nursing & Direct Care',
    permissions: perms(
      ['NursingMAR','ShiftHandoff','UADrugTesting','IncidentReporting',
       'PatientList','PatientDetail','SecureMessaging','AppointmentCalendar','HelpSupport',...DEMO],
      ['Dashboard','CensusBedBoard','PhysicianOrders','MATManagement','FormularyManagement',
       'TreatmentPlans','ChartReview','RiskDashboard','CrisisAssessment','GroupSchedule',
       'MedicalRecords','Training','Settings'],
    ),
  },

  // ── 7. Director of Operations ───────────────────────────────────────────
  {
    id: 'director_of_operations',
    label: 'Director of Operations',
    shortLabel: 'Dir. Operations',
    description: 'Non-clinical operations: bed management, staffing, compliance, operational metrics.',
    color: 'bg-slate-500/20', textColor: 'text-slate-300', borderColor: 'border-slate-500/40', dotColor: 'bg-slate-400',
    category: 'Operations',
    permissions: perms(
      ['Dashboard','CommandCenter','CensusBedBoard','BedManagement','StaffScheduling','WaitlistManager',
       'InsuranceAuthorization','AuditCompliance','QualityImprovement','Training','IncidentReporting',
       'OutcomeTracking','RecoveryEngagementScore','PopulationAnalytics','CertificationTracker',
       'AlumniProgram','AftercarePlanning','SecureMessaging','AppointmentCalendar','GroupSchedule',
       'ReferralTracker','HelpSupport','Settings',...DEMO],
      ['PatientList','RevenueCycle','FinancialCounseling','BusinessDevelopment','ShiftHandoff'],
    ),
  },

  // ── 8. Behavioral Health Technician ────────────────────────────────────
  {
    id: 'bht',
    label: 'Behavioral Health Technician',
    shortLabel: 'BHT',
    description: 'BHT. Entry-level direct care under clinical supervision. Monitors patients, co-facilitates groups, logs observations.',
    color: 'bg-gray-500/20', textColor: 'text-gray-300', borderColor: 'border-gray-500/40', dotColor: 'bg-gray-400',
    category: 'Nursing & Direct Care',
    permissions: perms(
      ['IncidentReporting','UADrugTesting','ShiftHandoff','SecureMessaging','Training','HelpSupport',...DEMO],
      ['CensusBedBoard','PatientList','AppointmentCalendar','GroupSchedule','GroupTherapyCurriculum','Dashboard','PeerSupport'],
    ),
  },

  // ── 9. BHT Supervisor ──────────────────────────────────────────────────
  {
    id: 'bht_supervisor',
    label: 'BHT Supervisor',
    shortLabel: 'BHT Supervisor',
    description: 'Supervises BHT team. Direct-care access plus team scheduling and performance oversight.',
    color: 'bg-zinc-500/20', textColor: 'text-zinc-300', borderColor: 'border-zinc-500/40', dotColor: 'bg-zinc-400',
    category: 'Nursing & Direct Care',
    permissions: perms(
      ['IncidentReporting','UADrugTesting','ShiftHandoff','SecureMessaging','Training','HelpSupport',
       'StaffScheduling','CertificationTracker','QualityImprovement','AuditCompliance','RiskDashboard',...DEMO],
      ['CensusBedBoard','PatientList','AppointmentCalendar','GroupSchedule','GroupTherapyCurriculum',
       'Dashboard','PeerSupport','OutcomeTracking','PopulationAnalytics','ClinicalSupervision','Settings'],
    ),
  },

  // ── 10. Administrative Staff ────────────────────────────────────────────
  {
    id: 'admin_staff',
    label: 'Administrative Staff',
    shortLabel: 'Admin',
    description: 'Reception, Intake Coordinator, Office Manager, Transportation, Lab Staff.',
    color: 'bg-orange-500/20', textColor: 'text-orange-300', borderColor: 'border-orange-500/40', dotColor: 'bg-orange-400',
    category: 'Administrative',
    permissions: perms(
      ['AppointmentCalendar','WaitlistManager','Admissions','InsuranceAuthorization','UADrugTesting',
       'SecureMessaging','Training','HelpSupport','Settings',...DEMO],
      ['PatientList','CensusBedBoard','Dashboard','GroupSchedule','StaffScheduling','FinancialCounseling','AuditCompliance'],
    ),
  },

  // ── 11. Billing Staff ───────────────────────────────────────────────────
  {
    id: 'billing_staff',
    label: 'Billing Staff',
    shortLabel: 'Billing',
    description: 'Revenue cycle, insurance authorization, financial counseling. No clinical notes.',
    color: 'bg-yellow-500/20', textColor: 'text-yellow-300', borderColor: 'border-yellow-500/40', dotColor: 'bg-yellow-400',
    category: 'Administrative',
    permissions: perms(
      ['RevenueCycle','InsuranceAuthorization','FinancialCounseling','MedicalRecords',
       'SecureMessaging','Training','HelpSupport',...DEMO],
      ['PatientList','Dashboard','AuditCompliance','WaitlistManager','Admissions','Discharges','Settings'],
    ),
  },

  // ── 12. Accounting Staff ────────────────────────────────────────────────
  {
    id: 'accounting_staff',
    label: 'Accounting Staff',
    shortLabel: 'Accounting',
    description: 'Financial reporting and audit. Aggregate financials only.',
    color: 'bg-lime-500/20', textColor: 'text-lime-300', borderColor: 'border-lime-500/40', dotColor: 'bg-lime-400',
    category: 'Administrative',
    permissions: perms(
      ['RevenueCycle','AuditCompliance','Training','HelpSupport',...DEMO],
      ['Dashboard','FinancialCounseling','QualityImprovement','Settings'],
    ),
  },

  // ── 13. Business Development ────────────────────────────────────────────
  {
    id: 'business_development',
    label: 'Business Development',
    shortLabel: 'Biz Dev',
    description: 'Referral relationships, community outreach, marketing, census growth.',
    color: 'bg-emerald-500/20', textColor: 'text-emerald-300', borderColor: 'border-emerald-500/40', dotColor: 'bg-emerald-400',
    category: 'Administrative',
    permissions: perms(
      ['ReferralTracker','BusinessDevelopment','AlumniProgram','WaitlistManager',
       'SecureMessaging','Training','HelpSupport',...DEMO],
      ['Dashboard','OutcomeTracking','RecoveryEngagementScore','AppointmentCalendar','AuditCompliance','Settings'],
    ),
  },

  // ── 14. Ownership ───────────────────────────────────────────────────────
  {
    id: 'ownership',
    label: 'Ownership',
    shortLabel: 'Owner',
    description: 'Executive owner. Full financial, operational, and aggregate clinical oversight.',
    color: 'bg-rose-500/20', textColor: 'text-rose-300', borderColor: 'border-rose-500/40', dotColor: 'bg-rose-400',
    category: 'Leadership',
    permissions: perms(
      ['Dashboard','CommandCenter','RevenueCycle','FinancialCounseling','OutcomeTracking',
       'RecoveryEngagementScore','PopulationAnalytics','AuditCompliance','QualityImprovement',
       'BusinessDevelopment','ReferralTracker','CertificationTracker','StaffScheduling','BedManagement',
       'WaitlistManager','InsuranceAuthorization','AlumniProgram','Training','Settings','HelpSupport',
       'SecureMessaging','CensusBedBoard','IncidentReporting',...DEMO],
      ['PatientList','ShiftHandoff','ClinicalSupervision','RiskDashboard','AppointmentCalendar'],
    ),
  },

  // ── 15. Human Resources ─────────────────────────────────────────────────
  {
    id: 'human_resources',
    label: 'Human Resources',
    shortLabel: 'HR',
    description: 'Staff management, credentials, compliance training. Zero patient access.',
    color: 'bg-pink-500/20', textColor: 'text-pink-300', borderColor: 'border-pink-500/40', dotColor: 'bg-pink-400',
    category: 'Leadership',
    permissions: perms(
      ['CertificationTracker','Training','StaffScheduling','SecureMessaging','HelpSupport','Settings',...DEMO],
      ['Dashboard','AuditCompliance','QualityImprovement','ClinicalSupervision'],
    ),
  },

  // ── 16. Aftercare Staff ─────────────────────────────────────────────────
  {
    id: 'aftercare_staff',
    label: 'Aftercare Staff',
    shortLabel: 'Aftercare',
    description: 'Post-discharge alumni support, step-down coordination.',
    color: 'bg-sky-500/20', textColor: 'text-sky-300', borderColor: 'border-sky-500/40', dotColor: 'bg-sky-400',
    category: 'Administrative',
    permissions: perms(
      ['AftercarePlanning','AlumniProgram','AppointmentCalendar','SecureMessaging',
       'OutcomeTracking','Training','HelpSupport',...DEMO],
      ['PatientList','DischargeSummary','RecoveryEngagementScore','Dashboard','FamilyEngagement','Settings'],
    ),
  },

  // ── 17. Security Administrator ──────────────────────────────────────────
  {
    id: 'security_admin',
    label: 'Security Administrator',
    shortLabel: 'Security Admin',
    description: 'HIPAA Security Officer. Manages staff access, system permissions, audit trails. No patient data access.',
    color: 'bg-indigo-500/20', textColor: 'text-indigo-300', borderColor: 'border-indigo-500/40', dotColor: 'bg-indigo-400',
    category: 'IT & Security',
    permissions: perms(
      [...SECURITY, 'AuditCompliance', 'QualityImprovement', 'Training', 'Dashboard',
       'Settings', 'HelpSupport', 'CertificationTracker', 'StaffScheduling', 'SecureMessaging', ...DEMO],
      ['RevenueCycle', 'FinancialCounseling'],
    ),
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getRoleById(id: string): RoleDefinition | undefined {
  return ROLES.find(r => r.id === id);
}

export function getPermission(roleId: string, screen: string): Permission {
  const role = getRoleById(roleId);
  if (!role) return 'none';
  return role.permissions[screen] ?? 'none';
}

export function canAccess(roleId: string, screen: string): boolean {
  return getPermission(roleId, screen) !== 'none';
}

/** Returns labels of all roles that have 'full' (write) access to a screen */
export function getRolesWithEditAccess(screen: string): string[] {
  return ROLES.filter(r => (r.permissions[screen] ?? 'none') === 'full').map(r => r.label);
}

export const ROLE_CATEGORIES: RoleCategory[] = [
  'Clinical', 'Medical', 'Nursing & Direct Care', 'Operations', 'Administrative', 'Leadership', 'IT & Security',
];

export const DEFAULT_ROLE_ID = 'clinical_supervisor';
