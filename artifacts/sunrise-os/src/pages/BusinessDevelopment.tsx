import React, { useState } from 'react';
import { Screen } from '../App';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

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

export function BusinessDevelopment({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<'Contacts' | 'Outreach Activity' | 'Census & Pipeline'>('Contacts');
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
          <button className="btn-primary text-sm px-4 py-2">+ Add Contact</button>
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
        {(['Contacts', 'Outreach Activity', 'Census & Pipeline'] as const).map(t => (
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
                  <button className="btn-primary text-sm px-4 py-2 flex-1">Log Activity</button>
                  <button className="btn-outline text-sm px-4 py-2">Schedule Visit</button>
                  <button className="btn-outline text-sm px-4 py-2">Send Email</button>
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
            <button className="btn-primary text-sm px-4 py-2">+ Log Activity</button>
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
    </div>
  );
}
