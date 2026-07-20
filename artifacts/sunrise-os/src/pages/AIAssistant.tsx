import React, { useState } from 'react';
import {
  Sparkles, AlertTriangle, CheckCircle, XCircle, Edit3, Clock,
  FileText, ShieldAlert, Brain, MessageSquare, ListChecks,
  ChevronDown, ChevronUp, User, RefreshCw, ThumbsUp, Info,
  Lock, ClipboardList
} from 'lucide-react';
import { Screen } from '../App';
import { useAuth } from '../context/AuthContext';

interface Props {
  navigate: (s: Screen) => void;
}

type ReviewStatus = 'idle' | 'generating' | 'pending' | 'approved' | 'discarded' | 'editing';

interface AIOutput {
  id: string;
  type: string;
  prompt: string;
  content: string;
  status: ReviewStatus;
  generatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  editedContent?: string;
}

const MOCK_NOTE = `Subjective: Patient reports feeling "better than yesterday" with decreased anxiety and improved sleep (5–6 hrs). Denies active cravings. States family support has improved following last week's family session.

Objective: Patient cooperative and engaged. Affect appropriate, mood euthymic. CIWA-Ar score 4 (mild). Vitals stable. MAR reviewed — no missed doses.

Assessment: Patient demonstrating sustained engagement in residential programming. Withdrawal stabilizing. Psychosocial stressors remain (housing, employment) but patient verbalizing healthy coping strategies.

Plan:
• Continue current medication regimen (Suboxone 8mg SL BID)
• Individual therapy session scheduled Monday
• Referral placed to vocational counselor
• Family session planned Thursday — focus on communication and relapse prevention roles
• Monitor CIWA daily; notify physician if score ≥ 8`;

const MOCK_RISK = `**Risk Stratification: HIGH**

Key Risk Factors Identified:
• Opioid use disorder, severe — multiple prior treatment episodes (3)
• Recent overdose event (4 weeks prior to admission)
• Co-occurring MDD — currently undertreated
• Limited social support network; primary contact estranged
• Housing instability post-discharge — no confirmed placement
• History of AMA discharge from prior facility

Protective Factors:
• Motivated for change (Stages of Change: Preparation/Action)
• Engaged in current treatment, attending all groups
• Strong therapeutic alliance with primary counselor

Recommended Actions:
• Elevate to high-risk monitoring protocol
• Daily check-in with primary counselor until housing is secured
• Initiate aftercare planning this week — prioritize sober living referral
• Coordinate with case manager re: benefits enrollment (Medicaid, SNAP)
• Discuss naltrexone/Vivitrol as discharge bridge`;

const MOCK_TREATMENT = `**Individualized Treatment Plan Suggestions**

Problem #1: Opioid Use Disorder, Severe
• Goal: Maintain abstinence and engagement in MAT for minimum 90 days
• Objectives: Attend all scheduled Suboxone appointments; pass weekly UDS; verbalize 3 coping strategies for cravings
• Interventions: MAT continuation, CBT individual sessions (2x/week), SMART Recovery group

Problem #2: Major Depressive Disorder
• Goal: Reduce PHQ-9 score from 18 to <10 within 60 days
• Objectives: Complete medication trial (current: Sertraline 50mg); daily mood tracking in journal
• Interventions: Psychiatric follow-up in 2 weeks, behavioral activation exercises, peer support group

Problem #3: Housing Instability
• Goal: Secure stable housing prior to discharge
• Objectives: Submit 3 sober living applications within 7 days; meet with case manager weekly
• Interventions: Case management, financial counseling referral, community resource linkage

Discharge Criteria:
• CIWA-Ar < 3 for 5 consecutive days
• Confirmed aftercare placement
• Outpatient treatment engagement confirmed
• Emergency contact updated and informed`;

const MOCK_QA = `Based on clinical guidelines and current evidence:

**Suboxone (buprenorphine/naloxone) and QTc prolongation:**

Buprenorphine has a low risk for QTc prolongation compared to methadone. Current SAMHSA and ASAM guidelines do not require routine ECG monitoring for patients on standard buprenorphine dosing.

However, caution is warranted when:
• Patient is on other QTc-prolonging medications (e.g., certain antipsychotics, fluoroquinolones)
• Pre-existing cardiac conditions or electrolyte imbalances are present
• Doses exceed 24mg/day

**Recommendation for this patient:** Given the current regimen (8mg BID = 16mg/day), routine ECG is not required unless clinical indicators are present. Document rationale in the chart.

*Sources: ASAM Clinical Practice Guideline on Buprenorphine (2023), SAMHSA TIP 63*`;

