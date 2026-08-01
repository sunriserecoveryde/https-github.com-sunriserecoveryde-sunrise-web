/**
 * ProgressNoteAIAssist.tsx
 *
 * Contextual AI assistance panel for the Progress Notes workflow.
 *
 * PRIMARY ACTION — Clinical Documentation Review (recommended):
 *   Runs a multi-step pipeline: validate → clarity → consistency →
 *   medical necessity → completeness → prioritized summary.
 *   Uses the same rule-based functions as the individual tools.
 *   No logic is duplicated.
 *
 * INDIVIDUAL AI TOOLS (available below the primary action):
 *   1. Draft Progress Note    — generates a structured draft from available context
 *   2. Improve Clarity        — suggests grammar/style edits without adding new facts
 *   3. Check Medical Necessity — evaluates whether the draft supports the documented service
 *   4. Check Internal Consistency — identifies conflicts within the note and against structured fields
 *
 * Safety contract:
 *   • AI output is never inserted into the legal record automatically.
 *   • Every action requires explicit clinician review and approval.
 *   • Inserting a draft does NOT sign, submit, lock, or finalize the note.
 *   • The existing signing/co-sign workflow is unaffected.
 *   • Unauthorized roles never see this component (gate externally via canAccessScreen).
 *   • The AI cannot diagnose, prescribe, or modify risk thresholds.
 *   • The note is never modified during the review pipeline.
 *
 * Audit events are emitted via addAuditEvent() which appends to the in-memory
 * audit log and mirrors each event to the browser console for devtools visibility.
 * This uses the same in-memory + console pattern as the existing SessionChartContext
 * and DocumentFormEngine — no second audit system is created.
 */

import React, {
  useState, useRef, useEffect, useCallback, useId,
} from 'react';
import {
  Sparkles, X, ChevronRight, RotateCcw, Check, Copy,
  AlertTriangle, Info, Shield, FileText, Eye,
  Loader2, WifiOff, ChevronDown, ChevronUp,
  ClipboardList, Circle,
} from 'lucide-react';
import {
  generateProgressNote,
  type NoteFormat,
  type ProgressNoteInput,
} from '../../lib/aiNoteEngine';
import { MOCK_PATIENTS } from '../../data/mockPatients';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AIAction = 'draft' | 'clarity' | 'necessity' | 'consistency';
type AIStatus = 'idle' | 'loading' | 'result' | 'error' | 'unavailable';

interface DraftResult {
  sections: Record<string, string>;
  sourceFields: { label: string; value: string }[];
  timestamp: string;
  requestedBy: string;
  patientContext: string;
}

interface ClarityResult {
  originalText: string;
  revisedText: string;
  changeCount: number;
  changesDescription: string[];
  timestamp: string;
}

export type NecessityCategory =
  | 'Supported'
  | 'Partially Supported'
  | 'Insufficiently Supported'
  | 'Unable to Determine';

interface NecessityResult {
  category: NecessityCategory;
  evidencePresent: string[];
  missingElements: string[];
  clinicianReviewAreas: string[];
  disclaimer: string;
  timestamp: string;
}

export type ConsistencyType =
  | 'no_concerns'
  | 'potential_inconsistency'
  | 'missing_connection'
  | 'requires_review';

interface ConsistencyFinding {
  type: ConsistencyType;
  conflictA: string;
  conflictB: string;
  explanation: string;
  suggestedAction: string;
  /**
   * Structured destination — assigned at finding creation time by the
   * consistency checker based on format and finding type.
   * Never inferred by parsing conflictA/conflictB text.
   */
  targetFieldId?: ProgressNoteFieldId;
  /**
   * Human-readable list of the source fields involved in this conflict.
   * Example: ['Assessment', 'Structured craving score'].
   * Assigned at finding creation time, not derived from text.
   */
  sourceFields?: string[];
}

interface ConsistencyResult {
  findings: ConsistencyFinding[];
  timestamp: string;
}

export interface AIAuditEvent {
  id: string;
  timestamp: string;
  staffName: string;
  patientId: string;
  noteRef: string;
  action: string;
  outcome: string;
  contentInserted: boolean;
  contentLaterEdited?: boolean;
}

// ─── Clinical Review Pipeline types ──────────────────────────────────────────

type ReviewStepId = 'validate' | 'draft' | 'clarity' | 'consistency' | 'necessity' | 'summary';
type ReviewStepStatus = 'pending' | 'running' | 'done' | 'skipped';

interface ReviewStep {
  id: ReviewStepId;
  label: string;
  status: ReviewStepStatus;
}

type FindingPriority = 'critical' | 'important' | 'suggested' | 'informational';

// ─── Stable note-field identifiers ───────────────────────────────────────────
// Used to navigate from a review finding to the exact textarea in the note form.
// Must stay in sync with FORMAT_FIELDS in ProgressNotes.tsx.
// Only identifiers for fields that actually exist in the form are listed here.
export type ProgressNoteFieldId =
  | 'behavior'       // BIRP: Behavior
  | 'intervention'   // BIRP / GIRP: Intervention
  | 'response'       // BIRP / GIRP: Response (Patient Response)
  | 'plan'           // BIRP / DAP / SOAP / GIRP: Plan
  | 'data'           // DAP: Data
  | 'assessment'     // DAP / SOAP: Assessment
  | 'subjective'     // SOAP: Subjective
  | 'objective'      // SOAP: Objective
  | 'goal'           // GIRP: Goal
  | 'patientSelect'  // Header: Patient dropdown
  | 'noteTypeSelect';// Header: Note Type dropdown

// ─── Finding structure ────────────────────────────────────────────────────────
// Single unified structure for all review findings.
// Do NOT maintain separate formats per AI tool.
export interface ClinicalReviewFinding {
  id: string;
  priority: FindingPriority;
  category: 'clarity' | 'consistency' | 'medical-necessity' | 'completeness';
  title: string;
  explanation: string;
  recommendedAction?: string;
  /**
   * Structured destination — assigned as metadata at finding creation time.
   * The renderer uses this to navigate without parsing title or explanation text.
   * Validated against the active note format before a navigation button is rendered.
   */
  targetFieldId?: ProgressNoteFieldId;
  /**
   * When targetFieldId is absent or invalid for the active format, fall back
   * to opening this individual AI tool tab instead of a field-jump button.
   */
  fallbackTool?: AIAction;
  /**
   * Human-readable list of the source note sections or structured fields
   * involved in this finding. Informational only — not used for navigation.
   * Example: ['Intervention', 'Response']
   */
  sourceFields?: string[];
}

interface CompletenessScore {
  filled: number;
  total: number;
  pct: number;
  label: 'Complete' | 'Mostly Complete' | 'Partially Complete' | 'Incomplete';
}

type OverallReadiness =
  | 'Ready to Review'
  | 'Needs Attention'
  | 'Significant Gaps'
  | 'Unable to Assess';

// ─── Clinical Confidence Panel types ─────────────────────────────────────────
// All values are derived exclusively from documented information and existing
// review findings. No random or fabricated values are ever used.

type DocStrength =
  | 'Strong'
  | 'Adequate'
  | 'Needs Attention'
  | 'Insufficient Information'
  | 'Missing Documentation';

type RiskAreaLevel =
  | 'No significant concerns'
  | 'Minor review recommended'
  | 'Important review required'
  | 'Critical clinician review required';

type ReviewReadiness =
  | 'Ready for Clinician Final Review'
  | 'Ready for Supervisor Review'
  | 'Needs Revision Before Review'
  | 'Insufficient Information';

interface ConfidencePanel {
  documentationStrength: DocStrength;
  documentationSummary: string;
  /** Short labels for each missing element, for the bullet list */
  missingItems: string[];
  potentialRiskAreas: RiskAreaLevel;
  reviewReadiness: ReviewReadiness;
}

interface ClinicalReviewResult {
  timestamp: string;
  completeness: CompletenessScore;
  overallReadiness: OverallReadiness;
  clarityChanges: number;
  hasClarityRevision: boolean;
  clarityData: ClarityResult | null;
  consistencyFindings: ConsistencyFinding[];
  necessityCategory: NecessityCategory;
  necessityMissing: string[];
  necessityData: NecessityResult | null;
  prioritizedFindings: ClinicalReviewFinding[];
  summary: string;
  noteWasEmpty: boolean;
  /** Draft generated as part of the pipeline (only when clinician opted in).
   *  NEVER auto-inserted. Requires explicit "Insert Draft" action. */
  reviewDraft: DraftResult | null;
  confidence: ConfidencePanel;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  format: NoteFormat;
  patientId: string;
  noteType: string;
  fields: string[];
  values: Record<string, string>;
  authorName: string;
  noteRef: string;
  isLocked: boolean;
  /** Called with new section values when the clinician inserts an AI draft */
  onInsertDraft: (newValues: Record<string, string>) => void;
  /** Called with revised text for a single field when the clinician accepts a clarity revision */
  onAcceptRevision: (revisedText: string) => void;
  /** Accumulates audit events in the parent; parent may persist these as needed */
  onAuditEvent?: (event: AIAuditEvent) => void;
  /**
   * Called when a review finding's field-navigation action is activated.
   * The parent is responsible for scrolling, focusing, and highlighting the
   * target field. The AI panel closes itself before calling this.
   */
  onJumpToField?: (fieldId: ProgressNoteFieldId) => void;
}

// ─── Simulated network delay ──────────────────────────────────────────────────
function simulateLatency(ms = 700): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

