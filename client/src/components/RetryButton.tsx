import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

interface RetryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  onRetry?: () => Promise<void> | void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  children = 'Try Again',
  loading = false,
  loadingText = 'Processing...',
  onRetry,
  variant = 'primary',
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    if (onClick) onClick(e);
    if (onRetry) {
      await onRetry();
    }
  };

  const variantStyles = {
    primary:
      'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:bg-indigo-400',
    secondary:
      'bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600',
    outline:
      'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20',
  }[variant];

  return (
    <button
      type="button"
      disabled={loading || disabled}
      onClick={handleClick}
      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed select-none ${variantStyles} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4 shrink-0" />
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default RetryButton;
