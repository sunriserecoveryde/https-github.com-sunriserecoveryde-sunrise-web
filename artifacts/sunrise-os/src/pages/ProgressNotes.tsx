import React, { useState, useMemo } from 'react';
import { MOCK_PATIENTS, Patient, ProgressNote } from '../data/mockPatients';
import { Screen } from '../App';
import { useSessionChart, SessionNote } from '../context/SessionChartContext';
import { useAuth } from '../context/AuthContext';
import {
  Search, Filter, PenTool, CheckCircle, Clock, ChevronDown, ChevronUp,
  FileText, AlertTriangle, Plus, Download, Eye
} from 'lucide-react';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { LockedButton } from '../components/common/LockedButton';
import { getRolesWithEditAccess } from '../data/mockRoles';

// ─── Extended mock notes ─────────────────────────────────────────────────────

const EXTRA_NOTES: Record<string, ProgressNote[]> = {
  p3: [
    {
      id: 'n3a', date: '2026-07-19 09:30', type: 'Individual', author: 'Sarah Jenkins, LPC', status: 'Signed', format: 'BIRP',
      content: 'B: Client presented as guarded and slightly irritable. Made eye contact intermittently. Reports poor sleep and "feeling watched." No overt paranoid ideation expressed in session. I: Explored experiences of paranoia using Socratic questioning. Validated distress while reality-testing content. Discussed sleep hygiene. R: Client engaged in reality-testing with prompting. Denied SI/HI. Declined group today citing anxiety. P: Continue daily individual contact. Coordinate with psychiatry re: dose/med adjustment for sleep and anxiety.',
    },
    {
      id: 'n3b', date: '2026-07-18 14:00', type: 'Group', author: 'Maria Gonzales, LCSW', status: 'Awaiting Co-sign', format: 'DAP',
      content: 'D: Client attended Relapse Prevention group. Participated minimally — two brief verbal contributions. Appeared distracted. A: Client demonstrating difficulty with group engagement, likely related to ongoing substance-induced psychiatric symptoms. Interaction with peers adequate — no conflicts this session. P: Encourage 1 group interaction per session as short-term goal; follow up in 1:1 re: barriers to group engagement.',
    },
  ],
  p4: [
    {
      id: 'n4a', date: '2026-07-19 07:30', type: 'Medical', author: 'Dr. Robert Chen, MD', status: 'Signed', format: 'DAP',
      content: 'D: Patient seen at bedside for dual withdrawal protocol review. COWS 10 (down from 14 yesterday), CIWA 8 (down from 12). BP 144/92 — improved. Wound site left arm assessed — dressing changed, no signs of re-infection. A: COWS and CIWA responding to protocol. Wound healing on track. BP trending toward target. P: Continue Suboxone 8/2mg BID, Lorazepam Q6H PRN CIWA ≥ 8. Wound care daily. Repeat BMP tomorrow morning. Reassess for MAT dose adjustment at rounds tomorrow.',
    },
    {
      id: 'n4b', date: '2026-07-19 11:00', type: 'Individual', author: 'David Odom, LMFT', status: 'Awaiting Co-sign', format: 'BIRP',
      content: 'B: Client appeared more alert than recent sessions. Cooperative and made sustained eye contact. Reports feeling "a little less sick today." I: Explored client motivation for treatment given court-mandated context — used MI to identify internal motivation beyond legal pressure. Client identified desire to "be present" for 3-year-old daughter as intrinsic motivator. R: Moderate motivation — external/legal driver primary but internal motivation emerging. Not yet at Contemplation per TTM. P: Continue MI approach; assign journaling exercise on "what recovery would change in my life." Drug court ROI signed and submitted.',
    },
  ],
  p5: [
    {
      id: 'n5a', date: '2026-07-18 16:00', type: 'Nursing', author: 'Jessica Torres, RN, CARN', status: 'Signed', format: 'DAP',
      content: 'D: CIWA 6 at 1600 assessment. Patient cooperative, no complaints of tremor or visual disturbances. BP 124/80, HR 78 — within normal limits. States appetite improving. A: CIWA trending down — Day 6 of alcohol withdrawal protocol. Symptom burden decreasing appropriately. P: Continue Q4H CIWA per protocol. Notify MD if CIWA ≥ 10 or if new tremor, seizure activity, or agitation emerges. Continue Gabapentin 600mg TID. Follow up at 2000 assessment.',
    },
  ],
  p6: [
    {
      id: 'n6a', date: '2026-07-19 10:00', type: 'Individual', author: 'Maria Gonzales, LCSW', status: 'Signed', format: 'BIRP',
      content: "B: Client engaged and articulate in session. Reports mood 6/10, improved from 4 yesterday. Appetite returned. Denies cravings for alcohol currently but expresses fear of cravings returning upon discharge. I: Processed client's fears around discharge using Motivational Interviewing. Explored recovery environment — supportive spouse; minimal alcohol in household. Reviewed relapse warning signs and response plan. R: Client demonstrating Preparation stage per TTM. Excellent insight. Expressed interest in outpatient IOP post-residential. P: Begin discharge planning this week. Schedule IOP intake evaluation. Introduce AA/SMART meeting schedule.",
    },
  ],
  p8: [
    {
      id: 'n8a', date: '2026-07-19 13:00', type: 'Psychiatric', author: 'Dr. Allen Hughes, MD', status: 'Signed', format: 'DAP',
      content: 'D: Psychiatric evaluation requested by nursing for eating restriction behaviors and severe anxiety. Patient cooperative, tearful at times. Reports restricting 1 meal/day due to "feeling fat." Denies purging or laxative use. PHQ-9: 14 (moderate depression). GAD-7: 16 (severe anxiety). A: Active eating disorder behaviors concurrent with anxiety and depression in context of OUD treatment. Risk for nutritional compromise. Eating disorder treatment integration warranted. P: Dietitian consultation ordered. DBT skills referral to group. Start Escitalopram 10mg daily for depression/anxiety. Nutritional lab panel ordered. Co-occurring ED must be addressed for sustainable recovery.',
    },
  ],
};

