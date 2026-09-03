import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  FileDown, 
  Eye, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  X,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import type { Student } from '../types';

interface ColumnDef {
  key: string;
  label: string;
  group: string;
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  // Personal
  { key: 'rollNumber', label: 'Roll Number', group: 'Personal' },
  { key: 'fullName', label: 'Student Name', group: 'Personal' },
  { key: 'email', label: 'Email', group: 'Personal' },
  { key: 'studentMobile', label: 'Student Mobile', group: 'Personal' },
  { key: 'branch', label: 'Branch', group: 'Personal' },
  { key: 'year', label: 'Year', group: 'Personal' },
  { key: 'semester', label: 'Semester', group: 'Personal' },
  // Parent
  { key: 'motherName', label: "Mother's Name", group: 'Parent / Guardian' },
  { key: 'motherMobile', label: "Mother's Mobile", group: 'Parent / Guardian' },
  { key: 'fatherGuardianName', label: "Father's / Guardian Name", group: 'Parent / Guardian' },
  { key: 'fatherGuardianMobile', label: "Father's / Guardian Mobile", group: 'Parent / Guardian' },
  // Address
  { key: 'doorNo', label: 'Door / House No', group: 'Address' },
  { key: 'street', label: 'Street', group: 'Address' },
  { key: 'city', label: 'City / Town', group: 'Address' },
  { key: 'district', label: 'District', group: 'Address' },
  { key: 'state', label: 'State', group: 'Address' },
  { key: 'pincode', label: 'PIN Code', group: 'Address' },
  // Academic
  { key: 'sscPercentage', label: 'SSC %', group: 'Academic' },
  { key: 'academicQualification', label: 'Qualification', group: 'Academic' },
  { key: 'intermediatePercentage', label: 'Intermediate %', group: 'Academic' },
  { key: 'diplomaPercentage', label: 'Diploma %', group: 'Academic' },
  { key: 'sem1', label: 'Semester 1 %', group: 'Academic' },
  { key: 'sem2', label: 'Semester 2 %', group: 'Academic' },
  { key: 'sem3', label: 'Semester 3 %', group: 'Academic' },
  { key: 'sem4', label: 'Semester 4 %', group: 'Academic' },
  { key: 'sem5', label: 'Semester 5 %', group: 'Academic' },
  { key: 'sem6', label: 'Semester 6 %', group: 'Academic' },
  { key: 'sem7', label: 'Semester 7 %', group: 'Academic' },
  { key: 'sem8', label: 'Semester 8 %', group: 'Academic' },
  { key: 'cgpa', label: 'Overall CGPA', group: 'Academic' },
  { key: 'numberOfBacklogs', label: 'Backlogs Count', group: 'Academic' },
  // Portfolio
  { key: 'github', label: 'GitHub', group: 'Portfolio' },
  { key: 'linkedin', label: 'LinkedIn', group: 'Portfolio' },
  { key: 'projectCount', label: 'Projects Count', group: 'Portfolio' },
  { key: 'internshipCount', label: 'Internships Count', group: 'Portfolio' },
  { key: 'certCount', label: 'Certifications Count', group: 'Portfolio' },
  { key: 'codingStats', label: 'Coding Platform Stats', group: 'Portfolio' },
];

