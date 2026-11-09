/**
 * @file components/BookmarkList.jsx
 * @overview 북마크 배열을 받아 카드 목록 또는 빈 상태를 렌더하는 컴포넌트.
 */
import { BookmarkCard } from "./BookmarkCard";	// 단일 카드
import { EmptyState } from "./EmptyState";	// 데이터 없음 안내

/**
 * 북마크 목록을 렌더한다. 배열이 비어 있으면 EmptyState를 표시한다.
 * @param {{ bookmarks: Array }} props
 */
export function BookmarkList({ bookmarks, emptyAction }) {
  if (bookmarks.length === 0) {	// 데이터 없음 — 빈 배열이거나 필터 결과가 없을 때
    return <EmptyState message="표시할 데이터가 없습니다." action={emptyAction} />;
  }

  return (
    <div className="bookmark-list">	{/* 카드 그리드 컨테이너 */}
      {bookmarks.map((b) => (
        <BookmarkCard key={b.id} bookmark={b} />
      ))}
    </div>
  );
}
