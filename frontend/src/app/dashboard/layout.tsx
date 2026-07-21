'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../../components/Sidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-sm font-medium text-slate-400 mt-4">Initializing Security Console...</span>
      </div>
    );
  }

  if (!user) {
    return null; // Let useEffect redirect
  }

  return (
    <div className="min-h-screen bg-[#070a13]">
      <Sidebar />
      <div className="pl-64 min-h-screen flex flex-col">
        <main className="flex-1 p-8 w-full max-w-(--size-desktop) mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
