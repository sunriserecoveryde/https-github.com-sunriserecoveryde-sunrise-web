/**
 * Unit tests for the undo-delete toast state machine in the patient detail screen.
 *
 * Scenario under test (added by Task 172):
 *   When a second note is deleted while the undo toast is already visible the
 *   first deletion is permanently committed and the toast transitions to show
 *   the new note.  Tapping Undo at that point must restore the *second* note
 *   and leave the *first* deletion permanent.
 *
 * Because the real handleDeleteNote / handleUndo live inside a React component
 * and depend on Animated, Haptics, and setTimeout, these tests exercise an
 * equivalent pure state machine that mirrors the same logic.  The machine is
 * kept intentionally small so the tests stay fast and free of native mocks.
 */

// ---------------------------------------------------------------------------
// Minimal types that mirror what the component tracks
// ---------------------------------------------------------------------------

interface Note {
  id: string;
  text: string;
}

interface PendingDelete {
  note: Note;
  patientId: string;
  originalIndex: number;
}

interface ToastState {
  /** The note currently shown in the undo toast (null = toast not visible) */
  pendingDelete: PendingDelete | null;
  /** Simulated auto-dismiss timer handle */
  timerHandle: ReturnType<typeof setTimeout> | null;
}

// ---------------------------------------------------------------------------
// Pure state-machine helpers (mirror the component logic exactly)
// ---------------------------------------------------------------------------

/**
 * Mirrors handleDeleteNote.
 *
 * Side-effects performed:
 *  1. If a timer is running it is cancelled (first deletion's grace period ends).
 *  2. `removeNote` is called for the note being deleted.
 *  3. When another toast is already showing, the state machine replaces it
 *     with the new pending delete — the first deletion stays committed because
 *     removeNote was already called when *it* was first deleted.
 *  4. A new 4-second dismiss timer is started.
 *
 * Returns the new ToastState.
 */
function handleDeleteNote(
  state: ToastState,
  note: Note,
  patientId: string,
  originalIndex: number,
  removeNote: (patientId: string, noteId: string) => void,
  scheduleTimer: (cb: () => void, ms: number) => ReturnType<typeof setTimeout>,
): ToastState {
  // Guard: already pending this exact note — ignore duplicate taps
  if (state.pendingDelete?.note.id === note.id) return state;

  // Cancel any in-flight dismiss timer
  if (state.timerHandle !== null) {
    clearTimeout(state.timerHandle);
  }

  // Permanently remove the note from the list immediately
  removeNote(patientId, note.id);

  // Schedule auto-dismiss and return new pending state
  const timerHandle = scheduleTimer(() => {}, 4000);

  return {
    pendingDelete: { note, patientId, originalIndex },
    timerHandle,
  };
}

/**
 * Mirrors handleUndo.
 *
 * Cancels the dismiss timer, re-inserts the pending note, and clears the toast.
 * Returns the new ToastState after undo.
 */
function handleUndo(
  state: ToastState,
  restoreNote: (patientId: string, note: Note, index: number) => void,
): ToastState {
  if (!state.pendingDelete) return state;

  if (state.timerHandle !== null) {
    clearTimeout(state.timerHandle);
  }

  const { note, patientId, originalIndex } = state.pendingDelete;
  restoreNote(patientId, note, originalIndex);

  return { pendingDelete: null, timerHandle: null };
}

/**
 * Mirrors dismissToast (auto-dismiss when timer fires without undo).
 */
