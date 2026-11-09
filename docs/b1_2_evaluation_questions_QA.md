# 평가문항 QA

> 기술 스택 상세: [tech.md](./tech.md)

2026-11-10 기준 구현 설명이다. 사용자 Context와 인증 보너스를 추가했다. 코드 구현과 원격 환경 검증을 구분하며, 인증 추가 버전의 실제 Supabase 정책 적용·메일 확인·배포 CRUD는 별도 확인이 필요하다.

---

## 항목 1

### Q. 최소 5개 이상의 라우트가 동작하고, 잘못된 주소 접근 시 Not Found 페이지가 표시되는가?

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

### Q. 목록 조회, 상세 조회, 등록, 수정, 삭제가 모두 정상 동작하는가?

**✅**

| 동작 | 파일 | Supabase 쿼리 |
| --- | --- | --- |
| 목록 조회 | `useBookmarks.js` | `.from("bookmarks").select("*").order("created_at", { ascending: false })` |
| 상세 조회 | `useBookmark.js` | `.from("bookmarks").select("*").eq("id", id).maybeSingle()` |
| 등록 | `BookmarkNewPage` → `handleCreate` | `.from("bookmarks").insert(values).select().single()` |
| 수정 | `BookmarkEditPage` → `handleUpdate` | `.from("bookmarks").update(values).eq("id", id).select("id").maybeSingle()` |
| 삭제 | `BookmarkDetailPage` → `handleDelete` | `.from("bookmarks").delete().eq("id", id).select("id").maybeSingle()` |

성공/실패 후 흐름: 등록 성공 → 새 레코드 상세(`/bookmarks/:id`) 이동. 수정 성공 → 해당 상세 이동. 삭제 성공 → 목록(`/bookmarks`) 이동.

등록·수정·삭제는 로그인 세션을 확인한다. 수정·삭제에서 반환된 행이 없으면 성공으로 이동하지 않고 실패를 표시한다. 원격 권한은 `schema.sql`과 기존 DB용 `supabase/policies-authenticated-writes.sql`에 공개 조회·로그인 사용자 쓰기로 정의했다. 로그인 사용자 사이에 작성자별 소유권은 구분하지 않는다.

---

### Q. 로딩/에러/빈 상태가 모든 핵심 화면에서 일관된 방식으로 표시되는가?

**✅**

세 가지 공용 컴포넌트로 통일했다. 페이지마다 별도로 구현하지 않는다.

| 상태 | 컴포넌트 | 특징 |
| --- | --- | --- |
| 로딩 중 | `Loading` | CSS 스피너 + 메시지, `role="status"` |
| 에러 | `ErrorState` | 메시지 + 재시도 버튼(선택), `role="alert"` |
| 빈 데이터 | `EmptyState` | 등록 유도 또는 필터 초기화 액션과 안내 메시지 |

`BookmarksPage`, `BookmarkDetailPage`, `BookmarkEditPage` 세 화면 모두 동일한 패턴으로 처리한다.

```jsx
{loading && <Loading message="북마크를 불러오는 중..." />}
{!loading && error && <ErrorState message="요청에 실패했습니다." onRetry={refetch} />}
{!loading && !error && <BookmarkList bookmarks={filtered} />}
```

---

### Q. 폼에서 필수값 검증, 에러 메시지 표시, 제출 중 상태 표시가 동작하는가?

**✅**

`BookmarkForm.jsx`가 등록·수정 양쪽에서 공용으로 처리한다.

- **필수값 검증**: `validate()` 함수가 `title`, `url`의 `trim()` 결과가 빈 문자열이면 에러 객체를 반환한다. URL은 `bookmarkUrl.js`로 파싱 가능한 HTTP/HTTPS 절대 주소인지도 확인한다.
- **에러 메시지**: `errors` state가 채워지면 `Input` 컴포넌트가 필드 아래에 `<p className="field-error">` 를 렌더하고 `invalid` 클래스로 테두리를 빨갛게 표시한다. 다시 입력을 시작하는 순간 해당 필드 에러가 지워진다.
- **제출 중 상태**: `submitting: true`이면 `Button`이 `disabled`되고 텍스트가 "처리 중..."으로 바뀐다. `try/finally`로 성공·실패 무관하게 제출 완료 시 해제된다.
- **요청 실패**: Supabase 에러 시 페이지가 `submitError` prop을 내려주고 폼 상단에 표시된다.

