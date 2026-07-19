import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { AlertTriangle, AlertCircle, CheckCircle, Clock, Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

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

export function IncidentReporting({ navigate }: Props) {
  const [tab, setTab] = useState<'Active' | 'All Incidents' | 'New Incident'>('Active');
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
        <button onClick={() => setTab('New Incident')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Incident
        </button>
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
        {(['Active', 'All Incidents', 'New Incident'] as const).map(t => (
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
                        <button className="text-xs border border-orange text-orange px-3 py-1.5 rounded-lg hover:bg-orange/5">Add Follow-up</button>
                        <button className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50">Update Status</button>
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
              <button onClick={() => setFormSubmitted(true)} className="btn-primary text-sm px-5 py-2">Submit Incident Report</button>
            </div>
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
    </div>
  );
}
