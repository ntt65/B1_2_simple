/** 새 북마크 등록. 목록 조회 없이 제출한 값만 저장한다. */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookmarkForm } from "../components/BookmarkForm";
import { supabase, requireAuthenticatedUser } from "../lib/supabase";
import { getBookmarkErrorMessage } from "../lib/bookmarkErrors";

export function BookmarkNewPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);
  async function handleCreate(values) {
    setSubmitError(null);
    try {
      const user = await requireAuthenticatedUser();
      const { data, error } = await supabase.from("bookmarks").insert({
        title: values.title,
        url: values.url,
        memo: values.memo,
        category: values.category,
        user_id: user.id,
      }).select().single();
      if (error) throw error;
      if (!data) throw new Error("등록 결과를 확인할 수 없습니다.");
      navigate(`/bookmarks/${data.id}`, { state: { notice: "북마크를 등록했습니다." } });
    } catch (error) {
      setSubmitError(getBookmarkErrorMessage(error, "등록"));
    }
  }
  return (
    <section>
      <h1>새 북마크</h1>
      <BookmarkForm onSubmit={handleCreate} submitLabel="등록" submitError={submitError} />
      <Link to="/bookmarks">목록으로 돌아가기</Link>
    </section>
  );
}
