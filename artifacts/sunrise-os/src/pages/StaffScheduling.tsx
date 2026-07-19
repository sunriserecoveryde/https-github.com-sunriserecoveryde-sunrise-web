import React, { useState } from 'react';
import { Screen } from '../App';
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

type ShiftType = 'Day' | 'Evening' | 'Night';
type StaffRole = 'Physician' | 'Psychiatrist' | 'Nurse' | 'Counselor' | 'LCSW' | 'BHT' | 'Admin';

interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  credential: string;
  color: string;
}

interface ShiftAssignment {
  staffId: string;
  status: 'Scheduled' | 'On Call' | 'PTO' | 'Call Off' | 'Overtime';
}

const STAFF: StaffMember[] = [
  { id: 's1',  name: 'Dr. Robert Chen',        role: 'Physician',   credential: 'MD', color: 'bg-navy text-white' },
  { id: 's2',  name: 'Dr. Emily Stone',         role: 'Physician',   credential: 'MD', color: 'bg-navy text-white' },
  { id: 's3',  name: 'Dr. Allen Hughes',        role: 'Psychiatrist',credential: 'MD', color: 'bg-purple-700 text-white' },
  { id: 's4',  name: 'Jessica Torres',          role: 'Nurse',       credential: 'RN', color: 'bg-blue-600 text-white' },
  { id: 's5',  name: 'Michael Boyd',            role: 'Nurse',       credential: 'RN', color: 'bg-blue-600 text-white' },
  { id: 's6',  name: 'Rachel Kim',              role: 'Nurse',       credential: 'RN', color: 'bg-blue-600 text-white' },
  { id: 's7',  name: 'Sarah Jenkins',           role: 'Counselor',   credential: 'LPC', color: 'bg-teal-600 text-white' },
  { id: 's8',  name: 'David Odom',              role: 'Counselor',   credential: 'LMFT', color: 'bg-teal-600 text-white' },
  { id: 's9',  name: 'Maria Gonzales',          role: 'LCSW',        credential: 'LCSW', color: 'bg-teal-600 text-white' },
  { id: 's10', name: 'Kevin Wright',            role: 'BHT',         credential: 'BHT Sup', color: 'bg-gray-600 text-white' },
  { id: 's11', name: 'Darnell Hughes',          role: 'BHT',         credential: 'BHT', color: 'bg-gray-600 text-white' },
  { id: 's12', name: 'Tamika Ross',             role: 'BHT',         credential: 'BHT', color: 'bg-gray-600 text-white' },
  { id: 's13', name: 'Amanda Lewis',            role: 'Admin',       credential: 'Intake', color: 'bg-amber-600 text-white' },
  { id: 's14', name: 'Linda Vance',             role: 'Admin',       credential: 'UR/Billing', color: 'bg-amber-600 text-white' },
];

const DAYS = ['Mon\n7/14', 'Tue\n7/15', 'Wed\n7/16', 'Thu\n7/17', 'Fri\n7/18', 'Sat\n7/19', 'Sun\n7/20'];

// Shift requirements: [Day, Evening, Night]
const REQUIREMENTS: Record<ShiftType, { nurses: number; bhts: number; counselors: number }> = {
  Day:     { nurses: 2, bhts: 2, counselors: 3 },
  Evening: { nurses: 1, bhts: 2, counselors: 1 },
  Night:   { nurses: 1, bhts: 2, counselors: 0 },
};

