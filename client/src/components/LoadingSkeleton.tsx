import React from 'react';

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="w-16 h-5 rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
          <div className="w-32 h-7 bg-slate-300 dark:bg-slate-700 rounded" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6,
}) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm animate-pulse">
      {/* Table Header */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        {Array.from({ length: columns }).map((_, idx) => (
          <div key={idx} className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="p-4 flex items-center justify-between gap-4">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div
                key={colIdx}
                className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="w-40 h-5 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
          <div className="w-28 h-3.5 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
        <div className="w-20 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="h-64 flex items-end justify-between gap-3 pt-8 px-4 border-b border-slate-100 dark:border-slate-800">
        {[40, 75, 55, 90, 60, 80, 45, 95].map((height, idx) => (
          <div
            key={idx}
            style={{ height: `${height}%` }}
            className="w-full bg-slate-200 dark:bg-slate-800 rounded-t-lg transition-all"
          />
        ))}
      </div>
    </div>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm animate-pulse space-y-6">
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="w-48 h-6 bg-slate-300 dark:bg-slate-700 rounded" />
          <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <div className="w-20 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-36 h-4 bg-slate-300 dark:bg-slate-600 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default {
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  ProfileSkeleton,
};
