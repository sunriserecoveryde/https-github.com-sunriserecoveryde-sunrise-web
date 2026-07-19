import React from 'react';
import { Lock } from 'lucide-react';

interface LockedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  locked?: boolean;
  children: React.ReactNode;
}

/**
 * A button that, when `locked=true`, is disabled and shows a lock icon
 * plus a "Your role does not have edit access" tooltip on hover.
 * When `locked=false` (or omitted) it renders as a normal button.
 */
export function LockedButton({ locked, children, className = '', onClick, ...props }: LockedButtonProps) {
  if (!locked) {
    return (
      <button className={className} onClick={onClick} {...props}>
        {children}
      </button>
    );
  }

  return (
    <div className="relative group inline-flex">
      <button
        className={`${className} opacity-50 cursor-not-allowed flex items-center gap-1.5`}
        disabled
        tabIndex={-1}
        {...props}
      >
        <Lock className="w-3.5 h-3.5 shrink-0" />
        {children}
      </button>
      {/* Tooltip */}
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-800 text-white text-[11px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg"
      >
        Your role does not have edit access
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
      </div>
    </div>
  );
}
