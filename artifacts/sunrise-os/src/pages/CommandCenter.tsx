import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { MOCK_STAFF } from '../data/mockStaff';

import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

const SHIFT_ALERTS = [
  { id: 'a1', level: 'critical', icon: '🚨', patient: 'Marcus Webb', mrn: 'MRN-83921', patientId: 'p1', message: 'HIGH AMA risk — verbalized intent to leave after lunch. Counselor check-in required.', time: '8:14 AM', category: 'AMA Risk' },
  { id: 'a2', level: 'critical', icon: '🚨', patient: 'Samantha Choi', mrn: 'MRN-74563', patientId: 'p2', message: 'Restricted meals — psych consult ordered by Dr. Stone. Dietary to be notified.', time: '7:52 AM', category: 'Psychiatric' },
  { id: 'a3', level: 'warning', icon: '⚠️', patient: 'James Thornton', mrn: 'MRN-62841', patientId: 'p3', message: 'COWS score 9 at 6:00 AM — up from 6 at midnight. MAT dose adjustment pending physician review.', time: '6:18 AM', category: 'Withdrawal' },
  { id: 'a4', level: 'warning', icon: '⚠️', patient: 'Destiny Williams', mrn: 'MRN-55129', patientId: 'p6', message: 'UA collected 7/16 — chain of custody form missing. Lab re-collection scheduled.', time: '8:01 AM', category: 'Documentation' },
  { id: 'a5', level: 'info', icon: 'ℹ️', patient: 'Robert Navarro', mrn: 'MRN-44782', patientId: 'p5', message: 'Family visitation approved for 5:00 PM. BHT staff to facilitate and document.', time: '7:30 AM', category: 'Visitation' },
  { id: 'a6', level: 'info', icon: 'ℹ️', patient: 'Linda Farris', mrn: 'MRN-39018', patientId: 'p8', message: 'Insurance authorization expires 7/22 — UR to submit continued stay request today.', time: '8:00 AM', category: 'Insurance' },
];

const SHIFT_EVENTS = [
  { time: '9:00 AM', event: 'Morning Process Group', facilitator: 'Sarah Jenkins, LPC', location: 'Group Room A', census: 10 },
  { time: '9:30 AM', event: 'Medical Rounds', facilitator: 'Dr. Robert Chen', location: 'Nursing Station', census: null },
  { time: '10:30 AM', event: 'Psychoeducation — Disease Model', facilitator: 'David Odom, LMFT', location: 'Group Room B', census: 7 },
  { time: '11:00 AM', event: 'Family Systems Group', facilitator: 'David Odom, LMFT', location: 'Group Room A', census: 5 },
  { time: '12:00 PM', event: 'Physician: MAT Review Clinic', facilitator: 'Dr. Robert Chen', location: 'Medical Suite', census: 4 },
  { time: '1:00 PM', event: 'Relapse Prevention Group', facilitator: 'Maria Gonzales, LCSW', location: 'Group Room A', census: 12 },
  { time: '2:30 PM', event: 'Trauma-Informed Care', facilitator: 'Dr. Allen Hughes', location: 'Group Room C', census: 8 },
  { time: '3:00 PM', event: 'Shift Change Handoff', facilitator: 'All Clinical Staff', location: 'Conference Room', census: null },
  { time: '4:00 PM', event: 'Individual Sessions', facilitator: 'Counselor Team', location: 'Offices', census: 6 },
  { time: '5:00 PM', event: 'Visitation Hour', facilitator: 'Kevin Wright', location: 'Family Lounge', census: null },
  { time: '7:00 PM', event: 'Evening Reflection', facilitator: 'Sarah Jenkins, LPC', location: 'Group Room A', census: 14 },
];

