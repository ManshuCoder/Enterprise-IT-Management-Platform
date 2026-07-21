'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/api';
import { 
  Network, 
  Terminal, 
  Settings2, 
  Info,
  Server,
  Zap,
  Globe,
  Monitor,
  Printer,
  Phone,
  Camera,
  Wifi,
  Power
} from 'lucide-react';

interface Device {
  _id: string;
  name: string;
  type: string;
  ip: string;
  mac: string;
  status: 'Online' | 'Offline';
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  bandwidth: number;
  location: string;
  vendor: string;
  os: string;
  uptime: number;
  services: string[];
}

export default function TopologyPage() {
  const { socket } = useSocket();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  
  // Console state
  const [consoleCmd, setConsoleCmd] = useState('');
  const [consoleHistory, setConsoleHistory] = useState<string[]>([]);
  const [loadingCmd, setLoadingCmd] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const list = await api.devices.list();
      setDevices(list);
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  };

  // Sync metrics from sockets
  useEffect(() => {
    if (!socket) return;
    socket.on('metricsUpdate', (updated: Device[]) => {
      setDevices(updated);
      // Update selected device stats in real-time
      if (selectedDevice) {
        const match = updated.find(d => d._id === selectedDevice._id);
        if (match) setSelectedDevice(match);
      }
    });

    return () => {
      socket.off('metricsUpdate');
    };
  }, [socket, selectedDevice]);

  // Scroll terminal history on additions
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleHistory]);

  const handleNodeClick = (name: string) => {
    const dev = devices.find(d => d.name === name);
    if (dev) {
      setSelectedDevice(dev);
      setConsoleHistory([
        `--- Simulating remote terminal access to ${dev.name} (${dev.ip}) ---`,
        `Operating System: ${dev.os}`,
        `Type 'clear' to clear console or run diagnostic queries...`,
        dev.name === 'Linux-WebServer01' ? `Try commands: 'systemctl status nginx', 'docker ps', 'df -h', 'crontab -l'` : 
        dev.name === 'Windows-DC01' ? `Try cmdlets: 'Get-DhcpServerv4Scope', 'Get-DnsServerResourceRecord', 'gpupdate /force', 'Get-Service'` : 
        `Try: 'show version', 'ping 8.8.8.8'`
      ]);
      setConsoleCmd('');
    }
  };

  const handleTogglePower = async (id: string) => {
    try {
      const updated = await api.devices.togglePower(id);
      setSelectedDevice(updated);
      fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Power toggle failed.');
    }
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleCmd.trim() || !selectedDevice) return;

    const cmd = consoleCmd.trim();
    setConsoleHistory(prev => [...prev, `${selectedDevice.name}> ${cmd}`]);
    setConsoleCmd('');
    setLoadingCmd(true);

    try {
      if (cmd.toLowerCase() === 'clear') {
        setConsoleHistory([]);
      } else {
        const res = await api.devices.executeCmd(selectedDevice._id, cmd);
        setConsoleHistory(prev => [...prev, res.output]);
      }
    } catch (err: any) {
      setConsoleHistory(prev => [...prev, `Error: ${err.message || 'Command failed'}`]);
    } finally {
      setLoadingCmd(false);
    }
  };

  // Helper to resolve Lucide Icon based on Node type
  const getNodeIcon = (type: string, status: string) => {
    const isOnline = status === 'Online';
    const color = isOnline ? 'text-emerald-400' : 'text-slate-650';

    switch (type) {
      case 'Router': return <Zap className={`w-5 h-5 ${color}`} />;
      case 'Firewall': return <ShieldAlert className={`w-5 h-5 ${color}`} />;
      case 'Core Switch':
      case 'Access Switch': return <Network className={`w-5 h-5 ${color}`} />;
      case 'Server': return <Server className={`w-5 h-5 ${color}`} />;
      case 'Printer': return <Printer className={`w-5 h-5 ${color}`} />;
      case 'IP Phone': return <Phone className={`w-5 h-5 ${color}`} />;
      case 'Camera': return <Camera className={`w-5 h-5 ${color}`} />;
      case 'WiFi': return <Wifi className={`w-5 h-5 ${color}`} />;
      default: return <Monitor className={`w-5 h-5 ${color}`} />;
    }
  };

  // SVG coordinates for responsive node rendering
  const nodes = [
    { name: 'Internet-Gateway', type: 'Router', x: 100, y: 150 },
    { name: 'Core-Firewall', type: 'Firewall', x: 260, y: 150 },
    { name: 'Core-Switch', type: 'Core Switch', x: 420, y: 150 },
    { name: 'Access-Switch-LAN', type: 'Access Switch', x: 580, y: 150 },
    { name: 'HQ-WiFi-AP01', type: 'WiFi', x: 580, y: 280 },
    { name: 'Windows-DC01', type: 'Server', x: 740, y: 50 },
    { name: 'Linux-WebServer01', type: 'Server', x: 740, y: 150 },
    { name: 'HR-Workstation', type: 'Client', x: 740, y: 250 },
    { name: 'Main-Office-Printer', type: 'Printer', x: 740, y: 350 }
  ];

  // SVG connection lines mapping between nodes
  const lines = [
    { from: 'Internet-Gateway', to: 'Core-Firewall' },
    { from: 'Core-Firewall', to: 'Core-Switch' },
    { from: 'Core-Switch', to: 'Access-Switch-LAN' },
    { from: 'Access-Switch-LAN', to: 'HQ-WiFi-AP01' },
    { from: 'Access-Switch-LAN', to: 'Windows-DC01' },
    { from: 'Access-Switch-LAN', to: 'Linux-WebServer01' },
    { from: 'Access-Switch-LAN', to: 'HR-Workstation' },
    { from: 'Access-Switch-LAN', to: 'Main-Office-Printer' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Interactive Network Topology</h1>
          <p className="text-slate-400 text-sm mt-0.5">Click operational system nodes to audit live configuration prompts, hardware telemetry & SSH ports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Topology Map */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 xl:col-span-2 relative overflow-hidden flex flex-col justify-between min-h-[500px]">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">HQ Infrastructure Logical View</h3>
            <p className="text-[10px] text-slate-400">Click node elements to engage technicians terminal overlays</p>
          </div>

          {/* SVG Canvas Map */}
          <div className="relative w-full overflow-x-auto flex justify-center py-6">
            <div className="w-[850px] h-[400px] relative select-none">
              {/* Draw connections first */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {lines.map((line, i) => {
                  const nodeFrom = nodes.find(n => n.name === line.from);
                  const nodeTo = nodes.find(n => n.name === line.to);
                  if (!nodeFrom || !nodeTo) return null;

                  const devFrom = devices.find(d => d.name === line.from);
                  const devTo = devices.find(d => d.name === line.to);
                  const isOffline = devFrom?.status === 'Offline' || devTo?.status === 'Offline';

                  return (
                    <line
                      key={i}
                      x1={nodeFrom.x + 20}
                      y1={nodeFrom.y + 20}
                      x2={nodeTo.x + 20}
                      y2={nodeTo.y + 20}
                      stroke={isOffline ? '#1e293b' : '#312e81'}
                      strokeWidth={2}
                      strokeDasharray={isOffline ? '5,5' : '0'}
                      className={isOffline ? '' : 'animate-[stroke-pulse_3s_infinite_alternate]'}
                    />
                  );
                })}
              </svg>

              {/* Draw Nodes */}
              {nodes.map((node) => {
                const dev = devices.find(d => d.name === node.name);
                const isOnline = dev?.status === 'Online';
                const isSelected = selectedDevice?.name === node.name;

                return (
                  <div
                    key={node.name}
                    style={{ left: node.x, top: node.y }}
                    onClick={() => handleNodeClick(node.name)}
                    className={`absolute z-10 w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'bg-indigo-600/35 border-2 border-indigo-400 shadow-md shadow-indigo-500/20' 
                        : isOnline 
                          ? 'bg-slate-900 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800'
                          : 'bg-slate-950/70 border border-slate-900 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {getNodeIcon(node.type, dev?.status || 'Online')}
                    
                    {/* Node label */}
                    <div className="absolute top-13 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold text-slate-300 font-mono tracking-tight bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-900">
                      {node.name.replace('-Workstation', '').replace('-Gateway', '')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            // Legend: Green = Connected // Grey = Blocked / Power Off
          </div>
        </div>

        {/* Selected Node Panel & SSH terminal */}
        <div className="space-y-6">
          {selectedDevice ? (
            <>
              {/* Asset telemetry Card */}
              <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getNodeIcon(selectedDevice.type, selectedDevice.status)}
                    <h3 className="text-sm font-semibold text-slate-100">{selectedDevice.name}</h3>
                  </div>
                  <button
                    onClick={() => handleTogglePower(selectedDevice._id)}
                    className={`p-1.5 rounded-lg border transition ${
                      selectedDevice.status === 'Online'
                        ? 'bg-rose-950/20 hover:bg-rose-950 border-rose-900/40 text-rose-400'
                        : 'bg-emerald-950/20 hover:bg-emerald-950 border-emerald-900/40 text-emerald-400'
                    }`}
                    title={selectedDevice.status === 'Online' ? 'Power Off Node' : 'Power On Node'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px] font-mono border-t border-slate-850 pt-3">
                  <div><span className="text-slate-500">IP ADDRESS:</span> <span className="text-slate-300">{selectedDevice.ip}</span></div>
                  <div><span className="text-slate-500">OS PLAT:</span> <span className="text-slate-300 truncate inline-block max-w-[100px]">{selectedDevice.os}</span></div>
                  <div><span className="text-slate-500">MAC ADDR:</span> <span className="text-slate-350">{selectedDevice.mac}</span></div>
                  <div><span className="text-slate-500">VENDOR:</span> <span className="text-slate-350">{selectedDevice.vendor}</span></div>
                </div>

                {/* Telemetry charts */}
                {selectedDevice.status === 'Online' && (
                  <div className="space-y-2 border-t border-slate-850 pt-3">
                    {/* CPU */}
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>CPU UTILIZATION</span>
                        <span>{selectedDevice.cpuUsage}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${selectedDevice.cpuUsage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* RAM */}
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>RAM ALLOCATION</span>
                        <span>{selectedDevice.ramUsage}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${selectedDevice.ramUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SSH / PowerShell terminal console */}
              <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Terminal className="w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-200">Management Shell Console</span>
                </div>

                <div className="terminal-screen h-48 rounded p-2.5 overflow-y-auto text-[10px] font-mono text-emerald-400 leading-relaxed space-y-1">
                  {consoleHistory.map((line, idx) => (
                    <div key={idx} className="whitespace-pre-wrap">{line}</div>
                  ))}
                  {loadingCmd && <div className="text-indigo-400 animate-pulse">Running query on target agent...</div>}
                  <div ref={consoleEndRef}></div>
                </div>

                <form onSubmit={handleSendCommand} className="flex gap-2">
                  <input
                    type="text"
                    disabled={loadingCmd || selectedDevice.status === 'Offline'}
                    value={consoleCmd}
                    onChange={(e) => setConsoleCmd(e.target.value)}
                    placeholder={selectedDevice.status === 'Offline' ? 'Node is offline' : 'Enter CLI command...'}
                    className="flex-1 bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={loadingCmd || selectedDevice.status === 'Offline'}
                    className="px-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-300 rounded text-xs transition"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="glass-card p-6 rounded-xl border border-slate-800 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
              <Info className="w-6 h-6 text-slate-650" />
              <span>Select any infrastructure node from the topology diagram to trace hardware details and execute remote command triggers.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
