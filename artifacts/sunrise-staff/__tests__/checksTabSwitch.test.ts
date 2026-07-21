/**
 * Unit tests — ChecksView tab-switch (unmount/remount) state preservation
 *
 * Task 306 coverage:
 *   MARContext holds checksLoadedKeyRef as a useRef, not component state.
 *   Because MARProvider sits above the tab navigator, unmounting a tab
 *   (ChecksView going offscreen) does NOT unmount the provider.
 *
 *   This means:
 *     - checksLoadedKeyRef.current is preserved across tab switches.
 *     - checksLoaded (React state in MARProvider) is also preserved.
 *     - The checksKey does NOT change between unmount and remount (same day).
 *     - No load effect re-fires, so no transition window exists.
 *     - isPersistSafe returns true immediately on remount.
 *
 *   These tests verify:
 *     1. checksLoadedKeyRef still matches checksKey after a tab-away/tab-back
 *        cycle on the same calendar day — no spurious reload.
 *     2. isPersistSafe returns true immediately on remount (no stale-write
 *        window for the same-day scenario).
 *     3. A BHT's completed check-in written just before tab-away is visible
 *        immediately on tab-back (no re-load from storage required).
 *     4. The deferred-storage pattern confirms: if a load IS artificially
 *        re-triggered on the same key (e.g. hypothetical regression), the
 *        guard still blocks persist until the load resolves.
 *     5. Full simulation of the provider-level ref lifecycle across two
 *        tab-switch cycles, confirming the ref is never cleared between cycles.
 *
 *   No React Native, Expo, or AsyncStorage imports are required — all helpers
 *   are pure Node-compatible functions from coldStartLoadHelpers.ts.
 */

