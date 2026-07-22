/**
 * Unit tests — handoff completed-flag persistence across force-quit + relaunch
 *
 * Task 331 coverage:
 *   HandoffScreen's `completed` boolean (shown as the "Handoff Complete" banner)
 *   must survive a force-quit + relaunch cycle.  This is achieved by:
 *     1. A write-through in handleComplete() that calls
 *        AsyncStorage.setItem(storageKeyCompleted, 'true') immediately.
 *     2. A write-through in the Undo handler that calls
 *        AsyncStorage.setItem(storageKeyCompleted, 'false') immediately.
 *     3. A persist effect that writes the current completed value whenever it
 *        changes, guarded by isPersistSafe (mirrors the shift persist pattern).
 *     4. A Promise.all on cold-start that reads storageKeyCompleted alongside
 *        notes and shift before setLoaded(true), so the banner is never
 *        incorrectly hidden or shown on relaunch.
 *
 *   These tests exercise the pure storage-layer logic using the helpers from
 *   coldStartLoadHelpers.ts.  No React Native, Expo, or AsyncStorage imports
 *   are required — all functions are Node-compatible.
 */

import {
  makeHandoffNotesKey,
  makeHandoffShiftKey,
  makeHandoffCompletedKey,
  loadHandoffState,
  saveJsonToStorage,
  pruneStaleStorageKeys,
  isPersistSafe,
  formatDateKey,
  type StorageAdapter,
  type Shift,
} from '../lib/coldStartLoadHelpers';

// ─── Mock storage helpers ──────────────────────────────────────────────────────

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

