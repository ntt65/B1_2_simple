/**
 * @file components/CategoryFilter.jsx
 * @overview 카테고리 필터 드롭다운.
 * 선택 상태를 부모가 소유하고 이 컴포넌트는 표시·이벤트 전달만 담당한다.
 */
import { Select } from "./Select";	// 드롭다운 UI
import { CATEGORY_FILTER_OPTIONS } from "../lib/constants";	// "전체" 포함 필터 옵션

/**
 * 카테고리 필터 드롭다운. value/onChange를 부모에서 받아 완전 제어(controlled)된다.
 * @param {{ value: string, onChange: Function }} props
 */
export function CategoryFilter({ value, onChange }) {
  return (
    <Select
      label="카테고리"
      id="category-filter"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={CATEGORY_FILTER_OPTIONS}
    />
  );
}
