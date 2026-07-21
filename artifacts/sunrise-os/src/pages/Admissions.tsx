import React, { useState } from 'react';
import { Screen } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type AdmitStatus = 'Inquiry' | 'Pre-Screen' | 'Insurance Verify' | 'Bed Assigned' | 'Admitted';

interface PendingAdmission {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  referralSource: string;
  primaryDx: string;
  program: string;
  insurance: string;
  insuranceStatus: 'Verified' | 'Pending' | 'Denied' | 'Self-Pay';
  status: AdmitStatus;
  coordinator: string;
  createdDate: string;
  notes: string;
  asamPre?: { d1: number; d2: number; d6: number };
}

const PENDING: PendingAdmission[] = [
  { id: 'pa_demo', name: 'Jonny Quest', age: 36, gender: 'M', phone: '(301) 555-8821', referralSource: 'Self-Referral', primaryDx: 'Alcohol Use Disorder (Moderate)', program: 'IOP', insurance: 'CareFirst BlueCross BlueShield', insuranceStatus: 'Verified', status: 'Insurance Verify', coordinator: 'Amanda Lewis', createdDate: '2026-07-18', notes: 'Auth #CFBC-7741-IOP confirmed through 10/20/2026. ASAM pre-screen indicates IOP (2.1) level of care. CIWA-Ar: 2 — no medical detox required. First IOP session slot to be confirmed pending formal admission. All checklist items complete and editable below.', asamPre: { d1: 1, d2: 0, d6: 1 } },
  { id: 'pa1', name: 'Thomas Reilly', age: 44, gender: 'M', phone: '(615) 882-4471', referralSource: 'Vanderbilt ER', primaryDx: 'Severe Alcohol Use Disorder', program: 'Residential', insurance: 'Aetna', insuranceStatus: 'Verified', status: 'Bed Assigned', coordinator: 'Amanda Lewis', createdDate: '2026-07-17', notes: 'CIWA 14 on intake screen. Medically supervised detox required. Bed 3C confirmed.', asamPre: { d1: 3, d2: 3, d6: 3 } },
  { id: 'pa2', name: 'Nicole Harrison', age: 32, gender: 'F', phone: '(629) 551-0034', referralSource: 'Cumberland Heights', primaryDx: 'Opioid Use Disorder (Moderate)', program: 'PHP', insurance: 'BlueCross', insuranceStatus: 'Verified', status: 'Insurance Verify', coordinator: 'Amanda Lewis', createdDate: '2026-07-16', notes: 'Step-down from residential at Cumberland. Currently on Suboxone 16mg/day.', asamPre: { d1: 2, d2: 1, d6: 2 } },
  { id: 'pa3', name: 'Andre Simmons', age: 29, gender: 'M', phone: '(901) 774-3820', referralSource: 'Drug Court — Judge Wallace', primaryDx: 'Methamphetamine Use Disorder', program: 'Residential', insurance: 'Maryland Medicaid', insuranceStatus: 'Pending', status: 'Pre-Screen', coordinator: 'Amanda Lewis', createdDate: '2026-07-18', notes: 'Court-mandated. Must confirm Level 3.7 clinical necessity for Maryland Medicaid. Pre-screen scheduled 10 AM.', asamPre: { d1: 3, d2: 2, d6: 3 } },
  { id: 'pa4', name: 'Brenda Castillo', age: 57, gender: 'F', phone: '(731) 920-5513', referralSource: 'Self-Referral', primaryDx: 'Alcohol Use Disorder, Co-occurring Anxiety', program: 'IOP', insurance: 'Cigna', insuranceStatus: 'Verified', status: 'Inquiry', coordinator: 'Amanda Lewis', createdDate: '2026-07-18', notes: 'Initial call this morning. Requested IOP due to work schedule. Insurance pre-auth in process.', asamPre: undefined },
  { id: 'pa5', name: 'Marcus Odom', age: 38, gender: 'M', phone: '(615) 430-7741', referralSource: 'Private Therapist — Dr. Ann Reid', primaryDx: 'Polysubstance Use (Alcohol + Benzodiazepine)', program: 'Residential', insurance: 'United', insuranceStatus: 'Verified', status: 'Admitted', coordinator: 'Amanda Lewis', createdDate: '2026-07-15', notes: 'Admitted 7/16. In detox protocol — Librium taper day 2. Clinically stable.', asamPre: { d1: 3, d2: 3, d6: 3 } },
];

