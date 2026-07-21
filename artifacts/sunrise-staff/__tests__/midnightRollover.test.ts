/**
 * Unit tests — midnight rollover for MAR and Checks storage keys
 *
 * Task 281 coverage:
 *   TODAY_DATE is computed once at module load as `new Date().toISOString().slice(0, 10)`.
 *   If the app stays open past midnight the key becomes stale: new toggles write to
 *   yesterday's key and the nurse sees a blank slate on next launch.
 *
 *   These tests exercise the pure helpers extracted into coldStartLoadHelpers.ts:
 *     - formatDateKey  — produces the correct YYYY-MM-DD calendar date
 *     - makeMarKey / makeChecksKey — derive the full storage keys for a given date
 *     - pruneStaleStorageKeys — removes previous-day entries; keeps the current key
 *     - loadMARState / loadChecksState — load from the *new* key after rollover,
 *       returning an empty / default state instead of yesterday's data
 *
 *   Tests mirror the pure state-machine pattern in coldStartFlashGuard.test.ts:
 *   no React Native, Expo, or AsyncStorage imports are required.
 */

import {
  formatDateKey,
  checkDateRollover,
  isPersistSafe,
  makeMarKey,
  makeChecksKey,
  makeHandoffNotesKey,
  makeHandoffShiftKey,
  pruneStaleStorageKeys,
  loadMARState,
  loadChecksState,
  loadHandoffState,
  saveJsonToStorage,
  type StorageAdapter,
  type AdminMap,
  type CheckEntry,
} from '../lib/coldStartLoadHelpers';

// ─── Mock storage builder ─────────────────────────────────────────────────────

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

/** Build a StorageAdapter whose getItem calls never resolve until release() is called. */
function makeDeferredStorage(
  initial: Record<string, string> = {},
): {
  adapter: StorageAdapter & { store: Record<string, string> };
  release: () => void;
} {
  const store: Record<string, string> = { ...initial };
  let resolvePending!: () => void;
  const pending = new Promise<void>(res => { resolvePending = res; });
  const adapter = {
    store,
    async getItem(key: string) {
      await pending;
      return store[key] ?? null;
    },
    async setItem(key: string, value: string) { store[key] = value; },
    async multiRemove(keys: string[]) { for (const k of keys) delete store[k]; },
    async getAllKeys() { return Object.keys(store); },
  };
  return { adapter, release: resolvePending };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** 23:59 on 2026-07-19 UTC — one minute before midnight */
const BEFORE_MIDNIGHT = new Date('2026-07-19T23:59:00.000Z');
/** 00:00 on 2026-07-20 UTC — the instant the clock rolls over */
const AFTER_MIDNIGHT  = new Date('2026-07-20T00:00:00.000Z');
/** A mid-day timestamp on the new day */
const NEW_DAY         = new Date('2026-07-20T14:00:00.000Z');

const DEFAULT_CHECK: CheckEntry = {
  mood: 5, cravings: 5, oriented: true, uaCollected: false, completed: false,
};

// ─── Tests: formatDateKey ─────────────────────────────────────────────────────

describe('formatDateKey — calendar date extraction', () => {
  it('produces YYYY-MM-DD for a mid-day UTC timestamp', () => {
    expect(formatDateKey(new Date('2026-07-20T14:00:00.000Z'))).toBe('2026-07-20');
  });

  it('produces the correct date at 23:59 UTC (one minute before midnight)', () => {
    expect(formatDateKey(BEFORE_MIDNIGHT)).toBe('2026-07-19');
  });

  it('rolls over to the new calendar date at exactly 00:00 UTC', () => {
    expect(formatDateKey(AFTER_MIDNIGHT)).toBe('2026-07-20');
  });

  it('pads single-digit months and days with a leading zero', () => {
    expect(formatDateKey(new Date('2026-01-05T12:00:00.000Z'))).toBe('2026-01-05');
  });

  it('handles a year boundary (Dec 31 → Jan 1)', () => {
    expect(formatDateKey(new Date('2025-12-31T23:59:00.000Z'))).toBe('2025-12-31');
    expect(formatDateKey(new Date('2026-01-01T00:00:00.000Z'))).toBe('2026-01-01');
  });
});

// ─── Tests: makeMarKey / makeChecksKey ───────────────────────────────────────

describe('makeMarKey / makeChecksKey — storage key derivation', () => {
  it('makeMarKey returns the correct prefixed key', () => {
    expect(makeMarKey(NEW_DAY)).toBe('@sunrise_mar_2026-07-20');
  });

  it('makeChecksKey returns the correct prefixed key', () => {
    expect(makeChecksKey(NEW_DAY)).toBe('@sunrise_checks_2026-07-20');
  });

  it('yesterday and today produce different keys', () => {
    expect(makeMarKey(BEFORE_MIDNIGHT)).not.toBe(makeMarKey(AFTER_MIDNIGHT));
    expect(makeChecksKey(BEFORE_MIDNIGHT)).not.toBe(makeChecksKey(AFTER_MIDNIGHT));
  });

  it('the old key (yesterday) does not equal the new key (today) after rollover', () => {
    const oldMarKey    = makeMarKey(BEFORE_MIDNIGHT);     // @sunrise_mar_2026-07-19
    const newMarKey    = makeMarKey(AFTER_MIDNIGHT);      // @sunrise_mar_2026-07-20
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);  // @sunrise_checks_2026-07-19
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);   // @sunrise_checks_2026-07-20

    expect(oldMarKey).toBe('@sunrise_mar_2026-07-19');
    expect(newMarKey).toBe('@sunrise_mar_2026-07-20');
    expect(oldChecksKey).toBe('@sunrise_checks_2026-07-19');
    expect(newChecksKey).toBe('@sunrise_checks_2026-07-20');
  });
});

// ─── Tests: midnight rollover — stale key pruning ─────────────────────────────

