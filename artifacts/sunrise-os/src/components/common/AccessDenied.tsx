import React from 'react';
import { Lock, ChevronRight } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { ROLES, ROLE_CATEGORIES, RoleCategory } from '../../data/mockRoles';
import type { Screen } from '../../App';

interface Props {
  screen: Screen;
  screenLabel: string;
  onSwitchRole?: () => void;
}

const SCREEN_LABELS: Partial<Record<Screen, string>> = {
  Dashboard: 'Dashboard', CommandCenter: 'Command Center', CensusBedBoard: 'Census & Bed Board',
  PatientList: 'Patient List', Admissions: 'Admissions / Intake', Discharges: 'Discharges',
  ChartReview: 'Chart Review', ProgressNotes: 'Progress Notes', TreatmentPlans: 'Treatment Plans',
  ASAMAssessments: 'ASAM Assessments', GroupNotes: 'Group Notes', CosignQueue: 'Co-sign Queue',
  AppointmentCalendar: 'Appointment Calendar', GroupSchedule: 'Group Schedule', RiskDashboard: 'Risk Dashboard',
  RecoveryEngagementScore: 'Recovery Engagement Score', OutcomeTracking: 'Outcome Tracking',
  ReferralTracker: 'Referral Tracker', BusinessDevelopment: 'Business Development',
  BedManagement: 'Bed Management', RevenueCycle: 'Revenue Cycle', AuditCompliance: 'Audit Readiness',
  Training: 'Training', Settings: 'Settings', HelpSupport: 'Help & Support',
  UADrugTesting: 'UA / Drug Testing', IncidentReporting: 'Incident Reports', StaffScheduling: 'Staff Scheduling',
  MATManagement: 'MAT Management', FamilyEngagement: 'Family Engagement', PhysicianOrders: 'Physician Orders',
  PopulationAnalytics: 'Population Analytics', NursingMAR: 'Medication MAR', ShiftHandoff: 'Shift Handoff',
  QualityImprovement: 'Quality Improvement', InsuranceAuthorization: 'Insurance Auth / UR',
  AftercarePlanning: 'Aftercare Planning', MyCaseload: 'My Caseload',
  BiopsychosocialAssessment: 'Biopsychosocial Intake', DischargeSummary: 'Discharge Summary',
  CrisisAssessment: 'Crisis Assessment', AlumniProgram: 'Alumni Program', TelehealthConsults: 'Telehealth Consults',
  ClinicalSupervision: 'Clinical Supervision', MedicalRecords: 'Medical Records / ROI',
  PeerSupport: 'Peer Support Program', FinancialCounseling: 'Financial Counseling',
  GroupTherapyCurriculum: 'Group Curriculum Library', CertificationTracker: 'Certification Tracker',
  WaitlistManager: 'Waitlist Manager', SecureMessaging: 'Secure Messaging',
  FormularyManagement: 'Formulary & Drug Ref', PatientDetail: 'Patient Detail', RoleExplorer: 'Role Explorer',
};

export function getScreenLabel(screen: Screen): string {
  return SCREEN_LABELS[screen] ?? screen;
}

export function AccessDenied({ screen, onSwitchRole }: Props) {
  const { role } = useRole();
  const label = getScreenLabel(screen);

  // Roles that DO have access
  const rolesWithAccess = ROLES.filter(r => (r.permissions[screen] ?? 'none') !== 'none');
  const grouped: Partial<Record<RoleCategory, string[]>> = {};
  for (const r of rolesWithAccess) {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category]!.push(r.label);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6" data-testid="access-denied">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Lock icon */}
        <div className="w-20 h-20 rounded-full bg-navy/10 flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10 text-slate-400" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-navy">Access Restricted</h2>
          <p className="text-slate mt-2">
            <span className="font-semibold text-orange">{role.label}</span> does not have permission to view{' '}
            <span className="font-semibold text-navy">{label}</span>.
          </p>
        </div>

        {/* Current role badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${role.color} ${role.borderColor}`}>
          <div className={`w-2 h-2 rounded-full ${role.dotColor}`} />
          <span className={`text-sm font-semibold ${role.textColor}`}>Current role: {role.label}</span>
        </div>

        {/* Roles that have access */}
        {rolesWithAccess.length > 0 && (
          <div className="card text-left">
            <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-3">Roles with access to {label}</div>
            <div className="space-y-3">
              {ROLE_CATEGORIES.filter(cat => grouped[cat]).map(cat => (
                <div key={cat}>
                  <div className="text-xs text-slate mb-1">{cat}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {grouped[cat]!.map(roleName => (
                      <span key={roleName} className="text-xs bg-navy/10 text-navy px-2.5 py-1 rounded-full font-medium">{roleName}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Switch role CTA */}
        {onSwitchRole && (
          <button onClick={onSwitchRole} className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 mx-auto">
            Switch Role <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <p className="text-xs text-slate">
          In a live system, access is enforced by server-side authentication.
          This demo uses role switching to illustrate permission boundaries.
        </p>
      </div>
    </div>
  );
}
