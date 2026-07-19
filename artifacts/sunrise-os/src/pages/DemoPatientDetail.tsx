import React, { useState, useRef, useEffect } from 'react';
import { DEMO_PATIENTS } from '../data/mockPatients';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { FlagBadge } from '../components/ui/FlagBadge';
import { AcuityBadge } from '../components/ui/AcuityBadge';
import { RecoveryScoreBadge } from '../components/ui/RecoveryScoreBadge';
import { getPatientVitals } from '../data/mockVitals';
import { getPatientMedications } from '../data/mockMedications';
import {
  ArrowLeft, Activity, FileText, CheckCircle2, FlaskConical,
  AlertCircle, Clock, Shield, CalendarDays, Heart, Pill, ChevronDown,
} from 'lucide-react';
import { Screen } from '../App';

/**
 * Booking URL for the demo CTA footer.
 * Set VITE_DEMO_BOOKING_URL in your .env file to point to your scheduling page
 * (e.g. a Calendly link, HubSpot Meetings URL, etc.).
 * Falls back to a mailto link if the variable is not set.
 */
const DEMO_BOOKING_URL =
  import.meta.env.VITE_DEMO_BOOKING_URL ||
  'mailto:demo@sunrisehealth.com?subject=Schedule%20a%20Live%20Demo';

interface Props {
  patientId: string | null;
  navigate: (s: Screen, id?: string) => void;
  /** The screen to return to when the buyer clicks Back */
  returnTo?: Screen;
}

