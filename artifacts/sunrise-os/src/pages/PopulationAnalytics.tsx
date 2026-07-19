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

const AGE_DISTRIBUTION = [
  { range: '18–24', count: 2 },
  { range: '25–34', count: 6 },
  { range: '35–44', count: 7 },
  { range: '45–54', count: 5 },
  { range: '55–64', count: 3 },
  { range: '65+',   count: 1 },
];

const GENDER_DATA = [
  { name: 'Male',        value: 13, color: '#3B9ED4' },
  { name: 'Female',      value: 10, color: '#E8761A' },
  { name: 'Non-Binary',  value: 1,  color: '#9B59B6' },
];

const REFERRAL_SOURCES = [
  { source: 'Emergency Room',        count: 5 },
  { source: 'Physician Referral',    count: 4 },
  { source: 'Self / Family',         count: 4 },
  { source: 'Drug Court / Legal',    count: 3 },
  { source: 'Prior Treatment Ctr',   count: 3 },
  { source: 'EAP / Employer',        count: 2 },
  { source: 'Insurance Case Mgmt',   count: 2 },
  { source: 'Peer / Community',      count: 1 },
];

const CO_OCCURRING = [
  { condition: 'Major Depression', count: 9 },
  { condition: 'Anxiety Disorders', count: 8 },
  { condition: 'PTSD', count: 6 },
  { condition: 'BPD', count: 3 },
  { condition: 'Bipolar Disorder', count: 4 },
  { condition: 'ADHD', count: 5 },
  { condition: 'Eating Disorder', count: 2 },
  { condition: 'Psychotic Disorder', count: 2 },
];

const EMPLOYMENT_STATUS = [
  { status: 'Employed (on leave)',  value: 8,  color: '#3B9ED4' },
  { status: 'Unemployed',           value: 7,  color: '#E8761A' },
  { status: 'Disability / SSDI',    value: 3,  color: '#9B59B6' },
  { status: 'Student',              value: 2,  color: '#2ECC71' },
  { status: 'Retired',              value: 2,  color: '#95a5a6' },
  { status: 'Unknown',              value: 2,  color: '#F39C12' },
];

const HOUSING_AT_ADMIT = [
  { type: 'Private Residence',  value: 11, color: '#2ECC71' },
  { type: 'Family / Friends',   value: 5,  color: '#3B9ED4' },
  { type: 'Homeless / Shelter', value: 3,  color: '#E74C3C' },
  { type: 'Sober Living',       value: 2,  color: '#9B59B6' },
  { type: 'Incarcerated/Jail',  value: 2,  color: '#95a5a6' },
  { type: 'Other',              value: 1,  color: '#F39C12' },
];

