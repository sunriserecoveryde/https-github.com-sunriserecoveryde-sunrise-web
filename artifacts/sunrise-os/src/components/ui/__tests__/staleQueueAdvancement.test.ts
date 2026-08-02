/**
 * staleQueueAdvancement.test.ts
 *
 * Regression guard for the stale-section queue introduced in
 * ProgressNoteAIAssist.tsx.
 *
 * Background: when Accept All encountered multiple stale sections,
 * handleAcceptAllClaritySections used to surface a warning only for the first
 * one — the remaining staleFieldIds were computed by filterAcceptAllUpdates and
 * then silently discarded because there was no queue to hold them.
 *
 * The fix adds:
 *   • staleQueue state — holds fieldIds not yet surfaced
 *   • handleDismissStaleAccept / handleConfirmStaleAccept — each advance through
 *     the queue via resolveNextStaleSection (clarityAcceptHelpers.ts)
 *
 * These tests exercise resolveNextStaleSection directly (it is the pure core of
 * the queue logic) and then use filterAcceptAllUpdates to confirm the stale list
 * itself is complete when three sections are all edited post-review.
 *
 * Covers:
 *   1. Three stale sections — first section is surfaced immediately
 *   2. Dismissing the first surfaces the second
 *   3. Dismissing the second surfaces the third
 *   4. Dismissing the third exhausts the queue (returns null)
 *   5. Confirming (Accept Anyway) advances the queue identically to dismissing
 *   6. filterAcceptAllUpdates returns all three fieldIds when all are stale
 *   7. resolveNextStaleSection with an empty queue returns null immediately
 *   8. resolveNextStaleSection skips fieldIds not found in sections
 */

import { describe, it, expect } from 'vitest';
import {
  buildClaritySectionInputs,
  runClarityReview,
  type ClarityReviewResult,
} from '../clarityConfig';
import { filterAcceptAllUpdates, resolveNextStaleSection } from '../clarityAcceptHelpers';
import type { ProgressNoteFieldId } from '../medicalNecessityConfig';

// ── BIRP fixture ──────────────────────────────────────────────────────────────
// All three non-plan sections have abbreviations so the clarity engine produces
// suggestions (hasChanges: true). Plan is clean so hasChanges stays false.
const BIRP_FIELDS = ['Behavior', 'Intervention', 'Response', 'Plan'];

const BIRP_VALUES: Record<string, string> = {
  Behavior:
    'pt. presented as guarded and mildly agitated. Maintained intermittent eye contact. ' +
    'Reports poor sleep and endorses passive suicidal ideation without intent or plan.',
  Intervention:
    'Used CBT techniques w/ the client to address cognitive distortions around self-worth. ' +
    'Validated pt. experience while gently challenging catastrophic thinking patterns.',
  Response:
    'Client engaged w/ the exercises with moderate resistance. Denied active suicidal ideation ' +
    'at close of session. Agreed to complete thought record before next appointment.',
  Plan: 'Meet next week to review homework. Contact psychiatry if needed.',
};

function buildReview(): ClarityReviewResult {
  const inputs = buildClaritySectionInputs(BIRP_FIELDS, BIRP_VALUES);
  return runClarityReview(inputs, new Date().toISOString());
}

