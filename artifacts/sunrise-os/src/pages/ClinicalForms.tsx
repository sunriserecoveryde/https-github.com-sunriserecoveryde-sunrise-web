import React, { useState, useRef, useEffect } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { LockedButton } from '../components/common/LockedButton';
import { useRole } from '../context/RoleContext';
import {
  CheckCircle, AlertTriangle, ChevronDown, ChevronUp, X, Shield,
  FileText, User, Phone, Save, ClipboardList, Lock, Plus, Trash2, AlertCircle,
} from 'lucide-react';
import { AiDraftAssist } from '../components/ui/AiDraftAssist';
import {
  generateScreeningNarrative,
  generateBPSDraft,
  type BPSContext,
} from '../lib/aiNoteEngine';

interface Props { navigate: (s: Screen, id?: string) => void; readOnly?: boolean; }

// ─── Admissions Screening constants ──────────────────────────────────────────
const SUBSTANCES = [
  'Alcohol', 'Heroin', 'Fentanyl / Illicit Opioids', 'Prescription Opioids',
  'Cocaine', 'Crack Cocaine', 'Methamphetamine / Amphetamines',
  'Marijuana / THC', 'Benzodiazepines', 'Gabapentin / Pregabalin',
  'MDMA / Ecstasy', 'Hallucinogens', 'Synthetic Cannabinoids (K2/Spice)',
  'Inhalants', 'Other',
];
const ROUTES = ['Oral', 'Intranasal (snort)', 'IV injection', 'IM injection', 'Smoked / Inhaled', 'Sublingual', 'Rectal', 'Transdermal', 'Other'];
const FREQ_OPTS = ['Daily', 'Multiple times daily', '4–6 days/week', '2–3 days/week', 'Weekly', 'A few times/month', 'Monthly or less'];
const LOC_OPTS = [
  'Outpatient (OP)', 'Intensive Outpatient (IOP)', 'Partial Hospitalization (PHP)',
  'Residential — Low Intensity (3.1)', 'Residential — High Intensity (3.3)',
  'Clinically Managed Medium Intensity (3.5)', 'Medically Monitored Inpatient (3.7)',
  'Medically Managed Intensive Inpatient (4)', 'Opioid Treatment Program (OTP/Methadone)',
  'MAT Clinic (Suboxone)', 'Detox', 'Other',
];
const CJ_TYPES = ['Probation', 'Parole', 'Drug Court', 'Pre-Trial Supervision', 'DUI/DWI Diversion', 'Drug Court (Juvenile)', 'Other'];
const INSURERS = [
  'Maryland Medicaid (MCO)', 'United Healthcare', 'Aetna', 'Cigna', 'BCBS Maryland',
  'CareFirst', 'Anthem', 'Medicare', 'Tricare', 'Self-Pay / Uninsured', 'Other',
];

type ProgramType = 'Residential' | 'Outpatient';
type ReferralSource = 'Treatment Program' | 'Home / Community' | 'Street / Unsheltered' | 'Incarceration / Corrections' | 'Emergency Department' | 'Detox' | '';

interface DrugEntry  { substance: string; route: string; frequency: string; lastUse: string; }
interface MedEntry   { name: string; dose: string; unit: string; frequency: string; prescriber: string; }
interface PriorTx    { facility: string; loc: string; dates: string; reason: string; }

const emptyDrug  = (): DrugEntry  => ({ substance: '', route: '', frequency: '', lastUse: '' });
const emptyMed   = (): MedEntry   => ({ name: '', dose: '', unit: 'mg', frequency: '', prescriber: '' });
const emptyPrior = (): PriorTx    => ({ facility: '', loc: '', dates: '', reason: '' });

/** Parse a dose value from a string (returns NaN if not parseable) */
function parseDose(s: string): number { return parseFloat(s.replace(/[^0-9.]/g, '')); }

/** Evaluate exclusionary and review flags from current screening state */
function calcExclusions(
  programType: ProgramType,
  medications: MedEntry[],
  ambulatoryStatus: string,
  psychosisHistory: string,
  currentPsychosisManaged: boolean,
  activeWarrant: boolean,
  pendingCharges: boolean,
  requiresMedicalDetox: boolean,
  medicalInstability: boolean,
): Array<{ key: string; label: string; fatal: boolean }> {
  const flags: Array<{ key: string; label: string; fatal: boolean }> = [];

  if (activeWarrant) {
    flags.push({ key: 'warrant', label: 'Active warrant outstanding — safety and legal risk precludes admission without resolution', fatal: true });
  }

  medications.forEach((m, idx) => {
    const nm = m.name.toLowerCase();
    const dose = parseDose(m.dose);
    if (!isNaN(dose)) {
      if ((nm.includes('gabapentin') || nm.includes('neurontin')) && dose > 900) {
        flags.push({ key: `gabapentin_${idx}`, label: `${m.name} ${dose}mg exceeds 900 mg/day policy maximum — physician review and order required before admission`, fatal: true });
      }
      if ((nm.includes('methadone') || nm.includes('dolophine')) && dose > 120) {
        flags.push({ key: `methadone_${idx}`, label: `Methadone ${dose}mg exceeds 120 mg/day policy maximum — medical director approval required`, fatal: true });
      }
    }
  });

  if (ambulatoryStatus === 'non-ambulatory' && programType === 'Outpatient') {
    flags.push({ key: 'ambulatory_op', label: 'Non-ambulatory status is exclusionary for outpatient level of care — consider residential placement', fatal: true });
  }
  if (ambulatoryStatus === 'non-ambulatory' && programType === 'Residential') {
    flags.push({ key: 'ambulatory_res', label: 'Non-ambulatory status requires nursing assessment and facility ADA review before residential admission', fatal: false });
  }

  if (psychosisHistory === 'current' && !currentPsychosisManaged) {
    flags.push({ key: 'psychosis_unmanaged', label: 'Active unmanaged psychosis — requires psychiatric stabilization prior to admission', fatal: true });
  }
  if (psychosisHistory === 'current' && currentPsychosisManaged) {
    flags.push({ key: 'psychosis_managed', label: 'Current managed psychosis — confirm psychiatric continuity of care plan before admission', fatal: false });
  }
  if (psychosisHistory === 'past') {
    flags.push({ key: 'psychosis_hx', label: 'History of psychosis documented — ensure psychiatric evaluation within 72 hours of admission', fatal: false });
  }

  if (requiresMedicalDetox) {
    flags.push({ key: 'detox', label: 'Client requires medical detoxification prior to residential/outpatient admission', fatal: true });
  }
  if (medicalInstability) {
    flags.push({ key: 'medical', label: 'Medical instability documented — requires medical clearance and physician sign-off before admission', fatal: true });
  }
  if (pendingCharges && !activeWarrant) {
    flags.push({ key: 'charges', label: 'Pending criminal charges — verify court/attorney release conditions are compatible with treatment schedule', fatal: false });
  }

  return flags;
}

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
const RF = {
  IDEATION: 0, PLAN: 1, INTENT: 2, ACCESS: 3, PRIOR_ATTEMPT: 4,
  HOSPITALIZATION: 5, HOPELESSNESS: 6, ANXIETY: 7, SUBSTANCE: 8,
  PSYCHOSIS: 9, LOSS: 10, FAMILY_HX: 11, ISOLATION: 12, DEMOGRAPHICS: 13, CHRONIC: 14,
} as const;
const RF_WEIGHTS: Record<number, number> = {
  [RF.INTENT]: 3, [RF.PLAN]: 2, [RF.IDEATION]: 2,
  [RF.ACCESS]: 2, [RF.PRIOR_ATTEMPT]: 3, [RF.HOSPITALIZATION]: 2,
  [RF.PSYCHOSIS]: 2, [RF.HOPELESSNESS]: 1.5,
};
const rfWeight = (i: number) => RF_WEIGHTS[i] ?? 1;

const SAFET_RISK_FACTORS: Array<{ label: string; critical?: boolean }> = [
  { label: 'Current suicidal ideation',               critical: true  },
  { label: 'Suicidal plan',                           critical: true  },
  { label: 'Suicidal intent',                         critical: true  },
  { label: 'Access to means (firearms, medications)', critical: true  },
  { label: 'Prior suicide attempt(s)',                critical: true  },
  { label: 'Recent psychiatric hospitalization' },
  { label: 'Current hopelessness' },
  { label: 'Current severe anxiety / agitation' },
  { label: 'Substance use / intoxication' },
  { label: 'Active psychosis' },
  { label: 'Recent major loss or psychosocial stressor' },
  { label: 'Family history of suicide' },
  { label: 'Limited social support' },
  { label: 'Male gender + older age' },
  { label: 'Chronic pain / terminal illness' },
];
const SAFET_PROTECTIVE: Array<{ label: string; weight: number }> = [
  { label: 'Strong reasons for living',                      weight: 2   },
  { label: 'Religious / spiritual beliefs against suicide',  weight: 1.5 },
  { label: 'Positive therapeutic alliance',                  weight: 1.5 },
  { label: 'Social support present',                         weight: 2   },
  { label: 'Children at home',                               weight: 1   },
  { label: 'Fear of death or dying',                         weight: 1   },
  { label: 'Engaged in treatment',                           weight: 1.5 },
  { label: 'Future orientation',                             weight: 1.5 },
];
type SafetRisk = 'Low' | 'Moderate' | 'High';
function calcSafetRisk(rf: boolean[], pf: boolean[]): { level: SafetRisk; triggers: string[] } {
  const has = (i: number) => rf[i] === true;
  const triggers: string[] = [];
  if (has(RF.IDEATION) && has(RF.PLAN) && has(RF.INTENT)) triggers.push('Suicidal ideation + plan + intent (critical triad)');
  if (has(RF.PRIOR_ATTEMPT) && has(RF.IDEATION) && has(RF.PLAN)) triggers.push('Prior attempt + current ideation + plan');
  if (has(RF.ACCESS) && has(RF.INTENT)) triggers.push('Access to means + suicidal intent');
  if (has(RF.PSYCHOSIS) && has(RF.IDEATION)) triggers.push('Active psychosis with suicidal ideation');
  if (has(RF.PRIOR_ATTEMPT) && has(RF.HOSPITALIZATION)) triggers.push('Prior attempt + recent hospitalization');
  if (triggers.length > 0) return { level: 'High', triggers };
  const riskScore = rf.reduce((s, v, i) => s + (v ? rfWeight(i) : 0), 0);
  const protScore = pf.reduce((s, v, i) => s + (v ? SAFET_PROTECTIVE[i].weight : 0), 0);
  const netScore  = riskScore - protScore;
  if (has(RF.IDEATION) && has(RF.PLAN) && !has(RF.INTENT)) triggers.push('Suicidal ideation + plan (without intent)');
  if (has(RF.PRIOR_ATTEMPT) && has(RF.IDEATION)) triggers.push('Prior attempt + current ideation');
  if (netScore >= 5 && has(RF.IDEATION)) triggers.push(`Elevated net risk score (${netScore.toFixed(1)}) with active ideation`);
  if (has(RF.HOPELESSNESS) && has(RF.IDEATION) && netScore >= 3) triggers.push('Hopelessness + ideation + elevated risk factors');
  if (triggers.length > 0) return { level: 'Moderate', triggers };
  return { level: 'Low', triggers: [] };
}
function calcSafetNetIndex(rf: boolean[], pf: boolean[]): number {
  const r = rf.reduce((s, v, i) => s + (v ? rfWeight(i) : 0), 0);
  const p = pf.reduce((s, v, i) => s + (v ? SAFET_PROTECTIVE[i].weight : 0), 0);
  return Math.round((r - p) * 10) / 10;
}

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

