/**
 * Unit tests — handoff midnight-rollover isPersistSafe guard
 *
 * Task 301 coverage:
 *   handoff.tsx has two persist effects (notes and shift) both guarded by
 *   isPersistSafe(loaded, loadedForKeyRef.current, storageKeyNotes).
 *   The load effect resets both `loaded` (via setLoaded(false)) and
 *   `loadedForKeyRef.current` (to null) BEFORE the async read starts, so
 *   persist effects that fire during the transition window return early and
 *   cannot write yesterday's in-memory state into today's empty bucket.
 *
 *   These tests verify:
 *     1. isPersistSafe returns false during the transition window (loaded reset,
 *        loadedForKey cleared) — no persist can fire.
 *     2. A simulated persist call using the new day's key plus stale notes
 *        cannot write to storage because the guard blocks it.
 *     3. After the fresh load for the new key completes, loadedForKey matches
 *        the new key and isPersistSafe returns true — persists are now safe.
 *     4. The new day's bucket contains only the freshly-loaded notes (not
 *        yesterday's in-memory state) after the full rollover cycle.
 *     5. The full effect-ordering sequence mirrors what React would actually
 *        execute for the load → (guard) → persist ordering in handoff.tsx.
 *
 *   No React Native, Expo, or AsyncStorage imports are required — all helpers
 *   are pure Node-compatible functions from coldStartLoadHelpers.ts.
 */

import {
  isPersistSafe,
  makeHandoffNotesKey,
  makeHandoffShiftKey,
  loadHandoffState,
  saveJsonToStorage,
  pruneStaleStorageKeys,
  formatDateKey,
  checkDateRollover,
  type StorageAdapter,
  type Shift,
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

const DEFAULT_NOTES: Record<string, string> = { p1: '', p2: '' };

// ─── Tests: isPersistSafe — handoff-specific guard behaviour ─────────────────

describe('isPersistSafe — handoff persist gate during midnight rollover', () => {
  it('returns false when loaded is false and loadedForKey is null (transition start)', () => {
    // This is the state immediately after the load effect fires for the new key:
    // setLoaded(false) and loadedForKeyRef.current = null have both run.
    const newNotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(false, null, newNotesKey)).toBe(false);
  });

  it('returns false when loaded is still true from the previous render but loadedForKey was cleared', () => {
    // Critical race: React's effect ordering means the persist effect may see
    // `loaded === true` (captured from the last completed render) while the
    // load effect has already cleared loadedForKeyRef to null for the new key.
    // isPersistSafe must block the write in this case.
    const newNotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(true, null, newNotesKey)).toBe(false);
  });

  it('returns false when loadedForKey still holds the old (yesterday) key', () => {
    // If loadedForKey was not cleared before the async read started, the old
    // value (yesterday's key) would be present during the rollover window.
    // isPersistSafe must block writes to the new key in this case too.
    const oldNotesKey = makeHandoffNotesKey(BEFORE_MIDNIGHT);
    const newNotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(true, oldNotesKey, newNotesKey)).toBe(false);
  });

  it('returns true only after the fresh load completes and loadedForKey matches the new key', () => {
    // This is the normal state after loadHandoffState resolves for the new key:
    //   loadedForKeyRef.current = storageKeyNotes (the new key)
    //   setLoaded(true) has fired
    const newNotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    expect(isPersistSafe(true, newNotesKey, newNotesKey)).toBe(true);
  });

  it('shift persist also uses the notes key — returns false until notes key matches', () => {
    // handoff.tsx guards BOTH the notes persist and the shift persist with
    // isPersistSafe(..., storageKeyNotes).  This test confirms that even if
    // only the shift changed, the guard still blocks using the notes key.
    const oldNotesKey = makeHandoffNotesKey(BEFORE_MIDNIGHT);
    const newNotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);

    // Guard state during transition: loadedForKey still holds yesterday's notes key
    expect(isPersistSafe(true, oldNotesKey, newNotesKey)).toBe(false);

    // Guard state after fresh load completes
    expect(isPersistSafe(true, newNotesKey, newNotesKey)).toBe(true);
  });
});

