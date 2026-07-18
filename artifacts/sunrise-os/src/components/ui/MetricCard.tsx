import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  color?: 'blue' | 'orange' | 'amber' | 'red' | 'green';
}

export function MetricCard({ title, value, subtitle, trend, color = 'blue' }: MetricCardProps) {
  const colorMap = {
    blue: 'border-l-sunrise-blue',
    orange: 'border-l-sunrise-orange',
    amber: 'border-l-sunrise-amber',
    red: 'border-l-critical',
    green: 'border-l-success'
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border border-border border-l-4 ${colorMap[color]} flex flex-col`}>
      <h3 className="text-sm font-medium text-slate mb-1">{title}</h3>
      <div className="text-2xl font-bold text-navy flex items-baseline gap-2">
        {value}
        {trend && (
          <span className={`text-xs font-semibold ${
            trend.direction === 'up' ? 'text-critical' : 
            trend.direction === 'down' ? 'text-success' : 'text-slate'
          }`}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : ''} {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-light mt-2">{subtitle}</p>}
    </div>
  );
}
