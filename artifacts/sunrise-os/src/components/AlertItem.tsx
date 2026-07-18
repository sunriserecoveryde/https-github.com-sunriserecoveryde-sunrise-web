import React from 'react';

export interface AlertItemProps {
  severity: 'critical' | 'high' | 'moderate' | 'routine';
  type: string;
  message: string;
  time: string;
}

const AlertItem: React.FC<AlertItemProps> = ({ severity, type, message, time }) => {
  const styles = {
    critical: { bg: 'bg-[#FEF2F2]', border: 'border-critical', badge: 'bg-critical text-white' },
    high: { bg: 'bg-[#FFF7ED]', border: 'border-high', badge: 'bg-high text-white' },
    moderate: { bg: 'bg-[#FFFBEB]', border: 'border-moderate', badge: 'bg-moderate text-white' },
    routine: { bg: 'bg-[#EFF6FF]', border: 'border-routine', badge: 'bg-routine text-white' },
  };

  const s = styles[severity];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${s.bg} ${s.border}`}>
      <div className={`text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 mt-[1px] ${s.badge}`}>
        {severity}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-navy leading-tight mb-0.5">
          {type}
        </div>
        <div className="text-[11.5px] text-slate leading-snug">
          {message}
        </div>
        <div className="text-[10px] text-slate-light mt-1 font-medium">
          {time}
        </div>
      </div>
    </div>
  );
};

export default AlertItem;
