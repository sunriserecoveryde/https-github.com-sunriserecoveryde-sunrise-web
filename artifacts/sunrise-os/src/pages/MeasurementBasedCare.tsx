import React, { useState, useMemo } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, BarChart, Bar, Cell,
} from 'recharts';
import { TrendingDown, TrendingUp, Minus, Activity, AlertTriangle, ChevronRight } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';
import { getRolesWithEditAccess } from '../data/mockRoles';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

// ─── Instrument Definitions ──────────────────────────────────────────────────

const PHQ9_ITEMS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading or watching television',
  'Moving or speaking so slowly that other people could have noticed; or being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself in some way',
];

const GAD7_ITEMS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
];

const PCL5_ITEMS = [
  'Repeated, disturbing, and unwanted memories of the stressful experience',
  'Repeated, disturbing dreams of the stressful experience',
  'Suddenly feeling or acting as if the experience were happening again (flashback)',
  'Feeling very upset when something reminded you of the experience',
  'Having strong physical reactions (e.g., heart pounding, trouble breathing) when reminded',
  'Avoiding memories, thoughts, or feelings related to the experience',
  'Avoiding external reminders of the experience (people, places, conversations, situations)',
  'Trouble remembering important parts of the experience',
  'Having strong negative beliefs about yourself, other people, or the world',
  'Blaming yourself or someone else for what happened',
  'Having strong negative feelings such as fear, horror, anger, guilt, or shame',
  'Loss of interest in activities you used to enjoy',
  'Feeling distant or cut off from other people',
  'Trouble experiencing positive feelings (e.g., not being able to feel happiness or love)',
  'Irritable behavior, angry outbursts, or acting aggressively',
  'Taking too many risks or doing things that could cause you harm',
  'Being "superalert" or watchful or on guard',
  'Feeling jumpy or easily startled',
  'Having difficulty concentrating',
  'Trouble falling or staying asleep',
];

const RESPONSE_LABELS_4 = ['Not at all', 'Several days', 'More than half\nthe days', 'Nearly\nevery day'];
const RESPONSE_LABELS_5 = ['Not at all', 'A little bit', 'Moderately', 'Quite a bit', 'Extremely'];