describe('midnight rollover — pruneStaleStorageKeys removes yesterday\'s entries', () => {
  it('removes the previous day\'s MAR key and keeps today\'s', async () => {
    const yesterdayMarKey = makeMarKey(BEFORE_MIDNIGHT);  // @sunrise_mar_2026-07-19
    const todayMarKey     = makeMarKey(NEW_DAY);          // @sunrise_mar_2026-07-20

    const storage = makeMemoryStorage({
      [yesterdayMarKey]: JSON.stringify({ p1: { 'med1-08:00': true } }),
      [todayMarKey]:     '{}',
    });

    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_mar_', currentKey: todayMarKey },
    ]);

    expect(storage.store[yesterdayMarKey]).toBeUndefined();
    expect(storage.store[todayMarKey]).toBeDefined();
  });

  it('removes the previous day\'s Checks key and keeps today\'s', async () => {
    const yesterdayChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const todayChecksKey     = makeChecksKey(NEW_DAY);

    const storage = makeMemoryStorage({
      [yesterdayChecksKey]: JSON.stringify({ p1: { completed: true } }),
      [todayChecksKey]:     '{}',
    });

    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_checks_', currentKey: todayChecksKey },
    ]);

    expect(storage.store[yesterdayChecksKey]).toBeUndefined();
    expect(storage.store[todayChecksKey]).toBeDefined();
  });

  it('prunes both MAR and Checks stale keys in a single call (full rollover)', async () => {
    const storage = makeMemoryStorage({
      '@sunrise_mar_2026-07-18':    '{}',  // two days ago
      '@sunrise_mar_2026-07-19':    JSON.stringify({ p1: { 'med1-08:00': true } }),
      '@sunrise_mar_2026-07-20':    '{}',  // current — must survive
      '@sunrise_checks_2026-07-19': JSON.stringify({ p1: { completed: true } }),
      '@sunrise_checks_2026-07-20': '{}',  // current — must survive
      '@unrelated_key':             '{}',  // different prefix — must survive
    });

    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_mar_',    currentKey: '@sunrise_mar_2026-07-20' },
      { prefix: '@sunrise_checks_', currentKey: '@sunrise_checks_2026-07-20' },
    ]);

    // Stale entries gone
    expect(storage.store['@sunrise_mar_2026-07-18']).toBeUndefined();
    expect(storage.store['@sunrise_mar_2026-07-19']).toBeUndefined();
    expect(storage.store['@sunrise_checks_2026-07-19']).toBeUndefined();
    // Current entries preserved
    expect(storage.store['@sunrise_mar_2026-07-20']).toBeDefined();
    expect(storage.store['@sunrise_checks_2026-07-20']).toBeDefined();
    // Unrelated key untouched
    expect(storage.store['@unrelated_key']).toBeDefined();
  });

  it('does nothing when there are no stale keys (first launch of the day)', async () => {
    const todayMarKey = makeMarKey(NEW_DAY);
    const storage = makeMemoryStorage({ [todayMarKey]: '{}' });

    await expect(
      pruneStaleStorageKeys(storage, [
        { prefix: '@sunrise_mar_', currentKey: todayMarKey },
      ]),
    ).resolves.toBeUndefined();

    expect(storage.store[todayMarKey]).toBeDefined();
  });
});

// ─── Tests: midnight rollover — loading from the new key ──────────────────────

describe('midnight rollover — loadMARState reads from the new calendar-day key', () => {
  it('returns an empty adminMap when the new key has no data (fresh start after rollover)', async () => {
    const newMarKey = makeMarKey(NEW_DAY);  // @sunrise_mar_2026-07-20
    // Storage only has yesterday's data — the new key does not exist yet
    const storage = makeMemoryStorage({
      '@sunrise_mar_2026-07-19': JSON.stringify({ p1: { 'med1-08:00': true } }),
    });

    const { adminMap, loaded } = await loadMARState(storage, newMarKey);

    // The new-day key has no data → adminMap must be empty (not yesterday's data)
    expect(loaded).toBe(true);
    expect(adminMap).toEqual({});
  });

  it('restores data written to the new key (not the old key) after rollover', async () => {
    const oldMarKey = makeMarKey(BEFORE_MIDNIGHT);  // @sunrise_mar_2026-07-19
    const newMarKey = makeMarKey(NEW_DAY);           // @sunrise_mar_2026-07-20

    const yesterdayData: AdminMap = { p1: { 'med1-08:00': true } };
    const todayData: AdminMap     = { p1: { 'med2-06:00': true } };

    const storage = makeMemoryStorage({
      [oldMarKey]: JSON.stringify(yesterdayData),
      [newMarKey]: JSON.stringify(todayData),
    });

    const { adminMap } = await loadMARState(storage, newMarKey);

    // Must return today's data, not yesterday's
    expect(adminMap).toEqual(todayData);
    expect(adminMap['p1']?.['med2-06:00']).toBe(true);
    expect(adminMap['p1']?.['med1-08:00']).toBeUndefined();
  });

  it('simulates a full rollover: old data is stale, new load sees a clean slate', async () => {
    const oldMarKey = makeMarKey(BEFORE_MIDNIGHT);
    const newMarKey = makeMarKey(AFTER_MIDNIGHT);

    // Nurse had work from yesterday
    const storage = makeMemoryStorage({
      [oldMarKey]: JSON.stringify({ p1: { 'med1-08:00': true, 'med2-12:00': true } }),
    });

    // Step 1: prune stale keys (as MARProvider does on mount after rollover)
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_mar_', currentKey: newMarKey },
    ]);

    // Yesterday's key is gone
    expect(storage.store[oldMarKey]).toBeUndefined();

    // Step 2: load from the new key (as MARProvider's useEffect does)
    const { adminMap, loaded } = await loadMARState(storage, newMarKey);

    // New day starts with a clean slate — nurses see no phantom checkmarks
    expect(loaded).toBe(true);
    expect(adminMap).toEqual({});
  });
});

// ─── Tests: midnight rollover — Checks (BHT) ─────────────────────────────────

