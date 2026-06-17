import { NextRequest, NextResponse } from 'next/server';
import { getNearbyAttractions, getAttractionsByArea, searchAttractions } from '@/lib/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'nearby';
  const keyword = searchParams.get('keyword') || '';
  const mapX = searchParams.get('mapX') || '';
  const mapY = searchParams.get('mapY') || '';
  const radius = parseInt(searchParams.get('radius') || '10000', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const areaCode = searchParams.get('areaCode') || '';
  const contentTypeId = searchParams.get('contentTypeId') || '';

  try {
    // 키워드가 전달된 경우 키워드 검색 API(/searchKeyword2) 우선 적용
    if (keyword.trim() !== '') {
      const data = await searchAttractions(keyword, areaCode || undefined, contentTypeId, limit, page);
      return NextResponse.json(data);
    }

    if (type === 'nearby') {
      if (!mapX || !mapY) {
        return NextResponse.json({ error: 'mapX and mapY parameters are required for type=nearby' }, { status: 400 });
      }
      const data = await getNearbyAttractions(mapX, mapY, radius, limit, page, contentTypeId);
      return NextResponse.json(data);
    } else if (type === 'area') {
      const data = await getAttractionsByArea(areaCode || undefined, limit, page, contentTypeId);
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
