/**
 * clarityAcceptIsolation.test.ts
 *
 * Regression guard for the per-section clarity accept isolation guarantee.
 *
 * Background: an earlier engine split note content on "\n\n+" and matched
 * sections by paragraph index. If paragraph counts drifted, "Accept" on the
 * Intervention card could silently overwrite Behavior, Response, or Plan.
 * The production handler (handleAIAcceptClaritySection in ProgressNotes.tsx)
 * delegates to applyClarityAccept() from clarityAcceptHelpers.ts, which maps
 * by ProgressNoteFieldId — never by paragraph index.
 *
 * These tests import and exercise the production helpers directly so any
 * regression in the real code path is caught immediately.
 *
 * Covers:
 *   1.  Accepting the Intervention revision only updates Intervention.
 *   2.  Behavior, Response, and Plan are byte-identical to the originals.
 *   3.  The live-region announcement contains "Intervention revision inserted".
 *   4.  An unknown fieldId is a no-op (announcement is null, no field changes).
 *   5.  FIELD_ID_TO_LABEL (production) is the exact inverse of CLARITY_FIELD_ID_MAP.
 *   6.  Multi-section scenario: accepting one section leaves all others unchanged.
 *   7.  The clarity engine produces a real suggestion for the Intervention fixture.
 *   8.  applyClarityAcceptAll only updates the fields supplied in updates.
 */

import { describe, it, expect } from 'vitest';
import {
  FIELD_ID_TO_LABEL,
  applyClarityAccept,
  applyClarityAcceptAll,
} from '../clarityAcceptHelpers';
import {
  buildClaritySectionInputs,
  runClarityReview,
  CLARITY_FIELD_ID_MAP,
  type ClarityReviewResult,
  type ClaritySectionResult,
} from '../clarityConfig';
import type { ProgressNoteFieldId } from '../medicalNecessityConfig';

