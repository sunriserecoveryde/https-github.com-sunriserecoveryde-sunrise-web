import React, { useState } from 'react';
import { Screen } from '../App';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Award, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

const ASAM_IMPROVEMENT = [
  { cohort: 'Jan 2026', d1: 3.1, d2: 2.8, d3: 2.2, d4: 2.6, d5: 1.9, d6: 2.7 },
  { cohort: 'Feb 2026', d1: 2.8, d2: 2.6, d3: 2.0, d4: 2.3, d5: 1.7, d6: 2.5 },
  { cohort: 'Mar 2026', d1: 2.6, d2: 2.4, d3: 1.9, d4: 2.1, d5: 1.6, d6: 2.3 },
  { cohort: 'Apr 2026', d1: 2.5, d2: 2.2, d3: 1.8, d4: 2.0, d5: 1.5, d6: 2.2 },
  { cohort: 'May 2026', d1: 2.3, d2: 2.0, d3: 1.6, d4: 1.8, d5: 1.3, d6: 2.0 },
  { cohort: 'Jun 2026', d1: 2.1, d2: 1.8, d3: 1.5, d4: 1.7, d5: 1.2, d6: 1.8 },
];

const READMISSION_DATA = [
  { month: 'Jan', rate: 14, benchmark: 18 },
  { month: 'Feb', rate: 16, benchmark: 18 },
  { month: 'Mar', rate: 12, benchmark: 18 },
  { month: 'Apr', rate: 11, benchmark: 18 },
  { month: 'May', rate: 13, benchmark: 18 },
  { month: 'Jun', rate: 10, benchmark: 18 },
  { month: 'Jul', rate: 9,  benchmark: 18 },
];

const SOBRIETY_DATA = [
  { period: '30 days', pct: 81 },
  { period: '60 days', pct: 72 },
  { period: '90 days', pct: 64 },
  { period: '6 months', pct: 55 },
  { period: '1 year',  pct: 44 },
];

const DISCHARGE_STATUS = [
  { name: 'Planned / Complete', value: 63, color: '#22c55e' },
  { name: 'AMA', value: 14, color: '#f59e0b' },
  { name: 'Administrative', value: 11, color: '#6366f1' },
  { name: 'Medical Transfer', value: 8,  color: '#3b82f6' },
  { name: 'Involuntary',     value: 4,  color: '#ef4444' },
];

const PATIENT_OUTCOMES = [
  { name: 'Marcus Webb',      mrn: 'MRN-83921', program: 'Residential', los: 38, dischargeDate: '2026-06-14', dischargeStatus: 'Planned', followUp30: 'Engaged', sobriety90: true,  php: true },
  { name: 'Samantha Choi',    mrn: 'MRN-74563', program: 'PHP',         los: 21, dischargeDate: '2026-06-28', dischargeStatus: 'Planned', followUp30: 'Engaged', sobriety90: true,  php: false },
  { name: 'James Thornton',   mrn: 'MRN-62841', program: 'Residential', los: 29, dischargeDate: '2026-05-30', dischargeStatus: 'AMA',     followUp30: 'No Contact', sobriety90: false, php: false },
  { name: 'Linda Farris',     mrn: 'MRN-39018', program: 'IOP',         los: 14, dischargeDate: '2026-06-07', dischargeStatus: 'Planned', followUp30: 'Engaged', sobriety90: null,  php: false },
  { name: 'Robert Navarro',   mrn: 'MRN-44782', program: 'Residential', los: 42, dischargeDate: '2026-06-22', dischargeStatus: 'Planned', followUp30: 'Engaged', sobriety90: true,  php: true },
  { name: 'Elena Vasquez',    mrn: 'MRN-28841', program: 'PHP',         los: 18, dischargeDate: '2026-07-03', dischargeStatus: 'Planned', followUp30: 'Partial', sobriety90: null,  php: false },
  { name: 'Devon Price',      mrn: 'MRN-90754', program: 'PHP',         los: 21, dischargeDate: '2026-06-18', dischargeStatus: 'Planned', followUp30: 'Engaged', sobriety90: true,  php: false },
  { name: 'Carol Sutton',     mrn: 'MRN-90622', program: 'Residential', los: 35, dischargeDate: '2026-05-20', dischargeStatus: 'Planned', followUp30: 'No Contact', sobriety90: false, php: false },
  { name: 'Priya Mehta',      mrn: 'MRN-90871', program: 'IOP',         los: 12, dischargeDate: '2026-07-08', dischargeStatus: 'Planned', followUp30: 'Engaged', sobriety90: null,  php: false },
];

