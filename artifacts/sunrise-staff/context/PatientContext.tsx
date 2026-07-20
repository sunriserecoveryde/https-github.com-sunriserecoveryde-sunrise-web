/**
 * PatientContext
 *
 * Manages the live patient roster with AsyncStorage persistence.
 * Replaces direct imports of PATIENTS / RESIDENTIAL_PATIENTS from mockData.ts
 * so that admits and discharges survive app restarts.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PATIENTS, BEDS as STATIC_BEDS, Patient, BedStatus } from '@/data/mockData';
import { fetchCensus } from '@/lib/api';

const PATIENTS_KEY = '@sunrise_patients_v1';
/** Written once after the first admit/discharge so we can distinguish
 *  "never interacted" (fall back to seeds) from "intentionally empty". */
const PATIENTS_SEEDED_KEY = '@sunrise_patients_seeded_v1';
/** IDs of patients locally discharged this session — never re-add from API. */
const DISCHARGED_IDS_KEY = '@sunrise_discharged_ids_v1';

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

// ── Discharge undo ─────────────────────────────────────────────────────────────

/** Pending-discharge intent — kept in context so the undo window survives
 *  brief tab-switches (same pattern as PendingDeleteRecord in NursingNotesContext). */
export interface PendingDischargeRecord {
  patient: Patient;
  /** epoch-ms when the 4-second undo window closes */
  expiresAt: number;
}

// ── Context definition ─────────────────────────────────────────────────────────

/** Pending-discharge intent — survives navigation within the same app session */
export interface PendingDischargeRecord {
  patient: Patient;
  /** epoch-ms when the 4-second undo window closes */
  expiresAt: number;
}

interface PatientContextValue {
  /** All active (non-discharged) patients */
  patients: Patient[];
  /** Convenience: residential patients only */
  residentialPatients: Patient[];
  /** Bed ID → BedStatus, computed from live patients */
  bedStatusMap: Record<string, BedStatus>;
  /** Mark a patient as discharged immediately (no undo window) */
  dischargePatient: (id: string) => void;
  /**
   * Optimistically remove the patient and open a 4-second undo window.
   * The discharge is finalised when the timer fires or clearPendingDischarge is
   * called; call undoDischarge() within the window to reverse it.
   */
  startPendingDischarge: (patient: Patient) => void;
  /** Restore the pending patient and close the undo window. */
  undoDischarge: () => void;
  /** Close the undo window without restoring (called when the timer fires). */
  clearPendingDischarge: () => void;
  /** Active pending-discharge record (survives navigation). */
  pendingDischarge: PendingDischargeRecord | null;
  /** Admit a new patient (adds to active roster) */
  admitPatient: (patient: Patient) => void;
  /** True while loading from storage */
  loading: boolean;
  /** Fetch fresh census data from the API and update patient state */
  refreshFromApi: () => Promise<void>;
}

const PatientContext = createContext<PatientContextValue | null>(null);

const DISCHARGE_UNDO_MS = 4000;

