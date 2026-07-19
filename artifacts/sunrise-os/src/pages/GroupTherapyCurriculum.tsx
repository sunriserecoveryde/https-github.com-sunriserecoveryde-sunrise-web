import React, { useState } from 'react';
import { Screen } from '../App';
import { BookOpen, CheckCircle, Clock, Star, Plus, ChevronDown, ChevronUp, Download, Users } from 'lucide-react';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

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
}

const CURRICULA: Curriculum[] = [
  {
    id: 'CB-001', name: 'Cognitive Behavioral Therapy for Substance Use Disorders', abbreviation: 'CBT-SUD',
    developer: 'Carroll, K.M. (Yale) / NIDA CTN', evidenceLevel: 'Level I (RCT)',
    targetPopulation: 'Adults with alcohol, opioid, stimulant, or polysubstance use disorders',
    sessionCount: 12, sessionLength: 60, modality: 'Both',
    primaryDomains: ['Functional analysis', 'Coping with craving', 'Thought challenging', 'Relapse prevention', 'Emotion regulation'],
    description: 'CBT-SUD is one of the most extensively researched and validated approaches to addiction treatment. It targets the learning processes underlying addictive behavior. Patients learn to identify high-risk situations, develop coping strategies, and restructure distorted thinking patterns related to substance use.',
    status: 'Active', facilitatorRequired: 'LPC, LCSW, CADC-II or higher (with CBT competency training)',
    materialsCost: 180, activeGroups: 2, completedCycles: 14,
  },
  {
    id: 'CB-002', name: 'Dialectical Behavior Therapy — Skills Training', abbreviation: 'DBT-ST',
    developer: 'Linehan, M.M. (UW) / Behavioral Tech LLC', evidenceLevel: 'Level I (RCT)',
    targetPopulation: 'Adults with SUD and co-occurring emotional dysregulation, BPD features, or trauma',
    sessionCount: 24, sessionLength: 90, modality: 'Group',
    primaryDomains: ['Mindfulness', 'Distress tolerance', 'Emotion regulation', 'Interpersonal effectiveness', 'Walking the middle path'],
    description: 'DBT Skills Training provides a structured curriculum for building psychological skills across four modules. Particularly effective for patients with co-occurring BPD, PTSD, and substance use disorders where emotional dysregulation is a central driver of use. Skills are directly practiced in group format.',
    status: 'Active', facilitatorRequired: 'LPC, LCSW with DBT Intensive Training (3-day minimum)',
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
    status: 'Active', facilitatorRequired: 'CADC-II or licensed clinician with Matrix training',
    materialsCost: 220, activeGroups: 1, completedCycles: 5,
  },
  {
    id: 'CB-006', name: 'Twelve-Step Facilitation', abbreviation: 'TSF',
    developer: 'Nowinski, J. / Hazelden Betty Ford', evidenceLevel: 'Level I (RCT)',
    targetPopulation: 'Adults with AUD or SUD seeking community-based long-term support',
    sessionCount: 12, sessionLength: 60, modality: 'Both',
    primaryDomains: ['Acceptance of powerlessness', 'Surrender', 'Active AA/NA participation', 'Steps 1–3', 'Sponsor relationship'],
    description: 'TSF is a manual-guided approach to facilitate active engagement in 12-step programs. Project MATCH research demonstrated equivalency to CBT and MET for AUD. TSF patients show higher rates of long-term abstinence, particularly when combined with active AA attendance.',
    status: 'Active', facilitatorRequired: 'CADC-I or higher; clinical supervisor or MD for combined cases',
    materialsCost: 80, activeGroups: 3, completedCycles: 18,
  },
  {
    id: 'CB-007', name: 'Acceptance and Commitment Therapy — Addiction', abbreviation: 'ACT-A',
    developer: 'Hayes, S.C. (UNR) / New Harbinger Publications', evidenceLevel: 'Level II (Quasi-exp)',
    targetPopulation: 'Adults with SUD and co-occurring avoidance-based coping, chronic pain, or values conflict',
    sessionCount: 8, sessionLength: 75, modality: 'Both',
    primaryDomains: ['Psychological flexibility', 'Defusion from addiction thoughts', 'Values clarification', 'Committed action', 'Acceptance of discomfort'],
    description: 'ACT-A applies third-wave CBT principles to addiction treatment, focusing on psychological flexibility rather than thought elimination. Particularly effective when rigid avoidance of emotions drives substance use. Growing evidence base for opioid use disorder and chronic pain + SUD comorbidity.',
    status: 'Pilot', facilitatorRequired: 'LPC or LCSW with ACT training (ACT Boot Camp or equivalent)',
    materialsCost: 95, activeGroups: 1, completedCycles: 2,
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
  { day: 'Monday', time: '10:00 AM', curriculum: 'CBT-SUD (Group 1)', facilitator: 'Sarah Jenkins, LPC', room: 'Sunrise Room', enrolled: 8 },
  { day: 'Monday', time: '2:00 PM', curriculum: 'TSF (Group A)', facilitator: 'David Odom, LMFT', room: 'Hope Room', enrolled: 10 },
  { day: 'Tuesday', time: '9:30 AM', curriculum: 'Seeking Safety', facilitator: 'Aisha Thompson, LCSW-A', room: 'Serenity Room', enrolled: 7 },
  { day: 'Tuesday', time: '2:30 PM', curriculum: 'GRT — Women\'s Group', facilitator: 'Keisha Brown, CPRS', room: 'Sunrise Room', enrolled: 6 },
  { day: 'Wednesday', time: '10:00 AM', curriculum: 'DBT Skills Training', facilitator: 'Sarah Jenkins, LPC', room: 'Sunrise Room', enrolled: 9 },
  { day: 'Wednesday', time: '2:00 PM', curriculum: 'Matrix Model', facilitator: 'Maria Gonzalez, LSW', room: 'Hope Room', enrolled: 5 },
  { day: 'Thursday', time: '10:00 AM', curriculum: 'CBT-SUD (Group 2)', facilitator: 'David Odom, LMFT', room: 'Serenity Room', enrolled: 7 },
  { day: 'Thursday', time: '3:00 PM', curriculum: 'ACT-A (Pilot)', facilitator: 'Aisha Thompson, LCSW-A', room: 'Hope Room', enrolled: 6 },
  { day: 'Friday', time: '11:00 AM', curriculum: 'TSF (Group B)', facilitator: 'Kevin Wright, CADC-I', room: 'Sunrise Room', enrolled: 9 },
];

export function GroupTherapyCurriculum({ navigate: _navigate }: Props) {
  const [tab, setTab] = useState<'Library' | 'Schedule' | 'Assignments'>('Library');
  const [expandedCurriculum, setExpandedCurriculum] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<CurriculumStatus | 'All'>('All');

  const filtered = filterStatus === 'All' ? CURRICULA : CURRICULA.filter(c => c.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Group Therapy Curriculum</h1>
          <p className="text-slate text-sm mt-0.5">Evidence-based curricula library · Weekly schedule · Session assignments</p>
        </div>
        <button className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus className="w-4 h-4" />New Group</button>
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
        {(['Library', 'Schedule', 'Assignments'] as const).map(t => (
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
                      <div className="flex gap-3">
                        <button className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-white flex items-center gap-1"><Download className="w-3 h-3" />Materials</button>
                        <button className="text-xs btn-primary px-3 py-1.5 flex items-center gap-1"><Plus className="w-3 h-3" />Schedule Group</button>
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
    </div>
  );
}
