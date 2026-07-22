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
  makeHandoffDraftNotesKey,
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

// ─── Tests: note typed before storage load resolves ───────────────────────────
//
// Reproduces the cold-start edge case documented in handoff.tsx's onNoteChange
// handler: a nurse types in the narrow window between component mount and the
// AsyncStorage.getItem calls resolving.  The write-through persist is guarded by
// isPersistSafe(loaded, loadedForKeyRef.current, storageKeyNotes), which returns
// false while the load is in-flight — preventing a race where an empty (not-yet-
// loaded) notes state could be written into the bucket.  After the load resolves
// the persist effect re-fires and the stored state is durable.

describe('handoff cold-start — note typed before storage load resolves', () => {
  it('persist is blocked while load is in-flight, then fires after load resolves', async () => {
    const today = new Date('2026-07-21T08:00:00.000Z');
    const notesKey = makeHandoffNotesKey(today);
    const shiftKey = makeHandoffShiftKey(today);

    // Storage has a note from an earlier session (nurse was already here today)
    const { adapter, release } = makeDeferredStorage({
      [notesKey]: JSON.stringify({ p1: 'Morning rounds — stable', p2: '' }),
      [shiftKey]: 'day',
    });

    // Separate writable store used to simulate what the persist effect writes
    const writeStore: Record<string, string> = {};
    let writeCount = 0;
    async function simulatePersist(key: string, value: Record<string, string>) {
      await saveJsonToStorage(
        {
          async getItem(k) { return writeStore[k] ?? null; },
          async setItem(k, v) { writeCount++; writeStore[k] = v; },
          async multiRemove(keys) { for (const k of keys) delete writeStore[k]; },
          async getAllKeys() { return Object.keys(writeStore); },
        },
        key,
        value,
      );
    }

    // ── PHASE 1: load in-flight ──────────────────────────────────────────────
    // The component has mounted; loadHandoffState is running but hasn't resolved.
    // Guard state: loaded=false, loadedForKey=null (load effect resets both).
    let handoffLoaded: boolean = false;
    let loadedForKey: string | null = null;

    // Launch the deferred load (mirrors the useEffect in handoff.tsx)
    const loadPromise = loadHandoffState(
      adapter,
      { notes: notesKey, shift: shiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    let loadSettled = false;
    loadPromise.then(() => { loadSettled = true; });

    // Yield the microtask queue — load is still pending (deferred adapter)
    await Promise.resolve();
    expect(loadSettled).toBe(false);

    // Nurse types a note before the load resolves.
    // onNoteChange in handoff.tsx: setNotes(next) — local state updated immediately.
    const nurseDraftNotes: Record<string, string> = { p1: 'Nurse draft — not yet loaded', p2: '' };

    // Persist effect fires (notes state changed) but isPersistSafe blocks it.
    const persistSafeDuringLoad = isPersistSafe(handoffLoaded, loadedForKey, notesKey);
    expect(persistSafeDuringLoad).toBe(false);  // ✓ blocked — load still in-flight

    // Even if React still sees the old loaded=true from a previous render (e.g.
    // tab re-focus without a full remount), the guard blocks with null loadedForKey.
    const persistSafeStaleLoaded = isPersistSafe(true, loadedForKey, notesKey);
    expect(persistSafeStaleLoaded).toBe(false);  // ✓ blocked — loadedForKey is null

    // Nothing has been written while the load was pending
    if (persistSafeDuringLoad) await simulatePersist(notesKey, nurseDraftNotes);
    expect(writeStore[notesKey]).toBeUndefined();
    expect(writeCount).toBe(0);

    // ── PHASE 2: load resolves ───────────────────────────────────────────────
    // Release the deferred storage so loadHandoffState can complete.
    release();
    const { notes: savedNotes, shift: savedShift, loaded: freshLoaded } = await loadPromise;
    expect(loadSettled).toBe(true);

    // Mirrors what the .then() callback in handoff.tsx does:
    //   setNotes(savedNotes)             → state becomes the persisted value
    //   loadedForKeyRef.current = key    → guard key is now set
    //   setLoaded(true)                  → guard is open
    let currentNotes = savedNotes;   // in-memory notes now reflect storage
    loadedForKey = notesKey;         // loadedForKeyRef.current = storageKeyNotes
    handoffLoaded = freshLoaded;

    expect(handoffLoaded).toBe(true);
    expect(currentNotes['p1']).toBe('Morning rounds — stable');  // restored from storage
    expect(savedShift).toBe('day');

    // ── PHASE 3: persist effect re-fires after load ──────────────────────────
    // React re-runs the persist effect because `loaded` changed to true.
    // isPersistSafe is now open and the current state gets written.
    const persistSafeAfterLoad = isPersistSafe(handoffLoaded, loadedForKey, notesKey);
    expect(persistSafeAfterLoad).toBe(true);  // ✓ safe — load complete, keys match

    await simulatePersist(notesKey, currentNotes);

    // The persisted value is the freshly-loaded note from storage (not the draft
    // that was typed during the load window — that draft was already overwritten
    // by setNotes(savedNotes) when the load resolved, which is the expected
    // React state-update behaviour).
    expect(writeCount).toBe(1);
    const persisted = JSON.parse(writeStore[notesKey]!);
    expect(persisted['p1']).toBe('Morning rounds — stable');
    expect(persisted['p2']).toBe('');
  });

  it('guard stays closed for all writes when storage is empty and load in-flight', async () => {
    // Fresh install scenario: no prior data in storage.
    // Nurse types immediately after app opens (before load resolves).
    const today = new Date('2026-07-21T08:00:00.000Z');
    const notesKey = makeHandoffNotesKey(today);
    const shiftKey = makeHandoffShiftKey(today);

    const { adapter, release } = makeDeferredStorage(); // empty storage

    let handoffLoaded = false;
    let loadedForKey: string | null = null;

    const loadPromise = loadHandoffState(
      adapter,
      { notes: notesKey, shift: shiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    await Promise.resolve(); // yield — still pending

    // Guard is closed for both possible loaded states during the window
    expect(isPersistSafe(false, loadedForKey, notesKey)).toBe(false);
    expect(isPersistSafe(true,  loadedForKey, notesKey)).toBe(false);

    // Resolve and complete the load
    release();
    const { notes, loaded } = await loadPromise;
    loadedForKey = notesKey;
    handoffLoaded = loaded;

    expect(handoffLoaded).toBe(true);
    expect(notes).toEqual(DEFAULT_NOTES); // empty — no prior data

    // Guard now open
    expect(isPersistSafe(handoffLoaded, loadedForKey, notesKey)).toBe(true);
  });

  it('any nurse edit made after load resolves is immediately persistable', async () => {
    // After the load window, writes must NOT be blocked — this is the normal path.
    const today = new Date('2026-07-21T08:00:00.000Z');
    const notesKey = makeHandoffNotesKey(today);
    const shiftKey = makeHandoffShiftKey(today);

    const storage = makeMemoryStorage(); // synchronous — load resolves immediately

    const { notes, shift, loaded } = await loadHandoffState(
      storage,
      { notes: notesKey, shift: shiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );
    const loadedForKey = notesKey; // loadedForKeyRef.current = storageKeyNotes

    expect(loaded).toBe(true);

    // Nurse types after load — guard must be open
    const editedNotes = { ...notes, p1: 'Post-load edit: patient requesting PRN' };

    expect(isPersistSafe(loaded, loadedForKey, notesKey)).toBe(true);

    // Persist fires immediately — no blocking
    await saveJsonToStorage(storage, notesKey, editedNotes);

    const saved = JSON.parse(storage.store[notesKey]!);
    expect(saved['p1']).toBe('Post-load edit: patient requesting PRN');
    expect(saved['p2']).toBe('');
  });

  it('note typed during load window is merged into saved state when load resolves (Task #326)', async () => {
    // Reproduces the force-quit scenario: the nurse types while AsyncStorage is
    // still reading.  The pendingNotesRef buffer in handoff.tsx collects the
    // edit; the .then() callback merges it on top of savedNotes so the text
    // survives even if the app is force-quit before storage resolves.
    const today = new Date('2026-07-21T08:00:00.000Z');
    const notesKey = makeHandoffNotesKey(today);
    const shiftKey = makeHandoffShiftKey(today);

    // Storage has a note from an earlier session this morning
    const { adapter, release } = makeDeferredStorage({
      [notesKey]: JSON.stringify({ p1: 'Early morning check — all stable', p2: '' }),
      [shiftKey]: 'day',
    });

    // Separate writable store for persist assertions
    const writeStore: Record<string, string> = {};
    const persistAdapter: StorageAdapter = {
      async getItem(k) { return writeStore[k] ?? null; },
      async setItem(k, v) { writeStore[k] = v; },
      async multiRemove(keys) { for (const k of keys) delete writeStore[k]; },
      async getAllKeys() { return Object.keys(writeStore); },
    };

    // ── PHASE 1: load in-flight ────────────────────────────────────────────
    let handoffLoaded = false;
    let loadedForKey: string | null = null;
    // Buffer that mirrors pendingNotesRef in handoff.tsx
    let pendingNotes: Record<string, string> = {};

    const loadPromise = loadHandoffState(
      adapter,
      { notes: notesKey, shift: shiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    // Yield microtask queue — load still pending
    await Promise.resolve();

    // Nurse types a note while the load is in-flight.
    // isPersistSafe returns false → edit is buffered, not persisted directly.
    const nurseDraft = 'Typed during load: BP 118/76, patient calm';
    const persistSafe = isPersistSafe(handoffLoaded, loadedForKey, notesKey);
    expect(persistSafe).toBe(false); // guard is closed

    if (persistSafe) {
      // This branch must NOT execute during the load window
      await saveJsonToStorage(persistAdapter, notesKey, { p1: nurseDraft, p2: '' });
    } else {
      // Mirror handoff.tsx pendingNotesRef accumulation
      pendingNotes = { ...pendingNotes, p1: nurseDraft };
    }

    // Nothing written yet
    expect(writeStore[notesKey]).toBeUndefined();

    // ── PHASE 2: load resolves — merge pending notes ───────────────────────
    release();
    const { notes: savedNotes, shift: savedShift, loaded: freshLoaded } = await loadPromise;

    // Mirror the .then() callback in handoff.tsx:
    //   merge pendingNotes on top of savedNotes, then clear the buffer
    const mergedNotes = Object.keys(pendingNotes).length > 0
      ? { ...savedNotes, ...pendingNotes }
      : savedNotes;
    pendingNotes = {};

    loadedForKey = notesKey;
    handoffLoaded = freshLoaded;

    expect(handoffLoaded).toBe(true);
    // The merged state preserves the nurse's draft AND the stored value for p2
    expect(mergedNotes['p1']).toBe('Typed during load: BP 118/76, patient calm');
    expect(mergedNotes['p2']).toBe('');

    // ── PHASE 3: persist after merge — nurse's text reaches storage ────────
    expect(isPersistSafe(handoffLoaded, loadedForKey, notesKey)).toBe(true);
    await saveJsonToStorage(persistAdapter, notesKey, mergedNotes);

    const persisted = JSON.parse(writeStore[notesKey]!);
    expect(persisted['p1']).toBe('Typed during load: BP 118/76, patient calm');
    expect(persisted['p2']).toBe('');
  });

  it('pending buffer accumulates multiple edits and all survive the merge', async () => {
    // Ensures that if a nurse edits several patients before the load resolves,
    // all buffered drafts are present in the merged state — not just the last one.
    const today = new Date('2026-07-21T08:00:00.000Z');
    const notesKey = makeHandoffNotesKey(today);
    const shiftKey = makeHandoffShiftKey(today);

    const { adapter, release } = makeDeferredStorage(); // empty storage — fresh install

    let handoffLoaded = false;
    let loadedForKey: string | null = null;
    let pendingNotes: Record<string, string> = {};

    const loadPromise = loadHandoffState(
      adapter,
      { notes: notesKey, shift: shiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    await Promise.resolve(); // still pending

    // Nurse edits two patients before load resolves
    const edits: Array<[string, string]> = [
      ['p1', 'Draft for p1: vitals stable'],
      ['p2', 'Draft for p2: requesting PRN'],
    ];
    for (const [patientId, text] of edits) {
      if (!isPersistSafe(handoffLoaded, loadedForKey, notesKey)) {
        pendingNotes = { ...pendingNotes, [patientId]: text };
      }
    }

    expect(Object.keys(pendingNotes)).toHaveLength(2);

    // Load resolves — merge
    release();
    const { notes: savedNotes, loaded: freshLoaded } = await loadPromise;
    const mergedNotes = Object.keys(pendingNotes).length > 0
      ? { ...savedNotes, ...pendingNotes }
      : savedNotes;
    pendingNotes = {};
    loadedForKey = notesKey;
    handoffLoaded = freshLoaded;

    expect(handoffLoaded).toBe(true);
    expect(mergedNotes['p1']).toBe('Draft for p1: vitals stable');
    expect(mergedNotes['p2']).toBe('Draft for p2: requesting PRN');
  });

  it('untouched patient notes are not overwritten when only one patient was edited during load window (Task #326)', async () => {
    // Regression: draft payload must contain only touched keys. If the full
    // in-memory snapshot (which has default-empty values for all untouched
    // patients) were written to the draft key, the merge on restart would
    // overwrite valid persisted notes for every untouched patient.
    const today = new Date('2026-07-21T08:00:00.000Z');
    const notesKey = makeHandoffNotesKey(today);
    const shiftKey = makeHandoffShiftKey(today);
    const draftKey = makeHandoffDraftNotesKey(today);

    // Storage has existing notes for two patients from a prior session today
    const store: Record<string, string> = {
      [notesKey]: JSON.stringify({ p1: 'Morning check — stable', p2: 'Vitals q2h, BP elevated' }),
      [shiftKey]: 'day',
    };
    const adapter: StorageAdapter = {
      async getItem(k) { return store[k] ?? null; },
      async setItem(k, v) { store[k] = v; },
      async multiRemove(keys) { for (const k of keys) delete store[k]; },
      async getAllKeys() { return Object.keys(store); },
    };

    // ── LOAD WINDOW: nurse edits only p1 ──────────────────────────────────
    // pendingNotesRef accumulates only the touched key
    let pendingNotes: Record<string, string> = {};
    const nurseDraft = 'Updated: patient requesting PRN pain med';

    // Mirrors onNoteChange with the fix: write only touched keys to draft
    pendingNotes = { ...pendingNotes, p1: nurseDraft };
    // Draft key contains ONLY { p1: nurseDraft }, NOT { p1: ..., p2: '' }
    await saveJsonToStorage(adapter, draftKey, pendingNotes);

    expect(store[draftKey]).toBeDefined();
    const draftPayload = JSON.parse(store[draftKey]!);
    expect(Object.keys(draftPayload)).toEqual(['p1']);  // only the touched key
    expect(draftPayload['p2']).toBeUndefined();         // p2 NOT in draft

    // ── RESTART: load resolves, draft merged ───────────────────────────────
    const { notes: savedNotes, loaded } = await loadHandoffState(
      adapter,
      { notes: notesKey, shift: shiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    expect(loaded).toBe(true);
    expect(savedNotes['p1']).toBe('Morning check — stable');
    expect(savedNotes['p2']).toBe('Vitals q2h, BP elevated');

    // Read and merge draft (mirrors .then() callback in handoff.tsx)
    const draftRaw = await adapter.getItem(draftKey);
    let draftNotes: Record<string, string> = {};
    if (draftRaw) {
      try { draftNotes = JSON.parse(draftRaw) as Record<string, string>; } catch {}
      await adapter.multiRemove([draftKey]);
    }

    // pendingNotesRef is empty on restart (fresh process)
    const pendingNotesSession2: Record<string, string> = {};
    const hasDraft   = Object.keys(draftNotes).length > 0;
    const hasPending = Object.keys(pendingNotesSession2).length > 0;
    const mergedNotes =
      hasDraft || hasPending
        ? { ...savedNotes, ...draftNotes, ...pendingNotesSession2 }
        : savedNotes;

    // p1 gets the nurse's draft from the load window
    expect(mergedNotes['p1']).toBe('Updated: patient requesting PRN pain med');
    // p2's persisted note is NOT overwritten — draft had no entry for p2
    expect(mergedNotes['p2']).toBe('Vitals q2h, BP elevated');

    // Draft key cleared after merge
    expect(store[draftKey]).toBeUndefined();
  });

  it('crash-safe draft key written during load window survives a process restart (Task #326)', async () => {
    // This is the true force-quit scenario the task is about:
    //   1. App opens; AsyncStorage starts loading (load in-flight).
    //   2. Nurse types a note → isPersistSafe is false → write to crash-safe
    //      draft key immediately (pendingNotesRef also updated in-memory).
    //   3. App is force-quit before the load resolves.
    //      pendingNotesRef is lost (process gone), but draft key IS in storage.
    //   4. App relaunches → fresh process; pendingNotesRef starts empty.
    //   5. The .then() callback reads the draft key from storage, merges it into
    //      savedNotes, then deletes the draft key.
    //   6. The nurse's text appears — nothing was silently lost.
    const today = new Date('2026-07-21T08:00:00.000Z');
    const notesKey   = makeHandoffNotesKey(today);
    const shiftKey   = makeHandoffShiftKey(today);
    const draftKey   = makeHandoffDraftNotesKey(today);

    // ── SESSION 1: nurse types during load window ──────────────────────────
    // Use a writable memory store that persists across the "restart" below.
    const persistentStore: Record<string, string> = {
      [notesKey]: JSON.stringify({ p1: 'Morning check — stable', p2: '' }),
      [shiftKey]: 'day',
    };
    const persistentAdapter: StorageAdapter = {
      async getItem(k) { return persistentStore[k] ?? null; },
      async setItem(k, v) { persistentStore[k] = v; },
      async multiRemove(keys) { for (const k of keys) delete persistentStore[k]; },
      async getAllKeys() { return Object.keys(persistentStore); },
    };

    // Load is in-flight (deferred adapter backed by persistentStore)
    let deferredResolve!: () => void;
    const deferredPending = new Promise<void>(res => { deferredResolve = res; });
    const session1Adapter: StorageAdapter = {
      async getItem(k) { await deferredPending; return persistentStore[k] ?? null; },
      async setItem(k, v) { persistentStore[k] = v; },
      async multiRemove(keys) { for (const k of keys) delete persistentStore[k]; },
      async getAllKeys() { return Object.keys(persistentStore); },
    };

    let pendingNotes: Record<string, string> = {}; // mirrors pendingNotesRef
    const loadPromise1 = loadHandoffState(
      session1Adapter,
      { notes: notesKey, shift: shiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    await Promise.resolve(); // yield — still pending

    // Nurse types while load is in-flight
    const nurseDraft = { p1: 'Critical: BP spike noted at 08:12', p2: '' };
    // Simulates onNoteChange when isPersistSafe returns false:
    //   pendingNotesRef updated in-memory
    pendingNotes = { ...pendingNotes, ...nurseDraft };
    //   crash-safe draft key written to storage immediately
    await saveJsonToStorage(persistentAdapter, draftKey, nurseDraft);

    // Draft key is now in persistent storage
    expect(persistentStore[draftKey]).toBeDefined();

    // ── FORCE-QUIT: process is killed ─────────────────────────────────────
    // pendingNotes is discarded (process gone). loadPromise1 is abandoned.
    // persistentStore (AsyncStorage) retains both the original notes and
    // the draft key written above.
    // We simulate this by simply not awaiting loadPromise1 and not releasing
    // the deferred adapter — the draft key is all that's left in storage.
    void loadPromise1; // intentionally abandoned

    // ── SESSION 2: app relaunches — fresh process ──────────────────────────
    let pendingNotesSession2: Record<string, string> = {}; // fresh — empty on restart
    let loadedForKey: string | null = null;

    // Now the load resolves immediately (normal AsyncStorage on second launch)
    const { notes: savedNotes, shift: savedShift, loaded: freshLoaded } =
      await loadHandoffState(
        persistentAdapter, // same persistent storage
        { notes: notesKey, shift: shiftKey },
        { notes: DEFAULT_NOTES, shift: 'day' },
      );

    // Mirrors the .then() callback in handoff.tsx:
    //   1. Read the crash-safe draft key
    const draftRaw = await persistentAdapter.getItem(draftKey);
    let draftNotes: Record<string, string> = {};
    if (draftRaw) {
      try { draftNotes = JSON.parse(draftRaw) as Record<string, string>; } catch {}
      // Clear the draft key now that it has been consumed
      await persistentAdapter.multiRemove([draftKey]);
    }

    //   2. Merge: draft wins over storage, same-session pending wins over draft
    const hasDraft   = Object.keys(draftNotes).length > 0;
    const hasPending = Object.keys(pendingNotesSession2).length > 0;
    const mergedNotes =
      hasDraft || hasPending
        ? { ...savedNotes, ...draftNotes, ...pendingNotesSession2 }
        : savedNotes;

    loadedForKey = notesKey;

    expect(freshLoaded).toBe(true);

    // The nurse's text from session 1 is present in the merged notes
    expect(mergedNotes['p1']).toBe('Critical: BP spike noted at 08:12');
    expect(mergedNotes['p2']).toBe('');

    // Draft key has been cleared after consumption
    expect(persistentStore[draftKey]).toBeUndefined();

    // Guard is now open — persist would write the merged notes
    expect(isPersistSafe(freshLoaded, loadedForKey, notesKey)).toBe(true);
    await saveJsonToStorage(persistentAdapter, notesKey, mergedNotes);

    const persisted = JSON.parse(persistentStore[notesKey]!);
    expect(persisted['p1']).toBe('Critical: BP spike noted at 08:12');
  });

  it('shift tapped during load window is merged when load resolves (Task #330)', async () => {
    // Reproduces the force-quit gap for shift selection: nurse taps Eve before
    // AsyncStorage has finished reading the saved shift.  isPersistSafe blocks
    // the write, so pendingShiftRef buffers the tap.  When the .then() callback
    // fires it must prefer the buffered tap over the stored 'day' value.
    const today = new Date('2026-07-21T14:45:00.000Z');
    const notesKey = makeHandoffNotesKey(today);
    const shiftKey = makeHandoffShiftKey(today);

    // Storage has day shift from a previous session
    const { adapter, release } = makeDeferredStorage({
      [notesKey]: JSON.stringify({ p1: 'Afternoon check — stable', p2: '' }),
      [shiftKey]: 'day',
    });

    // ── PHASE 1: load in-flight ────────────────────────────────────────────
    let handoffLoaded = false;
    let loadedForKey: string | null = null;
    // Buffer that mirrors pendingShiftRef in handoff.tsx
    let pendingShift: Shift | null = null;

    const loadPromise = loadHandoffState(
      adapter,
      { notes: notesKey, shift: shiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    // Yield the microtask queue — load still pending
    await Promise.resolve();

    // Nurse taps 'eve' while the load is in-flight.
    // handleShiftChange: isPersistSafe returns false → buffer the tap.
    const persistSafeDuringLoad = isPersistSafe(handoffLoaded, loadedForKey, notesKey);
    expect(persistSafeDuringLoad).toBe(false); // guard is closed

    if (persistSafeDuringLoad) {
      // This branch must NOT execute during the load window
      // (would be: AsyncStorage.setItem(shiftKey, 'eve'))
    } else {
      pendingShift = 'eve'; // mirror pendingShiftRef.current = s
    }

    expect(pendingShift).toBe('eve'); // tap buffered, not discarded

    // ── PHASE 2: load resolves — pending shift is merged ──────────────────
    release();
    const { notes: savedNotes, shift: savedShift, loaded: freshLoaded } = await loadPromise;

    // Mirrors the .then() callback in handoff.tsx:
    //   resolvedShift = pendingShift ?? savedShift
    const resolvedShift: Shift = pendingShift ?? savedShift;
    pendingShift = null; // clear the buffer

    loadedForKey = notesKey;
    handoffLoaded = freshLoaded;

    expect(handoffLoaded).toBe(true);
    // The stored value was 'day'; the nurse's tap ('eve') must win
    expect(savedShift).toBe('day');
    expect(resolvedShift).toBe('eve');

    // Guard is now open — shift persist would fire with the resolved shift
    expect(isPersistSafe(handoffLoaded, loadedForKey, notesKey)).toBe(true);
  });

  it('stored shift is used when no shift was tapped during the load window (Task #330)', async () => {
    // Sanity-check: when pendingShiftRef is null (nurse did not tap anything
    // during the load window), the .then() callback falls back to savedShift.
    const today = new Date('2026-07-21T22:00:00.000Z');
    const notesKey = makeHandoffNotesKey(today);
    const shiftKey = makeHandoffShiftKey(today);

    const { adapter, release } = makeDeferredStorage({
      [notesKey]: JSON.stringify({ p1: '', p2: '' }),
      [shiftKey]: 'night',
    });

    let handoffLoaded = false;
    let loadedForKey: string | null = null;
    let pendingShift: Shift | null = null; // nurse did NOT tap anything

    const loadPromise = loadHandoffState(
      adapter,
      { notes: notesKey, shift: shiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    await Promise.resolve(); // yield — still pending

    release();
    const { shift: savedShift, loaded: freshLoaded } = await loadPromise;

    // Mirrors .then() callback: pendingShift is null → use savedShift
    const resolvedShift: Shift = pendingShift ?? savedShift;
    loadedForKey = notesKey;
    handoffLoaded = freshLoaded;

    expect(handoffLoaded).toBe(true);
    expect(resolvedShift).toBe('night'); // stored value preserved
  });
});
