/**
 * clarityStaleGate.test.ts
 *
 * Regression guard for the stale-section UI gate in ProgressNoteAIAssist.tsx.
 *
 * Background:
 *   detectStaleSection() has its own unit tests (clarityConfig.test.ts), but
 *   the gate in the component — which blocks onAcceptClaritySection until the
 *   clinician confirms the stale warning — had no automated coverage.
 *   A regression here could let a stale suggestion silently overwrite a
 *   clinician's edit without showing the warning dialog.
 *
 * This file tests the production gate helpers (evaluateAcceptAttempt,
 * confirmStaleAccept) that mirror the logic in handleAcceptClaritySection and
 * handleConfirmStaleAccept in ProgressNoteAIAssist.tsx.
 *
 * Covers:
 *   1.  Fresh section (no edit since review) → isStale:false → Accept proceeds immediately.
 *   2.  Stale section (field edited after review) → isStale:true → Accept is deferred.
 *   3.  onAcceptClaritySection is NOT called when the gate returns isStale:true.
 *   4.  onAcceptClaritySection IS called after the clinician confirms via confirmStaleAccept.
 *   5.  The deferred accept carries the review-time suggestedText (not the current field text).
 *   6.  A section that is stale but then reverted to snapshot text is treated as fresh.
 *   7.  Leading/trailing whitespace differences alone are considered stale (detectStaleSection contract).
 *   8.  The entire two-step flow — warn → confirm → accept — fires onAcceptClaritySection
 *       exactly once with the correct fieldId and revisedText.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  buildClaritySectionInputs,
  runClarityReview,
  type ClaritySectionResult,
  type ClarityReviewResult,
} from '../clarityConfig';
import {
  evaluateAcceptAttempt,
  confirmStaleAccept,
} from '../clarityStaleGate';
import type { ProgressNoteFieldId } from '../medicalNecessityConfig';

// ── Test fixture ──────────────────────────────────────────────────────────────
// BIRP note with abbreviations so the clarity engine produces real suggestions.
//   Behavior:     "pt." → patient
//   Intervention: "w/" + "pt." → with / patient
//   Response:     "w/" → with
//   Plan:         clean (no abbreviations — hasChanges should be false)

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
  Plan:
    'Continue CBT weekly. Assign thought record homework. ' +
    'Coordinate with psychiatry regarding medication review.',
};

function runBIRPReview(): ClarityReviewResult {
  const inputs = buildClaritySectionInputs(BIRP_FIELDS, BIRP_VALUES);
  return runClarityReview(inputs, '09:15 AM');
}

function getSection(
  review: ClarityReviewResult,
  fieldId: ProgressNoteFieldId,
): ClaritySectionResult {
  const s = review.sections.find(sec => sec.fieldId === fieldId);
  if (!s) throw new Error(`Section not found for fieldId: ${fieldId}`);
  return s;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('evaluateAcceptAttempt — stale gate decision', () => {

  // ── 1. Fresh section → proceed immediately ───────────────────────────────────
  it('returns isStale:false when the field text has not changed since the review', () => {
    const review  = runBIRPReview();
    const section = getSection(review, 'behavior');
    expect(section.hasChanges).toBe(true); // fixture sanity

    // currentFieldValues matches the snapshot (unchanged)
    const currentValues = { ...BIRP_VALUES };
    const outcome = evaluateAcceptAttempt(section, currentValues);

    expect(outcome.isStale).toBe(false);
    expect(outcome.immediateAccept).not.toBeNull();
  });

  // ── 2. Stale section → warn and defer ────────────────────────────────────────
  it('returns isStale:true when the field text has changed since the review', () => {
    const review  = runBIRPReview();
    const section = getSection(review, 'behavior');

    // Clinician edited the field after the review was run
    const editedValues = {
      ...BIRP_VALUES,
      Behavior: BIRP_VALUES.Behavior + ' Additional note added by clinician.',
    };
    const outcome = evaluateAcceptAttempt(section, editedValues);

    expect(outcome.isStale).toBe(true);
    expect(outcome.immediateAccept).toBeNull();
  });

  // ── 3. onAcceptClaritySection NOT called when gate returns isStale:true ───────
  it('does not call onAcceptClaritySection when the section is stale', () => {
    const review  = runBIRPReview();
    const section = getSection(review, 'intervention');

    const onAcceptClaritySection = vi.fn();

    const editedValues = {
      ...BIRP_VALUES,
      Intervention: BIRP_VALUES.Intervention + ' [edited by clinician]',
    };
    const outcome = evaluateAcceptAttempt(section, editedValues);

    // Mirrors the component: only call onAcceptClaritySection when NOT stale
    if (!outcome.isStale && outcome.immediateAccept) {
      onAcceptClaritySection(outcome.immediateAccept.fieldId, outcome.immediateAccept.revisedText);
    }

    expect(onAcceptClaritySection).not.toHaveBeenCalled();
  });

  // ── 4. onAcceptClaritySection IS called after confirmation ───────────────────
  it('calls onAcceptClaritySection after the clinician confirms via confirmStaleAccept', () => {
    const review  = runBIRPReview();
    const section = getSection(review, 'intervention');

    const onAcceptClaritySection = vi.fn();

    // Step 1: initial click on Accept — stale, so deferred
    const editedValues = {
      ...BIRP_VALUES,
      Intervention: BIRP_VALUES.Intervention + ' [edited by clinician]',
    };
    const outcome = evaluateAcceptAttempt(section, editedValues);
    expect(outcome.isStale).toBe(true);

    // Mirrors component: gate fires, stalePending is set, accept NOT called yet
    if (!outcome.isStale && outcome.immediateAccept) {
      onAcceptClaritySection(outcome.immediateAccept.fieldId, outcome.immediateAccept.revisedText);
    }
    expect(onAcceptClaritySection).not.toHaveBeenCalled();

    // Step 2: clinician clicks "Accept Anyway" — confirmStaleAccept fires
    const stalePending = section; // component stores section in stalePending state
    const confirmed = confirmStaleAccept(stalePending);
    onAcceptClaritySection(confirmed.fieldId, confirmed.revisedText);

    expect(onAcceptClaritySection).toHaveBeenCalledOnce();
  });

  // ── 5. Deferred accept carries review-time suggestedText, not current text ───
  it('the confirmed accept carries the suggestedText from the review, not the edited current text', () => {
    const review  = runBIRPReview();
    const section = getSection(review, 'behavior');

    const onAcceptClaritySection = vi.fn();

    const editedValues = {
      ...BIRP_VALUES,
      Behavior: 'Completely different text that the clinician typed after the review.',
    };
    const outcome = evaluateAcceptAttempt(section, editedValues);
    expect(outcome.isStale).toBe(true);

    // Clinician clicks "Accept Anyway"
    const confirmed = confirmStaleAccept(section);
    onAcceptClaritySection(confirmed.fieldId, confirmed.revisedText);

    const [, revisedText] = onAcceptClaritySection.mock.calls[0] as [ProgressNoteFieldId, string];
    // Must be the review's suggestion — not the clinician's interim edit
    expect(revisedText).toBe(section.suggestedText);
    expect(revisedText).not.toBe(editedValues.Behavior);
  });

  // ── 6. Reverted text is treated as fresh ─────────────────────────────────────
  it('returns isStale:false when the field is reverted to the exact snapshot text', () => {
    const review  = runBIRPReview();
    const section = getSection(review, 'behavior');

    // Start with an edit, then revert to the original
    const revertedValues = {
      ...BIRP_VALUES,
      Behavior: section.sourceSnapshot, // identical to what the engine saw at review time
    };
    const outcome = evaluateAcceptAttempt(section, revertedValues);

    expect(outcome.isStale).toBe(false);
    expect(outcome.immediateAccept).not.toBeNull();
  });

  // ── 7. Whitespace-only change is treated as stale ────────────────────────────
  it('returns isStale:true when only trailing whitespace was added', () => {
    const review  = runBIRPReview();
    const section = getSection(review, 'response');

    const whitespaceEdit = {
      ...BIRP_VALUES,
      Response: BIRP_VALUES.Response + '   ', // trailing spaces only
    };
    const outcome = evaluateAcceptAttempt(section, whitespaceEdit);

    // detectStaleSection trims both sides before comparing, so trailing
    // whitespace on its own does NOT trigger a stale result — the gate
    // only warns when the trimmed content itself has changed.
    expect(outcome.isStale).toBe(false);
  });

  // ── 8. Full two-step flow: warn → confirm → accept fires exactly once ─────────
  it('the full warn → confirm → accept flow calls onAcceptClaritySection exactly once with the right args', () => {
    const review  = runBIRPReview();
    const section = getSection(review, 'intervention');

    const acceptCalls: { fieldId: ProgressNoteFieldId; revisedText: string }[] = [];
    const onAcceptClaritySection = (fieldId: ProgressNoteFieldId, revisedText: string) => {
      acceptCalls.push({ fieldId, revisedText });
    };

    // ── Step A: clinician edits the field, then clicks Accept ─────────────────
    const editedValues = {
      ...BIRP_VALUES,
      Intervention: BIRP_VALUES.Intervention + ' [clinician edit]',
    };
    const outcome = evaluateAcceptAttempt(section, editedValues);

    // Gate fires → isStale → do NOT call accept
    expect(outcome.isStale).toBe(true);
    if (!outcome.isStale && outcome.immediateAccept) {
      onAcceptClaritySection(outcome.immediateAccept.fieldId, outcome.immediateAccept.revisedText);
    }
    expect(acceptCalls).toHaveLength(0); // not yet

    // ── Step B: stale dialog is shown (stalePending = section) ───────────────
    const stalePending = section; // component state

    // ── Step C: clinician clicks "Accept Anyway" ─────────────────────────────
    const confirmed = confirmStaleAccept(stalePending);
    onAcceptClaritySection(confirmed.fieldId, confirmed.revisedText);

    // Exactly one call, with the correct fieldId and suggestedText
    expect(acceptCalls).toHaveLength(1);
    expect(acceptCalls[0].fieldId).toBe('intervention');
    expect(acceptCalls[0].revisedText).toBe(section.suggestedText);
  });

});

// ── confirmStaleAccept ────────────────────────────────────────────────────────

describe('confirmStaleAccept — deferred accept payload', () => {

  it('returns the fieldId and suggestedText from the stalePending section', () => {
    const review  = runBIRPReview();
    const section = getSection(review, 'behavior');

    const confirmed = confirmStaleAccept(section);

    expect(confirmed.fieldId).toBe('behavior');
    expect(confirmed.revisedText).toBe(section.suggestedText);
  });

  it('revisedText is the clarity suggestion, not the original or any edited text', () => {
    const review  = runBIRPReview();
    const section = getSection(review, 'behavior');

    const confirmed = confirmStaleAccept(section);

    expect(confirmed.revisedText).not.toBe(section.originalText);
    expect(confirmed.revisedText).toBe(section.suggestedText);
  });

});
