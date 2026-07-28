import React, { useState } from 'react';
import { Screen } from '../App';
import { LockedButton } from '../components/common/LockedButton';
import { getRolesWithEditAccess } from '../data/mockRoles';
import { useDemoStore, type PendingDoc } from '../store/demoStore';
import {
  AlertTriangle, CheckCircle, Clock, Flag, Send, Calendar,
  RotateCcw, ChevronRight,
} from 'lucide-react';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type NoteType = 'BIRP' | 'DAP' | 'Psychiatric Eval' | 'Group Note' | 'Nursing Note' | 'Med Order';

interface StaticCosignItem {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  program: string;
  noteDate: string;
  noteType: NoteType;
  author: string;
  authorId: string;
  authorRole: string;
  supervisor: string;
  daysWaiting: number;
  priority: 'Urgent' | 'Routine';
  preview: string;
  format?: 'BIRP' | 'DAP' | 'SOAP' | 'GIRP';
  content?: {
    behavior?: string;
    intervention?: string;
    response?: string;
    plan?: string;
    data?: string;
    assessment?: string;
  };
}

const STATIC_QUEUE: StaticCosignItem[] = [
  {
    id: 'cs1', patientId: 'p1', patientName: 'Marcus Webb', mrn: 'MRN-83921', program: 'Residential',
    noteDate: '2026-07-17', noteType: 'BIRP', author: 'Sarah Jenkins, LCPC', authorId: 'jenkins',
    authorRole: 'Primary Counselor', supervisor: 'James S. Collins III, Clinical Director',
    daysWaiting: 1, priority: 'Urgent', format: 'BIRP',
    preview: 'Client verbalized high AMA risk during individual session. Safety planning completed.',
    content: {
      behavior: 'Client presented visibly agitated at start of session. Disclosed strong urge to leave treatment AMA after phone call with employer. Stated: "They\'re going to fire me if I\'m not back by Monday."',
      intervention: 'Utilized motivational interviewing to explore ambivalence. Assisted client in writing employer letter through EAP. Reviewed FMLA protections. Completed updated AMA safety plan with client signature.',
      response: 'Client mood shifted from 3/10 to 6/10 over session. Agreed to remain through planned discharge date. Verbalized understanding of consequences of leaving early.',
      plan: 'Monitor AMA risk daily. Coordinate with BHT for check-ins every 4 hours. EAP follow-up with HR contact tomorrow. RN to administer Suboxone as scheduled.',
    }
  },
  {
    id: 'cs2', patientId: 'p2', patientName: 'Samantha Choi', mrn: 'MRN-74563', program: 'Residential',
    noteDate: '2026-07-15', noteType: 'Psychiatric Eval', author: 'Dr. Allen Hughes', authorId: 'hughes',
    authorRole: 'Psychiatrist', supervisor: 'Dr. Emily Stone, Medical Director',
    daysWaiting: 3, priority: 'Urgent',
    preview: 'Comprehensive psychiatric evaluation. Adjusted Seroquel. Assessed for SI — denied active ideation.',
    content: {
      data: 'Client is a 34-year-old female presenting with Severe Alcohol Use Disorder and co-occurring Borderline Personality Disorder. Current medications: Seroquel 100mg QHS, Lamictal 100mg BID. Reports mood instability, restricting food intake over past 24 hours, and emotional dysregulation following confrontational phone call with mother.',
      assessment: 'No active suicidal or homicidal ideation. No auditory/visual hallucinations. Insight fair. Judgment impaired. Recommend increasing Seroquel to 200mg QHS for sleep and mood stabilization. Continue Lamictal. Nutritional consult ordered. Individual session with primary counselor focused on DBT distress tolerance today.',
    }
  },
  {
    id: 'cs3', patientId: 'p7', patientName: 'Brian Kowalski', mrn: 'MRN-27641', program: 'PHP',
    noteDate: '2026-07-17', noteType: 'DAP', author: 'David Odom, LCADC', authorId: 'odom',
    authorRole: 'Primary Counselor', supervisor: 'James S. Collins III, Clinical Director',
    daysWaiting: 1, priority: 'Routine', format: 'DAP',
    preview: 'Client engaged in discharge planning. Identified aftercare resources. Family meeting scheduled.',
    content: {
      data: 'Client attended morning process group and individual session. Participated actively in relapse prevention group. Mood 7/10. Craving 2/10. Denies urge to use. Discharge in 5 days.',
      assessment: 'Client progressing well toward discharge. Aftercare plan largely complete. Wife engaged in family session — communication skills improving. One AA sponsor identified. Outpatient therapy referral to Dr. Patel submitted.',
      plan: 'Continue current level of care. Schedule final family meeting 7/20. Ensure Vivitrol injection scheduled for discharge day. Send clinical summary to outpatient provider by 7/22.',
    }
  },
  {
    id: 'cs4', patientId: 'p3', patientName: 'James Thornton', mrn: 'MRN-62841', program: 'Residential',
    noteDate: '2026-07-16', noteType: 'Nursing Note', author: 'Michael Boyd, RN', authorId: 'boyd',
    authorRole: 'Nurse', supervisor: 'Jessica Torres, RN (Charge)',
    daysWaiting: 2, priority: 'Urgent',
    preview: 'COWS score 9 at 6:00 AM. MAT dose adjustment documented. Physician notified.',
    content: {
      data: 'Client assessed at 0600. COWS score 9 (moderate withdrawal). Symptoms: diaphoresis, GI cramping, yawning, pupil dilation, mild tremor. VS: BP 138/88, HR 98, Temp 98.9°F, RR 16. Currently on Suboxone 8mg BID. Client ambulatory, oriented x4.',
      assessment: 'COWS score elevated from baseline of 6. Physician (Dr. Chen) notified at 0615. Order received to increase Suboxone to 12mg BID. Client tolerated dose well. COWS reassessment at 1000: score reduced to 5. Comfort measures: cool cloth, electrolyte drink offered.',
      plan: 'Reassess COWS q4h. Report any score >12 to physician immediately. Comfort measures as tolerated. Encourage oral hydration.',
    }
  },
];