const AdminDirectory: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  // Filter states
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [batch, setBatch] = useState('');
  const [backlogs, setBacklogs] = useState('');
  const [minCgpa, setMinCgpa] = useState('');
  const [sortBy, setSortBy] = useState('rollNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'all' | 'filtered' | 'custom'>('filtered');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    DEFAULT_COLUMNS.map((c) => c.key)
  );

  const location = useLocation();
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [yearStats, setYearStats] = useState<any | null>(null);

  // Sync state with URL params & fetch Year-Wise KPI metrics (Part 9 & 13)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qYear = params.get('year') || '';
    const qBranch = params.get('branch') || '';
    const qBatch = params.get('batch') || '';

    if (qYear) setYear(qYear);
    if (qBranch) setBranch(qBranch);
    if (qBatch) setBatch(qBatch);
    setPage(1);

    if (qYear) {
      api.get(`/admin/year-stats?year=${qYear}`)
        .then((res) => setYearStats(res.data?.data || null))
        .catch(() => setYearStats(null));
    } else {
      setYearStats(null);
    }

    if (location.search.includes('tab=export')) {
      setShowExportModal(true);
    }
  }, [location.search]);

  const handleSyncToSheets = async () => {
    setSyncLoading(true);
    setSyncStatusMsg(null);
    try {
      const res = await api.get('/sync/google-sheets/students');
      setSyncStatusMsg({
        type: 'success',
        text: `Successfully synced ${res.data.count} student records to Google Sheet!`,
      });
      setTimeout(() => setSyncStatusMsg(null), 6000);
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to sync MongoDB to Google Sheets',
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/students', {
        params: {
          search: search || undefined,
          branch: branch || undefined,
          year: year || undefined,
          batch: batch || undefined,
          backlogs: backlogs !== '' ? backlogs : undefined,
          minCgpa: minCgpa || undefined,
          sortBy,
          sortOrder,
          page,
          limit,
        },
      });
      setStudents(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error('Failed to load students directory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, branch, year, backlogs, minCgpa, sortBy, sortOrder, page, limit]);

  const handleDownloadExcel = async () => {
    setExporting(true);
    try {
      const payload: any = {
        isCustom: exportMode === 'custom',
        customColumns: exportMode === 'custom' ? selectedColumns : undefined,
      };

      if (exportMode === 'filtered') {
        payload.branch = branch || undefined;
        payload.year = year || undefined;
        payload.backlogs = backlogs !== '' ? backlogs : undefined;
        payload.minCgpa = minCgpa || undefined;
        payload.search = search || undefined;
      }

      const response = await api.post('/exports/excel', payload, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      const filename = `CampusTrack_TPO_${exportMode === 'all' ? 'All' : exportMode === 'filtered' ? 'Filtered' : 'Custom'}_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.download = filename;
      link.click();
      setShowExportModal(false);
    } catch (err) {
      console.error('Exporting Excel report failed', err);
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(DEFAULT_COLUMNS.map((c) => c.key));
  };

  const deselectAllColumns = () => {
    setSelectedColumns(['rollNumber', 'fullName']);
  };

  const groups = Array.from(new Set(DEFAULT_COLUMNS.map((c) => c.group)));

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-[26px] sm:text-[30px] font-extrabold text-[#1E1E1E] tracking-tight leading-tight">
            Student Directory & Academic Registry
          </h1>
          <p className="text-[#6C757D] text-[13px] mt-1 font-normal">
            Search, filter by branch & backlogs, inspect student credentials, and generate Excel drive reports.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <a
            href="https://docs.google.com/spreadsheets/d/1w2T9SHihyIOdKWXCkYYPu7R_U2ZYqB3j4zhrQjXKQBk/edit"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center px-3.5 py-2.5 text-[13px] font-medium bg-white hover:bg-[#F8FAFD] text-[#1E1E1E] rounded-xl border border-[#D0D7E5] shadow-sm transition-all active:scale-95 shrink-0"
          >
            <FileSpreadsheet size={15} className="mr-1.5 text-[#3B50DF]" />
            <span>Open Google Sheet</span>
            <ExternalLink size={12} className="ml-1 text-[#6C757D]" />
          </a>

          <button
            type="button"
            disabled={syncLoading}
            onClick={handleSyncToSheets}
            className="inline-flex items-center justify-center px-3.5 py-2.5 text-[13px] font-medium bg-[#EEF2FF] hover:bg-[#E0E7FE] text-[#3B50DF] rounded-xl border border-[#D9E1FC] shadow-sm transition-all active:scale-95 shrink-0 disabled:opacity-50"
          >
            <RefreshCw size={14} className={`mr-1.5 ${syncLoading ? 'animate-spin' : ''}`} />
            <span>{syncLoading ? 'Syncing...' : 'Sync to Sheet'}</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center justify-center px-4 py-2.5 text-[13px] font-bold bg-[#3B50DF] hover:bg-[#2E3FB8] text-white rounded-xl shadow-md shadow-[#3B50DF]/20 border border-transparent transition-all active:scale-95 shrink-0"
          >
            <FileDown size={15} className="mr-1.5" />
            <span>Excel / Sheets Export</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in duration-200 border ${
          syncStatusMsg.type === 'success' 
            ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#3B50DF]' 
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          <div className="flex items-center space-x-2">
            {syncStatusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{syncStatusMsg.text}</span>
          </div>
          <button onClick={() => setSyncStatusMsg(null)} className="text-[#6C757D] hover:text-[#1E1E1E]">✕</button>
        </div>
      )}

      {/* Year-Wise Dashboard Metrics (Part 9 Specification) */}
      {yearStats && (
        <div className="bg-white border border-[#E5E9F2] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#1E1E1E] flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#3B50DF] border border-[#D9E1FC] text-xs font-bold">
                {yearStats.yearLabel} Cohort Intelligence
              </span>
              <span>Placement & Verification Status</span>
            </h3>
            <span className="text-xs text-[#6C757D] font-mono">
              Live Aggregate Database Stats
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
              <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">Total Students</span>
              <p className="text-lg font-extrabold text-[#1E1E1E] mt-0.5">{yearStats.totalStudents}</p>
            </div>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
              <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">Verified</span>
              <p className="text-lg font-extrabold text-emerald-600 mt-0.5">{yearStats.verifiedStudents}</p>
            </div>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
              <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">Pending</span>
              <p className="text-lg font-extrabold text-amber-600 mt-0.5">{yearStats.pendingVerification}</p>
            </div>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
              <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">Placement Eligible</span>
              <p className="text-lg font-extrabold text-[#3B50DF] mt-0.5">{yearStats.placementEligible}</p>
            </div>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
              <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">Placed</span>
              <p className="text-lg font-extrabold text-emerald-700 mt-0.5">{yearStats.placedStudents}</p>
            </div>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
              <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">Not Placed</span>
              <p className="text-lg font-extrabold text-[#6C757D] mt-0.5">{yearStats.notPlacedStudents}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Filters Bar */}
      <div className="bg-white border border-[#E5E9F2] p-4 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 select-none">
        {/* Search Filter */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, roll, mobile..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="block w-full pl-8 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-[#94A3B8]" />
        </div>

        {/* Branch Filter */}
        <div>
          <select
            value={branch}
            onChange={(e) => { setBranch(e.target.value); setPage(1); }}
            className="block w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
          >
            <option value="">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="CSE SF">CSE SF</option>
            <option value="CSC">CSC</option>
            <option value="CSM">CSM</option>
            <option value="ECE">ECE</option>
            <option value="ME">ME</option>
            <option value="EEE">EEE</option>
            <option value="Civil">Civil</option>
            <option value="Computer Science & Engineering">Computer Science & Eng (CSE)</option>
            <option value="Electronics & Communication Engineering">Electronics & Comm (ECE)</option>
            <option value="Electrical & Electronics Engineering">Electrical & Electronics (EEE)</option>
            <option value="Information Technology">Information Technology (IT)</option>
            <option value="Artificial Intelligence & Machine Learning">AI & ML (AIML)</option>
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <select
            value={year}
            onChange={(e) => {
              const val = e.target.value;
              setYear(val);
              setPage(1);
              if (val) {
                api.get(`/admin/year-stats?year=${val}`)
                  .then((res) => setYearStats(res.data?.data || null))
                  .catch(() => setYearStats(null));
              } else {
                setYearStats(null);
              }
            }}
            className="block w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
          >
            <option value="">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>

        {/* Backlogs Filter */}
        <div>
          <select
            value={backlogs}
            onChange={(e) => { setBacklogs(e.target.value); setPage(1); }}
            className="block w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
          >
            <option value="">All Backlogs</option>
            <option value="0">0 Backlogs (Clear)</option>
            <option value="1">1 Backlog</option>
            <option value="2">2 Backlogs</option>
            <option value="3">3+ Backlogs</option>
          </select>
        </div>

        {/* Minimum CGPA */}
        <div>
          <select
            value={minCgpa}
            onChange={(e) => { setMinCgpa(e.target.value); setPage(1); }}
            className="block w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
          >
            <option value="">All CGPA</option>
            <option value="8.5">CGPA &gt;= 8.5</option>
            <option value="7.5">CGPA &gt;= 7.5</option>
            <option value="6.5">CGPA &gt;= 6.5</option>
            <option value="6.0">CGPA &gt;= 6.0</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1E1E1E]">
            <thead className="bg-[#F8FAFC] text-[11px] font-bold text-[#6C757D] uppercase tracking-wider border-b border-[#E5E9F2]">
              <tr>
                <th className="px-5 py-3.5 cursor-pointer hover:text-[#1E1E1E]" onClick={() => handleSort('rollNumber')}>
                  <div className="flex items-center space-x-1">
                    <span>Roll Number</span>
                    <ArrowUpDown size={12} className="opacity-60" />
                  </div>
                </th>
                <th className="px-5 py-3.5 cursor-pointer hover:text-[#1E1E1E]" onClick={() => handleSort('fullName')}>
                  <div className="flex items-center space-x-1">
                    <span>Student Name</span>
                    <ArrowUpDown size={12} className="opacity-60" />
                  </div>
                </th>
                <th className="px-4 py-3.5">Branch</th>
                <th className="px-3 py-3.5">Year</th>
                <th className="px-3 py-3.5">Sem</th>
                <th className="px-4 py-3.5 cursor-pointer hover:text-[#1E1E1E]" onClick={() => handleSort('cgpa')}>
                  <div className="flex items-center space-x-1">
                    <span>CGPA</span>
                    <ArrowUpDown size={12} className="opacity-60" />
                  </div>
                </th>
                <th className="px-4 py-3.5 cursor-pointer hover:text-[#1E1E1E]" onClick={() => handleSort('numberOfBacklogs')}>
                  <div className="flex items-center space-x-1">
                    <span>Backlogs</span>
                    <ArrowUpDown size={12} className="opacity-60" />
                  </div>
                </th>
                <th className="px-4 py-3.5">Mobile</th>
                <th className="px-4 py-3.5">Completeness</th>
                <th className="px-5 py-3.5 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-[#6C757D] text-xs">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2 text-[#3B50DF]" />
                    Filtering candidates...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-[#6C757D] text-xs">
                    No student records match your query filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-[#F8FAFD] transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#1E1E1E]">
                      {student.rollNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-[#1E1E1E]">{student.fullName}</div>
                      <div className="text-[10px] text-[#6C757D] font-mono truncate max-w-[150px]">{student.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-[#1E1E1E] truncate block max-w-[160px]">
                        {student.branch}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-medium text-[#1E1E1E]">
                      Year {student.year || 1}
                    </td>
                    <td className="px-3 py-3.5 font-medium text-[#1E1E1E]">
                      Sem {student.semester}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-[#EEF2FF] border border-[#D9E1FC] font-bold text-[#3B50DF]">
                        {student.cgpa ? student.cgpa.toFixed(2) : '0.00'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                        (student.numberOfBacklogs ?? 0) === 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {student.numberOfBacklogs ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-[#6C757D]">
                      {student.studentMobile || student.phone || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#3B50DF] h-full rounded-full"
                            style={{ width: `${student.profileCompletion}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-[#6C757D] font-bold">
                          {student.profileCompletion}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/admin/students/${student._id}`)}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#EEF2FF] hover:bg-[#3B50DF] text-[#3B50DF] hover:text-white text-xs font-semibold border border-[#D9E1FC] transition active:scale-95 shadow-sm"
                      >
                        <Eye size={12} className="mr-1.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-[#E5E9F2] flex items-center justify-between bg-[#F8FAFC]">
          <p className="text-xs text-[#6C757D]">
            Showing <strong className="text-[#1E1E1E]">{students.length > 0 ? (page - 1) * limit + 1 : 0}</strong> to{' '}
            <strong className="text-[#1E1E1E]">{Math.min(page * limit, total)}</strong> of{' '}
            <strong className="text-[#1E1E1E]">{total}</strong> students
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-white border border-[#E2E8F0] text-[#1E1E1E] disabled:opacity-30 hover:bg-[#F1F5F9] transition shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-mono text-[#1E1E1E] font-bold px-2">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-white border border-[#E2E8F0] text-[#1E1E1E] disabled:opacity-30 hover:bg-[#F1F5F9] transition shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Excel Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151B3B]/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E5E9F2] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E9F2] pb-3">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#1E1E1E] flex items-center">
                  <FileDown size={18} className="mr-2 text-[#3B50DF]" />
                  TPO Excel Report Generator
                </h2>
                <p className="text-xs text-[#6C757D] mt-0.5 font-normal">
                  Automated sorting: Branch → Year → Roll Number (Section excluded).
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 text-[#6C757D] hover:text-[#1E1E1E]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              {[
                { id: 'filtered', label: 'Export Filtered', desc: `Matching criteria (${total} students)` },
                { id: 'all', label: 'Export All', desc: 'Complete batch registry' },
                { id: 'custom', label: 'Customize Columns', desc: 'Select exact columns' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setExportMode(m.id as any)}
                  className={`p-2.5 rounded-lg text-left transition-all ${
                    exportMode === m.id
                      ? 'bg-[#3B50DF] text-white shadow-md shadow-[#3B50DF]/20'
                      : 'hover:bg-[#EEF2FF] text-[#1E1E1E]'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">{m.label}</p>
                  <p className={`text-[10px] mt-0.5 ${exportMode === m.id ? 'text-white/80' : 'text-[#6C757D]'}`}>{m.desc}</p>
                </button>
              ))}
            </div>

            {/* Custom Column Picker */}
            {exportMode === 'custom' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider">
                    Select Columns to Include ({selectedColumns.length} chosen)
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={selectAllColumns}
                      className="px-2 py-1 rounded bg-[#EEF2FF] hover:bg-[#D9E1FC] text-[10px] text-[#3B50DF] font-bold"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllColumns}
                      className="px-2 py-1 rounded bg-white border border-[#E2E8F0] text-[10px] text-[#6C757D]"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {groups.map((group) => (
                    <div key={group} className="p-3 bg-[#F8FAFC] border border-[#E5E9F2] rounded-xl space-y-2">
                      <p className="text-[11px] font-bold text-[#3B50DF] uppercase tracking-wider">{group}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {DEFAULT_COLUMNS.filter((c) => c.group === group).map((col) => {
                          const isChecked = selectedColumns.includes(col.key);
                          return (
                            <label
                              key={col.key}
                              className="flex items-center space-x-2 text-xs text-[#1E1E1E] cursor-pointer hover:text-[#3B50DF]"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleColumn(col.key)}
                                className="rounded border-[#CBD5E1] text-[#3B50DF] focus:ring-[#3B50DF]"
                              />
                              <span className="truncate">{col.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#E5E9F2] flex items-center justify-between">
              <p className="text-xs text-[#6C757D]">
                Sorted by: <span className="font-mono text-[#1E1E1E] font-bold">Branch → Year → Roll Number</span>
              </p>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#6C757D] hover:bg-[#F4F6FA]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={exporting}
                  className="px-6 py-2 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-md shadow-[#3B50DF]/20 flex items-center"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" />
                      Generating Spreadsheet...
                    </>
                  ) : (
                    <>
                      <FileDown size={14} className="mr-1.5" />
                      Download Excel Sheet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDirectory;
