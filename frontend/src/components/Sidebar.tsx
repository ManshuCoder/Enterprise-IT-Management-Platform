'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Network, 
  Users, 
  Ticket, 
  Link2, 
  Radio, 
  FileText, 
  LogOut, 
  Terminal,
  Server
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Firewall Manager', path: '/firewall', icon: ShieldAlert },
  { name: 'Network Topology', path: '/topology', icon: Network },
  { name: 'Active Directory', path: '/ad', icon: Users },
  { name: 'Helpdesk Tickets', path: '/tickets', icon: Ticket },
  { name: 'VPN Connections', path: '/vpn', icon: Link2 },
  { name: 'Security Center', path: '/security', icon: Radio },
  { name: 'Audit Logs', path: '/audit', icon: FileText }
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="w-64 glass-panel h-screen fixed left-0 top-0 flex flex-col justify-between p-4 z-40 border-r border-slate-800">
      <div>
        {/* Header Branding */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Server className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white">EIMP</h1>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Security Portal</span>
          </div>
        </div>

        {/* User Card */}
        <div className="mb-6 p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/20">
            {user.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-semibold text-slate-200 truncate">{user.username}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] text-slate-400 truncate font-mono uppercase">{user.role}</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                  isActive 
                    ? 'bg-indigo-600/25 text-white border-l-2 border-indigo-500 shadow-md shadow-indigo-950/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Log out */}
      <div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-all duration-200 border border-transparent hover:border-rose-900/30"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-semibold">Disconnect Portal</span>
        </button>
        <div className="mt-4 text-[10px] font-mono text-slate-600 text-center uppercase tracking-wider">
          v1.0.0-PROD // COMPLIANT
        </div>
      </div>
    </div>
  );
};
