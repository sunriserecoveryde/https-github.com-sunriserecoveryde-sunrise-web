import React, { useState, useMemo, useRef } from 'react';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { getPatientVitals } from '../data/mockVitals';
import { FlagBadge } from '../components/ui/FlagBadge';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { AcuityBadge } from '../components/ui/AcuityBadge';
import { RecoveryScoreBadge } from '../components/ui/RecoveryScoreBadge';
import { Screen } from '../App';
import { Search, Plus, ArrowUp, ArrowDown, ArrowUpDown, AlertTriangle, TrendingUp, Users, Lock, CalendarDays } from 'lucide-react';
import { useRole } from '../context/RoleContext';

// Latest COWS/CIWA scores per patient (from most recent vitals entry)
const WITHDRAWAL_SCORES: Record<string, { cows?: number; ciwa?: number }> = {};
MOCK_PATIENTS.forEach(p => {
  const vitals = getPatientVitals(p.id);
  if (vitals.length > 0) {
    const latest = vitals[0];
    if (latest.cows != null || latest.ciwa != null) {
      WITHDRAWAL_SCORES[p.id] = { cows: latest.cows ?? undefined, ciwa: latest.ciwa ?? undefined };
    }
  }
});

function WdBadge({ cows, ciwa }: { cows?: number; ciwa?: number }) {
  const score = cows ?? ciwa;
  const label = cows != null ? `COWS ${cows}` : ciwa != null ? `CIWA ${ciwa}` : null;
  if (score == null || label == null) return <span className="text-slate-300 text-xs">—</span>;
  const isCiwa = ciwa != null;
  const severe  = isCiwa ? score >= 15 : score >= 13;
  const moderate = !severe && (isCiwa ? score >= 8 : score >= 5);
  const cls = severe
    ? 'bg-red-100 text-red-700 border border-red-300'
    : moderate
      ? 'bg-amber-100 text-amber-700 border border-amber-300'
      : 'bg-green-100 text-green-700 border border-green-200';
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cls} ${severe ? 'animate-pulse' : ''}`}>
      {label}
    </span>
  );
}

const DEMO_BOOKING_URL =
  import.meta.env.VITE_DEMO_BOOKING_URL ||
  'mailto:demo@sunrisehealth.com?subject=Schedule%20a%20Live%20Demo';

type SortField = 'name' | 'los' | 'acuity' | 'recovery' | 'craving' | 'program';
type SortDir = 'asc' | 'desc';
type Program = 'All' | 'Residential' | 'PHP' | 'IOP' | 'Detox';
type RiskLevel = 'All' | 'High' | 'Med' | 'Low';

// Deterministic acuity order for sort
const ACUITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Moderate: 2, Routine: 3 };
const amaToAcuity = (ama: string) => ama === 'High' ? 'Critical' : ama === 'Med' ? 'High' : 'Routine';

function SortHeader({ label, field, sort, onSort, className }: {
  label: string; field: SortField; sort: { field: SortField; dir: SortDir };
  onSort: (f: SortField) => void; className?: string;
}) {
  const active = sort.field === field;
  return (
    <th
      className={`p-4 text-[10px] font-bold uppercase tracking-wider text-slate cursor-pointer select-none hover:text-navy transition-colors ${className ?? ''}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1 justify-center">
        {label}
        {active
          ? sort.dir === 'asc'
            ? <ArrowUp className="w-3 h-3 text-sunrise-orange" />
            : <ArrowDown className="w-3 h-3 text-sunrise-orange" />
          : <ArrowUpDown className="w-3 h-3 text-slate-300" />
        }
      </div>
    </th>
  );
}

