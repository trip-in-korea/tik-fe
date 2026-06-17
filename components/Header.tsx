'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

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
        <h1 className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
          다다 트립 <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">Dada Trip</span>
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-50 dark:border-zinc-900/50 overflow-x-auto scrollbar-none px-4">
        {tabs.map((tab) => {
          const isActive =
            (tab.href === '/' && pathname === '/') ||
            (tab.href !== '/' && tab.href !== '#' && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`relative py-3 px-3 text-[14px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${isActive
                  ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                  : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
                }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="bg-blue-600 text-white text-[8px] font-bold px-1 py-0.5 rounded-sm uppercase tracking-wide">
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

    </header>
  );
}
