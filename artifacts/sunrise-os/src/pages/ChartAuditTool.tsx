import React, { useState, useRef } from 'react';
import { Screen } from '../App';
import { LockedButton } from '../components/common/LockedButton';
import { CheckCircle, XCircle, Minus, AlertTriangle, ClipboardList, Printer, RotateCcw } from 'lucide-react';

interface Props { navigate: (s: Screen, id?: string) => void; readOnly?: boolean; }

// ─── Audit Item ────────────────────────────────────────────────────────────────
type ItemStatus = 'present' | 'absent' | 'na' | null;

interface AuditSection {
  title: string;
  description?: string;
  items: AuditItem[];
}

interface AuditItem {
  id: string;
  label: string;
  formNumber?: string;
  required?: boolean;
}

const AUDIT_SECTIONS: AuditSection[] = [
  {
    title: 'Section 1 — Telephone Intake & Demographics',
    description: 'Verify that initial intake documentation is complete before the first clinical encounter.',
    items: [
      { id: 's1-1', label: 'Telephone Intake completed', required: true },
      { id: 's1-2', label: 'Demographic Page complete', required: true },
      { id: 's1-3', label: 'Insurance Information collected and verified', required: true },
    ],
  },
  {
    title: 'Section 2 — Patient Portal (Consents & Program Materials)',
    description: 'All consents and orientation documents must be signed within 24 hours of admission.',
    items: [
      { id: 's2-1', label: 'Informed Consent signed', required: true },
      { id: 's2-2', label: 'Emergency Contact ROI signed', required: true },
      { id: 's2-3', label: 'Client Rights document signed', required: true },
      { id: 's2-4', label: 'Client Responsibilities signed', required: true },
      { id: 's2-5', label: 'PHP/IOP/OP Expectations signed', required: true },
      { id: 's2-6', label: 'Advance Care Directives completed', required: true },
      { id: 's2-7', label: 'Overdose Prevention form signed', required: true },
      { id: 's2-8', label: 'Program Rules acknowledged and signed', required: true },
    ],
  },
  {
    title: 'Section 3 — Forms',
    description: 'Required releases, privacy notices, and screening instruments.',
    items: [
      { id: 's3-1', label: 'Optum ROI (if applicable)', formNumber: '' },
      { id: 's3-2', label: 'Notice of Privacy Practices (HIPAA NPP) signed', required: true },
      { id: 's3-3', label: 'Records Release form completed', required: true },
      { id: 's3-4', label: 'Telehealth Consent signed', required: true },
      { id: 's3-5', label: 'PHQ-9 Depression Screen administered', formNumber: '#69', required: true },
    ],
  },
  {
    title: 'Section 4 — Clinical Assessments',
    description: 'All validated clinical instruments must be administered at intake per clinical protocol.',
    items: [
      { id: 's4-1', label: 'DAST-10 / MAST Substance Use Screens', formNumber: '#29 / #57', required: true },
      { id: 's4-2', label: 'SOGS Gambling Screen', formNumber: '#85', required: true },
      { id: 's4-3', label: 'SAFE-T Suicide Assessment', formNumber: '#78', required: true },
      { id: 's4-4', label: 'BAM (Brief Addiction Monitor)', formNumber: '#11', required: true },
      { id: 's4-5', label: 'Biopsychosocial Assessment (Nutrition & Pain sections)', required: true },
      { id: 's4-6', label: 'ASAM Level of Care Assessment completed', required: true },
      { id: 's4-7', label: 'Intake Summary note completed and signed', required: true },
      { id: 's4-8', label: 'Pain Assessment documented', },
      { id: 's4-9', label: 'Diet / Eating Disorder Screening completed', },
      { id: 's4-10', label: 'Smoking / Tobacco Use Assessment', },
      { id: 's4-11', label: 'SNAP (Strengths, Needs, Abilities, Preferences) completed', },
    ],
  },
  {
    title: 'Section 5 — Treatment Planning & Signatures',
    description: 'Treatment plan and key clinical documents must be complete within 30 days of admission.',
    items: [
      { id: 's5-1', label: 'Initial Treatment Plan completed and signed', required: true },
      { id: 's5-2', label: 'Diagnosis documented (ICD-10 codes)', required: true },
      { id: 's5-3', label: 'Medications documented and reconciled', required: true },
      { id: 's5-4', label: 'All required signatures obtained on clinical documents', required: true },
    ],
  },
];