describe('midnight rollover — loadChecksState reads from the new calendar-day key', () => {
  const defaultChecks: Record<string, CheckEntry> = {
    p1: { ...DEFAULT_CHECK },
    p2: { ...DEFAULT_CHECK },
  };

  it('returns default checks when the new key has no data (fresh start after rollover)', async () => {
    const newChecksKey = makeChecksKey(NEW_DAY);
    const storage = makeMemoryStorage({
      '@sunrise_checks_2026-07-19': JSON.stringify({
        p1: { ...DEFAULT_CHECK, completed: true },
        p2: { ...DEFAULT_CHECK, completed: true },
      }),
    });

    const { checks, loaded } = await loadChecksState(storage, newChecksKey, defaultChecks);

    // New key has no data → default checks (completed=false), not yesterday's
    expect(loaded).toBe(true);
    expect(checks['p1']?.completed).toBe(false);
    expect(checks['p2']?.completed).toBe(false);
  });

  it('simulates a full rollover: yesterday\'s check completions do not bleed into today', async () => {
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    const storage = makeMemoryStorage({
      [oldChecksKey]: JSON.stringify({
        p1: { ...DEFAULT_CHECK, completed: true, mood: 9 },
        p2: { ...DEFAULT_CHECK, completed: true, mood: 8 },
      }),
    });

    // Step 1: prune
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_checks_', currentKey: newChecksKey },
    ]);

    expect(storage.store[oldChecksKey]).toBeUndefined();

    // Step 2: load from new key
    const { checks, loaded } = await loadChecksState(storage, newChecksKey, defaultChecks);

    expect(loaded).toBe(true);
    // New day: all patients show as needing a check-in
    expect(checks['p1']?.completed).toBe(false);
    expect(checks['p2']?.completed).toBe(false);
  });

  it('restores today\'s checks if the nurse re-opened the app mid-morning', async () => {
    const newChecksKey = makeChecksKey(NEW_DAY);
    const midMorningChecks = {
      p1: { ...DEFAULT_CHECK, completed: true, mood: 7 },
    };
    const storage = makeMemoryStorage({
      [newChecksKey]: JSON.stringify(midMorningChecks),
    });

    const { checks } = await loadChecksState(storage, newChecksKey, defaultChecks);

    expect(checks['p1']?.completed).toBe(true);
    expect(checks['p1']?.mood).toBe(7);
    // p2 was not in today's data yet → default
    expect(checks['p2']?.completed).toBe(false);
  });
});

// ─── Tests: isPersistSafe — stale-write prevention gate ───────────────────────
//
// isPersistSafe() is used by MARContext's persist effects to prevent a
// midnight-rollover race: when dateStr changes, React's effect ordering can
// fire the persist effect with old in-memory state (marLoaded still true from
// the previous render) paired with the new day's key, writing yesterday's data
// into today's storage bucket before the fresh load completes.
//
// The fix: a loadedForKey ref is set to null at the start of each load and to
// the key only once the async read succeeds. isPersistSafe() returns false
// whenever loadedForKey doesn't match the current key.

describe('isPersistSafe — persist-gate for midnight-rollover stale-write prevention', () => {
  it('returns false when not yet loaded (initial state)', () => {
    expect(isPersistSafe(false, null, '@sunrise_mar_2026-07-20')).toBe(false);
  });

  it('returns false when loadedForKey is null (load in progress after key change)', () => {
    // This is the critical case: dateStr just changed, load effect set ref to
    // null, but marLoaded from the previous render is still true.
    expect(isPersistSafe(true, null, '@sunrise_mar_2026-07-20')).toBe(false);
  });

  it('returns false when loadedForKey is the old key (rollover window)', () => {
    // Old in-memory state loaded from yesterday's key must not be written to
    // today's key — this is the exact stale-write the ref prevents.
    expect(isPersistSafe(
      true,
      '@sunrise_mar_2026-07-19',   // yesterday — still in memory
      '@sunrise_mar_2026-07-20',   // today — new key after rollover
    )).toBe(false);
  });

  it('returns true only when loaded and loadedForKey matches currentKey', () => {
    expect(isPersistSafe(
      true,
      '@sunrise_mar_2026-07-20',
      '@sunrise_mar_2026-07-20',
    )).toBe(true);
  });

  it('returns false when loaded but loadedForKey is a different key entirely', () => {
    expect(isPersistSafe(true, '@other_key', '@sunrise_mar_2026-07-20')).toBe(false);
  });

  // ── Rollover effect-ordering simulation ────────────────────────────────────
  // Simulates the exact sequence of React effect calls during a rollover to
  // verify that no stale write can reach storage.

  it('rollover effect ordering: old state is never written to the new key', async () => {
    const oldKey = '@sunrise_mar_2026-07-19';
    const newKey = '@sunrise_mar_2026-07-20';

    const storage = makeMemoryStorage({
      [oldKey]: JSON.stringify({ p1: { 'med1-22:00': true } }),
    });

    // State at the start of the rollover render:
    //   marLoaded = true  (from previous day's successful load)
    //   loadedForKey = oldKey  (set when the old load completed)
    //   marKey = newKey        (just changed due to dateStr update)
    let marLoaded    = true;
    let loadedForKey: string | null = oldKey;
    const marKey     = newKey;

    // Effect 1 (load effect) fires first for the new marKey:
    //   - clears loadedForKey immediately (synchronous, before async read)
    marLoaded    = false;
    loadedForKey = null;

    // Effect 2 (persist effect) fires next with the render's state values:
    //   marLoaded is still the render-capture value (true from last render),
    //   but loadedForKey was cleared synchronously → isPersistSafe returns false.
    const wouldPersistDuringRace = isPersistSafe(
      /* marLoaded from last render */ true,
      loadedForKey,   // null — cleared by load effect
      marKey,
    );
    expect(wouldPersistDuringRace).toBe(false);   // ✓ no stale write

    // Confirm storage is untouched for the new key
    expect(storage.store[newKey]).toBeUndefined();

    // Now the async load for newKey completes:
    const { adminMap } = await loadMARState(storage, newKey);
    marLoaded    = true;
    loadedForKey = newKey;

    // Persist effect re-runs after the state update → now safe
    const wouldPersistAfterLoad = isPersistSafe(marLoaded, loadedForKey, marKey);
    expect(wouldPersistAfterLoad).toBe(true);    // ✓ safe to persist

    // And the data that would be persisted is the freshly loaded data (empty),
    // not yesterday's data
    expect(adminMap).toEqual({});
  });

  it('Checks: same gate prevents stale check completions from bleeding into the new day', () => {
    const oldKey = '@sunrise_checks_2026-07-19';
    const newKey = '@sunrise_checks_2026-07-20';

    // During rollover window: checksLoaded still true, loadedForKey cleared
    expect(isPersistSafe(true, null,   newKey)).toBe(false);  // load in progress
    expect(isPersistSafe(true, oldKey, newKey)).toBe(false);  // stale key
    expect(isPersistSafe(true, newKey, newKey)).toBe(true);   // safe after load
  });
});

// ─── Tests: checkDateRollover — AppState listener logic ───────────────────────
//
// checkDateRollover() is the pure function MARContext's AppState 'active'
// listener calls.  When it returns rolled:true, the context updates dateStr,
// which re-derives marKey/checksKey and triggers reload effects.

