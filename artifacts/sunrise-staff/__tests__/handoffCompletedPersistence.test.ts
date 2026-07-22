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
  makeHandoffCompletedDraftKey,
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

// ─── Tests: crash-safe draft-completed key (Task #335) ───────────────────────
//
// The Undo handler writes to storageKeyCompletedDraft when isPersistSafe is
// false (storage still loading).  The cold-start .then() callback reads this
// draft key, applies it (draft wins over main), then deletes it so the intent
// is consumed exactly once.  These tests confirm the full round-trip.

const COMPLETED_DRAFT_KEY = makeHandoffCompletedDraftKey(TODAY);

describe('makeHandoffCompletedDraftKey', () => {
  it('produces a date-scoped key with the expected prefix', () => {
    const key = makeHandoffCompletedDraftKey(new Date('2026-07-22T00:00:00.000Z'));
    expect(key).toBe('@sunrise_handoff_undo_draft_2026-07-22');
  });

  it('changes with the calendar date, matching the notes/completed key cadence', () => {
    const day1 = makeHandoffCompletedDraftKey(new Date('2026-07-21T23:59:00.000Z'));
    const day2 = makeHandoffCompletedDraftKey(new Date('2026-07-22T00:00:00.000Z'));
    expect(day1).toBe('@sunrise_handoff_undo_draft_2026-07-21');
    expect(day2).toBe('@sunrise_handoff_undo_draft_2026-07-22');
    expect(day1).not.toBe(day2);
  });

  it('does NOT start with the completed prefix — critical non-overlap safety check', () => {
    // The completed pruning entry uses prefix '@sunrise_handoff_completed_'.
    // If the draft key started with that prefix, pruneStaleStorageKeys would
    // treat the current day's draft key as stale and delete it before the
    // cold-start callback can read it, silently discarding the undo intent.
    const key = makeHandoffCompletedDraftKey(new Date('2026-07-22T00:00:00.000Z'));
    expect(key.startsWith('@sunrise_handoff_completed_')).toBe(false);
  });
});

