import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type UaStatus = 'Negative' | 'Positive' | 'Missed' | 'Pending' | 'Refused' | 'N/A';

interface UaResult {
  patientId: string;
  date: string;
  status: UaStatus;
  substances?: string[];
  collectedBy?: string;
  witnessedBy?: string;
  chainOfCustody?: string;
  ordered?: 'Random' | 'Scheduled' | 'Triggered';
}

// Patients requiring UA monitoring (Residential + PHP)
const monitored = MOCK_PATIENTS.filter(p => p.program === 'Residential' || p.program === 'PHP');

const DAYS = ['Mon 7/14', 'Tue 7/15', 'Wed 7/16', 'Thu 7/17', 'Fri 7/18', 'Sat 7/19', 'Sun 7/20'];

// Generate realistic UA schedule for the week
const SCHEDULE: Record<string, Record<string, UaStatus>> = {};
const DETAIL_MAP: Record<string, Record<string, UaResult>> = {};

monitored.forEach((p, idx) => {
  SCHEDULE[p.id] = {};
  DETAIL_MAP[p.id] = {};
  DAYS.forEach((day, di) => {
    // Residential: daily. PHP: 3x/week (M/W/F)
    if (p.program === 'PHP' && ![0, 2, 4].includes(di)) {
      SCHEDULE[p.id][day] = 'N/A';
      return;
    }
    let status: UaStatus;
    if (di === 6) { status = 'Pending'; }
    else if (p.lastUa && p.lastUa !== 'Negative' && di === 4) {
      // Show their positive on Friday
      status = 'Positive';
      DETAIL_MAP[p.id][day] = {
        patientId: p.id, date: day, status: 'Positive',
        substances: p.lastUa.replace('Positive (', '').replace(')', '').split(', '),
        collectedBy: 'Jessica Torres, RN', witnessedBy: 'Kevin Wright, BHT',
        chainOfCustody: `COC-${10000 + idx * 7 + di}`, ordered: idx % 3 === 0 ? 'Random' : 'Scheduled',
      };
    } else if (idx % 7 === 2 && di === 2) {
      status = 'Refused';
    } else if (idx % 11 === 3 && di === 1) {
      status = 'Missed';
    } else {
      status = 'Negative';
      DETAIL_MAP[p.id][day] = {
        patientId: p.id, date: day, status: 'Negative',
        collectedBy: 'Jessica Torres, RN', witnessedBy: 'Kevin Wright, BHT',
        chainOfCustody: `COC-${10000 + idx * 7 + di}`, ordered: di % 4 === 0 ? 'Random' : 'Scheduled',
      };
    }
    SCHEDULE[p.id][day] = status;
  });
});

const STATUS_STYLE: Record<UaStatus, string> = {
  Negative: 'bg-green-100 text-green-700 border-green-200',
  Positive: 'bg-red-100 text-red-700 border-red-200 font-bold',
  Missed:   'bg-gray-100 text-gray-500 border-gray-200',
  Pending:  'bg-blue-100 text-blue-600 border-blue-200',
  Refused:  'bg-orange-100 text-orange-700 border-orange-200',
  'N/A':    'bg-gray-50 text-gray-300 border-gray-100',
};

const COMPLIANCE_TREND = [
  { week: 'W1 Jun', compliance: 96, positivity: 4 },
  { week: 'W2 Jun', compliance: 94, positivity: 6 },
  { week: 'W3 Jun', compliance: 97, positivity: 3 },
  { week: 'W4 Jun', compliance: 91, positivity: 8 },
  { week: 'W1 Jul', compliance: 95, positivity: 5 },
  { week: 'W2 Jul', compliance: 93, positivity: 7 },
  { week: 'W3 Jul', compliance: 94, positivity: 6 },
  { week: 'W4 Jul', compliance: 96, positivity: 4 },
];

const SUBSTANCE_BREAKDOWN = [
  { substance: 'Opioids', count: 3 },
  { substance: 'METH', count: 2 },
  { substance: 'BUP (MAT)', count: 4 },
  { substance: 'Alcohol', count: 1 },
  { substance: 'THC', count: 1 },
  { substance: 'Cocaine', count: 1 },
  { substance: 'Benzo', count: 1 },
];

// ── Workflow types & seed data ────────────────────────────────────────────────

type WorkflowStage = 'Ordered' | 'Specimen Collected' | 'Lab Pending' | 'Results Received' | 'Reconciliation' | 'Under Review' | 'Final Resolution';

interface WorkflowItem {
  id: string;
  patientName: string;
  patientId: string;
  testType: string;
  panel: string;
  orderedBy: string;
  orderedAt: string;
  stage: WorkflowStage;
  timestamps: Partial<Record<WorkflowStage, string>>;
  clinicalJudgment?: string;
}

const WORKFLOW_STAGES: WorkflowStage[] = ['Ordered', 'Specimen Collected', 'Lab Pending', 'Results Received', 'Reconciliation', 'Under Review', 'Final Resolution'];

