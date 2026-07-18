import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

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
  { id: 'd1', patientId: 'p1', patientName: 'Marcus Webb', mrn: 'MRN-83921', program: 'Residential', counselor: 'Sarah Jenkins, LPC', type: 'Missing Co-sign', dueDate: '2026-07-17', daysOverdue: 1, detail: 'BIRP note 7/17 — Awaiting co-sign from James Carter, Clinical Director.', priority: 'Critical' },
  { id: 'd2', patientId: 'p2', patientName: 'Samantha Choi', mrn: 'MRN-74563', program: 'Residential', counselor: 'David Odom, LMFT', type: 'Missing Co-sign', dueDate: '2026-07-16', daysOverdue: 2, detail: 'Psychiatric evaluation 7/15 — awaiting co-sign from Dr. Allen Hughes.', priority: 'Critical' },
  { id: 'd3', patientId: 'p3', patientName: 'James Thornton', mrn: 'MRN-62841', program: 'Residential', counselor: 'Maria Gonzales, LCSW', type: 'Overdue Note', dueDate: '2026-07-16', daysOverdue: 2, detail: 'Daily progress note missing for 7/16. Required within 24 hours per policy.', priority: 'High' },
  { id: 'd4', patientId: 'p5', patientName: 'Robert Navarro', mrn: 'MRN-44782', program: 'Residential', counselor: 'Maria Gonzales, LCSW', type: 'Incomplete ASAM', dueDate: '2026-07-15', daysOverdue: 3, detail: 'Dimension 4 (Readiness to Change) and Dimension 5 (Relapse Potential) not scored.', priority: 'High' },
  { id: 'd5', patientId: 'p6', patientName: 'Destiny Williams', mrn: 'MRN-55129', program: 'PHP', counselor: 'Sarah Jenkins, LPC', type: 'Missing UA', dueDate: '2026-07-14', daysOverdue: 4, detail: 'Chain of custody form missing for UA collected 7/13. Re-collection scheduled.', priority: 'High' },
  { id: 'd6', patientId: 'p4', patientName: 'Patricia Holloway', mrn: 'MRN-48320', program: 'Residential', counselor: 'Sarah Jenkins, LPC', type: 'Unsigned Treatment Plan', dueDate: '2026-07-14', daysOverdue: 4, detail: 'Treatment plan updated 7/12 — patient signature still pending.', priority: 'Moderate' },
  { id: 'd7', patientId: 'p7', patientName: 'Brian Kowalski', mrn: 'MRN-27641', program: 'PHP', counselor: 'David Odom, LMFT', type: 'Missing Co-sign', dueDate: '2026-07-17', daysOverdue: 1, detail: 'DAP group note 7/17 — awaiting James Carter co-sign.', priority: 'Critical' },
  { id: 'd8', patientId: 'p8', patientName: 'Linda Farris', mrn: 'MRN-39018', program: 'IOP', counselor: 'Maria Gonzales, LCSW', type: 'Expired Auth', dueDate: '2026-07-12', daysOverdue: 6, detail: 'Aetna authorization expired 7/12. Continued stay request not yet submitted.', priority: 'Critical' },
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

export function ChartReview({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<'Deficiencies' | 'Chart Completeness'>('Deficiencies');
  const [typeFilter, setTypeFilter] = useState<DefType | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<'Critical' | 'High' | 'Moderate' | 'All'>('All');
  const [counselorFilter, setCounselorFilter] = useState<string>('All');

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

      {/* Deficiency Type Summary */}
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

      <div className="flex gap-1 border-b border-border">
        {(['Deficiencies', 'Chart Completeness'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

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
                    <button onClick={() => navigate('CosignQueue')} className="text-xs bg-white border border-current px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity">Resolve</button>
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
    </div>
  );
}
