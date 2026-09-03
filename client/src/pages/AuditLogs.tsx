import React, { useEffect, useState } from 'react';
import { RefreshCw, History } from 'lucide-react';
import api from '../services/api';
import type { AuditLog } from '../types';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/admin/audit-logs');
      setLogs(res.data.data);
    } catch (err) {
      console.error('Failed to load system logs', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 select-none">
        <div className="h-10 w-10 border-4 border-[#3B50DF] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#6C757D] text-sm font-semibold">Loading system audit logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="flex justify-between items-center bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-[26px] sm:text-[30px] font-extrabold text-[#1E1E1E] flex items-center tracking-tight leading-tight">
            <History className="mr-2.5 text-[#3B50DF]" size={24} />
            TPO Activity & System Audit Trail
          </h1>
          <p className="text-[#6C757D] text-[13px] mt-1 font-normal">
            Chronological audit records of verifications, announcement modifications, and export operations.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(true)}
          disabled={refreshing}
          className="relative z-10 p-2.5 text-[#3B50DF] hover:text-[#2E3FB8] bg-[#EEF2FF] hover:bg-[#E0E7FE] rounded-xl border border-[#D9E1FC] transition-all flex items-center shadow-sm"
          title="Refresh logs feed"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E9F2] bg-[#F8FAFC] text-[11px] text-[#6C757D] uppercase tracking-wider font-bold">
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Actor</th>
                <th className="py-3.5 px-6">Action Triggered</th>
                <th className="py-3.5 px-6">Resource Entity</th>
                <th className="py-3.5 px-6">IP / Origin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#1E1E1E]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6C757D] text-xs font-medium">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#F8FAFD] transition">
                    <td className="py-3.5 px-6 font-mono text-[11px] text-[#6C757D]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-[#1E1E1E]">
                      {log.userName || 'System'}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-[#1E1E1E]">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B50DF] border border-[#D9E1FC]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-[#6C757D] font-mono text-[11px]">
                      {log.entity} {log.entityId ? `(#${log.entityId.slice(-6)})` : ''}
                    </td>
                    <td className="py-3.5 px-6 text-[#6C757D] font-mono text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
