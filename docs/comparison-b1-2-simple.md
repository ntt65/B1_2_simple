# B1-2와 B1_2_simple 비교 기록

> 아래 비교 본문은 `simple`에 인증을 추가하기 전의 기록을 보존한 것이다. 2026-11-10의 인증 추가 내용은 문서 끝의 부록을 참고한다. 본문에서 B1-2를 가리키는 상대 링크는 원래 B1-2 폴더를 기준으로 작성되어 현재 simple 폴더에는 없는 파일도 있다.

- 기록일: 2026-11-10
- 비교 대상: 현재 B1-2 작업 트리(기준 커밋 `e4c1ce6`)와 [ntt65/B1_2_simple](https://github.com/ntt65/B1_2_simple)의 기본 브랜치 소스
- 목적: 같은 React CRUD 미션인데 B1-2가 더 복잡하게 느껴지는 이유와 단순화 방향을 남긴다.
- 범위: 소스와 요구사항 비교다. 이번 기록에서 두 앱의 빌드·배포 CRUD를 새로 검증하지 않았다. 외부 저장소의 `main` 링크는 이후 변경될 수 있다.

## 판단

B1-2는 필수 CRUD에 인증, 오프라인 학습 모드, 성능 보너스와 검증 도구를 추가하면서 다뤄야 할 상태와 호출 단계가 늘었다. 기능을 추가한 이유는 있지만, 입문자가 React의 데이터 흐름을 익히는 목적에는 부담이 크다. 등록 화면에서 사용하지 않는 목록까지 조회하는 등 실제로 줄일 수 있는 결합도 있다.

B1_2_simple은 인증과 저장소 전환을 생략하고 조회 훅과 페이지 핸들러에서 Supabase를 직접 호출한다. 기본 미션의 흐름을 따라가기 쉽지만, 두 앱의 기능·권한·검증 범위가 같다는 뜻은 아니다.

## 주요 차이

| 항목 | B1_2_simple | B1-2 | 복잡성에 미치는 영향 |
|---|---|---|---|
| 데이터 주제 | 북마크(title/url/memo/category) | 학습 아이템(title/content/category) | 같은 미션의 서로 다른 구현 주제다. |
| 인증 | 로그인·전역 사용자 상태 없음 | 로그인·회원가입·프로필·AuthContext·보호 라우트·리다이렉트 | 세션 로딩과 로그인 여부에 따른 화면 분기가 추가된다. |
| 저장 방식 | Supabase 하나 | Supabase 또는 명시적으로 켠 LocalStorage 학습 모드 | 모드 판별, 공통 CRUD API, 로컬 DB, 데이터 소스 배지가 추가된다. |
| 조회 | 조회 훅에서 Supabase 직접 호출 | 조회 훅에서 `lib/api.js` 호출 | B1-2는 API 안에서 저장소까지 선택한다. |
| 등록·수정·삭제 | 각 페이지 핸들러에서 Supabase 직접 호출 | `useItems`/`useItem`의 변경 함수 → 공통 API | 페이지·훅·API 사이의 상태와 반환값을 함께 이해해야 한다. |
| 쓰기 권한 | SQL에서 `anon`에 전체 CRUD 허용 | 공개 조회, 로그인 사용자 쓰기 정책 및 UI·라우트·API 검사 | 인증과 권한을 유지하기 위한 코드가 더 많다. |
| 성능 학습 | 필터 `useMemo`, 조회 함수 `useCallback` | 여기에 카드 `memo`, 카테고리별 개수 계산, 삭제 콜백 등 | 두 앱 모두 메모이제이션을 쓴다. B1-2에만 있는 차이는 아니다. |
| 검증 도구 | `package.json`에 dev/build/lint/preview | Vitest·Testing Library·Playwright·원격 CRUD 검사 스크립트 | 저장소 규모와 실행 명령은 늘지만, 검증 코드 자체가 화면의 복잡성을 만드는 것은 아니다. |

근거: simple의 [README](https://github.com/ntt65/B1_2_simple/blob/main/README.md), [조회 훅](https://github.com/ntt65/B1_2_simple/blob/main/src/hooks/useBookmarks.js), [등록 화면](https://github.com/ntt65/B1_2_simple/blob/main/src/pages/BookmarkNewPage.jsx), [권한 SQL](https://github.com/ntt65/B1_2_simple/blob/main/schema.sql), [package.json](https://github.com/ntt65/B1_2_simple/blob/main/package.json). B1-2의 [AuthContext](../src/context/AuthContext.jsx), [API](../src/lib/api.js), [LocalStorage DB](../src/lib/localDB.js), [권한 SQL](../supabase/policies-authenticated-writes.sql), [package.json](../package.json).

## 구체적인 불필요한 처리: 등록 화면의 목록 조회

simple의 등록 흐름은 [BookmarkNewPage](https://github.com/ntt65/B1_2_simple/blob/main/src/pages/BookmarkNewPage.jsx)의 `handleCreate`에서 확인할 수 있다.

```text
폼 제출 → Supabase insert → 오류 표시 또는 새 상세 페이지 이동
```

B1-2의 [ItemNewPage](../src/pages/ItemNewPage.jsx)는 등록 함수 `addItem`과 `mutationError`만 필요해도 [useItems](../src/hooks/useItems.js)를 호출한다.

```text
등록 화면 진입 → useItems의 Effect → 전체 목록 조회
폼 제출 → addItem → db.insert → 저장소·쓰기 권한 확인 → 저장
저장 성공 → 해당 훅의 items 상태 갱신 → 새 상세 페이지 이동
```

등록 화면은 조회한 목록을 표시하지 않는다. 또한 `useItems()` 호출마다 상태가 독립적이므로 등록 화면의 `setItems`는 다른 페이지의 목록을 공유 갱신하지 않는다. 상세로 이동하면 등록 화면의 상태도 사라진다.

등록 요청을 목록 조회 훅에서 분리하면 이 불필요한 조회와 상태 갱신을 없앨 수 있다. 기존 공통 API를 유지하면서 페이지에서 `db.insert`를 호출하는 방법도 있다.

## 필수 구조와 추가 범위 구분

[QUEST.md](../QUEST.md)의 필수 요구는 다음과 같다.

- 최소 5개 라우트와 Not Found, 원격 CRUD
- 공통 로딩·오류·빈 상태 UI
- 필수값 검증, 제출 중 표시·비활성화, 오류 메시지
- pages/components/hooks(또는 lib) 분리
- 재사용 컴포넌트 8개 이상과 커스텀 훅 1개 이상

따라서 폴더 분리, 공용 폼, 조회 훅, 공통 상태 UI는 유지할 이유가 있다. 반면 인증·전역 사용자 상태·성능 최적화는 보너스 범위이고 LocalStorage 학습 모드는 추가 편의 기능이다. 미션은 권한/RLS 같은 고급 백엔드를 필수로 요구하지 않는다.

API 계층도 그 자체로 불필요하지 않다. 현재 B1-2에서는 두 저장소의 차이와 쓰기 검사를 모으는 역할을 한다. 저장소를 하나만 지원하기로 범위를 줄이면 해당 계층도 더 짧게 만들 수 있다.

## 가독성과 단순화 방향

B1-2의 긴 inline style과 자명한 줄별 설명 주석은 핵심 동작을 찾기 어렵게 만든다. simple에도 상세 주석이 있으므로 주석 유무만으로 차이를 설명할 수는 없다. 문서·테스트·주석을 포함한 줄 수나 파일 수만으로 코드 품질을 판단하지 않는다.

1. 등록 동작을 목록 조회 훅에서 분리해 불필요한 조회와 상태 갱신을 없앤다.
2. 반복 스타일을 CSS로 옮기고, 주석은 문법의 반복 설명보다 설계 이유와 주의점을 중심으로 정리한다.
3. 공용 폼, 조회 훅, 공통 상태 UI와 필수 컴포넌트 수는 유지한다.
4. 조회 오류와 저장·삭제 오류를 구분하고, 실패해도 입력한 폼이 유지되는 처리는 유지한다.
5. 작은 목록의 필터 `useMemo`와 카드 `memo`는 필요성을 검토한다. 조회 함수의 `useCallback`은 Effect 의존성과 연결되어 있어 삭제하려면 Effect 구조도 함께 조정해야 한다.
6. 학습용 최소 버전을 따로 만든다면 Supabase 하나로 범위를 좁히고 인증 보너스는 별도 단계로 다룬다. 현재 인증 기능을 유지하는 앱에서는 보호 라우트와 DB 권한 정책도 유지한다.

이 문서는 비교와 개선 후보를 기록한 것이며, 위 단순화를 구현했다는 의미는 아니다.

## 부록: 2026-11-10 simple의 미구현 보너스 추가

[B1-2의 인증 흐름](https://github.com/ntt65/B1-2/blob/main/src/context/AuthContext.jsx)을 참고해 평가표에 미구현으로 남아 있던 전역 사용자 상태와 Supabase Auth를 simple에 추가했다. 위 표의 "로그인·전역 사용자 상태 없음"과 "anon에 전체 CRUD 허용"은 변경 전 상태다.

| 항목 | 이번 simple 구현 |
|---|---|
| 전역 상태 | [AuthContext](../src/context/AuthContext.jsx)와 [useAuth](../src/hooks/useAuth.js)에서 사용자·초기 세션 확인·인증 이벤트 공유 |
| 로그인·가입 | [LoginPage](../src/pages/LoginPage.jsx)의 이메일 로그인·표시 이름을 포함한 회원가입·확인 메일 안내 |
| 보호 경로 | [ProtectedRoute](../src/components/ProtectedRoute.jsx)로 등록·수정·프로필 보호, 로그인 후 원래 내부 경로 복귀 |
| 프로필·로그아웃 | [ProfilePage](../src/pages/ProfilePage.jsx)에 표시 이름·이메일·가입일과 로그아웃 제공 |
| 쓰기 권한 | 공개 조회, 로그인 사용자 등록·수정·삭제. UI·페이지의 세션 확인과 원격 DB용 RLS SQL 제공 |
| 실패 처리 | 환경변수 누락 안내, 인증 요청 실패 표시, 수정·삭제 0행 결과를 실패로 처리 |
| 추가 UX | 빈 목록 등록·필터 초기화 안내, CRUD 성공 후 닫을 수 있는 메시지, HTTP/HTTPS URL 검증과 위험 링크 비활성화 |
| 검증 도구 | Vitest·Testing Library로 인증 상태·보호 라우트·요청 실패 등을 외부 API 없이 검사 |

데이터 주제와 단순한 CRUD 흐름은 유지했다. 조회는 `pages → hooks → Supabase`, 등록·수정·삭제는 `pages → Supabase`이며 등록 화면에서 전체 목록을 미리 조회하지 않는다. B1-2의 LocalStorage 학습 모드나 저장소 전환용 `api.js`는 추가하지 않았다.

[schema.sql](../schema.sql)은 신규 테이블과 권한을 위한 SQL이고, [기존 DB 권한 전환 SQL](../supabase/policies-authenticated-writes.sql)은 기존 익명 쓰기 정책을 로그인 사용자 쓰기로 바꾼다. 작성자별 소유권은 구분하지 않아 로그인 사용자 사이에서는 북마크가 공유된다. SQL 파일 추가는 실제 원격 프로젝트에 적용했다는 뜻이 아니다.

실행에는 실제 Supabase 공개 환경변수와 이메일 인증 설정이 필요하다. 가입 확인 메일이 돌아오는 `/login?redirect=...` 주소를 Supabase의 Redirect URLs에서 허용해야 한다. 이번 변경에서 원격 DB 정책 적용·실제 메일 수신·배포 CRUD는 검증하지 않았으며, 현재 실행·설정 방법과 평가 설명은 [README](../README.md)와 [평가문항 QA](./b1_2_evaluation_questions_QA.md)에 정리했다.
