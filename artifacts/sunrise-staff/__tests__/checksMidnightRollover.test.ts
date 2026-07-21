/**
 * Unit tests — ChecksView midnight-rollover isPersistSafe guard
 *
 * Task 303 coverage:
 *   MARContext manages Checks state alongside MAR state, with its own
 *   persist effect guarded by:
 *     isPersistSafe(checksLoaded, checksLoadedKeyRef.current, checksKey)
 *
 *   The load effect resets both `checksLoaded` (via setChecksLoaded(false))
 *   and `checksLoadedKeyRef.current` (to null) BEFORE the async read starts,
 *   so persist effects that fire during the transition window return early and
 *   cannot write yesterday's completed=true state into today's empty bucket.
 *
 *   These tests verify:
 *     1. isPersistSafe returns false during the transition window (checksLoaded
 *        reset, checksLoadedKeyRef cleared) — no persist can fire.
 *     2. A simulated persist call using the new day's key plus stale check
 *        completions cannot write to storage because the guard blocks it.
 *     3. After the fresh load for the new key completes, checksLoadedKeyRef
 *        matches the new key and isPersistSafe returns true.
 *     4. The new day's bucket starts empty (completed=false for all patients)
 *        after the full rollover cycle — no yesterday's check completions bleed
 *        through.
 *     5. The full effect-ordering sequence mirrors what React would actually
 *        execute for the load → (guard) → persist ordering in MARContext.
 *
 *   No React Native, Expo, or AsyncStorage imports are required — all helpers
 *   are pure Node-compatible functions from coldStartLoadHelpers.ts.
 */

import {
  isPersistSafe,
  makeChecksKey,
  loadChecksState,
  saveJsonToStorage,
  pruneStaleStorageKeys,
  formatDateKey,
  checkDateRollover,
  type StorageAdapter,
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

const DEFAULT_CHECK: CheckEntry = {
  mood: 5, cravings: 5, oriented: true, uaCollected: false, completed: false,
};

const DEFAULT_CHECKS: Record<string, CheckEntry> = {
  p1: { ...DEFAULT_CHECK },
  p2: { ...DEFAULT_CHECK },
};

// ─── Tests: isPersistSafe — Checks-specific guard behaviour ──────────────────

describe('isPersistSafe — Checks persist gate during midnight rollover', () => {
  it('returns false when checksLoaded is false and checksLoadedKeyRef is null (transition start)', () => {
    // This is the state immediately after the load effect fires for the new key:
    // setChecksLoaded(false) and checksLoadedKeyRef.current = null have both run.
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(false, null, newChecksKey)).toBe(false);
  });

  it('returns false when checksLoaded is still true from the previous render but checksLoadedKeyRef was cleared', () => {
    // Critical race: React's effect ordering means the persist effect may see
    // `checksLoaded === true` (captured from the last completed render) while
    // the load effect has already cleared checksLoadedKeyRef to null.
    // isPersistSafe must block the write in this case.
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(true, null, newChecksKey)).toBe(false);
  });

  it('returns false when checksLoadedKeyRef still holds the old (yesterday) key', () => {
    // If checksLoadedKeyRef was not cleared before the async read started, the
    // old value (yesterday's key) would be present during the rollover window.
    // isPersistSafe must block writes to the new key in this case too.
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(true, oldChecksKey, newChecksKey)).toBe(false);
  });

  it('returns true only after the fresh load completes and checksLoadedKeyRef matches the new key', () => {
    // This is the normal state after loadChecksState resolves for the new key:
    //   checksLoadedKeyRef.current = checksKey (the new key)
    //   setChecksLoaded(true) has fired
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(true, newChecksKey, newChecksKey)).toBe(true);
  });

  it('returns false when checksLoadedKeyRef holds a completely different key', () => {
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(true, '@other_key', newChecksKey)).toBe(false);
  });
});

// ─── Tests: no persist fires before fresh load completes ─────────────────────

