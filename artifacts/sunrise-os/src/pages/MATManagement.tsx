import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { CheckCircle, AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';
import { getRolesWithEditAccess } from '../data/mockRoles';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

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
  { patientId: 'p2', medication: 'Naltrexone (Vivitrol injection)', dose: '380mg IM monthly', frequency: 'Monthly', prescriber: 'Dr. Emily Stone', startDate: '2026-06-20', inductionStatus: 'Maintenance', lastDose: '2026-06-20', nextDose: '2026-07-22', bupLevel: undefined, compliance: 100, notes: 'Monthly injection. Due today (7/22). No cravings reported.' },
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
  { week: 'W4 Jul', rate: 96 },
];

const INDUCTION_COLORS: Record<string, string> = {
  'Pre-induction': 'bg-gray-100 text-gray-600',
  'Induction':     'bg-amber-100 text-amber-700',
  'Stabilization': 'bg-blue-100 text-blue-700',
  'Maintenance':   'bg-green-100 text-green-700',
};

export function MATManagement({ navigate, readOnly }: Props) {
  const editRoles = getRolesWithEditAccess('MATManagement');
  const [tab, setTab] = useState<'Active' | 'Pending' | 'Analytics' | 'Protocols' | 'Education' | 'PDMP Alerts' | 'Outcome Data'>('Active');
  const [filter, setFilter] = useState('All');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [matActionSaved, setMatActionSaved] = useState<string | null>(null);
  const saveMatAction = (msg: string) => { setMatActionSaved(msg); setTimeout(() => setMatActionSaved(null), 2500); };

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
        <LockedButton locked={readOnly} editRoles={editRoles} onClick={() => setShowOrderModal(true)} className="btn-primary text-sm px-4 py-2">+ New MAT Order</LockedButton>
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
        {(['Active', 'Pending', 'Analytics', 'Protocols', 'Education', 'PDMP Alerts', 'Outcome Data'] as const).map(t => (
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
                          <LockedButton locked={readOnly} editRoles={editRoles} onClick={() => saveMatAction('Dose adjustment submitted')} className="text-[10px] text-orange hover:underline">Adjust</LockedButton>
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
                    <LockedButton locked={readOnly} editRoles={editRoles} onClick={() => saveMatAction('MAT order initiated')} className="text-xs border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium">Start MAT Order</LockedButton>
                    <LockedButton locked={readOnly} editRoles={editRoles} onClick={() => saveMatAction('Evaluation deferred')} className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50">Defer / Decline</LockedButton>
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
                  <LockedButton locked={readOnly} editRoles={editRoles} onClick={() => saveMatAction('MAT evaluation requested')} className="text-xs text-orange hover:underline">Evaluate for MAT</LockedButton>
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
              <LockedButton locked={readOnly} editRoles={editRoles} onClick={() => setShowOrderModal(false)} className="flex-1 btn-primary text-sm py-2">Place MAT Order</LockedButton>
            </div>
          </div>
        </div>
      )}

      {tab === 'Protocols' && (
        <div className="space-y-5">
          {[
            {
              name: 'Buprenorphine (Suboxone/Subutex) Induction Protocol',
              phase: 'Induction → Maintenance',
              indication: 'Opioid Use Disorder (OUD)',
              criteria: 'COWS ≥ 8; ≥ 12–24h since last opioid use; patient consent; negative pregnancy test if applicable',
              steps: [
                'Confirm COWS ≥ 8 before first dose (avoid precipitated withdrawal)',
                'Starting dose: Buprenorphine/naloxone 2mg/0.5mg SL; observe 1 hour',
                'If COWS remains ≥ 8 after 1h, give additional 2mg/0.5mg SL',
                'Day 1 max: 8mg/2mg SL. Reassess COWS at 1h and 4h post-dose',
                'Day 2: Increase to 12–16mg/day based on response; titrate q3–5 days',
                'Maintenance target: 16–24mg/day; adjust based on cravings and side effects',
                'Provide concurrent counseling and contingency management; random UA q week',
              ],
              monitoring: 'COWS q1h during induction. LFTs at baseline, 3 months, annually. UA weekly × 4 weeks, then monthly.',
              contraindications: 'Acute intoxication; recent benzodiazepine or alcohol use; COWS < 8; known hypersensitivity to buprenorphine',
              prescriber: 'DEA-X waivered physician required (or DATA 2000 practitioner)',
              color: 'bg-blue-50 border-blue-200',
            },
            {
              name: 'Naltrexone (Vivitrol) Induction Protocol',
              phase: 'Post-detox Maintenance',
              indication: 'OUD or Alcohol Use Disorder (AUD)',
              criteria: '7–10 days opioid-free (OUD) or 5–7 days alcohol-free (AUD); confirmed by UA and COWS/CIWA; no liver disease',
              steps: [
                'Confirm opioid-free ≥ 7–10 days with negative UDS and COWS < 5',
                'Naloxone challenge test optional: 0.8mg IV naloxone; observe for precipitated withdrawal 20 min',
                'Oral naltrexone 25mg × 1 dose; observe for 1 hour for adverse effects',
                'If tolerated: Vivitrol 380mg IM gluteal injection (alternate buttocks each month)',
                'Schedule next injection 28–30 days later',
                'Counsel patient: blocks opioid effect — do not attempt to override with high doses (fatal OD risk)',
              ],
              monitoring: 'LFTs at baseline, monthly × 3, then quarterly. Injection site assessment at each visit. UA monthly.',
              contraindications: 'Current opioid use; LFTs > 3–5× ULN; acute hepatitis; on opioid analgesics; hypersensitivity',
              prescriber: 'Licensed physician; no DEA waiver required',
              color: 'bg-purple-50 border-purple-200',
            },
            {
              name: 'Methadone Maintenance Protocol',
              phase: 'Maintenance (OTP only)',
              indication: 'Opioid Use Disorder (OUD) — severe/long-standing',
              criteria: 'Diagnosis of OUD ≥ 1 year; ≥ 18 years old (or court order ≥ 16); enrollment in licensed OTP; physical exam completed',
              steps: [
                'Initial dose: 20–30mg oral liquid; observe 2–4 hours for oversedation',
                'If COWS ≥ 6 after 2h, may give additional 5–10mg (max 40mg Day 1)',
                'Titrate by 5–10mg every 5–7 days; therapeutic range typically 80–120mg/day',
                'Daily observed dosing at clinic; take-home privileges based on compliance & stability (SAMHSA 8 criteria)',
                'Take-home schedule: Phase 1 (90 days) → 1 day; Phase 2 (9 months) → 2 days; up to 28-day supply at 2 years',
              ],
              monitoring: 'QTc at baseline and 120mg. LFTs annually. UA on random schedule per OTP protocol.',
              contraindications: 'QTc > 500ms; concurrent CNS depressants without close monitoring; respiratory disease',
              prescriber: 'OTP-licensed physician only; DEA Schedule II prescribing authority required',
              color: 'bg-green-50 border-green-200',
            },
          ].map(proto => (
            <div key={proto.name} className={`card border ${proto.color}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-navy text-base">{proto.name}</h3>
                  <div className="flex gap-2 flex-wrap mt-1">
                    <span className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 rounded-full font-medium">{proto.indication}</span>
                    <span className="text-[10px] bg-orange/10 text-orange px-2 py-0.5 rounded-full font-medium">{proto.phase}</span>
                    <span className="text-[10px] bg-slate/10 text-slate px-2 py-0.5 rounded-full font-medium">Prescriber: {proto.prescriber}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                <div className="bg-white rounded-lg p-3 border border-border">
                  <div className="font-bold text-navy mb-1">Eligibility Criteria</div>
                  <p className="text-slate leading-relaxed">{proto.criteria}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-border">
                  <div className="font-bold text-red-700 mb-1">Contraindications</div>
                  <p className="text-slate leading-relaxed">{proto.contraindications}</p>
                </div>
              </div>

              <div className="text-xs mb-4">
                <div className="font-bold text-navy mb-2">Protocol Steps</div>
                <div className="space-y-1">
                  {proto.steps.map((step, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="font-bold text-orange shrink-0">{i + 1}.</span>
                      <span className="text-slate">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs bg-white rounded-lg p-3 border border-border">
                <span className="font-bold text-navy">Monitoring: </span>
                <span className="text-slate">{proto.monitoring}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Education' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">MAT patient education resources, counselor quick-reference, and evidence-based talking points to support informed consent and treatment engagement.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Buprenorphine (Suboxone) — Patient Education</h3>
              <div className="space-y-3 text-xs">
                {[
                  { q: 'What is Suboxone?', a: 'Suboxone is a combination of buprenorphine (a partial opioid agonist) and naloxone (an abuse deterrent). It reduces cravings and withdrawal symptoms without producing the full euphoric effect of illicit opioids.' },
                  { q: 'How does it work?', a: 'Buprenorphine attaches to the same brain receptors as other opioids but only partially activates them. This reduces cravings and prevents full agonists from binding — meaning if you use opioids while on Suboxone, the effect is significantly blunted.' },
                  { q: 'What is the "ceiling effect"?', a: 'Buprenorphine has a ceiling effect — above a certain dose, additional medication doesn\'t increase the effect. This makes it significantly safer than full agonists and reduces overdose risk.' },
                  { q: 'What is precipitated withdrawal?', a: 'If Suboxone is taken too soon after last opioid use (before withdrawal has begun), it can push the full agonist off receptors and cause sudden, severe withdrawal. Always wait until COWS ≥ 8 before first dose.' },
                  { q: 'How long will I take it?', a: 'Duration is individualized. Research shows longer treatment duration leads to better outcomes. Many patients benefit from 12+ months or indefinite maintenance. This is a medical decision made with your doctor — not a sign of failure.' },
                  { q: 'What are common side effects?', a: 'Constipation, headache, sweating, insomnia, and dry mouth are most common. Serious risks include respiratory depression (rare at therapeutic doses) and interactions with benzodiazepines or alcohol.' },
                ].map(item => (
                  <div key={item.q} className="border border-border rounded-lg p-2.5">
                    <div className="font-semibold text-navy mb-1">{item.q}</div>
                    <div className="text-slate leading-relaxed">{item.a}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Naltrexone (Vivitrol) — Patient Education</h3>
                <div className="space-y-3 text-xs">
                  {[
                    { q: 'What is Vivitrol?', a: 'Vivitrol is a monthly injectable form of naltrexone — an opioid antagonist that completely blocks opioid receptors. It is used for both opioid use disorder (OUD) and alcohol use disorder (AUD).' },
                    { q: 'How is it different from Suboxone?', a: 'Naltrexone is not an opioid — it has no potential for abuse or physical dependence. It does not reduce cravings the way Suboxone does, but it eliminates the rewarding effect of opioids entirely.' },
                    { q: 'What are the requirements before starting?', a: 'Patient must be fully opioid-free for 7–10 days before the first injection. Taking Vivitrol while any opioids are in the system will cause immediate severe withdrawal. Urine drug screen required before each injection.' },
                    { q: 'What if I need surgery or pain management?', a: 'Tell your surgeon and anesthesiologist you are on Vivitrol. Higher doses of opioids may be used for acute pain management. Non-opioid pain management strategies are preferred.' },
                  ].map(item => (
                    <div key={item.q} className="border border-border rounded-lg p-2.5">
                      <div className="font-semibold text-navy mb-1">{item.q}</div>
                      <div className="text-slate leading-relaxed">{item.a}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Methadone — Counselor Reference</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Classification', value: 'Full opioid agonist — long-acting, Schedule II controlled substance' },
                    { label: 'Administration', value: 'Daily oral dose at licensed OTP clinic (not dispenses in general treatment setting without OTP certification)' },
                    { label: 'Starting dose', value: 'Typically 20–30mg/day; titrate slowly every 5–7 days; max initial dose 30mg Day 1' },
                    { label: 'Therapeutic range', value: '60–120mg/day for most patients; individualized to cravings and withdrawal suppression' },
                    { label: 'QTc monitoring', value: 'Baseline EKG; repeat at 30mg and 100mg doses; monitor for QTc > 500ms' },
                    { label: 'Drug interactions', value: 'Significant CYP3A4 and CYP2D6 interactions; avoid benzodiazepines; alcohol increases OD risk' },
                    { label: 'Take-home privileges', value: 'Earned through program compliance; Phase 1-4 progression per federal and state regulations' },
                  ].map(r => (
                    <div key={r.label} className="flex gap-2 text-xs border-b border-border pb-1 last:border-0 last:pb-0">
                      <span className="font-semibold text-navy shrink-0 w-36">{r.label}:</span>
                      <span className="text-slate">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <strong>Counselor Note — Common Stigma Responses:</strong> Patients often arrive with beliefs that "MAT is trading one addiction for another." Key talking points: MAT is evidence-based medicine (SAMHSA, ASAM, WHO); recovery is not about abstinence from medication — it's about improved function, safety, and quality of life; people manage other chronic conditions with medication (insulin, antihypertensives) without stigma. Engage with curiosity, not argument.
              </div>
            </div>
          </div>
        </div>
      )}
      {tab === 'PDMP Alerts' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Maryland CSMD (Controlled Substance Monitoring Database) alerts for current MAT patients — flags for concurrent prescribers, high morphine milligram equivalents, and behavioral concerns.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Patients Checked (30d)', value: 18, color: 'text-navy', sub: '100% of active MAT patients' },
              { label: 'Concurrent Prescribers', value: 2, color: 'text-red-600', sub: 'Requires clinical review' },
              { label: 'High MME Flags', value: 1, color: 'text-amber-600', sub: '>90 MME/day threshold' },
              { label: 'Cleared (No Concerns)', value: 15, color: 'text-green-600', sub: 'PDMP check normal' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">PDMP Alert Review — Active Cases</h3>
            <div className="space-y-3 text-xs">
              {[
                {
                  patient: 'Marcus Webb', mrn: 'MRN-83921', alert: 'Concurrent Prescriber',
                  detail: 'Buprenorphine prescribed by Dr. R. Evans (Rockville Health, 07/02) AND Dr. A. Okafor at Sunrise (07/05). Potential double prescribing — patient did not disclose.',
                  action: 'Clinical team notified. Care coordination with Dr. Evans initiated. Patient counseled — concurrent prescriptions must cease by 07/25.',
                  severity: 'High', sColor: 'border-red-300 bg-red-50'
                },
                {
                  patient: 'James Thornton', mrn: 'MRN-62841', alert: 'Early Refill Pattern',
                  detail: 'Suboxone 12mg refilled 8 days early twice in last 90 days. Obtained from community pharmacy. Possible diversion or misuse.',
                  action: 'Weekly observed dosing initiated. UDS with confirmation ordered. MAT counseling session scheduled.',
                  severity: 'High', sColor: 'border-red-300 bg-red-50'
                },
                {
                  patient: 'Robert Navarro', mrn: 'MRN-44782', alert: 'High MME',
                  detail: 'Outside Rx: Oxycodone 30mg x90 tablets (Dr. J. Patel, orthopedics, 07/10 — post-surgical). Total MME = 135/day combined with buprenorphine.',
                  action: 'Opioid agonist reconciliation review ordered. Pain management team consulted. Buprenorphine dose evaluation in progress.',
                  severity: 'Moderate', sColor: 'border-amber-300 bg-amber-50'
                },
              ].map(a => (
                <div key={a.patient} className={`border rounded-xl p-3 ${a.sColor}`}>
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <span className="font-semibold text-navy">{a.patient}</span>
                      <span className="text-slate text-[10px] ml-2">{a.mrn}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${a.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{a.severity}</span>
                      <span className="text-[9px] text-slate">CSMD Alert: {a.alert}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="font-semibold text-slate">Finding:</span> <span className="text-navy">{a.detail}</span></div>
                    <div><span className="font-semibold text-slate">Clinical Action:</span> <span className="text-navy">{a.action}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Outcome Data' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">MAT program outcomes — retention rates, sobriety milestones, and comparative effectiveness data for all medication-assisted treatment patients.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'MAT Retention (6 months)', value: '74%', color: 'text-green-600', sub: 'Current cohort — all medications' },
              { label: 'Negative UDS at 6 Months', value: '68%', color: 'text-teal-600', sub: 'Of retained patients' },
              { label: 'Avg MOUD Duration', value: '8.4 mo', color: 'text-navy', sub: 'From induction to program exit' },
              { label: 'MAT Discharge with Community Link', value: '89%', color: 'text-blue-600', sub: 'Warm handoff to community OTP/office' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Outcomes by Medication Type</h3>
              <div className="space-y-3 text-xs">
                {[
                  { med: 'Buprenorphine/Naloxone (Suboxone)', n: 18, ret6: 78, negUDS: 71, dc: 92, color: 'text-blue-600' },
                  { med: 'Extended-Release Naltrexone (Vivitrol)', n: 7, ret6: 62, negUDS: 65, dc: 85, color: 'text-purple-600' },
                  { med: 'Methadone (OTP referral)', n: 3, ret6: 81, negUDS: 74, dc: 100, color: 'text-teal-600' },
                  { med: 'Naltrexone (Oral)', n: 4, ret6: 55, negUDS: 58, dc: 75, color: 'text-orange-600' },
                ].map(r => (
                  <div key={r.med} className="border border-border rounded-lg p-2.5">
                    <div className={`font-semibold mb-1 ${r.color}`}>{r.med} (n={r.n})</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center"><div className="text-slate text-[10px]">6-mo Retention</div><div className={`font-bold text-sm ${r.color}`}>{r.ret6}%</div></div>
                      <div className="text-center"><div className="text-slate text-[10px]">Neg. UDS</div><div className="font-bold text-sm text-green-600">{r.negUDS}%</div></div>
                      <div className="text-center"><div className="text-slate text-[10px]">Linked at DC</div><div className="font-bold text-sm text-teal-600">{r.dc}%</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">MAT vs. No-MAT Comparison (OUD, Residential)</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { metric: '6-Month Retention in Treatment', mat: '74%', noMat: '41%', better: true },
                  { metric: '12-Month Sobriety (self-reported)', mat: '61%', noMat: '38%', better: true },
                  { metric: 'Opioid Overdose (12 months)', mat: '3%', noMat: '14%', better: true },
                  { metric: 'Re-admission (12 months)', mat: '18%', noMat: '34%', better: true },
                  { metric: 'Employment at 12 Months', mat: '56%', noMat: '42%', better: true },
                  { metric: 'Criminal Justice Involvement', mat: '8%', noMat: '19%', better: true },
                ].map(m => (
                  <div key={m.metric} className="flex items-center justify-between border border-border rounded p-2">
                    <span className="text-slate">{m.metric}</span>
                    <div className="flex gap-4 shrink-0 ml-2">
                      <span className="font-bold text-green-600">MAT: {m.mat}</span>
                      <span className="text-slate">No MAT: {m.noMat}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-[10px] text-green-800">
                Sunrise MAT outcomes consistent with SAMHSA TIP-63 evidence base. Source: internal 2025–2026 cohort data (n=38).
              </div>
            </div>
          </div>
        </div>
      )}

      {matActionSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <span>✓</span> {matActionSaved}
        </div>
      )}
    </div>
  );
}
