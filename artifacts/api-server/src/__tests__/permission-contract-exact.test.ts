/**
 * Permission contract — exact equality tests (Phase 3)
 *
 * These tests use strict toEqual() / exact-filter assertions.
 * "Contains at least" assertions (toContain) are intentionally NOT used;
 * every test in this file proves the EXACT set of clinical note codes
 * for the permission system and for each role.
 *
 * Rationale: a "contains at least" assertion would pass even if an
 * unapproved code (e.g. clinical_note.export) were silently added.
 * Exact equality prevents that.
 */

import { describe, it, expect } from "vitest";
import {
  PERMISSION_CODES,
  ROLE_PERMISSIONS,
} from "../lib/permissionPolicy";

// ── Approved Phase 3 clinical note permission codes ───────────────────────────

const FULL_SET   = ["clinical_note.create", "clinical_note.view", "clinical_note.edit_own_draft", "clinical_note.sign_own", "clinical_note.void"] as const;
const CREATE_SET = ["clinical_note.create", "clinical_note.view", "clinical_note.edit_own_draft", "clinical_note.sign_own"] as const;
const PRESCRB    = ["clinical_note.create", "clinical_note.view", "clinical_note.sign_own"] as const;
const VIEW_ONLY  = ["clinical_note.view"] as const;
const ZERO       = [] as const;

function clinicalNoteCodes(roleId: keyof typeof ROLE_PERMISSIONS): string[] {
  return ROLE_PERMISSIONS[roleId].permissions
    .filter((c: string) => c.startsWith("clinical_note."))
    .sort();
}

function sortedArray(arr: readonly string[]): string[] {
  return [...arr].sort();
}

// ── §EQ-1 PERMISSION_CODES exact set ─────────────────────────────────────────

describe("§EQ-1 PERMISSION_CODES — exact clinical note subset", () => {
  it("EQ-01: clinical note subset of PERMISSION_CODES is exactly the 5 approved codes", () => {
    const clinicalCodes = (PERMISSION_CODES as readonly string[])
      .filter(c => c.startsWith("clinical_note."))
      .sort();
    expect(clinicalCodes).toEqual(sortedArray(FULL_SET));
  });

  it("EQ-02: clinical_note.sign is NOT in PERMISSION_CODES (replaced by sign_own)", () => {
    expect(PERMISSION_CODES as readonly string[]).not.toContain("clinical_note.sign");
  });

  it("EQ-03: clinical_note.export is NOT in PERMISSION_CODES (not in Phase 3 scope)", () => {
    expect(PERMISSION_CODES as readonly string[]).not.toContain("clinical_note.export");
  });

  it("EQ-04: clinical_note.audit_view is NOT in PERMISSION_CODES (not in Phase 3 scope)", () => {
    expect(PERMISSION_CODES as readonly string[]).not.toContain("clinical_note.audit_view");
  });
});

// ── §EQ-2 Role matrix — exact clinical note codes per role ───────────────────
//
// 11 roles tested (the complete set relevant to Phase 3 clinical documentation).
//  6 roles have non-zero clinical note codes; 5 have zero.

describe("§EQ-2 Role matrix — exact clinical note codes (11 roles)", () => {
  // ── Roles with full clinical note access (create + edit + sign + void) ────

  it("EQ-10: clinical_supervisor — exactly 5 codes (full set)", () => {
    expect(clinicalNoteCodes("clinical_supervisor")).toEqual(sortedArray(FULL_SET));
  });

  it("EQ-11: cmo — exactly 5 codes (full set)", () => {
    expect(clinicalNoteCodes("cmo")).toEqual(sortedArray(FULL_SET));
  });

  // ── Roles with create + sign access (no void) ─────────────────────────────

  it("EQ-12: certified_clinician — exactly 4 codes (create, view, edit_own_draft, sign_own — no void)", () => {
    expect(clinicalNoteCodes("certified_clinician")).toEqual(sortedArray(CREATE_SET));
  });

  it("EQ-13: mh_therapist — exactly 4 codes (same as certified_clinician)", () => {
    expect(clinicalNoteCodes("mh_therapist")).toEqual(sortedArray(CREATE_SET));
  });

  it("EQ-14: nursing — exactly 4 codes (create, view, edit_own_draft, sign_own — no void)", () => {
    expect(clinicalNoteCodes("nursing")).toEqual(sortedArray(CREATE_SET));
  });

  it("EQ-15: prescriber — exactly 3 codes (create, view, sign_own — no edit_own_draft, no void)", () => {
    expect(clinicalNoteCodes("prescriber")).toEqual(sortedArray(PRESCRB));
  });

  // ── Roles with view-only access ───────────────────────────────────────────

  it("EQ-16: bht — exactly 1 code (clinical_note.view only)", () => {
    expect(clinicalNoteCodes("bht")).toEqual(sortedArray(VIEW_ONLY));
  });

  // ── Roles with zero clinical note access ─────────────────────────────────

  it("EQ-20: security_admin — zero clinical note codes", () => {
    expect(clinicalNoteCodes("security_admin")).toEqual(sortedArray(ZERO));
  });

  it("EQ-21: human_resources — zero clinical note codes", () => {
    expect(clinicalNoteCodes("human_resources")).toEqual(sortedArray(ZERO));
  });

  it("EQ-22: billing_staff — zero clinical note codes", () => {
    expect(clinicalNoteCodes("billing_staff")).toEqual(sortedArray(ZERO));
  });

  it("EQ-23: ownership — zero clinical note codes", () => {
    expect(clinicalNoteCodes("ownership")).toEqual(sortedArray(ZERO));
  });

  // ── Roles not in the core 11 but worth guarding ───────────────────────────

  it("EQ-30: director_of_operations — zero clinical note codes", () => {
    expect(clinicalNoteCodes("director_of_operations")).toEqual(sortedArray(ZERO));
  });

  it("EQ-31: facility_admin — zero clinical note codes", () => {
    expect(clinicalNoteCodes("facility_admin")).toEqual(sortedArray(ZERO));
  });

  it("EQ-32: aftercare_staff — zero clinical note codes", () => {
    expect(clinicalNoteCodes("aftercare_staff")).toEqual(sortedArray(ZERO));
  });
});
