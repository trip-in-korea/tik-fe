import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import NearbyAttractions from '@/components/NearbyAttractions';
import { getPopularAttractions } from '@/lib/api';
import { Sparkles, ArrowRight, MapPin } from 'lucide-react';

// Next.js ISR (Incremental Static Regeneration) - Revalidate at midnight using today's date in keyParts
// Also we set a route level revalidation of 24 hours as a fallback.
export const revalidate = 86400;

export default async function Home() {
  // 상단 배너용 인기 관광지 4개 로드
  const attractions = await getPopularAttractions(4);

  // 배너 아이템
  const bannerItems = attractions.slice(0, 4);

  // 기본 이미지 맵핑 헬퍼
  const getImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1548115184-bc6544d06a58'; // 임의의 기본 이미지

    // http:// 로 시작하는 주소가 있다면 https:// 로 강제 치환
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }

    return url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60';
  };

  console.log("공가 API 데이터 결과:", JSON.stringify(attractions, null, 2));

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 font-sans">
      {/* 탭 메뉴 및 로그인 배너가 포함된 헤더 */}
      <Header />

      <main className="flex-1 flex flex-col gap-8 pt-4">
        {/* 1. 히어로 배너 슬라이드 (3:4 비율 적용) */}
        <div className="flex flex-col gap-3">
          <div className="px-5 flex justify-between items-center">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              지금 뜨는 인기 여행지
            </h2>
          </div>

          <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory px-5 py-2">
            {bannerItems.length > 0 ? (
              bannerItems.map((item, index) => (
                <Link
                  key={item.contentid}
                  href={`/trip/${item.contentid}`}
                  className="w-[85%] shrink-0 snap-center rounded-2xl overflow-hidden shadow-md relative aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 transition-transform active:scale-[0.98] group"
                >
                  <Image
                    src={getImageUrl(item.firstimage) || '/images/no_photo.jpg'}
                    alt={item.title}
                    fill
                    sizes="(max-w-md) 100vw, 400px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    priority={index === 0}
                    unoptimized
                  />
                  {/* 그라데이션 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex flex-col justify-end p-5 text-white">
                    <span className="bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-2">
                      인기 추천
                    </span>
                    <h3 className="text-xl font-bold leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-300 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                      {item.addr1 || '대한민국 관광지'}
                    </p>
                  </div>
                  {/* 페이지 인덱스 배너 */}
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
                    {index + 1} / {bannerItems.length}
                  </div>
                </Link>
              ))
            ) : (
              <div className="w-full text-center py-12 text-gray-400 dark:text-zinc-500">
                추천 데이터를 불러올 수 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 3. 간단한 광고/홍보 배너 (디자인 디테일 추가 필요) */}
        <div className="px-5">
          <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white flex flex-col gap-1 shadow-sm relative overflow-hidden">
            <span className="text-[10px] font-bold text-blue-200 tracking-wider uppercase">
              캠페인
            </span>
            <h3 className="text-base font-bold">소도시 여행 활성화 버킷리스트</h3>
            <p className="text-xs text-blue-100">
              다다트립과 함께 매력 넘치는 지방 소도시로 떠나보세요!
            </p>
            <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-white/10 rounded-full blur-xl" />
          </div>
        </div>

        {/* 2. 내주변 여행지 (Geolocation 기반 클라이언트 컴포넌트) */}
        <NearbyAttractions />

        {/* 4. 푸터 영역 */}
        <footer className="mt-8 px-5 py-6 bg-zinc-100 dark:bg-zinc-900/40 text-gray-400 dark:text-zinc-500 border-t border-zinc-200/50 dark:border-zinc-800/50 text-[11px] leading-relaxed flex flex-col gap-2.5">
          <div className="flex flex-col gap-0.5">
            <p className="font-bold text-gray-600 dark:text-zinc-400 text-xs">다다트립 (Dada Trip)</p>
            <p>이메일 문의: <a href="mailto:dada4dev@gmail.com" className="underline hover:text-gray-600 dark:hover:text-zinc-300">dada4dev@gmail.com</a></p>
          </div>
          <p className="mt-0.5 text-gray-400 dark:text-zinc-500">
            본 서비스는 한국관광콘텐츠랩 및 공공데이터포털에서 제공하는 한국관광공사 TourAPI 공공데이터를 활용하여 정보를 제공하고 있습니다.
          </p>
          <p className="text-[9px] text-gray-300 dark:text-zinc-600 mt-1.5">
            © 2026 Dada Trip. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
