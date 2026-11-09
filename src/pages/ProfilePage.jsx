import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getLoginRedirect } from "../lib/authRedirect";
import { Button } from "../components/Button";
import { Loading } from "../components/Loading";
import { ErrorState } from "../components/ErrorState";

export function ProfilePage() {
  const { user, loading, sessionError, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSignOut() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: signOutError } = await signOut();
      if (signOutError) setError("로그아웃하지 못했습니다. 연결을 확인한 뒤 다시 시도하세요.");
      else navigate("/", { replace: true });
    } catch {
      setError("로그아웃하지 못했습니다. 연결을 확인한 뒤 다시 시도하세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading message="로그인 상태를 확인하는 중..." />;
  if (sessionError) return <ErrorState message={sessionError} onRetry={() => window.location.reload()} />;
  if (!user) return <Navigate to={getLoginRedirect(location)} replace />;

  const displayName = user.user_metadata?.display_name;
  const joined = new Date(user.created_at);

  return (
    <section className="auth-page">
      <h1>프로필</h1>
      <dl className="profile-details">
        <dt>표시 이름</dt><dd>{typeof displayName === "string" && displayName ? displayName : "미설정"}</dd>
        <dt>이메일</dt><dd>{user.email || "이메일 정보 없음"}</dd>
        <dt>가입일</dt><dd>{Number.isNaN(joined.getTime()) ? "확인할 수 없음" : joined.toLocaleDateString("ko-KR")}</dd>
      </dl>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="auth-actions">
        <Link className="btn btn-secondary" to="/bookmarks">북마크 목록으로</Link>
        <Button type="button" onClick={handleSignOut} loading={submitting}>로그아웃</Button>
      </div>
    </section>
  );
}
