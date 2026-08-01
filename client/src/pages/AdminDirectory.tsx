import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileDown, Eye, ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import api from '../services/api';
import type { Student } from '../types';

const AdminDirectory: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  // Filter states
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [batch, setBatch] = useState('');
  const [minCompletion, setMinCompletion] = useState('');
  const [sortBy, setSortBy] = useState('rollNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/students', {
        params: {
          search,
          branch,
          batch,
          minCompletion,
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
  }, [search, branch, batch, minCompletion, sortBy, sortOrder, page, limit]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const response = await api.get('/exports/excel', {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `CampusTrack_CSE_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Student Registry</h1>
          <p className="text-slate-400 text-xs mt-1">Review student profiles, CGPA scores, and completeness aggregates.</p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="flex items-center justify-center px-4 py-2.5 text-xs font-bold bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-lg transition-all active:scale-95 shrink-0"
        >
          {exporting ? (
            <>
              <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" />
              Generating Excel Workbook...
            </>
          ) : (
            <>
              <FileDown size={14} className="mr-1.5" />
              Export Batch Excel
            </>
          )}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-sm">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search roll, name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="block w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none"
          />
        </div>

        {/* Branch */}
        <div className="relative">
          <select
            value={branch}
            onChange={(e) => { setBranch(e.target.value); setPage(1); }}
            className="block w-full px-3 py-2 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="">All Branches</option>
            <option value="Computer Science & Engineering">CSE</option>
          </select>
        </div>

        {/* Batch */}
        <div className="relative">
          <select
            value={batch}
            onChange={(e) => { setBatch(e.target.value); setPage(1); }}
            className="block w-full px-3 py-2 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="">All Batches</option>
            <option value="2023-2027">2023-2027</option>
          </select>
        </div>

        {/* Completion range filter */}
        <div className="relative">
          <select
            value={minCompletion}
            onChange={(e) => { setMinCompletion(e.target.value); setPage(1); }}
            className="block w-full px-3 py-2 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="">All Completion Ranges</option>
            <option value="80">Completed (&gt;= 80%)</option>
            <option value="50">Intermediate (&gt;= 50%)</option>
            <option value="0">Incomplete (&lt; 50%)</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-6 cursor-pointer hover:text-white" onClick={() => handleSort('rollNumber')}>
                  <div className="flex items-center space-x-1">
                    <span>Roll Number</span>
                    <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="py-3.5 px-6 cursor-pointer hover:text-white" onClick={() => handleSort('fullName')}>
                  <div className="flex items-center space-x-1">
                    <span>Student Name</span>
                    <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="py-3.5 px-6">Branch</th>
                <th className="py-3.5 px-6 text-center">Section</th>
                <th className="py-3.5 px-6 text-center">CGPA</th>
                <th className="py-3.5 px-6 text-center" onClick={() => handleSort('profileCompletion')}>
                  <div className="flex items-center justify-center space-x-1">
                    <span>Completion</span>
                    <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="py-3.5 px-6 text-center">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Refreshing registry data...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-550">
                    No student records match selected filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr 
                    key={student._id} 
                    className="hover:bg-slate-850/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/students/${student._id}`)}
                  >
                    <td className="py-4 px-6 font-mono font-semibold text-slate-300">{student.rollNumber}</td>
                    <td className="py-4 px-6 font-bold text-white">{student.fullName}</td>
                    <td className="py-4 px-6 text-slate-400">CSE</td>
                    <td className="py-4 px-6 text-center text-slate-400 font-bold">{student.section}</td>
                    <td className="py-4 px-6 text-center text-brand-400 font-extrabold">{student.cgpa.toFixed(2)}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-brand-500 h-full rounded-full"
                            style={{ width: `${student.profileCompletion}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-300">{student.profileCompletion}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/students/${student._id}`);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                        title="View profile & review achievements"
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="bg-slate-900/20 px-6 py-4 flex items-center justify-between border-t border-slate-800 text-xs">
          <span className="text-slate-500">
            Showing <strong className="text-slate-350">{students.length}</strong> of{' '}
            <strong className="text-slate-350">{total}</strong> records
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 border border-slate-800 hover:bg-slate-800 text-slate-455 rounded-lg disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-slate-400 font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 border border-slate-800 hover:bg-slate-800 text-slate-455 rounded-lg disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDirectory;
