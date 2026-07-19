import React, { useState } from 'react';
import { Screen } from '../App';

import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

interface BDContact {
  id: string;
  name: string;
  organization: string;
  type: 'Hospital / ER' | 'Detox' | 'Private Practice' | 'Drug Court' | 'Corporate EAP' | 'Faith Community' | 'Sober Living' | 'Primary Care';
  relationship: 'Strong' | 'Developing' | 'Cold' | 'New';
  lastContact: string;
  nextFollowUp: string;
  referralsLTD: number;
  referrals30d: number;
  admissions30d: number;
  owner: string;
  notes: string;
}

interface OutreachActivity {
  id: string;
  date: string;
  type: 'Site Visit' | 'Lunch & Learn' | 'Phone Call' | 'Email Campaign' | 'CE Presentation' | 'Conference';
  contact: string;
  organization: string;
  outcome: string;
  followUpDate?: string;
}

const CONTACTS: BDContact[] = [
  { id: 'bd1', name: 'Dr. Michelle Park', organization: 'Vanderbilt University Medical Center', type: 'Hospital / ER', relationship: 'Strong', lastContact: '2026-07-10', nextFollowUp: '2026-07-25', referralsLTD: 34, referrals30d: 4, admissions30d: 3, owner: 'James Carter', notes: 'Primary ER liaison. Monthly lunch meetings. Accepts our clinical brochures at triage desk. Strong referral relationship.' },
  { id: 'bd2', name: 'Judge Harold Wallace', organization: 'Davidson County Drug Court', type: 'Drug Court', relationship: 'Strong', lastContact: '2026-07-08', nextFollowUp: '2026-07-30', referralsLTD: 22, referrals30d: 2, admissions30d: 2, owner: 'James Carter', notes: 'Court-mandated referrals. Requires Level 3.7 placement documentation. Biweekly status reports required.' },
  { id: 'bd3', name: 'Dr. Lisa Nguyen', organization: 'Northside Family Practice', type: 'Primary Care', relationship: 'Developing', lastContact: '2026-07-01', nextFollowUp: '2026-07-20', referralsLTD: 8, referrals30d: 1, admissions30d: 1, owner: 'James Carter', notes: 'SBIRT-trained. Very interested in warm handoff protocols. Scheduled CE presentation 7/22.' },
  { id: 'bd4', name: 'Mark Sullivan', organization: 'HCA Nashville Corporate EAP', type: 'Corporate EAP', relationship: 'Strong', lastContact: '2026-06-28', nextFollowUp: '2026-07-21', referralsLTD: 15, referrals30d: 2, admissions30d: 1, owner: 'James Carter', notes: 'Manages EAP for 3,200 hospital employees. Preferred provider status. Quarterly account review next month.' },
  { id: 'bd5', name: 'Pastor James Reynolds', organization: 'Grace Community Church', type: 'Faith Community', relationship: 'Developing', lastContact: '2026-06-20', nextFollowUp: '2026-07-23', referralsLTD: 5, referrals30d: 0, admissions30d: 0, owner: 'James Carter', notes: 'Hosts AA/NA meetings. Congregation of 800. Recovery ministry leader is a Sunrise alumnus — strong advocate.' },
  { id: 'bd6', name: 'Dr. Anthony Reed', organization: 'Midtown Psychiatry', type: 'Private Practice', relationship: 'Developing', lastContact: '2026-07-05', nextFollowUp: '2026-07-22', referralsLTD: 9, referrals30d: 1, admissions30d: 1, owner: 'James Carter', notes: 'Psychiatrist with large dual-diagnosis caseload. Sends overflow residential cases. Building trust.' },
  { id: 'bd7', name: 'Amanda Torres', organization: 'Serenity Sober Living', type: 'Sober Living', relationship: 'Strong', lastContact: '2026-07-12', nextFollowUp: '2026-07-26', referralsLTD: 12, referrals30d: 3, admissions30d: 2, owner: 'James Carter', notes: 'Bidirectional relationship — we refer to their sober living, they send back to us for PHP/IOP. 12 beds reserved for Sunrise graduates.' },
  { id: 'bd8', name: 'Kevin Morris', organization: 'Nashville Detox Center', type: 'Detox', relationship: 'Cold', lastContact: '2026-05-15', nextFollowUp: '2026-07-19', referralsLTD: 3, referrals30d: 0, admissions30d: 0, owner: 'James Carter', notes: 'Used to be a strong referral source. New medical director. Relationship needs re-warming. Bringing lunch 7/19.' },
];

