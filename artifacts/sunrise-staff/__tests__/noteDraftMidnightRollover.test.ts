/**
 * Unit tests — note-draft midnight-rollover guard (Task 527).
 *
 * Before this fix, DRAFT_KEY was `@sunrise_note_draft_<id>` (no date scope).
 * A draft written just before midnight would survive into the next shift and
 * pre-fill the note modal with yesterday's text.
 *
 * After the fix, DRAFT_KEY is produced by `makeDraftNoteKey(patientId, date)`,
 * e.g. `@sunrise_note_draft_p1_2026-07-26`.  When `openNoteModal` runs on a
 * new calendar day it derives the new day's key, finds nothing in storage, and
 * starts with an empty text field.  The previous day's key is silently orphaned
 * and can be swept by pruneStaleStorageKeys on the next launch.
 *
 * Coverage:
 *   1. makeDraftNoteKey embeds the calendar date, so keys for different dates
 *      are different even for the same patient.
 *   2. A draft written under yesterday's key is NOT found when the new day's
 *      key is looked up — simulates the force-quit + date-rollover scenario.
 *   3. A draft written under today's key IS found on the same day — normal
 *      autosave-restore path still works.
 *   4. pruneStaleStorageKeys removes the previous day's draft key, leaving the
 *      current day's key intact.
 *
 * No React Native, Expo, or AsyncStorage imports needed — all helpers are pure
 * Node-compatible functions from coldStartLoadHelpers.ts.
 */

import {
  makeDraftNoteKey,
  formatDateKey,
  pruneStaleStorageKeys,
  type StorageAdapter,
} from '../lib/coldStartLoadHelpers';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PATIENT_ID = 'patient-42';
const TODAY_STR = '2026-07-26';
const YESTERDAY_STR = '2026-07-25';
const TODAY = new Date(`${TODAY_STR}T00:00:00Z`);
const YESTERDAY = new Date(`${YESTERDAY_STR}T23:59:59Z`);

const DRAFT_PREFIX = `@sunrise_note_draft_${PATIENT_ID}_`;

// ─── Mock storage ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — makeDraftNoteKey key structure
// ─────────────────────────────────────────────────────────────────────────────

