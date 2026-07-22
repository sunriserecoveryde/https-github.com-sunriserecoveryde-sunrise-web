import React, { useState } from 'react';
import { MOCK_PATIENTS, Patient, TreatmentGoal } from '../data/mockPatients';
import { Screen } from '../App';
import { useSessionChart } from '../context/SessionChartContext';
import {
  Target, CheckCircle2, Clock, Search, ChevronDown, ChevronUp,
  AlertTriangle, TrendingUp, BarChart3, PenTool, Plus, Calendar,
} from 'lucide-react';
import { SignatureModal, SignedBadge, SignatureRecord } from '../components/ui/SignatureModal';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { LockedButton } from '../components/common/LockedButton';
import { getRolesWithEditAccess } from '../data/mockRoles';

// ─── Extended mock goals for patients that have none ────────────────────────

const EXTRA_GOALS: Record<string, TreatmentGoal[]> = {
  p2: [
    { id: 'p2-g1', category: 'Substance Use', problem: 'Alcohol use disorder — pattern of daily use', longTerm: 'Maintain sustained recovery from alcohol for 12 months', shortTerm: 'Attend all scheduled groups and individual sessions this week', status: 'In Progress', targetDate: '2026-08-20' },
    { id: 'p2-g2', category: 'Mental Health', problem: 'Generalized anxiety affecting treatment engagement', longTerm: 'Reduce GAD-7 score to ≤ 7 by discharge', shortTerm: 'Practice 1 grounding exercise daily and journal reactions', status: 'In Progress', targetDate: '2026-07-31' },
  ],
  p3: [
    { id: 'p3-g1', category: 'Substance Use', problem: 'Methamphetamine use — primary substance', longTerm: 'Achieve 90-day abstinence from methamphetamine', shortTerm: 'Engage in SMART Recovery group twice this week', status: 'Not Started', targetDate: '2026-09-01' },
    { id: 'p3-g2', category: 'Behavioral', problem: 'Disruption of group milieu — peer conflict', longTerm: 'Demonstrate therapeutic peer engagement consistently for 2 weeks', shortTerm: 'Discuss peer conflict with counselor in 1:1 — identify 1 coping strategy', status: 'In Progress', targetDate: '2026-07-25' },
    { id: 'p3-g3', category: 'Psychiatric', problem: 'Mild paranoid ideation (substance-induced)', longTerm: 'Remain free of psychotic symptoms ≥ 30 days post-discharge', shortTerm: 'Attend daily psychiatric check-in and complete safety plan review', status: 'In Progress', targetDate: '2026-08-07' },
  ],
  p4: [
    { id: 'p4-g1', category: 'Medical', problem: 'Active wound (abscess, left arm) related to IVDU', longTerm: 'Full wound healing and no recurrence at 60-day follow-up', shortTerm: 'Comply with wound care protocol daily and attend all nursing visits', status: 'In Progress', targetDate: '2026-08-05' },
    { id: 'p4-g2', category: 'Substance Use', problem: 'Polysubstance dependence (opioids, cocaine, benzodiazepines)', longTerm: 'Stable on MAT and abstinent from illicit substances 6 months', shortTerm: 'Complete COWS and CIWA assessments Q4H; discuss triggers with counselor', status: 'In Progress', targetDate: '2026-08-20' },
    { id: 'p4-g3', category: 'Legal/Compliance', problem: 'Court-mandated treatment — drug court compliance required', longTerm: 'Maintain compliance with all drug court requirements through sentence', shortTerm: 'Sign ROI for drug court coordinator and attend all court-ordered programming', status: 'Not Started', targetDate: '2026-07-26' },
  ],
  p5: [
    { id: 'p5-g1', category: 'Substance Use', problem: 'Alcohol use disorder with active CIWA protocol', longTerm: 'Maintain abstinence from alcohol and complete Vivitrol series', shortTerm: 'Participate in CIWA monitoring Q4H and attend medical check-ins', status: 'In Progress', targetDate: '2026-09-01' },
    { id: 'p5-g2', category: 'Financial', problem: 'Outstanding self-pay balance creating treatment engagement barrier', longTerm: 'Establish payment plan and maintain financial counseling engagement', shortTerm: 'Meet with financial counselor this week to review balance and options', status: 'Not Started', targetDate: '2026-07-25' },
  ],
  p6: [
    { id: 'p6-g1', category: 'Substance Use', problem: 'Alcohol use disorder — medical detox required', longTerm: 'Complete medically supervised detox and enter into active recovery', shortTerm: 'Attend morning check-in with nursing and complete CIWA protocol', status: 'Met', targetDate: '2026-07-20' },
    { id: 'p6-g2', category: 'Coping Skills', problem: 'Limited coping strategies for alcohol cravings', longTerm: 'Develop 5 reliable coping strategies and practice daily', shortTerm: 'Identify 1 trigger and 1 coping strategy in individual session', status: 'In Progress', targetDate: '2026-08-01' },
  ],
  p7: [
    { id: 'p7-g1', category: 'Substance Use', problem: 'Cocaine use disorder — stimulant dependency pattern', longTerm: 'Achieve 90-day abstinence; engage in aftercare plan', shortTerm: 'Identify 3 high-risk situations and discuss avoidance strategies with counselor', status: 'In Progress', targetDate: '2026-10-01' },
    { id: 'p7-g2', category: 'Mental Health', problem: 'Antisocial personality traits impacting therapeutic engagement', longTerm: 'Engage authentically in therapy 3+ sessions/week without manipulation', shortTerm: 'Complete one journal reflection on interpersonal patterns this week', status: 'In Progress', targetDate: '2026-08-15' },
  ],
  p8: [
    { id: 'p8-g1', category: 'Substance Use', problem: 'Opioid use disorder with active COWS protocol', longTerm: 'Stable on Suboxone; abstinent from illicit opioids 6 months', shortTerm: 'COWS < 8 for 3 consecutive assessments; attend MAT education group', status: 'In Progress', targetDate: '2026-09-15' },
    { id: 'p8-g2', category: 'Psychiatric', problem: 'Comorbid eating disorder — meal restriction behaviors', longTerm: 'Restore healthy eating patterns and reduce restriction behaviors', shortTerm: 'Attend all meals and meet with dietitian; discuss ED behaviors with therapist', status: 'Not Started', targetDate: '2026-08-01' },
    { id: 'p8-g3', category: 'Mental Health', problem: 'Severe anxiety — 9/10 self-report; panic history', longTerm: 'Anxiety manageable with skills; no panic attacks for 30 days', shortTerm: 'Practice 4-7-8 breathing daily; discuss anxiety triggers in CBT group', status: 'In Progress', targetDate: '2026-08-20' },
  ],
};