// ─── Tests: no persist fires before fresh load completes ─────────────────────

describe('handoff rollover — persist effect cannot fire before fresh load completes', () => {
  it('guard blocks a notes persist during the transition window', async () => {
    const oldNotesKey = makeHandoffNotesKey(BEFORE_MIDNIGHT);
    const newNotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);

    // Storage starts with yesterday's notes
    const storage = makeMemoryStorage({
      [oldNotesKey]: JSON.stringify({ p1: 'Night shift note', p2: '' }),
    });

    // Simulate the state at the start of the rollover render:
    //   loaded = true   (from previous day's successful load — not yet reset)
    //   loadedForKey = oldNotesKey  (from the previous load completion)
    let loaded: boolean = true;
    let loadedForKey: string | null = oldNotesKey;
    const currentNotesKey = newNotesKey; // storageKeyNotes has already changed

    // Load effect fires first and resets both guards synchronously:
    loaded = false;
    loadedForKey = null;

    // Persist effect fires next (React effect ordering):
    // Even though the last render had loaded=true, loadedForKey is now null.
    // The persist must be blocked.
    const staleNotes = { p1: 'Night shift note', p2: '' }; // yesterday's in-memory state

    const wouldPersist = isPersistSafe(
      /* loaded captured from render: still true in the persist closure */ true,
      loadedForKey,    // null — cleared by the load effect before this runs
      currentNotesKey,
    );
    expect(wouldPersist).toBe(false);

    // Confirm: simulating what the persist body does when guarded correctly —
    // the new key bucket must remain empty.
    if (wouldPersist) {
      await saveJsonToStorage(storage, currentNotesKey, staleNotes);
    }
    expect(storage.store[newNotesKey]).toBeUndefined();
  });

  it('guard blocks a shift persist during the transition window', async () => {
    const oldNotesKey = makeHandoffNotesKey(BEFORE_MIDNIGHT);
    const newNotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const newShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);

    const storage = makeMemoryStorage();

    // Load effect has run: both guards cleared
    const loadedForKey: string | null = null;

    // Shift persist effect fires (guarded by the notes key, as in handoff.tsx)
    const wouldPersist = isPersistSafe(true, loadedForKey, newNotesKey);
    expect(wouldPersist).toBe(false);

    if (wouldPersist) {
      await storage.setItem(newShiftKey, 'night'); // stale yesterday shift
    }
    // No write must have occurred
    expect(storage.store[newShiftKey]).toBeUndefined();
  });

  it('deferred load: persist cannot fire while storage read is in-flight', async () => {
    const oldNotesKey = makeHandoffNotesKey(BEFORE_MIDNIGHT);
    const newNotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const newShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);

    const { adapter, release } = makeDeferredStorage();
    const storage = makeMemoryStorage(); // separate writable storage for persist assertions

    // Simulate the in-flight load — the loadPromise has NOT resolved yet
    const loadPromise = loadHandoffState(
      adapter,
      { notes: newNotesKey, shift: newShiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    let loadSettled = false;
    loadPromise.then(() => { loadSettled = true; });

    // Before the load resolves: guard state is (loaded=false, loadedForKey=null)
    // Persist effects must be blocked
    let loadedForKey: string | null = null;
    expect(isPersistSafe(false, loadedForKey, newNotesKey)).toBe(false);
    expect(isPersistSafe(true,  loadedForKey, newNotesKey)).toBe(false); // even with stale loaded=true

    // Yield the event loop — load still pending
    await Promise.resolve();
    expect(loadSettled).toBe(false);

    // Any "persist" during this window would be blocked:
    const staleNotes = { p1: 'Stale note from yesterday', p2: '' };
    if (isPersistSafe(true, loadedForKey, newNotesKey)) {
      await saveJsonToStorage(storage, newNotesKey, staleNotes);
    }
    expect(storage.store[newNotesKey]).toBeUndefined(); // nothing written

    // Now release the storage read and await the load
    release();
    const { notes, shift, loaded } = await loadPromise;
    loadedForKey = newNotesKey; // mirrors: loadedForKeyRef.current = storageKeyNotes

    expect(loaded).toBe(true);
    expect(notes).toEqual(DEFAULT_NOTES);
    expect(shift).toBe('day');

    // After load: guard is now open for the new key
    expect(isPersistSafe(true, loadedForKey, newNotesKey)).toBe(true);
  });
});

