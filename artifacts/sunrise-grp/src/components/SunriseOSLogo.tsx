import React from 'react';

/** The sun icon mark — inline SVG, no file dependency */
export function SunriseOSMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="180" height="180" rx="36" fill="#0F172A" />
      {/* Sun rays */}
      <line x1="90" y1="22" x2="90" y2="38" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
      <line x1="130" y1="32" x2="122" y2="46" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
      <line x1="152" y1="66" x2="138" y2="71" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
      <line x1="50" y1="32" x2="58" y2="46" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" />
      <line x1="28" y1="66" x2="42" y2="71" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" />
      {/* Sun semicircle */}
      <clipPath id="sos-top">
        <rect x="0" y="0" width="180" height="105" />
      </clipPath>
      <ellipse cx="90" cy="105" rx="48" ry="48" fill="#F97316" clipPath="url(#sos-top)" />
      {/* Horizon + bars */}
      <rect x="28" y="108" width="124" height="5" rx="2.5" fill="#FB923C" />
      <rect x="38" y="120" width="104" height="4" rx="2" fill="#F97316" opacity="0.6" />
      <rect x="52" y="130" width="76" height="4" rx="2" fill="#FBBF24" opacity="0.4" />
      <rect x="64" y="140" width="52" height="4" rx="2" fill="#FDE68A" opacity="0.3" />
    </svg>
  );
}

/** Full logo: icon mark + "Sunrise" / "OS" wordmark side-by-side */
export function SunriseOSLogo({
  markSize = 36,
  textSize = 'text-2xl',
  className = '',
}: {
  markSize?: number;
  textSize?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <SunriseOSMark size={markSize} />
      <span className={`font-extrabold tracking-tight leading-none ${textSize}`}>
        <span style={{ color: '#F97316' }}>Sunrise</span>
        <span style={{ color: '#2563EB' }}>OS</span>
      </span>
    </div>
  );
}