const ACTIVITIES: OutreachActivity[] = [
  { id: 'oa1', date: '2026-07-17', type: 'CE Presentation', contact: 'Dr. Lisa Nguyen + Staff', organization: 'Northside Family Practice', outcome: '8 providers attended. Presented SBIRT and warm handoff protocol. 3 requested our referral packet. Follow-up with office manager.', followUpDate: '2026-07-22' },
  { id: 'oa2', date: '2026-07-15', type: 'Site Visit', contact: 'Vanderbilt ER Team', organization: 'Vanderbilt University Medical Center', outcome: 'Quarterly relationship visit. Updated resource packets. Met new social work supervisor. Invited to present at grand rounds in September.', followUpDate: '2026-07-25' },
  { id: 'oa3', date: '2026-07-10', type: 'Lunch & Learn', contact: 'Mark Sullivan + EAP Staff', organization: 'HCA Nashville Corporate EAP', outcome: 'Reviewed our clinical outcomes data. They were impressed by 6-month sobriety rates. Preferred provider contract renewal on track.' },
  { id: 'oa4', date: '2026-07-08', type: 'Phone Call', contact: 'Judge Harold Wallace', organization: 'Davidson County Drug Court', outcome: 'Discussed case coordination protocol. Judge agreed to refer Andre Simmons next week. Agreed to biweekly status report format.', followUpDate: '2026-07-30' },
  { id: 'oa5', date: '2026-07-02', type: 'Conference', contact: 'Multiple', organization: 'Tennessee Association of Addiction Professionals', outcome: 'Presented at TAAP annual conference. Distributed 200 brochures. Connected with 4 new potential referral sources. 2 promising leads for follow-up.' },
];

const RELATIONSHIP_COLORS: Record<string, string> = {
  Strong: 'bg-green-100 text-green-700',
  Developing: 'bg-blue-100 text-blue-700',
  Cold: 'bg-gray-100 text-slate',
  New: 'bg-purple-100 text-purple-700',
};

const CENSUS_DATA = [
  { month: 'Apr', census: 16, capacity: 22 },
  { month: 'May', census: 19, capacity: 22 },
  { month: 'Jun', census: 20, capacity: 22 },
  { month: 'Jul', census: 18, capacity: 22 },
];

