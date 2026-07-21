import React, { useState } from 'react';
import { Screen } from '../App';
import { AlertTriangle, TrendingUp, TrendingDown, Shield, Activity, ChevronRight } from 'lucide-react';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { MetricCard } from '../components/ui/MetricCard';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { RecoveryScoreBadge } from '../components/ui/RecoveryScoreBadge';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, BarChart, Bar, Cell
} from 'recharts';

// ─── Deterministic per-patient risk factor data ────────────────────────────
// (keyed by patient index so it's stable across renders)

type RiskFactor = 'AMA Threat' | 'Severe Cravings' | 'Missed Groups' | 'Positive UA' | 'Psych Instability' | 'Low Motivation';

const RISK_FACTORS: RiskFactor[] = [
  'AMA Threat', 'Severe Cravings', 'Missed Groups', 'Positive UA', 'Psych Instability', 'Low Motivation'
];

// Deterministic lookup table per patient — set once, never random
const RISK_MATRIX: Record<string, Partial<Record<RiskFactor, boolean>>> = {
  p1:  { 'AMA Threat': true, 'Severe Cravings': true, 'Low Motivation': true },
  p2:  { 'Psych Instability': true, 'Severe Cravings': true, 'Missed Groups': true },
  p3:  { 'AMA Threat': true, 'Positive UA': true, 'Severe Cravings': true },
  p4:  { 'Missed Groups': true, 'Low Motivation': true },
  p5:  { 'Severe Cravings': true, 'Missed Groups': true, 'Low Motivation': true },
  p6:  { 'Positive UA': true, 'Psych Instability': true },
  p7:  { 'AMA Threat': true, 'Severe Cravings': true },
  p8:  { 'Low Motivation': true, 'Psych Instability': true },
  p9:  { 'AMA Threat': true, 'Psych Instability': true, 'Positive UA': true },
  p10: { 'Severe Cravings': true },
  p11: { 'Low Motivation': true, 'Missed Groups': true },
  p12: { 'Psych Instability': true },
  p13: { 'AMA Threat': true, 'Severe Cravings': true, 'Missed Groups': true },
  p14: { 'Psych Instability': true, 'Low Motivation': true },
  p15: { 'Positive UA': true, 'Severe Cravings': true },
  p16: {},
  p17: { 'Low Motivation': true },
  p18: { 'Missed Groups': true, 'Psych Instability': true },
  p19: { 'Severe Cravings': true },
  p20: {},
};

// Deterministic 14-day trend (no Math.random)
const TREND_DATA = [
  { day: '7/5',  mood: 5.8, cravings: 6.1 },
  { day: '7/6',  mood: 5.6, cravings: 5.9 },
  { day: '7/7',  mood: 6.1, cravings: 5.6 },
  { day: '7/8',  mood: 5.9, cravings: 5.3 },
  { day: '7/9',  mood: 6.3, cravings: 5.1 },
  { day: '7/10', mood: 6.1, cravings: 4.9 },
  { day: '7/11', mood: 6.5, cravings: 4.6 },
  { day: '7/12', mood: 6.8, cravings: 4.4 },
  { day: '7/13', mood: 6.6, cravings: 4.7 },
  { day: '7/14', mood: 7.0, cravings: 4.2 },
  { day: '7/15', mood: 6.9, cravings: 4.0 },
  { day: '7/16', mood: 7.2, cravings: 3.8 },
  { day: '7/17', mood: 7.1, cravings: 3.6 },
  { day: '7/18', mood: 7.4, cravings: 3.4 },
];

// Risk factor prevalence bar chart data
const FACTOR_PREVALENCE = RISK_FACTORS.map(f => ({
  factor: f,
  count: Object.values(RISK_MATRIX).filter(m => m[f]).length,
}));

const RISK_LEVEL = (patientId: string): 'High' | 'Med' | 'Low' => {
  const factors = Object.values(RISK_MATRIX[patientId] ?? {}).filter(Boolean).length;
  if (factors >= 3) return 'High';
  if (factors >= 1) return 'Med';
  return 'Low';
};

// ─── Intervention actions per patient ─────────────────────────────────────