function getGoals(p: Patient): TreatmentGoal[] {
  return p.goals.length > 0 ? p.goals : (EXTRA_GOALS[p.id] ?? []);
}

// ─── Derived data ─────────────────────────────────────────────────────────────

const REVIEW_INTERVALS: Record<string, string> = {
  p1: '2026-07-25', p3: '2026-07-22', p4: '2026-07-23',
  p5: '2026-07-25', p6: '2026-07-26', p7: '2026-07-28',
  p8: '2026-07-24', p9: '2026-07-27', p2: '2026-08-01',
};

const TODAY = '2026-07-22';

function isOverdue(date: string) { return date < TODAY; }
function isDueWithin7(date: string) { return date >= TODAY && date <= '2026-07-26'; }

const STATUS_COLORS: Record<TreatmentGoal['status'], string> = {
  'Met':         'bg-green-100 text-green-800 border border-green-200',
  'In Progress': 'bg-blue-100 text-blue-800 border border-blue-200',
  'Not Started': 'bg-slate-100 text-slate border border-slate-200',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Substance Use': 'bg-purple-100 text-purple-700',
  'Mental Health':  'bg-blue-100 text-blue-700',
  'Psychiatric':    'bg-indigo-100 text-indigo-700',
  'Behavioral':     'bg-orange-100 text-orange-700',
  'Medical':        'bg-red-100 text-red-700',
  'Legal/Compliance':'bg-amber-100 text-amber-700',
  'Financial':      'bg-yellow-100 text-yellow-700',
  'Coping Skills':  'bg-teal-100 text-teal-700',
};

// ─── Goal Row ─────────────────────────────────────────────────────────────────