// Total scoreable items = 31 (all items with required: true + optional ones that can be present/absent)
const TOTAL_ITEMS = AUDIT_SECTIONS.reduce((n, s) => n + s.items.length, 0); // 31

// ─── Signature Canvas ────────────────────────────────────────────────────────
function SignatureCanvas({ label, onSigned }: { label: string; onSigned: (sig: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.beginPath();
    const pos = getPos(e, canvas);
    canvas.getContext('2d')!.moveTo(pos.x, pos.y);
    setDrawing(true);
    e.preventDefault();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e2d4a';
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSig(true);
    e.preventDefault();
  };

  const endDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    onSigned(canvasRef.current!.toDataURL());
  };

  const clearSig = () => {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
    onSigned('');
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate uppercase tracking-wide">{label}</span>
        {hasSig && <button onClick={clearSig} className="text-xs text-slate hover:text-red-600">Clear</button>}
      </div>
      <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-gray-50 relative">
        <canvas
          ref={canvasRef}
          width={360}
          height={90}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasSig && (
          <div className="absolute inset-0 flex items-center justify-center text-slate/40 text-xs pointer-events-none select-none">
            Sign here
          </div>
        )}
      </div>
      {hasSig && (
        <div className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Signature captured
        </div>
      )}
    </div>
  );
}

