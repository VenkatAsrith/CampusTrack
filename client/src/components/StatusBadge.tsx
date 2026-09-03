import React from 'react';

interface StatusBadgeProps {
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'UPCOMING' | 'ACTIVE' | 'EXPIRED';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'VERIFIED':
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      case 'REJECTED':
      case 'EXPIRED':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
      case 'UNDER_REVIEW':
      case 'UPCOMING':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      case 'SUBMITTED':
        return 'bg-[#EEF2FF] text-[#3B50DF] border-[#D9E1FC] font-semibold';
      case 'DRAFT':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200 font-normal';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'VERIFIED':
      case 'ACTIVE':
        return 'bg-emerald-500';
      case 'REJECTED':
      case 'EXPIRED':
        return 'bg-rose-500';
      case 'UNDER_REVIEW':
      case 'UPCOMING':
        return 'bg-amber-500';
      case 'SUBMITTED':
        return 'bg-[#3B50DF]';
      case 'DRAFT':
      default:
        return 'bg-slate-400';
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
      case 'UPCOMING':
        return 'Upcoming';
      case 'ACTIVE':
        return 'Active';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${getStyles()}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getDotColor()}`}></span>
      {getLabel()}
    </span>
  );
};

export default StatusBadge;
