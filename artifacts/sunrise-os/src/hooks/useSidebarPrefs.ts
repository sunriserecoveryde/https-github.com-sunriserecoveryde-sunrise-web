/**
 * useSidebarPrefs — user-scoped localStorage preference manager for sidebar
 * shortcuts: Recent Patients, Pinned Patients, and Favorite Modules.
 *
 * Storage design
 * ──────────────
 *   Key    : "sunrise_sidebar_prefs_v1_<staffId>"
 *   Scope  : per browser, per device, per signed-in user (staffId in key).
 *            Two different staff members on the same browser will each have
 *            their own isolated preference object.
 *   Storage: localStorage — persists across page refreshes and browser
 *            restarts until the user explicitly clears browser data.
 *
 * Privacy guarantee
 * ─────────────────
 *   Only navigation-level fields are stored; NO clinical content is written:
 *     RecentPatient  → id, displayName, program, openedAt (epoch ms)
 *     PinnedPatient  → id, displayName, program, pinnedAt (epoch ms),
 *                      discharged? (boolean label only — no clinical detail)
 *     FavoriteModule → Screen ID string
 *
 *   Diagnoses, medications, notes, insurance, and all other PHI/ePHI are
 *   never written here.  The schema MUST NOT be extended with clinical data.
 *
 * Cross-component sync
 * ────────────────────
 *   This file exports two surfaces:
 *     1. useSidebarPrefs(staffId) — React hook for the Sidebar component.
 *        Holds the canonical useState; writes go through update() which
 *        calls localStorage.setItem and then dispatches a custom
 *        "sunrise:prefs" event so any other listener can re-read.
 *     2. addRecentPatient(staffId, patient) — standalone function called
 *        from App.tsx navigateTo() so the entry is recorded the moment
 *        the user deliberately opens a record, before the Sidebar re-renders.
 *        It also dispatches "sunrise:prefs" so the hook re-reads.
 */

import { useState, useCallback, useEffect } from "react";
import { Screen } from "../App";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Minimum navigation-only fields stored for a recent-patient entry. */
export interface RecentPatient {
  id: string;
  displayName: string; // "First Last"
  program: string;     // "Residential" | "PHP" | "IOP" | "OP"
  openedAt: number;    // epoch ms — used for recency ordering
}

/** Minimum navigation-only fields stored for a pinned-patient entry. */
export interface PinnedPatient {
  id: string;
  displayName: string;
  program: string;
  pinnedAt: number;        // epoch ms — stable ordering (insertion time)
  discharged?: boolean;    // display label only; does NOT auto-remove the pin
}

interface SidebarPrefs {
  recentPatients: RecentPatient[];
  pinnedPatients: PinnedPatient[];
  favoriteModules: Screen[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const KEY_PREFIX        = "sunrise_sidebar_prefs_v1_";
export const MAX_RECENT          = 5;
export const MAX_PINNED_VISIBLE  = 5;
export const MAX_FAVORITES       = 6;
const SYNC_EVENT        = "sunrise:prefs";

// ── Storage helpers ───────────────────────────────────────────────────────────

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
    // Notify other in-tab listeners (window.dispatchEvent, not storage event
    // which only fires for cross-tab changes).
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { staffId } }));
  } catch { /* storage full — ignore */ }
}

// ── Demo-user seed ────────────────────────────────────────────────────────────
// Pre-populate realistic data for demo accounts so screenshots and tours show
// a populated sidebar.  Only applied when no preferences have been saved yet
// (i.e. first visit).  Seeded patients use display-safe demo data only.

const DEMO_STAFF_PREFIX = "demo_";