const RECENT_ADMITS = [
  { name: 'Marcus Odom', mrn: 'MRN-91002', admitted: '2026-07-16', program: 'Residential', counselor: 'Sarah Jenkins, LPC', bed: '3C' },
  { name: 'Priya Mehta', mrn: 'MRN-90871', admitted: '2026-07-14', program: 'IOP', counselor: 'Maria Gonzales, LCSW', bed: 'N/A' },
  { name: 'Devon Price', mrn: 'MRN-90754', admitted: '2026-07-12', program: 'PHP', counselor: 'David Odom, LMFT', bed: 'N/A' },
  { name: 'Carol Sutton', mrn: 'MRN-90622', admitted: '2026-07-10', program: 'Residential', counselor: 'Sarah Jenkins, LPC', bed: '2B' },
];

const STATUS_COLORS: Record<AdmitStatus, string> = {
  'Inquiry': 'bg-gray-100 text-slate',
  'Pre-Screen': 'bg-blue-100 text-blue-700',
  'Insurance Verify': 'bg-amber-100 text-amber-700',
  'Bed Assigned': 'bg-purple-100 text-purple-700',
  'Admitted': 'bg-green-100 text-green-700',
};

const INS_COLORS: Record<string, string> = {
  'Verified': 'bg-green-100 text-green-700',
  'Pending': 'bg-amber-100 text-amber-700',
  'Denied': 'bg-red-100 text-red-700',
  'Self-Pay': 'bg-blue-100 text-blue-700',
};

const CHECKLIST_ITEMS = [
  'Initial inquiry call logged',
  'ASAM pre-screening completed',
  'Insurance eligibility verified',
  'Auth request submitted',
  'Bed availability confirmed',
  'Admission paperwork sent',
  'Transport arranged',
  'Medical history collected',
  'Consent forms signed',
  'Bed assignment finalized',
];

const IOP_CHECKLIST_ITEMS = [
  'Initial inquiry call logged',
  'ASAM pre-screening completed',
  'Insurance eligibility verified',
  'Auth / prior authorization submitted',
  'IOP schedule availability confirmed',
  'Admission paperwork sent',
  'First session appointment confirmed',
  'Medical history collected',
  'Consent forms signed',
  'Program orientation scheduled',
];

const STATUS_STEPS: AdmitStatus[] = ['Inquiry', 'Pre-Screen', 'Insurance Verify', 'Bed Assigned', 'Admitted'];

const REFERRAL_SOURCE_DATA = [
  { source: 'Hospital ER', count: 12 },
  { source: 'Self/Family', count: 9 },
  { source: 'Drug Court', count: 7 },
  { source: 'Therapist', count: 6 },
  { source: 'Step-Down', count: 5 },
  { source: 'PCP', count: 4 },
  { source: 'Employer EAP', count: 3 },
];

const INSURANCE_MIX = [
  { name: 'BlueCross', value: 28, color: '#3b82f6' },
  { name: 'Aetna', value: 10, color: '#22c55e' },
  { name: 'Maryland Medicaid', value: 18, color: '#a855f7' },
  { name: 'United', value: 15, color: '#f59e0b' },
  { name: 'Cigna', value: 10, color: '#ec4899' },
  { name: 'Self-Pay', value: 7, color: '#64748b' },
];

const MONTHLY_ADMITS = [
  { month: 'Feb', residential: 6, php: 4, iop: 3 },
  { month: 'Mar', residential: 8, php: 5, iop: 4 },
  { month: 'Apr', residential: 7, php: 6, iop: 5 },
  { month: 'May', residential: 9, php: 4, iop: 6 },
  { month: 'Jun', residential: 11, php: 7, iop: 5 },
  { month: 'Jul', residential: 8, php: 5, iop: 4 },
];

