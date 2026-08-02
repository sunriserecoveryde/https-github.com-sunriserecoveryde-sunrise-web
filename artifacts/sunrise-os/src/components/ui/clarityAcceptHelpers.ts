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

export interface AcceptAllClarityCallbackResult {
  /**
   * True when the updates map was non-empty and onAcceptAllClaritySections was
   * called. False when every pending section was stale (or no sections had
   * changes), in which case the callback is intentionally skipped.
   */
  callbackFired: boolean;
  /**
   * fieldIds of sections skipped because the field was edited after the review
   * was run. The caller should surface a warning for each.
   */
  staleFieldIds: ProgressNoteFieldId[];
}

// ─── resolveNextStaleSection ──────────────────────────────────────────────────

/**
 * Advances through a queue of stale fieldIds to find the next ClaritySectionResult
 * that should be surfaced to the clinician.
 *
 * Used by handleConfirmStaleAccept and handleDismissStaleAccept in
 * ProgressNoteAIAssist.tsx so that every stale section is surfaced in order —
 * not just the first one.
 *
 * @param remainingQueue  — fieldIds not yet surfaced (subset of the original staleFieldIds)
 * @param sections        — the full ClarityReviewResult.sections list
 * @returns { nextSection, newQueue } when there is another section to show,
 *          or null when the queue is exhausted.
 */
export function resolveNextStaleSection(
  remainingQueue: readonly ProgressNoteFieldId[],
  sections: readonly ClaritySectionResult[],
): { nextSection: ClaritySectionResult; newQueue: ProgressNoteFieldId[] } | null {
  for (let i = 0; i < remainingQueue.length; i++) {
    const section = sections.find(s => s.fieldId === remainingQueue[i]);
    if (section) {
      return { nextSection: section, newQueue: remainingQueue.slice(i + 1) };
    }
  }
  return null;
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

/**
 * Applies the empty-updates guard from handleAcceptAllClaritySections and calls
 * onAcceptAllClaritySections only when at least one non-stale, non-rejected,
 * non-accepted section with changes remains.
 *
 * This function IS the production gate — the React component delegates to it so
 * automated tests can exercise the exact callback-guard logic without a DOM.
 * Removing or weakening this guard here will immediately break the regression
 * tests in acceptAllCallbackNotFired.test.ts.
 */
export function runAcceptAllClarityCallback(
  sections: ClaritySectionResult[],
  currentValues: Record<string, string>,
  alreadyAccepted: ReadonlySet<ProgressNoteFieldId>,
  alreadyRejected: ReadonlySet<ProgressNoteFieldId>,
  onAcceptAllClaritySections: (updates: Partial<Record<ProgressNoteFieldId, string>>) => void,
): AcceptAllClarityCallbackResult {
  const { updates, staleFieldIds } = filterAcceptAllUpdates(
    sections,
    currentValues,
    alreadyAccepted,
    alreadyRejected,
  );

  if (Object.keys(updates).length > 0) {
    onAcceptAllClaritySections(updates);
    return { callbackFired: true, staleFieldIds };
  }

  return { callbackFired: false, staleFieldIds };
}
