import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { getEmailRedirectUrl } from "../lib/authRedirect";

export const AuthContext = createContext(null);

const SESSION_ERROR = "로그인 상태를 확인하지 못했습니다. 연결을 확인한 뒤 다시 시도하세요.";

async function authRequest(request) {
  if (!supabase || !isSupabaseConfigured) {
    return { data: null, error: new Error("Supabase 연결 설정이 필요합니다.") };
  }
  try {
    const result = await request();
    return { data: result.data ?? null, error: result.error ?? null };
  } catch {
    return { data: null, error: new Error("인증 서버에 연결하지 못했습니다. 잠시 후 다시 시도하세요.") };
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase && isSupabaseConfigured));
  const [sessionError, setSessionError] = useState(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    if (!supabase || !isSupabaseConfigured) {
      setLoading(false);
      return () => { mounted.current = false; };
    }

    let active = true;
    let authEvents = 0;
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION(null)은 복원 실패 때도 오므로 초기 상태·오류는 getSession이 결정한다.
      if (!active || event === "INITIAL_SESSION") return;
      authEvents += 1;
      setUser(session?.user ?? null);
      setSessionError(null);
      setLoading(false);
    });

    // 늦게 도착한 초기 조회가 더 최근의 로그인·로그아웃 이벤트를 덮지 않게 한다.
    const initialEvents = authEvents;
    async function restoreSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active || authEvents !== initialEvents) return;
        setUser(error ? null : data?.session?.user ?? null);
        setSessionError(error ? SESSION_ERROR : null);
      } catch {
        if (!active || authEvents !== initialEvents) return;
        setUser(null);
        setSessionError(SESSION_ERROR);
      } finally {
        if (active && authEvents === initialEvents) setLoading(false);
      }
    }
    restoreSession();

    return () => {
      active = false;
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const result = await authRequest(() => supabase.auth.signInWithPassword({ email, password }));
    if (!result.error && result.data?.session && mounted.current) {
      setUser(result.data.session.user);
      setSessionError(null);
    }
    return result;
  }, []);

  const signUp = useCallback(async ({ email, password, displayName, redirectTo }) => {
    const result = await authRequest(() => supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: getEmailRedirectUrl(redirectTo),
      },
    }));
    if (!result.error && result.data?.session && mounted.current) {
      setUser(result.data.session.user);
      setSessionError(null);
    }
    return result;
  }, []);

  const signOut = useCallback(async () => {
    const result = await authRequest(() => supabase.auth.signOut());
    if (!result.error && mounted.current) {
      setUser(null);
      setSessionError(null);
    }
    return result;
  }, []);

  const value = useMemo(() => ({ user, loading, sessionError, signIn, signUp, signOut }),
    [user, loading, sessionError, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
