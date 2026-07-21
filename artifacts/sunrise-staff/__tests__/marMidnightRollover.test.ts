/**
 * Unit tests — MAR midnight-rollover isPersistSafe guard
 *
 * Task 302 coverage:
 *   MARContext has two persist effects (adminMap and checks) both guarded by
 *   isPersistSafe(marLoaded, marLoadedKeyRef.current, marKey) and
 *   isPersistSafe(checksLoaded, checksLoadedKeyRef.current, checksKey).
 *   The load effects reset the loaded flag (via setMarLoaded(false) /
 *   setChecksLoaded(false)) and the loadedForKey ref (to null) BEFORE the
 *   async reads start, so persist effects that fire during the transition
 *   window return early and cannot write yesterday's in-memory state into
 *   today's empty bucket.
 *
 *   These tests verify:
 *     1. isPersistSafe returns false during the transition window (loaded reset,
 *        loadedForKey cleared) — no persist can fire.
 *     2. A simulated persist call using the new day's key plus stale adminMap /
 *        checks cannot write to storage because the guard blocks it.
 *     3. After the fresh load for the new key completes, loadedForKey matches
 *        the new key and isPersistSafe returns true — persists are now safe.
 *     4. The new day's bucket contains only the freshly-loaded adminMap / checks
 *        (not yesterday's in-memory state) after the full rollover cycle.
 *     5. The full effect-ordering sequence mirrors what React would actually
 *        execute for the load → (guard) → persist ordering in MARContext.tsx.
 *
 *   No React Native, Expo, or AsyncStorage imports are required — all helpers
 *   are pure Node-compatible functions from coldStartLoadHelpers.ts.
 */

import {
  isPersistSafe,
  makeMarKey,
  makeChecksKey,
  loadMARState,
  loadChecksState,
  saveJsonToStorage,
  pruneStaleStorageKeys,
  formatDateKey,
  checkDateRollover,
  type StorageAdapter,
  type AdminMap,
  type CheckEntry,
} from '../lib/coldStartLoadHelpers';

// ─── Mock storage builder ─────────────────────────────────────────────────────

function makeMemoryStorage(
  initial: Record<string, string> = {},
): StorageAdapter & { store: Record<string, string>; writeCount: number } {
  const store: Record<string, string> = { ...initial };
  let writeCount = 0;
  return {
    store,
    get writeCount() { return writeCount; },
    async getItem(key) { return store[key] ?? null; },
    async setItem(key, value) { writeCount++; store[key] = value; },
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

const STALE_ADMIN_MAP: AdminMap = {
  patient1: { 'med-A-08:00': true, 'med-B-12:00': false },
  patient2: { 'med-C-09:00': true },
};

const DEFAULT_CHECK_ENTRY: CheckEntry = {
  mood: 3,
  cravings: 2,
  oriented: true,
  uaCollected: false,
  completed: false,
};

const STALE_CHECKS: Record<string, CheckEntry> = {
  patient1: { mood: 4, cravings: 1, oriented: true, uaCollected: true, completed: true },
  patient2: { mood: 2, cravings: 3, oriented: false, uaCollected: false, completed: false },
};

const DEFAULT_CHECKS: Record<string, CheckEntry> = {
  patient1: DEFAULT_CHECK_ENTRY,
  patient2: DEFAULT_CHECK_ENTRY,
};

// ─── Tests: isPersistSafe — MAR-specific guard behaviour ──────────────────────

describe('isPersistSafe — MAR adminMap persist gate during midnight rollover', () => {
  it('returns false when marLoaded is false and marLoadedKeyRef is null (transition start)', () => {
    const newMarKey = makeMarKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(false, null, newMarKey)).toBe(false);
  });

  it('returns false when marLoaded is still true from previous render but marLoadedKeyRef was cleared', () => {
    // Critical race: React's effect ordering means the persist effect may see
    // `marLoaded === true` (captured from the last completed render) while the
    // load effect has already cleared marLoadedKeyRef to null for the new key.
    // isPersistSafe must block the write in this case.
    const newMarKey = makeMarKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(true, null, newMarKey)).toBe(false);
  });

  it('returns false when marLoadedKeyRef still holds the old (yesterday) key', () => {
    const oldMarKey = makeMarKey(BEFORE_MIDNIGHT);
    const newMarKey = makeMarKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(true, oldMarKey, newMarKey)).toBe(false);
  });

  it('returns true only after the fresh load completes and marLoadedKeyRef matches the new key', () => {
    const newMarKey = makeMarKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(true, newMarKey, newMarKey)).toBe(true);
  });
});

