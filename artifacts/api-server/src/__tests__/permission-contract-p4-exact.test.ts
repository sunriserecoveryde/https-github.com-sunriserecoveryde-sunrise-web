/**
 * Permission contract — exact equality tests (Phase 4)
 *
 * These tests use strict toEqual() / exact-filter assertions.
 * "Contains at least" assertions (toContain) are intentionally NOT used;
 * every test in this file proves the EXACT set of appointment codes
 * for the permission system and for each role.
 *
 * Rationale: a "contains at least" assertion would pass even if an
 * unapproved code (e.g. appointment.export) were silently added.
 * Exact equality prevents that.
 */

import { describe, it, expect } from "vitest";
import {
  PERMISSION_CODES,
  ROLE_PERMISSIONS,
} from "../lib/permissionPolicy";

// ── Approved Phase 4 scheduling permission codes ─────────────────────────────

const FULL_SCHEDULE_SET = [
  "appointment.cancel",
  "appointment.create",
  "appointment.edit",
  "appointment.view",
  "appointment.view_facility_schedule",
] as const;

const VIEW_ONLY = ["appointment.view"] as const;
const ZERO = [] as const;

function appointmentCodes(roleId: keyof typeof ROLE_PERMISSIONS): string[] {
  return ROLE_PERMISSIONS[roleId].permissions
    .filter((c: string) => c.startsWith("appointment."))
    .sort();
}

function sortedArray(arr: readonly string[]): string[] {
  return [...arr].sort();
}

// ── §P4EQ-1 PERMISSION_CODES exact scheduling subset ─────────────────────────

describe("§P4EQ-1 PERMISSION_CODES — exact scheduling subset", () => {
  it("P4EQ-01: scheduling subset of PERMISSION_CODES is exactly the 5 approved codes", () => {
    const schedulingCodes = (PERMISSION_CODES as readonly string[])
      .filter((c) => c.startsWith("appointment."))
      .sort();
    expect(schedulingCodes).toEqual(sortedArray(FULL_SCHEDULE_SET));
  });

  it("P4EQ-02: appointment.delete is NOT in PERMISSION_CODES (soft-cancel only)", () => {
    expect(PERMISSION_CODES as readonly string[]).not.toContain("appointment.delete");
  });

  it("P4EQ-03: appointment.export is NOT in PERMISSION_CODES (not in Phase 4 scope)", () => {
    expect(PERMISSION_CODES as readonly string[]).not.toContain("appointment.export");
  });

  it("P4EQ-04: appointment.audit_view is NOT in PERMISSION_CODES (not in Phase 4 scope)", () => {
    expect(PERMISSION_CODES as readonly string[]).not.toContain("appointment.audit_view");
  });

  it("P4EQ-05: appointment.edit_own is NOT in PERMISSION_CODES (ownership enforced at service layer)", () => {
    expect(PERMISSION_CODES as readonly string[]).not.toContain("appointment.edit_own");
  });
});

// ── §P4EQ-2 Role matrix — exact scheduling codes per role ────────────────────
//
// 13 roles tested (complete set from permissionPolicy.ts).
//  5 scheduling roles → full set (5 codes)
//  2 view-only roles → 1 code (appointment.view)
//  6 roles → 0 scheduling codes

describe("§P4EQ-2 Role matrix — exact scheduling codes (13 roles)", () => {
  // ── Full scheduling access (create + view + edit + cancel + schedule view) ─

  it("P4EQ-10: clinical_supervisor — exactly 5 scheduling codes (full set)", () => {
    expect(appointmentCodes("clinical_supervisor")).toEqual(
      sortedArray(FULL_SCHEDULE_SET),
    );
  });

  it("P4EQ-11: certified_clinician — exactly 5 scheduling codes (full set)", () => {
    expect(appointmentCodes("certified_clinician")).toEqual(
      sortedArray(FULL_SCHEDULE_SET),
    );
  });

  it("P4EQ-12: mh_therapist — exactly 5 scheduling codes (full set)", () => {
    expect(appointmentCodes("mh_therapist")).toEqual(
      sortedArray(FULL_SCHEDULE_SET),
    );
  });

  it("P4EQ-13: prescriber — exactly 5 scheduling codes (full set)", () => {
    expect(appointmentCodes("prescriber")).toEqual(
      sortedArray(FULL_SCHEDULE_SET),
    );
  });

  it("P4EQ-14: nursing — exactly 5 scheduling codes (full set)", () => {
    expect(appointmentCodes("nursing")).toEqual(sortedArray(FULL_SCHEDULE_SET));
  });

  // ── View-only scheduling access ────────────────────────────────────────────

  it("P4EQ-20: bht — exactly 1 scheduling code (appointment.view only)", () => {
    expect(appointmentCodes("bht")).toEqual(sortedArray(VIEW_ONLY));
  });

  it("P4EQ-21: aftercare_staff — exactly 2 scheduling codes (appointment.view + appointment.view_facility_schedule)", () => {
    // aftercare_staff is caseload-limited (facilityWide: false) — can see the facility
    // schedule but only the appointments for patients they have explicit access to.
    expect(appointmentCodes("aftercare_staff")).toEqual(
      sortedArray(["appointment.view", "appointment.view_facility_schedule"]),
    );
  });

  // ── Zero scheduling access ─────────────────────────────────────────────────

  it("P4EQ-30: cmo — exactly 0 scheduling codes (not in Phase 4 matrix)", () => {
    expect(appointmentCodes("cmo")).toEqual(sortedArray(ZERO));
  });

  it("P4EQ-31: director_of_operations — exactly 0 scheduling codes", () => {
    expect(appointmentCodes("director_of_operations")).toEqual(sortedArray(ZERO));
  });

  it("P4EQ-32: facility_admin — exactly 0 scheduling codes", () => {
    expect(appointmentCodes("facility_admin")).toEqual(sortedArray(ZERO));
  });

  it("P4EQ-33: billing_staff — exactly 0 scheduling codes", () => {
    expect(appointmentCodes("billing_staff")).toEqual(sortedArray(ZERO));
  });

  it("P4EQ-34: ownership — exactly 0 scheduling codes", () => {
    expect(appointmentCodes("ownership")).toEqual(sortedArray(ZERO));
  });

  it("P4EQ-35: human_resources — exactly 0 scheduling codes", () => {
    expect(appointmentCodes("human_resources")).toEqual(sortedArray(ZERO));
  });

  it("P4EQ-36: security_admin — exactly 0 scheduling codes", () => {
    expect(appointmentCodes("security_admin")).toEqual(sortedArray(ZERO));
  });
});

