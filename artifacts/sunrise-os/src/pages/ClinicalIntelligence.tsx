import React, { useState } from 'react';
import {
  AlertTriangle, Brain, Shield, TrendingUp, Users, Activity,
  CheckCircle2, XCircle, Clock, AlertCircle, Zap, Heart,
  Home, Briefcase, DollarSign, Scale, UserCheck, Star,
  ChevronRight, Info, Pill, BarChart3, ArrowRight, BookOpen,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie,
} from 'recharts';
import { Screen } from '../App';

interface Props {
  navigate: (s: Screen, id?: string) => void;
  readOnly?: boolean;
}

// ── SBIRT mock data ─────────────────────────────────────────────────────────

const SBIRT_PATIENTS = [
  { id: 'p1', name: 'Marcus Webb',    auditC: 9, dast10: 8, pcptsd: 4, phq9: 14, intervention: 'Completed', referral: 'On MAT', dob: '1988-03-12', payer: 'Medicaid' },
  { id: 'p2', name: 'Devon Patel',    auditC: 5, dast10: 6, pcptsd: 3, phq9: 8,  intervention: 'Completed', referral: 'N/A',     dob: '1994-07-22', payer: 'BCBS' },
  { id: 'p3', name: 'Ashley Monroe',  auditC: 11,dast10: 4, pcptsd: 2, phq9: 11, intervention: 'Completed', referral: 'N/A',     dob: '1991-01-05', payer: 'Aetna' },
  { id: 'p4', name: 'Jordan Hayes',   auditC: 3, dast10: 9, pcptsd: 5, phq9: 17, intervention: 'Pending',   referral: 'Pending', dob: '2000-09-14', payer: 'Medicaid' },
  { id: 'p5', name: 'Casey Nguyen',   auditC: 7, dast10: 5, pcptsd: 1, phq9: 6,  intervention: 'Completed', referral: 'N/A',     dob: '1996-04-30', payer: 'United' },
  { id: 'p6', name: 'Alex Morales',   auditC: 10,dast10: 7, pcptsd: 4, phq9: 13, intervention: 'In Progress',referral:'Pending', dob: '1985-11-18', payer: 'Medicaid' },
  { id: 'p7', name: 'Taylor Brooks',  auditC: 4, dast10: 3, pcptsd: 0, phq9: 4,  intervention: 'N/A',       referral: 'N/A',     dob: '1999-06-02', payer: 'CareFirst' },
  { id: 'p8', name: 'Riley Johnson',  auditC: 8, dast10: 10,pcptsd: 5, phq9: 19, intervention: 'Completed', referral: 'On MAT',  dob: '1990-12-25', payer: 'Medicaid' },
];

const auditSeverity = (s: number) =>
  s >= 8 ? { label: 'High Risk',   bg: 'bg-red-100',    text: 'text-red-700'   } :
  s >= 4 ? { label: 'Moderate',    bg: 'bg-amber-100',  text: 'text-amber-700' } :
           { label: 'Low Risk',    bg: 'bg-green-100',  text: 'text-green-700' };

const dastSeverity = (s: number) =>
  s >= 6 ? { label: 'Substantial', bg: 'bg-red-100',    text: 'text-red-700'   } :
  s >= 3 ? { label: 'Moderate',    bg: 'bg-amber-100',  text: 'text-amber-700' } :
  s >= 1 ? { label: 'Low',        bg: 'bg-yellow-100', text: 'text-yellow-700'} :
           { label: 'None',        bg: 'bg-green-100',  text: 'text-green-700' };

const ptsdSeverity = (s: number) =>
  s >= 3  ? { label: 'Positive Screen', bg: 'bg-red-100',  text: 'text-red-700'   } :
            { label: 'Negative',        bg: 'bg-green-100',text: 'text-green-700' };

const phqSeverity = (s: number) =>
  s >= 15 ? { label: 'Severe',    bg: 'bg-red-100',    text: 'text-red-700'   } :
  s >= 10 ? { label: 'Moderate',  bg: 'bg-amber-100',  text: 'text-amber-700' } :
  s >= 5  ? { label: 'Mild',      bg: 'bg-yellow-100', text: 'text-yellow-700'} :
            { label: 'Minimal',   bg: 'bg-green-100',  text: 'text-green-700' };

// ── Recovery Capital data ───────────────────────────────────────────────────

const RCA_DOMAINS = ['Housing', 'Employment', 'Social Support', 'Physical Health', 'Mental Health', 'Financial', 'Legal Status', 'Recovery Community'];

