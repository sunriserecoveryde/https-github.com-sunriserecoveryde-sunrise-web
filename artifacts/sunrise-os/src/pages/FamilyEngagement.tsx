import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { CheckCircle, XCircle, Phone, Mail, Users, Clock, Plus, AlertTriangle } from 'lucide-react';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

interface FamilyMember {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  consentOnFile: boolean;
  hipaaAuth: boolean;
  lastContact: string;
  notes: string;
}

interface ContactLog {
  date: string;
  type: 'Phone Call' | 'In-Person' | 'Family Session' | 'Email' | 'Text';
  with: string;
  conductedBy: string;
  summary: string;
  duration?: string;
}

interface FamilyRecord {
  patientId: string;
  members: FamilyMember[];
  log: ContactLog[];
  familyTherapySessions: number;
  familyTherapyScheduled?: string;
  engagementLevel: 'High' | 'Moderate' | 'Low' | 'None';
  cfr42Consent: boolean;
}

const FAMILY_DATA: FamilyRecord[] = [
  {
    patientId: 'p1',
    engagementLevel: 'Moderate',
    cfr42Consent: true,
    familyTherapySessions: 2,
    familyTherapyScheduled: '2026-07-22, 4:00 PM',
    members: [
      { name: 'Sheila Webb', relationship: 'Spouse', phone: '(615) 555-0141', email: 'sheila.webb@email.com', consentOnFile: true, hipaaAuth: true, lastContact: '2026-07-14', notes: 'Supportive but fatigued. Expressed "I can\'t keep doing this cycle." Referred to Al-Anon.' },
      { name: 'Darnell Webb', relationship: 'Brother', phone: '(615) 555-0142', consentOnFile: true, hipaaAuth: false, lastContact: '2026-07-10', notes: 'Wants updates but patient has not authorized. Counseled on 42 CFR Part 2 limitations.' },
    ],
    log: [
      { date: '2026-07-14', type: 'Family Session', with: 'Sheila Webb (spouse)', conductedBy: 'Sarah Jenkins, LPC', summary: 'Communication patterns explored. Spouse expressed fear of relapse after discharge. Codependency education delivered. Next session 7/22.', duration: '50 min' },
      { date: '2026-07-10', type: 'Phone Call', with: 'Sheila Webb (spouse)', conductedBy: 'Sarah Jenkins, LPC', summary: 'Check-in re: patient progress. Encouraged spouse to attend Al-Anon. Consent on file confirmed.', duration: '12 min' },
    ],
  },
  {
    patientId: 'p2',
    engagementLevel: 'High',
    cfr42Consent: true,
    familyTherapySessions: 4,
    familyTherapyScheduled: '2026-07-21, 3:00 PM',
    members: [
      { name: 'David Choi', relationship: 'Father', phone: '(615) 555-0201', email: 'dchoi@email.com', consentOnFile: true, hipaaAuth: true, lastContact: '2026-07-17', notes: 'Highly engaged. Attending family therapy weekly. Initially struggled with patient\'s eating disorder diagnosis.' },
      { name: 'Lydia Choi', relationship: 'Mother', phone: '(615) 555-0202', email: 'lchoi@email.com', consentOnFile: true, hipaaAuth: true, lastContact: '2026-07-17', notes: 'Empathetic. Working on not enabling through over-accommodation of food restrictions.' },
    ],
    log: [
      { date: '2026-07-17', type: 'Family Session', with: 'David & Lydia Choi (parents)', conductedBy: 'David Odom, LMFT', summary: 'Excellent session. Parents demonstrating healthy boundary-setting. Patient very emotional but grateful. Family dynamics shifting positively.', duration: '60 min' },
      { date: '2026-07-14', type: 'Phone Call', with: 'David Choi (father)', conductedBy: 'David Odom, LMFT', summary: 'Pre-session check-in. Father concerned about patient weight. Reassured re: treatment team monitoring.', duration: '15 min' },
      { date: '2026-07-10', type: 'Family Session', with: 'David & Lydia Choi (parents)', conductedBy: 'David Odom, LMFT', summary: 'Session 3. Discussed enabling behaviors. Both parents receptive. Assigned homework: "sober support" vs. "rescue" distinction.', duration: '55 min' },
    ],
  },
  {
    patientId: 'p3',
    engagementLevel: 'Low',
    cfr42Consent: false,
    familyTherapySessions: 0,
    members: [
      { name: 'Maria Thornton', relationship: 'Mother', phone: '(615) 555-0301', consentOnFile: false, hipaaAuth: false, lastContact: '2026-07-07', notes: 'Patient requested no contact with family. 42 CFR Part 2 consent not signed. No disclosures made.' },
    ],
    log: [
      { date: '2026-07-07', type: 'Phone Call', with: 'Maria Thornton (mother)', conductedBy: 'Sarah Jenkins, LPC', summary: 'Mother called inquiring about patient. Confirmed admission ONLY (per patient limited disclosure). No clinical information shared.', duration: '5 min' },
    ],
  },
  {
    patientId: 'p17',
    engagementLevel: 'None',
    cfr42Consent: false,
    familyTherapySessions: 0,
    members: [
      { name: 'Unknown', relationship: 'No family contact on file', phone: 'N/A', consentOnFile: false, hipaaAuth: false, lastContact: 'None', notes: 'Patient estranged from family. Emergency contact is case manager at prior shelter.' },
    ],
    log: [],
  },
  {
    patientId: 'p19',
    engagementLevel: 'Moderate',
    cfr42Consent: true,
    familyTherapySessions: 1,
    familyTherapyScheduled: '2026-07-25, 3:00 PM',
    members: [
      { name: 'Jessica Brooks', relationship: 'Mother', phone: '(615) 555-0191', email: 'jbrooks@email.com', consentOnFile: true, hipaaAuth: true, lastContact: '2026-07-15', notes: 'Veteran family member — has attended family support groups. Very supportive of MAT. Asks good questions.' },
      { name: 'Cpl. Ryan Brooks', relationship: 'Brother (active duty)', phone: '(615) 555-0192', consentOnFile: true, hipaaAuth: true, lastContact: '2026-07-12', notes: 'Called from base. Emotionally supportive but limited availability due to deployment.' },
    ],
    log: [
      { date: '2026-07-15', type: 'Phone Call', with: 'Jessica Brooks (mother)', conductedBy: 'Maria Gonzales, LCSW', summary: 'Patient\'s disclosure of overdose history in group discussed. Mother aware of history. Discussed family naloxone education. Mother very engaged.', duration: '20 min' },
      { date: '2026-07-10', type: 'Family Session', with: 'Jessica Brooks (mother)', conductedBy: 'Maria Gonzales, LCSW', summary: 'First family session. Focused on trauma (combat) and substance use connection. Mother tearful but engaged. Plans to attend Al-Anon.', duration: '50 min' },
    ],
  },
  {
    patientId: 'p20',
    engagementLevel: 'Low',
    cfr42Consent: true,
    familyTherapySessions: 0,
    members: [
      { name: 'Rachel Park', relationship: 'Sister', phone: '(615) 555-0201', consentOnFile: true, hipaaAuth: true, lastContact: '2026-07-17', notes: 'Sister is primary support. DV protective order in place from ex-partner. NO contact to be facilitated with ex-partner under any circumstances.' },
    ],
    log: [
      { date: '2026-07-17', type: 'Phone Call', with: 'Rachel Park (sister)', conductedBy: 'Sarah Jenkins, LPC', summary: 'Confirmed patient\'s new address and safety plan. Sister confirmed willingness to provide transitional support. DV safety protocols reviewed.', duration: '15 min' },
    ],
  },
];

