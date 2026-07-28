import React, { useState, useRef, useEffect } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { LockedButton } from '../components/common/LockedButton';
import {
  CheckCircle, AlertTriangle, ChevronDown, ChevronUp, X, Shield,
  FileText, User, Phone, Save, ClipboardList
} from 'lucide-react';

interface Props { navigate: (s: Screen, id?: string) => void; readOnly?: boolean; }

// ─── PHQ-9 ────────────────────────────────────────────────────────────────────
const PHQ9_ITEMS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed — or being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself in some way',
];
const PHQ9_OPTS = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];
function getPhq9Risk(s: number) {
  if (s >= 20) return { label: 'Severe', color: 'text-red-700', bg: 'bg-red-100 border-red-300' };
  if (s >= 15) return { label: 'Moderately Severe', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-300' };
  if (s >= 10) return { label: 'Moderate', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' };
  if (s >= 5)  return { label: 'Mild', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300' };
  return { label: 'Minimal / None', color: 'text-green-700', bg: 'bg-green-100 border-green-300' };
}

// ─── DAST-10 ──────────────────────────────────────────────────────────────────
const DAST10_ITEMS = [
  { q: 'Have you used drugs other than those required for medical reasons?', reverse: false },
  { q: 'Do you abuse more than one drug at a time?', reverse: false },
  { q: 'Are you always able to stop using drugs when you want to?', reverse: true },
  { q: 'Have you had "blackouts" or "flashbacks" as a result of drug use?', reverse: false },
  { q: 'Do you ever feel bad or guilty about your drug use?', reverse: false },
  { q: 'Does your spouse (or parents) ever complain about your involvement with drugs?', reverse: false },
  { q: 'Have you neglected your family because of your use of drugs?', reverse: false },
  { q: 'Have you engaged in illegal activities in order to obtain drugs?', reverse: false },
  { q: 'Have you ever experienced withdrawal symptoms (felt sick) when you stopped taking drugs?', reverse: false },
  { q: 'Have you had medical problems as a result of your drug use (e.g., memory loss, hepatitis, convulsions, bleeding)?', reverse: false },
];
function dast10Risk(s: number) {
  if (s >= 9) return { label: 'Severe', color: 'text-red-700', bg: 'bg-red-100 border-red-300', action: 'Intensive assessment / treatment entry' };
  if (s >= 6) return { label: 'Substantial', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-300', action: 'Intensive assessment recommended' };
  if (s >= 3) return { label: 'Moderate', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300', action: 'Brief intervention / further assessment' };
  if (s >= 1) return { label: 'Low', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300', action: 'Monitor, basic education' };
  return { label: 'None', color: 'text-green-700', bg: 'bg-green-100 border-green-300', action: 'No intervention indicated at this time' };
}

// ─── MAST ─────────────────────────────────────────────────────────────────────
interface MASTItem { q: string; yesScore: number; reverse?: boolean; }
const MAST_ITEMS: MASTItem[] = [
  { q: 'Do you enjoy a drink now and then?', yesScore: 0 },
  { q: 'Do you feel you are a normal drinker? (By normal we mean you drink less than or as much as most other people.)', yesScore: 0, reverse: true },
  { q: 'Have you ever awakened the morning after some drinking the night before and found that you could not remember a part of the evening?', yesScore: 2 },
  { q: 'Does your wife, husband, a parent, or other near relative ever worry or complain about your drinking?', yesScore: 1 },
  { q: 'Can you stop drinking without a struggle after one or two drinks?', yesScore: 0, reverse: true },
  { q: 'Do you ever feel guilty about your drinking?', yesScore: 1 },
  { q: 'Do friends or relatives think you are a normal drinker?', yesScore: 0, reverse: true },
  { q: 'Are you able to stop drinking when you want to?', yesScore: 0, reverse: true },
  { q: 'Have you ever attended a meeting of Alcoholics Anonymous (AA)?', yesScore: 5 },
  { q: 'Have you gotten into physical fights when drinking?', yesScore: 1 },
  { q: 'Has your drinking ever created problems between you and your wife, husband, a parent, or other relative?', yesScore: 2 },
  { q: 'Has your wife, husband (or other family members) ever gone to anyone for help about your drinking?', yesScore: 2 },
  { q: 'Have you ever lost friends because of your drinking?', yesScore: 2 },
  { q: 'Have you ever gotten into trouble at work or school because of drinking?', yesScore: 2 },
  { q: 'Have you ever lost a job because of drinking?', yesScore: 2 },
  { q: 'Have you ever neglected your obligations, your family, or your work for two or more days in a row because you were drinking?', yesScore: 2 },
  { q: 'Do you drink before noon fairly often?', yesScore: 1 },
  { q: 'Have you ever been told you have liver trouble such as cirrhosis?', yesScore: 2 },
  { q: 'After heavy drinking have you ever had delirium tremens (DTs) or severe shaking, or heard voices or seen things that really weren\'t there?', yesScore: 2 },
  { q: 'Have you ever gone to anyone for help about your drinking?', yesScore: 5 },
  { q: 'Have you ever been hospitalized because of drinking?', yesScore: 5 },
  { q: 'Has your drinking ever resulted in your being hospitalized in a psychiatric ward?', yesScore: 2 },
  { q: 'Have you ever gone to any doctor, social worker, clergyman, or mental health clinic for help with any emotional problem in which drinking was part of the problem?', yesScore: 2 },
  { q: 'Have you been arrested more than once for driving under the influence of alcohol?', yesScore: 2 },
  { q: 'Have you ever been arrested, even for a few hours, because of other behavior while drinking?', yesScore: 2 },
];
// MAST scoring: 0–4 no problem, 5–6 suggestion of alcoholism, ≥7 probable alcoholism
function mastRisk(s: number) {
  if (s >= 7) return { label: 'Probable Alcohol Dependence', color: 'text-red-700', bg: 'bg-red-100 border-red-300' };
  if (s >= 5) return { label: 'Suggests Alcohol Dependence', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' };
  return { label: 'No Problem Indicated', color: 'text-green-700', bg: 'bg-green-100 border-green-300' };
}

// ─── SOGS ─────────────────────────────────────────────────────────────────────
const SOGS_ITEMS = [
  { q: 'When you gamble, how often do you go back another day to win back money you lost?', opts: ['Never', 'Some of the time (less than half the time) I lost', 'Most of the time I lost', 'Every time I lost'], scores: [0, 1, 1, 1] },
  { q: 'Have you ever claimed to be winning money gambling but weren\'t really?', opts: ['Never (or never gamble)', 'Yes, less than half the time I lost', 'Yes, most of the time'], scores: [0, 1, 1] },
  { q: 'Do you feel you have ever had a problem with betting money or gambling?', opts: ['No', 'Yes, in the past, but not now', 'Yes'], scores: [0, 1, 2] },
  { q: 'Did you ever gamble more than you intended to?', opts: ['Yes', 'No'], scores: [1, 0] },
  { q: 'Have people criticized your betting or told you that you had a gambling problem, regardless of whether or not you thought it was true?', opts: ['Yes', 'No'], scores: [1, 0] },
  { q: 'Have you ever felt guilty about the way you gamble or what happens when you gamble?', opts: ['Yes', 'No'], scores: [1, 0] },
  { q: 'Have you ever felt like you would like to stop betting money or gambling but didn\'t think you could?', opts: ['Yes', 'No'], scores: [1, 0] },
  { q: 'Have you ever hidden betting slips, lottery tickets, gambling money, or other signs of betting or gambling from your spouse, children, or other important people in your life?', opts: ['Yes', 'No'], scores: [1, 0] },
  { q: 'Have you ever argued with people you live with over how you handle money?', opts: ['Yes', 'No'], scores: [1, 0] },
  { q: 'Have you ever argued with people you live with over money or gambling?', opts: ['Yes', 'No'], scores: [1, 0] },
  { q: 'Have you ever borrowed from someone and not paid them back as a result of your gambling?', opts: ['Yes', 'No'], scores: [1, 0] },
  { q: 'Have you ever lost time from work (or school) due to betting money or gambling?', opts: ['Yes', 'No'], scores: [1, 0] },
  { q: 'If you borrowed money to gamble or to pay gambling debts, who or where did you borrow from? (Check all that apply)', multi: true, opts: ['From household money', 'From spouse', 'From other relatives or in-laws', 'From banks, loan companies, or credit unions', 'From credit cards', 'From loan sharks', 'You cashed in stocks, bonds, or other securities', 'You sold personal or family property', 'You borrowed on your checking account (passed bad checks)', 'You have (had) a credit line with a bookie', 'You have (had) a credit line with a casino'], scores: [1,1,1,1,1,1,1,1,1,1,1] },
];
function sogsRisk(s: number) {
  if (s >= 5) return { label: 'Probable Pathological Gambler', color: 'text-red-700', bg: 'bg-red-100 border-red-300' };
  if (s >= 2) return { label: 'Some Problem with Gambling', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' };
  if (s === 1) return { label: 'Non-Problem Gambler', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300' };
  return { label: 'No Problem Indicated', color: 'text-green-700', bg: 'bg-green-100 border-green-300' };
}

// ─── SAFE-T ───────────────────────────────────────────────────────────────────
const SAFET_RISK_FACTORS = [
  'Current suicidal ideation', 'Suicidal plan', 'Suicidal intent', 'Access to means (firearms, medications)',
  'Prior suicide attempt(s)', 'Recent psychiatric hospitalization', 'Current hopelessness',
  'Current severe anxiety / agitation', 'Substance use / intoxication', 'Active psychosis',
  'Recent major loss or psychosocial stressor', 'Family history of suicide', 'Limited social support',
  'Male gender + older age', 'Chronic pain / terminal illness',
];
const SAFET_PROTECTIVE = [
  'Strong reasons for living', 'Religious / spiritual beliefs against suicide',
  'Positive therapeutic alliance', 'Social support present', 'Children at home',
  'Fear of death or dying', 'Engaged in treatment', 'Future orientation',
];
type SafetRisk = 'Low' | 'Moderate' | 'High';

// ─── BAM ──────────────────────────────────────────────────────────────────────
const BAM_RISK_ITEMS = [
  { q: 'How many days in the past 30 days did you use alcohol?', scale: 10, label: 'Days used alcohol (0-30+)' },
  { q: 'How many days in the past 30 days did you use drugs (other than prescribed)?', scale: 10, label: 'Days used drugs (0-30+)' },
  { q: 'How many days in the past 30 days did you feel a strong craving for alcohol or drugs?', scale: 10, label: 'Craving days (0-30+)' },
  { q: 'In the past 30 days, how much has your substance use interfered with work, school, or daily activities?', scale: 10, label: '0 = Not at all · 10 = Severely' },
  { q: 'In the past 30 days, how much have your living conditions (housing stability, finances) caused stress?', scale: 10, label: '0 = Not at all · 10 = Severely' },
  { q: 'In the past 30 days, how much have legal issues been a problem for you?', scale: 10, label: '0 = Not at all · 10 = Severely' },
  { q: 'In the past 30 days, how often have you had thoughts of self-harm or suicide?', scale: 10, label: '0 = Never · 10 = Frequently' },
];
const BAM_PROTECTIVE_ITEMS = [
  { q: 'How confident are you that you can avoid alcohol / drug use?', label: '0 = Not confident · 10 = Completely confident' },
  { q: 'How much do you have people in your life who support your recovery?', label: '0 = No support · 10 = Strong support' },
  { q: 'How engaged are you in recovery-related activities (meetings, counseling, etc.)?', label: '0 = Not engaged · 10 = Fully engaged' },
  { q: 'How stable is your current living situation?', label: '0 = Very unstable · 10 = Very stable' },
  { q: 'How hopeful are you about your future?', label: '0 = Not hopeful · 10 = Very hopeful' },
  { q: 'How well are you managing stress without substances?', label: '0 = Not at all · 10 = Very well' },
  { q: 'How satisfied are you with your progress in recovery?', label: '0 = Not satisfied · 10 = Very satisfied' },
  { q: 'How often do you attend self-help / support group meetings (AA, NA, SMART, etc.)?', label: '0 = Never · 10 = Daily' },
  { q: 'How connected do you feel to your community or a support network?', label: '0 = Not connected · 10 = Highly connected' },
  { q: 'How motivated are you to maintain abstinence or reduce use?', label: '0 = Not motivated · 10 = Highly motivated' },
];

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
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
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
  };

  const endDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    onSigned(canvasRef.current!.toDataURL());
  };

  const clearSig = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
    onSigned('');
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate uppercase tracking-wide">{label}</span>
        {hasSig && <button onClick={clearSig} className="text-xs text-slate hover:text-red-600">Clear</button>}
      </div>
      <div className="border border-border rounded-lg overflow-hidden bg-gray-50">
        <canvas
          ref={canvasRef}
          width={400}
          height={80}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      {hasSig && <div className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Signature captured</div>}
    </div>
  );
}

// ─── Safety Contract Modal ───────────────────────────────────────────────────
function SafetyContractModal({ patientName, clinician, riskLevel, onClose, onSave }: {
  patientName: string; clinician: string; riskLevel: SafetRisk;
  onClose: () => void; onSave: () => void;
}) {
  const [clientSig, setClientSig] = useState('');
  const [clinicianSig, setClinicianSig] = useState('');
  const [commitments, setCommitments] = useState<string[]>([]);
  const [crisis1, setCrisis1] = useState('');
  const [crisis2, setCrisis2] = useState('');
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const toggleCommitment = (c: string) =>
    setCommitments(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[680px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className={`px-6 py-4 rounded-t-2xl flex items-center gap-3 ${riskLevel === 'High' ? 'bg-red-600' : 'bg-amber-500'}`}>
          <Shield className="w-6 h-6 text-white" />
          <div>
            <h2 className="text-lg font-bold text-white">Safety Contract — {riskLevel} Risk</h2>
            <p className="text-white/80 text-xs">This contract is a clinical tool and does not replace a comprehensive safety plan.</p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate">Patient:</span> <strong className="text-navy">{patientName}</strong></div>
            <div><span className="text-slate">Date:</span> <strong className="text-navy">{today}</strong></div>
            <div><span className="text-slate">Clinician:</span> <strong className="text-navy">{clinician}</strong></div>
            <div><span className="text-slate">SAFE-T Risk Level:</span> <strong className={riskLevel === 'High' ? 'text-red-600' : 'text-amber-600'}>{riskLevel}</strong></div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            <p className="font-semibold text-navy">Client Statement</p>
            <p className="text-slate leading-relaxed">
              I, <strong>{patientName}</strong>, agree that when I am having thoughts of harming myself, I will do the following before acting on those thoughts:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate pl-2">
              <li>Tell a staff member or trusted person immediately</li>
              <li>Call a crisis line if I cannot reach anyone in the program</li>
              <li>Go to the nearest emergency room if I feel I am in immediate danger</li>
              <li>Not access any means of self-harm (medications, weapons, etc.)</li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate uppercase mb-2">Client Commitments (check all that apply)</p>
            {['I agree to remove access to lethal means (medications, firearms, etc.)',
              'I will talk to my counselor before making any decision to leave the program',
              'I will attend all scheduled treatment sessions',
              'I will notify staff immediately if my suicidal ideation increases',
              'I agree to take medications as prescribed and not hoard them'
            ].map(c => (
              <label key={c} className="flex items-start gap-2 py-1.5 cursor-pointer">
                <input type="checkbox" checked={commitments.includes(c)} onChange={() => toggleCommitment(c)} className="mt-0.5 accent-navy" />
                <span className="text-sm text-navy">{c}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Crisis Contact 1 (name / number)</label>
              <input value={crisis1} onChange={e => setCrisis1(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. John Smith — 443-555-0192" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Crisis Contact 2 (name / number)</label>
              <input value={crisis2} onChange={e => setCrisis2(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Maria Jones — 301-555-0147" />
            </div>
          </div>

          <div className="bg-navy/5 rounded-xl p-4 text-xs text-navy space-y-1">
            <p className="font-bold text-sm">24-Hour Crisis Resources</p>
            <p>• 988 Suicide &amp; Crisis Lifeline — Call or text <strong>988</strong></p>
            <p>• Crisis Text Line — Text <strong>HOME</strong> to <strong>741741</strong></p>
            <p>• Maryland Crisis Hotline — <strong>1-800-422-0009</strong></p>
            <p>• Emergency services — <strong>911</strong></p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <SignatureCanvas label="Client Signature" onSigned={setClientSig} />
            <SignatureCanvas label="Clinician Signature" onSigned={setClinicianSig} />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Cancel</button>
          <button
            disabled={!clientSig || !clinicianSig}
            onClick={() => { if (clientSig && clinicianSig) onSave(); }}
            className="flex-1 bg-navy text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            Save &amp; Complete Safety Contract
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Instrument Wrapper ───────────────────────────────────────────────────────
function ScoreBadge({ label, score, maxScore, risk }: { label: string; score: number; maxScore: number; risk: { label: string; color: string; bg: string } }) {
  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center gap-4 ${risk.bg}`}>
      <div>
        <div className="text-xs font-semibold text-slate uppercase tracking-wide">{label} Score</div>
        <div className={`text-2xl font-bold ${risk.color}`}>{score} <span className="text-base font-normal text-slate">/ {maxScore}</span></div>
      </div>
      <div className={`text-sm font-semibold ${risk.color}`}>{risk.label}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type FormTab = 'PHQ-9' | 'DAST-10' | 'MAST' | 'SOGS' | 'SAFE-T' | 'BAM' | 'Summary';

const PATIENTS = MOCK_PATIENTS.filter(p => !p.id.startsWith('demo'));

export function ClinicalForms({ navigate: _navigate, readOnly }: Props) {
  const [selectedPatient, setSelectedPatient] = useState(PATIENTS[0]?.id ?? '');
  const [tab, setTab] = useState<FormTab>('PHQ-9');
  const [saved, setSaved] = useState<string | null>(null);
  const saveMsg = (m: string) => { setSaved(m); setTimeout(() => setSaved(null), 2500); };

  // PHQ-9 state
  const [phq9, setPhq9] = useState<(number | null)[]>(Array(9).fill(null));
  const [phq9FxImpair, setPhq9FxImpair] = useState('');
  const [phq9Done, setPhq9Done] = useState(false);

  // DAST-10 state
  const [dast, setDast] = useState<(boolean | null)[]>(Array(10).fill(null));
  const [dastDone, setDastDone] = useState(false);

  // MAST state
  const [mast, setMast] = useState<(boolean | null)[]>(Array(25).fill(null));
  const [mastDone, setMastDone] = useState(false);

  // SOGS state
  const [sogs, setSogs] = useState<(number | null)[]>(Array(SOGS_ITEMS.length).fill(null));
  const [sogsMulti, setSogsMulti] = useState<boolean[][]>(Array(SOGS_ITEMS.length).fill(null).map(() => []));
  const [sogsDone, setSogsDone] = useState(false);

  // SAFE-T state
  const [safetRiskFactors, setSafetRiskFactors] = useState<boolean[]>(Array(SAFET_RISK_FACTORS.length).fill(false));
  const [safetProtective, setSafetProtective] = useState<boolean[]>(Array(SAFET_PROTECTIVE.length).fill(false));
  const [safetIdeation, setSafetIdeation] = useState('');
  const [safetPlan, setSafetPlan] = useState('');
  const [safetIntent, setSafetIntent] = useState('');
  const [safetHistory, setSafetHistory] = useState('');
  const [safetRisk, setSafetRisk] = useState<SafetRisk | null>(null);
  const [safetActions, setSafetActions] = useState('');
  const [safetDone, setSafetDone] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [contractDone, setContractDone] = useState(false);

  // BAM state
  const [bamRisk, setBamRisk] = useState<(number | null)[]>(Array(BAM_RISK_ITEMS.length).fill(null));
  const [bamProtective, setBamProtective] = useState<(number | null)[]>(Array(BAM_PROTECTIVE_ITEMS.length).fill(null));
  const [bamDone, setBamDone] = useState(false);

  // ── Computed scores ──
  const phq9Score = phq9.reduce<number>((s, v) => s + (v ?? 0), 0);
  const phq9Risk = getPhq9Risk(phq9Score);

  const dastScore = dast.reduce<number>((s, v, i) => {
    if (v === null) return s;
    const item = DAST10_ITEMS[i];
    const answered = item.reverse ? !v : v;
    return s + (answered ? 1 : 0);
  }, 0);
  const dastRisk = dast10Risk(dastScore);

  const mastScore = mast.reduce<number>((s, v, i) => {
    if (v === null || i >= MAST_ITEMS.length) return s;
    const item = MAST_ITEMS[i];
    const scored = item.reverse ? !v : v;
    return s + (scored ? item.yesScore : 0);
  }, 0);
  const mastRiskVal = mastRisk(mastScore);

  const sogsScore = sogs.reduce<number>((s, v, i) => {
    const item = SOGS_ITEMS[i];
    if (item.multi) {
      return s + (sogsMulti[i] || []).filter(Boolean).length;
    }
    return s + (v !== null ? SOGS_ITEMS[i].scores[v] ?? 0 : 0);
  }, 0);
  const sogsRiskVal = sogsRisk(sogsScore);

  const bamRiskScore = bamRisk.reduce<number>((s, v) => s + (v ?? 0), 0);
  const bamProtectiveScore = bamProtective.reduce<number>((s, v) => s + (v ?? 0), 0);

  const patient = PATIENTS.find(p => p.id === selectedPatient);

  const tabs: FormTab[] = ['PHQ-9', 'DAST-10', 'MAST', 'SOGS', 'SAFE-T', 'BAM', 'Summary'];
  const completedForms = [phq9Done, dastDone, mastDone, sogsDone, safetDone, bamDone];
  const completedCount = completedForms.filter(Boolean).length;

  // Auto-show contract when SAFE-T marked as high/moderate risk on save
  useEffect(() => {
    if (safetDone && (safetRisk === 'High' || safetRisk === 'Moderate') && !contractDone) {
      setShowContract(true);
    }
  }, [safetDone, safetRisk, contractDone]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Clinical Intake Assessment Forms</h1>
          <p className="text-slate text-sm mt-0.5">PHQ-9 · DAST-10 · MAST · SOGS · SAFE-T · BAM — Complete at time of assessment</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate">Forms completed</div>
            <div className="text-lg font-bold text-navy">{completedCount} <span className="text-slate font-normal text-sm">/ 6</span></div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${completedCount === 6 ? 'bg-green-500' : 'bg-navy/20 text-navy'}`}>
            {completedCount === 6 ? '✓' : `${completedCount}/6`}
          </div>
        </div>
      </div>

      {/* Patient selector */}
      <div className="card flex items-center gap-4">
        <User className="w-5 h-5 text-orange shrink-0" />
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient</label>
          <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm max-w-xs">
            {PATIENTS.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.program}</option>)}
          </select>
        </div>
        {patient && (
          <div className="text-xs text-slate space-y-0.5 text-right">
            <div>DOB: <strong className="text-navy">{patient.dob ?? 'N/A'}</strong></div>
            <div>Counselor: <strong className="text-navy">{patient.counselor}</strong></div>
            <div>Admit: <strong className="text-navy">{patient.admitDate}</strong></div>
          </div>
        )}
      </div>

      {/* SAFE-T high-risk banner */}
      {safetDone && safetRisk === 'High' && !contractDone && (
        <div className="bg-red-50 border border-red-400 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-red-800">HIGH SUICIDE RISK — Safety Contract Required</div>
            <div className="text-sm text-red-700 mt-0.5">SAFE-T assessment indicates HIGH risk. A Contract for Safety must be completed and signed before the assessment is finalized.</div>
          </div>
          <button onClick={() => setShowContract(true)} className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-red-700 shrink-0">
            Open Contract
          </button>
        </div>
      )}
      {safetDone && safetRisk === 'Moderate' && !contractDone && (
        <div className="bg-amber-50 border border-amber-400 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-800">MODERATE SUICIDE RISK — Safety Contract Recommended</div>
            <div className="text-sm text-amber-700 mt-0.5">Clinical judgment indicates a Contract for Safety should be completed.</div>
          </div>
          <button onClick={() => setShowContract(true)} className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 shrink-0">
            Complete Contract
          </button>
        </div>
      )}
      {contractDone && (
        <div className="bg-green-50 border border-green-400 rounded-xl p-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <span className="text-sm text-green-800 font-medium">Safety Contract completed and signed — filed with {patient ? `${patient.firstName} ${patient.lastName}` : 'patient'}'s chart.</span>
          <button onClick={() => setShowContract(true)} className="ml-auto text-xs text-green-700 underline">View</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border overflow-x-auto no-scrollbar">
        {tabs.map((t, i) => {
          const isDone = t === 'Summary' ? false : completedForms[i];
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>
              {isDone && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />}
              {t}
            </button>
          );
        })}
      </div>

      {/* ── PHQ-9 ── */}
      {tab === 'PHQ-9' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-bold text-navy mb-1">Patient Health Questionnaire (PHQ-9)</h2>
            <p className="text-xs text-slate mb-4">Over the <strong>last 2 weeks</strong>, how often have you been bothered by any of the following problems?</p>
            <div className="space-y-3">
              {PHQ9_ITEMS.map((item, i) => (
                <div key={i} className={`rounded-xl border p-4 transition-colors ${phq9[i] !== null ? 'border-orange/30 bg-orange/5' : 'border-border'}`}>
                  <div className="text-sm text-navy mb-3"><span className="font-bold text-orange mr-2">{i + 1}.</span>{item}</div>
                  <div className="grid grid-cols-4 gap-2">
                    {PHQ9_OPTS.map((opt, j) => (
                      <button key={j} onClick={() => { if (!readOnly) { const n = [...phq9]; n[i] = j; setPhq9(n); } }}
                        disabled={readOnly}
                        className={`rounded-lg border text-xs py-2 px-1 text-center transition-colors ${phq9[i] === j ? 'border-orange bg-orange text-white font-semibold' : 'border-border hover:border-orange/50 text-slate'}`}>
                        <div className="font-bold text-base">{j}</div>
                        <div className="mt-0.5">{opt}</div>
                      </button>
                    ))}
                  </div>
                  {i === 8 && phq9[8] !== null && phq9[8]! > 0 && (
                    <div className="mt-2 text-xs text-red-700 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Item 9 positive — evaluate SAFE-T and document in SAFE-T tab
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-5">
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Functional Impairment (optional)</label>
              <p className="text-xs text-slate mb-1">If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?</p>
              <div className="flex gap-2 flex-wrap">
                {['Not difficult at all', 'Somewhat difficult', 'Very difficult', 'Extremely difficult'].map(opt => (
                  <button key={opt} onClick={() => { if (!readOnly) setPhq9FxImpair(opt); }}
                    disabled={readOnly}
                    className={`rounded-lg border text-xs px-3 py-1.5 transition-colors ${phq9FxImpair === opt ? 'border-orange bg-orange text-white font-semibold' : 'border-border text-slate hover:border-orange/50'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {phq9.filter(v => v !== null).length === 9 && (
            <div className="space-y-3">
              <ScoreBadge label="PHQ-9" score={phq9Score} maxScore={27} risk={phq9Risk} />
              <div className="text-xs text-slate">
                <strong>Scoring:</strong> 0–4 Minimal · 5–9 Mild · 10–14 Moderate · 15–19 Moderately Severe · 20–27 Severe
              </div>
              <LockedButton locked={readOnly || phq9Done}
                onClick={() => { setPhq9Done(true); saveMsg('PHQ-9 saved'); }}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
                <Save className="w-4 h-4" /> {phq9Done ? 'PHQ-9 Saved ✓' : 'Save PHQ-9'}
              </LockedButton>
            </div>
          )}
        </div>
      )}

      {/* ── DAST-10 ── */}
      {tab === 'DAST-10' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-bold text-navy mb-1">Drug Abuse Screening Test (DAST-10)</h2>
            <p className="text-xs text-slate mb-4">These questions refer to the past 12 months. Answer <strong>Yes</strong> or <strong>No</strong>.</p>
            <div className="space-y-3">
              {DAST10_ITEMS.map((item, i) => (
                <div key={i} className={`rounded-xl border p-4 transition-colors ${dast[i] !== null ? 'border-orange/30 bg-orange/5' : 'border-border'}`}>
                  <div className="text-sm text-navy mb-3"><span className="font-bold text-orange mr-2">{i + 1}.</span>{item.q}</div>
                  <div className="flex gap-3">
                    {['Yes', 'No'].map((opt, j) => (
                      <button key={opt} onClick={() => { if (!readOnly) { const n = [...dast]; n[i] = j === 0; setDast(n); } }}
                        disabled={readOnly}
                        className={`flex-1 rounded-lg border text-sm py-2 font-semibold transition-colors ${dast[i] === (j === 0) ? 'border-orange bg-orange text-white' : 'border-border text-slate hover:border-orange/50'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {dast.filter(v => v !== null).length === 10 && (
            <div className="space-y-3">
              <ScoreBadge label="DAST-10" score={dastScore} maxScore={10} risk={dastRisk} />
              <div className="text-xs text-slate"><strong>Clinical action:</strong> {dastRisk.action}</div>
              <LockedButton locked={readOnly || dastDone}
                onClick={() => { setDastDone(true); saveMsg('DAST-10 saved'); }}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
                <Save className="w-4 h-4" /> {dastDone ? 'DAST-10 Saved ✓' : 'Save DAST-10'}
              </LockedButton>
            </div>
          )}
        </div>
      )}

      {/* ── MAST ── */}
      {tab === 'MAST' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-bold text-navy mb-1">Michigan Alcoholism Screening Test (MAST)</h2>
            <p className="text-xs text-slate mb-4">Please answer <strong>Yes</strong> or <strong>No</strong> for each question. Consider your entire life when answering.</p>
            <div className="space-y-3">
              {MAST_ITEMS.map((item, i) => (
                <div key={i} className={`rounded-xl border p-4 transition-colors ${mast[i] !== null ? 'border-orange/30 bg-orange/5' : 'border-border'}`}>
                  <div className="text-sm text-navy mb-3"><span className="font-bold text-orange mr-2">{i + 1}.</span>{item.q}</div>
                  <div className="flex gap-3">
                    {['Yes', 'No'].map((opt, j) => (
                      <button key={opt} onClick={() => { if (!readOnly) { const n = [...mast]; n[i] = j === 0; setMast(n); } }}
                        disabled={readOnly}
                        className={`flex-1 rounded-lg border text-sm py-2 font-semibold transition-colors ${mast[i] === (j === 0) ? 'border-orange bg-orange text-white' : 'border-border text-slate hover:border-orange/50'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  {item.yesScore > 0 && <div className="mt-1 text-[10px] text-slate text-right">Weight: {item.yesScore}</div>}
                </div>
              ))}
            </div>
          </div>
          {mast.filter(v => v !== null).length === MAST_ITEMS.length && (
            <div className="space-y-3">
              <ScoreBadge label="MAST" score={mastScore} maxScore={53} risk={mastRiskVal} />
              <div className="text-xs text-slate"><strong>Scoring:</strong> 0–4 No problem · 5–6 Suggests alcohol dependence · ≥7 Probable alcohol dependence</div>
              <LockedButton locked={readOnly || mastDone}
                onClick={() => { setMastDone(true); saveMsg('MAST saved'); }}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
                <Save className="w-4 h-4" /> {mastDone ? 'MAST Saved ✓' : 'Save MAST'}
              </LockedButton>
            </div>
          )}
        </div>
      )}

      {/* ── SOGS ── */}
      {tab === 'SOGS' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-bold text-navy mb-1">South Oaks Gambling Screen (SOGS)</h2>
            <p className="text-xs text-slate mb-4">These questions deal with your gambling habits. Answer as honestly as possible.</p>
            <div className="space-y-4">
              {SOGS_ITEMS.map((item, i) => (
                <div key={i} className={`rounded-xl border p-4 ${sogs[i] !== null || (item.multi && sogsMulti[i]?.some(Boolean)) ? 'border-orange/30 bg-orange/5' : 'border-border'}`}>
                  <div className="text-sm text-navy mb-3"><span className="font-bold text-orange mr-2">{i + 1}.</span>{item.q}</div>
                  {item.multi ? (
                    <div className="space-y-1">
                      {item.opts.map((opt, j) => (
                        <label key={j} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox"
                            checked={sogsMulti[i]?.[j] ?? false}
                            onChange={() => {
                              if (readOnly) return;
                              const nArr = [...sogsMulti];
                              const row = [...(nArr[i] ?? [])];
                              row[j] = !row[j];
                              nArr[i] = row;
                              setSogsMulti(nArr);
                            }}
                            className="accent-orange" />
                          <span className="text-sm text-navy">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {item.opts.map((opt, j) => (
                        <button key={j} onClick={() => { if (!readOnly) { const n = [...sogs]; n[i] = j; setSogs(n); } }}
                          disabled={readOnly}
                          className={`rounded-lg border text-xs px-3 py-2 transition-colors ${sogs[i] === j ? 'border-orange bg-orange text-white font-semibold' : 'border-border text-slate hover:border-orange/50'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <ScoreBadge label="SOGS" score={sogsScore} maxScore={23} risk={sogsRiskVal} />
            <div className="text-xs text-slate"><strong>Scoring:</strong> 0 No problem · 1 Non-problem gambler · 2–4 Some problem · ≥5 Probable pathological gambler</div>
            <LockedButton locked={readOnly || sogsDone}
              onClick={() => { setSogsDone(true); saveMsg('SOGS saved'); }}
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
              <Save className="w-4 h-4" /> {sogsDone ? 'SOGS Saved ✓' : 'Save SOGS'}
            </LockedButton>
          </div>
        </div>
      )}

      {/* ── SAFE-T ── */}
      {tab === 'SAFE-T' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-navy">SAFE-T: Suicide Assessment Five-Step Evaluation &amp; Triage</h2>
              {safetRisk && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${safetRisk === 'High' ? 'bg-red-100 text-red-700' : safetRisk === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {safetRisk} Risk
                </span>
              )}
            </div>

            {/* Step 1: Risk Factors */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate uppercase tracking-wide border-b border-border pb-1">Step 1 — Identify Risk Factors</div>
              <div className="grid grid-cols-3 gap-2">
                {SAFET_RISK_FACTORS.map((f, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-border">
                    <input type="checkbox" checked={safetRiskFactors[i]}
                      onChange={() => { const n = [...safetRiskFactors]; n[i] = !n[i]; setSafetRiskFactors(n); }}
                      disabled={readOnly} className="accent-red-600" />
                    <span className="text-xs text-navy">{f}</span>
                  </label>
                ))}
              </div>

              {/* Step 2: Protective Factors */}
              <div className="text-xs font-bold text-slate uppercase tracking-wide border-b border-border pb-1 pt-2">Step 2 — Identify Protective Factors</div>
              <div className="grid grid-cols-2 gap-2">
                {SAFET_PROTECTIVE.map((f, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-border">
                    <input type="checkbox" checked={safetProtective[i]}
                      onChange={() => { const n = [...safetProtective]; n[i] = !n[i]; setSafetProtective(n); }}
                      disabled={readOnly} className="accent-green-600" />
                    <span className="text-xs text-navy">{f}</span>
                  </label>
                ))}
              </div>

              {/* Step 3: Suicidal Ideation/Behavior */}
              <div className="text-xs font-bold text-slate uppercase tracking-wide border-b border-border pb-1 pt-2">Step 3 — Conduct Suicide Inquiry</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Current Ideation (nature, frequency, duration, intensity)', safetIdeation, setSafetIdeation],
                  ['Suicidal Plan (method, access to means, time, place)', safetPlan, setSafetPlan],
                  ['Suicidal Intent (subjective expectation to act)', safetIntent, setSafetIntent],
                  ['History of Suicidal Behavior (prior attempts, lethality)', safetHistory, setSafetHistory],
                ].map(([label, val, setter]) => (
                  <div key={label as string}>
                    <label className="block text-xs font-semibold text-slate mb-1">{label as string}</label>
                    <textarea
                      value={val as string}
                      onChange={e => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                      disabled={readOnly}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[70px] resize-none"
                      placeholder="Clinician narrative..."
                    />
                  </div>
                ))}
              </div>

              {/* Step 4: Determine Risk Level */}
              <div className="text-xs font-bold text-slate uppercase tracking-wide border-b border-border pb-1 pt-2">Step 4 — Determine Risk Level &amp; Intervention</div>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { level: 'Low' as SafetRisk, desc: 'Ideation: none or low frequency, no plan/intent. No prior attempts. No significant acute risk factors.', color: 'border-green-400 bg-green-50', active: 'border-green-600 bg-green-100' },
                  { level: 'Moderate' as SafetRisk, desc: 'Ideation: frequent, no plan; or ideation with plan but no intent. Some risk factors present.', color: 'border-amber-400 bg-amber-50', active: 'border-amber-600 bg-amber-100' },
                  { level: 'High' as SafetRisk, desc: 'Ideation: severe with plan, intent, or means access. Prior attempt(s). Requires immediate safety intervention.', color: 'border-red-400 bg-red-50', active: 'border-red-600 bg-red-100' },
                ] as const).map(({ level, desc, color, active }) => (
                  <button key={level} onClick={() => { if (!readOnly) setSafetRisk(level); }}
                    disabled={readOnly}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${safetRisk === level ? active + ' shadow-sm' : color} hover:shadow`}>
                    <div className={`font-bold text-sm mb-1 ${level === 'High' ? 'text-red-700' : level === 'Moderate' ? 'text-amber-700' : 'text-green-700'}`}>{level} Risk</div>
                    <div className="text-xs text-slate leading-relaxed">{desc}</div>
                  </button>
                ))}
              </div>

              {/* Step 5: Documentation */}
              <div className="text-xs font-bold text-slate uppercase tracking-wide border-b border-border pb-1 pt-2">Step 5 — Document Assessment &amp; Interventions</div>
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">Clinical Actions &amp; Plan</label>
                <textarea value={safetActions} onChange={e => setSafetActions(e.target.value)} disabled={readOnly}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none"
                  placeholder="Document interventions: safety contract, means restriction counseling, hospitalization referral, frequency of monitoring, notification of treatment team, family contact plan..." />
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <LockedButton locked={readOnly || !safetRisk || safetDone}
              onClick={() => {
                setSafetDone(true);
                saveMsg('SAFE-T saved');
                if (safetRisk === 'High' || safetRisk === 'Moderate') setShowContract(true);
              }}
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
              <Save className="w-4 h-4" /> {safetDone ? 'SAFE-T Saved ✓' : 'Save SAFE-T Assessment'}
            </LockedButton>
            {safetRisk && (safetRisk === 'High' || safetRisk === 'Moderate') && (
              <button onClick={() => setShowContract(true)}
                className="flex items-center gap-2 border border-red-400 text-red-700 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-red-50">
                <Shield className="w-4 h-4" /> {contractDone ? 'View Safety Contract' : 'Complete Safety Contract'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── BAM ── */}
      {tab === 'BAM' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-bold text-navy mb-1">Brief Addiction Monitor (BAM)</h2>
            <p className="text-xs text-slate mb-4">Rate each item from <strong>0 to 10</strong> for the past 30 days.</p>

            <div className="text-xs font-bold text-red-700 uppercase tracking-wide mb-3 border-b border-border pb-1">Risk Items (Higher = More Risk)</div>
            <div className="space-y-4">
              {BAM_RISK_ITEMS.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="text-sm text-navy"><span className="font-bold text-orange mr-2">{i + 1}.</span>{item.q}</div>
                  <div className="text-xs text-slate">{item.label}</div>
                  <div className="flex gap-1">
                    {Array.from({ length: 11 }, (_, j) => (
                      <button key={j} onClick={() => { if (!readOnly) { const n = [...bamRisk]; n[i] = j; setBamRisk(n); } }}
                        disabled={readOnly}
                        className={`flex-1 rounded text-xs py-1.5 font-semibold transition-colors ${bamRisk[i] === j
                          ? j >= 8 ? 'bg-red-500 text-white' : j >= 5 ? 'bg-amber-500 text-white' : 'bg-orange text-white'
                          : 'border border-border text-slate hover:border-orange/50'}`}>
                        {j}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs font-bold text-green-700 uppercase tracking-wide mt-5 mb-3 border-b border-border pb-1">Protective Items (Higher = More Protective)</div>
            <div className="space-y-4">
              {BAM_PROTECTIVE_ITEMS.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="text-sm text-navy"><span className="font-bold text-orange mr-2">{i + 1}.</span>{item.q}</div>
                  <div className="text-xs text-slate">{item.label}</div>
                  <div className="flex gap-1">
                    {Array.from({ length: 11 }, (_, j) => (
                      <button key={j} onClick={() => { if (!readOnly) { const n = [...bamProtective]; n[i] = j; setBamProtective(n); } }}
                        disabled={readOnly}
                        className={`flex-1 rounded text-xs py-1.5 font-semibold transition-colors ${bamProtective[i] === j
                          ? j >= 7 ? 'bg-green-500 text-white' : j >= 4 ? 'bg-teal-500 text-white' : 'bg-orange text-white'
                          : 'border border-border text-slate hover:border-orange/50'}`}>
                        {j}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {bamRisk.every(v => v !== null) && bamProtective.every(v => v !== null) && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="card">
                  <div className="text-xs font-semibold text-slate uppercase">Risk Score Total</div>
                  <div className={`text-2xl font-bold mt-1 ${bamRiskScore >= 50 ? 'text-red-600' : bamRiskScore >= 30 ? 'text-amber-600' : 'text-green-600'}`}>{bamRiskScore} <span className="text-sm font-normal text-slate">/ 70</span></div>
                  <div className="text-xs text-slate">{bamRiskScore >= 50 ? 'High risk burden' : bamRiskScore >= 30 ? 'Moderate risk' : 'Low risk burden'}</div>
                </div>
                <div className="card">
                  <div className="text-xs font-semibold text-slate uppercase">Protective Score Total</div>
                  <div className={`text-2xl font-bold mt-1 ${bamProtectiveScore >= 70 ? 'text-green-600' : bamProtectiveScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{bamProtectiveScore} <span className="text-sm font-normal text-slate">/ 100</span></div>
                  <div className="text-xs text-slate">{bamProtectiveScore >= 70 ? 'Strong protective factors' : bamProtectiveScore >= 40 ? 'Moderate protective factors' : 'Low protective factors'}</div>
                </div>
              </div>
              <LockedButton locked={readOnly || bamDone}
                onClick={() => { setBamDone(true); saveMsg('BAM saved'); }}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
                <Save className="w-4 h-4" /> {bamDone ? 'BAM Saved ✓' : 'Save BAM'}
              </LockedButton>
            </div>
          )}
        </div>
      )}

      {/* ── Summary ── */}
      {tab === 'Summary' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-bold text-navy mb-4">Assessment Summary — {patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}</h2>
            <div className="space-y-3">
              {[
                { name: 'PHQ-9', done: phq9Done, score: phq9Score, max: 27, risk: phq9Risk.label, color: phq9Risk.color },
                { name: 'DAST-10', done: dastDone, score: dastScore, max: 10, risk: dastRisk.label, color: dastRisk.color },
                { name: 'MAST', done: mastDone, score: mastScore, max: 53, risk: mastRiskVal.label, color: mastRiskVal.color },
                { name: 'SOGS', done: sogsDone, score: sogsScore, max: 23, risk: sogsRiskVal.label, color: sogsRiskVal.color },
                { name: 'SAFE-T', done: safetDone, score: null, max: null, risk: safetRisk ?? 'Not completed', color: safetRisk === 'High' ? 'text-red-700' : safetRisk === 'Moderate' ? 'text-amber-700' : safetRisk === 'Low' ? 'text-green-700' : 'text-slate' },
                { name: 'BAM (Risk)', done: bamDone, score: bamRiskScore, max: 70, risk: bamRiskScore >= 50 ? 'High burden' : bamRiskScore >= 30 ? 'Moderate' : 'Low burden', color: bamRiskScore >= 50 ? 'text-red-700' : bamRiskScore >= 30 ? 'text-amber-700' : 'text-green-700' },
              ].map(item => (
                <div key={item.name} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {item.done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="font-semibold text-navy text-sm w-24">{item.name}</div>
                  {item.score !== null ? <div className="text-sm text-slate">{item.score} / {item.max}</div> : <div className="text-sm text-slate">—</div>}
                  <div className={`text-sm font-semibold ${item.color}`}>{item.risk}</div>
                  {item.name === 'SAFE-T' && (safetRisk === 'High' || safetRisk === 'Moderate') && (
                    <div className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${contractDone ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {contractDone ? 'Safety Contract ✓' : 'Safety Contract Required'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate">
            Completed {completedCount} of 6 forms · {completedCount < 6 && 'Complete all forms before finalizing assessment.'}
            {completedCount === 6 && <span className="text-green-700 font-semibold"> All assessments complete — ready for clinical review.</span>}
          </div>
        </div>
      )}

      {/* Safety contract modal */}
      {showContract && patient && (
        <SafetyContractModal
          patientName={`${patient.firstName} ${patient.lastName}`}
          clinician={patient.counselor ?? 'Clinician'}
          riskLevel={safetRisk ?? 'Moderate'}
          onClose={() => setShowContract(false)}
          onSave={() => { setContractDone(true); setShowContract(false); saveMsg('Safety contract signed and filed'); }}
        />
      )}

      {/* Save toast */}
      {saved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> {saved}
        </div>
      )}
    </div>
  );
}
