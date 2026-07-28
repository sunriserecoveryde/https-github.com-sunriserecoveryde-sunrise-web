import React, { useState } from 'react';
import { Screen } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { X, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';
import { useDemoStore } from '../store/demoStore';

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
  { id: 'pa1', name: 'Thomas Reilly', age: 44, gender: 'M', phone: '(301) 882-4471', referralSource: 'MedStar Georgetown ER', primaryDx: 'Severe Alcohol Use Disorder', program: 'Residential', insurance: 'CareFirst BCBS', insuranceStatus: 'Verified', status: 'Bed Assigned', coordinator: 'Amanda Lewis', createdDate: '2026-07-17', notes: 'CIWA 14 on intake screen. Medically supervised detox required. Bed 3C confirmed.', asamPre: { d1: 3, d2: 3, d6: 3 } },
  { id: 'pa2', name: 'Nicole Harrison', age: 32, gender: 'F', phone: '(629) 551-0034', referralSource: 'Cumberland Heights', primaryDx: 'Opioid Use Disorder (Moderate)', program: 'PHP', insurance: 'BlueCross', insuranceStatus: 'Verified', status: 'Insurance Verify', coordinator: 'Amanda Lewis', createdDate: '2026-07-16', notes: 'Step-down from residential at Cumberland. Currently on Suboxone 16mg/day.', asamPre: { d1: 2, d2: 1, d6: 2 } },
  { id: 'pa3', name: 'Andre Simmons', age: 29, gender: 'M', phone: '(901) 774-3820', referralSource: 'Drug Court — Judge Wallace', primaryDx: 'Methamphetamine Use Disorder', program: 'Residential', insurance: 'Maryland Medicaid', insuranceStatus: 'Pending', status: 'Pre-Screen', coordinator: 'Amanda Lewis', createdDate: '2026-07-18', notes: 'Court-mandated. Must confirm Level 3.7 clinical necessity for Maryland Medicaid. Pre-screen scheduled 10 AM.', asamPre: { d1: 3, d2: 2, d6: 3 } },
  { id: 'pa4', name: 'Brenda Castillo', age: 57, gender: 'F', phone: '(731) 920-5513', referralSource: 'Self-Referral', primaryDx: 'Alcohol Use Disorder, Co-occurring Anxiety', program: 'IOP', insurance: 'Cigna', insuranceStatus: 'Verified', status: 'Inquiry', coordinator: 'Amanda Lewis', createdDate: '2026-07-18', notes: 'Initial call this morning. Requested IOP due to work schedule. Insurance pre-auth in process.', asamPre: undefined },
  { id: 'pa5', name: 'Marcus Odom', age: 38, gender: 'M', phone: '(301) 430-7741', referralSource: 'Private Therapist — Dr. Ann Reid', primaryDx: 'Polysubstance Use (Alcohol + Benzodiazepine)', program: 'Residential', insurance: 'UHC Community Plan MD', insuranceStatus: 'Verified', status: 'Admitted', coordinator: 'Amanda Lewis', createdDate: '2026-07-15', notes: 'Admitted 7/16. In detox protocol — Librium taper day 2. Clinically stable.', asamPre: { d1: 3, d2: 3, d6: 3 } },
];

