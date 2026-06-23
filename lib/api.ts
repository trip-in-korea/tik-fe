import { unstable_cache } from 'next/cache';
import tourApiInstance from './axios';

export interface TourItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1?: string;
  addr2?: string;
  firstimage?: string;
  firstimage2?: string;
  areacode?: string;
  sigungucode?: string;
  tel?: string;
  zipcode?: string;
  createdtime?: string;
  mapx?: string;
  mapy?: string;
  dist?: string; // 거리 정보 (미터 단위 문자열)
}

export interface TourDetail {
  contentid: string;
  contenttypeid: string;
  title: string;
  firstimage?: string;
  firstimage2?: string;
  addr1?: string;
  addr2?: string;
  tel?: string;
  homepage?: string;
  overview?: string;
  mapx?: string;
  mapy?: string;
  areacode?: string;
  sigungucode?: string;
  // 소개정보조회 (detailIntro2) 필드들
  usetime?: string;
  parking?: string;
  restdate?: string;
  infocenter?: string;
}

const MOCK_ATTRACTIONS: TourItem[] = [
  {
    contentid: "126178",
    contenttypeid: "12",
    title: "경복궁 (Gyeongbokgung)",
    addr1: "서울특별시 종로구 사직로 161",
    firstimage: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800&auto=format&fit=crop&q=60",
    areacode: "1",
    mapx: "126.9770162",
    mapy: "37.579617"
  },
  {
    contentid: "2733967",
    contenttypeid: "12",
    title: "제주도 협재해수욕장",
    addr1: "제주특별자치도 제주시 한림읍 한림로 329-10",
    firstimage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60",
    areacode: "39",
    mapx: "126.2394541",
    mapy: "33.3938596"
  },
  {
    contentid: "126081",
    contenttypeid: "12",
    title: "부산 해운대해수욕장",
    addr1: "부산광역시 해운대구 해운대해변로 264",
    firstimage: "https://images.unsplash.com/photo-1578351723226-eb42fd6bfd25?w=800&auto=format&fit=crop&q=60",
    areacode: "6",
    mapx: "129.1584984",
    mapy: "35.1587756"
  },
  {
    contentid: "128795",
    contenttypeid: "12",
    title: "설악산 국립공원",
    addr1: "강원특별자치도 속초시 설악산로 833",
    firstimage: "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800&auto=format&fit=crop&q=60",
    areacode: "32",
    mapx: "128.4651341",
    mapy: "38.1611732"
  },
  {
    contentid: "125425",
    contenttypeid: "12",
    title: "경주 불국사",
    addr1: "경상북도 경주시 불국로 385",
    firstimage: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800&auto=format&fit=crop&q=60",
    areacode: "35",
    mapx: "129.331777",
    mapy: "35.790176"
  },
  {
    contentid: "127641",
    contenttypeid: "12",
    title: "여수 돌산공원",
    addr1: "전라남도 여수시 돌산읍 돌산로 3600-1",
    firstimage: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop&q=60",
    areacode: "38",
    mapx: "127.746011",
    mapy: "34.729737"
  },
  {
    contentid: "2504824",
    contenttypeid: "12",
    title: "수원 화성 행궁",
    addr1: "경기도 수원시 팔달구 정조로 825",
    firstimage: "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?w=800&auto=format&fit=crop&q=60",
    areacode: "31",
    mapx: "127.0135899",
    mapy: "37.2825707"
  }
];

// 두 위경도 좌표 사이의 거리를 계산하는 하버사인 공식 (Mock 폴백용)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // 지구 반경 (미터)
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위 거리 반환
}

/**
 * 매일 자정에 캐시가 갱신되도록 오늘 날짜 문자열(KST 기준)을 계산합니다.
 */
function getTodayStringKST(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  return kstDate.toISOString().split('T')[0];
}

/**
 * 인기 관광지 목록 가져오기 (홈 화면용)
 */
