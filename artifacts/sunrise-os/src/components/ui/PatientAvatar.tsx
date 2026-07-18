import React from 'react';

interface PatientAvatarProps {
  first: string;
  last: string;
  program: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function PatientAvatar({ first, last, program, size = 'md' }: PatientAvatarProps) {
  const initials = `${first.charAt(0)}${last.charAt(0)}`;
  
  const programColors: Record<string, string> = {
    Residential: 'bg-sunrise-blue text-white',
    PHP: 'bg-sunrise-orange text-white',
    IOP: 'bg-purple text-white',
    OP: 'bg-teal text-white'
  };

  const bg = programColors[program] || 'bg-slate text-white';

  const sizes = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl'
  };

  return (
    <div className={`${sizes[size]} ${bg} rounded-full flex items-center justify-center font-bold tracking-wider shrink-0`}>
      {initials}
    </div>
  );
}