// ── §P4EQ-3 Unapproved codes are absent ─────────────────────────────────────
//
// Any role that has zero scheduling access must have ZERO appointment.* codes,
// including any hypothetical future codes that might be slipped in accidentally.

describe("§P4EQ-3 Zero-access roles — strict absence", () => {
  const ZERO_ACCESS_ROLES = [
    "cmo",
    "director_of_operations",
    "facility_admin",
    "billing_staff",
    "ownership",
    "human_resources",
    "security_admin",
  ] as const;

  for (const role of ZERO_ACCESS_ROLES) {
    it(`P4EQ-3x: ${role} has no appointment.* codes at all`, () => {
      const codes = (
        ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS].permissions as string[]
      ).filter((c) => c.startsWith("appointment."));
      expect(codes).toEqual([]);
    });
  }
});

// ── §P4EQ-4 Phase 3 codes unchanged ─────────────────────────────────────────
//
// Phase 4 must not have modified any Phase 3 clinical note permission codes.

describe("§P4EQ-4 Phase 3 clinical note codes — unchanged by Phase 4", () => {
  const CLINICAL_NOTE_FULL = [
    "clinical_note.create",
    "clinical_note.edit_own_draft",
    "clinical_note.sign_own",
    "clinical_note.view",
    "clinical_note.void",
  ];

  const CLINICAL_NOTE_CREATE_SIGN = [
    "clinical_note.create",
    "clinical_note.edit_own_draft",
    "clinical_note.sign_own",
    "clinical_note.view",
  ];

  const CLINICAL_NOTE_PRESCRB = [
    "clinical_note.create",
    "clinical_note.sign_own",
    "clinical_note.view",
  ];

  function clinicalCodes(roleId: keyof typeof ROLE_PERMISSIONS): string[] {
    return ROLE_PERMISSIONS[roleId].permissions
      .filter((c: string) => c.startsWith("clinical_note."))
      .sort();
  }

  it("P4EQ-40: clinical_supervisor clinical codes unchanged (full set)", () => {
    expect(clinicalCodes("clinical_supervisor")).toEqual(CLINICAL_NOTE_FULL);
  });
  it("P4EQ-41: cmo clinical codes unchanged (full set)", () => {
    expect(clinicalCodes("cmo")).toEqual(CLINICAL_NOTE_FULL);
  });
  it("P4EQ-42: certified_clinician clinical codes unchanged", () => {
    expect(clinicalCodes("certified_clinician")).toEqual(CLINICAL_NOTE_CREATE_SIGN);
  });
  it("P4EQ-43: mh_therapist clinical codes unchanged", () => {
    expect(clinicalCodes("mh_therapist")).toEqual(CLINICAL_NOTE_CREATE_SIGN);
  });
  it("P4EQ-44: prescriber clinical codes unchanged", () => {
    expect(clinicalCodes("prescriber")).toEqual(CLINICAL_NOTE_PRESCRB);
  });
  it("P4EQ-45: nursing clinical codes unchanged", () => {
    expect(clinicalCodes("nursing")).toEqual(CLINICAL_NOTE_CREATE_SIGN);
  });
  it("P4EQ-46: bht clinical codes unchanged (view only)", () => {
    expect(clinicalCodes("bht")).toEqual(["clinical_note.view"]);
  });
});
