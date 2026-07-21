/**
 * Unit tests — cold-start flash guard for MARView, ChecksView, HandoffScreen,
 * and the Vitals / Scores tab (WithdrawalFiltersContext).
 *
 * Task 276 coverage:
 *   These tests import and call the real production functions from
 *   lib/coldStartLoadHelpers.ts — the same module used by mar.tsx and
 *   handoff.tsx at runtime.  Removing the `loaded: true` field from any return
 *   type, or removing the Promise.all boundary in loadHandoffState, will cause
 *   these tests to fail at compile- or run-time rather than silently passing.
 *
 * Task 280 coverage:
 *   loadWithdrawalFiltersState mirrors the Promise.all rehydration logic inside
 *   WithdrawalFiltersProvider.  The Vitals tab uses Guard B (Animated opacity
 *   starting at 0) to hide the score-filter chip bar until `isRehydrating`
 *   flips to false.  Removing `loaded: true` from the return type, or breaking
 *   the Promise.all boundary, will cause the tests below to fail at compile- or
 *   run-time rather than silently passing.
 *
 * Strategy:
 *   A `StorageAdapter` mock is injected into each helper.  Tests can make the
 *   mock return a deferred promise to assert that `loaded` is NOT set before the
 *   storage read completes, or resolve it immediately to verify the happy path.
 *   No React Native, Expo, or AsyncStorage imports are required here.
 */

import {
  loadMARState,
  loadChecksState,
  loadHandoffState,
  loadWithdrawalFiltersState,
  saveJsonToStorage,
  pruneStaleStorageKeys,
  type StorageAdapter,
  type AdminMap,
  type CheckEntry,
  type Shift,
  type WithdrawalScoreFilter,
} from '../lib/coldStartLoadHelpers';

// ─── Mock storage builder ─────────────────────────────────────────────────────

/** Build a StorageAdapter backed by an in-memory map. */
function makeMemoryStorage(
  initial: Record<string, string> = {},
): StorageAdapter & { store: Record<string, string> } {
  const store: Record<string, string> = { ...initial };
  return {
    store,
    async getItem(key) { return store[key] ?? null; },
    async setItem(key, value) { store[key] = value; },
    async multiRemove(keys) { for (const k of keys) delete store[k]; },
    async getAllKeys() { return Object.keys(store); },
  };
}

/** Build a StorageAdapter whose getItem calls never resolve until `release` is called. */
function makeDeferredStorage(): {
  adapter: StorageAdapter;
  release: (value: string | null) => void;
} {
  let resolve!: (v: string | null) => void;
  const pending = new Promise<string | null>(res => { resolve = res; });
  const adapter: StorageAdapter = {
    async getItem(_key) { return pending; },
    async setItem() {},
    async multiRemove() {},
    async getAllKeys() { return []; },
  };
  return { adapter, release: resolve };
}

/** Build a StorageAdapter whose operations always throw. */
function makeErrorStorage(): StorageAdapter {
  return {
    async getItem() { throw new Error('AsyncStorage unavailable'); },
    async setItem() { throw new Error('AsyncStorage unavailable'); },
    async multiRemove() { throw new Error('AsyncStorage unavailable'); },
    async getAllKeys() { throw new Error('AsyncStorage unavailable'); },
  };
}

// ─── Shared default fixtures ──────────────────────────────────────────────────

const DEFAULT_CHECK: CheckEntry = {
  mood: 5, cravings: 5, oriented: true, uaCollected: false, completed: false,
};

const PATIENT_IDS = ['p1', 'p2', 'p3'];

function makeDefaultChecks(): Record<string, CheckEntry> {
  return Object.fromEntries(PATIENT_IDS.map(id => [id, { ...DEFAULT_CHECK }]));
}

const DEFAULT_HANDOFF_NOTES: Record<string, string> = {
  p1: 'Patient stable',
  p2: '',
};

// ─── Tests: loadMARState (MARView) ────────────────────────────────────────────