export function DemoPatientDetail({ patientId, navigate, returnTo = 'Dashboard' }: Props) {
  const currentIndex = DEMO_PATIENTS.findIndex(p => p.id === patientId);
  const patient = currentIndex >= 0 ? DEMO_PATIENTS[currentIndex] : DEMO_PATIENTS[0];
  const prevPatient = currentIndex > 0 ? DEMO_PATIENTS[currentIndex - 1] : null;
  const nextPatient = currentIndex < DEMO_PATIENTS.length - 1 ? DEMO_PATIENTS[currentIndex + 1] : null;
  const [activeTab, setActiveTab] = useState('Overview');
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pickerOpen]);

  function goToPatient(id: string) {
    setActiveTab('Overview');
    setPickerOpen(false);
    navigate('DemoPatientDetail', id);
  }

  const programColors: Record<string, string> = {
    Residential: 'bg-violet-100 text-violet-700',
    PHP:         'bg-blue-100 text-blue-700',
    IOP:         'bg-teal-100 text-teal-700',
    OP:          'bg-green-100 text-green-700',
  };

  const vitals = getPatientVitals(patient.id);
  const medications = getPatientMedications(patient.id);

  const tabs = [
    { id: 'Overview',         icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'ASAM Assessment',  icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'Progress Notes',   icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'Treatment Plan',   icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { id: 'Vitals',           icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'Medications',      icon: <Pill className="w-3.5 h-3.5" /> },
  ];

  // ASAM dimension labels
  const asamDims = [
    { d: 1, label: 'Acute Intoxication & Withdrawal Potential',        score: patient.asam.d1, text: 'Patient indicates moderate to severe withdrawal potential requiring medical monitoring and symptom-triggered medication.' },
    { d: 2, label: 'Biomedical Conditions & Complications',             score: patient.asam.d2, text: 'Biomedical conditions noted. Routine monitoring in place. Any acute issues are being managed by the medical team.' },
    { d: 3, label: 'Emotional, Behavioral & Cognitive Conditions',      score: patient.asam.d3, text: 'Significant emotional instability with co-occurring psychiatric diagnoses. Symptoms are currently interfering with engagement in recovery activities.' },
    { d: 4, label: 'Readiness to Change',                              score: patient.asam.d4, text: 'Patient exhibits mixed motivation. Internal motivation is currently low to moderate; external drivers (family, legal) are present.' },
    { d: 5, label: 'Relapse, Continued Use & Continued Problem Potential', score: patient.asam.d5, text: 'High risk of relapse without a structured environment. Previous outpatient attempts have been unsuccessful.' },
    { d: 6, label: 'Recovery & Living Environment',                    score: patient.asam.d6, text: 'Current living environment has limited recovery support. Substance use is prevalent in immediate social network.' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-var(--topbar-height)-var(--banner-height)-48px)]">

      {/* Demo mode sticky banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-xs font-semibold flex-shrink-0 rounded-t-lg">
        <FlaskConical className="w-3.5 h-3.5 shrink-0" />
        <span>Demo</span>
        <span className="opacity-60">·</span>
        <span className="font-normal opacity-90">Anonymized</span>
        <span className="opacity-60">·</span>
        <span className="font-normal opacity-90">Not real patient data</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 opacity-70" />
          <span className="font-normal opacity-80">All actions are disabled in demo mode</span>
        </div>
      </div>

      {/* Prev / Next patient navigation */}
      <div className="flex items-center justify-between px-4 py-2 bg-violet-50 border-x border-violet-100 flex-shrink-0">
        <button
          onClick={() => prevPatient && goToPatient(prevPatient.id)}
          disabled={!prevPatient}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            prevPatient
              ? 'text-violet-700 hover:text-violet-900'
              : 'text-violet-300 cursor-default'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {prevPatient ? `Patient ${prevPatient.lastName}` : 'First patient'}
        </button>
        {/* Patient picker dropdown */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setPickerOpen(o => !o)}
            className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-900 transition-colors px-2 py-1 rounded hover:bg-violet-100"
          >
            {currentIndex + 1} of {DEMO_PATIENTS.length}
            <ChevronDown className={`w-3 h-3 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
          </button>

          {pickerOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 bg-white border border-violet-200 rounded-lg shadow-lg py-1 min-w-[200px]">
              {DEMO_PATIENTS.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => goToPatient(p.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-violet-50 transition-colors ${
                    p.id === patient.id ? 'bg-violet-50' : ''
                  }`}
                >
                  <span className="text-xs text-violet-400 font-medium w-4 shrink-0">{i + 1}</span>
                  <span className="text-sm font-semibold text-navy flex-1">
                    Patient {p.lastName}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold shrink-0 ${programColors[p.program] ?? 'bg-slate-100 text-slate'}`}>
                    {p.program}
                  </span>
                  {p.id === patient.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => nextPatient && goToPatient(nextPatient.id)}
          disabled={!nextPatient}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            nextPatient
              ? 'text-violet-700 hover:text-violet-900'
              : 'text-violet-300 cursor-default'
          }`}
        >
          {nextPatient ? `Patient ${nextPatient.lastName}` : 'Last patient'}
          <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-navy to-navy-mid p-6 text-white shadow-sm flex-shrink-0">
        <button
          onClick={() => navigate(returnTo)}
          className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-5">
            <PatientAvatar first={patient.firstName} last={patient.lastName} program={patient.program} size="xl" />
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold">{patient.firstName} {patient.lastName}</h1>
                <AcuityBadge acuity={patient.amaRisk === 'High' ? 'Critical' : patient.amaRisk === 'Med' ? 'High' : 'Routine'} />
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded font-semibold border border-white/10">{patient.program}</span>
                <span className="bg-violet-500/40 text-violet-200 text-xs px-2 py-0.5 rounded font-semibold border border-violet-400/30">Demo · Anonymized</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-300 font-medium">
                <span>{patient.mrn}</span>
                <span>•</span>
                <span>DOB: {patient.dob} ({patient.age}y)</span>
                <span>•</span>
                <span>Admitted: {patient.admitDate} (LOS: {patient.los}d)</span>
                <span>•</span>
                <span>Counselor: {patient.counselor}</span>
              </div>
              <div className="flex gap-2 mt-3">
                {patient.flags.map((f, i) => <FlagBadge key={i} type={f.type} note={f.note} size="md" />)}
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
        {/* Locked tabs hint */}
        <div className="ml-auto flex items-center gap-1.5 px-3 text-xs text-violet-500 font-medium">
          <FlaskConical className="w-3 h-3" />
          <span>Demo view</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white border-x border-b border-border rounded-b-lg p-6 overflow-y-auto no-scrollbar">

        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <div className="space-y-8">
            {/* KPI row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Current Mood',  value: `${patient.mood}/10`,   color: patient.mood >= 6 ? 'text-success' : patient.mood >= 4 ? 'text-sunrise-amber' : 'text-critical' },
                { label: 'Cravings',       value: `${patient.craving}/10`, color: patient.craving >= 7 ? 'text-critical' : patient.craving >= 4 ? 'text-sunrise-amber' : 'text-success' },
                { label: 'Last UA',        value: patient.lastUa,          color: patient.lastUa === 'Negative' ? 'text-success' : 'text-critical' },
                { label: 'Next Appt',     value: patient.nextAppointment, color: 'text-navy' },
              ].map(card => (
                <div key={card.label} className="bg-bg border border-border p-4 rounded-lg">
                  <div className="text-slate-light text-xs font-semibold uppercase tracking-wider mb-1">{card.label}</div>
                  <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ASAM summary */}
              <div>
                <h3 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sunrise-blue" /> ASAM Dimensions Summary
                </h3>
                <div className="space-y-3">
                  {asamDims.map(dim => (
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

              {/* Recent notes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sunrise-blue" /> Recent Notes
                  </h3>
                </div>
                {patient.notes.length > 0 ? (
                  <div className="space-y-4">
                    {patient.notes.slice(0, 3).map(note => (
                      <div key={note.id} className="border border-border p-4 rounded-lg bg-bg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold text-navy">{note.type} Note</div>
                          <div className="text-xs text-slate">{note.date}</div>
                        </div>
                        <p className="text-sm text-slate-light mb-2 line-clamp-3">{note.content}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium text-slate">By: {note.author}</div>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${note.status === 'Signed' ? 'bg-success/10 text-success' : 'bg-sunrise-amber/10 text-sunrise-amber'}`}>
                            {note.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-bg rounded-lg border border-dashed border-border text-slate">No recent notes.</div>
                )}
              </div>
            </div>

            {/* Co-occurring & info strip */}
            <div className="bg-bg border border-border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Primary Diagnosis</div>
                <div className="font-medium text-navy">{patient.primaryDiagnosis}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Co-occurring</div>
                <div className="font-medium text-navy">{patient.coOccurring.length > 0 ? patient.coOccurring.join(', ') : '—'}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Insurance</div>
                <div className="font-medium text-navy">{patient.insurance}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">AMA Risk</div>
                <div className={`font-bold ${patient.amaRisk === 'High' ? 'text-critical' : patient.amaRisk === 'Med' ? 'text-sunrise-amber' : 'text-success'}`}>{patient.amaRisk}</div>
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
              <div className="text-2xl font-bold text-sunrise-blue bg-white px-4 py-2 rounded shadow-sm">
                {patient.program === 'Residential' ? 'Residential (3.7)' : patient.program === 'PHP' ? 'PHP (2.5)' : patient.program === 'IOP' ? 'IOP (2.1)' : 'OP (1.0)'}
              </div>
            </div>

            {asamDims.map(dim => (
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
                  <p className="text-sm text-slate bg-bg border border-border rounded p-3 min-h-[80px]">{dim.text}</p>
                  <div className="flex gap-4 mt-3">
                    <label className="flex items-center gap-2 text-sm text-slate cursor-default">
                      <input type="checkbox" checked={dim.score >= 3} readOnly className="rounded" /> Immediate Risk
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate cursor-default">
                      <input type="checkbox" checked={dim.score > 0} readOnly className="rounded" /> Service Required
                    </label>
                  </div>
                </div>
              </div>
            ))}

            {/* Read-only notice */}
            <div className="flex items-center gap-2.5 bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 text-sm text-violet-700">
              <FlaskConical className="w-4 h-4 shrink-0" />
              <span>ASAM entries are read-only in demo mode. Clinical staff can edit and sign assessments in a live environment.</span>
            </div>
          </div>
        )}

        {/* ── PROGRESS NOTES ── */}
        {activeTab === 'Progress Notes' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-navy">Progress Notes</h2>
              {/* Disabled compose button */}
              <div className="relative group">
                <button
                  disabled
                  className="flex items-center gap-2 bg-slate-100 text-slate px-4 py-2 rounded text-sm font-medium cursor-not-allowed opacity-60"
                >
                  + New Note
                </button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-navy text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  Note authoring is disabled in demo mode
                </div>
              </div>
            </div>

            {patient.notes.length > 0 ? (
              <div className="space-y-4">
                {patient.notes.map(note => (
                  <div key={note.id} className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-bg px-4 py-3 border-b border-border flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-navy">{note.type} Note</span>
                        <span className="text-xs bg-slate-100 text-slate px-2 py-0.5 rounded font-medium">{note.format}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${note.status === 'Signed' ? 'bg-success/10 text-success' : 'bg-sunrise-amber/10 text-sunrise-amber'}`}>
                          {note.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {note.date}</span>
                        <span>{note.author}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-slate leading-relaxed">{note.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 bg-bg rounded-lg border border-dashed border-border">
                <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <div className="text-slate font-medium">No progress notes yet</div>
                <div className="text-sm text-slate-light mt-1">Notes authored by clinical staff appear here once signed.</div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2.5 bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 text-sm text-violet-700">
              <FlaskConical className="w-4 h-4 shrink-0" />
              <span>Note authoring, co-signing, and editing are disabled in demo mode. Full BIRP / DAP / Free-text workflows are available in a live environment.</span>
            </div>
          </div>
        )}

        {/* ── TREATMENT PLAN ── */}
        {activeTab === 'Treatment Plan' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-navy">Master Treatment Plan</h2>
              <div className="relative group">
                <button
                  disabled
                  className="flex items-center gap-2 bg-slate-100 text-slate px-4 py-2 rounded text-sm font-medium cursor-not-allowed opacity-60"
                >
                  + Add Goal
                </button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-navy text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  Goal editing is disabled in demo mode
                </div>
              </div>
            </div>

            {patient.goals.length > 0 ? (
              <div className="space-y-4">
                {patient.goals.map(goal => (
                  <div key={goal.id} className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-bg px-4 py-3 border-b border-border flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-navy">{goal.category}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          goal.status === 'Met' ? 'bg-success/10 text-success' :
                          goal.status === 'In Progress' ? 'bg-sunrise-blue/10 text-sunrise-blue' :
                          'bg-slate-100 text-slate'
                        }`}>
                          {goal.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate">Target: {goal.targetDate}</div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Problem Statement</div>
                        <p className="text-sm text-navy">{goal.problem}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Long-Term Goal</div>
                          <p className="text-sm text-slate">{goal.longTerm}</p>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Short-Term Objective</div>
                          <p className="text-sm text-slate">{goal.shortTerm}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 bg-bg rounded-lg border border-dashed border-border">
                <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <div className="text-slate font-medium">No treatment goals yet</div>
                <div className="text-sm text-slate-light mt-1">Goals are added during the Master Treatment Plan meeting.</div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2.5 bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 text-sm text-violet-700">
              <FlaskConical className="w-4 h-4 shrink-0" />
              <span>Goal creation, editing, and status updates are disabled in demo mode. Counselors can manage the full MTP in a live environment.</span>
            </div>
          </div>
        )}

        {/* ── VITALS ── */}
        {activeTab === 'Vitals' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Heart className="w-5 h-5 text-sunrise-blue" /> Vital Signs &amp; Withdrawal Scores
              </h2>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg border-b border-border text-xs font-semibold text-slate uppercase tracking-wider">
                    <th className="px-3 py-3 text-left">Date</th>
                    <th className="px-3 py-3 text-left">Time</th>
                    <th className="px-3 py-3 text-left">BP</th>
                    <th className="px-3 py-3 text-center">HR</th>
                    <th className="px-3 py-3 text-center">Temp (°F)</th>
                    <th className="px-3 py-3 text-center">O₂ Sat</th>
                    <th className="px-3 py-3 text-center">RR</th>
                    <th className="px-3 py-3 text-center">Wt (lb)</th>
                    <th className="px-3 py-3 text-center">COWS</th>
                    <th className="px-3 py-3 text-center">CIWA</th>
                    <th className="px-3 py-3 text-center">Pain</th>
                    <th className="px-3 py-3 text-left">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vitals.map((v, i) => (
                    <tr key={v.id} className={i % 2 === 0 ? 'bg-white' : 'bg-bg'}>
                      <td className="px-3 py-3 font-medium text-navy whitespace-nowrap">{v.date}</td>
                      <td className="px-3 py-3 text-slate whitespace-nowrap">{v.time}</td>
                      <td className="px-3 py-3 font-semibold text-navy whitespace-nowrap">{v.bp}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-semibold ${v.hr > 100 ? 'text-critical' : v.hr > 90 ? 'text-sunrise-amber' : 'text-navy'}`}>{v.hr}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-semibold ${v.temp > 100 ? 'text-critical' : v.temp > 99 ? 'text-sunrise-amber' : 'text-navy'}`}>{v.temp.toFixed(1)}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-semibold ${v.o2 < 95 ? 'text-critical' : v.o2 < 97 ? 'text-sunrise-amber' : 'text-success'}`}>{v.o2}%</span>
                      </td>
                      <td className="px-3 py-3 text-center text-navy">{v.rr}</td>
                      <td className="px-3 py-3 text-center text-slate">{v.weight ?? '—'}</td>
                      <td className="px-3 py-3 text-center">
                        {v.cows != null ? (
                          <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold text-white ${v.cows >= 25 ? 'bg-critical' : v.cows >= 13 ? 'bg-sunrise-amber' : v.cows >= 5 ? 'bg-sunrise-blue' : 'bg-success'}`}>
                            {v.cows}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {v.ciwa != null ? (
                          <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold text-white ${v.ciwa >= 15 ? 'bg-critical' : v.ciwa >= 8 ? 'bg-sunrise-amber' : v.ciwa >= 1 ? 'bg-sunrise-blue' : 'bg-success'}`}>
                            {v.ciwa}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-semibold ${v.pain >= 7 ? 'text-critical' : v.pain >= 4 ? 'text-sunrise-amber' : 'text-success'}`}>{v.pain}/10</span>
                      </td>
                      <td className="px-3 py-3 text-slate whitespace-nowrap">{v.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Score legend */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-bg border border-border rounded-lg p-3">
                <div className="text-xs font-bold text-navy mb-2">COWS Score (Opioid Withdrawal)</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { label: '0–4 Mild', color: 'bg-success' },
                    { label: '5–12 Moderate', color: 'bg-sunrise-blue' },
                    { label: '13–24 Mod-Severe', color: 'bg-sunrise-amber' },
                    { label: '25+ Severe', color: 'bg-critical' },
                  ].map(s => (
                    <span key={s.label} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-sm ${s.color}`} />
                      <span className="text-slate">{s.label}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-bg border border-border rounded-lg p-3">
                <div className="text-xs font-bold text-navy mb-2">CIWA Score (Alcohol Withdrawal)</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { label: '0 None', color: 'bg-success' },
                    { label: '1–7 Mild', color: 'bg-sunrise-blue' },
                    { label: '8–14 Moderate', color: 'bg-sunrise-amber' },
                    { label: '15+ Severe', color: 'bg-critical' },
                  ].map(s => (
                    <span key={s.label} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-sm ${s.color}`} />
                      <span className="text-slate">{s.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2.5 bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 text-sm text-violet-700">
              <FlaskConical className="w-4 h-4 shrink-0" />
              <span>Vital signs are read-only in demo mode. Nurses can enter and trend vitals in a live environment.</span>
            </div>
          </div>
        )}

        {/* ── MEDICATIONS ── */}
        {activeTab === 'Medications' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Pill className="w-5 h-5 text-sunrise-blue" /> Medication Administration Record
              </h2>
            </div>

            {/* Group by class */}
            {(['MAT', 'Psychiatric', 'Medical', 'PRN'] as const).map(cls => {
              const meds = medications.filter(m => m.class === cls);
              if (meds.length === 0) return null;
              const clsColors: Record<string, string> = {
                MAT: 'bg-sunrise-blue/10 text-sunrise-blue border-sunrise-blue/20',
                Psychiatric: 'bg-violet-50 text-violet-700 border-violet-200',
                Medical: 'bg-success/10 text-success border-success/20',
                PRN: 'bg-sunrise-amber/10 text-sunrise-amber border-sunrise-amber/20',
              };
              const clsLabels: Record<string, string> = {
                MAT: 'MAT — Medication-Assisted Treatment',
                Psychiatric: 'Psychiatric',
                Medical: 'Medical / Supportive',
                PRN: 'PRN (As Needed)',
              };
              return (
                <div key={cls} className="mb-6">
                  <div className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border mb-3 ${clsColors[cls]}`}>
                    {clsLabels[cls]}
                  </div>
                  <div className="space-y-3">
                    {meds.map(med => (
                      <div
                        key={med.id}
                        className={`border border-border rounded-lg overflow-hidden ${med.status === 'Discontinued' ? 'opacity-60' : ''}`}
                      >
                        <div className="bg-bg px-4 py-3 border-b border-border flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-navy">{med.name}</span>
                              {med.genericName && (
                                <span className="text-xs text-slate font-medium">({med.genericName})</span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                med.status === 'Active' ? 'bg-success/10 text-success' :
                                med.status === 'On Hold' ? 'bg-sunrise-amber/10 text-sunrise-amber' :
                                'bg-slate-100 text-slate line-through'
                              }`}>
                                {med.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate mt-0.5">{med.indication}</div>
                          </div>
                          <div className="text-xs text-slate text-right shrink-0 ml-4">
                            <div>Start: {med.startDate}</div>
                            {med.dcDate && <div className="text-critical">DC: {med.dcDate}</div>}
                          </div>
                        </div>
                        <div className="px-4 py-3 flex flex-wrap gap-6 text-sm">
                          <div>
                            <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-0.5">Dose</div>
                            <div className="font-medium text-navy">{med.dose}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-0.5">Route</div>
                            <div className="font-medium text-navy">{med.route}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-0.5">Frequency</div>
                            <div className="font-medium text-navy">{med.frequency}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-0.5">Prescriber</div>
                            <div className="font-medium text-navy">{med.prescriber}</div>
                          </div>
                          {med.dcReason && (
                            <div className="w-full">
                              <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-0.5">DC Reason</div>
                              <div className="text-sm text-slate italic">{med.dcReason}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center gap-2.5 bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 text-sm text-violet-700">
              <FlaskConical className="w-4 h-4 shrink-0" />
              <span>Medications are read-only in demo mode. Prescribers can order, discontinue, and administer medications in a live environment.</span>
            </div>
          </div>
        )}

      </div>

      {/* Demo CTA sticky footer */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-3 bg-violet-600 border-x border-b border-violet-700 rounded-b-lg">
        <div className="flex items-center gap-2 text-violet-100 text-sm">
          <CalendarDays className="w-4 h-4 shrink-0 opacity-80" />
          <span>Seen enough? Talk to our team and see Sunrise in your environment.</span>
        </div>
        <a
          href={DEMO_BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-2 bg-white text-violet-700 hover:bg-violet-50 transition-colors text-sm font-semibold px-4 py-1.5 rounded shadow-sm"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Schedule a live demo →
        </a>
      </div>
    </div>
  );
}
