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
  | 'PatientDetail';

function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('Dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const navigateTo = (screen: Screen, patientId?: string) => {
    if (patientId) {
      setSelectedPatientId(patientId);
    }
    setActiveScreen(screen);
    window.scrollTo(0, 0);
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Dashboard': return <Dashboard navigate={navigateTo} />;
      case 'CensusBedBoard': return <CensusBedBoard navigate={navigateTo} />;
      case 'PatientList': return <PatientList navigate={navigateTo} />;
      case 'PatientDetail': return <PatientDetail patientId={selectedPatientId} navigate={navigateTo} />;
      case 'ASAMAssessments': return <ASAMAssessments navigate={navigateTo} />;
      case 'ProgressNotes': return <ProgressNotes navigate={navigateTo} />;
      case 'TreatmentPlans': return <TreatmentPlans navigate={navigateTo} />;
      case 'AppointmentCalendar': return <AppointmentCalendar navigate={navigateTo} />;
      case 'GroupSchedule': return <GroupSchedule navigate={navigateTo} />;
      case 'RiskDashboard': return <RiskDashboard navigate={navigateTo} />;
      case 'RecoveryEngagementScore': return <RecoveryEngagementScore navigate={navigateTo} />;
      case 'ReferralTracker': return <ReferralTracker navigate={navigateTo} />;
      case 'BedManagement': return <BedManagement navigate={navigateTo} />;
      case 'AuditCompliance': return <AuditCompliance navigate={navigateTo} />;
      case 'OutcomeTracking': return <OutcomeTracking navigate={navigateTo} />;
      case 'CommandCenter': return <CommandCenter navigate={navigateTo} />;
      case 'Admissions': return <Admissions navigate={navigateTo} />;
      case 'Discharges': return <Discharges navigate={navigateTo} />;
      case 'ChartReview': return <ChartReview navigate={navigateTo} />;
      case 'GroupNotes': return <GroupNotes navigate={navigateTo} />;
      case 'CosignQueue': return <CosignQueue navigate={navigateTo} />;
      case 'RevenueCycle': return <RevenueCycle navigate={navigateTo} />;
      case 'BusinessDevelopment': return <BusinessDevelopment navigate={navigateTo} />;
      case 'Training': return <Training navigate={navigateTo} />;
      case 'Settings': return <Settings navigate={navigateTo} />;
      case 'HelpSupport': return <HelpSupport navigate={navigateTo} />;
      case 'UADrugTesting': return <UADrugTesting navigate={navigateTo} />;
      case 'IncidentReporting': return <IncidentReporting navigate={navigateTo} />;
      case 'StaffScheduling': return <StaffScheduling navigate={navigateTo} />;
      case 'MATManagement': return <MATManagement navigate={navigateTo} />;
      case 'FamilyEngagement': return <FamilyEngagement navigate={navigateTo} />;
      case 'PhysicianOrders': return <PhysicianOrders navigate={navigateTo} />;
      case 'PopulationAnalytics': return <PopulationAnalytics navigate={navigateTo} />;
      case 'NursingMAR': return <NursingMAR navigate={navigateTo} />;
      case 'ShiftHandoff': return <ShiftHandoff navigate={navigateTo} />;
      case 'QualityImprovement': return <QualityImprovement navigate={navigateTo} />;
      case 'InsuranceAuthorization': return <InsuranceAuthorization navigate={navigateTo} />;
      case 'AftercarePlanning': return <AftercarePlanning navigate={navigateTo} />;
      case 'MyCaseload': return <MyCaseload navigate={navigateTo} />;
      case 'BiopsychosocialAssessment': return <BiopsychosocialAssessment navigate={navigateTo} />;
      case 'DischargeSummary': return <DischargeSummary navigate={navigateTo} />;
      case 'CrisisAssessment': return <CrisisAssessment navigate={navigateTo} />;
      case 'AlumniProgram': return <AlumniProgram navigate={navigateTo} />;
      case 'TelehealthConsults': return <TelehealthConsults navigate={navigateTo} />;
      case 'ClinicalSupervision': return <ClinicalSupervision navigate={navigateTo} />;
      case 'MedicalRecords': return <MedicalRecords navigate={navigateTo} />;
      case 'PeerSupport': return <PeerSupport navigate={navigateTo} />;
      case 'FinancialCounseling': return <FinancialCounseling navigate={navigateTo} />;
      case 'GroupTherapyCurriculum': return <GroupTherapyCurriculum navigate={navigateTo} />;
      case 'CertificationTracker': return <CertificationTracker navigate={navigateTo} />;
      case 'WaitlistManager': return <WaitlistManager navigate={navigateTo} />;
      case 'SecureMessaging': return <SecureMessaging navigate={navigateTo} />;
      case 'FormularyManagement': return <FormularyManagement navigate={navigateTo} />;
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

export default App;