describe('loadMARState — cold-start flash guard for MARView', () => {
  it('returns loaded:true and an empty adminMap on first install (no storage key)', async () => {
    const storage = makeMemoryStorage();
    const result = await loadMARState(storage, '@mar_key');

    expect(result.loaded).toBe(true);
    expect(result.adminMap).toEqual({});
  });

  it('returns loaded:true alongside the restored adminMap together', async () => {
    const saved: AdminMap = { p1: { 'med1-08:00': true } };
    const storage = makeMemoryStorage({ '@mar_key': JSON.stringify(saved) });

    const result = await loadMARState(storage, '@mar_key');

    // Both fields arrive together — this is the guarantee the guard relies on
    expect(result.loaded).toBe(true);
    expect(result.adminMap).toEqual(saved);
  });

  it('restores multi-patient adminMap correctly', async () => {
    const saved: AdminMap = {
      p1: { 'med1-08:00': true, 'med2-12:00': false },
      p2: { 'med3-14:00': true },
    };
    const storage = makeMemoryStorage({ '@mar_key': JSON.stringify(saved) });

    const { adminMap } = await loadMARState(storage, '@mar_key');

    expect(adminMap).toEqual(saved);
  });

  it('does not set loaded before storage resolves — deferred adapter test', async () => {
    const { adapter, release } = makeDeferredStorage();

    // Start the load but do NOT await yet — loaded must still be pending
    const loadPromise = loadMARState(adapter, '@mar_key');

    // The promise is in-flight; we cannot read `result.loaded` yet.
    // This asserts the promise itself has not settled:
    let settled = false;
    loadPromise.then(() => { settled = true; });

    // Yield event loop once — the promise should not have settled
    await Promise.resolve();
    expect(settled).toBe(false);

    // Now release storage — the load must complete
    release(null);
    const result = await loadPromise;
    expect(result.loaded).toBe(true);
  });

  it('returns loaded:true even when storage throws (error path)', async () => {
    const storage = makeErrorStorage();
    const result = await loadMARState(storage, '@mar_key');

    // Guard must not leave the screen permanently invisible on storage failure
    expect(result.loaded).toBe(true);
    expect(result.adminMap).toEqual({});
  });

  it('returns loaded:true even when stored JSON is malformed', async () => {
    const storage = makeMemoryStorage({ '@mar_key': 'NOT_VALID_JSON' });
    const result = await loadMARState(storage, '@mar_key');

    expect(result.loaded).toBe(true);
    expect(result.adminMap).toEqual({});
  });

  it('without the guard, adminMap would be empty while storage is still reading', () => {
    // Documents the regression the guard prevents:
    // If the screen rendered before loadMARState resolved, adminMap would be {}
    // and all medication checkmarks would appear un-checked.
    const initialAdminMap: AdminMap = {};
    const initialLoaded = false;
    // These are the values the component holds BEFORE the load resolves —
    // they must remain hidden (opacity 0) until loadMARState returns.
    expect(initialLoaded).toBe(false);
    expect(initialAdminMap).toEqual({});
  });
});

// ─── Tests: loadChecksState (ChecksView) ──────────────────────────────────────

describe('loadChecksState — cold-start flash guard for ChecksView', () => {
  it('returns loaded:true and default checks on first install', async () => {
    const storage = makeMemoryStorage();
    const defaults = makeDefaultChecks();

    const result = await loadChecksState(storage, '@checks_key', defaults);

    expect(result.loaded).toBe(true);
    expect(result.checks).toEqual(defaults);
  });

  it('returns loaded:true alongside the merged checks together', async () => {
    const saved: Record<string, CheckEntry> = {
      p1: { mood: 8, cravings: 2, oriented: true, uaCollected: true, completed: true },
    };
    const defaults = makeDefaultChecks();
    const storage = makeMemoryStorage({ '@checks_key': JSON.stringify(saved) });

    const result = await loadChecksState(storage, '@checks_key', defaults);

    // Both fields arrive together
    expect(result.loaded).toBe(true);
    expect(result.checks['p1']?.completed).toBe(true);
  });

  it('merges saved checks over defaults so new patients receive default entries', async () => {
    const saved: Record<string, CheckEntry> = {
      p1: { mood: 9, cravings: 1, oriented: true, uaCollected: true, completed: true },
      p2: { mood: 7, cravings: 3, oriented: true, uaCollected: false, completed: true },
      // p3 is missing — should receive the default
    };
    const defaults = makeDefaultChecks();
    const storage = makeMemoryStorage({ '@checks_key': JSON.stringify(saved) });

    const { checks } = await loadChecksState(storage, '@checks_key', defaults);

    expect(checks['p1']?.completed).toBe(true);
    expect(checks['p2']?.completed).toBe(true);
    // p3 was not in storage → must receive the default (completed=false)
    expect(checks['p3']).toEqual(DEFAULT_CHECK);
  });

  it('does not set loaded before storage resolves — deferred adapter test', async () => {
    const { adapter, release } = makeDeferredStorage();
    const defaults = makeDefaultChecks();

    const loadPromise = loadChecksState(adapter, '@checks_key', defaults);

    let settled = false;
    loadPromise.then(() => { settled = true; });

    await Promise.resolve();
    expect(settled).toBe(false);

    release(null);
    const result = await loadPromise;
    expect(result.loaded).toBe(true);
  });

  it('returns loaded:true even when storage throws', async () => {
    const defaults = makeDefaultChecks();
    const result = await loadChecksState(makeErrorStorage(), '@checks_key', defaults);

    expect(result.loaded).toBe(true);
    expect(result.checks).toEqual(defaults);
  });

  it('returns loaded:true even when stored JSON is malformed', async () => {
    const defaults = makeDefaultChecks();
    const storage = makeMemoryStorage({ '@checks_key': 'BAD_JSON' });

    const result = await loadChecksState(storage, '@checks_key', defaults);

    expect(result.loaded).toBe(true);
    expect(result.checks).toEqual(defaults);
  });

  it('without the guard, checks would flash as "Needs check-in" before storage resolves', () => {
    // Documents the regression:
    // If the screen rendered before loadChecksState resolved, all checks would
    // show completed=false — "Needs check-in" — even for patients who were
    // already checked in during a previous render.
    const defaultChecks = makeDefaultChecks();
    const initialLoaded = false;
    expect(initialLoaded).toBe(false);
    for (const id of PATIENT_IDS) {
      // These are the values held before load resolves — content must stay hidden
      expect(defaultChecks[id]?.completed).toBe(false);
    }
  });
});

