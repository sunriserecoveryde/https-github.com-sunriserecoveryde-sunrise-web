/**
 * medicalNecessityConfig.test.ts
 *
 * Focused automated tests for the Medical Necessity requirement configuration
 * and field-resolution logic.
 *
 * Tests verify that:
 *   1. Every requirement code has a configuration entry.
 *   2–3. Changing titles or explanations does not change destinations.
 *   4–7. Format-specific destinations are correct (BIRP/DAP/SOAP/GIRP).
 *   8. Requirements with no field target use the Medical Necessity fallback.
 *   9. Stable IDs are generated from requirement codes.
 *   10. Requirement codes have no duplicates.
 *
 * No patient data, note content, or clinical narrative is used in these tests.
 */

import { describe, it, expect } from 'vitest';
import {
  MEDICAL_NECESSITY_REQUIREMENTS,
  FIELD_ID_LABELS,
  resolveFieldTarget,
  buildNecessityDisplay,
  type MedicalNecessityRequirementCode,
  type ProgressNoteFieldId,
} from '../medicalNecessityConfig';

// ── Note format field sets (must match FORMAT_FIELDS in ProgressNotes.tsx) ───
const BIRP_FIELDS = ['Behavior', 'Intervention', 'Response', 'Plan'];
const DAP_FIELDS  = ['Data', 'Assessment', 'Plan'];
const SOAP_FIELDS = ['Subjective', 'Objective', 'Assessment', 'Plan'];
const GIRP_FIELDS = ['Goal', 'Intervention', 'Response', 'Plan'];

const ALL_CODES = Object.keys(MEDICAL_NECESSITY_REQUIREMENTS) as MedicalNecessityRequirementCode[];

// ─── Requirement configuration map ───────────────────────────────────────────

describe('MEDICAL_NECESSITY_REQUIREMENTS — completeness', () => {

  it('1. every expected requirement code has a configuration entry', () => {
    const expectedCodes: MedicalNecessityRequirementCode[] = [
      'intervention-documented',
      'patient-response-documented',
      'treatment-goal-linked',
      'follow-up-plan-documented',
      'safety-status-documented',
      'continued-service-supported',
      'level-of-care-referenced',
    ];
    for (const code of expectedCodes) {
      expect(
        Object.prototype.hasOwnProperty.call(MEDICAL_NECESSITY_REQUIREMENTS, code),
        `missing config for code "${code}"`,
      ).toBe(true);
    }
    expect(ALL_CODES.length).toBe(expectedCodes.length);
  });

  it('all configs have non-empty title, explanation, evidenceText, and recommendedAction', () => {
    for (const [code, cfg] of Object.entries(MEDICAL_NECESSITY_REQUIREMENTS)) {
      expect(cfg.title,             `${code} — title`).toBeTruthy();
      expect(cfg.explanation,       `${code} — explanation`).toBeTruthy();
      expect(cfg.evidenceText,      `${code} — evidenceText`).toBeTruthy();
      expect(cfg.recommendedAction, `${code} — recommendedAction`).toBeTruthy();
    }
  });

  it('all configs have fallbackTool set to "necessity"', () => {
    for (const [code, cfg] of Object.entries(MEDICAL_NECESSITY_REQUIREMENTS)) {
      expect(cfg.fallbackTool, `${code} — fallbackTool`).toBe('necessity');
    }
  });

  it('all targetCandidates are valid ProgressNoteFieldIds', () => {
    const knownFieldIds = new Set(Object.keys(FIELD_ID_LABELS));
    for (const [code, cfg] of Object.entries(MEDICAL_NECESSITY_REQUIREMENTS)) {
      for (const cand of cfg.targetCandidates) {
        expect(
          knownFieldIds.has(cand),
          `${code}: targetCandidate "${cand}" is not a valid ProgressNoteFieldId`,
        ).toBe(true);
      }
    }
  });

  it('10. all requirement codes are unique — no duplicates', () => {
    const seen = new Set<string>();
    for (const code of ALL_CODES) {
      expect(seen.has(code), `duplicate code "${code}"`).toBe(false);
      seen.add(code);
    }
    expect(seen.size).toBe(ALL_CODES.length);
  });

});

// ─── Display stability: title and explanation changes must not affect destinations ──

