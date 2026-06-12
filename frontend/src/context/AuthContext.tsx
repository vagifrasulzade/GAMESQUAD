import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, login as apiLogin, register as apiRegister, tokenStore, userStore } from "../lib/api";
import type { User } from "../lib/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (p: { username: string; tag?: string; email?: string; password: string; full_name?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Hydrate from the cached user so a reload restores the session instantly,
  // instead of waiting on (or being logged out by) a slow /users/me/ call.
  const [user, setUser] = useState<User | null>(() =>
    tokenStore.access ? userStore.get() : null
  );
  const [loading, setLoading] = useState(() => !!tokenStore.access && !userStore.get());

  function applyUser(next: User | null) {
    setUser(next);
    if (next) userStore.set(next);
    else userStore.clear();
  }

  async function refreshUser() {
    if (!tokenStore.access) {
      applyUser(null);
      return;
    }
    try {
      const { data } = await api.get<User>("/users/me/");
      applyUser(data);
    } catch (err) {
      // Only sign out on a genuine auth failure. A 401 here means the refresh
      // interceptor already tried and failed, so the tokens are gone. Any other
      // error (network blip, backend slow/down, 5xx) is transient — keep the
      // cached session so a reload doesn't kick the user out.
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 401 || !tokenStore.access) {
        applyUser(null);
      }
    }
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string) {
    await apiLogin(username, password);
    await refreshUser();
  }

  async function register(p: { username: string; tag?: string; email?: string; password: string; full_name?: string }) {
    await apiRegister(p);
    await refreshUser();
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
