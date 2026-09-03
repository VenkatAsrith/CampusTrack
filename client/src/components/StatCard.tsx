import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, trend }) => {
  return (
    <div className="bg-white hover-lift rounded-2xl p-5 shadow-sm hover:shadow-md relative overflow-hidden border border-[#E5E9F2] transition-all">
      <div className="flex items-center justify-between relative z-10">
        <div>
          {/* Subtext / Metadata (~10-11px Regular) */}
          <p className="text-[#6C757D] text-[11px] uppercase font-bold tracking-wider">{title}</p>
          {/* Primary Metric (~20-24px Bold) */}
          <p className="text-[24px] font-bold mt-1.5 text-[#1E1E1E] tracking-tight">{value}</p>
        </div>
        {/* Accent / Active Elements: Royal Blue (#3B50DF) */}
        <div className="p-3 bg-[#EEF2FF] border border-[#D9E1FC] rounded-xl text-[#3B50DF] shadow-sm">
          {icon}
        </div>
      </div>

      {(description || trend) && (
        <div className="flex items-center mt-3 text-[11px]">
          {trend && (
            <span className={`font-semibold mr-1.5 ${
              trend.type === 'positive' ? 'text-emerald-600' :
              trend.type === 'negative' ? 'text-rose-600' : 'text-[#6C757D]'
            }`}>
              {trend.value}
            </span>
          )}
          {description && <span className="text-[#6C757D]">{description}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
