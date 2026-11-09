/** 모든 화면의 공통 메뉴. 로그인 상태는 AuthContext에서 공유한다. */
import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./Button";

export function Layout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [dismissedKey, setDismissedKey] = useState(null);
  const notice = typeof location.state?.notice === "string" ? location.state.notice : null;
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">📎 Bookmark Keeper</div>
        <nav aria-label="주요 메뉴">
          <NavLink to="/" end>홈</NavLink>
          <NavLink to="/bookmarks" end>북마크 목록</NavLink>
          {user && <NavLink to="/bookmarks/new">새 북마크</NavLink>}
          {loading ? <span role="status">로그인 확인 중...</span> : user ? (
            <NavLink to="/profile">내 프로필</NavLink>
          ) : (
            <NavLink to="/login">로그인</NavLink>
          )}
        </nav>
      </header>
      <main className="app-main">
        {notice && dismissedKey !== location.key && (
          <div className="success-notice" role="status">
            <span>{notice}</span>
            <Button type="button" variant="ghost" onClick={() => setDismissedKey(location.key)} aria-label="알림 닫기">닫기</Button>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
