import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DemoBanner } from './components/layout/DemoBanner';
import { Dashboard } from './pages/Dashboard';
import { PatientList } from './pages/PatientList';
import { CensusBedBoard } from './pages/CensusBedBoard';
import { PatientDetail } from './pages/PatientDetail';
import { DemoPatientDetail } from './pages/DemoPatientDetail';
import { ASAMAssessments } from './pages/ASAMAssessments';
import { ProgressNotes } from './pages/ProgressNotes';
import { TreatmentPlans } from './pages/TreatmentPlans';
import { AppointmentCalendar } from './pages/AppointmentCalendar';
import { GroupSchedule } from './pages/GroupSchedule';
import { RiskDashboard } from './pages/RiskDashboard';
import { RecoveryEngagementScore } from './pages/RecoveryEngagementScore';
import { ReferralTracker } from './pages/ReferralTracker';
import { BedManagement } from './pages/BedManagement';
import { AuditCompliance } from './pages/AuditCompliance';
import { OutcomeTracking } from './pages/OutcomeTracking';
import { CommandCenter } from './pages/CommandCenter';
import { Admissions } from './pages/Admissions';
import { Discharges } from './pages/Discharges';
import { ChartReview } from './pages/ChartReview';
import { GroupNotes } from './pages/GroupNotes';
import { CosignQueue } from './pages/CosignQueue';
import { RevenueCycle } from './pages/RevenueCycle';
import { BusinessDevelopment } from './pages/BusinessDevelopment';
import { Training } from './pages/Training';
import { Settings } from './pages/Settings';
import { HelpSupport } from './pages/HelpSupport';
import { UADrugTesting } from './pages/UADrugTesting';
import { IncidentReporting } from './pages/IncidentReporting';
import { StaffScheduling } from './pages/StaffScheduling';
import { MATManagement } from './pages/MATManagement';
import { FamilyEngagement } from './pages/FamilyEngagement';
import { PhysicianOrders } from './pages/PhysicianOrders';
import { PopulationAnalytics } from './pages/PopulationAnalytics';
import { NursingMAR } from './pages/NursingMAR';
import { ShiftHandoff } from './pages/ShiftHandoff';
import { QualityImprovement } from './pages/QualityImprovement';
import { InsuranceAuthorization } from './pages/InsuranceAuthorization';
import { AftercarePlanning } from './pages/AftercarePlanning';
import { MyCaseload } from './pages/MyCaseload';
import { BiopsychosocialAssessment } from './pages/BiopsychosocialAssessment';
import { DischargeSummary } from './pages/DischargeSummary';
import { CrisisAssessment } from './pages/CrisisAssessment';
import { AlumniProgram } from './pages/AlumniProgram';
import { TelehealthConsults } from './pages/TelehealthConsults';
import { ClinicalSupervision } from './pages/ClinicalSupervision';
import { MedicalRecords } from './pages/MedicalRecords';
import { PeerSupport } from './pages/PeerSupport';
import { FinancialCounseling } from './pages/FinancialCounseling';
import { GroupTherapyCurriculum } from './pages/GroupTherapyCurriculum';
import { CertificationTracker } from './pages/CertificationTracker';
import { WaitlistManager } from './pages/WaitlistManager';
import { SecureMessaging } from './pages/SecureMessaging';
import { FormularyManagement } from './pages/FormularyManagement';
import { RoleExplorer } from './pages/RoleExplorer';
import { StaffAdmin } from './pages/StaffAdmin';
import { WithdrawalMonitor } from './pages/WithdrawalMonitor';
import { AIAssistant } from './pages/AIAssistant';
import { DAPNoteWorkflow } from './pages/DAPNoteWorkflow';
import { MeasurementBasedCare } from './pages/MeasurementBasedCare';
import { ClinicalIntelligence } from './pages/ClinicalIntelligence';
import { WorkforceCompliance } from './pages/WorkforceCompliance';
import { ClinicalForms } from './pages/ClinicalForms';
import { ChartAuditTool } from './pages/ChartAuditTool';
import { TourEngine } from './pages/TourEngine';
import { LoginPage } from './pages/LoginPage';
import { ProductionLogin } from './pages/ProductionLogin';
import { DATA_MODE } from './lib/dataMode';
import { AccessDenied } from './components/common/AccessDenied';
import { ReadOnlyBanner } from './components/common/ReadOnlyBanner';
import { RoleProvider } from './context/RoleContext';
import { useRole } from './context/RoleContext';
import { AuthProvider } from './context/AuthContext';
import { SessionChartProvider } from './context/SessionChartContext';
import { useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

export type Screen =
  | 'Dashboard'
  | 'CommandCenter'
  | 'CensusBedBoard'
  | 'PatientList'
  | 'Admissions'
  | 'Discharges'
  | 'ChartReview'
  | 'ProgressNotes'
  | 'TreatmentPlans'
  | 'ASAMAssessments'
  | 'GroupNotes'
  | 'CosignQueue'
  | 'AppointmentCalendar'
  | 'GroupSchedule'
  | 'RiskDashboard'
  | 'RecoveryEngagementScore'
  | 'OutcomeTracking'
  | 'ReferralTracker'
  | 'BusinessDevelopment'
  | 'BedManagement'
  | 'RevenueCycle'
  | 'AuditCompliance'
  | 'Training'
  | 'Settings'
  | 'HelpSupport'
  | 'UADrugTesting'
  | 'MeasurementBasedCare'
  | 'IncidentReporting'
  | 'StaffScheduling'
  | 'MATManagement'
  | 'FamilyEngagement'
  | 'PhysicianOrders'
  | 'PopulationAnalytics'
  | 'NursingMAR'
  | 'ShiftHandoff'
  | 'QualityImprovement'
  | 'InsuranceAuthorization'
  | 'AftercarePlanning'
  | 'MyCaseload'
  | 'BiopsychosocialAssessment'
  | 'DischargeSummary'
  | 'CrisisAssessment'
  | 'AlumniProgram'
  | 'TelehealthConsults'
  | 'ClinicalSupervision'
  | 'MedicalRecords'
  | 'PeerSupport'
  | 'FinancialCounseling'
  | 'GroupTherapyCurriculum'
  | 'CertificationTracker'
  | 'WaitlistManager'
  | 'SecureMessaging'
  | 'FormularyManagement'
  | 'PatientDetail'
  | 'RoleExplorer'
  | 'StaffAdmin'
  | 'WithdrawalMonitor'
  | 'AIAssistant'
  | 'DemoPatientDetail'
  | 'ClinicalIntelligence'
  | 'DAPNoteWorkflow'
  | 'WorkforceCompliance'
  | 'ClinicalForms'
  | 'ChartAuditTool';

// ─── Inner app (needs RoleContext) ───────────────────────────────────────────

function AppInner() {
  // ── Deep-link bootstrap: parse #WorkforceCompliance?req=CARF-001 on first load
  const [deepLinkedReqId] = useState<string | null>(() => {
    try {
      const hash = window.location.hash.slice(1); // strip leading #
      const [, query] = hash.split('?');
      return query ? new URLSearchParams(query).get('req') : null;
    } catch { return null; }
  });
  const [activeScreen, setActiveScreen] = useState<Screen>(() => {
    try {
      const screenPart = window.location.hash.slice(1).split('?')[0];
      if (screenPart) return screenPart as Screen;
    } catch { /* ignore */ }
    return 'Dashboard';
  });
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [lastDemoPatientId, setLastDemoPatientId] = useState<string | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourFABHidden, setTourFABHidden] = useState(
    typeof window !== 'undefined' && window.sessionStorage.getItem('tour-fab-dismissed') === '1'
  );
  const { getPermissionForScreen } = useRole();

  // ── Browser Back / Forward support ──────────────────────────────────────────
  useEffect(() => {
    // Stamp the initial entry so the first Back press has a state to pop to.
    // Preserve a deep-link screen if present (e.g. #WorkforceCompliance?req=CARF-001).
    window.history.replaceState({ screen: activeScreen, patientId: null }, '', `#${activeScreen}`);

    const handlePop = (e: PopStateEvent) => {
      const s = e.state as { screen: Screen; patientId: string | null } | null;
      const target: Screen = s?.screen ?? 'Dashboard';
      if (s?.patientId) {
        setSelectedPatientId(s.patientId);
        if (target === 'DemoPatientDetail') setLastDemoPatientId(s.patientId);
      }
      setActiveScreen(target);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const navigateTo = (screen: Screen, patientId?: string) => {
    if (patientId) {
      setSelectedPatientId(patientId);
      if (screen === 'DemoPatientDetail') {
        setLastDemoPatientId(patientId);
      }
    }
    setActiveScreen(screen);
    window.scrollTo(0, 0);
    // Push a new history entry so the browser Back button returns here.
    window.history.pushState({ screen, patientId: patientId ?? null }, '', `#${screen}`);
  };

  /** Wrap page content with access gate */
  const withAccess = (screen: Screen, content: React.ReactNode): React.ReactNode => {
    if (screen === 'RoleExplorer' || screen === 'StaffAdmin') return content;
    const permission = getPermissionForScreen(screen);
    if (permission === 'none') return <AccessDenied screen={screen} screenLabel={screen} />;
    if (permission === 'read') return <ReadOnlyBanner screen={screen}>{content}</ReadOnlyBanner>;
    return content;
  };

  /**
   * For the 5 high-value clinical pages, individual action buttons receive
   * readOnly=true and show a lock icon + tooltip instead of a global overlay.
   */
  const withAccessReadOnlyProp = (
    screen: Screen,
    renderPage: (readOnly: boolean) => React.ReactNode
  ): React.ReactNode => {
    if (screen === 'RoleExplorer') return renderPage(false);
    const permission = getPermissionForScreen(screen);
    if (permission === 'none') return <AccessDenied screen={screen} screenLabel={screen} />;
    return renderPage(permission === 'read');
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Dashboard':               return withAccess('Dashboard',               <Dashboard navigate={navigateTo} />);
      case 'CensusBedBoard':          return withAccess('CensusBedBoard',          <CensusBedBoard navigate={navigateTo} />);
      case 'PatientList':             return withAccess('PatientList',             <PatientList navigate={navigateTo} />);
      case 'PatientDetail':           return withAccessReadOnlyProp('PatientDetail',           ro => <PatientDetail patientId={selectedPatientId} navigate={navigateTo} readOnly={ro} />);
      case 'ASAMAssessments':         return withAccessReadOnlyProp('ASAMAssessments',    ro => <ASAMAssessments navigate={navigateTo} readOnly={ro} />);
      case 'ProgressNotes':           return withAccessReadOnlyProp('ProgressNotes',   ro => <ProgressNotes navigate={navigateTo} readOnly={ro} />);
      case 'TreatmentPlans':          return withAccessReadOnlyProp('TreatmentPlans',  ro => <TreatmentPlans navigate={navigateTo} readOnly={ro} />);
      case 'AppointmentCalendar':     return withAccessReadOnlyProp('AppointmentCalendar',     ro => <AppointmentCalendar navigate={navigateTo} readOnly={ro} />);
      case 'GroupSchedule':           return withAccessReadOnlyProp('GroupSchedule',           ro => <GroupSchedule navigate={navigateTo} readOnly={ro} />);
      case 'RiskDashboard':           return withAccess('RiskDashboard',           <RiskDashboard navigate={navigateTo} />);
      case 'RecoveryEngagementScore': return withAccess('RecoveryEngagementScore', <RecoveryEngagementScore navigate={navigateTo} />);
      case 'ReferralTracker':         return withAccessReadOnlyProp('ReferralTracker',         ro => <ReferralTracker navigate={navigateTo} readOnly={ro} />);
      case 'BedManagement':           return withAccessReadOnlyProp('BedManagement',           ro => <BedManagement navigate={navigateTo} readOnly={ro} />);
      case 'AuditCompliance':         return withAccessReadOnlyProp('AuditCompliance',         ro => <AuditCompliance navigate={navigateTo} readOnly={ro} />);
      case 'OutcomeTracking':         return withAccess('OutcomeTracking',         <OutcomeTracking navigate={navigateTo} />);
      case 'CommandCenter':           return withAccessReadOnlyProp('CommandCenter',           ro => <CommandCenter navigate={navigateTo} readOnly={ro} />);
      case 'Admissions':              return withAccessReadOnlyProp('Admissions',              ro => <Admissions navigate={navigateTo} readOnly={ro} />);
      case 'Discharges':              return withAccessReadOnlyProp('Discharges',              ro => <Discharges navigate={navigateTo} readOnly={ro} />);
      case 'ChartReview':             return withAccessReadOnlyProp('ChartReview',        ro => <ChartReview navigate={navigateTo} readOnly={ro} />);
      case 'GroupNotes':              return withAccessReadOnlyProp('GroupNotes',          ro => <GroupNotes navigate={navigateTo} readOnly={ro} />);
      case 'CosignQueue':             return withAccessReadOnlyProp('CosignQueue',         ro => <CosignQueue navigate={navigateTo} readOnly={ro} />);
      case 'RevenueCycle':            return withAccessReadOnlyProp('RevenueCycle',            ro => <RevenueCycle navigate={navigateTo} readOnly={ro} />);
      case 'BusinessDevelopment':     return withAccessReadOnlyProp('BusinessDevelopment',     ro => <BusinessDevelopment navigate={navigateTo} readOnly={ro} />);
      case 'Training':                return withAccessReadOnlyProp('Training',                ro => <Training navigate={navigateTo} readOnly={ro} />);
      case 'Settings':                return withAccessReadOnlyProp('Settings',                ro => <Settings navigate={navigateTo} readOnly={ro} />);
      case 'HelpSupport':             return withAccess('HelpSupport',             <HelpSupport navigate={navigateTo} />);
      case 'UADrugTesting':           return withAccessReadOnlyProp('UADrugTesting',           ro => <UADrugTesting navigate={navigateTo} readOnly={ro} />);
      case 'MeasurementBasedCare':    return withAccessReadOnlyProp('MeasurementBasedCare',    ro => <MeasurementBasedCare navigate={navigateTo} readOnly={ro} />);
     case 'ClinicalIntelligence':   return withAccessReadOnlyProp('ClinicalIntelligence',   ro => <ClinicalIntelligence navigate={navigateTo} readOnly={ro} />);
      case 'IncidentReporting':       return withAccessReadOnlyProp('IncidentReporting',       ro => <IncidentReporting navigate={navigateTo} readOnly={ro} />);
      case 'StaffScheduling':         return withAccessReadOnlyProp('StaffScheduling',         ro => <StaffScheduling navigate={navigateTo} readOnly={ro} />);
      case 'MATManagement':           return withAccessReadOnlyProp('MATManagement',   ro => <MATManagement navigate={navigateTo} readOnly={ro} />);
      case 'FamilyEngagement':        return withAccessReadOnlyProp('FamilyEngagement',        ro => <FamilyEngagement navigate={navigateTo} readOnly={ro} />);
      case 'PhysicianOrders':         return withAccessReadOnlyProp('PhysicianOrders', ro => <PhysicianOrders navigate={navigateTo} readOnly={ro} />);
      case 'PopulationAnalytics':     return withAccess('PopulationAnalytics',     <PopulationAnalytics navigate={navigateTo} />);
      case 'NursingMAR':              return withAccessReadOnlyProp('NursingMAR',      ro => <NursingMAR navigate={navigateTo} readOnly={ro} />);
      case 'ShiftHandoff':            return withAccessReadOnlyProp('ShiftHandoff',            ro => <ShiftHandoff navigate={navigateTo} readOnly={ro} />);
      case 'QualityImprovement':      return withAccessReadOnlyProp('QualityImprovement',      ro => <QualityImprovement navigate={navigateTo} readOnly={ro} />);
      case 'InsuranceAuthorization':  return withAccessReadOnlyProp('InsuranceAuthorization',  ro => <InsuranceAuthorization navigate={navigateTo} readOnly={ro} />);
      case 'AftercarePlanning':       return withAccessReadOnlyProp('AftercarePlanning',       ro => <AftercarePlanning navigate={navigateTo} readOnly={ro} />);
      case 'MyCaseload':              return withAccessReadOnlyProp('MyCaseload',              ro => <MyCaseload navigate={navigateTo} readOnly={ro} />);
      case 'BiopsychosocialAssessment': return withAccessReadOnlyProp('BiopsychosocialAssessment', ro => <BiopsychosocialAssessment navigate={navigateTo} readOnly={ro} />);
      case 'DischargeSummary':        return withAccessReadOnlyProp('DischargeSummary',        ro => <DischargeSummary navigate={navigateTo} readOnly={ro} />);
      case 'CrisisAssessment':        return withAccessReadOnlyProp('CrisisAssessment',        ro => <CrisisAssessment navigate={navigateTo} readOnly={ro} />);
      case 'AlumniProgram':           return withAccessReadOnlyProp('AlumniProgram',           ro => <AlumniProgram navigate={navigateTo} readOnly={ro} />);
      case 'TelehealthConsults':      return withAccessReadOnlyProp('TelehealthConsults',      ro => <TelehealthConsults navigate={navigateTo} readOnly={ro} />);
      case 'ClinicalSupervision':     return withAccessReadOnlyProp('ClinicalSupervision',     ro => <ClinicalSupervision navigate={navigateTo} readOnly={ro} />);
      case 'MedicalRecords':          return withAccessReadOnlyProp('MedicalRecords',          ro => <MedicalRecords navigate={navigateTo} readOnly={ro} />);
      case 'PeerSupport':             return withAccessReadOnlyProp('PeerSupport',             ro => <PeerSupport navigate={navigateTo} readOnly={ro} />);
      case 'FinancialCounseling':     return withAccessReadOnlyProp('FinancialCounseling',     ro => <FinancialCounseling navigate={navigateTo} readOnly={ro} />);
      case 'GroupTherapyCurriculum':  return withAccessReadOnlyProp('GroupTherapyCurriculum',  ro => <GroupTherapyCurriculum navigate={navigateTo} readOnly={ro} />);
      case 'CertificationTracker':    return withAccessReadOnlyProp('CertificationTracker',    ro => <CertificationTracker navigate={navigateTo} readOnly={ro} />);
      case 'WaitlistManager':         return withAccessReadOnlyProp('WaitlistManager',         ro => <WaitlistManager navigate={navigateTo} readOnly={ro} />);
      case 'SecureMessaging':         return withAccessReadOnlyProp('SecureMessaging',         ro => <SecureMessaging navigate={navigateTo} readOnly={ro} />);
      case 'FormularyManagement':     return withAccess('FormularyManagement',     <FormularyManagement navigate={navigateTo} />);
      case 'StaffAdmin':              return <StaffAdmin navigate={navigateTo} />;
      case 'WorkforceCompliance':     return withAccessReadOnlyProp('WorkforceCompliance',     ro => <WorkforceCompliance navigate={navigateTo} readOnly={ro} requestedReqId={deepLinkedReqId} />);
      case 'WithdrawalMonitor':       return withAccessReadOnlyProp('WithdrawalMonitor', ro => <WithdrawalMonitor navigate={navigateTo} readOnly={ro} />);
      case 'AIAssistant':             return withAccess('AIAssistant', <AIAssistant navigate={navigateTo} />);
      case 'DAPNoteWorkflow':         return withAccess('AIAssistant', <DAPNoteWorkflow navigate={navigateTo} />);
      case 'ClinicalForms':           return withAccessReadOnlyProp('ClinicalForms',     ro => <ClinicalForms navigate={navigateTo} readOnly={ro} />);
      case 'ChartAuditTool':          return withAccessReadOnlyProp('ChartAuditTool',    ro => <ChartAuditTool navigate={navigateTo} readOnly={ro} />);
      case 'DemoPatientDetail':       return <DemoPatientDetail patientId={lastDemoPatientId ?? selectedPatientId} navigate={navigateTo} returnTo='Dashboard' />;
      case 'RoleExplorer':            return <RoleExplorer navigate={navigateTo} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow border border-border">
            <h2 className="text-2xl font-bold text-navy">{activeScreen}</h2>
            <p className="text-slate mt-2">Module coming soon in Sunrise OS.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      <DemoBanner />
      <Topbar navigate={navigateTo} currentScreen={activeScreen} />

      <div className="flex flex-1 pt-[calc(var(--banner-height)+var(--topbar-height))]">
        <Sidebar
          currentScreen={activeScreen}
          navigate={navigateTo}
          currentPatientId={selectedPatientId}
        />

        <main className="flex-1 ml-[var(--nav-width)] p-6 pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Tour FAB — shown on Dashboard only, dismissible per session */}
      {activeScreen === 'Dashboard' && !tourOpen && !tourFABHidden && (
        <div className="fixed bottom-6 right-6 z-[8000] flex items-center gap-2">
          <button
            onClick={() => { window.sessionStorage.setItem('tour-fab-dismissed', '1'); setTourFABHidden(true); }}
            className="text-slate/50 hover:text-slate/80 p-1 rounded-full hover:bg-white/50 transition-colors"
            title="Dismiss"
          >
            ✕
          </button>
          <button
            onClick={() => setTourOpen(true)}
            className="bg-orange text-white rounded-full shadow-lg px-4 py-2.5 text-sm font-semibold flex items-center gap-2 hover:bg-orange/90 transition-all hover:shadow-xl"
          >
            🗺 Start Tour
          </button>
        </div>
      )}

      {/* Tour Engine */}
      {tourOpen && (
        <TourEngine
          navigate={navigateTo}
          currentScreen={activeScreen}
          onClose={() => setTourOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Auth gate: picks correct initial role from logged-in staff member ────────

function AppWithAuth() {
  const { isLoggedIn, currentStaff, productionSession, loginWithSession, isCheckingSession } = useAuth();
  const isProduction = DATA_MODE === 'production';

  if (isProduction) {
    // Show spinner while checking for an existing server session.
    if (isCheckingSession) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!isLoggedIn) {
      return <ProductionLogin onSuccess={loginWithSession} />;
    }

    return (
      <RoleProvider
        key={productionSession?.userId ?? 'prod-guest'}
        defaultRoleId={productionSession?.roleIds?.[0]}
        serverPermissionCodes={(productionSession?.permissionCodes ?? []) as import('./lib/permissions').PermissionCode[]}
      >
        <AppInner />
      </RoleProvider>
    );
  }

  // Demo mode
  return (
    <RoleProvider
      key={currentStaff?.id ?? 'guest'}
      defaultRoleId={currentStaff?.roleId}
      staffId={currentStaff?.id}
    >
      {isLoggedIn ? <AppInner /> : <LoginPage />}
    </RoleProvider>
  );
}

// ─── Root app wrapped with providers ─────────────────────────────────────────

function App() {
  return (
    <SessionChartProvider>
      <AuthProvider>
        <AppWithAuth />
      </AuthProvider>
    </SessionChartProvider>
  );
}

export default App;
