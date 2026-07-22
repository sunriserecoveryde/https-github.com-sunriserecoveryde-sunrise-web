import React, { useState } from 'react';
import { Screen } from '../App';
import { Calendar as CalendarIcon, Users, User, Plus, Clock, ChevronLeft, ChevronRight, CheckCircle, X } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';
import { MOCK_PATIENTS } from '../data/mockPatients';

// ─── Types & data ─────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  day: number;   // 0-based index into current week
  startHour: number; // e.g. 9 = 9:00 AM
  durationHrs: number;
  type: 'Individual' | 'Group' | 'Medical' | 'Intake' | 'Discharge' | 'Family';
  title: string;
  subtitle: string;
  location: string;
  staff: string;
  patientId?: string;
}

const APPTS: Appointment[] = [
  // Monday 7/14
  { id: 'a1',  day: 0, startHour: 8,  durationHrs: 1,   type: 'Individual', title: '1:1 Marcus Webb',     subtitle: 'AMA Risk Follow-up', location: 'Room 12', staff: 'Sarah Jenkins, LPC', patientId: 'p1' },
  { id: 'a2',  day: 0, startHour: 9,  durationHrs: 1.5, type: 'Group',      title: 'Process Group A',     subtitle: 'Residential — 10 enrolled', location: 'Group Room A', staff: 'Maria Gonzales, LCSW' },
  { id: 'a3',  day: 0, startHour: 11, durationHrs: 0.5, type: 'Medical',    title: 'Dr. Chen Rounds',     subtitle: 'MAT review + COWS check', location: 'Med Suite', staff: 'Dr. Robert Chen' },
  { id: 'a4',  day: 0, startHour: 14, durationHrs: 1,   type: 'Family',     title: 'Kowalski Family Mtg', subtitle: 'Brian K. — communication skills', location: 'Room 4', staff: 'David Odom, LMFT', patientId: 'p7' },
  // Tuesday 7/15
  { id: 'a5',  day: 1, startHour: 8,  durationHrs: 1.5, type: 'Group',      title: 'Psychoeducation',     subtitle: 'Disease model of addiction', location: 'Group Room B', staff: 'David Odom, LMFT' },
  { id: 'a6',  day: 1, startHour: 10, durationHrs: 1,   type: 'Individual', title: '1:1 Samantha Choi',   subtitle: 'DBT distress tolerance', location: 'Room 8', staff: 'Sarah Jenkins, LPC', patientId: 'p2' },
  { id: 'a7',  day: 1, startHour: 14, durationHrs: 1,   type: 'Medical',    title: 'Psych Eval — Choi',   subtitle: 'Dr. Hughes — Seroquel adjustment', location: 'Psych Office', staff: 'Dr. Allen Hughes', patientId: 'p2' },
  { id: 'a8',  day: 1, startHour: 15, durationHrs: 0.5, type: 'Individual', title: '1:1 Robert Navarro',  subtitle: 'HALT worksheet review', location: 'Room 12', staff: 'Maria Gonzales, LCSW', patientId: 'p5' },
  // Wednesday 7/16
  { id: 'a9',  day: 2, startHour: 8,  durationHrs: 1,   type: 'Individual', title: '1:1 James Thornton',  subtitle: 'Craving management plan', location: 'Room 10', staff: 'Sarah Jenkins, LPC', patientId: 'p3' },
  { id: 'a10', day: 2, startHour: 9,  durationHrs: 1.5, type: 'Group',      title: 'Relapse Prevention',  subtitle: 'HALT & high-risk situations', location: 'Group Room A', staff: 'Maria Gonzales, LCSW' },
  { id: 'a11', day: 2, startHour: 13, durationHrs: 1,   type: 'Intake',     title: 'Admission: K. Torres','subtitle': 'Residential PHP intake', location: 'Intake Suite', staff: 'Amanda Lewis' },
  { id: 'a12', day: 2, startHour: 15, durationHrs: 1,   type: 'Medical',    title: 'Dr. Stone Rounds',    subtitle: 'Lab review + med reconciliation', location: 'Med Suite', staff: 'Dr. Emily Stone' },
  // Thursday 7/17
  { id: 'a13', day: 3, startHour: 9,  durationHrs: 1.5, type: 'Group',      title: 'Trauma Group',        subtitle: 'PTSD & co-occurring disorders', location: 'Group Room C', staff: 'Dr. Allen Hughes' },
  { id: 'a14', day: 3, startHour: 11, durationHrs: 1,   type: 'Individual', title: '1:1 Patricia Holloway','subtitle': 'Treatment plan signature', location: 'Room 8', staff: 'Sarah Jenkins, LPC', patientId: 'p4' },
  { id: 'a15', day: 3, startHour: 14, durationHrs: 1,   type: 'Discharge',  title: 'DC Planning: Kowalski','subtitle': 'Brian K. — discharge Jul 22', location: 'Room 4', staff: 'David Odom, LMFT', patientId: 'p7' },
  { id: 'a16', day: 3, startHour: 15, durationHrs: 0.5, type: 'Medical',    title: 'Naltrexone Injection',  subtitle: 'Monthly Vivitrol — Navarro', location: 'Med Suite', staff: 'Dr. Robert Chen', patientId: 'p5' },
  // Friday 7/18
  { id: 'a17', day: 4, startHour: 8,  durationHrs: 1.5, type: 'Group',      title: 'Process Group A',     subtitle: 'Morning — mood & goal check-in', location: 'Group Room A', staff: 'Sarah Jenkins, LPC' },
  { id: 'a18', day: 4, startHour: 10, durationHrs: 1,   type: 'Family',     title: 'Webb Family Session',  subtitle: 'Marcus W. + spouse', location: 'Room 4', staff: 'David Odom, LMFT', patientId: 'p1' },
  { id: 'a19', day: 4, startHour: 13, durationHrs: 1,   type: 'Individual', title: '1:1 Linda Farris',    subtitle: 'Insurance auth + aftercare', location: 'Room 12', staff: 'Maria Gonzales, LCSW', patientId: 'p8' },
  { id: 'a20', day: 4, startHour: 15, durationHrs: 0.5, type: 'Discharge',  title: 'DC Summary: Holloway','subtitle': 'Patricia H. — PHP transition', location: 'Conf Room', staff: 'Sarah Jenkins, LPC', patientId: 'p4' },
];

