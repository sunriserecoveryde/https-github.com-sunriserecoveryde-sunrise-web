import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp, Flag, Pill, Activity } from 'lucide-react';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

interface HandoffNote {
  patientId: string;
  acuity: 'Critical' | 'High' | 'Moderate' | 'Stable';
  vitalsSummary: string;
  mood: number;
  craving: number;
  pendingOrders: string[];
  flags: string[];
  watchFor: string;
  lastContact: string;
}

const HANDOFF_NOTES: HandoffNote[] = [
  { patientId: 'p1', acuity: 'High', vitalsSummary: 'BP 148/92, HR 88, T 98.6°F. Stable.', mood: 4, craving: 8, pendingOrders: ['Co-sign pending (BIRP 7/18)', 'Suboxone 0800 — given'], flags: ['AMA Risk HIGH — verbalized leaving after lunch', 'Counselor 1:1 check-in due before 3PM'], watchFor: 'AMA behavior — patient has been asking about pass policy. Staff to complete safety check q2h. Notify on-call MD if patient requests to leave.', lastContact: '10:45 AM — Sarah Jenkins' },
  { patientId: 'p2', acuity: 'High', vitalsSummary: 'BP 110/70, HR 74, T 98.4°F. Stable.', mood: 5, craving: 2, pendingOrders: ['Vivitrol injection due 7/20 — confirm pharmacy order', 'Lamictal 0800 — given, 2000 — pending'], flags: ['Psych flag: restricting food per Dr. Stone', 'Dietary notified — ensure meal observation at dinner'], watchFor: 'Eating disorder behaviors: observe meal completion, no bathroom access 30 min post-meal per protocol. Family session 7/22 — confirm with David Odom.', lastContact: '11:00 AM — David Odom' },
  { patientId: 'p3', acuity: 'Critical', vitalsSummary: 'BP 138/88, HR 96, T 99.1°F. COWS 9 this morning.', mood: 3, craving: 6, pendingOrders: ['COWS Q4H — 1400 dose due', 'Clonidine 1400 — pending administration', 'Hepatitis panel pending physician signature (ORD-015)'], flags: ['Active withdrawal — COWS up from 6 to 9', 'Notify MD if COWS ≥13'], watchFor: 'Withdrawal escalation. COWS at 10:00 was 7. If score ≥13 notify Dr. Chen immediately. Patient is asking about leaving — document all conversations. Hydration: pushing oral fluids.', lastContact: '10:00 AM — Michael Boyd, RN' },
  { patientId: 'p9', acuity: 'Critical', vitalsSummary: 'BP 122/78, HR 82, T 98.8°F. Stable.', mood: 4, craving: 7, pendingOrders: ['30-min safety check ongoing', 'Risperdal PRN — NOT given today', 'Seroquel 2100 — pending'], flags: ['Substance-induced psychosis — active', 'Behavioral escalation 7/16 — incident documented'], watchFor: 'Paranoid ideation. Patient was quiet during group but made statements about "people following him." Ensure 1:1 during medication administration. Do NOT leave patient alone during Q30min checks — full visual contact required.', lastContact: '11:30 AM — Kevin Wright, BHT' },
  { patientId: 'p13', acuity: 'Moderate', vitalsSummary: 'BP 162/94 — elevated! HR 78, T 98.2°F.', mood: 6, craving: 3, pendingOrders: ['Librium CIWA protocol — HELD (score 4)', 'Acamprosate 1300 — pending', 'Metformin 1800 — pending', 'BP recheck at 1500 per Dr. Stone'], flags: ['Hypertension alert — BP 162/94 at 0800'], watchFor: 'BP monitoring q4h. If SBP >180 notify Dr. Stone. Patient declines to discuss discharge but is compliant with treatment. Son called this morning — 42 CFR consent limits disclosure. Patient aware.', lastContact: '0800 — Jessica Torres, RN' },
  { patientId: 'p17', acuity: 'High', vitalsSummary: 'BP 128/80, HR 88, T 98.9°F. Stable.', mood: 5, craving: 6, pendingOrders: ['Suboxone 0800 — given (witnessed)', 'Trazodone 2100 PRN — pending'], flags: ['AMA Risk HIGH — early induction day 7', 'Patient stated "I could leave right now and be fine"'], watchFor: 'AMA risk. Patient is on day 7 of induction and medically stable, which increases AMA risk. Therapeutic rapport fragile. Night staff to conduct gentle check-in at bedtime. Notify counselor of any AMA statements.', lastContact: '09:30 AM — Sarah Jenkins' },
  { patientId: 'p18', acuity: 'Moderate', vitalsSummary: 'BP 136/88, HR 72, O2 Sat 96%, T 98.1°F.', mood: 6, craving: 2, pendingOrders: ['O2 sat monitoring QD — completed', 'PT gait training session — 2:00 PM today'], flags: ['Fall risk — recent fall incident 7/14', 'Non-slip footwear required at all times'], watchFor: 'Ambulation assistance. Patient is independent but slow-moving. Confirm PT session at 2PM. Granddaughter called — 42 CFR consent confirmed. Can confirm patient is in treatment.', lastContact: '09:00 AM — Michael Boyd, RN' },
  { patientId: 'p4', acuity: 'Stable', vitalsSummary: 'BP 118/76, HR 68, T 98.5°F.', mood: 8, craving: 2, pendingOrders: ['Naltrexone 0800 — given', 'Treatment plan review due 7/21'], flags: ['Legal flag: pretrial diversion — court report due 7/30'], watchFor: 'Excellent engagement today. Completed trauma group. Treatment plan update needed by 7/21 per court requirements. Attorney called — no disclosures without patient authorization (42 CFR signed).', lastContact: '11:00 AM — Maria Gonzales, LCSW' },
];

