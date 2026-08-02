/**
 * medicalNecessityConfig.ts
 *
 * Pure configuration module for the Medical Necessity review in the Progress Notes AI Assist panel.
 *
 * Design contract:
 *   • Every medical-necessity requirement has a stable typed code.
 *   • Navigation destinations are configured per code — never derived from displayed text.
 *   • Changing title, explanation, evidenceText, or recommendedAction never affects destinations.
 *   • 'satisfies' enforces compile-time completeness: a new code without a config entry is a
 *     TypeScript error.
 *
 * This module is React-free and side-effect-free. It can be imported by automated tests.
 */

// ─── Note-field stable identifiers ───────────────────────────────────────────
// Must stay in sync with FORMAT_FIELDS in ProgressNotes.tsx.
// Only fields that actually exist in the form are listed here.
export type ProgressNoteFieldId =
  | 'behavior'       // BIRP: Behavior
  | 'intervention'   // BIRP / GIRP: Intervention
  | 'response'       // BIRP / GIRP: Response
  | 'plan'           // BIRP / DAP / SOAP / GIRP: Plan
  | 'data'           // DAP: Data
  | 'assessment'     // DAP / SOAP: Assessment
  | 'subjective'     // SOAP: Subjective
  | 'objective'      // SOAP: Objective
  | 'goal'           // GIRP: Goal
  | 'patientSelect'  // Header: Patient dropdown (always valid)
  | 'noteTypeSelect';// Header: Note Type dropdown (always valid)

// ─── Finding priority ─────────────────────────────────────────────────────────
export type FindingPriority = 'critical' | 'important' | 'suggested' | 'informational';

// ─── Field ID → display label map ────────────────────────────────────────────
// Maps every ProgressNoteFieldId to the exact label that appears in the form's
// FORMAT_FIELDS map. resolveFieldTarget() uses this to validate candidates
// against the active note format.
// patientSelect and noteTypeSelect are header controls — they are never in the
// currentFields[] array but are always valid navigation targets (mapped to null).
export const FIELD_ID_LABELS: Record<ProgressNoteFieldId, string | null> = {
  behavior:      'Behavior',
  intervention:  'Intervention',
  response:      'Response',
  plan:          'Plan',
  data:          'Data',
  assessment:    'Assessment',
  subjective:    'Subjective',
  objective:     'Objective',
  goal:          'Goal',
  patientSelect: null,
  noteTypeSelect: null,
};

/**
 * Resolves a preferred targetFieldId against the currently active note fields.
 *
 * Tries each candidate in order; returns the first whose form label exists in
 * currentFields[]. Returns undefined when no candidate is valid for the active format.
 *
 * patientSelect / noteTypeSelect are header controls — mapped to null in
 * FIELD_ID_LABELS — and are always considered valid (returned immediately).
 */
export function resolveFieldTarget(
  currentFields: string[],
  candidates: ReadonlyArray<ProgressNoteFieldId | undefined>,
): ProgressNoteFieldId | undefined {
  for (const cand of candidates) {
    if (!cand) continue;
    const label = FIELD_ID_LABELS[cand];
    if (label === null) return cand;                  // header control — always present
    if (label && currentFields.includes(label)) return cand;
  }
  return undefined;
}

// ─── Requirement codes ────────────────────────────────────────────────────────
// Stable internal identifiers — never shown to clinicians, never used as UI keys.
// Codes are independent of any displayed wording: renaming a title or explanation
// does not require updating codes or destination configuration.
//
// Adding a code here creates a compile-time error until a configuration entry
// is added to MEDICAL_NECESSITY_REQUIREMENTS below.
export type MedicalNecessityRequirementCode =
  | 'intervention-documented'
  | 'patient-response-documented'
  | 'treatment-goal-linked'
  | 'follow-up-plan-documented'
  | 'safety-status-documented'
  | 'continued-service-supported'
  | 'level-of-care-referenced';

// ─── Requirement result ───────────────────────────────────────────────────────
// Produced by evaluateMedicalNecessity() for each requirement.
// The evaluator determines the status; the configuration supplies everything else.
export interface MedicalNecessityRequirementResult {
  /** Stable code — links this result to its configuration entry. */
  code: MedicalNecessityRequirementCode;
  /**
   * 'present'             — requirement is satisfied; shown in "Evidence Present".
   * 'missing'             — required element absent; generates an Important finding.
   * 'needs-review'        — additional documentation suggested; generates a Suggested finding.
   * 'unable-to-determine' — note is empty; no finding generated.
   */
  status: 'present' | 'missing' | 'needs-review' | 'unable-to-determine';
}