type Tab = 'Draft Note' | 'Risk Summary' | 'Treatment Plan' | 'Clinical Q&A' | 'Review Queue';

const TABS: Tab[] = ['Draft Note', 'Risk Summary', 'Treatment Plan', 'Clinical Q&A', 'Review Queue'];

const TAB_ICONS: Record<Tab, React.ElementType> = {
  'Draft Note': FileText,
  'Risk Summary': ShieldAlert,
  'Treatment Plan': ListChecks,
  'Clinical Q&A': MessageSquare,
  'Review Queue': Brain,
};

const MOCK_OUTPUTS: Record<string, string> = {
  'Draft Note': MOCK_NOTE,
  'Risk Summary': MOCK_RISK,
  'Treatment Plan': MOCK_TREATMENT,
  'Clinical Q&A': MOCK_QA,
};

const MOCK_PROMPTS: Record<string, string> = {
  'Draft Note': 'Draft a SOAP progress note for patient Marcus Webb (Day 12 of residential, OUD, CIWA-Ar 4, attending all groups)',
  'Risk Summary': 'Summarize discharge risk factors for patient Diane Torres — OUD severe, 3 prior treatments, recent overdose, housing unstable',
  'Treatment Plan': 'Generate individualized treatment plan suggestions for Marcus Webb — OUD + MDD, PHQ-9 score 18',
  'Clinical Q&A': 'Does Suboxone cause QTc prolongation? What monitoring is required?',
};

