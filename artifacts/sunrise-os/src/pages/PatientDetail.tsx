import React, { useState, useEffect } from 'react';
import { MOCK_PATIENTS, Flag } from '../data/mockPatients';
import { getPatientMedications, getMARStatus } from '../data/mockMedications';
import { getPatientVitals } from '../data/mockVitals';
import { getPatientLabs, LAB_PANEL_ORDER } from '../data/mockLabs';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { FlagBadge } from '../components/ui/FlagBadge';
import { FlagChartAlert } from '../components/ui/FlagChartAlert';
import { FlagEditorModal } from '../components/ui/FlagEditorModal';
import { AcuityBadge } from '../components/ui/AcuityBadge';
import { RecoveryScoreBadge } from '../components/ui/RecoveryScoreBadge';
import { CustomButtons } from '../components/ui/CustomButtons';
import {
  ArrowLeft, Activity, FileText, Pill, Users, HeartPulse,
  FlaskConical, BookOpen, FolderOpen, CheckCircle2, XCircle,
  AlertCircle, Clock, Upload, Download, ClipboardList, Plus, Eye, Pin, PinOff, Calendar
} from 'lucide-react';
import { Screen } from '../App';
import { LockedButton } from '../components/common/LockedButton';
import { useAuth } from '../context/AuthContext';
import { useSidebarPrefs } from '../hooks/useSidebarPrefs';
import { DATA_MODE, DATA_MODE_ERROR, API_BASE, DEV_HEADERS } from '../lib/dataMode';
import type { Patient } from '../data/mockPatients';


// ── Clinical note list item returned by GET /clinical-notes (Phase 3) ─────────
interface ApiClinicalNoteItem {
  id: string;
  noteType: 'progress_note' | 'nursing_note';
  status: 'draft' | 'signed' | 'voided';
  authorDisplayName: string | null;
  authorUserId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  signedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  // content is only present on the detail endpoint (GET /:noteId), not on the list.
  content?: string;
}

// ── Server-patient adapter for PatientDetail (Phase 1A) ───────────────────────
interface ServerPatientDetailRecord {
  id: string; mrn: string; firstName: string; lastName: string;
  dateOfBirth: string | null; gender: string | null;
  insurancePayer: string | null; primaryDiagnosis: string | null;
  status: string;
  episode: { id: string; program: string; levelOfCare: string | null;
             admissionDate: string | null; dischargeDate: string | null;
             episodeStatus: string; } | null;
}
function adaptForDetail(sp: ServerPatientDetailRecord): Patient {
  const program = (['Residential','PHP','IOP','OP'].includes(sp.episode?.program ?? ''))
    ? (sp.episode!.program as Patient['program']) : 'Residential';
  const los = sp.episode?.admissionDate
    ? Math.floor((Date.now() - new Date(sp.episode.admissionDate).getTime()) / 86_400_000) : 0;
  return {
    id: sp.id, mrn: sp.mrn, firstName: sp.firstName, lastName: sp.lastName,
    dob: sp.dateOfBirth ?? '—',
    age: sp.dateOfBirth ? Math.floor((Date.now() - new Date(sp.dateOfBirth).getTime()) / 31_557_600_000) : 0,
    gender: sp.gender ?? '—', insurance: sp.insurancePayer ?? '—', program,
    primaryDiagnosis: sp.primaryDiagnosis ?? '—', coOccurring: [],
    asam: { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0 },
    recoveryScore: 0, amaRisk: 'Low', los,
    admitDate: sp.episode?.admissionDate ?? '—',
    expectedDischarge: sp.episode?.dischargeDate ?? '—',
    counselor: '—', physician: '—', flags: [], lastUa: '—',
    mood: 5, craving: 0, notes: [], goals: [], nextAppointment: '—',
  };
}