const NEXT_STAGE: Partial<Record<WorkflowStage, WorkflowStage>> = {
  'Ordered': 'Specimen Collected',
  'Specimen Collected': 'Lab Pending',
  'Lab Pending': 'Results Received',
  'Results Received': 'Reconciliation',
  'Reconciliation': 'Under Review',
  'Under Review': 'Final Resolution',
};

const STAGE_ACTION: Partial<Record<WorkflowStage, string>> = {
  'Ordered': 'Collect Specimen',
  'Specimen Collected': 'Send to Lab',
  'Lab Pending': 'Enter Results',
  'Results Received': 'Begin Reconciliation',
  'Reconciliation': 'Submit for Review',
  'Under Review': 'Finalize',
};

const STAGE_COLOR: Record<WorkflowStage, string> = {
  'Ordered': 'bg-blue-50 border-blue-200',
  'Specimen Collected': 'bg-sky-50 border-sky-200',
  'Lab Pending': 'bg-violet-50 border-violet-200',
  'Results Received': 'bg-amber-50 border-amber-200',
  'Reconciliation': 'bg-orange-50 border-orange-200',
  'Under Review': 'bg-rose-50 border-rose-200',
  'Final Resolution': 'bg-green-50 border-green-200',
};

const STAGE_HEADER: Record<WorkflowStage, string> = {
  'Ordered': 'bg-blue-100 text-blue-800',
  'Specimen Collected': 'bg-sky-100 text-sky-800',
  'Lab Pending': 'bg-violet-100 text-violet-800',
  'Results Received': 'bg-amber-100 text-amber-800',
  'Reconciliation': 'bg-orange-100 text-orange-800',
  'Under Review': 'bg-rose-100 text-rose-800',
  'Final Resolution': 'bg-green-100 text-green-800',
};

const INIT_WORKFLOW: WorkflowItem[] = [
  {
    id: 'WF-001', patientName: 'Marcus Webb', patientId: 'p1',
    testType: 'Triggered (Suspicion)', panel: '10-Panel Standard', orderedBy: 'Dr. Robert Chen',
    orderedAt: '2026-07-18 09:14', stage: 'Lab Pending',
    timestamps: { Ordered: '07/18 09:14', 'Specimen Collected': '07/18 10:02', 'Lab Pending': '07/18 10:45' },
  },
  {
    id: 'WF-002', patientName: 'Samantha Choi', patientId: 'p2',
    testType: 'Scheduled', panel: '10-Panel Standard', orderedBy: 'Dr. Emily Stone',
    orderedAt: '2026-07-18 08:00', stage: 'Results Received',
    timestamps: { Ordered: '07/18 08:00', 'Specimen Collected': '07/18 08:45', 'Lab Pending': '07/18 09:30', 'Results Received': '07/19 11:20' },
  },
  {
    id: 'WF-003', patientName: 'Patricia Holloway', patientId: 'p3',
    testType: 'Random', panel: '12-Panel Extended', orderedBy: 'Dr. Robert Chen',
    orderedAt: '2026-07-17 14:30', stage: 'Under Review',
    timestamps: { Ordered: '07/17 14:30', 'Specimen Collected': '07/17 15:10', 'Lab Pending': '07/17 15:55', 'Results Received': '07/18 13:00', Reconciliation: '07/18 14:00', 'Under Review': '07/19 09:00' },
  },
  {
    id: 'WF-004', patientName: 'James Thornton', patientId: 'p4',
    testType: 'Scheduled', panel: '10-Panel Standard', orderedBy: 'Dr. Allen Hughes',
    orderedAt: '2026-07-19 08:00', stage: 'Ordered',
    timestamps: { Ordered: '07/19 08:00' },
  },
  {
    id: 'WF-005', patientName: 'Devon Patel', patientId: 'p5',
    testType: 'Scheduled', panel: '10-Panel Standard', orderedBy: 'Dr. Emily Stone',
    orderedAt: '2026-07-16 08:00', stage: 'Final Resolution',
    timestamps: { Ordered: '07/16 08:00', 'Specimen Collected': '07/16 08:40', 'Lab Pending': '07/16 09:20', 'Results Received': '07/17 10:10', Reconciliation: '07/17 11:00', 'Under Review': '07/17 13:30', 'Final Resolution': '07/18 09:00' },
    clinicalJudgment: "Negative result consistent with current MAT compliance. No clinical concern. Continue current monitoring schedule.",
  },
];

