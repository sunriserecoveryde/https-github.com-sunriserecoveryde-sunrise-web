import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Persisted keys and their cold-start flash guards
// ─────────────────────────────────────────────────────────────────────────────
// Every AsyncStorage key managed by this context is registered here.  When you
// add a new key you MUST add a matching row and choose the guard style that
// prevents the UI from flashing incorrect content on cold start.
//
// Guard styles (see hooks/useRehydratedValue.ts for the canonical pattern):
//   A) useRehydratedValue(isRehydrating, value, loadingValue)
//      Best for booleans and enums where the loading placeholder is obvious.
//   B) Opacity animation — start at 0, fade to 1 once !isRehydrating.
//      Best for lists where a value change (checked → unchecked) is jarring.
//   C) Raw !isRehydrating guard in JSX — use when the condition involves a
//      runtime value (e.g. a patient ID) so the intent stays explicit.
//
// ┌────────────────────────────────────────┬──────────────────────────┬───────┐
// │ AsyncStorage key (date-scoped)         │ Context field            │ Guard │
// ├────────────────────────────────────────┼──────────────────────────┼───────┤
// │ @sunrise_mar_<YYYY-MM-DD>              │ adminMap                 │ B     │
// │ @sunrise_checks_<YYYY-MM-DD>           │ checks                   │ B     │
// └────────────────────────────────────────┴──────────────────────────┴───────┘
//
// Guard B: each sub-view creates a listOpacity Animated.Value that starts at 0
// and fades to 1 once its `loaded` flag turns true (matching the pattern used
// for the score filter bar in vitals.tsx).
// ─────────────────────────────────────────────────────────────────────────────

// ── Storage keys ──────────────────────────────────────────────────────────────

const TODAY_DATE = new Date().toISOString().slice(0, 10);

const MAR_KEY_PREFIX    = '@sunrise_mar_';
const CHECKS_KEY_PREFIX = '@sunrise_checks_';

const MAR_KEY    = `${MAR_KEY_PREFIX}${TODAY_DATE}`;
const CHECKS_KEY = `${CHECKS_KEY_PREFIX}${TODAY_DATE}`;

/** Remove AsyncStorage entries from previous days to avoid unbounded growth. */
async function pruneStaleKeys(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const stale = allKeys.filter(k => {
      if (k.startsWith(MAR_KEY_PREFIX))    return k !== MAR_KEY;
      if (k.startsWith(CHECKS_KEY_PREFIX)) return k !== CHECKS_KEY;
      return false;
    });
    if (stale.length > 0) await AsyncStorage.multiRemove(stale);
  } catch { /* ignore */ }
}

async function loadFromStorage<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw) as T;
  } catch { /* ignore parse errors */ }
  return fallback;
}

async function saveToStorage<T>(key: string, value: T): Promise<void> {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminMap = Record<string, Record<string, boolean>>;

export interface CheckEntry {
  mood: number;
  cravings: number;
  oriented: boolean;
  uaCollected: boolean;
  completed: boolean;
}

// ── Context definition ────────────────────────────────────────────────────────

interface MARContextValue {
  /** MAR administration map: patientId → (medId-time → boolean) */
  adminMap: AdminMap;
  /** True once adminMap has been loaded from storage — callers use this to drive Guard B. */
  marLoaded: boolean;
  /** Toggle a single medication administration slot. */
  toggleAdmin: (patientId: string, medId: string, time: string) => void;

  /** BHT check-in map: patientId → CheckEntry */
  checks: Record<string, CheckEntry>;
  /** True once checks has been loaded from storage — callers use this to drive Guard B. */
  checksLoaded: boolean;
  /** Overwrite the check entry for a single patient. */
  updateCheck: (patientId: string, check: CheckEntry) => void;
}

const MARContext = createContext<MARContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function MARProvider({ children }: { children: React.ReactNode }) {
  const [adminMap, setAdminMap] = useState<AdminMap>({});
  const [marLoaded, setMarLoaded] = useState(false);

  const [checks, setChecks] = useState<Record<string, CheckEntry>>({});
  const [checksLoaded, setChecksLoaded] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Prune stale date-scoped keys once on mount
  useEffect(() => { pruneStaleKeys(); }, []);

  // Load persisted MAR state on mount
  useEffect(() => {
    loadFromStorage<AdminMap>(MAR_KEY, {}).then(saved => {
      if (!mountedRef.current) return;
      setAdminMap(saved);
      setMarLoaded(true);
    });
  }, []);

  // Persist adminMap whenever it changes (skip initial unloaded state)
  useEffect(() => {
    if (marLoaded) saveToStorage(MAR_KEY, adminMap);
  }, [adminMap, marLoaded]);

  // Load persisted BHT check-in state on mount
  useEffect(() => {
    loadFromStorage<Record<string, CheckEntry>>(CHECKS_KEY, {}).then(saved => {
      if (!mountedRef.current) return;
      setChecks(saved);
      setChecksLoaded(true);
    });
  }, []);

  // Persist checks whenever they change (skip initial unloaded state)
  useEffect(() => {
    if (checksLoaded) saveToStorage(CHECKS_KEY, checks);
  }, [checks, checksLoaded]);

  const toggleAdmin = useCallback((patientId: string, medId: string, time: string) => {
    const key = `${medId}-${time}`;
    setAdminMap(prev => ({
      ...prev,
      [patientId]: { ...(prev[patientId] ?? {}), [key]: !(prev[patientId]?.[key]) },
    }));
  }, []);

  const updateCheck = useCallback((patientId: string, check: CheckEntry) => {
    setChecks(prev => ({ ...prev, [patientId]: check }));
  }, []);

  return (
    <MARContext.Provider value={{ adminMap, marLoaded, toggleAdmin, checks, checksLoaded, updateCheck }}>
      {children}
    </MARContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMAR(): MARContextValue {
  const ctx = useContext(MARContext);
  if (!ctx) throw new Error('useMAR must be used inside MARProvider');
  return ctx;
}
