import React, { useState } from 'react';
import { Flag, FlagType } from '../../data/mockPatients';
import { FLAG_CONFIG } from './FlagBadge';
import { RichTextEditor } from './RichTextEditor';
import { X, Flag as FlagIcon } from 'lucide-react';

// Ordered for display — risks first, success last
const ORDERED_TYPES: { type: FlagType; description: string }[] = [
  { type: 'Risk',        description: 'Specific clinical risk factor — e.g. fall risk, overdose history, suicide ideation' },
  { type: 'Medical',     description: 'Active medical condition requiring monitoring or intervention' },
  { type: 'AMA',         description: 'Against Medical Advice concern — expressed intent or history of leaving early' },
  { type: 'Behavioral',  description: 'Behavioral issue affecting treatment engagement or unit safety' },
  { type: 'Psychiatric', description: 'Active psychiatric concern or co-occurring diagnosis requiring attention' },
  { type: 'Medication',  description: 'Medication alert — induction phase, allergy, complex regimen, or adherence issue' },
  { type: 'Legal',       description: 'Legal obligation, court-ordered treatment, or probation condition' },
  { type: 'Insurance',   description: 'Insurance authorization, concurrent review, or financial concern' },
  { type: 'Success',     description: 'Positive milestone, strong engagement, or recovery win worth noting' },
];

interface Props {
  patientName: string;
  flags: Flag[];
  onSave: (flags: Flag[]) => void;
  onClose: () => void;
}

export function FlagEditorModal({ patientName, flags, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Flag[]>([...flags]);

  const isActive = (type: FlagType) => draft.some(f => f.type === type);
  const getNote  = (type: FlagType) => draft.find(f => f.type === type)?.note ?? '';

  const toggle = (type: FlagType) => {
    if (isActive(type)) {
      setDraft(prev => prev.filter(f => f.type !== type));
    } else {
      setDraft(prev => [...prev, { type, note: '' }]);
    }
  };

  const setNote = (type: FlagType, note: string) => {
    setDraft(prev => prev.map(f => f.type === type ? { ...f, note } : f));
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-navy to-navy-mid px-6 py-4 flex items-center gap-3 shrink-0 rounded-t-xl">
          <FlagIcon className="w-5 h-5 text-sunrise-orange shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm">Edit Patient Flags</div>
            <div className="text-slate-300 text-xs truncate">{patientName}</div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable flag list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {ORDERED_TYPES.map(({ type, description }) => {
            const cfg = FLAG_CONFIG[type];
            const active = isActive(type);
            return (
              <div
                key={type}
                className={`rounded-lg border transition-all duration-150 ${
                  active ? 'border-navy/30 bg-navy/[0.04] shadow-sm' : 'border-border bg-white'
                }`}
              >
                {/* Row — click anywhere to toggle */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  onClick={() => toggle(type)}
                >
                  {/* Colored dot */}
                  <div className={`w-3 h-3 rounded-sm shrink-0 transition-opacity ${cfg.dotColor} ${active ? 'opacity-100' : 'opacity-25'}`} />
                  {/* Checkbox */}
                  <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
                    active ? 'border-navy bg-navy' : 'border-slate-300 bg-white'
                  }`}>
                    {active && <div className="w-1.5 h-1.5 rounded-[2px] bg-white" />}
                  </div>
                  {/* Labels */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className={`text-sm font-semibold leading-tight ${active ? 'text-navy' : 'text-slate-500'}`}>
                      {cfg.label}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 leading-snug">{description}</div>
                  </div>
                </button>

                {/* Rich-text note editor — visible only when flag is active */}
                {active && (
                  <div className="px-4 pb-3">
                    <RichTextEditor
                      value={getNote(type)}
                      onChange={html => setNote(type, html)}
                      placeholder="Add a clinical note for this flag (optional)…"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-50 border-t border-border flex items-center justify-between shrink-0 rounded-b-xl">
          <span className="text-xs text-slate-400">
            {draft.length} flag{draft.length !== 1 ? 's' : ''} active
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate rounded-lg border border-border hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-semibold bg-sunrise-orange text-white rounded-lg hover:bg-sunrise-orange/90 transition-colors"
            >
              Save Flags
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
