'use client';

import { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FestivalItem } from '@/lib/api';

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

function FestivalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 데이터 분리 (달력 도트용 vs 하단 상세 목록용)
  const [calendarItems, setCalendarItems] = useState<FestivalItem[]>([]);
  const [detailItems, setDetailItems] = useState<FestivalItem[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState<boolean>(true);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(true);

  // 캘린더 관련 상태
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(5); // 0-indexed (5 = 6월)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 18));

  // 오늘 날짜 상태 (하이드레이션 불일치 방지를 위해 기본값 세팅 후 마운트 시 동적 연산)
  const [todayStr, setTodayStr] = useState<string>('20260618');
  const [todayVal, setTodayVal] = useState<Date>(new Date(2026, 5, 18));

  // 무한 스크롤 관련 상태
  const [displayCount, setDisplayCount] = useState<number>(20);
  const observerRef = useRef<HTMLDivElement | null>(null);

  // 오늘 날짜 동적 연산 및 초기 세팅
  useEffect(() => {
    const now = new Date();
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

    // URL 파라미터가 없으면 오늘 날짜를 디폴트로 세팅
    const dateParam = searchParams.get('date');
    if (!dateParam || dateParam.length !== 8) {
      setSelectedDate(actualTodayVal);
      setCurrentYear(y);
      setCurrentMonth(m);
    }
  }, [searchParams]);

  // 날짜 변경 시 무한 스크롤 표시 개수 초기화
  useEffect(() => {
    setDisplayCount(20);
  }, [selectedDate]);

  // 1. 달력 도트용 축제 데이터 페칭 (달력의 연/월이 바뀔 때 호출)
  const fetchCalendarFestivals = useCallback(async () => {
    setIsCalendarLoading(true);
    try {
      const formattedMonth = String(currentMonth + 1).padStart(2, '0');
      const eventStartDate = `${currentYear}${formattedMonth}01`;
      const res = await fetch(`/api/festivals?eventStartDate=${eventStartDate}&limit=500`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCalendarItems(data.items || []);
    } catch (err) {
      console.error(err);
      setCalendarItems([]);
    } finally {
      setIsCalendarLoading(false);
    }
  }, [currentYear, currentMonth]);

  // 2. 하단 상세 목록용 축제 데이터 페칭 (선택된 날짜의 연/월이 변경되고, 달력 연/월과 불일치할 때만 호출)
  const fetchDetailFestivals = useCallback(async () => {
    if (!selectedDate) return;

    const selYear = selectedDate.getFullYear();
    const selMonth = selectedDate.getMonth();

    // 달력 연/월과 불일치할 때만 실제로 API 쿼리
    if (selYear !== currentYear || selMonth !== currentMonth) {
      setIsDetailLoading(true);
      try {
        const formattedMonth = String(selMonth + 1).padStart(2, '0');
        const eventStartDate = `${selYear}${formattedMonth}01`;
        const res = await fetch(`/api/festivals?eventStartDate=${eventStartDate}&limit=500`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setDetailItems(data.items || []);
      } catch (err) {
        console.error(err);
        setDetailItems([]);
      } finally {
        setIsDetailLoading(false);
      }
    }
  }, [selectedDate, currentYear, currentMonth]);

  useEffect(() => {
    fetchCalendarFestivals();
  }, [fetchCalendarFestivals]);

  useEffect(() => {
    fetchDetailFestivals();
  }, [fetchDetailFestivals]);

  // 현재 활성화된 데이터셋 (연/월 일치 시 calendarItems를 즉시 바인딩하여 복사 딜레이 및 Race Condition 제거)
  const activeItems = (selectedDate.getFullYear() === currentYear && selectedDate.getMonth() === currentMonth)
    ? calendarItems
    : detailItems;

  const isDetailActiveLoading = (selectedDate.getFullYear() === currentYear && selectedDate.getMonth() === currentMonth)
    ? isCalendarLoading
    : isDetailLoading;

  // 쿼리 파라미터 date 로드 및 동기화
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam && dateParam.length === 8) {
      const y = parseInt(dateParam.substring(0, 4), 10);
      const m = parseInt(dateParam.substring(4, 6), 10) - 1;
      const d = parseInt(dateParam.substring(6, 8), 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        const parsedDate = new Date(y, m, d);
        setSelectedDate(parsedDate);
        setCurrentYear(y);
        setCurrentMonth(m);
      }
    }
  }, [searchParams]);

  // 날짜 선택 시 쿼리 파라미터 반영
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dateStr = formatDateStr(date);
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', dateStr);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // 오늘 날짜로 되돌아가기
  const handleGoToToday = () => {
    setCurrentYear(todayVal.getFullYear());
    setCurrentMonth(todayVal.getMonth());
    handleDateSelect(todayVal);
  };

  // 달력 헬퍼
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  const days = [];
  // 이전달 빈칸
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  // 이번달 날짜
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentYear, currentMonth, i));
  }

  // 이전달/다음달 이동
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((prev) => prev - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((prev) => prev + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // 날짜 포맷 헬퍼 YYYYMMDD
  const formatDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
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

  // 특정 일자 축제 리스트 필터링 (달력 도트용 - calendarItems 사용)
  const getFestivalsForDateFromCalendar = (date: Date) => {
    const dStr = formatDateStr(date);
    return calendarItems.filter((item) => {
      const start = item.eventstartdate || '';
      const end = item.eventenddate || '';
      return start <= dStr && dStr <= end;
    });
  };

  // 특정 일자 축제 리스트 필터링 (activeItems 기반)
  const getFestivalsForDate = (date: Date, sourceItems: FestivalItem[]) => {
    const dStr = formatDateStr(date);
    return sourceItems.filter((item) => {
      const start = item.eventstartdate || '';
      const end = item.eventenddate || '';
      return start <= dStr && dStr <= end;
    });
  };

  // 축제 상태 구하기
  const getFestivalStatus = (item: FestivalItem) => {
    const start = item.eventstartdate || '';
    const end = item.eventenddate || '';
    if (end < todayStr) return 'ended';
    if (start <= todayStr && todayStr <= end) return 'ongoing';
    return 'upcoming';
  };

  // 캘린더 선택된 날짜의 축제들 (선택한 날짜와 시작일이 가까운 순서로 - 시작일 내림차순 정렬)
  const selectedDateFestivals = useMemo(() => {
    if (!selectedDate) return [];
    const items = getFestivalsForDate(selectedDate, activeItems);
    return [...items].sort((a, b) => {
      return (b.eventstartdate || '').localeCompare(a.eventstartdate || '');
    });
  }, [selectedDate, activeItems]);

  // 화면에 노출될 축제 목록 (20개씩 끊어서 무한 스크롤)
  const displayedFestivals = useMemo(() => {
    return selectedDateFestivals.slice(0, displayCount);
  }, [selectedDateFestivals, displayCount]);

  // 무한 스크롤 IntersectionObserver 적용
  useEffect(() => {
    if (selectedDateFestivals.length <= displayCount) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setDisplayCount((prev) => prev + 20);
      }
    }, {
      rootMargin: '100px',
    });

    const currentTrigger = observerRef.current;
    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
    };
  }, [selectedDateFestivals.length, displayCount]);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 font-sans pb-24 min-h-screen">
      {/* 1. 상단 고정 헤더 */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md dark:bg-zinc-950/95 border-b border-gray-100 dark:border-zinc-900 px-5 pt-4 pb-3 flex items-center gap-3">
        <Link href="/" className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-gray-800 dark:text-zinc-200" strokeWidth={2.2} />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-50 flex-1">축제 & 행사</h1>
      </div>

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="flex-1 mt-4">
        <div className="flex flex-col gap-6">
          {/* 달력 컨테이너 */}
          <div className="px-5">
            <div className="bg-gray-50 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-900 rounded-3xl p-4 flex flex-col gap-4">
              {/* 달력 헤더 */}
              <div className="flex justify-between items-center px-1">
                <h2 className="text-sm font-extrabold text-gray-800 dark:text-zinc-200">
                  {currentYear}년 {currentMonth + 1}월
                </h2>
                <div className="flex items-center gap-2">
                  {/* 오늘로 돌아가기 버튼 */}
                  <button
                    onClick={handleGoToToday}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-600 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer"
                  >
                    오늘
                  </button>
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 hover:bg-gray-250 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-gray-250 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 dark:text-zinc-555 border-b border-gray-100 dark:border-zinc-900/30 pb-2">
                <span className="text-red-500">일</span>
                <span>월</span>
                <span>화</span>
                <span>수</span>
                <span>목</span>
                <span>금</span>
                <span className="text-blue-500">토</span>
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-y-2.5 text-center">
                {days.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />;

                  const isSelected = selectedDate &&
                    selectedDate.getFullYear() === day.getFullYear() &&
                    selectedDate.getMonth() === day.getMonth() &&
                    selectedDate.getDate() === day.getDate();

                  const isToday = day.getFullYear() === todayVal.getFullYear() &&
                    day.getMonth() === todayVal.getMonth() &&
                    day.getDate() === todayVal.getDate();

                  // 지난 날짜 여부 판단
                  const isPastDay = day < todayVal;

                  // 축제가 매칭되는지 계산
                  const dailyFestList = getFestivalsForDateFromCalendar(day);
                  const hasFestivals = dailyFestList.length > 0;

                  return (
                    <button
                      key={`day-${idx}`}
                      onClick={() => handleDateSelect(day)}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer mx-auto w-8 h-8 ${isSelected
                        ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500'
                        : isToday
                          ? 'border border-blue-500 text-blue-600 dark:text-blue-400'
                          : isPastDay
                            ? 'text-gray-300 dark:text-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-900 opacity-60'
                            : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-150 dark:hover:bg-zinc-800'
                        }`}
                    >
                      <span>{day.getDate()}</span>
                      {/* 축제 도트 표시 */}
                      {hasFestivals && (
                        <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500 dark:bg-blue-400'
                          }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 선택된 날짜 축제 목록 */}
          <div className="flex flex-col gap-4 px-5">
            <div className="flex justify-between items-center pb-1">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-zinc-550">
                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 기준, 축제 및 행사
              </h3>
              <Link
                href="/festival/list"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
              >
                {currentYear} 전체 축제 보기 &gt;
              </Link>
            </div>

            {isDetailActiveLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map((n) => (
                  <div key={n} className="flex gap-4 p-4 border border-gray-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-3xl animate-pulse">
                    {/* 이미지 스켈레톤 (3:4 비율) */}
                    <div className="w-20 aspect-[3/4] bg-gray-200 dark:bg-zinc-800 rounded-2xl shrink-0" />
                    {/* 텍스트 정보 스켈레톤 */}
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div className="flex flex-col gap-1.5">
                        <div className="h-4 w-3/4 bg-gray-250 dark:bg-zinc-800 rounded-md" />
                        <div className="h-3 w-1/2 bg-gray-200 dark:bg-zinc-850 rounded-md" />
                      </div>
                      <div className="flex justify-between items-center mt-2.5">
                        <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-850 rounded-md" />
                        <div className="h-5 w-12 bg-gray-200 dark:bg-zinc-850 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedDateFestivals.length > 0 ? (
              <div className="flex flex-col gap-3">
                {displayedFestivals.map((item) => {
                  const status = getFestivalStatus(item);
                  const isEnded = status === 'ended';

                  return (
                    <Link
                      key={item.contentid}
                      href={`/trip/${item.contentid}`}
                      className={`flex gap-4 p-4 border border-gray-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-3xl transition-all hover:shadow-sm ${isEnded ? 'opacity-55' : ''
                        }`}
                    >
                      {/* 축제 이미지 (3:4 비율) */}
                      <div className="relative w-20 aspect-[3/4] bg-zinc-150 dark:bg-zinc-900 rounded-2xl overflow-hidden shrink-0">
                        <Image
                          src={item.firstimage || 'https://images.unsplash.com/photo-1548115184-bc6544d06a58'}
                          alt={item.title}
                          fill
                          className={`object-cover ${isEnded ? 'grayscale contrast-75 brightness-90' : ''}`}
                          unoptimized
                        />
                      </div>
                      {/* 상세 정보 */}
                      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                        {/* 제목 및 주소 */}
                        <div className="flex flex-col">
                          <h4 className={`text-sm font-bold text-gray-900 dark:text-zinc-50 leading-snug line-clamp-2 ${isEnded ? 'line-through text-gray-400' : ''
                            }`}>
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-400 dark:text-zinc-555 mt-1.5 truncate">
                            {item.addr1 || '지역 정보 없음'}
                          </p>
                        </div>

                        {/* 하단 날짜 및 상태 뱃지 */}
                        <div className="flex justify-between items-end mt-2.5">
                          <span className="text-[11px] font-medium text-gray-400 dark:text-zinc-500">
                            {formatPeriod(item.eventstartdate, item.eventenddate)}
                          </span>

                          {isEnded ? (
                            <span className="text-[9px] px-2.5 py-0.5 bg-gray-100 text-gray-450 border border-gray-200 rounded-full font-bold dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500 shrink-0">
                              종료됨
                            </span>
                          ) : status === 'ongoing' ? (
                            <span className="text-[9px] px-2.5 py-0.5 bg-green-50/50 text-green-600 border border-green-150/70 rounded-full font-bold dark:bg-green-950/20 dark:border-green-900/30 shrink-0">
                              진행중
                            </span>
                          ) : (
                            <span className="text-[9px] px-2.5 py-0.5 bg-blue-50/50 text-blue-600 border border-blue-150/70 rounded-full font-bold dark:bg-blue-950/20 dark:border-blue-900/30 shrink-0">
                              진행예정
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {/* 무한 스크롤 트리거 */}
                {selectedDateFestivals.length > displayCount && (
                  <div ref={observerRef} className="h-14 flex items-center justify-center text-xs text-gray-400 dark:text-zinc-500 py-4">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                    더 많은 축제 불러오는 중...
                  </div>
                )}

                {/* 하단 전체 축제 목록 더보기 이동 버튼 또는 스크롤 종료 UX */}
                {selectedDateFestivals.length > 20 && selectedDateFestivals.length <= displayCount ? (
                  <div className="flex flex-col items-center gap-4 py-8 mt-6 border-t border-gray-150 dark:border-zinc-900/50">
                    <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium flex items-center gap-1">
                      ✨ 모든 축제 일정을 확인했습니다.
                    </p>
                    <div className="flex gap-3 w-full mt-1">
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3.5 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        맨 위로 이동
                      </button>
                      <Link
                        href="/festival/list"
                        className="flex-1 py-3.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-150/50 dark:border-blue-900/30 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center block active:scale-[0.98]"
                      >
                        전체 축제 보기
                      </Link>
                    </div>
                  </div>
                ) : (
                  selectedDateFestivals.length <= 20 && (
                    <div className="mt-4 pb-2">
                      <Link
                        href="/festival/list"
                        className="w-full py-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 border border-gray-150 dark:border-zinc-800 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center block"
                      >
                        {currentYear}년 전체 축제 더보기
                      </Link>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 dark:text-zinc-655 text-xs">
                해당 날짜에 예정된 축제 및 행사가 없습니다.
                
                {/* 일정이 없을 때도 전체 리스트 버튼 제공 */}
                <div className="mt-6">
                  <Link
                    href="/festival/list"
                    className="w-full py-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 border border-gray-150 dark:border-zinc-800 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center block"
                  >
                    {currentYear}년 전체 축제 더보기
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function FestivalPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-400 bg-white dark:bg-zinc-950 gap-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">축제 정보 불러오는 중...</span>
      </div>
    }>
      <FestivalContent />
    </Suspense>
  );
}
