import React, { useState } from 'react';
import { Screen } from '../App';
import { ROLES, ROLE_CATEGORIES, RoleCategory, Permission } from '../data/mockRoles';
import { useRole } from '../context/RoleContext';
import { Search, Shield, Eye, Minus, Download } from 'lucide-react';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

const ALL_SCREENS: { screen: Screen; label: string; section: string }[] = [
  { screen: 'Dashboard',               label: 'Dashboard',                   section: 'Overview' },
  { screen: 'CommandCenter',           label: 'Command Center',              section: 'Overview' },
  { screen: 'CensusBedBoard',          label: 'Census & Bed Board',          section: 'Clinical' },
  { screen: 'PatientList',             label: 'Patient List',                section: 'Clinical' },
  { screen: 'PatientDetail',           label: 'Patient Detail',              section: 'Clinical' },
  { screen: 'Admissions',             label: 'Admissions / Intake',         section: 'Scheduling, Intake & Admissions' },
  { screen: 'ClinicalForms',          label: 'Admissions Screening',        section: 'Scheduling, Intake & Admissions' },
  { screen: 'Discharges',             label: 'Discharges',                  section: 'Clinical' },
  { screen: 'BedManagement',          label: 'Bed Management',              section: 'Clinical' },
  { screen: 'ChartReview',            label: 'Chart Review',                section: 'Documentation' },
  { screen: 'ProgressNotes',          label: 'Progress Notes',              section: 'Documentation' },
  { screen: 'TreatmentPlans',         label: 'Treatment Plans',             section: 'Documentation' },
  { screen: 'ASAMAssessments',        label: 'ASAM Assessments',            section: 'Documentation' },
  { screen: 'BiopsychosocialAssessment', label: 'Biopsychosocial Intake',   section: 'Documentation' },
  { screen: 'DischargeSummary',       label: 'Discharge Summary',           section: 'Documentation' },
  { screen: 'MedicalRecords',         label: 'Medical Records / ROI',       section: 'Documentation' },
  { screen: 'GroupNotes',             label: 'Group Notes',                 section: 'Documentation' },
  { screen: 'CosignQueue',            label: 'Co-sign Queue',               section: 'Documentation' },
  { screen: 'MyCaseload',             label: 'My Caseload',                 section: 'Documentation' },
  { screen: 'AppointmentCalendar',    label: 'Appointment Calendar',        section: 'Scheduling' },
  { screen: 'GroupSchedule',          label: 'Group Schedule',              section: 'Scheduling' },
  { screen: 'GroupTherapyCurriculum', label: 'Group Curriculum Library',    section: 'Scheduling' },
  { screen: 'StaffScheduling',        label: 'Staff Scheduling',            section: 'Scheduling' },
  { screen: 'PhysicianOrders',        label: 'Physician Orders',            section: 'Clinical Rx' },
  { screen: 'MATManagement',          label: 'MAT Management',              section: 'Clinical Rx' },
  { screen: 'FormularyManagement',    label: 'Formulary & Drug Ref',        section: 'Clinical Rx' },
  { screen: 'NursingMAR',            label: 'Medication MAR',              section: 'Nursing' },
  { screen: 'ShiftHandoff',          label: 'Shift Handoff',               section: 'Nursing' },
  { screen: 'RiskDashboard',         label: 'Risk Dashboard',              section: 'Risk & Outcomes' },
  { screen: 'RecoveryEngagementScore', label: 'Recovery Engagement Score',  section: 'Risk & Outcomes' },
  { screen: 'OutcomeTracking',        label: 'Outcome Tracking',            section: 'Risk & Outcomes' },
  { screen: 'UADrugTesting',         label: 'UA / Drug Testing',           section: 'Risk & Outcomes' },
  { screen: 'IncidentReporting',     label: 'Incident Reports',            section: 'Risk & Outcomes' },
  { screen: 'CrisisAssessment',      label: 'Crisis Assessment (C-SSRS)',  section: 'Risk & Outcomes' },
  { screen: 'PopulationAnalytics',   label: 'Population Analytics',        section: 'Risk & Outcomes' },
  { screen: 'FamilyEngagement',      label: 'Family Engagement',           section: 'Care Coordination' },
  { screen: 'AftercarePlanning',     label: 'Aftercare Planning',          section: 'Care Coordination' },
  { screen: 'PeerSupport',           label: 'Peer Support Program',        section: 'Care Coordination' },
  { screen: 'TelehealthConsults',    label: 'Telehealth Consults',         section: 'Care Coordination' },
  { screen: 'AlumniProgram',         label: 'Alumni Program',              section: 'Care Coordination' },
  { screen: 'ClinicalSupervision',   label: 'Clinical Supervision',        section: 'Supervision' },
  { screen: 'CertificationTracker',  label: 'Certification Tracker',       section: 'Supervision' },
  { screen: 'SecureMessaging',       label: 'Secure Messaging',            section: 'Communications' },
  { screen: 'ReferralTracker',       label: 'Referral Tracker',            section: 'Operations' },
  { screen: 'WaitlistManager',       label: 'Waitlist Manager',            section: 'Operations' },
  { screen: 'BusinessDevelopment',   label: 'Business Development',        section: 'Operations' },
  { screen: 'InsuranceAuthorization', label: 'Insurance Auth / UR',        section: 'Operations' },
  { screen: 'RevenueCycle',          label: 'Revenue Cycle',               section: 'Billing & Compliance' },
  { screen: 'FinancialCounseling',   label: 'Financial Counseling',        section: 'Billing & Compliance' },
  { screen: 'AuditCompliance',       label: 'Audit Readiness',             section: 'Billing & Compliance' },
  { screen: 'QualityImprovement',    label: 'Quality Improvement',         section: 'Billing & Compliance' },
  { screen: 'Training',              label: 'Training',                    section: 'Billing & Compliance' },
  { screen: 'Settings',              label: 'Settings',                    section: 'System' },
  { screen: 'HelpSupport',           label: 'Help & Support',              section: 'System' },
  { screen: 'RoleExplorer',          label: 'Role Explorer',               section: 'System' },
];

