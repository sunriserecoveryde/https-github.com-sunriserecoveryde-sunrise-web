import React, { useState } from 'react';
import { Screen } from '../App';
import { BarChart3, TrendingUp, TrendingDown, Users, Calendar, Award, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';

const followUpData = [
  { period: 'Q1 2023', contacted: 78, sobriety30: 62, sobriety60: 54, sobriety90: 48, readmitted: 18 },
  { period: 'Q2 2023', contacted: 82, sobriety30: 68, sobriety60: 60, sobriety90: 52, readmitted: 15 },
  { period: 'Q3 2023', contacted: 85, sobriety30: 72, sobriety60: 64, sobriety90: 57, readmitted: 14 },
  { period: 'Q4 2023 (YTD)', contacted: 88, sobriety30: 75, sobriety60: 66, sobriety90: 59, readmitted: 12 },
];

const asamImprovementData = [
  { dimension: 'D1 Withdrawal', admit: 2.4, discharge: 0.6, label: 'D1' },
  { dimension: 'D2 Biomedical', admit: 1.8, discharge: 0.9, label: 'D2' },
  { dimension: 'D3 Emotional', admit: 2.9, discharge: 1.4, label: 'D3' },
  { dimension: 'D4 Readiness', admit: 1.6, discharge: 2.8, label: 'D4' },
  { dimension: 'D5 Relapse Risk', admit: 3.2, discharge: 1.5, label: 'D5' },
  { dimension: 'D6 Environment', admit: 2.7, discharge: 1.8, label: 'D6' },
];

const dischargeDestinations = [
  { name: 'Step-Down (PHP/IOP)', value: 38, color: '#2A6EBB' },
  { name: 'Home / Independent', value: 28, color: '#22C55E' },
  { name: 'Sober Living', value: 18, color: '#F59E0B' },
  { name: 'AMA / Self-Discharge', value: 9, color: '#EF4444' },
  { name: 'Higher LOC / Hospital', value: 4, color: '#8B5CF6' },
  { name: 'Other', value: 3, color: '#94A3B8' },
];

const recentOutcomes = [
  { name: 'Angela Reyes', mrn: 'MRN-72819', program: 'PHP', dischDate: '2023-09-22', daysClean: 34, followUp30: true, followUp60: true, followUp90: false, sobriety: true, employment: true, housing: true },
  { name: 'Christine O\'Brien', mrn: 'MRN-11029', program: 'IOP', dischDate: '2023-08-22', daysClean: 65, followUp30: true, followUp60: true, followUp90: true, sobriety: true, employment: false, housing: true },
  { name: 'Patient10 Mock10', mrn: 'MRN-13170', program: 'Residential', dischDate: '2023-09-15', daysClean: 41, followUp30: true, followUp60: false, followUp90: false, sobriety: false, employment: false, housing: true },
  { name: 'Patient12 Mock12', mrn: 'MRN-13804', program: 'PHP', dischDate: '2023-09-28', daysClean: 28, followUp30: true, followUp60: false, followUp90: false, sobriety: true, employment: true, housing: false },
  { name: 'Patient14 Mock14', mrn: 'MRN-14438', program: 'IOP', dischDate: '2023-10-01', daysClean: 25, followUp30: true, followUp60: false, followUp90: false, sobriety: true, employment: true, housing: true },
];

const kpis = [
  { label: '30-Day Follow-Up Rate', value: '88%', change: '+3%', up: true, benchmark: 'Nat\'l avg: 72%' },
  { label: '30-Day Sobriety Rate', value: '75%', change: '+7%', up: true, benchmark: 'Nat\'l avg: 58%' },
  { label: '90-Day Sobriety Rate', value: '59%', change: '+11%', up: true, benchmark: 'Nat\'l avg: 44%' },
  { label: '30-Day Readmission Rate', value: '12%', change: '-6%', up: false, benchmark: 'Nat\'l avg: 19%' },
  { label: 'Avg Length of Stay', value: '22.4d', change: '+1.2d', up: true, benchmark: 'Target: 21d' },
  { label: 'Employment at Follow-Up', value: '48%', change: '+4%', up: true, benchmark: 'Nat\'l avg: 39%' },
];

export function OutcomeTracking({ navigate }: { navigate: (s: Screen) => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'followup' | 'clients'>('overview');

  const CheckDot = ({ val }: { val: boolean }) => (
    <div className={`w-5 h-5 rounded-full flex items-center justify-center mx-auto text-white text-xs font-bold ${val ? 'bg-success' : 'bg-slate-200'}`}>
      {val ? '✓' : '–'}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sunrise-blue" /> Outcome Tracking
          </h1>
          <p className="text-slate text-sm mt-1">Post-discharge follow-up, sobriety rates, and ASAM improvement metrics</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-border rounded text-sm font-medium text-slate hover:bg-slate-50 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Sync Follow-Ups
          </button>
          <button className="px-3 py-1.5 bg-sunrise-blue text-white rounded text-sm font-medium hover:bg-sunrise-blue-light">Export TEDS Report</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white border border-border rounded-lg shadow-sm p-4">
            <div className="text-xs font-semibold text-slate uppercase tracking-wider leading-tight mb-2">{k.label}</div>
            <div className="text-3xl font-bold text-navy mb-1">{k.value}</div>
            <div className={`text-xs font-bold flex items-center gap-1 ${k.up ? 'text-success' : 'text-success'}`}>
              {k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {k.change} vs prior quarter
            </div>
            <div className="text-xs text-slate mt-1">{k.benchmark}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="flex border-b border-border">
          {[
            { id: 'overview' as const, label: 'Outcome Trends' },
            { id: 'followup' as const, label: 'ASAM Improvement' },
            { id: 'clients' as const, label: 'Client Outcomes' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-sunrise-orange text-sunrise-orange bg-sunrise-orange/5' : 'border-transparent text-slate hover:text-navy'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="font-bold text-navy mb-4">Sobriety & Follow-Up Rates by Quarter</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={followUpData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip formatter={(v: number) => `${v}%`} />
                      <Legend />
                      <Line type="monotone" dataKey="contacted" name="Follow-Up Contact" stroke="#2A6EBB" strokeWidth={2} dot />
                      <Line type="monotone" dataKey="sobriety30" name="30-Day Sober" stroke="#22C55E" strokeWidth={2} dot />
                      <Line type="monotone" dataKey="sobriety90" name="90-Day Sober" stroke="#F59E0B" strokeWidth={2} dot />
                      <Line type="monotone" dataKey="readmitted" name="Readmission %" stroke="#EF4444" strokeWidth={2} strokeDasharray="4 2" dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="font-bold text-navy mb-4">Discharge Destinations</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={dischargeDestinations} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {dischargeDestinations.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1">
                    {dischargeDestinations.map(d => (
                      <div key={d.name} className="flex items-center gap-2 text-xs text-slate">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span>{d.name}</span>
                        <span className="font-bold text-navy ml-auto">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'followup' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded bg-navy" /> Admission Score
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded bg-success" /> Discharge Score
                </div>
                <div className="ml-auto text-xs text-slate">Lower = better (except D4 Readiness)</div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={asamImprovementData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 11 }} label={{ value: 'Severity (0–4)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number, name: string) => [val.toFixed(1), name === 'admit' ? 'Admission' : 'Discharge']}
                    labelFormatter={(l: string) => asamImprovementData.find(d => d.label === l)?.dimension ?? l}
                  />
                  <Bar dataKey="admit" name="Admission" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="discharge" name="Discharge" fill="#22C55E" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 bg-success/10 border border-success/30 rounded-lg p-4">
                <div className="font-bold text-success mb-1 flex items-center gap-2"><Award className="w-4 h-4" /> Outcome Summary</div>
                <p className="text-sm text-slate">Average ASAM severity across all 6 dimensions improved from <strong>2.43</strong> at admission to <strong>1.50</strong> at discharge — a <strong>38% reduction</strong> in composite severity. D4 (Readiness to Change) showed the greatest positive shift, improving from 1.6 to 2.8.</p>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-navy">Recent Discharge Follow-Up Records</h3>
                <button className="text-sm px-3 py-1.5 border border-border rounded font-medium text-slate hover:bg-slate-50">+ Log Follow-Up</button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg">
                    <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">Client</th>
                    <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">Program</th>
                    <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">D/C Date</th>
                    <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">30d F/U</th>
                    <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">60d F/U</th>
                    <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">90d F/U</th>
                    <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">Sobriety</th>
                    <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">Employed</th>
                    <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">Housed</th>
                    <th className="text-right py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">Days Clean</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOutcomes.map((o, i) => (
                    <tr key={i} className="hover:bg-bg">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-navy">{o.name}</div>
                        <div className="text-xs text-slate">{o.mrn}</div>
                      </td>
                      <td className="py-3 px-3 text-slate text-xs">{o.program}</td>
                      <td className="py-3 px-3 text-slate text-xs">{o.dischDate}</td>
                      <td className="py-3 px-3"><CheckDot val={o.followUp30} /></td>
                      <td className="py-3 px-3"><CheckDot val={o.followUp60} /></td>
                      <td className="py-3 px-3"><CheckDot val={o.followUp90} /></td>
                      <td className="py-3 px-3"><CheckDot val={o.sobriety} /></td>
                      <td className="py-3 px-3"><CheckDot val={o.employment} /></td>
                      <td className="py-3 px-3"><CheckDot val={o.housing} /></td>
                      <td className="py-3 px-3 text-right font-bold text-navy">{o.daysClean}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
