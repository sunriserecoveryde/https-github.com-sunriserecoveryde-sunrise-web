import React, { useState } from 'react';
import { Screen } from '../App';
import { Clock, CheckCircle, Phone, Plus, AlertTriangle, ArrowRight, Users, TrendingDown, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

type WaitlistStatus = 'Active' | 'Offered — Pending Response' | 'Admitted' | 'Withdrew' | 'Declined Offer' | 'No Longer Needs' | 'Unresponsive';
type LOC = 'Residential' | 'PHP' | 'IOP' | 'OP';
type Priority = 'P1 — Urgent' | 'P2 — High' | 'P3 — Routine';

interface WaitlistEntry {
  id: string;
  name: string;
  dob: string;
  phone: string;
  referralSource: string;
  primaryDx: string;
  requestedLOC: LOC;
  priority: Priority;
  addedDate: string;
  daysWaiting: number;
  status: WaitlistStatus;
  insuranceVerified: boolean;
  payer: string;
  lastContactDate: string;
  lastContactOutcome: string;
  notes: string;
  assignedTo: string;
  preferredAdmitDate?: string;
}

const WAITLIST: WaitlistEntry[] = [
  {
    id: 'WL-001', name: 'Patricia Reynolds', dob: '1982-04-12', phone: '(615) 555-9071',
    referralSource: 'Vanderbilt Psychiatric Emergency — direct referral', primaryDx: 'Opioid Use Disorder, Severe / PTSD',
    requestedLOC: 'Residential', priority: 'P1 — Urgent',
    addedDate: '2026-07-17', daysWaiting: 2, status: 'Active',
    insuranceVerified: true, payer: 'BlueCross BlueShield of TN (auth pending)',
    lastContactDate: '2026-07-18', lastContactOutcome: 'Spoke with patient — motivated, in withdrawal, staying with sister. Wants bed ASAP.',
    notes: 'Referred by Dr. Linda Strauss at Vanderbilt Psych ED. Fentanyl OUD, last use 7/16. CIWA score estimated at 14 at ED. Insurance auth submitted — expecting decision in 24 hours. P1 — offer next available residential bed.',
    assignedTo: 'Sarah Jenkins, LPC', preferredAdmitDate: '2026-07-20',
  },
  {
    id: 'WL-002', name: 'Anthony Barnes', dob: '1990-08-30', phone: '(615) 555-4412',
    referralSource: 'Self-referral — saw radio ad', primaryDx: 'Alcohol Use Disorder, Severe',
    requestedLOC: 'Residential', priority: 'P2 — High',
    addedDate: '2026-07-14', daysWaiting: 5, status: 'Active',
    insuranceVerified: true, payer: 'Cigna (OON benefits — 60% after deductible)',
    lastContactDate: '2026-07-18', lastContactOutcome: 'Confirmed still interested. Working with HR on medical leave.',
    notes: 'Employed software engineer. Currently drinking 10-12 drinks/day, attempting to taper. Liver enzymes elevated (self-reported). Needs residential for medical monitoring during detox.',
    assignedTo: 'Maria Gonzalez, LSW',
  },
  {
    id: 'WL-003', name: 'Michelle Thompson', dob: '1975-11-22', phone: '(615) 555-7834',
    referralSource: 'Physician referral — Dr. Sarah Kim, Cool Springs Family Medicine',
    primaryDx: 'Alcohol Use Disorder, Moderate / MDD',
    requestedLOC: 'PHP', priority: 'P2 — High',
    addedDate: '2026-07-13', daysWaiting: 6, status: 'Offered — Pending Response',
    insuranceVerified: true, payer: 'United HealthCare (in-network)',
    lastContactDate: '2026-07-19', lastContactOutcome: 'Left voicemail about PHP opening — awaiting callback.',
    notes: 'PHP bed available 7/21. Offer made by phone 7/19 — patient requested 24 hours to discuss with family. Follow up 7/20 morning.',
    assignedTo: 'David Odom, LMFT', preferredAdmitDate: '2026-07-21',
  },
  {
    id: 'WL-004', name: 'James Worthington III', dob: '1965-02-08', phone: '(615) 555-3310',
    referralSource: 'Tennessee Bar Association LAP referral',
    primaryDx: 'Alcohol Use Disorder, Severe',
    requestedLOC: 'Residential', priority: 'P1 — Urgent',
    addedDate: '2026-07-16', daysWaiting: 3, status: 'Active',
    insuranceVerified: false, payer: 'Aetna (verification in progress)',
    lastContactDate: '2026-07-18', lastContactOutcome: 'Spoke with attorney — patient in court proceedings. Needs admission before 7/22 hearing.',
    notes: 'Attorney client — BAC of 0.31 at arrest. Court ordered treatment as diversion condition. Must admit before 7/22 hearing or faces incarceration. LAP case manager: Marcus Hall (615-555-2002). Insurance verification urgent.',
    assignedTo: 'Sarah Jenkins, LPC',
  },
  {
    id: 'WL-005', name: 'Destiny Williams', dob: '1998-06-14', phone: '(615) 555-8821',
    referralSource: 'Recovery coach outreach — Nashville Room in the Inn',
    primaryDx: 'Opioid Use Disorder, Severe / Homelessness',
    requestedLOC: 'Residential', priority: 'P1 — Urgent',
    addedDate: '2026-07-15', daysWaiting: 4, status: 'Active',
    insuranceVerified: true, payer: 'TennCare / BlueCare (authorized)',
    lastContactDate: '2026-07-18', lastContactOutcome: 'Spoke via Nashville Room in the Inn staff — patient eager for help. Transportation needed.',
    notes: 'TennCare auth approved — 21 days residential covered. Transportation barrier: no car, currently sheltered. Will arrange transport on admission day. 26-year-old with 4-year fentanyl history. High priority given housing instability and OD risk.',
    assignedTo: 'Maria Gonzalez, LSW', preferredAdmitDate: '2026-07-21',
  },
  {
    id: 'WL-006', name: 'Kevin Ostrowski', dob: '1987-09-01', phone: '(615) 555-6641',
    referralSource: 'Employer EAP — Vanderbilt University HR',
    primaryDx: 'Alcohol Use Disorder, Moderate',
    requestedLOC: 'IOP', priority: 'P3 — Routine',
    addedDate: '2026-07-10', daysWaiting: 9, status: 'Active',
    insuranceVerified: true, payer: 'Vanderbilt Faculty Benefits (BCBS)',
    lastContactDate: '2026-07-17', lastContactOutcome: 'Confirmed IOP schedule preferences — evenings preferred.',
    notes: 'Faculty member. Functional drinker — employer-mandated evaluation after incident. Prefers evening IOP to maintain work schedule. FMLA paperwork in progress with HR.',
    assignedTo: 'David Odom, LMFT',
  },
  {
    id: 'WL-007', name: 'Sandra Nguyen', dob: '1972-03-28', phone: '(615) 555-2234',
    referralSource: 'Family referral — husband called',
    primaryDx: 'Stimulant Use Disorder (Methamphetamine), Severe',
    requestedLOC: 'Residential', priority: 'P2 — High',
    addedDate: '2026-07-11', daysWaiting: 8, status: 'Active',
    insuranceVerified: false, payer: 'Self-pay (sliding fee application pending)',
    lastContactDate: '2026-07-16', lastContactOutcome: 'Spoke with husband — patient not yet willing to engage. Family meeting recommended.',
    notes: 'Husband reached out. Patient currently using daily and not fully motivated. Will need motivational outreach call from peer specialist before formal intake. Sliding fee application submitted by husband.',
    assignedTo: 'Maria Gonzalez, LSW',
  },
  {
    id: 'WL-008', name: 'Robert Greenfield', dob: '1955-10-15', phone: '(615) 555-0093',
    referralSource: 'Primary care physician — Dr. James Park',
    primaryDx: 'Opioid Use Disorder, Moderate (Rx opioids)',
    requestedLOC: 'IOP', priority: 'P3 — Routine',
    addedDate: '2026-07-08', daysWaiting: 11, status: 'Offered — Pending Response',
    insuranceVerified: true, payer: 'Medicare + Medigap Plan G',
    lastContactDate: '2026-07-19', lastContactOutcome: 'Offer made for IOP starting 7/22. Considering — will call back today.',
    notes: '71-year-old retired physician. Chronic pain + opioid dependence on Oxycodone 120mg/day (prescribed). Very motivated — embarrassed by situation. Dr. Park providing co-management. Medicare approved.',
    assignedTo: 'David Odom, LMFT', preferredAdmitDate: '2026-07-22',
  },
];

const PRIORITY_STYLE: Record<Priority, string> = {
  'P1 — Urgent': 'bg-red-100 text-red-700 border-red-200',
  'P2 — High':   'bg-amber-100 text-amber-700 border-amber-200',
  'P3 — Routine':'bg-blue-100 text-blue-700 border-blue-200',
};

const STATUS_STYLE: Record<WaitlistStatus, string> = {
  'Active':                    'bg-green-100 text-green-700',
  'Offered — Pending Response':'bg-amber-100 text-amber-700',
  'Admitted':                  'bg-blue-100 text-blue-700',
  'Withdrew':                  'bg-gray-100 text-gray-500',
  'Declined Offer':            'bg-gray-100 text-gray-500',
  'No Longer Needs':           'bg-gray-100 text-gray-500',
  'Unresponsive':              'bg-red-100 text-red-700',
};

const LOC_STYLE: Record<LOC, string> = {
  'Residential': 'bg-navy/10 text-navy',
  'PHP':         'bg-purple-100 text-purple-700',
  'IOP':         'bg-teal-100 text-teal-700',
  'OP':          'bg-green-100 text-green-700',
};

const WAITTIME_DATA = [
  { loc: 'Residential', avg: 4.2, target: 3 },
  { loc: 'PHP', avg: 2.8, target: 2 },
  { loc: 'IOP', avg: 6.1, target: 5 },
  { loc: 'OP', avg: 1.9, target: 2 },
];

export function WaitlistManager({ navigate: _navigate }: Props) {
  const [tab, setTab] = useState<'Active' | 'Analytics' | 'Add'>('Active');
  const [filterLOC, setFilterLOC] = useState<LOC | 'All'>('All');
  const [filterPriority, setFilterPriority] = useState<Priority | 'All'>('All');
  const [expandedEntry, setExpandedEntry] = useState<string | null>('WL-001');
  const [showAddModal, setShowAddModal] = useState(false);

  const activeEntries = WAITLIST.filter(w => w.status === 'Active' || w.status === 'Offered — Pending Response');
  const filtered = activeEntries.filter(w =>
    (filterLOC === 'All' || w.requestedLOC === filterLOC) &&
    (filterPriority === 'All' || w.priority === filterPriority)
  ).sort((a, b) => {
    const pOrder = ['P1 — Urgent', 'P2 — High', 'P3 — Routine'];
    return pOrder.indexOf(a.priority) - pOrder.indexOf(b.priority) || b.daysWaiting - a.daysWaiting;
  });

  const p1Count = activeEntries.filter(w => w.priority === 'P1 — Urgent').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Waitlist Manager</h1>
          <p className="text-slate text-sm mt-0.5">Pre-admission waitlist · Priority triage · Bed offer tracking</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus className="w-4 h-4" />Add to Waitlist</button>
      </div>

      {p1Count > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-red-800">{p1Count} P1 Urgent Patient{p1Count > 1 ? 's' : ''} Waiting</div>
            <div className="text-sm text-red-700">
              {activeEntries.filter(w => w.priority === 'P1 — Urgent').map(w => `${w.name} (${w.requestedLOC}, ${w.daysWaiting}d)`).join(' · ')}
            </div>
            <div className="text-xs text-red-600 mt-1">P1 patients should receive a bed offer within 24 hours of an opening. Review census for discharge candidates.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Waitlist', value: activeEntries.length, sub: 'Awaiting admission', color: 'text-navy' },
          { label: 'P1 Urgent', value: p1Count, sub: 'Offer within 24h', color: p1Count > 0 ? 'text-red-600' : 'text-green-600' },
          { label: 'Offer Pending', value: activeEntries.filter(w => w.status === 'Offered — Pending Response').length, sub: 'Awaiting response', color: 'text-amber-600' },
          { label: 'Avg Wait (Residential)', value: `${WAITTIME_DATA[0].avg}d`, sub: `Target: ${WAITTIME_DATA[0].target} days`, color: WAITTIME_DATA[0].avg > WAITTIME_DATA[0].target ? 'text-amber-600' : 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Active', 'Analytics', 'Add'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Active' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(['All', 'Residential', 'PHP', 'IOP', 'OP'] as const).map(l => (
              <button key={l} onClick={() => setFilterLOC(l as LOC | 'All')}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterLOC === l ? 'bg-navy text-white border-navy' : 'border-border text-slate hover:border-navy'}`}>{l}</button>
            ))}
            <div className="w-px bg-border mx-1" />
            {(['All', 'P1 — Urgent', 'P2 — High', 'P3 — Routine'] as const).map(p => (
              <button key={p} onClick={() => setFilterPriority(p as Priority | 'All')}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterPriority === p ? 'bg-navy text-white border-navy' : 'border-border text-slate hover:border-navy'}`}>{p}</button>
            ))}
          </div>

          {filtered.map(entry => {
            const isExpanded = expandedEntry === entry.id;
            return (
              <div key={entry.id} className={`border rounded-xl overflow-hidden ${entry.priority === 'P1 — Urgent' ? 'border-red-300' : entry.status === 'Offered — Pending Response' ? 'border-amber-300' : 'border-border'}`}>
                <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}>
                  <div className="text-center w-10 shrink-0">
                    <div className={`text-xl font-bold ${entry.daysWaiting > 7 ? 'text-red-600' : entry.daysWaiting > 3 ? 'text-amber-600' : 'text-navy'}`}>{entry.daysWaiting}</div>
                    <div className="text-[10px] text-slate">days</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-navy">{entry.name}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${PRIORITY_STYLE[entry.priority]}`}>{entry.priority}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${LOC_STYLE[entry.requestedLOC]}`}>{entry.requestedLOC}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[entry.status]}`}>{entry.status}</span>
                      {!entry.insuranceVerified && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Insurance Unverified</span>}
                    </div>
                    <div className="text-xs text-slate mt-0.5">{entry.primaryDx} · {entry.referralSource.split('—')[0].trim()} · Assigned: {entry.assignedTo}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <ArrowRight className="w-3 h-3" /> Offer Bed
                    </button>
                    <button className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Phone className="w-3 h-3" /> Log Contact
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 bg-white grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-xs font-semibold text-slate uppercase mb-2">Contact Info</div>
                      <div className="space-y-1 text-xs">
                        <div><span className="text-slate">Phone:</span> <span className="font-semibold text-navy ml-1">{entry.phone}</span></div>
                        <div><span className="text-slate">DOB:</span> <span className="font-semibold text-navy ml-1">{entry.dob}</span></div>
                        <div><span className="text-slate">Payer:</span> <span className="font-semibold text-navy ml-1">{entry.payer}</span></div>
                        {entry.preferredAdmitDate && <div><span className="text-slate">Preferred admit:</span> <span className="font-semibold text-navy ml-1">{entry.preferredAdmitDate}</span></div>}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate uppercase mb-2">Last Contact</div>
                      <div className="text-xs text-slate mb-1">{entry.lastContactDate}</div>
                      <p className="text-xs text-navy leading-relaxed">{entry.lastContactOutcome}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate uppercase mb-2">Clinical Notes</div>
                      <p className="text-xs text-navy leading-relaxed">{entry.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Analytics' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-0.5">Average Days Waiting by LOC</h3>
            <p className="text-xs text-slate mb-3">vs. target wait time</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WAITTIME_DATA} margin={{ left: -15, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="loc" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="d" />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => `${v} days`} />
                <Bar dataKey="avg" name="Avg Wait" fill="#1B2F5E" radius={[3,3,0,0]} />
                <Bar dataKey="target" name="Target" fill="#2ECC71" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card space-y-4">
            <h3 className="font-semibold text-navy text-sm">Conversion Funnel (Last 30 Days)</h3>
            {[
              { label: 'Inquiries Received', value: 42, color: 'bg-navy' },
              { label: 'Screened / Qualified', value: 31, pct: 74, color: 'bg-blue-500' },
              { label: 'Insurance Verified', value: 24, pct: 57, color: 'bg-orange' },
              { label: 'Added to Waitlist', value: 19, pct: 45, color: 'bg-amber-500' },
              { label: 'Admitted', value: 15, pct: 36, color: 'bg-green-500' },
            ].map((step, i) => (
              <div key={step.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate">{step.label}</span>
                  <span className="font-bold text-navy">{step.value}{step.pct ? ` (${step.pct}%)` : ''}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${step.color} rounded-full`} style={{ width: `${step.pct || 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Add' && (
        <div className="max-w-2xl card space-y-4">
          <h3 className="font-semibold text-navy">Add Patient to Waitlist</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate mb-1">First Name *</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate mb-1">Last Name *</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate mb-1">Phone *</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="(615) 555-xxxx" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate mb-1">Date of Birth</label>
              <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate mb-1">Requested LOC *</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                {['Residential', 'PHP', 'IOP', 'OP'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate mb-1">Priority *</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                {['P1 — Urgent', 'P2 — High', 'P3 — Routine'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate mb-1">Primary Diagnosis / Presenting Concerns</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Opioid Use Disorder, Severe" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate mb-1">Referral Source</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Self-referral, Physician name, ED, etc." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate mb-1">Payer / Insurance</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Insurance carrier and member ID" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate mb-1">Notes</label>
              <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none" />
            </div>
          </div>
          <button className="btn-primary text-sm px-5 py-2">Add to Waitlist</button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center" onClick={e => e.stopPropagation()}>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-bold text-navy text-lg">Patient Added to Waitlist</h3>
            <p className="text-slate text-sm mt-1 mb-4">The patient has been added to the waitlist. A referral coordinator has been notified.</p>
            <button onClick={() => { setShowAddModal(false); setTab('Active'); }} className="btn-primary text-sm px-6 py-2">View Waitlist</button>
          </div>
        </div>
      )}
    </div>
  );
}
