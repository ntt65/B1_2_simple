# 기술 스택

2026-11-10 인증·사용자 Context 추가와 기존 원격 테이블 복구를 반영했다. 사용자가 전체 `schema.sql`을 적용한 뒤 평가 계정의 API 로그인·등록·조회·수정·삭제를 모두 통과했다. 검사 행과 검증용 세션은 정리했으며, 브라우저의 전체 UI 조작과 신규 가입 확인 메일의 수신·복귀는 별도 검증이 필요하다.

등록 오류 수정 커밋 `18f603e`의 Vercel 배포 완료 상태와 실제 프로덕션 JavaScript에 새 오류 안내 코드가 포함된 것을 확인했다.

## 런타임 · 언어

| 항목 | 버전 | 용도 |
| --- | --- | --- |
| JavaScript (ESM) | ES2020+ | 앱 전체 언어, `"type": "module"` |
| JSX | — | React 컴포넌트 템플릿 문법 |

## 프론트엔드

| 라이브러리 | 버전 | 용도 |
| --- | --- | --- |
| React | ^19.2.7 | UI 컴포넌트·로컬 상태·사용자 Context (`useState`, `useEffect`, `useMemo`, `useCallback`, `createContext`, `useContext`) |
| React DOM | ^19.2.7 | React를 브라우저 DOM에 마운트 (`createRoot`) |
| React Router DOM | ^7.18.1 | SPA 클라이언트 사이드 라우팅 (`BrowserRouter`, `Routes`, `Route`, `NavLink`, `Outlet`, `useParams`, `useNavigate`, `Link`) |

## 백엔드 (BaaS)

| 항목 | 버전 | 용도 |
| --- | --- | --- |
| Supabase JS | ^2.110.8 | 원격 DB CRUD와 이메일 인증 (`signInWithPassword`, `signUp`, `signOut`, `getSession`, `onAuthStateChange`) |
| Supabase (서버) | — | PostgreSQL 호스팅 + PostgREST API + Auth + Row Level Security(RLS) |

### Supabase 테이블 구조 (`bookmarks`)

| 컬럼 | 타입 | 제약 |
| --- | --- | --- |
| `id` | `uuid` | PK, `gen_random_uuid()` 기본값 |
| `title` | `text` | NOT NULL |
| `url` | `text` | NOT NULL |
| `memo` | `text` | nullable |
| `category` | `text` | NOT NULL, 기본값 `'etc'` |
| `created_at` | `timestamptz` | NOT NULL, `now()` 기본값 |
| `user_id` | `uuid` | 새 테이블에서는 nullable, `auth.uid()` 기본값·`auth.users(id)` 참조 |

표는 신규 테이블 기준이다. 기존 ID의 타입·기본키·자동 증가 설정은 유지하며, UUID ID에 기본값만 빠진 경우 `gen_random_uuid()` 기본값을 보완한다. 숫자형 ID의 자동 증가 설정 누락은 진단 결과에 따라 별도 확인해야 한다.

`user_id`는 작성자 메타데이터다. 앱은 등록 직전 세션을 확인한 사용자의 ID를 payload에 포함하고, DB는 미지정 INSERT의 기본값으로 `auth.uid()`를 사용한다. 이 컬럼을 추가하는 것만으로 작성자별 접근 제한이 생기지는 않는다. 기존 `user_id`의 저장값·제약은 유지한다.

RLS 정책은 `anon`·`authenticated` 공개 조회, `authenticated` 등록·수정·삭제다. 개인별 소유권은 구분하지 않으므로 로그인 사용자는 모든 북마크를 수정·삭제할 수 있다. 기존 허용 정책이 남으면 새 제한과 OR로 결합될 수 있어, 기존 정책을 보관한 뒤 이 계약의 4개 정책으로 전환한다. 이번 환경에서는 사용자가 전체 `schema.sql`을 실행했고 이후 평가 계정의 API CRUD를 검증했다.

### 기존 테이블 복구

원격 API의 추가 컬럼 검사에서 `42703`, `column bookmarks.memo does not exist`를 확인했다. `CREATE TABLE IF NOT EXISTS`는 이미 있는 테이블을 수정하지 않으므로, `category`와 `user_id`만 추가하면 `memo` 누락이 남는다. 앞선 `select=id&limit=0`의 HTTP 200은 ID 읽기 API 접근성만 확인한 것이며 전체 컬럼이나 등록 정상 여부의 근거가 아니다.

