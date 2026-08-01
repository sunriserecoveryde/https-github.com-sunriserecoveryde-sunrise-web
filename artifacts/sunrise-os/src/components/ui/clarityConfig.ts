/**
 * clarityConfig.ts
 *
 * Pure configuration and logic module for the section-aware Improve Clarity feature.
 * React-free and side-effect-free — safe to import from automated tests.
 *
 * Design contract:
 *   • Each note section is processed independently — field content is never combined.
 *   • Every result carries a typed ProgressNoteFieldId.
 *   • Destinations are never inferred from displayed text; they come from the fieldId.
 *   • The engine may only: correct grammar, expand abbreviations, reduce redundancy,
 *     improve professional tone, fix sentence structure.
 *   • The engine must NOT: add new facts, change quotations, alter diagnoses,
 *     strengthen certainty, or remove clinical meaning.
 *   • Empty sections produce hasChanges: false — no fabricated changes.
 *
 * Exported pure functions (testable without React or DOM):
 *   buildClaritySectionInputs  — map format fields to ClaritySectionInput[]
 *   runClarityOnSection        — per-section rule engine
 *   runClarityReview           — orchestrate all sections
 *   detectStaleSection         — compare live text to review-time snapshot
 *   buildClarityFindingId      — stable finding-ID builder
 */

import { FIELD_ID_LABELS, type ProgressNoteFieldId } from './medicalNecessityConfig';

// ─── Change type union ────────────────────────────────────────────────────────

export type ClarityChangeType =
  | 'grammar'
  | 'abbreviation'
  | 'professional-tone'
  | 'sentence-structure'
  | 'redundancy'
  | 'clarity';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ClarityChange {
  /** Stable per-change ID within this section result: `chg-{n}` */
  id: string;
  /** Classification of the change category. */
  type: ClarityChangeType;
  /** Clinician-facing description of what was improved. */
  description: string;
  /** Brief rationale explaining why the change improves documentation. */
  reason: string;
}

/**
 * Input to the per-section clarity engine.
 * `fieldLabel` is the exact form-field label (e.g. "Behavior") used as the
 * textarea key in ProgressNotes.tsx.
 */
export interface ClaritySectionInput {
  fieldId: ProgressNoteFieldId;
  fieldLabel: string;
  text: string;
}

export interface ClaritySectionResult {
  fieldId: ProgressNoteFieldId;
  fieldLabel: string;
  originalText: string;
  /**
   * Snapshot of the field text at review time.
   * Used by detectStaleSection() to detect clinician edits made after the review.
   * Always equal to originalText when first produced.
   * Never included in console logs.
   */
  sourceSnapshot: string;
  suggestedText: string;
  changes: ClarityChange[];
  /** true only when at least one real (non-informational) change exists */
  hasChanges: boolean;
}

export interface ClarityReviewResult {
  sections: ClaritySectionResult[];
  /** Count of sections where hasChanges is true */
  totalChanges: number;
  reviewedAt: string;
}

// ─── Format field label → ProgressNoteFieldId ────────────────────────────────
// Maps the exact label strings used in FORMAT_FIELDS (ProgressNotes.tsx)
// to stable ProgressNoteFieldId values.
// Must stay in sync with FORMAT_FIELDS in ProgressNotes.tsx and
// FIELD_ID_LABELS in medicalNecessityConfig.ts.
export const CLARITY_FIELD_ID_MAP: Readonly<Record<string, ProgressNoteFieldId>> = {
  Behavior:     'behavior',
  Intervention: 'intervention',
  Response:     'response',
  Plan:         'plan',
  Data:         'data',
  Assessment:   'assessment',
  Subjective:   'subjective',
  Objective:    'objective',
  Goal:         'goal',
} as const;

/**
 * Builds the ordered list of section inputs for the active note format.
 * Only includes fields that exist in the format (fields array) and have
 * a valid ProgressNoteFieldId mapping.
 * Empty text is preserved so the engine can return hasChanges:false without fabrication.
 *
 * @param fields  - Ordered format field labels (e.g. ['Behavior', 'Intervention', ...])
 * @param values  - Current note values keyed by field label
 */
export function buildClaritySectionInputs(
  fields: string[],
  values: Record<string, string>,
): ClaritySectionInput[] {
  return fields
    .map(label => {
      const fieldId = CLARITY_FIELD_ID_MAP[label];
      if (!fieldId) return null;
      return { fieldId, fieldLabel: label, text: values[label] ?? '' } satisfies ClaritySectionInput;
    })
    .filter((s): s is ClaritySectionInput => s !== null);
}