function GoalRow({
  goal, readOnly, onStatusChange
}: {
  goal: TreatmentGoal;
  readOnly?: boolean;
  onStatusChange: (id: string, status: TreatmentGoal['status']) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isOverdueGoal = isOverdue(goal.targetDate) && goal.status !== 'Met';

  return (
    <div className={`border rounded-lg mb-2 overflow-hidden ${isOverdueGoal ? 'border-critical/30 bg-red-50/30' : 'border-border'}`}>
      <div
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status icon */}
        <div className="flex-none mt-0.5">
          {goal.status === 'Met'
            ? <CheckCircle2 className="w-4 h-4 text-success" />
            : goal.status === 'In Progress'
              ? <TrendingUp className="w-4 h-4 text-sunrise-blue" />
              : <Clock className="w-4 h-4 text-slate" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold text-sm text-navy leading-tight">{goal.problem}</div>
            <div className="flex items-center gap-2 flex-none">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${CATEGORY_COLORS[goal.category] ?? 'bg-slate-100 text-slate'}`}>
                {goal.category}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[goal.status]}`}>
                {goal.status}
              </span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </div>
          </div>
          <div className={`text-[10px] mt-0.5 font-medium ${isOverdueGoal ? 'text-critical' : 'text-slate'}`}>
            <Calendar className="w-3 h-3 inline mr-0.5" />
            {isOverdueGoal ? '⚠ OVERDUE — ' : 'Target: '}
            {goal.targetDate}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-white px-4 py-3 space-y-3">
          <div>
            <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Long-Term Goal</div>
            <p className="text-sm text-navy">{goal.longTerm}</p>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Short-Term Objective</div>
            <p className="text-sm text-navy">{goal.shortTerm}</p>
          </div>
          {!readOnly && (
            <div className="flex gap-2 flex-wrap pt-1">
              {(['Not Started', 'In Progress', 'Met'] as TreatmentGoal['status'][]).map(s => (
                <button
                  key={s}
                  onClick={() => onStatusChange(goal.id, s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded border transition-colors ${
                    goal.status === s
                      ? s === 'Met' ? 'bg-success text-white border-success'
                        : s === 'In Progress' ? 'bg-sunrise-blue text-white border-sunrise-blue'
                        : 'bg-slate-600 text-white border-slate-600'
                      : 'bg-white text-slate border-border hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add Goal Form ────────────────────────────────────────────────────────────

function AddGoalForm({ onSave, onCancel }: { onSave: (g: TreatmentGoal) => void; onCancel: () => void }) {
  const [category, setCategory] = useState('Substance Use');
  const [problem, setProblem] = useState('');
  const [longTerm, setLongTerm] = useState('');
  const [shortTerm, setShortTerm] = useState('');
  const [targetDate, setTargetDate] = useState('2026-10-20');
  const [status, setStatus] = useState<TreatmentGoal['status']>('Not Started');

  const handleSubmit = () => {
    if (!problem.trim()) return;
    onSave({
      id: `sg-${Date.now()}`,
      category, problem: problem.trim(),
      longTerm: longTerm.trim() || '(To be specified)',
      shortTerm: shortTerm.trim() || '(To be specified)',
      targetDate, status,
    });
  };

  return (
    <div className="border border-sunrise-blue/30 rounded-lg p-4 bg-blue-50/30 space-y-3 mt-3">
      <div className="text-xs font-bold text-navy uppercase tracking-wide">New Treatment Goal</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white border border-border rounded px-2 py-1.5 text-sm">
            {Object.keys(CATEGORY_COLORS).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Initial Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as TreatmentGoal['status'])} className="w-full bg-white border border-border rounded px-2 py-1.5 text-sm">
            <option>Not Started</option><option>In Progress</option><option>Met</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Problem / Focus Area *</label>
        <input value={problem} onChange={e => setProblem(e.target.value)} placeholder="e.g. Alcohol use disorder — pattern of daily use" className="w-full bg-white border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-sunrise-blue" />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Long-Term Goal</label>
        <input value={longTerm} onChange={e => setLongTerm(e.target.value)} placeholder="e.g. Maintain sobriety and establish community supports" className="w-full bg-white border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-sunrise-blue" />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Short-Term Objective</label>
        <input value={shortTerm} onChange={e => setShortTerm(e.target.value)} placeholder="e.g. Attend all scheduled IOP sessions this week" className="w-full bg-white border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-sunrise-blue" />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Target Date</label>
        <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="bg-white border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-sunrise-blue" />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={handleSubmit} disabled={!problem.trim()} className="px-4 py-1.5 bg-sunrise-blue text-white text-sm font-semibold rounded hover:bg-sunrise-blue-light disabled:opacity-40 disabled:cursor-not-allowed">Add Goal</button>
        <button onClick={onCancel} className="px-4 py-1.5 border border-border text-slate text-sm rounded hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  );
}

// ─── Patient Plan Card ────────────────────────────────────────────────────────

function PatientPlanCard({
  patient, readOnly, goalStatuses, onStatusChange, sessionGoals = [], onAddGoal,
}: {
  patient: Patient;
  readOnly?: boolean;
  goalStatuses: Record<string, TreatmentGoal['status']>;
  onStatusChange: (id: string, status: TreatmentGoal['status']) => void;
  sessionGoals?: TreatmentGoal[];
  onAddGoal?: (g: TreatmentGoal) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [clientSig, setClientSig] = useState<SignatureRecord | null>(null);
  const [clinicianSig, setClinicianSig] = useState<SignatureRecord | null>(null);
  const [sigModal, setSigModal] = useState<'client' | 'staff' | null>(null);
  const goals = [...getGoals(patient), ...sessionGoals].map(g => ({ ...g, status: goalStatuses[g.id] ?? g.status }));
  const metCount = goals.filter(g => g.status === 'Met').length;
  const inProgressCount = goals.filter(g => g.status === 'In Progress').length;
  const notStartedCount = goals.filter(g => g.status === 'Not Started').length;
  const progress = goals.length === 0 ? 0 : (metCount / goals.length) * 100;
  const nextReview = REVIEW_INTERVALS[patient.id];
  const reviewOverdue = nextReview && isOverdue(nextReview);
  const reviewSoon = nextReview && isDueWithin7(nextReview);

  if (goals.length === 0 && !onAddGoal) return null;

  // Empty-state card for demo patient with no goals yet
  if (goals.length === 0 && onAddGoal) {
    return (
      <div className="bg-white border border-dashed border-sunrise-blue/40 rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="flex items-center gap-4 p-4">
          <PatientAvatar first={patient.firstName} last={patient.lastName} program={patient.program} size="md" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-navy">{patient.firstName} {patient.lastName}</span>
              <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{patient.program}</span>
              <span className="text-[10px] text-slate font-mono">{patient.mrn}</span>
            </div>
            <div className="text-xs text-slate mt-0.5">{patient.counselor.split(',')[0]} · Pending Intake — No treatment goals yet</div>
          </div>
        </div>
        <div className="border-t border-dashed border-sunrise-blue/30 px-4 py-3 bg-blue-50/30">
          {!readOnly && (showAddForm ? (
            <AddGoalForm onSave={(g) => { onAddGoal(g); setShowAddForm(false); }} onCancel={() => setShowAddForm(false)} />
          ) : (
            <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 text-sm font-semibold text-sunrise-blue hover:underline">
              <Plus className="w-4 h-4" /> Add First Treatment Goal
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-xl shadow-sm overflow-hidden mb-4 ${reviewOverdue ? 'border-critical/40' : reviewSoon ? 'border-sunrise-amber/40' : 'border-border'}`}>
      {/* Card header */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <PatientAvatar first={patient.firstName} last={patient.lastName} program={patient.program} size="md" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-navy">{patient.firstName} {patient.lastName}</span>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate px-2 py-0.5 rounded-full">{patient.program}</span>
            <span className="text-[10px] text-slate font-mono">{patient.mrn}</span>
          </div>
          <div className="text-xs text-slate mt-0.5">
            {patient.counselor.split(',')[0]} · LOS {patient.los}d
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[160px]">
              <div className="h-full bg-success rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] font-semibold text-success">{metCount}/{goals.length} goals met</span>
          </div>
        </div>

        {/* Goal counts */}
        <div className="hidden sm:flex items-center gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-success">{metCount}</div>
            <div className="text-[10px] text-slate uppercase">Met</div>
          </div>
          <div>
            <div className="text-lg font-bold text-sunrise-blue">{inProgressCount}</div>
            <div className="text-[10px] text-slate uppercase">Active</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate">{notStartedCount}</div>
            <div className="text-[10px] text-slate uppercase">Not Started</div>
          </div>
        </div>

        {/* Review due */}
        <div className="flex-none text-center">
          <div className={`text-xs font-semibold px-2 py-1 rounded ${reviewOverdue ? 'bg-red-100 text-critical' : reviewSoon ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate'}`}>
            {reviewOverdue ? '⚠ Overdue' : reviewSoon ? 'Due Soon' : 'On Track'}
          </div>
          {nextReview && <div className="text-[10px] text-slate mt-0.5">{nextReview}</div>}
        </div>

        <div className="flex-none">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded goals */}
      {expanded && (
        <div className="border-t border-border px-4 py-3 bg-slate-50/40">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-slate uppercase tracking-wider">Treatment Goals & Objectives</div>
            <LockedButton
              locked={readOnly}
              onClick={() => setShowAddForm(s => !s)}
              className="flex items-center gap-1 text-xs font-semibold text-sunrise-blue hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> {showAddForm ? 'Cancel' : 'Add Goal'}
            </LockedButton>
          </div>
          {goals.map(g => (
            <GoalRow
              key={g.id}
              goal={g}
              readOnly={readOnly}
              onStatusChange={onStatusChange}
            />
          ))}
          {showAddForm && onAddGoal && !readOnly && (
            <AddGoalForm
              onSave={(g) => { onAddGoal(g); setShowAddForm(false); }}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* Treatment Plan Signatures */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-[10px] font-bold text-slate uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <PenTool className="w-3 h-3" /> Treatment Plan Signatures
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-teal-200 rounded-xl p-3 space-y-2">
                <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wide">Client Signature</div>
                <div className="text-xs text-slate">Client agrees to and acknowledges this treatment plan.</div>
                {clientSig
                  ? <SignedBadge record={clientSig} />
                  : <LockedButton locked={readOnly} editRoles={readOnly ? [] : ['Primary Counselor', 'Certified Clinician', 'Clinical Supervisor']} onClick={() => setSigModal('client')} className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold w-full text-center">
                      Collect Client Signature
                    </LockedButton>}
              </div>
              <div className="border border-border rounded-xl p-3 space-y-2">
                <div className="text-[10px] font-bold text-slate uppercase tracking-wide">Clinician Signature</div>
                <div className="text-xs text-slate">Clinician authorizes this treatment plan.</div>
                {clinicianSig
                  ? <SignedBadge record={clinicianSig} />
                  : <LockedButton locked={readOnly} editRoles={readOnly ? [] : ['Primary Counselor', 'Certified Clinician', 'Clinical Supervisor']} onClick={() => setSigModal('staff')} className="text-xs px-3 py-1.5 bg-navy text-white rounded-lg hover:bg-navy/90 font-semibold w-full text-center">
                      Sign Treatment Plan
                    </LockedButton>}
              </div>
            </div>
          </div>

          <SignatureModal
            isOpen={!!sigModal}
            onClose={() => setSigModal(null)}
            signerType={sigModal ?? 'staff'}
            title={sigModal === 'client' ? 'Client Treatment Plan Signature' : 'Clinician Treatment Plan Signature'}
            documentTitle={`Treatment Plan — ${patient.firstName} ${patient.lastName}`}
            onSign={(record) => {
              if (sigModal === 'client') setClientSig(record);
              else setClinicianSig(record);
              setSigModal(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type FilterTab = 'All' | 'Due for Review' | 'Overdue' | 'Needs Goals';

export function TreatmentPlans({ navigate, readOnly }: { navigate: (s: Screen) => void; readOnly?: boolean }) {
  const editRoles = getRolesWithEditAccess('TreatmentPlans');
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [planSaved, setPlanSaved] = useState<string | null>(null);
  const savePlan = (msg: string) => { setPlanSaved(msg); setTimeout(() => setPlanSaved(null), 2500); };
  const [planView, setPlanView] = useState<'Plans' | 'Goal Analytics' | 'Plan Templates' | 'Outcomes' | 'Evidence Base' | 'Compliance Checklist'>('Plans');
  const [search, setSearch] = useState('');
  const [goalStatuses, setGoalStatuses] = useState<Record<string, TreatmentGoal['status']>>({});
  const { goals: sessionGoals, addGoal } = useSessionChart();
  const demoPatient = MOCK_PATIENTS.find(p => p.id === 'p_demo');

  const handleStatusChange = (id: string, status: TreatmentGoal['status']) => {
    setGoalStatuses(prev => ({ ...prev, [id]: status }));
  };

  // Compute stats
  const allGoals = MOCK_PATIENTS.flatMap(p => getGoals(p).map(g => ({ ...g, status: goalStatuses[g.id] ?? g.status })));
  const metGoals = allGoals.filter(g => g.status === 'Met').length;
  const dueForReview = MOCK_PATIENTS.filter(p => {
    const nr = REVIEW_INTERVALS[p.id];
    return nr && isDueWithin7(nr);
  }).length;
  const overdueCount = MOCK_PATIENTS.filter(p => {
    const nr = REVIEW_INTERVALS[p.id];
    return nr && isOverdue(nr);
  }).length;
  const needsGoalsCount = MOCK_PATIENTS.filter(p => getGoals(p).length === 0).length;

  // Filter patients
  const filtered = MOCK_PATIENTS.filter(p => {
    const goals = getGoals(p);
    const searchMatch = search === '' || `${p.firstName} ${p.lastName} ${p.mrn}`.toLowerCase().includes(search.toLowerCase());
    if (!searchMatch) return false;
    if (activeTab === 'Due for Review') {
      const nr = REVIEW_INTERVALS[p.id];
      return nr && isDueWithin7(nr);
    }
    if (activeTab === 'Overdue') {
      const nr = REVIEW_INTERVALS[p.id];
      return nr && isOverdue(nr);
    }
    if (activeTab === 'Needs Goals') return goals.length === 0;
    return goals.length > 0;
  });

  const completionRate = allGoals.length > 0 ? Math.round((metGoals / allGoals.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Target className="w-6 h-6 text-sunrise-blue" /> Treatment Plans
          </h1>
          <p className="text-slate text-sm mt-1">Clinical goals, short-term objectives, and 7-day review tracking</p>
        </div>
        <LockedButton
          locked={readOnly}
          onClick={() => savePlan('Batch update applied')}
          className="flex items-center gap-2 bg-sunrise-blue text-white px-4 py-2 rounded font-medium shadow-sm hover:bg-sunrise-blue-light transition-colors text-sm"
        >
          <PenTool className="w-4 h-4" /> Batch Update Plans
        </LockedButton>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Due for Review (7d)', value: dueForReview, color: 'text-sunrise-amber', border: 'border-sunrise-amber/40', icon: Clock },
          { label: 'Overdue Reviews', value: overdueCount, color: 'text-critical', border: 'border-critical/30', icon: AlertTriangle },
          { label: 'Goals Met (all-time)', value: metGoals, color: 'text-success', border: 'border-success/30', icon: CheckCircle2 },
          { label: 'Completion Rate', value: `${completionRate}%`, color: 'text-navy', border: 'border-navy/20', icon: BarChart3 },
        ].map(k => (
          <div key={k.label} className={`bg-white border-l-4 ${k.border} rounded-lg shadow-sm p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate uppercase tracking-wider">{k.label}</div>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* View Switcher */}
      <div className="flex gap-1 border-b border-border">
        {(['Plans', 'Goal Analytics', 'Plan Templates', 'Outcomes', 'Evidence Base', 'Compliance Checklist'] as const).map(v => (
          <button key={v} onClick={() => setPlanView(v)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${planView === v ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{v}</button>
        ))}
      </div>

      {planView === 'Goal Analytics' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Aggregate goal achievement analysis across all active treatment plans — completion trends, category breakdowns, and documentation compliance.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Goals Met (Overall)', value: `${completionRate}%`, color: 'text-green-600', sub: `${metGoals} of ${allGoals.length} goals` },
              { label: 'Overdue Reviews', value: overdueCount, color: 'text-red-600', sub: 'Past 7-day review window' },
              { label: 'Due This Week', value: dueForReview, color: 'text-amber-600', sub: 'Upcoming review deadline' },
              { label: 'Plans Without Goals', value: '2', color: 'text-red-600', sub: 'Need initial goal-setting' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Goal Achievement by Domain</h3>
              <div className="space-y-3 text-xs">
                {[
                  { domain: 'Sobriety / Substance Reduction', met: 14, total: 18, color: 'bg-purple-500' },
                  { domain: 'Mental Health Stability', met: 9, total: 12, color: 'bg-blue-500' },
                  { domain: 'Coping Skills', met: 11, total: 15, color: 'bg-teal-500' },
                  { domain: 'Social Support / Family', met: 6, total: 11, color: 'bg-green-500' },
                  { domain: 'Employment / Education', met: 3, total: 8, color: 'bg-amber-500' },
                  { domain: 'Housing Stability', met: 7, total: 9, color: 'bg-orange-500' },
                  { domain: 'Medical / MAT Adherence', met: 12, total: 14, color: 'bg-red-500' },
                ].map(d => {
                  const pct = Math.round((d.met / d.total) * 100);
                  return (
                    <div key={d.domain}>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate">{d.domain}</span>
                        <span className="font-semibold text-navy">{d.met}/{d.total} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className={`h-2 rounded-full ${d.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Review Compliance by Clinician</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-slate">
                      <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Clinician</th>
                      <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Plans</th>
                      <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">On Time</th>
                      <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Overdue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { name: 'Sarah Jenkins, LPC', plans: 5, onTime: 5, overdue: 0 },
                      { name: 'David Odom, LMFT', plans: 4, onTime: 3, overdue: 1 },
                      { name: 'Marcus Chen, CAC-AD', plans: 4, onTime: 2, overdue: 2 },
                      { name: 'Priya Nair, MSW', plans: 3, onTime: 3, overdue: 0 },
                      { name: 'Kevin Walsh, CAC-AD', plans: 2, onTime: 1, overdue: 1 },
                    ].map(r => (
                      <tr key={r.name} className="hover:bg-gray-50">
                        <td className="py-2 font-medium text-navy">{r.name}</td>
                        <td className="py-2 text-center text-slate">{r.plans}</td>
                        <td className="py-2 text-center text-green-600 font-semibold">{r.onTime}</td>
                        <td className="py-2 text-center">
                          <span className={`font-semibold ${r.overdue > 0 ? 'text-red-600' : 'text-slate'}`}>{r.overdue}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <strong>CARF Compliance:</strong> Treatment plan reviews must occur every 7 days for residential care, every 14 days for PHP, and every 30 days for IOP. Overdue reviews require immediate attention before next CARF survey visit.
              </div>
            </div>
          </div>
        </div>
      )}

      {planView === 'Plans' && (
      <div className="space-y-4">
      {/* Search + Tabs */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
          <div className="flex gap-1 overflow-x-auto">
            {(['All', 'Due for Review', 'Overdue', 'Needs Goals'] as FilterTab[]).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 text-sm font-semibold rounded whitespace-nowrap transition-colors ${
                  activeTab === t ? 'bg-navy text-white' : 'text-slate hover:bg-slate-100 hover:text-navy'
                }`}
              >
                {t}
                {t === 'Overdue' && overdueCount > 0 && (
                  <span className="ml-1 bg-critical text-white text-[10px] px-1 rounded-full">{overdueCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or MRN…"
              className="pl-9 pr-4 py-2 bg-bg border border-border rounded text-sm focus:outline-none focus:border-sunrise-blue w-60"
            />
          </div>
        </div>

        <div className="p-4">
          {/* Demo patient — Jonny Quest always shown at top */}
          {demoPatient && (
            <PatientPlanCard
              key="p_demo"
              patient={demoPatient}
              readOnly={readOnly}
              goalStatuses={goalStatuses}
              onStatusChange={handleStatusChange}
              sessionGoals={sessionGoals['p_demo'] ?? []}
              onAddGoal={(g) => addGoal('p_demo', g)}
            />
          )}
          {filtered.filter(p => p.id !== 'p_demo').length === 0 && !demoPatient ? (
            <div className="text-center py-10 text-slate">
              <Target className="w-10 h-10 mx-auto mb-2 text-border" />
              <div className="font-semibold text-navy">No patients match this filter.</div>
            </div>
          ) : (
            filtered.filter(p => p.id !== 'p_demo').map(p => (
              <PatientPlanCard
                key={p.id}
                patient={p}
                readOnly={readOnly}
                goalStatuses={goalStatuses}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      </div>
      </div>
      )}

      {planView === 'Plan Templates' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Standardized treatment plan templates by primary diagnosis and LOC — speeds plan creation while maintaining individualization requirements.</div>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                name: 'OUD — Residential, Buprenorphine MAT', dx: 'F11.20 / F11.23', loc: 'Residential (3.5)',
                goals: ['Achieve physiological stabilization on buprenorphine/naloxone within 7 days', 'Demonstrate understanding of MAT rationale and long-term maintenance plan', 'Identify 3 triggers and corresponding coping strategies by Week 2', 'Develop structured aftercare plan including community MAT provider by discharge'],
                objectives: 'CIWA/COWS ≤8; medication adherence 100%; group attendance ≥90%; safety plan documented',
                modalities: 'Individual therapy 3×/week, MAT clinic 2×/week, MI group 2×/week, 12-Step facilitation'
              },
              {
                name: 'AUD — Residential, CIWA Protocol', dx: 'F10.20 / F10.230', loc: 'Residential (3.5)',
                goals: ['Complete medically-managed alcohol withdrawal without complication', 'Identify alcohol use patterns and consequences using cognitive-behavioral framework', 'Engage family system in recovery planning by Week 3', 'Build 90-day sobriety maintenance plan with community supports'],
                objectives: 'CIWA score ≤8 within 72h; zero alcohol use per UDS; family session by Day 21',
                modalities: 'CBT group 3×/week, Family therapy 1×/week, Relapse prevention 2×/week, 12-Step'
              },
              {
                name: 'Stimulant SUD — PHP', dx: 'F14.20 / F15.20', loc: 'PHP (2.5)',
                goals: ['Achieve 30-day abstinence from stimulant use verified by UDS', 'Develop structured daily routine to replace stimulant-associated high-risk behaviors', 'Address co-occurring mood symptoms with psychiatric evaluation by Week 1', 'Establish employment or vocational rehabilitation plan'],
                objectives: 'Negative UDS 100%; psychiatric evaluation complete; structured daily schedule documented',
                modalities: 'CBT group daily, Anger management 2×/week, Life skills, Individual therapy 2×/week'
              },
              {
                name: 'Co-occurring MH+SUD — IOP', dx: 'Primary SUD + F33.1 or F41.1', loc: 'IOP (2.1)',
                goals: ['Stabilize psychiatric symptoms with medication management', 'Achieve 30-day sobriety with integrated MH/SUD coping plan', 'Engage in outpatient psychiatric follow-up post-discharge', 'Build recovery community and mutual aid involvement'],
                objectives: 'PHQ-9 decrease ≥5 pts; GAD-7 decrease ≥5 pts; psych f/u appointment booked; negative UDS',
                modalities: 'DBT skills 3×/week, Process group, Medication management, MI individual sessions'
              },
            ].map(t => (
              <div key={t.name} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-navy">{t.name}</div>
                    <div className="text-[10px] text-slate mt-0.5">Dx: {t.dx} · LOC: {t.loc}</div>
                  </div>
                  <button onClick={() => setPlanView('Plans')} className="shrink-0 ml-3 text-[10px] bg-navy text-white px-2.5 py-1 rounded font-medium hover:bg-opacity-90">Use Template</button>
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-slate mb-1">Goals:</div>
                  <ul className="space-y-0.5 mb-2">
                    {t.goals.map(g => <li key={g} className="text-navy flex gap-1"><span className="text-slate shrink-0">·</span>{g}</li>)}
                  </ul>
                  <div className="border-t border-border pt-2 space-y-1">
                    <div><span className="font-semibold text-slate">Objectives:</span> <span className="text-navy">{t.objectives}</span></div>
                    <div><span className="font-semibold text-slate">Modalities:</span> <span className="text-navy">{t.modalities}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {planView === 'Outcomes' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Treatment plan goal attainment outcomes — measures clinician effectiveness and patient engagement across the current census.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Goals Met (Discharge)', value: '74%', color: 'text-green-600', sub: 'Of all goals at d/c assessment' },
              { label: 'Avg Goals Per Plan', value: '4.2', color: 'text-navy', sub: 'Recommended: 3–6 goals' },
              { label: 'Plan Update Compliance', value: '91%', color: 'text-blue-600', sub: 'Updated per required schedule' },
              { label: 'Patient-Rated Relevance', value: '4.3/5', color: 'text-teal-600', sub: 'Survey: n=29 responses' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Goal Attainment by Domain</h3>
            <div className="space-y-2.5 text-xs">
              {[
                { domain: 'Substance Use / Abstinence', met: 78, color: 'bg-teal-500' },
                { domain: 'Safety & Crisis Stabilization', met: 91, color: 'bg-green-500' },
                { domain: 'Mental Health / Psychiatric Stability', met: 69, color: 'bg-purple-500' },
                { domain: 'MAT Engagement & Compliance', met: 88, color: 'bg-blue-500' },
                { domain: 'Family & Social Support', met: 62, color: 'bg-orange-400' },
                { domain: 'Employment & Vocational', met: 44, color: 'bg-amber-500' },
                { domain: 'Housing & Basic Needs', met: 71, color: 'bg-navy' },
                { domain: 'Aftercare Plan Completion', met: 81, color: 'bg-pink-400' },
              ].map(d => (
                <div key={d.domain}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-slate">{d.domain}</span>
                    <span className="font-bold text-navy">{d.met}% attained</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className={`h-1.5 rounded-full ${d.color}`} style={{ width: `${d.met}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {planView === 'Evidence Base' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Evidence-based treatment modalities used at Sunrise — efficacy summaries, appropriate populations, and clinical implementation guidance.</div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Treatment Modality Reference</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Modality', 'Applies To', 'Evidence Level', 'Typical Duration', 'Key Outcomes', 'Who Delivers'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { m: 'Motivational Interviewing (MI)', applies: 'All SUD, ambivalent patients', ev: 'Level I (RCT)', dur: 'Ongoing — 1–4 sessions per focus area', out: 'Engagement, retention, readiness to change', who: 'Counselors, CPRS' },
                  { m: 'Cognitive Behavioral Therapy (CBT)', applies: 'AUD, OUD, stimulant use; co-occurring MDD', ev: 'Level I (RCT)', dur: '12–16 sessions individual or group', out: 'Reduced use, relapse prevention, coping skills', who: 'Licensed counselors (LPC, LCSW, LMFT)' },
                  { m: 'Dialectical Behavior Therapy (DBT)', applies: 'BPD co-occurring, emotional dysregulation, self-harm history', ev: 'Level I', dur: '6–12 month structured program', out: 'Emotional regulation, distress tolerance, interpersonal effectiveness', who: 'DBT-trained clinicians' },
                  { m: 'Contingency Management (CM)', applies: 'Stimulant use disorder, cannabis, polysubstance', ev: 'Level I', dur: '12–24 weeks; incentive-based', out: 'Abstinence rates, treatment attendance', who: 'Counselors with CM protocol training' },
                  { m: 'Seeking Safety', applies: 'Co-occurring PTSD/SUD', ev: 'Level II', dur: '25 session curriculum (individual or group)', out: 'PTSD symptom reduction, substance use reduction', who: 'Trauma-trained counselors' },
                  { m: 'EMDR', applies: 'Trauma history; PTSD with SUD', ev: 'Level I (PTSD); Level II (SUD)', dur: '8–12 sessions individual', out: 'Trauma resolution, reduced craving to trauma cues', who: 'EMDR-certified clinicians only' },
                  { m: 'Twelve-Step Facilitation (TSF)', applies: 'All SUD, particularly AUD/OUD', ev: 'Level I', dur: '12–15 structured sessions + ongoing AA/NA', out: '12-step affiliation, long-term abstinence', who: 'Counselors; supported by CPRS' },
                  { m: 'CRAFT (Community Reinforcement and Family Training)', applies: 'Families of resistant patients', ev: 'Level I', dur: '12–20 sessions', out: 'Treatment entry rates, family wellbeing', who: 'CRAFT-trained family counselors' },
                ].map(r => (
                  <tr key={r.m} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-navy">{r.m}</td>
                    <td className="px-3 py-2 text-slate">{r.applies}</td>
                    <td className="px-3 py-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.ev.startsWith('Level I (') || r.ev === 'Level I' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.ev}</span></td>
                    <td className="px-3 py-2 text-slate">{r.dur}</td>
                    <td className="px-3 py-2 text-slate">{r.out}</td>
                    <td className="px-3 py-2 text-slate">{r.who}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {planView === 'Compliance Checklist' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">CARF and state licensure documentation requirements for treatment plans — use as a pre-completion checklist before signing.</div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Plans Meeting All Criteria', value: '18 / 22', color: 'text-green-600', sub: '82% compliance rate' },
              { label: 'Missing Signatures', value: 3, color: 'text-amber-600', sub: 'Counselor or MD cosign needed' },
              { label: 'Overdue for Review', value: 4, color: 'text-red-600', sub: '30-day update window exceeded' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Required Elements — CARF Standard QI.M.1 / TDAMHSAS Licensure</h3>
            <div className="space-y-1.5 text-xs">
              {[
                { item: 'Problem/need statement grounded in biopsychosocial assessment', req: 'CARF + State', done: true },
                { item: 'Measurable, time-limited goals with target dates', req: 'CARF + State', done: true },
                { item: 'Specific, observable objectives for each goal', req: 'CARF + State', done: true },
                { item: 'Interventions linked to each objective (with modality and frequency)', req: 'CARF + State', done: true },
                { item: 'Person-served input documented and signature obtained', req: 'CARF + State', done: false },
                { item: 'Legal guardian signature (if applicable — minors/court-ordered)', req: 'State only', done: true },
                { item: 'Counselor signature and credentials', req: 'CARF + State', done: false },
                { item: 'MD/DO review and cosign (within 72h of admission)', req: 'State only', done: true },
                { item: 'Crisis plan / safety plan linked or embedded', req: 'CARF', done: true },
                { item: 'Cultural/linguistic needs addressed', req: 'CARF', done: true },
                { item: 'Review frequency specified (minimum 30-day residential)', req: 'State only', done: false },
                { item: '30-day review completed and documented with progress rating', req: 'State only', done: true },
              ].map(r => (
                <div key={r.item} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${r.done ? 'text-green-500' : 'text-red-400'}`}>{r.done ? '✓' : '✗'}</span>
                    <span className={r.done ? 'text-navy' : 'text-red-700 font-medium'}>{r.item}</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate bg-gray-100 px-1.5 py-0.5 rounded shrink-0 ml-2">{r.req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {planSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <span>✓</span> {planSaved}
        </div>
      )}
    </div>
  );
}
