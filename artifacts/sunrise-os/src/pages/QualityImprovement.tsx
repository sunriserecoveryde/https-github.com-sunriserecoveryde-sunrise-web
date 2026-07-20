import React, { useState } from 'react';
import { Screen } from '../App';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type IndicatorStatus = 'Met' | 'Not Met' | 'At Risk' | 'N/A';

interface QIIndicator {
  standard: string;
  indicator: string;
  target: number;
  current: number;
  unit: string;
  status: IndicatorStatus;
  trend: 'up' | 'down' | 'flat';
  category: 'Documentation' | 'Clinical' | 'Safety' | 'Compliance' | 'Outcomes';
}

const QI_INDICATORS: QIIndicator[] = [
  // Documentation
  { standard: 'CARF 3.A.8', indicator: 'Progress Note Within 24h of Session', target: 95, current: 94, unit: '%', status: 'At Risk', trend: 'up', category: 'Documentation' },
  { standard: 'CARF 3.A.9', indicator: 'Treatment Plan Within 72h of Admission', target: 100, current: 100, unit: '%', status: 'Met', trend: 'flat', category: 'Documentation' },
  { standard: 'CMS §482', indicator: 'Co-sign Turnaround ≤48 Hours', target: 95, current: 91, unit: '%', status: 'At Risk', trend: 'up', category: 'Documentation' },
  { standard: 'CARF 3.A.12', indicator: 'Treatment Plan Review Every 7 Days', target: 100, current: 97, unit: '%', status: 'At Risk', trend: 'up', category: 'Documentation' },
  { standard: 'CARF 4.B', indicator: 'Discharge Summary Within 5 Business Days', target: 90, current: 96, unit: '%', status: 'Met', trend: 'up', category: 'Documentation' },
  // Clinical
  { standard: 'SAMHSA Best Practice', indicator: 'ASAM Assessment Within 24h of Admission', target: 100, current: 100, unit: '%', status: 'Met', trend: 'flat', category: 'Clinical' },
  { standard: 'ASAM Criteria', indicator: 'COWS Completion for Opioid Patients', target: 100, current: 100, unit: '%', status: 'Met', trend: 'flat', category: 'Clinical' },
  { standard: 'CARF 3.D.1', indicator: 'Group Attendance ≥80% Scheduled Sessions', target: 80, current: 87, unit: '%', status: 'Met', trend: 'up', category: 'Clinical' },
  { standard: 'SAMHSA TIP 63', indicator: 'MAT Offered to Eligible OUD Patients', target: 100, current: 100, unit: '%', status: 'Met', trend: 'flat', category: 'Clinical' },
  { standard: 'CARF 3.E.2', indicator: 'Family Involvement Assessment ≤72h', target: 90, current: 83, unit: '%', status: 'Not Met', trend: 'up', category: 'Clinical' },
  // Safety
  { standard: 'TJC NPSG.01.01.01', indicator: 'Patient Identification — Correct Process', target: 100, current: 100, unit: '%', status: 'Met', trend: 'flat', category: 'Safety' },
  { standard: 'CARF 3.J', indicator: 'UA Drug Screen Weekly Compliance', target: 90, current: 96, unit: '%', status: 'Met', trend: 'up', category: 'Safety' },
  { standard: 'TJC NPSG.15.01.01', indicator: 'Suicide/SI Risk Screening on Admission', target: 100, current: 100, unit: '%', status: 'Met', trend: 'flat', category: 'Safety' },
  { standard: 'CMS Condition', indicator: 'Incident Report Within 24h of Event', target: 100, current: 100, unit: '%', status: 'Met', trend: 'flat', category: 'Safety' },
  { standard: 'CARF 5.B', indicator: 'Emergency Drill Documented Quarterly', target: 100, current: 75, unit: '%', status: 'Not Met', trend: 'flat', category: 'Safety' },
  // Compliance
  { standard: '42 CFR Part 2', indicator: 'Consent Documentation Before Disclosure', target: 100, current: 100, unit: '%', status: 'Met', trend: 'flat', category: 'Compliance' },
  { standard: 'HIPAA §164.308', indicator: 'Staff HIPAA Training Current', target: 100, current: 92, unit: '%', status: 'At Risk', trend: 'up', category: 'Compliance' },
  { standard: 'CARF 7.A', indicator: 'Personnel File Compliance', target: 100, current: 100, unit: '%', status: 'Met', trend: 'flat', category: 'Compliance' },
  { standard: 'DEA 1304', indicator: 'Controlled Substance Count Daily', target: 100, current: 100, unit: '%', status: 'Met', trend: 'flat', category: 'Compliance' },
  { standard: 'CARF 1.A.3', indicator: 'Mission/Ethics Review Annual', target: 100, current: 100, unit: '%', status: 'Met', trend: 'flat', category: 'Compliance' },
  // Outcomes
  { standard: 'CARF 4.D.1', indicator: 'Treatment Completion Rate', target: 75, current: 81, unit: '%', status: 'Met', trend: 'up', category: 'Outcomes' },
  { standard: 'SAMHSA NOMs', indicator: '30-Day Follow-up Contact Rate', target: 75, current: 82, unit: '%', status: 'Met', trend: 'up', category: 'Outcomes' },
  { standard: 'CARF 4.D.2', indicator: 'Significant Other Involvement Rate', target: 60, current: 55, unit: '%', status: 'Not Met', trend: 'up', category: 'Outcomes' },
  { standard: 'SAMHSA NOMs', indicator: 'Recovery Housing Referral on Discharge', target: 80, current: 83, unit: '%', status: 'Met', trend: 'up', category: 'Outcomes' },
  { standard: 'CARF 4.E', indicator: 'Client Satisfaction Score ≥4.0/5.0', target: 80, current: 92, unit: '%', status: 'Met', trend: 'up', category: 'Outcomes' },
];

