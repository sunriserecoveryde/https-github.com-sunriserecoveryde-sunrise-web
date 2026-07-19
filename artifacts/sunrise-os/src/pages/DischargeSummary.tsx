import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { LockedButton } from '../components/common/LockedButton';
import { getPatientMedications } from '../data/mockMedications';
import { CheckCircle, Printer, Save, Download } from 'lucide-react';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

interface DischargeGoal { goal: string; status: string; notes: string; }

interface DischargeDataType {
  admissionDate: string;
  dischargeDate: string;
  dischargeType: string;
  dischargeDestination: string;
  levelOfCareAtAdmission: string;
  levelOfCareAtDischarge: string;
  admissionDiagnoses: string[];
  dischargeDiagnoses: string[];
  admissionPresentation: string;
  treatmentReceived: string;
  clinicalProgress: string;
  goalsAddressed: DischargeGoal[];
  medicationsOnDischarge: string;
  followUpPlan: string;
  dischargePrecautions: string;
  clinicianSignature: string;
  cosignature: string;
  physicianSignature: string;
}

// Pre-fill demo discharge summary for Robert Navarro (p4) — close to discharge
const DISCHARGE_DATA: DischargeDataType = {
  admissionDate: '2026-07-01',
  dischargeDate: '2026-07-24',
  dischargeType: 'Planned / Completed',
  dischargeDestination: 'Independent apartment (patient-arranged)',
  levelOfCareAtAdmission: 'Residential (ASAM 3.7)',
  levelOfCareAtDischarge: 'Residential (ASAM 3.7) → Step-down to IOP recommended',

  admissionDiagnoses: [
    'F10.20 — Alcohol Use Disorder, Severe',
    'F33.1 — Major Depressive Disorder, Recurrent, Moderate',
    'Z63.0 — Occupational problem (DUI, Attorney license concern)',
  ],
  dischargeDiagnoses: [
    'F10.20 — Alcohol Use Disorder, Severe, In Early Remission',
    'F33.1 — Major Depressive Disorder, Recurrent, Moderate (improving)',
    'Z91.89 — Other specified personal risk factors (legal)',
  ],

  admissionPresentation: 'Robert Navarro, 45-year-old attorney presenting voluntary for residential treatment for severe alcohol use disorder following second DUI on 6/28/2026 and threat to bar license. Reports 25+ years of daily drinking escalating over 5 years. Alcohol intake 750ml+ bourbon/daily at peak. CIWA 8 at admission. PHQ-9 21 (severe depression). Legal involvement: pretrial diversion program with mandatory treatment completion.',

  treatmentReceived: `• 23 days residential treatment (ASAM 3.7)
• Individual counseling: 22 sessions (Sarah Jenkins, LPC) — motivational interviewing, CBT for depression/AUD, relapse prevention
• Group therapy: 85+ group sessions (process, psychoeducation, relapse prevention, trauma-informed)
• Psychiatric evaluation (Dr. Hughes, 7/3): initiated Lexapro 10mg for MDD
• Medical management (Dr. Chen): CIWA protocol completed Day 3; acamprosate initiated
• Medication education: naltrexone vs. acamprosate vs. disulfiram — patient chose acamprosate
• Family system work: wife participated in 2 family sessions with written 42 CFR consent
• Peer support: identified AA home group (Brentwood Sunday 10AM), working with sponsor David H.
• Vocational: letter of support completed for Bar Association compliance program`,

  clinicalProgress: `• CIWA score: 8 → 0 by Day 3 (no detox medications required beyond Day 1 monitoring)
• PHQ-9: 21 (admission) → 9 (discharge) — significant improvement with Lexapro + therapy
• Craving score: 8/10 (Day 1) → 2/10 (Day 22)
• Recovery Engagement Score: 45 (admission) → 78 (discharge)
• Mood: 3/10 → 8/10
• Group attendance: 91% (88/97 scheduled sessions)
• Patient demonstrated: improved insight into triggers, developed written relapse prevention plan, identified 3 high-risk situations with coping strategies
• Patient verbalized understanding of chronic disease model and commitment to long-term recovery`,

  goalsAddressed: [
    { goal: 'Achieve medical stability and detoxification', status: 'Met', notes: 'CIWA protocol completed Day 3 without complications. No seizures.' },
    { goal: 'Engage in individual therapy and address underlying depression', status: 'Substantially Met', notes: 'PHQ-9 improved from 21 to 9. Lexapro 10mg initiated with good tolerability. Ongoing outpatient therapy strongly recommended.' },
    { goal: 'Develop relapse prevention plan with specific triggers and coping strategies', status: 'Met', notes: 'Written RP plan completed 7/20. Patient identified: high-stress legal situations, social drinking environments, and isolation as top 3 triggers.' },
    { goal: 'Engage family in treatment and repair communication', status: 'Partially Met', notes: 'Wife attended 2 sessions. Relationship improving. Couples counseling recommended as outpatient goal.' },
    { goal: 'Identify peer support and AA participation', status: 'Met', notes: 'Home group identified. Sponsor David H. engaged. Patient to attend minimum 3 meetings/week.' },
    { goal: 'Address legal and occupational stressors', status: 'In Progress', notes: 'Bar Association support letter completed. Court diversion requirements being met. Court report due 7/30.' },
  ],

  medicationsOnDischarge: `1. Acamprosate (Campral) 666mg TID — AUD maintenance; take with meals
2. Escitalopram (Lexapro) 10mg QD — MDD; take in morning; do NOT abruptly discontinue
3. Multivitamin QD — general supplementation

Medications patient is NOT taking at discharge that were discussed:
• Naltrexone — patient declined; acamprosate chosen
• Disulfiram — patient declined due to occupational travel concerns`,

  followUpPlan: `1. Outpatient individual therapy: Amanda Curtis, LCSW — weekly x 3 months (appt 7/26, 615-555-1234)
2. Psychiatry follow-up: Dr. Marcus Stone — 8/3/2026 (Lexapro monitoring)
3. Primary care: Dr. Martinez — 7/31 (med reconciliation, liver function recheck)
4. AA commitment: Brentwood Sunday 10AM home group (sponsor: David H., 615-555-7890)
5. Court: Pretrial diversion report due 7/30 — Bar Association compliance program enrollment complete
6. IOP: Patient was recommended IOP as step-down but declined — will monitor closely with therapist`,

  dischargePrecautions: `• OVERDOSE RISK: After residential treatment, tolerance is significantly reduced. If relapse occurs, DO NOT use the same amount as before treatment — risk of fatal overdose is HIGH.
• Narcan kit NOT provided (no opioid use history) — family educated on alcohol-related overdose risk
• Patient instructed to call 988 (Suicide & Crisis Lifeline) or go to nearest ED if SI returns
• Patient to call Sunrise Alumni Line if struggling: (615) 555-0100 x HELP
• Emergency contacts: wife Emily (615-555-9211), sponsor David H. (615-555-7890), Dr. Chen on-call (pager 4421)
• Return to ED or call 911 if: seizures, loss of consciousness, severe chest pain, confusion`,

  clinicianSignature: 'Sarah Jenkins, LPC — Primary Counselor — July 24, 2026',
  cosignature: 'Dr. James Carter, CADC-III — Clinical Director — July 24, 2026',
  physicianSignature: 'Dr. Robert Chen, MD — Medical Director — July 24, 2026',
};

