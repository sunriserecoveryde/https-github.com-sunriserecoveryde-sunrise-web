import React, { useState } from 'react';
import { MOCK_REFERRALS } from '../data/mockReferrals';
import { Screen } from '../App';
import {
  Network, PhoneCall, TrendingUp, TrendingDown, DollarSign,
  ArrowRight, BarChart3, MapPin, Phone, Mail, Calendar,
  Plus, Filter, ChevronDown, ChevronUp, CheckCircle2
} from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';

// ─── Pipeline mock data ───────────────────────────────────────────────────────

const PIPELINE = [
  { id: 'pl1', name: 'Thomas Reilly',   source: 'Vanderbilt ER',        program: 'Residential', insurance: 'Aetna',      status: 'Pending Admit',      daysInPipeline: 2, coordinator: 'Amanda Lewis', diagnosis: 'Alcohol Use Disorder' },
  { id: 'pl2', name: 'Nicole Harrison', source: 'Cumberland Heights',    program: 'PHP',         insurance: 'BlueCross',  status: 'VOB / Assessment',   daysInPipeline: 3, coordinator: 'Amanda Lewis', diagnosis: 'Opioid Use Disorder' },
  { id: 'pl3', name: 'Andre Simmons',   source: 'Drug Court',            program: 'Residential', insurance: 'TennCare',   status: 'Referral Received',  daysInPipeline: 1, coordinator: 'Amanda Lewis', diagnosis: 'Methamphetamine Use' },
  { id: 'pl4', name: 'Brenda Castillo', source: 'Self-Referral',         program: 'IOP',         insurance: 'Cigna',      status: 'Referral Received',  daysInPipeline: 1, coordinator: 'Amanda Lewis', diagnosis: 'Alcohol + Anxiety' },
  { id: 'pl5', name: 'Marcus Odom',     source: 'Private Therapist',     program: 'Residential', insurance: 'United',     status: 'Active in Tx',       daysInPipeline: 4, coordinator: 'Amanda Lewis', diagnosis: 'Polysubstance' },
  { id: 'pl6', name: 'Yolanda Pierce',  source: 'TriStar Health ER',     program: 'PHP',         insurance: 'BCBS',       status: 'VOB / Assessment',   daysInPipeline: 2, coordinator: 'Amanda Lewis', diagnosis: 'Opioid Use Disorder' },
  { id: 'pl7', name: 'Derek Moss',      source: 'Vanderbilt ER',         program: 'Residential', insurance: 'Aetna',      status: 'Pending Admit',      daysInPipeline: 2, coordinator: 'Amanda Lewis', diagnosis: 'Alcohol Use Disorder' },
  { id: 'pl8', name: 'Cynthia Grant',   source: 'Monroe Carell Jr.',     program: 'IOP',         insurance: 'TennCare',   status: 'Referral Received',  daysInPipeline: 0, coordinator: 'Amanda Lewis', diagnosis: 'Benzodiazepine Use' },
  { id: 'pl9', name: 'Aaron King',      source: 'Drug Court',            program: 'Residential', insurance: 'Self-Pay',   status: 'Active in Tx',       daysInPipeline: 6, coordinator: 'Amanda Lewis', diagnosis: 'Methamphetamine Use' },
  { id: 'pl10', name: 'Fiona Beckett',  source: 'NovaCare Behavioral',   program: 'PHP',         insurance: 'Cigna',      status: 'VOB / Assessment',   daysInPipeline: 1, coordinator: 'Amanda Lewis', diagnosis: 'Alcohol Use Disorder' },
];

const STAGES = ['Referral Received', 'VOB / Assessment', 'Pending Admit', 'Active in Tx'] as const;
type Stage = typeof STAGES[number];

