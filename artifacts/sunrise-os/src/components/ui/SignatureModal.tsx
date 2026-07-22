import React, { useState } from 'react';
import { X, PenTool, CheckCircle, User, Stethoscope, Shield } from 'lucide-react';
import { WetSignatureCanvas } from './WetSignatureCanvas';

export interface SignatureRecord {
  dataUrl: string;
  signerName: string;
  signerRole: string;
  signerType: 'client' | 'staff';
  timestamp: string;
}

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (record: SignatureRecord) => void;
  title?: string;
  /** Pre-fill from logged-in clinician */
  signerName?: string;
  signerRole?: string;
  signerType: 'client' | 'staff';
  existingSignature?: SignatureRecord | null;
  documentTitle?: string;
  attestationText?: string;
}

export function SignatureModal({
  isOpen,
  onClose,
  onSign,
  title,
  signerName: defaultName = '',
  signerRole: defaultRole = '',
  signerType,
  existingSignature = null,
  documentTitle,
  attestationText,
}: SignatureModalProps) {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [name, setName] = useState(defaultName);
  const [role, setRole] = useState(defaultRole);
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  const canConfirm =
    !!signatureDataUrl &&
    !!name.trim() &&
    (signerType === 'client' || !!role.trim()) &&
    agreed;

  function handleConfirm() {
    if (!canConfirm || !signatureDataUrl) return;
    onSign({
      dataUrl: signatureDataUrl,
      signerName: name.trim(),
      signerRole: signerType === 'client' ? 'Client' : role.trim(),
      signerType,
      timestamp: new Date().toISOString(),
    });
    // reset local state
    setSignatureDataUrl(null);
    setAgreed(false);
    onClose();
  }

  const defaultAttestation =
    signerType === 'client'
      ? `I, ${name || '_______'}, confirm that I have reviewed this document, that the information is accurate to the best of my knowledge, and I consent to its inclusion in my clinical record.`
      : `I attest that the information contained in this clinical document is accurate and complete to the best of my professional knowledge, and I am duly authorized to sign this record.`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
        {/* Header */}
        <div
          className={`px-6 py-4 rounded-t-2xl border-b border-border flex-none ${
            signerType === 'client' ? 'bg-teal-50' : 'bg-navy/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  signerType === 'client' ? 'bg-teal-100' : 'bg-navy/10'
                }`}
              >
                {signerType === 'client' ? (
                  <User className="w-4 h-4 text-teal-700" />
                ) : (
                  <Stethoscope className="w-4 h-4 text-navy" />
                )}
              </div>
              <div>
                <div className="font-semibold text-navy text-sm">
                  {title ?? (signerType === 'client' ? 'Client Signature' : 'Clinical Signature')}
                </div>
                {documentTitle && <div className="text-xs text-slate">{documentTitle}</div>}
              </div>
            </div>
            <button onClick={onClose} className="text-slate hover:text-navy transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Previously signed banner */}
          {existingSignature && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-none mt-0.5" />
              <div className="text-xs text-green-800">
                <strong>Previously signed</strong> by {existingSignature.signerName} (
                {existingSignature.signerRole}) on{' '}
                {new Date(existingSignature.timestamp).toLocaleString()}. Drawing below replaces it.
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate uppercase tracking-wide mb-1.5">
              {signerType === 'client' ? 'Client Full Legal Name' : 'Clinician Name & Credentials'}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={
                signerType === 'client' ? 'Full legal name…' : 'Jane Smith, LPC, CAADC…'
              }
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>

          {/* Role (staff only) */}
          {signerType === 'staff' && (
            <div>
              <label className="block text-xs font-bold text-slate uppercase tracking-wide mb-1.5">
                Role / Title
              </label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="Primary Counselor, Clinical Director, MD…"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
          )}

          {/* Canvas */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate uppercase tracking-wide">
                Signature
              </label>
              <span className="text-[10px] text-slate italic">
                {signerType === 'client' ? 'Client draws below' : 'Clinician draws below'}
              </span>
            </div>
            <WetSignatureCanvas
              height={140}
              onSigned={setSignatureDataUrl}
              onCleared={() => setSignatureDataUrl(null)}
            />
          </div>

          {/* Attestation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-border"
            />
            <span className="text-xs text-slate leading-relaxed">
              {attestationText ?? defaultAttestation}
            </span>
          </label>

          {/* Legal note */}
          <div className="flex items-start gap-2 text-[10px] text-slate bg-gray-50 border border-border rounded-lg px-3 py-2.5">
            <Shield className="w-3 h-3 flex-none text-slate-400 mt-0.5" />
            <span>
              This signature is time-stamped and stored in the audit trail. Electronic signatures
              are legally equivalent to handwritten signatures under ESIGN and UETA.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 justify-end border-t border-border flex-none bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-sm text-slate hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-5 py-2 bg-navy text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <PenTool className="w-4 h-4" />
            {existingSignature ? 'Re-sign Document' : 'Sign Document'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Compact inline signed-state badge shown after a document has been signed */
export function SignedBadge({ record }: { record: SignatureRecord }) {
  return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
      {record.dataUrl && (
        <img
          src={record.dataUrl}
          alt="Signature"
          className="h-10 w-32 object-contain border border-green-200 rounded bg-white"
        />
      )}
      <div>
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs font-semibold text-green-800">Signed</span>
        </div>
        <div className="text-[11px] text-green-700 mt-0.5">
          {record.signerName}
          {record.signerRole && record.signerRole !== 'Client' ? ` · ${record.signerRole}` : ''}
        </div>
        <div className="text-[10px] text-green-600">
          {new Date(record.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
