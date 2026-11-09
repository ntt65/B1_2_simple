import { describe, expect, it } from "vitest";
import { getSafeBookmarkUrl } from "../src/lib/bookmarkUrl";

describe("bookmark links", () => {
  it.each([
    ["https://example.com", "https://example.com/"],
    [" http://localhost:5173/notes ", "http://localhost:5173/notes"],
    ["HTTPS://example.com/path?q=react#intro", "https://example.com/path?q=react#intro"],
  ])("accepts an absolute web URL: %s", (value, expected) => {
    expect(getSafeBookmarkUrl(value)).toBe(expected);
  });

  it.each([
    "javascript:alert(1)", "data:text/html,<script>alert(1)</script>",
    "//example.com", "https:example.com", "/bookmarks", "https://", "", null,
  ])("does not open an unsafe or invalid saved URL: %s", (value) => {
    expect(getSafeBookmarkUrl(value)).toBeNull();
  });
});