const CONTROLLED_SUBSTANCES = [
  { med: 'Suboxone 8mg (C-III)', location: 'Med Locker A', countMorning: 14, countCurrent: 11, expectedCurrent: 11, ok: true },
  { med: 'Suboxone 16mg (C-III)', location: 'Med Locker A', countMorning: 8, countCurrent: 7, expectedCurrent: 7, ok: true },
  { med: 'Suboxone 24mg (C-III)', location: 'Med Locker A', countMorning: 5, countCurrent: 4, expectedCurrent: 4, ok: true },
  { med: 'Ativan 0.5mg (C-IV)', location: 'Med Locker B', countMorning: 20, countCurrent: 20, expectedCurrent: 20, ok: true },
  { med: 'Librium 25mg (C-IV)', location: 'Med Locker B', countMorning: 30, countCurrent: 27, expectedCurrent: 27, ok: true },
];

const SHIFT_INCIDENTS = [
  { time: '7:14 AM', type: 'AMA Verbalization', patient: 'Marcus Webb (p1)', summary: 'Patient verbalized intent to leave — counselor notified. Patient agreed to stay per 24hr commitment.', level: 'warning' },
  { time: '9:45 AM', type: 'Vital Sign Alert', patient: 'Maude Calhoun (p13)', summary: 'BP 162/94 — above hold parameter. Dr. Stone notified by phone. Librium held per CIWA protocol.', level: 'warning' },
];

const ACUITY_STYLE: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  High:     'bg-amber-100 text-amber-700 border-amber-200',
  Moderate: 'bg-blue-100 text-blue-700 border-blue-200',
  Stable:   'bg-green-100 text-green-700 border-green-200',
};

const MOOD_COLOR = (n: number) => n >= 7 ? 'text-green-600' : n >= 5 ? 'text-amber-600' : 'text-red-600';
const CRAVING_COLOR = (n: number) => n <= 3 ? 'text-green-600' : n <= 6 ? 'text-amber-600' : 'text-red-600';

