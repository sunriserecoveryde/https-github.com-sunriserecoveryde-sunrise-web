import React from 'react';

const DemoBanner: React.FC = () => {
  return (
    <div data-testid="demo-banner" className="fixed top-0 left-0 right-0 h-[36px] bg-gradient-to-r from-purple to-[#4F46E5] text-white flex items-center justify-center text-[11px] font-bold tracking-[0.12em] uppercase z-[1000] gap-2 shadow-sm">
      <span>🔴 LIVE DEMO — SunriseOS Clinical Command Center v6</span>
    </div>
  );
};

export default DemoBanner;