export const getPopularAttractions = unstable_cache(
  async (limit: number = 10): Promise<TourItem[]> => {
    if (!process.env.NEXT_PUBLIC_TOUR_API_KEY || process.env.NEXT_PUBLIC_TOUR_API_KEY.includes('YOUR_TOUR_API_SERVICE_KEY')) {
      console.warn('API Key is not configured. Returning mock attractions.');
      return MOCK_ATTRACTIONS.slice(0, limit);
    }

    try {
      const response = await tourApiInstance.get('/areaBasedList2', {
        params: {
          contentTypeId: '12',
          arrange: 'Q', // 인기순/수정일순 정렬
          numOfRows: limit,
          pageNo: 1
        },
      });

      const items = response.data?.response?.body?.items?.item;
      if (!items) return MOCK_ATTRACTIONS.slice(0, limit);
      return Array.isArray(items) ? items : [items];
    } catch (error) {
      console.error('Error fetching popular attractions. Returning mock data instead.', error);
      return MOCK_ATTRACTIONS.slice(0, limit);
    }
  },
  ['popular-attractions-v4'],
  {
    revalidate: 86400, // 24시간 캐싱
  }
);

/**
 * 지역별 관광지 목록 가져오기 (관광지 목록 페이지용)
 */
export const getAttractionsByArea = async (
  areaCode?: string,
  limit: number = 20,
  pageNo: number = 1,
  contentTypeId?: string
): Promise<{ items: TourItem[]; totalCount: number }> => {
  const today = getTodayStringKST();
  const cacheKey = `attractions-area-v4-${areaCode || 'all'}-${pageNo}-${contentTypeId || 'all'}-${today}`;

  const fetcher = unstable_cache(
    async (): Promise<{ items: TourItem[]; totalCount: number }> => {
      if (!process.env.NEXT_PUBLIC_TOUR_API_KEY || process.env.NEXT_PUBLIC_TOUR_API_KEY.includes('YOUR_TOUR_API_SERVICE_KEY')) {
        console.warn('API Key is not configured. Returning mock attractions for area:', areaCode);
        const filtered = !areaCode
          ? MOCK_ATTRACTIONS
          : MOCK_ATTRACTIONS.filter(item => item.areacode === areaCode);
        const startIndex = (pageNo - 1) * limit;
        return {
          items: filtered.slice(startIndex, startIndex + limit),
          totalCount: filtered.length
        };
      }

      try {
        const response = await tourApiInstance.get('/areaBasedList2', {
          params: {
            contentTypeId: contentTypeId || undefined,
            arrange: 'Q',
            numOfRows: limit,
            pageNo,
            areaCode: areaCode || undefined,
          },
        });

        const items = response.data?.response?.body?.items?.item;
        const totalCount = parseInt(response.data?.response?.body?.totalCount || '0', 10);
        if (!items) {
          const filtered = !areaCode
            ? MOCK_ATTRACTIONS
            : MOCK_ATTRACTIONS.filter(item => item.areacode === areaCode);
          const startIndex = (pageNo - 1) * limit;
          return {
            items: filtered.slice(startIndex, startIndex + limit),
            totalCount: filtered.length
          };
        }
        return {
          items: Array.isArray(items) ? items : [items],
          totalCount
        };
      } catch (error) {
        console.error(`Error fetching attractions for area ${areaCode} using areaBasedList2. Returning mock data.`, error);
        const filtered = !areaCode
          ? MOCK_ATTRACTIONS
          : MOCK_ATTRACTIONS.filter(item => item.areacode === areaCode);
        const startIndex = (pageNo - 1) * limit;
        return {
          items: filtered.slice(startIndex, startIndex + limit),
          totalCount: filtered.length
        };
      }
    },
    [cacheKey],
    {
      revalidate: 86400,
    }
  );

  return fetcher();
};

/**
 * 키워드 검색 조회 (/searchKeyword2 API 활용 - 검색 액션 시 작동)
 */