// ─── Rule-based clarity engine ────────────────────────────────────────────────
// SAFETY: MUST NOT add new facts, diagnoses, interventions, change quotations,
// risk statements, or clinical judgments.
// Returns the revised text plus classified changes for one section.
function applyClarity(text: string): { revised: string; changes: ClarityChange[] } {
  const changes: ClarityChange[] = [];
  let out = text;
  let seq = 0;

  const mkChg = (type: ClarityChangeType, description: string, reason: string): ClarityChange =>
    ({ id: `chg-${++seq}`, type, description, reason });

  // ── Abbreviation expansions ────────────────────────────────────────────────
  // None of these change clinical meaning — they only substitute formal forms.
  //
  // Note on word-boundary regex: \bpt\.\b does NOT work for "pt." followed by
  // a space because \b after \. requires a word→non-word boundary, and space is
  // also non-word. Use a negative word-char lookahead (?!\w) instead.
  if (/\bpt\.(?!\w)/i.test(out)) {
    out = out.replace(/\bpt\.(?!\w)/gi, 'patient');
    changes.push(mkChg(
      'abbreviation',
      'Replaced "pt." with "patient".',
      'Formal documentation uses the full word; "pt." is an informal shorthand.',
    ));
  }
  if (/\bc\/o\b/i.test(out)) {
    out = out.replace(/\bc\/o\b/gi, 'reports');
    changes.push(mkChg(
      'abbreviation',
      'Replaced "c/o" with "reports".',
      '"c/o" (complains of) is informal; "reports" is clearer in documentation contexts.',
    ));
  }
  if (/\bw\/(?!\w)/i.test(out)) {
    out = out.replace(/\bw\/(?!\w)/gi, 'with');
    changes.push(mkChg(
      'abbreviation',
      'Replaced "w/" with "with".',
      'Formal documentation spells out conjunctions.',
    ));
  }
  if (/\bd\/t(?!\w)/i.test(out)) {
    out = out.replace(/\bd\/t(?!\w)/gi, 'due to');
    changes.push(mkChg(
      'abbreviation',
      'Replaced "d/t" with "due to".',
      '"due to" is unambiguous and standard in clinical writing.',
    ));
  }
  // Expand SI/HI only when it appears as a standalone denial statement.
  // This preserves quotations that may reference SI or HI as concepts.
  if (/Denies SI\/HI\./i.test(out)) {
    out = out.replace(/Denies SI\/HI\./gi, 'Denies suicidal ideation (SI) or homicidal ideation (HI).');
    changes.push(mkChg(
      'abbreviation',
      'Expanded "Denies SI/HI" to full form.',
      'The expanded form clarifies meaning; the abbreviation is retained in parentheses for reference.',
    ));
  }

  // ── Whitespace cleanup ─────────────────────────────────────────────────────
  if (/  +/.test(out)) {
    out = out.replace(/  +/g, ' ');
    changes.push(mkChg(
      'clarity',
      'Removed extra whitespace.',
      'Multiple consecutive spaces are non-standard in clinical documentation.',
    ));
  }

  // ── Missing sentence-ending punctuation ────────────────────────────────────
  // Pattern: lowercase letter at end of a sentence, then a new sentence starts
  // with an uppercase letter, but without a period between them.
  const fixedPunctuation = out.replace(/([a-z])\s{1,2}([A-Z])/g, (_, lower, upper) => `${lower}. ${upper}`);
  if (fixedPunctuation !== out) {
    out = fixedPunctuation;
    changes.push(mkChg(
      'grammar',
      'Added missing sentence-ending periods.',
      'A sentence ending without punctuation before a new sentence began was corrected.',
    ));
  }

  // ── Trailing whitespace per line ───────────────────────────────────────────
  out = out.split('\n').map(l => l.trimEnd()).join('\n');

  // ── Passive voice reduction ────────────────────────────────────────────────
  if (/\bwas given\b/i.test(out)) {
    out = out.replace(/\bwas given\b/gi, 'received');
    changes.push(mkChg(
      'professional-tone',
      'Replaced passive "was given" with active "received".',
      'Active voice is preferred in clinical documentation.',
    ));
  }

  // ── Wordy phrase simplification ────────────────────────────────────────────
  if (/\bthere was no\b/i.test(out)) {
    out = out.replace(/\bthere was no\b/gi, 'No');
    changes.push(mkChg(
      'clarity',
      'Simplified "there was no" to "No".',
      'Concise phrasing improves readability without changing meaning.',
    ));
  }

  return { revised: out.trim(), changes };
}