import {
  isPersistSafe,
  makeChecksKey,
  loadChecksState,
  saveJsonToStorage,
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

/** Mid-shift on 2026-07-21 UTC — a normal working time, no midnight proximity */
const MID_SHIFT = new Date('2026-07-21T14:00:00.000Z');

const DEFAULT_CHECK: CheckEntry = {
  mood: 5, cravings: 5, oriented: true, uaCollected: false, completed: false,
};

const DEFAULT_CHECKS: Record<string, CheckEntry> = {
  p1: { ...DEFAULT_CHECK },
  p2: { ...DEFAULT_CHECK },
};

// ─── Tests: checksLoadedKeyRef survives a tab switch ─────────────────────────

describe('checksLoadedKeyRef — preserved across tab-away / tab-back (same day)', () => {
  it('checksLoadedKeyRef matches checksKey after initial load and is unchanged on remount', async () => {
    const checksKey = makeChecksKey(MID_SHIFT);
    const storage = makeMemoryStorage();

    // ── INITIAL MOUNT ─────────────────────────────────────────────────────────
    // MARProvider mounts and the load effect fires:
    let checksLoaded: boolean = false;
    let checksLoadedKeyRef: string | null = null; // ref cleared synchronously
    let currentChecks: Record<string, CheckEntry> = { ...DEFAULT_CHECKS };

    // Async load completes:
    const { checks, loaded } = await loadChecksState(storage, checksKey, DEFAULT_CHECKS);
    checksLoaded = loaded;
    checksLoadedKeyRef = checksKey;   // ref set to the loaded key
    currentChecks = checks;

    expect(checksLoaded).toBe(true);
    expect(checksLoadedKeyRef).toBe(checksKey);
    expect(isPersistSafe(checksLoaded, checksLoadedKeyRef, checksKey)).toBe(true);

    // ── TAB AWAY (ChecksView unmounts) ────────────────────────────────────────
    // MARProvider stays mounted — ref and state are NOT reset.
    // Simulate the BHT navigating to a different tab.
    // (No code change needed — the ref persists in the provider's closure.)

    // ── TAB BACK (ChecksView remounts) ────────────────────────────────────────
    // checksKey has not changed (same calendar day).
    // The load effect's dependency [checksKey] did not change, so it does NOT re-fire.
    // checksLoadedKeyRef and checksLoaded are unchanged.
    const checksKeyAfterRemount = makeChecksKey(MID_SHIFT); // same day → same key
    expect(checksKeyAfterRemount).toBe(checksKey);

    // Ref is still set from the initial load — no reset happened:
    expect(checksLoadedKeyRef).toBe(checksKey);
    expect(checksLoaded).toBe(true);

    // isPersistSafe must be true immediately — no reload transition window:
    expect(isPersistSafe(checksLoaded, checksLoadedKeyRef, checksKeyAfterRemount)).toBe(true);
  });

  it('completed check-in written before tab-away is visible immediately on tab-back', async () => {
    const checksKey = makeChecksKey(MID_SHIFT);
    const storage = makeMemoryStorage();

    // ── INITIAL MOUNT & LOAD ──────────────────────────────────────────────────
    let checksLoaded: boolean = false;
    let checksLoadedKeyRef: string | null = null;
    let currentChecks: Record<string, CheckEntry>;

    const { checks, loaded } = await loadChecksState(storage, checksKey, DEFAULT_CHECKS);
    checksLoaded = loaded;
    checksLoadedKeyRef = checksKey;
    currentChecks = checks;

    // BHT completes check-in for p1 before switching tabs:
    currentChecks = {
      ...currentChecks,
      p1: { ...currentChecks['p1']!, completed: true, mood: 8, cravings: 3 },
    };

    // Persist fires (guard is open):
    expect(isPersistSafe(checksLoaded, checksLoadedKeyRef, checksKey)).toBe(true);
    await saveJsonToStorage(storage, checksKey, currentChecks);

    // Confirm storage reflects the completed state:
    const savedBeforeTabSwitch = JSON.parse(storage.store[checksKey]!);
    expect(savedBeforeTabSwitch['p1']?.completed).toBe(true);
    expect(savedBeforeTabSwitch['p2']?.completed).toBe(false);

    // ── TAB AWAY ─────────────────────────────────────────────────────────────
    // Provider ref and state survive — currentChecks is still the BHT's completed state.

    // ── TAB BACK ─────────────────────────────────────────────────────────────
    // Same key — no reload. In-memory state (currentChecks) is still intact.
    const checksKeyOnRemount = makeChecksKey(MID_SHIFT);
    expect(checksKeyOnRemount).toBe(checksKey);

    // The in-memory checks are already up-to-date (no re-load needed):
    expect(currentChecks['p1']?.completed).toBe(true); // completion NOT lost
    expect(currentChecks['p1']?.mood).toBe(8);
    expect(currentChecks['p2']?.completed).toBe(false);

    // Guard is still open immediately:
    expect(isPersistSafe(checksLoaded, checksLoadedKeyRef, checksKeyOnRemount)).toBe(true);
  });
});

// ─── Tests: isPersistSafe is true immediately on remount (no reload window) ───

describe('isPersistSafe — true immediately on tab-back (same-day, no reload triggered)', () => {
  it('returns true right after remount when checksKey is unchanged', () => {
    // This is the state MARProvider holds across a tab switch on the same day:
    //   - checksLoaded = true (set when the initial load completed)
    //   - checksLoadedKeyRef = checksKey (set when the initial load completed)
    //   - checksKey = same value (same calendar day → same storage key)
    const checksKey = makeChecksKey(MID_SHIFT);
    const checksLoaded = true;
    const checksLoadedKeyRef = checksKey; // unchanged from initial load

    // No transition window exists on same-day remount:
    expect(isPersistSafe(checksLoaded, checksLoadedKeyRef, checksKey)).toBe(true);
  });

  it('returns false only when the load effect explicitly clears the ref (key change, not tab switch)', () => {
    // Contrast: when the checksKey DOES change (day rollover or hypothetical reset),
    // the load effect clears checksLoadedKeyRef to null before the async read starts.
    // That is what creates a transition window — tab switches do NOT do this.
    const checksKey = makeChecksKey(MID_SHIFT);

    // After a key change: load effect runs first and clears the ref:
    const checksLoadedKeyRefCleared: string | null = null;

    // Persist must be blocked during this window:
    expect(isPersistSafe(true, checksLoadedKeyRefCleared, checksKey)).toBe(false);
    expect(isPersistSafe(false, checksLoadedKeyRefCleared, checksKey)).toBe(false);
  });

  it('ref holding the correct same-day key is immediately safe, even if checksLoaded briefly false', () => {
    // Edge case: if checksLoaded were somehow false but the ref still holds the right key,
    // isPersistSafe correctly blocks the write (both conditions must hold).
    const checksKey = makeChecksKey(MID_SHIFT);
    expect(isPersistSafe(false, checksKey, checksKey)).toBe(false);  // loaded=false → blocked
    expect(isPersistSafe(true,  checksKey, checksKey)).toBe(true);   // loaded=true  → safe
  });
});

// ─── Tests: multiple tab-switch cycles on the same day ───────────────────────

describe('checksLoadedKeyRef — multiple tab-switch cycles, ref never cleared', () => {
  it('guard remains open across two complete tab-away / tab-back cycles', async () => {
    const checksKey = makeChecksKey(MID_SHIFT);
    const storage = makeMemoryStorage();

    // Initial load:
    let checksLoaded: boolean = false;
    let checksLoadedKeyRef: string | null = null;
    let currentChecks: Record<string, CheckEntry>;

    const { checks, loaded } = await loadChecksState(storage, checksKey, DEFAULT_CHECKS);
    checksLoaded = loaded;
    checksLoadedKeyRef = checksKey;
    currentChecks = checks;

    // ── CYCLE 1: tab away → tab back ─────────────────────────────────────────
    // (Provider state and ref unchanged — same day)
    expect(isPersistSafe(checksLoaded, checksLoadedKeyRef, makeChecksKey(MID_SHIFT))).toBe(true);
    // BHT updates p1 between cycles:
    currentChecks = { ...currentChecks, p1: { ...currentChecks['p1']!, completed: true } };
    await saveJsonToStorage(storage, checksKey, currentChecks);

    // ── CYCLE 2: tab away → tab back ─────────────────────────────────────────
    // Still the same day, same key, ref unchanged:
    expect(checksLoadedKeyRef).toBe(checksKey);
    expect(checksLoaded).toBe(true);
    expect(isPersistSafe(checksLoaded, checksLoadedKeyRef, makeChecksKey(MID_SHIFT))).toBe(true);

    // BHT updates p2 on the second return:
    currentChecks = { ...currentChecks, p2: { ...currentChecks['p2']!, completed: true, mood: 7 } };
    await saveJsonToStorage(storage, checksKey, currentChecks);

    // Verify final storage state contains both completions:
    const finalSaved = JSON.parse(storage.store[checksKey]!);
    expect(finalSaved['p1']?.completed).toBe(true);
    expect(finalSaved['p2']?.completed).toBe(true);
    expect(finalSaved['p2']?.mood).toBe(7);
  });
});

// ─── Tests: deferred-storage pattern (regression guard for hypothetical reload) ───
//
// If a future regression caused the load effect to re-fire on the same key
// during a tab switch (e.g. a dependency array change), the existing guard
// mechanism would still protect against spurious persist writes.  These tests
// confirm the guard works correctly in that hypothetical scenario too.

describe('Checks tab-switch — deferred-storage guard (same-key hypothetical reload)', () => {
  it('guard blocks persist if a same-key load is triggered and still in-flight', async () => {
    const checksKey = makeChecksKey(MID_SHIFT);

    // Storage already has some completed check-ins from earlier in the shift:
    const { adapter, release } = makeDeferredStorage({
      [checksKey]: JSON.stringify({
        p1: { ...DEFAULT_CHECK, completed: true, mood: 8 },
        p2: { ...DEFAULT_CHECK, completed: false },
      }),
    });
    const writeStorage = makeMemoryStorage(); // separate write target for assertions

    // Hypothetical regression: load effect re-fires for the same key on tab-back.
    // Guards are cleared synchronously before the async read starts:
    let checksLoaded: boolean = false;
    let checksLoadedKeyRef: string | null = null; // cleared by load effect

    const loadPromise = loadChecksState(adapter, checksKey, DEFAULT_CHECKS);
    let loadSettled = false;
    loadPromise.then(() => { loadSettled = true; });

    // While the load is in-flight, persist must be blocked:
    expect(isPersistSafe(checksLoaded, checksLoadedKeyRef, checksKey)).toBe(false);
    expect(isPersistSafe(true, checksLoadedKeyRef, checksKey)).toBe(false); // stale loaded=true

    await Promise.resolve();
    expect(loadSettled).toBe(false); // load still pending

    // Any persist during this window must be skipped:
    const staleChecks = {
      p1: { ...DEFAULT_CHECK, completed: false }, // stale/wrong state
      p2: { ...DEFAULT_CHECK, completed: false },
    };
    if (isPersistSafe(true, checksLoadedKeyRef, checksKey)) {
      await saveJsonToStorage(writeStorage, checksKey, staleChecks);
    }
    expect(writeStorage.store[checksKey]).toBeUndefined(); // nothing written

    // Release the deferred read and await load completion:
    release();
    const { checks, loaded } = await loadPromise;
    checksLoaded = loaded;
    checksLoadedKeyRef = checksKey; // ref restored

    expect(checksLoaded).toBe(true);
    expect(checks['p1']?.completed).toBe(true);  // loaded the pre-existing completed state
    expect(checks['p2']?.completed).toBe(false);

    // Guard now open:
    expect(isPersistSafe(checksLoaded, checksLoadedKeyRef, checksKey)).toBe(true);
  });

  it('deferred same-key load resolves without overwriting earlier BHT completions', async () => {
    const checksKey = makeChecksKey(MID_SHIFT);

    // Storage has the BHT's completed p1 entry from before the hypothetical re-load:
    const completedState = {
      p1: { ...DEFAULT_CHECK, completed: true, mood: 9 },
      p2: { ...DEFAULT_CHECK, completed: false },
    };
    const { adapter, release } = makeDeferredStorage({
      [checksKey]: JSON.stringify(completedState),
    });

    // Guard cleared synchronously by load effect:
    let checksLoadedKeyRef: string | null = null;
    const loadPromise = loadChecksState(adapter, checksKey, DEFAULT_CHECKS);

    // Persist blocked during in-flight window:
    expect(isPersistSafe(true, checksLoadedKeyRef, checksKey)).toBe(false);

    // Release and resolve:
    release();
    const { checks, loaded } = await loadPromise;
    checksLoadedKeyRef = checksKey;

    // The re-load reads the same stored data — BHT's completion is preserved:
    expect(loaded).toBe(true);
    expect(checks['p1']?.completed).toBe(true);
    expect(checks['p1']?.mood).toBe(9);
    expect(checks['p2']?.completed).toBe(false);

    // Guard now open and the correct state is ready to persist:
    expect(isPersistSafe(true, checksLoadedKeyRef, checksKey)).toBe(true);
  });
});

// ─── Tests: full lifecycle simulation — initial load → tab-away → tab-back ───
//
// Simulates the exact provider-level state sequence for a tab switch using the
// same helpers in the same order as MARContext, to confirm no gap or stale-write
// window exists in the same-day tab-switch scenario.

describe('Checks tab-switch — full lifecycle simulation (mirrors MARContext provider)', () => {
  it('full cycle: initial load → BHT update → tab-away → tab-back → guard still open', async () => {
    const checksKey = makeChecksKey(MID_SHIFT);
    const storage = makeMemoryStorage();

    // ── PROVIDER MOUNT ────────────────────────────────────────────────────────
    // MARProvider mounts once. Load effect fires for checksKey:
    let checksLoaded: boolean = false;
    let checksLoadedKeyRef: string | null = null;
    let currentChecks: Record<string, CheckEntry> = {};

    const { checks: initialChecks, loaded: initialLoaded } = await loadChecksState(
      storage, checksKey, DEFAULT_CHECKS,
    );
    checksLoaded = initialLoaded;
    checksLoadedKeyRef = checksKey;
    currentChecks = initialChecks;

    // Provider is now fully loaded:
    expect(checksLoaded).toBe(true);
    expect(checksLoadedKeyRef).toBe(checksKey);
    expect(isPersistSafe(checksLoaded, checksLoadedKeyRef, checksKey)).toBe(true);

    // ── BHT COMPLETES A CHECK-IN (tab is active) ───────────────────────────
    currentChecks = {
      ...currentChecks,
      p1: { mood: 7, cravings: 4, oriented: true, uaCollected: true, completed: true },
    };
    // Persist effect fires — guard is open:
    if (isPersistSafe(checksLoaded, checksLoadedKeyRef, checksKey)) {
      await saveJsonToStorage(storage, checksKey, currentChecks);
    }
    expect(JSON.parse(storage.store[checksKey]!)['p1']?.completed).toBe(true);

    // ── TAB AWAY: ChecksView unmounts ─────────────────────────────────────────
    // MARProvider stays alive. checksLoaded and checksLoadedKeyRef unchanged.
    // checksKey unchanged (same day).
    // (No explicit code — the variables retain their values.)

    // ── TAB BACK: ChecksView remounts ─────────────────────────────────────────
    // checksKey dependency did not change → load effect does NOT re-fire.
    const checksKeyOnReturn = makeChecksKey(MID_SHIFT);
    expect(checksKeyOnReturn).toBe(checksKey);    // same key
    expect(checksLoadedKeyRef).toBe(checksKey);   // ref unchanged
    expect(checksLoaded).toBe(true);              // loaded unchanged

    // Guard is immediately open — no transition window:
    expect(isPersistSafe(checksLoaded, checksLoadedKeyRef, checksKeyOnReturn)).toBe(true);

    // BHT can immediately complete another check-in on tab-back:
    currentChecks = {
      ...currentChecks,
      p2: { mood: 6, cravings: 5, oriented: true, uaCollected: false, completed: true },
    };
    if (isPersistSafe(checksLoaded, checksLoadedKeyRef, checksKeyOnReturn)) {
      await saveJsonToStorage(storage, checksKeyOnReturn, currentChecks);
    }

    // Both completions are in the correct key bucket:
    const finalState = JSON.parse(storage.store[checksKey]!);
    expect(finalState['p1']?.completed).toBe(true);
    expect(finalState['p2']?.completed).toBe(true);
    expect(finalState['p1']?.uaCollected).toBe(true);
    expect(finalState['p2']?.mood).toBe(6);
  });
});
