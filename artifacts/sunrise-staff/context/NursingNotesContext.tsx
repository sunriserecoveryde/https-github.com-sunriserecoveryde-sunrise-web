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
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NoteType = 'observation' | 'med-update' | 'incident';

/** A single prior version of a note, captured before each edit */
export interface NoteHistoryEntry {
  text: string;
  noteType: NoteType;
  /** ISO timestamp of when this version was saved (i.e. when the edit happened) */
  savedAt: string;
  /** Display name of the nurse who made this edit */
  editedBy: string;
}

export interface NursingNote {
  id: string;
  text: string;
  noteType: NoteType;
  /** ISO timestamp when the note was created */
  createdAt: string;
  /** Formatted display time, e.g. "14:32" */
  displayTime: string;
  /** Prior versions, oldest first — appended each time the note is edited */
  history?: NoteHistoryEntry[];
  /** ISO timestamp of the most recent edit, for display in the note list */
  editedAt?: string;
  /** Display name of the nurse who most recently edited this note */
  editedBy?: string;
}

/** Pending-delete intent — kept in context so it survives navigation round-trips */
export interface PendingDeleteRecord {
  note: NursingNote;
  patientId: string;
  originalIndex: number;
  /** epoch-ms when the 4-second undo window closes */
  expiresAt: number;
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
  /** Update text and/or type of an existing note in-place (preserves id and timestamp) */
  updateNote: (patientId: string, noteId: string, text: string, noteType: NoteType, editedBy: string) => void;
  /** Remove a single note by id from a patient's note list */
  removeNote: (patientId: string, noteId: string) => void;
  /** Re-insert a previously removed note at a specific index (for undo) */
  restoreNote: (patientId: string, note: NursingNote, index: number) => void;
  /** Wipe all notes and clear storage — call on explicit logout / shift-end */
  clearNotes: () => void;
  /** True while loading from storage */
  loading: boolean;
  /**
   * Active pending-delete record (survives navigation).  The note has already
   * been removed from the store; call undoPendingDelete() within the window to
   * put it back, or let the timer expire to finalise the deletion.
   */
  pendingDelete: PendingDeleteRecord | null;
  /**
   * Remove a note optimistically and open the 4-second undo window.
   * Replaces any previously open window (prior deletion is finalised).
   */
  startPendingDelete: (patientId: string, note: NursingNote, originalIndex: number) => void;
  /** Restore the pending note and close the undo window. */
  undoPendingDelete: () => void;
  /** Close the undo window without restoring (called when the timer fires). */
  clearPendingDelete: () => void;
}

const NursingNotesContext = createContext<NursingNotesContextType>({
  getNotesForPatient: () => [],
  addNote: () => {},
  updateNote: () => {},
  removeNote: () => {},
  restoreNote: () => {},
  clearNotes: () => {},
  loading: false,
  pendingDelete: null,
  startPendingDelete: () => {},
  undoPendingDelete: () => {},
  clearPendingDelete: () => {},
});