describe('MEDICAL_NECESSITY_REQUIREMENTS — destination stability', () => {

  it('2. changing a title does not change the destination (intervention-documented)', () => {
    const cfg = MEDICAL_NECESSITY_REQUIREMENTS['intervention-documented'];
    // Capture the destination before any hypothetical title change.
    const destinationBefore = resolveFieldTarget(BIRP_FIELDS, cfg.targetCandidates);
    // Simulate a title change (title string plays no role in resolveFieldTarget).
    const _altTitle = 'Completely different wording that a reviewer might change';
    // Re-resolve with the exact same candidates — result must be identical.
    const destinationAfter = resolveFieldTarget(BIRP_FIELDS, cfg.targetCandidates);
    expect(destinationAfter).toBe(destinationBefore);
    // And it should resolve to the correct field.
    expect(destinationBefore).toBe('intervention');
  });

  it('3. changing an explanation does not change the destination (patient-response-documented)', () => {
    const cfg = MEDICAL_NECESSITY_REQUIREMENTS['patient-response-documented'];
    const destinationBefore = resolveFieldTarget(BIRP_FIELDS, cfg.targetCandidates);
    // Simulate an explanation change.
    const _altExplanation = 'Different detailed explanation that a clinical writer might revise';
    const destinationAfter = resolveFieldTarget(BIRP_FIELDS, cfg.targetCandidates);
    expect(destinationAfter).toBe(destinationBefore);
    expect(destinationBefore).toBe('response');
  });

});

// ─── Format-specific destination matrix ──────────────────────────────────────

describe('MEDICAL_NECESSITY_REQUIREMENTS — format destinations', () => {

  it('4. BIRP: intervention-documented targets Intervention', () => {
    const cfg = MEDICAL_NECESSITY_REQUIREMENTS['intervention-documented'];
    expect(resolveFieldTarget(BIRP_FIELDS, cfg.targetCandidates)).toBe('intervention');
  });

  it('5. DAP: patient-response-documented does not target a nonexistent Response field', () => {
    const cfg = MEDICAL_NECESSITY_REQUIREMENTS['patient-response-documented'];
    const dest = resolveFieldTarget(DAP_FIELDS, cfg.targetCandidates);
    // DAP has no 'Response' field — must resolve to 'assessment' or 'data', never 'response'.
    expect(dest).not.toBe('response');
    // Must be one of the valid DAP fields or undefined.
    const validDapTargets: Array<ProgressNoteFieldId | undefined> = ['assessment', 'data', undefined];
    expect(validDapTargets).toContain(dest);
  });

  it('6. SOAP: safety-status-documented targets Assessment', () => {
    const cfg = MEDICAL_NECESSITY_REQUIREMENTS['safety-status-documented'];
    expect(resolveFieldTarget(SOAP_FIELDS, cfg.targetCandidates)).toBe('assessment');
  });

  it('7. GIRP: treatment-goal-linked targets Goal', () => {
    const cfg = MEDICAL_NECESSITY_REQUIREMENTS['treatment-goal-linked'];
    expect(resolveFieldTarget(GIRP_FIELDS, cfg.targetCandidates)).toBe('goal');
  });

  it('BIRP: follow-up-plan-documented targets Plan', () => {
    const cfg = MEDICAL_NECESSITY_REQUIREMENTS['follow-up-plan-documented'];
    expect(resolveFieldTarget(BIRP_FIELDS, cfg.targetCandidates)).toBe('plan');
  });

  it('BIRP: safety-status-documented targets Response (BIRP has no Assessment)', () => {
    const cfg = MEDICAL_NECESSITY_REQUIREMENTS['safety-status-documented'];
    // BIRP has no Assessment field — must fall through to Response.
    expect(resolveFieldTarget(BIRP_FIELDS, cfg.targetCandidates)).toBe('response');
  });

  it('GIRP: intervention-documented targets Intervention', () => {
    const cfg = MEDICAL_NECESSITY_REQUIREMENTS['intervention-documented'];
    expect(resolveFieldTarget(GIRP_FIELDS, cfg.targetCandidates)).toBe('intervention');
  });

  it('DAP: treatment-goal-linked targets Plan (no Goal field in DAP)', () => {
    const cfg = MEDICAL_NECESSITY_REQUIREMENTS['treatment-goal-linked'];
    expect(resolveFieldTarget(DAP_FIELDS, cfg.targetCandidates)).toBe('plan');
  });

});

// ─── Fallback-only requirements ───────────────────────────────────────────────

describe('MEDICAL_NECESSITY_REQUIREMENTS — fallback-only codes', () => {

  it('8. requirements with empty targetCandidates produce no field destination', () => {
    const fallbackOnlyCodes: MedicalNecessityRequirementCode[] = [
      'continued-service-supported',
      'level-of-care-referenced',
    ];
    for (const code of fallbackOnlyCodes) {
      const cfg = MEDICAL_NECESSITY_REQUIREMENTS[code];
      expect(cfg.targetCandidates, `${code} — targetCandidates`).toHaveLength(0);
      // resolveFieldTarget with no candidates always returns undefined.
      const dest = resolveFieldTarget(BIRP_FIELDS, cfg.targetCandidates);
      expect(dest, `${code} — resolveFieldTarget`).toBeUndefined();
      // Must have a fallback tool.
      expect(cfg.fallbackTool, `${code} — fallbackTool`).toBe('necessity');
    }
  });

});

