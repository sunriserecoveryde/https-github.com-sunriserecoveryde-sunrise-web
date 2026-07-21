import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type Disposition = 'Sober Living' | 'Step-Down PHP' | 'Step-Down IOP' | 'Home with Family' | 'Independent' | 'CJS / Probation' | 'AMA';

interface DischargeEntry {
  patientId: string;
  name: string;
  mrn: string;
  program: string;
  los: number;
  expectedDate: string;
  daysUntil: number;
  counselor: string;
  disposition: Disposition;
  aftercarePlan: boolean;
  rxOrdered: boolean;
  followUpScheduled: boolean;
  transportArranged: boolean;
  summaryDictated: boolean;
  amaRisk: 'High' | 'Med' | 'Low';
  notes: string;
}

const UPCOMING: DischargeEntry[] = [
  { patientId: 'p3', name: 'James Thornton', mrn: 'MRN-62841', program: 'Residential', los: 28, expectedDate: '2026-07-19', daysUntil: 1, counselor: 'Maria Gonzales, LCSW', disposition: 'Sober Living', aftercarePlan: true, rxOrdered: false, followUpScheduled: true, transportArranged: false, summaryDictated: false, amaRisk: 'Med', notes: 'Sober living placement confirmed at Sunrise House. Vivitrol injection needed before discharge. Transport TBD.' },
  { patientId: 'p4', name: 'Patricia Holloway', mrn: 'MRN-48320', program: 'Residential', los: 35, expectedDate: '2026-07-21', daysUntil: 3, counselor: 'Sarah Jenkins, LPC', disposition: 'Step-Down PHP', aftercarePlan: true, rxOrdered: true, followUpScheduled: true, transportArranged: true, summaryDictated: false, amaRisk: 'Low', notes: 'Transitioning to our PHP program Mon–Fri. Family meeting scheduled 7/20 at 3 PM.' },
  { patientId: 'p7', name: 'Brian Kowalski', mrn: 'MRN-27641', program: 'PHP', los: 21, expectedDate: '2026-07-23', daysUntil: 5, counselor: 'David Odom, LMFT', disposition: 'Home with Family', aftercarePlan: true, rxOrdered: true, followUpScheduled: false, transportArranged: true, summaryDictated: false, amaRisk: 'Low', notes: 'Wife is engaged and supportive. AA sponsor identified. Outpatient therapy referral to Dr. Patel pending.' },
  { patientId: 'p5', name: 'Robert Navarro', mrn: 'MRN-44782', program: 'Residential', los: 42, expectedDate: '2026-07-25', daysUntil: 7, counselor: 'Maria Gonzales, LCSW', disposition: 'CJS / Probation', aftercarePlan: false, rxOrdered: false, followUpScheduled: false, transportArranged: false, summaryDictated: false, amaRisk: 'High', notes: 'Probation officer contact required before discharge. Drug court reporting starts 7/28. Aftercare plan in progress.' },
];

const AMA_RECENT = [
  { name: 'Daniel Cruz', mrn: 'MRN-81043', program: 'Residential', amaDate: '2026-07-15', los: 9, counselor: 'Sarah Jenkins, LPC', followedUp: true },
  { name: 'Tanya Morton', mrn: 'MRN-77290', program: 'PHP', amaDate: '2026-07-10', los: 6, counselor: 'David Odom, LMFT', followedUp: false },
];

const FOLLOWUP_30 = [
  { name: 'Kevin Ashford', mrn: 'MRN-59821', dischargeDate: '2026-06-18', disposition: 'Sober Living', day30Status: 'Contacted', sober: true, enrolled: true },
  { name: 'Monica Delgado', mrn: 'MRN-58034', dischargeDate: '2026-06-22', disposition: 'Home with Family', day30Status: 'No Answer', sober: null, enrolled: false },
  { name: 'Stuart Fink', mrn: 'MRN-56901', dischargeDate: '2026-06-25', disposition: 'Step-Down IOP', day30Status: 'Contacted', sober: true, enrolled: true },
  { name: 'Jasmine Hayward', mrn: 'MRN-55312', dischargeDate: '2026-06-28', disposition: 'Sober Living', day30Status: 'Relapsed — in treatment', sober: false, enrolled: true },
];

