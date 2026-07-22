/**
 * Cold-start load helpers for MAR, Checks, and Handoff screens.
 *
 * These functions contain the actual load-and-guard logic used by each screen.
 * They are extracted here so:
 *   1. The implementation can be imported and tested directly in Node (no React
 *      Native dependencies in this file).
 *   2. A future refactor that removes the `loaded: true` result field or the
 *      Promise.all boundary will cause the unit tests to fail at compile- or
 *      run-time rather than silently passing.
 *
 * All functions accept a `StorageAdapter` so they can be called in tests with a
 * mock (deferred, erroring, or pre-populated) and in production with the real
 * AsyncStorage instance.
 */

// ─── Storage adapter interface ────────────────────────────────────────────────

/** Minimal AsyncStorage-compatible interface — no React Native import needed. */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
  getAllKeys(): Promise<readonly string[] | string[]>;
}

// ─── Date-key helpers ─────────────────────────────────────────────────────────

/**
 * Format a Date as `YYYY-MM-DD` using its UTC components.
 *
 * AsyncStorage keys are scoped with this format, e.g. `@sunrise_mar_2026-07-20`.
 * Using a pure function (rather than capturing `new Date()` at module load) lets
 * callers — and unit tests — pass any date and verify the correct key is derived.
 *
 * Midnight-rollover safety: the key is computed from the date passed in, so a
 * caller that refreshes the date after midnight will automatically derive the new
 * calendar day's key.
 */
export function formatDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Return the full MAR storage key for a given date.
 * e.g. `@sunrise_mar_2026-07-20`
 */
export function makeMarKey(date: Date): string {
  return `@sunrise_mar_${formatDateKey(date)}`;
}

/**
 * Return the full Checks storage key for a given date.
 * e.g. `@sunrise_checks_2026-07-20`
 */
export function makeChecksKey(date: Date): string {
  return `@sunrise_checks_${formatDateKey(date)}`;
}

/**
 * Return the full handoff-notes storage key for a given date.
 * e.g. `@sunrise_handoff_notes_2026-07-20`
 */
export function makeHandoffNotesKey(date: Date): string {
  return `@sunrise_handoff_notes_${formatDateKey(date)}`;
}

/**
 * Return the full handoff-shift storage key for a given date.
 * e.g. `@sunrise_handoff_shift_2026-07-20`
 */
export function makeHandoffShiftKey(date: Date): string {
  return `@sunrise_handoff_shift_${formatDateKey(date)}`;
}

/**
 * Return the crash-safe draft-notes key for a given date.
 * e.g. `@sunrise_handoff_draft_notes_2026-07-20`
 *
 * This key stores notes typed during the AsyncStorage load window (when
 * isPersistSafe is false and the normal write-through is blocked).  It is
 * written immediately — before the load resolves — so the text survives a
 * force-quit.  The .then() callback in HandoffScreen reads this key, merges
 * its contents into the freshly-loaded notes, then deletes the key.
 */
export function makeHandoffDraftNotesKey(date: Date): string {
  return `@sunrise_handoff_draft_notes_${formatDateKey(date)}`;
}

/**
 * Return the handoff-completed flag storage key for a given date.
 * e.g. `@sunrise_handoff_completed_2026-07-20`
 *
 * Written as the string `'true'` by handleComplete() and read back via
 * AsyncStorage.getItem() in the cold-start Promise.all.  Date-scoped so the
 * banner never bleeds across calendar days (a new shift starts un-completed).
 */
export function makeHandoffCompletedKey(date: Date): string {
  return `@sunrise_handoff_completed_${formatDateKey(date)}`;
}

/**
 * Guard function for persist effects in MARContext.
 *
 * Returns `true` only when both conditions hold:
 *   1. The async load for the current key has completed (`loaded === true`).
 *   2. The in-memory state was loaded from the exact same key that is about to
 *      be written to (`loadedForKey === currentKey`).
 *
 * This prevents a midnight-rollover race where React's effect ordering would
 * otherwise let the persist effect fire with old in-memory state (marLoaded
 * is still true from the previous render) paired with the new day's key,
 * writing yesterday's data into today's storage bucket before the fresh load
 * for the new key has completed.
 *
 * Usage in MARContext:
 *   const marLoadedKeyRef = useRef<string | null>(null);
 *   // load effect: marLoadedKeyRef.current = null; ... then on success: marLoadedKeyRef.current = marKey;
 *   // persist effect: if (isPersistSafe(marLoaded, marLoadedKeyRef.current, marKey)) save();
 */
export function isPersistSafe(
  loaded: boolean,
  loadedForKey: string | null,
  currentKey: string,
): boolean {
  return loaded && loadedForKey === currentKey;
}

