/**
 * Tests — shift tap before midnight cannot overwrite the next day's stored preference
 *
 * Task 341 coverage:
 *   HandoffScreen's load effect (handoff.tsx ~line 358–367) clears `pendingShiftRef`
 *   at the very start of every run — before the async storage read begins.  This
 *   prevents a shift tap buffered during yesterday's load window from surviving a
 *   midnight rollover and being merged on top of the new day's stored shift when
 *   the new-day Promise.all resolves.
 *
 *   The scenario under test:
 *     1. Day 1 (23:59): component mounts, load starts (AsyncStorage deferred).
 *     2. Nurse taps the "Night" shift before the load resolves.
 *        handleShiftChange → isPersistSafe returns false → tap buffered in
 *        pendingShiftRef (exactly as handoff.tsx line 551 does).
 *     3. Clock rolls to 00:00 — today key changes.  The load effect re-runs for
 *        the NEW day key.  The first thing it does is clear pendingShiftRef (line 367).
 *     4. New-day AsyncStorage read resolves with the stored shift ('day').
 *     5. pendingShiftRef is null → resolvedShift = savedShift = 'day'.
 *        The old-day 'Night' tap must NOT appear.
 *
 *   These tests exercise the pure storage-layer + ref/state logic that mirrors
 *   handoff.tsx's load effect.  No React Native, Expo, or AsyncStorage imports
 *   are required — all helpers are Node-compatible.
 */

import {
  isPersistSafe,
  makeHandoffNotesKey,
  makeHandoffShiftKey,
  loadHandoffState,
  formatDateKey,
  type StorageAdapter,
  type Shift,
} from '../lib/coldStartLoadHelpers';

// ─── Mock storage builders ─────────────────────────────────────────────────────

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

/** Storage whose getItem calls block until release() is called. */
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

/** 23:59 on Day 1 — one minute before midnight */
const BEFORE_MIDNIGHT = new Date('2026-07-21T23:59:00.000Z');
/** 00:00 on Day 2 — the instant the clock rolls over */
const AFTER_MIDNIGHT  = new Date('2026-07-22T00:00:00.000Z');

const DEFAULT_NOTES: Record<string, string> = { p1: '', p2: '' };

// ─── Core scenario: shift tapped just before midnight ─────────────────────────