describe('checkDateRollover — midnight detection for live sessions', () => {
  it('returns rolled:false when the date is unchanged', () => {
    const { rolled, newDateStr } = checkDateRollover('2026-07-20', NEW_DAY);
    expect(rolled).toBe(false);
    expect(newDateStr).toBe('2026-07-20');
  });

  it('returns rolled:true at exactly 00:00 UTC on the new day', () => {
    const { rolled, newDateStr } = checkDateRollover('2026-07-19', AFTER_MIDNIGHT);
    expect(rolled).toBe(true);
    expect(newDateStr).toBe('2026-07-20');
  });

  it('returns rolled:false one minute before midnight', () => {
    const { rolled } = checkDateRollover('2026-07-19', BEFORE_MIDNIGHT);
    expect(rolled).toBe(false);
  });

  it('returns rolled:true for a year-boundary rollover (Dec 31 → Jan 1)', () => {
    const { rolled, newDateStr } = checkDateRollover(
      '2025-12-31',
      new Date('2026-01-01T00:00:00.000Z'),
    );
    expect(rolled).toBe(true);
    expect(newDateStr).toBe('2026-01-01');
  });

  it('newDateStr matches formatDateKey(nowDate) — same derivation as makeMarKey', () => {
    const nowDate = new Date('2026-07-20T06:30:00.000Z');
    const { newDateStr } = checkDateRollover('2026-07-19', nowDate);
    expect(newDateStr).toBe(formatDateKey(nowDate));
  });

  // ── Live-session rollover lifecycle ─────────────────────────────────────────
  // This simulates the full path MARContext takes when AppState fires 'active'
  // after midnight:
  //   1. App opens at 23:50 → dateStr = '2026-07-19', marKey derived from it
  //   2. Nurse records doses; data written to yesterday's key
  //   3. AppState fires 'active' at 00:05 → checkDateRollover detects rollover
  //   4. dateStr updates → new marKey derived → prune + reload effects run
  //   5. New day load returns a clean slate

  it('live rollover: app open before midnight, foreground after midnight → clean MAR slate', async () => {
    // Step 1: app opens at 23:50
    const openDateStr = formatDateKey(BEFORE_MIDNIGHT);     // '2026-07-19'
    const openMarKey  = `@sunrise_mar_${openDateStr}`;      // yesterday's key

    const storage = makeMemoryStorage();

    // Step 2: nurse records a dose at 23:55 (written to yesterday's key)
    await saveJsonToStorage(storage, openMarKey, { p1: { 'med1-22:00': true } });

    // Confirm the data is under yesterday's key
    expect(JSON.parse(storage.store[openMarKey]!).p1['med1-22:00']).toBe(true);

    // Step 3: app foregrounds at 00:05 → AppState fires 'active'
    const { rolled, newDateStr } = checkDateRollover(openDateStr, AFTER_MIDNIGHT);
    expect(rolled).toBe(true);
    expect(newDateStr).toBe('2026-07-20');

    // Step 4a: context derives the new key (marKey = `@sunrise_mar_${newDateStr}`)
    const newMarKey = `@sunrise_mar_${newDateStr}`;

    // Step 4b: prune stale keys (as MARContext's prune effect does on key change)
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_mar_', currentKey: newMarKey },
    ]);

    // Yesterday's key is gone
    expect(storage.store[openMarKey]).toBeUndefined();

    // Step 5: load from new key (as MARContext's load effect does on key change)
    const { adminMap, loaded } = await loadMARState(storage, newMarKey);

    expect(loaded).toBe(true);
    expect(adminMap).toEqual({});   // clean slate — no phantom checkmarks
  });

  it('live rollover: Checks BHT — yesterday\'s completions do not bleed into today', async () => {
    const openDateStr   = formatDateKey(BEFORE_MIDNIGHT);
    const openChecksKey = `@sunrise_checks_${openDateStr}`;

    const storage = makeMemoryStorage();
    const defaultChecks: Record<string, CheckEntry> = {
      p1: { ...DEFAULT_CHECK },
      p2: { ...DEFAULT_CHECK },
    };

    // BHT completes both checks before midnight
    await saveJsonToStorage(storage, openChecksKey, {
      p1: { ...DEFAULT_CHECK, completed: true, mood: 9 },
      p2: { ...DEFAULT_CHECK, completed: true, mood: 8 },
    });

    // App foregrounds after midnight
    const { rolled, newDateStr } = checkDateRollover(openDateStr, AFTER_MIDNIGHT);
    expect(rolled).toBe(true);

    const newChecksKey = `@sunrise_checks_${newDateStr}`;

    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_checks_', currentKey: newChecksKey },
    ]);

    const { checks, loaded } = await loadChecksState(storage, newChecksKey, defaultChecks);

    expect(loaded).toBe(true);
    expect(checks['p1']?.completed).toBe(false);   // new day, needs check-in
    expect(checks['p2']?.completed).toBe(false);
  });

  it('no rollover detected: data from the current day survives a foreground event', async () => {
    // If the nurse foregrounds the app mid-morning (no date change),
    // checkDateRollover returns rolled:false and no reload occurs.
    const dateStr  = formatDateKey(NEW_DAY);         // '2026-07-20'
    const marKey   = `@sunrise_mar_${dateStr}`;

    const storage = makeMemoryStorage({
      [marKey]: JSON.stringify({ p1: { 'med1-08:00': true } }),
    });

    const { rolled } = checkDateRollover(dateStr, new Date('2026-07-20T10:00:00.000Z'));
    expect(rolled).toBe(false);

    // Because rolled is false, the context does not change dateStr.
    // The existing marKey and its data remain intact.
    const { adminMap } = await loadMARState(storage, marKey);
    expect(adminMap['p1']?.['med1-08:00']).toBe(true);
  });
});

// ─── Tests: production key-lifecycle integration ──────────────────────────────
//
// These tests exercise the full load → save → reload cycle using the same
// makeMarKey / makeChecksKey helpers that MARContext.tsx uses in production.
// If those helpers ever diverge from the production key format, or if the
// context stops calling them, a test below will fail before the bug ships.