const GOAL_STATUS_STYLE: Record<string, string> = {
  'Met':               'bg-green-100 text-green-700',
  'Substantially Met': 'bg-blue-100 text-blue-700',
  'Partially Met':     'bg-amber-100 text-amber-700',
  'In Progress':       'bg-purple-100 text-purple-700',
  'Not Met':           'bg-red-100 text-red-700',
};

export function DischargeSummary({ navigate, readOnly }: Props) {
  const [selectedPatient, setSelectedPatient] = useState('p4');
  const [tab, setTab] = useState<'Draft' | 'Print Preview' | 'Continuity of Care' | 'Distribution Log'>('Draft');
  const [saved, setSaved] = useState(false);

  const p = MOCK_PATIENTS.find(pt => pt.id === selectedPatient) ?? MOCK_PATIENTS[0];
  const meds = getPatientMedications(p.id);

  const goals = DISCHARGE_DATA.goalsAddressed as { goal: string; status: string; notes: string }[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Discharge Summary</h1>
          <p className="text-slate text-sm mt-0.5">Clinical discharge documentation · CARF / CMS required within 5 business days of discharge</p>
        </div>
        <div className="flex gap-2">
          <LockedButton locked={readOnly} onClick={() => !readOnly && setSaved(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
            <Save className="w-4 h-4" />{saved ? 'Saved ✓' : 'Save Summary'}
          </LockedButton>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['Draft', 'Print Preview', 'Continuity of Care', 'Distribution Log'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}</div>

      {/* Patient selector */}
      <div className="card">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient</label>
            <select className="border border-border rounded-lg px-3 py-2 text-sm w-full max-w-sm" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
              {MOCK_PATIENTS.map(pt => <option key={pt.id} value={pt.id}>{pt.firstName} {pt.lastName} — {pt.mrn}</option>)}
            </select>
          </div>
          <div className="text-sm space-y-1">
            <div className="text-xs text-slate"><span className="font-semibold text-navy">MRN:</span> {p.mrn} · <span className="font-semibold text-navy">DOB:</span> {p.dob}</div>
            <div className="text-xs text-slate"><span className="font-semibold text-navy">Program:</span> {p.program} · <span className="font-semibold text-navy">LOS:</span> {p.los} days</div>
            <div className="text-xs text-slate"><span className="font-semibold text-navy">Insurance:</span> {p.insurance}</div>
          </div>
          <div className="text-sm space-y-1">
            <div className="text-xs text-slate"><span className="font-semibold text-navy">Admission:</span> {DISCHARGE_DATA.admissionDate as string}</div>
            <div className="text-xs text-slate"><span className="font-semibold text-navy">Discharge:</span> {DISCHARGE_DATA.dischargeDate as string}</div>
            <div className="text-xs text-slate"><span className="font-semibold text-navy">Type:</span> {DISCHARGE_DATA.dischargeType as string}</div>
          </div>
        </div>
      </div>

      {tab === 'Draft' && (
        <div className="space-y-4">
          {/* Discharge type */}
          <div className="card grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Discharge Type</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                <option>Planned / Completed</option>
                <option>AMA — Against Medical Advice</option>
                <option>Step-Down (Lower LOC)</option>
                <option>Step-Up (Higher LOC)</option>
                <option>Transfer — Medical</option>
                <option>Transfer — Psychiatric</option>
                <option>Administrative Discharge</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Discharge Destination</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" defaultValue={DISCHARGE_DATA.dischargeDestination as string} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Step-Down Recommendation</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                <option>IOP (ASAM 2.1) — recommended</option>
                <option>PHP (ASAM 2.5)</option>
                <option>Outpatient (ASAM 1.0)</option>
                <option>No further treatment indicated</option>
              </select>
            </div>
          </div>

          {/* Diagnoses */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-navy">Diagnoses</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Admission Diagnoses</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none" defaultValue={(DISCHARGE_DATA.admissionDiagnoses as string[]).join('\n')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Discharge Diagnoses</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none" defaultValue={(DISCHARGE_DATA.dischargeDiagnoses as string[]).join('\n')} />
              </div>
            </div>
          </div>

          {/* Clinical narrative */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-navy">Clinical Narrative</h3>
            {[
              { label: 'Admission Presentation & Reason for Treatment', key: 'admissionPresentation' },
              { label: 'Treatment Services Received', key: 'treatmentReceived' },
              { label: 'Clinical Progress & Response to Treatment', key: 'clinicalProgress' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">{f.label}</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none" style={{ minHeight: '100px' }} defaultValue={(DISCHARGE_DATA as unknown as Record<string, unknown>)[f.key] as string} />
              </div>
            ))}
          </div>

          {/* Goals */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-navy">Treatment Goals & Outcomes</h3>
            {goals.map((g, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-start border border-border rounded-lg p-3">
                <div className="col-span-5">
                  <label className="block text-[10px] font-semibold text-slate uppercase mb-1">Goal</label>
                  <input className="w-full border border-border rounded px-2 py-1.5 text-sm" defaultValue={g.goal} />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-semibold text-slate uppercase mb-1">Status</label>
                  <select className="w-full border border-border rounded px-2 py-1.5 text-sm">
                    {['Met', 'Substantially Met', 'Partially Met', 'In Progress', 'Not Met'].map(s => (
                      <option key={s} selected={s === g.status}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4">
                  <label className="block text-[10px] font-semibold text-slate uppercase mb-1">Clinical Notes</label>
                  <input className="w-full border border-border rounded px-2 py-1.5 text-sm" defaultValue={g.notes} />
                </div>
              </div>
            ))}
            <button className="text-sm text-orange hover:underline">+ Add Goal</button>
          </div>

          {/* Medications */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-navy">Medications at Discharge</h3>
            <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[100px] resize-none" defaultValue={DISCHARGE_DATA.medicationsOnDischarge as string} />
          </div>

          {/* Follow-up plan */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-navy">Aftercare & Follow-up Plan</h3>
            <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[100px] resize-none" defaultValue={DISCHARGE_DATA.followUpPlan as string} />
          </div>

          {/* Discharge precautions */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-navy flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Discharge Precautions & Safety Instructions
            </h3>
            <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[100px] resize-none" defaultValue={DISCHARGE_DATA.dischargePrecautions as string} />
          </div>

          {/* Signatures */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-navy">Signatures</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Primary Counselor', val: DISCHARGE_DATA.clinicianSignature as string, signed: true },
                { label: 'Clinical Director (Co-sign)', val: DISCHARGE_DATA.cosignature as string, signed: true },
                { label: 'Medical Director', val: DISCHARGE_DATA.physicianSignature as string, signed: true },
              ].map(s => (
                <div key={s.label}>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">{s.label}</label>
                  <div className={`border rounded-lg p-3 ${s.signed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-dashed border-border'}`}>
                    {s.signed ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-xs text-green-700">{s.val}</span>
                      </div>
                    ) : (
                      <button className="text-xs text-orange hover:underline w-full text-center">Click to sign</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Print Preview' && (
        <div className="bg-white border border-border rounded-xl p-10 max-w-4xl mx-auto shadow-sm font-serif text-sm leading-relaxed space-y-6">
          {/* Letterhead */}
          <div className="text-center border-b border-gray-200 pb-6">
            <div className="text-2xl font-bold text-navy">Sunrise Recovery Center</div>
            <div className="text-gray-500 text-sm mt-1">123 Sunrise Way, Nashville, TN 37201 · (615) 555-0100</div>
            <div className="text-lg font-bold mt-4 tracking-widest uppercase text-gray-700">Discharge Summary</div>
            <div className="text-xs text-gray-500 mt-1">CONFIDENTIAL — 42 CFR Part 2 Protected Information</div>
          </div>

          {/* Patient info */}
          <div className="grid grid-cols-3 gap-4 text-xs border border-gray-200 rounded-lg p-4 bg-gray-50">
            {[
              ['Patient Name', `${p.firstName} ${p.lastName}`],
              ['MRN', p.mrn],
              ['Date of Birth', p.dob],
              ['Admission Date', DISCHARGE_DATA.admissionDate as string],
              ['Discharge Date', DISCHARGE_DATA.dischargeDate as string],
              ['Length of Stay', `${p.los} days`],
              ['Program', p.program],
              ['Discharge Type', DISCHARGE_DATA.dischargeType as string],
              ['Insurance', p.insurance],
            ].map(([label, val]) => (
              <div key={label}><span className="font-bold text-gray-700">{label}: </span><span>{val}</span></div>
            ))}
          </div>

          {/* Diagnoses */}
          <div>
            <div className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2 uppercase tracking-wider text-xs">Discharge Diagnoses</div>
            {(DISCHARGE_DATA.dischargeDiagnoses as string[]).map((d, i) => <div key={i} className="text-gray-700 text-sm">{d}</div>)}
          </div>

          {/* Sections */}
          {[
            { title: 'Admission Presentation', content: DISCHARGE_DATA.admissionPresentation as string },
            { title: 'Treatment Services Received', content: DISCHARGE_DATA.treatmentReceived as string },
            { title: 'Clinical Progress', content: DISCHARGE_DATA.clinicalProgress as string },
          ].map(s => (
            <div key={s.title}>
              <div className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2 uppercase tracking-wider text-xs">{s.title}</div>
              <div className="text-gray-700 whitespace-pre-line">{s.content}</div>
            </div>
          ))}

          {/* Goals table */}
          <div>
            <div className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2 uppercase tracking-wider text-xs">Treatment Goals & Outcomes</div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-3 py-2 text-left font-bold">Goal</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-bold w-36">Status</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((g, i) => (
                  <tr key={i}>
                    <td className="border border-gray-200 px-3 py-2">{g.goal}</td>
                    <td className="border border-gray-200 px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${GOAL_STATUS_STYLE[g.status]}`}>{g.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <div className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2 uppercase tracking-wider text-xs">Medications at Discharge</div>
            <div className="text-gray-700 whitespace-pre-line text-sm">{DISCHARGE_DATA.medicationsOnDischarge as string}</div>
          </div>
          <div>
            <div className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2 uppercase tracking-wider text-xs">Aftercare Plan</div>
            <div className="text-gray-700 whitespace-pre-line text-sm">{DISCHARGE_DATA.followUpPlan as string}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <div className="font-bold text-red-800 text-xs uppercase mb-1">Discharge Precautions</div>
            <div className="text-red-700 whitespace-pre-line text-xs">{DISCHARGE_DATA.dischargePrecautions as string}</div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-200">
            {[
              { label: 'Primary Counselor', val: DISCHARGE_DATA.clinicianSignature as string },
              { label: 'Clinical Director', val: DISCHARGE_DATA.cosignature as string },
              { label: 'Medical Director', val: DISCHARGE_DATA.physicianSignature as string },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="border-b border-gray-400 mb-1 pb-2 text-xs text-gray-700 italic">{s.val}</div>
                <div className="text-xs text-gray-500 uppercase">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
            This document is protected under 42 CFR Part 2 and HIPAA. Unauthorized disclosure is prohibited by federal law.
          </div>
        </div>
      )}

      {tab === 'Continuity of Care' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Post-discharge care coordination — referral status, follow-up appointments, aftercare plan, and warm handoffs to receiving providers.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Follow-Up Appointments Scheduled</h3>
              <div className="space-y-3">
                {[
                  { type: 'Outpatient Counseling', provider: 'Recovery Road Counseling Center', date: '2026-07-26', status: 'Confirmed', contact: '(615) 555-0198' },
                  { type: 'Buprenorphine Prescriber', provider: 'Dr. Anita Shah, MD (OBOT Clinic)', date: '2026-07-23', status: 'Confirmed', contact: '(615) 555-0241' },
                  { type: 'Primary Care', provider: 'Vanderbilt Medical Group — Dr. Parrish', date: '2026-08-05', status: 'Pending — awaiting callback', contact: '(615) 555-0112' },
                  { type: 'Psychiatry', provider: 'TN Behavioral Health Associates', date: '2026-08-12', status: 'Pending — referral sent', contact: '(615) 555-0339' },
                  { type: 'Peer Support / AA Sponsor', provider: 'Local AA — Group 114, Monday 7 PM', date: 'Ongoing', status: 'Committed', contact: 'Via patient' },
                ].map(f => (
                  <div key={f.type} className="border border-border rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-navy">{f.type}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${f.status === 'Confirmed' ? 'bg-green-100 text-green-700' : f.status === 'Committed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{f.status}</span>
                    </div>
                    <div className="text-slate">{f.provider}</div>
                    <div className="flex justify-between mt-0.5 text-slate">
                      <span>{f.date}</span>
                      <span>{f.contact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Warm Handoffs Completed</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { to: 'Recovery Road Counseling Center', method: 'Phone', date: '2026-07-18', staff: 'Sarah Jenkins, LPC', notes: 'Spoke with intake coordinator; patient\'s biopsychosocial summary faxed with consent.' },
                    { to: 'Dr. Anita Shah (OBOT)', method: 'Fax + Phone', date: '2026-07-18', staff: 'Dr. Robert Chen, MD', notes: 'MAT summary faxed; buprenorphine dose confirmed; labs forwarded with 42 CFR Part 2 consent.' },
                    { to: 'TN Behavioral Health Associates', method: 'Fax', date: '2026-07-18', staff: 'Maria Torres, LMFT', notes: 'Referral letter sent; psychiatric eval summary included; patient to call and confirm appt.' },
                  ].map(h => (
                    <div key={h.to} className="border border-border rounded-lg p-2.5">
                      <div className="font-semibold text-navy mb-0.5">{h.to}</div>
                      <div className="text-slate">{h.notes}</div>
                      <div className="flex gap-3 mt-1 text-[10px] text-slate">
                        <span>Method: {h.method}</span>
                        <span>Date: {h.date}</span>
                        <span>By: {h.staff}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Discharge Medications Dispensed</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { med: 'Buprenorphine/Naloxone 8mg/2mg SL', qty: '14 films', refills: '5', prescriber: 'Dr. R. Chen', note: 'Pt counseled on safe storage and no sharing' },
                    { med: 'Ondansetron 4mg PO PRN', qty: '10 tablets', refills: '2', prescriber: 'Dr. R. Chen', note: 'For nausea — take with first buprenorphine dose if needed' },
                    { med: 'Naloxone (Narcan) 4mg nasal spray', qty: '2 kits', refills: '1', prescriber: 'Dr. R. Chen', note: 'Patient and support person both trained on use' },
                  ].map(m => (
                    <div key={m.med} className="border border-border rounded-lg p-2.5">
                      <div className="font-semibold text-navy mb-0.5">{m.med}</div>
                      <div className="flex gap-4 text-[10px] text-slate mb-0.5">
                        <span>Qty: {m.qty}</span>
                        <span>Refills: {m.refills}</span>
                        <span>Rx: {m.prescriber}</span>
                      </div>
                      <div className="text-slate italic">{m.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Recovery Resources Provided</h3>
                <div className="space-y-1.5 text-xs">
                  {[
                    { resource: 'SAMHSA National Helpline', detail: '1-800-662-4357 · Free, confidential, 24/7' },
                    { resource: 'Crisis Text Line', detail: 'Text HOME to 741741' },
                    { resource: 'Alcoholics Anonymous (Local)', detail: 'aa.org/find-aa · Group 114 Mon 7 PM, First Baptist Nashville' },
                    { resource: 'SMART Recovery', detail: 'smartrecovery.org · Online and in-person meetings' },
                    { resource: 'Tennessee REDLINE (Opioid Helpline)', detail: '1-800-889-9789' },
                    { resource: 'Patient Bill of Rights', detail: 'Provided in writing at discharge — signed by patient' },
                    { resource: '42 CFR Part 2 Notice', detail: 'Confidentiality of SUD records — patient copy provided' },
                  ].map(r => (
                    <div key={r.resource} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                      <div>
                        <span className="font-medium text-navy">{r.resource}</span>
                        <span className="text-slate"> — {r.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Distribution Log' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Track distribution of discharge summaries to receiving providers, care coordinators, and the patient — ensures 42 CFR and CMS timely transmission compliance.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Summaries Sent (30d)', value: 18, color: 'text-navy', sub: 'To external providers' },
              { label: 'Avg Transmission Time', value: '4.2h', color: 'text-green-600', sub: 'Post-discharge; target ≤24h' },
              { label: 'Patient Copy Provided', value: '100%', color: 'text-teal-600', sub: '42 CFR Part 2 compliance' },
              { label: 'Pending Fax/Secure Send', value: 2, color: 'text-amber-600', sub: 'Awaiting provider confirmation' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Recent Distribution Log</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Patient', 'Discharge Date', 'Recipient', 'Recipient Type', 'Method', 'Sent', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { patient: 'Marcus Webb', dc: '2026-07-14', recipient: 'Dr. R. Evans, Nashville Health', type: 'PCP', method: 'Secure Fax', sent: '2026-07-14 14:22', status: 'Confirmed', ok: true },
                  { patient: 'Marcus Webb', dc: '2026-07-14', recipient: 'Patient Self', type: 'Patient', method: 'Printed / Given', sent: '2026-07-14 10:05', status: 'Confirmed', ok: true },
                  { patient: 'Samantha Choi', dc: '2026-07-15', recipient: 'Recovery Works IOP', type: 'Step-down', method: 'Secure Email', sent: '2026-07-15 09:41', status: 'Confirmed', ok: true },
                  { patient: 'Samantha Choi', dc: '2026-07-15', recipient: 'Patient Self', type: 'Patient', method: 'MyChart Portal', sent: '2026-07-15 09:00', status: 'Confirmed', ok: true },
                  { patient: 'James Thornton', dc: '2026-07-16', recipient: 'TN Drug Court', type: 'Legal', method: 'Secure Fax', sent: '2026-07-16 11:15', status: 'Pending Confirm', ok: false },
                  { patient: 'James Thornton', dc: '2026-07-16', recipient: 'Vanderbilt Psychiatry', type: 'Specialist', method: 'CommonWell HIE', sent: '2026-07-16 11:16', status: 'Delivered', ok: true },
                  { patient: 'Patricia Holloway', dc: '2026-07-17', recipient: 'Patient Self', type: 'Patient', method: 'Printed / Given', sent: '2026-07-17 08:30', status: 'Confirmed', ok: true },
                  { patient: 'Patricia Holloway', dc: '2026-07-17', recipient: 'Serenity Sober Living', type: 'Housing', method: 'Secure Email', sent: '2026-07-17 09:00', status: 'Pending Confirm', ok: false },
                ].map((r, i) => (
                  <tr key={i} className={`hover:bg-gray-50 ${!r.ok ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-3 py-2 font-medium text-navy">{r.patient}</td>
                    <td className="px-3 py-2 text-slate">{r.dc}</td>
                    <td className="px-3 py-2 text-navy">{r.recipient}</td>
                    <td className="px-3 py-2 text-slate">{r.type}</td>
                    <td className="px-3 py-2 text-slate">{r.method}</td>
                    <td className="px-3 py-2 text-slate">{r.sent}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.status === 'Confirmed' || r.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                    </td>
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
