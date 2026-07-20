import React, { useState } from 'react';
import { Screen } from '../App';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string[];
}

const ARTICLES: HelpArticle[] = [
  {
    id: 'h1', title: 'ASAM Criteria Quick Reference', category: 'Clinical',
    summary: '6-dimension scoring guide for level-of-care determination',
    content: [
      'Dimension 1 — Acute Intoxication & Withdrawal Potential: Assess current intoxication and history of severe withdrawal. Score 0–4. Score ≥3 typically indicates medical detox.',
      'Dimension 2 — Biomedical Conditions & Complications: Assess physical health conditions that complicate treatment. Includes chronic illness, pain, pregnancy.',
      'Dimension 3 — Emotional, Behavioral & Cognitive Conditions: Co-occurring psychiatric disorders, trauma, and cognitive functioning. Includes SI/HI risk.',
      'Dimension 4 — Readiness to Change: Stages of change (pre-contemplation → contemplation → preparation → action → maintenance). Score reflects engagement.',
      'Dimension 5 — Relapse, Continued Use & Continued Problem Potential: Risk of relapse without structure. Assess triggers, coping skills, recovery environment.',
      'Dimension 6 — Recovery & Living Environment: Stability of housing, support systems, family environment, transportation. Critical for step-down planning.',
      'Level of Care Summary: Scores 1–2 across dimensions → OP (Level 1). Scores 2–3 → IOP (Level 2.1). Scores 2–3 with structure needed → PHP (Level 2.5). Scores 3–4 → Residential (Level 3.5–3.7). Medical detox required → Level 4.',
    ]
  },
  {
    id: 'h2', title: '42 CFR Part 2 — Quick Reference for Clinicians', category: 'Compliance',
    summary: 'Federal confidentiality protections for SUD records',
    content: [
      'What it covers: Any information that would identify a person as having or having had a substance use disorder, including diagnosis, treatment, and referral records.',
      'Who it applies to: Any federally assisted program (receives federal funds, is licensed by a federal agency, or is operated by the federal government). Sunrise OS operates under these protections.',
      'Consent requirement: A separate, specific consent form is required before disclosing SUD records to any third party — including other treating providers, family members, or courts. A general healthcare consent is NOT sufficient.',
      'Exceptions (no consent required): Medical emergencies, court orders with proper findings, research with IRB approval, audit/evaluation, and communications within the program\'s treating staff.',
      'Prohibition on re-disclosure: Any person or entity receiving SUD records under a consent is prohibited from re-disclosing them without a new consent.',
      'Criminal penalties: Unauthorized disclosure is a federal crime. Document all disclosures in the chart audit log.',
    ]
  },
  {
    id: 'h3', title: 'COWS Scoring Guide', category: 'Clinical',
    summary: 'Clinical Opiate Withdrawal Scale — 11-item assessment',
    content: [
      'Total score interpretation: 5–12 = Mild withdrawal. 13–24 = Moderate withdrawal. 25–36 = Moderately severe. >36 = Severe withdrawal.',
      'Items scored: Resting pulse rate, sweating, restlessness (RUOG), pupil size, bone/joint aches, runny nose/tearing, GI upset, tremor, yawning, anxiety/irritability, gooseflesh skin.',
      'Frequency: Score every 4 hours during active withdrawal. Score ≥13 = notify physician immediately for MAT adjustment.',
      'Documentation: Enter COWS score in Vitals tab. System auto-flags scores ≥13 in Command Center and nursing station.',
      'MAT context: Buprenorphine induction should not begin until COWS score ≥8 (moderate withdrawal) to minimize precipitated withdrawal risk.',
    ]
  },
  {
    id: 'h4', title: 'CIWA-Ar Scoring Guide', category: 'Clinical',
    summary: 'Alcohol withdrawal scale — 10-item assessment',
    content: [
      'Total score interpretation: <8 = Absent to minimal withdrawal. 8–14 = Mild to moderate. 15–20 = Moderate to severe. >20 = Severe, risk of seizure/delirium tremens.',
      'Items scored: Nausea/vomiting, tremor, paroxysmal sweats, anxiety, agitation, tactile disturbances, auditory disturbances, visual disturbances, headache, orientation.',
      'Frequency: Score every 4–8 hours during first 48 hours. CIWA ≥15 requires physician notification and possible medication protocol adjustment.',
      'Librium taper: Standard approach at Sunrise. Physician to order taper schedule based on baseline CIWA score and patient weight/age.',
      'Seizure risk: CIWA >20 requires continuous monitoring and possible transfer to higher level of medical care. Document and escalate immediately.',
    ]
  },
  {
    id: 'h5', title: 'BIRP Note Writing Guide', category: 'Documentation',
    summary: 'Behavior, Intervention, Response, Plan format',
    content: [
      'B — Behavior: Objective and subjective observations of the client. What did the client say, do, present as? Include mood, affect, appearance, statements. Example: "Client presented tearful, mood 4/10. Verbalized strong craving (8/10) following phone call with ex-partner."',
      'I — Intervention: What did YOU do as the clinician? Be specific about techniques. Example: "Utilized motivational interviewing — open-ended questions to explore ambivalence. Reviewed safety plan. Practiced grounding technique (5-4-3-2-1)."',
      'R — Response: How did the client respond to your intervention? Change in mood, behavior, insight, agreement. Example: "Client mood shifted from 4/10 to 6/10. Agreed to avoid contact with ex-partner. Verbalized commitment to remain in treatment."',
      'P — Plan: Next steps, referrals, follow-up, safety planning, medication changes. Example: "Monitor mood and craving scores daily. Counselor follow-up tomorrow at 10 AM. Notify Dr. Chen of craving elevation for MAT review."',
      'Compliance tips: BIRP notes must be signed (or co-signed) within 24 hours per policy. Use specific behavioral language. Avoid assumptions. Include measurable statements when possible.',
    ]
  },
  {
    id: 'h6', title: 'CARF Standards Overview', category: 'Compliance',
    summary: 'Commission on Accreditation of Rehabilitation Facilities requirements',
    content: [
      'Client Rights: Informed consent, grievance procedures, non-discrimination, dignity and respect. Documented in admission packet and posted in common areas.',
      'Clinical Records: Complete, accurate, and timely. Include ASAM, treatment plans, progress notes, discharge summaries. Required signatures and co-signs.',
      'Staffing: Minimum staff-to-client ratios. Staff credentialing and licensure verification. Annual training compliance.',
      'Treatment Planning: Individualized treatment plans co-developed with client. Goals must be SMART (Specific, Measurable, Achievable, Relevant, Time-bound). Client signature required.',
      'Safety: Emergency procedures, fire drills, incident reporting, medication management. BHT supervision requirements.',
      'Quality Improvement: QI committee, outcome data collection, peer review. Annual program evaluation against outcome benchmarks.',
      'Sunrise OS compliance tools: Audit Readiness module tracks all CARF standards. Chart Review module flags documentation deficiencies. Training module tracks staff credentials.',
    ]
  },
];

