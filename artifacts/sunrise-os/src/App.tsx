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
      <Topbar />
      
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