export const searchAttractions = async (
  keyword: string,
  areaCode?: string,
  contentTypeId?: string,
  limit: number = 20,
  pageNo: number = 1
): Promise<{ items: TourItem[]; totalCount: number }> => {
  const today = getTodayStringKST();
  const cacheKey = `search-attractions-v4-${keyword}-${areaCode || 'all'}-${contentTypeId || 'all'}-${pageNo}-${today}`;

  const fetcher = unstable_cache(
    async (): Promise<{ items: TourItem[]; totalCount: number }> => {
      if (!process.env.NEXT_PUBLIC_TOUR_API_KEY || process.env.NEXT_PUBLIC_TOUR_API_KEY.includes('YOUR_TOUR_API_SERVICE_KEY')) {
        console.warn('API Key is not configured. Returning mock search results for keyword:', keyword);
        // Mock 데이터 기반 필터링
        const filtered = MOCK_ATTRACTIONS.filter(item =>
          item.title.toLowerCase().includes(keyword.toLowerCase()) ||
          (item.addr1 && item.addr1.toLowerCase().includes(keyword.toLowerCase()))
        ).filter(item => !areaCode || item.areacode === areaCode);

        const startIndex = (pageNo - 1) * limit;
        return {
          items: filtered.slice(startIndex, startIndex + limit),
          totalCount: filtered.length
        };
      }

      try {
        const response = await tourApiInstance.get('/searchKeyword2', {
          params: {
            keyword,
            contentTypeId: contentTypeId || undefined,
            areaCode: areaCode || undefined,
            arrange: 'Q', // 인기순
            numOfRows: limit,
            pageNo,
          },
        });

        const items = response.data?.response?.body?.items?.item;
        const totalCount = parseInt(response.data?.response?.body?.totalCount || '0', 10);
        if (!items) return { items: [], totalCount: 0 };
        return {
          items: Array.isArray(items) ? items : [items],
          totalCount
        };
      } catch (error) {
        console.error(`Error searching keyword ${keyword}:`, error);
        return { items: [], totalCount: 0 };
      }
    },
    [cacheKey],
    {
      revalidate: 86400,
    }
  );

  return fetcher();
};

/**
 * 지역기반 관광정보조회 (areaBasedList2 API 활용 - 상세보기 하단 주변 여행지 소개용)
 */
export const getAreaBasedList2 = async (
  areaCode?: string,
  limit: number = 10
): Promise<TourItem[]> => {
  const today = getTodayStringKST();
  const cacheKey = `area-based-list2-v4-${areaCode || 'all'}-${today}`;

  const fetcher = unstable_cache(
    async (): Promise<TourItem[]> => {
      if (!process.env.NEXT_PUBLIC_TOUR_API_KEY || process.env.NEXT_PUBLIC_TOUR_API_KEY.includes('YOUR_TOUR_API_SERVICE_KEY')) {
        console.warn('API Key is not configured. Returning mock attractions for AreaBasedList2:', areaCode);
        if (!areaCode) return MOCK_ATTRACTIONS.slice(0, limit);
        return MOCK_ATTRACTIONS.filter(item => item.areacode === areaCode).slice(0, limit);
      }

      try {
        const response = await tourApiInstance.get('/areaBasedList2', {
          params: {
            contentTypeId: '12',
            arrange: 'Q',
            numOfRows: limit,
            areaCode: areaCode || undefined,
          },
        });

        const items = response.data?.response?.body?.items?.item;
        if (!items) {
          if (!areaCode) return MOCK_ATTRACTIONS.slice(0, limit);
          return MOCK_ATTRACTIONS.filter(item => item.areacode === areaCode).slice(0, limit);
        }
        return Array.isArray(items) ? items : [items];
      } catch (error) {
        console.error(`Error fetching areaBasedList2 for area ${areaCode}:`, error);
        if (!areaCode) return MOCK_ATTRACTIONS.slice(0, limit);
        return MOCK_ATTRACTIONS.filter(item => item.areacode === areaCode).slice(0, limit);
      }
    },
    [cacheKey],
    {
      revalidate: 86400,
    }
  );

  return fetcher();
};

/**
 * 위치기반 관광정보조회 (locationBasedList2 API 활용 - 가까운 주변 관광지 조회 및 거리 정보 획득용)
 */
