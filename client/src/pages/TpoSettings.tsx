import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Settings, 
  FileSpreadsheet, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Mail, 
  Lock, 
  Layers,
  HardDrive,
  Cloud,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

interface StorageStats {
  summary: {
    totalFiles: number;
    totalStorageBytes: number;
    totalStorageMB: string;
    totalOriginalMB: string;
    bandwidthSavedMB: string;
    savedPercent: number;
  };
  breakdown: Array<{
    type: string;
    count: number;
    sizeBytes: number;
    sizeMB: string;
  }>;
  cloudinaryAccount?: any;
}

const TpoSettings: React.FC = () => {
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const storageRes = await api.get('/documents/storage/stats');
      setStorageStats(storageRes.data?.data || null);
    } catch (err: any) {
      console.error('Failed to fetch storage status', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[#1E1E1E]">
              <Settings size={22} className="text-[#3B50DF]" />
              {/* Main Header (~28–32px Extra Bold) */}
              <h1 className="text-[26px] sm:text-[30px] font-extrabold text-[#1E1E1E] tracking-tight leading-tight">
                TPO Profile & Integration Settings
              </h1>
            </div>
            {/* Secondary / Descriptions (~12–14px Muted Gray) */}
            <p className="text-[#6C757D] text-[13px] mt-1 font-normal">
              Manage your TPO placement profile, Google Sheets two-way sync parameters, and institutional export settings.
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF] text-xs font-bold">
            <ShieldCheck size={14} />
            <span>TPO Officer Portal</span>
          </div>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in duration-200 border ${
          banner.type === 'success' 
            ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#3B50DF]' 
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          <div className="flex items-center space-x-2">
            {banner.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{banner.message}</span>
          </div>
          <button onClick={() => setBanner(null)} className="text-[#6C757D] hover:text-[#1E1E1E]">✕</button>
        </div>
      )}

      {/* 1. TPO Profile Details Card */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm space-y-4">
        {/* Section Titles (~14–16px Semi-Bold) */}
        <h2 className="text-[15px] font-semibold text-[#1E1E1E] uppercase tracking-wider border-b border-[#E5E9F2] pb-3 flex items-center">
          <ShieldCheck size={16} className="mr-2 text-[#3B50DF]" />
          1. Placement Officer Credentials
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block flex items-center">
              <Building2 size={12} className="mr-1 text-[#3B50DF]" />
              Designation
            </span>
            <p className="text-sm font-bold text-[#1E1E1E]">Training & Placement Officer</p>
            <p className="text-[11px] text-[#6C757D]">T&P Corporate Relations Cell</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block flex items-center">
              <Mail size={12} className="mr-1 text-[#3B50DF]" />
              Official Email
            </span>
            <p className="text-sm font-bold text-[#1E1E1E] font-mono">admin@college.edu</p>
            <p className="text-[11px] text-[#6C757D]">Institutional administrator login</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block flex items-center">
              <Lock size={12} className="mr-1 text-[#3B50DF]" />
              Role Permissions
            </span>
            <p className="text-sm font-bold text-[#3B50DF]">TPO SuperAdmin</p>
            <p className="text-[11px] text-[#6C757D]">Audits, Approvals & Full Export</p>
          </div>
        </div>
      </div>

      {/* 2. Institutional Excel Direct Reports */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E9F2] pb-3">
          <h2 className="text-[15px] font-semibold text-[#1E1E1E] uppercase tracking-wider flex items-center">
            <FileSpreadsheet size={16} className="mr-2 text-[#3B50DF]" />
            2. Institutional Excel Export Engine
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Direct MongoDB Export Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
            <div>
              <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">
                Primary Database Source
              </span>
              <p className="text-xs font-mono font-bold text-[#1E1E1E] mt-0.5">
                MongoDB Institutional Cluster (campustrack)
              </p>
            </div>

            <div>
              <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">
                Deterministic Output Format
              </span>
              <p className="text-sm font-bold text-[#1E1E1E] mt-0.5">
                Microsoft Excel Workbook (.xlsx) via ExcelJS
              </p>
            </div>

            <div className="pt-1 flex flex-wrap gap-2">
              <Link
                to="/admin/directory"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-[13px] font-bold shadow-md shadow-[#3B50DF]/20 transition active:scale-95"
              >
                <FileSpreadsheet size={14} className="mr-1.5" />
                <span>Go to Student Directory Export</span>
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5 text-[13px] text-[#1E1E1E]">
            <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">
              Placement Export Architecture
            </span>
            <ul className="space-y-1.5 leading-relaxed list-disc list-inside text-xs text-[#1E1E1E]">
              <li><strong>Authoritative Truth:</strong> MongoDB is the singular, verified system of record.</li>
              <li><strong>Zero Cloud Sheet Dependency:</strong> No external sheet connection needed.</li>
              <li><strong>Deterministic Sorting:</strong> Branch &rarr; Batch &rarr; Roll Number hierarchy.</li>
              <li><strong>Dynamic Placement Custom Fields:</strong> Custom question answers export as dedicated columns.</li>
              <li><strong>Audit Compliance:</strong> Every exported report generation is permanently logged in Audit Trail.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Section Elimination & Sorting Guidelines */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-[15px] font-semibold text-[#1E1E1E] uppercase tracking-wider border-b border-[#E5E9F2] pb-3 flex items-center">
          <Layers size={16} className="mr-2 text-[#3B50DF]" />
          3. Institutional Architecture & Export Standards
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
            <span className="font-bold text-[#1E1E1E] block">🚫 Strict Section Removal</span>
            <p className="leading-relaxed text-[#6C757D]">
              Section has been completely eliminated from all student forms, directory filters, Excel exports, and Google Sheets columns.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
            <span className="font-bold text-[#1E1E1E] block">📊 Deterministic Excel Sorting</span>
            <p className="leading-relaxed text-[#6C757D]">
              All downloadable <code>.xlsx</code> corporate placement reports are sorted deterministically by: <strong>Branch &rarr; Year &rarr; Roll Number</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Cloudinary Production File Storage & Optimization Monitoring */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E9F2] pb-3">
          <h2 className="text-[15px] font-semibold text-[#1E1E1E] uppercase tracking-wider flex items-center">
            <HardDrive size={16} className="mr-2 text-[#3B50DF]" />
            4. Cloudinary File Storage & Optimization
          </h2>
          <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full w-fit">
            <Cloud size={13} className="mr-1 text-emerald-600" />
            Cloudinary Production Active
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">
              Total Documents
            </span>
            <p className="text-xl font-extrabold text-[#1E1E1E]">
              {storageStats?.summary?.totalFiles ?? 0}
            </p>
            <p className="text-[11px] text-[#6C757D]">Stored across all categories</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">
              Cloud Storage Used
            </span>
            <p className="text-xl font-extrabold text-[#3B50DF]">
              {storageStats?.summary?.totalStorageMB ?? '0.00'} MB
            </p>
            <p className="text-[11px] text-[#6C757D]">Compressed binary assets</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block flex items-center">
              <Sparkles size={11} className="mr-1 text-emerald-600" />
              Bandwidth Saved
            </span>
            <p className="text-xl font-extrabold text-emerald-700">
              {storageStats?.summary?.bandwidthSavedMB ?? '0.00'} MB
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold">
              {storageStats?.summary?.savedPercent ?? 0}% efficiency gain
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">
              Security Level
            </span>
            <p className="text-sm font-extrabold text-emerald-700">
              AES-256 + Signed URLs
            </p>
            <p className="text-[11px] text-[#6C757D]">Private student access control</p>
          </div>
        </div>

        {/* Breakdown by Type */}
        {storageStats && storageStats.breakdown && storageStats.breakdown.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider block">
              Storage Allocation Breakdown by Category
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {storageStats.breakdown.map((item) => (
                <div key={item.type} className="p-3 bg-white border border-[#E2E8F0] rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1E1E1E] capitalize">{item.type.replace('_', ' ')}</span>
                    <span className="text-[11px] font-mono text-[#6C757D]">{item.count} files</span>
                  </div>
                  <div className="text-sm font-extrabold text-[#3B50DF]">{item.sizeMB} MB</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Architecture Standards Summary */}
        <div className="p-4 rounded-xl bg-[#EEF2FF]/60 border border-[#D9E1FC] space-y-2 text-xs text-[#1E1E1E]">
          <span className="font-bold text-[#3B50DF] block">
            Cloudinary Production Architecture Rules
          </span>
          <ul className="space-y-1 list-disc list-inside text-[#1E1E1E]">
            <li><strong>Cloudinary:</strong> Stores actual binary files (Profile photos, raw resumes, certificates, proof).</li>
            <li><strong>MongoDB Atlas:</strong> Stores document metadata (Cloudinary Public ID, MIME type, size, SHA-256 hash).</li>
            <li><strong>Google Sheets / Excel:</strong> Synchronizes delivery URLs / references only (never binary blobs).</li>
            <li><strong>Deduplication:</strong> Cryptographic SHA-256 hashing avoids duplicate uploads for identical files.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TpoSettings;
