import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import {
  DollarSign, AlertTriangle, TrendingUp, TrendingDown,
  Clock, CheckCircle2, XCircle, FileText, Plus
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

// ─── Data ─────────────────────────────────────────────────────────────────────

interface AuthRecord {
  patientId: string; patientName: string; mrn: string; program: string;
  insurance: string; authNumber: string; authorizedDays: number; usedDays: number;
  authStart: string; authEnd: string; status: 'Active' | 'Expiring Soon' | 'Expired' | 'Pending' | 'Denied';
  dailyRate: number; urContact: string;
}

interface Claim {
  id: string; patientName: string; mrn: string; insurance: string;
  serviceDate: string; submittedDate: string; amount: number;
  status: 'Submitted' | 'In Review' | 'Paid' | 'Denied' | 'Appealing';
  denialReason?: string;
}

const AUTHS: AuthRecord[] = [
  { patientId: 'p1', patientName: 'Marcus Webb', mrn: 'MRN-83921', program: 'Residential', insurance: 'BlueCross', authNumber: 'BCB-2026-44821', authorizedDays: 30, usedDays: 22, authStart: '2026-06-26', authEnd: '2026-07-25', status: 'Active', dailyRate: 850, urContact: 'Linda Vance' },
  { patientId: 'p2', patientName: 'Samantha Choi', mrn: 'MRN-74563', program: 'Residential', insurance: 'Aetna', authNumber: 'AET-2026-19034', authorizedDays: 14, usedDays: 13, authStart: '2026-07-05', authEnd: '2026-07-19', status: 'Expiring Soon', dailyRate: 920, urContact: 'Linda Vance' },
  { patientId: 'p3', patientName: 'James Thornton', mrn: 'MRN-62841', program: 'Residential', insurance: 'United', authNumber: 'UHC-2026-88201', authorizedDays: 28, usedDays: 28, authStart: '2026-06-20', authEnd: '2026-07-17', status: 'Expired', dailyRate: 780, urContact: 'Linda Vance' },
  { patientId: 'p4', patientName: 'Patricia Holloway', mrn: 'MRN-48320', program: 'Residential', insurance: 'Humana', authNumber: 'HUM-2026-33012', authorizedDays: 35, usedDays: 35, authStart: '2026-06-13', authEnd: '2026-07-17', status: 'Expired', dailyRate: 810, urContact: 'Linda Vance' },
  { patientId: 'p5', patientName: 'Robert Navarro', mrn: 'MRN-44782', program: 'Residential', insurance: 'Maryland Medicaid', authNumber: 'TCR-2026-55810', authorizedDays: 45, usedDays: 42, authStart: '2026-06-06', authEnd: '2026-07-20', status: 'Expiring Soon', dailyRate: 620, urContact: 'Linda Vance' },
  { patientId: 'p6', patientName: 'Destiny Williams', mrn: 'MRN-55129', program: 'PHP', insurance: 'Cigna', authNumber: 'CGN-2026-77441', authorizedDays: 20, usedDays: 11, authStart: '2026-07-07', authEnd: '2026-07-26', status: 'Active', dailyRate: 480, urContact: 'Linda Vance' },
  { patientId: 'p7', patientName: 'Brian Kowalski', mrn: 'MRN-27641', program: 'PHP', insurance: 'BlueCross', authNumber: 'BCB-2026-50291', authorizedDays: 21, usedDays: 21, authStart: '2026-06-27', authEnd: '2026-07-17', status: 'Expired', dailyRate: 490, urContact: 'Linda Vance' },
  { patientId: 'p8', patientName: 'Linda Farris', mrn: 'MRN-39018', program: 'IOP', insurance: 'Aetna', authNumber: 'Pending Review', authorizedDays: 0, usedDays: 14, authStart: '2026-07-04', authEnd: '—', status: 'Pending', dailyRate: 310, urContact: 'Linda Vance' },
];

const CLAIMS: Claim[] = [
  { id: 'cl1', patientName: 'Marcus Webb', mrn: 'MRN-83921', insurance: 'BlueCross', serviceDate: '2026-07-01', submittedDate: '2026-07-03', amount: 18700, status: 'Paid' },
  { id: 'cl2', patientName: 'Samantha Choi', mrn: 'MRN-74563', insurance: 'Aetna', serviceDate: '2026-07-05', submittedDate: '2026-07-07', amount: 12880, status: 'Paid' },
  { id: 'cl3', patientName: 'James Thornton', mrn: 'MRN-62841', insurance: 'United', serviceDate: '2026-07-01', submittedDate: '2026-07-03', amount: 15600, status: 'In Review' },
  { id: 'cl4', patientName: 'Patricia Holloway', mrn: 'MRN-48320', insurance: 'Humana', serviceDate: '2026-06-20', submittedDate: '2026-06-22', amount: 22680, status: 'Denied', denialReason: 'Level of care not medically necessary per Humana clinical criteria. Residential denied — PHP approved.' },
  { id: 'cl5', patientName: 'Robert Navarro', mrn: 'MRN-44782', insurance: 'Maryland Medicaid', serviceDate: '2026-07-01', submittedDate: '2026-07-03', amount: 8680, status: 'Paid' },
  { id: 'cl6', patientName: 'Destiny Williams', mrn: 'MRN-55129', insurance: 'Cigna', serviceDate: '2026-07-07', submittedDate: '2026-07-09', amount: 5280, status: 'Submitted' },
  { id: 'cl7', patientName: 'Brian Kowalski', mrn: 'MRN-27641', insurance: 'BlueCross', serviceDate: '2026-06-27', submittedDate: '2026-06-29', amount: 10290, status: 'Appealing', denialReason: 'Missing clinical documentation — ASAM assessment not included.' },
  { id: 'cl8', patientName: 'Linda Farris', mrn: 'MRN-39018', insurance: 'Aetna', serviceDate: '2026-07-04', submittedDate: '—', amount: 4340, status: 'Submitted' },
];

// ─── Analytics mock data ──────────────────────────────────────────────────────

const MONTHLY_REVENUE = [
  { month: 'Jan', collected: 218000, billed: 264000 },
  { month: 'Feb', collected: 195000, billed: 241000 },
  { month: 'Mar', collected: 242000, billed: 289000 },
  { month: 'Apr', collected: 267000, billed: 312000 },
  { month: 'May', collected: 258000, billed: 299000 },
  { month: 'Jun', collected: 281000, billed: 325000 },
  { month: 'Jul', collected: 98000,  billed: 152000 },
];

const PAYER_MIX = [
  { name: 'BlueCross',  value: 34, color: '#1e5fa8' },
  { name: 'Aetna',      value: 10, color: '#0ea5e9' },
  { name: 'United',     value: 18, color: '#6366f1' },
  { name: 'Maryland Medicaid',   value: 12, color: '#14b8a6' },
  { name: 'Humana',     value: 8,  color: '#f59e0b' },
  { name: 'Cigna',      value: 4,  color: '#f97316' },
  { name: 'Self-Pay',   value: 2,  color: '#94a3b8' },
];

const AR_AGING = [
  { bucket: '0–30d',  amount: 58000,  claims: 12 },
  { bucket: '31–60d', amount: 24000,  claims: 6  },
  { bucket: '61–90d', amount: 18200,  claims: 4  },
  { bucket: '91–120d',amount: 9400,   claims: 2  },
  { bucket: '>120d',  amount: 6800,   claims: 2  },
];

const AR_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#991b1b'];

// ─── Styles ───────────────────────────────────────────────────────────────────

const AUTH_COLORS: Record<string, string> = {
  'Active':        'bg-green-100 text-green-700 border-green-200',
  'Expiring Soon': 'bg-amber-100 text-amber-700 border-amber-200',
  'Expired':       'bg-red-100 text-red-700 border-red-200',
  'Pending':       'bg-blue-100 text-blue-700 border-blue-200',
  'Denied':        'bg-red-200 text-red-800 border-red-300',
};

const CLAIM_COLORS: Record<string, string> = {
  'Paid':       'bg-green-100 text-green-700',
  'Submitted':  'bg-blue-100 text-blue-700',
  'In Review':  'bg-amber-100 text-amber-700',
  'Denied':     'bg-red-100 text-red-700',
  'Appealing':  'bg-purple-100 text-purple-700',
};

const fmt = (n: number) => `$${n.toLocaleString()}`;
const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

type TabType = 'Analytics' | 'Authorizations' | 'Claims' | 'Denied & Appeals' | 'Concurrent Review' | 'Payer Mix' | 'Collections';

// ─── Main ─────────────────────────────────────────────────────────────────────

export function RevenueCycle({ navigate, readOnly }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('Analytics');

  const totalRevMonth = CLAIMS.filter(c => c.status === 'Paid').reduce((s, c) => s + c.amount, 0);
  const pendingRevenue = CLAIMS.filter(c => c.status !== 'Paid' && c.status !== 'Denied').reduce((s, c) => s + c.amount, 0);
  const deniedAmount = CLAIMS.filter(c => c.status === 'Denied').reduce((s, c) => s + c.amount, 0);
  const denialRate = Math.round((CLAIMS.filter(c => c.status === 'Denied').length / CLAIMS.length) * 100);
  const expiringAuths = AUTHS.filter(a => a.status === 'Expiring Soon' || a.status === 'Expired').length;
  const denied = CLAIMS.filter(c => c.status === 'Denied' || c.status === 'Appealing');
  const collectionRate = Math.round((totalRevMonth / MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].billed) * 100);
  const totalAR = AR_AGING.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-success" /> Revenue Cycle
          </h1>
          <p className="text-slate text-sm mt-0.5">Insurance authorizations, claims, AR analytics, and denial management</p>
        </div>
        <LockedButton locked={readOnly} className="flex items-center gap-2 bg-sunrise-blue text-white px-4 py-2 rounded font-medium shadow-sm hover:bg-sunrise-blue-light transition-colors text-sm">
          <Plus className="w-4 h-4" /> Submit Claim
        </LockedButton>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Collected (Jul)',      value: fmt(totalRevMonth),  color: 'text-success',          border: 'border-success/30',          icon: CheckCircle2 },
          { label: 'Pending Revenue',      value: fmt(pendingRevenue), color: 'text-sunrise-blue',     border: 'border-sunrise-blue/30',     icon: Clock },
          { label: 'Denied / At Risk',     value: fmt(deniedAmount),   color: deniedAmount > 0 ? 'text-critical' : 'text-success', border: 'border-critical/30', icon: XCircle },
          { label: 'Denial Rate',          value: `${denialRate}%`,    color: denialRate > 15 ? 'text-critical' : denialRate > 8 ? 'text-sunrise-amber' : 'text-success', border: 'border-sunrise-amber/40', icon: TrendingDown },
          { label: 'Auth Alerts',          value: expiringAuths,       color: expiringAuths > 0 ? 'text-sunrise-amber' : 'text-success', border: 'border-sunrise-amber/40', icon: AlertTriangle },
        ].map(k => (
          <div key={k.label} className={`bg-white border-l-4 ${k.border} rounded-lg shadow-sm p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate uppercase tracking-wider">{k.label}</div>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {expiringAuths > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-none" />
          <div className="text-sm text-amber-800 flex-1">
            <strong>{expiringAuths} authorization(s) expiring or expired</strong> — submit continued stay requests immediately to avoid claim denials.
          </div>
          <button onClick={() => setActiveTab('Authorizations')} className="text-xs text-amber-700 font-bold hover:underline flex-none">View Auths</button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {(['Analytics', 'Authorizations', 'Claims', 'Denied & Appeals', 'Concurrent Review', 'Payer Mix', 'Collections'] as TabType[]).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t
                  ? 'border-sunrise-orange text-sunrise-orange bg-sunrise-orange/5'
                  : 'border-transparent text-slate hover:text-navy hover:bg-slate-50'
              }`}
            >
              {t}
              {t === 'Denied & Appeals' && denied.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{denied.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Analytics ─── */}
        {activeTab === 'Analytics' && (
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Monthly collected vs billed */}
              <div className="lg:col-span-2">
                <div className="text-xs font-bold text-slate uppercase tracking-wider mb-3">Monthly Revenue — Collected vs Billed (YTD)</div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MONTHLY_REVENUE}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(v: number, name: string) => [fmt(v), name === 'collected' ? 'Collected' : 'Billed']}
                        contentStyle={{ fontSize: 12, borderRadius: 8, backgroundColor: '#0F172A', border: 'none', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="billed" name="billed" fill="#E2E8F0" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="collected" name="collected" fill="#16A34A" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-slate">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 inline-block" /> Billed</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success inline-block" /> Collected</span>
                  <span className="ml-auto font-semibold text-navy">Collection Rate: <span className="text-success">{collectionRate}%</span></span>
                </div>
              </div>

              {/* Payer mix */}
              <div>
                <div className="text-xs font-bold text-slate uppercase tracking-wider mb-3">Payer Mix</div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={PAYER_MIX}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={68}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {PAYER_MIX.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number, _: string, props: { payload?: { name?: string } }) => [`${v}%`, props?.payload?.name ?? '']}
                        contentStyle={{ fontSize: 11, borderRadius: 6, backgroundColor: '#0F172A', border: 'none', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 mt-1">
                  {PAYER_MIX.map(p => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm inline-block flex-none" style={{ backgroundColor: p.color }} />
                        <span className="text-slate">{p.name}</span>
                      </div>
                      <span className="font-semibold text-navy">{p.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AR Aging */}
            <div>
              <div className="text-xs font-bold text-slate uppercase tracking-wider mb-3">
                AR Aging Buckets — Total AR: <span className="text-navy">{fmt(totalAR)}</span>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={AR_AGING} barSize={48}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: number) => [fmt(v), 'AR Balance']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, backgroundColor: '#0F172A', border: 'none', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {AR_AGING.map((_, i) => (
                        <Cell key={i} fill={AR_COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2 text-xs flex-wrap">
                {AR_AGING.map((b, i) => (
                  <span key={b.bucket} className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: AR_COLORS[i] }} />
                    <span className="text-slate">{b.bucket}:</span>
                    <span className="font-semibold text-navy">{fmtK(b.amount)}</span>
                    <span className="text-slate-400">({b.claims} claims)</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Summary benchmarks */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Days in AR', value: '28.4', benchmark: '< 40', good: true },
                { label: 'First-Pass Rate', value: '87%', benchmark: '> 85%', good: true },
                { label: 'Clean Claim Rate', value: '91%', benchmark: '> 90%', good: true },
                { label: 'Denial Rate', value: `${denialRate}%`, benchmark: '< 10%', good: denialRate < 10 },
              ].map(m => (
                <div key={m.label} className={`bg-white border rounded-lg p-4 ${m.good ? 'border-green-200' : 'border-red-200'}`}>
                  <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">{m.label}</div>
                  <div className={`text-2xl font-bold ${m.good ? 'text-success' : 'text-critical'}`}>{m.value}</div>
                  <div className={`text-[10px] mt-0.5 ${m.good ? 'text-success' : 'text-critical'}`}>
                    {m.good ? '✓' : '⚠'} Benchmark: {m.benchmark}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Authorizations ─── */}
        {activeTab === 'Authorizations' && (
          <div className="p-5 space-y-4">
            {expiringAuths > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>⚠ Action Required:</strong> {expiringAuths} authorization(s) expiring or expired — submit continued stay requests immediately.
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate uppercase tracking-wider">Insurance</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate uppercase tracking-wider">Auth #</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate uppercase tracking-wider">Days Used</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate uppercase tracking-wider">Expiration</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate uppercase tracking-wider">Daily Rate</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {AUTHS.map((a, i) => (
                    <tr key={i} className={`hover:bg-slate-50 ${(a.status === 'Expiring Soon' || a.status === 'Expired') ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => navigate('PatientDetail', a.patientId)} className="font-semibold text-navy hover:text-sunrise-blue text-sm">{a.patientName}</button>
                        <div className="text-[10px] text-slate font-mono">{a.mrn} · {a.program}</div>
                      </td>
                      <td className="px-4 py-3 text-slate">{a.insurance}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate">{a.authNumber}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-navy">{a.usedDays} / {a.authorizedDays || '—'}</div>
                        {a.authorizedDays > 0 && (
                          <div className="mt-1 h-1.5 bg-slate-100 rounded-full w-24">
                            <div
                              className={`h-1.5 rounded-full ${a.usedDays >= a.authorizedDays ? 'bg-critical' : a.usedDays >= a.authorizedDays * 0.85 ? 'bg-sunrise-amber' : 'bg-success'}`}
                              style={{ width: `${Math.min((a.usedDays / a.authorizedDays) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate text-sm">{a.authEnd}</td>
                      <td className="px-4 py-3 font-medium text-navy">{fmt(a.dailyRate)}/d</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${AUTH_COLORS[a.status]}`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {(a.status === 'Expiring Soon' || a.status === 'Expired') && (
                          <button className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded font-medium hover:bg-amber-200">Request Extension</button>
                        )}
                        {a.status === 'Pending' && (
                          <button className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded font-medium hover:bg-blue-200">Follow Up</button>
                        )}
                        {a.status === 'Active' && (
                          <button className="text-xs text-slate hover:text-navy">View</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Claims ─── */}
        {activeTab === 'Claims' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate uppercase tracking-wider">Insurance</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate uppercase tracking-wider">Service Date</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate uppercase tracking-wider">Submitted</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {CLAIMS.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-navy">{c.patientName}</div>
                      <div className="text-[10px] text-slate font-mono">{c.mrn}</div>
                    </td>
                    <td className="px-4 py-3 text-slate">{c.insurance}</td>
                    <td className="px-4 py-3 text-slate">{c.serviceDate}</td>
                    <td className="px-4 py-3 text-slate">{c.submittedDate}</td>
                    <td className="px-4 py-3 font-bold text-navy">{fmt(c.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${CLAIM_COLORS[c.status]}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-bg border-t border-border">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-bold text-navy">Total Billed</td>
                  <td className="px-4 py-3 font-bold text-navy">{fmt(CLAIMS.reduce((s, c) => s + c.amount, 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ─── Concurrent Review ─── */}
        {activeTab === 'Concurrent Review' && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Active Reviews', value: AUTHS.filter(a => a.status === 'Active').length, color: 'text-navy', border: 'border-navy/30' },
                { label: 'Due This Week', value: 4, color: 'text-sunrise-amber', border: 'border-sunrise-amber/30' },
                { label: 'Overdue', value: 1, color: 'text-critical', border: 'border-critical/30' },
                { label: 'Submitted MTD', value: 18, color: 'text-success', border: 'border-success/30' },
              ].map(k => (
                <div key={k.label} className={`bg-white border-l-4 ${k.border} rounded-lg p-3 shadow-sm`}>
                  <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">{k.label}</div>
                  <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <strong>UR Reminder:</strong> Continued stay reviews must be submitted 24h before each auth period expires. ASAM criteria documentation required for all residential levels.
            </div>

            <div className="space-y-3">
              {[
                { patientId: 'p3', patient: 'James Thornton', mrn: 'MRN-62841', insurance: 'Aetna Behavioral', level: 'Residential (3.7)', los: 7, authDays: 14, authEnd: '2026-07-26', nextReview: '2026-07-24', status: 'Due in 5 days', asam: { dim1: '3 – Severe', dim2: '3 – Moderate', dim3: '3 – Moderate', dim4: '2 – Low', dim5: '3 – Moderate', dim6: '2 – Low' }, criteria: 'Patient meets medical necessity for continued 3.7 residential LOC. COWS 9 at admission, now 4. MAT initiated (Suboxone 8mg). Continuing medical withdrawal management required due to complex polysubstance history and co-occurring GAD.', reviewer: 'David Odom, LMFT', lastSubmitted: '2026-07-17' },
                { patientId: 'p1', patient: 'Marcus Webb', mrn: 'MRN-83921', insurance: 'BCBS Commercial', level: 'Residential (3.5)', los: 34, authDays: 30, authEnd: '2026-08-01', nextReview: '2026-07-29', status: 'Due in 10 days', asam: { dim1: '2 – Moderate', dim2: '2 – Low', dim3: '3 – Moderate', dim4: '1 – Minimal', dim5: '3 – Moderate', dim6: '3 – Moderate' }, criteria: 'Day 34. Patient stabilized on medication. High AMA risk remains — verbalized intent to leave 7/18 following family conflict. Treatment plan updated with AMA prevention goals. Continued residential justified by imminent AMA risk and insufficient coping skills for lower LOC.', reviewer: 'Sarah Jenkins, LPC', lastSubmitted: '2026-07-09' },
                { patientId: 'p5', patient: 'Robert Navarro', mrn: 'MRN-44782', insurance: 'Medicaid MCO', level: 'Residential (3.5)', los: 22, authDays: 21, authEnd: '2026-07-20', nextReview: '2026-07-19', status: 'Due TOMORROW', asam: { dim1: '2 – Low', dim2: '2 – Low', dim3: '3 – Moderate', dim4: '2 – Low', dim5: '3 – Moderate', dim6: '3 – Moderate' }, criteria: 'Court-ordered treatment (pretrial diversion). Legal obligations and incomplete treatment goals require continued residential. CJS involvement increases relapse risk substantially. TP goals at 60% completion.', reviewer: 'Maria Gonzales, LCSW', lastSubmitted: '2026-06-29' },
                { patientId: 'p8', patient: 'Patricia Nguyen', mrn: 'MRN-55129', insurance: 'Cigna EAP', level: 'Residential (3.7)', los: 12, authDays: 14, authEnd: '2026-07-23', nextReview: '2026-07-21', status: 'Due in 2 days', asam: { dim1: '3 – Severe', dim2: '3 – Moderate', dim3: '3 – Moderate', dim4: '2 – Low', dim5: '3 – Moderate', dim6: '2 – Low' }, criteria: 'Trauma-focused EMDR ongoing — session 3 of 8 completed. Active PTSD symptoms with nightmares and hypervigilance. Residential level necessary to maintain safety and support trauma processing work. Discharge to lower LOC would be premature.', reviewer: 'Sarah Jenkins, LPC', lastSubmitted: '2026-07-09' },
              ].map(r => (
                <div key={r.patientId} className={`bg-white border rounded-xl p-4 shadow-sm ${r.status.includes('TOMORROW') ? 'border-critical/50' : r.status.includes('Overdue') ? 'border-critical' : 'border-border'}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-navy">{r.patient}</span>
                        <span className="text-xs text-slate font-mono">{r.mrn}</span>
                        <span className="text-xs bg-sunrise-blue/10 text-sunrise-blue font-semibold px-2 py-0.5 rounded">{r.level}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${r.status.includes('TOMORROW') ? 'bg-critical/15 text-critical' : r.status.includes('Overdue') ? 'bg-critical/20 text-critical' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                      </div>
                      <div className="text-xs text-slate mt-1">{r.insurance} · LOS {r.los}d · Auth ends {r.authEnd} · Reviewer: {r.reviewer}</div>
                    </div>
                    <div className="flex gap-2">
                      <LockedButton locked={readOnly} className="px-3 py-1.5 bg-sunrise-blue text-white text-xs font-semibold rounded hover:bg-sunrise-blue-light">Submit Review</LockedButton>
                      <LockedButton locked={readOnly} className="px-3 py-1.5 border border-border text-slate text-xs font-semibold rounded hover:bg-slate-50">Edit Criteria</LockedButton>
                    </div>
                  </div>

                  <details className="mt-3">
                    <summary className="text-xs text-slate cursor-pointer hover:text-navy font-medium select-none">View ASAM criteria & clinical justification</summary>
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(r.asam).map(([dim, val]) => (
                          <div key={dim} className="bg-bg border border-border rounded p-2">
                            <div className="text-[10px] font-bold text-slate uppercase tracking-wide">{dim.replace('dim', 'Dimension ')}</div>
                            <div className="text-xs font-semibold text-navy mt-0.5">{val}</div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Clinical Justification</div>
                        <p className="text-xs text-navy leading-relaxed">{r.criteria}</p>
                      </div>
                      <div className="text-[10px] text-slate">Last submitted: {r.lastSubmitted} · Next review due: {r.nextReview}</div>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Denied & Appeals ─── */}
        {activeTab === 'Denied & Appeals' && (
          <div className="p-5 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <strong>⚠ {denied.length} claim(s) require action.</strong> Total at risk: <span className="font-bold">{fmt(denied.reduce((s, c) => s + c.amount, 0))}</span>. File appeals within 30–60 days of denial date.
            </div>
            {denied.map(c => (
              <div key={c.id} className="bg-white border border-red-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-navy">{c.patientName}</span>
                      <span className="text-[10px] text-slate font-mono">{c.mrn}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${CLAIM_COLORS[c.status]}`}>{c.status}</span>
                    </div>
                    <div className="text-sm text-slate mt-0.5">
                      {c.insurance} · Service: {c.serviceDate} · <span className="font-bold text-navy">{fmt(c.amount)}</span>
                    </div>
                  </div>
                  <XCircle className="w-5 h-5 text-red-400 flex-none" />
                </div>
                {c.denialReason && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">Denial Reason</div>
                    <p className="text-sm text-red-800 leading-relaxed">{c.denialReason}</p>
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <LockedButton locked={readOnly} className="px-4 py-2 bg-sunrise-blue text-white text-xs font-semibold rounded hover:bg-sunrise-blue-light">File Appeal</LockedButton>
                  <LockedButton locked={readOnly} className="px-4 py-2 border border-border text-slate text-xs font-semibold rounded hover:bg-slate-50">Request Peer-to-Peer</LockedButton>
                  <LockedButton locked={readOnly} className="px-4 py-2 border border-red-200 text-red-600 text-xs font-semibold rounded hover:bg-red-50">Write Off</LockedButton>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'Payer Mix' && (
          <div className="p-5 space-y-5">
            <div className="text-sm text-slate">Payer distribution, average reimbursement rates, and contract performance by insurance carrier.</div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { payer: 'BlueCross BlueShield', patients: 6, pct: 30, avgRate: 875, totalBilled: 142600, collected: 128340, color: 'bg-blue-500' },
                { payer: 'Aetna', patients: 4, pct: 20, avgRate: 840, totalBilled: 89400, collected: 78672, color: 'bg-red-400' },
                { payer: 'United Healthcare', patients: 3, pct: 15, avgRate: 780, totalBilled: 67080, collected: 54235, color: 'bg-orange-400' },
                { payer: 'Humana', patients: 2, pct: 10, avgRate: 810, totalBilled: 46260, collected: 39321, color: 'bg-green-500' },
                { payer: 'Cigna', patients: 2, pct: 10, avgRate: 790, totalBilled: 43120, collected: 37584, color: 'bg-purple-500' },
                { payer: 'Maryland Medicaid (Medicaid)', patients: 2, pct: 10, avgRate: 620, totalBilled: 27840, collected: 24504, color: 'bg-teal-500' },
                { payer: 'Self-Pay', patients: 1, pct: 5, avgRate: 0, totalBilled: 18500, collected: 5550, color: 'bg-amber-400' },
              ].map(p => (
                <div key={p.payer} className="bg-white border border-border rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.color}`} />
                    <div className="font-semibold text-navy text-xs">{p.payer}</div>
                  </div>
                  <div className="text-2xl font-bold text-navy">{p.patients} <span className="text-sm text-slate font-normal">pts</span></div>
                  <div className="text-xs text-slate mt-0.5">{p.pct}% of census</div>
                  <div className="mt-2 pt-2 border-t border-border space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-slate">Avg Daily Rate</span><span className="font-semibold text-navy">${p.avgRate}</span></div>
                    <div className="flex justify-between"><span className="text-slate">Total Billed</span><span className="font-semibold text-navy">${p.totalBilled.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate">Collected</span><span className="font-semibold text-green-600">${p.collected.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate">Collection Rate</span>
                      <span className={`font-bold ${p.avgRate === 0 ? 'text-amber-600' : Math.round(p.collected/p.totalBilled*100) >= 85 ? 'text-green-600' : 'text-red-600'}`}>
                        {p.avgRate === 0 ? '30%' : `${Math.round(p.collected/p.totalBilled*100)}%`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-navy text-sm mb-3">Contract Performance</h3>
                <div className="space-y-3">
                  {[
                    { payer: 'BlueCross BlueShield', contractRate: 90, realized: 90, note: 'In-network — full contracted rate achieved' },
                    { payer: 'Aetna', contractRate: 88, realized: 88, note: 'In-network — minor write-offs on missed concurrent review' },
                    { payer: 'United Healthcare', contractRate: 81, realized: 81, note: '1 denial in review — rate may drop to 73% if not overturned' },
                    { payer: 'Humana', contractRate: 85, realized: 85, note: 'Auth expired on p4 — pursuing appeal; retroactive auth possible' },
                    { payer: 'Maryland Medicaid', contractRate: 88, realized: 88, note: 'Medicaid — fixed rate contract; prior auth required every 7 days' },
                    { payer: 'Self-Pay', contractRate: 100, realized: 30, note: 'Collected 30% — financial assistance applied; payment plan active' },
                  ].map(r => (
                    <div key={r.payer} className="text-xs">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-semibold text-navy">{r.payer}</span>
                        <span className={`font-bold ${r.realized >= 85 ? 'text-green-600' : r.realized >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{r.realized}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full mb-1">
                        <div className={`h-1.5 rounded-full ${r.realized >= 85 ? 'bg-green-500' : r.realized >= 75 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${r.realized}%` }} />
                      </div>
                      <div className="text-slate">{r.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-navy text-sm mb-3">Payer Mix Concentration Risk</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="font-bold text-amber-700 mb-1">⚠ Concentration Risk: BlueCross</div>
                    <div className="text-amber-800">BlueCross represents 30% of census and 33% of billed revenue. A single contract change or credentialing issue could significantly impact monthly collections.</div>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-bold text-green-700 mb-1">✓ Payer Diversification — Adequate</div>
                    <div className="text-green-800">No single payer exceeds 35% of revenue. Top-3 payers (BCBS, Aetna, United) represent 55% combined — within acceptable diversification range.</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-bold text-blue-700 mb-1">ℹ Medicaid / Maryland Medicaid Target</div>
                    <div className="text-blue-800">Current Medicaid census at 10%. State CARF grant requires maintaining ≥15% Medicaid/underinsured access. Consider waitlist priority review for Maryland Medicaid patients.</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { label: 'Commercial Payers', value: '75%', note: 'Strong revenue position' },
                      { label: 'Government Programs', value: '10%', note: 'Below grant target (15%)' },
                      { label: 'Self-Pay', value: '5%', note: 'Financial assistance available' },
                      { label: 'Uninsured', value: '10%', note: 'Charity care program eligible' },
                    ].map(k => (
                      <div key={k.label} className="bg-gray-50 p-2 rounded-lg">
                        <div className="font-semibold text-navy">{k.value}</div>
                        <div className="text-[10px] text-slate">{k.label}</div>
                        <div className="text-[10px] text-slate mt-0.5">{k.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Collections' && (
          <div className="space-y-5">
            <div className="text-sm text-slate">Outstanding balances, payment plan tracking, self-pay collections activity, and aging accounts receivable by payer.</div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Outstanding AR', value: '$284K', color: 'text-navy', sub: 'All payer categories' },
                { label: 'Avg Days in AR', value: '34.2d', color: 'text-amber-600', sub: 'Target ≤35 days' },
                { label: 'Self-Pay Balance', value: '$41K', color: 'text-red-600', sub: 'Patient responsibility owed' },
                { label: 'Collections Rate (90d)', value: '91%', color: 'text-green-600', sub: 'Of billed amounts received' },
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
                <h3 className="font-semibold text-navy text-sm mb-3">AR Aging by Payer Category</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-gray-50 text-slate">
                      {['Payer', '0–30d', '31–60d', '61–90d', '91–120d', '>120d', 'Total'].map(h => (
                        <th key={h} className="text-left px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { payer: 'Commercial', d30: '$68K', d60: '$24K', d90: '$11K', d120: '$4K', d120p: '$2K', total: '$109K' },
                      { payer: 'Maryland Medicaid / Medicaid', d30: '$44K', d60: '$18K', d90: '$8K', d120: '$3K', d120p: '$1K', total: '$74K' },
                      { payer: 'Medicare', d30: '$22K', d60: '$9K', d90: '$4K', d120: '$1K', d120p: '$0', total: '$36K' },
                      { payer: 'Self-Pay', d30: '$12K', d60: '$14K', d90: '$8K', d120: '$5K', d120p: '$2K', total: '$41K' },
                      { payer: 'Other / Unknown', d30: '$12K', d60: '$8K', d90: '$4K', d120: '$0', d120p: '$0', total: '$24K' },
                    ].map(r => (
                      <tr key={r.payer} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5 font-medium text-navy">{r.payer}</td>
                        <td className="px-2 py-1.5 text-green-700">{r.d30}</td>
                        <td className="px-2 py-1.5 text-blue-700">{r.d60}</td>
                        <td className="px-2 py-1.5 text-amber-700">{r.d90}</td>
                        <td className="px-2 py-1.5 text-orange-700">{r.d120}</td>
                        <td className="px-2 py-1.5 text-red-700 font-semibold">{r.d120p}</td>
                        <td className="px-2 py-1.5 font-bold text-navy">{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Self-Pay Payment Plans — Active</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { patient: 'Marcus Webb', balance: '$4,200', monthly: '$350', remaining: 12, status: 'Current', ok: true },
                    { patient: 'Samantha Choi', balance: '$2,800', monthly: '$200', remaining: 14, status: 'Current', ok: true },
                    { patient: 'James Thornton', balance: '$6,100', monthly: '$500', remaining: 12, status: 'Late 32d', ok: false },
                    { patient: 'Darius Bell', balance: '$1,400', monthly: '$175', remaining: 8, status: 'Current', ok: true },
                    { patient: 'Rachel Kim', balance: '$3,600', monthly: '$300', remaining: 12, status: 'Late 18d', ok: false },
                  ].map(p => (
                    <div key={p.patient} className={`flex items-center justify-between border rounded p-2 ${!p.ok ? 'border-amber-300 bg-amber-50/40' : 'border-border'}`}>
                      <div>
                        <div className="font-medium text-navy">{p.patient}</div>
                        <div className="text-[10px] text-slate">Balance: {p.balance} · {p.monthly}/mo · {p.remaining} payments remaining</div>
                      </div>
                      <span className={`shrink-0 ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.ok ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