const INTERVENTIONS: Record<string, string[]> = {
  p1:  ['Updated AMA safety plan 7/17', 'BHT check-in q4h ordered', 'EAP follow-up scheduled'],
  p2:  ['Seroquel increased 7/15', 'DBT distress tolerance session added', 'Nutritional consult ordered'],
  p3:  ['COWS monitoring q4h', 'Suboxone titrated to 24mg', 'Peer mentor assigned'],
  p5:  ['HALT worksheet assigned', 'Group attendance plan written', 'Motivational interview 7/16'],
  p6:  ['UA chain of custody re-collected', 'Psychiatric consult 7/18', 'Family session scheduled'],
  p7:  ['Discharge planning initiated', 'AA sponsor confirmed', 'Vivitrol scheduled for DC day'],
  p9:  ['30-min safety checks ordered', 'Risperdal 0.5mg PRN ordered', 'Daily psych eval ongoing'],
  p13: ['AMA risk flagged in huddle', 'Employer letter drafted via EAP', 'Craving management plan updated'],
};

// ─── Component ────────────────────────────────────────────────────────────

export function RiskDashboard({ navigate }: { navigate: (s: Screen, patientId?: string) => void }) {
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [tab, setTab] = useState<'Risk Matrix' | 'Factor Analysis' | 'Interventions' | 'Peer Benchmarks' | 'Trend Analysis' | 'Risk Definitions'>('Risk Matrix');

  const highRisk = MOCK_PATIENTS.filter(p => RISK_LEVEL(p.id) === 'High');
  const medRisk  = MOCK_PATIENTS.filter(p => RISK_LEVEL(p.id) === 'Med');
  const lowRisk  = MOCK_PATIENTS.filter(p => RISK_LEVEL(p.id) === 'Low');

  const avgCraving = (
    MOCK_PATIENTS.reduce((s, p) => s + p.craving, 0) / MOCK_PATIENTS.length
  ).toFixed(1);

  const avgRecovery = Math.round(
    MOCK_PATIENTS.reduce((s, p) => s + p.recoveryScore, 0) / MOCK_PATIENTS.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-critical" /> Risk & AMA Dashboard
          </h1>
          <p className="text-slate text-sm mt-1">Predictive risk analysis and early intervention tracking — as of July 19, 2026</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-border rounded text-sm font-medium text-slate hover:bg-slate-50">Export Risk Report</button>
          <button className="px-3 py-1.5 bg-critical text-white rounded text-sm font-medium hover:bg-critical/90">Trigger Huddle</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['Risk Matrix', 'Factor Analysis', 'Interventions', 'Peer Benchmarks', 'Trend Analysis', 'Risk Definitions'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Factor Analysis' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-5">
            <div className="card col-span-2">
              <h3 className="font-semibold text-navy text-sm mb-4">Risk Factor Prevalence Across Census</h3>
              <div className="space-y-3">
                {RISK_FACTORS.map(factor => {
                  const count = MOCK_PATIENTS.filter(p => RISK_MATRIX[p.id]?.[factor]).length;
                  const pct = Math.round((count / MOCK_PATIENTS.length) * 100);
                  const colorClass = pct >= 40 ? 'bg-red-500' : pct >= 20 ? 'bg-amber-400' : 'bg-blue-400';
                  return (
                    <div key={factor}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate">{factor}</span>
                        <span className="font-bold text-navy">{count} patients ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-4">Risk Factor Co-occurrence</h3>
              <div className="space-y-3 text-xs">
                {[
                  { combo: 'AMA Threat + Severe Cravings', count: MOCK_PATIENTS.filter(p => RISK_MATRIX[p.id]?.['AMA Threat'] && RISK_MATRIX[p.id]?.['Severe Cravings']).length, risk: 'Very High' },
                  { combo: 'Psych Instability + Low Motivation', count: MOCK_PATIENTS.filter(p => RISK_MATRIX[p.id]?.['Psych Instability'] && RISK_MATRIX[p.id]?.['Low Motivation']).length, risk: 'High' },
                  { combo: 'Missed Groups + Low Motivation', count: MOCK_PATIENTS.filter(p => RISK_MATRIX[p.id]?.['Missed Groups'] && RISK_MATRIX[p.id]?.['Low Motivation']).length, risk: 'High' },
                  { combo: 'Positive UA + AMA Threat', count: MOCK_PATIENTS.filter(p => RISK_MATRIX[p.id]?.['Positive UA'] && RISK_MATRIX[p.id]?.['AMA Threat']).length, risk: 'Critical' },
                  { combo: 'Severe Cravings + Missed Groups', count: MOCK_PATIENTS.filter(p => RISK_MATRIX[p.id]?.['Severe Cravings'] && RISK_MATRIX[p.id]?.['Missed Groups']).length, risk: 'High' },
                ].map(r => (
                  <div key={r.combo} className="flex items-start justify-between gap-2">
                    <span className="text-slate">{r.combo}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-bold text-navy">{r.count}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${r.risk === 'Critical' ? 'bg-red-100 text-red-700' : r.risk === 'Very High' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>{r.risk}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border text-xs text-slate">
                <div className="font-semibold text-navy mb-1">Recovery Score vs Risk Level</div>
                {(['High', 'Med', 'Low'] as const).map(level => {
                  const patients = MOCK_PATIENTS.filter(p => RISK_LEVEL(p.id) === level);
                  const avg = patients.length ? Math.round(patients.reduce((s, p) => s + p.recoveryScore, 0) / patients.length) : 0;
                  return (
                    <div key={level} className="flex justify-between py-0.5">
                      <span className={level === 'High' ? 'text-red-600' : level === 'Med' ? 'text-amber-600' : 'text-green-600'}>{level} Risk</span>
                      <span className="font-bold text-navy">Avg RS: {avg}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Risk Trend — 14 Days (Census Average)</h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="mood" stroke="#1E3A5F" strokeWidth={2} name="Avg Mood" dot={false} />
                  <Line type="monotone" dataKey="cravings" stroke="#E85D04" strokeWidth={2} name="Avg Cravings" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Interventions' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Active interventions documented in the last 7 days for flagged patients. Click a patient row to navigate to their chart.</div>
          {MOCK_PATIENTS.filter(p => INTERVENTIONS[p.id]).map(p => {
            const level = RISK_LEVEL(p.id);
            return (
              <div
                key={p.id}
                className={`card border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${level === 'High' ? 'border-l-critical' : 'border-l-sunrise-amber'}`}
                onClick={() => navigate('PatientDetail', p.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center">{p.firstName[0]}{p.lastName[0]}</div>
                    <div>
                      <div className="font-semibold text-navy text-sm">{p.firstName} {p.lastName}</div>
                      <div className="text-xs text-slate">{p.mrn} · {p.program}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${level === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{level} Risk</span>
                </div>
                <div className="space-y-1">
                  {(INTERVENTIONS[p.id] ?? []).map((intervention, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="text-green-500 shrink-0">✓</span>
                      <span className="text-slate">{intervention}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Risk Matrix' && (
      <>
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'High AMA Risk', value: highRisk.length, suffix: ' clients', color: 'text-critical', border: 'border-l-critical', bg: 'bg-critical/5' },
          { label: 'Medium Risk', value: medRisk.length, suffix: ' clients', color: 'text-sunrise-amber', border: 'border-l-sunrise-amber', bg: 'bg-sunrise-amber/5' },
          { label: 'Low / Stable', value: lowRisk.length, suffix: ' clients', color: 'text-success', border: 'border-l-success', bg: 'bg-success/5' },
          { label: 'Avg Cravings', value: avgCraving, suffix: '/10', color: 'text-navy', border: 'border-l-slate-300', bg: '' },
          { label: 'Avg Recovery Score', value: avgRecovery, suffix: '', color: 'text-sunrise-blue', border: 'border-l-sunrise-blue', bg: '' },
        ].map(k => (
          <div key={k.label} className={`bg-white border border-border border-l-4 ${k.border} rounded-lg shadow-sm p-4 ${k.bg}`}>
            <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>
              {k.value}<span className="text-sm font-normal text-slate">{k.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Priority Intervention List ─── */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-border flex flex-col">
          <div className="p-4 border-b border-border bg-bg flex items-center justify-between">
            <h2 className="font-bold text-navy">Priority Intervention List</h2>
            <span className="text-xs text-slate">{highRisk.length + medRisk.length} clients flagged</span>
          </div>
          <div className="divide-y divide-border overflow-y-auto max-h-[420px]">
            {[...highRisk, ...medRisk].map(p => {
              const risk = RISK_MATRIX[p.id] ?? {};
              const activeFactors = RISK_FACTORS.filter(f => risk[f]);
              const isExpanded = expandedPatient === p.id;
              const level = RISK_LEVEL(p.id);
              return (
                <div key={p.id} className="transition-colors">
                  <div
                    className="p-4 hover:bg-slate-50 cursor-pointer flex items-start gap-3"
                    onClick={() => setExpandedPatient(isExpanded ? null : p.id)}
                  >
                    <PatientAvatar first={p.firstName} last={p.lastName} program={p.program} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-navy">{p.firstName} {p.lastName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          level === 'High' ? 'bg-critical text-white' : 'bg-sunrise-amber text-navy'
                        }`}>
                          {level} Risk
                        </span>
                        <span className="text-xs text-slate">{p.program}</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {activeFactors.map(f => (
                          <span key={f} className="bg-red-50 border border-red-200 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">{f}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <RecoveryScoreBadge score={p.recoveryScore} />
                      <ChevronRight className={`w-4 h-4 text-slate transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="bg-slate-50 border-t border-border px-6 pb-4 pt-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate uppercase tracking-wide mb-2">Active Interventions</div>
                          {(INTERVENTIONS[p.id] ?? ['No active interventions documented.']).map((iv, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-navy mb-1">
                              <Shield className="w-3.5 h-3.5 text-success mt-0.5 flex-none" />
                              {iv}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="text-xs bg-white border border-border px-3 py-1.5 rounded text-slate hover:bg-slate-100 font-medium"
                            onClick={e => { e.stopPropagation(); navigate('PatientDetail', p.id); }}
                          >
                            View Chart
                          </button>
                          <button className="text-xs bg-critical text-white px-3 py-1.5 rounded font-medium hover:bg-critical/90">
                            Add Intervention
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Risk factor prevalence ─── */}
        <div className="bg-white rounded-lg shadow-sm border border-border flex flex-col">
          <div className="p-4 border-b border-border bg-bg">
            <h2 className="font-bold text-navy">Risk Factor Prevalence</h2>
            <p className="text-xs text-slate mt-0.5">Across active census</p>
          </div>
          <div className="p-4 flex-1">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FACTOR_PREVALENCE} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis dataKey="factor" type="category" axisLine={false} tickLine={false} width={110} tick={{ fontSize: 10, fill: '#0F172A', fontWeight: 600 }} />
                  <Tooltip
                    formatter={(v: number) => [`${v} clients`, 'Flagged']}
                    contentStyle={{ fontSize: 11, borderRadius: 8, backgroundColor: '#0F172A', border: 'none', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                    {FACTOR_PREVALENCE.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.count >= 5 ? '#DC2626' : entry.count >= 3 ? '#F97316' : '#FBBF24'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── Mood & Craving Trend ─── */}
        <div className="bg-white rounded-lg shadow-sm border border-border flex flex-col">
          <div className="p-4 border-b border-border bg-bg">
            <h2 className="font-bold text-navy">Census-Wide Mood & Craving Trends</h2>
            <p className="text-xs text-slate mt-0.5">14-day rolling average (self-reported at daily check-in)</p>
          </div>
          <div className="p-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#0F172A', color: '#fff', fontSize: '12px', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" name="Avg Mood" dataKey="mood" stroke="#16A34A" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" name="Avg Cravings" dataKey="cravings" stroke="#DC2626" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── Risk Heatmap (deterministic) ─── */}
        <div className="bg-white rounded-lg shadow-sm border border-border flex flex-col">
          <div className="p-4 border-b border-border bg-bg">
            <h2 className="font-bold text-navy">Risk Factor Heatmap</h2>
            <p className="text-xs text-slate mt-0.5">High and medium risk clients only</p>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-2 pr-3 text-slate font-semibold">Client</th>
                  {RISK_FACTORS.map(f => (
                    <th key={f} className="p-1 text-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 72, verticalAlign: 'bottom' }}>
                      <span className="text-[10px] font-semibold text-slate whitespace-nowrap">{f}</span>
                    </th>
                  ))}
                  <th className="p-1 text-center text-slate font-semibold">#</th>
                </tr>
              </thead>
              <tbody>
                {[...highRisk, ...medRisk].slice(0, 10).map(p => {
                  const risk = RISK_MATRIX[p.id] ?? {};
                  const count = RISK_FACTORS.filter(f => risk[f]).length;
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-slate-50 cursor-pointer" onClick={() => navigate('PatientDetail', p.id)}>
                      <td className="py-2 pr-3 font-medium text-navy whitespace-nowrap">{p.firstName} {p.lastName[0]}.</td>
                      {RISK_FACTORS.map(f => (
                        <td key={f} className="p-1 text-center">
                          <div className={`w-5 h-5 rounded mx-auto ${risk[f] ? 'bg-critical/75' : 'bg-slate-100'}`} />
                        </td>
                      ))}
                      <td className="p-1 text-center">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${count >= 3 ? 'bg-critical text-white' : count >= 1 ? 'bg-sunrise-amber text-navy' : 'bg-slate-100 text-slate'}`}>{count}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </>
      )}

      {tab === 'Peer Benchmarks' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Risk indicator benchmarks against SAMHSA national averages and regional SUD treatment programs — context for clinical performance and risk management.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">AMA Rate Benchmark</h3>
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Sunrise (This Facility)', rate: 12, color: 'bg-amber-500' },
                  { label: 'National Average (SAMHSA)', rate: 18, color: 'bg-gray-400' },
                  { label: 'Top-Quartile Programs', rate: 8, color: 'bg-green-500' },
                  { label: 'High-Risk Programs (75th pct)', rate: 28, color: 'bg-red-500' },
                ].map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate">{b.label}</span>
                      <span className="font-semibold text-navy">{b.rate}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${b.color}`} style={{ width: `${b.rate * 2.5}%` }} />
                    </div>
                  </div>
                ))}
                <div className="text-[10px] text-slate italic">Sources: SAMHSA TEDS 2023; CARF member benchmark data</div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Relapse Rate (30-Day Post-Discharge)</h3>
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Sunrise (Alumni Survey)', rate: 34, color: 'bg-teal-500' },
                  { label: 'National Average', rate: 48, color: 'bg-gray-400' },
                  { label: 'Top-Quartile Programs', rate: 10, color: 'bg-green-500' },
                  { label: 'National OUD-Specific', rate: 59, color: 'bg-red-500' },
                ].map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate">{b.label}</span>
                      <span className="font-semibold text-navy">{b.rate}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${b.color}`} style={{ width: `${b.rate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Risk Indicator Benchmarks — Sunrise vs. National</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-slate">
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Indicator</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Sunrise</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">National Avg</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Top Quartile</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { ind: '30-Day Readmission Rate', us: '11%', nat: '19%', tq: '8%', good: true },
                  { ind: 'Completion Rate (Residential)', us: '68%', nat: '54%', tq: '78%', good: true },
                  { ind: 'Co-occurring MH Tx Rate', us: '81%', nat: '63%', tq: '88%', good: true },
                  { ind: 'MAT Initiation Rate', us: '74%', nat: '58%', tq: '86%', good: true },
                  { ind: 'Average LOS (Residential)', us: '22d', nat: '18d', tq: '28d', good: true },
                  { ind: 'Employment at 6 Months', us: '38%', nat: '31%', tq: '52%', good: false },
                  { ind: 'Housing Stability at 90 Days', us: '61%', nat: '55%', tq: '74%', good: false },
                ].map(r => (
                  <tr key={r.ind} className="hover:bg-gray-50">
                    <td className="py-2 font-medium text-navy">{r.ind}</td>
                    <td className="py-2 text-center font-semibold text-navy">{r.us}</td>
                    <td className="py-2 text-center text-slate">{r.nat}</td>
                    <td className="py-2 text-center text-teal-600 font-semibold">{r.tq}</td>
                    <td className="py-2 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.good ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.good ? '▲ Above Avg' : '▼ Below Avg'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Trend Analysis' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">30-day risk score trends, incident correlation, and population-level safety signal monitoring across all active patients.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Avg Risk Score (Today)', value: '4.1 / 10', color: 'text-amber-600', sub: '↓ from 4.8 last week' },
              { label: 'High-Risk Patients', value: 4, color: 'text-red-600', sub: 'Score ≥7 — active monitoring' },
              { label: 'Incidents (Last 30d)', value: 7, color: 'text-navy', sub: '2 falls, 3 altercations, 2 elopement' },
              { label: 'Risk-Adjusted AMA Rate', value: '6%', color: 'text-green-600', sub: 'Predicted vs actual gap: +1%' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Risk Score Distribution — Last 30 Days</h3>
            <div className="grid grid-cols-5 gap-3 text-xs">
              {[
                { week: 'Jun 22–28', avg: 5.1, high: 6, color: 'bg-red-400' },
                { week: 'Jun 29–Jul 5', avg: 4.9, high: 5, color: 'bg-orange-400' },
                { week: 'Jul 6–12', avg: 4.8, high: 5, color: 'bg-amber-400' },
                { week: 'Jul 13–19', avg: 4.1, high: 4, color: 'bg-yellow-400' },
                { week: 'Today (Jul 19)', avg: 4.1, high: 4, color: 'bg-teal-400' },
              ].map(w => (
                <div key={w.week} className="text-center">
                  <div className="text-slate text-[10px] mb-1">{w.week}</div>
                  <div className="flex items-end justify-center h-20 gap-1">
                    <div className={`w-8 rounded-t ${w.color}`} style={{ height: `${w.avg * 14}%`, minHeight: 8 }}>
                    </div>
                  </div>
                  <div className="font-bold text-navy mt-1">{w.avg}</div>
                  <div className="text-[10px] text-slate">{w.high} high-risk</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Incident-to-Risk Correlation</h3>
              <div className="space-y-2 text-xs">
                {[
                  { incident: 'Patient Fall (n=2)', prevRisk: '7.8 avg', action: 'Fall risk protocol, modified supervision', outcome: 'No further falls post-intervention' },
                  { incident: 'Altercation / Aggression (n=3)', prevRisk: '8.1 avg', action: 'Safety planning, unit separation, staff debrief', outcome: '1 patient transferred, 2 resolved in-unit' },
                  { incident: 'Elopement Risk (n=2)', prevRisk: '9.0 avg', action: 'Therapeutic hold request, LOCA reassessment', outcome: '1 successful AMA, 1 de-escalated and retained' },
                ].map(i => (
                  <div key={i.incident} className="border border-border rounded-lg p-2.5">
                    <div className="font-semibold text-navy mb-0.5">{i.incident} — Pre-incident risk: <span className="text-red-600">{i.prevRisk}</span></div>
                    <div><span className="text-slate font-semibold">Action:</span> <span className="text-navy">{i.action}</span></div>
                    <div><span className="text-slate font-semibold">Outcome:</span> <span className="text-navy">{i.outcome}</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Risk Factor Prevalence — Current Census</h3>
              <div className="space-y-2 text-xs">
                {[
                  { factor: 'Prior AMA history', pct: 38, color: 'bg-red-400' },
                  { factor: 'Active co-occurring MH diagnosis', pct: 61, color: 'bg-purple-500' },
                  { factor: 'Opioid use disorder (primary)', pct: 47, color: 'bg-blue-500' },
                  { factor: 'Trauma history documented', pct: 72, color: 'bg-orange-400' },
                  { factor: 'Unstable housing at admission', pct: 29, color: 'bg-amber-500' },
                  { factor: 'Pending legal matters', pct: 10, color: 'bg-teal-500' },
                  { factor: 'Limited social support', pct: 44, color: 'bg-navy' },
                ].map(f => (
                  <div key={f.factor}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate">{f.factor}</span>
                      <span className="font-semibold text-navy">{f.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${f.color}`} style={{ width: `${f.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Risk Definitions' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Standardized risk factor definitions, scoring rubrics, and clinical thresholds used by the Sunrise Risk Dashboard.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">AMA / AWOL Risk Factors</h3>
              <div className="space-y-1.5 text-xs">
                <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-red-800 font-medium text-[10px]">High Risk Threshold: ≥3 factors present → escalate to clinical team</div>
                {[
                  { factor: 'Prior AMA discharge (same or other facility)', weight: '+3 pts', rationale: 'Strongest single predictor of current AMA attempt (OR 4.2)' },
                  { factor: 'Expressed AMA desire in past 48h', weight: '+3 pts', rationale: 'Verbalization is a direct precursor — immediate counselor contact required' },
                  { factor: 'LOS < 7 days', weight: '+2 pts', rationale: 'Early treatment phase; therapeutic alliance not yet established' },
                  { factor: 'Court-ordered admission', weight: '+1 pt', rationale: 'Involuntary motivation increases early AMA risk' },
                  { factor: 'Family conflict / active domestic stressor', weight: '+2 pts', rationale: 'External pull factors are top AMA driver in qualitative studies' },
                  { factor: 'Missed 2+ groups in past 48h without excuse', weight: '+2 pts', rationale: 'Disengagement predicts AMA with 72% sensitivity' },
                  { factor: 'Withdrawal score trending up (COWS/CIWA)', weight: '+2 pts', rationale: 'Physical discomfort is a top stated reason for AMA' },
                  { factor: 'Positive UA for non-prescribed substance (in treatment)', weight: '+1 pt', rationale: 'Continued use may indicate ambivalence about recovery' },
                ].map(r => (
                  <div key={r.factor} className="border border-border rounded-lg p-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-medium text-navy">{r.factor}</span>
                      <span className="font-bold text-red-600 shrink-0">{r.weight}</span>
                    </div>
                    <div className="text-slate mt-0.5">{r.rationale}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Relapse Risk Factors</h3>
                <div className="space-y-1.5 text-xs">
                  {[
                    { factor: 'Positive UA during treatment stay', weight: 'High', color: 'bg-red-100 text-red-700' },
                    { factor: 'Cravings score ≥8/10 on daily check-in', weight: 'High', color: 'bg-red-100 text-red-700' },
                    { factor: 'Prior relapse after residential treatment', weight: 'High', color: 'bg-red-100 text-red-700' },
                    { factor: 'Housing instability at discharge', weight: 'High', color: 'bg-red-100 text-red-700' },
                    { factor: 'No MAT despite OUD/AUD diagnosis', weight: 'Moderate', color: 'bg-amber-100 text-amber-700' },
                    { factor: 'Limited sober support network', weight: 'Moderate', color: 'bg-amber-100 text-amber-700' },
                    { factor: 'Co-occurring untreated psychiatric disorder', weight: 'Moderate', color: 'bg-amber-100 text-amber-700' },
                    { factor: 'Unemployment at discharge', weight: 'Moderate', color: 'bg-amber-100 text-amber-700' },
                    { factor: 'Missing family therapy sessions', weight: 'Low', color: 'bg-blue-100 text-blue-700' },
                  ].map(r => (
                    <div key={r.factor} className="flex items-center justify-between border border-border rounded-lg px-2.5 py-1.5">
                      <span className="text-navy">{r.factor}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${r.color}`}>{r.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-2">Overdose Risk Thresholds</h3>
                <div className="space-y-1.5 text-xs">
                  {[
                    { level: 'Critical', desc: 'Fentanyl-positive UA + opioid tolerance break (recent detox or incarceration). Naloxone must be on person at discharge.', color: 'bg-red-100 text-red-800 border-red-300' },
                    { level: 'High', desc: 'OUD with prior non-fatal overdose. Naloxone prescribed, STOP-BANG ≥5, or CIWA/COWS previously ≥15.', color: 'bg-amber-100 text-amber-800 border-amber-300' },
                    { level: 'Moderate', desc: 'Polysubstance use including opioids. Alcohol + benzodiazepine combination. No prior OD but high cravings.', color: 'bg-blue-100 text-blue-800 border-blue-300' },
                  ].map(r => (
                    <div key={r.level} className={`border rounded-lg p-2 ${r.color}`}>
                      <div className="font-bold">{r.level}</div>
                      <div className="mt-0.5 opacity-90">{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