const RCA_PATIENTS = [
  { name: 'Marcus Webb',   scores: [6,3,5,5,4,3,7,6], intake: [3,1,3,4,2,1,6,3] },
  { name: 'Devon Patel',   scores: [8,7,7,6,7,6,9,8], intake: [6,5,5,5,5,4,8,6] },
  { name: 'Ashley Monroe', scores: [5,4,6,6,5,4,8,5], intake: [2,2,3,4,3,2,7,2] },
  { name: 'Jordan Hayes',  scores: [3,2,3,4,2,2,5,3], intake: [2,1,2,3,1,1,4,2] },
  { name: 'Casey Nguyen',  scores: [7,6,8,7,7,7,9,7], intake: [5,4,6,6,5,5,8,5] },
  { name: 'Alex Morales',  scores: [4,3,4,5,3,3,6,4], intake: [2,2,3,4,2,2,5,3] },
  { name: 'Riley Johnson', scores: [4,2,4,4,3,2,5,4], intake: [1,1,2,3,1,1,4,2] },
];

// ── Care Pathway data ───────────────────────────────────────────────────────

const PATHWAY_PHASES = [
  { id: 'intake',       label: 'Intake & Assessment', color: 'bg-slate-500',   ring: 'ring-slate-300' },
  { id: 'stabilize',   label: 'Stabilization',        color: 'bg-amber-500',   ring: 'ring-amber-300' },
  { id: 'treatment',   label: 'Active Treatment',     color: 'bg-blue-500',    ring: 'ring-blue-300' },
  { id: 'maintenance', label: 'Maintenance / MAT',    color: 'bg-purple-500',  ring: 'ring-purple-300' },
  { id: 'stepdown',    label: 'Step-Down Ready',      color: 'bg-teal-500',    ring: 'ring-teal-300' },
  { id: 'discharge',   label: 'Discharge Planning',   color: 'bg-green-500',   ring: 'ring-green-300' },
];

const PATHWAY_PATIENTS = [
  { name: 'Marcus Webb',    phase: 'treatment',   days: 14, los: 14, target: 21, mat: true,  alert: false, program: 'Residential' },
  { name: 'Devon Patel',    phase: 'maintenance', days: 24, los: 24, target: 21, mat: false, alert: true,  program: 'PHP' },
  { name: 'Ashley Monroe',  phase: 'discharge',   days: 30, los: 30, target: 28, mat: false, alert: false, program: 'IOP' },
  { name: 'Jordan Hayes',   phase: 'stabilize',   days: 5,  los: 5,  target: 10, mat: false, alert: false, program: 'Residential' },
  { name: 'Casey Nguyen',   phase: 'treatment',   days: 18, los: 18, target: 21, mat: false, alert: false, program: 'PHP' },
  { name: 'Alex Morales',   phase: 'intake',      days: 2,  los: 2,  target: 21, mat: false, alert: false, program: 'Residential' },
  { name: 'Taylor Brooks',  phase: 'stepdown',    days: 20, los: 20, target: 21, mat: false, alert: false, program: 'IOP' },
  { name: 'Riley Johnson',  phase: 'treatment',   days: 12, los: 12, target: 21, mat: true,  alert: false, program: 'Residential' },
];

// ── Clinical Decision Support alerts ───────────────────────────────────────

