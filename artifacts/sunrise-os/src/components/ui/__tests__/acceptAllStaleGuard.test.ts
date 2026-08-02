/**
 * acceptAllStaleGuard.test.ts
 *
 * Regression guard for the "Accept All" stale-section filter in
 * ProgressNoteAIAssist.tsx.
 *
 * Background: handleAcceptAllClaritySections filters out sections whose field
 * text was edited after the clarity review was run. Previously this filter was
 * inlined inside the React component, making it untestable. It has been
 * extracted into filterAcceptAllUpdates (clarityAcceptHelpers.ts) so the exact
 * production path can be exercised here.
 *
 * Covers:
 *   1.  A stale section is excluded from the updates map.
 *   2.  The stale section's fieldId appears in staleFieldIds.
 *   3.  Non-stale sections with changes are included in updates.
 *   4.  A section with no changes is excluded from updates and staleFieldIds.
 *   5.  An already-accepted section is excluded from updates and staleFieldIds.
 *   6.  An already-rejected section is excluded from updates and staleFieldIds.
 *   7.  When all sections with changes are stale, updates is empty and every
 *       stale fieldId is listed.
 *   8.  When no sections are stale and none are pre-accepted/rejected, all
 *       sections with changes are included.
 */

import { describe, it, expect } from 'vitest';
import {
  buildClaritySectionInputs,
  runClarityReview,
  type ClarityReviewResult,
} from '../clarityConfig';
import { filterAcceptAllUpdates } from '../clarityAcceptHelpers';
import type { ProgressNoteFieldId } from '../medicalNecessityConfig';

// ── BIRP fixture ──────────────────────────────────────────────────────────────
// Three of the four sections contain abbreviations so the clarity engine
// produces real suggestions. Plan is intentionally clean (no abbreviations)
// so hasChanges stays false — used to test that no-change sections are skipped.

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
  // Intentionally clean — no abbreviations, no passive voice, no double spaces,
  // and no lowercase-then-uppercase transition without an intervening period.
  // This keeps hasChanges:false so the "no-change section" tests remain valid.
  Plan:
    'Meet next week to review homework. Contact psychiatry if needed.',
};

