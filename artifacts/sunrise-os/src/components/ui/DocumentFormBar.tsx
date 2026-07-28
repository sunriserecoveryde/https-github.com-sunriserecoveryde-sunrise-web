/**
 * DocumentFormBar — Reusable completion/status bar for all clinical form pages.
 *
 * Renders: completion progress bar · autosave status pill · validation errors
 * · locked/signed badge · Save Draft / Submit for Co-sign / Sign & Submit buttons
 * · (when locked) Add Addendum + Version History toggle
 */
import React, { useState } from 'react';
import {
  CheckCircle, Clock, AlertTriangle, Lock, PenTool,
  Save, Send, History, Plus, ChevronDown, ChevronUp,
} from 'lucide-react';
import { LockedButton } from '../common/LockedButton';
import { SignatureModal } from './SignatureModal';
import type { SignatureRecord } from './SignatureModal';
import type { AutosaveStatus, DocFormState } from '../../hooks/useDocumentForm';
import type { DocVersion } from '../../store/demoStore';

interface DocumentFormBarProps {
  formState: DocFormState;
  isLocked: boolean;
  isSigned: boolean;
  isDirty: boolean;
  completionPct: number;
  autosaveStatus: AutosaveStatus;
  lastSaved: Date | null;
  validationErrors: string[];
  requiresCoSign?: boolean;
  // Addendum
  showAddendum: boolean;
  setShowAddendum: (v: boolean) => void;
  addendumText: string;
  setAddendumText: (v: string) => void;
  onAddAddendum: () => void;
  // Version history
  versions: DocVersion[];
  // Actions
  onSaveDraft: () => void;
  onSubmitForCoSign?: () => boolean | void;
  /** Return false to indicate validation failed; truthy/void = success. */
  onSign: (record: SignatureRecord) => boolean | void;
  // Gating
  readOnly?: boolean;
  editRoles?: string[];
  authorName?: string;
  authorRole?: string;
  documentTitle?: string;
  // Layout hint — 'compact' hides labels on the progress bar
  compact?: boolean;
}

function formatRelativeTime(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)  return 'just now';
  if (secs < 120) return '1 min ago';
  const mins = Math.floor(secs / 60);
  if (mins < 60)  return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

const COMPLETION_COLOR = (pct: number) =>
  pct === 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-400';

const COMPLETION_TEXT = (pct: number) =>
  pct === 100 ? 'text-emerald-700' : pct >= 70 ? 'text-blue-700' : pct >= 40 ? 'text-amber-700' : 'text-red-600';

