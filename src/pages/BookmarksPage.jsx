/**
 * @file pages/BookmarksPage.jsx
 * @overview /bookmarks 라우트.
 * 전체 북마크 목록을 가져오고 카테고리 필터로 클라이언트 사이드 필터링한다.
 */
import { useMemo, useState } from "react";	// useMemo: 필터 결과 메모이제이션, useState: 선택 카테고리
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { useBookmarks } from "../hooks/useBookmarks";	// 목록 조회 훅
import { BookmarkList } from "../components/BookmarkList";	// 카드 목록 UI
import { CategoryFilter } from "../components/CategoryFilter";	// 카테고리 탭 필터
import { Loading } from "../components/Loading";	// 로딩 스피너
import { ErrorState } from "../components/ErrorState";	// 에러 메시지 + 재시도

/**
 * 북마크 목록 페이지.
 * 데이터 조회는 useBookmarks에 위임하고, 카테고리 필터 상태만 로컬에서 관리한다.
 */
export function BookmarksPage() {
  const { bookmarks, loading, error, refetch } = useBookmarks();	// 전체 목록 + 비동기 상태
  const [category, setCategory] = useState("all");	// 선택된 카테고리, "all"이면 전체 표시

  const filtered = useMemo(	// category 또는 bookmarks 배열이 바뀔 때만 재계산
    () => (category === "all" ? bookmarks : bookmarks.filter((b) => b.category === category)),	// "all"이면 전체, 아니면 해당 카테고리만 필터
    [bookmarks, category]	// 이 두 값이 바뀔 때만 필터 재실행 — 불필요한 반복 계산 방지
  );

  return (
    <section>
      <h1>북마크 목록</h1>	{/* 페이지 제목 */}
      <CategoryFilter value={category} onChange={setCategory} />	{/* 카테고리 변경 → state 갱신 → filtered 재계산 → 목록 재렌더 */}

      {loading && <Loading message="북마크를 불러오는 중..." />}	{/* 로딩 중 스피너 표시 */}
      {!loading && error && <ErrorState message="요청에 실패했습니다. 다시 시도하세요." onRetry={refetch} />}	{/* 에러 시 메시지 + 재시도 버튼 */}
      {!loading && !error && (
        <BookmarkList
          bookmarks={filtered}
          emptyAction={bookmarks.length > 0 ? (
            <Button variant="secondary" onClick={() => setCategory("all")}>전체 카테고리 보기</Button>
          ) : (
            <Link className="btn btn-primary" to="/bookmarks/new">첫 북마크 등록하기</Link>
          )}
        />
      )}
    </section>
  );
}
