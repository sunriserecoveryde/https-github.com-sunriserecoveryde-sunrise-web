import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { AlertTriangle, AlertCircle, CheckCircle, Clock, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type Severity = 'Critical' | 'High' | 'Moderate' | 'Low';
type IncidentStatus = 'Open' | 'Under Review' | 'Documented' | 'Closed';
type IncidentType = 'AMA Attempt' | 'Elopement' | 'Fall / Injury' | 'Physical Altercation' | 'Medication Error' | 'Self-Harm Ideation' | 'Property Damage' | 'Sexual Misconduct' | 'Medical Emergency' | 'Behavioral Escalation';

interface Incident {
  id: string;
  date: string;
  time: string;
  type: IncidentType;
  severity: Severity;
  patientName: string;
  patientId: string;
  program: string;
  location: string;
  reportedBy: string;
  assignedTo: string;
  status: IncidentStatus;
  summary: string;
  narrative: string;
  immediateActions: string[];
  followUps: { date: string; note: string; by: string; done: boolean }[];
}

const INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-041', date: '2026-07-17', time: '14:22', type: 'AMA Attempt', severity: 'High',
    patientName: 'Devon Price', patientId: 'p17', program: 'Residential', location: 'Common Area / Front Door',
    reportedBy: 'Kevin Wright, BHT', assignedTo: 'David Odom, LMFT', status: 'Under Review',
    summary: 'Client verbalized intent to leave AMA. Escorted back to common area by BHT.',
    narrative: 'At approximately 14:22, client Devon Price was observed by BHT Kevin Wright approaching the front door with his personal bag. Client stated, "I\'m done. I\'m leaving." BHT calmly engaged client using de-escalation techniques. Client agreed to speak with primary counselor David Odom. Safety plan reviewed and updated. Client agreed to remain through the weekend pending housing update from social worker.',
    immediateActions: ['BHT de-escalation initiated', 'Primary counselor notified', 'Physician notified', 'Safety plan reviewed and signed', 'Family/contact NOT notified per 42 CFR Part 2'],
    followUps: [
      { date: '2026-07-18', note: 'David Odom met with client. Housing referral submitted. Client mood improved.', by: 'David Odom, LMFT', done: true },
      { date: '2026-07-19', note: 'Clinical director review required', by: 'James Carter, CD', done: false },
    ],
  },
  {
    id: 'INC-2026-040', date: '2026-07-16', time: '09:45', type: 'Behavioral Escalation', severity: 'Moderate',
    patientName: 'Devon Patel', patientId: 'p9', program: 'Residential', location: 'Group Therapy Room B',
    reportedBy: 'Maria Gonzales, LCSW', assignedTo: 'Dr. Allen Hughes', status: 'Documented',
    summary: 'Client became agitated during group, exhibiting paranoid ideation. Required redirection and removed from group.',
    narrative: 'During morning process group, Devon Patel became increasingly agitated, making statements suggesting another client was "recording him." Therapist Maria Gonzales calmly redirected client, using grounding techniques. Client was escorted from group to private room with BHT. Psych Dr. Hughes notified and conducted same-day evaluation. Medication adjustment (Risperdal 1mg PRN) ordered. Group resumed without further incident.',
    immediateActions: ['Removed from group (non-disruptive manner)', 'BHT escort to cool-down room', 'Dr. Hughes notified', 'Medication PRN administered (Risperdal 0.5mg)', 'Other clients debriefed by co-facilitator'],
    followUps: [
      { date: '2026-07-17', note: 'Dr. Hughes daily check-in. Patient stabilized. Medication adjusted.', by: 'Dr. Allen Hughes', done: true },
      { date: '2026-07-18', note: 'Continued daily psychiatric monitoring ordered.', by: 'Dr. Allen Hughes', done: false },
    ],
  },
  {
    id: 'INC-2026-038', date: '2026-07-14', time: '07:15', type: 'Fall / Injury', severity: 'Moderate',
    patientName: 'Carol Sutton', patientId: 'p18', program: 'Residential', location: 'Hallway — Unit 1',
    reportedBy: 'Michael Boyd, RN', assignedTo: 'Dr. Emily Stone', status: 'Closed',
    summary: 'Client found on floor in hallway at 07:15. Minor bruising to left hip. No fracture confirmed by X-ray.',
    narrative: 'At 07:15, RN Michael Boyd discovered patient Carol Sutton seated on the floor of the Unit 1 hallway near the nursing station. Client stated she "lost her balance" getting up to use the restroom. Client alert and oriented x3. BP 148/88 (elevated from baseline). Left hip bruising noted. No loss of consciousness. Dr. Stone notified. X-ray ordered. No fracture identified. Fall risk assessment upgraded to High. Bed alarm and gait belt protocols initiated.',
    immediateActions: ['Vital signs obtained', 'Dr. Stone notified and on-site within 10 min', 'X-ray ordered and completed', 'Falls risk assessment updated to HIGH', 'PT consult ordered', 'Incident documented per CARF protocol'],
    followUps: [
      { date: '2026-07-14', note: 'X-ray negative for fracture. Pain management with acetaminophen.', by: 'Dr. Emily Stone', done: true },
      { date: '2026-07-15', note: 'PT evaluation completed. Gait training initiated.', by: 'PT Staff', done: true },
      { date: '2026-07-16', note: 'Client ambulating independently with improvement.', by: 'Michael Boyd, RN', done: true },
    ],
  },
  {
    id: 'INC-2026-035', date: '2026-07-10', time: '21:48', type: 'Medication Error', severity: 'Critical',
    patientName: 'Gregory Mills', patientId: 'p13', program: 'PHP', location: 'Nursing Station',
    reportedBy: 'Jessica Torres, RN', assignedTo: 'Dr. Emily Stone', status: 'Closed',
    summary: 'Client received evening Librium dose 2 hours late due to nursing handoff communication error. No adverse outcome.',
    narrative: 'At 21:48, Charge Nurse Jessica Torres identified that Gregory Mills had not received his scheduled 19:30 Librium 25mg taper dose. Nursing handoff notes indicated the dose had been given, but MAR review revealed it was not signed. Client was assessed — no withdrawal symptoms observed (CIWA 4 at time of discovery). Evening dose administered at 21:55. Physician Dr. Stone notified immediately. Client monitored q1h for 4 hours. No adverse outcome. Root cause: handoff communication breakdown between day and evening nursing staff.',
    immediateActions: ['Delayed dose administered immediately', 'Dr. Stone notified', 'CIWA assessment performed (score: 4)', 'Client monitored q1h x4', 'Pharmacy notified', 'QI report filed'],
    followUps: [
      { date: '2026-07-11', note: 'Dr. Stone reviewed. Client stable. No clinical impact.', by: 'Dr. Emily Stone', done: true },
      { date: '2026-07-12', note: 'QI root cause analysis completed. Nursing handoff protocol revised.', by: 'James Carter, CD', done: true },
      { date: '2026-07-17', note: 'Staff education on MAR completion completed. Closed.', by: 'James Carter, CD', done: true },
    ],
  },
  {
    id: 'INC-2026-029', date: '2026-07-02', time: '11:30', type: 'Self-Harm Ideation', severity: 'High',
    patientName: 'Marcus Webb', patientId: 'p1', program: 'Residential', location: 'Individual Therapy Office',
    reportedBy: 'Sarah Jenkins, LPC', assignedTo: 'Dr. Allen Hughes', status: 'Closed',
    summary: 'Client disclosed passive SI during individual session. No plan or intent. Safety contract signed. Psych evaluated same day.',
    narrative: 'During individual therapy session on 07/02, Marcus Webb disclosed passive suicidal ideation ("sometimes I wonder if it would be easier not to be here anymore"). No specific plan, intent, or means identified. Columbia protocol administered (score: 1). Client able to engage safety plan discussion and agreed to safeguards. Dr. Hughes notified and conducted same-day evaluation. No inpatient recommendation. Heightened monitoring protocol initiated (30-minute checks). Client remained engaged in treatment.',
    immediateActions: ['Columbia Protocol administered', 'Dr. Hughes psychiatric evaluation same day', 'Safety plan updated and signed by client', '30-minute observation checks initiated', 'Family notification declined by client per right to privacy'],
    followUps: [
      { date: '2026-07-03', note: 'Client denies SI. Mood improved. Medication review by Dr. Hughes.', by: 'Dr. Allen Hughes', done: true },
      { date: '2026-07-07', note: '30-min checks discontinued per clinical team consensus.', by: 'James Carter, CD', done: true },
    ],
  },
];

