/**
 * useSidebarPrefs — user-scoped localStorage preference manager for sidebar
 * shortcuts: Recent Patients, Pinned Patients, and Favorite Modules.
 *
 * Storage design
 * ──────────────
 *   Key    : "sunrise_sidebar_prefs_v2_<staffId>"  (v2 = hardening schema change)
 *   Scope  : per browser, per device, per signed-in user (staffId in key).
 *
 * Privacy guarantee (Phase 1A Hardening)
 * ───────────────────────────────────────
 *   In production mode (DATA_MODE === "production"):
 *     - Patient displayName is NOT stored in localStorage.
 *     - Patient program is NOT stored in localStorage.
 *     - Only patient ID + navigation timestamps are persisted.
 *     - The sidebar renders "[Patient record]" instead of a name.
 *
 *   In demo mode (DATA_MODE === "demo"):
 *     - displayName and program are stored for demo UX quality.
 *     - These fields contain only fictitious mock data.
 *
 *   Diagnoses, medications, notes, insurance, and all other PHI/ePHI are
 *   NEVER stored in either mode.  The schema MUST NOT be extended with
 *   clinical data.
 *
 * Cross-component sync
 * ────────────────────
 *   useSidebarPrefs(staffId) — React hook (canonical state + writes).
 *   addRecentPatient(staffId, patient) — standalone function from App.tsx.
 */

import { useState, useCallback, useEffect } from "react";
import { Screen } from "../App";
import { DATA_MODE } from "../lib/dataMode";

// ── Types ──────────────────────────────────────────────────────────────────────

/** Stored shape for a recent-patient entry. */
export interface RecentPatient {
  id: string;
  displayName: string; // stored in demo mode; empty string in production
  program: string;     // stored in demo mode; empty string in production
  openedAt: number;    // epoch ms
}

/** Stored shape for a pinned-patient entry. */
export interface PinnedPatient {
  id: string;
  displayName: string; // stored in demo mode; empty string in production
  program: string;     // stored in demo mode; empty string in production
  pinnedAt: number;
  discharged?: boolean;
}

interface SidebarPrefs {
  recentPatients: RecentPatient[];
  pinnedPatients: PinnedPatient[];
  favoriteModules: Screen[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

// Version bump from v1 → v2 ensures old pre-hardening entries with displayName
// stored in production mode are not loaded.
const KEY_PREFIX        = "sunrise_sidebar_prefs_v2_";
export const MAX_RECENT          = 5;
export const MAX_PINNED_VISIBLE  = 5;
export const MAX_FAVORITES       = 6;
const SYNC_EVENT        = "sunrise:prefs";

// ── Privacy helpers ────────────────────────────────────────────────────────────

/**
 * Strip displayName and program from a patient entry when in production mode.
 * In production, only the ID is safe to persist.
 */
function sanitiseForStorage<T extends { displayName: string; program: string }>(
  entry: T,
): T {
  if (DATA_MODE === "production") {
    return { ...entry, displayName: "", program: "" };
  }
  return entry;
}

/**
 * Return the display label for a patient entry.
 * In production mode, the stored displayName is intentionally empty;
 * show a privacy-safe placeholder instead.
 */
export function patientDisplayLabel(entry: { id: string; displayName: string }): string {
  if (DATA_MODE === "production" || !entry.displayName) {
    return `[Patient record]`;
  }
  return entry.displayName;
}

// ── Storage helpers ────────────────────────────────────────────────────────────

function storageKey(staffId: string): string {
  return `${KEY_PREFIX}${staffId}`;
}

function loadPrefs(staffId: string): SidebarPrefs {
  try {
    const raw = localStorage.getItem(storageKey(staffId));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SidebarPrefs>;
      return {
        recentPatients:  Array.isArray(parsed.recentPatients)  ? parsed.recentPatients  : [],
        pinnedPatients:  Array.isArray(parsed.pinnedPatients)   ? parsed.pinnedPatients   : [],
        favoriteModules: Array.isArray(parsed.favoriteModules)  ? parsed.favoriteModules  : [],
      };
    }
  } catch { /* corrupt storage — ignore */ }
  return { recentPatients: [], pinnedPatients: [], favoriteModules: [] };
}

function writePrefs(staffId: string, prefs: SidebarPrefs): void {
  try {
    localStorage.setItem(storageKey(staffId), JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { staffId } }));
  } catch { /* storage full — ignore */ }
}

// ── Demo-user seed ─────────────────────────────────────────────────────────────

const DEMO_STAFF_PREFIX = "demo_";

