import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  color?: 'blue' | 'orange' | 'amber' | 'red' | 'green' | 'teal' | 'purple';
  icon?: LucideIcon;
  onClick?: () => void;
  /** When true, renders a compact horizontal layout */
  compact?: boolean;
}

const CONFIGS = {
  blue: {
    gradient:  'from-blue-50 via-white to-white',
    border:    'border-blue-200',
    accent:    'text-blue-700',
    label:     'text-blue-500',
    bar:       'bg-blue-500',
    iconBg:    'text-blue-100',
    ring:      'ring-blue-200/60',
    trend_up:   'text-red-500',
    trend_down: 'text-blue-600',
  },
  orange: {
    gradient:  'from-orange-50 via-white to-white',
    border:    'border-orange-200',
    accent:    'text-orange-700',
    label:     'text-orange-500',
    bar:       'bg-orange-500',
    iconBg:    'text-orange-100',
    ring:      'ring-orange-200/60',
    trend_up:   'text-red-500',
    trend_down: 'text-green-600',
  },
  amber: {
    gradient:  'from-amber-50 via-white to-white',
    border:    'border-amber-200',
    accent:    'text-amber-700',
    label:     'text-amber-600',
    bar:       'bg-amber-400',
    iconBg:    'text-amber-100',
    ring:      'ring-amber-200/60',
    trend_up:   'text-red-500',
    trend_down: 'text-green-600',
  },
  red: {
    gradient:  'from-red-50 via-white to-white',
    border:    'border-red-200',
    accent:    'text-red-700',
    label:     'text-red-500',
    bar:       'bg-red-500',
    iconBg:    'text-red-100',
    ring:      'ring-red-200/60',
    trend_up:   'text-red-600',
    trend_down: 'text-green-600',
  },
  green: {
    gradient:  'from-green-50 via-white to-white',
    border:    'border-green-200',
    accent:    'text-green-700',
    label:     'text-green-600',
    bar:       'bg-green-500',
    iconBg:    'text-green-100',
    ring:      'ring-green-200/60',
    trend_up:   'text-red-500',
    trend_down: 'text-green-600',
  },
  teal: {
    gradient:  'from-teal-50 via-white to-white',
    border:    'border-teal-200',
    accent:    'text-teal-700',
    label:     'text-teal-500',
    bar:       'bg-teal-500',
    iconBg:    'text-teal-100',
    ring:      'ring-teal-200/60',
    trend_up:   'text-red-500',
    trend_down: 'text-teal-600',
  },
  purple: {
    gradient:  'from-purple-50 via-white to-white',
    border:    'border-purple-200',
    accent:    'text-purple-700',
    label:     'text-purple-500',
    bar:       'bg-purple-500',
    iconBg:    'text-purple-100',
    ring:      'ring-purple-200/60',
    trend_up:   'text-red-500',
    trend_down: 'text-purple-600',
  },
} as const;

export function MetricCard({
  title, value, subtitle, trend, color = 'blue', icon: Icon, onClick, compact,
}: MetricCardProps) {
  const c = CONFIGS[color];

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`relative overflow-hidden bg-gradient-to-br ${c.gradient} border ${c.border} rounded-xl px-4 py-3 flex items-center gap-3 ${onClick ? `cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all ring-1 ${c.ring}` : ''}`}
      >
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-white shadow-sm border ${c.border} flex-none`}>
            <Icon className={`w-4.5 h-4.5 ${c.accent}`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className={`text-[10px] font-bold uppercase tracking-wide ${c.label}`}>{title}</div>
          <div className="text-xl font-bold text-navy leading-tight">{value}</div>
        </div>
        {subtitle && <div className="text-[10px] text-slate text-right shrink-0">{subtitle}</div>}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-gradient-to-br ${c.gradient} border ${c.border} rounded-xl p-5 flex flex-col ${onClick ? `cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ring-1 ${c.ring}` : ''}`}
    >
      {/* Decorative bg icon */}
      {Icon && (
        <Icon className={`absolute right-3 top-3 w-16 h-16 ${c.iconBg} pointer-events-none`} />
      )}

      {/* Label */}
      <div className={`text-[10px] font-bold uppercase tracking-widest ${c.label} mb-2`}>{title}</div>

      {/* Value */}
      <div className={`text-3xl font-extrabold ${c.accent} leading-none flex items-baseline gap-2`}>
        {value}
        {trend && (
          <span className={`text-xs font-bold ${
            trend.direction === 'up' ? c.trend_up :
            trend.direction === 'down' ? c.trend_down : 'text-slate'
          }`}>
            {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'}&thinsp;{trend.value}
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-slate mt-2 leading-snug">{subtitle}</p>
      )}

      {/* Bottom accent bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${c.bar} opacity-40`} />
    </div>
  );
}
