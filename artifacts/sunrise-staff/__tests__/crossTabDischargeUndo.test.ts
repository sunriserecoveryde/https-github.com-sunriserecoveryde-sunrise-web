/**
 * Unit tests — cross-tab discharge undo & timer-expiry transitions
 *
 * Scenario under test (Task 243):
 *   The "Discharging…" banner appears on the MAR tab (and the Checks tab) while
 *   a patient's 4-second undo window is open on the Census tab.  Two paths must
 *   be validated:
 *
 *   Undo path:
 *     1. `startPendingDischarge(patient)` — patient is optimistically removed
 *        from the roster; pendingDischarge is set.
 *     2. Nurse navigates to the MAR tab — `displayedPatients` re-inserts the
 *        patient at the front with isPendingDischarge = true.
 *     3. Nurse taps Undo on the Census toast — `undoDischarge()` is called.
 *     4. pendingDischarge becomes null and the patient is restored to `patients`.
 *     5. `displayedPatients` now returns the patient normally (no pill, no fade).
 *
 *   Timer-expiry path:
 *     1. `startPendingDischarge(patient)` — same as above.
 *     2. Nurse stays on the MAR tab while the 4-second window elapses.
 *     3. The timer fires → pendingDischarge becomes null; `patients` is NOT
 *        restored (discharge is committed).
 *     4. `displayedPatients` no longer includes the patient at all.
 *
 * Because the real logic lives inside React hooks and setTimeout callbacks,
 * these tests exercise an equivalent pure state machine that mirrors the exact
 * same logic from PatientContext.tsx and the displayedPatients memo in mar.tsx.
 * No React Native, Expo, or AsyncStorage imports are needed.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  program: 'Residential' | 'PHP' | 'IOP' | 'OP';
  bed: string;
}

interface PendingDischargeRecord {
  patient: Patient;
  expiresAt: number;
}

interface ContextState {
  /** All active (non-discharged) patients */
  patients: Patient[];
  /** Active pending-discharge record; null = no window open */
  pendingDischarge: PendingDischargeRecord | null;
  /** Running undo-window timer handle; null = not scheduled */
  timerHandle: ReturnType<typeof setTimeout> | null;
  /** IDs of patients committed as discharged */
  dischargedIds: Set<string>;
}

// ─── State-machine helpers (mirror PatientContext.tsx) ────────────────────────

const DISCHARGE_UNDO_MS = 4000;

/**
 * Mirrors `startPendingDischarge`:
 *   - optimistically removes the patient from `patients`
 *   - marks them in dischargedIds
 *   - opens the undo window (sets pendingDischarge + starts timer)
 */
function startPendingDischarge(
  state: ContextState,
  patient: Patient,
  now: number,
  scheduleTimer: (cb: () => void, ms: number) => ReturnType<typeof setTimeout>,
  onTimerFire: () => void,
): ContextState {
  // Guard: already pending this exact patient — no-op
  if (state.pendingDischarge?.patient.id === patient.id) return state;

  // Cancel any previously open window for a different patient
  if (state.timerHandle !== null) {
    clearTimeout(state.timerHandle);
  }

  const dischargedIds = new Set(state.dischargedIds);
  dischargedIds.add(patient.id);

  const expiresAt = now + DISCHARGE_UNDO_MS;
  const record: PendingDischargeRecord = { patient, expiresAt };

  const timerHandle = scheduleTimer(onTimerFire, DISCHARGE_UNDO_MS);

  return {
    patients: state.patients.filter(p => p.id !== patient.id),
    pendingDischarge: record,
    timerHandle,
    dischargedIds,
  };
}

/**
 * Mirrors the timer-fire callback inside `startPendingDischarge`:
 *   - clears pendingDischarge
 *   - does NOT restore the patient (discharge is committed)
 */
function commitDischarge(state: ContextState): ContextState {
  return {
    ...state,
    pendingDischarge: null,
    timerHandle: null,
  };
}

