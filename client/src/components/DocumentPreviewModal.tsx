import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  AlertTriangle, 
  ShieldCheck 
} from 'lucide-react';

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentUrl: string;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  documentType?: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  documentUrl,
  downloadUrl,
  fileName,
  fileSize,
  documentType,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reset loading & error state whenever the modal opens or URL changes
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(false);
    }
  }, [isOpen, documentUrl]);

  if (!isOpen) return null;

  const displayName = fileName || title || 'Document';
  const nameLower = displayName.toLowerCase();
  const isPdf = nameLower.endsWith('.pdf') || documentType === 'resume' || documentUrl.includes('.pdf');
  const isImage = nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.webp') || documentType === 'profile_photo';
  const isOfficeDoc = nameLower.endsWith('.doc') || nameLower.endsWith('.docx') || nameLower.endsWith('.xls') || nameLower.endsWith('.xlsx');

  const resolvedDownloadUrl = downloadUrl || (documentUrl.includes('?') ? `${documentUrl}&download=true` : `${documentUrl}?download=true`);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150">
      {/* Dark frosted overlay */}
      <div 
        className="absolute inset-0 bg-[#0F172A]/75 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden z-10">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-10 w-10 rounded-xl bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF] flex items-center justify-center shrink-0">
              {isImage ? <ImageIcon size={20} /> : isPdf ? <FileText size={20} /> : <FileCode size={20} />}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-[#1E1E1E] truncate max-w-md" title={displayName}>
                  {displayName}
                </h3>
                {documentType && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#EEF2FF] text-[#3B50DF] border border-[#D9E1FC] shrink-0">
                    {documentType.replace('_', ' ')}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-[#6C757D] font-mono mt-0.5">
                <span>{isPdf ? 'PDF Document' : isImage ? 'Image Asset' : 'Supporting Document'}</span>
                {fileSize ? <span>• {formatSize(fileSize)}</span> : null}
                <span>• Cloudinary CDN Delivery</span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF2FF] text-[#475569] hover:text-[#3B50DF] border border-[#E2E8F0] hover:border-[#D9E1FC] text-xs font-semibold transition active:scale-95 shadow-sm"
              title="Open online viewer in full browser tab"
            >
              <ExternalLink size={13} />
              <span>New Tab</span>
            </a>

            <a
              href={resolvedDownloadUrl}
              download={fileName || 'document'}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-sm transition active:scale-95"
              title="Download file directly to disk"
            >
              <Download size={13} />
              <span>Download</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] flex items-center justify-center transition active:scale-95"
              title="Close preview"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="relative flex-1 bg-[#F8FAFC] overflow-hidden flex items-center justify-center">
          {/* Loading Overlay */}
          {loading && !error && !isOfficeDoc && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#F8FAFC] space-y-3">
              <div className="h-10 w-10 border-4 border-[#3B50DF] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-[#1E1E1E]">Opening {displayName}...</p>
              <p className="text-[11px] text-[#6C757D]">Loading high-fidelity online preview from secure storage</p>
            </div>
          )}

          {/* Unsupported Office Formats (DOC/DOCX/XLS) */}
          {isOfficeDoc ? (
            <div className="max-w-md p-8 text-center space-y-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm m-4">
              <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <FileCode size={28} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E1E1E]">Office Document Preview</h4>
                <p className="text-xs text-[#6C757D] mt-1.5 leading-relaxed">
                  Microsoft Word and Excel files (.doc, .docx) cannot be previewed natively in the browser without third-party cloud suites. You can download the verified original file to view it locally.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href={resolvedDownloadUrl}
                  download={fileName || 'document'}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-md shadow-[#3B50DF]/20 transition active:scale-95"
                >
                  <Download size={14} />
                  <span>Download Document</span>
                </a>
              </div>
            </div>
          ) : error ? (
            /* Error Fallback */
            <div className="max-w-md p-8 text-center space-y-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm m-4">
              <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E1E1E]">Unable to Preview Document</h4>
                <p className="text-xs text-[#6C757D] mt-1.5 leading-relaxed">
                  The file could not be loaded into the inline viewer. The file may be restricted or unsupported by the browser engine.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 pt-2">
                <a
                  href={resolvedDownloadUrl}
                  download={fileName || 'document'}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-sm transition active:scale-95"
                >
                  <Download size={13} />
                  <span>Download File</span>
                </a>
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] text-xs font-semibold transition shadow-sm"
                >
                  <ExternalLink size={13} />
                  <span>Try New Tab</span>
                </a>
              </div>
            </div>
          ) : isPdf ? (
            /* Native Browser PDF Viewer (iframe with Content-Disposition: inline) */
            <iframe
              src={documentUrl}
              title={displayName}
              className="w-full h-full border-0 bg-white"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          ) : isImage ? (
            /* Native Image Viewer */
            <div className="w-full h-full overflow-auto flex items-center justify-center p-6">
              <img
                src={documentUrl}
                alt={displayName}
                className="max-h-full max-w-full object-contain rounded-xl shadow-md border border-[#E2E8F0] bg-white transition-all"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
              />
            </div>
          ) : (
            /* General browser iframe fallback */
            <iframe
              src={documentUrl}
              title={displayName}
              className="w-full h-full border-0 bg-white"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-5 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-[#64748B]">
            <ShieldCheck size={16} className="text-[#3B50DF]" />
            <span>CampusTrack Institutional Security & Cloudinary Storage Verified</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] text-xs font-semibold transition active:scale-95"
            >
              Close
            </button>
            <a
              href={resolvedDownloadUrl}
              download={fileName || 'document'}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Download size={13} />
              <span>Download File</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
