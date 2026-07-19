import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

// Derived analytics from MOCK_PATIENTS — substance prevalence derived from diagnoses
const SUBSTANCE_DATA = [
  { name: 'Opioids', value: 9 },
  { name: 'Alcohol', value: 7 },
  { name: 'Methamphetamine', value: 5 },
  { name: 'Cocaine/Crack', value: 4 },
  { name: 'Cannabis', value: 4 },
  { name: 'Benzodiazepines', value: 3 },
  { name: 'Polysubstance', value: 6 },
  { name: 'Nicotine', value: 11 },
];

const PROGRAM_DATA = [
  { program: 'Residential', count: MOCK_PATIENTS.filter(p => p.program === 'Residential').length, capacity: 10, color: '#E8761A' },
  { program: 'PHP',         count: MOCK_PATIENTS.filter(p => p.program === 'PHP').length,         capacity: 6,  color: '#3B9ED4' },
  { program: 'IOP',         count: MOCK_PATIENTS.filter(p => p.program === 'IOP').length,         capacity: 6,  color: '#2ECC71' },
];

const PAYER_MIX = [
  { name: 'Commercial',   value: 8,  color: '#3B9ED4' },
  { name: 'Medicaid',     value: 5,  color: '#E8761A' },
  { name: 'Medicare',     value: 2,  color: '#9B59B6' },
  { name: 'Self-Pay',     value: 2,  color: '#F39C12' },
  { name: 'Workers Comp', value: 1,  color: '#2ECC71' },
];

const DISCHARGE_DISPOSITION = [
  { name: 'Step-Down (lower level)', value: 7, color: '#2ECC71' },
  { name: 'Completed / AMA', value: 4, color: '#E8761A' },
  { name: 'Ongoing Same Level', value: 4, color: '#3B9ED4' },
  { name: 'Hospitalization', value: 2, color: '#E74C3C' },
  { name: 'Incarceration', value: 1, color: '#95a5a6' },
];

const LOS_DATA = [
  { range: '0–7 days',   count: 2, color: '#E74C3C' },
  { range: '8–14 days',  count: 4, color: '#E8761A' },
  { range: '15–21 days', count: 5, color: '#F39C12' },
  { range: '22–30 days', count: 6, color: '#2ECC71' },
  { range: '31–60 days', count: 5, color: '#3B9ED4' },
  { range: '60+ days',   count: 3, color: '#9B59B6' },
];

const CENSUS_30DAY = [
  { date: 'Jun 19', total: 16, residential: 7, php: 5, iop: 4 },
  { date: 'Jun 22', total: 17, residential: 8, php: 5, iop: 4 },
  { date: 'Jun 25', total: 19, residential: 9, php: 5, iop: 5 },
  { date: 'Jun 28', total: 18, residential: 8, php: 5, iop: 5 },
  { date: 'Jul 1',  total: 21, residential: 9, php: 6, iop: 6 },
  { date: 'Jul 4',  total: 20, residential: 9, php: 5, iop: 6 },
  { date: 'Jul 7',  total: 19, residential: 8, php: 5, iop: 6 },
  { date: 'Jul 10', total: 21, residential: 9, php: 6, iop: 6 },
  { date: 'Jul 13', total: 20, residential: 9, php: 5, iop: 6 },
  { date: 'Jul 16', total: 21, residential: 9, php: 6, iop: 6 },
  { date: 'Jul 19', total: 18, residential: 8, php: 5, iop: 5 },
];

const OUTCOME_TREND = [
  { month: 'Feb', completion: 68, followup: 72, ama: 14 },
  { month: 'Mar', completion: 71, followup: 75, ama: 12 },
  { month: 'Apr', completion: 74, followup: 76, ama: 11 },
  { month: 'May', completion: 76, followup: 78, ama: 10 },
  { month: 'Jun', completion: 79, followup: 80, ama: 9 },
  { month: 'Jul', completion: 81, followup: 82, ama: 8 },
];

const ASAM_DIMENSION_RADAR = [
  { dim: 'Withdrawal Risk (D1)', score: 2.3 },
  { dim: 'Biomedical (D2)', score: 1.8 },
  { dim: 'Psych/Emotional (D3)', score: 3.1 },
  { dim: 'Readiness (D4)', score: 2.6 },
  { dim: 'Relapse Risk (D5)', score: 3.4 },
  { dim: 'Recovery Env (D6)', score: 2.9 },
];