/**
 * Mirrors `undoDischarge`:
 *   - cancels the timer
 *   - removes the patient from dischargedIds
 *   - re-adds the patient to `patients`
 *   - clears pendingDischarge
 */
function undoDischarge(state: ContextState): ContextState {
  if (!state.pendingDischarge) return state;

  if (state.timerHandle !== null) {
    clearTimeout(state.timerHandle);
  }

  const patient = state.pendingDischarge.patient;
  const dischargedIds = new Set(state.dischargedIds);
  dischargedIds.delete(patient.id);

  // Avoid duplicate re-insertion (mirrors the "if prev.some" guard)
  const alreadyPresent = state.patients.some(p => p.id === patient.id);

  return {
    patients: alreadyPresent ? state.patients : [...state.patients, patient],
    pendingDischarge: null,
    timerHandle: null,
    dischargedIds,
  };
}

// ─── Display helpers (mirror the displayedPatients memo in mar.tsx) ───────────

/**
 * Mirrors the `displayedPatients` useMemo in both MARView and ChecksView:
 *   - If no pendingDischarge → return residentialPatients as-is
 *   - If pendingDischarge exists and patient is Residential AND not already in
 *     the list → prepend them
 */
function computeDisplayedPatients(
  patients: Patient[],
  pendingDischarge: PendingDischargeRecord | null,
): Patient[] {
  const residentialPatients = patients.filter(p => p.program === 'Residential');
  if (!pendingDischarge) return residentialPatients;
  const pd = pendingDischarge.patient;
  if (pd.program !== 'Residential') return residentialPatients;
  if (residentialPatients.some(p => p.id === pd.id)) return residentialPatients;
  return [pd, ...residentialPatients];
}

/**
 * Mirrors the `isPendingDischarge` prop passed to each card:
 *   `pendingDischarge?.patient.id === item.id`
 */
function isPendingDischarge(
  patientId: string,
  pendingDischarge: PendingDischargeRecord | null,
): boolean {
  return pendingDischarge?.patient.id === patientId;
}

// ─── Test fixtures ────────────────────────────────────────────────────────────

function makePatient(id: string, overrides: Partial<Patient> = {}): Patient {
  return {
    id,
    firstName: `First${id}`,
    lastName: `Last${id}`,
    program: 'Residential',
    bed: `${id}A`,
    ...overrides,
  };
}

function makeInitialState(patients: Patient[]): ContextState {
  return {
    patients,
    pendingDischarge: null,
    timerHandle: null,
    dischargedIds: new Set(),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('cross-tab discharge — MAR displayedPatients while undo window is open', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('re-inserts the pending-discharge patient at the front of the MAR list', () => {
    const p1 = makePatient('p1');
    const p2 = makePatient('p2');
    const p3 = makePatient('p3');
    let state = makeInitialState([p1, p2, p3]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());

    const displayed = computeDisplayedPatients(state.patients, state.pendingDischarge);

    // p1 must be re-inserted even though it was removed from `patients`
    expect(displayed.map(p => p.id)).toContain('p1');
    // p1 should appear first (prepended)
    expect(displayed[0]?.id).toBe('p1');
    // other patients must still be present
    expect(displayed.map(p => p.id)).toContain('p2');
    expect(displayed.map(p => p.id)).toContain('p3');
  });

  it('marks only the pending-discharge patient with isPendingDischarge=true', () => {
    const p1 = makePatient('p1');
    const p2 = makePatient('p2');
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());

    const displayed = computeDisplayedPatients(state.patients, state.pendingDischarge);

    expect(isPendingDischarge('p1', state.pendingDischarge)).toBe(true);
    expect(isPendingDischarge('p2', state.pendingDischarge)).toBe(false);
  });
});

