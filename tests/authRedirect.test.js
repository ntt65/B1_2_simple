import { afterEach, describe, expect, it, vi } from "vitest";
import { getEmailRedirectUrl, getLoginRedirect, getSafeRedirectPath } from "../src/lib/authRedirect";

afterEach(() => vi.unstubAllEnvs());

describe("authentication return URLs", () => {
  it("preserves internal routes including query and hash", () => {
    expect(getSafeRedirectPath("/bookmarks/new?category=dev#form")).toBe("/bookmarks/new?category=dev#form");
    expect(getLoginRedirect({ pathname: "/bookmarks/new", search: "?category=dev", hash: "#form" }))
      .toBe("/login?redirect=%2Fbookmarks%2Fnew%3Fcategory%3Ddev%23form");
  });

  it.each([
    "https://untrusted.example/",
    "//untrusted.example/",
    "/\\untrusted.example/",
    "/%2f%2funtrusted.example/",
    "/%5cuntrusted.example/",
    "/login?redirect=/login",
    "javascript:alert(1)",
  ])("rejects an external, encoded, or looping return path: %s", (path) => {
    expect(getSafeRedirectPath(path)).toBe("/profile");
  });

  it("builds email links on the configured app origin and preserves a safe return path", () => {
    vi.stubEnv("VITE_APP_URL", "https://bookmarks.example/some/deployment/path");
    const emailLink = new URL(getEmailRedirectUrl("/bookmarks/new?category=dev"));
    expect(emailLink.origin).toBe("https://bookmarks.example");
    expect(emailLink.pathname).toBe("/login");
    expect(emailLink.searchParams.get("redirect")).toBe("/bookmarks/new?category=dev");
    expect(emailLink.hash).toBe("");
  });
});