const DISPOSITION_COLORS: Record<Disposition, string> = {
  'Sober Living': 'bg-green-100 text-green-700',
  'Step-Down PHP': 'bg-blue-100 text-blue-700',
  'Step-Down IOP': 'bg-blue-100 text-blue-700',
  'Home with Family': 'bg-purple-100 text-purple-700',
  'Independent': 'bg-gray-100 text-slate',
  'CJS / Probation': 'bg-amber-100 text-amber-700',
  'AMA': 'bg-red-100 text-red-700',
};

const RISK_COLORS = { High: 'text-red-600 bg-red-50 border border-red-200', Med: 'text-amber-700 bg-amber-50 border border-amber-200', Low: 'text-green-700 bg-green-50 border border-green-200' };

const DISCHARGE_ANALYTICS = [
  { month: 'Feb', sober_living: 4, step_down: 3, home: 2, ama: 1 },
  { month: 'Mar', sober_living: 5, step_down: 4, home: 3, ama: 2 },
  { month: 'Apr', sober_living: 6, step_down: 3, home: 4, ama: 1 },
  { month: 'May', sober_living: 7, step_down: 5, home: 3, ama: 2 },
  { month: 'Jun', sober_living: 8, step_down: 4, home: 5, ama: 1 },
  { month: 'Jul', sober_living: 6, step_down: 6, home: 4, ama: 2 },
];

const DISPOSITION_PIE = [
  { name: 'Sober Living', value: 36, color: '#22c55e' },
  { name: 'Step-Down', value: 25, color: '#3b82f6' },
  { name: 'Home w/ Family', value: 21, color: '#a855f7' },
  { name: 'CJS / Probation', value: 9, color: '#f59e0b' },
  { name: 'AMA', value: 9, color: '#ef4444' },
];

const OUTCOMES_30DAY = [
  { label: 'Sober at 30 Days', value: 71, color: '#22c55e' },
  { label: 'In Continued Care', value: 64, color: '#3b82f6' },
  { label: 'Contacted (any)', value: 85, color: '#f59e0b' },
  { label: 'Readmitted', value: 14, color: '#ef4444' },
];

