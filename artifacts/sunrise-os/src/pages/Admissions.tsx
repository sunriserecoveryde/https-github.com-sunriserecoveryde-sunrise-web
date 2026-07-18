import React, { useState } from 'react';
import { Screen } from '../App';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

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
  { id: 'pa1', name: 'Thomas Reilly', age: 44, gender: 'M', phone: '(615) 882-4471', referralSource: 'Vanderbilt ER', primaryDx: 'Severe Alcohol Use Disorder', program: 'Residential', insurance: 'Aetna', insuranceStatus: 'Verified', status: 'Bed Assigned', coordinator: 'Amanda Lewis', createdDate: '2026-07-17', notes: 'CIWA 14 on intake screen. Medically supervised detox required. Bed 3C confirmed.', asamPre: { d1: 3, d2: 3, d6: 3 } },
  { id: 'pa2', name: 'Nicole Harrison', age: 32, gender: 'F', phone: '(629) 551-0034', referralSource: 'Cumberland Heights', primaryDx: 'Opioid Use Disorder (Moderate)', program: 'PHP', insurance: 'BlueCross', insuranceStatus: 'Verified', status: 'Insurance Verify', coordinator: 'Amanda Lewis', createdDate: '2026-07-16', notes: 'Step-down from residential at Cumberland. Currently on Suboxone 16mg/day.', asamPre: { d1: 2, d2: 1, d6: 2 } },
  { id: 'pa3', name: 'Andre Simmons', age: 29, gender: 'M', phone: '(901) 774-3820', referralSource: 'Drug Court — Judge Wallace', primaryDx: 'Methamphetamine Use Disorder', program: 'Residential', insurance: 'TennCare', insuranceStatus: 'Pending', status: 'Pre-Screen', coordinator: 'Amanda Lewis', createdDate: '2026-07-18', notes: 'Court-mandated. Must confirm Level 3.7 clinical necessity for TennCare. Pre-screen scheduled 10 AM.', asamPre: { d1: 3, d2: 2, d6: 3 } },
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

const STATUS_STEPS: AdmitStatus[] = ['Inquiry', 'Pre-Screen', 'Insurance Verify', 'Bed Assigned', 'Admitted'];

export function Admissions({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<'Pipeline' | 'Recent Admits' | 'Intake Checklist'>('Pipeline');
  const [selected, setSelected] = useState<PendingAdmission | null>(PENDING[0]);
  const [filterStatus, setFilterStatus] = useState<AdmitStatus | 'All'>('All');

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
        <button className="btn-primary text-sm px-4 py-2">+ New Referral</button>
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
        {(['Pipeline', 'Recent Admits', 'Intake Checklist'] as const).map(t => (
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
                  <button className="btn-primary text-sm px-4 py-2 flex-1">Advance Status</button>
                  <button className="btn-outline text-sm px-4 py-2">Add Note</button>
                  <button className="btn-outline text-sm px-4 py-2 text-red-600 border-red-200 hover:bg-red-50">Decline</button>
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

      {activeTab === 'Intake Checklist' && (
        <div className="grid grid-cols-2 gap-6">
          {PENDING.filter(p => p.status !== 'Admitted').map(p => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-navy">{p.name}</div>
                  <div className="text-xs text-slate">{p.program} · {p.insurance}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
              </div>
              <div className="space-y-1.5">
                {CHECKLIST_ITEMS.map((item, idx) => {
                  const stepIdx = STATUS_STEPS.indexOf(p.status);
                  const checked = idx < stepIdx * 2;
                  return (
                    <label key={idx} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" readOnly checked={checked} className="accent-orange" />
                      <span className={checked ? 'line-through text-slate' : 'text-navy'}>{item}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-slate">{Math.round((STATUS_STEPS.indexOf(p.status) * 2 / CHECKLIST_ITEMS.length) * 100)}% Complete</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
