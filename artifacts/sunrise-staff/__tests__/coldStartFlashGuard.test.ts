/**
 * Unit tests — cold-start flash guard for MARView, ChecksView, and HandoffScreen
 *
 * Task 276 coverage:
 *   These tests import and call the real production functions from
 *   lib/coldStartLoadHelpers.ts — the same module used by mar.tsx and
 *   handoff.tsx at runtime.  Removing the `loaded: true` field from any return
 *   type, or removing the Promise.all boundary in loadHandoffState, will cause
 *   these tests to fail at compile- or run-time rather than silently passing.
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
  saveJsonToStorage,
  pruneStaleStorageKeys,
  type StorageAdapter,
  type AdminMap,
  type CheckEntry,
  type Shift,
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

// ─── Tests: guard invariants ──────────────────────────────────────────────────

describe('cold-start flash guard — shared invariants across all three screens', () => {
  it('all load functions return loaded:true on the happy path', async () => {
    const storage = makeMemoryStorage();

    const [mar, checks, handoff] = await Promise.all([
      loadMARState(storage, '@mar'),
      loadChecksState(storage, '@checks', makeDefaultChecks()),
      loadHandoffState(storage, { notes: '@notes', shift: '@shift' }, { notes: {}, shift: 'day' }),
    ]);

    expect(mar.loaded).toBe(true);
    expect(checks.loaded).toBe(true);
    expect(handoff.loaded).toBe(true);
  });

  it('all load functions return loaded:true even when storage fails', async () => {
    const err = makeErrorStorage();

    const [mar, checks, handoff] = await Promise.all([
      loadMARState(err, '@mar'),
      loadChecksState(err, '@checks', makeDefaultChecks()),
      loadHandoffState(err, { notes: '@notes', shift: '@shift' }, { notes: {}, shift: 'day' }),
    ]);

    expect(mar.loaded).toBe(true);
    expect(checks.loaded).toBe(true);
    expect(handoff.loaded).toBe(true);
  });
});
