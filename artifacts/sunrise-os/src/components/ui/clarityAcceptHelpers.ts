/**
 * clarityAcceptHelpers.ts
 *
 * Pure, React-free helpers that drive the "Accept clarity revision" action in
 * the progress-notes form. Extracted from ProgressNotes.tsx so that automated
 * tests can import and exercise the production logic directly — not a replica.
 *
 * Exported:
 *   FIELD_ID_TO_LABEL        — canonical ProgressNoteFieldId → form field label map
 *   applyClarityAccept       — single-section accept (used by handleAIAcceptClaritySection)
 *   applyClarityAcceptAll    — multi-section accept  (used by handleAIAcceptAllClaritySections)
 *
 * Design contract:
 *   • Both functions are pure: they return new objects and never mutate inputs.
 *   • Only the field(s) present in the update are changed — all others are
 *     preserved via object spread, matching the setValues(prev => ...) pattern
 *     used in the React component.
 *   • An unknown fieldId is a no-op: nextValues === currentValues, announcement === null.
 *   • announcement is the exact string ProgressNotes.tsx sets on the live region.
 *   • Must stay in sync with FORMAT_FIELDS in ProgressNotes.tsx and
 *     CLARITY_FIELD_ID_MAP in clarityConfig.ts.
 */

import type { ProgressNoteFieldId } from './medicalNecessityConfig';
import { detectStaleSection, type ClaritySectionResult } from './clarityConfig';

// ─── FIELD_ID_TO_LABEL ────────────────────────────────────────────────────────
// Maps every ProgressNoteFieldId that appears in a note section to the exact
// field label string used as the textarea values key in ProgressNotes.tsx.
// Keep in sync with FORMAT_FIELDS in ProgressNotes.tsx and
// CLARITY_FIELD_ID_MAP in clarityConfig.ts.
export const FIELD_ID_TO_LABEL: Readonly<Partial<Record<ProgressNoteFieldId, string>>> = {
  behavior:     'Behavior',
  intervention: 'Intervention',
  response:     'Response',
  plan:         'Plan',
  data:         'Data',
  assessment:   'Assessment',
  subjective:   'Subjective',
  objective:    'Objective',
  goal:         'Goal',
} as const;

// ─── applyClarityAccept ───────────────────────────────────────────────────────

export interface ClarityAcceptResult {
  /** New field-value map. Only the accepted field is changed; all others are
   *  identical references to the originals (spread-preserved). */
  nextValues: Record<string, string>;
  /** Text to set on the ARIA live region, or null when fieldId is unrecognised
   *  (no-op path — no field is modified and no announcement fires). */
  announcement: string | null;
}

/**
 * Computes the next note-values map after the clinician accepts a single
 * clarity revision. Mirrors the state-update logic in handleAIAcceptClaritySection.
 *
 * @param fieldId      — stable ProgressNoteFieldId for the accepted section
 * @param revisedText  — the suggested text the clinician approved
 * @param currentValues — current textarea values keyed by field label
 */
export function applyClarityAccept(
  fieldId: ProgressNoteFieldId,
  revisedText: string,
  currentValues: Record<string, string>,
): ClarityAcceptResult {
  const fieldLabel = FIELD_ID_TO_LABEL[fieldId];
  if (!fieldLabel) {
    return { nextValues: { ...currentValues }, announcement: null };
  }
  return {
    nextValues: { ...currentValues, [fieldLabel]: revisedText },
    announcement: `${fieldLabel} revision inserted — clinician review required before signing.`,
  };
}

// ─── applyClarityAcceptAll ────────────────────────────────────────────────────

export interface ClarityAcceptAllResult {
  /** New field-value map. Only the fields present in updates are changed. */
  nextValues: Record<string, string>;
  /** Text to set on the ARIA live region, or null when no recognised field was
   *  updated (no-op path — all fieldIds were unknown or updates was empty). */
  announcement: string | null;
}

/**
 * Computes the next note-values map after the clinician accepts all remaining
 * (non-rejected) clarity revisions via "Accept All". Mirrors the state-update
 * logic in handleAIAcceptAllClaritySections.
 *
 * @param updates       — map of fieldId → revised text; contains only approved fields
 * @param currentValues — current textarea values keyed by field label
 */
// ─── filterAcceptAllUpdates ───────────────────────────────────────────────────

export interface AcceptAllFilterResult {
  /** Sections that passed all filters and are safe to write to the note. */
  updates: Partial<Record<ProgressNoteFieldId, string>>;
  /**
   * fieldIds of sections skipped because the field was edited after the review
   * was run. The caller should surface a warning for each.
   */
  staleFieldIds: ProgressNoteFieldId[];
}

/**
 * Filters a ClarityReviewResult's sections for the "Accept All" action.
 *
 * Skips sections that:
 *   • have no changes (hasChanges: false)
 *   • the clinician already individually accepted
 *   • the clinician already individually rejected
 *   • have been edited since the review was run (detectStaleSection)
 *
 * Returns the updates map (safe to pass directly to onAcceptAllClaritySections)
 * and the list of stale fieldIds so the caller can show a warning for each one.
 *
 * This is the canonical extraction of the filtering logic from
 * handleAcceptAllClaritySections in ProgressNoteAIAssist.tsx.
 * Keep the two in sync.
 */
export function filterAcceptAllUpdates(
  sections: ClaritySectionResult[],
  currentValues: Record<string, string>,
  alreadyAccepted: ReadonlySet<ProgressNoteFieldId>,
  alreadyRejected: ReadonlySet<ProgressNoteFieldId>,
): AcceptAllFilterResult {
  const updates: Partial<Record<ProgressNoteFieldId, string>> = {};
  const staleFieldIds: ProgressNoteFieldId[] = [];

  sections.forEach(s => {
    if (!s.hasChanges) return;
    if (alreadyAccepted.has(s.fieldId)) return;
    if (alreadyRejected.has(s.fieldId)) return;
    const currentText = currentValues[s.fieldLabel] ?? '';
    if (detectStaleSection(currentText, s.sourceSnapshot)) {
      staleFieldIds.push(s.fieldId);
      return;
    }
    updates[s.fieldId] = s.suggestedText;
  });

  return { updates, staleFieldIds };
}

// ─── applyClarityAcceptAll ────────────────────────────────────────────────────

export function applyClarityAcceptAll(
  updates: Partial<Record<ProgressNoteFieldId, string>>,
  currentValues: Record<string, string>,
): ClarityAcceptAllResult {
  const labelUpdates: Record<string, string> = {};
  (Object.entries(updates) as [ProgressNoteFieldId, string | undefined][]).forEach(
    ([fid, revised]) => {
      const fieldLabel = FIELD_ID_TO_LABEL[fid];
      if (fieldLabel && revised !== undefined) {
        labelUpdates[fieldLabel] = revised;
      }
    },
  );

  if (Object.keys(labelUpdates).length === 0) {
    return { nextValues: { ...currentValues }, announcement: null };
  }

  const count = Object.keys(labelUpdates).length;
  return {
    nextValues: { ...currentValues, ...labelUpdates },
    announcement: `${count} section revision${count !== 1 ? 's' : ''} inserted — clinician review required before signing.`,
  };
}
