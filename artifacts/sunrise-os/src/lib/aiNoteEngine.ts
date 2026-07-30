/**
 * aiNoteEngine.ts
 *
 * Template-based clinical note draft generator.
 * No external LLM calls — all generation is local.
 * Produces structured draft text for clinical staff to review, edit, and approve.
 */

export type NoteFormat = 'BIRP' | 'DAP' | 'SOAP' | 'GIRP';

// ─── Input types ──────────────────────────────────────────────────────────────

export interface ProgressNoteInput {
  clientName: string;
  noteType?: string;           // Individual | Group | Medical | Nursing | Psychiatric
  counselorName?: string;
  sessionDate?: string;

  // Section 1 — Behavioral observation / subjective / goal
  presentation?: string;       // e.g. "calm and engaged", "guarded", "tearful"
  mood?: string;               // e.g. "anxious", "euthymic"
  moodRating?: string;         // e.g. "7/10"
  presentingConcern?: string;  // what the client brought to session
  patientReports?: string;     // SOAP: chief complaint / subjective report
  objectiveFindings?: string;  // SOAP: vital signs, scores, MSE observations
  goalAddressed?: string;      // GIRP: treatment goal being targeted

  // Section 2 — Intervention
  modality?: string;           // MI, CBT, DBT, Psychoeducation, etc.
  interventions?: string;      // free-text list of interventions
  interventionDetail?: string; // extra detail

  // Section 3 — Response / Assessment
  engagementLevel?: 'Active' | 'Moderate' | 'Passive' | 'Minimal';
  clientResponse?: string;     // client's response to intervention
  siHiStatus?: string;         // None | Passive ideation | Active ideation, etc.
  safetyPlanStatus?: string;   // Current | Updated | Not Applicable
  clinicalAssessment?: string; // clinician's interpretation
  progressNarrative?: string;  // narrative about progress toward goals
  riskFactors?: string;

  // Section 4 — Plan
  plan?: string;
  sessionFrequency?: string;   // weekly, twice-weekly, etc.
  nextSessionGoal?: string;
  homework?: string;
  followUpTiming?: string;
  coordinationNote?: string;
}

export interface GroupNoteInput {
  groupName: string;
  groupType: string;
  topic: string;
  objectives: string[];
  facilitator: string;
  attendance: number;
  expectedCensus: number;
  program?: string;
  groupDynamics?: string;
  notableThemes?: string;
  participantHighlights?: string;
  followUpActions?: string;
}

// ─── Engagement helpers ───────────────────────────────────────────────────────

function engagement(level?: ProgressNoteInput['engagementLevel']): string {
  switch (level) {
    case 'Active':
      return 'engaged actively throughout the session, demonstrating good insight and receptiveness to feedback';
    case 'Moderate':
      return 'engaged at a moderate level, participating with occasional prompting';
    case 'Passive':
      return 'was present but participated minimally; required consistent prompting and redirection';
    case 'Minimal':
      return 'demonstrated minimal engagement; barriers to participation were explored and will be addressed in follow-up';
    default:
      return 'participated in the session at a moderate level';
  }
}

function eyeContact(level?: ProgressNoteInput['engagementLevel']): string {
  switch (level) {
    case 'Active':   return 'consistently';
    case 'Moderate': return 'intermittently';
    case 'Passive':  return 'minimally';
    case 'Minimal':  return 'rarely';
    default:         return 'intermittently';
  }
}

function siHiClause(status?: string): string {
  if (!status || status === 'None' || status.toLowerCase() === 'none') return 'Denies SI/HI';
  return status;
}

function safetyPlanClause(status?: string): string {
  if (!status || status === 'Not Applicable') return '';
  return ` Safety plan ${status.toLowerCase()}.`;
}

function planClause(i: ProgressNoteInput): string {
  const base = i.plan || `Continue ${i.sessionFrequency ?? 'weekly'} ${i.noteType?.toLowerCase() ?? 'individual'} sessions`;
  const next = i.nextSessionGoal ? ` Goal for next session: ${i.nextSessionGoal}.` : '';
  const hw = i.homework ? ` Homework assigned: ${i.homework}.` : '';
  const coord = i.coordinationNote ? ` Coordinate with ${i.coordinationNote}.` : '';
  const fu = i.followUpTiming ? ` Follow up in ${i.followUpTiming}.` : '';
  return `${base}.${next}${hw}${coord}${fu}`.trim();
}

// ─── BIRP ─────────────────────────────────────────────────────────────────────