describe('cross-tab discharge — Undo path (nurse taps Undo while on MAR tab)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('pendingDischarge becomes null after undoDischarge', () => {
    const p1 = makePatient('p1');
    const p2 = makePatient('p2');
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    expect(state.pendingDischarge).not.toBeNull();

    state = undoDischarge(state);

    expect(state.pendingDischarge).toBeNull();
  });

  it('patient is restored to the roster after undoDischarge', () => {
    const p1 = makePatient('p1');
    const p2 = makePatient('p2');
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    expect(state.patients.some(p => p.id === 'p1')).toBe(false);

    state = undoDischarge(state);

    expect(state.patients.some(p => p.id === 'p1')).toBe(true);
  });

  it('MAR displayedPatients shows the patient normally (no pill) after undo', () => {
    const p1 = makePatient('p1');
    const p2 = makePatient('p2');
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    state = undoDischarge(state);

    const displayed = computeDisplayedPatients(state.patients, state.pendingDischarge);

    // Patient present in the list
    expect(displayed.some(p => p.id === 'p1')).toBe(true);
    // No pending-discharge marker
    expect(isPendingDischarge('p1', state.pendingDischarge)).toBe(false);
  });

  it('displayedPatients length equals full residential roster after undo', () => {
    const p1 = makePatient('p1');
    const p2 = makePatient('p2');
    const p3 = makePatient('p3');
    let state = makeInitialState([p1, p2, p3]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    // During the window: 3 patients shown (re-inserted)
    const duringWindow = computeDisplayedPatients(state.patients, state.pendingDischarge);
    expect(duringWindow).toHaveLength(3);

    state = undoDischarge(state);

    // After undo: still 3 patients, all normal
    const afterUndo = computeDisplayedPatients(state.patients, state.pendingDischarge);
    expect(afterUndo).toHaveLength(3);
  });

  it('cancels the undo-window timer when undoDischarge is called', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const p1 = makePatient('p1');
    let state = makeInitialState([p1]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    const timerHandle = state.timerHandle;
    expect(timerHandle).not.toBeNull();

    state = undoDischarge(state);

    expect(clearTimeoutSpy).toHaveBeenCalledWith(timerHandle);
    clearTimeoutSpy.mockRestore();
  });

  it('undo on an already-null pendingDischarge is a safe no-op', () => {
    const p1 = makePatient('p1');
    const state = makeInitialState([p1]);
    expect(state.pendingDischarge).toBeNull();

    // Should not throw
    const next = undoDischarge(state);
    expect(next.pendingDischarge).toBeNull();
    expect(next.patients).toEqual([p1]);
  });

  it('does not re-insert the patient twice on rapid double-undo', () => {
    const p1 = makePatient('p1');
    let state = makeInitialState([p1]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    state = undoDischarge(state);
    // Second undo on already-null state — should not duplicate the patient
    state = undoDischarge(state);

    const p1Entries = state.patients.filter(p => p.id === 'p1');
    expect(p1Entries).toHaveLength(1);
  });
});

describe('cross-tab discharge — timer-expiry path (nurse stays on MAR tab for 4 s)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('patient row disappears entirely from MAR after the undo window closes', () => {
    const p1 = makePatient('p1');
    const p2 = makePatient('p2');
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());

    // Simulate the timer firing (discharge committed)
    state = commitDischarge(state);

    const displayed = computeDisplayedPatients(state.patients, state.pendingDischarge);

    // p1 must be completely absent — not just missing the pill
    expect(displayed.some(p => p.id === 'p1')).toBe(false);
    expect(displayed).toHaveLength(1);
    expect(displayed[0]?.id).toBe('p2');
  });

  it('pendingDischarge is null after the timer fires', () => {
    const p1 = makePatient('p1');
    let state = makeInitialState([p1]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    state = commitDischarge(state);

    expect(state.pendingDischarge).toBeNull();
  });

  it('timer firing does not restore the patient to `patients`', () => {
    const p1 = makePatient('p1');
    let state = makeInitialState([p1]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    expect(state.patients).toHaveLength(0);

    state = commitDischarge(state);

    expect(state.patients).toHaveLength(0);
  });

  it('isPendingDischarge is false for all displayed patients after timer fires', () => {
    const p1 = makePatient('p1');
    const p2 = makePatient('p2');
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    state = commitDischarge(state);

    const displayed = computeDisplayedPatients(state.patients, state.pendingDischarge);
    for (const patient of displayed) {
      expect(isPendingDischarge(patient.id, state.pendingDischarge)).toBe(false);
    }
  });
});

