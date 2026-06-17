'use client';

interface CardSkeletonProps {
  className?: string;
}

export default function CardSkeleton({ className = '' }: CardSkeletonProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* 3:4 비율 이미지 스켈레톤 */}
      <div className="relative aspect-[3/4] w-full rounded-xl bg-gray-200 dark:bg-zinc-800 animate-pulse shrink-0" />
      
      {/* 텍스트 영역 스켈레톤 */}
      <div className="flex flex-col px-1 items-start gap-1">
        {/* 제목 */}
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-zinc-850 rounded-md animate-pulse" />
        {/* 주소 */}
        <div className="h-3 w-1/2 bg-gray-150 dark:bg-zinc-900 rounded-md animate-pulse mt-0.5" />
        {/* 카테고리 태그 뱃지 */}
        <div className="h-5 w-12 bg-gray-100 dark:bg-zinc-900 rounded-md animate-pulse mt-1.5" />
      </div>
    </div>
  );
}

