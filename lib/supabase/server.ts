import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * 서버 환경(Server Component, Route Handler, Server Action)에서 사용할 Supabase 클라이언트를 생성합니다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출될 때는 쿠키를 쓸 수 없어 에러가 발생하므로, 무시합니다.
            // (미들웨어에서 세션 리프레시를 처리하므로 괜찮습니다.)
          }
        },
      },
    }
  );
}