export const getNearbyAttractions = async (
  mapX: string,
  mapY: string,
  radius: number = 10000, // 기본 반경 10km
  limit: number = 10,
  pageNo: number = 1,
  contentTypeId?: string
): Promise<{ items: TourItem[]; totalCount: number }> => {
  const today = getTodayStringKST();
  const cacheKey = `nearby-attractions-v4-${mapX}-${mapY}-${radius}-${pageNo}-${contentTypeId || 'all'}-${today}`;

  const fetcher = unstable_cache(
    async (): Promise<{ items: TourItem[]; totalCount: number }> => {
      if (!process.env.NEXT_PUBLIC_TOUR_API_KEY || process.env.NEXT_PUBLIC_TOUR_API_KEY.includes('YOUR_TOUR_API_SERVICE_KEY')) {
        console.warn('API Key is not configured. Returning mock attractions calculated by distance.');

        // Mock 데이터를 기준으로 하버사인 공식을 이용해 거리 정렬 및 주입
        const currentLat = parseFloat(mapY);
        const currentLon = parseFloat(mapX);

        if (isNaN(currentLat) || isNaN(currentLon)) {
          return { items: MOCK_ATTRACTIONS.slice(0, limit), totalCount: MOCK_ATTRACTIONS.length };
        }

        const sorted = MOCK_ATTRACTIONS
          .map(item => {
            const itemLat = parseFloat(item.mapy || '0');
            const itemLon = parseFloat(item.mapx || '0');
            const distMeters = getDistance(currentLat, currentLon, itemLat, itemLon);
            return {
              ...item,
              dist: String(Math.round(distMeters))
            };
          })
          .sort((a, b) => parseFloat(a.dist || '0') - parseFloat(b.dist || '0'));

        const startIndex = (pageNo - 1) * limit;
        return {
          items: sorted.slice(startIndex, startIndex + limit),
          totalCount: sorted.length
        };
      }

      try {
        const response = await tourApiInstance.get('/locationBasedList2', {
          params: {
            contentTypeId: contentTypeId || undefined,
            mapX,
            mapY,
            radius,
            arrange: 'O', // 거리순 정렬 (Proximity First)
            numOfRows: limit,
            pageNo
          },
        });

        const items = response.data?.response?.body?.items?.item;
        const totalCount = parseInt(response.data?.response?.body?.totalCount || '0', 10);
        if (!items) return { items: [], totalCount: 0 };
        return {
          items: Array.isArray(items) ? items : [items],
          totalCount
        };
      } catch (error) {
        console.error('Error fetching locationBasedList2 for nearby attractions:', error);
        return { items: [], totalCount: 0 };
      }
    },
    [cacheKey],
    {
      revalidate: 86400,
    }
  );

  return fetcher();
};

/**
 * 관광지 상세 정보 가져오기 (detailCommon2 & detailIntro2 통합 호출)
 */
