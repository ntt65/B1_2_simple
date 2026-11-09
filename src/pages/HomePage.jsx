/**
 * @file pages/HomePage.jsx
 * @overview / 라우트. 서비스 소개 문구와 목록/등록 페이지로의 CTA 링크를 제공한다.
 */
import { Link } from "react-router-dom";	// 클라이언트 사이드 네비게이션 링크

/**
 * 홈 화면. 서비스 소개와 주요 액션으로의 진입점을 제공한다.
 */
export function HomePage() {
  return (
    <section className="home">	{/* 홈 전용 레이아웃 클래스 */}
      <h1>Bookmark Keeper</h1>	{/* 서비스명 */}
      <p>읽고 싶은 링크를 저장하고, 카테고리로 분류하고, 메모를 남기는 북마크 관리 서비스입니다.</p>
      <p>목록과 상세는 누구나 볼 수 있고, 로그인하면 북마크를 등록·수정·삭제할 수 있습니다.</p>
      <div className="home-actions">	{/* CTA 버튼 영역 */}
        <Link className="btn btn-primary" to="/bookmarks">	{/* 목록 페이지 이동 CTA */}
          북마크 목록 보기
        </Link>
        <Link className="btn btn-secondary" to="/bookmarks/new">	{/* 등록 페이지 이동 CTA */}
          새 북마크 등록
        </Link>
      </div>
    </section>
  );
}