export function NursingNotesProvider({ children }: { children: React.ReactNode }) {
  // Map of patientId → notes (newest first)
  const [notesByPatient, setNotesByPatient] = useState<Record<string, NursingNote[]>>({});
  const [loading, setLoading] = useState(true);

  // ─── Persistent pending-delete (survives navigation) ───────────────────────
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteRecord | null>(null);
  const pendingDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const updateNote = useCallback(
    (patientId: string, noteId: string, text: string, noteType: NoteType, editedBy: string) => {
      const savedAt = new Date().toISOString();
      setNotesByPatient(prev => ({
        ...prev,
        [patientId]: (prev[patientId] ?? []).map(n => {
          if (n.id !== noteId) return n;
          // Snapshot the current version into history before overwriting
          const historyEntry: NoteHistoryEntry = {
            text: n.text,
            noteType: n.noteType,
            savedAt,
            editedBy,
          };
          return {
            ...n,
            text,
            noteType,
            editedAt: savedAt,
            editedBy,
            history: [...(n.history ?? []), historyEntry],
          };
        }),
      }));
    },
    [],
  );

  const removeNote = useCallback((patientId: string, noteId: string) => {
    setNotesByPatient(prev => ({
      ...prev,
      [patientId]: (prev[patientId] ?? []).filter(n => n.id !== noteId),
    }));
  }, []);

  const restoreNote = useCallback((patientId: string, note: NursingNote, _index: number) => {
    setNotesByPatient(prev => {
      const current = prev[patientId] ?? [];
      const next = [...current];

      // Compute the correct insertion position from the note's timestamp so that
      // the restored note lands in the right chronological slot even if another
      // note was deleted (and committed) while the undo toast was still showing.
      // Notes are stored newest-first, so we insert immediately before the first
      // entry whose createdAt is strictly older than the note being restored.
      const noteTime = new Date(note.createdAt).getTime();
      let insertAt = next.findIndex(
        n => new Date(n.createdAt).getTime() < noteTime,
      );
      // If every remaining note is newer (or the list is empty), append at the end.
      if (insertAt === -1) insertAt = next.length;

      next.splice(insertAt, 0, note);
      return { ...prev, [patientId]: next };
    });
  }, []);

  const clearNotes = useCallback(() => {
    setNotesByPatient({});
    AsyncStorage.removeItem(NOTES_KEY).catch(() => {});
  }, []);

  // Cancel the pending-delete timer if the provider unmounts (e.g. full app
  // teardown during testing).  In normal usage the provider lives for the whole
  // app lifetime, but the cleanup prevents stray setPendingDelete calls in any
  // environment that does unmount the tree.
  useEffect(() => {
    return () => {
      if (pendingDeleteTimerRef.current) {
        clearTimeout(pendingDeleteTimerRef.current);
        pendingDeleteTimerRef.current = null;
      }
    };
  }, []);

  // ─── Pending-delete helpers ────────────────────────────────────────────────

  const clearPendingDelete = useCallback(() => {
    if (pendingDeleteTimerRef.current) {
      clearTimeout(pendingDeleteTimerRef.current);
      pendingDeleteTimerRef.current = null;
    }
    setPendingDelete(null);
  }, []);

  const startPendingDelete = useCallback(
    (patientId: string, note: NursingNote, originalIndex: number) => {
      // Cancel any existing window (previous deletion is already committed)
      if (pendingDeleteTimerRef.current) {
        clearTimeout(pendingDeleteTimerRef.current);
        pendingDeleteTimerRef.current = null;
      }
      // Remove the note from the store immediately (optimistic)
      setNotesByPatient(prev => ({
        ...prev,
        [patientId]: (prev[patientId] ?? []).filter(n => n.id !== note.id),
      }));
      const expiresAt = Date.now() + 4000;
      setPendingDelete({ note, patientId, originalIndex, expiresAt });
      pendingDeleteTimerRef.current = setTimeout(() => {
        setPendingDelete(null);
        pendingDeleteTimerRef.current = null;
      }, 4000);
    },
    [],
  );

  const undoPendingDelete = useCallback(() => {
    if (!pendingDelete) return;
    if (pendingDeleteTimerRef.current) {
      clearTimeout(pendingDeleteTimerRef.current);
      pendingDeleteTimerRef.current = null;
    }
    // Re-insert the note in chronological order (newest-first list)
    const { patientId, note } = pendingDelete;
    setNotesByPatient(prev => {
      const current = prev[patientId] ?? [];
      const next = [...current];
      const noteTime = new Date(note.createdAt).getTime();
      let insertAt = next.findIndex(n => new Date(n.createdAt).getTime() < noteTime);
      if (insertAt === -1) insertAt = next.length;
      next.splice(insertAt, 0, note);
      return { ...prev, [patientId]: next };
    });
    setPendingDelete(null);
  }, [pendingDelete]);

  return (
    <NursingNotesContext.Provider
      value={{
        getNotesForPatient,
        addNote,
        updateNote,
        removeNote,
        restoreNote,
        clearNotes,
        loading,
        pendingDelete,
        startPendingDelete,
        undoPendingDelete,
        clearPendingDelete,
      }}
    >
      {children}
    </NursingNotesContext.Provider>
  );
}

export function useNursingNotes() {
  return useContext(NursingNotesContext);
}