export function ShiftHandoff({ navigate }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['p3', 'p9']));
  const [handoffSigned, setHandoffSigned] = useState(false);
  const [tab, setTab] = useState<'Patients' | 'Controlled' | 'Incidents'>('Patients');

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const criticalCount = HANDOFF_NOTES.filter(n => n.acuity === 'Critical').length;
  const highCount = HANDOFF_NOTES.filter(n => n.acuity === 'High').length;
  const pendingOrdersTotal = HANDOFF_NOTES.reduce((a, n) => a + n.pendingOrders.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Shift Handoff Report</h1>
          <p className="text-slate text-sm mt-0.5">Day Shift → Evening Shift · July 19, 2026 · 15:00 Handoff</p>
        </div>
        <div className="flex items-center gap-3">
          {!handoffSigned ? (
            <button onClick={() => setHandoffSigned(true)} className="btn-primary text-sm px-5 py-2">Sign Handoff</button>
          ) : (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Handoff Signed — 15:02
            </div>
          )}
          <button className="border border-border text-slate rounded-lg px-4 py-2 text-sm hover:bg-gray-50">Print Report</button>
        </div>
      </div>

      {/* Shift header */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="text-xs font-semibold text-slate uppercase mb-2">Outgoing Shift (Day 7A–3P)</div>
          <div className="space-y-1">
            {[
              { role: 'Charge Nurse', name: 'Jessica Torres, RN' },
              { role: 'Staff Nurse', name: 'Michael Boyd, RN' },
              { role: 'Clinical Director', name: 'Dr. James Carter' },
              { role: 'BHT Supervisor', name: 'Kevin Wright' },
            ].map(s => (
              <div key={s.role} className="flex items-center gap-2 text-sm">
                <span className="text-slate text-xs w-32 shrink-0">{s.role}:</span>
                <span className="font-medium text-navy">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card bg-amber-50 border-amber-200">
          <div className="text-xs font-semibold text-slate uppercase mb-2">Incoming Shift (Evening 3P–11P)</div>
          <div className="space-y-1">
            {[
              { role: 'Charge Nurse', name: 'Amanda Kirk, RN' },
              { role: 'Staff Nurse', name: 'Travis Nolan, LPN' },
              { role: 'On-Call MD', name: 'Dr. Robert Chen (pager 4421)' },
              { role: 'BHT Staff', name: 'Darnell Hooks' },
            ].map(s => (
              <div key={s.role} className="flex items-center gap-2 text-sm">
                <span className="text-slate text-xs w-32 shrink-0">{s.role}:</span>
                <span className="font-medium text-navy">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Census strip */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Active Census', value: `${MOCK_PATIENTS.length}/22`, sub: '81.8% occupancy', color: 'text-navy' },
          { label: 'Critical Acuity', value: criticalCount, sub: 'Immediate attention', color: 'text-red-600' },
          { label: 'High Acuity', value: highCount, sub: 'Close monitoring', color: 'text-amber-600' },
          { label: 'Pending Orders', value: pendingOrdersTotal, sub: 'Including this shift', color: pendingOrdersTotal > 5 ? 'text-amber-600' : 'text-navy' },
          { label: 'Shift Incidents', value: SHIFT_INCIDENTS.length, sub: 'Documented today', color: SHIFT_INCIDENTS.length > 0 ? 'text-amber-600' : 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="card py-3">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['Patients', 'Controlled', 'Incidents'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Patients' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate">Sorted by acuity — Critical first</span>
            <button onClick={() => setExpanded(new Set(HANDOFF_NOTES.map(n => n.patientId)))} className="text-xs text-orange hover:underline ml-auto">Expand All</button>
            <button onClick={() => setExpanded(new Set())} className="text-xs text-slate hover:underline">Collapse All</button>
          </div>
          {HANDOFF_NOTES
            .sort((a, b) => ['Critical','High','Moderate','Stable'].indexOf(a.acuity) - ['Critical','High','Moderate','Stable'].indexOf(b.acuity))
            .map(note => {
              const p = MOCK_PATIENTS.find(pt => pt.id === note.patientId);
              if (!p) return null;
              const isExpanded = expanded.has(note.patientId);

              return (
                <div key={note.patientId} className={`card p-0 overflow-hidden border ${note.acuity === 'Critical' ? 'border-red-300' : note.acuity === 'High' ? 'border-amber-300' : 'border-border'}`}>
                  <div
                    className={`flex items-center gap-4 px-4 py-3 cursor-pointer ${note.acuity === 'Critical' ? 'bg-red-50' : note.acuity === 'High' ? 'bg-amber-50/40' : 'hover:bg-gray-50'}`}
                    onClick={() => toggle(note.patientId)}
                  >
                    <div className="w-9 h-9 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <button className="font-bold text-navy hover:text-orange text-sm" onClick={e => { e.stopPropagation(); navigate('PatientDetail', p.id); }}>
                          {p.firstName} {p.lastName}
                        </button>
                        <span className="text-xs text-slate">{p.mrn} · {p.program}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${ACUITY_STYLE[note.acuity]}`}>{note.acuity}</span>
                        {note.pendingOrders.length > 0 && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{note.pendingOrders.length} pending</span>
                        )}
                      </div>
                      <div className="flex items-center gap-5 mt-1 text-xs text-slate">
                        <span>{note.vitalsSummary.split('.')[0]}</span>
                        <span>Mood: <strong className={MOOD_COLOR(note.mood)}>{note.mood}/10</strong></span>
                        <span>Craving: <strong className={CRAVING_COLOR(note.craving)}>{note.craving}/10</strong></span>
                        <span className="truncate max-w-[200px] hidden lg:block italic">{note.watchFor.substring(0, 60)}…</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate shrink-0" />}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border px-4 py-4 grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-2 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />Vitals Summary</div>
                        <p className="text-sm text-navy">{note.vitalsSummary}</p>
                        <div className="flex gap-4 mt-2">
                          <div><div className="text-[10px] text-slate">Mood</div><div className={`text-lg font-bold ${MOOD_COLOR(note.mood)}`}>{note.mood}/10</div></div>
                          <div><div className="text-[10px] text-slate">Craving</div><div className={`text-lg font-bold ${CRAVING_COLOR(note.craving)}`}>{note.craving}/10</div></div>
                        </div>
                        <div className="mt-2 text-xs text-slate">Last contact: <span className="font-medium text-navy">{note.lastContact}</span></div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-2 flex items-center gap-1.5"><Pill className="w-3.5 h-3.5" />Pending Actions</div>
                        <div className="space-y-1.5">
                          {note.pendingOrders.map((o, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span className="text-xs text-navy">{o}</span>
                            </div>
                          ))}
                          {note.pendingOrders.length === 0 && <span className="text-xs text-slate italic">No pending actions.</span>}
                        </div>
                        <div className="text-xs font-semibold text-slate uppercase mt-3 mb-2 flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" />Active Flags</div>
                        <div className="space-y-1.5">
                          {note.flags.map((f, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                              <span className="text-xs text-navy">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" />Watch For / Notes to Evening</div>
                        <p className="text-sm text-navy leading-relaxed">{note.watchFor}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {tab === 'Controlled' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>Controlled Substance Count:</strong> Both outgoing and incoming nurses must verify and sign the controlled substance count at shift change. Any discrepancy must be reported to the DON immediately.
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  {['Medication', 'Location', 'AM Count', 'Current Count', 'Expected', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONTROLLED_SUBSTANCES.map((cs, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-navy text-sm">{cs.med}</td>
                    <td className="px-4 py-3 text-xs text-slate">{cs.location}</td>
                    <td className="px-4 py-3 text-xs text-navy font-mono">{cs.countMorning}</td>
                    <td className="px-4 py-3 text-xs text-navy font-mono font-bold">{cs.countCurrent}</td>
                    <td className="px-4 py-3 text-xs text-slate font-mono">{cs.expectedCurrent}</td>
                    <td className="px-4 py-3">
                      {cs.ok ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle className="w-3.5 h-3.5" /> Verified</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-bold"><AlertTriangle className="w-3.5 h-3.5" /> DISCREPANCY</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="card space-y-3">
              <div className="text-sm font-semibold text-navy">Outgoing Nurse Signature</div>
              <div className="border border-border rounded-lg h-16 bg-gray-50 flex items-center justify-center text-xs text-slate">Jessica Torres, RN — 15:00</div>
            </div>
            <div className="card space-y-3">
              <div className="text-sm font-semibold text-navy">Incoming Nurse Signature</div>
              <div className="border border-dashed border-border rounded-lg h-16 bg-gray-50 flex items-center justify-center text-xs text-slate cursor-pointer hover:bg-gray-100">
                Click to sign — Amanda Kirk, RN
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Incidents' && (
        <div className="space-y-4">
          {SHIFT_INCIDENTS.length === 0 ? (
            <div className="card text-center py-8">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-navy font-medium">No incidents this shift</p>
              <p className="text-slate text-sm mt-1">All staff safety checks completed.</p>
            </div>
          ) : (
            SHIFT_INCIDENTS.map((inc, i) => (
              <div key={i} className={`card border ${inc.level === 'critical' ? 'border-red-300 bg-red-50/50' : 'border-amber-300 bg-amber-50/50'}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${inc.level === 'critical' ? 'text-red-600' : 'text-amber-600'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-navy text-sm">{inc.type}</span>
                      <span className="text-xs text-slate">{inc.time}</span>
                      <span className="text-xs bg-white border border-border text-navy px-2 py-0.5 rounded-full">{inc.patient}</span>
                    </div>
                    <p className="text-sm text-navy mt-2">{inc.summary}</p>
                  </div>
                  <button onClick={() => navigate('IncidentReporting')} className="text-xs text-orange hover:underline shrink-0">View Report</button>
                </div>
              </div>
            ))
          )}
          <div className="card">
            <div className="text-sm font-semibold text-navy mb-3">Shift Summary Note</div>
            <textarea
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm min-h-[80px] resize-none"
              defaultValue="Day shift proceeded without major incident. AMA risk patient (Webb) stabilized after counselor intervention. Withdrawal patient (Thornton) being closely monitored — COWS trending up. BP alert (Calhoun) reported to Dr. Stone. Controlled substance count verified at 14:55."
            />
            <div className="flex justify-end mt-3">
              <button className="btn-primary text-sm px-4 py-2">Save Summary</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
