/**
 * SessionChartContext — in-memory chart store for the demo session.
 *
 * All state lives in React useState only. No localStorage, no sessionStorage.
 * Everything resets when the page is refreshed — by design for the demo.
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProgressNote, TreatmentGoal, Program } from '../data/mockPatients';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionNote extends ProgressNote {
  patientId: string;
  patientFirstName: string;
  patientLastName: string;
  program: Program;
}

export type SectionKey =
  | 'presenting' | 'substances' | 'medical' | 'psychiatric' | 'legal'
  | 'family' | 'social' | 'trauma' | 'strengths' | 'diagnostic' | 'summary';

interface SessionChartContextValue {
  /** Progress notes created this session (prepended, newest first) */
  notes: SessionNote[];
  /** Treatment goals added this session, keyed by patientId */
  goals: Record<string, TreatmentGoal[]>;
  /** Goal status overrides for all goals (mock + session), keyed by goalId */
  goalStatuses: Record<string, TreatmentGoal['status']>;
  /** Bio assessment completed sections per patient */
  bioCompletedSections: Record<string, SectionKey[]>;

  addNote: (note: SessionNote) => void;
  addGoal: (patientId: string, goal: TreatmentGoal) => void;
  setGoalStatus: (goalId: string, status: TreatmentGoal['status']) => void;
  completeBioSection: (patientId: string, section: SectionKey) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const SessionChartContext = createContext<SessionChartContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function SessionChartProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [goals, setGoals] = useState<Record<string, TreatmentGoal[]>>({});
  const [goalStatuses, setGoalStatuses] = useState<Record<string, TreatmentGoal['status']>>({});
  // p1 (Marcus Webb) starts with all sections complete so the demo patient is blank
  const [bioCompletedSections, setBioCompletedSections] = useState<Record<string, SectionKey[]>>({
    p1: ['presenting', 'substances', 'medical', 'psychiatric', 'legal', 'family', 'social', 'trauma', 'strengths', 'diagnostic', 'summary'],
  });

  const addNote = (note: SessionNote) =>
    setNotes(prev => [note, ...prev]);

  const addGoal = (patientId: string, goal: TreatmentGoal) =>
    setGoals(prev => ({ ...prev, [patientId]: [...(prev[patientId] ?? []), goal] }));

  const setGoalStatus = (goalId: string, status: TreatmentGoal['status']) =>
    setGoalStatuses(prev => ({ ...prev, [goalId]: status }));

  const completeBioSection = (patientId: string, section: SectionKey) =>
    setBioCompletedSections(prev => {
      const existing = prev[patientId] ?? [];
      if (existing.includes(section)) return prev;
      return { ...prev, [patientId]: [...existing, section] };
    });

  return (
    <SessionChartContext.Provider value={{
      notes, goals, goalStatuses, bioCompletedSections,
      addNote, addGoal, setGoalStatus, completeBioSection,
    }}>
      {children}
    </SessionChartContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSessionChart(): SessionChartContextValue {
  const ctx = useContext(SessionChartContext);
  if (!ctx) throw new Error('useSessionChart must be used inside SessionChartProvider');
  return ctx;
}