// Generate schedule
const SCHEDULE: Record<string, Record<string, Record<ShiftType, ShiftAssignment | null>>> = {};
STAFF.forEach(s => {
  SCHEDULE[s.id] = {};
  DAYS.forEach((day, di) => {
    SCHEDULE[s.id][day] = { Day: null, Evening: null, Night: null };
    const isWeekend = di >= 5;

    if (s.role === 'Physician') {
      if (!isWeekend) {
        SCHEDULE[s.id][day].Day = { staffId: s.id, status: 'Scheduled' };
        if (s.id === 's1' && di === 2) SCHEDULE[s.id][day].Day = { staffId: s.id, status: 'PTO' };
      } else {
        SCHEDULE[s.id][day].Day = { staffId: s.id, status: s.id === 's1' ? 'On Call' : 'Scheduled' };
      }
    } else if (s.role === 'Psychiatrist') {
      if (!isWeekend) SCHEDULE[s.id][day].Day = { staffId: s.id, status: 'Scheduled' };
      else SCHEDULE[s.id][day].Day = { staffId: s.id, status: 'On Call' };
    } else if (s.role === 'Nurse') {
      // Rotate shifts across nurses
      const base = ['s4', 's5', 's6'];
      const idx = base.indexOf(s.id);
      if (idx === 0) {
        SCHEDULE[s.id][day].Day = { staffId: s.id, status: di === 3 ? 'PTO' : 'Scheduled' };
      } else if (idx === 1) {
        SCHEDULE[s.id][day].Evening = { staffId: s.id, status: 'Scheduled' };
        if (di === 1) SCHEDULE[s.id][day].Evening = { staffId: s.id, status: 'Call Off' };
      } else {
        SCHEDULE[s.id][day].Night = { staffId: s.id, status: 'Scheduled' };
        if (di === 4) SCHEDULE[s.id][day].Night = { staffId: s.id, status: 'Overtime' };
      }
    } else if (s.role === 'Counselor' || s.role === 'LCSW') {
      if (!isWeekend) SCHEDULE[s.id][day].Day = { staffId: s.id, status: 'Scheduled' };
      else SCHEDULE[s.id][day].Day = { staffId: s.id, status: s.id === 's7' && di === 5 ? 'PTO' : 'On Call' };
    } else if (s.role === 'BHT') {
      const bhtBase = ['s10', 's11', 's12'];
      const idx = bhtBase.indexOf(s.id);
      if (idx === 0) {
        SCHEDULE[s.id][day].Day = { staffId: s.id, status: 'Scheduled' };
        SCHEDULE[s.id][day].Evening = { staffId: s.id, status: 'Scheduled' };
      } else if (idx === 1) {
        SCHEDULE[s.id][day].Evening = { staffId: s.id, status: di === 5 ? 'Overtime' : 'Scheduled' };
        SCHEDULE[s.id][day].Night = { staffId: s.id, status: 'Scheduled' };
      } else {
        SCHEDULE[s.id][day].Night = { staffId: s.id, status: 'Scheduled' };
        if (!isWeekend) SCHEDULE[s.id][day].Day = { staffId: s.id, status: 'Scheduled' };
      }
    } else if (s.role === 'Admin') {
      if (!isWeekend) SCHEDULE[s.id][day].Day = { staffId: s.id, status: 'Scheduled' };
    }
  });
});

const SHIFT_STATUS_STYLE: Record<string, string> = {
  Scheduled: 'bg-green-100 border-green-200 text-green-800',
  'On Call': 'bg-blue-100 border-blue-200 text-blue-700',
  PTO:       'bg-purple-100 border-purple-200 text-purple-700',
  'Call Off':'bg-red-100 border-red-200 text-red-700',
  Overtime:  'bg-amber-100 border-amber-200 text-amber-700',
};

const ROLE_ORDER: StaffRole[] = ['Physician', 'Psychiatrist', 'Nurse', 'Counselor', 'LCSW', 'BHT', 'Admin'];

