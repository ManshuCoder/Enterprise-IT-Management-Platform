'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { FileText, Search, Download, Filter, Loader2 } from 'lucide-react';

interface AuditLog {
  _id: string;
  action: string;
  actor: string;
  category: string;
  details: string;
  ipAddress: string;
  status: 'Success' | 'Failed';
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [category, status]); // auto trigger on dropdown toggle

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.audit.getLogs({
        category: category || undefined,
        status: status || undefined,
        search: search || undefined
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit trails:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  // EXPORT CSV DYNAMIC DOWNLOAD
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    
    // Header definition
    const headers = ['Timestamp', 'Actor', 'Action', 'Category', 'Details', 'Source IP', 'Status'];
    
    // Format rows
    const rows = logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.actor,
      `"${log.action.replace(/"/g, '""')}"`,
      log.category,
      `"${log.details.replace(/"/g, '""')}"`,
      log.ipAddress,
      log.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `eimp_audit_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Central Operations Audit Trail</h1>
          <p className="text-slate-400 text-sm mt-0.5">Trace and filter administrative actions, portal entries, and firewall policy updates</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-350 hover:text-white rounded-lg text-sm font-semibold transition shadow-md shadow-indigo-950/20 disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          <span>Export logs (CSV)</span>
        </button>
      </div>

      {/* Filter panel card */}
      <div className="glass-card p-4 rounded-xl border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-4 items-end text-xs">
          {/* Keyword Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-slate-400 mb-1.5 uppercase font-bold text-[10px]">Keyword Search</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search actor, action or details..."
                className="w-full glass-input pl-9 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="w-[180px]">
            <label className="block text-slate-400 mb-1.5 uppercase font-bold text-[10px]">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="">All Categories</option>
              <option value="Auth">Auth Sessions</option>
              <option value="Firewall">Firewall Policy</option>
              <option value="Network">Assets & Nodes</option>
              <option value="Active Directory">Active Directory</option>
              <option value="Server Management">Console Actions</option>
              <option value="Helpdesk">Helpdesk Tickets</option>
              <option value="VPN">VPN Sessions</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="w-[150px]">
            <label className="block text-slate-400 mb-1.5 uppercase font-bold text-[10px]">Outcome</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="">All Outcomes</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold transition border border-indigo-500"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Main logs display */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">System Log Trail</h3>
          <FileText className="w-4 h-4 text-slate-500" />
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                  <th className="p-3">TIMESTAMP</th>
                  <th className="p-3">ACTOR</th>
                  <th className="p-3">ACTION EVENT</th>
                  <th className="p-3">CATEGORY</th>
                  <th className="p-3">AUDIT DETAIL</th>
                  <th className="p-3">IP ADDRESS</th>
                  <th className="p-3">OUTCOME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 text-slate-400 font-sans whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold font-sans text-slate-200">{log.actor}</td>
                    <td className="p-3 text-indigo-400">{log.action}</td>
                    <td className="p-3 font-sans text-slate-350">{log.category}</td>
                    <td className="p-3 text-slate-400 font-sans max-w-[280px] truncate hover:whitespace-normal cursor-help" title={log.details}>
                      {log.details}
                    </td>
                    <td className="p-3 text-slate-350">{log.ipAddress}</td>
                    <td className="p-3 font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        log.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
