import React, {
  createContext, useContext, useState, useEffect, useRef,
  useCallback, ReactNode,
} from 'react';
import { StaffMember, getStaffById } from '../data/mockStaff';
import { getSessionStaffId, setSessionStaffId } from '../store/demoStore';
import { InactivityModal } from '../components/common/InactivityModal';

// ── Constants ─────────────────────────────────────────────────────────────────
const INACTIVITY_MS = 30 * 60 * 1000; // 30 min total
const WARNING_MS    =  2 * 60 * 1000; // show warning 2 min before logout

// ── Context type ──────────────────────────────────────────────────────────────
interface AuthContextValue {
  currentStaff: StaffMember | null;
  isLoggedIn: boolean;
  login: (staffId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  // Rehydrate from localStorage on first render.
  // ?autologin=<staffId> — automated screenshot capture.
  // ?logout=1            — force-clear session (shows login page).
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === '1') {
      setSessionStaffId(null);
      return null;
    }
    const urlParam = params.get('autologin');
    if (urlParam) {
      setSessionStaffId(urlParam);
      return urlParam;
    }
    return getSessionStaffId();
  });
  const [showWarning, setShowWarning]     = useState(false);
  const [secondsLeft, setSecondsLeft]     = useState(120);

  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (inactivityRef.current)  clearTimeout(inactivityRef.current);
    if (warningRef.current)     clearTimeout(warningRef.current);
    if (countdownRef.current)   clearInterval(countdownRef.current);
    inactivityRef.current = warningRef.current = countdownRef.current = null;
  }, []);

  const doLogout = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    setCurrentStaffId(null);
    setSessionStaffId(null);
  }, [clearAllTimers]);

  const startInactivityClock = useCallback((staffId: string | null) => {
    clearAllTimers();
    if (!staffId) return;

    // Warn 2 min before expiry
    warningRef.current = setTimeout(() => {
      setSecondsLeft(120);
      setShowWarning(true);
      countdownRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) { doLogout(); return 0; }
          return s - 1;
        });
      }, 1_000);
    }, INACTIVITY_MS - WARNING_MS);

    // Hard logout
    inactivityRef.current = setTimeout(doLogout, INACTIVITY_MS);
  }, [clearAllTimers, doLogout]);

  const resetActivityClock = useCallback(() => {
    if (!currentStaffId) return;
    setShowWarning(false);
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    startInactivityClock(currentStaffId);
  }, [currentStaffId, startInactivityClock]);

  // Wire user-activity events
  useEffect(() => {
    if (!currentStaffId) return;
    startInactivityClock(currentStaffId);

    const EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    const handler = () => resetActivityClock();
    EVENTS.forEach(ev => document.addEventListener(ev, handler, { passive: true }));
    return () => {
      clearAllTimers();
      EVENTS.forEach(ev => document.removeEventListener(ev, handler));
    };
  }, [currentStaffId]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback((staffId: string) => {
    setCurrentStaffId(staffId);
    setSessionStaffId(staffId);
  }, []);

  const currentStaff = currentStaffId ? (getStaffById(currentStaffId) ?? null) : null;

  return (
    <AuthContext.Provider
      value={{ currentStaff, isLoggedIn: currentStaffId !== null, login, logout: doLogout }}
    >
      {children}

      {/* Inactivity warning modal — rendered inside provider so it overlays everything */}
      {showWarning && currentStaffId && (
        <InactivityModal
          secondsRemaining={secondsLeft}
          onExtend={resetActivityClock}
          onLogout={doLogout}
        />
      )}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
