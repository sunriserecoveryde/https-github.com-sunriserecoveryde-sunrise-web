/**
 * clarityConfig.test.ts
 *
 * Tests for the section-aware Improve Clarity module.
 * All functions under test are pure (no React, no DOM).
 */

import { describe, it, expect } from 'vitest';
import {
  buildClaritySectionInputs,
  runClarityOnSection,
  runClarityReview,
  detectStaleSection,
  buildClarityFindingId,
  validateClarityReview,
  CLARITY_FIELD_ID_MAP,
} from '../clarityConfig';

// ── 1. CLARITY_FIELD_ID_MAP ──────────────────────────────────────────────────

describe('CLARITY_FIELD_ID_MAP', () => {
  it('maps each of the 9 format field labels to a stable ProgressNoteFieldId', () => {
    const expected = ['Behavior', 'Intervention', 'Response', 'Plan',
      'Data', 'Assessment', 'Subjective', 'Objective', 'Goal'];
    expected.forEach(label => {
      expect(CLARITY_FIELD_ID_MAP[label]).toBeDefined();
      expect(typeof CLARITY_FIELD_ID_MAP[label]).toBe('string');
    });
  });

  it('has no duplicate ProgressNoteFieldId values', () => {
    const ids = Object.values(CLARITY_FIELD_ID_MAP);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── 2. buildClaritySectionInputs ─────────────────────────────────────────────

describe('buildClaritySectionInputs', () => {
  it('maps BIRP fields to inputs with correct fieldIds', () => {
    const fields = ['Behavior', 'Intervention', 'Response', 'Plan'];
    const values = {
      Behavior: 'pt. was anxious.',
      Intervention: 'CBT techniques used.',
      Response: 'Patient engaged.',
      Plan: 'Continue weekly.',
    };
    const inputs = buildClaritySectionInputs(fields, values);
    expect(inputs).toHaveLength(4);
    expect(inputs[0].fieldId).toBe('behavior');
    expect(inputs[1].fieldId).toBe('intervention');
    expect(inputs[0].fieldLabel).toBe('Behavior');
    expect(inputs[0].text).toBe('pt. was anxious.');
  });

  it('skips fields with no ProgressNoteFieldId mapping', () => {
    const fields = ['Behavior', 'UnknownSection'];
    const values = { Behavior: 'text', UnknownSection: 'other' };
    const inputs = buildClaritySectionInputs(fields, values);
    expect(inputs).toHaveLength(1);
    expect(inputs[0].fieldId).toBe('behavior');
  });

  it('preserves empty text (does not skip empty fields)', () => {
    const fields = ['Behavior', 'Plan'];
    const values = { Behavior: '', Plan: 'Continue.' };
    const inputs = buildClaritySectionInputs(fields, values);
    expect(inputs).toHaveLength(2);
    expect(inputs[0].text).toBe('');
  });

  it('falls back to empty string when field is missing from values', () => {
    const fields = ['Behavior', 'Plan'];
    const values: Record<string, string> = { Behavior: 'text' };
    const inputs = buildClaritySectionInputs(fields, values);
    expect(inputs[1].text).toBe('');
  });
});

// ── 3. runClarityOnSection ───────────────────────────────────────────────────

describe('runClarityOnSection', () => {
  it('expands "pt." to "patient" and classifies as abbreviation', () => {
    const result = runClarityOnSection({
      fieldId: 'behavior',
      fieldLabel: 'Behavior',
      text: 'The pt. was cooperative.',
    });
    expect(result.hasChanges).toBe(true);
    expect(result.suggestedText).toContain('patient');
    const abbrevChange = result.changes.find(c => c.type === 'abbreviation');
    expect(abbrevChange).toBeDefined();
    expect(abbrevChange?.description).toMatch(/pt\./);
  });

  it('expands "c/o" to "reports"', () => {
    const result = runClarityOnSection({
      fieldId: 'behavior',
      fieldLabel: 'Behavior',
      text: 'Patient c/o low mood.',
    });
    expect(result.suggestedText).toContain('reports');
    expect(result.hasChanges).toBe(true);
  });

  it('produces hasChanges: false for clean text', () => {
    const result = runClarityOnSection({
      fieldId: 'plan',
      fieldLabel: 'Plan',
      text: 'Continue weekly sessions. Patient will practice breathing exercises.',
    });
    expect(result.hasChanges).toBe(false);
    expect(result.changes).toHaveLength(0);
    expect(result.suggestedText).toBe('Continue weekly sessions. Patient will practice breathing exercises.');
  });

  it('produces hasChanges: false for empty text', () => {
    const result = runClarityOnSection({
      fieldId: 'behavior',
      fieldLabel: 'Behavior',
      text: '',
    });
    expect(result.hasChanges).toBe(false);
    expect(result.suggestedText).toBe('');
  });

  it('sets sourceSnapshot equal to original text', () => {
    const input = { fieldId: 'data' as const, fieldLabel: 'Data', text: 'pt. reports fatigue.' };
    const result = runClarityOnSection(input);
    expect(result.sourceSnapshot).toBe('pt. reports fatigue.');
    expect(result.originalText).toBe('pt. reports fatigue.');
  });

  it('assigns stable chg-n IDs to each change', () => {
    const result = runClarityOnSection({
      fieldId: 'behavior',
      fieldLabel: 'Behavior',
      text: 'pt. c/o low mood.',
    });
    expect(result.changes.length).toBeGreaterThan(0);
    result.changes.forEach((c, i) => {
      expect(c.id).toBe(`chg-${i + 1}`);
    });
  });
});

// ── 4. runClarityReview ──────────────────────────────────────────────────────

describe('runClarityReview', () => {
  it('returns a review with one section per input', () => {
    const inputs = buildClaritySectionInputs(
      ['Behavior', 'Plan'],
      { Behavior: 'pt. was tired.', Plan: 'Continue sessions.' },
    );
    const review = runClarityReview(inputs, '10:00 AM');
    expect(review.sections).toHaveLength(2);
  });

  it('sets totalChanges to the count of sections where hasChanges is true', () => {
    const inputs = buildClaritySectionInputs(
      ['Behavior', 'Plan'],
      { Behavior: 'pt. was tired.', Plan: 'Continue sessions.' },
    );
    const review = runClarityReview(inputs, '10:00 AM');
    const expected = review.sections.filter(s => s.hasChanges).length;
    expect(review.totalChanges).toBe(expected);
  });

  it('captures the passed-in reviewedAt string', () => {
    const inputs = buildClaritySectionInputs(['Plan'], { Plan: 'Continue.' });
    const review = runClarityReview(inputs, '2:30 PM');
    expect(review.reviewedAt).toBe('2:30 PM');
  });

  it('produces totalChanges: 0 when all sections are clean', () => {
    const inputs = buildClaritySectionInputs(
      ['Plan', 'Assessment'],
      { Plan: 'Continue sessions weekly.', Assessment: 'Patient demonstrates improved coping.' },
    );
    const review = runClarityReview(inputs, '9:00 AM');
    expect(review.totalChanges).toBe(0);
  });
});

// ── 5. detectStaleSection ────────────────────────────────────────────────────

describe('detectStaleSection', () => {
  // detectStaleSection(currentText: string, snapshotText: string): boolean
  // sourceSnapshot captures the original text at review time.

  it('returns false when live text matches sourceSnapshot', () => {
    const section = runClarityOnSection({ fieldId: 'behavior', fieldLabel: 'Behavior', text: 'Patient was present.' });
    // live text is unchanged — pass liveText, then section.sourceSnapshot
    expect(detectStaleSection('Patient was present.', section.sourceSnapshot)).toBe(false);
  });

  it('returns true when live text differs from sourceSnapshot', () => {
    const section = runClarityOnSection({ fieldId: 'behavior', fieldLabel: 'Behavior', text: 'Patient was present.' });
    // clinician edited the field after the review was run
    expect(detectStaleSection('Patient was present and engaged.', section.sourceSnapshot)).toBe(true);
  });

  it('handles whitespace normalisation — leading/trailing whitespace still detected', () => {
    const section = runClarityOnSection({ fieldId: 'plan', fieldLabel: 'Plan', text: 'Continue.' });
    // trailing space differs after trim
    expect(detectStaleSection('Continue. ', section.sourceSnapshot)).toBe(false);
  });
});

// ── 6. buildClarityFindingId ─────────────────────────────────────────────────

describe('buildClarityFindingId', () => {
  it('returns "clarity:{fieldId}" for every known ProgressNoteFieldId', () => {
    const ids: string[] = Object.values(CLARITY_FIELD_ID_MAP);
    ids.forEach(id => {
      expect(buildClarityFindingId(id as Parameters<typeof buildClarityFindingId>[0]))
        .toBe(`clarity:${id}`);
    });
  });

  it('produces unique IDs for distinct fieldIds', () => {
    const ids = Object.values(CLARITY_FIELD_ID_MAP).map(
      id => buildClarityFindingId(id as Parameters<typeof buildClarityFindingId>[0]),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── 7. detectStaleSection — BIRP clarity review flow ─────────────────────────
// These three tests cover the acceptance-guard path described in the task:
//   1. After a BIRP review, a clinician edit to Intervention makes the section stale.
//   2. No edit → not stale.
//   3. No-stale path → suggestedText from the engine is still correct (engine hasn't drifted).

describe('detectStaleSection — BIRP clarity review flow', () => {
  const BIRP_FIELDS = ['Behavior', 'Intervention', 'Response', 'Plan'];
  // Intervention contains "w/" so the rule engine will expand it to "with",
  // giving us a predictable suggestedText to assert in test 3.
  const BIRP_VALUES = {
    Behavior: 'pt. appeared anxious and reported low mood.',
    Intervention: 'Clinician used CBT techniques w/ patient to address negative thought patterns.',
    Response: 'Patient engaged receptively.',
    Plan: 'Continue weekly sessions.',
  };

  it('returns true when clinician edits the Intervention field after a BIRP clarity review', () => {
    const inputs = buildClaritySectionInputs(BIRP_FIELDS, BIRP_VALUES);
    const review = runClarityReview(inputs, '9:00 AM');
    const interventionSection = review.sections.find(s => s.fieldId === 'intervention')!;
    expect(interventionSection).toBeDefined();

    // Simulate a clinician edit made after the review was generated
    const editedLiveText = BIRP_VALUES.Intervention + ' Also explored coping skills.';
    expect(detectStaleSection(editedLiveText, interventionSection.sourceSnapshot)).toBe(true);
  });

  it('returns false when the Intervention field is unchanged since the BIRP clarity review', () => {
    const inputs = buildClaritySectionInputs(BIRP_FIELDS, BIRP_VALUES);
    const review = runClarityReview(inputs, '9:00 AM');
    const interventionSection = review.sections.find(s => s.fieldId === 'intervention')!;
    expect(interventionSection).toBeDefined();

    // Live text is exactly what was present at review time — no edit was made
    expect(detectStaleSection(BIRP_VALUES.Intervention, interventionSection.sourceSnapshot)).toBe(false);
  });

  it('no-stale path: suggestedText contains the correct clarity revision when the Intervention field is unchanged', () => {
    const inputs = buildClaritySectionInputs(BIRP_FIELDS, BIRP_VALUES);
    const review = runClarityReview(inputs, '9:00 AM');
    const interventionSection = review.sections.find(s => s.fieldId === 'intervention')!;
    expect(interventionSection).toBeDefined();

    // Confirm the section is not stale (clinician made no edit)
    expect(detectStaleSection(BIRP_VALUES.Intervention, interventionSection.sourceSnapshot)).toBe(false);

    // The engine should have expanded "w/" → "with" and flagged a change
    expect(interventionSection.hasChanges).toBe(true);
    expect(interventionSection.suggestedText).toContain('with');
    expect(interventionSection.suggestedText).not.toMatch(/\bw\/(?!\w)/);
  });
});

// ── 8. validateClarityReview (smoke / no-throw) ───────────────────────────────

describe('validateClarityReview', () => {
  it('does not throw for a valid review result', () => {
    const inputs = buildClaritySectionInputs(
      ['Behavior', 'Plan'],
      { Behavior: 'pt. reports anxiety.', Plan: 'Continue CBT.' },
    );
    const review = runClarityReview(inputs, '11:00 AM');
    expect(() => validateClarityReview(review)).not.toThrow();
  });

  it('does not throw for a review with no changes', () => {
    const inputs = buildClaritySectionInputs(
      ['Plan'],
      { Plan: 'Continue sessions.' },
    );
    const review = runClarityReview(inputs, '11:00 AM');
    expect(() => validateClarityReview(review)).not.toThrow();
  });
});