function generateBIRP(i: ProgressNoteInput): Record<string, string> {
  const name = i.clientName || 'Client';
  const pres = i.presentation ? i.presentation.toLowerCase() : 'calm and cooperative';
  const mood = i.mood ? ` Mood described as ${i.mood.toLowerCase()}.` : '';
  const rating = i.moodRating ? ` Self-rated ${i.moodRating}.` : '';
  const concern = i.presentingConcern ? ` Reports ${i.presentingConcern}.` : '';
  const modality = i.modality || 'supportive counseling';
  const interventions = i.interventions || 'Active listening, reflective questioning, and therapeutic reflection';
  const detail = i.interventionDetail ? ` ${i.interventionDetail}` : '';

  return {
    'B — Behavior': `${name} presented as ${pres} and made eye contact ${eyeContact(i.engagementLevel)}.${mood}${rating}${concern}`,
    'I — Intervention': `${interventions} utilizing ${modality} approach.${detail}`,
    'R — Response': `${name} ${engagement(i.engagementLevel)}. ${siHiClause(i.siHiStatus)}.${safetyPlanClause(i.safetyPlanStatus)}${i.clientResponse ? ' ' + i.clientResponse : ''}`,
    'P — Plan': planClause(i),
  };
}

// ─── DAP ──────────────────────────────────────────────────────────────────────

function generateDAP(i: ProgressNoteInput): Record<string, string> {
  const name = i.clientName || 'Client';
  const sessionType = i.noteType?.toLowerCase() ?? 'individual';
  const pres = i.presentation ? i.presentation.toLowerCase() : 'appropriate for context';
  const mood = i.mood ? ` Mood appeared ${i.mood.toLowerCase()}.` : '';
  const rating = i.moodRating ? ` Self-rated ${i.moodRating}.` : '';
  const concern = i.presentingConcern ? ` Presenting concern: ${i.presentingConcern}.` : '';
  const interventions = i.interventions || 'therapeutic interventions as clinically indicated';
  const detail = i.interventionDetail ? `; ${i.interventionDetail}` : '';
  const siHi = ` ${siHiClause(i.siHiStatus)}.`;
  const sp = safetyPlanClause(i.safetyPlanStatus);

  const assessment =
    i.clinicalAssessment ||
    i.progressNarrative ||
    `${name} is demonstrating ${i.engagementLevel === 'Active' ? 'strong' : i.engagementLevel === 'Passive' || i.engagementLevel === 'Minimal' ? 'limited' : 'moderate'} engagement with treatment. ${i.riskFactors ? 'Risk factors noted: ' + i.riskFactors + '.' : 'No acute safety concerns identified.'}`;

  return {
    'D — Data': `${name} attended ${sessionType} session and presented as ${pres}.${mood}${rating}${concern} Interventions: ${interventions}${detail}.${siHi}${sp}`,
    'A — Assessment': assessment,
    'P — Plan': planClause(i),
  };
}

// ─── SOAP ─────────────────────────────────────────────────────────────────────

function generateSOAP(i: ProgressNoteInput): Record<string, string> {
  const name = i.clientName || 'Client';
  const reports = i.patientReports || i.presentingConcern || 'no acute concerns at time of session';
  const mood = i.mood ? ` Mood: ${i.mood}.` : '';
  const rating = i.moodRating ? ` Rated ${i.moodRating}.` : '';
  const objective =
    i.objectiveFindings ||
    `Mental status: appearance appropriate, behavior cooperative, speech normal rate/rhythm. Thought process: linear and goal-directed. ${siHiClause(i.siHiStatus)}.`;
  const assessment =
    i.clinicalAssessment ||
    i.progressNarrative ||
    `${name} presenting with stable psychiatric picture. ${i.riskFactors ? 'Risk factors: ' + i.riskFactors + '.' : 'No acute safety concerns.'}`;

  return {
    'S — Subjective': `${name} reports ${reports}.${mood}${rating} Engagement level: ${i.engagementLevel ?? 'Moderate'}.`,
    'O — Objective': objective,
    'A — Assessment': assessment,
    'P — Plan': planClause(i),
  };
}

// ─── GIRP ─────────────────────────────────────────────────────────────────────