이후 사용자가 `memo` 추가와 API 스키마 새로고침을 실행해 앱 사용 컬럼 7개의 조회와 등록·단건 조회가 통과했다. 당시 수정·삭제는 반환 0행이었으나, 사용자가 전체 `schema.sql`을 적용한 후 API 로그인·새 임시 북마크 생성 HTTP 201·조회 HTTP 200·수정 HTTP 200·삭제 HTTP 200과 실제 반환 행을 모두 확인했다. 이전에 남은 임시 행과 새 검사 행은 모두 삭제했고 검증용 로그인 세션도 정리했다.

신규 환경을 만들거나 전체 기본값·공유 권한까지 보완할 때는 먼저 `supabase/diagnose-bookmarks.sql`로 실제 컬럼·타입·기본값·정책·GRANT를 조회해 보관한다. 그 다음 `schema.sql` 전체를 한 번 실행하면 신규 테이블 생성 또는 기존 테이블의 누락된 `memo`, `category`, `user_id`, `created_at` 추가와 기본값·공유 권한·API 스키마 새로고침을 함께 처리한다. 권한 전환 SQL을 추가로 실행할 필요는 없고, `supabase/policies-authenticated-writes.sql`은 컬럼이 이미 맞아 권한만 전환할 때 사용할 수 있다.

기존 컬럼의 타입·NOT NULL·저장값·기본키는 변경하지 않는다. 누락된 `category`·`created_at`을 새로 추가할 때는 기본값 `'etc'`·현재 시각이 기존 행에도 채워질 수 있다. 기존 `user_id` 값은 덮어쓰지 않으며, 이후 값이 생략된 INSERT를 위한 기본값을 보완한다. 복구 후 진단 결과와 실제 CRUD를 다시 확인해야 한다.

등록 요청은 폼의 `title`, `url`, `memo`, `category`만 선택하고 작성자 ID를 세션에서 채운다. `bookmarkErrors.js`는 누락 컬럼·필수값·권한·참조·CHECK 오류를 코드별로 안내한다. DB 코드와 미리 정한 컬럼 이름만 출력하며, DB의 원본 `message`·`details`·행 데이터·토큰을 그대로 보여주지 않는다.

### 인증과 화면 접근

`main.jsx`의 `AuthProvider`가 사용자·초기 세션 확인 상태를 앱 전체에 제공한다. 시작할 때 `getSession()`을 호출하고, `onAuthStateChange()`로 로그인·로그아웃·세션 갱신을 반영한다. 정리 함수에서 구독을 해제하며, 늦게 도착한 초기 세션 결과가 더 최근 인증 이벤트를 덮어쓰지 않도록 처리한다.

`useAuth()`는 `user`, `loading`, `sessionError`, `signIn`, `signUp`, `signOut`을 반환한다. 목록·상세는 공개하고 `/bookmarks/new`, `/bookmarks/:id/edit`, `/profile`은 `ProtectedRoute`로 보호한다. 등록·수정·삭제 직전에는 `requireAuthenticatedUser()`가 세션을 다시 확인한다. 직접 API 요청까지 제어하는 최종 데이터 권한은 원격 Supabase의 RLS 정책이 담당한다.

`LoginPage`는 로그인·회원가입을 처리한다. 가입 시 표시 이름은 사용자 메타데이터의 `display_name`으로 저장하며, 확인 메일이 필요한 경우 안내를 표시한다. `ProfilePage`는 사용자 정보와 로그아웃을 제공한다. `authRedirect.js`는 로그인 후 복귀할 내부 경로와 인증 메일 복귀 주소를 검증한다.

### 폼·목록·성공 피드백

`bookmarkUrl.js`는 파싱 가능한 HTTP/HTTPS 절대 주소를 판별한다. `BookmarkForm`은 제목·URL 필수값과 주소 형식을 검사하고, 상세 화면은 이전 데이터의 위험한 프로토콜 주소를 링크로 열지 않는다.

`BookmarkList`의 `emptyAction`으로 빈 상태의 다음 행동을 전달한다. 북마크가 전혀 없으면 등록으로, 카테고리 필터에만 결과가 없으면 전체 카테고리로 안내한다. 등록·수정·삭제 성공 시 라우트의 `state.notice`를 전달하고 `Layout`이 닫을 수 있는 `role="status"` 성공 메시지를 표시한다. 사용자 Context 외에 별도의 알림 전역 상태는 추가하지 않았다.

