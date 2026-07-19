import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

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

export function UADrugTesting({ navigate }: Props) {
  const [tab, setTab] = useState<'Schedule' | 'History' | 'Analytics'>('Schedule');
  const [selectedCell, setSelectedCell] = useState<UaResult | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);

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
          <button onClick={() => setShowOrderForm(true)} className="btn-primary text-sm px-4 py-2">+ Order UA</button>
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
        {(['Schedule', 'History', 'Analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Schedule' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate">Week of July 14–20, 2026 · Residential (daily) and PHP (M/W/F)</div>
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
          <div className="bg-white rounded-xl p-6 shadow-2xl w-[480px]" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-navy mb-4">Order Urinalysis</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {monitored.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.program}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Test Type</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Scheduled</option><option>Random</option><option>Triggered (Behavior)</option><option>Triggered (Suspicion)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Panel</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>10-Panel Standard</option><option>12-Panel Extended</option><option>Alcohol Only</option><option>Custom</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Ordered By</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  <option>Dr. Robert Chen</option><option>Dr. Emily Stone</option><option>Dr. Allen Hughes</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Clinical Rationale</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none" placeholder="e.g. Routine weekly screening; behavioral change noted..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowOrderForm(false)} className="flex-1 border border-border rounded-lg py-2 text-sm text-slate hover:bg-gray-50">Cancel</button>
              <button onClick={() => setShowOrderForm(false)} className="flex-1 btn-primary text-sm py-2">Place Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
