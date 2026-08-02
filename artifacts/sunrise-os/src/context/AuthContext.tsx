/**
 * AuthContext — Phase 2
 *
 * Supports two mutually exclusive modes determined by VITE_SUNRISE_DATA_MODE:
 *
 * DEMO MODE (VITE_SUNRISE_DATA_MODE=demo or unset):
 *   - Staff picker login (staffId string → mock StaffMember).
 *   - Session stored in sessionStorage via demoStore (no cookies, no real API).
 *   - Inactivity timeout runs client-side (30 min).
 *
 * PRODUCTION MODE (VITE_SUNRISE_DATA_MODE=production):
 *   - Real login via POST /api/v1/auth/login → HttpOnly session cookie.
 *   - On mount: calls GET /api/v1/auth/session; 401 → show login page.
 *   - logout() calls POST /api/v1/auth/logout.
 *   - NO token written to localStorage or sessionStorage.
 *   - Session expiry comes from the server (sessionExpiresAt field).
 *   - Client-side inactivity warning still fires at 28 min for UX.
 *   - Expired or revoked sessions → GET /api/v1/auth/session returns 401 → logout.
 *
 * The `currentStaff` field remains available in demo mode for backward compatibility.
 * In production mode `currentStaff` is null; use `productionSession` instead.
 *
 * SECURITY:
 *  - No auth token in localStorage or sessionStorage (verified in tests).
 *  - Session cookie is HttpOnly — inaccessible to JS (set by the API server).
 *  - Session expiry enforced server-side; client shows a warning only.
 */

import React, {
  createContext, useContext, useState, useEffect, useRef,
  useCallback, ReactNode,
} from 'react';
import { StaffMember, getStaffById } from '../data/mockStaff';
import { getSessionStaffId, setSessionStaffId } from '../store/demoStore';
import { InactivityModal } from '../components/common/InactivityModal';
import { DATA_MODE, API_BASE } from '../lib/dataMode';
import type { ProductionSessionData } from '../pages/ProductionLogin';

// ── Constants ─────────────────────────────────────────────────────────────────
const INACTIVITY_MS = 30 * 60 * 1000; // 30 min total (demo mode)
const WARNING_MS    =  2 * 60 * 1000; // warn 2 min before logout

// ── Context type ──────────────────────────────────────────────────────────────
export interface AuthContextValue {
  // Shared
  isLoggedIn:   boolean;
  logout:       () => void;

  // Demo mode
  currentStaff: StaffMember | null;
  /** Demo mode: log in by staff ID. No-op in production mode. */
  login:        (staffId: string) => void;

  // Production mode
  productionSession:    ProductionSessionData | null;
  /** Production mode: log in with email + password. No-op in demo mode. */
  loginWithSession:     (session: ProductionSessionData) => void;
  /** True while checking an existing production session on mount. */
  isCheckingSession:    boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const isProduction = DATA_MODE === 'production';

