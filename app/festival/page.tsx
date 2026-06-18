'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar as CalendarIcon, Grid, SlidersHorizontal, X, MapPin, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
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

function FestivalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [viewMode, setViewMode] = useState<'calendar' | 'card'>('calendar');
  const [selectedArea, setSelectedArea] = useState<string>('');

  // 데이터 분리 (달력 도트용 vs 하단 상세 목록용)
  const [calendarItems, setCalendarItems] = useState<FestivalItem[]>([]);
  const [detailItems, setDetailItems] = useState<FestivalItem[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState<boolean>(true);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(true);

  // 캘린더 관련 상태
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(5); // 0-indexed (5 = 6월)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 18));

  // 필터 모달 상태
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [tempArea, setTempArea] = useState<string>('');

  const todayStr = '20260618'; // 기준 오늘 날짜 (KST)
  const todayVal = new Date(2026, 5, 18);

  // 1. 달력 도트용 축제 데이터 페칭 (달력의 연/월 또는 지역 필터가 바뀔 때 호출)
  const fetchCalendarFestivals = useCallback(async () => {
    setIsCalendarLoading(true);
    try {
      const formattedMonth = String(currentMonth + 1).padStart(2, '0');
      const eventStartDate = `${currentYear}${formattedMonth}01`;
      const areaParam = selectedArea ? `&areaCode=${selectedArea}` : '';
      const res = await fetch(`/api/festivals?eventStartDate=${eventStartDate}${areaParam}&limit=50`);
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

  // 2. 하단 상세 목록용 축제 데이터 페칭 (선택된 날짜의 연/월 또는 지역 필터가 변경되고, 달력 연/월과 불일치할 때만 호출)
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
        const areaParam = selectedArea ? `&areaCode=${selectedArea}` : '';
        const res = await fetch(`/api/festivals?eventStartDate=${eventStartDate}${areaParam}&limit=50`);
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
  }, [selectedDate, currentYear, currentMonth, selectedArea]);

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
    const today = new Date(2026, 5, 18);
    setCurrentYear(2026);
    setCurrentMonth(5);
    handleDateSelect(today);
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

  // 캘린더 선택된 날짜의 축제들
  const selectedDateFestivals = selectedDate ? getFestivalsForDate(selectedDate, activeItems) : [];

  // 카드 뷰 아이템 정렬: 진행중/진행예정 우선 -> 종료된것 후순 정렬
  const sortedCardItems = [...calendarItems].sort((a, b) => {
    const statusA = getFestivalStatus(a);
    const statusB = getFestivalStatus(b);

    const isEndedA = statusA === 'ended';
    const isEndedB = statusB === 'ended';

    if (isEndedA && !isEndedB) return 1;
    if (!isEndedA && isEndedB) return -1;

    // 시작일 빠른 순 정렬
    return (a.eventstartdate || '').localeCompare(b.eventstartdate || '');
  });

  const activeFilterCount = selectedArea !== '' ? 1 : 0;

  const openFilterModal = () => {
    setTempArea(selectedArea);
    setIsFilterModalOpen(true);
  };

  const applyFilters = () => {
    setSelectedArea(tempArea);
    setIsFilterModalOpen(false);
  };

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 font-sans pb-24 min-h-screen">
      {/* 1. 상단 고정 헤더 */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md dark:bg-zinc-950/95 border-b border-gray-100 dark:border-zinc-900 px-5 pt-5 pb-3.5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-800 dark:text-zinc-200" strokeWidth={2.2} />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-550 flex-1">축제 & 행사</h1>
        </div>

        {/* 탭 전환 및 지역 필터 (가로 정렬 시안 매칭) */}
        <div className="flex items-center justify-between gap-4">
          {/* 좌측 필터 버튼 및 선택된 칩들을 한 행으로 묶는 스크롤 영역 */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1">
            {/* 원형 필터 트리거 버튼 (파란 아웃라인) */}
            <button
              onClick={openFilterModal}
              className="w-10 h-10 border border-blue-500 rounded-2xl flex items-center justify-center text-blue-600 bg-white dark:bg-zinc-950 hover:bg-blue-50/20 active:bg-blue-100/30 transition-all cursor-pointer shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 text-blue-500" strokeWidth={1.8} />
            </button>

            {/* 적용된 지역 칩 (버튼 바로 우측에 나란히 배치) */}
            {selectedArea !== '' && (
              <span className="shrink-0 flex items-center gap-1.5 pl-4 pr-3 py-[7px] bg-blue-50/60 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-semibold select-none">
                {AREAS.find((a) => a.code === selectedArea)?.label}
                <button
                  onClick={() => setSelectedArea('')}
                  className="hover:bg-blue-100/50 dark:hover:bg-blue-900/40 rounded-full p-0.5 transition-colors cursor-pointer ml-0.5"
                >
                  <X className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" strokeWidth={1.8} />
                </button>
              </span>
            )}
          </div>

          {/* 우측 컴팩트 토글 탭 */}
          <div className="flex p-1 bg-gray-100/80 dark:bg-zinc-900 rounded-full items-center shrink-0">
            <button
              onClick={() => setViewMode('calendar')}
              className={`w-[34px] h-[34px] flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${viewMode === 'calendar'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-400'
                }`}
            >
              <CalendarIcon className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`w-[34px] h-[34px] flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${viewMode === 'card'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-400'
                }`}
            >
              <Grid className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="flex-1 mt-4">
        {viewMode === 'calendar' ? (
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

                    const isToday = day.getFullYear() === 2026 &&
                      day.getMonth() === 5 && // 6월
                      day.getDate() === 18;

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
              <h3 className="text-xs font-medium text-gray-400 dark:text-zinc-500 tracking-wider">
                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 기준, 다가오는 일정
              </h3>

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
                  {selectedDateFestivals.map((item) => {
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
                            <p className="text-xs text-gray-400 dark:text-zinc-550 mt-1.5 truncate">
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
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 dark:text-zinc-655 text-xs">
                  해당 날짜에 예정된 축제 및 행사가 없습니다.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 카드 뷰 콘텐츠 */
          <div className="px-5">
            {isCalendarLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <CardSkeleton key={n} />
                ))}
              </div>
            ) : sortedCardItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {sortedCardItems.map((item) => {
                  const status = getFestivalStatus(item);
                  const isEnded = status === 'ended';

                  return (
                    <Link
                      key={item.contentid}
                      href={`/trip/${item.contentid}`}
                      className={`flex flex-col gap-2 group transition-opacity relative ${isEnded ? 'opacity-55' : ''
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
                            <span className="bg-black/60 dark:bg-black/85 backdrop-blur-[2px] text-[8px] font-extrabold text-white px-1.5 py-0.5 rounded-md shadow-sm">
                              종료됨
                            </span>
                          ) : status === 'ongoing' ? (
                            <span className="bg-green-600/90 text-[8px] font-extrabold text-white px-1.5 py-0.5 rounded-md shadow-sm">
                              진행중
                            </span>
                          ) : (
                            <span className="bg-blue-600/90 text-[8px] font-extrabold text-white px-1.5 py-0.5 rounded-md shadow-sm">
                              진행예정
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 텍스트 정보 */}
                      <div className="flex flex-col px-0.5 gap-0.5">
                        <h4 className={`text-xs font-bold text-gray-800 dark:text-zinc-200 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isEnded ? 'line-through text-gray-400' : ''
                          }`}>
                          {item.title}
                        </h4>
                        <p className="text-[9px] text-gray-400 dark:text-zinc-555 line-clamp-1 flex items-center gap-0.5">
                          <span>{item.addr1?.split(' ')[1] || '축제'}</span>
                          <span className="mx-0.5">•</span>
                          <span>{formatPeriod(item.eventstartdate, item.eventenddate)}</span>
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 dark:text-zinc-650 text-xs">
                조건에 맞는 축제 및 행사가 존재하지 않습니다.
              </div>
            )}
          </div>
        )}
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