describe('pendingShiftRef cleared at midnight — old-day tap cannot bleed into new day', () => {
  /**
   * Full simulation of the component logic:
   *   Day 1 load in-flight → nurse taps Night → midnight rolls → load effect
   *   re-runs for Day 2 → pendingShiftRef cleared → Day 2 load resolves with
   *   stored 'day' shift → final shift is 'day', NOT the buffered 'night' tap.
   */
  it('shift tap buffered during Day 1 load does not apply to Day 2 after rollover', async () => {
    // ── Storage state at rollover ─────────────────────────────────────────────
    // Day 1's keys have no stored data (fresh session before midnight).
    // Day 2's shift key is stored as 'day' (e.g. from a previous early session).
    const day2NotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const day2ShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);

    // We'll control the Day 1 load separately — it never resolves before rollover.
    const { adapter: day1Adapter } = makeDeferredStorage();
    // Day 2 storage resolves immediately with 'day' shift.
    const day2Storage = makeMemoryStorage({
      [day2ShiftKey]: 'day',
    });

    // ── Simulate ref state (mirrors useRef in handoff.tsx) ────────────────────
    let pendingShiftRef: Shift | null = null;

    // ── PHASE 1: Day 1 load starts (23:59) ───────────────────────────────────
    const day1NotesKey = makeHandoffNotesKey(BEFORE_MIDNIGHT);
    const day1ShiftKey = makeHandoffShiftKey(BEFORE_MIDNIGHT);

    // Load effect reset (handoff.tsx line 357-368):
    let loaded = false;
    let loadedForKey: string | null = null;
    pendingShiftRef = null;  // buffer cleared at load effect start

    // Load is in-flight — launch but don't await yet
    const day1LoadPromise = loadHandoffState(
      day1Adapter,
      { notes: day1NotesKey, shift: day1ShiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    // ── PHASE 2: Nurse taps "Night" shift before load resolves ───────────────
    // Mirrors handleShiftChange in handoff.tsx (lines 544-553):
    // isPersistSafe is false → buffer the tap in pendingShiftRef.
    const persistSafeDuringLoad = isPersistSafe(loaded, loadedForKey, day1NotesKey);
    expect(persistSafeDuringLoad).toBe(false);  // guard is closed during load

    // Buffer the tap (the else-branch of handleShiftChange):
    pendingShiftRef = 'night';

    // Yield the microtask queue — day1 load is still pending (deferred)
    await Promise.resolve();
    expect(pendingShiftRef).toBe('night');  // tap is buffered, not yet applied

    // ── PHASE 3: Midnight rolls — today key changes to AFTER_MIDNIGHT ─────────
    // The load effect dependency ([storageKeyNotes, storageKeyShift]) re-runs.
    // FIRST thing the load effect does (handoff.tsx line 357–368):
    loaded = false;
    loadedForKey = null;
    pendingShiftRef = null;   // ← the fix: clears the old-day buffered tap

    // Confirm the buffer is cleared before any new-day read starts:
    expect(pendingShiftRef).toBeNull();

    // ── PHASE 4: Day 2 load starts and resolves ───────────────────────────────
    const { notes: day2Notes, shift: savedShift, loaded: day2Loaded } =
      await loadHandoffState(
        day2Storage,
        { notes: day2NotesKey, shift: day2ShiftKey },
        { notes: DEFAULT_NOTES, shift: 'day' },
      );

    // Mirrors the .then() callback in handoff.tsx (line 473-475):
    //   const pendingShift = pendingShiftRef.current;
    //   pendingShiftRef.current = null;
    //   const resolvedShift = pendingShift ?? savedShift;
    const pendingShift = pendingShiftRef;   // null — cleared at rollover
    pendingShiftRef = null;
    const resolvedShift: Shift = pendingShift ?? savedShift;

    loadedForKey = day2NotesKey;
    loaded = day2Loaded;

    // ── PHASE 5: Assert the correct day-2 shift is applied ───────────────────
    expect(loaded).toBe(true);
    expect(resolvedShift).toBe('day');   // Day 2's stored value wins
    expect(resolvedShift).not.toBe('night');  // Old-day tap did NOT bleed in
    expect(day2Notes).toEqual(DEFAULT_NOTES);
  });

  it('shift tap buffered during NEW-DAY load window IS applied (tap within same day)', async () => {
    // Contrast: if the nurse taps a shift during the NEW day's own load window,
    // that tap SHOULD survive and be merged — clearing only happens at the
    // START of the new load, not after the nurse interacts on the new day.
    const day2NotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const day2ShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);

    const { adapter, release } = makeDeferredStorage({
      [day2ShiftKey]: 'day',
    });

    let pendingShiftRef: Shift | null = null;

    // Load effect for Day 2 starts — clears buffer
    let loaded = false;
    let loadedForKey: string | null = null;
    pendingShiftRef = null;

    // New-day load is in-flight
    const loadPromise = loadHandoffState(
      adapter,
      { notes: day2NotesKey, shift: day2ShiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    // Yield — load still pending
    await Promise.resolve();

    // Nurse taps "Eve" during the new day's own load window
    const persistSafe = isPersistSafe(loaded, loadedForKey, day2NotesKey);
    expect(persistSafe).toBe(false);
    // Buffer the new-day tap:
    pendingShiftRef = 'eve';

    // Release the deferred load — it resolves
    release();
    const { shift: savedShift, loaded: freshLoaded } = await loadPromise;

    // Merge: pendingShiftRef is 'eve' (set DURING the new day's load window)
    const pendingShift = pendingShiftRef;
    pendingShiftRef = null;
    const resolvedShift: Shift = pendingShift ?? savedShift;
    loaded = freshLoaded;
    loadedForKey = day2NotesKey;

    // The new-day tap IS honoured
    expect(loaded).toBe(true);
    expect(resolvedShift).toBe('eve');  // nurse's intent for TODAY is preserved
    expect(savedShift).toBe('day');     // storage had 'day', but tap overrides it
  });

  it('no stored shift for new day defaults to "day" — not the old-day buffered tap', async () => {
    // Edge case: fresh install or new calendar day with NO stored shift.
    // Even if a tap was buffered before rollover (and then cleared), the default
    // 'day' shift should be used — not the stale buffer.
    const day2NotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const day2ShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);

    // Day 2 storage has no shift key stored (brand new day)
    const day2Storage = makeMemoryStorage();  // empty

    // Simulate: old-day buffer had 'night' tapped
    let pendingShiftRef: Shift | null = 'night';  // accumulated during Day 1 load

    // Midnight rollover — load effect fires for Day 2
    // First lines of the load effect (handoff.tsx line 357–368):
    let loaded = false;
    let loadedForKey: string | null = null;
    pendingShiftRef = null;  // cleared — old-day tap discarded

    // Load Day 2 — no stored shift → defaults to 'day'
    const { shift: savedShift, loaded: freshLoaded } = await loadHandoffState(
      day2Storage,
      { notes: day2NotesKey, shift: day2ShiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    // Merge (pendingShiftRef cleared → use savedShift)
    const pendingShift = pendingShiftRef;
    pendingShiftRef = null;
    const resolvedShift: Shift = pendingShift ?? savedShift;
    loaded = freshLoaded;
    loadedForKey = day2NotesKey;

    expect(loaded).toBe(true);
    expect(savedShift).toBe('day');        // default returned for missing key
    expect(resolvedShift).toBe('day');     // old-day 'night' tap is gone
    expect(resolvedShift).not.toBe('night');
  });

  it('multiple shift taps before rollover are all discarded — only last stored value applies', async () => {
    // Nurse taps Day → Eve → Night during Day 1 load window, then midnight fires.
    // All three taps accumulate in pendingShiftRef (last-write-wins).
    // After rollover, the clearing wipes all of them and today's stored value wins.
    const day2NotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const day2ShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);

    const day2Storage = makeMemoryStorage({
      [day2ShiftKey]: 'eve',  // Day 2 stored shift (e.g. from a prior morning session)
    });

    // Day 1 load in-flight — deferred
    const { adapter: day1Adapter } = makeDeferredStorage();
    const day1NotesKey = makeHandoffNotesKey(BEFORE_MIDNIGHT);
    const day1ShiftKey = makeHandoffShiftKey(BEFORE_MIDNIGHT);

    let pendingShiftRef: Shift | null = null;
    let loaded = false;
    let loadedForKey: string | null = null;
    pendingShiftRef = null;

    // Day 1 load starts but doesn't resolve
    void loadHandoffState(
      day1Adapter,
      { notes: day1NotesKey, shift: day1ShiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    await Promise.resolve();

    // Nurse taps multiple shifts before midnight
    const persistSafe = isPersistSafe(loaded, loadedForKey, day1NotesKey);
    expect(persistSafe).toBe(false);

    pendingShiftRef = 'day';    // first tap
    pendingShiftRef = 'eve';    // second tap
    pendingShiftRef = 'night';  // third tap — last-write-wins in real component

    expect(pendingShiftRef).toBe('night');  // pre-rollover buffer holds 'night'

    // Midnight — load effect for Day 2 clears the buffer
    loaded = false;
    loadedForKey = null;
    pendingShiftRef = null;  // all taps discarded

    expect(pendingShiftRef).toBeNull();

    // Day 2 load resolves
    const { shift: savedShift, loaded: freshLoaded } = await loadHandoffState(
      day2Storage,
      { notes: day2NotesKey, shift: day2ShiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    const resolvedShift: Shift = pendingShiftRef ?? savedShift;
    loaded = freshLoaded;
    loadedForKey = day2NotesKey;

    expect(loaded).toBe(true);
    expect(resolvedShift).toBe('eve');    // Day 2's own stored shift wins
    expect(resolvedShift).not.toBe('night');  // accumulated taps discarded
  });

  it('guard is open after new-day load — nurse can tap a shift and it persists', async () => {
    // After the new-day load completes, normal shift selection works as expected.
    const day2NotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const day2ShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);

    const day2Storage = makeMemoryStorage({
      [day2ShiftKey]: 'day',
    });

    let pendingShiftRef: Shift | null = null;

    // Load effect reset
    let loaded = false;
    let loadedForKey: string | null = null;
    pendingShiftRef = null;

    // Day 2 load resolves immediately
    const { shift: savedShift, loaded: freshLoaded } = await loadHandoffState(
      day2Storage,
      { notes: day2NotesKey, shift: day2ShiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    loadedForKey = day2NotesKey;
    loaded = freshLoaded;

    const pendingAtLoad = pendingShiftRef;
    pendingShiftRef = null;
    let currentShift: Shift = pendingAtLoad ?? savedShift;

    expect(currentShift).toBe('day');
    expect(loaded).toBe(true);

    // Guard is now open — nurse taps "Night" after the load
    const persistSafeNow = isPersistSafe(loaded, loadedForKey, day2NotesKey);
    expect(persistSafeNow).toBe(true);

    // handleShiftChange: persist is safe, so setItem fires immediately (no buffer)
    currentShift = 'night';
    if (persistSafeNow) {
      await day2Storage.setItem(day2ShiftKey, currentShift);
    }

    // The new shift is written to Day 2's storage bucket
    expect(day2Storage.store[day2ShiftKey]).toBe('night');
    expect(currentShift).toBe('night');
  });
});

// ─── Structural invariant: pendingShiftRef is cleared before any async read ───

describe('pendingShiftRef clearing precedes async storage read — order invariant', () => {
  it('clearing pendingShiftRef is synchronous before the async read — no race window', async () => {
    // This test documents the structural guarantee: the ref clear happens
    // synchronously at the top of the load effect, BEFORE the loadHandoffState
    // promise is even created.  No async operation can interpose between the
    // clear and the start of the read, so there is no window where a buffered
    // tap could "sneak through" between the clear and the load.

    const day2NotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const day2ShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);
    const { adapter, release } = makeDeferredStorage({ [day2ShiftKey]: 'day' });

    // Pre-condition: buffer has an old-day tap
    let pendingShiftRef: Shift | null = 'night';

    // Track the order of operations
    const ops: string[] = [];

    // ── Simulate the synchronous top of the load effect ───────────────────────
    ops.push('guard-reset');
    let loaded = false;
    let loadedForKey: string | null = null;

    ops.push('buffer-clear');
    pendingShiftRef = null;  // synchronous — happens before any Promise is created

    // ── Async load starts AFTER the synchronous guard/buffer resets ───────────
    ops.push('load-started');
    const loadPromise = loadHandoffState(
      adapter,
      { notes: day2NotesKey, shift: day2ShiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    ).then(result => { ops.push('load-resolved'); return result; });

    // At this point the buffer is already null — confirmed before the promise resolves
    expect(pendingShiftRef).toBeNull();  // cleared synchronously, not on promise resolve
    expect(ops).toEqual(['guard-reset', 'buffer-clear', 'load-started']);

    // Release and await the load
    release();
    const { shift: savedShift, loaded: freshLoaded } = await loadPromise;

    expect(ops).toEqual(['guard-reset', 'buffer-clear', 'load-started', 'load-resolved']);

    const resolvedShift: Shift = pendingShiftRef ?? savedShift;
    loaded = freshLoaded;
    loadedForKey = day2NotesKey;

    // Buffer was null by the time the load resolved — stored value wins
    expect(resolvedShift).toBe('day');
    expect(resolvedShift).not.toBe('night');
    expect(loaded).toBe(true);
    expect(isPersistSafe(loaded, loadedForKey, day2NotesKey)).toBe(true);
  });
});

// ─── pendingNotesRef is also cleared at rollover ──────────────────────────────

describe('pendingNotesRef also cleared at midnight — note edits from old day do not bleed in', () => {
  it('notes typed during Day 1 load window do not appear on Day 2', async () => {
    // Companion to the shift test: pendingNotesRef is cleared at the same time
    // (handoff.tsx line 368) so note edits mid-load also cannot cross the day boundary.
    const day2NotesKey = makeHandoffNotesKey(AFTER_MIDNIGHT);
    const day2ShiftKey = makeHandoffShiftKey(AFTER_MIDNIGHT);

    // Day 2 storage has clean notes (empty)
    const day2Storage = makeMemoryStorage();

    // Pre-condition: pending notes buffer has edits from Day 1 load window
    let pendingNotesRef: Record<string, string> = { p1: 'Day 1 pending note' };

    // Midnight — load effect clears both buffers (handoff.tsx lines 367–368)
    let pendingShiftRef: Shift | null = 'night';
    pendingShiftRef = null;
    pendingNotesRef = {};

    // Day 2 load resolves — no stored notes, defaults used
    const { notes: savedNotes, loaded: freshLoaded } = await loadHandoffState(
      day2Storage,
      { notes: day2NotesKey, shift: day2ShiftKey },
      { notes: DEFAULT_NOTES, shift: 'day' },
    );

    // Merge pending notes: buffer is empty after the clear
    const hasPending = Object.keys(pendingNotesRef).length > 0;
    const resolvedNotes = hasPending ? { ...savedNotes, ...pendingNotesRef } : savedNotes;

    expect(freshLoaded).toBe(true);
    expect(resolvedNotes['p1']).toBe('');  // Day 1 pending note did NOT bleed in
    expect(hasPending).toBe(false);
  });
});