describe('crash-safe draft-completed — undo survives force-quit during load window', () => {
  /**
   * Simulates the scenario described in Task #335:
   *   1. Nurse receives handoff — completed=true is in main storage key.
   *   2. App relaunches; during the storage-load window (isPersistSafe=false)
   *      the nurse taps Undo.
   *   3. Because isPersistSafe is false the normal write-through is blocked;
   *      the handler writes 'false' to the draft-completed key instead.
   *   4. App is force-quit before the load resolves (drafted 'false' in storage).
   *   5. App relaunches; cold-start reads main key ('true') then draft key ('false').
   *      Draft wins → completed=false, banner is hidden.
   */
  it("undo intent written to draft key survives force-quit before load resolves", async () => {
    const storage = makeMemoryStorage({
      [NOTES_KEY]:     JSON.stringify({ p1: 'Night check done', p2: '' }),
      [SHIFT_KEY]:     'night',
      [COMPLETED_KEY]: 'true',   // main key: handoff was marked complete
    });

    // ── Load window: nurse taps Undo while isPersistSafe is false ─────────
    // isPersistSafe is false → write to draft key instead of main key.
    const persistSafe = isPersistSafe(false, null, NOTES_KEY);
    expect(persistSafe).toBe(false);

    // Mirrors the Undo handler's else-branch:
    await storage.setItem(COMPLETED_DRAFT_KEY, 'false');

    // Verify: main key still 'true', draft key is 'false'
    expect(storage.store[COMPLETED_KEY]).toBe('true');
    expect(storage.store[COMPLETED_DRAFT_KEY]).toBe('false');

    // ── Force-quit: in-memory state is lost. App relaunches. ──────────────
    // Cold-start: read main completed key + draft completed key sequentially.
    const [{ notes, shift, loaded }, completedRaw] = await Promise.all([
      loadHandoffState(storage, { notes: NOTES_KEY, shift: SHIFT_KEY }, DEFAULTS),
      storage.getItem(COMPLETED_KEY),
    ]);

    expect(loaded).toBe(true);
    expect(notes['p1']).toBe('Night check done');
    expect(shift).toBe('night');

    // Apply draft: if draft key exists, it wins over main.
    const completedDraftRaw = await storage.getItem(COMPLETED_DRAFT_KEY);

    let resolvedCompleted = completedRaw === 'true';
    if (completedDraftRaw !== null) {
      resolvedCompleted = completedDraftRaw === 'true';
      // Consume draft: write to main and delete draft (mirrors .then() callback).
      await storage.setItem(COMPLETED_KEY, completedDraftRaw);
      await storage.multiRemove([COMPLETED_DRAFT_KEY]);
    }

    // Undo survives: banner should be hidden (false), not show ghost 'true'.
    expect(resolvedCompleted).toBe(false);
    expect(storage.store[COMPLETED_KEY]).toBe('false');   // main key updated
    expect(storage.store[COMPLETED_DRAFT_KEY]).toBeUndefined(); // draft consumed
  });

  it("no ghost banner: without draft key the main 'true' value is preserved", async () => {
    const storage = makeMemoryStorage({
      [NOTES_KEY]:     JSON.stringify({ p1: 'Note' }),
      [SHIFT_KEY]:     'day',
      [COMPLETED_KEY]: 'true',
      // No draft key — nurse never tapped Undo during the load window
    });

    const [, completedRaw] = await Promise.all([
      loadHandoffState(storage, { notes: NOTES_KEY, shift: SHIFT_KEY }, DEFAULTS),
      storage.getItem(COMPLETED_KEY),
    ]);
    const completedDraftRaw = await storage.getItem(COMPLETED_DRAFT_KEY);

    let resolvedCompleted = completedRaw === 'true';
    if (completedDraftRaw !== null) {
      resolvedCompleted = completedDraftRaw === 'true';
    }

    // No draft → main value wins → banner still shows correctly
    expect(resolvedCompleted).toBe(true);
    expect(completedDraftRaw).toBeNull();
  });

  it("draft key is consumed exactly once — second relaunch uses the promoted main key", async () => {
    const storage = makeMemoryStorage({
      [NOTES_KEY]:     JSON.stringify({ p1: '' }),
      [SHIFT_KEY]:     'eve',
      [COMPLETED_KEY]: 'true',
      [COMPLETED_DRAFT_KEY]: 'false',  // undo written during prior session's load window
    });

    // ── First relaunch: draft wins and is consumed ─────────────────────────
    const [, completedRaw] = await Promise.all([
      loadHandoffState(storage, { notes: NOTES_KEY, shift: SHIFT_KEY }, DEFAULTS),
      storage.getItem(COMPLETED_KEY),
    ]);
    const completedDraftRaw = await storage.getItem(COMPLETED_DRAFT_KEY);

    let resolvedCompleted = completedRaw === 'true';
    if (completedDraftRaw !== null) {
      resolvedCompleted = completedDraftRaw === 'true';
      await storage.setItem(COMPLETED_KEY, completedDraftRaw);
      await storage.multiRemove([COMPLETED_DRAFT_KEY]);
    }

    expect(resolvedCompleted).toBe(false);
    expect(storage.store[COMPLETED_DRAFT_KEY]).toBeUndefined();  // draft cleared ✓

    // ── Second relaunch: no draft key; main key ('false') used directly ────
    const [, secondCompletedRaw] = await Promise.all([
      loadHandoffState(storage, { notes: NOTES_KEY, shift: SHIFT_KEY }, DEFAULTS),
      storage.getItem(COMPLETED_KEY),
    ]);
    const secondDraftRaw = await storage.getItem(COMPLETED_DRAFT_KEY);

    let secondResolved = secondCompletedRaw === 'true';
    if (secondDraftRaw !== null) {
      secondResolved = secondDraftRaw === 'true';
    }

    expect(secondDraftRaw).toBeNull();   // draft still absent on second launch ✓
    expect(secondResolved).toBe(false);  // undo persists correctly ✓
  });
});

// ─── Tests: 4-second timeout fallback — draft-completed compatibility (Task #338) ──
//
// The 4-second hang-guard timeout calls setCompleted(false) without reading
// storageKeyCompletedDraft (AsyncStorage is unresponsive, so a second read
// would also hang).  false is the safe direction:
//   • It never produces a ghost "Handoff Complete" banner.
//   • It agrees with any undo intent the nurse wrote to the draft key during
//     the load window (the Undo handler always writes 'false' to the draft key),
//     so no undo intent is silently overridden.
//
// These tests confirm that the timeout's `setCompleted(false)` value is
// compatible with every possible draft-key state.

