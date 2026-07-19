/**
 * NursingNotesContext
 *
 * Keeps session-level nursing notes alive for the duration of the shift.
 * Notes are stored in memory, keyed by patient ID, so navigating away
 * from a patient detail screen and returning still shows any notes added
 * earlier in the session.
 *
 * Notes are cleared on logout / shift end (the provider unmounts), which is
 * consistent with how MdAcknowledgmentContext behaves.
 */
import React, { createContext, useCallback, useContext, useState } from 'react';

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

interface NursingNotesContextType {
  /** All notes for a given patient, most-recent first */
  getNotesForPatient: (patientId: string) => NursingNote[];
  addNote: (patientId: string, text: string, noteType: NoteType) => void;
}

const NursingNotesContext = createContext<NursingNotesContextType>({
  getNotesForPatient: () => [],
  addNote: () => {},
});

export function NursingNotesProvider({ children }: { children: React.ReactNode }) {
  // Map of patientId → notes (newest first)
  const [notesByPatient, setNotesByPatient] = useState<Record<string, NursingNote[]>>({});

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

  return (
    <NursingNotesContext.Provider value={{ getNotesForPatient, addNote }}>
      {children}
    </NursingNotesContext.Provider>
  );
}

export function useNursingNotes() {
  return useContext(NursingNotesContext);
}