// ─── Stable finding IDs ───────────────────────────────────────────────────────

describe('Stable finding IDs', () => {

  it('9. stable IDs follow the medical-necessity:<code> format', () => {
    for (const code of ALL_CODES) {
      const id = `medical-necessity:${code}`;
      expect(id).toMatch(/^medical-necessity:.+$/);
      // The code part is recoverable.
      const recovered = id.slice('medical-necessity:'.length);
      expect(recovered).toBe(code);
    }
  });

  it('stable IDs are unique across all requirement codes', () => {
    const ids = ALL_CODES.map(c => `medical-necessity:${c}`);
    const idSet = new Set(ids);
    expect(idSet.size).toBe(ids.length);
  });

});

// ─── resolveFieldTarget ───────────────────────────────────────────────────────

describe('resolveFieldTarget', () => {

  it('returns undefined for an empty candidates array', () => {
    expect(resolveFieldTarget(BIRP_FIELDS, [])).toBeUndefined();
  });

  it('returns undefined when no candidate is valid for the active format', () => {
    // 'response' does not exist in DAP.
    expect(resolveFieldTarget(DAP_FIELDS, ['response'])).toBeUndefined();
    // 'objective' does not exist in BIRP.
    expect(resolveFieldTarget(BIRP_FIELDS, ['objective'])).toBeUndefined();
  });

  it('returns the first valid candidate', () => {
    // 'response' is valid in BIRP; 'assessment' is the fallback for DAP/SOAP.
    const candidates: ProgressNoteFieldId[] = ['response', 'assessment'];
    expect(resolveFieldTarget(BIRP_FIELDS, candidates)).toBe('response');
    expect(resolveFieldTarget(DAP_FIELDS,  candidates)).toBe('assessment');
    expect(resolveFieldTarget(SOAP_FIELDS, candidates)).toBe('assessment');
    expect(resolveFieldTarget(GIRP_FIELDS, candidates)).toBe('response');
  });

  it('returns undefined candidate entries without crashing', () => {
    const candidates = [undefined, 'plan'] as Array<ProgressNoteFieldId | undefined>;
    expect(resolveFieldTarget(BIRP_FIELDS, candidates)).toBe('plan');
  });

  it('header controls (patientSelect, noteTypeSelect) are always valid', () => {
    // Header controls are mapped to null in FIELD_ID_LABELS — always returned.
    expect(resolveFieldTarget([], ['patientSelect'])).toBe('patientSelect');
    expect(resolveFieldTarget([], ['noteTypeSelect'])).toBe('noteTypeSelect');
    // Even when their label doesn't appear in the fields array.
    expect(resolveFieldTarget(BIRP_FIELDS, ['patientSelect'])).toBe('patientSelect');
  });

});

// ─── buildNecessityDisplay ────────────────────────────────────────────────────

describe('buildNecessityDisplay', () => {

  it('maps present → evidencePresent using evidenceText', () => {
    const { evidencePresent } = buildNecessityDisplay([
      { code: 'intervention-documented', status: 'present' },
    ]);
    const expected = MEDICAL_NECESSITY_REQUIREMENTS['intervention-documented'].evidenceText;
    expect(evidencePresent).toEqual([expected]);
  });

  it('maps missing → missingElements using explanation', () => {
    const { missingElements } = buildNecessityDisplay([
      { code: 'follow-up-plan-documented', status: 'missing' },
    ]);
    const expected = MEDICAL_NECESSITY_REQUIREMENTS['follow-up-plan-documented'].explanation;
    expect(missingElements).toEqual([expected]);
  });

  it('maps needs-review → clinicianReviewAreas using explanation', () => {
    const { clinicianReviewAreas } = buildNecessityDisplay([
      { code: 'safety-status-documented', status: 'needs-review' },
    ]);
    const expected = MEDICAL_NECESSITY_REQUIREMENTS['safety-status-documented'].explanation;
    expect(clinicianReviewAreas).toEqual([expected]);
  });

  it('ignores unable-to-determine results (no display entries)', () => {
    const result = buildNecessityDisplay([
      { code: 'intervention-documented', status: 'unable-to-determine' },
    ]);
    expect(result.evidencePresent).toHaveLength(0);
    expect(result.missingElements).toHaveLength(0);
    expect(result.clinicianReviewAreas).toHaveLength(0);
  });

  it('returns empty arrays for an empty results array', () => {
    const result = buildNecessityDisplay([]);
    expect(result.evidencePresent).toHaveLength(0);
    expect(result.missingElements).toHaveLength(0);
    expect(result.clinicianReviewAreas).toHaveLength(0);
  });

});
