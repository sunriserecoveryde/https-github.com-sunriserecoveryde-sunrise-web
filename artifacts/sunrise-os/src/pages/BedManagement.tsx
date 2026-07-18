import React, { useState } from 'react';
import { Screen } from '../App';
import { Bed, Wrench, CheckCircle2, AlertCircle, Clock, Filter, RefreshCw } from 'lucide-react';

interface BedRecord {
  id: string;
  room: string;
  bed: string;
  wing: string;
  type: 'Residential' | 'Detox' | 'PHP';
  status: 'Occupied' | 'Available' | 'Needs Cleaning' | 'Maintenance' | 'Hold' | 'Blocked';
  patient?: string;
  mrn?: string;
  lastCleaned?: string;
  cleanedBy?: string;
  maintenanceNote?: string;
  holdReason?: string;
  admitDate?: string;
  expectedDischarge?: string;
}

const BEDS: BedRecord[] = [
  { id: 'b1', room: '101', bed: 'A', wing: 'North', type: 'Residential', status: 'Occupied', patient: 'Marcus Webb', mrn: 'MRN-83921', lastCleaned: '2023-10-14', cleanedBy: 'Housekeeping', admitDate: '2023-10-14', expectedDischarge: '2023-11-13' },
  { id: 'b2', room: '101', bed: 'B', wing: 'North', type: 'Residential', status: 'Available', lastCleaned: '2023-10-25', cleanedBy: 'Maria L.' },
  { id: 'b3', room: '102', bed: 'A', wing: 'North', type: 'Residential', status: 'Occupied', patient: 'Devon Patel', mrn: 'MRN-99321', lastCleaned: '2023-10-18', cleanedBy: 'Housekeeping', admitDate: '2023-10-18', expectedDischarge: '2023-11-17' },
  { id: 'b4', room: '102', bed: 'B', wing: 'North', type: 'Residential', status: 'Needs Cleaning', lastCleaned: '2023-10-23', cleanedBy: 'Housekeeping' },
  { id: 'b5', room: '103', bed: 'A', wing: 'North', type: 'Residential', status: 'Occupied', patient: 'Jamal Foster', mrn: 'MRN-55422', lastCleaned: '2023-10-22', cleanedBy: 'Maria L.', admitDate: '2023-10-22', expectedDischarge: '2023-11-21' },
  { id: 'b6', room: '103', bed: 'B', wing: 'North', type: 'Residential', status: 'Maintenance', maintenanceNote: 'Window latch broken — work order #WO-4421 submitted', lastCleaned: '2023-10-20', cleanedBy: 'Housekeeping' },
  { id: 'b7', room: '104', bed: 'A', wing: 'North', type: 'Residential', status: 'Occupied', patient: 'Elena Vasquez', mrn: 'MRN-88211', lastCleaned: '2023-10-11', cleanedBy: 'Housekeeping', admitDate: '2023-10-11', expectedDischarge: '2023-11-10' },
  { id: 'b8', room: '104', bed: 'B', wing: 'North', type: 'Residential', status: 'Occupied', patient: 'Samantha Choi', mrn: 'MRN-22104', lastCleaned: '2023-10-20', cleanedBy: 'Maria L.', admitDate: '2023-10-20', expectedDischarge: '2023-11-19' },
  { id: 'b9', room: '201', bed: 'A', wing: 'South', type: 'Detox', status: 'Occupied', patient: 'Patient9 Mock9', mrn: 'MRN-12843', lastCleaned: '2023-10-15', cleanedBy: 'Housekeeping', admitDate: '2023-10-15', expectedDischarge: '2023-11-30' },
  { id: 'b10', room: '201', bed: 'B', wing: 'South', type: 'Detox', status: 'Available', lastCleaned: '2023-10-25', cleanedBy: 'Maria L.' },
  { id: 'b11', room: '202', bed: 'A', wing: 'South', type: 'Detox', status: 'Needs Cleaning', lastCleaned: '2023-10-22', cleanedBy: 'Housekeeping' },
  { id: 'b12', room: '202', bed: 'B', wing: 'South', type: 'Detox', status: 'Hold', holdReason: 'Reserved — incoming admission (pending insurance auth)' },
  { id: 'b13', room: '203', bed: 'A', wing: 'South', type: 'PHP', status: 'Available', lastCleaned: '2023-10-24', cleanedBy: 'Maria L.' },
  { id: 'b14', room: '203', bed: 'B', wing: 'South', type: 'PHP', status: 'Available', lastCleaned: '2023-10-24', cleanedBy: 'Maria L.' },
  { id: 'b15', room: '204', bed: 'A', wing: 'South', type: 'PHP', status: 'Maintenance', maintenanceNote: 'HVAC unit not cooling — work order #WO-4419', lastCleaned: '2023-10-19', cleanedBy: 'Housekeeping' },
  { id: 'b16', room: '204', bed: 'B', wing: 'South', type: 'PHP', status: 'Blocked', holdReason: 'Gender-specific bed reserve per census policy' },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  'Occupied':       { color: 'text-sunrise-blue', bg: 'bg-sunrise-blue/10 border-sunrise-blue/30', icon: <Bed className="w-4 h-4" />, label: 'Occupied' },
  'Available':      { color: 'text-success', bg: 'bg-success/10 border-success/30', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Available' },
  'Needs Cleaning': { color: 'text-sunrise-amber', bg: 'bg-sunrise-amber/10 border-sunrise-amber/30', icon: <RefreshCw className="w-4 h-4" />, label: 'Needs Cleaning' },
  'Maintenance':    { color: 'text-critical', bg: 'bg-critical/10 border-critical/30', icon: <Wrench className="w-4 h-4" />, label: 'Maintenance' },
  'Hold':           { color: 'text-moderate', bg: 'bg-moderate/10 border-moderate/30', icon: <Clock className="w-4 h-4" />, label: 'Hold' },
  'Blocked':        { color: 'text-slate', bg: 'bg-slate-100 border-slate-200', icon: <AlertCircle className="w-4 h-4" />, label: 'Blocked' },
};

export function BedManagement({ navigate }: { navigate: (s: Screen) => void }) {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterWing, setFilterWing] = useState<string>('All');

  const filtered = BEDS.filter(b =>
    (filterStatus === 'All' || b.status === filterStatus) &&
    (filterWing === 'All' || b.wing === filterWing)
  );

  const counts = {
    total: BEDS.length,
    occupied: BEDS.filter(b => b.status === 'Occupied').length,
    available: BEDS.filter(b => b.status === 'Available').length,
    cleaning: BEDS.filter(b => b.status === 'Needs Cleaning').length,
    maintenance: BEDS.filter(b => b.status === 'Maintenance').length,
    hold: BEDS.filter(b => b.status === 'Hold' || b.status === 'Blocked').length,
  };

  const summary = [
    { label: 'Total Beds', value: counts.total, color: 'border-slate-200', text: 'text-navy' },
    { label: 'Occupied', value: counts.occupied, color: 'border-sunrise-blue', text: 'text-sunrise-blue' },
    { label: 'Available', value: counts.available, color: 'border-success', text: 'text-success' },
    { label: 'Needs Cleaning', value: counts.cleaning, color: 'border-sunrise-amber', text: 'text-sunrise-amber' },
    { label: 'Maintenance', value: counts.maintenance, color: 'border-critical', text: 'text-critical' },
    { label: 'Hold / Blocked', value: counts.hold, color: 'border-slate-300', text: 'text-slate' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Bed className="w-6 h-6 text-sunrise-blue" /> Bed Management
          </h1>
          <p className="text-slate text-sm mt-1">Operations — housekeeping, maintenance, and physical bed status</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-border rounded text-sm font-medium text-slate hover:bg-slate-50">Export Report</button>
          <button className="px-3 py-1.5 bg-sunrise-blue text-white rounded text-sm font-medium hover:bg-sunrise-blue-light">+ Work Order</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {summary.map(s => (
          <div key={s.label} className={`bg-white border-l-4 ${s.color} rounded-lg shadow-sm p-4`}>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate mb-1">{s.label}</div>
            <div className={`text-3xl font-bold ${s.text}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-lg p-4 flex gap-4 items-center">
        <Filter className="w-4 h-4 text-slate" />
        <div className="flex gap-3 items-center">
          <label className="text-sm font-semibold text-slate">Status:</label>
          {['All', 'Available', 'Occupied', 'Needs Cleaning', 'Maintenance', 'Hold', 'Blocked'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-sm px-3 py-1 rounded-full font-medium transition-colors ${filterStatus === s ? 'bg-navy text-white' : 'bg-bg text-slate hover:bg-slate-100 border border-border'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-border" />
        <div className="flex gap-3 items-center">
          <label className="text-sm font-semibold text-slate">Wing:</label>
          {['All', 'North', 'South'].map(w => (
            <button
              key={w}
              onClick={() => setFilterWing(w)}
              className={`text-sm px-3 py-1 rounded-full font-medium transition-colors ${filterWing === w ? 'bg-navy text-white' : 'bg-bg text-slate hover:bg-slate-100 border border-border'}`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Bed table */}
      <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg border-b border-border">
              <th className="px-4 py-3 text-left font-bold text-slate text-xs uppercase tracking-wider">Room/Bed</th>
              <th className="px-4 py-3 text-left font-bold text-slate text-xs uppercase tracking-wider">Wing</th>
              <th className="px-4 py-3 text-left font-bold text-slate text-xs uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left font-bold text-slate text-xs uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left font-bold text-slate text-xs uppercase tracking-wider">Patient / Note</th>
              <th className="px-4 py-3 text-left font-bold text-slate text-xs uppercase tracking-wider">Last Cleaned</th>
              <th className="px-4 py-3 text-left font-bold text-slate text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(bed => {
              const cfg = STATUS_CONFIG[bed.status];
              return (
                <tr key={bed.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-navy">
                    Room {bed.room}{bed.bed}
                  </td>
                  <td className="px-4 py-3 text-slate">{bed.wing}</td>
                  <td className="px-4 py-3 text-slate">{bed.type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {bed.patient && (
                      <div>
                        <div className="font-semibold text-navy">{bed.patient}</div>
                        <div className="text-xs text-slate">{bed.mrn} · Exp. d/c: {bed.expectedDischarge}</div>
                      </div>
                    )}
                    {bed.maintenanceNote && (
                      <div className="text-xs text-critical font-medium flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> {bed.maintenanceNote}
                      </div>
                    )}
                    {bed.holdReason && (
                      <div className="text-xs text-moderate font-medium">{bed.holdReason}</div>
                    )}
                    {!bed.patient && !bed.maintenanceNote && !bed.holdReason && (
                      <span className="text-slate text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate">
                    {bed.lastCleaned ? (
                      <div>
                        <div className="font-medium">{bed.lastCleaned}</div>
                        <div className="text-slate-light">{bed.cleanedBy}</div>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {bed.status === 'Needs Cleaning' && (
                        <button className="text-xs px-2 py-1 bg-success text-white rounded font-medium hover:bg-success/80">Mark Clean</button>
                      )}
                      {bed.status === 'Available' && (
                        <button className="text-xs px-2 py-1 bg-sunrise-blue text-white rounded font-medium hover:bg-sunrise-blue-light">Assign</button>
                      )}
                      {bed.status === 'Maintenance' && (
                        <button className="text-xs px-2 py-1 border border-critical text-critical rounded font-medium hover:bg-critical/10">Update WO</button>
                      )}
                      <button className="text-xs px-2 py-1 border border-border text-slate rounded font-medium hover:bg-slate-50">Note</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
