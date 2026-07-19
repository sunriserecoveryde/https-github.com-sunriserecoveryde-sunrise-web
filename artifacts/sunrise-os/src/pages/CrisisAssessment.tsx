import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { AlertTriangle, CheckCircle, XCircle, Shield, Phone, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Imminent';
type IdeationType = 0 | 1 | 2 | 3 | 4 | 5;

interface CSSRSRecord {
  patientId: string;
  assessedDate: string;
  assessedBy: string;
  ideationType: IdeationType; // 0=none,1=passive,2=active-no-method,3-active+method,4=plan,5=intent
  intensityScore: number; // 0-25
  behaviorScore: number; // 0=none,1=preparatory,2=aborted,3=interrupted,4=actual
  riskLevel: RiskLevel;
  safetyPlanCompleted: boolean;
  meansRestrictionCounseled: boolean;
  clinicianNotified: string;
  interventions: string[];
  safetyPlanItems: string[];
  notes: string;
}

const CSSRS_RECORDS: CSSRSRecord[] = [
  {
    patientId: 'p1',
    assessedDate: '2026-07-18',
    assessedBy: 'Sarah Jenkins, LPC',
    ideationType: 2,
    intensityScore: 8,
    behaviorScore: 0,
    riskLevel: 'Moderate',
    safetyPlanCompleted: true,
    meansRestrictionCounseled: true,
    clinicianNotified: 'Dr. James Carter, CADC-III (Clinical Director) — notified 7/18 at 2:30 PM',
    interventions: [
      'Safety plan reviewed and updated',
      'AMA monitoring increased to Q30min checks',
      'Counselor notified — 1:1 scheduled for 7/19 AM',
      'Suboxone dose adjusted per MD order to reduce withdrawal discomfort (reducing AMA risk)',
      'Family contact: wife called with patient consent — support mobilized',
    ],
    safetyPlanItems: [
      'Warning signs: feeling hopeless, irritable, isolating',
      'Internal coping: breathing exercises (4-7-8 technique), journaling',
      'Social distraction: call wife Emily (615-555-9211), sponsor David H.',
      'Professional support: Sunrise Recovery on-call (615-555-0100), Dr. Carter (pager 4401)',
      'Crisis resources: 988 Suicide & Crisis Lifeline, Vanderbilt ED',
      'Means restriction: firearms secured with brother-in-law',
    ],
    notes: 'Patient expressed passive ideation during 1:1 session on 7/18. "I\'ve thought I\'d be better off dead but I don\'t want to do anything about it." No plan, no means access, no intent. Reports motivation to stay for children. AMA risk remains high due to withdrawal discomfort — this appears to be driving passive SI rather than primary psychiatric crisis. Monitoring increased. Counselor and MD aware.',
  },
  {
    patientId: 'p9',
    assessedDate: '2026-07-17',
    assessedBy: 'Kevin Wright, BHT (Screened) / Dr. Hughes, MD (Co-assessed)',
    ideationType: 3,
    intensityScore: 16,
    behaviorScore: 1,
    riskLevel: 'High',
    safetyPlanCompleted: true,
    meansRestrictionCounseled: true,
    clinicianNotified: 'Dr. Emma Hughes, MD (Psychiatrist) — paged at 11:15 PM 7/17; Dr. James Carter — notified 7:00 AM 7/18',
    interventions: [
      '30-min safety checks increased from Q1H to Q30min — full visual contact required',
      'Psychiatric emergency consult completed (Dr. Hughes, MD)',
      'Risperdal PRN given 7/17 11:45 PM per Dr. Hughes order',
      'Unit secured — patient removed from outdoor privileges pending psychiatric stabilization',
      'Family contact: sister Brenda contacted — declined to provide further information (no 42 CFR consent)',
      'Behavioral contract declined — patient in acute psychotic state, unable to contract for safety',
    ],
    safetyPlanItems: [
      'Warning signs: paranoid statements, agitation, refusal of check-ins',
      'NOTE: Patient currently unable to effectively engage in safety planning due to psychosis',
      'Staff management plan active: 30-min visual checks, no unsupervised outdoor access',
      'Medication: Risperdal PRN available, Seroquel 2100 as ordered',
      'Psychiatric consultation on standby: Dr. Hughes pager 4433',
      'Transfer criteria: If C-SSRS behavior score progresses to actual attempt OR patient becomes aggressive — activate psychiatric transfer protocol',
    ],
    notes: 'Substance-induced psychosis (methamphetamine) with paranoid delusions — patient believed "government agents" were poisoning his food. Expressed that "death would be a relief." Method: stated he could use the bed frame (removed from room per protocol 7/17). C-SSRS behavioral score 1 (preparatory behaviors: discussed method, stated he was "ready"). HIGH risk designation — psychiatric hospitalization criteria reviewed with Dr. Hughes; patient managed on unit with enhanced monitoring pending psychiatric stabilization.',
  },
  {
    patientId: 'p5',
    assessedDate: '2026-07-15',
    assessedBy: 'David Odom, LMFT',
    ideationType: 1,
    intensityScore: 3,
    behaviorScore: 0,
    riskLevel: 'Low',
    safetyPlanCompleted: true,
    meansRestrictionCounseled: false,
    clinicianNotified: 'Documented per protocol — LOW risk, no immediate escalation required',
    interventions: [
      'Passive ideation documented — "I sometimes wonder if I\'d be better off not here"',
      'Safety plan on file reviewed with patient — patient confirmed understanding',
      'Monitoring: routine (no increase from standard)',
      'Follow-up C-SSRS at next scheduled 1:1 (7/22)',
    ],
    safetyPlanItems: [
      'Warning signs: stress about DUI case, isolation',
      'Internal coping: AA steps (currently working Step 3), prayer',
      'Social distraction: call sponsor Marcus T.',
      'Professional support: David Odom LMFT, on-call staff',
      'Crisis resources: 988, Sunrise on-call',
    ],
    notes: 'Patient disclosed passive ideation during structured C-SSRS screening. Context: stress about pending DUI court date and license suspension. No history of attempts. No active plan. No method. Not imminently at risk. DUI-related shame and hopelessness discussed in session — CBT reframing initiated. Risk reassessment scheduled 7/22.',
  },
  {
    patientId: 'p18',
    assessedDate: '2026-07-14',
    assessedBy: 'Jessica Torres, RN',
    ideationType: 0,
    intensityScore: 0,
    behaviorScore: 0,
    riskLevel: 'Low',
    safetyPlanCompleted: false,
    meansRestrictionCounseled: false,
    clinicianNotified: 'No crisis — standard documentation',
    interventions: ['Routine admission C-SSRS completed — negative for ideation'],
    safetyPlanItems: [],
    notes: 'Routine admission C-SSRS screening. No suicidal ideation reported. No history of suicidal behavior. Safety plan not indicated at this time — patient to be screened weekly per protocol.',
  },
];

const RISK_STYLE: Record<RiskLevel, string> = {
  'Low':      'bg-green-100 text-green-700 border-green-200',
  'Moderate': 'bg-amber-100 text-amber-700 border-amber-200',
  'High':     'bg-red-100 text-red-700 border-red-200',
  'Imminent': 'bg-red-900 text-white border-red-900',
};

const RISK_ICON = {
  'Low':      <CheckCircle className="w-4 h-4" />,
  'Moderate': <AlertTriangle className="w-4 h-4" />,
  'High':     <XCircle className="w-4 h-4" />,
  'Imminent': <AlertTriangle className="w-4 h-4" />,
};

const IDEATION_LABELS = [
  'No ideation',
  'Passive — wish to be dead',
  'Active — non-specific, no plan',
  'Active — with method (no plan)',
  'Active — with plan',
  'Active — with intent to act',
];

const BEHAVIOR_LABELS = [
  'No suicidal behavior',
  'Preparatory behaviors',
  'Aborted or self-interrupted attempt',
  'Interrupted by another person',
  'Actual attempt',
];

const RISK_LEVEL_CRITERIA: Record<RiskLevel, string> = {
  'Low':      'C-SSRS Ideation Types 1-2 (passive ideation), no recent behavior, no history of attempts, modifiable risk factors absent or minimal.',
  'Moderate': 'C-SSRS Ideation Types 2-3 with moderate intensity, or Type 1 with multiple risk factors, or remote history of attempts with low intensity ideation.',
  'High':     'C-SSRS Ideation Types 4-5 (with plan or intent), or recent behavior (Types 1-3), or Ideation Types 2-3 with multiple clinical risk factors.',
  'Imminent': 'C-SSRS behavior score ≥3 (interrupted/actual attempt), or Type 5 ideation with means access — IMMEDIATE intervention required.',
};

const INTERVENTIONS_BY_RISK: Record<RiskLevel, string[]> = {
  'Low':      ['Document in chart', 'Safety plan on file — review with patient', 'Routine monitoring', 'Follow-up C-SSRS at next 1:1'],
  'Moderate': ['Notify counselor and clinical director', 'Update safety plan', 'Increase monitoring (Q1H visual check)', 'Restrict means access', 'Family contact if consent obtained', 'Consider medication evaluation'],
  'High':     ['Notify psychiatrist and clinical director IMMEDIATELY', 'Increase to Q30min safety checks — full visual contact', 'Remove means from room', 'Psychiatric evaluation within 2 hours', 'Document all contacts', 'Consider voluntary 5150 if consent can be obtained', 'Activate psychiatric transfer protocol if deteriorating'],
  'Imminent': ['CALL 911 IMMEDIATELY', 'Maintain 1:1 constant observation', 'Do not leave patient alone', 'Activate psychiatric transfer protocol', 'Notify medical director', 'Contact family'],
};

export function CrisisAssessment({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Dashboard' | 'Assess' | 'Protocol' | 'Debriefing' | 'Resources' | 'Training' | 'Risk Indicators'>('Dashboard');
  const [expandedRecord, setExpandedRecord] = useState<string | null>('p1');
  const [newAssessmentPatient, setNewAssessmentPatient] = useState('p1');
  const [ideationType, setIdeationType] = useState<IdeationType>(0);
  const [behaviorScore, setBehaviorScore] = useState(0);

  const computedRisk = (): RiskLevel => {
    if (behaviorScore >= 3) return 'Imminent';
    if (ideationType >= 4 || behaviorScore >= 1) return 'High';
    if (ideationType >= 2) return 'Moderate';
    return 'Low';
  };

  const highRiskPatients = CSSRS_RECORDS.filter(r => r.riskLevel === 'High' || r.riskLevel === 'Imminent');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Crisis Assessment (C-SSRS)</h1>
          <p className="text-slate text-sm mt-0.5">Columbia Suicide Severity Rating Scale · Safety planning · Risk stratification</p>
        </div>
        <LockedButton locked={readOnly} onClick={() => setTab('Assess')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New C-SSRS Assessment
        </LockedButton>
      </div>

      {highRiskPatients.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-red-800">Active High-Risk Patients</div>
            <div className="text-sm text-red-700 mt-0.5">
              {highRiskPatients.map(r => {
                const p = MOCK_PATIENTS.find(pt => pt.id === r.patientId);
                return `${p?.firstName} ${p?.lastName} (${r.riskLevel} — assessed ${r.assessedDate})`;
              }).join(' · ')}
            </div>
            <div className="text-xs text-red-600 mt-1">All high-risk designations require 30-minute safety checks and clinical director notification.</div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Assessed This Week', value: CSSRS_RECORDS.length, sub: 'C-SSRS documented', color: 'text-navy' },
          { label: 'High / Imminent Risk', value: highRiskPatients.length, sub: 'Enhanced monitoring', color: highRiskPatients.length > 0 ? 'text-red-600' : 'text-green-600' },
          { label: 'Safety Plans Active', value: CSSRS_RECORDS.filter(r => r.safetyPlanCompleted).length, sub: 'Signed by patient', color: 'text-navy' },
          { label: 'Assessment Due', value: MOCK_PATIENTS.length - CSSRS_RECORDS.length, sub: 'Not yet screened', color: (MOCK_PATIENTS.length - CSSRS_RECORDS.length) > 5 ? 'text-amber-600' : 'text-navy' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Dashboard', 'Assess', 'Protocol', 'Debriefing', 'Resources', 'Training', 'Risk Indicators'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Dashboard' && (
        <div className="space-y-3">
          <div className="text-xs text-slate">All C-SSRS assessments on file — sorted by risk level</div>
          {[...CSSRS_RECORDS]
            .sort((a, b) => ['Imminent','High','Moderate','Low'].indexOf(a.riskLevel) - ['Imminent','High','Moderate','Low'].indexOf(b.riskLevel))
            .map(record => {
              const p = MOCK_PATIENTS.find(pt => pt.id === record.patientId);
              if (!p) return null;
              const isExpanded = expandedRecord === record.patientId;

              return (
                <div key={record.patientId} className={`border rounded-xl overflow-hidden ${record.riskLevel === 'High' ? 'border-red-300' : record.riskLevel === 'Moderate' ? 'border-amber-300' : 'border-border'}`}>
                  <div className={`flex items-center gap-4 px-4 py-3 cursor-pointer ${record.riskLevel === 'High' ? 'bg-red-50' : record.riskLevel === 'Moderate' ? 'bg-amber-50/40' : 'bg-white hover:bg-gray-50'}`}
                    onClick={() => setExpandedRecord(isExpanded ? null : record.patientId)}>
                    <div className="w-9 h-9 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">{p.firstName[0]}{p.lastName[0]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <button className="font-bold text-navy hover:text-orange text-sm" onClick={e => { e.stopPropagation(); navigate('PatientDetail', p.id); }}>
                          {p.firstName} {p.lastName}
                        </button>
                        <span className={`flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${RISK_STYLE[record.riskLevel]}`}>
                          {RISK_ICON[record.riskLevel]} {record.riskLevel} Risk
                        </span>
                        <span className="text-xs text-slate">Ideation: <strong>Type {record.ideationType}</strong> — {IDEATION_LABELS[record.ideationType]}</span>
                        {record.safetyPlanCompleted && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3 inline mr-0.5" />Safety Plan</span>}
                      </div>
                      <div className="text-xs text-slate mt-0.5">
                        Assessed {record.assessedDate} by {record.assessedBy}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate" /> : <ChevronDown className="w-4 h-4 text-slate" />}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border px-5 py-4 space-y-4 bg-white">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-slate uppercase mb-2">C-SSRS Scores</div>
                          <div className="space-y-1.5">
                            <div><span className="text-xs text-slate">Ideation Type:</span> <span className="text-sm font-bold text-navy ml-1">{record.ideationType}</span> <span className="text-xs text-slate">— {IDEATION_LABELS[record.ideationType]}</span></div>
                            <div><span className="text-xs text-slate">Intensity Score:</span> <span className="text-sm font-bold text-navy ml-1">{record.intensityScore}/25</span></div>
                            <div><span className="text-xs text-slate">Behavior Score:</span> <span className="text-sm font-bold text-navy ml-1">{record.behaviorScore}</span> <span className="text-xs text-slate">— {BEHAVIOR_LABELS[record.behaviorScore]}</span></div>
                          </div>
                          <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border ${RISK_STYLE[record.riskLevel]}`}>
                            {RISK_ICON[record.riskLevel]}
                            {record.riskLevel} Risk
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate uppercase mb-2">Interventions Completed</div>
                          <div className="space-y-1.5">
                            {record.interventions.map((intervention, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                <span className="text-xs text-navy">{intervention}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-slate">
                            <span className="font-semibold">Clinician Notified:</span> <span className="text-navy">{record.clinicianNotified}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate uppercase mb-2 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Safety Plan Items</div>
                          {record.safetyPlanItems.length > 0 ? (
                            <div className="space-y-1.5">
                              {record.safetyPlanItems.map((item, i) => (
                                <div key={i} className="text-xs text-navy">{i + 1}. {item}</div>
                              ))}
                            </div>
                          ) : <span className="text-xs text-slate italic">No safety plan — low risk, no ideation</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-1">Clinical Notes</div>
                        <p className="text-sm text-navy bg-gray-50 rounded-lg p-3 leading-relaxed">{record.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {tab === 'Assess' && (
        <div className="max-w-3xl space-y-5">
          <div className="card">
            <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient *</label>
            <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={newAssessmentPatient} onChange={e => setNewAssessmentPatient(e.target.value)}>
              {MOCK_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.mrn}</option>)}
            </select>
          </div>

          <div className="card space-y-4">
            <div>
              <h3 className="font-bold text-navy mb-0.5">C-SSRS — Ideation Subscale</h3>
              <p className="text-xs text-slate">Select the HIGHEST ideation type present in the past 30 days (or since last assessment)</p>
            </div>
            {IDEATION_LABELS.map((label, i) => (
              <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${ideationType === i ? (i === 0 ? 'border-green-400 bg-green-50' : i <= 2 ? 'border-amber-400 bg-amber-50' : 'border-red-400 bg-red-50') : 'border-border hover:border-orange/50'}`}>
                <input type="radio" name="ideation" checked={ideationType === i} onChange={() => setIdeationType(i as IdeationType)} className="mt-0.5" />
                <div>
                  <div className="font-semibold text-navy text-sm">Type {i}: {label}</div>
                  <div className="text-xs text-slate mt-0.5">
                    {['No thoughts of suicide or self-harm',
                      '"I wish I were dead" — not thinking about how',
                      'Thinking about suicide but no specific method',
                      'Thinking about suicide WITH a specific method (but no plan to act)',
                      'Thinking about suicide WITH a specific plan',
                      'Thinking about suicide with intent to act — plan to act on thoughts'][i]}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="card space-y-4">
            <div>
              <h3 className="font-bold text-navy mb-0.5">C-SSRS — Behavior Subscale</h3>
              <p className="text-xs text-slate">Select the HIGHEST behavior type that has occurred in the past 3 months</p>
            </div>
            {BEHAVIOR_LABELS.map((label, i) => (
              <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${behaviorScore === i ? (i === 0 ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : 'border-border hover:border-orange/50'}`}>
                <input type="radio" name="behavior" checked={behaviorScore === i} onChange={() => setBehaviorScore(i)} className="mt-0.5" />
                <div>
                  <div className="font-semibold text-navy text-sm">{label}</div>
                </div>
              </label>
            ))}
          </div>

          <div className={`card border-2 ${computedRisk() === 'Low' ? 'border-green-400 bg-green-50' : computedRisk() === 'Moderate' ? 'border-amber-400 bg-amber-50' : computedRisk() === 'High' ? 'border-red-400 bg-red-50' : 'border-red-900 bg-red-100'}`}>
            <div className="flex items-center gap-3 mb-3">
              {RISK_ICON[computedRisk()]}
              <span className={`text-lg font-bold ${RISK_STYLE[computedRisk()].split(' ')[1]}`}>{computedRisk()} Risk</span>
              <span className="text-xs text-slate ml-1">(auto-calculated from C-SSRS scores)</span>
            </div>
            <p className="text-xs text-navy mb-3">{RISK_LEVEL_CRITERIA[computedRisk()]}</p>
            <div className="text-xs font-semibold text-slate uppercase mb-2">Required Interventions for {computedRisk()} Risk:</div>
            {INTERVENTIONS_BY_RISK[computedRisk()].map((intv, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-navy mb-1">
                <CheckCircle className="w-3.5 h-3.5 text-navy shrink-0" />{intv}
              </div>
            ))}
          </div>

          <div className="card space-y-4">
            <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none" placeholder="Clinical notes — document context, precipitating factors, patient statements, clinicians notified, and interventions taken..." />
            <div className="flex gap-3">
              <button onClick={() => setTab('Dashboard')} className="border border-border text-slate rounded-lg px-5 py-2 text-sm">Cancel</button>
              <LockedButton locked={readOnly} className="btn-primary text-sm px-5 py-2">Save Assessment & Generate Safety Plan</LockedButton>
            </div>
          </div>
        </div>
      )}

      {tab === 'Protocol' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-bold text-navy mb-2">Sunrise Recovery Center — Suicide Risk Response Protocol</h3>
            <p className="text-sm text-slate">Per Joint Commission NPSG.15.01.01 and CARF Behavioral Health Standards</p>
          </div>

          {(['Low', 'Moderate', 'High', 'Imminent'] as RiskLevel[]).map(level => (
            <div key={level} className={`card border ${level === 'Imminent' ? 'border-red-900 bg-red-50' : level === 'High' ? 'border-red-300' : level === 'Moderate' ? 'border-amber-300' : 'border-green-300'}`}>
              <div className={`flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg w-fit text-sm font-bold ${RISK_STYLE[level]}`}>
                {RISK_ICON[level]} {level} Risk
              </div>
              <div className="text-xs text-slate mb-2">{RISK_LEVEL_CRITERIA[level]}</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-navy uppercase mb-1.5">Required Interventions</div>
                  {INTERVENTIONS_BY_RISK[level].map((i, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-navy mb-1">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-navy text-white text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>
                      {i}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-semibold text-navy uppercase mb-1.5">Documentation Required</div>
                  {[
                    level === 'Low' ? ['C-SSRS scores in chart', 'Safety plan on file', 'Next assessment date'] :
                    level === 'Moderate' ? ['C-SSRS scores', 'Clinician notification documented', 'Updated safety plan', 'Increased monitoring frequency', 'Family contact if consent'] :
                    level === 'High' ? ['C-SSRS scores + full clinical note', 'Psychiatrist notification with time', 'Psychiatric evaluation note', 'Room check documentation', 'Q30min check log', 'Transfer criteria reviewed'] :
                    ['911 call log', '1:1 observation log', 'Medical director notification', 'Psychiatric transfer paperwork', 'Family notification']
                  ][['Low','Moderate','High','Imminent'].indexOf(level)].map((d, idx) => (
                    <div key={idx} className="text-xs text-navy mb-1">• {d}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="card">
            <h3 className="font-bold text-navy mb-3 flex items-center gap-2"><Phone className="w-4 h-4" />Emergency Contacts & Resources</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: '988 Suicide & Crisis Lifeline', value: 'Call or text 988' },
                { label: 'Vanderbilt Psychiatric ED', value: '(615) 322-2700' },
                { label: 'On-Call MD (Day)', value: 'Dr. Robert Chen — pager 4421' },
                { label: 'On-Call MD (Night)', value: 'Dr. Chen — pager 4421 (24/7)' },
                { label: 'Clinical Director', value: 'Dr. James Carter — pager 4401' },
                { label: 'Psychiatrist On-Call', value: 'Dr. Emma Hughes — pager 4433' },
                { label: 'Hospital Transfer Line', value: '(615) 555-0200 (DON direct)' },
                { label: 'Police / EMS', value: '911' },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-3 p-2 border border-border rounded-lg">
                  <Phone className="w-3.5 h-3.5 text-navy shrink-0" />
                  <div>
                    <div className="text-xs text-slate">{c.label}</div>
                    <div className="font-semibold text-navy text-sm">{c.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Debriefing' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Post-crisis debriefing documentation. Each crisis event requires a clinical debrief within 24 hours per CARF standard QI.4.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Debriefs This Month', value: 4, sub: 'All within 24h requirement', color: 'text-navy' },
              { label: 'Staff Involved', value: 11, sub: 'Unique clinicians debriefed', color: 'text-blue-600' },
              { label: 'Action Items Generated', value: 7, sub: 'Across all debriefs', color: 'text-amber-600' },
              { label: 'Completed Actions', value: 5, sub: '71% follow-through rate', color: 'text-green-600' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          {[
            {
              id: 'DB-004',
              date: '2026-07-17',
              patient: 'James Thornton',
              crisisType: 'Physical Altercation',
              facilitator: 'Dr. James Carter, PhD',
              staffPresent: ['J. Torres, RN', 'D. Odom, LMFT', 'R. Davis, BHT', 'K. Smith, BHT'],
              summary: 'Patient escalated during afternoon group session following a perceived interpersonal conflict with a peer. BHT R. Davis de-escalated effectively using verbal redirection. Security protocols followed. Patient isolated in room 12 and LMFT D. Odom provided immediate 1:1 de-escalation support.',
              precipitants: 'Interpersonal conflict; patient disclosed history of trauma related to similar provocations. Medication compliance was adequate.',
              whatWentWell: 'Rapid staff response (under 2 min). BHT used verbal de-escalation without physical intervention. Clear communication between BHT and nursing.',
              improvement: 'Group composition should be reviewed — two patients with known relational conflict were assigned to the same session. Room 12 should have a panic button installed.',
              actions: [
                { item: 'Review group assignment policy for conflict-adjacent patients', owner: 'S. Jenkins, LPC', due: '2026-07-24', done: true },
                { item: 'Submit work order for Room 12 panic button installation', owner: 'Admin', due: '2026-07-31', done: false },
              ],
            },
            {
              id: 'DB-003',
              date: '2026-07-11',
              patient: 'Samantha Choi',
              crisisType: 'Self-Harm Ideation (SI with Plan)',
              facilitator: 'Dr. James Carter, PhD',
              staffPresent: ['Dr. Robert Chen', 'J. Torres, RN', 'S. Jenkins, LPC', 'A. Patel, RN'],
              summary: 'Patient disclosed active suicidal ideation with a specific plan to nursing staff during evening rounds. Safety protocol activated immediately. Psychiatry evaluated within 30 minutes. Patient placed on 1:1 observation and safety plan updated.',
              precipitants: 'Anniversary of trauma event (patient disclosed July 11 holds significance). Family phone call earlier that day was reported as distressing.',
              whatWentWell: 'Staff correctly identified and escalated within the required 15-minute window. Safety plan was collaboratively developed with patient. Family contact was made appropriately.',
              improvement: 'Trauma anniversary dates should be flagged in the EHR alert system. Initial safety plan lacked concrete coping steps — quality improved on revision.',
              actions: [
                { item: 'Add trauma anniversary flag to patient intake assessment', owner: 'S. Jenkins, LPC', due: '2026-07-18', done: true },
                { item: 'Revise safety plan template to require ≥3 coping strategies', owner: 'Clinical Director', due: '2026-07-25', done: true },
                { item: 'Schedule monthly anniversary date audit for active census', owner: 'Admin', due: '2026-08-01', done: false },
              ],
            },
          ].map(db => (
            <div key={db.id} className="card space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs text-slate">{db.id}</span>
                    <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{db.crisisType}</span>
                  </div>
                  <h3 className="font-semibold text-navy">{db.patient} · Debrief {db.date}</h3>
                  <div className="text-xs text-slate mt-0.5">Facilitated by {db.facilitator} · Attendees: {db.staffPresent.join(', ')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-xs">
                  <div className="font-bold text-slate mb-1">Incident Summary</div>
                  <p className="text-slate leading-relaxed">{db.summary}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-xs">
                  <div className="font-bold text-slate mb-1">Precipitating Factors</div>
                  <p className="text-slate leading-relaxed">{db.precipitants}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-xs">
                  <div className="font-bold text-green-700 mb-1">✓ What Went Well</div>
                  <p className="text-green-800 leading-relaxed">{db.whatWentWell}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-xs">
                  <div className="font-bold text-amber-700 mb-1">↗ Areas for Improvement</div>
                  <p className="text-amber-800 leading-relaxed">{db.improvement}</p>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-navy mb-2">Action Items</div>
                <div className="space-y-1.5">
                  {db.actions.map((a, i) => (
                    <div key={i} className={`flex items-center gap-3 text-xs p-2 rounded-lg ${a.done ? 'bg-green-50' : 'bg-amber-50'}`}>
                      <span className={`text-base ${a.done ? 'text-green-500' : 'text-amber-400'}`}>{a.done ? '✓' : '○'}</span>
                      <span className={`flex-1 ${a.done ? 'text-green-800' : 'text-amber-800'}`}>{a.item}</span>
                      <span className="text-slate">{a.owner}</span>
                      <span className="text-slate">Due {a.due}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${a.done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{a.done ? 'Done' : 'Open'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Resources' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Crisis intervention references, hotline numbers, safe messaging guidelines, and clinical decision aids for frontline staff.</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Crisis Hotlines & Warm Lines</h3>
              <div className="space-y-2.5">
                {[
                  { name: '988 Suicide & Crisis Lifeline', number: 'Call or text 988', note: '24/7 — English & Spanish' },
                  { name: 'Crisis Text Line', number: 'Text HOME to 741741', note: '24/7 text-based support' },
                  { name: 'Veterans Crisis Line', number: '988, Press 1', note: 'Also text 838255' },
                  { name: 'Trans Lifeline', number: '877-565-8860', note: 'Peer support for trans people' },
                  { name: 'SAMHSA National Helpline', number: '800-662-4357', note: 'SUD treatment referral, 24/7' },
                  { name: 'Tennessee Crisis Line', number: '855-274-7471', note: 'TN state crisis line' },
                  { name: 'Metro Nashville Crisis', number: '615-244-7444', note: 'Local mobile crisis team' },
                ].map(h => (
                  <div key={h.name} className="p-2 border border-border rounded-lg">
                    <div className="text-xs font-semibold text-navy">{h.name}</div>
                    <div className="text-xs font-bold text-orange mt-0.5">{h.number}</div>
                    <div className="text-[10px] text-slate mt-0.5">{h.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">C-SSRS Quick Reference</h3>
              <div className="space-y-3">
                <div className="text-xs text-slate">Columbia Suicide Severity Rating Scale — ideation and behavior scoring summary for frontline staff.</div>
                {[
                  { level: 'Level 1 — Passive Ideation', desc: '"I wish I were dead" — no plan or intent. Low risk. Standard monitoring.', color: 'border-l-green-400' },
                  { level: 'Level 2 — Active Ideation (no plan)', desc: 'Thoughts of killing self without method. Safety plan, increase frequency of check-ins.', color: 'border-l-yellow-400' },
                  { level: 'Level 3 — Ideation with Method', desc: 'Specific method considered, no plan or intent. Means restriction, supervisor notification.', color: 'border-l-amber-500' },
                  { level: 'Level 4 — Ideation with Intent', desc: 'Some intention to act on ideation. Urgent psychiatry consult, safety plan, 1:1.', color: 'border-l-orange-500' },
                  { level: 'Level 5 — Ideation with Plan', desc: 'Specific plan with intent. IMMEDIATE psychiatric evaluation, consider hospitalization.', color: 'border-l-red-500' },
                  { level: 'Suicidal Behavior', desc: 'Preparatory acts, interrupted attempt, aborted attempt, or actual attempt. EMERGENCY response.', color: 'border-l-red-900' },
                ].map(r => (
                  <div key={r.level} className={`pl-3 border-l-4 ${r.color}`}>
                    <div className="text-xs font-semibold text-navy">{r.level}</div>
                    <div className="text-[10px] text-slate mt-0.5">{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Safe Messaging Guidelines</h3>
              <div className="text-xs text-slate mb-2">Per SAMHSA / AFSP safe messaging guidelines — for all staff communicating about suicide.</div>
              <div className="space-y-2">
                {[
                  { do: true, text: 'Use person-first language: "person with suicidal thoughts"' },
                  { do: true, text: 'Express concern: "I\'m worried about you" or "I care about your safety"' },
                  { do: true, text: 'Ask directly: "Are you thinking about suicide?" (asking does NOT plant the idea)' },
                  { do: true, text: 'Listen without judgment — give full attention' },
                  { do: true, text: 'Connect to care immediately if someone is in imminent danger' },
                  { do: false, text: 'Avoid: "committed suicide" — say "died by suicide"' },
                  { do: false, text: 'Avoid: detailed descriptions of method or location' },
                  { do: false, text: 'Avoid: minimizing ("other people have it worse")' },
                  { do: false, text: 'Avoid: shock or judgment ("how could you think that?")' },
                  { do: false, text: 'Avoid: promising confidentiality you cannot keep' },
                ].map(r => (
                  <div key={r.text} className={`flex items-start gap-2 text-xs p-1.5 rounded ${r.do ? 'text-green-800 bg-green-50' : 'text-red-800 bg-red-50'}`}>
                    <span className="font-bold shrink-0 mt-0.5">{r.do ? '✓' : '✗'}</span>
                    <span>{r.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                <strong>Mandatory Reporting:</strong> Tennessee law requires reporting imminent danger to self or others (TCA § 33-6-401). Document all crisis responses in the patient's chart within 2 hours.
              </div>
            </div>
          </div>
        </div>
      )}
      {tab === 'Training' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Crisis intervention training compliance — staff certification status, drill logs, and upcoming training requirements.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Staff CPI Certified', value: '91%', color: 'text-green-600', sub: '21 of 23 clinical staff' },
              { label: 'Expires Within 60d', value: 3, color: 'text-amber-600', sub: 'Renewal required' },
              { label: 'Drills Completed (YTD)', value: 6, color: 'text-blue-600', sub: 'Target: 8/year' },
              { label: 'De-escalation Competency', value: '100%', color: 'text-teal-600', sub: 'Annual re-certification' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Crisis Training Certification Matrix</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Staff Member</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">CPI</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">QPR Suicide</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">MANDT</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'T. Jackson, CADC', cpi: true, qpr: true, mandt: false, exp: '2027-02', ok: true },
                    { name: 'A. Brooks, LPC', cpi: true, qpr: true, mandt: true, exp: '2026-09', ok: false },
                    { name: 'M. Rivera, MS', cpi: true, qpr: true, mandt: false, exp: '2026-10', ok: false },
                    { name: 'J. Torres, RN', cpi: true, qpr: true, mandt: true, exp: '2027-01', ok: true },
                    { name: 'K. Santos, RN', cpi: true, qpr: false, mandt: false, exp: '2026-09', ok: false },
                    { name: 'D. Williams, CADC', cpi: false, qpr: true, mandt: false, exp: 'Not certified', ok: false },
                  ].map(s => (
                    <tr key={s.name} className={`hover:bg-gray-50 ${!s.ok ? 'bg-amber-50/50' : ''}`}>
                      <td className="py-2 font-medium text-navy">{s.name}</td>
                      <td className="py-2 text-center">{s.cpi ? <span className="text-green-500">✓</span> : <span className="text-red-400">✗</span>}</td>
                      <td className="py-2 text-center">{s.qpr ? <span className="text-green-500">✓</span> : <span className="text-red-400">✗</span>}</td>
                      <td className="py-2 text-center">{s.mandt ? <span className="text-green-500">✓</span> : <span className="text-slate">—</span>}</td>
                      <td className="py-2 text-center">
                        <span className={`text-[10px] font-semibold ${!s.ok ? 'text-amber-700' : 'text-slate'}`}>{s.exp}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Upcoming Training &amp; Drills</h3>
              <div className="space-y-2 text-xs">
                {[
                  { event: 'CPI Re-certification — A. Brooks, M. Rivera, K. Santos', date: '2026-08-15', type: 'Certification', urgent: true },
                  { event: 'QPR Gatekeeper Training (new cohort)', date: '2026-08-01', type: 'Training', urgent: false },
                  { event: 'Active Threat / Code Orange Drill', date: '2026-08-22', type: 'Drill', urgent: false },
                  { event: 'Suicide Safety Planning Workshop (all clinical)', date: '2026-09-05', type: 'Workshop', urgent: false },
                  { event: 'MANDT Refresher (optional)', date: '2026-09-19', type: 'Training', urgent: false },
                ].map(e => (
                  <div key={e.event} className={`border rounded p-2.5 ${e.urgent ? 'border-amber-300 bg-amber-50' : 'border-border'}`}>
                    <div className="flex items-start justify-between">
                      <span className={`font-medium ${e.urgent ? 'text-amber-800' : 'text-navy'}`}>{e.event}</span>
                      <span className={`ml-2 shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${e.type === 'Certification' ? 'bg-red-100 text-red-700' : e.type === 'Drill' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-slate'}`}>{e.type}</span>
                    </div>
                    <div className="text-slate mt-0.5">{e.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Risk Indicators' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Evidence-based suicide and self-harm risk factor reference — clinical indicators, static vs. dynamic factors, and documentation requirements for comprehensive crisis assessment.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Suicide Risk Factors — Static vs. Dynamic</h3>
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-slate uppercase text-[10px] tracking-wider border-b border-border pb-1 mb-2">Static Factors (Historical — Cannot Change)</div>
                {[
                  'Prior suicide attempt(s) — strongest single predictor',
                  'Family history of suicide or completed suicide',
                  'History of trauma or childhood abuse/neglect',
                  'Chronic, severe psychiatric illness (e.g., bipolar I, schizophrenia)',
                  'Traumatic brain injury (TBI)',
                ].map(f => <div key={f} className="flex gap-2"><span className="text-red-400 shrink-0 mt-0.5">●</span><span className="text-navy">{f}</span></div>)}
                <div className="font-semibold text-slate uppercase text-[10px] tracking-wider border-b border-border pb-1 mt-3 mb-2">Dynamic Factors (Modifiable — Intervention Targets)</div>
                {[
                  'Current suicidal ideation — frequency, intensity, duration',
                  'Active plan with access to means (especially firearms)',
                  'Hopelessness (stronger predictor than depression alone)',
                  'Current substance use / intoxication',
                  'Acute psychosocial stressor (job loss, relationship, legal)',
                  'Social isolation / lack of connectedness',
                  'Active agitation or insomnia',
                  'Recent discharge from psychiatric inpatient care (<90 days)',
                ].map(f => <div key={f} className="flex gap-2"><span className="text-amber-400 shrink-0 mt-0.5">●</span><span className="text-navy">{f}</span></div>)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Protective Factors — Reduce Risk</h3>
                <div className="space-y-1.5 text-xs">
                  {[
                    'Reasons for living — children, pets, religious beliefs, future plans',
                    'Strong social support network and sense of belonging',
                    'Access to mental health / SUD treatment and engagement',
                    'Problem-solving ability and coping skills',
                    'Fear of death or opposition to suicide (moral/religious)',
                    'Restricted access to lethal means (firearms secured)',
                    'Therapeutic alliance with treatment provider',
                  ].map(f => <div key={f} className="flex gap-2"><span className="text-green-500 shrink-0 mt-0.5">●</span><span className="text-navy">{f}</span></div>)}
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Warning Signs — Acute Escalation</h3>
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  {[
                    { sign: 'Giving away prized possessions', sev: 'High' },
                    { sign: 'Saying goodbye or "people would be better off without me"', sev: 'High' },
                    { sign: 'Sudden calmness after prolonged depression (resolved ambivalence)', sev: 'High' },
                    { sign: 'Researching methods online or acquiring means', sev: 'High' },
                    { sign: 'Increasing isolation from family and peers', sev: 'Moderate' },
                    { sign: 'Escalating alcohol/drug use', sev: 'Moderate' },
                    { sign: 'Expressing hopelessness about the future', sev: 'Moderate' },
                  ].map(s => (
                    <div key={s.sign} className="flex items-center gap-2 border border-border rounded p-1.5">
                      <span className={`shrink-0 text-[9px] font-bold px-1 py-0.5 rounded ${s.sev === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{s.sev}</span>
                      <span className="text-navy">{s.sign}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900">
            <strong>Documentation Requirement:</strong> All crisis assessments must include risk stratification (Low / Moderate / High / Imminent), rationale for level, protective factors documented, safety planning status, and attending physician/supervisor co-signature within 24h per CARF and TN state licensure standards.
          </div>
        </div>
      )}
    </div>
  );
}