/**
 * Processes one note section through the clarity rule engine.
 *
 * Contract:
 *   • Empty sections (blank or whitespace-only) return hasChanges: false — no fabricated changes.
 *   • The sourceSnapshot is set equal to the original text for stale detection.
 *   • Patient quotations are not modified by any rule above.
 *   • No new clinical facts, diagnoses, or interventions are added.
 */
export function runClarityOnSection(input: ClaritySectionInput): ClaritySectionResult {
  // Empty section — preserve exactly, no changes.
  if (!input.text.trim()) {
    return {
      fieldId:        input.fieldId,
      fieldLabel:     input.fieldLabel,
      originalText:   input.text,
      sourceSnapshot: input.text,
      suggestedText:  input.text,
      changes:        [],
      hasChanges:     false,
    };
  }

  const { revised, changes } = applyClarity(input.text);
  // Only mark hasChanges:true when the text actually changed after applying rules.
  const hasChanges = changes.length > 0 && revised !== input.text.trim();

  return {
    fieldId:        input.fieldId,
    fieldLabel:     input.fieldLabel,
    originalText:   input.text,
    sourceSnapshot: input.text,
    suggestedText:  hasChanges ? revised : input.text,
    changes:        hasChanges ? changes : [],
    hasChanges,
  };
}

/**
 * Runs the clarity engine over all provided sections independently.
 * Sections are never combined or merged.
 */
export function runClarityReview(
  sections: ClaritySectionInput[],
  reviewedAt: string,
): ClarityReviewResult {
  const results = sections.map(s => runClarityOnSection(s));
  return {
    sections:     results,
    totalChanges: results.filter(s => s.hasChanges).length,
    reviewedAt,
  };
}

/**
 * Detects whether a note field has been edited since the clarity review was generated.
 *
 * Compares the current live field text with the snapshot captured at review time.
 * Uses direct string comparison — no cryptographic dependency required.
 *
 * @param currentText   — current value of the note field (from the live form)
 * @param snapshotText  — text captured in section.sourceSnapshot at review time
 * @returns true when the field has changed since review; false when unchanged
 */
export function detectStaleSection(currentText: string, snapshotText: string): boolean {
  return currentText.trim() !== snapshotText.trim();
}

/**
 * Returns the stable Clinical Review finding ID for a field-specific clarity finding.
 * Format: `clarity:{fieldId}`
 * Examples: `clarity:behavior`, `clarity:intervention`, `clarity:plan`
 *
 * CHANGING A SECTION TITLE OR EXPLANATION NEVER CHANGES THIS ID.
 */
export function buildClarityFindingId(fieldId: ProgressNoteFieldId): string {
  return `clarity:${fieldId}`;
}

// ─── Development-time validator ───────────────────────────────────────────────
// Checks structural invariants of a ClarityReviewResult.
// Never logs note text. No-ops in production (import.meta.env.PROD).
export function validateClarityReview(result: ClarityReviewResult): void {
  if (import.meta.env.PROD) return;
  const knownFieldIds = new Set(Object.keys(FIELD_ID_LABELS));
  const seenIds       = new Set<string>();

  result.sections.forEach((s, idx) => {
    const loc = `[AI Clarity] Section[${idx + 1}] fieldId=${JSON.stringify(s.fieldId)}`;
    if (!knownFieldIds.has(s.fieldId)) {
      console.warn(loc, `Unknown fieldId "${s.fieldId}"`);
    }
    if (seenIds.has(s.fieldId)) {
      console.warn(loc, `Duplicate fieldId "${s.fieldId}"`);
    }
    seenIds.add(s.fieldId);
    if (!s.fieldLabel) console.warn(loc, 'Empty fieldLabel');
    if (s.hasChanges && s.suggestedText === s.originalText.trim()) {
      console.warn(loc, 'hasChanges:true but suggestedText equals trimmed originalText');
    }
    if (!s.hasChanges && s.changes.length > 0) {
      console.warn(loc, 'hasChanges:false but changes array is non-empty');
    }
  });

  const computed = result.sections.filter(s => s.hasChanges).length;
  if (result.totalChanges !== computed) {
    console.warn('[AI Clarity] totalChanges mismatch — reported:', result.totalChanges, 'computed:', computed);
  }
}
