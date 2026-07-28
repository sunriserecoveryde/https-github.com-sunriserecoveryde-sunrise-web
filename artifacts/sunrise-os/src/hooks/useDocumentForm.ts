/**
 * useDocumentForm.ts — Shared clinical document form engine
 *
 * Provides autosave (30-second debounce), completion-% tracking,
 * required-field validation, co-sign routing, locked/signed state,
 * addendum support, and version history — all backed by demoStore.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useDemoStore, type PendingDoc } from '../store/demoStore';
import type { SignatureRecord } from '../components/ui/SignatureModal';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type DocFormState = 'draft' | 'pending_cosign' | 'signed';

export interface UseDocumentFormConfig {
  /** Stable identifier for this document instance (e.g. "progress-note-p1-123") */
  docId: string;
  docType: string;
  patientId?: string;
  patientName?: string;
  mrn?: string;
  program?: string;
  /** Display name + credentials of the note author */
  authorName?: string;
  /** Staff ID used for deficiency-flag lookups */
  authorId?: string;
  authorRole?: string;
  /** Name of default supervisor for co-sign routing */
  supervisor?: string;
  /** Whether this doc type needs co-sign before final lock */
  requiresCoSign?: boolean;
  /** Field keys that must be non-empty to submit */
  requiredFields: string[];
  /**
   * Current field values — consumer manages this state;
   * the hook reads it to compute completion % and to snapshot on save.
   */
  fieldValues: Record<string, string>;
  /**
   * Total number of fields (for completion %).
   * Defaults to requiredFields.length if omitted.
   */
  totalFields?: number;
  priority?: 'Urgent' | 'Routine';
  format?: string;
}

