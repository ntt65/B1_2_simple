import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getSafeRedirectPath } from "../lib/authRedirect";
import { isSupabaseConfigured } from "../lib/supabase";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Loading } from "../components/Loading";
import { ErrorState } from "../components/ErrorState";

function validate(values, signingUp) {
  const errors = {};
  if (!values.email.trim()) errors.email = "이메일을 입력하세요.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "올바른 이메일 주소를 입력하세요.";
  if (!values.password) errors.password = "비밀번호를 입력하세요.";
  else if (signingUp && values.password.length < 6) errors.password = "비밀번호는 6자 이상으로 입력하세요.";
  if (signingUp && !values.displayName.trim()) errors.displayName = "표시 이름을 입력하세요.";
  return errors;
}

function authErrorMessage(error) {
  if (error.code === "invalid_credentials") return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (error.code === "email_not_confirmed") return "이메일의 확인 링크를 누른 뒤 로그인하세요.";
  if (error.code === "user_already_exists") return "이미 가입된 이메일입니다. 로그인해주세요.";
  if (error.code === "over_email_send_rate_limit") return "확인 메일 요청이 많습니다. 잠시 후 다시 시도하세요.";
  return error.message || "인증 요청에 실패했습니다. 다시 시도하세요.";
}

export function LoginPage() {
  const { user, loading, sessionError, signIn, signUp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = getSafeRedirectPath(new URLSearchParams(location.search).get("redirect"));
  const [mode, setMode] = useState("signin");
  const [values, setValues] = useState({ email: "", password: "", displayName: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const signingUp = mode === "signup";

  function changeMode(nextMode) {
    if (submitting) return;
    setMode(nextMode);
    setErrors({});
    setFormError(null);
    setSuccess(null);
  }

  function handleChange(field) {
    return (event) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError(null);
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || !isSupabaseConfigured) return;
    const nextErrors = validate(values, signingUp);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setFormError(null);
    setSuccess(null);
    try {
      const credentials = { ...values, email: values.email.trim(), redirectTo };
      const { data, error } = signingUp ? await signUp(credentials) : await signIn(credentials);
      if (error) {
        setFormError(authErrorMessage(error));
      } else if (signingUp && !data?.session) {
        setMode("signin");
        setValues((current) => ({ ...current, password: "" }));
        setSuccess("회원가입 요청을 받았습니다. 이메일의 확인 링크를 누른 뒤 로그인하세요.");
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch {
      setFormError("인증 서버에 연결하지 못했습니다. 잠시 후 다시 시도하세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading message="로그인 상태를 확인하는 중..." />;
  if (sessionError) return <ErrorState message={sessionError} onRetry={() => window.location.reload()} />;
  if (user) return <Navigate to={redirectTo} replace />;

  return (
    <section className="auth-page">
      <h1>{signingUp ? "회원가입" : "로그인"}</h1>
      <p>북마크 등록·수정·삭제는 로그인 후 사용할 수 있습니다.</p>
      <div className="auth-actions" role="tablist" aria-label="로그인 방식">
        <Button type="button" role="tab" variant={signingUp ? "secondary" : "primary"} aria-selected={!signingUp} disabled={submitting} onClick={() => changeMode("signin")}>로그인</Button>
        <Button type="button" role="tab" variant={signingUp ? "primary" : "secondary"} aria-selected={signingUp} disabled={submitting} onClick={() => changeMode("signup")}>회원가입</Button>
      </div>
      {!isSupabaseConfigured && <ErrorState message="Supabase 연결 설정이 필요합니다. .env의 프로젝트 URL과 공개 키를 확인하세요." />}
      <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
        {formError && <p className="field-error form-error" role="alert">{formError}</p>}
        {success && <p className="form-success" role="status">{success}</p>}
        {signingUp && <Input id="displayName" label="표시 이름" autoComplete="nickname" value={values.displayName} onChange={handleChange("displayName")} error={errors.displayName} disabled={submitting} maxLength={80} />}
        <Input id="email" label="이메일" type="email" autoComplete="email" value={values.email} onChange={handleChange("email")} error={errors.email} disabled={submitting} />
        <Input id="password" label="비밀번호" type="password" autoComplete={signingUp ? "new-password" : "current-password"} value={values.password} onChange={handleChange("password")} error={errors.password} disabled={submitting} />
        {signingUp && <p className="meta">비밀번호는 6자 이상으로 입력하세요. 설정에 따라 이메일 확인이 필요합니다.</p>}
        <Button type="submit" loading={submitting} disabled={!isSupabaseConfigured}>{signingUp ? "가입하기" : "로그인"}</Button>
      </form>
    </section>
  );
}
