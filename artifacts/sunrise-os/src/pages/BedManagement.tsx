import React, { useState } from 'react';
import { Screen } from '../App';
import { Bed, CheckCircle, AlertTriangle, Clock, Wrench, Plus, Filter, RefreshCw, X } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type BedStatus = 'Occupied' | 'Available' | 'Housekeeping' | 'Maintenance' | 'Blocked';
type Unit = 'All' | 'Detox' | 'Residential A' | 'Residential B' | 'Flex';

interface BedRecord {
  id: string;
  room: string;
  unit: Exclude<Unit, 'All'>;
  type: 'Private' | 'Semi-Private';
  status: BedStatus;
  patient?: string;
  mrn?: string;
  program?: string;
  los?: number;
  expectedDischarge?: string;
  assignedAt?: string;
  cleanedBy?: string;
  note?: string;
}

const BEDS: BedRecord[] = [
  { id: 'b1',  room: '1A', unit: 'Detox',         type: 'Private',      status: 'Occupied',     patient: 'Marcus Webb',     mrn: 'MRN-83921', program: 'Detox',       los: 5,  expectedDischarge: '2026-07-21', assignedAt: '2026-07-14' },
  { id: 'b2',  room: '1B', unit: 'Detox',         type: 'Private',      status: 'Occupied',     patient: 'James Thornton',  mrn: 'MRN-62841', program: 'Detox',       los: 3,  expectedDischarge: '2026-07-22', assignedAt: '2026-07-16' },
  { id: 'b3',  room: '1C', unit: 'Detox',         type: 'Private',      status: 'Maintenance',  note: 'Plumbing repair — call placed to contractor', cleanedBy: 'Facilities' },
  { id: 'b4',  room: '1D', unit: 'Detox',         type: 'Private',      status: 'Available' },
  { id: 'b5',  room: '2A', unit: 'Residential A',  type: 'Semi-Private', status: 'Occupied',     patient: 'Robert Navarro',  mrn: 'MRN-44782', program: 'Residential', los: 22, expectedDischarge: '2026-08-02', assignedAt: '2026-06-27' },
  { id: 'b6',  room: '2B', unit: 'Residential A',  type: 'Semi-Private', status: 'Occupied',     patient: 'Linda Farris',    mrn: 'MRN-39018', program: 'Residential', los: 15, expectedDischarge: '2026-07-28', assignedAt: '2026-07-04' },
  { id: 'b7',  room: '2C', unit: 'Residential A',  type: 'Private',      status: 'Housekeeping', cleanedBy: 'Maria L.', note: 'Deep clean — anticipated ready 4 PM' },
  { id: 'b8',  room: '2D', unit: 'Residential A',  type: 'Private',      status: 'Available' },
  { id: 'b9',  room: '3A', unit: 'Residential B',  type: 'Semi-Private', status: 'Occupied',     patient: 'Samantha Choi',   mrn: 'MRN-74563', program: 'Residential', los: 11, expectedDischarge: '2026-07-30', assignedAt: '2026-07-08' },
  { id: 'b10', room: '3B', unit: 'Residential B',  type: 'Semi-Private', status: 'Occupied',     patient: 'Destiny Williams', mrn: 'MRN-55129', program: 'Residential', los: 18, expectedDischarge: '2026-07-25', assignedAt: '2026-07-01' },
  { id: 'b11', room: '3C', unit: 'Residential B',  type: 'Private',      status: 'Occupied',     patient: 'Thomas Reilly',   mrn: 'MRN-91002', program: 'Detox',       los: 3,  expectedDischarge: '2026-07-22', assignedAt: '2026-07-16' },
  { id: 'b12', room: '3D', unit: 'Residential B',  type: 'Private',      status: 'Available' },
  { id: 'b13', room: '4A', unit: 'Flex',           type: 'Private',      status: 'Occupied',     patient: 'Elena Vasquez',   mrn: 'MRN-28841', program: 'PHP',        los: 8,  expectedDischarge: '2026-07-26', assignedAt: '2026-07-11' },
  { id: 'b14', room: '4B', unit: 'Flex',           type: 'Private',      status: 'Blocked',      note: 'Reserved — incoming admission (T. Reilly step-up)' },
  { id: 'b15', room: '4C', unit: 'Flex',           type: 'Semi-Private', status: 'Available' },
  { id: 'b16', room: '4D', unit: 'Flex',           type: 'Semi-Private', status: 'Housekeeping', cleanedBy: 'Maria L.', note: 'Standard turn — ready in 1 hour' },
];

