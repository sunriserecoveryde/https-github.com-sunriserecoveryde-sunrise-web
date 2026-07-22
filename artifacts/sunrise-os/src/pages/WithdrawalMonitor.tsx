import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import {
  Activity, AlertTriangle, CheckCircle, Clock, TrendingDown, TrendingUp, Minus,
  ChevronDown, ChevronUp, Bell, RefreshCw, X,
} from 'lucide-react';

import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

// ─── Types ────────────────────────────────────────────────────────────────────

type Protocol = 'CIWA-Ar' | 'COWS';
type Severity = 'Mild' | 'Moderate' | 'Severe' | 'Danger';
type Trend = 'Improving' | 'Stable' | 'Worsening';

interface Assessment {
  timestamp: string;
  score: number;
  assessedBy: string;
}

interface PatientProtocol {
  patientId: string;
  patientName: string;
  mrn: string;
  bed: string;
  program: string;
  protocol: Protocol;
  currentScore: number;
  previousScore: number;
  assessments: Assessment[];
  nextDue: string;
  orderedBy: string;
  frequency: string;
  alertThreshold: number;
  notes: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CIWA_ASSESSMENTS: PatientProtocol[] = [
  {
    patientId: 'p8', patientName: 'Carlos Mendez', mrn: 'MRN-62877', bed: '4B',
    program: 'Residential', protocol: 'CIWA-Ar', currentScore: 14, previousScore: 17,
    assessments: [
      { timestamp: '2026-07-19 14:00', score: 14, assessedBy: 'J. Torres, RN' },
      { timestamp: '2026-07-19 10:00', score: 17, assessedBy: 'J. Torres, RN' },
      { timestamp: '2026-07-19 06:00', score: 21, assessedBy: 'M. Boyd, RN' },
      { timestamp: '2026-07-18 22:00', score: 19, assessedBy: 'M. Boyd, RN' },
      { timestamp: '2026-07-18 18:00', score: 24, assessedBy: 'J. Torres, RN' },
      { timestamp: '2026-07-18 14:00', score: 26, assessedBy: 'J. Torres, RN' },
    ],
    nextDue: '2026-07-22 18:00', orderedBy: 'Dr. Emily Stone, MD',
    frequency: 'Q4H', alertThreshold: 15,
    notes: 'Librium PRN protocol active. BP elevated (158/96 at 0600). Hypertension co-morbidity increases seizure risk. MD notified of all scores > 18.',
  },
  {
    patientId: 'p5', patientName: 'Elena Vasquez', mrn: 'MRN-88211', bed: '3A',
    program: 'Residential', protocol: 'CIWA-Ar', currentScore: 6, previousScore: 9,
    assessments: [
      { timestamp: '2026-07-19 14:00', score: 6, assessedBy: 'J. Torres, RN' },
      { timestamp: '2026-07-19 10:00', score: 9, assessedBy: 'J. Torres, RN' },
      { timestamp: '2026-07-19 06:00', score: 11, assessedBy: 'M. Boyd, RN' },
      { timestamp: '2026-07-18 22:00', score: 14, assessedBy: 'M. Boyd, RN' },
      { timestamp: '2026-07-18 18:00', score: 17, assessedBy: 'J. Torres, RN' },
    ],
    nextDue: '2026-07-22 18:00', orderedBy: 'Dr. Emily Stone, MD',
    frequency: 'Q4H', alertThreshold: 15,
    notes: 'Trending down. Gabapentin helpful. Denies tremors or visual disturbances at 1400 assessment. Continue Q4H monitoring.',
  },
  {
    patientId: 'p18', patientName: 'Carol Sutton', mrn: 'MRN-15982', bed: '5A',
    program: 'Residential', protocol: 'CIWA-Ar', currentScore: 4, previousScore: 4,
    assessments: [
      { timestamp: '2026-07-19 12:00', score: 4, assessedBy: 'J. Torres, RN' },
      { timestamp: '2026-07-19 08:00', score: 4, assessedBy: 'M. Boyd, RN' },
      { timestamp: '2026-07-18 20:00', score: 6, assessedBy: 'J. Torres, RN' },
    ],
    nextDue: '2026-07-22 18:00', orderedBy: 'Dr. Emily Stone, MD',
    frequency: 'Q6H', alertThreshold: 10,
    notes: 'Day 4. Stable CIWA. High fall risk (score upgraded after incident 7/14). Bed alarm active.',
  },
];

const COWS_ASSESSMENTS: PatientProtocol[] = [
  {
    patientId: 'p1', patientName: 'Marcus Webb', mrn: 'MRN-83921', bed: '1A',
    program: 'Residential', protocol: 'COWS', currentScore: 4, previousScore: 8,
    assessments: [
      { timestamp: '2026-07-19 14:00', score: 4, assessedBy: 'J. Torres, RN' },
      { timestamp: '2026-07-19 10:00', score: 8, assessedBy: 'J. Torres, RN' },
      { timestamp: '2026-07-19 06:00', score: 12, assessedBy: 'M. Boyd, RN' },
      { timestamp: '2026-07-18 22:00', score: 10, assessedBy: 'M. Boyd, RN' },
      { timestamp: '2026-07-18 18:00', score: 14, assessedBy: 'J. Torres, RN' },
      { timestamp: '2026-07-18 06:00', score: 19, assessedBy: 'J. Torres, RN' },
    ],
    nextDue: '2026-07-22 18:00', orderedBy: 'Dr. Robert Chen, MD',
    frequency: 'Q4H', alertThreshold: 13,
    notes: 'Suboxone 16mg BID — good response. COWS trending down significantly from peak of 19 at induction. AMA risk high — monitor closely. Next dose review at afternoon rounds.',
  },
  {
    patientId: 'p3', patientName: 'Devon Patel', mrn: 'MRN-99321', bed: '2A',
    program: 'Residential', protocol: 'COWS', currentScore: 2, previousScore: 3,
    assessments: [
      { timestamp: '2026-07-19 12:00', score: 2, assessedBy: 'J. Torres, RN' },
      { timestamp: '2026-07-19 06:00', score: 3, assessedBy: 'M. Boyd, RN' },
      { timestamp: '2026-07-18 22:00', score: 5, assessedBy: 'M. Boyd, RN' },
    ],
    nextDue: '2026-07-22 18:00', orderedBy: 'Dr. Robert Chen, MD',
    frequency: 'Q6H', alertThreshold: 13,
    notes: 'METH withdrawal — COWS minimally elevated (stimulant WD not primarily captured by COWS). Monitoring for depressive crash / hypersomnia. Psychiatry consult at 1600.',
  },
  {
    patientId: 'p4', patientName: 'Jamal Foster', mrn: 'MRN-55422', bed: '2B',
    program: 'Residential', protocol: 'COWS', currentScore: 10, previousScore: 14,
    assessments: [
      { timestamp: '2026-07-19 14:00', score: 10, assessedBy: 'J. Torres, RN' },
      { timestamp: '2026-07-19 10:00', score: 14, assessedBy: 'J. Torres, RN' },
      { timestamp: '2026-07-19 06:00', score: 16, assessedBy: 'M. Boyd, RN' },
      { timestamp: '2026-07-18 22:00', score: 18, assessedBy: 'M. Boyd, RN' },
    ],
    nextDue: '2026-07-22 18:00', orderedBy: 'Dr. Robert Chen, MD',
    frequency: 'Q4H', alertThreshold: 13,
    notes: 'Polysubstance — dual withdrawal protocol (COWS + CIWA). Both scores improving. Wound care to left arm at 1400 concurrent with assessment.',
  },
  {
    patientId: 'p6', patientName: 'Robert Kim', mrn: 'MRN-44102', bed: '3B',
    program: 'Residential', protocol: 'COWS', currentScore: 1, previousScore: 2,
    assessments: [
      { timestamp: '2026-07-19 12:00', score: 1, assessedBy: 'J. Torres, RN' },
      { timestamp: '2026-07-19 06:00', score: 2, assessedBy: 'M. Boyd, RN' },
      { timestamp: '2026-07-18 22:00', score: 3, assessedBy: 'M. Boyd, RN' },
    ],
    nextDue: '2026-07-22 18:00', orderedBy: 'Dr. Robert Chen, MD',
    frequency: 'Q8H', alertThreshold: 13,
    notes: 'Day 10 — near-complete resolution. Suboxone dose stable at 8mg BID. PTSD group at 1500.',
  },
];

// ─── CIWA-Ar Subscale breakdown ───────────────────────────────────────────────

const CIWA_SUBSCALES = [
  { name: 'Nausea / Vomiting', code: 'NV', max: 7 },
  { name: 'Tremor', code: 'TR', max: 7 },
  { name: 'Paroxysmal Sweats', code: 'SW', max: 7 },
  { name: 'Anxiety', code: 'AX', max: 7 },
  { name: 'Agitation', code: 'AG', max: 7 },
  { name: 'Tactile Disturbances', code: 'TD', max: 7 },
  { name: 'Auditory Disturbances', code: 'AD', max: 7 },
  { name: 'Visual Disturbances', code: 'VD', max: 7 },
  { name: 'Headache', code: 'HA', max: 7 },
  { name: 'Orientation / Sensorium', code: 'OR', max: 4 },
];

const COWS_SUBSCALES = [
  { name: 'Resting Pulse Rate', code: 'PR', max: 5 },
  { name: 'Sweating', code: 'SW', max: 4 },
  { name: 'Restlessness', code: 'RS', max: 5 },
  { name: 'Pupil Size', code: 'PU', max: 5 },
  { name: 'Bone/Joint Aches', code: 'BJ', max: 4 },
  { name: 'Runny Nose / Tearing', code: 'RT', max: 4 },
  { name: 'GI Upset', code: 'GI', max: 5 },
  { name: 'Tremor', code: 'TR', max: 4 },
  { name: 'Yawning', code: 'YW', max: 4 },
  { name: 'Anxiety / Irritability', code: 'AI', max: 4 },
  { name: 'Gooseflesh', code: 'GF', max: 3 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSeverity(score: number, protocol: Protocol): Severity {
  if (protocol === 'CIWA-Ar') {
    if (score <= 7) return 'Mild';
    if (score <= 14) return 'Moderate';
    if (score <= 19) return 'Severe';
    return 'Danger';
  } else {
    if (score <= 5) return 'Mild';
    if (score <= 12) return 'Moderate';
    if (score <= 24) return 'Severe';
    return 'Danger';
  }
}

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string; badge: string }> = {
  Mild:    { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  badge: 'bg-green-100 text-green-800' },
  Moderate:{ bg: 'bg-amber-50', text: 'text-amber-700',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-800' },
  Severe:  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  Danger:  { bg: 'bg-red-50',   text: 'text-red-700',    border: 'border-red-200',    badge: 'bg-red-100 text-red-800' },
};

function getTrend(current: number, previous: number): Trend {
  const delta = current - previous;
  if (delta <= -2) return 'Improving';
  if (delta >= 2) return 'Worsening';
  return 'Stable';
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === 'Improving') return <TrendingDown className="w-4 h-4 text-green-600" />;
  if (trend === 'Worsening') return <TrendingUp className="w-4 h-4 text-red-600" />;
  return <Minus className="w-4 h-4 text-amber-600" />;
}

function ScoreSparkline({ assessments }: { assessments: Assessment[] }) {
  const sorted = [...assessments].reverse();
  if (sorted.length < 2) return null;
  const scores = sorted.map(a => a.score);
  const max = Math.max(...scores, 15);
  const W = 80, H = 32;
  const points = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * W;
    const y = H - (s / max) * H;
    return `${x},${y}`;
  }).join(' ');
  const last = scores[scores.length - 1];
  const lastX = W, lastY = H - (last / max) * H;
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline points={points} fill="none" stroke="#3B82F6" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={3} fill="#3B82F6" />
    </svg>
  );
}

