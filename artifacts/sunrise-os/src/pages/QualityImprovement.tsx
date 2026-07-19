import React, { useState } from 'react';
import { Screen } from '../App';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

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

export function QualityImprovement({ navigate }: Props) {
  const [category, setCategory] = useState<Category>('All');
  const [tab, setTab] = useState<'Indicators' | 'Trends' | 'Action Plan'>('Indicators');

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
          <button className="btn-primary text-sm px-4 py-2">Schedule QI Meeting</button>
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
        {(['Indicators', 'Trends', 'Action Plan'] as const).map(t => (
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
                    <option>Dr. James Carter (Clinical Director)</option>
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
    </div>
  );
}
