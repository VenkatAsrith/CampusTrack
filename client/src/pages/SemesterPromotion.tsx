import React, { useState } from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SEMESTERS = [
  { code: '1-1', sem: 1, year: 1, next: '1-2', nextSem: 2, nextYear: 1 },
  { code: '1-2', sem: 2, year: 1, next: '2-1', nextSem: 3, nextYear: 2, isYearJump: true },
  { code: '2-1', sem: 3, year: 2, next: '2-2', nextSem: 4, nextYear: 2 },
  { code: '2-2', sem: 4, year: 2, next: '3-1', nextSem: 5, nextYear: 3, isYearJump: true },
  { code: '3-1', sem: 5, year: 3, next: '3-2', nextSem: 6, nextYear: 3 },
  { code: '3-2', sem: 6, year: 3, next: '4-1', nextSem: 7, nextYear: 4, isYearJump: true },
  { code: '4-1', sem: 7, year: 4, next: '4-2', nextSem: 8, nextYear: 4 },
];

const ALL_BRANCHES = [
  'CSE',
  'CSE SF',
  'CSC',
  'CSM',
  'ECE',
  'ME',
  'EEE',
  'Civil'
];

const SemesterPromotion: React.FC = () => {
  const navigate = useNavigate();

  const [selectedSemCode, setSelectedSemCode] = useState<string>('3-1');
  const [selectedBranches, setSelectedBranches] = useState<string[]>(ALL_BRANCHES);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promotionResult, setPromotionResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentConfig = SEMESTERS.find((s) => s.code === selectedSemCode) || SEMESTERS[4];

  const handleBranchToggle = (branch: string) => {
    if (selectedBranches.includes(branch)) {
      if (selectedBranches.length > 1) {
        setSelectedBranches(selectedBranches.filter((b) => b !== branch));
      }
    } else {
      setSelectedBranches([...selectedBranches, branch]);
    }
  };

  const handleSelectAllBranches = () => {
    setSelectedBranches(ALL_BRANCHES);
  };

  // Preview Dry Run
  const handleReviewPromotion = async () => {
    setErrorMsg(null);
    setLoadingPreview(true);
    setPreviewData(null);
    setPromotionResult(null);

    try {
      const res = await api.post('/admin/promote-semester', {
        fromSemester: currentConfig.sem,
        toSemester: currentConfig.nextSem,
        branches: selectedBranches,
        dryRun: true,
      });

      if (res.data?.data) {
        setPreviewData(res.data.data);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to calculate promotion preview.');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Execute Promotion after confirmation
  const handleConfirmPromotion = async () => {
    setPromoting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/admin/promote-semester', {
        fromSemester: currentConfig.sem,
        toSemester: currentConfig.nextSem,
        branches: selectedBranches,
        dryRun: false,
      });

      if (res.data?.data) {
        setPromotionResult(res.data.data);
        setShowConfirmModal(false);
        setPreviewData(null);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to execute semester promotion.');
      setShowConfirmModal(false);
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="glow-orb top-0 right-0 w-64 h-64 bg-[#3B50DF]/5" />
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-xs font-bold text-[#3B50DF] mb-2">
            <GraduationCap size={14} />
            <span>Academic Management</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#1E1E1E]">
            Semester Promotion & Year Transition
          </h1>
          <p className="text-[#6C757D] text-xs mt-1 max-w-2xl">
            Promote an entire cohort of students sequentially between academic semesters. When crossing from an even semester (1-2, 2-2, 3-2), students are automatically transitioned into the next academic year across the database and Google Sheets.
          </p>
        </div>
      </div>

      {/* Main Promotion Configuration Card */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-sm font-extrabold text-[#1E1E1E] uppercase tracking-wider pb-3 border-b border-[#E5E9F2]">
          1. Select Semester Advancement
        </h2>

        {/* Semester Progression Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SEMESTERS.map((item) => {
            const isSelected = selectedSemCode === item.code;
            return (
              <div
                key={item.code}
                onClick={() => {
                  setSelectedSemCode(item.code);
                  setPreviewData(null);
                  setPromotionResult(null);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-[#3B50DF] bg-[#EEF2FF]/40 shadow-sm'
                    : 'border-[#E5E9F2] bg-white hover:border-[#3B50DF]/50 hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-[#3B50DF]">
                    Semester {item.code}
                  </span>
                  {item.isYearJump && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Year Transition
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center space-x-3 text-[#1E1E1E]">
                  <div className="font-extrabold text-base">{item.code}</div>
                  <ArrowRight size={16} className="text-[#3B50DF]" />
                  <div className="font-extrabold text-base text-[#3B50DF]">{item.next}</div>
                </div>

                <p className="text-[11px] text-[#6C757D] mt-2">
                  Year {item.year} {item.isYearJump ? `→ Year ${item.nextYear}` : `(Year ${item.year})`}
                </p>
              </div>
            );
          })}
        </div>

        {/* Year Transition Highlight Box */}
        {currentConfig.isYearJump && (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start space-x-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Academic Year Transition Detected: Year {currentConfig.year} → Year {currentConfig.nextYear}
              </h4>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Students successfully promoted from {currentConfig.code} to {currentConfig.next} will automatically move from {currentConfig.year}{currentConfig.year === 1 ? 'st' : currentConfig.year === 2 ? 'nd' : 'rd'} Year to {currentConfig.nextYear}{currentConfig.nextYear === 2 ? 'nd' : currentConfig.nextYear === 3 ? 'rd' : 'th'} Year across all directory views without creating duplicate records.
              </p>
            </div>
          </div>
        )}

        {/* Branch Selector */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider">
              Target Branches
            </label>
            <button
              type="button"
              onClick={handleSelectAllBranches}
              className="text-xs font-bold text-[#3B50DF] hover:underline"
            >
              Select All Branches
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ALL_BRANCHES.map((b) => {
              const isChecked = selectedBranches.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleBranchToggle(b)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-between ${
                    isChecked
                      ? 'bg-[#3B50DF] text-white border-[#3B50DF] shadow-sm'
                      : 'bg-white text-[#6C757D] border-[#E2E8F0] hover:border-[#3B50DF]'
                  }`}
                >
                  <span>{b}</span>
                  {isChecked && <CheckCircle2 size={14} className="text-white ml-1.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-[#E5E9F2] flex items-center justify-between">
          <p className="text-xs text-[#6C757D]">
            Selected: <strong className="text-[#1E1E1E]">{currentConfig.code} → {currentConfig.next}</strong> ({selectedBranches.length} branches selected)
          </p>
          <button
            type="button"
            onClick={handleReviewPromotion}
            disabled={loadingPreview}
            className="px-6 py-2.5 bg-[#3B50DF] hover:bg-[#2E3FB8] text-white font-bold text-xs rounded-xl shadow-md shadow-[#3B50DF]/20 transition active:scale-95 disabled:opacity-50 flex items-center space-x-2"
          >
            {loadingPreview ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Checking Database...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Review Affected Students</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center space-x-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Promotion Result Card */}
      {promotionResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center space-x-3 text-emerald-800">
            <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-base font-extrabold">Promotion Completed Successfully!</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                {promotionResult.updatedCount} students have been successfully advanced from {promotionResult.fromSemesterCode} to {promotionResult.toSemesterCode}
                {promotionResult.isYearTransition && ` (Year ${promotionResult.fromYear} → Year ${promotionResult.toYear})`}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => navigate(`/admin/directory?year=${promotionResult.toYear}`)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              View Promoted Students (Year {promotionResult.toYear})
            </button>
            <button
              onClick={() => navigate('/admin/directory?tab=export')}
              className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition"
            >
              Open Google Sheets Sync Panel
            </button>
          </div>
        </div>
      )}

      {/* Preview Card (Step 2) */}
      {previewData && (
        <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF]">
                Promotion Safety Review
              </span>
              <h3 className="text-base font-extrabold text-[#1E1E1E] mt-2">
                Candidate Group: {previewData.affectedCount} Students Found
              </h3>
              <p className="text-xs text-[#6C757D] mt-1">
                Please review the affected group before confirming promotion.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
            <div>
              <span className="text-[#6C757D] text-[10px] uppercase font-bold block">Current Semester</span>
              <span className="text-base font-extrabold text-[#1E1E1E] font-mono">{previewData.fromSemesterCode}</span>
            </div>
            <div>
              <span className="text-[#6C757D] text-[10px] uppercase font-bold block">Destination Semester</span>
              <span className="text-base font-extrabold text-[#3B50DF] font-mono">{previewData.toSemesterCode}</span>
            </div>
            <div>
              <span className="text-[#6C757D] text-[10px] uppercase font-bold block">Students Affected</span>
              <span className="text-base font-extrabold text-[#1E1E1E]">{previewData.affectedCount}</span>
            </div>
            <div>
              <span className="text-[#6C757D] text-[10px] uppercase font-bold block">Year Advancement</span>
              <span className="text-base font-extrabold text-amber-700">
                Year {previewData.fromYear} {previewData.isYearTransition ? `→ Year ${previewData.toYear}` : '(Same)'}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#1E1E1E] mb-2">Branches In This Cohort:</h4>
            <div className="flex flex-wrap gap-1.5">
              {previewData.branches.map((b: string) => (
                <span key={b} className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-xs font-bold text-[#1E1E1E]">
                  {b}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E9F2] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setPreviewData(null)}
              className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#6C757D] hover:bg-[#F4F6FA] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={previewData.affectedCount === 0}
              className="px-6 py-2.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-md shadow-[#3B50DF]/20 transition active:scale-95 disabled:opacity-50"
            >
              Confirm Promotion ({previewData.affectedCount} Students)
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Part 5 Specification) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#151B3B]/60 backdrop-blur-sm"
            onClick={() => !promoting && setShowConfirmModal(false)}
          />

          <div className="relative bg-white border border-[#E5E9F2] rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl z-10">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#EEF2FF] text-[#3B50DF]">
                <GraduationCap size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1E1E1E]">
                  Confirm Semester Promotion
                </h3>
                <p className="text-xs text-[#6C757D]">Academic Advancement Review</p>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#1E1E1E]">
              <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                <span className="text-[#6C757D]">Current Semester:</span>
                <strong className="font-mono">{previewData?.fromSemesterCode}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                <span className="text-[#6C757D]">New Semester:</span>
                <strong className="font-mono text-[#3B50DF]">{previewData?.toSemesterCode}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                <span className="text-[#6C757D]">Students Affected:</span>
                <strong className="text-base">{previewData?.affectedCount}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6C757D]">Branches:</span>
                <strong className="truncate max-w-[200px]">{previewData?.branches.join(', ')}</strong>
              </div>
              {previewData?.isYearTransition && (
                <div className="pt-2 border-t border-amber-200 text-amber-800 font-semibold">
                  ⚠️ Year Advancement: Year {previewData.fromYear} → Year {previewData.toYear}
                </div>
              )}
            </div>

            <p className="text-[11px] text-[#6C757D] leading-relaxed">
              This action will update all matching student records in MongoDB and prepare the dataset for synchronization.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={promoting}
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#1E1E1E] hover:bg-[#F4F6FA] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={promoting}
                onClick={handleConfirmPromotion}
                className="px-6 py-2.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-md shadow-[#3B50DF]/20 transition active:scale-95 disabled:opacity-50 flex items-center space-x-2"
              >
                {promoting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Promoting...</span>
                  </>
                ) : (
                  <span>Confirm Promotion</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemesterPromotion;