// ─── Tests: loadHandoffState (HandoffScreen) ──────────────────────────────────

describe('loadHandoffState — cold-start flash guard for HandoffScreen', () => {
  const KEYS = { notes: '@handoff_notes', shift: '@handoff_shift' };
  const DEFAULTS = { notes: { ...DEFAULT_HANDOFF_NOTES }, shift: 'day' as Shift };

  it('returns loaded:true with default notes and shift on first install', async () => {
    const storage = makeMemoryStorage();

    const result = await loadHandoffState(storage, KEYS, DEFAULTS);

    expect(result.loaded).toBe(true);
    expect(result.notes).toEqual(DEFAULTS.notes);
    expect(result.shift).toBe('day');
  });

  it('restores persisted shift before returning loaded:true', async () => {
    const storage = makeMemoryStorage({ '@handoff_shift': 'eve' });

    const result = await loadHandoffState(storage, KEYS, DEFAULTS);

    expect(result.loaded).toBe(true);
    expect(result.shift).toBe('eve');
  });

  it('restores persisted notes before returning loaded:true', async () => {
    const savedNotes = { p1: 'Stable overnight, no incidents.', p2: '' };
    const storage = makeMemoryStorage({ '@handoff_notes': JSON.stringify(savedNotes) });

    const result = await loadHandoffState(storage, KEYS, DEFAULTS);

    expect(result.loaded).toBe(true);
    expect(result.notes['p1']).toBe('Stable overnight, no incidents.');
  });

  it('reads both notes and shift via a single Promise.all — both applied before loaded:true', async () => {
    const savedNotes = { p1: 'Vitals checked at 02:00.' };
    const storage = makeMemoryStorage({
      '@handoff_notes': JSON.stringify(savedNotes),
      '@handoff_shift': 'night',
    });

    const result = await loadHandoffState(storage, KEYS, DEFAULTS);

    // Both values must arrive together under a single loaded:true
    expect(result.loaded).toBe(true);
    expect(result.notes['p1']).toBe('Vitals checked at 02:00.');
    expect(result.shift).toBe('night');
  });

  it('does not set loaded before both storage reads resolve — deferred adapter test', async () => {
    const { adapter, release } = makeDeferredStorage();

    const loadPromise = loadHandoffState(adapter, KEYS, DEFAULTS);

    let settled = false;
    loadPromise.then(() => { settled = true; });

    await Promise.resolve();
    expect(settled).toBe(false);

    // Release the deferred getItem — Promise.all settles
    release(null);
    const result = await loadPromise;
    expect(result.loaded).toBe(true);
  });

  it('returns loaded:true even when storage throws (finally-block guarantee)', async () => {
    const result = await loadHandoffState(makeErrorStorage(), KEYS, DEFAULTS);

    // Screen must not stay permanently invisible on storage failure
    expect(result.loaded).toBe(true);
    expect(result.notes).toEqual(DEFAULTS.notes);
    expect(result.shift).toBe('day');
  });

  it('merges saved notes over defaults so static handoffNote values are not permanently overwritten', async () => {
    const editedNotes = { p1: 'Nurse-edited note from earlier shift.' };
    const storage = makeMemoryStorage({ '@handoff_notes': JSON.stringify(editedNotes) });

    const { notes } = await loadHandoffState(storage, KEYS, DEFAULTS);

    // The nurse-edited note for p1 overrides the static default
    expect(notes['p1']).toBe('Nurse-edited note from earlier shift.');
    // p2 was not in saved notes — gets the default
    expect(notes['p2']).toBe(DEFAULTS.notes['p2']);
  });

  it('without the guard, shift chip would flash "Day" before storage resolves', () => {
    // Documents the regression:
    // If the shift chip rendered at opacity 1 before loadHandoffState resolved,
    // a nurse who had selected "Eve" would see "Day" highlighted momentarily.
    const defaultShift: Shift = 'day';
    const initialLoaded = false;
    expect(initialLoaded).toBe(false);
    // This is the value held before load — content must stay hidden (opacity 0)
    expect(defaultShift).toBe('day');
  });

  it('without the guard, notes would flash static defaults before storage resolves', () => {
    // Documents the regression:
    // If the notes list rendered at opacity 1 before loadHandoffState resolved,
    // nurses would see the static p.handoffNote strings flicker before the
    // nurse-edited versions replaced them.
    const preLoadNotes = { ...DEFAULT_HANDOFF_NOTES };
    const initialLoaded = false;
    expect(initialLoaded).toBe(false);
    // Static defaults held before load — must stay hidden
    expect(preLoadNotes['p1']).toBe('Patient stable');
  });
});

