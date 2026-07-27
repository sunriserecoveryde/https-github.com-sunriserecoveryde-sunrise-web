import React, { useState } from 'react';
import { Screen } from '../App';
import { BookOpen, CheckCircle, Clock, Star, Plus, ChevronDown, ChevronUp, Download, Users, X } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type EvidenceLevel = 'Level I (RCT)' | 'Level II (Quasi-exp)' | 'Level III (Expert)' | 'SAMHSA EBP';
type CurriculumStatus = 'Active' | 'Pilot' | 'Archived';

interface Curriculum {
  id: string;
  name: string;
  abbreviation: string;
  developer: string;
  evidenceLevel: EvidenceLevel;
  targetPopulation: string;
  sessionCount: number;
  sessionLength: number; // minutes
  modality: 'Individual' | 'Group' | 'Both';
  primaryDomains: string[];
  description: string;
  status: CurriculumStatus;
  facilitatorRequired: string;
  materialsCost: number;
  activeGroups: number;
  completedCycles: number;
  externalUrl?: string;
}

const CURRICULA: Curriculum[] = [
  {
    id: 'CB-001', name: 'Cognitive Behavioral Therapy for Substance Use Disorders', abbreviation: 'CBT-SUD',
    developer: 'Carroll, K.M. (Yale) / NIDA CTN', evidenceLevel: 'Level I (RCT)',
    targetPopulation: 'Adults with alcohol, opioid, stimulant, or polysubstance use disorders',
    sessionCount: 12, sessionLength: 60, modality: 'Both',
    primaryDomains: ['Functional analysis', 'Coping with craving', 'Thought challenging', 'Relapse prevention', 'Emotion regulation'],
    description: 'CBT-SUD is one of the most extensively researched and validated approaches to addiction treatment. It targets the learning processes underlying addictive behavior. Patients learn to identify high-risk situations, develop coping strategies, and restructure distorted thinking patterns related to substance use.',
    status: 'Active', facilitatorRequired: 'LCPC, LCADC, CAC-AD or higher (with CBT competency training)',
    materialsCost: 180, activeGroups: 2, completedCycles: 14,
  },
  {
    id: 'CB-002', name: 'Dialectical Behavior Therapy — Skills Training', abbreviation: 'DBT-ST',
    developer: 'Linehan, M.M. (UW) / Behavioral Tech LLC', evidenceLevel: 'Level I (RCT)',
    targetPopulation: 'Adults with SUD and co-occurring emotional dysregulation, BPD features, or trauma',
    sessionCount: 24, sessionLength: 90, modality: 'Group',
    primaryDomains: ['Mindfulness', 'Distress tolerance', 'Emotion regulation', 'Interpersonal effectiveness', 'Walking the middle path'],
    description: 'DBT Skills Training provides a structured curriculum for building psychological skills across four modules. Particularly effective for patients with co-occurring BPD, PTSD, and substance use disorders where emotional dysregulation is a central driver of use. Skills are directly practiced in group format.',
    status: 'Active', facilitatorRequired: 'LCPC, LCADC with DBT Intensive Training (3-day minimum)',
    materialsCost: 380, activeGroups: 1, completedCycles: 6,
  },
  {
    id: 'CB-003', name: 'Seeking Safety', abbreviation: 'SS',
    developer: 'Najavits, L.M. (Harvard) / Treatment Innovations', evidenceLevel: 'SAMHSA EBP',
    targetPopulation: 'Adults with co-occurring PTSD and substance use disorders',
    sessionCount: 25, sessionLength: 60, modality: 'Both',
    primaryDomains: ['Safety coping skills', 'Trauma psychoeducation', 'Compassion', 'Detachment from emotional pain', 'Community resources'],
    description: 'Seeking Safety is a present-focused treatment for co-occurring PTSD and substance use disorders. Unlike trauma-focused treatments, it addresses both disorders simultaneously through 25 topics covering cognitive, behavioral, and interpersonal domains. SAMHSA National Registry of Evidence-based Programs and Practices (NREPP).',
    status: 'Active', facilitatorRequired: 'Any licensed clinician with SS training (online available)',
    materialsCost: 150, activeGroups: 1, completedCycles: 9,
  },
  {
    id: 'CB-004', name: 'Motivational Enhancement Therapy', abbreviation: 'MET',
    developer: 'Miller, W.R. & Rollnick, S. / NIDA', evidenceLevel: 'Level I (RCT)',
    targetPopulation: 'Adults with AUD or SUD, especially early/pre-contemplation stage',
    sessionCount: 4, sessionLength: 60, modality: 'Individual',
    primaryDomains: ['Change talk elicitation', 'Decisional balance', 'OARS', 'Resistance rolling', 'Commitment strengthening'],
    description: 'MET uses motivational interviewing principles in a brief structured format to address ambivalence about change. Typically delivered in 4 individual sessions. Commonly used as a component of Project MATCH and combined with CBT-SUD for enhanced efficacy.',
    status: 'Active', facilitatorRequired: 'Clinician with MI training (MINT training or equivalent)',
    materialsCost: 60, activeGroups: 0, completedCycles: 22,
  },
  {
    id: 'CB-005', name: 'Matrix Model', abbreviation: 'Matrix',
    developer: 'Rawson, R.A. / Matrix Institute on Addictions', evidenceLevel: 'SAMHSA EBP',
    targetPopulation: 'Stimulant use disorders (methamphetamine, cocaine, amphetamine)',
    sessionCount: 36, sessionLength: 60, modality: 'Both',
    primaryDomains: ['Stimulant use education', 'Early recovery skills', 'Relapse prevention', '12-Step facilitation', 'Family education'],
    description: 'The Matrix Model is a 16-week structured outpatient program originally developed for stimulant use disorders. Combines individual therapy, group therapy, family education, 12-step facilitation, and urine testing in an integrated framework. SAMHSA NREPP listed.',
    status: 'Active', facilitatorRequired: 'CAC-AD or licensed clinician with Matrix training',
    materialsCost: 220, activeGroups: 1, completedCycles: 5,
  },
  {
    id: 'CB-006', name: 'Twelve-Step Facilitation', abbreviation: 'TSF',
    developer: 'Nowinski, J. / Hazelden Betty Ford', evidenceLevel: 'Level I (RCT)',
    targetPopulation: 'Adults with AUD or SUD seeking community-based long-term support',
    sessionCount: 12, sessionLength: 60, modality: 'Both',
    primaryDomains: ['Acceptance of powerlessness', 'Surrender', 'Active AA/NA participation', 'Steps 1–3', 'Sponsor relationship'],
    description: 'TSF is a manual-guided approach to facilitate active engagement in 12-step programs. Project MATCH research demonstrated equivalency to CBT and MET for AUD. TSF patients show higher rates of long-term abstinence, particularly when combined with active AA attendance.',
    status: 'Active', facilitatorRequired: 'CAC-AD or higher; clinical supervisor or MD for combined cases',
    materialsCost: 80, activeGroups: 3, completedCycles: 18,
  },
  {
    id: 'CB-007', name: 'Acceptance and Commitment Therapy — Addiction', abbreviation: 'ACT-A',
    developer: 'Hayes, S.C. (UNR) / New Harbinger Publications', evidenceLevel: 'Level II (Quasi-exp)',
    targetPopulation: 'Adults with SUD and co-occurring avoidance-based coping, chronic pain, or values conflict',
    sessionCount: 8, sessionLength: 75, modality: 'Both',
    primaryDomains: ['Psychological flexibility', 'Defusion from addiction thoughts', 'Values clarification', 'Committed action', 'Acceptance of discomfort'],
    description: 'ACT-A applies third-wave CBT principles to addiction treatment, focusing on psychological flexibility rather than thought elimination. Particularly effective when rigid avoidance of emotions drives substance use. Growing evidence base for opioid use disorder and chronic pain + SUD comorbidity.',
    status: 'Pilot', facilitatorRequired: 'LCPC or LCADC with ACT training (ACT Boot Camp or equivalent)',
    materialsCost: 95, activeGroups: 1, completedCycles: 2,
  },
  {
    id: 'RP-001', name: 'Relapse Prevention Curriculum', abbreviation: 'RPC',
    developer: 'The Sunrise Foundation', evidenceLevel: 'SAMHSA EBP',
    targetPopulation: 'Adults in early recovery — opiates & stimulants, polysubstance; non-12-step friendly; MAT-inclusive',
    sessionCount: 14, sessionLength: 60, modality: 'Both',
    primaryDomains: ['Relapse process education', 'Trigger identification & replacement', 'Craving management toolbox', 'Coping skills (behavioral & emotional)', 'Community supports', 'MAT & harm reduction', 'Personalized prevention plan', 'Emergency action planning'],
    description: 'A clinical, motivational workbook developed by The Sunrise Foundation for individuals in early recovery from opiates and stimulants. Covers the full relapse prevention cycle across 14 modules: recovery snapshot, the 3-stage relapse model, trigger mapping, early warning signs, decisional balance, urge surfing, TIPP, cognitive reframing, community engagement, MAT facts, personalized prevention plan, wallet-size emergency card, and progress logs. Includes a complete Facilitator Guide with MI script prompts, functional analysis steps, safety protocols, and documentation notes. Non-12-step and 12-step compatible. Available as an interactive online workbook with printable worksheets.',
    status: 'Active', facilitatorRequired: 'ADT, CSC-AD, CAC-AD, LCADC, LCPC; includes full Facilitator Guide',
    materialsCost: 0, activeGroups: 0, completedCycles: 0,
    externalUrl: '/sunrise-foundation/curriculum',
  },
  {
    id: 'CB-008', name: 'Gender-Responsive Treatment for Women', abbreviation: 'GRT',
    developer: 'Covington, S. / Center for Gender & Justice', evidenceLevel: 'SAMHSA EBP',
    targetPopulation: 'Women with SUD, especially trauma history, relationship issues, or justice involvement',
    sessionCount: 36, sessionLength: 90, modality: 'Group',
    primaryDomains: ['Trauma-informed care', 'Relational recovery', 'Safety', 'Shame and self-worth', 'Parenting in recovery'],
    description: '"Helping Women Recover" by Covington — a comprehensive, trauma-informed, gender-responsive curriculum. Includes three components: the woman, relationships, and community. Strong evidence for women with co-occurring trauma and SUD.',
    status: 'Active', facilitatorRequired: 'Female facilitator preferred; licensed clinician with GRT training',
    materialsCost: 290, activeGroups: 1, completedCycles: 4,
  },
];

