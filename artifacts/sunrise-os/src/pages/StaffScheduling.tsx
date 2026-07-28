import React, { useState } from 'react';
import { Screen } from '../App';
import {
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Clock,
  User, Plus, X, ArrowLeftRight, UserCheck, Bell, RefreshCw, Search
} from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type ShiftType = 'Day' | 'Evening' | 'Night';
type StaffRole = 'Physician' | 'Psychiatrist' | 'Nurse' | 'Counselor' | 'LCADC' | 'BHT' | 'Admin';
type CoverageReqType = 'Find Coverage' | 'Shift Swap' | 'Open Pickup';
type CoverageReqStatus = 'Open' | 'Volunteer Found' | 'Pending Approval' | 'Approved' | 'Denied' | 'Cancelled';

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

interface CoverageRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  day: string;           // e.g. 'Tue\n7/15'
  shift: ShiftType;
  type: CoverageReqType;
  reason: string;
  status: CoverageReqStatus;
  volunteerId?: string;
  volunteerName?: string;
  supervisorId: string;
  supervisorName: string;
  swapTargetId?: string;
  swapTargetName?: string;
  submittedAt: string;
  resolvedAt?: string;
  notes?: string;
}

// ─── Static data ───────────────────────────────────────────────────────────────

const STAFF: StaffMember[] = [
  { id: 's1',  name: 'Dr. Robert Chen',        role: 'Physician',   credential: 'MD',          color: 'bg-navy text-white' },
  { id: 's2',  name: 'Dr. Emily Stone',         role: 'Physician',   credential: 'MD',          color: 'bg-navy text-white' },
  { id: 's3',  name: 'Dr. Allen Hughes',        role: 'Psychiatrist',credential: 'MD',          color: 'bg-purple-700 text-white' },
  { id: 's4',  name: 'Jessica Torres',          role: 'Nurse',       credential: 'RN',          color: 'bg-blue-600 text-white' },
  { id: 's5',  name: 'Michael Boyd',            role: 'Nurse',       credential: 'RN',          color: 'bg-blue-600 text-white' },
  { id: 's6',  name: 'Rachel Kim',              role: 'Nurse',       credential: 'RN',          color: 'bg-blue-600 text-white' },
  { id: 's7',  name: 'Sarah Jenkins',           role: 'Counselor',   credential: 'LCPC',        color: 'bg-teal-600 text-white' },
  { id: 's8',  name: 'David Odom',              role: 'Counselor',   credential: 'LCADC',       color: 'bg-teal-600 text-white' },
  { id: 's9',  name: 'Maria Gonzales',          role: 'LCADC',       credential: 'LCADC',       color: 'bg-teal-600 text-white' },
  { id: 's10', name: 'Kevin Wright',            role: 'BHT',         credential: 'BHT Sup',     color: 'bg-gray-600 text-white' },
  { id: 's11', name: 'Darnell Hughes',          role: 'BHT',         credential: 'BHT',         color: 'bg-gray-600 text-white' },
  { id: 's12', name: 'Tamika Ross',             role: 'BHT',         credential: 'BHT',         color: 'bg-gray-600 text-white' },
  { id: 's13', name: 'Amanda Lewis',            role: 'Admin',       credential: 'Intake',      color: 'bg-amber-600 text-white' },
  { id: 's14', name: 'Linda Vance',             role: 'Admin',       credential: 'UR/Billing',  color: 'bg-amber-600 text-white' },
];

const DAYS = ['Mon\n7/14', 'Tue\n7/15', 'Wed\n7/16', 'Thu\n7/17', 'Fri\n7/18', 'Sat\n7/19', 'Sun\n7/20'];

const REQUIREMENTS: Record<ShiftType, { nurses: number; bhts: number; counselors: number }> = {
  Day:     { nurses: 2, bhts: 2, counselors: 3 },
  Evening: { nurses: 1, bhts: 2, counselors: 1 },
  Night:   { nurses: 1, bhts: 2, counselors: 0 },
};

// ─── Who each staff member reports to ─────────────────────────────────────────

const SUPERVISOR_MAP: Record<string, { id: string; name: string }> = {
  's1':  { id: 'sup_ceo',     name: 'CEO / Executive Director' },
  's2':  { id: 'sup_ceo',     name: 'CEO / Executive Director' },
  's3':  { id: 'sup_ceo',     name: 'CEO / Executive Director' },
  's4':  { id: 's1',          name: 'Dr. Robert Chen' },
  's5':  { id: 's4',          name: 'Jessica Torres' },
  's6':  { id: 's4',          name: 'Jessica Torres' },
  's7':  { id: 'sup_collins', name: 'James S. Collins III' },
  's8':  { id: 'sup_collins', name: 'James S. Collins III' },
  's9':  { id: 'sup_collins', name: 'James S. Collins III' },
  's10': { id: 'sup_collins', name: 'James S. Collins III' },
  's11': { id: 's10',         name: 'Kevin Wright' },
  's12': { id: 'sup_collins', name: 'James S. Collins III' },
  's13': { id: 'sup_ceo',     name: 'CEO / Executive Director' },
  's14': { id: 'sup_ceo',     name: 'CEO / Executive Director' },
};

// ─── Generate schedule ─────────────────────────────────────────────────────────

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
    } else if (s.role === 'Counselor' || s.role === 'LCADC') {
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
  Scheduled:  'bg-green-100 border-green-200 text-green-800',
  'On Call':  'bg-blue-100 border-blue-200 text-blue-700',
  PTO:        'bg-purple-100 border-purple-200 text-purple-700',
  'Call Off': 'bg-red-100 border-red-200 text-red-700',
  Overtime:   'bg-amber-100 border-amber-200 text-amber-700',
};

const ROLE_ORDER: StaffRole[] = ['Physician', 'Psychiatrist', 'Nurse', 'Counselor', 'LCADC', 'BHT', 'Admin'];

// ─── Seed coverage requests ────────────────────────────────────────────────────

