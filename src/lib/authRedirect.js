const DEFAULT_REDIRECT = "/profile";
const CHECK_ORIGIN = "https://redirect.invalid";

function internalPath(value) {
  if (typeof value !== "string" || !value.startsWith("/")) return null;

  // 중첩 인코딩도 확인해 외부 주소나 로그인 화면으로 돌아가는 경로를 막는다.
  let decoded = value;
  for (let count = 0; count < 8; count += 1) {
    if (decoded.startsWith("//") || decoded.includes("\\") ||
      Array.from(decoded).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return null;
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      if (count === 7) return null;
      decoded = next;
    } catch {
      return null;
    }
  }

  try {
    const checked = new URL(decoded, CHECK_ORIGIN);
    if (checked.origin !== CHECK_ORIGIN || /^\/login(?:\/|$)/i.test(checked.pathname)) return null;
    const target = new URL(value, CHECK_ORIGIN);
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}

export function getSafeRedirectPath(value, fallback = DEFAULT_REDIRECT) {
  return internalPath(value) ?? internalPath(fallback) ?? DEFAULT_REDIRECT;
}

export function getLoginRedirect(location) {
  const target = getSafeRedirectPath(`${location.pathname}${location.search ?? ""}${location.hash ?? ""}`);
  return `/login?redirect=${encodeURIComponent(target)}`;
}

export function getEmailRedirectUrl(redirectTo) {
  const currentOrigin = typeof window === "undefined" ? undefined : window.location.origin;
  for (const value of [import.meta.env.VITE_APP_URL, currentOrigin]) {
    try {
      const configured = new URL(value);
      if (!/^https?:$/.test(configured.protocol)) continue;
      const target = new URL("/login", configured.origin);
      target.searchParams.set("redirect", getSafeRedirectPath(redirectTo));
      return target.toString();
    } catch {
      // 잘못된 배포 URL은 현재 사이트 주소로 대체한다.
    }
  }
  return undefined;
}