export function PatientList({ navigate }: { navigate: (s: Screen, id?: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [program, setProgram]       = useState<Program>('All');
  const [risk, setRisk]             = useState<RiskLevel>('All');
  const [clinician, setClinician]   = useState<string>('All');
  const [admitStatus, setAdmitStatus] = useState<'All' | 'Active' | 'Pending Discharge' | 'Discharged'>('All');
  const [sort, setSort]             = useState<{ field: SortField; dir: SortDir }>({ field: 'name', dir: 'asc' });
  const [plTab, setPlTab]           = useState<'Census' | 'Risk Summary' | 'LOC Distribution' | 'Flags Overview' | 'Payer Mix' | 'Discharge Pipeline'>('Census');
  const [showBookingPreview, setShowBookingPreview] = useState(false);
  const [plActionSaved, setPlActionSaved] = useState<string | null>(null);
  const savePlAction = (msg: string) => { setPlActionSaved(msg); setTimeout(() => setPlActionSaved(null), 2500); };
  const bookingRef = useRef<HTMLAnchorElement>(null);
  const { canAccessScreen, getPermissionForScreen } = useRole();
  const canViewDetail  = canAccessScreen('PatientDetail');
  const listPermission = getPermissionForScreen('PatientList');
  const canAdmit       = listPermission === 'full';

  function handleSort(field: SortField) {
    setSort(prev => prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });
  }

  // Distinct counselors for the clinician filter dropdown
  const allClinicians = useMemo(() => {
    const s = new Set<string>();
    MOCK_PATIENTS.forEach(p => { if (p.counselor) s.add(p.counselor); });
    return ['All', ...Array.from(s).sort()];
  }, []);

  // Simulate admit status by LOS bucket (no status field in model)
  function getAdmitStatus(los: number): 'Active' | 'Pending Discharge' | 'Discharged' {
    if (los >= 28) return 'Pending Discharge';
    return 'Active';
  }

  const filtered = useMemo(() => {
    let list = MOCK_PATIENTS.filter(p => {
      const term = searchTerm.toLowerCase();
      const nameMatch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) || p.mrn.toLowerCase().includes(term);
      const progMatch = program === 'All' || p.program === program;
      const riskMatch = risk === 'All' || p.amaRisk === risk || (risk === 'Low' && p.amaRisk !== 'High' && p.amaRisk !== 'Med');
      const clinicianMatch = clinician === 'All' || p.counselor === clinician;
      const statusMatch = admitStatus === 'All' || getAdmitStatus(p.los) === admitStatus;
      return nameMatch && progMatch && riskMatch && clinicianMatch && statusMatch;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sort.field === 'name')     cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (sort.field === 'los')      cmp = a.los - b.los;
      if (sort.field === 'acuity')   cmp = ACUITY_ORDER[amaToAcuity(a.amaRisk)] - ACUITY_ORDER[amaToAcuity(b.amaRisk)];
      if (sort.field === 'recovery') cmp = a.recoveryScore - b.recoveryScore;
      if (sort.field === 'craving')  cmp = a.craving - b.craving;
      if (sort.field === 'program')  cmp = a.program.localeCompare(b.program);
      return sort.dir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [searchTerm, program, risk, clinician, admitStatus, sort]);

  const highRisk  = MOCK_PATIENTS.filter(p => p.amaRisk === 'High').length;
  const avgLos    = Math.round(MOCK_PATIENTS.reduce((s, p) => s + p.los, 0) / MOCK_PATIENTS.length);
  const avgCraving= (MOCK_PATIENTS.reduce((s, p) => s + p.craving, 0) / MOCK_PATIENTS.length).toFixed(1);

  const PROGRAMS: Program[] = ['All', 'Residential', 'PHP', 'IOP', 'Detox'];
  const RISKS: RiskLevel[]  = ['All', 'High', 'Med', 'Low'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Users className="w-6 h-6 text-sunrise-blue" /> Patient List
          </h1>
          <p className="text-slate text-sm mt-1">Active Census: {MOCK_PATIENTS.length} patients · {filtered.length} shown</p>
        </div>
        {canAdmit && (
          <button onClick={() => savePlAction('Admission intake opened')} className="bg-sunrise-blue text-white px-4 py-2 rounded font-medium flex items-center gap-2 hover:bg-sunrise-blue-light transition-colors shadow-sm text-sm">
            <Plus className="w-4 h-4" /> Admit Patient
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['Census', 'Risk Summary', 'LOC Distribution', 'Flags Overview', 'Payer Mix', 'Discharge Pipeline'] as const).map(t => (
          <button key={t} onClick={() => setPlTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${plTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {plTab === 'Risk Summary' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Clinical risk snapshot across all active patients — AMA risk, craving scores, withdrawal status, and flag summary.</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">AMA Risk Distribution</h3>
              <div className="space-y-3">
                {[
                  { label: 'High AMA Risk', n: MOCK_PATIENTS.filter(p => p.amaRisk === 'High').length, color: 'bg-red-500', text: 'text-red-600' },
                  { label: 'Medium AMA Risk', n: MOCK_PATIENTS.filter(p => p.amaRisk === 'Med').length, color: 'bg-amber-400', text: 'text-amber-600' },
                  { label: 'Low / No AMA Risk', n: MOCK_PATIENTS.filter(p => !p.amaRisk || p.amaRisk === 'Low').length, color: 'bg-green-500', text: 'text-green-600' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate">{r.label}</span><span className={`font-bold ${r.text}`}>{r.n}</span></div>
                    <div className="h-2 bg-gray-100 rounded-full"><div className={`h-2 rounded-full ${r.color}`} style={{ width: `${Math.round(r.n / MOCK_PATIENTS.length * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Recovery Score Distribution</h3>
              <div className="space-y-3">
                {[
                  { label: 'Strong (≥70)', n: MOCK_PATIENTS.filter(p => (p.recoveryScore ?? 0) >= 70).length, color: 'bg-green-500', text: 'text-green-600' },
                  { label: 'Moderate (50–69)', n: MOCK_PATIENTS.filter(p => (p.recoveryScore ?? 0) >= 50 && (p.recoveryScore ?? 0) < 70).length, color: 'bg-amber-400', text: 'text-amber-600' },
                  { label: 'Low (<50)', n: MOCK_PATIENTS.filter(p => (p.recoveryScore ?? 0) < 50).length, color: 'bg-red-500', text: 'text-red-600' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate">{r.label}</span><span className={`font-bold ${r.text}`}>{r.n}</span></div>
                    <div className="h-2 bg-gray-100 rounded-full"><div className={`h-2 rounded-full ${r.color}`} style={{ width: `${Math.round(r.n / MOCK_PATIENTS.length * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Craving Score Distribution</h3>
              <div className="space-y-3">
                {[
                  { label: 'High Craving (≥8)', n: MOCK_PATIENTS.filter(p => (p.craving ?? 0) >= 8).length, color: 'bg-red-500', text: 'text-red-600' },
                  { label: 'Moderate (5–7)', n: MOCK_PATIENTS.filter(p => (p.craving ?? 0) >= 5 && (p.craving ?? 0) < 8).length, color: 'bg-amber-400', text: 'text-amber-600' },
                  { label: 'Manageable (<5)', n: MOCK_PATIENTS.filter(p => (p.craving ?? 0) < 5).length, color: 'bg-green-500', text: 'text-green-600' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate">{r.label}</span><span className={`font-bold ${r.text}`}>{r.n}</span></div>
                    <div className="h-2 bg-gray-100 rounded-full"><div className={`h-2 rounded-full ${r.color}`} style={{ width: `${Math.round(r.n / MOCK_PATIENTS.length * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-border font-semibold text-navy text-sm">High-Priority Risk Patients</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg text-slate">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Patient</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Program</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">AMA Risk</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Recovery</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Cravings</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">LOS</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Active Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...MOCK_PATIENTS]
                  .sort((a, b) => {
                    const order: Record<string, number> = { High: 0, Med: 1, Low: 2 };
                    return (order[a.amaRisk ?? 'Low'] ?? 2) - (order[b.amaRisk ?? 'Low'] ?? 2);
                  })
                  .filter(p => p.amaRisk === 'High' || p.amaRisk === 'Med' || (p.craving ?? 0) >= 7)
                  .map(p => (
                    <tr key={p.id} className={`hover:bg-gray-50 ${p.amaRisk === 'High' ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-2.5 font-medium text-navy">{p.firstName} {p.lastName}</td>
                      <td className="px-3 py-2.5 text-center text-slate">{p.program}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.amaRisk === 'High' ? 'bg-red-100 text-red-700' : p.amaRisk === 'Med' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{p.amaRisk ?? 'Low'}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center font-semibold">
                        <span className={`${(p.recoveryScore ?? 0) >= 70 ? 'text-green-600' : (p.recoveryScore ?? 0) >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{p.recoveryScore ?? '—'}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`font-bold ${(p.craving ?? 0) >= 8 ? 'text-red-600' : (p.craving ?? 0) >= 5 ? 'text-amber-600' : 'text-green-600'}`}>{p.craving ?? '—'}/10</span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate">{p.los}d</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(p.flags ?? []).slice(0, 3).map(f => (
                            <span key={f.type} className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-medium">{f.type}</span>
                          ))}
                          {(p.flags ?? []).length === 0 && <span className="text-slate">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {plTab === 'Census' && (
      <div className="space-y-5">
      {/* Access notice for roles without PatientDetail */}
      {!canViewDetail && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <Lock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <span className="font-semibold">Read-only census view.</span>{' '}
            Your role can see aggregate patient data but cannot open individual charts.
            Switch to a clinical role to access patient detail.{' '}
            <button onClick={() => navigate('RoleExplorer')} className="font-semibold underline hover:no-underline">View permissions →</button>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Total Census',   value: MOCK_PATIENTS.length, color: 'text-navy' },
          { label: 'Residential',    value: MOCK_PATIENTS.filter(p => p.program === 'Residential').length, color: 'text-sunrise-blue' },
          { label: 'PHP',            value: MOCK_PATIENTS.filter(p => p.program === 'PHP').length, color: 'text-teal' },
          { label: 'IOP',            value: MOCK_PATIENTS.filter(p => p.program === 'IOP').length, color: 'text-purple' },
          { label: 'High AMA Risk',  value: highRisk, color: highRisk > 0 ? 'text-critical' : 'text-success' },
          { label: 'Avg Cravings',   value: `${avgCraving}/10`, color: 'text-sunrise-amber' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-border rounded-lg shadow-sm p-3">
            <div className="text-[10px] font-bold text-slate uppercase tracking-wider">{k.label}</div>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or MRN..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg border border-border rounded text-sm focus:outline-none focus:border-sunrise-blue transition-colors"
            />
          </div>
          <div className="flex gap-1.5">
            {PROGRAMS.map(p => (
              <button
                key={p}
                onClick={() => setProgram(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  program === p ? 'bg-sunrise-blue text-white' : 'bg-bg border border-border text-slate hover:border-sunrise-blue/50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 ml-2 border-l border-border pl-3">
            {RISKS.map(r => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  risk === r
                    ? r === 'High' ? 'bg-critical text-white'
                      : r === 'Med' ? 'bg-sunrise-amber text-navy'
                      : 'bg-success text-white'
                    : 'bg-bg border border-border text-slate hover:border-slate-300'
                }`}
              >
                {r === 'All' ? 'All Risk' : `${r} Risk`}
              </button>
            ))}
          </div>
          {/* Clinician filter */}
          <div className="ml-2 border-l border-border pl-3">
            <select
              value={clinician}
              onChange={e => setClinician(e.target.value)}
              className="text-xs border border-border rounded-full px-3 py-1.5 bg-bg text-slate focus:outline-none focus:border-sunrise-blue"
            >
              {allClinicians.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Clinicians' : c.replace(', LCPC', '').replace(', LCADC', '')}</option>
              ))}
            </select>
          </div>
          {/* Status filter */}
          <div>
            <select
              value={admitStatus}
              onChange={e => setAdmitStatus(e.target.value as typeof admitStatus)}
              className="text-xs border border-border rounded-full px-3 py-1.5 bg-bg text-slate focus:outline-none focus:border-sunrise-blue"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending Discharge">Pending Discharge</option>
            </select>
          </div>
          <span className="ml-auto text-xs text-slate">{filtered.length} of {MOCK_PATIENTS.length} clients</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg text-slate border-b border-border">
              <tr>
                <th className="p-4 pl-6 text-[10px] font-bold uppercase tracking-wider text-slate w-12">Flags</th>
                <SortHeader label="Client"   field="name"     sort={sort} onSort={handleSort} className="text-left" />
                <SortHeader label="Program"  field="program"  sort={sort} onSort={handleSort} />
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate">Primary Dx</th>
                <SortHeader label="LOS"      field="los"      sort={sort} onSort={handleSort} />
                <SortHeader label="Acuity"   field="acuity"   sort={sort} onSort={handleSort} />
                <SortHeader label="Cravings" field="craving"  sort={sort} onSort={handleSort} />
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate text-center">W/D Score</th>
                <SortHeader label="RES"      field="recovery" sort={sort} onSort={handleSort} />
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate">Counselor</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => {
                const acuity = amaToAcuity(p.amaRisk);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex gap-1 flex-wrap">
                        {p.flags.map((f, i) => <FlagBadge key={i} type={f.type} note={f.note} />)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <PatientAvatar first={p.firstName} last={p.lastName} program={p.program} size="md" />
                        <div>
                          <div
                            className={`font-bold text-navy ${canViewDetail ? 'hover:text-sunrise-blue cursor-pointer' : 'cursor-default'}`}
                            onClick={() => canViewDetail && navigate('PatientDetail', p.id)}
                          >
                            {p.firstName} {p.lastName}
                          </div>
                          <div className="text-[10px] text-slate font-mono">{p.mrn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs font-semibold text-slate bg-slate-100 px-2 py-1 rounded">{p.program}</span>
                    </td>
                    <td className="p-4 text-xs text-slate max-w-[180px] truncate" title={p.primaryDiagnosis}>
                      {p.primaryDiagnosis}
                    </td>
                    <td className="p-4 text-center font-semibold text-navy">
                      {p.los}d
                    </td>
                    <td className="p-4 text-center">
                      <AcuityBadge acuity={acuity as any} />
                    </td>
                    <td className="p-4 text-center">
                      <div className={`text-sm font-bold ${p.craving >= 7 ? 'text-critical' : p.craving >= 4 ? 'text-sunrise-amber' : 'text-success'}`}>
                        {p.craving}/10
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full w-12 mx-auto mt-1">
                        <div
                          className={`h-1 rounded-full ${p.craving >= 7 ? 'bg-critical' : p.craving >= 4 ? 'bg-sunrise-amber' : 'bg-success'}`}
                          style={{ width: `${p.craving * 10}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <WdBadge cows={WITHDRAWAL_SCORES[p.id]?.cows} ciwa={WITHDRAWAL_SCORES[p.id]?.ciwa} />
                    </td>
                    <td className="p-4 text-center">
                      <RecoveryScoreBadge score={p.recoveryScore} />
                    </td>
                    <td className="p-4 text-slate text-xs">
                      {p.counselor.split(',')[0]}
                    </td>
                    <td className="p-4">
                      {canViewDetail ? (
                        <button
                          onClick={() => navigate('PatientDetail', p.id)}
                          className="text-sunrise-blue text-xs font-medium hover:underline bg-sunrise-blue/10 px-3 py-1.5 rounded"
                        >
                          View Chart
                        </button>
                      ) : (
                        <span className="text-xs text-slate flex items-center gap-1">
                          <Lock className="w-3 h-3" /> No access
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate">
              <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-navy">No patients match your filters</div>
              <div className="text-xs text-slate mt-1">Try clearing a filter or adjusting your search.</div>
            </div>
          )}
        </div>
      </div>
      </div>
      )}

      {plTab === 'LOC Distribution' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Current census by level of care — capacity utilization, acuity mix, and step-down eligibility.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { loc: 'Residential (3.5)', census: 14, cap: 18, color: 'bg-navy', pct: Math.round(14/18*100) },
              { loc: 'PHP (2.5)', census: 8, cap: 12, color: 'bg-blue-500', pct: Math.round(8/12*100) },
              { loc: 'IOP (2.1)', census: 11, cap: 16, color: 'bg-teal-500', pct: Math.round(11/16*100) },
              { loc: 'Detox / Med Mgmt', census: 3, cap: 6, color: 'bg-purple-500', pct: Math.round(3/6*100) },
            ].map(l => (
              <div key={l.loc} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">{l.loc}</div>
                <div className="text-3xl font-bold text-navy mt-1">{l.census}<span className="text-sm font-normal text-slate">/{l.cap}</span></div>
                <div className="mt-2 h-2 bg-gray-100 rounded-full">
                  <div className={`h-2 rounded-full ${l.color}`} style={{ width: `${l.pct}%` }} />
                </div>
                <div className="text-xs text-slate mt-1">{l.pct}% occupied</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Census by Program × LOC</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-slate">
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Program</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Residential</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">PHP</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">IOP</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Detox</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { prog: 'Men\'s Residential', res: 9, php: 0, iop: 0, detox: 2, total: 11 },
                  { prog: 'Women\'s Residential', res: 5, php: 0, iop: 0, detox: 1, total: 6 },
                  { prog: 'Day Program (PHP)', res: 0, php: 8, iop: 0, detox: 0, total: 8 },
                  { prog: 'Evening IOP', res: 0, php: 0, iop: 11, detox: 0, total: 11 },
                ].map(r => (
                  <tr key={r.prog} className="hover:bg-gray-50">
                    <td className="py-2 font-medium text-navy">{r.prog}</td>
                    <td className="py-2 text-center text-slate">{r.res || '—'}</td>
                    <td className="py-2 text-center text-slate">{r.php || '—'}</td>
                    <td className="py-2 text-center text-slate">{r.iop || '—'}</td>
                    <td className="py-2 text-center text-slate">{r.detox || '—'}</td>
                    <td className="py-2 text-center font-bold text-navy">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {plTab === 'Flags Overview' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Census-wide clinical flag distribution — identifies populations needing targeted clinical attention across the current roster.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { flag: 'AMA Risk (High)', count: MOCK_PATIENTS.filter(p => p.amaRisk === 'High').length, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
              { flag: 'Co-occurring MH Dx', count: Math.round(MOCK_PATIENTS.length * 0.68), color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
              { flag: 'On MAT Protocol', count: MOCK_PATIENTS.filter(p => p.program === 'Residential').length, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
              { flag: 'Legal Involvement', count: Math.round(MOCK_PATIENTS.length * 0.41), color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
            ].map(f => (
              <div key={f.flag} className={`card border ${f.bgColor}`}>
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{f.flag}</div>
                <div className={`text-3xl font-bold mt-1 ${f.color}`}>{f.count}</div>
                <div className="text-xs text-slate mt-0.5">{Math.round(f.count / MOCK_PATIENTS.length * 100)}% of census</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Flag Distribution by Program</h3>
            <div className="text-xs text-slate space-y-3">
              {[
                { prog: 'Men\'s Residential', flags: ['High AMA Risk (x3)', 'Co-occurring PTSD (x6)', 'Opioid primary (x5)', 'Legal referral (x4)'] },
                { prog: 'Women\'s Residential', flags: ['Trauma hx (x5)', 'Pregnancy screen positive (x1)', 'Co-occurring anxiety (x4)', 'DV survivor (x2)'] },
                { prog: 'PHP / Day Program', flags: ['Step-down from Residential (x6)', 'Stimulant primary (x3)', 'Employment recovery goal (x8)'] },
                { prog: 'Evening IOP', flags: ['Employed / working (x9)', 'Court-ordered (x4)', 'Family participation (x7)', 'Alumni re-engagement (x2)'] },
              ].map(p => (
                <div key={p.prog} className="border border-border rounded-lg p-3">
                  <div className="font-semibold text-navy mb-1.5">{p.prog}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.flags.map(f => (
                      <span key={f} className="text-[10px] bg-gray-100 text-slate px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Demo CTA strip */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 bg-violet-600 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 text-violet-100 text-sm">
          <CalendarDays className="w-4 h-4 shrink-0 opacity-80" />
          <span>Exploring Sunrise? Talk to our team and see it live in your environment.</span>
        </div>
        <div className="relative flex-shrink-0">
          <a
            ref={bookingRef}
            href={showBookingPreview ? undefined : DEMO_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => {
              if (!showBookingPreview) {
                e.preventDefault();
                setShowBookingPreview(true);
              }
            }}
            className="flex items-center gap-2 bg-white text-violet-700 hover:bg-violet-50 transition-colors text-sm font-semibold px-4 py-1.5 rounded shadow-sm cursor-pointer"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Schedule a live demo →
          </a>
          {showBookingPreview && (
            <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-violet-200 rounded-xl shadow-xl p-4 w-80 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="text-xs font-bold text-slate uppercase tracking-wider mb-2">Booking Link Preview</div>
              <div className="bg-slate-50 border border-border rounded-lg px-3 py-2 font-mono text-[11px] text-slate break-all mb-3">
                {DEMO_BOOKING_URL}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBookingPreview(false)}
                  className="flex-1 text-sm text-slate border border-border rounded-lg py-1.5 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <a
                  href={DEMO_BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowBookingPreview(false)}
                  className="flex-1 text-center text-sm font-semibold bg-violet-600 text-white rounded-lg py-1.5 hover:bg-violet-700"
                >
                  Open link →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {plTab === 'Payer Mix' && (
        <div className="space-y-5 mt-4">
          <div className="text-sm text-slate">Current census payer breakdown — insurance type, authorization status, and revenue per day by payer.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Commercial Insurance', value: '38%', color: 'text-blue-600', sub: '9 patients — highest reimbursement' },
              { label: 'Medicaid / Maryland Medicaid', value: '29%', color: 'text-green-600', sub: '7 patients' },
              { label: 'Self-Pay / Sliding Fee', value: '21%', color: 'text-amber-600', sub: '5 patients' },
              { label: 'Medicare', value: '12%', color: 'text-navy', sub: '3 patients' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Payer Mix Detail — Current Census</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Payer', 'Plan Type', 'Patients', 'Auth Status', 'Avg Rate / Day', 'Auth Days Remaining', 'Notes'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { payer: 'CareFirst BlueCross BlueShield', type: 'Commercial PPO', pts: 4, auth: 'Active', rate: '$850', days: '8d', notes: 'Concurrent review every 5 days' },
                  { payer: 'Aetna', type: 'Commercial HMO', pts: 3, auth: 'Active', rate: '$780', days: '5d', notes: 'Peer-to-peer may be needed at day 14' },
                  { payer: 'United Healthcare', type: 'Commercial PPO', pts: 2, auth: 'Active', rate: '$820', days: '11d', notes: 'Auto-approve for first 7 days' },
                  { payer: 'Maryland Medicaid (Amerigroup)', type: 'Medicaid Managed', pts: 4, auth: 'Active', rate: '$420', days: '12d', notes: 'Prior auth approved; 30-day limit' },
                  { payer: 'Maryland Medicaid (CareFirst)', type: 'Medicaid Managed', pts: 3, auth: 'Active', rate: '$390', days: '9d', notes: '' },
                  { payer: 'Medicare Part A', type: 'Medicare', pts: 3, auth: 'Active', rate: '$680', days: '18d', notes: 'Benefit period tracking active' },
                  { payer: 'Self-Pay', type: 'Private Pay', pts: 3, auth: '—', rate: '$450', days: '—', notes: 'Financial counseling engaged; payment plan in place' },
                  { payer: 'Sliding Fee Scale', type: 'Grant-funded', pts: 2, auth: '—', rate: '$0–$150', days: '—', notes: 'SAMHSA block grant funds' },
                ].map(r => (
                  <tr key={r.payer} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-navy">{r.payer}</td>
                    <td className="px-3 py-2 text-slate">{r.type}</td>
                    <td className="px-3 py-2 text-center font-bold text-navy">{r.pts}</td>
                    <td className="px-3 py-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.auth === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{r.auth}</span></td>
                    <td className="px-3 py-2 font-semibold text-green-700">{r.rate}</td>
                    <td className="px-3 py-2 text-slate">{r.days}</td>
                    <td className="px-3 py-2 text-slate italic text-[10px]">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {plTab === 'Discharge Pipeline' && (
        <div className="space-y-5 mt-4">
          <div className="text-sm text-slate">Patients approaching or ready for discharge — authorization end dates, aftercare plan status, and discharge readiness scores.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Discharging This Week', value: 4, color: 'text-amber-600', sub: 'Auth end or clinical criteria met' },
              { label: 'Aftercare Plan Complete', value: 2, color: 'text-green-600', sub: 'IOP enrolled + housing confirmed' },
              { label: 'Aftercare Pending', value: 2, color: 'text-red-600', sub: 'Housing or IOP not yet secured' },
              { label: 'Avg LOS at Discharge', value: '27d', color: 'text-navy', sub: 'Rolling 30-day average' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Discharge Pipeline — Next 7 Days</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Patient', 'LOC', 'LOS', 'Target DC Date', 'Auth End', 'Aftercare LOC', 'Housing', 'MAT at DC', 'Readiness'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'J. B.', loc: 'Residential', los: '31d', dc: 'Jul 24', auth: 'Jul 24', after: 'PHP', housing: 'Sober living', mat: 'Suboxone 16mg', ready: 'Ready' },
                  { name: 'A. C.', loc: 'Residential', los: '21d', dc: 'Jul 22', auth: 'Jul 24', after: 'IOP', housing: 'Home (family)', mat: 'None', ready: 'Ready' },
                  { name: 'M. D.', loc: 'Detox', los: '9d', dc: 'Jul 23', auth: 'Jul 23', after: 'Residential', housing: 'Pending', mat: 'Vivitrol pending', ready: 'Needs Work' },
                  { name: 'T. R.', loc: 'Residential', los: '30d', dc: 'Jul 24', auth: 'Jul 28', after: 'IOP', housing: 'Not secured', mat: 'Naltrexone oral', ready: 'Needs Work' },
                ].map(r => (
                  <tr key={r.name} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-navy">{r.name}</td>
                    <td className="px-3 py-2 text-slate">{r.loc}</td>
                    <td className="px-3 py-2 text-slate">{r.los}</td>
                    <td className="px-3 py-2 font-semibold text-navy">{r.dc}</td>
                    <td className="px-3 py-2 text-slate">{r.auth}</td>
                    <td className="px-3 py-2 text-slate">{r.after}</td>
                    <td className="px-3 py-2 text-slate">{r.housing}</td>
                    <td className="px-3 py-2 text-slate">{r.mat}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.ready === 'Ready' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.ready}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {plActionSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <span>✓</span> {plActionSaved}
        </div>
      )}
    </div>
  );
}