export function StaffScheduling({ navigate }: Props) {
  const [view, setView] = useState<'Weekly' | 'Staff' | 'Coverage'>('Weekly');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  const totalHours = STAFF.length * DAYS.length * 8; // rough
  const ptoCount = STAFF.reduce((acc, s) => acc + DAYS.filter(d => {
    const shifts = SCHEDULE[s.id]?.[d];
    return shifts && Object.values(shifts).some(sh => sh?.status === 'PTO');
  }).length, 0);
  const calloffCount = STAFF.reduce((acc, s) => acc + DAYS.filter(d => {
    const shifts = SCHEDULE[s.id]?.[d];
    return shifts && Object.values(shifts).some(sh => sh?.status === 'Call Off');
  }).length, 0);
  const overtimeCount = STAFF.reduce((acc, s) => acc + DAYS.filter(d => {
    const shifts = SCHEDULE[s.id]?.[d];
    return shifts && Object.values(shifts).some(sh => sh?.status === 'Overtime');
  }).length, 0);

  const groupedStaff = ROLE_ORDER.map(role => ({
    role,
    members: STAFF.filter(s => s.role === role),
  })).filter(g => g.members.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Staff Scheduling</h1>
          <p className="text-slate text-sm mt-0.5">Shift assignments, coverage requirements, and PTO management</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4 text-slate" /></button>
          <span className="text-sm font-semibold text-navy px-2">Week of July 14–20, 2026</span>
          <button className="p-1.5 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4 text-slate" /></button>
          <button className="ml-2 btn-primary text-sm px-4 py-2">+ Add Shift</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Staff Scheduled', value: `${STAFF.length}`, sub: 'Active this week', color: 'text-navy' },
          { label: 'PTO / Approved Leave', value: String(ptoCount), sub: 'Shifts', color: 'text-purple-600' },
          { label: 'Call-offs', value: String(calloffCount), sub: 'Unplanned absences', color: 'text-red-600' },
          { label: 'Overtime Shifts', value: String(overtimeCount), sub: 'Requiring payroll approval', color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Weekly', 'Staff', 'Coverage'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${view === v ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{v} View</button>
        ))}
      </div>

      {view === 'Weekly' && (
        <div className="card p-0 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-3 py-2.5 font-semibold text-slate sticky left-0 bg-gray-50 z-10 min-w-[160px]">Staff</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate min-w-[80px]">Role</th>
                {DAYS.map(d => (
                  <th key={d} className={`text-center px-1 py-2 font-semibold text-slate min-w-[110px] whitespace-pre-line leading-tight ${d.includes('7/19') || d.includes('7/20') ? 'bg-blue-50' : ''}`}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedStaff.map(group => (
                <React.Fragment key={group.role}>
                  <tr>
                    <td colSpan={9} className="px-3 py-1.5 bg-gray-100 border-b border-border">
                      <span className="text-[10px] font-bold text-slate uppercase tracking-wider">{group.role}s</span>
                    </td>
                  </tr>
                  {group.members.map(s => (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${s.color}`}>
                            {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-navy text-[11px]">{s.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate text-[10px]">{s.credential}</td>
                      {DAYS.map(day => {
                        const shifts = SCHEDULE[s.id]?.[day];
                        const activeShifts = shifts ? Object.entries(shifts).filter(([, v]) => v !== null) : [];
                        return (
                          <td key={day} className={`px-1 py-1.5 ${day.includes('7/19') || day.includes('7/20') ? 'bg-blue-50/50' : ''}`}>
                            {activeShifts.length === 0
                              ? <div className="text-center text-gray-300 text-[10px]">—</div>
                              : activeShifts.map(([shift, assignment]) => assignment && (
                                <div key={shift} className={`rounded border text-[10px] px-1.5 py-0.5 mb-0.5 ${SHIFT_STATUS_STYLE[assignment.status]}`}>
                                  <span className="font-medium">{shift[0]}</span> · {assignment.status}
                                </div>
                              ))
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'Staff' && (
        <div className="grid grid-cols-2 gap-4">
          {STAFF.map(s => {
            const shifts = DAYS.map(d => ({ day: d, ...SCHEDULE[s.id]?.[d] }));
            const totalDays = shifts.filter(sh => Object.values(sh).some(v => v && (v as ShiftAssignment).status === 'Scheduled')).length;
            const pto = shifts.filter(sh => Object.values(sh).some(v => v && (v as ShiftAssignment).status === 'PTO')).length;
            const ot = shifts.filter(sh => Object.values(sh).some(v => v && (v as ShiftAssignment).status === 'Overtime')).length;
            return (
              <div key={s.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${s.color}`}>
                    {s.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold text-navy text-sm">{s.name}</div>
                    <div className="text-xs text-slate">{s.role} · {s.credential}</div>
                  </div>
                </div>
                <div className="flex gap-3 text-xs">
                  <div className="text-center"><div className="font-bold text-navy text-lg">{totalDays}</div><div className="text-slate">Scheduled</div></div>
                  <div className="text-center"><div className="font-bold text-purple-600 text-lg">{pto}</div><div className="text-slate">PTO</div></div>
                  <div className="text-center"><div className="font-bold text-amber-600 text-lg">{ot}</div><div className="text-slate">OT</div></div>
                </div>
                <div className="mt-3 flex gap-1">
                  {DAYS.map(d => {
                    const dayShifts = SCHEDULE[s.id]?.[d];
                    const active = dayShifts ? Object.values(dayShifts).filter(Boolean) : [];
                    const status = active.length > 0 ? (active[0] as ShiftAssignment).status : null;
                    return (
                      <div key={d} title={`${d.split('\n')[0]}: ${status || 'Off'}`}
                        className={`flex-1 h-6 rounded text-center text-[9px] font-bold flex items-center justify-center border ${
                          status === 'Scheduled' ? 'bg-green-100 border-green-200 text-green-700' :
                          status === 'PTO' ? 'bg-purple-100 border-purple-200 text-purple-600' :
                          status === 'On Call' ? 'bg-blue-100 border-blue-200 text-blue-600' :
                          status === 'Call Off' ? 'bg-red-100 border-red-200 text-red-600' :
                          status === 'Overtime' ? 'bg-amber-100 border-amber-200 text-amber-600' :
                          'bg-gray-100 border-gray-200 text-gray-300'
                        }`}>
                        {d.split('\n')[0][0]}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'Coverage' && (
        <div className="space-y-4">
          <p className="text-sm text-slate">Coverage analysis against minimum staffing requirements per shift.</p>
          {(['Day', 'Evening', 'Night'] as ShiftType[]).map(shift => {
            const req = REQUIREMENTS[shift];
            return (
              <div key={shift} className="card">
                <h3 className="font-semibold text-navy mb-1">{shift} Shift <span className="text-slate font-normal text-xs">({shift === 'Day' ? '7am – 3pm' : shift === 'Evening' ? '3pm – 11pm' : '11pm – 7am'})</span></h3>
                <div className="text-xs text-slate mb-4">Requirements: {req.nurses} RN · {req.bhts} BHT · {req.counselors} Counselor</div>
                <div className="overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-border">
                        <th className="text-left px-3 py-2 font-semibold text-slate">Role</th>
                        {DAYS.map(d => (
                          <th key={d} className="text-center px-2 py-2 font-semibold text-slate whitespace-pre-line">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { role: 'Nurses (RN)', required: req.nurses, ids: ['s4', 's5', 's6'] },
                        { role: 'BHT / Tech', required: req.bhts, ids: ['s10', 's11', 's12'] },
                        { role: 'Counselors', required: req.counselors, ids: ['s7', 's8', 's9'] },
                      ].map(row => (
                        <tr key={row.role} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-medium text-navy">{row.role} <span className="text-slate font-normal">(need {row.required})</span></td>
                          {DAYS.map(d => {
                            const scheduled = row.ids.filter(id => {
                              const s = SCHEDULE[id]?.[d]?.[shift];
                              return s && s.status !== 'PTO' && s.status !== 'Call Off';
                            }).length;
                            const met = scheduled >= row.required;
                            return (
                              <td key={d} className="text-center px-2 py-2">
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${met ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {met ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                  <span className="font-semibold">{scheduled}/{row.required}</span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
