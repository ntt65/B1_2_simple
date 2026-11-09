# 평가문항 QA

> 원문: [평가문항](./b1_2_evaluation_questions.md) · 기술 상세: [tech.md](./tech.md) · 실행 화면: [README](../README.md#실행-화면)

발표자료: [평가 PPTX 19장](../output/presentations/b1_2_evaluation_presentation.pptx), [동일 내용 PDF](../output/pdf/b1_2_evaluation_presentation.pdf). 표지 뒤에 평가 17문항을 각 1장씩 배치하고 마지막에 원문의 6번 평가결과를 구분했다.

원문의 항목과 순서를 유지하고 17개 소문항에 `평가1-1`부터 `평가5-1`까지 번호를 붙였다. 각 문항의 **발표용 답변 → 근거 파일 → 시연 포인트**를 발표 대본으로 사용하고, 뒤의 상세 설명을 질의응답에 활용한다. 항목 5는 원문처럼 하나의 문항 안에서 보너스 세 가지를 설명한다.

2026-11-10 기준 구현 설명이다. 사용자 Context와 인증 보너스를 추가했으며, 원격 테이블 복구와 작성자 ID 전달을 보완했다. 사용자가 전체 `schema.sql`을 적용한 뒤 API 로그인·등록·조회·수정·삭제를 모두 확인했다. 브라우저에서의 전체 UI 조작과 신규 가입 확인 메일의 수신·복귀는 별도 검증이 필요하다.

---

## 항목 1

### 평가1-1. 최소 5개 이상의 라우트가 동작하고, 잘못된 주소 접근 시 Not Found 페이지가 표시되는가?

**발표용 답변**: 8개 라우트와 공통 Layout을 구성했습니다. 목록·상세는 공개하고 등록·수정·프로필은 보호 라우트로 감쌌으며, 잘못된 경로는 Not Found 화면으로 보냅니다.

**근거 파일**: [App.jsx](../src/App.jsx), [ProtectedRoute.jsx](../src/components/ProtectedRoute.jsx), [vercel.json](../vercel.json)

**시연 포인트**: 홈→목록→상세로 이동한 뒤 `/not-a-real-page`를 엽니다. 비로그인 상태의 `/bookmarks/new`가 로그인으로 이동하는지도 보여줍니다.

**상세 설명**

**✅**

`App.jsx`에서 React Router v7로 8개 라우트를 선언했다.

| 경로 | 컴포넌트 | 동작 |
| --- | --- | --- |
| `/` | `HomePage` | 서비스 소개 + CTA |
| `/bookmarks` | `BookmarksPage` | 목록 + 카테고리 필터 |
| `/bookmarks/new` | `ProtectedRoute` → `BookmarkNewPage` | 로그인 후 등록 폼 |
| `/bookmarks/:id` | `BookmarkDetailPage` | 공개 상세 + 로그인 사용자 수정·삭제 |
| `/bookmarks/:id/edit` | `ProtectedRoute` → `BookmarkEditPage` | 로그인 후 수정 폼 |
| `/login` | `LoginPage` | 이메일 로그인·회원가입, 로그인 후 원래 경로 복귀 |
| `/profile` | `ProtectedRoute` → `ProfilePage` | 로그인 사용자 정보·로그아웃 |
| `*` | `NotFoundPage` | "404 페이지를 찾을 수 없습니다." + 홈으로 링크 |

React Router는 정적 경로인 `/bookmarks/new`를 동적 경로 `/bookmarks/:id`보다 우선 매칭한다. `vercel.json`의 rewrite 규칙으로 배포 환경에서 직접 URL 접근 시에도 React Router가 처리한다. 보호 라우트는 초기 세션 확인 중 로딩 UI를 표시하고, 비로그인 사용자는 원래 내부 경로를 담아 `/login`으로 이동시킨다.

---

### 평가1-2. 목록 조회, 상세 조회, 등록, 수정, 삭제가 모두 정상 동작하는가?

**발표용 답변**: 북마크 CRUD는 Supabase의 `bookmarks` 테이블을 사용합니다. 등록은 확인한 세션의 사용자 ID를 함께 저장하고, 수정·삭제는 실제 반환 행이 있을 때만 성공으로 처리합니다.

**근거 파일**: [useBookmarks.js](../src/hooks/useBookmarks.js), [useBookmark.js](../src/hooks/useBookmark.js), [BookmarkNewPage.jsx](../src/pages/BookmarkNewPage.jsx), [BookmarkEditPage.jsx](../src/pages/BookmarkEditPage.jsx), [BookmarkDetailPage.jsx](../src/pages/BookmarkDetailPage.jsx), [schema.sql](../schema.sql)

**시연 포인트**: 평가용 북마크 한 건을 등록→목록·상세 확인→수정→삭제 순서로 보여줍니다. 원격 API의 이전 검증 결과와 이번 발표의 UI 시연을 구분합니다.

**상세 설명**

**✅ — 원격 API 로그인·등록·조회·수정·삭제 확인**

| 동작 | 파일 | Supabase 쿼리 |
| --- | --- | --- |
| 목록 조회 | `useBookmarks.js` | `.from("bookmarks").select("*").order("created_at", { ascending: false })` |
| 상세 조회 | `useBookmark.js` | `.from("bookmarks").select("*").eq("id", id).maybeSingle()` |
| 등록 | `BookmarkNewPage` → `handleCreate` | `.from("bookmarks").insert(payload).select().single()` |
| 수정 | `BookmarkEditPage` → `handleUpdate` | `.from("bookmarks").update(values).eq("id", id).select("id").maybeSingle()` |
| 삭제 | `BookmarkDetailPage` → `handleDelete` | `.from("bookmarks").delete().eq("id", id).select("id").maybeSingle()` |

성공/실패 후 흐름: 등록 성공 → 새 레코드 상세(`/bookmarks/:id`) 이동. 수정 성공 → 해당 상세 이동. 삭제 성공 → 목록(`/bookmarks`) 이동.

등록·수정·삭제는 로그인 세션을 확인한다. 등록 `payload`에는 폼의 `title`, `url`, `memo`, `category`만 선택하고 `user_id`는 확인한 세션 사용자의 ID로 채운다. `user_id`는 작성자 메타데이터이며 소유자만 쓰도록 제한하는 정책은 아니다. 수정·삭제에서 반환된 행이 없으면 성공으로 이동하지 않고 실패를 표시한다. 목표 권한은 공개 조회·로그인 사용자 전체 쓰기다.

실제 API 검사에서는 `42703`, `column bookmarks.memo does not exist`가 확인되었다. `CREATE TABLE IF NOT EXISTS`는 이미 있는 테이블의 누락 컬럼을 추가하지 않는다. `category`·`user_id`만 추가한 상태에서 `memo`가 빠져 있었고, 이후 사용자가 `memo` 추가와 API 스키마 새로고침 SQL을 실행해 누락을 해소했다. 앱 사용 컬럼 7개 전체 및 개별 조회는 HTTP 200을 반환했다.

평가 계정의 API 로그인과 등록·단건 조회를 먼저 확인했고, 당시 수정·삭제는 반환 0행이었다. 이후 사용자가 전체 `schema.sql`을 실행해 누락 컬럼·기본값·GRANT·공유 RLS 정책을 맞췄다. 재검사에서 API 로그인·새 임시 북마크 생성 HTTP 201·조회 HTTP 200·수정 HTTP 200·삭제 HTTP 200과 실제 반환 행을 모두 확인했다. 이전 임시 행과 새 검사 행은 모두 삭제하고 검증용 세션도 정리했다.

---

### 평가1-3. 로딩/에러/빈 상태가 모든 핵심 화면에서 일관된 방식으로 표시되는가?

**발표용 답변**: 로딩은 Loading, 오류는 ErrorState, 빈 결과는 EmptyState로 표시합니다. 목록·상세·수정 화면이 공통 컴포넌트를 사용하고, 데이터가 준비되면 실제 화면을 렌더합니다.

**근거 파일**: [Loading.jsx](../src/components/Loading.jsx), [ErrorState.jsx](../src/components/ErrorState.jsx), [EmptyState.jsx](../src/components/EmptyState.jsx), [BookmarkList.jsx](../src/components/BookmarkList.jsx)

**시연 포인트**: 목록 로딩과 재시도 버튼을 보여주고, 결과가 없는 카테고리를 골라 EmptyState와 필터 초기화 버튼을 확인합니다.

**상세 설명**

**✅**

세 가지 공용 컴포넌트로 통일했다. 페이지마다 별도로 구현하지 않는다.

| 상태 | 컴포넌트 | 특징 |
| --- | --- | --- |
| 로딩 중 | `Loading` | CSS 스피너 + 메시지, `role="status"` |
| 에러 | `ErrorState` | 메시지 + 재시도 버튼(선택), `role="alert"` |
| 빈 데이터 | `EmptyState` | 등록 유도 또는 필터 초기화 액션과 안내 메시지 |

`BookmarksPage`, `BookmarkDetailPage`, `BookmarkEditPage`는 `Loading`과 `ErrorState`를 공통으로 사용한다. 목록의 빈 결과는 `BookmarkList` 안의 `EmptyState`로 안내한다. 상세·수정에서 해당 ID의 데이터가 없으면 `ErrorState`로 항목을 찾을 수 없다고 안내한다. 아래 코드는 목록의 조건부 렌더링 예시다.

```jsx
{loading && <Loading message="북마크를 불러오는 중..." />}
{!loading && error && <ErrorState message="요청에 실패했습니다." onRetry={refetch} />}
{!loading && !error && <BookmarkList bookmarks={filtered} />}
```

---

### 평가1-4. 폼에서 필수값 검증, 에러 메시지 표시, 제출 중 상태 표시가 동작하는가?

**발표용 답변**: 등록·수정은 같은 BookmarkForm을 사용합니다. 제목·URL 필수값과 HTTP/HTTPS 주소를 검증하고, 제출 중 입력·버튼을 잠그며, 실패하면 입력을 유지하고 오류를 표시합니다.

**근거 파일**: [BookmarkForm.jsx](../src/components/BookmarkForm.jsx), [Input.jsx](../src/components/Input.jsx), [Button.jsx](../src/components/Button.jsx), [bookmarkUrl.js](../src/lib/bookmarkUrl.js), [bookmarkErrors.js](../src/lib/bookmarkErrors.js)

**시연 포인트**: 빈 제목·URL로 제출하고 잘못된 URL을 입력해 오류를 보여줍니다. 저장 중 잠김과 실패 후 입력 유지도 코드 또는 준비한 실패 테스트로 설명합니다.

**상세 설명**

**✅**

`BookmarkForm.jsx`가 등록·수정 양쪽에서 공용으로 처리한다.

- **필수값 검증**: `validate()` 함수가 `title`, `url`의 `trim()` 결과가 빈 문자열이면 에러 객체를 반환한다. URL은 `bookmarkUrl.js`로 파싱 가능한 HTTP/HTTPS 절대 주소인지도 확인한다.
- **에러 메시지**: `errors` state가 채워지면 `Input` 컴포넌트가 필드 아래에 `<p className="field-error">` 를 렌더하고 `invalid` 클래스로 테두리를 빨갛게 표시한다. 다시 입력을 시작하는 순간 해당 필드 에러가 지워진다.
- **제출 중 상태**: `submitting: true`이면 `Button`이 `disabled`되고 텍스트가 "처리 중..."으로 바뀐다. `try/finally`로 성공·실패 무관하게 제출 완료 시 해제된다.
- **요청 실패**: Supabase 에러 시 페이지가 `submitError` prop을 내려주고 폼 상단에 표시된다. 등록 실패에는 DB 오류 코드와 누락 컬럼 등 진단에 필요한 원인을 안내하며, 원본 행·토큰 등 상세값은 노출하지 않는다.

---

### 평가1-5. 배포된 URL에서 CRUD를 포함한 모든 기능이 정상 동작하는가?

**발표용 답변**: Vercel 배포와 실제 Supabase API 로그인·CRUD는 이전 검사에서 통과했습니다. 사용자 제공 실행 화면 7장도 있으며, 브라우저 전체 시나리오와 신규 가입 확인 메일 복귀까지 자동 검증했다고 말하지는 않습니다.

**근거 파일**: [README 검증 기록](../README.md#현재-배포-확인-범위), [README 실행 화면](../README.md#실행-화면), [vercel.json](../vercel.json), [package.json](../package.json)

**시연 포인트**: 배포 주소의 목록·상세·등록 흐름과 직접 URL 접근을 보여줍니다. API 기록, 정적 스크린샷, 실제 브라우저 시연을 각각 어떤 근거인지 구분해 설명합니다.

**상세 설명**

**API 로그인·CRUD 확인 완료 — 브라우저 UI·신규 확인 메일 복귀는 별도 검증 필요**

- 현재 배포 URL은 https://b1-2-simple.vercel.app 이다. 사용자 제공 화면에서 Bookmark Keeper 홈·로그인 메뉴·공개 조회/로그인 쓰기 안내가 현재 구현과 일치하는 것을 확인했다.
- 홈·배포 JavaScript의 HTTP 200을 확인했다. `/bookmarks`, `/login`, `/bookmarks/new`, `/profile`, `/not-a-real-page`도 HTTP 200과 React 앱 HTML을 반환했다. 이는 SPA rewrite의 HTTP 응답 확인이며, 해당 화면 렌더링·보호 라우트의 로그인 차단을 브라우저에서 검증한 것은 아니다.
- 등록 오류 수정 커밋 `18f603e`의 Vercel 완료 상태와 실제 프로덕션 JavaScript에 새 오류 안내 코드가 포함된 것을 확인했다.
- 앞선 Supabase `GET /rest/v1/bookmarks?select=id&limit=0`은 HTTP 200으로 ID 읽기 API 접근성만 확인했다. 이후 앱 사용 컬럼 검사에서 `42703`, `column bookmarks.memo does not exist`를 확인했고, 사용자가 `memo` 추가·API 스키마 새로고침 SQL을 실행한 뒤 앱 사용 컬럼 7개 전체 및 개별 조회가 HTTP 200을 반환했다. 컬럼 조회만으로 등록·수정·삭제 성공을 판단하지 않는다.
- `GET /auth/v1/settings`의 HTTP 200과 이메일 인증 활성화·회원가입 허용·이메일 확인 필요 설정을 확인했다. 이후 제공된 평가 계정으로 API 로그인에 성공했으며, 별도 회원가입 요청이나 인증 메일 발송은 실행하지 않았다.
- 기존 B1-2와 공유하는 Supabase 프로젝트의 Site URL·허용 주소는 유지하고, Redirect URLs에 `https://b1-2-simple.vercel.app/**`를 추가해야 한다. `VITE_APP_URL`을 사용한다면 이 앱의 주소를 지정하고 실제 새 확인 메일의 복귀 링크를 확인한다.
- 사용자가 전체 `schema.sql`을 적용한 뒤 평가 계정의 API 로그인과 임시 북마크 생성 HTTP 201·조회 HTTP 200·수정 HTTP 200·삭제 HTTP 200을 모두 확인했다. 단순 상태 코드뿐 아니라 변경·삭제한 행의 반환도 확인했다. 단일 `schema.sql`에 컬럼 보완과 정책 전환이 모두 포함되므로 별도 정책 SQL의 추가 실행은 필요하지 않다.

이전에 남은 임시 북마크와 새 검사 행은 모두 삭제했고 API 검증용 로그인 세션도 정리했다. 실제 사용자 식별값·토큰·연결값은 문서에 기록하지 않았다. 이 API 검증은 브라우저 전체 사용 흐름이나 신규 가입 확인 메일의 수신·복귀를 검증한 결과는 아니다. 이전 배포 URL `https://codyssey-b1-2.vercel.app`의 기록은 README의 과거 배포 구역에 보존했다.

---

## 항목 2

### 평가2-1. 데이터 조회/갱신 흐름 중 최소 1개 이상이 커스텀 훅으로 분리되어 있고 왜 분리했는지 설명할 수 있는가?

**발표용 답변**: 목록은 useBookmarks, 단건은 useBookmark로 분리했습니다. 상세와 수정이 같은 단건 조회 로직을 재사용하고, 페이지는 데이터·로딩·오류·refetch를 받아 화면 구성에 집중합니다.

**근거 파일**: [useBookmarks.js](../src/hooks/useBookmarks.js), [useBookmark.js](../src/hooks/useBookmark.js), [BookmarkDetailPage.jsx](../src/pages/BookmarkDetailPage.jsx), [BookmarkEditPage.jsx](../src/pages/BookmarkEditPage.jsx)

**시연 포인트**: 상세·수정 화면이 모두 `useBookmark(id)`를 호출하는 부분과 오류 UI의 `onRetry={refetch}`를 보여줍니다.

**상세 설명**

**✅ — 조회 훅 2개와 인증 훅 1개**

**조회 훅 2개와 Context 접근 훅 1개**

| 훅 | 반환 계약·사용 위치 | 내부 처리 |
| --- | --- | --- |
| `useBookmarks()` | `bookmarks, loading, error, refetch` → 목록 페이지 | 목록·오류·로딩 state와 최신 요청 번호 관리 |
| `useBookmark(id)` | `bookmark, loading, error, refetch` → 상세·수정 | `id, bookmark, loading, error`를 한 state 객체에 보관하고 이전 id의 응답 무시 |
| `useAuth()` | `user, loading, sessionError, signIn, signUp, signOut` → 헤더·로그인·프로필·보호 라우트 | 새 사용자 state를 만들지 않고 AuthProvider의 Context 사용 |

```js
const { bookmarks, loading, error, refetch } = useBookmarks();
```

```js
const { bookmark, loading, error, refetch } = useBookmark(id);
```

위 코드는 각 화면의 호출 계약을 보여주는 별도 예시다. 같은 훅을 여러 번 호출한다고 그 로컬 state가 자동으로 공유되지는 않는다.

**분리한 이유:**
1. **관심사 분리**: 조회 쿼리와 비동기 상태를 훅으로 옮겨 페이지는 결과와 재시도 함수를 받아 화면 구성에 집중한다. 등록·수정·삭제 쿼리는 각 페이지가 직접 담당한다.
2. **재사용 제거 중복**: `useBookmark(id)` 없이 구현하면 `BookmarkDetailPage`와 `BookmarkEditPage` 두 곳에 동일한 `useState` + `useEffect` + Supabase 코드가 중복된다.
3. **외부 `refetch` 호출**: `ErrorState` 재시도 버튼에서 `refetch()`를 직접 호출한다. 훅 내부에 숨기면 외부 트리거가 불가능하다.

기술 상세 → [tech.md — useEffect + useCallback 패턴](./tech.md#useeffect--usecallback-패턴)

---

### 평가2-2. pages, components, hooks(또는 lib)로 폴더가 분리되어 있고 이 구조를 선택한 이유를 설명할 수 있는가?

**발표용 답변**: pages는 화면과 요청·이동, components는 재사용 UI, hooks는 조회와 Context 사용, context는 사용자 전역 상태, lib는 Supabase·검증·상수를 맡습니다. React가 강제한 구조가 아니라 역할을 찾기 쉽게 나눈 설계입니다.

**근거 파일**: [App.jsx](../src/App.jsx), [BookmarkForm.jsx](../src/components/BookmarkForm.jsx), [useBookmark.js](../src/hooks/useBookmark.js), [AuthContext.jsx](../src/context/AuthContext.jsx), [supabase.js](../src/lib/supabase.js)

**시연 포인트**: 등록 화면에서 공용 폼과 Supabase 연결로 이동하며 폴더별 책임을 짚습니다. Layout·링크 카드·ProtectedRoute는 Router나 Context도 사용한다고 설명합니다.

**상세 설명**

**✅**

```
src/
├── pages/       ← 라우트 1:1 대응, 부수 효과(Supabase 요청, navigate) 담당
├── components/  ← 재사용 UI·공통 레이아웃·보호 라우트
├── hooks/       ← 조회 상태와 인증 Context 사용
├── context/     ← 로그인 사용자·초기 세션·인증 이벤트 공유
└── lib/         ← 외부 클라이언트 초기화·상수·인증 복귀 주소 검증
```

**이 구조를 선택한 이유:**

- `pages/`는 한 화면의 요청·이동 흐름을 조정하고, `components/`는 버튼·입력·폼·상태 표시를 재사용한다. `Layout`·링크 카드·`ProtectedRoute`처럼 Router나 인증 Context를 사용하는 컴포넌트도 있다.
- `hooks/`를 별도 폴더로 두면 "이 폴더 안의 파일은 상태 로직만 있다"는 약속이 된다. 나중에 로직을 찾거나 수정할 때 위치가 예측 가능하다.
- `lib/`는 앱 전체에서 쓰는 싱글턴(Supabase 클라이언트)과 상수를 분리한다. `supabase.js`를 여러 파일에서 import해도 항상 동일한 인스턴스를 쓴다.
- `context/`는 페이지가 바뀌어도 함께 사용하는 사용자 상태를 보관한다. Supabase 하나만 사용하므로 LocalStorage 전환이나 중간 공통 CRUD API 계층은 추가하지 않았다.

---

### 평가2-3. 최소 8개 이상의 재사용 컴포넌트가 있고 어떤 기준으로 컴포넌트를 나눴는지 구체적으로 말할 수 있는가?

**발표용 답변**: components에는 15개 파일이 있고, prop에 따라 표시나 동작이 바뀌는 기준으로는 13개입니다. Layout·SetupNotice는 이 prop 기준 집계에서 제외해도 최소 8개를 충족합니다.

**근거 파일**: [components 폴더](../src/components/), [BookmarkForm.jsx](../src/components/BookmarkForm.jsx), [Button.jsx](../src/components/Button.jsx), [Select.jsx](../src/components/Select.jsx), [ProtectedRoute.jsx](../src/components/ProtectedRoute.jsx)

**시연 포인트**: 같은 BookmarkForm에 초기값·제출 라벨을 바꿔 등록과 수정을 구성한 부분, Button의 loading·variant, Select의 options를 보여줍니다.

**상세 설명**

**✅ — components 파일 15개, prop 기준 재사용 컴포넌트 13개**

prop 기준 13개는 `Button`, `Input`, `Textarea`, `Select`, `Card`, `Loading`, `ErrorState`, `EmptyState`, `CategoryFilter`, `BookmarkCard`, `BookmarkList`, `BookmarkForm`, `ProtectedRoute`다. `Layout`과 `SetupNotice`는 components 폴더의 파일 수에는 포함하지만 prop을 받는다는 평가 기준의 집계에서는 제외한다.

나누는 기준은 두 가지였다.

**기준 1 — 반복 패턴 추출**: 같은 UI가 여러 곳에서 쓰이면 컴포넌트로 뽑는다.
- `Loading`, `ErrorState`: 목록·상세·수정에서 공통 사용
- `EmptyState`: 목록의 전체 빈 결과와 필터 빈 결과를 공통 UI로 안내
- `BookmarkForm`: 등록과 수정 폼이 필드 구성이 같아서 `initialValues` prop 하나로 공용화

**기준 2 — 단일 책임**: "이 컴포넌트가 하는 일이 하나인가"를 기준으로 나눈다.
- `Button`: 클릭 가능한 요소의 스타일과 상태(`variant`, `loading`, `disabled`)만 담당
- `Input`, `Textarea`, `Select`: label + 입력 + 에러 메시지 하나의 블록으로 묶는 역할만
- `Card`: 카드 컨테이너 역할만 담당하고 내용은 children으로 받음
- `BookmarkCard`: 카드 한 장 렌더만 (목록이나 데이터 가져오는 방법을 모름)
- `BookmarkList`: 배열을 받아 카드를 나열하거나 EmptyState를 보여주는 역할만
- `ProtectedRoute`: 세션 확인과 비로그인 이동을 등록·수정·프로필 라우트에서 공통 처리

---

### 평가2-4. 로딩/에러/빈 상태 UI가 페이지마다 따로 구현되지 않고 공통 컴포넌트로 통일되어 있는지 코드에서 보여줄 수 있는가?

**발표용 답변**: 목록·상세·수정 페이지가 Loading과 ErrorState를 함께 사용하고, 목록의 빈 결과는 BookmarkList 안에서 EmptyState로 처리합니다. 페이지는 상황에 맞는 메시지·재시도·빈 상태 액션만 전달합니다.

**근거 파일**: [BookmarksPage.jsx](../src/pages/BookmarksPage.jsx), [BookmarkDetailPage.jsx](../src/pages/BookmarkDetailPage.jsx), [BookmarkEditPage.jsx](../src/pages/BookmarkEditPage.jsx), [BookmarkList.jsx](../src/components/BookmarkList.jsx)

**시연 포인트**: 세 페이지의 같은 상태 컴포넌트 import와 조건 분기를 나란히 보여줍니다. 데이터 전체가 없을 때의 등록 유도와 필터 결과만 없을 때의 초기화 액션도 구분합니다.

**상세 설명**

**✅**

`BookmarksPage`, `BookmarkDetailPage`, `BookmarkEditPage` 세 파일을 열어보면 동일한 컴포넌트를 import한다.

```jsx
// 세 페이지 모두 동일한 import
import { Loading } from "../components/Loading";
import { ErrorState } from "../components/ErrorState";

// 상세·수정 페이지의 조기 반환 패턴
if (loading) return <Loading message="북마크를 불러오는 중..." />;
if (error)   return <ErrorState message="요청에 실패했습니다." onRetry={refetch} />;
```

목록 페이지는 같은 컴포넌트를 JSX의 `loading && ...`, `!loading && error && ...` 조건으로 렌더한다. 공통 UI를 쓰는 원칙은 같지만 모든 페이지가 같은 조기 반환 코드를 사용하는 것은 아니다. 빈 상태의 공통 화면은 `BookmarkList` 내부에서 `EmptyState`를 사용해 렌더한다. 페이지는 데이터·필터 상황에 맞는 액션을 전달한다.

`BookmarksPage`는 빈 목록에 맞는 `emptyAction`을 전달한다. 전체 북마크가 없으면 등록으로 안내하고, 카테고리 필터에만 결과가 없으면 전체 카테고리로 되돌린다. 비로그인 사용자의 등록 접근은 보호 라우트가 로그인으로 연결한다.

---

### 평가2-5. 커스텀 훅으로 분리한 데이터 흐름이 1개 이상 있고 왜 훅으로 분리했는지 이유를 말할 수 있는가?

**발표용 답변**: useBookmark는 URL의 id가 바뀌면 다시 조회하며, 재시도와 늦은 응답 처리를 한곳에서 관리합니다. 같은 훅을 사용해도 호출마다 상태는 독립적이고, 여러 화면이 공유하는 사용자 상태는 useAuth를 통해 Context에서 읽습니다.

**근거 파일**: [useBookmark.js](../src/hooks/useBookmark.js), [useAuth.js](../src/hooks/useAuth.js), [AuthContext.jsx](../src/context/AuthContext.jsx), [BookmarkQueries.test.jsx](../tests/BookmarkQueries.test.jsx)

**시연 포인트**: id 의존성과 requestSequence 검사를 짚고, 이전 요청의 늦은 응답이 새 화면을 덮지 않는 회귀 테스트를 보여줍니다.

**상세 설명**

앞의 항목 2 첫 번째 답변과 동일하다. 조회 훅 `useBookmarks`, `useBookmark(id)`와 인증 훅 `useAuth`가 있다. 조회 훅의 분리 이유는 관심사 분리·재사용·외부 `refetch` 호출이며, `useAuth`는 여러 화면이 같은 사용자 Context를 사용하도록 한다.

---

## 항목 3

### 평가3-1. props와 state의 차이를 구분하고 상태를 어디에 두었는지 흐름을 따라며 대답할 수 있는가?

**발표용 답변**: props는 부모가 내려주는 읽기 전용 입력이고 state는 컴포넌트가 기억하며 갱신하는 값입니다. 폼 입력은 폼, 카테고리는 목록 페이지, 조회 결과는 조회 훅, 로그인 사용자는 AuthContext에 둡니다.

**근거 파일**: [BookmarkForm.jsx](../src/components/BookmarkForm.jsx), [BookmarksPage.jsx](../src/pages/BookmarksPage.jsx), [BookmarkNewPage.jsx](../src/pages/BookmarkNewPage.jsx), [AuthContext.jsx](../src/context/AuthContext.jsx)

**시연 포인트**: Input에 전달되는 value·onChange와 폼의 setValues를 연결해 보여준 뒤, 부모가 onSubmit으로 저장 동작을 주입하는 부분을 설명합니다.

**상세 설명**

**✅**

- **props**: 부모가 자식에게 내려주는 읽기 전용 값. 자식이 변경할 수 없다.
- **state**: 컴포넌트 자신이 소유하고 변경할 수 있는 값. 바뀌면 해당 컴포넌트가 리렌더된다.

**상태 배치 흐름:**

```
useBookmarks 훅
  └─ bookmarks, loading, error   ← 비동기 데이터. 훅이 소유 (여러 화면에서 동일 패턴 재사용)

BookmarksPage
  └─ category (state)            ← 카테고리 필터. 이 화면에서만 의미가 있으므로 로컬
      → filtered (useMemo)       ← category + bookmarks에서 파생, state가 아님
      → CategoryFilter에 value/onChange로 props 전달

BookmarkForm
  └─ values, errors, submitting  ← 폼 입력·검증·제출. 폼 내부 로직과 결합도가 높아 로컬
      → Input/Textarea/Select에 value, onChange, error를 props로 전달

BookmarkNewPage / BookmarkEditPage
  └─ submitError (state)         ← Supabase 에러 메시지. 페이지가 소유하고 BookmarkForm에 prop으로 전달

AuthProvider
  └─ user, loading, sessionError ← 초기 세션 확인·인증 이벤트 결과. useAuth로 여러 화면이 공유
      → 헤더 메뉴, 프로필, ProtectedRoute의 화면 분기
```

---

### 평가3-2. useEffect가 언제 실행되는지, 의존성 배열이 어떤 역할을 하는지 본인 코드 기준으로 짚어가며 답변할 수 있는가?

**발표용 답변**: Effect는 커밋 후 외부 데이터와 동기화하며, 의존성 값이 바뀌면 정리 후 다시 설정됩니다. 목록의 refetch는 안정된 참조를 유지하고 단건은 id에 의존하며, StrictMode의 추가 실행과 재마운트 때문에 조회를 무조건 한 번이라고 말할 수는 없습니다.

**근거 파일**: [useBookmarks.js](../src/hooks/useBookmarks.js), [useBookmark.js](../src/hooks/useBookmark.js), [main.jsx](../src/main.jsx), [AuthContext.jsx](../src/context/AuthContext.jsx)

**시연 포인트**: `useCallback(..., [id])`와 `useEffect(..., [refetch])`, 정리 함수의 requestSequence 증가를 보여줍니다. 개발 모드의 추가 요청과 id 변경·재시도를 구분합니다.

**상세 설명**

| 코드 | 다시 조회하는 조건 |
| --- | --- |
| `useBookmarks`의 `useCallback(..., [])` | 같은 마운트에서는 refetch 참조 유지. 재마운트·직접 refetch 호출 시 조회 |
| `useBookmark`의 `useCallback(..., [id])` | id 변경 시 새 refetch 참조 생성 |
| 두 훅의 `useEffect(..., [refetch])` | 첫 설정과 refetch 참조 변경 시 실행 |

Effect 정리는 언마운트와 의존성 변경 때 이전 요청 결과를 무효화한다. 네트워크 요청을 취소한다고 설명하지 않고, 현재 코드가 **늦은 응답의 state 반영을 무시한다**고 설명한다.

```js
useEffect(() => {
  mounted.current = true;
  refetch();
  return () => {
    mounted.current = false;
    requestSequence.current += 1;
  };
}, [refetch]);
```

React는 의존성 배열의 각 값을 `Object.is`로 비교한다. 개발 모드의 StrictMode에서는 설정→정리→설정이 추가로 수행될 수 있다. 재진입·재시도·id 변경도 있으므로 API가 항상 한 번만 호출된다고 보장하지 않는다. `useCallback`은 이 구현에서 Effect 의존성을 안정화하는 선택이며, 모든 Effect에 반드시 필요한 문법은 아니다.

기술 상세 → [tech.md — StrictMode](./tech.md#react-strictmode-개발-동작)

---

### 평가3-3. 비동기 데이터 요청 시 로딩/성공/실패/빈 상태를 React에서 어떤 방식으로 처리했는지 보여주고 설명할 수 있는가?

**발표용 답변**: 요청 시작에는 loading을 켜고 이전 오류를 지웁니다. 종료 후 오류가 있으면 ErrorState, 정상 빈 결과면 EmptyState, 데이터가 있으면 목록·상세를 표시합니다. error는 boolean이 아니라 오류 메시지 또는 null입니다.

**근거 파일**: [useBookmarks.js](../src/hooks/useBookmarks.js), [useBookmark.js](../src/hooks/useBookmark.js), [BookmarksPage.jsx](../src/pages/BookmarksPage.jsx), [BookmarkList.jsx](../src/components/BookmarkList.jsx)

**시연 포인트**: loading→오류/성공 분기와 빈 배열 처리를 코드로 짚고, 결과 없는 필터를 선택해 원본 데이터가 있어도 빈 필터 결과를 보여줄 수 있음을 설명합니다.

**상세 설명**

**✅**

훅이 세 가지 state를 반환하고 컴포넌트가 조건부 렌더로 처리한다.

```js
// 훅 내부
const [data, setData] = useState([]);   // 성공 시 채워짐
const [loading, setLoading] = useState(true);  // 요청 중 true
const [error, setError] = useState(null);      // 실패 시 메시지

// 컴포넌트에서
{loading && <Loading />}                            // 로딩 중
{!loading && error && <ErrorState onRetry={refetch} />}  // 실패
{!loading && !error && <BookmarkList bookmarks={data} />} // 성공
// BookmarkList 내부: data.length === 0 → <EmptyState />  // 빈 데이터
```

`loading` 여부와 `error` 값, 조회한 데이터의 유무로 네 가지 상태가 겹치지 않게 구분된다.

---

### 평가3-4. 상태 변경이 화면 변화로 이어지는 지점을 3군데 이상 코드에서 짚어가며 설명할 수 있는가?

**발표용 답변**: 카테고리 변경은 카드 목록, 검증 오류는 입력 아래 메시지, submitting은 비활성 버튼으로 이어집니다. 로그인 user 변경은 헤더·보호 경로, 저장 성공 안내와 닫기 상태는 상단 메시지를 바꿉니다.

**근거 파일**: [BookmarksPage.jsx](../src/pages/BookmarksPage.jsx), [BookmarkForm.jsx](../src/components/BookmarkForm.jsx), [Layout.jsx](../src/components/Layout.jsx), [AuthContext.jsx](../src/context/AuthContext.jsx)

**시연 포인트**: 필터 선택→제목 입력·빈값 오류→저장 중 버튼→성공 안내 닫기 중 세 가지 이상을 연속으로 보여줍니다.

**상세 설명**

**✅ — 7곳**

| # | 상태 변경 | 화면 변화 | 파일 |
| --- | --- | --- | --- |
| 1 | `category` 변경 (드롭다운 선택) | `useMemo`로 `filtered` 재계산 → `BookmarkList` 카드 목록 교체 | `BookmarksPage.jsx` |
| 2 | `loading: true → false` | `<Loading />` 사라지고 데이터/에러/빈 상태 중 하나 렌더 | 목록·상세·수정 페이지 |
| 3 | `errors.title` 설정 (제출 시 검증 실패) | `Input`에 `invalid` 클래스 + 필드 아래 에러 `<p>` 나타남 | `BookmarkForm.jsx` |
| 4 | `submitting: false → true` | `Button` 텍스트 "처리 중..." + `disabled` | `BookmarkForm.jsx` |
| 5 | `deleteError` 설정 (삭제 실패) | 상세 페이지 삭제 버튼 위에 에러 메시지 나타남 | `BookmarkDetailPage.jsx` |
| 6 | 로그인·로그아웃으로 `user` 변경 | 헤더·프로필·쓰기 메뉴와 보호 라우트가 함께 바뀜 | `AuthContext.jsx`, `Layout.jsx`, `ProtectedRoute.jsx` |
| 7 | 저장·삭제 성공 안내 전달·닫기 | 이동한 화면 상단에 성공 메시지를 표시하거나 숨김 | 각 CRUD 페이지, `Layout.jsx` |

---

## 항목 4

### 평가4-1. 하나의 기능이 동작하기까지 라우팅 -> 컴포넌트 -> 상태 -> 이벤트 -> 렌더링이 어떻게 이어지는지 설명할 수 있는가?

**발표용 답변**: 등록 URL이 보호 라우트를 거쳐 BookmarkNewPage와 공용 폼을 렌더합니다. 입력 state를 갱신하고 제출 이벤트로 검증·저장을 수행한 뒤, 성공하면 새 상세 화면으로 이동하면서 안내 메시지를 표시합니다.

**근거 파일**: [App.jsx](../src/App.jsx), [ProtectedRoute.jsx](../src/components/ProtectedRoute.jsx), [BookmarkNewPage.jsx](../src/pages/BookmarkNewPage.jsx), [BookmarkForm.jsx](../src/components/BookmarkForm.jsx), [Layout.jsx](../src/components/Layout.jsx)

**시연 포인트**: `/bookmarks/new`→로그인 복귀→입력→제출→Supabase 요청→상세·성공 안내 순서로 발표합니다. 실패 때는 이동하지 않고 폼에 오류가 남는 분기도 짚습니다.

**상세 설명**

**✅ — 북마크 등록 흐름 예시**

```
1. [라우팅]
   네비게이션 "새 북마크" 클릭
   → React Router가 /bookmarks/new 매칭
   → ProtectedRoute에서 세션 확인 (비로그인이면 로그인 후 원래 경로로 복귀)
   → BookmarkNewPage 렌더

2. [컴포넌트 + 상태 초기화]
   BookmarkNewPage가 BookmarkForm을 렌더
   → BookmarkForm 마운트 → values state 초기화 { title:"", url:"", memo:"", category:"개발" }

3. [이벤트 → 상태 → 렌더링]
   사용자가 제목 입력
   → input onChange 이벤트 발생
   → handleChange("title")(e) 호출
   → setValues(v => ({ ...v, title: e.target.value })) — state 변경
   → Input 컴포넌트 리렌더 → 입력값 화면에 반영

4. [이벤트 → 검증 → 상태 → 렌더링]
   제출 버튼 클릭
   → handleSubmit(e) — e.preventDefault()
   → validate(values) 실행 → 에러 있으면 setErrors → Input에 에러 표시 후 중단
   → 에러 없으면 setSubmitting(true) — Button "처리 중..." 렌더

5. [비동기 → 라우팅]
   await onSubmit(values) → BookmarkNewPage의 handleCreate 실행
   → 폼의 title/url/memo/category와 확인한 세션 사용자의 user_id로 payload 생성
   → supabase.insert(payload).select().single()
   → 성공: navigate("/bookmarks/{새 id}") → 상세 페이지로 이동
   → Layout이 이동 결과의 성공 안내를 role="status"로 표시
   → 실패: submitError state 설정 → BookmarkForm 상단 에러 메시지 렌더
   → finally: setSubmitting(false)
```

---

### 평가4-2. Supabase 또는 Firebase를 선택한 이유와 연동하면서 겪은 어려움을 구체적으로 말할 수 있는가?

**발표용 답변**: 단일 테이블 CRUD와 SQL·Auth·권한 정책을 함께 설명하기 위해 Supabase를 사용했습니다. 실제 memo 누락과 수정·삭제 0행 문제를 진단 SQL·전체 schema 적용·반환 행 검사로 해결했으며, Firebase보다 항상 단순하다고 일반화하지 않습니다.

**근거 파일**: [schema.sql](../schema.sql), [diagnose-bookmarks.sql](../supabase/diagnose-bookmarks.sql), [bookmarkErrors.js](../src/lib/bookmarkErrors.js), [README 배포 가이드](../README.md#vercel과-supabase-연동-및-배포-완벽-가이드)

**시연 포인트**: `42703`의 memo 누락과 CREATE TABLE IF NOT EXISTS의 한계를 설명하고, GRANT·RLS·실제 반환 행까지 확인한 복구 과정을 보여줍니다.

**상세 설명**

**✅**

**선택 이유 — Firebase 대신 Supabase를 선택한 근거:**

| 기준 | Supabase | Firebase |
| --- | --- | --- |
| 데이터 모델 | PostgreSQL 테이블·컬럼과 SQL 복구 과정을 학습 | Firestore 등 문서 모델도 CRUD 구현 가능 |
| 이 프로젝트의 선택 | SQL·원격 CRUD·Auth·RLS를 한 흐름으로 설명 | Firebase도 SDK와 Security Rules로 구현 가능 |
| 권한 관리 | `schema.sql`로 공개 조회·로그인 사용자 쓰기 정책 관리 | Security Rules로 데이터 접근 권한 관리 |

**연동 중 겪은 어려움과 해결:**

| 에러 | 원인 | 해결 |
| --- | --- | --- |
| `useEffect` 무한 루프 | `refetch`를 `useCallback` 없이 의존성에 넣어 렌더마다 새 함수 참조 생성 | `useCallback([])` / `useCallback([id])`로 메모이제이션 |
| `.single()` PostgrestError | 없는 id 조회 시 결과가 0건이어서 에러 발생 | `.maybeSingle()`로 교체 — 없으면 `null` 반환 |
| 배포 후 흰 화면 (이전 구현) | 환경변수 누락 시 모듈 초기화에서 예외 발생 | 현재는 설정 안내 화면 표시. 환경변수를 등록한 뒤 재시작·재배포 |
| 수정·삭제가 0행인데 성공처럼 이동 | 권한 거부나 대상 삭제에도 요청 오류가 없을 수 있음 | 변경된 행을 반환받아 확인하고, 없으면 실패 표시 |
| 원격 API `42703`: `bookmarks.memo` 누락 | 기존 테이블에는 `CREATE TABLE IF NOT EXISTS`만으로 컬럼이 추가되지 않으며, `category`·`user_id`만 보완한 상태에서 `memo`가 빠짐 | 진단 SQL로 현재 계약 확인 후 `schema.sql` 전체 실행. 앱은 등록 시 세션 사용자의 `user_id`를 전달하고 DB 오류 원인을 안내 |

현재 앱은 `bookmarks`를 사용하고 비교 대상 B1-2는 `items`를 사용하므로 테이블은 이미 분리되어 있다. 공유하는 Supabase 프로젝트의 Auth 설정과 데이터 테이블 경계를 구분하며, 이번 복구 SQL은 `public.bookmarks`를 대상으로 한다.

상세 → [tech.md — Supabase 선택 이유](./tech.md#supabase-선택-이유), [참고 B1-2 API](https://github.com/ntt65/B1-2/blob/main/src/lib/api.js)

---

## 항목 5

### 평가5-1. 보너스 문제 해결에 따른 크레딧 부여

**발표용 답변**: 보너스는 사용자 Context, useMemo·useCallback, Supabase Auth와 보호 라우트의 세 가지를 구현했습니다. 성능 향상 수치를 측정했다고 주장하지 않으며, 현재 앱 로그아웃은 SDK 기본 global scope이고 앱별 local 로그아웃 분리는 적용하지 않았습니다.

**근거 파일**: [AuthContext.jsx](../src/context/AuthContext.jsx), [useAuth.js](../src/hooks/useAuth.js), [BookmarksPage.jsx](../src/pages/BookmarksPage.jsx), [ProtectedRoute.jsx](../src/components/ProtectedRoute.jsx), [ProfilePage.jsx](../src/pages/ProfilePage.jsx)

**시연 포인트**: 로그인 상태에 따른 헤더·보호 경로, 필터의 useMemo, 프로필의 로그아웃 호출을 설명합니다. 공유 Auth 프로젝트의 다른 세션에 미칠 수 있는 영향도 짚습니다.

**상세 설명**

| 보너스 항목 | 구현 | 내용 |
| --- | --- | --- |
| 전역 상태 (Context) | ✅ | `AuthProvider`가 초기 세션·인증 이벤트를 관리하고 `useAuth`를 통해 사용자 상태를 헤더·로그인·프로필·보호 라우트에 공유 |
| 성능 최적화 (메모이제이션) | ✅ | `BookmarksPage`에서 `useMemo`로 카테고리 필터 결과 메모이제이션 — `bookmarks`나 `category`가 바뀔 때만 재계산. 두 커스텀 훅에서 `useCallback`으로 `refetch` 메모이제이션 — `useEffect` 무한 루프 방지 |
| 인증 (Supabase Auth + 보호 라우트) | ✅ | 이메일 로그인·회원가입·로그아웃, 등록·수정·프로필 보호, 로그인 후 원래 내부 경로 복귀, 가입 확인 메일 안내 |

인증 흐름은 `main.jsx`의 `AuthProvider` → `AuthContext.jsx`의 세션 확인·이벤트 구독 → `useAuth` → 각 화면의 조건부 렌더링으로 이어진다. `LoginPage`는 제출 중 버튼·모드 전환을 잠그고 실패 시 입력을 유지한다. 가입 직후 세션이 없으면 메일 확인 안내를 표시한다. 복귀 경로는 `authRedirect.js`에서 검증해 외부 주소로 이동하지 않도록 한다.

`useMemo`와 `useCallback`을 사용했다는 사실과 실제 성능 개선을 측정했다는 주장은 구분한다. 현재 작은 목록에 대한 전후 성능 측정 결과는 없다.

현재 `AuthContext`는 `supabase.auth.signOut()`을 scope 인자 없이 호출하므로 설치된 SDK의 기본값인 `global`을 사용한다. 앱별 `local` scope 분리는 아직 구현하지 않았다. 이전 원격 API 검사에서는 검증용 세션 정리에만 `local` scope를 사용했으며, 이 기록을 앱 로그아웃 구현과 혼동하지 않는다. 같은 Supabase Auth 프로젝트의 다른 세션 갱신에 영향을 줄 수 있어, 시연 전에 범위를 설명한다.

보호 라우트와 쓰기 UI는 정상 화면 접근을 제어하며, 직접 HTTP 요청에 대한 데이터 권한은 Supabase에 실제 적용된 RLS가 결정한다. 이 저장소의 SQL은 로그인 사용자 모두에게 북마크 쓰기를 허용하는 공유 데이터 정책이다. 작성자 ID를 `user_id`에 기록해도 소유자 전용 권한을 강제하지 않는다.

---

## 6. 평가결과

원문 소문항 17개에 답변·코드 근거·시연 포인트를 대응시켰다. 원격 API의 이전 검증과 사용자 제공 정적 화면을 근거로 설명하며, 실제 시연을 하지 않은 항목까지 완료로 확대하지 않는다.

| 항목 | 결과 |
| --- | --- |
| 항목 1 — 동작 검증 | ✅ 전체 SQL 적용 후 API 로그인·등록·조회·수정·삭제 통과. 브라우저 UI·신규 확인 메일 복귀는 별도 확인 |
| 항목 2 — 구조 설명 | ✅ 전항목 설명 가능 |
| 항목 3 — React 개념 | ✅ 전항목 코드 기준 설명 가능 |
| 항목 4 — 통합 흐름 | ✅ 등록 흐름 전 단계 추적 가능 |
| 항목 5 — 보너스 | ✅ 전역 사용자 Context·메모이제이션·Supabase Auth 및 보호 라우트 구현 |

**필수 기능과 보너스 3개를 구현했고 원격 API 로그인·CRUD를 확인했다. 브라우저 전체 UI 조작과 신규 가입 확인 메일의 수신·복귀는 별도로 확인한다.**

### 발표 자료에 사용할 실행 화면 7장

| 파일 | 보여주는 내용 | 연결할 문항 |
| --- | --- | --- |
| [bookmark_start.png](../screenshot/bookmark_start.png) | 홈·목록/등록 진입 | 평가1-1, 평가1-5 |
| [logup.png](../screenshot/logup.png) | 회원가입 입력 폼 | 평가1-4, 평가5-1 |
| [login.png](../screenshot/login.png) | 로그인 탭의 가입 후 확인 메일 안내 | 평가1-5, 평가5-1 |
| [bookmark_list.png](../screenshot/bookmark_list.png) | 목록·카테고리 필터 | 평가1-2, 평가3-4 |
| [bookmark_regi_confirm.png](../screenshot/bookmark_regi_confirm.png) | 등록 전 입력 화면 | 평가1-4, 평가4-1 |
| [bookmark.png](../screenshot/bookmark.png) | 등록 완료·상세·수정/삭제 메뉴 | 평가1-2, 평가4-1 |
| [profile.png](../screenshot/profile.png) | 사용자 프로필·로그아웃 버튼 | 평가3-1, 평가5-1 |

이미지는 사용자가 제공한 정적 실행 화면이다. 계정 이메일의 마스킹을 유지하며, 과거 탭 스타일이 포함될 수 있다. 가입 안내 이미지는 신규 이메일 확인·복귀가 완료되었다는 증거가 아니며, 정적 이미지 7장을 브라우저 전체 자동 시나리오 검사로 설명하지 않는다.

### 검증 결과와 설명 범위

- 현재 코드: 8개 라우트, components 15개 파일 중 prop 기준 13개, 조회 훅 2개와 인증 Context 접근 훅 1개.
- 이번 로컬 재검증: 테스트 8개 파일·62개 항목 통과. 빌드·린트 결과와 상세 실행 기록은 README 및 이번 작업의 최종 검증 결과를 함께 확인한다.
- 기존 원격 검증: 사용자 전체 SQL 적용 후 평가 계정 API 로그인·등록·조회·수정·삭제 통과, 검사 행과 검증용 세션 정리 완료.
- 남은 검증 범위: 브라우저 전체 UI 시나리오와 신규 가입 확인 메일 수신·이 앱으로의 복귀. 현재 앱의 로그아웃 scope는 global이며 앱별 local 분리 완료로 발표하지 않는다.
