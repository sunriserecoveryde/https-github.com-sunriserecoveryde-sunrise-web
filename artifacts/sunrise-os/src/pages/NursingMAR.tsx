import React, { useState, useRef } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { CheckCircle, Clock, AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';
import { getRolesWithEditAccess } from '../data/mockRoles';
import { useDocumentForm } from '../hooks/useDocumentForm';
import { DocumentFormBar } from '../components/ui/DocumentFormBar';

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

const TODAY = '2026-07-22';

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

// ─── Nursing MAR Administration Form Bar ──────────────────────────────────────

function NursingMARAdminBar({ readOnly, editRoles, onCancel }: { readOnly?: boolean; editRoles: string[]; onCancel: () => void }) {
  const docId = useRef(`mar-admin-${Date.now()}`).current;
  const [adminNotes, setAdminNotes] = useState('');
  const docForm = useDocumentForm({
    docId,
    docType: 'MAR Administration',
    patientId: '',
    patientName: '',
    mrn: '',
    program: '',
    authorName: 'Jessica Torres, RN',
    authorId: 'torres',
    authorRole: 'RN',
    supervisor: 'Charge Nurse',
    requiresCoSign: false,
    requiredFields: ['Administration Notes'],
    fieldValues: { 'Administration Notes': adminNotes },
  });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate uppercase mb-1">Notes</label>
        <textarea
          value={adminNotes}
          onChange={e => { setAdminNotes(e.target.value); docForm.markDirty(); }}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none"
          placeholder="Patient tolerated well, any observations, hold reasons..."
        />
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
        By signing, you certify this administration is accurate and was witnessed as required by facility policy and DEA regulations.
      </div>
      <DocumentFormBar
        formState={docForm.formState}
        isLocked={docForm.isLocked}
        isSigned={docForm.isSigned}
        isDirty={docForm.isDirty}
        completionPct={docForm.completionPct}
        autosaveStatus={docForm.autosaveStatus}
        lastSaved={docForm.lastSaved}
        validationErrors={docForm.validationErrors}
        requiresCoSign={false}
        showAddendum={docForm.showAddendum}
        setShowAddendum={docForm.setShowAddendum}
        addendumText={docForm.addendumText}
        setAddendumText={docForm.setAddendumText}
        onAddAddendum={docForm.handleAddAddendum}
        versions={docForm.versions}
        editRoles={editRoles}
        authorName="Jessica Torres, RN"
        authorRole="RN"
        documentTitle="MAR Administration"
        onSaveDraft={() => { docForm.handleSaveDraft(); onCancel(); }}
        onSign={(record) => { if (docForm.handleSign(record)) { onCancel(); } }}
      />
      <button onClick={onCancel} className="w-full border border-border rounded-lg py-2 text-sm text-slate mt-1">Cancel</button>
    </div>
  );
}

// Module-level UI state — survives tab-switching (component unmount/remount)
let _marTab: 'MAR' | 'Controlled Log' | 'PRN History' | 'Allergy Registry' | 'Medication Errors' | 'Waste Log' = 'MAR';
let _expandedPatient: string | null = 'p1';

