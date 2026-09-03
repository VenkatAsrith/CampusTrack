import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Briefcase, 
  CheckCircle2, 
  FileDown, 
  AlertTriangle,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface BatchItem {
  batch: string;
  admissionYear: number;
  totalStudents: number;
  activeStudents: number;
  graduatedStudents: number;
  currentYear: number;
  currentSemester: string;
  status: 'Active' | 'Final Semester' | 'Graduated';
  placementStats: {
    placed: number;
    notPlaced: number;
    placementRate: number;
  };
  verificationStats: {
    verified: number;
    pending: number;
  };
  branches: string[];
}

const BatchManagement: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [graduatingBatch, setGraduatingBatch] = useState<string | null>(null);
  const [confirmModalBatch, setConfirmModalBatch] = useState<BatchItem | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/batches');
      setBatches(res.data?.data || []);
    } catch (err: any) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleGraduateBatch = async (batch: string) => {
    setGraduatingBatch(batch);
    setStatusMsg(null);
    try {
      const res = await api.post(`/admin/batches/${encodeURIComponent(batch)}/graduate`);
      setStatusMsg({
        type: 'success',
        text: res.data?.message || `Batch ${batch} marked as Graduated successfully.`,
      });
      setConfirmModalBatch(null);
      await fetchBatches();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to graduate batch.',
      });
    } finally {
      setGraduatingBatch(null);
    }
  };

  const handleExportBatch = async (batch: string) => {
    try {
      const response = await api.get(`/exports/excel?batch=${encodeURIComponent(batch)}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Batch_${batch.replace(/\s+/g, '_')}_Students.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to export batch Excel file', err);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="glow-orb top-0 right-0 w-64 h-64 bg-[#3B50DF]/5" />
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-xs font-bold text-[#3B50DF] mb-2">
            <Layers size={14} />
            <span>Academic Management • JNTUH University College of Engineering</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E1E1E]">
            Academic Batches & Lifecycle Management
          </h1>
          <p className="text-[#6C757D] text-xs mt-1 max-w-2xl">
            Each batch represents an admission cohort (e.g. 2023-2027) that progresses from 1-1 to 4-2. When students complete their final semester, they transition to Graduated / Alumni while retaining their historical batch permanently.
          </p>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center space-x-2">
            {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-[#6C757D] hover:text-[#1E1E1E]">✕</button>
        </div>
      )}

      {/* Batches Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-[#E5E9F2] rounded-2xl space-y-3">
          <div className="h-8 w-8 border-4 border-[#3B50DF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#6C757D] font-medium">Aggregating cohort statistics...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E5E9F2] rounded-2xl text-xs text-[#6C757D]">
          No student batches registered in the database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {batches.map((b) => {
            const isGraduated = b.status === 'Graduated';
            const isFinalSemester = b.status === 'Final Semester';

            return (
              <div 
                key={b.batch} 
                className={`bg-white border rounded-2xl p-6 shadow-sm space-y-4 transition-all relative overflow-hidden ${
                  isGraduated 
                    ? 'border-emerald-200 hover:border-emerald-400' 
                    : isFinalSemester 
                    ? 'border-amber-200 hover:border-amber-400' 
                    : 'border-[#E5E9F2] hover:border-[#3B50DF]'
                }`}
              >
                {/* Top Batch Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl font-mono font-black text-sm flex items-center justify-center ${
                      isGraduated 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : isFinalSemester 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-[#EEF2FF] text-[#3B50DF] border border-[#D9E1FC]'
                    }`}>
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#1E1E1E]">
                        Batch {b.batch}
                      </h3>
                      <p className="text-[11px] text-[#6C757D]">
                        Admitted: {b.admissionYear} • Program: 4-Year B.Tech
                      </p>
                    </div>
                  </div>

                  {/* Lifecycle Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                    isGraduated
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isFinalSemester
                      ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {b.status}
                  </span>
                </div>

                {/* Key Cohort Stats */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                  <div>
                    <span className="text-[10px] text-[#6C757D] uppercase font-bold block">Cohort Size</span>
                    <span className="text-base font-extrabold text-[#1E1E1E]">{b.totalStudents} Students</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6C757D] uppercase font-bold block">Current Standing</span>
                    <span className="text-base font-extrabold text-[#3B50DF] font-mono">
                      {isGraduated ? 'Alumni' : `Year ${b.currentYear} (${b.currentSemester})`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6C757D] uppercase font-bold block">Placement Rate</span>
                    <span className="text-base font-extrabold text-emerald-600">
                      {b.placementStats.placementRate}%
                    </span>
                  </div>
                </div>

                {/* Placement & Verification Breakdown */}
                <div className="grid grid-cols-2 gap-3 text-xs text-[#1E1E1E]">
                  <div className="p-3 rounded-xl border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] text-[#6C757D] font-bold uppercase tracking-wider block flex items-center">
                      <Briefcase size={12} className="mr-1 text-[#3B50DF]" /> Placement Status
                    </span>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#6C757D]">Placed:</span>
                      <strong className="text-emerald-700 font-mono">{b.placementStats.placed}</strong>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#6C757D]">Not Placed:</span>
                      <strong className="text-[#6C757D] font-mono">{b.placementStats.notPlaced}</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] text-[#6C757D] font-bold uppercase tracking-wider block flex items-center">
                      <CheckCircle2 size={12} className="mr-1 text-[#3B50DF]" /> Verification Status
                    </span>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#6C757D]">Verified:</span>
                      <strong className="text-emerald-700 font-mono">{b.verificationStats.verified}</strong>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#6C757D]">Pending:</span>
                      <strong className="text-amber-700 font-mono">{b.verificationStats.pending}</strong>
                    </div>
                  </div>
                </div>

                {/* Branches in this cohort */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-[#6C757D] font-bold uppercase tracking-wider block">
                    Branches in Cohort ({b.branches.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {b.branches.map((br) => (
                      <span key={br} className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[10px] font-bold text-[#1E1E1E]">
                        {br}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="pt-3 border-t border-[#E5E9F2] flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/directory?batch=${encodeURIComponent(b.batch)}`)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[#D0D7E5] text-xs font-bold text-[#1E1E1E] hover:bg-[#F4F6FA] transition"
                  >
                    <span>View Batch Students</span>
                    <ChevronRight size={14} className="text-[#6C757D]" />
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleExportBatch(b.batch)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#EEF2FF] border border-[#D9E1FC] text-xs font-bold text-[#3B50DF] hover:bg-[#E0E7FE] transition"
                      title="Download Batch Excel Spreadsheet"
                    >
                      <FileDown size={13} />
                      <span>Export</span>
                    </button>

                    {/* Graduation Action for 4-2 Final Semester */}
                    {!isGraduated && (
                      <button
                        type="button"
                        onClick={() => setConfirmModalBatch(b)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-sm transition"
                      >
                        <GraduationCap size={14} />
                        <span>Graduate Cohort</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Batch Graduation */}
      {confirmModalBatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#151B3B]/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white border border-[#E5E9F2] rounded-2xl max-w-md w-full my-auto shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <GraduationCap size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1E1E1E]">
                  Confirm Batch Graduation
                </h3>
                <p className="text-xs text-[#6C757D]">Batch {confirmModalBatch.batch}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs text-[#1E1E1E]">
              <div className="flex justify-between">
                <span className="text-[#6C757D]">Batch Cohort:</span>
                <strong>{confirmModalBatch.batch}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6C757D]">Students in Cohort:</span>
                <strong>{confirmModalBatch.totalStudents}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6C757D]">Current Standing:</span>
                <strong>Year {confirmModalBatch.currentYear} ({confirmModalBatch.currentSemester})</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#E2E8F0] text-emerald-700 font-bold">
                <span>New Status:</span>
                <span>Graduated / Alumni</span>
              </div>
            </div>

            <p className="text-[11px] text-[#6C757D] leading-relaxed">
              ⚠️ <strong>Lifecycle Policy:</strong> This batch represents the students' admission cohort and will <strong>permanently remain {confirmModalBatch.batch}</strong> for historical audits. Students will not be moved into a newly created batch.
            </p>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                disabled={Boolean(graduatingBatch)}
                onClick={() => setConfirmModalBatch(null)}
                className="px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#6C757D] hover:bg-[#F4F6FA] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(graduatingBatch)}
                onClick={() => handleGraduateBatch(confirmModalBatch.batch)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50"
              >
                {graduatingBatch ? 'Graduating...' : 'Confirm Graduation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManagement;
