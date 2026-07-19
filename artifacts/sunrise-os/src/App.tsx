import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DemoBanner } from './components/layout/DemoBanner';
import { Dashboard } from './pages/Dashboard';
import { PatientList } from './pages/PatientList';
import { CensusBedBoard } from './pages/CensusBedBoard';
import { PatientDetail } from './pages/PatientDetail';
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
import { AccessDenied } from './components/common/AccessDenied';
import { ReadOnlyBanner } from './components/common/ReadOnlyBanner';
import { RoleProvider } from './context/RoleContext';
import { useRole } from './context/RoleContext';
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
  | 'RoleExplorer';

// ─── Inner app (needs RoleContext) ──────────────────────────────────────────

function AppInner() {
  const [activeScreen, setActiveScreen] = useState<Screen>('Dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { getPermissionForScreen } = useRole();

  const navigateTo = (screen: Screen, patientId?: string) => {
    if (patientId) setSelectedPatientId(patientId);
    setActiveScreen(screen);
    window.scrollTo(0, 0);
  };

  /** Wrap page content with access gate */
  const withAccess = (screen: Screen, content: React.ReactNode): React.ReactNode => {
    // RoleExplorer is always accessible (demo tool)
    if (screen === 'RoleExplorer') return content;
    const permission = getPermissionForScreen(screen);
    if (permission === 'none') return <AccessDenied screen={screen} screenLabel={screen} />;
    if (permission === 'read') return <ReadOnlyBanner screen={screen}>{content}</ReadOnlyBanner>;
    return content;
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Dashboard':               return withAccess('Dashboard',               <Dashboard navigate={navigateTo} />);
      case 'CensusBedBoard':          return withAccess('CensusBedBoard',          <CensusBedBoard navigate={navigateTo} />);
      case 'PatientList':             return withAccess('PatientList',             <PatientList navigate={navigateTo} />);
      case 'PatientDetail':           return withAccess('PatientDetail',           <PatientDetail patientId={selectedPatientId} navigate={navigateTo} />);
      case 'ASAMAssessments':         return withAccess('ASAMAssessments',         <ASAMAssessments navigate={navigateTo} />);
      case 'ProgressNotes':           return withAccess('ProgressNotes',           <ProgressNotes navigate={navigateTo} />);
      case 'TreatmentPlans':          return withAccess('TreatmentPlans',          <TreatmentPlans navigate={navigateTo} />);
      case 'AppointmentCalendar':     return withAccess('AppointmentCalendar',     <AppointmentCalendar navigate={navigateTo} />);
      case 'GroupSchedule':           return withAccess('GroupSchedule',           <GroupSchedule navigate={navigateTo} />);
      case 'RiskDashboard':           return withAccess('RiskDashboard',           <RiskDashboard navigate={navigateTo} />);
      case 'RecoveryEngagementScore': return withAccess('RecoveryEngagementScore', <RecoveryEngagementScore navigate={navigateTo} />);
      case 'ReferralTracker':         return withAccess('ReferralTracker',         <ReferralTracker navigate={navigateTo} />);
      case 'BedManagement':           return withAccess('BedManagement',           <BedManagement navigate={navigateTo} />);
      case 'AuditCompliance':         return withAccess('AuditCompliance',         <AuditCompliance navigate={navigateTo} />);
      case 'OutcomeTracking':         return withAccess('OutcomeTracking',         <OutcomeTracking navigate={navigateTo} />);
      case 'CommandCenter':           return withAccess('CommandCenter',           <CommandCenter navigate={navigateTo} />);
      case 'Admissions':              return withAccess('Admissions',              <Admissions navigate={navigateTo} />);
      case 'Discharges':              return withAccess('Discharges',              <Discharges navigate={navigateTo} />);
      case 'ChartReview':             return withAccess('ChartReview',             <ChartReview navigate={navigateTo} />);
      case 'GroupNotes':              return withAccess('GroupNotes',              <GroupNotes navigate={navigateTo} />);
      case 'CosignQueue':             return withAccess('CosignQueue',             <CosignQueue navigate={navigateTo} />);
      case 'RevenueCycle':            return withAccess('RevenueCycle',            <RevenueCycle navigate={navigateTo} />);
      case 'BusinessDevelopment':     return withAccess('BusinessDevelopment',     <BusinessDevelopment navigate={navigateTo} />);
      case 'Training':                return withAccess('Training',                <Training navigate={navigateTo} />);
      case 'Settings':                return withAccess('Settings',                <Settings navigate={navigateTo} />);
      case 'HelpSupport':             return withAccess('HelpSupport',             <HelpSupport navigate={navigateTo} />);
      case 'UADrugTesting':           return withAccess('UADrugTesting',           <UADrugTesting navigate={navigateTo} />);
      case 'IncidentReporting':       return withAccess('IncidentReporting',       <IncidentReporting navigate={navigateTo} />);
      case 'StaffScheduling':         return withAccess('StaffScheduling',         <StaffScheduling navigate={navigateTo} />);
      case 'MATManagement':           return withAccess('MATManagement',           <MATManagement navigate={navigateTo} />);
      case 'FamilyEngagement':        return withAccess('FamilyEngagement',        <FamilyEngagement navigate={navigateTo} />);
      case 'PhysicianOrders':         return withAccess('PhysicianOrders',         <PhysicianOrders navigate={navigateTo} />);
      case 'PopulationAnalytics':     return withAccess('PopulationAnalytics',     <PopulationAnalytics navigate={navigateTo} />);
      case 'NursingMAR':              return withAccess('NursingMAR',              <NursingMAR navigate={navigateTo} />);
      case 'ShiftHandoff':            return withAccess('ShiftHandoff',            <ShiftHandoff navigate={navigateTo} />);
      case 'QualityImprovement':      return withAccess('QualityImprovement',      <QualityImprovement navigate={navigateTo} />);
      case 'InsuranceAuthorization':  return withAccess('InsuranceAuthorization',  <InsuranceAuthorization navigate={navigateTo} />);
      case 'AftercarePlanning':       return withAccess('AftercarePlanning',       <AftercarePlanning navigate={navigateTo} />);
      case 'MyCaseload':              return withAccess('MyCaseload',              <MyCaseload navigate={navigateTo} />);
      case 'BiopsychosocialAssessment': return withAccess('BiopsychosocialAssessment', <BiopsychosocialAssessment navigate={navigateTo} />);
      case 'DischargeSummary':        return withAccess('DischargeSummary',        <DischargeSummary navigate={navigateTo} />);
      case 'CrisisAssessment':        return withAccess('CrisisAssessment',        <CrisisAssessment navigate={navigateTo} />);
      case 'AlumniProgram':           return withAccess('AlumniProgram',           <AlumniProgram navigate={navigateTo} />);
      case 'TelehealthConsults':      return withAccess('TelehealthConsults',      <TelehealthConsults navigate={navigateTo} />);
      case 'ClinicalSupervision':     return withAccess('ClinicalSupervision',     <ClinicalSupervision navigate={navigateTo} />);
      case 'MedicalRecords':          return withAccess('MedicalRecords',          <MedicalRecords navigate={navigateTo} />);
      case 'PeerSupport':             return withAccess('PeerSupport',             <PeerSupport navigate={navigateTo} />);
      case 'FinancialCounseling':     return withAccess('FinancialCounseling',     <FinancialCounseling navigate={navigateTo} />);
      case 'GroupTherapyCurriculum':  return withAccess('GroupTherapyCurriculum',  <GroupTherapyCurriculum navigate={navigateTo} />);
      case 'CertificationTracker':    return withAccess('CertificationTracker',    <CertificationTracker navigate={navigateTo} />);
      case 'WaitlistManager':         return withAccess('WaitlistManager',         <WaitlistManager navigate={navigateTo} />);
      case 'SecureMessaging':         return withAccess('SecureMessaging',         <SecureMessaging navigate={navigateTo} />);
      case 'FormularyManagement':     return withAccess('FormularyManagement',     <FormularyManagement navigate={navigateTo} />);
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
    </div>
  );
}

// ─── Root app wrapped with providers ────────────────────────────────────────

function App() {
  return (
    <RoleProvider>
      <AppInner />
    </RoleProvider>
  );
}

export default App;