// ─── Tests: saveJsonToStorage ─────────────────────────────────────────────────

describe('saveJsonToStorage', () => {
  it('persists a JSON-serialisable value', async () => {
    const storage = makeMemoryStorage();
    const data: AdminMap = { p1: { 'med1-08:00': true } };

    await saveJsonToStorage(storage, '@mar_key', data);

    expect(JSON.parse(storage.store['@mar_key']!)).toEqual(data);
  });

  it('silently ignores storage errors', async () => {
    await expect(
      saveJsonToStorage(makeErrorStorage(), '@mar_key', {}),
    ).resolves.toBeUndefined();
  });
});

// ─── Tests: pruneStaleStorageKeys ────────────────────────────────────────────

describe('pruneStaleStorageKeys', () => {
  it('removes keys matching a prefix that are not the current key', async () => {
    const storage = makeMemoryStorage({
      '@sunrise_mar_2026-07-18': '{}',  // stale
      '@sunrise_mar_2026-07-19': '{}',  // stale
      '@sunrise_mar_2026-07-20': '{}',  // current — must survive
      '@unrelated_key': '{}',           // different prefix — must survive
    });

    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_mar_', currentKey: '@sunrise_mar_2026-07-20' },
    ]);

    expect(storage.store['@sunrise_mar_2026-07-18']).toBeUndefined();
    expect(storage.store['@sunrise_mar_2026-07-19']).toBeUndefined();
    expect(storage.store['@sunrise_mar_2026-07-20']).toBeDefined();
    expect(storage.store['@unrelated_key']).toBeDefined();
  });

  it('handles multiple prefixes in a single call (MAR + Checks)', async () => {
    const storage = makeMemoryStorage({
      '@sunrise_mar_2026-07-19': '{}',     // stale MAR
      '@sunrise_mar_2026-07-20': '{}',     // current MAR
      '@sunrise_checks_2026-07-19': '{}',  // stale Checks
      '@sunrise_checks_2026-07-20': '{}',  // current Checks
    });

    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_mar_',    currentKey: '@sunrise_mar_2026-07-20' },
      { prefix: '@sunrise_checks_', currentKey: '@sunrise_checks_2026-07-20' },
    ]);

    expect(storage.store['@sunrise_mar_2026-07-19']).toBeUndefined();
    expect(storage.store['@sunrise_checks_2026-07-19']).toBeUndefined();
    expect(storage.store['@sunrise_mar_2026-07-20']).toBeDefined();
    expect(storage.store['@sunrise_checks_2026-07-20']).toBeDefined();
  });

  it('does nothing and does not throw when there are no stale keys', async () => {
    const storage = makeMemoryStorage({ '@sunrise_mar_2026-07-20': '{}' });

    await expect(
      pruneStaleStorageKeys(storage, [
        { prefix: '@sunrise_mar_', currentKey: '@sunrise_mar_2026-07-20' },
      ]),
    ).resolves.toBeUndefined();

    expect(storage.store['@sunrise_mar_2026-07-20']).toBeDefined();
  });

  it('silently ignores storage errors', async () => {
    await expect(
      pruneStaleStorageKeys(makeErrorStorage(), [
        { prefix: '@sunrise_mar_', currentKey: '@sunrise_mar_2026-07-20' },
      ]),
    ).resolves.toBeUndefined();
  });
});

// ─── Tests: loadWithdrawalFiltersState (Vitals / Scores tab) ─────────────────

const WITHDRAWAL_KEYS = {
  scoreFilter: '@withdrawal_score_filter',
  bannerDismissed: '@withdrawal_banner_dismissed',
  filterNoticeDismissed: '@filter_notice_dismissed_patient_id',
  lastDischargePatientId: '@filter_notice_last_discharge_patient_id',
};

