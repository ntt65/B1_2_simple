/** 등록·수정 공용 폼. 입력 상태와 검증은 이 컴포넌트에서 관리한다. */
import { useState } from "react";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Select } from "./Select";
import { Button } from "./Button";
import { CATEGORY_FORM_OPTIONS } from "../lib/constants";
import { getSafeBookmarkUrl } from "../lib/bookmarkUrl";

const emptyValues = { title: "", url: "", memo: "", category: CATEGORY_FORM_OPTIONS[0].value };

function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = "제목을 입력하세요.";
  if (!values.url.trim()) errors.url = "URL을 입력하세요.";
  else if (!getSafeBookmarkUrl(values.url)) errors.url = "http:// 또는 https://로 시작하는 올바른 URL을 입력하세요.";
  return errors;
}

export function BookmarkForm({ initialValues = emptyValues, onSubmit, submitLabel = "저장", submitError }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState(null);

  function handleChange(field) {
    return (event) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setRequestError(null);
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    setRequestError(null);
    try {
      await onSubmit({ ...values, title: values.title.trim(), url: values.url.trim() });
    } catch {
      setRequestError("저장에 실패했습니다. 다시 시도하세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      {(submitError || requestError) && <p className="field-error form-error" role="alert">{submitError || requestError}</p>}
      <Input id="title" label="제목" value={values.title} onChange={handleChange("title")} error={errors.title} disabled={submitting} />
      <Input id="url" label="URL" value={values.url} onChange={handleChange("url")} error={errors.url} placeholder="https://..." disabled={submitting} />
      <Select id="category" label="카테고리" value={values.category} onChange={handleChange("category")} options={CATEGORY_FORM_OPTIONS} disabled={submitting} />
      <Textarea id="memo" label="메모" value={values.memo} onChange={handleChange("memo")} rows={4} disabled={submitting} />
      <Button type="submit" loading={submitting}>{submitLabel}</Button>
    </form>
  );
}
