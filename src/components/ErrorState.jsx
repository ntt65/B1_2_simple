/**
 * @file components/ErrorState.jsx
 * @overview 요청 실패 시 에러 메시지와 재시도 버튼을 표시하는 컴포넌트.
 */
import { Button } from "./Button";	// 재시도 버튼

/**
 * 에러 상태 UI. onRetry가 있으면 "다시 시도" 버튼을 함께 렌더한다.
 * @param {{ message?: string, onRetry?: Function }} props
 */
export function ErrorState({ message = "요청에 실패했습니다. 다시 시도하세요.", onRetry }) {
  return (
    <div className="state state-error" role="alert">	{/* role="alert"으로 스크린 리더에 에러 알림 */}
      <p>{message}</p>	{/* 에러 메시지 */}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>	{/* secondary 스타일 재시도 버튼 */}
          다시 시도
        </Button>
      )}
    </div>
  );
}