describe('Checks rollover — persist effect cannot fire before fresh load completes', () => {
  it('guard blocks a checks persist during the transition window', async () => {
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    // Storage starts with yesterday's completed checks
    const storage = makeMemoryStorage({
      [oldChecksKey]: JSON.stringify({
        p1: { ...DEFAULT_CHECK, completed: true, mood: 9 },
        p2: { ...DEFAULT_CHECK, completed: true, mood: 8 },
      }),
    });

    // Simulate the state at the start of the rollover render:
    //   checksLoaded = true   (from previous day's successful load — not yet reset)
    //   checksLoadedKeyRef = oldChecksKey  (from the previous load completion)
    let checksLoaded: boolean = true;
    let checksLoadedKeyRef: string | null = oldChecksKey;
    const currentChecksKey = newChecksKey; // checksKey has already changed

    // Load effect fires first and resets both guards synchronously:
    checksLoaded = false;
    checksLoadedKeyRef = null;

    // Persist effect fires next (React effect ordering):
    // Even though the last render had checksLoaded=true, checksLoadedKeyRef is now null.
    // The persist must be blocked.
    const staleChecks = {
      p1: { ...DEFAULT_CHECK, completed: true, mood: 9 },
      p2: { ...DEFAULT_CHECK, completed: true, mood: 8 },
    }; // yesterday's in-memory state

    const wouldPersist = isPersistSafe(
      /* checksLoaded captured from render: still true in the persist closure */ true,
      checksLoadedKeyRef,    // null — cleared by the load effect before this runs
      currentChecksKey,
    );
    expect(wouldPersist).toBe(false);

    // Confirm: the new key bucket must remain empty — no stale completions written
    if (wouldPersist) {
      await saveJsonToStorage(storage, currentChecksKey, staleChecks);
    }
    expect(storage.store[newChecksKey]).toBeUndefined();
  });

  it('guard blocks persist even when only one patient was completed yesterday', async () => {
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    const storage = makeMemoryStorage({
      [oldChecksKey]: JSON.stringify({
        p1: { ...DEFAULT_CHECK, completed: true },
        p2: { ...DEFAULT_CHECK, completed: false },
      }),
    });

    // Load effect has run: both guards cleared
    const checksLoadedKeyRef: string | null = null;

    const wouldPersist = isPersistSafe(true, checksLoadedKeyRef, newChecksKey);
    expect(wouldPersist).toBe(false);

    if (wouldPersist) {
      await saveJsonToStorage(storage, newChecksKey, {
        p1: { ...DEFAULT_CHECK, completed: true },
        p2: { ...DEFAULT_CHECK, completed: false },
      });
    }
    // New bucket must still be empty — no partial-completion bleed
    expect(storage.store[newChecksKey]).toBeUndefined();
  });

  it('deferred load: persist cannot fire while storage read is in-flight', async () => {
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    const { adapter, release } = makeDeferredStorage();
    const storage = makeMemoryStorage(); // separate writable storage for persist assertions

    // Simulate the in-flight load — the loadPromise has NOT resolved yet
    const loadPromise = loadChecksState(adapter, newChecksKey, DEFAULT_CHECKS);

    let loadSettled = false;
    loadPromise.then(() => { loadSettled = true; });

    // Before the load resolves: guard state is (checksLoaded=false, checksLoadedKeyRef=null)
    // Persist effects must be blocked
    let checksLoadedKeyRef: string | null = null;
    expect(isPersistSafe(false, checksLoadedKeyRef, newChecksKey)).toBe(false);
    expect(isPersistSafe(true,  checksLoadedKeyRef, newChecksKey)).toBe(false); // even with stale checksLoaded=true

    // Yield the event loop — load still pending
    await Promise.resolve();
    expect(loadSettled).toBe(false);

    // Any "persist" during this window would be blocked:
    const staleChecks = {
      p1: { ...DEFAULT_CHECK, completed: true },
      p2: { ...DEFAULT_CHECK, completed: true },
    };
    if (isPersistSafe(true, checksLoadedKeyRef, newChecksKey)) {
      await saveJsonToStorage(storage, newChecksKey, staleChecks);
    }
    expect(storage.store[newChecksKey]).toBeUndefined(); // nothing written

    // Now release the storage read and await the load
    release();
    const { checks, loaded } = await loadPromise;
    checksLoadedKeyRef = newChecksKey; // mirrors: checksLoadedKeyRef.current = checksKey

    expect(loaded).toBe(true);
    expect(checks['p1']?.completed).toBe(false);
    expect(checks['p2']?.completed).toBe(false);

    // After load: guard is now open for the new key
    expect(isPersistSafe(true, checksLoadedKeyRef, newChecksKey)).toBe(true);
  });
});

// ─── Tests: new day's bucket starts empty (completed=false for all patients) ──

