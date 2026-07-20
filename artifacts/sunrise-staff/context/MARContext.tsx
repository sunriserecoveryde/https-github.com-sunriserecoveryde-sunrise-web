import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  formatDateKey,
  checkDateRollover,
  isPersistSafe,
  pruneStaleStorageKeys,
  type StorageAdapter,
} from '../lib/coldStartLoadHelpers';

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
//
// Midnight-rollover safety: dateStr is React state, not a module-level constant.
// The AppState 'active' listener calls checkDateRollover() and updates dateStr
// whenever the calendar day changes while the app is open.  All key derivation
// and load/save effects depend on dateStr so they re-run automatically on
// rollover, giving nurses a clean slate for the new day.
// ─────────────────────────────────────────────────────────────────────────────

// ── Storage key prefixes ───────────────────────────────────────────────────────

const MAR_PREFIX    = '@sunrise_mar_';
const CHECKS_PREFIX = '@sunrise_checks_';

// Thin adapter so pruneStaleStorageKeys (a pure, testable helper) can accept
// the real AsyncStorage instance without importing it into the helper module.
const _asyncStorageAdapter: StorageAdapter = {
  getItem:     (k)    => AsyncStorage.getItem(k),
  setItem:     (k, v) => AsyncStorage.setItem(k, v),
  multiRemove: (keys) => AsyncStorage.multiRemove(keys),
  getAllKeys:   ()     => AsyncStorage.getAllKeys(),
};

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
  // dateStr drives all key derivation.  Initialized from the real clock; updated
  // by the AppState listener whenever the calendar day changes while the app is
  // open (midnight rollover).  Using state — not a module constant — means
  // post-midnight writes never silently target the previous day's bucket.
  const [dateStr, setDateStr] = useState(() => formatDateKey(new Date()));

  const marKey    = `${MAR_PREFIX}${dateStr}`;
  const checksKey = `${CHECKS_PREFIX}${dateStr}`;

  const [adminMap, setAdminMap] = useState<AdminMap>({});
  const [marLoaded, setMarLoaded] = useState(false);

  const [checks, setChecks] = useState<Record<string, CheckEntry>>({});
  const [checksLoaded, setChecksLoaded] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // loadedForKey refs: track which storage key the current in-memory state was
  // loaded from.  Set to null at the start of each load, then set to the key
  // once the async read succeeds.  The persist effects check isPersistSafe()
  // before writing, preventing a midnight-rollover race where React's effect
  // ordering could write old in-memory state to the new day's key.
  const marLoadedKeyRef    = useRef<string | null>(null);
  const checksLoadedKeyRef = useRef<string | null>(null);

  // ── Midnight rollover detection ───────────────────────────────────────────
  // When the app foregrounds after midnight, checkDateRollover detects the day
  // change and updates dateStr.  The key-dependent effects below then re-run
  // automatically, pruning yesterday's entries and loading from the new key.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const { rolled, newDateStr } = checkDateRollover(dateStr, new Date());
        if (rolled) setDateStr(newDateStr);
      }
    });
    return () => sub.remove();
  }, [dateStr]);

  // ── Prune stale keys whenever the active date changes ─────────────────────
  useEffect(() => {
    pruneStaleStorageKeys(_asyncStorageAdapter, [
      { prefix: MAR_PREFIX,    currentKey: marKey },
      { prefix: CHECKS_PREFIX, currentKey: checksKey },
    ]);
  }, [marKey, checksKey]);

  // ── Load MAR state whenever the active date changes ───────────────────────
  useEffect(() => {
    setMarLoaded(false);
    marLoadedKeyRef.current = null;           // invalidate the persist gate immediately
    loadFromStorage<AdminMap>(marKey, {}).then(saved => {
      if (!mountedRef.current) return;
      marLoadedKeyRef.current = marKey;       // now safe to persist for this key
      setAdminMap(saved);
      setMarLoaded(true);
    });
  }, [marKey]);

  // ── Persist adminMap whenever it changes ──────────────────────────────────
  // isPersistSafe() ensures we only write when the current in-memory state was
  // actually loaded from marKey — not when it is stale data from the previous
  // day that hasn't been replaced yet (the rollover window).
  useEffect(() => {
    if (isPersistSafe(marLoaded, marLoadedKeyRef.current, marKey)) {
      saveToStorage(marKey, adminMap);
    }
  }, [adminMap, marLoaded, marKey]);

  // ── Load Checks state whenever the active date changes ────────────────────
  useEffect(() => {
    setChecksLoaded(false);
    checksLoadedKeyRef.current = null;
    loadFromStorage<Record<string, CheckEntry>>(checksKey, {}).then(saved => {
      if (!mountedRef.current) return;
      checksLoadedKeyRef.current = checksKey;
      setChecks(saved);
      setChecksLoaded(true);
    });
  }, [checksKey]);

  // ── Persist checks whenever they change ───────────────────────────────────
  useEffect(() => {
    if (isPersistSafe(checksLoaded, checksLoadedKeyRef.current, checksKey)) {
      saveToStorage(checksKey, checks);
    }
  }, [checks, checksLoaded, checksKey]);

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