export function DocumentFormBar({
  formState, isLocked, isSigned, isDirty, completionPct,
  autosaveStatus, lastSaved, validationErrors, requiresCoSign = true,
  showAddendum, setShowAddendum, addendumText, setAddendumText, onAddAddendum,
  versions, onSaveDraft, onSubmitForCoSign, onSign,
  readOnly, editRoles, authorName = 'Staff', authorRole = '', documentTitle = 'Clinical Document',
  compact,
}: DocumentFormBarProps) {
  const [sigOpen, setSigOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ── Autosave pill ────────────────────────────────────────────────────────────
  let autosavePill: React.ReactNode = null;
  if (isLocked) {
    autosavePill = null;
  } else if (autosaveStatus === 'saving') {
    autosavePill = (
      <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3 animate-spin" /> Saving…
      </span>
    );
  } else if (autosaveStatus === 'saved' && lastSaved) {
    autosavePill = (
      <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" /> Saved {formatRelativeTime(lastSaved)}
      </span>
    );
  } else if (isDirty) {
    autosavePill = (
      <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        <AlertTriangle className="w-3 h-3" /> Unsaved changes
      </span>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-white">
      {/* Completion bar */}
      <div className="px-4 pt-3 pb-2 bg-gray-50 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${COMPLETION_TEXT(completionPct)}`}>
              {completionPct}% complete
            </span>
            {!compact && (
              <span className="text-[10px] text-slate">
                {completionPct < 100 ? '— fill in required fields to submit' : '— all required fields filled'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {autosavePill}
            {isLocked && (
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isSigned ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <Lock className="w-3 h-3" />
                {isSigned ? 'Signed & Locked' : 'Pending Co-sign'}
              </span>
            )}
            {formState === 'pending_cosign' && (
              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Awaiting supervisor co-signature
              </span>
            )}
          </div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${COMPLETION_COLOR(completionPct)}`}
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-red-700 mb-0.5">Required fields missing:</div>
            <div className="text-[11px] text-red-600">{validationErrors.join(' · ')}</div>
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
        {!isLocked && (
          <>
            <LockedButton
              locked={readOnly}
              editRoles={editRoles}
              onClick={onSaveDraft}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-border rounded-lg hover:bg-gray-50 text-slate transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Save Draft
            </LockedButton>

            {requiresCoSign && (
              <LockedButton
                locked={readOnly}
                editRoles={editRoles}
                onClick={() => onSubmitForCoSign?.()}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 bg-sunrise-blue text-white rounded-lg hover:bg-sunrise-blue-light transition-colors disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" /> Submit for Co-sign
              </LockedButton>
            )}

            <LockedButton
              locked={readOnly}
              editRoles={editRoles}
              onClick={() => setSigOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors"
            >
              <PenTool className="w-3.5 h-3.5" /> Sign &amp; Submit
            </LockedButton>
          </>
        )}

        {isLocked && !showAddendum && (
          <>
            <LockedButton
              locked={readOnly}
              editRoles={editRoles}
              onClick={() => setShowAddendum(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-orange text-orange rounded-lg hover:bg-orange/5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Addendum
            </LockedButton>
            <span className="text-[10px] text-slate ml-1">Document is locked. Use addendum to append corrections.</span>
          </>
        )}

        {/* Version history toggle */}
        {versions.length > 0 && (
          <button
            onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-1 text-[11px] text-slate hover:text-navy ml-auto transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            {showHistory ? 'Hide' : 'Show'} History ({versions.length})
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Addendum area */}
      {showAddendum && (
        <div className="px-4 pb-4 border-t border-orange/20 bg-orange/5">
          <div className="text-xs font-semibold text-orange mt-3 mb-1.5">Addendum</div>
          <textarea
            value={addendumText}
            onChange={e => setAddendumText(e.target.value)}
            placeholder="Enter addendum text — this will be appended to the locked document with your name and timestamp…"
            rows={3}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
          <div className="flex gap-2 mt-2">
            <LockedButton
              locked={readOnly}
              editRoles={editRoles}
              onClick={onAddAddendum}
              className="text-xs font-semibold px-3 py-1.5 bg-orange text-white rounded-lg hover:bg-orange/90 transition-colors"
            >
              Save Addendum
            </LockedButton>
            <button
              onClick={() => { setShowAddendum(false); setAddendumText(''); }}
              className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-gray-50 text-slate"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Version history list */}
      {showHistory && versions.length > 0 && (
        <div className="border-t border-border">
          <div className="px-4 py-2 bg-gray-50 text-[10px] font-bold text-slate uppercase tracking-wider">
            Version History — {versions.length} save{versions.length !== 1 ? 's' : ''}
          </div>
          <div className="divide-y divide-border max-h-52 overflow-y-auto">
            {versions.map((v, i) => (
              <div key={v.id} className="px-4 py-2.5 hover:bg-gray-50 flex items-start gap-3">
                <div className="shrink-0 text-[10px] font-bold text-slate bg-gray-100 rounded px-1.5 py-0.5">
                  {v.isAutosave ? 'AUTO' : 'SAVE'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-navy font-medium">{v.savedBy}</div>
                  <div className="text-[10px] text-slate truncate">
                    {new Date(v.savedAt).toLocaleString('en-US', {
                      month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                    {v.contentSnapshot.startsWith('[ADDENDUM]') && (
                      <span className="ml-1.5 text-orange font-semibold">Addendum</span>
                    )}
                  </div>
                  {i === 0 && <div className="text-[10px] text-emerald-600 font-semibold">Latest</div>}
                </div>
                <div className="shrink-0 text-[10px] text-slate max-w-[160px] truncate">
                  {v.contentSnapshot.slice(0, 60)}{v.contentSnapshot.length > 60 ? '…' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signature modal */}
      <SignatureModal
        isOpen={sigOpen}
        onClose={() => setSigOpen(false)}
        signerType="staff"
        documentTitle={documentTitle}
        signerName={authorName.split(',')[0]}
        signerRole={authorRole}
        onSign={(record) => { if (onSign(record) !== false) setSigOpen(false); }}
      />
    </div>
  );
}
