import React, { useState } from 'react';
import { MOCK_GROUPS } from '../data/mockGroups';
import { Screen } from '../App';
import { UsersRound, MapPin, User, Clock, X, CheckSquare, Square, TrendingUp } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

// ─── Mock attendance data ─────────────────────────────────────────────────────

const MOCK_ROSTER: Record<string, { id: string; name: string; program: string; attended?: boolean }[]> = {
  'grp-1': [
    { id: 'p1', name: 'Marcus Webb',      program: 'Residential', attended: true },
    { id: 'p3', name: 'Devon Patel',       program: 'Residential', attended: false },
    { id: 'p5', name: 'Jamal Foster',      program: 'Residential', attended: true },
    { id: 'p6', name: 'Elena Vasquez',     program: 'Residential', attended: true },
    { id: 'p8', name: 'Samantha Choi',     program: 'Residential', attended: true },
    { id: 'p9', name: 'Devon Patel (II)',  program: 'Residential', attended: false },
  ],
  'grp-2': [
    { id: 'p2', name: 'Angela Reyes',      program: 'PHP', attended: true },
    { id: 'p7', name: 'Thomas Keller',     program: 'PHP', attended: true },
    { id: 'p1', name: 'Marcus Webb',       program: 'Residential', attended: true },
    { id: 'p4', name: 'Christine O\'Brien',program: 'IOP', attended: false },
  ],
  'grp-3': [
    { id: 'p5', name: 'Jamal Foster',      program: 'Residential', attended: true },
    { id: 'p6', name: 'Elena Vasquez',     program: 'Residential', attended: true },
    { id: 'p2', name: 'Angela Reyes',      program: 'PHP', attended: true },
    { id: 'p1', name: 'Marcus Webb',       program: 'Residential', attended: false },
    { id: 'p8', name: 'Samantha Choi',     program: 'Residential', attended: true },
  ],
};

// Default roster for groups without specific data
function getDefaultRoster(groupId: string, capacity: number) {
  const names = ['Marcus Webb', 'Angela Reyes', 'Devon Patel', 'Jamal Foster', 'Elena Vasquez', 'Robert Kim', 'Samantha Choi', 'Christine O\'Brien', 'Thomas Keller'];
  const programs = ['Residential', 'PHP', 'IOP', 'Residential', 'Residential', 'Residential', 'Residential', 'PHP', 'IOP'];
  return names.slice(0, capacity - 1).map((name, i) => ({
    id: `default-${groupId}-${i}`,
    name,
    program: programs[i],
    attended: Math.random() > 0.25,
  }));
}

// ─── Roster Side Panel ────────────────────────────────────────────────────────