const RECOVERY_SCORE_DIST = [
  { range: '0–20 (Crisis)', count: 1 },
  { range: '21–40 (High Risk)', count: 3 },
  { range: '41–60 (Moderate)', count: 6 },
  { range: '61–80 (Good)', count: 7 },
  { range: '81–100 (Excellent)', count: 3 },
];

const COLORS = ['#E8761A', '#3B9ED4', '#2ECC71', '#9B59B6', '#F39C12', '#E74C3C', '#1ABC9C', '#95a5a6'];

export function PopulationAnalytics({ navigate }: Props) {
  const [period, setPeriod] = useState<'30D' | '60D' | '90D' | 'YTD'>('30D');

  const avgLOS = (MOCK_PATIENTS.reduce((a, p) => a + (p.los ?? 0), 0) / MOCK_PATIENTS.length).toFixed(1);
  const avgRecovery = Math.round(MOCK_PATIENTS.reduce((a, p) => a + (p.recoveryScore ?? 0), 0) / MOCK_PATIENTS.length);
  const avgCraving = (MOCK_PATIENTS.reduce((a, p) => a + (p.craving ?? 0), 0) / MOCK_PATIENTS.length).toFixed(1);
  const matCount = 10;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Population Analytics</h1>
          <p className="text-slate text-sm mt-0.5">Census trends, clinical outcomes, and program performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {(['30D', '60D', '90D', 'YTD'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-navy text-white' : 'border border-border text-slate hover:bg-gray-50'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Active Census', value: `${MOCK_PATIENTS.length}/22`, sub: `${Math.round(MOCK_PATIENTS.length/22*100)}% occupancy`, color: 'text-navy' },
          { label: 'Avg Length of Stay', value: `${avgLOS}d`, sub: 'Rolling 30-day avg', color: 'text-navy' },
          { label: 'Avg Recovery Score', value: `${avgRecovery}/100`, sub: 'Across all programs', color: avgRecovery >= 60 ? 'text-green-600' : 'text-amber-600' },
          { label: 'Avg Craving Score', value: `${avgCraving}/10`, sub: 'Lower is better', color: parseFloat(avgCraving) <= 5 ? 'text-green-600' : 'text-amber-600' },
          { label: 'On MAT', value: matCount, sub: `${Math.round(matCount/MOCK_PATIENTS.length*100)}% of census`, color: 'text-navy' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Census Trend + Program Census */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 card">
          <h3 className="font-semibold text-navy text-sm mb-0.5">30-Day Census Trend by Program</h3>
          <p className="text-xs text-slate mb-4">Daily patient counts across all levels of care</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={CENSUS_30DAY} margin={{ left: -20, right: 8, top: 4 }}>
              <defs>
                {[{ key: 'residential', color: '#E8761A' }, { key: 'php', color: '#3B9ED4' }, { key: 'iop', color: '#2ECC71' }].map(({ key, color }) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 22]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="residential" stroke="#E8761A" fill="url(#grad-residential)" strokeWidth={2} name="Residential" />
              <Area type="monotone" dataKey="php" stroke="#3B9ED4" fill="url(#grad-php)" strokeWidth={2} name="PHP" />
              <Area type="monotone" dataKey="iop" stroke="#2ECC71" fill="url(#grad-iop)" strokeWidth={2} name="IOP" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-navy text-sm mb-0.5">Current Census by Program</h3>
          <p className="text-xs text-slate mb-4">Active census vs. capacity</p>
          <div className="space-y-4">
            {PROGRAM_DATA.map(p => (
              <div key={p.program}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-navy">{p.program}</span>
                  <span className="text-xs text-slate font-semibold">{p.count}/{p.capacity} <span className="text-[10px]">({Math.round(p.count/p.capacity*100)}%)</span></span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="h-3 rounded-full" style={{ width: `${p.count/p.capacity*100}%`, backgroundColor: p.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-xs">
              <span className="text-slate">Total capacity</span>
              <span className="font-semibold text-navy">22 beds</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-slate">Occupancy rate</span>
              <span className="font-semibold text-green-600">{Math.round(MOCK_PATIENTS.length/22*100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Substance Use + Payer Mix */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-navy text-sm mb-0.5">Substance Use Prevalence</h3>
          <p className="text-xs text-slate mb-4">Current census — active substances at admission</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={SUBSTANCE_DATA} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={90} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Patients">
                {SUBSTANCE_DATA.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-navy text-sm mb-0.5">Payer Mix</h3>
          <p className="text-xs text-slate mb-4">Current census insurance distribution</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={PAYER_MIX} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                  {PAYER_MIX.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Patients']} contentStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {PAYER_MIX.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-slate flex-1">{p.name}</span>
                  <span className="text-xs font-semibold text-navy">{p.value}</span>
                  <span className="text-[10px] text-slate w-8 text-right">{Math.round(p.value/MOCK_PATIENTS.length*100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Outcomes + LOS Distribution */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-navy text-sm mb-0.5">Outcome Trends (6 Months)</h3>
          <p className="text-xs text-slate mb-4">Completion rate, 30-day follow-up, and AMA rate</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={OUTCOME_TREND} margin={{ left: -20, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`${v}%`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="completion" stroke="#2ECC71" strokeWidth={2} dot={{ r: 3 }} name="Completion %" />
              <Line type="monotone" dataKey="followup" stroke="#3B9ED4" strokeWidth={2} dot={{ r: 3 }} name="30-Day Follow-up %" />
              <Line type="monotone" dataKey="ama" stroke="#E74C3C" strokeWidth={2} dot={{ r: 3 }} name="AMA Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-navy text-sm mb-0.5">Length of Stay Distribution</h3>
          <p className="text-xs text-slate mb-4">All current patients</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={LOS_DATA} margin={{ left: -20, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [v, 'Patients']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Patients">
                {LOS_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: ASAM Radar + Recovery Score Distribution + Discharge Disposition */}
      <div className="grid grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-semibold text-navy text-sm mb-0.5">Avg ASAM Dimension Scores</h3>
          <p className="text-xs text-slate mb-2">Population average across all 6 ASAM dimensions (0–4 scale)</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={ASAM_DIMENSION_RADAR} cx="50%" cy="50%" outerRadius={70}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 8 }} />
              <Radar dataKey="score" stroke="#E8761A" fill="#E8761A" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [v.toFixed(1), 'Avg Score']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-navy text-sm mb-0.5">Recovery Score Distribution</h3>
          <p className="text-xs text-slate mb-3">Current census — composite recovery score bands</p>
          <div className="space-y-2.5">
            {RECOVERY_SCORE_DIST.map(r => (
              <div key={r.range}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate">{r.range}</span>
                  <span className="font-semibold text-navy">{r.count} pts</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-orange" style={{ width: `${r.count/MOCK_PATIENTS.length*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-navy text-sm mb-0.5">Discharge Disposition (YTD)</h3>
          <p className="text-xs text-slate mb-3">Where patients go after discharge</p>
          <div className="space-y-2">
            {DISCHARGE_DISPOSITION.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-slate flex-1">{d.name}</span>
                <span className="text-xs font-semibold text-navy">{d.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border text-xs text-slate">
            Total discharges YTD: <span className="font-bold text-navy">{DISCHARGE_DISPOSITION.reduce((a,d)=>a+d.value,0)}</span>
          </div>
        </div>
      </div>

      {/* Patient-level table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-navy text-sm">Current Census — Individual Analytics</h3>
          <span className="text-xs text-slate">{MOCK_PATIENTS.length} patients</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Patient', 'Program', 'LOS', 'Recovery Score', 'Craving', 'ASAM Level', 'MAT'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_PATIENTS.map(p => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <button className="font-medium text-navy hover:text-orange text-xs" onClick={() => navigate('PatientDetail', p.id)}>
                    {p.firstName} {p.lastName}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate">{p.program}</td>
                <td className="px-4 py-2.5 text-xs text-navy font-mono">{p.los ?? '—'}d</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${(p.recoveryScore ?? 0) >= 70 ? 'bg-green-500' : (p.recoveryScore ?? 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${p.recoveryScore ?? 0}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-navy">{p.recoveryScore ?? '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-semibold ${(p.craving ?? 5) <= 3 ? 'text-green-600' : (p.craving ?? 5) <= 6 ? 'text-amber-600' : 'text-red-600'}`}>{p.craving ?? '—'}/10</span>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate">{p.asam ? `${Math.max(p.asam.d1,p.asam.d2,p.asam.d3,p.asam.d4,p.asam.d5,p.asam.d6)}.x` : '—'}</td>
                <td className="px-4 py-2.5 text-xs">
                  {(['p1','p3','p4','p7','p11','p13','p15','p17','p19','p2'].includes(p.id))
                    ? <span className="text-green-600 font-medium">Yes</span>
                    : <span className="text-slate">No</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
