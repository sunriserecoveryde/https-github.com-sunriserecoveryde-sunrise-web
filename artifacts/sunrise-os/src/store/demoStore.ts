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

/** A document pending supervisor co-signature */
export interface PendingDoc {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  program: string;
  noteDate: string;       // YYYY-MM-DD
  noteType: string;
  author: string;
  authorId: string;
  authorRole: string;
  supervisor: string;
  priority: 'Urgent' | 'Routine';
  preview: string;
  format?: string;
  submittedAt: string;    // ISO timestamp
  deadline?: string;      // ISO timestamp — optional assigned deadline
  correctionCount: number;
  lastReturnReason?: string;
}

/** Each time a supervisor returns a note for correction */
export interface CorrectionEvent {
  id: string;
  docId: string;
  authorId: string;
  authorName: string;
  supervisorName: string;
  reason: string;
  timestamp: string;      // ISO timestamp
}

/** Snapshot saved during autosave or manual Save Draft */
export interface DocVersion {
  id: string;
  docId: string;
  savedAt: string;        // ISO timestamp
  savedBy: string;
  contentSnapshot: string;
  isAutosave: boolean;
}

export interface DemoState {
  notificationReadIds: string[];
  auditLog: AuditEntry[];
  lastResetAt: string | null;
  // Clinical documentation
  pendingDocs: PendingDoc[];
  correctionEvents: CorrectionEvent[];
  docVersions: DocVersion[];
}

const INITIAL_STATE: DemoState = {
  notificationReadIds: [],
  auditLog: [],
  lastResetAt: null,
  pendingDocs: [],
  correctionEvents: [],
  docVersions: [],
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

// ── Selector helpers (called outside React, e.g. in DocumentFormBar) ─────────
/** Returns true if author has 3+ returned corrections within the last 30 days */
export function hasDeficiencyFlag(authorId: string): boolean {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = _state.correctionEvents.filter(
    e => e.authorId === authorId && new Date(e.timestamp).getTime() > cutoff,
  );
  return recent.length >= 3;
}

/** Live count of pending docs (for Dashboard badge) */
export function getPendingDocCount(): number {
  return _state.pendingDocs.length;
}

// ── React hook ────────────────────────────────────────────────────────────────
export function useDemoStore() {
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

  // ── Clinical doc mutations ───────────────────────────────────────────────────

  const addPendingDoc = useCallback(
    (doc: Omit<PendingDoc, 'id' | 'submittedAt'> & { correctionCount?: number }) => {
      _setState(s => ({
        ...s,
        pendingDocs: [
          {
            ...doc,
            id: `pd-${Date.now()}`,
            submittedAt: new Date().toISOString(),
            correctionCount: doc.correctionCount ?? 0,
          },
          ...s.pendingDocs,
        ],
      }));
    },
    [],
  );

  const approvePendingDoc = useCallback((id: string) => {
    _setState(s => ({
      ...s,
      pendingDocs: s.pendingDocs.filter(d => d.id !== id),
    }));
  }, []);

  const returnForCorrection = useCallback(
    (id: string, supervisorName: string, reason: string) => {
      _setState(s => {
        const doc = s.pendingDocs.find(d => d.id === id);
        if (!doc) return s;
        const event: CorrectionEvent = {
          id: `corr-${Date.now()}`,
          docId: id,
          authorId: doc.authorId,
          authorName: doc.author,
          supervisorName,
          reason,
          timestamp: new Date().toISOString(),
        };
        return {
          ...s,
          // Remove from supervisor queue — author must resubmit after corrections.
          // Correction analytics (events + counts) are preserved separately.
          pendingDocs: s.pendingDocs.filter(d => d.id !== id),
          correctionEvents: [event, ...s.correctionEvents],
        };
      });
    },
    [],
  );

  const assignDeadline = useCallback((id: string, deadline: string) => {
    _setState(s => ({
      ...s,
      pendingDocs: s.pendingDocs.map(d =>
        d.id === id ? { ...d, deadline } : d,
      ),
    }));
  }, []);

  const addDocVersion = useCallback(
    (version: Omit<DocVersion, 'id'>) => {
      _setState(s => ({
        ...s,
        docVersions: [
          { ...version, id: `v-${Date.now()}` },
          ...s.docVersions.slice(0, 499),
        ],
      }));
    },
    [],
  );

  const getDocVersions = useCallback(
    (docId: string) => state.docVersions.filter(v => v.docId === docId),
    [state.docVersions],
  );

  const isDeficiencyFlagged = useCallback(
    (authorId: string) => {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recent = state.correctionEvents.filter(
        e => e.authorId === authorId && new Date(e.timestamp).getTime() > cutoff,
      );
      return recent.length >= 3;
    },
    [state.correctionEvents],
  );

  return {
    state,
    markRead,
    markAllRead,
    addAuditEntry,
    reset,
    // Doc lifecycle
    addPendingDoc,
    approvePendingDoc,
    returnForCorrection,
    assignDeadline,
    addDocVersion,
    getDocVersions,
    isDeficiencyFlagged,
    // Exposed state slices (read-only via useSyncExternalStore)
    correctionEvents: state.correctionEvents,
  };
}
