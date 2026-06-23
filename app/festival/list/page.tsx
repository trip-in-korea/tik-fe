'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SlidersHorizontal, X, ArrowLeft, Search } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FestivalItem } from '@/lib/api';
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

function FestivalListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedArea, setSelectedArea] = useState<string>('');
  const [calendarItems, setCalendarItems] = useState<FestivalItem[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState<boolean>(true);

  // 현재 연도와 월 (KST 오늘 날짜 기준으로 설정)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(5); // 0-indexed (5 = 6월)

  // 필터 모달 상태
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [tempArea, setTempArea] = useState<string>('');

  // 카드 뷰 전용 필터/검색/페이지네이션 상태
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'upcoming' | 'ended'>('all');
  const [cardSearchInput, setCardSearchInput] = useState<string>('');
  const [cardAppliedKeyword, setCardAppliedKeyword] = useState<string>('');
  const [cardPage, setCardPage] = useState<number>(1);

  // 오늘 날짜 상태
  const [todayStr, setTodayStr] = useState<string>('20260618');
  const [todayVal, setTodayVal] = useState<Date>(new Date(2026, 5, 18));

  // 오늘 날짜 동적 연산
  useEffect(() => {
    const now = new Date();
    // KST 시간 기준으로 오늘 날짜 연산
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const y = kstDate.getUTCFullYear();
    const m = kstDate.getUTCMonth(); // 0-indexed
    const d = kstDate.getUTCDate();

    const formattedMonth = String(m + 1).padStart(2, '0');
    const formattedDay = String(d).padStart(2, '0');
    const actualTodayStr = `${y}${formattedMonth}${formattedDay}`;
    const actualTodayVal = new Date(y, m, d);

    setTodayStr(actualTodayStr);
    setTodayVal(actualTodayVal);
    setCurrentYear(y);
    setCurrentMonth(m);
  }, []);

  // 오늘 날짜 기준으로 이달의 축제 리스트 페칭 (한 번에 최대 500개 확보)
  const fetchCalendarFestivals = useCallback(async () => {
    setIsCalendarLoading(true);
    try {
      const formattedMonth = String(currentMonth + 1).padStart(2, '0');
      const eventStartDate = `${currentYear}${formattedMonth}01`;
      const areaParam = selectedArea ? `&areaCode=${selectedArea}` : '';
      const res = await fetch(`/api/festivals?eventStartDate=${eventStartDate}${areaParam}&limit=500`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCalendarItems(data.items || []);
    } catch (err) {
      console.error(err);
      setCalendarItems([]);
    } finally {
      setIsCalendarLoading(false);
    }
  }, [currentYear, currentMonth, selectedArea]);

  useEffect(() => {
    fetchCalendarFestivals();
  }, [fetchCalendarFestivals]);

  // 축제 상태 구하기
  const getFestivalStatus = (item: FestivalItem) => {
    const start = item.eventstartdate || '';
    const end = item.eventenddate || '';
    if (end < todayStr) return 'ended';
    if (start <= todayStr && todayStr <= end) return 'ongoing';
    return 'upcoming';
  };

  // 날짜 포맷 헬퍼 (UI 출력용)
  const formatPeriod = (start?: string, end?: string) => {
    if (!start || !end) return '';
    const sy = start.substring(0, 4);
    const sm = start.substring(4, 6);
    const sd = start.substring(6, 8);
    const ey = end.substring(0, 4);
    const em = end.substring(4, 6);
    const ed = end.substring(6, 8);

    if (sy === ey) {
      return `${sy}.${sm}.${sd} ~ ${em}.${ed}`;
    }
    return `${sy}.${sm}.${sd} ~ ${ey}.${em}.${ed}`;
  };

  // 주소 포맷 헬퍼 (AttractionCard.tsx와 동일 규격 적용: 서울 · 종로구 형식)
  const formatAddress = (addr?: string) => {
    if (!addr) return '';
    const parts = addr.trim().split(/\s+/);
    if (parts.length === 0) return '';
    
    let city = parts[0] || '';
    const district = parts[1] || '';
    
    // 행정구역명 축약
    if (city.startsWith('서울')) city = '서울';
    else if (city.startsWith('인천')) city = '인천';
    else if (city.startsWith('대전')) city = '대전';
    else if (city.startsWith('대구')) city = '대구';
    else if (city.startsWith('광주')) city = '광주';
    else if (city.startsWith('부산')) city = '부산';
    else if (city.startsWith('울산')) city = '울산';
    else if (city.startsWith('세종')) city = '세종';
    else if (city.startsWith('경기')) city = '경기';
    else if (city.startsWith('강원')) city = '강원';
    else if (city.startsWith('충청북도') || city === '충북') city = '충북';
    else if (city.startsWith('충청남도') || city === '충남') city = '충남';
    else if (city.startsWith('전라북도') || city === '전북') city = '전북';
    else if (city.startsWith('전라남도') || city === '전남') city = '전남';
    else if (city.startsWith('경상북도') || city === '경북') city = '경북';
    else if (city.startsWith('경상남도') || city === '경남') city = '경남';
    else if (city.startsWith('제주')) city = '제주';
    
    if (district) {
      return `${city} · ${district}`;
    }
    return city;
  };

  // 카드 뷰 전용 검색 처리 함수
  const handleCardSearchTrigger = () => {
    setCardAppliedKeyword(cardSearchInput.trim());
    setCardPage(1);
  };

  // statusFilter 및 cardAppliedKeyword 변경 시 페이지네이션 초기화
  useEffect(() => {
    setCardPage(1);
  }, [statusFilter, cardAppliedKeyword]);

  // 지역 선택 변경 시에도 페이지네이션 초기화
  useEffect(() => {
    setCardPage(1);
  }, [selectedArea]);

  // 카드 뷰 아이템 정렬: 진행중 > 진행예정 > 종료 순 정렬
  // 각 상태군 내부: 진행중(최근시작일순/내림차순), 진행예정(시작일가까운순/오름차순), 종료(종료일최신순/내림차순)
  const sortedCardItems = useMemo(() => {
    return [...calendarItems].sort((a, b) => {
      const statusA = getFestivalStatus(a);
      const statusB = getFestivalStatus(b);

      const statusPriority = { ongoing: 1, upcoming: 2, ended: 3 };
      const priorityA = statusPriority[statusA];
      const priorityB = statusPriority[statusB];

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      if (statusA === 'ongoing') {
        // 진행중인 축제는 최근 시작된 것이 우선 (시작일 내림차순)
        return (b.eventstartdate || '').localeCompare(a.eventstartdate || '');
      }

      if (statusA === 'upcoming') {
        // 진행예정인 축제는 시작일 오름차순 (가장 빠른 예정 축제부터)
        return (a.eventstartdate || '').localeCompare(b.eventstartdate || '');
      }

      // 종료된 축제는 종료일 내림차순 (최근 종료된 것부터)
      return (b.eventenddate || '').localeCompare(a.eventenddate || '');
    });
  }, [calendarItems, todayStr]);

  // 검색어와 진행 상태 필터링이 반영된 카드 뷰 아이템 목록
  const filteredCardItems = useMemo(() => {
    return sortedCardItems.filter((item: FestivalItem) => {
      // 1. 진행 상태 필터링 (전체 / 진행중 / 진행예정 / 종료)
      if (statusFilter !== 'all') {
        const status = getFestivalStatus(item);
        if (status !== statusFilter) return false;
      }

      // 2. 키워드 검색 필터링 (제목 검색)
      if (cardAppliedKeyword) {
        const title = item.title || '';
        if (!title.toLowerCase().includes(cardAppliedKeyword.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [sortedCardItems, statusFilter, cardAppliedKeyword]);

  // 현재 페이지에 노출할 50개 아이템 슬라이싱 (50개 단위)
  const paginatedCardItems = useMemo(() => {
    const startIndex = (cardPage - 1) * 50;
    const endIndex = startIndex + 50;
    return filteredCardItems.slice(startIndex, endIndex);
  }, [filteredCardItems, cardPage]);

  const openFilterModal = () => {
    setTempArea(selectedArea);
    setIsFilterModalOpen(true);
  };

  const applyFilters = () => {
    setSelectedArea(tempArea);
    setIsFilterModalOpen(false);
  };

  const currentTitle = selectedArea
    ? `${AREAS.find((a) => a.code === selectedArea)?.label} 축제 목록`
    : '전체 축제 목록';

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 font-sans pb-24 min-h-screen">
      {/* 1. 상단 고정 헤더 */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md dark:bg-zinc-950/95 border-b border-gray-100 dark:border-zinc-900 px-5 pt-4 pb-3 flex flex-col">
        {/* 타이틀 헤더 */}
        <div className="flex items-center gap-3">
          <Link
            href="/festival"
            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors shrink-0 cursor-pointer"
          >
            <svg className="w-5 h-5 text-gray-650 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-zinc-50 flex-1">
            {currentTitle}
          </h1>
        </div>

        {/* 검색 및 필터 통합 행 (TripList와 동일 구조) */}
        <div className="flex items-center gap-2 mt-3">
          {/* 검색창 */}
          <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-3.5 py-1.5">
            <input
              type="text"
              placeholder="검색할 축제명을 입력해 주세요."
              value={cardSearchInput}
              onChange={(e) => setCardSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCardSearchTrigger();
              }}
              className="flex-1 text-sm focus:outline-none bg-transparent py-0.5 text-gray-800 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-650"
            />
            <button
              onClick={handleCardSearchTrigger}
              className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
          </div>

          {/* 지역 필터 설정 버튼 */}
          <button
            onClick={openFilterModal}
            className={`shrink-0 flex items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
              selectedArea !== ''
                ? 'border-blue-250 bg-blue-50 text-blue-600 dark:border-blue-900/30 dark:bg-blue-950/30 dark:text-blue-400'
                : 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-950/20 dark:text-blue-400'
            }`}
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* 활성 필터 칩 영역 (필터 선택 시에만 출력) */}
        {selectedArea !== '' && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50/70 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20 rounded-full text-xs font-semibold select-none">
              {AREAS.find((a) => a.code === selectedArea)?.label}
              <button
                onClick={() => setSelectedArea('')}
                className="hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full p-1 transition-colors cursor-pointer ml-0.5"
              >
                <X className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="flex-1 mt-4">
        {/* 카드 뷰 콘텐츠 */}
        <div className="flex flex-col gap-4">
          {/* 정렬 및 카운트 헤더 */}
          <div className="px-5 py-3 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/20 text-xs border-b border-gray-100 dark:border-zinc-900">
            <p className="text-gray-500 dark:text-zinc-400 font-medium">
              총 <span className="text-blue-600 dark:text-blue-400 font-bold">{filteredCardItems.length}</span>개의 결과
            </p>

            {/* 상태 필터 셀렉터 */}
            <div className="relative shrink-0 flex items-center">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="appearance-none bg-transparent pl-2.5 pr-7 py-1.5 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-zinc-350 focus:outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-900"
              >
                <option value="all" className="bg-white dark:bg-zinc-950">전체</option>
                <option value="ongoing" className="bg-white dark:bg-zinc-950">진행중</option>
                <option value="upcoming" className="bg-white dark:bg-zinc-950">진행예정</option>
                <option value="ended" className="bg-white dark:bg-zinc-950">종료</option>
              </select>
              <div className="absolute right-2.5 pointer-events-none text-gray-400 dark:text-zinc-555 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="px-5">
            {isCalendarLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <CardSkeleton key={n} />
                ))}
              </div>
            ) : paginatedCardItems.length > 0 ? (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  {paginatedCardItems.map((item) => {
                    const status = getFestivalStatus(item);
                    const isEnded = status === 'ended';

                    return (
                      <Link
                        key={item.contentid}
                        href={`/trip/${item.contentid}`}
                        className={`flex flex-col gap-2 group transition-transform active:scale-[0.98] relative ${isEnded ? 'opacity-55' : ''
                          }`}
                      >
                        {/* 이미지 컨테이너 (3:4 비율) */}
                        <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-sm shrink-0">
                          <Image
                            src={item.firstimage || 'https://images.unsplash.com/photo-1548115184-bc6544d06a58'}
                            alt={item.title}
                            fill
                            className={`object-cover group-hover:scale-105 transition-transform duration-300 ${isEnded ? 'grayscale contrast-75 brightness-90' : ''
                              }`}
                            unoptimized
                          />
                          {/* 상태 뱃지 오버레이 */}
                          <div className="absolute top-2 left-2 flex gap-1 z-10">
                            {isEnded ? (
                              <span className="bg-black/60 dark:bg-black/85 backdrop-blur-[2px] text-[10px] font-bold text-white px-1.5 py-0.5 rounded-md shadow-sm">
                                종료
                              </span>
                            ) : status === 'ongoing' ? (
                              <span className="bg-green-600/90 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-md shadow-sm">
                                진행중
                              </span>
                            ) : (
                              <span className="bg-blue-600/90 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-md shadow-sm">
                                진행예정
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 텍스트 정보 */}
                        <div className="flex flex-col px-1 items-start">
                          {/* 제목 */}
                          <h3 className={`text-xs font-bold line-clamp-2 leading-tight transition-colors ${
                            isEnded 
                              ? 'line-through text-gray-400 dark:text-zinc-500' 
                              : 'text-gray-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                            }`}>
                            {item.title}
                          </h3>
                          {/* 지역 정보 */}
                          <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 line-clamp-1">
                            {formatAddress(item.addr1)}
                          </p>
                          {/* 기간 정보 */}
                          <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 line-clamp-1">
                            {formatPeriod(item.eventstartdate, item.eventenddate)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* 페이지네이션 컨트롤 */}
                {filteredCardItems.length > 50 && (
                  <div className="flex justify-center items-center gap-4 py-6 border-t border-gray-100 dark:border-zinc-900 mt-4">
                    <button
                      onClick={() => {
                        setCardPage((prev) => Math.max(prev - 1, 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={cardPage === 1}
                      className="px-4 py-2 rounded-xl border border-gray-250 dark:border-zinc-800 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-zinc-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-gray-600 dark:text-zinc-400 active:scale-95 cursor-pointer"
                    >
                      이전
                    </button>
                    <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                      {cardPage} / {Math.ceil(filteredCardItems.length / 50)} 페이지
                    </span>
                    <button
                      onClick={() => {
                        setCardPage((prev) => Math.min(prev + 1, Math.ceil(filteredCardItems.length / 50)));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={cardPage >= Math.ceil(filteredCardItems.length / 50)}
                      className="px-4 py-2 rounded-xl border border-gray-250 dark:border-zinc-800 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-zinc-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-gray-600 dark:text-zinc-400 active:scale-95 cursor-pointer"
                    >
                      다음
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 dark:text-zinc-655 text-xs">
                조건에 맞는 축제 및 행사가 존재하지 않습니다.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. 플레이스 필터 모달 (바텀 시트) */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center animate-fadeIn">
          {/* 오버레이 배경 */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity"
            onClick={() => setIsFilterModalOpen(false)}
          />

          {/* 바텀 시트 */}
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-t-3xl shadow-2xl z-10 px-5 pt-4 pb-6 flex flex-col gap-5 max-h-[80vh] animate-slideUp border-t border-gray-100 dark:border-zinc-900">
            {/* 드래그 데코레이터 */}
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto" />

            <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-zinc-900">
              <h2 className="text-base font-bold text-gray-900 dark:text-zinc-550">지역 선택</h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6 py-2">
              <div className="flex flex-col gap-3">
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
            </div>

            {/* 초기화 / 적용 */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-zinc-900">
              <button
                onClick={() => setTempArea('')}
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-gray-700 dark:text-zinc-350 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
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

export default function FestivalListPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-400 bg-white dark:bg-zinc-950 gap-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">축제 목록 불러오는 중...</span>
      </div>
    }>
      <FestivalListContent />
    </Suspense>
  );
}