const STATUS_CONFIG: Record<BedStatus, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  Occupied:     { color: 'text-blue-700',  bg: 'bg-blue-50',   border: 'border-blue-200',  icon: <Bed className="w-4 h-4" />,          label: 'Occupied' },
  Available:    { color: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-200', icon: <CheckCircle className="w-4 h-4" />,   label: 'Available' },
  Housekeeping: { color: 'text-amber-700', bg: 'bg-amber-50',  border: 'border-amber-200', icon: <Clock className="w-4 h-4" />,         label: 'Housekeeping' },
  Maintenance:  { color: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-200',   icon: <Wrench className="w-4 h-4" />,        label: 'Maintenance' },
  Blocked:      { color: 'text-purple-700',bg: 'bg-purple-50', border: 'border-purple-200',icon: <AlertTriangle className="w-4 h-4" />, label: 'Blocked' },
};

function BedCard({ bed, onClick }: { bed: BedRecord; onClick: () => void }) {
  const cfg = STATUS_CONFIG[bed.status];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border-2 p-3 transition-all hover:shadow-md ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`${cfg.color}`}>{cfg.icon}</span>
          <span className="font-bold text-navy text-sm">Room {bed.room}</span>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{bed.type === 'Private' ? 'Pvt' : 'Semi'}</span>
      </div>
      {bed.status === 'Occupied' && bed.patient && (
        <>
          <div className="font-semibold text-navy text-xs truncate">{bed.patient}</div>
          <div className="text-[10px] text-slate font-mono">{bed.mrn}</div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] bg-blue-100 text-blue-700 font-medium px-1.5 py-0.5 rounded">{bed.program}</span>
            <span className="text-[10px] text-slate">LOS {bed.los}d</span>
          </div>
          <div className="text-[10px] text-slate mt-1">Discharge: {bed.expectedDischarge}</div>
        </>
      )}
      {bed.status === 'Available' && (
        <div className="text-xs text-green-600 font-medium mt-1">Ready for admission</div>
      )}
      {(bed.status === 'Housekeeping' || bed.status === 'Maintenance') && (
        <>
          <div className="text-[10px] text-slate mt-1 leading-snug line-clamp-2">{bed.note}</div>
          {bed.cleanedBy && <div className="text-[10px] text-slate mt-0.5">Assigned: {bed.cleanedBy}</div>}
        </>
      )}
      {bed.status === 'Blocked' && (
        <div className="text-[10px] text-purple-700 mt-1 leading-snug">{bed.note}</div>
      )}
    </button>
  );
}

