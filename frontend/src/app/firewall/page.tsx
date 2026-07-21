'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Terminal, 
  CheckCircle, 
  XCircle,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Info
} from 'lucide-react';

interface FirewallRule {
  _id: string;
  name: string;
  description: string;
  action: 'Allow' | 'Deny';
  srcZone: string;
  dstZone: string;
  srcIp: string;
  dstIp: string;
  protocol: string;
  port: string;
  priority: number;
  enabled: boolean;
  hitCount: number;
}

export default function FirewallPage() {
  const { hasRole } = useAuth();
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [ruleName, setRuleName] = useState('');
  const [ruleDesc, setRuleDesc] = useState('');
  const [action, setAction] = useState<'Allow' | 'Deny'>('Allow');
  const [srcZone, setSrcZone] = useState('LAN');
  const [dstZone, setDstZone] = useState('WAN');
  const [srcIp, setSrcIp] = useState('Any');
  const [dstIp, setDstIp] = useState('Any');
  const [protocol, setProtocol] = useState('ANY');
  const [port, setPort] = useState('Any');
  const [priority, setPriority] = useState('');

  // Simulator states
  const [simSrcIp, setSimSrcIp] = useState('10.0.2.15');
  const [simDstIp, setSimDstIp] = useState('10.0.1.20');
  const [simSrcZone, setSimSrcZone] = useState<'WAN' | 'LAN' | 'DMZ' | 'VPN'>('LAN');
  const [simDstZone, setSimDstZone] = useState<'WAN' | 'LAN' | 'DMZ' | 'VPN'>('DMZ');
  const [simProtocol, setSimProtocol] = useState<'TCP' | 'UDP' | 'ICMP'>('TCP');
  const [simPort, setSimPort] = useState('80');
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const data = await api.firewall.getRules();
      setRules(data);
    } catch (err: any) {
      console.error('Failed to load rules:', err);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priNum = parseInt(priority);
    if (!ruleName || isNaN(priNum)) {
      setError('Please provide a valid rule name and priority index.');
      return;
    }

    try {
      await api.firewall.createRule({
        name: ruleName,
        description: ruleDesc,
        action,
        srcZone,
        dstZone,
        srcIp,
        dstIp,
        protocol,
        port,
        priority: priNum,
        enabled: true
      });
      setShowAddModal(false);
      // Reset form
      setRuleName('');
      setRuleDesc('');
      setPriority('');
      fetchRules();
    } catch (err: any) {
      setError(err.message || 'Failed to create firewall rule.');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this firewall rule? This action disrupts active network paths.')) return;
    try {
      await api.firewall.deleteRule(id);
      fetchRules();
    } catch (err: any) {
      alert(err.message || 'Failed to delete rule.');
    }
  };

  const handleToggleRule = async (rule: FirewallRule) => {
    try {
      await api.firewall.updateRule(rule._id, { enabled: !rule.enabled });
      fetchRules();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle rule state.');
    }
  };

  const handleSimulate = async () => {
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await api.firewall.simulatePacket({
        srcIp: simSrcIp,
        dstIp: simDstIp,
        srcZone: simSrcZone,
        dstZone: simDstZone,
        protocol: simProtocol,
        port: parseInt(simPort) || 80
      });
      setSimResult(res);
      fetchRules(); // Refresh hit counts
    } catch (err: any) {
      alert(err.message || 'Packet simulation request failed.');
    } finally {
      setSimLoading(false);
    }
  };

  const isEngineer = hasRole(['Admin', 'Firewall Engineer']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Firewall Management Policy</h1>
          <p className="text-slate-400 text-sm mt-0.5">Configure access control lists, network zone boundaries, and simulate packet traces</p>
        </div>
        {isEngineer && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition border border-indigo-500 shadow-md shadow-indigo-950/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Security Rule</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Rules Table */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Active ACL Rules Sequence</h3>
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                  <th className="p-3 font-mono">PRIORITY</th>
                  <th className="p-3">RULE NAME</th>
                  <th className="p-3">ACTION</th>
                  <th className="p-3">ZONE MAPPING</th>
                  <th className="p-3">IP SOURCE/DEST</th>
                  <th className="p-3">PORT/PROTO</th>
                  <th className="p-3 text-right">HIT COUNT</th>
                  {isEngineer && <th className="p-3 text-center">CONTROLS</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rules.map((rule) => (
                  <tr 
                    key={rule._id} 
                    className={`hover:bg-slate-900/40 transition-colors ${!rule.enabled ? 'opacity-40 bg-slate-950/10' : ''}`}
                  >
                    <td className="p-3 font-mono text-slate-400">{rule.priority}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-200">{rule.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">{rule.description}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        rule.action === 'Allow' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {rule.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      {rule.srcZone} → {rule.dstZone}
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      <div className="truncate max-w-[120px]">{rule.srcIp}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[120px]">→ {rule.dstIp}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      {rule.protocol} / <span className="text-slate-400">{rule.port}</span>
                    </td>
                    <td className="p-3 text-right font-mono text-indigo-400 font-semibold">
                      {rule.hitCount.toLocaleString()}
                    </td>
                    {isEngineer && (
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleToggleRule(rule)}
                            className={`px-2 py-0.5 rounded border text-[9px] font-semibold ${
                              rule.enabled 
                                ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400' 
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            {rule.enabled ? 'Active' : 'Disabled'}
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule._id)}
                            className="p-1 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 border border-transparent hover:border-rose-900/30 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Packet Simulator Panel */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-indigo-400">
            <Terminal className="w-4 h-4" />
            <h3 className="text-sm font-semibold text-slate-200">Interactive Packet Simulator</h3>
          </div>
          <p className="text-[10px] text-slate-400">
            Submit a simulated packet header to evaluate security firewall rule prioritization matching.
          </p>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Source Zone</label>
                <select 
                  value={simSrcZone} 
                  onChange={(e: any) => setSimSrcZone(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 outline-none"
                >
                  <option value="LAN">LAN</option>
                  <option value="WAN">WAN</option>
                  <option value="DMZ">DMZ</option>
                  <option value="VPN">VPN</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Dest Zone</label>
                <select 
                  value={simDstZone} 
                  onChange={(e: any) => setSimDstZone(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 outline-none"
                >
                  <option value="WAN">WAN</option>
                  <option value="LAN">LAN</option>
                  <option value="DMZ">DMZ</option>
                  <option value="VPN">VPN</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Source IP Address</label>
              <input
                type="text"
                value={simSrcIp}
                onChange={(e) => setSimSrcIp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Dest IP Address</label>
              <input
                type="text"
                value={simDstIp}
                onChange={(e) => setSimDstIp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Protocol</label>
                <select 
                  value={simProtocol} 
                  onChange={(e: any) => setSimProtocol(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 outline-none font-mono"
                >
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="ICMP">ICMP</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Dest Port</label>
                <input
                  type="text"
                  value={simPort}
                  onChange={(e) => setSimPort(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 outline-none font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={simLoading}
              className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold tracking-wider transition border border-indigo-500"
            >
              <Play className="w-3 h-3" />
              <span>{simLoading ? 'Evaluating Flow...' : 'Send Packet Test'}</span>
            </button>
          </div>

          {/* Simulation Result Area */}
          {simResult && (
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evaluation Result</span>
                <div className="flex items-center gap-1.5">
                  {simResult.decision === 'Allow' ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs uppercase font-mono">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Allow
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 font-bold text-xs uppercase font-mono">
                      <XCircle className="w-3.5 h-3.5" />
                      Drop
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[11px] leading-relaxed space-y-1 font-mono text-slate-300 bg-black/40 p-2.5 rounded border border-slate-900">
                <div>Matched Policy: <span className="text-indigo-400 font-bold">{simResult.matchedRule}</span></div>
                <div>Action Type: {simResult.decision === 'Allow' ? 'FORWARD_ACCEPT' : 'DROP_DENY'}</div>
                <div>Zone Flow: {simResult.packet.srcZone} → {simResult.packet.dstZone}</div>
                <div>Socket: {simResult.packet.protocol}/{simResult.packet.port}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-6 rounded-xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 mb-4 text-indigo-400">
              <ShieldAlert className="w-5 h-5" />
              <h2 className="text-md font-bold text-white">Create Security ACL Policy Rule</h2>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/20 text-rose-300 rounded text-xs mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAddRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Rule Name</label>
                  <input
                    type="text"
                    required
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="Allow-API-Partner"
                    className="w-full glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Priority Index (Unique)</label>
                  <input
                    type="number"
                    required
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    placeholder="120"
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  placeholder="Allow inbound API webhook integrations"
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Action</label>
                  <select 
                    value={action} 
                    onChange={(e: any) => setAction(e.target.value)} 
                    className="w-full glass-input text-xs"
                  >
                    <option value="Allow">Allow</option>
                    <option value="Deny">Deny</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Source Zone</label>
                  <select 
                    value={srcZone} 
                    onChange={(e) => setSrcZone(e.target.value)} 
                    className="w-full glass-input text-xs"
                  >
                    <option value="LAN">LAN</option>
                    <option value="WAN">WAN</option>
                    <option value="DMZ">DMZ</option>
                    <option value="VPN">VPN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Dest Zone</label>
                  <select 
                    value={dstZone} 
                    onChange={(e) => setDstZone(e.target.value)} 
                    className="w-full glass-input text-xs"
                  >
                    <option value="WAN">WAN</option>
                    <option value="LAN">LAN</option>
                    <option value="DMZ">DMZ</option>
                    <option value="VPN">VPN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Source IP/CIDR</label>
                  <input
                    type="text"
                    value={srcIp}
                    onChange={(e) => setSrcIp(e.target.value)}
                    placeholder="Any"
                    className="w-full glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Dest IP/CIDR</label>
                  <input
                    type="text"
                    value={dstIp}
                    onChange={(e) => setDstIp(e.target.value)}
                    placeholder="Any"
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Protocol</label>
                  <select 
                    value={protocol} 
                    onChange={(e) => setProtocol(e.target.value)} 
                    className="w-full glass-input text-xs"
                  >
                    <option value="ANY">ANY</option>
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="ICMP">ICMP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Destination Ports</label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="Any, or 80,443"
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold transition"
                >
                  Commit Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