---

### Q. 배포된 URL에서 CRUD를 포함한 모든 기능이 정상 동작하는가?

**일부 확인 — 배포 홈·읽기 API 접근 확인, 원격 CRUD·인증 검증 필요**

- 현재 배포 URL은 https://b1-2-simple.vercel.app 이다. 사용자 제공 화면에서 Bookmark Keeper 홈·로그인 메뉴·공개 조회/로그인 쓰기 안내가 현재 구현과 일치하는 것을 확인했다.
- 홈·배포 JavaScript의 HTTP 200을 확인했다. `/bookmarks`, `/login`, `/bookmarks/new`, `/profile`, `/not-a-real-page`도 HTTP 200과 React 앱 HTML을 반환했다. 이는 SPA rewrite의 HTTP 응답 확인이며, 해당 화면 렌더링·보호 라우트의 로그인 차단을 브라우저에서 검증한 것은 아니다.
- Supabase의 `GET /rest/v1/bookmarks?select=id&limit=0`이 HTTP 200을 반환했다. 실제 데이터를 가져오거나 변경하지 않고 읽기 API 접근성만 확인했다.
- `GET /auth/v1/settings`의 HTTP 200과 이메일 인증 활성화·회원가입 허용·이메일 확인 필요 설정을 확인했다. 로그인·회원가입 요청이나 메일 발송은 실행하지 않았다.
- 기존 B1-2와 공유하는 Supabase 프로젝트의 Site URL·허용 주소는 유지하고, Redirect URLs에 `https://b1-2-simple.vercel.app/**`를 추가해야 한다. `VITE_APP_URL`을 사용한다면 이 앱의 주소를 지정하고 실제 새 확인 메일의 복귀 링크를 확인한다.
- 실제 목록·상세 데이터 표시, 로그인 후 등록·수정·삭제·프로필·로그아웃, 인증 메일 수신·복귀는 추가 검증이 필요하다. 원격 DB 정책 원문과 쓰기 권한도 아직 확인하지 않았으며, SQL 파일 추가만으로 원격 적용 여부를 확정하지 않는다.

이 확인은 2026-11-10의 홈 화면과 읽기 전용 HTTP 검사에 한정된다. 공개 연결값을 파일이나 검사 로그에 저장하지 않았다. 자동 테스트는 외부 Supabase 응답을 대체하므로 실제 원격 DB·메일·인증 CRUD 성공을 대신하지 않는다. 이전 배포 URL `https://codyssey-b1-2.vercel.app`의 기록은 README의 과거 배포 구역에 보존했다.

---

## 항목 2

### Q. 데이터 조회/갱신 흐름 중 최소 1개 이상이 커스텀 훅으로 분리되어 있고 왜 분리했는지 설명할 수 있는가?

**✅ — 조회 훅 2개와 인증 훅 1개**

**`src/hooks/useBookmarks.js`** — 목록 조회
```js
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refetch = useCallback(async () => { ... }, []);
  useEffect(() => { refetch(); }, [refetch]);
  return { bookmarks, loading, error, refetch };
}
```
- 사용처: `BookmarksPage` (1곳)

**`src/hooks/useBookmark.js`** — 단건 조회 (id 기반)
```js
export function useBookmark(id) {
  const [bookmark, setBookmark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refetch = useCallback(async () => {
    ...
    .eq("id", id).maybeSingle();   // 없으면 null, 에러 아님
  }, [id]);                         // id 바뀌면 새 함수 → useEffect 재실행
  useEffect(() => { refetch(); }, [refetch]);
  return { bookmark, loading, error, refetch };
}
```
- 사용처: `BookmarkDetailPage`, `BookmarkEditPage` (2곳)