// ─── Requirement configuration ────────────────────────────────────────────────
export interface MedicalNecessityRequirementConfig {
  /**
   * Short clinician-facing title for the Clinical Documentation Review finding.
   * CHANGING THIS STRING NEVER CHANGES THE FINDING'S DESTINATION.
   * Destination is configured in targetCandidates, not parsed from this string.
   */
  title: string;
  /**
   * Text shown in the "Evidence Present" list when status is 'present'.
   * CHANGING THIS STRING NEVER CHANGES THE FINDING'S DESTINATION.
   */
  evidenceText: string;
  /**
   * Detailed explanation shown in the individual Medical Necessity tool and as
   * the finding explanation in the Clinical Documentation Review.
   * CHANGING THIS STRING NEVER CHANGES THE FINDING'S DESTINATION.
   */
  explanation: string;
  /**
   * Primary action label for the finding button.
   * CHANGING THIS STRING NEVER CHANGES THE FINDING'S DESTINATION.
   */
  recommendedAction: string;
  /**
   * Finding priority when status is 'missing'. Requirements with status
   * 'needs-review' are always rendered at 'suggested' priority regardless.
   */
  priority: FindingPriority;
  /**
   * Preferred ProgressNoteFieldIds in format-priority order.
   * resolveFieldTarget() picks the first that exists in the active note fields.
   * Lists destinations for all four note formats — the validator selects the
   * appropriate one at runtime.
   * Empty array means no specific field is targeted; fallbackTool is always shown.
   */
  targetCandidates: ReadonlyArray<ProgressNoteFieldId>;
  /** Always 'necessity' — no requirement redirects to a different AI tool. */
  fallbackTool: 'necessity';
  /** Human-readable source field labels shown in the finding (informational only). */
  sourceFields?: readonly string[];
}

// ─── Requirement configuration map ───────────────────────────────────────────
// Keyed exclusively by MedicalNecessityRequirementCode.
//
// NO displayed string is used as a key. Changing any displayed string in a
// configuration entry does not affect the entry's destination.
//
// 'satisfies' enforces compile-time completeness: every MedicalNecessityRequirementCode
// must have an entry here. Adding a code without an entry is a TypeScript error.
//
// Note-format destination matrix:
//
// Code                       | BIRP         | DAP               | SOAP              | GIRP
// ─────────────────────────────────────────────────────────────────────────────────────────
// intervention-documented    | intervention | data / assessment | assessment / plan | intervention
// patient-response-documented| response     | assessment / data | assessment / data | response
// treatment-goal-linked      | plan         | plan              | plan              | goal
// follow-up-plan-documented  | plan         | plan              | plan              | plan
// safety-status-documented   | response     | assessment        | assessment        | response
// continued-service-supported| (fallback)   | (fallback)        | (fallback)        | (fallback)
// level-of-care-referenced   | (fallback)   | (fallback)        | (fallback)        | (fallback)
// Explicit type annotation makes every index access return MedicalNecessityRequirementConfig
// (not the narrower literal-union type inferred by satisfies), so optional fields such as
// sourceFields are accessible without additional casts at call sites.
// satisfies is retained to enforce compile-time completeness: adding a new
// MedicalNecessityRequirementCode without an entry here remains a TypeScript error.
export const MEDICAL_NECESSITY_REQUIREMENTS: Record<
  MedicalNecessityRequirementCode,
  MedicalNecessityRequirementConfig
> = {

  'intervention-documented': {
    title:             'No therapeutic intervention is documented',
    evidenceText:      'Therapeutic intervention is identified in the note.',
    explanation:       'No specific therapeutic intervention or modality is documented.',
    recommendedAction: 'Add Intervention',
    priority:          'important',
    // BIRP/GIRP → intervention; DAP → data (first) → assessment; SOAP → assessment → plan
    targetCandidates:  ['intervention', 'data', 'assessment', 'plan'],
    fallbackTool:      'necessity',
    sourceFields:      ['Intervention'],
  },

  'patient-response-documented': {
    title:             'Patient response to the intervention is not described',
    evidenceText:      'Patient response to the intervention is documented.',
    explanation:       'Patient response to the documented intervention is not described.',
    recommendedAction: 'Add Patient Response',
    priority:          'important',
    // BIRP/GIRP → response; DAP/SOAP → assessment → data
    targetCandidates:  ['response', 'assessment', 'data'],
    fallbackTool:      'necessity',
    sourceFields:      ['Response'],
  },

  'treatment-goal-linked': {
    title:             'No reference to treatment-plan goals is documented',
    evidenceText:      'Connection to treatment plan goals is evident.',
    explanation:       "The note does not reference the patient's treatment-plan goals. Payers may require explicit goal linkage.",
    recommendedAction: 'Add Treatment Goal Reference',
    priority:          'important',
    // GIRP → goal; BIRP/DAP/SOAP → plan (where goal references live in those formats)
    targetCandidates:  ['goal', 'plan'],
    fallbackTool:      'necessity',
    sourceFields:      ['Goal', 'Plan'],
  },

  'follow-up-plan-documented': {
    title:             'No follow-up plan is documented',
    evidenceText:      'A follow-up plan is documented.',
    explanation:       'No follow-up plan or next-session goal is documented.',
    recommendedAction: 'Add Follow-Up Plan',
    priority:          'important',
    // Plan exists in all four note formats.
    targetCandidates:  ['plan'],
    fallbackTool:      'necessity',
    sourceFields:      ['Plan'],
  },

  'safety-status-documented': {
    title:             'SI/HI status and safety plan are not explicitly documented',
    evidenceText:      'Suicide/homicide ideation status or safety plan is addressed.',
    explanation:       'SI/HI status and safety plan review are not explicitly documented. Add a brief statement even when negative (e.g., "Denies SI/HI. Safety plan reviewed and current.").',
    recommendedAction: 'Review Medical Necessity Details',
    priority:          'suggested',
    // DAP/SOAP → assessment; BIRP/GIRP → response
    targetCandidates:  ['assessment', 'response'],
    fallbackTool:      'necessity',
  },

  'continued-service-supported': {
    title:             'Continued medical necessity is not clearly articulated',
    evidenceText:      'Continued need for the current level of care is suggested by documented barriers or ongoing clinical concerns.',
    explanation:       'The note may not clearly articulate continued medical necessity. Consider documenting ongoing barriers, risk factors, or unresolved clinical concerns that support the current level of care.',
    recommendedAction: 'Review Medical Necessity Details',
    priority:          'suggested',
    // No single target field — the concern spans the whole note.
    targetCandidates:  [],
    fallbackTool:      'necessity',
  },

  'level-of-care-referenced': {
    title:             "Patient's current level of care is not referenced",
    evidenceText:      'Current level of care is referenced in the note.',
    explanation:       "Consider explicitly referencing the patient's current level of care to strengthen medical necessity documentation.",
    recommendedAction: 'Review Medical Necessity Details',
    priority:          'suggested',
    // No single target field — level-of-care references belong anywhere in the note.
    targetCandidates:  [],
    fallbackTool:      'necessity',
  },

} satisfies Record<MedicalNecessityRequirementCode, MedicalNecessityRequirementConfig>;

