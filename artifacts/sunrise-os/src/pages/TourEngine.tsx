import React, { useState, useEffect, useCallback } from 'react';
import { Screen } from '../App';
import { X, ChevronRight, ChevronLeft, RotateCcw, MapPin, LayoutDashboard, Users, ShieldCheck } from 'lucide-react';
import { useRole } from '../context/RoleContext';

interface TourStep {
  id: string;
  title: string;
  description: string;
  screen: Screen;
  screenLabel: string;
  targetSelector?: string;
}

interface Tour {
  id: string;
  name: string;
  icon: React.ReactNode;
  roleHint: string[];
  duration: string;
  steps: TourStep[];
  color: string;
}

const TOURS: Tour[] = [
  {
    id: 'executive',
    name: 'Executive Overview',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roleHint: ['executive', 'clinical_director', 'admin'],
    duration: '7–10 min · 9 steps',
    color: 'bg-navy text-white',
    steps: [
      {
        id: 'ex-1', screen: 'Dashboard', screenLabel: 'Dashboard',
        title: 'Welcome to SunriseOS',
        description: 'SunriseOS is a purpose-built clinical operating system for behavioral health and addiction treatment facilities. This tour walks you through the executive view — from real-time census to revenue cycle and compliance.',
      },
      {
        id: 'ex-2', screen: 'Dashboard', screenLabel: 'Dashboard',
        targetSelector: '[data-tour-id="kpi-census"]',
        title: 'Live Census & Occupancy',
        description: 'The top KPI row shows real-time census, occupancy rate, and program breakdown. Each card is a drill-down — click to see the full patient list or LOC distribution. Targets and variance vs. last week are displayed inline.',
      },
      {
        id: 'ex-3', screen: 'Dashboard', screenLabel: 'Dashboard',
        targetSelector: '[data-tour-id="kpi-revenue"]',
        title: 'Revenue & Financial Summary',
        description: "MTD revenue, collection rate, pending claims, and active auth risk are all surfaced on the dashboard. The delta badges show week-over-week change so you know immediately if your billing team's performance is trending the right direction.",
      },
      {
        id: 'ex-4', screen: 'Dashboard', screenLabel: 'Dashboard',
        targetSelector: '[data-tour-id="ama-alerts"]',
        title: 'AMA Risk & Alerts',
        description: 'The AMA risk panel surfaces patients flagged by the risk engine as flight risks. Clicking a name opens their chart directly. The live alert feed on the right shows withdrawal scores, behavioral escalations, and documentation gaps as they happen.',
      },
      {
        id: 'ex-5', screen: 'CensusBedBoard', screenLabel: 'Bed Board',
        title: 'Bed Board & Census Management',
        description: 'The Bed Board shows all units and beds in real-time — occupied, available, reserved, and cleaning. Executive users can see LOC, physician, payer, and LOS for each patient. Beds can be reserved, released, or reassigned from the menu on each card.',
      },
      {
        id: 'ex-6', screen: 'Admissions', screenLabel: 'Admissions',
        title: 'Admissions Pipeline',
        description: 'The Admissions module tracks every referral from first contact through bed placement. Executives can monitor conversion rates, time-to-admit benchmarks, and referral source mix. Intake can be converted to a clinical record directly from this screen.',
      },
      {
        id: 'ex-7', screen: 'PopulationAnalytics', screenLabel: 'Population Analytics',
        title: 'Population & Outcomes Analytics',
        description: 'Aggregate clinical outcomes, demographic cohorts, readmission rates, program completion, and PHQ-9 trends live here. This is your CARF and ASAM outcomes data — all exportable for QI reports and board presentations.',
      },
      {
        id: 'ex-8', screen: 'AuditCompliance', screenLabel: 'Audit & Compliance',
        title: 'CARF & Regulatory Compliance',
        description: 'The Audit & Compliance module shows your CARF standards readiness, open corrective actions, survey history, and upcoming audit windows. The compliance score is calculated across 12 standards domains and updated as evidence is uploaded.',
      },
      {
        id: 'ex-9', screen: 'WorkforceCompliance', screenLabel: 'Workforce Compliance',
        title: 'Workforce & HR Compliance',
        description: 'Workforce Compliance centralizes staff credentialing, background screening, onboarding completion, OIG/SAM exclusion checks, performance reviews, and offboarding. Credential alerts and training gaps are surfaced with one-click drill-downs.',
      },
    ],
  },
  {
    id: 'clinical',
    name: 'Clinical Supervisor',
    icon: <Users className="w-5 h-5" />,
    roleHint: ['clinical_supervisor', 'therapist', 'counselor'],
    duration: '6–8 min · 9 steps',
    color: 'bg-teal-600 text-white',
    steps: [
      {
        id: 'cs-1', screen: 'Dashboard', screenLabel: 'Dashboard',
        title: 'Welcome, Clinical Supervisor',
        description: "This tour covers the tools you'll use every day: caseload management, note co-sign queue, group documentation, treatment planning, risk monitoring, and clinical supervision documentation.",
      },
      {
        id: 'cs-2', screen: 'MyCaseload', screenLabel: 'My Caseload',
        title: 'My Caseload',
        description: "My Caseload shows every patient assigned to you — with acuity, next appointment, pending tasks, and documentation gaps surfaced per patient. You can filter by program, flag AMA risk, and see each patient's last contact without opening their chart.",
      },
      {
        id: 'cs-3', screen: 'CosignQueue', screenLabel: 'Co-sign Queue',
        title: 'Co-sign Queue',
        description: "The Co-sign Queue surfaces every note awaiting your signature as a supervisor or co-signer. Notes are grouped by supervisee and sorted by submission date. You can review, edit, and co-sign directly from the queue — no need to navigate to the patient chart.",
      },
      {
        id: 'cs-4', screen: 'ProgressNotes', screenLabel: 'Progress Notes',
        title: 'Progress Notes & Documentation',
        description: 'Progress Notes supports BIRP, DAP, SOAP, and GIRP formats with an AI-assisted drafting engine. The co-sign status, peer review flag, and late-documentation warnings are all visible from the note list. Filters by clinician, note type, and date range help you audit your team.',
      },
      {
        id: 'cs-5', screen: 'TreatmentPlans', screenLabel: 'Treatment Plans',
        title: 'Treatment Planning',
        description: 'Treatment Plans are linked to ASAM Level of Care assessments. Each plan shows goals, objectives, measurable outcomes, and the review/update schedule. Supervisor review and co-sign status is tracked here alongside the plan itself.',
      },
      {
        id: 'cs-6', screen: 'GroupNotes', screenLabel: 'Group Notes',
        title: 'Group Notes & Participation',
        description: 'Group Notes allows you to document group sessions once and auto-generate per-patient participation notes. Attendance, topic, therapeutic modality, and individual behavior observations can all be recorded. Participation scores feed the ASAM criteria calculation.',
      },
      {
        id: 'cs-7', screen: 'RiskDashboard', screenLabel: 'Risk Dashboard',
        title: 'Risk Dashboard',
        description: 'The Risk Dashboard aggregates AMA flags, SI/HI screening results, elopement risk scores, and safety plan status across your entire caseload. Patients are sorted by risk tier. The C-SSRS and PHQ-9 trend data are viewable from here.',
      },
      {
        id: 'cs-8', screen: 'ClinicalSupervision', screenLabel: 'Clinical Supervision',
        title: 'Clinical Supervision Module',
        description: 'The Clinical Supervision module tracks every supervisee under your license — their required monthly hours, session history, competency scores, and documentation. Supervision notes are co-signed here to satisfy Maryland licensing board requirements.',
      },
      {
        id: 'cs-9', screen: 'IncidentReporting', screenLabel: 'Incident Reporting',
        title: 'Incident Reporting',
        description: "Incident Reports require structured documentation: type, severity, narrative, people involved, immediate response, injuries, supervisor review, corrective actions, and regulatory reporting determination. Closed incidents feed the QAPI program and CARF survey preparation.",
      },
    ],
  },
  {
    id: 'workforce',
    name: 'HR & Workforce Compliance',
    icon: <ShieldCheck className="w-5 h-5" />,
    roleHint: ['hr_director', 'compliance_officer', 'workforce'],
    duration: '6–8 min · 8 steps',
    color: 'bg-orange text-white',
    steps: [
      {
        id: 'wf-1', screen: 'Dashboard', screenLabel: 'Dashboard',
        title: 'Welcome to Workforce & HR',
        description: 'This tour covers the workforce compliance tools: staff profiles and OIG screening, credential lifecycle tracking, training compliance, clinical supervision compliance, and audit readiness. These features are designed to satisfy CARF, HIPAA, and Maryland OHCQ requirements.',
      },
      {
        id: 'wf-2', screen: 'WorkforceCompliance', screenLabel: 'Workforce Compliance',
        title: 'Workforce Compliance Dashboard',
        description: 'The Workforce Compliance dashboard surfaces at-a-glance KPIs: active headcount, credential alerts, overdue performance reviews, and training compliance rates. Tabs below cover every stage of the employee lifecycle from onboarding through offboarding.',
      },
      {
        id: 'wf-3', screen: 'WorkforceCompliance', screenLabel: 'Workforce Compliance',
        title: 'Employee Profiles & OIG/SAM Exclusion',
        description: 'Each employee profile includes current credentials, training compliance %, supervision status, and OIG/SAM exclusion screening results. The Exclusion & Screening tab runs monthly automated checks against OIG, SAM.gov, state Medicaid exclusion lists, and criminal background providers.',
      },
      {
        id: 'wf-4', screen: 'CertificationTracker', screenLabel: 'Certification Tracker',
        title: 'Credential & License Lifecycle',
        description: "The Certification Tracker monitors every license and credential for every staff member — from 'Pending Verification' through 'Verified', 'Expiring', and 'Renewal Submitted'. Alerts fire at 120, 60, and 30 days before expiration. Restricted and Suspended credentials trigger immediate workflow notifications.",
      },
      {
        id: 'wf-5', screen: 'Training', screenLabel: 'Training & LMS',
        title: 'Training Compliance Matrix',
        description: "The Compliance Matrix shows every required training course for every staff member. Click any cell to mark it complete. The per-employee completion % updates instantly. Overdue items are highlighted in red. Scheduled Training and CEU Tracking tabs help you plan the next compliance cycle.",
      },
      {
        id: 'wf-6', screen: 'ClinicalSupervision', screenLabel: 'Clinical Supervision',
        title: 'Supervision Compliance',
        description: 'From an HR/compliance perspective, Clinical Supervision tracks the required supervision hours for licensed staff under Maryland BHA Board requirements. Missing or overdue sessions surface as alerts. Notes must be co-signed and retained per the 6-year HIPAA documentation window.',
      },
      {
        id: 'wf-7', screen: 'AuditCompliance', screenLabel: 'Audit Compliance',
        title: 'CARF & Regulatory Audit Readiness',
        description: 'The Audit Compliance module shows your readiness across CARF, HIPAA, 42 CFR Part 2, CMS CoP, and Maryland OHCQ standards. Evidence can be uploaded per standard, corrective actions assigned, and a Readiness Report generated for survey preparation.',
      },
      {
        id: 'wf-8', screen: 'IncidentReporting', screenLabel: 'Incident Reporting',
        title: 'Incidents & Regulatory Notifications',
        description: 'From an HR perspective, Incident Reports track employee-involved incidents, supervisor review attestations, corrective action plans, and mandatory regulatory notification determinations (OHCQ, CMS, licensing board). Closed incidents are retained and feed the annual QAPI review.',
      },
    ],
  },
];

