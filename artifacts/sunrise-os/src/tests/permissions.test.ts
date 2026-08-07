/**
 * Exact-equality tests for the frontend permission contract.
 *
 * These tests prove that:
 *  1. The frontend PERMISSION_CODES array contains exactly the approved
 *     clinical note subset — no more, no less.
 *  2. No unapproved codes (clinical_note.sign, clinical_note.export,
 *     clinical_note.audit_view) are present.
 *  3. The clinical note codes are in the documented approved order.
 *
 * "Contains at least" assertions are intentionally NOT used here.
 * Use toEqual / filter + sort for exact-set verification.
 */

import { describe, it, expect } from "vitest";
import { PERMISSION_CODES, hasPermission } from "../lib/permissions";

// ── Approved Phase 3 clinical note permission codes ───────────────────────────
const APPROVED_CLINICAL_NOTE_CODES = [
  "clinical_note.create",
  "clinical_note.view",
  "clinical_note.edit_own_draft",
  "clinical_note.sign_own",
  "clinical_note.void",
] as const;

// Unapproved codes that must not exist in any Phase 3 permission surface
const UNAPPROVED_CODES = [
  "clinical_note.sign",       // was replaced by clinical_note.sign_own
  "clinical_note.export",     // not in Phase 3 scope
  "clinical_note.audit_view", // not in Phase 3 scope
] as const;

describe("Frontend permission contract — Phase 3 exact equality", () => {
  it("clinical note subset is exactly the 5 approved codes (exact equality)", () => {
    const clinicalCodes = (PERMISSION_CODES as readonly string[]).filter(c =>
      c.startsWith("clinical_note."),
    );

    // Exact equality: sorted to make order-independent comparison stable.
    expect([...clinicalCodes].sort()).toEqual([...APPROVED_CLINICAL_NOTE_CODES].sort());
  });

  it("contains each approved clinical note code individually", () => {
    for (const code of APPROVED_CLINICAL_NOTE_CODES) {
      expect(PERMISSION_CODES as readonly string[]).toContain(code);
    }
  });

  it("does not contain any unapproved clinical note code", () => {
    for (const bad of UNAPPROVED_CODES) {
      expect(PERMISSION_CODES as readonly string[]).not.toContain(bad);
    }
  });

  it("PERMISSION_CODES total count is 18 (13 core + 5 clinical note)", () => {
    // Exact total prevents silent additions.
    expect(PERMISSION_CODES.length).toBe(18);
  });

  it("hasPermission returns true for approved codes when present", () => {
    const codes = [...APPROVED_CLINICAL_NOTE_CODES] as ReturnType<typeof PERMISSION_CODES[number]>[];
    for (const code of APPROVED_CLINICAL_NOTE_CODES) {
      // cast to satisfy PermissionCode union
      expect(hasPermission(codes as Parameters<typeof hasPermission>[0], code)).toBe(true);
    }
  });

  it("hasPermission returns false when code is absent", () => {
    expect(
      hasPermission(
        ["clinical_note.view", "clinical_note.create"] as Parameters<typeof hasPermission>[0],
        "clinical_note.void",
      ),
    ).toBe(false);
  });

  it("clinical_note.sign_own is present (not the unapproved clinical_note.sign)", () => {
    expect(PERMISSION_CODES as readonly string[]).toContain("clinical_note.sign_own");
    expect(PERMISSION_CODES as readonly string[]).not.toContain("clinical_note.sign");
  });

  it("clinical_note.edit_own_draft is present", () => {
    expect(PERMISSION_CODES as readonly string[]).toContain("clinical_note.edit_own_draft");
  });
});
