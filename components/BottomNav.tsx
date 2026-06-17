'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, Calendar, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: '홈', icon: Home, href: '/' },
    { label: '여행지', icon: Map, href: '/trip' },
    { label: '축제', icon: Calendar, href: '/festival' },
    { label: '마이페이지', icon: User, href: '/mypage' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-t border-gray-100 dark:bg-zinc-950/85 dark:border-zinc-800">
      <div className="max-w-[480px] mx-auto flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${isActive
                ? 'text-blue-600 dark:text-blue-400 font-medium'
                : 'text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