export function NursingMAR({ navigate, readOnly }: Props) {
  const editRoles = getRolesWithEditAccess('NursingMAR');
  const [date] = useState(TODAY);
  const [marTab, _setMarTab] = useState<'MAR' | 'Controlled Log' | 'PRN History' | 'Allergy Registry' | 'Medication Errors' | 'Waste Log'>(_marTab);
  const [expandedPatient, _setExpandedPatient] = useState<string | null>(_expandedPatient);
  const [administering, setAdministering] = useState<{ patientId: string; med: string; time: string } | null>(null);
  const [countVerified, setCountVerified] = useState(false);

  const setMarTab = (v: typeof marTab) => { _marTab = v; _setMarTab(v); };
  const setExpandedPatient = (v: string | null) => { _expandedPatient = v; _setExpandedPatient(v); };

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
          <button onClick={() => { setCountVerified(true); setTimeout(() => setCountVerified(false), 2500); }} className="btn-primary text-sm px-4 py-2">Print MAR</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['MAR', 'Controlled Log', 'PRN History', 'Allergy Registry', 'Medication Errors', 'Waste Log'] as const).map(t => (
          <button key={t} onClick={() => setMarTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${marTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
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

      {marTab === 'MAR' && (
      <div className="space-y-4">
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
                  <div className="flex items-center gap-4 mt-0.5 text-[10px] text-slate flex-wrap">
                    <span>Allergies: <span className="font-medium text-red-600">{mar.allergies}</span></span>
                    <span>{mar.meds.length} medications · {mar.meds.filter(m => m.controlled).length} controlled</span>
                    {(() => {
                      const slots = mar.meds.flatMap(m => m.scheduled.map(t => ({ medName: m.medName, time: t })));
                      const given   = slots.filter(s => mar.administrations[s.time]?.[s.medName]?.status === 'Given').length;
                      const missed  = slots.filter(s => mar.administrations[s.time]?.[s.medName]?.status === 'Missed').length;
                      const pending = slots.length - given - missed;
                      return (
                        <span className="flex items-center gap-2">
                          {given   > 0 && <span className="text-green-700 font-semibold">✓ {given} given</span>}
                          {pending > 0 && <span className="text-amber-700 font-semibold">⏱ {pending} pending</span>}
                          {missed  > 0 && <span className="text-red-700 font-semibold">✕ {missed} missed</span>}
                          {slots.length === 0 && <span className="text-slate-400">PRN only</span>}
                        </span>
                      );
                    })()}
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
                                    editRoles={editRoles}
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
            {/* PRN interval check — warn if the med's q-interval hasn't elapsed */}
            {(() => {
              const patientMAR = MAR_DATA.find(p => p.patientId === administering.patientId);
              const medEntry = patientMAR?.meds.find(m => m.medName === administering.med);
              if (!medEntry) return null;
              // Parse interval hours from frequency string e.g. "PRN q6h" → 6
              const match = medEntry.frequency.match(/q(\d+)h/i);
              if (!match) return null;
              const intervalHrs = parseInt(match[1], 10);
              // Find the most recent Given administration for this med across all shifts
              const admins = patientMAR?.administrations ?? {};
              const givenShifts = Object.entries(admins)
                .filter(([, slotAdmins]) => slotAdmins[administering.med]?.status === 'Given')
                .map(([shift]) => shift) // shift keys like "0900", "1400"
                .sort();
              if (givenShifts.length === 0) return null;
              const lastShift = givenShifts[givenShifts.length - 1]; // e.g. "0900"
              const lh = parseInt(lastShift.slice(0, 2), 10);
              const lm = parseInt(lastShift.slice(2), 10);
              // administering.time is a shift key like "1000"
              const curShift = String(administering.time);
              const th = parseInt(curShift.slice(0, 2), 10);
              const tm = parseInt(curShift.slice(2), 10);
              const elapsedHrs = (th * 60 + tm - (lh * 60 + lm)) / 60;
              if (elapsedHrs < 0 || elapsedHrs >= intervalHrs) return null;
              const remainHrs = Math.floor(intervalHrs - elapsedHrs);
              const remainMins = Math.round((intervalHrs - elapsedHrs - remainHrs) * 60);
              const lastFmt = `${lh.toString().padStart(2, '0')}:${lm.toString().padStart(2, '0')}`;
              return (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-800 mb-0">
                  <span className="text-red-500 flex-none mt-0.5">⚠</span>
                  <span>
                    <strong>PRN Interval Warning:</strong> {administering.med} was last given at {lastFmt} ({elapsedHrs.toFixed(1)}h ago).
                    Order requires q{intervalHrs}h — <strong>{remainHrs}h {remainMins}m remaining</strong>. Requires MD override to proceed.
                  </span>
                </div>
              );
            })()}
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
            <NursingMARAdminBar readOnly={readOnly} editRoles={editRoles} onCancel={() => setAdministering(null)} />
          </div>
        </div>
      )}

      {/* Controlled Substance Count Sheet */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-red-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h2 className="font-bold text-navy">Controlled Substance Count Sheet — {date}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-red-700 font-medium">Shift count required at 07:00, 15:00, 23:00</span>
            <LockedButton locked={readOnly} onClick={() => { setCountVerified(true); setTimeout(() => setCountVerified(false), 3000); }} className={`text-xs px-3 py-1.5 rounded font-semibold ${countVerified ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}>{countVerified ? '✓ Count Verified' : 'Verify Count'}</LockedButton>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              {['Patient', 'Medication', 'Schedule', 'Qty on Hand', 'Qty Dispensed Today', 'Balance', 'Last Count By', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              { patient: 'Marcus Webb', mrn: 'MRN-83921', med: 'Suboxone 16mg SL', schedule: 'C-III', qtyHand: 28, dispensed: 1, countBy: 'J. Torres, RN', witness: 'M. Boyd, RN', ok: true },
              { patient: 'Samantha Choi', mrn: 'MRN-74563', med: 'Ativan 0.5mg PO', schedule: 'C-IV', qtyHand: 14, dispensed: 0, countBy: 'J. Torres, RN', witness: 'M. Boyd, RN', ok: true },
              { patient: 'James Thornton', mrn: 'MRN-62841', med: 'Suboxone 12mg SL', schedule: 'C-III', qtyHand: 20, dispensed: 1, countBy: 'J. Torres, RN', witness: 'M. Boyd, RN', ok: true },
              { patient: 'Robert Navarro', mrn: 'MRN-44782', med: 'Suboxone 8mg SL', schedule: 'C-III', qtyHand: 12, dispensed: 1, countBy: 'J. Torres, RN', witness: 'M. Boyd, RN', ok: true },
              { patient: 'Patricia Holloway', mrn: 'MRN-48320', med: 'Librium 25mg PO', schedule: 'C-IV', qtyHand: 6, dispensed: 2, countBy: 'Pending', witness: '—', ok: false },
              { patient: 'Elena Vasquez', mrn: 'MRN-28841', med: 'Klonopin 0.5mg PO', schedule: 'C-IV', qtyHand: 9, dispensed: 1, countBy: 'J. Torres, RN', witness: 'M. Boyd, RN', ok: true },
            ].map(row => (
              <tr key={row.mrn} className={`hover:bg-slate-50 ${!row.ok ? 'bg-amber-50' : ''}`}>
                <td className="px-4 py-2.5">
                  <div className="font-semibold text-navy text-sm">{row.patient}</div>
                  <div className="text-[10px] text-slate font-mono">{row.mrn}</div>
                </td>
                <td className="px-4 py-2.5 font-medium text-navy text-sm">{row.med}</td>
                <td className="px-4 py-2.5"><span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded">{row.schedule}</span></td>
                <td className="px-4 py-2.5 font-mono font-bold text-navy">{row.qtyHand}</td>
                <td className="px-4 py-2.5 font-mono text-navy">{row.dispensed}</td>
                <td className="px-4 py-2.5 font-mono font-bold text-navy">{row.qtyHand - row.dispensed}</td>
                <td className="px-4 py-2.5 text-xs text-slate">
                  {row.ok ? (
                    <div>{row.countBy}<div className="text-[10px] text-slate">Witness: {row.witness}</div></div>
                  ) : (
                    <span className="text-amber-700 font-semibold">Count required</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {row.ok
                    ? <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">✓ Verified</span>
                    : <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">⚠ Pending</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-2 bg-gray-50 border-t border-border text-xs text-slate flex items-center justify-between">
          <span>All counts require two-nurse witness signature per DEA CFR 21 §1304</span>
          <span className="font-medium text-navy">Last verified: 07:12 AM — J. Torres, RN &amp; M. Boyd, RN</span>
        </div>
      </div>
      </div>
      )}

      {marTab === 'PRN History' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">As-needed (PRN) medication administration history for the current shift — verifying appropriate intervals, clinical justification, and nurse documentation.</div>
          <div className="card overflow-hidden">
            <h3 className="font-semibold text-navy text-sm mb-3">PRN Administrations — Today</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Time</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Patient</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Medication</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Dose</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Indication</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">CIWA/COWS at Time</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Nurse</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Interval OK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { time: '07:45', patient: 'Marcus Webb', med: 'Lorazepam (Ativan)', dose: '1mg PO', indication: 'CIWA ≥10 — anxiety/tremor', score: 'CIWA 12', nurse: 'J. Torres, RN', ok: true },
                  { time: '08:20', patient: 'Darnell Price', med: 'Ondansetron (Zofran)', dose: '4mg ODT', indication: 'Nausea — COWS moderate', score: 'COWS 15', nurse: 'M. Boyd, RN', ok: true },
                  { time: '09:00', patient: 'Marcus Webb', med: 'Lorazepam (Ativan)', dose: '1mg PO', indication: 'CIWA escalation — 4h interval', score: 'CIWA 14', nurse: 'J. Torres, RN', ok: false },
                  { time: '09:30', patient: 'Keisha Brown', med: 'Ibuprofen', dose: '600mg PO', indication: 'Headache — withdrawal-related', score: 'N/A', nurse: 'M. Boyd, RN', ok: true },
                  { time: '10:15', patient: 'Tyler Nguyen', med: 'Clonidine', dose: '0.1mg PO', indication: 'COWS ≥13 — autonomic sx', score: 'COWS 16', nurse: 'J. Torres, RN', ok: true },
                  { time: '11:00', patient: 'Marcus Webb', med: 'Lorazepam (Ativan)', dose: '2mg PO', indication: 'CIWA threshold — MD order', score: 'CIWA 17', nurse: 'J. Torres, RN', ok: true },
                  { time: '11:45', patient: 'Angela Morse', med: 'Acetaminophen', dose: '650mg PO', indication: 'Pain — headache, myalgia', score: 'N/A', nurse: 'M. Boyd, RN', ok: true },
                ].map((r, i) => (
                  <tr key={i} className={`hover:bg-gray-50 ${!r.ok ? 'bg-amber-50' : ''}`}>
                    <td className="px-3 py-2.5 font-mono font-bold text-navy">{r.time}</td>
                    <td className="px-3 py-2.5 font-medium text-navy">{r.patient}</td>
                    <td className="px-3 py-2.5 text-slate">{r.med}</td>
                    <td className="px-3 py-2.5 text-slate">{r.dose}</td>
                    <td className="px-3 py-2.5 text-slate">{r.indication}</td>
                    <td className="px-3 py-2.5 font-semibold text-navy">{r.score}</td>
                    <td className="px-3 py-2.5 text-slate">{r.nurse}</td>
                    <td className="px-3 py-2.5">
                      {r.ok
                        ? <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">✓ OK</span>
                        : <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">⚠ Review</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <strong>Note:</strong> 09:00 Lorazepam administration for Marcus Webb was at a 75-minute interval — Ativan PRN order requires minimum 4-hour interval unless MD overrides. Clinical supervisor notified.
            </div>
          </div>
        </div>
      )}

      {marTab === 'Allergy Registry' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Active allergy and adverse reaction registry for all current patients — cross-referenced against MAR for contraindication alerts.</div>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-navy text-sm">Patient Allergy &amp; Adverse Reaction Registry</h3>
              <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded font-semibold">MAR Cross-Check: No Active Conflicts</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Patient</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Allergen</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Reaction</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Severity</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Verified By</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">On Wristband</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { patient: 'Marcus Webb', allergen: 'Penicillin', reaction: 'Rash, urticaria', sev: 'Moderate', by: 'J. Torres, RN', band: true },
                  { patient: 'Marcus Webb', allergen: 'Shellfish', reaction: 'GI distress', sev: 'Mild', by: 'J. Torres, RN', band: false },
                  { patient: 'Darnell Price', allergen: 'Sulfa drugs', reaction: 'Anaphylaxis (prior)', sev: 'Severe', by: 'M. Boyd, RN', band: true },
                  { patient: 'Keisha Brown', allergen: 'Codeine', reaction: 'Vomiting, confusion', sev: 'Moderate', by: 'J. Torres, RN', band: true },
                  { patient: 'Tyler Nguyen', allergen: 'Latex', reaction: 'Contact dermatitis', sev: 'Mild', by: 'M. Boyd, RN', band: true },
                  { patient: 'Angela Morse', allergen: 'NKDA', reaction: '—', sev: '—', by: 'M. Boyd, RN', band: false },
                  { patient: 'Ronald Kim', allergen: 'Aspirin', reaction: 'Bronchospasm', sev: 'Severe', by: 'J. Torres, RN', band: true },
                  { patient: 'Carmen Diaz', allergen: 'Haloperidol', reaction: 'Dystonic reaction', sev: 'Moderate', by: 'J. Torres, RN', band: true },
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-navy">{r.patient}</td>
                    <td className="px-3 py-2.5 font-semibold text-red-700">{r.allergen}</td>
                    <td className="px-3 py-2.5 text-slate">{r.reaction}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.sev === 'Severe' ? 'bg-red-100 text-red-700' : r.sev === 'Moderate' ? 'bg-amber-100 text-amber-700' : r.sev === 'Mild' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-slate'}`}>{r.sev}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate">{r.by}</td>
                    <td className="px-3 py-2.5 text-center">
                      {r.band ? <span className="text-green-600 font-bold">✓</span> : <span className="text-slate">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {marTab === 'Medication Errors' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Medication error and near-miss reporting log — ISMP categories, contributing factors, and corrective action tracking per Joint Commission and CARF standards.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Errors Reported (30d)', value: 2, color: 'text-amber-600', sub: 'All categories' },
              { label: 'Near Misses (30d)', value: 4, color: 'text-blue-600', sub: 'Caught before administration' },
              { label: 'Harm Reached Patient', value: 0, color: 'text-green-600', sub: 'No patient harm this period' },
              { label: 'Open Corrective Actions', value: 3, color: 'text-navy', sub: 'Under active remediation' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Error & Near-Miss Log — Last 30 Days</h3>
            <div className="space-y-3 text-xs">
              {[
                {
                  date: '2026-07-14', type: 'Wrong Dose', ismp: 'Category C (reached patient, no harm)', patient: 'Patient 7A', med: 'Clonidine 0.2 mg administered instead of 0.1 mg (double dose)',
                  discovered: 'Nurse self-report at 0830, prior to reassessment',
                  action: 'Vital signs q1h × 4h, BP remained stable. Report filed with Medical Director. Corrective action: 2-pharmacist check on clonidine doses. Training refresher scheduled.',
                  status: 'Closed', ok: true
                },
                {
                  date: '2026-07-11', type: 'Near Miss — Omission', ismp: 'Category B (error did not reach patient)', patient: 'Patient 3B', med: 'Buprenorphine morning dose nearly omitted due to MAR transcription gap from intake paperwork',
                  discovered: 'Charge nurse caught during pre-administration double check',
                  action: 'MAR corrected. Intake-to-MAR transcription workflow reviewed. New check: Intake RN and Charge RN both sign MAR setup for all new admissions.',
                  status: 'Action Pending', ok: false
                },
                {
                  date: '2026-07-08', type: 'Near Miss — Wrong Patient', ismp: 'Category B (error did not reach patient)', patient: 'Patients 5A / 5C (same unit)', med: 'Lorazepam PRN nearly given to incorrect patient — similar room numbers and first names',
                  discovered: 'Bedside barcode scan mismatch alert caught error',
                  action: 'Barcode scanning protocol reinforced. Wristband audit completed for all patients. Corrective action: verbal name confirmation + DOB required for all PRN meds.',
                  status: 'Closed', ok: true
                },
              ].map(e => (
                <div key={e.date} className={`border rounded-xl p-3 ${!e.ok ? 'border-amber-300 bg-amber-50/30' : 'border-border'}`}>
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <span className="font-semibold text-navy">{e.type}</span>
                      <span className="text-slate ml-2">· {e.date} · {e.ismp}</span>
                    </div>
                    <span className={`shrink-0 ml-3 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${e.ok ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{e.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><span className="font-semibold text-slate">Medication/Event:</span> <span className="text-navy">{e.med}</span></div>
                    <div><span className="font-semibold text-slate">Discovered:</span> <span className="text-navy">{e.discovered}</span></div>
                    <div><span className="font-semibold text-slate">Action Taken:</span> <span className="text-navy">{e.action}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {marTab === 'Waste Log' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Controlled substance waste documentation — dual-witness entries, discrepancy flags, and DEA compliance records.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Waste Events (Today)', value: 8, color: 'text-navy', sub: 'All dual-witnessed' },
              { label: 'Discrepancies (30d)', value: 1, color: 'text-amber-600', sub: 'Under investigation — Jul 12' },
              { label: 'DEA 222 Forms (YTD)', value: 14, color: 'text-navy', sub: 'Controlled substance orders' },
              { label: 'Audit-Ready', value: 'Yes', color: 'text-green-600', sub: 'All records current' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Waste Log — Today's Shift</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Time', 'Medication', 'Dose Ordered', 'Dose Given', 'Waste Amount', 'Reason', 'Nurse (Primary)', 'Witness', 'DEA Sched'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { time: '06:15', med: 'Morphine IV', ordered: '4mg', given: '2mg', waste: '2mg', reason: 'Partial dose per MD order', nurse: 'J. Torres, RN', witness: 'K. Park, LPN', sched: 'II' },
                  { time: '08:00', med: 'Lorazepam PO', ordered: '2mg', given: '1mg', waste: '1mg', reason: 'Patient refused remainder', nurse: 'J. Torres, RN', witness: 'M. Hill, RN', sched: 'IV' },
                  { time: '09:30', med: 'Clonazepam PO', ordered: '1mg', given: '0.5mg', waste: '0.5mg', reason: 'Dose reduction per CIWA protocol', nurse: 'M. Hill, RN', witness: 'J. Torres, RN', sched: 'IV' },
                  { time: '12:00', med: 'Buprenorphine SL', ordered: '16mg', given: '12mg', waste: '4mg', reason: 'Dose titration — day 3 induction', nurse: 'J. Torres, RN', witness: 'K. Park, LPN', sched: 'III' },
                  { time: '14:00', med: 'Hydromorphone IV', ordered: '1mg', given: '0.5mg', waste: '0.5mg', reason: 'Adequate pain control at half dose', nurse: 'M. Hill, RN', witness: 'J. Torres, RN', sched: 'II' },
                ].map(r => (
                  <tr key={r.time + r.med} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-slate">{r.time}</td>
                    <td className="px-3 py-2 font-semibold text-navy">{r.med}</td>
                    <td className="px-3 py-2 text-slate">{r.ordered}</td>
                    <td className="px-3 py-2 text-green-700 font-semibold">{r.given}</td>
                    <td className="px-3 py-2 text-amber-700 font-semibold">{r.waste}</td>
                    <td className="px-3 py-2 text-slate italic">{r.reason}</td>
                    <td className="px-3 py-2 text-slate">{r.nurse}</td>
                    <td className="px-3 py-2 text-slate">{r.witness}</td>
                    <td className="px-3 py-2 text-center"><span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Sch {r.sched}</span></td>
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