export function PatientDetail({ patientId, navigate, readOnly }: { patientId: string | null; navigate: (s: Screen, id?: string) => void; readOnly?: boolean }) {
  // ── Production-mode server patient fetch (Phase 1A) ───────────────────────
  const [serverPatient, setServerPatient] = useState<Patient | null>(null);
  // Explicit fetch-failure flag — no silent fallback to mock data in production mode.
  const [serverPatientError, setServerPatientError] = useState(false);
  // Distinct flag for 403 / 404 authorization denials — rendered with data-testid="access-denied"
  // so browser tests (and the access-denied assertion helper) can detect the denial UI.
  const [serverPatientForbidden, setServerPatientForbidden] = useState(false);
  useEffect(() => {
    if (DATA_MODE !== 'production' || !patientId) return;
    setServerPatient(null);
    setServerPatientError(false);
    setServerPatientForbidden(false);
    fetch(`${API_BASE}/v1/patients/${patientId}`, { headers: DEV_HEADERS })
      .then(r => {
        if (r.status === 403 || r.status === 404) {
          setServerPatientForbidden(true);
          throw new Error(`${r.status}`);
        }
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<ServerPatientDetailRecord>;
      })
      .then(data => setServerPatient(adaptForDetail(data)))
      .catch((err) => {
        // Production mode: surface the failure explicitly — never fall back to mock data.
        // serverPatientForbidden is already set for 403/404; all other failures go here.
        if (!(err instanceof Error && (err.message === '403' || err.message === '404'))) {
          setServerPatientError(true);
        }
      });
  }, [patientId]);

  // ── Stub used only when in production mode and the server patient is not yet loaded.
  // Keeps hook initializers valid. Real loading/error UI gate is below (after all hooks).
  const _PROD_LOADING_STUB: Patient = {
    id: patientId ?? '__loading__', mrn: '', firstName: '', lastName: '', dob: '',
    age: 0, gender: '—', insurance: '—', program: 'Residential',
    primaryDiagnosis: '—', coOccurring: [],
    asam: { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0 },
    recoveryScore: 0, amaRisk: 'Low', los: 0,
    admitDate: new Date().toISOString().slice(0,10), expectedDischarge: '—',
    counselor: '—', physician: '—', flags: [], lastUa: '—',
    mood: 5, craving: 0, notes: [], goals: [], nextAppointment: '—',
  };
  // In demo mode: always use the matching mock patient (unchanged demo path).
  // In production mode: use the server record; fall back to the empty stub ONLY to satisfy
  //   hook initializers — the early-return guard below prevents this stub from rendering.
  const patient: Patient = DATA_MODE === 'production'
    ? (serverPatient ?? _PROD_LOADING_STUB)
    : (MOCK_PATIENTS.find(p => p.id === patientId) || MOCK_PATIENTS[0]);


  // ── Pin / Unpin ────────────────────────────────────────────────────────────
  const { currentStaff, productionSession } = useAuth();
  const staffId = currentStaff?.id ?? null;
  // Void button is only shown when the current production session has the void permission.
  // The API still rejects unauthorized void requests even if this gate is bypassed.
  const canVoidNote = DATA_MODE === 'production'
    && ((productionSession?.permissionCodes ?? []) as string[]).includes('clinical_note.void');
  const { pinPatient, unpinPatient, isPinned, refreshPinnedPatient } = useSidebarPrefs(staffId);
  const patientIsPinned = isPinned(patient.id);
  const [pinError, setPinError] = useState<string | null>(null);

  // Refresh the stored pin entry when this chart opens so the sidebar always
  // shows the current display name and program (spec §5).
  useEffect(() => {
    if (!staffId) return;
    refreshPinnedPatient({
      id:          patient.id,
      displayName: `${patient.firstName} ${patient.lastName}`,
      program:     patient.program,
      discharged:  undefined, // no discharged field in the mock model; spec preserves existing flag
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.id, staffId]);

  // ── Clinical Notes — API helpers (Production mode — Phase 3) ─────────────
  async function apiGetCsrfToken(): Promise<string> {
    const res = await fetch(`${API_BASE}/v1/auth/csrf-token`);
    const data = await res.json() as { csrfToken?: string };
    return data.csrfToken ?? '';
  }

  async function refreshClinicalNotesList(): Promise<void> {
    if (!patientId) return;
    const res = await fetch(`${API_BASE}/v1/patients/${patientId}/clinical-notes`, { headers: DEV_HEADERS });
    if (res.ok) setClinicalNotes(await res.json() as ApiClinicalNoteItem[]);
  }

  function resetComposeState() {
    setIsComposingNote(false);
    setNoteContent('');
    setEditingNoteId(null);
    setEditingNoteVersion(1);
    setNoteIsDirty(false);
    setNoteConflict(false);
    setNoteApiError(null);
  }

  async function handleProductionSaveDraft() {
    if (!patientId) return;
    setNoteSaving(true);
    setNoteApiError(null);
    setNoteConflict(false);
    try {
      const csrf = await apiGetCsrfToken();
      if (!editingNoteId) {
        // Create draft for the first time.
        const res = await fetch(`${API_BASE}/v1/patients/${patientId}/clinical-notes`, {
          method:  'POST',
          headers: { ...DEV_HEADERS, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
          body:    JSON.stringify({ noteType: apiNoteType, content: noteContent || ' ' }),
        });
        if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? `${res.status}`);
        const note = await res.json() as ApiClinicalNoteItem;
        setEditingNoteId(note.id);
        setEditingNoteVersion(note.version);
      } else {
        // Patch existing draft.
        const res = await fetch(`${API_BASE}/v1/patients/${patientId}/clinical-notes/${editingNoteId}`, {
          method:  'PATCH',
          headers: { ...DEV_HEADERS, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
          body:    JSON.stringify({ content: noteContent, expectedVersion: editingNoteVersion }),
        });
        if (res.status === 409) { setNoteConflict(true); return; }
        if (!res.ok) throw new Error(`${res.status}`);
        const note = await res.json() as ApiClinicalNoteItem;
        setEditingNoteVersion(note.version);
      }
      setNoteIsDirty(false);
      saveChartAction('Draft saved');
      await refreshClinicalNotesList();
    } catch (err) {
      setNoteApiError(err instanceof Error ? err.message : 'Failed to save draft.');
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleProductionSignNote() {
    if (!patientId) return;
    setNoteSaving(true);
    setNoteApiError(null);
    setNoteConflict(false);
    try {
      const csrf = await apiGetCsrfToken();
      let currentNoteId = editingNoteId;
      let currentVersion = editingNoteVersion;

      // If no draft exists yet, create it first.
      if (!currentNoteId) {
        const res = await fetch(`${API_BASE}/v1/patients/${patientId}/clinical-notes`, {
          method:  'POST',
          headers: { ...DEV_HEADERS, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
          body:    JSON.stringify({ noteType: apiNoteType, content: noteContent || ' ' }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const note = await res.json() as ApiClinicalNoteItem;
        currentNoteId = note.id;
        currentVersion = note.version;
        setEditingNoteId(currentNoteId);
        setEditingNoteVersion(currentVersion);
      } else if (noteIsDirty) {
        // Save latest content before signing.
        const csrf2 = await apiGetCsrfToken();
        const patchRes = await fetch(`${API_BASE}/v1/patients/${patientId}/clinical-notes/${currentNoteId}`, {
          method:  'PATCH',
          headers: { ...DEV_HEADERS, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf2 },
          body:    JSON.stringify({ content: noteContent, expectedVersion: currentVersion }),
        });
        if (patchRes.status === 409) { setNoteConflict(true); return; }
        if (patchRes.ok) {
          const patched = await patchRes.json() as ApiClinicalNoteItem;
          currentVersion = patched.version;
          setEditingNoteVersion(currentVersion);
        }
      }

      // Sign the note.
      const csrf3 = await apiGetCsrfToken();
      const signRes = await fetch(`${API_BASE}/v1/patients/${patientId}/clinical-notes/${currentNoteId}/sign`, {
        method:  'POST',
        headers: { ...DEV_HEADERS, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf3 },
        body:    JSON.stringify({ expectedVersion: currentVersion }),
      });
      if (signRes.status === 409) { setNoteConflict(true); return; }
      if (!signRes.ok) throw new Error(`Sign failed: ${signRes.status}`);

      resetComposeState();
      saveChartAction('Note signed and locked');
      await refreshClinicalNotesList();
    } catch (err) {
      setNoteApiError(err instanceof Error ? err.message : 'Failed to sign note.');
    } finally {
      setNoteSaving(false);
    }
  }

  // ── Supervisor void note (Phase 3 §5) ──────────────────────────────────
  async function handleProductionVoidNote() {
    if (!patientId || !voidModalNoteId || voidReason.trim().length < 5) return;
    setVoidSubmitting(true);
    setVoidError(null);
    try {
      const csrf = await apiGetCsrfToken();
      const res = await fetch(
        `${API_BASE}/v1/patients/${patientId}/clinical-notes/${voidModalNoteId}/void`,
        {
          method:  'POST',
          headers: { ...DEV_HEADERS, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
          body:    JSON.stringify({ voidReason: voidReason.trim(), expectedVersion: voidModalNoteVersion }),
        }
      );
      if (res.status === 409) {
        setVoidError('This note was modified by someone else. Reload the patient chart and try again.');
        return;
      }
      if (res.status === 403 || res.status === 404) {
        setVoidError('You do not have permission to void notes, or this note is no longer available.');
        return;
      }
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? `Void request failed (${res.status})`);
      }
      setVoidModalNoteId(null);
      setVoidReason('');
      setVoidError(null);
      saveChartAction('Note voided');
      await refreshClinicalNotesList();
    } catch (err) {
      setVoidError(err instanceof Error ? err.message : 'An unexpected error occurred while voiding.');
    } finally {
      setVoidSubmitting(false);
    }
  }

  function handlePinToggle() {
    setPinError(null);
    try {
      const name = `${patient.firstName} ${patient.lastName}`;
      if (patientIsPinned) {
        unpinPatient(patient.id);
        saveChartAction(`${name} unpinned`);
      } else {
        pinPatient({
          id:          patient.id,
          displayName: name,
          program:     patient.program,
          pinnedAt:    Date.now(),
          discharged:  undefined,
        });
        saveChartAction(`${name} pinned`);
      }
    } catch {
      setPinError("Unable to save pinned patient on this device.");
    }
  }

  const [activeTab, setActiveTab] = useState('Overview');

  // ── Clinical Notes — fetch when tab is active (Production mode — Phase 3) ──
  useEffect(() => {
    if (DATA_MODE !== 'production' || !patientId || activeTab !== 'Progress Notes') return;
    let cancelled = false;
    setClinicalNotesLoading(true);
    setClinicalNotesError(null);
    fetch(`${API_BASE}/v1/patients/${patientId}/clinical-notes`, { headers: DEV_HEADERS })
      .then(r => r.ok ? r.json() as Promise<ApiClinicalNoteItem[]> : Promise.reject(r.status))
      .then(data => { if (!cancelled) setClinicalNotes(data); })
      .catch(() => { if (!cancelled) setClinicalNotesError('Unable to load clinical notes from server.'); })
      .finally(() => { if (!cancelled) setClinicalNotesLoading(false); });
    return () => { cancelled = true; };
  }, [patientId, activeTab]);

  const [isComposingNote, setIsComposingNote] = useState(false);
  const [noteFormat, setNoteFormat] = useState('BIRP');
  const [noteContent, setNoteContent] = useState('');
  const [noteTypeFilter, setNoteTypeFilter] = useState<string>('All');
  const [noteIsDirty, setNoteIsDirty] = useState(false);

  // ── Clinical Notes — Production API state (Phase 3) ───────────────────────
  const [clinicalNotes, setClinicalNotes] = useState<ApiClinicalNoteItem[]>([]);
  const [clinicalNotesLoading, setClinicalNotesLoading] = useState(false);
  const [clinicalNotesError, setClinicalNotesError] = useState<string | null>(null);
  // Currently editing draft: id + version for optimistic concurrency
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteVersion, setEditingNoteVersion] = useState<number>(1);
  // Status of the API operation
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteApiError, setNoteApiError] = useState<string | null>(null);
  const [noteConflict, setNoteConflict] = useState(false);
  // Note type selector for the compose panel (production mode)
  const [apiNoteType, setApiNoteType] = useState<'progress_note' | 'nursing_note'>('progress_note');

  // ── Appointments — fetch when tab is active (Production mode — Phase 4) ───
  interface ApiAppointment {
    id: string;
    patientId: string;
    facilityId: string;
    assignedUserId: string;
    appointmentType: string;
    status: 'scheduled' | 'cancelled';
    startsAt: string;
    endsAt: string;
    reason: string;
    internalNote: string | null;
    createdByUserId: string;
    createdAt: string;
    updatedAt: string | null;
    cancelledAt: string | null;
    cancellationReason: string | null;
    version: number;
  }
  interface ApiAppointmentList {
    upcoming: ApiAppointment[];
    past: ApiAppointment[];
  }
  const [appointments, setAppointments] = useState<ApiAppointmentList>({ upcoming: [], past: [] });
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const [aptSaving, setAptSaving] = useState(false);
  const [aptApiError, setAptApiError] = useState<string | null>(null);
  // New appointment form state
  const [aptType, setAptType] = useState<string>('individual_therapy');
  const [aptStartsAt, setAptStartsAt] = useState<string>('');
  const [aptEndsAt, setAptEndsAt] = useState<string>('');
  const [aptReason, setAptReason] = useState<string>('');
  const [aptInternalNote, setAptInternalNote] = useState<string>('');
  const [aptAssignedUserId, setAptAssignedUserId] = useState<string>('');
  const [aptFacilityId, setAptFacilityId] = useState<string>('');
  // Cancel modal state
  const [cancelModalAptId, setCancelModalAptId] = useState<string | null>(null);
  const [cancelModalVersion, setCancelModalVersion] = useState<number>(1);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (DATA_MODE !== 'production' || !patientId || activeTab !== 'Appointments') return;
    let cancelled = false;
    setAppointmentsLoading(true);
    setAppointmentsError(null);
    fetch(`${API_BASE}/v1/patients/${patientId}/appointments`, { headers: DEV_HEADERS })
      .then(r => r.ok ? r.json() as Promise<{ appointments: ApiAppointmentList }> : Promise.reject(r.status))
      .then(data => { if (!cancelled) setAppointments(data.appointments); })
      .catch(() => { if (!cancelled) setAppointmentsError('Unable to load appointments from server.'); })
      .finally(() => { if (!cancelled) setAppointmentsLoading(false); });
    return () => { cancelled = true; };
  }, [patientId, activeTab]);

  // Refresh appointments list after create/cancel
  const refreshAppointments = () => {
    if (DATA_MODE !== 'production' || !patientId) return;
    fetch(`${API_BASE}/v1/patients/${patientId}/appointments`, { headers: DEV_HEADERS })
      .then(r => r.ok ? r.json() as Promise<{ appointments: ApiAppointmentList }> : Promise.reject(r.status))
      .then(data => setAppointments(data.appointments))
      .catch(() => {});
  };

  // ── Supervisor void modal state (Phase 3 §5) ─────────────────────────────
  const [voidModalNoteId, setVoidModalNoteId] = useState<string | null>(null);
  const [voidModalNoteVersion, setVoidModalNoteVersion] = useState<number>(1);
  const [voidReason, setVoidReason] = useState('');
  const [voidSubmitting, setVoidSubmitting] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  // ── Flags — local state so edits survive tab-switches within a chart session
  const [localFlags, setLocalFlags] = useState<Flag[]>(patient.flags);
  const [showFlagAlert, setShowFlagAlert] = useState(true); // auto-shown on chart open
  const [showFlagEditor, setShowFlagEditor] = useState(false);

  // ── PRN medication administration logging ─────────────────────────────────
  const [prnLogged, setPrnLogged] = useState<Set<string>>(new Set());
  function logPrn(medId: string) {
    setPrnLogged(prev => new Set(prev).add(medId));
  }

  // ── Record Vitals inline form ─────────────────────────────────────────────
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({ bp: '', hr: '', temp: '', o2: '', rr: '', pain: '' });
  const [localVitals, setLocalVitals] = useState(() => getPatientVitals(patient.id));
  const [chartActionSaved, setChartActionSaved] = useState<string | null>(null);

  // ── Configuration error gate ─────────────────────────────────────────────
  // Must come AFTER all hooks (Rules of Hooks: no conditional hook calls).
  // Blocks rendering entirely when VITE_SUNRISE_DATA_MODE is misconfigured.
  if (DATA_MODE_ERROR) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="text-4xl">🔴</div>
        <h2 className="text-xl font-bold text-red-700">Configuration Error</h2>
        <p className="text-sm text-slate max-w-md">{DATA_MODE_ERROR}</p>
        <p className="text-xs text-slate max-w-md">
          Fix the <code className="bg-gray-100 px-1 rounded">VITE_SUNRISE_DATA_MODE</code> environment variable and rebuild.
        </p>
      </div>
    );
  }

  // ── Production-mode gate ─────────────────────────────────────────────────
  // Must come AFTER all hooks (Rules of Hooks: no conditional hook calls).
  // Prevents the full chart from rendering with stub/mock data in production.
  if (DATA_MODE === 'production' && !serverPatient) {
    // 403/404 — access denied (cross-facility or insufficient permission)
    if (serverPatientForbidden) {
      return (
        <div
          className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6"
          data-testid="access-denied"
        >
          <div className="w-20 h-20 rounded-full bg-navy/10 flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V7a4.5 4.5 0 10-9 0v3.5M5 10.5h14a1 1 0 011 1V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-8.5a1 1 0 011-1z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-navy">Access Restricted</h2>
          <p className="text-sm text-slate max-w-sm">
            You do not have permission to access this patient record.
            Contact your system administrator if you believe this is an error.
          </p>
          <button
            onClick={() => navigate('PatientList')}
            className="flex items-center gap-2 text-sm font-semibold text-sunrise-blue hover:underline"
          >
            ← Back to patient list
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        {serverPatientError ? (
          <>
            <div className="text-4xl">⚠️</div>
            <h2 className="text-lg font-semibold text-navy">Unable to load patient record</h2>
            <p className="text-sm text-slate max-w-sm">
              The server could not return this patient's data. This may be a temporary issue.
              No mock or cached data is shown to prevent accidental display of the wrong record.
            </p>
            <button
              onClick={() => navigate('PatientList')}
              className="flex items-center gap-2 text-sm font-semibold text-sunrise-blue hover:underline"
            >
              ← Back to patient list
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin text-3xl">⏳</div>
            <p className="text-sm text-slate">Loading patient record from server…</p>
          </>
        )}
      </div>
    );
  }

  const saveChartAction = (msg: string) => { setChartActionSaved(msg); setTimeout(() => setChartActionSaved(null), 2500); };
  function submitVitals() {
    if (!vitalsForm.bp || !vitalsForm.hr || !vitalsForm.temp) return;
    const now = new Date();
    const newEntry = {
      id: `v-new-${Date.now()}`,
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      bp: vitalsForm.bp,
      hr: parseInt(vitalsForm.hr) || 72,
      temp: parseFloat(vitalsForm.temp) || 98.6,
      o2: parseInt(vitalsForm.o2) || 98,
      rr: parseInt(vitalsForm.rr) || 16,
      pain: parseInt(vitalsForm.pain) || 0,
      recordedBy: 'Jessica Torres, RN',
    };
    setLocalVitals(prev => [newEntry, ...prev]);
    setVitalsForm({ bp: '', hr: '', temp: '', o2: '', rr: '', pain: '' });
    setShowVitalsForm(false);
  }

  const meds = getPatientMedications(patient.id);
  const vitals = getPatientVitals(patient.id);
  const labs = getPatientLabs(patient.id);

  const handleQuickInsert = (text: string) => setNoteContent(prev => prev + text);

  const tabs = [
    { id: 'Overview', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'ASAM Assessment', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'Progress Notes', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'Treatment Plan', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { id: 'Medications', icon: <Pill className="w-3.5 h-3.5" /> },
    { id: 'Group Notes', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'Vitals', icon: <HeartPulse className="w-3.5 h-3.5" /> },
    { id: 'Labs', icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { id: 'History', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'Discharge Plan', icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { id: 'Documents', icon: <FolderOpen className="w-3.5 h-3.5" /> },
    { id: 'Consents', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { id: 'Contacts', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'Allergies', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    { id: 'Drug Testing', icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { id: 'Incidents', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    { id: 'Case Management', icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { id: 'Audit History', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'Appointments', icon: <Calendar className="w-3.5 h-3.5" /> },
  ];

  // ── Group attendance generated from LOS ──────────────────────────────────
  const groupSessions = (() => {
    const groups = [
      { name: 'Morning Process Group', facilitator: 'Sarah Jenkins, LCPC', topic: 'Coping Skills & Triggers', time: '9:00 AM' },
      { name: 'Psychoeducation', facilitator: 'David Odom, LCADC', topic: 'Disease Model of Addiction', time: '10:30 AM' },
      { name: 'Relapse Prevention', facilitator: 'Maria Gonzales, LCADC', topic: 'High-Risk Situations', time: '1:00 PM' },
      { name: 'Evening Reflection', facilitator: 'Sarah Jenkins, LCPC', topic: 'Gratitude & Accountability', time: '7:00 PM' },
      { name: 'Trauma-Informed Care', facilitator: 'Dr. Allen Hughes', topic: 'PTSD & Co-occurring Disorders', time: '2:30 PM' },
      { name: 'Family Systems', facilitator: 'David Odom, LCADC', topic: 'Communication & Boundaries', time: '11:00 AM' },
    ];
    const statuses: Array<'Present' | 'Absent' | 'Excused'> = ['Present', 'Present', 'Present', 'Absent', 'Present', 'Excused', 'Present', 'Present'];
    const sessions: Array<{ id: string; date: string; name: string; facilitator: string; topic: string; time: string; status: 'Present' | 'Absent' | 'Excused'; note: string }> = [];
    const admitMs = new Date(patient.admitDate).getTime();
    for (let day = 0; day < Math.min(patient.los, 10); day++) {
      const d = new Date(admitMs + day * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const groupsToday = day % 3 === 0 ? [groups[0], groups[2]] : day % 3 === 1 ? [groups[1], groups[3]] : [groups[4]];
      groupsToday.forEach((g, gi) => {
        const statusIdx = (day + gi) % statuses.length;
        sessions.push({
          id: `gs-${day}-${gi}`,
          date: dateStr,
          ...g,
          status: statuses[statusIdx],
          note: statuses[statusIdx] === 'Absent'
            ? 'Client did not attend. BHT noted client remained in room.'
            : statuses[statusIdx] === 'Excused'
            ? 'Client excused — medical appointment with Dr. Chen.'
            : 'Client participated appropriately. Shared regarding cravings.',
        });
      });
    }
    return sessions.sort((a, b) => b.date.localeCompare(a.date));
  })();

  const attendedCount = groupSessions.filter(s => s.status === 'Present').length;
  const attendancePct = groupSessions.length > 0 ? Math.round((attendedCount / groupSessions.length) * 100) : 0;

  // ── Lab panels ────────────────────────────────────────────────────────────
  const panelsInOrder = LAB_PANEL_ORDER.filter(p => labs.some(l => l.panel === p));
  const flagColor: Record<string, string> = {
    Normal: 'text-success bg-success/10',
    High: 'text-sunrise-amber bg-sunrise-amber/10',
    Low: 'text-sunrise-blue bg-sunrise-blue/10',
    Critical: 'text-critical bg-critical/10',
    Positive: 'text-critical bg-critical/10',
    Negative: 'text-success bg-success/10',
    Pending: 'text-slate bg-slate-100',
  };

  return (
    <>
      {/* Flag pop-up — shown whenever chart opens and patient has flags or any AMA risk */}
      {showFlagAlert && (
        <FlagChartAlert
          patientName={`${patient.firstName} ${patient.lastName}`}
          flags={localFlags}
          amaRisk={patient.amaRisk}
          onClose={() => setShowFlagAlert(false)}
          onEdit={() => { setShowFlagAlert(false); setShowFlagEditor(true); }}
        />
      )}

      {/* Flag editor modal */}
      {showFlagEditor && (
        <FlagEditorModal
          patientName={`${patient.firstName} ${patient.lastName}`}
          flags={localFlags}
          onSave={setLocalFlags}
          onClose={() => setShowFlagEditor(false)}
        />
      )}

    <div className="flex flex-col h-[calc(100vh-var(--topbar-height)-var(--banner-height)-48px)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy to-navy-mid rounded-t-lg p-6 text-white shadow-sm flex-shrink-0">
        <button
          onClick={() => navigate('PatientList')}
          className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patient List
        </button>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-5">
            <PatientAvatar first={patient.firstName} last={patient.lastName} program={patient.program} size="xl" />
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold">{patient.firstName} {patient.lastName}</h1>
                <AcuityBadge acuity={patient.amaRisk === 'High' ? 'Critical' : patient.amaRisk === 'Med' ? 'High' : 'Routine'} />
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded font-semibold border border-white/10">{patient.program}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-300 font-medium">
                <span>{patient.mrn}</span>
                <span>•</span>
                <span>DOB: {patient.dob} ({patient.age}y)</span>
                <span>•</span>
                <span>Admitted: {patient.admitDate} (LOS: {patient.los}d)</span>
                <span>•</span>
                <span>Counselor: {patient.counselor.split(',')[0]}</span>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {localFlags.map((f, i) => (
                  <FlagBadge key={i} type={f.type} note={f.note} variant="pill" />
                ))}
                <button
                  onClick={() => setShowFlagEditor(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-2.5 py-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Edit Flags
                </button>
                {/* ── Pin / Unpin — spec §1: near patient name + primary actions ── */}
                <button
                  onClick={handlePinToggle}
                  aria-pressed={patientIsPinned}
                  aria-label={patientIsPinned
                    ? `Unpin ${patient.firstName} ${patient.lastName}`
                    : `Pin ${patient.firstName} ${patient.lastName}`}
                  className={`flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                    patientIsPinned
                      ? "bg-sunrise-amber/20 border-sunrise-amber/60 text-sunrise-amber hover:bg-sunrise-amber/30"
                      : "bg-white/10 border-white/40 text-white hover:bg-white/20"
                  }`}
                >
                  {patientIsPinned
                    ? <><PinOff className="w-3 h-3" aria-hidden="true" /><span>Unpin Patient</span></>
                    : <><Pin  className="w-3 h-3" aria-hidden="true" /><span>Pin Patient</span></>
                  }
                  <span className="sr-only">{patientIsPinned ? "(currently pinned)" : "(not pinned)"}</span>
                </button>
                {pinError && (
                  <span role="alert" className="text-xs text-rose-300">{pinError}</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <span className="text-slate-300 text-sm font-medium mr-3">Recovery Engagement Score</span>
              <RecoveryScoreBadge score={patient.recoveryScore} size="lg" />
            </div>
            <div className="text-sm text-slate-300 font-medium">Exp. Discharge: {patient.expectedDischarge}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-x border-border px-4 flex gap-0 shadow-sm overflow-x-auto no-scrollbar flex-shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            data-testid={`tab-${tab.id.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 py-3 px-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-sunrise-orange text-sunrise-orange'
                : 'border-transparent text-slate hover:text-navy hover:border-slate-300'
            }`}
          >
            {tab.icon} {tab.id}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 bg-white border-x border-b border-border rounded-b-lg p-6 overflow-y-auto no-scrollbar">

        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Current Mood', value: `${patient.mood}/10`, color: patient.mood >= 6 ? 'text-success' : patient.mood >= 4 ? 'text-sunrise-amber' : 'text-critical' },
                { label: 'Cravings', value: `${patient.craving}/10`, color: patient.craving >= 7 ? 'text-critical' : patient.craving >= 4 ? 'text-sunrise-amber' : 'text-success' },
                { label: 'Last UA', value: patient.lastUa, color: patient.lastUa === 'Negative' ? 'text-success' : 'text-critical' },
                { label: 'Next Appt', value: patient.nextAppointment, color: 'text-navy' },
              ].map(card => (
                <div key={card.label} className="bg-bg border border-border p-4 rounded-lg">
                  <div className="text-slate-light text-xs font-semibold uppercase tracking-wider mb-1">{card.label}</div>
                  <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sunrise-blue" /> ASAM Dimensions Summary
                </h3>
                <div className="space-y-3">
                  {[
                    { d: 1, label: 'Acute Intoxication & Withdrawal', score: patient.asam.d1 },
                    { d: 2, label: 'Biomedical Conditions', score: patient.asam.d2 },
                    { d: 3, label: 'Emotional & Behavioral', score: patient.asam.d3 },
                    { d: 4, label: 'Readiness to Change', score: patient.asam.d4 },
                    { d: 5, label: 'Relapse Potential', score: patient.asam.d5 },
                    { d: 6, label: 'Recovery Environment', score: patient.asam.d6 },
                  ].map(dim => (
                    <div key={dim.d} className="flex items-center gap-4 text-sm">
                      <div className="w-8 h-8 rounded bg-bg border border-border flex items-center justify-center font-bold text-navy">D{dim.d}</div>
                      <div className="flex-1 text-slate font-medium">{dim.label}</div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(s => (
                          <div key={s} className={`w-8 h-2 rounded-sm ${s <= dim.score ? (dim.score >= 3 ? 'bg-critical' : dim.score === 2 ? 'bg-sunrise-amber' : 'bg-success') : 'bg-slate-100'}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sunrise-blue" /> Recent Notes
                  </h3>
                  <button onClick={() => { setActiveTab('Progress Notes'); setIsComposingNote(true); }} className="text-sm text-sunrise-blue font-medium hover:underline">
                    + Quick Note
                  </button>
                </div>
                {patient.notes.length > 0 ? (
                  <div className="space-y-4">
                    {patient.notes.slice(0, 3).map(note => (
                      <div key={note.id} className="border border-border p-4 rounded-lg bg-bg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold text-navy">{note.type} Note</div>
                          <div className="text-xs text-slate">{note.date}</div>
                        </div>
                        <p className="text-sm text-slate-light mb-2 line-clamp-2">{note.content}</p>
                        <div className="text-xs font-medium text-slate">By: {note.author}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-bg rounded-lg border border-dashed border-border">
                    <div className="text-2xl mb-2">📋</div>
                    <div className="text-sm font-medium text-slate">No recent notes</div>
                    <div className="text-xs text-slate-light mt-1">Progress notes authored by the clinical team appear here once signed.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ASAM ASSESSMENT ── */}
        {activeTab === 'ASAM Assessment' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-sunrise-blue/10 border border-sunrise-blue/20 p-4 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sunrise-blue text-lg">Recommended Level of Care</h3>
                <p className="text-slate text-sm">Based on most recent multidimensional assessment</p>
              </div>
              <div className="text-2xl font-bold text-sunrise-blue bg-white px-4 py-2 rounded shadow-sm">Residential (3.7)</div>
            </div>
            {[
              { d: 1, label: 'Acute Intoxication & Withdrawal Potential', score: patient.asam.d1, text: 'Client indicates moderate to severe withdrawal potential requiring medical monitoring.' },
              { d: 2, label: 'Biomedical Conditions & Complications', score: patient.asam.d2, text: 'Stable biomedical conditions. Routine monitoring required.' },
              { d: 3, label: 'Emotional, Behavioral & Cognitive Conditions', score: patient.asam.d3, text: 'Significant emotional instability. Diagnosed with co-occurring psychiatric condition. Symptoms interfere with recovery.' },
              { d: 4, label: 'Readiness to Change', score: patient.asam.d4, text: 'Client exhibits mixed motivation. Internal motivation is currently low to moderate; external drivers present.' },
              { d: 5, label: 'Relapse, Continued Use & Continued Problem Potential', score: patient.asam.d5, text: 'High risk of relapse without structured environment. Previous attempts at outpatient treatment have failed.' },
              { d: 6, label: 'Recovery & Living Environment', score: patient.asam.d6, text: 'Current living environment is unsupportive of recovery. Substance use prevalent in social network.' },
            ].map(dim => (
              <div key={dim.d} className="border border-border rounded-lg overflow-hidden">
                <div className="bg-bg px-4 py-3 border-b border-border flex justify-between items-center">
                  <div className="font-bold text-navy flex items-center gap-3">
                    <span className="bg-white border border-border w-8 h-8 rounded flex items-center justify-center text-sunrise-blue">D{dim.d}</span>
                    {dim.label}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate">Severity:</span>
                    <span className={`px-2 py-0.5 rounded text-sm font-bold text-white ${dim.score >= 3 ? 'bg-critical' : dim.score === 2 ? 'bg-sunrise-amber' : 'bg-success'}`}>{dim.score}/4</span>
                  </div>
                </div>
                <div className="p-4">
                  <textarea
                    className={`w-full text-sm text-slate border border-border rounded p-3 focus:outline-none focus:border-sunrise-blue min-h-[100px] ${readOnly ? 'bg-gray-50 cursor-not-allowed opacity-70' : ''}`}
                    defaultValue={dim.text}
                    disabled={readOnly}
                  />
                  <div className="flex gap-4 mt-3">
                    <label className={`flex items-center gap-2 text-sm text-slate ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}>
                      <input type="checkbox" checked={dim.score >= 3} readOnly disabled={readOnly} className="rounded" /> Immediate Risk
                    </label>
                    <label className={`flex items-center gap-2 text-sm text-slate ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}>
                      <input type="checkbox" checked={dim.score > 0} readOnly disabled={readOnly} className="rounded" /> Service Required
                    </label>
                  </div>
                  {readOnly && <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1"><Eye className="w-3 h-3" /> View only — switch to a clinician role to edit assessments.</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PROGRESS NOTES ── */}
        {activeTab === 'Progress Notes' && (
          <div className="flex h-full gap-6">
            {/* ── List panel ─────────────────────────────────────────────────── */}
            <div className={`flex-col h-full ${isComposingNote ? 'w-1/3' : 'w-full'}`}>
              {/* Title row + New Note button */}
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-navy">
                  Progress Notes
                  {DATA_MODE === 'production' && clinicalNotes.length > 0 && noteTypeFilter !== 'All' && (
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      ({clinicalNotes.filter(n => n.noteType === noteTypeFilter).length} of {clinicalNotes.length})
                    </span>
                  )}
                  {DATA_MODE !== 'production' && noteTypeFilter !== 'All' && (
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      ({patient.notes.filter(n => n.type === noteTypeFilter).length} of {patient.notes.length})
                    </span>
                  )}
                </h2>
                {!isComposingNote && (
                  <LockedButton
                    locked={readOnly}
                    data-testid="new-note-btn"
                    onClick={() => { setIsComposingNote(true); setNoteIsDirty(false); setEditingNoteId(null); setNoteContent(''); setNoteApiError(null); setNoteConflict(false); }}
                    className="bg-sunrise-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-sunrise-blue-light transition-colors"
                  >
                    + New Note
                  </LockedButton>
                )}
              </div>

              {/* Production: loading / error banners */}
              {DATA_MODE === 'production' && clinicalNotesLoading && (
                <div className="text-center p-8 text-slate text-sm animate-pulse">Loading notes…</div>
              )}
              {DATA_MODE === 'production' && clinicalNotesError && (
                <div className="text-center p-8 text-rose-600 text-sm border border-dashed border-rose-200 rounded-lg bg-rose-50">
                  {clinicalNotesError}
                </div>
              )}

              {/* Filter pills — production mode */}
              {!isComposingNote && DATA_MODE === 'production' && !clinicalNotesLoading && !clinicalNotesError && (() => {
                const types = Array.from(new Set(clinicalNotes.map(n => n.noteType)));
                return types.length > 1 ? (
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {(['All', ...types] as string[]).map(t => (
                      <button key={t} onClick={() => setNoteTypeFilter(t)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border ${noteTypeFilter === t ? 'bg-navy text-white border-navy' : 'bg-white text-slate border-slate-200 hover:border-navy/40 hover:text-navy'}`}>
                        {t === 'progress_note' ? 'Progress' : t === 'nursing_note' ? 'Nursing' : t}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Filter pills — demo mode */}
              {!isComposingNote && DATA_MODE !== 'production' && (() => {
                const types = Array.from(new Set(patient.notes.map(n => n.type)));
                return types.length > 1 ? (
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {(['All', ...types] as string[]).map(t => (
                      <button key={t} onClick={() => setNoteTypeFilter(t)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border ${noteTypeFilter === t ? 'bg-navy text-white border-navy' : 'bg-white text-slate border-slate-200 hover:border-navy/40 hover:text-navy'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Void confirmation modal — production mode only (Phase 3 §5) */}
              {DATA_MODE === 'production' && voidModalNoteId && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                  onClick={() => { if (!voidSubmitting) { setVoidModalNoteId(null); setVoidReason(''); setVoidError(null); } }}
                >
                  <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-navy text-lg mb-1">Void Note</h3>
                    <p className="text-sm text-slate mb-4">
                      This action is irreversible. The note will be marked voided and its original content
                      preserved for the audit record. A void reason is required.
                    </p>
                    {voidError && (
                      <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded text-sm text-rose-600">{voidError}</div>
                    )}
                    <label className="block text-xs font-bold text-slate mb-1 uppercase tracking-wider">
                      Void Reason <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      data-testid="void-reason-input"
                      className="w-full border border-border rounded p-2 text-sm focus:outline-none focus:border-sunrise-blue min-h-[80px] mb-4"
                      placeholder="Enter a clinical reason for voiding this note (min. 5 characters)…"
                      value={voidReason}
                      onChange={e => setVoidReason(e.target.value)}
                      disabled={voidSubmitting}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setVoidModalNoteId(null); setVoidReason(''); setVoidError(null); }}
                        className="px-4 py-2 border border-border text-slate rounded text-sm font-medium hover:bg-slate-50"
                        disabled={voidSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        data-testid="confirm-void-btn"
                        onClick={handleProductionVoidNote}
                        disabled={voidReason.trim().length < 5 || voidSubmitting}
                        className={`px-4 py-2 rounded text-sm font-medium text-white transition-colors ${
                          voidReason.trim().length >= 5 && !voidSubmitting
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {voidSubmitting ? 'Voiding…' : 'Confirm Void'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Note list — production mode */}
              {DATA_MODE === 'production' && !clinicalNotesLoading && !clinicalNotesError && (
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                  {clinicalNotes
                    .filter(n => noteTypeFilter === 'All' || n.noteType === noteTypeFilter)
                    .map(note => (
                      <div
                        key={note.id}
                        data-testid={`note-card-${note.id}`}
                        data-status={note.status}
                        className={`border border-border rounded-lg p-4 transition-colors group ${note.status === 'draft' ? 'hover:border-sunrise-blue cursor-pointer' : ''}`}
                        onClick={() => {
                          if (note.status === 'draft') {
                            setEditingNoteId(note.id);
                            setEditingNoteVersion(note.version);
                            setNoteContent(note.content ?? '');
                            setApiNoteType(note.noteType as 'progress_note' | 'nursing_note');
                            setNoteIsDirty(false);
                            setNoteApiError(null);
                            setNoteConflict(false);
                            setIsComposingNote(true);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-bold text-navy ${note.status === 'draft' ? 'group-hover:text-sunrise-blue transition-colors' : ''}`}>
                              {note.noteType === 'progress_note' ? 'Progress' : 'Nursing'} Note
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              note.status === 'signed'  ? 'bg-success/20 text-success' :
                              note.status === 'voided'  ? 'bg-slate-200 text-slate line-through' :
                                                          'bg-slate-100 text-slate'
                            }`}>
                              {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs font-medium text-slate">{new Date(note.createdAt).toLocaleDateString()}</span>
                            {note.status === 'signed' && canVoidNote && (
                              <button
                                data-testid={`void-note-btn-${note.id}`}
                                onClick={e => {
                                  e.stopPropagation();
                                  setVoidModalNoteId(note.id);
                                  setVoidModalNoteVersion(note.version);
                                  setVoidReason('');
                                  setVoidError(null);
                                }}
                                className="text-[10px] px-2 py-0.5 rounded border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors font-medium"
                                title="Void this note (requires supervisory permission)"
                              >
                                Void
                              </button>
                            )}
                          </div>
                        </div>
                        {note.content && <p className="text-sm text-navy line-clamp-3">{note.content}</p>}
                        {note.status === 'draft'  && <p className="text-[10px] text-slate mt-1">Click to edit</p>}
                        {note.status === 'signed' && note.signedAt && (
                          <p className="text-[10px] text-success mt-1">
                            Signed {new Date(note.signedAt).toLocaleString()}
                          </p>
                        )}
                        {note.status === 'voided' && (
                          <p className="text-[10px] text-slate mt-1">
                            Voided {note.voidedAt ? new Date(note.voidedAt).toLocaleString() : '—'}
                            {note.voidReason ? ` — Reason: ${note.voidReason}` : ''}
                          </p>
                        )}
                      </div>
                    ))}
                  {clinicalNotes.filter(n => noteTypeFilter === 'All' || n.noteType === noteTypeFilter).length === 0 && (
                    <div className="text-center p-12 border border-dashed border-border rounded-lg bg-bg text-slate">
                      {noteTypeFilter === 'All' ? 'No notes yet. Click "+ New Note" to begin.' : 'No notes of this type for this patient.'}
                    </div>
                  )}
                </div>
              )}

              {/* Note list — demo mode */}
              {DATA_MODE !== 'production' && (
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                  {patient.notes.filter(n => noteTypeFilter === 'All' || n.type === noteTypeFilter).map(note => (
                    <div key={note.id} className="border border-border rounded-lg p-4 hover:border-sunrise-blue transition-colors cursor-pointer group">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy group-hover:text-sunrise-blue transition-colors">{note.type} Note</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${note.status === 'Signed' ? 'bg-success/20 text-success' : note.status === 'Draft' ? 'bg-slate-100 text-slate' : 'bg-sunrise-amber/20 text-sunrise-amber'}`}>{note.status}</span>
                        </div>
                        <span className="text-xs font-medium text-slate">{note.date}</span>
                      </div>
                      <div className="text-xs text-slate-light mb-3">Format: {note.format} • Author: {note.author}</div>
                      <p className="text-sm text-navy line-clamp-3">{note.content}</p>
                    </div>
                  ))}
                  {patient.notes.filter(n => noteTypeFilter === 'All' || n.type === noteTypeFilter).length === 0 && (
                    <div className="text-center p-12 border border-dashed border-border rounded-lg bg-bg text-slate">
                      {noteTypeFilter === 'All' ? 'No notes yet. Click "+ New Note" to begin.' : `No "${noteTypeFilter}" notes for this patient.`}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Compose / edit panel ────────────────────────────────────────── */}
            {isComposingNote && (
              <div className="w-2/3 border border-border rounded-lg flex flex-col overflow-hidden shadow-sm">
                <div className="bg-bg p-4 border-b border-border flex justify-between items-center">
                  <h3 className="font-bold text-navy">
                    {DATA_MODE === 'production' ? (editingNoteId ? 'Edit Draft' : 'New Note') : 'Compose Note'}
                  </h3>
                  <div className="flex gap-2">
                    {DATA_MODE === 'production' ? (
                      <select
                        value={apiNoteType}
                        onChange={e => setApiNoteType(e.target.value as 'progress_note' | 'nursing_note')}
                        className="border border-border rounded px-2 py-1 text-sm text-slate focus:outline-none"
                        disabled={!!editingNoteId}
                      >
                        <option value="progress_note">Progress Note</option>
                        <option value="nursing_note">Nursing Note</option>
                      </select>
                    ) : (
                      <select value={noteFormat} onChange={e => setNoteFormat(e.target.value)} className="border border-border rounded px-2 py-1 text-sm text-slate focus:outline-none">
                        <option value="BIRP">BIRP Format</option>
                        <option value="DAP">DAP Format</option>
                        <option value="Free Text">Free Text</option>
                      </select>
                    )}
                    <button onClick={() => resetComposeState()} className="text-slate hover:text-navy px-2 py-1">Cancel</button>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {DATA_MODE === 'production' ? (
                      /* ── Production compose / edit ── */
                      <div>
                        {noteConflict && (
                          <div className="mb-3 p-3 bg-sunrise-amber/10 border border-sunrise-amber rounded text-sm text-sunrise-amber">
                            This note was modified elsewhere. Reload the patient chart to get the latest version before editing.
                          </div>
                        )}
                        {noteApiError && !noteConflict && (
                          <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded text-sm text-rose-600">
                            {noteApiError}
                          </div>
                        )}
                        <label className="block text-xs font-bold text-slate mb-1 uppercase">Note Content</label>
                        <textarea
                          data-testid="note-content"
                          className="w-full border border-border rounded p-2 text-sm focus:outline-none focus:border-sunrise-blue min-h-[300px]"
                          placeholder="Enter clinical note content…"
                          value={noteContent}
                          onChange={e => { setNoteContent(e.target.value); setNoteIsDirty(true); }}
                          disabled={noteSaving || noteConflict}
                        />
                      </div>
                    ) : (
                      /* ── Demo compose ── */
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate mb-1">Note Type</label>
                            <select className="w-full border border-border rounded p-2 text-sm focus:outline-none focus:border-sunrise-blue">
                              <option>Individual Therapy</option>
                              <option>Group Therapy</option>
                              <option>Case Management</option>
                              <option>Medical/Psychiatric</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate mb-1">Date/Time</label>
                            <input type="datetime-local" className="w-full border border-border rounded p-2 text-sm focus:outline-none focus:border-sunrise-blue" defaultValue={new Date().toISOString().slice(0, 16)} />
                          </div>
                        </div>
                        {noteFormat === 'BIRP' && (
                          <>
                            {['Behavior', 'Intervention', 'Response', 'Plan'].map((section, si) => (
                              <div key={section}>
                                <label className="block text-xs font-bold text-navy mb-1 uppercase">{section}</label>
                                <textarea
                                  className="w-full border border-border rounded p-2 text-sm focus:outline-none focus:border-sunrise-blue min-h-[80px]"
                                  placeholder={si === 0 ? 'Objective description of client presentation...' : si === 1 ? "Counselor's methods and actions..." : si === 2 ? "Client's reaction to intervention..." : 'Next steps, assignments, future appointments...'}
                                  value={si === 0 ? noteContent : undefined}
                                  onChange={si === 0 ? e => setNoteContent(e.target.value) : undefined}
                                />
                              </div>
                            ))}
                          </>
                        )}
                        {noteFormat === 'DAP' && (
                          <>
                            {['Data', 'Assessment', 'Plan'].map(section => (
                              <div key={section}>
                                <label className="block text-xs font-bold text-navy mb-1 uppercase">{section}</label>
                                <textarea className="w-full border border-border rounded p-2 text-sm focus:outline-none focus:border-sunrise-blue min-h-[80px]" placeholder={`${section} section...`} />
                              </div>
                            ))}
                          </>
                        )}
                        {noteFormat === 'Free Text' && (
                          <div>
                            <label className="block text-xs font-bold text-navy mb-1 uppercase">Note</label>
                            <textarea className="w-full border border-border rounded p-2 text-sm focus:outline-none focus:border-sunrise-blue min-h-[240px]" placeholder="Free-text note..." />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {DATA_MODE !== 'production' && (
                    <div className="w-64 border-l border-border bg-bg p-4 flex flex-col">
                      <CustomButtons onInsert={handleQuickInsert} />
                    </div>
                  )}
                </div>

                <div className="bg-bg border-t border-border p-4 flex justify-between items-center">
                  {DATA_MODE === 'production' ? (
                    <div className="text-xs text-slate">{noteSaving ? 'Saving…' : 'Use "Save Draft" to keep your work, or "Sign & Lock" to finalise.'}</div>
                  ) : (
                    <div className="text-xs text-slate">Auto-saved at {new Date().toLocaleTimeString()}</div>
                  )}
                  <div className="flex gap-2">
                    {DATA_MODE === 'production' ? (
                      <>
                        <LockedButton
                          locked={!!readOnly || noteSaving || !noteIsDirty || noteConflict}
                          data-testid="save-draft-btn"
                          onClick={handleProductionSaveDraft}
                          className={`px-4 py-2 border rounded text-sm font-medium transition-colors ${noteIsDirty && !noteSaving && !noteConflict ? 'border-border text-slate hover:bg-slate-50' : 'border-border text-slate opacity-40 cursor-not-allowed pointer-events-none'}`}
                        >
                          {noteSaving ? 'Saving…' : 'Save Draft'}
                        </LockedButton>
                        <LockedButton
                          locked={readOnly || noteSaving || !noteIsDirty || noteConflict}
                          data-testid="sign-lock-btn"
                          onClick={handleProductionSignNote}
                          className={`px-4 py-2 bg-sunrise-blue text-white rounded text-sm font-medium transition-colors ${noteIsDirty && !noteSaving && !noteConflict ? 'hover:bg-sunrise-blue-light' : 'opacity-40 cursor-not-allowed pointer-events-none'}`}
                        >
                          {noteSaving ? 'Saving…' : 'Sign & Lock'}
                        </LockedButton>
                      </>
                    ) : (
                      <>
                        <LockedButton
                          locked={!!readOnly}
                          onClick={() => noteIsDirty && saveChartAction('Draft saved')}
                          className={`px-4 py-2 border rounded text-sm font-medium transition-colors ${noteIsDirty ? 'border-border text-slate hover:bg-slate-50' : 'border-border text-slate opacity-40 cursor-not-allowed pointer-events-none'}`}
                          title={noteIsDirty ? undefined : 'Write a note before saving'}
                        >Save Draft</LockedButton>
                        <LockedButton
                          locked={!!readOnly}
                          onClick={() => noteIsDirty && saveChartAction('Note sent for co-sign')}
                          className={`px-4 py-2 border rounded text-sm font-medium transition-colors ${noteIsDirty ? 'border-sunrise-orange text-sunrise-orange bg-sunrise-orange/10 hover:bg-sunrise-orange/20' : 'border-border text-slate opacity-40 cursor-not-allowed pointer-events-none'}`}
                          title={noteIsDirty ? undefined : 'Write a note before sending for co-sign'}
                        >Send for Co-sign</LockedButton>
                        <LockedButton
                          locked={readOnly}
                          onClick={() => noteIsDirty && saveChartAction('Note signed and locked')}
                          className={`px-4 py-2 bg-sunrise-blue text-white rounded text-sm font-medium transition-colors ${noteIsDirty ? 'hover:bg-sunrise-blue-light' : 'opacity-40 cursor-not-allowed pointer-events-none'}`}
                          title={noteIsDirty ? undefined : 'Add note content before signing'}
                        >Sign & Lock</LockedButton>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TREATMENT PLAN ── */}
        {activeTab === 'Treatment Plan' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-navy">Master Treatment Plan</h2>
              <div className="flex gap-2">
                <LockedButton locked={readOnly} onClick={() => saveChartAction('Treatment plan reviewed')} className="px-3 py-1.5 border border-border rounded text-sm font-medium text-slate hover:bg-slate-50">Review Plan</LockedButton>
                <LockedButton locked={readOnly} onClick={() => saveChartAction('Goal added to treatment plan')} className="px-3 py-1.5 bg-sunrise-blue text-white rounded text-sm font-medium hover:bg-sunrise-blue-light">+ Add Goal</LockedButton>
              </div>
            </div>
            {patient.goals.length > 0 ? (
              <div className="space-y-4">
                {patient.goals.map(goal => (
                  <div key={goal.id} className="border border-border rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-bg px-4 py-3 border-b border-border flex justify-between items-center">
                      <div className="font-bold text-navy">{goal.category} Goal</div>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${goal.status === 'Met' ? 'bg-success/20 text-success' : goal.status === 'In Progress' ? 'bg-sunrise-blue/20 text-sunrise-blue' : 'bg-slate-100 text-slate'}`}>{goal.status}</span>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <div className="text-xs font-bold text-slate uppercase tracking-wider mb-1">Problem Statement</div>
                        <div className="text-sm text-navy font-medium">{goal.problem}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-6 border-t border-border pt-4">
                        <div>
                          <div className="text-xs font-bold text-slate uppercase tracking-wider mb-1">Long Term Goal</div>
                          <div className="text-sm text-navy">{goal.longTerm}</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate uppercase tracking-wider mb-1">Short Term Objective</div>
                          <div className="text-sm text-navy">{goal.shortTerm}</div>
                          <div className="text-xs text-sunrise-orange font-medium mt-1">Target: {goal.targetDate}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 border border-dashed border-border rounded-lg bg-bg">
                <h3 className="font-semibold text-slate mb-2">No Active Goals</h3>
                <p className="text-sm text-slate-light mb-4">Create a treatment plan to track client progress.</p>
                <LockedButton locked={readOnly} onClick={() => saveChartAction('Treatment plan initialized')} className="px-4 py-2 bg-sunrise-blue text-white rounded text-sm font-medium hover:bg-sunrise-blue-light">Initialize Master Treatment Plan</LockedButton>
              </div>
            )}
          </div>
        )}

        {/* ── MEDICATIONS ── */}
        {activeTab === 'Medications' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2"><Pill className="w-5 h-5 text-sunrise-blue" /> Medication Administration Record</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 border border-border rounded text-sm font-medium text-slate hover:bg-slate-50">Print MAR</button>
                <LockedButton locked={readOnly} onClick={() => saveChartAction('Medication order submitted')} className="px-3 py-1.5 bg-sunrise-blue text-white rounded text-sm font-medium hover:bg-sunrise-blue-light">+ Order Medication</LockedButton>
              </div>
            </div>

            {/* Class legend */}
            <div className="flex gap-3 flex-wrap">
              {[
                { cls: 'MAT', color: 'bg-purple-100 text-purple-700 border-purple-300' },
                { cls: 'Psychiatric', color: 'bg-sunrise-blue/10 text-sunrise-blue border-sunrise-blue/30' },
                { cls: 'Medical', color: 'bg-success/10 text-success border-success/30' },
                { cls: 'PRN', color: 'bg-sunrise-amber/10 text-sunrise-amber border-sunrise-amber/30' },
              ].map(c => (
                <span key={c.cls} className={`text-xs font-bold px-2 py-1 rounded border ${c.color}`}>{c.cls}</span>
              ))}
              <span className="text-xs text-slate ml-2 self-center">Medication classification badges</span>
            </div>

            {/* Active meds */}
            <div>
              <h3 className="font-bold text-navy mb-3">Active Medications</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg border-b border-border">
                      {['Medication', 'Class', 'Dose / Route', 'Frequency', 'Today', 'Indication', 'Prescriber', 'Start Date', ''].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {meds.filter(m => m.status === 'Active').map(med => {
                      const clsCls = med.class === 'MAT' ? 'bg-purple-100 text-purple-700 border-purple-200' : med.class === 'Psychiatric' ? 'bg-sunrise-blue/10 text-sunrise-blue border-sunrise-blue/20' : med.class === 'Medical' ? 'bg-success/10 text-success border-success/20' : 'bg-sunrise-amber/10 text-sunrise-amber border-sunrise-amber/20';
                      return (
                        <tr key={med.id} className="hover:bg-bg transition-colors">
                          <td className="px-3 py-3">
                            <div className="font-semibold text-navy">{med.name}</div>
                            {med.genericName && <div className="text-xs text-slate">{med.genericName}</div>}
                          </td>
                          <td className="px-3 py-3"><span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${clsCls}`}>{med.class}</span></td>
                          <td className="px-3 py-3 text-slate">{med.dose} <span className="text-slate-light">/ {med.route}</span></td>
                          <td className="px-3 py-3 text-slate">{med.frequency}</td>
                          <td className="px-3 py-3">
                            {(() => {
                              const s = getMARStatus(med);
                              if (!s) return <span className="text-slate-300 text-xs">—</span>;
                              const cls = s.label === 'Given'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : s.label === 'Overdue'
                                  ? 'bg-red-100 text-red-700 border-red-200 animate-pulse'
                                  : 'bg-amber-100 text-amber-700 border-amber-200';
                              return (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cls}`}>
                                  {s.label}{s.time ? ` · ${s.time}` : ''}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-3 py-3 text-slate text-xs max-w-[200px]">{med.indication}</td>
                          <td className="px-3 py-3 text-slate text-xs">{med.prescriber.split(' ').slice(0, 2).join(' ')}</td>
                          <td className="px-3 py-3 text-slate text-xs">{med.startDate}</td>
                          <td className="px-3 py-3"><button className="text-xs text-slate hover:text-sunrise-blue font-medium">Edit</button></td>
                        </tr>
                      );
                    })}
                    {meds.filter(m => m.status === 'On Hold').map(med => (
                      <tr key={med.id} className="bg-sunrise-amber/5 hover:bg-sunrise-amber/10 transition-colors">
                        <td className="px-3 py-3">
                          <div className="font-semibold text-navy">{med.name}</div>
                          {med.genericName && <div className="text-xs text-slate">{med.genericName}</div>}
                        </td>
                        <td className="px-3 py-3" colSpan={5}>
                          <span className="text-xs font-bold text-sunrise-amber bg-sunrise-amber/10 border border-sunrise-amber/30 px-2 py-0.5 rounded">ON HOLD</span>
                          <span className="text-xs text-slate ml-3">{med.indication}</span>
                        </td>
                        <td className="px-3 py-3 text-slate text-xs">{med.startDate}</td>
                        <td className="px-3 py-3"><button className="text-xs text-slate hover:text-sunrise-blue font-medium">Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Discontinued meds */}
            {meds.filter(m => m.status === 'Discontinued').length > 0 && (
              <div>
                <h3 className="font-bold text-slate mb-3 text-sm uppercase tracking-wider">Discontinued</h3>
                <div className="border border-border rounded-lg overflow-hidden opacity-70">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      {meds.filter(m => m.status === 'Discontinued').map(med => (
                        <tr key={med.id} className="bg-slate-50">
                          <td className="px-3 py-2.5">
                            <span className="font-semibold text-slate line-through">{med.name}</span>
                            {med.genericName && <span className="text-xs text-slate-light ml-2">{med.genericName}</span>}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate">{med.dose} / {med.route}</td>
                          <td className="px-3 py-2.5 text-xs text-slate">D/C: {med.dcDate}</td>
                          <td className="px-3 py-2.5 text-xs text-slate max-w-[300px]">Reason: {med.dcReason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── GROUP NOTES ── */}
        {activeTab === 'Group Notes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2"><Users className="w-5 h-5 text-sunrise-blue" /> Group Therapy Attendance</h2>
              <LockedButton locked={readOnly} onClick={() => saveChartAction('Group note created')} className="px-3 py-1.5 bg-sunrise-blue text-white rounded text-sm font-medium hover:bg-sunrise-blue-light">+ Group Note</LockedButton>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-bg border border-border rounded-lg p-4">
                <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Sessions This Stay</div>
                <div className="text-3xl font-bold text-navy">{groupSessions.length}</div>
              </div>
              <div className="bg-bg border border-border rounded-lg p-4">
                <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Attended</div>
                <div className="text-3xl font-bold text-success">{attendedCount}</div>
              </div>
              <div className="bg-bg border border-border rounded-lg p-4">
                <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Attendance Rate</div>
                <div className={`text-3xl font-bold ${attendancePct >= 80 ? 'text-success' : attendancePct >= 60 ? 'text-sunrise-amber' : 'text-critical'}`}>{attendancePct}%</div>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg border-b border-border">
                    {['Date', 'Group', 'Topic', 'Facilitator', 'Status', 'Note'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {groupSessions.map(session => (
                    <tr key={session.id} className="hover:bg-bg transition-colors">
                      <td className="px-3 py-3 text-xs text-slate font-medium whitespace-nowrap">{session.date}<br /><span className="text-slate-light">{session.time}</span></td>
                      <td className="px-3 py-3 font-semibold text-navy text-xs">{session.name}</td>
                      <td className="px-3 py-3 text-xs text-slate">{session.topic}</td>
                      <td className="px-3 py-3 text-xs text-slate">{session.facilitator.split(',')[0]}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${session.status === 'Present' ? 'bg-success/20 text-success' : session.status === 'Absent' ? 'bg-critical/20 text-critical' : 'bg-sunrise-amber/20 text-sunrise-amber'}`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate max-w-[220px] truncate">{session.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── VITALS ── */}
        {activeTab === 'Vitals' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2"><HeartPulse className="w-5 h-5 text-sunrise-blue" /> Vital Signs</h2>
              <LockedButton locked={!!readOnly} onClick={() => setShowVitalsForm(v => !v)} className="px-3 py-1.5 bg-sunrise-blue text-white rounded text-sm font-medium hover:bg-sunrise-blue-light">+ Record Vitals</LockedButton>
            </div>

            {/* Record Vitals inline form */}
            {showVitalsForm && (
              <div className="border border-sunrise-blue/30 rounded-lg p-4 bg-sunrise-blue/5 space-y-4">
                <h3 className="font-bold text-navy text-sm">New Vitals Entry</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'bp',   label: 'Blood Pressure',  placeholder: '120/80', type: 'text'   },
                    { key: 'hr',   label: 'Heart Rate (bpm)', placeholder: '72',    type: 'number' },
                    { key: 'temp', label: 'Temp (°F)',        placeholder: '98.6',   type: 'number' },
                    { key: 'o2',   label: 'O₂ Sat (%)',       placeholder: '98',    type: 'number' },
                    { key: 'rr',   label: 'Resp. Rate',       placeholder: '16',    type: 'number' },
                    { key: 'pain', label: 'Pain (0–10)',       placeholder: '0',     type: 'number' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-slate mb-1">{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        value={vitalsForm[f.key as keyof typeof vitalsForm]}
                        onChange={e => setVitalsForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full border border-border rounded px-2 py-1.5 text-sm text-navy focus:outline-none focus:border-sunrise-blue"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowVitalsForm(false)} className="px-3 py-1.5 text-sm text-slate border border-border rounded hover:bg-slate-50">Cancel</button>
                  <button onClick={submitVitals} className="px-3 py-1.5 text-sm font-semibold text-white bg-sunrise-blue rounded hover:bg-sunrise-blue-light">Save Vitals</button>
                </div>
              </div>
            )}

            {/* Latest vitals */}
            {localVitals.length > 0 && (() => {
              const latest = localVitals[0];
              const cards = [
                { label: 'Blood Pressure', value: latest.bp, unit: 'mmHg', warn: parseInt(latest.bp) > 140 },
                { label: 'Heart Rate', value: String(latest.hr), unit: 'bpm', warn: latest.hr > 100 },
                { label: 'Temperature', value: String(latest.temp), unit: '°F', warn: latest.temp > 99.5 },
                { label: 'O₂ Saturation', value: String(latest.o2), unit: '%', warn: latest.o2 < 95 },
                { label: 'Resp. Rate', value: String(latest.rr), unit: '/min', warn: latest.rr > 20 },
                ...(latest.weight ? [{ label: 'Weight', value: String(latest.weight), unit: 'lbs', warn: false }] : []),
                ...(latest.cows !== undefined ? [{ label: 'COWS Score', value: String(latest.cows), unit: `${latest.cows >= 13 ? 'Moderate' : latest.cows >= 5 ? 'Mild' : 'Min'}`, warn: latest.cows >= 13 }] : []),
                ...(latest.ciwa !== undefined ? [{ label: 'CIWA Score', value: String(latest.ciwa), unit: `${latest.ciwa >= 15 ? 'Severe' : latest.ciwa >= 8 ? 'Moderate' : 'Mild'}`, warn: latest.ciwa >= 8 }] : []),
                { label: 'Pain', value: String(latest.pain), unit: '/10', warn: latest.pain >= 7 },
              ];
              return (
                <div>
                  <div className="text-xs text-slate mb-3 font-medium">Most Recent: {latest.date} {latest.time} — Recorded by {latest.recordedBy}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {cards.map(c => (
                      <div key={c.label} className={`border rounded-lg p-3 ${c.warn ? 'border-sunrise-amber bg-sunrise-amber/5' : 'border-border bg-bg'}`}>
                        <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">{c.label}</div>
                        <div className={`text-2xl font-bold ${c.warn ? 'text-sunrise-amber' : 'text-navy'}`}>{c.value}</div>
                        <div className="text-xs text-slate">{c.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* History table */}
            <div>
              <h3 className="font-bold text-navy mb-3">Vitals History</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg border-b border-border">
                      {['Date/Time', 'BP', 'HR', 'Temp', 'O₂', 'RR', 'COWS', 'CIWA', 'Pain', 'Recorded By'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {localVitals.map(v => (
                      <tr key={v.id} className="hover:bg-bg transition-colors">
                        <td className="px-3 py-2 text-xs text-slate font-medium">{v.date} {v.time}</td>
                        <td className={`px-3 py-2 text-xs font-semibold ${parseInt(v.bp) > 140 ? 'text-sunrise-amber' : 'text-navy'}`}>{v.bp}</td>
                        <td className={`px-3 py-2 text-xs font-semibold ${v.hr > 100 ? 'text-sunrise-amber' : 'text-navy'}`}>{v.hr}</td>
                        <td className={`px-3 py-2 text-xs font-semibold ${v.temp > 99.5 ? 'text-critical' : 'text-navy'}`}>{v.temp}</td>
                        <td className={`px-3 py-2 text-xs font-semibold ${v.o2 < 95 ? 'text-critical' : 'text-navy'}`}>{v.o2}%</td>
                        <td className="px-3 py-2 text-xs text-slate">{v.rr}</td>
                        <td className="px-3 py-2 text-xs">
                          {v.cows !== undefined ? <span className={`font-bold ${v.cows >= 13 ? 'text-critical' : v.cows >= 5 ? 'text-sunrise-amber' : 'text-success'}`}>{v.cows}</span> : <span className="text-slate-light">—</span>}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {v.ciwa !== undefined ? <span className={`font-bold ${v.ciwa >= 15 ? 'text-critical' : v.ciwa >= 8 ? 'text-sunrise-amber' : 'text-success'}`}>{v.ciwa}</span> : <span className="text-slate-light">—</span>}
                        </td>
                        <td className={`px-3 py-2 text-xs font-semibold ${v.pain >= 7 ? 'text-critical' : v.pain >= 4 ? 'text-sunrise-amber' : 'text-success'}`}>{v.pain}/10</td>
                        <td className="px-3 py-2 text-xs text-slate">{v.recordedBy.split(',')[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── LABS ── */}
        {activeTab === 'Labs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2"><FlaskConical className="w-5 h-5 text-sunrise-blue" /> Laboratory Results</h2>
              <LockedButton locked={readOnly} onClick={() => saveChartAction('Lab order submitted')} className="px-3 py-1.5 bg-sunrise-blue text-white rounded text-sm font-medium hover:bg-sunrise-blue-light">+ Order Labs</LockedButton>
            </div>

            {/* Critical alerts */}
            {labs.filter(l => l.flag === 'Critical').map(l => (
              <div key={l.id} className="bg-critical/10 border border-critical/40 rounded-lg p-3 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-critical flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-bold text-critical">Critical Result: </span>
                  <span className="text-navy font-semibold">{l.test}</span>
                  <span className="text-slate"> — {l.result} (ref: {l.refRange}) — ordered by {l.orderedBy}</span>
                </div>
              </div>
            ))}

            {panelsInOrder.map(panel => (
              <div key={panel}>
                <h3 className="font-bold text-navy mb-2 text-sm flex items-center gap-2">
                  <span className="text-xs font-bold bg-navy text-white px-2 py-0.5 rounded">{panel}</span>
                </h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-bg border-b border-border">
                        {['Test', 'Result', 'Unit', 'Reference Range', 'Flag', 'Date', 'Ordered By'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {labs.filter(l => l.panel === panel).map(lab => (
                        <tr key={lab.id} className={`hover:bg-bg transition-colors ${lab.flag === 'Critical' ? 'bg-critical/5' : lab.flag === 'Positive' ? 'bg-critical/5' : ''}`}>
                          <td className="px-3 py-2.5 font-semibold text-navy">{lab.test}</td>
                          <td className={`px-3 py-2.5 font-bold ${lab.flag === 'Normal' || lab.flag === 'Negative' ? 'text-navy' : lab.flag === 'Critical' || lab.flag === 'Positive' ? 'text-critical' : lab.flag === 'Pending' ? 'text-slate' : 'text-sunrise-amber'}`}>{lab.result}</td>
                          <td className="px-3 py-2.5 text-slate text-xs">{lab.unit}</td>
                          <td className="px-3 py-2.5 text-slate text-xs">{lab.refRange}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${flagColor[lab.flag] ?? 'text-slate bg-slate-100'}`}>{lab.flag}</span>
                          </td>
                          <td className="px-3 py-2.5 text-slate text-xs">{lab.date}</td>
                          <td className="px-3 py-2.5 text-slate text-xs">{lab.orderedBy.split(' ').slice(0, 2).join(' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── HISTORY ── */}
        {activeTab === 'History' && (
          <div className="space-y-8">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2"><BookOpen className="w-5 h-5 text-sunrise-blue" /> Psychosocial & Treatment History</h2>

            {/* Prior treatment episodes */}
            <div>
              <h3 className="font-bold text-navy mb-3 border-b border-border pb-2">Prior Treatment Episodes</h3>
              <div className="space-y-3">
                {[
                  { year: '2021', facility: 'Valley Recovery Center', loc: 'Residential (28d)', reason: 'Voluntary admission — opioid use disorder', dc: 'Completed program', outcome: 'Relapsed within 6 months' },
                  { year: '2020', facility: 'City Outpatient Services', loc: 'IOP (12 weeks)', reason: 'Outpatient referral from PCP', dc: 'AWOL / AMA discharge', outcome: 'Did not complete; continued use' },
                  { year: '2019', facility: 'Metro Detox Unit', loc: 'Medical Detox (5d)', reason: 'ER referral — opioid withdrawal', dc: 'Medically cleared', outcome: 'Declined further treatment at time' },
                ].map((ep, i) => (
                  <div key={i} className="border border-border rounded-lg p-4 hover:bg-bg transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-navy">{ep.facility}</div>
                      <span className="text-xs font-bold bg-navy/10 text-navy px-2 py-0.5 rounded">{ep.year}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-xs font-semibold text-slate uppercase">LOC:</span> <span className="text-slate">{ep.loc}</span></div>
                      <div><span className="text-xs font-semibold text-slate uppercase">Reason:</span> <span className="text-slate">{ep.reason}</span></div>
                      <div><span className="text-xs font-semibold text-slate uppercase">Discharge:</span> <span className="text-slate">{ep.dc}</span></div>
                      <div><span className="text-xs font-semibold text-slate uppercase">Outcome:</span> <span className="text-slate">{ep.outcome}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Substance use history */}
            <div>
              <h3 className="font-bold text-navy mb-3 border-b border-border pb-2">Substance Use History</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg border-b border-border">
                      {['Substance', 'Onset', 'Route', 'Frequency / Amount', 'Last Use', 'Longest Abstinence'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { sub: 'Heroin / Fentanyl', onset: 'Age 24 (2012)', route: 'IV', freq: 'Daily, ~0.5g/day', last: '2026-07-13', abstinence: '8 months (2020–2021)' },
                      { sub: 'Alcohol', onset: 'Age 17 (2005)', route: 'PO', freq: 'Weekends, 6–10 drinks', last: '2026-07-09', abstinence: '2 years (2015–2017)' },
                      { sub: 'Cannabis', onset: 'Age 16 (2004)', route: 'Inhaled', freq: '3–4x/week', last: '2026-07-05', abstinence: 'None significant' },
                      { sub: 'Benzodiazepines', onset: 'Age 30 (2018)', route: 'PO', freq: 'PRN, prescribed → misuse', last: '2026-07-14', abstinence: '—' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-bg">
                        <td className="px-3 py-2.5 font-semibold text-navy">{row.sub}</td>
                        <td className="px-3 py-2.5 text-slate text-xs">{row.onset}</td>
                        <td className="px-3 py-2.5 text-slate text-xs">{row.route}</td>
                        <td className="px-3 py-2.5 text-slate text-xs">{row.freq}</td>
                        <td className="px-3 py-2.5 text-slate text-xs">{row.last}</td>
                        <td className="px-3 py-2.5 text-slate text-xs">{row.abstinence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Family / Social history */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-navy mb-3 border-b border-border pb-2">Family History</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { rel: 'Father', note: 'Alcohol Use Disorder — untreated; deceased age 58' },
                    { rel: 'Mother', note: 'Anxiety/Depression — on medication; no SUD history' },
                    { rel: 'Sibling (Brother)', note: 'Opioid Use Disorder — currently in recovery, 3 years' },
                    { rel: 'Paternal Grandfather', note: 'Alcohol Use Disorder — history per family report' },
                  ].map((f, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-bg border border-border rounded">
                      <span className="font-semibold text-navy w-36 flex-shrink-0">{f.rel}:</span>
                      <span className="text-slate">{f.note}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-navy mb-3 border-b border-border pb-2">Social / Legal History</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Employment', value: 'Unemployed — lost job 6 months ago (attendance)' },
                    { label: 'Housing', value: 'Unstable; staying with family prior to admit' },
                    { label: 'Relationships', value: 'Divorced; 2 children (limited contact)' },
                    { label: 'Education', value: 'High school diploma; some college' },
                    { label: 'Legal', value: 'DUI 2021 (dismissed); current treatment is voluntary' },
                    { label: 'Trauma', value: 'Reports childhood abuse; PTSD diagnosis active' },
                    { label: 'Support System', value: 'Limited; brother in recovery is primary support' },
                  ].map((s, i) => (
                    <div key={i} className="flex gap-3 p-2.5 border-b border-border last:border-0">
                      <span className="font-semibold text-slate w-28 flex-shrink-0 text-xs uppercase tracking-wider pt-0.5">{s.label}</span>
                      <span className="text-slate text-sm">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DISCHARGE PLAN ── */}
        {activeTab === 'Discharge Plan' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-sunrise-blue" /> Discharge Planning
              </h2>
              <div className="flex gap-2">
                <LockedButton locked={readOnly} onClick={() => saveChartAction('Discharge plan updated')} className="px-3 py-1.5 border border-border rounded text-sm font-medium text-slate hover:bg-slate-50">Update Plan</LockedButton>
                <LockedButton locked={readOnly} onClick={() => saveChartAction('Discharge plan signed')} className="px-3 py-1.5 bg-sunrise-blue text-white rounded text-sm font-medium hover:bg-sunrise-blue-light">Finalize &amp; Sign</LockedButton>
              </div>
            </div>

            {/* Target Disposition */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Target Discharge Date', value: (() => { const d = new Date(patient.admitDate); d.setDate(d.getDate() + 30); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); })(), sub: `Day ${patient.los + 23} projected`, icon: '📅', color: 'border-l-sunrise-blue' },
                { label: 'Planned Disposition', value: 'Step Down to PHP', sub: 'Continued Outpatient Care', icon: '🏠', color: 'border-l-success' },
                { label: 'Clinician Responsible', value: patient.counselor, sub: 'Primary Counselor', icon: '👤', color: 'border-l-navy' },
              ].map(c => (
                <div key={c.label} className={`bg-white border border-border border-l-4 ${c.color} rounded-xl shadow-sm p-4`}>
                  <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-2">{c.label}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.icon}</span>
                    <div>
                      <div className="font-bold text-navy">{c.value}</div>
                      <div className="text-xs text-slate">{c.sub}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Discharge Readiness Checklist */}
            <div className="bg-white border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-navy mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" /> Discharge Readiness Checklist
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { item: 'Insurance authorization through discharge date', status: 'complete' },
                  { item: 'PHP program identified and enrolled', status: patient.recoveryScore > 70 ? 'complete' : 'pending' },
                  { item: 'Aftercare counseling scheduled (within 7 days)', status: 'complete' },
                  { item: 'MAT continuation — prescriber identified', status: patient.flags.some(f => f.type === 'Medication' && (f.note.includes('Suboxone') || f.note.includes('Vivitrol') || f.note.includes('Naltrexone'))) ? 'complete' : 'n-a' },
                  { item: 'Sober living or stable housing confirmed', status: patient.recoveryScore > 65 ? 'complete' : 'in-progress' },
                  { item: 'Sponsor / peer support contact established', status: patient.recoveryScore > 60 ? 'complete' : 'pending' },
                  { item: 'Family psychoeducation session completed', status: 'in-progress' },
                  { item: '42 CFR Part 2 release for aftercare provider', status: 'complete' },
                  { item: 'Patient goals met ≥ 70% per treatment plan', status: patient.recoveryScore > 65 ? 'complete' : 'in-progress' },
                  { item: 'Discharge summary dictated by physician', status: 'pending' },
                  { item: 'Emergency contact / crisis plan reviewed', status: 'complete' },
                  { item: 'Follow-up appointment reminder sent to patient', status: 'pending' },
                ].map(({ item, status }) => (
                  <div key={item} className={`flex items-start gap-2.5 p-3 rounded-lg ${
                    status === 'complete'     ? 'bg-green-50 border border-green-100' :
                    status === 'in-progress'  ? 'bg-amber-50 border border-amber-100' :
                    status === 'n-a'          ? 'bg-gray-50 border border-border' :
                                               'bg-red-50 border border-red-100'
                  }`}>
                    <span className={`text-lg leading-none mt-0.5 ${
                      status === 'complete' ? 'text-success' :
                      status === 'in-progress' ? 'text-sunrise-amber' :
                      status === 'n-a' ? 'text-slate' :
                      'text-critical'
                    }`}>
                      {status === 'complete' ? '✓' : status === 'in-progress' ? '◑' : status === 'n-a' ? '—' : '○'}
                    </span>
                    <div className="flex-1">
                      <span className={`text-xs font-medium ${status === 'complete' ? 'text-green-800' : status === 'in-progress' ? 'text-amber-800' : status === 'n-a' ? 'text-slate' : 'text-red-800'}`}>{item}</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded flex-none ${
                      status === 'complete'    ? 'bg-green-200 text-green-800' :
                      status === 'in-progress' ? 'bg-amber-200 text-amber-800' :
                      status === 'n-a'         ? 'bg-gray-200 text-gray-600' :
                                                 'bg-red-200 text-red-800'
                    }`}>{status === 'n-a' ? 'N/A' : status === 'in-progress' ? 'In Progress' : status === 'complete' ? 'Done' : 'Pending'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Aftercare Plan */}
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white border border-border rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-navy mb-4">Aftercare &amp; Continuum of Care</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Step-Down Level of Care', value: 'Partial Hospitalization (PHP)', icon: '🏥' },
                    { label: 'Outpatient Counselor', value: 'To be assigned at PHP intake', icon: '🧑‍⚕️' },
                    { label: 'Prescriber (MAT)', value: patient.flags.some(f => f.type === 'Medication' && (f.note.includes('Suboxone') || f.note.includes('Naltrexone') || f.note.includes('Vivitrol'))) ? 'Dr. Richard Patel, MD — Sunrise Outpatient' : 'N/A (no MAT)', icon: '💊' },
                    { label: 'Housing', value: 'Returning to family home (verified sober environment)', icon: '🏠' },
                    { label: 'Employment / School', value: 'Medical leave active — RTW plan w/ EAP', icon: '💼' },
                    { label: 'AA/NA Sponsor', value: patient.recoveryScore > 60 ? 'James (AA) — confirmed, local home group identified' : 'Referral pending', icon: '🤝' },
                    { label: '72h Follow-Up Call', value: 'Scheduled — Sunrise Aftercare Line', icon: '📞' },
                    { label: '30-Day Check-In', value: 'Automated via Sunrise Connect portal', icon: '📱' },
                  ].map(row => (
                    <div key={row.label} className="flex gap-3 items-start border-b border-border pb-2.5 last:border-0 last:pb-0">
                      <span className="text-base mt-0.5">{row.icon}</span>
                      <div>
                        <div className="text-[10px] font-bold text-slate uppercase tracking-wide">{row.label}</div>
                        <div className="text-navy font-medium mt-0.5">{row.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {/* Crisis Plan */}
                <div className="bg-white border border-border rounded-xl shadow-sm p-5">
                  <h3 className="font-bold text-navy mb-3">Crisis &amp; Relapse Prevention Plan</h3>
                  <div className="space-y-2 text-sm">
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                      <div className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">Warning Signs</div>
                      <p className="text-red-900 text-xs">Isolation, skipping meetings, contact with using friends, sleep disruption, irritability</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                      <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">Coping Strategies</div>
                      <p className="text-amber-900 text-xs">Call sponsor first, attend extra AA meeting, 10-min mindfulness, call crisis line if urges escalate</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Emergency Contacts</div>
                      <p className="text-blue-900 text-xs">SAMHSA Helpline: 1-800-662-4357 · Sunrise Aftercare: (555) 290-7800 · Sponsor: Saved in phone</p>
                    </div>
                  </div>
                </div>

                {/* Legal/Court Obligations */}
                {patient.flags.some(f => f.type === 'Legal') && (
                  <div className="bg-white border border-border rounded-xl shadow-sm p-5">
                    <h3 className="font-bold text-navy mb-3">Legal &amp; Court Obligations</h3>
                    <div className="text-sm text-slate space-y-1.5">
                      <div><span className="font-medium text-navy">Court Hearing:</span> Pretrial — Next date TBD</div>
                      <div><span className="font-medium text-navy">Probation Officer:</span> Completion letter required</div>
                      <div><span className="font-medium text-navy">Completion Letter:</span> <span className="text-sunrise-amber font-medium">Pending physician sign-off</span></div>
                      <div><span className="font-medium text-navy">Drug Testing:</span> Continued random UA per PO terms</div>
                    </div>
                  </div>
                )}

                {/* Discharge summary progress */}
                <div className="bg-white border border-border rounded-xl shadow-sm p-5">
                  <h3 className="font-bold text-navy mb-3">Discharge Summary Progress</h3>
                  <div className="space-y-2">
                    {[
                      { section: 'Clinical Summary', pct: 85 },
                      { section: 'Medication Reconciliation', pct: 100 },
                      { section: 'Aftercare Recommendations', pct: 70 },
                      { section: 'Legal/Compliance Section', pct: 40 },
                      { section: 'Physician Attestation', pct: 0 },
                    ].map(s => (
                      <div key={s.section}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-navy">{s.section}</span>
                          <span className={`text-[10px] font-bold ${s.pct === 100 ? 'text-success' : s.pct > 50 ? 'text-sunrise-amber' : 'text-critical'}`}>{s.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full">
                          <div className={`h-full rounded-full ${s.pct === 100 ? 'bg-success' : s.pct > 50 ? 'bg-sunrise-amber' : 'bg-critical'}`} style={{ width: `${s.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {activeTab === 'Documents' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2"><FolderOpen className="w-5 h-5 text-sunrise-blue" /> Document Vault</h2>
              <div className="flex gap-2">
                <LockedButton locked={readOnly} onClick={() => saveChartAction('Document uploaded')} className="px-3 py-1.5 border border-border rounded text-sm font-medium text-slate hover:bg-slate-50 flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Upload</LockedButton>
              </div>
            </div>

            {[
              { category: 'Consents & Agreements', docs: [
                { name: 'Consent to Treatment', type: 'Consent', date: patient.admitDate, by: 'Amanda Lewis', status: 'Signed', icon: '📋' },
                { name: '42 CFR Part 2 Confidentiality Disclosure', type: 'Consent', date: patient.admitDate, by: 'Amanda Lewis', status: 'Signed', icon: '🔒' },
                { name: 'Financial Responsibility Agreement', type: 'Financial', date: patient.admitDate, by: 'Amanda Lewis', status: 'Signed', icon: '💳' },
                { name: 'Grievance Procedure Acknowledgment', type: 'Consent', date: patient.admitDate, by: 'Amanda Lewis', status: 'Signed', icon: '📋' },
              ]},
              { category: 'Insurance & Authorization', docs: [
                { name: `${patient.insurance} Prior Authorization`, type: 'Insurance', date: patient.admitDate, by: 'Linda Vance', status: 'Active', icon: '🏥' },
                { name: 'Insurance Card (copy)', type: 'ID', date: patient.admitDate, by: 'Amanda Lewis', status: 'On File', icon: '🪪' },
                { name: 'UR Communication — Level of Care', type: 'Insurance', date: patient.admitDate, by: 'Linda Vance', status: 'Active', icon: '📄' },
              ]},
              { category: 'Identification', docs: [
                { name: 'Government-Issued Photo ID', type: 'ID', date: patient.admitDate, by: 'Amanda Lewis', status: 'On File', icon: '🪪' },
                { name: 'Social Security Card', type: 'ID', date: patient.admitDate, by: 'Amanda Lewis', status: 'On File', icon: '🪪' },
              ]},
              { category: 'Clinical Records', docs: [
                { name: 'Referral / Transfer Summary', type: 'Clinical', date: patient.admitDate, by: 'Dr. Robert Chen', status: 'On File', icon: '📄' },
                { name: 'Medication Reconciliation', type: 'Clinical', date: patient.admitDate, by: 'Jessica Torres, RN', status: 'Signed', icon: '💊' },
                { name: 'Admission Physical Exam', type: 'Clinical', date: patient.admitDate, by: 'Dr. Robert Chen', status: 'Signed', icon: '🩺' },
              ]},
            ].map(section => (
              <div key={section.category}>
                <h3 className="font-bold text-slate text-xs uppercase tracking-wider mb-3">{section.category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.docs.map((doc, i) => (
                    <div key={i} className="border border-border rounded-lg p-4 flex items-start gap-3 hover:bg-bg transition-colors group">
                      <span className="text-2xl">{doc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-navy text-sm group-hover:text-sunrise-blue transition-colors truncate">{doc.name}</div>
                        <div className="text-xs text-slate mt-0.5">{doc.date} · {doc.by}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${doc.status === 'Signed' || doc.status === 'Active' ? 'bg-success/20 text-success' : 'bg-slate-100 text-slate'}`}>{doc.status}</span>
                        <button className="text-xs text-slate hover:text-sunrise-blue flex items-center gap-1"><Download className="w-3 h-3" /> View</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Consents ────────────────────────────────────────────────────────── */}
        {activeTab === 'Consents' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Consents &amp; Authorizations</h2>
                <p className="text-slate text-sm">Signed disclosures, release of information, and treatment consents on file</p>
              </div>
              <LockedButton locked={readOnly} onClick={() => saveChartAction('Consent request sent to patient')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Consent
              </LockedButton>
            </div>
            {[
              { name: 'Consent to Treatment', signed: patient.admitDate, by: 'Amanda Lewis', status: 'Signed', expires: 'N/A', type: '42 CFR / Standard', notes: 'Initial admission consent covering all therapeutic services, group participation, and medication management.' },
              { name: '42 CFR Part 2 — Confidentiality Disclosure', signed: patient.admitDate, by: 'Amanda Lewis', status: 'Signed', expires: 'N/A', type: '42 CFR', notes: 'Federal SUD confidentiality disclosure — signed prior to any information sharing with third parties.' },
              { name: 'Release of Information — Primary Physician', signed: patient.admitDate, by: 'Amanda Lewis', status: 'Active', expires: '2026-12-31', type: 'ROI', notes: `Authorized release to ${patient.physician} for coordination of care and medication reconciliation.` },
              { name: 'Release of Information — Family Member', signed: patient.admitDate, by: 'Amanda Lewis', status: 'Active', expires: '2026-12-31', type: 'ROI', notes: 'Limited release to designated family member for discharge planning updates only.' },
              { name: 'Grievance Procedure Acknowledgment', signed: patient.admitDate, by: 'Amanda Lewis', status: 'Signed', expires: 'N/A', type: 'Admin', notes: 'Patient acknowledges receipt of grievance process and rights information per COMAR 10.47.03.' },
              { name: 'Photography / Social Media Opt-Out', signed: patient.admitDate, by: 'Amanda Lewis', status: 'Signed', expires: 'N/A', type: 'Admin', notes: 'Patient opted out of any photography or testimonial use during their episode of care.' },
            ].map((c, i) => (
              <div key={i} className="border border-border rounded-xl p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-navy text-sm">{c.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.status === 'Signed' || c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{c.type}</span>
                  </div>
                  <div className="text-xs text-slate mt-1">{c.notes}</div>
                  <div className="flex gap-4 mt-1.5 text-[10px] text-slate">
                    <span>Signed: <strong className="text-navy">{c.signed}</strong></span>
                    <span>By: <strong className="text-navy">{c.by}</strong></span>
                    {c.expires !== 'N/A' && <span>Expires: <strong className="text-navy">{c.expires}</strong></span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => saveChartAction('Document viewed')} className="text-xs text-slate hover:text-sunrise-blue flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> View</button>
                  <button onClick={() => saveChartAction('Document downloaded')} className="text-xs text-slate hover:text-sunrise-blue flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Print</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Contacts ────────────────────────────────────────────────────────── */}
        {activeTab === 'Contacts' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Emergency Contacts &amp; Designated Persons</h2>
                <p className="text-slate text-sm">Family members, legal representatives, and persons authorized for communication</p>
              </div>
              <LockedButton locked={readOnly} onClick={() => saveChartAction('Contact form opened')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Contact
              </LockedButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Patricia Webb', relation: 'Spouse', phone: '(301) 555-2841', email: 'p.webb@email.com', priority: 1, roiOnFile: true, notify: 'Discharge planning, emergencies', address: '4421 River Rd, Bethesda, MD 20816' },
                { name: 'Marcus Webb Jr.', relation: 'Adult Child', phone: '(240) 555-9134', email: 'mwebb.jr@email.com', priority: 2, roiOnFile: false, notify: 'Emergency only (no ROI on file)', address: 'Same household' },
                { name: 'Dr. Linda Osei', relation: 'PCP / Physician', phone: '(301) 555-0092', email: 'osei@capitolmedmd.com', priority: 3, roiOnFile: true, notify: 'Medication, discharge, care coordination', address: 'Capitol Primary Care, Rockville, MD' },
              ].map((c, i) => (
                <div key={i} className={`border rounded-xl p-4 ${c.priority === 1 ? 'border-sunrise-blue/30 bg-blue-50/20' : 'border-border'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-navy flex items-center gap-2">
                        {c.name}
                        {c.priority === 1 && <span className="text-[10px] bg-orange text-white px-1.5 py-0.5 rounded font-bold">Primary</span>}
                        {c.roiOnFile && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">ROI ✓</span>}
                        {!c.roiOnFile && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">No ROI</span>}
                      </div>
                      <div className="text-xs text-slate mt-0.5">{c.relation}</div>
                    </div>
                    {!readOnly && <button onClick={() => saveChartAction('Contact updated')} className="text-xs text-slate hover:text-navy px-2 py-1 border border-border rounded hover:bg-gray-50">Edit</button>}
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-slate">
                    <div>📞 <span className="text-navy font-medium">{c.phone}</span></div>
                    <div>✉ <span className="text-navy">{c.email}</span></div>
                    <div>📍 <span className="text-navy">{c.address}</span></div>
                    <div className="mt-2 text-[10px] bg-slate-50 border border-border rounded px-2 py-1 text-slate">
                      <span className="font-semibold">Notify for:</span> {c.notify}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Allergies ───────────────────────────────────────────────────────── */}
        {activeTab === 'Allergies' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Allergy &amp; Adverse Reaction Record</h2>
                <p className="text-slate text-sm">Medication, food, and environmental allergens — verified at admission</p>
              </div>
              <LockedButton locked={readOnly} onClick={() => saveChartAction('New allergy added')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Allergy
              </LockedButton>
            </div>
            <div className="overflow-hidden border border-border rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-border">
                    {['Allergen', 'Type', 'Reaction', 'Severity', 'Onset', 'Verified By', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { allergen: 'Penicillin', type: 'Medication', reaction: 'Hives, throat tightening', severity: 'Severe', onset: '2009 (approx)', verifiedBy: 'Jessica Torres, RN', status: 'Active', sColor: 'bg-red-100 text-red-700' },
                    { allergen: 'Sulfonamides', type: 'Medication', reaction: 'Rash, fever', severity: 'Moderate', onset: '2017', verifiedBy: 'Dr. Robert Chen', status: 'Active', sColor: 'bg-amber-100 text-amber-700' },
                    { allergen: 'Shellfish', type: 'Food', reaction: 'GI distress, hives', severity: 'Moderate', onset: 'Childhood', verifiedBy: 'Jessica Torres, RN', status: 'Active', sColor: 'bg-amber-100 text-amber-700' },
                    { allergen: 'Latex', type: 'Environmental', reaction: 'Contact dermatitis', severity: 'Mild', onset: '2015', verifiedBy: 'Jessica Torres, RN', status: 'Active', sColor: 'bg-blue-100 text-blue-700' },
                    { allergen: 'Codeine', type: 'Medication', reaction: 'Nausea, excessive sedation', severity: 'Mild', onset: '2021', verifiedBy: 'Dr. Robert Chen', status: 'Inactive — resolved?', sColor: 'bg-slate-100 text-slate' },
                  ].map((a, i) => (
                    <tr key={i} className={`hover:bg-gray-50 ${a.severity === 'Severe' ? 'bg-red-50/20' : ''}`}>
                      <td className="px-4 py-3 font-semibold text-navy">{a.allergen}</td>
                      <td className="px-4 py-3"><span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{a.type}</span></td>
                      <td className="px-4 py-3 text-slate">{a.reaction}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${a.sColor}`}>{a.severity}</span></td>
                      <td className="px-4 py-3 text-slate">{a.onset}</td>
                      <td className="px-4 py-3 text-slate text-xs">{a.verifiedBy}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${a.status === 'Active' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate'}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-none mt-0.5" />
              <div className="text-xs text-red-800">
                <span className="font-bold">ALLERGY ALERT:</span> Penicillin (Severe) — do not administer any beta-lactam antibiotics without physician override and allergy consultation.
              </div>
            </div>
          </div>
        )}

        {/* ── Drug Testing ─────────────────────────────────────────────────────── */}
        {activeTab === 'Drug Testing' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Drug Testing — UA &amp; Toxicology History</h2>
                <p className="text-slate text-sm">Urinalysis results per shift protocol and random schedule</p>
              </div>
              <LockedButton locked={readOnly} onClick={() => saveChartAction('UA order placed')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Order UA
              </LockedButton>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total UAs This Episode', value: 7, sub: 'Since admit', color: 'text-navy' },
                { label: 'Negative', value: 6, sub: 'Clean results', color: 'text-green-600' },
                { label: 'Positive', value: 1, sub: 'Documented', color: 'text-red-600' },
                { label: 'Refused', value: 0, sub: 'This episode', color: 'text-slate' },
              ].map(k => (
                <div key={k.label} className="card">
                  <div className="text-[10px] font-bold text-slate uppercase tracking-wide">{k.label}</div>
                  <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                  <div className="text-xs text-slate mt-0.5">{k.sub}</div>
                </div>
              ))}
            </div>
            <div className="overflow-hidden border border-border rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-border">
                    {['Date', 'Time', 'Type', 'Panel', 'Substances Tested', 'Result', 'Ordered By', 'Collected By', 'Notes'].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { date: patient.admitDate, time: '09:14', type: 'Admission', panel: '12-Panel', substances: 'Opioids, Alcohol, Benzo, Meth, Cocaine, THC, Barb, Amp, MDMA, PCP, Fent, K2', result: 'Positive — EtOH, THC', rColor: 'bg-red-100 text-red-700', ordered: 'Dr. Robert Chen', collected: 'Jessica Torres, RN', notes: 'Point-of-care + send-out confirmation ordered' },
                    { date: '2026-07-12', time: '07:30', type: 'Random', panel: '12-Panel', substances: 'Same 12-panel', result: 'Negative', rColor: 'bg-green-100 text-green-700', ordered: 'Jessica Torres, RN', collected: 'BHT C. Watts', notes: '' },
                    { date: '2026-07-15', time: '07:00', type: 'Random', panel: '12-Panel', substances: 'Same 12-panel', result: 'Negative', rColor: 'bg-green-100 text-green-700', ordered: 'Jessica Torres, RN', collected: 'BHT C. Watts', notes: '' },
                    { date: '2026-07-17', time: '13:45', type: 'Cause', panel: '12-Panel', substances: 'Same 12-panel', result: 'Negative', rColor: 'bg-green-100 text-green-700', ordered: patient.counselor, collected: 'Jessica Torres, RN', notes: 'Ordered after behavioral change noted in group' },
                    { date: '2026-07-19', time: '07:15', type: 'Random', panel: '12-Panel', substances: 'Same 12-panel', result: 'Negative', rColor: 'bg-green-100 text-green-700', ordered: 'Jessica Torres, RN', collected: 'BHT C. Watts', notes: '' },
                    { date: '2026-07-22', time: '07:00', type: 'Scheduled', panel: '12-Panel', substances: 'Same 12-panel', result: 'Negative', rColor: 'bg-green-100 text-green-700', ordered: 'Dr. Robert Chen', collected: 'Jessica Torres, RN', notes: 'Weekly lab draw — add CBC, CMP sent same time' },
                    { date: '2026-07-26', time: '07:10', type: 'Random', panel: '12-Panel', substances: 'Same 12-panel', result: 'Negative', rColor: 'bg-green-100 text-green-700', ordered: 'Jessica Torres, RN', collected: 'BHT C. Watts', notes: '' },
                  ].map((r, i) => (
                    <tr key={i} className={`hover:bg-gray-50 ${r.result.startsWith('Positive') ? 'bg-red-50/30' : ''}`}>
                      <td className="px-3 py-2.5 font-medium text-navy text-xs">{r.date}</td>
                      <td className="px-3 py-2.5 text-slate text-xs font-mono">{r.time}</td>
                      <td className="px-3 py-2.5"><span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">{r.type}</span></td>
                      <td className="px-3 py-2.5 text-slate text-xs">{r.panel}</td>
                      <td className="px-3 py-2.5 text-slate text-[10px] max-w-[160px] truncate">{r.substances}</td>
                      <td className="px-3 py-2.5"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.rColor}`}>{r.result}</span></td>
                      <td className="px-3 py-2.5 text-slate text-xs">{r.ordered}</td>
                      <td className="px-3 py-2.5 text-slate text-xs">{r.collected}</td>
                      <td className="px-3 py-2.5 text-slate text-[10px] italic">{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Incidents ───────────────────────────────────────────────────────── */}
        {activeTab === 'Incidents' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Incident Reports</h2>
                <p className="text-slate text-sm">Safety events, behavioral incidents, and near-misses involving this patient</p>
              </div>
              <LockedButton locked={readOnly} onClick={() => saveChartAction('Incident report form opened')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                <Plus className="w-4 h-4" /> File Incident
              </LockedButton>
            </div>
            {patient.flags.some(f => f.type === 'AMA') || patient.amaRisk === 'High' ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 flex-none" />
                <span>This patient is flagged as <strong>High AMA Risk</strong> — document any elopement attempts or behavioral escalations immediately.</span>
              </div>
            ) : null}
            <div className="space-y-3">
              {[
                { date: '2026-07-16', time: '11:45 PM', type: 'Behavioral', subtype: 'Verbal Altercation', severity: 'Moderate', status: 'Closed — Reviewed', statusColor: 'bg-slate-100 text-slate', reportedBy: 'BHT Carlos Watts', summary: 'Patient had a verbal altercation with a roommate regarding noise levels. BHT de-escalated. No physical contact. Counselor notified by phone. 1:1 session scheduled for morning. Safety plan reviewed with patient.', followUp: 'Behavioral plan updated. Room reassignment evaluated and declined by patient.' },
                { date: '2026-07-20', time: '06:20 AM', type: 'Safety', subtype: 'Near-Fall', severity: 'Minor', status: 'Closed — No Injury', statusColor: 'bg-green-100 text-green-700', reportedBy: 'Jessica Torres, RN', summary: "Patient slipped exiting shower — caught themselves on grab bar. No fall, no injury. Reported to nurse during morning vitals. Facilities notified for bathroom floor inspection.", followUp: 'Facilities applied non-slip adhesive strips to bathroom floor 2026-07-20.' },
              ].map((inc, i) => (
                <div key={i} className="border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy text-sm">{inc.type} — {inc.subtype}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${inc.severity === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{inc.severity}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${inc.statusColor}`}>{inc.status}</span>
                    </div>
                    <div className="text-xs text-slate">{inc.date} · {inc.time}</div>
                  </div>
                  <p className="text-sm text-slate leading-relaxed">{inc.summary}</p>
                  <div className="text-xs text-slate border-t border-border pt-2">
                    <span className="font-semibold">Reported by:</span> {inc.reportedBy} &nbsp;|&nbsp; <span className="font-semibold">Follow-up:</span> {inc.followUp}
                  </div>
                </div>
              ))}
              <div className="text-center py-6 border border-dashed border-border rounded-xl text-slate text-sm">
                No additional incidents on file for this episode of care.
              </div>
            </div>
          </div>
        )}

        {/* ── Case Management ──────────────────────────────────────────────────── */}
        {activeTab === 'Case Management' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Case Management</h2>
                <p className="text-slate text-sm">Care coordination, referrals, housing, and community linkage notes</p>
              </div>
              <LockedButton locked={readOnly} onClick={() => saveChartAction('Case management note added')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Note
              </LockedButton>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Case Manager', value: 'David Odom, LCADC', sub: 'Primary CM assigned' },
                { label: 'Housing Status', value: 'Stable — Family home', sub: 'Discharge destination confirmed' },
                { label: 'Insurance Navigator', value: 'Linda Vance', sub: 'Benefits / auth liaison' },
              ].map(k => (
                <div key={k.label} className="card">
                  <div className="text-[10px] font-bold text-slate uppercase tracking-wide">{k.label}</div>
                  <div className="font-semibold text-navy mt-1 text-sm">{k.value}</div>
                  <div className="text-xs text-slate mt-0.5">{k.sub}</div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { date: '2026-07-27', by: 'David Odom, LCADC', type: 'Discharge Planning', note: "Met with patient to review discharge plan and housing arrangement. Patient confirmed family home is stable and supportive. Spouse has attended one family session and is committed to participation in family program post-discharge. Referred to Oxford House registry as backup — patient declined but will keep contact info.", actions: ['Discharge checklist updated', 'ROI signed for family session notes', 'PHP schedule emailed to patient'] },
                { date: '2026-07-24', by: 'David Odom, LCADC', type: 'Community Linkage', note: "Contacted Bright Harbor Counseling for individual therapy post-discharge. Appointment scheduled for 8/5 at 3 PM with Dr. Jennifer Choi, LPC. Verified they accept CareFirst PPO. Patient expressed enthusiasm — reports Dr. Choi was recommended by a peer in recovery group.", actions: ['Appointment confirmed', 'ROI faxed to Bright Harbor', 'Auth request initiated for OP sessions'] },
                { date: '2026-07-21', by: 'Linda Vance', type: 'Insurance / Benefits', note: 'Spoke with CareFirst Behavioral Health UM — concurrent review approved through 8/2/2026. Next review call scheduled for 8/1. Estimated co-pay for PHP step-down: $35/day. Patient notified and provided financial counseling worksheet.', actions: ['Auth extended through 8/2', 'PHP pre-auth initiated', 'Financial worksheet provided'] },
                { date: '2026-07-18', by: 'David Odom, LCADC', type: 'Initial Assessment', note: "Initial CM assessment completed. Housing confirmed stable. Employment: patient is on FMLA leave from employer (Federal contractor — eligible for EAP counseling post-discharge). No active legal involvement. SSI/SSDI not applicable. No pending CPS or DCF cases.", actions: ['CM assessment filed in chart', 'EAP contact info provided', 'Employment coordinator contact logged'] },
              ].map((entry, i) => (
                <div key={i} className="border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-navy">{entry.date}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">{entry.type}</span>
                    </div>
                    <span className="text-xs text-slate">{entry.by}</span>
                  </div>
                  <p className="text-sm text-navy leading-relaxed">{entry.note}</p>
                  {entry.actions.length > 0 && (
                    <div className="mt-3 border-t border-border pt-2">
                      <div className="text-[10px] font-bold text-slate uppercase tracking-wide mb-1">Actions Taken</div>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.actions.map(a => (
                          <span key={a} className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy mb-3">Community Referrals &amp; Linkages</h3>
              <div className="overflow-hidden border border-border rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-border">
                      {['Organization', 'Service Type', 'Contact', 'Referral Date', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { org: 'Bright Harbor Counseling', service: 'Individual Therapy', contact: 'Dr. Jennifer Choi, LPC', date: '2026-07-24', status: 'Confirmed', sColor: 'bg-green-100 text-green-700' },
                      { org: 'AA — Bethesda Group', service: 'Peer Support / 12-Step', contact: 'Open meeting', date: '2026-07-22', status: 'Patient Accepted', sColor: 'bg-green-100 text-green-700' },
                      { org: 'Sunrise PHP (Internal)', service: 'Step-Down PHP', contact: 'Amanda Lewis', date: '2026-07-27', status: 'Auth Pending', sColor: 'bg-amber-100 text-amber-700' },
                      { org: 'MAT Clinic — Shady Grove', service: 'Medication-Assisted Treatment', contact: '(301) 555-4400', date: '2026-07-26', status: 'Referral Sent', sColor: 'bg-blue-100 text-blue-700' },
                    ].map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-navy">{r.org}</td>
                        <td className="px-4 py-2.5 text-slate">{r.service}</td>
                        <td className="px-4 py-2.5 text-slate">{r.contact}</td>
                        <td className="px-4 py-2.5 text-slate">{r.date}</td>
                        <td className="px-4 py-2.5"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.sColor}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Audit History ────────────────────────────────────────────────────── */}
        {activeTab === 'Audit History' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-navy">Chart Audit History</h2>
              <p className="text-slate text-sm">Read-only log of all chart access, edits, and clinical actions for this patient — HIPAA compliance record</p>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Access Events', value: 48, sub: 'This episode', color: 'text-navy' },
                { label: 'Unique Staff', value: 9, sub: 'Who accessed chart', color: 'text-blue-600' },
                { label: 'Edit Events', value: 23, sub: 'Notes, meds, vitals', color: 'text-teal-600' },
                { label: 'Export / Print', value: 3, sub: 'Document actions', color: 'text-amber-600' },
              ].map(k => (
                <div key={k.label} className="card">
                  <div className="text-[10px] font-bold text-slate uppercase tracking-wide">{k.label}</div>
                  <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                  <div className="text-xs text-slate mt-0.5">{k.sub}</div>
                </div>
              ))}
            </div>
            <div className="overflow-hidden border border-border rounded-xl">
              <div className="px-4 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-navy">Recent Audit Log</span>
                <button onClick={() => saveChartAction('Audit log exported')} className="text-xs text-slate hover:text-navy flex items-center gap-1.5 border border-border rounded px-2 py-1">
                  <Download className="w-3 h-3" /> Export Log
                </button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-gray-50/50">
                    {['Timestamp', 'Staff Member', 'Role', 'Action', 'Section', 'IP / Device', 'Notes'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { ts: '2026-07-28 08:14', staff: 'Sarah Jenkins', role: 'Counselor', action: 'Viewed', section: 'Progress Notes', ip: 'iPad · 192.168.1.12', notes: '' },
                    { ts: '2026-07-28 08:16', staff: 'Sarah Jenkins', role: 'Counselor', action: 'Added Note', section: 'Progress Notes', ip: 'iPad · 192.168.1.12', notes: 'BIRP note — session 07/28' },
                    { ts: '2026-07-28 07:02', staff: 'Jessica Torres', role: 'Nurse', action: 'Recorded Vitals', section: 'Vitals', ip: 'Workstation · 192.168.1.5', notes: 'Morning vitals — BP, HR, Temp, O2' },
                    { ts: '2026-07-28 07:05', staff: 'Jessica Torres', role: 'Nurse', action: 'MAR Updated', section: 'Medications', ip: 'Workstation · 192.168.1.5', notes: 'Morning medication administration documented' },
                    { ts: '2026-07-27 16:48', staff: 'David Odom', role: 'Case Manager', action: 'Added Note', section: 'Case Management', ip: 'Desktop · 192.168.1.8', notes: 'Discharge planning CM note' },
                    { ts: '2026-07-27 14:22', staff: 'Dr. Robert Chen', role: 'Physician', action: 'Viewed', section: 'Labs', ip: 'Mobile · 192.168.1.20', notes: '' },
                    { ts: '2026-07-27 14:25', staff: 'Dr. Robert Chen', role: 'Physician', action: 'Ordered Labs', section: 'Labs', ip: 'Mobile · 192.168.1.20', notes: 'CMP, CBC, LFT ordered' },
                    { ts: '2026-07-26 09:55', staff: 'Amanda Lewis', role: 'Admissions', action: 'Viewed', section: 'Documents', ip: 'Desktop · 192.168.1.3', notes: '' },
                    { ts: '2026-07-26 09:57', staff: 'Amanda Lewis', role: 'Admissions', action: 'Uploaded Document', section: 'Documents', ip: 'Desktop · 192.168.1.3', notes: 'Insurance auth letter uploaded' },
                    { ts: '2026-07-25 18:30', staff: 'BHT C. Watts', role: 'BHT', action: 'Viewed', section: 'Overview', ip: 'iPad · 192.168.1.14', notes: 'Evening handoff review' },
                    { ts: '2026-07-24 11:10', staff: 'Linda Vance', role: 'UR Coordinator', action: 'Exported', section: 'Documents', ip: 'Desktop · 192.168.1.6', notes: 'UR documentation package exported for payer' },
                    { ts: '2026-07-23 10:02', staff: 'Sarah Jenkins', role: 'Counselor', action: 'Co-Signed Note', section: 'Progress Notes', ip: 'Desktop · 192.168.1.2', notes: 'Intern note co-signature' },
                  ].map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-mono text-[10px] text-slate whitespace-nowrap">{r.ts}</td>
                      <td className="px-3 py-2.5 font-medium text-navy">{r.staff}</td>
                      <td className="px-3 py-2.5 text-slate">{r.role}</td>
                      <td className="px-3 py-2.5"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${r.action === 'Exported' ? 'bg-amber-100 text-amber-700' : r.action.includes('Added') || r.action.includes('Recorded') || r.action.includes('Updated') || r.action.includes('Uploaded') || r.action.includes('Ordered') || r.action.includes('Co-Signed') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate'}`}>{r.action}</span></td>
                      <td className="px-3 py-2.5 text-slate">{r.section}</td>
                      <td className="px-3 py-2.5 text-[10px] font-mono text-slate-400">{r.ip}</td>
                      <td className="px-3 py-2.5 text-slate italic text-[10px]">{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── APPOINTMENTS ─────────────────────────────────────────────────── */}
        {activeTab === 'Appointments' && (
          <div className="flex h-full gap-6">
            {/* List panel */}
            <div className={`flex-col h-full ${isCreatingAppointment ? 'w-1/3' : 'w-full'}`}>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-navy">Appointments</h2>
                {!isCreatingAppointment && (
                  <LockedButton
                    locked={readOnly || !(productionSession?.permissionCodes ?? []).includes('appointment.create')}
                    data-testid="new-appointment-btn"
                    onClick={() => { setIsCreatingAppointment(true); setAptApiError(null); setAptReason(''); setAptInternalNote(''); setAptStartsAt(''); setAptEndsAt(''); }}
                    className="bg-sunrise-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-sunrise-blue-light transition-colors"
                  >
                    + New Appointment
                  </LockedButton>
                )}
              </div>

              {/* Loading / error states */}
              {DATA_MODE === 'production' && appointmentsLoading && (
                <div className="text-sm text-slate-400 py-4 animate-pulse">Loading appointments…</div>
              )}
              {DATA_MODE === 'production' && appointmentsError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">{appointmentsError}</div>
              )}
              {aptApiError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">{aptApiError}</div>
              )}

              {DATA_MODE !== 'production' ? (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No appointments in demo mode</p>
                  <p className="text-xs mt-1">Connect to API to view and manage appointments.</p>
                </div>
              ) : !appointmentsLoading && appointments.upcoming.length === 0 && appointments.past.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No appointments scheduled</p>
                  <p className="text-xs mt-1">Use the button above to schedule this patient's first appointment.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Upcoming */}
                  {appointments.upcoming.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Upcoming</h3>
                      <div className="space-y-2">
                        {appointments.upcoming.map((apt) => (
                          <div key={apt.id} data-testid={`apt-card-${apt.id}`} className="border border-slate-200 rounded-lg px-4 py-3 bg-white hover:bg-blue-50/30 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded capitalize">
                                    {apt.appointmentType.replace('_', ' ')}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {new Date(apt.startsAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    {' '}
                                    {new Date(apt.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                    {' – '}
                                    {new Date(apt.endsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-sm text-navy">{apt.reason}</p>
                                {apt.internalNote && (
                                  <p className="text-xs text-slate-500 mt-1 italic">Note: {apt.internalNote}</p>
                                )}
                              </div>
                              {(productionSession?.permissionCodes ?? []).includes('appointment.cancel') && (
                                <button
                                  data-testid={`cancel-apt-${apt.id}`}
                                  onClick={() => { setCancelModalAptId(apt.id); setCancelModalVersion(apt.version); setCancelReason(''); setCancelError(null); }}
                                  className="ml-3 text-xs text-red-500 hover:text-red-700 font-medium"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past */}
                  {appointments.past.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Past</h3>
                      <div className="space-y-2">
                        {appointments.past.map((apt) => (
                          <div key={apt.id} data-testid={`apt-card-past-${apt.id}`} className="border border-slate-100 rounded-lg px-4 py-3 bg-slate-50">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${apt.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                {apt.status === 'cancelled' ? 'Cancelled' : apt.appointmentType.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(apt.startsAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">{apt.reason}</p>
                            {apt.cancellationReason && (
                              <p className="text-xs text-red-500 mt-1">Cancelled: {apt.cancellationReason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* New Appointment form panel */}
            {isCreatingAppointment && (
              <div className="flex-1 border-l border-slate-200 pl-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-navy">New Appointment</h3>
                  <button onClick={() => { setIsCreatingAppointment(false); setAptApiError(null); }} className="text-slate-400 hover:text-slate-600 text-sm">
                    ✕ Close
                  </button>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Appointment Type</label>
                    <select
                      value={aptType}
                      onChange={e => setAptType(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sunrise-blue"
                    >
                      <option value="individual_therapy">Individual Therapy</option>
                      <option value="medication_management">Medication Management</option>
                      <option value="intake">Intake</option>
                      <option value="follow_up">Follow-Up</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Start Date & Time</label>
                      <input
                        type="datetime-local"
                        value={aptStartsAt}
                        onChange={e => setAptStartsAt(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sunrise-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">End Date & Time</label>
                      <input
                        type="datetime-local"
                        value={aptEndsAt}
                        onChange={e => setAptEndsAt(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sunrise-blue"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Reason <span className="text-red-500">*</span></label>
                    <textarea
                      value={aptReason}
                      onChange={e => setAptReason(e.target.value)}
                      rows={2}
                      placeholder="Clinical reason for this appointment…"
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sunrise-blue resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Internal Note <span className="text-slate-400 text-xs font-normal">(supervisor-visible only)</span></label>
                    <textarea
                      value={aptInternalNote}
                      onChange={e => setAptInternalNote(e.target.value)}
                      rows={2}
                      placeholder="Optional internal note — not shown to all staff…"
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sunrise-blue resize-none"
                    />
                  </div>

                  {aptApiError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{aptApiError}</div>
                  )}

                  <div className="flex gap-3">
                    <button
                      data-testid="submit-appointment-btn"
                      disabled={aptSaving || !aptReason.trim() || !aptStartsAt || !aptEndsAt}
                      onClick={async () => {
                        if (!aptReason.trim() || !aptStartsAt || !aptEndsAt) return;
                        setAptSaving(true);
                        setAptApiError(null);
                        try {
                          const csrfRes = await fetch(`${API_BASE}/v1/auth/csrf-token`, { headers: DEV_HEADERS });
                          const { csrfToken } = await csrfRes.json() as { csrfToken: string };
                          const startsAtIso = new Date(aptStartsAt).toISOString().replace(/\.\d{3}Z$/, 'Z').replace('Z', '+00:00');
                          const endsAtIso = new Date(aptEndsAt).toISOString().replace(/\.\d{3}Z$/, 'Z').replace('Z', '+00:00');
                          const res = await fetch(`${API_BASE}/v1/patients/${patientId}/appointments`, {
                            method: 'POST',
                            headers: { ...DEV_HEADERS, 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                            body: JSON.stringify({
                              ...(aptFacilityId ? { facilityId: aptFacilityId } : {}),
                              assignedUserId: aptAssignedUserId || productionSession?.userId,
                              appointmentType: aptType,
                              startsAt: startsAtIso,
                              endsAt: endsAtIso,
                              reason: aptReason.trim(),
                              internalNote: aptInternalNote.trim() || null,
                            }),
                          });
                          if (!res.ok) {
                            const err = await res.json() as { error?: string };
                            setAptApiError(err?.error ?? `Server error ${res.status}`);
                          } else {
                            setIsCreatingAppointment(false);
                            setAptReason('');
                            setAptInternalNote('');
                            setAptStartsAt('');
                            setAptEndsAt('');
                            refreshAppointments();
                          }
                        } catch {
                          setAptApiError('Network error — please try again.');
                        } finally {
                          setAptSaving(false);
                        }
                      }}
                      className="bg-sunrise-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-sunrise-blue-light transition-colors disabled:opacity-50"
                    >
                      {aptSaving ? 'Saving…' : 'Save Appointment'}
                    </button>
                    <button
                      onClick={() => { setIsCreatingAppointment(false); setAptApiError(null); }}
                      className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cancel appointment modal */}
        {cancelModalAptId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-navy mb-1">Cancel Appointment</h3>
              <p className="text-sm text-slate mb-4">This action is irreversible. Please provide a cancellation reason.</p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Reason for cancellation…"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-3 resize-none"
              />
              {cancelError && <div className="text-sm text-red-600 mb-3">{cancelError}</div>}
              <div className="flex gap-3">
                <button
                  data-testid="confirm-cancel-btn"
                  disabled={cancelSubmitting || !cancelReason.trim()}
                  onClick={async () => {
                    if (!cancelReason.trim() || !cancelModalAptId) return;
                    setCancelSubmitting(true);
                    setCancelError(null);
                    try {
                      const csrfRes = await fetch(`${API_BASE}/v1/auth/csrf-token`, { headers: DEV_HEADERS });
                      const { csrfToken } = await csrfRes.json() as { csrfToken: string };
                      const res = await fetch(`${API_BASE}/v1/appointments/${cancelModalAptId}/cancel`, {
                        method: 'POST',
                        headers: { ...DEV_HEADERS, 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                        body: JSON.stringify({ version: cancelModalVersion, cancellationReason: cancelReason.trim() }),
                      });
                      if (!res.ok) {
                        const err = await res.json() as { error?: string };
                        setCancelError(err?.error ?? `Server error ${res.status}`);
                      } else {
                        setCancelModalAptId(null);
                        setCancelReason('');
                        refreshAppointments();
                      }
                    } catch {
                      setCancelError('Network error — please try again.');
                    } finally {
                      setCancelSubmitting(false);
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelSubmitting ? 'Cancelling…' : 'Confirm Cancel'}
                </button>
                <button
                  onClick={() => { setCancelModalAptId(null); setCancelError(null); }}
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {chartActionSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <span>✓</span> {chartActionSaved}
        </div>
      )}
    </div>
    </>
  );
}
