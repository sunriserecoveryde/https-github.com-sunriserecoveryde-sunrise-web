import React from 'react';

export const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center ${className}`}>
    <span className="text-xl font-extrabold tracking-tight">
      <span className="text-[#F97316]">Sunrise</span><span className="text-[#2563EB]">OS</span>
    </span>
  </div>
);
