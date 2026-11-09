/** DB 오류의 코드와 알려진 컬럼 이름만 안내하고, 실패한 행의 값은 노출하지 않는다. */
const bookmarkColumns = ["id", "title", "url", "memo", "category", "user_id", "created_at"];

function getColumnName(error) {
  if (bookmarkColumns.includes(error?.column)) return error.column;
  const message = typeof error?.message === "string" ? error.message : "";
  const candidates = [
    message.match(/\bcolumn\s+(?:[a-z_]+\.)?["']?([a-z_]+)["']?/i)?.[1],
    message.match(/["']([a-z_]+)["']\s+column\b/i)?.[1],
    ...[...bookmarkColumns].sort((a, b) => b.length - a.length)
      .filter((column) => message.includes(`${column}_fkey`) || message.includes(`${column}_check`)),
  ];
  return candidates.find((column) => bookmarkColumns.includes(column));
}

export function getBookmarkErrorMessage(error, action = "등록") {
  const verb = ["등록", "수정", "삭제"].includes(action) ? action : "등록";
  const prefix = `${verb}에 실패했습니다.`;
  const code = typeof error?.code === "string" && /^[A-Z0-9_]{1,20}$/.test(error.code) ? error.code : "";
  const column = getColumnName(error);
  const field = column ? `${column} ` : "";
  let detail;

  switch (code) {
    case "PGRST204":
    case "42703":
      detail = `DB에 ${field}컬럼이 없습니다. 테이블 구조와 스키마 캐시를 확인해주세요.`;
      break;
    case "23502":
      detail = `DB의 ${field}필수 값이 비어 있습니다. 테이블 기본값과 입력값을 확인해주세요.`;
      break;
    case "42501":
      detail = "DB 접근 권한이 없습니다. 로그인 상태와 테이블 권한·RLS 정책을 확인해주세요.";
      break;
    case "23503":
      detail = `DB의 ${field}참조 값이 올바르지 않습니다. 로그인 계정과 테이블 참조 설정을 확인해주세요.`;
      break;
    case "23514":
      detail = `DB의 ${field}값이 허용 조건에 맞지 않습니다. 테이블의 CHECK 조건을 확인해주세요.`;
      break;
    case "PGRST205":
    case "42P01":
      detail = "bookmarks 테이블을 찾을 수 없습니다. 연결한 프로젝트와 테이블 설정을 확인해주세요.";
      break;
    default:
      detail = "로그인 상태와 연결을 확인한 뒤 다시 시도하세요.";
  }

  return `${prefix} ${detail}${code ? ` (${code})` : ""}`;
}
