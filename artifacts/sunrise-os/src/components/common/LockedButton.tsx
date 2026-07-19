import React from 'react';
import { Lock, Users } from 'lucide-react';

interface LockedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  locked?: boolean;
  children: React.ReactNode;
  /** Roles that have edit access — shown in the tooltip when locked */
  editRoles?: string[];
}

/**
 * A button that, when `locked=true`, is disabled and shows a lock icon
 * plus a tooltip explaining which roles have edit access.
 * When `locked=false` (or omitted) it renders as a normal button.
 */
export function LockedButton({ locked, children, className = '', onClick, editRoles, ...props }: LockedButtonProps) {
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
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg"
        style={{ minWidth: '160px', maxWidth: '260px' }}
      >
        <div className="whitespace-nowrap">Your role does not have edit access.</div>
        {editRoles && editRoles.length > 0 && (
          <div className="flex items-start gap-1 mt-1 text-gray-300">
            <Users className="w-3 h-3 shrink-0 mt-0.5" />
            <span className="whitespace-normal leading-tight">
              <span className="font-medium text-white">Edit access:</span>{' '}
              {editRoles.join(', ')}
            </span>
          </div>
        )}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
      </div>
    </div>
  );
}