const PERM_CELL: Record<Permission, React.ReactNode> = {
  full:  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded"><Shield className="w-2.5 h-2.5" />Full</span>,
  read:  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded"><Eye className="w-2.5 h-2.5" />Read</span>,
  none:  <span className="inline-flex items-center justify-center text-gray-300"><Minus className="w-3 h-3" /></span>,
};

export function RoleExplorer({ navigate: _navigate }: Props) {
  const { roleId, setRoleId } = useRole();
  const [mainTab, setMainTab] = useState<'Permission Matrix' | 'Role Descriptions' | 'Access Summary'>('Permission Matrix');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<RoleCategory | 'All'>('All');
  const [filterSection, setFilterSection] = useState<string>('All');
  // #31: "Focus on this role" — hides all other role columns to isolate the
  // selected role's screen permissions without visual clutter from other roles.
  const [focusOnRole, setFocusOnRole] = useState(false);

  const sections = Array.from(new Set(ALL_SCREENS.map(s => s.section)));

  const visibleRoles = ROLES.filter(r =>
    (filterCat === 'All' || r.category === filterCat) &&
    (!focusOnRole || r.id === roleId)
  );
  const visibleScreens = ALL_SCREENS.filter(s =>
    (filterSection === 'All' || s.section === filterSection) &&
    (search === '' || s.label.toLowerCase().includes(search.toLowerCase()) || s.section.toLowerCase().includes(search.toLowerCase()))
  );

  const fullCount  = (roleId: string) => ALL_SCREENS.filter(s => (ROLES.find(r => r.id === roleId)?.permissions[s.screen] ?? 'none') === 'full').length;
  const readCount  = (roleId: string) => ALL_SCREENS.filter(s => (ROLES.find(r => r.id === roleId)?.permissions[s.screen] ?? 'none') === 'read').length;

  // #30: CSV export of the full permission matrix for sharing with buyers/teams
  function exportPermissionCSV() {
    const allRoles = ROLES;
    const header = ['Screen', 'Section', ...allRoles.map(r => r.label)].join(',');
    const rows = ALL_SCREENS.map(s => {
      const cells = allRoles.map(r => {
        const perm = r.permissions[s.screen] ?? 'none';
        return perm === 'full' ? 'Full' : perm === 'read' ? 'Read' : '—';
      });
      return [`"${s.label}"`, `"${s.section}"`, ...cells].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sunrise-os-permissions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Role Explorer</h1>
          <p className="text-slate text-sm mt-0.5">Complete permission matrix — {ROLES.length} roles × {ALL_SCREENS.length} screens</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-600" />Full access</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-blue-600" />Read only</span>
          <span className="flex items-center gap-1"><Minus className="w-3 h-3 text-gray-400" />No access</span>
          {/* #30: buyers can export the matrix for offline sharing / team review */}
          <button
            onClick={exportPermissionCSV}
            title="Export permission matrix as CSV"
            className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white text-[11px] font-semibold rounded-lg hover:bg-navy-mid transition-colors"
          >
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['Permission Matrix', 'Role Descriptions', 'Access Summary'] as const).map(t => (
          <button key={t} onClick={() => setMainTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mainTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>
            {t}
          </button>
        ))}
      </div>

      {mainTab === 'Role Descriptions' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Scope of practice, typical responsibilities, and documentation authority for each role configured in Sunrise OS.</div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {[
              { role: 'Administrator', cred: 'Facility Admin / COO', scope: 'Full system access including settings, user management, billing, and all clinical data in read mode. Primary contact for audits.', doc: 'No clinical documentation authority. Can view all records.', screens: 'All screens — full admin' },
              { role: 'Medical Director', cred: 'MD / DO', scope: 'Oversees all clinical programming, MAT protocols, and medical policy. Full prescribing authority. Signs off on treatment plans and medical orders.', doc: 'All clinical notes, orders, and MAT documentation. Final co-sign authority.', screens: 'All clinical and medical screens' },
              { role: 'Attending Physician', cred: 'MD / DO', scope: 'Direct patient medical care, physical exams, withdrawal management, MAT prescribing, and medical clearance.', doc: 'Medical notes, orders, MAT orders, physical assessments.', screens: 'All clinical screens; full prescribing' },
              { role: 'Psychiatrist', cred: 'MD / DO — Psychiatry', scope: 'Psychiatric evaluation and diagnosis, medication management for co-occurring disorders, crisis consultation.', doc: 'Psychiatric evaluations, medication orders, crisis notes.', screens: 'Clinical + psychiatric/medication screens' },
              { role: 'Nurse Practitioner', cred: 'NP — PMHNP / FNP', scope: 'Collaborative prescribing, MAT management, psychiatric medication management under MD supervision or independent (state-dependent).', doc: 'Nursing notes, NP orders, MAT documentation. Requires MD cosign per state law.', screens: 'Clinical + medication screens' },
              { role: 'RN / Charge Nurse', cred: 'RN, CARN', scope: 'Medication administration, vital signs, withdrawal scoring (COWS/CIWA), nursing assessments, shift supervision.', doc: 'Nursing notes, MAR, vitals, incident reports. Requires MD/NP order for medications.', screens: 'Nursing, clinical, MAR, shift handoff' },
              { role: 'LPN', cred: 'LPN', scope: 'Medication administration under RN supervision, vital signs, basic nursing care, ADL support.', doc: 'MAR entries, basic nursing notes. Cannot independently assess or diagnose.', screens: 'MAR, vitals — supervised access' },
              { role: 'Licensed Counselor', cred: 'LCPC, LCADC, LCADC', scope: 'Individual and group therapy, treatment plan development, discharge planning, co-occurring disorder treatment.', doc: 'Progress notes, group notes, treatment plans, BPS assessments, discharge summaries. Requires supervisor cosign if still under supervision.', screens: 'All documentation and clinical screens' },
              { role: 'CAC-AD / CAC-AD', cred: 'CAC-AD, CAC-AD', scope: 'Substance use counseling, group facilitation, 12-step facilitation, case management under clinical supervision.', doc: 'Progress notes, group notes under supervision. CAC-AD may write more independently than CAC-AD per MD BHA guidelines.', screens: 'Documentation, groups, caseload — supervised' },
              { role: 'ADT / Peer Specialist', cred: 'ADT (Certified Peer Recovery Specialist)', scope: 'Peer mentorship, recovery coaching, 12-step sponsorship support, alumni outreach. Not a clinical role — cannot diagnose or prescribe.', doc: 'Peer contact notes, outreach logs.', screens: 'Peer support, census (read), messaging' },
              { role: 'Case Manager', cred: 'BSW, BA, or experience-based', scope: 'Housing coordination, benefits enrollment, insurance navigation, community resource linkage, discharge logistics.', doc: 'Case management notes, aftercare plan entries, referral documentation.', screens: 'Aftercare, referrals, census (read)' },
              { role: 'Billing / Compliance', cred: 'CPC, COC, or experience-based', scope: 'Claims submission, authorization management, revenue cycle, audit readiness, compliance monitoring.', doc: 'No clinical documentation. Full access to billing, auth, and compliance records.', screens: 'Billing, auth, compliance — no clinical docs' },
            ].map(r => (
              <div key={r.role} className="card">
                <div className="font-bold text-navy text-sm">{r.role}</div>
                <div className="text-[10px] text-slate uppercase tracking-wide mt-0.5 mb-2">{r.cred}</div>
                <div className="space-y-1.5">
                  <div><span className="font-semibold text-navy">Scope: </span><span className="text-slate">{r.scope}</span></div>
                  <div><span className="font-semibold text-navy">Documentation: </span><span className="text-slate">{r.doc}</span></div>
                  <div><span className="font-semibold text-navy">Screens: </span><span className="text-slate italic">{r.screens}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mainTab === 'Access Summary' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">High-level access summary by role — count of screens with full, read-only, and no access.</div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Permission Count by Role</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Role', 'Category', 'Full Access', 'Read Only', 'No Access', 'Coverage %', 'Notes'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ROLES.map(r => {
                  const full = fullCount(r.id);
                  const read = readCount(r.id);
                  const none = ALL_SCREENS.length - full - read;
                  const cov = Math.round(((full + read) / ALL_SCREENS.length) * 100);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-semibold text-navy">{r.shortLabel}</td>
                      <td className="px-3 py-2 text-slate">{r.category}</td>
                      <td className="px-3 py-2 font-bold text-green-700">{full}</td>
                      <td className="px-3 py-2 font-bold text-blue-700">{read}</td>
                      <td className="px-3 py-2 text-slate">{none}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                            <div className="h-1.5 rounded-full bg-navy" style={{ width: `${cov}%` }} />
                          </div>
                          <span className="font-semibold text-navy w-8 text-right">{cov}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate italic text-[10px]">
                        {full === ALL_SCREENS.length ? 'Full system access' : none === ALL_SCREENS.length ? 'No access configured' : full > 40 ? 'Broad clinical access' : read > 20 ? 'Primarily read-only' : 'Targeted access'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mainTab === 'Permission Matrix' && (<div className="space-y-5">

      {/* Role summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {ROLES.map(r => (
          <button key={r.id} onClick={() => setRoleId(r.id)}
            className={`text-left p-3 rounded-xl border transition-all ${roleId === r.id ? `${r.color} ${r.borderColor}` : 'border-border hover:border-orange/40 bg-white'}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${r.dotColor}`} />
              <span className={`text-xs font-bold ${roleId === r.id ? r.textColor : 'text-navy'}`}>{r.shortLabel}</span>
            </div>
            <div className="text-[10px] text-slate flex gap-2">
              <span className="text-green-600 font-semibold">{fullCount(r.id)} full</span>
              <span className="text-blue-600 font-semibold">{readCount(r.id)} read</span>
              <span className="text-gray-400">{ALL_SCREENS.length - fullCount(r.id) - readCount(r.id)} none</span>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate" />
          <input className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg"
            placeholder="Filter screens..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-border rounded-lg px-2 py-1.5 text-xs" value={filterCat} onChange={e => setFilterCat(e.target.value as RoleCategory | 'All')}>
          <option value="All">All Role Categories</option>
          {ROLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="border border-border rounded-lg px-2 py-1.5 text-xs" value={filterSection} onChange={e => setFilterSection(e.target.value)}>
          <option value="All">All Screen Sections</option>
          {sections.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* #31: Focus toggle — show only the selected role's column */}
        {roleId && (
          <button
            onClick={() => setFocusOnRole(f => !f)}
            title={focusOnRole ? 'Show all roles' : `Show only ${ROLES.find(r => r.id === roleId)?.label ?? 'selected role'}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors ${
              focusOnRole
                ? 'bg-sunrise-blue text-white border-sunrise-blue'
                : 'bg-white text-slate border-border hover:border-navy/40 hover:text-navy'
            }`}
          >
            <Eye className="w-3 h-3" /> {focusOnRole ? 'All roles' : 'Focus role'}
          </button>
        )}
        <span className="text-xs text-slate">{visibleScreens.length} screens · {visibleRoles.length} roles shown</span>
      </div>

      {/* Matrix table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-navy text-white">
                <th className="sticky left-0 bg-navy z-10 px-3 py-2.5 font-semibold text-xs w-52 min-w-52 border-r border-white/10">
                  Screen
                </th>
                <th className="px-2 py-2.5 font-semibold text-[10px] text-slate-300 w-24 min-w-16">Section</th>
                {visibleRoles.map(r => (
                  <th key={r.id} className={`px-2 py-2.5 font-semibold text-center min-w-24 cursor-pointer transition-colors ${roleId === r.id ? r.color : 'hover:bg-white/5'}`}
                      onClick={() => setRoleId(r.id)}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${r.dotColor}`} />
                      <span className={`${roleId === r.id ? r.textColor : 'text-white'} text-[10px] leading-tight text-center`}>{r.shortLabel}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                let lastSection = '';
                return visibleScreens.map((s, i) => {
                  const sectionHeader = s.section !== lastSection;
                  lastSection = s.section;
                  return (
                    <React.Fragment key={s.screen}>
                      {sectionHeader && (
                        <tr className="bg-navy/5">
                          <td colSpan={2 + visibleRoles.length} className="sticky left-0 px-3 py-1.5 text-[10px] font-bold text-slate uppercase tracking-wider bg-gray-50 border-y border-border">
                            {s.section}
                          </td>
                        </tr>
                      )}
                      <tr className={`border-b border-border ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-orange/5 transition-colors`}>
                        <td className="sticky left-0 bg-inherit z-10 px-3 py-2 font-semibold text-navy border-r border-border w-52 min-w-52">
                          {s.label}
                        </td>
                        <td className="px-2 py-2 text-[10px] text-slate">{s.section}</td>
                        {visibleRoles.map(r => {
                          const p: Permission = (r.permissions[s.screen] ?? 'none') as Permission;
                          return (
                            <td key={r.id} className={`px-2 py-2 text-center ${roleId === r.id ? r.color + '/30' : ''}`}>
                              {PERM_CELL[p]}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
      </div>)}
    </div>
  );
}
