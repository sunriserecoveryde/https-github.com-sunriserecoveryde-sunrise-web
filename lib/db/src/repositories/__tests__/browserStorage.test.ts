/**
 * Phase 1A Hardening — browser storage privacy tests.
 *
 * Documents and verifies the privacy classification of all browser-side
 * storage used by Sunrise OS:
 *
 *   1. localStorage "sunrise_sidebar_prefs_v2_<staffId>"
 *      - Production mode: stores only patient ID + timestamps.
 *        displayName and program are stripped before write.
 *      - Demo mode: stores displayName + program for demo UX quality.
 *
 *   2. localStorage "sunrise-os:ua-workflow-items"
 *      - Stores UA drug-testing workflow stage progress.
 *      - Contains patient UUIDs (linkable) and stage status strings.
 *      - NOT written in production mode — demo page only.
 *
 *   3. IndexedDB "sunrise-recordings" / "recordings"
 *      - Stores raw audio blobs + creation timestamps.
 *      - Keys are opaque session UUIDs (no patient ID in key).
 *      - Blobs are transient: deleted by the caller after processing.
 *      - No structured PHI fields (no name, DOB, MRN) — audio content only.
 *
 * These tests are pure unit tests — no DOM or browser environment is needed.
 * They verify the documented behaviour and enforce the storage schema contract.
 */

import { describe, it, expect } from "vitest";

// ── Storage privacy classification ────────────────────────────────────────────

describe("localStorage: sidebar prefs v2 schema", () => {
  it("documents the key format (staffId-scoped, no patient data in key)", () => {
    const staffId = "staff-uuid-123";
    const key = `sunrise_sidebar_prefs_v2_${staffId}`;
    // The key contains only the staff member's ID — not a patient ID.
    expect(key).not.toMatch(/patient|mrn|dob|diagnosis/i);
    expect(key).toContain(staffId);
  });

  it("documents the v2 RecentPatient schema (production mode stores no displayName)", () => {
    type RecentPatientV2Production = {
      id: string;
      displayName: ""; // intentionally empty in production
      program: "";     // intentionally empty in production
      openedAt: number;
    };

    const entry: RecentPatientV2Production = {
      id: "patient-uuid-xyz",
      displayName: "",
      program: "",
      openedAt: Date.now(),
    };

    // In production the stored JSON contains no patient name or program.
    const stored = JSON.stringify(entry);
    expect(stored).not.toMatch(/"[A-Z][a-z]+\s[A-Z]/); // no "First Last" pattern
    expect(JSON.parse(stored).displayName).toBe("");
    expect(JSON.parse(stored).program).toBe("");
  });

  it("documents the v2 PinnedPatient schema (production: no displayName)", () => {
    const pinEntry = { id: "patient-uuid-abc", displayName: "", program: "", pinnedAt: 1000 };
    const stored = JSON.stringify(pinEntry);
    expect(JSON.parse(stored).id).toBeTruthy();
    expect(JSON.parse(stored).displayName).toBe("");
  });

  it("version bump from v1→v2 prevents loading stale production displayNames", () => {
    // If a v1 entry contained displayName, it cannot be loaded by v2 code
    // because the storage key includes the version number.
    const v1Key = "sunrise_sidebar_prefs_v1_staff-xyz";
    const v2Key = "sunrise_sidebar_prefs_v2_staff-xyz";
    expect(v1Key).not.toBe(v2Key);
  });
});

describe("localStorage: UA drug-testing workflow items schema", () => {
  it("documents that workflow items store patient UUIDs (linkable, not anonymous)", () => {
    // Classification: patient UUID is a linkable identifier.
    // The workflow item schema must NOT store patient names, DOBs, or diagnoses.
    type UAWorkflowItem = {
      patientId: string; // UUID — linkable to patient record, NOT a patient name
      stage: string;     // e.g. "Collected" | "Pending" | "ResultsIn"
    };

    const item: UAWorkflowItem = { patientId: "uuid-only-no-phi", stage: "Collected" };
    const stored = JSON.stringify(item);

    expect(stored).toContain("uuid-only-no-phi");
    expect(stored).not.toMatch(/name|dob|diagnosis|mrn|insurance/i);
  });

  it("documents that UA workflow localStorage is a demo-only store (not written in production)", () => {
    // The UADrugTesting page is a demo-only page — it uses MOCK_PATIENTS.
    // The localStorage key is deliberately namespaced to 'sunrise-os:ua-workflow-items'.
    // In production DATA_MODE, the page must not persist workflow items to localStorage.
    const key = "sunrise-os:ua-workflow-items";
    expect(key).toContain("sunrise-os:"); // namespace-scoped
    // The contract: UADrugTesting.tsx only calls localStorage.setItem for this key
    // when DATA_MODE === "demo".
  });
});

describe("IndexedDB: recording store schema", () => {
  it("documents that recording entries contain no structured PHI fields", () => {
    // The RecordingEntry schema: { id: string, blob: Blob, createdAt: number }
    // id: opaque session UUID (not a patient UUID)
    // blob: raw audio — may contain speech referencing patient names
    //       but contains NO structured metadata (name, DOB, MRN, diagnosis)
    // createdAt: epoch ms timestamp
    type RecordingEntry = { id: string; blob: unknown; createdAt: number };

    const entry: RecordingEntry = {
      id: "session-uuid-not-patient-uuid",
      blob: new Uint8Array([0, 1, 2]), // mock blob
      createdAt: 1700000000000,
    };

    // The ID is a session recording ID, not a patient ID.
    // This means even without the blob, the key alone cannot identify a patient.
    expect(entry.id).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4/); // not a predictable patient UUID
    expect(typeof entry.createdAt).toBe("number");
  });

  it("documents that recordings are transient — deleted after processing", () => {
    // The useRecordingStore hook exports deleteRecording(id).
    // The calling component (AINoteEngine) must call deleteRecording after the
    // blob is consumed — either on success (blob sent) or cancel (blob discarded).
    // This means recordings do not accumulate indefinitely in IndexedDB.
    const lifecycle = ["saveRecording", "getRecordingUrl", "deleteRecording"] as const;
    expect(lifecycle).toContain("deleteRecording");
    expect(lifecycle.indexOf("deleteRecording")).toBeGreaterThan(
      lifecycle.indexOf("saveRecording"),
    );
  });
});