export const getAttractionDetail = async (
  contentId: string,
  contentTypeId: string = '12'
): Promise<TourDetail | null> => {
  const today = getTodayStringKST();
  const cacheKey = `attraction-detail-v4-${contentId}-${today}`;

  const fetcher = unstable_cache(
    async (): Promise<TourDetail | null> => {
      if (!process.env.NEXT_PUBLIC_TOUR_API_KEY || process.env.NEXT_PUBLIC_TOUR_API_KEY.includes('YOUR_TOUR_API_SERVICE_KEY')) {
        const mockItem = MOCK_ATTRACTIONS.find(item => item.contentid === contentId);
        if (!mockItem) return null;
        return {
          ...mockItem,
          overview: `${mockItem.title}은(는) 수려한 경관과 깊은 역사적 의의를 지닌 곳으로, 연중 많은 방문객들이 찾는 대한민국의 대표적인 명소입니다.`,
          usetime: '09:00 ~ 18:00 (입장 마감 17:00)',
          parking: '주차 가능 (대형 및 소형 주차 공간 완비)',
          restdate: '매주 월요일 정기 휴무',
          infocenter: '02-1234-5678',
        };
      }

      try {
        // 1. 공통정보조회 (detailCommon2)
        const commonResponse = await tourApiInstance.get('/detailCommon2', {
          params: {
            contentId,
          },
        });

        // 2. 소개정보조회 (detailIntro2)
        let introData: any = {};
        try {
          const introResponse = await tourApiInstance.get('/detailIntro2', {
            params: {
              contentId,
              contentTypeId,
            },
          });
          const introItem = introResponse.data?.response?.body?.items?.item;
          if (introItem) {
            introData = Array.isArray(introItem) ? introItem[0] : introItem;
          }
        } catch (e) {
          console.error(`Error fetching detailIntro2 for ${contentId}:`, e);
        }

        const commonItem = commonResponse.data?.response?.body?.items?.item;
        if (!commonItem) return null;
        const common = Array.isArray(commonItem) ? commonItem[0] : commonItem;

        return {
          contentid: common.contentid || contentId,
          contenttypeid: common.contenttypeid || contentTypeId,
          title: common.title || '',
          firstimage: common.firstimage || '',
          firstimage2: common.firstimage2 || '',
          addr1: common.addr1 || '',
          addr2: common.addr2 || '',
          tel: common.tel || '',
          homepage: common.homepage || '',
          overview: common.overview || '',
          mapx: common.mapx || '',
          mapy: common.mapy || '',
          areacode: common.areacode || '',
          sigungucode: common.sigungucode || '',
          // 소개정보 필드 맵핑
          usetime: introData.usetime || introData.playtime || '',
          parking: introData.parking || introData.parkingfee || '',
          restdate: introData.restdate || '',
          infocenter: introData.infocenter || '',
        };
      } catch (error) {
        console.error(`Error fetching attraction detail for ${contentId}:`, error);
        const mockItem = MOCK_ATTRACTIONS.find(item => item.contentid === contentId);
        if (!mockItem) return null;
        return {
          ...mockItem,
          overview: `${mockItem.title}은(는) 수려한 경관과 깊은 역사적 의의를 지닌 곳으로, 연중 많은 방문객들이 찾는 대한민국의 대표적인 명소입니다.`,
          usetime: '09:00 ~ 18:00 (입장 마감 17:00)',
          parking: '주차 가능 (대형 및 소형 주차 공간 완비)',
          restdate: '매주 월요일 정기 휴무',
          infocenter: '02-1234-5678',
        };
      }
    },
    [cacheKey],
    {
      revalidate: 86400,
    }
  );

  return fetcher();
};

export interface FestivalItem extends TourItem {
  eventstartdate?: string; // YYYYMMDD
  eventenddate?: string;   // YYYYMMDD
}

export const MOCK_FESTIVALS: FestivalItem[] = [
  {
    contentid: "100001",
    contenttypeid: "15",
    title: "서울 장미 축제 2026",
    addr1: "서울특별시 중랑구 중랑천로 332",
    firstimage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=60",
    areacode: "1",
    eventstartdate: "20260601",
    eventenddate: "20260630"
  },
  {
    contentid: "100002",
    contenttypeid: "15",
    title: "제주 수국 페스티벌 2026",
    addr1: "제주특별자치도 서귀포시 남원읍 신흥리",
    firstimage: "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=800&auto=format&fit=crop&q=60",
    areacode: "39",
    eventstartdate: "20260610",
    eventenddate: "20260625"
  },
  {
    contentid: "100003",
    contenttypeid: "15",
    title: "부산 해운대 모래 축제 2026",
    addr1: "부산광역시 해운대구 해운대해변로 264",
    firstimage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60",
    areacode: "6",
    eventstartdate: "20260615",
    eventenddate: "20260622"
  },
  {
    contentid: "100004",
    contenttypeid: "15",
    title: "대구 치맥 페스티벌 2026",
    addr1: "대구광역시 달서구 공원순환로 201",
    firstimage: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=60",
    areacode: "4",
    eventstartdate: "20260701",
    eventenddate: "20260710"
  },
  {
    contentid: "100005",
    contenttypeid: "15",
    title: "해운대 서머 뮤직 페스타 2026",
    addr1: "부산광역시 해운대구 우동",
    firstimage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60",
    areacode: "6",
    eventstartdate: "20260715",
    eventenddate: "20260815"
  },
  {
    contentid: "100006",
    contenttypeid: "15",
    title: "인천 펜타포트 락 페스티벌 2026",
    addr1: "인천광역시 연수구 센트럴로 350",
    firstimage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60",
    areacode: "2",
    eventstartdate: "20260805",
    eventenddate: "20260809"
  },
  {
    contentid: "100007",
    contenttypeid: "15",
    title: "안동 국제 탈춤 페스티벌 2026",
    addr1: "경상북도 안동시 육사로 239",
    firstimage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=60",
    areacode: "35",
    eventstartdate: "20260910",
    eventenddate: "20260920"
  },
  {
    contentid: "100008",
    contenttypeid: "15",
    title: "담양 대나무 축제 2026",
    addr1: "전라남도 담양군 담양읍 죽녹원로 119",
    firstimage: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&auto=format&fit=crop&q=60",
    areacode: "38",
    eventstartdate: "20260501",
    eventenddate: "20260505"
  },
  {
    contentid: "100009",
    contenttypeid: "15",
    title: "진해 군항제 (벚꽃 축제) 2026",
    addr1: "경상남도 창원시 진해구 통신동",
    firstimage: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&auto=format&fit=crop&q=60",
    areacode: "36",
    eventstartdate: "20260405",
    eventenddate: "20260412"
  },
  {
    contentid: "100010",
    contenttypeid: "15",
    title: "광양 매화 축제 2026",
    addr1: "전라남도 광양시 다압면 섬진강매화로 1563-1",
    firstimage: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60",
    areacode: "38",
    eventstartdate: "20260320",
    eventenddate: "20260325"
  },
  {
    contentid: "100011",
    contenttypeid: "15",
    title: "강릉 단오제 2026",
    addr1: "강원특별자치도 강릉시 단오장길 1",
    firstimage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=60",
    areacode: "32",
    eventstartdate: "20260610",
    eventenddate: "20260624"
  },
  {
    contentid: "100012",
    contenttypeid: "15",
    title: "수원 화성 행궁 야간개장 축제 2026",
    addr1: "경기도 수원시 팔달구 정조로 825",
    firstimage: "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?w=800&auto=format&fit=crop&q=60",
    areacode: "31",
    eventstartdate: "20260601",
    eventenddate: "20260630"
  }
];