function phq9Severity(s: number) {
  if (s >= 20) return { label: 'Severe', color: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-500' };
  if (s >= 15) return { label: 'Mod. Severe', color: 'bg-orange-100 text-orange-800 border-orange-300', dot: 'bg-orange-500' };
  if (s >= 10) return { label: 'Moderate', color: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' };
  if (s >= 5)  return { label: 'Mild', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', dot: 'bg-yellow-400' };
  return { label: 'Minimal', color: 'bg-green-100 text-green-800 border-green-300', dot: 'bg-green-500' };
}

function gad7Severity(s: number) {
  if (s >= 15) return { label: 'Severe', color: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-500' };
  if (s >= 10) return { label: 'Moderate', color: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' };
  if (s >= 5)  return { label: 'Mild', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', dot: 'bg-yellow-400' };
  return { label: 'Minimal', color: 'bg-green-100 text-green-800 border-green-300', dot: 'bg-green-500' };
}

function pcl5Severity(s: number) {
  if (s >= 50) return { label: 'Severe PTSD', color: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-500' };
  if (s >= 33) return { label: 'Probable PTSD', color: 'bg-orange-100 text-orange-800 border-orange-300', dot: 'bg-orange-500' };
  return { label: 'Sub-threshold', color: 'bg-green-100 text-green-800 border-green-300', dot: 'bg-green-500' };
}

// ─── Mock Score History ───────────────────────────────────────────────────────

interface ScoreEntry {
  date: string;
  phq9?: number;
  gad7?: number;
  pcl5?: number;
  by: string;
  notes?: string;
}

const MOCK_SCORES: Record<string, ScoreEntry[]> = {
  p1: [
    { date: '2026-06-27', phq9: 18, gad7: 14, by: 'Sarah Jenkins, LPC', notes: 'Intake screen — marked anxiety, hopelessness, poor sleep.' },
    { date: '2026-07-04', phq9: 15, gad7: 12, by: 'Sarah Jenkins, LPC' },
    { date: '2026-07-11', phq9: 13, gad7: 10, by: 'Sarah Jenkins, LPC' },
    { date: '2026-07-18', phq9: 11, gad7: 9,  by: 'Sarah Jenkins, LPC', notes: 'Steady improvement. Item 9 (SI) now 0. Continuing IOP.' },
  ],
  p2: [
    { date: '2026-06-28', phq9: 16, gad7: 17, pcl5: 52, by: 'David Odom, LMFT', notes: 'Intake. Significant PTSD symptom burden — trauma history disclosed.' },
    { date: '2026-07-05', phq9: 14, gad7: 15, pcl5: 48, by: 'David Odom, LMFT' },
    { date: '2026-07-12', phq9: 12, gad7: 13, pcl5: 44, by: 'David Odom, LMFT' },
    { date: '2026-07-19', phq9: 10, gad7: 11, pcl5: 39, by: 'David Odom, LMFT', notes: 'PCL-5 crossing below 40. Discuss trauma-focused therapy transition.' },
  ],
  p3: [
    { date: '2026-07-02', phq9: 13, gad7: 9,  by: 'Sarah Jenkins, LPC' },
    { date: '2026-07-09', phq9: 11, gad7: 8,  by: 'Sarah Jenkins, LPC' },
    { date: '2026-07-16', phq9: 10, gad7: 7,  by: 'Sarah Jenkins, LPC' },
  ],
  p4: [
    { date: '2026-07-01', phq9: 17, gad7: 12, pcl5: 41, by: 'David Odom, LMFT', notes: 'Trauma screen positive. PCL-5 added to routine battery.' },
    { date: '2026-07-08', phq9: 14, gad7: 10, pcl5: 36, by: 'David Odom, LMFT' },
    { date: '2026-07-15', phq9: 12, gad7: 9,  pcl5: 33, by: 'David Odom, LMFT', notes: 'PCL-5 at threshold. Continue EMDR preparation.' },
  ],
  p5: [
    { date: '2026-07-04', phq9: 11, gad7: 14, by: 'Maria Gonzales, LCSW' },
    { date: '2026-07-11', phq9: 9,  gad7: 11, by: 'Maria Gonzales, LCSW' },
    { date: '2026-07-18', phq9: 7,  gad7: 9,  by: 'Maria Gonzales, LCSW', notes: 'PHQ-9 now below moderate threshold. Good progress.' },
  ],
  p6: [
    { date: '2026-07-06', phq9: 12, gad7: 10, by: 'Maria Gonzales, LCSW' },
    { date: '2026-07-13', phq9: 9,  gad7: 8,  by: 'Maria Gonzales, LCSW' },
  ],
  p8: [
    { date: '2026-07-05', phq9: 16, gad7: 18, pcl5: 54, by: 'Dr. Allen Hughes, MD', notes: 'Intake psych eval. Co-occurring ED, PTSD, MDD. High symptom burden.' },
    { date: '2026-07-12', phq9: 15, gad7: 17, pcl5: 51, by: 'Dr. Allen Hughes, MD' },
    { date: '2026-07-19', phq9: 14, gad7: 16, pcl5: 48, by: 'Dr. Allen Hughes, MD', notes: 'Slow improvement. Escitalopram 10mg initiated 7/19. Monitor closely.' },
  ],
};

const NEXT_DUE: Record<string, string> = {
  p1: '2026-07-25', p2: '2026-07-26', p3: '2026-07-23', p4: '2026-07-22',
  p5: '2026-07-25', p6: '2026-07-24', p8: '2026-07-26',
};

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ values, color, max }: { values: number[]; color: string; max: number }) {
  if (values.length < 2) return <span className="text-xs text-slate">—</span>;
  const w = 60; const h = 24; const pad = 3;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v / max) * (h - pad * 2));
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r={2.5} fill={color} />
    </svg>
  );
}

// ─── Trend arrow ──────────────────────────────────────────────────────────────

function TrendArrow({ current, prev }: { current: number; prev?: number }) {
  if (prev == null) return <Minus className="w-3 h-3 text-slate" />;
  const diff = current - prev;
  if (Math.abs(diff) < 2) return <Minus className="w-3 h-3 text-amber-500" />;
  if (diff < 0) return <TrendingDown className="w-3 h-3 text-green-600" />;
  return <TrendingUp className="w-3 h-3 text-red-500" />;
}

// ─── Questionnaire Component ──────────────────────────────────────────────────

function Questionnaire({
  instrument, onSave, onCancel,
}: {
  instrument: 'PHQ-9' | 'GAD-7' | 'PCL-5';
  onSave: (score: number) => void;
  onCancel: () => void;
}) {
  const items = instrument === 'PHQ-9' ? PHQ9_ITEMS : instrument === 'GAD-7' ? GAD7_ITEMS : PCL5_ITEMS;
  const scale = instrument === 'PCL-5' ? 4 : 3;
  const labels = instrument === 'PCL-5' ? RESPONSE_LABELS_5 : RESPONSE_LABELS_4;
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const total = Object.values(answers).reduce((s, v) => s + v, 0);
  const complete = Object.keys(answers).length === items.length;
  const sev = instrument === 'PHQ-9' ? phq9Severity(total) : instrument === 'GAD-7' ? gad7Severity(total) : pcl5Severity(total);
  const max = instrument === 'PCL-5' ? 80 : instrument === 'PHQ-9' ? 27 : 21;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-navy text-base">{instrument}</h3>
          <p className="text-xs text-slate">{items.length} items · Response: {labels[0]} (0) to {labels[scale]} ({scale}) · Max score: {max}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-navy">{total}<span className="text-sm font-normal text-slate">/{max}</span></div>
          {complete && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sev.color}`}>{sev.label}</span>}
        </div>
      </div>

      {/* Progress */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full">
        <div className="h-1.5 bg-sunrise-orange rounded-full transition-all" style={{ width: `${(Object.keys(answers).length / items.length) * 100}%` }} />
      </div>

      {/* Items */}
      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div key={idx} className={`p-3 rounded-lg border transition-colors ${answers[idx] != null ? 'border-sunrise-orange/30 bg-orange-50/30' : 'border-border bg-white'}`}>
            <div className="text-sm font-medium text-navy mb-2.5">
              <span className="text-slate font-normal mr-1">{idx + 1}.</span> {item}
              {instrument === 'PHQ-9' && idx === 8 && (
                <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Safety Item</span>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: scale + 1 }, (_, v) => (
                <button
                  key={v}
                  onClick={() => setAnswers(prev => ({ ...prev, [idx]: v }))}
                  className={`px-2.5 py-1.5 text-xs rounded border font-medium transition-all flex-1 min-w-0 leading-tight ${
                    answers[idx] === v
                      ? 'bg-navy text-white border-navy shadow-sm'
                      : 'bg-white text-slate border-border hover:border-navy/40 hover:bg-gray-50'
                  }`}
                >
                  <span className="block font-bold">{v}</span>
                  <span className="block text-[9px] opacity-80 whitespace-nowrap overflow-hidden text-ellipsis">{labels[v]}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Safety alert */}
      {instrument === 'PHQ-9' && answers[8] != null && answers[8] > 0 && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-bold text-red-800">Safety item elevated (Item 9 = {answers[8]})</div>
            <div className="text-red-700 text-xs mt-0.5">Conduct a formal suicide risk assessment before concluding this session. Document C-SSRS in chart.</div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-border">
        <button
          disabled={!complete}
          onClick={() => onSave(total)}
          className="flex-1 bg-navy text-white py-2 rounded font-semibold text-sm hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {complete ? `Save Score — ${total}/${max} (${sev.label})` : `Answer all ${items.length - Object.keys(answers).length} remaining items`}
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-border rounded text-slate text-sm hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'Patient Scores' | 'Administer' | 'Trends' | 'Analytics';
type Instrument = 'PHQ-9' | 'GAD-7' | 'PCL-5';

export function MeasurementBasedCare({ navigate, readOnly }: Props) {
  const editRoles = getRolesWithEditAccess('ProgressNotes'); // same access as clinical documentation
  const [tab, setTab] = useState<Tab>('Patient Scores');
  const [trendPatient, setTrendPatient] = useState<string>('p1');
  const [adminStep, setAdminStep] = useState<1 | 2 | 3>(1);
  const [adminPatient, setAdminPatient] = useState<string>('');
  const [adminInstrument, setAdminInstrument] = useState<Instrument>('PHQ-9');
  const [adminScores, setAdminScores] = useState<Record<string, ScoreEntry[]>>(MOCK_SCORES);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  // Patients who have score history
  const scoredPatients = useMemo(() =>
    MOCK_PATIENTS.filter(p => adminScores[p.id] && adminScores[p.id].length > 0),
    [adminScores],
  );

  const allPatients = MOCK_PATIENTS.filter(p => p.program !== 'IOP' || adminScores[p.id]);

  // KPI counts
  const moderatePlusDep = scoredPatients.filter(p => {
    const latest = adminScores[p.id]?.at(-1);
    return latest?.phq9 != null && latest.phq9 >= 10;
  }).length;
  const moderatePlusAnx = scoredPatients.filter(p => {
    const latest = adminScores[p.id]?.at(-1);
    return latest?.gad7 != null && latest.gad7 >= 10;
  }).length;
  const probablePTSD = scoredPatients.filter(p => {
    const latest = adminScores[p.id]?.at(-1);
    return latest?.pcl5 != null && latest.pcl5 >= 33;
  }).length;
  const today = '2026-07-22';
  const assessmentDue = allPatients.filter(p => {
    const nextDue = NEXT_DUE[p.id];
    return nextDue && nextDue <= today;
  }).length;

  // Trend chart data for selected patient
  const trendData = useMemo(() => {
    const entries = adminScores[trendPatient] ?? [];
    return entries.map(e => ({
      date: e.date.slice(5),
      PHQ9: e.phq9,
      GAD7: e.gad7,
      PCL5: e.pcl5 != null ? Math.round(e.pcl5 / 80 * 27) : undefined, // normalize to same scale for display
      PCL5raw: e.pcl5,
    }));
  }, [trendPatient, adminScores]);

  function handleSaveScore(score: number) {
    const newEntry: ScoreEntry = {
      date: today,
      by: 'Sarah Jenkins, LPC',
      ...(adminInstrument === 'PHQ-9' ? { phq9: score } : {}),
      ...(adminInstrument === 'GAD-7' ? { gad7: score } : {}),
      ...(adminInstrument === 'PCL-5' ? { pcl5: score } : {}),
    };
    setAdminScores(prev => {
      const existing = prev[adminPatient] ?? [];
      // Merge with same-date entry if it exists
      const sameDay = existing.findIndex(e => e.date === today);
      if (sameDay >= 0) {
        const updated = [...existing];
        updated[sameDay] = { ...updated[sameDay], ...newEntry };
        return { ...prev, [adminPatient]: updated };
      }
      return { ...prev, [adminPatient]: [...existing, newEntry] };
    });
    setSavedFlash(`${adminInstrument} score of ${score} saved for ${MOCK_PATIENTS.find(p => p.id === adminPatient)?.firstName}`);
    setTimeout(() => setSavedFlash(null), 2500);
    setAdminStep(1);
    setAdminPatient('');
  }

  // Analytics data
  const analyticsData = useMemo(() => {
    const phqBands = [
      { band: 'Minimal (0–4)', count: 0, color: '#22c55e' },
      { band: 'Mild (5–9)', count: 0, color: '#eab308' },
      { band: 'Moderate (10–14)', count: 0, color: '#f97316' },
      { band: 'Mod. Severe (15–19)', count: 0, color: '#ef4444' },
      { band: 'Severe (20+)', count: 0, color: '#991b1b' },
    ];
    scoredPatients.forEach(p => {
      const v = adminScores[p.id]?.at(-1)?.phq9;
      if (v == null) return;
      if (v <= 4) phqBands[0].count++;
      else if (v <= 9) phqBands[1].count++;
      else if (v <= 14) phqBands[2].count++;
      else if (v <= 19) phqBands[3].count++;
      else phqBands[4].count++;
    });
    return phqBands.filter(b => b.count > 0);
  }, [scoredPatients, adminScores]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-500" /> Measurement-Based Care
          </h1>
          <p className="text-slate text-sm mt-0.5">PHQ-9 · GAD-7 · PCL-5 — standardised outcome tracking administered at weekly intervals</p>
        </div>
        <LockedButton
          locked={readOnly}
          editRoles={editRoles}
          onClick={() => { setTab('Administer'); setAdminStep(1); }}
          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
        >
          + Administer Assessment
        </LockedButton>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Moderate+ Depression', value: moderatePlusDep, sub: `PHQ-9 ≥ 10 · ${scoredPatients.length} patients tracked`, color: 'text-amber-700', border: 'border-l-amber-500', bg: 'bg-amber-50' },
          { label: 'Moderate+ Anxiety', value: moderatePlusAnx, sub: `GAD-7 ≥ 10 · Action threshold`, color: 'text-orange-700', border: 'border-l-orange-500', bg: 'bg-orange-50' },
          { label: 'Probable PTSD', value: probablePTSD, sub: `PCL-5 ≥ 33 · Trauma treatment indicated`, color: 'text-red-700', border: 'border-l-red-500', bg: 'bg-red-50' },
          { label: 'Assessments Due', value: assessmentDue, sub: 'Due or overdue today', color: assessmentDue > 0 ? 'text-red-700' : 'text-green-700', border: assessmentDue > 0 ? 'border-l-red-500' : 'border-l-green-500', bg: assessmentDue > 0 ? 'bg-red-50' : 'bg-green-50' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} border border-transparent border-l-4 ${k.border} rounded-lg p-4 shadow-sm`}>
            <div className="text-[10px] font-bold text-slate uppercase tracking-wider">{k.label}</div>
            <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
            <div className="text-xs text-slate mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Saved flash */}
      {savedFlash && (
        <div className="bg-green-100 border border-green-300 text-green-800 text-sm px-4 py-2.5 rounded-lg flex items-center gap-2">
          <span className="text-green-600">✓</span> {savedFlash}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border">
        {(['Patient Scores', 'Administer', 'Trends', 'Analytics'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-purple-500 text-purple-700' : 'border-transparent text-slate hover:text-navy'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab: Patient Scores ──────────────────────────────────────────────── */}
      {tab === 'Patient Scores' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-navy text-sm">Current Caseload — Latest Scores</h3>
            <span className="text-xs text-slate">Re-administer weekly per evidence-based practice. Alert threshold: PHQ-9 ≥10, GAD-7 ≥10, PCL-5 ≥33.</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-slate">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Patient</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Program</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider" colSpan={2}>PHQ-9 (Depression)</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider" colSpan={2}>GAD-7 (Anxiety)</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider" colSpan={2}>PCL-5 (PTSD)</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Last Admin</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {scoredPatients.map(p => {
                const history = adminScores[p.id] ?? [];
                const latest = history.at(-1);
                const prev = history.at(-2);
                const phqSev = latest?.phq9 != null ? phq9Severity(latest.phq9) : null;
                const gadSev = latest?.gad7 != null ? gad7Severity(latest.gad7) : null;
                const pclSev = latest?.pcl5 != null ? pcl5Severity(latest.pcl5) : null;
                const isAlert = (latest?.phq9 ?? 0) >= 10 || (latest?.gad7 ?? 0) >= 10 || (latest?.pcl5 ?? 0) >= 33;
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isAlert ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <button
                        className="font-semibold text-navy hover:text-sunrise-orange text-left"
                        onClick={() => { setTrendPatient(p.id); setTab('Trends'); }}
                      >
                        {p.firstName} {p.lastName}
                      </button>
                      {isAlert && <AlertTriangle className="w-3 h-3 text-red-500 inline ml-1" />}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate px-1.5 py-0.5 rounded">{p.program}</span>
                    </td>
                    {/* PHQ-9 */}
                    <td className="px-2 py-3 text-center">
                      {latest?.phq9 != null ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-navy">{latest.phq9}</span>
                            <TrendArrow current={latest.phq9} prev={prev?.phq9} />
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${phqSev!.color}`}>{phqSev!.label}</span>
                        </div>
                      ) : <span className="text-slate text-xs">—</span>}
                    </td>
                    <td className="px-1 py-3">
                      <Sparkline
                        values={history.filter(e => e.phq9 != null).map(e => e.phq9!)}
                        color="#8b5cf6"
                        max={27}
                      />
                    </td>
                    {/* GAD-7 */}
                    <td className="px-2 py-3 text-center">
                      {latest?.gad7 != null ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-navy">{latest.gad7}</span>
                            <TrendArrow current={latest.gad7} prev={prev?.gad7} />
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${gadSev!.color}`}>{gadSev!.label}</span>
                        </div>
                      ) : <span className="text-slate text-xs">—</span>}
                    </td>
                    <td className="px-1 py-3">
                      <Sparkline
                        values={history.filter(e => e.gad7 != null).map(e => e.gad7!)}
                        color="#3b82f6"
                        max={21}
                      />
                    </td>
                    {/* PCL-5 */}
                    <td className="px-2 py-3 text-center">
                      {latest?.pcl5 != null ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-navy">{latest.pcl5}</span>
                            <TrendArrow current={latest.pcl5} prev={prev?.pcl5} />
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${pclSev!.color}`}>{pclSev!.label}</span>
                        </div>
                      ) : <span className="text-slate text-xs">Not admin.</span>}
                    </td>
                    <td className="px-1 py-3">
                      {history.some(e => e.pcl5 != null) && (
                        <Sparkline
                          values={history.filter(e => e.pcl5 != null).map(e => e.pcl5!)}
                          color="#ef4444"
                          max={80}
                        />
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-slate">{latest?.date.slice(5) ?? '—'}</td>
                    <td className="px-3 py-3 text-center">
                      <LockedButton
                        locked={readOnly}
                        editRoles={editRoles}
                        onClick={() => { setAdminPatient(p.id); setAdminStep(2); setTab('Administer'); }}
                        className="text-[10px] font-bold px-2 py-1 rounded border border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 flex items-center gap-1 mx-auto"
                      >
                        Administer <ChevronRight className="w-3 h-3" />
                      </LockedButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Administer ─────────────────────────────────────────────────── */}
      {tab === 'Administer' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-4">
            {/* Step indicators */}
            {([
              { n: 1, label: 'Select Patient' },
              { n: 2, label: 'Select Instrument' },
              { n: 3, label: 'Administer' },
            ] as const).map(step => (
              <div key={step.n} className={`flex items-center gap-3 p-3 rounded-lg border ${adminStep === step.n ? 'border-purple-400 bg-purple-50' : adminStep > step.n ? 'border-green-300 bg-green-50' : 'border-border bg-white'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${adminStep === step.n ? 'bg-purple-500 text-white' : adminStep > step.n ? 'bg-green-500 text-white' : 'bg-gray-200 text-slate'}`}>
                  {adminStep > step.n ? '✓' : step.n}
                </div>
                <span className={`text-sm font-medium ${adminStep === step.n ? 'text-purple-800' : 'text-slate'}`}>{step.label}</span>
              </div>
            ))}

            {adminStep === 1 && (
              <div className="card">
                <div className="text-xs font-bold text-slate uppercase tracking-wide mb-3">Select Patient</div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {MOCK_PATIENTS.filter(p => p.program === 'Residential' || p.program === 'PHP').map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setAdminPatient(p.id); setAdminStep(2); }}
                      className="w-full flex items-center gap-2 p-2 rounded hover:bg-purple-50 text-left transition-colors"
                    >
                      <div className="w-7 h-7 bg-navy rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-navy">{p.firstName} {p.lastName}</div>
                        <div className="text-[10px] text-slate">{p.program}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {adminStep >= 2 && adminPatient && (
              <div className="card bg-purple-50 border-purple-200">
                <div className="text-xs font-bold text-slate uppercase tracking-wide mb-1">Selected Patient</div>
                <div className="font-semibold text-navy">
                  {MOCK_PATIENTS.find(p => p.id === adminPatient)?.firstName}{' '}
                  {MOCK_PATIENTS.find(p => p.id === adminPatient)?.lastName}
                </div>
                <div className="text-xs text-slate">{MOCK_PATIENTS.find(p => p.id === adminPatient)?.program}</div>
                <button onClick={() => { setAdminStep(1); setAdminPatient(''); }} className="text-[10px] text-purple-700 mt-2 hover:underline">Change</button>
              </div>
            )}
          </div>

          <div className="col-span-2">
            {adminStep === 2 && (
              <div className="card">
                <div className="font-bold text-navy mb-4">Select Instrument</div>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: 'PHQ-9', name: 'PHQ-9', sub: 'Depression', items: 9, max: 27, alert: '≥ 10', color: 'border-purple-300 hover:bg-purple-50' },
                    { id: 'GAD-7', name: 'GAD-7', sub: 'Anxiety', items: 7, max: 21, alert: '≥ 10', color: 'border-blue-300 hover:bg-blue-50' },
                    { id: 'PCL-5', name: 'PCL-5', sub: 'PTSD', items: 20, max: 80, alert: '≥ 33', color: 'border-red-300 hover:bg-red-50' },
                  ] as const).map(inst => (
                    <button
                      key={inst.id}
                      onClick={() => { setAdminInstrument(inst.id); setAdminStep(3); }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${adminInstrument === inst.id ? 'border-purple-500 bg-purple-50' : inst.color} border`}
                    >
                      <div className="font-bold text-navy text-lg">{inst.name}</div>
                      <div className="text-xs text-slate font-medium">{inst.sub}</div>
                      <div className="mt-2 space-y-0.5 text-[10px] text-slate">
                        <div>{inst.items} items · Scale 0–{inst.max}</div>
                        <div>Alert threshold: {inst.alert}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-xs text-slate bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <strong>Evidence base:</strong> PHQ-9 and GAD-7 are validated tools widely used in behavioral health settings.
                  PCL-5 is the PTSD Checklist for DSM-5, developed by the VA/DoD. All instruments are free to use clinically.
                </div>
              </div>
            )}

            {adminStep === 3 && adminPatient && (
              <div className="card">
                <Questionnaire
                  instrument={adminInstrument}
                  onSave={handleSaveScore}
                  onCancel={() => setAdminStep(2)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Trends ─────────────────────────────────────────────────────── */}
      {tab === 'Trends' && (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="text-sm font-semibold text-slate">Patient:</div>
            <div className="flex flex-wrap gap-2">
              {scoredPatients.map(p => (
                <button
                  key={p.id}
                  onClick={() => setTrendPatient(p.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${trendPatient === p.id ? 'bg-navy text-white border-navy' : 'bg-white text-slate border-border hover:border-navy/40'}`}
                >
                  {p.firstName} {p.lastName}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const history = adminScores[trendPatient] ?? [];
            const patient = MOCK_PATIENTS.find(p => p.id === trendPatient);
            const hasPCL = history.some(e => e.pcl5 != null);
            return (
              <div className="space-y-4">
                <div className="card">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-navy">{patient?.firstName} {patient?.lastName} — PHQ-9 & GAD-7 Trajectory</div>
                    <span className="text-xs text-slate">{patient?.program} · {history.length} assessments</span>
                  </div>
                  <div className="text-xs text-slate mb-4">Lower is better. Dashed lines = action thresholds (PHQ-9: 10, GAD-7: 10).</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 27]} />
                      <Tooltip />
                      <ReferenceLine y={10} stroke="#f97316" strokeDasharray="5 4" label={{ value: 'Mod threshold', fill: '#f97316', fontSize: 9, position: 'insideTopRight' }} />
                      <Line type="monotone" dataKey="PHQ9" name="PHQ-9" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} connectNulls />
                      <Line type="monotone" dataKey="GAD7" name="GAD-7" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {hasPCL && (
                  <div className="card">
                    <div className="font-semibold text-navy mb-1">{patient?.firstName} {patient?.lastName} — PCL-5 (PTSD) Trajectory</div>
                    <div className="text-xs text-slate mb-4">PCL-5 scale 0–80. Probable PTSD threshold: 33. Severe: 50.</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={history.filter(e => e.pcl5 != null).map(e => ({ date: e.date.slice(5), PCL5: e.pcl5 }))} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} domain={[0, 80]} />
                        <Tooltip />
                        <ReferenceLine y={33} stroke="#f97316" strokeDasharray="5 4" label={{ value: 'Probable PTSD', fill: '#f97316', fontSize: 9, position: 'insideTopRight' }} />
                        <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="5 4" label={{ value: 'Severe', fill: '#ef4444', fontSize: 9, position: 'insideTopRight' }} />
                        <Line type="monotone" dataKey="PCL5" name="PCL-5" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Score history table */}
                <div className="card p-0 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-border font-semibold text-navy text-sm">Assessment History</div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-bg text-slate">
                        {['Date', 'PHQ-9', 'GAD-7', 'PCL-5', 'Administered By', 'Notes'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[...history].reverse().map((e, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-navy">{e.date}</td>
                          <td className="px-4 py-2.5">
                            {e.phq9 != null ? (
                              <span className={`font-bold text-xs px-1.5 py-0.5 rounded border ${phq9Severity(e.phq9).color}`}>{e.phq9}</span>
                            ) : <span className="text-slate">—</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            {e.gad7 != null ? (
                              <span className={`font-bold text-xs px-1.5 py-0.5 rounded border ${gad7Severity(e.gad7).color}`}>{e.gad7}</span>
                            ) : <span className="text-slate">—</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            {e.pcl5 != null ? (
                              <span className={`font-bold text-xs px-1.5 py-0.5 rounded border ${pcl5Severity(e.pcl5).color}`}>{e.pcl5}</span>
                            ) : <span className="text-slate">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-slate">{e.by}</td>
                          <td className="px-4 py-2.5 text-slate italic">{e.notes ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Tab: Analytics ──────────────────────────────────────────────────── */}
      {tab === 'Analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-1">PHQ-9 Distribution — Current Caseload</h3>
              <p className="text-xs text-slate mb-4">Count by severity band (latest score per patient)</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analyticsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="band" type="category" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" name="Patients" radius={[0, 4, 4, 0]}>
                    {analyticsData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-1">Average Score Improvement</h3>
              <p className="text-xs text-slate mb-4">Admission vs. latest — mean per instrument</p>
              <div className="space-y-4 pt-2">
                {[
                  {
                    label: 'PHQ-9 (Depression)',
                    intake: scoredPatients.reduce((s, p) => s + (adminScores[p.id]?.[0]?.phq9 ?? 0), 0) / (scoredPatients.filter(p => adminScores[p.id]?.[0]?.phq9 != null).length || 1),
                    latest: scoredPatients.reduce((s, p) => s + (adminScores[p.id]?.at(-1)?.phq9 ?? 0), 0) / (scoredPatients.filter(p => adminScores[p.id]?.at(-1)?.phq9 != null).length || 1),
                    color: 'bg-purple-500',
                    max: 27,
                  },
                  {
                    label: 'GAD-7 (Anxiety)',
                    intake: scoredPatients.reduce((s, p) => s + (adminScores[p.id]?.[0]?.gad7 ?? 0), 0) / (scoredPatients.filter(p => adminScores[p.id]?.[0]?.gad7 != null).length || 1),
                    latest: scoredPatients.reduce((s, p) => s + (adminScores[p.id]?.at(-1)?.gad7 ?? 0), 0) / (scoredPatients.filter(p => adminScores[p.id]?.at(-1)?.gad7 != null).length || 1),
                    color: 'bg-blue-500',
                    max: 21,
                  },
                ].map(inst => {
                  const improvement = inst.intake - inst.latest;
                  const impPct = Math.round((improvement / inst.max) * 100);
                  return (
                    <div key={inst.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate font-medium">{inst.label}</span>
                        <span className="text-green-700 font-bold">▼ {improvement.toFixed(1)} pts ({impPct}%)</span>
                      </div>
                      <div className="flex gap-2 items-center text-xs text-slate mb-1">
                        <span>Intake: <strong className="text-navy">{inst.intake.toFixed(1)}</strong></span>
                        <span>→</span>
                        <span>Now: <strong className="text-navy">{inst.latest.toFixed(1)}</strong></span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full relative">
                        <div className="h-2 rounded-full bg-gray-300 absolute" style={{ width: `${(inst.intake / inst.max) * 100}%` }} />
                        <div className={`h-2 rounded-full ${inst.color} absolute`} style={{ width: `${(inst.latest / inst.max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Assessment Compliance</h3>
              <div className="space-y-3">
                {[
                  { label: 'PHQ-9 Coverage', pct: Math.round((scoredPatients.filter(p => adminScores[p.id]?.some(e => e.phq9 != null)).length / (MOCK_PATIENTS.filter(p => p.program !== 'IOP').length || 1)) * 100) },
                  { label: 'GAD-7 Coverage', pct: Math.round((scoredPatients.filter(p => adminScores[p.id]?.some(e => e.gad7 != null)).length / (MOCK_PATIENTS.filter(p => p.program !== 'IOP').length || 1)) * 100) },
                  { label: 'PCL-5 Coverage (PTSD screen)', pct: Math.round((scoredPatients.filter(p => adminScores[p.id]?.some(e => e.pcl5 != null)).length / (MOCK_PATIENTS.filter(p => p.program !== 'IOP').length || 1)) * 100) },
                  { label: 'Weekly Re-admin Compliance', pct: 71 },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate">{m.label}</span>
                      <span className={`font-bold ${m.pct >= 80 ? 'text-green-700' : m.pct >= 60 ? 'text-amber-700' : 'text-red-700'}`}>{m.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${m.pct >= 80 ? 'bg-green-500' : m.pct >= 60 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800">
                <strong>Measurement-Based Care standard:</strong> Re-administer PHQ-9 and GAD-7 weekly; PCL-5 at intake and monthly thereafter. Use scores in treatment plan reviews to demonstrate evidence-based progress.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