describe('Checks rollover — new day bucket starts with completed=false for all patients', () => {
  it('full rollover cycle: no patients appear already checked in after midnight', async () => {
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    // Storage state at rollover: both patients were completed yesterday
    const storage = makeMemoryStorage({
      [oldChecksKey]: JSON.stringify({
        p1: { ...DEFAULT_CHECK, completed: true, mood: 9, cravings: 2 },
        p2: { ...DEFAULT_CHECK, completed: true, mood: 7, uaCollected: true },
      }),
    });

    // Step 1: load effect fires — guard cleared synchronously
    let checksLoaded: boolean = false;
    let checksLoadedKeyRef: string | null = null;

    // Step 2: prune stale keys (as MARContext does before loadChecksState)
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_checks_', currentKey: newChecksKey },
    ]);

    // Yesterday's entry gone
    expect(storage.store[oldChecksKey]).toBeUndefined();

    // Step 3: async load from new key
    const { checks, loaded: loadResult } = await loadChecksState(
      storage,
      newChecksKey,
      DEFAULT_CHECKS,
    );
    checksLoaded = loadResult;
    checksLoadedKeyRef = newChecksKey;

    expect(checksLoaded).toBe(true);
    // New day: all patients need check-in — none appear pre-completed
    expect(checks['p1']?.completed).toBe(false);
    expect(checks['p2']?.completed).toBe(false);

    // Step 4: guard is now open — a persist call would write the clean state
    expect(isPersistSafe(checksLoaded, checksLoadedKeyRef, newChecksKey)).toBe(true);

    // Simulating the checks persist effect writing the freshly-loaded state:
    await saveJsonToStorage(storage, newChecksKey, checks);

    // New bucket contains only the fresh state (completed=false), not yesterday's
    const written = JSON.parse(storage.store[newChecksKey]!);
    expect(written['p1']?.completed).toBe(false);  // yesterday's completed=true is absent
    expect(written['p2']?.completed).toBe(false);
    expect(written['p1']?.mood).toBe(5);           // default mood, not yesterday's 9
    expect(written['p2']?.uaCollected).toBe(false); // default, not yesterday's true
  });

  it('BHT completions after rollover are persisted to the new bucket only', async () => {
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    // Fresh storage — no previous day data
    const storage = makeMemoryStorage();

    // Load completes for the new key
    const { checks, loaded } = await loadChecksState(storage, newChecksKey, DEFAULT_CHECKS);
    const checksLoadedKeyRef: string | null = newChecksKey;

    expect(loaded).toBe(true);
    expect(checks['p1']?.completed).toBe(false);

    // Guard now open; BHT completes a check-in for p1
    const updatedChecks = {
      ...checks,
      p1: { ...checks['p1']!, completed: true, mood: 8 },
    };

    expect(isPersistSafe(loaded, checksLoadedKeyRef, newChecksKey)).toBe(true);
    await saveJsonToStorage(storage, newChecksKey, updatedChecks);

    // Verify the completion landed in the NEW key bucket
    const saved = JSON.parse(storage.store[newChecksKey]!);
    expect(saved['p1']?.completed).toBe(true);
    expect(saved['p1']?.mood).toBe(8);
    expect(saved['p2']?.completed).toBe(false);  // p2 still pending

    // The old key bucket does not exist (nothing bled back)
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    expect(storage.store[oldChecksKey]).toBeUndefined();
  });

  it("yesterday's check completions are not visible when loading the new day's bucket", async () => {
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    // Storage has yesterday's completed checks; today's key doesn't exist yet
    const storage = makeMemoryStorage({
      [oldChecksKey]: JSON.stringify({
        p1: { ...DEFAULT_CHECK, completed: true, mood: 10, cravings: 1 },
        p2: { ...DEFAULT_CHECK, completed: true, mood: 6, uaCollected: true },
      }),
    });

    const { checks, loaded } = await loadChecksState(storage, newChecksKey, DEFAULT_CHECKS);

    expect(loaded).toBe(true);
    // New load reads from newChecksKey (which has no data) → defaults returned
    expect(checks['p1']?.completed).toBe(false);  // yesterday's completed=true absent
    expect(checks['p2']?.completed).toBe(false);
    expect(checks['p1']?.mood).toBe(5);           // default, not yesterday's 10
    expect(checks['p2']?.uaCollected).toBe(false); // default, not yesterday's true
  });
});

// ─── Tests: guard blocks persist during the transition window ─────────────────

