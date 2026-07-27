import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { Heart, Star, Users, MessageSquare, Calendar, CheckCircle, Plus, Award, TrendingUp, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

interface PeerSpecialist {
  id: string;
  name: string;
  credential: string;
  soberDate: string;
  primarySUD: string;
  assignedPatients: string[];
  specialties: string[];
  scheduledHours: number;
  bio: string;
  contactedThisWeek: number;
  engagementScore: number;
}

interface PeerContact {
  id: string;
  peerId: string;
  patientId: string;
  date: string;
  type: 'In-Person' | 'Phone' | 'Group' | 'Outreach';
  duration: number;
  topics: string[];
  outcome: 'Positive' | 'Neutral' | 'Missed' | 'Crisis Referral';
  note: string;
}

const PEER_SPECIALISTS: PeerSpecialist[] = [
  {
    id: 'PS-001', name: 'Marcus Thomas', credential: 'ADT (Certified Peer Recovery Specialist)',
    soberDate: '2018-04-15', primarySUD: 'Opioid Use Disorder',
    assignedPatients: ['p1', 'p5', 'p9', 'p12', 'p16'],
    specialties: ['Veterans', 'Opioid Recovery', 'MAT Support', 'Job Readiness'],
    scheduledHours: 32, contactedThisWeek: 4, engagementScore: 4.7,
    bio: 'Marcus brings 8 years of personal recovery from OUD to his work. Army veteran, he specializes in supporting fellow veterans navigating the VA system alongside addiction recovery. ADT certified 2021. Speaks openly about his experience with Suboxone and reducing stigma around MAT.',
  },
  {
    id: 'PS-002', name: 'Keisha Brown', credential: 'ADT, CPS (Certified Peer Specialist)',
    soberDate: '2020-09-01', primarySUD: 'Alcohol Use Disorder / MDD',
    assignedPatients: ['p3', 'p7', 'p11', 'p15', 'p18'],
    specialties: ['Women\'s Recovery', 'Co-occurring Disorders', 'Trauma-informed Peer Support', 'Family Reunification'],
    scheduledHours: 36, contactedThisWeek: 5, engagementScore: 4.9,
    bio: 'Keisha understands the intersection of mental health and addiction recovery first-hand. After years of struggling with depression and alcohol, she found recovery and made it her mission to help others — especially women — feel seen and not alone. Passionate about breaking cycles of family trauma.',
  },
  {
    id: 'PS-003', name: 'James "Jimmy" Rodriguez', credential: 'ADT',
    soberDate: '2019-11-22', primarySUD: 'Methamphetamine Use Disorder',
    assignedPatients: ['p2', 'p6', 'p10', 'p14', 'p20'],
    specialties: ['Methamphetamine Recovery', 'Re-entry (Justice-involved)', 'LGBTQ+ Affirming Support', 'Spanish-speaking'],
    scheduledHours: 28, contactedThisWeek: 3, engagementScore: 4.4,
    bio: 'Jimmy spent 4 years incarcerated and struggled with meth addiction for a decade before finding recovery. He is passionate about supporting justice-involved individuals navigate re-entry alongside their recovery, and is one of the program\'s Spanish-speaking peer supports.',
  },
];

const PEER_CONTACTS: PeerContact[] = [
  {
    id: 'PC-001', peerId: 'PS-001', patientId: 'p1', date: '2026-07-18', type: 'In-Person', duration: 45,
    topics: ['AMA risk — discussed reasons to stay', 'NA meeting options', 'Suboxone stigma'],
    outcome: 'Positive',
    note: 'Spent time with Marcus during rec hour. He opened up about feeling like a burden to his wife. I shared my own experience with that feeling in early recovery. He seemed to connect — said "maybe I should actually try to stay." Reported to Sarah Jenkins.',
  },
  {
    id: 'PC-002', peerId: 'PS-002', patientId: 'p7', date: '2026-07-18', type: 'In-Person', duration: 30,
    topics: ['Family session prep', 'Letting go of shame around relapse history', 'Kids and recovery'],
    outcome: 'Positive',
    note: 'Patient opened up about fear of judgment from wife. Explored what recovery looks like as a father. Encouraged family session participation — patient agreed to try.',
  },
  {
    id: 'PC-003', peerId: 'PS-001', patientId: 'p5', date: '2026-07-17', type: 'Phone', duration: 20,
    topics: ['Court date anxiety', 'Recovery identity', '12-Step step work'],
    outcome: 'Positive',
    note: 'Called to check in before court date. Patient was stressed but said talking helped. Reminded him of his strengths — he\'s maintained sobriety through real adversity. Encouraged him to call sponsor.',
  },
  {
    id: 'PC-004', peerId: 'PS-003', patientId: 'p10', date: '2026-07-17', type: 'Group', duration: 60,
    topics: ['Peer recovery group — lived experience sharing', 'Hope and possibility', 'Employment in recovery'],
    outcome: 'Positive',
    note: 'Facilitated "Recovery is Possible" peer group — 8 patients attended. Good energy. Patient p10 shared for the first time about their arrest. Room was supportive. Recommend continued peer group attendance.',
  },
  {
    id: 'PC-005', peerId: 'PS-002', patientId: 'p3', date: '2026-07-16', type: 'In-Person', duration: 0,
    topics: ['Scheduled check-in'],
    outcome: 'Missed',
    note: 'Patient did not come to scheduled peer meeting. Roommate said they were sleeping. Noted to primary counselor — patient has been withdrawing from activities.',
  },
];

const CONTACT_OUTCOME_DATA = [
  { week: 'Jun 29', positive: 12, neutral: 3, missed: 2 },
  { week: 'Jul 6',  positive: 14, neutral: 2, missed: 1 },
  { week: 'Jul 13', positive: 11, neutral: 4, missed: 3 },
  { week: 'Jul 19', positive: 12, neutral: 3, missed: 1 },
  { week: 'Jul 20', positive: 13, neutral: 2, missed: 1 },
];

const PEER_GROUPS = [
  { name: 'Recovery is Possible', day: 'Monday / Thursday', time: '7:00 PM', facilitator: 'Jimmy Rodriguez', focus: 'Open peer sharing — lived experience', enrolled: 12 },
  { name: 'Women\'s Peer Circle', day: 'Tuesday', time: '5:30 PM', facilitator: 'Keisha Brown', focus: 'Women in recovery — shame, trauma, identity', enrolled: 7 },
  { name: 'Veterans\' Connection Group', day: 'Wednesday', time: '4:00 PM', facilitator: 'Marcus Thomas', focus: 'Veteran-specific recovery challenges', enrolled: 5 },
  { name: 'Re-entry Readiness', day: 'Friday', time: '2:00 PM', facilitator: 'Jimmy Rodriguez', focus: 'Justice-involved — re-entry skills and peer support', enrolled: 4 },
  { name: 'MAT Support Circle', day: 'Thursday', time: '10:00 AM', facilitator: 'Marcus Thomas', focus: 'Stigma, adherence, and community around MAT', enrolled: 8 },
];

const OUTCOME_COLOR = {
  'Positive': 'bg-green-100 text-green-700',
  'Neutral': 'bg-gray-100 text-gray-600',
  'Missed': 'bg-red-100 text-red-700',
  'Crisis Referral': 'bg-red-200 text-red-800',
};

export function PeerSupport({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Specialists' | 'Contacts' | 'Groups' | 'Outcomes' | 'Training' | 'Impact Stories' | 'ADT Standards'>('Specialists');
  const [selectedPeer, setSelectedPeer] = useState<string>('PS-001');
  const [contactLogOpen, setContactLogOpen] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  const peer = PEER_SPECIALISTS.find(p => p.id === selectedPeer)!;
  const peerContacts = PEER_CONTACTS.filter(c => c.peerId === selectedPeer);

  const totalContactsWeek = PEER_SPECIALISTS.reduce((a, p) => a + p.contactedThisWeek, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Peer Support Program</h1>
          <p className="text-slate text-sm mt-0.5">Certified peer recovery specialists · Lived experience · Recovery community integration</p>
        </div>
        <LockedButton locked={readOnly} onClick={() => setContactLogOpen(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus className="w-4 h-4" />Log Peer Contact</LockedButton>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Peer Specialists', value: PEER_SPECIALISTS.length, sub: 'ADT credentialed', color: 'text-navy' },
          { label: 'Contacts This Week', value: totalContactsWeek, sub: 'Individual + group', color: 'text-navy' },
          { label: 'Peer Groups Running', value: PEER_GROUPS.length, sub: 'Weekly schedule', color: 'text-navy' },
          { label: 'Avg Engagement', value: `${(PEER_SPECIALISTS.reduce((a,p)=>a+p.engagementScore,0)/PEER_SPECIALISTS.length).toFixed(1)}/5`, sub: 'Patient-rated', color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Specialists', 'Contacts', 'Groups', 'Outcomes', 'Training', 'Impact Stories', 'ADT Standards'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Specialists' && (
        <div className="grid grid-cols-3 gap-5">
          {PEER_SPECIALISTS.map(ps => {
            const soberYears = Math.floor((new Date('2026-07-22').getTime() - new Date(ps.soberDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
            return (
              <div key={ps.id} className="card space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange to-navy text-white font-bold text-base flex items-center justify-center">{ps.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                  <div>
                    <div className="font-bold text-navy">{ps.name}</div>
                    <div className="text-xs text-slate">{ps.credential}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <Award className="w-4 h-4 text-green-600" />
                  <div className="text-xs">
                    <span className="font-bold text-green-700">{soberYears} years</span>
                    <span className="text-green-600"> in recovery from {ps.primarySUD.split(' ')[0]}</span>
                  </div>
                </div>
                <p className="text-xs text-navy leading-relaxed">{ps.bio}</p>
                <div>
                  <div className="text-xs font-semibold text-slate mb-1.5">Specialties</div>
                  <div className="flex flex-wrap gap-1">
                    {ps.specialties.map(s => <span key={s} className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 rounded-full">{s}</span>)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center border-t border-border pt-3">
                  <div><div className="text-lg font-bold text-navy">{ps.assignedPatients.length}</div><div className="text-[10px] text-slate">Assigned</div></div>
                  <div><div className="text-lg font-bold text-navy">{ps.contactedThisWeek}</div><div className="text-[10px] text-slate">This Week</div></div>
                  <div><div className="text-lg font-bold text-green-600">{ps.engagementScore}/5</div><div className="text-[10px] text-slate">Engagement</div></div>
                </div>
                <div className="flex gap-2">
                  {ps.assignedPatients.slice(0,5).map(pid => {
                    const pt = MOCK_PATIENTS.find(p => p.id === pid);
                    return pt ? (
                      <button key={pid} onClick={() => navigate('PatientDetail', pid)} title={`${pt.firstName} ${pt.lastName}`}
                        className="w-7 h-7 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center hover:bg-orange transition-colors">
                        {pt.firstName[0]}{pt.lastName[0]}
                      </button>
                    ) : null;
                  })}
                  {ps.assignedPatients.length > 5 && <div className="w-7 h-7 rounded-full bg-gray-200 text-slate text-[10px] font-bold flex items-center justify-center">+{ps.assignedPatients.length - 5}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Contacts' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {PEER_SPECIALISTS.map(ps => (
              <button key={ps.id} onClick={() => setSelectedPeer(ps.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedPeer === ps.id ? 'bg-navy text-white border-navy' : 'border-border text-slate hover:border-navy'}`}>
                {ps.name.split(' ')[0]}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {peerContacts.length === 0 && (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">🤝</div>
                <div className="text-sm font-semibold text-navy">No contacts logged yet</div>
                <div className="text-xs text-slate mt-1">Select a peer specialist above to view their contact log.</div>
              </div>
            )}
            {peerContacts.map(contact => {
              const p = MOCK_PATIENTS.find(pt => pt.id === contact.patientId);
              return (
                <div key={contact.id} className={`card ${contact.outcome === 'Missed' ? 'border-red-200' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${contact.outcome === 'Positive' ? 'bg-green-100' : contact.outcome === 'Missed' ? 'bg-red-100' : 'bg-gray-100'}`}>
                      <Heart className={`w-4 h-4 ${contact.outcome === 'Positive' ? 'text-green-600' : contact.outcome === 'Missed' ? 'text-red-500' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <button className="font-semibold text-navy hover:text-orange text-sm" onClick={() => p && navigate('PatientDetail', p.id)}>{p?.firstName} {p?.lastName}</button>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${OUTCOME_COLOR[contact.outcome]}`}>{contact.outcome}</span>
                        <span className="text-xs text-slate">{contact.type}</span>
                        {contact.duration > 0 && <span className="text-xs text-slate">{contact.duration} min</span>}
                        <span className="text-xs text-slate">{contact.date}</span>
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {contact.topics.map(t => <span key={t} className="text-[10px] bg-navy/10 text-navy px-1.5 py-0.5 rounded">{t}</span>)}
                      </div>
                      <p className="text-xs text-navy mt-2 italic bg-gray-50 px-3 py-2 rounded-lg leading-relaxed">"{contact.note}"</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'Groups' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Peer-led recovery groups — separate from clinical group therapy. No therapeutic note required; peer contact log recommended.</div>
          {PEER_GROUPS.map((group, i) => (
            <div key={i} className="card flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-orange/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-orange" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-navy">{group.name}</div>
                <div className="text-xs text-slate mt-0.5">{group.day} · {group.time} · Facilitator: {group.facilitator}</div>
                <div className="text-xs text-navy mt-1">{group.focus}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-navy">{group.enrolled}</div>
                <div className="text-xs text-slate">enrolled</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Outcomes' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Weekly Contact Outcomes</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CONTACT_OUTCOME_DATA} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="positive" name="Positive" fill="#2ECC71" stackId="a" radius={[0,0,0,0]} />
                <Bar dataKey="neutral" name="Neutral" fill="#95a5a6" stackId="a" />
                <Bar dataKey="missed" name="Missed" fill="#E74C3C" stackId="a" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card space-y-4">
            <h3 className="font-semibold text-navy text-sm">Peer Impact Indicators</h3>
            {[
              { label: 'Patients with peer specialist assigned', value: '15/18', pct: 83 },
              { label: 'Weekly contact rate', value: '87%', pct: 87 },
              { label: 'Patients attending peer groups', value: '11/18', pct: 61 },
              { label: 'Positive outcome contacts', value: '81%', pct: 81 },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1"><span className="text-slate">{s.label}</span><span className="font-bold text-navy">{s.value}</span></div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange rounded-full" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
              <strong>Evidence base:</strong> Patients with peer specialist engagement are 2.3x more likely to complete treatment and 40% less likely to AMA than matched controls (SAMHSA, 2023).
            </div>
          </div>
        </div>
      )}

      {tab === 'Training' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Certified PSS on Staff', value: 4, sub: 'MHFA + ADT certified', color: 'text-navy' },
              { label: 'Training Hours YTD', value: 62, sub: 'Across all peer staff', color: 'text-blue-600' },
              { label: 'Avg Competency Score', value: '88%', sub: 'Post-training assessment', color: 'text-green-600' },
              { label: 'Continuing Ed Due', value: 1, sub: 'Within 30 days', color: 'text-amber-600' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-border font-semibold text-navy text-sm">Peer Support Specialist Training Matrix</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg text-slate">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Specialist</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">ADT</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">MHFA</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Motivational Int.</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Boundaries & Ethics</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Documentation</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Crisis Response</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'Marcus T.', cprs: '✓', mhfa: '✓', mi: '✓', ethics: '✓', docs: '✓', crisis: '✓', hours: 18 },
                  { name: 'Sandra K.', cprs: '✓', mhfa: '✓', mi: '✓', ethics: '✓', docs: '✓', crisis: '✓', hours: 16 },
                  { name: 'Devon R.', cprs: '✓', mhfa: '✓', mi: '○ Due Aug 15', ethics: '✓', docs: '✓', crisis: '✓', hours: 14 },
                  { name: 'Priya M.', cprs: '✓', mhfa: '○ Due Sep 1', mi: '✓', ethics: '✓', docs: '✓', crisis: '○ Scheduled', hours: 14 },
                ].map(r => (
                  <tr key={r.name} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-navy">{r.name}</td>
                    {[r.cprs, r.mhfa, r.mi, r.ethics, r.docs, r.crisis].map((v, i) => (
                      <td key={i} className={`px-3 py-2.5 text-center text-xs ${v === '✓' ? 'text-green-600 font-bold' : 'text-amber-600'}`}>{v}</td>
                    ))}
                    <td className="px-3 py-2.5 text-center font-bold text-navy">{r.hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Upcoming Training Events</h3>
            <div className="space-y-3">
              {[
                { title: 'Motivational Interviewing — Advanced Skills Workshop', date: '2026-08-15', instructor: 'Addiction Counselor Institute (ACI)', audience: 'Devon R.', ceu: '6 CEUs', mode: 'Virtual' },
                { title: 'Mental Health First Aid Recertification (8-hour)', date: '2026-09-01', instructor: 'SAMHSA-sponsored; local trainer', audience: 'Priya M.', ceu: '8 CEUs', mode: 'In-Person' },
                { title: 'Peer Support Crisis Response — De-escalation Module', date: '2026-09-10', instructor: 'James S. Collins III, PhD (internal)', audience: 'All PSS staff', ceu: '3 CEUs', mode: 'In-Person' },
                { title: 'Documentation & Progress Notes for Peer Staff', date: '2026-10-01', instructor: 'Compliance Officer (internal)', audience: 'All PSS staff', ceu: '2 CEUs', mode: 'In-Person' },
              ].map(e => (
                <div key={e.title} className="flex items-center justify-between border border-border rounded-lg px-4 py-3 hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-navy text-sm">{e.title}</div>
                    <div className="text-xs text-slate mt-0.5">{e.date} · {e.instructor} · {e.audience}</div>
                  </div>
                  <div className="flex gap-2 items-center shrink-0">
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded">{e.mode}</span>
                    <span className="text-[10px] bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded">{e.ceu}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {tab === 'Impact Stories' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Anonymized recovery stories from alumni who received peer support services — illustrates program impact and guides peer support strategy.</div>
          <div className="grid grid-cols-2 gap-5">
            {[
              {
                initials: 'M.W.', prog: 'Men\'s Residential → IOP', ps: 'R. Caldwell, ADT', months: 14,
                story: '"I didn\'t trust anyone when I walked in. My peer specialist was the first person in recovery I actually believed. He had the same story — different chapter. I\'m 14 months sober, working again, and my daughter talks to me."',
                outcome: '14 months continuous sobriety, employed, family reconnected',
              },
              {
                initials: 'S.C.', prog: 'Women\'s Residential', ps: 'L. Nguyen, CPS', months: 9,
                story: '"I had been to treatment three times. What was different this time was having a peer who had also relapsed before making it — she didn\'t shame me. She helped me rebuild my relationship with myself."',
                outcome: '9 months sobriety, enrolled in college, sober living graduate',
              },
              {
                initials: 'J.T.', prog: 'PHP Step-down', ps: 'M. Osei, ADT', months: 18,
                story: '"My peer specialist helped me navigate the court system and MAT stigma at work. Nobody else could have done that. He spoke both languages — recovery and the real world."',
                outcome: '18 months sobriety, case dismissed, promoted at job',
              },
              {
                initials: 'D.P.', prog: 'IOP + Alumni', ps: 'R. Caldwell, ADT', months: 7,
                story: '"I almost left AMA twice. Both times, my peer met me at the door. Not to stop me — just to sit with me. That was enough. Seven months later I sponsor two guys in my home group."',
                outcome: '7 months sobriety, active 12-step sponsor, community volunteer',
              },
            ].map(s => (
              <div key={s.initials} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-navy text-white font-bold flex items-center justify-center shrink-0">{s.initials}</div>
                  <div>
                    <div className="text-xs font-semibold text-navy">{s.prog}</div>
                    <div className="text-xs text-slate">Peer Specialist: {s.ps} · {s.months} months post-discharge</div>
                  </div>
                </div>
                <blockquote className="text-xs text-slate italic leading-relaxed border-l-2 border-orange pl-3 mb-3">{s.story}</blockquote>
                <div className="text-[10px] text-teal-700 bg-teal-50 rounded p-2 font-medium">✓ {s.outcome}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'ADT Standards' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Certified Peer Recovery Specialist (ADT) scope of practice, ethics standards, and Maryland certification requirements.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'ADT Certification Body', value: 'TDAMHSAS', color: 'text-navy', sub: 'Maryland state certification' },
              { label: 'CE Required (2yr renewal)', value: '40 hrs', color: 'text-blue-600', sub: '12h ethics required' },
              { label: 'Supervised Hours (initial)', value: '500 hrs', color: 'text-teal-600', sub: 'Under qualified supervisor' },
              { label: 'Recovery Requirement', value: '2 years', color: 'text-green-600', sub: 'Self-identified lived experience' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">ADT Scope of Practice — What ADT Can and Cannot Do</h3>
              <div className="space-y-1.5 text-xs">
                <div className="font-semibold text-green-700 uppercase text-[10px] tracking-wider mb-1">Within Scope</div>
                {[
                  'Share lived experience with recovery to instill hope',
                  'Provide peer mentoring, coaching, and emotional support',
                  'Assist with recovery planning and goal-setting',
                  'Help navigate community resources, meetings, housing',
                  'Provide warm handoffs and accompany to appointments',
                  'Facilitate peer support groups (non-clinical facilitation)',
                  'Advocate for patient needs within the care team',
                  'Provide education about recovery and wellness concepts',
                ].map(s => <div key={s} className="flex gap-1.5"><span className="text-green-500 shrink-0">✓</span><span className="text-navy">{s}</span></div>)}
                <div className="font-semibold text-red-600 uppercase text-[10px] tracking-wider mb-1 mt-3">Outside Scope</div>
                {[
                  'Providing clinical assessment, diagnosis, or treatment planning',
                  'Prescribing or administering medications',
                  'Providing clinical psychotherapy or counseling',
                  'Conducting ASAM or any standardized clinical assessment',
                  'Providing crisis intervention without clinical backup',
                  'Making LOC or discharge decisions',
                ].map(s => <div key={s} className="flex gap-1.5"><span className="text-red-400 shrink-0">✗</span><span className="text-navy">{s}</span></div>)}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">ADT Ethics Standards — Maryland TDAMHSAS</h3>
              <div className="space-y-2 text-xs">
                {[
                  { principle: 'Dignity and Respect', detail: 'Honor the rights, dignity, and self-determination of all individuals. Treat peers without judgment regarding their substance use, mental health, or personal choices.' },
                  { principle: 'Confidentiality', detail: 'Maintain confidentiality of peer information. ADT are bound by HIPAA and 42 CFR Part 2 the same as other staff. Share only on a need-to-know basis.' },
                  { principle: 'Boundaries', detail: 'Maintain appropriate professional boundaries. Do not engage in dual relationships (e.g., employing peers, entering romantic relationships, financial transactions).' },
                  { principle: 'Lived Experience Integrity', detail: 'Share personal recovery narrative authentically and appropriately. Avoid embellishment or fabrication. Protect your own recovery while supporting others.' },
                  { principle: 'Scope of Practice Adherence', detail: 'Operate only within ADT scope. Immediately refer clinical, safety, or medical concerns to the supervising licensed clinician.' },
                  { principle: 'Cultural Humility', detail: 'Recognize and respect cultural, linguistic, and identity diversity. Approach peers with humility and openness rather than making assumptions.' },
                ].map(p => (
                  <div key={p.principle} className="border border-border rounded-lg p-2">
                    <div className="font-semibold text-navy">{p.principle}</div>
                    <div className="text-slate mt-0.5">{p.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {contactLogOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setContactLogOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[480px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2"><Heart className="w-5 h-5 text-rose-500" /> Log Peer Contact</h2>
              <button onClick={() => setContactLogOpen(false)} className="text-slate hover:text-navy"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Peer Specialist *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Marcus Thompson, ADT</option><option>Elena Rodriguez, ADT</option><option>James Carter, ADT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient / Alumni *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Devon Price (Residential)</option><option>Sarah M. (IOP)</option><option>Aiden K. (Alumni — 30 day)</option><option>Marcus R. (IOP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Contact Type</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>1:1 Peer Meeting</option><option>Phone / Text Check-in</option><option>Group Peer Support</option><option>Recovery Event</option><option>Crisis Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Duration (min)</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>15</option><option>30</option><option>45</option><option>60</option><option>90</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Topics / Themes</label>
                <input type="text" className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Cravings, sober living, employment, family reconnection..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Notes (not clinical — peer voice)</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none" placeholder="What did you share from your own experience? What seemed to connect?" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setContactLogOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setContactLogOpen(false); setContactSaved(true); setTimeout(() => setContactSaved(false), 2500); }} className="flex-1 bg-rose-500 text-white rounded-xl py-2.5 text-sm font-semibold">Save Contact</button>
            </div>
          </div>
        </div>
      )}

      {contactSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> Peer contact logged
        </div>
      )}
    </div>
  );
}
