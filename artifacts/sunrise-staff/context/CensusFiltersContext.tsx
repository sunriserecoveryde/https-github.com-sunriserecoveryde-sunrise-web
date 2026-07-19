import React, { createContext, useCallback, useContext, useState } from 'react';

export type NoteFilter = 'observation' | 'med-update' | 'incident';
export type AcuityFilter = 'All' | 'Critical' | 'High' | 'Moderate' | 'Routine' | 'Available';

interface CensusFiltersState {
  acuityFilter: AcuityFilter;
  noteFilter: NoteFilter | null;
}

interface CensusFiltersContextValue extends CensusFiltersState {
  setAcuityFilter: (filter: AcuityFilter) => void;
  setNoteFilter: (filter: NoteFilter | null) => void;
  resetFilters: () => void;
}

const DEFAULT_STATE: CensusFiltersState = {
  acuityFilter: 'All',
  noteFilter: null,
};

const CensusFiltersContext = createContext<CensusFiltersContextValue | null>(null);

export function CensusFiltersProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CensusFiltersState>(DEFAULT_STATE);

  const setAcuityFilter = useCallback((filter: AcuityFilter) => {
    setState(prev => ({ ...prev, acuityFilter: filter }));
  }, []);

  const setNoteFilter = useCallback((filter: NoteFilter | null) => {
    setState(prev => ({ ...prev, noteFilter: filter }));
  }, []);

  const resetFilters = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return (
    <CensusFiltersContext.Provider value={{ ...state, setAcuityFilter, setNoteFilter, resetFilters }}>
      {children}
    </CensusFiltersContext.Provider>
  );
}

export function useCensusFilters(): CensusFiltersContextValue {
  const ctx = useContext(CensusFiltersContext);
  if (!ctx) throw new Error('useCensusFilters must be used inside CensusFiltersProvider');
  return ctx;
}
