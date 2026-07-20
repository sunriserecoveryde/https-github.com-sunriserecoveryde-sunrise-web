/**
 * Unit tests — Scores tab discharge undo & timer-expiry transitions
 *
 * Task 247 coverage:
 *   The "Discharging…" pill appears on the Scores (Withdrawal Scores) tab while
 *   a patient's 4-second undo window is open on the Census tab.  The tab is
 *   implemented in vitals.tsx; its displayedPatients memo and isPendingDischarge
 *   prop follow the same pattern as MAR/Checks (covered in crossTabDischargeUndo).
 *
 *   Undo path:
 *     1. `startPendingDischarge(patient)` — patient optimistically removed from
 *        roster; pendingDischarge is set.
 *     2. Nurse navigates to the Scores tab — `displayedPatients` re-inserts the
 *        patient at the front; pill is shown via isPendingDischarge.
 *     3. Nurse taps Undo — `undoDischarge()` clears pendingDischarge and restores
 *        the patient to `patients`.
 *     4. `displayedPatients` now returns the patient normally — no pill, no fade.
 *
 *   Timer-expiry path:
 *     1. `startPendingDischarge(patient)` — same as above.
 *     2. The 4-second window elapses; pendingDischarge → null, patient NOT restored.
 *     3. `displayedPatients` no longer includes the patient at all.
 *
 * These tests exercise the same pure state machine used in
 * crossTabDischargeUndo.test.ts, with an additional `computeScoresDisplayedPatients`
 * helper that mirrors the filtering logic specific to vitals.tsx.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  program: 'Residential' | 'PHP' | 'IOP' | 'OP';
  bed: string;
  /** COWS withdrawal score; undefined = not on COWS protocol */
  cows?: number;
  /** CIWA-Ar withdrawal score; undefined = not on CIWA protocol */
  ciwa?: number;
}

interface PendingDischargeRecord {
  patient: Patient;
  expiresAt: number;
}

interface ContextState {
  patients: Patient[];
  pendingDischarge: PendingDischargeRecord | null;
  timerHandle: ReturnType<typeof setTimeout> | null;
  dischargedIds: Set<string>;
}

// ─── State-machine helpers (mirror PatientContext.tsx) ────────────────────────

const DISCHARGE_UNDO_MS = 4000;