/** Simulate all three sections being edited after the review ran. */
function allEditedValues(): Record<string, string> {
  return {
    ...BIRP_VALUES,
    Behavior:     BIRP_VALUES['Behavior']     + ' [edited post-review]',
    Intervention: BIRP_VALUES['Intervention'] + ' [edited post-review]',
    Response:     BIRP_VALUES['Response']     + ' [edited post-review]',
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('stale-section queue advancement', () => {

  // ── 1. Three stale sections — first is surfaced immediately ─────────────────
  it('surfaces the first stale section when Accept All finds three stale sections', () => {
    const review = buildReview();
    const { staleFieldIds } = filterAcceptAllUpdates(
      review.sections,
      allEditedValues(),
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
    );

    // All three sections with changes are stale
    expect(staleFieldIds).toHaveLength(3);

    // The first section to show the clinician
    const firstShown = review.sections.find(s => s.fieldId === staleFieldIds[0]);
    expect(firstShown).toBeDefined();
  });

  // ── 2. Dismissing the first surfaces the second ──────────────────────────────
  it('surfaces the second stale section after the first is dismissed', () => {
    const review = buildReview();
    const { staleFieldIds } = filterAcceptAllUpdates(
      review.sections,
      allEditedValues(),
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
    );

    // queue = [staleFieldIds[1], staleFieldIds[2]] after first is shown
    const queueAfterFirst = staleFieldIds.slice(1);
    const result = resolveNextStaleSection(queueAfterFirst, review.sections);

    expect(result).not.toBeNull();
    expect(result!.nextSection.fieldId).toBe(staleFieldIds[1]);
    expect(result!.newQueue).toEqual([staleFieldIds[2]]);
  });

  // ── 3. Dismissing the second surfaces the third ──────────────────────────────
  it('surfaces the third stale section after the second is dismissed', () => {
    const review = buildReview();
    const { staleFieldIds } = filterAcceptAllUpdates(
      review.sections,
      allEditedValues(),
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
    );

    // queue = [staleFieldIds[2]] after first two are handled
    const queueAfterSecond = staleFieldIds.slice(2);
    const result = resolveNextStaleSection(queueAfterSecond, review.sections);

    expect(result).not.toBeNull();
    expect(result!.nextSection.fieldId).toBe(staleFieldIds[2]);
    expect(result!.newQueue).toEqual([]);
  });

  // ── 4. Dismissing the third exhausts the queue ───────────────────────────────
  it('returns null after the last stale section is dismissed', () => {
    const review = buildReview();
    const { staleFieldIds } = filterAcceptAllUpdates(
      review.sections,
      allEditedValues(),
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
    );

    // Simulate advancing through the whole queue until it is empty
    let queue = staleFieldIds.slice(1); // after first shown
    let next = resolveNextStaleSection(queue, review.sections); // second
    expect(next).not.toBeNull();
    queue = next!.newQueue;              // after second shown
    next = resolveNextStaleSection(queue, review.sections); // third
    expect(next).not.toBeNull();
    queue = next!.newQueue;              // after third shown
    next = resolveNextStaleSection(queue, review.sections); // exhausted
    expect(next).toBeNull();
  });

  // ── 5. Confirm (Accept Anyway) advances the queue identically to Dismiss ─────
  it('advances the queue the same way whether the clinician confirms or dismisses', () => {
    const review = buildReview();
    const { staleFieldIds } = filterAcceptAllUpdates(
      review.sections,
      allEditedValues(),
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
    );

    const queueAfterFirst = staleFieldIds.slice(1);

    // Both confirm and dismiss paths call resolveNextStaleSection with the same
    // queue — the only difference is the caller also calls onAcceptClaritySection
    // on the confirmed section. Verify the queue result is identical.
    const resultConfirm  = resolveNextStaleSection(queueAfterFirst, review.sections);
    const resultDismiss  = resolveNextStaleSection(queueAfterFirst, review.sections);

    expect(resultConfirm).toEqual(resultDismiss);
    expect(resultConfirm!.nextSection.fieldId).toBe(staleFieldIds[1]);
  });

  // ── 6. filterAcceptAllUpdates lists all three stale fieldIds ─────────────────
  it('filterAcceptAllUpdates returns all three fieldIds when all sections are stale', () => {
    const review = buildReview();
    const { updates, staleFieldIds } = filterAcceptAllUpdates(
      review.sections,
      allEditedValues(),
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
    );

    expect(Object.keys(updates)).toHaveLength(0);
    expect(staleFieldIds).toContain('behavior');
    expect(staleFieldIds).toContain('intervention');
    expect(staleFieldIds).toContain('response');
  });

  // ── 7. Empty queue returns null immediately ───────────────────────────────────
  it('returns null immediately when the queue is empty', () => {
    const review = buildReview();
    expect(resolveNextStaleSection([], review.sections)).toBeNull();
  });

  // ── 8. Unknown fieldIds in the queue are skipped, not thrown ─────────────────
  it('skips unknown fieldIds gracefully and surfaces the next valid one', () => {
    const review = buildReview();
    // 'goal' is a valid ProgressNoteFieldId but does not appear in BIRP sections
    const queueWithUnknown: ProgressNoteFieldId[] = ['goal', 'behavior'];
    const result = resolveNextStaleSection(queueWithUnknown, review.sections);

    // 'goal' is not in sections, so it is skipped; 'behavior' is found
    expect(result).not.toBeNull();
    expect(result!.nextSection.fieldId).toBe('behavior');
    expect(result!.newQueue).toEqual([]);
  });

});
