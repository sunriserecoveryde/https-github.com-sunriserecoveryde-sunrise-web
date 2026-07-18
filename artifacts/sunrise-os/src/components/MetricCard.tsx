import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  color: 'orange' | 'blue' | 'green' | 'purple' | 'teal' | 'rose' | 'amber' | 'red';
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  trendGood?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtext, color, trend, trendValue, trendGood = true }) => {
  const colorMap = {
    orange: 'from-sunrise-orange to-sunrise-amber',
    amber: 'from-sunrise-gold to-sunrise-amber',
    blue: 'from-[#2563EB] to-[#60A5FA]',
    green: 'from-[#16A34A] to-[#4ADE80]',
    purple: 'from-[#7C3AED] to-[#A78BFA]',
    teal: 'from-[#0D9488] to-[#2DD4BF]',
    rose: 'from-[#E11D48] to-[#FB7185]',
    red: 'from-critical to-rose-400'
  };

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = trend === 'flat' ? 'text-slate-light' : 
                     (trendGood && trend === 'up') || (!trendGood && trend === 'down') ? 'text-success' : 'text-critical';

  return (
    <div className="bg-white border border-border rounded-xl p-4 relative overflow-hidden shadow-sm">
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${colorMap[color]}`}></div>
      
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-light mb-2">
        {label}
      </div>
      
      <div className="flex items-end justify-between">
        <div className="text-3xl font-extrabold text-navy leading-none">
          {value}
        </div>
        
        {trend && trendValue && (
          <div className={`flex items-center gap-0.5 text-xs font-bold ${trendColor}`}>
            <TrendIcon size={14} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      
      {subtext && (
        <div className="text-[11.5px] text-slate-light mt-1.5">
          {subtext}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