interface Props {
  navigate: (s: Screen) => void;
  currentScreen: Screen;
  onClose: () => void;
  initialTourId?: string;
}

export function TourEngine({ navigate, currentScreen, onClose, initialTourId }: Props) {
  const { role } = useRole();
  const [selectedTourId, setSelectedTourId] = useState<string | null>(initialTourId ?? null);
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const tour = TOURS.find(t => t.id === selectedTourId) ?? null;
  const currentStep = tour?.steps[step] ?? null;

  // Auto-suggest a tour based on role
  const suggestedTourId =
    role?.id === 'executive' || role?.id === 'clinical_director'
      ? 'executive'
      : role?.id === 'clinical_supervisor' || role?.id === 'therapist' || role?.id === 'counselor'
      ? 'clinical'
      : 'workforce';

  // Navigate to the required screen when step changes
  useEffect(() => {
    if (!currentStep) return;
    if (currentStep.screen !== currentScreen) {
      navigate(currentStep.screen);
    }
  }, [step, selectedTourId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Find and highlight target element
  useEffect(() => {
    if (!currentStep?.targetSelector) { setSpotlightRect(null); return; }
    const find = () => {
      const el = document.querySelector(currentStep.targetSelector!);
      if (el) setSpotlightRect(el.getBoundingClientRect());
      else setSpotlightRect(null);
    };
    const t1 = setTimeout(find, 250);
    const t2 = setTimeout(find, 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [step, selectedTourId, currentScreen]);

  // Recheck spotlight rect on resize
  useEffect(() => {
    if (!currentStep?.targetSelector) return;
    const handler = () => {
      const el = document.querySelector(currentStep!.targetSelector!);
      if (el) setSpotlightRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (!tour) return;
    if (step < tour.steps.length - 1) setStep(s => s + 1);
    else { onClose(); }
  }, [tour, step, onClose]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  const handleRestart = () => { setStep(0); };
  const handleSkip = () => { onClose(); };

  // ── Tour selection screen ───────────────────────────────────────────────────
  if (!selectedTourId) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[9000] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-[600px] max-w-full overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-navy text-white">
            <div>
              <h2 className="text-lg font-bold">Guided Tours</h2>
              <p className="text-blue-100 text-xs mt-0.5">Choose a tour to get started — takes 6–10 minutes</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 space-y-3">
            {TOURS.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedTourId(t.id); setStep(0); }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                  t.id === suggestedTourId
                    ? 'border-orange bg-orange/5'
                    : 'border-border hover:border-orange/40'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.color}`}>
                  {t.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy">{t.name}</span>
                    {t.id === suggestedTourId && (
                      <span className="text-[9px] font-bold bg-orange text-white px-2 py-0.5 rounded-full uppercase">Recommended</span>
                    )}
                  </div>
                  <div className="text-xs text-slate mt-0.5">{t.duration}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate shrink-0" />
              </button>
            ))}
          </div>
          <div className="px-6 pb-5 text-xs text-slate text-center">
            Tours can be restarted at any time using the <span className="font-semibold">↺ Restart</span> button during the tour.
          </div>
        </div>
      </div>
    );
  }

  if (!tour || !currentStep) return null;

  const totalSteps = tour.steps.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const isOnCorrectScreen = currentStep.screen === currentScreen;

  return (
    <>
      {/* Spotlight overlay */}
      {isOnCorrectScreen && spotlightRect && (
        <>
          {/* Backdrop with cutout */}
          <div
            className="fixed inset-0 z-[8998] pointer-events-none"
            style={{
              background: 'rgba(0,0,0,0)',
            }}
          />
          {/* Spotlight element (box-shadow dims everything outside) */}
          <div
            className="fixed z-[8999] rounded-lg pointer-events-none"
            style={{
              top: spotlightRect.top - 6,
              left: spotlightRect.left - 6,
              width: spotlightRect.width + 12,
              height: spotlightRect.height + 12,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
              border: '2px solid #E8761A',
            }}
          />
        </>
      )}

      {/* Tour panel — fixed bottom right */}
      <div className="fixed bottom-6 right-6 z-[9000] w-[380px] bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 ${
          tour.id === 'executive' ? 'bg-navy' : tour.id === 'clinical' ? 'bg-teal-700' : 'bg-orange'
        } text-white`}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            {tour.icon}
            <span>{tour.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleRestart} title="Restart tour" className="text-white/70 hover:text-white">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleSkip} className="text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className={`h-1 transition-all duration-300 ${
              tour.id === 'executive' ? 'bg-navy' : tour.id === 'clinical' ? 'bg-teal-600' : 'bg-orange'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Screen navigation prompt */}
        {!isOnCorrectScreen && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-xs text-amber-800">
              This step requires the <strong>{currentStep.screenLabel}</strong> screen.
            </span>
            <button
              onClick={() => navigate(currentStep.screen)}
              className="ml-auto text-xs bg-amber-600 text-white px-3 py-1 rounded-lg hover:bg-amber-700 shrink-0"
            >
              Go there
            </button>
          </div>
        )}

        {/* Step content */}
        <div className="px-5 py-4">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider">
              Step {step + 1} of {totalSteps}
            </span>
            <span className="text-[10px] text-slate">{currentStep.screenLabel}</span>
          </div>
          <h3 className="font-bold text-navy text-sm mb-1.5">{currentStep.title}</h3>
          <p className="text-xs text-slate leading-relaxed">{currentStep.description}</p>
        </div>

        {/* Controls */}
        <div className="px-5 pb-4 flex items-center gap-2">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="flex items-center gap-1 text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button
            onClick={handleNext}
            className={`flex-1 flex items-center justify-center gap-1 text-xs text-white px-3 py-1.5 rounded-lg font-semibold ${
              tour.id === 'executive' ? 'bg-navy hover:bg-navy/90' : tour.id === 'clinical' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-orange hover:bg-orange/90'
            }`}
          >
            {step === totalSteps - 1 ? 'Finish Tour' : 'Next'}
            {step < totalSteps - 1 && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleSkip} className="text-xs text-slate hover:text-navy px-2 py-1.5">
            Skip
          </button>
        </div>
      </div>
    </>
  );
}