describe('makeDraftNoteKey — key structure and date scoping', () => {
  it('produces a key that contains the patient id and the formatted date', () => {
    const key = makeDraftNoteKey(PATIENT_ID, TODAY);
    expect(key).toBe(`@sunrise_note_draft_${PATIENT_ID}_${TODAY_STR}`);
  });

  it('produces different keys for the same patient on different calendar days', () => {
    const todayKey = makeDraftNoteKey(PATIENT_ID, TODAY);
    const yesterdayKey = makeDraftNoteKey(PATIENT_ID, YESTERDAY);
    expect(todayKey).not.toBe(yesterdayKey);
  });

  it('produces different keys for different patients on the same day', () => {
    const keyA = makeDraftNoteKey('patient-A', TODAY);
    const keyB = makeDraftNoteKey('patient-B', TODAY);
    expect(keyA).not.toBe(keyB);
  });

  it('key for yesterday ends with the previous date string', () => {
    const key = makeDraftNoteKey(PATIENT_ID, YESTERDAY);
    expect(key.endsWith(YESTERDAY_STR)).toBe(true);
  });

  it('key for today ends with the current date string', () => {
    const key = makeDraftNoteKey(PATIENT_ID, TODAY);
    expect(key.endsWith(TODAY_STR)).toBe(true);
  });

  it('date part matches formatDateKey output for the same Date', () => {
    const arbitrary = new Date('2026-03-15T12:34:56Z');
    const key = makeDraftNoteKey('p1', arbitrary);
    expect(key).toContain(formatDateKey(arbitrary));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — midnight-rollover scenario
//
// Simulates:
//   1. Nurse opens note modal just before midnight → autosave writes draft
//      under yesterday's date-scoped key.
//   2. App is force-quit at midnight (calendar day advances).
//   3. On the next shift, openNoteModal derives today's key and reads storage.
//      No entry exists under today's key → modal opens with empty text.
// ─────────────────────────────────────────────────────────────────────────────

describe('draft midnight-rollover — stale draft is never pre-filled', () => {
  it('looking up today\'s key finds nothing when the draft was written under yesterday\'s key', async () => {
    // Step 1: simulate autosave just before midnight.
    const yesterdayKey = makeDraftNoteKey(PATIENT_ID, YESTERDAY);
    const storage = makeMemoryStorage({
      [yesterdayKey]: "Patient reports high anxiety and difficulty sleeping...",
    });

    // Step 2+3: on the new day, openNoteModal derives today's key and reads it.
    const todayKey = makeDraftNoteKey(PATIENT_ID, TODAY);
    const saved = await storage.getItem(todayKey);

    // The draft under yesterday's key must NOT be visible — modal opens empty.
    expect(saved).toBeNull();
  });

  it('the stale draft is still physically in storage under its old key', async () => {
    // Confirms the orphaned key is simply ignored, not magically found.
    const yesterdayKey = makeDraftNoteKey(PATIENT_ID, YESTERDAY);
    const draftText = 'Yesterday\'s unfinished note text.';
    const storage = makeMemoryStorage({ [yesterdayKey]: draftText });

    // The old key is still there.
    const old = await storage.getItem(yesterdayKey);
    expect(old).toBe(draftText);

    // But the new day's key returns null.
    const todayKey = makeDraftNoteKey(PATIENT_ID, TODAY);
    const fresh = await storage.getItem(todayKey);
    expect(fresh).toBeNull();
  });

  it('does not pre-fill from a key written two shifts ago either', async () => {
    const twoDaysAgo = new Date('2026-07-24T22:00:00Z');
    const oldKey = makeDraftNoteKey(PATIENT_ID, twoDaysAgo);
    const storage = makeMemoryStorage({ [oldKey]: 'Very old draft.' });

    const todayKey = makeDraftNoteKey(PATIENT_ID, TODAY);
    const saved = await storage.getItem(todayKey);
    expect(saved).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — same-day autosave-restore path still works
// ─────────────────────────────────────────────────────────────────────────────

describe('draft same-day restore — autosave still works within a shift', () => {
  it('looking up today\'s key finds the draft when it was written under today\'s key', async () => {
    const todayKey = makeDraftNoteKey(PATIENT_ID, TODAY);
    const draftText = 'Nurse started typing a note but switched to check vitals.';
    const storage = makeMemoryStorage({ [todayKey]: draftText });

    const saved = await storage.getItem(todayKey);
    expect(saved).toBe(draftText);
  });

  it('autosave → close-without-submit → reopen restores draft on the same day', async () => {
    const storage = makeMemoryStorage();
    const todayKey = makeDraftNoteKey(PATIENT_ID, TODAY);
    const draftText = 'Initial observation: patient appears calm.';

    // Autosave (useEffect in openNoteModal)
    await storage.setItem(todayKey, draftText);

    // App backgrounded / modal closed without submitting — key NOT cleared.
    // Reopen: derive today's key and read.
    const todayKeyOnReopen = makeDraftNoteKey(PATIENT_ID, TODAY);
    const restored = await storage.getItem(todayKeyOnReopen);
    expect(restored).toBe(draftText);
  });

  it('draft key is cleared after the note is submitted', async () => {
    const storage = makeMemoryStorage();
    const todayKey = makeDraftNoteKey(PATIENT_ID, TODAY);

    await storage.setItem(todayKey, 'Final note text.');
    // submitNote calls AsyncStorage.removeItem(DRAFT_KEY)
    await storage.multiRemove([todayKey]);

    const saved = await storage.getItem(todayKey);
    expect(saved).toBeNull();
  });

  it('draft key is cleared when the modal is closed normally', async () => {
    const storage = makeMemoryStorage();
    const todayKey = makeDraftNoteKey(PATIENT_ID, TODAY);

    await storage.setItem(todayKey, 'Partially typed...');
    // closeNoteModal calls AsyncStorage.removeItem(DRAFT_KEY)
    await storage.multiRemove([todayKey]);

    const saved = await storage.getItem(todayKey);
    expect(saved).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 — pruneStaleStorageKeys removes orphaned draft keys
// ─────────────────────────────────────────────────────────────────────────────

describe('pruneStaleStorageKeys — previous-day draft keys are cleaned up on launch', () => {
  it('removes yesterday\'s draft key while keeping today\'s', async () => {
    const todayKey = makeDraftNoteKey(PATIENT_ID, TODAY);
    const yesterdayKey = makeDraftNoteKey(PATIENT_ID, YESTERDAY);

    const storage = makeMemoryStorage({
      [todayKey]: 'Today draft',
      [yesterdayKey]: 'Yesterday draft (stale)',
    });

    await pruneStaleStorageKeys(storage, [
      { prefix: DRAFT_PREFIX, currentKey: todayKey },
    ]);

    expect(storage.store[todayKey]).toBe('Today draft');
    expect(storage.store[yesterdayKey]).toBeUndefined();
  });

  it('removes multiple stale draft keys from different patients on launch', async () => {
    const patientA = 'patient-A';
    const patientB = 'patient-B';
    const prefixA = `@sunrise_note_draft_${patientA}_`;
    const prefixB = `@sunrise_note_draft_${patientB}_`;

    const todayKeyA = makeDraftNoteKey(patientA, TODAY);
    const todayKeyB = makeDraftNoteKey(patientB, TODAY);
    const staleKeyA = makeDraftNoteKey(patientA, YESTERDAY);
    const staleKeyB = makeDraftNoteKey(patientB, YESTERDAY);

    const storage = makeMemoryStorage({
      [todayKeyA]: 'Draft A today',
      [todayKeyB]: 'Draft B today',
      [staleKeyA]: 'Draft A stale',
      [staleKeyB]: 'Draft B stale',
    });

    await pruneStaleStorageKeys(storage, [
      { prefix: prefixA, currentKey: todayKeyA },
      { prefix: prefixB, currentKey: todayKeyB },
    ]);

    expect(storage.store[todayKeyA]).toBe('Draft A today');
    expect(storage.store[todayKeyB]).toBe('Draft B today');
    expect(storage.store[staleKeyA]).toBeUndefined();
    expect(storage.store[staleKeyB]).toBeUndefined();
  });

  it('leaves today\'s key untouched when there are no stale keys', async () => {
    const todayKey = makeDraftNoteKey(PATIENT_ID, TODAY);
    const storage = makeMemoryStorage({ [todayKey]: 'Today draft' });

    await pruneStaleStorageKeys(storage, [
      { prefix: DRAFT_PREFIX, currentKey: todayKey },
    ]);

    expect(storage.store[todayKey]).toBe('Today draft');
  });

  it('is a no-op when storage is empty', async () => {
    const todayKey = makeDraftNoteKey(PATIENT_ID, TODAY);
    const storage = makeMemoryStorage();

    await expect(
      pruneStaleStorageKeys(storage, [{ prefix: DRAFT_PREFIX, currentKey: todayKey }]),
    ).resolves.toBeUndefined();
  });
});
