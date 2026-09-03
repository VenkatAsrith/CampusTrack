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
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay background */}
      <div 
        className="absolute inset-0 bg-[#151B3B]/60 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      />
      
      {/* Dialog card */}
      <div className="relative bg-white border border-[#E5E9F2] rounded-2xl max-w-md w-full p-6 shadow-2xl transition-all scale-100">
        <div className="flex items-start">
          <div className="p-3 rounded-xl mr-4 bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF]">
            <AlertTriangle className="h-6 w-6 text-[#3B50DF]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#1E1E1E]">{title}</h3>
            <p className="text-xs text-[#6C757D] mt-2 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[#1E1E1E] text-xs font-semibold hover:bg-[#F4F6FA] focus:outline-none transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center bg-[#3B50DF] hover:bg-[#2E3FB8] text-white shadow-md shadow-[#3B50DF]/20 transition-colors disabled:opacity-50"
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