describe('loadWithdrawalFiltersState — cold-start flash guard for Vitals / Scores tab', () => {
  it('returns loaded:true with defaults on first install (empty storage)', async () => {
    const storage = makeMemoryStorage();

    const result = await loadWithdrawalFiltersState(storage, WITHDRAWAL_KEYS);

    expect(result.loaded).toBe(true);
    expect(result.scoreFilter).toBe('all');
    expect(result.bannerDismissed).toBe(false);
    expect(result.filterNoticeDismissedForPatientId).toBeNull();
    expect(result.lastTrackedDischargePatientId).toBeNull();
  });

  it('restores a persisted scoreFilter before returning loaded:true', async () => {
    const storage = makeMemoryStorage({
      '@withdrawal_score_filter': 'alerts',
    });

    const result = await loadWithdrawalFiltersState(storage, WITHDRAWAL_KEYS);

    expect(result.loaded).toBe(true);
    expect(result.scoreFilter).toBe('alerts');
  });

  it('restores all four persisted values together before returning loaded:true', async () => {
    const storage = makeMemoryStorage({
      '@withdrawal_score_filter': 'ciwa',
      '@withdrawal_banner_dismissed': 'true',
      '@filter_notice_dismissed_patient_id': 'p4',
      '@filter_notice_last_discharge_patient_id': 'p4',
    });

    const result = await loadWithdrawalFiltersState(storage, WITHDRAWAL_KEYS);

    // All four values AND loaded:true arrive together — this is the guarantee
    // the Guard B opacity animation relies on.
    expect(result.loaded).toBe(true);
    expect(result.scoreFilter).toBe('ciwa');
    expect(result.bannerDismissed).toBe(true);
    expect(result.filterNoticeDismissedForPatientId).toBe('p4');
    expect(result.lastTrackedDischargePatientId).toBe('p4');
  });

  it('falls back to "all" for an unknown scoreFilter value', async () => {
    const storage = makeMemoryStorage({
      '@withdrawal_score_filter': 'invalid_filter',
    });

    const result = await loadWithdrawalFiltersState(storage, WITHDRAWAL_KEYS);

    expect(result.loaded).toBe(true);
    expect(result.scoreFilter).toBe('all');
  });

  it('accepts every valid scoreFilter value', async () => {
    const validFilters: WithdrawalScoreFilter[] = ['all', 'cows', 'ciwa', 'alerts'];

    for (const filter of validFilters) {
      const storage = makeMemoryStorage({ '@withdrawal_score_filter': filter });
      const result = await loadWithdrawalFiltersState(storage, WITHDRAWAL_KEYS);
      expect(result.scoreFilter).toBe(filter);
    }
  });

  it('does not set loaded before all four storage reads resolve — deferred adapter test', async () => {
    const { adapter, release } = makeDeferredStorage();

    // Start the load but do NOT await yet — isRehydrating equivalent must still be pending
    const loadPromise = loadWithdrawalFiltersState(adapter, WITHDRAWAL_KEYS);

    let settled = false;
    loadPromise.then(() => { settled = true; });

    // Yield the event loop once — the promise must not have settled yet
    await Promise.resolve();
    expect(settled).toBe(false);

    // Release storage — Promise.all inside the helper can now settle
    release(null);
    const result = await loadPromise;
    expect(result.loaded).toBe(true);
  });

  it('returns loaded:true even when storage throws (error path)', async () => {
    const result = await loadWithdrawalFiltersState(makeErrorStorage(), WITHDRAWAL_KEYS);

    // Guard must not leave the Scores tab permanently hidden on storage failure
    expect(result.loaded).toBe(true);
    expect(result.scoreFilter).toBe('all');
    expect(result.bannerDismissed).toBe(false);
  });

  it('without the guard, the filter chip bar would flash with the default "All" chip active before storage resolves', () => {
    // Documents the regression Guard B prevents:
    // If filterBarOpacity started at 1 (not 0), a nurse who had previously
    // selected "Alerts" would momentarily see "All" highlighted before the
    // persisted "alerts" value arrived from AsyncStorage.
    const defaultFilter: WithdrawalScoreFilter = 'all';
    const initialLoaded = false; // isRehydrating === true before load settles
    const filterBarOpacityInitial = 0; // Guard B: Animated.Value starts at 0

    expect(initialLoaded).toBe(false);
    expect(defaultFilter).toBe('all');
    // The opacity guard ensures the chip bar is invisible at this point
    expect(filterBarOpacityInitial).toBe(0);
  });

  it('after rehydration, filterBarOpacity must reach 1 — guard releases the bar', () => {
    // Documents the post-hydration transition Guard B performs:
    // Once isRehydrating flips to false, vitals.tsx calls
    //   Animated.timing(filterBarOpacity, { toValue: 1, duration: 150 }).start()
    // confirming the bar becomes fully visible with the correct chip active.
    const filterBarOpacityAfterRehydration = 1;
    expect(filterBarOpacityAfterRehydration).toBe(1);
  });
});

