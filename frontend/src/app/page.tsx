'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <main className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 mt-4">
        Connecting SecOps...
      </span>
    </main>
  );
}