const SEED_REQUESTS: CoverageRequest[] = [
  {
    id: 'CR-001',
    requesterId: 's5', requesterName: 'Michael Boyd',
    day: 'Tue\n7/15', shift: 'Evening', type: 'Find Coverage',
    reason: 'Family emergency — unable to make shift',
    status: 'Open',
    supervisorId: 's4', supervisorName: 'Jessica Torres',
    submittedAt: 'Jul 14, 6:42 PM',
  },
  {
    id: 'CR-002',
    requesterId: 's6', requesterName: 'Rachel Kim',
    day: 'Fri\n7/18', shift: 'Night', type: 'Find Coverage',
    reason: 'Medical appointment conflicts with shift start',
    status: 'Volunteer Found',
    volunteerId: 's12', volunteerName: 'Tamika Ross',
    supervisorId: 's4', supervisorName: 'Jessica Torres',
    submittedAt: 'Jul 13, 9:15 AM',
  },
  {
    id: 'CR-003',
    requesterId: 's10', requesterName: 'Kevin Wright',
    day: 'Thu\n7/17', shift: 'Day', type: 'Shift Swap',
    reason: 'Recurring Thursday conflict — propose swap with Darnell Hughes (Darnell agreed)',
    status: 'Pending Approval',
    volunteerId: 's11', volunteerName: 'Darnell Hughes',
    swapTargetId: 's11', swapTargetName: 'Darnell Hughes',
    supervisorId: 'sup_collins', supervisorName: 'James S. Collins III',
    submittedAt: 'Jul 13, 2:05 PM',
  },
  {
    id: 'CR-004',
    requesterId: 's7', requesterName: 'Sarah Jenkins',
    day: 'Sat\n7/19', shift: 'Day', type: 'Shift Swap',
    reason: 'Out-of-town obligation Saturday — agreed swap with David Odom',
    status: 'Approved',
    volunteerId: 's8', volunteerName: 'David Odom',
    swapTargetId: 's8', swapTargetName: 'David Odom',
    supervisorId: 'sup_collins', supervisorName: 'James S. Collins III',
    submittedAt: 'Jul 11, 11:30 AM',
    resolvedAt: 'Jul 12, 8:00 AM',
    notes: 'Approved — adequate counselor coverage confirmed for Saturday.',
  },
];

// ─── Simulated "current user" options for demo ─────────────────────────────────
// In production this would come from AuthContext

const DEMO_USERS = [
  { id: 's7',          label: 'Sarah Jenkins (Counselor — staff view)' },
  { id: 's5',          label: 'Michael Boyd (RN — staff view)' },
  { id: 's10',         label: 'Kevin Wright (BHT — staff view)' },
  { id: 'sup_collins', label: 'James S. Collins III (Clinical Supervisor — approver view)' },
  { id: 's4',          label: 'Jessica Torres (Director of Nursing — approver view)' },
];

// ─── Status helpers ────────────────────────────────────────────────────────────

function crStatusChip(status: CoverageReqStatus) {
  const map: Record<CoverageReqStatus, string> = {
    Open:              'bg-sky-100 text-sky-700',
    'Volunteer Found': 'bg-amber-100 text-amber-700',
    'Pending Approval':'bg-orange-100 text-orange-700',
    Approved:          'bg-green-100 text-green-700',
    Denied:            'bg-red-100 text-red-700',
    Cancelled:         'bg-gray-100 text-gray-500',
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status]}`}>{status}</span>;
}

function crTypeChip(type: CoverageReqType) {
  const map: Record<CoverageReqType, string> = {
    'Find Coverage': 'bg-blue-100 text-blue-700',
    'Shift Swap':    'bg-purple-100 text-purple-700',
    'Open Pickup':   'bg-teal-100 text-teal-700',
  };
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${map[type]}`}>{type}</span>;
}

// ─── Request Coverage Modal ────────────────────────────────────────────────────