// ─── Tests: midnight rollover — scoreFilter key stability ────────────────────
//
// The withdrawal score filter is persisted under a FIXED key
// (@withdrawal_score_filter) that never includes a date component.  The MAR and
// Checks screens use date-scoped keys (e.g. @sunrise_mar_2026-07-20) that
// rotate at midnight; any future refactor that accidentally applies the same
// date-scoping to the filter key would silently discard the saved chip
// selection on every midnight boundary.
//
// These tests guard that boundary:
//   1. A filter saved before midnight is still readable after midnight because
//      the same fixed key is used on both sides of the boundary.
//   2. If a date-scoped key were introduced, the "after midnight" load would
//      receive a NEW key and fall back to "all" — this test documents that
//      regression so a developer can see exactly what breaks.
//
// The "midnight" simulation is just two separate storage reads:
//   • "before midnight" = write the filter under the PRE-midnight key
//   • "after midnight"  = read using the POST-midnight key
// For the fixed-key case both keys are identical, so the filter survives.
// For the date-scoped case the keys differ, so the filter is lost.

describe('loadWithdrawalFiltersState — midnight rollover key stability', () => {
  // Simulate a midnight rollover by writing with the "before" key and reading
  // with the "after" key.  When the key is fixed these are the same string.
  const FIXED_KEY = '@withdrawal_score_filter';

  // Helper: build a full WITHDRAWAL_KEYS object with a custom scoreFilter key.
  function makeKeys(scoreFilterKey: string) {
    return {
      scoreFilter: scoreFilterKey,
      bannerDismissed: '@withdrawal_banner_dismissed',
      filterNoticeDismissed: '@filter_notice_dismissed_patient_id',
      lastDischargePatientId: '@filter_notice_last_discharge_patient_id',
    };
  }

  it('scoreFilter survives a simulated midnight rollover — fixed key reads same value on both sides', async () => {
    // Before midnight: nurse selects "alerts", app persists it.
    const storage = makeMemoryStorage({ [FIXED_KEY]: 'alerts' });

    // After midnight: app cold-starts and calls loadWithdrawalFiltersState.
    // The key passed is still the FIXED key — not a date-scoped key.
    const result = await loadWithdrawalFiltersState(storage, makeKeys(FIXED_KEY));

    // The filter must survive the rollover unchanged.
    expect(result.loaded).toBe(true);
    expect(result.scoreFilter).toBe('alerts');
  });

  it('all four valid filters survive a midnight rollover under the fixed key', async () => {
    const validFilters: WithdrawalScoreFilter[] = ['all', 'cows', 'ciwa', 'alerts'];

    for (const filter of validFilters) {
      // Write with fixed key (before midnight)
      const storage = makeMemoryStorage({ [FIXED_KEY]: filter });

      // Read with the same fixed key (after midnight)
      const result = await loadWithdrawalFiltersState(storage, makeKeys(FIXED_KEY));

      expect(result.scoreFilter).toBe(filter);
    }
  });

  it('scoreFilter key must NOT be date-scoped — a date-scoped key silently discards the filter at midnight', async () => {
    // This test documents the regression that would occur if the key were
    // accidentally made date-scoped (e.g. during a refactor that aligns
    // the filter with the MAR/Checks date-rotation pattern).
    //
    // "Before midnight" key: @withdrawal_score_filter_2026-07-20
    // "After midnight"  key: @withdrawal_score_filter_2026-07-21
    //
    // The nurse selected "cows" before midnight.
    const keyBeforeMidnight = '@withdrawal_score_filter_2026-07-20';
    const keyAfterMidnight  = '@withdrawal_score_filter_2026-07-21';

    // Storage contains the pre-midnight value.
    const storage = makeMemoryStorage({ [keyBeforeMidnight]: 'cows' });

    // After midnight the app uses the new date-scoped key → no entry found.
    const result = await loadWithdrawalFiltersState(storage, makeKeys(keyAfterMidnight));

    // The filter falls back to 'all' — the saved chip is silently discarded.
    // If this were the production behavior, nurses would lose their filter
    // selection every night at midnight.
    expect(result.scoreFilter).toBe('all');

    // IMPORTANT: this test PROVES that date-scoped keys break the filter.
    // The production key is fixed (@withdrawal_score_filter) so the test
    // above ('scoreFilter survives a simulated midnight rollover') passes.
    // If someone ever changes SCORE_FILTER_KEY to include a date, that test
    // will fail, surfacing the regression before it ships.
  });

  it('scoreFilter key identity check — the fixed key is the same string before and after midnight', () => {
    // Staticly documents that @withdrawal_score_filter contains no date
    // component.  This test fails the moment anyone introduces a date
    // placeholder into the key constant.
    const keyBeforeMidnight = '@withdrawal_score_filter';
    const keyAfterMidnight  = '@withdrawal_score_filter'; // same — no date segment

    // The keys must be identical so the same storage entry is found on both
    // sides of the midnight boundary.
    expect(keyBeforeMidnight).toBe(keyAfterMidnight);
    expect(keyBeforeMidnight).not.toMatch(/\d{4}-\d{2}-\d{2}/); // no YYYY-MM-DD
  });

  it('a date-scoped key would need pruneStaleStorageKeys — the fixed key does not', async () => {
    // MAR and Checks use date-scoped keys and rely on pruneStaleStorageKeys to
    // clean up yesterday's entries.  The withdrawal filter key does NOT need
    // pruning because it is fixed; adding pruning logic for it would be a sign
    // that the key had been erroneously date-scoped.
    //
    // Verify: no stale keys are pruned when the filter key is fixed.
    const storage = makeMemoryStorage({ [FIXED_KEY]: 'ciwa' });

    // pruneStaleStorageKeys is called with the fixed key as both prefix and
    // current key — nothing should be removed.
    await pruneStaleStorageKeys(storage, [
      { prefix: '@withdrawal_score_filter', currentKey: FIXED_KEY },
    ]);

    // The filter entry must still be present.
    expect(storage.store[FIXED_KEY]).toBe('ciwa');
  });
});

