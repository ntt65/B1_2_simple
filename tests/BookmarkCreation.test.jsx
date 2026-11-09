import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookmarkNewPage } from "../src/pages/BookmarkNewPage";

const mocks = vi.hoisted(() => ({
  from: vi.fn(), insert: vi.fn(), select: vi.fn(), single: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
  submittedValues: {
    title: "React docs", url: "https://react.dev", category: "개발", memo: "Read later", user_id: "spoofed-user",
    id: "spoofed-bookmark", created_at: "2000-01-01T00:00:00Z",
  },
}));

vi.mock("../src/lib/supabase", () => ({
  supabase: { from: mocks.from }, requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));

// 폼 경계에서 조작된 payload를 전달해 페이지가 작성자 값을 신뢰하지 않는지 검증한다.
vi.mock("../src/components/BookmarkForm", () => ({
  BookmarkForm: ({ onSubmit, submitError }) => (
    <>
      <button type="button" onClick={() => onSubmit(mocks.submittedValues)}>등록</button>
      {submitError && <p role="alert">{submitError}</p>}
    </>
  ),
}));

function Destination() {
  const location = useLocation();
  return <p data-testid="destination">{location.pathname}</p>;
}

describe("bookmark creation ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const query = { insert: mocks.insert, select: mocks.select, single: mocks.single };
    mocks.from.mockReturnValue(query);
    mocks.insert.mockReturnValue(query);
    mocks.select.mockReturnValue(query);
    mocks.single.mockResolvedValue({ data: { id: "new-bookmark" }, error: null });
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "signed-in-user" });
  });

  it("uses the authenticated user's id even when submitted values contain another user_id", async () => {
    render(
      <MemoryRouter initialEntries={["/bookmarks/new"]}>
        <Routes>
          <Route path="/bookmarks/new" element={<BookmarkNewPage />} />
          <Route path="*" element={<Destination />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "등록", exact: true }));

    expect(await screen.findByTestId("destination")).toHaveTextContent("/bookmarks/new-bookmark");
    expect(mocks.insert).toHaveBeenCalledWith({
      title: "React docs", url: "https://react.dev", category: "개발", memo: "Read later", user_id: "signed-in-user",
    });
    expect(mocks.submittedValues.user_id).toBe("spoofed-user");
  });
});