const EVIDENCE_BADGE: Record<EvidenceLevel, string> = {
  'Level I (RCT)':       'bg-green-100 text-green-800',
  'Level II (Quasi-exp)': 'bg-blue-100 text-blue-700',
  'Level III (Expert)':  'bg-gray-100 text-gray-600',
  'SAMHSA EBP':          'bg-amber-100 text-amber-800',
};

const STATUS_BADGE: Record<CurriculumStatus, string> = {
  'Active':   'bg-green-100 text-green-700',
  'Pilot':    'bg-orange-100 text-orange-700',
  'Archived': 'bg-gray-100 text-gray-500',
};

const WEEKLY_SCHEDULE = [
  { day: 'Monday', time: '10:00 AM', curriculum: 'CBT-SUD (Group 1)', facilitator: 'Sarah Jenkins, LCPC', room: 'Sunrise Room', enrolled: 8 },
  { day: 'Monday', time: '2:00 PM', curriculum: 'TSF (Group A)', facilitator: 'David Odom, LCADC', room: 'Hope Room', enrolled: 10 },
  { day: 'Tuesday', time: '9:30 AM', curriculum: 'Seeking Safety', facilitator: 'Aisha Thompson, LCADC', room: 'Serenity Room', enrolled: 7 },
  { day: 'Tuesday', time: '2:30 PM', curriculum: 'GRT — Women\'s Group', facilitator: 'Keisha Brown, ADT', room: 'Sunrise Room', enrolled: 6 },
  { day: 'Wednesday', time: '10:00 AM', curriculum: 'DBT Skills Training', facilitator: 'Sarah Jenkins, LCPC', room: 'Sunrise Room', enrolled: 9 },
  { day: 'Wednesday', time: '2:00 PM', curriculum: 'Matrix Model', facilitator: 'Maria Gonzalez, LCADC', room: 'Hope Room', enrolled: 5 },
  { day: 'Thursday', time: '10:00 AM', curriculum: 'CBT-SUD (Group 2)', facilitator: 'David Odom, LCADC', room: 'Serenity Room', enrolled: 7 },
  { day: 'Thursday', time: '3:00 PM', curriculum: 'ACT-A (Pilot)', facilitator: 'Aisha Thompson, LCADC', room: 'Hope Room', enrolled: 6 },
  { day: 'Friday', time: '11:00 AM', curriculum: 'TSF (Group B)', facilitator: '__DE_CAC-AD_WRIGHT_I__', room: 'Sunrise Room', enrolled: 9 },
];

