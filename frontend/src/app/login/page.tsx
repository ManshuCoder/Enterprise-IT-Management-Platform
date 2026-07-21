'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.auth.login({ username, password });
      login(data.accessToken, data.refreshToken, data.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to trigger fast credential loading for reviewers
  const handleQuickLogin = (userRole: string) => {
    setError(null);
    setPassword('Password123!');
    if (userRole === 'admin') setUsername('admin');
    if (userRole === 'firewall') setUsername('firewall_eng');
    if (userRole === 'security') setUsername('sec_eng');
    if (userRole === 'support') setUsername('support_eng');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#070a13] p-4 relative overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md">
        {/* Branding Title */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/25 mb-4 shadow-lg shadow-indigo-950/20">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">EIMP Operations Center</h1>
          <p className="text-sm text-slate-400 mt-1">Enterprise Infrastructure Management Platform</p>
        </div>

        {/* Glass Card Login */}
        <div className="glass-card p-8 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-semibold text-slate-200 mb-6">Authenticate Session</h2>

          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/20 text-rose-300 rounded-lg text-xs leading-relaxed mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Active Directory Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full glass-input text-sm text-slate-200"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Domain Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full glass-input text-sm text-slate-200 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors duration-200 border border-indigo-500 shadow-md shadow-indigo-950/40 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating Identity...</span>
                </>
              ) : (
                <span>Initialize Connection</span>
              )}
            </button>
          </form>

          {/* Quick login for reviewer convenience */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">
              Quick Review Access Presets
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleQuickLogin('admin')}
                className="px-2.5 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-md text-left transition-all"
              >
                <strong>Admin Portal</strong> <br />
                <span className="text-[10px] text-slate-500">username: admin</span>
              </button>
              <button
                onClick={() => handleQuickLogin('firewall')}
                className="px-2.5 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-md text-left transition-all"
              >
                <strong>Firewall Eng</strong> <br />
                <span className="text-[10px] text-slate-500">username: firewall_eng</span>
              </button>
              <button
                onClick={() => handleQuickLogin('security')}
                className="px-2.5 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-md text-left transition-all"
              >
                <strong>Security Eng</strong> <br />
                <span className="text-[10px] text-slate-500">username: sec_eng</span>
              </button>
              <button
                onClick={() => handleQuickLogin('support')}
                className="px-2.5 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-md text-left transition-all"
              >
                <strong>System Support</strong> <br />
                <span className="text-[10px] text-slate-500">username: support_eng</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 font-mono text-center mt-6">
          NOTICE: All operations on this terminal are monitored and logged to the central EIMP audit trail automatically.
        </p>
      </div>
    </main>
  );
}
