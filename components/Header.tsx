'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 환경 변수가 제대로 주입되지 않았거나 플레이스홀더인 경우 에러 방지
    if (!url || !key || url.includes('YOUR_') || key.includes('YOUR_')) {
      console.warn('Supabase 환경 변수가 아직 설정되지 않았거나 로드되지 않았습니다. .env.local 설정 후 npm run dev를 재시작해 주세요.');
      return;
    }

    try {
      const supabase = createClient();

      // 초기 세션 정보 확인
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
      });

      // 인증 상태 변화 모니터링
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (e) {
      console.error('Supabase 클라이언트 초기화 중 오류 발생:', e);
    }
  }, []);

  const tabs = [
    { label: '여행', href: '/' },
    { label: '추천', href: '#', badge: 'AI' },
    { label: '테마', href: '#' },
    { label: '지역', href: '/trip' },
    { label: '관광주민증', href: '#' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-900">
      {/* Top brand */}
      <div className="flex items-center justify-between px-5 h-14">
        <Link href="/">
          <h1 className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
            다다 트립 <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">Dada Trip</span>
          </h1>
        </Link>

        {/* 로그인 상태에 따른 아바타 / 로그인 버튼 표시 */}
        <div className="flex items-center">
          {user ? (
            <Link
              href="/mypage"
              className="relative w-7 h-7 rounded-full overflow-hidden border border-blue-500/10 hover:border-blue-500 transition-colors shrink-0 bg-zinc-100 dark:bg-zinc-800"
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata?.full_name || '프로필'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                  {user.user_metadata?.full_name?.charAt(0) || 'U'}
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-[12px] font-bold text-gray-600 hover:text-blue-600 dark:text-zinc-350 dark:hover:text-blue-400 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800/50 transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </div>

    </header>
  );
}