const ON_DUTY_STAFF = [
  { name: 'Sarah Jenkins, LPC', role: 'Primary Counselor', shift: 'Day (7A–3P)', assignment: 'Residential — 5 clients', status: 'Active' },
  { name: 'David Odom, LMFT', role: 'Primary Counselor', shift: 'Day (7A–3P)', assignment: 'PHP — 4 clients', status: 'Active' },
  { name: 'Maria Gonzales, LCSW', role: 'Primary Counselor', shift: 'Day (7A–3P)', assignment: 'IOP — 6 clients', status: 'Active' },
  { name: 'Dr. Robert Chen', role: 'Attending Physician', shift: 'Day (8A–5P)', assignment: 'All Programs — Medical', status: 'Active' },
  { name: 'Dr. Allen Hughes', role: 'Psychiatrist', shift: 'Day (9A–2P)', assignment: 'Psych Consults', status: 'Active' },
  { name: 'Jessica Torres, RN', role: 'Charge Nurse', shift: 'Day (7A–7P)', assignment: 'Nursing Station / MAR', status: 'Active' },
  { name: 'Michael Boyd, RN', role: 'Nurse', shift: 'Day (7A–7P)', assignment: 'Vitals / COWS / CIWA', status: 'Active' },
  { name: 'Kevin Wright', role: 'BHT Supervisor', shift: 'Day (8A–4P)', assignment: 'Floor Supervision', status: 'Active' },
];

const PENDING_ACTIONS = [
  { id: 'pa1', priority: 'urgent', label: '4 notes awaiting co-sign', icon: '✍️', action: 'CosignQueue' as Screen },
  { id: 'pa2', priority: 'urgent', label: '2 pending MAT dose adjustments', icon: '💊', action: 'ASAMAssessments' as Screen },
  { id: 'pa3', priority: 'moderate', label: '3 incomplete ASAM assessments', icon: '📋', action: 'ASAMAssessments' as Screen },
  { id: 'pa4', priority: 'moderate', label: '1 insurance auth expiring in 2 days', icon: '📄', action: 'RevenueCycle' as Screen },
  { id: 'pa5', priority: 'low', label: '2 scheduled discharges this week', icon: '🏠', action: 'Discharges' as Screen },
];

const HANDOFF_ITEMS = [
  { category: 'AMA Risk', patient: 'Marcus Webb', bed: 'B-04', note: 'HIGH AMA risk — verbalized intent to leave. Ensure q30 min check-ins by BHT through 3 PM. Counselor Sarah Jenkins notified.', level: 'critical' },
  { category: 'Withdrawal', patient: 'James Thornton', bed: 'B-07', note: 'COWS 9 at 6 AM, up from 6 at midnight. Dr. Patel order pending for Clonidine 0.1 mg q6h PRN. Next vitals due 12 PM.', level: 'critical' },
  { category: 'Psychiatric', patient: 'Samantha Choi', bed: 'B-02', note: 'Restricted meals per psych consult (Dr. Stone). Dietary notified. No unsupervised access to bathroom until 2 PM eval.', level: 'critical' },
  { category: 'Med Due', patient: 'Robert Navarro', bed: 'B-09', note: 'Suboxone 8mg due at 12 PM — patient has refused morning snack. Confirm vitals before administration per MAR protocol.', level: 'warning' },
  { category: 'Documentation', patient: 'Destiny Williams', bed: 'B-11', note: 'UA chain of custody form missing from 7/16 collection. Lab rerun scheduled for 2 PM. Ensure BHT documents direct observation.', level: 'warning' },
  { category: 'Family Visit', patient: 'Robert Navarro', bed: 'B-09', note: 'Family visitation approved 5 PM — sister and mother on approved list. BHT to facilitate. Document in family engagement log.', level: 'info' },
  { category: 'Insurance', patient: 'Linda Farris', bed: 'D-03', note: 'Cigna auth expires 7/22. UR to submit continued stay request today. Dr. Patel to co-sign clinical criteria by 4 PM.', level: 'info' },
];