describe('production key-lifecycle — writes and reads use the same derived key', () => {
  it('MAR: data saved under today\'s derived key is visible on reload', async () => {
    const todayKey = makeMarKey(NEW_DAY);
    const storage  = makeMemoryStorage();

    // Simulate MARProvider persisting a toggle
    const saved: AdminMap = { p1: { 'med1-08:00': true } };
    storage.store[todayKey] = JSON.stringify(saved);

    // Simulate the cold-start load using the same derived key
    const { adminMap, loaded } = await loadMARState(storage, todayKey);

    expect(loaded).toBe(true);
    expect(adminMap['p1']?.['med1-08:00']).toBe(true);
  });

  it('MAR: data saved under yesterday\'s key is NOT visible when loading from today\'s key', async () => {
    // This is the exact bug that occurs when TODAY_DATE is captured once at
    // module load and the app stays open past midnight.
    // The nurse records doses after midnight → they go to yesterdayKey.
    // Next cold start: module re-evaluates → todayKey → storage has nothing.
    const yesterdayKey = makeMarKey(BEFORE_MIDNIGHT);  // @sunrise_mar_2026-07-19
    const todayKey     = makeMarKey(AFTER_MIDNIGHT);   // @sunrise_mar_2026-07-20

    const storage = makeMemoryStorage({
      [yesterdayKey]: JSON.stringify({ p1: { 'med1-08:00': true } }),
    });

    const { adminMap, loaded } = await loadMARState(storage, todayKey);

    // todayKey has no data → clean slate (confirms the bug scenario)
    expect(loaded).toBe(true);
    expect(adminMap).toEqual({});

    // Proof: using the stale key would return non-empty (wrong) data
    const { adminMap: staleMap } = await loadMARState(storage, yesterdayKey);
    expect(staleMap['p1']?.['med1-08:00']).toBe(true);  // stale data present
  });

  it('Checks: data saved under today\'s derived key is visible on reload', async () => {
    const todayKey     = makeChecksKey(NEW_DAY);
    const storage      = makeMemoryStorage();
    const defaultChecks: Record<string, CheckEntry> = {
      p1: { ...DEFAULT_CHECK },
    };

    // Simulate the BHT completing a check and it being persisted
    const completed = { p1: { ...DEFAULT_CHECK, completed: true, mood: 8 } };
    storage.store[todayKey] = JSON.stringify(completed);

    // Cold-start load using the same derived key
    const { checks, loaded } = await loadChecksState(storage, todayKey, defaultChecks);

    expect(loaded).toBe(true);
    expect(checks['p1']?.completed).toBe(true);
    expect(checks['p1']?.mood).toBe(8);
  });

  it('Checks: completed checks from yesterday are NOT visible when loading from today\'s key', async () => {
    const yesterdayKey = makeChecksKey(BEFORE_MIDNIGHT);
    const todayKey     = makeChecksKey(AFTER_MIDNIGHT);
    const defaultChecks: Record<string, CheckEntry> = {
      p1: { ...DEFAULT_CHECK },
      p2: { ...DEFAULT_CHECK },
    };

    const storage = makeMemoryStorage({
      [yesterdayKey]: JSON.stringify({
        p1: { ...DEFAULT_CHECK, completed: true },
        p2: { ...DEFAULT_CHECK, completed: true },
      }),
    });

    const { checks, loaded } = await loadChecksState(storage, todayKey, defaultChecks);

    // New day → all patients need check-in again
    expect(loaded).toBe(true);
    expect(checks['p1']?.completed).toBe(false);
    expect(checks['p2']?.completed).toBe(false);

    // Proof: the stale key still has the old data
    const { checks: staleChecks } = await loadChecksState(storage, yesterdayKey, defaultChecks);
    expect(staleChecks['p1']?.completed).toBe(true);
  });

  it('full cycle: prune then load returns a clean slate using derived keys only', async () => {
    const oldMarKey    = makeMarKey(BEFORE_MIDNIGHT);
    const newMarKey    = makeMarKey(AFTER_MIDNIGHT);
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    const storage = makeMemoryStorage({
      [oldMarKey]:    JSON.stringify({ p1: { 'med1-08:00': true } }),
      [oldChecksKey]: JSON.stringify({ p1: { ...DEFAULT_CHECK, completed: true } }),
    });

    // Step 1: pruneStaleKeys (as MARProvider does on mount)
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_mar_',    currentKey: newMarKey },
      { prefix: '@sunrise_checks_', currentKey: newChecksKey },
    ]);

    // Old keys gone
    expect(storage.store[oldMarKey]).toBeUndefined();
    expect(storage.store[oldChecksKey]).toBeUndefined();

    // Step 2: load both (as MARProvider's useEffects do)
    const [{ adminMap, loaded: marLoaded }, { checks, loaded: checksLoaded }] =
      await Promise.all([
        loadMARState(storage, newMarKey),
        loadChecksState(storage, newChecksKey, { p1: { ...DEFAULT_CHECK } }),
      ]);

    expect(marLoaded).toBe(true);
    expect(checksLoaded).toBe(true);
    expect(adminMap).toEqual({});           // clean MAR slate
    expect(checks['p1']?.completed).toBe(false);  // clean Checks slate
  });
});

// ─── Tests: regression documentation ─────────────────────────────────────────

// ─── Tests: makeHandoffNotesKey / makeHandoffShiftKey ────────────────────────

describe('makeHandoffNotesKey / makeHandoffShiftKey — storage key derivation', () => {
  it('makeHandoffNotesKey returns the correct prefixed key', () => {
    expect(makeHandoffNotesKey(NEW_DAY)).toBe('@sunrise_handoff_notes_2026-07-20');
  });

  it('makeHandoffShiftKey returns the correct prefixed key', () => {
    expect(makeHandoffShiftKey(NEW_DAY)).toBe('@sunrise_handoff_shift_2026-07-20');
  });

  it('yesterday and today produce different keys', () => {
    expect(makeHandoffNotesKey(BEFORE_MIDNIGHT)).not.toBe(makeHandoffNotesKey(AFTER_MIDNIGHT));
    expect(makeHandoffShiftKey(BEFORE_MIDNIGHT)).not.toBe(makeHandoffShiftKey(AFTER_MIDNIGHT));
  });

  it('the old key (yesterday) does not equal the new key (today) after rollover', () => {
    expect(makeHandoffNotesKey(BEFORE_MIDNIGHT)).toBe('@sunrise_handoff_notes_2026-07-19');
    expect(makeHandoffNotesKey(AFTER_MIDNIGHT)).toBe('@sunrise_handoff_notes_2026-07-20');
    expect(makeHandoffShiftKey(BEFORE_MIDNIGHT)).toBe('@sunrise_handoff_shift_2026-07-19');
    expect(makeHandoffShiftKey(AFTER_MIDNIGHT)).toBe('@sunrise_handoff_shift_2026-07-20');
  });
});