// ─── Status Button ────────────────────────────────────────────────────────────
function StatusBtn({ status, value, onClick, locked }: {
  status: ItemStatus; value: ItemStatus;
  onClick: () => void; locked?: boolean;
}) {
  const active = status === value;
  const styles: Record<NonNullable<ItemStatus>, string> = {
    present: active ? 'bg-green-500 border-green-500 text-white' : 'border-border text-slate hover:border-green-400 hover:text-green-700',
    absent: active ? 'bg-red-500 border-red-500 text-white' : 'border-border text-slate hover:border-red-400 hover:text-red-700',
    na: active ? 'bg-gray-400 border-gray-400 text-white' : 'border-border text-slate hover:border-gray-400 hover:text-gray-600',
  };
  const icons = { present: '✓', absent: '✗', na: 'N/A' };
  return (
    <button onClick={onClick} disabled={locked}
      className={`rounded-lg border text-xs px-2.5 py-1.5 font-semibold transition-colors disabled:opacity-40 ${styles[value!]}`}>
      {icons[value!]}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ChartAuditTool({ navigate: _navigate, readOnly }: Props) {
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState('');
  const [intakeDate, setIntakeDate] = useState('');
  const [auditorName, setAuditorName] = useState('');
  const [auditorSig, setAuditorSig] = useState('');
  const [supervisorSig, setSupervisorSig] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Item statuses: null = not reviewed, 'present', 'absent', 'na'
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>({});

  const [submitted, setSubmitted] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const saveAction = (m: string) => { setSavedMsg(m); setTimeout(() => setSavedMsg(null), 2500); };

  const setStatus = (id: string, val: ItemStatus) => {
    if (readOnly) return;
    setStatuses(prev => ({ ...prev, [id]: val }));
  };

  // ── Scoring ──────────────────────────────────────────────────────────────
  const allItems = AUDIT_SECTIONS.flatMap(s => s.items);
  const scoredItems = allItems.filter(item => statuses[item.id] === 'present' || statuses[item.id] === 'absent');
  const presentCount = allItems.filter(item => statuses[item.id] === 'present').length;
  const naCount = allItems.filter(item => statuses[item.id] === 'na').length;
  const scorableTotal = TOTAL_ITEMS - naCount; // denominator excludes N/A
  const reviewedCount = allItems.filter(item => statuses[item.id] !== null).length;
  const compliancePct = scorableTotal > 0 ? Math.round((presentCount / scorableTotal) * 100) : 0;

  // Required items missing (absent, not na)
  const requiredAbsent = allItems.filter(item => item.required && statuses[item.id] === 'absent');

  const canSubmit = auditorSig && supervisorSig && clientName && reviewedCount === TOTAL_ITEMS;

  const reset = () => {
    setStatuses({});
    setAuditorSig('');
    setSupervisorSig('');
    setNotes({});
    setSubmitted(false);
    setClientName('');
    setIntakeDate('');
    setAuditorName('');
  };

  if (submitted) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="card text-center py-10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy">Chart Audit Complete</h2>
          <p className="text-slate text-sm mt-2">Audit submitted for <strong>{clientName}</strong></p>
          <div className="flex justify-center gap-6 mt-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${compliancePct >= 90 ? 'text-green-600' : compliancePct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{presentCount}/{scorableTotal}</div>
              <div className="text-xs text-slate mt-1">Items Present</div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${compliancePct >= 90 ? 'text-green-600' : compliancePct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{compliancePct}%</div>
              <div className="text-xs text-slate mt-1">Compliance</div>
            </div>
          </div>
          {requiredAbsent.length > 0 && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-left">
              <div className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {requiredAbsent.length} Required Item{requiredAbsent.length > 1 ? 's' : ''} Absent</div>
              <ul className="space-y-1">
                {requiredAbsent.map(item => <li key={item.id} className="text-xs text-red-700">• {item.label}</li>)}
              </ul>
            </div>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={reset} className="border border-border rounded-xl px-5 py-2 text-sm text-slate hover:bg-gray-50 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> New Audit
            </button>
            <button onClick={() => window.print()} className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print / Export
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Grace House Chart Audit Tool</h1>
          <p className="text-slate text-sm mt-0.5">Chart compliance audit · Dual signatures required · Score calculated automatically</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate uppercase font-semibold">Score</div>
          <div className={`text-3xl font-bold ${compliancePct >= 90 ? 'text-green-600' : compliancePct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
            {presentCount}<span className="text-lg font-normal text-slate">/{scorableTotal}</span>
          </div>
          <div className={`text-sm font-semibold ${compliancePct >= 90 ? 'text-green-600' : compliancePct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
            {compliancePct}% Compliance
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate mb-1">
          <span>{reviewedCount} of {TOTAL_ITEMS} items reviewed</span>
          <span>{TOTAL_ITEMS - reviewedCount} remaining</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-2 bg-orange rounded-full transition-all" style={{ width: `${(reviewedCount / TOTAL_ITEMS) * 100}%` }} />
        </div>
      </div>

      {/* Client info */}
      <div className="card grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate uppercase mb-1">Client Name *</label>
          <input value={clientName} onChange={e => setClientName(e.target.value)} disabled={readOnly}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            placeholder="Full name as it appears on chart" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate uppercase mb-1">Intake Date</label>
          <input type="date" value={intakeDate} onChange={e => setIntakeDate(e.target.value)} disabled={readOnly}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate uppercase mb-1">Audit Date</label>
          <input type="date" value={auditDate} onChange={e => setAuditDate(e.target.value)} disabled={readOnly}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate uppercase mb-1">Auditor Name / Credential</label>
          <input value={auditorName} onChange={e => setAuditorName(e.target.value)} disabled={readOnly}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            placeholder="e.g. James S. Collins III, CAC-AD, BAS" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-slate items-center bg-gray-50 rounded-xl px-4 py-2.5 border border-border">
        <span className="font-semibold text-navy">Mark each item:</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-green-500 flex items-center justify-center text-white text-[10px] font-bold">✓</span> Present / Completed</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">✗</span> Absent / Incomplete</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-gray-400 flex items-center justify-center text-white text-[10px] font-bold">—</span> Not Applicable</span>
      </div>

      {/* Sections */}
      {AUDIT_SECTIONS.map(section => {
        const sectionPresent = section.items.filter(i => statuses[i.id] === 'present').length;
        const sectionNA = section.items.filter(i => statuses[i.id] === 'na').length;
        const sectionTotal = section.items.length - sectionNA;
        const sectionPct = sectionTotal > 0 ? Math.round((sectionPresent / sectionTotal) * 100) : 100;

        return (
          <div key={section.title} className="card space-y-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-navy text-sm">{section.title}</h3>
                {section.description && <p className="text-xs text-slate mt-0.5">{section.description}</p>}
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className={`text-base font-bold ${sectionPct === 100 ? 'text-green-600' : sectionPct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                  {sectionPresent}/{sectionTotal}
                </div>
                <div className="text-xs text-slate">{sectionPct}%</div>
              </div>
            </div>

            <div className="space-y-1">
              {section.items.map(item => {
                const status = statuses[item.id] ?? null;
                return (
                  <div key={item.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${status === 'present' ? 'bg-green-50 border border-green-200' : status === 'absent' ? 'bg-red-50 border border-red-200' : status === 'na' ? 'bg-gray-50 border border-gray-200' : 'border border-transparent hover:bg-gray-50'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${status === 'present' ? 'bg-green-500' : status === 'absent' ? 'bg-red-500' : status === 'na' ? 'bg-gray-400' : 'bg-gray-200'}`}>
                      {status === 'present' && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      {status === 'absent' && <XCircle className="w-3.5 h-3.5 text-white" />}
                      {status === 'na' && <Minus className="w-3.5 h-3.5 text-white" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-navy">{item.label}</span>
                        {item.formNumber && (
                          <span className="text-[10px] bg-navy/10 text-navy px-1.5 py-0.5 rounded font-mono">{item.formNumber}</span>
                        )}
                        {item.required && (
                          <span className="text-[10px] text-red-500 font-bold">required</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <StatusBtn status={status} value="present" onClick={() => setStatus(item.id, 'present')} locked={readOnly} />
                      <StatusBtn status={status} value="absent" onClick={() => setStatus(item.id, 'absent')} locked={readOnly} />
                      <StatusBtn status={status} value="na" onClick={() => setStatus(item.id, 'na')} locked={readOnly} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Section notes */}
            <div className="pt-2">
              <textarea
                value={notes[section.title] ?? ''}
                onChange={e => setNotes(prev => ({ ...prev, [section.title]: e.target.value }))}
                disabled={readOnly}
                className="w-full border border-border rounded-lg px-3 py-2 text-xs text-slate min-h-[48px] resize-none"
                placeholder={`Notes for ${section.title}...`}
              />
            </div>
          </div>
        );
      })}

      {/* Audit Results Summary */}
      <div className="card bg-navy/5 border-2 border-navy/20">
        <div className="flex items-center gap-3 mb-4">
          <ClipboardList className="w-5 h-5 text-navy" />
          <h3 className="font-bold text-navy">Chart Audit Results</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-xl p-3 text-center border border-border">
            <div className="text-xs text-slate uppercase font-semibold mb-1">Score</div>
            <div className={`text-3xl font-bold ${compliancePct >= 90 ? 'text-green-600' : compliancePct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
              {presentCount}<span className="text-lg font-normal text-slate">/{TOTAL_ITEMS}</span>
            </div>
            <div className="text-xs text-slate mt-0.5">{naCount > 0 ? `(${naCount} N/A excluded)` : 'of 31 items'}</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-border">
            <div className="text-xs text-slate uppercase font-semibold mb-1">Compliance</div>
            <div className={`text-3xl font-bold ${compliancePct >= 90 ? 'text-green-600' : compliancePct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
              {compliancePct}%
            </div>
            <div className="text-xs text-slate mt-0.5">{compliancePct >= 90 ? 'Meets threshold' : compliancePct >= 75 ? 'Near threshold' : 'Below threshold'}</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-border">
            <div className="text-xs text-slate uppercase font-semibold mb-1">Audit Date</div>
            <div className="text-base font-bold text-navy">{auditDate ? new Date(auditDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
          </div>
        </div>

        {requiredAbsent.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <div className="text-xs font-bold text-red-700 flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {requiredAbsent.length} Required Item{requiredAbsent.length > 1 ? 's' : ''} Absent — Action Required
            </div>
            <ul className="space-y-0.5">
              {requiredAbsent.map(item => <li key={item.id} className="text-xs text-red-700">• {item.label}</li>)}
            </ul>
          </div>
        )}

        {/* Dual signatures */}
        <div className="grid grid-cols-2 gap-6">
          <SignatureCanvas label="Auditor Signature" onSigned={setAuditorSig} />
          <SignatureCanvas label="Clinical Supervisor Signature" onSigned={setSupervisorSig} />
        </div>

        {!canSubmit && (
          <div className="mt-3 text-xs text-slate space-y-0.5">
            {!clientName && <div>• Enter client name</div>}
            {reviewedCount < TOTAL_ITEMS && <div>• Mark all {TOTAL_ITEMS - reviewedCount} remaining items</div>}
            {!auditorSig && <div>• Auditor signature required</div>}
            {!supervisorSig && <div>• Clinical supervisor signature required</div>}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <LockedButton
            locked={readOnly || !canSubmit}
            onClick={() => { setSubmitted(true); saveAction('Audit submitted'); }}
            className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Submit Audit
          </LockedButton>
          <button onClick={() => saveAction('Draft saved')}
            className="border border-border rounded-xl px-4 py-2.5 text-sm text-slate hover:bg-gray-50">
            Save Draft
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> {savedMsg}
        </div>
      )}
    </div>
  );
}
