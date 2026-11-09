import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../src/pages/LoginPage";

const session = vi.hoisted(() => ({
  user: null,
  loading: false,
  sessionError: null,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("../src/hooks/useAuth", () => ({ useAuth: () => session }));
vi.mock("../src/lib/supabase", () => ({ isSupabaseConfigured: true, supabase: {} }));

function Destination() {
  const location = useLocation();
  return <p data-testid="destination">{location.pathname}{location.search}{location.hash}</p>;
}

function renderLogin(redirect = "/bookmarks/new?category=dev#form") {
  return render(
    <MemoryRouter initialEntries={[`/login?redirect=${encodeURIComponent(redirect)}`]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillCredentials() {
  fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "reader@example.com" } });
  fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "test-password" } });
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(session, { user: null, loading: false, sessionError: null });
    session.signIn.mockResolvedValue({ data: { session: { user: { id: "user-1" } } }, error: null });
    session.signUp.mockResolvedValue({ data: { session: null }, error: null });
  });

  it("validates empty credentials without making an authentication request", () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "로그인", exact: true }));
    expect(screen.getByText("이메일을 입력하세요.")).toBeInTheDocument();
    expect(session.signIn).not.toHaveBeenCalled();
  });

  it("returns to the originally requested route after successful sign-in", async () => {
    renderLogin();
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "로그인", exact: true }));

    expect(await screen.findByTestId("destination")).toHaveTextContent("/bookmarks/new?category=dev#form");
    expect(session.signIn).toHaveBeenCalledWith(expect.objectContaining({
      email: "reader@example.com", password: "test-password",
    }));
  });

  it("keeps the entered credentials when Supabase rejects the login", async () => {
    session.signIn.mockResolvedValue({ data: null, error: new Error("Invalid login credentials") });
    renderLogin();
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "로그인", exact: true }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid login credentials");
    expect(screen.getByLabelText("이메일")).toHaveValue("reader@example.com");
    expect(screen.getByLabelText("비밀번호")).toHaveValue("test-password");
    expect(screen.queryByTestId("destination")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인", exact: true })).toBeEnabled();
  });

  it("shows email confirmation instructions after signup without a session", async () => {
    renderLogin();
    fireEvent.click(screen.getByRole("tab", { name: "회원가입" }));
    fireEvent.change(screen.getByLabelText("표시 이름"), { target: { value: "북마크 독자" } });
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "가입하기", exact: true }));

    await waitFor(() => expect(session.signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: "reader@example.com", password: "test-password", displayName: "북마크 독자",
    })));
    expect(await screen.findByRole("status")).toHaveTextContent(/이메일/);
    expect(screen.queryByTestId("destination")).not.toBeInTheDocument();
  });

  it("ends the submitting state when the network request throws", async () => {
    session.signIn.mockRejectedValue(new Error("Authentication network error"));
    renderLogin();
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "로그인", exact: true }));

    expect(await screen.findByRole("alert")).toHaveTextContent("인증 서버에 연결하지 못했습니다.");
    expect(screen.getByRole("button", { name: "로그인", exact: true })).toBeEnabled();
  });

  it("ignores an external return URL for an already signed-in visitor", async () => {
    session.user = { id: "user-1" };
    renderLogin("https://untrusted.example/account");
    expect(await screen.findByTestId("destination")).toHaveTextContent("/profile");
  });
});
