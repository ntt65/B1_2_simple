/**
 * @file components/Input.jsx
 * @overview label, input, 에러 메시지를 하나의 field 블록으로 묶는 컴포넌트.
 */

/**
 * 텍스트 입력 필드 (label + input + 에러 메시지).
 * @param {{ label: string, error?: string, id: string }} props
 */
export function Input({ label, error, id, ...rest }) {
  return (
    <div className="field">	{/* 라벨·입력·에러를 세로로 쌓는 컨테이너 */}
      <label htmlFor={id}>{label}</label>	{/* id로 input과 연결 */}
      <input id={id} className={error ? "invalid" : ""} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...rest} />
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}
