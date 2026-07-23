import React from 'react';
import logoImg from '@assets/SunriseOS_Logo_1784768082191.png';

export const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center ${className}`}>
    <img
      src={logoImg}
      alt="Sunrise OS"
      className="h-16 w-auto rounded-lg bg-white p-1.5"
    />
  </div>
);
