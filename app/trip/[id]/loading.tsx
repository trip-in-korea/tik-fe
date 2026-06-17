import CardSkeleton from '@/components/CardSkeleton';

export default function TripDetailLoading() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 font-sans pb-20">
      {/* 1. 히어로 커버 이미지 스켈레톤 (1:1 비율) */}
      <div className="relative w-full aspect-square bg-gray-200 dark:bg-zinc-800 animate-pulse">
        {/* 상단 액션 바 */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <div className="w-10 h-10 bg-black/20 dark:bg-zinc-900/40 rounded-full backdrop-blur-md" />
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-black/20 dark:bg-zinc-900/40 rounded-full backdrop-blur-md" />
            <div className="w-10 h-10 bg-black/20 dark:bg-zinc-900/40 rounded-full backdrop-blur-md" />
          </div>
        </div>
        
        {/* 텍스트 그라데이션 오버레이 뼈대 */}
        <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-2">
          <div className="h-5 w-16 bg-white/30 dark:bg-zinc-700/50 rounded-full" />
          <div className="h-7 w-2/3 bg-white/30 dark:bg-zinc-700/50 rounded-md" />
        </div>
      </div>

      {/* 2. 상세 정보 내용 */}
      <main className="px-5 py-6 flex flex-col gap-6">
        {/* 설명 섹션 */}
        <div className="flex flex-col gap-2">
          {/* 상세 설명 타이틀 */}
          <div className="h-5 w-24 bg-gray-200 dark:bg-zinc-800 rounded-md animate-pulse" />
          {/* 설명 텍스트 뼈대 */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="h-3.5 w-full bg-gray-150 dark:bg-zinc-900 rounded-md animate-pulse" />
            <div className="h-3.5 w-full bg-gray-150 dark:bg-zinc-900 rounded-md animate-pulse" />
            <div className="h-3.5 w-4/5 bg-gray-150 dark:bg-zinc-900 rounded-md animate-pulse" />
          </div>
        </div>

        {/* 상세 안내 표 */}
        <div className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-zinc-900">
          <div className="h-4 w-20 bg-gray-200 dark:bg-zinc-850 rounded-md animate-pulse pb-1" />

          {/* 주소 */}
          <div className="flex justify-between items-center gap-4">
            <div className="h-3.5 w-10 bg-gray-200 dark:bg-zinc-850 rounded-md animate-pulse" />
            <div className="h-3.5 w-40 bg-gray-150 dark:bg-zinc-900 rounded-md animate-pulse" />
          </div>

          {/* 문의처 */}
          <div className="flex justify-between items-center gap-4 pt-1 border-t border-gray-100/50 dark:border-zinc-900/10">
            <div className="h-3.5 w-10 bg-gray-200 dark:bg-zinc-850 rounded-md animate-pulse" />
            <div className="h-3.5 w-32 bg-gray-150 dark:bg-zinc-900 rounded-md animate-pulse" />
          </div>

          {/* 이용시간 */}
          <div className="flex justify-between items-center gap-4 pt-1 border-t border-gray-100/50 dark:border-zinc-900/10">
            <div className="h-3.5 w-12 bg-gray-200 dark:bg-zinc-850 rounded-md animate-pulse" />
            <div className="h-3.5 w-36 bg-gray-150 dark:bg-zinc-900 rounded-md animate-pulse" />
          </div>

          {/* 휴무일 */}
          <div className="flex justify-between items-center gap-4 pt-1 border-t border-gray-100/50 dark:border-zinc-900/10">
            <div className="h-3.5 w-10 bg-gray-200 dark:bg-zinc-850 rounded-md animate-pulse" />
            <div className="h-3.5 w-24 bg-gray-150 dark:bg-zinc-900 rounded-md animate-pulse" />
          </div>
        </div>

        {/* 3. 주변 추천 여행지 (가로 횡스크롤) */}
        <div className="flex flex-col gap-3 mt-2">
          {/* 타이틀 */}
          <div className="h-5 w-44 bg-gray-200 dark:bg-zinc-800 rounded-md animate-pulse" />
          
          {/* 횡스크롤 슬라이더 */}
          <div className="flex gap-4 overflow-x-auto scrollbar-none py-1">
            {[1, 2, 3, 4].map((n) => (
              <CardSkeleton key={n} className="w-28 shrink-0" />
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="h-12 w-full bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse mt-4" />
      </main>
    </div>
  );
}