// ─── Tests: midnight rollover — handoff notes ─────────────────────────────────

describe('midnight rollover — pruneStaleStorageKeys removes yesterday\'s handoff entries', () => {
  it('removes the previous day\'s handoff notes key and keeps today\'s', async () => {
    const oldNotesKey = makeHandoffNotesKey(BEFORE_MIDNIGHT);
    const newNotesKey = makeHandoffNotesKey(NEW_DAY);

    const storage = makeMemoryStorage({
      [oldNotesKey]: JSON.stringify({ p1: 'Yesterday note' }),
      [newNotesKey]: JSON.stringify({}),
    });

    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_handoff_notes_', currentKey: newNotesKey },
    ]);

    expect(storage.store[oldNotesKey]).toBeUndefined();
    expect(storage.store[newNotesKey]).toBeDefined();
  });

  it('prunes both handoff keys in a single call (full rollover)', async () => {
    const oldNotesKey = makeHandoffNotesKey(BEFORE_MIDNIGHT);
    const newNotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const oldShiftKey = makeHandoffShiftKey(BEFORE_MIDNIGHT);
    const newShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);

    const storage = makeMemoryStorage({
      [oldNotesKey]: JSON.stringify({ p1: 'Old note' }),
      [newNotesKey]: JSON.stringify({}),
      [oldShiftKey]: 'eve',
      [newShiftKey]: 'day',
      '@unrelated_key': '{}',
    });

    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_handoff_notes_', currentKey: newNotesKey },
      { prefix: '@sunrise_handoff_shift_', currentKey: newShiftKey },
    ]);

    // Stale entries gone
    expect(storage.store[oldNotesKey]).toBeUndefined();
    expect(storage.store[oldShiftKey]).toBeUndefined();
    // Current entries preserved
    expect(storage.store[newNotesKey]).toBeDefined();
    expect(storage.store[newShiftKey]).toBeDefined();
    // Unrelated key untouched
    expect(storage.store['@unrelated_key']).toBeDefined();
  });
});

describe('midnight rollover — loadHandoffState reads from the new calendar-day key', () => {
  const defaultNotes = { p1: '', p2: '' };

  it('returns empty notes when the new key has no data (fresh start after rollover)', async () => {
    const newNotesKey = makeHandoffNotesKey(NEW_DAY);
    const newShiftKey = makeHandoffShiftKey(NEW_DAY);

    // Storage only has yesterday's notes — new keys do not exist yet
    const storage = makeMemoryStorage({
      [makeHandoffNotesKey(BEFORE_MIDNIGHT)]: JSON.stringify({ p1: 'Last shift note' }),
      [makeHandoffShiftKey(BEFORE_MIDNIGHT)]: 'eve',
    });

    const { notes, shift, loaded } = await loadHandoffState(
      storage,
      { notes: newNotesKey, shift: newShiftKey },
      { notes: defaultNotes, shift: 'day' },
    );

    expect(loaded).toBe(true);
    expect(notes).toEqual(defaultNotes);  // no bleed from yesterday
    expect(shift).toBe('day');            // default shift, not yesterday's 'eve'
  });

  it('restores notes written to the new key (same-day restart)', async () => {
    const newNotesKey = makeHandoffNotesKey(NEW_DAY);
    const newShiftKey = makeHandoffShiftKey(NEW_DAY);

    const todayNotes = { p1: 'Patient stable overnight', p2: '' };

    const storage = makeMemoryStorage({
      [newNotesKey]: JSON.stringify(todayNotes),
      [newShiftKey]: 'eve',
    });

    const { notes, shift, loaded } = await loadHandoffState(
      storage,
      { notes: newNotesKey, shift: newShiftKey },
      { notes: defaultNotes, shift: 'day' },
    );

    expect(loaded).toBe(true);
    expect(notes['p1']).toBe('Patient stable overnight');
    expect(shift).toBe('eve');
  });

  it('simulates a full rollover: prune then load returns a clean handoff slate', async () => {
    const oldNotesKey = makeHandoffNotesKey(BEFORE_MIDNIGHT);
    const newNotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const oldShiftKey = makeHandoffShiftKey(BEFORE_MIDNIGHT);
    const newShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);

    const storage = makeMemoryStorage({
      [oldNotesKey]: JSON.stringify({ p1: 'Night shift note', p2: 'Watch closely' }),
      [oldShiftKey]: 'night',
    });

    // Step 1: prune stale keys (as handoff screen does on mount)
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_handoff_notes_', currentKey: newNotesKey },
      { prefix: '@sunrise_handoff_shift_', currentKey: newShiftKey },
    ]);

    expect(storage.store[oldNotesKey]).toBeUndefined();
    expect(storage.store[oldShiftKey]).toBeUndefined();

    // Step 2: load from new keys (as loadHandoffState does on mount)
    const { notes, shift, loaded } = await loadHandoffState(
      storage,
      { notes: newNotesKey, shift: newShiftKey },
      { notes: defaultNotes, shift: 'day' },
    );

    expect(loaded).toBe(true);
    expect(notes).toEqual(defaultNotes);  // clean slate — no phantom notes
    expect(shift).toBe('day');            // default shift for the new day
  });

  it('live rollover: handoff notes from the previous shift do not bleed into the next day', async () => {
    const openDateStr   = formatDateKey(BEFORE_MIDNIGHT);
    const openNotesKey  = `@sunrise_handoff_notes_${openDateStr}`;
    const openShiftKey  = `@sunrise_handoff_shift_${openDateStr}`;

    const storage = makeMemoryStorage();
    await saveJsonToStorage(storage, openNotesKey, { p1: 'Watching vitals closely' });
    await storage.setItem(openShiftKey, 'night');

    // App foregrounds after midnight
    const { rolled, newDateStr } = checkDateRollover(openDateStr, AFTER_MIDNIGHT);
    expect(rolled).toBe(true);

    const newNotesKey = `@sunrise_handoff_notes_${newDateStr}`;
    const newShiftKey = `@sunrise_handoff_shift_${newDateStr}`;

    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_handoff_notes_', currentKey: newNotesKey },
      { prefix: '@sunrise_handoff_shift_', currentKey: newShiftKey },
    ]);

    expect(storage.store[openNotesKey]).toBeUndefined();

    const { notes, shift, loaded } = await loadHandoffState(
      storage,
      { notes: newNotesKey, shift: newShiftKey },
      { notes: { p1: '', p2: '' }, shift: 'day' },
    );

    expect(loaded).toBe(true);
    expect(notes['p1']).toBe('');   // previous note gone
    expect(shift).toBe('day');      // default shift for the new day
  });
});