/**
 * 행사/축제 정보 조회 (/searchFestival2 API 활용)
 */
// 지역 코드 또는 행정코드/주소 기반 로컬 필터 매칭 함수
const matchArea = (item: FestivalItem, areaCode: string): boolean => {
  const itemArea = item.areacode || (item as any).areaCode;
  if (itemArea === areaCode) return true;

  const lDong = (item as any).lDongRegnCd || '';
  const areaMap: Record<string, string> = {
    '1': '11',  // 서울
    '2': '28',  // 인천
    '3': '30',  // 대전
    '4': '27',  // 대구
    '5': '29',  // 광주
    '6': '26',  // 부산
    '7': '31',  // 울산
    '8': '36',  // 세종
    '31': '41', // 경기
    '32': '51', // 강원
    '33': '43', // 충북
    '34': '44', // 충남
    '35': '47', // 경북
    '36': '48', // 경남
    '37': '45', // 전북
    '38': '46', // 전남
    '39': '50', // 제주
  };
  if (lDong && areaMap[areaCode] && lDong.startsWith(areaMap[areaCode])) {
    return true;
  }

  const addr = item.addr1 || '';
  const areaNames: Record<string, string[]> = {
    '1': ['서울'],
    '2': ['인천'],
    '3': ['대전'],
    '4': ['대구'],
    '5': ['광주'],
    '6': ['부산'],
    '7': ['울산'],
    '8': ['세종'],
    '31': ['경기', '수원', '성남', '고양', '용인', '부천', '안산', '안양', '남양주', '화성', '평택', '의정부', '파주', '시흥', '김포', '광명', '광주시', '군포', '이천', '오산', '하남', '양주', '구리', '포천', '의왕', '여주', '동두천', '양평', '가평', '연천'],
    '32': ['강원', '춘천', '원주', '강릉', '동해', '태백', '속초', '삼척', '홍천', '횡성', '영월', '평창', '정선', '철원', '화천', '양구', '인제', '고성군', '양양'],
    '33': ['충북', '충청북도', '청주', '충주', '제천', '보은', '옥천', '영동', '증평', '진천', '괴산', '음성', '단양'],
    '34': ['충남', '충청남도', '천안', '공주', '보령', '아산', '서산', '논산', '계룡', '당진', '금산', '부여', '서천', '청양', '홍성', '예산', '태안'],
    '35': ['경북', '경상북도', '포항', '경주', '김천', '안동', '구미', '영주', '영천', '상주', '문경', '경산', '군위', '의성', '청송', '영양', '영덕', '청도', '고령', '성주', '칠곡', '예천', '봉화', '울진', '울릉'],
    '36': ['경남', '경상남도', '창원', '진주', '통영', '사천', '김해', '밀양', '거제', '양산', '의령', '함안', '창녕', '고성군', '남해', '하동', '산청', '함양', '거창', '합천'],
    '37': ['전북', '전라북도', '전주', '군산', '익산', '정읍', '남원', '김제', '완주', '진안', '무주', '장수', '임실', '순창', '고창', '부안'],
    '38': ['전남', '전라남도', '목포', '여수', '순천', '나주', '광양', '담양', '곡성', '구례', '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안', '함평', '영광', '장성', '완도', '진도', '신안'],
    '39': ['제주'],
  };
  const names = areaNames[areaCode];
  if (names && names.some(name => addr.includes(name))) {
    return true;
  }

  return false;
};