describe('cross-tab discharge — non-Residential patients are unaffected', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('a PHP patient in pendingDischarge is not re-inserted into the Residential MAR list', () => {
    const phpPatient = makePatient('php1', { program: 'PHP' });
    const resPatient = makePatient('res1', { program: 'Residential' });
    let state = makeInitialState([resPatient, phpPatient]);

    state = startPendingDischarge(state, phpPatient, Date.now(), setTimeout, jest.fn());

    const displayed = computeDisplayedPatients(state.patients, state.pendingDischarge);

    // Only Residential patients are shown on the MAR
    expect(displayed.some(p => p.id === 'php1')).toBe(false);
    expect(displayed.some(p => p.id === 'res1')).toBe(true);
  });
});

describe('cross-tab discharge — guard: duplicate startPendingDischarge on same patient', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('calling startPendingDischarge twice for the same patient is a no-op on the second call', () => {
    const p1 = makePatient('p1');
    const p2 = makePatient('p2');
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    const stateAfterFirst = state;

    // Second call for the same patient — must return the identical state object
    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());

    expect(state).toBe(stateAfterFirst);
  });

  it('the roster does not shrink further on a duplicate startPendingDischarge', () => {
    const p1 = makePatient('p1');
    const p2 = makePatient('p2');
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    const rosterAfterFirst = state.patients.length;

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());

    expect(state.patients.length).toBe(rosterAfterFirst);
  });
});

describe('cross-tab discharge — second discharge while first window is open', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('first patient stays discharged when a second discharge replaces the pending window', () => {
    const p1 = makePatient('p1');
    const p2 = makePatient('p2');
    const p3 = makePatient('p3');
    let state = makeInitialState([p1, p2, p3]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    // p1 is pending; now discharge p2
    state = startPendingDischarge(state, p2, Date.now(), setTimeout, jest.fn());

    // pendingDischarge now tracks p2
    expect(state.pendingDischarge?.patient.id).toBe('p2');
    // p1 must still be absent from the roster (committed)
    expect(state.patients.some(p => p.id === 'p1')).toBe(false);
    // p2 must be absent (pending)
    expect(state.patients.some(p => p.id === 'p2')).toBe(false);
  });

  it('undoDischarge after transition restores p2, not p1', () => {
    const p1 = makePatient('p1');
    const p2 = makePatient('p2');
    const p3 = makePatient('p3');
    let state = makeInitialState([p1, p2, p3]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    state = startPendingDischarge(state, p2, Date.now(), setTimeout, jest.fn());
    state = undoDischarge(state);

    // p2 must be restored
    expect(state.patients.some(p => p.id === 'p2')).toBe(true);
    // p1 must remain discharged
    expect(state.patients.some(p => p.id === 'p1')).toBe(false);
  });

  it('cancels the first timer when the second discharge begins', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const p1 = makePatient('p1');
    const p2 = makePatient('p2');
    let state = makeInitialState([p1, p2]);

    const timerA = {} as ReturnType<typeof setTimeout>;
    const timerB = {} as ReturnType<typeof setTimeout>;
    const scheduleMock = jest.fn()
      .mockReturnValueOnce(timerA)
      .mockReturnValueOnce(timerB);

    state = startPendingDischarge(state, p1, Date.now(), scheduleMock, jest.fn());
    state = startPendingDischarge(state, p2, Date.now(), scheduleMock, jest.fn());

    // Timer A (for p1) must have been cancelled when p2's discharge started
    expect(clearTimeoutSpy).toHaveBeenCalledWith(timerA);
    // Timer B is now active
    expect(state.timerHandle).toBe(timerB);

    clearTimeoutSpy.mockRestore();
  });
});