**`src/hooks/useAuth.js`** — `AuthContext`의 로그인 사용자·세션 확인 상태와 로그인·가입·로그아웃 함수를 사용한다. 헤더·로그인·프로필·보호 라우트가 같은 사용자 상태를 공유한다.

**분리한 이유:**
1. **관심사 분리**: 페이지 컴포넌트가 Supabase 쿼리를 몰라도 된다. `{ loading, error, data, refetch }`만 받아 화면에 집중한다.
2. **재사용 제거 중복**: `useBookmark(id)` 없이 구현하면 `BookmarkDetailPage`와 `BookmarkEditPage` 두 곳에 동일한 `useState` + `useEffect` + Supabase 코드가 중복된다.
3. **외부 `refetch` 호출**: `ErrorState` 재시도 버튼에서 `refetch()`를 직접 호출한다. 훅 내부에 숨기면 외부 트리거가 불가능하다.

기술 상세 → [tech.md — useEffect + useCallback 패턴](./tech.md#useeffect--usecallback-패턴)

---

### Q. pages, components, hooks(또는 lib)로 폴더가 분리되어 있고 이 구조를 선택한 이유를 설명할 수 있는가?

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

### Q. 최소 8개 이상의 재사용 컴포넌트가 있고 어떤 기준으로 컴포넌트를 나눴는지 구체적으로 말할 수 있는가?

**✅ — 기존 공용 UI 13개와 보호 라우트**

나누는 기준은 두 가지였다.

**기준 1 — 반복 패턴 추출**: 같은 UI가 여러 곳에서 쓰이면 컴포넌트로 뽑는다.
- `Loading`, `ErrorState`, `EmptyState`: 세 화면 모두 동일 패턴
- `BookmarkForm`: 등록과 수정 폼이 필드 구성이 같아서 `initialValues` prop 하나로 공용화

**기준 2 — 단일 책임**: "이 컴포넌트가 하는 일이 하나인가"를 기준으로 나눈다.
- `Button`: 클릭 가능한 요소의 스타일과 상태(`variant`, `loading`, `disabled`)만 담당
- `Input`, `Textarea`, `Select`: label + 입력 + 에러 메시지 하나의 블록으로 묶는 역할만
- `Card`: 흰 카드 컨테이너 역할만 (내용을 모름)
- `BookmarkCard`: 카드 한 장 렌더만 (목록이나 데이터 가져오는 방법을 모름)
- `BookmarkList`: 배열을 받아 카드를 나열하거나 EmptyState를 보여주는 역할만
- `ProtectedRoute`: 세션 확인과 비로그인 이동을 등록·수정·프로필 라우트에서 공통 처리

---

### Q. 로딩/에러/빈 상태 UI가 페이지마다 따로 구현되지 않고 공통 컴포넌트로 통일되어 있는지 코드에서 보여줄 수 있는가?

**✅**

`BookmarksPage`, `BookmarkDetailPage`, `BookmarkEditPage` 세 파일을 열어보면 동일한 컴포넌트를 import한다.

```jsx
// 세 페이지 모두 동일한 import
import { Loading } from "../components/Loading";
import { ErrorState } from "../components/ErrorState";

// 세 페이지 모두 동일한 패턴
if (loading) return <Loading message="북마크를 불러오는 중..." />;
if (error)   return <ErrorState message="요청에 실패했습니다." onRetry={refetch} />;
```

빈 상태의 공통 화면은 `BookmarkList` 내부에서 `EmptyState`를 사용해 렌더한다. 페이지는 데이터·필터 상황에 맞는 액션을 전달한다.

`BookmarksPage`는 빈 목록에 맞는 `emptyAction`을 전달한다. 전체 북마크가 없으면 등록으로 안내하고, 카테고리 필터에만 결과가 없으면 전체 카테고리로 되돌린다. 비로그인 사용자의 등록 접근은 보호 라우트가 로그인으로 연결한다.

---

### Q. 커스텀 훅으로 분리한 데이터 흐름이 1개 이상 있고 왜 훅으로 분리했는지 이유를 말할 수 있는가?

앞의 항목 2 첫 번째 답변과 동일하다. 조회 훅 `useBookmarks`, `useBookmark(id)`와 인증 훅 `useAuth`가 있다. 조회 훅의 분리 이유는 관심사 분리·재사용·외부 `refetch` 호출이며, `useAuth`는 여러 화면이 같은 사용자 Context를 사용하도록 한다.

---

## 항목 3

### Q. props와 state의 차이를 구분하고 상태를 어디에 두었는지 흐름을 따라며 대답할 수 있는가?

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

### Q. useEffect가 언제 실행되는지, 의존성 배열이 어떤 역할을 하는지 본인 코드 기준으로 짚어가며 답변할 수 있는가?

**✅**

`useBookmarks`와 `useBookmark` 두 훅에서 사용한다.

```js
// useBookmarks — 마운트 1회만 실행
const refetch = useCallback(async () => { ... }, []);
//                                                ↑ 의존성 없음 → 컴포넌트 생명주기 동안 같은 함수 참조 유지
useEffect(() => {
  refetch();
}, [refetch]);
// refetch가 항상 같은 참조 → useEffect는 마운트 시 1회만 실행됨

// useBookmark(id) — id 바뀔 때마다 재실행
const refetch = useCallback(async () => { ... }, [id]);
//                                                ↑ id가 바뀌면 새 함수 생성
useEffect(() => {
  refetch();
}, [refetch]);
// refetch 참조가 바뀌었으므로 useEffect 재실행 → 새 id로 재조회
```

의존성 배열의 역할: React가 이전 렌더와 현재 렌더의 배열 값을 비교(`Object.is`)해서 하나라도 달라졌으면 effect를 재실행한다. 빈 배열 `[]`이면 비교할 대상이 없어 마운트 1회만 실행된다.

여기서 1회는 일반적인 마운트 흐름을 설명한다. 개발 모드의 StrictMode는 Effect를 추가 실행하므로 개발 중 추가 조회가 보일 수 있다. 인증 Context도 Effect 정리에서 이벤트 구독을 해제한다.

기술 상세 → [tech.md — useEffect + useCallback 패턴](./tech.md#useeffect--usecallback-패턴)

---

### Q. 비동기 데이터 요청 시 로딩/성공/실패/빈 상태를 React에서 어떤 방식으로 처리했는지 보여주고 설명할 수 있는가?

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

### Q. 상태 변경이 화면 변화로 이어지는 지점을 3군데 이상 코드에서 짚어가며 설명할 수 있는가?

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

### Q. 하나의 기능이 동작하기까지 라우팅 → 컴포넌트 → 상태 → 이벤트 → 렌더링이 어떻게 이어지는지 설명할 수 있는가?

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
   → supabase.insert(values).select().single()
   → 성공: navigate("/bookmarks/{새 id}") → 상세 페이지로 이동
   → Layout이 이동 결과의 성공 안내를 role="status"로 표시
   → 실패: submitError state 설정 → BookmarkForm 상단 에러 메시지 렌더
   → finally: setSubmitting(false)
```

---

### Q. Supabase 또는 Firebase를 선택한 이유와 연동하면서 겪은 어려움을 구체적으로 말할 수 있는가?

**✅**

**선택 이유 — Firebase 대신 Supabase를 선택한 근거:**

| 기준 | Supabase | Firebase |
| --- | --- | --- |
| DB 구조 | PostgreSQL — 컬럼·타입 명확, `schema.sql`로 버전 관리 가능 | NoSQL — 단순 CRUD에 컬렉션 설계 오버헤드 |
| SDK 가독성 | `.from("bookmarks").select("*").order(...)` — SQL과 1:1 | `.collection("bookmarks").orderBy(...)` — Firebase 전용 문법 |
| 권한 관리 | `schema.sql`로 공개 조회·로그인 사용자 쓰기 정책 관리 | Security Rules로 데이터 접근 권한 관리 |

**연동 중 겪은 어려움과 해결:**

| 에러 | 원인 | 해결 |
| --- | --- | --- |
| `useEffect` 무한 루프 | `refetch`를 `useCallback` 없이 의존성에 넣어 렌더마다 새 함수 참조 생성 | `useCallback([])` / `useCallback([id])`로 메모이제이션 |
| `.single()` PostgrestError | 없는 id 조회 시 결과가 0건이어서 에러 발생 | `.maybeSingle()`로 교체 — 없으면 `null` 반환 |
| 배포 후 흰 화면 (이전 구현) | 환경변수 누락 시 모듈 초기화에서 예외 발생 | 현재는 설정 안내 화면 표시. 환경변수를 등록한 뒤 재시작·재배포 |
| 수정·삭제가 0행인데 성공처럼 이동 | 권한 거부나 대상 삭제에도 요청 오류가 없을 수 있음 | 변경된 행을 반환받아 확인하고, 없으면 실패 표시 |

상세 → [tech.md — Supabase 선택 이유](./tech.md#supabase-선택-이유)

---

## 항목 5

### 보너스 문제 해결에 따른 크레딧 부여

| 보너스 항목 | 구현 | 내용 |
| --- | --- | --- |
| 전역 상태 (Context) | ✅ | `AuthProvider`가 초기 세션·인증 이벤트를 관리하고 `useAuth`를 통해 사용자 상태를 헤더·로그인·프로필·보호 라우트에 공유 |
| 성능 최적화 (메모이제이션) | ✅ | `BookmarksPage`에서 `useMemo`로 카테고리 필터 결과 메모이제이션 — `bookmarks`나 `category`가 바뀔 때만 재계산. 두 커스텀 훅에서 `useCallback`으로 `refetch` 메모이제이션 — `useEffect` 무한 루프 방지 |
| 인증 (Supabase Auth + 보호 라우트) | ✅ | 이메일 로그인·회원가입·로그아웃, 등록·수정·프로필 보호, 로그인 후 원래 내부 경로 복귀, 가입 확인 메일 안내 |

인증 흐름은 `main.jsx`의 `AuthProvider` → `AuthContext.jsx`의 세션 확인·이벤트 구독 → `useAuth` → 각 화면의 조건부 렌더링으로 이어진다. `LoginPage`는 제출 중 버튼·모드 전환을 잠그고 실패 시 입력을 유지한다. 가입 직후 세션이 없으면 메일 확인 안내를 표시한다. 복귀 경로는 `authRedirect.js`에서 검증해 외부 주소로 이동하지 않도록 한다.

보호 라우트와 쓰기 UI는 정상 화면 접근을 제어하며, 직접 HTTP 요청에 대한 데이터 권한은 Supabase에 실제 적용된 RLS가 결정한다. 이 저장소의 SQL은 로그인 사용자 모두에게 북마크 쓰기를 허용하는 공유 데이터 정책이다.

---

## 6. 평가결과

| 항목 | 결과 |
| --- | --- |
| 항목 1 — 동작 검증 | 코드 구현 완료. 인증 추가 버전의 실제 원격·배포 CRUD 확인 필요 |
| 항목 2 — 구조 설명 | ✅ 전항목 설명 가능 |
| 항목 3 — React 개념 | ✅ 전항목 코드 기준 설명 가능 |
| 항목 4 — 통합 흐름 | ✅ 등록 흐름 전 단계 추적 가능 |
| 항목 5 — 보너스 | ✅ 전역 사용자 Context·메모이제이션·Supabase Auth 및 보호 라우트 구현 |

**필수 기능과 보너스 3개를 코드에 구현했다. 배포 완료 여부는 실제 원격 DB 정책·인증 메일·배포 CRUD 검증 후 판단한다.**
