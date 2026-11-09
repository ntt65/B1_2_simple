/**
 * @file main.jsx
 * @overview 앱 진입점. React DOM 루트를 생성하고 BrowserRouter + App을 마운트한다.
 */
import { StrictMode } from 'react'	// 개발 모드에서 잠재적 문제를 감지하는 래퍼
import { createRoot } from 'react-dom/client'	// React 18 동시성 렌더 루트 생성 API
import { BrowserRouter } from 'react-router-dom'	// HTML5 History API 기반 라우터 컨텍스트
import './index.css'	// 전역 스타일시트
import App from './App.jsx'	// 라우트 트리 루트 컴포넌트
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root'))	// index.html의 <div id="root">에 React 루트 생성
  .render(
    <StrictMode>	{/* 개발 전용: 부작용 이중 실행으로 문제 조기 발견 */}
      <BrowserRouter>	{/* 전체 앱에 라우팅 컨텍스트 제공 */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