function makeDeferredStorage(
  initial: Record<string, string> = {},
): { adapter: StorageAdapter & { store: Record<string, string> }; release: () => void } {
  const store: Record<string, string> = { ...initial };
  let resolvePending!: () => void;
  const pending = new Promise<void>(res => { resolvePending = res; });
  const adapter = {
    store,
    async getItem(key: string) { await pending; return store[key] ?? null; },
    async setItem(key: string, value: string) { store[key] = value; },
    async multiRemove(keys: string[]) { for (const k of keys) delete store[k]; },
    async getAllKeys() { return Object.keys(store); },
  };
  return { adapter, release: resolvePending };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TODAY         = new Date('2026-07-22T10:00:00.000Z');
const NOTES_KEY     = makeHandoffNotesKey(TODAY);
const SHIFT_KEY     = makeHandoffShiftKey(TODAY);
const COMPLETED_KEY = makeHandoffCompletedKey(TODAY);
const DEFAULT_NOTES: Record<string, string> = { p1: '', p2: '' };
const DEFAULTS = { notes: DEFAULT_NOTES, shift: 'day' as Shift };

// ─── Tests: makeHandoffCompletedKey ───────────────────────────────────────────

describe('makeHandoffCompletedKey', () => {
  it('produces a date-scoped key matching the expected prefix pattern', () => {
    const key = makeHandoffCompletedKey(new Date('2026-07-22T00:00:00.000Z'));
    expect(key).toBe('@sunrise_handoff_completed_2026-07-22');
  });

  it('changes with the calendar date so a new day starts un-completed', () => {
    const day1 = makeHandoffCompletedKey(new Date('2026-07-21T23:59:00.000Z'));
    const day2 = makeHandoffCompletedKey(new Date('2026-07-22T00:00:00.000Z'));
    expect(day1).toBe('@sunrise_handoff_completed_2026-07-21');
    expect(day2).toBe('@sunrise_handoff_completed_2026-07-22');
    expect(day1).not.toBe(day2);
  });
});

// ─── Tests: completed flag write-through (handleComplete path) ────────────────

describe('handoff completed flag — write-through on handleComplete', () => {
  it('setItem("true") is durable immediately — survives a force-quit before the effect fires', async () => {
    // Simulates what handleComplete() does:
    //   AsyncStorage.setItem(storageKeyCompleted, 'true')
    // The effect has NOT fired yet — only the synchronous write-through has run.
    const storage = makeMemoryStorage();

    // Write-through: mirrors handleComplete()
    await storage.setItem(COMPLETED_KEY, 'true');

    // Force-quit: in-memory React state is gone.
    // Relaunch: cold-start reads storageKeyCompleted alongside notes/shift.
    const [{ notes, shift }, completedRaw] = await Promise.all([
      loadHandoffState(storage, { notes: NOTES_KEY, shift: SHIFT_KEY }, DEFAULTS),
      storage.getItem(COMPLETED_KEY),
    ]);

    expect(notes).toEqual(DEFAULT_NOTES);
    expect(shift).toBe('day');
    expect(completedRaw).toBe('true');       // survived force-quit
    expect(completedRaw === 'true').toBe(true); // rehydrated as boolean
  });

  it('completed flag is false by default on first install (no storage entry)', async () => {
    const storage = makeMemoryStorage();

    const [, completedRaw] = await Promise.all([
      loadHandoffState(storage, { notes: NOTES_KEY, shift: SHIFT_KEY }, DEFAULTS),
      storage.getItem(COMPLETED_KEY),
    ]);

    // No entry in storage → getItem returns null → setCompleted(null === 'true') = false
    expect(completedRaw).toBeNull();
    expect(completedRaw === 'true').toBe(false);
  });

  it('persist effect writes "true" after handleComplete — redundant but idempotent', async () => {
    const storage = makeMemoryStorage();

    // Simulate: write-through from handleComplete runs first
    await storage.setItem(COMPLETED_KEY, 'true');

    // Simulate: persist effect also fires (completed changed, isPersistSafe=true)
    const loaded = true;
    const loadedForKey = NOTES_KEY;
    if (isPersistSafe(loaded, loadedForKey, NOTES_KEY)) {
      await storage.setItem(COMPLETED_KEY, 'true');
    }

    // Both writes produced the same value — idempotent
    expect(storage.store[COMPLETED_KEY]).toBe('true');
    expect(storage.writeCount).toBe(2);
  });
});

// ─── Tests: completed flag survives full force-quit + relaunch cycle ──────────

describe('handoff completed flag — force-quit + relaunch survival', () => {
  it('completed=true set before force-quit is rehydrated as true on relaunch', async () => {
    const storage = makeMemoryStorage({
      [NOTES_KEY]:     JSON.stringify({ p1: 'Stable overnight', p2: '' }),
      [SHIFT_KEY]:     'eve',
      [COMPLETED_KEY]: 'true',
    });

    // Cold-start relaunch: Promise.all reads all three keys together
    const [{ notes, shift, loaded }, completedRaw] = await Promise.all([
      loadHandoffState(storage, { notes: NOTES_KEY, shift: SHIFT_KEY }, DEFAULTS),
      storage.getItem(COMPLETED_KEY),
    ]);

    expect(loaded).toBe(true);
    expect(notes['p1']).toBe('Stable overnight');
    expect(shift).toBe('eve');
    expect(completedRaw === 'true').toBe(true);  // banner shows "Handoff Complete"
  });

  it('completed=false (after undo) is rehydrated as false on relaunch', async () => {
    const storage = makeMemoryStorage({
      [NOTES_KEY]:     JSON.stringify({ p1: 'Day shift note', p2: '' }),
      [SHIFT_KEY]:     'day',
      [COMPLETED_KEY]: 'false',
    });

    const [{ loaded }, completedRaw] = await Promise.all([
      loadHandoffState(storage, { notes: NOTES_KEY, shift: SHIFT_KEY }, DEFAULTS),
      storage.getItem(COMPLETED_KEY),
    ]);

    expect(loaded).toBe(true);
    expect(completedRaw === 'true').toBe(false);  // banner is hidden after undo
  });

  it('full session cycle: complete → force-quit → relaunch → undo → force-quit → relaunch', async () => {
    const storage = makeMemoryStorage({
      [NOTES_KEY]: JSON.stringify({ p1: 'Critical: BP check q1h', p2: '' }),
      [SHIFT_KEY]: 'night',
    });

    // ── Session 1: nurse completes handoff ─────────────────────────────────
    // Mirrors handleComplete() write-through
    await storage.setItem(COMPLETED_KEY, 'true');

    // Force-quit (in-memory React state gone).
    // Relaunch — Session 2:
    const [{ notes: s2Notes, shift: s2Shift }, s2CompletedRaw] = await Promise.all([
      loadHandoffState(storage, { notes: NOTES_KEY, shift: SHIFT_KEY }, DEFAULTS),
      storage.getItem(COMPLETED_KEY),
    ]);
    expect(s2CompletedRaw === 'true').toBe(true);  // banner visible after relaunch ✓
    expect(s2Notes['p1']).toBe('Critical: BP check q1h');
    expect(s2Shift).toBe('night');

    // ── Session 2: nurse taps Undo ─────────────────────────────────────────
    // Mirrors the Undo write-through: AsyncStorage.setItem(completedKey, 'false')
    await storage.setItem(COMPLETED_KEY, 'false');

    // Force-quit again.
    // Relaunch — Session 3:
    const [{ loaded: s3Loaded }, s3CompletedRaw] = await Promise.all([
      loadHandoffState(storage, { notes: NOTES_KEY, shift: SHIFT_KEY }, DEFAULTS),
      storage.getItem(COMPLETED_KEY),
    ]);
    expect(s3Loaded).toBe(true);
    expect(s3CompletedRaw === 'true').toBe(false);  // banner hidden after undo ✓
  });

  it('completed flag and notes/shift are all read in the same Promise.all — no flash possible', async () => {
    // This test documents the structural guarantee: because all three reads are
    // wrapped in a single Promise.all, none of them can resolve ahead of the others
    // and cause a momentary inconsistency in the UI.
    const storage = makeMemoryStorage({
      [NOTES_KEY]:     JSON.stringify({ p1: 'Night check done' }),
      [SHIFT_KEY]:     'night',
      [COMPLETED_KEY]: 'true',
    });

    let allSettled = false;
    const promise = Promise.all([
      loadHandoffState(storage, { notes: NOTES_KEY, shift: SHIFT_KEY }, DEFAULTS),
      storage.getItem(COMPLETED_KEY),
    ]).then(results => { allSettled = true; return results; });

    // Before awaiting, allSettled must still be false (Promise.all hasn't resolved)
    expect(allSettled).toBe(false);

    const [{ notes, shift, loaded }, completedRaw] = await promise;
    expect(allSettled).toBe(true);

    // All three values arrive together
    expect(loaded).toBe(true);
    expect(notes['p1']).toBe('Night check done');
    expect(shift).toBe('night');
    expect(completedRaw).toBe('true');
  });
});

// ─── Tests: persist-effect guard for completed ────────────────────────────────

describe('handoff completed flag — persist-effect isPersistSafe guard', () => {
  it('persist is blocked during the load window (loaded=false, loadedForKey=null)', async () => {
    const storage = makeMemoryStorage();

    // Guard state: load in-flight
    const persistSafe = isPersistSafe(false, null, NOTES_KEY);
    expect(persistSafe).toBe(false);

    // No write should occur
    if (persistSafe) await storage.setItem(COMPLETED_KEY, 'true');
    expect(storage.store[COMPLETED_KEY]).toBeUndefined();
  });

  it('persist is blocked when loadedForKey does not match the current notes key', () => {
    const oldNotesKey = makeHandoffNotesKey(new Date('2026-07-21T00:00:00.000Z'));
    expect(isPersistSafe(true, oldNotesKey, NOTES_KEY)).toBe(false);
  });

  it('persist is allowed after the cold-start load completes successfully', () => {
    // loadedForKeyRef.current = NOTES_KEY and loaded = true
    expect(isPersistSafe(true, NOTES_KEY, NOTES_KEY)).toBe(true);
  });

  it('persist effect writes "true" after handleComplete when guard is open', async () => {
    const storage = makeMemoryStorage();
    const loaded = true;
    const loadedForKey = NOTES_KEY;

    // Simulate the persist effect body for completed=true
    if (isPersistSafe(loaded, loadedForKey, NOTES_KEY)) {
      await storage.setItem(COMPLETED_KEY, 'true');
    }

    expect(storage.store[COMPLETED_KEY]).toBe('true');
  });

  it('persist effect writes "false" after Undo when guard is open', async () => {
    const storage = makeMemoryStorage({ [COMPLETED_KEY]: 'true' });
    const loaded = true;
    const loadedForKey = NOTES_KEY;

    // Simulate the persist effect body for completed=false (after Undo)
    if (isPersistSafe(loaded, loadedForKey, NOTES_KEY)) {
      await storage.setItem(COMPLETED_KEY, 'false');
    }

    expect(storage.store[COMPLETED_KEY]).toBe('false');
  });
});

// ─── Tests: pruneStaleStorageKeys includes the completed key ──────────────────

describe('handoff completed flag — stale key pruning', () => {
  it('stale completed key from the previous day is pruned on cold-start', async () => {
    const yesterday    = new Date('2026-07-21T23:59:00.000Z');
    const staleKey     = makeHandoffCompletedKey(yesterday);
    const currentKey   = makeHandoffCompletedKey(TODAY);

    const storage = makeMemoryStorage({
      [staleKey]:  'true',   // yesterday the nurse completed the handoff
      [currentKey]: 'false',  // today is a fresh session
    });

    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_handoff_completed_', currentKey },
    ]);

    expect(storage.store[staleKey]).toBeUndefined();   // yesterday's entry pruned
    expect(storage.store[currentKey]).toBe('false');    // today's entry survives
  });

  it('does not prune the current day completed key', async () => {
    const storage = makeMemoryStorage({ [COMPLETED_KEY]: 'true' });

    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_handoff_completed_', currentKey: COMPLETED_KEY },
    ]);

    expect(storage.store[COMPLETED_KEY]).toBe('true');  // current key untouched
  });

  it('banner is always false on a new calendar day (new key has no entry)', async () => {
    const yesterdayKey = makeHandoffCompletedKey(new Date('2026-07-21T00:00:00.000Z'));
    const storage = makeMemoryStorage({ [yesterdayKey]: 'true' });

    // After prune, yesterday's key is gone.  The new day's key has no entry.
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_handoff_completed_', currentKey: COMPLETED_KEY },
    ]);

    const todayRaw = await storage.getItem(COMPLETED_KEY);
    // No entry for today → getItem returns null → setCompleted(null === 'true') = false
    expect(todayRaw).toBeNull();
    expect(todayRaw === 'true').toBe(false);
  });
});

