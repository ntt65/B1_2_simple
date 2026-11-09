/** 공개 조회 화면과 로그인이 필요한 화면을 구분하는 라우트 트리. */
import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SetupNotice } from "./components/SetupNotice";
import { isSupabaseConfigured } from "./lib/supabase";
import { HomePage } from "./pages/HomePage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { BookmarkDetailPage } from "./pages/BookmarkDetailPage";
import { BookmarkNewPage } from "./pages/BookmarkNewPage";
import { BookmarkEditPage } from "./pages/BookmarkEditPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  if (!isSupabaseConfigured) return <SetupNotice />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/bookmarks/:id" element={<BookmarkDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/bookmarks/new" element={<BookmarkNewPage />} />
          <Route path="/bookmarks/:id/edit" element={<BookmarkEditPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
