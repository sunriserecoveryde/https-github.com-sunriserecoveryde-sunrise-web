import React, { useState } from 'react';
import { MOCK_PATIENTS, Patient } from '../data/mockPatients';
import { Screen } from '../App';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import {
  Search, Filter, FileCheck, AlertCircle, ChevronDown, ChevronUp,
  ClipboardList, BarChart3, Plus, Calendar, CheckCircle2
} from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import { getRolesWithEditAccess } from '../data/mockRoles';

// ─── ASAM Dimension Metadata ─────────────────────────────────────────────────

const DIMENSIONS = [
  { key: 'd1', code: 'D1', name: 'Acute Intox / Withdrawal', short: 'Withdrawal', desc: 'Risk of acute intoxication, withdrawal potential, and medical urgency of current substance use.' },
  { key: 'd2', code: 'D2', name: 'Biomedical Conditions', short: 'Biomedical', desc: 'Physical health, co-occurring medical conditions, and whether they impact treatment.' },
  { key: 'd3', code: 'D3', name: 'Emotional / Behavioral', short: 'Behavioral', desc: 'Psychiatric symptoms, emotional stability, and how mental health affects treatment readiness.' },
  { key: 'd4', code: 'D4', name: 'Readiness to Change', short: 'Readiness', desc: 'Motivation, ambivalence, and engagement with treatment and recovery goals.' },
  { key: 'd5', code: 'D5', name: 'Relapse Potential', short: 'Relapse Risk', desc: 'Ability to structure a recovery environment; awareness of triggers, coping strategies.' },
  { key: 'd6', code: 'D6', name: 'Recovery Environment', short: 'Environment', desc: 'Support from family, housing stability, employment, legal issues, and community resources.' },
];

const SCORE_COLOR = (score: number) => {
  if (score >= 3) return 'bg-critical text-white';
  if (score === 2) return 'bg-sunrise-amber text-navy';
  if (score === 1) return 'bg-success text-white';
  return 'bg-slate-100 text-slate-400';
};

const SCORE_LABEL: Record<number, string> = {
  0: 'None',
  1: 'Low',
  2: 'Moderate',
  3: 'High',
  4: 'Critical',
};

const LOC_LABELS: Record<string, string> = {
  Residential: '3.7 — Clinically Managed High-Intensity Residential',
  PHP:         '2.5 — Partial Hospitalization Program',
  IOP:         '2.1 — Intensive Outpatient Program',
};

const LAST_UPDATED: Record<string, string> = {
  p1: '2026-07-14', p2: '2026-07-12', p3: '2026-07-15',
  p4: '2026-07-16', p5: '2026-07-10', p6: '2026-07-17',
  p7: '2026-07-11', p8: '2026-07-13', p9: '2026-07-09',
};

const NEXT_REVIEW: Record<string, string> = {
  p1: '2026-07-21', p2: '2026-07-26', p3: '2026-07-22',
  p4: '2026-07-23', p5: '2026-07-17', p6: '2026-07-24',
  p7: '2026-07-18', p8: '2026-07-20', p9: '2026-07-16',
};

const TODAY = '2026-07-19';

// ─── Narrative mock per patient ───────────────────────────────────────────────

const ASAM_NARRATIVES: Record<string, Record<string, string>> = {
  p1: {
    d1: 'Active alcohol withdrawal — CIWA 14 on admission. Librium taper initiated. No seizure history. Monitor Q4H.',
    d2: 'Hypertension managed with Lisinopril 10mg. No acute medical co-morbidities.',
    d3: 'Mild anxiety symptoms. PHQ-9: 8 (mild depression). No SI/HI. Psychiatry consult scheduled.',
    d4: 'Pre-contemplation to Contemplation stage. Externally motivated by family pressure. Ambivalent about long-term recovery.',
    d5: 'Verbalized AMA intent twice this week. Limited coping skills for alcohol cravings. High relapse risk.',
    d6: 'Lives with supportive spouse. Employment intact (FMLA). No legal issues. Stable housing.',
  },
  p4: {
    d1: 'Dual withdrawal: COWS 10, CIWA 8 on current assessment. Suboxone + Lorazepam dual protocol active.',
    d2: 'IVDU-related abscess left arm, healing with daily wound care. HCV+ pending Fibroscan. BP elevated 144/92.',
    d3: 'Moderate depression (PHQ-9: 14). Trauma history reported in intake. Guarded affect.',
    d4: 'Court-mandated — external motivation primary. Identified daughter as internal motivator in 1:1.',
    d5: 'Limited insight into relapse pattern. Minimizes polysubstance use severity.',
    d6: 'Currently unhoused — shelter pre-arranged post-discharge. No family support network. Active legal case.',
  },
};