const STAGE_COLORS: Record<Stage, string> = {
  'Referral Received': 'bg-slate-100 border-slate-200',
  'VOB / Assessment':  'bg-blue-50  border-blue-200',
  'Pending Admit':     'bg-amber-50 border-amber-200',
  'Active in Tx':      'bg-green-50 border-green-200',
};
const STAGE_HEADER: Record<Stage, string> = {
  'Referral Received': 'bg-slate-500',
  'VOB / Assessment':  'bg-sunrise-blue',
  'Pending Admit':     'bg-sunrise-amber',
  'Active in Tx':      'bg-success',
};

// Referral volume trend (last 12 months)
const MONTHLY_TREND = [
  { month: 'Aug', referrals: 18, admits: 14 },
  { month: 'Sep', referrals: 22, admits: 19 },
  { month: 'Oct', referrals: 20, admits: 17 },
  { month: 'Nov', referrals: 25, admits: 20 },
  { month: 'Dec', referrals: 16, admits: 13 },
  { month: 'Jan', referrals: 21, admits: 17 },
  { month: 'Feb', referrals: 24, admits: 19 },
  { month: 'Mar', referrals: 28, admits: 23 },
  { month: 'Apr', referrals: 30, admits: 24 },
  { month: 'May', referrals: 26, admits: 22 },
  { month: 'Jun', referrals: 31, admits: 26 },
  { month: 'Jul', referrals: 29, admits: 24 },
];

// Per-source volume bar chart
const SOURCE_VOLUME = [
  { source: 'Vanderbilt ER',      referrals: 54 },
  { source: 'Cumberland Heights', referrals: 38 },
  { source: 'Drug Court',         referrals: 32 },
  { source: 'TriStar Health ER',  referrals: 28 },
  { source: 'Private Therapists', referrals: 22 },
  { source: 'Self-Referral',      referrals: 20 },
  { source: 'Monroe Carell',      referrals: 17 },
  { source: 'NovaCare',           referrals: 14 },
  { source: 'Other',              referrals: 45 },
];

// ─── Pipeline Kanban Card ─────────────────────────────────────────────────────

