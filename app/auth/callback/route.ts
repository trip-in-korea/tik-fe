import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // 로그인 성공 후 보낼 목적지 (기본값: 홈 화면)
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('OAuth exchange error:', error);
  }

  // 로그인 인증 실패 시 에러 쿼리 스트링과 함께 로그인 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
