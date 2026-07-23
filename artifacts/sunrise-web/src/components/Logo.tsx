import React from 'react';
import logoImg from '@assets/SunriseOS_Logo_transparent.png';

export const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center ${className}`}>
    <img
      src={logoImg}
      alt="Sunrise OS"
      className="h-24 w-auto"
    />
  </div>
);
