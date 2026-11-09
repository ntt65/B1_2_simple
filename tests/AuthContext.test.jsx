import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/context/AuthContext";
import { ProtectedRoute } from "../src/components/ProtectedRoute";
import { useAuth } from "../src/hooks/useAuth";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("../src/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: { auth },
}));

function SessionView() {
  const { user, loading, sessionError } = useAuth();
  return (
    <>
      <p data-testid="loading">{loading ? "pending" : "ready"}</p>
      <p data-testid="user">{user?.email ?? "anonymous"}</p>
      {sessionError && <p role="alert">{sessionError}</p>}
    </>
  );
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

function renderProtectedSession() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<ProtectedRoute><h1>Private profile</h1></ProtectedRoute>} />
          <Route path="/login" element={<h1>Login destination</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("AuthProvider session lifecycle", () => {
  let listener;
  let unsubscribe;

  beforeEach(() => {
    vi.clearAllMocks();
    unsubscribe = vi.fn();
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    auth.onAuthStateChange.mockImplementation((callback) => {
      listener = callback;
      return { data: { subscription: { unsubscribe } } };
    });
  });

  it("waits for the saved session before reporting the current user", async () => {
    const request = deferred();
    auth.getSession.mockReturnValue(request.promise);
    render(<AuthProvider><SessionView /></AuthProvider>);
    expect(screen.getByTestId("loading")).toHaveTextContent("pending");

    await act(async () => {
      request.resolve({ data: { session: { user: { email: "saved@example.com" } } }, error: null });
    });

    expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    expect(screen.getByTestId("user")).toHaveTextContent("saved@example.com");
  });

  it("updates all consumers on sign-in/sign-out and unsubscribes on unmount", async () => {
    const view = render(<AuthProvider><SessionView /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));

    act(() => listener("SIGNED_IN", { user: { email: "new@example.com" } }));
    expect(screen.getByTestId("user")).toHaveTextContent("new@example.com");

    act(() => listener("SIGNED_OUT", null));
    expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("does not restore a stale session after a newer sign-out event", async () => {
    const request = deferred();
    auth.getSession.mockReturnValue(request.promise);
    render(<AuthProvider><SessionView /></AuthProvider>);

    act(() => listener("SIGNED_OUT", null));
    await act(async () => {
      request.resolve({ data: { session: { user: { email: "stale@example.com" } } }, error: null });
    });

    expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
    expect(screen.getByTestId("loading")).toHaveTextContent("ready");
  });

  it("ends loading and exposes a failed initial session request", async () => {
    auth.getSession.mockRejectedValue(new Error("Session network error"));
    render(<AuthProvider><SessionView /></AuthProvider>);

    expect(await screen.findByRole("alert")).toHaveTextContent("로그인 상태를 확인하지 못했습니다.");
    expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
  });

  it("waits for getSession and shows its error when INITIAL_SESSION(null) arrives first", async () => {
    const request = deferred();
    auth.getSession.mockReturnValue(request.promise);
    renderProtectedSession();

    act(() => listener("INITIAL_SESSION", null));
    expect(screen.getByRole("status")).toHaveTextContent("로그인 상태를 확인하는 중");
    expect(screen.queryByRole("heading", { name: "Login destination" })).not.toBeInTheDocument();

    await act(async () => { request.reject(new Error("Session restore failed")); });
    expect(await screen.findByRole("alert")).toHaveTextContent("로그인 상태를 확인하지 못했습니다.");
    expect(screen.queryByRole("heading", { name: "Private profile" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Login destination" })).not.toBeInTheDocument();
  });

  it("keeps the protected-route error when INITIAL_SESSION(null) arrives after getSession fails", async () => {
    auth.getSession.mockRejectedValue(new Error("Session restore failed"));
    renderProtectedSession();
    expect(await screen.findByRole("alert")).toHaveTextContent("로그인 상태를 확인하지 못했습니다.");

    act(() => listener("INITIAL_SESSION", null));
    expect(screen.getByRole("alert")).toHaveTextContent("로그인 상태를 확인하지 못했습니다.");
    expect(screen.queryByRole("heading", { name: "Login destination" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Private profile" })).not.toBeInTheDocument();
  });
});
