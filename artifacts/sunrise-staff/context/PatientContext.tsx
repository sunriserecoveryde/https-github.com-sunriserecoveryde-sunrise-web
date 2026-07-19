/**
 * PatientContext
 *
 * Manages the live patient roster with AsyncStorage persistence.
 * Replaces direct imports of PATIENTS / RESIDENTIAL_PATIENTS from mockData.ts
 * so that admits and discharges survive app restarts.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PATIENTS, BEDS as STATIC_BEDS, Patient, BedStatus } from '@/data/mockData';

const PATIENTS_KEY = '@sunrise_patients_v1';
/** Written once after the first admit/discharge so we can distinguish
 *  "never interacted" (fall back to seeds) from "intentionally empty". */
const PATIENTS_SEEDED_KEY = '@sunrise_patients_seeded_v1';

// ── Bed helpers ────────────────────────────────────────────────────────────────

/** Derive live bed status from the active patient roster.
 *
 *  Rules:
 *  - Patient currently assigned to the bed  → 'Occupied'
 *  - Bed never seeded as Occupied (e.g. 5A Cleaning, 6A Available) → keep its static status
 *  - Bed seeded as Occupied but patient was discharged → 'Available'
 *    (a real facility would set to 'Cleaning', but for the demo 'Available' is cleaner UX)
 */
export function deriveBedStatus(patients: Patient[]): Record<string, BedStatus> {
  const occupiedBeds = new Set(patients.map(p => p.bed).filter(Boolean));
  const map: Record<string, BedStatus> = {};
  for (const b of STATIC_BEDS) {
    if (occupiedBeds.has(b.id)) {
      map[b.id] = 'Occupied';
    } else if (b.status !== 'Occupied') {
      // Never had a patient in the seed data — retain its static non-Occupied status
      map[b.id] = b.status;
    } else {
      // Was seeded as Occupied but patient has been discharged → now Available
      map[b.id] = 'Available';
    }
  }
  return map;
}

// ── Context definition ─────────────────────────────────────────────────────────

interface PatientContextValue {
  /** All active (non-discharged) patients */
  patients: Patient[];
  /** Convenience: residential patients only */
  residentialPatients: Patient[];
  /** Bed ID → BedStatus, computed from live patients */
  bedStatusMap: Record<string, BedStatus>;
  /** Mark a patient as discharged (removes from active roster) */
  dischargePatient: (id: string) => void;
  /** Admit a new patient (adds to active roster) */
  admitPatient: (patient: Patient) => void;
  /** True while loading from storage */
  loading: boolean;
}

const PatientContext = createContext<PatientContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(PATIENTS);
  const [loading, setLoading] = useState(true);

  // Load persisted patient list on mount.
  // We use a sentinel key to distinguish "never saved" from "saved as empty":
  // once the user has ever admitted/discharged, we trust the stored array
  // even if it is empty (fully-discharged census).
  useEffect(() => {
    AsyncStorage.multiGet([PATIENTS_KEY, PATIENTS_SEEDED_KEY]).then(([[, raw], [, seeded]]) => {
      if (seeded === 'true' && raw !== null) {
        try {
          const saved = JSON.parse(raw) as Patient[];
          if (Array.isArray(saved)) {
            setPatients(saved);
          }
        } catch {
          // ignore corrupt data — fall back to mock
        }
      }
      setLoading(false);
    });
  }, []);

  // Persist whenever the list changes (skip initial load).
  // Also write the sentinel so future launches know the stored data is authoritative
  // even when the array is empty (fully-discharged census).
  useEffect(() => {
    if (!loading) {
      AsyncStorage.multiSet([
        [PATIENTS_KEY, JSON.stringify(patients)],
        [PATIENTS_SEEDED_KEY, 'true'],
      ]).catch(() => {});
    }
  }, [patients, loading]);

  const dischargePatient = useCallback((id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  }, []);

  const admitPatient = useCallback((patient: Patient) => {
    setPatients(prev => [...prev, patient]);
  }, []);

  const residentialPatients = patients.filter(p => p.program === 'Residential');
  const bedStatusMap = deriveBedStatus(patients);

  return (
    <PatientContext.Provider
      value={{ patients, residentialPatients, bedStatusMap, dischargePatient, admitPatient, loading }}
    >
      {children}
    </PatientContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function usePatients() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatients must be used inside PatientProvider');
  return ctx;
}
