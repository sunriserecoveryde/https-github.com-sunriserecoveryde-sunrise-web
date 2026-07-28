import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_STAFF } from '../data/mockStaff';
import { CheckCircle, X, Plus, Calendar } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

interface TrainingRecord {
  staffId: string;
  staffName: string;
  role: string;
  department: string;
  completions: Record<string, { completed: boolean; date: string; expiration: string; daysUntilExpiry: number }>;
}

interface TrainingCourse {
  id: string;
  name: string;
  category: string;
  required: boolean;
  renewalMonths: number;
  applicableTo: string[];
}

const COURSES: TrainingCourse[] = [
  { id: 'c1', name: 'HIPAA / 42 CFR Part 2', category: 'Compliance', required: true, renewalMonths: 12, applicableTo: ['All'] },
  { id: 'c2', name: 'CPR / First Aid', category: 'Safety', required: true, renewalMonths: 24, applicableTo: ['All'] },
  { id: 'c3', name: 'Mandated Reporter', category: 'Compliance', required: true, renewalMonths: 12, applicableTo: ['All'] },
  { id: 'c4', name: 'Crisis De-escalation (CPI)', category: 'Clinical', required: true, renewalMonths: 12, applicableTo: ['Clinical', 'Operations', 'Nursing'] },
  { id: 'c5', name: 'ASAM Criteria Training', category: 'Clinical', required: true, renewalMonths: 24, applicableTo: ['Clinical', 'Medical'] },
  { id: 'c6', name: 'MOUD and Buprenorphine Treatment Competency', category: 'Medical', required: false, renewalMonths: 36, applicableTo: ['Medical'] },
  { id: 'c7', name: 'Documentation & Chart Integrity', category: 'Compliance', required: true, renewalMonths: 12, applicableTo: ['Clinical', 'Nursing', 'Admissions'] },
  { id: 'c8', name: 'Trauma-Informed Care', category: 'Clinical', required: true, renewalMonths: 24, applicableTo: ['Clinical', 'Operations'] },
  { id: 'c9', name: 'Suicide Risk Assessment', category: 'Clinical', required: true, renewalMonths: 12, applicableTo: ['Clinical', 'Medical', 'Nursing'] },
  { id: 'c10', name: 'Fire Safety & Evacuation', category: 'Safety', required: true, renewalMonths: 12, applicableTo: ['All'] },
];

const TRAINING_DATA: TrainingRecord[] = MOCK_STAFF.map((s, si) => {
  const completions: TrainingRecord['completions'] = {};
  COURSES.forEach((c, ci) => {
    const applies = c.applicableTo.includes('All') || c.applicableTo.includes(s.department);
    if (!applies) return;
    const completed = (si + ci) % 7 !== 0 && (si + ci) % 11 !== 0;
    const daysUntilExpiry = completed ? (ci * 45 + si * 12 + 30) % 400 - 30 : 0;
    completions[c.id] = {
      completed,
      date: completed ? '2025-' + String((si % 12) + 1).padStart(2, '0') + '-' + String((ci * 3 + 10) % 28 + 1).padStart(2, '0') : '',
      expiration: completed ? '2026-' + String(((si + ci) % 12) + 1).padStart(2, '0') + '-' + String((ci * 3 + 10) % 28 + 1).padStart(2, '0') : '',
      daysUntilExpiry: completed ? daysUntilExpiry : -1,
    };
  });
  return { staffId: s.id, staffName: `${s.firstName} ${s.lastName}`, role: s.title, department: s.department, completions };
});

interface ScheduledTraining {
  id: string;
  title: string;
  date: string;
  time: string;
  instructor: string;
  location: string;
  registeredCount: number;
  capacity: number;
  category: string;
  ceuHours: number;
}

