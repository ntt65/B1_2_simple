import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookmarkNewPage } from "../src/pages/BookmarkNewPage";
import { BookmarkEditPage } from "../src/pages/BookmarkEditPage";
import { BookmarkDetailPage } from "../src/pages/BookmarkDetailPage";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  insert: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
  session: { user: { id: "user-1" }, loading: false },
  bookmark: {
    id: "bookmark-1", title: "Original title", url: "https://react.dev", memo: "Keep this note",
    category: "개발", created_at: "2026-11-10T00:00:00Z",
  },
}));

vi.mock("../src/lib/supabase", () => ({
  supabase: { from: mocks.from },
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));
vi.mock("../src/hooks/useAuth", () => ({ useAuth: () => mocks.session }));
vi.mock("../src/hooks/useBookmark", () => ({
  useBookmark: () => ({ bookmark: mocks.bookmark, loading: false, error: null, refetch: vi.fn() }),
}));

function Destination() {
  const location = useLocation();
  return <p data-testid="destination">{location.pathname}</p>;
}

function renderPage(page, path, pattern) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={pattern} element={page} />
        <Route path="*" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEdit() {
  renderPage(<BookmarkEditPage />, "/bookmarks/bookmark-1/edit", "/bookmarks/:id/edit");
  fireEvent.change(screen.getByLabelText("제목"), { target: { value: "Unsaved new title" } });
  fireEvent.click(screen.getByRole("button", { name: "수정 완료" }));
}

function renderAndDelete() {
  renderPage(<BookmarkDetailPage />, "/bookmarks/bookmark-1", "/bookmarks/:id");
  fireEvent.click(screen.getByRole("button", { name: "삭제", exact: true }));
}

describe("bookmark writes with authentication and row verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.user = { id: "user-1" };
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    const query = {
      update: mocks.update, delete: mocks.delete, insert: mocks.insert,
      eq: mocks.eq, select: mocks.select, maybeSingle: mocks.maybeSingle, single: mocks.single,
    };
    mocks.from.mockReturnValue(query);
    for (const method of [mocks.update, mocks.delete, mocks.insert, mocks.eq, mocks.select]) {
      method.mockReturnValue(query);
    }
    mocks.maybeSingle.mockResolvedValue({ data: { id: "bookmark-1" }, error: null });
    mocks.single.mockResolvedValue({ data: { id: "new-bookmark" }, error: null });
  });

  it("preserves an edited form when the session expires before submission", async () => {
    mocks.requireAuthenticatedUser.mockRejectedValue(new Error("Session expired"));
    renderEdit();

    expect(await screen.findByText(/^수정에 실패했습니다/)).toBeInTheDocument();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(screen.getByLabelText("제목")).toHaveValue("Unsaved new title");
    expect(screen.getByLabelText("메모")).toHaveValue("Keep this note");
    expect(screen.queryByTestId("destination")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "수정 완료" })).toBeEnabled();
  });

  it("does not report success when an update affects no rows", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    renderEdit();

    expect(await screen.findByText(/^수정에 실패했습니다/)).toBeInTheDocument();
    expect(screen.getByLabelText("제목")).toHaveValue("Unsaved new title");
    expect(screen.queryByTestId("destination")).not.toBeInTheDocument();
  });

  it("navigates to detail only after confirming a changed row", async () => {
    renderEdit();
    expect(await screen.findByTestId("destination")).toHaveTextContent("/bookmarks/bookmark-1");
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ title: "Unsaved new title" }));
  });

  it("blocks deletion when the previously displayed login is no longer valid", async () => {
    mocks.requireAuthenticatedUser.mockRejectedValue(new Error("Session expired"));
    renderAndDelete();

    expect(await screen.findByRole("alert")).toHaveTextContent("삭제에 실패했습니다.");
    expect(mocks.from).not.toHaveBeenCalled();
    expect(screen.queryByTestId("destination")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "삭제", exact: true })).toBeEnabled();
  });

  it("does not report success when deletion affects no rows", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    renderAndDelete();

    expect(await screen.findByRole("alert")).toHaveTextContent("삭제에 실패했습니다.");
    expect(screen.queryByTestId("destination")).not.toBeInTheDocument();
  });

  it("recovers the delete button after a rejected network request", async () => {
    mocks.maybeSingle.mockRejectedValue(new Error("Network offline"));
    renderAndDelete();

    expect(await screen.findByRole("alert")).toHaveTextContent("삭제에 실패했습니다.");
    expect(screen.getByRole("button", { name: "삭제", exact: true })).toBeEnabled();
  });

  it("returns to the list after confirming a deleted row", async () => {
    renderAndDelete();
    expect(await screen.findByTestId("destination")).toHaveTextContent("/bookmarks");
    expect(mocks.delete).toHaveBeenCalledOnce();
  });

  it("keeps public detail readable while hiding anonymous write actions", () => {
    mocks.session.user = null;
    renderPage(<BookmarkDetailPage />, "/bookmarks/bookmark-1", "/bookmarks/:id");

    expect(screen.getByRole("heading", { name: "Original title" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "삭제", exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "수정", exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "로그인하고 수정하기" })).toBeInTheDocument();
  });

  it("keeps a new bookmark's input when its session expires before registration", async () => {
    mocks.requireAuthenticatedUser.mockRejectedValue(new Error("Session expired"));
    renderPage(<BookmarkNewPage />, "/bookmarks/new", "/bookmarks/new");
    fireEvent.change(screen.getByLabelText("제목"), { target: { value: "Unsaved bookmark" } });
    fireEvent.change(screen.getByLabelText("URL"), { target: { value: "https://react.dev" } });
    fireEvent.click(screen.getByRole("button", { name: "등록", exact: true }));

    expect(await screen.findByText(/^등록에 실패했습니다/)).toBeInTheDocument();
    expect(screen.getByLabelText("제목")).toHaveValue("Unsaved bookmark");
    expect(mocks.from).not.toHaveBeenCalled();
    expect(screen.queryByTestId("destination")).not.toBeInTheDocument();
  });

  it.each([
    [{ code: "23502", message: 'null value in column "user_id" of relation "bookmarks" violates not-null constraint', details: "Failing row contains (confidential-row-value)." }, /사용자|user_id/],
    [{ code: "23502", message: 'null value in column "category" of relation "bookmarks" violates not-null constraint' }, /카테고리|category/],
    [{ code: "42501", message: 'new row violates row-level security policy for table "bookmarks"' }, /권한|정책/],
    [{ code: "PGRST204", message: "Could not find the 'memo' column of 'bookmarks' in the schema cache" }, /memo/],
    [{ code: "42703", message: "column bookmarks.memo does not exist" }, /memo/],
    [{ code: "23503", message: 'insert or update on table "bookmarks" violates foreign key constraint "bookmarks_user_id_fkey"', details: 'Key (user_id)=(user-1) is not present in table "users".' }, /사용자|user_id/],
    [{ code: "23514", message: 'new row for relation "bookmarks" violates check constraint "bookmarks_category_check"' }, /카테고리|category/],
  ])("identifies a database creation error and keeps the entered form: $code / $message", async (error, explanation) => {
    mocks.single.mockResolvedValueOnce({ data: null, error });
    renderPage(<BookmarkNewPage />, "/bookmarks/new", "/bookmarks/new");
    fireEvent.change(screen.getByLabelText("제목"), { target: { value: "Bookmark to keep" } });
    fireEvent.change(screen.getByLabelText("URL"), { target: { value: "https://react.dev" } });
    fireEvent.change(screen.getByLabelText("메모"), { target: { value: "Do not discard this note" } });
    fireEvent.click(screen.getByRole("button", { name: "등록", exact: true }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(error.code);
    expect(alert).toHaveTextContent(explanation);
    expect(alert).not.toHaveTextContent("confidential-row-value");
    expect(screen.getByLabelText("제목")).toHaveValue("Bookmark to keep");
    expect(screen.getByLabelText("URL")).toHaveValue("https://react.dev");
    expect(screen.getByLabelText("메모")).toHaveValue("Do not discard this note");
    expect(screen.getByRole("button", { name: "등록", exact: true })).toBeEnabled();
    expect(screen.queryByTestId("destination")).not.toBeInTheDocument();
  });

  it.each([
    ["a network error", new Error("Unrelated internal error: do not display this message"), null],
    ["an unknown safe database code", { code: "XX000", message: "Unrelated internal error: do not display this message" }, "XX000"],
    ["an unsafe database code", { code: "XX000<script>", message: "Unrelated internal error: do not display this message" }, null],
  ])("keeps input and exposes only safe diagnostics for %s", async (_label, error, visibleCode) => {
    mocks.single.mockRejectedValueOnce(error);
    renderPage(<BookmarkNewPage />, "/bookmarks/new", "/bookmarks/new");
    fireEvent.change(screen.getByLabelText("제목"), { target: { value: "Network retry bookmark" } });
    fireEvent.change(screen.getByLabelText("URL"), { target: { value: "https://react.dev" } });
    fireEvent.click(screen.getByRole("button", { name: "등록", exact: true }));

    expect(await screen.findByRole("alert")).toHaveTextContent("등록에 실패했습니다.");
    expect(screen.getByRole("alert")).not.toHaveTextContent("Unrelated internal error");
    expect(screen.getByRole("alert")).not.toHaveTextContent("<script>");
    if (visibleCode) expect(screen.getByRole("alert")).toHaveTextContent(visibleCode);
    expect(screen.getByLabelText("제목")).toHaveValue("Network retry bookmark");
    expect(screen.getByRole("button", { name: "등록", exact: true })).toBeEnabled();
    expect(screen.queryByTestId("destination")).not.toBeInTheDocument();
  });
});