/**
 * 행사/축제 정보 조회 (/searchFestival2 API 활용)
 */
export const getFestivals = async (
  eventStartDate: string,
  areaCode?: string,
  limit: number = 30,
  pageNo: number = 1
): Promise<{ items: FestivalItem[]; totalCount: number }> => {
  const today = getTodayStringKST();
  const cacheKey = `festivals-v4-${eventStartDate || 'none'}-${areaCode || 'all'}-${pageNo}-${today}`;

  const fetcher = unstable_cache(
    async (): Promise<{ items: FestivalItem[]; totalCount: number }> => {
      if (!process.env.NEXT_PUBLIC_TOUR_API_KEY || process.env.NEXT_PUBLIC_TOUR_API_KEY.includes('YOUR_TOUR_API_SERVICE_KEY')) {
        console.warn('API Key is not configured. Returning mock festivals.');
        let filtered = MOCK_FESTIVALS;
        if (areaCode) {
          filtered = filtered.filter(item => matchArea(item, areaCode));
        }
        const startIndex = (pageNo - 1) * limit;
        return {
          items: filtered.slice(startIndex, startIndex + limit),
          totalCount: filtered.length
        };
      }

      try {
        // 공공데이터 API의 searchFestival2 endpoint는 areaCode 입력 시 결과가 0건으로 나오는 서버 측 필터링 오동작이 있을 수 있습니다.
        // 따라서 API로부터 해당 월의 축제를 충분히 가져온 후, 로컬에서 매칭 필터링을 수행합니다.
        const response = await tourApiInstance.get('/searchFestival2', {
          params: {
            eventStartDate: eventStartDate || undefined,
            arrange: 'A',
            numOfRows: 500, // 한 달 단위 최대 500개의 축제 데이터 확보
            pageNo: 1,      // 로컬 필터링을 위해 첫 페이지에서 다량 로드
          },
        });

        const items = response.data?.response?.body?.items?.item;
        if (!items) {
          let filtered = MOCK_FESTIVALS;
          if (areaCode) {
            filtered = filtered.filter(item => matchArea(item, areaCode));
          }
          const startIndex = (pageNo - 1) * limit;
          return { items: filtered.slice(startIndex, startIndex + limit), totalCount: filtered.length };
        }

        const rawItems = Array.isArray(items) ? items : [items];
        const filteredItems = areaCode
          ? rawItems.filter((item) => matchArea(item, areaCode))
          : rawItems;

        const totalCount = filteredItems.length;
        const startIndex = (pageNo - 1) * limit;
        const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);

        return {
          items: paginatedItems,
          totalCount
        };
      } catch (error) {
        console.error('Error fetching festivals via searchFestival2. Returning mock data.', error);
        let filtered = MOCK_FESTIVALS;
        if (areaCode) {
          filtered = filtered.filter(item => matchArea(item, areaCode));
        }
        const startIndex = (pageNo - 1) * limit;
        return {
          items: filtered.slice(startIndex, startIndex + limit),
          totalCount: filtered.length
        };
      }
    },
    [cacheKey],
    {
      revalidate: 86400,
    }
  );

  return fetcher();
};

