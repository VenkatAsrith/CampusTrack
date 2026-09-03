import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  FileSpreadsheet, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Mail, 
  Lock, 
  Layers 
} from 'lucide-react';
import api from '../services/api';

interface SyncStatus {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  lastSyncTimestamp: string | null;
  lastSyncAction: string;
  totalStudentsInMongoDB: number;
  syncSecretConfigured: boolean;
}

const TpoSettings: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/sync/status');
      setStatus(res.data);
    } catch (err: any) {
      console.error('Failed to fetch sync status', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSyncToSheets = async () => {
    setSyncing(true);
    setBanner(null);
    try {
      const res = await api.get('/sync/google-sheets/students');
      setBanner({
        type: 'success',
        message: `Successfully synchronized ${res.data.count} student records to Google Sheet!`,
      });
      fetchStatus();
    } catch (err: any) {
      setBanner({
        type: 'error',
        message: err.response?.data?.message || 'Failed to sync with Google Sheets',
      });
    } finally {
      setSyncing(false);
    }
  };

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

      {/* 2. Google Sheets Two-Way Synchronization */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E9F2] pb-3">
          <h2 className="text-[15px] font-semibold text-[#1E1E1E] uppercase tracking-wider flex items-center">
            <FileSpreadsheet size={16} className="mr-2 text-[#3B50DF]" />
            2. Google Sheets Two-Way Synchronization
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Integration Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
            <div>
              <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">
                Connected Spreadsheet ID
              </span>
              <p className="text-xs font-mono font-bold text-[#1E1E1E] mt-0.5 break-all">
                {status?.spreadsheetId || '1w2T9SHihyIOdKWXCkYYPu7R_U2ZYqB3j4zhrQjXKQBk'}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">
                Total Students in Database
              </span>
              <p className="text-[22px] font-bold text-[#1E1E1E] mt-0.5">
                {status?.totalStudentsInMongoDB ?? 78} Records
              </p>
            </div>

            <div className="pt-1 flex flex-wrap gap-2">
              <a
                href={status?.spreadsheetUrl || 'https://docs.google.com/spreadsheets/d/1w2T9SHihyIOdKWXCkYYPu7R_U2ZYqB3j4zhrQjXKQBk/edit'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-white hover:bg-[#F8FAFD] text-[#1E1E1E] text-[13px] font-medium border border-[#D0D7E5] shadow-sm transition active:scale-95"
              >
                <FileSpreadsheet size={14} className="mr-1.5 text-[#3B50DF]" />
                <span>Open Google Sheet</span>
                <ExternalLink size={12} className="ml-1 text-[#6C757D]" />
              </a>

              <button
                type="button"
                disabled={syncing}
                onClick={handleSyncToSheets}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-[13px] font-bold shadow-md shadow-[#3B50DF]/20 transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={14} className={`mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Synchronizing...' : 'Sync MongoDB → Sheet'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5 text-[13px] text-[#1E1E1E]">
            <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">
              Synchronization Rules & Schema
            </span>
            <ul className="space-y-1.5 leading-relaxed list-disc list-inside text-xs text-[#1E1E1E]">
              <li><strong>Authoritative Truth:</strong> MongoDB Atlas is the primary database.</li>
              <li><strong>Operational Copy:</strong> Google Sheets updates sync via secure backend API.</li>
              <li><strong>Sync Key:</strong> Students matched strictly by <code>Roll Number</code>.</li>
              <li><strong>Auto CGPA:</strong> Recalculated automatically on all sheet imports.</li>
              <li><strong>Data Safety:</strong> Passwords, user IDs, and verification history are never overwritten.</li>
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
    </div>
  );
};

export default TpoSettings;
