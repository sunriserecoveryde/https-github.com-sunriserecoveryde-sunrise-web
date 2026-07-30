import React, { useState, useEffect, useRef } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { LockedButton } from '../components/common/LockedButton';
import { getRolesWithEditAccess } from '../data/mockRoles';
import { Sparkles, Zap, Brain, Target, ChevronDown, ChevronUp, RotateCcw, AlertTriangle, CheckCircle, BookOpen, X } from 'lucide-react';
import { parseQuickCapture, scoreNoteQuality, type ParsedSignal } from '../lib/quickCaptureParser';
import { useAuth } from '../context/AuthContext';
import { SignatureModal, SignedBadge, SignatureRecord } from '../components/ui/SignatureModal';
import { generateGroupNote, GroupNoteInput } from '../lib/aiNoteEngine';
import { TopicPicker } from '../components/ui/TopicPicker';
import { getTopicById } from '../lib/topicLibrary';
import { CURRICULA } from './GroupTherapyCurriculum';
import { useDocumentForm } from '../hooks/useDocumentForm';
import { DocumentFormBar } from '../components/ui/DocumentFormBar';

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
    id: 'g1', name: 'Morning Process Group', type: 'Process Group', time: '9:00 AM', location: 'Group Room A', facilitator: 'Sarah Jenkins, LCPC',
    program: 'Residential', expectedCensus: 10, actualAttendance: 9, status: 'Completed', noteStatus: 'Signed',
    topic: 'Coping Skills & Triggers', objectives: ['Identify personal triggers from the past week', 'Share one coping skill that worked', 'Peer support and accountability check-in'],
    note: 'Group was engaged and cohesive today. Marcus W. shared significant trigger around work stress and received strong peer support. Samantha C. disclosed cravings after phone call with ex-partner — safety plan reviewed. Overall therapeutic milieu is positive. One absence (Linda F.) excused — individual session with counselor.', date: '2026-07-18',
  },
  {
    id: 'g2', name: 'Psychoeducation', type: 'Psychoeducation', time: '10:30 AM', location: 'Group Room B', facilitator: 'David Odom, LCADC',
    program: 'Residential', expectedCensus: 10, actualAttendance: 8, status: 'Completed', noteStatus: 'Draft',
    topic: 'Disease Model of Addiction', objectives: ['Review neurobiological basis of substance use disorder', 'Discuss stigma and self-compassion', 'Introduce concept of chronic brain disorder'],
    note: 'Presented slides on dopamine dysregulation and reward pathway changes. Group initially skeptical — challenged "disease vs. choice" framing. Productive discussion emerged. James T. asked about genetic factors — provided psychoeducation on heritability. Two participants disclosed shame around diagnosis for the first time.', date: '2026-07-18',
  },
  {
    id: 'g3', name: 'Relapse Prevention', type: 'Relapse Prevention', time: '1:00 PM', location: 'Group Room A', facilitator: 'Maria Gonzales, LCADC',
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
    id: 'g5', name: 'Family Systems', type: 'Family', time: '11:00 AM', location: 'Group Room A', facilitator: 'David Odom, LCADC',
    program: 'PHP', expectedCensus: 6, actualAttendance: 5, status: 'Completed', noteStatus: 'Signed',
    topic: 'Communication & Boundaries', objectives: ['Review healthy vs unhealthy communication', 'Role-play boundary-setting scenarios', 'Discuss enabling behaviors'],
    note: 'Strong family engagement today. One spouse shared they had been "enabling without knowing it" — turning point moment. Assigned journaling homework: identify one boundary to set before next session. Group cohesion excellent.', date: '2026-07-18',
  },
  {
    id: 'g6', name: 'Evening Reflection', type: 'Process Group', time: '7:00 PM', location: 'Group Room A', facilitator: 'Sarah Jenkins, LCPC',
    program: 'Residential', expectedCensus: 14, actualAttendance: 0, status: 'Upcoming', noteStatus: 'None',
    topic: 'Gratitude & Accountability', objectives: ['End-of-day mood and craving check-in', 'Share one win from today', 'Set intention for tomorrow'],
    date: '2026-07-18',
  },
  {
    id: 'g7', name: 'Morning Process Group', type: 'Process Group', time: '9:00 AM', location: 'Group Room A', facilitator: 'Sarah Jenkins, LCPC',
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

// Participation levels — Kipu-inspired: per-patient individual notes within a group note
type PartLevel = 'Active' | 'Moderate' | 'Passive' | 'Late' | 'Absent' | 'Excused';

const PART_LEVEL_STYLES: Record<PartLevel, string> = {
  Active:   'bg-green-100 text-green-800 border-green-300',
  Moderate: 'bg-blue-100 text-blue-800 border-blue-300',
  Passive:  'bg-amber-100 text-amber-800 border-amber-300',
  Late:     'bg-orange-100 text-orange-800 border-orange-300',
  Absent:   'bg-red-100 text-red-800 border-red-300',
  Excused:  'bg-gray-100 text-slate border-gray-300',
};

export function GroupNotes({ navigate, readOnly }: Props) {
  const editRoles = getRolesWithEditAccess('GroupNotes');
  const [selectedDate, setSelectedDate] = useState<'2026-07-18' | '2026-07-17'>('2026-07-18');
  const [selected, setSelected] = useState<GroupSession | null>(SESSIONS[0]);
  const [noteText, setNoteText] = useState('');
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [view, setView] = useState<'Sessions' | 'Attendance' | 'Group Analytics' | 'Facilitator Stats' | 'Curriculum Map' | 'Documentation Standards'>('Sessions');
  const [groupNoteSaved, setGroupNoteSaved] = useState<string | null>(null);
  const saveGroupNote = (msg: string) => { setGroupNoteSaved(msg); setTimeout(() => setGroupNoteSaved(null), 2500); };
  // Per-patient participation map, keyed by sessionId → patientId → { level, note }
  const [participationMap, setParticipationMap] = useState<Record<string, Record<string, { level: PartLevel; note: string }>>>({});
  // AI draft + signature state
  const [aiDraftOpen, setAiDraftOpen] = useState(false);
  const [aiInput, setAiInput] = useState<Partial<GroupNoteInput>>({});
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);
  const [curriculumPickerOpen, setCurriculumPickerOpen] = useState(false);
  const [sigModal, setSigModal] = useState<string | null>(null); // session ID
  const [sessionSigs, setSessionSigs] = useState<Record<string, SignatureRecord>>({});
  // Quick Capture state
  const captureDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [captureText, setCaptureText] = useState('');
  const [parsedSignals, setParsedSignals] = useState<ParsedSignal[]>([]);
  const [groupParseScore, setGroupParseScore] = useState(0);
  const [parsedGroupInput, setParsedGroupInput] = useState<Partial<GroupNoteInput>>({});

  // ── Document form engine for the active group session note ─────────────────
  // Scoped to the active session so switching sessions resets form state
  const groupDocId = selected ? `gn-${selected.id}` : 'gn-none';
  const { currentStaff } = useAuth();
  const authorName = currentStaff ? `${currentStaff.firstName} ${currentStaff.lastName}` : 'Staff Member';
  const groupDocForm = useDocumentForm({
    docId: groupDocId,
    docType: 'Group Note',
    patientId: selected?.id ?? '',
    patientName: selected?.name ?? '',
    mrn: '',
    program: selected?.program ?? '',
    authorName,
    authorId: 'current-staff',
    authorRole: currentStaff?.title ?? 'Clinician',
    supervisor: 'James S. Collins III, Clinical Director',
    requiresCoSign: true,
    requiredFields: ['Group Narrative'],
    fieldValues: { 'Group Narrative': noteText },
  });

  function getSessionPatients(session: GroupSession) {
    return MOCK_PATIENTS.filter(p =>
      session.program === 'All Programs' || p.program === session.program
    );
  }

  function setParticipation(sessionId: string, patientId: string, field: 'level' | 'note', value: string) {
    setParticipationMap(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [patientId]: {
          level: (prev[sessionId]?.[patientId]?.level ?? 'Passive') as PartLevel,
          note: prev[sessionId]?.[patientId]?.note ?? '',
          [field]: value,
        },
      },
    }));
  }

  // Debounced parse of quick capture text → GroupNoteInput fields
  useEffect(() => {
    if (captureDebounceRef.current) clearTimeout(captureDebounceRef.current);
    if (!captureText.trim()) {
      setParsedSignals([]); setParsedGroupInput({}); setGroupParseScore(0); return;
    }
    captureDebounceRef.current = setTimeout(() => {
      const result = parseQuickCapture(captureText);
      setParsedSignals(result.signals);
      setGroupParseScore(result.parseScore);
      const g: Partial<GroupNoteInput> = {};
      if (result.input.presentingConcern) g.notableThemes = result.input.presentingConcern;
      if (result.input.interventions) g.groupDynamics = `Clinician facilitated: ${result.input.interventions}`;
      if (result.input.plan) g.followUpActions = result.input.plan;
      if (result.input.clientResponse) g.participantHighlights = result.input.clientResponse;
      setParsedGroupInput(g);
    }, 350);
    return () => { if (captureDebounceRef.current) clearTimeout(captureDebounceRef.current); };
  }, [captureText]);

  function handleQuickCaptureGenerate() {
    if (!selected) return;
    const draft = generateGroupNote({
      groupName: selected.name, groupType: selected.type, topic: selected.topic,
      objectives: selected.objectives, facilitator: selected.facilitator,
      attendance: selected.actualAttendance, expectedCensus: selected.expectedCensus,
      program: selected.program, ...parsedGroupInput, ...aiInput,
    });
    setNoteText(draft);
  }

  function handleCurriculumSelect(curriculumId: string) {
    const cur = CURRICULA.find(c => c.id === curriculumId);
    if (!cur || !selected) return;
    setSelectedCurriculumId(curriculumId);
    // Clear any active topic selection so they don't conflict
    setSelectedTopicId(null);
    const domains = cur.primaryDomains.slice(0, 4).join(', ');
    const draft = generateGroupNote({
      groupName: selected.name,
      groupType: selected.type,
      topic: `${cur.abbreviation} — ${cur.name}`,
      objectives: [
        `Apply ${cur.abbreviation} framework to session content`,
        ...cur.primaryDomains.slice(0, 2).map(d => `Explore ${d.toLowerCase()}`),
      ],
      facilitator: selected.facilitator,
      attendance: selected.actualAttendance,
      expectedCensus: selected.expectedCensus,
      program: selected.program,
      notableThemes: domains,
      groupDynamics: `Session structured per ${cur.abbreviation} protocol (${cur.developer.split('/')[0].trim()}, ${cur.evidenceLevel}).`,
    });
    setNoteText(draft);
    setCurriculumPickerOpen(false);
  }

  function handleTopicSelect(topicId: string) {
    const topic = getTopicById(topicId);
    if (!topic) return;
    setSelectedTopicId(topicId);
    if (topic.groupNarrative) {
      // Immediate draft: use the topic's curated group narrative
      setNoteText(topic.groupNarrative);
      setAiDraftOpen(false);
    } else if (selected) {
      // Fall back: generate from GroupNoteInput enriched with topic context
      const draft = generateGroupNote({
        groupName: selected.name,
        groupType: selected.type,
        topic: selected.topic,
        objectives: selected.objectives,
        facilitator: selected.facilitator,
        attendance: selected.actualAttendance,
        expectedCensus: selected.expectedCensus,
        program: selected.program,
        notableThemes: topic.input.presentingConcern,
        groupDynamics: topic.input.interventionDetail,
        followUpActions: topic.input.plan,
        ...aiInput,
      });
      setNoteText(draft);
      setAiDraftOpen(false);
    }
  }

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
          <LockedButton locked={readOnly} editRoles={editRoles} className="btn-primary text-sm px-4 py-2">+ New Session</LockedButton>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 border-b border-border">
        {(['Sessions', 'Attendance', 'Group Analytics', 'Facilitator Stats', 'Curriculum Map', 'Documentation Standards'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${view === v ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{v === 'Attendance' ? 'Attendance Sheet' : v}</button>
        ))}
      </div>

      {view === 'Attendance' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-navy text-sm">Group Attendance — {selectedDate}</h3>
            <span className="text-xs text-slate">Participation codes: P = Present, A = Absent (excused), U = Absent (unexcused), L = Late</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate min-w-[160px]">Patient</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate min-w-[80px]">Program</th>
                {SESSIONS.filter(s => s.date === selectedDate).map(s => (
                  <th key={s.id} className="text-center px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate max-w-[90px]">
                    <div className="truncate">{s.name.split(' ').slice(0, 2).join(' ')}</div>
                    <div className="font-normal text-[9px] text-slate/70">{s.time}</div>
                  </th>
                ))}
                <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_PATIENTS.slice(0, 12).map((p, pi) => {
                const sessionList = SESSIONS.filter(s => s.date === selectedDate);
                const codes = sessionList.map((s, si) => {
                  if (s.status === 'Upcoming') return '—';
                  const roll = (pi + si) % 7;
                  if (roll === 0) return 'A';
                  if (roll === 6) return 'L';
                  if (p.program !== 'Residential' && s.program === 'Residential') return '—';
                  return 'P';
                });
                const attended = codes.filter(c => c === 'P' || c === 'L').length;
                const total = codes.filter(c => c !== '—').length;
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-navy whitespace-nowrap">
                      <button className="hover:text-orange" onClick={() => navigate('PatientDetail', p.id)}>{p.firstName} {p.lastName}</button>
                    </td>
                    <td className="px-4 py-2.5 text-slate">{p.program}</td>
                    {codes.map((code, ci) => (
                      <td key={ci} className="px-2 py-2.5 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold ${code === 'P' ? 'bg-green-100 text-green-700' : code === 'A' ? 'bg-red-100 text-red-700' : code === 'L' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-slate'}`}>{code}</span>
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs font-bold ${total > 0 && attended/total >= 0.8 ? 'text-green-700' : total > 0 && attended/total >= 0.5 ? 'text-amber-700' : 'text-slate'}`}>
                        {attended}/{total}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-2.5 bg-gray-50 border-t border-border flex justify-between text-xs text-slate">
            <span>Required attendance: ≥80% of scheduled groups per program policy</span>
            <LockedButton locked={readOnly} onClick={() => saveGroupNote('Attendance report exported')} className="text-xs text-orange font-medium hover:underline">Export Attendance Report</LockedButton>
          </div>
        </div>
      )}

      {view === 'Sessions' && (
      <div className="space-y-6">
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
                  {sessionSigs[selected.id] && <div className="mt-3"><SignedBadge record={sessionSigs[selected.id]} /></div>}
                </div>
              )}

              {(showNoteEditor || (!selected.note && selected.status === 'Completed')) && (
                <div className="mt-4 space-y-3">
                  <div className="text-xs font-semibold text-slate uppercase tracking-wide">
                    {selected.note ? 'Edit Note' : 'Write Group Note'}
                  </div>

                  {/* ── Per-patient participation grid (Kipu-inspired) ── */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b border-border flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Patient Participation</span>
                      <span className="text-[10px] text-slate">Record participation level + individual note per patient</span>
                    </div>
                    <div className="divide-y divide-border/60">
                      {getSessionPatients(selected).slice(0, 12).map(p => {
                        const part = participationMap[selected.id]?.[p.id];
                        const level = part?.level ?? 'Moderate';
                        return (
                          <div key={p.id} className="flex items-center gap-2 px-3 py-2">
                            <div className="w-[130px] font-medium text-navy text-xs flex-shrink-0 truncate">
                              {p.firstName} {p.lastName}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              {(['Active', 'Moderate', 'Passive', 'Late', 'Absent', 'Excused'] as PartLevel[]).map(lv => (
                                <button
                                  key={lv}
                                  disabled={readOnly}
                                  onClick={() => setParticipation(selected.id, p.id, 'level', lv)}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-all ${
                                    level === lv ? PART_LEVEL_STYLES[lv] : 'bg-white text-slate border-border hover:bg-gray-50'
                                  }`}
                                >
                                  {lv}
                                </button>
                              ))}
                            </div>
                            <input
                              disabled={readOnly}
                              value={part?.note ?? ''}
                              onChange={e => setParticipation(selected.id, p.id, 'note', e.target.value)}
                              placeholder="Individual note (optional)…"
                              className="flex-1 text-xs border border-border rounded px-2 py-1 min-w-0 focus:outline-none focus:ring-1 focus:ring-orange/50 disabled:opacity-60"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Note Intelligence Panel */}
                  <div className="mb-3 rounded-xl border border-teal-200 bg-gradient-to-b from-teal-50/60 to-white overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-teal-200 bg-teal-50/80">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center flex-none">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-teal-900">AI Group Note Intelligence</div>
                        <div className="text-[10px] text-teal-600">Describe the session or pick a topic — note fills automatically</div>
                      </div>
                      {noteText && (
                        <button onClick={() => { setNoteText(''); setCaptureText(''); setParsedSignals([]); setSelectedTopicId(null); }} className="ml-auto text-[10px] text-slate hover:text-red-500 flex items-center gap-1 transition-colors">
                          <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                      )}
                    </div>

                    <div className="p-3 space-y-3">
                      {/* Session context strip */}
                      <div className="flex items-center gap-2 flex-wrap px-3 py-2 bg-navy/5 border border-navy/10 rounded-lg text-[11px]">
                        <span className="font-bold text-navy">{selected.name}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate">{selected.type}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate">{selected.actualAttendance} attendees</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-medium text-teal-700">{selected.facilitator}</span>
                      </div>

                      {/* Quick Capture */}
                      <div className="bg-white border border-teal-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-teal-600 to-teal-700">
                          <Zap className="w-3 h-3 text-white flex-none" />
                          <span className="text-xs font-bold text-white">Quick Capture</span>
                          <span className="text-[10px] text-teal-200 ml-1">Type what happened — AI structures the note</span>
                        </div>
                        <div className="p-3">
                          <textarea
                            value={captureText}
                            onChange={e => setCaptureText(e.target.value)}
                            placeholder={`e.g. "Recovery skills group, good energy. Discussed HALT and craving triggers using CBT. Several members shared personal experiences. Follow up with Marcus re: family conflict. Plan to review urge surfing next session."`}
                            rows={3}
                            className="w-full text-sm bg-bg border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-teal-400 placeholder:text-slate-300 leading-relaxed"
                          />
                          {parsedSignals.length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Brain className="w-3 h-3 text-teal-600" />
                                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wide">Detected from your description</span>
                                <span className="text-[10px] text-teal-500 ml-auto">{groupParseScore}% parsed</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {parsedSignals.map((s, i) => (
                                  <div key={i} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${
                                    s.confidence === 'high' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                                    s.confidence === 'medium' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-slate-100 text-slate border-border'
                                  }`}>
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    <span className="font-semibold">{s.label}:</span>
                                    <span className="truncate max-w-[100px]">{s.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <button
                            onClick={handleQuickCaptureGenerate}
                            disabled={parsedSignals.length < 2 || !selected}
                            className="mt-3 flex items-center gap-1.5 bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {parsedSignals.length >= 2 ? 'Generate Group Note' : 'Type more to enable…'}
                          </button>
                        </div>
                      </div>

                      {/* Topic Picker (collapsible) */}
                      <div className="border border-border rounded-xl overflow-hidden">
                        <button onClick={() => setAiDraftOpen(o => !o)} className="w-full flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors text-left">
                          <Target className="w-4 h-4 text-slate" />
                          <span className="text-xs font-semibold text-navy">
                            {selectedTopicId ? `Topic: ${getTopicById(selectedTopicId)?.label}` : 'Browse 46 Clinical Topics'}
                          </span>
                          <span className="ml-auto">{aiDraftOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate" /> : <ChevronDown className="w-3.5 h-3.5 text-slate" />}</span>
                        </button>
                        {aiDraftOpen && (
                          <div className="border-t border-border bg-white p-3">
                            <TopicPicker staffTitle={currentStaff?.title} selectedId={selectedTopicId} onSelect={id => handleTopicSelect(id)} onClear={() => setSelectedTopicId(null)} />
                          </div>
                        )}
                      </div>

                      {/* Curriculum Picker (collapsible) */}
                      <div className="border border-border rounded-xl overflow-hidden">
                        <button onClick={() => setCurriculumPickerOpen(o => !o)} className="w-full flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors text-left">
                          <BookOpen className="w-4 h-4 text-slate" />
                          <span className="text-xs font-semibold text-navy">
                            {selectedCurriculumId
                              ? `Curriculum: ${CURRICULA.find(c => c.id === selectedCurriculumId)?.abbreviation}`
                              : 'Use Curriculum Library'}
                          </span>
                          {selectedCurriculumId && (
                            <button onClick={e => { e.stopPropagation(); setSelectedCurriculumId(null); }} className="ml-1 text-slate hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          <span className="ml-auto">{curriculumPickerOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate" /> : <ChevronDown className="w-3.5 h-3.5 text-slate" />}</span>
                        </button>
                        {curriculumPickerOpen && (
                          <div className="border-t border-border bg-white p-3 space-y-1.5 max-h-52 overflow-y-auto">
                            {CURRICULA.filter(c => c.modality !== 'Individual').map(cur => (
                              <button
                                key={cur.id}
                                onClick={() => handleCurriculumSelect(cur.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${selectedCurriculumId === cur.id ? 'border-orange bg-orange/5 text-navy font-semibold' : 'border-border hover:bg-slate-50 text-navy'}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-orange">{cur.abbreviation}</span>
                                  <span className="flex-1 truncate">{cur.name}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${cur.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{cur.status}</span>
                                </div>
                                <div className="text-slate mt-0.5 truncate">{cur.primaryDomains.slice(0, 3).join(' · ')}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Fine-tune fields (collapsible) */}
                      <details>
                        <summary className="flex items-center gap-2 px-3 py-2.5 bg-white border border-border rounded-xl cursor-pointer select-none hover:bg-slate-50 transition-colors list-none">
                          <Sparkles className="w-4 h-4 text-slate" />
                          <span className="text-xs font-semibold text-navy">Fine-tune fields manually</span>
                        </summary>
                        <div className="mt-2 border border-border rounded-xl bg-white p-3 space-y-2">
                          {([
                            { key: 'groupDynamics', label: 'Group Dynamics / Energy', ph: 'Describe overall group energy, cohesion, participation patterns…' },
                            { key: 'notableThemes', label: 'Notable Themes', ph: 'Key themes or insights that emerged in group discussion…' },
                            { key: 'participantHighlights', label: 'Individual Highlights', ph: 'Notable individual moments, concerns, or breakthroughs…' },
                            { key: 'followUpActions', label: 'Follow-up Actions', ph: 'Counselor follow-up actions, referrals, or next session goals…' },
                          ] as const).map(f => (
                            <div key={f.key}>
                              <label className="block text-[10px] font-semibold text-slate uppercase mb-0.5">{f.label}</label>
                              <textarea rows={2} value={(aiInput as Record<string,string>)[f.key] ?? ''} onChange={e => setAiInput(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.ph}
                                className="w-full bg-bg border border-border rounded px-2 py-1 text-xs resize-none focus:outline-none focus:border-teal-400" />
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              if (!selected) return;
                              const draft = generateGroupNote({ groupName: selected.name, groupType: selected.type, topic: selected.topic, objectives: selected.objectives, facilitator: selected.facilitator, attendance: selected.actualAttendance, expectedCensus: selected.expectedCensus, program: selected.program, ...aiInput });
                              setNoteText(draft);
                            }}
                            className="flex items-center gap-1.5 bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-teal-700"
                          >
                            <Sparkles className="w-3 h-3" /> Generate from Fields
                          </button>
                        </div>
                      </details>

                      {/* Note quality score */}
                      {noteText.length > 20 && (() => {
                        const q = scoreNoteQuality({ 'Group Narrative': noteText });
                        const barColor = q.score >= 90 ? 'bg-green-500' : q.score >= 75 ? 'bg-teal-500' : q.score >= 55 ? 'bg-blue-500' : q.score >= 35 ? 'bg-amber-400' : 'bg-red-400';
                        return (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Note Quality</span>
                              <span className={`text-[11px] font-bold ${q.color}`}>{q.score}% — {q.label}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${q.score}%` }} />
                            </div>
                            {q.issues[0] && (
                              <div className="flex items-start gap-1 text-[10px] text-amber-600 mt-1">
                                <AlertTriangle className="w-2.5 h-2.5 flex-none mt-0.5" /><span>{q.issues[0]}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Group Narrative Note textarea */}
                  <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-1.5">Group Narrative Note</div>
                  <textarea
                    value={noteText}
                    onChange={e => { setNoteText(e.target.value); groupDocForm.markDirty(); }}
                    disabled={groupDocForm.isLocked}
                    placeholder={groupDocForm.isLocked ? '(document is locked)' : 'Document session themes, overall group dynamics, therapeutic interventions, follow-up actions…'}
                    className={`w-full border border-border rounded-lg p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-orange/50 ${groupDocForm.isLocked ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
                  />
                  <div className="mt-2">
                    <DocumentFormBar
                      formState={groupDocForm.formState}
                      isLocked={groupDocForm.isLocked}
                      isSigned={groupDocForm.isSigned}
                      isDirty={groupDocForm.isDirty}
                      completionPct={groupDocForm.completionPct}
                      autosaveStatus={groupDocForm.autosaveStatus}
                      lastSaved={groupDocForm.lastSaved}
                      validationErrors={groupDocForm.validationErrors}
                      requiresCoSign
                      showAddendum={groupDocForm.showAddendum}
                      setShowAddendum={groupDocForm.setShowAddendum}
                      addendumText={groupDocForm.addendumText}
                      setAddendumText={groupDocForm.setAddendumText}
                      onAddAddendum={groupDocForm.handleAddAddendum}
                      versions={groupDocForm.versions}
                      editRoles={editRoles}
                      authorName={authorName}
                      authorRole={currentStaff?.title ?? 'Clinician'}
                      documentTitle={selected ? `Group Note — ${selected.name}` : 'Group Note'}
                      onSaveDraft={() => { groupDocForm.handleSaveDraft(); setShowNoteEditor(false); saveGroupNote('Draft saved'); }}
                      onSubmitForCoSign={() => {
                        const ok = groupDocForm.handleSubmitForCoSign();
                        if (ok !== false) { setShowNoteEditor(false); saveGroupNote('Submitted for co-sign'); navigate('CosignQueue'); }
                        return ok;
                      }}
                      onSign={(record) => {
                        if (groupDocForm.handleSign(record)) {
                          if (selected) {
                            setSessionSigs(prev => ({ ...prev, [selected.id]: record }));
                            setSigModal(selected.id);
                          }
                        }
                      }}
                    />
                    {showNoteEditor && <button onClick={() => setShowNoteEditor(false)} className="mt-2 text-xs text-slate underline underline-offset-2 hover:text-navy">Cancel</button>}
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
                  <LockedButton locked={readOnly} editRoles={editRoles} onClick={() => !readOnly && setShowNoteEditor(true)} className="btn-primary text-sm px-4 py-2 w-full">Write Group Note</LockedButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
      )}

      {view === 'Group Analytics' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Group therapy engagement metrics, attendance trends, and session quality indicators — rolling 30-day window.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Sessions This Month', value: 42, color: 'text-navy', sub: '6 per day avg' },
              { label: 'Avg Attendance Rate', value: '87%', color: 'text-green-600', sub: 'Target: ≥80%' },
              { label: 'Notes Signed Same Day', value: '71%', color: 'text-amber-600', sub: 'Target: ≥85%' },
              { label: 'Groups Cancelled', value: 2, color: 'text-red-600', sub: 'Staff shortage (2), Weather (0)' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Attendance by Group Type (Rolling 30 Days)</h3>
              <div className="space-y-3">
                {[
                  { type: 'Process Group', sessions: 16, avgAttend: 9.1, capacity: 10, pct: 91 },
                  { type: 'Psychoeducation', sessions: 12, avgAttend: 8.4, capacity: 10, pct: 84 },
                  { type: 'Relapse Prevention', sessions: 8, avgAttend: 7.9, capacity: 10, pct: 79 },
                  { type: 'Mindfulness / DBT', sessions: 4, avgAttend: 6.2, capacity: 8, pct: 78 },
                  { type: 'Family Education', sessions: 2, avgAttend: 5.0, capacity: 8, pct: 63 },
                ].map(g => (
                  <div key={g.type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate font-medium">{g.type}</span>
                      <span className="font-bold text-navy">{g.pct}% · {g.sessions} sessions</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${g.pct >= 85 ? 'bg-green-500' : g.pct >= 75 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${g.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Documentation Compliance by Facilitator</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Facilitator</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Sessions</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Signed</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Draft</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Missing</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'Sarah Jenkins, LCPC', sessions: 14, signed: 13, draft: 1, missing: 0 },
                    { name: 'David Odom, LCADC', sessions: 12, signed: 10, draft: 1, missing: 1 },
                    { name: 'Marcus Chen, CAC-AD', sessions: 10, signed: 8, draft: 2, missing: 0 },
                    { name: 'Priya Nair, MSW', sessions: 6, signed: 4, draft: 1, missing: 1 },
                  ].map(f => {
                    const pct = Math.round((f.signed / f.sessions) * 100);
                    return (
                      <tr key={f.name} className="hover:bg-gray-50">
                        <td className="py-2 font-medium text-navy">{f.name}</td>
                        <td className="py-2 text-center text-slate">{f.sessions}</td>
                        <td className="py-2 text-center text-green-600 font-semibold">{f.signed}</td>
                        <td className="py-2 text-center text-amber-600">{f.draft}</td>
                        <td className="py-2 text-center text-red-600">{f.missing}</td>
                        <td className="py-2 text-center">
                          <span className={`font-bold text-xs ${pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <strong>Action Needed:</strong> David Odom and Priya Nair have unsigned sessions &gt;48h old. Supervisor follow-up recommended.
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Patient Participation Quality — This Week</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-bg text-slate">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Patient</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Groups Attended</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Groups Missed</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Participation Level</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Engagement Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'Marcus Webb', attended: 12, missed: 1, level: 'High', trend: '↑' },
                    { name: 'Linda Farris', attended: 10, missed: 3, level: 'Moderate', trend: '→' },
                    { name: 'Robert Navarro', attended: 11, missed: 2, level: 'High', trend: '↑' },
                    { name: 'Samantha Choi', attended: 9, missed: 4, level: 'Low', trend: '↓' },
                    { name: 'Thomas Reilly', attended: 7, missed: 1, level: 'Moderate', trend: '↑' },
                    { name: 'Elena Vasquez', attended: 8, missed: 0, level: 'High', trend: '↑' },
                  ].map(p => (
                    <tr key={p.name} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-navy">{p.name}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-green-600">{p.attended}</td>
                      <td className="px-3 py-2.5 text-center text-red-600">{p.missed}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.level === 'High' ? 'bg-green-100 text-green-700' : p.level === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{p.level}</span>
                      </td>
                      <td className={`px-3 py-2.5 text-center font-bold text-lg ${p.trend === '↑' ? 'text-green-600' : p.trend === '↓' ? 'text-red-600' : 'text-slate'}`}>{p.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {view === 'Facilitator Stats' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Group facilitation metrics by staff — session volume, attendance averages, note completion rates, and patient satisfaction scores.</div>
          <div className="card overflow-hidden">
            <h3 className="font-semibold text-navy text-sm mb-3">Facilitator Performance — Trailing 30 Days</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Facilitator', 'Sessions Led', 'Avg Attendance', 'Note Completion', 'On-Time Rate', 'Patient Satisfaction', 'Specialty'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'T. Jackson, CAC-AD', sessions: 18, avg: 8.4, notes: '100%', onTime: '94%', sat: 4.7, spec: 'CBT / Relapse Prev.' },
                  { name: 'A. Brooks, LCPC', sessions: 14, avg: 7.1, notes: '86%', onTime: '89%', sat: 4.4, spec: 'Trauma / DBT' },
                  { name: 'M. Rivera, MS', sessions: 16, avg: 7.9, notes: '94%', onTime: '97%', sat: 4.6, spec: 'Psychoeducation' },
                  { name: 'D. Williams, CAC-AD', sessions: 12, avg: 6.8, notes: '75%', onTime: '83%', sat: 4.1, spec: '12-Step / Spirituality' },
                  { name: 'P. Chen, LCADC', sessions: 10, avg: 6.2, notes: '100%', onTime: '100%', sat: 4.8, spec: 'Family Systems' },
                  { name: 'K. Nguyen, CAC-AD', sessions: 8, avg: 5.9, notes: '88%', onTime: '88%', sat: 4.3, spec: 'Anger Mgmt / Life Skills' },
                ].map(f => (
                  <tr key={f.name} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-navy">{f.name}</td>
                    <td className="px-3 py-2.5 text-center text-slate">{f.sessions}</td>
                    <td className="px-3 py-2.5 text-center text-slate">{f.avg}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-semibold ${parseInt(f.notes) >= 95 ? 'text-green-600' : parseInt(f.notes) >= 80 ? 'text-blue-600' : 'text-amber-600'}`}>{f.notes}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-semibold ${parseInt(f.onTime) >= 95 ? 'text-green-600' : parseInt(f.onTime) >= 85 ? 'text-slate' : 'text-amber-600'}`}>{f.onTime}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="font-bold text-navy">{f.sat}</span><span className="text-slate">/5</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate">{f.spec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'Curriculum Map' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Weekly group therapy curriculum map — ensures topic variety, evidence-based coverage, and ASAM compliance across all programs.</div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">This Week's Group Curriculum — July 20–26, 2026</h3>
            <div className="overflow-x-auto text-xs">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-gray-50 text-slate">
                    {['Time', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Weekend'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { time: '9:00 AM', mon: 'Psychoeducation: Addiction & the Brain', tue: 'CBT: Thought Records', wed: 'Relapse Prevention Planning', thu: 'MI: Values Clarification', fri: 'Goal Setting Workshop', wknd: 'Alumni AA/NA Meeting' },
                    { time: '10:30 AM', mon: 'Morning Check-in Group', tue: 'Morning Check-in Group', wed: 'Morning Check-in Group', thu: 'Morning Check-in Group', fri: 'Morning Check-in Group', wknd: 'Mindfulness Session' },
                    { time: '1:00 PM', mon: 'Trauma: Psychoeducation (EMDR-informed)', tue: 'DBT: Distress Tolerance', wed: 'Family Roles & Boundaries', thu: 'Anger Management', fri: 'Life Skills: Financial Recovery', wknd: 'Creative Expression' },
                    { time: '2:30 PM', mon: '12-Step Facilitation', tue: 'Co-occurring Disorders', wed: 'Healthy Relationships', thu: '12-Step Facilitation', fri: 'Process Group', wknd: 'Open (Optional)' },
                    { time: '4:00 PM', mon: 'Mindfulness & Meditation', tue: 'Relapse Prevention: Triggers', wed: 'Coping Skills Practice', thu: 'Anger & Stress Management', fri: 'Community Meeting / Goals', wknd: 'Recreational Therapy' },
                  ].map(r => (
                    <tr key={r.time} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-mono font-bold text-navy shrink-0">{r.time}</td>
                      {[r.mon, r.tue, r.wed, r.thu, r.fri, r.wknd].map((g, i) => (
                        <td key={i} className="px-3 py-2.5 text-navy">{g}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Modality Coverage This Week</h3>
              <div className="space-y-2 text-xs">
                {[
                  { mod: 'Psychoeducation', sessions: 4, pct: 17, color: 'bg-blue-500', req: '≥3' },
                  { mod: 'CBT / Skills', sessions: 5, pct: 21, color: 'bg-purple-500', req: '≥4' },
                  { mod: 'Trauma-Informed', sessions: 2, pct: 8, color: 'bg-orange-400', req: '≥2' },
                  { mod: '12-Step Facilitation', sessions: 2, pct: 8, color: 'bg-green-500', req: '≥2' },
                  { mod: 'Relapse Prevention', sessions: 3, pct: 13, color: 'bg-teal-500', req: '≥3' },
                  { mod: 'Process Group', sessions: 2, pct: 8, color: 'bg-amber-500', req: '≥1' },
                  { mod: 'Mindfulness', sessions: 2, pct: 8, color: 'bg-pink-400', req: '≥2' },
                  { mod: 'Life Skills', sessions: 3, pct: 13, color: 'bg-gray-500', req: '≥2' },
                ].map(m => (
                  <div key={m.mod} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-slate">{m.mod}</span>
                        <span className="text-[10px] text-navy font-semibold">{m.sessions} sessions · Req: {m.req}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className={`h-1.5 rounded-full ${m.color}`} style={{ width: `${m.pct * 4}%` }} />
                      </div>
                    </div>
                    <span className="text-green-500 shrink-0">✓</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">ASAM Minimum Hours Compliance</h3>
              <div className="space-y-2 text-xs">
                {[
                  { loc: 'Residential (3.5)', required: '≥5h/day', actual: '6.5h/day', ok: true },
                  { loc: 'PHP (2.5)', required: '≥3h/day, ≥5d', actual: '3.5h/day, 5d', ok: true },
                  { loc: 'IOP (2.1)', required: '≥3h/day, ≥3d/wk', actual: '3h/day, 3d/wk', ok: true },
                ].map(l => (
                  <div key={l.loc} className="border border-border rounded p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-navy">{l.loc}</span>
                      <span className="text-green-500 font-bold">✓ Compliant</span>
                    </div>
                    <div className="flex gap-6 text-slate mt-0.5">
                      <span>Required: <strong className="text-slate">{l.required}</strong></span>
                      <span>Actual: <strong className="text-teal-600">{l.actual}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'Documentation Standards' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Group therapy documentation standards — required elements, format guidance, and common documentation errors.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Required Elements in Every Group Note</h3>
              <div className="space-y-1.5 text-xs">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 font-medium text-[10px]">CARF QI.M.3 requires group notes within 24h of session; state licensure requires within same business day for residential.</div>
                {[
                  { item: 'Group name, date, and session start/end time', req: true },
                  { item: 'Topic / curriculum unit covered', req: true },
                  { item: 'Attendance roster with each patient\'s participation level', req: true },
                  { item: 'Facilitator name and credentials', req: true },
                  { item: 'Co-facilitator / observer name (if applicable)', req: false },
                  { item: 'Patient-specific behavioral observation (per-patient note or group narrative)', req: true },
                  { item: 'Therapeutic interventions used during session (MI techniques, CBT, etc.)', req: true },
                  { item: 'Patient response to interventions', req: true },
                  { item: 'Any safety concerns raised and action taken', req: true },
                  { item: 'Link to treatment plan goal addressed', req: true },
                  { item: 'Facilitator signature and date/time', req: true },
                ].map(r => (
                  <div key={r.item} className="flex items-start gap-2 border border-border rounded-lg px-2.5 py-2">
                    <span className={`font-bold mt-0.5 shrink-0 ${r.req ? 'text-green-500' : 'text-slate'}`}>{r.req ? '✓' : '○'}</span>
                    <span className="text-navy">{r.item}</span>
                    {r.req && <span className="text-[8px] font-bold bg-red-100 text-red-700 px-1 py-0.5 rounded ml-auto shrink-0">Required</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Group Note Format — DAP Example</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Data', content: 'Group met for 60 minutes, 7/8 patients in attendance. Session topic: Relapse Prevention — Identifying High-Risk Situations. Patient W. presented concrete examples of triggers (work stress, social isolation). Patient R. remained quiet but engaged nonverbally. Patient F. disclosed a near-relapse scenario and received group support.' },
                    { label: 'Assessment', content: 'Overall group engagement was moderate-high. Patient W. demonstrated strong insight; addressed in treatment plan Goal 2 (coping skills development). Patient F.\'s disclosure indicates progress in willingness to be vulnerable; Goal 3 (peer trust) advancing. Patient R. consistent with avoidant pattern — will address in individual session.' },
                    { label: 'Plan', content: 'Next session: High-Risk Situations — Coping Strategies Practice (curriculum Week 4, Day 3). Individual follow-up scheduled with Patient F. regarding disclosure. Patient R. discussed with primary counselor — increased individual contact planned.' },
                  ].map(s => (
                    <div key={s.label} className="border border-border rounded-xl p-2.5">
                      <div className="font-bold text-navy uppercase text-[10px] tracking-wider mb-1">{s.label}</div>
                      <div className="text-slate leading-relaxed">{s.content}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-2">Common Documentation Errors to Avoid</h3>
                <div className="space-y-1.5 text-xs">
                  {[
                    '"Patient participated appropriately" — too vague; describe specific behaviors observed',
                    'Copying the same note for multiple patients — each patient needs individualized observation',
                    'Missing link to a treatment plan goal — every note must tie to at least one goal',
                    'Omitting safety-relevant content raised in group (e.g., suicidal ideation disclosure)',
                    'Late documentation — notes entered >24h after session require late entry notation',
                  ].map(e => (
                    <div key={e} className="flex gap-1.5 border border-red-100 bg-red-50 rounded-lg px-2.5 py-2">
                      <span className="text-red-400 shrink-0 font-bold">✗</span>
                      <span className="text-red-800">{e}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {groupNoteSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <span>✓</span> {groupNoteSaved}
        </div>
      )}
    </div>
  );
}