const SCHEDULED: ScheduledTraining[] = [
  { id: 'st1', title: 'HIPAA & 42 CFR Part 2 Annual Refresher', date: '2026-07-22', time: '9:00 AM – 11:00 AM', instructor: 'James S. Collins III', location: 'Conference Room A', registeredCount: 8, capacity: 20, category: 'Compliance', ceuHours: 2 },
  { id: 'st2', title: 'CPI Crisis De-escalation Recertification', date: '2026-07-29', time: '8:00 AM – 4:00 PM', instructor: 'Kevin Wright (CPI Certified)', location: 'Main Group Room', registeredCount: 6, capacity: 12, category: 'Clinical', ceuHours: 8 },
  { id: 'st3', title: 'Trauma-Informed Care — Level 2', date: '2026-08-05', time: '1:00 PM – 4:00 PM', instructor: 'Dr. Allen Hughes', location: 'Conference Room A', registeredCount: 4, capacity: 15, category: 'Clinical', ceuHours: 3 },
  { id: 'st4', title: 'Motivational Interviewing (MI) Foundations', date: '2026-08-12', time: '9:00 AM – 12:00 PM', instructor: 'Sarah Jenkins, LCPC', location: 'Group Room B', registeredCount: 7, capacity: 12, category: 'Clinical', ceuHours: 3 },
  { id: 'st5', title: 'Fire Safety & Emergency Evacuation Drill', date: '2026-08-19', time: '10:00 AM – 11:00 AM', instructor: 'Kevin Wright', location: 'Full Facility', registeredCount: 12, capacity: 30, category: 'Safety', ceuHours: 1 },
];

const CATEGORY_COLORS: Record<string, string> = {
  Compliance: 'bg-red-100 text-red-700',
  Clinical: 'bg-blue-100 text-blue-700',
  Safety: 'bg-amber-100 text-amber-700',
  Medical: 'bg-purple-100 text-purple-700',
};