function KanbanCard({ item }: { item: typeof PIPELINE[0] }) {
  const insColors: Record<string, string> = {
    'Aetna': 'bg-blue-100 text-blue-700',
    'BlueCross': 'bg-indigo-100 text-indigo-700',
    'TennCare': 'bg-teal-100 text-teal-700',
    'Cigna': 'bg-orange-100 text-orange-700',
    'United': 'bg-green-100 text-green-700',
    'BCBS': 'bg-purple-100 text-purple-700',
    'Self-Pay': 'bg-slate-100 text-slate',
  };

  return (
    <div className="bg-white border border-border rounded-lg p-3 shadow-sm hover:border-sunrise-blue hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-bold text-navy text-sm">{item.name}</div>
        {item.daysInPipeline > 3 && (
          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold flex-none">{item.daysInPipeline}d</span>
        )}
      </div>
      <div className="text-xs text-slate mb-2 line-clamp-1">{item.diagnosis}</div>
      <div className="flex flex-wrap gap-1 mb-2">
        <span className="text-[10px] font-semibold bg-slate-100 text-slate px-1.5 py-0.5 rounded">{item.program}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${insColors[item.insurance] ?? 'bg-slate-100 text-slate'}`}>{item.insurance}</span>
      </div>
      <div className="text-[10px] text-slate flex items-center gap-1">
        <Network className="w-3 h-3" /> {item.source}
      </div>
    </div>
  );
}

// ─── Outreach log ─────────────────────────────────────────────────────────────

const OUTREACH_LOG = [
  { id: 'o1', source: 'Vanderbilt ER', contact: 'Dr. Aaron West', type: 'Call', date: '2026-07-18', note: 'Discussed Q3 capacity. Confirmed 2 pending referrals. Strong relationship.', outcome: 'Positive' },
  { id: 'o2', source: 'Cumberland Heights', contact: 'Emily Nguyen, LCSW', type: 'Email', date: '2026-07-16', note: 'Sent updated program brochure and IOP schedule.', outcome: 'Positive' },
  { id: 'o3', source: "Dr. Peterson's Clinic", contact: 'Dr. M. Peterson, MD', type: 'Call', date: '2026-06-02', note: 'No answer — left voicemail. Clinic went 47 days without a referral.', outcome: 'At Risk' },
  { id: 'o4', source: 'TriStar Health ER', contact: 'Case Mgmt Team', type: 'Visit', date: '2026-07-14', note: 'In-person lunch & learn with ER case management team. Distributed FAQs and contact cards.', outcome: 'Positive' },
  { id: 'o5', source: 'Drug Court', contact: 'Judge Wallace Office', type: 'Email', date: '2026-07-17', note: 'Sent 2026 Q3 program capacity summary and court-required documentation packet.', outcome: 'Positive' },
];

const OUTCOME_COLORS: Record<string, string> = {
  Positive: 'bg-green-100 text-green-700',
  'At Risk': 'bg-red-100 text-red-700',
  Neutral: 'bg-slate-100 text-slate',
};

// ─── Main ─────────────────────────────────────────────────────────────────────

type ViewTab = 'Pipeline' | 'Partners' | 'Analytics' | 'Outreach' | 'Outcomes' | 'ROI Analysis';

export function ReferralTracker({ navigate, readOnly }: { navigate: (s: Screen) => void; readOnly?: boolean }) {
  const [activeTab, setActiveTab] = useState<ViewTab>('Pipeline');
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const ytdReferrals = MONTHLY_TREND.reduce((s, m) => s + m.referrals, 0);
  const ytdAdmits = MONTHLY_TREND.reduce((s, m) => s + m.admits, 0);
  const convRate = Math.round((ytdAdmits / ytdReferrals) * 100);
  const revenueM = (ytdAdmits * 15200 / 1_000_000).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Network className="w-6 h-6 text-sunrise-orange" /> Referral Tracker
          </h1>
          <p className="text-slate text-sm mt-1">Admission pipeline, partner performance, and BD activity</p>
        </div>
        <LockedButton locked={readOnly} className="flex items-center gap-2 bg-sunrise-blue text-white px-4 py-2 rounded font-medium shadow-sm hover:bg-sunrise-blue-light transition-colors text-sm">
          <Plus className="w-4 h-4" /> Add Referral Source
        </LockedButton>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-l-4 border-sunrise-blue/40 rounded-lg shadow-sm p-4">
          <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Total Referrals (YTD)</div>
          <div className="text-3xl font-bold text-navy">{ytdReferrals}</div>
          <div className="text-xs text-success mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> ↑ 12% vs last year</div>
        </div>
        <div className="bg-white border-l-4 border-success/40 rounded-lg shadow-sm p-4">
          <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Avg Conversion Rate</div>
          <div className="text-3xl font-bold text-navy">{convRate}%</div>
          <div className="text-xs text-slate mt-1">Admissions / Referrals</div>
        </div>
        <div className="bg-white border-l-4 border-sunrise-amber/40 rounded-lg shadow-sm p-4">
          <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Avg Time to Admit</div>
          <div className="text-3xl font-bold text-navy">2.4d</div>
          <div className="text-xs text-slate mt-1">From first contact</div>
        </div>
        <div className="bg-navy rounded-lg shadow-sm p-4 text-white">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Est. Revenue (YTD)</div>
          <div className="text-3xl font-bold flex items-center gap-1"><DollarSign className="w-5 h-5 text-success" />{revenueM}M</div>
          <div className="text-xs text-slate-400 mt-1">From referred admissions</div>
        </div>
      </div>

      {/* AI BD insight */}
      <div className="bg-gradient-to-r from-sunrise-orange/10 to-transparent border border-sunrise-orange/25 rounded-xl p-5 flex items-start gap-4">
        <div className="bg-sunrise-orange p-2.5 rounded-full shadow text-white flex-none">
          <PhoneCall className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-navy text-base flex items-center gap-2">AI Business Development Alert</div>
          <p className="text-slate text-sm mt-1 leading-relaxed">
            <strong className="text-navy">Dr. Peterson Clinic</strong> referred 8 patients in Q1 but has sent <strong className="text-critical">0 referrals in 47 days.</strong>
            Consider a targeted outreach call — suggest scheduling a lunch & learn about the updated Opioid Use Disorder programming.
          </p>
          <div className="flex gap-3 mt-3">
            <button className="text-sm font-bold text-sunrise-orange hover:underline flex items-center gap-1">
              Log Outreach <ArrowRight className="w-4 h-4" />
            </button>
            <button className="text-sm font-bold text-slate hover:text-navy flex items-center gap-1">
              Dismiss
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-border">
          {(['Pipeline', 'Partners', 'Analytics', 'Outreach', 'Outcomes', 'ROI Analysis'] as ViewTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-sunrise-orange text-sunrise-orange bg-sunrise-orange/5'
                  : 'border-transparent text-slate hover:text-navy hover:bg-slate-50'
              }`}
            >
              {tab}
              {tab === 'Pipeline' && (
                <span className="ml-2 bg-sunrise-blue text-white text-[10px] px-1.5 py-0.5 rounded-full">{PIPELINE.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Pipeline Kanban ─── */}
        {activeTab === 'Pipeline' && (
          <div className="p-5 overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {STAGES.map(stage => {
                const items = PIPELINE.filter(p => p.status === stage);
                return (
                  <div key={stage} className="w-60 flex flex-col">
                    <div className={`rounded-t-lg px-3 py-2 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-between ${STAGE_HEADER[stage]}`}>
                      {stage}
                      <span className="bg-white/25 text-white px-1.5 py-0.5 rounded-full text-[10px]">{items.length}</span>
                    </div>
                    <div className={`flex-1 min-h-[280px] rounded-b-lg border ${STAGE_COLORS[stage]} p-2 space-y-2`}>
                      {items.map(item => <KanbanCard key={item.id} item={item} />)}
                      {items.length === 0 && (
                        <div className="flex items-center justify-center h-24 text-border text-2xl">+</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Partners Table ─── */}
        {activeTab === 'Partners' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-bg text-slate-light font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4 pl-6">Source / Organization</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4 text-center">Referrals</th>
                  <th className="p-4 text-center">Admitted</th>
                  <th className="p-4 text-center">Conversion</th>
                  <th className="p-4 text-center">Avg LOS</th>
                  <th className="p-4">Last Referral</th>
                  <th className="p-4">Status</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_REFERRALS.map(r => (
                  <React.Fragment key={r.id}>
                    <tr
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setExpandedSource(expandedSource === r.id ? null : r.id)}
                    >
                      <td className="p-4 pl-6">
                        <div className="font-bold text-navy">{r.source}</div>
                        <div className="text-[10px] text-slate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> Nashville, TN
                        </div>
                      </td>
                      <td className="p-4 text-slate">{r.contact}</td>
                      <td className="p-4 text-center font-bold text-navy">{r.sent}</td>
                      <td className="p-4 text-center font-bold text-success">{r.admitted}</td>
                      <td className="p-4 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${Number(r.conversion) >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {r.conversion}
                        </span>
                      </td>
                      <td className="p-4 text-center font-medium text-slate">{r.avgLos}d</td>
                      <td className="p-4 text-slate text-xs">{r.lastDate}</td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                          r.status === 'Active' ? 'bg-green-100 text-green-700' :
                          r.status === 'At Risk' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate'
                        }`}>{r.status}</span>
                      </td>
                      <td className="p-4">
                        {expandedSource === r.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </td>
                    </tr>
                    {expandedSource === r.id && (
                      <tr>
                        <td colSpan={9} className="bg-slate-50 border-t border-border p-4">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Contact Info</div>
                              <div className="flex items-center gap-1.5 text-slate mb-1"><Phone className="w-3 h-3" /> (615) 555-0192</div>
                              <div className="flex items-center gap-1.5 text-slate"><Mail className="w-3 h-3" /> {r.contact.split(' ')[0].toLowerCase()}@partner.org</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Top Programs Referred</div>
                              <div className="flex gap-2 flex-wrap">
                                {['Residential', 'PHP'].map(p => <span key={p} className="text-[10px] bg-slate-100 text-slate px-2 py-0.5 rounded">{p}</span>)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Actions</div>
                              <div className="flex gap-2">
                                <LockedButton locked={readOnly} className="px-3 py-1.5 bg-sunrise-blue text-white text-xs font-semibold rounded hover:bg-sunrise-blue-light">Log Outreach</LockedButton>
                                <button className="px-3 py-1.5 border border-border text-slate text-xs font-semibold rounded hover:bg-white">View Notes</button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Analytics ─── */}
        {activeTab === 'Analytics' && (
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-bold text-slate uppercase tracking-wider mb-3">Monthly Referrals vs Admissions (12mo)</div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MONTHLY_TREND}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, backgroundColor: '#0F172A', border: 'none', color: '#fff' }} />
                      <Line type="monotone" name="Referrals" dataKey="referrals" stroke="#1e5fa8" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" name="Admissions" dataKey="admits" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate uppercase tracking-wider mb-3">Referrals by Source (YTD)</div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={SOURCE_VOLUME} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="source" tick={{ fontSize: 10, fill: '#64748B' }} width={110} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, backgroundColor: '#0F172A', border: 'none', color: '#fff' }} />
                      <Bar dataKey="referrals" fill="#1e5fa8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Outreach Log ─── */}
        {activeTab === 'Outreach' && (
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-bold text-navy">Outreach Activity Log</div>
              <LockedButton locked={readOnly} className="flex items-center gap-2 bg-sunrise-blue text-white px-3 py-2 rounded text-xs font-semibold hover:bg-sunrise-blue-light">
                <Plus className="w-3.5 h-3.5" /> Log Outreach
              </LockedButton>
            </div>
            <div className="space-y-3">
              {OUTREACH_LOG.map(o => (
                <div key={o.id} className={`border rounded-lg p-4 ${o.outcome === 'At Risk' ? 'bg-red-50 border-red-200' : 'bg-white border-border'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-navy text-sm">{o.source}</span>
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate px-2 py-0.5 rounded">{o.type}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${OUTCOME_COLORS[o.outcome]}`}>{o.outcome}</span>
                      </div>
                      <div className="text-xs text-slate mb-1">{o.contact} · <Calendar className="w-3 h-3 inline" /> {o.date}</div>
                      <p className="text-sm text-navy leading-relaxed">{o.note}</p>
                    </div>
                    <button className="text-sunrise-blue text-xs font-medium hover:underline flex-none">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Outcomes' && (
          <div className="space-y-5">
            <div className="text-sm text-slate">Post-admission outcomes for referred patients — measures referral source quality and ongoing partnership ROI.</div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Completion Rate (Referred)', value: '72%', color: 'text-green-600', sub: 'vs 64% self-referred' },
                { label: 'Average LOS (Referred)', value: '24d', color: 'text-blue-600', sub: 'vs 19d non-referred' },
                { label: '90-Day Sobriety', value: '67%', color: 'text-teal-600', sub: 'Referred patient cohort' },
                { label: 'Re-referral Rate', value: '38%', color: 'text-navy', sub: 'Partners re-refer patients' },
              ].map(k => (
                <div key={k.label} className="card">
                  <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                  <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                  <div className="text-xs text-slate mt-0.5">{k.sub}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Outcomes by Referral Source — Trailing 12 Months</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-gray-50 text-slate">
                    {['Referral Source', 'Admits', 'Avg LOS', 'Completion Rate', '30-Day Sobriety', '90-Day Sobriety', 'Partner Tier'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { source: 'Vanderbilt Medical', admits: 18, los: '27d', comp: '78%', s30: '69%', s90: '64%', tier: 'Platinum' },
                    { source: 'Nashville General ER', admits: 12, los: '22d', comp: '67%', s30: '58%', s90: '53%', tier: 'Gold' },
                    { source: 'Davidson Drug Court', admits: 9, los: '28d', comp: '89%', s30: '78%', s90: '71%', tier: 'Platinum' },
                    { source: 'St. Thomas West ER', admits: 8, los: '19d', comp: '63%', s30: '54%', s90: '48%', tier: 'Silver' },
                    { source: 'Aetna Case Mgmt', admits: 5, los: '21d', comp: '74%', s30: '63%', s90: '57%', tier: 'Gold' },
                    { source: 'Alumni Network', admits: 4, los: '24d', comp: '82%', s30: '74%', s90: '69%', tier: 'Platinum' },
                  ].map(r => (
                    <tr key={r.source} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-navy">{r.source}</td>
                      <td className="px-3 py-2.5 text-center text-slate">{r.admits}</td>
                      <td className="px-3 py-2.5 text-center text-slate">{r.los}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-blue-600">{r.comp}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-teal-600">{r.s30}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-green-600">{r.s90}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.tier === 'Platinum' ? 'bg-purple-100 text-purple-700' : r.tier === 'Gold' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-slate'}`}>{r.tier}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ROI Analysis' && (
          <div className="space-y-5">
            <div className="text-sm text-slate">Return-on-investment analysis for referral relationships — cost per admit, revenue attributed, and outreach program efficiency.</div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Avg Cost per Admit', value: '$420', color: 'text-navy', sub: 'All referral sources blended' },
                { label: 'Revenue per Referred Admit', value: '$18,240', color: 'text-green-600', sub: 'Avg 28-day Residential stay' },
                { label: 'Outreach ROI (YTD)', value: '43×', color: 'text-teal-600', sub: 'Revenue / outreach spend' },
                { label: 'Top ROI Source', value: 'ER Liaisons', color: 'text-blue-600', sub: '$210 avg cost per admit' },
              ].map(k => (
                <div key={k.label} className="card">
                  <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                  <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                  <div className="text-xs text-slate mt-0.5">{k.sub}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">ROI by Referral Source — YTD</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    {['Source', 'Admits', 'Outreach Spend', 'Cost / Admit', 'Revenue Attributed', 'ROI', 'Avg LOS', 'Completion %'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { source: 'ER Liaisons', admits: 38, spend: '$7,980', cpa: '$210', rev: '$692,800', roi: '86×', los: '29d', comp: '74%' },
                    { source: 'Physician Referrals', admits: 27, spend: '$8,100', cpa: '$300', rev: '$492,400', roi: '60×', los: '27d', comp: '70%' },
                    { source: 'Court / Drug Court', admits: 19, spend: '$9,500', cpa: '$500', rev: '$346,500', roi: '36×', los: '31d', comp: '79%' },
                    { source: 'Detox Partners', admits: 22, spend: '$7,700', cpa: '$350', rev: '$401,200', roi: '52×', los: '28d', comp: '68%' },
                    { source: 'Insurance EAP', admits: 14, spend: '$8,400', cpa: '$600', rev: '$255,400', roi: '30×', los: '26d', comp: '64%' },
                    { source: 'Digital / Web', admits: 11, spend: '$12,100', cpa: '$1,100', rev: '$200,600', roi: '16×', los: '25d', comp: '60%' },
                    { source: 'Self / Family', admits: 16, spend: '$0', cpa: '$0', rev: '$291,800', roi: '∞', los: '27d', comp: '66%' },
                  ].map(r => (
                    <tr key={r.source} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-navy">{r.source}</td>
                      <td className="px-3 py-2 text-center text-slate">{r.admits}</td>
                      <td className="px-3 py-2 text-slate">{r.spend}</td>
                      <td className="px-3 py-2 text-slate">{r.cpa}</td>
                      <td className="px-3 py-2 font-semibold text-green-700">{r.rev}</td>
                      <td className="px-3 py-2 font-bold text-teal-700">{r.roi}</td>
                      <td className="px-3 py-2 text-slate">{r.los}</td>
                      <td className="px-3 py-2 text-navy">{r.comp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
