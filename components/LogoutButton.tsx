'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    setIsPending(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="w-full flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-red-50/20 active:bg-red-100/30 hover:border-red-200 dark:hover:border-red-950/30 hover:text-red-600 dark:hover:text-red-400 text-gray-700 dark:text-zinc-350 py-3.5 px-4 rounded-2xl font-bold text-sm shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
    >
      <LogOut className="w-4 h-4 shrink-0" strokeWidth={2.2} />
      <span>{isPending ? '로그아웃 중...' : '로그아웃'}</span>
    </button>
  );
}
