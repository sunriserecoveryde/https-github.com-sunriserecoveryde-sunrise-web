import React, { useState } from 'react';
import { MOCK_PATIENTS, Patient } from '../data/mockPatients';
import { FlagBadge } from '../components/ui/FlagBadge';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { Screen } from '../App';
import {
  AlertTriangle, Activity, BedDouble, Users, Clock, ChevronDown, ChevronUp,
  TrendingDown, TrendingUp, Minus, Filter,
} from 'lucide-react';

// ─── Local Enrichment Maps (nursing clinical data not on Patient type) ──────────

type Acuity = 'Critical' | 'High' | 'Moderate' | 'Routine';

const ACUITY: Record<string, Acuity> = {
  p1: 'Critical', p3: 'High',  p5: 'High',  p6: 'Moderate',
  p8: 'Critical', p9: 'High', p11: 'High', p12: 'Moderate',
  p13: 'Routine', p14: 'Routine',
};

const WITHDRAWAL: Record<string, { cows?: number; ciwa?: number; trend: 'down' | 'stable' | 'up' }> = {
  p1:  { cows: 4,  trend: 'down' },
  p5:  { cows: 10, ciwa: 8, trend: 'down' },
  p6:  { ciwa: 6,  trend: 'down' },
  p11: { cows: 14, trend: 'down' },
  p9:  { cows: 3,  trend: 'stable' },
};

// Last BP and recent vital signs per patient
const VITALS_SUMMARY: Record<string, { bp: string; hr: number; lastChecked: string }> = {
  p1:  { bp: '138/88', hr: 92,  lastChecked: '06:00' },
  p5:  { bp: '144/92', hr: 96,  lastChecked: '06:00' },
  p6:  { bp: '158/96', hr: 88,  lastChecked: '06:00' },
  p8:  { bp: '122/78', hr: 76,  lastChecked: '06:00' },
  p9:  { bp: '128/82', hr: 84,  lastChecked: '06:00' },
  p11: { bp: '132/86', hr: 90,  lastChecked: '06:00' },
  p12: { bp: '118/74', hr: 72,  lastChecked: '06:00' },
  p3:  { bp: '126/80', hr: 80,  lastChecked: '06:00' },
};