// ─── Patient Row ──────────────────────────────────────────────────────────────

function PatientRow({
  p, navigate, expanded, onToggle, readOnly
}: {
  p: PatientProtocol;
  navigate: (s: Screen, id?: string) => void;
  expanded: boolean;
  onToggle: () => void;
  readOnly?: boolean;
}) {
  const severity = getSeverity(p.currentScore, p.protocol);
  const trend = getTrend(p.currentScore, p.previousScore);
  const colors = SEVERITY_COLORS[severity];
  const aboveThreshold = p.currentScore >= p.alertThreshold;

  return (
    <div className={`border rounded-lg overflow-hidden mb-3 ${aboveThreshold ? 'border-red-300 shadow-md shadow-red-100' : 'border-border'}`}>
      {/* Main row */}
      <div
        className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${aboveThreshold ? 'bg-red-50/40' : 'bg-white'}`}
        onClick={onToggle}
      >
        {/* Alert icon */}
        <div className="w-6 flex-none">
          {aboveThreshold
            ? <Bell className="w-5 h-5 text-red-500 animate-pulse" />
            : <CheckCircle className="w-5 h-5 text-green-400" />}
        </div>

        {/* Bed + Name */}
        <div className="w-24 flex-none">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bed {p.bed}</div>
          <button
            className="text-sm font-semibold text-navy hover:text-sunrise-blue hover:underline text-left"
            onClick={e => { e.stopPropagation(); navigate('PatientDetail', p.patientId); }}
          >
            {p.patientName}
          </button>
          <div className="text-[10px] text-slate">{p.mrn}</div>
        </div>

        {/* Score */}
        <div className="flex-none text-center">
          <div className={`text-2xl font-bold ${colors.text}`}>{p.currentScore}</div>
          <div className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${colors.badge}`}>{severity}</div>
        </div>

        {/* Trend */}
        <div className="flex-none flex items-center gap-1.5 w-28">
          <TrendIcon trend={trend} />
          <div>
            <div className={`text-xs font-semibold ${trend === 'Improving' ? 'text-green-700' : trend === 'Worsening' ? 'text-red-700' : 'text-amber-700'}`}>{trend}</div>
            <div className="text-[10px] text-slate">prev: {p.previousScore}</div>
          </div>
        </div>

        {/* Sparkline */}
        <div className="flex-none hidden sm:block">
          <ScoreSparkline assessments={p.assessments} />
        </div>

        {/* Frequency / Next Due */}
        <div className="flex-1 min-w-0 hidden md:block">
          <div className="text-xs text-slate flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Next due: <span className="font-semibold text-navy">{p.nextDue.split(' ')[1]}</span>
            <span className="text-slate-400 ml-1">({p.frequency})</span>
          </div>
          <div className="text-[10px] text-slate mt-0.5">Ordered by {p.orderedBy}</div>
        </div>

        {/* Expand */}
        <div className="flex-none ml-auto">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate" /> : <ChevronDown className="w-4 h-4 text-slate" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border bg-slate-50 px-4 py-3 space-y-3">
          {/* Score history table */}
          <div>
            <div className="text-xs font-bold text-slate uppercase tracking-wider mb-2">Score History (Most Recent)</div>
            <div className="flex gap-2 flex-wrap">
              {p.assessments.map((a, i) => (
                <div key={i} className={`text-center px-2 py-1.5 rounded border ${SEVERITY_COLORS[getSeverity(a.score, p.protocol)].border} ${SEVERITY_COLORS[getSeverity(a.score, p.protocol)].bg}`}>
                  <div className={`text-lg font-bold ${SEVERITY_COLORS[getSeverity(a.score, p.protocol)].text}`}>{a.score}</div>
                  <div className="text-[10px] text-slate">{a.timestamp.split(' ')[1]}</div>
                  <div className="text-[10px] text-slate-400">{a.timestamp.split(' ')[0].replace('2026-07-', '7/')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical note */}
          <div className="bg-white border border-border rounded p-3">
            <div className="text-xs font-bold text-slate uppercase tracking-wider mb-1">Clinical Notes</div>
            <p className="text-sm text-navy">{p.notes}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <LockedButton
              locked={readOnly}
              className="px-3 py-1.5 bg-sunrise-blue text-white text-xs font-semibold rounded hover:bg-sunrise-blue-light"
              onClick={() => navigate('NursingMAR')}
            >
              Enter New Score
            </LockedButton>
            <button
              className="px-3 py-1.5 border border-border text-xs font-semibold rounded hover:bg-white text-slate"
              onClick={() => navigate('PatientDetail', p.patientId)}
            >
              View Full Chart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WithdrawalMonitor({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'CIWA-Ar' | 'COWS' | 'All' | 'Trend' | 'Protocol Library' | 'Medication Reference'>('All');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newAssessOpen, setNewAssessOpen] = useState(false);
  const [assessSaved, setAssessSaved] = useState(false);
  const [wdActionSaved, setWdActionSaved] = useState<string | null>(null);
  const saveAssessAction = (msg: string) => { setWdActionSaved(msg); setTimeout(() => setWdActionSaved(null), 2500); };

  const allProtocols = [...COWS_ASSESSMENTS, ...CIWA_ASSESSMENTS];
  const displayed = tab === 'All' ? allProtocols
    : tab === 'CIWA-Ar' ? CIWA_ASSESSMENTS
    : COWS_ASSESSMENTS;

  // Sort: alerts first, then by score descending
  const sorted = [...displayed].sort((a, b) => {
    const aAlert = a.currentScore >= a.alertThreshold ? 1 : 0;
    const bAlert = b.currentScore >= b.alertThreshold ? 1 : 0;
    if (bAlert !== aAlert) return bAlert - aAlert;
    return b.currentScore - a.currentScore;
  });

  const alertCount = allProtocols.filter(p => p.currentScore >= p.alertThreshold).length;
  const ciwaCount = CIWA_ASSESSMENTS.length;
  const cowsCount = COWS_ASSESSMENTS.length;

  // Summary stats
  const dangerCount = allProtocols.filter(p => getSeverity(p.currentScore, p.protocol) === 'Danger').length;
  const severeCount = allProtocols.filter(p => getSeverity(p.currentScore, p.protocol) === 'Severe').length;
  const improvingCount = allProtocols.filter(p => getTrend(p.currentScore, p.previousScore) === 'Improving').length;

  const SUBSCALES = tab === 'CIWA-Ar' ? CIWA_SUBSCALES : tab === 'COWS' ? COWS_SUBSCALES : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Activity className="w-6 h-6 text-sunrise-blue" /> Withdrawal Monitor
          </h1>
          <p className="text-slate text-sm mt-1">
            CIWA-Ar (alcohol) and COWS (opioid) withdrawal scoring — real-time alerts and trend tracking
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => saveAssessAction('Scores refreshed')} className="px-3 py-1.5 border border-border rounded text-sm font-medium text-slate hover:bg-slate-50 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <LockedButton locked={readOnly} onClick={() => setNewAssessOpen(true)} className="px-3 py-1.5 bg-sunrise-blue text-white rounded text-sm font-medium hover:bg-sunrise-blue-light">
            + New Assessment
          </LockedButton>
        </div>
      </div>

      {/* Alert banner */}
      {alertCount > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-none" />
          <div>
            <span className="font-bold text-red-800">{alertCount} patient{alertCount > 1 ? 's' : ''} at or above alert threshold</span>
            <span className="text-red-700 ml-2 text-sm">— physician notification required per protocol</span>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Active Protocols', value: allProtocols.length, color: 'text-navy', border: 'border-slate-200' },
          { label: 'CIWA-Ar', value: ciwaCount, color: 'text-sunrise-blue', border: 'border-sunrise-blue/40' },
          { label: 'COWS', value: cowsCount, color: 'text-purple-700', border: 'border-purple-300' },
          { label: 'Severe / Danger', value: dangerCount + severeCount, color: 'text-critical', border: 'border-critical/30' },
          { label: 'Trending ↓', value: improvingCount, color: 'text-success', border: 'border-success/30' },
        ].map(k => (
          <div key={k.label} className={`bg-white border-l-4 ${k.border} rounded-lg shadow-sm p-4`}>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Severity reference */}
      <div className="bg-white border border-border rounded-lg p-4">
        <div className="text-xs font-bold text-slate uppercase tracking-wider mb-3">Severity Reference</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { level: 'Mild', ciwa: '≤ 7', cows: '≤ 5', action: 'Monitor per protocol frequency', color: 'bg-green-50 border-green-200 text-green-800' },
            { level: 'Moderate', ciwa: '8–14', cows: '6–12', action: 'Consider PRN medication; notify MD if no improvement', color: 'bg-amber-50 border-amber-200 text-amber-800' },
            { level: 'Severe', ciwa: '15–19', cows: '13–24', action: 'Notify MD immediately; increase monitoring to Q2H', color: 'bg-orange-50 border-orange-200 text-orange-800' },
            { level: 'Danger', ciwa: '≥ 20', cows: '≥ 25', action: 'Emergency protocol — MD to bedside; consider hospital transfer', color: 'bg-red-50 border-red-200 text-red-800' },
          ].map(r => (
            <div key={r.level} className={`border rounded-lg p-3 ${r.color}`}>
              <div className="font-bold text-sm mb-1">{r.level}</div>
              <div className="mb-1">CIWA: {r.ciwa} · COWS: {r.cows}</div>
              <div className="text-xs opacity-80">{r.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="flex border-b border-border">
          {(['All', 'CIWA-Ar', 'COWS', 'Trend', 'Protocol Library', 'Medication Reference'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === t ? 'border-sunrise-orange text-sunrise-orange bg-sunrise-orange/5' : 'border-transparent text-slate hover:text-navy'}`}
            >
              {t === 'All' ? `All Patients (${allProtocols.length})` : t === 'CIWA-Ar' ? `CIWA-Ar — Alcohol (${ciwaCount})` : `COWS — Opioid (${cowsCount})`}
            </button>
          ))}

          {/* Protocol reference toggle */}
          {SUBSCALES && (
            <div className="ml-auto px-4 py-2 flex items-center">
              <span className="text-xs text-slate">
                {tab} max score: <strong>{tab === 'CIWA-Ar' ? '67' : '36'}</strong>
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-slate">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-success" />
              <div className="font-semibold text-navy">No active withdrawal protocols</div>
            </div>
          ) : (
            sorted.map(p => (
              <PatientRow
                key={p.patientId}
                p={p}
                navigate={navigate}
                expanded={expanded === p.patientId}
                onToggle={() => setExpanded(expanded === p.patientId ? null : p.patientId)}
                readOnly={readOnly}
              />
            ))
          )}
        </div>
      </div>

      {/* Subscale reference (only when specific protocol tab selected) */}
      {SUBSCALES && (
        <div className="bg-white border border-border rounded-lg p-4 shadow-sm">
          <div className="text-xs font-bold text-slate uppercase tracking-wider mb-3">{tab} Subscales — Scoring Reference</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {SUBSCALES.map(s => (
              <div key={s.code} className="border border-border rounded p-2 text-center">
                <div className="text-xs font-bold text-slate-500 uppercase mb-0.5">{s.code}</div>
                <div className="text-xs text-navy">{s.name}</div>
                <div className="text-xs text-slate mt-1">0–{s.max}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Trend' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Active Protocols', value: [...COWS_ASSESSMENTS, ...CIWA_ASSESSMENTS].length, sub: 'CIWA-Ar + COWS combined', color: 'text-navy' },
              { label: 'Alerts Today', value: [...COWS_ASSESSMENTS, ...CIWA_ASSESSMENTS].filter(p => p.currentScore >= p.alertThreshold).length, sub: 'Require physician review', color: 'text-red-600' },
              { label: 'Avg CIWA Score', value: Math.round(CIWA_ASSESSMENTS.reduce((a, p) => a + p.currentScore, 0) / Math.max(CIWA_ASSESSMENTS.length, 1)), sub: 'Census average', color: 'text-navy' },
              { label: 'Avg COWS Score', value: Math.round(COWS_ASSESSMENTS.reduce((a, p) => a + p.currentScore, 0) / Math.max(COWS_ASSESSMENTS.length, 1)), sub: 'Census average', color: 'text-navy' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">CIWA-Ar Assessment History</h3>
              <div className="space-y-4">
                {CIWA_ASSESSMENTS.map(p => {
                  const scores = [...p.assessments].reverse();
                  const max = Math.max(...scores.map((a: Assessment) => a.score), 20);
                  return (
                    <div key={p.patientId}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-navy">{p.patientName}</span>
                        <span className={`font-bold ${p.currentScore >= p.alertThreshold ? 'text-red-600' : p.currentScore >= 8 ? 'text-amber-600' : 'text-green-600'}`}>{p.currentScore}</span>
                      </div>
                      <div className="flex items-end gap-0.5 h-10">
                        {scores.map((a: Assessment, i: number) => (
                          <div key={i} className="flex-1 flex flex-col justify-end" title={`${a.timestamp}: ${a.score}`}>
                            <div
                              className={`rounded-t ${a.score >= p.alertThreshold ? 'bg-red-500' : a.score >= 8 ? 'bg-amber-400' : 'bg-green-400'}`}
                              style={{ height: `${(a.score / max) * 100}%`, minHeight: a.score > 0 ? '2px' : '0' }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="text-[9px] text-slate mt-0.5">{scores.length} assessments on record</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">COWS Assessment History</h3>
              <div className="space-y-4">
                {COWS_ASSESSMENTS.map(p => {
                  const scores = [...p.assessments].reverse();
                  const max = Math.max(...scores.map((a: Assessment) => a.score), 20);
                  return (
                    <div key={p.patientId}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-navy">{p.patientName}</span>
                        <span className={`font-bold ${p.currentScore >= p.alertThreshold ? 'text-red-600' : p.currentScore >= 13 ? 'text-amber-600' : 'text-green-600'}`}>{p.currentScore}</span>
                      </div>
                      <div className="flex items-end gap-0.5 h-10">
                        {scores.map((a: Assessment, i: number) => (
                          <div key={i} className="flex-1 flex flex-col justify-end" title={`${a.timestamp}: ${a.score}`}>
                            <div
                              className={`rounded-t ${a.score >= p.alertThreshold ? 'bg-red-500' : a.score >= 13 ? 'bg-amber-400' : 'bg-green-400'}`}
                              style={{ height: `${(a.score / max) * 100}%`, minHeight: a.score > 0 ? '2px' : '0' }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="text-[9px] text-slate mt-0.5">{scores.length} assessments on record</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-navy text-sm mb-2">Scoring Thresholds Reference</h3>
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <div className="font-bold text-navy mb-2">CIWA-Ar (Alcohol Withdrawal)</div>
                <div className="space-y-1.5">
                  {[
                    { range: '< 8', severity: 'Absent / Minimal', action: 'Monitor q8h', color: 'text-green-700' },
                    { range: '8-14', severity: 'Mild to Moderate', action: 'Monitor q4h, PRN meds per order', color: 'text-amber-700' },
                    { range: '15-20', severity: 'Moderate to Severe', action: 'Notify physician, consider Librium taper', color: 'text-orange-700' },
                    { range: '> 20', severity: 'Severe / Seizure Risk', action: 'IMMEDIATE physician notification', color: 'text-red-700' },
                  ].map(r => (
                    <div key={r.range} className="flex gap-2">
                      <span className="font-mono font-bold text-navy w-12 shrink-0">{r.range}</span>
                      <span className={`font-semibold ${r.color}`}>{r.severity}</span>
                      <span className="text-slate">-- {r.action}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-bold text-navy mb-2">COWS (Opioid Withdrawal)</div>
                <div className="space-y-1.5">
                  {[
                    { range: '5-12', severity: 'Mild withdrawal', action: 'Comfort measures, monitor q4h', color: 'text-green-700' },
                    { range: '13-24', severity: 'Moderate withdrawal', action: 'Notify physician, symptomatic meds', color: 'text-amber-700' },
                    { range: '25-36', severity: 'Moderately Severe', action: 'Physician evaluation required', color: 'text-orange-700' },
                    { range: '> 36', severity: 'Severe withdrawal', action: 'IMMEDIATE notification, induction review', color: 'text-red-700' },
                  ].map(r => (
                    <div key={r.range} className="flex gap-2">
                      <span className="font-mono font-bold text-navy w-12 shrink-0">{r.range}</span>
                      <span className={`font-semibold ${r.color}`}>{r.severity}</span>
                      <span className="text-slate">-- {r.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Protocol Library' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Nursing quick-reference for CIWA-Ar and COWS protocols, scoring interpretation, and medication algorithms.</div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3 flex items-center gap-2">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">CIWA-Ar</span>
                Alcohol Withdrawal — Scoring Guide
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { range: '0–7', label: 'Minimal', action: 'Q8H checks; oral hydration; thiamine; vitamins', color: 'bg-green-100 text-green-700' },
                  { range: '8–14', label: 'Mild', action: 'Q4–6H checks; consider Librium PRN per orders; thiamine IM', color: 'bg-yellow-100 text-yellow-700' },
                  { range: '15–19', label: 'Moderate', action: 'Q2H checks; standing BZD; 1:1 nursing; physician eval', color: 'bg-amber-100 text-amber-700' },
                  { range: '≥20', label: 'Severe / DT Risk', action: 'IMMEDIATE physician notification; Q1H; IV access; consider hospital transfer', color: 'bg-red-100 text-red-700' },
                ].map(r => (
                  <div key={r.range} className={`flex gap-3 p-2 rounded-lg ${r.color}`}>
                    <div className="font-bold shrink-0 w-12">{r.range}</div>
                    <div><div className="font-semibold">{r.label}</div><div className="text-[10px] mt-0.5 opacity-90">{r.action}</div></div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs">
                <div className="font-semibold text-navy mb-1">10 CIWA-Ar Subscales (max score 67)</div>
                <div className="grid grid-cols-2 gap-1 text-slate">
                  {['Nausea/Vomiting (0–7)', 'Tremor (0–7)', 'Paroxysmal Sweats (0–7)', 'Anxiety (0–7)', 'Agitation (0–7)', 'Tactile Disturbances (0–7)', 'Auditory Disturbances (0–7)', 'Visual Disturbances (0–7)', 'Headache (0–7)', 'Orientation (0–4)'].map(s => (
                    <div key={s} className="text-[10px]">• {s}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">COWS</span>
                Opioid Withdrawal — Scoring Guide
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { range: '0–4', label: 'Not in Withdrawal', action: 'Observation only — not in sufficient withdrawal for Suboxone induction (risk of precipitated withdrawal)', color: 'bg-green-100 text-green-700' },
                  { range: '5–12', label: 'Mild', action: 'Monitor Q4H; comfort meds (Clonidine, Imodium); induction may begin with physician approval', color: 'bg-yellow-100 text-yellow-700' },
                  { range: '13–24', label: 'Moderate', action: 'Buprenorphine induction appropriate; Q2H COWS; comfort medications ordered', color: 'bg-amber-100 text-amber-700' },
                  { range: '25–36', label: 'Moderately Severe', action: 'Urgent MAT consult; Q1H COWS; standing Buprenorphine; IV fluids', color: 'bg-orange-100 text-orange-700' },
                  { range: '≥37', label: 'Severe', action: 'IMMEDIATE physician eval; consider higher LOC; continuous monitoring', color: 'bg-red-100 text-red-700' },
                ].map(r => (
                  <div key={r.range} className={`flex gap-3 p-2 rounded-lg ${r.color}`}>
                    <div className="font-bold shrink-0 w-12">{r.range}</div>
                    <div><div className="font-semibold">{r.label}</div><div className="text-[10px] mt-0.5 opacity-90">{r.action}</div></div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs">
                <div className="font-semibold text-navy mb-1">11 COWS Subscales (max score 48)</div>
                <div className="grid grid-cols-2 gap-1 text-slate">
                  {['Resting Pulse (0–5)', 'Sweating (0–4)', 'Restlessness (0–5)', 'Pupil Size (0–5)', 'Bone/Joint Aches (0–4)', 'Runny Nose/Tearing (0–4)', 'GI Upset (0–5)', 'Tremor (0–4)', 'Yawning (0–4)', 'Anxiety/Irritability (0–5)', 'Gooseflesh Skin (0–5)'].map(s => (
                    <div key={s} className="text-[10px]">• {s}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Nursing Monitoring Frequency — Decision Algorithm</h3>
            <div className="grid grid-cols-3 gap-4 text-xs">
              {[
                { phase: 'Admission (0–2 hrs)', steps: ['Vitals: BP, HR, RR, Temp, SpO₂', 'Initial CIWA-Ar or COWS within 2 hours', 'Review last use date and substances used', 'Labs: CMP, CBC, LFTs, UDS', 'Thiamine 100mg IM before any glucose', 'Physician notification of initial score', 'IV access if CIWA ≥ 15 or COWS ≥ 25'] },
                { phase: 'Active Protocol Monitoring', steps: ['Reassess per score-driven frequency', 'Document all PRN administrations with score', 'Monitor: tremor, diaphoresis, hallucinations, seizure activity', 'Offer oral fluids and nutritional support', 'Communicate score changes to charge RN and MD', 'Re-baseline if score increases by ≥ 5 points'] },
                { phase: 'Discontinuation Criteria', steps: ['CIWA-Ar < 8 for 3 consecutive assessments, OR', 'COWS < 5 for 3 consecutive assessments', 'No acute withdrawal symptoms present', 'MAT dose stabilized (Suboxone or Methadone confirmed)', 'Physician documents protocol discontinuation', 'Transition to standard vital sign frequency'] },
              ].map(section => (
                <div key={section.phase}>
                  <div className="font-semibold text-navy mb-2">{section.phase}</div>
                  <div className="space-y-1">
                    {section.steps.map(step => (
                      <div key={step} className="flex items-start gap-1.5 text-slate">
                        <span className="text-orange shrink-0 mt-0.5">◉</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Medication Reference' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Evidence-based pharmacotherapy reference for alcohol and opioid withdrawal management — dosing protocols, monitoring parameters, and clinical decision support.</div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Alcohol Withdrawal (CIWA-Ar Protocol) — Medication Reference</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Medication', 'Class', 'CIWA-Ar Threshold', 'Typical Dose', 'Max/24h', 'Key Monitoring', 'Notes'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { med: 'Diazepam (Valium)', cls: 'Benzodiazepine', thresh: '≥8 (symptom-triggered)', dose: '10–20 mg PO q1–2h PRN', max: '100 mg', monitor: 'Sedation, respiratory rate, HR', notes: 'First-line; long half-life reduces kindling risk' },
                  { med: 'Lorazepam (Ativan)', cls: 'Benzodiazepine', thresh: '≥8 (symptom-triggered)', dose: '1–4 mg IV/PO q1–2h PRN', max: '40 mg/day', monitor: 'Resp rate, BP, O2 sat', notes: 'Preferred in hepatic impairment (no active metabolites)' },
                  { med: 'Chlordiazepoxide (Librium)', cls: 'Benzodiazepine', thresh: '≥8', dose: '25–100 mg PO q6h fixed schedule', max: '400 mg/day', monitor: 'Sedation, HR, seizure signs', notes: 'Fixed-schedule option for predictable taper' },
                  { med: 'Phenobarbital', cls: 'Barbiturate', thresh: 'BZD-refractory or severe', dose: '65–130 mg IV q15–30 min', max: 'Per anesthesia consult', monitor: 'Resp, BP, airway', notes: 'Reserve for ICU-level or BZD-resistant withdrawal' },
                  { med: 'Thiamine (B1)', cls: 'Vitamin', thresh: 'All alcohol withdrawal patients', dose: '100–500 mg IV/IM × 3 days', max: '—', monitor: 'Neuro exam', notes: 'Administer BEFORE glucose — prevents Wernicke\'s encephalopathy' },
                ].map(r => (
                  <tr key={r.med} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-navy">{r.med}</td>
                    <td className="px-3 py-2 text-slate">{r.cls}</td>
                    <td className="px-3 py-2 text-blue-700 font-medium">{r.thresh}</td>
                    <td className="px-3 py-2 text-navy">{r.dose}</td>
                    <td className="px-3 py-2 text-red-700 font-medium">{r.max}</td>
                    <td className="px-3 py-2 text-slate">{r.monitor}</td>
                    <td className="px-3 py-2 text-slate italic">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Opioid Withdrawal (COWS Protocol) — Medication Reference</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Medication', 'Class', 'COWS Threshold', 'Typical Dose', 'Key Monitoring', 'Notes'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { med: 'Buprenorphine/Naloxone (Suboxone)', cls: 'Partial μ-agonist', thresh: 'COWS ≥8–12', dose: '4–8 mg SL, titrate q1–2h up to 16 mg Day 1', monitor: 'COWS score, sedation, diversion risk', notes: 'Wait for COWS ≥8 before first dose — prevents precipitated withdrawal' },
                  { med: 'Methadone (in-OTP only)', cls: 'Full μ-agonist', thresh: 'COWS ≥8', dose: '20–30 mg PO, +10 mg if needed', monitor: 'QTc (baseline ECG required), HR, BP', notes: 'Restricted to licensed OTP; QTc >500 ms — contraindicated' },
                  { med: 'Clonidine (Catapres)', cls: 'α2-agonist', thresh: 'Any COWS — adjunct', dose: '0.1–0.3 mg PO q6–8h PRN', monitor: 'BP (hold if SBP <90)', notes: 'Non-opioid; treats ANS symptoms (sweating, anxiety, cramps); not for cravings' },
                  { med: 'Loperamide (Imodium)', cls: 'Peripheral opioid agonist', thresh: 'GI symptoms', dose: '4 mg initial, 2 mg q4h PRN', monitor: 'Bowel function, abdominal exam', notes: 'For diarrhea/cramping only; does not cross BBB at therapeutic doses' },
                  { med: 'Ondansetron (Zofran)', cls: '5-HT3 antagonist', thresh: 'Nausea/vomiting', dose: '4 mg IV/PO q6h PRN', monitor: 'QTc if combined with methadone', notes: 'First-line antiemetic during opioid withdrawal management' },
                ].map(r => (
                  <tr key={r.med} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-navy">{r.med}</td>
                    <td className="px-3 py-2 text-slate">{r.cls}</td>
                    <td className="px-3 py-2 text-blue-700 font-medium">{r.thresh}</td>
                    <td className="px-3 py-2 text-navy">{r.dose}</td>
                    <td className="px-3 py-2 text-slate">{r.monitor}</td>
                    <td className="px-3 py-2 text-slate italic">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {newAssessOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setNewAssessOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[500px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-navy">New Withdrawal Assessment</h2>
              <button onClick={() => setNewAssessOpen(false)} className="text-slate hover:text-navy"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    {MOCK_PATIENTS.map(p => <option key={p.id}>{p.firstName} {p.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Protocol *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>COWS (Opioid Withdrawal)</option><option>CIWA-Ar (Alcohol Withdrawal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Assessment Time</label>
                  <input type="time" defaultValue="14:00" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Clinician</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Jessica Torres, RN</option><option>Michael Boyd, RN</option><option>Dr. Robert Chen</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Score (0–67 COWS · 0–67 CIWA)</label>
                <input type="number" min={0} max={67} className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Enter total score" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Clinical Notes</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none" placeholder="VS, symptoms, interventions, physician notification..." />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setNewAssessOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setNewAssessOpen(false); setAssessSaved(true); setTimeout(() => setAssessSaved(false), 2500); }} className="flex-1 bg-sunrise-blue text-white rounded-xl py-2.5 text-sm font-semibold">Save Assessment</button>
            </div>
          </div>
        </div>
      )}

      {assessSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> Assessment documented
        </div>
      )}
      {wdActionSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <span>✓</span> {wdActionSaved}
        </div>
      )}
    </div>
  );
}