describe('isPersistSafe — MAR checks persist gate during midnight rollover', () => {
  it('returns false when checksLoaded is false and checksLoadedKeyRef is null (transition start)', () => {
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(false, null, newChecksKey)).toBe(false);
  });

  it('returns false when checksLoaded is still true from previous render but checksLoadedKeyRef was cleared', () => {
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(true, null, newChecksKey)).toBe(false);
  });

  it('returns false when checksLoadedKeyRef still holds the old (yesterday) key', () => {
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(true, oldChecksKey, newChecksKey)).toBe(false);
  });

  it('returns true only after the fresh load completes and checksLoadedKeyRef matches the new key', () => {
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(true, newChecksKey, newChecksKey)).toBe(true);
  });
});

// ─── Tests: no persist fires before fresh load completes ─────────────────────

describe('MAR rollover — adminMap persist effect cannot fire before fresh load completes', () => {
  it('guard blocks an adminMap persist during the transition window', async () => {
    const oldMarKey = makeMarKey(BEFORE_MIDNIGHT);
    const newMarKey = makeMarKey(AFTER_MIDNIGHT);

    // Storage starts with yesterday's adminMap
    const storage = makeMemoryStorage({
      [oldMarKey]: JSON.stringify(STALE_ADMIN_MAP),
    });

    // Simulate the state at the start of the rollover render:
    //   marLoaded = true   (from previous day's successful load — not yet reset)
    //   marLoadedKeyRef = oldMarKey  (from the previous load completion)
    let marLoadedKeyRef: string | null = oldMarKey;
    const currentMarKey = newMarKey; // marKey has already changed

    // Load effect fires first and resets both guards synchronously:
    marLoadedKeyRef = null;

    // Persist effect fires next (React effect ordering):
    // Even though the last render had marLoaded=true, marLoadedKeyRef is now null.
    // The persist must be blocked.
    const wouldPersist = isPersistSafe(
      /* marLoaded captured from render: still true in the persist closure */ true,
      marLoadedKeyRef,    // null — cleared by the load effect before this runs
      currentMarKey,
    );
    expect(wouldPersist).toBe(false);

    // Confirm: new key bucket must remain empty
    if (wouldPersist) {
      await saveJsonToStorage(storage, currentMarKey, STALE_ADMIN_MAP);
    }
    expect(storage.store[newMarKey]).toBeUndefined();
  });

  it('guard blocks a checks persist during the transition window', async () => {
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    const storage = makeMemoryStorage();

    // Load effect has run: guard cleared
    const checksLoadedKeyRef: string | null = null;

    const wouldPersist = isPersistSafe(true, checksLoadedKeyRef, newChecksKey);
    expect(wouldPersist).toBe(false);

    if (wouldPersist) {
      await saveJsonToStorage(storage, newChecksKey, STALE_CHECKS);
    }
    // No write must have occurred
    expect(storage.store[newChecksKey]).toBeUndefined();
  });

  it('deferred MAR load: adminMap persist cannot fire while storage read is in-flight', async () => {
    const newMarKey = makeMarKey(AFTER_MIDNIGHT);

    const { adapter, release } = makeDeferredStorage();
    const storage = makeMemoryStorage(); // separate writable storage for persist assertions

    // Simulate the in-flight load — the loadPromise has NOT resolved yet
    const loadPromise = loadMARState(adapter, newMarKey);

    let loadSettled = false;
    loadPromise.then(() => { loadSettled = true; });

    // Before the load resolves: guard state is (marLoaded=false, marLoadedKeyRef=null)
    let marLoadedKeyRef: string | null = null;
    expect(isPersistSafe(false, marLoadedKeyRef, newMarKey)).toBe(false);
    expect(isPersistSafe(true,  marLoadedKeyRef, newMarKey)).toBe(false); // even with stale marLoaded=true

    // Yield the event loop — load still pending
    await Promise.resolve();
    expect(loadSettled).toBe(false);

    // Any "persist" during this window would be blocked:
    if (isPersistSafe(true, marLoadedKeyRef, newMarKey)) {
      await saveJsonToStorage(storage, newMarKey, STALE_ADMIN_MAP);
    }
    expect(storage.store[newMarKey]).toBeUndefined(); // nothing written

    // Now release the storage read and await the load
    release();
    const { adminMap, loaded } = await loadPromise;
    marLoadedKeyRef = newMarKey; // mirrors: marLoadedKeyRef.current = marKey

    expect(loaded).toBe(true);
    expect(adminMap).toEqual({});

    // After load: guard is now open for the new key
    expect(isPersistSafe(true, marLoadedKeyRef, newMarKey)).toBe(true);
  });

  it('deferred Checks load: checks persist cannot fire while storage read is in-flight', async () => {
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    const { adapter, release } = makeDeferredStorage();
    const storage = makeMemoryStorage();

    const loadPromise = loadChecksState(adapter, newChecksKey, DEFAULT_CHECKS);

    let loadSettled = false;
    loadPromise.then(() => { loadSettled = true; });

    let checksLoadedKeyRef: string | null = null;
    expect(isPersistSafe(false, checksLoadedKeyRef, newChecksKey)).toBe(false);
    expect(isPersistSafe(true,  checksLoadedKeyRef, newChecksKey)).toBe(false);

    await Promise.resolve();
    expect(loadSettled).toBe(false);

    if (isPersistSafe(true, checksLoadedKeyRef, newChecksKey)) {
      await saveJsonToStorage(storage, newChecksKey, STALE_CHECKS);
    }
    expect(storage.store[newChecksKey]).toBeUndefined();

    release();
    const { checks, loaded } = await loadPromise;
    checksLoadedKeyRef = newChecksKey;

    expect(loaded).toBe(true);
    expect(checks).toEqual(DEFAULT_CHECKS); // fallback defaults returned

    expect(isPersistSafe(true, checksLoadedKeyRef, newChecksKey)).toBe(true);
  });
});