const SEV_CONFIG: Record<Severity, { bg: string; text: string; icon: React.ReactNode }> = {
  Critical: { bg: 'bg-red-100', text: 'text-red-700', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  High:     { bg: 'bg-orange-100', text: 'text-orange-700', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  Moderate: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  Low:      { bg: 'bg-gray-100', text: 'text-gray-600', icon: <Clock className="w-3.5 h-3.5" /> },
};
const STATUS_CONFIG: Record<IncidentStatus, string> = {
  'Open':          'bg-red-100 text-red-700',
  'Under Review':  'bg-amber-100 text-amber-700',
  'Documented':    'bg-blue-100 text-blue-700',
  'Closed':        'bg-green-100 text-green-700',
};

export function IncidentReporting({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Active' | 'All Incidents' | 'Analytics' | 'New Incident' | 'Root Cause' | 'QAPI Tracker'>('Active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'All'>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const open = INCIDENTS.filter(i => i.status === 'Open' || i.status === 'Under Review');
  const all = INCIDENTS;

  const filtered = (tab === 'Active' ? open : all).filter(i =>
    (filterSeverity === 'All' || i.severity === filterSeverity) &&
    (filterType === 'All' || i.type === filterType)
  );

  const incidentTypes = Array.from(new Set(INCIDENTS.map(i => i.type)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Incident Reporting</h1>
          <p className="text-slate text-sm mt-0.5">Clinical incident log, documentation, and quality improvement tracking</p>
        </div>
        <LockedButton locked={readOnly} onClick={() => setTab('New Incident')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Incident
        </LockedButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Open Incidents', value: open.filter(i => i.status === 'Open').length, color: 'text-red-600', sub: 'Require immediate action' },
          { label: 'Under Review', value: open.filter(i => i.status === 'Under Review').length, color: 'text-amber-600', sub: 'Pending clinical review' },
          { label: 'This Month', value: INCIDENTS.length, color: 'text-navy', sub: 'Total incidents reported' },
          { label: 'Avg Resolution', value: '3.4d', color: 'text-green-600', sub: 'Time to documented/closed' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['Active', 'All Incidents', 'Analytics', 'New Incident', 'Root Cause', 'QAPI Tracker'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>
            {t} {t === 'Active' && open.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{open.length}</span>}
          </button>
        ))}
      </div>

      {(tab === 'Active' || tab === 'All Incidents') && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as Severity | 'All')} className="border border-border rounded-lg px-3 py-1.5 text-sm">
              <option value="All">All Severities</option>
              {(['Critical', 'High', 'Moderate', 'Low'] as Severity[]).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm">
              <option value="All">All Types</option>
              {incidentTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-xs text-slate ml-auto">{filtered.length} incident{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-3">
            {filtered.map(inc => {
              const sc = SEV_CONFIG[inc.severity];
              const isExpanded = expandedId === inc.id;
              return (
                <div key={inc.id} className="card p-0 overflow-hidden">
                  <div
                    className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : inc.id)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${sc.bg} ${sc.text}`}>
                      {sc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-slate">{inc.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${sc.bg} ${sc.text} border-current/30`}>{inc.severity}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[inc.status]}`}>{inc.status}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{inc.type}</span>
                      </div>
                      <div className="font-semibold text-navy mt-1 text-sm">{inc.summary}</div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate">
                        <span>
                          <button className="text-orange hover:underline font-medium" onClick={e => { e.stopPropagation(); navigate('PatientDetail', inc.patientId); }}>
                            {inc.patientName}
                          </button>
                          {' '} · {inc.program}
                        </span>
                        <span>{inc.date} at {inc.time}</span>
                        <span>{inc.location}</span>
                        <span>Reported by: {inc.reportedBy}</span>
                        <span>Assigned: {inc.assignedTo}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-slate">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-2">Full Narrative</div>
                        <p className="text-sm text-navy leading-relaxed bg-gray-50 rounded-lg p-3 border border-border">{inc.narrative}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-slate uppercase mb-2">Immediate Actions Taken</div>
                          <ul className="space-y-1">
                            {inc.immediateActions.map((a, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-navy">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate uppercase mb-2">Follow-up Actions</div>
                          <ul className="space-y-2">
                            {inc.followUps.map((fu, i) => (
                              <li key={i} className={`text-xs rounded p-2 border ${fu.done ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                                <div className="flex items-center gap-2">
                                  {fu.done ? <CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> : <Clock className="w-3 h-3 text-amber-500 shrink-0" />}
                                  <span className="font-medium text-navy">{fu.date}</span>
                                  <span className="text-slate">· {fu.by}</span>
                                </div>
                                <div className="mt-1 text-navy pl-5">{fu.note}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <LockedButton locked={readOnly} className="text-xs border border-orange text-orange px-3 py-1.5 rounded-lg hover:bg-orange/5">Add Follow-up</LockedButton>
                        <LockedButton locked={readOnly} className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50">Update Status</LockedButton>
                        <button className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50">Print Report</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'New Incident' && !formSubmitted && (
        <div className="max-w-2xl">
          <div className="card space-y-5">
            <div>
              <h2 className="font-bold text-navy">Report New Incident</h2>
              <p className="text-sm text-slate mt-0.5">Complete all required fields. This report will be submitted to the clinical director for review.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Incident Type *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {['AMA Attempt', 'Elopement', 'Fall / Injury', 'Physical Altercation', 'Medication Error', 'Self-Harm Ideation', 'Property Damage', 'Sexual Misconduct', 'Medical Emergency', 'Behavioral Escalation'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Severity *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {(['Critical', 'High', 'Moderate', 'Low'] as Severity[]).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select patient...</option>
                  {MOCK_PATIENTS.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.program}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Date & Time *</label>
                <input type="datetime-local" defaultValue="2026-07-19T10:00" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Location *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {['Common Area', 'Patient Room', 'Group Therapy Room', 'Nursing Station', 'Hallway', 'Cafeteria / Dining', 'Outdoor Area', 'Off-Campus', 'Other'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Reported By *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {['Jessica Torres, RN', 'Michael Boyd, RN', 'Kevin Wright, BHT', 'Sarah Jenkins, LPC', 'David Odom, LMFT', 'Maria Gonzales, LCSW', 'Dr. Robert Chen', 'Dr. Emily Stone', 'Dr. Allen Hughes'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Brief Summary *</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="One-sentence summary of what occurred..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Full Narrative *</label>
              <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[120px] resize-none" placeholder="Describe what happened, who was involved, sequence of events, patient condition at time of incident..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Immediate Actions Taken</label>
              <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none" placeholder="List all actions taken immediately after the incident (one per line)..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Assign To</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                {['James Carter (Clinical Director)', 'Dr. Robert Chen', 'Dr. Emily Stone', 'Dr. Allen Hughes', 'Sarah Jenkins, LPC', 'David Odom, LMFT'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTab('Active')} className="border border-border rounded-lg px-5 py-2 text-sm text-slate hover:bg-gray-50">Cancel</button>
              <LockedButton locked={readOnly} onClick={() => setFormSubmitted(true)} className="btn-primary text-sm px-5 py-2">Submit Incident Report</LockedButton>
            </div>
          </div>
        </div>
      )}

      {tab === 'Analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total This Quarter', value: 14, color: 'text-navy', sub: 'All incident types' },
              { label: 'Critical / High', value: 5, color: 'text-red-600', sub: '36% of total — trending down' },
              { label: 'Avg Days to Close', value: '3.4', color: 'text-green-600', sub: 'Target: ≤5 days' },
              { label: 'Repeat Incidents', value: 2, color: 'text-amber-600', sub: 'Same patient / type pattern' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Incidents by Type</h3>
              <div className="space-y-2.5">
                {[
                  { type: 'Behavioral Escalation', count: 4, color: 'bg-red-500' },
                  { type: 'AMA Attempt',           count: 3, color: 'bg-amber-500' },
                  { type: 'Self-Harm Ideation',    count: 2, color: 'bg-orange-500' },
                  { type: 'Fall / Injury',          count: 2, color: 'bg-blue-500' },
                  { type: 'Medication Error',       count: 1, color: 'bg-purple-500' },
                  { type: 'Elopement',              count: 1, color: 'bg-pink-500' },
                  { type: 'Other',                  count: 1, color: 'bg-slate-400' },
                ].map(row => (
                  <div key={row.type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate">{row.type}</span>
                      <span className="font-bold text-navy">{row.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${(row.count / 4) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Monthly Trend (Last 6 Months)</h3>
              <div className="flex items-end gap-2 h-32 mt-2">
                {[
                  { month: 'Feb', total: 8, critical: 3 },
                  { month: 'Mar', total: 11, critical: 4 },
                  { month: 'Apr', total: 9, critical: 3 },
                  { month: 'May', total: 7, critical: 2 },
                  { month: 'Jun', total: 10, critical: 4 },
                  { month: 'Jul', total: 14, critical: 5 },
                ].map(d => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col gap-0.5 items-center" style={{ height: `${(d.total / 14) * 110}px` }}>
                      <div className="w-full bg-red-200 rounded-t" style={{ height: `${(d.critical / d.total) * 100}%` }} />
                      <div className="w-full bg-blue-200 rounded-b flex-1" />
                    </div>
                    <div className="text-[10px] text-slate">{d.month}</div>
                    <div className="text-[10px] font-bold text-navy">{d.total}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-200 rounded inline-block" />Critical/High</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 rounded inline-block" />Mod/Low</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Root Cause Analysis — Top Patterns</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 pr-4">Pattern / Root Cause</th>
                    <th className="text-left py-2 px-2">Incident Types</th>
                    <th className="text-center py-2 px-2">Freq</th>
                    <th className="text-left py-2 px-2">QI Recommendation</th>
                    <th className="text-center py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { pattern: 'Evening shift coverage gap', types: 'Behavioral, Elopement', freq: 4, rec: 'Add 1 BHT per 10 patients after 8 PM', status: 'In Progress' },
                    { pattern: 'Pre-discharge anxiety spike', types: 'AMA, Self-Harm Ideation', freq: 3, rec: 'Mandate predischarge 1:1 session + safety plan', status: 'Implemented' },
                    { pattern: 'MAT dose timing misalignment', types: 'Medication Error', freq: 2, rec: 'Move morning MAT to 7 AM to match peak cravings', status: 'Under Review' },
                    { pattern: 'New admission adjustment (Days 1–3)', types: 'Behavioral, Fall', freq: 3, rec: 'Buddy system during first 72 hours', status: 'Proposed' },
                  ].map(r => (
                    <tr key={r.pattern}>
                      <td className="py-2.5 pr-4 font-medium text-navy">{r.pattern}</td>
                      <td className="py-2.5 px-2 text-slate">{r.types}</td>
                      <td className="py-2.5 px-2 text-center font-bold text-navy">{r.freq}</td>
                      <td className="py-2.5 px-2 text-slate">{r.rec}</td>
                      <td className="py-2.5 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'Implemented' ? 'bg-green-100 text-green-700' : r.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : r.status === 'Under Review' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-slate'}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'Root Cause' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Root cause analysis (RCA) framework for closed and documented incidents — systematic investigation to prevent recurrence.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Incidents with RCA', value: 3, color: 'text-navy', sub: 'Of 7 closed incidents' },
              { label: 'RCA Pending', value: 2, color: 'text-amber-600', sub: 'Awaiting assignment' },
              { label: 'Corrective Actions Open', value: 4, color: 'text-red-600', sub: 'Across all RCAs' },
              { label: 'Corrective Actions Closed', value: 7, color: 'text-green-600', sub: 'Verified complete' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {[
              {
                incidentId: 'INC-2026-041',
                title: 'Patient Fall — Room 14 (Wet Floor, No Signage)',
                date: '2026-07-08', severity: 'High', assignee: 'Jessica Park, RN', status: 'Completed',
                rootCauses: [
                  { category: 'Environment / Equipment', cause: 'Wet floor not marked during bathroom cleaning — housekeeper departed before signage placed' },
                  { category: 'Process / Protocol', cause: 'Fall prevention hourly rounding form not completed at 0600 — documentation gap on day-shift start' },
                ],
                contributingFactors: ['Short-staffed day shift (1 RN, 2 BHTs covering 22 beds)', 'Patient had benzodiazepine PRN administered 30 min prior'],
                correctiveActions: [
                  { action: 'Mandatory wet floor signage policy update with new signage kits installed in all bathrooms', status: 'Closed', dueDate: '2026-07-15' },
                  { action: 'Hourly rounding documentation audited weekly by charge RN; missed rounds flagged in next-shift handoff', status: 'Closed', dueDate: '2026-07-18' },
                  { action: 'Post-PRN benzodiazepine fall risk protocol — document and increase monitoring for 60 min post-administration', status: 'Open', dueDate: '2026-07-31' },
                ],
              },
              {
                incidentId: 'INC-2026-039',
                title: 'Medication Administration Error — Wrong Dose (Gabapentin)',
                date: '2026-06-29', severity: 'Moderate', assignee: 'Dr. Robert Chen', status: 'Completed',
                rootCauses: [
                  { category: 'Human Factors', cause: 'Nurse drew from mislabeled blister pack — Gabapentin 600mg vs 300mg look-alike packaging' },
                  { category: 'Process / Protocol', cause: 'Five Rights of Medication Administration not completed — dose check skipped due to high-census demand' },
                ],
                contributingFactors: ['Busy evening shift — 3 concurrent medication passes', 'LASA (look-alike, sound-alike) drug packaging not flagged in MAR'],
                correctiveActions: [
                  { action: 'LASA alert stickers applied to all Gabapentin 600mg packages; stored separately from 300mg', status: 'Closed', dueDate: '2026-07-05' },
                  { action: 'MAR updated with visual dose-strength indicator for all LASA medications', status: 'Closed', dueDate: '2026-07-10' },
                  { action: 'Mandatory medication safety refresher for all nursing staff — Five Rights competency check', status: 'Open', dueDate: '2026-08-01' },
                ],
              },
              {
                incidentId: 'INC-2026-033',
                title: 'Patient Elopement — Perimeter Breach (Side Gate)',
                date: '2026-06-14', severity: 'Critical', assignee: 'Clinical Director', status: 'In Progress',
                rootCauses: [
                  { category: 'Facility / Security', cause: 'Side gate latch found defective — gap between latch and frame allowed manual push-through from inside' },
                  { category: 'Supervision', cause: 'Patient was on 30-minute check protocol but was not observed for 45-minute window during BHT break' },
                ],
                contributingFactors: ['Single BHT on overnight shift responsible for 3 units', 'Patient had verbalized elopement ideation 2 days prior — flag not escalated'],
                correctiveActions: [
                  { action: 'All perimeter gates inspected; defective latch on Side Gate C replaced with keypad-controlled magnetic lock', status: 'Closed', dueDate: '2026-06-17' },
                  { action: 'Elopement risk flags in MAR to trigger automatic 15-min check protocol; flag escalation workflow added to handoff form', status: 'Open', dueDate: '2026-07-30' },
                  { action: 'Overnight staffing policy review — minimum 2 BHTs per shift; no solo overnight shift for single unit', status: 'Open', dueDate: '2026-08-15' },
                  { action: 'Tabletop simulation exercise for elopement response conducted with all BHTs and nursing', status: 'Open', dueDate: '2026-08-01' },
                ],
              },
            ].map(rca => (
              <div key={rca.incidentId} className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-gray-50">
                  <span className="font-mono text-xs font-bold text-navy">{rca.incidentId}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${rca.severity === 'Critical' ? 'bg-red-100 text-red-700' : rca.severity === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>{rca.severity}</span>
                  <span className="font-semibold text-navy text-sm flex-1">{rca.title}</span>
                  <span className="text-xs text-slate">{rca.date}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rca.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{rca.status}</span>
                </div>
                <div className="p-5 grid grid-cols-3 gap-5 text-xs">
                  <div>
                    <div className="font-semibold text-navy mb-2">Root Causes Identified</div>
                    <div className="space-y-2">
                      {rca.rootCauses.map(rc => (
                        <div key={rc.category} className="p-2 border border-border rounded-lg">
                          <div className="text-[10px] font-bold text-orange uppercase tracking-wide">{rc.category}</div>
                          <div className="text-slate mt-0.5">{rc.cause}</div>
                        </div>
                      ))}
                    </div>
                    <div className="font-semibold text-navy mb-1 mt-3">Contributing Factors</div>
                    {rca.contributingFactors.map(f => (
                      <div key={f} className="flex items-start gap-1.5 text-slate mb-1"><span className="text-amber-500 shrink-0">•</span>{f}</div>
                    ))}
                  </div>
                  <div className="col-span-2">
                    <div className="font-semibold text-navy mb-2">Corrective Actions</div>
                    <div className="space-y-2">
                      {rca.correctiveActions.map(ca => (
                        <div key={ca.action} className="flex items-start gap-3 p-2 border border-border rounded-lg">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${ca.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{ca.status}</span>
                          <div className="flex-1">
                            <div className="text-slate">{ca.action}</div>
                            <div className="text-[10px] text-slate mt-0.5">Due: {ca.dueDate}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate mt-2">RCA Lead: {rca.assignee}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'New Incident' && formSubmitted && (
        <div className="max-w-2xl">
          <div className="card text-center py-10">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-navy">Incident Reported</h2>
            <p className="text-slate text-sm mt-2">The incident has been submitted and assigned to the clinical director for review. An incident number will be generated within the hour.</p>
            <button onClick={() => { setFormSubmitted(false); setTab('Active'); }} className="btn-primary text-sm px-6 py-2 mt-6">Return to Incidents</button>
          </div>
        </div>
      )}

      {tab === 'QAPI Tracker' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Quality Assurance and Performance Improvement — active QAPI projects, performance indicators, and improvement initiative tracking as required by CARF and ASAM standards.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Active QAPI Projects', value: 4, color: 'text-navy', sub: 'Across 3 departments' },
              { label: 'Indicators Monitored', value: 18, color: 'text-blue-600', sub: 'Monthly cycle' },
              { label: 'Goals Met (Last Cycle)', value: '72%', color: 'text-green-600', sub: '13 of 18 indicators' },
              { label: 'CARF Audit Ready', value: '✓ Yes', color: 'text-teal-600', sub: 'Documentation current' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Active QAPI Projects</h3>
            <div className="space-y-3 text-xs">
              {[
                {
                  project: 'AMA Rate Reduction', owner: 'Clinical Director', dept: 'Clinical', status: 'In Progress', priority: 'High',
                  goal: 'Reduce AMA rate from 14% to ≤8% by Q4 2026', 
                  interventions: 'Enhanced engagement protocols, peer support at Day 3 and Day 7, increased 1:1 counseling frequency',
                  metric: 'AMA rate: currently 11% (↓ from 14% baseline)', pColor: 'bg-red-100 text-red-700'
                },
                {
                  project: 'Documentation Timeliness', owner: 'QI Coordinator', dept: 'Clinical + Nursing', status: 'Monitoring', priority: 'Medium',
                  goal: 'Progress notes completed within 24h for 95% of sessions',
                  interventions: 'Template optimization, peer accountability, daily completion report to supervisors',
                  metric: 'On-time completion: 91% (goal: 95%)', pColor: 'bg-amber-100 text-amber-700'
                },
                {
                  project: 'MAT Engagement at Discharge', owner: 'Medical Director', dept: 'Medical', status: 'Completed', priority: 'High',
                  goal: 'Increase % of OUD patients discharged with MAT plan from 62% to ≥80%',
                  interventions: 'Buprenorphine-first protocol, prescriber education, warm handoff to community OTP',
                  metric: 'Current: 83% — goal exceeded ✓', pColor: 'bg-green-100 text-green-700'
                },
                {
                  project: 'Family Engagement Expansion', owner: 'Family Therapist', dept: 'Clinical', status: 'In Progress', priority: 'Medium',
                  goal: 'Increase family session completion rate from 41% to ≥65% of eligible patients',
                  interventions: 'CRAFT model adoption, expanded virtual family session availability, family liaison role created',
                  metric: 'Current completion: 54% (target: 65%)', pColor: 'bg-blue-100 text-blue-700'
                },
              ].map(p => (
                <div key={p.project} className="border border-border rounded-xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-semibold text-navy">{p.project}</span>
                      <span className="text-slate ml-2">— {p.dept} · Owner: {p.owner}</span>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.pColor}`}>{p.priority}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.status === 'Completed' ? 'bg-green-100 text-green-700' : p.status === 'Monitoring' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><span className="font-semibold text-slate">Goal:</span> <span className="text-navy">{p.goal}</span></div>
                    <div><span className="font-semibold text-slate">Interventions:</span> <span className="text-navy">{p.interventions}</span></div>
                    <div><span className="font-semibold text-slate">Current Metric:</span> <span className={`font-medium ${p.status === 'Completed' ? 'text-green-600' : 'text-navy'}`}>{p.metric}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
