import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

/** 현재 id의 단건 조회. 이전 화면이나 재시도의 늦은 응답은 무시한다. */
export function useBookmark(id) {
  const [state, setState] = useState({ id, bookmark: null, loading: true, error: null });
  const requestSequence = useRef(0);
  const mounted = useRef(false);

  const refetch = useCallback(async () => {
    if (!mounted.current) return;
    const request = ++requestSequence.current;
    const isCurrent = () => mounted.current && request === requestSequence.current;
    setState((current) => ({ id, bookmark: current.id === id ? current.bookmark : null, loading: true, error: null }));
    try {
      if (!supabase) throw new Error("Supabase 연결 설정이 필요합니다.");
      const { data, error: fetchError } = await supabase.from("bookmarks")
        .select("*").eq("id", id).maybeSingle();
      if (fetchError) throw fetchError;
      if (isCurrent()) setState((current) => ({ ...current, bookmark: data ?? null }));
    } catch (fetchError) {
      if (isCurrent()) setState((current) => ({ ...current, error: fetchError?.message || "북마크를 불러오지 못했습니다. 다시 시도하세요." }));
    } finally {
      if (isCurrent()) setState((current) => ({ ...current, loading: false }));
    }
  }, [id]);

  useEffect(() => {
    mounted.current = true;
    refetch();
    return () => {
      mounted.current = false;
      requestSequence.current += 1;
    };
  }, [refetch]);

  // id 변경 직후 Effect가 실행되기 전에도 이전 북마크를 새 화면에 노출하지 않는다.
  const current = state.id === id ? state : { bookmark: null, loading: true, error: null };
  return { bookmark: current.bookmark, loading: current.loading, error: current.error, refetch };
}
