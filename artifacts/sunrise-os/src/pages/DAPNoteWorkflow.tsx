import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FlaskConical, ChevronRight, ChevronLeft, User, Clock, Target, FileText,
  Sparkles, AlertTriangle, CheckCircle, PenLine, ShieldCheck, Lock,
  Eye, Edit3, RotateCcw, X, Info, AlertCircle, Check, Calendar,
  MapPin, Stethoscope, ClipboardList
} from 'lucide-react';
import { TEST_CLIENTS, TestClient, TestTreatmentGoal } from '../data/mockTestClients';

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkflowStep =
  | 'client-select'
  | 'service-info'
  | 'goal-select'
  | 'clinician-input'
  | 'generating'
  | 'ai-draft'
  | 'editing'
  | 'approval'
  | 'signature'
  | 'locked';

interface ServiceInfo {
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  deliveryMethod: 'In-person' | 'Telehealth' | 'Phone';
  levelOfCare: string;
  serviceType: string;
  participants: string;
}

interface ClinicianInput {
  presentingIssue: string;
  interventionsUsed: string;
  clientResponse: string;
  progressStatus: string;
  progressExplanation: string;
  barriers: string;
  riskFactors: string;
  protectiveFactors: string;
  clinicalObservations: string;
  homeworkNextSteps: string;
  followUpPlan: string;
}

interface AIWarning {
  id: string;
  severity: 'required' | 'warning' | 'info';
  field: string;
  message: string;
}

interface AIDraft {
  data: string;
  assessment: string;
  plan: string;
  warnings: AIWarning[];
  generatedAt: string;
  modelLabel: string;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  category: 'system' | 'clinician' | 'ai' | 'signature';
}