## 빌드 도구

| 도구 | 버전 | 용도 |
| --- | --- | --- |
| Vite | ^8.1.1 | 개발 서버 (`npm run dev`), 번들링 (`npm run build`), 미리보기 (`npm run preview`) |
| @vitejs/plugin-react | ^6.0.3 | Vite에서 JSX 변환 및 React Fast Refresh 지원 |

## 린터

| 도구 | 버전 | 용도 |
| --- | --- | --- |
| oxlint | ^1.71.0 | ESLint 대체 Rust 기반 린터, `npm run lint` |

## devDependencies

| 패키지 | 용도 |
| --- | --- |
| `@types/react` ^19.2.17 | TypeScript 미사용이지만 IDE(VS Code)가 JSX props 타입을 자동 완성할 때 참조 |
| `@types/react-dom` ^19.2.3 | 동일 — `createRoot` 등 React DOM API 타입 힌트 |
| `vitest` | 인증·라우트·오류 처리 자동 테스트 실행 |
| `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` | 외부 API를 대체한 React 화면 동작·DOM 검증 |

TypeScript를 쓰지 않아도 `@types/*`가 있으면 VS Code IntelliSense가 `useState<string>()` 대신 `useState("")`처럼 추론해서 편집 경험이 개선된다.

## npm 스크립트

| 명령어 | 내부 실행 | 용도 |
| --- | --- | --- |
| `npm run dev` | `vite` | 개발 서버 (HMR, `http://localhost:5173`) |
| `npm run build` | `vite build` | 프로덕션 번들 → `dist/` |
| `npm run preview` | `vite preview` | `dist/`를 로컬에서 미리보기 (배포 전 확인용) |
| `npm run lint` | `oxlint` | 정적 분석 |
| `npm test` | `vitest run` | 인증 상태·보호 라우트·실패 처리 회귀 테스트 |

테스트는 Supabase 응답을 대체하므로 실제 인증 메일·원격 RLS·배포 CRUD 검증을 대신하지 않는다.

## 스타일링

순수 CSS를 사용한다 (`src/index.css` 단일 파일). CSS Modules, Tailwind, styled-components 등 별도 도구 없이 클래스명으로 스타일을 관리한다.

주요 클래스 규약:

| 클래스 | 용도 |
| --- | --- |
| `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost` | 버튼 variant |
| `.field`, `.field-error` | 폼 필드 + 에러 메시지 |
| `.invalid` | 검증 실패 input 테두리 강조 |
| `.state`, `.state-loading`, `.state-error`, `.state-empty` | 공통 상태 레이아웃 |
| `.card`, `.bookmark-card` | 카드 컨테이너 |
| `.app-shell`, `.app-header`, `.app-main` | 전체 레이아웃 |

## 배포

| 항목 | 내용 |
| --- | --- |
| 플랫폼 | Vercel |
| SPA 라우팅 | `vercel.json`의 `"rewrites"` 규칙으로 모든 경로를 `index.html`로 rewrite |
| 환경변수 | Vercel 대시보드에 Supabase 공개 설정과 필요 시 `VITE_APP_URL`을 등록한 뒤 재배포 |
| 인증 메일 | Supabase의 Site URL·Redirect URLs에 로컬·실제 배포 주소의 로그인 복귀 경로 허용 |

## 환경변수

| 변수 | 설명 |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon 공개 키 |
| `VITE_APP_URL` | 선택. 가입 확인 메일이 돌아올 앱 주소. 미설정이면 현재 브라우저 origin 사용 |

로컬 실행 시 `.env.example`을 복사해 `.env`를 만들고 값을 채운다.

`supabase.js`는 URL과 공개 키가 설정되었는지 확인하고 `isSupabaseConfigured`와 nullable 클라이언트를 내보낸다. 설정이 없거나 URL이 잘못되면 `App`이 `SetupNotice`를 표시한다. 개발 서버 재시작 또는 Vercel 환경변수 등록·재배포 후 다시 확인한다.

