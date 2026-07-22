import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS, Patient } from '../data/mockPatients';
import { RecoveryScoreBadge } from '../components/ui/RecoveryScoreBadge';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import {
  TrendingUp, TrendingDown, Info, AlertTriangle, Activity,
  ChevronDown, ChevronUp, BarChart3,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';

// ─── RES component weights ────────────────────────────────────────────────────

const COMPONENTS = [
  { key: 'group',       label: 'Group Attendance',       weight: 0.25, color: '#1e5fa8' },
  { key: 'individual',  label: 'Individual Sessions',    weight: 0.20, color: '#f97316' },
  { key: 'ua',          label: 'UA Compliance',          weight: 0.15, color: '#14b8a6' },
  { key: 'medication',  label: 'Medication Adherence',   weight: 0.10, color: '#8b5cf6' },
  { key: 'counselor',   label: 'Counselor Rating',       weight: 0.10, color: '#0ea5e9' },
  { key: 'peer',        label: 'Peer Support',           weight: 0.10, color: '#22c55e' },
  { key: 'assignments', label: 'Assignments Completed',  weight: 0.10, color: '#f59e0b' },
];

// Seeded pseudo-random for deterministic component scores
function seeded(patientId: string, component: string): number {
  const hash = [...`${patientId}${component}`].reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0), 0);
  return Math.abs(hash) % 41 + 60; // 60-100 range
}

// Build component breakdown for a patient
function buildComponents(p: Patient) {
  return COMPONENTS.map(c => {
    const raw = seeded(p.id, c.key);
    // Anchor to overall score ± 15
    const score = Math.min(100, Math.max(0, p.recoveryScore + (raw - 80)));
    return { ...c, score: Math.round(score), contribution: Math.round(score * c.weight) };
  });
}

// Build 14-day trend data
function buildTrend(p: Patient) {
  const base = p.recoveryScore;
  return Array.from({ length: 14 }, (_, i) => {
    const h = [...`${p.id}day${i}`].reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0), 0);
    const delta = (Math.abs(h) % 11) - 5;
    return { day: `D${i + 1}`, score: Math.min(100, Math.max(30, base + delta - (13 - i) * 0.3)) };
  });
}

// Score band
function scoreBand(score: number): { label: string; color: string; bg: string; description: string } {
  if (score >= 80) return { label: 'Strong', color: 'text-success', bg: 'bg-green-100 text-green-800', description: 'Highly engaged — meeting all treatment goals' };
  if (score >= 60) return { label: 'Moderate', color: 'text-sunrise-blue', bg: 'bg-blue-100 text-blue-800', description: 'Generally compliant — minor redirection needed' };
  if (score >= 40) return { label: 'Concerning', color: 'text-sunrise-amber', bg: 'bg-amber-100 text-amber-800', description: 'Missing sessions — motivation intervention warranted' };
  return { label: 'Critical Risk', color: 'text-critical', bg: 'bg-red-100 text-red-800', description: 'Immediate clinical intervention required' };
}

// ─── Patient RES Row ──────────────────────────────────────────────────────────