// ─── Tests: new day's bucket contains only freshly-loaded data ────────────────

describe('MAR rollover — new day bucket contains only freshly-loaded adminMap', () => {
  it('full rollover cycle: new adminMap bucket is empty before any nurse interaction', async () => {
    const oldMarKey = makeMarKey(BEFORE_MIDNIGHT);
    const newMarKey = makeMarKey(AFTER_MIDNIGHT);
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    // Storage state at rollover: yesterday's data is present
    const storage = makeMemoryStorage({
      [oldMarKey]:    JSON.stringify(STALE_ADMIN_MAP),
      [oldChecksKey]: JSON.stringify(STALE_CHECKS),
    });

    // Step 1: Load effect fires — guard cleared synchronously
    let marLoadedKeyRef: string | null = null;

    // Step 2: prune stale keys (as MARContext does before re-loading)
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_mar_',    currentKey: newMarKey },
      { prefix: '@sunrise_checks_', currentKey: newChecksKey },
    ]);

    // Yesterday's entries gone
    expect(storage.store[oldMarKey]).toBeUndefined();
    expect(storage.store[oldChecksKey]).toBeUndefined();

    // Step 3: async load from new key
    const { adminMap, loaded } = await loadMARState(storage, newMarKey);
    marLoadedKeyRef = newMarKey;

    expect(loaded).toBe(true);
    expect(adminMap).toEqual({}); // fresh slate — no yesterday's checkmarks

    // Step 4: guard is now open — a persist call would write the clean state
    expect(isPersistSafe(loaded, marLoadedKeyRef, newMarKey)).toBe(true);

    // Simulating the adminMap persist effect writing the freshly-loaded state:
    await saveJsonToStorage(storage, newMarKey, adminMap);

    // New bucket contains only the fresh state (empty map), not yesterday's checkmarks
    const written = JSON.parse(storage.store[newMarKey]!);
    expect(written).toEqual({});
    // Yesterday's administered meds are absent
    expect(written['patient1']).toBeUndefined();
    expect(written['patient2']).toBeUndefined();
  });

  it('full rollover cycle: new checks bucket reflects only fresh defaults', async () => {
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    const storage = makeMemoryStorage({
      [oldChecksKey]: JSON.stringify(STALE_CHECKS),
    });

    let checksLoadedKeyRef: string | null = null;

    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_checks_', currentKey: newChecksKey },
    ]);
    expect(storage.store[oldChecksKey]).toBeUndefined();

    const { checks, loaded } = await loadChecksState(storage, newChecksKey, DEFAULT_CHECKS);
    checksLoadedKeyRef = newChecksKey;

    expect(loaded).toBe(true);
    // No stored data for the new key → defaults returned
    expect(checks['patient1']).toEqual(DEFAULT_CHECK_ENTRY);
    expect(checks['patient2']).toEqual(DEFAULT_CHECK_ENTRY);
    // Stale "completed: true" from yesterday is absent
    expect(checks['patient1'].completed).toBe(false);
    expect(checks['patient1'].uaCollected).toBe(false);

    expect(isPersistSafe(loaded, checksLoadedKeyRef, newChecksKey)).toBe(true);

    await saveJsonToStorage(storage, newChecksKey, checks);
    const written = JSON.parse(storage.store[newChecksKey]!);
    expect(written['patient1'].completed).toBe(false);
  });

  it('nurse toggles after rollover are persisted to the new MAR bucket only', async () => {
    const newMarKey = makeMarKey(AFTER_MIDNIGHT);

    // Fresh storage — no previous day data
    const storage = makeMemoryStorage();

    const { adminMap, loaded } = await loadMARState(storage, newMarKey);
    const marLoadedKeyRef: string | null = newMarKey;

    expect(loaded).toBe(true);
    expect(adminMap).toEqual({});

    // Guard now open; nurse toggles a medication
    const updatedAdminMap: AdminMap = {
      ...adminMap,
      patient1: { 'med-A-08:00': true },
    };

    expect(isPersistSafe(loaded, marLoadedKeyRef, newMarKey)).toBe(true);
    await saveJsonToStorage(storage, newMarKey, updatedAdminMap);

    // Verify the toggle landed in the NEW key bucket
    const saved = JSON.parse(storage.store[newMarKey]!);
    expect(saved['patient1']['med-A-08:00']).toBe(true);

    // The old key bucket does not exist (nothing bled back)
    const oldMarKey = makeMarKey(BEFORE_MIDNIGHT);
    expect(storage.store[oldMarKey]).toBeUndefined();
  });

  it("yesterday's adminMap checkmarks are not visible when loading the new day's bucket", async () => {
    const oldMarKey = makeMarKey(BEFORE_MIDNIGHT);
    const newMarKey = makeMarKey(AFTER_MIDNIGHT);

    // Storage has yesterday's data; today's key doesn't exist yet
    const storage = makeMemoryStorage({
      [oldMarKey]: JSON.stringify(STALE_ADMIN_MAP),
    });

    const { adminMap, loaded } = await loadMARState(storage, newMarKey);

    expect(loaded).toBe(true);
    // New load reads from newMarKey (which has no data) → empty map returned
    expect(adminMap).toEqual({});
    // Yesterday's administered doses are absent
    expect(adminMap['patient1']).toBeUndefined();
    expect(adminMap['patient2']).toBeUndefined();
  });
});

