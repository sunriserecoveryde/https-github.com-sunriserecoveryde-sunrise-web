import React from 'react';
import { Eye, Lock, Users } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { getRolesWithEditAccess } from '../../data/mockRoles';
import type { Screen } from '../../App';
import { getScreenLabel } from './AccessDenied';

interface Props {
  screen: Screen;
  children: React.ReactNode;
}

export function ReadOnlyBanner({ screen, children }: Props) {
  const { role } = useRole();
  const editRoles = getRolesWithEditAccess(screen);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
        <Eye className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
        <div className="flex-1 space-y-1">
          <div>
            <span className="font-semibold">{role.label}</span> has{' '}
            <span className="font-semibold">read-only</span> access to {getScreenLabel(screen)}.
            Interactive controls are disabled for this role.
          </div>
          {editRoles.length > 0 && (
            <div className="flex items-start gap-1.5 text-blue-600 text-xs">
              <Users className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                <span className="font-medium">Roles with edit access:</span>{' '}
                {editRoles.join(', ')}
              </span>
            </div>
          )}
        </div>
        <Lock className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
      </div>
      <div className="pointer-events-none select-none opacity-75">
        {children}
      </div>
    </div>
  );
}
