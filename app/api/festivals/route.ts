import { NextRequest, NextResponse } from 'next/server';
import { getFestivals } from '@/lib/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventStartDate = searchParams.get('eventStartDate') || '';
  const areaCode = searchParams.get('areaCode') || '';
  const limit = parseInt(searchParams.get('limit') || '30', 10);
  const page = parseInt(searchParams.get('page') || '1', 10);

  try {
    const data = await getFestivals(eventStartDate, areaCode || undefined, limit, page);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Festivals API Route Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
