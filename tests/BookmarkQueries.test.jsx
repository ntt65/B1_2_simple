import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBookmark } from "../src/hooks/useBookmark";
import { useBookmarks } from "../src/hooks/useBookmarks";

const queries = vi.hoisted(() => ({ from: vi.fn(), single: vi.fn(), list: vi.fn() }));

vi.mock("../src/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: { from: queries.from },
}));

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

describe("bookmark query races and retries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queries.single.mockReset().mockResolvedValue({ data: { id: "A", title: "Initial detail" }, error: null });
    queries.list.mockReset().mockResolvedValue({ data: [{ id: "A", title: "Initial list" }], error: null });
    queries.from.mockImplementation(() => ({
      select: () => ({
        eq: (_column, id) => ({ maybeSingle: () => queries.single(id) }),
        order: () => queries.list(),
      }),
    }));
  });

  it("ignores the previous id's delayed response after the new bookmark has loaded", async () => {
    const previous = deferred();
    const current = deferred();
    queries.single.mockImplementation((id) => id === "A" ? previous.promise : current.promise);
    const { result, rerender } = renderHook(({ id }) => useBookmark(id), { initialProps: { id: "A" } });

    rerender({ id: "B" });
    await act(async () => { current.resolve({ data: { id: "B", title: "Current bookmark" }, error: null }); });
    expect(result.current.bookmark).toEqual({ id: "B", title: "Current bookmark" });

    await act(async () => { previous.resolve({ data: { id: "A", title: "Stale bookmark" }, error: null }); });
    expect(result.current.bookmark).toEqual({ id: "B", title: "Current bookmark" });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("does not expose the previous bookmark during the new id's first render", async () => {
    const next = deferred();
    const renders = [];
    queries.single.mockImplementation((id) => id === "A"
      ? Promise.resolve({ data: { id: "A", title: "Previous bookmark" }, error: null })
      : next.promise);
    const { result, rerender } = renderHook(({ id }) => {
      const state = useBookmark(id);
      renders.push({ id, bookmark: state.bookmark, loading: state.loading, error: state.error });
      return state;
    }, { initialProps: { id: "A" } });
    await waitFor(() => expect(result.current.bookmark?.id).toBe("A"));

    rerender({ id: "B" });
    expect(renders.find((state) => state.id === "B")).toEqual({
      id: "B", bookmark: null, loading: true, error: null,
    });

    await act(async () => { next.resolve({ data: { id: "B", title: "Next bookmark" }, error: null }); });
    expect(result.current.bookmark?.id).toBe("B");
  });

  it("ends detail loading after a rejected refetch and recovers on retry", async () => {
    const { result } = renderHook(() => useBookmark("A"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    queries.single.mockRejectedValueOnce(new Error("Detail connection lost"));
    await act(async () => { await result.current.refetch(); });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeTruthy();

    queries.single.mockResolvedValueOnce({ data: { id: "A", title: "Recovered detail" }, error: null });
    await act(async () => { await result.current.refetch(); });
    expect(result.current.bookmark?.title).toBe("Recovered detail");
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("ends list loading after a rejected refetch and recovers on retry", async () => {
    const { result } = renderHook(useBookmarks);
    await waitFor(() => expect(result.current.loading).toBe(false));

    queries.list.mockRejectedValueOnce(new Error("List connection lost"));
    await act(async () => { await result.current.refetch(); });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeTruthy();

    queries.list.mockResolvedValueOnce({ data: [{ id: "B", title: "Recovered list" }], error: null });
    await act(async () => { await result.current.refetch(); });
    expect(result.current.bookmarks).toEqual([{ id: "B", title: "Recovered list" }]);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("keeps the latest list retry when an earlier request finishes later", async () => {
    const earlier = deferred();
    const latest = deferred();
    queries.list.mockReturnValueOnce(earlier.promise).mockReturnValueOnce(latest.promise);
    const { result } = renderHook(useBookmarks);
    let retry;
    act(() => { retry = result.current.refetch(); });

    await act(async () => {
      latest.resolve({ data: [{ id: "latest" }], error: null });
      await retry;
    });
    expect(result.current.bookmarks).toEqual([{ id: "latest" }]);

    await act(async () => { earlier.resolve({ data: [{ id: "stale" }], error: null }); });
    expect(result.current.bookmarks).toEqual([{ id: "latest" }]);
    expect(result.current.loading).toBe(false);
  });

  it("invalidates the first StrictMode effect's request during cleanup", async () => {
    const discarded = deferred();
    const active = deferred();
    queries.single.mockReturnValueOnce(discarded.promise).mockReturnValueOnce(active.promise);
    const { result } = renderHook(() => useBookmark("A"), {
      reactStrictMode: true,
    });
    expect(queries.single).toHaveBeenCalledTimes(2);

    await act(async () => { active.resolve({ data: { id: "A", title: "Active request" }, error: null }); });
    expect(result.current.bookmark?.title).toBe("Active request");

    await act(async () => { discarded.resolve({ data: { id: "A", title: "Discarded request" }, error: null }); });
    expect(result.current.bookmark?.title).toBe("Active request");
    expect(result.current.loading).toBe(false);
  });
});