export function GroupTherapyCurriculum({ navigate: _navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Library' | 'Schedule' | 'Assignments' | 'Enrollment' | 'Evidence Base' | 'Facilitator Guide'>('Library');
  const [expandedCurriculum, setExpandedCurriculum] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<CurriculumStatus | 'All'>('All');
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [groupSaved, setGroupSaved] = useState<string | null>(null);
  const saveGroupAction = (msg: string) => { setGroupSaved(msg); setTimeout(() => setGroupSaved(null), 2500); };

  const filtered = filterStatus === 'All' ? CURRICULA : CURRICULA.filter(c => c.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Group Therapy Curriculum</h1>
          <p className="text-slate text-sm mt-0.5">Evidence-based curricula library · Weekly schedule · Session assignments</p>
        </div>
        <LockedButton locked={readOnly} onClick={() => setNewGroupOpen(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus className="w-4 h-4" />New Group</LockedButton>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Curricula', value: CURRICULA.filter(c => c.status === 'Active').length, sub: 'In current rotation', color: 'text-navy' },
          { label: 'Weekly Sessions', value: WEEKLY_SCHEDULE.length, sub: 'Across 3 rooms', color: 'text-navy' },
          { label: 'Level I EBPs', value: CURRICULA.filter(c => c.evidenceLevel === 'Level I (RCT)').length, sub: 'Randomized controlled trials', color: 'text-green-600' },
          { label: 'SAMHSA Listed', value: CURRICULA.filter(c => c.evidenceLevel === 'SAMHSA EBP').length, sub: 'NREPP approved', color: 'text-navy' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Library', 'Schedule', 'Assignments', 'Enrollment', 'Evidence Base', 'Facilitator Guide'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Library' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(['All', 'Active', 'Pilot', 'Archived'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === s ? 'bg-navy text-white border-navy' : 'border-border text-slate hover:border-navy'}`}>{s}</button>
            ))}
          </div>
          {filtered.map(cur => {
            const isExpanded = expandedCurriculum === cur.id;
            return (
              <div key={cur.id} className="border border-border rounded-xl overflow-hidden hover:border-orange/40 transition-colors">
                <div className="flex items-center gap-4 px-4 py-3 cursor-pointer" onClick={() => setExpandedCurriculum(isExpanded ? null : cur.id)}>
                  <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center text-white font-bold text-xs text-center leading-tight shrink-0 px-1">
                    {cur.abbreviation}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-navy text-sm">{cur.name}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border ${EVIDENCE_BADGE[cur.evidenceLevel]}`}>{cur.evidenceLevel}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_BADGE[cur.status]}`}>{cur.status}</span>
                    </div>
                    <div className="text-xs text-slate mt-0.5">
                      {cur.sessionCount} sessions · {cur.sessionLength} min · {cur.modality} · {cur.developer.split('/')[0].trim()} · ${cur.materialsCost}/participant
                    </div>
                  </div>
                  <div className="flex gap-4 text-center shrink-0">
                    <div><div className="text-lg font-bold text-navy">{cur.activeGroups}</div><div className="text-[10px] text-slate">Active</div></div>
                    <div><div className="text-lg font-bold text-navy">{cur.completedCycles}</div><div className="text-[10px] text-slate">Cycles</div></div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate" /> : <ChevronDown className="w-4 h-4 text-slate" />}
                </div>
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 bg-gray-50 grid grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-1">Description</div>
                        <p className="text-sm text-navy leading-relaxed">{cur.description}</p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-1">Target Population</div>
                        <p className="text-sm text-navy">{cur.targetPopulation}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-2">Primary Domains</div>
                        <div className="flex flex-wrap gap-1">
                          {cur.primaryDomains.map(d => <span key={d} className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 rounded-full">{d}</span>)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-1">Facilitator Requirements</div>
                        <p className="text-xs text-navy">{cur.facilitatorRequired}</p>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        <button onClick={() => saveGroupAction('Materials downloaded')} className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-white flex items-center gap-1"><Download className="w-3 h-3" />Materials</button>
                        <LockedButton locked={readOnly} onClick={() => saveGroupAction('Group scheduled')} className="text-xs btn-primary px-3 py-1.5 flex items-center gap-1"><Plus className="w-3 h-3" />Schedule Group</LockedButton>
                        {cur.externalUrl && (
                          <a href={cur.externalUrl} target="_blank" rel="noopener noreferrer" className="text-xs border border-orange text-orange px-3 py-1.5 rounded-lg hover:bg-orange/5 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />Open Full Curriculum
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Schedule' && (
        <div className="space-y-1">
          <div className="grid grid-cols-5 text-xs font-semibold text-slate uppercase py-2 px-4 border-b border-border">
            {['Day', 'Time', 'Curriculum', 'Facilitator', 'Room / Enrolled'].map(h => <div key={h}>{h}</div>)}
          </div>
          {WEEKLY_SCHEDULE.map((session, i) => (
            <div key={i} className="grid grid-cols-5 items-center px-4 py-3 border-b border-border last:border-0 hover:bg-gray-50 text-sm">
              <div className="font-semibold text-navy">{session.day}</div>
              <div className="text-slate">{session.time}</div>
              <div>
                <div className="font-medium text-navy">{session.curriculum}</div>
              </div>
              <div className="text-slate text-xs">{session.facilitator}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate">{session.room}</span>
                <span className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 rounded-full flex items-center gap-1"><Users className="w-3 h-3" />{session.enrolled}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Assignments' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Manage curriculum assignments per patient based on clinical indications, treatment plan goals, and ASAM assessment.</div>
          <div className="card">
            <h3 className="font-semibold text-navy mb-3">Curriculum Recommendation Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 pr-4">Indication</th>
                    <th className="text-left py-2 px-2">Primary</th>
                    <th className="text-left py-2 px-2">Adjunct</th>
                    <th className="text-left py-2 px-2">Avoid</th>
                  </tr>
                </thead>
                <tbody className="text-navy">
                  {[
                    ['AUD — mild/moderate', 'TSF or MET', 'CBT-SUD', '—'],
                    ['AUD — severe / medical', 'CBT-SUD', 'TSF, MET', '—'],
                    ['OUD on MAT', 'CBT-SUD, MET', 'TSF', '—'],
                    ['Stimulant (meth/cocaine)', 'Matrix Model, CBT-SUD', 'TSF', '—'],
                    ['Co-occurring PTSD', 'Seeking Safety', 'DBT-ST, CBT-SUD', 'Trauma-focused before stable'],
                    ['Emotional dysregulation / BPD', 'DBT-ST', 'ACT-A', 'Traditional TSF only'],
                    ['Women with trauma', 'GRT (Covington)', 'Seeking Safety', '—'],
                    ['Ambivalent / pre-contemplation', 'MET', 'CBT-SUD (later)', '—'],
                    ['Chronic pain + SUD', 'ACT-A', 'CBT-SUD', 'Opioid-dependent protocols'],
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 font-semibold">{row[0]}</td>
                      <td className="py-2 px-2 text-green-700">{row[1]}</td>
                      <td className="py-2 px-2 text-slate">{row[2]}</td>
                      <td className="py-2 px-2 text-red-600">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'Enrollment' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Patients Enrolled', value: 18, sub: 'In ≥1 curriculum', color: 'text-navy' },
              { label: 'Active Groups Running', value: CURRICULA.reduce((a, c) => a + c.activeGroups, 0), sub: 'This week', color: 'text-blue-600' },
              { label: 'Avg Curricula / Patient', value: '2.1', sub: 'Multi-modal approach', color: 'text-green-600' },
              { label: 'Completions YTD', value: CURRICULA.reduce((a, c) => a + c.completedCycles, 0), sub: 'Curriculum cycles', color: 'text-orange' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-navy text-sm">Patient Curriculum Enrollment</h3>
              <span className="text-xs text-slate">Based on treatment plan goals and ASAM assessment</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate">Patient</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate">Program</th>
                  {CURRICULA.filter(c => c.status === 'Active').map(c => (
                    <th key={c.id} className="text-center px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate">
                      <div className="text-[9px] leading-tight">{c.abbreviation}</div>
                    </th>
                  ))}
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'Marcus Webb', program: 'Residential', ids: ['CB-001', 'CB-004', 'CB-007'] },
                  { name: 'Samantha Choi', program: 'Residential', ids: ['CB-001', 'CB-002', 'CB-005'] },
                  { name: 'James Thornton', program: 'Residential', ids: ['CB-001', 'CB-003'] },
                  { name: 'Patricia Holloway', program: 'Residential', ids: ['CB-001', 'CB-004', 'CB-006', 'CB-007'] },
                  { name: 'Robert Navarro', program: 'Residential', ids: ['CB-003', 'CB-007'] },
                  { name: 'Elena Vasquez', program: 'PHP', ids: ['CB-001', 'CB-002'] },
                  { name: 'Brian Kowalski', program: 'PHP', ids: ['CB-001', 'CB-005'] },
                  { name: 'Linda Farris', program: 'IOP', ids: ['CB-004'] },
                  { name: 'Devon Price', program: 'PHP', ids: ['CB-001', 'CB-004', 'CB-006'] },
                  { name: 'Marcus Webb Jr.', program: 'IOP', ids: ['CB-001'] },
                ].map(row => {
                  const active = CURRICULA.filter(c => c.status === 'Active');
                  return (
                    <tr key={row.name} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-navy whitespace-nowrap">{row.name}</td>
                      <td className="px-4 py-2.5"><span className="text-[10px] font-medium bg-slate-100 text-slate px-1.5 py-0.5 rounded">{row.program}</span></td>
                      {active.map(c => (
                        <td key={c.id} className="px-2 py-2.5 text-center">
                          {row.ids.includes(c.id)
                            ? <span className="text-green-600 font-bold">✓</span>
                            : <span className="text-slate/30">–</span>}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${row.ids.length >= 3 ? 'bg-green-100 text-green-700' : row.ids.length >= 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-slate'}`}>
                          {row.ids.length}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-5 py-2 bg-gray-50 border-t border-border text-xs text-slate flex justify-between items-center">
              <span>Recommended: ≥2 curricula for residential patients, ≥1 for PHP/IOP</span>
              <LockedButton locked={readOnly} onClick={() => saveGroupAction('Enrollment report exported')} className="text-xs text-orange font-medium hover:underline">Export Enrollment Report</LockedButton>
            </div>
          </div>
        </div>
      )}
      {tab === 'Evidence Base' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Clinical evidence supporting the group therapy modalities used at Sunrise — research summaries, efficacy data, and ASAM/SAMHSA alignment.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Modality Evidence Summary</h3>
              <div className="space-y-3 text-xs">
                {[
                  { mod: 'Cognitive Behavioral Therapy (CBT)', evidence: 'Level A — 50+ RCTs. Reduces relapse rates 40–60% vs. control in AUD/OUD/stimulant SUD. SAMHSA TIP 35 endorsed.', strength: 'Strong', sColor: 'bg-green-100 text-green-700' },
                  { mod: 'Motivational Interviewing (MI)', evidence: 'Level A — Meta-analyses show 1.5–2x engagement improvement. Most effective at pre-contemplation/contemplation stage. NIDA endorsed.', strength: 'Strong', sColor: 'bg-green-100 text-green-700' },
                  { mod: 'Dialectical Behavior Therapy (DBT)', evidence: 'Level B — Strong for BPD+SUD comorbidity. Reduces self-harm, impulsivity, and substance use in dual-diagnosis populations.', strength: 'Moderate', sColor: 'bg-blue-100 text-blue-700' },
                  { mod: '12-Step Facilitation', evidence: 'Level B — Project MATCH shows equivalence to CBT/MET at 1 year. Enhanced by peer accountability and spiritual framework.', strength: 'Moderate', sColor: 'bg-blue-100 text-blue-700' },
                  { mod: 'Trauma-Informed Care / EMDR', evidence: 'Level B — Essential for co-occurring PTSD+SUD. Treating PTSD concurrently improves SUD outcomes and reduces dropout.', strength: 'Moderate', sColor: 'bg-blue-100 text-blue-700' },
                  { mod: 'Relapse Prevention Skills', evidence: 'Level A — Core component of every evidence-based SUD treatment. Marlatt & Gordon model widely replicated. CSAT approved.', strength: 'Strong', sColor: 'bg-green-100 text-green-700' },
                  { mod: 'Anger Management / Emotion Regulation', evidence: 'Level C — Targeted for stimulant SUD and co-occurring conduct issues. Limited RCTs but clinical consensus strong.', strength: 'Emerging', sColor: 'bg-amber-100 text-amber-700' },
                  { mod: 'Family Systems Therapy', evidence: 'Level B — BSFT and CRAFT models show 60–80% improvement in engagement. Critical for adolescent and family-involved cases.', strength: 'Moderate', sColor: 'bg-blue-100 text-blue-700' },
                ].map(m => (
                  <div key={m.mod} className="border border-border rounded-lg p-2.5">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-semibold text-navy text-[11px] flex-1">{m.mod}</span>
                      <span className={`ml-2 shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${m.sColor}`}>{m.strength}</span>
                    </div>
                    <div className="text-slate leading-relaxed">{m.evidence}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Regulatory &amp; Accreditation Alignment</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { body: 'SAMHSA TIP 47 — Group Therapy', align: 'CBT, MI, Psychoeducation, 12-Step', status: 'Compliant' },
                    { body: 'CARF Standard — Group Services', align: 'Documented evidence base required per §6.A.9', status: 'Compliant' },
                    { body: 'ASAM Criteria — LOC Group Tx Hours', align: 'Residential ≥5h/day, PHP ≥3h, IOP ≥3x/week', status: 'Compliant' },
                    { body: 'MD BHA Licensure Standards', align: 'Core groups: Psychoeducation + Relapse Prevention', status: 'Compliant' },
                  ].map(r => (
                    <div key={r.body} className="border border-border rounded p-2.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-navy">{r.body}</span>
                        <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{r.status}</span>
                      </div>
                      <div className="text-slate">{r.align}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <strong>Clinical Note:</strong> Evidence levels follow SAMHSA's "Levels of Evidence" hierarchy (A = RCT; B = quasi-experimental; C = expert consensus). All core Sunrise curricula meet Level B or above thresholds. Evidence Base reviewed annually by Clinical Director.
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Facilitator Guide' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Group facilitation reference guide — running groups effectively, managing therapeutic ruptures, handling challenging group dynamics, and documentation standards.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Group Stages — Yalom's Therapeutic Factors</h3>
              <div className="space-y-2 text-xs">
                {[
                  { factor: 'Universality', desc: 'Recognition that others share similar struggles — reduces shame and isolation. Foster by normalizing and eliciting group member responses.' },
                  { factor: 'Instillation of Hope', desc: 'Seeing peers further along in recovery gives hope to newcomers. Use alumni speakers and milestone recognition deliberately.' },
                  { factor: 'Altruism', desc: 'Giving help to others in the group strengthens self-worth. Encourage peer support exchanges rather than therapist-only feedback.' },
                  { factor: 'Cohesiveness', desc: 'Group belonging and trust. Build through consistent ground rules, confidentiality reinforcement, and reliable group structure.' },
                  { factor: 'Interpersonal Learning', desc: 'Group as social microcosm — members enact relationship patterns. Process group-level interactions, not just content.' },
                  { factor: 'Catharsis', desc: 'Emotional expression and processing within the safe group container. Create space and normalize emotional expression.' },
                  { factor: 'Imitative Behavior', desc: 'Members model coping strategies from each other and the facilitator. Be deliberate about what behaviors you model.' },
                ].map(f => (
                  <div key={f.factor} className="border border-border rounded-lg p-2">
                    <div className="font-semibold text-navy">{f.factor}</div>
                    <div className="text-slate mt-0.5">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Challenging Group Situations — Facilitation Responses</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { situation: 'Monopolizing member', response: 'Interrupt with gratitude and redirect: "Thanks for sharing — let\'s hear from someone who hasn\'t had a chance yet." Use seating and eye contact proactively.' },
                    { situation: 'Silent / withdrawn member', response: 'Low-risk invitations: "Is there anything from what\'s been shared that resonates with you?" Avoid direct confrontation; normalize silence as valid.' },
                    { situation: 'Conflict between members', response: 'Slow the process: "Let\'s pause." Reflect both parties. Ask the group: "What\'s happening in the room right now?" Use conflict as therapeutic material.' },
                    { situation: 'Disclosure of active suicidality', response: 'Acknowledge, validate, hold the group calmly. Notify co-facilitator or floor staff via pre-arranged signal. Address patient individually after group if safe.' },
                    { situation: 'Cross-talk / advice-giving', response: 'Redirect toward "I" statements and shared experience: "Instead of advice, can you share what this brings up for you personally?"' },
                  ].map(s => (
                    <div key={s.situation} className="border border-border rounded-lg p-2">
                      <div className="font-semibold text-amber-700 mb-0.5">{s.situation}</div>
                      <div className="text-navy">{s.response}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-2">Group Note Documentation Standards</h3>
                <div className="space-y-1 text-xs text-navy">
                  {[
                    'Record group title, date, time, duration, and facilitator name(s)',
                    'List members present — do NOT name members in individual sections (use "a group member")',
                    'Describe group theme, content covered, and primary therapeutic activities',
                    'Note group-level dynamics (cohesion, affect, energy, notable interactions)',
                    'For each individual: brief participation note, clinical observations, and any action items',
                    'Flag any safety concerns in the group note AND via a separate incident note',
                    'Co-facilitator cosign required if either facilitator is provisional',
                  ].map(s => <div key={s} className="flex gap-2"><span className="text-blue-500 shrink-0">→</span><span>{s}</span></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {newGroupOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setNewGroupOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[500px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-navy">Create New Group</h2>
              <button onClick={() => setNewGroupOpen(false)} className="text-slate hover:text-navy"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Group Title *</label>
                  <input type="text" className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Relapse Prevention — Advanced" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Curriculum Type</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Relapse Prevention (MATRIX)</option><option>CBT for Substance Use</option><option>DBT Skills</option><option>Seeking Safety</option><option>Mindfulness-Based</option><option>Psychoeducation</option><option>Family Systems</option><option>Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Level of Care</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Residential</option><option>PHP</option><option>IOP</option><option>OP</option><option>All Levels</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Max Enrollment</label>
                  <input type="number" min={2} max={30} className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 12" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Evidence Base</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>SAMHSA Evidence-Based</option><option>NREPP Registered</option><option>CARF Best Practice</option><option>Emerging / Adapted</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Description</label>
                  <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none" placeholder="Goals, clinical focus, who this group serves..." />
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setNewGroupOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setNewGroupOpen(false); saveGroupAction('Group added to curriculum library'); }} className="flex-1 bg-navy text-white rounded-xl py-2.5 text-sm font-semibold">Create Group</button>
            </div>
          </div>
        </div>
      )}

      {groupSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> {groupSaved}
        </div>
      )}
    </div>
  );
}
