import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth는 AuthProvider 안에서 사용해야 합니다.");
  return auth;
}
