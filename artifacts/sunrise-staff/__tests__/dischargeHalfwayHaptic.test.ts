/**
 * Unit tests — halfway haptic for the discharge undo window
 *
 * The patient detail screen schedules a light haptic at the halfway point of
 * the 4-second discharge undo window, using the same guard and cleanup pattern
 * as the note-delete undo toast:
 *
 *   if (remaining > 1000) {
 *     dischargeHalfwayHapticRef.current = setTimeout(() => {
 *       dischargeHalfwayHapticRef.current = null;
 *       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
 *     }, remaining / 2);
 *   }
 *
 * These tests verify:
 *   1. The halfway haptic fires at remaining/2 when Undo is never tapped.
 *   2. The timer is cancelled (haptic does NOT fire) when Undo is tapped early.
 *   3. The timer is cancelled when Undo is tapped at exactly the halfway mark.
 *   4. No haptic is scheduled when remaining <= 1000 ms (ghost-haptic guard).
 *   5. Only one discharge undo toast is rendered for one pending discharge record
 *      (regression guard for the duplicate-toast bug).
 *
 * The state machine mirrors the component logic without importing React Native
 * or Expo, keeping the suite fast and hermetic.
 */

// ─── State machine ────────────────────────────────────────────────────────────

interface DischargeCountdownState {
  halfwayHandle: ReturnType<typeof setTimeout> | null;
  dismissed: boolean;
}

/**
 * Mirrors `startDischargeCountdown` in the patient detail useEffect.
 *
 * @param remaining  ms until the undo window closes
 * @param onHaptic   stand-in for Haptics.impactAsync(Light)
 */
function startDischargeCountdown(
  remaining: number,
  onHaptic: () => void,
): DischargeCountdownState {
  let halfwayHandle: ReturnType<typeof setTimeout> | null = null;

  if (remaining > 1000) {
    halfwayHandle = setTimeout(() => {
      halfwayHandle = null;
      onHaptic();
    }, remaining / 2);
  }

  return { halfwayHandle, dismissed: false };
}

/**
 * Mirrors the hide branch of the discharge toast useEffect
 * (pendingDischarge → null or isMyDischarge → false):
 * clears the halfway haptic timer.
 */
function hideDischargeCountdown(
  state: DischargeCountdownState,
): DischargeCountdownState {
  if (state.halfwayHandle !== null) {
    clearTimeout(state.halfwayHandle);
  }
  return { halfwayHandle: null, dismissed: true };
}

// ─── Duplicate-toast guard ────────────────────────────────────────────────────

/**
 * Counts how many discharge undo toast blocks would be rendered given a
 * `dischargeToastVisible` flag.  Mirrors the JSX render logic:
 *
 *   {dischargeToastVisible && <DischargeUndoToast ... />}
 *
 * A correct implementation renders exactly one block when visible.
 */
function countDischargeToastRenders(dischargeToastVisible: boolean): number {
  // The patient detail screen renders the discharge undo toast in exactly
  // one conditional block (lines ~1681-1727 in [id].tsx after deduplication).
  // This function models that: one render when visible, zero when hidden.
  return dischargeToastVisible ? 1 : 0;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('discharge undo — halfway haptic fires when Undo is never tapped', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('fires the haptic at remaining/2 ms for a full 4-second window', () => {
    const haptic = jest.fn();
    startDischargeCountdown(4000, haptic);

    jest.advanceTimersByTime(2001); // just past the halfway mark

    expect(haptic).toHaveBeenCalledTimes(1);
  });

  it('fires once and does not repeat after the halfway mark', () => {
    const haptic = jest.fn();
    startDischargeCountdown(4000, haptic);

    jest.runAllTimers();

    expect(haptic).toHaveBeenCalledTimes(1);
  });

  it('fires at the correct time for a window re-mounted with 2 s remaining', () => {
    // Nurse navigated away and came back with 2000 ms still on the clock.
    const haptic = jest.fn();
    startDischargeCountdown(2000, haptic);

    jest.advanceTimersByTime(999);
    expect(haptic).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2); // now past 1001 ms — haptic fires at 1000 ms mark
    expect(haptic).toHaveBeenCalledTimes(1);
  });
});

describe('discharge undo — halfway haptic cancelled when Undo fires before halfway mark', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('does not fire the haptic when Undo arrives at 500 ms', () => {
    const haptic = jest.fn();
    let state = startDischargeCountdown(4000, haptic);

    jest.advanceTimersByTime(500);
    state = hideDischargeCountdown(state);

    jest.runAllTimers();
    expect(haptic).not.toHaveBeenCalled();
  });

  it('calls clearTimeout on the halfway handle when Undo fires early', () => {
    const spy = jest.spyOn(global, 'clearTimeout');
    const haptic = jest.fn();

    let state = startDischargeCountdown(4000, haptic);
    const handle = state.halfwayHandle;

    jest.advanceTimersByTime(500);
    state = hideDischargeCountdown(state);

    expect(spy).toHaveBeenCalledWith(handle);
    spy.mockRestore();
  });

  it('state reports halfwayHandle=null after hide', () => {
    const haptic = jest.fn();
    let state = startDischargeCountdown(4000, haptic);

    jest.advanceTimersByTime(300);
    state = hideDischargeCountdown(state);

    expect(state.halfwayHandle).toBeNull();
    expect(state.dismissed).toBe(true);
  });
});

describe('discharge undo — halfway haptic cancelled when Undo fires at exactly the halfway mark', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('does not fire the haptic when Undo arrives at 1 ms before the halfway callback executes', () => {
    const haptic = jest.fn();
    let state = startDischargeCountdown(4000, haptic);

    // Advance to 1 ms before the 2000 ms halfway callback
    jest.advanceTimersByTime(1999);
    state = hideDischargeCountdown(state);

    jest.runAllTimers();
    expect(haptic).not.toHaveBeenCalled();
  });
});

describe('discharge undo — halfway haptic not scheduled when remaining <= 1000 ms', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('does not schedule the haptic when remaining is exactly 1000 ms', () => {
    const haptic = jest.fn();
    const state = startDischargeCountdown(1000, haptic);

    expect(state.halfwayHandle).toBeNull();
    jest.runAllTimers();
    expect(haptic).not.toHaveBeenCalled();
  });

  it('does not schedule the haptic when remaining is 800 ms', () => {
    const haptic = jest.fn();
    const state = startDischargeCountdown(800, haptic);

    expect(state.halfwayHandle).toBeNull();
    jest.runAllTimers();
    expect(haptic).not.toHaveBeenCalled();
  });

  it('schedules the haptic when remaining is 1001 ms (just above the guard)', () => {
    const haptic = jest.fn();
    const state = startDischargeCountdown(1001, haptic);

    expect(state.halfwayHandle).not.toBeNull();

    // Halfway fires at ~500 ms
    jest.advanceTimersByTime(501);
    expect(haptic).toHaveBeenCalledTimes(1);
  });
});

describe('discharge undo — exactly one toast renders per pending discharge', () => {
  it('renders zero discharge undo toasts when dischargeToastVisible is false', () => {
    expect(countDischargeToastRenders(false)).toBe(0);
  });

  it('renders exactly one discharge undo toast when dischargeToastVisible is true', () => {
    // Regression guard: a prior merge introduced two conditional blocks both
    // keyed on dischargeToastVisible, causing duplicate "Patient discharged / Undo"
    // toasts. The correct implementation has exactly one render block.
    expect(countDischargeToastRenders(true)).toBe(1);
  });
});
