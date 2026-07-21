'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ShieldCheck, Zap, Radio, Loader2, Info } from 'lucide-react';

interface SecurityAlert {
  _id: string;
  title: string;
  type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  sourceIp?: string;
  destDevice?: string;
  description: string;
  status: 'Active' | 'Investigating' | 'Mitigated';
  threatScore: number;
  timestamp: string;
}

export default function SecurityPage() {
  const { socket } = useSocket();
  const { hasRole } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const list = await api.security.getAlerts();
      setAlerts(list);

      const sum = await api.security.getSummary();
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load security center feeds:', err);
    } finally {
      setLoading(false);
    }
  };

  // Socket listener for security alerts
  useEffect(() => {
    if (!socket) return;
    socket.on('securityAlert', (newAlert: SecurityAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
      // Refetch stats to keep metrics accurate
      api.security.getSummary().then(setSummary);
    });

    return () => {
      socket.off('securityAlert');
    };
  }, [socket]);

  const handleMitigate = async (id: string) => {
    try {
      await api.security.mitigate(id);
      fetchSecurityData();
    } catch (err: any) {
      alert(err.message || 'Mitigation request failed.');
    }
  };

  const getSeverityBg = (s: string) => {
    switch (s) {
      case 'Critical': return 'bg-rose-500/10 text-rose-400 border-rose-900/30';
      case 'High': return 'bg-orange-500/10 text-orange-400 border-orange-900/30';
      case 'Medium': return 'bg-amber-500/10 text-amber-400 border-amber-900/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-900/30';
    }
  };

  const isSecEngineer = hasRole(['Admin', 'Security Engineer']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Cybersecurity Control Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Audit global vulnerability CVE disclosures, brute-force anomalies, and mitigate hosts alerts</p>
        </div>
      </div>

      {loading && !summary ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary metrics row */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Threat score meter */}
              <div className="glass-card p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Risk Rating</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h2 className={`text-4xl font-extrabold font-mono ${
                      summary.summary.overallThreatScore > 75 ? 'text-rose-500' :
                      summary.summary.overallThreatScore > 40 ? 'text-orange-400' : 'text-emerald-400'
                    }`}>
                      {summary.summary.overallThreatScore}
                    </h2>
                    <span className="text-slate-500 text-xs">/ 100 CRITICALITY</span>
                  </div>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-4">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      summary.summary.overallThreatScore > 75 ? 'bg-rose-500' :
                      summary.summary.overallThreatScore > 40 ? 'bg-orange-400' : 'bg-emerald-500'
                    }`} 
                    style={{ width: `${summary.summary.overallThreatScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Statistics counts card */}
              <div className="glass-card p-5 rounded-xl border border-slate-800 md:col-span-2 grid grid-cols-3 gap-4">
                <div className="flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Unmitigated Threats</span>
                  <h3 className="text-2xl font-bold text-rose-450 mt-1">{summary.summary.activeAlerts}</h3>
                  <span className="text-[9px] text-rose-400 mt-0.5">Urgent technician actions</span>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Investigating</span>
                  <h3 className="text-2xl font-bold text-amber-500 mt-1">{summary.summary.investigatingAlerts}</h3>
                  <span className="text-[9px] text-slate-400 mt-0.5">Triage queue items</span>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Mitigated Incidents</span>
                  <h3 className="text-2xl font-bold text-emerald-400 mt-1">{summary.summary.mitigatedAlerts}</h3>
                  <span className="text-[9px] text-emerald-500 mt-0.5">Closed audit records</span>
                </div>
              </div>
            </div>
          )}

          {/* Incidents Table list */}
          <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Active Security Incidents Log</h3>
              <Radio className="w-4 h-4 text-slate-500 animate-pulse" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                    <th className="p-3">SEVERITY</th>
                    <th className="p-3">INCIDENT TITLE</th>
                    <th className="p-3">SOURCE IP</th>
                    <th className="p-3">TARGET HOST</th>
                    <th className="p-3">INCIDENT DETAILS</th>
                    <th className="p-3 font-mono">RISK SCORE</th>
                    <th className="p-3">STATUS</th>
                    {isSecEngineer && <th className="p-3 text-center">ACTION</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {alerts.map((alert) => (
                    <tr 
                      key={alert._id} 
                      className={`hover:bg-slate-900/40 transition-colors ${
                        alert.status === 'Mitigated' ? 'opacity-40 bg-slate-950/10' : ''
                      }`}
                    >
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${getSeverityBg(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-200">{alert.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-350">{alert.sourceIp || 'N/A'}</td>
                      <td className="p-3 font-mono text-slate-300">{alert.destDevice || 'Global'}</td>
                      <td className="p-3 text-slate-400 max-w-[200px] leading-relaxed truncate hover:whitespace-normal cursor-help" title={alert.description}>
                        {alert.description}
                      </td>
                      <td className="p-3 font-mono text-indigo-400 font-bold">{alert.threatScore}%</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                          alert.status === 'Mitigated' ? 'bg-emerald-500/10 text-emerald-400' :
                          alert.status === 'Investigating' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                          'bg-rose-500/10 text-rose-400 animate-pulse'
                        }`}>
                          {alert.status}
                        </span>
                      </td>
                      {isSecEngineer && (
                        <td className="p-3 text-center">
                          {alert.status !== 'Mitigated' ? (
                            <button
                              onClick={() => handleMitigate(alert._id)}
                              className="flex items-center gap-1 mx-auto px-2.5 py-1 bg-emerald-950/20 hover:bg-emerald-950/50 border border-emerald-900 text-emerald-400 rounded text-[10px] font-bold transition"
                              title="Mitigate Incident"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Mitigate</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-bold uppercase">SECURED</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
