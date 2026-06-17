'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { TourItem } from '@/lib/api';

interface AttractionCardProps {
  item: TourItem;
  addressMode?: 'full' | 'summary';
  showDistance?: boolean;
  showCategory?: boolean;
}

export default function AttractionCard({
  item,
  addressMode = 'full',
  showDistance = true,
  showCategory = true,
}: AttractionCardProps) {
  
  // 1. 거리 표시 포맷팅 헬퍼
  const formatDistance = (distStr?: string) => {
    if (!distStr) return '';
    const meters = parseFloat(distStr);
    if (isNaN(meters)) return '';
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${Math.round(meters)}m`;
  };

  // 2. 주소 요약 헬퍼 (예: 서울특별시 종로구 사직로 161 -> 서울 · 종로구)
  const getAddressSummary = (addr?: string) => {
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

  // 3. 카테고리 ID -> 텍스트 매핑 헬퍼
  const getCategoryLabel = (contentTypeId?: string) => {
    switch (contentTypeId) {
      case '12': return '관광지';
      case '14': return '문화시설';
      case '15': return '축제/행사';
      case '28': return '레포츠';
      case '32': return '숙박';
      case '38': return '쇼핑';
      case '39': return '음식점';
      default: return '관광';
    }
  };

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1548115184-bc6544d06a58';
    return url.startsWith('http://') ? url.replace('http://', 'https://') : url;
  };

  // 주소 출력 결정
  const displayedAddress = addressMode === 'summary' 
    ? getAddressSummary(item.addr1) 
    : (item.addr1 || '상세 주소 없음');

  return (
    <Link
      href={`/trip/${item.contentid}`}
      className="flex flex-col gap-2 group transition-transform active:scale-[0.98]"
    >
      {/* 썸네일 (3:4 비율) */}
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-sm shrink-0">
        <Image
          src={getImageUrl(item.firstimage)}
          alt={item.title}
          fill
          sizes="(max-w-md) 50vw, 200px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />
        {/* 거리 배지 overlay */}
        {showDistance && item.dist && (
          <div className="absolute top-2 left-2 bg-black/60 dark:bg-black/85 backdrop-blur-[2px] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
            <MapPin className="w-2.5 h-2.5 text-blue-400 shrink-0" />
            <span>{formatDistance(item.dist)}</span>
          </div>
        )}
      </div>

      {/* 텍스트 영역 (높이 고정 제거로 1줄 및 2줄 유연 대응) */}
      <div className="flex flex-col px-1 items-start">
        <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-200 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {item.title}
        </h3>
        
        {displayedAddress && (
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 line-clamp-1">
            {displayedAddress}
          </p>
        )}

        {/* 카테고리 태그 뱃지 */}
        {showCategory && (
          <span className="inline-block mt-2 px-2 py-1 bg-gray-100 dark:bg-zinc-900 text-[9px] text-gray-500 dark:text-zinc-400 rounded-md font-semibold tracking-wider">
            {getCategoryLabel(item.contenttypeid)}
          </span>
        )}
      </div>
    </Link>
  );
}