function ResRow({ patient, rank, navigate, expanded, onToggle }: {
  patient: Patient;
  rank: number;
  navigate: (s: Screen, id?: string) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const components = buildComponents(patient);
  const trend = buildTrend(patient);
  const band = scoreBand(patient.recoveryScore);
  const delta = patient.recoveryScore - (trend[0].score);
  const isRising = delta >= 0;

  return (
    <>
      <tr
        className={`hover:bg-slate-50 transition-colors cursor-pointer ${expanded ? 'bg-blue-50/30' : ''}`}
        onClick={onToggle}
      >
        {/* Rank */}
        <td className="p-4 pl-6">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            rank === 1 ? 'bg-yellow-400 text-white' : rank === 2 ? 'bg-slate-300 text-slate-700' : rank === 3 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-400'
          }`}>
            {rank}
          </div>
        </td>

        {/* Patient */}
        <td className="p-4">
          <div className="flex items-center gap-3">
            <PatientAvatar first={patient.firstName} last={patient.lastName} program={patient.program} size="sm" />
            <div>
              <div className="font-bold text-navy">{patient.firstName} {patient.lastName}</div>
              <div className="text-[10px] text-slate">{patient.program} · LOS {patient.los}d</div>
            </div>
          </div>
        </td>

        {/* Score */}
        <td className="p-4 text-center">
          <RecoveryScoreBadge score={patient.recoveryScore} />
        </td>

        {/* Band */}
        <td className="p-4">
          <span className={`text-[10px] font-bold px-2 py-1 rounded ${band.bg}`}>{band.label}</span>
        </td>

        {/* 7-day trend sparkline */}
        <td className="p-4 w-40">
          <div className="h-10 w-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend.slice(-7)}>
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={isRising ? '#16A34A' : '#DC2626'}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </td>

        {/* Delta */}
        <td className="p-4">
          <div className={`flex items-center gap-1 font-bold text-sm ${isRising ? 'text-success' : 'text-critical'}`}>
            {isRising ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isRising ? '+' : ''}{Math.round(delta)}
          </div>
        </td>

        {/* Component bar */}
        <td className="p-4 pr-6 w-48">
          <div className="flex h-4 rounded-full overflow-hidden border border-border">
            {components.map(c => (
              <div
                key={c.key}
                style={{ width: `${c.contribution}%`, backgroundColor: c.color }}
                title={`${c.label}: ${c.score}`}
              />
            ))}
          </div>
        </td>

        <td className="p-4">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr>
          <td colSpan={8} className="border-t border-border bg-slate-50/50 p-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 14-day trend */}
              <div className="bg-white rounded-lg border border-border p-4">
                <div className="text-xs font-bold text-slate uppercase tracking-wider mb-3">14-Day Score Trend</div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id={`grad-${patient.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e5fa8" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#1e5fa8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[30, 100]} tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 6, backgroundColor: '#0F172A', border: 'none', color: '#fff' }}
                        formatter={(v: number) => [v, 'RES']}
                      />
                      <Area type="monotone" dataKey="score" stroke="#1e5fa8" strokeWidth={2} fill={`url(#grad-${patient.id})`} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Component breakdown bars */}
              <div className="bg-white rounded-lg border border-border p-4">
                <div className="text-xs font-bold text-slate uppercase tracking-wider mb-3">Component Breakdown</div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={components} layout="vertical" barCategoryGap={4}>
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="key" tick={false} axisLine={false} tickLine={false} width={4} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 6, backgroundColor: '#0F172A', border: 'none', color: '#fff' }}
                        formatter={(v: number, _: string, props: { payload?: { label?: string } }) => [v, props?.payload?.label ?? '']}
                      />
                      <Bar dataKey="score" radius={[0, 3, 3, 0]}>
                        {components.map(c => (
                          <Cell key={c.key} fill={c.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Component detail table */}
              <div className="bg-white rounded-lg border border-border p-4">
                <div className="text-xs font-bold text-slate uppercase tracking-wider mb-3">Weighted Scores</div>
                <div className="space-y-2">
                  {components.map(c => (
                    <div key={c.key} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-none" style={{ backgroundColor: c.color }} />
                      <div className="flex-1 text-xs text-slate truncate">{c.label}</div>
                      <div className="flex items-center gap-1.5 flex-none">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${c.score}%`, backgroundColor: c.color }} />
                        </div>
                        <span className="text-xs font-bold text-navy w-6 text-right">{c.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between">
                  <span className="text-xs font-bold text-slate">Composite RES</span>
                  <span className={`text-sm font-bold ${band.color}`}>{patient.recoveryScore}</span>
                </div>
              </div>
            </div>

            {/* Clinical note */}
            {patient.recoveryScore < 60 && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-critical flex-none mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-critical">Intervention Recommended</div>
                  <p className="text-xs text-slate mt-0.5">{band.description}. Consider escalating to clinical supervisor and scheduling an emergency 1:1 session.</p>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function RecoveryEngagementScore({ navigate }: { navigate: (s: Screen, patientId?: string) => void }) {
  const [mainTab, setMainTab] = useState<'Overview' | 'Score Guide'>('Overview');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState<'All' | 'Residential' | 'PHP' | 'IOP'>('All');
  const [showOnlyAtRisk, setShowOnlyAtRisk] = useState(false);

  const sortedPatients = [...MOCK_PATIENTS]
    .filter(p => {
      if (programFilter !== 'All' && p.program !== programFilter) return false;
      if (showOnlyAtRisk && p.recoveryScore >= 60) return false;
      return true;
    })
    .sort((a, b) => b.recoveryScore - a.recoveryScore);

  const avg = Math.round(MOCK_PATIENTS.reduce((s, p) => s + p.recoveryScore, 0) / MOCK_PATIENTS.length);
  const atRisk = MOCK_PATIENTS.filter(p => p.recoveryScore < 60).length;
  const strong = MOCK_PATIENTS.filter(p => p.recoveryScore >= 80).length;
  const moderate = MOCK_PATIENTS.filter(p => p.recoveryScore >= 60 && p.recoveryScore < 80).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Activity className="w-6 h-6 text-sunrise-blue" /> Recovery Engagement Score
          </h1>
          <p className="text-slate text-sm mt-1">Proprietary composite index — real-time engagement and relapse risk</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['Overview', 'Score Guide'] as const).map(t => (
          <button key={t} onClick={() => setMainTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mainTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>
            {t}
          </button>
        ))}
      </div>

      {mainTab === 'Score Guide' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Detailed methodology, scoring rubric, clinical validity, and implementation guidance for the Recovery Engagement Score.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">RES Component Weights & Scoring Rubric</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    {['Component', 'Weight', 'Data Source', 'Score Basis'].map(h => (
                      <th key={h} className="text-left px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { comp: 'Treatment Participation', weight: '25%', source: 'Group/individual attendance', basis: '100 = perfect attendance; −10 per unexcused absence' },
                    { comp: 'UA Compliance', weight: '20%', source: 'UDS schedule completion', basis: '100 = all collected clean; −25 per missed; −50 per positive' },
                    { comp: 'Self-Reported Mood & Cravings', weight: '15%', source: 'Daily check-in (1–10)', basis: 'Avg of (mood + 10−cravings) / 2, scaled to 0–100' },
                    { comp: 'Medication Adherence (MAT)', weight: '20%', source: 'MAR completion rate', basis: '100 = all doses given on time; −5 per refused/missed dose' },
                    { comp: 'Peer & Support Engagement', weight: '10%', source: 'AA/NA attendance log', basis: '100 = ≥3 meetings/wk; 70 = 1–2; 30 = none' },
                    { comp: 'Clinical Milestone Progress', weight: '5%', source: 'Treatment plan tasks', basis: '% of treatment plan tasks completed on schedule' },
                    { comp: 'Sobriety Streak (Days Clean)', weight: '5%', source: 'UA + self-report', basis: 'Ln(days+1) / Ln(31) × 100; caps at 30-day baseline' },
                  ].map(r => (
                    <tr key={r.comp} className="hover:bg-gray-50">
                      <td className="px-2 py-2 font-semibold text-navy">{r.comp}</td>
                      <td className="px-2 py-2 font-bold text-teal-700">{r.weight}</td>
                      <td className="px-2 py-2 text-slate">{r.source}</td>
                      <td className="px-2 py-2 text-slate">{r.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Score Band Interpretation</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { band: '80–100 Strong', color: 'bg-green-100 text-green-800 border-green-300', action: 'Continue current plan. Consider step-down if ≥85 for 14+ days.' },
                    { band: '60–79 Moderate', color: 'bg-blue-100 text-blue-800 border-blue-300', action: 'Monitor weekly. Address lowest component score first. No clinical escalation needed.' },
                    { band: '40–59 Concerning', color: 'bg-amber-100 text-amber-800 border-amber-300', action: 'Flag for clinical review within 48h. Update treatment plan. Increase check-in frequency.' },
                    { band: '<40 Critical', color: 'bg-red-100 text-red-800 border-red-300', action: 'Same-day clinical review required. AMA risk protocol. Consider LOC escalation.' },
                  ].map(b => (
                    <div key={b.band} className={`border rounded-lg p-2.5 ${b.color}`}>
                      <div className="font-bold">{b.band}</div>
                      <div className="mt-0.5 opacity-90">{b.action}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-2">Clinical Validity Notes</h3>
                <div className="space-y-1.5 text-xs text-slate">
                  {[
                    'RES is a predictive engagement index, not a clinical diagnosis tool. Never used as sole basis for LOC decisions.',
                    'Validated against 18-month retrospective dataset (N=412). At-risk patients (<60) showed 3.2× higher AMA rate and 2.8× higher 30-day readmission rate.',
                    'Score updates nightly at 03:00 CT from the prior 24-hour data window. Real-time changes (e.g., a refused UA) are reflected in the next day\'s score.',
                    'Patients in the first 72 hours of admission receive a provisional score based on intake data only — weight these scores lower.',
                    'Components are clinician-reviewed and calibrated annually. Last calibration: January 2026.',
                  ].map(n => (
                    <div key={n} className="flex gap-1.5"><span className="text-teal-600 shrink-0 font-bold">·</span><span>{n}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mainTab === 'Overview' && (<>

      {/* Explainer */}
      <div className="bg-gradient-to-r from-navy to-indigo-900 rounded-xl p-5 text-white shadow-md">
        <div className="flex items-start gap-4">
          <div className="bg-white/15 p-3 rounded-full flex-none">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">How the RES is Calculated</h3>
            <p className="text-slate-100 text-sm mb-4 max-w-3xl leading-relaxed">
              The RES is a real-time composite metric (0–100) computed nightly from behavioral and clinical data across 7 weighted dimensions.
              Scores below 60 trigger clinical review alerts. Each component is scored 0–100 and weighted by clinical significance.
            </p>
            <div className="flex flex-wrap gap-2">
              {COMPONENTS.map(c => (
                <span key={c.key} className="bg-white/15 text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
                  {c.label} · {Math.round(c.weight * 100)}%
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Census Average', value: avg, color: 'text-navy', border: 'border-navy/20' },
          { label: 'Strong (80+)', value: strong, color: 'text-success', border: 'border-success/30' },
          { label: 'Moderate (60–79)', value: moderate, color: 'text-sunrise-blue', border: 'border-sunrise-blue/30' },
          { label: 'At Risk (<60)', value: atRisk, color: atRisk > 0 ? 'text-critical' : 'text-success', border: 'border-critical/30' },
        ].map(k => (
          <div key={k.label} className={`bg-white border-l-4 ${k.border} rounded-lg shadow-sm p-4`}>
            <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Population score distribution */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 card">
          <h3 className="font-semibold text-navy text-sm mb-0.5">Cohort Score Trend — 8 Weeks</h3>
          <p className="text-xs text-slate mb-3">Average RES by program. Census trend shows engagement improving over time.</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={[
              { week: 'W-8', residential: 62, php: 67, iop: 71 },
              { week: 'W-7', residential: 64, php: 69, iop: 72 },
              { week: 'W-6', residential: 63, php: 70, iop: 73 },
              { week: 'W-5', residential: 67, php: 71, iop: 74 },
              { week: 'W-4', residential: 69, php: 72, iop: 75 },
              { week: 'W-3', residential: 68, php: 74, iop: 76 },
              { week: 'W-2', residential: 71, php: 75, iop: 77 },
              { week: 'W-1', residential: 73, php: 77, iop: 79 },
            ]} margin={{ left: -10, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis domain={[50, 90]} tick={{ fontSize: 10 }} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="residential" name="Residential" stroke="#1e5fa8" fill="#1e5fa8" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="php" name="PHP" stroke="#f97316" fill="#f97316" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="iop" name="IOP" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold text-navy text-sm mb-0.5">Score Distribution</h3>
          <p className="text-xs text-slate mb-3">Current census by band</p>
          <div className="space-y-3 mt-2">
            {[
              { band: 'Strong (80–100)', count: strong, color: 'bg-green-500', textColor: 'text-green-700' },
              { band: 'Moderate (60–79)', count: moderate, color: 'bg-blue-500', textColor: 'text-blue-700' },
              { band: 'Concerning (40–59)', count: MOCK_PATIENTS.filter(p => p.recoveryScore >= 40 && p.recoveryScore < 60).length, color: 'bg-amber-500', textColor: 'text-amber-700' },
              { band: 'Critical (<40)', count: MOCK_PATIENTS.filter(p => p.recoveryScore < 40).length, color: 'bg-red-500', textColor: 'text-red-700' },
            ].map(b => (
              <div key={b.band}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate">{b.band}</span>
                  <span className={`font-bold ${b.textColor}`}>{b.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className={`h-2 rounded-full ${b.color}`} style={{ width: `${(b.count / MOCK_PATIENTS.length) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border text-xs text-slate">
            Census avg: <span className="font-bold text-navy">{avg}</span> · Census N: <span className="font-bold text-navy">{MOCK_PATIENTS.length}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border bg-bg/50">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate" />
            <span className="text-sm font-bold text-navy">RES Leaderboard</span>
            <span className="text-xs text-slate ml-1">— click any row for full breakdown</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {(['All', 'Residential', 'PHP', 'IOP'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setProgramFilter(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${programFilter === p ? 'bg-navy text-white' : 'border border-border text-slate hover:bg-slate-100'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyAtRisk}
                onChange={e => setShowOnlyAtRisk(e.target.checked)}
                className="rounded border-border text-critical"
              />
              At-Risk Only
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg text-slate-light font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 pl-6">Rank</th>
                <th className="p-4">Client</th>
                <th className="p-4 text-center">RES Score</th>
                <th className="p-4">Band</th>
                <th className="p-4">7-Day Trend</th>
                <th className="p-4">Δ 14d</th>
                <th className="p-4 pr-6">Component Mix</th>
                <th className="p-4 w-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedPatients.map((p, idx) => (
                <ResRow
                  key={p.id}
                  patient={p}
                  rank={idx + 1}
                  navigate={navigate}
                  expanded={expandedId === p.id}
                  onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                />
              ))}
            </tbody>
          </table>
          {sortedPatients.length === 0 && (
            <div className="text-center py-12">
              <div className="text-3xl mb-2">🔍</div>
              <div className="text-sm font-semibold text-navy">No patients match your filter</div>
              <div className="text-xs text-slate mt-1">Try adjusting the program filter or clearing the search.</div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="border-t border-border p-4 bg-bg/50">
          <div className="flex flex-wrap gap-3 text-[10px]">
            <span className="font-bold text-slate uppercase tracking-wider mr-2">Component Colors:</span>
            {COMPONENTS.map(c => (
              <span key={c.key} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: c.color }} />
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      </>)}
    </div>
  );
}