const CDS_ALERTS = [
  {
    id: 'a1', severity: 'critical', type: 'Drug Interaction', patient: 'Riley Johnson', timestamp: 'Today 08:14',
    title: 'Benzodiazepine + Buprenorphine co-prescription',
    detail: 'Patient is prescribed clonazepam 0.5 mg BID and buprenorphine/naloxone 8/2 mg BID. Concomitant use significantly increases risk of respiratory depression, sedation, and overdose. SAMHSA recommends avoiding unless clinically necessary with close monitoring.',
    recommendation: 'Review with prescribing MD. If medically necessary, titrate to lowest effective dose and ensure naloxone is dispensed. Document risk-benefit rationale.',
    ack: false,
  },
  {
    id: 'a2', severity: 'high', type: 'Safety Plan Required', patient: 'Jordan Hayes', timestamp: 'Today 09:02',
    title: 'PHQ-9 Item 9 positive — no active safety plan on file',
    detail: 'PHQ-9 item 9 scored 2 ("More than half the days"). Per COMAR 10.47.03.08B and the Maryland BHA Zero Suicide Initiative protocol, a Columbia Protocol Safety Planning Intervention (SPI) is required whenever suicidal ideation is endorsed. A formal written safety plan must be completed and co-signed before the client\'s next service encounter. No active safety plan found in chart.',
    recommendation: 'Primary counselor (CAC-AD or higher) must complete Columbia SPI safety plan before end of current shift. Document in progress note and co-sign with BAS or LCPC/LCSW-C supervisor within 24 hours per COMAR 10.47.03. Notify medical director if imminent risk is assessed.',
    ack: false,
  },
  {
    id: 'a3', severity: 'high', type: 'PDMP Alert', patient: 'Marcus Webb', timestamp: 'Yesterday 16:48',
    title: 'High-dose opioid history — PDMP shows 3 overlapping prescriptions (prior 90 days)',
    detail: 'Maryland PDMP query returned 3 controlled substance prescriptions from different prescribers in the 90-day window prior to admission: oxycodone 30 mg (Dr. A. Pierce), tramadol 100 mg (Urgent Care), and methadone 40 mg (previous MMT program). Overdose risk substantially elevated.',
    recommendation: 'Confirm current MAT dosing with medical director. Ensure naloxone prescribed and patient/family educated. Alert care team of elevated overdose risk. Flag in EHR.',
    ack: true,
  },
  {
    id: 'a4', severity: 'moderate', type: 'ASAM Review Overdue', patient: 'Devon Patel', timestamp: 'Yesterday 11:30',
    title: 'ASAM Level of Care review overdue by 3 days',
    detail: 'ASAM LOC review was due 2026-07-18 per COMAR 10.47.04 and MD BHA Provider Manual (LOC reassessment required every 14 days for PHP/ASAM 2.5 to support continued HealthChoice authorization). Chart shows last reassessment documented 2026-07-11. Patient has been in PHP for 24 days; initial target LOS was 21 days.',
    recommendation: 'Complete ASAM LOCA reassessment and document in chart immediately. Determine if step-down to IOP (ASAM 2.1) is clinically appropriate per COMAR 10.47.05. Update HealthChoice MCO authorization and notify billing team. Per COMAR 10.47.04, reassessment findings must be reflected in the next treatment plan update.',
    ack: false,
  },
  {
    id: 'a5', severity: 'moderate', type: 'Treatment Plan Overdue', patient: 'Alex Morales', timestamp: 'Today 07:00',
    title: 'Initial Treatment Plan: preliminary plan overdue; comprehensive plan due by 5-working-day deadline',
    detail: 'Patient admitted 2026-07-19 to Residential (ASAM 3.5). Per COMAR 10.47.03.08B: (1) a preliminary individualized care plan is required within 24 hours of admission, and (2) a comprehensive individualized treatment plan within 5 working days of admission. Chart shows only a partial draft — no counselor signature and no BAS co-signature. CARF standard 3.L.1.c additionally requires the plan to reflect individualized, measurable goals.',
    recommendation: 'Assigned counselor T. Jackson (CAC-AD) must complete and sign the comprehensive treatment plan by 2026-07-26 (5 working days from admission). BAS James Collins must co-sign within 24 hours of counselor signature per COMAR 10.47.03.08B(2). A COMAR compliance finding will be recorded if plan is unsigned by the deadline — reportable to MD BHA at next facility audit.',
    ack: false,
  },
  {
    id: 'a6', severity: 'info', type: 'Medication Reconciliation', patient: 'Taylor Brooks', timestamp: 'Today 06:30',
    title: 'Discharge medication reconciliation needed before step-down',
    detail: 'Patient approaching discharge from IOP. Current medications include naltrexone injection (Vivitrol 380 mg IM monthly — last dose 2026-06-28, next due 2026-07-28). Step-down plan should ensure next injection is scheduled at receiving IOP or outpatient provider.',
    recommendation: 'Warm handoff to Rockville Outpatient provider. Confirm injection scheduling before discharge. Provide Bridge Script if gap > 7 days.',
    ack: false,
  },
];

const SEV_CONFIG: Record<string, { bg: string; border: string; icon: string; pill: string; pillText: string }> = {
  critical: { bg: 'bg-red-50',    border: 'border-red-300',   icon: 'text-red-600',   pill: 'bg-red-100',    pillText: 'text-red-700' },
  high:     { bg: 'bg-orange-50', border: 'border-orange-300',icon: 'text-orange-600',pill: 'bg-orange-100', pillText: 'text-orange-700' },
  moderate: { bg: 'bg-amber-50',  border: 'border-amber-200', icon: 'text-amber-600', pill: 'bg-amber-100',  pillText: 'text-amber-700' },
  info:     { bg: 'bg-blue-50',   border: 'border-blue-200',  icon: 'text-blue-600',  pill: 'bg-blue-100',   pillText: 'text-blue-700' },
};

// ── Component ───────────────────────────────────────────────────────────────