const NEXT_APPT_LABEL: Record<string, string> = {
  p1: 'Today 2:00 PM', p3: 'Today 4:00 PM', p5: 'Today 1:00 PM',
  p6: 'Tomorrow 2:00 PM', p8: 'Today 3:30 PM', p9: 'Today 2:30 PM',
  p11: 'Today 10:00 AM', p12: 'Tomorrow 11:00 AM',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACUITY_STYLES: Record<Acuity, { ring: string; label: string; dot: string; text: string }> = {
  Critical: { ring: 'border-l-critical', label: 'bg-red-100 text-red-800',   dot: 'bg-critical', text: 'text-critical' },
  High:     { ring: 'border-l-high',     label: 'bg-orange-100 text-orange-800', dot: 'bg-high', text: 'text-high' },
  Moderate: { ring: 'border-l-moderate', label: 'bg-amber-100 text-amber-800',  dot: 'bg-moderate', text: 'text-moderate' },
  Routine:  { ring: 'border-l-success',  label: 'bg-blue-100 text-blue-800',   dot: 'bg-success', text: 'text-success' },
};

function scoreSeverityClass(score: number, isCiwa: boolean) {
  const thresholds = isCiwa ? [8, 15, 20] : [6, 13, 25];
  if (score >= thresholds[2]) return 'bg-red-100 text-red-700 border border-red-300';
  if (score >= thresholds[1]) return 'bg-orange-100 text-orange-700 border border-orange-300';
  if (score >= thresholds[0]) return 'bg-amber-100 text-amber-700 border border-amber-300';
  return 'bg-green-100 text-green-700 border border-green-200';
}

function TrendIcon({ t }: { t: 'down' | 'stable' | 'up' }) {
  if (t === 'down') return <TrendingDown className="w-3 h-3 text-success" />;
  if (t === 'up') return <TrendingUp className="w-3 h-3 text-critical" />;
  return <Minus className="w-3 h-3 text-amber-600" />;
}

// ─── Bed Card ─────────────────────────────────────────────────────────────────

function BedCard({ patient, navigate }: { patient: Patient; navigate: (s: Screen, id?: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const acuity = ACUITY[patient.id] ?? 'Routine';
  const wd = WITHDRAWAL[patient.id];
  const vs = VITALS_SUMMARY[patient.id];
  const s = ACUITY_STYLES[acuity];
  const hasAlert = wd && ((wd.cows != null && wd.cows >= 13) || (wd.ciwa != null && wd.ciwa >= 15));

  return (
    <div className={`bg-white border-l-4 ${s.ring} rounded-r-lg shadow-sm hover:shadow-md transition-all ${hasAlert ? 'ring-1 ring-red-300' : ''}`}>
      {/* Main card area */}
      <div
        className="p-3 cursor-pointer group"
        onClick={() => navigate('PatientDetail', patient.id)}
      >
        {/* Top row: bed badge + acuity + AMA risk */}
        <div className="flex items-start justify-between mb-2 gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold bg-slate-100 text-slate px-1.5 py-0.5 rounded">{patient.bed}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.label}`}>{acuity}</span>
            {patient.amaRisk === 'High' && (
              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">AMA ⚠</span>
            )}
          </div>
          {hasAlert && <AlertTriangle className="w-3.5 h-3.5 text-critical flex-none animate-pulse" />}
        </div>

        {/* Patient info */}
        <div className="flex items-center gap-2 mb-2">
          <PatientAvatar first={patient.firstName} last={patient.lastName} program={patient.program} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-navy text-sm leading-tight group-hover:text-sunrise-blue transition-colors truncate">
              {patient.firstName} {patient.lastName}
            </div>
            <div className="text-[10px] text-slate truncate">{patient.primaryDiagnosis.replace('Severe ', '')}</div>
          </div>
        </div>

        {/* LOS — BestNotes-inspired: flag patients approaching or exceeding expected LOS */}
        {(() => {
          // Expected LOS benchmarks per program (ASAM LOC guidelines)
          const LOS_BENCHMARKS: Record<string, { target: number; max: number }> = {
            Residential: { target: 21, max: 35 },
            PHP: { target: 10, max: 21 },
            IOP: { target: 30, max: 60 }, // IOP measured in calendar days
          };
          const bench = LOS_BENCHMARKS[patient.program];
          const losStatus = bench
            ? patient.los > bench.max
              ? 'exceeded'
              : patient.los >= bench.target
                ? 'approaching'
                : 'normal'
            : 'normal';
          return (
            <div className="text-[10px] text-slate mb-2 flex items-center gap-1 flex-wrap">
              <Clock className="w-3 h-3" />
              <span>LOS:</span>
              <strong className={losStatus === 'exceeded' ? 'text-red-700' : losStatus === 'approaching' ? 'text-amber-700' : 'text-navy'}>
                {patient.los}d
              </strong>
              {losStatus === 'exceeded' && (
                <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1 rounded border border-red-200">LOS ⚠ Exceeded {bench!.max}d</span>
              )}
              {losStatus === 'approaching' && (
                <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1 rounded border border-amber-200">Near target</span>
              )}
              {vs && <span className="ml-0.5 text-slate-400">· BP {vs.bp}</span>}
            </div>
          );
        })()}

        {/* CIWA/COWS scores */}
        {wd && (
          <div className="flex gap-1.5 mb-2">
            {wd.cows != null && (
              <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${scoreSeverityClass(wd.cows, false)}`}>
                <TrendIcon t={wd.trend} />
                COWS {wd.cows}
              </div>
            )}
            {wd.ciwa != null && (
              <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${scoreSeverityClass(wd.ciwa, true)}`}>
                <TrendIcon t={wd.trend} />
                CIWA {wd.ciwa}
              </div>
            )}
          </div>
        )}

        {/* Flags */}
        {patient.flags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
            {patient.flags.slice(0, 2).map((f, i) => <FlagBadge key={i} type={f.type} />)}
            {patient.flags.length > 2 && (
              <span className="text-[10px] text-slate">+{patient.flags.length - 2}</span>
            )}
          </div>
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
        className="w-full flex items-center justify-center py-1 border-t border-border/50 hover:bg-slate-50 transition-colors"
      >
        {expanded
          ? <ChevronUp className="w-3 h-3 text-slate-400" />
          : <ChevronDown className="w-3 h-3 text-slate-400" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-border/50 bg-slate-50/60 space-y-1.5 pt-2">
          <div className="text-[10px] text-slate">
            <span className="font-semibold text-navy">Counselor:</span> {patient.counselor.replace(', LCPC', '').replace(', LCADC', '').replace(', LCADC', '')}
          </div>
          <div className="text-[10px] text-slate">
            <span className="font-semibold text-navy">Physician:</span> {patient.physician.replace('Dr. ', '')}
          </div>
          {NEXT_APPT_LABEL[patient.id] && (
            <div className="text-[10px] text-slate">
              <span className="font-semibold text-navy">Next Appt:</span> {NEXT_APPT_LABEL[patient.id]}
            </div>
          )}
          <div className="text-[10px] text-slate">
            <span className="font-semibold text-navy">Mood:</span> {patient.mood}/10 &nbsp;
            <span className="font-semibold text-navy">Cravings:</span> {patient.craving}/10
          </div>
          <div className="text-[10px] text-slate">
            <span className="font-semibold text-navy">UA:</span> {patient.lastUa}
          </div>
          <button
            onClick={() => navigate('PatientDetail', patient.id)}
            className="text-[10px] font-semibold text-sunrise-blue hover:underline mt-1"
          >
            Open full chart →
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyBed({ id }: { id: string }) {
  return (
    <div className="border border-dashed border-border rounded-lg p-3 flex flex-col items-center justify-center min-h-[120px] text-slate-300 hover:bg-slate-50 hover:border-slate-300 transition-colors">
      <BedDouble className="w-6 h-6 mb-1" />
      <span className="text-xs font-bold">{id}</span>
      <span className="text-[10px] mt-0.5">Available</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type AcuityFilter = 'All' | Acuity;

export function CensusBedBoard({ navigate }: { navigate: (s: Screen, id?: string) => void }) {
  const [acuityFilter, setAcuityFilter] = useState<AcuityFilter>('All');
  const [boardTab, setBoardTab] = useState<'Bed Board' | 'Occupancy Analytics' | 'Discharge Forecast' | 'Bed Utilization Report' | 'Admission Queue' | 'Transfer Coordination'>('Bed Board');

  const residentialPatients = MOCK_PATIENTS.filter(p => p.program === 'Residential' && p.bed);
  const phpPatients        = MOCK_PATIENTS.filter(p => p.program === 'PHP' && p.bed);
  const iopPatients        = MOCK_PATIENTS.filter(p => p.program === 'IOP' && p.bed);

  // Build static bed arrays
  const makeResidentialBed = (id: string) =>
    residentialPatients.find(p => p.bed === id) ?? null;

  const residentialBedIds = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B'];

  const allResidential = residentialBedIds.map(id => ({
    id, patient: makeResidentialBed(id)
  }));

  // Filter by acuity
  const filteredResidential = acuityFilter === 'All'
    ? allResidential
    : allResidential.map(b => ({
        ...b,
        patient: b.patient && (ACUITY[b.patient.id] ?? 'Routine') === acuityFilter ? b.patient : null,
        dimmed: b.patient && (ACUITY[b.patient.id] ?? 'Routine') !== acuityFilter,
      }));

  // KPIs
  const totalOccupied = residentialPatients.length;
  const totalBeds = residentialBedIds.length;
  const alertCount = residentialPatients.filter(p =>
    WITHDRAWAL[p.id] && ((WITHDRAWAL[p.id].cows ?? 0) >= 13 || (WITHDRAWAL[p.id].ciwa ?? 0) >= 15)
  ).length;
  const criticalCount = residentialPatients.filter(p => ACUITY[p.id] === 'Critical').length;
  const highCount     = residentialPatients.filter(p => ACUITY[p.id] === 'High').length;
  const onWithdrawal  = Object.keys(WITHDRAWAL).filter(id =>
    residentialPatients.some(p => p.id === id)
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <BedDouble className="w-6 h-6 text-sunrise-blue" /> Census &amp; Bed Board
          </h1>
          <p className="text-slate text-sm mt-1">Real-time facility occupancy, acuity, and withdrawal monitoring</p>
        </div>
        <button
          onClick={() => navigate('WithdrawalMonitor')}
          className="flex items-center gap-2 px-3 py-1.5 bg-sunrise-blue text-white text-sm font-semibold rounded hover:bg-sunrise-blue-light"
        >
          <Activity className="w-4 h-4" /> Withdrawal Monitor
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['Bed Board', 'Occupancy Analytics', 'Discharge Forecast', 'Bed Utilization Report', 'Admission Queue', 'Transfer Coordination'] as const).map(t => (
          <button key={t} onClick={() => setBoardTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${boardTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {boardTab === 'Occupancy Analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Avg LOS (Residential)', value: '18.4 days', sub: 'Current census', color: 'text-navy' },
              { label: 'Avg Occupancy Rate', value: '82%', sub: 'Last 30 days', color: 'text-blue-600' },
              { label: 'Admissions This Month', value: 11, sub: 'July 2026', color: 'text-green-600' },
              { label: 'Discharges This Month', value: 9, sub: 'July 2026', color: 'text-amber-600' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Occupancy by Program — Last 6 Weeks</h3>
              <div className="space-y-2">
                {[
                  { week: 'Jun 9', res: 14, php: 9, iop: 10 },
                  { week: 'Jun 16', res: 15, php: 10, iop: 11 },
                  { week: 'Jun 23', res: 13, php: 11, iop: 10 },
                  { week: 'Jun 30', res: 15, php: 10, iop: 12 },
                  { week: 'Jul 7', res: 16, php: 11, iop: 11 },
                  { week: 'Jul 20', res: totalOccupied, php: phpPatients.length, iop: iopPatients.length },
                ].map(r => (
                  <div key={r.week} className="flex items-center gap-3 text-xs">
                    <span className="w-14 text-slate shrink-0">{r.week}</span>
                    <div className="flex-1 flex gap-1 h-4">
                      <div className="bg-navy rounded-sm flex items-center justify-center text-white text-[9px] font-bold" style={{ width: `${(r.res / 16) * 60}%` }}>{r.res}</div>
                      <div className="bg-blue-400 rounded-sm flex items-center justify-center text-white text-[9px] font-bold" style={{ width: `${(r.php / 12) * 30}%` }}>{r.php}</div>
                      <div className="bg-teal-400 rounded-sm flex items-center justify-center text-white text-[9px] font-bold" style={{ width: `${(r.iop / 12) * 20}%` }}>{r.iop}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-navy inline-block" /> Residential</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" /> PHP</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-teal-400 inline-block" /> IOP</span>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Discharge Disposition — Last 30 Days</h3>
              <div className="space-y-3">
                {[
                  { label: 'IOP Step-Down', count: 4, pct: 44, color: 'bg-green-500' },
                  { label: 'PHP Step-Down', count: 2, pct: 10, color: 'bg-blue-500' },
                  { label: 'Outpatient Continuing Care', count: 1, pct: 11, color: 'bg-teal-500' },
                  { label: 'AMA / Against Medical Advice', count: 1, pct: 11, color: 'bg-red-500' },
                  { label: 'Transfer (Higher Level of Care)', count: 1, pct: 11, color: 'bg-purple-500' },
                ].map(d => (
                  <div key={d.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate">{d.label}</span>
                      <span className="font-bold text-navy">{d.count} ({d.pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${d.color}`} style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border text-xs">
                <div className="font-semibold text-navy mb-2">Average LOS by Primary Substance</div>
                {[
                  { substance: 'Opioid (IV)', los: '21.2 days' },
                  { substance: 'Alcohol', los: '15.8 days' },
                  { substance: 'Methamphetamine', los: '19.4 days' },
                  { substance: 'Polysubstance', los: '22.7 days' },
                ].map(r => (
                  <div key={r.substance} className="flex justify-between text-slate py-0.5">
                    <span>{r.substance}</span>
                    <span className="font-bold text-navy">{r.los}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {boardTab === 'Bed Board' && (
      <>
      {/* Alert strip */}
      {alertCount > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-none" />
          <div>
            <span className="font-bold text-red-800">{alertCount} patient{alertCount > 1 ? 's' : ''} with withdrawal score at or above alert threshold</span>
            <button onClick={() => navigate('WithdrawalMonitor')} className="ml-2 text-sm text-red-700 underline hover:no-underline">
              View Withdrawal Monitor →
            </button>
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Occupied', value: `${totalOccupied}/${totalBeds}`, sub: 'Residential', color: 'text-navy', border: 'border-navy/20' },
          { label: 'Available', value: totalBeds - totalOccupied, sub: 'Open beds', color: 'text-success', border: 'border-success/30' },
          { label: 'Critical', value: criticalCount, sub: 'Acuity', color: 'text-critical', border: 'border-critical/30' },
          { label: 'High', value: highCount, sub: 'Acuity', color: 'text-high', border: 'border-high/30' },
          { label: 'WD Protocol', value: onWithdrawal, sub: 'Active', color: 'text-purple-700', border: 'border-purple-300' },
          { label: 'WD Alerts', value: alertCount, sub: 'Above threshold', color: alertCount > 0 ? 'text-critical' : 'text-success', border: alertCount > 0 ? 'border-critical/30' : 'border-success/30' },
        ].map(k => (
          <div key={k.label} className={`bg-white border-l-4 ${k.border} rounded-lg shadow-sm p-3`}>
            <div className="text-[10px] font-bold text-slate uppercase tracking-wider">{k.label}</div>
            <div className={`text-2xl font-bold ${k.color} leading-tight`}>{k.value}</div>
            <div className="text-[10px] text-slate">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Acuity filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate" />
        <span className="text-sm text-slate font-medium">Filter acuity:</span>
        {(['All', 'Critical', 'High', 'Moderate', 'Routine'] as AcuityFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setAcuityFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              acuityFilter === f
                ? f === 'All' ? 'bg-navy text-white border-navy'
                  : f === 'Critical' ? 'bg-red-600 text-white border-red-600'
                  : f === 'High' ? 'bg-orange-500 text-white border-orange-500'
                  : f === 'Moderate' ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate border-border hover:border-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-slate flex-wrap">
        {([['Critical', 'bg-critical'], ['High', 'bg-high'], ['Moderate', 'bg-moderate'], ['Routine', 'bg-success']] as const).map(([l, c]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${c}`} />
            {l}
          </div>
        ))}
        <div className="ml-2 text-slate-400">|</div>
        <div className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-critical" /> WD alert</div>
        <div className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-success" /> WD improving</div>
      </div>

      {/* Residential Section */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <h2 className="text-base font-bold text-navy flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-sunrise-blue" />
            Residential
            <span className="bg-slate-100 text-slate text-xs px-2 py-0.5 rounded-full font-semibold">
              {totalOccupied}/{totalBeds} occupied
            </span>
          </h2>
          <span className="text-xs text-slate">Beds 1A – 5B</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredResidential.map(b => (
            b.patient
              ? <BedCard key={b.id} patient={b.patient} navigate={navigate} />
              : <EmptyBed key={b.id} id={b.id} />
          ))}
        </div>
      </div>

      {/* PHP & IOP sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* PHP */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <Users className="w-4 h-4 text-sunrise-blue" />
              Partial Hospitalization (PHP)
              <span className="bg-slate-100 text-slate text-xs px-2 py-0.5 rounded-full font-semibold">
                {phpPatients.length} enrolled
              </span>
            </h2>
          </div>
          {phpPatients.length > 0
            ? <div className="grid grid-cols-2 gap-3">
                {phpPatients.map(p => <BedCard key={p.id} patient={p} navigate={navigate} />)}
              </div>
            : <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate"><Users className="w-8 h-8 text-slate-200" /><span className="text-sm italic">No PHP patients with assigned beds.</span><span className="text-xs text-slate-light">Patients enroll via Admissions once a bed is assigned.</span></div>}
        </div>

        {/* IOP */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <Users className="w-4 h-4 text-sunrise-blue" />
              Intensive Outpatient (IOP)
              <span className="bg-slate-100 text-slate text-xs px-2 py-0.5 rounded-full font-semibold">
                {iopPatients.length} enrolled
              </span>
            </h2>
          </div>
          {iopPatients.length > 0
            ? <div className="grid grid-cols-2 gap-3">
                {iopPatients.map(p => <BedCard key={p.id} patient={p} navigate={navigate} />)}
              </div>
            : <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate"><Users className="w-8 h-8 text-slate-200" /><span className="text-sm italic">No IOP patients with assigned beds.</span><span className="text-xs text-slate-light">Patients enroll via Admissions once a bed is assigned.</span></div>}
        </div>
      </div>
      </>
      )}

      {boardTab === 'Discharge Forecast' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Projected discharges for the next 14 days — supports bed planning, admissions scheduling, and transition coordination.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Discharging Today', value: 1, color: 'text-navy', sub: '1 bed opens today' },
              { label: 'Next 7 Days', value: 4, color: 'text-blue-600', sub: 'Projected discharges' },
              { label: 'Next 14 Days', value: 7, color: 'text-teal-600', sub: 'Including planned step-downs' },
              { label: 'Waitlist Pending', value: 3, color: 'text-amber-600', sub: 'Ready for next available bed' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">14-Day Discharge Schedule</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-slate">
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Patient</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Bed</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Program</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Projected Discharge</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">LOS</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Discharge Destination</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'Marcus Webb', bed: '1A', prog: 'Residential', date: '2026-07-22', los: 31, dest: 'Sober Living — Oxford House', status: 'Confirmed', statusColor: 'bg-green-100 text-green-700' },
                  { name: 'Darnell Price', bed: '2B', prog: 'Residential', date: '2026-07-23', los: 33, dest: 'Family Home + IOP step-down', status: 'Planned', statusColor: 'bg-blue-100 text-blue-700' },
                  { name: 'Keisha Brown', bed: '3A', prog: 'Residential', date: '2026-07-24', los: 19, dest: 'TBD — Housing coordinator engaged', status: 'At Risk', statusColor: 'bg-amber-100 text-amber-700' },
                  { name: 'Tyler Nguyen', bed: '4B', prog: 'Residential', date: '2026-07-26', los: 35, dest: 'PHP step-down — Sunrise PHP', status: 'Planned', statusColor: 'bg-blue-100 text-blue-700' },
                  { name: 'Angela Morse', bed: '1B', prog: 'Residential', date: '2026-07-28', los: 22, dest: 'Outpatient + PCP follow-up', status: 'Planned', statusColor: 'bg-blue-100 text-blue-700' },
                  { name: 'Ronald Kim', bed: '3B', prog: 'Residential', date: '2026-07-31', los: 40, dest: 'Recovery Residence + MAT clinic', status: 'Confirmed', statusColor: 'bg-green-100 text-green-700' },
                  { name: 'Carmen Diaz', bed: '5A', prog: 'Residential', date: '2026-08-02', los: 17, dest: 'AMA Risk — Motivational work ongoing', status: 'AMA Risk', statusColor: 'bg-red-100 text-red-700' },
                ].map(r => (
                  <tr key={r.name} className="hover:bg-gray-50">
                    <td className="py-2 font-medium text-navy">{r.name}</td>
                    <td className="py-2 text-slate">{r.bed}</td>
                    <td className="py-2 text-slate">{r.prog}</td>
                    <td className="py-2 font-medium text-navy">{r.date}</td>
                    <td className="py-2 text-slate">Day {r.los}</td>
                    <td className="py-2 text-slate">{r.dest}</td>
                    <td className="py-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.statusColor}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Bed Turnover Timeline (Next 14 Days)</h3>
              <div className="space-y-2 text-xs">
                {[
                  { date: 'Jul 22', beds: ['1A'], opens: 1 },
                  { date: 'Jul 24', beds: ['2B'], opens: 1 },
                  { date: 'Jul 26', beds: ['3A'], opens: 1 },
                  { date: 'Jul 28', beds: ['4B'], opens: 1 },
                  { date: 'Jul 30', beds: ['1B'], opens: 1 },
                  { date: 'Aug 2', beds: ['3B'], opens: 1 },
                  { date: 'Aug 4', beds: ['5A'], opens: 1 },
                ].map(d => (
                  <div key={d.date} className="flex items-center gap-3 border border-border rounded p-2">
                    <span className="font-semibold text-navy w-14 shrink-0">{d.date}</span>
                    <div className="flex gap-1">
                      {d.beds.map(b => (
                        <span key={b} className="bg-teal-100 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded">Bed {b}</span>
                      ))}
                    </div>
                    <span className="text-slate ml-auto">{d.opens} bed opening</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Discharge Destination Summary (Last 30 Days)</h3>
              <div className="space-y-2 text-xs">
                {[
                  { dest: 'Sober Living / Recovery Residence', n: 6, pct: 35, color: 'bg-green-500' },
                  { dest: 'PHP Step-Down (Sunrise)', n: 4, pct: 24, color: 'bg-blue-500' },
                  { dest: 'Family Home + Outpatient', n: 3, pct: 18, color: 'bg-teal-500' },
                  { dest: 'Against Medical Advice (AMA)', n: 2, pct: 12, color: 'bg-red-500' },
                  { dest: 'Hospital / Higher Level of Care', n: 1, pct: 6, color: 'bg-amber-500' },
                  { dest: 'Unknown / Pending', n: 1, pct: 6, color: 'bg-gray-400' },
                ].map(d => (
                  <div key={d.dest}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate">{d.dest}</span>
                      <span className="font-semibold text-navy">{d.n} ({d.pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${d.color}`} style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {boardTab === 'Bed Utilization Report' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">30-day bed utilization report — occupancy rates, average LOS, turn time, and revenue-per-bed metrics by program and unit.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Overall Occupancy (30d Avg)', value: '82%', color: 'text-green-600', sub: 'Above 80% target' },
              { label: 'Avg LOS (All Programs)', value: '18.4d', color: 'text-navy', sub: 'Clinical target: 14–21 days' },
              { label: 'Avg Bed Turn Time', value: '14.2h', color: 'text-blue-600', sub: 'Discharge → new admit' },
              { label: 'Revenue Per Bed Day', value: '$412', color: 'text-teal-600', sub: 'Blended, all payers' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Utilization by Program — Last 30 Days</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Program', 'Licensed Beds', 'Avg Census', 'Occupancy %', 'Avg LOS', 'Discharges', 'Avg Turn (hrs)', 'Rev/Bed Day'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { prog: 'Detox / Med Mgd Withdrawal', beds: 6, census: 5.1, occ: 85, los: 6.2, dc: 22, turn: 8.1, rev: '$892' },
                  { prog: "Men's Residential", beds: 10, census: 8.4, occ: 84, los: 21.3, dc: 11, turn: 16.4, rev: '$382' },
                  { prog: "Women's Residential", beds: 8, census: 6.8, occ: 85, los: 19.8, dc: 9, turn: 14.8, rev: '$390' },
                  { prog: 'PHP (Day Program)', beds: 12, census: 9.2, occ: 77, los: 12.4, dc: 18, turn: 4.0, rev: '$220' },
                  { prog: 'IOP (3×/week)', beds: 15, census: 11.1, occ: 74, los: 42.0, dc: 7, turn: 0, rev: '$110' },
                ].map(r => (
                  <tr key={r.prog} className={`hover:bg-gray-50 ${r.occ >= 85 ? 'bg-green-50/20' : r.occ < 75 ? 'bg-amber-50/20' : ''}`}>
                    <td className="px-3 py-2 font-medium text-navy">{r.prog}</td>
                    <td className="px-3 py-2 text-center text-slate">{r.beds}</td>
                    <td className="px-3 py-2 text-center text-navy">{r.census}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-bold ${r.occ >= 85 ? 'text-green-600' : r.occ >= 80 ? 'text-blue-600' : 'text-amber-600'}`}>{r.occ}%</span>
                    </td>
                    <td className="px-3 py-2 text-center text-slate">{r.los}d</td>
                    <td className="px-3 py-2 text-center text-slate">{r.dc}</td>
                    <td className="px-3 py-2 text-center text-slate">{r.turn > 0 ? `${r.turn}h` : '—'}</td>
                    <td className="px-3 py-2 font-semibold text-teal-600">{r.rev}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {boardTab === 'Admission Queue' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Incoming admissions awaiting bed assignment — pending pre-authorizations, detox holds, and transfer arrivals.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Pending Admits', value: 5, color: 'text-amber-600', sub: 'Awaiting bed assignment' },
              { label: 'Auth Received', value: 3, color: 'text-green-600', sub: 'Ready to place' },
              { label: 'Auth Pending', value: 2, color: 'text-red-600', sub: 'Holding for payer approval' },
              { label: 'Avg Hold Time', value: '4.2h', color: 'text-navy', sub: 'Time from call to placement' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Admission Queue — Current</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Name', 'DOB', 'SUD Type', 'LOC Requested', 'Referral Source', 'Auth Status', 'Arrival ETA', 'Assigned Bed', 'Notes'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'M. Carver', dob: '09/14/1988', sud: 'OUD', loc: 'Residential', source: 'ER — Vanderbilt', auth: 'Approved', eta: '2:30 PM', bed: 'Rm 12A', notes: 'Suboxone candidate; needs MAT eval on arrival' },
                  { name: 'T. Nguyen', dob: '03/22/1975', sud: 'AUD', loc: 'Detox', source: 'Self / Family', auth: 'Pending', eta: '4:00 PM', bed: '—', notes: 'CIWA risk — awaiting Blue Cross auth' },
                  { name: 'S. Okafor', dob: '07/01/1993', sud: 'Meth + AUD', loc: 'Residential', source: 'Probation', auth: 'Approved', eta: '3:15 PM', bed: 'Rm 7B', notes: 'Drug court Track B; compliance letter required on admit' },
                  { name: 'R. Delgado', dob: '11/30/1981', sud: 'OUD', loc: 'PHP', source: 'Step-down — Bethesda MD', auth: 'Approved', eta: '5:00 PM', bed: 'PHP Unit', notes: 'Transferring from residential; Suboxone 16mg continued' },
                  { name: 'L. Morris', dob: '04/17/2000', sud: 'Stimulant', loc: 'Residential', source: 'Physician referral', auth: 'Pending', eta: 'TBD', bed: '—', notes: 'Aetna auth call placed at 11:20 AM; awaiting callback' },
                ].map(r => (
                  <tr key={r.name} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-navy">{r.name}</td>
                    <td className="px-3 py-2 text-slate font-mono text-[10px]">{r.dob}</td>
                    <td className="px-3 py-2 text-slate">{r.sud}</td>
                    <td className="px-3 py-2 text-slate">{r.loc}</td>
                    <td className="px-3 py-2 text-slate">{r.source}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.auth === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.auth}</span>
                    </td>
                    <td className="px-3 py-2 font-semibold text-navy">{r.eta}</td>
                    <td className="px-3 py-2 text-slate">{r.bed}</td>
                    <td className="px-3 py-2 text-slate italic text-[10px]">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {boardTab === 'Transfer Coordination' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Active and completed patient transfers — step-down to lower LOC, step-up to higher LOC, and inter-facility transfers.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Active Transfers', value: 3, color: 'text-amber-600', sub: 'In progress today' },
              { label: 'Step-Downs (30d)', value: 18, color: 'text-green-600', sub: 'Residential → PHP/IOP' },
              { label: 'Step-Ups (30d)', value: 4, color: 'text-red-600', sub: 'LOC escalation required' },
              { label: 'Avg Transfer Lag', value: '1.8d', color: 'text-navy', sub: 'Decision to placement' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Transfer Log — Active & Recent</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Patient', 'From LOC', 'To LOC', 'Direction', 'Reason', 'Auth Status', 'Transfer Date', 'Receiving Facility', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'J. Brantley', from: 'Residential', to: 'PHP', dir: 'Step-Down', reason: 'Clinical criteria met at 28 days; strong RES', auth: 'Approved', date: 'Today', recv: 'Sunrise PHP Unit', status: 'In Transit' },
                  { name: 'K. Williams', from: 'PHP', to: 'Residential', dir: 'Step-Up', reason: 'Positive UA + missed 3 groups — LOC escalation', auth: 'Approved', date: 'Today', recv: 'Sunrise Residential', status: 'Pending Bed' },
                  { name: 'A. Santos', from: 'Detox', to: 'Residential', dir: 'Step-Down', reason: 'Medical stability achieved; COWS < 8', auth: 'Approved', date: 'Yesterday', recv: 'Sunrise Residential', status: 'Completed' },
                  { name: 'P. Thompson', from: 'Residential', to: 'IOP', dir: 'Step-Down', reason: '30-day completion; housing secured', auth: 'Pending', date: 'Aug 1', recv: 'TBD — awaiting auth', status: 'Planning' },
                  { name: 'M. Reyes', from: 'Residential', to: 'External Detox', dir: 'Transfer Out', reason: 'Medical need beyond scope — seizure risk', auth: 'Approved', date: 'Jul 17', recv: 'Vanderbilt Medical Center', status: 'Completed' },
                ].map(r => (
                  <tr key={r.name} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-navy">{r.name}</td>
                    <td className="px-3 py-2 text-slate">{r.from}</td>
                    <td className="px-3 py-2 text-slate">{r.to}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.dir === 'Step-Up' ? 'bg-red-100 text-red-700' : r.dir === 'Transfer Out' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{r.dir}</span>
                    </td>
                    <td className="px-3 py-2 text-slate">{r.reason}</td>
                    <td className="px-3 py-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.auth === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.auth}</span></td>
                    <td className="px-3 py-2 text-slate">{r.date}</td>
                    <td className="px-3 py-2 text-slate">{r.recv}</td>
                    <td className="px-3 py-2 font-medium text-navy">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
