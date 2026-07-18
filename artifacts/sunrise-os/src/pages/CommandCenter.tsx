import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { MOCK_STAFF } from '../data/mockStaff';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

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

export function CommandCenter({ navigate }: Props) {
  const [activeShift, setActiveShift] = useState<'Day' | 'Evening' | 'Night'>('Day');
  const [alertFilter, setAlertFilter] = useState<'All' | 'critical' | 'warning' | 'info'>('All');

  const census = { residential: { occ: 8, cap: 10 }, php: { occ: 5, cap: 6 }, iop: { occ: 5, cap: 6 } };
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Command Center</h1>
          <p className="text-slate text-sm mt-0.5">Shift Overview — Friday, July 18, 2026</p>
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
          <button className="btn-primary text-sm px-4 py-2">+ Incident Report</button>
        </div>
      </div>

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
    </div>
  );
}
