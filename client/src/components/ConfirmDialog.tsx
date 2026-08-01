import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  type = 'warning',
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-rose-950/40',
          border: 'border-rose-900/50',
          text: 'text-rose-450',
          button: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 text-white',
        };
      case 'info':
        return {
          bg: 'bg-blue-950/40',
          border: 'border-blue-900/50',
          text: 'text-blue-450',
          button: 'bg-brand-500 hover:bg-brand-600 focus:ring-brand-500 text-slate-950',
        };
      default:
        return {
          bg: 'bg-yellow-950/40',
          border: 'border-yellow-900/50',
          text: 'text-yellow-450',
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay background */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      />
      
      {/* Dialog card */}
      <div className={`relative bg-slate-900 border ${styles.border} rounded-2xl max-w-md w-full p-6 shadow-2xl transition-all scale-100`}>
        <div className="flex items-start">
          <div className={`p-3 rounded-xl mr-4 ${styles.bg}`}>
            <AlertTriangle className={`h-6 w-6 ${styles.text}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-350 mt-2 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 text-sm font-semibold hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors disabled:opacity-50 ${styles.button}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
