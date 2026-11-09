/** 연결값이 없을 때 흰 화면 대신 실행에 필요한 설정을 안내한다. */
export function SetupNotice() {
  return (
    <main className="app-main setup-notice">
      <h1>Supabase 연결 설정이 필요합니다</h1>
      <p>프로젝트의 <code>.env.example</code>을 <code>.env</code>로 복사하고 실제 프로젝트 값을 입력해주세요.</p>
      <ul>
        <li><code>VITE_SUPABASE_URL</code>: Supabase 프로젝트 주소</li>
        <li><code>VITE_SUPABASE_ANON_KEY</code>: Supabase 공개 키</li>
      </ul>
      <p>로컬에서는 개발 서버를 다시 시작하고, Vercel에서는 환경변수를 등록한 뒤 다시 배포해주세요.</p>
    </main>
  );
}