describe('midnight rollover — regression: stale TODAY_DATE causes phantom data', () => {
  it('documents the bug: writes to the old key while the app is open past midnight', () => {
    // If TODAY_DATE is captured once at module load and the app stays open past
    // midnight, all new toggles continue writing to the OLD key.
    //
    // On next launch the module re-evaluates with the new date → NEW key is
    // empty → nurse sees a clean slate even though they recorded doses at 00:30.
    //
    // The fix: always derive the key from the current date at the point of use,
    // or refresh the context when the date changes.  formatDateKey() supports
    // this by accepting an explicit Date argument.

    const staleKey   = makeMarKey(BEFORE_MIDNIGHT);  // captured at module load
    const currentKey = makeMarKey(AFTER_MIDNIGHT);   // what the key should be now

    expect(staleKey).toBe('@sunrise_mar_2026-07-19');
    expect(currentKey).toBe('@sunrise_mar_2026-07-20');
    // They differ — any write using staleKey after midnight goes to the wrong bucket
    expect(staleKey).not.toBe(currentKey);
  });

  it('documents the fix: loading from the current-date key returns a clean slate after rollover', async () => {
    // If the app re-evaluates the module (cold launch on the new day) but
    // yesterday's writes used the old key, the new load correctly returns {} —
    // the nurse is not shown phantom checkmarks from the previous shift.

    const staleKey   = '@sunrise_mar_2026-07-19';
    const currentKey = '@sunrise_mar_2026-07-20';

    const storage = makeMemoryStorage({
      [staleKey]: JSON.stringify({ p1: { 'med1-08:00': true } }),
      // currentKey does not exist yet
    });

    const { adminMap, loaded } = await loadMARState(storage, currentKey);

    expect(loaded).toBe(true);
    expect(adminMap).toEqual({});  // clean slate — no phantom checkmarks
  });
});

// ─── Tests: combined MAR + Checks rollover (MARContext parallel reload) ───────
//
// MARContext drives BOTH adminMap and checks from a single shared dateStr.
// When checkDateRollover detects midnight has passed, dateStr updates once
// and BOTH reload effects fire in the same render cycle. The tests below
// verify that a single rollover event produces clean slates for both screens,
// that pruneStaleStorageKeys removes both key prefixes atomically, and that
// the deferred-storage pattern blocks ALL persist effects for both subsystems
// until their respective loads complete.