function seedDemoPrefsIfNeeded(staffId: string): void {
  if (!staffId.startsWith(DEMO_STAFF_PREFIX)) return;
  if (DATA_MODE !== "demo") return; // never seed in production
  const key = storageKey(staffId);
  if (localStorage.getItem(key)) return;
  const now = Date.now();
  const seed: SidebarPrefs = {
    recentPatients: [
      { id: "p1", displayName: "Marcus Webb",   program: "Residential", openedAt: now - 1_200_000  },
      { id: "p3", displayName: "Devon Patel",   program: "Residential", openedAt: now - 3_600_000  },
      { id: "p2", displayName: "Angela Reyes",  program: "PHP",         openedAt: now - 7_200_000  },
      { id: "p5", displayName: "Jamal Foster",  program: "Residential", openedAt: now - 14_400_000 },
    ],
    pinnedPatients: [
      { id: "p1", displayName: "Marcus Webb",   program: "Residential", pinnedAt: now - 86_400_000 },
      { id: "p3", displayName: "Devon Patel",   program: "Residential", pinnedAt: now - 72_000_000 },
      { id: "p6", displayName: "Elena Vasquez", program: "Residential", pinnedAt: now - 50_000_000, discharged: true },
    ],
    favoriteModules: ["ProgressNotes", "TreatmentPlans", "CensusBedBoard", "RevenueCycle"] as Screen[],
  };
  writePrefs(staffId, seed);
}

// ── Standalone helper (called from App.tsx) ────────────────────────────────────

export function addRecentPatient(staffId: string, patient: RecentPatient): void {
  const prefs   = loadPrefs(staffId);
  const without = prefs.recentPatients.filter(p => p.id !== patient.id);
  writePrefs(staffId, {
    ...prefs,
    recentPatients: [sanitiseForStorage(patient), ...without].slice(0, MAX_RECENT),
  });
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useSidebarPrefs(staffId: string | null) {
  const [prefs, setPrefs] = useState<SidebarPrefs>(() => {
    if (!staffId) return { recentPatients: [], pinnedPatients: [], favoriteModules: [] };
    seedDemoPrefsIfNeeded(staffId);
    return loadPrefs(staffId);
  });

  useEffect(() => {
    if (!staffId) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ staffId: string }>).detail;
      if (detail.staffId === staffId) setPrefs(loadPrefs(staffId));
    };
    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, [staffId]);

  const update = useCallback(
    (fn: (prev: SidebarPrefs) => SidebarPrefs) => {
      if (!staffId) return;
      setPrefs(prev => {
        const next = fn(prev);
        writePrefs(staffId, next);
        return next;
      });
    },
    [staffId]
  );

  // Recent patients
  const addRecent = useCallback(
    (patient: RecentPatient) =>
      update(prev => {
        const without = prev.recentPatients.filter(p => p.id !== patient.id);
        return { ...prev, recentPatients: [sanitiseForStorage(patient), ...without].slice(0, MAX_RECENT) };
      }),
    [update]
  );

  const removeRecent = useCallback(
    (patientId: string) =>
      update(prev => ({ ...prev, recentPatients: prev.recentPatients.filter(p => p.id !== patientId) })),
    [update]
  );

  const clearRecent = useCallback(
    () => update(prev => ({ ...prev, recentPatients: [] })),
    [update]
  );

  // Pinned patients
  const pinPatient = useCallback(
    (patient: PinnedPatient) =>
      update(prev => {
        if (prev.pinnedPatients.some(p => p.id === patient.id)) return prev;
        return { ...prev, pinnedPatients: [...prev.pinnedPatients, sanitiseForStorage(patient)] };
      }),
    [update]
  );

  const unpinPatient = useCallback(
    (patientId: string) =>
      update(prev => ({ ...prev, pinnedPatients: prev.pinnedPatients.filter(p => p.id !== patientId) })),
    [update]
  );

  const refreshPinnedPatient = useCallback(
    (patient: Pick<PinnedPatient, "id" | "displayName" | "program" | "discharged">) =>
      update(prev => {
        const idx = prev.pinnedPatients.findIndex(p => p.id === patient.id);
        if (idx === -1) return prev;
        const existing = prev.pinnedPatients[idx];
        const sanitised = sanitiseForStorage(patient);
        if (
          existing.displayName === sanitised.displayName &&
          existing.program     === sanitised.program &&
          existing.discharged  === patient.discharged
        ) return prev;
        const updated = [...prev.pinnedPatients];
        updated[idx] = { ...existing, displayName: sanitised.displayName, program: sanitised.program, discharged: patient.discharged };
        return { ...prev, pinnedPatients: updated };
      }),
    [update]
  );

  // Favorite modules
  const addFavorite = useCallback(
    (moduleId: Screen) =>
      update(prev => {
        if (prev.favoriteModules.includes(moduleId)) return prev;
        return { ...prev, favoriteModules: [...prev.favoriteModules, moduleId].slice(0, MAX_FAVORITES) };
      }),
    [update]
  );

  const removeFavorite = useCallback(
    (moduleId: Screen) =>
      update(prev => ({ ...prev, favoriteModules: prev.favoriteModules.filter(m => m !== moduleId) })),
    [update]
  );

  const isPinned = useCallback(
    (patientId: string) => prefs.pinnedPatients.some(p => p.id === patientId),
    [prefs.pinnedPatients]
  );

  return {
    prefs,
    addRecent, removeRecent, clearRecent,
    pinPatient, unpinPatient, refreshPinnedPatient, isPinned,
    addFavorite, removeFavorite,
  };
}
