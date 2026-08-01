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
    <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-all duration-300 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold mt-2 text-white">{value}</p>
        </div>
        <div className="p-3 bg-slate-700/50 rounded-lg text-brand-400">
          {icon}
        </div>
      </div>
      {(description || trend) && (
        <div className="flex items-center mt-4 text-xs">
          {trend && (
            <span className={`font-semibold mr-2 ${
              trend.type === 'positive' ? 'text-emerald-400' :
              trend.type === 'negative' ? 'text-rose-400' : 'text-slate-400'
            }`}>
              {trend.value}
            </span>
          )}
          {description && <span className="text-slate-400">{description}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
