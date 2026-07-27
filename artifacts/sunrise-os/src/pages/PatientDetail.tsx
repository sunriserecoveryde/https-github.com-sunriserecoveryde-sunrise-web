import React, { useState } from 'react';
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
  AlertCircle, Clock, Upload, Download, ClipboardList, Plus, Eye
} from 'lucide-react';
import { Screen } from '../App';
import { LockedButton } from '../components/common/LockedButton';

export function PatientDetail({ patientId, navigate, readOnly }: { patientId: string | null; navigate: (s: Screen, id?: string) => void; readOnly?: boolean }) {
  const patient = MOCK_PATIENTS.find(p => p.id === patientId) || MOCK_PATIENTS[0];
  const [activeTab, setActiveTab] = useState('Overview');
  const [isComposingNote, setIsComposingNote] = useState(false);
  const [noteFormat, setNoteFormat] = useState('BIRP');
  const [noteContent, setNoteContent] = useState('');
  const [noteTypeFilter, setNoteTypeFilter] = useState<string>('All');
  const [noteIsDirty, setNoteIsDirty] = useState(false);

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
            <div className={`flex-col h-full ${isComposingNote ? 'w-1/3' : 'w-full'}`}>
              {/* Title row + New Note button */}
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-navy">
                  Progress Notes
                  {noteTypeFilter !== 'All' && (
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      ({patient.notes.filter(n => n.type === noteTypeFilter).length} of {patient.notes.length})
                    </span>
                  )}
                </h2>
                {!isComposingNote && (
                  <LockedButton locked={readOnly} onClick={() => { setIsComposingNote(true); setNoteIsDirty(false); }} className="bg-sunrise-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-sunrise-blue-light transition-colors">
                    + New Note
                  </LockedButton>
                )}
              </div>

              {/* Filter pills */}
              {!isComposingNote && (() => {
                const types = Array.from(new Set(patient.notes.map(n => n.type)));
                return types.length > 1 ? (
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {(['All', ...types] as string[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setNoteTypeFilter(t)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border ${
                          noteTypeFilter === t
                            ? 'bg-navy text-white border-navy'
                            : 'bg-white text-slate border-slate-200 hover:border-navy/40 hover:text-navy'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}

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
            </div>

            {isComposingNote && (
              <div className="w-2/3 border border-border rounded-lg flex flex-col overflow-hidden shadow-sm">
                <div className="bg-bg p-4 border-b border-border flex justify-between items-center">
                  <h3 className="font-bold text-navy">Compose Note</h3>
                  <div className="flex gap-2">
                    <select value={noteFormat} onChange={e => setNoteFormat(e.target.value)} className="border border-border rounded px-2 py-1 text-sm text-slate focus:outline-none">
                      <option value="BIRP">BIRP Format</option>
                      <option value="DAP">DAP Format</option>
                      <option value="Free Text">Free Text</option>
                    </select>
                    <button onClick={() => setIsComposingNote(false)} className="text-slate hover:text-navy px-2 py-1">Cancel</button>
                  </div>
                </div>
                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 p-4 overflow-y-auto space-y-4" onInput={() => setNoteIsDirty(true)}>
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
                  </div>
                  <div className="w-64 border-l border-border bg-bg p-4 flex flex-col">
                    <CustomButtons onInsert={handleQuickInsert} />
                  </div>
                </div>
                <div className="bg-bg border-t border-border p-4 flex justify-between items-center">
                  <div className="text-xs text-slate">Auto-saved at {new Date().toLocaleTimeString()}</div>
                  <div className="flex gap-2">
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
                    >
                      Sign & Lock
                    </LockedButton>
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
