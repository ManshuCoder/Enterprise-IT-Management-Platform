'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Ticket as TicketIcon, 
  Plus, 
  MessageSquare, 
  ArrowUpCircle, 
  CheckCircle, 
  User, 
  Calendar,
  AlertCircle,
  FileText,
  BadgeAlert
} from 'lucide-react';

interface TicketComment {
  sender: string;
  message: string;
  timestamp: string;
}

interface TicketTimeline {
  activity: string;
  timestamp: string;
  actor: string;
}

interface Ticket {
  _id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Escalated' | 'Resolved' | 'Closed';
  reporter: string;
  assignee: string;
  category: 'Network' | 'Hardware' | 'Software' | 'Firewall' | 'Access Control' | 'Other';
  comments: TicketComment[];
  timeline: TicketTimeline[];
  createdAt: string;
}

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Create Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [category, setCategory] = useState<'Network' | 'Hardware' | 'Software' | 'Firewall' | 'Access Control' | 'Other'>('Other');
  
  // Comment State
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const list = await api.tickets.list();
      setTickets(list);
      // Keep selected ticket in sync
      if (selectedTicket) {
        const match = list.find((t: any) => t._id === selectedTicket._id);
        if (match) setSelectedTicket(match);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    try {
      await api.tickets.create({
        title,
        description,
        priority,
        category
      });
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to raise ticket.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTicket) return;

    try {
      await api.tickets.addComment(selectedTicket._id, commentText);
      setCommentText('');
      fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to submit comment response.');
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedTicket || !user) return;
    try {
      await api.tickets.update(selectedTicket._id, {
        assignee: user.username,
        status: 'In Progress'
      });
      fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to assign ticket.');
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      await api.tickets.update(selectedTicket._id, {
        status: 'Closed'
      });
      fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to close ticket.');
    }
  };

  const handleEscalate = async () => {
    if (!selectedTicket) return;
    try {
      await api.tickets.escalate(selectedTicket._id);
      fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Escalation failed.');
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Critical': return 'bg-rose-500/10 text-rose-400 border-rose-900/30';
      case 'High': return 'bg-orange-500/10 text-orange-400 border-orange-900/30';
      case 'Medium': return 'bg-amber-500/10 text-amber-400 border-amber-900/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-900/30';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Closed':
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-900/30';
      case 'Escalated': return 'bg-rose-500/10 text-rose-450 border-rose-900/30 animate-pulse';
      case 'In Progress': return 'bg-indigo-500/10 text-indigo-400 border-indigo-900/30';
      default: return 'bg-cyan-500/10 text-cyan-400 border-cyan-905/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">IT Operations Helpdesk</h1>
          <p className="text-slate-400 text-sm mt-0.5">Submit support incident reports, assign technician queues, and trigger escalations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition border border-indigo-500 shadow-md shadow-indigo-950/20"
        >
          <Plus className="w-4 h-4" />
          <span>Open Ticket</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ticket List Queue */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 xl:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Incident Tickets Queue</h3>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => setSelectedTicket(t)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedTicket?._id === t._id
                    ? 'bg-indigo-950/25 border-indigo-500 shadow-md shadow-indigo-950/20'
                    : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 hover:bg-slate-900/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                      #{t._id.slice(-6)}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-200">{t.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getPriorityColor(t.priority)}`}>
                      {t.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">{t.description}</p>

                <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 border-t border-slate-900/60 pt-2 font-mono">
                  <div className="flex gap-4">
                    <span>REPORTER: <strong className="text-slate-400 font-semibold">{t.reporter}</strong></span>
                    <span>ASSIGNEE: <strong className="text-slate-450 font-semibold">{t.assignee}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 sm:mt-0">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Ticket Thread Panel */}
        <div className="space-y-6">
          {selectedTicket ? (
            <div className="glass-card p-5 rounded-xl border border-slate-800 flex flex-col justify-between min-h-[500px]">
              <div>
                {/* Panel Header */}
                <div className="border-b border-slate-850 pb-4 mb-4">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span>INCIDENT REPORT #{selectedTicket._id.slice(-6)}</span>
                    <span className="bg-slate-900 px-1.5 py-0.5 rounded uppercase">{selectedTicket.category}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">{selectedTicket.title}</h3>
                  <p className="text-xs text-slate-450 mt-2 leading-relaxed bg-black/25 p-3 rounded border border-slate-900">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Operations quick actions */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-850 pb-4">
                  {selectedTicket.status !== 'Closed' && selectedTicket.assignee !== user?.username && (
                    <button
                      onClick={handleAssignToMe}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition border border-indigo-500"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Take Ownership</span>
                    </button>
                  )}
                  {selectedTicket.status !== 'Escalated' && selectedTicket.status !== 'Closed' && (
                    <button
                      onClick={handleEscalate}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/20 hover:bg-rose-950/50 border border-rose-900/60 text-rose-450 rounded text-[10px] font-bold transition"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      <span>Escalate Tier 2</span>
                    </button>
                  )}
                  {selectedTicket.status !== 'Closed' && (
                    <button
                      onClick={handleCloseTicket}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/20 hover:bg-emerald-950/50 border border-emerald-900/60 text-emerald-450 rounded text-[10px] font-bold transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Close Incident</span>
                    </button>
                  )}
                </div>

                {/* Response Logs Thread */}
                <div className="space-y-4 max-h-[220px] overflow-y-auto mb-4 pr-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Technician logs & replies</span>
                  {selectedTicket.comments.length === 0 ? (
                    <div className="text-center text-slate-600 text-xs py-4">No comments posted yet.</div>
                  ) : (
                    selectedTicket.comments.map((c, i) => (
                      <div key={i} className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                          <span className="font-bold text-slate-350">{c.sender}</span>
                          <span>{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{c.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== 'Closed' && (
                <form onSubmit={handleAddComment} className="flex gap-2 border-t border-slate-850 pt-4 mt-auto">
                  <input
                    type="text"
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Submit reply query..."
                    className="flex-1 bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition border border-indigo-500"
                  >
                    Reply
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="glass-card p-6 rounded-xl border border-slate-800 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
              <AlertCircle className="w-6 h-6 text-slate-650" />
              <span>Select any support ticket from the active queue to view incident parameters, reply threads, and trigger engineering escalations.</span>
            </div>
          )}
        </div>
      </div>

      {/* Add Ticket Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 mb-4 text-indigo-400">
              <TicketIcon className="w-5 h-5" />
              <h2 className="text-md font-bold text-white">Raise Support Incident Ticket</h2>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Ticket Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. VLAN 20 Latency spikes Building B"
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide system hardware, error messages, and network status details"
                  className="w-full glass-input text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Incident Priority</label>
                  <select 
                    value={priority} 
                    onChange={(e: any) => setPriority(e.target.value)} 
                    className="w-full glass-input text-xs"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Asset Category</label>
                  <select 
                    value={category} 
                    onChange={(e: any) => setCategory(e.target.value)} 
                    className="w-full glass-input text-xs"
                  >
                    <option value="Other">Other</option>
                    <option value="Network">Network</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Firewall">Firewall</option>
                    <option value="Access Control">Access Control</option>
                  </select>
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
                  Raise Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