// ── BIRP test fixture ─────────────────────────────────────────────────────────
// Abbreviations are embedded in multiple sections so the clarity engine
// produces real suggestions in all four fields. Accepting only one should
// never touch the others.
//
//   Behavior:     "pt."  → patient
//   Intervention: "w/" + "pt." → with / patient
//   Response:     "w/"  → with
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
): ClaritySectionResult | undefined {
  return review.sections.find(s => s.fieldId === fieldId);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('applyClarityAccept — per-section isolation (production helpers)', () => {

  // ── 1. Only Intervention is updated ─────────────────────────────────────────
  it('updates only the Intervention field when fieldId is "intervention"', () => {
    const review = runBIRPReview();
    const section = getSection(review, 'intervention');
    expect(section).toBeDefined();

    const { nextValues } = applyClarityAccept(
      'intervention',
      section!.suggestedText,
      BIRP_VALUES,
    );

    expect(nextValues['Intervention']).toBe(section!.suggestedText);
  });

  // ── 2. Behavior, Response, Plan are unchanged ────────────────────────────────
  it('Behavior, Response, and Plan are byte-identical to originals after accepting Intervention', () => {
    const review = runBIRPReview();
    const section = getSection(review, 'intervention');
    expect(section).toBeDefined();

    const { nextValues } = applyClarityAccept(
      'intervention',
      section!.suggestedText,
      BIRP_VALUES,
    );

    expect(nextValues['Behavior']).toBe(BIRP_VALUES['Behavior']);
    expect(nextValues['Response']).toBe(BIRP_VALUES['Response']);
    expect(nextValues['Plan']).toBe(BIRP_VALUES['Plan']);
  });

  // ── 3. Live-region announcement contains "Intervention revision inserted" ────
  it('announcement contains "Intervention revision inserted"', () => {
    const review = runBIRPReview();
    const section = getSection(review, 'intervention');
    expect(section).toBeDefined();

    const { announcement } = applyClarityAccept(
      'intervention',
      section!.suggestedText,
      BIRP_VALUES,
    );

    expect(announcement).not.toBeNull();
    expect(announcement).toContain('Intervention revision inserted');
  });

  // ── 4. Unknown fieldId is a no-op ────────────────────────────────────────────
  it('an unrecognised fieldId leaves all values unchanged and returns null announcement', () => {
    const injected = 'INJECTED BY OLD PARAGRAPH-INDEX ENGINE';
    const { nextValues, announcement } = applyClarityAccept(
      'unknownField' as ProgressNoteFieldId,
      injected,
      BIRP_VALUES,
    );

    Object.values(nextValues).forEach(v => expect(v).not.toBe(injected));
    expect(announcement).toBeNull();
  });

  // ── 5. FIELD_ID_TO_LABEL is the exact inverse of CLARITY_FIELD_ID_MAP ────────
  it('production FIELD_ID_TO_LABEL is the exact inverse of CLARITY_FIELD_ID_MAP', () => {
    // Every label in CLARITY_FIELD_ID_MAP must round-trip through FIELD_ID_TO_LABEL
    Object.entries(CLARITY_FIELD_ID_MAP).forEach(([label, fieldId]) => {
      expect(FIELD_ID_TO_LABEL[fieldId as ProgressNoteFieldId]).toBe(label);
    });
    // Every fieldId in FIELD_ID_TO_LABEL must exist in CLARITY_FIELD_ID_MAP
    (Object.entries(FIELD_ID_TO_LABEL) as [ProgressNoteFieldId, string][]).forEach(
      ([fieldId, label]) => {
        expect(CLARITY_FIELD_ID_MAP[label]).toBe(fieldId);
      },
    );
  });

  // ── 6. Multi-section scenario ────────────────────────────────────────────────
  it('when multiple sections have changes, accepting only one leaves the others on original text', () => {
    const review = runBIRPReview();
    const behaviorSection     = getSection(review, 'behavior');
    const interventionSection = getSection(review, 'intervention');
    const responseSection     = getSection(review, 'response');

    // Fixture sanity: confirm the engine actually fires on these sections
    expect(behaviorSection?.hasChanges).toBe(true);
    expect(interventionSection?.hasChanges).toBe(true);
    expect(responseSection?.hasChanges).toBe(true);

    // Accept ONLY Intervention
    const { nextValues } = applyClarityAccept(
      'intervention',
      interventionSection!.suggestedText,
      BIRP_VALUES,
    );

    // Updated
    expect(nextValues['Intervention']).toBe(interventionSection!.suggestedText);

    // Still on original — not on any clarity suggestion
    expect(nextValues['Behavior']).toBe(BIRP_VALUES['Behavior']);
    expect(nextValues['Behavior']).not.toBe(behaviorSection!.suggestedText);
    expect(nextValues['Response']).toBe(BIRP_VALUES['Response']);
    expect(nextValues['Response']).not.toBe(responseSection!.suggestedText);
    expect(nextValues['Plan']).toBe(BIRP_VALUES['Plan']);
  });

  // ── 7. Clarity engine produces a real suggestion for Intervention ────────────
  it('the clarity engine produces a non-trivial suggestion for the Intervention section', () => {
    const review = runBIRPReview();
    const section = getSection(review, 'intervention');

    expect(section).toBeDefined();
    expect(section!.hasChanges).toBe(true);
    expect(section!.suggestedText).not.toBe(section!.originalText);
    expect(section!.suggestedText.trim().length).toBeGreaterThan(0);
  });

});

// ── applyClarityAcceptAll ─────────────────────────────────────────────────────

// ── All-four-sections fixture ─────────────────────────────────────────────────
// Each section contains at least one abbreviation so the clarity engine produces
// a real suggestion in every field.  Used exclusively by the "reject one, accept
// three" scenario below.
//
//   Behavior:     "pt."  → patient
//   Intervention: "w/"   → with
//   Response:     "c/o"  → reports
//   Plan:         "w/"   → with  (makes Plan dirty unlike the baseline fixture)
const ALL_FOUR_BIRP_VALUES: Record<string, string> = {
  Behavior:
    'pt. presented as anxious and tearful. Reports difficulty sleeping and endorses ' +
    'passive suicidal ideation without intent or plan.',
  Intervention:
    'Provided supportive counseling w/ the client. Explored triggers for anxiety ' +
    'and introduced diaphragmatic breathing technique.',
  Response:
    'Client c/o feeling overwhelmed but engaged with the breathing exercise. ' +
    'Denied active suicidal ideation at close of session.',
  Plan:
    'Continue weekly individual sessions w/ focus on anxiety management. ' +
    'Coordinate with psychiatry regarding medication review.',
};

function runAllFourReview(): ClarityReviewResult {
  const inputs = buildClaritySectionInputs(BIRP_FIELDS, ALL_FOUR_BIRP_VALUES);
  return runClarityReview(inputs, '10:00 AM');
}

describe('applyClarityAcceptAll — only supplied fields are updated', () => {

  // ── 8. Accept All updates exactly the supplied fields and no others ────────
  it('updates only Intervention + Response when those are the supplied fields', () => {
    const review = runBIRPReview();
    const interventionSection = getSection(review, 'intervention');
    const responseSection     = getSection(review, 'response');
    expect(interventionSection).toBeDefined();
    expect(responseSection).toBeDefined();

    const updates: Partial<Record<ProgressNoteFieldId, string>> = {
      intervention: interventionSection!.suggestedText,
      response:     responseSection!.suggestedText,
    };

    const { nextValues, announcement } = applyClarityAcceptAll(updates, BIRP_VALUES);

    // Supplied fields updated
    expect(nextValues['Intervention']).toBe(interventionSection!.suggestedText);
    expect(nextValues['Response']).toBe(responseSection!.suggestedText);

    // Omitted fields untouched
    expect(nextValues['Behavior']).toBe(BIRP_VALUES['Behavior']);
    expect(nextValues['Plan']).toBe(BIRP_VALUES['Plan']);

    // Announcement mentions count "2"
    expect(announcement).not.toBeNull();
    expect(announcement).toContain('2 section revisions inserted');
  });

  it('returns null announcement and unchanged values when updates map is empty', () => {
    const { nextValues, announcement } = applyClarityAcceptAll({}, BIRP_VALUES);
    expect(announcement).toBeNull();
    expect(nextValues).toEqual(BIRP_VALUES);
  });

  it('uses singular "revision" when only one section is accepted', () => {
    const review = runBIRPReview();
    const section = getSection(review, 'plan');
    // Plan is clean — use Behavior which has changes
    const behaviorSection = getSection(review, 'behavior');
    expect(behaviorSection).toBeDefined();

    const { announcement } = applyClarityAcceptAll(
      { behavior: behaviorSection!.suggestedText },
      BIRP_VALUES,
    );
    expect(announcement).toContain('1 section revision inserted');
    expect(announcement).not.toContain('revisions');
    // suppress unused variable warning
    void section;
  });

  // ── 9. Reject Behavior, accept the remaining three ───────────────────────
  // Simulates a clinician clicking "Keep Original" on the Behavior card and
  // then pressing "Accept All" — only the three approved fields should change.
  it('Accept All with Behavior rejected: Intervention, Response, Plan get suggestions; Behavior stays original', () => {
    const review = runAllFourReview();

    // Verify the engine actually produced suggestions for all four sections.
    const behaviorSection     = getSection(review, 'behavior');
    const interventionSection = getSection(review, 'intervention');
    const responseSection     = getSection(review, 'response');
    const planSection         = getSection(review, 'plan');

    expect(behaviorSection?.hasChanges).toBe(true);
    expect(interventionSection?.hasChanges).toBe(true);
    expect(responseSection?.hasChanges).toBe(true);
    expect(planSection?.hasChanges).toBe(true);

    // Clinician rejects Behavior — it is excluded from the updates map.
    const updates: Partial<Record<ProgressNoteFieldId, string>> = {
      intervention: interventionSection!.suggestedText,
      response:     responseSection!.suggestedText,
      plan:         planSection!.suggestedText,
    };

    const { nextValues, announcement } = applyClarityAcceptAll(
      updates,
      ALL_FOUR_BIRP_VALUES,
    );

    // Rejected section: original text must be preserved exactly.
    expect(nextValues['Behavior']).toBe(ALL_FOUR_BIRP_VALUES['Behavior']);
    expect(nextValues['Behavior']).not.toBe(behaviorSection!.suggestedText);

    // Accepted sections: each must hold its suggested text.
    expect(nextValues['Intervention']).toBe(interventionSection!.suggestedText);
    expect(nextValues['Response']).toBe(responseSection!.suggestedText);
    expect(nextValues['Plan']).toBe(planSection!.suggestedText);

    // Announcement must mention the correct count.
    expect(announcement).not.toBeNull();
    expect(announcement).toContain('3 section revisions inserted');
  });

});
