/** Supabase 연결과 쓰기 요청 직전의 로그인 확인. */
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
let client = null;

try {
  if (url && anonKey && ["http:", "https:"].includes(new URL(url).protocol)) {
    client = createClient(url, anonKey);
  }
} catch {
  // 설정값이 잘못되어도 앱을 마운트하여 설정 안내를 보여준다.
}

export const supabase = client;
export const isSupabaseConfigured = client !== null;

// 다른 탭에서 로그아웃하거나 세션이 만료된 경우도 쓰기 직전에 확인한다.
// 최종 데이터 접근 권한은 Supabase의 RLS 정책이 검사한다.
export async function requireAuthenticatedUser() {
  if (!supabase) throw new Error("Supabase 연결 설정이 필요합니다.");
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.user) throw new Error("로그인 후 다시 시도해주세요.");
  return data.session.user;
}
