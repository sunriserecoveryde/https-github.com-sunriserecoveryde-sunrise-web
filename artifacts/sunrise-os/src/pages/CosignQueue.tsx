import React, { useState } from 'react';
import { Screen } from '../App';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

type NoteType = 'BIRP' | 'DAP' | 'Psychiatric Eval' | 'Group Note' | 'Nursing Note' | 'Med Order';

interface CosignItem {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  program: string;
  noteDate: string;
  noteType: NoteType;
  author: string;
  authorRole: string;
  supervisor: string;
  daysWaiting: number;
  priority: 'Urgent' | 'Routine';
  preview: string;
  format?: 'BIRP' | 'DAP';
  content?: {
    behavior?: string;
    intervention?: string;
    response?: string;
    plan?: string;
    data?: string;
    assessment?: string;
  };
}

const QUEUE: CosignItem[] = [
  {
    id: 'cs1', patientId: 'p1', patientName: 'Marcus Webb', mrn: 'MRN-83921', program: 'Residential',
    noteDate: '2026-07-17', noteType: 'BIRP', author: 'Sarah Jenkins, LPC', authorRole: 'Primary Counselor',
    supervisor: 'James Carter, Clinical Director', daysWaiting: 1, priority: 'Urgent',
    format: 'BIRP',
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
    noteDate: '2026-07-15', noteType: 'Psychiatric Eval', author: 'Dr. Allen Hughes', authorRole: 'Psychiatrist',
    supervisor: 'Dr. Emily Stone, Medical Director', daysWaiting: 3, priority: 'Urgent',
    preview: 'Comprehensive psychiatric evaluation. Adjusted Seroquel. Assessed for SI — denied active ideation.',
    content: {
      data: 'Client is a 34-year-old female presenting with Severe Alcohol Use Disorder and co-occurring Borderline Personality Disorder. Current medications: Seroquel 100mg QHS, Lamictal 100mg BID. Reports mood instability, restricting food intake over past 24 hours, and emotional dysregulation following confrontational phone call with mother.',
      assessment: 'No active suicidal or homicidal ideation. No auditory/visual hallucinations. Insight fair. Judgment impaired. Recommend increasing Seroquel to 200mg QHS for sleep and mood stabilization. Continue Lamictal. Nutritional consult ordered. Individual session with primary counselor focused on DBT distress tolerance today.',
    }
  },
  {
    id: 'cs3', patientId: 'p7', patientName: 'Brian Kowalski', mrn: 'MRN-27641', program: 'PHP',
    noteDate: '2026-07-17', noteType: 'DAP', author: 'David Odom, LMFT', authorRole: 'Primary Counselor',
    supervisor: 'James Carter, Clinical Director', daysWaiting: 1, priority: 'Routine',
    format: 'DAP',
    preview: 'Client engaged in discharge planning. Identified aftercare resources. Family meeting scheduled.',
    content: {
      data: 'Client attended morning process group and individual session. Participated actively in relapse prevention group. Mood 7/10. Craving 2/10. Denies urge to use. Discharge in 5 days.',
      assessment: 'Client progressing well toward discharge. Aftercare plan largely complete. Wife engaged in family session — communication skills improving. One AA sponsor identified. Outpatient therapy referral to Dr. Patel submitted.',
      plan: 'Continue current level of care. Schedule final family meeting 7/20. Ensure Vivitrol injection scheduled for discharge day. Send clinical summary to outpatient provider by 7/22.',
    }
  },
  {
    id: 'cs4', patientId: 'p3', patientName: 'James Thornton', mrn: 'MRN-62841', program: 'Residential',
    noteDate: '2026-07-16', noteType: 'Nursing Note', author: 'Michael Boyd, RN', authorRole: 'Nurse',
    supervisor: 'Jessica Torres, RN (Charge)', daysWaiting: 2, priority: 'Urgent',
    preview: 'COWS score 9 at 6:00 AM. MAT dose adjustment documented. Physician notified.',
    content: {
      data: 'Client assessed at 0600. COWS score 9 (moderate withdrawal). Symptoms: diaphoresis, GI cramping, yawning, pupil dilation, mild tremor. VS: BP 138/88, HR 98, Temp 98.9°F, RR 16. Currently on Suboxone 8mg BID. Client ambulatory, oriented x4.',
      assessment: 'COWS score elevated from baseline of 6. Physician (Dr. Chen) notified at 0615. Order received to increase Suboxone to 12mg BID. Client tolerated dose well. COWS reassessment at 1000: score reduced to 5. Comfort measures: cool cloth, electrolyte drink offered.',
      plan: 'Reassess COWS q4h. Report any score >12 to physician immediately. Comfort measures as tolerated. Encourage oral hydration.',
    }
  },
];

const NOTE_TYPE_COLORS: Record<NoteType, string> = {
  'BIRP': 'bg-blue-100 text-blue-700',
  'DAP': 'bg-purple-100 text-purple-700',
  'Psychiatric Eval': 'bg-red-100 text-red-700',
  'Group Note': 'bg-green-100 text-green-700',
  'Nursing Note': 'bg-amber-100 text-amber-700',
  'Med Order': 'bg-orange/20 text-orange',
};

const PRIORITY_COLORS = {
  Urgent: 'bg-red-50 border-red-200',
  Routine: 'bg-gray-50 border-gray-200',
};