/**
 * Compare `prevDateStr` (a YYYY-MM-DD string held in component state) against
 * `nowDate` to determine whether the calendar day has changed.
 *
 * Used by MARContext's AppState 'active' listener to detect a midnight rollover
 * while the app is open.  Returns `{ rolled: true, newDateStr }` when the day
 * has advanced, or `{ rolled: false, newDateStr: prevDateStr }` otherwise.
 *
 * Pure function — no side effects, no React imports — so it can be exercised
 * directly in unit tests without a native environment.
 */
export function checkDateRollover(
  prevDateStr: string,
  nowDate: Date,
): { rolled: boolean; newDateStr: string } {
  const newDateStr = formatDateKey(nowDate);
  return { rolled: newDateStr !== prevDateStr, newDateStr };
}

// ─── Shared JSON helpers ──────────────────────────────────────────────────────

/**
 * Load a JSON value from storage.  Always returns `{ value, loaded: true }`.
 *
 * The `loaded: true` literal is part of the return type so that tests can
 * assert on it statically — removing it from the implementation changes the
 * type and causes a TS error in callers that destructure `loaded`.
 */
export async function loadJsonFromStorage<T>(
  storage: StorageAdapter,
  key: string,
  fallback: T,
): Promise<{ value: T; loaded: true }> {
  try {
    const raw = await storage.getItem(key);
    if (raw !== null) return { value: JSON.parse(raw) as T, loaded: true };
  } catch {
    // ignore parse errors — fall through to return the fallback
  }
  return { value: fallback, loaded: true };
}

/** Persist a JSON value to storage, ignoring errors. */
export async function saveJsonToStorage<T>(
  storage: StorageAdapter,
  key: string,
  value: T,
): Promise<void> {
  try {
    await storage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write errors
  }
}

/**
 * Remove any storage keys that match `prefix` but are not the `currentKey`.
 * Used to prune previous-day MAR/Checks entries on launch.
 */
export async function pruneStaleStorageKeys(
  storage: StorageAdapter,
  entries: Array<{ prefix: string; currentKey: string }>,
): Promise<void> {
  try {
    const allKeys = await storage.getAllKeys();
    const stale = (allKeys as string[]).filter(k =>
      entries.some(({ prefix, currentKey }) => k.startsWith(prefix) && k !== currentKey),
    );
    if (stale.length > 0) await storage.multiRemove(stale);
  } catch {
    // ignore
  }
}

// ─── MAR load ─────────────────────────────────────────────────────────────────

export type AdminMap = Record<string, Record<string, boolean>>;

/**
 * Mirrors the mount useEffect in MARView:
 *   loadFromStorage<AdminMap>(MAR_KEY, {}).then(saved => {
 *     setAdminMap(saved);
 *     setLoaded(true);
 *   });
 *
 * Returns `{ adminMap, loaded: true }` — both arrive together.
 * Content must remain invisible (opacity 0) until this promise resolves.
 */
export async function loadMARState(
  storage: StorageAdapter,
  key: string,
): Promise<{ adminMap: AdminMap; loaded: true }> {
  const { value } = await loadJsonFromStorage<AdminMap>(storage, key, {});
  return { adminMap: value, loaded: true };
}

// ─── Checks (BHT) load ────────────────────────────────────────────────────────

export interface CheckEntry {
  mood: number;
  cravings: number;
  oriented: boolean;
  uaCollected: boolean;
  completed: boolean;
}

/**
 * Mirrors the mount useEffect in ChecksView:
 *   loadFromStorage<Record<string,CheckEntry>>(CHECKS_KEY, defaultChecks).then(saved => {
 *     const merged = { ...defaultChecks, ...saved };
 *     setChecks(merged);
 *     setLoaded(true);
 *   });
 *
 * Returns `{ checks, loaded: true }` — both arrive together.
 * Content must remain invisible (opacity 0) until this promise resolves.
 */
export async function loadChecksState(
  storage: StorageAdapter,
  key: string,
  defaultChecks: Record<string, CheckEntry>,
): Promise<{ checks: Record<string, CheckEntry>; loaded: true }> {
  const { value: saved } = await loadJsonFromStorage<Record<string, CheckEntry>>(
    storage,
    key,
    defaultChecks,
  );
  // Merge: ensure any new patients get a default entry (mirrors the component)
  const checks = { ...defaultChecks, ...saved };
  return { checks, loaded: true };
}

// ─── Withdrawal filters load (Vitals / Scores tab) ───────────────────────────

export type WithdrawalScoreFilter = 'all' | 'cows' | 'ciwa' | 'alerts';

