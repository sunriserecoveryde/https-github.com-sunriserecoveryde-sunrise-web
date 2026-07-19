import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

interface GroupSession {
  id: string;
  name: string;
  type: string;
  time: string;
  location: string;
  facilitator: string;
  program: string;
  expectedCensus: number;
  actualAttendance: number;
  status: 'Completed' | 'In Progress' | 'Upcoming' | 'Cancelled';
  noteStatus: 'Signed' | 'Draft' | 'Pending' | 'None';
  topic: string;
  objectives: string[];
  note?: string;
  date: string;
}

const SESSIONS: GroupSession[] = [
  {
    id: 'g1', name: 'Morning Process Group', type: 'Process Group', time: '9:00 AM', location: 'Group Room A', facilitator: 'Sarah Jenkins, LPC',
    program: 'Residential', expectedCensus: 10, actualAttendance: 9, status: 'Completed', noteStatus: 'Signed',
    topic: 'Coping Skills & Triggers', objectives: ['Identify personal triggers from the past week', 'Share one coping skill that worked', 'Peer support and accountability check-in'],
    note: 'Group was engaged and cohesive today. Marcus W. shared significant trigger around work stress and received strong peer support. Samantha C. disclosed cravings after phone call with ex-partner — safety plan reviewed. Overall therapeutic milieu is positive. One absence (Linda F.) excused — individual session with counselor.', date: '2026-07-18',
  },
  {
    id: 'g2', name: 'Psychoeducation', type: 'Psychoeducation', time: '10:30 AM', location: 'Group Room B', facilitator: 'David Odom, LMFT',
    program: 'Residential', expectedCensus: 10, actualAttendance: 8, status: 'Completed', noteStatus: 'Draft',
    topic: 'Disease Model of Addiction', objectives: ['Review neurobiological basis of substance use disorder', 'Discuss stigma and self-compassion', 'Introduce concept of chronic brain disorder'],
    note: 'Presented slides on dopamine dysregulation and reward pathway changes. Group initially skeptical — challenged "disease vs. choice" framing. Productive discussion emerged. James T. asked about genetic factors — provided psychoeducation on heritability. Two participants disclosed shame around diagnosis for the first time.', date: '2026-07-18',
  },
  {
    id: 'g3', name: 'Relapse Prevention', type: 'Relapse Prevention', time: '1:00 PM', location: 'Group Room A', facilitator: 'Maria Gonzales, LCSW',
    program: 'All Programs', expectedCensus: 14, actualAttendance: 12, status: 'In Progress', noteStatus: 'None',
    topic: 'High-Risk Situations & HALT', objectives: ['Define HALT (Hungry, Angry, Lonely, Tired)', 'Map personal high-risk situations', 'Develop one exit strategy per identified risk'],
    date: '2026-07-18',
  },
  {
    id: 'g4', name: 'Trauma-Informed Care', type: 'Trauma', time: '2:30 PM', location: 'Group Room C', facilitator: 'Dr. Allen Hughes',
    program: 'Residential', expectedCensus: 8, actualAttendance: 0, status: 'Upcoming', noteStatus: 'None',
    topic: 'PTSD & Co-occurring Disorders', objectives: ['Psychoeducation on trauma response', 'Window of tolerance exercise', 'Introduce grounding techniques'],
    date: '2026-07-18',
  },
  {
    id: 'g5', name: 'Family Systems', type: 'Family', time: '11:00 AM', location: 'Group Room A', facilitator: 'David Odom, LMFT',
    program: 'PHP', expectedCensus: 6, actualAttendance: 5, status: 'Completed', noteStatus: 'Signed',
    topic: 'Communication & Boundaries', objectives: ['Review healthy vs unhealthy communication', 'Role-play boundary-setting scenarios', 'Discuss enabling behaviors'],
    note: 'Strong family engagement today. One spouse shared they had been "enabling without knowing it" — turning point moment. Assigned journaling homework: identify one boundary to set before next session. Group cohesion excellent.', date: '2026-07-18',
  },
  {
    id: 'g6', name: 'Evening Reflection', type: 'Process Group', time: '7:00 PM', location: 'Group Room A', facilitator: 'Sarah Jenkins, LPC',
    program: 'Residential', expectedCensus: 14, actualAttendance: 0, status: 'Upcoming', noteStatus: 'None',
    topic: 'Gratitude & Accountability', objectives: ['End-of-day mood and craving check-in', 'Share one win from today', 'Set intention for tomorrow'],
    date: '2026-07-18',
  },
  {
    id: 'g7', name: 'Morning Process Group', type: 'Process Group', time: '9:00 AM', location: 'Group Room A', facilitator: 'Sarah Jenkins, LPC',
    program: 'Residential', expectedCensus: 10, actualAttendance: 8, status: 'Completed', noteStatus: 'Signed',
    topic: 'Motivation & Recovery Identity', objectives: ['Check-in on week goals', 'Discuss recovery identity formation', 'Peer encouragement'],
    note: 'Seven of eight participants present. Patricia H. shared she celebrated 35 days sober — group celebrated with her. Robert N. minimized progress; counselor used motivational interviewing to redirect. Good energy.', date: '2026-07-17',
  },
];

const STATUS_COLORS: Record<string, string> = {
  Completed: 'bg-green-100 text-green-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Upcoming: 'bg-gray-100 text-slate',
  Cancelled: 'bg-red-100 text-red-700',
};

const NOTE_STATUS_COLORS: Record<string, string> = {
  Signed: 'bg-green-100 text-green-700',
  Draft: 'bg-amber-100 text-amber-700',
  Pending: 'bg-blue-100 text-blue-700',
  None: 'bg-gray-100 text-slate',
};

