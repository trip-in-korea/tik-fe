import Link from 'next/link';
import Image from 'next/image';
import { getAttractionDetail, getAreaBasedList2, getNearbyAttractions, TourItem } from '@/lib/api';
import { ArrowLeft, MapPin, Info, Share2, Heart, Navigation, Calendar, Clock, HelpCircle } from 'lucide-react';

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TripDetailPage({ params }: PageProps) {
  // Next.js 15/16 규격에 따라 params를 Await 합니다.
  const resolvedParams = await params;
  const contentId = resolvedParams.id;

  // 1. 상세 정보 로드 (detailCommon2 & detailIntro2 API 적용)
  const detail = await getAttractionDetail(contentId);
  console.log("상세보기 데이터:", JSON.stringify(detail, null, 2));

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1548115184-bc6544d06a58'; // 임의의 기본 이미지

    // http:// 로 시작하는 주소가 있다면 https:// 로 강제 치환
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-500 gap-4">
        <p className="text-sm font-medium">상세 정보를 불러올 수 없습니다.</p>
        <Link href="/trip" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
          관광지 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  // 주소명에서 지역코드를 유추하는 폴백 헬퍼
  const getAreaCodeFromAddress = (addr?: string): string => {
    if (!addr) return '';
    if (addr.includes('서울')) return '1';
    if (addr.includes('인천')) return '2';
    if (addr.includes('대전')) return '3';
    if (addr.includes('대구')) return '4';
    if (addr.includes('광주')) return '5';
    if (addr.includes('부산')) return '6';
    if (addr.includes('울산')) return '7';
    if (addr.includes('세종')) return '8';
    if (addr.includes('경기')) return '31';
    if (addr.includes('강원')) return '32';
    if (addr.includes('충북')) return '33';
    if (addr.includes('충남')) return '34';
    if (addr.includes('경북')) return '35';
    if (addr.includes('경남')) return '36';
    if (addr.includes('전북')) return '37';
    if (addr.includes('전남')) return '38';
    if (addr.includes('제주')) return '39';
    return '';
  };

  // 2. 주변 여행지 로드 (가까운 순 1순위, 같은 지역 2순위 병합)
  let nearbyList: TourItem[] = [];
  let areaList: TourItem[] = [];
  let isDistanceBased = false;

  const currentLat = parseFloat(detail.mapy || '');
  const currentLon = parseFloat(detail.mapx || '');

  // 두 위경도 좌표 사이의 거리를 계산하는 하버사인 공식
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // 지구 반경 (m)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 1순위: 가까운 거리 관광지 조회 (반경 10km)
  if (detail.mapx && detail.mapy) {
    try {
      const nearbyResult = await getNearbyAttractions(detail.mapx, detail.mapy, 10000, 10, 1, '12');
      nearbyList = nearbyResult.items;
      if (nearbyList.length > 0) {
        isDistanceBased = true;
      }
    } catch (error) {
      console.error('Error fetching nearby attractions:', error);
    }
  }

  // 2순위: 같은 지역 관광지 조회
  const resolvedAreaCode = detail.areacode || getAreaCodeFromAddress(detail.addr1);
  if (resolvedAreaCode) {
    try {
      const rawAreaList = await getAreaBasedList2(resolvedAreaCode, 15);
      // 같은 지역 관광지 중 좌표가 있고 기준 좌표가 있다면 직접 거리 계산을 수행해 거리 정보 주입
      areaList = rawAreaList.map(item => {
        if (item.dist) return item;
        if (item.mapx && item.mapy && !isNaN(currentLat) && !isNaN(currentLon)) {
          const itemLat = parseFloat(item.mapy);
          const itemLon = parseFloat(item.mapx);
          if (!isNaN(itemLat) && !isNaN(itemLon)) {
            const distMeters = calculateDistance(currentLat, currentLon, itemLat, itemLon);
            return {
              ...item,
              dist: String(Math.round(distMeters))
            };
          }
        }
        return item;
      });
    } catch (error) {
      console.error('Error fetching area list:', error);
    }
  }

  // 병합 및 중복 제거 (상세 정보의 본인 관광지 제외)
  const seenIds = new Set<string>([contentId]);
  const combinedNearby: TourItem[] = [];

  // 가까운 거리 관광지(1순위) 먼저 추가
  for (const item of nearbyList) {
    if (!seenIds.has(item.contentid)) {
      seenIds.add(item.contentid);
      combinedNearby.push(item);
    }
  }

  // 같은 지역 관광지(2순위) 추가
  for (const item of areaList) {
    if (!seenIds.has(item.contentid)) {
      seenIds.add(item.contentid);
      combinedNearby.push(item);
    }
  }

  // 거리 기준 오름차순 정렬 (거리 정보가 없으면 뒤로 보냄)
  combinedNearby.sort((a, b) => {
    const distA = a.dist ? parseFloat(a.dist) : Infinity;
    const distB = b.dist ? parseFloat(b.dist) : Infinity;
    return distA - distB;
  });

  // 총 8개 노출
  const filteredNearby = combinedNearby.slice(0, 8);

  console.log(`[주변 관광지 추천 디버깅] contentId: ${contentId}, areacode: ${detail.areacode}, resolvedAreaCode: ${resolvedAreaCode}, nearbyCount: ${filteredNearby.length}, isDistanceBased: ${isDistanceBased}`);

  const formatDistance = (distStr?: string) => {
    if (!distStr) return '';
    const meters = parseFloat(distStr);
    if (isNaN(meters)) return '';
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${Math.round(meters)}m`;
  };

  const title = detail.title || '상세 관광지';
  const address = detail.addr1 || '주소 정보가 제공되지 않는 지역입니다.';
  const image = getImageUrl(detail.firstimage);
  const cleanOverview = detail.overview ? detail.overview.replace(/<[^>]*>/g, '').trim() : '';

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 font-sans pb-20">
      {/* 1. 히어로 커버 이미지 (1:1 비율 적용) */}
      <div className="relative w-full aspect-square bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        {/* 상단 액션 바 */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <Link
            href="/trip"
            className="p-2.5 bg-black/55 backdrop-blur-md hover:bg-black/70 text-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex gap-2">
            <button className="p-2.5 bg-black/55 backdrop-blur-md hover:bg-black/70 text-white rounded-full transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2.5 bg-black/55 backdrop-blur-md hover:bg-black/70 text-white rounded-full transition-colors">
              <Heart className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <span className="bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            관광명소
          </span>
          <h1 className="text-xl font-bold mt-1.5 leading-tight">{title}</h1>
        </div>
      </div>

      {/* 2. 상세 정보 내용 */}
      <main className="px-5 py-6 flex flex-col gap-6">
        {/* 설명 섹션 */}
        {cleanOverview && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold flex items-center gap-1 text-gray-800 dark:text-zinc-200">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              상세 설명
            </h2>
            <p className="text-xs leading-relaxed text-gray-600 dark:text-zinc-400">
              {cleanOverview}
            </p>
          </div>
        )}

        {/* 상세 안내 표 (detailIntro2 정보 반영) */}
        <div className="flex flex-col gap-3.5 p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-zinc-900 text-xs">
          <h3 className="font-bold text-gray-700 dark:text-zinc-300 border-b border-gray-200/50 dark:border-zinc-800 pb-2">상세 안내</h3>

          <div className="flex  items-start gap-4">
            <span className="text-gray-400 dark:text-zinc-500 shrink-0 w-16">주소</span>
            <span className="text-gray-700 dark:text-zinc-300">{address}</span>
          </div>

          {detail.infocenter && (
            <div className="flex  items-start gap-4 pt-1 border-t border-gray-100/50 dark:border-zinc-900/10">
              <span className="text-gray-400 dark:text-zinc-500 shrink-0 w-16">문의처</span>
              <span className="text-gray-700 dark:text-zinc-300">{detail.infocenter}</span>
            </div>
          )}

          {detail.usetime && (
            <div className="flex  items-start gap-4 pt-1 border-t border-gray-100/50 dark:border-zinc-900/10">
              <span className="text-gray-400 dark:text-zinc-500 shrink-0 w-16">이용시간</span>
              <span className="text-gray-700 dark:text-zinc-300 line-clamp-3">{detail.usetime.replace(/<[^>]*>/g, '')}</span>
            </div>
          )}

          {detail.restdate && (
            <div className="flex  items-start gap-4 pt-1 border-t border-gray-100/50 dark:border-zinc-900/10">
              <span className="text-gray-400 dark:text-zinc-500 shrink-0 w-16">휴무일</span>
              <span className="text-gray-700 dark:text-zinc-300">{detail.restdate.replace(/<[^>]*>/g, '')}</span>
            </div>
          )}

          {detail.parking && (
            <div className="flex  items-start gap-4 pt-1 border-t border-gray-100/50 dark:border-zinc-900/10">
              <span className="text-gray-400 dark:text-zinc-500 shrink-0 w-16">주차시설</span>
              <span className="text-gray-700 dark:text-zinc-300">{detail.parking.replace(/<[^>]*>/g, '')}</span>
            </div>
          )}
        </div>

        {/* 3. 주변 추천 여행지 (가까운 순 우선 적용 + 3:4 세로 스크롤 카드) */}
        {filteredNearby.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold flex items-center gap-1.5 text-gray-800 dark:text-zinc-200">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {isDistanceBased ? '주변 및 이 지역 추천 여행지' : '이 지역의 추천 여행지'}
              </h2>
            </div>

            <div className="flex gap-4 overflow-x-auto scrollbar-none py-1">
              {filteredNearby.map((nearbyItem) => (
                <Link
                  key={nearbyItem.contentid}
                  href={`/trip/${nearbyItem.contentid}`}
                  className="w-28 shrink-0 flex flex-col gap-2 group transition-transform active:scale-95"
                >
                  <div className="relative w-28 aspect-[3/4] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-sm">
                    <Image
                      src={getImageUrl(nearbyItem.firstimage)}
                      alt={nearbyItem.title}
                      fill
                      sizes="112px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                    {nearbyItem.dist && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 dark:bg-black/85 backdrop-blur-[2px] text-[9px] font-semibold text-white rounded-md flex items-center gap-0.5 shadow-sm">
                        <MapPin className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                        <span>{formatDistance(nearbyItem.dist)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 px-0.5">
                    <h3 className="text-[11px] font-bold text-gray-800 dark:text-zinc-200 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {nearbyItem.title}
                    </h3>
                    <p className="text-[9px] text-gray-400 dark:text-zinc-500 line-clamp-1">
                      {nearbyItem.addr1?.split(' ')[1] || '관광지'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-3 mt-4">
          <button className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors dark:bg-blue-500 dark:hover:bg-blue-600">
            <Navigation className="w-4 h-4" />
            길찾기 시작
          </button>
        </div>
      </main>
    </div>
  );
}