const VALID_WITHDRAWAL_FILTERS: WithdrawalScoreFilter[] = ['all', 'cows', 'ciwa', 'alerts'];

/**
 * Mirrors the mount Promise.all inside WithdrawalFiltersProvider:
 *   Promise.all([
 *     AsyncStorage.getItem(SCORE_FILTER_KEY),
 *     AsyncStorage.getItem(BANNER_DISMISSED_KEY),
 *     AsyncStorage.getItem(FILTER_NOTICE_DISMISSED_KEY),
 *     AsyncStorage.getItem(LAST_DISCHARGE_PATIENT_KEY),
 *   ]).then(([...]) => { ...; setState({ ..., isRehydrating: false }); })
 *
 * Key property: ALL four keys are read together via a single Promise.all before
 * `loaded: true` is returned.  The score filter chip bar uses Guard B (Animated
 * opacity starting at 0) to stay invisible until this settles.
 *
 * Errors are caught so `loaded: true` is always returned — the Scores tab must
 * not stay permanently invisible if storage fails.
 */
export interface WithdrawalFiltersLoaded {
  loaded: true;
  scoreFilter: WithdrawalScoreFilter;
  bannerDismissed: boolean;
  filterNoticeDismissedForPatientId: string | null;
  lastTrackedDischargePatientId: string | null;
}

export async function loadWithdrawalFiltersState(
  storage: StorageAdapter,
  keys: {
    scoreFilter: string;
    bannerDismissed: string;
    filterNoticeDismissed: string;
    lastDischargePatientId: string;
  },
): Promise<WithdrawalFiltersLoaded> {
  try {
    const [storedFilter, storedBanner, storedDismissed, storedLastDischarge] =
      await Promise.all([
        storage.getItem(keys.scoreFilter),
        storage.getItem(keys.bannerDismissed),
        storage.getItem(keys.filterNoticeDismissed),
        storage.getItem(keys.lastDischargePatientId),
      ]);

    const scoreFilter: WithdrawalScoreFilter =
      storedFilter && VALID_WITHDRAWAL_FILTERS.includes(storedFilter as WithdrawalScoreFilter)
        ? (storedFilter as WithdrawalScoreFilter)
        : 'all';

    return {
      loaded: true,
      scoreFilter,
      bannerDismissed: storedBanner === 'true',
      filterNoticeDismissedForPatientId: storedDismissed ?? null,
      lastTrackedDischargePatientId: storedLastDischarge ?? null,
    };
  } catch {
    // Even on storage failure, clear the guard so the screen doesn't stay hidden.
    return {
      loaded: true,
      scoreFilter: 'all',
      bannerDismissed: false,
      filterNoticeDismissedForPatientId: null,
      lastTrackedDischargePatientId: null,
    };
  }
}

// ─── Handoff load ─────────────────────────────────────────────────────────────

export type Shift = 'day' | 'eve' | 'night';

/**
 * Mirrors the mount useEffect in HandoffScreen:
 *   const [savedNotes, savedShift] = await Promise.all([
 *     AsyncStorage.getItem(STORAGE_KEY_NOTES),
 *     AsyncStorage.getItem(STORAGE_KEY_SHIFT),
 *   ]);
 *   if (savedNotes) setNotes(prev => ({ ...prev, ...JSON.parse(savedNotes) }));
 *   if (savedShift) setShift(savedShift as Shift);
 *   // finally: setLoaded(true)
 *
 * Key property: BOTH keys are read together via a single Promise.all before
 * `loaded: true` is returned.  The shift selector and handoff notes must both
 * stay invisible (opacity 0) until this promise settles.
 *
 * Errors are caught in the outer try/finally so `loaded: true` is always
 * returned — the screen must not stay permanently invisible if storage fails.
 */
export async function loadHandoffState(
  storage: StorageAdapter,
  keys: { notes: string; shift: string },
  defaults: { notes: Record<string, string>; shift: Shift },
): Promise<{ notes: Record<string, string>; shift: Shift; loaded: true }> {
  try {
    const [savedNotes, savedShift] = await Promise.all([
      storage.getItem(keys.notes),
      storage.getItem(keys.shift),
    ]);
    const notes = savedNotes
      ? { ...defaults.notes, ...(JSON.parse(savedNotes) as Record<string, string>) }
      : defaults.notes;
    const shift = (savedShift as Shift | null) ?? defaults.shift;
    return { notes, shift, loaded: true };
  } catch {
    // finally: always mark loaded so the screen becomes visible even on error
    return { notes: defaults.notes, shift: defaults.shift, loaded: true };
  }
}