// ─── Tests: new day's bucket contains only freshly-loaded notes ───────────────

describe('handoff rollover — new day bucket contains only freshly-loaded notes', () => {
  it('full rollover cycle: new bucket is empty before any nurse edit', async () => {
    const oldNotesKey = makeHandoffNotesKey(BEFORE_MIDNIGHT);
    const newNotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const oldShiftKey = makeHandoffShiftKey(BEFORE_MIDNIGHT);
    const newShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);

    // Storage state at rollover: yesterday's data is present
    const storage = makeMemoryStorage({
      [oldNotesKey]: JSON.stringify({ p1: 'Night shift: vitals q2h', p2: 'Restless overnight' }),
      [oldShiftKey]: 'night',
    });

    // Step 1: Load effect fires — guard cleared synchronously
    let loaded: boolean = false;
    let loadedForKey: string | null = null;

    // Step 2: prune stale keys (as handoff.tsx does before loadHandoffState)
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_handoff_notes_', currentKey: newNotesKey },
      { prefix: '@sunrise_handoff_shift_', currentKey: newShiftKey },
    ]);

    // Yesterday's entries gone
    expect(storage.store[oldNotesKey]).toBeUndefined();
    expect(storage.store[oldShiftKey]).toBeUndefined();

    // Step 3: async load from new key
    const { notes, shift, loaded: loadResult } = await loadHandoffState(
      storage,
      { notes: newNotesKey, shift: newShiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );
    loaded = loadResult;
    loadedForKey = newNotesKey;

    expect(loaded).toBe(true);
    expect(notes).toEqual(DEFAULT_NOTES);  // fresh slate — no yesterday's notes
    expect(shift).toBe('day');             // default shift for the new day

    // Step 4: guard is now open — a persist call would write the clean state
    expect(isPersistSafe(loaded, loadedForKey, newNotesKey)).toBe(true);

    // Simulating the notes persist effect writing the freshly-loaded notes:
    await saveJsonToStorage(storage, newNotesKey, notes);

    // New bucket contains only the fresh state (empty notes), not yesterday's
    const written = JSON.parse(storage.store[newNotesKey]!);
    expect(written).toEqual(DEFAULT_NOTES);
    expect(written['p1']).toBe('');  // yesterday's 'Night shift: vitals q2h' is absent
  });

  it('nurse edits after rollover are persisted to the new bucket only', async () => {
    const newNotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const newShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);

    // Fresh storage — no previous day data
    const storage = makeMemoryStorage();

    // Load completes for the new key
    const { notes, shift, loaded } = await loadHandoffState(
      storage,
      { notes: newNotesKey, shift: newShiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );
    const loadedForKey: string | null = newNotesKey;

    expect(loaded).toBe(true);

    // Guard now open; nurse edits a note
    const updatedNotes = { ...notes, p1: 'Morning check: stable, resting' };

    expect(isPersistSafe(loaded, loadedForKey, newNotesKey)).toBe(true);
    await saveJsonToStorage(storage, newNotesKey, updatedNotes);

    // Verify the edit landed in the NEW key bucket
    const saved = JSON.parse(storage.store[newNotesKey]!);
    expect(saved['p1']).toBe('Morning check: stable, resting');
    expect(saved['p2']).toBe('');

    // The old key bucket does not exist (nothing bled back)
    const oldNotesKey = makeHandoffNotesKey(BEFORE_MIDNIGHT);
    expect(storage.store[oldNotesKey]).toBeUndefined();
  });

  it('yesterday\'s notes are not visible when loading the new day\'s bucket', async () => {
    const oldNotesKey = makeHandoffNotesKey(BEFORE_MIDNIGHT);
    const newNotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const oldShiftKey = makeHandoffShiftKey(BEFORE_MIDNIGHT);
    const newShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);

    // Storage has yesterday's data; today's keys don't exist yet
    const storage = makeMemoryStorage({
      [oldNotesKey]: JSON.stringify({ p1: 'Critical: BP elevated', p2: 'Discharge pending' }),
      [oldShiftKey]: 'eve',
    });

    const { notes, shift, loaded } = await loadHandoffState(
      storage,
      { notes: newNotesKey, shift: newShiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    expect(loaded).toBe(true);
    // New load reads from newNotesKey (which has no data) → defaults returned
    expect(notes['p1']).toBe('');            // yesterday's 'Critical: BP elevated' absent
    expect(notes['p2']).toBe('');            // yesterday's 'Discharge pending' absent
    expect(shift).toBe('day');               // not yesterday's 'eve'
  });
});

