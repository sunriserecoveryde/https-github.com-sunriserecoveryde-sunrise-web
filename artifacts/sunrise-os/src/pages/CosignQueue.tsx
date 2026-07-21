import React, { useState } from 'react';
import { Screen } from '../App';
import { LockedButton } from '../components/common/LockedButton';
import { getRolesWithEditAccess } from '../data/mockRoles';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

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
    supervisor: 'James S. Collins III, Clinical Director', daysWaiting: 1, priority: 'Urgent',
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
    supervisor: 'James S. Collins III, Clinical Director', daysWaiting: 1, priority: 'Routine',
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

export function CosignQueue({ navigate, readOnly }: Props) {
  const editRoles = getRolesWithEditAccess('CosignQueue');
  const [selected, setSelected] = useState<CosignItem | null>(QUEUE[0]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [comments, setComments] = useState('');
  const [cosignTab, setCosignTab] = useState<'Queue' | 'Analytics' | 'Supervision Notes' | 'Compliance Report' | 'Timeout Alerts' | 'Supervisor Directory'>('Queue');

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

      <div className="flex gap-1 border-b border-border">
        {(['Queue', 'Analytics', 'Supervision Notes', 'Compliance Report', 'Timeout Alerts', 'Supervisor Directory'] as const).map(t => (
          <button key={t} onClick={() => setCosignTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${cosignTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t === 'Analytics' ? 'Co-sign Analytics' : t}</button>
        ))}
      </div>

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
                    <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Clinician</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Notes</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Avg Turnaround</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Late</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">On-Time %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'Sarah Jenkins, LPC', notes: 52, avg: '3.1h', late: 0, pct: 100 },
                    { name: 'David Odom, LMFT', notes: 44, avg: '5.8h', late: 2, pct: 95 },
                    { name: 'Marcus Chen, CAC-AD', notes: 38, avg: '4.4h', late: 1, pct: 97 },
                    { name: 'Priya Nair, MSW', notes: 31, avg: '6.2h', late: 0, pct: 100 },
                    { name: 'Kevin Walsh, CAC-AD', notes: 22, avg: '9.1h', late: 3, pct: 86 },
                  ].map(r => (
                    <tr key={r.name} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-navy">{r.name}</td>
                      <td className="py-2 text-center text-slate">{r.notes}</td>
                      <td className="py-2 text-center text-slate">{r.avg}</td>
                      <td className="py-2 text-center text-red-600 font-semibold">{r.late}</td>
                      <td className="py-2 text-center">
                        <span className={`font-bold text-xs ${r.pct >= 95 ? 'text-green-600' : r.pct >= 85 ? 'text-amber-600' : 'text-red-600'}`}>{r.pct}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

              {[{ name: 'Kevin Walsh, CAC-AD', issue: '3 notes pending >24h — oldest is 38h. Supervisor follow-up recommended.' }].map(a => (
                <div key={a.name} className="mt-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <strong>Action Needed ({a.name}):</strong> {a.issue}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {cosignTab === 'Queue' && (
      <div className="space-y-4">
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
                  {selected.format === 'BIRP' && selected.content &&
                    [
                      { label: 'B — Behavior', text: selected.content.behavior },
                      { label: 'I — Intervention', text: selected.content.intervention },
                      { label: 'R — Response', text: selected.content.response },
                      { label: 'P — Plan', text: selected.content.plan },
                    ].map(sec => (
                      <div key={sec.label} className="p-3">
                        <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">{sec.label}</div>
                        <p className="text-sm text-navy">{sec.text}</p>
                      </div>
                    ))
                  }
                  {selected.format === 'DAP' && selected.content &&
                    [
                      { label: 'D — Data', text: selected.content.data },
                      { label: 'A — Assessment', text: selected.content.assessment },
                      { label: 'P — Plan', text: selected.content.plan },
                    ].map(sec => (
                      <div key={sec.label} className="p-3">
                        <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">{sec.label}</div>
                        <p className="text-sm text-navy">{sec.text}</p>
                      </div>
                    ))
                  }
                  {!selected.format && selected.content && (
                    <div>
                      {selected.content.data && <div className="p-3"><div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Clinical Data</div><p className="text-sm text-navy">{selected.content.data}</p></div>}
                      {selected.content.assessment && <div className="p-3"><div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Assessment &amp; Plan</div><p className="text-sm text-navy">{selected.content.assessment}</p></div>}
                      {selected.content.plan && <div className="p-3"><div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Plan</div><p className="text-sm text-navy">{selected.content.plan}</p></div>}
                    </div>
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
                    <LockedButton locked={readOnly} editRoles={editRoles} onClick={() => !readOnly && handleApprove(selected.id)} className="btn-primary text-sm px-6 py-2 flex-1">✓ Co-sign &amp; Approve</LockedButton>
                    <LockedButton locked={readOnly} editRoles={editRoles} className="btn-outline text-sm px-4 py-2 text-amber-700 border-amber-300 hover:bg-amber-50">Request Revision</LockedButton>
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
      )}

      {cosignTab === 'Supervision Notes' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Clinical supervision session notes — tracks supervisory meetings, case consultations, and competency development for staff requiring oversight.</div>
          <div className="card">
            <div className="space-y-4">
              {[
                {
                  supervisee: 'A. Brooks, LPC-Associate', supervisor: 'Dr. R. Okafor, LPC-S', date: '2026-07-15', type: 'Individual Supervision',
                  caseload: 8, topics: 'Reviewed trauma-informed approaches with dual-diagnosis patient (rm 3A). Discussed countertransference with AMA-risk patient. CBT homework compliance strategies.',
                  plan: 'Brooks to complete 2-hour MI refresher by Jul 30. Shared exemplary progress note from peers as model. Next session: July 29.',
                  rating: 'On Track', rColor: 'bg-green-100 text-green-700'
                },
                {
                  supervisee: 'D. Williams, CAC-AD-II', supervisor: 'A. Simms, LCSW', date: '2026-07-14', type: 'Group Supervision',
                  caseload: 10, topics: 'Group reviewed documentation standards for treatment plan objectives. Case presentation: chronic relapse patient with ambivalence about MAT.',
                  plan: 'Williams to revise two treatment plans flagged in peer review by 7/22. Schedule make-up session for missed July 1 group.',
                  rating: 'Needs Support', rColor: 'bg-amber-100 text-amber-700'
                },
                {
                  supervisee: 'T. Jackson, CAC-AD', supervisor: 'A. Simms, LCSW', date: '2026-07-12', type: 'Individual Supervision',
                  caseload: 11, topics: 'High-performing supervisee — discussed pathway to LPC licensure. Case consultation on patient with complex trauma and SUD. Reviewed family therapy engagement strategies.',
                  plan: 'Jackson pursuing LPC-A application; supervisor endorsement signed. Exploring group co-facilitation opportunities.',
                  rating: 'Exemplary', rColor: 'bg-teal-100 text-teal-700'
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
        </div>
      )}

      {cosignTab === 'Compliance Report' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Cosignature compliance report — tracks supervisory cosign completion rates against state licensure and CARF documentation requirements.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Cosign Rate (30d)', value: '96%', color: 'text-green-600', sub: 'Of all notes requiring cosign' },
              { label: 'Avg Time to Cosign', value: '18h', color: 'text-blue-600', sub: 'From note submission to approval' },
              { label: 'Notes Overdue (>72h)', value: 3, color: 'text-amber-600', sub: 'Currently awaiting cosignature' },
              { label: 'Provisional Staff (CAADC eligible)', value: 2, color: 'text-navy', sub: 'Require 100% cosign rate' },
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
                  {['Clinician', 'Credential', 'Notes Submitted', 'Cosigned On-Time', 'Cosign Rate', 'Avg Wait Time', 'Overdue'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'T. Jackson', cred: 'CAC-AD (Provisional)', submitted: 48, ontime: 47, rate: '98%', wait: '12h', overdue: 1, flag: false },
                  { name: 'M. Rivera', cred: 'MS, Intern', submitted: 36, ontime: 33, rate: '92%', wait: '24h', overdue: 2, flag: true },
                  { name: 'K. Nguyen', cred: 'CAADC (Provisional)', submitted: 42, ontime: 42, rate: '100%', wait: '10h', overdue: 0, flag: false },
                  { name: 'A. Brooks', cred: 'LPC (Licensed)', submitted: 61, ontime: 61, rate: 'N/A (licensed)', wait: '—', overdue: 0, flag: false },
                  { name: 'R. Torres', cred: 'LPC-MHSP (Licensed)', submitted: 55, ontime: 55, rate: 'N/A (licensed)', wait: '—', overdue: 0, flag: false },
                ].map(r => (
                  <tr key={r.name} className={`hover:bg-gray-50 ${r.flag ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-3 py-2 font-medium text-navy">{r.name}</td>
                    <td className="px-3 py-2 text-slate">{r.cred}</td>
                    <td className="px-3 py-2 text-center text-navy">{r.submitted}</td>
                    <td className="px-3 py-2 text-center text-navy">{r.ontime}</td>
                    <td className="px-3 py-2 text-center font-bold">
                      <span className={r.rate === 'N/A (licensed)' ? 'text-slate text-[10px]' : r.rate === '100%' ? 'text-green-600' : parseFloat(r.rate) >= 95 ? 'text-blue-600' : 'text-amber-600'}>{r.rate}</span>
                    </td>
                    <td className="px-3 py-2 text-center text-slate">{r.wait}</td>
                    <td className="px-3 py-2 text-center">
                      {r.overdue > 0 ? <span className="font-bold text-amber-600">{r.overdue}</span> : <span className="text-green-600">0</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Status', 'Document', 'Clinician', 'Patient', 'Written At', 'Deadline', 'Overdue By', 'Supervisor'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { status: 'Past Deadline', doc: 'Individual Progress Note', clin: 'M. Gonzales, LCSW', pt: 'R. Coleman', written: 'Jul 18 09:00', deadline: 'Jul 19 09:00', over: '3h 14min', sup: 'D. Reyes, LPC-S' },
                  { status: 'Past Deadline', doc: 'Group Note (AM Session)', clin: 'T. Osei, CAC-AD', pt: 'Group — 7 pts', written: 'Jul 18 11:00', deadline: 'Jul 19 11:00', over: '1h 22min', sup: 'S. Jenkins, LPC-S' },
                  { status: 'Past Deadline', doc: 'BPS Assessment — New Admit', clin: 'R. Patel, CAADC', pt: 'M. Torres', written: 'Jul 17 16:00', deadline: 'Jul 18 16:00', over: '19h 36min', sup: 'D. Reyes, LPC-S' },
                  { status: 'Due in 2h', doc: 'Individual Progress Note', clin: 'L. Washington, LCAS', pt: 'K. Walsh', written: 'Jul 19 10:15', deadline: 'Jul 20 10:15', over: '—', sup: 'S. Jenkins, LPC-S' },
                  { status: 'Due in 3h', doc: 'Discharge Summary Draft', clin: 'M. Gonzales, LCSW', pt: 'A. Santos', written: 'Jul 19 09:30', deadline: 'Jul 20 09:30', over: '—', sup: 'D. Reyes, LPC-S' },
                ].map(r => (
                  <tr key={r.doc + r.clin} className="hover:bg-gray-50">
                    <td className="px-3 py-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.status === 'Past Deadline' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span></td>
                    <td className="px-3 py-2 font-medium text-navy">{r.doc}</td>
                    <td className="px-3 py-2 text-slate">{r.clin}</td>
                    <td className="px-3 py-2 text-slate">{r.pt}</td>
                    <td className="px-3 py-2 text-slate font-mono text-[10px]">{r.written}</td>
                    <td className="px-3 py-2 text-slate font-mono text-[10px]">{r.deadline}</td>
                    <td className="px-3 py-2 font-bold text-red-600">{r.over}</td>
                    <td className="px-3 py-2 text-slate">{r.sup}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cosignTab === 'Supervisor Directory' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Clinical supervisors authorized to co-sign — scope, credentials, and current queue load.</div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Authorized Co-signing Supervisors</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Supervisor', 'Credential', 'Can Sign For', 'Queue (Open)', 'Avg Turnaround', 'Current Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'D. Reyes, LPC-S', cred: 'LPC-MHSP, NCC', signs: 'LPC, CAADC, MS Interns', queue: 5, avg: '3.2h', status: 'On Site' },
                  { name: 'S. Jenkins, LPC-S', cred: 'LPC-MHSP', signs: 'CAC-AD, CAADC, Counseling Interns', queue: 4, avg: '2.8h', status: 'On Site' },
                  { name: 'Dr. R. Chen, MD', cred: 'MD, ABAM', signs: 'Nursing notes, MAT orders, Medical notes', queue: 2, avg: '1.1h', status: 'On Site' },
                  { name: 'Dr. A. Hughes, MD', cred: 'MD, Psychiatry', signs: 'Psychiatric notes, medication orders', queue: 1, avg: '0.9h', status: 'Off Site (On-Call)' },
                ].map(r => (
                  <tr key={r.name} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-navy">{r.name}</td>
                    <td className="px-3 py-2 text-slate">{r.cred}</td>
                    <td className="px-3 py-2 text-slate">{r.signs}</td>
                    <td className="px-3 py-2 text-center font-bold text-navy">{r.queue}</td>
                    <td className="px-3 py-2 text-slate">{r.avg}</td>
                    <td className="px-3 py-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.status === 'On Site' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span></td>
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
