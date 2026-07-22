import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { LockedButton } from '../components/common/LockedButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { getRolesWithEditAccess } from '../data/mockRoles';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type DefType = 'Missing Co-sign' | 'Overdue Note' | 'Incomplete ASAM' | 'Unsigned Treatment Plan' | 'Missing UA' | 'Expired Auth';

interface Deficiency {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  program: string;
  counselor: string;
  type: DefType;
  dueDate: string;
  daysOverdue: number;
  detail: string;
  priority: 'Critical' | 'High' | 'Moderate';
}

const DEFICIENCIES: Deficiency[] = [
  { id: 'd1', patientId: 'p1', patientName: 'Marcus Webb', mrn: 'MRN-83921', program: 'Residential', counselor: 'Sarah Jenkins, LPC', type: 'Missing Co-sign', dueDate: '2026-07-17', daysOverdue: 5, detail: 'BIRP note 7/17 — Awaiting co-sign from James S. Collins III, Clinical Director.', priority: 'Critical' },
  { id: 'd2', patientId: 'p2', patientName: 'Samantha Choi', mrn: 'MRN-74563', program: 'Residential', counselor: 'David Odom, LMFT', type: 'Missing Co-sign', dueDate: '2026-07-16', daysOverdue: 6, detail: 'Psychiatric evaluation 7/15 — awaiting co-sign from Dr. Allen Hughes.', priority: 'Critical' },
  { id: 'd3', patientId: 'p3', patientName: 'James Thornton', mrn: 'MRN-62841', program: 'Residential', counselor: 'Maria Gonzales, LCSW', type: 'Overdue Note', dueDate: '2026-07-16', daysOverdue: 6, detail: 'Daily progress note missing for 7/16. Required within 24 hours per policy.', priority: 'High' },
  { id: 'd4', patientId: 'p5', patientName: 'Robert Navarro', mrn: 'MRN-44782', program: 'Residential', counselor: 'Maria Gonzales, LCSW', type: 'Incomplete ASAM', dueDate: '2026-07-15', daysOverdue: 7, detail: 'Dimension 4 (Readiness to Change) and Dimension 5 (Relapse Potential) not scored.', priority: 'High' },
  { id: 'd5', patientId: 'p6', patientName: 'Destiny Williams', mrn: 'MRN-55129', program: 'PHP', counselor: 'Sarah Jenkins, LPC', type: 'Missing UA', dueDate: '2026-07-14', daysOverdue: 8, detail: 'Chain of custody form missing for UA collected 7/13. Re-collection scheduled.', priority: 'High' },
  { id: 'd6', patientId: 'p4', patientName: 'Patricia Holloway', mrn: 'MRN-48320', program: 'Residential', counselor: 'Sarah Jenkins, LPC', type: 'Unsigned Treatment Plan', dueDate: '2026-07-14', daysOverdue: 8, detail: 'Treatment plan updated 7/12 — patient signature still pending.', priority: 'Moderate' },
  { id: 'd7', patientId: 'p7', patientName: 'Brian Kowalski', mrn: 'MRN-27641', program: 'PHP', counselor: 'David Odom, LMFT', type: 'Missing Co-sign', dueDate: '2026-07-17', daysOverdue: 5, detail: 'DAP group note 7/17 — awaiting James S. Collins III co-sign.', priority: 'Critical' },
  { id: 'd8', patientId: 'p8', patientName: 'Linda Farris', mrn: 'MRN-39018', program: 'IOP', counselor: 'Maria Gonzales, LCSW', type: 'Expired Auth', dueDate: '2026-07-12', daysOverdue: 10, detail: 'Aetna authorization expired 7/12. Continued stay request not yet submitted.', priority: 'Critical' },
];

const CHART_COMPLETENESS = MOCK_PATIENTS.slice(0, 8).map((p, i) => {
  const defs = DEFICIENCIES.filter(d => d.patientId === p.id).length;
  const score = Math.max(60, 100 - defs * 12 - (i % 3) * 5);
  return { id: p.id, name: `${p.firstName} ${p.lastName}`, program: p.program, counselor: p.counselor, score, defs };
});

