/**
 * NursingNotesContext
 *
 * Keeps nursing notes alive across app restarts and re-logins for the
 * duration of the current shift (calendar day).  Notes are persisted to
 * AsyncStorage using the same pattern as PatientContext.
 *
 * Shift-end / date-rollover behaviour:
 *  - On load, if the stored notes were saved on a previous calendar day they
 *    are discarded and storage is cleared — matching "shift end at midnight".
 *  - If the nurse explicitly logs out via the logout/shift-end action the
 *    caller may invoke `clearNotes()` to wipe storage immediately.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NoteType = 'observation' | 'med-update' | 'incident';

export interface NursingNote {
  id: string;
  text: string;
  noteType: NoteType;
  /** ISO timestamp when the note was created */
  createdAt: string;
  /** Formatted display time, e.g. "14:32" */
  displayTime: string;
}

/** Shape written to AsyncStorage */
interface PersistedNotes {
  /** YYYY-MM-DD — the shift date these notes belong to */
  shiftDate: string;
  notesByPatient: Record<string, NursingNote[]>;
}

const NOTES_KEY = '@sunrise_nursing_notes_v1';

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface NursingNotesContextType {
  /** All notes for a given patient, most-recent first */
  getNotesForPatient: (patientId: string) => NursingNote[];
  addNote: (patientId: string, text: string, noteType: NoteType) => void;
  /** Remove a single note by id from a patient's note list */
  removeNote: (patientId: string, noteId: string) => void;
  /** Wipe all notes and clear storage — call on explicit logout / shift-end */
  clearNotes: () => void;
  /** True while loading from storage */
  loading: boolean;
}

const NursingNotesContext = createContext<NursingNotesContextType>({
  getNotesForPatient: () => [],
  addNote: () => {},
  removeNote: () => {},
  clearNotes: () => {},
  loading: false,
});

export function NursingNotesProvider({ children }: { children: React.ReactNode }) {
  // Map of patientId → notes (newest first)
  const [notesByPatient, setNotesByPatient] = useState<Record<string, NursingNote[]>>({});
  const [loading, setLoading] = useState(true);

  // Load persisted notes on mount; discard if they belong to a previous day.
  useEffect(() => {
    AsyncStorage.getItem(NOTES_KEY)
      .then(raw => {
        if (raw !== null) {
          try {
            const saved = JSON.parse(raw) as PersistedNotes;
            if (saved.shiftDate === todayDateString() && saved.notesByPatient) {
              setNotesByPatient(saved.notesByPatient);
            } else {
              // Previous shift's notes — discard silently
              AsyncStorage.removeItem(NOTES_KEY).catch(() => {});
            }
          } catch {
            // Corrupt data — fall back to empty
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Persist whenever notes change (skip during initial load).
  useEffect(() => {
    if (loading) return;
    const payload: PersistedNotes = {
      shiftDate: todayDateString(),
      notesByPatient,
    };
    AsyncStorage.setItem(NOTES_KEY, JSON.stringify(payload)).catch(() => {});
  }, [notesByPatient, loading]);

  const getNotesForPatient = useCallback(
    (patientId: string): NursingNote[] => notesByPatient[patientId] ?? [],
    [notesByPatient],
  );

  const addNote = useCallback((patientId: string, text: string, noteType: NoteType) => {
    const now = new Date();
    const displayTime = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const note: NursingNote = {
      id: `${patientId}-${now.getTime()}`,
      text,
      noteType,
      createdAt: now.toISOString(),
      displayTime,
    };
    setNotesByPatient(prev => ({
      ...prev,
      [patientId]: [note, ...(prev[patientId] ?? [])],
    }));
  }, []);

  const removeNote = useCallback((patientId: string, noteId: string) => {
    setNotesByPatient(prev => ({
      ...prev,
      [patientId]: (prev[patientId] ?? []).filter(n => n.id !== noteId),
    }));
  }, []);

  const clearNotes = useCallback(() => {
    setNotesByPatient({});
    AsyncStorage.removeItem(NOTES_KEY).catch(() => {});
  }, []);

  return (
    <NursingNotesContext.Provider value={{ getNotesForPatient, addNote, removeNote, clearNotes, loading }}>
      {children}
    </NursingNotesContext.Provider>
  );
}

export function useNursingNotes() {
  return useContext(NursingNotesContext);
}