export function ClinicalIntelligence({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'sbirt' | 'capital' | 'pathway' | 'alerts'>('alerts');
  const [selectedPatient, setSelectedPatient] = useState<string>('Marcus Webb');
  const [expandedAlert, setExpandedAlert] = useState<string | null>('a1');
  const [acked, setAcked] = useState<Set<string>>(new Set(['a3']));

  const TABS = [
    { id: 'alerts',  label: 'Clinical Alerts',          icon: AlertTriangle, count: CDS_ALERTS.filter(a => !acked.has(a.id) && a.severity !== 'info').length },
    { id: 'sbirt',   label: 'SBIRT Screening',          icon: BookOpen,      count: SBIRT_PATIENTS.filter(p => p.intervention === 'Pending').length },
    { id: 'capital', label: 'Recovery Capital',         icon: Heart,         count: null },
    { id: 'pathway', label: 'Care Pathways',            icon: TrendingUp,    count: PATHWAY_PATIENTS.filter(p => p.alert).length },
  ] as const;

  const rcaPatient = RCA_PATIENTS.find(p => p.name === selectedPatient) ?? RCA_PATIENTS[0];
  const radarData = RCA_DOMAINS.map((d, i) => ({
    domain:  d,
    Current: rcaPatient.scores[i],
    Intake:  rcaPatient.intake[i],
  }));

  const openAlerts = CDS_ALERTS.filter(a => !acked.has(a.id));
  const criticalCount = openAlerts.filter(a => a.severity === 'critical').length;
  const highCount     = openAlerts.filter(a => a.severity === 'high').length;

  return (
    <div className="space-y-5 fade-in">
      {/* Page header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-navy via-[#1a2744] to-[#1e2d54] px-6 py-5 shadow-lg border border-white/10">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-blue-500 opacity-[0.07] blur-3xl" />
          <div className="absolute right-32 bottom-0 w-48 h-48 rounded-full bg-purple-600 opacity-[0.07] blur-3xl" />
        </div>
        <div className="relative flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">Clinical Intelligence Center</span>
            </div>
            <h1 className="text-white text-2xl font-bold leading-tight">Evidence-Based Decision Support</h1>
            <p className="text-slate-400 text-sm mt-1">SBIRT · Recovery Capital Index · Care Pathways · SAMHSA/ASAM Protocol Compliance</p>
          </div>
          <div className="flex gap-4 shrink-0">
            {criticalCount > 0 && (
              <div className="text-center">
                <div className="text-3xl font-extrabold text-red-400">{criticalCount}</div>
                <div className="text-[10px] text-red-300 uppercase tracking-wide font-bold">Critical</div>
              </div>
            )}
            <div className="w-px h-10 bg-white/10" />
            {highCount > 0 && (
              <div className="text-center">
                <div className="text-3xl font-extrabold text-orange-400">{highCount}</div>
                <div className="text-[10px] text-orange-300 uppercase tracking-wide font-bold">High</div>
              </div>
            )}
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-extrabold text-slate-200">{SBIRT_PATIENTS.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Patients</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white border border-border rounded-xl shadow-sm">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                active
                  ? 'bg-navy text-white shadow-md'
                  : 'text-slate hover:text-navy hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
              {t.count != null && t.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-sunrise-orange text-white' : 'bg-red-100 text-red-700'}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── CLINICAL ALERTS TAB ─────────────────────────────────────────────── */}
      {tab === 'alerts' && (
        <div className="space-y-4">
          {/* Summary row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Critical', count: CDS_ALERTS.filter(a => a.severity === 'critical').length, open: openAlerts.filter(a => a.severity === 'critical').length, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
              { label: 'High',     count: CDS_ALERTS.filter(a => a.severity === 'high').length,     open: openAlerts.filter(a => a.severity === 'high').length,     bg: 'bg-orange-50',border:'border-orange-200',text:'text-orange-700' },
              { label: 'Moderate', count: CDS_ALERTS.filter(a => a.severity === 'moderate').length, open: openAlerts.filter(a => a.severity === 'moderate').length, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
              { label: 'Info',     count: CDS_ALERTS.filter(a => a.severity === 'info').length,     open: openAlerts.filter(a => a.severity === 'info').length,     bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-700' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4 text-center`}>
                <div className={`text-2xl font-extrabold ${s.text}`}>{s.open}</div>
                <div className={`text-xs font-bold uppercase tracking-wide ${s.text} opacity-80`}>{s.label}</div>
                <div className="text-[10px] text-slate mt-0.5">{s.open}/{s.count} open</div>
              </div>
            ))}
          </div>

          {/* Alert cards */}
          <div className="space-y-3">
            {CDS_ALERTS.map(alert => {
              const sc = SEV_CONFIG[alert.severity];
              const isAcked = acked.has(alert.id);
              const isExpanded = expandedAlert === alert.id;
              const SevIcon = alert.severity === 'critical' ? AlertTriangle :
                              alert.severity === 'high'     ? AlertCircle :
                              alert.severity === 'moderate' ? Clock : Info;
              return (
                <div
                  key={alert.id}
                  className={`border rounded-xl overflow-hidden transition-all ${sc.border} ${isAcked ? 'opacity-60' : ''}`}
                >
                  <button
                    onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                    className={`w-full text-left ${sc.bg} px-4 py-3.5 flex items-start gap-3`}
                  >
                    <SevIcon className={`w-5 h-5 ${sc.icon} flex-none mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`pill text-[10px] px-2 py-0.5 rounded-full font-bold ${sc.pill} ${sc.pillText}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-semibold text-slate bg-white/70 border border-white/50 rounded px-1.5 py-0.5">{alert.type}</span>
                        <span className="text-[10px] text-slate-400 ml-auto hidden sm:block">{alert.timestamp}</span>
                      </div>
                      <div className="text-sm font-semibold text-navy mt-1">{alert.title}</div>
                      <div className="text-xs text-slate mt-0.5">Patient: <strong>{alert.patient}</strong></div>
                    </div>
                    <div className="flex items-center gap-2 flex-none ml-2">
                      {isAcked && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Acknowledged</span>}
                      <ChevronRight className={`w-4 h-4 text-slate transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="bg-white border-t border-gray-100 px-5 py-4 space-y-3">
                      <div>
                        <div className="text-[10px] font-bold text-slate uppercase tracking-wide mb-1">Clinical Detail</div>
                        <p className="text-sm text-navy leading-relaxed">{alert.detail}</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Recommended Action
                        </div>
                        <p className="text-sm text-blue-900">{alert.recommendation}</p>
                      </div>
                      {!isAcked && !readOnly && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => navigate('PatientList')}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-gray-50 text-slate transition-colors"
                          >
                            Open Chart <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setAcked(prev => new Set([...prev, alert.id]))}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledge & Document
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Evidence base footer */}
          <div className="card-sm flex items-center gap-3 text-xs text-slate">
            <Shield className="w-4 h-4 text-blue-400 flex-none" />
            <span>Alert logic grounded in <strong>COMAR 10.47.03–10.47.05</strong> (Maryland BHA documentation &amp; staffing requirements), <strong>DSAMH Provider Manual §5</strong> (Delaware), <strong>SAMHSA TIP-63</strong>, <strong>ASAM LOCA Clinical Practice Guidelines</strong>, <strong>CARF CRS 3.L standards</strong>, <strong>MD BHA Provider Manual</strong>, and <strong>Columbia Suicide Severity Rating Scale (C-SSRS) / Columbia SPI</strong>.</span>
          </div>
        </div>
      )}

      {/* ── SBIRT TAB ──────────────────────────────────────────────────────── */}
      {tab === 'sbirt' && (
        <div className="space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Screened',           value: '8/8',   sub: '100% completion',    bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
              { label: 'Positive Screens',   value: '6',     sub: 'AUDIT-C ≥4 or DAST ≥3', bg: 'bg-red-50 border-red-200',     text: 'text-red-700'   },
              { label: 'BI Completed',        value: '6/6',   sub: 'Brief intervention done', bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-700'  },
              { label: 'Referred to Tx',     value: '2',     sub: 'Currently on MAT',   bg: 'bg-purple-50 border-purple-200',text: 'text-purple-700'},
            ].map(k => (
              <div key={k.label} className={`${k.bg} border rounded-xl p-4 text-center`}>
                <div className={`text-2xl font-extrabold ${k.text}`}>{k.value}</div>
                <div className={`text-xs font-bold uppercase tracking-wide ${k.text} opacity-80`}>{k.label}</div>
                <div className="text-[10px] text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* What is SBIRT callout */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl px-5 py-3 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-none" />
            <div className="text-xs text-blue-900">
              <strong>SBIRT</strong> (Screening, Brief Intervention, and Referral to Treatment) is federally recommended per SAMHSA TIP-61 and <strong>mandated for Maryland Medicaid-funded SUD programs under COMAR 10.63.09</strong> and for Delaware DSAMH-funded programs per DSAMH Provider Manual §7. All clients must be screened at admission and at clinically indicated intervals.
              Screening tools: <strong>AUDIT-C</strong> (alcohol, 0–12), <strong>DAST-10</strong> (drugs, 0–10), <strong>PC-PTSD-5</strong> (trauma, 0–5), and <strong>PHQ-9</strong> (depression, 0–27).
            </div>
          </div>

          {/* Patient screening matrix */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-navy text-sm">Patient Screening Matrix — Current Census</h3>
              <span className="text-[10px] text-slate">Last updated: Jul 22, 2026</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate">Patient</th>
                    <th className="px-3 py-3 font-semibold text-slate text-center">AUDIT-C<br/><span className="font-normal opacity-70">Alcohol (0–12)</span></th>
                    <th className="px-3 py-3 font-semibold text-slate text-center">DAST-10<br/><span className="font-normal opacity-70">Drugs (0–10)</span></th>
                    <th className="px-3 py-3 font-semibold text-slate text-center">PC-PTSD-5<br/><span className="font-normal opacity-70">Trauma (0–5)</span></th>
                    <th className="px-3 py-3 font-semibold text-slate text-center">PHQ-9<br/><span className="font-normal opacity-70">Mood (0–27)</span></th>
                    <th className="px-3 py-3 font-semibold text-slate text-center">BI Status</th>
                    <th className="px-3 py-3 font-semibold text-slate text-center">Referral</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {SBIRT_PATIENTS.map(p => {
                    const aud = auditSeverity(p.auditC);
                    const dst = dastSeverity(p.dast10);
                    const pts = ptsdSeverity(p.pcptsd);
                    const phq = phqSeverity(p.phq9);
                    const biBg = p.intervention === 'Completed' ? 'bg-green-100 text-green-700' :
                                 p.intervention === 'Pending'    ? 'bg-red-100 text-red-700' :
                                 p.intervention === 'In Progress'? 'bg-amber-100 text-amber-700' :
                                 'bg-gray-100 text-gray-500';
                    const refBg = p.referral === 'On MAT'  ? 'bg-purple-100 text-purple-700' :
                                  p.referral === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-500';
                    return (
                      <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-navy">{p.name}
                          <div className="text-[10px] text-slate font-normal">{p.payer}</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${aud.bg} ${aud.text}`}>{p.auditC}</span>
                          <div className={`text-[9px] mt-0.5 font-medium ${aud.text}`}>{aud.label}</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${dst.bg} ${dst.text}`}>{p.dast10}</span>
                          <div className={`text-[9px] mt-0.5 font-medium ${dst.text}`}>{dst.label}</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${pts.bg} ${pts.text}`}>{p.pcptsd}</span>
                          <div className={`text-[9px] mt-0.5 font-medium ${pts.text}`}>{pts.label}</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${phq.bg} ${phq.text}`}>{p.phq9}</span>
                          <div className={`text-[9px] mt-0.5 font-medium ${phq.text}`}>{phq.label}</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${biBg}`}>{p.intervention}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${refBg}`}>{p.referral}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Population-level bar chart */}
          <div className="card">
            <h3 className="font-bold text-navy text-sm mb-4">Population-Level Screening Distribution</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-slate mb-2 font-medium">AUDIT-C Severity Distribution</div>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={[{name:'Low (0–3)',v:2},{name:'Moderate (4–7)',v:2},{name:'High (8–12)',v:4}]} margin={{top:4,right:8,bottom:0,left:-24}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize:9}} tickLine={false} axisLine={false} />
                    <YAxis tick={{fontSize:9}} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{fontSize:11}} formatter={(v:number)=>[v,'Patients']} />
                    <Bar dataKey="v" radius={[4,4,0,0]}>
                      <Cell fill="#22c55e"/><Cell fill="#f59e0b"/><Cell fill="#ef4444"/>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div className="text-xs text-slate mb-2 font-medium">DAST-10 Severity Distribution</div>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={[{name:'None (0)',v:0},{name:'Low (1–2)',v:1},{name:'Mod (3–5)',v:2},{name:'Subst (6+)',v:5}]} margin={{top:4,right:8,bottom:0,left:-24}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize:9}} tickLine={false} axisLine={false} />
                    <YAxis tick={{fontSize:9}} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{fontSize:11}} formatter={(v:number)=>[v,'Patients']} />
                    <Bar dataKey="v" radius={[4,4,0,0]}>
                      <Cell fill="#94a3b8"/><Cell fill="#fbbf24"/><Cell fill="#f97316"/><Cell fill="#ef4444"/>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECOVERY CAPITAL TAB ───────────────────────────────────────────── */}
      {tab === 'capital' && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-xl px-5 py-3 flex items-start gap-3">
            <Heart className="w-4 h-4 text-teal-600 mt-0.5 flex-none" />
            <div className="text-xs text-teal-900">
              <strong>Recovery Capital</strong> measures the breadth and depth of internal and external resources available to initiate and sustain recovery.
              High recovery capital is one of the strongest predictors of long-term remission (SAMHSA, White &amp; Cloud, 2008).
              Domains scored 0–10; composite ≥60 correlates with sustained recovery at 12 months.
            </div>
          </div>

          {/* Patient selector + radar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate uppercase tracking-wide">Select Patient</div>
              {RCA_PATIENTS.map(p => {
                const avg = Math.round(p.scores.reduce((a,b)=>a+b,0)/p.scores.length*10);
                const intakeAvg = Math.round(p.intake.reduce((a,b)=>a+b,0)/p.intake.length*10);
                const gain = avg - intakeAvg;
                const isSelected = selectedPatient === p.name;
                return (
                  <button
                    key={p.name}
                    onClick={() => setSelectedPatient(p.name)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'bg-navy text-white border-navy'
                        : 'bg-white border-border hover:border-navy/30 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`font-semibold ${isSelected ? 'text-white' : 'text-navy'}`}>{p.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={isSelected ? 'text-slate-300' : 'text-slate'}>RCI: {avg}/100</span>
                      <span className={`text-[10px] font-bold ${gain > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {gain > 0 ? '▲' : '▼'}{Math.abs(gain)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="col-span-2">
              <div className="card h-full">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-navy text-sm">{selectedPatient} — Recovery Capital Profile</h3>
                  <div className="flex gap-4 text-xs text-slate">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 rounded-full inline-block" /> Current</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 rounded-full inline-block" /> Intake</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData} margin={{top:10,right:30,bottom:10,left:30}}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="domain" tick={{fontSize:9,fill:'#64748b'}} />
                    <Radar name="Current" dataKey="Current" stroke="#2563EB" fill="#2563EB" fillOpacity={0.25} strokeWidth={2} />
                    <Radar name="Intake"  dataKey="Intake"  stroke="#FBBF24" fill="#FBBF24" fillOpacity={0.12} strokeWidth={1.5} strokeDasharray="4 2" />
                    <Tooltip contentStyle={{fontSize:11}} formatter={(v:number,n:string)=>[`${v}/10`,n]} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {RCA_DOMAINS.slice(0,8).map((d,i)=>{
                    const score = rcaPatient.scores[i];
                    const intake = rcaPatient.intake[i];
                    const gain = score - intake;
                    const Icons = [Home, Briefcase, Users, Activity, Brain, DollarSign, Scale, UserCheck, Star];
                    const DomIcon = Icons[i] ?? Star;
                    return (
                      <div key={d} className={`rounded-lg border p-2 text-center ${score >= 7 ? 'bg-green-50 border-green-200' : score >= 4 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                        <DomIcon className="w-3 h-3 mx-auto mb-0.5 text-slate" />
                        <div className="text-[9px] text-slate font-medium leading-tight">{d.split(' ')[0]}</div>
                        <div className={`font-bold text-sm ${score >= 7 ? 'text-green-700' : score >= 4 ? 'text-amber-700' : 'text-red-700'}`}>{score}</div>
                        <div className={`text-[9px] font-bold ${gain > 0 ? 'text-green-600' : 'text-red-500'}`}>{gain > 0 ? `+${gain}` : `${gain}`}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* All-patient summary table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-gray-50">
              <h3 className="font-bold text-navy text-sm">Census Recovery Capital Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate">Patient</th>
                    {['Housing','Employ.','Social','Physical','Mental','Financial','Legal','Recovery'].map(d=>(
                      <th key={d} className="px-2 py-2.5 font-semibold text-slate text-center">{d}</th>
                    ))}
                    <th className="px-3 py-2.5 font-semibold text-slate text-center">RCI Total</th>
                    <th className="px-3 py-2.5 font-semibold text-slate text-center">Δ Intake</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {RCA_PATIENTS.map(p => {
                    const total = Math.round(p.scores.reduce((a,b)=>a+b,0)/p.scores.length*10);
                    const intakeTotal = Math.round(p.intake.reduce((a,b)=>a+b,0)/p.intake.length*10);
                    const gain = total - intakeTotal;
                    return (
                      <tr key={p.name} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-2.5 font-semibold text-navy">{p.name}</td>
                        {p.scores.map((s,i)=>(
                          <td key={i} className="px-2 py-2.5 text-center">
                            <span className={`inline-block w-7 h-5 rounded text-center font-bold leading-5 text-[11px] ${s>=7?'bg-green-100 text-green-700':s>=4?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{s}</span>
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-center font-bold text-navy">{total}/100</td>
                        <td className={`px-3 py-2.5 text-center font-bold ${gain>0?'text-green-600':'text-red-500'}`}>{gain>0?`+${gain}`:gain}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CARE PATHWAYS TAB ──────────────────────────────────────────────── */}
      {tab === 'pathway' && (
        <div className="space-y-4">
          {/* Phase legend */}
          <div className="flex gap-2 flex-wrap">
            {PATHWAY_PHASES.map(phase => (
              <div key={phase.id} className="flex items-center gap-1.5 text-xs text-slate bg-white border border-border rounded-full px-3 py-1">
                <div className={`w-2.5 h-2.5 rounded-full ${phase.color}`} />
                {phase.label}
              </div>
            ))}
          </div>

          {/* Pathway pipeline */}
          <div className="grid grid-cols-6 gap-3">
            {PATHWAY_PHASES.map(phase => {
              const phasePts = PATHWAY_PATIENTS.filter(p => p.phase === phase.id);
              return (
                <div key={phase.id} className="bg-white border border-border rounded-xl overflow-hidden">
                  <div className={`px-3 py-2 text-white text-[10px] font-bold uppercase tracking-wide text-center ${phase.color}`}>
                    {phase.label}
                    <div className="text-white/70 font-normal normal-case tracking-normal text-[10px]">{phasePts.length} patient{phasePts.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="p-2 space-y-2 min-h-24">
                    {phasePts.map(pt => {
                      const losOverrun = pt.los > pt.target;
                      return (
                        <div key={pt.name} className={`rounded-lg border p-2 text-[10px] ${pt.alert ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="font-bold text-navy leading-tight">{pt.name.split(' ')[0]}</div>
                          <div className="text-slate">{pt.program}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`font-medium ${losOverrun ? 'text-amber-600' : 'text-green-600'}`}>Day {pt.los}</span>
                            {pt.mat && <span className="bg-purple-100 text-purple-700 text-[9px] px-1 rounded font-bold">MAT</span>}
                            {pt.alert && <span className="bg-amber-100 text-amber-700 text-[9px] px-1 rounded font-bold">Review Due</span>}
                          </div>
                        </div>
                      );
                    })}
                    {phasePts.length === 0 && (
                      <div className="text-[10px] text-slate text-center py-4 opacity-50">—</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Patient detail table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-gray-50">
              <h3 className="font-bold text-navy text-sm">Treatment Pathway Detail — Evidence-Based Step-Down Protocol</h3>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate">Patient</th>
                  <th className="px-3 py-2.5 font-semibold text-slate text-center">Program</th>
                  <th className="px-3 py-2.5 font-semibold text-slate text-center">Phase</th>
                  <th className="px-3 py-2.5 font-semibold text-slate text-center">LOS</th>
                  <th className="px-3 py-2.5 font-semibold text-slate text-center">Target LOS</th>
                  <th className="px-3 py-2.5 font-semibold text-slate text-center">LOS vs Target</th>
                  <th className="px-3 py-2.5 font-semibold text-slate text-center">MAT</th>
                  <th className="px-3 py-2.5 font-semibold text-slate text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PATHWAY_PATIENTS.map(p => {
                  const overrun = p.los > p.target;
                  const phaseCfg = PATHWAY_PHASES.find(f => f.id === p.phase);
                  const phasePct = Math.min(100, Math.round((p.los / p.target) * 100));
                  return (
                    <tr key={p.name} className={`hover:bg-blue-50/30 transition-colors ${p.alert ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-4 py-2.5 font-semibold text-navy">{p.name}</td>
                      <td className="px-3 py-2.5 text-center text-slate">{p.program}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-white text-[9px] font-bold px-2 py-0.5 rounded-full ${phaseCfg?.color}`}>{phaseCfg?.label}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-navy">{p.los}d</td>
                      <td className="px-3 py-2.5 text-center text-slate">{p.target}d</td>
                      <td className="px-3 py-2.5">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${overrun ? 'bg-amber-500' : 'bg-blue-500'}`} style={{width:`${phasePct}%`}}/>
                        </div>
                        <div className={`text-[9px] text-center mt-0.5 font-medium ${overrun ? 'text-amber-600' : 'text-blue-600'}`}>
                          {phasePct}%{overrun ? ' · Overrun' : ' · On track'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {p.mat ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-200 mx-auto" />}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {p.alert
                          ? <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Review Due</span>
                          : <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">On Track</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Step-down criteria card */}
          <div className="card-sm">
            <div className="text-xs font-bold text-navy mb-2 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" /> ASAM / MD BHA Level of Care Transition Criteria (Summary)
            </div>
            <div className="grid grid-cols-3 gap-3 text-[10px] text-slate">
              {[
                { from:'Residential (3.7)', to:'PHP (2.5)', criteria:'Clinical stabilization achieved (ASAM Dim. 1–3) · No imminent withdrawal risk · Can safely manage in structured day program · Stable housing confirmed · ASAM LOC reassessment documented per COMAR 10.47.03.08B(3)' },
                { from:'PHP (2.5)',          to:'IOP (2.1)', criteria:'Abstinent or MAT-stable · PHP goals substantially met · Housing and support network sufficient · No acute co-occurring psychiatric crisis · ASAM reassessment per COMAR 10.47.04 supporting step-down' },
                { from:'IOP (2.1)',          to:'OP / Aftercare', criteria:'Treatment goals met per individualized plan · Recovery Capital Index ≥60 · Stable housing + employment/school · Active support system · ASAM reassessment per COMAR 10.47.05 / DSAMH Manual §5 supporting step-down · Aftercare referral confirmed' },
              ].map(c => (
                <div key={c.from} className="bg-gray-50 border border-border rounded-lg p-2.5">
                  <div className="font-bold text-navy flex items-center gap-1 mb-1">
                    {c.from} <ArrowRight className="w-3 h-3 text-slate" /> {c.to}
                  </div>
                  <p className="leading-relaxed">{c.criteria}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
