import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { CheckCircle, Clock, AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type AdminStatus = 'Given' | 'Held' | 'Refused' | 'Missed' | 'N/A' | 'Pending';

interface MedSchedule {
  medName: string;
  dose: string;
  route: string;
  frequency: string;
  scheduled: string[]; // e.g. ['0800', '1200', '2000']
  controlled: boolean;
  controlledSchedule?: 'C-II' | 'C-III' | 'C-IV';
  category: 'MAT' | 'Psychiatric' | 'Medical' | 'PRN' | 'Vitamin';
}

interface PatientMAR {
  patientId: string;
  allergies: string;
  meds: MedSchedule[];
  administrations: Record<string, Record<string, { status: AdminStatus; givenBy?: string; givenAt?: string; notes?: string; witnessedBy?: string; }>>;
}

const TODAY = '2026-07-19';

const MAR_DATA: PatientMAR[] = [
  {
    patientId: 'p1',
    allergies: 'NKDA',
    meds: [
      { medName: 'Suboxone (Buprenorphine/Naloxone)', dose: '16mg', route: 'SL', frequency: 'QD', scheduled: ['0800'], controlled: true, controlledSchedule: 'C-III', category: 'MAT' },
      { medName: 'Lisinopril', dose: '10mg', route: 'PO', frequency: 'QD', scheduled: ['0800'], controlled: false, category: 'Medical' },
      { medName: 'Multivitamin', dose: '1 tab', route: 'PO', frequency: 'QD', scheduled: ['0800'], controlled: false, category: 'Vitamin' },
    ],
    administrations: {
      '0800': {
        'Suboxone (Buprenorphine/Naloxone)': { status: 'Given', givenBy: 'Jessica Torres, RN', givenAt: '08:04', witnessedBy: 'Michael Boyd, RN' },
        'Lisinopril': { status: 'Given', givenBy: 'Jessica Torres, RN', givenAt: '08:04' },
        'Multivitamin': { status: 'Given', givenBy: 'Jessica Torres, RN', givenAt: '08:04' },
      },
    },
  },
  {
    patientId: 'p2',
    allergies: 'Penicillin (rash)',
    meds: [
      { medName: 'Naltrexone (Vivitrol)', dose: '380mg IM', route: 'IM', frequency: 'Monthly', scheduled: ['0900'], controlled: false, category: 'MAT' },
      { medName: 'Lamictal (Lamotrigine)', dose: '100mg', route: 'PO', frequency: 'BID', scheduled: ['0800', '2000'], controlled: false, category: 'Psychiatric' },
      { medName: 'Prozac (Fluoxetine)', dose: '20mg', route: 'PO', frequency: 'QD', scheduled: ['0800'], controlled: false, category: 'Psychiatric' },
      { medName: 'Ativan PRN', dose: '0.5mg', route: 'PO', frequency: 'PRN q6h', scheduled: [], controlled: true, controlledSchedule: 'C-IV', category: 'PRN' },
    ],
    administrations: {
      '0800': {
        'Lamictal (Lamotrigine)': { status: 'Given', givenBy: 'Jessica Torres, RN', givenAt: '08:06' },
        'Prozac (Fluoxetine)': { status: 'Given', givenBy: 'Jessica Torres, RN', givenAt: '08:06' },
      },
    },
  },
  {
    patientId: 'p3',
    allergies: 'Sulfa drugs',
    meds: [
      { medName: 'Suboxone (Buprenorphine/Naloxone)', dose: '24mg', route: 'SL', frequency: 'QD', scheduled: ['0800'], controlled: true, controlledSchedule: 'C-III', category: 'MAT' },
      { medName: 'Clonidine (COWS)', dose: '0.1mg', route: 'PO', frequency: 'TID', scheduled: ['0800', '1400', '2000'], controlled: false, category: 'Medical' },
      { medName: 'Ibuprofen', dose: '400mg', route: 'PO', frequency: 'PRN q6h', scheduled: [], controlled: false, category: 'PRN' },
    ],
    administrations: {
      '0800': {
        'Suboxone (Buprenorphine/Naloxone)': { status: 'Given', givenBy: 'Michael Boyd, RN', givenAt: '08:12', witnessedBy: 'Jessica Torres, RN' },
        'Clonidine (COWS)': { status: 'Given', givenBy: 'Michael Boyd, RN', givenAt: '08:12' },
      },
      '1400': {
        'Clonidine (COWS)': { status: 'Pending' },
      },
    },
  },
  {
    patientId: 'p9',
    allergies: 'NKDA',
    meds: [
      { medName: 'Risperdal (Risperidone)', dose: '0.5mg PRN', route: 'PO', frequency: 'PRN q8h', scheduled: [], controlled: false, category: 'PRN' },
      { medName: 'Seroquel (Quetiapine)', dose: '25mg', route: 'PO', frequency: 'QHS', scheduled: ['2100'], controlled: false, category: 'Psychiatric' },
      { medName: 'Multivitamin B-Complex', dose: '1 tab', route: 'PO', frequency: 'QD', scheduled: ['0800'], controlled: false, category: 'Vitamin' },
    ],
    administrations: {
      '0800': {
        'Multivitamin B-Complex': { status: 'Given', givenBy: 'Michael Boyd, RN', givenAt: '08:20' },
      },
    },
  },
  {
    patientId: 'p13',
    allergies: 'Codeine (GI upset)',
    meds: [
      { medName: 'Acamprosate (Campral)', dose: '666mg', route: 'PO', frequency: 'TID', scheduled: ['0800', '1300', '1800'], controlled: false, category: 'MAT' },
      { medName: 'Lisinopril', dose: '20mg', route: 'PO', frequency: 'QD', scheduled: ['0800'], controlled: false, category: 'Medical' },
      { medName: 'Metformin', dose: '500mg', route: 'PO', frequency: 'BID with meals', scheduled: ['0800', '1800'], controlled: false, category: 'Medical' },
      { medName: 'Librium (Chlordiazepoxide)', dose: '25mg', route: 'PO', frequency: 'CIWA per protocol', scheduled: ['0800', '1400', '2000'], controlled: true, controlledSchedule: 'C-IV', category: 'Medical' },
    ],
    administrations: {
      '0800': {
        'Acamprosate (Campral)': { status: 'Given', givenBy: 'Jessica Torres, RN', givenAt: '08:10' },
        'Lisinopril': { status: 'Given', givenBy: 'Jessica Torres, RN', givenAt: '08:10' },
        'Metformin': { status: 'Given', givenBy: 'Jessica Torres, RN', givenAt: '08:10' },
        'Librium (Chlordiazepoxide)': { status: 'Held', givenBy: 'Jessica Torres, RN', givenAt: '08:10', notes: 'CIWA score 4 — below threshold. Hold per protocol.', witnessedBy: 'Michael Boyd, RN' },
      },
    },
  },
  {
    patientId: 'p17',
    allergies: 'NKDA',
    meds: [
      { medName: 'Suboxone (Buprenorphine/Naloxone)', dose: '8mg', route: 'SL', frequency: 'QD', scheduled: ['0800'], controlled: true, controlledSchedule: 'C-III', category: 'MAT' },
      { medName: 'Trazodone', dose: '50mg', route: 'PO', frequency: 'QHS PRN insomnia', scheduled: ['2100'], controlled: false, category: 'Psychiatric' },
    ],
    administrations: {
      '0800': {
        'Suboxone (Buprenorphine/Naloxone)': { status: 'Given', givenBy: 'Michael Boyd, RN', givenAt: '08:30', witnessedBy: 'Jessica Torres, RN' },
      },
    },
  },
];

const STATUS_STYLE: Record<AdminStatus, string> = {
  'Given':   'bg-green-100 text-green-700',
  'Held':    'bg-blue-100 text-blue-700',
  'Refused': 'bg-red-100 text-red-700',
  'Missed':  'bg-red-200 text-red-800',
  'N/A':     'bg-gray-100 text-gray-500',
  'Pending': 'bg-amber-100 text-amber-700',
};

const STATUS_ICON: Record<AdminStatus, React.ReactNode> = {
  'Given':   <CheckCircle className="w-3.5 h-3.5" />,
  'Held':    <Clock className="w-3.5 h-3.5" />,
  'Refused': <X className="w-3.5 h-3.5" />,
  'Missed':  <AlertTriangle className="w-3.5 h-3.5" />,
  'N/A':     <span className="text-[10px]">N/A</span>,
  'Pending': <Clock className="w-3.5 h-3.5" />,
};

const CAT_STYLE: Record<string, string> = {
  MAT:         'bg-orange-100 text-orange-700',
  Psychiatric: 'bg-purple-100 text-purple-700',
  Medical:     'bg-blue-100 text-blue-700',
  PRN:         'bg-gray-100 text-gray-600',
  Vitamin:     'bg-green-100 text-green-700',
};

const SHIFTS = ['0800', '1200', '1400', '1800', '2000', '2100'];

export function NursingMAR({ navigate, readOnly }: Props) {
  const [date] = useState(TODAY);
  const [expandedPatient, setExpandedPatient] = useState<string | null>('p1');
  const [administering, setAdministering] = useState<{ patientId: string; med: string; time: string } | null>(null);

  const pendingCount = MAR_DATA.reduce((acc, mar) => {
    return acc + mar.meds.filter(m => {
      if (m.scheduled.length === 0) return false;
      return m.scheduled.some(t => {
        const admin = mar.administrations[t]?.[m.medName];
        return !admin || admin.status === 'Pending';
      });
    }).length;
  }, 0);

  const missedCount = MAR_DATA.reduce((acc, mar) => {
    return acc + Object.values(mar.administrations).reduce((a, timeSlot) =>
      a + Object.values(timeSlot).filter(a => a.status === 'Missed').length, 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Nursing MAR</h1>
          <p className="text-slate text-sm mt-0.5">Medication Administration Record — {date} · Day Shift (07:00 – 19:00)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate">Charge Nurse</div>
            <div className="text-sm font-semibold text-navy">Jessica Torres, RN</div>
          </div>
          <button className="btn-primary text-sm px-4 py-2">Print MAR</button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Patients with Meds', value: MAR_DATA.length, sub: 'On this shift', color: 'text-navy' },
          { label: 'Total Scheduled Today', value: MAR_DATA.reduce((a, m) => a + m.meds.filter(med => med.scheduled.length > 0).length * 1, 0), sub: 'Scheduled doses', color: 'text-navy' },
          { label: 'Pending Administration', value: pendingCount, sub: 'Awaiting nurse sign-off', color: pendingCount > 0 ? 'text-amber-600' : 'text-green-600' },
          { label: 'Missed Doses', value: missedCount, sub: 'Requires incident note', color: missedCount > 0 ? 'text-red-600' : 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Controlled substance alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <span className="text-sm font-semibold text-red-800">Controlled Substance Policy: </span>
          <span className="text-sm text-red-800">All Schedule C-II, C-III, and C-IV medications require two-nurse witness documentation before administration. Both nurses must sign with their credentials. Count must match the controlled substance count sheet.</span>
        </div>
      </div>

      {/* Patient MAR accordion */}
      <div className="space-y-3">
        {MAR_DATA.map(mar => {
          const p = MOCK_PATIENTS.find(pt => pt.id === mar.patientId);
          if (!p) return null;
          const isExpanded = expandedPatient === mar.patientId;
          const hasPending = mar.meds.some(m => m.scheduled.some(t => !mar.administrations[t]?.[m.medName] || mar.administrations[t][m.medName].status === 'Pending'));
          const hasMissed = Object.values(mar.administrations).some(t => Object.values(t).some(a => a.status === 'Missed'));

          return (
            <div key={mar.patientId} className={`card p-0 overflow-hidden border ${hasMissed ? 'border-red-300' : hasPending ? 'border-amber-300' : 'border-border'}`}>
              <div
                className={`flex items-center gap-4 px-4 py-3 cursor-pointer ${hasMissed ? 'bg-red-50' : hasPending ? 'bg-amber-50/50' : 'hover:bg-gray-50'}`}
                onClick={() => setExpandedPatient(isExpanded ? null : mar.patientId)}
              >
                <div className="w-9 h-9 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {p.firstName[0]}{p.lastName[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button className="font-bold text-navy hover:text-orange text-sm" onClick={e => { e.stopPropagation(); navigate('PatientDetail', p.id); }}>
                      {p.firstName} {p.lastName}
                    </button>
                    <span className="text-xs text-slate">{p.mrn} · {p.bed ? `Bed ${p.bed}` : 'Bed TBD'} · {p.program}</span>
                    {hasMissed && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Missed Dose</span>}
                    {hasPending && !hasMissed && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pending</span>}
                    {!hasPending && !hasMissed && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Up to Date</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-0.5 text-[10px] text-slate">
                    <span>Allergies: <span className="font-medium text-red-600">{mar.allergies}</span></span>
                    <span>{mar.meds.length} medications · {mar.meds.filter(m => m.controlled).length} controlled</span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate" /> : <ChevronDown className="w-4 h-4 text-slate" />}
              </div>

              {isExpanded && (
                <div className="border-t border-border overflow-x-auto">
                  <table className="w-full text-xs min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-border">
                        <th className="text-left px-4 py-2 font-semibold text-slate uppercase text-[10px] w-48">Medication</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate uppercase text-[10px]">Dose / Route</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate uppercase text-[10px]">Freq</th>
                        {SHIFTS.map(s => (
                          <th key={s} className="text-center px-3 py-2 font-semibold text-slate uppercase text-[10px]">{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mar.meds.map(med => (
                        <tr key={med.medName} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-navy leading-tight">{med.medName}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${CAT_STYLE[med.category]}`}>{med.category}</span>
                              {med.controlled && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">{med.controlledSchedule}</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate">
                            <span className="font-semibold text-navy">{med.dose}</span>
                            <span className="ml-1">{med.route}</span>
                          </td>
                          <td className="px-3 py-3 text-slate">{med.frequency}</td>
                          {SHIFTS.map(shift => {
                            const isScheduled = med.scheduled.includes(shift);
                            const admin = mar.administrations[shift]?.[med.medName];
                            if (!isScheduled) {
                              return <td key={shift} className="px-3 py-3 text-center"><span className="text-slate opacity-30">—</span></td>;
                            }
                            if (!admin || admin.status === 'Pending') {
                              const isPast = parseInt(shift) < 1100; // simplistic past check
                              return (
                                <td key={shift} className="px-3 py-3 text-center">
                                  <LockedButton
                                    locked={readOnly}
                                    onClick={() => setAdministering({ patientId: mar.patientId, med: med.medName, time: shift })}
                                    className={`text-[10px] px-2 py-1 rounded-lg font-medium border ${isPast ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100' : 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'}`}
                                  >
                                    {isPast ? 'MISSED?' : 'GIVE'}
                                  </LockedButton>
                                </td>
                              );
                            }
                            return (
                              <td key={shift} className="px-3 py-3 text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-medium ${STATUS_STYLE[admin.status]}`}>
                                    {STATUS_ICON[admin.status]}
                                    {admin.status}
                                  </span>
                                  {admin.givenAt && <span className="text-[9px] text-slate">{admin.givenAt}</span>}
                                  {admin.witnessedBy && <span className="text-[9px] text-slate italic">W: {admin.witnessedBy.split(',')[0]}</span>}
                                  {admin.notes && <span className="text-[9px] text-blue-600 italic max-w-[80px] text-center leading-tight">{admin.notes.substring(0, 40)}</span>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Administration modal */}
      {administering && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setAdministering(null)}>
          <div className="bg-white rounded-xl p-6 shadow-2xl w-[460px]" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-navy mb-1">Document Administration</h3>
            <p className="text-sm text-slate mb-4">{administering.med} — {administering.time} dose</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Status *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Given</option><option>Held</option><option>Refused</option><option>Missed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Time Given</label>
                  <input type="time" defaultValue="10:00" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Administered By</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  <option>Jessica Torres, RN</option><option>Michael Boyd, RN</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Witness (if controlled substance)</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select witness...</option><option>Michael Boyd, RN</option><option>Jessica Torres, RN</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Notes</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none" placeholder="Patient tolerated well, any observations, hold reasons..." />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
                By signing, you certify this administration is accurate and was witnessed as required by facility policy and DEA regulations.
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setAdministering(null)} className="flex-1 border border-border rounded-lg py-2 text-sm text-slate">Cancel</button>
              <LockedButton locked={readOnly} onClick={() => setAdministering(null)} className="flex-1 btn-primary text-sm py-2">Sign & Save</LockedButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
