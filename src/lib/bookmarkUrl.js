/** 북마크는 명시적인 http(s) 주소만 링크로 연다. 기존 DB의 값에도 적용한다. */
export function getSafeBookmarkUrl(value) {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value.trim())) return null;
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
