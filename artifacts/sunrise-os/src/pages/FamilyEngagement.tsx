import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { CheckCircle, XCircle, Phone, Mail, Users, Clock, Plus, AlertTriangle, X } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

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
      { name: 'Sheila Webb', relationship: 'Spouse', phone: '(301) 555-0141', email: 'sheila.webb@email.com', consentOnFile: true, hipaaAuth: true, lastContact: '2026-07-14', notes: 'Supportive but fatigued. Expressed "I can\'t keep doing this cycle." Referred to Al-Anon.' },
      { name: 'Darnell Webb', relationship: 'Brother', phone: '(301) 555-0142', consentOnFile: true, hipaaAuth: false, lastContact: '2026-07-10', notes: 'Wants updates but patient has not authorized. Counseled on 42 CFR Part 2 limitations.' },
    ],
    log: [
      { date: '2026-07-14', type: 'Family Session', with: 'Sheila Webb (spouse)', conductedBy: 'Sarah Jenkins, LCPC', summary: 'Communication patterns explored. Spouse expressed fear of relapse after discharge. Codependency education delivered. Next session 7/22.', duration: '50 min' },
      { date: '2026-07-10', type: 'Phone Call', with: 'Sheila Webb (spouse)', conductedBy: 'Sarah Jenkins, LCPC', summary: 'Check-in re: patient progress. Encouraged spouse to attend Al-Anon. Consent on file confirmed.', duration: '12 min' },
    ],
  },
  {
    patientId: 'p2',
    engagementLevel: 'High',
    cfr42Consent: true,
    familyTherapySessions: 4,
    familyTherapyScheduled: '2026-07-24, 3:00 PM',
    members: [
      { name: 'David Choi', relationship: 'Father', phone: '(301) 555-0201', email: 'dchoi@email.com', consentOnFile: true, hipaaAuth: true, lastContact: '2026-07-17', notes: 'Highly engaged. Attending family therapy weekly. Initially struggled with patient\'s eating disorder diagnosis.' },
      { name: 'Lydia Choi', relationship: 'Mother', phone: '(301) 555-0202', email: 'lchoi@email.com', consentOnFile: true, hipaaAuth: true, lastContact: '2026-07-17', notes: 'Empathetic. Working on not enabling through over-accommodation of food restrictions.' },
    ],
    log: [
      { date: '2026-07-17', type: 'Family Session', with: 'David & Lydia Choi (parents)', conductedBy: 'David Odom, LCADC', summary: 'Excellent session. Parents demonstrating healthy boundary-setting. Patient very emotional but grateful. Family dynamics shifting positively.', duration: '60 min' },
      { date: '2026-07-14', type: 'Phone Call', with: 'David Choi (father)', conductedBy: 'David Odom, LCADC', summary: 'Pre-session check-in. Father concerned about patient weight. Reassured re: treatment team monitoring.', duration: '15 min' },
      { date: '2026-07-10', type: 'Family Session', with: 'David & Lydia Choi (parents)', conductedBy: 'David Odom, LCADC', summary: 'Session 3. Discussed enabling behaviors. Both parents receptive. Assigned homework: "sober support" vs. "rescue" distinction.', duration: '55 min' },
    ],
  },
  {
    patientId: 'p3',
    engagementLevel: 'Low',
    cfr42Consent: false,
    familyTherapySessions: 0,
    members: [
      { name: 'Maria Thornton', relationship: 'Mother', phone: '(301) 555-0301', consentOnFile: false, hipaaAuth: false, lastContact: '2026-07-07', notes: 'Patient requested no contact with family. 42 CFR Part 2 consent not signed. No disclosures made.' },
    ],
    log: [
      { date: '2026-07-07', type: 'Phone Call', with: 'Maria Thornton (mother)', conductedBy: 'Sarah Jenkins, LCPC', summary: 'Mother called inquiring about patient. Confirmed admission ONLY (per patient limited disclosure). No clinical information shared.', duration: '5 min' },
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
      { name: 'Jessica Brooks', relationship: 'Mother', phone: '(301) 555-0191', email: 'jbrooks@email.com', consentOnFile: true, hipaaAuth: true, lastContact: '2026-07-15', notes: 'Veteran family member — has attended family support groups. Very supportive of MAT. Asks good questions.' },
      { name: 'Cpl. Ryan Brooks', relationship: 'Brother (active duty)', phone: '(301) 555-0192', consentOnFile: true, hipaaAuth: true, lastContact: '2026-07-12', notes: 'Called from base. Emotionally supportive but limited availability due to deployment.' },
    ],
    log: [
      { date: '2026-07-15', type: 'Phone Call', with: 'Jessica Brooks (mother)', conductedBy: 'Maria Gonzales, LCADC', summary: 'Patient\'s disclosure of overdose history in group discussed. Mother aware of history. Discussed family naloxone education. Mother very engaged.', duration: '20 min' },
      { date: '2026-07-10', type: 'Family Session', with: 'Jessica Brooks (mother)', conductedBy: 'Maria Gonzales, LCADC', summary: 'First family session. Focused on trauma (combat) and substance use connection. Mother tearful but engaged. Plans to attend Al-Anon.', duration: '50 min' },
    ],
  },
  {
    patientId: 'p20',
    engagementLevel: 'Low',
    cfr42Consent: true,
    familyTherapySessions: 0,
    members: [
      { name: 'Rachel Park', relationship: 'Sister', phone: '(301) 555-0201', consentOnFile: true, hipaaAuth: true, lastContact: '2026-07-17', notes: 'Sister is primary support. DV protective order in place from ex-partner. NO contact to be facilitated with ex-partner under any circumstances.' },
    ],
    log: [
      { date: '2026-07-17', type: 'Phone Call', with: 'Rachel Park (sister)', conductedBy: 'Sarah Jenkins, LCPC', summary: 'Confirmed patient\'s new address and safety plan. Sister confirmed willingness to provide transitional support. DV safety protocols reviewed.', duration: '15 min' },
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

export function FamilyEngagement({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Overview' | 'Sessions' | 'Family Education' | 'New Contact' | 'Resources' | 'Outcomes' | 'CRAFT Guide'>('Overview');
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [familySessionOpen, setFamilySessionOpen] = useState(false);
  const [familySessionSaved, setFamilySessionSaved] = useState(false);
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
        <LockedButton locked={readOnly} onClick={() => setTab('New Contact')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Log Contact
        </LockedButton>
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
        {(['Overview', 'Sessions', 'Family Education', 'New Contact', 'Resources', 'Outcomes', 'CRAFT Guide'] as const).map(t => (
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
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-border">
                        <div className="text-2xl mb-2">👨‍👩‍👧</div>
                        <div className="text-sm font-semibold text-navy">No family contact logged yet</div>
                        <div className="text-xs text-slate mt-1">Use "Log New Contact" below to record a call, visit, or letter.</div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <LockedButton locked={readOnly} onClick={() => setTab('New Contact')} className="text-xs border border-orange text-orange px-3 py-1.5 rounded-lg hover:bg-orange/5">Log New Contact</LockedButton>
                      <LockedButton locked={readOnly} onClick={() => setFamilySessionOpen(true)} className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50">Schedule Family Session</LockedButton>
                      {!record.cfr42Consent && (
                        <LockedButton locked={readOnly} onClick={() => { setFamilySessionSaved(true); setTimeout(() => setFamilySessionSaved(false), 2500); }} className="text-xs border border-red-200 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Get 42 CFR Consent
                        </LockedButton>
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

      {tab === 'Family Education' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Education Sessions', value: 8, sub: 'This month', color: 'text-navy' },
              { label: 'Family Members Reached', value: 22, sub: 'Unique participants', color: 'text-blue-600' },
              { label: 'Handouts Distributed', value: 47, sub: 'Multilingual', color: 'text-green-600' },
              { label: 'Avg Satisfaction', value: '4.6/5', sub: 'Post-session survey', color: 'text-orange' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          {[
            {
              title: '📚 Understanding Addiction',
              items: [
                { name: 'Addiction as a Brain Disease — NIDA Fact Sheet', type: 'PDF', pages: 4, audience: 'All families', lang: 'EN / ES' },
                { name: 'How Opioids Work: A Family Guide to OUD', type: 'PDF', pages: 8, audience: 'OUD families', lang: 'EN' },
                { name: 'Alcohol Use Disorder — What Families Should Know', type: 'PDF', pages: 6, audience: 'AUD families', lang: 'EN / ES' },
                { name: 'Co-occurring Mental Health & Addiction (Dual Diagnosis)', type: 'PDF', pages: 5, audience: 'All families', lang: 'EN' },
              ]
            },
            {
              title: '💊 Medication-Assisted Treatment (MAT)',
              items: [
                { name: 'What Is Buprenorphine / Suboxone? A Guide for Loved Ones', type: 'PDF', pages: 3, audience: 'OUD families', lang: 'EN / ES' },
                { name: 'Methadone Maintenance — Myths and Facts', type: 'PDF', pages: 4, audience: 'OUD families', lang: 'EN' },
                { name: 'Vivitrol (Naltrexone) — What to Expect', type: 'PDF', pages: 3, audience: 'OUD / AUD families', lang: 'EN' },
                { name: 'How to Respond to a Suspected Overdose (Naloxone Guide)', type: 'PDF', pages: 2, audience: 'All families', lang: 'EN / ES / KO' },
              ]
            },
            {
              title: '💬 Communication & Boundaries',
              items: [
                { name: 'Setting Healthy Boundaries Without Enabling', type: 'Workshop', pages: null, audience: 'All families', lang: 'EN' },
                { name: 'How to Talk to Your Loved One About Recovery', type: 'PDF', pages: 6, audience: 'All families', lang: 'EN / ES' },
                { name: 'Family Roles in Addiction: Enabler, Hero, Scapegoat, Lost Child', type: 'PDF', pages: 5, audience: 'All families', lang: 'EN' },
                { name: 'Al-Anon & Nar-Anon: Finding Your Own Recovery', type: 'PDF', pages: 3, audience: 'All families', lang: 'EN / ES' },
              ]
            },
            {
              title: '🏠 Supporting Long-Term Recovery at Home',
              items: [
                { name: 'Creating a Recovery-Supportive Home Environment', type: 'PDF', pages: 4, audience: 'All families', lang: 'EN' },
                { name: 'Warning Signs of Relapse — Family Recognition Guide', type: 'PDF', pages: 4, audience: 'All families', lang: 'EN / ES' },
                { name: 'Aftercare & Continuing Treatment: What Happens After Discharge', type: 'PDF', pages: 5, audience: 'All families', lang: 'EN' },
                { name: 'Self-Care for Families in Recovery: Secondary Trauma', type: 'PDF', pages: 4, audience: 'All families', lang: 'EN' },
              ]
            },
          ].map(section => (
            <div key={section.title} className="card p-0 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-border font-semibold text-navy text-sm">{section.title}</div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-border">
                  {section.items.map(item => (
                    <tr key={item.name} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-navy">{item.name}</td>
                      <td className="px-4 py-2.5"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.type === 'Workshop' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{item.type}</span></td>
                      <td className="px-4 py-2.5 text-slate">{item.pages ? `${item.pages} pp` : 'In-person'}</td>
                      <td className="px-4 py-2.5 text-slate">{item.audience}</td>
                      <td className="px-4 py-2.5 text-slate">{item.lang}</td>
                      <td className="px-4 py-2.5">
                        <button className="text-xs text-orange hover:underline font-medium">📄 View / Print</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
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
                <input type="datetime-local" defaultValue="2026-07-22T10:00" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Conducted By</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {['Sarah Jenkins, LCPC', 'David Odom, LCADC', 'Maria Gonzales, LCADC', 'Dr. Allen Hughes'].map(s => <option key={s}>{s}</option>)}
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
              <LockedButton locked={readOnly} onClick={() => setLogSubmitted(true)} className="btn-primary text-sm px-5 py-2">Save Contact Log</LockedButton>
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

      {tab === 'Resources' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Handouts, consent forms, and psychoeducational materials for families of patients in addiction treatment.</div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { cat: 'Understanding Addiction', items: [
                { title: 'What Is Addiction? A Family Guide', type: 'PDF', pages: 8, tags: ['Foundational'] },
                { title: 'The Brain Disease Model — Plain Language', type: 'PDF', pages: 4, tags: ['Foundational'] },
                { title: 'Co-occurring Mental Health Disorders Explained', type: 'PDF', pages: 6, tags: ['Co-occurring'] },
                { title: 'Enabling vs. Supporting: What Families Can Do', type: 'PDF', pages: 5, tags: ['Boundaries'] },
              ]},
              { cat: 'Treatment & Recovery', items: [
                { title: 'What to Expect During Residential Treatment', type: 'PDF', pages: 10, tags: ['Residential'] },
                { title: 'Medication-Assisted Treatment (MAT) for Families', type: 'PDF', pages: 6, tags: ['MAT'] },
                { title: 'Understanding ASAM Levels of Care', type: 'PDF', pages: 4, tags: ['Clinical'] },
                { title: 'Family Roles in the Recovery Journey', type: 'PDF', pages: 7, tags: ['Engagement'] },
                { title: 'Relapse Warning Signs — A Family Checklist', type: 'PDF', pages: 3, tags: ['Prevention'] },
              ]},
              { cat: 'Support & Self-Care', items: [
                { title: 'Al-Anon & Nar-Anon — Meeting Finder and Guide', type: 'PDF', pages: 2, tags: ['Community'] },
                { title: 'CRAFT — Community Reinforcement for Families', type: 'PDF', pages: 12, tags: ['Evidence-Based'] },
                { title: 'Setting Healthy Boundaries Without Guilt', type: 'PDF', pages: 5, tags: ['Boundaries'] },
                { title: 'Talking to Children About a Parent\'s Addiction', type: 'PDF', pages: 6, tags: ['Children'] },
                { title: 'Grief and Loss in Addiction Families', type: 'PDF', pages: 8, tags: ['Mental Health'] },
              ]},
            ].map(section => (
              <div key={section.cat} className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">{section.cat}</h3>
                <div className="space-y-2">
                  {section.items.map(r => (
                    <div key={r.title} className="flex items-start justify-between gap-2 p-2 rounded-lg border border-border hover:bg-gray-50 cursor-pointer">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-navy">{r.title}</div>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {r.tags.map(t => (
                            <span key={t} className="text-[9px] bg-navy/10 text-navy px-1.5 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate shrink-0">{r.pages}pg</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Consent & Authorization Forms</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: '42 CFR Part 2 — Disclosure Authorization (Family)', status: 'Required before family clinical contact', form: 'FE-2024-001' },
                { title: 'Family Visitation Agreement', status: 'Required for all residential visits', form: 'FE-2024-002' },
                { title: 'Family Therapy Consent (Joint Sessions)', status: 'Required before family therapy', form: 'FE-2024-003' },
                { title: 'Emergency Contact & Collateral Release', status: 'Optional — expands contact permissions', form: 'FE-2024-004' },
              ].map(f => (
                <div key={f.title} className="flex items-start justify-between gap-3 p-3 border border-border rounded-lg">
                  <div>
                    <div className="text-xs font-semibold text-navy">{f.title}</div>
                    <div className="text-[10px] text-slate mt-0.5">{f.status}</div>
                    <div className="text-[10px] text-orange mt-0.5 font-mono">{f.form}</div>
                  </div>
                  <button onClick={() => setFamilySessionSaved(true)} className="text-xs text-blue-600 hover:underline shrink-0">Print</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {tab === 'Outcomes' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Family engagement program outcomes — measures impact on patient retention, treatment satisfaction, and 90-day sobriety rates.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Family Sessions Completed', value: 38, color: 'text-navy', sub: 'Trailing 90 days' },
              { label: 'Patient Retention Improvement', value: '+19%', color: 'text-green-600', sub: 'vs. no family engagement' },
              { label: '90-Day Sobriety (Family Involved)', value: '74%', color: 'text-teal-600', sub: 'vs. 51% without family' },
              { label: 'Family Satisfaction Score', value: '4.5/5', color: 'text-blue-600', sub: 'n=31 survey responses' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Family Engagement vs. Patient Outcomes</h3>
              <div className="space-y-3 text-xs">
                {[
                  { outcome: 'Treatment Completion Rate', withFamily: 78, noFamily: 62 },
                  { outcome: '30-Day Sobriety Post-Discharge', withFamily: 81, noFamily: 59 },
                  { outcome: '90-Day Sobriety', withFamily: 74, noFamily: 51 },
                  { outcome: 'AMA Rate', withFamily: 7, noFamily: 18 },
                  { outcome: 'Patient Satisfaction (CSAT ≥4)', withFamily: 93, noFamily: 81 },
                ].map(o => (
                  <div key={o.outcome}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate">{o.outcome}</span>
                      <div className="flex gap-3 text-[10px]">
                        <span className="font-bold text-teal-600">Family: {o.withFamily}%</span>
                        <span className="text-slate">No Family: {o.noFamily}%</span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full">
                      <div className="absolute h-2 rounded-full bg-teal-400 opacity-60" style={{ width: `${o.noFamily}%` }} />
                      <div className="absolute h-2 rounded-full bg-teal-600" style={{ width: `${o.withFamily}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-2">CRAFT Program Effectiveness</h3>
                <div className="text-xs text-slate space-y-2">
                  <div className="border border-border rounded p-2.5">
                    <div className="font-semibold text-navy mb-0.5">Engagement Success Rate</div>
                    <div className="text-slate">CRAFT-trained family members successfully engaged resistant loved ones in treatment at a <strong className="text-teal-600">64%</strong> rate vs. 25% for traditional confrontation (Al-Anon alone).</div>
                  </div>
                  <div className="border border-border rounded p-2.5">
                    <div className="font-semibold text-navy mb-0.5">Family Wellbeing Improvement</div>
                    <div className="text-slate">Family depression scores (PHQ-9) decreased an average of <strong className="text-teal-600">6.2 points</strong> over 8 sessions. Anxiety scores dropped 38% on GAD-7.</div>
                  </div>
                  <div className="border border-border rounded p-2.5">
                    <div className="font-semibold text-navy mb-0.5">Re-engagement Rate</div>
                    <div className="text-slate">Of patients who left AMA, <strong className="text-teal-600">41%</strong> with active family program returned to treatment within 30 days vs. 11% without.</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800">
                <strong>Program Note:</strong> Family engagement is among the highest-ROI interventions in residential SUD treatment. Every 10% increase in family session completion correlates with a measurable improvement in 90-day outcomes based on our trailing 12-month data.
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'CRAFT Guide' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Community Reinforcement and Family Training (CRAFT) — clinician reference guide for the evidence-based family engagement model used at Sunrise Recovery Center.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Evidence Level', value: 'Grade A', color: 'text-green-600', sub: 'Multiple RCTs; NIDA-recommended' },
              { label: 'Treatment Entry Rate', value: '64–74%', color: 'text-teal-600', sub: 'vs. 30% for Al-Anon alone' },
              { label: 'Sessions to Complete CRAFT', value: '12–16', color: 'text-navy', sub: 'Family therapist delivered' },
              { label: 'Families Trained (YTD)', value: 11, color: 'text-blue-600', sub: 'At Sunrise, 2026' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">CRAFT Core Components — Session Map</h3>
              <div className="space-y-2 text-xs">
                {[
                  { sessions: '1–2', topic: 'Motivational foundation & functional analysis', goal: 'Identify triggers, behaviors, and consequences surrounding IP substance use; motivate family engagement' },
                  { sessions: '3–4', topic: 'Communication skills training', goal: 'Teach non-enabling, empathic communication; practice assertive but non-confrontational dialogue' },
                  { sessions: '5–6', topic: 'Natural consequences & enabling behavior reduction', goal: 'Identify family enabling patterns; support allowing natural consequences while maintaining safety' },
                  { sessions: '7–8', topic: 'Positive reinforcement of sobriety-adjacent behavior', goal: 'Identify and reinforce clean/sober behavior in the IP; use CRAFT behavioral principles' },
                  { sessions: '9–10', topic: 'Timing the suggestion to seek treatment', goal: 'Identify windows of opportunity; practice scripting the invitation to enter treatment' },
                  { sessions: '11–12', topic: 'Family self-care and sustainability', goal: 'Address caregiver burnout; build family member\'s own support system; plan for IP treatment engagement' },
                  { sessions: '13–16', topic: 'Ongoing support + treatment entry support', goal: 'Navigate IP intake; support family during early treatment; transition to aftercare family involvement' },
                ].map(s => (
                  <div key={s.sessions} className="border border-border rounded-lg p-2.5">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 font-mono font-bold text-blue-700 text-[10px] mt-0.5">Sess {s.sessions}</span>
                      <div>
                        <div className="font-semibold text-navy">{s.topic}</div>
                        <div className="text-slate mt-0.5">{s.goal}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">CRAFT vs. Other Family Approaches</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-gray-50 text-slate">
                      {['Approach', 'Treatment Entry', 'Family Distress ↓', 'Relationship ↑', 'Evidence'].map(h => (
                        <th key={h} className="text-left px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { approach: 'CRAFT', entry: '64–74%', distress: '✓ Yes', rel: '✓ Yes', ev: 'Grade A (RCT)' },
                      { approach: 'Al-Anon / Nar-Anon', entry: '18–30%', distress: '✓ Yes', rel: '—', ev: 'Grade B' },
                      { approach: 'Johnson Intervention', entry: '30%', distress: 'Mixed', rel: '— (harm risk)', ev: 'Grade C' },
                      { approach: 'Nar-Anon + CRAFT', entry: '~70%', distress: '✓ Yes', rel: '✓ Yes', ev: 'Emerging' },
                    ].map(r => (
                      <tr key={r.approach} className={`hover:bg-gray-50 ${r.approach === 'CRAFT' ? 'bg-green-50/40 font-semibold' : ''}`}>
                        <td className="px-2 py-1.5 text-navy">{r.approach}</td>
                        <td className="px-2 py-1.5 text-green-700 font-bold">{r.entry}</td>
                        <td className="px-2 py-1.5 text-slate">{r.distress}</td>
                        <td className="px-2 py-1.5 text-slate">{r.rel}</td>
                        <td className="px-2 py-1.5 text-slate">{r.ev}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                <strong>Sunrise CRAFT Protocol:</strong> Family therapist-delivered, 12–16 sessions over 3–4 months. Delivered via in-person, telehealth, or hybrid. Families may begin CRAFT prior to patient admission — contact the Family Engagement Coordinator to initiate referral.
              </div>

              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-2">CRAFT Contraindications & Precautions</h3>
                <div className="space-y-1.5 text-xs">
                  {[
                    { flag: 'Domestic Violence', detail: 'If active DV or safety concerns — refer to DV specialist first; CRAFT communication skills must be adapted', color: 'text-red-600' },
                    { flag: 'IP Psychosis / Severe MH', detail: 'Consult with psychiatric provider before proceeding — behavioral analysis may need modification', color: 'text-amber-600' },
                    { flag: 'Family Member Addiction', detail: 'Screen family members for SUD; co-occurring family SUD requires separate treatment', color: 'text-amber-600' },
                    { flag: 'IP Suicidality', detail: 'Coordinate safety planning with clinical team; proceed with caution on natural consequences component', color: 'text-amber-600' },
                  ].map(c => (
                    <div key={c.flag} className="flex gap-2">
                      <span className={`shrink-0 font-bold ${c.color}`}>⚠ {c.flag}:</span>
                      <span className="text-slate">{c.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {familySessionOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setFamilySessionOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[460px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-navy">Schedule Family Session</h2>
              <button onClick={() => setFamilySessionOpen(false)} className="text-slate hover:text-navy"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Devon Price</option><option>Sarah M.</option><option>Marcus R.</option><option>Aiden K.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Session Type</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Family Therapy Session</option><option>Family Education (CRAFT)</option><option>Multifamily Group</option><option>Discharge Planning Conference</option><option>Crisis / Emergency Family Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Date *</label>
                  <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Time</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    {['9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Therapist</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Sarah Jenkins, LCPC</option><option>Maria Gonzales, LCADC</option><option>David Odom, LCADC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Format</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>In-person</option><option>Telehealth (Zoom)</option><option>Phone only</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Family Members Invited</label>
                <input type="text" className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Names and relationship (e.g. Maria Price — mother, James Price — spouse)" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setFamilySessionOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setFamilySessionOpen(false); setFamilySessionSaved(true); setTimeout(() => setFamilySessionSaved(false), 2500); }} className="flex-1 bg-navy text-white rounded-xl py-2.5 text-sm font-semibold">Schedule Session</button>
            </div>
          </div>
        </div>
      )}

      {familySessionSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> Family session scheduled
        </div>
      )}
    </div>
  );
}