const RECENT_ADMITS = [
  { name: 'Marcus Odom', mrn: 'MRN-91002', admitted: '2026-07-16', program: 'Residential', counselor: 'Sarah Jenkins, LCPC', bed: '3C' },
  { name: 'Priya Mehta', mrn: 'MRN-90871', admitted: '2026-07-14', program: 'IOP', counselor: 'Maria Gonzales, LCADC', bed: 'N/A' },
  { name: 'Devon Price', mrn: 'MRN-90754', admitted: '2026-07-12', program: 'PHP', counselor: 'David Odom, LCADC', bed: 'N/A' },
  { name: 'Carol Sutton', mrn: 'MRN-90622', admitted: '2026-07-10', program: 'Residential', counselor: 'Sarah Jenkins, LCPC', bed: '2B' },
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

// ─── 10-Step Intake Wizard ────────────────────────────────────────────────────

const WIZARD_STEPS = [
  'Referral Info',
  'Eligibility Check',
  'Insurance Verification',
  'Clinical Screening',
  'Risk Screening',
  'ASAM Recommendation',
  'Required Documents',
  'Admission Decision',
  'Bed Assignment',
  'Complete',
];

interface WizardState {
  // Step 1
  name: string; dob: string; gender: string; phone: string;
  referralSource: string; referralType: string;
  // Step 2
  primaryDx: string; coOccurring: string; program: string; legalInvolvement: string;
  // Step 3
  insurance: string; insuranceId: string; insuranceStatus: string; authNotes: string;
  // Step 4
  d1: string; d2: string; d3: string; d4: string; d5: string; d6: string;
  clinicalNotes: string;
  // Step 5
  suicideRisk: string; violenceRisk: string; withdrawalRisk: string; amaRisk: string;
  // Step 6
  asamRec: string; locRationale: string;
  // Step 7
  idOnFile: boolean; insuranceCardOnFile: boolean; consentSigned: boolean;
  cfr42Signed: boolean; medHistoryCollected: boolean;
  // Step 8
  decision: string; decisionReason: string; waitlistNotes: string;
  // Step 9
  assignedBed: string; admitDate: string; assignedCounselor: string;
  // Step 10 — filled automatically
}

const INITIAL_WIZARD: WizardState = {
  name: '', dob: '', gender: 'M', phone: '',
  referralSource: '', referralType: 'Self',
  primaryDx: '', coOccurring: '', program: 'Residential', legalInvolvement: 'None',
  insurance: '', insuranceId: '', insuranceStatus: 'Pending', authNotes: '',
  d1: '2', d2: '1', d3: '2', d4: '2', d5: '2', d6: '2',
  clinicalNotes: '',
  suicideRisk: 'Low', violenceRisk: 'Low', withdrawalRisk: 'Moderate', amaRisk: 'Low',
  asamRec: 'Residential (3.5)', locRationale: '',
  idOnFile: false, insuranceCardOnFile: false, consentSigned: false,
  cfr42Signed: false, medHistoryCollected: false,
  decision: 'Approved', decisionReason: '', waitlistNotes: '',
  assignedBed: '', admitDate: '2026-07-28', assignedCounselor: 'Sarah Jenkins, LCPC',
};

function IntakeWizard({ onClose, readOnly }: { onClose: () => void; readOnly?: boolean }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardState>(INITIAL_WIZARD);
  const [converted, setConverted] = useState(false);
  const [savedMrn, setSavedMrn] = useState('');
  const { addIntakePatient, convertIntakeToPatient, addAuditEntry } = useDemoStore();
  const [savedId, setSavedId] = useState<string | null>(null);

  function update(key: keyof WizardState, val: string | boolean) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function canAdvance(): boolean {
    if (step === 0) return form.name.trim().length > 0 && form.dob.length > 0 && form.phone.length > 0;
    if (step === 1) return form.primaryDx.trim().length > 0 && form.program.length > 0;
    if (step === 7) return form.decision.length > 0;
    return true;
  }

  function handleNext() {
    if (step < WIZARD_STEPS.length - 1) setStep(s => s + 1);
    if (step === WIZARD_STEPS.length - 2) {
      // Save to store on reaching "Complete"
      const newId = `ip-${Date.now()}`;
      addIntakePatient({
        id: newId,
        name: form.name,
        dob: form.dob,
        gender: form.gender,
        phone: form.phone,
        referralSource: form.referralSource,
        primaryDx: form.primaryDx,
        program: form.program,
        insurance: form.insurance,
        insuranceStatus: form.insuranceStatus as 'Verified' | 'Pending' | 'Denied' | 'Self-Pay',
        asamRec: form.asamRec,
        assignedBed: form.assignedBed,
        admissionDecision: form.decision as 'Approved' | 'Waitlist' | 'Deferred' | 'Declined',
        decisionReason: form.decisionReason,
        completedSteps: WIZARD_STEPS.length,
        notes: form.clinicalNotes,
      });
      setSavedId(newId);
      addAuditEntry({ staffName: 'Amanda Lewis', action: 'Intake Completed', entity: 'Admissions', detail: `New intake for ${form.name} — decision: ${form.decision}` });
    }
  }

  function handleConvert() {
    const mrn = `MRN-${90000 + Math.floor(Math.random() * 9000)}`;
    setSavedMrn(mrn);
    if (savedId) convertIntakeToPatient(savedId, mrn);
    addAuditEntry({ staffName: 'Amanda Lewis', action: 'Converted to Patient', entity: 'Admissions', detail: `${form.name} converted → ${mrn}` });
    setConverted(true);
  }

  const pct = Math.round(((step + 1) / WIZARD_STEPS.length) * 100);

  function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate uppercase mb-1">{label}{required && <span className="text-critical ml-0.5">*</span>}</label>
        {children}
      </div>
    );
  }

  const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sunrise-blue";
  const selectCls = "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sunrise-blue bg-white";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[680px] max-h-[92vh] overflow-hidden flex flex-col mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-navy">New Patient Intake</h2>
            <p className="text-xs text-slate">Step {step + 1} of {WIZARD_STEPS.length} — {WIZARD_STEPS[step]}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate hover:text-navy" /></button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 border-b border-border flex-shrink-0">
          <div className="flex gap-1 mb-2">
            {WIZARD_STEPS.map((s, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-all ${i < step ? 'bg-success' : i === step ? 'bg-sunrise-blue' : 'bg-slate-100'}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate font-medium">
            <span>{WIZARD_STEPS[step]}</span>
            <span>{pct}% complete</span>
          </div>
        </div>

        {/* Step names mini row */}
        <div className="px-6 py-2 border-b border-border bg-gray-50 flex gap-1 overflow-x-auto flex-shrink-0 no-scrollbar">
          {WIZARD_STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => i < step && setStep(i)}
              className={`text-[10px] whitespace-nowrap px-2 py-0.5 rounded flex items-center gap-1 font-medium ${
                i === step ? 'bg-sunrise-blue text-white' :
                i < step ? 'bg-success/20 text-success cursor-pointer' :
                'text-slate-300 cursor-default'
              }`}
            >
              {i < step && <Check className="w-2.5 h-2.5" />}
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 0: Referral Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name" required>
                  <input className={inputCls} placeholder="First Last" value={form.name} onChange={e => update('name', e.target.value)} />
                </Field>
                <Field label="Date of Birth" required>
                  <input type="date" className={inputCls} value={form.dob} onChange={e => update('dob', e.target.value)} />
                </Field>
                <Field label="Gender">
                  <select className={selectCls} value={form.gender} onChange={e => update('gender', e.target.value)}>
                    <option value="M">Male</option><option value="F">Female</option><option value="NB">Non-binary</option><option value="Other">Other / Prefer not to say</option>
                  </select>
                </Field>
                <Field label="Phone" required>
                  <input className={inputCls} placeholder="(301) 555-0000" value={form.phone} onChange={e => update('phone', e.target.value)} />
                </Field>
                <Field label="Referral Source">
                  <input className={inputCls} placeholder="e.g. MedStar Georgetown ER, Self, PCP" value={form.referralSource} onChange={e => update('referralSource', e.target.value)} />
                </Field>
                <Field label="Referral Type">
                  <select className={selectCls} value={form.referralType} onChange={e => update('referralType', e.target.value)}>
                    <option>Self</option><option>Family</option><option>Hospital ER</option><option>Physician / PCP</option><option>Drug Court / Probation</option><option>EAP</option><option>Step-Down (Other Facility)</option><option>Mental Health Provider</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* Step 1: Eligibility Check */}
          {step === 1 && (
            <div className="space-y-4">
              <Field label="Primary Diagnosis / SUD Type" required>
                <input className={inputCls} placeholder="e.g. Severe Opioid Use Disorder, Alcohol Use Disorder (Moderate)" value={form.primaryDx} onChange={e => update('primaryDx', e.target.value)} />
              </Field>
              <Field label="Co-occurring Conditions">
                <input className={inputCls} placeholder="e.g. PTSD, MDD, Anxiety — separate with commas" value={form.coOccurring} onChange={e => update('coOccurring', e.target.value)} />
              </Field>
              <Field label="Requested Level of Care" required>
                <select className={selectCls} value={form.program} onChange={e => update('program', e.target.value)}>
                  <option>Residential</option><option>PHP</option><option>IOP</option><option>Detox</option><option>OP</option>
                </select>
              </Field>
              <Field label="Legal Involvement">
                <select className={selectCls} value={form.legalInvolvement} onChange={e => update('legalInvolvement', e.target.value)}>
                  <option>None</option><option>Drug Court (Track A)</option><option>Drug Court (Track B)</option><option>Probation / Parole</option><option>Pending Charges</option><option>Diversion Program</option>
                </select>
              </Field>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                Eligibility determination requires valid insurance or confirmed self-pay agreement before bed assignment.
              </div>
            </div>
          )}

          {/* Step 2: Insurance Verification */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Insurance Plan">
                  <input className={inputCls} placeholder="e.g. CareFirst BCBS, Maryland Medicaid" value={form.insurance} onChange={e => update('insurance', e.target.value)} />
                </Field>
                <Field label="Member / Policy ID">
                  <input className={inputCls} placeholder="e.g. CFBC-9821-MD" value={form.insuranceId} onChange={e => update('insuranceId', e.target.value)} />
                </Field>
              </div>
              <Field label="Verification Status">
                <select className={selectCls} value={form.insuranceStatus} onChange={e => update('insuranceStatus', e.target.value)}>
                  <option value="Pending">Pending — call in progress</option>
                  <option value="Verified">Verified — authorized</option>
                  <option value="Denied">Denied — appeal required</option>
                  <option value="Self-Pay">Self-Pay / No insurance</option>
                </select>
              </Field>
              <Field label="Authorization Notes">
                <textarea
                  className={`${inputCls} min-h-[80px] resize-none`}
                  placeholder="Auth number, coverage details, peer-to-peer notes..."
                  value={form.authNotes}
                  onChange={e => update('authNotes', e.target.value)}
                />
              </Field>
              {form.insuranceStatus === 'Denied' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                  ⚠ Insurance denied — document peer-to-peer request and notify financial counselor before proceeding.
                </div>
              )}
            </div>
          )}

          {/* Step 3: Clinical Screening (ASAM) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-navy mb-2">ASAM Multidimensional Assessment</div>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'd1', label: 'D1 Intox / Withdrawal', note: 'Severity 0–4' },
                  { key: 'd2', label: 'D2 Biomedical', note: 'Medical conditions' },
                  { key: 'd3', label: 'D3 Emotional / Behavioral', note: 'Psych stability' },
                  { key: 'd4', label: 'D4 Readiness to Change', note: 'Motivation level' },
                  { key: 'd5', label: 'D5 Relapse Potential', note: 'Risk of continued use' },
                  { key: 'd6', label: 'D6 Recovery Environment', note: 'Home / social support' },
                ] as { key: keyof WizardState; label: string; note: string }[]).map(d => (
                  <div key={d.key} className="border border-border rounded-lg p-3">
                    <div className="text-xs font-semibold text-navy mb-1">{d.label}</div>
                    <div className="text-[10px] text-slate mb-2">{d.note}</div>
                    <select className={selectCls} value={String(form[d.key])} onChange={e => update(d.key, e.target.value)}>
                      <option value="0">0 — No problem</option>
                      <option value="1">1 — Mild</option>
                      <option value="2">2 — Moderate</option>
                      <option value="3">3 — Severe</option>
                      <option value="4">4 — Critical</option>
                    </select>
                  </div>
                ))}
              </div>
              <Field label="Clinical Notes">
                <textarea className={`${inputCls} min-h-[70px] resize-none`} placeholder="Clinician observations, chief complaint, presenting concerns..." value={form.clinicalNotes} onChange={e => update('clinicalNotes', e.target.value)} />
              </Field>
            </div>
          )}

          {/* Step 4: Risk Screening */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-navy mb-1">Risk Screening</div>
              <div className="grid grid-cols-2 gap-4">
                {([
                  { key: 'suicideRisk', label: 'Suicide / Self-Harm Risk' },
                  { key: 'violenceRisk', label: 'Violence / Homicide Risk' },
                  { key: 'withdrawalRisk', label: 'Withdrawal Severity Risk' },
                  { key: 'amaRisk', label: 'AMA / Against Medical Advice Risk' },
                ] as { key: keyof WizardState; label: string }[]).map(r => (
                  <Field key={r.key} label={r.label}>
                    <select className={selectCls} value={String(form[r.key])} onChange={e => update(r.key, e.target.value)}>
                      <option value="Low">Low</option>
                      <option value="Moderate">Moderate</option>
                      <option value="High">High — requires escalation</option>
                    </select>
                  </Field>
                ))}
              </div>
              {(form.suicideRisk === 'High' || form.violenceRisk === 'High') && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-xs text-red-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-none" />
                  High risk identified — psychiatric evaluation required before admission. Supervisor notification mandatory.
                </div>
              )}
            </div>
          )}

          {/* Step 5: ASAM Recommendation */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-sunrise-blue/10 border border-sunrise-blue/20 p-4 rounded-lg">
                <div className="font-semibold text-sunrise-blue text-sm mb-1">ASAM Dimension Summary</div>
                <div className="grid grid-cols-6 gap-2 text-center text-xs">
                  {['d1','d2','d3','d4','d5','d6'].map(d => (
                    <div key={d} className="bg-white border border-border rounded p-2">
                      <div className="font-bold text-navy text-base">{form[d as keyof WizardState]}</div>
                      <div className="text-slate text-[9px] uppercase">{d.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>
              <Field label="ASAM Level of Care Recommendation">
                <select className={selectCls} value={form.asamRec} onChange={e => update('asamRec', e.target.value)}>
                  <option>Detox / Medically Managed Withdrawal (4-WM)</option>
                  <option>Residential (3.7)</option>
                  <option>Residential (3.5)</option>
                  <option>Residential (3.1)</option>
                  <option>Partial Hospitalization (2.5)</option>
                  <option>Intensive Outpatient (2.1)</option>
                  <option>Outpatient (1.0)</option>
                </select>
              </Field>
              <Field label="LOC Rationale (for insurance documentation)">
                <textarea className={`${inputCls} min-h-[100px] resize-none`} placeholder="Document clinical justification for recommended LOC..." value={form.locRationale} onChange={e => update('locRationale', e.target.value)} />
              </Field>
            </div>
          )}

          {/* Step 6: Required Documents */}
          {step === 6 && (
            <div className="space-y-3">
              <div className="text-sm text-slate mb-2">Verify all required documentation is collected before admission decision.</div>
              {([
                { key: 'idOnFile', label: 'Government-Issued Photo ID on File' },
                { key: 'insuranceCardOnFile', label: 'Insurance Card (copy) on File' },
                { key: 'consentSigned', label: 'Consent to Treatment Signed' },
                { key: 'cfr42Signed', label: '42 CFR Part 2 Confidentiality Disclosure Signed' },
                { key: 'medHistoryCollected', label: 'Medical History / Physical Exam Collected' },
              ] as { key: keyof WizardState; label: string }[]).map(doc => (
                <label key={doc.key} className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form[doc.key] as boolean}
                    onChange={e => update(doc.key, e.target.checked)}
                    className="accent-success w-4 h-4"
                  />
                  <span className={`text-sm font-medium ${form[doc.key] ? 'line-through text-slate' : 'text-navy'}`}>{doc.label}</span>
                  {form[doc.key] && <Check className="w-4 h-4 text-success ml-auto" />}
                </label>
              ))}
              {(['idOnFile','insuranceCardOnFile','consentSigned','cfr42Signed','medHistoryCollected'] as (keyof WizardState)[]).filter(k => !form[k]).length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  ⚠ {(['idOnFile','insuranceCardOnFile','consentSigned','cfr42Signed','medHistoryCollected'] as (keyof WizardState)[]).filter(k => !form[k]).length} document(s) still outstanding — admission can proceed but must be collected within 24h.
                </div>
              )}
            </div>
          )}

          {/* Step 7: Admission Decision */}
          {step === 7 && (
            <div className="space-y-4">
              <Field label="Admission Decision" required>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'Approved', color: 'border-green-400 bg-green-50 text-green-700', desc: 'Clinical criteria met — proceed to bed assignment' },
                    { val: 'Waitlist', color: 'border-amber-400 bg-amber-50 text-amber-700', desc: 'Qualified but no bed available — place on waitlist' },
                    { val: 'Deferred', color: 'border-blue-400 bg-blue-50 text-blue-700', desc: 'Pending additional info or auth before deciding' },
                    { val: 'Declined', color: 'border-red-400 bg-red-50 text-red-700', desc: 'Does not meet criteria or requests withdrawn' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => update('decision', opt.val)}
                      className={`border-2 rounded-xl p-4 text-left transition-all ${form.decision === opt.val ? opt.color + ' ring-2 ring-offset-1' : 'border-border hover:border-slate-300'}`}
                    >
                      <div className={`font-bold text-sm ${form.decision === opt.val ? '' : 'text-navy'}`}>{opt.val}</div>
                      <div className="text-xs mt-1 text-slate">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Decision Reason / Notes">
                <textarea className={`${inputCls} min-h-[80px] resize-none`} placeholder="Required for Deferred / Declined / Waitlist..." value={form.decisionReason} onChange={e => update('decisionReason', e.target.value)} />
              </Field>
              {form.decision === 'Declined' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                  Document referral to alternative treatment resources per COMAR 10.47.03.07.
                </div>
              )}
            </div>
          )}

          {/* Step 8: Bed Assignment */}
          {step === 8 && (
            <div className="space-y-4">
              {form.decision !== 'Approved' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  Admission decision is <strong>{form.decision}</strong> — bed assignment skipped. Proceed to complete intake record.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Assigned Bed">
                      <select className={selectCls} value={form.assignedBed} onChange={e => update('assignedBed', e.target.value)}>
                        <option value="">— Select bed —</option>
                        {form.program === 'Residential' && ['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B'].map(b => <option key={b} value={b}>Bed {b}</option>)}
                        {form.program === 'PHP' && ['PHP-1','PHP-2','PHP-3','PHP-4'].map(b => <option key={b} value={b}>{b}</option>)}
                        {form.program === 'IOP' && ['IOP-A','IOP-B','IOP-C'].map(b => <option key={b} value={b}>{b}</option>)}
                        {(form.program === 'Detox') && ['DTX-1','DTX-2','DTX-3'].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </Field>
                    <Field label="Admission Date">
                      <input type="date" className={inputCls} value={form.admitDate} onChange={e => update('admitDate', e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Assigned Counselor">
                    <select className={selectCls} value={form.assignedCounselor} onChange={e => update('assignedCounselor', e.target.value)}>
                      <option>Sarah Jenkins, LCPC</option>
                      <option>David Odom, LCADC</option>
                      <option>Maria Gonzales, LCADC</option>
                      <option>Amanda Lewis (Intake)</option>
                    </select>
                  </Field>
                  {form.assignedBed && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700 font-medium">
                      ✓ Bed {form.assignedBed} reserved for {form.name || 'patient'} — {form.admitDate}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 9: Complete */}
          {step === 9 && (
            <div className="space-y-5 text-center">
              {!converted ? (
                <>
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-success" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-navy">Intake Complete</h3>
                    <p className="text-slate text-sm mt-1">All {WIZARD_STEPS.length - 1} intake steps completed for <strong>{form.name}</strong></p>
                  </div>
                  <div className="bg-gray-50 border border-border rounded-xl p-4 text-left space-y-2 text-sm">
                    {[
                      { label: 'Decision', val: form.decision },
                      { label: 'Program', val: form.program },
                      { label: 'ASAM Rec', val: form.asamRec },
                      { label: 'Insurance', val: `${form.insurance || '—'} (${form.insuranceStatus})` },
                      { label: 'Assigned Bed', val: form.assignedBed || 'N/A' },
                      { label: 'Admit Date', val: form.admitDate },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between">
                        <span className="text-slate font-medium">{r.label}</span>
                        <span className="font-semibold text-navy">{r.val}</span>
                      </div>
                    ))}
                  </div>
                  {form.decision === 'Approved' && !readOnly && (
                    <button
                      onClick={handleConvert}
                      className="w-full bg-success text-white font-bold py-3 rounded-xl text-sm hover:bg-green-600 transition-colors"
                    >
                      Convert to Active Patient →
                    </button>
                  )}
                  <p className="text-xs text-slate">This intake record has been saved to the Admissions store.</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-success">{form.name} — Intake Finalized</h3>
                    <p className="text-slate text-sm mt-1">MRN reserved: <strong className="font-mono text-navy">{savedMrn}</strong></p>
                    <p className="text-xs text-slate mt-2">The admission record is saved and the bed is reserved. A clinical supervisor will open the chart from the census once the patient arrives.</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 text-left space-y-1">
                    <div className="font-bold mb-1">Next steps for clinical staff:</div>
                    <div>✓ Bed <strong>{form.assignedBed || '—'}</strong> is reserved — confirm on the Bed Board</div>
                    <div>✓ Intake record appears in the Session Intakes section of the Admissions pipeline</div>
                    <div>✓ Admission decision: <strong>{form.decision}</strong></div>
                  </div>
                  <button onClick={onClose} className="w-full bg-navy text-white font-bold py-3 rounded-xl text-sm hover:bg-navy-mid">
                    Back to Admissions
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step < WIZARD_STEPS.length - 1 && (
          <div className="px-6 py-4 border-t border-border flex justify-between flex-shrink-0 bg-gray-50">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl text-sm font-medium text-slate hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!canAdvance()}
              className="flex items-center gap-1.5 px-5 py-2 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy-mid disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === WIZARD_STEPS.length - 2 ? 'Complete Intake' : 'Next Step'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        {step === WIZARD_STEPS.length - 1 && converted && (
          <div className="px-6 py-4 border-t border-border bg-gray-50 flex-shrink-0">
            <button onClick={onClose} className="w-full border border-border rounded-xl py-2 text-sm text-slate hover:bg-white">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Admissions Component ────────────────────────────────────────────────

export function Admissions({ navigate, readOnly }: Props) {
  const [activeTab, setActiveTab] = useState<'Pipeline' | 'Recent Admits' | 'Intake Checklist' | 'Analytics' | 'VOB Queue' | 'LOC Criteria'>('Pipeline');
  const [selected, setSelected] = useState<PendingAdmission | null>(PENDING[0]);
  const [filterStatus, setFilterStatus] = useState<AdmitStatus | 'All'>('All');
  const [admitActionSaved, setAdmitActionSaved] = useState<string | null>(null);
  const [intakeWizardOpen, setIntakeWizardOpen] = useState(false);
  const [checklistState, setChecklistState] = useState<Record<string, boolean[]>>(() => ({
    pa_demo: IOP_CHECKLIST_ITEMS.map(() => true),
  }));

  const { intakePatients } = useDemoStore();

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
          <p className="text-slate text-sm mt-0.5">Pending referrals and intake pipeline{intakePatients.length > 0 ? ` · ${intakePatients.length} intake record${intakePatients.length > 1 ? 's' : ''} this session` : ''}</p>
        </div>
        <LockedButton locked={readOnly} onClick={() => !readOnly && setIntakeWizardOpen(true)} className="btn-primary text-sm px-4 py-2">
          + New Intake
        </LockedButton>
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
            {intakePatients.length > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-2">Session Intakes ({intakePatients.length})</div>
                {intakePatients.map(ip => (
                  <div key={ip.id} className="card p-3 mb-2 opacity-90">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-navy text-sm">{ip.name}</div>
                        <div className="text-xs text-slate">{ip.program} · {ip.insurance || 'No insurance'}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ip.admissionDecision === 'Approved' ? 'bg-green-100 text-green-700' : ip.admissionDecision === 'Waitlist' ? 'bg-amber-100 text-amber-700' : ip.admissionDecision === 'Declined' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {ip.admissionDecision || 'Intake'}
                      </span>
                    </div>
                    {ip.convertedToPatient && (
                      <div className="text-[10px] text-success font-semibold mt-1">✓ Converted to Patient — {ip.mrn}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

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
                  <LockedButton locked={readOnly} onClick={() => { setAdmitActionSaved('advanced'); setTimeout(() => setAdmitActionSaved(null), 2500); }} className="btn-primary text-sm px-4 py-2 flex-1">Advance Status</LockedButton>
                  <LockedButton locked={readOnly} onClick={() => { setAdmitActionSaved('noted'); setTimeout(() => setAdmitActionSaved(null), 2500); }} className="btn-outline text-sm px-4 py-2">Add Note</LockedButton>
                  <LockedButton locked={readOnly} onClick={() => { setAdmitActionSaved('declined'); setTimeout(() => setAdmitActionSaved(null), 2500); }} className="btn-outline text-sm px-4 py-2 text-red-600 border-red-200 hover:bg-red-50">Decline</LockedButton>
                </div>
                {admitActionSaved && (
                  <div className="mt-2 text-xs font-semibold flex items-center gap-1.5 text-green-700">
                    <Check className="w-3.5 h-3.5 text-green-700" />{admitActionSaved === 'advanced' ? 'Status advanced' : admitActionSaved === 'noted' ? 'Note added' : 'Referral declined'}
                  </div>
                )}
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
                  <td className="px-4 py-3"><button onClick={() => navigate('PatientList')} className="text-xs text-orange hover:underline">View Chart</button></td>
                </tr>
              ))}
              {intakePatients.filter(ip => ip.convertedToPatient).map(ip => (
                <tr key={ip.id} className="border-b border-border last:border-0 hover:bg-gray-50 bg-green-50/30">
                  <td className="px-4 py-3 font-semibold text-navy">{ip.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate">{ip.mrn}</td>
                  <td className="px-4 py-3 text-slate">{new Date(ip.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{ip.program}</span></td>
                  <td className="px-4 py-3 text-slate">—</td>
                  <td className="px-4 py-3 font-mono text-navy">{ip.assignedBed || '—'}</td>
                  <td className="px-4 py-3"><span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">This session</span></td>
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
            <div className="card">
              <div className="text-sm font-semibold text-navy mb-4">Insurance Payer Mix (YTD)</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={INSURANCE_MIX} cx="40%" cy="50%" outerRadius={70} dataKey="value" label={({ value }) => `${value}%`} labelLine={false}>
                      {INSURANCE_MIX.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Legend formatter={v => <span className="text-xs text-navy">{v}</span>} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
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
                      <label key={idx} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5 -mx-1 transition-colors" onClick={() => toggleItem(p.id, idx)}>
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
                  {['Referral', 'Insurance', 'LOC Requested', 'VOB Specialist', 'Submitted', 'Status', 'Deductible/OOP'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'Raymond Cole', ins: 'Aetna Behavioral', loc: 'Residential', spec: 'K. Santos', sub: '07/18', status: 'Verified', sColor: 'bg-green-100 text-green-700', financial: '$2,500 ded / $6,000 OOP' },
                  { name: 'Brittney Walsh', ins: 'CareFirst BCBS', loc: 'PHP', spec: 'K. Santos', sub: '07/18', status: 'Pending', sColor: 'bg-amber-100 text-amber-700', financial: 'TBD' },
                  { name: 'Jerome Simmons', ins: 'Cigna', loc: 'Residential', spec: 'L. Park', sub: '07/17', status: 'Auth Req.', sColor: 'bg-blue-100 text-blue-700', financial: '$1,000 ded met / $8,150 OOP' },
                  { name: 'Alicia Perkins', ins: 'Maryland Medicaid (CareFirst)', loc: 'Residential', spec: 'K. Santos', sub: '07/16', status: 'Verified', sColor: 'bg-green-100 text-green-700', financial: '$0 ded — Medicaid' },
                  { name: 'David Garza', ins: 'UHC / Optum', loc: 'IOP', spec: 'L. Park', sub: '07/15', status: 'Denied', sColor: 'bg-red-100 text-red-700', financial: 'Appeal in progress' },
                ].map(r => (
                  <tr key={r.name} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-navy">{r.name}</td>
                    <td className="px-3 py-2.5 text-slate">{r.ins}</td>
                    <td className="px-3 py-2.5 text-slate">{r.loc}</td>
                    <td className="px-3 py-2.5 text-slate">{r.spec}</td>
                    <td className="px-3 py-2.5 text-slate">{r.sub}</td>
                    <td className="px-3 py-2.5"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.sColor}`}>{r.status}</span></td>
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
                inclusion: ['CIWA-Ar ≥10 or COWS ≥13', 'History of complicated withdrawal (seizures, DTs)', 'Concurrent medical conditions requiring 24h nursing supervision'],
                exclusion: ['Medically stable, no complicated withdrawal history', 'CIWA-Ar <8 with low seizure risk'],
                auth: 'Typically 3–7 days; requires daily progress notes and IDT review',
                color: 'border-red-300'
              },
              {
                loc: 'Residential Treatment', asam: 'Level 3.5 / 3.1',
                inclusion: ['Significant impairment requiring 24h structured environment', 'High relapse risk requiring 24h clinical supervision', 'Insufficient support in home environment for recovery'],
                exclusion: ['Stable living environment with adequate support', 'Active suicidality requiring inpatient psychiatric hold'],
                auth: 'Typically 14–28 days; UR review every 5–7 days',
                color: 'border-amber-300'
              },
              {
                loc: 'Partial Hospitalization Program (PHP)', asam: 'Level 2.5',
                inclusion: ['Needs daily structure but stable enough to return home evenings', 'Step-down from residential with continued clinical instability'],
                exclusion: ['No safe housing to return to each evening', 'Active withdrawal requiring 24h monitoring'],
                auth: 'Typically 10–14 days; UR review every 7 days',
                color: 'border-blue-300'
              },
              {
                loc: 'Intensive Outpatient (IOP)', asam: 'Level 2.1',
                inclusion: ['Stable functioning but needs structured support ≥3 days/week', 'Step-down from PHP or residential with good progress'],
                exclusion: ['Unable to maintain sobriety in less-than-daily program', 'Imminent danger to self or others'],
                auth: 'Typically 6–8 weeks; UR review every 2 weeks',
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

      {/* Intake Wizard Modal */}
      {intakeWizardOpen && (
        <IntakeWizard onClose={() => setIntakeWizardOpen(false)} readOnly={readOnly} />
      )}
    </div>
  );
}