describe('Checks rollover — guard blocks persist during loadedForKey cleared, load in-flight', () => {
  it('transition window: loadedForKey cleared but checksLoaded not yet reset (React closure lag)', () => {
    // React's effect ordering: the load effect fires first and clears checksLoadedKeyRef
    // synchronously, but the persist effect sees the closure-captured checksLoaded=true
    // from the last render. The ref check is the only gate that catches this case.
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    // Load effect ran: ref cleared to null
    const checksLoadedKeyRef: string | null = null;

    // Persist effect fires with stale checksLoaded=true from last render's closure
    const persistSafe = isPersistSafe(
      /* stale checksLoaded from render closure */ true,
      checksLoadedKeyRef,   // null — cleared synchronously by load effect
      newChecksKey,
    );
    expect(persistSafe).toBe(false);   // ✓ blocked by ref mismatch
  });

  it('transition window: checksLoadedKeyRef holds old key (ref not cleared yet — regression guard)', () => {
    // If the ref were not cleared before the async read started, the old value
    // would be present during the rollover window. This test confirms the guard
    // catches this hypothetical regression too.
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    // checksLoadedKeyRef was NOT cleared (hypothetical regression: load effect
    // didn't reset the ref before starting the async read)
    const checksLoadedKeyRef: string | null = oldChecksKey; // stale — still holds yesterday

    // persist effect fires for the new key — must be blocked
    expect(isPersistSafe(true, checksLoadedKeyRef, newChecksKey)).toBe(false);

    // Once the fresh load completes and the ref is updated, it becomes safe
    const checksLoadedKeyRefAfterLoad: string | null = newChecksKey;
    expect(isPersistSafe(true, checksLoadedKeyRefAfterLoad, newChecksKey)).toBe(true);
  });
});

// ─── Tests: full effect-ordering sequence mirroring MARContext ────────────────
//
// Reproduces the exact sequence of operations that React performs during a
// midnight rollover in MARContext for the Checks persist effect, using the
// same helpers in the same order.  Proves that no stale write can reach the
// new day's bucket regardless of when persist effects fire relative to the
// load resolution.

