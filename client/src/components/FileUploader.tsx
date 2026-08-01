import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

interface FileUploaderProps {
  label: string;
  onUploadSuccess: (documentId: string) => void;
  initialFileName?: string;
  error?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ label, onUploadSuccess, initialFileName, error }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(initialFileName || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFile = e.target.files[0];
    
    // File validation: Size <= 5MB
    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds the 5MB size limit.');
      return;
    }

    // Type validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setUploadError('Only PDF, JPG, JPEG, and PNG files are supported.');
      return;
    }

    setUploadError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        const documentId = response.data.data.id;
        setUploadedName(selectedFile.name);
        onUploadSuccess(documentId);
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      
      <div 
        onClick={triggerInput}
        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
          uploading ? 'bg-slate-800/40 border-slate-700 pointer-events-none' :
          uploadedName ? 'bg-emerald-950/20 border-emerald-800/80 hover:bg-emerald-950/30' :
          uploadError || error ? 'bg-rose-950/20 border-rose-900/80 hover:bg-rose-950/30' :
          'bg-slate-800/30 border-slate-700 hover:border-slate-650 hover:bg-slate-800/50'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
        />

        {uploading ? (
          <div className="flex flex-col items-center py-2">
            <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
            <span className="text-sm mt-2 text-slate-350">Uploading and securing document...</span>
          </div>
        ) : uploadedName ? (
          <div className="flex flex-col items-center py-2 text-center">
            <CheckCircle className="h-8 w-8 text-emerald-400 mb-1" />
            <span className="text-sm font-medium text-emerald-350 line-clamp-1">{uploadedName}</span>
            <span className="text-xs text-slate-500 mt-1">(Click to replace proof document)</span>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2 text-center">
            <Upload className="h-8 w-8 text-slate-400 mb-1" />
            <span className="text-sm text-slate-350 font-medium">Click to select files</span>
            <span className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 5MB</span>
          </div>
        )}
      </div>

      {(uploadError || error) && (
        <div className="flex items-center text-xs text-rose-450 mt-1.5 ml-1">
          <AlertCircle className="h-3.5 w-3.5 mr-1" />
          <span>{uploadError || error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