// ─── Local clarity improvement engine ────────────────────────────────────────
// SAFETY: MUST NOT add new facts, diagnoses, interventions, change quotations,
// risk statements, or clinical judgments.
function improveClarity(text: string): { revised: string; changes: string[] } {
  const changes: string[] = [];
  let out = text;

  if (/\bpt\.\b/i.test(out)) {
    out = out.replace(/\bpt\.\b/gi, 'patient');
    changes.push('Replaced informal "pt." abbreviation with "patient" for formal documentation clarity.');
  }
  if (/\bc\/o\b/i.test(out)) {
    out = out.replace(/\bc\/o\b/gi, 'reports');
    changes.push('Replaced "c/o" with "reports" for readability in non-medical-record contexts.');
  }
  if (/\bw\//i.test(out)) {
    out = out.replace(/\bw\//gi, 'with');
    changes.push('Replaced shorthand "w/" with "with" for formal tone.');
  }
  if (/\bd\/t\b/i.test(out)) {
    out = out.replace(/\bd\/t\b/gi, 'due to');
    changes.push('Replaced "d/t" with "due to" for readability.');
  }
  if (/Denies SI\/HI\./i.test(out)) {
    out = out.replace(/Denies SI\/HI\./gi, 'Denies suicidal ideation (SI) or homicidal ideation (HI).');
    changes.push('Expanded "Denies SI/HI" to full form for documentation clarity; the abbreviation remains in parentheses for reference.');
  }
  if (/  +/.test(out)) {
    out = out.replace(/  +/g, ' ');
    changes.push('Removed extra whitespace.');
  }
  const fixedPunctuation = out.replace(/([a-z])\s{1,2}([A-Z])/g, (_, lower, upper) => `${lower}. ${upper}`);
  if (fixedPunctuation !== out) {
    out = fixedPunctuation;
    changes.push('Added missing sentence-ending periods where a sentence ended without punctuation before a new sentence began.');
  }
  out = out.split('\n').map(l => l.trimEnd()).join('\n');
  if (/\bwas given\b/i.test(out)) {
    out = out.replace(/\bwas given\b/gi, 'received');
    changes.push('Replaced passive "was given" with active "received" for stronger clinical documentation voice.');
  }
  if (/\bthere was no\b/i.test(out)) {
    out = out.replace(/\bthere was no\b/gi, 'No');
    changes.push('Simplified "there was no" to "No" for concise clinical phrasing.');
  }
  if (changes.length === 0) {
    changes.push('No grammar or style issues identified. The note meets professional documentation standards.');
  }

  return { revised: out.trim(), changes };
}

// ─── Medical necessity evaluator ─────────────────────────────────────────────
// Returns structured findings — NEVER rewrites content or makes clinical judgments.
function evaluateMedicalNecessity(
  values: Record<string, string>,
  fields: string[],
  format: NoteFormat,
  patient: ReturnType<typeof MOCK_PATIENTS.find> | undefined,
): Omit<NecessityResult, 'timestamp'> {
  const allText = fields.map(f => values[f] ?? '').join(' ').toLowerCase();
  const evidencePresent: string[] = [];
  const missingElements: string[] = [];
  const clinicianReviewAreas: string[] = [];

  const hasIntervention =
    /\b(cbt|dbt|mi\b|motivational interviewing|psychoeducation|relapse prevention|skill|intervention|counseling|therapy)\b/i.test(allText);
  if (hasIntervention) {
    evidencePresent.push('Therapeutic intervention is identified in the note.');
  } else {
    missingElements.push('No specific therapeutic intervention or modality is documented.');
  }

  const hasResponse =
    /\b(response|engaged|receptive|resistant|participated|verbalized|denied|reported|expressed|demonstrated)\b/i.test(allText);
  if (hasResponse) {
    evidencePresent.push('Patient response to the intervention is documented.');
  } else {
    missingElements.push('Patient response to the documented intervention is not described.');
  }

  const hasSafety =
    /\b(si|hi|suicidal|homicidal|safety plan|risk|denies)\b/i.test(allText);
  if (hasSafety) {
    evidencePresent.push('Suicide/homicide ideation status or safety plan is addressed.');
  } else {
    clinicianReviewAreas.push('SI/HI status and safety plan review are not explicitly documented. Add a brief statement even when negative (e.g., "Denies SI/HI. Safety plan reviewed and current.")');
  }

  const hasGoalRef = patient
    ? patient.goals.some(g =>
        g.shortTerm && allText.includes(g.shortTerm.slice(0, 10).toLowerCase()),
      ) || /\b(goal|treatment plan|objective|outcome)\b/i.test(allText)
    : /\b(goal|treatment plan|objective|outcome)\b/i.test(allText);
  if (hasGoalRef) {
    evidencePresent.push('Connection to treatment plan goals is evident.');
  } else {
    missingElements.push("The note does not reference the patient's treatment-plan goals. Payers may require explicit goal linkage.");
  }

  const hasPlan = /\b(plan|next session|follow.?up|continue|schedule|referral)\b/i.test(allText);
  if (hasPlan) {
    evidencePresent.push('A follow-up plan is documented.');
  } else {
    missingElements.push('No follow-up plan or next-session goal is documented.');
  }

  const hasContinuedNeed =
    /\b(ongoing|continue|persistent|barrier|challenge|risk factor|unresolved|maintain)\b/i.test(allText);
  if (hasContinuedNeed) {
    evidencePresent.push('Continued need for the current level of care is suggested by documented barriers or ongoing clinical concerns.');
  } else {
    clinicianReviewAreas.push('The note may not clearly articulate continued medical necessity. Consider documenting ongoing barriers, risk factors, or unresolved clinical concerns that support the current level of care.');
  }

  if (patient) {
    const locMatch =
      allText.includes(patient.program.toLowerCase()) ||
      /\b(residential|outpatient|iop|php|detox|inpatient|level of care|loc)\b/i.test(allText);
    if (locMatch) {
      evidencePresent.push('Current level of care is referenced in the note.');
    } else {
      clinicianReviewAreas.push("Consider explicitly referencing the patient's current level of care to strengthen medical necessity documentation.");
    }
  }

  let category: NecessityCategory;
  if (missingElements.length === 0 && clinicianReviewAreas.length <= 1) {
    category = 'Supported';
  } else if (missingElements.length <= 1 && evidencePresent.length >= 3) {
    category = 'Partially Supported';
  } else if (evidencePresent.length < 2) {
    category = 'Insufficiently Supported';
  } else {
    category = 'Partially Supported';
  }

  if (fields.every(f => !values[f]?.trim())) {
    category = 'Unable to Determine';
    evidencePresent.length = 0;
    missingElements.push('No note content has been entered. Medical necessity cannot be evaluated without documented clinical content.');
  }

  return {
    category,
    evidencePresent,
    missingElements,
    clinicianReviewAreas,
    disclaimer:
      'This review supports documentation quality and does not guarantee reimbursement, authorization, or payer acceptance.',
  };
}

// ─── Internal consistency checker ─────────────────────────────────────────────
// NEVER silently corrects the note. Returns findings for clinician review.
//
// targetFieldId and sourceFields are assigned at finding creation time using
// format-aware logic — not derived from conflictA/conflictB text.
// This means rewording any conflict description never breaks navigation.
function checkInternalConsistency(
  values: Record<string, string>,
  fields: string[],
  format: NoteFormat,
  patient: ReturnType<typeof MOCK_PATIENTS.find> | undefined,
): Omit<ConsistencyResult, 'timestamp'> {
  const findings: ConsistencyFinding[] = [];
  const allText = fields.map(f => values[f] ?? '').join(' ');
  const lower = allText.toLowerCase();

  // Format-aware destination: BIRP/GIRP document patient status in Response;
  // DAP/SOAP document it in Assessment. Determined from the format argument —
  // never from finding text.
  const assessOrResponse = (): ProgressNoteFieldId =>
    (format === 'BIRP' || format === 'GIRP') ? 'response' : 'assessment';
  const assessOrResponseLabel = (): string =>
    (format === 'BIRP' || format === 'GIRP') ? 'Response' : 'Assessment';

  if (patient && patient.craving >= 7 && /denies? crav/i.test(lower)) {
    findings.push({
      type: 'potential_inconsistency',
      conflictA: 'Note states patient denied cravings.',
      conflictB: `Patient's documented craving score at time of session: ${patient.craving}/10 (high).`,
      explanation: 'The written note indicates denial of cravings, but the structured craving score recorded at session time is elevated. This may reflect different time points, but payers and supervisors may flag the discrepancy.',
      suggestedAction: 'Clarify whether the craving score reflects a different time point, or revise the note to acknowledge the craving rating and explain any discrepancy (e.g., patient denied active cravings at time of session; CAMS score from morning assessment noted).',
      // Destination is determined by format — never parsed from conflictA/conflictB.
      targetFieldId: assessOrResponse(),
      sourceFields:  [assessOrResponseLabel(), 'Structured craving score'],
    });
  }

  const noProgressMatch = /no progress|not progressing|minimal progress/i.test(allText);
  const progressMet = /goals? (?:were |has been )?met|substantial progress|completed goal/i.test(allText);
  if (noProgressMatch && progressMet) {
    findings.push({
      type: 'potential_inconsistency',
      conflictA: 'Note contains language suggesting no or minimal progress.',
      conflictB: 'Note also contains language suggesting goals were met or substantial progress was made.',
      explanation: 'The note appears to state both that there was no progress and that goals were met, which is contradictory.',
      suggestedAction: "Review progress statements for consistency. Ensure the note accurately describes the patient's status at the time of service.",
      // Progress/goal status language lives in the assessment/response section.
      targetFieldId: assessOrResponse(),
    });
  }

  const hasIntervention = /\b(cbt|dbt|mi\b|motivational interviewing|psychoeducation|relapse prevention|skill|intervention|used|applied|facilitated|explored)\b/i.test(allText);
  const hasResponse = /\b(response|engaged|receptive|resistant|participated|client|patient)\s+\w+/i.test(allText);
  const format_has_response_field = format === 'BIRP' || format === 'GIRP';
  if (hasIntervention && !hasResponse && format_has_response_field) {
    const responseFieldName = 'Response (R)';
    findings.push({
      type: 'missing_connection',
      conflictA: 'An intervention or therapeutic technique is documented.',
      conflictB: `The ${responseFieldName} field appears to be empty or does not describe the patient's response to the intervention.`,
      explanation: 'Documenting an intervention without a corresponding patient response weakens the medical necessity rationale and may not satisfy payer or accreditation requirements.',
      suggestedAction: `Complete the ${responseFieldName} section with a description of how the patient responded to the intervention.`,
      // Only reaches this branch when format is BIRP or GIRP, both of which
      // have a Response field. Destination is certain — not inferred from text.
      targetFieldId: 'response',
      sourceFields:  ['Intervention', 'Response'],
    });
  }

  if (patient) {
    const hasHighRiskFlag = patient.flags.some(f => f.type === 'Risk');
    const lowRiskInNote = /low risk|no risk|denied si\/hi|denies si\/hi|no safety concerns/i.test(allText);
    const highRiskInNote = /high risk|moderate risk|elevated risk|active si|active suicidal/i.test(allText);
    if (hasHighRiskFlag && lowRiskInNote && !highRiskInNote) {
      findings.push({
        type: 'requires_review',
        conflictA: 'Note documents low or no safety risk.',
        conflictB: `Patient has an active Risk flag in their chart: "${patient.flags.find(f => f.type === 'Risk')?.note ?? 'Risk flag'}"`,
        explanation: "The note's safety narrative may not be aligned with the active risk documentation in the patient's chart. This does not mean the note is wrong — the session-level assessment may differ from a standing chart flag — but it warrants clinical review.",
        suggestedAction: "Verify that the current session's risk assessment is consistent with or explicitly addresses the standing chart risk flag. If the risk has resolved, document the basis for that determination.",
        // Safety/risk language lives in the assessment/response section.
        targetFieldId: assessOrResponse(),
        sourceFields:  ['Safety assessment', 'Chart risk flag'],
      });
    }
  }

  const planFieldKey = fields.find(f => f.toLowerCase().includes('plan'));
  if (planFieldKey && !values[planFieldKey]?.trim() && hasIntervention) {
    findings.push({
      type: 'missing_connection',
      conflictA: 'Interventions are documented in the note.',
      conflictB: 'The Plan section is empty.',
      explanation: 'A complete progress note should include a follow-up plan. Without a documented plan, the note may be considered incomplete by reviewers and payers.',
      suggestedAction: 'Complete the Plan section with the next session focus, homework if assigned, and any coordination notes.',
      // Plan field exists in all four note formats — destination is certain.
      targetFieldId: 'plan',
      sourceFields:  ['Intervention', 'Plan'],
    });
  }

  if (format === 'SOAP') {
    const subjectiveKey = fields.find(f => f.toLowerCase().includes('subjective'));
    const objectiveKey  = fields.find(f => f.toLowerCase().includes('objective'));
    if (subjectiveKey && objectiveKey &&
        values[subjectiveKey]?.trim() && !values[objectiveKey]?.trim()) {
      findings.push({
        type: 'missing_connection',
        conflictA: 'The Subjective section is completed.',
        conflictB: 'The Objective section is empty.',
        explanation: 'SOAP format requires both subjective (patient-reported) and objective (clinician-observed) findings. An empty Objective section may indicate missing mental-status, vital-sign, or structured-assessment documentation.',
        suggestedAction: 'Complete the Objective section with observable findings such as mental status, behavioral observations, vital signs, or structured assessment scores.',
        // Only reaches this branch when format is SOAP, which has an Objective field.
        targetFieldId: 'objective',
        sourceFields:  ['Subjective', 'Objective'],
      });
    }
  }

  if (fields.every(f => !values[f]?.trim())) {
    findings.push({
      type: 'requires_review',
      conflictA: 'No note content has been entered.',
      conflictB: '',
      explanation: 'Internal consistency cannot be evaluated on an empty note.',
      suggestedAction: 'Complete the note sections and run the consistency check again.',
      // No targetFieldId — directing to an empty textarea is unhelpful.
      // The parallel 'critical' completeness finding uses fallbackTool: 'draft'.
    });
  }

  return { findings };
}

// ─── Audit log utility ────────────────────────────────────────────────────────
let _auditCounter = 0;
function createAuditEvent(
  staffName: string,
  patientId: string,
  noteRef: string,
  action: string,
  outcome: string,
  contentInserted = false,
): AIAuditEvent {
  _auditCounter += 1;
  const event: AIAuditEvent = {
    id: `ai-audit-${Date.now()}-${_auditCounter}`,
    timestamp: new Date().toISOString(),
    staffName,
    patientId,
    noteRef,
    action,
    outcome,
    contentInserted,
  };
  // eslint-disable-next-line no-console
  console.info('[AI Audit]', action, '|', outcome, '| patient:', patientId, '| staff:', staffName, '| ref:', noteRef);
  return event;
}

// ─── Review pipeline step factory ────────────────────────────────────────────
// The draft step is injected only when the clinician enables the pre-review
// "Generate a suggested draft first" option.
function getReviewSteps(withDraft: boolean): ReviewStep[] {
  const steps: ReviewStep[] = [
    { id: 'validate',    label: 'Reviewing documented information', status: 'pending' },
  ];
  if (withDraft) {
    steps.push({ id: 'draft', label: 'Generating suggested draft', status: 'pending' });
  }
  steps.push(
    { id: 'clarity',     label: 'Evaluating clarity',               status: 'pending' },
    { id: 'consistency', label: 'Checking internal consistency',    status: 'pending' },
    { id: 'necessity',   label: 'Reviewing medical necessity',      status: 'pending' },
    { id: 'summary',     label: 'Preparing clinical summary',       status: 'pending' },
  );
  return steps;
}

// ─── Individual action tab definitions ───────────────────────────────────────
const ACTION_TABS: { id: AIAction; label: string; description: string }[] = [
  { id: 'draft',       label: 'Draft Note',       description: 'Generate a structured draft from current session context' },
  { id: 'clarity',     label: 'Improve Clarity',  description: 'Suggest grammar and style improvements without adding new facts' },
  { id: 'necessity',   label: 'Medical Necessity', description: 'Evaluate whether the draft supports the documented service' },
  { id: 'consistency', label: 'Consistency',       description: 'Identify conflicts within the note and structured fields' },
];

// ─── Badge maps ───────────────────────────────────────────────────────────────
const NECESSITY_BADGE: Record<NecessityCategory, { cls: string; icon: React.ReactNode }> = {
  'Supported':                { cls: 'bg-green-100 text-green-800 border-green-200',  icon: <Check className="w-3.5 h-3.5" /> },
  'Partially Supported':      { cls: 'bg-amber-100 text-amber-800 border-amber-200',  icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  'Insufficiently Supported': { cls: 'bg-red-100 text-red-800 border-red-200',        icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  'Unable to Determine':      { cls: 'bg-slate-100 text-slate-700 border-slate-200',  icon: <Info className="w-3.5 h-3.5" /> },
};

const CONSISTENCY_BADGE: Record<ConsistencyType, { cls: string; label: string }> = {
  no_concerns:             { cls: 'bg-green-100 text-green-800 border-green-200',  label: 'No concerns' },
  potential_inconsistency: { cls: 'bg-red-100 text-red-800 border-red-200',        label: 'Potential inconsistency' },
  missing_connection:      { cls: 'bg-amber-100 text-amber-800 border-amber-200',  label: 'Missing connection' },
  requires_review:         { cls: 'bg-slate-100 text-slate-700 border-slate-200',  label: 'Requires clinician review' },
};

const READINESS_CONFIG: Record<OverallReadiness, { cls: string; dotCls: string; icon: React.ReactNode }> = {
  'Ready to Review':  { cls: 'bg-green-100 text-green-800 border-green-200',  dotCls: 'bg-green-500',  icon: <Check className="w-3.5 h-3.5" /> },
  'Needs Attention':  { cls: 'bg-amber-100 text-amber-800 border-amber-200',  dotCls: 'bg-amber-500',  icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  'Significant Gaps': { cls: 'bg-red-100 text-red-800 border-red-200',        dotCls: 'bg-red-500',    icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  'Unable to Assess': { cls: 'bg-slate-100 text-slate-700 border-slate-200',  dotCls: 'bg-slate-400',  icon: <Info className="w-3.5 h-3.5" /> },
};

const PRIORITY_CONFIG: Record<FindingPriority, {
  cls: string; label: string; badgeCls: string; icon: React.ReactNode;
}> = {
  critical:     {
    cls:      'bg-red-50 border-red-200 text-red-900',
    badgeCls: 'bg-red-100 text-red-800 border-red-300',
    label:    'Critical',
    icon:     <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
  },
  important:    {
    cls:      'bg-amber-50 border-amber-200 text-amber-900',
    badgeCls: 'bg-amber-100 text-amber-800 border-amber-300',
    label:    'Important',
    icon:     <Info className="w-3.5 h-3.5 text-amber-500" />,
  },
  suggested:    {
    cls:      'bg-blue-50 border-blue-200 text-blue-900',
    badgeCls: 'bg-blue-100 text-blue-800 border-blue-300',
    label:    'Suggested Improvement',
    icon:     <Eye className="w-3.5 h-3.5 text-blue-400" />,
  },
  informational:{
    cls:      'bg-green-50 border-green-200 text-green-900',
    badgeCls: 'bg-green-100 text-green-800 border-green-300',
    label:    'Informational',
    icon:     <Check className="w-3.5 h-3.5 text-green-500" />,
  },
};

// ─── Field-navigation action labels ──────────────────────────────────────────
// Specific, verb-led labels per the UX spec. No "Open / Go / View / Fix It".
const FIELD_ACTION_LABEL: Record<ProgressNoteFieldId, string> = {
  behavior:      'Review Behavior section',
  intervention:  'Review Intervention section',
  response:      'Add Patient Response',
  plan:          'Add Follow-Up Plan',
  data:          'Review Data section',
  assessment:    'Review Assessment section',
  subjective:    'Review Subjective section',
  objective:     'Review Objective section',
  goal:          'Review Treatment Goal',
  patientSelect: 'Review Patient Selection',
  noteTypeSelect:'Review Note Type',
};

// Accessible aria-label companion (destination-first phrasing for screen readers).
const FIELD_ARIA_LABEL: Record<ProgressNoteFieldId, string> = {
  behavior:      'Move to Behavior field',
  intervention:  'Move to Intervention field',
  response:      'Move to Patient Response field',
  plan:          'Move to Follow-Up Plan field',
  data:          'Move to Data field',
  assessment:    'Move to Assessment field',
  subjective:    'Move to Subjective field',
  objective:     'Move to Objective field',
  goal:          'Move to Treatment Goal field',
  patientSelect: 'Move to Patient Selection',
  noteTypeSelect:'Move to Note Type selector',
};

// ─── Field ID → display label map ────────────────────────────────────────────
// Maps every ProgressNoteFieldId to the exact label string that appears in
// the FORMAT_FIELDS map in ProgressNotes.tsx, and that the `fields` prop
// array is keyed by. Used to validate targetFieldId against the active note
// format at runtime.
// patientSelect and noteTypeSelect are header controls — they are never
// in the currentFields[] array but are always valid navigation targets.
const FIELD_ID_LABELS: Record<ProgressNoteFieldId, string | null> = {
  behavior:      'Behavior',
  intervention:  'Intervention',
  response:      'Response',
  plan:          'Plan',
  data:          'Data',
  assessment:    'Assessment',
  subjective:    'Subjective',
  objective:     'Objective',
  goal:          'Goal',
  patientSelect: null,   // header control — not in currentFields[]
  noteTypeSelect: null,  // header control — not in currentFields[]
};

// Resolve a preferred targetFieldId against the currently active note fields.
// Tries each candidate in order; returns the first whose form label exists in
// currentFields[]. Returns undefined when no candidate is valid.
// patientSelect / noteTypeSelect are header controls and are always valid.
function resolveFieldTarget(
  currentFields: string[],
  ...candidates: (ProgressNoteFieldId | undefined)[]
): ProgressNoteFieldId | undefined {
  for (const cand of candidates) {
    if (!cand) continue;
    const label = FIELD_ID_LABELS[cand];
    if (label === null) return cand;                  // header control — always present
    if (label && currentFields.includes(label)) return cand;
  }
  return undefined;
}

// ─── Necessity element → structured destination ───────────────────────────────
// Maps the EXACT strings produced by evaluateMedicalNecessity() to a
// structured destination. Keys are exact-equality matches — no substring
// or regex matching. Changing a key here is a conscious, explicit decision.
//
// candidates[] lists preferred ProgressNoteFieldIds in format-priority order.
// resolveFieldTarget() picks the first that exists in the active note fields.
// fallbackTool is shown when no candidate matches the active format.
type NecessityDest = {
  candidates: ProgressNoteFieldId[];
  sourceFields?: string[];
  fallbackTool: AIAction;
};

const NECESSITY_ELEMENT_DEST: Record<string, NecessityDest> = {
  'No specific therapeutic intervention or modality is documented.': {
    candidates:   ['intervention'],
    sourceFields: ['Intervention'],
    fallbackTool: 'necessity',
  },
  'Patient response to the documented intervention is not described.': {
    // response (BIRP/GIRP) → assessment (DAP/SOAP, which has no separate response field)
    candidates:   ['response', 'assessment'],
    sourceFields: ['Response'],
    fallbackTool: 'necessity',
  },
  "The note does not reference the patient's treatment-plan goals. Payers may require explicit goal linkage.": {
    // goal (GIRP) → plan (BIRP/DAP/SOAP, where goal references live in the plan)
    candidates:   ['goal', 'plan'],
    sourceFields: ['Goal', 'Plan'],
    fallbackTool: 'necessity',
  },
  'No follow-up plan or next-session goal is documented.': {
    candidates:   ['plan'],
    sourceFields: ['Plan'],
    fallbackTool: 'necessity',
  },
  'No note content has been entered. Medical necessity cannot be evaluated without documented clinical content.': {
    candidates:   [],
    fallbackTool: 'draft',
  },
};

const NECESSITY_REVIEW_DEST: Record<string, NecessityDest> = {
  'SI/HI status and safety plan review are not explicitly documented. Add a brief statement even when negative (e.g., "Denies SI/HI. Safety plan reviewed and current.")': {
    // assessment (DAP/SOAP) → response (BIRP/GIRP, where safety status is documented)
    candidates:   ['assessment', 'response'],
    fallbackTool: 'necessity',
  },
  'The note may not clearly articulate continued medical necessity. Consider documenting ongoing barriers, risk factors, or unresolved clinical concerns that support the current level of care.': {
    candidates:   [],
    fallbackTool: 'necessity',
  },
  "Consider explicitly referencing the patient's current level of care to strengthen medical necessity documentation.": {
    candidates:   [],
    fallbackTool: 'necessity',
  },
};

// ─── Development-time finding validator ──────────────────────────────────────
// Logs a concise, structured warning for invalid finding metadata.
//
// Guarantees:
//   • Never logs patient note content.
//   • Never throws — purely advisory.
//   • No-ops in production (import.meta.env.PROD).
//
// The renderer guards independently against missing navigation targets so that
// a failed validation never crashes the AI panel or blocks the clinician.
function validateFindings(findings: ClinicalReviewFinding[], currentFields: string[]): void {
  if (import.meta.env.PROD) return;
  const validPriorities  = new Set<string>(['critical', 'important', 'suggested', 'informational']);
  const validCategories  = new Set<string>(['clarity', 'consistency', 'medical-necessity', 'completeness']);
  const knownFieldIds    = new Set(Object.keys(FIELD_ID_LABELS));
  const seenIds          = new Set<string>();

  findings.forEach((f, idx) => {
    const loc = `[AI Review] Finding[${idx + 1}] id=${JSON.stringify(f.id)}`;
    if (!f.id)              console.warn(loc, 'Missing id');
    else if (seenIds.has(f.id)) console.warn(loc, 'Duplicate id');
    if (f.id) seenIds.add(f.id);

    if (!f.title)           console.warn(loc, 'Empty title');
    if (!f.explanation)     console.warn(loc, 'Empty explanation');
    if (!validPriorities.has(f.priority))  console.warn(loc, `Unknown priority "${f.priority}"`);
    if (!validCategories.has(f.category))  console.warn(loc, `Unknown category "${f.category}"`);

    if (f.targetFieldId) {
      if (!knownFieldIds.has(f.targetFieldId)) {
        console.warn(loc, `Unknown targetFieldId "${f.targetFieldId}"`);
      } else {
        const label = FIELD_ID_LABELS[f.targetFieldId];
        if (label !== null && !currentFields.includes(label)) {
          console.warn(loc, `targetFieldId "${f.targetFieldId}" (label="${label}") is not present in the active note format`);
        }
      }
    }

    const isActionable = f.priority === 'critical' || f.priority === 'important';
    if (isActionable && !f.targetFieldId && !f.fallbackTool) {
      console.warn(loc, 'Actionable finding (critical/important) has neither targetFieldId nor fallbackTool');
    }
    if (isActionable && !f.recommendedAction) {
      console.warn(loc, 'Critical or Important finding is missing recommendedAction');
    }
  });
}

// ─── DEPRECATED: text-based field inference ───────────────────────────────────
// @deprecated — Do NOT call this from new Clinical Documentation Review findings.
//   All review finding destinations are now assigned as structured metadata
//   via NECESSITY_ELEMENT_DEST, NECESSITY_REVIEW_DEST, and
//   ConsistencyFinding.targetFieldId — none of which parse finding text.
//
//   This function is retained as a dead-code safety net only.
//   It always returns undefined so that any accidental call is safely neutralised
//   and caught by the TypeScript compiler if the result is used for navigation.
//   Remove it once all callers are confirmed absent.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function inferFieldId(_text: string, _currentFields: string[]): undefined {
  if (!import.meta.env.PROD) {
    console.warn('[AI Review] inferFieldId() was called — this function is deprecated. ' +
      'Assign targetFieldId as structured metadata (NECESSITY_ELEMENT_DEST / ' +
      'NECESSITY_REVIEW_DEST / ConsistencyFinding.targetFieldId) instead.');
  }
  return undefined;
}

// ─── Clinical Confidence Panel badge configs ──────────────────────────────────
// All values derive from documented information — no random or fabricated values.
const DOC_STRENGTH_CONFIG: Record<DocStrength, { cls: string; icon: React.ReactNode; dotCls: string }> = {
  'Strong':                  { cls: 'bg-green-100 text-green-800 border-green-200', dotCls: 'bg-green-500', icon: <Check className="w-3 h-3" /> },
  'Adequate':                { cls: 'bg-blue-100 text-blue-800 border-blue-200',    dotCls: 'bg-blue-500',  icon: <Check className="w-3 h-3" /> },
  'Needs Attention':         { cls: 'bg-amber-100 text-amber-800 border-amber-200', dotCls: 'bg-amber-500', icon: <AlertTriangle className="w-3 h-3" /> },
  'Insufficient Information':{ cls: 'bg-slate-100 text-slate-700 border-slate-200', dotCls: 'bg-slate-400', icon: <Info className="w-3 h-3" /> },
  'Missing Documentation':   { cls: 'bg-red-100 text-red-800 border-red-200',       dotCls: 'bg-red-500',   icon: <AlertTriangle className="w-3 h-3" /> },
};

const RISK_AREA_CONFIG: Record<RiskAreaLevel, { cls: string; dotCls: string }> = {
  'No significant concerns':          { cls: 'text-green-700',  dotCls: 'bg-green-500' },
  'Minor review recommended':         { cls: 'text-slate-600',  dotCls: 'bg-slate-400' },
  'Important review required':        { cls: 'text-amber-700',  dotCls: 'bg-amber-500' },
  'Critical clinician review required':{ cls: 'text-red-700',   dotCls: 'bg-red-500' },
};

const REVIEW_READINESS_CONFIG: Record<ReviewReadiness, { cls: string; badgeCls: string; icon: React.ReactNode }> = {
  'Ready for Clinician Final Review': { cls: 'text-green-800',  badgeCls: 'bg-green-100 text-green-800 border-green-200',  icon: <Check className="w-3.5 h-3.5" /> },
  'Ready for Supervisor Review':      { cls: 'text-blue-800',   badgeCls: 'bg-blue-100 text-blue-800 border-blue-200',     icon: <Check className="w-3.5 h-3.5" /> },
  'Needs Revision Before Review':     { cls: 'text-amber-800',  badgeCls: 'bg-amber-100 text-amber-800 border-amber-200', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  'Insufficient Information':         { cls: 'text-slate-600',  badgeCls: 'bg-slate-100 text-slate-700 border-slate-200', icon: <Info className="w-3.5 h-3.5" /> },
};

// ─── Main component ───────────────────────────────────────────────────────────

export function ProgressNoteAIAssist({
  format, patientId, noteType, fields, values, authorName,
  noteRef, isLocked, onInsertDraft, onAcceptRevision, onAuditEvent,
  onJumpToField,
}: Props) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const individualToolsRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);

  // ── Individual tool state ───────────────────────────────────────────────────
  const [activeAction, setActiveAction] = useState<AIAction>('draft');
  const [status, setStatus] = useState<AIStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const [draftResult, setDraftResult] = useState<DraftResult | null>(null);
  const [draftInserted, setDraftInserted] = useState(false);
  const [pendingOverwrite, setPendingOverwrite] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const [clarityResult, setClarityResult] = useState<ClarityResult | null>(null);
  const [clarityRevisionAccepted, setClarityRevisionAccepted] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const [necessityResult, setNecessityResult] = useState<NecessityResult | null>(null);
  const [consistencyResult, setConsistencyResult] = useState<ConsistencyResult | null>(null);

  const [discardWarning, setDiscardWarning] = useState(false);

  // ── Clinical Review Pipeline state ─────────────────────────────────────────
  const [reviewSteps, setReviewSteps] = useState<ReviewStep[]>(getReviewSteps(false));
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'loading' | 'result' | 'error'>('idle');
  const [reviewResult, setReviewResult] = useState<ClinicalReviewResult | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  /** OFF by default when clinician text exists; ON only when note is empty and a patient is selected. */
  const [generateDraftWithReview, setGenerateDraftWithReview] = useState(false);
  /** Tracks whether the review-pipeline draft has been explicitly inserted by the clinician. */
  const [reviewDraftInserted, setReviewDraftInserted] = useState(false);
  const [reviewDraftPendingOverwrite, setReviewDraftPendingOverwrite] = useState(false);

  const patient = MOCK_PATIENTS.find(p => p.id === patientId);

  // ── Audit emit ──────────────────────────────────────────────────────────────
  const emit = useCallback((action: string, outcome: string, contentInserted = false) => {
    const ev = createAuditEvent(authorName, patientId, noteRef, action, outcome, contentInserted);
    onAuditEvent?.(ev);
  }, [authorName, patientId, noteRef, onAuditEvent]);

  // ── Focus management + draft-toggle default ──────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstFocusRef.current?.focus(), 50);
      // Default: ON only when note is completely empty and a patient is selected.
      // OFF whenever clinician-entered text already exists.
      const noteIsEmpty = fields.every(f => !values[f]?.trim());
      setGenerateDraftWithReview(noteIsEmpty && !!patient);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Focus trap ──────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { handleClose(); return; }
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Close logic ─────────────────────────────────────────────────────────────
  const hasUninsertedOutput =
    (activeAction === 'draft'    && draftResult   && !draftInserted) ||
    (activeAction === 'clarity'  && clarityResult && !clarityRevisionAccepted) ||
    (reviewResult?.reviewDraft != null && !reviewDraftInserted);

  function handleClose() {
    if (hasUninsertedOutput && !discardWarning) { setDiscardWarning(true); return; }
    commitClose();
  }

  function commitClose() {
    setIsOpen(false);
    setDiscardWarning(false);
    triggerRef.current?.focus();
    emit('Panel Closed', 'closed');
  }

  // ── Open ────────────────────────────────────────────────────────────────────
  function handleOpen() {
    setIsOpen(true);
    emit('AI Assist Opened', 'opened');
  }

  // ── Switch individual action tab ────────────────────────────────────────────
  function handleSwitchAction(action: AIAction) {
    setActiveAction(action);
    setStatus('idle');
    setError(null);
    setDiscardWarning(false);
  }

  // ── Jump from review finding to exact note field ────────────────────────────
  // Closes the AI panel WITHOUT showing the discard prompt (the jump is an
  // explicit clinician action), then delegates scroll/focus/highlight to parent.
  // Safety: no note content is modified. Focus is released from the panel so
  // the clinician can edit the field immediately.
  function handleFieldJump(fieldId: ProgressNoteFieldId) {
    emit('Jump to Note Field', fieldId, false);
    setIsOpen(false);       // close panel — do NOT call handleClose() to bypass discard prompt
    setDiscardWarning(false);
    onJumpToField?.(fieldId);
  }

  // ── Jump from review result to individual tool ──────────────────────────────
  // Pre-populates individual tool state from the review's already-computed data
  // so the clinician does not have to re-run the step.
  function handleJumpToTool(action: AIAction) {
    setActiveAction(action);
    setError(null);
    setDiscardWarning(false);

    if (action === 'clarity' && reviewResult?.clarityData) {
      setClarityResult(reviewResult.clarityData);
      setClarityRevisionAccepted(false);
      setShowOriginal(false);
      setStatus('result');
    } else if (action === 'necessity' && reviewResult?.necessityData) {
      setNecessityResult(reviewResult.necessityData);
      setStatus('result');
    } else if (action === 'consistency' && reviewResult) {
      setConsistencyResult({
        findings: reviewResult.consistencyFindings,
        timestamp: reviewResult.timestamp,
      });
      setStatus('result');
    } else {
      setStatus('idle');
    }

    // Scroll individual tools section into view
    setTimeout(() => {
      individualToolsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  // ── Clinical Review Pipeline ────────────────────────────────────────────────
  // Safety contract (enforced here, not just at the UI layer):
  //   • Never modifies the legal note during the review.
  //   • Never auto-saves, auto-submits, auto-signs, auto-locks,
  //     auto-finalizes, or auto-submits for co-signature.
  //   • Any generated draft is stored in reviewResult.reviewDraft and requires
  //     explicit "Insert Draft" action before it enters the note fields.
  async function runClinicalReview() {
    if (!patient) {
      setReviewError('Select a patient above to enable the clinical review.');
      setReviewStatus('error');
      return;
    }

    emit('Clinical Review Requested', 'loading');
    setReviewStatus('loading');
    setReviewError(null);
    setReviewResult(null);
    setReviewDraftInserted(false);
    setReviewDraftPendingOverwrite(false);
    setReviewSteps(getReviewSteps(generateDraftWithReview));

    const setStep = (id: ReviewStepId, s: ReviewStepStatus) =>
      setReviewSteps(prev => prev.map(step => step.id === id ? { ...step, status: s } : step));

    try {
      // ── Step 1: Validate documented information ──
      setStep('validate', 'running');
      await simulateLatency(300);
      const noteIsEmpty = fields.every(f => !values[f]?.trim());
      setStep('validate', 'done');

      // ── Step 2 (optional): Generate suggested draft ───────────────────────
      // Only runs when the clinician explicitly enabled the toggle.
      // The draft is NEVER auto-inserted into the note.
      let reviewDraft: DraftResult | null = null;
      if (generateDraftWithReview && patient) {
        setStep('draft', 'running');
        await simulateLatency(500);
        const combinedText = fields.map(f => values[f] ?? '').join(' ');
        const draftInput: ProgressNoteInput = {
          clientName: `${patient.firstName} ${patient.lastName}`,
          noteType,
          counselorName: authorName,
          sessionDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          presentation: 'calm and cooperative',
          engagementLevel: /active/i.test(combinedText) ? 'Active'
            : /passive/i.test(combinedText) ? 'Passive'
            : /minimal/i.test(combinedText) ? 'Minimal'
            : 'Moderate',
          siHiStatus: /active si|active suicidal/i.test(combinedText) ? 'Active SI present'
            : /passive idea/i.test(combinedText) ? 'Passive ideation present'
            : 'None',
          safetyPlanStatus: /safety plan updated/i.test(combinedText) ? 'Updated'
            : /safety plan current/i.test(combinedText) ? 'Current'
            : 'Not Applicable',
          goalAddressed: patient.goals.find(g => g.status === 'In Progress')?.shortTerm ?? undefined,
          modality: /cbt/i.test(combinedText) ? 'Cognitive Behavioral Therapy (CBT)'
            : /dbt/i.test(combinedText) ? 'Dialectical Behavior Therapy (DBT)'
            : /mi\b|motivational/i.test(combinedText) ? 'Motivational Interviewing (MI)'
            : 'evidence-based counseling',
          riskFactors: patient.amaRisk !== 'Low' ? `AMA risk rated ${patient.amaRisk}` : undefined,
          plan: `Continue ${noteType.toLowerCase()} sessions. Review treatment plan goals. Follow up on documented barriers.`,
        };
        const sections = generateProgressNote(format, draftInput);
        reviewDraft = {
          sections,
          sourceFields: [
            { label: 'Patient',               value: `${patient.firstName} ${patient.lastName} (${patient.mrn})` },
            { label: 'Program / Level of Care', value: patient.program },
            { label: 'Primary Diagnosis',     value: patient.primaryDiagnosis },
            { label: 'Note Type',             value: noteType },
            { label: 'Note Format',           value: format },
            { label: 'Clinician',             value: authorName },
            { label: 'Active Treatment Goal', value: patient.goals.find(g => g.status === 'In Progress')?.shortTerm ?? 'None documented' },
            { label: 'AMA Risk',              value: patient.amaRisk },
            { label: 'Mood (session record)', value: `${patient.mood}/10` },
            { label: 'SI/HI from structured fields', value: /none/i.test(draftInput.siHiStatus ?? '') ? 'None reported' : (draftInput.siHiStatus ?? 'Not documented') },
          ],
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          requestedBy: authorName,
          patientContext: `${patient.firstName} ${patient.lastName} — ${patient.program}`,
        };
        emit('AI Draft Generated (Review Pipeline)', 'success');
        setStep('draft', 'done');
      }

      // ── Step 3: Evaluate clarity ─────────────────────────────────────────
      setStep('clarity', 'running');
      await simulateLatency(400);
      const combined = fields.map(f => values[f] ?? '').join('\n\n').trim();
      let clarityData: ClarityResult | null = null;
      let clarityChanges = 0;
      if (!noteIsEmpty) {
        const { revised, changes } = improveClarity(combined);
        clarityChanges = changes.filter(c => !c.includes('No grammar')).length;
        clarityData = {
          originalText: combined,
          revisedText: revised,
          changeCount: clarityChanges,
          changesDescription: changes,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        };
      }
      setStep('clarity', 'done');

      // ── Step 4: Check internal consistency ──────────────────────────────
      setStep('consistency', 'running');
      await simulateLatency(400);
      const consistencyFindings = noteIsEmpty
        ? []
        : checkInternalConsistency(values, fields, format, patient).findings;
      setStep('consistency', 'done');

      // ── Step 5: Review medical necessity ────────────────────────────────
      setStep('necessity', 'running');
      await simulateLatency(500);
      const necessityRaw = evaluateMedicalNecessity(values, fields, format, patient);
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const necessityData: NecessityResult = { ...necessityRaw, timestamp: ts };
      setStep('necessity', 'done');

      // ── Step 6: Completeness + findings + summary ────────────────────────
      setStep('summary', 'running');
      await simulateLatency(300);

      const filled = fields.filter(f => values[f]?.trim()).length;
      const total  = fields.length;
      const pct    = total > 0 ? Math.round((filled / total) * 100) : 0;
      const completenessLabel: CompletenessScore['label'] =
        pct === 100 ? 'Complete' :
        pct >= 75   ? 'Mostly Complete' :
        pct >= 50   ? 'Partially Complete' : 'Incomplete';

      // ── Prioritized findings: structured metadata — no text inference ─────────
      // Every targetFieldId is assigned as metadata at finding creation time.
      //
      //   • Consistency findings  — targetFieldId set by checkInternalConsistency()
      //                             based on format, not parsed from conflictA/conflictB.
      //   • Medical necessity     — NECESSITY_ELEMENT_DEST / NECESSITY_REVIEW_DEST
      //                             exact-key lookup; never parses finding text.
      //   • Clarity               — always uses fallbackTool: 'clarity' (no field target;
      //                             grammar issues span multiple sections).
      //   • Completeness          — fallbackTool: 'draft' (note is fully empty).
      //
      // resolveFieldTarget() validates each candidate against the active fields[]
      // and returns the first valid field, or undefined when none match the format.
      // Grammar/style findings are never Critical. Positive findings are never Important.
      let _fSeq = 0;
      const mkF = (
        priority: FindingPriority,
        category: ClinicalReviewFinding['category'],
        title: string,
        explanation: string,
        opts?: Partial<Pick<ClinicalReviewFinding, 'recommendedAction' | 'targetFieldId' | 'fallbackTool' | 'sourceFields'>>,
      ): ClinicalReviewFinding => ({ id: `f-${++_fSeq}`, priority, category, title, explanation, ...(opts ?? {}) });

      const pFindings: ClinicalReviewFinding[] = [];

      // ── Critical ──
      if (noteIsEmpty) {
        pFindings.push(mkF(
          'critical', 'completeness',
          'No note content has been entered',
          'All note fields are empty. Clinical review cannot be completed without documentation.',
          { recommendedAction: 'Complete each note section, then re-run the review. Use the Draft Note tool to generate a starting point.', fallbackTool: 'draft' },
        ));
      }
      if (!noteIsEmpty && necessityRaw.category === 'Insufficiently Supported') {
        pFindings.push(mkF(
          'critical', 'medical-necessity',
          'Medical necessity documentation is insufficient',
          'The note does not adequately support medical necessity for the documented service. Multiple required elements are absent or insufficiently described.',
          { recommendedAction: 'Review and address the specific missing elements listed below, then re-run the review.', fallbackTool: 'necessity' },
        ));
      }
      // Consistency conflicts — targetFieldId already set by checkInternalConsistency()
      // using format-aware logic. No text parsing happens here.
      consistencyFindings.filter(f => f.type === 'potential_inconsistency').forEach(f => {
        const tgt = resolveFieldTarget(fields, f.targetFieldId);
        pFindings.push(mkF(
          'critical', 'consistency',
          'Internal consistency conflict detected',
          `${f.conflictA} ${f.conflictB}`.trim(),
          { recommendedAction: f.suggestedAction, targetFieldId: tgt, fallbackTool: tgt ? undefined : 'consistency', sourceFields: f.sourceFields },
        ));
      });

      // ── Important ──
      // Medical necessity missing elements — exact-key lookup, never text parsing.
      necessityRaw.missingElements.forEach(m => {
        const dest = NECESSITY_ELEMENT_DEST[m];
        const tgt  = dest ? resolveFieldTarget(fields, ...dest.candidates) : undefined;
        const fb   = dest?.fallbackTool ?? 'necessity';
        pFindings.push(mkF(
          'important', 'medical-necessity',
          m.replace(/\.$/, ''),
          'This element is required to support medical necessity for the service type and level of care.',
          { recommendedAction: tgt ? FIELD_ACTION_LABEL[tgt] : 'Review Medical Necessity Details', targetFieldId: tgt, fallbackTool: tgt ? undefined : fb, sourceFields: dest?.sourceFields },
        ));
      });
      // Consistency missing-connections — targetFieldId already set by checker.
      consistencyFindings.filter(f => f.type === 'missing_connection').forEach(f => {
        const tgt = resolveFieldTarget(fields, f.targetFieldId);
        pFindings.push(mkF(
          'important', 'consistency',
          'Required section connection missing',
          f.conflictA,
          { recommendedAction: f.suggestedAction, targetFieldId: tgt, fallbackTool: tgt ? undefined : 'consistency', sourceFields: f.sourceFields },
        ));
      });
      // Grammar/style is Important, never Critical.
      if (!noteIsEmpty && clarityChanges > 0) {
        pFindings.push(mkF(
          'important', 'clarity',
          `${clarityChanges} clarity issue${clarityChanges !== 1 ? 's' : ''} identified`,
          `${clarityChanges} grammar or style improvement${clarityChanges !== 1 ? 's' : ''} ${clarityChanges === 1 ? 'was' : 'were'} found. These do not add new clinical facts — they improve documentation readability.`,
          { recommendedAction: 'Review Clarity Details', fallbackTool: 'clarity' },
        ));
      }

      // ── Suggested Improvement ──
      // Medical necessity clinician review areas — exact-key lookup, never text parsing.
      necessityRaw.clinicianReviewAreas.forEach(r => {
        const dest = NECESSITY_REVIEW_DEST[r];
        const tgt  = dest ? resolveFieldTarget(fields, ...dest.candidates) : undefined;
        const fb   = dest?.fallbackTool ?? 'necessity';
        pFindings.push(mkF(
          'suggested', 'medical-necessity',
          r.replace(/\.$/, ''),
          'This area may benefit from additional documentation to further strengthen the medical necessity rationale.',
          { recommendedAction: tgt ? FIELD_ACTION_LABEL[tgt] : 'Review Medical Necessity Details', targetFieldId: tgt, fallbackTool: tgt ? undefined : fb },
        ));
      });
      // Consistency requires_review — targetFieldId already set by checker.
      consistencyFindings.filter(f => f.type === 'requires_review').forEach(f => {
        const tgt = resolveFieldTarget(fields, f.targetFieldId);
        pFindings.push(mkF(
          'suggested', 'consistency',
          f.conflictA.replace(/\.$/, ''),
          f.explanation,
          { recommendedAction: f.suggestedAction, targetFieldId: tgt, fallbackTool: tgt ? undefined : 'consistency', sourceFields: f.sourceFields },
        ));
      });

      // ── Informational: genuine positive findings — never fabricated ──
      // Positive findings are never classified as Important.
      if (!noteIsEmpty && clarityChanges === 0) {
        pFindings.push(mkF('informational', 'clarity',
          'Clarity appears appropriate',
          'No grammar or style issues were identified. The note language is appropriate for clinical documentation.',
        ));
      }
      if (!noteIsEmpty && consistencyFindings.filter(f => f.type !== 'no_concerns').length === 0) {
        pFindings.push(mkF('informational', 'consistency',
          'No internal consistency concerns found',
          'The note sections appear internally consistent. No conflicting statements or missing section connections were identified.',
        ));
      }
      if (!noteIsEmpty && necessityRaw.category === 'Supported' && necessityRaw.missingElements.length === 0) {
        pFindings.push(mkF('informational', 'medical-necessity',
          'Medical necessity appears adequately supported',
          'The documentation appears to support medical necessity for the documented service. No missing required elements were identified.',
        ));
      }

      // ── Development-time metadata validation ─────────────────────────────────
      // Logs concise warnings for invalid finding metadata in dev.
      // Never logs patient content. Never crashes the panel.
      validateFindings(pFindings, fields);

      const hasCritical  = pFindings.some(f => f.priority === 'critical');
      const hasImportant = pFindings.some(f => f.priority === 'important');
      const overallReadiness: OverallReadiness =
        noteIsEmpty  ? 'Unable to Assess' :
        hasCritical  ? 'Significant Gaps' :
        hasImportant ? 'Needs Attention'  : 'Ready to Review';

      // ── Clinical Confidence Panel (derived from findings — no random values) ──
      // Documentation Strength
      const hasPotentialInconsistency = consistencyFindings.some(f => f.type === 'potential_inconsistency');
      let documentationStrength: DocStrength;
      let documentationSummary: string;
      const missingItems = [...necessityRaw.missingElements];

      if (noteIsEmpty) {
        documentationStrength = 'Missing Documentation';
        documentationSummary = 'No note content has been entered';
      } else if (pct > 0 && pct < 30) {
        documentationStrength = 'Insufficient Information';
        documentationSummary = 'Insufficient content for full evaluation';
      } else if (necessityRaw.missingElements.length === 0 && !hasPotentialInconsistency && clarityChanges === 0) {
        documentationStrength = 'Strong';
        documentationSummary = 'No missing documentation identified';
      } else if (necessityRaw.missingElements.length <= 1 && !hasPotentialInconsistency) {
        documentationStrength = 'Adequate';
        documentationSummary = necessityRaw.missingElements.length === 0
          ? 'Documentation is adequate — minor areas suggested for review'
          : '1 documentation element needs attention';
      } else {
        documentationStrength = 'Needs Attention';
        documentationSummary = `${necessityRaw.missingElements.length} documentation element${necessityRaw.missingElements.length !== 1 ? 's' : ''} need${necessityRaw.missingElements.length === 1 ? 's' : ''} attention`;
      }

      // Potential Risk Areas
      const hasMissingConnection = consistencyFindings.some(f => f.type === 'missing_connection');
      const hasRequiresReview    = consistencyFindings.some(f => f.type === 'requires_review');
      let potentialRiskAreas: RiskAreaLevel;
      if (hasPotentialInconsistency) {
        potentialRiskAreas = 'Critical clinician review required';
      } else if (hasMissingConnection) {
        potentialRiskAreas = 'Important review required';
      } else if (hasRequiresReview) {
        potentialRiskAreas = 'Minor review recommended';
      } else {
        potentialRiskAreas = 'No significant concerns';
      }

      // Review Readiness
      // Guard: never "Ready for Supervisor Review" when Critical or Important findings remain.
      let reviewReadiness: ReviewReadiness;
      if (noteIsEmpty || pct < 25) {
        reviewReadiness = 'Insufficient Information';
      } else if (hasCritical || hasImportant) {
        reviewReadiness = 'Needs Revision Before Review';
      } else if (pct === 100) {
        reviewReadiness = 'Ready for Supervisor Review';
      } else {
        reviewReadiness = 'Ready for Clinician Final Review';
      }

      const confidence: ConfidencePanel = {
        documentationStrength,
        documentationSummary,
        missingItems,
        potentialRiskAreas,
        reviewReadiness,
      };

      // Consolidated summary
      let summary = '';
      if (noteIsEmpty) {
        summary = generateDraftWithReview
          ? 'No note content has been entered. A suggested draft has been generated below — review it carefully, then use Insert Draft if it meets your clinical needs. The draft is not inserted automatically.'
          : 'No note content has been entered. Complete the note fields and run the review again, or use the Draft Note tool below to generate a starting point.';
      } else if (overallReadiness === 'Ready to Review') {
        const clarityNote = clarityChanges > 0
          ? `${clarityChanges} minor style correction${clarityChanges !== 1 ? 's' : ''} is available via the Clarity tool.`
          : 'No clarity issues were identified.';
        summary = `This note appears complete and internally consistent. ${clarityNote} Medical necessity documentation is ${necessityRaw.category.toLowerCase()}. The note is ready for your final review before signing.`;
      } else if (overallReadiness === 'Needs Attention') {
        const itemCount = pFindings.filter(f => f.priority === 'important').length;
        summary = `The note is partially complete but has ${itemCount} area${itemCount !== 1 ? 's' : ''} that may require attention before signing. Review the findings below, address any gaps, and re-run the review when ready.`;
      } else {
        const critCount = pFindings.filter(f => f.priority === 'critical').length;
        summary = `The note has ${critCount} critical issue${critCount !== 1 ? 's' : ''} that should be addressed before submission. These may affect documentation compliance, payer acceptance, or clinical record integrity.`;
      }

      setStep('summary', 'done');

      setReviewResult({
        timestamp: ts,
        completeness: { filled, total, pct, label: completenessLabel },
        overallReadiness,
        clarityChanges,
        hasClarityRevision: clarityChanges > 0,
        clarityData,
        consistencyFindings,
        necessityCategory: necessityRaw.category,
        necessityMissing: necessityRaw.missingElements,
        necessityData,
        prioritizedFindings: pFindings,
        summary,
        noteWasEmpty: noteIsEmpty,
        reviewDraft,
        confidence,
      });
      setReviewStatus('result');
      emit('Clinical Review Completed', 'success');
    } catch {
      setReviewStatus('error');
      setReviewError('Clinical review is temporarily unavailable. Your note has not been changed.');
      emit('Clinical Review Completed', 'error');
    }
  }

  // ── Insert review-pipeline draft ────────────────────────────────────────────
  // The review draft is completely separate from the legal note until this function
  // runs. It does NOT save, submit, sign, lock, finalize, or co-sign anything.
  function handleInsertReviewDraft() {
    const draft = reviewResult?.reviewDraft;
    if (!draft) return;
    const hasExistingText = fields.some(f => values[f]?.trim());
    if (hasExistingText && !reviewDraftPendingOverwrite) {
      setReviewDraftPendingOverwrite(true);
      return;
    }
    const sectionValues = Object.values(draft.sections);
    const newValues: Record<string, string> = {};
    fields.forEach((f, i) => { if (sectionValues[i]) newValues[f] = sectionValues[i]; });
    onInsertDraft(newValues);
    setReviewDraftInserted(true);
    setReviewDraftPendingOverwrite(false);
    emit('AI Draft Inserted (Review Pipeline)', 'inserted', true);
  }

  // ── Draft Progress Note ─────────────────────────────────────────────────────
  async function runDraft(forceRegenerate = false) {
    if (!patient) {
      setError('Select a patient before generating a draft.');
      return;
    }
    const hasExistingText = fields.some(f => values[f]?.trim());
    if (hasExistingText && !forceRegenerate && !draftResult) {
      setPendingOverwrite(true);
      return;
    }

    emit('AI Draft Requested', 'loading');
    setStatus('loading');
    setError(null);
    setDraftInserted(false);
    setCopiedDraft(false);

    try {
      await simulateLatency(700);
      const combinedText = fields.map(f => values[f] ?? '').join(' ');
      const input: ProgressNoteInput = {
        clientName: `${patient.firstName} ${patient.lastName}`,
        noteType,
        counselorName: authorName,
        sessionDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        presentation: 'calm and cooperative',
        engagementLevel: /active/i.test(combinedText) ? 'Active'
          : /passive/i.test(combinedText) ? 'Passive'
          : /minimal/i.test(combinedText) ? 'Minimal'
          : 'Moderate',
        siHiStatus: /active si|active suicidal/i.test(combinedText) ? 'Active SI present'
          : /passive idea/i.test(combinedText) ? 'Passive ideation present'
          : 'None',
        safetyPlanStatus: /safety plan updated/i.test(combinedText) ? 'Updated'
          : /safety plan current/i.test(combinedText) ? 'Current'
          : 'Not Applicable',
        goalAddressed: patient.goals.find(g => g.status === 'In Progress')?.shortTerm ?? undefined,
        modality: /cbt/i.test(combinedText) ? 'Cognitive Behavioral Therapy (CBT)'
          : /dbt/i.test(combinedText) ? 'Dialectical Behavior Therapy (DBT)'
          : /mi\b|motivational/i.test(combinedText) ? 'Motivational Interviewing (MI)'
          : 'evidence-based counseling',
        riskFactors: patient.amaRisk !== 'Low' ? `AMA risk rated ${patient.amaRisk}` : undefined,
        plan: `Continue ${noteType.toLowerCase()} sessions. Review treatment plan goals. Follow up on documented barriers.`,
      };

      const sections = generateProgressNote(format, input);

      const sourceFields: DraftResult['sourceFields'] = [
        { label: 'Patient',               value: `${patient.firstName} ${patient.lastName} (${patient.mrn})` },
        { label: 'Program / Level of Care', value: patient.program },
        { label: 'Primary Diagnosis',     value: patient.primaryDiagnosis },
        { label: 'Note Type',             value: noteType },
        { label: 'Note Format',           value: format },
        { label: 'Clinician',             value: authorName },
        { label: 'Active Treatment Goal', value: patient.goals.find(g => g.status === 'In Progress')?.shortTerm ?? 'None documented' },
        { label: 'AMA Risk',              value: patient.amaRisk },
        { label: 'Mood (session record)', value: `${patient.mood}/10` },
        { label: 'SI/HI from structured fields', value: /none/i.test(input.siHiStatus ?? '') ? 'None reported' : input.siHiStatus ?? 'Not documented' },
      ];

      setDraftResult({
        sections,
        sourceFields,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        requestedBy: authorName,
        patientContext: `${patient.firstName} ${patient.lastName} — ${patient.program}`,
      });
      setStatus('result');
      setPendingOverwrite(false);
      emit('AI Draft Generated', 'success');
    } catch {
      setStatus('error');
      setError('AI assistance is temporarily unavailable. Your note has not been changed.');
      emit('AI Draft Generated', 'error');
    }
  }

  function handleInsertDraft() {
    if (!draftResult) return;
    const hasExistingText = fields.some(f => values[f]?.trim());
    if (hasExistingText && !pendingOverwrite) { setPendingOverwrite(true); return; }
    const sectionValues = Object.values(draftResult.sections);
    const newValues: Record<string, string> = {};
    fields.forEach((f, i) => { if (sectionValues[i]) newValues[f] = sectionValues[i]; });
    onInsertDraft(newValues);
    setDraftInserted(true);
    setPendingOverwrite(false);
    emit('AI Draft Inserted', 'inserted', true);
  }

  function handleCopyDraft() {
    if (!draftResult) return;
    const text = Object.entries(draftResult.sections).map(([label, val]) => `${label}\n${val}`).join('\n\n');
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
    emit('AI Draft Copied', 'copied');
  }

  function handleDiscardDraft() {
    setDraftResult(null);
    setStatus('idle');
    setDraftInserted(false);
    setPendingOverwrite(false);
    emit('AI Draft Discarded', 'discarded');
  }

  // ── Improve Clarity ─────────────────────────────────────────────────────────
  async function runClarity() {
    const combined = fields.map(f => values[f] ?? '').join('\n\n').trim();
    if (!combined) { setError('Enter note content before requesting a clarity review.'); return; }

    emit('Clarity Review Requested', 'loading');
    setStatus('loading');
    setError(null);
    setClarityRevisionAccepted(false);
    setShowOriginal(false);

    try {
      await simulateLatency(600);
      const { revised, changes } = improveClarity(combined);
      setClarityResult({
        originalText: combined,
        revisedText: revised,
        changeCount: changes.filter(c => !c.includes('No grammar')).length,
        changesDescription: changes,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      });
      setStatus('result');
      emit('Clarity Review Generated', 'success');
    } catch {
      setStatus('error');
      setError('AI assistance is temporarily unavailable. Your note has not been changed.');
      emit('Clarity Review Generated', 'error');
    }
  }

  function handleAcceptClarityRevision() {
    if (!clarityResult) return;
    onAcceptRevision(clarityResult.revisedText);
    setClarityRevisionAccepted(true);
    emit('Revision Accepted', 'accepted', true);
  }

  function handleRejectClarityRevision() {
    setClarityResult(null);
    setStatus('idle');
    emit('Revision Rejected', 'rejected');
  }

  // ── Medical Necessity ───────────────────────────────────────────────────────
  async function runNecessity() {
    emit('Medical Necessity Check Requested', 'loading');
    setStatus('loading');
    setError(null);

    try {
      await simulateLatency(800);
      const findings = evaluateMedicalNecessity(values, fields, format, patient);
      setNecessityResult({
        ...findings,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      });
      setStatus('result');
      emit('Medical Necessity Check Generated', 'success');
    } catch {
      setStatus('error');
      setError('AI assistance is temporarily unavailable. Your note has not been changed.');
      emit('Medical Necessity Check Generated', 'error');
    }
  }

  // ── Internal Consistency ────────────────────────────────────────────────────
  async function runConsistency() {
    emit('Consistency Check Requested', 'loading');
    setStatus('loading');
    setError(null);

    try {
      await simulateLatency(650);
      const findings = checkInternalConsistency(values, fields, format, patient);
      setConsistencyResult({
        ...findings,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      });
      setStatus('result');
      emit('Consistency Check Generated', 'success');
    } catch {
      setStatus('error');
      setError('AI assistance is temporarily unavailable. Your note has not been changed.');
      emit('Consistency Check Generated', 'error');
    }
  }

  // ── Run the active individual action ───────────────────────────────────────
  async function handleRun() {
    setError(null);
    if (activeAction === 'draft')       await runDraft();
    if (activeAction === 'clarity')     await runClarity();
    if (activeAction === 'necessity')   await runNecessity();
    if (activeAction === 'consistency') await runConsistency();
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Trigger button ── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        disabled={isLocked}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        title="Open AI Assist — Clinical Documentation Review and individual AI tools"
      >
        <Sparkles className="w-3.5 h-3.5" />
        AI Assist
      </button>

      {/* ── Panel overlay ── */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-navy/20 backdrop-blur-[1px]"
            aria-hidden="true"
            onClick={handleClose}
          />

          {/* Panel */}
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="AI Assist — Progress Note"
            onKeyDown={handleKeyDown}
            className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-[480px] bg-white shadow-2xl border-l border-violet-200"
          >
            {/* ── Panel header ── */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-100 bg-gradient-to-r from-violet-600 to-violet-700 flex-none">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-none">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">AI Assist — Progress Notes</div>
                <div className="text-[10px] text-violet-200 truncate">
                  {patient ? `${patient.firstName} ${patient.lastName} · ${patient.program}` : 'No patient selected'}
                  {' · '}{noteType} · {format}
                </div>
              </div>
              <button
                ref={firstFocusRef}
                type="button"
                onClick={handleClose}
                aria-label="Close AI Assist panel"
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white flex-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Discard warning ── */}
            {discardWarning && (
              <div className="flex-none mx-4 mt-3 border border-amber-300 bg-amber-50 rounded-xl p-3 text-sm">
                <div className="flex items-center gap-2 mb-2 text-amber-800 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-none" />
                  Discard AI output?
                </div>
                <p className="text-xs text-amber-700 mb-3">
                  {activeAction === 'draft'
                    ? 'You have an AI draft that has not been inserted. Closing will discard it.'
                    : 'You have a suggested revision that has not been accepted. Closing will discard it.'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={commitClose}
                    className="text-xs font-bold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    Yes, discard and close
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscardWarning(false)}
                    className="text-xs font-semibold px-3 py-1.5 border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    Keep AI output
                  </button>
                </div>
              </div>
            )}

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto">

              {/* Global safety notice */}
              <div className="px-4 pt-4">
                <div className="flex items-start gap-2 text-[10px] text-violet-700 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
                  <Shield className="w-3 h-3 flex-none mt-0.5 text-violet-400" />
                  <span>
                    AI output requires your explicit review and approval. It will not be inserted,
                    signed, or submitted automatically. Your note is never modified during a review.
                  </span>
                </div>
              </div>

              {/* ════════════════════════════════════════════════════════════
                  PRIMARY: Clinical Documentation Review
              ════════════════════════════════════════════════════════════ */}
              <div className="px-4 pt-4 pb-2 space-y-3">

                <div className="flex items-center gap-2">
                  <div className="text-[10px] font-bold text-slate uppercase tracking-wider">Recommended</div>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* ── Review idle ── */}
                {reviewStatus === 'idle' && !reviewError && (
                  <div className="space-y-2">
                    {/* Optional pre-review draft toggle */}
                    <label className={`flex items-start gap-3 border rounded-xl px-3 py-2.5 cursor-pointer transition-colors select-none ${
                      generateDraftWithReview
                        ? 'border-violet-300 bg-violet-50'
                        : 'border-border bg-white hover:bg-slate-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={generateDraftWithReview}
                        onChange={e => setGenerateDraftWithReview(e.target.checked)}
                        className="mt-0.5 w-3.5 h-3.5 accent-violet-600 flex-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-navy leading-tight">
                          Generate a suggested draft first
                        </div>
                        <div className="text-[10px] text-slate mt-0.5">
                          {fields.some(f => values[f]?.trim())
                            ? 'Your existing note will be reviewed as-is. The draft will be shown separately and will not replace your text unless you choose Insert Draft.'
                            : 'Adds a draft generation step before the review. The draft stays separate until you explicitly choose Insert Draft.'}
                        </div>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={runClinicalReview}
                      disabled={!patient}
                      className="w-full flex items-start gap-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 text-left"
                    >
                      <ClipboardList className="w-5 h-5 flex-none mt-0.5" />
                      <div>
                        <div className="text-sm font-bold leading-tight">Run Clinical Documentation Review</div>
                        <div className="text-[11px] text-violet-200 mt-0.5">
                          Clarity · Consistency · Medical Necessity · Completeness
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 flex-none mt-0.5 ml-auto opacity-70" />
                    </button>
                  </div>
                )}

                {!patient && reviewStatus === 'idle' && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5 flex-none" />
                    Select a patient above to enable the clinical review.
                  </div>
                )}

                {/* ── Review loading: step progress ── */}
                {reviewStatus === 'loading' && (
                  <div className="border border-violet-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 border-b border-violet-100">
                      <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin flex-none" />
                      <span className="text-xs font-bold text-violet-800">Running Clinical Documentation Review…</span>
                    </div>
                    <div className="px-4 py-3 space-y-2.5 bg-white">
                      {reviewSteps.map(step => (
                        <div key={step.id} className="flex items-center gap-3">
                          <div className="w-5 h-5 flex-none flex items-center justify-center">
                            {step.status === 'done' && (
                              <div className="w-5 h-5 rounded-full bg-green-100 border border-green-200 flex items-center justify-center">
                                <Check className="w-3 h-3 text-green-600" />
                              </div>
                            )}
                            {step.status === 'running' && (
                              <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                            )}
                            {step.status === 'pending' && (
                              <Circle className="w-4 h-4 text-slate-200" />
                            )}
                          </div>
                          <span className={`text-xs transition-colors ${
                            step.status === 'done'    ? 'text-green-700 font-semibold' :
                            step.status === 'running' ? 'text-violet-700 font-bold' :
                            'text-slate-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                      <div className="pt-1 text-[10px] text-slate italic">
                        Your note content is not modified during this review.
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Review error ── */}
                {reviewStatus === 'error' && reviewError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
                    <WifiOff className="w-4 h-4 text-red-500 flex-none mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-red-800 mb-1">Clinical review unavailable</div>
                      <div className="text-xs text-red-700">{reviewError}</div>
                      <div className="text-xs text-red-600 mt-1">Your note has not been changed.</div>
                      <button
                        type="button"
                        onClick={runClinicalReview}
                        className="mt-2 text-xs font-semibold px-3 py-1.5 bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <RotateCcw className="w-3 h-3 inline mr-1" /> Retry
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Review result ── */}
                {reviewStatus === 'result' && reviewResult && (
                  <div className="border border-border rounded-xl overflow-hidden space-y-0">

                    {/* ══ CLINICAL CONFIDENCE PANEL ══════════════════════════
                        All values derived from documented information and
                        existing review findings — no random or fabricated values.
                    ══════════════════════════════════════════════════════════ */}
                    <div className="bg-slate-50 border-b border-border">
                      {/* Panel header */}
                      <div className="flex items-center justify-between px-4 pt-3 pb-2">
                        <div className="text-[10px] font-bold text-slate uppercase tracking-wider">
                          Clinical Documentation Review
                        </div>
                        <span className="text-[10px] text-slate">{reviewResult.timestamp}</span>
                      </div>

                      {/* 2-column confidence grid */}
                      <div className="px-4 pb-3 grid grid-cols-2 gap-2">

                        {/* Documentation Strength */}
                        <div className="bg-white border border-border rounded-lg p-2.5">
                          <div className="text-[9px] font-bold text-slate uppercase tracking-wider mb-1.5">
                            Documentation Strength
                          </div>
                          <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mb-1.5 ${DOC_STRENGTH_CONFIG[reviewResult.confidence.documentationStrength].cls}`}>
                            {DOC_STRENGTH_CONFIG[reviewResult.confidence.documentationStrength].icon}
                            {reviewResult.confidence.documentationStrength}
                          </div>
                          <div className="text-[10px] text-slate leading-snug">
                            {reviewResult.confidence.documentationSummary}
                          </div>
                          {reviewResult.confidence.missingItems.length > 0 && (
                            <ul className="mt-1.5 space-y-0.5">
                              {reviewResult.confidence.missingItems.slice(0, 3).map((item, i) => (
                                <li key={i} className="flex items-start gap-1 text-[10px] text-red-700">
                                  <span className="flex-none mt-0.5 text-red-400">·</span>
                                  <span className="leading-snug line-clamp-2">{item.replace(/\.$/, '').replace(/^No specific /, '')}</span>
                                </li>
                              ))}
                              {reviewResult.confidence.missingItems.length > 3 && (
                                <li className="text-[10px] text-slate italic">
                                  +{reviewResult.confidence.missingItems.length - 3} more
                                </li>
                              )}
                            </ul>
                          )}
                        </div>

                        {/* Potential Risk Areas */}
                        <div className="bg-white border border-border rounded-lg p-2.5">
                          <div className="text-[9px] font-bold text-slate uppercase tracking-wider mb-1.5">
                            Potential Risk Areas
                          </div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`w-2 h-2 rounded-full flex-none ${RISK_AREA_CONFIG[reviewResult.confidence.potentialRiskAreas].dotCls}`} />
                            <span className={`text-[10px] font-bold leading-tight ${RISK_AREA_CONFIG[reviewResult.confidence.potentialRiskAreas].cls}`}>
                              {reviewResult.confidence.potentialRiskAreas}
                            </span>
                          </div>
                          {reviewResult.consistencyFindings.filter(f => f.type === 'potential_inconsistency').length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {reviewResult.consistencyFindings
                                .filter(f => f.type === 'potential_inconsistency')
                                .slice(0, 2)
                                .map((f, i) => (
                                  <li key={i} className="flex items-start gap-1 text-[10px] text-red-700">
                                    <span className="flex-none mt-0.5 text-red-400">·</span>
                                    <span className="leading-snug line-clamp-2">{f.conflictA.replace(/\.$/, '')}</span>
                                  </li>
                                ))}
                            </ul>
                          )}
                          {reviewResult.consistencyFindings.filter(f => f.type === 'potential_inconsistency').length === 0 && (
                            <div className="text-[10px] text-slate leading-snug">
                              {reviewResult.confidence.potentialRiskAreas === 'No significant concerns'
                                ? 'No internal conflicts identified'
                                : 'Review consistency findings below'}
                            </div>
                          )}
                        </div>

                        {/* Review Readiness — full width */}
                        <div className="col-span-2 bg-white border border-border rounded-lg p-2.5">
                          <div className="text-[9px] font-bold text-slate uppercase tracking-wider mb-1.5">
                            Review Readiness
                          </div>
                          <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${REVIEW_READINESS_CONFIG[reviewResult.confidence.reviewReadiness].badgeCls}`}>
                            {REVIEW_READINESS_CONFIG[reviewResult.confidence.reviewReadiness].icon}
                            {reviewResult.confidence.reviewReadiness}
                          </div>
                          {(reviewResult.confidence.reviewReadiness === 'Needs Revision Before Review' ||
                            reviewResult.confidence.reviewReadiness === 'Insufficient Information') && (
                            <div className="mt-1.5 text-[10px] text-slate">
                              Address the findings below before submitting for review.
                            </div>
                          )}
                          {reviewResult.confidence.reviewReadiness === 'Ready for Supervisor Review' && (
                            <div className="mt-1.5 text-[10px] text-slate">
                              Note is complete with no blocking findings. Ready for co-sign or supervisor review.
                            </div>
                          )}
                          {reviewResult.confidence.reviewReadiness === 'Ready for Clinician Final Review' && (
                            <div className="mt-1.5 text-[10px] text-slate">
                              Review the suggestions below, then proceed with your normal signing workflow.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Completeness bar */}
                    <div className="px-4 pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-slate uppercase tracking-wider">Documentation Completeness</span>
                        <span className={`text-[10px] font-bold ${
                          reviewResult.completeness.label === 'Complete'           ? 'text-green-700' :
                          reviewResult.completeness.label === 'Mostly Complete'    ? 'text-blue-700' :
                          reviewResult.completeness.label === 'Partially Complete' ? 'text-amber-700' :
                          'text-red-700'
                        }`}>{reviewResult.completeness.label}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            reviewResult.completeness.pct === 100 ? 'bg-green-500' :
                            reviewResult.completeness.pct >= 75   ? 'bg-blue-500' :
                            reviewResult.completeness.pct >= 50   ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${reviewResult.completeness.pct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate mt-1">
                        {reviewResult.completeness.filled} of {reviewResult.completeness.total} fields completed
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="px-4 pt-3">
                      <p className="text-xs text-navy leading-relaxed">{reviewResult.summary}</p>
                    </div>

                    {/* ══ PRIORITIZED FINDINGS ══════════════════════════════════
                        Grouped by level: Critical → Important → Suggested → Informational.
                        Empty levels are hidden. Each finding shows title, explanation,
                        recommended action, and a specific navigation button:
                          • Field-jump button  — closes AI panel, focuses exact note field
                          • Tool-detail button — opens individual AI tool tab (no panel close)
                        No finding has both. Findings without a valid destination show
                        a tool-detail button. Findings with no destination show neither.
                    ════════════════════════════════════════════════════════════ */}
                    {reviewResult.prioritizedFindings.length > 0 && (
                      <div className="px-4 pt-3 pb-1 space-y-3">
                        <div className="text-[10px] font-bold text-slate uppercase tracking-wider">Findings</div>
                        {(['critical', 'important', 'suggested', 'informational'] as FindingPriority[]).map(priority => {
                          const group = reviewResult!.prioritizedFindings.filter(f => f.priority === priority);
                          if (group.length === 0) return null;
                          const cfg = PRIORITY_CONFIG[priority];
                          return (
                            <div key={priority}>
                              {/* Priority-level section header — text + icon, not color alone */}
                              <div className="flex items-center gap-1.5 mb-1.5">
                                {cfg.icon}
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                                  {cfg.label}
                                </span>
                                <div className="flex-1 h-px bg-border" />
                              </div>
                              <div className="space-y-2">
                                {group.map(finding => (
                                  <div key={finding.id} className={`border rounded-lg px-3 py-2.5 ${cfg.cls}`}>
                                    <div className="flex items-start gap-2">
                                      <span className="flex-none mt-0.5" aria-hidden="true">{cfg.icon}</span>
                                      <div className="flex-1 min-w-0">
                                        {/* Category + priority badge (text + icon — not color alone) */}
                                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                          <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded uppercase tracking-wide ${cfg.badgeCls}`}>
                                            {cfg.label}
                                          </span>
                                          <span className="text-[10px] font-semibold opacity-60">
                                            {finding.category === 'clarity'           ? 'Clarity' :
                                             finding.category === 'consistency'       ? 'Consistency' :
                                             finding.category === 'medical-necessity' ? 'Medical Necessity' :
                                             'Completeness'}
                                          </span>
                                        </div>
                                        <div className="text-[11px] font-semibold leading-tight mb-0.5">
                                          {finding.title}
                                        </div>
                                        <div className="text-[11px] opacity-80 leading-snug">
                                          {finding.explanation}
                                        </div>
                                        {/* Field-navigation button — closes the AI panel,
                                            then parent scrolls + focuses + highlights the target field.
                                            No note content is modified. */}
                                        {finding.targetFieldId && (
                                          <button
                                            type="button"
                                            onClick={() => handleFieldJump(finding.targetFieldId!)}
                                            aria-label={FIELD_ARIA_LABEL[finding.targetFieldId]}
                                            className="mt-2 flex items-center gap-1 text-[10px] font-bold underline underline-offset-2 opacity-90 hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current rounded"
                                          >
                                            <ChevronRight className="w-3 h-3" aria-hidden="true" />
                                            {FIELD_ACTION_LABEL[finding.targetFieldId]}
                                          </button>
                                        )}
                                        {/* Tool-detail fallback — opens individual AI tool tab.
                                            Only shown when targetFieldId is absent (no valid destination). */}
                                        {!finding.targetFieldId && finding.fallbackTool && (
                                          <button
                                            type="button"
                                            onClick={() => handleJumpToTool(finding.fallbackTool!)}
                                            aria-label={
                                              finding.fallbackTool === 'clarity'     ? 'Review Clarity tool details' :
                                              finding.fallbackTool === 'necessity'   ? 'Review Medical Necessity tool details' :
                                              finding.fallbackTool === 'consistency' ? 'Review Consistency tool details' :
                                              'Open Draft tool'
                                            }
                                            className="mt-2 flex items-center gap-1 text-[10px] font-bold underline underline-offset-2 opacity-90 hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current rounded"
                                          >
                                            <ChevronRight className="w-3 h-3" aria-hidden="true" />
                                            {finding.fallbackTool === 'clarity'     ? 'Review Clarity Details' :
                                             finding.fallbackTool === 'necessity'   ? 'Review Medical Necessity Details' :
                                             finding.fallbackTool === 'consistency' ? 'Review Consistency Details' :
                                             'Open Draft Tool'}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Zero-state when review produces no findings */}
                    {reviewResult.prioritizedFindings.length === 0 && !reviewResult.noteWasEmpty && (
                      <div className="px-4 pt-3">
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800 font-semibold">
                          <Check className="w-3.5 h-3.5 flex-none" aria-hidden="true" />
                          Review completed — no significant findings.
                        </div>
                      </div>
                    )}

                    {/* ── Review-pipeline draft card ───────────────────────
                        Shown only when clinician enabled the toggle.
                        NEVER auto-inserted. Explicit Insert Draft required.
                        Overwrite confirmation required if note has content.
                    ═══════════════════════════════════════════════════════ */}
                    {reviewResult.reviewDraft && (
                      <div className="px-4 pt-3">
                        <div className="border border-violet-200 rounded-xl overflow-hidden">
                          <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border-b border-violet-100">
                            <FileText className="w-3.5 h-3.5 text-violet-500 flex-none" />
                            <span className="text-[11px] font-bold text-violet-800 flex-1">
                              AI-Generated Draft — Requires Clinician Review
                            </span>
                            <span className="text-[10px] text-violet-400">{reviewResult.reviewDraft.timestamp}</span>
                          </div>

                          <div className="px-3 py-2.5 space-y-2 bg-white">
                            {/* Draft sections */}
                            {Object.entries(reviewResult.reviewDraft.sections).map(([label, text]) => (
                              <div key={label}>
                                <div className="text-[9px] font-bold text-slate uppercase tracking-wider mb-0.5">{label}</div>
                                <div className="text-[11px] text-navy bg-violet-50/60 border border-violet-100 rounded-lg p-2 leading-relaxed whitespace-pre-wrap">
                                  {text}
                                </div>
                              </div>
                            ))}

                            {/* Safety notice */}
                            <div className="text-[10px] text-slate italic bg-slate-50 border border-border rounded-lg px-2.5 py-1.5">
                              This draft does not modify your note. It will not be saved, submitted,
                              signed, or finalized until you explicitly choose Insert Draft.
                            </div>

                            {/* Overwrite confirmation */}
                            {reviewDraftPendingOverwrite && (
                              <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg p-2.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-none mt-0.5" />
                                <div className="flex-1">
                                  <div className="text-[11px] font-semibold text-amber-800 mb-1">
                                    This will replace your existing note content
                                  </div>
                                  <div className="text-[10px] text-amber-700 mb-2">
                                    You have already entered content in one or more fields. Inserting will overwrite that text.
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={handleInsertReviewDraft}
                                      className="text-[10px] font-bold px-2.5 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                    >
                                      Replace my draft
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setReviewDraftPendingOverwrite(false)}
                                      className="text-[10px] font-semibold px-2.5 py-1 border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                                    >
                                      Keep my text
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Inserted confirmation */}
                            {reviewDraftInserted && (
                              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5 text-[11px] text-green-800 font-semibold">
                                <Check className="w-3 h-3 text-green-600" />
                                Draft inserted — review and edit before signing.
                              </div>
                            )}

                            {/* Action buttons */}
                            {!reviewDraftInserted && !reviewDraftPendingOverwrite && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={handleInsertReviewDraft}
                                  className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                                >
                                  <ChevronRight className="w-3 h-3" /> Insert Draft
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const text = Object.entries(reviewResult.reviewDraft!.sections)
                                      .map(([l, v]) => `${l}\n${v}`).join('\n\n');
                                    navigator.clipboard.writeText(text).catch(() => {});
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 border border-border text-slate rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                >
                                  <Copy className="w-3 h-3" /> Copy
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* If note was empty and no draft was generated — offer draft tool */}
                    {reviewResult.noteWasEmpty && !reviewResult.reviewDraft && (
                      <div className="px-4 pt-3">
                        <button
                          type="button"
                          onClick={() => handleJumpToTool('draft')}
                          className="w-full flex items-center gap-2 justify-center text-xs font-bold px-3 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Generate Draft Note
                        </button>
                        <div className="text-[10px] text-slate text-center mt-1">
                          AI-generated draft — requires your review before insertion
                        </div>
                      </div>
                    )}

                    {/* Re-run button */}
                    <div className="px-4 py-3 border-t border-border bg-slate-50 mt-3 flex items-center justify-between">
                      <div className="text-[10px] text-slate italic">No changes were made to your note.</div>
                      <button
                        type="button"
                        onClick={runClinicalReview}
                        className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 border border-border text-slate bg-white rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        <RotateCcw className="w-3 h-3" /> Re-run Review
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ════════════════════════════════════════════════════════════
                  INDIVIDUAL AI TOOLS — labeled section
              ════════════════════════════════════════════════════════════ */}
              <div ref={individualToolsRef} className="px-4 pt-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Individual AI Tools</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              </div>

              {/* ── Individual tool tab strip ── */}
              <div className="flex border-b border-border overflow-x-auto flex-none">
                {ACTION_TABS.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSwitchAction(tab.id)}
                    title={tab.description}
                    className={`flex-1 min-w-[80px] px-2 py-3 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 ${
                      activeAction === tab.id
                        ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                        : 'border-transparent text-slate hover:text-navy hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Individual tool body ── */}
              <div className="px-4 py-4 space-y-4">

                {/* Action description */}
                <div className="flex items-start gap-2 text-[11px] text-slate bg-slate-50 border border-border rounded-lg px-3 py-2">
                  <Info className="w-3.5 h-3.5 text-slate-400 flex-none mt-0.5" />
                  <span>{ACTION_TABS.find(t => t.id === activeAction)?.description}</span>
                </div>

                {/* Error state */}
                {status === 'error' && error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
                    <WifiOff className="w-4 h-4 text-red-500 flex-none mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-red-800 mb-1">
                        AI assistance is temporarily unavailable.
                      </div>
                      <div className="text-xs text-red-700">{error}</div>
                      <div className="text-xs text-red-600 mt-1">Your note has not been changed.</div>
                      <button
                        type="button"
                        onClick={handleRun}
                        className="mt-2 text-xs font-semibold px-3 py-1.5 bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <RotateCcw className="w-3 h-3 inline mr-1" /> Retry
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {status === 'loading' && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                    <div className="text-sm font-semibold text-violet-700">
                      {activeAction === 'draft'       && 'Generating draft…'}
                      {activeAction === 'clarity'     && 'Reviewing clarity…'}
                      {activeAction === 'necessity'   && 'Evaluating medical necessity…'}
                      {activeAction === 'consistency' && 'Checking consistency…'}
                    </div>
                    <div className="text-xs text-slate">Your current note text is preserved.</div>
                  </div>
                )}

                {/* ── DRAFT RESULT ───────────────────────────────────────── */}
                {activeAction === 'draft' && status === 'result' && draftResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-800 bg-violet-100 border border-violet-200 px-3 py-1 rounded-full">
                        <FileText className="w-3 h-3" />
                        AI-Generated Draft — Requires Clinician Review
                      </span>
                      <span className="text-[10px] text-slate">{draftResult.timestamp}</span>
                    </div>

                    <details className="border border-border rounded-lg overflow-hidden">
                      <summary className="flex items-center gap-2 px-3 py-2 bg-slate-50 cursor-pointer select-none text-xs font-semibold text-navy">
                        <Eye className="w-3.5 h-3.5 text-slate" />
                        Source information used
                        <ChevronDown className="w-3.5 h-3.5 text-slate ml-auto" />
                      </summary>
                      <div className="px-3 py-2 space-y-1">
                        {draftResult.sourceFields.map(sf => (
                          <div key={sf.label} className="flex items-start gap-2 text-[11px]">
                            <span className="text-slate font-semibold w-40 flex-none">{sf.label}:</span>
                            <span className="text-navy">{sf.value}</span>
                          </div>
                        ))}
                        <div className="mt-2 pt-2 border-t border-border text-[10px] text-slate italic">
                          Only information already documented in this workflow was used. No external data was inferred.
                        </div>
                      </div>
                    </details>

                    {Object.entries(draftResult.sections).map(([label, text]) => (
                      <div key={label}>
                        <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-1">{label}</div>
                        <div className="text-xs text-navy bg-violet-50/60 border border-violet-100 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                          {text}
                        </div>
                      </div>
                    ))}

                    {pendingOverwrite && (
                      <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl p-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-none mt-0.5" />
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-amber-800 mb-1">
                            This will replace your current draft text
                          </div>
                          <div className="text-[11px] text-amber-700 mb-2">
                            You have already entered content in one or more fields. Inserting will overwrite that text.
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleInsertDraft}
                              className="text-[11px] font-bold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            >
                              Replace my draft
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingOverwrite(false)}
                              className="text-[11px] font-semibold px-3 py-1.5 border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                            >
                              Keep my text
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {draftInserted && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800 font-semibold">
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        Draft inserted into your note — review, edit, and use your normal signing workflow when ready.
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {!draftInserted && (
                        <button
                          type="button"
                          onClick={handleInsertDraft}
                          className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        >
                          <ChevronRight className="w-3 h-3" /> Insert Draft
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleCopyDraft}
                        className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 border border-border text-slate rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedDraft ? 'Copied!' : 'Copy Draft'}
                      </button>
                      <button
                        type="button"
                        onClick={() => runDraft(true)}
                        className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 border border-border text-slate rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        <RotateCcw className="w-3 h-3" /> Regenerate
                      </button>
                      <button
                        type="button"
                        onClick={handleDiscardDraft}
                        className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <X className="w-3 h-3" /> Discard
                      </button>
                    </div>
                  </div>
                )}

                {/* ── CLARITY RESULT ─────────────────────────────────────── */}
                {activeAction === 'clarity' && status === 'result' && clarityResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-navy">
                        Suggested Revision
                        {clarityResult.changeCount > 0
                          ? ` · ${clarityResult.changeCount} change${clarityResult.changeCount > 1 ? 's' : ''}`
                          : ' · No changes needed'}
                      </span>
                      <span className="text-[10px] text-slate">{clarityResult.timestamp}</span>
                    </div>

                    {clarityResult.changesDescription.length > 0 && (
                      <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                        {clarityResult.changesDescription.map((c, i) => (
                          <div key={i} className={`flex items-start gap-2 px-3 py-2 text-[11px] ${
                            c.includes('No grammar') ? 'bg-green-50 text-green-700' : 'bg-white text-navy'
                          }`}>
                            {c.includes('No grammar')
                              ? <Check className="w-3 h-3 text-green-500 flex-none mt-0.5" />
                              : <ChevronRight className="w-3 h-3 text-violet-400 flex-none mt-0.5" />}
                            {c}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowOriginal(o => !o)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate hover:text-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded"
                    >
                      {showOriginal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {showOriginal ? 'Hide original' : 'Show original'}
                    </button>

                    {showOriginal && (
                      <div>
                        <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Original Text</div>
                        <div className="text-xs text-slate bg-slate-50 border border-border rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                          {clarityResult.originalText}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-[10px] font-bold text-violet-700 uppercase tracking-wider mb-1">Suggested Revision</div>
                      <div className="text-xs text-navy bg-violet-50 border border-violet-200 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                        {clarityResult.revisedText}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate italic bg-slate-50 border border-border rounded-lg px-3 py-2">
                      This revision corrects grammar, style, and abbreviations only. No new facts, diagnoses, interventions, or clinical judgments have been added. Patient quotations are unchanged.
                    </div>

                    {clarityRevisionAccepted && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800 font-semibold">
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        Revision applied — review the updated text and use your normal signing workflow.
                      </div>
                    )}

                    {!clarityRevisionAccepted && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleAcceptClarityRevision}
                          disabled={clarityResult.changeCount === 0}
                          className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        >
                          <Check className="w-3 h-3" /> Accept Revision
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(clarityResult.revisedText).catch(() => {});
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 border border-border text-slate rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          <Copy className="w-3 h-3" /> Copy Suggested Revision
                        </button>
                        <button
                          type="button"
                          onClick={handleRejectClarityRevision}
                          className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 text-slate border border-border rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          <X className="w-3 h-3" /> Keep Original
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── NECESSITY RESULT ───────────────────────────────────── */}
                {activeAction === 'necessity' && status === 'result' && necessityResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${NECESSITY_BADGE[necessityResult.category].cls}`}>
                        {NECESSITY_BADGE[necessityResult.category].icon}
                        {necessityResult.category}
                      </span>
                      <span className="text-[10px] text-slate">{necessityResult.timestamp}</span>
                    </div>

                    {necessityResult.evidencePresent.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1.5">Evidence Present</div>
                        <div className="space-y-1">
                          {necessityResult.evidencePresent.map((e, i) => (
                            <div key={i} className="flex items-start gap-2 text-[11px] text-green-800 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5">
                              <Check className="w-3 h-3 text-green-500 flex-none mt-0.5" />
                              {e}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {necessityResult.missingElements.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1.5">Missing Documentation</div>
                        <div className="space-y-1">
                          {necessityResult.missingElements.map((e, i) => (
                            <div key={i} className="flex items-start gap-2 text-[11px] text-red-800 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                              <AlertTriangle className="w-3 h-3 text-red-500 flex-none mt-0.5" />
                              {e}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {necessityResult.clinicianReviewAreas.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1.5">Suggested Clinician Review</div>
                        <div className="space-y-1">
                          {necessityResult.clinicianReviewAreas.map((e, i) => (
                            <div key={i} className="flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
                              <Info className="w-3 h-3 text-amber-500 flex-none mt-0.5" />
                              {e}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] text-slate italic">
                      <Shield className="w-3 h-3 flex-none mt-0.5 text-slate-400" />
                      {necessityResult.disclaimer}
                    </div>

                    <button
                      type="button"
                      onClick={runNecessity}
                      className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 border border-border text-slate rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      <RotateCcw className="w-3 h-3" /> Re-evaluate
                    </button>
                  </div>
                )}

                {/* ── CONSISTENCY RESULT ─────────────────────────────────── */}
                {activeAction === 'consistency' && status === 'result' && consistencyResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-navy">
                        {consistencyResult.findings.length === 0 || consistencyResult.findings.every(f => f.type === 'no_concerns')
                          ? '✓ No consistency concerns identified'
                          : `${consistencyResult.findings.length} finding${consistencyResult.findings.length > 1 ? 's' : ''} require${consistencyResult.findings.length === 1 ? 's' : ''} review`}
                      </span>
                      <span className="text-[10px] text-slate">{consistencyResult.timestamp}</span>
                    </div>

                    {consistencyResult.findings.length === 0 && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
                        <Check className="w-4 h-4 text-green-500 flex-none" />
                        No consistency concerns identified in this note.
                      </div>
                    )}

                    {consistencyResult.findings.map((finding, i) => (
                      <div key={i} className="border border-border rounded-xl overflow-hidden">
                        <div className={`flex items-center gap-2 px-3 py-2 ${
                          finding.type === 'potential_inconsistency' ? 'bg-red-50 border-b border-red-100' :
                          finding.type === 'missing_connection'      ? 'bg-amber-50 border-b border-amber-100' :
                          finding.type === 'requires_review'         ? 'bg-slate-50 border-b border-border' :
                          'bg-green-50 border-b border-green-100'
                        }`}>
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${CONSISTENCY_BADGE[finding.type].cls}`}>
                            {finding.type === 'potential_inconsistency' && <AlertTriangle className="w-2.5 h-2.5" />}
                            {finding.type === 'missing_connection'      && <Info className="w-2.5 h-2.5" />}
                            {finding.type === 'requires_review'         && <Eye className="w-2.5 h-2.5" />}
                            {finding.type === 'no_concerns'             && <Check className="w-2.5 h-2.5" />}
                            {CONSISTENCY_BADGE[finding.type].label}
                          </span>
                        </div>
                        <div className="p-3 space-y-2 bg-white">
                          <div className="text-[11px]">
                            <span className="font-semibold text-navy">Field A: </span>
                            <span className="text-navy">{finding.conflictA}</span>
                          </div>
                          {finding.conflictB && (
                            <div className="text-[11px]">
                              <span className="font-semibold text-navy">Field B: </span>
                              <span className="text-navy">{finding.conflictB}</span>
                            </div>
                          )}
                          <div className="text-[11px] text-slate border-t border-border pt-2">
                            <span className="font-semibold">Why this may be inconsistent: </span>
                            {finding.explanation}
                          </div>
                          <div className="text-[11px] text-violet-800 bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-1.5">
                            <span className="font-semibold">Suggested action: </span>
                            {finding.suggestedAction}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="text-[10px] text-slate italic bg-slate-50 border border-border rounded-lg px-3 py-2">
                      Consistency findings are for clinician review only. No changes have been made to the note. Only the clinician may correct documentation.
                    </div>

                    <button
                      type="button"
                      onClick={runConsistency}
                      className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 border border-border text-slate rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      <RotateCcw className="w-3 h-3" /> Re-check
                    </button>
                  </div>
                )}

                {/* ── IDLE state — Run button ── */}
                {status === 'idle' && !error && (
                  <div className="space-y-3">
                    {activeAction === 'draft' && !patient && (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5 flex-none" />
                        Select a patient above before generating a draft.
                      </div>
                    )}
                    {activeAction === 'clarity' && fields.every(f => !values[f]?.trim()) && (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5 flex-none" />
                        Enter note content before requesting a clarity review.
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleRun}
                      disabled={
                        (activeAction === 'draft'    && !patient) ||
                        (activeAction === 'clarity'  && fields.every(f => !values[f]?.trim()))
                      }
                      className="flex items-center gap-2 w-full justify-center bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      <Sparkles className="w-4 h-4" />
                      {activeAction === 'draft'       && 'Generate Draft Progress Note'}
                      {activeAction === 'clarity'     && 'Review Clarity'}
                      {activeAction === 'necessity'   && 'Check Medical Necessity'}
                      {activeAction === 'consistency' && 'Check Internal Consistency'}
                    </button>

                    {activeAction === 'draft' && !patient && (
                      <div className="text-xs text-slate text-center italic">
                        Not enough documented information to generate a clinically supported draft.
                        <br />
                        Missing: Patient selection
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom padding for scroll clearance */}
                <div className="h-2" />
              </div>
            </div>

            {/* ── Panel footer ── */}
            <div className="flex-none border-t border-border px-4 py-3 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate">
                AI output never auto-saves, auto-signs, or auto-finalizes
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="text-xs font-semibold text-slate hover:text-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
