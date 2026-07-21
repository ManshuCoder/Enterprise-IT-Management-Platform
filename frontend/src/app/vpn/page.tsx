'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Link2, Radio, Globe, ShieldAlert, Loader2 } from 'lucide-react';

interface VpnSession {
  _id: string;
  username: string;
  ip: string;
  location: string;
  connectedAt: string;
  status: 'Active' | 'Disconnected';
  protocol: 'OpenVPN' | 'IPsec' | 'WireGuard';
  bytesSent: number;
  bytesReceived: number;
}

export default function VpnPage() {
  const { socket } = useSocket();
  const { hasRole } = useAuth();
  const [sessions, setSessions] = useState<VpnSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const list = await api.vpn.list();
      setSessions(list);
    } catch (err) {
      console.error('Failed to load VPN sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync VPN bytes in real-time
  useEffect(() => {
    if (!socket) return;
    socket.on('vpnUpdate', (updated: VpnSession[]) => {
      setSessions(updated);
    });
    return () => {
      socket.off('vpnUpdate');
    };
  }, [socket]);

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this VPN tunnel? This immediately terminates remote access.')) return;
    try {
      await api.vpn.disconnect(id);
      fetchSessions();
    } catch (err: any) {
      alert(err.message || 'Disconnect failed.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isActiveRole = hasRole(['Admin', 'Network Engineer', 'Security Engineer']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">VPN Session Concentrator</h1>
          <p className="text-slate-400 text-sm mt-0.5">Monitor active remote access tunnels, data throughput, and enforce connection drop policies</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Active Tunnel Sessions</h3>
          <Link2 className="w-4 h-4 text-slate-500" />
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
                  <th className="p-3">REMOTE USER</th>
                  <th className="p-3">IP ADDRESS</th>
                  <th className="p-3">GEOLOCATION</th>
                  <th className="p-3">TUNNEL PROTOCOL</th>
                  <th className="p-3">START TIME</th>
                  <th className="p-3 text-right">BYTES SENT</th>
                  <th className="p-3 text-right">BYTES RECV</th>
                  <th className="p-3">STATUS</th>
                  {isActiveRole && <th className="p-3 text-center">ACTION</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sessions.map((sess) => (
                  <tr 
                    key={sess._id} 
                    className={`hover:bg-slate-900/40 transition-colors ${
                      sess.status === 'Disconnected' ? 'opacity-40 bg-slate-950/10' : ''
                    }`}
                  >
                    <td className="p-3 font-semibold font-sans text-slate-200">{sess.username}</td>
                    <td className="p-3 text-slate-350">{sess.ip}</td>
                    <td className="p-3 text-slate-300 font-sans flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      <span>{sess.location}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-900/60 text-indigo-400 text-[10px] font-bold">
                        {sess.protocol}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-sans">
                      {new Date(sess.connectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3 text-right text-emerald-400">{formatBytes(sess.bytesSent)}</td>
                    <td className="p-3 text-right text-indigo-400">{formatBytes(sess.bytesReceived)}</td>
                    <td className="p-3 font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        sess.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-500'
                      }`}>
                        {sess.status}
                      </span>
                    </td>
                    {isActiveRole && (
                      <td className="p-3 text-center font-sans">
                        {sess.status === 'Active' ? (
                          <button
                            onClick={() => handleDisconnect(sess._id)}
                            className="flex items-center gap-1 mx-auto px-2.5 py-1 bg-rose-950/20 hover:bg-rose-950/50 border border-rose-900/60 text-rose-400 hover:text-rose-300 rounded text-[10px] font-bold transition"
                            title="Disconnect Session"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            <span>Kill Conn</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold uppercase">OFFLINE</span>
                        )}
                      </td>
                    )}
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
