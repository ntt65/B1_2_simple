import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

/** 목록과 비동기 상태를 관리하고, 가장 최근 조회의 결과만 반영한다. */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestSequence = useRef(0);
  const mounted = useRef(false);

  const refetch = useCallback(async () => {
    if (!mounted.current) return;
    const request = ++requestSequence.current;
    const isCurrent = () => mounted.current && request === requestSequence.current;
    setLoading(true);
    setError(null);
    try {
      if (!supabase) throw new Error("Supabase 연결 설정이 필요합니다.");
      const { data, error: fetchError } = await supabase.from("bookmarks")
        .select("*").order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      if (isCurrent()) setBookmarks(data ?? []);
    } catch (fetchError) {
      if (isCurrent()) setError(fetchError?.message || "북마크 목록을 불러오지 못했습니다. 다시 시도하세요.");
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refetch();
    return () => {
      mounted.current = false;
      requestSequence.current += 1;
    };
  }, [refetch]);

  return { bookmarks, loading, error, refetch };
}