const PRIORITY_COLORS = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-amber-100 text-amber-700 border-amber-200',
  Moderate: 'bg-blue-100 text-blue-700 border-blue-200',
};

const TYPE_ICONS: Record<DefType, string> = {
  'Missing Co-sign': '✍️',
  'Overdue Note': '📝',
  'Incomplete ASAM': '📊',
  'Unsigned Treatment Plan': '📋',
  'Missing UA': '🧪',
  'Expired Auth': '📄',
};

const DEF_TYPES: DefType[] = ['Missing Co-sign', 'Overdue Note', 'Incomplete ASAM', 'Unsigned Treatment Plan', 'Missing UA', 'Expired Auth'];

const DOC_TREND_DATA = [
  { month: 'Feb', cosign: 6, overdue: 4, asam: 2, auth: 1, ua: 2, plan: 3 },
  { month: 'Mar', cosign: 8, overdue: 5, asam: 3, auth: 2, ua: 1, plan: 2 },
  { month: 'Apr', cosign: 4, overdue: 3, asam: 2, auth: 3, ua: 2, plan: 1 },
  { month: 'May', cosign: 5, overdue: 4, asam: 1, auth: 2, ua: 3, plan: 2 },
  { month: 'Jun', cosign: 7, overdue: 6, asam: 2, auth: 1, ua: 2, plan: 4 },
  { month: 'Jul', cosign: 3, overdue: 1, asam: 1, auth: 1, ua: 1, plan: 1 },
];

const COMPLETENESS_TREND = [
  { month: 'Feb', score: 74 },
  { month: 'Mar', score: 72 },
  { month: 'Apr', score: 81 },
  { month: 'May', score: 79 },
  { month: 'Jun', score: 76 },
  { month: 'Jul', score: 88 },
];

const COUNSELOR_PERF = [
  { name: 'Sarah Jenkins, LPC',     on_time: 92, avg_days: 0.9, deficiencies: 3, notes_month: 48 },
  { name: 'Maria Gonzales, LCSW',   on_time: 85, avg_days: 1.4, deficiencies: 3, notes_month: 42 },
  { name: 'David Odom, LMFT',       on_time: 91, avg_days: 1.0, deficiencies: 2, notes_month: 39 },
  { name: 'Dr. Allen Hughes',       on_time: 97, avg_days: 0.5, deficiencies: 0, notes_month: 18 },
];