const TYPE_STYLE: Record<Appointment['type'], { bg: string; label: string }> = {
  Individual: { bg: 'bg-sunrise-orange border-sunrise-orange text-white', label: 'Individual' },
  Group:      { bg: 'bg-sunrise-blue border-sunrise-blue text-white', label: 'Group' },
  Medical:    { bg: 'bg-critical border-critical text-white', label: 'Medical' },
  Intake:     { bg: 'bg-purple border-purple text-white', label: 'Intake' },
  Discharge:  { bg: 'bg-teal border-teal text-white', label: 'Discharge' },
  Family:     { bg: 'bg-success border-success text-white', label: 'Family' },
};

const DOT_STYLE: Record<Appointment['type'], string> = {
  Individual: 'bg-sunrise-orange',
  Group:      'bg-sunrise-blue',
  Medical:    'bg-critical',
  Intake:     'bg-purple',
  Discharge:  'bg-teal',
  Family:     'bg-success',
};

const WEEK_DAYS = ['Mon 7/20', 'Tue 7/21', 'Wed 7/22', 'Thu 7/23', 'Fri 7/24'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16];
const HOUR_LABELS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
const CURRENT_DAY = 2; // Wednesday Jul 22 (today in the demo)
const CURRENT_HOUR = 14; // 2:00 PM

// ─── Component ────────────────────────────────────────────────────────────