export function BedManagement({ navigate, readOnly }: Props) {
  const [unit, setUnit] = useState<Unit>('All');
  const [statusFilter, setStatusFilter] = useState<BedStatus | 'All'>('All');
  const [selected, setSelected] = useState<BedRecord | null>(null);
  const [bedTab, setBedTab] = useState<'Board' | 'Housekeeping Queue' | 'Capacity Forecast' | 'Maintenance Log' | 'Occupancy Trends' | 'Vendor Contacts'>('Board');
  const [workOrderOpen, setWorkOrderOpen] = useState(false);
  const [workOrderSaved, setWorkOrderSaved] = useState<string | null>(null);
  const saveBedAction = (msg: string) => { setWorkOrderSaved(msg); setTimeout(() => setWorkOrderSaved(null), 2500); };

  const UNITS: Unit[] = ['All', 'Detox', 'Residential A', 'Residential B', 'Flex'];
  const STATUSES: (BedStatus | 'All')[] = ['All', 'Occupied', 'Available', 'Housekeeping', 'Maintenance', 'Blocked'];

  const visible = BEDS.filter(b =>
    (unit === 'All' || b.unit === unit) &&
    (statusFilter === 'All' || b.status === statusFilter)
  );

  const counts: Record<BedStatus, number> = {
    Occupied: 0, Available: 0, Housekeeping: 0, Maintenance: 0, Blocked: 0,
  };
  BEDS.forEach(b => counts[b.status]++);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Bed className="w-6 h-6 text-sunrise-blue" /> Bed Management
          </h1>
          <p className="text-slate text-sm mt-0.5">Room-level occupancy, housekeeping, and maintenance · Updated 2:45 PM</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => saveBedAction('Bed status refreshed')} className="btn-outline text-xs flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
          <LockedButton locked={readOnly} onClick={() => setWorkOrderOpen(true)} className="btn-primary text-xs flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> New Work Order</LockedButton>
        </div>
      </div>

      {/* Status KPI Row */}
      <div className="grid grid-cols-5 gap-3">
        {(Object.entries(counts) as [BedStatus, number][]).map(([status, count]) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'All' : status)}
              className={`rounded-xl border-2 p-3 text-center transition-all ${statusFilter === status ? `${cfg.bg} ${cfg.border}` : 'bg-white border-border hover:border-slate-300'}`}
            >
              <div className={`text-2xl font-bold ${cfg.color}`}>{count}</div>
              <div className="text-[10px] font-semibold text-slate mt-0.5">{status}</div>
            </button>
          );
        })}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-border">
        {(['Board', 'Housekeeping Queue', 'Capacity Forecast', 'Maintenance Log', 'Occupancy Trends', 'Vendor Contacts'] as const).map(t => (
          <button key={t} onClick={() => setBedTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${bedTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {bedTab === 'Housekeeping Queue' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Housekeeping and maintenance tasks requiring action before beds return to Available status.</div>
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-navy text-sm">Open Tasks</h3>
              <LockedButton locked={readOnly} onClick={() => saveBedAction('Task added')} className="text-xs px-3 py-1.5 bg-navy text-white rounded font-medium hover:bg-navy/90">+ Add Task</LockedButton>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg text-slate">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Room</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Unit</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Task Type</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Description</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Assigned To</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Priority</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Est. Ready</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { room: '1C', unit: 'Detox', type: 'Maintenance', desc: 'Plumbing repair — contractor scheduled', assignee: 'Facilities (Contractor)', priority: 'High', ready: 'Jul 23 AM', status: 'In Progress' },
                  { room: '2C', unit: 'Res. A', type: 'Deep Clean', desc: 'Post-discharge deep clean — anticipated ready 4 PM', assignee: 'Maria L.', priority: 'Normal', ready: 'Today 4 PM', status: 'In Progress' },
                  { room: '4D', unit: 'Flex', type: 'Turnover Clean', desc: 'Standard turnover — linens changed, surfaces wiped', assignee: 'John K.', priority: 'Normal', ready: 'Today 2 PM', status: 'Pending' },
                  { room: '5A', unit: 'Flex', type: 'Inspection', desc: 'HVAC filter replacement — facilities inspection required', assignee: 'Facilities', priority: 'Low', ready: 'Jul 23', status: 'Scheduled' },
                  { room: '3C', unit: 'Res. B', type: 'Biohazard', desc: 'Bodily fluid cleanup — specialized cleaning protocol required', assignee: 'BioCleanse Co.', priority: 'Urgent', ready: 'Today 6 PM', status: 'Pending' },
                ].map(t => (
                  <tr key={t.room + t.type} className={`hover:bg-gray-50 ${t.priority === 'Urgent' ? 'bg-red-50/20' : ''}`}>
                    <td className="px-4 py-2.5 font-bold text-navy">{t.room}</td>
                    <td className="px-4 py-2.5 text-slate">{t.unit}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.type === 'Maintenance' ? 'bg-orange-100 text-orange-700' : t.type === 'Biohazard' ? 'bg-red-100 text-red-700' : t.type === 'Deep Clean' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{t.type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate">{t.desc}</td>
                    <td className="px-3 py-2.5 text-center text-slate">{t.assignee}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.priority === 'Urgent' ? 'bg-red-100 text-red-700' : t.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{t.priority}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate">{t.ready}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : t.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
            <strong>Beds returning today:</strong> Room 2C (Res A) ~4 PM · Room 4D (Flex) ~2 PM · Room 3C (Res B) ~6 PM — total +3 Available by end of shift.
          </div>
        </div>
      )}

      {bedTab === 'Capacity Forecast' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">7-day discharge and admission forecast — projected occupancy and available bed openings by unit.</div>
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-border font-semibold text-navy text-sm">Projected Discharge Schedule — Next 7 Days</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg text-slate">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Patient</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Room</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Unit</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Discharge Type</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Step-Down</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Bed Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { date: 'Jul 22', patient: 'James Thornton', room: '1B', unit: 'Detox', type: 'Planned', stepDown: 'Residential', avail: 'Jul 22 PM' },
                  { date: 'Jul 23', patient: 'Thomas Reilly', room: '3C', unit: 'Res. B', type: 'Planned', stepDown: 'PHP', avail: 'Jul 23 PM' },
                  { date: 'Jul 22', patient: 'Marcus Webb', room: '1A', unit: 'Detox', type: 'Planned', stepDown: 'Residential', avail: 'Jul 22 PM' },
                  { date: 'Jul 24', patient: 'Elena Vasquez', room: '4A', unit: 'Flex', type: 'Planned', stepDown: 'IOP', avail: 'Jul 24 PM' },
                  { date: 'Jul 25', patient: 'Destiny Williams', room: '3B', unit: 'Res. B', type: 'Planned', stepDown: 'Home w/ Aftercare', avail: 'Jul 25 PM' },
                  { date: 'Jul 26', patient: 'Samantha Choi', room: '3A', unit: 'Res. B', type: 'Planned', stepDown: 'Sober Living', avail: 'Jul 26 PM' },
                  { date: 'Jul 28', patient: 'Linda Farris', room: '2B', unit: 'Res. A', type: 'Planned', stepDown: 'PHP', avail: 'Jul 28 PM' },
                ].map(d => (
                  <tr key={d.patient} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-semibold text-navy">{d.date}</td>
                    <td className="px-4 py-2.5 text-navy">{d.patient}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-navy">{d.room}</td>
                    <td className="px-3 py-2.5 text-center text-slate">{d.unit}</td>
                    <td className="px-3 py-2.5 text-center"><span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{d.type}</span></td>
                    <td className="px-3 py-2.5 text-center text-slate">{d.stepDown}</td>
                    <td className="px-3 py-2.5 text-center text-green-600 font-medium">{d.avail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { unit: 'Detox (4 beds)', occupied: 2, avail: 2, incoming: 3, color: 'border-blue-400' },
              { unit: 'Residential A (4 beds)', occupied: 3, avail: 1, incoming: 2, color: 'border-teal-400' },
              { unit: 'Residential B (4 beds)', occupied: 3, avail: 1, incoming: 1, color: 'border-purple-400' },
              { unit: 'Flex (4 beds)', occupied: 2, avail: 1, incoming: 2, color: 'border-orange-400' },
            ].map(u => (
              <div key={u.unit} className={`card border-l-4 ${u.color}`}>
                <h4 className="font-semibold text-navy text-xs mb-2">{u.unit}</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-slate">Occupied now</span><span className="font-bold text-navy">{u.occupied}</span></div>
                  <div className="flex justify-between"><span className="text-slate">Available now</span><span className="font-bold text-green-600">{u.avail}</span></div>
                  <div className="flex justify-between"><span className="text-slate">Incoming (7d)</span><span className="font-bold text-blue-600">{u.incoming}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bedTab === 'Board' && (
      <div className="space-y-5">
      {/* Unit Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate" />
        {UNITS.map(u => (
          <button
            key={u}
            onClick={() => setUnit(u)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${unit === u ? 'bg-sunrise-blue text-white' : 'bg-bg border border-border text-slate hover:border-sunrise-blue/50'}`}
          >
            {u}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate">{visible.length} beds shown</span>
      </div>

      {/* Bed Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {visible.map(b => (
          <BedCard key={b.id} bed={b} onClick={() => setSelected(selected?.id === b.id ? null : b)} />
        ))}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="bg-white border border-border rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-navy text-base">Room {selected.room} — {selected.unit}</div>
            <button onClick={() => setSelected(null)} className="text-slate hover:text-navy text-xs font-medium">✕ Close</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-0.5">Status</div>
              <div className={`font-semibold ${STATUS_CONFIG[selected.status].color}`}>{selected.status}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-0.5">Room Type</div>
              <div className="text-navy font-medium">{selected.type}</div>
            </div>
            {selected.status === 'Occupied' && <>
              <div>
                <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-0.5">Patient</div>
                <div className="font-semibold text-navy">{selected.patient}</div>
                <div className="text-xs text-slate font-mono">{selected.mrn}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-0.5">LOS / Discharge</div>
                <div className="text-navy font-medium">Day {selected.los} · {selected.expectedDischarge}</div>
              </div>
            </>}
            {selected.note && (
              <div className="col-span-2 md:col-span-4">
                <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-0.5">Notes</div>
                <div className="text-navy">{selected.note}</div>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            {selected.status === 'Occupied' && (
              <>
                <button onClick={() => selected.mrn && navigate('PatientDetail', selected.mrn)} className="btn-primary text-xs px-3 py-1.5">View Patient Chart</button>
                <LockedButton locked={readOnly} onClick={() => saveBedAction('Discharge scheduled')} className="btn-outline text-xs px-3 py-1.5">Schedule Discharge</LockedButton>
              </>
            )}
            {selected.status === 'Available' && (
              <LockedButton locked={readOnly} onClick={() => saveBedAction('Bed assigned to patient')} className="btn-primary text-xs px-3 py-1.5">Assign to Patient</LockedButton>
            )}
            {(selected.status === 'Housekeeping' || selected.status === 'Maintenance') && (
              <>
                <LockedButton locked={readOnly} onClick={() => saveBedAction('Bed marked ready')} className="btn-primary text-xs px-3 py-1.5">Mark Ready</LockedButton>
                <LockedButton locked={readOnly} onClick={() => saveBedAction('Note updated')} className="btn-outline text-xs px-3 py-1.5">Update Note</LockedButton>
              </>
            )}
            {selected.status === 'Blocked' && (
              <LockedButton locked={readOnly} onClick={() => saveBedAction('Bed block released')} className="btn-outline text-xs px-3 py-1.5">Release Block</LockedButton>
            )}
          </div>
        </div>
      )}

      </div>
      )}

      {bedTab === 'Maintenance Log' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Facility maintenance and work order tracking — open requests, scheduled preventive maintenance, and compliance items.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Open Work Orders', value: 4, color: 'text-amber-600', sub: 'Awaiting completion' },
              { label: 'In Progress', value: 2, color: 'text-blue-600', sub: 'Facilities team on-site' },
              { label: 'Completed This Month', value: 18, color: 'text-green-600', sub: 'Avg 2.1 days to resolve' },
              { label: 'Compliance Due (30d)', value: 3, color: 'text-red-600', sub: 'Fire/safety inspections' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <h3 className="font-semibold text-navy text-sm mb-3">Open Work Orders</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">ID</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Location</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Issue</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Priority</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Reported</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Assigned To</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { id: 'WO-0041', loc: 'Room 3A', issue: 'HVAC not cooling — temperature 78°F', priority: 'High', date: '07/17', assigned: 'Facilities', status: 'In Progress', sColor: 'bg-blue-100 text-blue-700' },
                  { id: 'WO-0042', loc: 'Group Room B', issue: 'Ceiling tile damaged — water stain visible', priority: 'Medium', date: '07/17', assigned: 'Facilities', status: 'Open', sColor: 'bg-amber-100 text-amber-700' },
                  { id: 'WO-0043', loc: 'Nurses Station', issue: 'Medication lockbox keypad malfunction', priority: 'High', date: '07/18', assigned: 'Security Sys.', status: 'In Progress', sColor: 'bg-blue-100 text-blue-700' },
                  { id: 'WO-0044', loc: 'Room 1B', issue: 'Bathroom faucet dripping — high water waste', priority: 'Low', date: '07/18', assigned: 'Unassigned', status: 'Open', sColor: 'bg-amber-100 text-amber-700' },
                  { id: 'WO-0045', loc: 'Common Area', issue: 'TV mount loose — safety concern', priority: 'Medium', date: '07/19', assigned: 'Facilities', status: 'Open', sColor: 'bg-amber-100 text-amber-700' },
                  { id: 'WO-0046', loc: 'Kitchen', issue: 'Dishwasher not draining', priority: 'Medium', date: '07/19', assigned: 'Unassigned', status: 'Open', sColor: 'bg-amber-100 text-amber-700' },
                ].map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-mono text-navy font-bold">{r.id}</td>
                    <td className="px-3 py-2.5 text-slate">{r.loc}</td>
                    <td className="px-3 py-2.5 font-medium text-navy">{r.issue}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.priority === 'High' ? 'bg-red-100 text-red-700' : r.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-slate'}`}>{r.priority}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate">{r.date}</td>
                    <td className="px-3 py-2.5 text-slate">{r.assigned}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.sColor}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {bedTab === 'Occupancy Trends' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">30-day occupancy trends by unit and room — identifies peak occupancy windows, seasonal patterns, and revenue optimization opportunities.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: '30-Day Avg Occupancy', value: '81%', color: 'text-green-600', sub: 'Up from 76% prior 30d' },
              { label: 'Peak Occupancy Day', value: 'Monday', color: 'text-navy', sub: 'New admit + hold-over pattern' },
              { label: 'Lowest Occupancy Day', value: 'Friday', color: 'text-slate', sub: 'Higher discharge volume' },
              { label: 'Weekend Avg Occupancy', value: '74%', color: 'text-blue-600', sub: 'vs. 86% weekday avg' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Occupancy by Unit — Week-by-Week (Last 5 Weeks)</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Unit', 'Beds', 'Jun 22', 'Jun 29', 'Jul 6', 'Jul 13', 'Jul 20', 'Trend'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { unit: "Men's Residential", beds: 10, w1: '80%', w2: '80%', w3: '90%', w4: '90%', w5: '90%', trend: '↑ Stable High' },
                  { unit: "Women's Residential", beds: 8, w1: '75%', w2: '88%', w3: '88%', w4: '88%', w5: '88%', trend: '↑ Strong' },
                  { unit: 'Detox / Med Mgd', beds: 6, w1: '67%', w2: '83%', w3: '83%', w4: '100%', w5: '83%', trend: '↑ High demand' },
                  { unit: 'PHP Day Track', beds: 12, w1: '58%', w2: '67%', w3: '75%', w4: '83%', w5: '75%', trend: '↑ Building' },
                  { unit: 'IOP Track', beds: 8, w1: '63%', w2: '63%', w3: '75%', w4: '75%', w5: '75%', trend: '→ Flat Growth' },
                ].map(r => {
                  const getColor = (v: string) => {
                    const n = parseInt(v); return n >= 90 ? 'text-amber-600 font-bold' : n >= 75 ? 'text-green-600 font-semibold' : 'text-blue-600';
                  };
                  return (
                    <tr key={r.unit} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-navy">{r.unit}</td>
                      <td className="px-3 py-2 text-center text-slate">{r.beds}</td>
                      {[r.w1, r.w2, r.w3, r.w4, r.w5].map((w, i) => (
                        <td key={i} className={`px-3 py-2 text-center ${getColor(w)}`}>{w}</td>
                      ))}
                      <td className="px-3 py-2 text-slate italic text-[10px]">{r.trend}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {bedTab === 'Vendor Contacts' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Facility maintenance, housekeeping, and equipment vendors — contacts, contract terms, and response SLAs.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Maintenance & Facilities Vendors</h3>
              <div className="space-y-2 text-xs">
                {[
                  { vendor: 'ProCare HVAC Services', category: 'HVAC', contact: 'Mike R. — 301-555-0401', contract: 'Annual service contract — Q1/Q3 PM visits', sla: '4h emergency response', status: 'Active' },
                  { vendor: 'Bright Light Electrical', category: 'Electrical', contact: 'T. Nguyen — 301-555-0402', contract: 'On-call as needed; 30-day net billing', sla: '2h emergency; 48h standard', status: 'Active' },
                  { vendor: 'FlowRight Plumbing', category: 'Plumbing', contact: 'D. Carter — 301-555-0403', contract: 'On-call as needed', sla: '2h emergency; 24h standard', status: 'Active' },
                  { vendor: 'SecureLock Systems', category: 'Security / Access Control', contact: 'A. Kim — 301-555-0404', contract: 'Monthly monitoring + annual hardware review', sla: '1h for access failure; 24h for other', status: 'Active' },
                  { vendor: 'MedEquip Southeast', category: 'Medical Equipment', contact: 'L. Morris — 301-555-0405', contract: 'Preventive maintenance semiannually; repair on-call', sla: '4h critical; 72h standard', status: 'Active' },
                ].map(r => (
                  <div key={r.vendor} className="border border-border rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-navy">{r.vendor}</div>
                        <div className="text-[10px] text-slate uppercase tracking-wide mt-0.5">{r.category}</div>
                      </div>
                      <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{r.status}</span>
                    </div>
                    <div className="text-blue-700 mt-1">{r.contact}</div>
                    <div className="text-slate mt-0.5">Contract: {r.contract}</div>
                    <div className="text-teal-700 font-medium mt-0.5">SLA: {r.sla}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Housekeeping & Laundry Vendors</h3>
              <div className="space-y-2 text-xs">
                {[
                  { vendor: 'CleanCare Commercial Services', category: 'Housekeeping', contact: 'S. Okafor — 301-555-0410', contract: 'Mon–Sat daily service; Sunday on-call', sla: '2h for biohazard; daily standard', status: 'Active' },
                  { vendor: 'Linx Linen & Laundry', category: 'Linen Supply', contact: 'P. Thompson — 301-555-0411', contract: 'Twice-weekly delivery; soiled linen pickup', sla: '24h emergency linen delivery', status: 'Active' },
                  { vendor: 'BioShield Remediation', category: 'Biohazard / Remediation', contact: 'T. Carver — 301-555-0412', contract: 'On-call; per-incident billing', sla: '1h response for active biohazard', status: 'Active' },
                  { vendor: 'Greenway Pest Control', category: 'Pest Control', contact: 'K. Williams — 301-555-0413', contract: 'Monthly preventive service', sla: '48h for active infestation', status: 'Active' },
                ].map(r => (
                  <div key={r.vendor} className="border border-border rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-navy">{r.vendor}</div>
                        <div className="text-[10px] text-slate uppercase tracking-wide mt-0.5">{r.category}</div>
                      </div>
                      <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{r.status}</span>
                    </div>
                    <div className="text-blue-700 mt-1">{r.contact}</div>
                    <div className="text-slate mt-0.5">Contract: {r.contract}</div>
                    <div className="text-teal-700 font-medium mt-0.5">SLA: {r.sla}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {workOrderOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setWorkOrderOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[460px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-navy">New Maintenance Work Order</h2>
              <button onClick={() => setWorkOrderOpen(false)} className="text-slate hover:text-navy"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Room / Bed *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Room 101A</option><option>Room 101B</option><option>Room 102A</option><option>Room 102B</option><option>Common Area</option><option>Bathroom Hall A</option><option>Group Room B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Issue Type *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Plumbing</option><option>HVAC / Heating</option><option>Electrical</option><option>Pest Control</option><option>Deep Clean</option><option>Furniture / Fixtures</option><option>Safety / Fire Equipment</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Priority</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Urgent — bed out of service</option><option>High — impacts patient comfort</option><option>Normal — scheduled maintenance</option><option>Low — cosmetic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Reported By</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Jessica Torres, RN</option><option>Kevin Wright, BHT</option><option>Michael Boyd, RN</option><option>Administration</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Description *</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[70px] resize-none" placeholder="Describe the issue in detail — what, where, how long, any safety concern..." />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setWorkOrderOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setWorkOrderOpen(false); saveBedAction('Work order submitted to maintenance'); }} className="flex-1 bg-navy text-white rounded-xl py-2.5 text-sm font-semibold">Submit Work Order</button>
            </div>
          </div>
        </div>
      )}

      {workOrderSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> {workOrderSaved}
        </div>
      )}
    </div>
  );
}