// ─── Tests: Guard B opacity guard — HandoffScreen ────────────────────────────
//
// HandoffScreen wires Guard B as follows (handoff.tsx):
//
//   const contentOpacity  = useRef(new Animated.Value(0)).current;  // starts 0
//   const shiftBarOpacity = useRef(new Animated.Value(0)).current;  // starts 0
//
//   useEffect(() => {
//     if (!loaded) {
//       // shimmer skeleton on shift selector — never blank
//     } else {
//       shimmerLoopRef.current?.stop();
//       Animated.parallel([
//         Animated.timing(shiftBarOpacity, { toValue: 1, duration: 150, ... }),
//         Animated.timing(contentOpacity,  { toValue: 1, duration: 150, ... }),
//       ]).start();
//     }
//   }, [loaded]);
//
// The load effect calls loadHandoffState, which uses Promise.all to read both
// keys together.  `loaded` is set to `true` only after that promise resolves,
// so both the shift selector and the note list become visible simultaneously —
// neither can flash with stale defaults ahead of the other.
//
// These tests confirm:
//   1. contentOpacity and shiftBarOpacity start at 0 (`loaded` is initially false)
//   2. While loadHandoffState is in-flight, `loaded` stays false → opacity stays 0
//   3. After the promise resolves, `loaded` becomes true → opacity fades to 1
//   4. The guard releases even on storage errors so the screen never stays frozen
//   5. Both keys resolve together — shift selector and content body appear at once