interface AmendmentRecord {
  reason: string;
  addendum: string;
  amendedBy: string;
  amendedAt: string;
  pin: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS: { id: WorkflowStep; label: string; icon: React.ElementType }[] = [
  { id: 'client-select',   label: 'Client',     icon: User },
  { id: 'service-info',    label: 'Service',    icon: Calendar },
  { id: 'goal-select',     label: 'Goal',       icon: Target },
  { id: 'clinician-input', label: 'Input',      icon: ClipboardList },
  { id: 'ai-draft',        label: 'AI Draft',   icon: Sparkles },
  { id: 'editing',         label: 'Edit',       icon: PenLine },
  { id: 'approval',        label: 'Approve',    icon: Eye },
  { id: 'signature',       label: 'Sign',       icon: ShieldCheck },
  { id: 'locked',          label: 'Final',      icon: Lock },
];

const PROGRESS_OPTIONS = [
  'No progress',
  'Minimal progress',
  'Moderate progress',
  'Significant progress',
  'Goal achieved',
  'Regression',
  'Unable to assess',
];

const DELIVERY_OPTIONS: ServiceInfo['deliveryMethod'][] = ['In-person', 'Telehealth', 'Phone'];
const SERVICE_TYPES = [
  'Individual Counseling',
  'Crisis Intervention',
  'Case Management',
  'Discharge Planning',
  'Skills Training',
  'Psychoeducation',
  'Family Session',
];

// ─── AI Draft Generator ───────────────────────────────────────────────────────

function calcDuration(start: string, end: string): number {
  try {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  } catch {
    return 0;
  }
}

function generateAIDraft(
  client: TestClient,
  svc: ServiceInfo,
  goal: TestTreatmentGoal,
  input: ClinicianInput,
  clinician: string
): AIDraft {
  const now = new Date();
  const duration = calcDuration(svc.startTime, svc.endTime);
  const durationStr = duration > 0 ? `${duration} minutes` : 'duration not recorded';
  const clientName = `${client.firstName} ${client.lastName}`;
  const dateStr = svc.date || 'date not specified';
  const warnings: AIWarning[] = [];

  // ── Missing-field detection ──────────────────────────────────────────────────
  if (!input.presentingIssue.trim())
    warnings.push({ id: 'w1', severity: 'required', field: 'Presenting Issue',
      message: 'Presenting issue was not documented. This field is required for a complete clinical record.' });

  if (!input.clinicalObservations.trim())
    warnings.push({ id: 'w2', severity: 'required', field: 'Clinical Observations',
      message: 'Clinical observations were not documented. Objective behavioral descriptions are required.' });

  if (!input.riskFactors.trim())
    warnings.push({ id: 'w3', severity: 'warning', field: 'Risk Factors',
      message: 'No risk factor documentation was entered. A risk assessment is expected at each individual session.' });

  if (!input.protectiveFactors.trim())
    warnings.push({ id: 'w4', severity: 'warning', field: 'Protective Factors',
      message: 'Protective factors were not documented. Include these to support a balanced clinical picture.' });

  if (!input.followUpPlan.trim())
    warnings.push({ id: 'w5', severity: 'required', field: 'Follow-Up Plan',
      message: 'Follow-up plan is missing. Every note must contain a documented plan for continued care.' });

  if (input.interventionsUsed.trim().length < 20)
    warnings.push({ id: 'w6', severity: 'warning', field: 'Interventions Used',
      message: 'Interventions description appears brief. Provide specific clinical techniques and how they were applied.' });

  if (!input.progressExplanation.trim())
    warnings.push({ id: 'w7', severity: 'required', field: 'Progress Explanation',
      message: 'A brief explanation supporting the selected progress status is required.' });

  if (!input.progressStatus)
    warnings.push({ id: 'w8', severity: 'required', field: 'Progress Toward Goal',
      message: 'Progress rating was not selected. This is required to support medical necessity.' });

  // ── Data section ──────────────────────────────────────────────────────────────
  const dataLines: string[] = [];
  dataLines.push(
    `${clientName} presented for ${svc.serviceType || 'individual session'} on ${dateStr} ` +
    `from ${svc.startTime || '[start time]'} to ${svc.endTime || '[end time]'} (${durationStr}) ` +
    `via ${svc.deliveryMethod} at ${svc.levelOfCare || client.levelOfCare} level of care.`
  );
  if (svc.participants && svc.participants !== clinician)
    dataLines.push(`Session participants: ${svc.participants}.`);

  if (input.presentingIssue.trim())
    dataLines.push(`\nPresenting issue: ${input.presentingIssue.trim()}`);
  else
    dataLines.push(`\n[MISSING: Presenting issue was not documented.]`);

  if (input.clinicalObservations.trim())
    dataLines.push(`\nClinical observations: ${input.clinicalObservations.trim()}`);
  else
    dataLines.push(`\n[MISSING: Clinical observations were not documented.]`);

  if (input.riskFactors.trim())
    dataLines.push(`\nRisk factors documented: ${input.riskFactors.trim()}`);
  else
    dataLines.push(`\nRisk factor assessment: Not documented this session.`);

  if (input.protectiveFactors.trim())
    dataLines.push(`Protective factors noted: ${input.protectiveFactors.trim()}`);

  if (input.barriers.trim())
    dataLines.push(`\nBarriers to treatment identified: ${input.barriers.trim()}`);

  // ── Assessment section ────────────────────────────────────────────────────────
  const assessLines: string[] = [];
  assessLines.push(
    `Treatment goal addressed: ${goal.longTerm}`
  );
  const activeObj = goal.shortTermObjectives.filter(o => o.status === 'In Progress');
  if (activeObj.length > 0) {
    assessLines.push(`Active objective(s): ${activeObj.map(o => o.text).join(' | ')}`);
  }

  if (input.interventionsUsed.trim())
    assessLines.push(`\nInterventions utilized: ${input.interventionsUsed.trim()}`);
  else
    assessLines.push(`\nInterventions utilized: [Not documented]`);

  if (input.clientResponse.trim())
    assessLines.push(`\nClient response: ${input.clientResponse.trim()}`);
  else
    assessLines.push(`\nClient response: [Not documented]`);

  if (input.progressStatus) {
    assessLines.push(`\nProgress toward goal: ${input.progressStatus}.`);
    if (input.progressExplanation.trim())
      assessLines.push(input.progressExplanation.trim());
    else
      assessLines.push(`[MISSING: Progress explanation required.]`);
  } else {
    assessLines.push(`\nProgress toward goal: [Not rated — required]`);
  }

  // ── Plan section ───────────────────────────────────────────────────────────────
  const planLines: string[] = [];

  if (input.homeworkNextSteps.trim())
    planLines.push(`Between-session tasks: ${input.homeworkNextSteps.trim()}`);

  if (input.followUpPlan.trim())
    planLines.push(`\nFollow-up plan: ${input.followUpPlan.trim()}`);
  else
    planLines.push(`\nFollow-up plan: [MISSING — required]`);

  planLines.push(
    `\nContinued treatment at ${svc.levelOfCare || client.levelOfCare} is clinically indicated. ` +
    `Ongoing individual counseling will target the identified treatment goals.`
  );

  return {
    data:       dataLines.join('\n'),
    assessment: assessLines.join('\n'),
    plan:       planLines.join('\n'),
    warnings,
    generatedAt: now.toLocaleString(),
    modelLabel: 'Sunrise AI Draft Engine — Testing Environment (No External LLM)',
  };
}

// ─── Audit helpers ────────────────────────────────────────────────────────────

function makeEntry(
  actor: string,
  action: string,
  detail: string,
  category: AuditEntry['category'] = 'clinician'
): AuditEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toLocaleString(),
    actor,
    action,
    detail,
    category,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TestBanner() {
  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-lg px-4 py-2.5 mb-6">
      <FlaskConical size={16} className="text-amber-600 shrink-0" />
      <p className="text-[12px] font-semibold text-amber-800">
        TESTING ENVIRONMENT — FICTIONAL DATA ONLY.&nbsp; No real patient information.
        The AI draft engine does not call any external service.
        PHI protections, vendor agreements, and security review must be completed before connecting live patient data.
      </p>
    </div>
  );
}

