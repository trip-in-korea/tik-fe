'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const errorParam = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    errorParam === 'auth_failed' ? '로그인 처리에 실패했습니다. 다시 시도해 주세요.' : null
  );

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      console.error('Google login initiation failed:', error);
      setErrorMsg(error.message || '구글 로그인 연결에 실패했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 px-6 justify-between py-10 min-h-[80vh]">
      {/* 상단 네비게이션 및 로고 */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center">
          <Link
            href="/"
            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-850 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-zinc-200" />
          </Link>
        </div>

        <div className="flex flex-col gap-2 mt-4 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
            다다 트립
          </h1>
          <p className="text-xs font-semibold text-gray-400 dark:text-zinc-550 uppercase tracking-widest">
            Dada Trip
          </p>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
            구글 계정으로 쉽고 빠르게 로그인하고<br />
            나만의 맞춤 국내 여행 정보를 관리해보세요!
          </p>
        </div>
      </div>

      {/* 로그인 버튼 영역 */}
      <div className="flex flex-col gap-6 w-full max-w-sm mx-auto mb-12">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-xs font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3.5 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 border border-gray-200 dark:border-zinc-800 py-3.5 px-4 rounded-2xl font-bold text-sm shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-zinc-850 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
          )}
          <span>Google 계정으로 계속하기</span>
        </button>

        <p className="text-[10px] text-gray-400 dark:text-zinc-550 text-center leading-relaxed">
          로그인 시 다다 트립의 서비스 이용약관 및 개인정보 처리방침에<br />
          동의한 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 font-sans min-h-screen">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-400 font-semibold">로그인 페이지 로딩 중...</span>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