function RosterPanel({
  group,
  onClose,
  readOnly,
}: {
  group: (typeof MOCK_GROUPS)[0] & { day?: string };
  onClose: () => void;
  readOnly?: boolean;
}) {
  const rawRoster = MOCK_ROSTER[group.id] ?? getDefaultRoster(group.id, group.enrolled);
  const [roster, setRoster] = useState(rawRoster);

  const toggleAttendance = (id: string) => {
    setRoster(prev => prev.map(r => r.id === id ? { ...r, attended: !r.attended } : r));
  };

  const attendedCount = roster.filter(r => r.attended).length;
  const attendanceRate = roster.length > 0 ? Math.round((attendedCount / roster.length) * 100) : 0;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-border z-50 flex flex-col">
      {/* Header */}
      <div className="bg-navy text-white px-4 py-4 flex-none">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="font-bold text-sm leading-tight">{group.name}</div>
            <div className="text-xs text-white/70 mt-0.5">{group.facilitator.split(',')[0]}</div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 text-xs text-white/80">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{group.time}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{group.room}</span>
        </div>
        {/* Attendance summary */}
        <div className="mt-3 bg-white/10 rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-lg">{attendedCount}/{roster.length}</div>
            <div className="text-white/70 text-[10px] uppercase tracking-wide">Attended</div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${attendanceRate >= 80 ? 'text-green-300' : attendanceRate >= 60 ? 'text-amber-300' : 'text-red-300'}`}>
              {attendanceRate}%
            </div>
            <div className="text-white/70 text-[10px] uppercase tracking-wide">Rate</div>
          </div>
          <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden self-center">
            <div
              className={`h-full rounded-full ${attendanceRate >= 80 ? 'bg-green-400' : attendanceRate >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Roster list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 border-b border-border bg-bg">
          <div className="text-[10px] font-bold text-slate uppercase tracking-wider">Attendance — Tap to Toggle</div>
        </div>
        {roster.map(member => (
          <div
            key={member.id}
            className={`flex items-center gap-3 px-4 py-3 border-b border-border cursor-pointer hover:bg-slate-50 transition-colors ${member.attended ? '' : 'bg-red-50/30'}`}
            onClick={() => toggleAttendance(member.id)}
          >
            <div className="flex-none">
              {member.attended
                ? <CheckSquare className="w-5 h-5 text-success" />
                : <Square className="w-5 h-5 text-border" />}
            </div>
            <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center flex-none">
              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-semibold ${member.attended ? 'text-navy' : 'text-slate line-through'}`}>
                {member.name}
              </div>
              <div className="text-[10px] text-slate">{member.program}</div>
            </div>
            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${member.attended ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {member.attended ? 'Present' : 'Absent'}
            </div>
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="border-t border-border p-3 flex gap-2 flex-none">
        <LockedButton locked={readOnly} className="flex-1 bg-sunrise-blue text-white text-xs font-semibold py-2 rounded hover:bg-sunrise-blue-light transition-colors">
          Save Attendance
        </LockedButton>
        <LockedButton locked={readOnly} className="px-3 text-xs font-semibold text-slate border border-border rounded hover:bg-slate-50 transition-colors">
          Note
        </LockedButton>
      </div>
    </div>
  );
}

// ─── Group Cell Card ──────────────────────────────────────────────────────────

type GroupWithDay = (typeof MOCK_GROUPS)[0] & { day?: string };

function GroupCard({
  group,
  dayLabel,
  onClick,
}: {
  group: typeof MOCK_GROUPS[0];
  dayLabel: string;
  onClick: (g: GroupWithDay) => void;
}) {
  const roster = MOCK_ROSTER[group.id] ?? getDefaultRoster(group.id, group.enrolled);
  const attended = roster.filter(r => r.attended).length;
  const rate = roster.length > 0 ? Math.round((attended / roster.length) * 100) : null;
  const isFull = group.enrolled >= group.capacity;

  return (
    <div
      className={`bg-white border-l-4 border-l-sunrise-blue border-y border-r border-border rounded shadow-sm p-3 mb-2 last:mb-0 hover:border-l-sunrise-orange hover:shadow-md transition-all cursor-pointer group`}
      onClick={() => onClick({ ...group, day: dayLabel })}
    >
      <div className="font-bold text-navy text-xs mb-2 leading-tight line-clamp-2 group-hover:text-sunrise-blue transition-colors">{group.name}</div>
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[10px] text-slate">
          <User className="w-3 h-3 flex-none" />
          <span className="truncate">{group.facilitator.split(',')[0]}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate">
          <MapPin className="w-3 h-3 flex-none" />
          <span>{group.room}</span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-sunrise-blue">
            <UsersRound className="w-3 h-3" /> {group.enrolled}/{group.capacity}
            {isFull && <span className="ml-1 bg-sunrise-orange/20 text-sunrise-orange px-1 py-0.5 rounded text-[9px]">Full</span>}
          </div>
          {rate !== null && (
            <div className={`flex items-center gap-1 text-[10px] font-semibold ${rate >= 80 ? 'text-success' : rate >= 60 ? 'text-amber-600' : 'text-critical'}`}>
              <TrendingUp className="w-3 h-3" /> {rate}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stats Summary ────────────────────────────────────────────────────────────

function ScheduleSummary() {
  const total = MOCK_GROUPS.length;
  const today = MOCK_GROUPS.filter(g => g.days.includes('Mon')).length;
  const allRosters = MOCK_GROUPS.map(g => MOCK_ROSTER[g.id] ?? getDefaultRoster(g.id, g.enrolled));
  const totalMembers = allRosters.reduce((s, r) => s + r.length, 0);
  const totalAttended = allRosters.reduce((s, r) => s + r.filter(m => m.attended).length, 0);
  const overallRate = totalMembers > 0 ? Math.round((totalAttended / totalMembers) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Total Groups', value: total, color: 'text-navy', border: 'border-navy/20' },
        { label: 'Groups Today', value: today, color: 'text-sunrise-blue', border: 'border-sunrise-blue/30' },
        { label: 'Avg Group Size', value: `${Math.round(MOCK_GROUPS.reduce((s, g) => s + g.enrolled, 0) / total)}`, color: 'text-purple-700', border: 'border-purple-300' },
        { label: 'Avg Attendance', value: `${overallRate}%`, color: overallRate >= 80 ? 'text-success' : 'text-sunrise-amber', border: 'border-success/30' },
      ].map(k => (
        <div key={k.label} className={`bg-white border-l-4 ${k.border} rounded-lg shadow-sm p-4`}>
          <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">{k.label}</div>
          <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function GroupSchedule({ navigate, readOnly }: { navigate: (s: Screen) => void; readOnly?: boolean }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const dayLabels = ['Mon 7/14', 'Tue 7/15', 'Wed 7/16', 'Thu 7/17', 'Fri 7/18'];
  const timeSlots = ['08:00 AM', '09:30 AM', '11:00 AM', '01:00 PM', '02:30 PM', '04:00 PM', '07:00 PM'];
  const [selectedGroup, setSelectedGroup] = useState<GroupWithDay | null>(null);
  const [tab, setTab] = useState<'Schedule' | 'Analytics' | 'Curriculum Map' | 'Room Assignments' | 'Attendance Trends'>('Schedule');

  const getGroupsForSlot = (day: string, time: string) =>
    MOCK_GROUPS.filter(g => g.days.includes(day) && g.time === time);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy">Master Group Schedule</h1>
          <p className="text-slate text-sm mt-1">Weekly therapy and psychoeducation — click any group to take attendance</p>
        </div>
        <LockedButton locked={readOnly} className="bg-sunrise-blue text-white px-4 py-2 rounded font-medium shadow-sm hover:bg-sunrise-blue-light transition-colors text-sm">
          + Add Group
        </LockedButton>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['Schedule', 'Analytics', 'Curriculum Map', 'Room Assignments', 'Attendance Trends'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Groups This Week', value: MOCK_GROUPS.length, sub: 'Active on schedule', color: 'text-navy' },
              { label: 'Avg Attendance Rate', value: '76%', sub: 'All groups combined', color: 'text-green-600' },
              { label: 'Unique Patients in Groups', value: 9, sub: 'This week', color: 'text-blue-600' },
              { label: 'Total Group Hours', value: `${(MOCK_GROUPS.length * 1.5).toFixed(0)}h`, sub: 'Scheduled per week', color: 'text-navy' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Attendance by Group — This Week</h3>
              <div className="space-y-2.5">
                {MOCK_GROUPS.map((g, i) => {
                  const rate = [82, 75, 90, 67, 88, 71, 83, 78, 65, 92][i % 10];
                  return (
                    <div key={g.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate truncate mr-2">{g.name}</span>
                        <span className={`font-bold shrink-0 ${rate >= 80 ? 'text-green-600' : rate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{rate}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className={`h-1.5 rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 70 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Groups by Type & Facilitator</h3>
              <div className="space-y-3">
                {[
                  { type: 'Process Group', count: 3, facilitator: 'S. Jenkins, LPC', color: 'bg-blue-100 text-blue-800' },
                  { type: 'Psychoeducation', count: 4, facilitator: 'D. Odom, LMFT', color: 'bg-purple-100 text-purple-800' },
                  { type: 'CBT / DBT Skills', count: 2, facilitator: 'S. Jenkins, LPC', color: 'bg-green-100 text-green-800' },
                  { type: 'Relapse Prevention', count: 2, facilitator: 'M. Chen, LSW', color: 'bg-amber-100 text-amber-800' },
                  { type: 'Trauma-Informed', count: 1, facilitator: 'S. Jenkins, LPC', color: 'bg-red-100 text-red-800' },
                  { type: 'Family Education', count: 1, facilitator: 'D. Odom, LMFT', color: 'bg-teal-100 text-teal-800' },
                ].map(r => (
                  <div key={r.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.color}`}>{r.type}</span>
                      <span className="text-xs text-slate">{r.facilitator}</span>
                    </div>
                    <span className="font-bold text-navy text-sm">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">No-Show & Absence Patterns — Last 30 Days</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 pr-3">Group</th>
                    <th className="text-center py-2 px-2">Sessions</th>
                    <th className="text-center py-2 px-2">Total Seats</th>
                    <th className="text-center py-2 px-2">Present</th>
                    <th className="text-center py-2 px-2">Absent</th>
                    <th className="text-center py-2 px-2">Att. Rate</th>
                    <th className="text-left py-2 pl-2">Top Absence Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MOCK_GROUPS.slice(0, 6).map((g, i) => {
                    const sessions = [8, 8, 8, 4, 8, 8][i];
                    const seats = [48, 32, 40, 20, 56, 32][i];
                    const rate = [82, 75, 90, 67, 88, 71][i];
                    const present = Math.round(seats * rate / 100);
                    const reasons = ['Conflicting med appt', 'Behavioral redirect', 'Patient declined', 'Off-grounds pass', 'Illness', 'Program transfer'][i];
                    return (
                      <tr key={g.id}>
                        <td className="py-2.5 pr-3 font-medium text-navy">{g.name}</td>
                        <td className="py-2.5 px-2 text-center text-slate">{sessions}</td>
                        <td className="py-2.5 px-2 text-center text-slate">{seats}</td>
                        <td className="py-2.5 px-2 text-center text-green-600 font-medium">{present}</td>
                        <td className="py-2.5 px-2 text-center text-red-500 font-medium">{seats - present}</td>
                        <td className="py-2.5 px-2 text-center"><span className={`font-bold ${rate >= 80 ? 'text-green-600' : rate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{rate}%</span></td>
                        <td className="py-2.5 pl-2 text-slate">{reasons}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'Schedule' && (
      <>
      {/* Summary KPIs */}
      <ScheduleSummary />

      {/* Grid */}
      <div
        className="bg-white rounded-xl shadow-sm border border-border overflow-hidden flex flex-col"
        style={{ height: 'calc(100vh - var(--topbar-height, 64px) - var(--banner-height, 32px) - 280px)', minHeight: 400 }}
      >
        {/* Header row */}
        <div className="flex bg-navy text-white text-xs font-bold flex-shrink-0">
          <div className="w-24 shrink-0 border-r border-white/20 p-3 flex items-center justify-center">Time</div>
          {days.map((day, i) => (
            <div key={day} className="flex-1 p-3 text-center border-r border-white/20 last:border-0 uppercase tracking-wider">
              {dayLabels[i]}
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          {timeSlots.map(time => (
            <div key={time} className="flex border-b border-border min-h-[110px]">
              <div className="w-24 shrink-0 border-r border-border p-3 flex items-start justify-center text-xs font-bold text-slate bg-bg/50 pt-4">
                {time}
              </div>
              {days.map(day => {
                const groups = getGroupsForSlot(day, time);
                return (
                  <div key={`${day}-${time}`} className="flex-1 p-2 border-r border-border last:border-0 bg-white">
                    {groups.map(group => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        dayLabel={day}
                        onClick={g => setSelectedGroup(g)}
                      />
                    ))}
                    {groups.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center text-border text-2xl font-light opacity-30 cursor-pointer hover:opacity-60 transition-opacity" title="Add group">
                        +
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Roster side panel */}
      {selectedGroup && (
        <div>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedGroup(null)} />
          <RosterPanel group={selectedGroup} onClose={() => setSelectedGroup(null)} readOnly={readOnly} />
        </div>
      )}
      </>
      )}

      {tab === 'Curriculum Map' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Evidence-based curriculum alignment — maps each group type to treatment goals, ASAM domains, and session frequency requirements.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Group Types &amp; Evidence Base</h3>
              <div className="space-y-3 text-xs">
                {[
                  { type: 'Motivational Enhancement', evidence: 'MI (Miller & Rollnick)', asam: 'D4 — Readiness to Change', freq: '2x/week', goals: 'Ambivalence resolution, intrinsic motivation' },
                  { type: 'Cognitive Behavioral Therapy (CBT)', evidence: 'Carroll/National CBT Protocol', asam: 'D3 — Emotional/Behavioral', freq: '3x/week', goals: 'Thought restructuring, coping skills, relapse triggers' },
                  { type: 'Relapse Prevention', evidence: 'Marlatt & Gordon RP Model', asam: 'D3/D5', freq: '2x/week', goals: 'High-risk situations, coping plans, lapse management' },
                  { type: '12-Step Facilitation', evidence: 'Project MATCH TSF Manual', asam: 'D5 — Recovery Environment', freq: '1x/week', goals: 'AA/NA engagement, sponsor, step work' },
                  { type: 'Trauma-Informed (SEEKING SAFETY)', evidence: 'Najavits SEEKING SAFETY', asam: 'D3 — Trauma', freq: '2x/week', goals: 'Safety skills, trauma-SUD link, coping without substances' },
                  { type: 'Family Dynamics & Codependency', evidence: 'CRAFT / Minuchin Family Tx', asam: 'D5 — Family/Social', freq: '1x/week', goals: 'Boundaries, enabling behaviors, communication' },
                  { type: 'Medication Education (MAT)', evidence: 'SAMHSA TIP 63', asam: 'D1 — Withdrawal / D2 — Biomedical', freq: '1x/week', goals: 'MAT adherence, stigma reduction, safe storage' },
                  { type: 'Mindfulness & Stress Management', evidence: 'MBRP (Bowen et al.)', asam: 'D3 — Emotional', freq: '1x/week', goals: 'Urge surfing, distress tolerance, breathwork' },
                ].map(g => (
                  <div key={g.type} className="border border-border rounded-lg p-2.5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-navy">{g.type}</span>
                      <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shrink-0">{g.freq}</span>
                    </div>
                    <div className="text-[10px] text-slate mb-0.5">Evidence: {g.evidence}</div>
                    <div className="text-[10px] text-slate mb-0.5">ASAM Domain: {g.asam}</div>
                    <div className="text-[10px] text-slate italic">Goals: {g.goals}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Weekly Group Hours by Level of Care</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-slate">
                      <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Group Type</th>
                      <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Residential</th>
                      <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">PHP</th>
                      <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">IOP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { type: 'CBT / Skills', res: '6h', php: '4h', iop: '3h' },
                      { type: 'Process / Peer Support', res: '4h', php: '3h', iop: '2h' },
                      { type: 'Relapse Prevention', res: '4h', php: '2h', iop: '2h' },
                      { type: 'Psychoeducation', res: '3h', php: '2h', iop: '1h' },
                      { type: 'Mindfulness', res: '2h', php: '1h', iop: '1h' },
                      { type: 'Recreation / Community', res: '4h', php: '1h', iop: '—' },
                      { type: 'Family / Multi-family', res: '1h', php: '1h', iop: '1h' },
                      { type: 'Total Structured Hours', res: '24h', php: '14h', iop: '10h' },
                    ].map(r => (
                      <tr key={r.type} className={`hover:bg-gray-50 ${r.type.includes('Total') ? 'font-bold bg-gray-50' : ''}`}>
                        <td className="py-2 text-navy">{r.type}</td>
                        <td className="py-2 text-center text-slate">{r.res}</td>
                        <td className="py-2 text-center text-slate">{r.php}</td>
                        <td className="py-2 text-center text-slate">{r.iop}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 text-[10px] text-slate">CARF requires minimum 20h/week structured programming for residential; 14h for PHP; 9h for IOP.</div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Facilitator Qualification Requirements</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { group: 'CBT / Trauma Groups', quals: 'LMFT, LPC, LCSW, or licensed psychologist. Must have CBT/trauma-specific training documentation.' },
                    { group: 'Process Groups', quals: 'LADC, CADC-II, or licensed clinician. Minimum 2 years group facilitation experience.' },
                    { group: 'Medication Education', quals: 'RN, MD, NP, or PA. LADC co-facilitation recommended.' },
                    { group: 'Psychoeducation / Life Skills', quals: 'LADC-I, CADC, or supervised intern with co-facilitator approval.' },
                    { group: 'Mindfulness / Yoga', quals: 'Certified instructor (MBRP, 200hr Yoga, or equivalent) plus LADC oversight.' },
                  ].map(q => (
                    <div key={q.group} className="border border-border rounded p-2">
                      <div className="font-semibold text-navy mb-0.5">{q.group}</div>
                      <div className="text-slate">{q.quals}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Room Assignments' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Group therapy room and space management — current assignments, capacity, and conflict detection for this week's schedule.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Rooms Available', value: 5, color: 'text-navy', sub: 'Across 2 buildings' },
              { label: 'Peak Utilization', value: '78%', color: 'text-amber-600', sub: 'Monday 10:30 AM block' },
              { label: 'Scheduling Conflicts', value: 0, color: 'text-green-600', sub: 'This week' },
              { label: 'Avg Group Size', value: 7.2, color: 'text-blue-600', sub: 'Per session' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Room Directory & Weekly Utilization</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Room', 'Building', 'Capacity', 'AV / Setup', 'Sessions This Week', 'Peak Day', 'Utilization'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { room: 'Cedar Room', bldg: 'Main — 1st Floor', cap: 12, av: 'TV, Whiteboard', sessions: 9, peak: 'Monday', pct: 82, ok: false },
                  { room: 'Willow Room', bldg: 'Main — 1st Floor', cap: 10, av: 'Projector, Whiteboard', sessions: 7, peak: 'Tuesday', pct: 70, ok: true },
                  { room: 'Birch Room', bldg: 'Main — 2nd Floor', cap: 8, av: 'Whiteboard only', sessions: 5, peak: 'Wednesday', pct: 63, ok: true },
                  { room: 'Magnolia Hall', bldg: 'Lodge Building', cap: 20, av: 'Full AV, Sound System', sessions: 4, peak: 'Friday', pct: 40, ok: true },
                  { room: 'Sunrise Lounge', bldg: 'Lodge Building', cap: 6, av: 'None (informal)', sessions: 3, peak: 'Thursday', pct: 50, ok: true },
                ].map(r => (
                  <tr key={r.room} className={`hover:bg-gray-50 ${r.pct > 80 ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-3 py-2 font-semibold text-navy">{r.room}</td>
                    <td className="px-3 py-2 text-slate">{r.bldg}</td>
                    <td className="px-3 py-2 text-center text-navy">{r.cap}</td>
                    <td className="px-3 py-2 text-slate">{r.av}</td>
                    <td className="px-3 py-2 text-center text-navy">{r.sessions}</td>
                    <td className="px-3 py-2 text-slate">{r.peak}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.pct > 80 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{r.pct}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Attendance Trends' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Group session attendance patterns — completion rates, no-shows, and engagement trends by program and group type over the last 30 days.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Avg Attendance Rate', value: '84%', color: 'text-green-600', sub: 'Last 30 days, all groups' },
              { label: 'No-Show Rate', value: '8%', color: 'text-amber-600', sub: 'Target ≤10%' },
              { label: 'Late Arrival Rate', value: '11%', color: 'text-blue-600', sub: '>5 min after start' },
              { label: 'Best Attended Group', value: 'Psychoed', color: 'text-navy', sub: '94% avg — Mon 9 AM' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Attendance by Group Type (Last 30 Days)</h3>
            <div className="space-y-2.5 text-xs">
              {[
                { type: 'Psychoeducation', pct: 94, sessions: 22, color: 'bg-blue-500' },
                { type: 'CBT / Skills', pct: 88, sessions: 24, color: 'bg-purple-500' },
                { type: 'Relapse Prevention', pct: 86, sessions: 18, color: 'bg-teal-500' },
                { type: 'Process Group', pct: 81, sessions: 12, color: 'bg-orange-400' },
                { type: 'Mindfulness / Meditation', pct: 79, sessions: 16, color: 'bg-pink-400' },
                { type: '12-Step Facilitation', pct: 77, sessions: 20, color: 'bg-green-500' },
                { type: 'Family Roles & Boundaries', pct: 74, sessions: 6, color: 'bg-amber-500' },
                { type: 'Life Skills', pct: 71, sessions: 10, color: 'bg-gray-500' },
              ].map(g => (
                <div key={g.type}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-slate">{g.type}</span>
                    <span className="font-semibold text-navy">{g.pct}% attendance · {g.sessions} sessions</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className={`h-1.5 rounded-full ${g.color}`} style={{ width: `${g.pct}%` }} />
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
