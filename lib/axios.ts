import axios from 'axios';

/**
 * 한국관광공사 (TourAPI 4.0) Axios 기본 인스턴스
 * 
 * [주의] 공공데이터포털(data.go.kr)의 서비스키는 이미 인코딩되어 제공되는 경우가 많습니다.
 * Axios의 기본 serializer는 파라미터를 한 번 더 인코딩하므로 승인되지 않은 키 에러가 발생할 수 있습니다.
 * 이를 방지하기 위해 `paramsSerializer`를 통해 `serviceKey`가 이중 인코딩되지 않도록 설정했습니다.
 */
export const tourApiInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_TOUR_API_BASE_URL || 'https://apis.data.go.kr/B551011/KorService2',
  params: {
    MobileOS: 'ETC',
    MobileApp: 'DadaTrip',
    _type: 'json', // JSON 형식 응답 설정 (필수)
  },
  paramsSerializer: {
    serialize: (params) => {
      return Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => {
          if (key === 'serviceKey') {
            // serviceKey는 이미 인코딩되어 있을 수 있으므로 인코딩을 생략하거나
            // 이미 디코딩된 키인 경우 정상 동작하도록 그대로 전달합니다.
            return `${key}=${value}`;
          }
          return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
        })
        .join('&');
    },
  },
});

// 요청 인터셉터: 환경 변수에서 서비스 키를 매 요청마다 주입
tourApiInstance.interceptors.request.use(
  (config) => {
    const serviceKey = process.env.NEXT_PUBLIC_TOUR_API_KEY;
    if (serviceKey) {
      config.params = {
        ...config.params,
        serviceKey,
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 데이터 추출 및 에러 핸들링 편의성 제공
tourApiInstance.interceptors.response.use(
  (response) => {
    // 공공데이터 API는 에러 상황에서도 200 OK를 반환하고 body 내 header에 에러 상태를 내려주는 경우가 많습니다.
    const responseData = response.data;
    if (responseData?.response?.header?.resultCode !== '0000' && responseData?.response?.header?.resultCode !== undefined) {
      return Promise.reject(new Error(responseData.response.header.resultMsg || 'API Error'));
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default tourApiInstance;
