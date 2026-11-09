import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "../src/components/ProtectedRoute";

const session = vi.hoisted(() => ({ user: null, loading: false, sessionError: null }));
vi.mock("../src/hooks/useAuth", () => ({ useAuth: () => session }));

function LoginDestination() {
  const location = useLocation();
  return <p data-testid="destination">{location.pathname}{location.search}</p>;
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={["/bookmarks/new?category=dev#form"]}>
      <Routes>
        <Route path="/login" element={<LoginDestination />} />
        <Route path="/bookmarks/new" element={<ProtectedRoute><h1>Private form</h1></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => Object.assign(session, { user: null, loading: false, sessionError: null }));

  it("keeps the private form hidden until session initialization finishes", () => {
    session.loading = true;
    renderRoute();
    expect(screen.getByRole("status")).toHaveTextContent("로그인 상태를 확인하는 중");
    expect(screen.queryByRole("heading", { name: "Private form" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("destination")).not.toBeInTheDocument();
  });

  it("takes anonymous visitors to login and preserves the requested query and hash", async () => {
    renderRoute();
    const destination = await screen.findByTestId("destination");
    const params = new URLSearchParams(destination.textContent.split("?")[1]);
    expect(params.get("redirect")).toBe("/bookmarks/new?category=dev#form");
  });

  it("renders the protected screen for a logged-in user", () => {
    session.user = { id: "user-1" };
    renderRoute();
    expect(screen.getByRole("heading", { name: "Private form" })).toBeInTheDocument();
  });

  it("shows a session error instead of redirecting a failed initialization", () => {
    session.sessionError = "Cannot confirm session";
    renderRoute();
    expect(screen.getByRole("alert")).toHaveTextContent("Cannot confirm session");
    expect(screen.queryByTestId("destination")).not.toBeInTheDocument();
  });
});