const ENGAGEMENT_STYLE: Record<string, string> = {
  High:     'bg-green-100 text-green-700',
  Moderate: 'bg-blue-100 text-blue-700',
  Low:      'bg-amber-100 text-amber-700',
  None:     'bg-gray-100 text-gray-500',
};

const CONTACT_STYLE: Record<string, string> = {
  'Phone Call':    'bg-blue-100 text-blue-700',
  'In-Person':     'bg-green-100 text-green-700',
  'Family Session':'bg-purple-100 text-purple-700',
  'Email':         'bg-gray-100 text-gray-600',
  'Text':          'bg-teal-100 text-teal-700',
};

export function FamilyEngagement({ navigate }: Props) {
  const [tab, setTab] = useState<'Overview' | 'Sessions' | 'New Contact'>('Overview');
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [logSubmitted, setLogSubmitted] = useState(false);

  const totalWithConsent = FAMILY_DATA.filter(r => r.cfr42Consent).length;
  const highEngagement = FAMILY_DATA.filter(r => r.engagementLevel === 'High' || r.engagementLevel === 'Moderate').length;
  const upcomingSessions = FAMILY_DATA.filter(r => r.familyTherapyScheduled).length;

  const allSessions = FAMILY_DATA
    .flatMap(r => r.log
      .filter(l => l.type === 'Family Session')
      .map(l => ({ ...l, patientId: r.patientId, patientName: MOCK_PATIENTS.find(p => p.id === r.patientId)?.firstName + ' ' + MOCK_PATIENTS.find(p => p.id === r.patientId)?.lastName }))
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Family Engagement</h1>
          <p className="text-slate text-sm mt-0.5">Family contact log, consent tracking, and therapy coordination</p>
        </div>
        <button onClick={() => setTab('New Contact')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Log Contact
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Patients w/ Family Contacts', value: FAMILY_DATA.filter(r => r.members[0].name !== 'Unknown').length, sub: `of ${MOCK_PATIENTS.length} census`, color: 'text-navy' },
          { label: '42 CFR Consent on File', value: totalWithConsent, sub: 'Required for disclosure', color: 'text-green-600' },
          { label: 'Active Family Engagement', value: highEngagement, sub: 'High or Moderate', color: 'text-blue-600' },
          { label: 'Sessions This Month', value: FAMILY_DATA.reduce((a, r) => a + r.familyTherapySessions, 0), sub: `${upcomingSessions} upcoming`, color: 'text-navy' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Overview', 'Sessions', 'New Contact'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="space-y-3">
          {FAMILY_DATA.map(record => {
            const p = MOCK_PATIENTS.find(pt => pt.id === record.patientId);
            if (!p) return null;
            const isExpanded = expandedPatient === record.patientId;
            return (
              <div key={record.patientId} className="card p-0 overflow-hidden">
                <div className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedPatient(isExpanded ? null : record.patientId)}>
                  <div className="w-9 h-9 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button className="font-bold text-navy hover:text-orange text-sm" onClick={e => { e.stopPropagation(); navigate('PatientDetail', p.id); }}>
                        {p.firstName} {p.lastName}
                      </button>
                      <span className="text-xs text-slate">{p.mrn} · {p.program}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ENGAGEMENT_STYLE[record.engagementLevel]}`}>{record.engagementLevel} Engagement</span>
                      {record.cfr42Consent
                        ? <span className="text-xs flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3" /> 42 CFR Consent</span>
                        : <span className="text-xs flex items-center gap-1 text-red-500"><XCircle className="w-3 h-3" /> No Consent</span>}
                    </div>
                    <div className="flex items-center gap-5 mt-1 text-xs text-slate">
                      <span>{record.members.length} family contact{record.members.length !== 1 ? 's' : ''}</span>
                      <span>{record.familyTherapySessions} family session{record.familyTherapySessions !== 1 ? 's' : ''}</span>
                      {record.familyTherapyScheduled && <span className="text-orange font-medium">Next: {record.familyTherapyScheduled}</span>}
                    </div>
                  </div>
                  <div className="text-slate">{isExpanded ? '▲' : '▼'}</div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                    {/* Family Members */}
                    <div>
                      <div className="text-xs font-semibold text-slate uppercase mb-2">Family / Support Contacts</div>
                      <div className="space-y-2">
                        {record.members.map((m, i) => (
                          <div key={i} className="p-3 rounded-lg bg-gray-50 border border-border">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-navy text-sm">{m.name}</span>
                                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{m.relationship}</span>
                                  {m.consentOnFile ? <span className="text-[10px] text-green-600 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Consent</span> : <span className="text-[10px] text-red-500 flex items-center gap-0.5"><XCircle className="w-3 h-3" /> No Consent</span>}
                                  {m.hipaaAuth && <span className="text-[10px] text-blue-600">HIPAA Auth</span>}
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs text-slate">
                                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {m.phone}</span>
                                  {m.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {m.email}</span>}
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last contact: {m.lastContact}</span>
                                </div>
                                <div className="text-xs text-slate mt-1.5 italic">{m.notes}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Contact Log */}
                    {record.log.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-2">Contact Log</div>
                        <div className="space-y-2">
                          {record.log.map((l, i) => (
                            <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-white border border-border">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full h-fit font-medium shrink-0 mt-0.5 ${CONTACT_STYLE[l.type]}`}>{l.type}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="font-medium text-navy">{l.date}</span>
                                  <span className="text-slate">with {l.with}</span>
                                  <span className="text-slate">by {l.conductedBy}</span>
                                  {l.duration && <span className="text-slate">{l.duration}</span>}
                                </div>
                                <div className="text-xs text-navy mt-1">{l.summary}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {record.log.length === 0 && (
                      <div className="text-sm text-slate italic p-3 bg-gray-50 rounded-lg border border-border">No family contact logged for this patient.</div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => setTab('New Contact')} className="text-xs border border-orange text-orange px-3 py-1.5 rounded-lg hover:bg-orange/5">Log New Contact</button>
                      <button className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50">Schedule Family Session</button>
                      {!record.cfr42Consent && (
                        <button className="text-xs border border-red-200 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Get 42 CFR Consent
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Sessions' && (
        <div className="space-y-4">
          <div className="font-semibold text-navy text-sm">Upcoming Family Sessions</div>
          {FAMILY_DATA.filter(r => r.familyTherapyScheduled).map(r => {
            const p = MOCK_PATIENTS.find(pt => pt.id === r.patientId);
            return (
              <div key={r.patientId} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center">{p?.firstName[0]}{p?.lastName[0]}</div>
                  <div>
                    <div className="font-semibold text-navy text-sm cursor-pointer hover:text-orange" onClick={() => navigate('PatientDetail', r.patientId)}>{p?.firstName} {p?.lastName}</div>
                    <div className="text-xs text-slate">{r.familyTherapyScheduled}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Family Session</span>
                  <button className="text-xs text-orange hover:underline">Manage</button>
                </div>
              </div>
            );
          })}

          <div className="font-semibold text-navy text-sm mt-6">Recent Family Sessions</div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  {['Date', 'Patient', 'With', 'Therapist', 'Duration', 'Summary'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allSessions.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-slate">{s.date}</td>
                    <td className="px-4 py-3 text-xs font-medium text-navy cursor-pointer hover:text-orange" onClick={() => navigate('PatientDetail', s.patientId)}>{s.patientName}</td>
                    <td className="px-4 py-3 text-xs text-slate">{s.with}</td>
                    <td className="px-4 py-3 text-xs text-slate">{s.conductedBy}</td>
                    <td className="px-4 py-3 text-xs text-slate">{s.duration ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate max-w-[200px] truncate">{s.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'New Contact' && !logSubmitted && (
        <div className="max-w-2xl">
          <div className="card space-y-4">
            <div>
              <h2 className="font-bold text-navy">Log Family Contact</h2>
              <p className="text-sm text-slate mt-0.5">Document a call, visit, or family therapy session.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {MOCK_PATIENTS.map(p => <option key={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Contact Type *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {['Phone Call', 'Family Session', 'In-Person', 'Email', 'Text'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Family Member / Contact</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Name and relationship..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Date & Time</label>
                <input type="datetime-local" defaultValue="2026-07-19T10:00" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Conducted By</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {['Sarah Jenkins, LPC', 'David Odom, LMFT', 'Maria Gonzales, LCSW', 'Dr. Allen Hughes'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Duration</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 30 min" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Session Summary *</label>
              <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[100px] resize-none" placeholder="Document what was discussed, clinical observations, next steps..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">42 CFR Part 2 Compliance</label>
              <div className="space-y-2">
                {['Patient signed 42 CFR Part 2 consent prior to this contact', 'No sensitive SUD treatment information was disclosed without consent', 'Contact was limited to confirming enrollment status only (no 42 CFR required)'].map(item => (
                  <label key={item} className="flex items-center gap-3 text-sm cursor-pointer">
                    <input type="checkbox" className="accent-orange w-4 h-4" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTab('Overview')} className="border border-border rounded-lg px-5 py-2 text-sm text-slate">Cancel</button>
              <button onClick={() => setLogSubmitted(true)} className="btn-primary text-sm px-5 py-2">Save Contact Log</button>
            </div>
          </div>
        </div>
      )}
      {tab === 'New Contact' && logSubmitted && (
        <div className="max-w-md">
          <div className="card text-center py-10">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-navy">Contact Logged</h2>
            <p className="text-slate text-sm mt-2">The family contact has been documented in the patient's record.</p>
            <button onClick={() => { setLogSubmitted(false); setTab('Overview'); }} className="btn-primary text-sm px-6 py-2 mt-5">Back to Family Engagement</button>
          </div>
        </div>
      )}
    </div>
  );
}
