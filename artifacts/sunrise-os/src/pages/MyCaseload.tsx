import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { CheckCircle, Clock, AlertTriangle, FileText, Calendar, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

// Counselor assignments from mock data
const MY_COUNSELOR = 'Sarah Jenkins, LPC';

const MY_PATIENTS = MOCK_PATIENTS.filter(p => p.counselor === MY_COUNSELOR);

const MY_SESSIONS = [
  { time: '9:00 AM', type: 'Group', name: 'Morning Process Group', location: 'Group Room A', patientCount: 10 },
  { time: '10:30 AM', type: '1:1', name: 'Marcus Webb', patientId: 'p1', location: 'Office 3', note: 'AMA risk — safety check-in' },
  { time: '11:15 AM', type: '1:1', name: 'James Thornton', patientId: 'p3', location: 'Office 3', note: 'Withdrawal support — COWS update' },
  { time: '1:30 PM', type: '1:1', name: 'Patricia Nguyen', patientId: 'p8', location: 'Office 3', note: 'EMDR session 3' },
  { time: '2:15 PM', type: '1:1', name: 'Krystal Reeves', patientId: 'p20', location: 'Office 3', note: 'DV safety planning review' },
  { time: '3:00 PM', type: 'Shift Handoff', name: 'Handoff to Evening Team', location: 'Conference Room', patientCount: 18 },
  { time: '7:00 PM', type: 'Group', name: 'Evening Reflection', location: 'Group Room A', patientCount: 14 },
];

const NOTES_DUE = [
  { patientId: 'p1', patientName: 'Marcus Webb', type: 'Individual 1:1', sessionDate: '2026-07-18', dueDate: '2026-07-19', status: 'Overdue' },
  { patientId: 'p3', patientName: 'James Thornton', type: 'Withdrawal Support', sessionDate: '2026-07-18', dueDate: '2026-07-19', status: 'Due Today' },
  { patientId: 'p8', patientName: 'Patricia Nguyen', type: 'Individual 1:1', sessionDate: '2026-07-17', dueDate: '2026-07-18', status: 'Overdue' },
  { patientId: 'p17', patientName: 'Travis Holden', type: 'AMA Check-in', sessionDate: '2026-07-19', dueDate: '2026-07-20', status: 'Due Tomorrow' },
];

const PENDING_TASKS = [
  { type: 'Treatment Plan Update', patientId: 'p1', patient: 'Marcus Webb', due: '2026-07-21', priority: 'High', detail: 'Review at 30 days — AMA risk goals need updating' },
  { type: 'Treatment Plan Update', patientId: 'p3', patient: 'James Thornton', due: '2026-07-18', priority: 'Overdue', detail: 'Day 7 of admission — initial plan required' },
  { type: 'Co-sign Request', patientId: 'p6', patient: 'Destiny Williams', due: '2026-07-19', priority: 'High', detail: 'BHT note 7/18 — 48h co-sign window closing' },
  { type: 'Psychosocial Assessment', patientId: 'p17', patient: 'Travis Holden', due: '2026-07-19', priority: 'Due Today', detail: 'Admission bio-psychosocial assessment not yet completed' },
  { type: 'Court Report', patientId: 'p4', patient: 'Robert Navarro', due: '2026-07-30', priority: 'Upcoming', detail: 'Pretrial diversion court report due 7/30' },
];

const PRIORITY_STYLE: Record<string, string> = {
  Overdue:    'bg-red-100 text-red-700',
  High:       'bg-amber-100 text-amber-700',
  'Due Today': 'bg-orange-100 text-orange-700',
  'Due Tomorrow': 'bg-yellow-100 text-yellow-700',
  Upcoming:   'bg-gray-100 text-gray-600',
};

const TREND_ICON = (current: number, prev: number) => {
  if (current > prev) return <TrendingUp className="w-3 h-3 text-red-500" />;
  if (current < prev) return <TrendingDown className="w-3 h-3 text-green-500" />;
  return <Minus className="w-3 h-3 text-slate" />;
};

const CASELOAD_RADAR = [
  { subject: 'Engagement', A: 78 },
  { subject: 'Documentation', A: 62 },
  { subject: 'Goal Progress', A: 71 },
  { subject: 'Family Involvement', A: 55 },
  { subject: 'Recovery Score', A: 80 },
  { subject: 'Attendance', A: 88 },
];

export function MyCaseload({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Overview' | 'Schedule' | 'Notes Due' | 'Tasks' | 'Analytics' | 'Supervision' | 'My Goals'>('Overview');

  const overdueNotes = NOTES_DUE.filter(n => n.status === 'Overdue').length;
  const overdueTasks = PENDING_TASKS.filter(t => t.priority === 'Overdue').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">My Caseload</h1>
          <p className="text-slate text-sm mt-0.5">{MY_COUNSELOR} · July 19, 2026 · Day Shift</p>
        </div>
        <div className="flex gap-2">
          <LockedButton locked={readOnly} onClick={() => navigate('ProgressNotes')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> New Note
          </LockedButton>
        </div>
      </div>

      {/* Alerts */}
      {(overdueNotes > 0 || overdueTasks > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="text-sm text-red-800">
            <strong>Attention: </strong>
            {overdueNotes > 0 && `${overdueNotes} overdue note${overdueNotes > 1 ? 's' : ''}`}
            {overdueNotes > 0 && overdueTasks > 0 && ' · '}
            {overdueTasks > 0 && `${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}`}
            . Complete before end of shift.
          </div>
          <button onClick={() => setTab('Notes Due')} className="ml-auto text-sm text-red-700 font-semibold hover:underline shrink-0">Review</button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'My Patients', value: MY_PATIENTS.length, sub: 'Active caseload', color: 'text-navy' },
          { label: "Today's Sessions", value: MY_SESSIONS.filter(s => s.type === '1:1').length, sub: 'Individual sessions', color: 'text-navy' },
          { label: 'Notes Overdue', value: overdueNotes, sub: 'Requires immediate action', color: overdueNotes > 0 ? 'text-red-600' : 'text-green-600' },
          { label: 'Open Tasks', value: PENDING_TASKS.length, sub: `${overdueTasks} overdue`, color: overdueTasks > 0 ? 'text-amber-600' : 'text-navy' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Overview', 'Schedule', 'Notes Due', 'Tasks', 'Analytics', 'Supervision', 'My Goals'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>
            {t}
            {t === 'Notes Due' && NOTES_DUE.filter(n=>n.status==='Overdue').length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{NOTES_DUE.filter(n=>n.status==='Overdue').length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="space-y-3">
          {MY_PATIENTS.map(p => {
            const noteDue = NOTES_DUE.find(n => n.patientId === p.id);
            const taskPending = PENDING_TASKS.filter(t => t.patientId === p.id);
            return (
              <div key={p.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('PatientDetail', p.id)}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-navy">{p.firstName} {p.lastName}</span>
                      <span className="text-xs text-slate">{p.mrn} · {p.program} · Day {p.los}</span>
                      {noteDue && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLE[noteDue.status]}`}>
                          {noteDue.status}: {noteDue.type} Note
                        </span>
                      )}
                      {taskPending.length > 0 && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          {taskPending.length} open task{taskPending.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-6 mt-1.5 text-xs text-slate">
                      <span className="truncate max-w-[200px]">{p.primaryDiagnosis}</span>
                      <span className="flex items-center gap-1">
                        Mood: <strong className={p.mood >= 7 ? 'text-green-600' : p.mood >= 5 ? 'text-amber-600' : 'text-red-600'}>{p.mood}/10</strong>
                        {TREND_ICON(p.mood, p.mood - 1)}
                      </span>
                      <span className="flex items-center gap-1">
                        Craving: <strong className={p.craving <= 3 ? 'text-green-600' : p.craving <= 6 ? 'text-amber-600' : 'text-red-600'}>{p.craving}/10</strong>
                        {TREND_ICON(p.craving, p.craving + 1)}
                      </span>
                      <span>AMA Risk: <strong className={p.amaRisk === 'High' ? 'text-red-600' : p.amaRisk === 'Med' ? 'text-amber-600' : 'text-green-600'}>{p.amaRisk}</strong></span>
                    </div>
                    <div className="text-xs text-slate mt-1">
                      Next: <span className="font-medium text-navy">{p.nextAppointment}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="w-20 bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${p.recoveryScore >= 70 ? 'bg-green-500' : p.recoveryScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${p.recoveryScore}%` }} />
                    </div>
                    <span className="text-xs text-slate">Score: <strong className="text-navy">{p.recoveryScore}</strong></span>
                    <div className="flex gap-1 mt-1">
                      <button className="text-[10px] border border-orange text-orange px-2 py-1 rounded hover:bg-orange/5"
                        onClick={e => { e.stopPropagation(); navigate('ProgressNotes'); }}>+ Note</button>
                      <button className="text-[10px] border border-border text-slate px-2 py-1 rounded hover:bg-gray-50"
                        onClick={e => { e.stopPropagation(); navigate('PatientDetail', p.id); }}>Chart</button>
                    </div>
                  </div>
                </div>
                {p.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-border">
                    {p.flags.map((f, i) => (
                      <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        f.type === 'Medical' ? 'bg-red-100 text-red-700' :
                        f.type === 'Behavioral' ? 'bg-orange-100 text-orange-700' :
                        f.type === 'Psychiatric' ? 'bg-purple-100 text-purple-700' :
                        f.type === 'AMA' ? 'bg-navy text-white' :
                        'bg-gray-100 text-gray-600'
                      }`}>{f.type}: {f.note.substring(0, 45)}{f.note.length > 45 ? '…' : ''}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Schedule' && (
        <div className="space-y-3">
          <div className="text-xs text-slate">Today's schedule for {MY_COUNSELOR}</div>
          {MY_SESSIONS.map((s, i) => (
            <div key={i} className={`card flex items-center gap-4 ${s.type === 'Group' ? 'border-blue-200 bg-blue-50/30' : s.type === 'Shift Handoff' ? 'border-gray-300 bg-gray-50' : ''}`}>
              <div className="text-sm font-mono font-semibold text-slate w-20 shrink-0">{s.time}</div>
              <div className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${s.type === 'Group' ? 'bg-blue-100 text-blue-700' : s.type === '1:1' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                {s.type}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-navy text-sm cursor-pointer hover:text-orange"
                  onClick={() => s.patientId ? navigate('PatientDetail', s.patientId) : undefined}>
                  {s.name}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate mt-0.5">
                  <span>{s.location}</span>
                  {s.note && <span className="italic text-amber-600">{s.note}</span>}
                  {s.patientCount && <span>{s.patientCount} patients</span>}
                </div>
              </div>
              {s.patientId && (
                <button onClick={() => navigate('ProgressNotes')} className="text-xs border border-orange text-orange px-3 py-1.5 rounded-lg hover:bg-orange/5 flex items-center gap-1 shrink-0">
                  <FileText className="w-3 h-3" /> Note
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'Notes Due' && (
        <div className="space-y-3">
          {NOTES_DUE.map((n, i) => (
            <div key={i} className={`card border ${n.status === 'Overdue' ? 'border-red-300 bg-red-50/30' : n.status === 'Due Today' ? 'border-amber-300 bg-amber-50/20' : ''}`}>
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLE[n.status]}`}>{n.status}</span>
                    <button className="font-bold text-navy hover:text-orange text-sm" onClick={() => navigate('PatientDetail', n.patientId)}>{n.patientName}</button>
                    <span className="text-xs text-slate">{n.type} — session {n.sessionDate}</span>
                  </div>
                  <div className="text-xs text-slate mt-0.5">Due: {n.dueDate}</div>
                </div>
                <LockedButton locked={readOnly} onClick={() => navigate('ProgressNotes')} className="ml-auto btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0">
                  <FileText className="w-3 h-3" /> Write Note
                </LockedButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Tasks' && (
        <div className="space-y-3">
          {PENDING_TASKS.map((task, i) => (
            <div key={i} className={`card border ${task.priority === 'Overdue' ? 'border-red-300 bg-red-50/20' : task.priority === 'High' || task.priority === 'Due Today' ? 'border-amber-300 bg-amber-50/20' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLE[task.priority]}`}>{task.priority}</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{task.type}</span>
                    <button className="font-bold text-navy hover:text-orange text-sm" onClick={() => navigate('PatientDetail', task.patientId)}>{task.patient}</button>
                  </div>
                  <p className="text-sm text-navy mt-1.5">{task.detail}</p>
                  <div className="text-xs text-slate mt-0.5">Due: <span className={`font-medium ${task.priority === 'Overdue' ? 'text-red-600' : 'text-navy'}`}>{task.due}</span></div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <LockedButton locked={readOnly} className="text-xs btn-primary px-3 py-1.5">Complete</LockedButton>
                  <button className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50" onClick={() => navigate('PatientDetail', task.patientId)}>Open Chart</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'Analytics' && (
        <div className="space-y-6">
          {/* Patient progress bars */}
          <div className="card">
            <div className="text-sm font-semibold text-navy mb-4">Patient Progress — Current Caseload</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MY_PATIENTS.map(p => ({ name: `${p.firstName[0]}. ${p.lastName}`, recovery: p.recoveryScore, craving: 100 - (p.craving * 10), mood: p.mood * 10 }))}
                  margin={{ top: 0, right: 10, bottom: 20, left: -10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} angle={-20} textAnchor="end" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                  <Tooltip formatter={(v: number, n: string) => [`${v}`, n]} />
                  <Bar dataKey="recovery" name="Recovery Score" fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="mood" name="Mood (×10)" fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="craving" name="Craving Control" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Caseload radar */}
            <div className="card">
              <div className="text-sm font-semibold text-navy mb-3">Caseload Health Radar</div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={CASELOAD_RADAR}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="Caseload" dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AMA risk & flag summary */}
            <div className="card">
              <div className="text-sm font-semibold text-navy mb-4">Risk & Flag Summary</div>
              <div className="space-y-3">
                {[
                  { label: 'High AMA Risk', count: MY_PATIENTS.filter(p=>p.amaRisk==='High').length, total: MY_PATIENTS.length, color: 'bg-red-500' },
                  { label: 'Med AMA Risk', count: MY_PATIENTS.filter(p=>p.amaRisk==='Med').length, total: MY_PATIENTS.length, color: 'bg-amber-500' },
                  { label: 'Low Recovery Score (<60)', count: MY_PATIENTS.filter(p=>p.recoveryScore<60).length, total: MY_PATIENTS.length, color: 'bg-orange-500' },
                  { label: 'High Cravings (≥7)', count: MY_PATIENTS.filter(p=>p.craving>=7).length, total: MY_PATIENTS.length, color: 'bg-purple-500' },
                  { label: 'Flagged Patients', count: MY_PATIENTS.filter(p=>p.flags.length>0).length, total: MY_PATIENTS.length, color: 'bg-navy' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate">{r.label}</span>
                      <span className="font-semibold text-navy">{r.count}/{r.total}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${(r.count/r.total)*100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Documentation status */}
          <div className="card">
            <div className="text-sm font-semibold text-navy mb-3">Documentation Compliance</div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Notes On Time', value: NOTES_DUE.filter(n=>n.status==='Due Tomorrow').length, total: NOTES_DUE.length, good: true },
                { label: 'Notes Overdue', value: NOTES_DUE.filter(n=>n.status==='Overdue').length, total: NOTES_DUE.length, good: false },
                { label: 'Tasks Complete', value: 0, total: PENDING_TASKS.length, good: true },
                { label: 'Avg Response Time', value: '4.2h', total: null, good: true },
              ].map(d => (
                <div key={d.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className={`text-2xl font-bold ${d.good ? 'text-green-600' : 'text-red-600'}`}>
                    {d.total !== null ? `${d.value}/${d.total}` : d.value}
                  </div>
                  <div className="text-xs text-slate mt-1">{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Supervision' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Clinical supervision notes, competency tracking, and goal progress for ongoing licensure requirements.</div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Supervision Hours (YTD)', value: '42 hrs', sub: 'Individual + group', color: 'text-navy' },
              { label: 'Next Supervision Session', value: 'Jul 21', sub: '2:00 PM with Dr. Carter', color: 'text-amber-600' },
              { label: 'Licensure Goal Progress', value: '67%', sub: '1,240 / 2,000 hrs toward LPC', color: 'text-green-600' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Recent Supervision Sessions</h3>
              <div className="space-y-3">
                {[
                  { date: '2026-07-07', type: 'Individual', supervisor: 'Dr. James Carter, CADC-III', duration: '60 min', topics: 'Trauma-informed care with Marcus Webb; countertransference with high-acuity caseload; boundary review', competency: 'Trauma-Informed Practice' },
                  { date: '2026-06-30', type: 'Group', supervisor: 'Dr. James Carter', duration: '90 min', topics: 'Motivational Interviewing role-play; co-occurring PTSD/SUD documentation practices; ethics case study', competency: 'MI / Documentation' },
                  { date: '2026-06-23', type: 'Individual', supervisor: 'Dr. James Carter', duration: '60 min', topics: 'Treatment plan goal-writing workshop; ASAM Level of Care criteria for PHP vs. residential', competency: 'Treatment Planning' },
                  { date: '2026-06-16', type: 'Individual', supervisor: 'Dr. James Carter', duration: '60 min', topics: 'Crisis response review — C-SSRS administration case study; mandatory reporting obligations TN', competency: 'Crisis Intervention' },
                ].map(s => (
                  <div key={s.date} className="border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-navy">{s.date}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.type === 'Individual' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{s.type}</span>
                      <span className="text-[10px] text-slate">{s.duration}</span>
                      <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full ml-auto">{s.competency}</span>
                    </div>
                    <div className="text-xs text-slate">{s.topics}</div>
                    <div className="text-[10px] text-slate mt-1">Supervisor: {s.supervisor}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Competency Development Goals (2026)</h3>
                <div className="space-y-3">
                  {[
                    { competency: 'Trauma-Informed Care (EMDR Basics)', target: 'Complete 14-hr EMDR Level 1 training', progress: 50, status: 'In Progress' },
                    { competency: 'Co-occurring Disorders', target: 'NAADAC CCJP certification module', progress: 80, status: 'Nearly Complete' },
                    { competency: 'Motivational Interviewing', target: 'Achieve MINT-recognized proficiency', progress: 100, status: 'Completed' },
                    { competency: 'Group Facilitation', target: 'Lead 3 evidence-based groups independently', progress: 67, status: 'In Progress' },
                    { competency: 'Documentation Timeliness', target: 'Zero overdue notes for 60 consecutive days', progress: 35, status: 'In Progress' },
                  ].map(g => (
                    <div key={g.competency}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-navy">{g.competency}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${g.status === 'Completed' ? 'bg-green-100 text-green-700' : g.status === 'Nearly Complete' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{g.status}</span>
                      </div>
                      <div className="text-[10px] text-slate mb-1">{g.target}</div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${g.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${g.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-2">Supervisor Feedback — Last Session</h3>
                <div className="p-3 bg-navy/5 rounded-lg text-xs text-navy italic leading-relaxed">
                  "Sarah demonstrates strong rapport-building skills and patient-centered documentation. Key growth area this quarter is increasing structured treatment plan goal-writing with SMART criteria. Recommend EMDR Level 1 training before Q4 to expand trauma-competency. Countertransference awareness is developing well — self-care plan review at next session."
                </div>
                <div className="text-[10px] text-slate mt-2">— Dr. James Carter, CADC-III · July 7, 2026</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'My Goals' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Personal professional development goals — self-set objectives, supervisor-assigned targets, and progress tracking for the current review period.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Active Goals', value: 5, color: 'text-navy', sub: 'Current review period' },
              { label: 'On Track', value: 4, color: 'text-green-600', sub: '80% of active goals' },
              { label: 'CEU Hours Completed', value: 18, color: 'text-blue-600', sub: 'Of 40 required by Nov 2026' },
              { label: 'Supervision Hours (YTD)', value: 24, color: 'text-teal-600', sub: 'Toward CADC-II requirement' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Professional Development Goals — FY2026</h3>
            <div className="space-y-3 text-xs">
              {[
                {
                  goal: 'Earn CADC-II Certification', type: 'Credentialing', owner: 'Self', due: '2026-11-15',
                  progress: 45, milestones: ['Complete 40 CEU hours (18/40)', 'Log 100 supervision hours (24/100)', 'Pass written exam', 'Submit ethics documentation'],
                  status: 'In Progress', sColor: 'bg-blue-100 text-blue-700'
                },
                {
                  goal: 'Lead 2 psychoeducation groups per week independently', type: 'Clinical Skill', owner: 'Supervisor-Assigned', due: '2026-09-01',
                  progress: 75, milestones: ['Shadow A. Brooks for 4 sessions ✓', 'Co-facilitate 6 sessions ✓', 'Lead 8 sessions with feedback ✓', 'Lead independently (ongoing)'],
                  status: 'On Track', sColor: 'bg-green-100 text-green-700'
                },
                {
                  goal: 'Improve documentation timeliness to 95%+ on-time', type: 'Quality', owner: 'Supervisor-Assigned', due: 'Ongoing',
                  progress: 88, milestones: ['Baseline: 78% (May 2026) ✓', 'Month 1 target: 85% — achieved 86% ✓', 'Month 2 target: 90% — current: 88%', 'Sustained ≥95% for 60 days'],
                  status: 'On Track', sColor: 'bg-green-100 text-green-700'
                },
                {
                  goal: 'Complete MI Foundational Training (ATTC)', type: 'Training', owner: 'Self', due: '2026-08-31',
                  progress: 60, milestones: ['Enroll in course ✓', 'Complete modules 1–3 ✓', 'Complete modules 4–6 (in progress)', 'Earn 5-CEU certificate'],
                  status: 'In Progress', sColor: 'bg-blue-100 text-blue-700'
                },
                {
                  goal: 'Attend NAADAC Annual Conference', type: 'Professional Engagement', owner: 'Self', due: '2026-10-15',
                  progress: 20, milestones: ['Register for conference ✓', 'Prepare session calendar', 'Attend (Oct 2026)', 'Submit 8-CEU documentation'],
                  status: 'Planned', sColor: 'bg-gray-100 text-slate'
                },
              ].map(g => (
                <div key={g.goal} className="border border-border rounded-xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-semibold text-navy">{g.goal}</span>
                      <span className="text-slate ml-2">— {g.type} · {g.owner} · Due: {g.due}</span>
                    </div>
                    <span className={`shrink-0 ml-3 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${g.sColor}`}>{g.status}</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-[10px] text-slate mb-0.5">
                      <span>Progress</span>
                      <span className="font-semibold text-navy">{g.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-2 rounded-full bg-navy" style={{ width: `${g.progress}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.milestones.map(m => (
                      <span key={m} className={`text-[10px] px-2 py-0.5 rounded-full border ${m.includes('✓') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-border text-slate'}`}>{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
