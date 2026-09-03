import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import api from '../services/api';

interface FileUploaderProps {
  label: string;
  onUploadSuccess: (documentId: string) => void;
  initialFileName?: string;
  error?: string;
  acceptTypes?: string;
}

type UploadPhase = 'IDLE' | 'OPTIMIZING' | 'UPLOADING' | 'SUCCESS';

interface OptimizationStats {
  originalSize: number;
  optimizedSize: number;
  savedPercent: number;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
};

const FileUploader: React.FC<FileUploaderProps> = ({ 
  label, 
  onUploadSuccess, 
  initialFileName, 
  error,
  acceptTypes = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
}) => {
  const [phase, setPhase] = useState<UploadPhase>(initialFileName ? 'SUCCESS' : 'IDLE');
  const [uploadedName, setUploadedName] = useState<string | null>(initialFileName || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stats, setStats] = useState<OptimizationStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-side image optimization via HTML5 Canvas
  const optimizeImageFile = async (file: File): Promise<{ file: File; originalSize: number; optimizedSize: number; savedPercent: number }> => {
    const originalSize = file.size;

    // Non-destructive: PDFs, DOC, DOCX or non-images bypass canvas transformation to keep 100% legibility
    if (!file.type.startsWith('image/')) {
      return {
        file,
        originalSize,
        optimizedSize: originalSize,
        savedPercent: 0
      };
    }

    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_DIMENSION = 1920; // High-definition document standard
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve({ file, originalSize, optimizedSize: originalSize, savedPercent: 0 });
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.82 quality factor
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= originalSize) {
              // If compressed size is not smaller, retain original file
              return resolve({ file, originalSize, optimizedSize: originalSize, savedPercent: 0 });
            }

            const optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".jpg",
              { type: 'image/jpeg', lastModified: Date.now() }
            );

            const optimizedSize = optimizedFile.size;
            const savedPercent = Math.max(0, Math.round(((originalSize - optimizedSize) / originalSize) * 100));

            resolve({
              file: optimizedFile,
              originalSize,
              optimizedSize,
              savedPercent
            });
          },
          'image/jpeg',
          0.82
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ file, originalSize, optimizedSize: originalSize, savedPercent: 0 });
      };

      img.src = objectUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const rawFile = e.target.files[0];
    
    // Size check before processing: 10MB limit
    if (rawFile.size > 10 * 1024 * 1024) {
      setUploadError('File is too large. Please select a smaller document.');
      return;
    }

    setUploadError(null);
    setPhase('OPTIMIZING');

    try {
      // 1. Client-side optimization phase
      const { file: processedFile, originalSize, optimizedSize, savedPercent } = await optimizeImageFile(rawFile);
      setStats({ originalSize, optimizedSize, savedPercent });

      // 2. Upload phase
      setPhase('UPLOADING');
      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('originalSize', String(originalSize));
      formData.append('optimizedSize', String(optimizedSize));

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        const documentId = response.data.data.id;
        setUploadedName(processedFile.name);
        setPhase('SUCCESS');
        onUploadSuccess(documentId);
      } else {
        throw new Error(response.data.message || 'Failed to upload document.');
      }
    } catch (err: any) {
      setPhase('IDLE');
      setUploadError(err.response?.data?.message || err.message || 'Failed to upload document.');
    }
  };

  const triggerInput = () => {
    if (phase !== 'OPTIMIZING' && phase !== 'UPLOADING') {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider">{label}</label>
        {stats && stats.savedPercent > 0 && phase === 'SUCCESS' && (
          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
            <Sparkles size={11} className="mr-1 text-emerald-600" />
            Saved {stats.savedPercent}% bandwidth
          </span>
        )}
      </div>
      
      <div 
        onClick={triggerInput}
        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
          phase === 'OPTIMIZING' || phase === 'UPLOADING'
            ? 'bg-[#F8FAFC] border-[#3B50DF] pointer-events-none'
            : phase === 'SUCCESS'
            ? 'bg-emerald-50/50 border-emerald-400 hover:bg-emerald-50'
            : uploadError || error
            ? 'bg-rose-50/60 border-rose-300 hover:bg-rose-50'
            : 'bg-[#F8FAFC] border-[#CBD5E1] hover:border-[#3B50DF] hover:bg-[#EEF2FF]/30'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={acceptTypes}
        />

        {phase === 'OPTIMIZING' ? (
          <div className="flex flex-col items-center py-2 text-center">
            <Loader2 className="h-7 w-7 text-[#3B50DF] animate-spin mb-1.5" />
            <span className="text-xs font-bold text-[#1E1E1E]">Optimizing document...</span>
            <span className="text-[11px] text-[#6C757D] mt-0.5">Compressing resolution & ensuring safe Cloudinary payload</span>
          </div>
        ) : phase === 'UPLOADING' ? (
          <div className="flex flex-col items-center py-2 text-center">
            <Loader2 className="h-7 w-7 text-[#3B50DF] animate-spin mb-1.5" />
            <span className="text-xs font-bold text-[#3B50DF]">Uploading...</span>
            <span className="text-[11px] text-[#6C757D] mt-0.5">Storing securely on encrypted institutional storage</span>
          </div>
        ) : phase === 'SUCCESS' && uploadedName ? (
          <div className="flex flex-col items-center py-1.5 text-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-600 mb-1" />
            <span className="text-xs font-bold text-emerald-900">Uploaded successfully</span>
            <span className="text-xs font-medium text-[#1E1E1E] mt-0.5 line-clamp-1 max-w-sm">{uploadedName}</span>
            
            {stats && (
              <div className="text-[11px] font-mono text-[#6C757D] mt-1.5 bg-white px-2.5 py-0.5 rounded border border-[#E2E8F0]">
                Original: <strong className="text-[#1E1E1E]">{formatSize(stats.originalSize)}</strong>
                {stats.savedPercent > 0 && (
                  <>
                    {' | '}Optimized: <strong className="text-emerald-700">{formatSize(stats.optimizedSize)}</strong>
                    {' | '}Saved: <strong className="text-emerald-700">{stats.savedPercent}%</strong>
                  </>
                )}
              </div>
            )}
            <span className="text-[10px] text-emerald-700 mt-1 font-semibold hover:underline">(Click to replace document)</span>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2 text-center">
            <Upload className="h-7 w-7 text-[#3B50DF] mb-1" />
            <span className="text-xs text-[#1E1E1E] font-bold">Select document</span>
            <span className="text-[11px] text-[#6C757D] mt-0.5">PDF, DOCX, JPG, PNG up to 10MB</span>
          </div>
        )}
      </div>

      {(uploadError || error) && (
        <div className="flex items-center text-xs text-rose-600 mt-1.5 ml-1">
          <AlertCircle className="h-3.5 w-3.5 mr-1 shrink-0" />
          <span>{uploadError || error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