export function Admissions({ navigate, readOnly }: Props) {
  const [activeTab, setActiveTab] = useState<'Pipeline' | 'Recent Admits' | 'Intake Checklist' | 'Analytics' | 'VOB Queue' | 'LOC Criteria'>('Pipeline');
  const [selected, setSelected] = useState<PendingAdmission | null>(PENDING[0]);
  const [filterStatus, setFilterStatus] = useState<AdmitStatus | 'All'>('All');
  // Interactive checklist state — pre-check all items for Jonny Quest (demo patient)
  const [checklistState, setChecklistState] = useState<Record<string, boolean[]>>(() => ({
    pa_demo: IOP_CHECKLIST_ITEMS.map(() => true),
  }));

  const getChecked = (p: PendingAdmission, idx: number): boolean => {
    if (checklistState[p.id]) return checklistState[p.id][idx];
    const stepIdx = STATUS_STEPS.indexOf(p.status);
    return idx < stepIdx * 2;
  };

  const toggleItem = (patientId: string, idx: number) => {
    if (readOnly) return;
    setChecklistState(prev => {
      const p = PENDING.find(x => x.id === patientId)!;
      const items = p.program === 'IOP' ? IOP_CHECKLIST_ITEMS : CHECKLIST_ITEMS;
      const existing = prev[patientId] ?? items.map((_, i) => {
        const stepIdx = STATUS_STEPS.indexOf(p.status);
        return i < stepIdx * 2;
      });
      const updated = [...existing];
      updated[idx] = !updated[idx];
      return { ...prev, [patientId]: updated };
    });
  };

  const filtered = filterStatus === 'All' ? PENDING : PENDING.filter(p => p.status === filterStatus);
  const pipeline: Record<AdmitStatus, number> = { Inquiry: 0, 'Pre-Screen': 0, 'Insurance Verify': 0, 'Bed Assigned': 0, Admitted: 0 };
  PENDING.forEach(p => pipeline[p.status]++);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Admissions / Intake</h1>
          <p className="text-slate text-sm mt-0.5">Pending referrals and intake pipeline</p>
        </div>
        <LockedButton locked={readOnly} className="btn-primary text-sm px-4 py-2">+ New Referral</LockedButton>
      </div>

      {/* Pipeline Kanban Summary */}
      <div className="grid grid-cols-5 gap-3">
        {STATUS_STEPS.map(step => (
          <button
            key={step}
            onClick={() => setFilterStatus(filterStatus === step ? 'All' : step)}
            className={`card text-center cursor-pointer transition-all hover:shadow-md ${filterStatus === step ? 'ring-2 ring-orange' : ''}`}
          >
            <div className="text-2xl font-bold text-navy">{pipeline[step]}</div>
            <div className={`text-xs mt-1.5 px-2 py-0.5 rounded-full inline-block font-medium ${STATUS_COLORS[step]}`}>{step}</div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['Pipeline', 'Recent Admits', 'Intake Checklist', 'Analytics', 'VOB Queue', 'LOC Criteria'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {activeTab === 'Pipeline' && (
        <div className="grid grid-cols-5 gap-6">
          {/* List */}
          <div className="col-span-2 space-y-2">
            {filtered.map(p => (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                className={`card cursor-pointer transition-all hover:shadow-md p-3 ${selected?.id === p.id ? 'ring-2 ring-orange' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-navy">{p.name}</div>
                    <div className="text-xs text-slate">{p.age} {p.gender} · {p.program} · {p.insurance}</div>
                    <div className="text-xs text-slate mt-0.5">{p.referralSource}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INS_COLORS[p.insuranceStatus]}`}>{p.insuranceStatus}</span>
                  <span className="text-xs text-slate">{p.createdDate}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="col-span-3 space-y-4">
              <div className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-navy">{selected.name}</h2>
                    <p className="text-slate text-sm">{selected.age} {selected.gender} · {selected.phone}</p>
                  </div>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    {STATUS_STEPS.map((step, i) => {
                      const stepIdx = STATUS_STEPS.indexOf(selected.status);
                      return (
                        <div key={step} className="flex flex-col items-center flex-1">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${i <= stepIdx ? 'bg-orange border-orange text-white' : 'bg-white border-gray-300 text-slate'}`}>
                            {i < stepIdx ? '✓' : i + 1}
                          </div>
                          <div className="text-xs text-slate text-center mt-1 leading-tight">{step}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div><span className="text-slate">Primary Dx:</span> <span className="font-medium text-navy">{selected.primaryDx}</span></div>
                  <div><span className="text-slate">Program:</span> <span className="font-medium text-navy">{selected.program}</span></div>
                  <div><span className="text-slate">Insurance:</span> <span className="font-medium text-navy">{selected.insurance}</span></div>
                  <div><span className="text-slate">Auth Status:</span> <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INS_COLORS[selected.insuranceStatus]}`}>{selected.insuranceStatus}</span></div>
                  <div><span className="text-slate">Referral Source:</span> <span className="font-medium text-navy">{selected.referralSource}</span></div>
                  <div><span className="text-slate">Coordinator:</span> <span className="font-medium text-navy">{selected.coordinator}</span></div>
                </div>

                {selected.asamPre && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">ASAM Pre-Screen</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div><span className="text-slate">D1 Intox/W:</span> <span className="font-bold text-navy">{selected.asamPre.d1}</span></div>
                      <div><span className="text-slate">D2 Medical:</span> <span className="font-bold text-navy">{selected.asamPre.d2}</span></div>
                      <div><span className="text-slate">D6 Living:</span> <span className="font-bold text-navy">{selected.asamPre.d6}</span></div>
                    </div>
                  </div>
                )}

                <div className="mt-4 bg-gray-50 border border-border rounded-lg p-3">
                  <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Coordinator Notes</div>
                  <p className="text-sm text-navy">{selected.notes}</p>
                </div>

                <div className="flex gap-2 mt-4">
                  <LockedButton locked={readOnly} className="btn-primary text-sm px-4 py-2 flex-1">Advance Status</LockedButton>
                  <LockedButton locked={readOnly} className="btn-outline text-sm px-4 py-2">Add Note</LockedButton>
                  <LockedButton locked={readOnly} className="btn-outline text-sm px-4 py-2 text-red-600 border-red-200 hover:bg-red-50">Decline</LockedButton>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Recent Admits' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">MRN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Admitted</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Program</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Counselor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Bed</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ADMITS.map((a, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-navy">{a.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate">{a.mrn}</td>
                  <td className="px-4 py-3 text-slate">{a.admitted}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{a.program}</span></td>
                  <td className="px-4 py-3 text-slate">{a.counselor}</td>
                  <td className="px-4 py-3 font-mono text-navy">{a.bed}</td>
                  <td className="px-4 py-3"><button className="text-xs text-orange hover:underline">View Chart</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Admits (Jul)', value: 17, sub: '+3 vs Jun', color: 'text-navy' },
              { label: 'Avg Days to Admit', value: '2.4d', sub: 'From inquiry to bed', color: 'text-navy' },
              { label: 'Insurance Auth Rate', value: '81%', sub: 'Verified at admission', color: 'text-green-600' },
              { label: 'Denial Rate', value: '8%', sub: 'Insurance denials', color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="card">
                <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
                <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Monthly admits by program */}
            <div className="card">
              <div className="text-sm font-semibold text-navy mb-4">Monthly Admissions by Program</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MONTHLY_ADMITS} margin={{ top: 0, right: 10, bottom: 0, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip />
                    <Bar dataKey="residential" name="Residential" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="php" name="PHP" stackId="a" fill="#8b5cf6" />
                    <Bar dataKey="iop" name="IOP" stackId="a" fill="#22c55e" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Insurance mix */}
            <div className="card">
              <div className="text-sm font-semibold text-navy mb-4">Insurance Payer Mix (YTD)</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={INSURANCE_MIX} cx="40%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${value}%`} labelLine={false}>
                      {INSURANCE_MIX.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Legend formatter={v => <span className="text-xs text-navy">{v}</span>} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Referral sources */}
          <div className="card">
            <div className="text-sm font-semibold text-navy mb-4">Referral Sources (Last 90 Days)</div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REFERRAL_SOURCE_DATA} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis dataKey="source" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                  <Tooltip />
                  <Bar dataKey="count" name="Admissions" fill="#f97316" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Intake Checklist' && (
        <div className="grid grid-cols-2 gap-6">
          {PENDING.map(p => {
            const items = p.program === 'IOP' ? IOP_CHECKLIST_ITEMS : CHECKLIST_ITEMS;
            const checkedCount = items.filter((_, idx) => getChecked(p, idx)).length;
            return (
              <div key={p.id} className={`card ${p.id === 'pa_demo' ? 'ring-2 ring-sunrise-blue/40' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-navy flex items-center gap-2">
                      {p.name}
                      {p.id === 'pa_demo' && <span className="text-[10px] bg-sunrise-blue/10 text-sunrise-blue px-2 py-0.5 rounded-full font-semibold">Demo</span>}
                    </div>
                    <div className="text-xs text-slate">{p.program} · {p.insurance}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((item, idx) => {
                    const checked = getChecked(p, idx);
                    return (
                      <label
                        key={idx}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5 -mx-1 transition-colors"
                        onClick={() => toggleItem(p.id, idx)}
                      >
                        <input type="checkbox" checked={checked} readOnly className="accent-orange pointer-events-none" />
                        <span className={checked ? 'line-through text-slate' : 'text-navy'}>{item}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-slate">{checkedCount}/{items.length} complete</div>
                  <div className="h-1.5 w-28 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-success rounded-full transition-all" style={{ width: `${Math.round(checkedCount/items.length*100)}%` }} />
                  </div>
                  <div className="text-xs font-semibold text-success">{Math.round(checkedCount/items.length*100)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {activeTab === 'VOB Queue' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Verification of Benefits (VOB) queue — insurance verification status for pending and recent admissions.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'VOB Pending', value: 3, color: 'text-amber-600', sub: 'Awaiting payer response' },
              { label: 'Verified Today', value: 2, color: 'text-green-600', sub: 'Ready to admit' },
              { label: 'Auth Required', value: 4, color: 'text-blue-600', sub: 'PA in progress' },
              { label: 'Denied / Appeal', value: 1, color: 'text-red-600', sub: 'Appeals team notified' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <h3 className="font-semibold text-navy text-sm mb-3">VOB Queue — Active Cases</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Referral</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Insurance</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">LOC Requested</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">VOB Specialist</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Submitted</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Status</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Deductible/OOP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'Raymond Cole', ins: 'Aetna Behavioral', loc: 'Residential', spec: 'K. Santos', sub: '07/18', status: 'Verified', sColor: 'bg-green-100 text-green-700', financial: '$2,500 ded / $6,000 OOP' },
                  { name: 'Brittney Walsh', ins: 'CareFirst BCBS', loc: 'PHP', spec: 'K. Santos', sub: '07/18', status: 'Pending', sColor: 'bg-amber-100 text-amber-700', financial: 'TBD' },
                  { name: 'Jerome Simmons', ins: 'Cigna', loc: 'Residential', spec: 'L. Park', sub: '07/17', status: 'Auth Req.', sColor: 'bg-blue-100 text-blue-700', financial: '$1,000 ded met / $8,150 OOP' },
                  { name: 'Alicia Perkins', ins: 'Maryland Medicaid (CareFirst)', loc: 'Residential', spec: 'K. Santos', sub: '07/16', status: 'Verified', sColor: 'bg-green-100 text-green-700', financial: '$0 ded — Medicaid' },
                  { name: 'David Garza', ins: 'UHC / Optum', loc: 'IOP', spec: 'L. Park', sub: '07/15', status: 'Denied', sColor: 'bg-red-100 text-red-700', financial: 'Appeal in progress' },
                  { name: 'Sophia Lambert', ins: 'Self-Pay', loc: 'Residential', spec: 'Admin', sub: '07/18', status: 'Scholarship', sColor: 'bg-purple-100 text-purple-700', financial: '75% scholarship applied' },
                ].map(r => (
                  <tr key={r.name} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-navy">{r.name}</td>
                    <td className="px-3 py-2.5 text-slate">{r.ins}</td>
                    <td className="px-3 py-2.5 text-slate">{r.loc}</td>
                    <td className="px-3 py-2.5 text-slate">{r.spec}</td>
                    <td className="px-3 py-2.5 text-slate">{r.sub}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.sColor}`}>{r.status}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate">{r.financial}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'LOC Criteria' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Quick-reference ASAM-based level of care criteria — supports consistent admissions decision-making and medical necessity documentation for insurance authorization.</div>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                loc: 'Medically Managed Inpatient (Detox)', asam: 'Level 4-WM',
                inclusion: ['CIWA-Ar ≥10 or COWS ≥13', 'History of complicated withdrawal (seizures, DTs)', 'Concurrent medical conditions requiring 24h nursing supervision', 'Failure of lower LOC withdrawal management'],
                exclusion: ['Medically stable, no complicated withdrawal history', 'CIWA-Ar <8 with low seizure risk', 'Stable co-occurring psychiatric conditions'],
                auth: 'Typically 3–7 days; requires daily progress notes and interdisciplinary team review',
                color: 'border-red-300'
              },
              {
                loc: 'Residential Treatment', asam: 'Level 3.5 / 3.1',
                inclusion: ['Significant impairment requiring 24h structured environment', 'High relapse risk requiring 24h clinical supervision', 'Insufficient support in home environment for recovery', 'Multiple failed outpatient treatment attempts'],
                exclusion: ['Stable living environment with adequate support', 'Medically complex requiring hospital-level monitoring', 'Active suicidality requiring inpatient psychiatric hold'],
                auth: 'Typically 14–28 days; UR review every 5–7 days; discharge planning from Day 3',
                color: 'border-amber-300'
              },
              {
                loc: 'Partial Hospitalization Program (PHP)', asam: 'Level 2.5',
                inclusion: ['Needs daily structure but stable enough to return home evenings', 'Step-down from residential with continued clinical instability', 'Co-occurring psychiatric conditions requiring intensive support', 'Motivation for recovery present with moderate relapse risk'],
                exclusion: ['No safe housing to return to each evening', 'Active withdrawal requiring 24h monitoring', 'Unable to reliably transport to 5-day/week program'],
                auth: 'Typically 10–14 days; UR review every 7 days; payer-specific minimum hours requirements',
                color: 'border-blue-300'
              },
              {
                loc: 'Intensive Outpatient (IOP)', asam: 'Level 2.1',
                inclusion: ['Stable functioning but needs structured support ≥3 days/week', 'Step-down from PHP or residential with good progress', 'Mild-moderate withdrawal risk managed on outpatient basis', 'Adequate support system and safe housing environment'],
                exclusion: ['Unable to maintain sobriety in less-than-daily program', 'Imminent danger to self or others', 'Unstable psychiatric symptoms requiring daily monitoring'],
                auth: 'Typically 6–8 weeks; UR review every 2 weeks; attendance documentation required',
                color: 'border-green-300'
              },
            ].map(l => (
              <div key={l.loc} className={`card border-l-4 ${l.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-navy">{l.loc}</div>
                  <span className="font-mono text-blue-700 font-bold text-sm">{l.asam}</span>
                </div>
                <div className="text-xs space-y-2">
                  <div>
                    <div className="font-semibold text-green-700 mb-0.5">Inclusion Criteria</div>
                    <ul className="space-y-0.5">{l.inclusion.map(c => <li key={c} className="text-navy flex gap-1"><span className="text-green-500 shrink-0">✓</span>{c}</li>)}</ul>
                  </div>
                  <div>
                    <div className="font-semibold text-red-600 mb-0.5">Exclusion Criteria</div>
                    <ul className="space-y-0.5">{l.exclusion.map(c => <li key={c} className="text-navy flex gap-1"><span className="text-red-400 shrink-0">✗</span>{c}</li>)}</ul>
                  </div>
                  <div className="border-t border-border pt-1.5 text-slate"><span className="font-semibold text-slate">Authorization note:</span> {l.auth}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