export function AIAssistant({ navigate }: Props) {
  const { currentStaff } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Draft Note');
  const [statuses, setStatuses] = useState<Record<string, ReviewStatus>>({
    'Draft Note': 'idle',
    'Risk Summary': 'idle',
    'Treatment Plan': 'idle',
    'Clinical Q&A': 'idle',
  });
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [approvalLog, setApprovalLog] = useState<AIOutput[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const staffName = currentStaff
    ? `${currentStaff.firstName} ${currentStaff.lastName}`
    : 'Demo Clinician';

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const startGenerate = (tab: string) => {
    setStatuses(s => ({ ...s, [tab]: 'generating' }));
    setTimeout(() => setStatuses(s => ({ ...s, [tab]: 'pending' })), 2200);
  };

  const approveOutput = (tab: Tab) => {
    const item: AIOutput = {
      id: `${tab}-${Date.now()}`,
      type: tab,
      prompt: MOCK_PROMPTS[tab],
      content: editValues[tab] ?? MOCK_OUTPUTS[tab],
      status: 'approved',
      generatedAt: now(),
      approvedBy: staffName,
      approvedAt: now(),
    };
    setApprovalLog(l => [item, ...l]);
    setStatuses(s => ({ ...s, [tab]: 'approved' }));
  };

  const discardOutput = (tab: string) => {
    setStatuses(s => ({ ...s, [tab]: 'discarded' }));
  };

  const resetTab = (tab: string) => {
    setStatuses(s => ({ ...s, [tab]: 'idle' }));
    setEditValues(e => { const n = { ...e }; delete n[tab]; return n; });
  };

  const pendingCount = Object.values(statuses).filter(s => s === 'pending' || s === 'editing').length;

  const renderTabContent = (tab: Tab) => {
    const status = statuses[tab];
    const mockContent = MOCK_OUTPUTS[tab];
    const editVal = editValues[tab] ?? mockContent;

    if (status === 'idle') {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <div className="w-16 h-16 rounded-2xl bg-purple/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-purple" />
          </div>
          <div className="text-center max-w-md">
            <h3 className="text-lg font-semibold text-navy mb-2">
              {tab === 'Draft Note' && 'AI Progress Note Drafter'}
              {tab === 'Risk Summary' && 'AI Risk Stratification Summary'}
              {tab === 'Treatment Plan' && 'AI Treatment Plan Suggestions'}
              {tab === 'Clinical Q&A' && 'AI Clinical Reference Q&A'}
            </h3>
            <p className="text-slate text-sm mb-1">
              {tab === 'Draft Note' && 'Generate a structured SOAP note from patient data. A clinician must review and approve before saving to the chart.'}
              {tab === 'Risk Summary' && 'Synthesize risk and protective factors from the patient record. All output requires clinical sign-off before documentation.'}
              {tab === 'Treatment Plan' && 'Suggest evidence-based treatment plan goals and interventions. Clinician edits and approval are mandatory before any plan is activated.'}
              {tab === 'Clinical Q&A' && 'Ask a clinical question grounded in ASAM, SAMHSA, and evidence-based SUD guidelines. Always verify before applying to patient care.'}
            </p>
            <p className="text-xs text-slate-light bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-3 inline-block">
              <strong>HITL Policy:</strong> All AI output must be reviewed and approved by a licensed clinician before use.
            </p>
          </div>
          <div className="w-full max-w-lg bg-slate-50 border border-border rounded-xl p-4">
            <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-2">Sample Prompt</label>
            <p className="text-sm text-navy-mid italic">&ldquo;{MOCK_PROMPTS[tab]}&rdquo;</p>
          </div>
          <button
            onClick={() => startGenerate(tab)}
            className="flex items-center gap-2 bg-purple text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-purple/90 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Generate AI Draft
          </button>
        </div>
      );
    }

    if (status === 'generating') {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple/10 flex items-center justify-center animate-pulse">
            <Brain className="w-7 h-7 text-purple" />
          </div>
          <p className="text-slate font-medium text-sm">Generating AI draft…</p>
          <p className="text-xs text-slate-light">Output will require your review before it can be used.</p>
        </div>
      );
    }

    if (status === 'approved') {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-navy mb-1">Approved &amp; Filed</h3>
            <p className="text-sm text-slate">Approved by <strong>{staffName}</strong> at {now()}. Output added to the Review Queue audit log.</p>
          </div>
          <button onClick={() => resetTab(tab)} className="text-sm text-purple hover:underline font-medium mt-2">
            Generate another draft
          </button>
        </div>
      );
    }

    if (status === 'discarded') {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-slate" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-navy mb-1">Draft Discarded</h3>
            <p className="text-sm text-slate">The AI output was discarded and will not be used or stored.</p>
          </div>
          <button onClick={() => resetTab(tab)} className="text-sm text-purple hover:underline font-medium mt-2">
            Start a new draft
          </button>
        </div>
      );
    }

    // pending or editing
    return (
      <div className="space-y-4">
        {/* HITL mandatory review banner */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800">AI-Generated Content — Human Review Required</p>
            <p className="text-xs text-amber-700 mt-0.5">
              This output has <strong>not</strong> been verified by a clinician. Do not act on, document, or share this content
              until a licensed staff member reviews and approves it. Approval creates an auditable record.
            </p>
          </div>
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        </div>

        {/* AI Output */}
        <div className="bg-white border-2 border-purple/20 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 bg-purple/5 px-4 py-2.5 border-b border-purple/10">
            <Sparkles className="w-4 h-4 text-purple" />
            <span className="text-xs font-bold text-purple uppercase tracking-wider">AI Draft — Pending Review</span>
            <span className="ml-auto text-[10px] text-slate-light flex items-center gap-1">
              <Clock className="w-3 h-3" /> Generated {now()}
            </span>
          </div>

          {status === 'editing' ? (
            <textarea
              className="w-full p-4 text-sm text-navy font-mono leading-relaxed min-h-[280px] resize-y border-0 outline-none"
              value={editVal}
              onChange={e => setEditValues(v => ({ ...v, [tab]: e.target.value }))}
            />
          ) : (
            <div className="p-4 text-sm text-navy leading-relaxed whitespace-pre-wrap font-mono min-h-[200px]">
              {mockContent}
            </div>
          )}
        </div>

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => approveOutput(tab)}
            className="flex items-center gap-2 bg-success text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-success/90 transition-colors"
          >
            <ThumbsUp className="w-4 h-4" />
            Approve &amp; Use
          </button>
          <button
            onClick={() => setStatuses(s => ({ ...s, [tab]: status === 'editing' ? 'pending' : 'editing' }))}
            className="flex items-center gap-2 bg-white border border-border text-navy px-5 py-2 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            {status === 'editing' ? 'Preview Edit' : 'Edit Before Saving'}
          </button>
          <button
            onClick={() => discardOutput(tab)}
            className="flex items-center gap-2 text-slate hover:text-critical text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Discard
          </button>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-light bg-slate-50 border border-border px-3 py-1.5 rounded-lg">
            <User className="w-3.5 h-3.5" />
            Reviewing as: <strong className="text-slate">{staffName}</strong>
          </div>
        </div>

        {/* Prompt context */}
        <div className="flex items-start gap-2 bg-slate-50 border border-border rounded-lg px-3 py-2">
          <Info className="w-3.5 h-3.5 text-slate-light mt-0.5 shrink-0" />
          <p className="text-xs text-slate-light">
            <strong>Prompt used:</strong> {MOCK_PROMPTS[tab]}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Sunrise AI</h1>
            <p className="text-sm text-slate">Clinical AI Copilot — Human-in-the-Loop required for all outputs</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-lg">
          <ShieldAlert className="w-4 h-4" />
          HITL Enforced
        </div>
      </div>

      {/* Policy card */}
      <div className="bg-white border border-border rounded-xl p-4 flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-purple/10 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5 text-purple" />
        </div>
        <div>
          <p className="text-sm font-semibold text-navy mb-0.5">Human-in-the-Loop (HITL) Policy</p>
          <p className="text-xs text-slate leading-relaxed">
            All AI-generated content in Sunrise OS requires explicit review and approval by a licensed clinician before it can be
            used, saved to any patient record, or shared. No AI output is automatically applied. Every approval is timestamped
            and logged for audit. This system is a <em>decision-support tool only</em> — clinical judgment always takes precedence.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto no-scrollbar">
          {TABS.map(tab => {
            const Icon = TAB_ICONS[tab];
            const isActive = activeTab === tab;
            const isPending = tab === 'Review Queue' ? false : (statuses[tab] === 'pending' || statuses[tab] === 'editing');
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors relative ${
                  isActive
                    ? 'border-purple text-purple bg-purple/5'
                    : 'border-transparent text-slate hover:text-navy hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab}
                {tab === 'Review Queue' && pendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {pendingCount}
                  </span>
                )}
                {isPending && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'Review Queue' ? (
            <div className="space-y-4">
              {/* Pending items */}
              {(Object.entries(statuses) as [Tab, ReviewStatus][])
                .filter(([, s]) => s === 'pending' || s === 'editing')
                .map(([tab]) => (
                  <div key={tab} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-900">{tab} — Awaiting Review</p>
                      <p className="text-xs text-amber-700 truncate">{MOCK_PROMPTS[tab]}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab(tab)}
                      className="text-xs text-amber-800 border border-amber-300 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-lg font-medium transition-colors"
                    >
                      Review Now
                    </button>
                  </div>
                ))}

              {/* Approval log */}
              {approvalLog.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate uppercase tracking-wider mb-3 mt-2">Approved This Session</h3>
                  <div className="space-y-3">
                    {approvalLog.map(item => (
                      <div key={item.id} className="border border-border rounded-xl overflow-hidden">
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                          onClick={() => setExpandedItems(e => ({ ...e, [item.id]: !e[item.id] }))}
                        >
                          <CheckCircle className="w-5 h-5 text-success shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-navy">{item.type}</p>
                            <p className="text-xs text-slate truncate">{item.prompt}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-light shrink-0">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.approvedBy}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.approvedAt}</span>
                            {expandedItems[item.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </button>
                        {expandedItems[item.id] && (
                          <div className="px-4 pb-4 border-t border-border bg-slate-50">
                            <pre className="text-xs text-navy font-mono leading-relaxed whitespace-pre-wrap mt-3 max-h-48 overflow-y-auto">
                              {item.content}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingCount === 0 && approvalLog.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate">
                  <ClipboardList className="w-10 h-10 text-slate-light" />
                  <p className="text-sm font-medium">No items pending review</p>
                  <p className="text-xs text-slate-light">Generate a draft from any tab to start a HITL review workflow.</p>
                </div>
              )}
            </div>
          ) : (
            renderTabContent(activeTab)
          )}
        </div>
      </div>
    </div>
  );
}
