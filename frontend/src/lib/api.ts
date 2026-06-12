import axios, { type AxiosResponse } from "axios";
import type { User } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

export const api = axios.create({ baseURL: BASE_URL });

const ACCESS = "gs_access";
const REFRESH = "gs_refresh";
const USER = "gs_user";

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS);
  },
  get refresh() {
    return localStorage.getItem(REFRESH);
  },
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS, access);
    if (refresh) localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    userStore.clear();
  },
};

// Cache the logged-in user so a page reload restores it instantly, without
// waiting on (or being logged out by) a transient /users/me/ failure.
export const userStore = {
  get(): User | null {
    const raw = localStorage.getItem(USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  set(user: User) {
    localStorage.setItem(USER, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(USER);
  },
};

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try a single refresh, then retry the original request.
let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && tokenStore.refresh) {
      original._retry = true;
      refreshing ??= axios
        .post(`${BASE_URL}/auth/token/refresh/`, { refresh: tokenStore.refresh })
        .then((res) => {
          tokenStore.set(res.data.access, res.data.refresh);
          return res.data.access as string;
        })
        .catch(() => {
          tokenStore.clear();
          return null;
        })
        .finally(() => {
          refreshing = null;
        });

      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch every page of a paginated DRF list endpoint and return all results.
 * Follows the `next` links so admin tables aren't capped at the API page size.
 */
export async function fetchAll<T = unknown>(
  endpoint: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  type Page = { results?: T[]; next?: string | null };
  const out: T[] = [];
  let url: string | undefined = endpoint;
  let first = true;
  while (url) {
    const res: AxiosResponse<Page | T[]> = await api.get(url, first && params ? { params } : {});
    const data = res.data;
    if (Array.isArray(data)) return data;
    out.push(...(data.results ?? []));
    url = data.next ?? undefined;
    first = false;
  }
  return out;
}

export async function login(username: string, password: string) {
  const { data } = await axios.post(`${BASE_URL}/auth/token/`, { username, password });
  tokenStore.set(data.access, data.refresh);
  return data;
}

export async function register(payload: {
  username: string;
  tag?: string;
  email?: string;
  password: string;
  full_name?: string;
}) {
  await axios.post(`${BASE_URL}/auth/register/`, payload);
  return login(payload.username, payload.password);
}