function RequestCoverageModal({
  currentUserId, onClose, onSubmit, readOnly,
}: {
  currentUserId: string;
  onClose: () => void;
  onSubmit: (req: CoverageRequest) => void;
  readOnly?: boolean;
}) {
  const self = STAFF.find(s => s.id === currentUserId);
  const sup = SUPERVISOR_MAP[currentUserId];
  const [day, setDay] = useState(DAYS[0]);
  const [shift, setShift] = useState<ShiftType>('Day');
  const [type, setType] = useState<CoverageReqType>('Find Coverage');
  const [reason, setReason] = useState('');
  const [swapTarget, setSwapTarget] = useState('');

  const otherStaff = STAFF.filter(s => s.id !== currentUserId);

  const handleSubmit = () => {
    if (!reason.trim()) return;
    const swapPerson = STAFF.find(s => s.id === swapTarget);
    const req: CoverageRequest = {
      id: `CR-${Date.now()}`,
      requesterId: currentUserId,
      requesterName: self?.name ?? currentUserId,
      day, shift, type, reason,
      status: type === 'Shift Swap' && swapTarget ? 'Pending Approval' : 'Open',
      supervisorId: sup?.id ?? 'sup_ceo',
      supervisorName: sup?.name ?? 'CEO / Executive Director',
      volunteerId: type === 'Shift Swap' && swapTarget ? swapTarget : undefined,
      volunteerName: type === 'Shift Swap' && swapPerson ? swapPerson.name : undefined,
      swapTargetId: type === 'Shift Swap' ? swapTarget : undefined,
      swapTargetName: type === 'Shift Swap' && swapPerson ? swapPerson.name : undefined,
      submittedAt: 'Jul 28, just now',
    };
    onSubmit(req);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[520px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-navy">Request Coverage</h2>
            {self && <p className="text-xs text-slate mt-0.5">Submitting as: {self.name} · {self.credential}</p>}
          </div>
          <button onClick={onClose} className="text-slate hover:text-navy"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Shift Date *</label>
              <select value={day} onChange={e => setDay(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange">
                {DAYS.map(d => <option key={d} value={d}>{d.replace('\n', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Shift *</label>
              <select value={shift} onChange={e => setShift(e.target.value as ShiftType)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange">
                {(['Day', 'Evening', 'Night'] as ShiftType[]).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate uppercase mb-1">Request Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Find Coverage', 'Shift Swap', 'Open Pickup'] as CoverageReqType[]).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${type === t ? 'bg-navy text-white border-navy' : 'border-border text-slate hover:border-navy hover:text-navy'}`}>
                  {t}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate mt-1.5">
              {type === 'Find Coverage' && 'Post your shift publicly — any eligible staff member can volunteer to cover it.'}
              {type === 'Shift Swap' && 'Arrange a mutual trade with a specific coworker. Both shifts must be approved by your supervisor.'}
              {type === 'Open Pickup' && 'Signal that you are available and willing to pick up additional shifts this week.'}
            </p>
          </div>

          {type === 'Shift Swap' && (
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Swap With *</label>
              <select value={swapTarget} onChange={e => setSwapTarget(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange">
                <option value="">— Select staff member —</option>
                {otherStaff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.credential})</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate uppercase mb-1">Reason *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[72px] resize-none focus:outline-none focus:border-orange"
              placeholder="Briefly describe why you need coverage. This is visible to your supervisor." />
          </div>

          {sup && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <Bell className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>This request will be routed to <strong>{sup.name}</strong> for approval before taking effect on the schedule.</span>
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Cancel</button>
          <LockedButton locked={readOnly || !reason.trim()} onClick={handleSubmit}
            className="flex-1 bg-navy text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40">
            Submit Request
          </LockedButton>
        </div>
      </div>
    </div>
  );
}

// ─── Volunteer Confirm Modal ───────────────────────────────────────────────────

function VolunteerModal({
  request, currentUserId, onClose, onConfirm, readOnly,
}: {
  request: CoverageRequest;
  currentUserId: string;
  onClose: () => void;
  onConfirm: (reqId: string, volunteerId: string, volunteerName: string) => void;
  readOnly?: boolean;
}) {
  const self = STAFF.find(s => s.id === currentUserId);
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[460px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-navy">Volunteer to Cover</h2>
          <button onClick={onClose} className="text-slate hover:text-navy"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl text-sm space-y-1.5 border border-border">
            <div className="flex justify-between">
              <span className="text-slate text-xs">Requested by</span>
              <span className="font-semibold text-navy">{request.requesterName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate text-xs">Shift</span>
              <span className="font-semibold text-navy">{request.day.replace('\n', ' ')} · {request.shift}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate text-xs">Type</span>
              {crTypeChip(request.type)}
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-slate text-xs shrink-0">Reason</span>
              <span className="text-slate text-xs text-right">{request.reason}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <Bell className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>By volunteering, your name will be submitted to <strong>{request.supervisorName}</strong> for approval. The schedule will only update once the supervisor approves.</span>
          </div>

          {self && (
            <p className="text-xs text-slate">Volunteering as: <strong className="text-navy">{self.name}</strong> ({self.credential})</p>
          )}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Cancel</button>
          <LockedButton locked={readOnly} onClick={() => onConfirm(request.id, currentUserId, self?.name ?? currentUserId)}
            className="flex-1 bg-navy text-white rounded-xl py-2.5 text-sm font-semibold">
            Confirm — Volunteer
          </LockedButton>
        </div>
      </div>
    </div>
  );
}

// ─── Coverage Requests Tab ─────────────────────────────────────────────────────

function CoverageRequestsTab({
  requests, currentUserId, onCurrentUserChange,
  onApprove, onDeny, onVolunteer, onNewRequest, readOnly,
}: {
  requests: CoverageRequest[];
  currentUserId: string;
  onCurrentUserChange: (id: string) => void;
  onApprove: (id: string, notes: string) => void;
  onDeny: (id: string, notes: string) => void;
  onVolunteer: (req: CoverageRequest) => void;
  onNewRequest: () => void;
  readOnly?: boolean;
}) {
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});

  const myRequests    = requests.filter(r => r.requesterId === currentUserId);
  const openForAll    = requests.filter(r => r.status === 'Open' && r.requesterId !== currentUserId);
  const awaitingMe    = requests.filter(r =>
    (r.status === 'Volunteer Found' || r.status === 'Pending Approval') &&
    r.supervisorId === currentUserId
  );

  const stats = [
    { label: 'Open — Needs Volunteer', value: requests.filter(r => r.status === 'Open').length, color: 'text-sky-600' },
    { label: 'Volunteer Found — Pending Approval', value: requests.filter(r => r.status === 'Volunteer Found' || r.status === 'Pending Approval').length, color: 'text-orange-600' },
    { label: 'Approved This Week', value: requests.filter(r => r.status === 'Approved').length, color: 'text-green-600' },
    { label: 'Denied / Cancelled', value: requests.filter(r => r.status === 'Denied' || r.status === 'Cancelled').length, color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card">
            <div className="text-xs font-semibold text-slate uppercase tracking-wide leading-tight">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Demo context selector */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <User className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="text-xs font-semibold text-blue-800 shrink-0">Viewing as:</span>
        <select value={currentUserId} onChange={e => onCurrentUserChange(e.target.value)}
          className="text-xs border border-blue-300 rounded-lg px-2 py-1.5 bg-white flex-1 focus:outline-none focus:border-blue-500 text-blue-900">
          {DEMO_USERS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>
        <LockedButton locked={readOnly} onClick={onNewRequest}
          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 shrink-0 whitespace-nowrap">
          <Plus className="w-3 h-3" /> Request Coverage
        </LockedButton>
      </div>

      {/* ── Awaiting My Approval ── */}
      {awaitingMe.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-navy">Awaiting Your Approval</h3>
            <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">{awaitingMe.length}</span>
          </div>
          <div className="space-y-3">
            {awaitingMe.map(req => (
              <div key={req.id} className="card border-orange/30 bg-orange-50/30 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy text-sm">{req.requesterName}</span>
                      {crTypeChip(req.type)}
                      {crStatusChip(req.status)}
                    </div>
                    <div className="text-xs text-slate">
                      <span className="font-medium text-navy">{req.day.replace('\n', ' ')}</span>
                      {' · '}{req.shift} shift
                      {req.volunteerName && <span className="ml-2">· Volunteer: <strong className="text-navy">{req.volunteerName}</strong></span>}
                    </div>
                    <div className="text-xs text-slate italic">"{req.reason}"</div>
                  </div>
                  <span className="text-[10px] text-slate whitespace-nowrap shrink-0">{req.submittedAt}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <input
                    type="text"
                    value={approvalNotes[req.id] ?? ''}
                    onChange={e => setApprovalNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                    placeholder="Optional note to requester…"
                    className="flex-1 text-xs border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-orange"
                  />
                  <LockedButton locked={readOnly} onClick={() => onApprove(req.id, approvalNotes[req.id] ?? '')}
                    className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Approve
                  </LockedButton>
                  <LockedButton locked={readOnly} onClick={() => onDeny(req.id, approvalNotes[req.id] ?? '')}
                    className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1">
                    <X className="w-3 h-3" /> Deny
                  </LockedButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── My Requests ── */}
      <div>
        <h3 className="text-sm font-bold text-navy mb-3">My Requests</h3>
        {myRequests.length === 0 ? (
          <div className="card text-center py-8 text-slate text-sm">No coverage requests submitted yet.</div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-border text-slate">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Shift</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Reason</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Volunteer</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Supervisor</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {myRequests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">
                      {req.day.replace('\n', ' ')} · {req.shift}
                    </td>
                    <td className="px-4 py-3">{crTypeChip(req.type)}</td>
                    <td className="px-4 py-3 text-slate max-w-[200px]">{req.reason}</td>
                    <td className="px-4 py-3 text-slate">{req.volunteerName ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate">{req.supervisorName}</td>
                    <td className="px-4 py-3 text-center">{crStatusChip(req.status)}</td>
                    <td className="px-4 py-3 text-slate italic text-[10px]">{req.notes ?? <span className="text-gray-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Open Shifts Board ── */}
      <div>
        <h3 className="text-sm font-bold text-navy mb-3">Open Shifts — Available to Cover</h3>
        {openForAll.length === 0 ? (
          <div className="card text-center py-8 text-slate text-sm">No open shifts needing coverage right now.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {openForAll.map(req => (
              <div key={req.id} className="card border-sky-200 hover:border-sky-400 transition-colors space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="font-semibold text-navy text-sm">{req.day.replace('\n', ' ')} · {req.shift} Shift</div>
                    <div className="text-xs text-slate">Originally assigned to <strong>{req.requesterName}</strong></div>
                    <div className="flex gap-1.5 flex-wrap mt-1">{crTypeChip(req.type)}{crStatusChip(req.status)}</div>
                  </div>
                  <span className="text-[10px] text-slate whitespace-nowrap shrink-0">{req.submittedAt}</span>
                </div>
                <p className="text-xs text-slate italic">"{req.reason}"</p>
                <div className="border-t border-border pt-3">
                  <LockedButton locked={readOnly} onClick={() => onVolunteer(req)}
                    className="w-full text-xs bg-navy text-white rounded-lg py-2 font-semibold hover:bg-navy/90 flex items-center justify-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" /> Volunteer to Cover
                  </LockedButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Full Request Log ── */}
      <div>
        <h3 className="text-sm font-bold text-navy mb-3">All Requests — This Week</h3>
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-border text-slate">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Requester</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Shift</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Volunteer / Swap</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Supervisor</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map(req => (
                <tr key={req.id} className={`hover:bg-gray-50 ${req.status === 'Pending Approval' || req.status === 'Volunteer Found' ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-4 py-2.5 font-mono text-[10px] text-slate">{req.id}</td>
                  <td className="px-4 py-2.5 font-medium text-navy whitespace-nowrap">{req.requesterName}</td>
                  <td className="px-4 py-2.5 text-slate whitespace-nowrap">{req.day.replace('\n', ' ')} · {req.shift}</td>
                  <td className="px-4 py-2.5">{crTypeChip(req.type)}</td>
                  <td className="px-4 py-2.5 text-slate">{req.volunteerName ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-2.5 text-slate">{req.supervisorName}</td>
                  <td className="px-4 py-2.5 text-center">{crStatusChip(req.status)}</td>
                  <td className="px-4 py-2.5 text-slate">{req.submittedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function StaffScheduling({ navigate, readOnly }: Props) {
  const [view, setView] = useState<'Weekly' | 'Staff' | 'Coverage' | 'Coverage Requests' | 'PTO Requests' | 'Overtime & Fatigue' | 'Labor Analytics'>('Weekly');
  const [addShiftOpen, setAddShiftOpen]       = useState(false);
  const [shiftSaved, setShiftSaved]           = useState<string | null>(null);
  const [coverageRequests, setCoverageRequests] = useState<CoverageRequest[]>(SEED_REQUESTS);
  const [coverageModalOpen, setCoverageModalOpen] = useState(false);
  const [volunteerTarget, setVolunteerTarget] = useState<CoverageRequest | null>(null);
  const [currentUserId, setCurrentUserId]     = useState<string>('s7');

  const saveShiftAction = (msg: string) => { setShiftSaved(msg); setTimeout(() => setShiftSaved(null), 2500); };

  // ── Coverage request mutations ──

  const handleNewRequest = (req: CoverageRequest) => {
    setCoverageRequests(prev => [req, ...prev]);
    setCoverageModalOpen(false);
    saveShiftAction('Coverage request submitted — awaiting supervisor approval');
  };

  const handleVolunteerConfirm = (reqId: string, volId: string, volName: string) => {
    setCoverageRequests(prev => prev.map(r =>
      r.id === reqId
        ? { ...r, status: 'Pending Approval', volunteerId: volId, volunteerName: volName }
        : r
    ));
    setVolunteerTarget(null);
    saveShiftAction(`Volunteered — sent to ${coverageRequests.find(r => r.id === reqId)?.supervisorName ?? 'supervisor'} for approval`);
  };

  const handleApprove = (reqId: string, notes: string) => {
    setCoverageRequests(prev => prev.map(r =>
      r.id === reqId
        ? { ...r, status: 'Approved', resolvedAt: 'Jul 28', notes: notes || 'Approved — schedule updated.' }
        : r
    ));
    saveShiftAction('Coverage request approved — schedule updated');
  };

  const handleDeny = (reqId: string, notes: string) => {
    setCoverageRequests(prev => prev.map(r =>
      r.id === reqId
        ? { ...r, status: 'Denied', resolvedAt: 'Jul 28', notes: notes || 'Denied — insufficient coverage.' }
        : r
    ));
    saveShiftAction('Coverage request denied');
  };

  // ── Derived stats ──

  const totalHours    = STAFF.length * DAYS.length * 8;
  const ptoCount      = STAFF.reduce((acc, s) => acc + DAYS.filter(d => {
    const shifts = SCHEDULE[s.id]?.[d];
    return shifts && Object.values(shifts).some(sh => sh?.status === 'PTO');
  }).length, 0);
  const calloffCount  = STAFF.reduce((acc, s) => acc + DAYS.filter(d => {
    const shifts = SCHEDULE[s.id]?.[d];
    return shifts && Object.values(shifts).some(sh => sh?.status === 'Call Off');
  }).length, 0);
  const overtimeCount = STAFF.reduce((acc, s) => acc + DAYS.filter(d => {
    const shifts = SCHEDULE[s.id]?.[d];
    return shifts && Object.values(shifts).some(sh => sh?.status === 'Overtime');
  }).length, 0);

  const ACTIVE_STATUSES = new Set(['Scheduled', 'Overtime', 'On Call']);
  const conflictCells: Set<string> = new Set();
  STAFF.forEach(s => {
    DAYS.forEach(d => {
      const dayShifts = SCHEDULE[s.id]?.[d];
      if (!dayShifts) return;
      const activeShifts = Object.values(dayShifts).filter(sh => sh && ACTIVE_STATUSES.has(sh.status));
      if (activeShifts.length > 1) conflictCells.add(`${s.id}|${d}`);
    });
  });
  const conflictCount = conflictCells.size;

  const groupedStaff = ROLE_ORDER.map(role => ({
    role,
    members: STAFF.filter(s => s.role === role),
  })).filter(g => g.members.length > 0);

  // ── Build coverage-request lookup for the weekly calendar ──
  // key: "staffId|day|shift" → request (only open/pending/volunteer-found)
  const crCellMap: Record<string, CoverageRequest> = {};
  coverageRequests.forEach(req => {
    if (['Open', 'Volunteer Found', 'Pending Approval'].includes(req.status)) {
      crCellMap[`${req.requesterId}|${req.day}|${req.shift}`] = req;
    }
    // Approved swaps: mark the volunteer's cell too
    if (req.status === 'Approved' && req.volunteerId) {
      crCellMap[`${req.volunteerId}|${req.day}|${req.shift}`] = req;
    }
  });

  const pendingApprovalCount = coverageRequests.filter(r =>
    (r.status === 'Volunteer Found' || r.status === 'Pending Approval') &&
    r.supervisorId === currentUserId
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Staff Scheduling</h1>
          <p className="text-slate text-sm mt-0.5">Shift assignments, coverage requests, and PTO management</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {}} className="p-1.5 hover:bg-gray-100 rounded" title="Previous week"><ChevronLeft className="w-4 h-4 text-slate" /></button>
          <span className="text-sm font-semibold text-navy px-2">Week of July 14–20, 2026</span>
          <button onClick={() => {}} className="p-1.5 hover:bg-gray-100 rounded" title="Next week"><ChevronRight className="w-4 h-4 text-slate" /></button>
          <LockedButton locked={readOnly} onClick={() => setAddShiftOpen(true)} className="ml-2 btn-primary text-sm px-4 py-2">+ Add Shift</LockedButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Staff Scheduled',     value: `${STAFF.length}`, sub: 'Active this week',         color: 'text-navy' },
          { label: 'PTO / Approved Leave', value: String(ptoCount),  sub: 'Shifts',                   color: 'text-purple-600' },
          { label: 'Call-offs',            value: String(calloffCount), sub: 'Unplanned absences',    color: 'text-red-600' },
          { label: 'Overtime Shifts',      value: String(overtimeCount), sub: 'Requiring payroll approval', color: 'text-amber-600' },
          { label: 'Scheduling Conflicts', value: String(conflictCount), sub: 'Overlapping shifts', color: conflictCount > 0 ? 'text-red-600' : 'text-green-600' },
          { label: 'Coverage Requests',    value: String(coverageRequests.filter(r => !['Approved','Denied','Cancelled'].includes(r.status)).length), sub: 'Open or pending approval', color: 'text-sky-600' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Weekly', 'Staff', 'Coverage', 'Coverage Requests', 'PTO Requests', 'Overtime & Fatigue', 'Labor Analytics'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${view === v ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>
            {v}
            {v === 'Coverage Requests' && pendingApprovalCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange text-white text-[9px] font-bold rounded-full flex items-center justify-center">{pendingApprovalCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Weekly View ── */}
      {view === 'Weekly' && (
        <div className="space-y-3">
          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] text-slate">
            <span className="font-semibold">Legend:</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded border-2 border-dashed border-sky-400 bg-sky-50" /> Open coverage request</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded border-2 border-dashed border-amber-400 bg-amber-50" /> Pending supervisor approval</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded border-2 border-green-400 bg-green-50" /> Approved coverage change</span>
          </div>
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
                            <div className="font-medium text-navy text-[11px]">{s.name}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate text-[10px]">{s.credential}</td>
                        {DAYS.map(day => {
                          const shifts     = SCHEDULE[s.id]?.[day];
                          const activeShifts = shifts ? Object.entries(shifts).filter(([, v]) => v !== null) : [];
                          const isConflict = conflictCells.has(`${s.id}|${day}`);

                          return (
                            <td key={day} className={`px-1 py-1.5 relative ${day.includes('7/19') || day.includes('7/20') ? 'bg-blue-50/50' : ''} ${isConflict ? 'bg-red-50 ring-1 ring-inset ring-red-200' : ''}`}>
                              {isConflict && (
                                <span className="absolute top-0.5 right-0.5 text-red-500 text-[9px] leading-none">⚠</span>
                              )}
                              {activeShifts.length === 0
                                ? <div className="text-center text-gray-300 text-[10px]">—</div>
                                : activeShifts.map(([shiftType, assignment]) => {
                                    if (!assignment) return null;
                                    const crKey = `${s.id}|${day}|${shiftType}`;
                                    const cr    = crCellMap[crKey];
                                    const isCROpen    = cr && cr.status === 'Open';
                                    const isCRPending = cr && (cr.status === 'Volunteer Found' || cr.status === 'Pending Approval');
                                    const isCRApproved = cr && cr.status === 'Approved';
                                    return (
                                      <div key={shiftType}
                                        className={`rounded text-[10px] px-1.5 py-0.5 mb-0.5 border-2 ${
                                          isCROpen    ? 'border-dashed border-sky-400 bg-sky-50 text-sky-800' :
                                          isCRPending ? 'border-dashed border-amber-400 bg-amber-50 text-amber-800' :
                                          isCRApproved ? 'border-green-400 bg-green-50 text-green-800' :
                                          `border ${SHIFT_STATUS_STYLE[assignment.status]}`
                                        }`}>
                                        <div className="flex items-center gap-0.5">
                                          <span className="font-medium">{shiftType[0]}</span>
                                          {' · '}
                                          <span>{isCRApproved && cr.volunteerId === s.id ? `Cover (${cr.requesterName.split(' ')[1]})` : assignment.status}</span>
                                          {isCROpen    && <span className="ml-0.5 font-bold">?</span>}
                                          {isCRPending && <span className="ml-0.5">⏳</span>}
                                          {isCRApproved && cr.requesterId === s.id && <span className="ml-0.5">✓</span>}
                                        </div>
                                      </div>
                                    );
                                  })
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
        </div>
      )}

      {/* ── Staff View ── */}
      {view === 'Staff' && (
        <div className="grid grid-cols-2 gap-4">
          {STAFF.map(s => {
            const shifts   = DAYS.map(d => ({ day: d, ...SCHEDULE[s.id]?.[d] }));
            const totalDays = shifts.filter(sh => Object.values(sh).some(v => v && (v as ShiftAssignment).status === 'Scheduled')).length;
            const pto       = shifts.filter(sh => Object.values(sh).some(v => v && (v as ShiftAssignment).status === 'PTO')).length;
            const ot        = shifts.filter(sh => Object.values(sh).some(v => v && (v as ShiftAssignment).status === 'Overtime')).length;
            const myCRs     = coverageRequests.filter(r => r.requesterId === s.id && !['Approved','Denied','Cancelled'].includes(r.status));
            return (
              <div key={s.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${s.color}`}>
                    {s.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy text-sm">{s.name}</div>
                    <div className="text-xs text-slate">{s.role} · {s.credential}</div>
                  </div>
                  {myCRs.length > 0 && (
                    <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-full">{myCRs.length} CR</span>
                  )}
                </div>
                <div className="flex gap-3 text-xs mb-3">
                  <div className="text-center"><div className="font-bold text-navy text-lg">{totalDays}</div><div className="text-slate">Scheduled</div></div>
                  <div className="text-center"><div className="font-bold text-purple-600 text-lg">{pto}</div><div className="text-slate">PTO</div></div>
                  <div className="text-center"><div className="font-bold text-amber-600 text-lg">{ot}</div><div className="text-slate">OT</div></div>
                </div>
                <div className="flex gap-1">
                  {DAYS.map(d => {
                    const dayShifts = SCHEDULE[s.id]?.[d];
                    const active    = dayShifts ? Object.values(dayShifts).filter(Boolean) : [];
                    const status    = active.length > 0 ? (active[0] as ShiftAssignment).status : null;
                    const hasCR     = coverageRequests.some(r =>
                      r.requesterId === s.id && r.day === d && !['Approved','Denied','Cancelled'].includes(r.status)
                    );
                    return (
                      <div key={d} title={`${d.split('\n')[0]}: ${status || 'Off'}${hasCR ? ' — Coverage Requested' : ''}`}
                        className={`flex-1 h-6 rounded text-center text-[9px] font-bold flex items-center justify-center border relative ${
                          hasCR ? 'border-dashed border-sky-400 bg-sky-50 text-sky-700' :
                          status === 'Scheduled' ? 'bg-green-100 border-green-200 text-green-700' :
                          status === 'PTO' ? 'bg-purple-100 border-purple-200 text-purple-600' :
                          status === 'On Call' ? 'bg-blue-100 border-blue-200 text-blue-600' :
                          status === 'Call Off' ? 'bg-red-100 border-red-200 text-red-600' :
                          status === 'Overtime' ? 'bg-amber-100 border-amber-200 text-amber-600' :
                          'bg-gray-100 border-gray-200 text-gray-300'
                        }`}>
                        {hasCR ? '?' : d.split('\n')[0][0]}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Coverage Gaps ── */}
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
                        { role: 'BHT / Tech',  required: req.bhts,   ids: ['s10', 's11', 's12'] },
                        { role: 'Counselors',  required: req.counselors, ids: ['s7', 's8', 's9'] },
                      ].map(row => (
                        <tr key={row.role} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-medium text-navy">{row.role} <span className="text-slate font-normal">(need {row.required})</span></td>
                          {DAYS.map(d => {
                            const scheduled = row.ids.filter(id => {
                              const s = SCHEDULE[id]?.[d]?.[shift];
                              return s && s.status !== 'PTO' && s.status !== 'Call Off';
                            }).length;
                            const openCRsHere = coverageRequests.filter(r =>
                              row.ids.includes(r.requesterId) && r.day === d && r.shift === shift &&
                              ['Open', 'Volunteer Found', 'Pending Approval'].includes(r.status)
                            ).length;
                            const met = scheduled >= row.required;
                            return (
                              <td key={d} className="text-center px-2 py-2">
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${met ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {met ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                  <span className="font-semibold">{scheduled}/{row.required}</span>
                                </div>
                                {openCRsHere > 0 && (
                                  <div className="mt-0.5 text-[9px] text-sky-600 font-semibold">{openCRsHere} CR open</div>
                                )}
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

      {/* ── Coverage Requests Tab ── */}
      {view === 'Coverage Requests' && (
        <CoverageRequestsTab
          requests={coverageRequests}
          currentUserId={currentUserId}
          onCurrentUserChange={setCurrentUserId}
          onApprove={handleApprove}
          onDeny={handleDeny}
          onVolunteer={setVolunteerTarget}
          onNewRequest={() => setCoverageModalOpen(true)}
          readOnly={readOnly}
        />
      )}

      {/* ── PTO Requests ── */}
      {view === 'PTO Requests' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Pending Requests',     value: 3,  sub: 'Awaiting approval',       color: 'text-amber-600' },
              { label: 'Approved This Month',  value: 7,  sub: 'Scheduled PTO',            color: 'text-green-600' },
              { label: 'Denied',               value: 1,  sub: 'Insufficient coverage',    color: 'text-red-600' },
              { label: 'PTO Days Used YTD',    value: 38, sub: 'Across all staff',          color: 'text-navy' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-border font-semibold text-navy text-sm flex items-center justify-between">
              <span>PTO & Leave Requests</span>
              <LockedButton locked={readOnly} onClick={() => saveShiftAction('Request submitted')} className="text-xs btn-primary px-3 py-1.5 flex items-center gap-1"><Plus className="w-3 h-3" />Submit Request</LockedButton>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg text-slate">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Staff Member</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Dates</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Days</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Coverage Plan</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'Jessica Torres, RN',   role: 'Nurse',     type: 'Vacation',   dates: 'Jul 28 – Aug 1', days: 5,  coverage: 'A. Patel covers Day / Per diem hired for Eve', status: 'Pending' },
                  { name: 'David Odom, LCADC',     role: 'Counselor', type: 'Personal',   dates: 'Jul 25',         days: 1,  coverage: 'Group re-assigned to Sarah Jenkins',           status: 'Pending' },
                  { name: 'Marcus Davis, BHT',     role: 'BHT',       type: 'Sick Leave', dates: 'Jul 24 – 25',    days: 2,  coverage: 'Kevin Smith covers both days',                 status: 'Pending' },
                  { name: 'Sarah Jenkins, LCPC',   role: 'Counselor', type: 'Vacation',   dates: 'Aug 4 – 8',      days: 5,  coverage: 'Temp counselor scheduled. Caseload split 3-way.', status: 'Approved' },
                  { name: 'Anita Patel, RN',       role: 'Nurse',     type: 'FMLA',       dates: 'Jul 21 – Aug 15',days: 18, coverage: 'Per diem staff + agency coverage approved',     status: 'Approved' },
                  { name: 'Kevin Smith, BHT',      role: 'BHT',       type: 'Vacation',   dates: 'Aug 11 – 12',    days: 2,  coverage: 'Marcus Davis / per diem',                      status: 'Approved' },
                  { name: 'Robert Davis, BHT',     role: 'BHT',       type: 'Vacation',   dates: 'Jul 22 – 23',    days: 2,  coverage: 'Denied — insufficient BHT coverage per ratio policy', status: 'Denied' },
                ].map(r => (
                  <tr key={r.name} className={`hover:bg-gray-50 ${r.status === 'Pending' ? 'bg-amber-50/40' : r.status === 'Denied' ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{r.name}</td>
                    <td className="px-4 py-3 text-slate">{r.role}</td>
                    <td className="px-4 py-3"><span className="text-[10px] font-medium bg-slate-100 text-slate px-1.5 py-0.5 rounded">{r.type}</span></td>
                    <td className="px-4 py-3 text-slate whitespace-nowrap">{r.dates}</td>
                    <td className="px-4 py-3 text-center font-bold text-navy">{r.days}</td>
                    <td className="px-4 py-3 text-slate max-w-[200px]">{r.coverage}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'Approved' ? 'bg-green-100 text-green-700' : r.status === 'Denied' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.status === 'Pending' && (
                        <div className="flex gap-1 justify-center">
                          <LockedButton locked={readOnly} onClick={() => saveShiftAction('Request approved')} className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">✓ Approve</LockedButton>
                          <LockedButton locked={readOnly} onClick={() => saveShiftAction('Request denied')} className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">✕ Deny</LockedButton>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Overtime & Fatigue ── */}
      {view === 'Overtime & Fatigue' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Staff hours tracking — overtime threshold alerts, consecutive-shift flags, and fatigue risk monitoring to prevent burnout and regulatory violations.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Overtime Hours (This Week)', value: '14.5 hrs', sub: 'Across 3 staff',         color: 'text-amber-600' },
              { label: 'Approaching OT Threshold',  value: 2,           sub: 'Staff at 36–40 hrs',    color: 'text-amber-600' },
              { label: 'Consecutive Shifts ≥4',     value: 1,           sub: 'Jessica Torres — DON',  color: 'text-red-600' },
              { label: 'Agency Shifts This Week',   value: 3,           sub: 'Float pool RNs',         color: 'text-navy' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-border font-semibold text-navy text-sm">Staff Hours — Current Week (Jul 14–20, 2026)</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg text-slate">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Staff Member</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Role</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Shifts</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Hours</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">OT Hours</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Consecutive</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'Jessica Torres',     role: 'DON / RN',          shifts: 5, hours: 46, ot: 6, consec: 5, risk: 'High' },
                  { name: 'Michael Boyd',        role: 'RN',                shifts: 4, hours: 42, ot: 2, consec: 4, risk: 'Med' },
                  { name: 'James S. Collins III',role: 'Clinical Supervisor',shifts: 5, hours: 43, ot: 3, consec: 3, risk: 'Med' },
                  { name: 'Sarah Jenkins',       role: 'LCPC',              shifts: 5, hours: 40, ot: 0, consec: 5, risk: 'Low' },
                  { name: 'Maria Gonzales',      role: 'LCADC',             shifts: 5, hours: 40, ot: 0, consec: 3, risk: 'Low' },
                  { name: 'Marcus Thompson',     role: 'PSS',               shifts: 4, hours: 32, ot: 0, consec: 4, risk: 'Low' },
                  { name: 'Dr. Robert Chen',     role: 'Medical Director',  shifts: 3, hours: 24, ot: 0, consec: 2, risk: 'Low' },
                  { name: 'Float RN (Agency)',   role: 'RN — Agency',       shifts: 3, hours: 36, ot: 0, consec: 3, risk: 'N/A' },
                ].map(r => (
                  <tr key={r.name} className={`hover:bg-gray-50 ${r.risk === 'High' ? 'bg-red-50/40' : r.risk === 'Med' ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-navy">{r.name}</td>
                    <td className="px-3 py-2.5 text-center text-slate">{r.role}</td>
                    <td className="px-3 py-2.5 text-center text-slate">{r.shifts}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-navy">{r.hours}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={r.ot > 0 ? 'font-bold text-amber-600' : 'text-slate'}>{r.ot > 0 ? `+${r.ot}` : '—'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate">{r.consec} days</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.risk === 'High' ? 'bg-red-100 text-red-700' : r.risk === 'Med' ? 'bg-amber-100 text-amber-700' : r.risk === 'Low' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-slate'}`}>{r.risk}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Regulatory Thresholds — Policy Reference</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {[
                { rule: 'Standard Workweek',              threshold: '40 hrs / week',  consequence: 'OT pay required after 40 hrs (FLSA)',                status: 'Monitored' },
                { rule: 'Mandatory Rest Between Shifts',  threshold: '8 hrs minimum',  consequence: 'Fatigue policy violation — must document waiver',    status: 'Monitored' },
                { rule: 'Consecutive Day Limit (Policy)', threshold: '≤5 days',        consequence: 'Day 5+ triggers supervisor review',                  status: 'Active Alert' },
                { rule: 'Licensed RN OT Cap (CARF Rec.)',  threshold: '≤12 hrs/day',   consequence: 'Documented variance required',                        status: 'Monitored' },
              ].map(r => (
                <div key={r.rule} className="p-3 border border-border rounded-lg">
                  <div className="font-semibold text-navy">{r.rule}</div>
                  <div className="text-orange font-bold mt-0.5">{r.threshold}</div>
                  <div className="text-slate mt-0.5">{r.consequence}</div>
                  <div className={`text-[10px] font-bold mt-1 ${r.status === 'Active Alert' ? 'text-red-600' : 'text-green-600'}`}>{r.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Labor Analytics ── */}
      {view === 'Labor Analytics' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Staffing cost, hours, and workforce utilization analytics for the trailing 30 days — supports budget planning and agency staffing decisions.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Paid Hours (30d)', value: '1,284h',  color: 'text-navy',       sub: 'All staff classifications' },
              { label: 'OT Hours',               value: '94h',     color: 'text-amber-600',  sub: '7.3% of total — target ≤8%' },
              { label: 'Agency / PRN Hours',     value: '62h',     color: 'text-blue-600',   sub: '4.8% of total hours' },
              { label: 'Labor Cost (Est.)',       value: '$68,400', color: 'text-teal-600',   sub: 'Based on avg pay rates' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Hours by Department (30 Days)</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { dept: 'Nursing (RN + LPN)',         hours: 418, pct: 33, color: 'bg-blue-500',   ot: 38 },
                  { dept: 'BHT / Residential Support',  hours: 312, pct: 24, color: 'bg-teal-500',   ot: 21 },
                  { dept: 'Clinical (Counselors)',       hours: 286, pct: 10, color: 'bg-purple-500', ot: 18 },
                  { dept: 'Case Management',             hours: 128, pct: 10, color: 'bg-orange-400', ot: 9  },
                  { dept: 'Medical (MD + NP)',           hours: 84,  pct: 7,  color: 'bg-green-500',  ot: 5  },
                  { dept: 'Administration',              hours: 56,  pct: 4,  color: 'bg-gray-400',   ot: 3  },
                ].map(d => (
                  <div key={d.dept}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate">{d.dept}</span>
                      <span className="font-semibold text-navy">{d.hours}h ({d.pct}%) — OT: {d.ot}h</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${d.color}`} style={{ width: `${d.pct * 2.5}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Staffing Cost per Patient Day</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { loc: 'Residential', cpd: '$148', census: 14, target: '$155' },
                    { loc: 'PHP',         cpd: '$86',  census: 8,  target: '$95' },
                    { loc: 'IOP',         cpd: '$54',  census: 11, target: '$60' },
                    { loc: 'Detox',       cpd: '$212', census: 3,  target: '$225' },
                  ].map(r => (
                    <div key={r.loc} className="flex items-center justify-between border border-border rounded p-2.5">
                      <div>
                        <div className="font-medium text-navy">{r.loc} (census {r.census})</div>
                        <div className="text-slate text-[10px]">Budget target: {r.target}/day</div>
                      </div>
                      <span className="font-bold text-2xl text-green-600">{r.cpd}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <strong>Labor Note:</strong> All LOCs tracking below budget target for staffing cost per patient day. OT at 7.3% is within the ≤8% policy threshold. Agency hours driven by M. Boyd call-out (week of 07/14) — no agency dependency trend identified.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Shift Modal ── */}
      {addShiftOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setAddShiftOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[480px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-navy">Add Shift</h2>
              <button onClick={() => setAddShiftOpen(false)} className="text-slate hover:text-navy"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Staff Member *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Jessica Torres, RN</option><option>Michael Boyd, RN</option><option>Kevin Wright, BHT</option><option>Sarah Jenkins, LCPC</option><option>Maria Gonzales, LCADC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Shift Date *</label>
                  <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Start Time *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    {['6:00 AM','7:00 AM','8:00 AM','10:00 AM','12:00 PM','2:00 PM','3:00 PM','6:00 PM','10:00 PM','11:00 PM'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">End Time *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    {['2:00 PM','3:00 PM','4:00 PM','6:00 PM','8:00 PM','10:00 PM','11:00 PM','6:00 AM (next day)','7:00 AM (next day)'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Role / Unit</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Nursing — Residential</option><option>BHT — Residential</option><option>Clinical — IOP</option><option>Clinical — PHP</option><option>Float / On-call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Shift Type</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Regular</option><option>Overtime (pre-approved)</option><option>On-call</option><option>Mandatory coverage</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Notes</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[50px] resize-none" placeholder="Coverage reason, special instructions, callout context..." />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setAddShiftOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setAddShiftOpen(false); saveShiftAction('Shift added to schedule'); }} className="flex-1 bg-navy text-white rounded-xl py-2.5 text-sm font-semibold">Add Shift</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request Coverage Modal ── */}
      {coverageModalOpen && (
        <RequestCoverageModal
          currentUserId={currentUserId}
          onClose={() => setCoverageModalOpen(false)}
          onSubmit={handleNewRequest}
          readOnly={readOnly}
        />
      )}

      {/* ── Volunteer Confirm Modal ── */}
      {volunteerTarget && (
        <VolunteerModal
          request={volunteerTarget}
          currentUserId={currentUserId}
          onClose={() => setVolunteerTarget(null)}
          onConfirm={handleVolunteerConfirm}
          readOnly={readOnly}
        />
      )}

      {/* ── Toast ── */}
      {shiftSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> {shiftSaved}
        </div>
      )}
    </div>
  );
}