export function CommandCenter({ navigate, readOnly }: Props) {
  const [activeShift, setActiveShift] = useState<'Day' | 'Evening' | 'Night'>('Day');
  const [alertFilter, setAlertFilter] = useState<'All' | 'critical' | 'warning' | 'info'>('All');
  const [showHandoff, setShowHandoff] = useState(false);

  const resCount = MOCK_PATIENTS.filter(p => p.program === 'Residential').length;
  const phpCount = MOCK_PATIENTS.filter(p => p.program === 'PHP').length;
  const iopCount = MOCK_PATIENTS.filter(p => p.program === 'IOP').length;
  const census = { residential: { occ: resCount, cap: 16 }, php: { occ: phpCount, cap: 12 }, iop: { occ: iopCount, cap: 12 } };
  const totalOcc = census.residential.occ + census.php.occ + census.iop.occ;
  const totalCap = census.residential.cap + census.php.cap + census.iop.cap;

  const filteredAlerts = alertFilter === 'All' ? SHIFT_ALERTS : SHIFT_ALERTS.filter(a => a.level === alertFilter);

  const levelBg: Record<string, string> = {
    critical: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  };
  const levelBadge: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
    info: 'bg-blue-100 text-blue-700',
  };
  const priorityColors: Record<string, string> = {
    urgent: 'text-red-600 bg-red-50 border-red-200',
    moderate: 'text-amber-700 bg-amber-50 border-amber-200',
    low: 'text-slate bg-gray-50 border-border',
  };

  const [ccTab, setCcTab] = useState<'Shift View' | 'Quality Metrics' | 'Ops Dashboard' | 'Capacity Forecast' | 'Alert Management' | 'Critical Events'>('Shift View');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Command Center</h1>
          <p className="text-slate text-sm mt-0.5">Shift Overview — Saturday, July 19, 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            {(['Day', 'Evening', 'Night'] as const).map(s => (
              <button
                key={s}
                onClick={() => setActiveShift(s)}
                className={`px-4 py-2 font-medium transition-colors ${activeShift === s ? 'bg-navy text-white' : 'bg-white text-slate hover:bg-gray-50'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <button onClick={() => setShowHandoff(v => !v)} className={`text-sm px-4 py-2 rounded font-medium border transition-colors ${showHandoff ? 'bg-navy text-white border-navy' : 'border-border text-slate hover:bg-slate-50'}`}>
            📋 Shift Handoff
          </button>
          <LockedButton locked={readOnly} className="btn-primary text-sm px-4 py-2">+ Incident Report</LockedButton>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['Shift View', 'Quality Metrics', 'Ops Dashboard', 'Capacity Forecast', 'Alert Management', 'Critical Events'] as const).map(t => (
          <button key={t} onClick={() => setCcTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${ccTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {ccTab === 'Quality Metrics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Note Completion Rate', value: '91%', sub: 'Within 24h of service', color: 'text-green-600' },
              { label: 'Co-sign Backlog', value: 4, sub: 'Awaiting supervisor sign', color: 'text-amber-600' },
              { label: 'Avg Response to Alert', value: '8 min', sub: 'Day shift avg this week', color: 'text-blue-600' },
              { label: 'Incident Reports YTD', value: 7, sub: '0 injuries / 2 near-miss', color: 'text-navy' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Treatment Plan Compliance — This Week</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Group Attendance ≥ 80%', value: 14, total: 18, pct: 78 },
                  { label: 'Counselor 1:1 Scheduled', value: 18, total: 18, pct: 100 },
                  { label: 'Weekly UA Completed', value: 16, total: 18, pct: 89 },
                  { label: 'Treatment Plans Current', value: 17, total: 18, pct: 94 },
                  { label: 'Vitals Documented Daily', value: 18, total: 18, pct: 100 },
                  { label: 'ASAM Reviews On Schedule', value: 15, total: 18, pct: 83 },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate">{r.label}</span>
                      <span className={`font-bold ${r.pct >= 90 ? 'text-green-600' : r.pct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{r.value}/{r.total} ({r.pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${r.pct >= 90 ? 'bg-green-500' : r.pct >= 75 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Documentation Timeliness — Last 30 Days</h3>
              <div className="space-y-3">
                {[
                  { type: 'Progress Notes (Individual)', sla: '24h', within: 91, late: 9 },
                  { type: 'Group Therapy Notes', sla: '24h', within: 88, late: 12 },
                  { type: 'Medical / Nursing Notes', sla: '4h', within: 97, late: 3 },
                  { type: 'ASAM Assessment Reviews', sla: '7 days', within: 83, late: 17 },
                  { type: 'Discharge Summaries', sla: '72h post-DC', within: 94, late: 6 },
                  { type: 'Incident Reports', sla: '2h', within: 100, late: 0 },
                ].map(r => (
                  <div key={r.type} className="flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-navy">{r.type}</div>
                      <div className="text-slate">SLA: {r.sla}</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className={`font-bold ${r.within >= 90 ? 'text-green-600' : r.within >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{r.within}%</span>
                      <span className="text-slate">on time</span>
                      {r.late > 0 && <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">{r.late}% late</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Shift Metrics Scorecard — Week of July 14–19, 2026</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 pr-3">Metric</th>
                    <th className="text-center py-2 px-2">Mon</th>
                    <th className="text-center py-2 px-2">Tue</th>
                    <th className="text-center py-2 px-2">Wed</th>
                    <th className="text-center py-2 px-2">Thu</th>
                    <th className="text-center py-2 px-2">Fri</th>
                    <th className="text-center py-2 pl-2">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'Census (Residential)', vals: [16, 16, 15, 16, 15], avg: 15.6 },
                    { name: 'Group Attendance Rate', vals: ['82%', '79%', '85%', '76%', '83%'], avg: '81%' },
                    { name: 'MAR Completion', vals: ['100%', '100%', '98%', '100%', '100%'], avg: '99.6%' },
                    { name: 'Alert Response (min)', vals: [7, 9, 6, 10, 8], avg: 8 },
                    { name: 'Notes Completed Same Day', vals: ['88%', '92%', '94%', '89%', '93%'], avg: '91%' },
                  ].map(r => (
                    <tr key={r.name}>
                      <td className="py-2 pr-3 font-medium text-navy">{r.name}</td>
                      {r.vals.map((v, i) => <td key={i} className="py-2 px-2 text-center text-slate">{v}</td>)}
                      <td className="py-2 pl-2 text-center font-bold text-navy">{r.avg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {ccTab === 'Shift View' && (
      <>
      {/* Census Ribbon */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-navy">{totalOcc}/{totalCap}</div>
          <div className="text-xs text-slate mt-1 uppercase tracking-wide">Total Census</div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full">
            <div className="h-2 bg-orange rounded-full" style={{ width: `${(totalOcc / totalCap) * 100}%` }} />
          </div>
          <div className="text-xs text-slate mt-1">{Math.round((totalOcc / totalCap) * 100)}% Occupied</div>
        </div>
        {[
          { label: 'Residential', ...census.residential, color: 'bg-blue-500' },
          { label: 'PHP', ...census.php, color: 'bg-purple-500' },
          { label: 'IOP', ...census.iop, color: 'bg-green-500' },
        ].map(p => (
          <div key={p.label} className="card text-center">
            <div className="text-3xl font-bold text-navy">{p.occ}/{p.cap}</div>
            <div className="text-xs text-slate mt-1 uppercase tracking-wide">{p.label}</div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full">
              <div className={`h-2 ${p.color} rounded-full`} style={{ width: `${(p.occ / p.cap) * 100}%` }} />
            </div>
            <div className="text-xs text-slate mt-1">{Math.round((p.occ / p.cap) * 100)}% Occupied</div>
          </div>
        ))}
      </div>

      {/* Shift Handoff Report */}
      {showHandoff && (
        <div className="bg-navy text-white rounded-xl shadow-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg">Shift Handoff Report — Day → Evening</div>
              <div className="text-white/70 text-sm">Generated July 19, 2026 · 2:58 PM · Handoff to Evening Team at 3:00 PM</div>
            </div>
            <button onClick={() => setShowHandoff(false)} className="text-white/60 hover:text-white text-sm px-3 py-1.5 border border-white/20 rounded hover:border-white/40 transition-colors">✕ Close</button>
          </div>

          {/* Census snapshot */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Census', value: `${totalOcc}/${totalCap}`, pct: Math.round((totalOcc/totalCap)*100) },
              { label: 'Residential', value: `${census.residential.occ}/${census.residential.cap}`, pct: Math.round((census.residential.occ/census.residential.cap)*100) },
              { label: 'PHP', value: `${census.php.occ}/${census.php.cap}`, pct: Math.round((census.php.occ/census.php.cap)*100) },
              { label: 'IOP', value: `${census.iop.occ}/${census.iop.cap}`, pct: Math.round((census.iop.occ/census.iop.cap)*100) },
            ].map(c => (
              <div key={c.label} className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-xs text-white/60 uppercase tracking-wider mb-1">{c.label}</div>
                <div className="text-xl font-bold">{c.value}</div>
                <div className="text-xs text-white/60 mt-1">{c.pct}% capacity</div>
              </div>
            ))}
          </div>

          {/* Handoff items */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-white/80 uppercase tracking-wider">Patient Alerts to Carry Forward</div>
            {HANDOFF_ITEMS.map((item, i) => (
              <div key={i} className={`rounded-lg p-3 flex items-start gap-3 ${
                item.level === 'critical' ? 'bg-red-900/40 border border-red-500/40' :
                item.level === 'warning'  ? 'bg-amber-900/30 border border-amber-500/40' :
                                            'bg-white/10 border border-white/20'
              }`}>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-none ${
                  item.level === 'critical' ? 'bg-red-500/30 text-red-200' :
                  item.level === 'warning'  ? 'bg-amber-500/30 text-amber-200' :
                                              'bg-blue-500/20 text-blue-200'
                }`}>{item.category}</span>
                <div className="flex-1">
                  <span className="font-semibold text-sm">{item.patient}</span>
                  <span className="text-white/50 text-xs ml-2">Bed {item.bed}</span>
                  <p className="text-sm text-white/80 mt-0.5">{item.note}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sign-off line */}
          <div className="border-t border-white/20 pt-3 flex items-center justify-between">
            <div className="text-sm text-white/60">Outgoing Shift Lead: <span className="text-white font-medium">Sarah Jenkins, LPC</span> · Day Team</div>
            <LockedButton locked={readOnly} className="bg-white text-navy text-sm font-semibold px-4 py-2 rounded hover:bg-white/90 transition-colors">Sign & Hand Off</LockedButton>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-navy">Shift Alerts</h2>
            <div className="flex gap-2 text-xs">
              {(['All', 'critical', 'warning', 'info'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setAlertFilter(f)}
                  className={`px-3 py-1 rounded-full border font-medium capitalize transition-colors ${alertFilter === f ? 'bg-navy text-white border-navy' : 'bg-white text-slate border-border hover:border-navy'}`}
                >
                  {f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`border rounded-lg p-3 ${levelBg[alert.level]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-lg leading-none mt-0.5">{alert.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => navigate('PatientDetail', alert.patientId)}
                          className="font-semibold text-navy hover:text-orange text-sm"
                        >
                          {alert.patient}
                        </button>
                        <span className="text-xs text-slate">{alert.mrn}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelBadge[alert.level]}`}>{alert.category}</span>
                      </div>
                      <p className="text-sm text-slate mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate whitespace-nowrap">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Shift Schedule */}
          <div>
            <h2 className="text-base font-semibold text-navy mb-3">Today's Schedule</h2>
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-border">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate uppercase">Time</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate uppercase">Event</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate uppercase">Facilitator</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate uppercase">Location</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate uppercase">Census</th>
                  </tr>
                </thead>
                <tbody>
                  {SHIFT_EVENTS.map((ev, i) => (
                    <tr key={i} className={`border-b border-border last:border-0 ${ev.event === 'Shift Change Handoff' ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-2.5 font-mono text-xs text-navy font-medium">{ev.time}</td>
                      <td className="px-4 py-2.5 font-medium text-navy">{ev.event}</td>
                      <td className="px-4 py-2.5 text-slate">{ev.facilitator}</td>
                      <td className="px-4 py-2.5 text-slate">{ev.location}</td>
                      <td className="px-4 py-2.5">{ev.census !== null ? <span className="font-medium text-navy">{ev.census}</span> : <span className="text-slate">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Pending Actions */}
          <div>
            <h2 className="text-base font-semibold text-navy mb-3">Pending Actions</h2>
            <div className="space-y-2">
              {PENDING_ACTIONS.map(action => (
                <button
                  key={action.id}
                  onClick={() => navigate(action.action)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors hover:opacity-80 ${priorityColors[action.priority]}`}
                >
                  <span className="text-lg">{action.icon}</span>
                  <span className="text-sm font-medium flex-1">{action.label}</span>
                  <span className="text-xs">→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Staff On Duty */}
          <div>
            <h2 className="text-base font-semibold text-navy mb-3">Staff On Duty</h2>
            <div className="card p-0 divide-y divide-border">
              {ON_DUTY_STAFF.map((s, i) => (
                <div key={i} className="px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-navy text-sm">{s.name}</div>
                    <span className="w-2 h-2 rounded-full bg-green-500" title="On duty" />
                  </div>
                  <div className="text-xs text-slate">{s.role}</div>
                  <div className="text-xs text-slate mt-0.5">📍 {s.assignment}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-base font-semibold text-navy mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Patient List', icon: '👥', screen: 'PatientList' as Screen },
                { label: 'Co-sign Queue', icon: '✍️', screen: 'CosignQueue' as Screen },
                { label: 'Chart Review', icon: '📋', screen: 'ChartReview' as Screen },
                { label: 'Discharges', icon: '🏠', screen: 'Discharges' as Screen },
              ].map(qa => (
                <button
                  key={qa.label}
                  onClick={() => navigate(qa.screen)}
                  className="flex flex-col items-center gap-1 p-3 bg-white border border-border rounded-lg hover:border-orange hover:bg-orange/5 transition-colors text-sm font-medium text-navy"
                >
                  <span className="text-xl">{qa.icon}</span>
                  <span>{qa.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {ccTab === 'Ops Dashboard' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Real-time operational metrics — capacity, staffing ratios, documentation compliance, and daily throughput.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Current Census', value: '11/16', color: 'text-navy', sub: '69% occupancy' },
              { label: 'Staff On-Shift', value: '8', color: 'text-green-600', sub: '2 RN · 4 counselors · 2 BHT' },
              { label: 'Notes Due Today', value: 7, color: 'text-amber-600', sub: '3 overdue >24h' },
              { label: 'Admissions Today', value: 2, color: 'text-blue-600', sub: '1 detox · 1 residential' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Unit Occupancy — Live</h3>
              <div className="space-y-3 text-xs">
                {[
                  { unit: 'Detox (4 beds)', occupied: 2, cap: 4, pct: 50, color: 'bg-blue-500' },
                  { unit: 'Residential A (4 beds)', occupied: 3, cap: 4, pct: 75, color: 'bg-teal-500' },
                  { unit: 'Residential B (4 beds)', occupied: 3, cap: 4, pct: 75, color: 'bg-purple-500' },
                  { unit: 'Flex / Step-Down (4 beds)', occupied: 3, cap: 4, pct: 75, color: 'bg-orange-500' },
                ].map(u => (
                  <div key={u.unit}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-navy">{u.unit}</span>
                      <span className="text-slate">{u.occupied}/{u.cap} beds ({u.pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full">
                      <div className={`h-2.5 rounded-full ${u.color}`} style={{ width: `${u.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Staffing Ratios — Current Shift</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Role</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">On Shift</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Required</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Ratio</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { role: 'Registered Nurse', on: 2, req: 2, ratio: '1:5.5', ok: true },
                    { role: 'Licensed Counselor', on: 3, req: 3, ratio: '1:3.7', ok: true },
                    { role: 'BHT / Technician', on: 2, req: 2, ratio: '1:5.5', ok: true },
                    { role: 'Peer Support Specialist', on: 1, req: 1, ratio: '1:11', ok: true },
                    { role: 'Charge Nurse / Supervisor', on: 1, req: 1, ratio: '1:11', ok: true },
                  ].map(r => (
                    <tr key={r.role} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-navy">{r.role}</td>
                      <td className="py-2 text-center text-slate">{r.on}</td>
                      <td className="py-2 text-center text-slate">{r.req}</td>
                      <td className="py-2 text-center text-slate">{r.ratio}</td>
                      <td className="py-2 text-center">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.ok ? 'Met' : 'Deficit'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Daily Throughput Summary — Today</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              {[
                { label: 'Admissions', value: 2, icon: '➕', color: 'bg-blue-50 border-blue-200' },
                { label: 'Discharges', value: 1, icon: '🏠', color: 'bg-green-50 border-green-200' },
                { label: 'Bed Transfers', value: 0, icon: '🔄', color: 'bg-gray-50 border-border' },
                { label: 'Incident Reports', value: 0, icon: '⚠️', color: 'bg-gray-50 border-border' },
                { label: 'ER/Urgent Consults', value: 1, icon: '🏥', color: 'bg-amber-50 border-amber-200' },
              ].map(t => (
                <div key={t.label} className={`border rounded-lg p-3 text-center ${t.color}`}>
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="text-2xl font-bold text-navy">{t.value}</div>
                  <div className="text-slate mt-0.5">{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {ccTab === 'Capacity Forecast' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">7-day rolling bed capacity and admission forecast — integrates current census, expected discharges, and historical admission demand to project availability.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Current Occupancy', value: '82%', color: 'text-amber-600', sub: '36 of 44 beds occupied' },
              { label: 'Expected Discharges (7d)', value: 9, color: 'text-green-600', sub: 'Based on planned discharge dates' },
              { label: 'Expected Admissions (7d)', value: 11, color: 'text-blue-600', sub: 'From active waitlist + referrals' },
              { label: 'Net Bed Change (7d)', value: '+2', color: 'text-navy', sub: 'Projected end-of-week census: 38' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">7-Day Bed Forecast by Program</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Program', 'Today', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Capacity'].map(h => (
                    <th key={h} className="text-left px-2 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { prog: "Men's Residential", today: 9, mon: 8, tue: 9, wed: 10, thu: 9, fri: 9, sat: 8, sun: 8, cap: 10 },
                  { prog: "Women's Residential", today: 7, mon: 6, tue: 7, wed: 7, thu: 8, fri: 8, sat: 7, sun: 7, cap: 8 },
                  { prog: 'Detox', today: 5, mon: 4, tue: 5, wed: 5, thu: 6, fri: 6, sat: 5, sun: 5, cap: 6 },
                  { prog: 'PHP', today: 9, mon: 9, tue: 8, wed: 9, thu: 10, fri: 10, sat: 0, sun: 0, cap: 12 },
                  { prog: 'IOP', today: 6, mon: 7, tue: 7, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0, cap: 8 },
                ].map(r => {
                  const cols = [r.today, r.mon, r.tue, r.wed, r.thu, r.fri, r.sat, r.sun];
                  return (
                    <tr key={r.prog} className="hover:bg-gray-50">
                      <td className="px-2 py-2 font-medium text-navy">{r.prog}</td>
                      {cols.map((v, i) => {
                        const pct = r.cap > 0 ? v / r.cap : 0;
                        return (
                          <td key={i} className={`px-2 py-2 text-center font-semibold ${pct >= 0.9 ? 'text-amber-600' : pct >= 0.75 ? 'text-blue-600' : 'text-green-600'}`}>
                            {v > 0 ? v : '—'}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center text-slate font-medium">{r.cap}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-3 flex gap-4 text-[10px] text-slate">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> ≥90% capacity (amber)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span> 75–89% (blue)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span> &lt;75% (green)</span>
            </div>
          </div>
        </div>
      )}

      {ccTab === 'Alert Management' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Active clinical and operational alerts requiring supervisor acknowledgment — sort by priority and assign to on-call staff.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Open Alerts', value: 7, color: 'text-red-600', sub: 'Requiring acknowledgment' },
              { label: 'Critical (P1)', value: 2, color: 'text-red-700', sub: 'Immediate response needed' },
              { label: 'Acknowledged (Today)', value: 11, color: 'text-green-600', sub: 'Resolved or assigned' },
              { label: 'Avg Response Time', value: '8 min', color: 'text-navy', sub: 'P1 alerts — 24h rolling' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Active Alert Queue</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Priority', 'Alert Type', 'Patient / Location', 'Generated', 'Assigned To', 'Status', 'Action Required'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { p: 'P1', type: 'CIWA Score ≥18', loc: 'Rm 4B — M. Delgado', gen: '11:42 AM', assign: 'Dr. Chen (on-call)', status: 'Active', action: 'MD bedside eval within 15 min' },
                  { p: 'P1', type: 'AMA Request', loc: 'Rm 9A — T. Barnes', gen: '12:05 PM', assign: 'S. Jenkins, LPC', status: 'Active', action: 'Counselor contact; AMA form if needed' },
                  { p: 'P2', type: 'Missed Medication (3 doses)', loc: 'Rm 6C — K. Walsh', gen: '10:30 AM', assign: 'J. Torres, RN', status: 'In Progress', action: 'Nursing assessment; document reason' },
                  { p: 'P2', type: 'Positive UA (Fentanyl)', loc: 'Rm 11D — R. Patel', gen: '09:15 AM', assign: 'D. Odom, LMFT', status: 'In Progress', action: 'Counselor session; update treatment plan' },
                  { p: 'P3', type: 'Group No-Show (2 sessions)', loc: 'Rm 3A — A. Monroe', gen: '08:00 AM', assign: 'T. Osei, CAC-AD', status: 'Pending', action: 'Check-in and document reason' },
                  { p: 'P3', type: 'Auth Expiring in 48h', loc: 'Rm 7B — L. Carter', gen: '07:00 AM', assign: 'Billing — B. Hughes', status: 'Pending', action: 'Submit concurrent review to BCBS' },
                  { p: 'P3', type: 'Pending Co-sign >24h', loc: 'Progress Note — 3 docs', gen: '06:00 AM', assign: 'Supervisor — D. Reyes', status: 'Pending', action: 'Review and co-sign in ChartReview' },
                ].map(r => (
                  <tr key={r.type + r.loc} className="hover:bg-gray-50">
                    <td className="px-3 py-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.p === 'P1' ? 'bg-red-100 text-red-700' : r.p === 'P2' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{r.p}</span></td>
                    <td className="px-3 py-2 font-semibold text-navy">{r.type}</td>
                    <td className="px-3 py-2 text-slate">{r.loc}</td>
                    <td className="px-3 py-2 text-slate font-mono text-[10px]">{r.gen}</td>
                    <td className="px-3 py-2 text-slate">{r.assign}</td>
                    <td className="px-3 py-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.status === 'Active' ? 'bg-red-100 text-red-700' : r.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{r.status}</span></td>
                    <td className="px-3 py-2 text-slate italic text-[10px]">{r.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ccTab === 'Critical Events' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">30-day log of critical clinical events — overdoses, AMA discharges, medical emergencies, and code responses.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Critical Events (30d)', value: 6, color: 'text-navy', sub: 'Any P1 incident logged' },
              { label: 'Medical Emergencies', value: 2, color: 'text-red-600', sub: 'EMS called' },
              { label: 'AMA Discharges', value: 3, color: 'text-amber-600', sub: 'Against medical advice' },
              { label: 'Overdose Events', value: 1, color: 'text-red-700', sub: 'Naloxone administered' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Critical Event Log — Last 30 Days</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Date', 'Event Type', 'Patient (Initials)', 'LOC', 'Response', 'Outcome', 'Root Cause', 'QAPI Filed'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { date: 'Jul 14', type: 'AMA Discharge', pt: 'T.B.', loc: 'Residential', resp: 'Counselor session; AMA form signed', outcome: 'Discharged against advice', rc: 'Family conflict / external pull', qapi: 'Yes' },
                  { date: 'Jul 10', type: 'Medical Emergency (Seizure)', pt: 'M.D.', loc: 'Detox', resp: 'RN + MD response; EMS called', outcome: 'Transported; returned 48h', rc: 'Alcohol withdrawal — CIWA under-scored', qapi: 'Yes' },
                  { date: 'Jul 5', type: 'Naloxone Administration', pt: 'R.C.', loc: 'Residential', resp: 'RN Narcan 4mg IN; EMS standby', outcome: 'Full recovery; no transport', rc: 'Contraband fentanyl — room not searched', qapi: 'Yes' },
                  { date: 'Jun 29', type: 'AMA Discharge', pt: 'K.W.', loc: 'PHP', resp: 'Counselor session; refused', outcome: 'Discharged against advice', rc: 'Cravings score ≥9 — not escalated', qapi: 'Yes' },
                  { date: 'Jun 21', type: 'Medical Emergency (Chest Pain)', pt: 'A.S.', loc: 'Residential', resp: 'RN assessment; EMS called', outcome: 'Hospital eval; ruled out MI; returned', rc: 'Pre-existing cardiac history', qapi: 'No — medical only' },
                  { date: 'Jun 18', type: 'AMA Discharge', pt: 'L.P.', loc: 'Detox', resp: 'Counselor + MD conversation', outcome: 'Discharged against advice', rc: 'Work/family pressure; LOS < 5 days', qapi: 'Yes' },
                ].map(r => (
                  <tr key={r.date + r.type} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-slate font-mono">{r.date}</td>
                    <td className="px-3 py-2 font-semibold text-navy">{r.type}</td>
                    <td className="px-3 py-2 text-slate font-mono">{r.pt}</td>
                    <td className="px-3 py-2 text-slate">{r.loc}</td>
                    <td className="px-3 py-2 text-slate">{r.resp}</td>
                    <td className="px-3 py-2 text-slate">{r.outcome}</td>
                    <td className="px-3 py-2 text-slate italic">{r.rc}</td>
                    <td className="px-3 py-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.qapi === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{r.qapi}</span></td>
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