export function GroupNotes({ navigate, readOnly }: Props) {
  const [selectedDate, setSelectedDate] = useState<'2026-07-18' | '2026-07-17'>('2026-07-18');
  const [selected, setSelected] = useState<GroupSession | null>(SESSIONS[0]);
  const [noteText, setNoteText] = useState('');
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  const todaySessions = SESSIONS.filter(s => s.date === selectedDate);
  const todayComplete = todaySessions.filter(s => s.status === 'Completed').length;
  const todayPending = todaySessions.filter(s => s.noteStatus === 'None' && s.status === 'Completed').length;
  const todayDraft = todaySessions.filter(s => s.noteStatus === 'Draft').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Group Notes</h1>
          <p className="text-slate text-sm mt-0.5">Group therapy session documentation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            {(['2026-07-18', '2026-07-17'] as const).map(d => (
              <button key={d} onClick={() => setSelectedDate(d)} className={`px-4 py-2 font-medium ${selectedDate === d ? 'bg-navy text-white' : 'bg-white text-slate hover:bg-gray-50'}`}>
                {d === '2026-07-18' ? 'Today (7/18)' : 'Yesterday (7/17)'}
              </button>
            ))}
          </div>
          <LockedButton locked={readOnly} className="btn-primary text-sm px-4 py-2">+ New Session</LockedButton>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-navy">{todaySessions.length}</div>
          <div className="text-xs text-slate mt-1">Sessions Today</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{todayComplete}</div>
          <div className="text-xs text-slate mt-1">Completed</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-amber-600">{todayDraft}</div>
          <div className="text-xs text-slate mt-1">Draft Notes</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{todayPending}</div>
          <div className="text-xs text-slate mt-1">Notes Pending</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Session List */}
        <div className="col-span-2 space-y-2">
          {todaySessions.map(s => {
            const pct = s.actualAttendance > 0 ? Math.round((s.actualAttendance / s.expectedCensus) * 100) : 0;
            return (
              <div
                key={s.id}
                onClick={() => { setSelected(s); setShowNoteEditor(false); }}
                className={`card cursor-pointer p-3 hover:shadow-md transition-all ${selected?.id === s.id ? 'ring-2 ring-orange' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-navy text-sm">{s.name}</div>
                    <div className="text-xs text-slate">{s.time} · {s.location}</div>
                    <div className="text-xs text-slate">{s.facilitator}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status]}`}>{s.status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${NOTE_STATUS_COLORS[s.noteStatus]}`}>Note: {s.noteStatus}</span>
                  </div>
                </div>
                {s.status === 'Completed' && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate">
                    <span>Attendance: {s.actualAttendance}/{s.expectedCensus}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-orange rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span>{pct}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="col-span-3 space-y-4">
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-navy">{selected.name}</h2>
                  <p className="text-sm text-slate">{selected.time} · {selected.location} · {selected.facilitator}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${NOTE_STATUS_COLORS[selected.noteStatus]}`}>{selected.noteStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div><span className="text-slate">Topic:</span> <span className="font-medium text-navy">{selected.topic}</span></div>
                <div><span className="text-slate">Type:</span> <span className="font-medium text-navy">{selected.type}</span></div>
                <div><span className="text-slate">Program:</span> <span className="font-medium text-navy">{selected.program}</span></div>
                <div><span className="text-slate">Attendance:</span> <span className="font-medium text-navy">{selected.actualAttendance}/{selected.expectedCensus} ({selected.expectedCensus > 0 ? Math.round((selected.actualAttendance / selected.expectedCensus) * 100) : 0}%)</span></div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Session Objectives</div>
                <ul className="space-y-1">
                  {selected.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-navy">
                      <span className="text-orange mt-0.5">•</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              {selected.note && !showNoteEditor && (
                <div className="mt-4 bg-gray-50 border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-semibold text-slate uppercase tracking-wide">Group Note</div>
                    {!readOnly && <button onClick={() => { setNoteText(selected.note || ''); setShowNoteEditor(true); }} className="text-xs text-orange hover:underline">Edit</button>}
                  </div>
                  <p className="text-sm text-navy">{selected.note}</p>
                </div>
              )}

              {(showNoteEditor || (!selected.note && selected.status === 'Completed')) && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">
                    {selected.note ? 'Edit Note' : 'Write Group Note'}
                  </div>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Document session themes, individual participation, therapeutic interventions, follow-up actions..."
                    className="w-full border border-border rounded-lg p-3 text-sm min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-orange/50"
                  />
                  <div className="flex gap-2 mt-2">
                    <LockedButton locked={readOnly} className="btn-primary text-sm px-4 py-2">Sign Note</LockedButton>
                    <LockedButton locked={readOnly} className="btn-outline text-sm px-4 py-2">Save Draft</LockedButton>
                    <LockedButton locked={readOnly} onClick={() => !readOnly && navigate('CosignQueue')} className="btn-outline text-sm px-4 py-2">Send for Co-sign</LockedButton>
                    {showNoteEditor && <button onClick={() => setShowNoteEditor(false)} className="btn-outline text-sm px-4 py-2 text-slate">Cancel</button>}
                  </div>
                </div>
              )}

              {!selected.note && selected.status !== 'Completed' && (
                <div className="mt-4 bg-gray-50 border border-border rounded-lg p-3 text-sm text-slate text-center">
                  {selected.status === 'Upcoming' ? 'Session not yet started — note will be available after session begins.' : 'Session in progress — note entry will unlock when session concludes.'}
                </div>
              )}

              {!selected.note && selected.status === 'Completed' && !showNoteEditor && (
                <div className="mt-4">
                  <LockedButton locked={readOnly} onClick={() => !readOnly && setShowNoteEditor(true)} className="btn-primary text-sm px-4 py-2 w-full">Write Group Note</LockedButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