export function ChartReview({ navigate, readOnly }: Props) {
  const editRoles = getRolesWithEditAccess('ChartReview');
  const [activeTab, setActiveTab] = useState<'Deficiencies' | 'Chart Completeness' | 'Documentation Trends' | 'Peer Review' | 'Coding Audit' | 'Provider Scorecard'>('Deficiencies');
  const [typeFilter, setTypeFilter] = useState<DefType | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<'Critical' | 'High' | 'Moderate' | 'All'>('All');
  const [counselorFilter, setCounselorFilter] = useState<string>('All');
  const [reminderSent, setReminderSent] = useState<string | null>(null);
  const [codingFlagged, setCodingFlagged] = useState<string | null>(null);
  const [auditExported, setAuditExported] = useState<string | null>(null);

  const counselors = Array.from(new Set(DEFICIENCIES.map(d => d.counselor)));

  const filtered = DEFICIENCIES.filter(d =>
    (typeFilter === 'All' || d.type === typeFilter) &&
    (priorityFilter === 'All' || d.priority === priorityFilter) &&
    (counselorFilter === 'All' || d.counselor === counselorFilter)
  );

  const countByType = DEF_TYPES.map(t => ({ type: t, count: DEFICIENCIES.filter(d => d.type === t).length }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Chart Review</h1>
          <p className="text-slate text-sm mt-0.5">Clinical documentation deficiency tracking and chart completeness</p>
        </div>
        <div className="flex gap-3">
          {(['Critical', 'High', 'Moderate'] as const).map(p => (
            <div key={p} className="card px-4 py-2 text-center">
              <div className={`text-xl font-bold ${p === 'Critical' ? 'text-red-600' : p === 'High' ? 'text-amber-600' : 'text-blue-600'}`}>
                {DEFICIENCIES.filter(d => d.priority === p).length}
              </div>
              <div className="text-xs text-slate">{p}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Deficiencies', 'Chart Completeness', 'Documentation Trends', 'Peer Review', 'Coding Audit', 'Provider Scorecard'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {activeTab === 'Documentation Trends' && (
        <div className="space-y-6">
          {/* Completeness trend */}
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-0.5">Chart Completeness Score — 6 Month Trend</h3>
              <p className="text-xs text-slate mb-3">% charts with zero open deficiencies at end of month</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={COMPLETENESS_TREND} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} tickLine={false} unit="%" />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Completeness']} contentStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="score" name="Completeness %" stroke="#E8761A" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-slate">6-month avg: <span className="font-bold text-navy">78%</span></span>
                <span className="text-green-700 font-semibold">↑ +12pts Jun→Jul (best month)</span>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-0.5">Deficiencies by Type — 6 Month Trend</h3>
              <p className="text-xs text-slate mb-3">Open items at end of each month</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={DOC_TREND_DATA} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="cosign"  name="Co-sign"    stackId="a" fill="#ef4444" />
                  <Bar dataKey="overdue" name="Overdue"    stackId="a" fill="#f59e0b" />
                  <Bar dataKey="asam"    name="ASAM"       stackId="a" fill="#3b82f6" />
                  <Bar dataKey="auth"    name="Auth"       stackId="a" fill="#8b5cf6" />
                  <Bar dataKey="ua"      name="UA"         stackId="a" fill="#06b6d4" />
                  <Bar dataKey="plan"    name="Tx Plan"    stackId="a" fill="#22c55e" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Counselor performance table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-gray-50">
              <h3 className="font-semibold text-navy text-sm">Documentation Performance by Clinician</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg">
                  {['Clinician', 'On-Time Notes', 'Avg Days to Sign', 'Open Deficiencies', 'Notes This Month', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COUNSELOR_PERF.map(c => (
                  <tr key={c.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-navy">{c.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                          <div className={`h-full rounded-full ${c.on_time >= 95 ? 'bg-green-500' : c.on_time >= 85 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${c.on_time}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${c.on_time >= 95 ? 'text-green-700' : c.on_time >= 85 ? 'text-amber-700' : 'text-red-700'}`}>{c.on_time}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${c.avg_days <= 1 ? 'text-green-700' : c.avg_days <= 1.5 ? 'text-amber-700' : 'text-red-700'}`}>{c.avg_days}d</span>
                    </td>
                    <td className="px-4 py-3">
                      {c.deficiencies > 0
                        ? <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{c.deficiencies} open</span>
                        : <span className="text-xs font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">None ✓</span>}
                    </td>
                    <td className="px-4 py-3 text-slate font-medium">{c.notes_month}</td>
                    <td className="px-4 py-3">
                      <LockedButton locked={readOnly} onClick={() => { setReminderSent(c.name); setTimeout(() => setReminderSent(null), 2500); }} className="text-xs text-orange hover:underline">Send Reminder</LockedButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Policy reminders */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
            <div className="font-semibold mb-2">📋 Documentation Policy Reminders</div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div><strong>Progress Notes:</strong> Must be signed within 24 hours of session. Co-sign required within 48 hours.</div>
              <div><strong>Treatment Plans:</strong> Master TP within 72 hours of admission; updated every 30 days or at LOC change.</div>
              <div><strong>ASAM Criteria:</strong> Full assessment within 24 hours of admission; all 6 dimensions required for billing.</div>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'Deficiencies' || activeTab === 'Chart Completeness') && (
        <div className="grid grid-cols-6 gap-3">
          {countByType.map(ct => (
            <button
              key={ct.type}
              onClick={() => setTypeFilter(typeFilter === ct.type ? 'All' : ct.type)}
              className={`card text-center p-3 transition-all hover:shadow-md ${typeFilter === ct.type ? 'ring-2 ring-orange' : ''}`}
            >
              <div className="text-xl">{TYPE_ICONS[ct.type]}</div>
              <div className="text-lg font-bold text-navy mt-1">{ct.count}</div>
              <div className="text-xs text-slate leading-tight mt-0.5">{ct.type}</div>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'Deficiencies' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate">Priority:</span>
              {(['All', 'Critical', 'High', 'Moderate'] as const).map(p => (
                <button key={p} onClick={() => setPriorityFilter(p)} className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${priorityFilter === p ? 'bg-navy text-white border-navy' : 'bg-white text-slate border-border hover:border-navy'}`}>{p}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate">Counselor:</span>
              <select value={counselorFilter} onChange={e => setCounselorFilter(e.target.value)} className="text-xs border border-border rounded px-2 py-1">
                <option value="All">All</option>
                {counselors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate ml-auto">{filtered.length} deficiencies</span>
          </div>

          <div className="space-y-2">
            {filtered.map(d => (
              <div key={d.id} className={`border rounded-lg p-4 ${PRIORITY_COLORS[d.priority]}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl mt-0.5">{TYPE_ICONS[d.type]}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => navigate('PatientDetail', d.patientId)}
                          className="font-semibold text-navy hover:text-orange text-sm"
                        >
                          {d.patientName}
                        </button>
                        <span className="text-xs text-slate font-mono">{d.mrn}</span>
                        <span className="text-xs text-slate">·</span>
                        <span className="text-xs text-slate">{d.program}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${PRIORITY_COLORS[d.priority]}`}>{d.priority}</span>
                        <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full font-medium">{d.type}</span>
                      </div>
                      <p className="text-sm text-navy mt-0.5">{d.detail}</p>
                      <p className="text-xs text-slate mt-0.5">Counselor: {d.counselor} · Due: {d.dueDate} · <span className="font-medium text-red-600">{d.daysOverdue}d overdue</span></p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <LockedButton locked={readOnly} editRoles={editRoles} onClick={() => !readOnly && navigate('CosignQueue')} className="text-xs bg-white border border-current px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity">Resolve</LockedButton>
                    <button onClick={() => navigate('PatientDetail', d.patientId)} className="text-xs bg-white border border-current px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity">Open Chart</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Chart Completeness' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Program</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Counselor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Open Deficiencies</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Chart Completeness</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {CHART_COMPLETENESS.sort((a, b) => a.score - b.score).map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-navy">{c.name}</td>
                  <td className="px-4 py-3 text-slate">{c.program}</td>
                  <td className="px-4 py-3 text-slate">{c.counselor}</td>
                  <td className="px-4 py-3">
                    {c.defs > 0
                      ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{c.defs} open</span>
                      : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">None</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full w-24">
                        <div
                          className={`h-2 rounded-full ${c.score >= 90 ? 'bg-green-500' : c.score >= 75 ? 'bg-amber-400' : 'bg-red-500'}`}
                          style={{ width: `${c.score}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${c.score >= 90 ? 'text-green-600' : c.score >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{c.score}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate('PatientDetail', c.id)} className="text-xs text-orange hover:underline">Open Chart</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {activeTab === 'Peer Review' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Structured peer review of clinical documentation — assesses quality, accuracy, and regulatory compliance across counselors and clinicians.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Reviews Completed (Q2)', value: 38, color: 'text-navy', sub: 'Target: 40 per quarter' },
              { label: 'Avg Score', value: '87/100', color: 'text-green-600', sub: 'Above 85 threshold' },
              { label: 'Action Plans Issued', value: 4, color: 'text-amber-600', sub: 'Remediation in progress' },
              { label: 'Exemplary Notes', value: 9, color: 'text-teal-600', sub: 'Shared as best practice' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Recent Peer Reviews — Q2 2026</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Clinician Reviewed</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Note Type</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Score</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Strengths</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Areas to Improve</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Reviewed By</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { clinician: 'T. Jackson, CAC-AD', type: 'Progress Note', score: 92, strength: 'Excellent CBT language', improve: 'Goal linkage', reviewer: 'Dr. Okafor', outcome: 'Exemplary', oColor: 'bg-green-100 text-green-700' },
                  { clinician: 'M. Rivera, MS', type: 'Biopsychosocial', score: 88, strength: 'Thorough psychosocial hx', improve: 'SUD history detail', reviewer: 'A. Simms, LCSW', outcome: 'Satisfactory', oColor: 'bg-blue-100 text-blue-700' },
                  { clinician: 'A. Brooks, LPC', type: 'Group Note', score: 74, strength: 'Good attendance tracking', improve: 'Individualized observations', reviewer: 'Dr. Okafor', outcome: 'Action Plan', oColor: 'bg-amber-100 text-amber-700' },
                  { clinician: 'K. Santos, RN', type: 'Nursing Note', score: 95, strength: 'CIWA documentation thorough', improve: '—', reviewer: 'J. Martinez, DON', outcome: 'Exemplary', oColor: 'bg-green-100 text-green-700' },
                  { clinician: 'D. Williams, CAC-AD', type: 'Treatment Plan', score: 71, strength: 'Goal clarity', improve: 'Measurable objectives needed', reviewer: 'A. Simms, LCSW', outcome: 'Action Plan', oColor: 'bg-amber-100 text-amber-700' },
                  { clinician: 'P. Chen, LMFT', type: 'Family Session Note', score: 90, strength: 'Systems lens applied well', improve: 'Follow-up documentation', reviewer: 'Dr. Okafor', outcome: 'Satisfactory', oColor: 'bg-blue-100 text-blue-700' },
                ].map(r => (
                  <tr key={r.clinician} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-navy">{r.clinician}</td>
                    <td className="px-3 py-2.5 text-slate">{r.type}</td>
                    <td className="py-2.5 text-center">
                      <span className={`font-bold ${r.score >= 90 ? 'text-green-600' : r.score >= 80 ? 'text-blue-600' : 'text-amber-600'}`}>{r.score}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate">{r.strength}</td>
                    <td className="px-3 py-2.5 text-slate">{r.improve}</td>
                    <td className="px-3 py-2.5 text-slate">{r.reviewer}</td>
                    <td className="py-2.5 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.oColor}`}>{r.outcome}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Coding Audit' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate">ICD-10-CM / CPT coding accuracy audit — validates diagnosis coding, service codes, and modifier usage across clinical documentation for billing compliance.</div>
            <button onClick={() => { setAuditExported('Coding audit exported'); setTimeout(() => setAuditExported(null), 2500); }} className="flex items-center gap-1.5 text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50 shrink-0 ml-4">
              ↓ Export Audit
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Charts Audited (30d)', value: 48, color: 'text-navy', sub: 'Random sample + targeted review' },
              { label: 'Coding Accuracy Rate', value: '94%', color: 'text-green-600', sub: '45 of 48 correct first submission' },
              { label: 'Unbundling Errors', value: 0, color: 'text-green-600', sub: 'No unbundling identified' },
              { label: 'Upcoding Flags', value: 2, color: 'text-amber-600', sub: 'Under review with Medical Director' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Most Frequently Used Codes — Accuracy by Code</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Code', 'Description', 'Uses (30d)', 'Accurate', 'Accuracy %', 'Common Error', ''].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { code: 'F11.20', desc: 'Opioid use disorder, unspecified', uses: 22, acc: 22, pct: 100, err: 'None identified' },
                  { code: 'F10.20', desc: 'Alcohol use disorder, moderate', uses: 18, acc: 17, pct: 94, err: 'Severity specifier missing (mild vs mod)' },
                  { code: 'H0001', desc: 'Alcohol and/or drug assessment', uses: 31, acc: 31, pct: 100, err: 'None identified' },
                  { code: 'H0015', desc: 'Alcohol and/or drug treatment, residential', uses: 41, acc: 40, pct: 98, err: 'Missing required ASAM level modifier on 1 claim' },
                  { code: '99213', desc: 'Office visit, established, moderate complexity', uses: 14, acc: 12, pct: 86, err: 'MDM documentation insufficient for level billed (2 charts)' },
                  { code: 'F33.1', desc: 'MDD, recurrent, moderate', uses: 11, acc: 11, pct: 100, err: 'None identified' },
                ].map(r => (
                  <tr key={r.code} className={`hover:bg-gray-50 ${r.pct < 90 ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-3 py-2 font-mono font-bold text-blue-700">{r.code}</td>
                    <td className="px-3 py-2 text-navy">{r.desc}</td>
                    <td className="px-3 py-2 text-center text-slate">{r.uses}</td>
                    <td className="px-3 py-2 text-center text-navy">{r.acc}</td>
                    <td className="px-3 py-2 text-center"><span className={`font-bold ${r.pct === 100 ? 'text-green-600' : r.pct >= 90 ? 'text-blue-600' : 'text-amber-600'}`}>{r.pct}%</span></td>
                    <td className="px-3 py-2 text-slate italic">{r.err}</td>
                    <td className="px-3 py-2">
                      {r.pct < 100 && (
                        <button
                          onClick={() => { setCodingFlagged(r.code); setTimeout(() => setCodingFlagged(null), 2500); }}
                          className="text-[10px] border border-amber-300 text-amber-700 bg-amber-50 px-2 py-0.5 rounded hover:bg-amber-100 transition-colors whitespace-nowrap"
                        >
                          Flag
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Provider Scorecard' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Individual clinician documentation quality metrics — timeliness, deficiency rate, co-sign compliance, and supervisor quality scores.</div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Clinician Documentation Scorecard — 30-Day Rolling</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Clinician', 'Credential', 'Notes (30d)', 'On-Time %', 'Deficiency Rate', 'Co-sign Rate', 'Avg Quality Score', 'Top Deficiency', 'Trend'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'S. Jenkins', cred: 'LPC', notes: 48, ontime: '96%', def: '4%', cosign: '100%', quality: 94, top: 'Missing TP link', trend: '↑' },
                  { name: 'D. Odom', cred: 'LMFT', notes: 41, ontime: '93%', def: '7%', cosign: '100%', quality: 91, top: 'Vague response content', trend: '→' },
                  { name: 'M. Gonzales', cred: 'LCSW', notes: 55, ontime: '89%', def: '11%', cosign: '87%', quality: 83, top: 'Missing co-sign + late notes', trend: '↓' },
                  { name: 'T. Osei', cred: 'CAC-AD', notes: 32, ontime: '100%', def: '3%', cosign: '100%', quality: 97, top: 'None identified', trend: '↑' },
                  { name: 'R. Patel', cred: 'CAADC', notes: 29, ontime: '97%', def: '3%', cosign: '100%', quality: 95, top: 'Missing crisis plan link', trend: '↑' },
                  { name: 'L. Washington', cred: 'LCAS', notes: 44, ontime: '86%', def: '14%', cosign: '91%', quality: 79, top: 'Late entries + vague content', trend: '↓' },
                  { name: 'J. Torres', cred: 'RN, CARN', notes: 67, ontime: '98%', def: '2%', cosign: 'N/A', quality: 96, top: 'Rare: missing VS reference', trend: '→' },
                ].map(r => (
                  <tr key={r.name} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-navy">{r.name}</td>
                    <td className="px-3 py-2 text-slate">{r.cred}</td>
                    <td className="px-3 py-2 text-center text-slate">{r.notes}</td>
                    <td className="px-3 py-2 font-semibold text-green-700">{r.ontime}</td>
                    <td className="px-3 py-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${parseFloat(r.def) < 5 ? 'bg-green-100 text-green-700' : parseFloat(r.def) < 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{r.def}</span></td>
                    <td className="px-3 py-2 text-slate">{r.cosign}</td>
                    <td className="px-3 py-2 font-bold text-navy">{r.quality}/100</td>
                    <td className="px-3 py-2 text-slate italic">{r.top}</td>
                    <td className="px-3 py-2 text-center text-lg font-bold">{r.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reminderSent && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <span>✓</span> Reminder sent to {reminderSent}
        </div>
      )}
      {codingFlagged && (
        <div className="fixed bottom-6 right-6 bg-amber-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <span>⚑</span> {codingFlagged} flagged for Medical Director review
        </div>
      )}
      {auditExported && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <span>✓</span> {auditExported}
        </div>
      )}
    </div>
  );
}