const DOCUMENTATION_TREND = [
  { month: 'Feb', notes: 91, cosign: 87, txplan: 96 },
  { month: 'Mar', notes: 92, cosign: 88, txplan: 97 },
  { month: 'Apr', notes: 93, cosign: 89, txplan: 98 },
  { month: 'May', notes: 93, cosign: 90, txplan: 99 },
  { month: 'Jun', notes: 94, cosign: 90, txplan: 100 },
  { month: 'Jul', notes: 94, cosign: 91, txplan: 100 },
];

const CARF_RADAR = [
  { category: 'Documentation', score: 94 },
  { category: 'Clinical Services', score: 94 },
  { category: 'Safety', score: 95 },
  { category: 'Compliance', score: 98 },
  { category: 'Outcomes', score: 87 },
  { category: 'Governance', score: 100 },
];

const STATUS_STYLE: Record<IndicatorStatus, string> = {
  'Met':     'bg-green-100 text-green-700',
  'Not Met': 'bg-red-100 text-red-700',
  'At Risk': 'bg-amber-100 text-amber-700',
  'N/A':     'bg-gray-100 text-gray-500',
};

const STATUS_ICON = {
  'Met':     <CheckCircle className="w-3.5 h-3.5" />,
  'Not Met': <XCircle className="w-3.5 h-3.5" />,
  'At Risk': <AlertTriangle className="w-3.5 h-3.5" />,
  'N/A':     null,
};

const CATEGORIES = ['All', 'Documentation', 'Clinical', 'Safety', 'Compliance', 'Outcomes'] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_COLORS: Record<string, string> = {
  Documentation: 'bg-blue-100 text-blue-700',
  Clinical:      'bg-purple-100 text-purple-700',
  Safety:        'bg-red-100 text-red-700',
  Compliance:    'bg-green-100 text-green-700',
  Outcomes:      'bg-orange-100 text-orange-700',
};