// ── Provider ───────────────────────────────────────────────────────────────────

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(PATIENTS);
  const [loading, setLoading] = useState(true);
  /** IDs discharged locally — never re-added from API refresh. */
  const dischargedIds = React.useRef<Set<string>>(new Set());

  // ── Pending-discharge undo window ─────────────────────────────────────────
  const [pendingDischarge, setPendingDischarge] = useState<PendingDischargeRecord | null>(null);
  const pendingDischargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Mirrors pendingDischarge.patient.id synchronously so startPendingDischarge
   *  can do a fast early-exit without reading React state. */
  const pendingDischargeIdRef = useRef<string | null>(null);

  // Load persisted patient list on mount.
  // We use a sentinel key to distinguish "never saved" from "saved as empty":
  // once the user has ever admitted/discharged, we trust the stored array
  // even if it is empty (fully-discharged census).
  useEffect(() => {
    AsyncStorage.multiGet([PATIENTS_KEY, PATIENTS_SEEDED_KEY, DISCHARGED_IDS_KEY])
      .then(([[, raw], [, seeded], [, discharged]]) => {
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
        if (discharged !== null) {
          try {
            const ids = JSON.parse(discharged) as string[];
            if (Array.isArray(ids)) {
              dischargedIds.current = new Set(ids);
            }
          } catch { /* ignore */ }
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
    dischargedIds.current.add(id);
    AsyncStorage.setItem(DISCHARGED_IDS_KEY, JSON.stringify([...dischargedIds.current])).catch(() => {});
    setPatients(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearPendingDischarge = useCallback(() => {
    if (pendingDischargeTimerRef.current) {
      clearTimeout(pendingDischargeTimerRef.current);
      pendingDischargeTimerRef.current = null;
    }
    pendingDischargeIdRef.current = null;
    setPendingDischarge(null);
  }, []);

  const startPendingDischarge = useCallback((patient: Patient) => {
    // Guard: if this exact patient is already pending discharge, do nothing.
    // Re-entering the screen via deep-link or history during the undo window
    // must not trigger a second discharge cycle.
    if (pendingDischargeIdRef.current === patient.id) return;

    // Cancel any previously open window for a *different* patient
    if (pendingDischargeTimerRef.current) {
      clearTimeout(pendingDischargeTimerRef.current);
      pendingDischargeTimerRef.current = null;
    }

    // Optimistically remove the patient and mark as discharged
    dischargedIds.current.add(patient.id);
    AsyncStorage.setItem(DISCHARGED_IDS_KEY, JSON.stringify([...dischargedIds.current])).catch(() => {});
    setPatients(prev => prev.filter(p => p.id !== patient.id));

    const expiresAt = Date.now() + DISCHARGE_UNDO_MS;
    pendingDischargeIdRef.current = patient.id;
    setPendingDischarge({ patient, expiresAt });
    pendingDischargeTimerRef.current = setTimeout(() => {
      pendingDischargeIdRef.current = null;
      setPendingDischarge(null);
      pendingDischargeTimerRef.current = null;
    }, DISCHARGE_UNDO_MS);
  }, []);

  const undoDischarge = useCallback(() => {
    // Use the functional-update form so we always read the *latest committed*
    // pendingDischarge value, not a closure-captured snapshot.
    //
    // Why this matters for a rapid second discharge:
    //   startPendingDischarge(patientB) writes pendingDischargeIdRef synchronously
    //   and then calls setPendingDischarge({ patient: patientB, ... }).  React
    //   commits that update before the re-animation useEffect fires, so by the
    //   time the Undo button is reachable `pd` here is always patientB.
    //   PatientA's ID remains in dischargedIds (their timer was already cancelled),
    //   so only patientB is restored — the first discharge cannot be accidentally
    //   reversed.
    setPendingDischarge(pd => {
      if (!pd) return null;
      // Cancel the timer
      if (pendingDischargeTimerRef.current) {
        clearTimeout(pendingDischargeTimerRef.current);
        pendingDischargeTimerRef.current = null;
      }
      pendingDischargeIdRef.current = null;
      // Un-mark as discharged so API refresh can bring them back.
      // Only this patient's ID is removed; any previously committed discharge
      // stays in dischargedIds and is unaffected.
      dischargedIds.current.delete(pd.patient.id);
      AsyncStorage.setItem(DISCHARGED_IDS_KEY, JSON.stringify([...dischargedIds.current])).catch(() => {});
      // Re-add the patient to the roster
      setPatients(prev => {
        // Avoid duplicates in case of rapid double-tap
        if (prev.some(p => p.id === pd.patient.id)) return prev;
        return [...prev, pd.patient];
      });
      return null;
    });
  }, []);

  const admitPatient = useCallback((patient: Patient) => {
    setPatients(prev => [...prev, patient]);
  }, []);

  const refreshFromApi = useCallback(async () => {
    try {
      const data = await fetchCensus();
      if (!Array.isArray(data.patients) || data.patients.length === 0) return;
      setPatients(prev => {
        const apiById = new Map<string, Patient>(data.patients.map((p: Patient) => [p.id, p]));

        // Start with API patients, excluding any locally discharged
        const merged: Patient[] = data.patients.filter(
          (p: Patient) => !dischargedIds.current.has(p.id),
        );

        // Add locally-admitted patients that aren't in the API response
        for (const p of prev) {
          if (!apiById.has(p.id) && !dischargedIds.current.has(p.id)) {
            merged.push(p);
          }
        }

        return merged;
      });
    } catch {
      // Silent failure — keep showing existing local data
    }
  }, []);

  const residentialPatients = patients.filter(p => p.program === 'Residential');
  const bedStatusMap = deriveBedStatus(patients);

  return (
    <PatientContext.Provider
      value={{
        patients, residentialPatients, bedStatusMap,
        dischargePatient, startPendingDischarge, undoDischarge, clearPendingDischarge, pendingDischarge,
        admitPatient, loading, refreshFromApi,
      }}
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