function getNarrative(patientId: string, dim: string): string {
  return ASAM_NARRATIVES[patientId]?.[dim] ?? 'No clinical narrative recorded for this dimension. Assessment required.';
}

// ─── Radar chart data ─────────────────────────────────────────────────────────

function buildRadarData(asam: Patient['asam']) {
  return DIMENSIONS.map(d => ({
    dim: d.short,
    score: asam[d.key as keyof Patient['asam']],
    fullMark: 4,
  }));
}

// ─── Expanded row content ─────────────────────────────────────────────────────

function AssessmentDetail({ patient, readOnly }: { patient: Patient; readOnly?: boolean }) {
  const radarData = buildRadarData(patient.asam);

  return (
    <div className="border-t border-border bg-slate-50/50 p-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar chart */}
        <div className="bg-white rounded-lg border border-border p-4 flex flex-col items-center">
          <div className="text-xs font-bold text-slate uppercase tracking-wider mb-3 self-start">ASAM Profile Radar</div>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: '#64748B' }} />
                <Radar dataKey="score" stroke="#1E3A5F" fill="#1E3A5F" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 6, backgroundColor: '#0F172A', border: 'none', color: '#fff' }}
                  formatter={(v: number) => [`${v} — ${SCORE_LABEL[v] ?? ''}`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-3 flex-wrap justify-center mt-2">
            {Object.entries(SCORE_LABEL).map(([k, v]) => (
              <div key={k} className={`text-[10px] font-bold px-2 py-0.5 rounded ${SCORE_COLOR(Number(k))}`}>{k} = {v}</div>
            ))}
          </div>
        </div>

        {/* Dimension narratives */}
        <div className="lg:col-span-2 space-y-2">
          {DIMENSIONS.map(d => {
            const score = patient.asam[d.key as keyof Patient['asam']];
            return (
              <div key={d.key} className="bg-white rounded-lg border border-border p-3">
                <div className="flex items-start gap-3">
                  <span className={`flex-none mt-0.5 w-7 h-7 rounded text-xs font-bold flex items-center justify-center ${SCORE_COLOR(score)}`}>
                    {score}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-navy">{d.code}: {d.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${SCORE_COLOR(score)}`}>
                        {SCORE_LABEL[score] ?? 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-slate mt-1 leading-relaxed">{getNarrative(patient.id, d.key)}</p>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <LockedButton
          locked={readOnly}
          className="flex items-center gap-2 bg-sunrise-blue text-white text-xs font-semibold px-4 py-2 rounded hover:bg-sunrise-blue-light transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5" /> Update Assessment
        </LockedButton>
        <button className="flex items-center gap-2 border border-border text-slate text-xs font-semibold px-3 py-2 rounded hover:bg-white transition-colors">
          <FileCheck className="w-3.5 h-3.5" /> Print Assessment
        </button>
        <LockedButton
          locked={readOnly}
          className="flex items-center gap-2 border border-border text-slate text-xs font-semibold px-3 py-2 rounded hover:bg-white transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" /> Schedule Review
        </LockedButton>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type SortKey = 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'name';
type FilterMode = 'All' | 'Overdue' | 'High Risk' | 'Review Due';

export function ASAMAssessments({ navigate, readOnly }: { navigate: (s: Screen, id?: string) => void; readOnly?: boolean }) {
  const editRoles = getRolesWithEditAccess('ASAMAssessments');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('d5');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterMode, setFilterMode] = useState<FilterMode>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'Assessments' | 'Population View' | 'ASAM Reference' | 'Outcome Tracking' | 'Criteria Reference'>('Assessments');

  const highRiskCount = MOCK_PATIENTS.filter(p => p.asam.d5 >= 3 || p.asam.d3 >= 3).length;
  const overdueCount = MOCK_PATIENTS.filter(p => (NEXT_REVIEW[p.id] ?? '') < TODAY).length;
  const dueSoonCount = MOCK_PATIENTS.filter(p => {
    const nr = NEXT_REVIEW[p.id] ?? '';
    return nr >= TODAY && nr <= '2026-07-26';
  }).length;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortedPatients = [...MOCK_PATIENTS]
    .filter(p => {
      const q = searchTerm.toLowerCase();
      if (q && !`${p.firstName} ${p.lastName} ${p.mrn}`.toLowerCase().includes(q)) return false;
      if (filterMode === 'High Risk') return p.asam.d5 >= 3 || p.asam.d3 >= 3;
      if (filterMode === 'Overdue') return (NEXT_REVIEW[p.id] ?? '') < TODAY;
      if (filterMode === 'Review Due') {
        const nr = NEXT_REVIEW[p.id] ?? '';
        return nr >= TODAY && nr <= '2026-07-26';
      }
      return true;
    })
    .sort((a, b) => {
      let av: number, bv: number;
      if (sortKey === 'name') {
        return sortDir === 'asc'
          ? `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
          : `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
      }
      av = a.asam[sortKey];
      bv = b.asam[sortKey];
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  const SortIcon = ({ k }: { k: SortKey }) => (
    sortKey === k
      ? sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-0.5" /> : <ChevronUp className="w-3 h-3 inline ml-0.5" />
      : null
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy">ASAM Assessments</h1>
          <p className="text-slate text-sm mt-1">Multidimensional assessment — 6 dimensions, LOC recommendation, and review tracking</p>
        </div>
        <LockedButton
          locked={readOnly}
          className="flex items-center gap-2 bg-sunrise-blue text-white px-4 py-2 rounded font-medium shadow-sm hover:bg-sunrise-blue-light transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> New Assessment
        </LockedButton>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['Assessments', 'Population View', 'ASAM Reference', 'Outcome Tracking', 'Criteria Reference'] as const).map(t => (
          <button key={t} onClick={() => setTab(t as typeof tab)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Population View' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Average ASAM Score by Dimension</h3>
              <div className="space-y-2.5">
                {DIMENSIONS.map(d => {
                  const avg = MOCK_PATIENTS.reduce((a, p) => a + p.asam[d.key as keyof Patient['asam']], 0) / MOCK_PATIENTS.length;
                  return (
                    <div key={d.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate">{d.code} — {d.name}</span>
                        <span className={`font-bold ${avg >= 3 ? 'text-red-600' : avg >= 2 ? 'text-amber-600' : 'text-green-600'}`}>{avg.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className={`h-1.5 rounded-full ${avg >= 3 ? 'bg-red-500' : avg >= 2 ? 'bg-amber-400' : 'bg-green-500'}`} style={{ width: `${(avg / 4) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-slate mt-3">Census average · n={MOCK_PATIENTS.length} · Scale 0–4</div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Level of Care Distribution</h3>
              <div className="space-y-3">
                {(['Residential', 'PHP', 'IOP'] as const).map(loc => {
                  const count = MOCK_PATIENTS.filter(p => p.program === loc).length;
                  const pct = Math.round((count / MOCK_PATIENTS.length) * 100);
                  const colors: Record<string, string> = { Residential: 'bg-navy', PHP: 'bg-blue-500', IOP: 'bg-teal-500' };
                  return (
                    <div key={loc}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate">{loc}</span>
                        <span className="font-bold text-navy">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className={`h-2 rounded-full ${colors[loc]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">D5 Relapse Risk Distribution</h4>
                {[0, 1, 2, 3, 4].map(score => {
                  const count = MOCK_PATIENTS.filter(p => p.asam.d5 === score).length;
                  return (
                    <div key={score} className="flex items-center gap-2 text-xs mb-1">
                      <span className="w-16 text-slate">{SCORE_LABEL[score]}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                        <div className={`h-1.5 rounded-full ${score >= 3 ? 'bg-red-500' : score >= 2 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${(count / MOCK_PATIENTS.length) * 100}%` }} />
                      </div>
                      <span className="font-bold text-navy w-4">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">High-Acuity Patients (D3 or D5 ≥ 3)</h3>
              <div className="space-y-3">
                {MOCK_PATIENTS.filter(p => p.asam.d5 >= 3 || p.asam.d3 >= 3).map(p => (
                  <div key={p.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-navy text-sm">{p.firstName} {p.lastName}</span>
                      <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">High Risk</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {p.asam.d3 >= 3 && <span className="text-[10px] bg-orange/10 text-orange px-1.5 py-0.5 rounded">D3: {SCORE_LABEL[p.asam.d3]}</span>}
                      {p.asam.d5 >= 3 && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">D5: {SCORE_LABEL[p.asam.d5]}</span>}
                      <span className="text-[10px] bg-slate-100 text-slate px-1.5 py-0.5 rounded">{p.program}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Assessments' && (
      <>
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'High Risk (D3/D5)', value: highRiskCount, color: 'text-critical', border: 'border-critical/30', icon: AlertCircle },
          { label: 'Overdue Reviews', value: overdueCount, color: 'text-sunrise-amber', border: 'border-sunrise-amber/40', icon: Calendar },
          { label: 'Due This Week', value: dueSoonCount, color: 'text-sunrise-blue', border: 'border-sunrise-blue/30', icon: ClipboardList },
          { label: 'Completed (30d)', value: 45, color: 'text-success', border: 'border-success/30', icon: CheckCircle2 },
        ].map(k => (
          <div key={k.label} className={`bg-white border-l-4 ${k.border} rounded-lg shadow-sm p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate uppercase tracking-wider">{k.label}</div>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
          <div className="flex gap-1 flex-wrap">
            {(['All', 'High Risk', 'Overdue', 'Review Due'] as FilterMode[]).map(f => (
              <button
                key={f}
                onClick={() => setFilterMode(f)}
                className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${filterMode === f ? 'bg-navy text-white' : 'text-slate hover:bg-slate-100 hover:text-navy'}`}
              >
                {f}
                {f === 'Overdue' && overdueCount > 0 && (
                  <span className="ml-1 bg-critical text-white text-[10px] px-1 rounded-full">{overdueCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-bg border border-border rounded text-sm focus:outline-none focus:border-sunrise-blue w-60"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg text-slate-light font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 pl-6 cursor-pointer hover:text-navy" onClick={() => handleSort('name')}>
                  Client <SortIcon k="name" />
                </th>
                <th className="p-4">Program</th>
                {DIMENSIONS.map(d => (
                  <th
                    key={d.key}
                    className="p-4 text-center cursor-pointer hover:text-navy"
                    title={d.name}
                    onClick={() => handleSort(d.key as SortKey)}
                  >
                    {d.code} <SortIcon k={d.key as SortKey} />
                  </th>
                ))}
                <th className="p-4">LOC</th>
                <th className="p-4">Next Review</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedPatients.map(p => {
                const isExpanded = expandedId === p.id;
                const nextReview = NEXT_REVIEW[p.id];
                const isOverdue = nextReview < TODAY;
                const isDueSoon = nextReview >= TODAY && nextReview <= '2026-07-26';

                return (
                  <React.Fragment key={p.id}>
                    <tr
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/40' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <PatientAvatar first={p.firstName} last={p.lastName} program={p.program} size="sm" />
                          <div>
                            <div className="font-bold text-navy hover:text-sunrise-blue">{p.firstName} {p.lastName}</div>
                            <div className="text-[10px] text-slate font-mono">{p.mrn}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-semibold bg-slate-100 text-slate px-2 py-0.5 rounded">{p.program}</span>
                      </td>
                      {DIMENSIONS.map(d => {
                        const score = p.asam[d.key as keyof Patient['asam']];
                        return (
                          <td key={d.key} className="p-4 text-center">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${SCORE_COLOR(score)}`} title={`${d.name}: ${SCORE_LABEL[score]}`}>
                              {score}
                            </span>
                          </td>
                        );
                      })}
                      <td className="p-4 text-xs font-semibold text-navy whitespace-nowrap">
                        {p.program === 'Residential' ? '3.7' : p.program === 'PHP' ? '2.5' : '2.1'}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${isOverdue ? 'bg-red-100 text-critical' : isDueSoon ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate'}`}>
                          {isOverdue ? '⚠ ' : ''}{nextReview}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <LockedButton locked={readOnly} editRoles={editRoles} className="text-sunrise-blue text-xs font-medium hover:underline bg-sunrise-blue/10 px-2 py-1 rounded">
                            Update
                          </LockedButton>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={11}>
                          <AssessmentDetail patient={p} readOnly={readOnly} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {sortedPatients.length === 0 && (
            <div className="text-center py-12 text-slate">No patients match your criteria.</div>
          )}
        </div>

        {/* Dimension legend */}
        <div className="border-t border-border p-4 bg-bg/50">
          <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-2">ASAM Dimension Key</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-[10px]">
            {DIMENSIONS.map(d => (
              <div key={d.key} className="bg-white border border-border rounded px-2 py-1.5">
                <div className="font-bold text-navy">{d.code}</div>
                <div className="text-slate leading-tight">{d.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </>
      )}

      {tab === 'ASAM Reference' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">ASAM Criteria quick-reference — six dimensions, level-of-care descriptions, and step-up/step-down decision guidance.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">The Six ASAM Dimensions</h3>
              <div className="space-y-3">
                {[
                  { code: 'D1', name: 'Acute Intoxication / Withdrawal Potential', desc: 'Assess current intoxication, withdrawal history, and severity of expected withdrawal. Drives detox level-of-care decisions.', note: 'CIWA ≥ 15 → residential or higher; COWS ≥ 13 → MAT induction appropriate' },
                  { code: 'D2', name: 'Biomedical Conditions and Complications', desc: 'Physical health conditions complicating treatment: abscess, hepatitis, HIV, diabetes, pregnancy, chronic pain.', note: 'Active wound (IVDU) → nursing care plan required; Hep C → infectious disease referral' },
                  { code: 'D3', name: 'Emotional, Behavioral, or Cognitive Conditions', desc: 'Co-occurring psychiatric disorders, cognitive impairment, trauma history, and behavioral presentation. Distinguish substance-induced vs. independent.', note: 'Active suicidality → crisis protocol; PTSD + SUD → trauma-informed residential' },
                  { code: 'D4', name: 'Readiness to Change', desc: 'Assess motivation, ambivalence, and engagement. MI-driven — rolling with resistance, developing discrepancy, exploring patient goals.', note: 'Pre-contemplation → motivational work first; action stage → reinforce and expand engagement' },
                  { code: 'D5', name: 'Relapse / Continued Use Potential', desc: 'History of relapse, triggers, coping deficit, and risk of return to use. Drives step-down vs. step-up decisions.', note: 'Multiple residential admits → PHP + intensive aftercare; strong skills + support → OP' },
                  { code: 'D6', name: 'Recovery Environment', desc: 'Housing stability, family/peer support, legal issues, employment, and community resources.', note: 'Homeless + using network → sober living; strong family + employment → outpatient step-down' },
                ].map(d => (
                  <div key={d.code} className="border border-border rounded-lg p-2.5">
                    <div className="flex items-start gap-2 mb-1">
                      <span className="bg-navy text-white text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">{d.code}</span>
                      <div className="font-semibold text-navy text-xs">{d.name}</div>
                    </div>
                    <div className="text-[10px] text-slate leading-relaxed">{d.desc}</div>
                    <div className="text-[10px] text-orange mt-1"><strong>Example: </strong>{d.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">ASAM Levels of Care</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { level: '0.5 — Early Intervention', desc: 'Brief intervention, education. No SUD diagnosis yet. No withdrawal risk.', color: 'bg-green-50 border-green-200' },
                    { level: '1.0 — Outpatient', desc: '< 9 hrs/week. Standard therapy and med management. Stable environment.', color: 'bg-green-50 border-green-200' },
                    { level: '2.1 — Intensive Outpatient (IOP)', desc: '9–19 hrs/week, multiple days. Structured. Mild–moderate severity.', color: 'bg-blue-50 border-blue-200' },
                    { level: '2.5 — Partial Hospitalization (PHP)', desc: '≥ 20 hrs/week, near-daily. Monitoring without 24-hr. Moderate severity.', color: 'bg-blue-50 border-blue-200' },
                    { level: '3.1 — Clinically Managed Low-Intensity Residential', desc: '24-hr support, minimal medical monitoring. D4–D6 primarily.', color: 'bg-amber-50 border-amber-200' },
                    { level: '3.5 — Clinically Managed High-Intensity Residential', desc: '24-hr care, higher psychiatric/behavioral complexity.', color: 'bg-amber-50 border-amber-200' },
                    { level: '3.7 — Medically Monitored Intensive Inpatient', desc: '24-hr medical monitoring. Significant withdrawal or biomedical risk.', color: 'bg-orange-50 border-orange-200' },
                    { level: '4.0 — Medically Managed Intensive Inpatient', desc: 'Hospital-based. Acute DT risk, life-threatening complications.', color: 'bg-red-50 border-red-200' },
                  ].map(l => (
                    <div key={l.level} className={`border rounded-lg p-2 ${l.color}`}>
                      <div className="font-semibold text-navy">{l.level}</div>
                      <div className="text-slate mt-0.5">{l.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-2">Step-Up / Step-Down Triggers</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-red-600">Step Up</div>
                  {['CIWA ≥ 15 or COWS ≥ 25 — escalating withdrawal', 'Active suicidal ideation with plan or intent', 'Psychiatric decompensation or psychosis onset', 'Medical complication requiring nursing monitoring', 'Continued use despite PHP-level intervention'].map(s => (
                    <div key={s} className="flex items-start gap-1.5 text-slate"><span className="text-red-500 shrink-0">▲</span>{s}</div>
                  ))}
                  <div className="font-semibold text-green-600 mt-2">Step Down</div>
                  {['CIWA < 8 and COWS < 5 for 48+ hrs stable', 'No active psychiatric crisis or imminent risk', 'Engaged with treatment — goals being met', 'Recovery environment assessed as safe/supportive', 'Can safely self-administer medications'].map(s => (
                    <div key={s} className="flex items-start gap-1.5 text-slate"><span className="text-green-500 shrink-0">▼</span>{s}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Outcome Tracking' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">ASAM level-of-care outcome data — appropriate placement rates, step-down completions, and 90-day post-discharge recovery indicators.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Appropriate LOC Placement', value: '91%', color: 'text-green-600', sub: 'Matched ASAM recommendation' },
              { label: 'Step-Down Completions', value: 7, color: 'text-blue-600', sub: 'Residential → PHP this quarter' },
              { label: 'Step-Up Admissions', value: 2, color: 'text-amber-600', sub: 'IOP → Residential escalation' },
              { label: '90-Day Sobriety Rate', value: '62%', color: 'text-teal-600', sub: 'Alumni follow-up cohort' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">LOC Outcome by ASAM Placement Match</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">LOC Placed</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Admits</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">ASAM Match</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Completion</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">90-Day Sobriety</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { loc: 'Detox / 3.7', admits: 14, match: '93%', complete: '79%', sober: '54%' },
                    { loc: 'Residential / 3.5', admits: 38, match: '89%', complete: '68%', sober: '62%' },
                    { loc: 'PHP / 2.5', admits: 22, match: '91%', complete: '74%', sober: '67%' },
                    { loc: 'IOP / 2.1', admits: 41, match: '94%', complete: '82%', sober: '71%' },
                  ].map(r => (
                    <tr key={r.loc} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-navy">{r.loc}</td>
                      <td className="py-2 text-center text-slate">{r.admits}</td>
                      <td className="py-2 text-center text-green-600 font-semibold">{r.match}</td>
                      <td className="py-2 text-center text-blue-600 font-semibold">{r.complete}</td>
                      <td className="py-2 text-center text-teal-600 font-semibold">{r.sober}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">ASAM Dimension Severity → Outcome Correlations</h3>
              <div className="space-y-2 text-xs">
                {[
                  { dim: 'D1 Intoxication/Withdrawal (High)', outcome: 'Completion rate 15% lower. MAT initiation significantly closes the gap.', risk: 'high' },
                  { dim: 'D3 Emotional/Behavioral (High)', outcome: '20% higher AMA risk. Co-occurring psychiatric treatment greatly improves outcomes.', risk: 'high' },
                  { dim: 'D4 Readiness (Pre-Contemplation)', outcome: 'MI-focused groups increase completion; forcing 12-step early decreases engagement.', risk: 'mod' },
                  { dim: 'D5 Relapse History (Chronic)', outcome: 'Prior residential tx = 32% higher relapse risk. Robust aftercare planning is essential.', risk: 'mod' },
                  { dim: 'D6 Recovery Environment (Stable)', outcome: 'Strong support network = 41% better 90-day sobriety outcomes.', risk: 'low' },
                ].map(d => (
                  <div key={d.dim} className="border border-border rounded-lg p-2.5">
                    <div className={`font-semibold mb-0.5 text-[11px] ${d.risk === 'high' ? 'text-red-700' : d.risk === 'mod' ? 'text-amber-700' : 'text-green-700'}`}>{d.dim}</div>
                    <div className="text-slate">{d.outcome}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Criteria Reference' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">ASAM Criteria 3rd Edition quick reference — dimension definitions, LOC decision matrix, and documentation requirements for assessors.</div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">The Six ASAM Dimensions</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { dim: 'Dimension 1', title: 'Acute Intoxication / Withdrawal Potential', desc: 'Assesses current intoxication and the risk or complications of withdrawal — informs detox level of care need.', examples: 'CIWA-Ar ≥10, COWS ≥13, seizure history, prior complicated withdrawal' },
                { dim: 'Dimension 2', title: 'Biomedical Conditions & Complications', desc: 'Physical health status unrelated to SUD that affects treatment needs or creates risk.', examples: 'Hepatitis C, HIV, DM, HTN, pregnancy, chronic pain, hepatic impairment' },
                { dim: 'Dimension 3', title: 'Emotional, Behavioral & Cognitive Conditions', desc: 'Co-occurring mental health or neurocognitive conditions that affect treatment or pose independent risk.', examples: 'MDD, PTSD, bipolar, schizophrenia, TBI, active suicidality, cognitive deficit' },
                { dim: 'Dimension 4', title: 'Readiness to Change', desc: 'Motivation and readiness to engage in and comply with treatment — informs intensity of motivational interventions.', examples: 'Precontemplation, court-mandated admission, denial, ambivalence, contemplation' },
                { dim: 'Dimension 5', title: 'Relapse / Continued Use / Continued Problem Potential', desc: 'Risk of relapse, continued use, or continued problems given current coping skills and environmental stressors.', examples: 'Chronic relapse history, limited coping, environmental triggers, no sober supports' },
                { dim: 'Dimension 6', title: 'Recovery Environment', desc: 'Social, environmental, and living situation factors that support or undermine recovery.', examples: 'Housing instability, using partner/household, lack of transportation, family support' },
              ].map(d => (
                <div key={d.dim} className="border border-border rounded-xl p-3">
                  <div className="font-bold text-navy text-[10px] uppercase tracking-wider mb-0.5">{d.dim}</div>
                  <div className="font-semibold text-navy mb-1">{d.title}</div>
                  <div className="text-slate mb-1.5">{d.desc}</div>
                  <div className="text-[10px]"><span className="font-semibold text-slate">Key indicators:</span> <span className="text-navy">{d.examples}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">LOC Decision Matrix — Dimensional Severity Thresholds</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['LOC', 'ASAM Level', 'Dim 1', 'Dim 2', 'Dim 3', 'Dim 4', 'Dim 5', 'Dim 6'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { loc: 'Medically Managed Intensive Inpatient (Detox)', level: '4-WM', d1: 'Severe', d2: 'Moderate+', d3: 'Any', d4: 'Any', d5: 'Severe', d6: 'Unsafe' },
                  { loc: 'Residential', level: '3.5/3.1', d1: 'Minimal', d2: 'Mild-Mod', d3: 'Moderate', d4: 'Low-Mod', d5: 'High', d6: 'Unstable' },
                  { loc: 'Partial Hospitalization (PHP)', level: '2.5', d1: 'None', d2: 'Stable', d3: 'Mild-Mod', d4: 'Moderate', d5: 'Moderate', d6: 'Mod-Stable' },
                  { loc: 'Intensive Outpatient (IOP)', level: '2.1', d1: 'None', d2: 'Stable', d3: 'Mild', d4: 'Mod-High', d5: 'Moderate', d6: 'Stable' },
                  { loc: 'Outpatient (OP)', level: '1.0', d1: 'None', d2: 'None', d3: 'Minimal', d4: 'High', d5: 'Low', d6: 'Supportive' },
                ].map(r => (
                  <tr key={r.loc} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-navy">{r.loc}</td>
                    <td className="px-3 py-2 font-mono text-blue-700 font-bold">{r.level}</td>
                    {[r.d1, r.d2, r.d3, r.d4, r.d5, r.d6].map((v, i) => (
                      <td key={i} className={`px-3 py-2 ${v.includes('Severe') || v.includes('Unsafe') ? 'text-red-600 font-semibold' : v.includes('None') || v.includes('Stable') ? 'text-green-600' : 'text-navy'}`}>{v}</td>
                    ))}
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