export function CosignQueue({ navigate }: Props) {
  const [selected, setSelected] = useState<CosignItem | null>(QUEUE[0]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [comments, setComments] = useState('');

  const pending = QUEUE.filter(q => !completedIds.includes(q.id));
  const urgent = pending.filter(q => q.priority === 'Urgent').length;

  const handleApprove = (id: string) => {
    setCompletedIds(prev => [...prev, id]);
    const next = pending.find(q => q.id !== id);
    setSelected(next || null);
    setComments('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Co-sign Queue</h1>
          <p className="text-slate text-sm mt-0.5">Notes and orders awaiting supervisor co-signature</p>
        </div>
        <div className="flex gap-3">
          <div className="card px-4 py-2 text-center">
            <div className="text-2xl font-bold text-red-600">{urgent}</div>
            <div className="text-xs text-slate">Urgent</div>
          </div>
          <div className="card px-4 py-2 text-center">
            <div className="text-2xl font-bold text-navy">{pending.length}</div>
            <div className="text-xs text-slate">Total Pending</div>
          </div>
          <div className="card px-4 py-2 text-center">
            <div className="text-2xl font-bold text-green-600">{completedIds.length}</div>
            <div className="text-xs text-slate">Co-signed Today</div>
          </div>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-lg font-semibold text-navy">Queue Clear</div>
          <div className="text-slate text-sm mt-1">All notes have been co-signed. Nice work.</div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-6">
          {/* Queue List */}
          <div className="col-span-2 space-y-2">
            {pending.map(item => (
              <div
                key={item.id}
                onClick={() => { setSelected(item); setComments(''); }}
                className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${PRIORITY_COLORS[item.priority]} ${selected?.id === item.id ? 'ring-2 ring-orange' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={e => { e.stopPropagation(); navigate('PatientDetail', item.patientId); }} className="font-semibold text-navy hover:text-orange text-sm">{item.patientName}</button>
                      <span className="text-xs text-slate font-mono">{item.mrn}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${NOTE_TYPE_COLORS[item.noteType]}`}>{item.noteType}</span>
                      {item.priority === 'Urgent' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Urgent</span>}
                    </div>
                    <div className="text-xs text-slate mt-1">{item.author} · {item.noteDate}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-bold ${item.daysWaiting >= 2 ? 'text-red-600' : 'text-amber-600'}`}>{item.daysWaiting}d waiting</div>
                  </div>
                </div>
                <p className="text-xs text-slate mt-2 line-clamp-2">{item.preview}</p>
              </div>
            ))}
          </div>

          {/* Note Detail */}
          {selected && !completedIds.includes(selected.id) && (
            <div className="col-span-3 space-y-4">
              <div className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-navy">{selected.patientName}</h2>
                    <p className="text-xs text-slate">{selected.mrn} · {selected.program}</p>
                  </div>
                  <button onClick={() => navigate('PatientDetail', selected.patientId)} className="text-xs text-orange hover:underline">View Full Chart →</button>
                </div>

                <div className="flex items-center gap-3 mt-3 flex-wrap text-sm">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${NOTE_TYPE_COLORS[selected.noteType]}`}>{selected.noteType}</span>
                  <span className="text-slate">{selected.noteDate}</span>
                  <span className="text-slate">Author: <span className="font-medium text-navy">{selected.author}</span> ({selected.authorRole})</span>
                </div>
                <div className="text-xs text-slate mt-1">Requested co-sign from: <span className="font-medium text-navy">{selected.supervisor}</span></div>

                {/* Note Content */}
                <div className="mt-4 border border-border rounded-lg divide-y divide-border overflow-hidden">
                  {selected.format === 'BIRP' && selected.content && (
                    <>
                      {[
                        { label: 'B — Behavior', text: selected.content.behavior },
                        { label: 'I — Intervention', text: selected.content.intervention },
                        { label: 'R — Response', text: selected.content.response },
                        { label: 'P — Plan', text: selected.content.plan },
                      ].map(sec => (
                        <div key={sec.label} className="p-3">
                          <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">{sec.label}</div>
                          <p className="text-sm text-navy">{sec.text}</p>
                        </div>
                      ))}
                    </>
                  )}
                  {selected.format === 'DAP' && selected.content && (
                    <>
                      {[
                        { label: 'D — Data', text: selected.content.data },
                        { label: 'A — Assessment', text: selected.content.assessment },
                        { label: 'P — Plan', text: selected.content.plan },
                      ].map(sec => (
                        <div key={sec.label} className="p-3">
                          <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">{sec.label}</div>
                          <p className="text-sm text-navy">{sec.text}</p>
                        </div>
                      ))}
                    </>
                  )}
                  {!selected.format && selected.content && (
                    <>
                      {selected.content.data && <div className="p-3"><div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Clinical Data</div><p className="text-sm text-navy">{selected.content.data}</p></div>}
                      {selected.content.assessment && <div className="p-3"><div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Assessment & Plan</div><p className="text-sm text-navy">{selected.content.assessment}</p></div>}
                      {selected.content.plan && <div className="p-3"><div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Plan</div><p className="text-sm text-navy">{selected.content.plan}</p></div>}
                    </>
                  )}
                </div>

                {/* Co-sign Actions */}
                <div className="mt-4 border-t border-border pt-4">
                  <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Co-sign Response</div>
                  <textarea
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    placeholder="Optional supervisor comments or addendum..."
                    className="w-full border border-border rounded-lg p-3 text-sm min-h-[72px] resize-none focus:outline-none focus:ring-2 focus:ring-orange/50"
                  />
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleApprove(selected.id)} className="btn-primary text-sm px-6 py-2 flex-1">✓ Co-sign &amp; Approve</button>
                    <button className="btn-outline text-sm px-4 py-2 text-amber-700 border-amber-300 hover:bg-amber-50">Request Revision</button>
                    <button onClick={() => navigate('PatientDetail', selected.patientId)} className="btn-outline text-sm px-4 py-2">Open Chart</button>
                  </div>
                  <p className="text-xs text-slate mt-2">By co-signing, you attest that you have reviewed this note and it meets clinical documentation standards.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
