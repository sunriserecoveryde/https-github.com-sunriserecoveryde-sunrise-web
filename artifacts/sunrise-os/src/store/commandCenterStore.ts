/**
 * commandCenterStore.ts — Singleton reactive store for Command Center alerts.
 * Uses useSyncExternalStore so Dashboard and CommandCenter share live state.
 */
import { useSyncExternalStore, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type AlertPriority = 'Critical' | 'High' | 'Moderate' | 'Routine';
export type AlertStatus   = 'Open' | 'In Progress' | 'Resolved' | 'Escalated';
export type AlertProgram  = 'Residential' | 'PHP' | 'IOP' | 'Detox' | 'Staff' | 'System';

export interface CCComment {
  id: string;
  author: string;
  text: string;
  ts: string;
}

export interface CCAlert {
  id: string;
  priority: AlertPriority;
  type: string;
  patient: string;
  patientId?: string;
  location: string;
  program: AlertProgram;
  assignedTo: string;
  supervisor: string;
  dueDate: string;
  status: AlertStatus;
  recommendedAction: string;
  createdAt: string;
  resolvedAt?: string;
  comments: CCComment[];
}

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED_ALERTS: CCAlert[] = [
  // ── Critical (3)
  {
    id: 'cc1', priority: 'Critical', type: 'CIWA Score ≥18 — Active Alcohol Withdrawal',
    patient: 'Marcus Webb', patientId: 'p1', location: 'Bed B-04', program: 'Residential',
    assignedTo: 'Dr. Robert Chen', supervisor: 'James Collins, LCPC',
    dueDate: 'Jul 22, 11:00 AM', status: 'Open',
    recommendedAction: 'Physician bedside evaluation within 15 min; consider IV fluids and lorazepam PRN protocol. Notify charge nurse of status q30 min.',
    createdAt: '2026-07-22T08:42:00', comments: [],
  },
  {
    id: 'cc2', priority: 'Critical', type: 'AMA Intent Verbalized — Imminent Risk',
    patient: 'Devon Patel', patientId: 'p4', location: 'Bed B-11', program: 'Residential',
    assignedTo: 'Sarah Jenkins, LCPC', supervisor: 'James Collins, LCPC',
    dueDate: 'Jul 22, 12:00 PM', status: 'In Progress',
    recommendedAction: 'Counselor 1:1 within 30 min; AMA form prep if verbal intent continues; notify family contact on file; update risk assessment.',
    createdAt: '2026-07-22T09:05:00',
    comments: [{ id: 'c2a', author: 'Sarah Jenkins', text: 'Completed 1:1. Patient calmed down. Monitoring q30 min.', ts: '2026-07-22T10:15:00' }],
  },
  {
    id: 'cc3', priority: 'Critical', type: 'Positive UA — Contraband Fentanyl',
    patient: 'Samantha Choi', patientId: 'p2', location: 'Bed B-02', program: 'Residential',
    assignedTo: 'David Odom, LCADC', supervisor: 'James Collins, LCPC',
    dueDate: 'Jul 22, 2:00 PM', status: 'Open',
    recommendedAction: 'Update treatment plan; conduct room search with RN; document in incident log; notify insurance utilization reviewer.',
    createdAt: '2026-07-22T07:30:00', comments: [],
  },
  // ── High (4)
  {
    id: 'cc4', priority: 'High', type: 'Missed Medication — 3 Consecutive Doses',
    patient: 'James Thornton', patientId: 'p3', location: 'Bed B-07', program: 'Residential',
    assignedTo: 'Jessica Torres, RN', supervisor: 'Dr. Robert Chen',
    dueDate: 'Jul 22, 1:00 PM', status: 'In Progress',
    recommendedAction: 'Nursing assessment; document refusal reason in MAR; notify prescriber if pattern continues beyond next scheduled dose.',
    createdAt: '2026-07-22T06:00:00', comments: [],
  },
  {
    id: 'cc5', priority: 'High', type: 'Insurance Authorization Expiring — 48 Hours',
    patient: 'Linda Farris', patientId: 'p8', location: 'Bed D-03', program: 'PHP',
    assignedTo: 'Billing — B. Hughes', supervisor: 'James Collins, LCPC',
    dueDate: 'Jul 24, 5:00 PM', status: 'Open',
    recommendedAction: 'Submit concurrent review to Cigna today; Dr. Chen to co-sign clinical criteria letter by 4 PM.',
    createdAt: '2026-07-22T07:00:00', comments: [],
  },
  {
    id: 'cc6', priority: 'High', type: 'Group No-Show — 3 Consecutive Sessions',
    patient: 'Ashley Monroe', patientId: 'p9', location: 'Bed D-09', program: 'Residential',
    assignedTo: 'Maria Gonzales, LCADC', supervisor: 'James Collins, LCPC',
    dueDate: 'Jul 22, 4:00 PM', status: 'Open',
    recommendedAction: 'Counselor check-in and document reason; update treatment plan attendance goals; consider level-of-care review.',
    createdAt: '2026-07-22T08:00:00', comments: [],
  },
  {
    id: 'cc7', priority: 'High', type: 'Co-Sign Backlog — 3 Documents Pending >24h',
    patient: 'Multiple', location: 'Charts', program: 'System',
    assignedTo: 'James Collins, LCPC', supervisor: 'James Collins, LCPC',
    dueDate: 'Jul 22, 5:00 PM', status: 'Open',
    recommendedAction: 'Supervisor to review and co-sign all three progress notes in ChartReview before shift end. Notify counselors of approval.',
    createdAt: '2026-07-22T06:00:00', comments: [],
  },
  // ── Moderate (5)
  {
    id: 'cc8', priority: 'Moderate', type: 'UA Chain of Custody Form Missing',
    patient: 'Destiny Williams', patientId: 'p6', location: 'Bed B-11', program: 'Residential',
    assignedTo: 'Kevin Wright, BHT', supervisor: 'Jessica Torres, RN',
    dueDate: 'Jul 22, 3:00 PM', status: 'Open',
    recommendedAction: 'BHT to recollect UA with documented direct observation; complete chain of custody form; submit to lab before 3 PM.',
    createdAt: '2026-07-22T08:01:00', comments: [],
  },
  {
    id: 'cc9', priority: 'Moderate', type: 'Dietary Restriction Non-Compliance',
    patient: 'Robert Navarro', patientId: 'p5', location: 'Bed B-09', program: 'Residential',
    assignedTo: 'Kevin Wright, BHT', supervisor: 'Dr. Allen Hughes',
    dueDate: 'Jul 22, 6:00 PM', status: 'Open',
    recommendedAction: 'BHT to monitor meal intake and document; alert nursing if continued refusal; psychiatric consult is pending for 2 PM.',
    createdAt: '2026-07-22T07:45:00', comments: [],
  },
  {
    id: 'cc10', priority: 'Moderate', type: 'Family Conflict — Patient Distress',
    patient: 'Devon Patel', patientId: 'p4', location: 'Bed B-11', program: 'Residential',
    assignedTo: 'Maria Gonzales, LCADC', supervisor: 'James Collins, LCPC',
    dueDate: 'Jul 23, 12:00 PM', status: 'Open',
    recommendedAction: 'Counselor to facilitate supervised family call; document in family engagement log; assess impact on treatment motivation.',
    createdAt: '2026-07-22T09:30:00', comments: [],
  },
  {
    id: 'cc11', priority: 'Moderate', type: 'Sleep Disturbance — 3 Consecutive Nights',
    patient: 'Elaine Russo', location: 'Bed C-06', program: 'Residential',
    assignedTo: 'Jessica Torres, RN', supervisor: 'Dr. Robert Chen',
    dueDate: 'Jul 23, 10:00 AM', status: 'Open',
    recommendedAction: 'Nursing assessment; review current medications with prescriber; document sleep pattern in nursing notes.',
    createdAt: '2026-07-22T06:30:00', comments: [],
  },
  {
    id: 'cc12', priority: 'Moderate', type: 'Staff Certification Expiring — 22 Days',
    patient: 'Sarah Jenkins, LCPC', location: 'Staff Record', program: 'Staff',
    assignedTo: 'HR — K. Patel', supervisor: 'James Collins, LCPC',
    dueDate: 'Aug 13, 5:00 PM', status: 'Open',
    recommendedAction: 'HR to initiate CAC-AD III renewal paperwork; schedule CEU hours; update certification tracker before expiry.',
    createdAt: '2026-07-22T07:00:00', comments: [],
  },
  // ── Routine (3)
  {
    id: 'cc13', priority: 'Routine', type: 'Discharge Prep Incomplete — 3 Days Out',
    patient: 'Marcus Webb', patientId: 'p1', location: 'Bed B-04', program: 'Residential',
    assignedTo: 'David Odom, LCADC', supervisor: 'James Collins, LCPC',
    dueDate: 'Jul 25, 5:00 PM', status: 'Open',
    recommendedAction: 'Complete aftercare plan, housing referral, and alumni program enrollment before discharge date of July 25.',
    createdAt: '2026-07-22T07:00:00', comments: [],
  },
  {
    id: 'cc14', priority: 'Routine', type: 'Pyxis Medication Inventory Count Due',
    patient: 'System', location: 'Medication Room', program: 'System',
    assignedTo: 'Jessica Torres, RN', supervisor: 'Dr. Robert Chen',
    dueDate: 'Jul 22, 5:00 PM', status: 'Open',
    recommendedAction: 'Conduct end-of-shift Pyxis count and reconcile with MAR. Report any discrepancy to charge nurse immediately.',
    createdAt: '2026-07-22T07:00:00', comments: [],
  },
  {
    id: 'cc15', priority: 'Routine', type: 'Monthly QI Checklist Incomplete',
    patient: 'System', location: 'Operations', program: 'System',
    assignedTo: 'James Collins, LCPC', supervisor: 'James Collins, LCPC',
    dueDate: 'Jul 31, 5:00 PM', status: 'Open',
    recommendedAction: 'Complete monthly QI documentation checklist and submit to Director of Operations for sign-off.',
    createdAt: '2026-07-22T07:00:00', comments: [],
  },
];

// ── Persistence helpers ───────────────────────────────────────────────────────
const CC_STORE_KEY = 'sunrise_cc_alerts_v1';

function loadAlerts(): CCAlert[] {
  try {
    const raw = localStorage.getItem(CC_STORE_KEY);
    if (!raw) return SEED_ALERTS.map(a => ({ ...a }));
    return JSON.parse(raw) as CCAlert[];
  } catch {
    return SEED_ALERTS.map(a => ({ ...a }));
  }
}
function persist(alerts: CCAlert[]) {
  try { localStorage.setItem(CC_STORE_KEY, JSON.stringify(alerts)); } catch {}
}

// ── Module-level singleton ────────────────────────────────────────────────────
let _alerts: CCAlert[] = loadAlerts();
const _subs = new Set<() => void>();

function _notify() { _subs.forEach(fn => fn()); }
function _getSnapshot() { return _alerts; }
function _subscribe(cb: () => void) {
  _subs.add(cb);
  return () => _subs.delete(cb);
}
function _set(updater: (prev: CCAlert[]) => CCAlert[]) {
  _alerts = updater(_alerts);
  persist(_alerts);
  _notify();
}

// ── Derived counts (used by Dashboard badge) ──────────────────────────────────
export function getOpenAlertCounts() {
  const open = _alerts.filter(a => a.status !== 'Resolved');
  return {
    total:    open.length,
    critical: open.filter(a => a.priority === 'Critical').length,
    high:     open.filter(a => a.priority === 'High').length,
    moderate: open.filter(a => a.priority === 'Moderate').length,
    routine:  open.filter(a => a.priority === 'Routine').length,
  };
}

// ── Reset ─────────────────────────────────────────────────────────────────────
export function resetCCAlerts() {
  try { localStorage.removeItem(CC_STORE_KEY); } catch {}
  _alerts = SEED_ALERTS.map(a => ({ ...a }));
  _notify();
}

// ── React hook ────────────────────────────────────────────────────────────────
export function useCCStore() {
  const alerts = useSyncExternalStore(_subscribe, _getSnapshot);

  const updateAlert = useCallback((id: string, patch: Partial<CCAlert>) => {
    _set(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }, []);

  const addComment = useCallback((id: string, author: string, text: string) => {
    _set(prev => prev.map(a => {
      if (a.id !== id) return a;
      return {
        ...a,
        comments: [
          ...a.comments,
          { id: `cmt-${Date.now()}`, author, text, ts: new Date().toISOString() },
        ],
      };
    }));
  }, []);

  const resolveAlert = useCallback((id: string) => {
    _set(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'Resolved', resolvedAt: new Date().toISOString() } : a
    ));
  }, []);

  const escalateAlert = useCallback((id: string) => {
    _set(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'Escalated', priority: a.priority === 'Routine' ? 'Moderate' : a.priority === 'Moderate' ? 'High' : 'Critical' } : a
    ));
  }, []);

  return { alerts, updateAlert, addComment, resolveAlert, escalateAlert };
}
