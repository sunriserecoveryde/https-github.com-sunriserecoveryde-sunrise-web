import React from 'react';

export function RecoveryScoreBadge({ score, size = 'md' }: { score: number; size?: 'md' | 'lg' }) {
  let color = 'text-success';
  if (score < 40) color = 'text-critical';
  else if (score < 60) color = 'text-high';
  else if (score < 80) color = 'text-moderate';

  const sizes = {
    md: 'text-sm px-2 py-1',
    lg: 'text-2xl px-4 py-2'
  };

  return (
    <div className={`inline-flex items-center font-bold bg-white rounded border border-border shadow-sm ${sizes[size]}`}>
      <span className={color}>{score}</span>
      <span className="text-slate-light text-[0.6em] ml-1">/100</span>
    </div>
  );
}
