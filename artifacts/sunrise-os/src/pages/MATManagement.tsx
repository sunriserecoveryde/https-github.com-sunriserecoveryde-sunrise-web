import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { CheckCircle, AlertTriangle, Clock, TrendingDown } from 'lucide-react';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

interface MATRecord {
  patientId: string;
  medication: string;
  dose: string;
  frequency: string;
  prescriber: string;
  startDate: string;
  inductionStatus: 'Pre-induction' | 'Induction' | 'Stabilization' | 'Maintenance';
  lastDose: string;
  nextDose: string;
  bupLevel?: string;
  compliance: number; // percent
  notes: string;
}

const MAT_DATA: MATRecord[] = [
  { patientId: 'p1', medication: 'Suboxone (Buprenorphine/Naloxone)', dose: '16mg/day', frequency: 'Once daily', prescriber: 'Dr. Robert Chen', startDate: '2026-07-01', inductionStatus: 'Maintenance', lastDose: 'Today 8:00 AM', nextDose: 'Tomorrow 8:00 AM', bupLevel: '3.2 ng/mL', compliance: 100, notes: 'Stable. Discussed Vivitrol transition at 90 days.' },
  { patientId: 'p2', medication: 'Naltrexone (Vivitrol injection)', dose: '380mg IM monthly', frequency: 'Monthly', prescriber: 'Dr. Emily Stone', startDate: '2026-06-20', inductionStatus: 'Maintenance', lastDose: '2026-06-20', nextDose: '2026-07-20', bupLevel: undefined, compliance: 100, notes: 'Monthly injection. Due 7/20. No cravings reported.' },
  { patientId: 'p3', medication: 'Suboxone (Buprenorphine/Naloxone)', dose: '24mg/day', frequency: 'Once daily', prescriber: 'Dr. Robert Chen', startDate: '2026-06-27', inductionStatus: 'Stabilization', lastDose: 'Today 8:00 AM', nextDose: 'Tomorrow 8:00 AM', bupLevel: '4.1 ng/mL', compliance: 95, notes: 'COWS 9 at last check — dose may need adjustment. Monitoring q4h.' },
  { patientId: 'p4', medication: 'Naltrexone (Oral)', dose: '50mg daily', frequency: 'Once daily', prescriber: 'Dr. Emily Stone', startDate: '2026-07-05', inductionStatus: 'Maintenance', lastDose: 'Today 8:00 AM', nextDose: 'Tomorrow 8:00 AM', bupLevel: undefined, compliance: 88, notes: 'Missed 1 dose (7/13). Counseled on adherence importance.' },
  { patientId: 'p11', medication: 'Suboxone (Buprenorphine/Naloxone)', dose: '16mg/day', frequency: 'Once daily', prescriber: 'Dr. Robert Chen', startDate: '2026-07-07', inductionStatus: 'Stabilization', lastDose: 'Today 8:00 AM', nextDose: 'Tomorrow 8:00 AM', bupLevel: '2.8 ng/mL', compliance: 100, notes: 'Induction complete. Stable on 16mg. Hep C treatment pending GI consult.' },
  { patientId: 'p13', medication: 'Acamprosate (Campral)', dose: '666mg TID', frequency: 'Three times daily', prescriber: 'Dr. Emily Stone', startDate: '2026-07-05', inductionStatus: 'Maintenance', lastDose: 'Today 8:00 AM', nextDose: 'Today 12:00 PM', bupLevel: undefined, compliance: 92, notes: 'Alcohol deterrent. Tolerated well. Monitor renal function.' },
  { patientId: 'p15', medication: 'Strattera (Atomoxetine)', dose: '40mg daily', frequency: 'Once daily', prescriber: 'Dr. Robert Chen', startDate: '2026-07-01', inductionStatus: 'Maintenance', lastDose: 'Today 8:00 AM', nextDose: 'Tomorrow 8:00 AM', bupLevel: undefined, compliance: 100, notes: 'ADHD management. Significant reduction in cannabis cravings reported.' },
  { patientId: 'p17', medication: 'Suboxone (Buprenorphine/Naloxone)', dose: '8mg/day', frequency: 'Once daily', prescriber: 'Dr. Robert Chen', startDate: '2026-07-12', inductionStatus: 'Induction', lastDose: 'Today 8:00 AM', nextDose: 'Tomorrow 8:00 AM', bupLevel: '1.1 ng/mL', compliance: 100, notes: 'Day 7 of induction. Titrating up. COWS resolved. AMA risk high — monitor closely.' },
  { patientId: 'p19', medication: 'Suboxone (Buprenorphine/Naloxone)', dose: '8mg/day', frequency: 'Once daily', prescriber: 'Dr. Robert Chen', startDate: '2026-06-30', inductionStatus: 'Maintenance', lastDose: 'Today 8:00 AM', nextDose: 'Tomorrow 8:00 AM', bupLevel: '2.4 ng/mL', compliance: 100, notes: 'Stable. Discussing extended MAT for minimum 12 months. Excellent engagement.' },
  { patientId: 'p7', medication: 'Disulfiram (Antabuse)', dose: '250mg daily', frequency: 'Once daily', prescriber: 'Dr. Emily Stone', startDate: '2026-07-02', inductionStatus: 'Maintenance', lastDose: 'Today 8:00 AM', nextDose: 'Tomorrow 8:00 AM', bupLevel: undefined, compliance: 100, notes: 'Alcohol deterrent therapy. Patient highly motivated. Counseled on alcohol interactions.' },
];