export function Discharges({ navigate, readOnly }: Props) {
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'AMA Tracking' | '30-Day Follow-Up' | 'Analytics' | 'Transition Planning' | 'Referral Directory'>('Upcoming');
  const [selected, setSelected] = useState<DischargeEntry | null>(UPCOMING[0]);

  const checklistItems = (d: DischargeEntry) => [
    { label: 'Aftercare plan documented', done: d.aftercarePlan },
    { label: 'Prescriptions ordered', done: d.rxOrdered },
    { label: 'Follow-up appointment scheduled', done: d.followUpScheduled },
    { label: 'Transportation arranged', done: d.transportArranged },
    { label: 'Discharge summary dictated', done: d.summaryDictated },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Discharges</h1>
          <p className="text-slate text-sm mt-0.5">Discharge planning, AMA tracking, and 30-day follow-up</p>
        </div>
        <div className="flex gap-3">
          <div className="card px-4 py-2 text-center">
            <div className="text-xl font-bold text-navy">{UPCOMING.length}</div>
            <div className="text-xs text-slate">This Week</div>
          </div>
          <div className="card px-4 py-2 text-center">
            <div className="text-xl font-bold text-red-600">{UPCOMING.filter(d => d.amaRisk === 'High').length}</div>
            <div className="text-xs text-slate">High AMA Risk</div>
          </div>
          <div className="card px-4 py-2 text-center">
            <div className="text-xl font-bold text-amber-600">{UPCOMING.filter(d => !d.aftercarePlan || !d.rxOrdered || !d.followUpScheduled || !d.transportArranged || !d.summaryDictated).length}</div>
            <div className="text-xs text-slate">Incomplete Plans</div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Upcoming', 'AMA Tracking', '30-Day Follow-Up', 'Analytics', 'Transition Planning', 'Referral Directory'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {activeTab === 'Upcoming' && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2 space-y-2">
            {UPCOMING.map(d => {
              const complete = checklistItems(d).filter(c => c.done).length;
              const total = checklistItems(d).length;
              return (
                <div
                  key={d.patientId}
                  onClick={() => setSelected(d)}
                  className={`card cursor-pointer p-3 hover:shadow-md transition-all ${selected?.patientId === d.patientId ? 'ring-2 ring-orange' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-navy">{d.name}</div>
                      <div className="text-xs text-slate">{d.program} · LOS {d.los}d</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold ${d.daysUntil <= 2 ? 'text-red-600' : d.daysUntil <= 5 ? 'text-amber-600' : 'text-green-600'}`}>{d.daysUntil}d left</div>
                      <div className="text-xs text-slate">{d.expectedDate}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DISPOSITION_COLORS[d.disposition]}`}>{d.disposition}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[d.amaRisk]}`}>AMA: {d.amaRisk}</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-slate mb-1">
                      <span>Discharge Checklist</span>
                      <span>{complete}/{total}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-orange rounded-full transition-all" style={{ width: `${(complete / total) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="col-span-3 space-y-4">
              <div className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-navy">{selected.name}</h2>
                    <p className="text-sm text-slate">{selected.mrn} · {selected.program} · LOS {selected.los} days</p>
                  </div>
                  <button onClick={() => navigate('PatientDetail', selected.patientId)} className="text-xs text-orange hover:underline">View Chart →</button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div><span className="text-slate">Expected Discharge:</span> <span className="font-bold text-navy">{selected.expectedDate}</span></div>
                  <div><span className="text-slate">Days Remaining:</span> <span className={`font-bold ${selected.daysUntil <= 2 ? 'text-red-600' : 'text-navy'}`}>{selected.daysUntil}</span></div>
                  <div><span className="text-slate">Counselor:</span> <span className="font-medium text-navy">{selected.counselor}</span></div>
                  <div><span className="text-slate">AMA Risk:</span> <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[selected.amaRisk]}`}>{selected.amaRisk}</span></div>
                  <div className="col-span-2"><span className="text-slate">Disposition:</span> <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${DISPOSITION_COLORS[selected.disposition]}`}>{selected.disposition}</span></div>
                </div>

                <div className="mt-4 bg-gray-50 border border-border rounded-lg p-3">
                  <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Notes</div>
                  <p className="text-sm text-navy">{selected.notes}</p>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-semibold text-navy mb-2">Discharge Checklist</div>
                  <div className="space-y-2">
                    {checklistItems(selected).map((item, i) => (
                      <label key={i} className="flex items-center gap-3 text-sm cursor-pointer">
                        <input type="checkbox" readOnly checked={item.done} className="accent-orange w-4 h-4" />
                        <span className={item.done ? 'line-through text-slate' : 'text-navy'}>{item.label}</span>
                        {!item.done && <span className="text-xs text-amber-600 font-medium">Pending</span>}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <LockedButton locked={readOnly} className="btn-primary text-sm px-4 py-2 flex-1">Complete Discharge</LockedButton>
                  <LockedButton locked={readOnly} className="btn-outline text-sm px-4 py-2">Extend Stay</LockedButton>
                  <LockedButton locked={readOnly} className="btn-outline text-sm px-4 py-2 text-red-600 border-red-200 hover:bg-red-50">Record AMA</LockedButton>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'AMA Tracking' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            <strong>42 CFR Part 2 Notice:</strong> AMA departure records are subject to federal confidentiality protections. Disclosure is restricted to clinical and compliance personnel only.
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Program</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">AMA Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">LOS at AMA</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Counselor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">48hr Follow-Up</th>
                </tr>
              </thead>
              <tbody>
                {AMA_RECENT.map((a, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-navy">{a.name}</div>
                      <div className="text-xs text-slate font-mono">{a.mrn}</div>
                    </td>
                    <td className="px-4 py-3 text-slate">{a.program}</td>
                    <td className="px-4 py-3 text-slate">{a.amaDate}</td>
                    <td className="px-4 py-3 font-medium text-navy">{a.los} days</td>
                    <td className="px-4 py-3 text-slate">{a.counselor}</td>
                    <td className="px-4 py-3">
                      {a.followedUp
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Completed</span>
                        : <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">⚠ Overdue</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === '30-Day Follow-Up' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Discharge Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Disposition</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">30-Day Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Sober</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Enrolled in Care</th>
              </tr>
            </thead>
            <tbody>
              {FOLLOWUP_30.map((f, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy">{f.name}</div>
                    <div className="text-xs text-slate font-mono">{f.mrn}</div>
                  </td>
                  <td className="px-4 py-3 text-slate">{f.dischargeDate}</td>
                  <td className="px-4 py-3 text-slate">{f.disposition}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.day30Status === 'Contacted' ? 'bg-green-100 text-green-700' : f.day30Status === 'No Answer' ? 'bg-gray-100 text-slate' : 'bg-amber-100 text-amber-700'}`}>{f.day30Status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {f.sober === null ? <span className="text-slate text-xs">Unknown</span> : f.sober ? <span className="text-green-600 font-medium text-xs">✓ Yes</span> : <span className="text-red-600 font-medium text-xs">✗ No</span>}
                  </td>
                  <td className="px-4 py-3">
                    {f.enrolled ? <span className="text-green-600 font-medium text-xs">✓ Yes</span> : <span className="text-red-600 font-medium text-xs">✗ No</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Analytics' && (
        <div className="space-y-6">
          {/* 30-Day KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {OUTCOMES_30DAY.map(o => (
              <div key={o.label} className="card text-center">
                <div className="text-3xl font-bold" style={{ color: o.color }}>{o.value}%</div>
                <div className="text-xs text-slate mt-1">{o.label}</div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${o.value}%`, backgroundColor: o.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Discharge Disposition Pie */}
            <div className="card">
              <div className="text-sm font-semibold text-navy mb-4">Discharge Disposition (Last 6 Months)</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={DISPOSITION_PIE} cx="45%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${value}%`} labelLine={false}>
                      {DISPOSITION_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Legend formatter={(value) => <span className="text-xs text-navy">{value}</span>} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Discharge Volume by Disposition */}
            <div className="card">
              <div className="text-sm font-semibold text-navy mb-4">Monthly Discharge Volume by Disposition</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={DISCHARGE_ANALYTICS} margin={{ top: 0, right: 10, bottom: 0, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip />
                    <Bar dataKey="sober_living" name="Sober Living" stackId="a" fill="#22c55e" radius={[0,0,0,0]} />
                    <Bar dataKey="step_down" name="Step-Down" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="home" name="Home" stackId="a" fill="#a855f7" />
                    <Bar dataKey="ama" name="AMA" stackId="a" fill="#ef4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* LOS by Program */}
          <div className="card">
            <div className="text-sm font-semibold text-navy mb-4">Average Length of Stay by Program (Last 6 Months)</div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { program: 'Residential', avg: 32, target: 28, color: '#3b82f6' },
                { program: 'PHP', avg: 18, target: 21, color: '#8b5cf6' },
                { program: 'IOP', avg: 45, target: 42, color: '#22c55e' },
              ].map(p => (
                <div key={p.program} className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-navy">{p.avg} days</div>
                  <div className="text-xs text-slate mt-1 font-semibold uppercase tracking-wide">{p.program}</div>
                  <div className="text-xs text-slate mt-1">Target: {p.target} days</div>
                  <div className={`text-xs mt-1 font-medium ${p.avg > p.target ? 'text-amber-600' : 'text-green-600'}`}>
                    {p.avg > p.target ? `+${p.avg - p.target}d over target` : `${p.target - p.avg}d under target`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'Transition Planning' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Structured transition-of-care planning — aftercare appointments, housing, MAT continuation, and warm handoffs to community providers.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Plans Completed', value: 8, color: 'text-green-600', sub: 'Ready for discharge' },
              { label: 'Housing Secured', value: 5, color: 'text-blue-600', sub: 'Sober living or family' },
              { label: 'MAT Continuation', value: 6, color: 'text-teal-600', sub: 'Community prescriber identified' },
              { label: 'At-Risk (No Housing)', value: 2, color: 'text-red-600', sub: 'Social work engaged' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Transition Checklist — Upcoming Discharges</h3>
            <div className="space-y-3 text-xs">
              {[
                {
                  name: 'Marcus Webb', date: '2026-07-19',
                  checks: [
                    { item: 'Discharge summary completed & co-signed', done: true },
                    { item: 'Aftercare appointment scheduled (IOP — Jul 21)', done: true },
                    { item: 'MAT prescriber identified — Dr. Evans, Rockville', done: true },
                    { item: 'Housing confirmed — Oxford House, Brentwood', done: true },
                    { item: 'Medications dispensed (7-day supply)', done: true },
                    { item: '30-day follow-up call scheduled', done: false },
                  ]
                },
                {
                  name: 'Darnell Price', date: '2026-07-21',
                  checks: [
                    { item: 'Discharge summary in progress', done: false },
                    { item: 'Aftercare appointment scheduled', done: true },
                    { item: 'Family meeting completed', done: true },
                    { item: 'Housing plan confirmed', done: true },
                    { item: 'MAT continuation arranged', done: false },
                    { item: 'Naloxone kit dispensed & trained', done: true },
                  ]
                },
              ].map(p => (
                <div key={p.name} className="border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-border">
                    <span className="font-semibold text-navy">{p.name}</span>
                    <span className="text-slate">Target discharge: {p.date}</span>
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2">
                    {p.checks.map(c => (
                      <div key={c.item} className="flex items-start gap-2">
                        <span className={`mt-0.5 text-sm ${c.done ? 'text-green-500' : 'text-amber-500'}`}>{c.done ? '✓' : '○'}</span>
                        <span className={c.done ? 'text-slate line-through' : 'text-navy'}>{c.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Referral Directory' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Step-down and community referral directory — preferred partners by LOC, payer, and specialty for warm handoff at discharge.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Active Partners', value: 42, color: 'text-navy', sub: 'In Sunrise referral network' },
              { label: 'IOP / PHP Partners', value: 11, color: 'text-blue-600', sub: 'Accepting warm handoffs' },
              { label: 'MAT Community Providers', value: 8, color: 'text-teal-600', sub: 'OTP + office-based buprenorphine' },
              { label: 'Housing / Sober Living', value: 14, color: 'text-green-600', sub: 'Vetted sober living homes' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Preferred Step-Down Partners</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Organization', 'LOC Offered', 'Payers', 'Availability', 'Contact', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { org: 'Recovery Works Rockville', loc: 'IOP / PHP', payers: 'Commercial, Maryland Medicaid', avail: 'Mon–Fri, 3 spots', contact: '301-555-0192', status: 'Active' },
                  { org: 'Centerstone Rockville', loc: 'IOP / OP', payers: 'All', avail: 'Intake M/W/F', contact: '301-555-0241', status: 'Active' },
                  { org: 'Vanderbilt Outpatient Psych', loc: 'OP (MH+SUD)', payers: 'Commercial, Medicare', avail: '2–4 wk wait', contact: '301-555-0318', status: 'Waitlist' },
                  { org: 'Maryland OTP Clinic (Methadone)', loc: 'MAT / OTP', payers: 'Maryland Medicaid, Self-Pay', avail: 'Open enrollment', contact: '301-555-0155', status: 'Active' },
                  { org: 'Brentwood Springs', loc: 'PHP / Residential', payers: 'Commercial', avail: '1–2 beds', contact: '301-555-0277', status: 'Active' },
                  { org: 'Serenity Sober Living — Men', loc: 'Sober Living', payers: 'Self-Pay only', avail: '3 beds available', contact: '301-555-0388', status: 'Active' },
                  { org: 'Harmony House — Women', loc: 'Sober Living', payers: 'Self-Pay / Block Grant', avail: '1 bed available', contact: '301-555-0421', status: 'Active' },
                ].map(r => (
                  <tr key={r.org} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-navy">{r.org}</td>
                    <td className="px-3 py-2 text-slate">{r.loc}</td>
                    <td className="px-3 py-2 text-slate">{r.payers}</td>
                    <td className="px-3 py-2 text-navy">{r.avail}</td>
                    <td className="px-3 py-2 font-mono text-xs text-blue-700">{r.contact}</td>
                    <td className="px-3 py-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