export function AppointmentCalendar({ navigate, readOnly }: { navigate: (s: Screen) => void; readOnly?: boolean }) {
  const [view, setView] = useState<'Week' | 'Day' | 'Analytics' | 'Waitlist' | 'Provider Schedules' | 'No-Show Tracker'>('Week');
  const [selectedDay, setSelectedDay] = useState(CURRENT_DAY);
  const [typeFilter, setTypeFilter] = useState<Appointment['type'] | 'All'>('All');
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [newApptOpen, setNewApptOpen] = useState(false);
  const [apptSaved, setApptSaved] = useState(false);
  const [newAppt, setNewAppt] = useState({ type: 'Individual' as Appointment['type'], day: CURRENT_DAY, start: '09:00', duration: '1', title: '', staff: '', location: '', patientId: '' });

  function handleSaveAppt() {
    setNewApptOpen(false);
    setApptSaved(true);
    setTimeout(() => setApptSaved(false), 2500);
    setNewAppt({ type: 'Individual', day: CURRENT_DAY, start: '09:00', duration: '1', title: '', staff: '', location: '', patientId: '' });
  }

  const filteredAppts = typeFilter === 'All' ? APPTS : APPTS.filter(a => a.type === typeFilter);

  const todayAppts = APPTS
    .filter(a => a.day === CURRENT_DAY)
    .sort((a, b) => a.startHour - b.startHour);

  const totalToday = todayAppts.length;
  const totalWeek  = APPTS.length;
  const groupsToday = todayAppts.filter(a => a.type === 'Group').length;
  const medicalToday = todayAppts.filter(a => a.type === 'Medical').length;

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-var(--topbar-height)-var(--banner-height)-48px)]">
      {/* Header */}
      <div className="flex justify-between items-end flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-sunrise-blue" /> Appointment Calendar
          </h1>
          <p className="text-slate text-sm mt-1">Week of July 20 – 26, 2026</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white rounded border border-border shadow-sm p-1">
            {(['Week', 'Day', 'Analytics', 'Waitlist', 'Provider Schedules', 'No-Show Tracker'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${view === v ? 'bg-bg text-navy shadow-sm' : 'text-slate hover:text-navy'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <LockedButton locked={readOnly} onClick={() => setNewApptOpen(true)} className="bg-sunrise-blue text-white px-4 py-2 rounded font-medium flex items-center gap-2 hover:bg-sunrise-blue-light shadow-sm transition-colors text-sm">
            <Plus className="w-4 h-4" /> New Appointment
          </LockedButton>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4 flex-shrink-0">
        {[
          { label: 'This Week', value: totalWeek, sub: 'total appointments' },
          { label: 'Today', value: totalToday, sub: 'scheduled' },
          { label: 'Groups Today', value: groupsToday, sub: 'therapy groups' },
          { label: 'Medical Today', value: medicalToday, sub: 'clinical visits' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-border rounded-lg shadow-sm p-3">
            <div className="text-[10px] font-bold text-slate uppercase tracking-wider">{k.label}</div>
            <div className="text-2xl font-bold text-navy">{k.value}</div>
            <div className="text-[11px] text-slate">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-60 flex flex-col gap-4 flex-shrink-0 overflow-y-auto no-scrollbar">
          {/* Filter by type */}
          <div className="bg-white p-3 rounded-lg shadow-sm border border-border">
            <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-2">Appointment Type</div>
            <div className="space-y-1">
              {(['All', 'Individual', 'Group', 'Medical', 'Intake', 'Discharge', 'Family'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`w-full flex items-center gap-2 text-xs font-medium py-1.5 px-2 rounded transition-colors ${typeFilter === t ? 'bg-slate-100 text-navy' : 'text-slate hover:bg-slate-50'}`}
                >
                  {t !== 'All' && <span className={`w-2.5 h-2.5 rounded-full flex-none ${DOT_STYLE[t]}`} />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Today's schedule */}
          <div className="bg-white p-3 rounded-lg shadow-sm border border-border flex-1 overflow-y-auto no-scrollbar">
            <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-2">Today (7/18)</div>
            <div className="space-y-2">
              {todayAppts.map(a => (
                <div
                  key={a.id}
                  onClick={() => setSelectedAppt(a)}
                  className={`p-2 rounded border text-xs cursor-pointer hover:shadow-sm transition-all border-l-2 ${
                    a.startHour === CURRENT_HOUR ? 'border-l-sunrise-orange bg-orange-50' : 'border-l-slate-300 bg-bg'
                  }`}
                >
                  <div className="font-bold text-navy">{HOUR_LABELS[a.startHour - 8]}</div>
                  <div className="font-medium text-slate truncate">{a.title}</div>
                  <div className="text-slate-light truncate">{a.staff}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-border flex flex-col overflow-hidden">
          {/* Day headers */}
          <div className="flex border-b border-border bg-bg flex-shrink-0">
            <div className="w-20 border-r border-border" />
            {WEEK_DAYS.map((day, i) => (
              <div
                key={i}
                className={`flex-1 p-3 text-center border-r border-border last:border-r-0 ${i === CURRENT_DAY ? 'bg-sunrise-blue/5' : ''}`}
              >
                <div className={`text-sm font-bold ${i === CURRENT_DAY ? 'text-sunrise-blue' : 'text-navy'}`}>
                  {day.split(' ')[0]}
                </div>
                <div className="text-xs text-slate">{day.split(' ')[1]}</div>
                {i === CURRENT_DAY && (
                  <div className="mt-1 text-[9px] font-bold text-sunrise-orange uppercase tracking-wide">Today</div>
                )}
              </div>
            ))}
          </div>

          {/* Hour rows */}
          <div className="flex-1 overflow-y-auto relative no-scrollbar">
            {HOURS.map((hour, hourIdx) => (
              <div key={hourIdx} className="flex border-b border-border" style={{ minHeight: 72 }}>
                <div className="w-20 border-r border-border p-2 text-[10px] font-medium text-slate text-right bg-white flex-shrink-0 pt-2">
                  {HOUR_LABELS[hourIdx]}
                </div>
                {WEEK_DAYS.map((_, dayIdx) => {
                  const appts = filteredAppts.filter(a => a.day === dayIdx && a.startHour === hour);
                  return (
                    <div key={dayIdx} className={`flex-1 border-r border-border last:border-r-0 relative p-0.5 ${dayIdx === CURRENT_DAY ? 'bg-blue-50/20' : ''}`}>
                      {appts.map(appt => (
                        <div
                          key={appt.id}
                          onClick={() => setSelectedAppt(appt)}
                          className={`rounded p-1.5 text-[10px] cursor-pointer hover:brightness-95 transition-all border shadow-sm mb-0.5 ${TYPE_STYLE[appt.type].bg}`}
                          style={{ minHeight: 44 }}
                        >
                          <div className="font-bold truncate leading-tight">{appt.title}</div>
                          <div className="opacity-80 truncate leading-tight">{appt.staff.split(',')[0]}</div>
                          <div className="opacity-70 truncate leading-tight">{appt.location}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Current time indicator (2:00 PM = hourIdx 6 of 9, so 6/9 of the way) */}
            <div
              className="absolute left-20 right-0 h-px bg-sunrise-orange z-20 pointer-events-none"
              style={{ top: `calc(${((CURRENT_HOUR - 8) / HOURS.length) * 100}% + 36px)` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-sunrise-orange -ml-1 -mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Appointment detail modal */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-navy/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAppt(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${TYPE_STYLE[selectedAppt.type].bg}`}>{selectedAppt.type}</span>
                <h3 className="text-lg font-bold text-navy mt-2">{selectedAppt.title}</h3>
                <p className="text-sm text-slate">{selectedAppt.subtitle}</p>
              </div>
              <button onClick={() => setSelectedAppt(null)} className="text-slate hover:text-navy text-xl leading-none">&times;</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate flex-none" />
                <span className="text-navy font-medium">{WEEK_DAYS[selectedAppt.day]} · {HOUR_LABELS[selectedAppt.startHour - 8]}</span>
                <span className="text-slate">({selectedAppt.durationHrs}h)</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate flex-none" />
                <span className="text-navy">{selectedAppt.staff}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate flex-none" />
                <span className="text-navy">{selectedAppt.location}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              {selectedAppt.patientId && (
                <button
                  onClick={() => { navigate('PatientDetail' as Screen); setSelectedAppt(null); }}
                  className="flex-1 bg-sunrise-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-sunrise-blue-light"
                >
                  Open Patient Chart
                </button>
              )}
              <button onClick={() => setSelectedAppt(null)} className="flex-1 border border-border text-slate px-4 py-2 rounded text-sm font-medium hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'Analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Appts This Week', value: totalWeek, sub: 'All types combined', color: 'text-navy' },
              { label: 'No-Show Rate', value: '12%', sub: 'Industry avg: 15%', color: 'text-green-600' },
              { label: 'Avg Appts / Clinician', value: '4.3', sub: 'Per day', color: 'text-blue-600' },
              { label: 'Telehealth vs. In-Person', value: '28% / 72%', sub: 'Of total visits', color: 'text-navy' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Appointments by Type — This Week</h3>
              <div className="space-y-2.5">
                {[
                  { type: 'Group Therapy', count: 18, color: 'bg-navy' },
                  { type: 'Individual Counseling', count: 12, color: 'bg-blue-500' },
                  { type: 'Medical', count: 8, color: 'bg-red-500' },
                  { type: 'Family Session', count: 4, color: 'bg-green-500' },
                  { type: 'Psychiatric Evaluation', count: 3, color: 'bg-purple-500' },
                  { type: 'Telehealth', count: 5, color: 'bg-teal-500' },
                ].map(r => (
                  <div key={r.type}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate">{r.type}</span><span className="font-bold text-navy">{r.count}</span></div>
                    <div className="h-2 bg-gray-100 rounded-full"><div className={`h-2 rounded-full ${r.color}`} style={{ width: `${(r.count / 18) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Utilization by Day — This Week</h3>
              <div className="space-y-2.5">
                {[
                  { day: 'Monday', booked: 11, capacity: 14, pct: 79 },
                  { day: 'Tuesday', booked: 13, capacity: 14, pct: 93 },
                  { day: 'Wednesday', booked: 10, capacity: 14, pct: 71 },
                  { day: 'Thursday', booked: 12, capacity: 14, pct: 86 },
                  { day: 'Friday', booked: 4, capacity: 14, pct: 29 },
                ].map(d => (
                  <div key={d.day}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate">{d.day}</span>
                      <span className="font-bold text-navy">{d.booked}/{d.capacity} <span className={`${d.pct >= 90 ? 'text-red-600' : d.pct >= 70 ? 'text-green-600' : 'text-amber-600'}`}>({d.pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full"><div className={`h-2 rounded-full ${d.pct >= 90 ? 'bg-red-500' : d.pct >= 70 ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${d.pct}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border text-xs text-slate flex gap-4">
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-red-500 rounded inline-block" /> ≥90% (overloaded)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-green-500 rounded inline-block" /> 70–89%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-amber-400 rounded inline-block" /> &lt;70%</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">No-Show & Cancellation Analysis — Last 30 Days</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 pr-4">Appointment Type</th>
                    <th className="text-center py-2 px-2">Scheduled</th>
                    <th className="text-center py-2 px-2">Completed</th>
                    <th className="text-center py-2 px-2">No-Show</th>
                    <th className="text-center py-2 px-2">Cancelled</th>
                    <th className="text-center py-2 px-2">No-Show Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { type: 'Individual Counseling', sched: 52, comp: 46, noshow: 4, cancel: 2 },
                    { type: 'Group Therapy', sched: 78, comp: 72, noshow: 3, cancel: 3 },
                    { type: 'Medical / Physician', sched: 34, comp: 31, noshow: 2, cancel: 1 },
                    { type: 'Family Session', sched: 16, comp: 13, noshow: 2, cancel: 1 },
                    { type: 'Psychiatric Evaluation', sched: 12, comp: 11, noshow: 1, cancel: 0 },
                    { type: 'Telehealth', sched: 20, comp: 16, noshow: 3, cancel: 1 },
                  ].map(r => {
                    const rate = Math.round((r.noshow / r.sched) * 100);
                    return (
                      <tr key={r.type}>
                        <td className="py-2.5 pr-4 font-medium text-navy">{r.type}</td>
                        <td className="py-2.5 px-2 text-center text-slate">{r.sched}</td>
                        <td className="py-2.5 px-2 text-center text-green-600 font-medium">{r.comp}</td>
                        <td className="py-2.5 px-2 text-center text-red-600 font-medium">{r.noshow}</td>
                        <td className="py-2.5 px-2 text-center text-amber-600 font-medium">{r.cancel}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`font-bold text-xs ${rate >= 15 ? 'text-red-600' : rate >= 10 ? 'text-amber-600' : 'text-green-600'}`}>{rate}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'Waitlist' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Patients awaiting scheduled appointments — physician, counselor, psychiatric, and specialty referrals.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total on Waitlist', value: 9, color: 'text-navy' },
              { label: 'Psychiatry (Priority)', value: 3, color: 'text-red-600' },
              { label: 'Avg Wait (Days)', value: 4.2, color: 'text-amber-600' },
              { label: 'Scheduled Today', value: 2, color: 'text-green-600' },
            ].map(k => (
              <div key={k.label} className="bg-white border border-border rounded-xl p-4 shadow-sm">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-border font-semibold text-navy text-sm">Appointment Waitlist — All Programs</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg text-slate">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Patient</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Appt Type</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Provider</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Requested</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Days Waiting</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Priority</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { patient: 'Marcus Webb', type: 'Psychiatric Eval', provider: 'Dr. Emma Hughes', requested: '2026-07-17', days: 5, priority: 'Urgent', status: 'Pending' },
                  { patient: 'Elena Vasquez', type: 'Psychiatric Eval', provider: 'Dr. Emma Hughes', requested: '2026-07-16', days: 6, priority: 'Urgent', status: 'Pending' },
                  { patient: 'James Thornton', type: 'Medical (Pre-DC)', provider: 'Dr. Robert Chen', requested: '2026-07-20', days: 2, priority: 'Urgent', status: 'Scheduling' },
                  { patient: 'Ava Simmons', type: 'Individual Counseling', provider: 'Sarah Jenkins, LPC', requested: '2026-07-15', days: 7, priority: 'Routine', status: 'Pending' },
                  { patient: 'Robert Navarro', type: 'Psychiatric Eval', provider: 'Dr. Emma Hughes', requested: '2026-07-14', days: 8, priority: 'High', status: 'Scheduling' },
                  { patient: 'Patricia Holloway', type: 'Family Therapy', provider: 'David Odom, LMFT', requested: '2026-07-16', days: 6, priority: 'Routine', status: 'Pending' },
                  { patient: 'Brian Kowalski', type: 'MAT Consult', provider: 'Dr. Robert Chen', requested: '2026-07-13', days: 9, priority: 'High', status: 'Pending' },
                  { patient: 'Kevin Hughes', type: 'Individual Counseling', provider: 'Maria Gonzales, LCSW', requested: '2026-07-15', days: 7, priority: 'Routine', status: 'Pending' },
                  { patient: 'Sandra Kim', type: 'Dietitian Consult', provider: 'Dietitian (Ext. Referral)', requested: '2026-07-12', days: 10, priority: 'Routine', status: 'Pending' },
                ].map(r => (
                  <tr key={`${r.patient}-${r.type}`} className={`hover:bg-gray-50 ${r.days >= 5 ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-navy">{r.patient}</td>
                    <td className="px-3 py-2.5 text-center text-slate">{r.type}</td>
                    <td className="px-3 py-2.5 text-center text-slate">{r.provider}</td>
                    <td className="px-3 py-2.5 text-center text-slate">{r.requested}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-bold ${r.days >= 5 ? 'text-red-600' : r.days >= 3 ? 'text-amber-600' : 'text-green-600'}`}>{r.days}d</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.priority === 'Urgent' ? 'bg-red-100 text-red-700' : r.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-slate'}`}>{r.priority}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.status === 'Scheduling' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-slate'}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'Provider Schedules' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Provider availability and scheduling matrix — weekly templates, caseload caps, and availability windows for all clinical staff.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Providers Scheduled', value: 12, color: 'text-navy', sub: 'This week' },
              { label: 'Scheduling Conflicts', value: 2, color: 'text-amber-600', sub: 'Require resolution' },
              { label: 'Open Appointment Slots', value: 18, color: 'text-green-600', sub: 'Across all providers this week' },
              { label: 'Avg Caseload Utilization', value: '84%', color: 'text-blue-600', sub: 'vs. 90% target' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Provider Schedule Matrix — Current Week</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Provider', 'Role', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Caseload Cap', 'Current', 'Open Slots'].map(h => (
                    <th key={h} className="text-left px-2 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'A. Brooks, LPC', role: 'Primary Therapist', mon: '8a–4p', tue: '8a–4p', wed: '10a–6p', thu: '8a–4p', fri: '8a–12p', cap: 18, curr: 16, open: 2 },
                  { name: 'R. Torres, LPC-MHSP', role: 'Primary Therapist', mon: '9a–5p', tue: '9a–5p', wed: 'OFF', thu: '9a–5p', fri: '9a–5p', cap: 18, curr: 15, open: 3 },
                  { name: 'T. Jackson, CAC-AD', role: 'Counselor', mon: '7a–3p', tue: '7a–3p', wed: '7a–3p', thu: '7a–3p', fri: '7a–3p', cap: 14, curr: 13, open: 1 },
                  { name: 'M. Rivera, CAADC', role: 'Counselor', mon: '12p–8p', tue: '12p–8p', wed: '12p–8p', thu: '12p–8p', fri: 'OFF', cap: 12, curr: 11, open: 1 },
                  { name: 'L. Nguyen, MSW', role: 'Case Manager', mon: '8a–4p', tue: '8a–4p', wed: '8a–4p', thu: '8a–4p', fri: '8a–4p', cap: 22, curr: 19, open: 3 },
                  { name: 'Dr. M. Chen', role: 'Medical Director', mon: 'AM rounds', tue: 'AM rounds', wed: 'AM rounds', thu: 'AM rounds', fri: 'AM rounds', cap: 24, curr: 24, open: 0 },
                  { name: 'K. Santos, RN', role: 'Charge Nurse', mon: '7a–7p', tue: '7a–7p', wed: 'OFF', thu: '7a–7p', fri: '7a–7p', cap: 44, curr: 36, open: 8 },
                ].map(r => (
                  <tr key={r.name} className="hover:bg-gray-50">
                    <td className="px-2 py-2 font-medium text-navy">{r.name}</td>
                    <td className="px-2 py-2 text-slate">{r.role}</td>
                    {[r.mon, r.tue, r.wed, r.thu, r.fri].map((d, i) => (
                      <td key={i} className={`px-2 py-2 text-[10px] ${d === 'OFF' ? 'text-slate italic' : 'text-navy'}`}>{d}</td>
                    ))}
                    <td className="px-2 py-2 text-center text-slate">{r.cap}</td>
                    <td className={`px-2 py-2 text-center font-semibold ${r.curr / r.cap >= 0.95 ? 'text-amber-600' : r.curr / r.cap >= 0.8 ? 'text-blue-600' : 'text-green-600'}`}>{r.curr}</td>
                    <td className="px-2 py-2 text-center"><span className={`font-bold ${r.open === 0 ? 'text-red-500' : r.open <= 2 ? 'text-amber-600' : 'text-green-600'}`}>{r.open}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'No-Show Tracker' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">No-show and late-cancel analytics — by patient, appointment type, provider, and day of week. Used for scheduling policy decisions.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'No-Show Rate (30d)', value: '11%', color: 'text-amber-600', sub: '14 of 127 appointments' },
              { label: 'Late Cancels (<24h)', value: 8, color: 'text-amber-600', sub: '6% of total scheduled' },
              { label: 'Highest No-Show Type', value: 'Family', color: 'text-red-600', sub: '22% no-show rate' },
              { label: 'Highest No-Show Day', value: 'Monday', color: 'text-red-600', sub: '18% — likely weekend disruption' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">No-Show Rate by Appointment Type</h3>
              <div className="space-y-2 text-xs">
                {[
                  { type: 'Family Session', rate: 10, color: 'bg-red-500' },
                  { type: 'Individual Therapy', rate: 9, color: 'bg-amber-500' },
                  { type: 'Medical / MD Appt', rate: 7, color: 'bg-amber-400' },
                  { type: 'Group Therapy', rate: 5, color: 'bg-blue-400' },
                  { type: 'Intake / Admission', rate: 4, color: 'bg-blue-300' },
                  { type: 'Discharge Planning', rate: 3, color: 'bg-green-400' },
                ].map(r => (
                  <div key={r.type}>
                    <div className="flex justify-between mb-1">
                      <span className="text-navy">{r.type}</span>
                      <span className="font-bold text-slate">{r.rate}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${r.color}`} style={{ width: `${r.rate * 4}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Repeat No-Show Patients — 30d</h3>
              <div className="space-y-1.5 text-xs">
                {[
                  { pt: 'T. Barnes', loc: 'Rm 9A', count: 3, types: 'Family (x2), Individual (x1)', action: 'Counselor check-in scheduled' },
                  { pt: 'K. Walsh', loc: 'Rm 6C', count: 2, types: 'Medical (x2)', action: 'MD follow-up required' },
                  { pt: 'A. Monroe', loc: 'Rm 3A', count: 2, types: 'Individual (x1), Family (x1)', action: 'Engagement review in caseload' },
                  { pt: 'R. Patel (pt)', loc: 'PHP', count: 2, types: 'Group (x2)', action: 'RES at-risk flag triggered' },
                ].map(r => (
                  <div key={r.pt} className="border border-border rounded-xl p-2.5">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-navy">{r.pt} <span className="font-normal text-slate text-[10px]">({r.loc})</span></span>
                      <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{r.count} no-shows</span>
                    </div>
                    <div className="text-slate mt-0.5">{r.types}</div>
                    <div className="text-blue-700 italic mt-0.5">{r.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Appointment modal */}
      {newApptOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setNewApptOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[520px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-navy">New Appointment</h2>
              <button onClick={() => setNewApptOpen(false)} className="text-slate hover:text-navy p-1 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Type *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={newAppt.type} onChange={e => setNewAppt(a => ({ ...a, type: e.target.value as Appointment['type'] }))}>
                    {(['Individual','Group','Medical','Intake','Discharge','Family'] as const).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Day</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={newAppt.day} onChange={e => setNewAppt(a => ({ ...a, day: Number(e.target.value) }))}>
                    {WEEK_DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Start Time</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={newAppt.start} onChange={e => setNewAppt(a => ({ ...a, start: e.target.value }))}>
                    {HOUR_LABELS.map((h, i) => <option key={i} value={`${HOURS[i]}:00`}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Duration</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={newAppt.duration} onChange={e => setNewAppt(a => ({ ...a, duration: e.target.value }))}>
                    {['0.5','1','1.5','2','2.5','3'].map(d => <option key={d} value={d}>{d === '0.5' ? '30 min' : `${d} hr`}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Title / Description *</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 1:1 Marcus Webb — AMA follow-up" value={newAppt.title} onChange={e => setNewAppt(a => ({ ...a, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Clinician / Staff</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={newAppt.staff} onChange={e => setNewAppt(a => ({ ...a, staff: e.target.value }))}>
                    <option value="">— select staff —</option>
                    {['Sarah Jenkins, LPC','Maria Gonzales, LCSW','David Odom, LMFT','Dr. Robert Chen','Dr. Emily Stone','Dr. Allen Hughes','Jessica Torres, RN'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Location</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={newAppt.location} onChange={e => setNewAppt(a => ({ ...a, location: e.target.value }))}>
                    <option value="">— select room —</option>
                    {['Room 4','Room 8','Room 10','Room 12','Group Room A','Group Room B','Group Room C','Med Suite','Psych Office','Intake Suite','Conf Room'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient (optional)</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={newAppt.patientId} onChange={e => setNewAppt(a => ({ ...a, patientId: e.target.value }))}>
                  <option value="">— no specific patient (group/medical) —</option>
                  {MOCK_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setNewApptOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveAppt} className="flex-1 bg-sunrise-blue text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700">Schedule Appointment</button>
            </div>
          </div>
        </div>
      )}

      {/* Saved toast */}
      {apptSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> Appointment scheduled
        </div>
      )}
    </div>
  );
}
