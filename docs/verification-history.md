# 인증 추가 전 실행·배포 기록

이 파일은 README에 있던 **인증 추가 전 기록을 그대로 보존한 자료**다. 이전 배포 주소와 당시 로그를 포함하며, 현재 버전의 기능·성능·배포 상태를 보증하지 않는다.

현재 주소와 확인 범위는 [README의 최신 검증 기록](../README.md#현재-배포-확인-범위)을 기준으로 확인한다. 아래 버전·파일 크기·패키지 수는 당시 기록이다.

### 과거 실행 결과 (인증 추가 전)

```
$ npm install

added 312 packages in 8s

$ npm run dev

  VITE v8.1.1  ready in 342 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 과거 배포 CRUD 확인 기록 (인증 추가 전)

이전 문서에는 배포 URL(https://codyssey-b1-2.vercel.app)에서 아래 시나리오를 확인한 기록이 있다. 인증 추가 후에는 쓰기 작업 전에 로그인해야 하며, 이 기록으로 현재 버전의 배포 상태를 보증하지 않는다.

**시나리오 1 — 등록 (Create)**
```
1. /bookmarks/new 접속
2. 제목·URL 미입력 상태로 "등록" 클릭
   → "제목을 입력하세요.", "URL을 입력하세요." 인라인 에러 표시 ✓
3. 제목: "React 공식 문서", URL: "https://react.dev", 카테고리: "개발" 입력 후 등록
   → 버튼 "처리 중..." 비활성화 ✓
   → 성공 후 /bookmarks/{새id} 상세 페이지 자동 이동 ✓
```

**시나리오 2 — 목록 조회 & 필터 (Read)**
```
1. /bookmarks 접속
   → 로딩 스피너 표시 후 카드 목록 렌더 ✓
2. 카테고리 드롭다운 "개발" 선택
   → 페이지 새로고침 없이 개발 카테고리 카드만 표시 ✓
3. "전체 카테고리" 선택 → 전체 목록 복원 ✓
```

**시나리오 3 — 수정 (Update)**
```
1. 카드 클릭 → /bookmarks/:id 상세 이동
2. "수정" 버튼 → /bookmarks/:id/edit 이동
   → 폼에 기존 값(제목·URL·메모·카테고리) 초기화 확인 ✓
3. 제목 수정 후 "수정 완료" 클릭
   → /bookmarks/:id 상세 페이지로 이동, 수정된 제목 표시 ✓
```

**시나리오 4 — 삭제 (Delete)**
```
1. 상세 페이지 "삭제" 버튼 클릭
   → 버튼 "처리 중..." 비활성화 ✓
   → 성공 후 /bookmarks 목록 이동 ✓
   → 삭제된 항목 목록에서 미노출 ✓
```

**시나리오 5 — 에러 & 엣지 케이스**
```
1. 존재하지 않는 경로(/abcdef) 접속 → 404 NotFoundPage 표시 ✓
2. /bookmarks/new 브라우저 직접 입력 → SPA rewrite로 정상 렌더 ✓
3. 목록이 빈 상태 → "표시할 데이터가 없습니다." EmptyState 표시 ✓
```

| 시나리오 | 결과 |
| --- | --- |
| Create — 유효성 검증 + 등록 후 이동 | ✅ |
| Read — 목록 조회 + 카테고리 필터 | ✅ |
| Update — 기존 값 초기화 + 수정 후 이동 | ✅ |
| Delete — 삭제 후 목록 이동 + 미노출 | ✅ |
| Not Found, 직접 URL 접근, Empty 상태 | ✅ |

### 과거 빌드 결과 (인증 추가 전)

```
$ npm run build

vite v8.1.1 building for production...
✓ 87 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/index-BkR3qX2m.css   6.12 kB │ gzip:  2.01 kB
dist/assets/index-Dv9K7Lem.js  189.34 kB │ gzip: 61.48 kB
✓ built in 1.24s
```
