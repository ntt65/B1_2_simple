/** 상세 조회는 공개하고, 수정·삭제는 로그인한 사용자에게 제공한다. */
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useBookmark } from "../hooks/useBookmark";
import { useAuth } from "../hooks/useAuth";
import { Loading } from "../components/Loading";
import { ErrorState } from "../components/ErrorState";
import { Button } from "../components/Button";
import { supabase, requireAuthenticatedUser } from "../lib/supabase";
import { getSafeBookmarkUrl } from "../lib/bookmarkUrl";
import { getBookmarkErrorMessage } from "../lib/bookmarkErrors";

export function BookmarkDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { bookmark, loading, error, refetch } = useBookmark(id);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await requireAuthenticatedUser();
      const { data, error: requestError } = await supabase.from("bookmarks")
        .delete().eq("id", id).select("id").maybeSingle();
      if (requestError) throw requestError;
      if (!data) throw new Error("삭제할 북마크가 없거나 삭제 권한이 없습니다.");
      navigate("/bookmarks", { state: { notice: "북마크를 삭제했습니다." } });
    } catch (error) {
      setDeleteError(getBookmarkErrorMessage(error, "삭제"));
    } finally {
      setDeleting(false);
    }
  }
  if (loading) return <Loading message="북마크를 불러오는 중..." />;
  if (error) return <ErrorState message="요청에 실패했습니다. 다시 시도하세요." onRetry={refetch} />;
  if (!bookmark) return <ErrorState message="해당 북마크를 찾을 수 없습니다." />;
  const safeUrl = getSafeBookmarkUrl(bookmark.url);
  return (
    <section>
      <span className="badge">{bookmark.category}</span>
      <h1>{bookmark.title}</h1>
      <p>{safeUrl ? <a href={safeUrl} target="_blank" rel="noreferrer">{bookmark.url}</a> : bookmark.url}</p>
      {!safeUrl && <p className="field-error">유효한 http(s) 주소가 아니어서 링크를 열 수 없습니다.</p>}
      {bookmark.memo && <p className="bookmark-memo">{bookmark.memo}</p>}
      <p className="meta">등록일: {new Date(bookmark.created_at).toLocaleString()}</p>
      {deleteError && <p className="field-error" role="alert">{deleteError}</p>}
      <div className="detail-actions">
        {user && !authLoading && (
          <>
            <Link className="btn btn-secondary" to={`/bookmarks/${id}/edit`}>수정</Link>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>삭제</Button>
          </>
        )}
        {!user && !authLoading && (
          <Link className="btn btn-secondary" to={`/login?redirect=${encodeURIComponent(`/bookmarks/${id}`)}`}>로그인하고 수정하기</Link>
        )}
        <Link className="btn btn-ghost" to="/bookmarks">목록으로</Link>
      </div>
    </section>
  );
}
