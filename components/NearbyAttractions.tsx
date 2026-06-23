'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Loader2 } from 'lucide-react';
import { TourItem } from '@/lib/api';
import AttractionCard from '@/components/AttractionCard';
import CardSkeleton from '@/components/CardSkeleton';

// 서울 기준 좌표 (기본 폴백)
const SEOUL_COORDS = {
  lat: 37.579617,
  lng: 126.9770162,
};

export default function NearbyAttractions() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [items, setItems] = useState<TourItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isInfiniteScroll, setIsInfiniteScroll] = useState<boolean>(false);

  const observerTarget = useRef<HTMLDivElement>(null);

  // 위치 정보 가져오기
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const handleSuccess = (position: GeolocationPosition) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      };

      const handleError = () => {
        console.warn('Geolocation permission denied or timed out. Falling back to Seoul.');
        setCoords(SEOUL_COORDS);
        setLocationError(true);
        setLocationLoading(false);
      };

      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000,
      });
    } else {
      console.warn('Geolocation is not supported by this browser. Falling back to Seoul.');
      setCoords(SEOUL_COORDS);
      setLocationLoading(false);
    }
  }, []);

  // 관광지 데이터 페칭
  const fetchNearby = useCallback(async (currentCoords: { lat: number; lng: number }, pageNum: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/attractions?type=nearby&mapX=${currentCoords.lng}&mapY=${currentCoords.lat}&limit=20&page=${pageNum}`
      );
      if (!res.ok) throw new Error('Failed to fetch attractions');

      const data: { items: TourItem[]; totalCount: number } = await res.json();
      const newItemsList = data.items || [];

      if (newItemsList.length < 20) {
        setHasMore(false);
      }

      setItems((prev) => {
        // 중복 방지 병합
        const existingIds = new Set(prev.map(i => i.contentid));
        const newItems = newItemsList.filter(item => !existingIds.has(item.contentid));
        const combined = [...prev, ...newItems];
        // 거리 기준 오름차순 명시적 정렬 추가
        return combined.sort((a, b) => {
          const distA = a.dist ? parseFloat(a.dist) : Infinity;
          const distB = b.dist ? parseFloat(b.dist) : Infinity;
          return distA - distB;
        });
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 좌표 갱신되거나 페이지 변경 시 데이터 호출
  useEffect(() => {
    if (coords) {
      fetchNearby(coords, page);
    }
  }, [coords, page, fetchNearby]);

  // 무한 스크롤 관찰자 설정 (Intersection Observer)
  useEffect(() => {
    if (!isInfiniteScroll || !hasMore || isLoading || !coords) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [isInfiniteScroll, hasMore, isLoading, coords]);

  // 더보기 버튼 누를 때
  const handleLoadMore = () => {
    setIsInfiniteScroll(true);
    setPage((prev) => prev + 1);
  };

  // 거리 포맷팅 헬퍼
  const formatDistance = (distStr?: string) => {
    if (!distStr) return '';
    const meters = parseFloat(distStr);
    if (isNaN(meters)) return '';
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${Math.round(meters)}m`;
  };

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1548115184-bc6544d06a58';
    return url.startsWith('http://') ? url.replace('http://', 'https://') : url;
  };

  // 1. 위치 정보 로딩 상태 UI (스켈레톤)
  if (locationLoading) {
    return (
      <div className="flex flex-col gap-3 px-5 py-4">
        <div className="h-6 w-32 bg-gray-200 dark:bg-zinc-800 rounded-md animate-pulse" />
        <div className="grid grid-cols-2 gap-4 mt-2">
          {[1, 2, 3, 4].map((n) => (
            <CardSkeleton key={n} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 타이틀 및 상태 */}
      <div className="px-5 flex flex-col gap-1">
        <div className="flex justify-between items-baseline">
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-zinc-50">내주변 여행지</h2>
          {locationError && (
            <span className="text-[10px] text-amber-500 font-medium">
              *위치 권한 미허용: 서울 기준
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 dark:text-zinc-500">
          {locationError ? '서울 종로 기준 가까운 여행지를 보여드릴게요 :)' : '현재 위치 주변의 추천 여행지입니다.'}
        </p>
      </div>

      {/* 리스트 그리드 */}
      <div className="grid grid-cols-2 gap-4 px-5">
        {items.map((item) => (
          <AttractionCard
            key={item.contentid}
            item={item}
            addressMode="full"
            showDistance={true}
            showCategory={true}
          />
        ))}

        {/* 첫 로딩 시 스켈레톤 폴백 */}
        {items.length === 0 && isLoading && (
          <>
            {[1, 2, 3, 4].map((n) => (
              <CardSkeleton key={n} />
            ))}
          </>
        )}
      </div>

      {/* 아무 데이터도 없을 때 */}
      {items.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs">
          주변에 추천해 드릴 관광지가 없습니다.
        </div>
      )}

      {/* 무한 스크롤 및 로딩 바 / 더보기 버튼 */}
      {hasMore && items.length > 0 && (
        <div className="px-5 mt-2 mb-6 flex justify-center w-full">
          {isInfiniteScroll ? (
            <div ref={observerTarget} className="flex justify-center items-center py-3 w-full gap-2 text-xs text-gray-400">
              {isLoading && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>관광지 추가 로드 중...</span>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-zinc-900 dark:hover:bg-zinc-850 dark:active:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  로딩 중...
                </>
              ) : (
                '더보기'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