// ─── Credential check for Biopsychosocial ────────────────────────────────────
// Must hold: LCADC, CAC-AD, CSC-AD, or ADT (Alcohol Drug Trainee)
const BPS_CRED_LABELS = ['LCADC', 'CAC-AD', 'CSC-AD', 'ADT'];
function hasBpsCred(roleDescription: string): boolean {
  return BPS_CRED_LABELS.some(c => roleDescription.includes(c));
}

// ─── Signature Canvas ────────────────────────────────────────────────────────
function SignatureCanvas({ label, onSigned }: { label: string; onSigned: (sig: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!;
    ctx.beginPath(); ctx.moveTo(...Object.values(getPos(e, canvas)) as [number, number]);
    setDrawing(true);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!;
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#1e2d4a';
    const pos = getPos(e, canvas); ctx.lineTo(pos.x, pos.y); ctx.stroke(); setHasSig(true);
  };
  const endDraw = () => { if (!drawing) return; setDrawing(false); onSigned(canvasRef.current!.toDataURL()); };
  const clearSig = () => {
    const canvas = canvasRef.current!; canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false); onSigned('');
  };
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate uppercase tracking-wide">{label}</span>
        {hasSig && <button onClick={clearSig} className="text-xs text-slate hover:text-red-600">Clear</button>}
      </div>
      <div className="border border-border rounded-lg overflow-hidden bg-gray-50">
        <canvas ref={canvasRef} width={400} height={80} className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
      </div>
      {hasSig && <div className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Signature captured</div>}
    </div>
  );
}

// ─── Safety Contract Modal ────────────────────────────────────────────────────
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
            <p className="text-slate leading-relaxed">I, <strong>{patientName}</strong>, agree that when I am having thoughts of harming myself, I will do the following before acting on those thoughts:</p>
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
              'I agree to take medications as prescribed and not hoard them',
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
          <button disabled={!clientSig || !clinicianSig} onClick={() => { if (clientSig && clinicianSig) onSave(); }}
            className="flex-1 bg-navy text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40">
            Save &amp; Complete Safety Contract
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────
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
function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="pb-2 border-b border-border mb-4">
      <h3 className="text-sm font-bold text-navy uppercase tracking-wide">{title}</h3>
      {sub && <p className="text-xs text-slate mt-0.5">{sub}</p>}
    </div>
  );
}
function FieldLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  if (action) {
    return (
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-slate uppercase">{children}</label>
        {action}
      </div>
    );
  }
  return <label className="block text-xs font-semibold text-slate uppercase mb-1">{children}</label>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
type SectionTab = 'Screening Forms' | 'BPS';
type FormTab = 'Screening' | 'PHQ-9' | 'DAST-10' | 'MAST' | 'SOGS' | 'SAFE-T' | 'BAM' | 'Summary';

const PATIENTS = MOCK_PATIENTS.filter(p => !p.id.startsWith('demo'));

