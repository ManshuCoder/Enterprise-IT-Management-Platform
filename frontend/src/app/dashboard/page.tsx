'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/api';
import { 
  Shield, 
  Activity, 
  Users, 
  LifeBuoy, 
  TrendingUp, 
  Cpu, 
  ArrowUpRight, 
  Terminal as TerminalIcon,
  HardDrive
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface Device {
  _id: string;
  name: string;
  type: string;
  ip: string;
  status: string;
  cpuUsage: number;
  ramUsage: number;
  bandwidth: number;
}

interface PacketLog {
  timestamp: string;
  ruleName: string;
  action: 'Allow' | 'Deny';
  srcZone: string;
  dstZone: string;
  srcIp: string;
  dstIp: string;
  protocol: string;
  port: string;
  size: number;
}

export default function DashboardPage() {
  const { socket } = useSocket();
  const [mounted, setMounted] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [packetLogs, setPacketLogs] = useState<PacketLog[]>([]);
  const [chartData, setChartData] = useState<{ time: string; inbound: number; outbound: number }[]>([]);
  const [vpnCount, setVpnCount] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [threatCount, setThreatCount] = useState(0);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchBaseStats();

    // Generate static initial baseline chart data points
    const baseData = Array.from({ length: 10 }).map((_, i) => ({
      time: new Date(Date.now() - (10 - i) * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      inbound: Math.floor(Math.random() * 200) + 100,
      outbound: Math.floor(Math.random() * 150) + 50
    }));
    setChartData(baseData);
  }, []);

  const fetchBaseStats = async () => {
    try {
      const devList = await api.devices.list();
      setDevices(devList);

      const vpnSessions = await api.vpn.list();
      setVpnCount(vpnSessions.filter((s: any) => s.status === 'Active').length);

      const tickets = await api.tickets.list();
      setOpenTickets(tickets.filter((t: any) => t.status !== 'Closed' && t.status !== 'Resolved').length);

      const alerts = await api.security.getAlerts();
      setThreatCount(alerts.filter((a: any) => a.status === 'Active').length);
    } catch (err) {
      console.error('Failed fetching baseline dashboard states:', err);
    }
  };

  // Socket event subscription
  useEffect(() => {
    if (!socket) return;

    // Listen to real-time CPU/RAM fluctuations
    socket.on('metricsUpdate', (updatedDevices: Device[]) => {
      setDevices(updatedDevices);
    });

    // Listen to live packet matching logs
    socket.on('packetLog', (log: PacketLog) => {
      setPacketLogs(prev => [log, ...prev].slice(0, 50)); // cap at 50 logs

      // Dynamically push a data point to the area chart representing traffic volume
      setChartData(prev => {
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const inboundVal = log.action === 'Allow' ? Math.round(log.size / 10 + Math.random() * 50) : 0;
        const outboundVal = log.action === 'Allow' ? Math.round(log.size / 20 + Math.random() * 30) : 0;

        return [...prev.slice(1), {
          time: nextTime,
          inbound: inboundVal + 50, // base noise
          outbound: outboundVal + 30
        }];
      });
    });

    // Listen to newly triggered security threat alerts
    socket.on('securityAlert', () => {
      setThreatCount(prev => prev + 1);
    });

    return () => {
      socket.off('metricsUpdate');
      socket.off('packetLog');
      socket.off('securityAlert');
    };
  }, [socket]);

  // Scroll to bottom of terminal when logs render
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [packetLogs]);

  const onlineNodes = devices.filter(d => d.status === 'Online').length;

  return (
    <div className="space-y-6">
      {/* Header operations panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Operations Center Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time IT infrastructure and firewall rules log metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Syslog Feed Active</span>
        </div>
      </div>

      {/* Primary stats widget row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Support Status</span>
            <h2 className="text-2xl font-bold text-white mt-1">
              {onlineNodes} / {devices.length || 12}
            </h2>
            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <span>Nodes operational</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active VPN Tunnels</span>
            <h2 className="text-2xl font-bold text-indigo-400 mt-1">{vpnCount} Users</h2>
            <p className="text-[10px] text-slate-400 mt-1">Remote Access sessions open</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Threat Index</span>
            <h2 className="text-2xl font-bold text-rose-500 mt-1">{threatCount} Alerts</h2>
            <p className="text-[10px] text-rose-400 mt-1">Intrusions blocked last hour</p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Helpdesk Backlog</span>
            <h2 className="text-2xl font-bold text-amber-500 mt-1">{openTickets} Incidents</h2>
            <p className="text-[10px] text-slate-400 mt-1">Awaiting technician queue</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <LifeBuoy className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main visualization grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bandwidth chart */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Network Bandwidth Utilization</h3>
              <p className="text-[10px] text-slate-400">Total ingress vs egress traffic stream in Mbps</p>
            </div>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="h-64 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                  <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#05070c', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                    labelStyle={{ color: '#818cf8' }}
                  />
                  <Area type="monotone" dataKey="inbound" name="Ingress (In)" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorInbound)" />
                  <Area type="monotone" dataKey="outbound" name="Egress (Out)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorOutbound)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Server resources */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Infrastructure Nodes Resource Matrix</h3>
            <p className="text-[10px] text-slate-400">Live CPU and RAM utilization metrics for active servers</p>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[256px] pr-1">
            {devices.filter(d => d.type === 'Server' || d.type === 'Firewall').map((dev) => (
              <div key={dev._id} className="p-3 bg-slate-950/50 border border-slate-900 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{dev.name}</span>
                  <span className="font-mono text-slate-400 text-[10px]">{dev.ip}</span>
                </div>
                
                {/* CPU bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-2.5 h-2.5 text-indigo-400" />
                      CPU Usage
                    </span>
                    <span className={dev.cpuUsage > 80 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {dev.cpuUsage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${dev.cpuUsage > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                      style={{ width: `${dev.cpuUsage}%` }}
                    ></div>
                  </div>
                </div>

                {/* RAM bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-2.5 h-2.5 text-emerald-400" />
                      RAM Allocation
                    </span>
                    <span>{dev.ramUsage}%</span>
                  </div>
                  <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                      style={{ width: `${dev.ramUsage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Syslog Terminal stream */}
      <div className="glass-card p-5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
            <h3 className="text-sm font-semibold text-slate-200">Syslog Stream - Firewall Packet Inspector</h3>
          </div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Syslog Source: PaloAlto-Core-FW</span>
        </div>

        {/* Console screen wrapper */}
        <div className="terminal-screen h-48 rounded-lg p-3 overflow-y-auto text-xs text-emerald-400 font-mono space-y-1.5">
          {packetLogs.length === 0 ? (
            <div className="text-slate-500 flex items-center justify-center h-full gap-2">
              <TerminalIcon className="w-4 h-4" />
              <span>Awaiting connection packets... Simulating traffic packets from WAN/LAN subnets.</span>
            </div>
          ) : (
            packetLogs.map((log, index) => (
              <div key={index} className="leading-5 border-b border-slate-900/50 pb-1 flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                  <span className={log.action === 'Allow' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {log.action === 'Allow' ? 'ALLOW' : 'DENY'}
                  </span>{' '}
                  <span className="text-slate-300">RULE:</span>{' '}
                  <span className="text-indigo-300">{log.ruleName}</span>{' '}
                  <span className="text-slate-400">
                    {log.srcZone}:{log.srcIp} → {log.dstZone}:{log.dstIp}
                  </span>{' '}
                  <span className="text-slate-500">PROT:</span>{' '}
                  <span className="text-slate-300">{log.protocol}</span>{' '}
                  <span className="text-slate-500">PORT:</span>{' '}
                  <span className="text-slate-300">{log.port}</span>
                </div>
                <div className="text-slate-500 text-[10px] mt-0.5 md:mt-0 font-sans uppercase">
                  Size: {log.size}B
                </div>
              </div>
            ))
          )}
          <div ref={terminalEndRef}></div>
        </div>
      </div>
    </div>
  );
}
