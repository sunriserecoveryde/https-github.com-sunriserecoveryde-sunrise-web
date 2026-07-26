/**
 * Tests — NursingNotesContext rehydration guard and patient-detail
 * breakdown-chip visibility (Task 524).
 *
 * Coverage:
 *   1. loadNursingNotesState — mirrors the AsyncStorage.getItem + finally
 *      sequence inside NursingNotesProvider.  Tests verify that `loaded: true`
 *      (i.e. isRehydrating flipping to false) is NOT returned before the
 *      storage read settles, and that notesByPatient is populated correctly
 *      once it does.
 *
 *   2. Breakdown-chip guard logic — pure functions that mirror the JSX guard
 *      `!notesIsRehydrating && showNoteBreakdown` and the per-type count
 *      derivations used in app/patient/[id].tsx.  These tests confirm:
 *        • chips are hidden while isRehydrating is true
 *        • chips appear with correct counts once isRehydrating is false
 *        • mid-rehydration mount (navigate-away-and-back) is handled correctly
 *
 * Strategy:
 *   A `StorageAdapter` mock is injected into loadNursingNotesState.  Tests use
 *   deferred adapters to assert that `loaded` is not set while the read is
 *   in-flight, and memory adapters to verify the happy/error/stale paths.
 *   No React Native, Expo, or AsyncStorage imports are required.
 */

import {
  loadNursingNotesState,
  type StorageAdapter,
  type PersistedNote,
  type PersistedNotes,
} from '../lib/coldStartLoadHelpers';

// ─── Mock storage builders ────────────────────────────────────────────────────

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

/** Adapter whose getItem never resolves until `release` is called. */
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