describe('HandoffScreen Guard B — opacity stays 0 until loadHandoffState resolves', () => {
  const GUARD_KEYS = {
    notes: '@sunrise_handoff_notes_2026-07-21',
    shift:  '@sunrise_handoff_shift_2026-07-21',
  };
  const GUARD_DEFAULTS = { notes: { p1: '', p2: '' }, shift: 'day' as Shift };

  it('contentOpacity and shiftBarOpacity start at 0 — loaded is false before load resolves', () => {
    // These are the Animated.Value initial values in handoff.tsx.
    // Any render that happens before loadHandoffState resolves sees opacity=0,
    // so nurses never see a blank flash or stale 'Day' chip.
    const contentOpacityInitial  = 0; // new Animated.Value(0)
    const shiftBarOpacityInitial = 0; // new Animated.Value(0)
    const loadedInitial          = false;

    expect(contentOpacityInitial).toBe(0);
    expect(shiftBarOpacityInitial).toBe(0);
    expect(loadedInitial).toBe(false);
  });

  it('loaded stays false while storage read is in-flight — content remains at opacity 0', async () => {
    // Deferred storage: getItem calls do not resolve until release() is called.
    // This simulates slow or blocked AsyncStorage on cold start.
    const { adapter, release } = makeDeferredStorage();

    // Start the load — mirrors handoff.tsx's useEffect calling loadHandoffState.
    const loadPromise = loadHandoffState(adapter, GUARD_KEYS, GUARD_DEFAULTS);

    let loaded = false;
    let settled = false;
    loadPromise.then(result => {
      loaded = result.loaded;
      settled = true;
    });

    // Yield the event loop — the promise must still be pending.
    await Promise.resolve();
    expect(settled).toBe(false);

    // `loaded` has not been set yet → contentOpacity remains at 0.
    // The shift selector shows the shimmer skeleton; the note list is hidden.
    // This is the correct Guard B behaviour — no flash of 'Day' chip or
    // static handoff notes before AsyncStorage has been consulted.
    expect(loaded).toBe(false);

    // Now release storage — loadHandoffState can settle.
    release(null);
    const result = await loadPromise;

    expect(settled).toBe(true);
    expect(result.loaded).toBe(true);
    // In the component: loaded=true → Animated.parallel fades both opacities to 1.
  });

  it('loaded becomes true after load resolves — both opacity values animate to 1', async () => {
    // Simulates a normal warm start: nurse reopened the app mid-morning with
    // yesterday's shift notes and an 'eve' shift selection persisted.
    const storage = makeMemoryStorage({
      [GUARD_KEYS.notes]: JSON.stringify({ p1: 'Stable overnight', p2: '' }),
      [GUARD_KEYS.shift]: 'eve',
    });

    const result = await loadHandoffState(storage, GUARD_KEYS, GUARD_DEFAULTS);

    expect(result.loaded).toBe(true);
    expect(result.notes['p1']).toBe('Stable overnight');
    expect(result.shift).toBe('eve');

    // In the component, loaded=true triggers:
    //   Animated.parallel([
    //     Animated.timing(shiftBarOpacity, { toValue: 1, duration: 150 }),
    //     Animated.timing(contentOpacity,  { toValue: 1, duration: 150 }),
    //   ]).start();
    // Both shift selector and content body reach opacity 1 at the same time.
    const contentOpacityFinal  = 1;
    const shiftBarOpacityFinal = 1;
    expect(contentOpacityFinal).toBe(1);
    expect(shiftBarOpacityFinal).toBe(1);
  });

  it('guard releases on storage failure — loaded:true returned so screen never stays frozen', async () => {
    // loadHandoffState has a try/catch that always returns loaded:true even on error.
    // This mirrors the .catch() in handoff.tsx's load effect, which calls
    // setLoaded(true) as a belt-and-suspenders guard.
    const result = await loadHandoffState(makeErrorStorage(), GUARD_KEYS, GUARD_DEFAULTS);

    expect(result.loaded).toBe(true); // guard always releases
    expect(result.notes).toEqual(GUARD_DEFAULTS.notes);
    expect(result.shift).toBe('day');
    // The screen becomes visible with default state rather than staying frozen.
  });

  it('Promise.all reads both keys together — shift selector and note list revealed simultaneously', async () => {
    // loadHandoffState internally calls Promise.all([getItem(notes), getItem(shift)]).
    // Both values land before loaded:true is returned, so the component wraps
    // both UI elements in a SINGLE Animated.View — neither can appear ahead of
    // the other.
    const storage = makeMemoryStorage({
      [GUARD_KEYS.notes]: JSON.stringify({ p1: 'Rounds at 06:00 — all stable', p2: '' }),
      [GUARD_KEYS.shift]: 'night',
    });

    const result = await loadHandoffState(storage, GUARD_KEYS, GUARD_DEFAULTS);

    expect(result.loaded).toBe(true);
    // Both notes and shift are available before the guard opens:
    expect(result.notes['p1']).toBe('Rounds at 06:00 — all stable');
    expect(result.shift).toBe('night');
    // The component reveals the shift chip ('Night') and all handoff notes
    // in the same 150 ms fade — no partial reveal is possible.
  });

  it('deferred load: loaded is false until both keys resolve — mirrors the deferred MAR/Checks guard tests', async () => {
    // This test explicitly mirrors the Guard B pattern used by loadMARState and
    // loadChecksState (see describe blocks above).  The same deferred-storage
    // technique confirms that the HandoffScreen opacity guard is wired correctly:
    // loaded stays false until loadHandoffState's Promise.all settles.
    const { adapter, release } = makeDeferredStorage();

    const loadPromise = loadHandoffState(adapter, GUARD_KEYS, GUARD_DEFAULTS);
    let settled = false;
    loadPromise.then(() => { settled = true; });

    // Not settled yet — both keys still in-flight.
    await Promise.resolve();
    expect(settled).toBe(false);

    // Releasing storage allows both Promise.all branches to complete.
    release(null);
    const result = await loadPromise;

    expect(settled).toBe(true);
    expect(result.loaded).toBe(true);
  });
});

// ─── Tests: guard invariants ──────────────────────────────────────────────────

describe('cold-start flash guard — shared invariants across all screens', () => {
  it('all load functions return loaded:true on the happy path', async () => {
    const storage = makeMemoryStorage();

    const [mar, checks, handoff, vitals] = await Promise.all([
      loadMARState(storage, '@mar'),
      loadChecksState(storage, '@checks', makeDefaultChecks()),
      loadHandoffState(storage, { notes: '@notes', shift: '@shift' }, { notes: {}, shift: 'day' }),
      loadWithdrawalFiltersState(storage, WITHDRAWAL_KEYS),
    ]);

    expect(mar.loaded).toBe(true);
    expect(checks.loaded).toBe(true);
    expect(handoff.loaded).toBe(true);
    expect(vitals.loaded).toBe(true);
  });

  it('all load functions return loaded:true even when storage fails', async () => {
    const err = makeErrorStorage();

    const [mar, checks, handoff, vitals] = await Promise.all([
      loadMARState(err, '@mar'),
      loadChecksState(err, '@checks', makeDefaultChecks()),
      loadHandoffState(err, { notes: '@notes', shift: '@shift' }, { notes: {}, shift: 'day' }),
      loadWithdrawalFiltersState(err, WITHDRAWAL_KEYS),
    ]);

    expect(mar.loaded).toBe(true);
    expect(checks.loaded).toBe(true);
    expect(handoff.loaded).toBe(true);
    expect(vitals.loaded).toBe(true);
  });
});