function getAllNotes() {
  return MOCK_PATIENTS.flatMap(p => {
    const base = p.notes.map(n => ({ ...n, patientId: p.id, patientFirstName: p.firstName, patientLastName: p.lastName, program: p.program }));
    const extra = (EXTRA_NOTES[p.id] ?? []).map(n => ({ ...n, patientId: p.id, patientFirstName: p.firstName, patientLastName: p.lastName, program: p.program }));
    return [...base, ...extra];
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<ProgressNote['status'], { cls: string; icon: React.ReactNode; label: string }> = {
  'Signed':         { cls: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" />, label: 'Signed' },
  'Awaiting Co-sign':{ cls: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3 h-3" />, label: 'Needs Co-sign' },
  'Draft':          { cls: 'bg-slate-100 text-slate', icon: <FileText className="w-3 h-3" />, label: 'Draft' },
};

const TYPE_COLORS: Record<string, string> = {
  Individual: 'bg-blue-100 text-blue-700',
  Group:      'bg-purple-100 text-purple-700',
  Medical:    'bg-red-100 text-red-700',
  Nursing:    'bg-teal-100 text-teal-700',
  Psychiatric:'bg-indigo-100 text-indigo-700',
};

// Parse a BIRP note into sections
function parseBIRP(content: string) {
  const labels = ['B:', 'I:', 'R:', 'P:'];
  const result: { label: string; text: string }[] = [];
  const fullLabels = { 'B:': 'Behavior', 'I:': 'Intervention', 'R:': 'Response', 'P:': 'Plan' };
  labels.forEach((lbl, idx) => {
    const start = content.indexOf(lbl);
    if (start === -1) return;
    const end = labels.slice(idx + 1).reduce((acc, next) => {
      const pos = content.indexOf(next, start);
      return pos !== -1 && pos < acc ? pos : acc;
    }, content.length);
    result.push({ label: fullLabels[lbl as keyof typeof fullLabels] ?? lbl, text: content.slice(start + 2, end).trim() });
  });
  return result.length > 0 ? result : null;
}

function parseDAP(content: string) {
  const labels = ['D:', 'A:', 'P:'];
  const result: { label: string; text: string }[] = [];
  const fullLabels = { 'D:': 'Data', 'A:': 'Assessment', 'P:': 'Plan' };
  labels.forEach((lbl, idx) => {
    const start = content.indexOf(lbl);
    if (start === -1) return;
    const end = labels.slice(idx + 1).reduce((acc, next) => {
      const pos = content.indexOf(next, start);
      return pos !== -1 && pos < acc ? pos : acc;
    }, content.length);
    result.push({ label: fullLabels[lbl as keyof typeof fullLabels] ?? lbl, text: content.slice(start + 2, end).trim() });
  });
  return result.length > 0 ? result : null;
}

// ─── Note Row ─────────────────────────────────────────────────────────────────

function NoteRow({
  note, readOnly, navigate
}: {
  note: ReturnType<typeof getAllNotes>[0];
  readOnly?: boolean;
  navigate: (s: Screen) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [localSigned, setLocalSigned] = useState(false);
  const badge = STATUS_BADGE[note.status];
  const parsed = note.format === 'BIRP' ? parseBIRP(note.content) : parseDAP(note.content);

  return (
    <div className="border border-border rounded-lg mb-3 overflow-hidden hover:border-slate-300 transition-colors">
      {/* Summary row */}
      <div
        className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${note.status === 'Awaiting Co-sign' ? 'bg-amber-50/40' : 'bg-white'}`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Checkbox */}
        <input type="checkbox" className="rounded border-border text-sunrise-blue flex-none" onClick={e => e.stopPropagation()} />

        {/* Date/time */}
        <div className="w-32 flex-none">
          <div className="text-xs font-semibold text-navy">{note.date.split(' ')[0]}</div>
          <div className="text-[10px] text-slate">{note.date.split(' ')[1]}</div>
        </div>

        {/* Patient */}
        <div className="w-40 flex-none">
          <div className="text-sm font-semibold text-navy">{note.patientFirstName} {note.patientLastName}</div>
          <div className="text-[10px] text-slate">{note.program}</div>
        </div>

        {/* Type + Format */}
        <div className="flex items-center gap-2 flex-none">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${TYPE_COLORS[note.type] ?? 'bg-slate-100 text-slate'}`}>{note.type}</span>
          <span className="text-[10px] font-bold bg-slate-100 text-slate px-2 py-0.5 rounded">{note.format}</span>
        </div>

        {/* Author */}
        <div className="flex-1 min-w-0 hidden md:block">
          <div className="text-xs text-navy truncate">{note.author}</div>
        </div>

        {/* Status */}
        <div className="flex-none">
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded ${badge.cls}`}>
            {badge.icon} {badge.label}
          </span>
        </div>

        {/* Action */}
        <div className="flex-none flex items-center gap-2">
          <LockedButton
            locked={readOnly && note.status === 'Awaiting Co-sign'}
            className="text-sunrise-blue text-xs font-medium hover:underline bg-sunrise-blue/10 px-2 py-1 rounded whitespace-nowrap"
            onClick={e => { e.stopPropagation(); if (note.status === 'Awaiting Co-sign') navigate('CosignQueue'); }}
          >
            {note.status === 'Awaiting Co-sign' ? 'Review & Sign' : 'View Note'}
          </LockedButton>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded note content */}
      {expanded && (
        <div className="border-t border-border bg-slate-50 px-4 py-4 space-y-3">
          {parsed ? (
            parsed.map(section => (
              <div key={section.label}>
                <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-1">{section.label}</div>
                <p className="text-sm text-navy leading-relaxed">{section.text}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-navy leading-relaxed">{note.content}</p>
          )}
          <div className="flex gap-2 pt-2 border-t border-border">
            <LockedButton
              locked={readOnly && note.status === 'Awaiting Co-sign'}
              onClick={() => { if (!localSigned) { setLocalSigned(true); } }}
              className={`px-3 py-1.5 text-xs font-semibold rounded hover:opacity-90 ${localSigned || note.status !== 'Awaiting Co-sign' ? 'bg-green-100 text-green-700' : 'bg-success text-white'}`}
            >
              {localSigned || note.status !== 'Awaiting Co-sign' ? '✓ Signed' : 'Sign & Approve'}
            </LockedButton>
            <button onClick={() => { setExpanded(false); }} className="px-3 py-1.5 border border-border text-xs font-semibold rounded hover:bg-white text-slate flex items-center gap-1">
              <Eye className="w-3 h-3" /> Print Note
            </button>
            <button onClick={() => { setExpanded(false); }} className="px-3 py-1.5 border border-border text-xs font-semibold rounded hover:bg-white text-slate flex items-center gap-1">
              <Download className="w-3 h-3" /> Export PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── New Note Form ────────────────────────────────────────────────────────────

function NewNoteForm({ onClose, onSave }: { onClose: () => void; onSave: (note: SessionNote) => void }) {
  const [format, setFormat] = useState<'BIRP' | 'DAP'>('BIRP');
  const [type, setType] = useState('Individual');
  const [patient, setPatient] = useState('p_demo'); // default to Jonny Quest
  const birpFields = ['Behavior', 'Intervention', 'Response', 'Plan'];
  const dapFields = ['Data', 'Assessment', 'Plan'];
  const fields = format === 'BIRP' ? birpFields : dapFields;
  const [values, setValues] = useState<Record<string, string>>({});
  const { currentStaff } = useAuth();
  const authorLabel = currentStaff
    ? `${currentStaff.firstName} ${currentStaff.lastName}${(currentStaff.credentials ?? []).length ? ', ' + (currentStaff.credentials ?? []).join(', ') : ''}`
    : 'Staff Member';

  const handleSave = (status: ProgressNote['status']) => {
    const pt = MOCK_PATIENTS.find(p => p.id === patient);
    if (!pt || !patient) return;
    const contentParts = format === 'BIRP' ? birpFields : dapFields;
    const content = contentParts.map(f => `${f}: ${values[f] ?? '(not entered)'}`).join('\n');
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    onSave({
      id: `session-${Date.now()}`,
      date: dateStr,
      type,
      author: authorLabel,
      status,
      format,
      content,
      patientId: pt.id,
      patientFirstName: pt.firstName,
      patientLastName: pt.lastName,
      program: pt.program,
    });
    onClose();
  };

  return (
    <div className="bg-white border border-border rounded-xl shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-navy text-lg flex items-center gap-2"><PenTool className="w-5 h-5 text-sunrise-blue" /> New Progress Note</h2>
        <button onClick={onClose} className="text-slate hover:text-navy text-sm">Cancel</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1">Patient</label>
          <select
            value={patient}
            onChange={e => setPatient(e.target.value)}
            className="w-full bg-bg border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-sunrise-blue"
          >
            <option value="">Select patient…</option>
            {MOCK_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.mrn})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1">Note Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full bg-bg border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-sunrise-blue"
          >
            {['Individual', 'Group', 'Medical', 'Nursing', 'Psychiatric'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1">Format</label>
          <div className="flex gap-2">
            {(['BIRP', 'DAP'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 px-3 py-2 text-sm font-semibold rounded border transition-colors ${format === f ? 'bg-navy text-white border-navy' : 'bg-white text-slate border-border hover:border-slate-300'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {fields.map(f => (
          <div key={f}>
            <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1">{f}</label>
            <textarea
              rows={3}
              value={values[f] ?? ''}
              onChange={e => setValues(prev => ({ ...prev, [f]: e.target.value }))}
              placeholder={`Enter ${f.toLowerCase()} here…`}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-sunrise-blue"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <button onClick={() => handleSave('Awaiting Co-sign')} disabled={!patient} className="px-4 py-2 bg-sunrise-blue text-white text-sm font-semibold rounded hover:bg-sunrise-blue-light disabled:opacity-40 disabled:cursor-not-allowed">Submit for Co-sign</button>
        <button onClick={() => handleSave('Draft')} disabled={!patient} className="px-4 py-2 border border-border text-slate text-sm font-semibold rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Save as Draft</button>
        <button onClick={onClose} className="px-4 py-2 text-slate text-sm">Cancel</button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type NoteTab = 'All Notes' | 'Awaiting Co-sign' | 'Drafts' | 'My Notes' | 'Templates';

export function ProgressNotes({ navigate, readOnly }: { navigate: (s: Screen) => void; readOnly?: boolean }) {
  const editRoles = getRolesWithEditAccess('ProgressNotes');
  const [activeTab, setActiveTab] = useState<NoteTab>('All Notes');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [showNewForm, setShowNewForm] = useState(false);

  const { notes: sessionNotes, addNote } = useSessionChart();
  const allNotes = useMemo(
    () => [...sessionNotes, ...getAllNotes()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [sessionNotes],
  );

  const pending = allNotes.filter(n => n.status === 'Awaiting Co-sign').length;
  const drafts = allNotes.filter(n => n.status === 'Draft').length;

  const filtered = allNotes.filter(n => {
    if (activeTab === 'Awaiting Co-sign' && n.status !== 'Awaiting Co-sign') return false;
    if (activeTab === 'Drafts' && n.status !== 'Draft') return false;
    if (activeTab === 'My Notes' && !n.author.includes('Jenkins') && !n.author.includes('Torres')) return false;
    if (typeFilter !== 'All Types' && n.type !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!`${n.patientFirstName} ${n.patientLastName} ${n.author} ${n.content}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <FileText className="w-6 h-6 text-sunrise-blue" /> Progress Notes
          </h1>
          <p className="text-slate text-sm mt-1">Clinical documentation queue — BIRP and DAP format</p>
        </div>
        <LockedButton
          locked={readOnly}
          editRoles={editRoles}
          onClick={() => setShowNewForm(s => !s)}
          className="bg-sunrise-blue text-white px-4 py-2 rounded font-medium flex items-center gap-2 hover:bg-sunrise-blue-light shadow-sm transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> New Note
        </LockedButton>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Notes', value: allNotes.length, color: 'text-navy', border: 'border-navy/20' },
          { label: 'Needs Co-sign', value: pending, color: pending > 0 ? 'text-sunrise-amber' : 'text-success', border: 'border-sunrise-amber/40' },
          { label: 'Draft', value: drafts, color: 'text-slate', border: 'border-slate-200' },
          { label: 'Signed', value: allNotes.filter(n => n.status === 'Signed').length, color: 'text-success', border: 'border-success/30' },
        ].map(k => (
          <div key={k.label} className={`bg-white border-l-4 ${k.border} rounded-lg shadow-sm p-4`}>
            <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* New note form */}
      {showNewForm && !readOnly && <NewNoteForm onClose={() => setShowNewForm(false)} onSave={addNote} />}

      {/* Notes list */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          {(['All Notes', 'Awaiting Co-sign', 'Drafts', 'My Notes', 'Templates'] as NoteTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-sunrise-orange text-sunrise-orange bg-sunrise-orange/5'
                  : 'border-transparent text-slate hover:text-navy hover:bg-slate-50'
              }`}
            >
              {tab}
              {tab === 'Awaiting Co-sign' && pending > 0 && (
                <span className="ml-2 bg-sunrise-amber text-white text-[10px] px-1.5 py-0.5 rounded-full">{pending}</span>
              )}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center justify-between bg-bg/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient, author, or content…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-80 pl-9 pr-4 py-2 bg-white border border-border rounded text-sm focus:outline-none focus:border-sunrise-blue"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-white border border-border rounded text-sm px-3 py-2 text-slate font-medium focus:outline-none"
            >
              {['All Types', 'Individual', 'Group', 'Medical', 'Nursing', 'Psychiatric'].map(t => <option key={t}>{t}</option>)}
            </select>
            {pending > 0 && (
              <button
                onClick={() => setActiveTab('Awaiting Co-sign')}
                className="flex items-center gap-1.5 text-sm font-medium text-sunrise-amber bg-amber-50 border border-amber-200 px-3 py-2 rounded hover:bg-amber-100 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" /> {pending} Need Signature
              </button>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate">
              <FileText className="w-10 h-10 mx-auto mb-3 text-border" />
              <div className="font-semibold text-navy">No notes match your criteria.</div>
            </div>
          ) : (
            filtered.map(n => <NoteRow key={n.id} note={n} readOnly={readOnly} navigate={navigate} />)
          )}
        </div>
      </div>

      {/* Templates tab — ICANotes-inspired: structured templates that load into the note form */}
      {activeTab === 'Templates' && (
        <div className="card space-y-5">
          <div>
            <h2 className="font-bold text-navy text-base mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" /> Note Templates
            </h2>
            <p className="text-sm text-slate">Pre-approved clinical documentation templates — select "Use Template" to pre-fill the New Note form with structured prompts.</p>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {[
              {
                title: 'Individual — Motivational Interviewing Session (BIRP)',
                type: 'Individual', format: 'BIRP',
                content: {
                  'Behavior': 'Client presented [calm / guarded / agitated / tearful]. Made eye contact [consistently / intermittently / minimally]. Reported [describe current experience briefly].',
                  'Intervention': 'Used [MI / CBT / Psychoeducation / Trauma-informed] approach. Explored [ambivalence / triggers / coping strategies / support system]. Provided [reflection / affirmation / open-ended questions].',
                  'Response': 'Client [engaged readily / required prompting / disengaged at times]. Demonstrated [insight / resistance / openness]. Denied SI/HI. Safety plan reviewed: [current / updated / initiated].',
                  'Plan': 'Continue [frequency] individual sessions. Goals for next session: [goal]. Follow up on [specific topic]. Coordinate with [team member] re: [issue].',
                }
              },
              {
                title: 'Group — Relapse Prevention (DAP)',
                type: 'Group', format: 'DAP',
                content: {
                  'Data': 'Client attended [group name] group with [N] peers. Arrived [on time / late — N minutes]. Participation [active / minimal / none]. [Brief behavioral description — facial expression, posture, peer interaction].',
                  'Assessment': 'Client is [engaging / struggling / resistant] with group milieu. [Specific observation about therapeutic progress or barriers]. [Co-occurring factors influencing group behavior if relevant].',
                  'Plan': '[Continue / modify] group assignment. Short-term goal: [goal]. Discuss [specific topic] in next individual session. Monitor for [specific behavior] in group.',
                }
              },
              {
                title: 'Nursing — Withdrawal Assessment (DAP)',
                type: 'Nursing', format: 'DAP',
                content: {
                  'Data': 'CIWA-Ar / COWS score: [score] at [time]. VS: BP [__/__], HR [__], RR [__], Temp [__], SpO₂ [__]%. Patient reports [describe symptoms]. Current medications administered: [list PRN or standing meds given].',
                  'Assessment': 'Withdrawal [improving / stable / worsening] per protocol. Score [above / below] alert threshold of [N]. [Note any emergent symptoms — tremor, diaphoresis, hallucinations].',
                  'Plan': 'Continue Q[N]H CIWA/COWS monitoring per protocol. Notify MD if score ≥ [threshold]. Next assessment due at [time]. [Additional nursing interventions — IV fluids, comfort measures, safety checks].',
                }
              },
              {
                title: 'Medical — Physician Progress Note (SOAP)',
                type: 'Medical', format: 'DAP',
                content: {
                  'Data': 'Patient seen at [location]. Subjective: [patient-reported symptoms, complaints, response to treatment]. Objective: VS [__], Labs reviewed: [findings]. Withdrawal score: CIWA [__] / COWS [__]. Exam: [relevant physical findings].',
                  'Assessment': '[Primary diagnosis] [improving / stable / worsening]. [Secondary diagnoses with status]. [Withdrawal protocol status]. [MAT response — dose, tolerability, COWS/CIWA trend].',
                  'Plan': '[Medication changes or continuations]. [Lab orders]. [Referrals]. [Level of care assessment — is current LOC appropriate?]. Follow up [timing].',
                }
              },
              {
                title: 'Psychiatric — Evaluation Follow-up (DAP)',
                type: 'Psychiatric', format: 'DAP',
                content: {
                  'Data': 'MSE: Appearance [appropriate/disheveled], Behavior [cooperative/agitated], Speech [normal/pressured/slowed], Mood [euthymic/dysphoric/anxious], Affect [congruent/labile/flat], Thought process [linear/tangential], SI [none / passive ideation], HI [none]. PHQ-9: [score]. GAD-7: [score].',
                  'Assessment': 'Co-occurring psychiatric diagnosis: [diagnosis]. Stability: [stable / improving / decompensating]. Substance-induced vs. independent differential. C-SSRS risk: [low / moderate / high].',
                  'Plan': '[Medication orders — new, dose change, or continuations]. [Safety plan status]. [Refer to group / individual / family therapy]. Follow up [timing].',
                }
              },
              {
                title: 'Family Therapy Session (BIRP)',
                type: 'Individual', format: 'BIRP',
                content: {
                  'Behavior': 'Patient and [family member relationship] attended family session. Interaction quality: [describe — supportive / conflictual / emotional]. Patient [expressed / avoided / minimized] impact of substance use on family.',
                  'Intervention': 'Facilitated [communication exercises / psychoeducation on SUD / boundary-setting discussion / family systems work]. Addressed [codependency / enabling / communication patterns].',
                  'Response': 'Family member(s) [engaged / resistant / tearful / disengaged]. Patient [receptive / defensive / open to family input]. Progress noted: [describe any shift or insight].',
                  'Plan': 'Recommend [family follow-up frequency]. Refer family to Al-Anon / Nar-Anon resources. [Goals for next family session]. Coordinate with primary counselor.',
                }
              },
            ].map(tmpl => (
              <div key={tmpl.title} className="border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{tmpl.type}</span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate px-1.5 py-0.5 rounded">{tmpl.format}</span>
                  <h3 className="font-semibold text-navy text-xs ml-1 flex-1">{tmpl.title}</h3>
                </div>
                {Object.entries(tmpl.content).map(([field, text]) => (
                  <div key={field} className="mb-2">
                    <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-0.5">{field}</div>
                    <div className="text-[10px] text-navy bg-gray-50 rounded p-2 leading-relaxed italic">{text}</div>
                  </div>
                ))}
                <LockedButton
                  locked={readOnly}
                  editRoles={editRoles}
                  onClick={() => setShowNewForm(true)}
                  className="mt-3 text-xs px-3 py-1.5 bg-navy text-white rounded hover:bg-navy/90 font-medium"
                >
                  Use Template
                </LockedButton>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Co-sign Queue panel — always visible except on Templates tab */}
      {activeTab !== 'Templates' && (
      <div className="card">
        <h2 className="font-bold text-navy text-base mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Co-sign Queue
        </h2>
        <div className="space-y-3">
          {getAllNotes().filter(n => n.status === 'Awaiting Co-sign').map(n => (
            <div key={n.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <div>
                <div className="font-medium text-navy text-sm">{n.patientFirstName} {n.patientLastName} — {n.type} Note</div>
                <div className="text-xs text-slate mt-0.5">{n.date} · {n.author} · {n.format} format</div>
              </div>
              <div className="flex gap-2">
                <button className="text-xs px-3 py-1 border border-border rounded text-slate hover:bg-gray-50">Review</button>
                <button className="text-xs px-3 py-1 bg-navy text-white rounded hover:bg-navy/90">Co-sign</button>
              </div>
            </div>
          ))}
          {getAllNotes().filter(n => n.status === 'Awaiting Co-sign').length === 0 && (
            <div className="text-center py-6 text-slate text-sm">All notes are co-signed ✓</div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
