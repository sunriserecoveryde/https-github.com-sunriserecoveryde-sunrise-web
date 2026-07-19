/**
 * MdAcknowledgmentContext
 *
 * Keeps MD acknowledgment logs alive across app restarts and re-logins for
 * the duration of the current shift (calendar day).  Acknowledgments are
 * persisted to AsyncStorage using the same pattern as NursingNotesContext.
 *
 * Shift-end / date-rollover behaviour:
 *  - On load, if the stored acknowledgments were saved on a previous calendar
 *    day they are discarded and storage is cleared — matching "shift end at
 *    midnight".
 *  - If the nurse explicitly logs out via the logout/shift-end action the
 *    caller may invoke `clearAcknowledgments()` to wipe storage immediately.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MdAcknowledgment {
  patientId: string;
  /** ISO timestamp when the nurse acknowledged */
  acknowledgedAt: string;
  /** Formatted display time, e.g. "14:32" */
  displayTime: string;
}

/** Shape written to AsyncStorage */
interface PersistedAcknowledgments {
  /** YYYY-MM-DD — the shift date these acknowledgments belong to */
  shiftDate: string;
  acknowledgments: Record<string, MdAcknowledgment>;
}

const ACKNOWLEDGMENTS_KEY = '@sunrise_md_acknowledgments_v1';

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface MdAcknowledgmentContextType {
  acknowledgments: Record<string, MdAcknowledgment>;
  acknowledge: (patientId: string) => void;
  isAcknowledged: (patientId: string) => boolean;
  /** Wipe all acknowledgments and clear storage — call on explicit logout / shift-end */
  clearAcknowledgments: () => void;
  /** True while loading from storage */
  loading: boolean;
}

const MdAcknowledgmentContext = createContext<MdAcknowledgmentContextType>({
  acknowledgments: {},
  acknowledge: () => {},
  isAcknowledged: () => false,
  clearAcknowledgments: () => {},
  loading: false,
});

export function MdAcknowledgmentProvider({ children }: { children: React.ReactNode }) {
  const [acknowledgments, setAcknowledgments] = useState<Record<string, MdAcknowledgment>>({});
  const [loading, setLoading] = useState(true);

  // Load persisted acknowledgments on mount; discard if they belong to a previous day.
  useEffect(() => {
    AsyncStorage.getItem(ACKNOWLEDGMENTS_KEY)
      .then(raw => {
        if (raw !== null) {
          try {
            const saved = JSON.parse(raw) as PersistedAcknowledgments;
            if (saved.shiftDate === todayDateString() && saved.acknowledgments) {
              setAcknowledgments(saved.acknowledgments);
            } else {
              // Previous shift's acknowledgments — discard silently
              AsyncStorage.removeItem(ACKNOWLEDGMENTS_KEY).catch(() => {});
            }
          } catch {
            // Corrupt data — fall back to empty
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Persist whenever acknowledgments change (skip during initial load).
  useEffect(() => {
    if (loading) return;
    const payload: PersistedAcknowledgments = {
      shiftDate: todayDateString(),
      acknowledgments,
    };
    AsyncStorage.setItem(ACKNOWLEDGMENTS_KEY, JSON.stringify(payload)).catch(() => {});
  }, [acknowledgments, loading]);

  const acknowledge = useCallback((patientId: string) => {
    const now = new Date();
    const displayTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    setAcknowledgments(prev => ({
      ...prev,
      [patientId]: {
        patientId,
        acknowledgedAt: now.toISOString(),
        displayTime,
      },
    }));
  }, []);

  const isAcknowledged = useCallback(
    (patientId: string) => patientId in acknowledgments,
    [acknowledgments],
  );

  const clearAcknowledgments = useCallback(() => {
    setAcknowledgments({});
    AsyncStorage.removeItem(ACKNOWLEDGMENTS_KEY).catch(() => {});
  }, []);

  return (
    <MdAcknowledgmentContext.Provider value={{ acknowledgments, acknowledge, isAcknowledged, clearAcknowledgments, loading }}>
      {children}
    </MdAcknowledgmentContext.Provider>
  );
}

export function useMdAcknowledgment() {
  return useContext(MdAcknowledgmentContext);
}