const SHORTCUTS = [
  { key: 'Alt + D', action: 'Navigate to Dashboard' },
  { key: 'Alt + P', action: 'Navigate to Patient List' },
  { key: 'Alt + C', action: 'Navigate to Command Center' },
  { key: 'Alt + N', action: 'New Progress Note (from Patient Detail)' },
  { key: 'Alt + S', action: 'Save Draft (in note composer)' },
  { key: 'Ctrl + F', action: 'Search patients (from Patient List)' },
  { key: 'Esc', action: 'Close modal / Cancel action' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Clinical: 'bg-blue-100 text-blue-700',
  Compliance: 'bg-red-100 text-red-700',
  Documentation: 'bg-green-100 text-green-700',
};

export function HelpSupport({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<'Quick Reference' | 'Keyboard Shortcuts' | 'Contact Support' | 'Training Resources' | 'Release Notes' | 'System Status'>('Quick Reference');
  const [selected, setSelected] = useState<HelpArticle | null>(ARTICLES[0]);
  const [search, setSearch] = useState('');

  const filtered = ARTICLES.filter(a =>
    search === '' ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Help & Support</h1>
          <p className="text-slate text-sm mt-0.5">Clinical quick references, documentation guides, and compliance resources</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Quick Reference', 'Keyboard Shortcuts', 'Contact Support', 'Training Resources', 'Release Notes', 'System Status'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {activeTab === 'Quick Reference' && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2 space-y-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search references..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
            />
            {filtered.map(a => (
              <div
                key={a.id}
                onClick={() => setSelected(a)}
                className={`card cursor-pointer p-3 hover:shadow-md transition-all ${selected?.id === a.id ? 'ring-2 ring-orange' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-navy text-sm">{a.title}</div>
                    <div className="text-xs text-slate mt-0.5">{a.summary}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${CATEGORY_COLORS[a.category]}`}>{a.category}</span>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="col-span-3">
              <div className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-navy">{selected.title}</h2>
                    <p className="text-sm text-slate mt-0.5">{selected.summary}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[selected.category]}`}>{selected.category}</span>
                </div>
                <div className="space-y-3">
                  {selected.content.map((item, i) => {
                    const [label, ...rest] = item.split(': ');
                    const hasLabel = rest.length > 0 && item.includes(': ');
                    return (
                      <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-border">
                        <div className="w-5 h-5 rounded-full bg-orange/20 text-orange text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                        <p className="text-sm text-navy">
                          {hasLabel ? <><strong>{label}:</strong> {rest.join(': ')}</> : item}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Keyboard Shortcuts' && (
        <div className="max-w-2xl">
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Shortcut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {SHORTCUTS.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <kbd className="bg-gray-100 border border-gray-300 rounded px-2 py-0.5 font-mono text-xs font-medium text-navy">{s.key}</kbd>
                    </td>
                    <td className="px-4 py-3 text-slate">{s.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Contact Support' && (
        <div className="grid grid-cols-2 gap-6 max-w-3xl">
          <div className="card">
            <div className="text-2xl mb-3">🏥</div>
            <h3 className="font-semibold text-navy">Clinical Support</h3>
            <p className="text-sm text-slate mt-1">Questions about clinical workflows, ASAM scoring, or documentation requirements.</p>
            <div className="mt-4 space-y-2 text-sm">
              <div><span className="text-slate">Contact:</span> <span className="font-medium text-navy">James S. Collins III, Clinical Director</span></div>
              <div><span className="text-slate">Email:</span> <span className="text-orange">jcarter@sunriserecovery.org</span></div>
              <div><span className="text-slate">Ext:</span> <span className="font-medium text-navy">4401</span></div>
            </div>
          </div>
          <div className="card">
            <div className="text-2xl mb-3">🔧</div>
            <h3 className="font-semibold text-navy">Technical Support</h3>
            <p className="text-sm text-slate mt-1">System errors, login issues, data discrepancies, or feature requests.</p>
            <div className="mt-4 space-y-2 text-sm">
              <div><span className="text-slate">Email:</span> <span className="text-orange">support@sunriseos.com</span></div>
              <div><span className="text-slate">Response time:</span> <span className="font-medium text-navy">Within 4 business hours</span></div>
              <div><span className="text-slate">Urgent:</span> <span className="font-medium text-navy">(800) 555-0192</span></div>
            </div>
          </div>
          <div className="card">
            <div className="text-2xl mb-3">⚖️</div>
            <h3 className="font-semibold text-navy">Compliance & HIPAA</h3>
            <p className="text-sm text-slate mt-1">42 CFR Part 2 questions, audit requests, breach reporting, or privacy concerns.</p>
            <div className="mt-4 space-y-2 text-sm">
              <div><span className="text-slate">Contact:</span> <span className="font-medium text-navy">James S. Collins III (Compliance Officer)</span></div>
              <div><span className="text-slate">Breach Hotline:</span> <span className="text-orange">(800) 555-0193</span></div>
              <div><span className="text-slate">Available:</span> <span className="font-medium text-navy">24/7 for breach incidents</span></div>
            </div>
          </div>
          <div className="card">
            <div className="text-2xl mb-3">📋</div>
            <h3 className="font-semibold text-navy">Submit a Ticket</h3>
            <p className="text-sm text-slate mt-1">Report a bug, request a feature, or ask a question.</p>
            <div className="mt-4 space-y-3">
              <textarea
                placeholder="Describe the issue or request..."
                className="w-full border border-border rounded-lg p-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-orange/50"
              />
              <button className="btn-primary text-sm px-4 py-2 w-full">Submit Ticket</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Training Resources' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Staff training library — compliance courses, clinical skill modules, documentation guides, and certification trackers.</div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Required Courses Due', value: 2, color: 'text-red-600', sub: 'Complete by Aug 1' },
              { label: 'Completed This Month', value: 14, color: 'text-green-600', sub: 'Across all staff' },
              { label: 'Certifications Expiring', value: 3, color: 'text-amber-600', sub: 'Within 60 days' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Required Training Courses</h3>
              <div className="space-y-3">
                {[
                  { course: 'Annual HIPAA Compliance', due: '2026-08-01', status: 'Incomplete', type: 'Compliance', time: '45 min', req: true },
                  { course: '42 CFR Part 2 — SUD Record Privacy', due: '2026-08-01', status: 'Incomplete', type: 'Compliance', time: '30 min', req: true },
                  { course: 'Suicide Risk Assessment (QPR)', due: '2026-09-01', status: 'Complete', type: 'Clinical', time: '60 min', req: true },
                  { course: 'Trauma-Informed Care Refresher', due: '2026-09-15', status: 'Complete', type: 'Clinical', time: '90 min', req: true },
                  { course: 'Mandatory Reporter — Child Abuse', due: '2026-10-01', status: 'Complete', type: 'Compliance', time: '45 min', req: true },
                  { course: 'Fire Safety & Evacuation', due: '2026-10-15', status: 'Complete', type: 'Safety', time: '20 min', req: true },
                ].map(c => (
                  <div key={c.course} className={`flex items-center gap-3 p-2.5 border rounded-lg text-xs ${c.status === 'Incomplete' ? 'border-red-200 bg-red-50' : 'border-border'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${c.status === 'Complete' ? 'bg-green-500 text-white' : 'bg-red-100 text-red-600 border border-red-300'}`}>{c.status === 'Complete' ? '✓' : '!'}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-navy">{c.course}</div>
                      <div className="text-slate">{c.type} · {c.time} · Due {c.due}</div>
                    </div>
                    <button className={`text-[10px] font-bold px-2 py-1 rounded ${c.status === 'Incomplete' ? 'bg-red-600 text-white' : 'bg-gray-100 text-slate'}`}>{c.status === 'Incomplete' ? 'Start' : 'Review'}</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Optional Clinical Skill Modules</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { title: 'Motivational Interviewing — Advanced', cat: 'Counseling', time: '3h', level: 'Advanced', cert: true },
                    { title: 'CIWA-Ar & COWS Assessment Mastery', cat: 'Nursing', time: '1h', level: 'Intermediate', cert: false },
                    { title: 'MAT Pharmacology for Counselors', cat: 'MAT', time: '2h', level: 'Intermediate', cert: true },
                    { title: 'Documentation Excellence (BIRP/DAP)', cat: 'Documentation', time: '1.5h', level: 'Foundational', cert: false },
                    { title: 'Co-Occurring Disorders — Integrated Tx', cat: 'Clinical', time: '4h', level: 'Advanced', cert: true },
                    { title: 'Family Systems in Addiction Recovery', cat: 'Counseling', time: '2h', level: 'Intermediate', cert: false },
                  ].map(m => (
                    <div key={m.title} className="flex items-center justify-between p-2.5 border border-border rounded-lg hover:bg-gray-50">
                      <div>
                        <div className="font-semibold text-navy">{m.title}</div>
                        <div className="text-slate">{m.cat} · {m.time} {m.cert && '· CE credit available'}</div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1 ${m.level === 'Advanced' ? 'bg-purple-100 text-purple-700' : m.level === 'Intermediate' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{m.level}</div>
                        <button className="text-[10px] font-bold bg-navy text-white px-2 py-0.5 rounded">Enroll</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Certification Tracker</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { cert: 'LADC (TN Licensed Alcohol & Drug Counselor)', exp: '2026-09-01', status: 'Expiring Soon' },
                    { cert: 'CPR / BLS (Basic Life Support)', exp: '2026-08-15', status: 'Expiring Soon' },
                    { cert: 'CPI (Crisis Prevention)', exp: '2026-10-01', status: 'Expiring Soon' },
                    { cert: 'CADC-II (Certified Alcohol & Drug Counselor)', exp: '2027-01-15', status: 'Current' },
                    { cert: 'Mental Health First Aid', exp: '2027-03-01', status: 'Current' },
                  ].map(c => (
                    <div key={c.cert} className="flex items-center justify-between p-2 border border-border rounded">
                      <span className="text-navy font-medium">{c.cert}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-slate">Exp {c.exp}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.status === 'Current' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'Release Notes' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Sunrise OS version history and feature release notes — what's new, what's improved, and known issues per release.</div>
          <div className="space-y-4">
            {[
              {
                version: '1.0.0-demo', date: '2026-07-19', tag: 'Current', tagColor: 'bg-green-100 text-green-700',
                headline: 'Full demo release — all modules live',
                added: [
                  'Complete EHR navigation: 50+ clinical screens across all care areas',
                  'Role-based access control with 10 staff roles and configurable permissions',
                  'NursingMAR: full MAR accordion, Controlled Substance log, PRN History, Allergy Registry',
                  'CensusBedBoard: 14-day Discharge Forecast, bed turnover timeline',
                  'CommandCenter: Ops Dashboard with unit occupancy, staffing ratios, daily throughput',
                  'PopulationAnalytics: Payer Mix analysis with denial rates, revenue by LOC',
                  'RiskDashboard: Peer Benchmark module vs SAMHSA national averages',
                  'ASAMAssessments: Outcome Tracking tab with LOC-to-outcome correlation data',
                ],
                fixed: ['Resolved NursingMAR tab wrapper JSX nesting issue', 'Fixed SUD Epidemiology content placement outside component boundary'],
                known: ['AppointmentCalendar drag-and-drop not yet implemented', 'Export functions are UI-only in demo mode'],
              },
              {
                version: '0.9.0-beta', date: '2026-07-10', tag: 'Beta', tagColor: 'bg-blue-100 text-blue-700',
                headline: 'Clinical core modules and StaffAdmin launch',
                added: [
                  'StaffAdmin: full credential management, DEA number, permission overrides',
                  'WithdrawalMonitor: CIWA-Ar and COWS live scoring with severity alerts',
                  'PatientDetail: comprehensive 6-tab patient record with timeline and vitals',
                  'MATManagement: induction eligibility, prescription tracking, PDMP reference',
                  'ProgressNotes: note composer with co-sign workflow and template library',
                ],
                fixed: ['Fixed role permission state persistence across navigation'],
                known: ['MedicalRecords export function placeholder only'],
              },
              {
                version: '0.8.0-alpha', date: '2026-06-28', tag: 'Alpha', tagColor: 'bg-amber-100 text-amber-700',
                headline: 'Dashboard, auth layer, and navigation scaffold',
                added: [
                  'Core navigation sidebar with role-based section visibility',
                  'Dashboard with live census, alerts, and quick actions',
                  'AuthContext + RoleProvider wiring for per-screen permission checks',
                  'LoginPage with role selector and demo credential flow',
                  'RoleExplorer: buyer-facing permission matrix overview',
                ],
                fixed: [],
                known: ['Most clinical pages stub-only in this release'],
              },
            ].map(r => (
              <div key={r.version} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono font-bold text-navy">{r.version}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.tagColor}`}>{r.tag}</span>
                  <span className="text-xs text-slate">{r.date}</span>
                  <span className="text-xs font-medium text-navy">— {r.headline}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="font-semibold text-green-700 mb-1.5">✦ Added</div>
                    <ul className="space-y-1">
                      {r.added.map(a => <li key={a} className="text-slate flex items-start gap-1"><span className="text-green-500 shrink-0">+</span>{a}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-blue-700 mb-1.5">✎ Fixed</div>
                    {r.fixed.length > 0
                      ? <ul className="space-y-1">{r.fixed.map(f => <li key={f} className="text-slate flex items-start gap-1"><span className="text-blue-500 shrink-0">↻</span>{f}</li>)}</ul>
                      : <div className="text-slate italic">None noted</div>}
                  </div>
                  <div>
                    <div className="font-semibold text-amber-700 mb-1.5">⚠ Known Issues</div>
                    {r.known.length > 0
                      ? <ul className="space-y-1">{r.known.map(k => <li key={k} className="text-slate flex items-start gap-1"><span className="text-amber-500 shrink-0">!</span>{k}</li>)}</ul>
                      : <div className="text-slate italic">None noted</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'System Status' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Real-time system health, scheduled maintenance windows, and incident history for Sunrise OS and integrated services.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Overall Status', value: 'Operational', color: 'text-green-600', sub: 'All systems normal' },
              { label: 'Uptime (30d)', value: '99.97%', color: 'text-navy', sub: '13 min downtime total' },
              { label: 'Active Incidents', value: 0, color: 'text-green-600', sub: 'No open incidents' },
              { label: 'Next Maintenance', value: 'Aug 3', color: 'text-amber-600', sub: '2:00–4:00 AM CT' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Service Health — Current</h3>
            <div className="space-y-2 text-xs">
              {[
                { service: 'Sunrise OS Web App', status: 'Operational', latency: '142ms', uptime: '99.98%' },
                { service: 'API Server', status: 'Operational', latency: '88ms', uptime: '99.97%' },
                { service: 'Authentication (Session)', status: 'Operational', latency: '34ms', uptime: '100%' },
                { service: 'Document Storage', status: 'Operational', latency: '210ms', uptime: '99.95%' },
                { service: 'Secure Messaging', status: 'Operational', latency: '65ms', uptime: '99.99%' },
                { service: 'HL7 / ADT Integration', status: 'Operational', latency: '320ms', uptime: '99.91%' },
                { service: 'Clearinghouse (Claims)', status: 'Degraded', latency: '1,420ms', uptime: '99.42%' },
                { service: 'Telehealth Platform (Doxy)', status: 'Operational', latency: '180ms', uptime: '99.96%' },
                { service: 'e-Prescribing (EPCS)', status: 'Operational', latency: '280ms', uptime: '99.88%' },
              ].map(s => (
                <div key={s.service} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.status === 'Operational' ? 'bg-green-500' : s.status === 'Degraded' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <span className="font-medium text-navy">{s.service}</span>
                  </div>
                  <div className="flex gap-4 text-slate text-[10px]">
                    <span className={`font-bold ${s.status === 'Operational' ? 'text-green-600' : 'text-amber-600'}`}>{s.status}</span>
                    <span>Latency: {s.latency}</span>
                    <span>Uptime: {s.uptime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Recent Incident History</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Date', 'Service', 'Severity', 'Duration', 'Description', 'Resolution'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { date: 'Jul 14', service: 'Clearinghouse', sev: 'Minor', dur: '38 min', desc: 'Elevated claim submission latency', res: 'Vendor restarted ingestion queue' },
                  { date: 'Jun 28', service: 'API Server', sev: 'Minor', dur: '12 min', desc: 'Increased error rate on /vitals endpoint', res: 'Database connection pool expanded' },
                  { date: 'Jun 10', service: 'Document Storage', sev: 'Major', dur: '2h 14min', desc: 'File upload failures — storage provider outage', res: 'Failover to secondary region; files recovered' },
                  { date: 'May 22', service: 'HL7 Integration', sev: 'Minor', dur: '55 min', desc: 'ADT feed from hospital partner dropped', res: 'Interface engine restarted; no data loss' },
                ].map(r => (
                  <tr key={r.date + r.service} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-slate font-mono">{r.date}</td>
                    <td className="px-3 py-2 font-medium text-navy">{r.service}</td>
                    <td className="px-3 py-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.sev === 'Major' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.sev}</span></td>
                    <td className="px-3 py-2 text-slate">{r.dur}</td>
                    <td className="px-3 py-2 text-slate">{r.desc}</td>
                    <td className="px-3 py-2 text-slate italic">{r.res}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
