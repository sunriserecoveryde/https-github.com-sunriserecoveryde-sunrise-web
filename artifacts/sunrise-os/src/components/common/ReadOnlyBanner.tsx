import React from 'react';
import { Eye, Lock } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import type { Screen } from '../../App';
import { getScreenLabel } from './AccessDenied';

interface Props {
  screen: Screen;
  children: React.ReactNode;
}

export function ReadOnlyBanner({ screen, children }: Props) {
  const { role } = useRole();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-800">
        <Eye className="w-4 h-4 shrink-0 text-blue-500" />
        <div className="flex-1">
          <span className="font-semibold">{role.label}</span> has <span className="font-semibold">read-only</span> access to {getScreenLabel(screen)}.
          Interactive controls are disabled for this role.
        </div>
        <Lock className="w-4 h-4 shrink-0 text-blue-400" />
      </div>
      <div className="pointer-events-none select-none opacity-75">
        {children}
      </div>
    </div>
  );
}
