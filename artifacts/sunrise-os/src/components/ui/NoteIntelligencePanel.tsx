/**
 * NoteIntelligencePanel.tsx
 *
 * The unified AI co-pilot for clinical note writing in SunriseOS.
 * Replaces the previous toggle-based AI Draft Assistant.
 *
 * Features:
 *  1. Patient Intelligence Card — auto-loaded context when patient is selected
 *  2. Quick Capture — natural language → structured note (no button press required)
 *  3. Topic Picker — 46-topic library with role-filtered suggestions
 *  4. Goal-based suggestions — surfaces topics tied to the patient's active goals
 *  5. Note Quality Score — real-time completeness indicator
 *  6. Post-generation smart actions — contextual next steps
 *  7. Format auto-suggestion — role-aware format recommendation
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles, Zap, Target, BookOpen, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, Clock, ArrowRight, Brain,
  TrendingUp, Heart, Shield, PenTool, RotateCcw, Info,
  Flame, User, Activity, Mic,
} from 'lucide-react';
import { SessionRecorderModal } from './SessionRecorderModal';
import { TopicPicker } from './TopicPicker';
import { getTopicById } from '../../lib/topicLibrary';
import {
  parseQuickCapture, scoreNoteQuality, getTopicSuggestionsFromGoals, suggestFormat,
  type ParsedSignal, type NoteQualityResult,
} from '../../lib/quickCaptureParser';
import {
  generateProgressNote, type NoteFormat, type ProgressNoteInput,
} from '../../lib/aiNoteEngine';
import { MOCK_PATIENTS, type Patient, type TreatmentGoal } from '../../data/mockPatients';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  format: NoteFormat;
  onFormatChange: (f: NoteFormat) => void;
  patientId: string;
  noteType: string;
  staffTitle?: string;
  values: Record<string, string>;
  onValuesChange: (v: Record<string, string>) => void;
  fields: string[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QualityBar({ quality }: { quality: NoteQualityResult }) {
  const barColor =
    quality.score >= 90 ? 'bg-green-500' :
    quality.score >= 75 ? 'bg-teal-500' :
    quality.score >= 55 ? 'bg-blue-500' :
    quality.score >= 35 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Note Quality</span>
        <span className={`text-[11px] font-bold ${quality.color}`}>{quality.score}% — {quality.label}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${quality.score}%` }}
        />
      </div>
      {quality.issues.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {quality.issues.slice(0, 2).map((issue, i) => (
            <div key={i} className="flex items-start gap-1 text-[10px] text-amber-600">
              <AlertTriangle className="w-2.5 h-2.5 flex-none mt-0.5" />
              <span>{issue}</span>
            </div>
          ))}
        </div>
      )}
      {quality.strengths.length > 0 && quality.score >= 70 && (
        <div className="mt-1 space-y-0.5">
          {quality.strengths.slice(0, 2).map((s, i) => (
            <div key={i} className="flex items-start gap-1 text-[10px] text-green-600">
              <CheckCircle className="w-2.5 h-2.5 flex-none mt-0.5" />
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SignalChip({ signal }: { signal: ParsedSignal }) {
  const colors: Record<string, string> = {
    high: 'bg-teal-100 text-teal-800 border-teal-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    low: 'bg-slate-100 text-slate border-border',
  };
  const icons: Partial<Record<string, React.ReactNode>> = {
    presentation: <User className="w-2.5 h-2.5" />,
    mood: <Heart className="w-2.5 h-2.5" />,
    modality: <Brain className="w-2.5 h-2.5" />,
    engagementLevel: <Activity className="w-2.5 h-2.5" />,
    siHiStatus: <Shield className="w-2.5 h-2.5" />,
    safetyPlanStatus: <Shield className="w-2.5 h-2.5" />,
    interventions: <Zap className="w-2.5 h-2.5" />,
    plan: <Target className="w-2.5 h-2.5" />,
    presentingConcern: <BookOpen className="w-2.5 h-2.5" />,
  };
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${colors[signal.confidence]}`}>
      {icons[signal.field] ?? <CheckCircle className="w-2.5 h-2.5" />}
      <span className="font-semibold">{signal.label}:</span>
      <span className="truncate max-w-[120px]">{signal.value}</span>
    </div>
  );
}

function PatientContextCard({ patient, suggestedTopicIds, onTopicSuggest }: {
  patient: Patient;
  suggestedTopicIds: string[];
  onTopicSuggest: (id: string) => void;
}) {
  const admitDate = new Date(patient.admitDate);
  const today = new Date('2026-07-22');
  const daysIn = Math.round((today.getTime() - admitDate.getTime()) / (1000 * 60 * 60 * 24));
  const lastNote = [...patient.notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const activeGoals = patient.goals.filter(g => g.status === 'In Progress');
  const highFlags = patient.flags.filter(f => f.type === 'Risk' || f.type === 'Medical' || f.type === 'Behavioral' || f.type === 'Psychiatric');

  const suggestedTopics = suggestedTopicIds.slice(0, 3).map(id => getTopicById(id)).filter(Boolean);

  return (
    <div className="bg-gradient-to-r from-navy/5 to-sunrise-blue/5 border border-navy/10 rounded-xl p-3 space-y-2.5">
      {/* Header row */}
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold flex-none">
          {patient.firstName[0]}{patient.lastName[0]}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-navy text-sm">{patient.firstName} {patient.lastName}</span>
            <span className="text-[10px] text-slate">{patient.mrn}</span>
            {highFlags.length > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full border border-red-200">
                <AlertTriangle className="w-2.5 h-2.5" /> {highFlags[0].type}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate mt-0.5 leading-tight">
            {patient.primaryDiagnosis}
            {patient.coOccurring.length > 0 && <span className="text-slate-400"> + {patient.coOccurring.join(', ')}</span>}
          </div>
        </div>
        <div className="ml-auto text-right flex-none">
          <div className="text-[10px] text-slate">Day {daysIn}</div>
          <div className="text-[10px] font-semibold text-navy">{patient.program}</div>
        </div>
      </div>

      {/* Vitals strip */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'Mood', value: `${patient.mood}/10`, color: patient.mood >= 6 ? 'text-green-600' : patient.mood >= 4 ? 'text-amber-500' : 'text-red-500' },
          { label: 'Craving', value: `${patient.craving}/10`, color: patient.craving <= 3 ? 'text-green-600' : patient.craving <= 6 ? 'text-amber-500' : 'text-red-500' },
          { label: 'Recovery', value: `${patient.recoveryScore}%`, color: patient.recoveryScore >= 70 ? 'text-green-600' : patient.recoveryScore >= 50 ? 'text-amber-500' : 'text-red-500' },
          { label: 'AMA Risk', value: patient.amaRisk, color: patient.amaRisk === 'Low' ? 'text-green-600' : patient.amaRisk === 'Med' ? 'text-amber-500' : 'text-red-500' },
        ].map(item => (
          <div key={item.label} className="bg-white/70 rounded-lg py-1.5 px-1">
            <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wide">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Active goals */}
      {activeGoals.length > 0 && (
        <div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Goals</div>
          <div className="space-y-1">
            {activeGoals.slice(0, 2).map(goal => (
              <div key={goal.id} className="flex items-start gap-1.5 text-[11px]">
                <Target className="w-3 h-3 text-sunrise-blue flex-none mt-0.5" />
                <span className="text-navy font-medium leading-tight">{goal.shortTerm}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last note */}
      {lastNote && (
        <div className="flex items-center gap-2 text-[10px] text-slate border-t border-navy/10 pt-2">
          <Clock className="w-3 h-3" />
          <span>Last note: <strong>{lastNote.format}</strong> · {lastNote.date.slice(0, 10)} · {lastNote.author.split(',')[0]}</span>
        </div>
      )}

      {/* Suggested topics from goals */}
      {suggestedTopics.length > 0 && (
        <div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <Flame className="w-2.5 h-2.5 text-orange" /> Suggested based on active goals
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedTopics.map(topic => topic && (
              <button
                key={topic.id}
                onClick={() => onTopicSuggest(topic.id)}
                className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-orange/10 text-orange border border-orange/20 hover:bg-orange/20 transition-colors"
              >
                {topic.emoji} {topic.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NoteIntelligencePanel({
  format, onFormatChange, patientId, noteType, staffTitle, values, onValuesChange, fields,
}: Props) {
  const patient = MOCK_PATIENTS.find(p => p.id === patientId) ?? null;
  const [captureText, setCaptureText] = useState('');
  const [parsedSignals, setParsedSignals] = useState<ParsedSignal[]>([]);
  const [parsedInput, setParsedInput] = useState<Partial<ProgressNoteInput>>({});
  const [parseScore, setParseScore] = useState(0);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [aiInput, setAiInput] = useState<Partial<ProgressNoteInput>>({});
  const [generated, setGenerated] = useState(false);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [showFineTools, setShowFineTools] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Format suggestion
  const formatSuggestion = staffTitle ? suggestFormat(staffTitle) : null;

  // Goal-based topic suggestions
  const suggestedTopicIds = patient ? getTopicSuggestionsFromGoals(patient.goals) : [];

  // Quality score
  const quality = scoreNoteQuality(values);

  // Auto-apply format suggestion on mount
  useEffect(() => {
    if (formatSuggestion && !generated) {
      onFormatChange(formatSuggestion.format as NoteFormat);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffTitle]);

  // Debounced parse of quick capture
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!captureText.trim()) {
      setParsedSignals([]);
      setParsedInput({});
      setParseScore(0);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const result = parseQuickCapture(captureText);
      setParsedSignals(result.signals);
      setParsedInput(result.input);
      setParseScore(result.parseScore);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [captureText]);

  const applyInputAndGenerate = useCallback((input: Partial<ProgressNoteInput>) => {
    const sects = generateProgressNote(format, {
      clientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Client',
      noteType,
      ...input,
      engagementLevel: input.engagementLevel as ProgressNoteInput['engagementLevel'],
    });
    const sectValues = Object.values(sects);
    const newValues: Record<string, string> = {};
    fields.forEach((f, i) => { if (sectValues[i]) newValues[f] = sectValues[i]; });
    onValuesChange(newValues);
    setGenerated(true);
    setShowFineTools(false);
  }, [format, patient, noteType, fields, onValuesChange]);

  function handleQuickCaptureFill() {
    if (!parsedInput || Object.keys(parsedInput).length === 0) return;
    applyInputAndGenerate(parsedInput);
  }

  function handleTopicSelect(topicId: string) {
    const topic = getTopicById(topicId);
    if (!topic) return;
    setSelectedTopicId(topicId);
    const merged = { ...topic.input } as Partial<ProgressNoteInput>;
    setAiInput(merged);
    applyInputAndGenerate(merged);
    setShowTopicPicker(false);
  }

  function handleReset() {
    setCaptureText('');
    setParsedSignals([]);
    setParsedInput({});
    setParseScore(0);
    setSelectedTopicId(null);
    setAiInput({});
    setGenerated(false);
    onValuesChange({});
  }

  const hasContent = Object.values(values).some(v => v.length > 0);
  const canGenerateFromCapture = parsedSignals.length >= 2;

  return (
    <div className="mb-5 rounded-xl border border-teal-200 bg-gradient-to-b from-teal-50/60 to-white overflow-hidden">

      {/* ── Panel header ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-teal-200 bg-teal-50/80">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center flex-none">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-teal-900">AI Note Intelligence</div>
          <div className="text-[10px] text-teal-600">Describe the session or pick a topic — note fills automatically</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowRecorder(true)}
            className="flex items-center gap-1 text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-100 hover:bg-teal-200 border border-teal-300 px-2 py-1 rounded-lg transition-colors"
            title="Record session audio → auto-generate note"
          >
            <Mic className="w-3 h-3" /> Record
          </button>
          {hasContent && (
            <button onClick={handleReset} className="flex items-center gap-1 text-[10px] font-semibold text-slate hover:text-red-500 transition-colors">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
          {/* Format selector with suggestion */}
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1">
              {(['BIRP', 'DAP', 'SOAP', 'GIRP'] as NoteFormat[]).map(f => (
                <button
                  key={f}
                  onClick={() => { onFormatChange(f); setGenerated(false); }}
                  title={formatSuggestion?.format === f ? formatSuggestion.reason : undefined}
                  className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${
                    format === f
                      ? 'bg-teal-600 text-white border-teal-600'
                      : formatSuggestion?.format === f
                        ? 'bg-white text-teal-700 border-teal-300 hover:border-teal-500'
                        : 'bg-white text-slate border-border hover:border-slate-300'
                  }`}
                >
                  {f}
                  {formatSuggestion?.format === f && format !== f && <span className="ml-0.5 text-[8px]">★</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* ── Patient Intelligence Card ── */}
        {patient ? (
          <PatientContextCard
            patient={patient}
            suggestedTopicIds={suggestedTopicIds}
            onTopicSuggest={handleTopicSelect}
          />
        ) : (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <AlertTriangle className="w-4 h-4 flex-none" />
            Select a patient above to unlock AI context and suggestions.
          </div>
        )}

        {/* ── Quick Capture ── */}
        <div className="bg-white border border-teal-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-teal-600 to-teal-700">
            <Zap className="w-3.5 h-3.5 text-white flex-none" />
            <span className="text-xs font-bold text-white">Quick Capture</span>
            <span className="text-[10px] text-teal-200 ml-1">Type what happened — AI structures the note</span>
          </div>
          <div className="p-3">
            <textarea
              value={captureText}
              onChange={e => { setCaptureText(e.target.value); setGenerated(false); }}
              placeholder={patient
                ? `e.g. "${patient.firstName} came in anxious, we used CBT to work on craving triggers. They were receptive and engaged. Denied SI/HI. Safety plan intact. Plan to continue weekly sessions."`
                : 'e.g. "Client was tearful, we explored shame and guilt using CBT. They were engaged and showed good insight. Denied SI. Plan to continue weekly individual sessions."'}
              rows={3}
              className="w-full text-sm bg-bg border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-teal-400 placeholder:text-slate-300 leading-relaxed"
            />

            {/* Parsed signals */}
            {parsedSignals.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Brain className="w-3 h-3 text-teal-600" />
                  <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wide">Detected from your description</span>
                  <span className="text-[10px] text-teal-500 ml-auto">{parseScore}% parsed</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {parsedSignals.map((s, i) => <SignalChip key={i} signal={s} />)}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleQuickCaptureFill}
                disabled={!patient || !canGenerateFromCapture}
                className="flex items-center gap-1.5 bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {canGenerateFromCapture ? 'Generate Note from Description' : 'Type more to enable…'}
              </button>
              {captureText && !canGenerateFromCapture && (
                <span className="text-[10px] text-slate-400">Add modality, outcome, or safety info</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Topic Picker ── */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setShowTopicPicker(o => !o)}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors text-left"
          >
            <BookOpen className="w-4 h-4 text-slate" />
            <span className="text-xs font-semibold text-navy">
              {selectedTopicId ? `Topic: ${getTopicById(selectedTopicId)?.label}` : 'Browse 46 Clinical Topics'}
            </span>
            <span className="ml-auto text-[10px] text-slate">
              {showTopicPicker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>
          {showTopicPicker && (
            <div className="border-t border-border bg-white p-3">
              <TopicPicker
                staffTitle={staffTitle}
                selectedId={selectedTopicId}
                onSelect={id => { if (patient) handleTopicSelect(id); }}
                onClear={() => { setSelectedTopicId(null); setAiInput({}); }}
              />
              {!patient && (
                <div className="mt-2 text-[10px] text-amber-600 font-semibold">
                  Select a patient above before choosing a topic.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Fine-tune (manual) ── */}
        <details className="group border border-border rounded-xl overflow-hidden" open={showFineTools}>
          <summary
            onClick={e => { e.preventDefault(); setShowFineTools(o => !o); }}
            className="flex items-center gap-2 px-3 py-2.5 bg-white cursor-pointer select-none hover:bg-slate-50 transition-colors"
          >
            <PenTool className="w-4 h-4 text-slate" />
            <span className="text-xs font-semibold text-navy">Fine-tune fields manually</span>
            <span className="ml-auto">{showFineTools ? <ChevronUp className="w-3.5 h-3.5 text-slate" /> : <ChevronDown className="w-3.5 h-3.5 text-slate" />}</span>
          </summary>
          {showFineTools && (
            <div className="border-t border-border bg-white p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate uppercase tracking-wide mb-0.5">Presentation / Affect</label>
                  <input type="text" value={(aiInput.presentation as string) ?? ''} onChange={e => setAiInput(p => ({ ...p, presentation: e.target.value }))}
                    placeholder="e.g. calm and cooperative" className="w-full bg-bg border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate uppercase tracking-wide mb-0.5">Mood</label>
                  <input type="text" value={(aiInput.mood as string) ?? ''} onChange={e => setAiInput(p => ({ ...p, mood: e.target.value }))}
                    placeholder="e.g. anxious, euthymic" className="w-full bg-bg border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate uppercase tracking-wide mb-0.5">Engagement Level</label>
                  <select value={aiInput.engagementLevel ?? ''} onChange={e => setAiInput(p => ({ ...p, engagementLevel: e.target.value as ProgressNoteInput['engagementLevel'] }))}
                    className="w-full bg-bg border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-teal-400">
                    <option value="">Select…</option>
                    {['Active', 'Moderate', 'Passive', 'Minimal'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate uppercase tracking-wide mb-0.5">SI/HI Status</label>
                  <input type="text" value={(aiInput.siHiStatus as string) ?? ''} onChange={e => setAiInput(p => ({ ...p, siHiStatus: e.target.value }))}
                    placeholder="None / Passive / Active…" className="w-full bg-bg border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-teal-400" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate uppercase tracking-wide mb-0.5">Presenting Concern</label>
                <textarea rows={2} value={(aiInput.presentingConcern as string) ?? ''} onChange={e => setAiInput(p => ({ ...p, presentingConcern: e.target.value }))}
                  placeholder="What the client brought to session…" className="w-full bg-bg border border-border rounded px-2 py-1.5 text-xs resize-none focus:outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate uppercase tracking-wide mb-0.5">Primary Modality</label>
                <input type="text" value={(aiInput.modality as string) ?? ''} onChange={e => setAiInput(p => ({ ...p, modality: e.target.value }))}
                  placeholder="e.g. Motivational Interviewing, CBT, DBT" className="w-full bg-bg border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate uppercase tracking-wide mb-0.5">Interventions Used</label>
                <textarea rows={2} value={(aiInput.interventions as string) ?? ''} onChange={e => setAiInput(p => ({ ...p, interventions: e.target.value }))}
                  placeholder="List interventions…" className="w-full bg-bg border border-border rounded px-2 py-1.5 text-xs resize-none focus:outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate uppercase tracking-wide mb-0.5">Plan</label>
                <textarea rows={2} value={(aiInput.plan as string) ?? ''} onChange={e => setAiInput(p => ({ ...p, plan: e.target.value }))}
                  placeholder="Next session plan, homework, follow-up…" className="w-full bg-bg border border-border rounded px-2 py-1.5 text-xs resize-none focus:outline-none focus:border-teal-400" />
              </div>
              <button
                onClick={() => applyInputAndGenerate(aiInput)}
                disabled={!patient}
                className="flex items-center gap-2 bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-40 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Generate from Fields
              </button>
            </div>
          )}
        </details>

        {/* ── Session Recorder Modal ── */}
        <SessionRecorderModal
          isOpen={showRecorder}
          onClose={() => setShowRecorder(false)}
          format={format}
          patientName={patient ? `${patient.firstName} ${patient.lastName}` : 'Client'}
          noteType={noteType}
          fields={fields}
          onGenerate={(newValues) => {
            onValuesChange(newValues);
            setGenerated(true);
            setShowRecorder(false);
          }}
        />

        {/* ── Quality Score ── */}
        {hasContent && <QualityBar quality={quality} />}

        {/* ── Post-generation actions ── */}
        {generated && quality.score >= 40 && (
          <div className="border border-green-200 bg-green-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <CheckCircle className="w-4 h-4 text-green-600 flex-none" />
              <span className="text-xs font-bold text-green-800">Note drafted — review each section before signing</span>
            </div>
            <div className="text-[10px] text-green-700 mb-2">Suggested next steps based on this note:</div>
            <div className="flex flex-wrap gap-2">
              <PostActionButton icon={<PenTool className="w-3 h-3" />} label="Sign & Submit" color="green" />
              <PostActionButton icon={<ArrowRight className="w-3 h-3" />} label="Submit for Co-sign" color="blue" />
              {patient && patient.goals.some(g => g.status === 'In Progress') && (
                <PostActionButton icon={<TrendingUp className="w-3 h-3" />} label="Update goal status" color="teal" />
              )}
              {patient && patient.flags.some(f => f.type === 'Risk') && (
                <PostActionButton icon={<Shield className="w-3 h-3" />} label="Flag for supervisor" color="amber" />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function PostActionButton({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    teal: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  };
  return (
    <button className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${colorMap[color]}`}>
      {icon} {label}
    </button>
  );
}