export function Training({ navigate, readOnly }: Props) {
  const [activeTab, setActiveTab] = useState<'Compliance Matrix' | 'Scheduled Training' | 'CEU Tracking' | 'Policies & SOPs' | 'Onboarding' | 'Training Library'>('Compliance Matrix');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [trainingSaved, setTrainingSaved] = useState<string | null>(null);
  const saveTrainingAction = (msg: string) => { setTrainingSaved(msg); setTimeout(() => setTrainingSaved(null), 2500); };

  const departments = Array.from(new Set(MOCK_STAFF.map(s => s.department)));
  const filteredStaff = TRAINING_DATA.filter(t => deptFilter === 'All' || t.department === deptFilter);

  // Compliance stats
  const totalRequired = TRAINING_DATA.reduce((sum, staff) => {
    return sum + COURSES.filter(c => (c.applicableTo.includes('All') || c.applicableTo.includes(staff.department)) && c.required).length;
  }, 0);
  const totalCompleted = TRAINING_DATA.reduce((sum, staff) => {
    return sum + COURSES.filter(c => {
      if (!((c.applicableTo.includes('All') || c.applicableTo.includes(staff.department)) && c.required)) return false;
      return staff.completions[c.id]?.completed;
    }).length;
  }, 0);
  const complianceRate = Math.round((totalCompleted / totalRequired) * 100);
  const expiringCount = TRAINING_DATA.reduce((sum, staff) => {
    return sum + Object.values(staff.completions).filter(c => c.completed && c.daysUntilExpiry >= 0 && c.daysUntilExpiry <= 60).length;
  }, 0);
  const overdueCount = TRAINING_DATA.reduce((sum, staff) => {
    return sum + Object.values(staff.completions).filter(c => !c.completed).length;
  }, 0);

  const getCellStatus = (record: TrainingRecord, courseId: string) => {
    const comp = record.completions[courseId];
    if (!comp) return 'n/a';
    if (!comp.completed) return 'overdue';
    if (comp.daysUntilExpiry < 0) return 'expired';
    if (comp.daysUntilExpiry <= 60) return 'expiring';
    return 'current';
  };

  const cellStyles: Record<string, string> = {
    'n/a': 'bg-gray-50 text-gray-300',
    'overdue': 'bg-red-100 text-red-700',
    'expired': 'bg-red-200 text-red-800',
    'expiring': 'bg-amber-100 text-amber-700',
    'current': 'bg-green-100 text-green-700',
  };

  const cellLabel: Record<string, string> = {
    'n/a': '—',
    'overdue': '✗',
    'expired': '!',
    'expiring': '⚠',
    'current': '✓',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Training & Certification</h1>
          <p className="text-slate text-sm mt-0.5">Staff training compliance, certifications, and scheduled sessions</p>
        </div>
        <LockedButton locked={readOnly} onClick={() => setScheduleOpen(true)} className="btn-primary text-sm px-4 py-2">+ Schedule Training</LockedButton>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <div className={`text-3xl font-bold ${complianceRate >= 90 ? 'text-green-600' : complianceRate >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{complianceRate}%</div>
          <div className="text-xs text-slate mt-1">Overall Compliance</div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full">
            <div className={`h-2 rounded-full ${complianceRate >= 90 ? 'bg-green-500' : complianceRate >= 75 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${complianceRate}%` }} />
          </div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600">{overdueCount}</div>
          <div className="text-xs text-slate mt-1">Overdue Items</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-amber-600">{expiringCount}</div>
          <div className="text-xs text-slate mt-1">Expiring (60 days)</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{SCHEDULED.length}</div>
          <div className="text-xs text-slate mt-1">Upcoming Sessions</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-slate font-medium">Legend:</span>
        {[
          { status: 'current', label: '✓ Current' },
          { status: 'expiring', label: '⚠ Expiring (60d)' },
          { status: 'expired', label: '! Expired' },
          { status: 'overdue', label: '✗ Not Completed' },
          { status: 'n/a', label: '— Not Applicable' },
        ].map(l => (
          <span key={l.status} className={`px-2 py-0.5 rounded-full font-medium ${cellStyles[l.status]}`}>{l.label}</span>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Compliance Matrix', 'Scheduled Training', 'CEU Tracking', 'Policies & SOPs', 'Onboarding', 'Training Library'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {activeTab === 'Compliance Matrix' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate">Filter by Department:</span>
            <div className="flex gap-2 flex-wrap">
              {['All', ...departments].map(d => (
                <button key={d} onClick={() => setDeptFilter(d)} className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${deptFilter === d ? 'bg-navy text-white border-navy' : 'bg-white text-slate border-border'}`}>{d}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse min-w-full">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 bg-gray-50 border border-border font-semibold text-slate min-w-40 sticky left-0 z-10">Staff Member</th>
                  {COURSES.map(c => (
                    <th key={c.id} className={`px-2 py-1 border border-border font-medium text-center w-20 ${CATEGORY_COLORS[c.category]}`}>
                      <div className="writing-mode-vertical-lr" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: 90, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2 bg-gray-50 border border-border font-semibold text-slate text-center">Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(staff => {
                  const applicable = COURSES.filter(c => c.applicableTo.includes('All') || c.applicableTo.includes(staff.department));
                  const compliant = applicable.filter(c => getCellStatus(staff, c.id) === 'current').length;
                  const pct = Math.round((compliant / applicable.length) * 100);
                  return (
                    <tr key={staff.staffId} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border border-border bg-white sticky left-0 z-10">
                        <div className="font-medium text-navy">{staff.staffName}</div>
                        <div className="text-slate text-xs">{staff.role}</div>
                      </td>
                      {COURSES.map(c => {
                        const status = getCellStatus(staff, c.id);
                        return (
                          <td key={c.id} className={`border border-border text-center font-bold ${cellStyles[status]}`} title={status === 'n/a' ? 'Not applicable' : staff.completions[c.id]?.expiration ? `Exp: ${staff.completions[c.id].expiration}` : 'Not completed'}>
                            {cellLabel[status]}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 border border-border text-center">
                        <span className={`font-bold text-sm ${pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Scheduled Training' && (
        <div className="space-y-3">
          {SCHEDULED.map(s => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-navy">{s.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[s.category]}`}>{s.category}</span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{s.ceuHours} CEU {s.ceuHours === 1 ? 'hr' : 'hrs'}</span>
                  </div>
                  <div className="text-sm text-slate mt-1">
                    📅 {s.date} · 🕐 {s.time} · 📍 {s.location}
                  </div>
                  <div className="text-sm text-slate">Instructor: <span className="font-medium text-navy">{s.instructor}</span></div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-sm font-bold text-navy">{s.registeredCount}/{s.capacity}</div>
                  <div className="text-xs text-slate">Registered</div>
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full w-20">
                    <div className="h-1.5 bg-orange rounded-full" style={{ width: `${(s.registeredCount / s.capacity) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <LockedButton locked={readOnly} onClick={() => saveTrainingAction('Staff registered')} className="btn-primary text-sm px-3 py-1.5">Register Staff</LockedButton>
                <button className="btn-outline text-sm px-3 py-1.5">View Attendees</button>
                <LockedButton locked={readOnly} onClick={() => setScheduleOpen(true)} className="btn-outline text-sm px-3 py-1.5">Edit Session</LockedButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'CEU Tracking' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Staff Member</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">CEUs (YTD)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">CEU Required (Annual)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">License Renewal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_STAFF.map((s, i) => {
                const ceuRequired = s.department === 'Clinical' ? 30 : s.department === 'Medical' ? 40 : s.department === 'Nursing' ? 30 : 10;
                const ceuCompleted = (i * 7 + 12) % (ceuRequired + 5);
                const renewalDate = `2026-${String((i % 12) + 1).padStart(2, '0')}-01`;
                const onTrack = ceuCompleted >= ceuRequired * 0.5;
                return (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-navy">{s.firstName} {s.lastName}</td>
                    <td className="px-4 py-3 text-slate">{s.title}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 bg-gray-100 rounded-full">
                          <div className={`h-2 rounded-full ${ceuCompleted >= ceuRequired ? 'bg-green-500' : onTrack ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${Math.min((ceuCompleted / ceuRequired) * 100, 100)}%` }} />
                        </div>
                        <span className="font-medium text-navy">{ceuCompleted} hrs</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate">{ceuRequired} hrs</td>
                    <td className="px-4 py-3 text-slate font-mono text-xs">{renewalDate}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ceuCompleted >= ceuRequired ? 'bg-green-100 text-green-700' : onTrack ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {ceuCompleted >= ceuRequired ? 'Complete' : onTrack ? 'On Track' : 'Behind'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Policies & SOPs' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Active Policies', value: 48, sub: 'Current version', color: 'text-navy' },
              { label: 'Due for Review', value: 5, sub: 'Within 30 days', color: 'text-amber-600' },
              { label: 'Updated This Quarter', value: 11, sub: 'Reflecting reg changes', color: 'text-green-600' },
              { label: 'Avg Staff Attestation', value: '91%', sub: 'Read & acknowledged', color: 'text-blue-600' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          {[
            {
              category: '🏥 Clinical Operations',
              items: [
                { title: 'Admission & Intake Procedures', version: '3.2', revised: '2026-04-01', reviewDue: '2027-04-01', attestation: 94, status: 'Current' },
                { title: 'Level of Care Placement (ASAM Criteria)', version: '2.0', revised: '2026-01-15', reviewDue: '2027-01-15', attestation: 89, status: 'Current' },
                { title: 'Discharge Planning & Aftercare Coordination', version: '4.1', revised: '2026-03-10', reviewDue: '2027-03-10', attestation: 92, status: 'Current' },
                { title: 'Treatment Plan Development & Review', version: '5.0', revised: '2026-06-01', reviewDue: '2027-06-01', attestation: 97, status: 'Current' },
                { title: 'Group Therapy Facilitation Standards', version: '2.3', revised: '2025-12-01', reviewDue: '2026-12-01', attestation: 88, status: 'Current' },
              ]
            },
            {
              category: '💊 Medication Safety',
              items: [
                { title: 'Medication Administration — MAR Procedures', version: '6.0', revised: '2026-05-20', reviewDue: '2027-05-20', attestation: 98, status: 'Current' },
                { title: 'Controlled Substance Count & Reconciliation', version: '4.4', revised: '2026-02-01', reviewDue: '2027-02-01', attestation: 100, status: 'Current' },
                { title: 'MAT Induction & Monitoring Protocol', version: '3.1', revised: '2026-07-01', reviewDue: '2027-07-01', attestation: 85, status: 'Current' },
                { title: 'Medication Error Reporting & Root Cause Analysis', version: '2.2', revised: '2025-11-01', reviewDue: '2026-11-01', attestation: 91, status: 'Due for Review' },
              ]
            },
            {
              category: '🔒 Privacy & Compliance',
              items: [
                { title: '42 CFR Part 2 — Confidentiality of SUD Records', version: '7.0', revised: '2026-03-25', reviewDue: '2027-03-25', attestation: 95, status: 'Current' },
                { title: 'HIPAA Privacy & Security Policy', version: '5.1', revised: '2026-01-01', reviewDue: '2027-01-01', attestation: 93, status: 'Current' },
                { title: 'Mandatory Reporting — Abuse/Neglect/Exploitation', version: '3.0', revised: '2025-09-01', reviewDue: '2026-09-01', attestation: 89, status: 'Due for Review' },
                { title: 'Incident Reporting & Critical Event Management', version: '4.0', revised: '2026-04-15', reviewDue: '2027-04-15', attestation: 96, status: 'Current' },
              ]
            },
            {
              category: '🚨 Safety & Emergency',
              items: [
                { title: 'Suicide / Self-Harm Risk Assessment & Response', version: '5.2', revised: '2026-06-15', reviewDue: '2027-06-15', attestation: 99, status: 'Current' },
                { title: 'AMS / Seizure Emergency Response Protocol', version: '2.1', revised: '2026-02-20', reviewDue: '2027-02-20', attestation: 97, status: 'Current' },
                { title: 'Fire & Evacuation Procedures', version: '3.3', revised: '2025-10-01', reviewDue: '2026-10-01', attestation: 87, status: 'Due for Review' },
                { title: 'Workplace Violence Prevention & De-escalation', version: '3.0', revised: '2025-08-01', reviewDue: '2026-08-01', attestation: 82, status: 'Due for Review' },
                { title: 'Infection Control & Universal Precautions', version: '4.2', revised: '2026-05-01', reviewDue: '2027-05-01', attestation: 94, status: 'Current' },
              ]
            },
          ].map(section => (
            <div key={section.category} className="card p-0 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-border font-semibold text-navy text-sm">{section.category}</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-bg text-slate">
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider">Policy / SOP</th>
                    <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Version</th>
                    <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Last Revised</th>
                    <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Review Due</th>
                    <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Attestation</th>
                    <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Status</th>
                    <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {section.items.map(item => (
                    <tr key={item.title} className={`hover:bg-gray-50 ${item.status === 'Due for Review' ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-4 py-2.5 font-medium text-navy">{item.title}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-slate">v{item.version}</td>
                      <td className="px-3 py-2.5 text-center text-slate">{item.revised}</td>
                      <td className="px-3 py-2.5 text-center text-slate">{item.reviewDue}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`font-bold ${item.attestation >= 95 ? 'text-green-600' : item.attestation >= 85 ? 'text-amber-600' : 'text-red-600'}`}>{item.attestation}%</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.status === 'Current' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button onClick={() => saveTrainingAction('Certificate viewed')} className="text-xs text-orange hover:underline font-medium">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'Onboarding' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">New hire onboarding training checklist — tracks mandatory orientation modules, preceptorship milestones, and 90-day competency sign-offs.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Staff in Onboarding', value: 2, color: 'text-blue-600', sub: 'Current hire class' },
              { label: 'Avg Days to Full Competency', value: '41d', color: 'text-navy', sub: 'Target: ≤45 days' },
              { label: 'Modules Completed (30d)', value: 18, color: 'text-green-600', sub: 'Across all new hires' },
              { label: 'Preceptor Assigned', value: '100%', color: 'text-teal-600', sub: 'All new hires paired' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">New Hire Onboarding Progress</h3>
            <div className="space-y-4">
              {[
                {
                  name: 'K. Nguyen, CAC-AD', role: 'Primary Counselor', startDate: '2026-07-07', preceptor: 'T. Jackson, CAC-AD',
                  modules: [
                    { name: 'Orientation & HR Policies', done: true, dueDate: 'Day 1' },
                    { name: 'HIPAA & 42 CFR Part 2 Training', done: true, dueDate: 'Day 2' },
                    { name: 'EHR System Access & Navigation', done: true, dueDate: 'Day 3' },
                    { name: 'Documentation Standards & Note Writing', done: true, dueDate: 'Day 5' },
                    { name: 'Clinical Protocols: Crisis & Safety', done: true, dueDate: 'Day 7' },
                    { name: 'Group Facilitation Standards', done: true, dueDate: 'Day 10' },
                    { name: 'Treatment Planning Competency', done: false, dueDate: 'Day 21' },
                    { name: '90-Day Supervisor Evaluation', done: false, dueDate: 'Day 90' },
                  ]
                },
                {
                  name: 'M. Boyd, ADT', role: 'Behavioral Health Technician', startDate: '2026-07-14', preceptor: 'K. Wright, CAC-AD',
                  modules: [
                    { name: 'Orientation & HR Policies', done: true, dueDate: 'Day 1' },
                    { name: 'HIPAA & 42 CFR Part 2 Training', done: true, dueDate: 'Day 2' },
                    { name: 'MAR & Medication Administration', done: true, dueDate: 'Day 3' },
                    { name: 'CIWA-Ar & COWS Protocol Training', done: false, dueDate: 'Day 5' },
                    { name: 'Controlled Substance Count Procedures', done: false, dueDate: 'Day 7' },
                    { name: 'Nursing Documentation Standards', done: false, dueDate: 'Day 10' },
                    { name: 'Emergency Response / Narcan Admin', done: false, dueDate: 'Day 14' },
                    { name: '90-Day DON Competency Evaluation', done: false, dueDate: 'Day 90' },
                  ]
                },
              ].map(s => (
                <div key={s.name} className="border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-navy">{s.name}</span>
                      <span className="text-xs text-slate ml-2">— {s.role} · Start: {s.startDate}</span>
                    </div>
                    <div className="text-xs text-slate">Preceptor: <span className="font-medium text-navy">{s.preceptor}</span></div>
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2 text-xs">
                    {s.modules.map(m => (
                      <div key={m.name} className="flex items-start gap-2">
                        <span className={`mt-0.5 text-sm shrink-0 ${m.done ? 'text-green-500' : 'text-slate/40'}`}>{m.done ? '✓' : '○'}</span>
                        <div>
                          <span className={m.done ? 'text-slate line-through' : 'text-navy'}>{m.name}</span>
                          <span className="ml-1 text-[10px] text-slate">({m.dueDate})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Training Library' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">On-demand training resource library — evidence-based SUD treatment modules, clinical skills videos, and compliance courses available to all staff.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Courses Available', value: 48, color: 'text-navy', sub: 'All categories combined' },
              { label: 'Completed (YTD, avg)', value: 12.4, color: 'text-green-600', sub: 'Per staff member' },
              { label: 'Clinical Modules', value: 10, color: 'text-blue-600', sub: 'SUD, MAT, trauma, co-occurring' },
              { label: 'New This Quarter', value: 6, color: 'text-teal-600', sub: 'Recently added' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Featured Training Modules</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { title: 'ASAM Criteria & LOC Decision-Making', cat: 'Clinical', duration: '2.0 CEU', format: 'Self-paced video + quiz', level: 'All clinical staff', new: false },
                { title: 'Motivational Interviewing — Foundations (MI-1)', cat: 'Clinical', duration: '6.0 CEU', format: 'Video series + role-play', level: 'Counselors, ADT', new: false },
                { title: 'Trauma-Informed Care in SUD Settings', cat: 'Clinical', duration: '3.0 CEU', format: 'Self-paced video + quiz', level: 'All clinical staff', new: true },
                { title: 'MOUD: Buprenorphine, Naltrexone, and Methadone', cat: 'Clinical', duration: '2.5 CEU', format: 'Video + case studies', level: 'All clinical staff', new: false },
                { title: 'CIWA-Ar / COWS Assessment Proficiency', cat: 'Nursing', duration: '1.5 CEU', format: 'Video + competency check', level: 'Nursing staff', new: false },
                { title: 'Suicide Risk Assessment (Columbia C-SSRS)', cat: 'Safety', duration: '2.0 CEU', format: 'Video + scenario-based', level: 'All clinical staff', new: true },
                { title: '42 CFR Part 2 & HIPAA for SUD Programs', cat: 'Compliance', duration: '1.0 CEU', format: 'Self-paced + attestation', level: 'All staff', new: false },
                { title: 'Cultural Humility in Addiction Treatment', cat: 'Clinical', duration: '2.0 CEU', format: 'Video + reflection activity', level: 'All clinical staff', new: true },
                { title: 'De-escalation Techniques — CPI Nonviolent', cat: 'Safety', duration: '8.0 CEU', format: 'In-person + certification', level: 'All clinical staff', new: false },
                { title: 'Documentation Standards & CARF Compliance', cat: 'Compliance', duration: '1.5 CEU', format: 'Self-paced + quiz', level: 'All clinical staff', new: false },
              ].map(m => (
                <div key={m.title} className="border border-border rounded-xl p-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-semibold text-navy">{m.title}</span>
                      {m.new && <span className="text-[8px] font-bold bg-green-100 text-green-700 px-1 py-0.5 rounded-full uppercase">New</span>}
                    </div>
                    <div className="text-[10px] text-slate">{m.format} · {m.level}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-bold text-blue-700">{m.duration}</div>
                    <div className="text-[9px] text-slate mt-0.5 uppercase tracking-wider">{m.cat}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {scheduleOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setScheduleOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[500px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-navy">Schedule Training Session</h2>
              <button onClick={() => setScheduleOpen(false)} className="text-slate hover:text-navy"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Training Topic *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>CPR / First Aid Recertification</option><option>HIPAA Annual Refresher</option><option>Trauma-Informed Care</option><option>Motivational Interviewing</option><option>Medication-Assisted Treatment</option><option>Crisis De-escalation</option><option>Ethics & Boundaries</option><option>Suicide Risk Assessment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Date *</label>
                  <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Time</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    {['8:00 AM','9:00 AM','10:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Duration</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>1 hour</option><option>2 hours</option><option>Half day (4h)</option><option>Full day (8h)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Location</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Conference Room A</option><option>Skills Lab</option><option>Online / Zoom</option><option>Off-site</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">CEUs Awarded</label>
                  <input type="number" min={0} step={0.5} className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 1.5" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Departments Required</label>
                <select multiple className="w-full border border-border rounded-lg px-3 py-2 text-sm h-24">
                  <option>All Staff</option><option>Clinical</option><option>Nursing</option><option>BHT</option><option>Administration</option>
                </select>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setScheduleOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setScheduleOpen(false); saveTrainingAction('Training session scheduled'); }} className="flex-1 bg-navy text-white rounded-xl py-2.5 text-sm font-semibold">Schedule Session</button>
            </div>
          </div>
        </div>
      )}

      {trainingSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> {trainingSaved}
        </div>
      )}
    </div>
  );
}
