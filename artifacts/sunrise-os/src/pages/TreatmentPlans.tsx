import React, { useState } from 'react';
import { MOCK_PATIENTS, Patient, TreatmentGoal } from '../data/mockPatients';
import { Screen } from '../App';
import { useSessionChart } from '../context/SessionChartContext';
import {
  Target, CheckCircle2, Clock, Search, ChevronDown, ChevronUp,
  AlertTriangle, TrendingUp, BarChart3, PenTool, Plus, Calendar,
  Sparkles, X, ChevronRight, Zap,
} from 'lucide-react';
import { SignatureModal, SignedBadge, SignatureRecord } from '../components/ui/SignatureModal';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { LockedButton } from '../components/common/LockedButton';
import { getRolesWithEditAccess } from '../data/mockRoles';

// ─── ASAM Dimension metadata ──────────────────────────────────────────────────

const ASAM_DIMS = [
  { key: 'D1', label: 'D1 — Acute Intoxication & Withdrawal', short: 'Withdrawal', color: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500' },
  { key: 'D2', label: 'D2 — Biomedical Conditions & Complications', short: 'Biomedical', color: 'text-orange-700 bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  { key: 'D3', label: 'D3 — Emotional, Behavioral & Cognitive', short: 'Mental Health', color: 'text-purple-700 bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  { key: 'D4', label: 'D4 — Readiness to Change', short: 'Motivation', color: 'text-blue-700 bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  { key: 'D5', label: 'D5 — Relapse & Continued Use Potential', short: 'Relapse Risk', color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  { key: 'D6', label: 'D6 — Recovery & Living Environment', short: 'Environment', color: 'text-teal-700 bg-teal-50 border-teal-200', dot: 'bg-teal-500' },
] as const;

type AsamDim = 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6';

function dimMeta(key: AsamDim) {
  return ASAM_DIMS.find(d => d.key === key)!;
}

// ─── Extended TreatmentGoal with ASAM fields ─────────────────────────────────

interface ExtGoal extends TreatmentGoal {
  asamDimension?: AsamDim;
  interventions?: { modality: string; frequency: string; provider: string }[];
  measurableObjective?: string;
}

// ─── Preloaded goal library — keyed by ASAM dimension ────────────────────────
// Reflects current clinical standards: person-centered, SMART, measurable.
// Drawn from ICANotes, Kipu, TheraNest, and SAMHSA treatment guidelines.

interface GoalTemplate {
  problem: string;
  longTerm: string;
  shortTerm: string;        // weekly objective
  measurableObjective: string;
  interventions: { modality: string; frequency: string; provider: string }[];
  tags: string[];           // substance types this applies to
}

const GOAL_LIBRARY: Record<AsamDim, GoalTemplate[]> = {
  D1: [
    {
      problem: 'Acute withdrawal risk requiring clinical management',
      longTerm: 'Client will complete medically-supervised withdrawal without complication and achieve physiological stabilization within 7 days.',
      shortTerm: 'Client will allow nursing staff to complete COWS/CIWA assessments every 4 hours and report symptoms promptly.',
      measurableObjective: 'COWS ≤ 8 or CIWA ≤ 8 for 72 consecutive hours; zero AMA requests.',
      interventions: [
        { modality: 'Nursing withdrawal monitoring (COWS/CIWA)', frequency: 'Every 4 hours', provider: 'Nursing/Medical' },
        { modality: 'Buprenorphine/naloxone induction (if OUD)', frequency: 'Per physician order', provider: 'MD/DO' },
        { modality: 'Librium taper protocol (if AUD)', frequency: 'Per physician order', provider: 'MD/DO' },
      ],
      tags: ['OUD', 'AUD', 'polysubstance'],
    },
    {
      problem: 'Medication-assisted treatment (MAT) initiation needed',
      longTerm: 'Client will be stably maintained on buprenorphine/naloxone and demonstrate understanding of long-term MAT benefits.',
      shortTerm: 'Client will attend MAT education group and ask the medical team at least one question about their MAT medication.',
      measurableObjective: 'MAT medication taken as prescribed 100% of doses in Week 1; no illicit opioid use per UDS.',
      interventions: [
        { modality: 'MAT medication management', frequency: '3× per week', provider: 'MD/DO or APRN' },
        { modality: 'MAT education group', frequency: '2× per week', provider: 'Counselor' },
        { modality: 'Peer support — MAT recovery', frequency: '1× per week', provider: 'CPRS' },
      ],
      tags: ['OUD'],
    },
    {
      problem: 'Stimulant use cessation — no pharmacological withdrawal protocol but psychological craving management needed',
      longTerm: 'Client will achieve 30-day abstinence from stimulants with active craving management strategies.',
      shortTerm: 'Client will complete craving log daily, identifying trigger and intensity (0–10) for each craving.',
      measurableObjective: 'Negative UDS for stimulants at 30-day check; craving intensity self-report ≤ 4/10 average by Week 3.',
      interventions: [
        { modality: 'Craving and urge surfing group', frequency: '2× per week', provider: 'Counselor' },
        { modality: 'Contingency management', frequency: 'Weekly', provider: 'Counselor' },
        { modality: 'Psychiatric evaluation (co-occurring ADHD/mood)', frequency: 'Within 72h of admission', provider: 'Psychiatrist' },
      ],
      tags: ['stimulant', 'cocaine', 'meth'],
    },
  ],

  D2: [
    {
      problem: 'Chronic medical condition(s) requiring monitoring and integration into treatment',
      longTerm: 'Client will engage with all prescribed medical treatment, understand how medical conditions interact with substance use, and attend all medical appointments through discharge.',
      shortTerm: 'Client will attend nursing medication administration and report any new physical symptoms to medical staff within 2 hours.',
      measurableObjective: 'Zero missed medical appointments; medication adherence ≥ 95% per nursing log; vitals within safe range.',
      interventions: [
        { modality: 'Medical assessment / physician rounds', frequency: 'Daily (residential) or 2× weekly (outpatient)', provider: 'MD/DO' },
        { modality: 'Medication administration monitoring', frequency: 'Per medication schedule', provider: 'Nursing' },
        { modality: 'Chronic disease education', frequency: '1× per week', provider: 'Nursing / Health educator' },
      ],
      tags: ['OUD', 'AUD', 'polysubstance', 'stimulant'],
    },
    {
      problem: 'HCV exposure / infectious disease risk related to IVDU history',
      longTerm: 'Client will complete HCV evaluation, understand treatment candidacy, and establish a care relationship with a GI/infectious disease provider.',
      shortTerm: 'Client will complete pre-admission labs (HCV Ab, HIV, STI panel) and attend the health education session on bloodborne pathogens.',
      measurableObjective: 'Lab work completed by Day 3; GI referral placed by Day 7 if HCV Ab positive.',
      interventions: [
        { modality: 'Bloodborne pathogen health education', frequency: '1× per admission', provider: 'Nursing' },
        { modality: 'GI/Infectious disease referral', frequency: 'As indicated', provider: 'MD/DO' },
        { modality: 'Harm reduction counseling', frequency: '1× per week', provider: 'Counselor' },
      ],
      tags: ['OUD', 'polysubstance'],
    },
    {
      problem: 'Nutritional deficiency / physical deconditioning secondary to substance use',
      longTerm: 'Client will restore adequate nutritional status and establish healthy daily routines by discharge.',
      shortTerm: 'Client will attend all meals, complete the nutrition screening questionnaire, and meet with the dietitian this week.',
      measurableObjective: 'BMI within normal range or improving trend; 3 meals/day attended ≥ 90% of days.',
      interventions: [
        { modality: 'Dietary assessment and counseling', frequency: 'Weekly', provider: 'Registered Dietitian' },
        { modality: 'Nutritional supplementation (per physician order)', frequency: 'Daily', provider: 'Nursing' },
        { modality: 'Wellness group / physical activity', frequency: '3× per week', provider: 'Recreation Therapist' },
      ],
      tags: ['AUD', 'OUD', 'stimulant', 'polysubstance'],
    },
  ],

  D3: [
    {
      problem: 'Major depressive disorder co-occurring with SUD, impairing treatment engagement',
      longTerm: 'Client will achieve clinically significant reduction in depression symptoms (PHQ-9 decrease ≥ 5 pts) and develop sustainable mood management strategies.',
      shortTerm: 'Client will attend all individual therapy sessions and complete daily mood tracking using the structured mood log.',
      measurableObjective: 'PHQ-9 score decreases by ≥ 5 points by Week 4; zero passive SI episodes requiring safety plan escalation.',
      interventions: [
        { modality: 'Individual CBT therapy', frequency: '3× per week', provider: 'LPC / LCSW / LMFT' },
        { modality: 'Psychiatric evaluation and medication management', frequency: 'Within 72h, then weekly', provider: 'Psychiatrist / APRN' },
        { modality: 'Behavioral activation group', frequency: '2× per week', provider: 'Counselor' },
        { modality: 'Daily mood tracking', frequency: 'Daily self-monitoring', provider: 'Client (facilitated by counselor)' },
      ],
      tags: ['AUD', 'OUD', 'stimulant', 'polysubstance'],
    },
    {
      problem: 'PTSD symptoms (hypervigilance, nightmares, avoidance) interfering with sleep and group participation',
      longTerm: 'Client will reduce PCL-5 score by ≥ 10 points and engage in trauma-focused therapy following stabilization.',
      shortTerm: 'Client will attend Seeking Safety group and identify 1 safe coping skill to use when triggered.',
      measurableObjective: 'PCL-5 score decreasing trend; group attendance ≥ 80%; zero AMA requests due to trauma triggers.',
      interventions: [
        { modality: 'Seeking Safety group (trauma-informed, phase 1)', frequency: '3× per week', provider: 'Trauma-trained counselor' },
        { modality: 'EMDR or CPT (post-stabilization)', frequency: '1× per week (begins Week 3)', provider: 'EMDR-certified clinician' },
        { modality: 'Psychiatric evaluation for PTSD pharmacotherapy', frequency: 'Within 72h', provider: 'Psychiatrist' },
        { modality: 'Safety planning review', frequency: 'Weekly', provider: 'Primary counselor' },
      ],
      tags: ['OUD', 'AUD', 'polysubstance'],
    },
    {
      problem: 'Anxiety disorder with panic history limiting therapeutic engagement',
      longTerm: 'Client will reduce GAD-7 score to ≤ 10 and demonstrate consistent use of anxiety management techniques.',
      shortTerm: 'Client will practice 4-7-8 breathing or progressive muscle relaxation once daily and report experience in individual session.',
      measurableObjective: 'GAD-7 decreases by ≥ 5 points; panic episode frequency decreases ≥ 50%; group attendance ≥ 80%.',
      interventions: [
        { modality: 'CBT for anxiety — individual', frequency: '2× per week', provider: 'LPC / LCSW' },
        { modality: 'Anxiety management group (mindfulness / DBT skills)', frequency: '3× per week', provider: 'Counselor' },
        { modality: 'Psychiatric medication evaluation', frequency: 'Within 72h', provider: 'Psychiatrist' },
      ],
      tags: ['AUD', 'OUD', 'stimulant', 'polysubstance'],
    },
    {
      problem: 'Emotional dysregulation and impulsivity driving substance use and interpersonal conflict',
      longTerm: 'Client will demonstrate consistent use of DBT emotion regulation skills and reduce impulsive behavior incidents to zero per month.',
      shortTerm: 'Client will complete the DBT "opposite action" worksheet and discuss 1 situation where they used it effectively.',
      measurableObjective: 'Zero peer conflict incidents per week; DBT skills practice logged ≥ 5× per week.',
      interventions: [
        { modality: 'DBT skills group (Emotion Regulation, Distress Tolerance)', frequency: '4× per week', provider: 'DBT-trained counselor' },
        { modality: 'Individual DBT coaching session', frequency: '2× per week', provider: 'DBT-trained clinician' },
        { modality: 'Milieu behavioral monitoring', frequency: 'Ongoing', provider: 'All staff' },
      ],
      tags: ['AUD', 'OUD', 'stimulant', 'polysubstance'],
    },
  ],

  D4: [
    {
      problem: 'Ambivalence about recovery — pre-contemplation or contemplation stage of change',
      longTerm: 'Client will articulate a personal, internally-motivated vision for recovery and demonstrate action-stage behaviors (consistent treatment engagement).',
      shortTerm: 'Client will complete a decisional balance exercise with their counselor, identifying 3 costs and 3 benefits of change.',
      measurableObjective: 'URICA stage advances from contemplation to preparation/action; treatment attendance ≥ 85%.',
      interventions: [
        { modality: 'Motivational Interviewing — individual', frequency: '2× per week', provider: 'MI-trained counselor' },
        { modality: 'Change talk group', frequency: '2× per week', provider: 'Counselor' },
        { modality: 'Peer recovery support — shared experience', frequency: '1× per week', provider: 'CPRS' },
      ],
      tags: ['AUD', 'OUD', 'stimulant', 'polysubstance', 'cannabis'],
    },
    {
      problem: 'Externally-motivated admission (court, family pressure) — low intrinsic readiness',
      longTerm: 'Client will identify and internalize at least 3 personal reasons for sustained recovery beyond the external mandate.',
      shortTerm: 'Client will attend all scheduled groups without redirection from staff and write one journal entry about their personal recovery values.',
      measurableObjective: 'Zero staff-prompted attendance reminders by Week 2; self-identified motivation rating increases ≥ 2 points (0–10 scale).',
      interventions: [
        { modality: 'Motivational interviewing — individual', frequency: '3× per week', provider: 'MI-trained counselor' },
        { modality: 'Values clarification exercise', frequency: 'Week 1 only', provider: 'Primary counselor' },
        { modality: 'Drug court liaison / case coordination', frequency: 'Weekly report', provider: 'Case manager' },
      ],
      tags: ['AUD', 'OUD', 'stimulant', 'polysubstance'],
    },
    {
      problem: 'Denial of severity of substance use problem, minimizing impact on functioning',
      longTerm: 'Client will accurately describe the negative consequences of their substance use across life domains and accept the diagnosis.',
      shortTerm: 'Client will complete the Personal Impact Inventory worksheet and discuss findings with their counselor without minimizing.',
      measurableObjective: 'Client verbalizes at least 3 domains affected by substance use (family, health, work, legal, financial) by Week 2.',
      interventions: [
        { modality: 'Individual MI-based feedback session', frequency: '2× per week', provider: 'Counselor' },
        { modality: 'Psychoeducation: addiction as brain disease', frequency: '1× per week group', provider: 'Counselor' },
        { modality: 'Family impact session (with ROI)', frequency: '1× during treatment', provider: 'Family therapist' },
      ],
      tags: ['AUD', 'OUD', 'stimulant', 'polysubstance'],
    },
  ],

  D5: [
    {
      problem: 'High relapse risk due to untreated triggers, cravings, and limited coping strategies',
      longTerm: 'Client will develop and demonstrate a comprehensive relapse prevention plan with at least 5 identified triggers and coping responses.',
      shortTerm: 'Client will identify 3 personal high-risk situations and practice 1 corresponding coping strategy in group this week.',
      measurableObjective: 'Written relapse prevention plan completed by Week 3; craving intensity self-report ≤ 3/10 average by Week 4; negative UDS.',
      interventions: [
        { modality: 'Relapse prevention group (CBT-based)', frequency: '3× per week', provider: 'Counselor' },
        { modality: 'Individual relapse prevention session', frequency: '1× per week', provider: 'Primary counselor' },
        { modality: 'Urinalysis drug screen', frequency: 'Random, minimum 2× per week', provider: 'Nursing / Lab' },
        { modality: '12-Step or SMART Recovery participation', frequency: '3× per week', provider: 'CPRS / Self-directed' },
      ],
      tags: ['AUD', 'OUD', 'stimulant', 'polysubstance', 'cannabis'],
    },
    {
      problem: 'Multiple prior treatment episodes — relapse pattern requiring enhanced coping analysis',
      longTerm: 'Client will identify the specific breakdown point in prior recovery attempts and build targeted safeguards into the current discharge plan.',
      shortTerm: 'Client will complete the "Relapse Autopsy" exercise identifying what worked, what failed, and what will be different this time.',
      measurableObjective: 'Client identifies at least 3 specific lessons from prior relapses and incorporates them into written aftercare plan.',
      interventions: [
        { modality: 'MBRP (Mindfulness-Based Relapse Prevention)', frequency: '2× per week', provider: 'MBRP-trained counselor' },
        { modality: 'Discharge planning — enhanced aftercare', frequency: 'Begins Day 1', provider: 'Case manager + counselor' },
        { modality: 'Peer mentorship — long-term recovery model', frequency: '1× per week', provider: 'CPRS with ≥ 2 yrs sobriety' },
      ],
      tags: ['AUD', 'OUD', 'stimulant', 'polysubstance'],
    },
    {
      problem: 'Craving management — intense urges to use in response to emotional or environmental cues',
      longTerm: 'Client will demonstrate consistent use of evidence-based craving management strategies with no substance use.',
      shortTerm: 'Client will use the "urge surfing" technique at least once before next individual session and describe the experience.',
      measurableObjective: 'Craving intensity ≤ 4/10 on average by Week 3; craving duration < 20 minutes with skill use; negative UDS.',
      interventions: [
        { modality: 'Craving management group (urge surfing, thought-stopping)', frequency: '2× per week', provider: 'Counselor' },
        { modality: 'Mindfulness-based coping skills', frequency: 'Daily practice + 2× group/week', provider: 'Counselor / Self' },
        { modality: 'Crisis line orientation for after-hours urges', frequency: 'Week 1 orientation', provider: 'Case manager' },
      ],
      tags: ['AUD', 'OUD', 'stimulant', 'polysubstance', 'cannabis'],
    },
  ],

  D6: [
    {
      problem: 'Unstable or substance-infiltrated living environment threatening recovery post-discharge',
      longTerm: 'Client will secure safe, substance-free housing and a concrete discharge plan prior to leaving treatment.',
      shortTerm: 'Client will meet with case manager this week to review housing options including sober living, family home, and Oxford House.',
      measurableObjective: 'Discharge housing confirmed and documented by Week 3; client verbally commits to substance-free environment with plan.',
      interventions: [
        { modality: 'Case management — housing assessment', frequency: '2× per week', provider: 'Case manager' },
        { modality: 'Sober living / Oxford House application assistance', frequency: 'As needed', provider: 'Case manager' },
        { modality: 'Discharge planning team meeting', frequency: 'Weekly', provider: 'Counselor + Case manager + MD' },
      ],
      tags: ['AUD', 'OUD', 'stimulant', 'polysubstance'],
    },
    {
      problem: 'Limited or absent recovery support network — social isolation increasing relapse risk',
      longTerm: 'Client will establish a recovery community with at least 3 sober supports and a consistent mutual aid involvement.',
      shortTerm: 'Client will attend at least 2 AA/NA/SMART Recovery meetings this week and introduce themselves at each.',
      measurableObjective: 'Client identifies ≥ 3 sober supports by name; sponsor or recovery coach identified by Week 4; meeting attendance ≥ 3× per week.',
      interventions: [
        { modality: '12-Step facilitation / SMART Recovery orientation', frequency: '3× per week', provider: 'CPRS / Counselor' },
        { modality: 'Social skills and recovery community group', frequency: '2× per week', provider: 'Counselor' },
        { modality: 'Family therapy (with signed ROI)', frequency: '1× per week', provider: 'Family therapist / LMFT' },
      ],
      tags: ['AUD', 'OUD', 'stimulant', 'polysubstance', 'cannabis'],
    },
    {
      problem: 'Family system impacted by substance use — relationship repair needed to support recovery',
      longTerm: 'Client will participate in structured family therapy, repair identified relationships, and have family members integrated into the aftercare plan.',
      shortTerm: 'Client will sign a 42 CFR Part 2 release of information to include their primary support person in treatment planning.',
      measurableObjective: '≥ 2 family sessions completed by discharge; family identifies their role in the aftercare plan; client reports improved family communication.',
      interventions: [
        { modality: 'Family therapy sessions', frequency: '1× per week', provider: 'LMFT / Family therapist' },
        { modality: 'CRAFT family psychoeducation', frequency: '2× per month', provider: 'CRAFT-trained counselor' },
        { modality: 'Family recovery support group', frequency: 'Weekly (open to family)', provider: 'CPRS' },
      ],
      tags: ['AUD', 'OUD', 'stimulant', 'polysubstance'],
    },
    {
      problem: 'Employment instability or job loss secondary to substance use — financial and occupational reintegration needed',
      longTerm: 'Client will develop a concrete vocational or employment plan and connect with appropriate community resources prior to discharge.',
      shortTerm: 'Client will meet with vocational counselor and identify 3 employment or education goals for the next 90 days.',
      measurableObjective: 'Employment/education plan documented; referral to vocational rehab or EAP made; client verbalizes 3 next steps.',
      interventions: [
        { modality: 'Vocational counseling', frequency: '1× per week', provider: 'Vocational counselor / Case manager' },
        { modality: 'Life skills group (budgeting, resume, employment)', frequency: '2× per week', provider: 'Counselor' },
        { modality: 'FMLA/EAP coordination', frequency: 'As needed', provider: 'Case manager' },
      ],
      tags: ['AUD', 'OUD', 'stimulant', 'polysubstance'],
    },
  ],
};

// ─── AI: suggest goals based on ASAM scores + primary Dx ─────────────────────

function suggestGoals(
  asam: { d1: number; d2: number; d3: number; d4: number; d5: number; d6: number },
  primaryDx: string,
): Array<{ dim: AsamDim; template: GoalTemplate; reason: string }> {
  const dimScores: [AsamDim, number][] = [
    ['D1', asam.d1], ['D2', asam.d2], ['D3', asam.d3],
    ['D4', asam.d4], ['D5', asam.d5], ['D6', asam.d6],
  ];

  const tag = primaryDx.toLowerCase().includes('opioid') || primaryDx.toLowerCase().includes('heroin') || primaryDx.toLowerCase().includes('fentanyl') ? 'OUD'
    : primaryDx.toLowerCase().includes('alcohol') ? 'AUD'
    : primaryDx.toLowerCase().includes('meth') || primaryDx.toLowerCase().includes('cocaine') || primaryDx.toLowerCase().includes('stimulant') ? 'stimulant'
    : primaryDx.toLowerCase().includes('poly') ? 'polysubstance'
    : 'polysubstance';

  const suggestions: Array<{ dim: AsamDim; template: GoalTemplate; reason: string }> = [];

  const reasonMap: Record<AsamDim, (score: number) => string> = {
    D1: s => s >= 3 ? 'Severe withdrawal risk (D1=' + s + ') — medically-managed protocol required' : s >= 2 ? 'Moderate withdrawal (D1=' + s + ') — clinical monitoring needed' : 'Withdrawal present (D1=' + s + ') — MAT or monitoring indicated',
    D2: s => s >= 3 ? 'Significant medical comorbidity (D2=' + s + ') — integrated medical care essential' : 'Medical concern present (D2=' + s + ') — monitoring and education needed',
    D3: s => s >= 3 ? 'Severe psychiatric symptoms (D3=' + s + ') — co-occurring disorder treatment required' : s >= 2 ? 'Moderate MH symptoms (D3=' + s + ') — psychiatric eval and therapy indicated' : 'Emotional/behavioral concerns (D3=' + s + ')',
    D4: s => s >= 3 ? 'Very low readiness (D4=' + s + ') — MI approach essential before skills-based work' : s >= 2 ? 'Ambivalent about change (D4=' + s + ') — motivation enhancement needed' : 'Some resistance present (D4=' + s + ')',
    D5: s => s >= 3 ? 'Very high relapse risk (D5=' + s + ') — intensive relapse prevention required' : s >= 2 ? 'Elevated relapse risk (D5=' + s + ') — structured RP plan needed' : 'Relapse history noted (D5=' + s + ')',
    D6: s => s >= 3 ? 'Unstable recovery environment (D6=' + s + ') — housing and support planning critical' : s >= 2 ? 'Recovery environment concerns (D6=' + s + ') — community support building needed' : 'Environmental risk factors present (D6=' + s + ')',
  };

  for (const [dim, score] of dimScores) {
    if (score === 0) continue;
    const lib = GOAL_LIBRARY[dim];
    // Pick the most relevant template (prefer tag match)
    const tagged = lib.filter(t => t.tags.includes(tag));
    const pool = tagged.length > 0 ? tagged : lib;
    const top = pool[0];
    suggestions.push({ dim, template: top, reason: reasonMap[dim](score) });
  }

  return suggestions;
}

// ─── Extended mock goals ──────────────────────────────────────────────────────

const EXTRA_GOALS: Record<string, ExtGoal[]> = {
  p2: [
    { id: 'p2-g1', category: 'Substance Use', asamDimension: 'D5', problem: 'Alcohol use disorder — daily use pattern with high relapse risk', longTerm: 'Client will maintain 90-day abstinence from alcohol with comprehensive relapse prevention plan in place.', shortTerm: 'Attend all scheduled groups and complete daily craving log', status: 'In Progress', targetDate: '2026-08-20', measurableObjective: 'Negative UDS; craving intensity ≤ 4/10 by Week 3; RP plan written by Week 2.', interventions: [{ modality: 'Relapse prevention group (CBT)', frequency: '3× per week', provider: 'Counselor' }, { modality: 'Individual MI session', frequency: '2× per week', provider: 'Primary counselor' }] },
    { id: 'p2-g2', category: 'Mental Health', asamDimension: 'D3', problem: 'Generalized anxiety affecting treatment engagement', longTerm: 'Client will reduce GAD-7 score to ≤ 7 by discharge through integrated anxiety management.', shortTerm: 'Practice 1 grounding exercise daily and journal reactions', status: 'In Progress', targetDate: '2026-07-31', measurableObjective: 'GAD-7 decreases ≥ 5 pts by Week 4; group attendance ≥ 90%.', interventions: [{ modality: 'CBT anxiety group', frequency: '3× per week', provider: 'Counselor' }, { modality: 'Psychiatric evaluation', frequency: 'Within 72h', provider: 'Psychiatrist' }] },
  ],
  p3: [
    { id: 'p3-g1', category: 'Substance Use', asamDimension: 'D5', problem: 'Methamphetamine use disorder — stimulant dependency with high cravings', longTerm: 'Client will achieve 90-day abstinence from methamphetamine and establish a community recovery network.', shortTerm: 'Engage in SMART Recovery group twice this week and complete craving log', status: 'Not Started', targetDate: '2026-09-01', measurableObjective: 'Negative UDS at 90 days; SMART meeting attendance ≥ 2× week; sponsor identified.', interventions: [{ modality: 'SMART Recovery group', frequency: '2× per week', provider: 'Counselor' }, { modality: 'Contingency management', frequency: 'Weekly', provider: 'Counselor' }] },
    { id: 'p3-g2', category: 'Behavioral', asamDimension: 'D3', problem: 'Emotional dysregulation — peer conflict in milieu', longTerm: 'Client will demonstrate therapeutic peer engagement for 2 consecutive weeks without incident.', shortTerm: 'Discuss peer conflict with counselor in 1:1 and identify 1 DBT coping strategy', status: 'In Progress', targetDate: '2026-07-25', measurableObjective: 'Zero peer conflict incidents per week by Week 2; DBT log completed daily.', interventions: [{ modality: 'DBT skills group', frequency: '4× per week', provider: 'DBT counselor' }] },
    { id: 'p3-g3', category: 'Psychiatric', asamDimension: 'D3', problem: 'Mild paranoid ideation (substance-induced)', longTerm: 'Client will remain free of psychotic symptoms for ≥ 30 days post-discharge.', shortTerm: 'Attend daily psychiatric check-in and complete safety plan review', status: 'In Progress', targetDate: '2026-08-07', measurableObjective: 'No escalation of psychotic symptoms; safety plan intact; psychiatric eval completed Week 1.', interventions: [{ modality: 'Daily psychiatric check-in', frequency: 'Daily', provider: 'Psychiatrist / APRN' }] },
  ],
  p4: [
    { id: 'p4-g1', category: 'Medical', asamDimension: 'D2', problem: 'Active wound (abscess, left arm) related to IVDU', longTerm: 'Client will achieve full wound healing and demonstrate sterile technique understanding to prevent recurrence.', shortTerm: 'Comply with wound care protocol daily and attend all nursing visits', status: 'In Progress', targetDate: '2026-08-05', measurableObjective: 'Wound healing progression documented by nursing; no new abscesses; wound care attendance 100%.', interventions: [{ modality: 'Wound care — nursing', frequency: 'Twice daily', provider: 'Nursing' }, { modality: 'Harm reduction / injection education', frequency: '1× per week', provider: 'Nurse educator' }] },
    { id: 'p4-g2', category: 'Substance Use', asamDimension: 'D1', problem: 'Polysubstance dependence (opioids, cocaine, benzodiazepines) — active withdrawal', longTerm: 'Client will stabilize on MAT and achieve abstinence from all illicit substances for 6 months.', shortTerm: 'Complete COWS/CIWA assessments Q4H and discuss triggers with counselor', status: 'In Progress', targetDate: '2026-08-20', measurableObjective: 'COWS ≤ 8 within 72h; negative UDS for non-prescribed substances; MAT compliance 100%.', interventions: [{ modality: 'COWS/CIWA monitoring', frequency: 'Q4H', provider: 'Nursing' }, { modality: 'MAT management', frequency: 'Per physician order', provider: 'MD/DO' }] },
    { id: 'p4-g3', category: 'Legal/Compliance', asamDimension: 'D6', problem: 'Court-mandated treatment — drug court compliance required', longTerm: 'Client will maintain compliance with all drug court requirements throughout their treatment and supervision period.', shortTerm: 'Sign ROI for drug court coordinator and attend all court-ordered programming', status: 'Not Started', targetDate: '2026-07-26', measurableObjective: 'All court-required documentation submitted on time; zero violations reported to drug court.', interventions: [{ modality: 'Drug court coordination', frequency: 'Weekly report', provider: 'Case manager' }] },
  ],
  p5: [
    { id: 'p5-g1', category: 'Substance Use', asamDimension: 'D1', problem: 'Alcohol use disorder — active CIWA protocol, withdrawal management', longTerm: 'Client will complete medically-supervised detox and maintain abstinence on Vivitrol series.', shortTerm: 'Participate in CIWA monitoring Q4H and attend medical check-ins', status: 'In Progress', targetDate: '2026-09-01', measurableObjective: 'CIWA ≤ 8 for 72h; Vivitrol injection schedule initiated; negative UDS.', interventions: [{ modality: 'CIWA monitoring', frequency: 'Q4H', provider: 'Nursing' }, { modality: 'Vivitrol injection schedule', frequency: 'Monthly', provider: 'MD/DO' }] },
    { id: 'p5-g2', category: 'Financial', asamDimension: 'D6', problem: 'Outstanding self-pay balance — financial barrier to treatment engagement', longTerm: 'Client will establish a manageable payment plan and maintain financial counseling engagement through discharge.', shortTerm: 'Meet with financial counselor this week to review balance and options', status: 'Not Started', targetDate: '2026-07-25', measurableObjective: 'Payment plan established by Day 7; financial counseling attended ≥ 1× per week.', interventions: [{ modality: 'Financial counseling', frequency: '1× per week', provider: 'Financial counselor / Case manager' }] },
  ],
  p6: [
    { id: 'p6-g1', category: 'Substance Use', asamDimension: 'D1', problem: 'Alcohol use disorder — medically-managed detox', longTerm: 'Client will complete detox safely and enter active recovery programming.', shortTerm: 'Attend morning check-in with nursing and complete CIWA protocol', status: 'Met', targetDate: '2026-07-20', measurableObjective: 'CIWA ≤ 8 for 72h; no seizure activity; Librium taper complete.', interventions: [{ modality: 'CIWA monitoring + Librium taper', frequency: 'Q4H', provider: 'Nursing / MD' }] },
    { id: 'p6-g2', category: 'Coping Skills', asamDimension: 'D5', problem: 'Limited coping strategies for alcohol cravings and emotional triggers', longTerm: 'Client will develop and consistently apply ≥ 5 evidence-based coping strategies for alcohol cravings.', shortTerm: 'Identify 1 trigger and 1 coping strategy in individual session this week', status: 'In Progress', targetDate: '2026-08-01', measurableObjective: '5 coping strategies listed in written RP plan; craving log shows decreasing intensity trend.', interventions: [{ modality: 'Relapse prevention group', frequency: '3× per week', provider: 'Counselor' }, { modality: 'Individual CBT session', frequency: '2× per week', provider: 'Primary counselor' }] },
  ],
  p7: [
    { id: 'p7-g1', category: 'Substance Use', asamDimension: 'D5', problem: 'Cocaine use disorder — stimulant dependency with high-risk social network', longTerm: 'Client will achieve 90-day abstinence and engage in a structured aftercare plan.', shortTerm: 'Identify 3 high-risk situations and discuss avoidance strategies with counselor', status: 'In Progress', targetDate: '2026-10-01', measurableObjective: 'Negative UDS; high-risk situation list documented; SMART attendance ≥ 2× week.', interventions: [{ modality: 'Relapse prevention group', frequency: '3× per week', provider: 'Counselor' }, { modality: 'Contingency management', frequency: 'Weekly', provider: 'Counselor' }] },
    { id: 'p7-g2', category: 'Mental Health', asamDimension: 'D3', problem: 'Antisocial personality traits impairing therapeutic engagement', longTerm: 'Client will engage authentically in therapy 3+ sessions/week without manipulative behavior.', shortTerm: 'Complete one journal reflection on interpersonal patterns this week', status: 'In Progress', targetDate: '2026-08-15', measurableObjective: 'Zero staff-documented manipulative incidents per week by Week 3; journaling 5× per week.', interventions: [{ modality: 'Individual therapy — schema-focused', frequency: '2× per week', provider: 'LPC / LCSW' }, { modality: 'Milieu behavioral monitoring', frequency: 'Ongoing', provider: 'All staff' }] },
  ],
  p8: [
    { id: 'p8-g1', category: 'Substance Use', asamDimension: 'D1', problem: 'Opioid use disorder — active COWS protocol, Suboxone induction', longTerm: 'Client will stabilize on buprenorphine/naloxone and remain abstinent from illicit opioids for 6 months.', shortTerm: 'COWS assessments Q4H; attend MAT education group; report cravings to nursing', status: 'In Progress', targetDate: '2026-09-15', measurableObjective: 'COWS ≤ 8 for 72h; Suboxone doses taken as prescribed 100%; negative opioid UDS.', interventions: [{ modality: 'COWS monitoring + Suboxone induction', frequency: 'Q4H then daily', provider: 'Nursing / MD' }, { modality: 'MAT education group', frequency: '2× per week', provider: 'Counselor' }] },
    { id: 'p8-g2', category: 'Psychiatric', asamDimension: 'D3', problem: 'Co-occurring eating disorder — meal restriction behaviors', longTerm: 'Client will restore healthy eating patterns and eliminate restriction behaviors by discharge.', shortTerm: 'Attend all meals and meet with dietitian; discuss ED behaviors with therapist', status: 'Not Started', targetDate: '2026-08-01', measurableObjective: 'Meal attendance 100%; dietitian appointment completed weekly; no restriction episodes documented.', interventions: [{ modality: 'Dietary assessment and counseling', frequency: 'Weekly', provider: 'Registered Dietitian' }, { modality: 'Individual ED-informed therapy', frequency: '2× per week', provider: 'ED-trained clinician' }] },
    { id: 'p8-g3', category: 'Mental Health', asamDimension: 'D3', problem: 'Severe anxiety with panic history', longTerm: 'Client will achieve anxiety at manageable levels (GAD-7 ≤ 10) with no panic attacks for 30 days.', shortTerm: 'Practice 4-7-8 breathing daily; discuss anxiety triggers in CBT group', status: 'In Progress', targetDate: '2026-08-20', measurableObjective: 'GAD-7 decreases ≥ 5 pts; zero panic attacks by Week 4; breathing exercise log 5× per week.', interventions: [{ modality: 'CBT for anxiety', frequency: '3× per week', provider: 'Counselor' }, { modality: 'Psychiatric medication evaluation', frequency: 'Within 72h', provider: 'Psychiatrist' }] },
  ],
};

function getGoals(p: Patient): ExtGoal[] {
  return p.goals.length > 0 ? (p.goals as ExtGoal[]) : (EXTRA_GOALS[p.id] ?? []);
}

// ─── Derived data ─────────────────────────────────────────────────────────────

const REVIEW_INTERVALS: Record<string, string> = {
  p1: '2026-07-25', p3: '2026-07-22', p4: '2026-07-23',
  p5: '2026-07-25', p6: '2026-07-26', p7: '2026-07-28',
  p8: '2026-07-24', p9: '2026-07-27', p2: '2026-08-01',
};

const TODAY = '2026-07-24';

function isOverdue(date: string) { return date < TODAY; }
function isDueWithin7(date: string) { return date >= TODAY && date <= '2026-07-31'; }

const STATUS_COLORS: Record<TreatmentGoal['status'], string> = {
  'Met':         'bg-green-100 text-green-800 border border-green-200',
  'In Progress': 'bg-blue-100 text-blue-800 border border-blue-200',
  'Not Started': 'bg-slate-100 text-slate border border-slate-200',
};

// ─── AI Goal Suggestion Panel ─────────────────────────────────────────────────

function AiGoalSuggestions({
  patient,
  onSelect,
  onDismiss,
}: {
  patient: Patient;
  onSelect: (g: ExtGoal) => void;
  onDismiss: () => void;
}) {
  const suggestions = suggestGoals(patient.asam, patient.primaryDiagnosis);
  const [added, setAdded] = useState<Set<number>>(new Set());

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 overflow-hidden mb-4">
      <div className="flex items-center gap-2 px-4 py-3 bg-violet-100 border-b border-violet-200">
        <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
        <div className="flex-1">
          <span className="text-sm font-bold text-violet-800">AI Goal Suggestions</span>
          <span className="text-xs text-violet-600 ml-2">Based on ASAM dimension scores for {patient.firstName} {patient.lastName}</span>
        </div>
        <button onClick={onDismiss} className="text-violet-400 hover:text-violet-600"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-4 space-y-3">
        {suggestions.length === 0 && (
          <p className="text-sm text-violet-600 italic">All ASAM dimensions score 0 — no acute clinical needs indicated for automated suggestions.</p>
        )}
        {suggestions.map((s, i) => {
          const dim = dimMeta(s.dim);
          const isAdded = added.has(i);
          return (
            <div key={i} className="bg-white border border-violet-100 rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${dim.color}`}>{dim.key}</span>
                  <span className="text-xs font-semibold text-navy">{s.template.problem}</span>
                </div>
                <button
                  onClick={() => {
                    if (isAdded) return;
                    setAdded(prev => new Set(prev).add(i));
                    onSelect({
                      id: `ai-${Date.now()}-${i}`,
                      category: dim.short,
                      asamDimension: s.dim,
                      problem: s.template.problem,
                      longTerm: s.template.longTerm,
                      shortTerm: s.template.shortTerm,
                      measurableObjective: s.template.measurableObjective,
                      interventions: s.template.interventions,
                      status: 'Not Started',
                      targetDate: '2026-08-24',
                    });
                  }}
                  className={`shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${isAdded ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                >
                  {isAdded ? '✓ Added' : '+ Add to Plan'}
                </button>
              </div>
              <div className="text-[10px] text-violet-700 bg-violet-50 rounded px-2 py-1 font-medium">
                <Zap className="w-3 h-3 inline mr-1" />{s.reason}
              </div>
              <div className="text-xs text-slate leading-relaxed">
                <span className="font-semibold text-navy">Goal:</span> {s.template.longTerm}
              </div>
              <div className="text-xs text-slate">
                <span className="font-semibold text-navy">Objective:</span> {s.template.measurableObjective}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {s.template.interventions.slice(0, 2).map((iv, j) => (
                  <span key={j} className="text-[10px] bg-slate-100 text-slate px-2 py-0.5 rounded font-medium">{iv.modality} · {iv.frequency}</span>
                ))}
              </div>
            </div>
          );
        })}
        <div className="text-[10px] text-violet-400 italic pt-1">
          AI suggestions are generated from ASAM scores and clinical goal libraries. Always review, customize, and verify with the patient before finalizing.
        </div>
      </div>
    </div>
  );
}

// ─── ASAM-guided Add Goal Form ────────────────────────────────────────────────

function AsamGoalBuilder({
  patient,
  onSave,
  onCancel,
}: {
  patient: Patient;
  onSave: (g: ExtGoal) => void;
  onCancel: () => void;
}) {
  const [selectedDim, setSelectedDim] = useState<AsamDim | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [problem, setProblem] = useState('');
  const [longTerm, setLongTerm] = useState('');
  const [shortTerm, setShortTerm] = useState('');
  const [objective, setObjective] = useState('');
  const [targetDate, setTargetDate] = useState('2026-09-24');
  const [step, setStep] = useState<'dim' | 'template' | 'customize'>('dim');

  const dimScore = (dim: AsamDim) => {
    const k = dim.toLowerCase() as 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6';
    return (patient.asam as Record<string, number>)[k] ?? 0;
  };

  const pickTemplate = (t: GoalTemplate) => {
    setSelectedTemplate(t);
    setProblem(t.problem);
    setLongTerm(t.longTerm);
    setShortTerm(t.shortTerm);
    setObjective(t.measurableObjective);
    setStep('customize');
  };

  const handleSave = () => {
    if (!problem.trim() || !selectedDim) return;
    const dim = dimMeta(selectedDim);
    onSave({
      id: `g-${Date.now()}`,
      category: dim.short,
      asamDimension: selectedDim,
      problem: problem.trim(),
      longTerm: longTerm.trim() || '(To be specified)',
      shortTerm: shortTerm.trim() || '(To be specified)',
      measurableObjective: objective.trim(),
      interventions: selectedTemplate?.interventions ?? [],
      status: 'Not Started',
      targetDate,
    });
  };

  return (
    <div className="border border-blue-200 rounded-xl bg-blue-50/30 overflow-hidden mt-3">
      {/* Step indicator */}
      <div className="flex border-b border-blue-200 bg-white">
        {(['dim', 'template', 'customize'] as const).map((s, i) => (
          <div key={s} className={`flex-1 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold ${step === s ? 'text-navy border-b-2 border-orange' : 'text-slate'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s ? 'bg-orange text-white' : i < ['dim','template','customize'].indexOf(step) ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate'}`}>
              {i < ['dim','template','customize'].indexOf(step) ? '✓' : i + 1}
            </span>
            {s === 'dim' ? 'ASAM Dimension' : s === 'template' ? 'Goal Template' : 'Customize'}
          </div>
        ))}
      </div>

      <div className="p-4">
        {step === 'dim' && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-navy mb-3">Select the ASAM dimension this goal addresses:</div>
            {ASAM_DIMS.map(d => {
              const score = dimScore(d.key);
              return (
                <button
                  key={d.key}
                  onClick={() => { setSelectedDim(d.key); setStep('template'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all hover:shadow-sm ${d.color}`}
                >
                  <span className="font-mono font-bold text-sm shrink-0 w-8">{d.key}</span>
                  <span className="flex-1 text-xs font-medium">{d.label.replace(d.key + ' — ', '')}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {[0,1,2,3,4].map(n => (
                      <div key={n} className={`w-2.5 h-2.5 rounded-full ${n < score ? d.dot : 'bg-slate-200'}`} />
                    ))}
                    <span className="text-[10px] font-bold ml-1">{score}/4</span>
                  </div>
                </button>
              );
            })}
            <button onClick={onCancel} className="text-xs text-slate hover:underline mt-2">Cancel</button>
          </div>
        )}

        {step === 'template' && selectedDim && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setStep('dim')} className="text-xs text-slate hover:text-navy flex items-center gap-1">← Back</button>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${dimMeta(selectedDim).color}`}>{selectedDim}</span>
              <span className="text-xs font-semibold text-navy">Select a preloaded goal or start from scratch:</span>
            </div>
            <div className="space-y-2">
              {GOAL_LIBRARY[selectedDim].map((t, i) => (
                <button
                  key={i}
                  onClick={() => pickTemplate(t)}
                  className="w-full text-left border border-border bg-white rounded-lg px-3 py-2.5 hover:border-orange hover:bg-orange/5 transition-all group"
                >
                  <div className="text-xs font-semibold text-navy group-hover:text-orange">{t.problem}</div>
                  <div className="text-[10px] text-slate mt-0.5 leading-relaxed line-clamp-2">{t.longTerm}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {t.interventions.slice(0, 2).map((iv, j) => (
                      <span key={j} className="text-[10px] bg-slate-100 text-slate px-1.5 py-0.5 rounded">{iv.modality}</span>
                    ))}
                  </div>
                </button>
              ))}
              <button
                onClick={() => { setSelectedTemplate(null); setStep('customize'); }}
                className="w-full text-left border border-dashed border-border bg-white rounded-lg px-3 py-2.5 hover:border-navy text-xs text-slate hover:text-navy transition-colors"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Write a custom goal from scratch
              </button>
            </div>
            <button onClick={onCancel} className="text-xs text-slate hover:underline mt-2">Cancel</button>
          </div>
        )}

        {step === 'customize' && selectedDim && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setStep('template')} className="text-xs text-slate hover:text-navy flex items-center gap-1">← Back</button>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${dimMeta(selectedDim).color}`}>{selectedDim}</span>
              <span className="text-xs font-semibold text-navy">Review & customize</span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Problem Statement *</label>
              <input value={problem} onChange={e => setProblem(e.target.value)} className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Long-Term Goal (3–6 month outcome)</label>
              <textarea value={longTerm} onChange={e => setLongTerm(e.target.value)} rows={2} className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-orange" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Short-Term Objective (this week)</label>
              <textarea value={shortTerm} onChange={e => setShortTerm(e.target.value)} rows={2} className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-orange" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Measurable Outcome Indicator</label>
              <input value={objective} onChange={e => setObjective(e.target.value)} placeholder="e.g. PHQ-9 decreases ≥ 5 pts; group attendance ≥ 90%" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Target Date</label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange" />
            </div>
            {selectedTemplate && (
              <div className="bg-slate-50 border border-border rounded-lg p-3">
                <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-2">Preloaded Interventions</div>
                <div className="space-y-1.5">
                  {selectedTemplate.interventions.map((iv, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-navy font-medium">{iv.modality}</span>
                      <span className="text-slate">·</span>
                      <span className="text-slate">{iv.frequency}</span>
                      <span className="text-slate">·</span>
                      <span className="text-slate italic">{iv.provider}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={!problem.trim()} className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed">Add Goal to Plan</button>
              <button onClick={onCancel} className="px-4 py-2 border border-border text-slate text-sm rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Goal Row ─────────────────────────────────────────────────────────────────

function GoalRow({
  goal, readOnly, onStatusChange,
}: {
  goal: ExtGoal;
  readOnly?: boolean;
  onStatusChange: (id: string, status: TreatmentGoal['status']) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isOverdueGoal = isOverdue(goal.targetDate) && goal.status !== 'Met';
  const dim = goal.asamDimension ? dimMeta(goal.asamDimension) : null;

  return (
    <div className={`border rounded-lg mb-2 overflow-hidden ${isOverdueGoal ? 'border-red-200 bg-red-50/30' : 'border-border'}`}>
      <div className="flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex-none mt-0.5">
          {goal.status === 'Met'
            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
            : goal.status === 'In Progress'
              ? <TrendingUp className="w-4 h-4 text-blue-500" />
              : <Clock className="w-4 h-4 text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold text-sm text-navy leading-tight">{goal.problem}</div>
            <div className="flex items-center gap-1.5 flex-none">
              {dim && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${dim.color}`}>{dim.key}</span>
              )}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[goal.status]}`}>{goal.status}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </div>
          </div>
          <div className={`text-[10px] mt-0.5 font-medium flex items-center gap-1 ${isOverdueGoal ? 'text-red-600' : 'text-slate'}`}>
            <Calendar className="w-3 h-3" />
            {isOverdueGoal ? '⚠ OVERDUE — ' : 'Target: '}{goal.targetDate}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-white px-4 py-3 space-y-3">
          <div>
            <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Long-Term Goal (3–6 Month)</div>
            <p className="text-sm text-navy">{goal.longTerm}</p>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Short-Term Objective (This Week)</div>
            <p className="text-sm text-navy">{goal.shortTerm}</p>
          </div>
          {(goal as ExtGoal).measurableObjective && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
              <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">Measurable Outcome Indicator</div>
              <p className="text-xs text-green-900">{(goal as ExtGoal).measurableObjective}</p>
            </div>
          )}
          {(goal as ExtGoal).interventions && (goal as ExtGoal).interventions!.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-1.5">Interventions</div>
              <div className="space-y-1">
                {(goal as ExtGoal).interventions!.map((iv, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-slate-50 rounded px-2.5 py-1.5 border border-border">
                    <ChevronRight className="w-3 h-3 text-orange shrink-0" />
                    <span className="font-medium text-navy">{iv.modality}</span>
                    <span className="text-slate">·</span>
                    <span className="text-slate">{iv.frequency}</span>
                    <span className="text-slate ml-auto italic text-[11px]">{iv.provider}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!readOnly && (
            <div className="flex gap-2 flex-wrap pt-1">
              {(['Not Started', 'In Progress', 'Met'] as TreatmentGoal['status'][]).map(s => (
                <button key={s} onClick={() => onStatusChange(goal.id, s)} className={`text-xs font-semibold px-3 py-1.5 rounded border transition-colors ${goal.status === s ? s === 'Met' ? 'bg-green-500 text-white border-green-500' : s === 'In Progress' ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-600 text-white border-slate-600' : 'bg-white text-slate border-border hover:bg-slate-50'}`}>{s}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Patient Plan Card ────────────────────────────────────────────────────────

function PatientPlanCard({
  patient, readOnly, goalStatuses, onStatusChange, sessionGoals = [], onAddGoal,
}: {
  patient: Patient;
  readOnly?: boolean;
  goalStatuses: Record<string, TreatmentGoal['status']>;
  onStatusChange: (id: string, status: TreatmentGoal['status']) => void;
  sessionGoals?: ExtGoal[];
  onAddGoal?: (g: ExtGoal) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [clientSig, setClientSig] = useState<SignatureRecord | null>(null);
  const [clinicianSig, setClinicianSig] = useState<SignatureRecord | null>(null);
  const [sigModal, setSigModal] = useState<'client' | 'staff' | null>(null);

  const goals = [...getGoals(patient), ...sessionGoals].map(g => ({ ...g, status: goalStatuses[g.id] ?? g.status }));
  const metCount = goals.filter(g => g.status === 'Met').length;
  const inProgressCount = goals.filter(g => g.status === 'In Progress').length;
  const notStartedCount = goals.filter(g => g.status === 'Not Started').length;
  const progress = goals.length === 0 ? 0 : (metCount / goals.length) * 100;
  const nextReview = REVIEW_INTERVALS[patient.id];
  const reviewOverdue = nextReview && isOverdue(nextReview);
  const reviewSoon = nextReview && isDueWithin7(nextReview);

  // Group goals by ASAM dimension
  const dimOrder: (AsamDim | 'Other')[] = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'Other'];
  const grouped: Record<string, ExtGoal[]> = {};
  for (const g of goals as ExtGoal[]) {
    const k = g.asamDimension ?? 'Other';
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(g);
  }

  if (goals.length === 0 && !onAddGoal) return null;

  if (goals.length === 0 && onAddGoal) {
    return (
      <div className="bg-white border border-dashed border-blue-300 rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="flex items-center gap-4 p-4">
          <PatientAvatar first={patient.firstName} last={patient.lastName} program={patient.program} size="md" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-navy">{patient.firstName} {patient.lastName}</span>
              <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{patient.program}</span>
              <span className="text-[10px] text-slate font-mono">{patient.mrn}</span>
            </div>
            <div className="text-xs text-slate mt-0.5">Pending Intake — No treatment goals yet</div>
          </div>
        </div>
        <div className="border-t border-dashed border-blue-200 px-4 py-3 bg-blue-50/30 space-y-2">
          {!readOnly && (
            <>
              {showAiPanel && (
                <AiGoalSuggestions
                  patient={patient}
                  onSelect={(g) => { onAddGoal(g); }}
                  onDismiss={() => setShowAiPanel(false)}
                />
              )}
              {showAddForm ? (
                <AsamGoalBuilder patient={patient} onSave={(g) => { onAddGoal(g); setShowAddForm(false); }} onCancel={() => setShowAddForm(false)} />
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setShowAiPanel(true); }} className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-lg hover:bg-violet-100 transition-colors">
                    <Sparkles className="w-3.5 h-3.5" /> AI Suggest Goals
                  </button>
                  <button onClick={() => setShowAddForm(true)} className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Goal (ASAM Builder)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-xl shadow-sm overflow-hidden mb-4 ${reviewOverdue ? 'border-red-300' : reviewSoon ? 'border-amber-300' : 'border-border'}`}>
      <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <PatientAvatar first={patient.firstName} last={patient.lastName} program={patient.program} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-navy">{patient.firstName} {patient.lastName}</span>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate px-2 py-0.5 rounded-full">{patient.program}</span>
            <span className="text-[10px] text-slate font-mono">{patient.mrn}</span>
          </div>
          <div className="text-xs text-slate mt-0.5">{patient.counselor.split(',')[0]} · LOS {patient.los}d</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[160px]">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] font-semibold text-green-600">{metCount}/{goals.length} goals met</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-center">
          <div><div className="text-lg font-bold text-green-600">{metCount}</div><div className="text-[10px] text-slate uppercase">Met</div></div>
          <div><div className="text-lg font-bold text-blue-500">{inProgressCount}</div><div className="text-[10px] text-slate uppercase">Active</div></div>
          <div><div className="text-lg font-bold text-slate">{notStartedCount}</div><div className="text-[10px] text-slate uppercase">Not Started</div></div>
        </div>
        <div className="flex-none text-center">
          <div className={`text-xs font-semibold px-2 py-1 rounded ${reviewOverdue ? 'bg-red-100 text-red-700' : reviewSoon ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate'}`}>
            {reviewOverdue ? '⚠ Overdue' : reviewSoon ? 'Due Soon' : 'On Track'}
          </div>
          {nextReview && <div className="text-[10px] text-slate mt-0.5">{nextReview}</div>}
        </div>
        <div className="flex-none">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4 bg-slate-50/40 space-y-4">
          {/* ASAM score summary strip */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider mr-1">ASAM Scores:</span>
            {ASAM_DIMS.map(d => {
              const score = (patient.asam as Record<string, number>)[d.key.toLowerCase()] ?? 0;
              return (
                <div key={d.key} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${d.color}`}>
                  <span>{d.key}</span>
                  <span className="font-mono">{score}</span>
                  <div className="flex gap-0.5 ml-0.5">
                    {[0,1,2,3,4].map(n => <div key={n} className={`w-1.5 h-1.5 rounded-full ${n < score ? d.dot : 'bg-white/60'}`} />)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI + Add controls */}
          {!readOnly && onAddGoal && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setShowAiPanel(s => !s); setShowAddForm(false); }}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${showAiPanel ? 'bg-violet-100 text-violet-700 border-violet-300' : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'}`}
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Suggest Goals
              </button>
              <button
                onClick={() => { setShowAddForm(s => !s); setShowAiPanel(false); }}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${showAddForm ? 'bg-navy text-white border-navy' : 'border-border text-slate hover:bg-slate-100'}`}
              >
                <Plus className="w-3.5 h-3.5" /> Add Goal (ASAM Builder)
              </button>
            </div>
          )}

          {/* AI suggestions panel */}
          {showAiPanel && onAddGoal && !readOnly && (
            <AiGoalSuggestions
              patient={patient}
              onSelect={(g) => { onAddGoal(g); }}
              onDismiss={() => setShowAiPanel(false)}
            />
          )}

          {/* ASAM builder */}
          {showAddForm && onAddGoal && !readOnly && (
            <AsamGoalBuilder
              patient={patient}
              onSave={(g) => { onAddGoal(g); setShowAddForm(false); }}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* Goals grouped by ASAM dimension */}
          {dimOrder.map(dimKey => {
            const dimGoals = grouped[dimKey];
            if (!dimGoals || dimGoals.length === 0) return null;
            const meta = dimKey !== 'Other' ? dimMeta(dimKey as AsamDim) : null;
            return (
              <div key={dimKey}>
                <div className={`flex items-center gap-2 mb-2 pb-1 border-b ${meta ? 'border-b-' + dimKey : 'border-border'}`}>
                  {meta
                    ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${meta.color}`}>{meta.key}</span>
                    : <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Other Goals</span>}
                  {meta && <span className="text-xs text-slate">{meta.label.replace(meta.key + ' — ', '')}</span>}
                </div>
                {dimGoals.map(g => (
                  <GoalRow key={g.id} goal={g} readOnly={readOnly} onStatusChange={onStatusChange} />
                ))}
              </div>
            );
          })}

          {/* Signatures */}
          <div className="mt-2 pt-4 border-t border-border">
            <div className="text-[10px] font-bold text-slate uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <PenTool className="w-3 h-3" /> Treatment Plan Signatures
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-teal-200 rounded-xl p-3 space-y-2">
                <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wide">Client Signature</div>
                <div className="text-xs text-slate">Client agrees to and acknowledges this treatment plan.</div>
                {clientSig ? <SignedBadge record={clientSig} /> : (
                  <LockedButton locked={readOnly} editRoles={readOnly ? [] : ['Primary Counselor', 'Certified Clinician', 'Clinical Supervisor']} onClick={() => setSigModal('client')} className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold w-full text-center">
                    Collect Client Signature
                  </LockedButton>
                )}
              </div>
              <div className="border border-border rounded-xl p-3 space-y-2">
                <div className="text-[10px] font-bold text-slate uppercase tracking-wide">Clinician Signature</div>
                <div className="text-xs text-slate">Clinician authorizes this treatment plan.</div>
                {clinicianSig ? <SignedBadge record={clinicianSig} /> : (
                  <LockedButton locked={readOnly} editRoles={readOnly ? [] : ['Primary Counselor', 'Certified Clinician', 'Clinical Supervisor']} onClick={() => setSigModal('staff')} className="text-xs px-3 py-1.5 bg-navy text-white rounded-lg hover:bg-navy/90 font-semibold w-full text-center">
                    Sign Treatment Plan
                  </LockedButton>
                )}
              </div>
            </div>
          </div>

          <SignatureModal
            isOpen={!!sigModal}
            onClose={() => setSigModal(null)}
            signerType={sigModal ?? 'staff'}
            title={sigModal === 'client' ? 'Client Treatment Plan Signature' : 'Clinician Treatment Plan Signature'}
            documentTitle={`Treatment Plan — ${patient.firstName} ${patient.lastName}`}
            onSign={(record) => {
              if (sigModal === 'client') setClientSig(record);
              else setClinicianSig(record);
              setSigModal(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type FilterTab = 'All' | 'Due for Review' | 'Overdue' | 'Needs Goals';

export function TreatmentPlans({ navigate, readOnly }: { navigate: (s: Screen) => void; readOnly?: boolean }) {
  const editRoles = getRolesWithEditAccess('TreatmentPlans');
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [planSaved, setPlanSaved] = useState<string | null>(null);
  const savePlan = (msg: string) => { setPlanSaved(msg); setTimeout(() => setPlanSaved(null), 2500); };
  const [planView, setPlanView] = useState<'Plans' | 'Goal Analytics' | 'ASAM Goal Library' | 'Outcomes' | 'Evidence Base' | 'Compliance Checklist'>('Plans');
  const [search, setSearch] = useState('');
  const [goalStatuses, setGoalStatuses] = useState<Record<string, TreatmentGoal['status']>>({});
  const { goals: sessionGoals, addGoal } = useSessionChart();
  const demoPatient = MOCK_PATIENTS.find(p => p.id === 'p_demo');

  const handleStatusChange = (id: string, status: TreatmentGoal['status']) => {
    setGoalStatuses(prev => ({ ...prev, [id]: status }));
  };

  const allGoals = MOCK_PATIENTS.flatMap(p => getGoals(p).map(g => ({ ...g, status: goalStatuses[g.id] ?? g.status })));
  const metGoals = allGoals.filter(g => g.status === 'Met').length;
  const dueForReview = MOCK_PATIENTS.filter(p => { const nr = REVIEW_INTERVALS[p.id]; return nr && isDueWithin7(nr); }).length;
  const overdueCount = MOCK_PATIENTS.filter(p => { const nr = REVIEW_INTERVALS[p.id]; return nr && isOverdue(nr); }).length;
  const needsGoalsCount = MOCK_PATIENTS.filter(p => getGoals(p).length === 0).length;

  const filtered = MOCK_PATIENTS.filter(p => {
    const goals = getGoals(p);
    const searchMatch = search === '' || `${p.firstName} ${p.lastName} ${p.mrn}`.toLowerCase().includes(search.toLowerCase());
    if (!searchMatch) return false;
    if (activeTab === 'Due for Review') { const nr = REVIEW_INTERVALS[p.id]; return !!(nr && isDueWithin7(nr)); }
    if (activeTab === 'Overdue') { const nr = REVIEW_INTERVALS[p.id]; return !!(nr && isOverdue(nr)); }
    if (activeTab === 'Needs Goals') return goals.length === 0;
    return goals.length > 0;
  });

  const completionRate = allGoals.length > 0 ? Math.round((metGoals / allGoals.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-500" /> Treatment Plans
          </h1>
          <p className="text-slate text-sm mt-1">ASAM 6-dimension framework · AI-assisted goal builder · Measurable objectives & interventions</p>
        </div>
        <LockedButton locked={readOnly} onClick={() => savePlan('Batch update applied')} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded font-medium shadow-sm hover:bg-navy/90 transition-colors text-sm">
          <PenTool className="w-4 h-4" /> Batch Update Plans
        </LockedButton>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Due for Review (7d)', value: dueForReview, color: 'text-amber-600', border: 'border-amber-400', icon: Clock },
          { label: 'Overdue Reviews', value: overdueCount, color: 'text-red-600', border: 'border-red-400', icon: AlertTriangle },
          { label: 'Goals Met', value: metGoals, color: 'text-green-600', border: 'border-green-400', icon: CheckCircle2 },
          { label: 'Completion Rate', value: `${completionRate}%`, color: 'text-navy', border: 'border-navy/30', icon: BarChart3 },
        ].map(k => (
          <div key={k.label} className={`bg-white border-l-4 ${k.border} rounded-lg shadow-sm p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate uppercase tracking-wider">{k.label}</div>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ASAM dimension legend */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-bold text-slate uppercase tracking-wider">ASAM Dimensions:</span>
        {ASAM_DIMS.map(d => (
          <span key={d.key} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${d.color}`}>{d.key} · {d.short}</span>
        ))}
      </div>

      {/* View tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {(['Plans', 'Goal Analytics', 'ASAM Goal Library', 'Outcomes', 'Evidence Base', 'Compliance Checklist'] as const).map(v => (
          <button key={v} onClick={() => setPlanView(v)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${planView === v ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{v}</button>
        ))}
      </div>

      {/* ── Plans view ── */}
      {planView === 'Plans' && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
              <div className="flex gap-1 overflow-x-auto">
                {(['All', 'Due for Review', 'Overdue', 'Needs Goals'] as FilterTab[]).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm font-semibold rounded whitespace-nowrap transition-colors ${activeTab === t ? 'bg-navy text-white' : 'text-slate hover:bg-slate-100 hover:text-navy'}`}>
                    {t}
                    {t === 'Overdue' && overdueCount > 0 && <span className="ml-1 bg-red-600 text-white text-[10px] px-1 rounded-full">{overdueCount}</span>}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or MRN…" className="pl-9 pr-4 py-2 bg-bg border border-border rounded text-sm focus:outline-none focus:border-blue-400 w-60" />
              </div>
            </div>
            <div className="p-4">
              {demoPatient && (
                <PatientPlanCard key="p_demo" patient={demoPatient} readOnly={readOnly} goalStatuses={goalStatuses} onStatusChange={handleStatusChange} sessionGoals={(sessionGoals['p_demo'] ?? []) as ExtGoal[]} onAddGoal={(g) => addGoal('p_demo', g as TreatmentGoal)} />
              )}
              {filtered.filter(p => p.id !== 'p_demo').map(p => (
                <PatientPlanCard key={p.id} patient={p} readOnly={readOnly} goalStatuses={goalStatuses} onStatusChange={handleStatusChange} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ASAM Goal Library ── */}
      {planView === 'ASAM Goal Library' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Preloaded goal bank organized by ASAM dimension — reflects current clinical standards across ICANotes, Kipu, TheraNest, and SAMHSA treatment guidelines. Goals are SMART: specific, measurable, achievable, relevant, time-limited.</div>
          {ASAM_DIMS.map(d => (
            <div key={d.key} className="card">
              <div className={`flex items-center gap-2 mb-4 pb-3 border-b border-border`}>
                <span className={`text-xs font-bold px-2.5 py-1 rounded border ${d.color}`}>{d.key}</span>
                <h3 className="font-bold text-navy text-sm">{d.label}</h3>
                <span className="text-[10px] text-slate ml-auto">{GOAL_LIBRARY[d.key].length} goal templates</span>
              </div>
              <div className="space-y-3">
                {GOAL_LIBRARY[d.key].map((t, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 hover:border-orange/40 transition-colors">
                    <div className="font-semibold text-navy text-sm mb-1">{t.problem}</div>
                    <div className="text-xs text-slate mb-1.5 leading-relaxed"><span className="font-semibold text-navy">Goal:</span> {t.longTerm}</div>
                    <div className="text-xs text-slate mb-1.5"><span className="font-semibold text-navy">Weekly objective:</span> {t.shortTerm}</div>
                    <div className="text-xs bg-green-50 border border-green-200 rounded px-2 py-1 mb-2 text-green-800"><span className="font-semibold">Measure:</span> {t.measurableObjective}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {t.interventions.map((iv, j) => (
                        <span key={j} className="text-[10px] bg-slate-100 text-slate px-2 py-0.5 rounded font-medium">{iv.modality} · {iv.frequency} · <em>{iv.provider}</em></span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.tags.map(tag => <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded">{tag}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Goal Analytics ── */}
      {planView === 'Goal Analytics' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Aggregate goal achievement analysis across all active treatment plans — completion trends, ASAM dimension coverage, and documentation compliance.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Goals Met (Overall)', value: `${completionRate}%`, color: 'text-green-600', sub: `${metGoals} of ${allGoals.length} goals` },
              { label: 'Overdue Reviews', value: overdueCount, color: 'text-red-600', sub: 'Past 7-day review window' },
              { label: 'Due This Week', value: dueForReview, color: 'text-amber-600', sub: 'Upcoming review deadline' },
              { label: 'Plans Without Goals', value: needsGoalsCount, color: 'text-red-600', sub: 'Need initial goal-setting' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Goal Achievement by ASAM Dimension</h3>
              <div className="space-y-3 text-xs">
                {[
                  { dim: 'D1 — Withdrawal', met: 11, total: 12, color: 'bg-red-500' },
                  { dim: 'D2 — Biomedical', met: 8, total: 10, color: 'bg-orange-500' },
                  { dim: 'D3 — Mental Health / Behavioral', met: 9, total: 15, color: 'bg-purple-500' },
                  { dim: 'D4 — Readiness to Change', met: 6, total: 10, color: 'bg-blue-500' },
                  { dim: 'D5 — Relapse Risk', met: 14, total: 18, color: 'bg-amber-500' },
                  { dim: 'D6 — Recovery Environment', met: 7, total: 12, color: 'bg-teal-500' },
                ].map(d => {
                  const pct = Math.round((d.met / d.total) * 100);
                  return (
                    <div key={d.dim}>
                      <div className="flex justify-between mb-1"><span className="text-slate">{d.dim}</span><span className="font-semibold text-navy">{d.met}/{d.total} ({pct}%)</span></div>
                      <div className="h-2 bg-gray-100 rounded-full"><div className={`h-2 rounded-full ${d.color}`} style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Review Compliance by Clinician</h3>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border text-slate"><th className="text-left py-2 text-[10px] font-bold uppercase">Clinician</th><th className="text-center py-2 text-[10px] font-bold uppercase">Plans</th><th className="text-center py-2 text-[10px] font-bold uppercase">On Time</th><th className="text-center py-2 text-[10px] font-bold uppercase">Overdue</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { name: 'Sarah Jenkins, LPC', plans: 5, onTime: 5, overdue: 0 },
                      { name: 'David Odom, LMFT', plans: 4, onTime: 3, overdue: 1 },
                      { name: 'Marcus Chen, CAC-AD', plans: 4, onTime: 2, overdue: 2 },
                      { name: 'Priya Nair, MSW', plans: 3, onTime: 3, overdue: 0 },
                    ].map(r => (
                      <tr key={r.name} className="hover:bg-gray-50">
                        <td className="py-2 font-medium text-navy">{r.name}</td>
                        <td className="py-2 text-center text-slate">{r.plans}</td>
                        <td className="py-2 text-center text-green-600 font-semibold">{r.onTime}</td>
                        <td className="py-2 text-center"><span className={`font-semibold ${r.overdue > 0 ? 'text-red-600' : 'text-slate'}`}>{r.overdue}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <strong>CARF:</strong> Reviews every 7 days (residential), 14 days (PHP), 30 days (IOP). Overdue reviews must be completed before the next CARF survey visit.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Outcomes ── */}
      {planView === 'Outcomes' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Treatment plan goal attainment outcomes — measures clinician effectiveness and patient engagement across the current census.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Goals Met (Discharge)', value: '74%', color: 'text-green-600', sub: 'Of all goals at d/c assessment' },
              { label: 'Avg Goals Per Plan', value: '4.2', color: 'text-navy', sub: 'Recommended: 3–6 goals' },
              { label: 'Plan Update Compliance', value: '91%', color: 'text-blue-600', sub: 'Updated per required schedule' },
              { label: 'Patient-Rated Relevance', value: '4.3/5', color: 'text-teal-600', sub: 'Survey: n=29 responses' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Goal Attainment by Domain</h3>
            <div className="space-y-2.5 text-xs">
              {[
                { domain: 'Substance Use / Abstinence', met: 78, color: 'bg-teal-500' },
                { domain: 'Safety & Crisis Stabilization', met: 91, color: 'bg-green-500' },
                { domain: 'Mental Health / Psychiatric Stability', met: 69, color: 'bg-purple-500' },
                { domain: 'MAT Engagement & Compliance', met: 88, color: 'bg-blue-500' },
                { domain: 'Family & Social Support', met: 62, color: 'bg-orange-400' },
                { domain: 'Employment & Vocational', met: 44, color: 'bg-amber-500' },
                { domain: 'Housing & Basic Needs', met: 71, color: 'bg-navy' },
                { domain: 'Aftercare Plan Completion', met: 81, color: 'bg-pink-400' },
              ].map(d => (
                <div key={d.domain}>
                  <div className="flex justify-between mb-0.5"><span className="text-slate">{d.domain}</span><span className="font-bold text-navy">{d.met}% attained</span></div>
                  <div className="h-1.5 bg-gray-100 rounded-full"><div className={`h-1.5 rounded-full ${d.color}`} style={{ width: `${d.met}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Evidence Base ── */}
      {planView === 'Evidence Base' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Evidence-based treatment modalities used at Sunrise — efficacy summaries and appropriate populations.</div>
          <div className="card">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border bg-gray-50">{['Modality', 'Applies To', 'Evidence Level', 'Typical Duration', 'Key Outcomes', 'Who Delivers'].map(h => <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-border">
                {[
                  { m: 'Motivational Interviewing (MI)', applies: 'All SUD, ambivalent patients', ev: 'Level I', dur: '1–4 sessions/focus area', out: 'Engagement, retention, readiness to change', who: 'Counselors, CPRS' },
                  { m: 'Cognitive Behavioral Therapy (CBT)', applies: 'AUD, OUD, stimulant; co-occurring MDD', ev: 'Level I', dur: '12–16 sessions individual/group', out: 'Reduced use, relapse prevention, coping skills', who: 'LPC, LCSW, LMFT' },
                  { m: 'Dialectical Behavior Therapy (DBT)', applies: 'BPD, emotional dysregulation, self-harm', ev: 'Level I', dur: '6–12 month program', out: 'Emotion regulation, distress tolerance', who: 'DBT-trained clinicians' },
                  { m: 'Contingency Management (CM)', applies: 'Stimulant, cannabis, polysubstance', ev: 'Level I', dur: '12–24 weeks; incentive-based', out: 'Abstinence rates, treatment attendance', who: 'CM-trained counselors' },
                  { m: 'Seeking Safety', applies: 'Co-occurring PTSD+SUD', ev: 'Level II', dur: '25 session curriculum', out: 'PTSD reduction, substance use reduction', who: 'Trauma-trained counselors' },
                  { m: 'EMDR', applies: 'Trauma history; PTSD with SUD', ev: 'Level I (PTSD)', dur: '8–12 sessions individual', out: 'Trauma resolution, reduced cravings', who: 'EMDR-certified clinicians' },
                  { m: 'Twelve-Step Facilitation (TSF)', applies: 'All SUD', ev: 'Level I', dur: '12–15 sessions + ongoing AA/NA', out: 'Affiliation, long-term abstinence', who: 'Counselors + CPRS' },
                ].map(r => (
                  <tr key={r.m} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-navy">{r.m}</td>
                    <td className="px-3 py-2 text-slate">{r.applies}</td>
                    <td className="px-3 py-2"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">{r.ev}</span></td>
                    <td className="px-3 py-2 text-slate">{r.dur}</td>
                    <td className="px-3 py-2 text-slate">{r.out}</td>
                    <td className="px-3 py-2 text-slate">{r.who}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Compliance Checklist ── */}
      {planView === 'Compliance Checklist' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">CARF and state licensure documentation requirements — use as a pre-completion checklist before signing.</div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Plans Meeting All Criteria', value: '18 / 22', color: 'text-green-600', sub: '82% compliance rate' },
              { label: 'Missing Signatures', value: 3, color: 'text-amber-600', sub: 'Counselor or MD cosign needed' },
              { label: 'Overdue for Review', value: 4, color: 'text-red-600', sub: '30-day update window exceeded' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Required Elements — CARF Standard QI.M.1 / MD BHA Licensure</h3>
            <div className="space-y-1.5 text-xs">
              {[
                { item: 'Problem/need statement grounded in biopsychosocial assessment and ASAM dimensions', req: 'CARF + State', done: true },
                { item: 'Measurable, time-limited goals with target dates and ASAM dimension reference', req: 'CARF + State', done: true },
                { item: 'Specific, observable objectives with measurable outcome indicators for each goal', req: 'CARF + State', done: true },
                { item: 'Interventions linked to each objective (modality, frequency, provider)', req: 'CARF + State', done: true },
                { item: 'Person-served input documented and signature obtained', req: 'CARF + State', done: false },
                { item: 'Counselor signature and credentials', req: 'CARF + State', done: false },
                { item: 'MD/DO review and cosign (within 72h of admission)', req: 'State only', done: true },
                { item: 'Crisis plan / safety plan linked or embedded', req: 'CARF', done: true },
                { item: 'Cultural/linguistic needs addressed', req: 'CARF', done: true },
                { item: 'Review frequency specified (min 7d residential / 30d IOP)', req: 'State only', done: false },
                { item: '30-day review completed and documented with progress rating', req: 'State only', done: true },
              ].map(r => (
                <div key={r.item} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${r.done ? 'text-green-500' : 'text-red-400'}`}>{r.done ? '✓' : '✗'}</span>
                    <span className={r.done ? 'text-navy' : 'text-red-700 font-medium'}>{r.item}</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate bg-gray-100 px-1.5 py-0.5 rounded shrink-0 ml-2">{r.req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {planSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <span>✓</span> {planSaved}
        </div>
      )}
    </div>
  );
}