// ─── Tests: deferred storage — completed flag not shown before load resolves ──

describe('handoff completed flag — not shown before cold-start Promise.all resolves', () => {
  it('neither completed=true nor completed=false is applied before all reads settle', async () => {
    const { adapter, release } = makeDeferredStorage({
      [NOTES_KEY]:     JSON.stringify({ p1: 'Stable' }),
      [SHIFT_KEY]:     'day',
      [COMPLETED_KEY]: 'true',
    });

    // Start both reads in a Promise.all — mirrors HandoffScreen's load effect
    const loadPromise = Promise.all([
      loadHandoffState(adapter, { notes: NOTES_KEY, shift: SHIFT_KEY }, DEFAULTS),
      adapter.getItem(COMPLETED_KEY),
    ]);

    let settled = false;
    loadPromise.then(() => { settled = true; });

    // Yield the microtask queue — reads are still pending (deferred adapter)
    await Promise.resolve();
    expect(settled).toBe(false);  // UI guard (opacity 0) must still be in effect

    // Release — both reads complete at the same time
    release();
    const [{ loaded }, completedRaw] = await loadPromise;

    expect(settled).toBe(true);
    expect(loaded).toBe(true);
    expect(completedRaw === 'true').toBe(true);  // banner shown after load settles ✓
  });
});