export function UADrugTesting({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Schedule' | 'Workflow' | 'History' | 'Analytics' | 'Chain of Custody' | 'Positive Results' | 'Panel Reference' | 'Lab Partners'>('Schedule');
  const [selectedCell, setSelectedCell] = useState<UaResult | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [workflowItems, setWorkflowItems] = useState<WorkflowItem[]>(INIT_WORKFLOW);
  const [judgmentFor, setJudgmentFor] = useState<string | null>(null);
  const [judgmentText, setJudgmentText] = useState('');
  const [orderPatient, setOrderPatient] = useState(monitored[0]?.id ?? '');
  const [orderType, setOrderType] = useState('Scheduled');
  const [orderPanel, setOrderPanel] = useState('10-Panel Standard');
  const [orderBy, setOrderBy] = useState('Dr. Robert Chen');
  const [orderRationale, setOrderRationale] = useState('');
  const [orderMethod, setOrderMethod] = useState('Observed');
  const [wfSaved, setWFSaved] = useState<string | null>(null);
  const saveWFAction = (msg: string) => { setWFSaved(msg); setTimeout(() => setWFSaved(null), 2500); };

  const totalTests = monitored.length * DAYS.filter((_, di) => true).length;
  const negatives = Object.values(SCHEDULE).flatMap(days => Object.values(days)).filter(s => s === 'Negative').length;
  const positives = Object.values(SCHEDULE).flatMap(days => Object.values(days)).filter(s => s === 'Positive').length;
  const missed = Object.values(SCHEDULE).flatMap(days => Object.values(days)).filter(s => s === 'Missed' || s === 'Refused').length;
  const scheduled = Object.values(SCHEDULE).flatMap(days => Object.values(days)).filter(s => s !== 'N/A' && s !== 'Pending').length;
  const complianceRate = Math.round(((scheduled - missed) / scheduled) * 100);
  const positivityRate = Math.round((positives / (negatives + positives)) * 100);

  const recentResults: (UaResult & { patientName: string })[] = [];
  monitored.forEach(p => {
    Object.values(DETAIL_MAP[p.id] ?? {}).forEach(r => {
      recentResults.push({ ...r, patientName: `${p.firstName} ${p.lastName}` });
    });
  });
  recentResults.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">UA / Drug Testing</h1>
          <p className="text-slate text-sm mt-0.5">Urinalysis schedule, results, and compliance tracking</p>
        </div>
        <div className="flex gap-2">
          <LockedButton locked={readOnly} onClick={() => setShowOrderForm(true)} className="btn-primary text-sm px-4 py-2">+ Order UA</LockedButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Compliance Rate (7d)', value: `${complianceRate}%`, sub: `${scheduled - missed} of ${scheduled} tests completed`, color: complianceRate >= 90 ? 'text-green-600' : 'text-red-600' },
          { label: 'Positivity Rate (7d)', value: `${positivityRate}%`, sub: `${positives} positive of ${positives + negatives} results`, color: positivityRate > 10 ? 'text-red-600' : 'text-amber-600' },
          { label: 'Tests This Week', value: String(positives + negatives + missed), sub: `${positives} positive · ${missed} missed/refused`, color: 'text-navy' },
          { label: 'Patients Monitored', value: String(monitored.length), sub: `${monitored.filter(p => p.program === 'Residential').length} Res · ${monitored.filter(p => p.program === 'PHP').length} PHP`, color: 'text-navy' },
        ].map(stat => (
          <div key={stat.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{stat.label}</div>
            <div className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['Schedule', 'Workflow', 'History', 'Analytics', 'Chain of Custody', 'Positive Results', 'Panel Reference', 'Lab Partners'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Schedule' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate">Week of July 20–26, 2026 · Residential (daily) and PHP (M/W/F)</div>
            <div className="flex items-center gap-3 text-xs">
              {Object.entries(STATUS_STYLE).map(([s, cls]) => s !== 'N/A' && (
                <div key={s} className="flex items-center gap-1">
                  <div className={`w-4 h-4 rounded border text-center text-[10px] font-medium flex items-center justify-center ${cls}`}>{s[0]}</div>
                  <span className="text-slate">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-0 overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="text-left px-3 py-2 font-semibold text-slate sticky left-0 bg-gray-50 z-10 min-w-[160px]">Patient</th>
                  <th className="text-center px-1 py-2 font-semibold text-slate min-w-[48px]">Prog</th>
                  {DAYS.map(d => (
                    <th key={d} className={`text-center px-1 py-2 font-semibold text-slate min-w-[70px] ${d.includes('7/19') ? 'bg-orange/5 text-orange' : ''}`}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monitored.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-navy sticky left-0 bg-white z-10 cursor-pointer hover:text-orange"
                      onClick={() => navigate('PatientDetail', p.id)}>
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="text-center px-1 py-2">
                      <span className={`text-[10px] px-1 rounded font-medium ${p.program === 'Residential' ? 'bg-navy text-white' : 'bg-blue-100 text-blue-700'}`}>
                        {p.program === 'Residential' ? 'Res' : 'PHP'}
                      </span>
                    </td>
                    {DAYS.map(day => {
                      const status = SCHEDULE[p.id]?.[day] ?? 'N/A';
                      const detail = DETAIL_MAP[p.id]?.[day];
                      return (
                        <td key={day} className={`text-center px-1 py-1.5 ${day.includes('7/19') ? 'bg-orange/5' : ''}`}>
                          <button
                            onClick={() => detail && setSelectedCell(detail)}
                            className={`w-full rounded border py-1 text-[11px] font-medium transition-all ${STATUS_STYLE[status]} ${detail ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                          >
                            {status}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'History' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                {['Date', 'Patient', 'Program', 'Result', 'Substances', 'Type', 'Collected By', 'Chain of Custody'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentResults.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-slate text-xs">{r.date}</td>
                  <td className="px-4 py-2.5 font-medium text-navy text-xs cursor-pointer hover:text-orange"
                    onClick={() => navigate('PatientDetail', r.patientId)}>
                    {r.patientName}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate">
                    {MOCK_PATIENTS.find(p => p.id === r.patientId)?.program}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate">
                    {r.substances?.join(', ') || (r.status === 'Negative' ? 'All negative' : '—')}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.ordered === 'Random' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {r.ordered}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate">{r.collectedBy}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate">{r.chainOfCustody}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-navy mb-1 text-sm">Compliance & Positivity Trend (7 weeks)</h3>
            <p className="text-xs text-slate mb-4">Weekly UA completion rate and positivity rate</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={COMPLIANCE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="compliance" stroke="#E8761A" strokeWidth={2} dot={{ r: 3 }} name="Compliance %" />
                <Line type="monotone" dataKey="positivity" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" name="Positivity %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy mb-1 text-sm">Positive Results by Substance (30 days)</h3>
            <p className="text-xs text-slate mb-4">Count of positive results by substance detected</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SUBSTANCE_BREAKDOWN} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="substance" type="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="count" fill="#E8761A" radius={[0, 4, 4, 0]} name="Positive Tests" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card col-span-2">
            <h3 className="font-semibold text-navy mb-4 text-sm">Individual Compliance Summary (This Month)</h3>
            <div className="grid grid-cols-4 gap-3">
              {monitored.map(p => {
                const patientTests = Object.values(SCHEDULE[p.id] ?? {}).filter(s => s !== 'N/A' && s !== 'Pending');
                const done = patientTests.filter(s => s === 'Negative' || s === 'Positive').length;
                const rate = patientTests.length > 0 ? Math.round((done / patientTests.length) * 100) : 0;
                const hasPos = Object.values(SCHEDULE[p.id] ?? {}).includes('Positive');
                return (
                  <div key={p.id}
                    onClick={() => navigate('PatientDetail', p.id)}
                    className="p-3 rounded-lg border border-border hover:shadow-md cursor-pointer transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-navy text-xs">{p.firstName} {p.lastName}</div>
                      {hasPos && <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded">POS</span>}
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                      <div className={`h-1.5 rounded-full ${rate >= 90 ? 'bg-green-500' : rate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${rate}%` }} />
                    </div>
                    <div className="text-xs text-slate">{rate}% · {done}/{patientTests.length} tests</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'Workflow' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate">Test order lifecycle — track each specimen from order through final clinical resolution. Click an action button to advance a test to the next stage.</div>
            <div className="text-xs text-slate">{workflowItems.length} active orders</div>
          </div>
          <div className="overflow-x-auto pb-3">
            <div className="flex gap-3" style={{ minWidth: `${WORKFLOW_STAGES.length * 220}px` }}>
              {WORKFLOW_STAGES.map((stage, si) => {
                const items = workflowItems.filter(w => w.stage === stage);
                return (
                  <div key={stage} className="flex-1 min-w-[210px]">
                    <div className={`rounded-t-xl px-3 py-2 text-xs font-bold flex items-center justify-between ${STAGE_HEADER[stage]}`}>
                      <span>{stage}</span>
                      {items.length > 0 && <span className="bg-white/60 rounded-full px-1.5">{items.length}</span>}
                    </div>
                    <div className={`min-h-[180px] rounded-b-xl border-l border-r border-b p-2 space-y-2 ${STAGE_COLOR[stage]}`}>
                      {items.map(item => {
                        const nextStage = NEXT_STAGE[stage];
                        const actionLabel = STAGE_ACTION[stage];
                        const isFinalizing = judgmentFor === item.id;
                        return (
                          <div key={item.id} className="bg-white rounded-lg border border-white/80 shadow-sm p-2.5 text-xs">
                            <div className="font-semibold text-navy mb-0.5">{item.patientName}</div>
                            <div className="text-slate mb-1">{item.testType} · {item.panel}</div>
                            <div className="text-slate mb-1">By: {item.orderedBy}</div>
                            <div className="text-slate font-mono mb-2">{item.orderedAt.slice(5)}</div>
                            {stage === 'Final Resolution' && item.clinicalJudgment && (
                              <div className="text-[10px] text-green-700 bg-green-50 border border-green-200 rounded p-1.5 mb-2 leading-relaxed">{item.clinicalJudgment.slice(0, 80)}…</div>
                            )}
                            {stage === 'Under Review' && !isFinalizing && (
                              <LockedButton locked={readOnly} onClick={() => { setJudgmentFor(item.id); setJudgmentText(''); }}
                                className="w-full text-[10px] bg-rose-600 text-white rounded py-1 hover:bg-rose-700">
                                Enter Clinical Judgment &amp; Finalize
                              </LockedButton>
                            )}
                            {stage === 'Under Review' && isFinalizing && (
                              <div className="space-y-1.5">
                                <textarea
                                  value={judgmentText}
                                  onChange={e => setJudgmentText(e.target.value)}
                                  className="w-full border border-border rounded px-2 py-1 text-[11px] min-h-[60px] resize-none"
                                  placeholder="Clinical judgment (required — must not automatically label as relapse; document context, clinical reasoning, and plan)..."
                                />
                                <div className="flex gap-1">
                                  <button onClick={() => setJudgmentFor(null)} className="flex-1 text-[10px] border border-border rounded py-1 text-slate hover:bg-gray-50">Cancel</button>
                                  <LockedButton locked={readOnly || !judgmentText.trim()} onClick={() => {
                                    setWorkflowItems(prev => prev.map(w => w.id === item.id
                                      ? { ...w, stage: 'Final Resolution', timestamps: { ...w.timestamps, 'Final Resolution': new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }, clinicalJudgment: judgmentText }
                                      : w
                                    ));
                                    setJudgmentFor(null);
                                    saveWFAction('Test finalized — clinical judgment recorded');
                                  }} className="flex-1 text-[10px] bg-rose-600 text-white rounded py-1 disabled:opacity-40">
                                    Confirm
                                  </LockedButton>
                                </div>
                              </div>
                            )}
                            {stage !== 'Under Review' && stage !== 'Final Resolution' && nextStage && actionLabel && (
                              <LockedButton locked={readOnly} onClick={() => {
                                setWorkflowItems(prev => prev.map(w => w.id === item.id
                                  ? { ...w, stage: nextStage, timestamps: { ...w.timestamps, [nextStage]: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) } }
                                  : w
                                ));
                                saveWFAction(`${item.patientName}: advanced to ${nextStage}`);
                              }} className="w-full text-[10px] bg-navy text-white rounded py-1 hover:bg-navy/90">
                                {actionLabel} →
                              </LockedButton>
                            )}
                          </div>
                        );
                      })}
                      {items.length === 0 && <div className="text-[10px] text-slate/60 text-center py-6">No orders in this stage</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card text-xs text-slate">
            <span className="font-semibold text-navy">Clinical judgment requirement:</span> Final Resolution requires a documented clinical judgment note. Labels such as "relapse" must NOT be automatically assigned — the treating clinician must review context (prescribed medications, timing, program status) and document their clinical reasoning before final disposition.
          </div>
        </div>
      )}

      {wfSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          ✓ {wfSaved}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedCell(null)}>
          <div className="bg-white rounded-xl p-6 shadow-2xl w-96" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy">UA Result Detail</h3>
              <button onClick={() => setSelectedCell(null)} className="text-slate hover:text-navy text-xl leading-none">×</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate">Patient</span><span className="font-medium text-navy">{MOCK_PATIENTS.find(p => p.id === selectedCell.patientId)?.firstName} {MOCK_PATIENTS.find(p => p.id === selectedCell.patientId)?.lastName}</span></div>
              <div className="flex justify-between"><span className="text-slate">Date</span><span className="font-medium text-navy">{selectedCell.date}</span></div>
              <div className="flex justify-between"><span className="text-slate">Result</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[selectedCell.status]}`}>{selectedCell.status}</span>
              </div>
              {selectedCell.substances && <div className="flex justify-between"><span className="text-slate">Substances</span><span className="font-medium text-navy">{selectedCell.substances.join(', ')}</span></div>}
              <div className="flex justify-between"><span className="text-slate">Test Type</span><span className="font-medium text-navy">{selectedCell.ordered}</span></div>
              <div className="flex justify-between"><span className="text-slate">Collected By</span><span className="font-medium text-navy">{selectedCell.collectedBy}</span></div>
              <div className="flex justify-between"><span className="text-slate">Witnessed By</span><span className="font-medium text-navy">{selectedCell.witnessedBy}</span></div>
              <div className="flex justify-between"><span className="text-slate">Chain of Custody</span><span className="font-mono text-xs text-navy">{selectedCell.chainOfCustody}</span></div>
            </div>
            <button onClick={() => setSelectedCell(null)} className="mt-4 w-full btn-primary text-sm py-2">Close</button>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowOrderForm(false)}>
          <div className="bg-white rounded-xl p-6 shadow-2xl w-[520px]" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-navy mb-4">Order Urinalysis</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient *</label>
                <select value={orderPatient} onChange={e => setOrderPatient(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {monitored.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.program}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Test Type *</label>
                  <select value={orderType} onChange={e => setOrderType(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Scheduled</option><option>Random</option><option>Triggered (Behavior)</option><option>Triggered (Suspicion)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Panel *</label>
                  <select value={orderPanel} onChange={e => setOrderPanel(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>10-Panel Standard</option><option>12-Panel Extended</option><option>Alcohol Only</option><option>Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Collection Method *</label>
                  <select value={orderMethod} onChange={e => setOrderMethod(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Observed</option><option>Unobserved</option><option>Split Specimen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Ordered By *</label>
                  <select value={orderBy} onChange={e => setOrderBy(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Dr. Robert Chen</option><option>Dr. Emily Stone</option><option>Dr. Allen Hughes</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Clinical Rationale</label>
                <textarea value={orderRationale} onChange={e => setOrderRationale(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none" placeholder="e.g. Routine weekly screening; behavioral change noted; clinical suspicion based on..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowOrderForm(false)} className="flex-1 border border-border rounded-lg py-2 text-sm text-slate hover:bg-gray-50">Cancel</button>
              <LockedButton locked={readOnly} onClick={() => {
                const patient = monitored.find(p => p.id === orderPatient);
                const now = new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                const newItem: WorkflowItem = {
                  id: `WF-${Date.now()}`,
                  patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
                  patientId: orderPatient,
                  testType: orderType,
                  panel: orderPanel,
                  orderedBy: orderBy,
                  orderedAt: `2026-07-${String(new Date().getDate()).padStart(2,'0')} ${now.split(', ')[1] ?? '09:00'}`,
                  stage: 'Ordered',
                  timestamps: { Ordered: now },
                };
                setWorkflowItems(prev => [newItem, ...prev]);
                setShowOrderForm(false);
                setOrderRationale('');
                saveWFAction(`Order placed — ${newItem.patientName} advanced to Workflow`);
              }} className="flex-1 btn-primary text-sm py-2">Place Order</LockedButton>
            </div>
          </div>
        </div>
      )}

      {tab === 'Chain of Custody' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Samples This Month', value: 47, sub: 'All panels', color: 'text-navy' },
              { label: 'Documented Chain', value: 47, sub: '100% compliance', color: 'text-green-600' },
              { label: 'Lab Discrepancies', value: 0, sub: 'MRO review required', color: 'text-green-600' },
              { label: 'Contested Results', value: 1, sub: 'Under MRO review', color: 'text-amber-600' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-navy text-sm">Chain of Custody Log</h3>
              <span className="text-xs text-slate">All fields required per 49 CFR Part 40 / SAMHSA guidelines</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg text-slate">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Specimen ID</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Patient</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Collection Date</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Collected By</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Witnessed By</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Lab Received</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">MRO Reviewed</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { id: 'UA-2026-0847', patient: 'M. Webb', date: '2026-07-18', collected: 'J. Torres, RN', witness: 'R. Davis, BHT', labReceived: '2026-07-18', mro: '2026-07-19', status: 'Complete' },
                  { id: 'UA-2026-0846', patient: 'S. Choi', date: '2026-07-18', collected: 'J. Torres, RN', witness: 'K. Smith, BHT', labReceived: '2026-07-18', mro: '2026-07-19', status: 'Complete' },
                  { id: 'UA-2026-0845', patient: 'J. Thornton', date: '2026-07-17', collected: 'A. Patel, RN', witness: 'R. Davis, BHT', labReceived: '2026-07-17', mro: '2026-07-18', status: 'Complete' },
                  { id: 'UA-2026-0844', patient: 'P. Holloway', date: '2026-07-17', collected: 'A. Patel, RN', witness: 'K. Smith, BHT', labReceived: '2026-07-17', mro: '2026-07-19', status: 'MRO Contested' },
                  { id: 'UA-2026-0843', patient: 'R. Navarro', date: '2026-07-16', collected: 'J. Torres, RN', witness: 'J. Torres, RN', labReceived: '2026-07-16', mro: '2026-07-17', status: 'Complete' },
                  { id: 'UA-2026-0842', patient: 'E. Vasquez', date: '2026-07-15', collected: 'A. Patel, RN', witness: 'R. Davis, BHT', labReceived: '2026-07-15', mro: '2026-07-16', status: 'Complete' },
                ].map(row => (
                  <tr key={row.id} className={`hover:bg-gray-50 ${row.status === 'MRO Contested' ? 'bg-amber-50' : ''}`}>
                    <td className="px-4 py-2.5 font-mono font-medium text-navy">{row.id}</td>
                    <td className="px-4 py-2.5 font-medium text-navy">{row.patient}</td>
                    <td className="px-4 py-2.5 text-slate">{row.date}</td>
                    <td className="px-4 py-2.5 text-slate">{row.collected}</td>
                    <td className="px-4 py-2.5 text-slate">{row.witness}</td>
                    <td className="px-4 py-2.5 text-slate">{row.labReceived}</td>
                    <td className="px-4 py-2.5 text-slate">{row.mro}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${row.status === 'Complete' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-navy text-sm mb-2">Chain of Custody Policy Reminder</h3>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Specimen must remain in patient's direct observation line from void to seal</li>
              <li>Temperature strip must read 90–100°F within 4 minutes of collection</li>
              <li>Collector and patient both initial the tamper-evident seal before packaging</li>
              <li>Specimen must be transferred to lab within 24 hours of collection or refrigerated at 2–8°C</li>
              <li>All contested results reviewed by Medical Review Officer (MRO) before reporting to treatment team</li>
              <li>Documentation retained for minimum 2 years per CARF standards</li>
            </ul>
          </div>
        </div>
      )}

      {tab === 'Positive Results' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Positive Results (30 Days)', value: 7, sub: 'Across all programs', color: 'text-red-600' },
              { label: 'Confrontation Sessions', value: 6, sub: '1 pending scheduling', color: 'text-amber-600' },
              { label: 'Treatment Plan Updated', value: 5, sub: 'After positive result', color: 'text-navy' },
              { label: 'AMA Risk Escalated', value: 2, sub: 'Flagged in risk board', color: 'text-red-600' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-border font-semibold text-navy text-sm">Positive UDS Results — Last 30 Days</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg text-slate">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Patient</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Date</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Substance Detected</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Program</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Confirmed (MRO)</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Confrontation</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Plan Updated</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { patient: 'Marcus Webb', date: '2026-07-18', substance: 'Opioids (Fentanyl)', program: 'Residential', confirmed: true, confronted: true, planUpdated: true, outcome: 'Continued / Higher monitoring' },
                  { patient: 'James Thornton', date: '2026-07-15', substance: 'Benzodiazepines', program: 'Residential', confirmed: true, confronted: true, planUpdated: true, outcome: 'Counseled — clinician verified Rx' },
                  { patient: 'Ava Simmons', date: '2026-07-14', substance: 'THC', program: 'IOP', confirmed: true, confronted: true, planUpdated: false, outcome: 'Step-up PHP recommended' },
                  { patient: 'Robert Navarro', date: '2026-07-12', substance: 'Cocaine (metabolite)', program: 'Residential', confirmed: true, confronted: true, planUpdated: true, outcome: 'AMA risk elevated — safety plan' },
                  { patient: 'Patricia Holloway', date: '2026-07-10', substance: 'Alcohol (EtG)', program: 'PHP', confirmed: true, confronted: false, planUpdated: false, outcome: 'Confrontation pending scheduling' },
                  { patient: 'Brian Kowalski', date: '2026-07-07', substance: 'Methamphetamine', program: 'PHP', confirmed: true, confronted: true, planUpdated: true, outcome: 'Stepped up to Residential' },
                  { patient: 'Elena Vasquez', date: '2026-07-04', substance: 'Opioids (Heroin)', program: 'IOP', confirmed: true, confronted: true, planUpdated: true, outcome: 'Admitted Residential — relapse' },
                ].map(r => (
                  <tr key={`${r.patient}-${r.date}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-navy">{r.patient}</td>
                    <td className="px-3 py-2.5 text-center text-slate">{r.date}</td>
                    <td className="px-3 py-2.5 text-center"><span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">{r.substance}</span></td>
                    <td className="px-3 py-2.5 text-center text-slate">{r.program}</td>
                    <td className="px-3 py-2.5 text-center">{r.confirmed ? <span className="text-green-600 font-bold">✓</span> : <span className="text-amber-500">Pending</span>}</td>
                    <td className="px-3 py-2.5 text-center">{r.confronted ? <span className="text-green-600 font-bold">✓</span> : <span className="text-red-500 font-bold">⚠</span>}</td>
                    <td className="px-3 py-2.5 text-center">{r.planUpdated ? <span className="text-green-600 font-bold">✓</span> : <span className="text-amber-500">No</span>}</td>
                    <td className="px-3 py-2.5 text-xs text-slate max-w-[160px]">{r.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Substance Detected — 6-Month Trend</h3>
            <div className="grid grid-cols-5 gap-3">
              {[
                { substance: 'Opioids', count: 18, pct: 38, color: 'bg-red-500' },
                { substance: 'Alcohol (EtG)', count: 12, pct: 25, color: 'bg-amber-400' },
                { substance: 'Methamphetamine', count: 8, pct: 17, color: 'bg-blue-500' },
                { substance: 'Cocaine', count: 5, pct: 10, color: 'bg-purple-400' },
                { substance: 'THC', count: 4, pct: 8, color: 'bg-green-500' },
              ].map(s => (
                <div key={s.substance} className="text-center">
                  <div className="text-2xl font-bold text-navy">{s.count}</div>
                  <div className={`h-1.5 rounded-full mt-1 ${s.color}`} style={{ width: `${s.pct}%`, margin: '4px auto' }} />
                  <div className="text-[10px] text-slate mt-1">{s.substance}</div>
                  <div className="text-[10px] font-bold text-slate">{s.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {tab === 'Panel Reference' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Reference guide for urine drug screening panels — detection windows, cutoff levels, cross-reactants, and confirmatory test methods.</div>
          <div className="card overflow-hidden">
            <h3 className="font-semibold text-navy text-sm mb-3">Standard Panel — Detection Windows &amp; Cutoffs</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Drug / Metabolite', 'Cutoff (Screen)', 'Detection Window', 'Confirmatory Method', 'Common Cross-Reactants', 'Notes'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { drug: 'THC (Marijuana)', cutoff: '50 ng/mL', window: '3d casual / 30d+ chronic', confirm: 'GC-MS / LC-MS', cross: 'Hemp CBD products, NSAIDs (rare)', notes: 'Medical marijuana state caution' },
                  { drug: 'Cocaine (Benzoylecgonine)', cutoff: '150 ng/mL', window: '2–4 days', confirm: 'GC-MS', cross: 'Coca tea, dental anesthetics', notes: 'Very high specificity' },
                  { drug: 'Opiates (Morphine/Codeine)', cutoff: '300 ng/mL', window: '2–4 days', confirm: 'GC-MS / LC-MS', cross: 'Poppy seeds, quinolones', notes: 'Does NOT detect semi-synthetics' },
                  { drug: 'Oxycodone / OxyContin', cutoff: '100 ng/mL', window: '2–4 days', confirm: 'LC-MS/MS', cross: 'None significant', notes: 'Separate panel required' },
                  { drug: 'Fentanyl / Norfentanyl', cutoff: '0.5 ng/mL', window: '1–3 days', confirm: 'LC-MS/MS', cross: 'Sufentanil, meperidine', notes: 'Standard panels miss fentanyl' },
                  { drug: 'Buprenorphine / Norbuprenorphine', cutoff: '10 ng/mL', window: '3–7 days', confirm: 'LC-MS/MS', cross: 'None significant', notes: 'Separate panel; ordered for MAT compliance' },
                  { drug: 'Benzodiazepines (Diazepam)', cutoff: '200 ng/mL', window: '3–7d / 6wk chronic', confirm: 'GC-MS', cross: 'Oxaprozin, sertraline', notes: 'Detection varies widely by compound' },
                  { drug: 'Methamphetamine / Amphetamines', cutoff: '500 ng/mL', window: '2–4 days', confirm: 'GC-MS', cross: 'Vicks inhaler, pseudoephedrine', notes: 'ADHD medication disclosure required' },
                  { drug: 'MDMA (Ecstasy)', cutoff: '500 ng/mL', window: '2–4 days', confirm: 'GC-MS', cross: 'L-methamphetamine', notes: 'Included in extended panel' },
                  { drug: 'PCP (Phencyclidine)', cutoff: '25 ng/mL', window: '4–8 days', confirm: 'GC-MS', cross: 'Dextromethorphan, ketamine', notes: 'DXM OTC preparations can cross-react' },
                  { drug: 'Ethyl Glucuronide (EtG)', cutoff: '500 ng/mL', window: '72–80 hours', confirm: 'LC-MS/MS', cross: 'Hand sanitizers, mouthwash', notes: 'Alcohol biomarker; highly sensitive' },
                  { drug: 'Gabapentin / Pregabalin', cutoff: '1,000 ng/mL', window: '2–3 days', confirm: 'LC-MS', cross: 'None significant', notes: 'Non-standard; high misuse potential in SUD' },
                ].map(r => (
                  <tr key={r.drug} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-semibold text-navy">{r.drug}</td>
                    <td className="px-3 py-2.5 font-mono text-slate">{r.cutoff}</td>
                    <td className="px-3 py-2.5 text-slate">{r.window}</td>
                    <td className="px-3 py-2.5 text-slate">{r.confirm}</td>
                    <td className="px-3 py-2.5 text-slate">{r.cross}</td>
                    <td className="px-3 py-2.5 text-slate italic">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Lab Partners' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Laboratory partner directory — reference labs, POCT vendors, and contract terms for drug testing services.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Primary Reference Lab', value: 'LabCorp', color: 'text-navy', sub: 'All GC-MS confirmations' },
              { label: 'POCT Vendor', value: 'Abbott', color: 'text-blue-600', sub: 'Alere iCup panels on-site' },
              { label: 'Avg Confirmation TAT', value: '28h', color: 'text-green-600', sub: 'From collection to result' },
              { label: 'Contract Rate / Specimen', value: '$14.80', color: 'text-teal-600', sub: 'Blended confirmation rate' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Lab Partner Directory</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Lab', 'Service Type', 'Test Panels', 'TAT', 'Contact', 'Contract Exp'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { lab: 'LabCorp (Rockville hub)', type: 'Reference Lab — Confirmations', panels: 'GC-MS 12-panel, EtG/EtS, Bup level, fentanyl analogs', tat: '24–36h', contact: '800-555-0144', exp: 'Dec 2027' },
                  { lab: 'Quest Diagnostics (backup)', type: 'Reference Lab — Backup', panels: 'Full confirmatory menu', tat: '24–48h', contact: '800-555-0244', exp: 'Mar 2027' },
                  { lab: 'Abbott (Alere) — POCT', type: 'Point-of-Care Testing', panels: 'iCup 12-panel, fentanyl strip', tat: '5 min (POC)', contact: '800-555-0344', exp: 'Jun 2027' },
                  { lab: 'National Toxicology (urine EtG)', type: 'Send-out Specialty', panels: 'EtG/EtS (80-hour alcohol marker)', tat: '48–72h', contact: '800-555-0444', exp: 'Sep 2027' },
                  { lab: 'DTI Labs (hair follicle)', type: 'Specialty — Hair', panels: 'Hair follicle 90-day history panel', tat: '7–10 days', contact: '800-555-0544', exp: 'Jan 2028' },
                ].map(r => (
                  <tr key={r.lab} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-navy">{r.lab}</td>
                    <td className="px-3 py-2 text-slate">{r.type}</td>
                    <td className="px-3 py-2 text-slate">{r.panels}</td>
                    <td className="px-3 py-2 text-navy">{r.tat}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-blue-700">{r.contact}</td>
                    <td className="px-3 py-2 text-slate">{r.exp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
