/**
 * demoStore.ts — Singleton localStorage-backed demo store
 *
 * Uses `useSyncExternalStore` so all consumers (Topbar, NotificationPanel,
 * Settings, etc.) share one module-level state object and re-render
 * synchronously whenever any component calls an update.
 */
import { useSyncExternalStore, useCallback } from 'react';

// ── Storage keys ──────────────────────────────────────────────────────────────
export const STORE_KEY   = 'sunrise_demo_state_v1';
export const SESSION_KEY = 'sunrise_demo_session_v1';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AuditEntry {
  id: string;
  timestamp: string;
  staffName: string;
  action: string;
  entity: string;
  detail: string;
}

export interface DemoState {
  notificationReadIds: string[];
  auditLog: AuditEntry[];
  lastResetAt: string | null;
}

const INITIAL_STATE: DemoState = {
  notificationReadIds: [],
  auditLog: [],
  lastResetAt: null,
};

// ── Persistence helpers ───────────────────────────────────────────────────────
function loadFromStorage(): DemoState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...INITIAL_STATE };
    return { ...INITIAL_STATE, ...JSON.parse(raw) } as DemoState;
  } catch {
    return { ...INITIAL_STATE };
  }
}

function persistToStorage(s: DemoState): void {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {}
}

// ── Module-level singleton ────────────────────────────────────────────────────
// Initialised once from localStorage; all hook instances share this reference.
let _state: DemoState = loadFromStorage();
const _subscribers = new Set<() => void>();

function _notify() {
  _subscribers.forEach(fn => fn());
}

function _getSnapshot(): DemoState {
  return _state;
}

function _subscribe(cb: () => void): () => void {
  _subscribers.add(cb);
  return () => _subscribers.delete(cb);
}

function _setState(updater: (s: DemoState) => DemoState): void {
  _state = updater(_state);
  persistToStorage(_state);
  _notify();
}

// ── Session helpers (separate key from the state blob) ────────────────────────
export function getSessionStaffId(): string | null {
  try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
}

export function setSessionStaffId(id: string | null): void {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else     localStorage.removeItem(SESSION_KEY);
  } catch {}
}

// ── Full reset ────────────────────────────────────────────────────────────────
export function resetDemoData(): void {
  try {
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch {}
  _state = { ...INITIAL_STATE };
  _notify();
}

// ── React hook ────────────────────────────────────────────────────────────────
export function useDemoStore() {
  // useSyncExternalStore: single snapshot object shared across all callers
  const state = useSyncExternalStore(_subscribe, _getSnapshot);

  const markRead = useCallback((id: string) => {
    _setState(s => ({
      ...s,
      notificationReadIds: s.notificationReadIds.includes(id)
        ? s.notificationReadIds
        : [...s.notificationReadIds, id],
    }));
  }, []);

  const markAllRead = useCallback((ids: string[]) => {
    _setState(s => {
      const set = new Set([...s.notificationReadIds, ...ids]);
      return { ...s, notificationReadIds: [...set] };
    });
  }, []);

  const addAuditEntry = useCallback(
    (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
      _setState(s => ({
        ...s,
        auditLog: [
          { ...entry, id: `audit-${Date.now()}`, timestamp: new Date().toISOString() },
          ...s.auditLog.slice(0, 199),
        ],
      }));
    },
    [],
  );

  const reset = useCallback(() => {
    _setState(() => ({ ...INITIAL_STATE, lastResetAt: new Date().toISOString() }));
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  }, []);

  return { state, markRead, markAllRead, addAuditEntry, reset };
}