const NOTE_TYPE_COLORS: Record<string, string> = {
  'BIRP': 'bg-blue-100 text-blue-700',
  'DAP': 'bg-purple-100 text-purple-700',
  'Psychiatric Eval': 'bg-red-100 text-red-700',
  'Group Note': 'bg-green-100 text-green-700',
  'Nursing Note': 'bg-amber-100 text-amber-700',
  'Med Order': 'bg-orange-100 text-orange-700',
};

const PRIORITY_BORDER = {
  Urgent: 'bg-red-50 border-red-200',
  Routine: 'bg-gray-50 border-gray-200',
};

function hoursWaiting(submittedAt: string): number {
  return Math.round((Date.now() - new Date(submittedAt).getTime()) / 3_600_000);
}

export function CosignQueue({ navigate, readOnly }: Props) {
  const editRoles = getRolesWithEditAccess('CosignQueue');
  const {
    state, approvePendingDoc, returnForCorrection, assignDeadline,
    addAuditEntry, isDeficiencyFlagged,
  } = useDemoStore();

  // ── Merge static + live pending docs ───────────────────────────────────────
  const liveItems = state.pendingDocs;

  const [cosignTab, setCosignTab] = useState<'Queue' | 'Analytics' | 'Supervision Notes' | 'Compliance Report' | 'Timeout Alerts' | 'Supervisor Directory'>('Queue');

  // Static queue local approval/return state
  const [staticCompleted, setStaticCompleted] = useState<string[]>([]);
  const [selected, setSelected] = useState<StaticCosignItem | PendingDoc | null>(STATIC_QUEUE[0]);
  const [comments, setComments] = useState('');

  // Return for Correction modal state
  const [returnModalId, setReturnModalId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');

  // Assign Deadline modal state
  const [deadlineModalId, setDeadlineModalId] = useState<string | null>(null);
  const [deadlineValue, setDeadlineValue] = useState('');

  const staticPending = STATIC_QUEUE.filter(q => !staticCompleted.includes(q.id));
  const allPending = [...staticPending, ...liveItems];
  const urgentCount = allPending.filter(q => q.priority === 'Urgent').length;
  const coSignedToday = staticCompleted.length;

  function isStaticItem(item: StaticCosignItem | PendingDoc): item is StaticCosignItem {
    return 'daysWaiting' in item;
  }

  function handleApproveStatic(id: string) {
    const item = STATIC_QUEUE.find(q => q.id === id);
    if (item) {
      addAuditEntry({ staffName: 'Supervisor', action: 'Co-signed', entity: item.noteType, detail: `${item.patientName} — ${item.noteType} approved` });
    }
    setStaticCompleted(prev => [...prev, id]);
    const next = staticPending.find(q => q.id !== id) ?? liveItems[0] ?? null;
    setSelected(next || null);
    setComments('');
  }

  function handleApproveLive(id: string) {
    const item = liveItems.find(d => d.id === id);
    if (item) {
      addAuditEntry({ staffName: 'Supervisor', action: 'Co-signed', entity: item.noteType, detail: `${item.patientName} — ${item.noteType} approved` });
    }
    approvePendingDoc(id);
    const next = allPending.find(q => q.id !== id) ?? null;
    setSelected(next || null);
    setComments('');
  }

  function handleApprove(item: StaticCosignItem | PendingDoc) {
    if (isStaticItem(item)) handleApproveStatic(item.id);
    else handleApproveLive(item.id);
  }

  function openReturnModal(id: string) {
    setReturnModalId(id);
    setReturnReason('');
  }

  function confirmReturn() {
    if (!returnModalId) return;
    const staticItem = STATIC_QUEUE.find(q => q.id === returnModalId);
    if (staticItem) {
      addAuditEntry({ staffName: 'Supervisor', action: 'Returned for Correction', entity: staticItem.noteType, detail: returnReason || 'No reason given' });
      // Static items just get removed from pending for demo
      setStaticCompleted(prev => [...prev, returnModalId]);
    } else {
      returnForCorrection(returnModalId, 'Supervisor', returnReason || 'No reason provided');
      addAuditEntry({ staffName: 'Supervisor', action: 'Returned for Correction', entity: 'Document', detail: returnReason });
    }
    const next = allPending.find(q => q.id !== returnModalId) ?? null;
    setSelected(next || null);
    setReturnModalId(null);
    setReturnReason('');
    setComments('');
  }

  function openDeadlineModal(id: string) {
    setDeadlineModalId(id);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setDeadlineValue(tomorrow.toISOString().slice(0, 16));
  }

  function confirmDeadline() {
    if (!deadlineModalId || !deadlineValue) return;
    const staticItem = STATIC_QUEUE.find(q => q.id === deadlineModalId);
    if (!staticItem) {
      assignDeadline(deadlineModalId, new Date(deadlineValue).toISOString());
      addAuditEntry({ staffName: 'Supervisor', action: 'Assigned Deadline', entity: 'Document', detail: `Deadline: ${deadlineValue}` });
    }
    setDeadlineModalId(null);
  }

  function getDeficiency(item: StaticCosignItem | PendingDoc): boolean {
    if (isStaticItem(item)) return false;
    return isDeficiencyFlagged(item.authorId);
  }

  function getCorrectionCount(item: StaticCosignItem | PendingDoc): number {
    if (isStaticItem(item)) return 0;
    return item.correctionCount;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Co-sign Queue</h1>
          <p className="text-slate text-sm mt-0.5">Notes and orders awaiting supervisor co-signature</p>
        </div>
        <div className="flex gap-3">
          <div className="card px-4 py-2 text-center">
            <div className="text-2xl font-bold text-red-600">{urgentCount}</div>
            <div className="text-xs text-slate">Urgent</div>
          </div>
          <div className="card px-4 py-2 text-center">
            <div className="text-2xl font-bold text-navy">{allPending.length}</div>
            <div className="text-xs text-slate">Total Pending</div>
          </div>
          <div className="card px-4 py-2 text-center">
            <div className="text-2xl font-bold text-green-600">{coSignedToday}</div>
            <div className="text-xs text-slate">Co-signed Today</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {(['Queue', 'Analytics', 'Supervision Notes', 'Compliance Report', 'Timeout Alerts', 'Supervisor Directory'] as const).map(t => (
          <button key={t} onClick={() => setCosignTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${cosignTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>
            {t === 'Analytics' ? 'Co-sign Analytics' : t}
            {t === 'Queue' && allPending.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{allPending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Queue tab ─────────────────────────────────────────────────────────── */}
      {cosignTab === 'Queue' && (
        <div className="space-y-4">
          {allPending.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-lg font-semibold text-navy">Queue Clear</div>
              <div className="text-slate text-sm mt-1">All notes have been co-signed. Nice work.</div>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-6">
              {/* Queue list */}
              <div className="col-span-2 space-y-2">
                {allPending.map(item => {
                  const deficiency = getDeficiency(item);
                  const corrCount = getCorrectionCount(item);
                  return (
                    <div
                      key={item.id}
                      onClick={() => { setSelected(item); setComments(''); }}
                      className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${PRIORITY_BORDER[item.priority]} ${selected?.id === item.id ? 'ring-2 ring-orange' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={e => { e.stopPropagation(); navigate('PatientDetail', item.patientId); }}
                              className="font-semibold text-navy hover:text-orange text-sm"
                            >
                              {item.patientName}
                            </button>
                            <span className="text-xs text-slate font-mono">{item.mrn}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${NOTE_TYPE_COLORS[item.noteType] ?? 'bg-slate-100 text-slate'}`}>{item.noteType}</span>
                            {item.priority === 'Urgent' && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Urgent</span>
                            )}
                            {deficiency && (
                              <span className="flex items-center gap-0.5 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">
                                <Flag className="w-3 h-3" /> Deficiency Flag
                              </span>
                            )}
                            {corrCount > 0 && !deficiency && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                                {corrCount}× returned
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate mt-1">
                            {item.author} · {isStaticItem(item) ? item.noteDate : item.noteDate}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {isStaticItem(item) ? (
                            <div className={`text-xs font-bold ${item.daysWaiting >= 2 ? 'text-red-600' : 'text-amber-600'}`}>
                              {item.daysWaiting}d waiting
                            </div>
                          ) : (
                            <div className={`text-xs font-bold ${hoursWaiting(item.submittedAt) >= 24 ? 'text-red-600' : 'text-amber-600'}`}>
                              {hoursWaiting(item.submittedAt)}h
                            </div>
                          )}
                          {!isStaticItem(item) && item.deadline && (
                            <div className="text-[10px] text-slate mt-0.5">
                              Due {new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate mt-2 line-clamp-2">{item.preview}</p>
                    </div>
                  );
                })}
              </div>

              {/* Detail pane */}
              {selected && (
                <div className="col-span-3 space-y-4">
                  <div className="card">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-navy">{selected.patientName}</h2>
                        <p className="text-xs text-slate">{selected.mrn} · {selected.program}</p>
                      </div>
                      <button onClick={() => navigate('PatientDetail', selected.patientId)} className="text-xs text-orange hover:underline flex items-center gap-0.5">
                        View Full Chart <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-3 flex-wrap text-sm">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${NOTE_TYPE_COLORS[selected.noteType] ?? 'bg-slate-100 text-slate'}`}>{selected.noteType}</span>
                      <span className="text-slate">{selected.noteDate}</span>
                      <span className="text-slate">Author: <span className="font-medium text-navy">{selected.author}</span> ({selected.authorRole})</span>
                    </div>
                    <div className="text-xs text-slate mt-1">Requested co-sign from: <span className="font-medium text-navy">{selected.supervisor}</span></div>

                    {/* Deficiency flag banner */}
                    {getDeficiency(selected) && (
                      <div className="mt-3 flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                        <Flag className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Repeated Deficiency Flag — </span>
                          This clinician has had 3 or more notes returned for correction within the last 30 days.
                          Consider scheduling a documentation review meeting.
                        </div>
                      </div>
                    )}

                    {/* Correction count badge */}
                    {getCorrectionCount(selected) > 0 && (
                      <div className="mt-2 flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                        <span>This note was returned for correction {getCorrectionCount(selected)} time{getCorrectionCount(selected) > 1 ? 's' : ''}.
                          {!isStaticItem(selected) && selected.lastReturnReason && (
                            <> Last reason: <em>"{selected.lastReturnReason}"</em></>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Note content */}
                    {isStaticItem(selected) && selected.content && (
                      <div className="mt-4 border border-border rounded-lg divide-y divide-border overflow-hidden">
                        {selected.format === 'BIRP' && [
                          { label: 'B — Behavior', text: selected.content.behavior },
                          { label: 'I — Intervention', text: selected.content.intervention },
                          { label: 'R — Response', text: selected.content.response },
                          { label: 'P — Plan', text: selected.content.plan },
                        ].map(sec => sec.text ? (
                          <div key={sec.label} className="p-3">
                            <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">{sec.label}</div>
                            <p className="text-sm text-navy">{sec.text}</p>
                          </div>
                        ) : null)}
                        {selected.format === 'DAP' && [
                          { label: 'D — Data', text: selected.content.data },
                          { label: 'A — Assessment', text: selected.content.assessment },
                          { label: 'P — Plan', text: selected.content.plan },
                        ].map(sec => sec.text ? (
                          <div key={sec.label} className="p-3">
                            <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">{sec.label}</div>
                            <p className="text-sm text-navy">{sec.text}</p>
                          </div>
                        ) : null)}
                        {!selected.format && (
                          <div>
                            {selected.content.data && <div className="p-3"><div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Clinical Data</div><p className="text-sm text-navy">{selected.content.data}</p></div>}
                            {selected.content.assessment && <div className="p-3"><div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Assessment &amp; Plan</div><p className="text-sm text-navy">{selected.content.assessment}</p></div>}
                          </div>
                        )}
                      </div>
                    )}
                    {!isStaticItem(selected) && (
                      <div className="mt-4 border border-border rounded-lg p-3 bg-gray-50">
                        <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Document Preview</div>
                        <p className="text-sm text-navy">{selected.preview}</p>
                        <div className="text-[10px] text-slate mt-2">Submitted {new Date(selected.submittedAt).toLocaleString()}</div>
                      </div>
                    )}

                    {/* Co-sign actions */}
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Supervisor Response</div>
                      <textarea
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        placeholder="Optional supervisor comments or addendum…"
                        className="w-full border border-border rounded-lg p-3 text-sm min-h-[68px] resize-none focus:outline-none focus:ring-2 focus:ring-orange/50"
                      />
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <LockedButton
                          locked={readOnly}
                          editRoles={editRoles}
                          onClick={() => !readOnly && handleApprove(selected)}
                          className="btn-primary text-sm px-5 py-2 flex items-center gap-1.5 flex-1"
                        >
                          <CheckCircle className="w-4 h-4" /> Co-sign &amp; Approve
                        </LockedButton>
                        <LockedButton
                          locked={readOnly}
                          editRoles={editRoles}
                          onClick={() => openReturnModal(selected.id)}
                          className="flex items-center gap-1.5 text-sm px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors font-semibold"
                        >
                          <RotateCcw className="w-4 h-4" /> Return for Correction
                        </LockedButton>
                        <LockedButton
                          locked={readOnly}
                          editRoles={editRoles}
                          onClick={() => openDeadlineModal(selected.id)}
                          className="flex items-center gap-1.5 text-sm px-4 py-2 border border-border text-slate rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                        >
                          <Calendar className="w-4 h-4" /> Assign Deadline
                        </LockedButton>
                        <button onClick={() => navigate('PatientDetail', selected.patientId)} className="btn-outline text-sm px-4 py-2">
                          Open Chart
                        </button>
                      </div>
                      <p className="text-xs text-slate mt-2">By co-signing, you attest that you have reviewed this note and it meets clinical documentation standards.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Analytics tab ───────────────────────────────────────────────────────── */}
      {cosignTab === 'Analytics' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Supervisor co-sign performance metrics — turnaround times, compliance rates, and volume by clinician.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Avg Turnaround', value: '4.2h', color: 'text-green-600', sub: 'Target: ≤8h' },
              { label: 'On-Time Co-sign Rate', value: '94%', color: 'text-green-600', sub: 'Notes signed within 24h' },
              { label: 'Late Co-signs (>24h)', value: 3, color: 'text-amber-600', sub: 'Last 30 days' },
              { label: 'Total This Month', value: 187, color: 'text-navy', sub: 'All note types' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Volume by Clinician (Rolling 30 Days)</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    {['Clinician', 'Notes', 'Avg Turn', 'Late', 'On-Time %', 'Flag'].map(h => (
                      <th key={h} className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'Sarah Jenkins, LCPC', notes: 52, avg: '3.1h', late: 0, pct: 100, flag: false },
                    { name: 'David Odom, LCADC', notes: 44, avg: '5.8h', late: 2, pct: 95, flag: false },
                    { name: 'Marcus Chen, CAC-AD', notes: 38, avg: '4.4h', late: 1, pct: 97, flag: false },
                    { name: 'Kevin Walsh, CAC-AD', notes: 22, avg: '9.1h', late: 3, pct: 86, flag: true },
                  ].map(r => (
                    <tr key={r.name} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-navy">{r.name}</td>
                      <td className="py-2 text-center text-slate">{r.notes}</td>
                      <td className="py-2 text-center text-slate">{r.avg}</td>
                      <td className="py-2 text-center text-red-600 font-semibold">{r.late}</td>
                      <td className="py-2 text-center">
                        <span className={`font-bold ${r.pct >= 95 ? 'text-green-600' : r.pct >= 85 ? 'text-amber-600' : 'text-red-600'}`}>{r.pct}%</span>
                      </td>
                      <td className="py-2 text-center">
                        {r.flag ? <Flag className="w-3.5 h-3.5 text-red-500 mx-auto" /> : <span className="text-green-600 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <strong>Action Needed (Kevin Walsh, CAC-AD):</strong> 3 notes pending &gt;24h — oldest is 38h. Documentation review meeting recommended per repeat-deficiency protocol.
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Turnaround by Note Type</h3>
              <div className="space-y-3">
                {[
                  { type: 'Individual Session Note', avg: '3.8h', vol: 74, target: '≤8h', pct: 100 },
                  { type: 'Group Note', avg: '5.1h', vol: 56, target: '≤8h', pct: 98 },
                  { type: 'Nursing Progress Note', avg: '1.2h', vol: 31, target: '≤4h', pct: 100 },
                  { type: 'Medical Note (Physician)', avg: '2.4h', vol: 14, target: '≤24h', pct: 100 },
                  { type: 'Psychiatric Evaluation', avg: '8.6h', vol: 8, target: '≤24h', pct: 88 },
                  { type: 'Discharge Summary', avg: '18.2h', vol: 4, target: '≤120h', pct: 100 },
                ].map(n => (
                  <div key={n.type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate font-medium">{n.type} <span className="text-[10px]">(n={n.vol})</span></span>
                      <span className="font-bold text-navy">{n.avg} avg</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${n.pct >= 95 ? 'bg-green-500' : n.pct >= 85 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${n.pct}%` }} />
                    </div>
                    <div className="text-[10px] text-slate mt-0.5">Target: {n.target} · {n.pct}% on time</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Supervision Notes tab ──────────────────────────────────────────────── */}
      {cosignTab === 'Supervision Notes' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Clinical supervision session notes — tracks supervisory meetings, case consultations, and competency development for staff requiring oversight.</div>
          <div className="card space-y-4">
            {[
              {
                supervisee: 'A. Brooks, LCPC-A', supervisor: 'Dr. R. Okafor, LCPC-S', date: '2026-07-15', type: 'Individual Supervision',
                caseload: 8, topics: 'Reviewed trauma-informed approaches with dual-diagnosis patient (rm 3A). Discussed countertransference with AMA-risk patient. CBT homework compliance strategies.',
                plan: 'Brooks to complete 2-hour MI refresher by Jul 30. Shared exemplary progress note from peers as model. Next session: July 29.',
                rating: 'On Track', rColor: 'bg-green-100 text-green-700',
              },
              {
                supervisee: 'D. Williams, CAC-AD-II', supervisor: 'A. Simms, LCADC', date: '2026-07-14', type: 'Group Supervision',
                caseload: 10, topics: 'Group reviewed documentation standards for treatment plan objectives. Case presentation: chronic relapse patient with ambivalence about MAT.',
                plan: 'Williams to revise two treatment plans flagged in peer review by 7/22. Schedule make-up session for missed July 1 group.',
                rating: 'Needs Support', rColor: 'bg-amber-100 text-amber-700',
              },
              {
                supervisee: 'T. Jackson, CAC-AD', supervisor: 'A. Simms, LCADC', date: '2026-07-12', type: 'Individual Supervision',
                caseload: 11, topics: 'High-performing supervisee — discussed pathway to LCPC licensure. Case consultation on patient with complex trauma and SUD.',
                plan: "Jackson pursuing LCPC-A application; supervisor endorsement signed. Exploring group co-facilitation opportunities.",
                rating: 'Exemplary', rColor: 'bg-teal-100 text-teal-700',
              },
            ].map(s => (
              <div key={s.supervisee} className="border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-navy">{s.supervisee}</span>
                    <span className="text-slate text-xs ml-2">— supervised by {s.supervisor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate">{s.date} · {s.type}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.rColor}`}>{s.rating}</span>
                  </div>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="font-semibold text-navy mb-1">Topics Covered</div>
                    <div className="text-slate leading-relaxed">{s.topics}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-navy mb-1">Plan &amp; Follow-Up</div>
                    <div className="text-slate leading-relaxed">{s.plan}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Compliance Report tab ──────────────────────────────────────────────── */}
      {cosignTab === 'Compliance Report' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Cosignature compliance — state licensure and CARF documentation requirements.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Cosign Rate (30d)', value: '96%', color: 'text-green-600', sub: 'Of all notes requiring cosign' },
              { label: 'Avg Time to Cosign', value: '18h', color: 'text-blue-600', sub: 'From submission to approval' },
              { label: 'Notes Overdue (>72h)', value: 3, color: 'text-amber-600', sub: 'Currently awaiting cosignature' },
              { label: 'Provisional Staff', value: 2, color: 'text-navy', sub: 'Require 100% cosign rate' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Cosignature Compliance by Clinician — Last 30 Days</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Clinician', 'Credential', 'Submitted', 'On-Time', 'Rate', 'Avg Wait', 'Overdue', 'Deficiency'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'T. Jackson', cred: 'CAC-AD (Provisional)', submitted: 48, ontime: 47, rate: '98%', wait: '12h', overdue: 1, flag: false },
                  { name: 'M. Rivera', cred: 'MS, Intern', submitted: 36, ontime: 33, rate: '92%', wait: '24h', overdue: 2, flag: false },
                  { name: 'K. Walsh', cred: 'CAC-AD (Provisional)', submitted: 22, ontime: 19, rate: '86%', wait: '9.1h', overdue: 3, flag: true },
                ].map(r => (
                  <tr key={r.name} className={`hover:bg-gray-50 ${r.flag ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-3 py-2 font-medium text-navy">{r.name}</td>
                    <td className="px-3 py-2 text-slate text-[11px]">{r.cred}</td>
                    <td className="px-3 py-2 text-center">{r.submitted}</td>
                    <td className="px-3 py-2 text-center">{r.ontime}</td>
                    <td className="px-3 py-2 text-center font-bold">
                      <span className={parseFloat(r.rate) >= 95 ? 'text-green-600' : parseFloat(r.rate) >= 85 ? 'text-amber-600' : 'text-red-600'}>{r.rate}</span>
                    </td>
                    <td className="px-3 py-2 text-center text-slate">{r.wait}</td>
                    <td className="px-3 py-2 text-center">
                      {r.overdue > 0 ? <span className="font-bold text-amber-600">{r.overdue}</span> : <span className="text-green-600">0</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.flag ? <Flag className="w-3.5 h-3.5 text-red-500 mx-auto" /> : <span className="text-green-600 text-[10px]">Clear</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Timeout Alerts tab ────────────────────────────────────────────────── */}
      {cosignTab === 'Timeout Alerts' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Documents approaching or past the co-sign deadline — state licensure requires co-sign within 24h for supervised clinicians in residential settings.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Past Deadline', value: 3, color: 'text-red-600', sub: '>24h without co-sign' },
              { label: 'Due Within 4h', value: 4, color: 'text-amber-600', sub: 'Approaching deadline' },
              { label: 'Due Within 8h', value: 6, color: 'text-blue-600', sub: 'Monitor closely' },
              { label: 'On-Time Rate (30d)', value: '91%', color: 'text-green-600', sub: 'Target: ≥95%' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Documents Past or Approaching Co-sign Deadline</h3>
            <div className="space-y-2">
              {[
                { author: 'Kevin Walsh, CAC-AD', patient: 'Linda Foster', type: 'Individual Note', submitted: '38h ago', status: 'PAST DUE', color: 'border-red-300 bg-red-50' },
                { author: 'Kevin Walsh, CAC-AD', patient: 'Thomas Reed', type: 'Group Note', submitted: '25h ago', status: 'PAST DUE', color: 'border-red-300 bg-red-50' },
                { author: 'M. Rivera, Intern', patient: 'Carlos Ruiz', type: 'Individual Note', submitted: '20h ago', status: 'PAST DUE', color: 'border-red-300 bg-red-50' },
                { author: 'T. Jackson, CAC-AD', patient: 'Angie Simmons', type: 'Individual Note', submitted: '21h ago', status: 'Due in 3h', color: 'border-amber-300 bg-amber-50' },
                { author: 'M. Rivera, Intern', patient: 'Felix Grant', type: 'BIRP Note', submitted: '18h ago', status: 'Due in 6h', color: 'border-blue-200 bg-blue-50' },
              ].map((d, i) => (
                <div key={i} className={`flex items-center justify-between border rounded-lg px-4 py-3 text-sm ${d.color}`}>
                  <div>
                    <span className="font-semibold text-navy">{d.patient}</span>
                    <span className="text-slate ml-2 text-xs">— {d.type} by {d.author}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate">Submitted {d.submitted}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.status.startsWith('PAST') ? 'bg-red-200 text-red-800' : d.status.startsWith('Due in 3') ? 'bg-amber-200 text-amber-800' : 'bg-blue-100 text-blue-700'}`}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Supervisor Directory tab ───────────────────────────────────────────── */}
      {cosignTab === 'Supervisor Directory' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Supervisors authorized to co-sign clinical documentation at Sunrise Recovery.</div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'James S. Collins III', cred: 'CAC-AD, Clinical Director', scope: 'All counseling notes, treatment plans, ASAM assessments', queue: 4, onTime: '100%' },
              { name: 'Dr. Emily Stone', cred: 'MD, Medical Director', scope: 'Physician orders, psychiatric evaluations, medical notes', queue: 2, onTime: '98%' },
              { name: 'Jessica Torres', cred: 'RN, CARN, Charge Nurse', scope: 'Nursing notes, MAR verifications, COWS/CIWA protocols', queue: 1, onTime: '100%' },
              { name: 'Dr. Aisha Simmons', cred: 'LCPC-S, Clinical Supervisor', scope: 'LCPC-A notes, provisional counselor co-signs', queue: 3, onTime: '95%' },
            ].map(s => (
              <div key={s.name} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-navy">{s.name}</div>
                    <div className="text-xs text-slate">{s.cred}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{s.queue} in queue</div>
                    <div className="text-[10px] text-green-600 mt-0.5">{s.onTime} on-time</div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-slate">
                  <span className="font-semibold text-navy">Scope: </span>{s.scope}
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="text-xs px-3 py-1.5 border border-border rounded hover:bg-gray-50 text-slate font-medium flex items-center gap-1">
                    <Send className="w-3 h-3" /> Route Note
                  </button>
                  <button className="text-xs px-3 py-1.5 border border-border rounded hover:bg-gray-50 text-slate font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> View Queue
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Return for Correction modal ────────────────────────────────────────── */}
      {returnModalId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-navy text-lg mb-1 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" /> Return for Correction
            </h3>
            <p className="text-sm text-slate mb-4">
              Provide specific feedback so the clinician can address the issue. This will be logged and tracked for compliance.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1.5">Reason for Return <span className="text-red-500">*</span></label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-orange/40"
                onChange={e => setReturnReason(e.target.value === 'other' ? '' : e.target.value)}
                defaultValue=""
              >
                <option value="">Select a reason…</option>
                <option value="Incomplete documentation — missing required fields">Incomplete documentation — missing required fields</option>
                <option value="Clinical content requires revision — safety plan incomplete">Clinical content requires revision — safety plan incomplete</option>
                <option value="Medication details inaccurate or missing">Medication details inaccurate or missing</option>
                <option value="Note does not reflect clinical presentation described verbally">Note does not reflect clinical presentation described verbally</option>
                <option value="Objective/measurable language required for goals">Objective/measurable language required for goals</option>
                <option value="Signature or date missing">Signature or date missing</option>
                <option value="other">Other (type below)</option>
              </select>
              <textarea
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                placeholder="Add specific details or additional instructions…"
                rows={3}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange/40"
              />
            </div>
            {(() => {
              const item = [...STATIC_QUEUE, ...liveItems].find(q => q.id === returnModalId);
              const isLive = !item || !('daysWaiting' in item);
              const authorId = isLive && item && !('daysWaiting' in item) ? (item as PendingDoc).authorId : '';
              const defFlag = authorId ? isDeficiencyFlagged(authorId) : false;
              return defFlag ? (
                <div className="mb-3 flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                  <Flag className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span><strong>Note:</strong> This clinician already has a repeated-deficiency flag. Returning this note will be their 4th+ return in 30 days — consider escalating to a formal performance review.</span>
                </div>
              ) : null;
            })()}
            <div className="flex gap-2">
              <button
                onClick={confirmReturn}
                disabled={!returnReason.trim()}
                className="flex-1 btn-primary text-sm py-2 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" /> Return to Clinician
              </button>
              <button onClick={() => { setReturnModalId(null); setReturnReason(''); }} className="px-4 py-2 border border-border rounded-lg text-sm text-slate hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Deadline modal ──────────────────────────────────────────────── */}
      {deadlineModalId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="font-bold text-navy text-lg mb-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> Assign Co-sign Deadline
            </h3>
            <p className="text-sm text-slate mb-4">Set a specific deadline for this co-signature. The clinician will be notified if the deadline is approaching.</p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1.5">Deadline Date &amp; Time</label>
              <input
                type="datetime-local"
                value={deadlineValue}
                onChange={e => setDeadlineValue(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={confirmDeadline}
                disabled={!deadlineValue}
                className="flex-1 btn-primary text-sm py-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Set Deadline
              </button>
              <button onClick={() => setDeadlineModalId(null)} className="px-4 py-2 border border-border rounded-lg text-sm text-slate hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
