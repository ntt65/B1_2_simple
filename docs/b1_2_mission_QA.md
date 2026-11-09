# 미션 요구사항 QA — B1_2_simple Bookmark Keeper

- 기준일: 2026-11-10
- 원문: [b1_2_mission.md](./b1_2_mission.md), [미션 PDF](./b1_2_mission.pdf)
- 현재 구현·운영 기록: [README](../README.md)
- 제출 앱: [b1-2-simple.vercel.app](https://b1-2-simple.vercel.app)
- 제출 저장소: [ntt65/B1_2_simple](https://github.com/ntt65/B1_2_simple)
- 발표자료: [미션 PPTX 18장](../output/presentations/b1_2_mission_presentation.pptx), [동일 내용 PDF](../output/pdf/b1_2_mission_presentation.pdf)

원문의 **1~8번 순서**를 그대로 따른다. 2번의 하위 1~5번, 4번의 하위 1~8번, 5번의 보너스 1~3번을 유지했다. 원문 3번의 다섯 설명 목표는 발표용으로만 Q1~Q5를 붙였다.

**검증 범위:** 로컬 build·lint·자동 테스트 8개 파일 62개 항목이 통과했다. 배포 코드 반영과 평가 계정의 원격 API 로그인·등록·조회·수정·삭제 및 실제 반환 행도 확인했다. 저장소의 화면 캡처 7개는 화면별 정적 근거다. 이 결과를 브라우저의 전체 사용 흐름이나 신규 가입 확인 메일의 수신·복귀까지 모두 검증한 것으로 확대하지 않는다.

## 1. 미션 소개

**상태:** 미션 취지를 구현에 적용했다. 이 절은 별도의 기능 체크리스트가 아니라 구현 목적에 대한 답변이다.

**발표 답변:** “읽고 싶은 링크를 저장하는 북마크 앱을 만들었습니다. 입력·필터·제출 이벤트가 React 상태를 바꾸고 화면에 반영되는 과정을 설명할 수 있도록 페이지와 UI, 조회 훅을 나눴습니다.”

**파일 근거:** [App.jsx](../src/App.jsx), [BookmarksPage.jsx](../src/pages/BookmarksPage.jsx), [BookmarkForm.jsx](../src/components/BookmarkForm.jsx).

**시연 포인트:** 목록의 카테고리를 변경하고, 등록 폼을 비워 제출해 상태 변경과 조건부 렌더링을 함께 설명한다.

## 2. 최종 결과물

### 1) 라우팅이 있는 SPA

**상태:** 구현 완료. 최소 5개보다 많은 8개 라우트가 있다.

**발표 답변:** “React Router로 URL에 맞는 페이지를 렌더링합니다. 목록과 상세를 분리했고 로그인·프로필·Not Found도 포함했습니다.”

| 경로 | 페이지 | 접근 |
| --- | --- | --- |
| `/` | HomePage | 공개 |
| `/bookmarks` | BookmarksPage | 공개 |
| `/bookmarks/:id` | BookmarkDetailPage | 공개 |
| `/login` | LoginPage | 로그인·회원가입 |
| `/bookmarks/new` | BookmarkNewPage | 로그인 필요 |
| `/bookmarks/:id/edit` | BookmarkEditPage | 로그인 필요 |
| `/profile` | ProfilePage | 로그인 필요 |
| `*` | NotFoundPage | 잘못된 경로 안내 |

**파일 근거:** [main.jsx](../src/main.jsx)의 BrowserRouter, [App.jsx](../src/App.jsx)의 Routes, [ProtectedRoute.jsx](../src/components/ProtectedRoute.jsx).

**시연 포인트:** 홈 → 목록 → 상세를 이동한다. 비로그인 상태에서 등록 주소에 직접 접근하면 로그인으로 이동하고, 로그인 성공 후 원래 내부 경로로 복귀하는 흐름을 확인한다.

### 2) 핵심 데이터 CRUD

**상태:** 구현 완료·원격 API 검증 완료. 대상은 Supabase의 `public.bookmarks`다.

**발표 답변:** “목록과 상세는 조회 훅이 가져오고, 등록·수정·삭제는 해당 페이지의 이벤트 핸들러가 Supabase를 호출합니다. 성공하면 상세 또는 목록으로 이동하고 실패하면 현재 화면에 오류를 표시합니다.”

| 동작 | 실제 요청 | 성공 후 |
| --- | --- | --- |
| 목록 | `select("*").order("created_at", { ascending: false })` | 최신 등록순 목록 |
| 상세 | `select("*").eq("id", id).maybeSingle()` | 해당 북마크 표시 |
| 등록 | `insert(payload).select().single()` | 새 북마크 상세 |
| 수정 | `update(values).eq("id", id).select("id").maybeSingle()` | 수정된 상세 |
| 삭제 | `delete().eq("id", id).select("id").maybeSingle()` | 목록 재조회 |

등록 payload의 키는 `title`, `url`, `memo`, `category`, `user_id`다. `user_id`는 임의 폼 입력 대신 확인한 세션의 `user.id`를 사용한다. 현재 RLS는 공개 조회·로그인 사용자 전체 쓰기이므로 작성자만 수정·삭제하는 구조는 아니다.

**파일 근거:** [useBookmarks.js](../src/hooks/useBookmarks.js), [useBookmark.js](../src/hooks/useBookmark.js), [BookmarkNewPage.jsx](../src/pages/BookmarkNewPage.jsx), [BookmarkEditPage.jsx](../src/pages/BookmarkEditPage.jsx), [BookmarkDetailPage.jsx](../src/pages/BookmarkDetailPage.jsx), [schema.sql](../schema.sql).

**시연 포인트:** 테스트용 북마크 하나를 등록 → 상세 조회 → 제목 수정 → 삭제한다. HTTP 200만 보지 말고 수정·삭제된 반환 행과 실제 화면 결과까지 확인한다.

### 3) React 폼 기반 입력 경험

**상태:** 구현 완료. 공용 폼에 검증·오류·제출 중 상태가 있다.

**발표 답변:** “등록과 수정은 BookmarkForm을 함께 사용합니다. 제목과 URL을 검증하고 제출 중 입력과 버튼을 잠그며 실패해도 입력한 값을 유지합니다.”

**파일 근거:** [BookmarkForm.jsx](../src/components/BookmarkForm.jsx), [Input.jsx](../src/components/Input.jsx), [Button.jsx](../src/components/Button.jsx), [bookmarkUrl.js](../src/lib/bookmarkUrl.js).

**시연 포인트:** 제목·URL 빈값 제출과 잘못된 URL 입력으로 오류를 보여준다. 정상 제출 중에는 버튼이 ‘처리 중...’으로 바뀌고 비활성화되는 점을 설명한다.

### 4) 상태 관리가 설계된 UI

**상태:** 구현 완료. 로컬 상태·조회 상태·전역 사용자 상태의 역할을 구분했다.

**발표 답변:** “폼 값은 폼, 필터는 목록 페이지, 원격 데이터는 조회 훅이 소유합니다. 여러 화면에서 필요한 로그인 사용자는 AuthContext로 공유합니다.”

| 상태 | 소유 위치 | 화면 반영 |
| --- | --- | --- |
| 입력값·필드 오류·제출 중 | BookmarkForm | 입력·오류·비활성화 |
| 카테고리 | BookmarksPage | 표시할 카드 변경 |
| 목록·상세·로딩·조회 오류 | 조회 훅 2개 | Loading·ErrorState·목록·상세 |
| 사용자·세션 로딩·세션 오류 | AuthContext | 메뉴·보호 화면·로그인·프로필 |
| 성공 안내 | 라우트 state와 Layout | 안내 표시·닫기 |

**파일 근거:** [BookmarkForm.jsx](../src/components/BookmarkForm.jsx), [BookmarksPage.jsx](../src/pages/BookmarksPage.jsx), [AuthContext.jsx](../src/context/AuthContext.jsx), [Layout.jsx](../src/components/Layout.jsx), [Loading.jsx](../src/components/Loading.jsx), [ErrorState.jsx](../src/components/ErrorState.jsx), [EmptyState.jsx](../src/components/EmptyState.jsx).

**시연 포인트:** 조회 로딩·오류·빈 목록과 저장 성공 안내가 각각 다른 상태임을 설명한다. 오류 재시도와 빈 목록의 등록·필터 초기화 버튼도 확인한다.

### 5) 배포

**상태:** Vercel 배포·원격 API CRUD 검증 완료. 브라우저 전체 UI 및 신규 가입 메일 복귀는 추가 검증 범위다.

**발표 답변:** “소스는 B1_2_simple 저장소에 있고 제출 주소는 b1-2-simple.vercel.app입니다. Vite 앱을 dist로 빌드하고 Vercel에서 SPA rewrite와 공개 환경변수를 설정했습니다.”

**파일 근거:** [README](../README.md)의 배포 확인 범위와 실행 방법, [package.json](../package.json), [vercel.json](../vercel.json), [.env.example](../.env.example).

**시연 포인트:** 제출 주소에서 목록·상세를 열고, 로그인 후 CRUD를 진행한다. 경로의 HTTP 200 응답은 React 앱 HTML을 받았다는 뜻이므로 화면 렌더링까지 함께 확인한다.

## 3. 과제 목표

원문에 나열된 다섯 목표의 순서대로 답한다. Q1~Q5는 이 QA에서 붙인 발표 질문 번호다.

### Q1. 컴포넌트가 왜 필요한지, 어떤 기준으로 쪼갰는가?

**상태:** 설명 가능한 구조로 구현했다.

**발표 답변:** “페이지는 라우트와 요청·이동을 담당하고, UI 컴포넌트는 버튼·폼·카드·상태 표시를 담당합니다. 반복되는 폼과 로딩·오류·빈 상태를 재사용해 같은 처리를 중복 작성하지 않았습니다.”

**파일 근거:** [App.jsx](../src/App.jsx), [BookmarkNewPage.jsx](../src/pages/BookmarkNewPage.jsx), [BookmarkEditPage.jsx](../src/pages/BookmarkEditPage.jsx), [BookmarkForm.jsx](../src/components/BookmarkForm.jsx).

**시연 포인트:** 등록·수정 페이지가 같은 BookmarkForm에 서로 다른 `initialValues`, `onSubmit`, `submitLabel`을 넘기는 부분을 보여준다. Layout·링크 카드 등 Router를 사용하는 UI도 있으므로 모든 components가 외부 의존성이 없다고 설명하지 않는다.

### Q2. props와 state의 차이, 상태를 어디에 두었는가?

**상태:** 설명 가능한 상태 분리를 적용했다.

**발표 답변:** “props는 부모가 내려주는 값과 함수이고 state는 컴포넌트가 소유하는 값입니다. 폼 입력은 폼에, 필터는 목록 페이지에, 여러 화면이 함께 쓰는 사용자는 Context에 두었습니다.”

**파일 근거:** [BookmarkForm.jsx](../src/components/BookmarkForm.jsx)의 `initialValues/onSubmit` props와 `values/errors/submitting` state, [CategoryFilter.jsx](../src/components/CategoryFilter.jsx)의 `value/onChange`, [useAuth.js](../src/hooks/useAuth.js).

**시연 포인트:** 카테고리 선택 → 부모의 setCategory → 새 value 전달 → 필터 목록 변경 순서로 하향 값 전달과 상향 이벤트 전달을 설명한다.

### Q3. useEffect의 실행 시점·의존성과 데이터 요청 관계는?

**상태:** 구현·응답 경합 자동검증 완료.

**발표 답변:** “조회 Effect는 컴포넌트가 화면에 연결된 뒤 실행되며, 상세 id가 바뀌면 다시 조회합니다. 요청 순번과 cleanup으로 이전 요청의 늦은 응답을 무시합니다.”

**파일 근거:** [useBookmarks.js](../src/hooks/useBookmarks.js)의 `useCallback([])`·`useEffect([refetch])`, [useBookmark.js](../src/hooks/useBookmark.js)의 `useCallback([id])`·cleanup, [BookmarkQueries.test.jsx](../tests/BookmarkQueries.test.jsx).

**시연 포인트:** 목록 최초 진입·상세 id 변경·재시도에서 조회 시점을 설명한다. 개발 StrictMode는 Effect의 추가 setup/cleanup 검사를 수행하므로 “개발에서도 네트워크 요청이 무조건 한 번”이라고 설명하지 않는다. 현재 id와 다른 기존 데이터는 새 화면에 표시하지 않는다.

### Q4. 로딩·성공·실패·빈 상태를 어떻게 표현했는가?

**상태:** 공통 UI와 실패 처리 구현 완료.

**발표 답변:** “loading과 error를 먼저 분기하고 정상 응답의 빈 배열은 EmptyState로 표현합니다. 저장 실패는 입력 화면에 남기고, 성공은 이동한 화면의 안내로 표시합니다.”

**파일 근거:** [BookmarksPage.jsx](../src/pages/BookmarksPage.jsx), [BookmarkList.jsx](../src/components/BookmarkList.jsx), [ErrorState.jsx](../src/components/ErrorState.jsx), [Layout.jsx](../src/components/Layout.jsx), [bookmarkErrors.js](../src/lib/bookmarkErrors.js).

**시연 포인트:** Loading → 목록/빈 상태/오류와 저장 성공 안내를 구분한다. 조회 실패의 재시도, 저장 실패의 입력 유지, 수정·삭제 반환 0행의 실패 처리를 설명한다.

### Q5. 라우팅 → 컴포넌트 → 상태 → 이벤트 → 렌더링 연결은?

**상태:** 등록 흐름으로 설명할 수 있다.

**발표 답변:** “등록 주소에 들어오면 인증을 확인하고 공용 폼을 띄웁니다. 입력 이벤트가 state를 바꾸고 제출 검증을 통과하면 Supabase에 저장한 뒤 새 상세와 성공 안내를 보여줍니다.”

`/bookmarks/new → ProtectedRoute → BookmarkNewPage → BookmarkForm → onChange/setValues → onSubmit → 세션 확인·insert → navigate → 상세·성공 안내`

**파일 근거:** [App.jsx](../src/App.jsx), [ProtectedRoute.jsx](../src/components/ProtectedRoute.jsx), [BookmarkForm.jsx](../src/components/BookmarkForm.jsx), [BookmarkNewPage.jsx](../src/pages/BookmarkNewPage.jsx), [Layout.jsx](../src/components/Layout.jsx).

**시연 포인트:** 위 순서대로 화면과 코드의 핵심 함수만 연결해 설명한다. 등록 화면에서 사용하지 않는 전체 목록을 미리 조회하지 않는다.

## 4. 기능 요구 사항

### 1) 프로젝트 기본 구성

**상태:** 충족. React·역할별 폴더·공통 레이아웃·단일 핵심 데이터 구조를 갖췄다.

**발표 답변:** “Vite와 React 19로 만들고 pages/components/hooks/lib/context로 역할을 나눴습니다. 핵심 데이터는 북마크 한 종류이며 모든 일반 화면은 Layout을 공유합니다.”

**파일 근거:** [package.json](../package.json), [main.jsx](../src/main.jsx), [App.jsx](../src/App.jsx), [Layout.jsx](../src/components/Layout.jsx).

**시연 포인트:** 8개 페이지와 3개 커스텀 훅, 공통 헤더의 Outlet을 보여준다. 환경설정이 없을 때는 [SetupNotice](../src/components/SetupNotice.jsx)를 표시한다.

### 2) 라우팅 (React Router 등)

**상태:** 충족. 2번 1)의 표와 같이 8개 라우트가 있으며 목록·상세·Not Found와 메뉴 링크를 제공한다.

**발표 답변:** “8개 라우트 중 목록과 상세는 공개하고 등록·수정·프로필은 보호합니다. 잘못된 경로에는 홈으로 돌아갈 수 있는 Not Found 화면을 보여줍니다.”

**파일 근거:** [App.jsx](../src/App.jsx), [NotFoundPage.jsx](../src/pages/NotFoundPage.jsx), [Layout.jsx](../src/components/Layout.jsx), [authRedirect.js](../src/lib/authRedirect.js).

**시연 포인트:** 목록 카드 → 상세, 임의의 잘못된 주소 → Not Found, 비로그인 등록 → 로그인 복귀를 보여준다.

### 3) 컴포넌트 설계

**상태:** 충족. 원문 기준인 “하나 이상의 prop으로 동작·표시가 달라지는 컴포넌트”를 아래 13개로 확인할 수 있어 최소 8개를 넘는다.

**발표 답변:** “단순한 파일 개수 대신 props로 재사용되는지 확인했습니다. 공용 입력·버튼·카드·상태 표시·북마크 폼을 재사용합니다.”

| prop을 받는 컴포넌트 | 대표 props | 사용 근거 |
| --- | --- | --- |
| [Button](../src/components/Button.jsx) | variant, loading, children | 폼·삭제·재시도 |
| [Input](../src/components/Input.jsx) | label, value, error | 북마크·로그인 폼 |
| [Textarea](../src/components/Textarea.jsx) | label, value, error | 메모 입력 |
| [Select](../src/components/Select.jsx) | options, value, onChange | 카테고리 입력·필터 |
| [Card](../src/components/Card.jsx) | children, className | 북마크 카드 |
| [Loading](../src/components/Loading.jsx) | message | 조회·세션 확인 |
| [ErrorState](../src/components/ErrorState.jsx) | message, onRetry | 조회·세션 오류 |
| [EmptyState](../src/components/EmptyState.jsx) | message, action | 빈 목록 |
| [CategoryFilter](../src/components/CategoryFilter.jsx) | value, onChange | 목록 필터 |
| [BookmarkCard](../src/components/BookmarkCard.jsx) | bookmark | 카드 한 장 |
| [BookmarkList](../src/components/BookmarkList.jsx) | bookmarks, emptyAction | 카드 배열·빈 상태 |
| [BookmarkForm](../src/components/BookmarkForm.jsx) | initialValues, onSubmit, submitLabel | 등록·수정 |
| [ProtectedRoute](../src/components/ProtectedRoute.jsx) | children | children 또는 Outlet의 접근 제어 |

집계 기준도 구분한다. components 폴더에는 실제 15개 파일이 있다. 기존 주요 UI 13개에 ProtectedRoute를 더한 14개와 설정 안내 전용 SetupNotice 1개다. 이 가운데 Layout은 prop이 없는 공통 레이아웃이므로 위의 엄격한 prop 기준 13개에는 넣지 않았다. ProtectedRoute도 현재 App에서는 children 대신 Outlet 방식으로 사용한다.

**파일 근거:** 위 컴포넌트 파일과 [App.jsx](../src/App.jsx)의 공통 Layout·ProtectedRoute 배치.

**시연 포인트:** Button의 primary/danger/loading과 등록·수정 공용 BookmarkForm처럼 props에 따라 실제 표시가 달라지는 사례를 보여준다.

### 4) 상태 관리 (React 중심)

**상태:** 충족. controlled input·원격 데이터·로딩·오류와 커스텀 훅을 구현했다.

**발표 답변:** “입력값은 value와 onChange로 제어합니다. 조회는 useBookmarks·useBookmark로 분리했고 인증 상태는 useAuth로 같은 Context를 사용합니다.”

**파일 근거:** [BookmarkForm.jsx](../src/components/BookmarkForm.jsx), [useBookmarks.js](../src/hooks/useBookmarks.js), [useBookmark.js](../src/hooks/useBookmark.js), [useAuth.js](../src/hooks/useAuth.js), [AuthContext.jsx](../src/context/AuthContext.jsx).

**시연 포인트:** 훅의 `bookmarks` 또는 `bookmark`, `loading`, `error`, `refetch`와 페이지의 조건부 렌더를 연결한다. 조회 훅의 패턴 재사용은 페이지 간 데이터를 자동 공유한다는 뜻이 아니며, 전역 공유는 AuthContext에서 수행한다.

### 5) CRUD (원격 데이터 연동)

**상태:** 충족·원격 API 검증 완료. LocalStorage 대체 모드 없이 Supabase를 사용한다.

**발표 답변:** “페이지별 요청은 실제 bookmarks 테이블을 읽고 씁니다. 수정·삭제는 반환된 행이 있어야 성공으로 처리해 권한에 막혀 0행인 결과를 성공으로 오해하지 않게 했습니다.”

**파일 근거:** [supabase.js](../src/lib/supabase.js), [BookmarkNewPage.jsx](../src/pages/BookmarkNewPage.jsx), [BookmarkEditPage.jsx](../src/pages/BookmarkEditPage.jsx), [BookmarkDetailPage.jsx](../src/pages/BookmarkDetailPage.jsx), [BookmarkMutations.test.jsx](../tests/BookmarkMutations.test.jsx), [BookmarkCreation.test.jsx](../tests/BookmarkCreation.test.jsx).

**시연 포인트:** 생성 HTTP 201·조회/수정/삭제 HTTP 200과 실제 반환 행을 확인한 기록을 제시한다. 임시 검사 행과 API 검증용 세션은 정리했다.

실제 장애는 `bookmarks.memo` 누락의 `42703`이었다. `CREATE TABLE IF NOT EXISTS`만으로 기존 컬럼은 보완되지 않는다. 사용자 SQL로 누락 컬럼을 추가하고 전체 [schema.sql](../schema.sql)을 적용한 뒤 원격 CRUD를 확인했다. 단순한 `select=id&limit=0`의 성공은 전체 스키마·쓰기 검증이 아니다.

### 6) 폼 UX

**상태:** 충족. 이 항목은 4번의 하위 6번이며, 원문 6번 “개발 환경”과 다른 항목이다.

**발표 답변:** “제목과 URL을 필수로 검사하고 HTTP/HTTPS URL 형식도 확인합니다. 오류는 입력 가까이 또는 폼 위에 표시하고, 요청 중 입력과 제출을 잠그며 실패하면 값을 유지합니다.”

**파일 근거:** [BookmarkForm.jsx](../src/components/BookmarkForm.jsx), [bookmarkUrl.js](../src/lib/bookmarkUrl.js), [Input.jsx](../src/components/Input.jsx), [Button.jsx](../src/components/Button.jsx), [bookmarkErrors.js](../src/lib/bookmarkErrors.js).

**시연 포인트:** 빈값 → 필드 오류, 잘못된 URL → 형식 오류, 정상 제출 → 진행 중 표시, 요청 실패 → 폼 상단 오류 순서로 보여준다. DB 오류 안내는 알려진 코드·컬럼을 사용하고 실패한 행이나 토큰의 원문은 표시하지 않는다.

### 7) React 이벤트 & 렌더링

**상태:** 충족. 최소 3군데보다 많은 상태 → 화면 변화를 설명할 수 있다.

**발표 답변:** “입력·선택·제출·로그인 이벤트가 각각 state를 바꾸고 React가 새 화면을 계산합니다. 필터, 검증 오류, 제출 중 표시를 대표 사례로 설명하겠습니다.”

| 이벤트 | 상태 변화 | 렌더 변화 |
| --- | --- | --- |
| 카테고리 선택 | category | 해당 카드만 표시 |
| 입력 | values | controlled input 값 갱신 |
| 빈 폼 제출 | errors | 필드 오류 표시 |
| 정상 제출 시작·종료 | submitting | 진행 중 문구·비활성화 |
| 로그인·로그아웃 | user | 메뉴·보호 페이지 분기 |
| 로그인/회원가입 탭 선택 | mode | 가입 필드·제출 문구 변경 |
| CRUD 성공 후 이동·닫기 | state.notice·dismissedKey | 성공 안내 표시·닫기 |

**파일 근거:** [BookmarksPage.jsx](../src/pages/BookmarksPage.jsx), [BookmarkForm.jsx](../src/components/BookmarkForm.jsx), [LoginPage.jsx](../src/pages/LoginPage.jsx), [Layout.jsx](../src/components/Layout.jsx).

**시연 포인트:** 위 표에서 필터·검증·제출 중 세 가지를 먼저 시연하고 사용자 상태와 성공 안내를 추가로 설명한다. 상단 인증 선택은 밑줄 탭이고 하단 제출은 primary 버튼으로 구분했다.

### 8) 배포

**상태:** 배포·원격 API 검증 완료. 전체 브라우저 UI와 신규 가입 메일 복귀는 추가 확인이 필요하다.

**발표 답변:** “환경변수와 SPA rewrite를 포함해 Vercel에 배포했습니다. 배포 코드 반영과 원격 API CRUD를 확인했고, API 검사와 브라우저 전체 시연은 구분해 기록했습니다.”

**파일 근거:** [vercel.json](../vercel.json), [.env.example](../.env.example), [README](../README.md)의 배포 가이드·현재 배포 확인 범위.

**시연 포인트:** Production 주소의 목록/상세, 로그인 후 등록·수정·삭제, 직접 주소 접근·새로고침을 확인한다. 설정값 변경 후에는 Save만 하지 않고 대상 환경에 재배포한다.

필수 공개 설정은 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`이고 `VITE_APP_URL`은 가입 메일 복귀 origin을 고정할 때 사용한다. 공개 키가 브라우저에 포함되므로 최종 데이터 권한은 원격 GRANT와 RLS가 담당한다.

## 5. 보너스 과제 (선택)

### 1) 전역 상태 도입

**상태:** 구현 완료. 로그인 사용자·초기 확인 상태·세션 오류를 Context로 공유한다.

**발표 답변:** “AuthProvider가 앱 전체를 감싸고 헤더·보호 라우트·로그인·프로필이 useAuth로 같은 사용자 상태를 사용합니다.”

**파일 근거:** [main.jsx](../src/main.jsx), [AuthContext.jsx](../src/context/AuthContext.jsx), [useAuth.js](../src/hooks/useAuth.js), [Layout.jsx](../src/components/Layout.jsx), [ProfilePage.jsx](../src/pages/ProfilePage.jsx).

**시연 포인트:** 로그인 상태에 따라 메뉴가 바뀌고 프로필에 사용자 정보가 나타나는 흐름을 보여준다. 세션 확인 중 로딩과 확인 실패 오류도 비로그인 상태와 구분한다.

### 2) 성능 최적화

**상태:** 요구된 메모이제이션 적용 완료. 별도 성능 측정 결과를 주장하지 않는다.

**발표 답변:** “카테고리 필터 결과는 useMemo로, Effect에서 참조하는 재조회 함수는 useCallback으로 관리했습니다. 데이터나 의존성이 바뀔 때 필요한 계산과 조회가 실행됩니다.”

**파일 근거:** [BookmarksPage.jsx](../src/pages/BookmarksPage.jsx)의 `useMemo([bookmarks, category])`, [useBookmarks.js](../src/hooks/useBookmarks.js), [useBookmark.js](../src/hooks/useBookmark.js)의 useCallback.

**시연 포인트:** 필터 의존성과 상세 id 의존성을 설명한다. React.memo는 현재 구현 근거로 들지 않으며, 작은 목록에서의 적용 효과는 측정과 별개다.

### 3) 인증 추가

**상태:** 로그인·가입·로그아웃·보호 경로 구현 완료. 원격 API 로그인 검증 완료, 신규 메일 확인·복귀 전체 시연은 추가 확인 범위다.

**발표 답변:** “Supabase 이메일 인증을 붙여 쓰기와 프로필을 보호했습니다. 가입 후 즉시 세션이 생기지 않으면 이메일 확인을 안내하고 로그인 성공 후 안전한 원래 내부 경로로 복귀합니다.”

**파일 근거:** [LoginPage.jsx](../src/pages/LoginPage.jsx), [AuthContext.jsx](../src/context/AuthContext.jsx), [ProtectedRoute.jsx](../src/components/ProtectedRoute.jsx), [ProfilePage.jsx](../src/pages/ProfilePage.jsx), [authRedirect.js](../src/lib/authRedirect.js), [AuthContext.test.jsx](../tests/AuthContext.test.jsx), [ProtectedRoute.test.jsx](../tests/ProtectedRoute.test.jsx).

**시연 포인트:** 비로그인 등록 접근 → 로그인 → 원래 주소 복귀, 가입 입력 → 확인 메일 안내, 프로필 → 로그아웃을 보여준다. 인증과 “작성자만 수정” 권한은 다른 설계이며 현재는 로그인 사용자끼리 북마크를 공유한다.

## 6. 개발 환경

**상태:** 충족. 원문 요구인 React 18 이상에 대해 React 19를 사용한다.

**발표 답변:** “React 19와 React Router 7, Vite 8, JavaScript·JSX·CSS로 구현했습니다. Node.js 26 환경에서 설치·빌드·테스트를 검증했습니다.”

| 항목 | 프로젝트 설정·검증 |
| --- | --- |
| React | `^19.2.7` — React 18 이상 충족 |
| React Router | `^7.18.1` |
| Vite | `^8.1.1` |
| Supabase SDK | `^2.110.8` |
| 검사 | `npm run lint`, `npm test`, `npm run build` |
| 최근 자동검사 | 2026-11-10, 8개 파일 62개 테스트 통과 |

**파일 근거:** [package.json](../package.json), [package-lock.json](../package-lock.json), [vite.config.js](../vite.config.js), [README](../README.md)의 실행·검증 기록.

**시연 포인트:** 로컬에서 `npm install → .env 설정 → npm run dev` 순서를 설명한다. PowerShell 실행 정책으로 npm.ps1이 막히면 같은 명령을 npm.cmd로 실행한다.

## 7. 제약 사항

**상태:** 원문 제약을 충족하는 구현이다. TypeScript와 반응형 디자인은 선택 사항이므로 미구현 여부를 필수 감점으로 판단하지 않는다.

**발표 답변:** “React 구조와 데이터 흐름을 중심으로 범위를 정했습니다. 직접 백엔드 서버를 만들지 않고 Supabase 원격 CRUD를 사용하며, 실제 연결값은 코드에 하드코딩하지 않습니다.”

| 원문 제약 | 적용 내용 | 파일 근거 |
| --- | --- | --- |
| React 기반 | React 19의 컴포넌트·state·이벤트 | [main.jsx](../src/main.jsx), [package.json](../package.json) |
| Supabase 또는 Firebase | Supabase PostgREST와 Auth | [supabase.js](../src/lib/supabase.js) |
| 라우팅·역할 분리 | pages/components/hooks/lib/context | [App.jsx](../src/App.jsx), [useBookmarks.js](../src/hooks/useBookmarks.js) |
| 구조·데이터 흐름 우선 | 단일 북마크 CRUD와 공용 폼·상태 UI | [BookmarkForm.jsx](../src/components/BookmarkForm.jsx), [BookmarkList.jsx](../src/components/BookmarkList.jsx) |
| 언어·스타일링 선택 | JavaScript·JSX·순수 CSS | [index.css](../src/index.css), [vite.config.js](../vite.config.js) |
| 환경변수·보안 | 실제값은 환경변수, 템플릿만 제공·.env 무시 | [.env.example](../.env.example), [.gitignore](../.gitignore) |
| 배포 환경변수 별도 등록 | Vercel 대상 환경 설정 후 재배포 | [README](../README.md)의 Vercel 가이드 |

**시연 포인트:** 폴더 구조와 .env.example의 변수 이름, .gitignore의 무시 규칙만 보여준다. 서비스 역할 키·토큰·사용자 비밀번호를 발표 자료에 넣지 않는다.

**공유 운영 범위:** B1-2는 `public.items`, simple은 `public.bookmarks`를 사용한다. 두 Vercel 앱은 하나의 Supabase 프로젝트와 Auth를 공유하지만 같은 테이블을 쓰는 것은 아니다. simple의 SQL은 `public.bookmarks`에만 한정되며 items 정책을 직접 바꾸지 않는다. 기존 Site URL을 유지하고 앱별 Redirect URL을 추가한다. 현재 옵션 없는 signOut의 기본 범위는 global이므로 같은 계정의 다른 앱 세션 갱신에 영향을 줄 수 있다. scope:local 전환이나 별도 프로젝트 분리는 이번 구현에 적용한 변경이 아니다.

## 8. 결과 예시

**상태:** 원문의 다섯 예시를 북마크 경로와 공용 UI로 대응했다. 예시는 디자인을 고정하는 추가 요구사항이 아니라 구현 흐름을 보여주는 참고다.

**발표 답변:** “원문의 items 예시는 제 서비스 주제에 맞춰 bookmarks로 구현했습니다. 목록·상세·등록 흐름과 로딩·빈 상태·실패 안내를 같은 원리로 시연할 수 있습니다.”

| 원문 예시 순서 | 이 앱의 대응 | 파일 근거 | 시연 포인트 |
| --- | --- | --- | --- |
| 1. 목록·로딩 | `/bookmarks` 카드 목록·Loading | [BookmarksPage](../src/pages/BookmarksPage.jsx) | 로딩 후 카드 표시 |
| 2. 항목 클릭·상세 | `/bookmarks/:id` | [BookmarkCard](../src/components/BookmarkCard.jsx), [BookmarkDetailPage](../src/pages/BookmarkDetailPage.jsx) | 카드 제목 클릭 |
| 3. 폼 저장·이동 | `/bookmarks/new` → 새 상세 | [BookmarkForm](../src/components/BookmarkForm.jsx), [BookmarkNewPage](../src/pages/BookmarkNewPage.jsx) | 로그인 후 등록·성공 안내 |
| 4. 빈 데이터 | “표시할 데이터가 없습니다.”·다음 행동 | [BookmarkList](../src/components/BookmarkList.jsx), [EmptyState](../src/components/EmptyState.jsx) | 첫 등록 또는 필터 초기화 |
| 5. 요청 실패 | ErrorState·재시도 | [ErrorState](../src/components/ErrorState.jsx), [useBookmarks](../src/hooks/useBookmarks.js) | 실패와 재시도 설명 |

**화면 근거 7개:** 아래 파일은 해당 화면이 표시된 정적 근거이며, 전체 CRUD 브라우저 자동검사를 대신하지 않는다.

| 캡처 | 보여주는 화면 | 연결되는 미션 번호 |
| --- | --- | --- |
| [bookmark_start.png](../screenshot/bookmark_start.png) | 홈·주요 이동 | 2-1, 4-1, 4-2 |
| [logup.png](../screenshot/logup.png) | 회원가입 입력 | 5-1, 5-3 |
| [login.png](../screenshot/login.png) | 로그인 탭·가입 후 이메일 확인 안내 | 4-6, 5-3 |
| [bookmark_list.png](../screenshot/bookmark_list.png) | 목록·카테고리 필터 | 2-2, 4-5, 4-7 |
| [bookmark_regi_confirm.png](../screenshot/bookmark_regi_confirm.png) | 북마크 등록 입력 | 2-3, 4-6 |
| [bookmark.png](../screenshot/bookmark.png) | 등록 성공 안내·상세 | 2-2, 4-5, 4-7 |
| [profile.png](../screenshot/profile.png) | 로그인 사용자 프로필 | 5-1, 5-3 |

**발표 마무리:** 코드 구현·자동검사·원격 API 검사·화면 캡처를 구분해 제시한다. 새 가입 메일 수신·복귀와 브라우저 전체 UI 시나리오는 아직 전부 확인한 결과로 말하지 않는다.