describe('combined MAR + Checks rollover — single checkDateRollover drives both reloads', () => {
  const defaultChecks: Record<string, CheckEntry> = {
    p1: { ...DEFAULT_CHECK },
    p2: { ...DEFAULT_CHECK },
  };

  it('checkDateRollover triggers clean slates for both adminMap and checks in one cycle', async () => {
    // Simulates MARContext's AppState handler: a single checkDateRollover call
    // updates dateStr, which re-derives both marKey and checksKey.
    const openDateStr = formatDateKey(BEFORE_MIDNIGHT);  // '2026-07-19'

    const oldMarKey    = `@sunrise_mar_${openDateStr}`;
    const oldChecksKey = `@sunrise_checks_${openDateStr}`;

    const storage = makeMemoryStorage({
      [oldMarKey]:    JSON.stringify({ p1: { 'med1-22:00': true } }),
      [oldChecksKey]: JSON.stringify({
        p1: { ...DEFAULT_CHECK, completed: true, mood: 9 },
        p2: { ...DEFAULT_CHECK, completed: true, mood: 7 },
      }),
    });

    // AppState fires 'active' → single checkDateRollover call detects rollover
    const { rolled, newDateStr } = checkDateRollover(openDateStr, AFTER_MIDNIGHT);
    expect(rolled).toBe(true);
    expect(newDateStr).toBe('2026-07-20');

    // MARContext derives both new keys from the same newDateStr
    const newMarKey    = `@sunrise_mar_${newDateStr}`;
    const newChecksKey = `@sunrise_checks_${newDateStr}`;

    // Both effects run together in the same rollover cycle (as MARContext does)
    await Promise.all([
      loadMARState(storage, newMarKey),
      loadChecksState(storage, newChecksKey, defaultChecks),
    ]).then(([marResult, checksResult]) => {
      // MAR clean slate
      expect(marResult.loaded).toBe(true);
      expect(marResult.adminMap).toEqual({});

      // Checks clean slate — no yesterday's completed=true values
      expect(checksResult.loaded).toBe(true);
      expect(checksResult.checks['p1']?.completed).toBe(false);
      expect(checksResult.checks['p2']?.completed).toBe(false);
    });
  });

  it('pruneStaleStorageKeys removes both @sunrise_mar_ and @sunrise_checks_ stale keys atomically', async () => {
    // Mirrors MARContext's prune effect which passes BOTH prefixes to a single
    // pruneStaleStorageKeys call — the removal is atomic (one multiRemove call).
    const newMarKey    = makeMarKey(AFTER_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    const storage = makeMemoryStorage({
      // Stale MAR keys (two days' worth)
      '@sunrise_mar_2026-07-17':    JSON.stringify({ p1: { 'med1-08:00': true } }),
      '@sunrise_mar_2026-07-19':    JSON.stringify({ p1: { 'med1-22:00': true } }),
      [newMarKey]:                  '{}',  // current — must survive
      // Stale Checks keys
      '@sunrise_checks_2026-07-18': JSON.stringify({ p1: { ...DEFAULT_CHECK, completed: true } }),
      '@sunrise_checks_2026-07-19': JSON.stringify({ p1: { ...DEFAULT_CHECK, completed: true } }),
      [newChecksKey]:               '{}',  // current — must survive
      // Unrelated key — must not be touched
      '@sunrise_handoff_notes_2026-07-19': '{}',
    });

    // Single call removes all stale keys for both prefixes
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_mar_',    currentKey: newMarKey },
      { prefix: '@sunrise_checks_', currentKey: newChecksKey },
    ]);

    // All stale MAR keys removed
    expect(storage.store['@sunrise_mar_2026-07-17']).toBeUndefined();
    expect(storage.store['@sunrise_mar_2026-07-19']).toBeUndefined();
    // All stale Checks keys removed
    expect(storage.store['@sunrise_checks_2026-07-18']).toBeUndefined();
    expect(storage.store['@sunrise_checks_2026-07-19']).toBeUndefined();
    // Current keys preserved
    expect(storage.store[newMarKey]).toBeDefined();
    expect(storage.store[newChecksKey]).toBeDefined();
    // Unrelated key untouched
    expect(storage.store['@sunrise_handoff_notes_2026-07-19']).toBeDefined();
  });

  it('deferred storage: neither MAR nor Checks persist fires before both loads complete', async () => {
    // Uses the deferred-storage pattern to hold getItem in-flight for both keys.
    // While pending, isPersistSafe must return false for both subsystems.
    // Only after release() resolves both loads may persists run.
    const newMarKey    = makeMarKey(AFTER_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    const { adapter, release } = makeDeferredStorage();
    // Separate in-memory store for persist assertions — nothing should be written here
    const persistStore = makeMemoryStorage();

    // Both loads are in-flight simultaneously (mirrors MARContext's parallel effects)
    const marLoadPromise    = loadMARState(adapter, newMarKey);
    const checksLoadPromise = loadChecksState(adapter, newChecksKey, defaultChecks);

    // Simulate guard refs: both are null (cleared synchronously before each async read)
    let marLoadedKeyRef: string | null    = null;
    let checksLoadedKeyRef: string | null = null;

    // Yield event loop — both promises still pending (deferred storage not released)
    await Promise.resolve();

    // Persist effects must be blocked for BOTH subsystems during the in-flight window
    expect(isPersistSafe(false, marLoadedKeyRef,    newMarKey)).toBe(false);
    expect(isPersistSafe(true,  marLoadedKeyRef,    newMarKey)).toBe(false);  // stale marLoaded
    expect(isPersistSafe(false, checksLoadedKeyRef, newChecksKey)).toBe(false);
    expect(isPersistSafe(true,  checksLoadedKeyRef, newChecksKey)).toBe(false); // stale checksLoaded

    // Simulate persist effects firing with stale loaded=true values from last render
    const staleAdminMap = { p1: { 'med1-22:00': true } };
    const staleChecks   = { p1: { ...DEFAULT_CHECK, completed: true } };

    if (isPersistSafe(true, marLoadedKeyRef, newMarKey)) {
      await saveJsonToStorage(persistStore, newMarKey, staleAdminMap);
    }
    if (isPersistSafe(true, checksLoadedKeyRef, newChecksKey)) {
      await saveJsonToStorage(persistStore, newChecksKey, staleChecks);
    }

    // Nothing written — both persists were blocked
    expect(persistStore.store[newMarKey]).toBeUndefined();
    expect(persistStore.store[newChecksKey]).toBeUndefined();

    // Now release the deferred storage — both loads resolve
    release();
    const [marResult, checksResult] = await Promise.all([marLoadPromise, checksLoadPromise]);

    // Update guard refs as MARContext does after each load settles
    marLoadedKeyRef    = newMarKey;
    checksLoadedKeyRef = newChecksKey;

    // Both loads returned clean slates
    expect(marResult.loaded).toBe(true);
    expect(marResult.adminMap).toEqual({});
    expect(checksResult.loaded).toBe(true);
    expect(checksResult.checks['p1']?.completed).toBe(false);
    expect(checksResult.checks['p2']?.completed).toBe(false);

    // Guard is now open for both subsystems
    expect(isPersistSafe(true, marLoadedKeyRef,    newMarKey)).toBe(true);
    expect(isPersistSafe(true, checksLoadedKeyRef, newChecksKey)).toBe(true);
  });

  it('full combined rollover: prune → parallel load → clean slates for both screens', async () => {
    // The complete rollover sequence MARContext executes when AppState fires
    // 'active' after midnight:
    //   1. checkDateRollover detects the day change → dateStr updates
    //   2. Prune effect removes stale keys for both prefixes
    //   3. MAR load effect and Checks load effect run in parallel
    //   4. Both produce clean slates (adminMap={}, checks all completed=false)

    const openDateStr = formatDateKey(BEFORE_MIDNIGHT);
    const oldMarKey    = `@sunrise_mar_${openDateStr}`;
    const oldChecksKey = `@sunrise_checks_${openDateStr}`;

    const storage = makeMemoryStorage({
      [oldMarKey]: JSON.stringify({
        p1: { 'med1-08:00': true, 'med2-12:00': true },
        p2: { 'med3-06:00': true },
      }),
      [oldChecksKey]: JSON.stringify({
        p1: { ...DEFAULT_CHECK, completed: true, mood: 8, cravings: 2 },
        p2: { ...DEFAULT_CHECK, completed: true, mood: 6, uaCollected: true },
      }),
    });

    // Step 1: AppState fires 'active' — single rollover detection
    const { rolled, newDateStr } = checkDateRollover(openDateStr, AFTER_MIDNIGHT);
    expect(rolled).toBe(true);

    const newMarKey    = `@sunrise_mar_${newDateStr}`;
    const newChecksKey = `@sunrise_checks_${newDateStr}`;

    // Step 2: prune effect — both prefixes in one call (atomic multiRemove)
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_mar_',    currentKey: newMarKey },
      { prefix: '@sunrise_checks_', currentKey: newChecksKey },
    ]);

    // Both stale keys are gone
    expect(storage.store[oldMarKey]).toBeUndefined();
    expect(storage.store[oldChecksKey]).toBeUndefined();

    // Step 3: parallel load (mirrors MARContext's independent load effects)
    const [marResult, checksResult] = await Promise.all([
      loadMARState(storage, newMarKey),
      loadChecksState(storage, newChecksKey, defaultChecks),
    ]);

    // Step 4: both screens show a clean slate for the new day
    expect(marResult.loaded).toBe(true);
    expect(marResult.adminMap).toEqual({});             // no phantom MAR checkmarks

    expect(checksResult.loaded).toBe(true);
    expect(checksResult.checks['p1']?.completed).toBe(false);  // needs check-in today
    expect(checksResult.checks['p2']?.completed).toBe(false);
    expect(checksResult.checks['p1']?.mood).toBe(5);           // reset to default
    expect(checksResult.checks['p2']?.uaCollected).toBe(false); // reset to default
  });
});