function buildReview(): ClarityReviewResult {
  const inputs = buildClaritySectionInputs(BIRP_FIELDS, BIRP_VALUES);
  return runClarityReview(inputs, new Date().toISOString());
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('filterAcceptAllUpdates — stale-section guard on Accept All', () => {

  // ── 1. Stale section is excluded from updates ────────────────────────────────
  it('excludes the stale section from the updates map', () => {
    const review = buildReview();
    // Simulate the clinician editing the Behavior field after the review ran.
    const editedValues: Record<string, string> = {
      ...BIRP_VALUES,
      Behavior: BIRP_VALUES['Behavior'] + ' [edited by clinician post-review]',
    };

    const { updates } = filterAcceptAllUpdates(
      review.sections,
      editedValues,
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
    );

    expect(Object.keys(updates)).not.toContain('behavior');
  });

  // ── 2. Stale section's fieldId appears in staleFieldIds ──────────────────────
  it('adds the stale section fieldId to staleFieldIds', () => {
    const review = buildReview();
    const editedValues: Record<string, string> = {
      ...BIRP_VALUES,
      Behavior: BIRP_VALUES['Behavior'] + ' [edited by clinician post-review]',
    };

    const { staleFieldIds } = filterAcceptAllUpdates(
      review.sections,
      editedValues,
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
    );

    expect(staleFieldIds).toContain('behavior');
  });

  // ── 3. Non-stale sections with changes are included in updates ───────────────
  it('includes non-stale sections that have changes in the updates map', () => {
    const review = buildReview();
    // Only Behavior is stale; Intervention and Response are unedited.
    const editedValues: Record<string, string> = {
      ...BIRP_VALUES,
      Behavior: BIRP_VALUES['Behavior'] + ' [edited]',
    };

    const { updates } = filterAcceptAllUpdates(
      review.sections,
      editedValues,
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
    );

    // Intervention and Response both have abbreviations → hasChanges: true
    expect(Object.keys(updates)).toContain('intervention');
    expect(Object.keys(updates)).toContain('response');

    // Verify suggested text is non-trivial
    const interventionSection = review.sections.find(s => s.fieldId === 'intervention');
    expect(updates['intervention']).toBe(interventionSection!.suggestedText);
  });

  // ── 4. Section with no changes is excluded from both maps ────────────────────
  it('excludes a no-change section from updates and staleFieldIds', () => {
    const review = buildReview();
    // Confirm Plan is clean (fixture has no abbreviations)
    const planSection = review.sections.find(s => s.fieldId === 'plan');
    expect(planSection?.hasChanges).toBe(false);

    const { updates, staleFieldIds } = filterAcceptAllUpdates(
      review.sections,
      BIRP_VALUES,
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
    );

    expect(Object.keys(updates)).not.toContain('plan');
    expect(staleFieldIds).not.toContain('plan');
  });

  // ── 5. Already-accepted section is excluded ──────────────────────────────────
  it('excludes an already-accepted section from updates and staleFieldIds', () => {
    const review = buildReview();
    const alreadyAccepted = new Set<ProgressNoteFieldId>(['intervention']);

    const { updates, staleFieldIds } = filterAcceptAllUpdates(
      review.sections,
      BIRP_VALUES,
      alreadyAccepted,
      new Set<ProgressNoteFieldId>(),
    );

    expect(Object.keys(updates)).not.toContain('intervention');
    expect(staleFieldIds).not.toContain('intervention');
    // Other sections with changes are still included
    expect(Object.keys(updates)).toContain('behavior');
    expect(Object.keys(updates)).toContain('response');
  });

  // ── 6. Already-rejected section is excluded ──────────────────────────────────
  it('excludes an already-rejected section from updates and staleFieldIds', () => {
    const review = buildReview();
    const alreadyRejected = new Set<ProgressNoteFieldId>(['response']);

    const { updates, staleFieldIds } = filterAcceptAllUpdates(
      review.sections,
      BIRP_VALUES,
      new Set<ProgressNoteFieldId>(),
      alreadyRejected,
    );

    expect(Object.keys(updates)).not.toContain('response');
    expect(staleFieldIds).not.toContain('response');
    // Other sections with changes are still included
    expect(Object.keys(updates)).toContain('behavior');
    expect(Object.keys(updates)).toContain('intervention');
  });

  // ── 7. All sections with changes are stale → updates is empty ────────────────
  it('returns an empty updates map when every section with changes is stale', () => {
    const review = buildReview();
    // Edit all three sections that have changes
    const allEditedValues: Record<string, string> = {
      ...BIRP_VALUES,
      Behavior:     BIRP_VALUES['Behavior']     + ' [edit]',
      Intervention: BIRP_VALUES['Intervention'] + ' [edit]',
      Response:     BIRP_VALUES['Response']     + ' [edit]',
    };

    const { updates, staleFieldIds } = filterAcceptAllUpdates(
      review.sections,
      allEditedValues,
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
    );

    expect(Object.keys(updates)).toHaveLength(0);
    expect(staleFieldIds).toContain('behavior');
    expect(staleFieldIds).toContain('intervention');
    expect(staleFieldIds).toContain('response');
  });

  // ── 8. No stale sections → all sections with changes included ────────────────
  it('includes all sections with changes when no field has been edited since review', () => {
    const review = buildReview();

    const { updates, staleFieldIds } = filterAcceptAllUpdates(
      review.sections,
      BIRP_VALUES,   // unchanged — snapshot matches current values
      new Set<ProgressNoteFieldId>(),
      new Set<ProgressNoteFieldId>(),
    );

    // Three sections have changes (Behavior, Intervention, Response)
    expect(Object.keys(updates)).toContain('behavior');
    expect(Object.keys(updates)).toContain('intervention');
    expect(Object.keys(updates)).toContain('response');
    // No stale warnings
    expect(staleFieldIds).toHaveLength(0);
  });

});