function makeErrorStorage(): StorageAdapter {
  return {
    async getItem() { throw new Error('AsyncStorage unavailable'); },
    async setItem() { throw new Error('AsyncStorage unavailable'); },
    async multiRemove() { throw new Error('AsyncStorage unavailable'); },
    async getAllKeys() { throw new Error('AsyncStorage unavailable'); },
  };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TODAY = '2026-07-26';
const YESTERDAY = '2026-07-25';
const KEY = '@sunrise_nursing_notes_v1';

function makeNote(id: string, noteType: string): PersistedNote {
  return {
    id,
    text: `Note text for ${id}`,
    noteType,
    createdAt: new Date().toISOString(),
    displayTime: '14:00',
  };
}

function makePersistedNotes(
  shiftDate: string,
  notesByPatient: Record<string, PersistedNote[]>,
): string {
  return JSON.stringify({ shiftDate, notesByPatient } satisfies PersistedNotes);
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — loadNursingNotesState rehydration behaviour
// ─────────────────────────────────────────────────────────────────────────────

describe('loadNursingNotesState — isRehydrating guard for NursingNotesContext', () => {

  it('returns loaded:true with empty notesByPatient on first install (no storage key)', async () => {
    const storage = makeMemoryStorage();

    const result = await loadNursingNotesState(storage, KEY, TODAY);

    expect(result.loaded).toBe(true);
    expect(result.notesByPatient).toEqual({});
  });

  it('returns loaded:true alongside the restored notesByPatient for a same-day shift', async () => {
    const notes: Record<string, PersistedNote[]> = {
      p1: [makeNote('note-1', 'observation'), makeNote('note-2', 'incident')],
      p2: [makeNote('note-3', 'med-update')],
    };
    const storage = makeMemoryStorage({
      [KEY]: makePersistedNotes(TODAY, notes),
    });

    const result = await loadNursingNotesState(storage, KEY, TODAY);

    // Both fields arrive together — this is the guarantee the guard relies on.
    expect(result.loaded).toBe(true);
    expect(result.notesByPatient).toEqual(notes);
  });

  it('discards stale shift notes (different calendar day) and returns empty notesByPatient', async () => {
    const notes: Record<string, PersistedNote[]> = {
      p1: [makeNote('old-note', 'observation')],
    };
    const storage = makeMemoryStorage({
      [KEY]: makePersistedNotes(YESTERDAY, notes),
    });

    const result = await loadNursingNotesState(storage, KEY, TODAY);

    // Previous shift — silently discarded; notesByPatient must be empty.
    expect(result.loaded).toBe(true);
    expect(result.notesByPatient).toEqual({});
  });

  it('does NOT set loaded before the storage read resolves — deferred adapter test', async () => {
    // This is the key invariant: while AsyncStorage.getItem is still pending,
    // isRehydrating must remain true (loaded must remain pending).
    // A deferred adapter lets us pause the read mid-flight and assert.
    const { adapter, release } = makeDeferredStorage();

    const loadPromise = loadNursingNotesState(adapter, KEY, TODAY);

    let settled = false;
    loadPromise.then(() => { settled = true; });

    // Yield the event loop once — the promise must not have settled yet.
    await Promise.resolve();
    expect(settled).toBe(false);

    // Release the read — the load must now complete with loaded:true.
    release(null);
    const result = await loadPromise;
    expect(result.loaded).toBe(true);
    expect(result.notesByPatient).toEqual({});
  });

  it('returns loaded:true even when storage throws (error path)', async () => {
    const result = await loadNursingNotesState(makeErrorStorage(), KEY, TODAY);

    // Guard must not leave the breakdown chips permanently hidden on storage failure.
    expect(result.loaded).toBe(true);
    expect(result.notesByPatient).toEqual({});
  });

  it('returns loaded:true even when the stored JSON is malformed', async () => {
    const storage = makeMemoryStorage({ [KEY]: 'NOT_VALID_JSON' });

    const result = await loadNursingNotesState(storage, KEY, TODAY);

    expect(result.loaded).toBe(true);
    expect(result.notesByPatient).toEqual({});
  });

  it('returns loaded:true even when notesByPatient is missing from the stored blob', async () => {
    // Corrupt payload — shiftDate matches but notesByPatient is absent.
    const storage = makeMemoryStorage({
      [KEY]: JSON.stringify({ shiftDate: TODAY }),
    });

    const result = await loadNursingNotesState(storage, KEY, TODAY);

    expect(result.loaded).toBe(true);
    expect(result.notesByPatient).toEqual({});
  });

  it('restores notes for multiple patients correctly', async () => {
    const notes: Record<string, PersistedNote[]> = {
      p1: [makeNote('n1', 'incident'), makeNote('n2', 'med-update')],
      p2: [makeNote('n3', 'observation')],
      p3: [],
    };
    const storage = makeMemoryStorage({
      [KEY]: makePersistedNotes(TODAY, notes),
    });

    const { notesByPatient } = await loadNursingNotesState(storage, KEY, TODAY);

    expect(notesByPatient['p1']).toHaveLength(2);
    expect(notesByPatient['p2']).toHaveLength(1);
    expect(notesByPatient['p3']).toHaveLength(0);
    expect(notesByPatient['p1']![0]!.noteType).toBe('incident');
    expect(notesByPatient['p2']![0]!.noteType).toBe('observation');
  });

  it('without the guard, breakdown chips would flash with zero counts before storage resolves', () => {
    // Documents the regression the guard prevents:
    // If the chips rendered before loadNursingNotesState resolved, notesByPatient
    // would be {} and incidentCount / medUpdateCount would both be 0 — the chips
    // would be invisible (showNoteBreakdown = false) then pop in after rehydration.
    // The !notesIsRehydrating guard in JSX ensures the entire chip row is hidden
    // until loaded:true arrives.
    const preLoadNotesByPatient: Record<string, PersistedNote[]> = {};
    const initialLoaded = false; // isRehydrating === true

    const incidentCount  = (preLoadNotesByPatient['p1'] ?? []).filter(n => n.noteType === 'incident').length;
    const medUpdateCount = (preLoadNotesByPatient['p1'] ?? []).filter(n => n.noteType === 'med-update').length;
    const showNoteBreakdown = incidentCount > 0 && medUpdateCount > 0;

    expect(initialLoaded).toBe(false);
    expect(showNoteBreakdown).toBe(false); // chips would be absent before guard applies
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — breakdown-chip guard logic
//
// These tests mirror the pure derivations from app/patient/[id].tsx:
//
//   const sessionNotes = getNotesForPatient(id);       // notesByPatient[id] ?? []
//   const incidentCount  = sessionNotes.filter(n => n.noteType === 'incident').length;
//   const medUpdateCount = sessionNotes.filter(n => n.noteType === 'med-update').length;
//   const showNoteBreakdown = incidentCount > 0 && medUpdateCount > 0;
//   // JSX guard:
//   {!notesIsRehydrating && showNoteBreakdown && <ChipRow ... />}
//
// ─────────────────────────────────────────────────────────────────────────────

/** Pure helper — mirrors the `getNotesForPatient` selector in the context. */
function getNotesForPatient(
  notesByPatient: Record<string, PersistedNote[]>,
  patientId: string,
): PersistedNote[] {
  return notesByPatient[patientId] ?? [];
}

/** Pure helper — mirrors the breakdown counts + showNoteBreakdown derived value. */
function deriveBreakdown(
  notesByPatient: Record<string, PersistedNote[]>,
  patientId: string,
): { incidentCount: number; medUpdateCount: number; showNoteBreakdown: boolean } {
  const sessionNotes = getNotesForPatient(notesByPatient, patientId);
  const incidentCount  = sessionNotes.filter(n => n.noteType === 'incident').length;
  const medUpdateCount = sessionNotes.filter(n => n.noteType === 'med-update').length;
  const showNoteBreakdown = incidentCount > 0 && medUpdateCount > 0;
  return { incidentCount, medUpdateCount, showNoteBreakdown };
}

/** Pure helper — mirrors the JSX `!notesIsRehydrating && showNoteBreakdown` gate. */
function chipsVisible(isRehydrating: boolean, showNoteBreakdown: boolean): boolean {
  return !isRehydrating && showNoteBreakdown;
}

describe('breakdown-chip guard — chips hidden while rehydrating, visible with correct counts after', () => {

  it('chips are hidden when isRehydrating is true, regardless of note counts', () => {
    // Simulate state mid-rehydration: notes not yet loaded from storage.
    // The component holds notesByPatient={} and isRehydrating=true.
    const notesByPatient: Record<string, PersistedNote[]> = {};
    const { showNoteBreakdown } = deriveBreakdown(notesByPatient, 'p1');

    expect(chipsVisible(true, showNoteBreakdown)).toBe(false);
  });

  it('chips are hidden when isRehydrating is true even if notesByPatient is already populated', () => {
    // Edge case: if state somehow contained notes before rehydration completed,
    // the guard must still hide the chips.
    const notesByPatient: Record<string, PersistedNote[]> = {
      p1: [makeNote('n1', 'incident'), makeNote('n2', 'med-update')],
    };
    const { showNoteBreakdown } = deriveBreakdown(notesByPatient, 'p1');

    // showNoteBreakdown would be true, but the isRehydrating guard wins.
    expect(showNoteBreakdown).toBe(true);
    expect(chipsVisible(true, showNoteBreakdown)).toBe(false);
  });

  it('chips are hidden after rehydration when only one note type exists', () => {
    // Only incidents — medUpdateCount is 0 so showNoteBreakdown is false.
    const notesByPatient: Record<string, PersistedNote[]> = {
      p1: [makeNote('n1', 'incident'), makeNote('n2', 'incident')],
    };
    const { incidentCount, medUpdateCount, showNoteBreakdown } = deriveBreakdown(notesByPatient, 'p1');

    expect(incidentCount).toBe(2);
    expect(medUpdateCount).toBe(0);
    expect(showNoteBreakdown).toBe(false);
    expect(chipsVisible(false, showNoteBreakdown)).toBe(false);
  });

  it('chips are visible after rehydration when both incident and med-update notes exist', () => {
    const notesByPatient: Record<string, PersistedNote[]> = {
      p1: [
        makeNote('n1', 'incident'),
        makeNote('n2', 'incident'),
        makeNote('n3', 'med-update'),
        makeNote('n4', 'observation'), // observations don't contribute to breakdown
      ],
    };
    const { incidentCount, medUpdateCount, showNoteBreakdown } = deriveBreakdown(notesByPatient, 'p1');

    expect(incidentCount).toBe(2);
    expect(medUpdateCount).toBe(1);
    expect(showNoteBreakdown).toBe(true);
    expect(chipsVisible(false, showNoteBreakdown)).toBe(true);
  });

  it('chips show correct counts after rehydration populates notesByPatient', async () => {
    // Full end-to-end path: storage → loadNursingNotesState → derive breakdown.
    const notes: Record<string, PersistedNote[]> = {
      p1: [
        makeNote('n1', 'incident'),
        makeNote('n2', 'incident'),
        makeNote('n3', 'incident'),
        makeNote('n4', 'med-update'),
        makeNote('n5', 'med-update'),
        makeNote('n6', 'observation'),
      ],
    };
    const storage = makeMemoryStorage({
      [KEY]: makePersistedNotes(TODAY, notes),
    });

    const { notesByPatient, loaded } = await loadNursingNotesState(storage, KEY, TODAY);

    // Rehydration is complete — isRehydrating is now false.
    expect(loaded).toBe(true);

    const { incidentCount, medUpdateCount, showNoteBreakdown } = deriveBreakdown(notesByPatient, 'p1');

    expect(incidentCount).toBe(3);
    expect(medUpdateCount).toBe(2);
    expect(showNoteBreakdown).toBe(true);
    expect(chipsVisible(false, showNoteBreakdown)).toBe(true);
  });

  it('chips are hidden after rehydration when the patient has no notes at all', () => {
    // Empty notesByPatient after a successful rehydration (first install / new shift).
    const notesByPatient: Record<string, PersistedNote[]> = {};
    const { incidentCount, medUpdateCount, showNoteBreakdown } = deriveBreakdown(notesByPatient, 'p1');

    expect(incidentCount).toBe(0);
    expect(medUpdateCount).toBe(0);
    expect(showNoteBreakdown).toBe(false);
    expect(chipsVisible(false, showNoteBreakdown)).toBe(false);
  });

  it('observation notes do not count toward the breakdown chips', () => {
    const notesByPatient: Record<string, PersistedNote[]> = {
      p1: [
        makeNote('n1', 'observation'),
        makeNote('n2', 'observation'),
        makeNote('n3', 'observation'),
      ],
    };
    const { incidentCount, medUpdateCount, showNoteBreakdown } = deriveBreakdown(notesByPatient, 'p1');

    expect(incidentCount).toBe(0);
    expect(medUpdateCount).toBe(0);
    expect(showNoteBreakdown).toBe(false);
  });

  it('group-session notes do not count toward the breakdown chips', () => {
    const notesByPatient: Record<string, PersistedNote[]> = {
      p1: [
        makeNote('n1', 'group-session'),
        makeNote('n2', 'group-session'),
      ],
    };
    const { incidentCount, medUpdateCount, showNoteBreakdown } = deriveBreakdown(notesByPatient, 'p1');

    expect(incidentCount).toBe(0);
    expect(medUpdateCount).toBe(0);
    expect(showNoteBreakdown).toBe(false);
  });

  it('handles mid-rehydration mount: navigate-away-and-back before AsyncStorage resolves', async () => {
    // Simulates the scenario from the task description:
    //   1. Nurse opens patient detail → isRehydrating=true, chips hidden
    //   2. Nurse immediately navigates away (component unmounts)
    //   3. Nurse navigates back before AsyncStorage resolves → still isRehydrating=true
    //   4. AsyncStorage resolves → isRehydrating=false, chips visible
    //
    // The deferred adapter pauses the read at step 1. We verify that at the
    // point of the mid-rehydration re-mount (step 3), loaded is still false,
    // so the chips must remain hidden. Then we release storage (step 4) and
    // confirm the correct counts appear.
    const notes: Record<string, PersistedNote[]> = {
      p1: [makeNote('n1', 'incident'), makeNote('n2', 'med-update')],
    };
    const { adapter: deferredAdapter, release } = makeDeferredStorage();

    // Step 1: initial mount triggers the load — in-flight.
    const loadPromise = loadNursingNotesState(deferredAdapter, KEY, TODAY);

    let settled = false;
    loadPromise.then(() => { settled = true; });

    // Yield — still in-flight.
    await Promise.resolve();

    // Step 2: nurse navigates away (component unmounts) — nothing to clean up
    // for the context-level load; the promise stays alive.

    // Step 3: nurse navigates back before the read resolves.
    // The component remounts. isRehydrating is still true (loaded not yet set).
    expect(settled).toBe(false);

    // At this point the chips must be hidden (isRehydrating=true).
    const preRehydrationBreakdown = deriveBreakdown({}, 'p1');
    expect(chipsVisible(true, preRehydrationBreakdown.showNoteBreakdown)).toBe(false);

    // Step 4: AsyncStorage finally resolves.
    release(JSON.stringify({ shiftDate: TODAY, notesByPatient: notes } satisfies PersistedNotes));
    const result = await loadPromise;

    // isRehydrating is now false; chips should be visible with correct counts.
    expect(result.loaded).toBe(true);
    const { incidentCount, medUpdateCount, showNoteBreakdown } = deriveBreakdown(result.notesByPatient, 'p1');
    expect(incidentCount).toBe(1);
    expect(medUpdateCount).toBe(1);
    expect(showNoteBreakdown).toBe(true);
    expect(chipsVisible(false, showNoteBreakdown)).toBe(true);
  });

  it('counts are patient-scoped: notes for one patient do not bleed into another', () => {
    const notesByPatient: Record<string, PersistedNote[]> = {
      p1: [makeNote('n1', 'incident'), makeNote('n2', 'med-update')],
      p2: [makeNote('n3', 'observation')], // different patient — no breakdown
    };

    const p1 = deriveBreakdown(notesByPatient, 'p1');
    const p2 = deriveBreakdown(notesByPatient, 'p2');

    expect(p1.showNoteBreakdown).toBe(true);
    expect(p1.incidentCount).toBe(1);
    expect(p1.medUpdateCount).toBe(1);

    expect(p2.showNoteBreakdown).toBe(false);
    expect(p2.incidentCount).toBe(0);
    expect(p2.medUpdateCount).toBe(0);
  });
});