// ─── Tests: full effect-ordering sequence mirroring handoff.tsx ───────────────
//
// Reproduces the exact sequence of operations that React performs during a
// midnight rollover in HandoffScreen, using the same helpers in the same order.
// The goal is to prove that no stale write can reach the new day's bucket
// regardless of whether persist effects fire before or after the load settles.

describe('handoff rollover — full effect-ordering simulation (mirrors handoff.tsx)', () => {
  it('rollover sequence: load effect clears guards → persist blocked → load resolves → persist safe', async () => {
    const oldNotesKey = makeHandoffNotesKey(BEFORE_MIDNIGHT);
    const newNotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const oldShiftKey = makeHandoffShiftKey(BEFORE_MIDNIGHT);
    const newShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);

    const storage = makeMemoryStorage({
      [oldNotesKey]: JSON.stringify({ p1: 'Eve shift note', p2: '' }),
      [oldShiftKey]: 'eve',
    });

    // ── RENDER N (before midnight) ─────────────────────────────────────────
    // The previous render completed successfully:
    let handoffLoaded: boolean = true;
    let loadedForKey: string | null = oldNotesKey;
    // In-memory state from yesterday's render:
    let currentNotes: Record<string, string> = { p1: 'Eve shift note', p2: '' };
    let currentShift: Shift = 'eve';

    // ── RENDER N+1 (midnight rollover fires) ───────────────────────────────
    // today state changes to AFTER_MIDNIGHT; storageKeyNotes = newNotesKey.

    // LOAD EFFECT fires first (synchronous guard resets before async read):
    handoffLoaded = false;      // setLoaded(false)
    loadedForKey = null;        // loadedForKeyRef.current = null

    // PERSIST EFFECTS fire next with values from the last render:
    // (React effects run in declaration order; persist effects see the closure
    // values from the render that scheduled them, but loadedForKey was cleared
    // synchronously by the load effect above.)

    // Notes persist:
    const notesPersistSafe = isPersistSafe(
      /* loaded from last render */ true,
      loadedForKey,    // null — cleared above
      newNotesKey,
    );
    expect(notesPersistSafe).toBe(false);  // ✓ blocked — stale write prevented
    if (notesPersistSafe) {
      await saveJsonToStorage(storage, newNotesKey, currentNotes);
    }

    // Shift persist:
    const shiftPersistSafe = isPersistSafe(
      /* loaded from last render */ true,
      loadedForKey,    // null — cleared above
      newNotesKey,     // handoff.tsx uses the notes key for both persist guards
    );
    expect(shiftPersistSafe).toBe(false);  // ✓ blocked — stale write prevented
    if (shiftPersistSafe) {
      await storage.setItem(newShiftKey, currentShift);
    }

    // New day bucket must still be empty — no stale writes occurred
    expect(storage.store[newNotesKey]).toBeUndefined();
    expect(storage.store[newShiftKey]).toBeUndefined();

    // ASYNC LOAD for newNotesKey completes:
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_handoff_notes_', currentKey: newNotesKey },
      { prefix: '@sunrise_handoff_shift_', currentKey: newShiftKey },
    ]);

    const { notes: freshNotes, shift: freshShift, loaded: freshLoaded } = await loadHandoffState(
      storage,
      { notes: newNotesKey, shift: newShiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    // State updates from the successful load:
    currentNotes   = freshNotes;
    currentShift   = freshShift;
    handoffLoaded  = freshLoaded;
    loadedForKey   = newNotesKey;  // loadedForKeyRef.current = storageKeyNotes

    expect(handoffLoaded).toBe(true);
    expect(currentNotes).toEqual(DEFAULT_NOTES);  // clean slate
    expect(currentShift).toBe('day');             // default

    // PERSIST EFFECTS RE-RUN after state update — now safe:
    const notesPersistSafeAfterLoad = isPersistSafe(handoffLoaded, loadedForKey, newNotesKey);
    expect(notesPersistSafeAfterLoad).toBe(true);  // ✓ safe now

    // Simulate the persist writing the freshly-loaded clean state:
    await saveJsonToStorage(storage, newNotesKey, currentNotes);

    // New bucket must contain only the freshly-loaded notes (empty strings)
    const written = JSON.parse(storage.store[newNotesKey]!);
    expect(written['p1']).toBe('');     // eve shift note did NOT bleed in
    expect(written['p2']).toBe('');
  });

  it('live rollover via checkDateRollover: foreground after midnight → clean handoff slate', async () => {
    // Simulates the midnight timer in handoff.tsx firing setToday(new Date()),
    // which re-derives storageKeyNotes from the new date, triggering the load
    // effect to reset the guards and re-load from the new key.

    const openDateStr  = formatDateKey(BEFORE_MIDNIGHT);  // '2026-07-19'
    const openNotesKey = `@sunrise_handoff_notes_${openDateStr}`;
    const openShiftKey = `@sunrise_handoff_shift_${openDateStr}`;

    const storage = makeMemoryStorage();

    // Nurse adds a note before midnight
    await saveJsonToStorage(storage, openNotesKey, { p1: 'Last round 23:45 — all stable' });
    await storage.setItem(openShiftKey, 'night');

    // Clock passes midnight
    const { rolled, newDateStr } = checkDateRollover(openDateStr, AFTER_MIDNIGHT);
    expect(rolled).toBe(true);
    expect(newDateStr).toBe('2026-07-20');

    // handoff.tsx: storageKeyNotes = makeHandoffNotesKey(today) — now new day's key
    const newNotesKey = `@sunrise_handoff_notes_${newDateStr}`;
    const newShiftKey = `@sunrise_handoff_shift_${newDateStr}`;

    // Load effect: guard reset + prune + load
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_handoff_notes_', currentKey: newNotesKey },
      { prefix: '@sunrise_handoff_shift_', currentKey: newShiftKey },
    ]);

    expect(storage.store[openNotesKey]).toBeUndefined();  // yesterday's note pruned

    const { notes, shift, loaded } = await loadHandoffState(
      storage,
      { notes: newNotesKey, shift: newShiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );
    const loadedForKey = newNotesKey;

    expect(loaded).toBe(true);
    expect(notes['p1']).toBe('');    // '2026-07-19' note not visible on '2026-07-20'
    expect(shift).toBe('day');      // new shift default

    // Guard open after load — any subsequent nurse edit persists to new bucket
    expect(isPersistSafe(loaded, loadedForKey, newNotesKey)).toBe(true);
  });
});
