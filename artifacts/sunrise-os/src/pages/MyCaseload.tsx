import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { CheckCircle, Clock, AlertTriangle, FileText, Calendar, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

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

export function MyCaseload({ navigate }: Props) {
  const [tab, setTab] = useState<'Overview' | 'Schedule' | 'Notes Due' | 'Tasks'>('Overview');

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
          <button onClick={() => navigate('ProgressNotes')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> New Note
          </button>
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
        {(['Overview', 'Schedule', 'Notes Due', 'Tasks'] as const).map(t => (
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
                <button onClick={() => navigate('ProgressNotes')} className="ml-auto btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0">
                  <FileText className="w-3 h-3" /> Write Note
                </button>
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
                  <button className="text-xs btn-primary px-3 py-1.5">Complete</button>
                  <button className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50" onClick={() => navigate('PatientDetail', task.patientId)}>Open Chart</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