function seedDemoPrefsIfNeeded(staffId: string): void {
  if (!staffId.startsWith(DEMO_STAFF_PREFIX)) return;
  const key = storageKey(staffId);
  if (localStorage.getItem(key)) return;            // already has prefs
  const now = Date.now();
  const seed: SidebarPrefs = {
    recentPatients: [
      { id: "p1",     displayName: "Marcus Webb",     program: "Residential", openedAt: now - 1_200_000  },
      { id: "p3",     displayName: "Devon Patel",     program: "Residential", openedAt: now - 3_600_000  },
      { id: "p2",     displayName: "Angela Reyes",    program: "PHP",         openedAt: now - 7_200_000  },
      { id: "p5",     displayName: "Jamal Foster",    program: "Residential", openedAt: now - 14_400_000 },
    ],
    pinnedPatients: [
      { id: "p1",  displayName: "Marcus Webb",     program: "Residential", pinnedAt: now - 86_400_000 },
      { id: "p3",  displayName: "Devon Patel",     program: "Residential", pinnedAt: now - 72_000_000 },
      // Discharged patient pinned — shows the "Discharged" label per spec.
      { id: "p6",  displayName: "Elena Vasquez",   program: "Residential", pinnedAt: now - 50_000_000, discharged: true },
    ],
    favoriteModules: [
      "ProgressNotes",
      "TreatmentPlans",
      "CensusBedBoard",
      "RevenueCycle",
    ] as Screen[],
  };
  writePrefs(staffId, seed);
}

// ── Standalone function (called from App.tsx navigateTo) ──────────────────────
/**
 * Record a deliberately-opened patient record in the signed-in user's recent
 * list.  Must be called ONLY from an explicit navigation action (e.g. clicking
 * a patient row or opening PatientDetail from search results), NOT from
 * incidental appearances in lists, alerts, or reports.
 *
 * Stores only: id, displayName, program, openedAt — no clinical content.
 */
export function addRecentPatient(staffId: string, patient: RecentPatient): void {
  const prefs   = loadPrefs(staffId);
  const without = prefs.recentPatients.filter(p => p.id !== patient.id);
  writePrefs(staffId, {
    ...prefs,
    recentPatients: [patient, ...without].slice(0, MAX_RECENT),
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useSidebarPrefs(staffId: string | null) {
  const [prefs, setPrefs] = useState<SidebarPrefs>(() => {
    if (!staffId) return { recentPatients: [], pinnedPatients: [], favoriteModules: [] };
    seedDemoPrefsIfNeeded(staffId);
    return loadPrefs(staffId);
  });

  // Re-read from localStorage when another in-tab writer (App.tsx) mutates it.
  useEffect(() => {
    if (!staffId) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ staffId: string }>).detail;
      if (detail.staffId === staffId) setPrefs(loadPrefs(staffId));
    };
    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, [staffId]);

  // ── Generic updater ──────────────────────────────────────────────────────
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

  // ── Recent patients ───────────────────────────────────────────────────────
  const addRecent = useCallback(
    (patient: RecentPatient) =>
      update(prev => {
        const without = prev.recentPatients.filter(p => p.id !== patient.id);
        return { ...prev, recentPatients: [patient, ...without].slice(0, MAX_RECENT) };
      }),
    [update]
  );

  const removeRecent = useCallback(
    (patientId: string) =>
      update(prev => ({
        ...prev,
        recentPatients: prev.recentPatients.filter(p => p.id !== patientId),
      })),
    [update]
  );

  const clearRecent = useCallback(
    () => update(prev => ({ ...prev, recentPatients: [] })),
    [update]
  );

  // ── Pinned patients ───────────────────────────────────────────────────────
  const pinPatient = useCallback(
    (patient: PinnedPatient) =>
      update(prev => {
        if (prev.pinnedPatients.some(p => p.id === patient.id)) return prev;
        return { ...prev, pinnedPatients: [...prev.pinnedPatients, patient] };
      }),
    [update]
  );

  const unpinPatient = useCallback(
    (patientId: string) =>
      update(prev => ({
        ...prev,
        pinnedPatients: prev.pinnedPatients.filter(p => p.id !== patientId),
      })),
    [update]
  );

  // ── Favorite modules ──────────────────────────────────────────────────────
  const addFavorite = useCallback(
    (moduleId: Screen) =>
      update(prev => {
        if (prev.favoriteModules.includes(moduleId)) return prev;
        return {
          ...prev,
          favoriteModules: [...prev.favoriteModules, moduleId].slice(0, MAX_FAVORITES),
        };
      }),
    [update]
  );

  const removeFavorite = useCallback(
    (moduleId: Screen) =>
      update(prev => ({
        ...prev,
        favoriteModules: prev.favoriteModules.filter(m => m !== moduleId),
      })),
    [update]
  );

  return {
    prefs,
    // Recent
    addRecent,
    removeRecent,
    clearRecent,
    // Pinned
    pinPatient,
    unpinPatient,
    // Favorites
    addFavorite,
    removeFavorite,
  };
}