const ASAM_DIMS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'] as const;
const DIM_LABELS: Record<string, string> = { d1: 'Withdrawal', d2: 'Biomedical', d3: 'Emotional', d4: 'Readiness', d5: 'Relapse', d6: 'Environment' };
const DIM_COLORS: Record<string, string> = { d1: '#ef4444', d2: '#f59e0b', d3: '#8b5cf6', d4: '#3b82f6', d5: '#22c55e', d6: '#f97316' };

const FUCOLOR: Record<string, string> = { Engaged: 'bg-green-100 text-green-700', 'No Contact': 'bg-red-100 text-red-700', Partial: 'bg-amber-100 text-amber-700' };

export function OutcomeTracking({ navigate: _navigate }: Props) {
  const [tab, setTab] = useState<'Overview' | 'ASAM Trends' | 'Sobriety' | 'Patients' | 'Benchmarks' | 'Program Comparison' | 'ROI Analysis'>('Overview');

  const plannedDischarge = PATIENT_OUTCOMES.filter(p => p.dischargeStatus === 'Planned').length;
  const engagedFollowup  = PATIENT_OUTCOMES.filter(p => p.followUp30 === 'Engaged').length;
  const sober90          = PATIENT_OUTCOMES.filter(p => p.sobriety90 === true).length;
  const phpContinuum     = PATIENT_OUTCOMES.filter(p => p.php).length;

  const TABS = ['Overview', 'ASAM Trends', 'Sobriety', 'Patients', 'Benchmarks', 'Program Comparison', 'ROI Analysis'] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sunrise-blue" /> Outcome Tracking
          </h1>
          <p className="text-slate text-sm mt-0.5">Post-discharge outcomes, readmission rates, and ASAM improvement trends — Jan–Jul 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-slate" />
          <span className="text-xs text-slate">Updated Jul 19, 2026</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Planned Discharge Rate', value: `${Math.round((plannedDischarge / PATIENT_OUTCOMES.length) * 100)}%`, sub: `${plannedDischarge} of ${PATIENT_OUTCOMES.length} discharges`, delta: '+6pp vs prior quarter', up: true, icon: Award },
          { label: '30-Day Follow-Up Engaged', value: `${Math.round((engagedFollowup / PATIENT_OUTCOMES.length) * 100)}%`, sub: `${engagedFollowup} of ${PATIENT_OUTCOMES.length} patients`, delta: '+8pp vs benchmark', up: true, icon: TrendingUp },
          { label: '90-Day Sobriety (verified)', value: `${Math.round((sober90 / PATIENT_OUTCOMES.filter(p => p.sobriety90 !== null).length) * 100)}%`, sub: `${sober90} of ${PATIENT_OUTCOMES.filter(p => p.sobriety90 !== null).length} respondents`, delta: '+3pp vs prior quarter', up: true, icon: Award },
          { label: 'Continuum Continuity (PHP)', value: `${Math.round((phpContinuum / PATIENT_OUTCOMES.length) * 100)}%`, sub: `${phpContinuum} step-down to PHP`, delta: 'Needs improvement', up: false, icon: AlertTriangle },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white border border-border rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-slate-400" />
                <div className="text-[10px] font-bold text-slate uppercase tracking-wider">{k.label}</div>
              </div>
              <div className="text-2xl font-bold text-navy">{k.value}</div>
              <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              <div className={`flex items-center gap-1 text-xs mt-1.5 font-medium ${k.up ? 'text-success' : 'text-sunrise-amber'}`}>
                {k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {k.delta}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-0">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-sunrise-orange text-navy' : 'border-transparent text-slate hover:text-navy'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-2 gap-5">
          {/* Readmission Rate */}
          <div className="bg-white border border-border rounded-xl shadow-sm p-4">
            <div className="font-semibold text-navy mb-1">30-Day Readmission Rate</div>
            <div className="text-xs text-slate mb-3">vs. 18% national benchmark (SAMHSA)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={READMISSION_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 25]} unit="%" />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <ReferenceLine y={18} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Benchmark 18%', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
                <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} name="Readmission %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Discharge Status */}
          <div className="bg-white border border-border rounded-xl shadow-sm p-4">
            <div className="font-semibold text-navy mb-1">Discharge Status Mix</div>
            <div className="text-xs text-slate mb-3">Last 180 days · N = 112 discharges</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={DISCHARGE_STATUS} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                  {DISCHARGE_STATUS.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Sobriety Retention */}
          <div className="bg-white border border-border rounded-xl shadow-sm p-4">
            <div className="font-semibold text-navy mb-1">Sobriety Retention Curve</div>
            <div className="text-xs text-slate mb-3">Self-reported + collateral · 2026 cohort</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SOBRIETY_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="pct" name="Sober %" radius={[4, 4, 0, 0]}>
                  {SOBRIETY_DATA.map((d, i) => (
                    <Cell key={i} fill={d.pct >= 65 ? '#22c55e' : d.pct >= 50 ? '#f59e0b' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stats */}
          <div className="bg-white border border-border rounded-xl shadow-sm p-4 space-y-3">
            <div className="font-semibold text-navy">Performance Benchmarks</div>
            {[
              { metric: 'Avg Length of Stay',        value: '28 days',  benchmark: '25–35 days', status: 'on-track' },
              { metric: 'AMA Rate',                  value: '14%',      benchmark: '< 20%',      status: 'on-track' },
              { metric: 'Aftercare Plan Complete',   value: '91%',      benchmark: '> 85%',      status: 'on-track' },
              { metric: 'Peer Support Engagement',   value: '76%',      benchmark: '> 70%',      status: 'on-track' },
              { metric: 'Family Contact at 30d',     value: '62%',      benchmark: '> 65%',      status: 'warning' },
              { metric: 'PHP Step-Down Rate',        value: '22%',      benchmark: '> 35%',      status: 'alert' },
              { metric: 'Employment at 90d',         value: '48%',      benchmark: '> 45%',      status: 'on-track' },
              { metric: 'Housing Stable at 90d',     value: '74%',      benchmark: '> 70%',      status: 'on-track' },
            ].map(b => (
              <div key={b.metric} className="flex items-center justify-between text-sm">
                <span className="text-slate">{b.metric}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{b.benchmark}</span>
                  <span className={`font-semibold ${b.status === 'on-track' ? 'text-success' : b.status === 'warning' ? 'text-sunrise-amber' : 'text-critical'}`}>
                    {b.value}
                  </span>
                  {b.status === 'on-track' ? <TrendingUp className="w-3.5 h-3.5 text-success" /> :
                   b.status === 'warning'  ? <Minus className="w-3.5 h-3.5 text-sunrise-amber" /> :
                                             <TrendingDown className="w-3.5 h-3.5 text-critical" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: ASAM Trends */}
      {tab === 'ASAM Trends' && (
        <div className="space-y-5">
          <div className="bg-white border border-border rounded-xl shadow-sm p-4">
            <div className="font-semibold text-navy mb-1">ASAM Dimension Severity at Admission</div>
            <div className="text-xs text-slate mb-4">Monthly cohort averages · Scale 0–4 · Lower is less severe / better</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={ASAM_IMPROVEMENT} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="cohort" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 4]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {ASAM_DIMS.map(d => (
                  <Line key={d} type="monotone" dataKey={d} name={`D${d.slice(1)} ${DIM_LABELS[d]}`} stroke={DIM_COLORS[d]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {ASAM_DIMS.map(d => {
              const first = ASAM_IMPROVEMENT[0][d as keyof typeof ASAM_IMPROVEMENT[0]] as number;
              const last  = ASAM_IMPROVEMENT[ASAM_IMPROVEMENT.length - 1][d as keyof typeof ASAM_IMPROVEMENT[0]] as number;
              const delta = (((first - last) / first) * 100).toFixed(0);
              return (
                <div key={d} className="bg-white border border-border rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: DIM_COLORS[d] }} />
                    <div className="text-xs font-bold text-slate uppercase tracking-wider">Dim {d.slice(1)} — {DIM_LABELS[d]}</div>
                  </div>
                  <div className="text-xl font-bold text-navy">{last.toFixed(1)} <span className="text-sm font-normal text-slate">avg severity</span></div>
                  <div className="text-xs text-success flex items-center gap-1 mt-1">
                    <TrendingDown className="w-3 h-3" /> {delta}% improvement since Jan
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Sobriety */}
      {tab === 'Sobriety' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white border border-border rounded-xl shadow-sm p-4">
            <div className="font-semibold text-navy mb-1">Sobriety Retention by Program</div>
            <div className="text-xs text-slate mb-4">Self-reported, verified by counselor at follow-up</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={[
                  { label: '30d', Residential: 86, PHP: 80, IOP: 74 },
                  { label: '60d', Residential: 78, PHP: 70, IOP: 61 },
                  { label: '90d', Residential: 69, PHP: 60, IOP: 52 },
                  { label: '180d', Residential: 58, PHP: 50, IOP: 42 },
                  { label: '1yr', Residential: 46, PHP: 40, IOP: 33 },
                ]}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Residential" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Residential" />
                <Bar dataKey="PHP"         fill="#8b5cf6" radius={[3, 3, 0, 0]} name="PHP" />
                <Bar dataKey="IOP"         fill="#22c55e" radius={[3, 3, 0, 0]} name="IOP" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border border-border rounded-xl shadow-sm p-4 space-y-3">
            <div className="font-semibold text-navy">Contributing Factors Analysis</div>
            <div className="text-xs text-slate">Correlation with 90-day sobriety (regression-adjusted)</div>
            <div className="space-y-2 pt-1">
              {[
                { factor: 'Aftercare plan completed', pct: 88, positive: true },
                { factor: 'AA/NA meeting attendance', pct: 78, positive: true },
                { factor: 'Stable housing at discharge', pct: 74, positive: true },
                { factor: 'Employment within 30 days', pct: 66, positive: true },
                { factor: 'Family involvement in treatment', pct: 62, positive: true },
                { factor: 'Sober living placement', pct: 58, positive: true },
                { factor: 'AMA discharge', pct: 12, positive: false },
                { factor: 'Co-occurring untreated', pct: 19, positive: false },
              ].map(f => (
                <div key={f.factor} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={f.positive ? 'text-navy' : 'text-critical'}>{f.factor}</span>
                    <span className={`font-semibold ${f.positive ? 'text-success' : 'text-critical'}`}>{f.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full">
                    <div className={`h-1.5 rounded-full ${f.positive ? 'bg-success' : 'bg-critical'}`} style={{ width: `${f.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Patients */}
      {tab === 'Patients' && (
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="font-semibold text-navy">Recent Discharge Outcomes</div>
            <div className="text-xs text-slate mt-0.5">90-day follow-up tracking · Contact attempted at 7, 30, and 90 days</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg">
                <tr>
                  {['Patient', 'Program', 'LOS', 'Discharge', 'Status', '30d Follow-Up', '90d Sober', 'PHP Step-Down'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PATIENT_OUTCOMES.map(p => (
                  <tr key={p.mrn} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-navy text-sm">{p.name}</div>
                      <div className="text-[10px] text-slate font-mono">{p.mrn}</div>
                    </td>
                    <td className="px-4 py-2.5"><span className="text-xs font-semibold bg-slate-100 text-slate px-2 py-0.5 rounded">{p.program}</span></td>
                    <td className="px-4 py-2.5 font-medium text-navy">{p.los}d</td>
                    <td className="px-4 py-2.5 text-xs text-slate">{p.dischargeDate}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${p.dischargeStatus === 'Planned' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.dischargeStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${FUCOLOR[p.followUp30] ?? ''}`}>{p.followUp30}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {p.sobriety90 === null
                        ? <span className="text-xs text-slate">Pending</span>
                        : p.sobriety90
                          ? <span className="text-xs font-semibold text-success">✓ Yes</span>
                          : <span className="text-xs font-semibold text-critical">✗ No</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {p.php
                        ? <span className="text-xs font-semibold text-success">✓ Yes</span>
                        : <span className="text-xs text-slate">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Tab: Benchmarks */}
      {tab === 'Benchmarks' && (
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>Benchmark sources:</strong> SAMHSA National Survey on Drug Use and Health (NSDUH) 2024; ASAM 2025 Quality in Addiction Treatment Report; State Behavioral Health benchmarks (Q1 2026).
          </div>

          {/* Benchmark comparison table */}
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-bg">
              <div className="font-semibold text-navy">Key Outcome Metrics vs. National & State Benchmarks</div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  {['Metric', 'Our Facility', 'State Average', 'National Average', 'ASAM Best Practice', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { metric: 'Planned Discharge Rate',      us: '77%',  state: '68%',  national: '65%',  best: '≥ 75%',  status: 'above' },
                  { metric: '30-Day Readmission Rate',     us: '9%',   state: '16%',  national: '18%',  best: '< 12%',  status: 'above' },
                  { metric: '30-Day Follow-Up Engagement', us: '82%',  state: '71%',  national: '68%',  best: '≥ 80%',  status: 'above' },
                  { metric: '90-Day Sobriety (verified)',  us: '64%',  state: '57%',  national: '54%',  best: '≥ 60%',  status: 'above' },
                  { metric: '1-Year Sobriety Rate',        us: '44%',  state: '39%',  national: '37%',  best: '≥ 40%',  status: 'above' },
                  { metric: 'Step-Down Continuum Rate',    us: '31%',  state: '42%',  national: '38%',  best: '≥ 50%',  status: 'below' },
                  { metric: 'AMA Rate',                    us: '14%',  state: '18%',  national: '21%',  best: '< 15%',  status: 'above' },
                  { metric: 'LOS Avg (Residential)',       us: '32d',  state: '28d',  national: '25d',  best: '28–35d', status: 'on-track' },
                  { metric: 'Family Involvement Rate',     us: '58%',  state: '52%',  national: '48%',  best: '≥ 60%',  status: 'near' },
                  { metric: 'MAT Utilization (OUD)',       us: '89%',  state: '76%',  national: '72%',  best: '≥ 85%',  status: 'above' },
                ].map(row => (
                  <tr key={row.metric} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-navy">{row.metric}</td>
                    <td className="px-4 py-2.5 font-bold text-navy">{row.us}</td>
                    <td className="px-4 py-2.5 text-slate">{row.state}</td>
                    <td className="px-4 py-2.5 text-slate">{row.national}</td>
                    <td className="px-4 py-2.5 text-slate font-mono text-xs">{row.best}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        row.status === 'above' ? 'bg-green-100 text-green-700' :
                        row.status === 'below' ? 'bg-red-100 text-red-700' :
                        row.status === 'near'  ? 'bg-amber-100 text-amber-700' :
                                                  'bg-blue-100 text-blue-700'
                      }`}>
                        {row.status === 'above' ? '✓ Above Benchmark' : row.status === 'below' ? '⚠ Below Benchmark' : row.status === 'near' ? '◐ Near Target' : '→ On Track'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payer Mix vs. Outcomes */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white border border-border rounded-xl shadow-sm p-4">
              <div className="font-semibold text-navy mb-1">JCAHO / CARF Accreditation Standards</div>
              <div className="text-xs text-slate mb-3">Compliance with accreditation quality indicators</div>
              <div className="space-y-2.5">
                {[
                  { standard: 'Patient Rights Documentation', status: 'Compliant', pct: 100 },
                  { standard: 'Individualized Treatment Plans', status: 'Compliant', pct: 98 },
                  { standard: 'Medication Error Rate < 0.5%', status: 'Compliant', pct: 96 },
                  { standard: 'Staff Training Hours (annual)', status: 'Near Target', pct: 87 },
                  { standard: '72h Discharge Follow-Up', status: 'Improvement Needed', pct: 71 },
                  { standard: 'Family Involvement Documentation', status: 'Near Target', pct: 84 },
                ].map(s => (
                  <div key={s.standard}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-navy font-medium">{s.standard}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        s.status === 'Compliant' ? 'bg-green-100 text-green-700' :
                        s.status === 'Near Target' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>{s.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-full rounded-full ${s.pct >= 95 ? 'bg-success' : s.pct >= 80 ? 'bg-sunrise-amber' : 'bg-critical'}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-border rounded-xl shadow-sm p-4">
              <div className="font-semibold text-navy mb-1">Outcome Trend vs. State Benchmark</div>
              <div className="text-xs text-slate mb-3">Rolling 6-month planned discharge rate</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={[
                  { month: 'Feb', us: 68, state: 67 },
                  { month: 'Mar', us: 71, state: 67 },
                  { month: 'Apr', us: 73, state: 68 },
                  { month: 'May', us: 74, state: 68 },
                  { month: 'Jun', us: 75, state: 68 },
                  { month: 'Jul', us: 77, state: 68 },
                ]} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[60, 85]} unit="%" />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Line type="monotone" dataKey="us" name="Our Facility" stroke="#1e5fa8" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="state" name="State Average" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Program Comparison' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Performance comparison across Residential, PHP, and IOP programs — completion rates, avg LOS, sobriety outcomes, and readmission rates.</div>
          <div className="grid grid-cols-3 gap-5">
            {[
              {
                program: 'Residential (3.5)',
                census: 12, capacity: 16,
                avgLOS: 28, targetLOS: '21–35d',
                completion: 76, benchmark: 75,
                sobriety90: 62, readmit30: 14,
                avgAsam: 4.1, matPct: 65,
                color: 'border-l-blue-500',
              },
              {
                program: 'PHP (2.5)',
                census: 5, capacity: 8,
                avgLOS: 21, targetLOS: '14–28d',
                completion: 82, benchmark: 78,
                sobriety90: 68, readmit30: 10,
                avgAsam: 3.2, matPct: 40,
                color: 'border-l-teal-500',
              },
              {
                program: 'IOP (2.1)',
                census: 3, capacity: 12,
                avgLOS: 45, targetLOS: '30–60d',
                completion: 71, benchmark: 72,
                sobriety90: 55, readmit30: 18,
                avgAsam: 2.4, matPct: 25,
                color: 'border-l-purple-500',
              },
            ].map(p => (
              <div key={p.program} className={`bg-white border border-border border-l-4 ${p.color} rounded-xl shadow-sm p-5`}>
                <h3 className="font-bold text-navy text-sm mb-4">{p.program}</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-slate">Census / Capacity</span>
                    <span className="font-bold text-navy">{p.census} / {p.capacity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate">Avg LOS (target: {p.targetLOS})</span>
                    <span className={`font-bold ${p.avgLOS <= 35 ? 'text-green-600' : 'text-amber-600'}`}>{p.avgLOS}d</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate">Completion Rate (benchmark: {p.benchmark}%)</span>
                    <span className={`font-bold ${p.completion >= p.benchmark ? 'text-green-600' : 'text-amber-600'}`}>{p.completion}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate">90-Day Sobriety</span>
                    <span className={`font-bold ${p.sobriety90 >= 60 ? 'text-green-600' : 'text-amber-600'}`}>{p.sobriety90}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate">30-Day Readmission</span>
                    <span className={`font-bold ${p.readmit30 <= 15 ? 'text-green-600' : 'text-red-600'}`}>{p.readmit30}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate">Avg ASAM Dimension Score</span>
                    <span className="font-bold text-navy">{p.avgAsam}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-2">
                    <span className="text-slate">On MAT</span>
                    <span className="font-bold text-navy">{p.matPct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Program Performance vs. National Benchmarks (2026)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-bg text-slate">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Metric</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Residential</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">PHP</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">IOP</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">National Avg</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">CARF Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { metric: 'Treatment Completion Rate', res: '76%', php: '82%', iop: '71%', nat: '74%', carf: '≥75%' },
                    { metric: '30-Day Readmission', res: '14%', php: '10%', iop: '18%', nat: '17%', carf: '≤20%' },
                    { metric: '90-Day Sobriety (self-report)', res: '62%', php: '68%', iop: '55%', nat: '58%', carf: '≥55%' },
                    { metric: '30-Day Follow-up Engagement', res: '79%', php: '85%', iop: '67%', nat: '71%', carf: '≥70%' },
                    { metric: 'Patient Satisfaction (ECHO)', res: '4.4/5', php: '4.6/5', iop: '4.2/5', nat: '4.1/5', carf: '≥4.0/5' },
                    { metric: 'Avg Days to Admission from Waitlist', res: '4.2d', php: '2.8d', iop: '1.5d', nat: '6.1d', carf: '≤7d' },
                    { metric: 'AMA / Self-Discharge Rate', res: '18%', php: '12%', iop: '22%', nat: '20%', carf: '≤25%' },
                  ].map(r => (
                    <tr key={r.metric} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-navy">{r.metric}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-navy">{r.res}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-navy">{r.php}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-navy">{r.iop}</td>
                      <td className="px-3 py-2.5 text-center text-slate">{r.nat}</td>
                      <td className="px-3 py-2.5 text-center text-blue-600 font-medium">{r.carf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'ROI Analysis' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Treatment ROI modeling — healthcare cost offsets, productivity gains, criminal justice savings, and lifetime value of recovery for the Sunrise patient population.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Est. Healthcare Cost Savings/Patient', value: '$28K', color: 'text-green-600', sub: 'Yr 1 post-treatment vs baseline' },
              { label: 'ER Visit Reduction', value: '61%', color: 'text-teal-600', sub: 'Pre-tx avg 4.8 → post-tx 1.9/yr' },
              { label: 'Criminal Justice Cost Offset', value: '$14K', color: 'text-blue-600', sub: 'Per patient, justice-involved cohort' },
              { label: 'Employment Rate at 12 Months', value: '58%', color: 'text-navy', sub: 'Up from 22% at admission' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Social Cost Offset by LOC — Per Completed Episode</h3>
              <div className="space-y-2 text-xs">
                {[
                  { loc: 'Residential (28-day)', cost: '$18,200', offset: '$52,400', roi: '2.9×', color: 'bg-green-500' },
                  { loc: 'PHP (14-day)', cost: '$6,800', offset: '$18,900', roi: '2.8×', color: 'bg-blue-500' },
                  { loc: 'IOP (8-week)', cost: '$3,400', offset: '$11,200', roi: '3.3×', color: 'bg-teal-500' },
                  { loc: 'Full Continuum (all LOCs)', cost: '$28,400', offset: '$82,500', roi: '2.9×', color: 'bg-navy' },
                ].map(r => (
                  <div key={r.loc} className="border border-border rounded p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-navy">{r.loc}</span>
                      <span className="font-bold text-lg text-green-600">{r.roi} ROI</span>
                    </div>
                    <div className="flex gap-6 text-slate text-[10px]">
                      <span>Program cost: <strong className="text-navy">{r.cost}</strong></span>
                      <span>Social cost offset: <strong className="text-green-600">{r.offset}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Cost Offset Category Breakdown (Per Patient, Yr 1)</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { cat: 'Emergency Department utilization', amt: '$12,400', pct: 40, color: 'bg-red-400' },
                  { cat: 'Inpatient hospitalization', amt: '$8,200', pct: 26, color: 'bg-orange-400' },
                  { cat: 'Criminal justice / incarceration', amt: '$5,600', pct: 18, color: 'bg-purple-500' },
                  { cat: 'Productivity / workforce recovery', amt: '$4,100', pct: 13, color: 'bg-green-500' },
                  { cat: 'Child welfare / DCFS involvement', amt: '$900', pct: 3, color: 'bg-amber-500' },
                ].map(c => (
                  <div key={c.cat}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate">{c.cat}</span>
                      <span className="font-semibold text-navy">{c.amt}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${c.color}`} style={{ width: `${c.pct * 2.2}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded-lg text-[10px] text-green-800">
                <strong>Total Yr-1 Social Cost Offset (est.):</strong> $31,200 per completed treatment episode — source: SAMHSA Economic Burden of Substance Use Disorders, 2024 update, adjusted for TN cost-of-living index.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