function generateGIRP(i: ProgressNoteInput): Record<string, string> {
  const name = i.clientName || 'Client';
  const goal = i.goalAddressed || 'Treatment goal as identified in current treatment plan';
  const interventions = i.interventions || 'Evidence-based therapeutic interventions';
  const modalityClause = i.modality ? ` using ${i.modality}` : '';
  const detail = i.interventionDetail ? ` ${i.interventionDetail}` : '';
  const sp = safetyPlanClause(i.safetyPlanStatus);
  const siHi = ` ${siHiClause(i.siHiStatus)}.${sp}`;
  const response = i.clientResponse ? ` ${i.clientResponse}` : '';

  return {
    'G — Goal': goal,
    'I — Intervention': `${interventions}${modalityClause}.${detail}`,
    'R — Response': `${name} ${engagement(i.engagementLevel)}.${siHi}${response}`,
    'P — Plan': planClause(i),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a progress note draft as a map of { sectionLabel → text }.
 * The caller renders each section as an editable textarea.
 */
export function generateProgressNote(
  format: NoteFormat,
  input: ProgressNoteInput,
): Record<string, string> {
  switch (format) {
    case 'BIRP': return generateBIRP(input);
    case 'DAP':  return generateDAP(input);
    case 'SOAP': return generateSOAP(input);
    case 'GIRP': return generateGIRP(input);
  }
}

// ─── Screening Narrative Generator ───────────────────────────────────────────

export interface ScreeningNarrativeInput {
  patientName?: string;
  programType?: string;
  referralSource?: string;
  primaryDrug?: string;
  secondaryDrug?: string;
  psychosisHistory?: string;
  currentPsychosisManaged?: boolean;
  ambulatoryStatus?: string;
  cjInvolved?: boolean | null;
  cjType?: string;
  medicalConditions?: string;
  psychiatricHx?: string;
  requiresMedicalDetox?: boolean;
  exclusionLabels?: string[];
  reviewLabels?: string[];
  vitals?: Record<string, string>;
}

export function generateScreeningNarrative(i: ScreeningNarrativeInput): string {
  const name = i.patientName || 'Client';
  const program = i.programType || 'Residential';
  const referral = i.referralSource ? `, referred from ${i.referralSource.toLowerCase()}` : '';
  const doc = i.primaryDrug || 'substance use';
  const secondary = i.secondaryDrug ? `, with co-occurring ${i.secondaryDrug.toLowerCase()} use noted` : '';

  const psychClause =
    i.psychosisHistory === 'current'
      ? ` Current psychotic symptoms are present and ${i.currentPsychosisManaged ? 'reported as managed on current medications' : 'unmanaged — psychiatric evaluation is required prior to admission'}.`
      : i.psychosisHistory === 'past'
      ? ' History of psychotic episode(s) documented; no active symptoms reported at time of screening.'
      : '';

  const ambClause =
    i.ambulatoryStatus === 'non-ambulatory'
      ? ` Patient is non-ambulatory. ${program === 'Outpatient' ? 'This is an exclusionary criterion for outpatient level of care per program policy.' : 'Residential admission remains appropriate; accessibility accommodations are required throughout stay.'}`
      : i.ambulatoryStatus === 'assistive'
      ? ' Patient ambulates with assistive device; facility accessibility requirements confirmed.'
      : '';

  const medClause = i.medicalConditions ? ` Active medical conditions: ${i.medicalConditions}.` : '';
  const psyHxClause = i.psychiatricHx ? ` Psychiatric history includes: ${i.psychiatricHx}.` : '';
  const detoxClause = i.requiresMedicalDetox
    ? ' Medical detoxification protocol is clinically indicated; physician order required before admission.'
    : '';
  const cjClause = i.cjInvolved
    ? ` Criminal justice involvement noted${i.cjType ? ` (${i.cjType})` : ''}; legal coordination will be required throughout treatment.`
    : '';

  const vitalsArr = [
    i.vitals?.bp && `BP ${i.vitals.bp}`,
    i.vitals?.hr && `HR ${i.vitals.hr}`,
    i.vitals?.temp && `Temp ${i.vitals.temp}°F`,
    i.vitals?.weight && `Wt ${i.vitals.weight}`,
  ].filter(Boolean) as string[];
  const vitalsClause = vitalsArr.length ? ` Admission vitals: ${vitalsArr.join(', ')}.` : '';

  const exclusionNote =
    i.exclusionLabels && i.exclusionLabels.length > 0
      ? `\n\nClinical exclusion flag(s) identified: ${i.exclusionLabels.join('; ')}. Clinical override rationale required from attending physician prior to proceeding with admission.`
      : '';

  const reviewNote =
    i.reviewLabels && i.reviewLabels.length > 0
      ? `\n\nItems requiring interdisciplinary team review: ${i.reviewLabels.join('; ')}.`
      : '';

  const recommendation =
    i.exclusionLabels && i.exclusionLabels.length > 0
      ? 'HOLD admission pending attending physician review and signed override authorization.'
      : `Proceed with ${program.toLowerCase()} admission. Complete remaining clinical instruments and obtain all required consents prior to placement.`;

  const body = `${psychClause}${ambClause}${medClause}${psyHxClause}${detoxClause}${cjClause}${vitalsClause}`.trim();

  return [
    `${name} presents voluntarily for ${program.toLowerCase()} level of care${referral}. Primary presenting concern: ${doc}${secondary}.`,
    body || undefined,
    exclusionNote,
    reviewNote,
    `Clinical Recommendation: ${recommendation}`,
  ].filter(Boolean).join('\n\n');
}

// ─── BPS Field Draft Generator ────────────────────────────────────────────────

export interface BPSContext {
  patientName?: string;
  age?: number;
  primaryDiagnosis?: string;
  primaryDrug?: string;
  psychosisHistory?: string;
  cjInvolved?: boolean | null;
  medicalConditions?: string;
  psychiatricHx?: string;
  phq9Score?: number | null;
  safetRisk?: string | null;
}

export type BPSDraftDomain =
  | 'bio-medHx' | 'bio-familyMedHx' | 'bio-substanceHx'
  | 'psych-mentalHealth' | 'psych-trauma' | 'psych-coping' | 'psych-prevTx'
  | 'social-housing' | 'social-support'
  | 'spiritual'
  | 'formulation-asam' | 'formulation-impression' | 'formulation-txRec';

export function generateBPSDraft(domain: BPSDraftDomain, ctx: BPSContext): string {
  const name = ctx.patientName || 'Client';
  const drug = ctx.primaryDrug || 'primary substance';
  const dx = ctx.primaryDiagnosis || 'Substance Use Disorder';
  const ageStr = ctx.age ? `${ctx.age}-year-old ` : '';

  switch (domain) {
    case 'bio-medHx':
      return `${name} is a ${ageStr}individual presenting with ${ctx.medicalConditions || 'no reported significant medical history at time of screening'}. ${ctx.medicalConditions ? 'Medical conditions noted above will require coordination with medical staff throughout the treatment episode.' : 'No chronic medical conditions, disabilities, or active physical health concerns were reported.'} A comprehensive medication review was completed at admission. Physician assessment required within 24 hours of admission per program policy.`;

    case 'bio-familyMedHx':
      return `Family medical and psychiatric history was explored during the biopsychosocial assessment. ${ctx.primaryDrug ? `Family history of substance use disorder, particularly involving ${drug}, was assessed given its relevance to genetic predisposition.` : 'Family history of substance use disorder was assessed.'} Family psychiatric history including depression, anxiety, bipolar disorder, and psychosis was reviewed. Relevant genetic and epigenetic factors have been considered in the clinical formulation.`;

    case 'bio-substanceHx':
      return `${name} reports a history of ${drug} use, with onset in ${ctx.age && ctx.age < 30 ? 'adolescence or early adulthood' : 'adulthood'}. Pattern of use has escalated progressively over time with documented functional impairment across occupational, social, and family domains. ${ctx.psychosisHistory && ctx.psychosisHistory !== 'none' ? 'Co-occurring psychotic history noted and considered in clinical formulation. ' : ''}Prior treatment attempts and periods of abstinence were explored during the intake screening. Withdrawal risk has been clinically assessed; ${ctx.medicalConditions?.toLowerCase().includes('detox') ? 'medical detoxification protocol is indicated prior to or concurrent with residential admission' : 'no acute withdrawal complications identified at this time, though close monitoring is indicated during the initial 72 hours'}.`;

    case 'psych-mentalHealth':
      return `${name} carries a primary diagnosis of ${dx}. ${ctx.psychiatricHx ? `Psychiatric history: ${ctx.psychiatricHx}.` : 'No prior psychiatric hospitalizations reported at time of intake.'} ${ctx.phq9Score != null ? `PHQ-9 score at admission: ${ctx.phq9Score}/27 — ${ctx.phq9Score >= 20 ? 'severe depressive symptoms present; urgent psychiatric evaluation recommended' : ctx.phq9Score >= 15 ? 'moderately severe depression; psychiatric referral strongly recommended' : ctx.phq9Score >= 10 ? 'moderate depression; close monitoring and psychiatric consultation indicated' : 'mild or minimal depressive symptoms at this time'}.` : ''} ${ctx.safetRisk ? `SAFE-T risk stratification: ${ctx.safetRisk} — safety planning addressed and documented at intake.` : 'No acute suicidal or homicidal ideation reported at time of screening.'} Ongoing psychiatric monitoring and medication management will be incorporated into the individualized treatment plan.`;

    case 'psych-trauma':
      return `Trauma history was explored during the biopsychosocial assessment in accordance with trauma-informed care principles. ${name} reports adverse life experiences that may be contributing to current substance use patterns and/or mental health symptoms. Specific trauma disclosures are documented per client consent and applicable disclosure guidelines. Trauma-informed approaches will be integrated throughout all aspects of treatment. Referral for specialized trauma-focused therapy (EMDR, CPT, Seeking Safety) to be evaluated collaboratively with the client based on clinical readiness and treatment progress.`;

    case 'psych-coping':
      return `${name} demonstrates the following identified strengths and coping resources: positive motivation for change evidenced by voluntary treatment seeking, ${ctx.cjInvolved ? 'engagement with legal system requirements as a recovery motivator,' : ''} capacity for self-reflection during intake interview. Maladaptive coping strategies (e.g., substance use as affect regulation) have been identified and will be addressed through CBT and DBT-informed approaches. Building an expanded repertoire of healthy coping skills is a primary treatment goal.`;

    case 'psych-prevTx':
      return `${name}'s history of prior mental health and substance use disorder treatment was reviewed during the biopsychosocial assessment. Previous treatment engagements, therapeutic relationships, and response to various modalities have informed the current treatment planning recommendations. Barriers to sustained engagement in prior treatment episodes have been identified and will be proactively addressed in the current treatment plan to optimize outcomes.`;

    case 'social-housing':
      return `${name}'s current housing situation has been assessed for stability, safety, and recovery-supportiveness. ${ctx.cjInvolved ? 'Active criminal justice involvement may affect available housing options post-discharge; case management will proactively explore sober living, Oxford Houses, and other recovery housing resources in the Maryland area.' : 'Housing stability is identified as a key protective factor for sustained recovery and will be central to discharge planning.'} Recovery-supportive housing options in the greater Maryland area, including sober living environments, will be explored with the client as part of discharge planning.`;

    case 'social-support':
      return `${name}'s social support network has been assessed during the biopsychosocial intake. Family and peer relationships with positive recovery potential have been identified and will be strengthened through family sessions, with appropriate 42 CFR Part 2 consents obtained. Peer support resources including AA/NA, SMART Recovery, and peer support specialist services will be offered as components of the recovery plan. High-risk social relationships and environments that may undermine recovery have been identified and will be addressed through relapse prevention planning and skills training.`;

    case 'spiritual':
      return `${name}'s spiritual, religious, and cultural background was explored in a non-judgmental, person-centered manner during the biopsychosocial assessment. Spiritual or religious beliefs and practices, where present, will be integrated into the treatment approach as a potential recovery support and protective factor. Cultural considerations specific to ${name}'s background will be incorporated into the individualized treatment plan to ensure culturally responsive, equitable care. Identified cultural barriers to treatment engagement have been documented and will be actively addressed by the clinical team.`;

    case 'formulation-asam':
      return [
        `D1 (Acute Intoxication / Withdrawal Potential): ${drug !== 'primary substance' ? `Active ${drug} use present; withdrawal risk assessed at intake.` : 'Substance use and withdrawal risk assessed at intake.'}`,
        `D2 (Biomedical Conditions): ${ctx.medicalConditions || 'No acute medical concerns identified at this time; routine physician evaluation to be completed within 24 hours of admission.'}`,
        `D3 (Emotional / Behavioral / Cognitive): ${dx} with ${ctx.psychiatricHx ? 'documented co-occurring psychiatric history' : 'co-occurring emotional and behavioral concerns to be fully assessed'}. ${ctx.phq9Score != null ? `PHQ-9: ${ctx.phq9Score}/27.` : ''}`,
        `D4 (Readiness to Change): Voluntary treatment presentation suggests intrinsic motivation; ambivalence to be assessed and addressed through motivational interviewing throughout treatment.`,
        `D5 (Relapse / Continued Use Potential): Elevated relapse potential given chronicity of use and identified environmental and psychological triggers; comprehensive relapse prevention planning is a primary treatment priority.`,
        `D6 (Recovery Environment): ${ctx.cjInvolved ? 'Criminal justice involvement and associated stressors are present.' : 'Recovery environment to be fully assessed.'} Housing stability, social support adequacy, and community recovery resources to be addressed in discharge planning.`,
      ].join('\n');

    case 'formulation-impression':
      return `${name} is a ${ageStr}individual presenting with ${dx}${ctx.psychiatricHx ? ' and co-occurring psychiatric history' : ''}. The biopsychosocial formulation reflects a complex interplay of biological vulnerability (genetic predisposition, neuroadaptation to ${drug}, ${ctx.medicalConditions ? 'active medical comorbidities' : 'medical factors reviewed'}), psychological factors (${ctx.psychiatricHx || 'affect dysregulation, coping deficits, and psychological stressors'}), and social determinants of health (${ctx.cjInvolved ? 'criminal justice involvement, ' : ''}housing stability, social support, and vocational challenges).\n\n${name}'s voluntary presentation and active engagement throughout the admissions screening process reflect positive motivation for change and readiness to engage in treatment. This clinician's impression is that ${name} would benefit from a structured, trauma-informed, evidence-based treatment approach that addresses the full spectrum of identified biopsychosocial needs. Treatment recommendations are outlined in Section V.`;

    case 'formulation-txRec':
      return `Based on the biopsychosocial assessment and ASAM criteria across all six dimensions, the recommended level of care is to be confirmed by the interdisciplinary treatment team.\n\nRecommended treatment modalities include: individual counseling utilizing motivational interviewing and CBT/relapse prevention frameworks; group therapy (process, psychoeducation, skills-based); ${ctx.psychiatricHx ? 'psychiatric evaluation and medication management; ' : ''}case management and discharge planning; and peer support integration.\n\n${ctx.phq9Score != null && ctx.phq9Score >= 10 ? 'Psychiatric evaluation is recommended within 72 hours of admission given PHQ-9 score.\n\n' : ''}Primary goals of treatment: achieve and maintain abstinence from ${drug}; address co-occurring psychiatric conditions; develop a comprehensive relapse prevention plan; strengthen recovery-supportive community connections; and establish a stable, recovery-supportive living environment post-discharge.`;

    default:
      return '';
  }
}

// ─── Discharge Summary Narrative Drafts ──────────────────────────────────────

export interface DischargeDraftInput {
  patientName?: string;
  primaryDrug?: string;
  primaryDiagnosis?: string;
  los?: number;
  program?: string;
  goals?: { goal: string; status: string }[];
}

export function generateDischargeDraft(
  field: 'admissionPresentation' | 'clinicalProgress' | 'followUpPlan',
  i: DischargeDraftInput,
): string {
  const name = i.patientName || 'Patient';
  const drug = i.primaryDrug || 'substance use';
  const dx = i.primaryDiagnosis || 'Substance Use Disorder';
  const losStr = i.los ? `${i.los}-day ` : '';
  const program = (i.program || 'residential').toLowerCase();

  switch (field) {
    case 'admissionPresentation':
      return `${name} presented voluntarily for ${losStr}${program} treatment with a primary diagnosis of ${dx}. At the time of admission, ${name} reported escalating ${drug} with associated functional impairment across occupational, social, and family domains. ${name} expressed motivation for change and was oriented to program expectations, rights, and responsibilities at admission. Initial medical evaluation was completed within 24 hours of admission. Baseline clinical assessments including PHQ-9, SAFE-T, and ASAM criteria were administered and documented. Treatment goals were established collaboratively between the patient and the treatment team during the initial treatment planning meeting.`;

    case 'clinicalProgress': {
      const metGoals = (i.goals || []).filter(g => g.status === 'Met' || g.status === 'Substantially Met');
      const goalsNote =
        metGoals.length > 0
          ? ` Treatment goals addressed during this episode of care: ${metGoals.map(g => g.goal).join('; ')}.`
          : '';
      return `${name} demonstrated consistent engagement throughout the ${losStr}${program} treatment episode.${goalsNote}\n\nPatient maintained regular attendance at scheduled individual and group therapy sessions and participated constructively in the recovery milieu. Mood and craving ratings improved progressively over the course of treatment. ${name} demonstrated growing insight into the nature and progression of ${drug} and developed concrete, individualized relapse prevention strategies.\n\nSafety was maintained throughout the treatment episode with no acute psychiatric crises. At discharge, ${name} expressed readiness for step-down care, verbalized commitment to continuing recovery efforts, and demonstrated understanding of overdose risk reduction following treatment-related tolerance change.`;
    }

    case 'followUpPlan':
      return `${name} has been connected with the following aftercare services to support sustained recovery following discharge:\n\n1. Outpatient individual therapy — weekly sessions; referral completed and first appointment scheduled\n2. Psychiatric follow-up — medication management as clinically indicated; appointment scheduled within 7 days of discharge\n3. Primary care — medication reconciliation and medical follow-up within 14 days of discharge\n4. Peer support — AA/NA participation encouraged; home group and sponsor identified where applicable\n5. Alumni program — ${name} enrolled in facility alumni support network\n\nCrisis resources have been reviewed with the patient: 988 Suicide & Crisis Lifeline, facility alumni line, and nearest emergency department. ${name} verbalized understanding of all aftercare instructions and expressed willingness to engage in step-down services.`;

    default:
      return '';
  }
}

// ─── Treatment Plan Goal Narrative ───────────────────────────────────────────

export interface GoalNarrativeInput {
  patientName?: string;
  primaryDrug?: string;
  asamDim?: string;
  problem?: string;
}

export function generateGoalNarrative(
  field: 'longTerm' | 'shortTerm',
  i: GoalNarrativeInput,
): string {
  const name = i.patientName || 'Client';
  const drug = i.primaryDrug || 'substance';
  const dim = i.asamDim || 'D1';
  const problem = i.problem || 'presenting clinical concern';

  if (field === 'longTerm') {
    const map: Record<string, string> = {
      D1: `${name} will achieve and maintain abstinence from ${drug} as evidenced by negative urinalysis results, self-report, and collateral confirmation at 90-day post-discharge follow-up appointment.`,
      D2: `${name} will achieve and maintain medical stability by adhering to all prescribed medications, attending all primary care and specialist appointments, and reporting any new or worsening symptoms to the treatment team as documented in the aftercare plan.`,
      D3: `${name} will demonstrate clinically significant reduction in mood and anxiety symptoms as measured by validated screening tools (target PHQ-9 ≤ 5) and will report improved daily functional capacity at 90-day post-discharge follow-up.`,
      D4: `${name} will demonstrate sustained commitment to recovery as evidenced by consistent engagement in outpatient treatment, regular peer support attendance, and active implementation of the individualized relapse prevention plan throughout the 90-day post-discharge period.`,
      D5: `${name} will develop, document, and implement a comprehensive relapse prevention plan identifying personal high-risk triggers, coping strategies, and support contacts, demonstrating adaptive use of the plan when confronted with high-risk situations.`,
      D6: `${name} will secure and maintain stable, recovery-supportive housing and establish a structured daily routine incorporating recovery supports within 30 days of discharge from residential treatment.`,
    };
    return map[dim] || `${name} will make measurable, sustained progress toward resolution of ${problem} as evidenced by clinical indicators reviewed at monthly treatment team meetings throughout the aftercare period.`;
  }

  // shortTerm
  const map: Record<string, string> = {
    D1: `${name} will attend all scheduled individual and group counseling sessions this week and report cravings and any substance use honestly to the assigned counselor at each daily check-in.`,
    D2: `${name} will take all prescribed medications as directed, report any side effects or concerns to nursing staff within the same shift, and attend all scheduled medical appointments this week.`,
    D3: `${name} will complete daily mood and anxiety self-ratings on the clinical tracking tool and proactively bring any elevated distress (≥ 7/10) to the attention of the counselor or nursing staff.`,
    D4: `${name} will identify and articulate two personal motivations for pursuing recovery and one core value that supports sustained change, sharing these in individual therapy session this week.`,
    D5: `${name} will identify three personal high-risk relapse triggers and practice one specific, corresponding coping strategy with the counselor in individual session this week.`,
    D6: `${name} will attend the discharge planning meeting this week, identify a preferred post-discharge housing option, and name at least one recovery support contact for inclusion in the aftercare plan.`,
  };
  return map[dim] || `${name} will take one concrete, measurable step toward addressing ${problem} as identified collaboratively with the treatment team this week.`;
}

/** Assemble section map back into a flat string for storage */
export function sectionsToString(sections: Record<string, string>): string {
  return Object.entries(sections)
    .map(([label, text]) => {
      // Abbreviate to short prefix — e.g. "B — Behavior" → "B:"
      const short = label.split(' — ')[0].trim();
      return `${short}: ${text.trim()}`;
    })
    .join('\n');
}

/** Return the field definitions to show in the AI input form for each format */
export interface AiField {
  key: keyof ProgressNoteInput;
  label: string;
  placeholder: string;
  multiline?: boolean;
  required?: boolean;
}

export interface AiSection {
  heading: string;
  fields: AiField[];
}

export function getAiFormSections(format: NoteFormat): AiSection[] {
  const common: AiSection[] = [
    {
      heading: 'Session Context',
      fields: [
        { key: 'presentation', label: 'Client Presentation / Affect', placeholder: 'e.g. calm and cooperative, guarded, tearful, anxious', required: true },
        { key: 'mood', label: 'Mood', placeholder: 'e.g. euthymic, dysphoric, anxious, labile' },
        { key: 'moodRating', label: 'Mood Self-Rating', placeholder: 'e.g. 7/10' },
        { key: 'presentingConcern', label: 'Presenting Concern / Session Focus', placeholder: 'What the client brought to session…', multiline: true },
        { key: 'engagementLevel', label: 'Engagement Level', placeholder: 'Active | Moderate | Passive | Minimal', required: true },
      ],
    },
    {
      heading: 'Intervention',
      fields: [
        { key: 'modality', label: 'Primary Modality', placeholder: 'e.g. Motivational Interviewing, CBT, DBT, Psychoeducation' },
        { key: 'interventions', label: 'Interventions Used', placeholder: 'List interventions; e.g. open-ended questioning, psychoeducation on cravings, role-play…', multiline: true, required: true },
        { key: 'interventionDetail', label: 'Additional Detail', placeholder: 'Extra context about the intervention…', multiline: true },
      ],
    },
    {
      heading: 'Response & Safety',
      fields: [
        { key: 'clientResponse', label: 'Client Response to Intervention', placeholder: 'How the client responded…', multiline: true },
        { key: 'siHiStatus', label: 'SI/HI Status', placeholder: 'None | Passive ideation | Active ideation with plan…', required: true },
        { key: 'safetyPlanStatus', label: 'Safety Plan', placeholder: 'Current | Updated | Not Applicable' },
        { key: 'clinicalAssessment', label: 'Clinical Assessment / Interpretation', placeholder: "Clinician's interpretation of the session…", multiline: true },
        { key: 'riskFactors', label: 'Risk Factors Noted', placeholder: 'e.g. social isolation, relapse history, housing instability' },
      ],
    },
    {
      heading: 'Plan',
      fields: [
        { key: 'plan', label: 'Plan Statement', placeholder: 'e.g. Continue weekly individual sessions focused on relapse prevention…', multiline: true },
        { key: 'nextSessionGoal', label: 'Next Session Goal', placeholder: 'Goal for the next session…' },
        { key: 'homework', label: 'Homework Assigned', placeholder: 'e.g. Journaling daily triggers, practice 4-7-8 breathing' },
        { key: 'coordinationNote', label: 'Coordination', placeholder: 'e.g. psychiatry re: medication review, nursing re: CIWA' },
        { key: 'followUpTiming', label: 'Follow-up Timing', placeholder: 'e.g. 1 week, 3 days, next group session' },
      ],
    },
  ];

  // Format-specific overrides / additions
  if (format === 'SOAP') {
    common[0].fields.push(
      { key: 'patientReports', label: 'Patient Reports (Subjective)', placeholder: 'Chief complaint, symptom report, medication response…', multiline: true },
      { key: 'objectiveFindings', label: 'Objective Findings', placeholder: 'VS, scores, MSE observations, lab values…', multiline: true },
    );
  }
  if (format === 'GIRP') {
    common[0].fields.unshift(
      { key: 'goalAddressed', label: 'Treatment Goal Addressed', placeholder: 'Paste or type the relevant goal from the treatment plan…', multiline: true, required: true },
    );
  }
  return common;
}

// ─── Group note generator ─────────────────────────────────────────────────────

export function generateGroupNote(input: GroupNoteInput): string {
  const pct =
    input.expectedCensus > 0
      ? Math.round((input.attendance / input.expectedCensus) * 100)
      : 0;
  const attendStr = `${input.attendance} of ${input.expectedCensus} expected participants (${pct}%)`;
  const objStr =
    input.objectives.length > 0
      ? `Session objectives: ${input.objectives.join('; ')}.`
      : '';
  const dynamics =
    input.groupDynamics || 'Group dynamics were cohesive and the therapeutic milieu was positive overall.';
  const themes = input.notableThemes ? ` Emerging themes included ${input.notableThemes}.` : '';
  const highlights = input.participantHighlights
    ? `\n\nNotable observations: ${input.participantHighlights}`
    : '';
  const plan =
    input.followUpActions ||
    'Continue monitoring attendance and engagement. Individual counselors to follow up on any concerns identified in group.';

  return `${input.groupName} (${input.groupType}) facilitated by ${input.facilitator}${input.program ? ' — ' + input.program + ' program' : ''}. Topic: "${input.topic}". Attendance: ${attendStr}. ${objStr}

${dynamics}${themes}${highlights}

Plan: ${plan}`.trim();
}