function startPendingDischarge(
  state: ContextState,
  patient: Patient,
  now: number,
  scheduleTimer: (cb: () => void, ms: number) => ReturnType<typeof setTimeout>,
  onTimerFire: () => void,
): ContextState {
  if (state.pendingDischarge?.patient.id === patient.id) return state;

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

function commitDischarge(state: ContextState): ContextState {
  return {
    ...state,
    pendingDischarge: null,
    timerHandle: null,
  };
}

function undoDischarge(state: ContextState): ContextState {
  if (!state.pendingDischarge) return state;

  if (state.timerHandle !== null) {
    clearTimeout(state.timerHandle);
  }

  const patient = state.pendingDischarge.patient;
  const dischargedIds = new Set(state.dischargedIds);
  dischargedIds.delete(patient.id);

  const alreadyPresent = state.patients.some(p => p.id === patient.id);

  return {
    patients: alreadyPresent ? state.patients : [...state.patients, patient],
    pendingDischarge: null,
    timerHandle: null,
    dischargedIds,
  };
}

// ─── Display helpers (mirror the displayedPatients memo in vitals.tsx) ────────

/**
 * Mirrors the `displayedPatients` useMemo in VitalsScreen:
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
 * Mirrors the `allPatientsWithScores` derived value in VitalsScreen:
 *   displayedPatients filtered to only those with an active COWS or CIWA score.
 */
function computePatientsWithScores(
  patients: Patient[],
  pendingDischarge: PendingDischargeRecord | null,
): Patient[] {
  const displayed = computeDisplayedPatients(patients, pendingDischarge);
  return displayed.filter(
    p => (p.cows != null && p.cows > 0) || (p.ciwa != null && p.ciwa > 0),
  );
}

/**
 * Mirrors `isPendingDischarge` prop passed to PatientScoreRow:
 *   `pendingDischarge?.patient.id === patient.id`
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
    cows: 10, // on COWS protocol by default so the patient appears in the list
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

describe('Scores tab — pending-discharge pill while undo window is open', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('re-inserts the pending-discharge patient into the Scores list while the window is open', () => {
    const p1 = makePatient('p1', { cows: 10 });
    const p2 = makePatient('p2', { cows: 5 });
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());

    const withScores = computePatientsWithScores(state.patients, state.pendingDischarge);

    // p1 must be re-inserted even though it was removed from `patients`
    expect(withScores.map(p => p.id)).toContain('p1');
    // p1 should appear first (prepended)
    expect(withScores[0]?.id).toBe('p1');
    // other scored patient must still be present
    expect(withScores.map(p => p.id)).toContain('p2');
  });

  it('marks only the pending-discharge patient with isPendingDischarge=true on the Scores tab', () => {
    const p1 = makePatient('p1', { cows: 10 });
    const p2 = makePatient('p2', { ciwa: 8 });
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());

    expect(isPendingDischarge('p1', state.pendingDischarge)).toBe(true);
    expect(isPendingDischarge('p2', state.pendingDischarge)).toBe(false);
  });
});

describe('Scores tab — Undo path (nurse taps Undo while on Scores tab)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('Scores tab displays the patient normally (no pill) after undoDischarge', () => {
    const p1 = makePatient('p1', { cows: 10 });
    const p2 = makePatient('p2', { ciwa: 7 });
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    state = undoDischarge(state);

    const withScores = computePatientsWithScores(state.patients, state.pendingDischarge);

    // Patient is present in the Scores list
    expect(withScores.some(p => p.id === 'p1')).toBe(true);
    // No pending-discharge pill
    expect(isPendingDischarge('p1', state.pendingDischarge)).toBe(false);
  });

  it('Scores list length equals full scored roster after undo', () => {
    const p1 = makePatient('p1', { cows: 10 });
    const p2 = makePatient('p2', { cows: 5 });
    const p3 = makePatient('p3', { ciwa: 6 });
    let state = makeInitialState([p1, p2, p3]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());

    // During the window: all 3 scored patients are shown (p1 re-inserted)
    const duringWindow = computePatientsWithScores(state.patients, state.pendingDischarge);
    expect(duringWindow).toHaveLength(3);

    state = undoDischarge(state);

    // After undo: still 3 patients, all normal (pendingDischarge is null)
    const afterUndo = computePatientsWithScores(state.patients, state.pendingDischarge);
    expect(afterUndo).toHaveLength(3);
    for (const p of afterUndo) {
      expect(isPendingDischarge(p.id, state.pendingDischarge)).toBe(false);
    }
  });

  it('pendingDischarge is null after undoDischarge — pill cannot appear on Scores tab', () => {
    const p1 = makePatient('p1', { cows: 10 });
    let state = makeInitialState([p1]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    expect(state.pendingDischarge).not.toBeNull();

    state = undoDischarge(state);

    expect(state.pendingDischarge).toBeNull();
  });

  it('patient is restored to state.patients after undoDischarge so Scores tab can show them', () => {
    const p1 = makePatient('p1', { cows: 10 });
    const p2 = makePatient('p2', { cows: 3 });
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    expect(state.patients.some(p => p.id === 'p1')).toBe(false);

    state = undoDischarge(state);

    expect(state.patients.some(p => p.id === 'p1')).toBe(true);
  });
});

describe('Scores tab — timer-expiry path (undo window closes while nurse is on Scores tab)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('patient disappears entirely from Scores list after the undo window closes', () => {
    const p1 = makePatient('p1', { cows: 10 });
    const p2 = makePatient('p2', { cows: 5 });
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());

    // Simulate the 4-second timer firing — discharge committed
    state = commitDischarge(state);

    const withScores = computePatientsWithScores(state.patients, state.pendingDischarge);

    // p1 must be completely absent — not just missing the pill
    expect(withScores.some(p => p.id === 'p1')).toBe(false);
    expect(withScores).toHaveLength(1);
    expect(withScores[0]?.id).toBe('p2');
  });

  it('pendingDischarge is null after the timer fires', () => {
    const p1 = makePatient('p1', { cows: 10 });
    let state = makeInitialState([p1]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    state = commitDischarge(state);

    expect(state.pendingDischarge).toBeNull();
  });

  it('isPendingDischarge is false for all scored patients after timer fires', () => {
    const p1 = makePatient('p1', { cows: 10 });
    const p2 = makePatient('p2', { ciwa: 8 });
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());
    state = commitDischarge(state);

    const withScores = computePatientsWithScores(state.patients, state.pendingDischarge);
    for (const patient of withScores) {
      expect(isPendingDischarge(patient.id, state.pendingDischarge)).toBe(false);
    }
  });

  it('timer firing does not restore the patient to the Scores list', () => {
    const p1 = makePatient('p1', { cows: 10 });
    let state = makeInitialState([p1]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());

    // One scored patient removed during pending window
    expect(computePatientsWithScores(state.patients, state.pendingDischarge)).toHaveLength(1);

    state = commitDischarge(state);

    // After timer: list is empty — p1 was committed, not restored
    expect(computePatientsWithScores(state.patients, state.pendingDischarge)).toHaveLength(0);
  });
});

describe('Scores tab — patients without scores are unaffected by discharge/undo', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('a patient with no COWS/CIWA score does not appear in the scored section even when pending-discharge', () => {
    // Patient with no score (would appear in "No Active Protocol" section only)
    const p1 = makePatient('p1', { cows: undefined, ciwa: undefined });
    const p2 = makePatient('p2', { cows: 8 });
    let state = makeInitialState([p1, p2]);

    state = startPendingDischarge(state, p1, Date.now(), setTimeout, jest.fn());

    const withScores = computePatientsWithScores(state.patients, state.pendingDischarge);

    // p1 has no score so must not appear in the scored section
    expect(withScores.some(p => p.id === 'p1')).toBe(false);
    // p2 must still be present
    expect(withScores.some(p => p.id === 'p2')).toBe(true);
  });

  it('non-Residential pending-discharge patient is not re-inserted into the Scores list', () => {
    const phpPatient = makePatient('php1', { program: 'PHP', cows: 10 });
    const resPatient = makePatient('res1', { program: 'Residential', cows: 8 });
    let state = makeInitialState([resPatient, phpPatient]);

    state = startPendingDischarge(state, phpPatient, Date.now(), setTimeout, jest.fn());

    const withScores = computePatientsWithScores(state.patients, state.pendingDischarge);

    // PHP patient must not be re-inserted into Residential-only Scores list
    expect(withScores.some(p => p.id === 'php1')).toBe(false);
    // Residential patient must still appear
    expect(withScores.some(p => p.id === 'res1')).toBe(true);
  });
});
