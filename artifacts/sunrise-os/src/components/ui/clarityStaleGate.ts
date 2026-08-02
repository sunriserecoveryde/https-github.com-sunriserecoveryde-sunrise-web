/**
 * clarityStaleGate.ts
 *
 * Pure, React-free helper that models the stale-section gate used in
 * ProgressNoteAIAssist.tsx before calling onAcceptClaritySection.
 *
 * Background:
 *   When the clinician runs "Improve Clarity", the engine captures a
 *   sourceSnapshot of each field at review time. If the clinician then
 *   edits a field before clicking Accept, detectStaleSection() returns
 *   true and the UI must:
 *     1. Show the stale-warning dialog (set stalePending).
 *     2. NOT call onAcceptClaritySection yet.
 *   Only after the clinician clicks "Accept Anyway" may the accept proceed.
 *
 * Exported:
 *   evaluateAcceptAttempt — decides whether to warn or proceed immediately.
 *   confirmStaleAccept    — produces the deferred-accept payload after confirmation.
 *
 * Both functions are pure: no side effects, no React, no DOM — safe to import
 * from automated tests.
 *
 * The component (ProgressNoteAIAssist.tsx) uses these decisions to gate
 * the onAcceptClaritySection call exactly once per successful confirmation.
 */

import { detectStaleSection, type ClaritySectionResult } from './clarityConfig';
import type { ProgressNoteFieldId } from './medicalNecessityConfig';

// ─── StaleGateOutcome ─────────────────────────────────────────────────────────

export interface StaleGateOutcome {
  /**
   * true  → field was edited since the review was run.
   *         The UI must show the stale-warning dialog.
   *         onAcceptClaritySection must NOT be called yet.
   * false → field is unchanged.
   *         onAcceptClaritySection may be called immediately.
   */
  isStale: boolean;
  /**
   * When isStale is false, contains the fieldId and revisedText to pass to
   * onAcceptClaritySection. Null when isStale is true — no accept may fire.
   */
  immediateAccept: { fieldId: ProgressNoteFieldId; revisedText: string } | null;
}

// ─── ConfirmedAccept ──────────────────────────────────────────────────────────

export interface ConfirmedAccept {
  /** fieldId to pass to onAcceptClaritySection. */
  fieldId: ProgressNoteFieldId;
  /** The suggested text from the review (may differ from current field text). */
  revisedText: string;
}

// ─── evaluateAcceptAttempt ────────────────────────────────────────────────────

/**
 * Decides whether clicking the individual Accept button should:
 *   a) proceed immediately (isStale: false → immediateAccept is populated), or
 *   b) show the stale-warning dialog and defer (isStale: true → immediateAccept is null).
 *
 * Mirrors the guard at the top of handleAcceptClaritySection in
 * ProgressNoteAIAssist.tsx. The component uses this outcome to:
 *   • When isStale is true:  call setStalePending(section) and return without
 *     calling onAcceptClaritySection.
 *   • When isStale is false: call onAcceptClaritySection with immediateAccept.
 *
 * @param section           — the clarity section the clinician is trying to accept
 * @param currentFieldValues — live textarea values keyed by field label (e.g. "Behavior")
 */
export function evaluateAcceptAttempt(
  section: ClaritySectionResult,
  currentFieldValues: Record<string, string>,
): StaleGateOutcome {
  const currentText = currentFieldValues[section.fieldLabel] ?? '';
  if (detectStaleSection(currentText, section.sourceSnapshot)) {
    return { isStale: true, immediateAccept: null };
  }
  return {
    isStale: false,
    immediateAccept: { fieldId: section.fieldId, revisedText: section.suggestedText },
  };
}

// ─── confirmStaleAccept ───────────────────────────────────────────────────────

/**
 * Produces the accept payload for the deferred path — when the clinician
 * clicks "Accept Anyway" in the stale-warning dialog.
 *
 * Mirrors handleConfirmStaleAccept in ProgressNoteAIAssist.tsx.
 * The component calls onAcceptClaritySection with the returned fieldId and
 * revisedText.
 *
 * @param stalePending — the section stored in stalePending state when the warning was shown
 */
export function confirmStaleAccept(stalePending: ClaritySectionResult): ConfirmedAccept {
  return {
    fieldId:     stalePending.fieldId,
    revisedText: stalePending.suggestedText,
  };
}
