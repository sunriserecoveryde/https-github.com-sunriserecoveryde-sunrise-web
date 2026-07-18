import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import DemoBanner from '@/components/DemoBanner';
import Dashboard from '@/pages/Dashboard';
import PatientList from '@/pages/PatientList';
import CommandCenter from '@/pages/CommandCenter';
import PatientDetail from '@/pages/PatientDetail';
import OrderEntry from '@/pages/OrderEntry';
import BedManagement from '@/pages/BedManagement';
import Outcomes from '@/pages/Outcomes';
import { Patient } from '@/data/mockData';

export type Screen = 'dashboard' | 'patient-list' | 'command-center' | 'patient-detail' | 'order-entry' | 'bed-management' | 'outcomes';

function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigateTo = (screen: Screen, patientId?: string) => {
    if (patientId) {
      setSelectedPatientId(patientId);
    }
    setActiveScreen(screen);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <Dashboard onPatientClick={(id) => navigateTo('patient-detail', id)} />;
      case 'patient-list':
        return <PatientList onPatientClick={(id) => navigateTo('patient-detail', id)} />;
      case 'command-center':
        return <CommandCenter />;
      case 'patient-detail':
        return <PatientDetail patientId={selectedPatientId} onBack={() => navigateTo('patient-list')} />;
      case 'order-entry':
        return <OrderEntry patientId={selectedPatientId} />;
      case 'bed-management':
        return <BedManagement />;
      case 'outcomes':
        return <Outcomes />;
      default:
        return <Dashboard onPatientClick={(id) => navigateTo('patient-detail', id)} />;
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      <DemoBanner />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      
      <div className="flex flex-1 pt-[100px]"> {/* 36px banner + 64px topbar */}
        <Sidebar 
          activeScreen={activeScreen} 
          onNavigate={(screen) => navigateTo(screen)} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 md:ml-[240px] p-4 md:p-6 pb-20 animate-in fade-in duration-300">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}

export default App;
