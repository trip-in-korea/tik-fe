'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Search, Loader2, SlidersHorizontal, X, MapPin } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { TourItem } from '@/lib/api';
import AttractionCard from '@/components/AttractionCard';
import CardSkeleton from '@/components/CardSkeleton';

const AREAS = [
  { label: '전체', code: '' },
  { label: '서울', code: '1' },
  { label: '경기', code: '31' },
  { label: '강원', code: '32' },
  { label: '제주', code: '39' },
  { label: '부산', code: '6' },
  { label: '경북', code: '35' },
  { label: '전남', code: '38' },
];

const CATEGORIES = [
  { label: '전체', code: '' },
  { label: '관광지', code: '12' },
  { label: '음식점', code: '39' },
  { label: '축제/행사', code: '15' },
  { label: '문화시설', code: '14' },
  { label: '레포츠', code: '28' },
  { label: '쇼핑', code: '38' },
  { label: '숙박', code: '32' },
];

export default function TripList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // 기본값: 전체
  const [sortBy, setSortBy] = useState<'distance' | 'popularity' | 'title' | 'newest'>('popularity');
  const [page, setPage] = useState<number>(1);
  const [items, setItems] = useState<TourItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 검색 관련 상태 분리 (입력 상태와 실제 적용 키워드 상태)
  const [searchInput, setSearchInput] = useState<string>('');
  const [appliedKeyword, setAppliedKeyword] = useState<string>('');

  // 필터 모달 관련 상태
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [tempArea, setTempArea] = useState<string>('');
  const [tempCategory, setTempCategory] = useState<string>('');

  // 스크롤 방향 감지 상태 (필터 칩 Show/Hide 인터랙션용)
  const [showFilterChips, setShowFilterChips] = useState<boolean>(true);
  const lastScrollY = useRef<number>(0);
  const transitionLock = useRef<boolean>(false);

  // 위치 탐색 및 기본 정렬 설정
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          // URL 파라미터에 명시적인 sort 기준이 없을 때만 거리순으로 변경
          if (!searchParams.get('sort')) {
            setSortBy('distance');
          }
          setLocationLoading(false);
        },
        () => {
          console.warn('Geolocation permission denied or timed out.');
          setLocationLoading(false);
        },
        { timeout: 5000 }
      );
    } else {
      setLocationLoading(false);
    }
  }, []);

  // 1. 스크롤 방향 감지 리스너 (레이아웃 Bounce 방지용 락 메커니즘 적용)
  useEffect(() => {
    const handleScroll = () => {
      if (transitionLock.current) return;

      const currentScrollY = window.scrollY;
      const prevScrollY = lastScrollY.current;

      // 최상단 근처면 무조건 노출
      if (currentScrollY < 15) {
        setShowFilterChips(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - prevScrollY;

      // 50px 이상의 유의미한 스크롤 동작이 감지되었을 때만 트리거
      if (Math.abs(diff) > 50) {
        if (diff > 0 && showFilterChips) {
          // 아래로 스크롤 시 감춤
          setShowFilterChips(false);
          transitionLock.current = true;
          setTimeout(() => {
            transitionLock.current = false;
          }, 300); // 300ms 동안 재전환 락
        } else if (diff < 0 && !showFilterChips) {
          // 위로 스크롤 시 노출
          setShowFilterChips(true);
          transitionLock.current = true;
          setTimeout(() => {
            transitionLock.current = false;
          }, 300); // 300ms 동안 재전환 락
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showFilterChips]);

  // 2. 마운트 시 URL 쿼리 파라미터로부터 상태 초기화
  useEffect(() => {
    const area = searchParams.get('area') || '';
    const category = searchParams.get('category') || '';
    const keyword = searchParams.get('keyword') || '';
    const pageParam = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const sort = searchParams.get('sort') || 'popularity';

    setSelectedArea(area);
    setSelectedCategory(category);
    setAppliedKeyword(keyword);
    setSearchInput(keyword);
    setPage(pageParam);
    setSortBy(sort as any);
  }, []); // 마운트 시 최초 1회만

  // 3. 상태 변경 시 URL 파라미터 업데이트
  useEffect(() => {
    if (locationLoading) return; // 위치 정보 로딩 완료 전에는 URL 동기화 생략 (최초 덮어쓰기 방지)

    const params = new URLSearchParams();
    if (selectedArea) params.set('area', selectedArea);
    if (selectedCategory) params.set('category', selectedCategory);
    if (appliedKeyword) params.set('keyword', appliedKeyword);
    if (page > 1) params.set('page', String(page));
    if (sortBy !== 'popularity') params.set('sort', sortBy);

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    router.push(url, { scroll: false });
  }, [selectedArea, selectedCategory, appliedKeyword, page, sortBy, locationLoading, pathname, router]);

  // 하버사인 거리 계산 헬퍼
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // 데이터 조회 함수
  const fetchAttractions = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = '';

      // 1. 키워드 검색 적용된 경우 (/searchKeyword2 우선 호출)
      if (appliedKeyword.trim() !== '') {
        url = `/api/attractions?keyword=${encodeURIComponent(appliedKeyword)}&areaCode=${selectedArea}&contentTypeId=${selectedCategory}&limit=20&page=${page}`;
      }
      // 2. 전체 목록이면서 위치 정보가 제공된 경우 (내주변 위치기반 조회)
      else if (selectedArea === '' && coords) {
        url = `/api/attractions?type=nearby&mapX=${coords.lng}&mapY=${coords.lat}&limit=20&page=${page}&contentTypeId=${selectedCategory}`;
      }
      // 3. 그 외의 경우 (지역기반 조회)
      else {
        url = `/api/attractions?type=area&areaCode=${selectedArea}&limit=20&page=${page}&contentTypeId=${selectedCategory}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data: { items: TourItem[]; totalCount: number } = await res.json();
      const rawItems = data.items || [];

      // 사용자 위치가 제공된 경우, 실시간 거리를 직접 연산하여 dist 속성 추가
      const processed = rawItems.map((item) => {
        if (item.dist) return item;
        if (item.mapx && item.mapy && coords) {
          const itemLat = parseFloat(item.mapy);
          const itemLon = parseFloat(item.mapx);
          if (!isNaN(itemLat) && !isNaN(itemLon)) {
            const distMeters = calculateDistance(coords.lat, coords.lng, itemLat, itemLon);
            return {
              ...item,
              dist: String(Math.round(distMeters)),
            };
          }
        }
        return item;
      });

      // 거리순/제목순/최신순 등의 수동 정렬
      if (sortBy === 'distance' && coords) {
        processed.sort((a, b) => {
          const distA = a.dist ? parseFloat(a.dist) : Infinity;
          const distB = b.dist ? parseFloat(b.dist) : Infinity;
          return distA - distB;
        });
      } else if (sortBy === 'title') {
        processed.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
      } else if (sortBy === 'newest') {
        processed.sort((a, b) => {
          const timeA = a.createdtime || '';
          const timeB = b.createdtime || '';
          return timeB.localeCompare(timeA); // 내림차순 정렬 (최신이 위로)
        });
      }

      setItems(processed);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error('Failed to load attractions:', err);
      setItems([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedArea, selectedCategory, appliedKeyword, coords, page, sortBy, calculateDistance]);

  // 설정값 변경 시 데이터 리로드
  useEffect(() => {
    if (!locationLoading) {
      fetchAttractions();
    }
  }, [selectedArea, selectedCategory, appliedKeyword, coords, page, sortBy, locationLoading, fetchAttractions]);

  // 지역 변경
  const handleAreaChange = (areaCode: string) => {
    setSelectedArea(areaCode);
    setPage(1);
  };

  // 카테고리 변경
  const handleCategoryChange = (categoryCode: string) => {
    setSelectedCategory(categoryCode);
    setPage(1);
  };

  // 필터 모달 핸들러들
  const openFilterModal = () => {
    setTempArea(selectedArea);
    setTempCategory(selectedCategory);
    setIsFilterModalOpen(true);
  };

  const applyFilters = () => {
    setSelectedArea(tempArea);
    setSelectedCategory(tempCategory);
    setPage(1);
    setIsFilterModalOpen(false);
  };

  const resetTempFilters = () => {
    setTempArea('');
    setTempCategory('');
  };

  const activeFilterCount = (selectedArea !== '' ? 1 : 0) + (selectedCategory !== '' ? 1 : 0);

  // 명시적 검색 버튼 클릭 / 엔터 입력 시 적용
  const handleSearchTrigger = () => {
    setAppliedKeyword(searchInput);
    setPage(1);
  };



  const currentTitle = selectedArea
    ? `${AREAS.find((a) => a.code === selectedArea)?.label} 여행지`
    : '전체 여행지';

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 font-sans">
      {/* 1. 상단 타이틀 및 고정 검색 바 영역 */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md dark:bg-zinc-950/95 border-b border-gray-100 dark:border-zinc-900 px-5 pt-4 pb-3 flex flex-col">
        {/* 타이틀 헤더 */}
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors shrink-0">
            <svg className="w-5 h-5 text-gray-650 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-zinc-50 flex-1">
            {currentTitle}
          </h1>
        </div>

        {/* 검색창 & 필터 설정 버튼 (한 행으로 통합) */}
        <div className="flex items-center gap-2 mt-3">
          {/* 검색 인풋 컨테이너 */}
          <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-3.5 py-1.5">
            <input
              type="text"
              placeholder="가고 싶은 관광지를 입력해 주세요."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchTrigger();
              }}
              className="flex-1 text-sm focus:outline-none bg-transparent py-0.5 text-gray-800 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-650"
            />
            <button
              onClick={handleSearchTrigger}
              className="p-1 hover:bg-gray-250 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
          </div>

          {/* 필터 설정 버튼 */}
          <button
            onClick={openFilterModal}
            className={`shrink-0 flex items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer ${activeFilterCount > 0
              ? 'border-blue-250 bg-blue-50 text-blue-600 dark:border-blue-900/30 dark:bg-blue-950/30 dark:text-blue-400'
              : 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-950/20 dark:text-blue-400'
              }`}
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* 2. 활성 필터 칩 목록 (필터가 적용되었을 때만 행을 렌더링, 스크롤 방향에 따른 부드러운 인터랙션) */}
        {activeFilterCount > 0 && (
          <div
            className={`flex flex-wrap items-center gap-2 transition-all duration-300 ease-in-out transform origin-top overflow-hidden ${showFilterChips
              ? 'max-h-12 opacity-100 scale-y-100 mt-3 pointer-events-auto'
              : 'max-h-0 opacity-0 scale-y-0 mt-0 pointer-events-none'
              }`}
          >
            {selectedArea !== '' && (
              <span className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50/70 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20 rounded-full text-xs font-semibold">
                {AREAS.find((a) => a.code === selectedArea)?.label}
                <button
                  onClick={() => {
                    setSelectedArea('');
                    setPage(1);
                  }}
                  className="hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full p-1 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedCategory !== '' && (
              <span className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50/70 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20 rounded-full text-xs font-semibold">
                {CATEGORIES.find((c) => c.code === selectedCategory)?.label}
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setPage(1);
                  }}
                  className="hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full p-1 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. 정렬 및 카운트 헤더 */}
      <div className="px-5 py-3.5 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/20 text-xs">
        {(isLoading || locationLoading) ? (
          <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-850 rounded-md animate-pulse" />
        ) : (
          <p className="text-gray-500 dark:text-zinc-400 font-medium">
            총 <span className="text-blue-600 dark:text-blue-400 font-bold">{totalCount}</span>개의 결과
          </p>
        )}

        {/* 정렬 셀렉터 */}
        <div className="relative shrink-0 flex items-center">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setPage(1);
            }}
            className="appearance-none bg-transparent pl-2.5 pr-7 py-1.5 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-zinc-350 focus:outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-900"
          >
            {coords && <option value="distance" className="bg-white dark:bg-zinc-950">거리순</option>}
            <option value="popularity" className="bg-white dark:bg-zinc-950">인기순</option>
            <option value="title" className="bg-white dark:bg-zinc-950">제목순</option>
            <option value="newest" className="bg-white dark:bg-zinc-950">최신순</option>
          </select>
          <div className="absolute right-2.5 pointer-events-none text-gray-400 dark:text-zinc-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* 4. 리스트 영역 */}
      <main className="flex-1 pt-5 pb-20">
        {(isLoading || locationLoading) ? (
          <div className="grid grid-cols-2 gap-4 px-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <CardSkeleton key={n} />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 px-5">
            {items.map((item) => (
              <AttractionCard
                key={item.contentid}
                item={item}
                addressMode="summary"
                showDistance={true}
                showCategory={true}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-zinc-500 gap-2">
            <MapPin className="w-10 h-10 text-gray-300 dark:text-zinc-700" />
            <p className="text-sm">검색 결과가 없습니다.</p>
          </div>
        )}

        {/* 5. 페이지네이션 컨트롤 */}
        {!isLoading && items.length > 0 && (
          <div className="flex justify-center items-center gap-4 py-6 border-t border-gray-100 dark:border-zinc-900 mt-8 mx-5">
            <button
              onClick={() => {
                setPage((prev) => Math.max(prev - 1, 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={page === 1 || isLoading}
              className="px-4 py-2 rounded-xl border border-gray-250 dark:border-zinc-800 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-zinc-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-gray-600 dark:text-zinc-400 active:scale-95 cursor-pointer"
            >
              이전
            </button>
            <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">
              {page} 페이지
            </span>
            <button
              onClick={() => {
                setPage((prev) => prev + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={items.length < 20 || isLoading}
              className="px-4 py-2 rounded-xl border border-gray-250 dark:border-zinc-800 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-zinc-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-gray-600 dark:text-zinc-400 active:scale-95 cursor-pointer"
            >
              다음
            </button>
          </div>
        )}
      </main>

      {/* 6. 플레이스 필터 모달 (바텀 시트) */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center animate-fadeIn">
          {/* 어두운 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity"
            onClick={() => setIsFilterModalOpen(false)}
          />

          {/* 바텀 시트 본체 */}
          <div className="relative w-full max-w-[480px] bg-white dark:bg-zinc-950 rounded-t-3xl shadow-2xl z-10 px-5 pt-4 pb-6 flex flex-col gap-5 max-h-[85vh] animate-slideUp border-t border-gray-100 dark:border-zinc-900">
            {/* 상단 드래그 핸들 데코레이션 */}
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto" />

            {/* 타이틀 및 닫기 버튼 */}
            <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-zinc-900">
              <h2 className="text-base font-bold text-gray-900 dark:text-zinc-50">플레이스 필터</h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
              </button>
            </div>

            {/* 필터 선택 리스트 (스크롤블 영역) */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6 py-2">
              {/* 지역 필터 */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-gray-805 dark:text-zinc-300 tracking-wide">지역</h3>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map((area) => {
                    const isSelected = tempArea === area.code;
                    return (
                      <button
                        key={area.code}
                        onClick={() => setTempArea(area.code)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm dark:bg-blue-500 dark:border-blue-500'
                          : 'bg-gray-50 border-gray-200 text-gray-650 hover:bg-gray-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'
                          }`}
                      >
                        {area.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 카테고리 필터 */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-gray-805 dark:text-zinc-300 tracking-wide">카테고리</h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = tempCategory === cat.code;
                    return (
                      <button
                        key={cat.code}
                        onClick={() => setTempCategory(cat.code)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm dark:bg-blue-500 dark:border-blue-500'
                          : 'bg-gray-50 border-gray-200 text-gray-650 hover:bg-gray-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'
                          }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 하단 버튼바 */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-zinc-900">
              <button
                onClick={resetTempFilters}
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
              >
                초기화
              </button>
              <button
                onClick={applyFilters}
                className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer text-center"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