  // ── Demo mode state ────────────────────────────────────────────────────────
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(() => {
    if (isProduction) return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === '1') { setSessionStaffId(null); return null; }
    const urlParam = params.get('autologin');
    if (urlParam) { setSessionStaffId(urlParam); return urlParam; }
    return getSessionStaffId();
  });

  // ── Production mode state ──────────────────────────────────────────────────
  const [productionSession, setProductionSession] = useState<ProductionSessionData | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(isProduction);

  // ── Inactivity (shared) ────────────────────────────────────────────────────
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);

  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (inactivityRef.current)  clearTimeout(inactivityRef.current);
    if (warningRef.current)     clearTimeout(warningRef.current);
    if (countdownRef.current)   clearInterval(countdownRef.current);
    inactivityRef.current = warningRef.current = countdownRef.current = null;
  }, []);

  const doLogout = useCallback(async () => {
    clearAllTimers();
    setShowWarning(false);

    if (isProduction) {
      try {
        // Revoke server session.
        // Include CSRF token (double-submit pattern) — required by csrf-csrf middleware.
        const csrfHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (csrfTokenRef.current) {
          csrfHeaders['X-CSRF-Token'] = csrfTokenRef.current;
        }
        await fetch(`${API_BASE}/v1/auth/logout`, {
          method:      'POST',
          credentials: 'include',
          headers:     csrfHeaders,
        });
      } catch {
        // Ignore network errors on logout — still clear local state.
      }
      setProductionSession(null);
    } else {
      setCurrentStaffId(null);
      setSessionStaffId(null);
    }
  }, [clearAllTimers, isProduction]);

  const startInactivityClock = useCallback((active: boolean) => {
    clearAllTimers();
    if (!active) return;

    warningRef.current = setTimeout(() => {
      setSecondsLeft(120);
      setShowWarning(true);
      countdownRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) { void doLogout(); return 0; }
          return s - 1;
        });
      }, 1_000);
    }, INACTIVITY_MS - WARNING_MS);

    inactivityRef.current = setTimeout(() => void doLogout(), INACTIVITY_MS);
  }, [clearAllTimers, doLogout]);

  const resetActivityClock = useCallback(() => {
    const active = isProduction ? productionSession !== null : currentStaffId !== null;
    if (!active) return;
    setShowWarning(false);
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    startInactivityClock(true);
  }, [isProduction, productionSession, currentStaffId, startInactivityClock]);

  // ── Production: CSRF token (double-submit cookie pattern) ────────────────
  // Fetched on mount and stored in a ref; sent as X-CSRF-Token on all
  // state-changing requests (logout, etc.).  Not stored in localStorage/state
  // because it only needs to survive the page session.
  const csrfTokenRef = useRef<string | null>(null);

  const fetchCsrfToken = useCallback(async () => {
    if (!isProduction) return;
    try {
      const res = await fetch(`${API_BASE}/v1/auth/csrf-token`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as { csrfToken?: string };
        if (data.csrfToken) csrfTokenRef.current = data.csrfToken;
      }
    } catch {
      // Non-fatal — CSRF token will be missing and logout may fail at server.
      // User can refresh to retry.
    }
  }, [isProduction]);

  // ── Production: check existing session on mount ───────────────────────────
  useEffect(() => {
    if (!isProduction) return;

    let cancelled = false;
    async function checkSession() {
      // Fetch CSRF token in parallel with session check.
      void fetchCsrfToken();
      try {
        const res = await fetch(`${API_BASE}/v1/auth/session`, {
          credentials: 'include',
        });
        if (!cancelled && res.ok) {
          const data: ProductionSessionData = await res.json();
          setProductionSession(data);
        }
      } catch {
        // Network error — leave productionSession null → shows login.
      } finally {
        if (!cancelled) setIsCheckingSession(false);
      }
    }
    void checkSession();
    return () => { cancelled = true; };
  }, [isProduction, fetchCsrfToken]);

  // ── Production: poll to detect server-side session expiry ────────────────
  useEffect(() => {
    if (!isProduction || !productionSession) return;
    const CHECK_INTERVAL = 60_000; // check every minute
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/auth/session`, { credentials: 'include' });
        if (res.status === 401) void doLogout();
      } catch { /* ignore */ }
    }, CHECK_INTERVAL);
    return () => clearInterval(id);
  }, [isProduction, productionSession, doLogout]);

  // ── Wire user-activity events ─────────────────────────────────────────────
  const isLoggedIn = isProduction ? productionSession !== null : currentStaffId !== null;

  useEffect(() => {
    if (!isLoggedIn) { clearAllTimers(); return; }
    startInactivityClock(true);
    const EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    const handler = () => resetActivityClock();
    EVENTS.forEach((ev) => document.addEventListener(ev, handler, { passive: true }));
    return () => {
      clearAllTimers();
      EVENTS.forEach((ev) => document.removeEventListener(ev, handler));
    };
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Demo mode login ───────────────────────────────────────────────────────
  const login = useCallback((staffId: string) => {
    if (isProduction) return; // no-op
    setCurrentStaffId(staffId);
    setSessionStaffId(staffId);
  }, [isProduction]);

  // ── Production mode: called after a successful POST /api/v1/auth/login ───
  // Refreshes the CSRF token immediately after login so it is bound to the
  // authenticated session (express-session regenerates the session ID on
  // login; any CSRF token from before login is no longer valid).
  const loginWithSession = useCallback((session: ProductionSessionData) => {
    setProductionSession(session);
    void fetchCsrfToken(); // bind CSRF token to the new authenticated session
  }, [fetchCsrfToken]);

  const currentStaff = isProduction
    ? null
    : (currentStaffId ? (getStaffById(currentStaffId) ?? null) : null);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        logout:               doLogout,
        currentStaff,
        login,
        productionSession,
        loginWithSession,
        isCheckingSession,
      }}
    >
      {children}

      {showWarning && isLoggedIn && (
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