가입 확인 메일의 `emailRedirectTo`는 설정된 앱 origin에 `/login?redirect=...`를 붙여 만든다. Supabase Dashboard의 **Authentication → URL Configuration**에서 Site URL과 Redirect URLs를 맞춘다. 로컬 예시는 `http://localhost:5173/**`이며, 배포에서는 실제 배포 도메인의 필요한 로그인 복귀 주소를 허용한다. `VITE_` 변수는 브라우저에 포함되므로 서비스 역할 키를 사용하지 않는다.

---

## React StrictMode 개발 동작

`main.jsx`에서 `<StrictMode>`로 앱을 감싸고 있다. 개발 모드에서는 렌더 함수를 추가 호출하고 Effect의 설정·정리를 한 번 더 실행해 부수 효과의 정리가 올바른지 확인한다.

```text
개발 모드 실행 순서:
Effect 설정 → 정리 → Effect 설정
```

이 앱의 조회 Effect도 개발 중 추가 요청을 시작할 수 있다. `AuthProvider`는 Effect 정리에서 인증 이벤트 구독을 해제한다. 네트워크 탭에서 추가 조회 요청이 보일 수 있다.

조회 훅은 요청 순서와 Effect 정리 상태를 확인해 이전 요청의 늦은 응답을 무시한다. 단건 조회는 URL의 id가 바뀐 첫 렌더부터 이전 북마크를 숨기며, 네트워크 예외에도 오류 상태를 표시하고 로딩을 종료한다.

프로덕션 빌드에는 StrictMode의 개발 전용 추가 실행이 없다. 다만 페이지 재진입·id 변경·재시도에 따른 조회는 다시 실행된다.

---

## Supabase 선택 이유

이 미션의 평가 기준이 "백엔드 구현"이 아니라 "React 구조와 데이터 흐름"이기 때문에, 백엔드를 직접 구현하지 않고 BaaS를 선택했다.

Firebase 대신 Supabase를 선택한 구체적인 이유는 세 가지다.

1. **SQL 기반**: Supabase는 PostgreSQL을 그대로 사용한다. 테이블·컬럼 구조가 명확하고, `schema.sql` 한 파일로 스키마를 버전 관리할 수 있다. Firebase의 NoSQL 방식은 중첩 컬렉션 설계가 필요해 이번처럼 단순한 단일 테이블 CRUD에는 오히려 복잡하다.
2. **JavaScript SDK가 직관적**: `supabase.from("bookmarks").select("*").order(...)` 형태로 쿼리 의도를 그대로 읽을 수 있다. 메서드 체이닝 구조가 SQL과 1:1 대응되어 학습 비용이 낮다.
3. **RLS(Row Level Security)로 데이터 권한 관리**: 공개 키는 브라우저에서 사용하고 실제 데이터 접근은 원격 DB의 RLS로 제한한다. 이 앱은 공개 조회·로그인 사용자 쓰기를 SQL로 관리한다. Firebase의 Security Rules도 데이터 접근을 제어하는 역할을 한다.

**연동 중 겪은 어려움**: `useEffect` + `useCallback` 조합에서 의존성 배열을 잘못 설정하면 무한 루프가 발생한다. `refetch`를 `useCallback` 없이 `useEffect` 의존성에 넣으면 렌더마다 새 함수가 생성되어 `useEffect`가 계속 재실행된다. `useCallback([])` / `useCallback([id])`로 함수를 메모이제이션해서 해결했다.

---

## useEffect + useCallback 패턴

커스텀 훅에서 사용한 패턴이다.

```js
// useBookmarks — 마운트 1회만 조회
const refetch = useCallback(async () => {
  // Supabase 요청
}, []);                          // 의존성 없음 → 항상 같은 함수 참조

useEffect(() => {
  refetch();
}, [refetch]);                   // refetch 불변 → 마운트 1회만 실행

// useBookmark(id) — id가 바뀌면 재조회
const refetch = useCallback(async () => {
  // Supabase 요청 (id 사용)
}, [id]);                        // id 바뀌면 새 함수 생성

useEffect(() => {
  refetch();
}, [refetch]);                   // refetch 바뀌면 재실행 → id 변경 시 재조회
```

`useCallback` 없이 일반 `async function`을 `useEffect` 안에서 직접 선언·호출하는 방법도 있지만, 이 방식은 `refetch()`를 외부(삭제 후 목록 갱신 등)에서 호출할 수 없다. 외부 재호출이 필요하기 때문에 `useCallback`으로 분리했다.