export function BusinessDevelopment({ navigate, readOnly }: Props) {
  const [activeTab, setActiveTab] = useState<'Contacts' | 'Outreach Activity' | 'Census & Pipeline' | 'Goals & KPIs' | 'Referral Analytics' | 'Market Map'>('Contacts');
  const [selected, setSelected] = useState<BDContact | null>(CONTACTS[0]);
  const [relationshipFilter, setRelationshipFilter] = useState<string>('All');

  const filtered = relationshipFilter === 'All' ? CONTACTS : CONTACTS.filter(c => c.relationship === relationshipFilter);
  const totalRefs30d = CONTACTS.reduce((s, c) => s + c.referrals30d, 0);
  const totalAdmits30d = CONTACTS.reduce((s, c) => s + c.admissions30d, 0);
  const conversionRate = Math.round((totalAdmits30d / totalRefs30d) * 100);
  const overdue = CONTACTS.filter(c => new Date(c.nextFollowUp) <= new Date('2026-07-18')).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Business Development</h1>
          <p className="text-slate text-sm mt-0.5">Referral relationships, outreach, and census growth</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('ReferralTracker')} className="btn-outline text-sm px-4 py-2">Referral Tracker →</button>
          <LockedButton locked={readOnly} className="btn-primary text-sm px-4 py-2">+ Add Contact</LockedButton>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-navy">{CONTACTS.length}</div>
          <div className="text-xs text-slate mt-1">Active Relationships</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{totalRefs30d}</div>
          <div className="text-xs text-slate mt-1">Referrals (30d)</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{totalAdmits30d}</div>
          <div className="text-xs text-slate mt-1">Admissions (30d)</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-orange">{conversionRate}%</div>
          <div className="text-xs text-slate mt-1">Conversion Rate</div>
        </div>
        <div className="card text-center">
          <div className={`text-2xl font-bold ${overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>{overdue}</div>
          <div className="text-xs text-slate mt-1">Follow-Ups Due</div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Contacts', 'Outreach Activity', 'Census & Pipeline', 'Goals & KPIs', 'Referral Analytics', 'Market Map'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {activeTab === 'Contacts' && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2 space-y-2">
            <div className="flex gap-2 flex-wrap mb-3">
              {['All', 'Strong', 'Developing', 'Cold', 'New'].map(r => (
                <button key={r} onClick={() => setRelationshipFilter(r)} className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${relationshipFilter === r ? 'bg-navy text-white border-navy' : 'bg-white text-slate border-border'}`}>{r}</button>
              ))}
            </div>
            {filtered.map(c => {
              const followUpOverdue = new Date(c.nextFollowUp) <= new Date('2026-07-18');
              return (
                <div
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`card cursor-pointer p-3 hover:shadow-md transition-all ${selected?.id === c.id ? 'ring-2 ring-orange' : ''} ${followUpOverdue ? 'border-amber-300' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-navy text-sm">{c.name}</div>
                      <div className="text-xs text-slate">{c.organization}</div>
                      <div className="text-xs text-slate">{c.type}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RELATIONSHIP_COLORS[c.relationship]}`}>{c.relationship}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate">
                    <span>📞 {c.referrals30d} refs (30d)</span>
                    <span>✅ {c.admissions30d} admits</span>
                    {followUpOverdue && <span className="text-amber-600 font-medium">⚠ Follow-up due</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="col-span-3">
              <div className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-navy">{selected.name}</h2>
                    <p className="text-sm text-slate">{selected.organization} · {selected.type}</p>
                  </div>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${RELATIONSHIP_COLORS[selected.relationship]}`}>{selected.relationship}</span>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="card bg-gray-50 text-center p-3">
                    <div className="text-2xl font-bold text-navy">{selected.referralsLTD}</div>
                    <div className="text-xs text-slate">All-Time Referrals</div>
                  </div>
                  <div className="card bg-gray-50 text-center p-3">
                    <div className="text-2xl font-bold text-blue-600">{selected.referrals30d}</div>
                    <div className="text-xs text-slate">Referrals (30d)</div>
                  </div>
                  <div className="card bg-gray-50 text-center p-3">
                    <div className="text-2xl font-bold text-green-600">{selected.admissions30d}</div>
                    <div className="text-xs text-slate">Admissions (30d)</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div><span className="text-slate">Last Contact:</span> <span className="font-medium text-navy">{selected.lastContact}</span></div>
                  <div><span className="text-slate">Next Follow-Up:</span> <span className={`font-medium ${new Date(selected.nextFollowUp) <= new Date('2026-07-18') ? 'text-amber-600' : 'text-navy'}`}>{selected.nextFollowUp}</span></div>
                  <div className="col-span-2"><span className="text-slate">Account Owner:</span> <span className="font-medium text-navy">{selected.owner}</span></div>
                </div>

                <div className="mt-4 bg-gray-50 border border-border rounded-lg p-3">
                  <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Relationship Notes</div>
                  <p className="text-sm text-navy">{selected.notes}</p>
                </div>

                <div className="flex gap-2 mt-4">
                  <LockedButton locked={readOnly} className="btn-primary text-sm px-4 py-2 flex-1">Log Activity</LockedButton>
                  <LockedButton locked={readOnly} className="btn-outline text-sm px-4 py-2">Schedule Visit</LockedButton>
                  <LockedButton locked={readOnly} className="btn-outline text-sm px-4 py-2">Send Email</LockedButton>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Outreach Activity' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate">{ACTIVITIES.length} activities logged this month</p>
            <LockedButton locked={readOnly} className="btn-primary text-sm px-4 py-2">+ Log Activity</LockedButton>
          </div>
          {ACTIVITIES.map(a => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-navy/10 text-navy px-2 py-0.5 rounded-full font-medium">{a.type}</span>
                    <span className="text-xs text-slate">{a.date}</span>
                  </div>
                  <div className="font-semibold text-navy mt-1">{a.organization}</div>
                  <div className="text-xs text-slate">{a.contact}</div>
                </div>
                {a.followUpDate && (
                  <div className="text-right">
                    <div className="text-xs text-slate">Follow-up</div>
                    <div className="text-xs font-medium text-amber-700">{a.followUpDate}</div>
                  </div>
                )}
              </div>
              <p className="text-sm text-navy mt-2 bg-gray-50 rounded-lg p-2.5">{a.outcome}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Census & Pipeline' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-navy mb-4">Census Trend vs Capacity</h3>
              <div className="space-y-3">
                {CENSUS_DATA.map(d => (
                  <div key={d.month}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate">{d.month} 2026</span>
                      <span className="font-medium text-navy">{d.census}/{d.capacity} ({Math.round((d.census / d.capacity) * 100)}%)</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full">
                      <div
                        className={`h-3 rounded-full ${d.census / d.capacity >= 0.9 ? 'bg-green-500' : d.census / d.capacity >= 0.75 ? 'bg-orange' : 'bg-amber-400'}`}
                        style={{ width: `${(d.census / d.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>BD Insight:</strong> Census dipped to 18 in July vs 20 in June. Two cold relationships (Nashville Detox) need re-engagement. Consider targeted outreach to ER and drug court contacts this week.
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy mb-4">Referral Source Mix (30d)</h3>
              <div className="space-y-2">
                {[
                  { type: 'Hospital / ER', count: 4, color: 'bg-blue-500' },
                  { type: 'Drug Court', count: 2, color: 'bg-purple-500' },
                  { type: 'Corporate EAP', count: 2, color: 'bg-green-500' },
                  { type: 'Private Practice', count: 1, color: 'bg-amber-500' },
                  { type: 'Sober Living', count: 3, color: 'bg-orange' },
                  { type: 'Self-Referral', count: 2, color: 'bg-slate' },
                ].map(s => (
                  <div key={s.type} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-slate truncate">{s.type}</div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${s.color}`} style={{ width: `${(s.count / 14) * 100}%` }} />
                    </div>
                    <div className="text-xs font-medium text-navy w-4">{s.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Goals & KPIs' && (
        <div className="space-y-6">
          {/* Monthly KPI scorecard */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Referrals This Month', actual: 14, target: 18, unit: '', trend: '+2 vs last mo' },
              { label: 'Admissions This Month', actual: 11, target: 14, unit: '', trend: '+1 vs last mo' },
              { label: 'Referral-to-Admit Rate', actual: 79, target: 80, unit: '%', trend: '↑ 4pts vs last mo' },
              { label: 'Avg Days to Admit', actual: 1.8, target: 2.0, unit: 'd', trend: '↓ 0.3d (improved)' },
            ].map(k => {
              const pct = Math.min(100, Math.round((k.actual / k.target) * 100));
              const onTrack = pct >= 80;
              return (
                <div key={k.label} className="card">
                  <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                  <div className={`text-3xl font-bold mt-1 ${onTrack ? 'text-navy' : 'text-amber-600'}`}>{k.actual}{k.unit}</div>
                  <div className="text-xs text-slate">Target: <span className="font-medium text-navy">{k.target}{k.unit}</span></div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
                    <div className={`h-1.5 rounded-full ${onTrack ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className={`text-[10px] font-bold ${onTrack ? 'text-green-700' : 'text-amber-700'}`}>{pct}% of goal</span>
                    <span className="text-[10px] text-slate">{k.trend}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversion Funnel */}
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-0.5">Referral Conversion Funnel (30d)</h3>
              <p className="text-xs text-slate mb-4">Where referrals drop off in the intake pipeline</p>
              <div className="space-y-3">
                {[
                  { stage: 'Inquiries Received',      n: 22, color: 'bg-navy',       note: '100% of pipeline' },
                  { stage: 'Pre-Screen Completed',    n: 18, color: 'bg-blue-500',   note: '82% of inquiries' },
                  { stage: 'Insurance Verified',      n: 16, color: 'bg-blue-400',   note: '89% of pre-screened' },
                  { stage: 'Bed Assigned',            n: 13, color: 'bg-green-500',  note: '81% of verified' },
                  { stage: 'Admitted',                n: 11, color: 'bg-green-600',  note: '85% of assigned' },
                ].map((row, i, arr) => (
                  <div key={row.stage}>
                    <div className="flex justify-between mb-1 text-xs">
                      <span className="text-slate">{row.stage}</span>
                      <span className="font-bold text-navy">{row.n} <span className="text-slate font-normal">— {row.note}</span></span>
                    </div>
                    <div className="h-5 bg-gray-100 rounded" style={{ width: '100%' }}>
                      <div className={`h-5 rounded ${row.color} flex items-center justify-end pr-2`} style={{ width: `${(row.n / arr[0].n) * 100}%` }}>
                        <span className="text-[10px] text-white font-bold">{row.n}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
                <strong>Insight:</strong> Biggest drop-off at Pre-Screen → Insurance Verify (−2). Opportunity: pre-verify insurance before scheduling pre-screen.
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-0.5">BD Goals — Quarterly</h3>
              <p className="text-xs text-slate mb-4">Q3 2026 targets (Jul – Sep)</p>
              <div className="space-y-3">
                {[
                  { goal: 'New referral sources added', done: 3, target: 8, unit: '' },
                  { goal: 'CE presentations delivered', done: 2, target: 6, unit: '' },
                  { goal: 'Site visits completed', done: 4, target: 12, unit: '' },
                  { goal: 'Avg monthly admissions', done: 11, target: 14, unit: '/mo' },
                  { goal: 'Referral source retention', done: 87, target: 90, unit: '%' },
                  { goal: 'Average LOS (quality signal)', done: 24, target: 21, unit: 'd' },
                ].map(g => {
                  const isHigherBetter = g.unit !== 'd';
                  const raw = g.done / g.target;
                  const pct = Math.min(100, Math.round(raw * 100));
                  const ok = isHigherBetter ? raw >= 0.75 : raw <= 1.1;
                  return (
                    <div key={g.goal}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate">{g.goal}</span>
                        <span className="font-medium text-navy">{g.done}{g.unit} / {g.target}{g.unit}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className={`h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${isHigherBetter ? pct : Math.min(100, (g.target / g.done) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Upcoming BD Events</div>
                {[
                  { date: '7/20', event: 'Lunch w/ Nashville Detox — Kevin Morris', type: 'Re-engagement' },
                  { date: '7/22', event: 'CE Presentation at Northside Family Practice', type: 'Education' },
                  { date: '7/25', event: 'Quarterly call — Vanderbilt ER', type: 'Relationship' },
                  { date: '8/05', event: 'TAAP Networking Breakfast', type: 'Conference' },
                ].map(e => (
                  <div key={e.date} className="flex items-start gap-3 py-1.5 border-b border-border last:border-0">
                    <span className="text-[10px] font-bold text-navy bg-gray-100 rounded px-1.5 py-0.5 shrink-0">{e.date}</span>
                    <span className="text-xs text-navy flex-1">{e.event}</span>
                    <span className="text-[10px] text-slate">{e.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Referral Analytics' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Referral source performance — volume, conversion rates, census contribution, and trend analysis by partner organization.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Referrals (YTD)', value: 142, color: 'text-navy', sub: '+18% vs. prior year' },
              { label: 'Conversion Rate', value: '67%', color: 'text-green-600', sub: 'Referral → Admission' },
              { label: 'Avg Time to Admit', value: '2.4d', color: 'text-amber-600', sub: 'From referral received' },
              { label: 'Top Source', value: 'Court / DCS', color: 'text-blue-600', sub: '31 referrals YTD' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-border font-semibold text-navy text-sm">Referral Volume by Source — YTD 2026</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg text-slate">
                  {['Source', 'Total Referrals', 'Admitted', 'Conversion', 'Avg LOS', 'Avg Pay Mix', 'Trend'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { source: 'Court / DCS', refs: 31, admitted: 24, los: 28, pay: 'Medicaid 70% / Grant 30%', trend: '↑' },
                  { source: 'ER / Hospital', refs: 28, admitted: 17, los: 21, pay: 'Commercial 55% / Medicaid 45%', trend: '↑' },
                  { source: 'Physician / OBOT', refs: 22, admitted: 16, los: 35, pay: 'Commercial 80% / Self-Pay 20%', trend: '→' },
                  { source: 'Self-Referral / Web', refs: 19, admitted: 11, los: 24, pay: 'Commercial 40% / Self-Pay 60%', trend: '↑' },
                  { source: 'Previous Patient', refs: 14, admitted: 10, los: 30, pay: 'Commercial 70% / Medicaid 30%', trend: '→' },
                  { source: 'Family Member', refs: 11, admitted: 8, los: 26, pay: 'Commercial 65% / Self-Pay 35%', trend: '→' },
                  { source: 'Probation / Parole', refs: 9, admitted: 6, los: 32, pay: 'Medicaid 80% / Grant 20%', trend: '↓' },
                  { source: 'EAP / Employer', refs: 8, admitted: 3, los: 18, pay: 'Commercial 100%', trend: '↓' },
                ].map(r => {
                  const conv = Math.round((r.admitted / r.refs) * 100);
                  return (
                    <tr key={r.source} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-navy">{r.source}</td>
                      <td className="px-4 py-2.5 text-center font-semibold text-navy">{r.refs}</td>
                      <td className="px-4 py-2.5 text-center text-slate">{r.admitted}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`font-bold ${conv >= 70 ? 'text-green-600' : conv >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{conv}%</span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-slate">{r.los}d</td>
                      <td className="px-4 py-2.5 text-slate text-[10px]">{r.pay}</td>
                      <td className={`px-4 py-2.5 text-center font-bold text-lg ${r.trend === '↑' ? 'text-green-600' : r.trend === '↓' ? 'text-red-600' : 'text-slate'}`}>{r.trend}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Referral Response Time Analysis</h3>
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Responded within 1 hour', n: 89, pct: 63, color: 'bg-green-500' },
                  { label: 'Responded within 4 hours', n: 31, pct: 22, color: 'bg-amber-400' },
                  { label: 'Responded within 24 hours', n: 16, pct: 11, color: 'bg-orange-500' },
                  { label: 'Response >24 hours', n: 6, pct: 4, color: 'bg-red-500' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate">{r.label}</span>
                      <span className="font-bold text-navy">{r.n} ({r.pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <strong>Goal:</strong> 90% of referrals responded to within 1 hour. Currently at 63% — staff awareness and on-call protocol review needed.
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Lost Referrals — Reason Analysis</h3>
              <div className="space-y-2 text-xs">
                {[
                  { reason: 'No beds available', n: 22, pct: 47 },
                  { reason: 'Patient chose another facility', n: 11, pct: 23 },
                  { reason: 'Insurance / financial barrier', n: 7, pct: 15 },
                  { reason: 'Level of care mismatch', n: 4, pct: 9 },
                  { reason: 'No response from patient', n: 3, pct: 6 },
                ].map(r => (
                  <div key={r.reason}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate">{r.reason}</span>
                      <span className="font-semibold text-navy">{r.n} ({r.pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 rounded-full bg-slate-400" style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                <strong>Opportunity:</strong> 47% of lost referrals are capacity-related. Adding 2 Flex beds and a robust waitlist follow-up protocol could recapture ~10 admissions/month.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Market Map' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Nashville-metro competitive landscape and referral ecosystem — active referral partners, market share indicators, and growth opportunity areas.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Active Referral Partners', value: 34, color: 'text-navy', sub: 'Within 50-mile radius' },
              { label: 'Exclusive/Preferred Partners', value: 8, color: 'text-teal-600', sub: 'Priority SLA in place' },
              { label: 'Untapped ER/Detox Facilities', value: 6, color: 'text-amber-600', sub: 'No active relationship yet' },
              { label: 'Competitor Facilities (Metro)', value: 11, color: 'text-slate', sub: 'SUD-licensed, overlapping LOCs' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Referral Partner Ecosystem by Type</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { type: 'Hospital ERs & Inpatient Psych', partners: 9, pct: 26, color: 'bg-blue-500', hot: true },
                  { type: 'Primary Care / Family Medicine', partners: 7, pct: 21, color: 'bg-green-500', hot: false },
                  { type: 'Drug Courts & Criminal Justice', partners: 5, pct: 15, color: 'bg-purple-500', hot: false },
                  { type: 'Psychiatry / Mental Health Outpatient', partners: 5, pct: 15, color: 'bg-teal-500', hot: false },
                  { type: 'EAP / Employer Wellness Programs', partners: 4, pct: 12, color: 'bg-orange-400', hot: true },
                  { type: 'Social Services / DCFS', partners: 3, pct: 9, color: 'bg-amber-500', hot: false },
                  { type: 'Faith-Based Organizations', partners: 1, pct: 3, color: 'bg-gray-400', hot: false },
                ].map(t => (
                  <div key={t.type}>
                    <div className="flex justify-between mb-0.5">
                      <span className="flex items-center gap-1 text-slate">{t.type}{t.hot && <span className="text-[8px] bg-orange-100 text-orange-700 font-bold px-1 rounded">GROWTH</span>}</span>
                      <span className="font-semibold text-navy">{t.partners} partners</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${t.color}`} style={{ width: `${t.pct * 3.2}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Top Growth Opportunities — Unworked</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { org: 'Vanderbilt Univ. Medical Center — PACU', type: 'Hospital', potential: 'High', reason: 'High OUD/AUD post-op volume; no SUD referral pathway to Sunrise yet' },
                    { org: 'Tennessee Oncology', type: 'Specialty', potential: 'High', reason: 'Opioid-dependent cancer patient pipeline; no current SUD partner' },
                    { org: 'Nashville Electric Service EAP', type: 'EAP', potential: 'Medium', reason: '2,400+ employees; current EAP partner lacks residential capacity' },
                    { org: 'General Sessions Court — Nashville', type: 'Drug Court', potential: 'Medium', reason: 'DUI / drug diversion track; Sunrise not yet on approved provider list' },
                    { org: 'St. Thomas Health — ED Bridge Program', type: 'Hospital', potential: 'High', reason: 'SBIRT program active; looking for residential SUD step-down partner' },
                  ].map(o => (
                    <div key={o.org} className="border border-border rounded p-2.5">
                      <div className="flex items-start justify-between mb-0.5">
                        <span className="font-semibold text-navy">{o.org}</span>
                        <span className={`shrink-0 ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${o.potential === 'High' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{o.potential} Potential</span>
                      </div>
                      <div className="text-[10px] text-slate">{o.type} · {o.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