export function ClinicalForms({ navigate: _navigate, readOnly }: Props) {
  const { role } = useRole();
  const canDoBps = hasBpsCred(role.description);

  const [selectedPatient, setSelectedPatient] = useState(PATIENTS[0]?.id ?? '');
  const [sectionTab, setSectionTab] = useState<SectionTab>('Screening Forms');
  const [tab, setTab] = useState<FormTab>('Screening');
  const [saved, setSaved] = useState<string | null>(null);
  const saveMsg = (m: string) => { setSaved(m); setTimeout(() => setSaved(null), 2500); };

  // ── Admissions Screening state ──────────────────────────────────────────────
  const [programType,             setProgramType]             = useState<ProgramType>('Residential');
  const [referralSource,          setReferralSource]          = useState<ReferralSource>('');
  const [referralFacility,        setReferralFacility]        = useState('');
  const [priorPrograms,           setPriorPrograms]           = useState<PriorTx[]>([emptyPrior(), emptyPrior(), emptyPrior()]);
  const [drugsOfChoice,           setDrugsOfChoice]           = useState<DrugEntry[]>([emptyDrug(), emptyDrug(), emptyDrug()]);
  const [medications,             setMedications]             = useState<MedEntry[]>([emptyMed()]);
  const [psychosisHistory,        setPsychosisHistory]        = useState<'none' | 'past' | 'current'>('none');
  const [currentPsychosisManaged, setCurrentPsychosisManaged] = useState(false);
  const [cjInvolved,              setCjInvolved]              = useState<boolean | null>(null);
  const [cjType,                  setCjType]                  = useState('');
  const [pendingCharges,          setPendingCharges]          = useState(false);
  const [activeWarrant,           setActiveWarrant]           = useState(false);
  const [ambulatoryStatus,        setAmbulatoryStatus]        = useState<'ambulatory' | 'assistive' | 'non-ambulatory'>('ambulatory');
  const [primaryIns,              setPrimaryIns]              = useState({ carrier: '', memberId: '', groupId: '' });
  const [secondaryIns,            setSecondaryIns]            = useState({ carrier: '', memberId: '', groupId: '' });
  const [medicalConditions,       setMedicalConditions]       = useState('');
  const [psychiatricHx,           setPsychiatricHx]           = useState('');
  const [hospitalizations,        setHospitalizations]        = useState('');
  const [requiresMedicalDetox,    setRequiresMedicalDetox]    = useState(false);
  const [medicalInstability,      setMedicalInstability]      = useState(false);
  const [vitals,                  setVitals]                  = useState({ bp: '', hr: '', temp: '', rr: '', spo2: '', weight: '' });
  const [screeningNotes,          setScreeningNotes]          = useState('');
  const [screeningOverride,       setScreeningOverride]       = useState('');
  const [screeningClinicianSig,   setScreeningClinicianSig]   = useState('');
  const [screeningDone,           setScreeningDone]           = useState(false);

  // ── PHQ-9 state ─────────────────────────────────────────────────────────────
  const [phq9, setPhq9] = useState<(number | null)[]>(Array(9).fill(null));
  const [phq9FxImpair, setPhq9FxImpair] = useState('');
  const [phq9Done, setPhq9Done] = useState(false);

  // ── DAST-10 state ────────────────────────────────────────────────────────────
  const [dast, setDast] = useState<(boolean | null)[]>(Array(10).fill(null));
  const [dastDone, setDastDone] = useState(false);

  // ── MAST state ───────────────────────────────────────────────────────────────
  const [mast, setMast] = useState<(boolean | null)[]>(Array(25).fill(null));
  const [mastDone, setMastDone] = useState(false);

  // ── SOGS state ───────────────────────────────────────────────────────────────
  const [sogs, setSogs] = useState<(number | null)[]>(Array(SOGS_ITEMS.length).fill(null));
  const [sogsMulti, setSogsMulti] = useState<boolean[][]>(Array(SOGS_ITEMS.length).fill(null).map(() => []));
  const [sogsDone, setSogsDone] = useState(false);

  // ── SAFE-T state ─────────────────────────────────────────────────────────────
  const [safetRiskFactors,  setSafetRiskFactors]  = useState<boolean[]>(Array(SAFET_RISK_FACTORS.length).fill(false));
  const [safetProtective,   setSafetProtective]   = useState<boolean[]>(Array(SAFET_PROTECTIVE.length).fill(false));
  const [safetIdeation,     setSafetIdeation]     = useState('');
  const [safetPlan,         setSafetPlan]         = useState('');
  const [safetIntent,       setSafetIntent]       = useState('');
  const [safetHistory,      setSafetHistory]      = useState('');
  const [safetRisk,         setSafetRisk]         = useState<SafetRisk | null>(null);
  const [safetActions,      setSafetActions]      = useState('');
  const [safetDone,         setSafetDone]         = useState(false);
  const [showContract,      setShowContract]      = useState(false);
  const [contractDone,      setContractDone]      = useState(false);

  // ── BAM state ────────────────────────────────────────────────────────────────
  const [bamRisk,       setBamRisk]       = useState<(number | null)[]>(Array(BAM_RISK_ITEMS.length).fill(null));
  const [bamProtective, setBamProtective] = useState<(number | null)[]>(Array(BAM_PROTECTIVE_ITEMS.length).fill(null));
  const [bamDone,       setBamDone]       = useState(false);

  // ── BPS state ────────────────────────────────────────────────────────────────
  const [bpsBio,            setBpsBio]            = useState({ medHx: '', familyMedHx: '', allergies: '', substanceHxDetail: '' });
  const [bpsPsych,          setBpsPsych]          = useState({ mentalHealthHx: '', traumaHx: '', copingSkills: '', cognitiveNote: '', prevMhTx: '' });
  const [bpsSocial,         setBpsSocial]         = useState({ housing: '', employment: '', socialSupport: '', family: '', legal: '', finances: '' });
  const [bpsSpiritCultural, setBpsSpiritCultural] = useState({ spiritual: '', cultural: '', barriers: '' });
  const [bpsFormulation,    setBpsFormulation]    = useState({ asamDims: '', diagnosis: '', clinicalImpression: '', txRec: '' });
  const [bpsClinicianSig,   setBpsClinicianSig]   = useState('');
  const [bpsDone,           setBpsDone]           = useState(false);

  // ── Computed scores ──────────────────────────────────────────────────────────
  const phq9Score = phq9.reduce<number>((s, v) => s + (v ?? 0), 0);
  const phq9Risk  = getPhq9Risk(phq9Score);

  const dastScore = dast.reduce<number>((s, v, i) => {
    if (v === null) return s;
    return s + (DAST10_ITEMS[i].reverse ? (!v ? 1 : 0) : (v ? 1 : 0));
  }, 0);
  const dastRisk  = dast10Risk(dastScore);

  const mastScore = mast.reduce<number>((s, v, i) => {
    if (v === null || i >= MAST_ITEMS.length) return s;
    const item = MAST_ITEMS[i];
    return s + ((item.reverse ? !v : v) ? item.yesScore : 0);
  }, 0);
  const mastRiskVal = mastRisk(mastScore);

  const sogsScore = sogs.reduce<number>((s, v, i) => {
    const item = SOGS_ITEMS[i];
    if (item.multi) return s + (sogsMulti[i] || []).filter(Boolean).length;
    return s + (v !== null ? item.scores[v] ?? 0 : 0);
  }, 0);
  const sogsRiskVal = sogsRisk(sogsScore);

  const bamRiskScore       = bamRisk.reduce<number>((s, v) => s + (v ?? 0), 0);
  const bamProtectiveScore = bamProtective.reduce<number>((s, v) => s + (v ?? 0), 0);

  const patient = PATIENTS.find(p => p.id === selectedPatient);

  // ── AI context for BPS generators ────────────────────────────────────────────
  const bpsCtx: BPSContext = {
    patientName:      patient ? `${patient.firstName} ${patient.lastName}` : undefined,
    age:              patient?.age,
    primaryDiagnosis: patient?.primaryDiagnosis,
    primaryDrug:      drugsOfChoice[0]?.substance || undefined,
    psychosisHistory,
    cjInvolved,
    medicalConditions: medicalConditions || undefined,
    psychiatricHx:    psychiatricHx || undefined,
    phq9Score:        phq9Done ? phq9Score : null,
    safetRisk:        safetDone ? safetRisk : null,
  };

  // ── Exclusion flags ──────────────────────────────────────────────────────────
  const exclusions = calcExclusions(
    programType, medications, ambulatoryStatus, psychosisHistory,
    currentPsychosisManaged, activeWarrant, pendingCharges,
    requiresMedicalDetox, medicalInstability,
  );
  const fatalExclusions  = exclusions.filter(e => e.fatal);
  const reviewFlags      = exclusions.filter(e => !e.fatal);
  const hasExclusions    = fatalExclusions.length > 0;

  const tabs: FormTab[] = ['Screening', 'PHQ-9', 'DAST-10', 'MAST', 'SOGS', 'SAFE-T', 'BAM', 'Summary'];
  const completedForms  = [screeningDone, phq9Done, dastDone, mastDone, sogsDone, safetDone, bamDone];
  const completedCount  = completedForms.filter(Boolean).length;

  useEffect(() => {
    if (safetDone && (safetRisk === 'High' || safetRisk === 'Moderate') && !contractDone) {
      setShowContract(true);
    }
  }, [safetDone, safetRisk, contractDone]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const updateDrug = (idx: number, field: keyof DrugEntry, val: string) =>
    setDrugsOfChoice(prev => prev.map((d, i) => i === idx ? { ...d, [field]: val } : d));

  const updateMed = (idx: number, field: keyof MedEntry, val: string) =>
    setMedications(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));

  const updatePrior = (idx: number, field: keyof PriorTx, val: string) =>
    setPriorPrograms(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));

  const medFlag = (m: MedEntry) => {
    const nm = m.name.toLowerCase();
    const dose = parseDose(m.dose);
    if (!isNaN(dose)) {
      if ((nm.includes('gabapentin') || nm.includes('neurontin')) && dose > 900) return 'gabapentin';
      if ((nm.includes('methadone') || nm.includes('dolophine')) && dose > 120) return 'methadone';
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Admissions Screening</h1>
          <p className="text-slate text-sm mt-0.5">Documentation · PHQ-9 · DAST-10 · MAST · SOGS · SAFE-T · BAM · Biopsychosocial</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate">Sections complete</div>
            <div className="text-lg font-bold text-navy">{completedCount} <span className="text-slate font-normal text-sm">/ 7</span></div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${completedCount === 8 ? 'bg-green-500' : 'bg-navy/20 text-navy'}`}>
            {completedCount === 7 ? '✓' : `${completedCount}/7`}
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

      {/* Fatal exclusion banner */}
      {hasExclusions && (
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-red-800 text-base">NOT RECOMMENDED FOR ADMISSION — Exclusionary Factor(s) Present</div>
            <ul className="mt-2 space-y-1">
              {fatalExclusions.map(e => (
                <li key={e.key} className="text-sm text-red-700 flex items-start gap-1.5">
                  <span className="shrink-0 mt-0.5">▸</span>{e.label}
                </li>
              ))}
            </ul>
            {screeningOverride && (
              <div className="mt-3 bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs text-amber-800">
                <strong>Clinical Override Documented:</strong> {screeningOverride}
              </div>
            )}
          </div>
        </div>
      )}
      {!hasExclusions && reviewFlags.length > 0 && (
        <div className="bg-amber-50 border border-amber-400 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-800">CLINICAL REVIEW REQUIRED before admission</div>
            <ul className="mt-1 space-y-1">
              {reviewFlags.map(e => (
                <li key={e.key} className="text-sm text-amber-700 flex items-start gap-1.5">
                  <span className="shrink-0 mt-0.5">▸</span>{e.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* SAFE-T banners */}
      {safetDone && safetRisk === 'High' && !contractDone && (
        <div className="bg-red-50 border border-red-400 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-red-800">HIGH SUICIDE RISK — Safety Contract Required</div>
            <div className="text-sm text-red-700 mt-0.5">SAFE-T indicates HIGH risk. Contract for Safety must be completed and signed before finalizing.</div>
          </div>
          <button onClick={() => setShowContract(true)} className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-red-700 shrink-0">Open Contract</button>
        </div>
      )}
      {safetDone && safetRisk === 'Moderate' && !contractDone && (
        <div className="bg-amber-50 border border-amber-400 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-800">MODERATE SUICIDE RISK — Safety Contract Recommended</div>
          </div>
          <button onClick={() => setShowContract(true)} className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 shrink-0">Complete Contract</button>
        </div>
      )}
      {contractDone && (
        <div className="bg-green-50 border border-green-400 rounded-xl p-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <span className="text-sm text-green-800 font-medium">Safety Contract completed and signed — filed with chart.</span>
          <button onClick={() => setShowContract(true)} className="ml-auto text-xs text-green-700 underline">View</button>
        </div>
      )}

      {/* Section pills */}
      <div className="flex gap-2">
        {(['Screening Forms', 'BPS'] as SectionTab[]).map(s => (
          <button key={s} onClick={() => setSectionTab(s)}
            className={`px-5 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${sectionTab === s ? 'border-orange bg-orange/10 text-orange' : 'border-border text-slate hover:border-orange/40'}`}>
            {s === 'BPS' && bpsDone && <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-1.5" />}
            {s}
          </button>
        ))}
      </div>

      {/* Sub-tabs (Screening Forms only) */}
      {sectionTab === 'Screening Forms' && (
        <div className="flex gap-0 border-b border-border overflow-x-auto no-scrollbar">
          {tabs.map((t, i) => {
            const isDone = t === 'Summary' ? false : completedForms[i];
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>
                {isDone && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />}
                {t === 'Screening' && hasExclusions && !screeningDone && <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />}
                {t}
              </button>
            );
          })}
        </div>
      )}

      {sectionTab === 'Screening Forms' && tab === 'Screening' && (
        <div className="space-y-6">

          {/* Program Type */}
          <div className="card">
            <SectionHeading title="Program Type" sub="Select the level of care being screened for — affects ambulatory exclusion criteria" />
            <div className="flex gap-4">
              {(['Residential', 'Outpatient'] as ProgramType[]).map(pt => (
                <button key={pt} disabled={readOnly} onClick={() => setProgramType(pt)}
                  className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${programType === pt ? 'border-orange bg-orange/10 text-orange' : 'border-border text-slate hover:border-orange/40'}`}>
                  {pt}
                </button>
              ))}
            </div>
          </div>

          {/* Referral Source */}
          <div className="card">
            <SectionHeading title="Referral Source &amp; Prior Treatment History" />
            <div className="mb-4">
              <FieldLabel>Where is the client coming from?</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {(['Treatment Program', 'Home / Community', 'Street / Unsheltered', 'Incarceration / Corrections', 'Emergency Department', 'Detox'] as ReferralSource[]).map(s => (
                  <button key={s} disabled={readOnly} onClick={() => setReferralSource(s)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${referralSource === s ? 'border-orange bg-orange text-white font-semibold' : 'border-border text-slate hover:border-orange/50'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {(referralSource === 'Treatment Program' || referralSource === 'Detox') && (
              <div className="mb-4">
                <FieldLabel>Referring facility name</FieldLabel>
                <input value={referralFacility} onChange={e => setReferralFacility(e.target.value)} disabled={readOnly}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm max-w-sm"
                  placeholder="e.g. Sheppard Pratt, Ashley Addiction Treatment..." />
              </div>
            )}

            <FieldLabel>Last three treatment programs / levels of care (most recent first)</FieldLabel>
            <div className="space-y-3">
              {priorPrograms.map((p, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3">
                  <div className="col-span-3 text-xs font-bold text-navy uppercase mb-1">
                    {i === 0 ? 'Most Recent' : i === 1 ? '2nd Most Recent' : '3rd Most Recent'}
                  </div>
                  <div>
                    <FieldLabel>Facility Name</FieldLabel>
                    <input value={p.facility} onChange={e => updatePrior(i, 'facility', e.target.value)} disabled={readOnly}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Facility name" />
                  </div>
                  <div>
                    <FieldLabel>Level of Care</FieldLabel>
                    <select value={p.loc} onChange={e => updatePrior(i, 'loc', e.target.value)} disabled={readOnly}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                      <option value="">Select LOC...</option>
                      {LOC_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Approximate Dates</FieldLabel>
                    <input value={p.dates} onChange={e => updatePrior(i, 'dates', e.target.value)} disabled={readOnly}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Jan–Mar 2024" />
                  </div>
                  <div className="col-span-3">
                    <FieldLabel>Reason for Discharge / Transition</FieldLabel>
                    <input value={p.reason} onChange={e => updatePrior(i, 'reason', e.target.value)} disabled={readOnly}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Completed, AMA, relapse, medical, other..." />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Substance Use */}
          <div className="card">
            <SectionHeading title="Substance Use — Drugs of Choice" sub="Complete primary (required), secondary and tertiary as applicable" />
            {drugsOfChoice.map((d, i) => (
              <div key={i} className={`mb-4 rounded-xl p-4 border ${i === 0 ? 'border-orange/30 bg-orange/5' : 'border-border bg-gray-50'}`}>
                <div className="text-xs font-bold text-navy uppercase mb-3">
                  {i === 0 ? 'Primary Drug of Choice' : i === 1 ? 'Secondary Drug of Choice' : 'Tertiary Drug of Choice'}
                  {i > 0 && <span className="ml-2 text-slate font-normal normal-case">(optional)</span>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Substance</FieldLabel>
                    <select value={d.substance} onChange={e => updateDrug(i, 'substance', e.target.value)} disabled={readOnly}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                      <option value="">Select substance...</option>
                      {SUBSTANCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Route of Administration</FieldLabel>
                    <select value={d.route} onChange={e => updateDrug(i, 'route', e.target.value)} disabled={readOnly}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                      <option value="">Select route...</option>
                      {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Frequency of Use</FieldLabel>
                    <select value={d.frequency} onChange={e => updateDrug(i, 'frequency', e.target.value)} disabled={readOnly}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                      <option value="">Select frequency...</option>
                      {FREQ_OPTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Date / Approximate Date of Last Use</FieldLabel>
                    <input type="text" value={d.lastUse} onChange={e => updateDrug(i, 'lastUse', e.target.value)} disabled={readOnly}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 07/28/2026 or Yesterday" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Medications */}
          <div className="card">
            <SectionHeading title="Current Medications"
              sub="Policy limits: Gabapentin ≤ 900 mg/day · Methadone ≤ 120 mg/day. Exceeding either triggers automatic non-admission flag." />
            <div className="space-y-3">
              {medications.map((m, i) => {
                const flag = medFlag(m);
                return (
                  <div key={i} className={`rounded-xl p-4 border ${flag ? 'border-red-400 bg-red-50' : 'border-border bg-gray-50'}`}>
                    {flag && (
                      <div className="flex items-center gap-2 mb-2 text-red-700 text-xs font-bold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {flag === 'gabapentin' ? `Gabapentin ${m.dose}mg exceeds 900 mg/day policy maximum` : `Methadone ${m.dose}mg exceeds 120 mg/day policy maximum`}
                      </div>
                    )}
                    <div className="grid grid-cols-5 gap-2 items-end">
                      <div className="col-span-2">
                        <FieldLabel>Medication Name</FieldLabel>
                        <input value={m.name} onChange={e => updateMed(i, 'name', e.target.value)} disabled={readOnly}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Gabapentin, Suboxone..." />
                      </div>
                      <div>
                        <FieldLabel>Dose</FieldLabel>
                        <div className="flex gap-1">
                          <input value={m.dose} onChange={e => updateMed(i, 'dose', e.target.value)} disabled={readOnly}
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="300" />
                          <select value={m.unit} onChange={e => updateMed(i, 'unit', e.target.value)} disabled={readOnly}
                            className="border border-border rounded-lg px-2 py-2 text-sm">
                            {['mg', 'mcg', 'mL', 'units'].map(u => <option key={u}>{u}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Frequency</FieldLabel>
                        <input value={m.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} disabled={readOnly}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="TID, Daily..." />
                      </div>
                      <div className="flex items-end">
                        {medications.length > 1 && !readOnly && (
                          <button onClick={() => setMedications(prev => prev.filter((_, j) => j !== i))}
                            className="p-2 text-slate hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="col-span-4">
                        <FieldLabel>Prescribing Provider / Clinic</FieldLabel>
                        <input value={m.prescriber} onChange={e => updateMed(i, 'prescriber', e.target.value)} disabled={readOnly}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Dr. Smith / Johns Hopkins Psychiatry" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!readOnly && (
              <button onClick={() => setMedications(prev => [...prev, emptyMed()])}
                className="mt-3 flex items-center gap-2 text-sm text-orange hover:text-orange/80 font-medium">
                <Plus className="w-4 h-4" /> Add Medication
              </button>
            )}
          </div>

          {/* Mental Health & Medical */}
          <div className="card space-y-5">
            <SectionHeading title="Mental Health &amp; Medical History" />

            <div>
              <FieldLabel>History of Psychosis</FieldLabel>
              <div className="flex gap-3 mt-1">
                {([['none', 'None / No history'], ['past', 'Past history (resolved / managed)'], ['current', 'Current / Active']] as const).map(([v, label]) => (
                  <button key={v} disabled={readOnly} onClick={() => setPsychosisHistory(v)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${psychosisHistory === v ? (v === 'current' ? 'border-red-500 bg-red-50 text-red-700' : v === 'past' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-green-500 bg-green-50 text-green-700') : 'border-border text-slate hover:border-navy/30'}`}>
                    {label}
                  </button>
                ))}
              </div>
              {psychosisHistory === 'current' && (
                <div className="mt-3 flex items-center gap-3 pl-2">
                  <input type="checkbox" id="psychManaged" checked={currentPsychosisManaged}
                    onChange={e => setCurrentPsychosisManaged(e.target.checked)} disabled={readOnly} className="accent-navy" />
                  <label htmlFor="psychManaged" className="text-sm text-navy cursor-pointer">
                    Currently managed with medication / ongoing psychiatric treatment
                  </label>
                </div>
              )}
            </div>

            <div>
              <FieldLabel>Ambulatory Status</FieldLabel>
              <div className="flex gap-3 mt-1">
                {([['ambulatory', 'Fully Ambulatory'], ['assistive', 'Uses Assistive Device (cane, walker, wheelchair part-time)'], ['non-ambulatory', 'Non-Ambulatory / Full Wheelchair']] as const).map(([v, label]) => (
                  <button key={v} disabled={readOnly} onClick={() => setAmbulatoryStatus(v)}
                    className={`flex-1 rounded-lg border py-2 px-2 text-sm font-medium text-center transition-colors ${ambulatoryStatus === v ? 'border-orange bg-orange/10 text-orange' : 'border-border text-slate hover:border-orange/40'}`}>
                    {label}
                  </button>
                ))}
              </div>
              {ambulatoryStatus === 'non-ambulatory' && (
                <div className={`mt-2 text-xs font-semibold px-3 py-2 rounded-lg ${programType === 'Outpatient' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-amber-100 text-amber-700 border border-amber-300'}`}>
                  {programType === 'Outpatient'
                    ? 'Non-ambulatory is an exclusionary factor for Outpatient level of care. Consider residential placement.'
                    : 'Non-ambulatory for Residential: requires nursing assessment and ADA facility review — not automatically exclusionary.'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Medical Conditions / Diagnoses</FieldLabel>
                <textarea value={medicalConditions} onChange={e => setMedicalConditions(e.target.value)} disabled={readOnly}
                  rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="List relevant medical conditions, chronic illness, disabilities..." />
              </div>
              <div>
                <FieldLabel>Psychiatric History</FieldLabel>
                <textarea value={psychiatricHx} onChange={e => setPsychiatricHx(e.target.value)} disabled={readOnly}
                  rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Diagnoses, prior psychiatric treatment, hospitalizations..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Psychiatric Hospitalizations (number / dates)</FieldLabel>
                <input value={hospitalizations} onChange={e => setHospitalizations(e.target.value)} disabled={readOnly}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 2× in 2023, most recent Mar 2024" />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={requiresMedicalDetox} onChange={e => setRequiresMedicalDetox(e.target.checked)} disabled={readOnly} className="accent-navy" />
                <span className="text-sm text-navy">Client requires medical detoxification before admission</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={medicalInstability} onChange={e => setMedicalInstability(e.target.checked)} disabled={readOnly} className="accent-navy" />
                <span className="text-sm text-navy">Medical instability requiring physician clearance</span>
              </label>
            </div>
          </div>

          {/* Vitals */}
          <div className="card">
            <SectionHeading title="Intake Vitals" sub="Document at time of screening" />
            <div className="grid grid-cols-3 gap-3">
              {([
                ['bp', 'Blood Pressure', 'e.g. 118/76'],
                ['hr', 'Heart Rate (bpm)', 'e.g. 74'],
                ['temp', 'Temperature (°F)', 'e.g. 98.6'],
                ['rr', 'Respiratory Rate', 'e.g. 16'],
                ['spo2', 'SpO₂ (%)', 'e.g. 98'],
                ['weight', 'Weight (lbs)', 'e.g. 165'],
              ] as const).map(([k, label, ph]) => (
                <div key={k}>
                  <FieldLabel>{label}</FieldLabel>
                  <input value={vitals[k]} onChange={e => setVitals(prev => ({ ...prev, [k]: e.target.value }))} disabled={readOnly}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder={ph} />
                </div>
              ))}
            </div>
          </div>

          {/* Criminal Justice */}
          <div className="card">
            <SectionHeading title="Criminal Justice Involvement" />
            <div className="mb-4">
              <FieldLabel>Is the client currently involved with the criminal justice system?</FieldLabel>
              <div className="flex gap-3 mt-1">
                {(['Yes', 'No'] as const).map(v => (
                  <button key={v} disabled={readOnly} onClick={() => setCjInvolved(v === 'Yes')}
                    className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${cjInvolved === (v === 'Yes') ? 'border-orange bg-orange text-white' : 'border-border text-slate hover:border-orange/50'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {cjInvolved === true && (
              <div className="space-y-4 pl-2 border-l-2 border-orange/30 ml-1">
                <div>
                  <FieldLabel>Type of Supervision</FieldLabel>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {CJ_TYPES.map(t => (
                      <button key={t} disabled={readOnly} onClick={() => setCjType(t)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${cjType === t ? 'border-orange bg-orange text-white font-semibold' : 'border-border text-slate hover:border-orange/50'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={pendingCharges} onChange={e => setPendingCharges(e.target.checked)} disabled={readOnly} className="accent-navy" />
                    <span className="text-sm text-navy">Pending criminal charges</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={activeWarrant} onChange={e => setActiveWarrant(e.target.checked)} disabled={readOnly}
                      className="accent-red-600" />
                    <span className="text-sm font-semibold text-red-700">Active warrant outstanding</span>
                  </label>
                </div>
                {activeWarrant && (
                  <div className="bg-red-100 border border-red-400 rounded-lg p-3 text-sm font-bold text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    EXCLUSIONARY — Active warrant is a non-admission criterion. Client must resolve warrant before admission.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Insurance */}
          <div className="card">
            <SectionHeading title="Insurance &amp; Benefits" />
            <div className="mb-5">
              <div className="text-xs font-bold text-navy uppercase mb-3">Primary Insurance</div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel>Carrier / Plan</FieldLabel>
                  <select value={primaryIns.carrier} onChange={e => setPrimaryIns(prev => ({ ...prev, carrier: e.target.value }))} disabled={readOnly}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select carrier...</option>
                    {INSURERS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Member ID</FieldLabel>
                  <input value={primaryIns.memberId} onChange={e => setPrimaryIns(prev => ({ ...prev, memberId: e.target.value }))} disabled={readOnly}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Member ID" />
                </div>
                <div>
                  <FieldLabel>Group ID</FieldLabel>
                  <input value={primaryIns.groupId} onChange={e => setPrimaryIns(prev => ({ ...prev, groupId: e.target.value }))} disabled={readOnly}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Group ID" />
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-navy uppercase mb-3">Secondary Insurance <span className="font-normal text-slate normal-case">(optional)</span></div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel>Carrier / Plan</FieldLabel>
                  <select value={secondaryIns.carrier} onChange={e => setSecondaryIns(prev => ({ ...prev, carrier: e.target.value }))} disabled={readOnly}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select carrier...</option>
                    {INSURERS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Member ID</FieldLabel>
                  <input value={secondaryIns.memberId} onChange={e => setSecondaryIns(prev => ({ ...prev, memberId: e.target.value }))} disabled={readOnly}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Member ID" />
                </div>
                <div>
                  <FieldLabel>Group ID</FieldLabel>
                  <input value={secondaryIns.groupId} onChange={e => setSecondaryIns(prev => ({ ...prev, groupId: e.target.value }))} disabled={readOnly}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Group ID" />
                </div>
              </div>
            </div>
          </div>

          {/* Exclusionary Summary & Clinician Sign-off */}
          <div className={`card border-2 ${hasExclusions ? 'border-red-400' : reviewFlags.length > 0 ? 'border-amber-400' : 'border-green-400'}`}>
            <SectionHeading title="Screening Recommendation" />
            {hasExclusions ? (
              <div className="mb-4 text-sm font-bold text-red-700 bg-red-50 rounded-lg px-4 py-3">
                ⛔ NOT RECOMMENDED FOR ADMISSION — {fatalExclusions.length} exclusionary factor{fatalExclusions.length > 1 ? 's' : ''} identified
              </div>
            ) : reviewFlags.length > 0 ? (
              <div className="mb-4 text-sm font-bold text-amber-700 bg-amber-50 rounded-lg px-4 py-3">
                ⚠ REQUIRES CLINICAL REVIEW — {reviewFlags.length} flag{reviewFlags.length > 1 ? 's' : ''} require follow-up before admission
              </div>
            ) : (
              <div className="mb-4 text-sm font-bold text-green-700 bg-green-50 rounded-lg px-4 py-3">
                ✓ ELIGIBLE FOR ADMISSION — No exclusionary factors identified
              </div>
            )}

            {hasExclusions && (
              <div className="mb-4">
                <FieldLabel>Clinical Override Rationale (required if admitting despite exclusion)</FieldLabel>
                <textarea value={screeningOverride} onChange={e => setScreeningOverride(e.target.value)} disabled={readOnly}
                  rows={3} className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Document clinical justification for admission over identified exclusionary factors, medical director sign-off, and risk mitigation plan..." />
              </div>
            )}

            <div>
              <FieldLabel action={
                <AiDraftAssist
                  fieldName="screening impressions"
                  disabled={readOnly || screeningDone}
                  onGenerate={() => generateScreeningNarrative({
                    patientName:             patient ? `${patient.firstName} ${patient.lastName}` : undefined,
                    programType,
                    referralSource:          referralSource || undefined,
                    primaryDrug:             drugsOfChoice[0]?.substance || undefined,
                    secondaryDrug:           drugsOfChoice[1]?.substance || undefined,
                    psychosisHistory,
                    currentPsychosisManaged,
                    ambulatoryStatus,
                    cjInvolved,
                    cjType:                  cjType || undefined,
                    medicalConditions:       medicalConditions || undefined,
                    psychiatricHx:           psychiatricHx || undefined,
                    requiresMedicalDetox,
                    exclusionLabels:         fatalExclusions.map(e => e.label),
                    reviewLabels:            reviewFlags.map(e => e.label),
                    vitals,
                  })}
                  onAccept={text => setScreeningNotes(prev => prev ? `${prev}\n\n${text}` : text)}
                />
              }>Screening Clinician Notes</FieldLabel>
              <textarea value={screeningNotes} onChange={e => setScreeningNotes(e.target.value)} disabled={readOnly}
                rows={4} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                placeholder="Clinical impressions, collateral information, additional screening observations, LOC recommendation..." />
            </div>

            <div className="mt-5">
              <FieldLabel>Clinician Signature</FieldLabel>
              {!readOnly ? <SignatureCanvas label="Screening Clinician" onSigned={setScreeningClinicianSig} />
                : <div className="text-xs text-slate italic">Signature locked in read-only mode</div>}
            </div>

            {!readOnly && (
              <div className="mt-4">
                <LockedButton
                  locked={!screeningClinicianSig || (hasExclusions && !screeningOverride.trim())}
                  onClick={() => { setScreeningDone(true); saveMsg('Admissions screening saved'); }}
                  className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {screeningDone ? 'Screening Saved ✓' : hasExclusions ? 'Save with Override' : 'Save Screening'}
                </LockedButton>
                {hasExclusions && !screeningOverride.trim() && (
                  <p className="text-xs text-red-600 mt-1">Override rationale required before saving with exclusionary factors.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          PHQ-9
          ════════════════════════════════════════════════════════════════════ */}
      {sectionTab === 'Screening Forms' && tab === 'PHQ-9' && (
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
                      <button key={j} onClick={() => { if (!readOnly) { const n = [...phq9]; n[i] = j; setPhq9(n); } }} disabled={readOnly}
                        className={`rounded-lg border text-xs py-2 px-1 text-center transition-colors ${phq9[i] === j ? 'border-orange bg-orange text-white font-semibold' : 'border-border hover:border-orange/50 text-slate'}`}>
                        <div className="font-bold text-base">{j}</div><div className="mt-0.5">{opt}</div>
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
                  <button key={opt} onClick={() => { if (!readOnly) setPhq9FxImpair(opt); }} disabled={readOnly}
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
              <div className="text-xs text-slate"><strong>Scoring:</strong> 0–4 Minimal · 5–9 Mild · 10–14 Moderate · 15–19 Moderately Severe · 20–27 Severe</div>
              <LockedButton locked={readOnly || phq9Done} onClick={() => { setPhq9Done(true); saveMsg('PHQ-9 saved'); }}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
                <Save className="w-4 h-4" /> {phq9Done ? 'PHQ-9 Saved ✓' : 'Save PHQ-9'}
              </LockedButton>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DAST-10
          ════════════════════════════════════════════════════════════════════ */}
      {sectionTab === 'Screening Forms' && tab === 'DAST-10' && (
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
                      <button key={opt} onClick={() => { if (!readOnly) { const n = [...dast]; n[i] = j === 0; setDast(n); } }} disabled={readOnly}
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
              <div className="text-xs text-slate"><strong>Action:</strong> {dastRisk.action}</div>
              <LockedButton locked={readOnly || dastDone} onClick={() => { setDastDone(true); saveMsg('DAST-10 saved'); }}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
                <Save className="w-4 h-4" /> {dastDone ? 'DAST-10 Saved ✓' : 'Save DAST-10'}
              </LockedButton>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MAST
          ════════════════════════════════════════════════════════════════════ */}
      {sectionTab === 'Screening Forms' && tab === 'MAST' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-bold text-navy mb-1">Michigan Alcohol Screening Test (MAST)</h2>
            <p className="text-xs text-slate mb-4">Answer <strong>Yes</strong> or <strong>No</strong> to each question.</p>
            <div className="space-y-3">
              {MAST_ITEMS.map((item, i) => (
                <div key={i} className={`rounded-xl border p-4 transition-colors ${mast[i] !== null ? 'border-orange/30 bg-orange/5' : 'border-border'}`}>
                  <div className="text-sm text-navy mb-3"><span className="font-bold text-orange mr-2">{i + 1}.</span>{item.q}</div>
                  <div className="flex gap-3">
                    {['Yes', 'No'].map((opt, j) => (
                      <button key={opt} onClick={() => { if (!readOnly) { const n = [...mast]; n[i] = j === 0; setMast(n); } }} disabled={readOnly}
                        className={`flex-1 rounded-lg border text-sm py-2 font-semibold transition-colors ${mast[i] === (j === 0) ? 'border-orange bg-orange text-white' : 'border-border text-slate hover:border-orange/50'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {mast.filter(v => v !== null).length === 25 && (
            <div className="space-y-3">
              <ScoreBadge label="MAST" score={mastScore} maxScore={53} risk={mastRiskVal} />
              <div className="text-xs text-slate"><strong>Scoring:</strong> 0–4 No problem · 5–6 Suggests dependence · ≥7 Probable dependence</div>
              <LockedButton locked={readOnly || mastDone} onClick={() => { setMastDone(true); saveMsg('MAST saved'); }}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
                <Save className="w-4 h-4" /> {mastDone ? 'MAST Saved ✓' : 'Save MAST'}
              </LockedButton>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SOGS
          ════════════════════════════════════════════════════════════════════ */}
      {sectionTab === 'Screening Forms' && tab === 'SOGS' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-bold text-navy mb-1">South Oaks Gambling Screen (SOGS)</h2>
            <p className="text-xs text-slate mb-4">Screens for problem gambling behaviors.</p>
            <div className="space-y-3">
              {SOGS_ITEMS.map((item, i) => (
                <div key={i} className={`rounded-xl border p-4 transition-colors ${(item.multi ? sogsMulti[i]?.some(Boolean) : sogs[i] !== null) ? 'border-orange/30 bg-orange/5' : 'border-border'}`}>
                  <div className="text-sm text-navy mb-3"><span className="font-bold text-orange mr-2">{i + 1}.</span>{item.q}</div>
                  {item.multi ? (
                    <div className="space-y-1">
                      {item.opts.map((opt, j) => (
                        <label key={j} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={!!sogsMulti[i]?.[j]}
                            onChange={() => {
                              if (readOnly) return;
                              const n = sogsMulti.map((r, ri) => ri === i ? r.map((v, vi) => vi === j ? !v : v) : r);
                              // ensure array length
                              while (n[i].length <= j) n[i].push(false);
                              n[i][j] = !sogsMulti[i]?.[j];
                              setSogsMulti(n);
                            }}
                            disabled={readOnly} className="accent-orange" />
                          <span className="text-sm text-navy">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {item.opts.map((opt, j) => (
                        <button key={j} onClick={() => { if (!readOnly) { const n = [...sogs]; n[i] = j; setSogs(n); } }} disabled={readOnly}
                          className={`rounded-lg border text-sm px-3 py-1.5 transition-colors ${sogs[i] === j ? 'border-orange bg-orange text-white font-semibold' : 'border-border text-slate hover:border-orange/50'}`}>
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
            <LockedButton locked={readOnly || sogsDone} onClick={() => { setSogsDone(true); saveMsg('SOGS saved'); }}
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
              <Save className="w-4 h-4" /> {sogsDone ? 'SOGS Saved ✓' : 'Save SOGS'}
            </LockedButton>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SAFE-T  (unchanged from prior implementation)
          ════════════════════════════════════════════════════════════════════ */}
      {sectionTab === 'Screening Forms' && tab === 'SAFE-T' && (
        <div className="space-y-4">
          {/* Auto-score strip */}
          {(safetRiskFactors.some(Boolean) || safetProtective.some(Boolean)) && (() => {
            const autoResult  = calcSafetRisk(safetRiskFactors, safetProtective);
            const netIndex    = calcSafetNetIndex(safetRiskFactors, safetProtective);
            const rfCount     = safetRiskFactors.filter(Boolean).length;
            const pfCount     = safetProtective.filter(Boolean).length;
            const riskCol     = autoResult.level === 'High' ? 'text-red-700 bg-red-50 border-red-300' : autoResult.level === 'Moderate' ? 'text-amber-700 bg-amber-50 border-amber-300' : 'text-green-700 bg-green-50 border-green-300';
            return (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Risk Factors', value: rfCount, sub: 'present', col: rfCount > 0 ? 'text-red-700' : 'text-green-700' },
                  { label: 'Protective', value: pfCount, sub: 'present', col: pfCount > 0 ? 'text-green-700' : 'text-slate' },
                  { label: 'Net Index', value: netIndex, sub: 'risk − protective', col: netIndex > 0 ? 'text-red-700' : netIndex < 0 ? 'text-green-700' : 'text-slate' },
                  { label: 'Algorithm', value: autoResult.level, sub: 'suggested level', col: riskCol },
                ].map(item => (
                  <div key={item.label} className={`rounded-xl border px-4 py-3 ${typeof item.col === 'string' && item.col.includes('bg-') ? item.col : 'border-border'}`}>
                    <div className="text-xs text-slate uppercase font-semibold">{item.label}</div>
                    <div className={`text-xl font-bold mt-0.5 ${typeof item.col === 'string' && !item.col.includes('bg-') ? item.col : ''}`}>{item.value}</div>
                    <div className="text-xs text-slate">{item.sub}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div className="card">
            <h2 className="text-base font-bold text-navy mb-1">SAFE-T — Suicide Assessment Five-Step Evaluation and Triage</h2>
            <p className="text-xs text-slate mb-4">Complete all five steps. Critical factors are highlighted in red.</p>

            {/* Step 1: Risk Factors */}
            <div className="mb-6">
              <div className="text-xs font-bold text-navy uppercase mb-3 border-b border-border pb-1">Step 1 — Risk Factors</div>
              <div className="grid grid-cols-2 gap-2">
                {SAFET_RISK_FACTORS.map((rf, i) => (
                  <label key={i} className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors ${safetRiskFactors[i] ? (rf.critical ? 'border-red-400 bg-red-50' : 'border-orange/30 bg-orange/5') : 'border-border hover:border-navy/20'}`}>
                    <input type="checkbox" checked={safetRiskFactors[i]} disabled={readOnly}
                      onChange={() => { const n = [...safetRiskFactors]; n[i] = !n[i]; setSafetRiskFactors(n); }}
                      className={rf.critical ? 'accent-red-600' : 'accent-navy'} />
                    <span className={`text-sm ${rf.critical ? 'font-semibold text-red-800' : 'text-navy'}`}>
                      {rf.critical && <span className="text-red-600 mr-1">⚑</span>}{rf.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 2: Protective Factors */}
            <div className="mb-6">
              <div className="text-xs font-bold text-navy uppercase mb-3 border-b border-border pb-1">Step 2 — Protective Factors</div>
              <div className="grid grid-cols-2 gap-2">
                {SAFET_PROTECTIVE.map((pf, i) => (
                  <label key={i} className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors ${safetProtective[i] ? 'border-green-400 bg-green-50' : 'border-border hover:border-navy/20'}`}>
                    <input type="checkbox" checked={safetProtective[i]} disabled={readOnly}
                      onChange={() => { const n = [...safetProtective]; n[i] = !n[i]; setSafetProtective(n); }}
                      className="accent-green-600" />
                    <span className="text-sm text-navy">{pf.label} <span className="text-xs text-slate">(wt: {pf.weight})</span></span>
                  </label>
                ))}
              </div>
            </div>

            {/* Steps 3–4 */}
            {[
              { step: 3, label: 'Suicidal Ideation — describe nature, frequency, intensity, duration', val: safetIdeation, set: setSafetIdeation, ph: 'Describe current suicidal ideation in detail...' },
              { step: 3, label: 'Suicidal Plan — specificity, lethality, availability of means', val: safetPlan, set: setSafetPlan, ph: 'Describe any plan, access to means...' },
              { step: 3, label: 'Suicidal Intent — extent of expectation to act on thoughts', val: safetIntent, set: setSafetIntent, ph: 'Describe level of intent...' },
              { step: 3, label: 'History — prior attempts, self-harm, family history', val: safetHistory, set: setSafetHistory, ph: 'Document prior attempts, circumstances, medical severity...' },
            ].map(({ step, label, val, set, ph }, i) => (
              <div key={i} className="mb-4">
                <div className="text-xs font-bold text-navy uppercase mb-1">Step {step} — {label}</div>
                <textarea value={val} onChange={e => set(e.target.value)} disabled={readOnly} rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none" placeholder={ph} />
              </div>
            ))}

            {/* Step 4: Risk Level */}
            <div className="mb-6">
              <div className="text-xs font-bold text-navy uppercase mb-3 border-b border-border pb-1">Step 4 — Risk Level &amp; Intervention</div>
              {safetRiskFactors.some(Boolean) && (() => {
                const auto = calcSafetRisk(safetRiskFactors, safetProtective);
                return (
                  <div className={`mb-3 rounded-lg p-3 text-sm font-semibold border ${auto.level === 'High' ? 'bg-red-50 border-red-300 text-red-800' : auto.level === 'Moderate' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-green-50 border-green-300 text-green-800'}`}>
                    Algorithm suggestion: <strong>{auto.level}</strong>
                    {auto.triggers.length > 0 && <ul className="mt-1 text-xs font-normal space-y-0.5">{auto.triggers.map(t => <li key={t}>• {t}</li>)}</ul>}
                  </div>
                );
              })()}
              <div className="flex gap-3">
                {(['Low', 'Moderate', 'High'] as SafetRisk[]).map(level => (
                  <button key={level} disabled={readOnly} onClick={() => setSafetRisk(level)}
                    className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-bold transition-colors ${safetRisk === level ? (level === 'High' ? 'border-red-600 bg-red-600 text-white' : level === 'Moderate' ? 'border-amber-500 bg-amber-500 text-white' : 'border-green-600 bg-green-600 text-white') : 'border-border text-slate hover:border-navy/30'}`}>
                    {level}
                  </button>
                ))}
              </div>
              {safetRisk && safetRiskFactors.some(Boolean) && safetRisk !== calcSafetRisk(safetRiskFactors, safetProtective).level && (
                <div className="mt-2 text-xs text-violet-700 bg-violet-50 border border-violet-300 rounded-lg px-3 py-2">
                  Manual override selected — document rationale in intervention notes below.
                </div>
              )}
            </div>

            {/* Step 5 */}
            <div>
              <div className="text-xs font-bold text-navy uppercase mb-1">Step 5 — Documentation of Intervention &amp; Plan</div>
              <textarea value={safetActions} onChange={e => setSafetActions(e.target.value)} disabled={readOnly} rows={4}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                placeholder="Document clinical interventions, disposition, referrals, follow-up plan, and rationale for risk level..." />
            </div>
          </div>

          {safetRisk && (
            <div className="space-y-3">
              <div className={`rounded-xl border px-4 py-3 ${safetRisk === 'High' ? 'bg-red-100 border-red-300' : safetRisk === 'Moderate' ? 'bg-amber-100 border-amber-300' : 'bg-green-100 border-green-300'}`}>
                <div className={`text-lg font-bold ${safetRisk === 'High' ? 'text-red-700' : safetRisk === 'Moderate' ? 'text-amber-700' : 'text-green-700'}`}>
                  SAFE-T Risk Level: {safetRisk}
                </div>
              </div>
              <LockedButton locked={readOnly || safetDone || !safetActions.trim()} onClick={() => { setSafetDone(true); saveMsg('SAFE-T saved'); }}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
                <Save className="w-4 h-4" /> {safetDone ? 'SAFE-T Saved ✓' : 'Save SAFE-T'}
              </LockedButton>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          BAM
          ════════════════════════════════════════════════════════════════════ */}
      {sectionTab === 'Screening Forms' && tab === 'BAM' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-bold text-navy mb-1">Brief Addiction Monitor (BAM)</h2>
            <p className="text-xs text-slate mb-4">Rate each item from <strong>0</strong> (lowest) to <strong>10</strong> (highest). First section is Risk; second is Protective.</p>
            <div className="mb-5">
              <div className="text-xs font-bold text-navy uppercase mb-3 border-b border-border pb-1">Risk Factors (past 30 days)</div>
              <div className="space-y-4">
                {BAM_RISK_ITEMS.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="text-sm text-navy"><span className="font-bold text-orange mr-2">{i + 1}.</span>{item.q}</div>
                    <div className="text-xs text-slate mb-1">{item.label}</div>
                    <div className="flex gap-1">
                      {Array.from({ length: 11 }, (_, j) => (
                        <button key={j} onClick={() => { if (!readOnly) { const n = [...bamRisk]; n[i] = j; setBamRisk(n); } }} disabled={readOnly}
                          className={`flex-1 rounded border text-xs py-1.5 transition-colors ${bamRisk[i] === j ? 'border-orange bg-orange text-white font-bold' : 'border-border text-slate hover:border-orange/50'}`}>
                          {j}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-navy uppercase mb-3 border-b border-border pb-1">Protective Factors</div>
              <div className="space-y-4">
                {BAM_PROTECTIVE_ITEMS.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="text-sm text-navy"><span className="font-bold text-green-600 mr-2">{i + 1}.</span>{item.q}</div>
                    <div className="text-xs text-slate mb-1">{item.label}</div>
                    <div className="flex gap-1">
                      {Array.from({ length: 11 }, (_, j) => (
                        <button key={j} onClick={() => { if (!readOnly) { const n = [...bamProtective]; n[i] = j; setBamProtective(n); } }} disabled={readOnly}
                          className={`flex-1 rounded border text-xs py-1.5 transition-colors ${bamProtective[i] === j ? 'border-green-500 bg-green-500 text-white font-bold' : 'border-border text-slate hover:border-green-500/50'}`}>
                          {j}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {bamRisk.filter(v => v !== null).length === BAM_RISK_ITEMS.length && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <ScoreBadge label="BAM Risk" score={bamRiskScore} maxScore={70}
                  risk={{ label: bamRiskScore >= 50 ? 'High burden' : bamRiskScore >= 30 ? 'Moderate' : 'Low burden', color: bamRiskScore >= 50 ? 'text-red-700' : bamRiskScore >= 30 ? 'text-amber-700' : 'text-green-700', bg: bamRiskScore >= 50 ? 'bg-red-100 border-red-300' : bamRiskScore >= 30 ? 'bg-amber-100 border-amber-300' : 'bg-green-100 border-green-300' }} />
                <ScoreBadge label="BAM Protective" score={bamProtectiveScore} maxScore={100}
                  risk={{ label: bamProtectiveScore >= 70 ? 'Strong protective' : bamProtectiveScore >= 40 ? 'Moderate protective' : 'Low protective', color: bamProtectiveScore >= 70 ? 'text-green-700' : bamProtectiveScore >= 40 ? 'text-amber-700' : 'text-red-700', bg: bamProtectiveScore >= 70 ? 'bg-green-100 border-green-300' : bamProtectiveScore >= 40 ? 'bg-amber-100 border-amber-300' : 'bg-red-100 border-red-300' }} />
              </div>
              <LockedButton locked={readOnly || bamDone} onClick={() => { setBamDone(true); saveMsg('BAM saved'); }}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
                <Save className="w-4 h-4" /> {bamDone ? 'BAM Saved ✓' : 'Save BAM'}
              </LockedButton>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          BIOPSYCHOSOCIAL ASSESSMENT
          ════════════════════════════════════════════════════════════════════ */}
      {sectionTab === 'BPS' && (
        <div className="space-y-5">
          {/* Credential gate */}
          {!canDoBps ? (
            <div className="card border-2 border-amber-400 bg-amber-50">
              <div className="flex items-start gap-4">
                <Lock className="w-8 h-8 text-amber-600 shrink-0 mt-1" />
                <div>
                  <h2 className="text-base font-bold text-amber-900">Credential Required — Biopsychosocial Assessment</h2>
                  <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                    This assessment must be completed by a substance abuse counselor holding one of the following Maryland-recognized credentials:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-900 font-semibold">
                    <li>• <strong>ADT</strong> — Alcohol and Drug Trainee (under direct supervision of a BAS-designated supervisor)</li>
                    <li>• <strong>CSC-AD</strong> — Certified Substance Counselor — Alcohol and Drug</li>
                    <li>• <strong>CAC-AD</strong> — Certified Associate Counselor — Alcohol and Drug (Maryland BHA/ADAA)</li>
                    <li>• <strong>LCADC</strong> — Licensed Clinical Alcohol and Drug Counselor (MBPCT)</li>
                  </ul>
                  <p className="text-xs text-amber-700 mt-3">
                    Per COMAR 10.47.01 and Maryland BHA Provider Manual. Your current role ({role.shortLabel}) does not include a qualifying credential. Contact your Clinical Supervisor to complete this section.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-300 rounded-xl p-3 text-xs text-blue-800">
                <strong>Credentialed clinician:</strong> Completing as {role.shortLabel}. Per COMAR 10.47.01, this assessment must be signed by a clinician holding LCADC, CAC-AD, CSC-AD, or ADT credential. ADT trainees must have this co-signed by a Board Approved Supervisor (BAS).
              </div>

              {/* Biological */}
              <div className="card">
                <SectionHeading title="I — Biological Domain" sub="Medical history, family history, substance use history" />
                <div className="space-y-4">
                  <div>
                    <FieldLabel action={<AiDraftAssist fieldName="medical history" disabled={readOnly || bpsDone} onGenerate={() => generateBPSDraft('bio-medHx', bpsCtx)} onAccept={t => setBpsBio(p => ({ ...p, medHx: t }))} />}>
                      Medical History (primary diagnoses, chronic conditions, disabilities)
                    </FieldLabel>
                    <textarea value={bpsBio.medHx} onChange={e => setBpsBio(p => ({ ...p, medHx: e.target.value }))} disabled={readOnly}
                      rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="HTN, diabetes, HCV, HIV status, seizure disorder, chronic pain, cardiac issues..." />
                  </div>
                  <div>
                    <FieldLabel action={<AiDraftAssist fieldName="family history" disabled={readOnly || bpsDone} onGenerate={() => generateBPSDraft('bio-familyMedHx', bpsCtx)} onAccept={t => setBpsBio(p => ({ ...p, familyMedHx: t }))} />}>
                      Family Medical &amp; Psychiatric History
                    </FieldLabel>
                    <textarea value={bpsBio.familyMedHx} onChange={e => setBpsBio(p => ({ ...p, familyMedHx: e.target.value }))} disabled={readOnly}
                      rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="Family history of SUD, mental illness, suicide, chronic disease..." />
                  </div>
                  <div>
                    <FieldLabel>Allergies / Adverse Drug Reactions</FieldLabel>
                    <input value={bpsBio.allergies} onChange={e => setBpsBio(p => ({ ...p, allergies: e.target.value }))} disabled={readOnly}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="NKDA, or list specific allergies and reactions" />
                  </div>
                  <div>
                    <FieldLabel action={<AiDraftAssist fieldName="substance use history" disabled={readOnly || bpsDone} onGenerate={() => generateBPSDraft('bio-substanceHx', bpsCtx)} onAccept={t => setBpsBio(p => ({ ...p, substanceHxDetail: t }))} />}>
                      Detailed Substance Use History (age of first use, progression, periods of abstinence)
                    </FieldLabel>
                    <textarea value={bpsBio.substanceHxDetail} onChange={e => setBpsBio(p => ({ ...p, substanceHxDetail: e.target.value }))} disabled={readOnly}
                      rows={4} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="First use age, progression of use, longest sobriety, relapse triggers, withdrawal history, overdose history..." />
                  </div>
                </div>
              </div>

              {/* Psychological */}
              <div className="card">
                <SectionHeading title="II — Psychological Domain" sub="Mental health, trauma, cognitive, and behavioral history" />
                <div className="space-y-4">
                  <div>
                    <FieldLabel action={<AiDraftAssist fieldName="mental health history" disabled={readOnly || bpsDone} onGenerate={() => generateBPSDraft('psych-mentalHealth', bpsCtx)} onAccept={t => setBpsPsych(p => ({ ...p, mentalHealthHx: t }))} />}>
                      Mental Health History &amp; Current Diagnoses
                    </FieldLabel>
                    <textarea value={bpsPsych.mentalHealthHx} onChange={e => setBpsPsych(p => ({ ...p, mentalHealthHx: e.target.value }))} disabled={readOnly}
                      rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="Psychiatric diagnoses, hospitalizations, current medication management, MH providers..." />
                  </div>
                  <div>
                    <FieldLabel action={<AiDraftAssist fieldName="trauma history" disabled={readOnly || bpsDone} onGenerate={() => generateBPSDraft('psych-trauma', bpsCtx)} onAccept={t => setBpsPsych(p => ({ ...p, traumaHx: t }))} />}>
                      Trauma History (ACEs, PTSD, abuse, domestic violence, grief/loss)
                    </FieldLabel>
                    <textarea value={bpsPsych.traumaHx} onChange={e => setBpsPsych(p => ({ ...p, traumaHx: e.target.value }))} disabled={readOnly}
                      rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="Document trauma history as reported; note trauma-informed care considerations..." />
                  </div>
                  <div>
                    <FieldLabel action={<AiDraftAssist fieldName="coping skills" disabled={readOnly || bpsDone} onGenerate={() => generateBPSDraft('psych-coping', bpsCtx)} onAccept={t => setBpsPsych(p => ({ ...p, copingSkills: t }))} />}>
                      Coping Skills &amp; Strengths
                    </FieldLabel>
                    <textarea value={bpsPsych.copingSkills} onChange={e => setBpsPsych(p => ({ ...p, copingSkills: e.target.value }))} disabled={readOnly}
                      rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="Identified coping strategies, resilience factors, motivational strengths..." />
                  </div>
                  <div>
                    <FieldLabel>Cognitive Functioning &amp; Developmental Considerations</FieldLabel>
                    <textarea value={bpsPsych.cognitiveNote} onChange={e => setBpsPsych(p => ({ ...p, cognitiveNote: e.target.value }))} disabled={readOnly}
                      rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="Cognitive screen results, learning disabilities, TBI history, memory concerns..." />
                  </div>
                  <div>
                    <FieldLabel action={<AiDraftAssist fieldName="prior treatment history" disabled={readOnly || bpsDone} onGenerate={() => generateBPSDraft('psych-prevTx', bpsCtx)} onAccept={t => setBpsPsych(p => ({ ...p, prevMhTx: t }))} />}>
                      Previous Mental Health / SUD Treatment
                    </FieldLabel>
                    <textarea value={bpsPsych.prevMhTx} onChange={e => setBpsPsych(p => ({ ...p, prevMhTx: e.target.value }))} disabled={readOnly}
                      rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="Prior therapy, medication management, outcomes, barriers to engagement..." />
                  </div>
                </div>
              </div>

              {/* Social */}
              <div className="card">
                <SectionHeading title="III — Social Domain" sub="Housing, employment, family, legal, financial" />
                <div className="grid grid-cols-2 gap-4">
                  {([
                    ['housing',       'Housing Status & Stability',      'social-housing' as const, 'Stable, unstable, homeless, sober living, family home, shelter...'],
                    ['employment',    'Employment / Education Status',    null,                       'Employed, unemployed, disability, student, vocational goals...'],
                    ['socialSupport', 'Social Support Network',          'social-support' as const,  'Family relationships, peer support, 12-step sponsor, community connections...'],
                    ['family',        'Family Dynamics & Relationships', null,                       'Primary relationships, family of origin, children, caregiving responsibilities...'],
                    ['legal',         'Legal History & Current Status',  null,                       'Prior arrests, convictions, incarceration, current legal obligations...'],
                    ['finances',      'Financial Status & Resources',    null,                       'Income source, financial stability, debt, benefits, insurance coverage...'],
                  ] as const).map(([key, label, aiDomain, ph]) => (
                    <div key={key} className={key === 'housing' || key === 'socialSupport' ? 'col-span-2' : ''}>
                      <FieldLabel action={aiDomain ? (
                        <AiDraftAssist
                          fieldName={label.toLowerCase()}
                          disabled={readOnly || bpsDone}
                          onGenerate={() => generateBPSDraft(aiDomain, bpsCtx)}
                          onAccept={t => setBpsSocial(p => ({ ...p, [key]: t }))}
                        />
                      ) : undefined}>{label}</FieldLabel>
                      <textarea value={(bpsSocial as any)[key]} onChange={e => setBpsSocial(p => ({ ...p, [key]: e.target.value }))} disabled={readOnly}
                        rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none" placeholder={ph} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Spiritual / Cultural */}
              <div className="card">
                <SectionHeading title="IV — Spiritual &amp; Cultural Domain" />
                <div className="space-y-4">
                  <div>
                    <FieldLabel action={<AiDraftAssist fieldName="spiritual & cultural" disabled={readOnly || bpsDone} onGenerate={() => generateBPSDraft('spiritual', bpsCtx)} onAccept={t => setBpsSpiritCultural(p => ({ ...p, spiritual: t }))} />}>
                      Spiritual / Religious Beliefs &amp; Role in Recovery
                    </FieldLabel>
                    <textarea value={bpsSpiritCultural.spiritual} onChange={e => setBpsSpiritCultural(p => ({ ...p, spiritual: e.target.value }))} disabled={readOnly}
                      rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="Faith tradition, spiritual practices, role of spirituality in recovery motivation..." />
                  </div>
                  <div>
                    <FieldLabel>Cultural Identity &amp; Considerations</FieldLabel>
                    <textarea value={bpsSpiritCultural.cultural} onChange={e => setBpsSpiritCultural(p => ({ ...p, cultural: e.target.value }))} disabled={readOnly}
                      rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="Cultural background, language preference, cultural factors affecting treatment engagement..." />
                  </div>
                  <div>
                    <FieldLabel>Barriers to Treatment Engagement</FieldLabel>
                    <textarea value={bpsSpiritCultural.barriers} onChange={e => setBpsSpiritCultural(p => ({ ...p, barriers: e.target.value }))} disabled={readOnly}
                      rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="Transportation, childcare, work schedule, stigma, past negative treatment experiences..." />
                  </div>
                </div>
              </div>

              {/* Clinical Formulation */}
              <div className="card">
                <SectionHeading title="V — Clinical Formulation &amp; Treatment Recommendations"
                  sub="Required. Synthesize all domains into a clinical picture and LOC recommendation." />
                <div className="space-y-4">
                  <div>
                    <FieldLabel action={<AiDraftAssist fieldName="ASAM dimensions" disabled={readOnly || bpsDone} onGenerate={() => generateBPSDraft('formulation-asam', bpsCtx)} onAccept={t => setBpsFormulation(p => ({ ...p, asamDims: t }))} />}>
                      ASAM Dimension Summary (D1–D6)
                    </FieldLabel>
                    <textarea value={bpsFormulation.asamDims} onChange={e => setBpsFormulation(p => ({ ...p, asamDims: e.target.value }))} disabled={readOnly}
                      rows={4} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="D1: Acute Intoxication/Withdrawal | D2: Biomedical | D3: Emotional/Behavioral/Cognitive | D4: Readiness to Change | D5: Relapse/Continued Use Potential | D6: Recovery Environment" />
                  </div>
                  <div>
                    <FieldLabel>DSM-5 / ICD-10 Diagnostic Impression</FieldLabel>
                    <textarea value={bpsFormulation.diagnosis} onChange={e => setBpsFormulation(p => ({ ...p, diagnosis: e.target.value }))} disabled={readOnly}
                      rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="e.g. F11.20 Opioid Use Disorder, Severe; F32.1 Major Depressive Disorder, Moderate..." />
                  </div>
                  <div>
                    <FieldLabel action={<AiDraftAssist fieldName="clinical impression" disabled={readOnly || bpsDone} onGenerate={() => generateBPSDraft('formulation-impression', bpsCtx)} onAccept={t => setBpsFormulation(p => ({ ...p, clinicalImpression: t }))} />}>
                      Clinical Impression / Biopsychosocial Formulation
                    </FieldLabel>
                    <textarea value={bpsFormulation.clinicalImpression} onChange={e => setBpsFormulation(p => ({ ...p, clinicalImpression: e.target.value }))} disabled={readOnly}
                      rows={4} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="Synthesize the biological, psychological, and social factors contributing to the client's presenting problems and recovery needs..." />
                  </div>
                  <div>
                    <FieldLabel action={<AiDraftAssist fieldName="treatment recommendations" disabled={readOnly || bpsDone} onGenerate={() => generateBPSDraft('formulation-txRec', bpsCtx)} onAccept={t => setBpsFormulation(p => ({ ...p, txRec: t }))} />}>
                      Treatment Recommendations &amp; Level of Care Justification
                    </FieldLabel>
                    <textarea value={bpsFormulation.txRec} onChange={e => setBpsFormulation(p => ({ ...p, txRec: e.target.value }))} disabled={readOnly}
                      rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="Recommended LOC, rationale, specific treatment modalities, MAT considerations, psychiatric referrals..." />
                  </div>
                </div>

                <div className="mt-6 border-t border-border pt-5">
                  <div className="text-xs font-semibold text-slate uppercase mb-2">Clinician Signature — {role.shortLabel}</div>
                  <div className="text-xs text-slate mb-3">
                    By signing, I certify that I hold a qualifying credential (LCADC, CAC-AD, CSC-AD, or ADT under BAS supervision) and that this biopsychosocial assessment accurately reflects my clinical findings.
                  </div>
                  {!readOnly ? <SignatureCanvas label={`${role.shortLabel} Signature`} onSigned={setBpsClinicianSig} />
                    : <div className="text-xs text-slate italic">Signature locked in read-only mode</div>}
                </div>

                <div className="mt-4">
                  <LockedButton locked={readOnly || bpsDone || !bpsClinicianSig || !bpsFormulation.clinicalImpression.trim() || !bpsFormulation.txRec.trim()}
                    onClick={() => { setBpsDone(true); saveMsg('Biopsychosocial assessment saved'); }}
                    className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
                    <Save className="w-4 h-4" /> {bpsDone ? 'BPS Assessment Saved ✓' : 'Save Biopsychosocial Assessment'}
                  </LockedButton>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SUMMARY
          ════════════════════════════════════════════════════════════════════ */}
      {sectionTab === 'Screening Forms' && tab === 'Summary' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-bold text-navy mb-4">Screening &amp; Assessment Summary — {patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}</h2>

            {/* Admissions Screening block */}
            <div className={`rounded-xl border p-4 mb-4 ${hasExclusions ? 'border-red-400 bg-red-50' : reviewFlags.length > 0 ? 'border-amber-300 bg-amber-50' : 'border-green-400 bg-green-50'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${screeningDone ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {screeningDone && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="font-semibold text-navy text-sm">Admissions Screening</div>
                <div className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${hasExclusions ? 'bg-red-200 text-red-800' : reviewFlags.length > 0 ? 'bg-amber-200 text-amber-800' : 'bg-green-200 text-green-800'}`}>
                  {hasExclusions ? `${fatalExclusions.length} Exclusion${fatalExclusions.length > 1 ? 's' : ''}` : reviewFlags.length > 0 ? `${reviewFlags.length} Review Flag${reviewFlags.length > 1 ? 's' : ''}` : 'Eligible'}
                </div>
              </div>
              <div className="text-xs text-slate pl-8 space-y-0.5">
                <div>Program: <strong className="text-navy">{programType}</strong> · Referral: <strong className="text-navy">{referralSource || 'Not specified'}</strong></div>
                <div>Primary DOC: <strong className="text-navy">{drugsOfChoice[0].substance || 'Not specified'}</strong></div>
                <div>Ambulatory: <strong className="text-navy capitalize">{ambulatoryStatus}</strong> · Psychosis hx: <strong className="text-navy capitalize">{psychosisHistory}</strong></div>
                {fatalExclusions.map(e => <div key={e.key} className="text-red-700 font-medium">⛔ {e.label}</div>)}
                {reviewFlags.map(e => <div key={e.key} className="text-amber-700">⚠ {e.label}</div>)}
              </div>
            </div>

            {/* Scored instruments */}
            <div className="space-y-3">
              {[
                { name: 'PHQ-9', done: phq9Done, score: phq9Score, max: 27, risk: phq9Risk.label, color: phq9Risk.color },
                { name: 'DAST-10', done: dastDone, score: dastScore, max: 10, risk: dastRisk.label, color: dastRisk.color },
                { name: 'MAST', done: mastDone, score: mastScore, max: 53, risk: mastRiskVal.label, color: mastRiskVal.color },
                { name: 'SOGS', done: sogsDone, score: sogsScore, max: 23, risk: sogsRiskVal.label, color: sogsRiskVal.color },
                { name: 'SAFE-T', done: safetDone, score: null, max: null, risk: safetRisk ?? 'Not completed', color: safetRisk === 'High' ? 'text-red-700' : safetRisk === 'Moderate' ? 'text-amber-700' : safetRisk === 'Low' ? 'text-green-700' : 'text-slate' },
                { name: 'BAM (Risk)', done: bamDone, score: bamRiskScore, max: 70, risk: bamRiskScore >= 50 ? 'High burden' : bamRiskScore >= 30 ? 'Moderate' : 'Low burden', color: bamRiskScore >= 50 ? 'text-red-700' : bamRiskScore >= 30 ? 'text-amber-700' : 'text-green-700' },
                { name: 'Biopsychosocial', done: bpsDone, score: null, max: null, risk: bpsDone ? 'Complete' : canDoBps ? 'Pending signature' : 'Credential required', color: bpsDone ? 'text-green-700' : canDoBps ? 'text-amber-700' : 'text-slate' },
              ].map(item => (
                <div key={item.name} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {item.done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="font-semibold text-navy text-sm w-28">{item.name}</div>
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
            Completed {completedCount} of 8 sections ·{' '}
            {completedCount < 8 && 'Complete all sections before finalizing assessment.'}
            {completedCount === 8 && <span className="text-green-700 font-semibold">All sections complete — ready for clinical review and treatment planning.</span>}
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