export function PopulationAnalytics({ navigate }: Props) {
  const [period, setPeriod] = useState<'30D' | '60D' | '90D' | 'YTD'>('30D');
  const [paTab, setPaTab] = useState<'Analytics' | 'Social Determinants' | 'Equity' | 'Payer Mix' | 'Predictive Risk' | 'Geographic Reach'>('Analytics');

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

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['Analytics', 'Social Determinants', 'Equity', 'Payer Mix', 'Predictive Risk', 'Geographic Reach'] as const).map(t => (
          <button key={t} onClick={() => setPaTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${paTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {paTab === 'Social Determinants' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Social determinants of health (SDOH) across the current patient census — housing, employment, food security, insurance, and social support.</div>
          <div className="grid grid-cols-3 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Housing Status at Admission</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Private Residence (owned/rented)', n: 11, pct: 55, color: 'bg-green-500' },
                  { label: 'Family or Friends', n: 5, pct: 25, color: 'bg-blue-400' },
                  { label: 'Homeless / Emergency Shelter', n: 3, pct: 15, color: 'bg-red-500' },
                  { label: 'Sober Living / Recovery Home', n: 2, pct: 10, color: 'bg-purple-400' },
                  { label: 'Incarcerated / Jail', n: 1, pct: 5, color: 'bg-gray-400' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate">{r.label}</span><span className="font-bold text-navy">{r.n} ({r.pct}%)</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full"><div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Employment & Income</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Employed Full-Time', n: 8, pct: 40, color: 'bg-green-500' },
                  { label: 'Employed Part-Time', n: 3, pct: 15, color: 'bg-teal-400' },
                  { label: 'Unemployed (seeking)', n: 5, pct: 25, color: 'bg-amber-400' },
                  { label: 'Disability / SSI / SSDI', n: 2, pct: 10, color: 'bg-blue-400' },
                  { label: 'Student', n: 1, pct: 5, color: 'bg-purple-400' },
                  { label: 'Other / Unknown', n: 1, pct: 5, color: 'bg-gray-400' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate">{r.label}</span><span className="font-bold text-navy">{r.n} ({r.pct}%)</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full"><div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Social Support & Insurance</h3>
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate uppercase">Social Support</div>
                {[
                  { label: 'Strong family support', n: 9, pct: 45, color: 'bg-green-500' },
                  { label: 'Limited support', n: 7, pct: 35, color: 'bg-amber-400' },
                  { label: 'Isolated / No support', n: 4, pct: 20, color: 'bg-red-500' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate">{r.label}</span><span className="font-bold text-navy">{r.n} ({r.pct}%)</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full"><div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} /></div>
                  </div>
                ))}
                <div className="text-xs font-semibold text-slate uppercase mt-2">Insurance Type</div>
                {[
                  { label: 'Commercial / Private', n: 12, pct: 60, color: 'bg-blue-500' },
                  { label: 'Medicaid (TennCare)', n: 4, pct: 20, color: 'bg-teal-400' },
                  { label: 'Self-Pay / Uninsured', n: 3, pct: 15, color: 'bg-amber-400' },
                  { label: 'Medicare', n: 1, pct: 5, color: 'bg-purple-400' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate">{r.label}</span><span className="font-bold text-navy">{r.n} ({r.pct}%)</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full"><div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Criminal Justice Involvement & Legal History</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                { label: 'Current Probation/Parole', value: '4 (20%)', color: 'text-amber-600' },
                { label: 'Court-Mandated Treatment', value: '3 (15%)', color: 'text-amber-600' },
                { label: 'Prior Incarceration', value: '7 (35%)', color: 'text-navy' },
                { label: 'Drug Court Participants', value: '2 (10%)', color: 'text-navy' },
              ].map(k => (
                <div key={k.label} className="bg-gray-50 rounded-xl p-3">
                  <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
                  <div className="text-xs text-slate mt-1">{k.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {paTab === 'Equity' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Health equity indicators — demographic breakdown, disparity flags, and access metrics to support CARF and SAMHSA equity standards.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Race / Ethnicity — Current Census</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'White / Non-Hispanic', n: 12, pct: 60, color: 'bg-blue-500' },
                  { label: 'Black or African American', n: 4, pct: 20, color: 'bg-purple-500' },
                  { label: 'Hispanic or Latino', n: 2, pct: 10, color: 'bg-teal-500' },
                  { label: 'Asian', n: 1, pct: 5, color: 'bg-green-500' },
                  { label: 'Multiracial', n: 1, pct: 5, color: 'bg-amber-400' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate">{r.label}</span><span className="font-bold text-navy">{r.n} ({r.pct}%)</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full"><div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Gender & Age Distribution</h3>
              <div className="space-y-2.5 mb-4">
                {[
                  { label: 'Male', n: 12, pct: 60, color: 'bg-blue-500' },
                  { label: 'Female', n: 7, pct: 35, color: 'bg-pink-400' },
                  { label: 'Non-binary / Other', n: 1, pct: 5, color: 'bg-purple-400' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate">{r.label}</span><span className="font-bold text-navy">{r.n} ({r.pct}%)</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full"><div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="text-xs font-semibold text-slate uppercase mb-2">Age Range</div>
              <div className="space-y-2">
                {[
                  { label: '18–25', n: 3, pct: 15, color: 'bg-green-400' },
                  { label: '26–35', n: 7, pct: 35, color: 'bg-blue-400' },
                  { label: '36–45', n: 6, pct: 30, color: 'bg-purple-400' },
                  { label: '46–55', n: 3, pct: 15, color: 'bg-amber-400' },
                  { label: '56+', n: 1, pct: 5, color: 'bg-gray-400' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate">{r.label}</span><span className="font-bold text-navy">{r.n} ({r.pct}%)</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full"><div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Equity Access Indicators</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {[
                { metric: 'Patients with interpreter services needed', value: '2 (10%)', benchmark: 'State avg: 8%', flag: false },
                { metric: 'Patients reporting transportation barrier', value: '5 (25%)', benchmark: 'State avg: 19%', flag: true },
                { metric: 'Uninsured / Self-pay patients', value: '3 (15%)', benchmark: 'Target: ≤15%', flag: false },
                { metric: 'Patients from rural zip codes', value: '4 (20%)', benchmark: 'TN rural avg: 35%', flag: false },
                { metric: 'Patients with veteran status', value: '3 (15%)', benchmark: 'VA coverage: active', flag: false },
                { metric: 'Patients with DOJ / drug court mandate', value: '3 (15%)', benchmark: 'CARF equity flag: documented', flag: false },
                { metric: 'Patients declined for capacity (waitlisted)', value: '9 active waitlist', benchmark: 'Reviewed for equity weekly', flag: false },
                { metric: 'Spanish-speaking patients (primary)', value: '2 (10%)', benchmark: 'Spanish-language materials: available', flag: false },
              ].map(r => (
                <div key={r.metric} className={`p-3 border rounded-lg ${r.flag ? 'border-amber-300 bg-amber-50/30' : 'border-border'}`}>
                  <div className="font-semibold text-navy">{r.metric}</div>
                  <div className={`font-bold mt-0.5 ${r.flag ? 'text-amber-600' : 'text-navy'}`}>{r.value}</div>
                  <div className="text-slate mt-0.5">{r.benchmark}{r.flag && ' ⚠️ Above benchmark'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {paTab === 'Analytics' && (
      <div className="space-y-6">
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

      {/* Demographics Section */}
      <div>
        <h2 className="text-base font-semibold text-navy mb-3 flex items-center gap-2">
          <span className="text-xl">👥</span> Population Demographics &amp; Social Determinants
        </h2>
        <div className="grid grid-cols-3 gap-5">

          {/* Age Distribution */}
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-0.5">Age Distribution</h3>
            <p className="text-xs text-slate mb-3">Current census</p>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={AGE_DISTRIBUTION} margin={{ left: -20, right: 4, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" name="Patients" fill="#3B9ED4" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-slate mt-2 text-center">Median age: <span className="font-semibold text-navy">38</span></div>
          </div>

          {/* Gender + Employment */}
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-0.5">Gender Identity</h3>
            <p className="text-xs text-slate mb-1">Current census</p>
            <div className="flex items-center gap-4">
              <div style={{ width: 110, height: 110 }}>
                <PieChart width={110} height={110}>
                  <Pie data={GENDER_DATA} cx={50} cy={50} outerRadius={48} dataKey="value" strokeWidth={1}>
                    {GENDER_DATA.map((g, i) => <Cell key={i} fill={g.color} />)}
                  </Pie>
                </PieChart>
              </div>
              <div className="space-y-1.5">
                {GENDER_DATA.map(g => (
                  <div key={g.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: g.color }} />
                    <span className="text-xs text-slate">{g.name}</span>
                    <span className="text-xs font-bold text-navy ml-auto">{g.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Employment Status</div>
              <div className="space-y-1">
                {EMPLOYMENT_STATUS.map(e => (
                  <div key={e.status} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                    <span className="text-slate flex-1">{e.status}</span>
                    <span className="font-semibold text-navy">{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Housing at Admission */}
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-0.5">Housing at Admission</h3>
            <p className="text-xs text-slate mb-3">Social determinant of health</p>
            <div className="space-y-2">
              {HOUSING_AT_ADMIT.map(h => (
                <div key={h.type}>
                  <div className="flex justify-between items-center mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: h.color }} />
                      <span className="text-xs text-slate">{h.type}</span>
                    </div>
                    <span className="text-xs font-bold text-navy">{h.value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${(h.value/24)*100}%`, backgroundColor: h.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border text-xs text-slate">
              Unstable housing at admit: <span className="font-bold text-critical">25%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mt-4">
          {/* Referral Sources */}
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-0.5">Referral Sources (Current Census)</h3>
            <p className="text-xs text-slate mb-3">How patients found their way to care</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={REFERRAL_SOURCES} layout="vertical" margin={{ left: 10, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis type="category" dataKey="source" tick={{ fontSize: 10 }} width={130} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" name="Patients" fill="#E8761A" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Co-occurring Disorders */}
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-0.5">Co-occurring Mental Health Disorders</h3>
            <p className="text-xs text-slate mb-3">Dual diagnosis prevalence — current census</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={CO_OCCURRING} layout="vertical" margin={{ left: 10, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis type="category" dataKey="condition" tick={{ fontSize: 10 }} width={130} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" name="Patients" fill="#9B59B6" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-slate mt-2 text-center">
              Dual diagnosis rate: <span className="font-bold text-navy">{Math.round((17/24)*100)}% of census</span>
            </div>
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
      )}

      {paTab === 'Payer Mix' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Payer mix analysis for the current census and trailing 12 months — revenue composition, authorization approval rates, and payer-specific LOS benchmarks.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Medicaid (TennCare)', pct: '38%', color: 'text-blue-600', sub: 'Largest single payer' },
              { label: 'Commercial Insurance', pct: '32%', color: 'text-teal-600', sub: 'PPO + HMO combined' },
              { label: 'Medicare / Dual', pct: '12%', color: 'text-purple-600', sub: 'Growing segment' },
              { label: 'Self-Pay / Sliding Scale', pct: '18%', color: 'text-amber-600', sub: 'Scholarship + cash pay' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.pct}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Payer-Specific Metrics (Trailing 12 Months)</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Payer</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Auth Approval</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Avg LOS Auth</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Denial Rate</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Days to Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { payer: 'TennCare (BlueCare)', approval: '91%', los: '18d', deny: '9%', days: 28, ok: true },
                    { payer: 'BlueCross BlueShield TN', approval: '87%', los: '21d', deny: '13%', days: 22, ok: true },
                    { payer: 'Cigna Behavioral', approval: '82%', los: '16d', deny: '18%', days: 35, ok: false },
                    { payer: 'Aetna Behavioral', approval: '85%', los: '19d', deny: '15%', days: 30, ok: true },
                    { payer: 'UnitedHealth / Optum', approval: '78%', los: '14d', deny: '22%', days: 38, ok: false },
                    { payer: 'Medicare / Humana', approval: '94%', los: '20d', deny: '6%', days: 21, ok: true },
                    { payer: 'Self-Pay / Scholarship', approval: 'N/A', los: 'N/A', deny: 'N/A', days: 0, ok: true },
                  ].map(r => (
                    <tr key={r.payer} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-navy">{r.payer}</td>
                      <td className="py-2 text-center text-slate">{r.approval}</td>
                      <td className="py-2 text-center text-slate">{r.los}</td>
                      <td className="py-2 text-center">
                        <span className={`font-semibold ${r.ok ? 'text-slate' : 'text-red-600'}`}>{r.deny}</span>
                      </td>
                      <td className="py-2 text-center text-slate">{r.days > 0 ? `${r.days}d` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Revenue by Level of Care</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { loc: 'Residential (3.1)', rev: '$187,400', pct: 62, color: 'bg-navy' },
                    { loc: 'PHP (2.5)', rev: '$71,200', pct: 23, color: 'bg-blue-500' },
                    { loc: 'IOP (2.1)', rev: '$36,800', pct: 12, color: 'bg-teal-500' },
                    { loc: 'Detox / Med Mgmt (3.7)', rev: '$9,100', pct: 3, color: 'bg-purple-500' },
                  ].map(l => (
                    <div key={l.loc}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-slate">{l.loc}</span>
                        <span className="font-semibold text-navy">{l.rev} ({l.pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className={`h-2 rounded-full ${l.color}`} style={{ width: `${l.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 font-semibold text-navy flex justify-between">
                    <span>Total (This Month)</span>
                    <span>$304,500</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <strong>Payer Watch:</strong> UnitedHealth/Optum denial rate (22%) and Cigna Behavioral (18%) are above the 15% internal threshold. Targeted appeal support and concurrent review documentation improvement are recommended for these payers.
              </div>
            </div>
          </div>
        </div>
      )}

      {paTab === 'Predictive Risk' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Machine-learning-informed risk stratification — AMA propensity, relapse probability, and readmission likelihood scores for the active census.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'High AMA Risk (≥70%)', value: 5, color: 'text-red-600', sub: 'Active monitoring flags' },
              { label: 'High Relapse Risk (≥65%)', value: 8, color: 'text-amber-600', sub: '12-month post-discharge model' },
              { label: 'Model Accuracy (Backtest)', value: '81%', color: 'text-navy', sub: 'AMA model, 2024–2025 cohort' },
              { label: 'Interventions Triggered', value: 12, color: 'text-blue-600', sub: 'This month by risk flags' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">AMA Risk Model — Key Predictors (Feature Importance)</h3>
            <div className="space-y-2.5 text-xs">
              {[
                { factor: 'Prior AMA history (same facility)', weight: 94, color: 'bg-red-500', direction: 'Increases risk' },
                { factor: 'Day 3–7 of treatment (highest risk window)', weight: 88, color: 'bg-orange-500', direction: 'Increases risk' },
                { factor: 'Low therapeutic alliance score at Day 2', weight: 81, color: 'bg-amber-500', direction: 'Increases risk' },
                { factor: 'Pending criminal legal matter', weight: 74, color: 'bg-amber-400', direction: 'Increases risk' },
                { factor: 'Peer support contact ≥1×/day (protective)', weight: 68, color: 'bg-blue-500', direction: 'Reduces risk' },
                { factor: 'Family session completed by Day 5 (protective)', weight: 61, color: 'bg-teal-500', direction: 'Reduces risk' },
                { factor: 'MAT initiated within 48h (protective)', weight: 57, color: 'bg-green-500', direction: 'Reduces risk' },
              ].map(f => (
                <div key={f.factor}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-slate flex items-center gap-1.5">{f.factor} <span className={`text-[9px] font-bold px-1 rounded ${f.direction === 'Reduces risk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{f.direction}</span></span>
                    <span className="font-semibold text-navy">{f.weight}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className={`h-1.5 rounded-full ${f.color}`} style={{ width: `${f.weight}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[10px] text-blue-900">
              <strong>Note:</strong> Predictive risk scores are clinical decision support tools — not deterministic. All interventions require clinical judgment. Model trained on 2023–2025 Sunrise patient cohort (n=198 completed episodes). Re-training scheduled annually.
            </div>
          </div>
        </div>
      )}

      {paTab === 'Geographic Reach' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Patient geographic origin, county-level demand mapping, and referral corridor analysis — informs marketing, business development, and resource allocation.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Tennessee Counties (Served)', value: 22, color: 'text-navy', sub: 'Of 95 counties statewide' },
              { label: 'Out-of-State Patients (YTD)', value: 14, color: 'text-blue-600', sub: 'AL, KY, GA primary sources' },
              { label: 'Avg Distance Traveled', value: '64 mi', color: 'text-teal-600', sub: 'From patient zip to Sunrise' },
              { label: 'Nashville Metro (≤30mi)', value: '58%', color: 'text-green-600', sub: 'Of all admissions YTD' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Admissions by County / Region — YTD 2026</h3>
            <div className="space-y-2 text-xs">
              {[
                { region: 'Davidson County (Nashville)', admits: 68, pct: 38, type: 'Metro', color: 'bg-blue-500' },
                { region: 'Rutherford County (Murfreesboro)', admits: 24, pct: 13, type: 'Metro', color: 'bg-blue-400' },
                { region: 'Williamson County (Franklin)', admits: 21, pct: 12, type: 'Metro', color: 'bg-blue-300' },
                { region: 'Wilson County (Lebanon)', admits: 14, pct: 8, type: 'Middle TN', color: 'bg-teal-500' },
                { region: 'Sumner County (Gallatin)', admits: 11, pct: 6, type: 'Middle TN', color: 'bg-teal-400' },
                { region: 'Montgomery County (Clarksville)', admits: 9, pct: 5, type: 'Middle TN', color: 'bg-teal-300' },
                { region: 'Other TN Counties', admits: 18, pct: 10, type: 'Statewide', color: 'bg-purple-400' },
                { region: 'Out of State (AL/KY/GA)', admits: 14, pct: 8, type: 'OOS', color: 'bg-orange-400' },
              ].map(r => (
                <div key={r.region}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-slate flex items-center gap-1.5">{r.region} <span className="text-[9px] bg-gray-100 text-slate px-1 rounded">{r.type}</span></span>
                    <span className="font-semibold text-navy">{r.admits} admits ({r.pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct * 2.2}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
