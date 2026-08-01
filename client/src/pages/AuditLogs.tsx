import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="h-10 w-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-semibold">Loading system audit logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">System Audit Trails</h1>
          <p className="text-slate-400 text-xs mt-1">Review chronological records of logins, profile modifications, and approvals.</p>
        </div>

        <button
          onClick={() => fetchLogs(true)}
          disabled={refreshing}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-slate-700 transition-all flex items-center"
          title="Refresh logs feed"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Actor</th>
                <th className="py-3.5 px-6">Action Triggered</th>
                <th className="py-3.5 px-6">Resource Entity</th>
                <th className="py-3.5 px-6 font-mono">Entity ID Ref</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-800/50 text-xs font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-550 font-sans">
                    No system log entries recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-850/20 transition-colors">
                    <td className="py-3.5 px-6 text-slate-450">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-sans font-bold text-slate-200">
                      {log.userName}
                    </td>
                    <td className="py-3.5 px-6 font-sans text-brand-400 font-semibold">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-6 text-indigo-400 font-semibold">
                      {log.entity}
                    </td>
                    <td className="py-3.5 px-6 text-slate-550">
                      {log.entityId || 'N/A'}
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