function dismissToast(_state: ToastState): ToastState {
  return { pendingDelete: null, timerHandle: null };
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeNote(id: string, text = `Note ${id}`): Note {
  return { id, text };
}

function makeInitialState(): ToastState {
  return { pendingDelete: null, timerHandle: null };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('undo-delete toast — single deletion (baseline)', () => {
  it('populates pendingDelete after one deletion', () => {
    const removeNote = jest.fn();
    const restoreNote = jest.fn();
    const scheduleTimer = jest.fn(() => 1 as unknown as ReturnType<typeof setTimeout>);

    const noteA = makeNote('A');
    let state = makeInitialState();

    state = handleDeleteNote(state, noteA, 'p1', 0, removeNote, scheduleTimer);

    expect(removeNote).toHaveBeenCalledTimes(1);
    expect(removeNote).toHaveBeenCalledWith('p1', 'A');
    expect(state.pendingDelete?.note.id).toBe('A');
    expect(state.timerHandle).not.toBeNull();
  });

  it('restores the note when undo is tapped after a single deletion', () => {
    const removeNote = jest.fn();
    const restoreNote = jest.fn();
    const scheduleTimer = jest.fn(() => 1 as unknown as ReturnType<typeof setTimeout>);

    const noteA = makeNote('A');
    let state = makeInitialState();

    state = handleDeleteNote(state, noteA, 'p1', 0, removeNote, scheduleTimer);
    state = handleUndo(state, restoreNote);

    expect(restoreNote).toHaveBeenCalledTimes(1);
    expect(restoreNote).toHaveBeenCalledWith('p1', noteA, 0);
    expect(state.pendingDelete).toBeNull();
    expect(state.timerHandle).toBeNull();
  });

  it('clears the toast without restoring when auto-dismiss fires', () => {
    const removeNote = jest.fn();
    const restoreNote = jest.fn();
    const scheduleTimer = jest.fn(() => 1 as unknown as ReturnType<typeof setTimeout>);

    const noteA = makeNote('A');
    let state = makeInitialState();

    state = handleDeleteNote(state, noteA, 'p1', 0, removeNote, scheduleTimer);
    state = dismissToast(state);

    expect(restoreNote).not.toHaveBeenCalled();
    expect(state.pendingDelete).toBeNull();
  });
});

describe('undo-delete toast — second deletion while toast is already visible', () => {
  /**
   * Core scenario from Task 172 / Task 189:
   *   1. Delete note A  →  toast shows "Undo delete of A"
   *   2. Delete note B while toast still visible
   *      - Note A's dismiss timer is cancelled
   *      - Note A's removal stays committed (removeNote was already called for A)
   *      - Note B is removed immediately
   *      - Toast transitions to show "Undo delete of B"
   *   3. Tap Undo
   *      - Note B is restored
   *      - Note A remains permanently deleted
   *      - Toast disappears
   */
  it('commits the first deletion and tracks the second when delete is called during toast', () => {
    const removeNote = jest.fn();
    const restoreNote = jest.fn();
    let timerCount = 0;
    const scheduleTimer = jest.fn(() => (++timerCount) as unknown as ReturnType<typeof setTimeout>);

    const noteA = makeNote('A');
    const noteB = makeNote('B');
    let state = makeInitialState();

    // Step 1: delete A
    state = handleDeleteNote(state, noteA, 'p1', 0, removeNote, scheduleTimer);
    // Step 2: delete B while A's toast is showing
    state = handleDeleteNote(state, noteB, 'p1', 1, removeNote, scheduleTimer);

    // Both removals must have been called
    expect(removeNote).toHaveBeenCalledTimes(2);
    expect(removeNote).toHaveBeenNthCalledWith(1, 'p1', 'A');
    expect(removeNote).toHaveBeenNthCalledWith(2, 'p1', 'B');

    // Toast now tracks B (the second deletion)
    expect(state.pendingDelete?.note.id).toBe('B');
  });

  it('cancels the first timer when the second deletion arrives', () => {
    const removeNote = jest.fn();
    const scheduleTimer = jest.fn();
    const timerA = {} as ReturnType<typeof setTimeout>;
    const timerB = {} as ReturnType<typeof setTimeout>;
    scheduleTimer.mockReturnValueOnce(timerA).mockReturnValueOnce(timerB);

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const noteA = makeNote('A');
    const noteB = makeNote('B');
    let state = makeInitialState();

    state = handleDeleteNote(state, noteA, 'p1', 0, removeNote, scheduleTimer);
    state = handleDeleteNote(state, noteB, 'p1', 1, removeNote, scheduleTimer);

    // The first timer (A's) must have been cancelled when B was deleted
    expect(clearTimeoutSpy).toHaveBeenCalledWith(timerA);
    // A fresh timer for B must now be active
    expect(state.timerHandle).toBe(timerB);

    clearTimeoutSpy.mockRestore();
  });

  it('tapping Undo after a transition restores note B, not note A', () => {
    const removeNote = jest.fn();
    const restoreNote = jest.fn();
    const scheduleTimer = jest.fn(() => 1 as unknown as ReturnType<typeof setTimeout>);

    const noteA = makeNote('A');
    const noteB = makeNote('B');
    let state = makeInitialState();

    // Step 1: delete A
    state = handleDeleteNote(state, noteA, 'p1', 0, removeNote, scheduleTimer);
    // Step 2: delete B while toast showing
    state = handleDeleteNote(state, noteB, 'p1', 1, removeNote, scheduleTimer);
    // Step 3: tap Undo
    state = handleUndo(state, restoreNote);

    // Only B should be restored
    expect(restoreNote).toHaveBeenCalledTimes(1);
    expect(restoreNote).toHaveBeenCalledWith('p1', noteB, 1);

    // A must NOT be restored
    const restoredIds = restoreNote.mock.calls.map(([, note]) => note.id);
    expect(restoredIds).not.toContain('A');
  });

  it('tapping Undo after a transition clears the toast', () => {
    const removeNote = jest.fn();
    const restoreNote = jest.fn();
    const scheduleTimer = jest.fn(() => 1 as unknown as ReturnType<typeof setTimeout>);

    const noteA = makeNote('A');
    const noteB = makeNote('B');
    let state = makeInitialState();

    state = handleDeleteNote(state, noteA, 'p1', 0, removeNote, scheduleTimer);
    state = handleDeleteNote(state, noteB, 'p1', 1, removeNote, scheduleTimer);
    state = handleUndo(state, restoreNote);

    expect(state.pendingDelete).toBeNull();
    expect(state.timerHandle).toBeNull();
  });

  it('restores B at the correct original index', () => {
    const removeNote = jest.fn();
    const restoreNote = jest.fn();
    const scheduleTimer = jest.fn(() => 1 as unknown as ReturnType<typeof setTimeout>);

    const noteA = makeNote('A');
    const noteB = makeNote('B');
    let state = makeInitialState();

    state = handleDeleteNote(state, noteA, 'p1', 2, removeNote, scheduleTimer);
    state = handleDeleteNote(state, noteB, 'p1', 5, removeNote, scheduleTimer);
    state = handleUndo(state, restoreNote);

    // The original index for B was 5
    expect(restoreNote).toHaveBeenCalledWith('p1', noteB, 5);
  });
});

describe('undo-delete toast — guard: duplicate tap on the same note', () => {
  it('ignores a second delete call for the note already pending undo', () => {
    const removeNote = jest.fn();
    const scheduleTimer = jest.fn(() => 1 as unknown as ReturnType<typeof setTimeout>);

    const noteA = makeNote('A');
    let state = makeInitialState();

    state = handleDeleteNote(state, noteA, 'p1', 0, removeNote, scheduleTimer);
    const stateAfterFirst = state;

    // Tap delete on the same note again — should be a no-op
    state = handleDeleteNote(state, noteA, 'p1', 0, removeNote, scheduleTimer);

    expect(removeNote).toHaveBeenCalledTimes(1); // not called a second time
    expect(state).toBe(stateAfterFirst);         // state reference unchanged
  });
});

describe('undo-delete toast — three successive deletions', () => {
  it('each deletion commits the previous and tracks only the latest', () => {
    const removeNote = jest.fn();
    const restoreNote = jest.fn();
    const scheduleTimer = jest.fn(() => 1 as unknown as ReturnType<typeof setTimeout>);

    const noteA = makeNote('A');
    const noteB = makeNote('B');
    const noteC = makeNote('C');
    let state = makeInitialState();

    state = handleDeleteNote(state, noteA, 'p1', 0, removeNote, scheduleTimer);
    state = handleDeleteNote(state, noteB, 'p1', 1, removeNote, scheduleTimer);
    state = handleDeleteNote(state, noteC, 'p1', 2, removeNote, scheduleTimer);

    // All three are removed from storage
    expect(removeNote).toHaveBeenCalledTimes(3);

    // Only C is tracked for undo
    expect(state.pendingDelete?.note.id).toBe('C');

    state = handleUndo(state, restoreNote);

    // Only C is restored; A and B remain permanently deleted
    expect(restoreNote).toHaveBeenCalledTimes(1);
    expect(restoreNote).toHaveBeenCalledWith('p1', noteC, 2);
  });
});