export function useDocumentForm(config: UseDocumentFormConfig) {
  const {
    docId, docType, patientId = '', patientName = '', mrn = '', program = '',
    authorName = 'Staff', authorId = 'staff', authorRole = '',
    supervisor = 'Clinical Supervisor', requiresCoSign = true,
    requiredFields, fieldValues, totalFields, priority = 'Routine', format,
  } = config;

  const {
    addPendingDoc, addAuditEntry, addDocVersion, getDocVersions,
    correctionEvents,
  } = useDemoStore();

  // ── Always-fresh refs — eliminates stale closures in memoized callbacks ────
  // Updated on every render so callbacks never capture outdated values.
  const fieldValuesRef = useRef(fieldValues);
  fieldValuesRef.current = fieldValues;
  const requiredFieldsRef = useRef(requiredFields);
  requiredFieldsRef.current = requiredFields;
  const authorNameRef = useRef(authorName);
  authorNameRef.current = authorName;
  const docIdRef = useRef(docId);
  docIdRef.current = docId;

  // ── Local state ────────────────────────────────────────────────────────────
  const [formState, setFormState] = useState<DocFormState>('draft');
  const [isDirty, setIsDirty] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showAddendum, setShowAddendum] = useState(false);
  const [addendumText, setAddendumText] = useState('');
  const [activeVersionTab, setActiveVersionTab] = useState<'form' | 'history'>('form');
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDocIdRef = useRef(docId);

  // ── Reset all form state when the document identity changes ───────────────
  // (e.g. user switches patient or session — prevents state leaking across records)
  useEffect(() => {
    if (prevDocIdRef.current === docId) return;
    prevDocIdRef.current = docId;
    setFormState('draft');
    setIsDirty(false);
    setAutosaveStatus('idle');
    setLastSaved(null);
    setValidationErrors([]);
    setShowAddendum(false);
    setAddendumText('');
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
  }, [docId]);

  const isLocked = formState !== 'draft';
  const isSigned = formState === 'signed';

  // ── Completion % ───────────────────────────────────────────────────────────
  const total = totalFields ?? requiredFields.length;
  const filled = requiredFields.filter(f => (fieldValues[f] ?? '').trim().length > 0).length;
  const completionPct = total === 0 ? 100 : Math.round((filled / total) * 100);

  // ── Dirty tracking ─────────────────────────────────────────────────────────
  const markDirty = useCallback(() => {
    setIsDirty(prev => {
      // If already locked (isLocked is a derived value from formState — read it directly)
      return prev; // updated below
    });
    // Read formState indirectly via a ref to avoid dep on isLocked
    setFormState(prev => {
      if (prev !== 'draft') return prev; // locked — no-op
      setIsDirty(true);
      setAutosaveStatus('idle');
      return prev;
    });
  }, []);

  // ── Autosave timer (30 seconds after last change) ──────────────────────────
  useEffect(() => {
    if (!isDirty || isLocked) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      doSave(true);
    }, 30_000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, fieldValues, isLocked]);

  // ── Internal save — always uses fresh values via refs ─────────────────────
  function doSave(isAutosave: boolean) {
    setAutosaveStatus('saving');
    const snapshot = JSON.stringify(fieldValuesRef.current);
    addDocVersion({
      docId: docIdRef.current,
      savedAt: new Date().toISOString(),
      savedBy: authorNameRef.current,
      contentSnapshot: snapshot,
      isAutosave,
    });
    setLastSaved(new Date());
    setIsDirty(false);
    setAutosaveStatus('saved');
  }

  // ── Validation — always uses fresh values via refs ─────────────────────────
  function validate(): boolean {
    const errors = requiredFieldsRef.current
      .filter(f => !(fieldValuesRef.current[f] ?? '').trim())
      .map(f => `"${f}" is required`);
    setValidationErrors(errors);
    return errors.length === 0;
  }

  // ── Public actions ─────────────────────────────────────────────────────────

  const handleSaveDraft = useCallback(() => {
    doSave(false);
  // doSave is stable (only uses refs internally)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitForCoSign = useCallback(() => {
    if (!validate()) return false;
    doSave(false);

    // Carry over the correction count from prior return events for this author/type/patient
    // so the supervisor sees accurate resubmission history in the queue.
    const priorCorrections = correctionEvents.filter(
      e => e.authorId === authorId && e.reason, // same author; refine if needed
    ).length;

    const previewField = requiredFieldsRef.current[0];
    const previewText = (fieldValuesRef.current[previewField] ?? '').slice(0, 120);

    const doc: Omit<PendingDoc, 'id' | 'submittedAt'> = {
      patientId, patientName, mrn, program,
      noteDate: new Date().toISOString().slice(0, 10),
      noteType: docType,
      author: authorNameRef.current,
      authorId,
      authorRole,
      supervisor,
      priority,
      preview: previewText || `${docType} submitted for co-sign`,
      format,
      correctionCount: priorCorrections,
    };
    addPendingDoc(doc);
    addAuditEntry({
      staffName: authorNameRef.current,
      action: 'Submitted for Co-sign',
      entity: docType,
      detail: `${patientName || 'Patient'} — ${docType} submitted to ${supervisor}`,
    });
    setFormState('pending_cosign');
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correctionEvents, authorId, patientId, patientName, mrn, program, docType, authorRole, supervisor, priority, format]);

  const handleSign = useCallback((_record: SignatureRecord): boolean => {
    // Enforce the same validation gate as submit-for-co-sign
    if (!validate()) return false;
    doSave(false);
    addAuditEntry({
      staffName: authorNameRef.current,
      action: 'Signed & Submitted',
      entity: docType,
      detail: `${patientName || 'Patient'} — ${docType} signed by ${authorNameRef.current}`,
    });
    setFormState('signed');
    setValidationErrors([]);
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType, patientName]);

  const handleAddAddendum = useCallback(() => {
    if (!addendumText.trim()) return;
    addDocVersion({
      docId: docIdRef.current,
      savedAt: new Date().toISOString(),
      savedBy: authorNameRef.current,
      contentSnapshot: `[ADDENDUM] ${addendumText.trim()}`,
      isAutosave: false,
    });
    addAuditEntry({
      staffName: authorNameRef.current,
      action: 'Added Addendum',
      entity: docType,
      detail: addendumText.slice(0, 120),
    });
    setAddendumText('');
    setShowAddendum(false);
  }, [addendumText, docType, addDocVersion, addAuditEntry]);

  const versions = getDocVersions(docId);

  return {
    // State
    formState,
    isLocked,
    isSigned,
    isDirty,
    completionPct,
    autosaveStatus,
    lastSaved,
    validationErrors,
    // Addendum
    showAddendum,
    setShowAddendum,
    addendumText,
    setAddendumText,
    // Version history
    versions,
    activeVersionTab,
    setActiveVersionTab,
    // Actions
    markDirty,
    handleSaveDraft,
    handleSubmitForCoSign,
    handleSign,
    handleAddAddendum,
    // Helpers
    validate,
  };
}
