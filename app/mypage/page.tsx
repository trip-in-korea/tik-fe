import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, MessageSquare, Bell, Headset, ChevronRight } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // 비로그인 상태인 경우 로그인 페이지로 리다이렉트
  if (error || !user) {
    redirect('/login?next=/mypage');
  }

  const profileName = user.user_metadata?.full_name || user.user_metadata?.name || '여행자';
  const profileImage = user.user_metadata?.avatar_url || null;
  const profileEmail = user.email || '';

  const menuItems = [
    { label: '나의 보관함 (좋아요)', icon: Heart, href: '#' },
    { label: '내가 작성한 후기', icon: MessageSquare, href: '#' },
    { label: '알림 설정', icon: Bell, href: '#' },
    { label: '고객센터', icon: Headset, href: '#' },
  ];

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 font-sans pb-8 min-h-screen">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md dark:bg-zinc-950/95 border-b border-gray-100 dark:border-zinc-900 px-5 pt-5 pb-3.5 flex items-center gap-3">
        <Link href="/" className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-gray-800 dark:text-zinc-200" strokeWidth={2.2} />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-50 flex-1">마이페이지</h1>
      </div>

      <main className="flex-1 flex flex-col gap-6 pt-4 px-5">
        {/* 프로필 카드 */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/60 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-zinc-150 dark:bg-zinc-800 border-2 border-blue-500/10 shrink-0">
            {profileImage ? (
              <Image
                src={profileImage}
                alt={profileName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <span className="text-xl font-bold">{profileName.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-50 truncate">{profileName}</h2>
            <p className="text-xs text-gray-400 dark:text-zinc-500 truncate mt-0.5">{profileEmail}</p>
          </div>
        </div>

        {/* 대시보드 통계 카드 */}
        <div className="grid grid-cols-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/60 rounded-3xl p-4 shadow-sm text-center">
          <div className="flex flex-col gap-0.5 border-r border-gray-100 dark:border-zinc-800/60">
            <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">다녀온 곳</span>
            <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">0</span>
          </div>
          <div className="flex flex-col gap-0.5 border-r border-gray-100 dark:border-zinc-800/60">
            <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">보관한 여행지</span>
            <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">0</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">작성한 후기</span>
            <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">0</span>
          </div>
        </div>

        {/* 메뉴 리스트 */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/60 rounded-3xl overflow-hidden shadow-sm">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-zinc-850/50 transition-colors ${idx < menuItems.length - 1 ? 'border-b border-gray-100 dark:border-zinc-800/50' : ''
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Icon className="w-[18px] h-[18px]" strokeWidth={2.2} />
                  </div>
                  <span className="text-sm font-bold text-gray-800 dark:text-zinc-200">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-zinc-650" strokeWidth={2.2} />
              </Link>
            );
          })}
        </div>

        {/* 로그아웃 버튼 */}
        <div className="mt-4">
          <LogoutButton />
        </div>
      </main>
    </div>
  );
}