export function QualityImprovement({ navigate, readOnly }: Props) {
  const [category, setCategory] = useState<Category>('All');
  const [tab, setTab] = useState<'Indicators' | 'Trends' | 'Action Plan' | 'PDSA Cycles' | 'Staff Feedback' | 'Accreditation Prep'>('Indicators');

  const filtered = category === 'All' ? QI_INDICATORS : QI_INDICATORS.filter(i => i.category === category);
  const met = QI_INDICATORS.filter(i => i.status === 'Met').length;
  const notMet = QI_INDICATORS.filter(i => i.status === 'Not Met').length;
  const atRisk = QI_INDICATORS.filter(i => i.status === 'At Risk').length;
  const overall = Math.round(met / QI_INDICATORS.length * 100);

  const ACTION_ITEMS = QI_INDICATORS.filter(i => i.status !== 'Met' && i.status !== 'N/A').map(i => ({
    indicator: i.indicator,
    category: i.category,
    standard: i.standard,
    status: i.status,
    gap: i.target - i.current,
    action: i.status === 'Not Met'
      ? `Immediate corrective action required. Escalate to clinical director. Root cause analysis due within 5 business days.`
      : `Performance improvement plan active. Monitor weekly. Escalate if not met within 30 days.`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Quality Improvement</h1>
          <p className="text-slate text-sm mt-0.5">CARF / Joint Commission compliance indicators · Q3 2026 reporting period</p>
        </div>
        <div className="flex gap-2">
          <button className="border border-border text-slate rounded-lg px-4 py-2 text-sm hover:bg-gray-50">Export Report</button>
          <LockedButton locked={readOnly} className="btn-primary text-sm px-4 py-2">Schedule QI Meeting</LockedButton>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card bg-green-50 border-green-200">
          <div className="text-xs text-slate uppercase font-semibold">Overall Compliance</div>
          <div className="text-4xl font-bold text-green-600 mt-1">{overall}%</div>
          <div className="text-xs text-slate mt-0.5">{met}/{QI_INDICATORS.length} indicators met</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate uppercase font-semibold flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-500" />Met</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{met}</div>
          <div className="text-xs text-slate mt-0.5">Fully compliant</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate uppercase font-semibold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" />At Risk</div>
          <div className="text-3xl font-bold text-amber-600 mt-1">{atRisk}</div>
          <div className="text-xs text-slate mt-0.5">Improvement needed</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate uppercase font-semibold flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-red-500" />Not Met</div>
          <div className="text-3xl font-bold text-red-600 mt-1">{notMet}</div>
          <div className="text-xs text-slate mt-0.5">Corrective action required</div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Indicators', 'Trends', 'Action Plan', 'PDSA Cycles', 'Staff Feedback', 'Accreditation Prep'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>
            {t}
            {t === 'Action Plan' && (ACTION_ITEMS.length > 0) && <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-1.5">{ACTION_ITEMS.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'Indicators' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${category === c ? 'bg-navy text-white border-navy' : 'border-border text-slate hover:bg-gray-50'}`}>
                {c}
                {c !== 'All' && <span className="ml-1 text-[10px] opacity-70">({QI_INDICATORS.filter(i => i.category === c).length})</span>}
              </button>
            ))}
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  {['Standard', 'Indicator', 'Category', 'Target', 'Current', 'Trend', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((ind, i) => (
                  <tr key={i} className={`border-b border-border last:border-0 hover:bg-gray-50 ${ind.status === 'Not Met' ? 'bg-red-50/30' : ind.status === 'At Risk' ? 'bg-amber-50/20' : ''}`}>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate">{ind.standard}</td>
                    <td className="px-4 py-3 text-xs font-medium text-navy max-w-[200px]">{ind.indicator}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[ind.category]}`}>{ind.category}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate">≥{ind.target}{ind.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold font-mono ${ind.current >= ind.target ? 'text-green-600' : ind.current >= ind.target * 0.95 ? 'text-amber-600' : 'text-red-600'}`}>
                        {ind.current}{ind.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ind.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {ind.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                      {ind.trend === 'flat' && <span className="text-slate text-xs">→</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-medium w-fit ${STATUS_STYLE[ind.status]}`}>
                        {STATUS_ICON[ind.status]}
                        {ind.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Trends' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-0.5">CARF Compliance Radar (Q3 2026)</h3>
            <p className="text-xs text-slate mb-3">Score by category — target 100%</p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={CARF_RADAR} cx="50%" cy="50%" outerRadius={80}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 9 }} />
                <Radar dataKey="score" stroke="#E8761A" fill="#E8761A" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`${v}%`, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-0.5">Documentation Compliance (6 Months)</h3>
            <p className="text-xs text-slate mb-3">Progress notes, co-sign turnaround, treatment plan timeliness</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={DOCUMENTATION_TREND} margin={{ left: -20, right: 8, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`${v}%`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="notes" stroke="#E8761A" strokeWidth={2} dot={{ r: 2.5 }} name="Progress Notes" />
                <Line dataKey="cosign" stroke="#3B9ED4" strokeWidth={2} dot={{ r: 2.5 }} name="Co-sign T/A" />
                <Line dataKey="txplan" stroke="#2ECC71" strokeWidth={2} dot={{ r: 2.5 }} name="Tx Plan" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card col-span-2">
            <h3 className="font-semibold text-navy text-sm mb-0.5">Compliance Score by Category (Current vs. Prior Quarter)</h3>
            <p className="text-xs text-slate mb-3">Percentage of indicators met per category</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { category: 'Documentation', current: 83, prior: 78 },
                { category: 'Clinical', current: 94, prior: 89 },
                { category: 'Safety', current: 93, prior: 90 },
                { category: 'Compliance', current: 98, prior: 96 },
                { category: 'Outcomes', current: 87, prior: 82 },
              ]} margin={{ left: -20, right: 8, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`${v}%`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="prior" fill="#94a3b8" radius={[3, 3, 0, 0]} name="Prior Quarter" />
                <Bar dataKey="current" fill="#E8761A" radius={[3, 3, 0, 0]} name="Current Quarter" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Action Plan' && (
        <div className="space-y-3">
          <div className="text-sm text-slate">
            {ACTION_ITEMS.length} indicator{ACTION_ITEMS.length !== 1 ? 's' : ''} require corrective or improvement action.
          </div>
          {ACTION_ITEMS.map((item, i) => (
            <div key={i} className={`card border ${item.status === 'Not Met' ? 'border-red-300 bg-red-50/20' : 'border-amber-300 bg-amber-50/20'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${STATUS_STYLE[item.status as IndicatorStatus]}`}>
                      {item.status === 'Not Met' ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {item.status}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category]}`}>{item.category}</span>
                    <span className="font-mono text-[10px] text-slate">{item.standard}</span>
                  </div>
                  <div className="font-semibold text-navy text-sm mt-1.5">{item.indicator}</div>
                  <div className="text-xs text-slate mt-0.5">
                    Gap: <span className="font-semibold text-red-600">-{item.gap}%</span> below target
                  </div>
                  <div className="mt-2 p-2.5 bg-white rounded-lg border border-border text-xs text-navy">
                    <span className="font-semibold">Required Action:</span> {item.action}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <select className="border border-border rounded-lg px-2 py-1.5 text-xs text-slate">
                    <option>Assign to...</option>
                    <option>James S. Collins III (Clinical Supervisor)</option>
                    <option>Sarah Jenkins (Lead Counselor)</option>
                    <option>Jessica Torres (Charge Nurse)</option>
                    <option>QI Committee</option>
                  </select>
                  <input type="date" className="border border-border rounded-lg px-2 py-1.5 text-xs text-slate" defaultValue="2026-08-19" />
                  <button className="text-xs bg-navy text-white px-3 py-1.5 rounded-lg hover:bg-navy/90">Assign</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'PDSA Cycles' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Plan-Do-Study-Act improvement cycles currently tracked by the QI Committee. Each cycle targets one measurable indicator gap.</div>
          {[
            {
              title: 'Improve Treatment Plan 72h Completion Rate',
              indicator: 'Treatment plan documented within 72h of admission',
              current: '84%', target: '95%', status: 'Study',
              plan: 'Add automated EHR alert at 48h post-admission if treatment plan is missing. Assign backup counselor for high-volume admission days.',
              do: 'Alert deployed July 1. Backup assignment protocol active since July 5.',
              study: 'Two-week post-launch rate: 91% (↑7%). Alert acknowledged in avg 22 min.',
              act: 'Proceeding to full adoption. Adding shift handoff reminder. Targeting 95% by Aug 1.',
              lead: 'Sarah Jenkins, LPC',
              started: '2026-06-15',
              statusColor: 'bg-blue-100 text-blue-700',
            },
            {
              title: 'Reduce Medication Error Rate Below 1%',
              indicator: 'Medication administration error rate',
              current: '1.8%', target: '<1%', status: 'Do',
              plan: 'Implement nurse double-verification for all controlled substance administrations. Barcode scanning at MAR entry.',
              do: 'Pilot launched on Unit 2 (July 8). All nurses trained. Scanner hardware installed.',
              study: 'Pilot data collection ongoing — results expected July 22.',
              act: 'Pending study results before full rollout.',
              lead: 'Jessica Torres, RN',
              started: '2026-07-08',
              statusColor: 'bg-green-100 text-green-700',
            },
            {
              title: 'Increase Group Therapy Attendance to 90%',
              indicator: 'Patient group therapy attendance rate',
              current: '82%', target: '90%', status: 'Act',
              plan: 'Peer accountability system — patients with <75% attendance flagged for counselor check-in. Group topic survey to increase relevance.',
              do: 'Accountability check-ins started June 25. Survey results used for Q3 group schedule.',
              study: 'June avg: 86% (↑4%). Largest gains in Residential track. IOP still at 80%.',
              act: 'Expanded to IOP track July 15. Targeting 90% by Q3 close. Monthly report to QI Committee.',
              lead: 'David Odom, LMFT',
              started: '2026-06-10',
              statusColor: 'bg-purple-100 text-purple-700',
            },
            {
              title: 'Improve 30-Day Readmission Prevention',
              indicator: '30-day unplanned readmission / AMA return rate',
              current: '22%', target: '<15%', status: 'Plan',
              plan: 'Structured aftercare call protocol: 48h, 7d, 30d post-discharge. Assign each patient a peer specialist contact for first 30 days. Warm handoff to outpatient provider required before discharge.',
              do: 'Protocol drafted. Awaiting clinical director approval.',
              study: '—',
              act: '—',
              lead: 'James S. Collins III (Clinical Supervisor)',
              started: '2026-07-15',
              statusColor: 'bg-amber-100 text-amber-700',
            },
          ].map(cycle => (
            <div key={cycle.title} className="card">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cycle.statusColor}`}>Phase: {cycle.status}</span>
                    <span className="text-xs text-slate">Started {cycle.started} · Lead: {cycle.lead}</span>
                  </div>
                  <h3 className="font-semibold text-navy">{cycle.title}</h3>
                  <div className="text-xs text-slate mt-0.5">Indicator: {cycle.indicator} — Current: <span className="font-semibold text-red-600">{cycle.current}</span> → Target: <span className="font-semibold text-green-600">{cycle.target}</span></div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 text-xs">
                {[
                  { phase: '📋 PLAN', text: cycle.plan, active: cycle.status === 'Plan' },
                  { phase: '⚙️ DO', text: cycle.do, active: cycle.status === 'Do' },
                  { phase: '🔬 STUDY', text: cycle.study, active: cycle.status === 'Study' },
                  { phase: '✅ ACT', text: cycle.act, active: cycle.status === 'Act' },
                ].map(p => (
                  <div key={p.phase} className={`p-3 rounded-lg border ${p.active ? 'bg-navy/5 border-navy/20' : 'bg-gray-50 border-border'}`}>
                    <div className={`font-bold mb-1.5 ${p.active ? 'text-navy' : 'text-slate'}`}>{p.phase}</div>
                    <div className={p.text === '—' ? 'text-slate/40 italic' : 'text-slate leading-relaxed'}>{p.text}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'Staff Feedback' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Aggregated staff feedback on quality processes — identifying barriers, suggestions, and department-level QI engagement.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Feedback Submissions (Q2)', value: 47, color: 'text-navy', sub: '68% response rate' },
              { label: 'High-Priority Issues', value: 4, color: 'text-red-600', sub: 'Escalated to leadership' },
              { label: 'Ideas Under Review', value: 11, color: 'text-amber-600', sub: 'QI committee queue' },
              { label: 'Implemented This Quarter', value: 6, color: 'text-green-600', sub: 'Staff-originated improvements' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Recent Feedback Themes (Q2 2026)</h3>
              <div className="space-y-3 text-xs">
                {[
                  { theme: 'Documentation Burden', count: 14, pct: 30, color: 'bg-red-500', action: 'Note template simplification in progress' },
                  { theme: 'Staffing & Ratios', count: 11, pct: 23, color: 'bg-amber-500', action: 'Under review with HR — Q3 hiring plan' },
                  { theme: 'Communication / Handoffs', count: 9, pct: 19, color: 'bg-orange-500', action: 'Shift handoff SBAR template piloted' },
                  { theme: 'Group Room Scheduling', count: 7, pct: 15, color: 'bg-blue-500', action: 'New weekly group matrix implemented' },
                  { theme: 'Patient Safety Concerns', count: 4, pct: 9, color: 'bg-purple-500', action: 'Incident review committee addressing' },
                  { theme: 'Other / Positive', count: 2, pct: 4, color: 'bg-green-500', action: '—' },
                ].map(t => (
                  <div key={t.theme}>
                    <div className="flex justify-between mb-0.5">
                      <span className="font-medium text-navy">{t.theme}</span>
                      <span className="text-slate">{t.count} ({t.pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full mb-1">
                      <div className={`h-2 rounded-full ${t.color}`} style={{ width: `${t.pct * 2.5}%` }} />
                    </div>
                    <div className="text-[10px] text-slate italic">Action: {t.action}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Staff-Suggested Improvements — Under Review</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { idea: 'Dedicated 15-minute peer-to-peer consult time built into counselor schedules', dept: 'Clinical', status: 'In Review', sColor: 'bg-blue-100 text-blue-700' },
                    { idea: 'QR code on patient whiteboards for nursing to quick-log vitals', dept: 'Nursing', status: 'Piloting', sColor: 'bg-teal-100 text-teal-700' },
                    { idea: 'Family session reminder automated via text 48h before appointment', dept: 'Case Mgmt', status: 'Approved', sColor: 'bg-green-100 text-green-700' },
                    { idea: 'Anonymous weekly staff sentiment pulse survey (3 questions)', dept: 'HR', status: 'In Review', sColor: 'bg-blue-100 text-blue-700' },
                    { idea: 'Rotate group facilitation assignments to reduce burnout', dept: 'Clinical', status: 'Implemented', sColor: 'bg-green-100 text-green-700' },
                    { idea: 'Standing agenda item: "near miss" debrief in weekly clinical meeting', dept: 'Quality', status: 'Implemented', sColor: 'bg-green-100 text-green-700' },
                  ].map(s => (
                    <div key={s.idea} className="border border-border rounded p-2.5">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-slate flex-1">{s.idea}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${s.sColor}`}>{s.status}</span>
                      </div>
                      <div className="text-[10px] text-slate">Dept: {s.dept}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Accreditation Prep' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">CARF accreditation preparation checklist — document readiness, survey findings remediation, and pre-survey mock audit status.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Standards Met', value: '94%', color: 'text-green-600', sub: 'Of applicable CARF standards' },
              { label: 'Findings Under Remediation', value: 3, color: 'text-amber-600', sub: 'From 2024 survey cycle' },
              { label: 'Documents Ready', value: '89%', color: 'text-blue-600', sub: '142 of 160 required docs' },
              { label: 'Next Survey Window', value: '2027', color: 'text-navy', sub: '3-Year cycle · ~18 months out' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">CARF Domain Readiness — Current Status</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { domain: 'Section 1 — Aspiring to Excellence', pct: 98, status: 'Ready', color: 'bg-green-500', sColor: 'text-green-700' },
                  { domain: 'Section 2 — Leadership', pct: 96, status: 'Ready', color: 'bg-green-500', sColor: 'text-green-700' },
                  { domain: 'Section 3 — Strategic Management', pct: 92, status: 'Ready', color: 'bg-green-500', sColor: 'text-green-700' },
                  { domain: 'Section 4 — Input from Persons Served', pct: 88, status: 'In Progress', color: 'bg-blue-500', sColor: 'text-blue-700' },
                  { domain: 'Section 5 — Rights of Persons Served', pct: 97, status: 'Ready', color: 'bg-green-500', sColor: 'text-green-700' },
                  { domain: 'Section 6 — Service Delivery', pct: 91, status: 'In Progress', color: 'bg-blue-500', sColor: 'text-blue-700' },
                  { domain: 'Section 7 — Health & Safety', pct: 95, status: 'Ready', color: 'bg-green-500', sColor: 'text-green-700' },
                  { domain: 'CORE — SUD Residential Services', pct: 89, status: 'In Progress', color: 'bg-amber-500', sColor: 'text-amber-700' },
                ].map(d => (
                  <div key={d.domain}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate">{d.domain}</span>
                      <div className="flex gap-2 items-center">
                        <span className={`text-[9px] font-bold ${d.sColor}`}>{d.status}</span>
                        <span className="font-semibold text-navy">{d.pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${d.color}`} style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Open 2024 Survey Findings</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { finding: 'F.1 — Person-Centered Planning documentation format not consistently individualized', remediation: 'New treatment plan template deployed July 2026; staff training completed', due: '2026-09-01', status: 'On Track' },
                    { finding: 'F.2 — Satisfaction survey frequency below CARF minimum (quarterly required)', remediation: 'Automated quarterly survey schedule implemented; first cycle Aug 2026', due: '2026-08-15', status: 'On Track' },
                    { finding: 'F.3 — Emergency drill documentation missing for Q2 2024', remediation: 'Retroactive documentation submitted; ongoing drill log system now in place', due: '2026-07-31', status: 'At Risk' },
                  ].map(f => (
                    <div key={f.finding} className={`border rounded-lg p-2.5 ${f.status === 'At Risk' ? 'border-amber-300 bg-amber-50' : 'border-border'}`}>
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-semibold text-navy">{f.finding}</span>
                        <span className={`shrink-0 ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${f.status === 'At Risk' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{f.status}</span>
                      </div>
                      <div className="text-slate">{f.remediation}</div>
                      <div className="text-[10px] text-slate mt-0.5">Due: {f.due}</div>
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