// Patients needing MAT evaluation (not yet on MAT but indicated)
const MAT_PENDING = [
  { patientId: 'p9', name: 'Devon Patel', indication: 'Meth OUD — evaluate for naltrexone or contingency management', requestedBy: 'Maria Gonzales, LCSW', date: '2026-07-16' },
  { patientId: 'p14', name: 'Nicole Washington', indication: 'Cocaine OUD — evaluate for modafinil or naltrexone', requestedBy: 'Dr. Allen Hughes', date: '2026-07-17' },
];

const MEDICATION_PIE = [
  { name: 'Buprenorphine', value: 5, color: '#E8761A' },
  { name: 'Naltrexone', value: 2, color: '#3B9ED4' },
  { name: 'Acamprosate', value: 1, color: '#2ECC71' },
  { name: 'Disulfiram', value: 1, color: '#9B59B6' },
  { name: 'Non-OUD MAT', value: 1, color: '#F39C12' },
];

const COMPLIANCE_DATA = [
  { week: 'W1 Jun', rate: 96 },
  { week: 'W2 Jun', rate: 94 },
  { week: 'W3 Jun', rate: 97 },
  { week: 'W4 Jun', rate: 93 },
  { week: 'W1 Jul', rate: 95 },
  { week: 'W2 Jul', rate: 96 },
  { week: 'W3 Jul', rate: 97 },
];

const INDUCTION_COLORS: Record<string, string> = {
  'Pre-induction': 'bg-gray-100 text-gray-600',
  'Induction':     'bg-amber-100 text-amber-700',
  'Stabilization': 'bg-blue-100 text-blue-700',
  'Maintenance':   'bg-green-100 text-green-700',
};

