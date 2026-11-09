import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getLoginRedirect } from "../lib/authRedirect";
import { Loading } from "./Loading";
import { ErrorState } from "./ErrorState";

export function ProtectedRoute({ children }) {
  const { user, loading, sessionError } = useAuth();
  const location = useLocation();

  if (loading) return <Loading message="로그인 상태를 확인하는 중..." />;
  if (sessionError) return <ErrorState message={sessionError} onRetry={() => window.location.reload()} />;
  if (!user) return <Navigate to={getLoginRedirect(location)} replace />;
  return children ?? <Outlet />;
}
