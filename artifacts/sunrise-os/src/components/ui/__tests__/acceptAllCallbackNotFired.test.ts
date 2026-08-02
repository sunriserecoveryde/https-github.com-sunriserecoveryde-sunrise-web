/**
 * acceptAllCallbackNotFired.test.ts
 *
 * Regression guard: confirms that onAcceptAllClaritySections is NEVER invoked
 * when every pending section has been edited after the clarity review was run.
 *
 * Background:
 *   handleAcceptAllClaritySections in ProgressNoteAIAssist.tsx delegates to
 *   runAcceptAllClarityCallback (clarityAcceptHelpers.ts) which contains the
 *   sole production gate:
 *
 *     if (Object.keys(updates).length > 0) {
 *       onAcceptAllClaritySections(updates);   // ← must NOT fire when empty
 *     }
 *
 *   If that guard is accidentally removed from runAcceptAllClarityCallback,
 *   these tests fail immediately — the mock will record an unexpected call.
 *
 * Strategy:
 *   Each test calls runAcceptAllClarityCallback directly. This IS the
 *   production function the React component calls; no logic is duplicated here.
 *
 * Covers:
 *   1. onAcceptAllClaritySections is never called when all sections with
 *      changes were edited post-review (updates map is empty).
 *   2. staleFieldIds lists every edited section so the UI can warn the clinician.
 *   3. callbackFired is false in the all-stale case.
 *   4. Control: callback IS called and callbackFired is true when no sections
 *      are stale — confirms the mock is wired correctly.
 *   5. Mix: one stale section, two clean — callback fires with only the clean
 *      sections; the stale section is absent from the updates argument.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildClaritySectionInputs,
  runClarityReview,
  type ClarityReviewResult,
} from '../clarityConfig';
import { runAcceptAllClarityCallback } from '../clarityAcceptHelpers';
import type { ProgressNoteFieldId } from '../medicalNecessityConfig';

// ─── Fixture ──────────────────────────────────────────────────────────────────
// Three BIRP sections contain abbreviations → hasChanges: true.
// Plan is intentionally clean → hasChanges: false.

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
  // Intentionally clean — no abbreviations → hasChanges: false
  Plan: 'Meet next week to review homework. Contact psychiatry if needed.',
};

function buildReview(): ClarityReviewResult {
  const inputs = buildClaritySectionInputs(BIRP_FIELDS, BIRP_VALUES);
  return runClarityReview(inputs, new Date().toISOString());
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('runAcceptAllClarityCallback — callback never fired when all sections are stale', () => {

  let onAcceptAllClaritySections: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onAcceptAllClaritySections = vi.fn();
  });

  // ── 1. Callback is never called when every section with changes is stale ──────
  it('does not call onAcceptAllClaritySections when all sections with changes were edited post-review', () => {
    const review = buildReview();

    // Edit every section that has changes — all three are now stale.
    const allEditedValues: Record<string, string> = {
      ...BIRP_VALUES,
      Behavior:     BIRP_VALUES['Behavior']     + ' [clinician edit post-review]',
      Intervention: BIRP_VALUES['Intervention'] + ' [clinician edit post-review]',
      Response:     BIRP_VALUES['Response']     + ' [clinician edit post-review]',
    };

    runAcceptAllClarityCallback(
      review.sections,
      allEditedValues,
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
      onAcceptAllClaritySections,
    );

    expect(onAcceptAllClaritySections).not.toHaveBeenCalled();
  });

  // ── 2. staleFieldIds lists every edited section ───────────────────────────────
  it('returns staleFieldIds for every section that was edited post-review', () => {
    const review = buildReview();

    const allEditedValues: Record<string, string> = {
      ...BIRP_VALUES,
      Behavior:     BIRP_VALUES['Behavior']     + ' [edit]',
      Intervention: BIRP_VALUES['Intervention'] + ' [edit]',
      Response:     BIRP_VALUES['Response']     + ' [edit]',
    };

    const { staleFieldIds } = runAcceptAllClarityCallback(
      review.sections,
      allEditedValues,
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
      onAcceptAllClaritySections,
    );

    expect(staleFieldIds).toContain('behavior');
    expect(staleFieldIds).toContain('intervention');
    expect(staleFieldIds).toContain('response');
    // Plan has no changes so it is never stale
    expect(staleFieldIds).not.toContain('plan');
  });

  // ── 3. callbackFired is false in the all-stale case ──────────────────────────
  it('returns callbackFired: false when every pending section was edited post-review', () => {
    const review = buildReview();

    const allEditedValues: Record<string, string> = {
      ...BIRP_VALUES,
      Behavior:     BIRP_VALUES['Behavior']     + ' [edit]',
      Intervention: BIRP_VALUES['Intervention'] + ' [edit]',
      Response:     BIRP_VALUES['Response']     + ' [edit]',
    };

    const { callbackFired } = runAcceptAllClarityCallback(
      review.sections,
      allEditedValues,
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
      onAcceptAllClaritySections,
    );

    expect(callbackFired).toBe(false);
  });

  // ── 4. Control: callback IS called when no sections are stale ─────────────────
  it('calls onAcceptAllClaritySections when no sections are stale (control case)', () => {
    const review = buildReview();

    // Pass the original unedited values — no section is stale.
    const { callbackFired, staleFieldIds } = runAcceptAllClarityCallback(
      review.sections,
      BIRP_VALUES,
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
      onAcceptAllClaritySections,
    );

    expect(callbackFired).toBe(true);
    expect(onAcceptAllClaritySections).toHaveBeenCalledTimes(1);
    expect(staleFieldIds).toHaveLength(0);

    const [passedUpdates] = onAcceptAllClaritySections.mock.calls[0];
    expect(Object.keys(passedUpdates)).toContain('behavior');
    expect(Object.keys(passedUpdates)).toContain('intervention');
    expect(Object.keys(passedUpdates)).toContain('response');
  });

  // ── 5. Mix: one stale, two clean — callback fires without the stale section ───
  it('fires the callback with only the non-stale sections when one section is stale', () => {
    const review = buildReview();

    // Stale Behavior only; Intervention and Response are unedited.
    const partiallyEditedValues: Record<string, string> = {
      ...BIRP_VALUES,
      Behavior: BIRP_VALUES['Behavior'] + ' [edit]',
    };

    const { callbackFired, staleFieldIds } = runAcceptAllClarityCallback(
      review.sections,
      partiallyEditedValues,
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
      onAcceptAllClaritySections,
    );

    // Callback must have fired (two clean sections remain).
    expect(callbackFired).toBe(true);
    expect(onAcceptAllClaritySections).toHaveBeenCalledTimes(1);

    const [passedUpdates] = onAcceptAllClaritySections.mock.calls[0];

    // Stale section must NOT be in the updates passed to the callback.
    expect(Object.keys(passedUpdates)).not.toContain('behavior');

    // Non-stale sections with changes must be included.
    expect(Object.keys(passedUpdates)).toContain('intervention');
    expect(Object.keys(passedUpdates)).toContain('response');

    // Stale section is still reported so the UI can warn the clinician.
    expect(staleFieldIds).toContain('behavior');
  });

});
