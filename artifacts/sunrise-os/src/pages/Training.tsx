import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_STAFF } from '../data/mockStaff';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

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
  { id: 'c6', name: 'MAT / Buprenorphine Waiver', category: 'Medical', required: false, renewalMonths: 36, applicableTo: ['Medical'] },
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
  { id: 'st1', title: 'HIPAA & 42 CFR Part 2 Annual Refresher', date: '2026-07-22', time: '9:00 AM – 11:00 AM', instructor: 'James Carter', location: 'Conference Room A', registeredCount: 8, capacity: 20, category: 'Compliance', ceuHours: 2 },
  { id: 'st2', title: 'CPI Crisis De-escalation Recertification', date: '2026-07-29', time: '8:00 AM – 4:00 PM', instructor: 'Kevin Wright (CPI Certified)', location: 'Main Group Room', registeredCount: 6, capacity: 12, category: 'Clinical', ceuHours: 8 },
  { id: 'st3', title: 'Trauma-Informed Care — Level 2', date: '2026-08-05', time: '1:00 PM – 4:00 PM', instructor: 'Dr. Allen Hughes', location: 'Conference Room A', registeredCount: 4, capacity: 15, category: 'Clinical', ceuHours: 3 },
  { id: 'st4', title: 'Motivational Interviewing (MI) Foundations', date: '2026-08-12', time: '9:00 AM – 12:00 PM', instructor: 'Maria Gonzales, LCSW', location: 'Group Room B', registeredCount: 7, capacity: 12, category: 'Clinical', ceuHours: 3 },
  { id: 'st5', title: 'Fire Safety & Emergency Evacuation Drill', date: '2026-08-19', time: '10:00 AM – 11:00 AM', instructor: 'Kevin Wright', location: 'Full Facility', registeredCount: 12, capacity: 30, category: 'Safety', ceuHours: 1 },
];

const CATEGORY_COLORS: Record<string, string> = {
  Compliance: 'bg-red-100 text-red-700',
  Clinical: 'bg-blue-100 text-blue-700',
  Safety: 'bg-amber-100 text-amber-700',
  Medical: 'bg-purple-100 text-purple-700',
};

export function Training({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<'Compliance Matrix' | 'Scheduled Training' | 'CEU Tracking'>('Compliance Matrix');
  const [deptFilter, setDeptFilter] = useState<string>('All');

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
        <button className="btn-primary text-sm px-4 py-2">+ Schedule Training</button>
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
        {(['Compliance Matrix', 'Scheduled Training', 'CEU Tracking'] as const).map(t => (
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
                <button className="btn-primary text-sm px-3 py-1.5">Register Staff</button>
                <button className="btn-outline text-sm px-3 py-1.5">View Attendees</button>
                <button className="btn-outline text-sm px-3 py-1.5">Edit Session</button>
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
    </div>
  );
}