// ─── Tests: full effect-ordering sequence mirroring MARContext.tsx ────────────
//
// Reproduces the exact sequence of operations that React performs during a
// midnight rollover in MARContext, using the same helpers in the same order.
// The goal is to prove that no stale write can reach the new day's bucket
// regardless of whether persist effects fire before or after the load settles.

describe('MAR rollover — full effect-ordering simulation (mirrors MARContext.tsx)', () => {
  it('rollover sequence: load effect clears guards → persist blocked → load resolves → persist safe', async () => {
    const oldMarKey = makeMarKey(BEFORE_MIDNIGHT);
    const newMarKey = makeMarKey(AFTER_MIDNIGHT);
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    const storage = makeMemoryStorage({
      [oldMarKey]:    JSON.stringify(STALE_ADMIN_MAP),
      [oldChecksKey]: JSON.stringify(STALE_CHECKS),
    });

    // ── RENDER N (before midnight) ─────────────────────────────────────────
    // The previous render completed successfully:
    let marLoaded: boolean = true;
    let marLoadedKeyRef: string | null = oldMarKey;
    let checksLoaded: boolean = true;
    let checksLoadedKeyRef: string | null = oldChecksKey;
    // In-memory state from yesterday's render:
    let currentAdminMap: AdminMap = STALE_ADMIN_MAP;
    let currentChecks: Record<string, CheckEntry> = STALE_CHECKS;

    // ── RENDER N+1 (midnight rollover fires) ───────────────────────────────
    // dateStr changes to AFTER_MIDNIGHT date; marKey = newMarKey, checksKey = newChecksKey.

    // MAR LOAD EFFECT fires first (synchronous guard resets before async read):
    marLoaded = false;      // setMarLoaded(false)
    marLoadedKeyRef = null; // marLoadedKeyRef.current = null

    // CHECKS LOAD EFFECT fires next (synchronous guard resets):
    checksLoaded = false;
    checksLoadedKeyRef = null;

    // PERSIST EFFECTS fire next with values from the last render:
    // (React effects run in declaration order; persist effects see the closure
    // values from the render that scheduled them, but loadedForKey refs were
    // cleared synchronously by the load effects above.)

    // adminMap persist:
    const adminMapPersistSafe = isPersistSafe(
      /* marLoaded from last render */ true,
      marLoadedKeyRef,    // null — cleared above
      newMarKey,
    );
    expect(adminMapPersistSafe).toBe(false);  // ✓ blocked — stale write prevented
    if (adminMapPersistSafe) {
      await saveJsonToStorage(storage, newMarKey, currentAdminMap);
    }

    // checks persist:
    const checksPersistSafe = isPersistSafe(
      /* checksLoaded from last render */ true,
      checksLoadedKeyRef, // null — cleared above
      newChecksKey,
    );
    expect(checksPersistSafe).toBe(false);  // ✓ blocked — stale write prevented
    if (checksPersistSafe) {
      await saveJsonToStorage(storage, newChecksKey, currentChecks);
    }

    // New day buckets must still be empty — no stale writes occurred
    expect(storage.store[newMarKey]).toBeUndefined();
    expect(storage.store[newChecksKey]).toBeUndefined();

    // ASYNC LOADS for newMarKey / newChecksKey complete:
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_mar_',    currentKey: newMarKey },
      { prefix: '@sunrise_checks_', currentKey: newChecksKey },
    ]);

    const { adminMap: freshAdminMap, loaded: freshMarLoaded } =
      await loadMARState(storage, newMarKey);
    const { checks: freshChecks, loaded: freshChecksLoaded } =
      await loadChecksState(storage, newChecksKey, DEFAULT_CHECKS);

    // State updates from the successful loads:
    currentAdminMap   = freshAdminMap;
    currentChecks     = freshChecks;
    marLoaded         = freshMarLoaded;
    marLoadedKeyRef   = newMarKey;      // marLoadedKeyRef.current = marKey
    checksLoaded      = freshChecksLoaded;
    checksLoadedKeyRef = newChecksKey;  // checksLoadedKeyRef.current = checksKey

    expect(marLoaded).toBe(true);
    expect(checksLoaded).toBe(true);
    expect(currentAdminMap).toEqual({});             // clean slate
    expect(currentChecks['patient1'].completed).toBe(false); // default, not stale

    // PERSIST EFFECTS RE-RUN after state update — now safe:
    const adminMapPersistSafeAfterLoad = isPersistSafe(marLoaded, marLoadedKeyRef, newMarKey);
    expect(adminMapPersistSafeAfterLoad).toBe(true);  // ✓ safe now

    const checksPersistSafeAfterLoad = isPersistSafe(checksLoaded, checksLoadedKeyRef, newChecksKey);
    expect(checksPersistSafeAfterLoad).toBe(true);  // ✓ safe now

    // Simulate the persist effects writing the freshly-loaded clean state:
    await saveJsonToStorage(storage, newMarKey, currentAdminMap);
    await saveJsonToStorage(storage, newChecksKey, currentChecks);

    // New buckets must contain only the freshly-loaded state
    const writtenAdminMap = JSON.parse(storage.store[newMarKey]!);
    expect(writtenAdminMap).toEqual({});
    // Yesterday's administered meds did NOT bleed in
    expect(writtenAdminMap['patient1']).toBeUndefined();

    const writtenChecks = JSON.parse(storage.store[newChecksKey]!);
    expect(writtenChecks['patient1'].completed).toBe(false);
    // Yesterday's "uaCollected: true" did NOT bleed in
    expect(writtenChecks['patient1'].uaCollected).toBe(false);
  });

  it('live rollover via checkDateRollover: foreground after midnight → clean MAR slate', async () => {
    // Simulates the AppState 'active' listener in MARContext firing,
    // checkDateRollover detecting a new day, and setDateStr updating the key,
    // which triggers the load effect to reset the guards and re-load from the new key.

    const openDateStr = formatDateKey(BEFORE_MIDNIGHT);  // '2026-07-19'
    const openMarKey  = `@sunrise_mar_${openDateStr}`;
    const openChecksKey = `@sunrise_checks_${openDateStr}`;

    const storage = makeMemoryStorage();

    // Nurse administered some meds before midnight
    await saveJsonToStorage(storage, openMarKey, STALE_ADMIN_MAP);
    await saveJsonToStorage(storage, openChecksKey, STALE_CHECKS);

    // Clock passes midnight
    const { rolled, newDateStr } = checkDateRollover(openDateStr, AFTER_MIDNIGHT);
    expect(rolled).toBe(true);
    expect(newDateStr).toBe('2026-07-20');

    // MARContext: marKey = makeMarKey(today) — now new day's key
    const newMarKey    = `@sunrise_mar_${newDateStr}`;
    const newChecksKey = `@sunrise_checks_${newDateStr}`;

    // Load effects: guard reset + prune + load
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_mar_',    currentKey: newMarKey },
      { prefix: '@sunrise_checks_', currentKey: newChecksKey },
    ]);

    expect(storage.store[openMarKey]).toBeUndefined();    // yesterday's MAR pruned
    expect(storage.store[openChecksKey]).toBeUndefined(); // yesterday's checks pruned

    const { adminMap, loaded: marLoaded } = await loadMARState(storage, newMarKey);
    const { checks,   loaded: checksLoaded } = await loadChecksState(storage, newChecksKey, DEFAULT_CHECKS);

    expect(marLoaded).toBe(true);
    expect(checksLoaded).toBe(true);

    // New day: fresh empty adminMap — yesterday's administered doses gone
    expect(adminMap).toEqual({});
    expect(adminMap['patient1']).toBeUndefined();

    // New day: default check entries — yesterday's completed checks gone
    expect(checks['patient1'].completed).toBe(false);
    expect(checks['patient1'].uaCollected).toBe(false);
    expect(checks['patient2'].completed).toBe(false);
  });
});
