import React from 'react';

interface StatusBadgeProps {
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'SUBMITTED':
        return 'bg-blue-950 text-blue-400 border-blue-900';
      case 'UNDER_REVIEW':
        return 'bg-yellow-950 text-yellow-400 border-yellow-900';
      case 'VERIFIED':
        return 'bg-emerald-950 text-emerald-400 border-emerald-900';
      case 'REJECTED':
        return 'bg-rose-950 text-rose-400 border-rose-900';
      default:
        return 'bg-slate-850 text-slate-300';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'SUBMITTED':
        return 'Submitted';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'VERIFIED':
        return 'Verified';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyles()}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'VERIFIED' ? 'bg-emerald-400' :
        status === 'REJECTED' ? 'bg-rose-400' :
        status === 'UNDER_REVIEW' ? 'bg-yellow-400' :
        status === 'SUBMITTED' ? 'bg-blue-400' : 'bg-slate-400'
      }`}></span>
      {getLabel()}
    </span>
  );
};

export default StatusBadge;
