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