// ─── Display builder ──────────────────────────────────────────────────────────
// Converts a MedicalNecessityRequirementResult[] into the three string arrays
// consumed by the individual Medical Necessity tool's UI (NecessityResult).
// This is display-only — no navigation metadata is produced here.
// No requirement code is exposed to the clinician.
export function buildNecessityDisplay(
  results: MedicalNecessityRequirementResult[],
): { evidencePresent: string[]; missingElements: string[]; clinicianReviewAreas: string[] } {
  const evidencePresent:     string[] = [];
  const missingElements:     string[] = [];
  const clinicianReviewAreas: string[] = [];

  for (const r of results) {
    const cfg = MEDICAL_NECESSITY_REQUIREMENTS[r.code];
    if (r.status === 'present') {
      evidencePresent.push(cfg.evidenceText);
    } else if (r.status === 'missing') {
      missingElements.push(cfg.explanation);
    } else if (r.status === 'needs-review') {
      clinicianReviewAreas.push(cfg.explanation);
    }
    // 'unable-to-determine' — no display entry generated
  }

  return { evidencePresent, missingElements, clinicianReviewAreas };
}

// ─── Development-time MN validator ───────────────────────────────────────────
// Checks that every MedicalNecessityRequirementResult has a known code and
// that every 'missing'/'needs-review' result has the required configuration fields.
// No-ops in production. Never logs patient data.
export function validateMedicalNecessityResults(
  results: MedicalNecessityRequirementResult[],
): void {
  if (import.meta.env.PROD) return;

  const knownCodes = new Set(Object.keys(MEDICAL_NECESSITY_REQUIREMENTS));
  const seenCodes  = new Set<string>();

  results.forEach((r, idx) => {
    const loc = `[AI Review] MedicalNecessity[${idx + 1}] code=${JSON.stringify(r.code)}`;

    if (!knownCodes.has(r.code)) {
      console.warn(loc, `Unknown requirement code "${r.code}"`);
      return;
    }

    if (seenCodes.has(r.code)) {
      console.warn(loc, `Duplicate requirement code "${r.code}"`);
    }
    seenCodes.add(r.code);

    const cfg = MEDICAL_NECESSITY_REQUIREMENTS[r.code];

    if (!cfg.title)       console.warn(loc, 'Empty title in config');
    if (!cfg.explanation) console.warn(loc, 'Empty explanation in config');
    if (!cfg.evidenceText)console.warn(loc, 'Empty evidenceText in config');

    if (r.status === 'missing' || r.status === 'needs-review') {
      if (!cfg.recommendedAction) {
        console.warn(loc, `status="${r.status}" but config has no recommendedAction`);
      }
      if (cfg.targetCandidates.length === 0 && !cfg.fallbackTool) {
        console.warn(loc, `status="${r.status}" but config has neither targetCandidates nor fallbackTool`);
      }
    }

    for (const cand of cfg.targetCandidates) {
      if (!(cand in FIELD_ID_LABELS)) {
        console.warn(loc, `targetCandidate "${cand}" is not a valid ProgressNoteFieldId`);
      }
    }
  });
}