function DraftBanner() {
  return (
    <div className="flex items-center gap-2.5 bg-purple-50 border-2 border-purple-400 rounded-lg px-4 py-3 mb-4">
      <Sparkles size={16} className="text-purple-600 shrink-0" />
      <div>
        <p className="text-[12px] font-bold text-purple-800 uppercase tracking-wide">AI Draft — Clinician Review Required</p>
        <p className="text-[11px] text-purple-700 mt-0.5">
          This content was generated from information you entered. The AI has not added any information you did not provide.
          Review, edit, and sign before this note enters any record.
        </p>
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: WorkflowStep }) {
  const currentIdx = STEPS.findIndex(s => s.id === current);
  // 'generating' maps to 'ai-draft' position
  const displayIdx = current === 'generating' ? STEPS.findIndex(s => s.id === 'ai-draft') : currentIdx;

  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
      {STEPS.map((step, idx) => {
        const done = idx < displayIdx;
        const active = idx === displayIdx;
        const Icon = step.icon;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center min-w-[64px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                ${done   ? 'bg-emerald-500 border-emerald-500 text-white'
                : active ? 'bg-navy border-sunrise-orange text-white shadow-md'
                         : 'bg-white border-slate/30 text-slate/50'}`}>
                {done ? <Check size={14} /> : <Icon size={13} />}
              </div>
              <span className={`text-[9px] font-semibold mt-1 tracking-wide text-center
                ${active ? 'text-sunrise-orange' : done ? 'text-emerald-600' : 'text-slate/40'}`}>
                {step.label.toUpperCase()}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mx-1 min-w-[12px] ${idx < displayIdx ? 'bg-emerald-400' : 'bg-slate/15'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function WarningList({ warnings }: { warnings: AIWarning[] }) {
  if (!warnings.length) return (
    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4">
      <CheckCircle size={14} className="text-emerald-600" />
      <span className="text-[12px] text-emerald-700 font-medium">No missing required fields detected.</span>
    </div>
  );

  const required = warnings.filter(w => w.severity === 'required');
  const warning  = warnings.filter(w => w.severity === 'warning');

  return (
    <div className="space-y-2 mb-4">
      {required.map(w => (
        <div key={w.id} className="flex gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] font-bold text-red-700 uppercase">{w.field}: </span>
            <span className="text-[11px] text-red-700">{w.message}</span>
          </div>
        </div>
      ))}
      {warning.map(w => (
        <div key={w.id} className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase">{w.field}: </span>
            <span className="text-[11px] text-amber-700">{w.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DAPSection({
  label, color, content
}: { label: string; color: string; content: string }) {
  return (
    <div className={`border-l-4 ${color} bg-white rounded-r-lg p-4 mb-3 shadow-sm`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate/60 mb-2">{label}</p>
      <pre className="text-[13px] text-navy/90 whitespace-pre-wrap font-sans leading-relaxed">{content}</pre>
    </div>
  );
}

function AuditTrail({ entries }: { entries: AuditEntry[] }) {
  const catColor: Record<AuditEntry['category'], string> = {
    system:    'bg-slate/10 text-slate',
    clinician: 'bg-blue-50 text-blue-700',
    ai:        'bg-purple-50 text-purple-700',
    signature: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate/50 mb-3 flex items-center gap-2">
        <ShieldCheck size={13} /> Audit Trail
      </h3>
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {entries.map(e => (
          <div key={e.id} className={`flex gap-3 rounded-lg px-3 py-2 ${catColor[e.category]}`}>
            <span className="text-[10px] font-mono opacity-60 shrink-0 mt-0.5">{e.timestamp}</span>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold">{e.action}</span>
              {e.detail && <span className="text-[11px] opacity-75"> — {e.detail}</span>}
              <span className="text-[10px] opacity-50 ml-2">· {e.actor}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DAPNoteWorkflowProps {
  navigate: (screen: string) => void;
}

export function DAPNoteWorkflow({ navigate: _navigate }: DAPNoteWorkflowProps) {
  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<WorkflowStep>('client-select');

  // ── Data state ──────────────────────────────────────────────────────────────
  const [client, setClient] = useState<TestClient | null>(null);
  const [svc, setSvc] = useState<ServiceInfo>({
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '09:50',
    location: 'Office 204',
    deliveryMethod: 'In-person',
    levelOfCare: '',
    serviceType: 'Individual Counseling',
    participants: 'Jordan Rivera, LCADC',
  });
  const [goal, setGoal] = useState<TestTreatmentGoal | null>(null);
  const [input, setInput] = useState<ClinicianInput>({
    presentingIssue: '',
    interventionsUsed: '',
    clientResponse: '',
    progressStatus: '',
    progressExplanation: '',
    barriers: '',
    riskFactors: '',
    protectiveFactors: '',
    clinicalObservations: '',
    homeworkNextSteps: '',
    followUpPlan: '',
  });
  const [draft, setDraft] = useState<AIDraft | null>(null);
  const [editedNote, setEditedNote] = useState('');
  const [approved, setApproved] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [signedAt, setSignedAt] = useState('');
  const [signedBy, setSignedBy] = useState('');
  const [locked, setLocked] = useState(false);

  // ── Amendment state ──────────────────────────────────────────────────────────
  const [amendOpen, setAmendOpen] = useState(false);
  const [amendment, setAmendment] = useState<AmendmentRecord | null>(null);
  const [amendReason, setAmendReason] = useState('');
  const [amendText, setAmendText] = useState('');
  const [amendPin, setAmendPin] = useState('');
  const [amendPinError, setAmendPinError] = useState('');

  // ── Audit trail ──────────────────────────────────────────────────────────────
  const [audit, setAudit] = useState<AuditEntry[]>([
    makeEntry('System', 'DAP Note Workflow Initiated', 'Testing environment — fictional data only', 'system'),
  ]);
  const addAudit = useCallback((action: string, detail: string, category: AuditEntry['category'] = 'clinician') => {
    setAudit(prev => [...prev, makeEntry(
      step === 'signature' || step === 'locked' ? (signedBy || 'Clinician') : 'Clinician',
      action, detail, category
    )]);
  }, [step, signedBy]);

  // ── Generating simulation ────────────────────────────────────────────────────
  const [genProgress, setGenProgress] = useState(0);
  const genTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step !== 'generating') return;
    setGenProgress(0);
    let p = 0;
    genTimer.current = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(genTimer.current!);
        // Build draft and transition
        if (client && goal) {
          const built = generateAIDraft(client, svc, goal, input, svc.participants);
          setDraft(built);
          setEditedNote(
            `DATA\n${built.data}\n\nASSESSMENT\n${built.assessment}\n\nPLAN\n${built.plan}`
          );
          addAudit('AI Draft Generated',
            `${built.warnings.length} warning(s) · model: ${built.modelLabel}`, 'ai');
          setStep('ai-draft');
        }
      }
      setGenProgress(Math.min(p, 100));
    }, 200);
    return () => { if (genTimer.current) clearInterval(genTimer.current); };
  }, [step]);

  // ── Navigation helpers ───────────────────────────────────────────────────────
  function goTo(s: WorkflowStep) { setStep(s); }

  function handleClientSelect(c: TestClient) {
    setClient(c);
    setSvc(prev => ({ ...prev, levelOfCare: c.levelOfCare, participants: c.counselor }));
    addAudit('Client Selected', `${c.firstName} ${c.lastName} — ${c.mrn} (fictional)`);
    goTo('service-info');
  }

  function handleServiceNext() {
    addAudit('Service Information Entered',
      `${svc.date} · ${svc.startTime}–${svc.endTime} · ${svc.serviceType} · ${svc.deliveryMethod}`);
    goTo('goal-select');
  }

  function handleGoalSelect(g: TestTreatmentGoal) {
    setGoal(g);
    addAudit('Treatment Goal Selected', g.problem + ' — ' + g.longTerm.slice(0, 60) + '…');
    goTo('clinician-input');
  }

  function handleGenerateDraft() {
    addAudit('Generate Draft Requested', 'Clinician submitted structured input for AI draft generation', 'ai');
    goTo('generating');
  }

  function handleApprove() {
    setApproved(true);
    addAudit('Clinician Approved Draft', 'Clinician confirmed note is accurate and ready for signature');
    goTo('signature');
  }

  function handleSign() {
    setPinError('');
    if (pin.length < 4) { setPinError('PIN must be at least 4 characters.'); return; }
    const ts = new Date().toLocaleString();
    const who = client ? `${client.counselor}` : 'Clinician';
    setSignedAt(ts);
    setSignedBy(who);
    setLocked(true);
    setAudit(prev => [...prev,
      makeEntry(who, 'Electronic Signature Applied', `Note signed by ${who} at ${ts}`, 'signature'),
      makeEntry('System', 'Note Locked', 'Note is now read-only. Amendments require a separate addendum process.', 'system'),
    ]);
    goTo('locked');
  }

  function handleAmendSubmit() {
    setAmendPinError('');
    if (!amendReason.trim()) { setAmendPinError('Amendment reason is required.'); return; }
    if (!amendText.trim())   { setAmendPinError('Addendum text is required.'); return; }
    if (amendPin.length < 4) { setAmendPinError('PIN must be at least 4 characters.'); return; }
    const ts = new Date().toLocaleString();
    const rec: AmendmentRecord = {
      reason: amendReason.trim(),
      addendum: amendText.trim(),
      amendedBy: signedBy,
      amendedAt: ts,
      pin: '****',
    };
    setAmendment(rec);
    setAudit(prev => [...prev,
      makeEntry(signedBy, 'Amendment Filed',
        `Reason: ${amendReason.trim()}`, 'signature'),
      makeEntry(signedBy, 'Addendum Signed',
        `Addendum appended to original note at ${ts}`, 'signature'),
    ]);
    setAmendOpen(false);
    setAmendReason(''); setAmendText(''); setAmendPin('');
  }

  // ── Render steps ──────────────────────────────────────────────────────────────

  function renderClientSelect() {
    return (
      <div>
        <h2 className="text-xl font-bold text-navy mb-1">Select Client</h2>
        <p className="text-sm text-slate mb-6">Choose a fictional test client to begin the DAP note workflow.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TEST_CLIENTS.map(c => (
            <button key={c.id} onClick={() => handleClientSelect(c)}
              className="text-left border border-border rounded-xl p-4 hover:border-sunrise-orange hover:shadow-md transition-all bg-white group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center shrink-0 group-hover:bg-navy group-hover:text-white transition-colors">
                  <User size={18} className="text-navy group-hover:text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-navy text-[14px]">{c.firstName} {c.lastName}</p>
                    <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                      FICTIONAL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate font-mono">{c.mrn}</p>
                  <p className="text-[12px] text-slate/80 mt-1">{c.primaryDiagnosis}</p>
                  {c.coOccurring.length > 0 && (
                    <p className="text-[11px] text-slate/60 mt-0.5">{c.coOccurring.join(' · ')}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] bg-navy/8 text-navy px-2 py-0.5 rounded-full font-medium">{c.program}</span>
                    <span className="text-[10px] text-slate/60">LOS {c.los}d</span>
                    <span className="text-[10px] text-slate/60">·</span>
                    <span className="text-[10px] text-slate/60">{c.counselor.split(',')[0]}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate/30 group-hover:text-sunrise-orange mt-1 shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderServiceInfo() {
    if (!client) return null;
    return (
      <div className="max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <User size={15} className="text-amber-700" />
          </div>
          <div>
            <p className="font-bold text-navy text-[14px]">{client.firstName} {client.lastName}
              <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase">FICTIONAL</span>
            </p>
            <p className="text-[11px] text-slate">{client.mrn} · {client.primaryDiagnosis}</p>
          </div>
        </div>
        <h2 className="text-xl font-bold text-navy mb-5">Service Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">Service Date *</label>
              <input type="date" value={svc.date} onChange={e => setSvc(p => ({ ...p, date: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">Start Time *</label>
              <input type="time" value={svc.startTime} onChange={e => setSvc(p => ({ ...p, startTime: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">End Time *</label>
              <input type="time" value={svc.endTime} onChange={e => setSvc(p => ({ ...p, endTime: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30" />
            </div>
          </div>
          {svc.startTime && svc.endTime && (
            <p className="text-[11px] text-emerald-600 font-medium">
              Session duration: {calcDuration(svc.startTime, svc.endTime)} minutes
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">Location</label>
              <input value={svc.location} onChange={e => setSvc(p => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Office 204"
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">Delivery Method *</label>
              <select value={svc.deliveryMethod} onChange={e => setSvc(p => ({ ...p, deliveryMethod: e.target.value as ServiceInfo['deliveryMethod'] }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30">
                {DELIVERY_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">Level of Care *</label>
              <input value={svc.levelOfCare} onChange={e => setSvc(p => ({ ...p, levelOfCare: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">Service Type *</label>
              <select value={svc.serviceType} onChange={e => setSvc(p => ({ ...p, serviceType: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30">
                {SERVICE_TYPES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">Participants</label>
            <input value={svc.participants} onChange={e => setSvc(p => ({ ...p, participants: e.target.value }))}
              placeholder="Clinician name, credentials"
              className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => goTo('client-select')}
            className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-[13px] text-slate hover:bg-slate/5 transition-colors">
            <ChevronLeft size={14} /> Back
          </button>
          <button onClick={handleServiceNext}
            className="flex items-center gap-1.5 px-5 py-2 bg-navy text-white rounded-lg text-[13px] font-semibold hover:bg-navy/90 transition-colors">
            Next — Select Goal <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  function renderGoalSelect() {
    if (!client) return null;
    return (
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold text-navy mb-1">Select Treatment-Plan Goal</h2>
        <p className="text-sm text-slate mb-6">Select the active goal this session addressed. Each note must be connected to a specific treatment goal.</p>
        <div className="space-y-3">
          {client.goals.filter(g => g.status === 'Active').map(g => (
            <button key={g.id} onClick={() => handleGoalSelect(g)}
              className="w-full text-left border border-border rounded-xl p-4 hover:border-sunrise-orange hover:shadow-md transition-all bg-white group">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-navy/8 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-sunrise-orange transition-colors">
                  <Target size={15} className="text-navy group-hover:text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-navy text-[13px]">{g.problem}</p>
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded uppercase">Active</span>
                  </div>
                  <p className="text-[12px] text-slate/80 mb-2">{g.longTerm}</p>
                  <div className="space-y-1">
                    {g.shortTermObjectives.map(obj => (
                      <div key={obj.id} className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                          obj.status === 'Met' ? 'bg-emerald-500'
                          : obj.status === 'In Progress' ? 'bg-amber-400'
                          : 'bg-slate/25'
                        }`} />
                        <p className="text-[11px] text-slate/70">{obj.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {g.interventions.map(i => (
                      <span key={i} className="text-[9px] bg-navy/6 text-navy/70 px-2 py-0.5 rounded-full">{i}</span>
                    ))}
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate/30 group-hover:text-sunrise-orange mt-1 shrink-0" />
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => goTo('service-info')}
          className="flex items-center gap-1.5 mt-5 px-4 py-2 border border-border rounded-lg text-[13px] text-slate hover:bg-slate/5 transition-colors">
          <ChevronLeft size={14} /> Back
        </button>
      </div>
    );
  }

  function renderClinicianInput() {
    if (!client || !goal) return null;
    function Field({ label, field, required, multiline = true, hint, rows = 3 }:
      { label: string; field: keyof ClinicianInput; required?: boolean; multiline?: boolean; hint?: string; rows?: number }) {
      return (
        <div>
          <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {hint && <p className="text-[10px] text-slate/60 mb-1.5">{hint}</p>}
          <textarea rows={rows} value={input[field]}
            onChange={e => setInput(p => ({ ...p, [field]: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-[13px] text-navy resize-y focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30 leading-relaxed" />
        </div>
      );
    }

    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
            <Target size={12} className="text-amber-700" />
          </div>
          <p className="text-[12px] text-slate font-medium">
            Goal: <span className="text-navy font-semibold">{goal.problem}</span>
          </p>
        </div>
        <h2 className="text-xl font-bold text-navy mb-1">Structured Clinician Input</h2>
        <p className="text-sm text-slate mb-6">
          Complete all required fields. The AI will use only the information you enter here — it will not add, invent, or assume any clinical detail.
        </p>

        <div className="space-y-4">
          <Field label="Presenting Issue" field="presentingIssue" required
            hint="What did the client bring to this session? What was the primary focus?" />
          <Field label="Interventions Used" field="interventionsUsed" required
            hint="Name the specific clinical methods used (e.g., 'Applied CBT thought-record technique to address catastrophic thinking about relapse')." rows={4} />
          <Field label="Client Response to Interventions" field="clientResponse" required
            hint="How did the client respond? Be objective and behavioral." rows={3} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">
                Progress Toward Goal <span className="text-red-500">*</span>
              </label>
              <select value={input.progressStatus}
                onChange={e => setInput(p => ({ ...p, progressStatus: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30">
                <option value="">— Select —</option>
                {PROGRESS_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">
                Progress Explanation <span className="text-red-500">*</span>
              </label>
              <textarea rows={2} value={input.progressExplanation}
                onChange={e => setInput(p => ({ ...p, progressExplanation: e.target.value }))}
                placeholder="Brief explanation supporting the rating"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-[13px] text-navy resize-none focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30" />
            </div>
          </div>
          <Field label="Clinical Observations" field="clinicalObservations" required
            hint="Objective behavioral observations (appearance, affect, speech, cognition, engagement)." rows={3} />
          <Field label="Risk Factors" field="riskFactors"
            hint="Document all risk factors assessed. If none identified, state 'No acute risk factors identified this session.'" rows={2} />
          <Field label="Protective Factors" field="protectiveFactors"
            hint="Family support, engagement with treatment, housing stability, coping skills, etc." rows={2} />
          <Field label="Barriers to Treatment" field="barriers"
            hint="Practical, psychological, or social barriers identified." rows={2} />
          <Field label="Homework / Between-Session Tasks" field="homeworkNextSteps"
            hint="Tasks assigned to the client between sessions." rows={2} />
          <Field label="Follow-Up Plan" field="followUpPlan" required
            hint="Next steps, referrals, planned interventions, frequency of sessions." rows={3} />
        </div>

        <div className="flex gap-3 mt-7">
          <button onClick={() => goTo('goal-select')}
            className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-[13px] text-slate hover:bg-slate/5 transition-colors">
            <ChevronLeft size={14} /> Back
          </button>
          <button onClick={handleGenerateDraft}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity shadow-md">
            <Sparkles size={15} /> Generate AI Draft
          </button>
        </div>
      </div>
    );
  }

  function renderGenerating() {
    const stages = [
      'Reading entered clinical information…',
      'Structuring DAP note sections…',
      'Checking for missing required fields…',
      'Checking for contradictory information…',
      'Verifying no information was invented…',
      'Draft ready — passing to review…',
    ];
    const stageIdx = Math.floor((genProgress / 100) * stages.length);
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
          <Sparkles size={28} className="text-purple-600 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="font-bold text-navy text-[16px] mb-1">Generating AI Draft</p>
          <p className="text-[12px] text-slate/70 max-w-sm">
            Using only the information you entered. No external service is called in this testing environment.
          </p>
        </div>
        <div className="w-72">
          <div className="h-2 bg-slate/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-200"
              style={{ width: `${genProgress}%` }} />
          </div>
          <p className="text-[11px] text-purple-600 mt-2 text-center min-h-[16px]">{stages[Math.min(stageIdx, stages.length - 1)]}</p>
        </div>
      </div>
    );
  }

  function renderAIDraft() {
    if (!draft) return null;
    return (
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-navy">AI-Generated Draft</h2>
          <span className="text-[10px] text-slate/50 font-mono">{draft.generatedAt}</span>
        </div>
        <p className="text-[11px] text-slate/60 mb-4">{draft.modelLabel}</p>

        <DraftBanner />
        <WarningList warnings={draft.warnings} />

        <DAPSection label="D — Data" color="border-blue-400" content={draft.data} />
        <DAPSection label="A — Assessment" color="border-amber-400" content={draft.assessment} />
        <DAPSection label="P — Plan" color="border-emerald-400" content={draft.plan} />

        {draft.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-amber-600" />
              <p className="text-[12px] font-bold text-amber-800">Review before proceeding</p>
            </div>
            <p className="text-[11px] text-amber-700">
              {draft.warnings.filter(w => w.severity === 'required').length} required field(s) missing.
              You may proceed to editing, but all required fields must be addressed before signing.
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={() => goTo('clinician-input')}
            className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-[13px] text-slate hover:bg-slate/5 transition-colors">
            <ChevronLeft size={14} /> Back to Input
          </button>
          <button onClick={() => { addAudit('Clinician Began Editing', 'AI draft opened in editor'); goTo('editing'); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-lg text-[13px] font-semibold hover:bg-navy/90 transition-colors">
            <PenLine size={15} /> Edit Draft <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  function renderEditing() {
    if (!draft || !client || !goal) return null;
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
        {/* Editor */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-navy mb-1">Edit Draft</h2>
          <p className="text-sm text-slate mb-4">
            Review and edit the AI-generated text. Correct, remove, or expand any section.
            The system tracks your changes for the audit trail.
          </p>
          <DraftBanner />
          <WarningList warnings={draft.warnings} />
          <textarea
            value={editedNote}
            onChange={e => setEditedNote(e.target.value)}
            rows={22}
            className="w-full border-2 border-navy/20 focus:border-sunrise-orange rounded-xl px-4 py-3 text-[13px] text-navy font-mono leading-relaxed resize-y focus:outline-none transition-colors"
          />
          <p className="text-[10px] text-slate/50 mt-1">
            Your edits are tracked. The original AI draft is preserved in the audit trail.
          </p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => { addAudit('Returned to AI Draft View', 'Editing paused'); goTo('ai-draft'); }}
              className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-[13px] text-slate hover:bg-slate/5 transition-colors">
              <ChevronLeft size={14} /> Back
            </button>
            <button onClick={() => { addAudit('Editing Complete', `${editedNote.length} characters in edited note`); goTo('approval'); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-lg text-[13px] font-semibold hover:bg-navy/90 transition-colors">
              Review for Approval <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Source panel */}
        <div className="space-y-4">
          <div className="bg-navy/4 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate/60 mb-3 flex items-center gap-2">
              <Info size={11} /> AI Source Data
            </p>
            <div className="space-y-3 text-[11px] text-slate/80">
              <div><p className="font-semibold text-navy/80 mb-0.5">Client</p><p>{client.firstName} {client.lastName} — {client.mrn}</p></div>
              <div><p className="font-semibold text-navy/80 mb-0.5">Service</p><p>{svc.date} · {svc.startTime}–{svc.endTime} · {svc.serviceType}</p></div>
              <div><p className="font-semibold text-navy/80 mb-0.5">Goal</p><p>{goal.problem}</p></div>
              {input.presentingIssue && <div><p className="font-semibold text-navy/80 mb-0.5">Presenting Issue</p><p>{input.presentingIssue}</p></div>}
              {input.interventionsUsed && <div><p className="font-semibold text-navy/80 mb-0.5">Interventions</p><p>{input.interventionsUsed}</p></div>}
              {input.riskFactors && <div><p className="font-semibold text-navy/80 mb-0.5">Risk Factors</p><p>{input.riskFactors}</p></div>}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-[11px] text-purple-700 space-y-1.5">
            <p className="font-bold text-purple-800">AI Safety Reminders</p>
            <p>· Do not accept information you did not enter</p>
            <p>· Remove any vague or unsupported language</p>
            <p>· Add specific clinical detail the AI cannot know</p>
            <p>· You are solely responsible for this note's accuracy</p>
            <p>· Do not sign until you are satisfied it is complete</p>
          </div>
        </div>
      </div>
    );
  }

  function renderApproval() {
    if (!draft) return null;
    const originalFull = `DATA\n${draft.data}\n\nASSESSMENT\n${draft.assessment}\n\nPLAN\n${draft.plan}`;
    return (
      <div className="max-w-4xl">
        <h2 className="text-xl font-bold text-navy mb-1">Clinician Review & Approval</h2>
        <p className="text-sm text-slate mb-6">Compare the original AI draft against your edited version. Confirm accuracy before signing.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wide">Original AI Draft</p>
            </div>
            <pre className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-[11px] font-mono text-purple-900/80 whitespace-pre-wrap leading-relaxed h-72 overflow-y-auto">
              {originalFull}
            </pre>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Your Edited Version</p>
            </div>
            <pre className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-[11px] font-mono text-emerald-900/80 whitespace-pre-wrap leading-relaxed h-72 overflow-y-auto">
              {editedNote || '[No content]'}
            </pre>
          </div>
        </div>

        {draft.warnings.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={15} className="text-amber-600" />
              <p className="font-bold text-amber-800 text-[13px]">Outstanding Warnings</p>
            </div>
            <WarningList warnings={draft.warnings} />
            <p className="text-[11px] text-amber-700 mt-2">
              You may still approve and sign, but you are attesting that the note is clinically complete and accurate.
            </p>
          </div>
        )}

        <div className={`border-2 rounded-xl p-5 transition-colors mb-5 ${approved ? 'border-emerald-400 bg-emerald-50' : 'border-border bg-white'}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-emerald-600 shrink-0" />
            <span className="text-[13px] text-navy leading-relaxed">
              I have reviewed and edited this note. I confirm that it accurately reflects the clinical encounter,
              contains no information I did not enter or verify, and is ready to be signed and placed in the client record.
              I understand that signing creates a permanent entry that can only be corrected through an amendment.
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setApproved(false); goTo('editing'); }}
            className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-[13px] text-slate hover:bg-slate/5 transition-colors">
            <Edit3 size={14} /> Back to Edit
          </button>
          <button onClick={handleApprove} disabled={!approved}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors
              ${approved ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md' : 'bg-slate/20 text-slate/50 cursor-not-allowed'}`}>
            <CheckCircle size={15} /> Approve & Proceed to Signature <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  function renderSignature() {
    if (!client) return null;
    return (
      <div className="max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shadow-md">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy">Electronic Signature</h2>
            <p className="text-sm text-slate">Signing locks this note. Corrections require an amendment.</p>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 mb-5 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate/50 mb-1">Client (Fictional)</p>
            <p className="font-semibold text-navy">{client.firstName} {client.lastName} — {client.mrn}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate/50 mb-1">Service Date</p>
              <p className="text-navy text-[13px]">{svc.date}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate/50 mb-1">Service Type</p>
              <p className="text-navy text-[13px]">{svc.serviceType}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate/50 mb-1">Note Format</p>
            <p className="text-navy text-[13px]">DAP Progress Note — Individual Counseling</p>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 space-y-4">
          <p className="text-[11px] font-bold text-navy uppercase tracking-wide">Signing Clinician</p>
          <div>
            <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">
              Full Name & Credentials *
            </label>
            <input value={svc.participants}
              onChange={e => setSvc(p => ({ ...p, participants: e.target.value }))}
              placeholder="e.g. Jordan Rivera, LCADC, CADC-II"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">
              Signature PIN (≥ 4 characters) *
            </label>
            <input type="password" value={pin} onChange={e => setPin(e.target.value)}
              placeholder="Enter your signature PIN"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30" />
            <p className="text-[10px] text-slate/50 mt-1">Testing environment: any PIN of 4+ characters will work.</p>
          </div>
          {pinError && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={13} />
              <p className="text-[12px]">{pinError}</p>
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 my-5">
          <p className="text-[12px] text-amber-800 leading-relaxed">
            By signing, I attest that this note is a true and accurate record of the clinical encounter
            documented herein, that I personally provided or supervised the service, and that I am
            authorized to sign clinical documentation for this client. I understand that falsifying
            clinical records is a professional and legal violation.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setApproved(false); goTo('approval'); }}
            className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-[13px] text-slate hover:bg-slate/5 transition-colors">
            <ChevronLeft size={14} /> Back
          </button>
          <button onClick={handleSign}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-navy to-navy/80 text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-opacity shadow-lg">
            <Lock size={15} /> Sign & Lock Note
          </button>
        </div>
      </div>
    );
  }

  function renderLocked() {
    if (!draft || !client) return null;
    return (
      <div className="max-w-3xl">
        {/* Locked header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
              <Lock size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy">Final Signed Note</h2>
              <p className="text-sm text-slate">Read-only. Amendments create a separate addendum.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-lg px-3 py-1.5">
            <CheckCircle size={14} className="text-emerald-600" />
            <span className="text-[12px] font-bold text-emerald-700">SIGNED & LOCKED</span>
          </div>
        </div>

        {/* Metadata bar */}
        <div className="bg-navy/4 rounded-xl p-4 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
          <div><p className="font-bold text-slate/50 uppercase tracking-wide mb-0.5">Client</p>
            <p className="text-navy font-semibold">{client.firstName} {client.lastName}</p>
            <p className="text-slate/60">{client.mrn}</p></div>
          <div><p className="font-bold text-slate/50 uppercase tracking-wide mb-0.5">Service</p>
            <p className="text-navy">{svc.date}</p>
            <p className="text-slate/60">{svc.startTime}–{svc.endTime}</p></div>
          <div><p className="font-bold text-slate/50 uppercase tracking-wide mb-0.5">Type</p>
            <p className="text-navy">DAP Progress Note</p>
            <p className="text-slate/60">{svc.serviceType}</p></div>
          <div><p className="font-bold text-slate/50 uppercase tracking-wide mb-0.5">Signed By</p>
            <p className="text-navy font-semibold">{signedBy}</p>
            <p className="text-slate/60">{signedAt}</p></div>
        </div>

        {/* Signed note body */}
        <div className="bg-white border-2 border-emerald-200 rounded-xl p-6 mb-5 shadow-sm relative">
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-100 rounded-full px-2.5 py-1">
            <Lock size={10} className="text-emerald-600" />
            <span className="text-[9px] font-bold text-emerald-700 uppercase">Locked</span>
          </div>
          <pre className="text-[13px] text-navy/90 whitespace-pre-wrap font-sans leading-relaxed select-text">
            {editedNote}
          </pre>
        </div>

        {/* Amendment addendum (if filed) */}
        {amendment && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw size={14} className="text-amber-600" />
              <p className="font-bold text-amber-800 text-[13px]">AMENDMENT / ADDENDUM</p>
              <span className="text-[10px] text-amber-600 ml-auto">{amendment.amendedAt}</span>
            </div>
            <p className="text-[11px] text-amber-800 mb-2"><span className="font-semibold">Reason:</span> {amendment.reason}</p>
            <pre className="text-[12px] text-amber-900/80 whitespace-pre-wrap font-sans bg-white border border-amber-200 rounded-lg p-3">
              {amendment.addendum}
            </pre>
            <p className="text-[10px] text-amber-600 mt-2">Signed: {amendment.amendedBy} · {amendment.amendedAt}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mb-2">
          <button onClick={() => setAmendOpen(true)}
            disabled={false}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-[13px] text-slate hover:bg-slate/5 transition-colors">
            <RotateCcw size={14} /> File Amendment
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-[13px] text-slate hover:bg-slate/5 transition-colors">
            <FileText size={14} /> Print / Export
          </button>
        </div>
        <p className="text-[10px] text-slate/40 mb-4">
          This note originated in a testing environment using fictional data only. Not a real medical record.
        </p>

        <AuditTrail entries={audit} />
      </div>
    );
  }

  // ── Amendment modal ──────────────────────────────────────────────────────────

  function renderAmendModal() {
    if (!amendOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 z-[900] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <RotateCcw size={16} className="text-amber-600" />
              <p className="font-bold text-navy text-[15px]">File Amendment</p>
            </div>
            <button onClick={() => setAmendOpen(false)}>
              <X size={18} className="text-slate/50 hover:text-slate" />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[11px] text-amber-800">
                The original signed note cannot be altered. This addendum will be appended to the record
                with its own timestamp and your signature. Both versions are preserved.
              </p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">
                Reason for Amendment <span className="text-red-500">*</span>
              </label>
              <select value={amendReason} onChange={e => setAmendReason(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30">
                <option value="">— Select reason —</option>
                <option>Clerical error correction</option>
                <option>Missing clinical information</option>
                <option>Incorrect service date or time</option>
                <option>Goal linkage correction</option>
                <option>Supervisor correction requested</option>
                <option>Other (describe in addendum)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">
                Addendum Text <span className="text-red-500">*</span>
              </label>
              <textarea rows={5} value={amendText} onChange={e => setAmendText(e.target.value)}
                placeholder="Describe the correction or additional information…"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-[13px] text-navy resize-y focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">
                Signature PIN *
              </label>
              <input type="password" value={amendPin} onChange={e => setAmendPin(e.target.value)}
                placeholder="Re-enter your PIN to sign this addendum"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-[13px] text-navy focus:outline-none focus:ring-2 focus:ring-sunrise-orange/30" />
            </div>
            {amendPinError && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={13} />
                <p className="text-[12px]">{amendPinError}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-border">
            <button onClick={() => setAmendOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-[13px] text-slate hover:bg-slate/5">
              Cancel
            </button>
            <button onClick={handleAmendSubmit}
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-white rounded-lg text-[13px] font-semibold hover:bg-amber-700 transition-colors">
              <ShieldCheck size={14} /> Sign & File Addendum
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-bg px-4 sm:px-6 py-6 max-w-6xl mx-auto">
      <TestBanner />

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">AI Clinical Documentation</h1>
          <p className="text-sm text-slate">DAP Progress Note — Individual Counseling · Testing Environment</p>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
        {step === 'client-select'   && renderClientSelect()}
        {step === 'service-info'    && renderServiceInfo()}
        {step === 'goal-select'     && renderGoalSelect()}
        {step === 'clinician-input' && renderClinicianInput()}
        {step === 'generating'      && renderGenerating()}
        {step === 'ai-draft'        && renderAIDraft()}
        {step === 'editing'         && renderEditing()}
        {step === 'approval'        && renderApproval()}
        {step === 'signature'       && renderSignature()}
        {step === 'locked'          && renderLocked()}
      </div>

      {/* Persistent audit trail (pre-locked) */}
      {step !== 'locked' && step !== 'generating' && step !== 'client-select' && (
        <div className="bg-white rounded-2xl border border-border shadow-sm px-6 py-5 mt-4">
          <AuditTrail entries={audit} />
        </div>
      )}

      {renderAmendModal()}
    </div>
  );
}
