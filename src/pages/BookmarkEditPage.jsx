/** 기존 북마크를 조회하고, 변경 결과를 확인한 뒤 상세 화면으로 이동한다. */
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useBookmark } from "../hooks/useBookmark";
import { BookmarkForm } from "../components/BookmarkForm";
import { Loading } from "../components/Loading";
import { ErrorState } from "../components/ErrorState";
import { supabase, requireAuthenticatedUser } from "../lib/supabase";

export function BookmarkEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bookmark, loading, error, refetch } = useBookmark(id);
  const [submitError, setSubmitError] = useState(null);
  async function handleUpdate(values) {
    setSubmitError(null);
    try {
      await requireAuthenticatedUser();
      const { data, error: updateError } = await supabase.from("bookmarks")
        .update(values).eq("id", id).select("id").maybeSingle();
      if (updateError) throw updateError;
      // RLS 거부나 다른 사용자의 삭제로 변경된 행이 없을 수도 있다.
      if (!data) throw new Error("수정할 북마크가 없거나 수정 권한이 없습니다.");
      navigate(`/bookmarks/${id}`, { state: { notice: "북마크를 수정했습니다." } });
    } catch {
      setSubmitError("수정에 실패했습니다. 북마크의 존재 여부와 로그인 상태를 확인해주세요.");
    }
  }
  if (loading) return <Loading message="북마크를 불러오는 중..." />;
  if (error) return <ErrorState message="요청에 실패했습니다. 다시 시도하세요." onRetry={refetch} />;
  if (!bookmark) return <ErrorState message="해당 북마크를 찾을 수 없습니다." />;
  return (
    <section>
      <h1>북마크 수정</h1>
      <BookmarkForm
        key={id}
        initialValues={{ title: bookmark.title, url: bookmark.url, memo: bookmark.memo ?? "", category: bookmark.category }}
        onSubmit={handleUpdate}
        submitLabel="수정 완료"
        submitError={submitError}
      />
      <Link to={`/bookmarks/${id}`}>취소하고 상세로</Link>
    </section>
  );
}