describe('Checks rollover — full effect-ordering simulation (mirrors MARContext)', () => {
  it('rollover sequence: load effect clears guards → persist blocked → load resolves → persist safe', async () => {
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    const storage = makeMemoryStorage({
      [oldChecksKey]: JSON.stringify({
        p1: { ...DEFAULT_CHECK, completed: true, mood: 9 },
        p2: { ...DEFAULT_CHECK, completed: true, mood: 7 },
      }),
    });

    // ── RENDER N (before midnight) ─────────────────────────────────────────
    // The previous render completed successfully:
    let checksLoaded: boolean = true;
    let checksLoadedKeyRef: string | null = oldChecksKey;
    // In-memory state from yesterday's render:
    let currentChecks: Record<string, CheckEntry> = {
      p1: { ...DEFAULT_CHECK, completed: true, mood: 9 },
      p2: { ...DEFAULT_CHECK, completed: true, mood: 7 },
    };

    // ── RENDER N+1 (midnight rollover fires) ───────────────────────────────
    // checksKey changes to newChecksKey after dateStr updates.

    // LOAD EFFECT fires first (synchronous guard resets before async read):
    checksLoaded = false;    // setChecksLoaded(false)
    checksLoadedKeyRef = null;  // checksLoadedKeyRef.current = null

    // PERSIST EFFECT fires next with values from the last render:
    // (React effects run in declaration order; persist effects see the closure
    // values from the render that scheduled them, but checksLoadedKeyRef was
    // cleared synchronously by the load effect above.)

    const persistSafe = isPersistSafe(
      /* checksLoaded from last render */ true,
      checksLoadedKeyRef,    // null — cleared above
      newChecksKey,
    );
    expect(persistSafe).toBe(false);  // ✓ blocked — stale write prevented

    if (persistSafe) {
      await saveJsonToStorage(storage, newChecksKey, currentChecks);
    }

    // New day bucket must still be empty — no stale completions occurred
    expect(storage.store[newChecksKey]).toBeUndefined();

    // ASYNC LOAD for newChecksKey completes:
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_checks_', currentKey: newChecksKey },
    ]);

    const { checks: freshChecks, loaded: freshLoaded } = await loadChecksState(
      storage,
      newChecksKey,
      DEFAULT_CHECKS,
    );

    // State updates from the successful load:
    currentChecks     = freshChecks;
    checksLoaded      = freshLoaded;
    checksLoadedKeyRef = newChecksKey;  // checksLoadedKeyRef.current = checksKey

    expect(checksLoaded).toBe(true);
    expect(currentChecks['p1']?.completed).toBe(false);  // clean slate
    expect(currentChecks['p2']?.completed).toBe(false);

    // PERSIST EFFECT RE-RUNS after state update — now safe:
    const persistSafeAfterLoad = isPersistSafe(checksLoaded, checksLoadedKeyRef, newChecksKey);
    expect(persistSafeAfterLoad).toBe(true);  // ✓ safe now

    // Simulate the persist writing the freshly-loaded clean state:
    await saveJsonToStorage(storage, newChecksKey, currentChecks);

    // New bucket must contain only the freshly-loaded state (completed=false)
    const written = JSON.parse(storage.store[newChecksKey]!);
    expect(written['p1']?.completed).toBe(false);  // yesterday's completed=true did NOT bleed in
    expect(written['p2']?.completed).toBe(false);
    expect(written['p1']?.mood).toBe(5);           // default mood
  });

  it('live rollover via checkDateRollover: foreground after midnight → clean Checks slate', async () => {
    // Simulates the midnight detection in MARContext's AppState 'active' listener
    // calling setDateStr(formatDateKey(now)), which re-derives checksKey from the
    // new date, triggering the load effect to reset the guards and re-load.

    const openDateStr   = formatDateKey(BEFORE_MIDNIGHT);  // '2026-07-19'
    const openChecksKey = `@sunrise_checks_${openDateStr}`;

    const storage = makeMemoryStorage();

    // BHT completes checks before midnight
    await saveJsonToStorage(storage, openChecksKey, {
      p1: { ...DEFAULT_CHECK, completed: true, mood: 8 },
      p2: { ...DEFAULT_CHECK, completed: true, mood: 6, uaCollected: true },
    });

    // Clock passes midnight
    const { rolled, newDateStr } = checkDateRollover(openDateStr, AFTER_MIDNIGHT);
    expect(rolled).toBe(true);
    expect(newDateStr).toBe('2026-07-20');

    // MARContext: checksKey = makeChecksKey(today) — now new day's key
    const newChecksKey = `@sunrise_checks_${newDateStr}`;

    // Load effect: guard reset + prune + load
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_checks_', currentKey: newChecksKey },
    ]);

    expect(storage.store[openChecksKey]).toBeUndefined();  // yesterday's checks pruned

    const { checks, loaded } = await loadChecksState(storage, newChecksKey, DEFAULT_CHECKS);
    const checksLoadedKeyRef = newChecksKey;

    expect(loaded).toBe(true);
    expect(checks['p1']?.completed).toBe(false);   // new day — needs check-in
    expect(checks['p2']?.completed).toBe(false);
    expect(checks['p2']?.uaCollected).toBe(false); // yesterday's uaCollected=true absent

    // Guard open after load — any subsequent BHT check-in persists to new bucket
    expect(isPersistSafe(loaded, checksLoadedKeyRef, newChecksKey)).toBe(true);
  });

  it('multi-patient: all patients appear as needing check-in after rollover regardless of count', async () => {
    const oldChecksKey = makeChecksKey(BEFORE_MIDNIGHT);
    const newChecksKey = makeChecksKey(AFTER_MIDNIGHT);

    // Six patients were all completed yesterday
    const yesterdayData: Record<string, CheckEntry> = {
      p1: { ...DEFAULT_CHECK, completed: true, mood: 10 },
      p2: { ...DEFAULT_CHECK, completed: true, mood: 8 },
      p3: { ...DEFAULT_CHECK, completed: true, mood: 5 },
      p4: { ...DEFAULT_CHECK, completed: true, mood: 3 },
      p5: { ...DEFAULT_CHECK, completed: true, mood: 7 },
      p6: { ...DEFAULT_CHECK, completed: true, mood: 9, uaCollected: true },
    };

    const defaultChecks: Record<string, CheckEntry> = {
      p1: { ...DEFAULT_CHECK }, p2: { ...DEFAULT_CHECK }, p3: { ...DEFAULT_CHECK },
      p4: { ...DEFAULT_CHECK }, p5: { ...DEFAULT_CHECK }, p6: { ...DEFAULT_CHECK },
    };

    const storage = makeMemoryStorage({
      [oldChecksKey]: JSON.stringify(yesterdayData),
    });

    // Rollover: prune + load
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_checks_', currentKey: newChecksKey },
    ]);

    const { checks, loaded } = await loadChecksState(storage, newChecksKey, defaultChecks);

    expect(loaded).toBe(true);
    // All patients must show as needing check-in — none pre-completed
    for (const pid of ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']) {
      expect(checks[pid]?.completed).toBe(false);
      expect(checks[pid]?.uaCollected).toBe(false);
      expect(checks[pid]?.mood).toBe(5);  // default mood
    }
  });
});