export function MATManagement({ navigate }: Props) {
  const [tab, setTab] = useState<'Active' | 'Pending' | 'Analytics'>('Active');
  const [filter, setFilter] = useState('All');
  const [showOrderModal, setShowOrderModal] = useState(false);

  const onMAT = MAT_DATA.length;
  const avgCompliance = Math.round(MAT_DATA.reduce((a, r) => a + r.compliance, 0) / MAT_DATA.length);
  const bupPatients = MAT_DATA.filter(r => r.medication.toLowerCase().includes('buprenorphine')).length;
  const atRisk = MAT_DATA.filter(r => r.compliance < 90).length;

  const meds = ['All', ...Array.from(new Set(MAT_DATA.map(r => r.medication.split(' ')[0])))];
  const filtered = filter === 'All' ? MAT_DATA : MAT_DATA.filter(r => r.medication.includes(filter));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">MAT Management</h1>
          <p className="text-slate text-sm mt-0.5">Medication-Assisted Treatment — buprenorphine, naltrexone, and adjunct medications</p>
        </div>
        <button onClick={() => setShowOrderModal(true)} className="btn-primary text-sm px-4 py-2">+ New MAT Order</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Patients on MAT', value: onMAT, sub: `of ${MOCK_PATIENTS.length} census`, color: 'text-navy', icon: CheckCircle, ic: 'text-green-500' },
          { label: 'Buprenorphine', value: bupPatients, sub: `${Math.round(bupPatients/onMAT*100)}% of MAT patients`, color: 'text-orange', icon: TrendingDown, ic: 'text-orange' },
          { label: 'Avg Compliance', value: `${avgCompliance}%`, sub: '7-day rolling average', color: avgCompliance >= 95 ? 'text-green-600' : 'text-amber-600', icon: CheckCircle, ic: 'text-green-500' },
          { label: 'Compliance Concerns', value: atRisk, sub: 'Below 90% this week', color: atRisk > 0 ? 'text-red-600' : 'text-green-600', icon: AlertTriangle, ic: 'text-red-500' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${s.ic}`} />
                <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
              </div>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate mt-0.5">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['Active', 'Pending', 'Analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>
            {t}
            {t === 'Pending' && MAT_PENDING.length > 0 && <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-1.5">{MAT_PENDING.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'Active' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm">
              {meds.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="text-xs text-slate ml-auto">{filtered.length} patients</span>
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  {['Patient', 'Medication', 'Dose / Freq', 'Status', 'BUP Level', 'Compliance', 'Last / Next Dose', 'Notes / Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const p = MOCK_PATIENTS.find(pt => pt.id === r.patientId);
                  if (!p) return null;
                  return (
                    <tr key={r.patientId} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-navy text-xs cursor-pointer hover:text-orange"
                          onClick={() => navigate('PatientDetail', r.patientId)}>
                          {p.firstName} {p.lastName}
                        </div>
                        <div className="text-[10px] text-slate">{p.mrn} · {p.program}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-navy max-w-[160px]">
                        <div className="font-medium">{r.medication.split('(')[0].trim()}</div>
                        {r.medication.includes('(') && <div className="text-slate text-[10px]">({r.medication.split('(')[1].replace(')', '')})</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate">
                        <div>{r.dose}</div>
                        <div className="text-[10px]">{r.frequency}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${INDUCTION_COLORS[r.inductionStatus]}`}>
                          {r.inductionStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-navy">{r.bupLevel ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${r.compliance >= 95 ? 'bg-green-500' : r.compliance >= 80 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${r.compliance}%` }} />
                          </div>
                          <span className={`text-xs font-semibold ${r.compliance >= 95 ? 'text-green-600' : r.compliance >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{r.compliance}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-slate">
                        <div>{r.lastDose}</div>
                        <div className="text-[10px] text-orange font-medium">{r.nextDose}</div>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <div className="text-[10px] text-slate line-clamp-2">{r.notes}</div>
                        <div className="flex gap-1 mt-1.5">
                          <button className="text-[10px] text-orange hover:underline">Adjust</button>
                          <span className="text-gray-300">·</span>
                          <button className="text-[10px] text-slate hover:text-navy" onClick={() => navigate('PatientDetail', r.patientId)}>Chart</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Pending' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <strong>MAT Evaluation Requests:</strong> {MAT_PENDING.length} patient(s) have been referred for MAT evaluation. Physician response required within 24 hours per policy.
          </div>
          {MAT_PENDING.map(req => {
            const p = MOCK_PATIENTS.find(pt => pt.id === req.patientId);
            if (!p) return null;
            return (
              <div key={req.patientId} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-navy cursor-pointer hover:text-orange" onClick={() => navigate('PatientDetail', req.patientId)}>
                        {p.firstName} {p.lastName}
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pending Evaluation</span>
                    </div>
                    <div className="text-xs text-slate mt-1">{p.mrn} · {p.program} · {p.primaryDiagnosis}</div>
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-border text-sm text-navy">
                      <div className="font-semibold text-xs text-slate uppercase mb-1">Clinical Indication</div>
                      {req.indication}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate">
                      <span>Requested by: <span className="text-navy font-medium">{req.requestedBy}</span></span>
                      <span>Date: <span className="text-navy font-medium">{req.date}</span></span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium">Start MAT Order</button>
                    <button className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50">Defer / Decline</button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="card">
            <h3 className="font-semibold text-navy mb-3">Patients Not Currently on MAT</h3>
            <div className="space-y-2">
              {MOCK_PATIENTS.filter(p => !MAT_DATA.some(r => r.patientId === p.id) && !MAT_PENDING.some(r => r.patientId === p.id)).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-border">
                  <div>
                    <div className="font-medium text-navy text-sm cursor-pointer hover:text-orange" onClick={() => navigate('PatientDetail', p.id)}>
                      {p.firstName} {p.lastName}
                    </div>
                    <div className="text-xs text-slate">{p.program} · {p.primaryDiagnosis.split(' ').slice(0,4).join(' ')}</div>
                  </div>
                  <button className="text-xs text-orange hover:underline">Evaluate for MAT</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-navy mb-1 text-sm">MAT Medication Distribution</h3>
            <p className="text-xs text-slate mb-3">Current census by medication type</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={MEDICATION_PIE} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {MEDICATION_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Patients']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy mb-1 text-sm">MAT Compliance Rate (7 Weeks)</h3>
            <p className="text-xs text-slate mb-3">Weekly average medication administration compliance</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={COMPLIANCE_DATA} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[85, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Compliance']} />
                <Bar dataKey="rate" fill="#E8761A" radius={[4, 4, 0, 0]} name="Compliance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card col-span-2">
            <h3 className="font-semibold text-navy mb-4 text-sm">Induction Status Summary</h3>
            <div className="grid grid-cols-4 gap-4">
              {(['Pre-induction', 'Induction', 'Stabilization', 'Maintenance'] as const).map(status => {
                const count = MAT_DATA.filter(r => r.inductionStatus === status).length;
                return (
                  <div key={status} className={`p-4 rounded-lg border-2 ${INDUCTION_COLORS[status].replace('text-', 'border-').split(' ')[0]} ${INDUCTION_COLORS[status]}`}>
                    <div className="text-3xl font-bold">{count}</div>
                    <div className="text-sm font-medium mt-0.5">{status}</div>
                    <div className="text-xs mt-1 opacity-80">
                      {status === 'Pre-induction' && 'Awaiting COWS ≥8'}
                      {status === 'Induction' && 'Active titration'}
                      {status === 'Stabilization' && 'Dose optimization'}
                      {status === 'Maintenance' && 'Stable, therapeutic dose'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowOrderModal(false)}>
          <div className="bg-white rounded-xl p-6 shadow-2xl w-[500px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-navy mb-4">New MAT Order</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {MOCK_PATIENTS.map(p => <option key={p.id}>{p.firstName} {p.lastName} — {p.program}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Medication *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Suboxone (Buprenorphine/Naloxone)</option>
                    <option>Subutex (Buprenorphine)</option>
                    <option>Vivitrol (Naltrexone injection)</option>
                    <option>Naltrexone (oral)</option>
                    <option>Acamprosate (Campral)</option>
                    <option>Disulfiram (Antabuse)</option>
                    <option>Methadone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Starting Dose *</label>
                  <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 8mg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Frequency</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Once daily</option>
                    <option>Twice daily</option>
                    <option>Three times daily</option>
                    <option>Monthly</option>
                    <option>PRN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Prescribing Physician</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Dr. Robert Chen</option>
                    <option>Dr. Emily Stone</option>
                    <option>Dr. Allen Hughes</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Indication / Clinical Notes</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none" placeholder="Clinical rationale for MAT..." />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <strong>Reminder:</strong> Buprenorphine induction should not begin until COWS ≥8. Confirm withdrawal severity before proceeding.
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowOrderModal(false)} className="flex-1 border border-border rounded-lg py-2 text-sm text-slate">Cancel</button>
              <button onClick={() => setShowOrderModal(false)} className="flex-1 btn-primary text-sm py-2">Place MAT Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
