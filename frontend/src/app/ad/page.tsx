'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Lock, 
  Unlock, 
  KeyRound, 
  ShieldAlert,
  Loader2,
  Database
} from 'lucide-react';

interface ADUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  department: string;
  status: 'Active' | 'Locked';
  loginAttempts: number;
}

export default function ActiveDirectoryPage() {
  const { hasRole } = useAuth();
  const [adUsers, setAdUsers] = useState<ADUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add User Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Firewall Engineer' | 'System Support Engineer' | 'Network Engineer' | 'Security Engineer' | 'Employee' | 'HR' | 'Manager'>('Employee');
  const [department, setDepartment] = useState('Human Resources');

  // Reset Password States
  const [selectedResetUser, setSelectedResetUser] = useState<ADUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.ad.listUsers();
      setAdUsers(data);
    } catch (err) {
      console.error('Failed to load AD users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !email || !password || !department) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await api.ad.createUser({
        username,
        email,
        password,
        role,
        department
      });
      setShowAddModal(false);
      // Reset
      setUsername('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create Active Directory account.');
    }
  };

  const handleUnlock = async (id: string) => {
    try {
      await api.ad.unlockUser(id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Unlock request failed.');
    }
  };

  const handleLock = async (id: string) => {
    try {
      await api.ad.lockUser(id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Lock request failed.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResetUser || !newPassword) return;

    try {
      await api.ad.resetPassword(selectedResetUser._id, newPassword);
      setSelectedResetUser(null);
      setNewPassword('');
      alert(`Password for ${selectedResetUser.username} successfully reset in Active Directory.`);
    } catch (err: any) {
      alert(err.message || 'Password reset request failed.');
    }
  };

  const isTechnician = hasRole(['Admin', 'System Support Engineer']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Active Directory Domain Controller</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage domain users, lock/unlock credential status, and reset security keys</p>
        </div>
        {isTechnician && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition border border-indigo-500 shadow-md shadow-indigo-950/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create AD Account</span>
          </button>
        )}
      </div>

      {/* Main List */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Domain Controller Accounts Index</h3>
          <Database className="w-4 h-4 text-slate-500" />
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
                  <th className="p-3">USERNAME</th>
                  <th className="p-3">EMAIL ADDRESS</th>
                  <th className="p-3">ORGANIZATIONAL UNIT (DEPT)</th>
                  <th className="p-3">ROLE / ACL</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3 font-mono text-center">BAD ATTEMPTS</th>
                  {isTechnician && <th className="p-3 text-center">CONTROLS</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {adUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-200">{user.username}</td>
                    <td className="p-3 text-slate-400 font-mono">{user.email}</td>
                    <td className="p-3 text-slate-300">{user.department}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-900/60 text-indigo-400 text-[10px] font-semibold uppercase tracking-wider font-mono">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${user.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-450">{user.loginAttempts}</td>
                    {isTechnician && (
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          {user.status === 'Locked' ? (
                            <button
                              onClick={() => handleUnlock(user._id)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950/20 hover:bg-emerald-950/50 border border-emerald-900 text-emerald-400 rounded text-[10px] font-bold transition"
                              title="Unlock Account"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Unlock</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLock(user._id)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/20 hover:bg-rose-950/50 border border-rose-900 text-rose-400 rounded text-[10px] font-bold transition"
                              title="Lock Account"
                              disabled={user.username === 'admin'} // don't lock admin
                            >
                              <Lock className="w-3 h-3" />
                              <span>Lock</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedResetUser(user)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-[10px] font-bold transition"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Reset Pw</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 mb-4 text-indigo-400">
              <UserPlus className="w-5 h-5" />
              <h2 className="text-md font-bold text-white">Provision Active Directory Account</h2>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/20 text-rose-300 rounded text-xs mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Username (sAMAccountName)</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. jsmith"
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">User Principal Name (Email)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. jsmith@eimp.enterprise"
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password123!"
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Security Role</label>
                  <select 
                    value={role} 
                    onChange={(e: any) => setRole(e.target.value)} 
                    className="w-full glass-input text-xs"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                    <option value="Firewall Engineer">Firewall Engineer</option>
                    <option value="System Support Engineer">System Support Engineer</option>
                    <option value="Network Engineer">Network Engineer</option>
                    <option value="Security Engineer">Security Engineer</option>
                    <option value="HR">HR</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Organizational Unit (OU)</label>
                  <select 
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)} 
                    className="w-full glass-input text-xs"
                  >
                    <option value="IT Administration">IT Administration</option>
                    <option value="Information Security">Information Security</option>
                    <option value="Network Operations">Network Operations</option>
                    <option value="IT Helpdesk">IT Helpdesk</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
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
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {selectedResetUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6 rounded-xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 mb-4 text-indigo-400">
              <ShieldAlert className="w-5 h-5" />
              <h2 className="text-md font-bold text-white">Reset Account Password</h2>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Reset domain user password for <strong className="text-slate-200 font-semibold">{selectedResetUser.username}</strong> in the AD LDAP database.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">New Domain Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="NewPassword123!"
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedResetUser(null)}
                  className="px-4 py-2 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold transition"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