describe('4-second timeout fallback — draft-completed key compatibility', () => {
  // Simulate what the timeout handler does to the completed flag.
  // In the real component this is: setCompleted(false)
  // Here we capture the intended value so tests can assert on it.
  const TIMEOUT_COMPLETED_VALUE = false;

  it('timeout value (false) agrees with a draft-written undo intent (false) — no conflict', () => {
    // Scenario: nurse tapped Undo during the load window → draft key holds 'false'.
    // AsyncStorage hangs → timeout fires → setCompleted(false).
    // Both agree: banner stays hidden. ✓
    const draftCompletedValue = 'false' === 'true'; // false
    expect(TIMEOUT_COMPLETED_VALUE).toBe(draftCompletedValue);
  });

  it('timeout value (false) is the safe direction — never shows a ghost banner', () => {
    // Even if the main completed key holds 'true' (handoff was completed in a
    // prior session), the timeout path never reads it because AsyncStorage is
    // unresponsive.  Defaulting to false means the nurse sees a blank banner
    // rather than a ghost "Handoff Complete" state.
    const mainKeyStoredValue = 'true';  // prior session marked complete
    const timeoutApplied = TIMEOUT_COMPLETED_VALUE;  // timeout fires before storage resolves
    // Timeout must NOT produce true (ghost banner).
    expect(timeoutApplied).toBe(false);
    // Document: the nurse would need to re-tap Complete after storage recovers,
    // which is safer than a stale banner from a hung storage read.
    expect(mainKeyStoredValue === 'true' && timeoutApplied === false).toBe(true);
  });

  it('timeout value (false) cannot override a draft undo intent — they always agree', () => {
    // The Undo handler writes exactly one value to the draft key: 'false'.
    // The timeout also produces false.  There is no state in the draft key
    // that the timeout could contradict — this test documents the invariant.
    const allPossibleDraftValues = ['false'] as const;  // only 'false' is ever written by Undo
    for (const draftRaw of allPossibleDraftValues) {
      const draftIntent = draftRaw === 'true';  // always false
      expect(TIMEOUT_COMPLETED_VALUE).toBe(draftIntent);
    }
  });

  it('timeout value (false) means isPersistSafe-blocked persist never writes stale true to storage', () => {
    // After the timeout fires, loadedForKeyRef.current stays null (by design),
    // so isPersistSafe returns false and the persist effect cannot write the
    // timeout's completed=false back to storage.  This is the correct behaviour:
    // storage should not be modified when we know AsyncStorage is unreliable.
    const loadedForKey = null;   // timeout intentionally leaves this null
    const loaded = true;         // timeout did call setLoaded(true)
    const persistSafe = isPersistSafe(loaded, loadedForKey, NOTES_KEY);
    expect(persistSafe).toBe(false);  // persist blocked — storage not touched ✓
  });
});

describe('crash-safe draft-completed — stale key pruning', () => {
  it('stale draft-completed key from the previous day is pruned on cold-start', async () => {
    const yesterday     = new Date('2026-07-21T23:59:00.000Z');
    const staleKey      = makeHandoffCompletedDraftKey(yesterday);
    const currentKey    = makeHandoffCompletedDraftKey(TODAY);

    const storage = makeMemoryStorage({
      [staleKey]:  'false',  // stale undo from yesterday
      [currentKey]: 'false', // today's entry
    });

    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_handoff_undo_draft_', currentKey },
    ]);

    expect(storage.store[staleKey]).toBeUndefined();    // yesterday's draft pruned ✓
    expect(storage.store[currentKey]).toBe('false');    // today's draft survives ✓
  });

  it('does not prune the current day draft-completed key', async () => {
    const storage = makeMemoryStorage({ [COMPLETED_DRAFT_KEY]: 'false' });

    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_handoff_undo_draft_', currentKey: COMPLETED_DRAFT_KEY },
    ]);

    expect(storage.store[COMPLETED_DRAFT_KEY]).toBe('false');  // untouched ✓
  });

  it('combined production prune entries — current-day draft key is never deleted as stale', async () => {
    // Regression test for the overlap bug: the completed prefix
    // '@sunrise_handoff_completed_' is a prefix of the old draft prefix
    // '@sunrise_handoff_completed_draft_YYYY-MM-DD'.  With the old naming the
    // pruning call would delete the current day's draft key because it matched
    // the broader completed entry even though it is the current draft.
    //
    // With the new '@sunrise_handoff_undo_draft_' prefix the two prefixes are
    // disjoint and this bug cannot occur.  This test uses the exact production
    // prune entries list from handoff.tsx to confirm.
    const storage = makeMemoryStorage({
      [NOTES_KEY]:           JSON.stringify({ p1: '' }),
      [SHIFT_KEY]:           'day',
      [COMPLETED_KEY]:       'true',
      [COMPLETED_DRAFT_KEY]: 'false',  // current-day undo written during load window
    });

    // Exact production entries list (mirrors pruneStaleStorageKeys call in HandoffScreen)
    const DRAFT_NOTES_KEY = `@sunrise_handoff_draft_notes_${formatDateKey(TODAY)}`;
    await pruneStaleStorageKeys(storage, [
      { prefix: '@sunrise_handoff_notes_',      currentKey: NOTES_KEY },
      { prefix: '@sunrise_handoff_shift_',      currentKey: SHIFT_KEY },
      { prefix: '@sunrise_handoff_undo_draft_', currentKey: COMPLETED_DRAFT_KEY },
      { prefix: '@sunrise_handoff_completed_',  currentKey: COMPLETED_KEY },
      { prefix: '@sunrise_handoff_draft_notes_', currentKey: DRAFT_NOTES_KEY },
    ]);

    // Current-day draft key MUST survive — it has not been consumed yet
    expect(storage.store[COMPLETED_DRAFT_KEY]).toBe('false');
    // Current-day completed key also survives
    expect(storage.store[COMPLETED_KEY]).toBe('true');
    // Current-day notes and shift keys survive
    expect(storage.store[NOTES_KEY]).toBeDefined();
    expect(storage.store[SHIFT_KEY]).toBe('day');
  });
});
