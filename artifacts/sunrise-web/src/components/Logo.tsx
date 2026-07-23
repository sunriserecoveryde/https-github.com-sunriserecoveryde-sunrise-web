import React from 'react';

export const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="relative flex items-center justify-center w-10 h-10">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Sun Rays */}
        <path d="M50 15C50 15 65 25 75 40C85 55 85 70 85 70" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
        <path d="M50 15C50 15 35 25 25 40C15 55 15 70 15 70" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
        <path d="M50 15V45" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" />
        <path d="M68 28L58 48" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" />
        <path d="M32 28L42 48" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" />
        {/* Heartbeat / Horizon */}
        <path d="M5 70H30L40 50L55 85L65 70H95" stroke="#2563EB" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <span className="text-2xl tracking-tight flex items-center">
      <span className="font-extrabold text-white">Sunrise</span>
      <span className="font-bold text-sunrise-orange ml-1">OS</span>
    </span>
  </div>
);
