"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

// Frontend auth state is a lightweight cache. The backend owns the real session via an httpOnly `refreshToken` cookie; we optionally cache a short-lived access token in `sessionStorage` for convenience.
type AuthResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error?: string };

type AuthUser = Record<string, unknown> & {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  image?: string;
  bio?: string;
  createdAt?: string;
};

type LoginInput = { email: string; password: string };
type RegisterInput = {
  name: string;
  email: string;
  password: string;
  image: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  startGoogleLogin: () => void;
  logout: () => Promise<void>;
  silentRefresh: () => Promise<boolean>;
  hydrateMe: (token?: string | null) => Promise<boolean>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getApiBaseUrl() {
  // Used for server-side calls; in the browser we prefer `/api/*` (Next rewrite) to avoid CORS.
  const base = process.env.NEXT_PUBLIC_API_URL;
  return base?.replace(/\/+$/, "") ?? "";
}

function toProxyUrl(path: string) {
  // Same-origin proxy route. `next.config.ts` rewrites `/api/*` → `${NEXT_PUBLIC_API_URL}/*`.
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/api${normalized}`;
}

async function authRequest(path: string, init?: RequestInit) {
  const base = getApiBaseUrl();
  // Always include cookies so the backend can read/rotate the refreshToken cookie.
  // In production (Vercel ↔ Render), the refresh cookie lives on the backend domain,
  // so we must call the backend directly (not via Next `/api` rewrites).
  const url =
    base && typeof window !== "undefined"
      ? `${base}${path}`
      : typeof window === "undefined"
        ? base
          ? `${base}${path}`
          : toProxyUrl(path)
        : toProxyUrl(path);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const controller = init?.signal ? null : new AbortController();
  try {
    const timeoutMs = 12_000;
    timeoutId =
      controller != null ? setTimeout(() => controller.abort(), timeoutMs) : null;

    return await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      credentials: "include",
      signal: init?.signal ?? controller?.signal,
    });
  } catch {
    return null;
  } finally {
    if (timeoutId != null) clearTimeout(timeoutId);
  }
}

async function safeJson(res: Response) {
  try {
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNestedRecord(
  root: unknown,
  key: string,
): Record<string, unknown> | null {
  if (!isRecord(root)) return null;
  const value = root[key];
  return isRecord(value) ? value : null;
}

function getStringField(root: unknown, key: string): string | undefined {
  if (!isRecord(root)) return undefined;
  const value = root[key];
  return typeof value === "string" ? value : undefined;
}

function pickAuthPayload(json: unknown) {
  // Normalizes various backend response shapes into `{ user, token, error }`.
  const data = getNestedRecord(json, "data");
  const userCandidate =
    (isRecord(json) ? json.user : undefined) ??
    (data ? data.user : undefined) ??
    data;
  const token =
    (isRecord(json) ? (json.accessToken ?? json.token) : undefined) ??
    (data ? (data.accessToken ?? data.token) : undefined);

  const user =
    isRecord(userCandidate) && userCandidate
      ? ({
          ...userCandidate,
          id:
            typeof userCandidate.id === "string"
              ? userCandidate.id
              : userCandidate._id != null
                ? String(userCandidate._id)
                : undefined,
        } as AuthUser)
      : null;

  return {
    user,
    token:
      typeof token === "string" ? token : token != null ? String(token) : null,
    error: getStringField(json, "error") ?? getStringField(json, "message"),
  };
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const startGoogleLogin = () => {
    // Starts backend OAuth flow; backend should redirect back to `/auth/callback`.
    const googlePath =
      process.env.NEXT_PUBLIC_GOOGLE_AUTH_PATH ?? "/users/google";
    const isAbsoluteUrl = /^https?:\/\//i.test(googlePath);
    if (isAbsoluteUrl) {
      window.location.assign(googlePath);
      return;
    }

    const apiBase = getApiBaseUrl();
    // For OAuth redirects, prefer navigating directly to the backend (avoids
    // Next proxy/rewrite edge-cases with 302 Location headers).
    if (apiBase) {
      const normalized = googlePath.startsWith("/") ? googlePath : `/${googlePath}`;
      window.location.assign(`${apiBase}${normalized}`);
      return;
    }

    window.location.assign(toProxyUrl(googlePath));
  };

  const hydrateMe = useCallback(async (tokenOverride?: string | null) => {
    const token =
      tokenOverride ??
      (typeof window !== "undefined"
        ? sessionStorage.getItem("accessToken")
        : null);
    if (!token) return false;

    const res = await authRequest("/users/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res) return false;
    if (!res.ok) {
      // Token is invalid/expired → clear caches so UI doesn't loop.
      if (res.status === 401 || res.status === 403) {
        setUser(null);
        setAccessToken(null);
        try {
          sessionStorage.removeItem("accessToken");
        } catch {
          // ignore
        }
      }
      return false;
    }

    const json = await safeJson(res);
    const { user: nextUser } = pickAuthPayload(json);
    if (nextUser) setUser(nextUser);
    return Boolean(nextUser);
  }, []);

  const silentRefresh = useCallback(async (): Promise<boolean> => {
    // Hydrates the session on page load (and rotates tokens on the backend).
    const res = await authRequest("/auth/refresh-token", { method: "POST" });
    if (!res) return false;
    if (!res.ok) {
      // Refresh cookie is missing/invalid. If we still have a cached access token
      // (OAuth redirect, or third‑party cookies blocked), keep it and let token-based
      // auth continue working.
      const hasCachedToken =
        typeof window !== "undefined" &&
        Boolean(sessionStorage.getItem("accessToken"));
      if (!hasCachedToken) {
        setUser(null);
        setAccessToken(null);
        sessionStorage.removeItem("accessToken");
      }
      // Don't auto-call `/users/logout` here: a transient refresh failure shouldn't wipe cookies.
      return false;
    }
    const json = await safeJson(res);
    const { user: nextUser, token: nextToken } = pickAuthPayload(json);
    if (nextToken) {
      setAccessToken(nextToken);
      sessionStorage.setItem("accessToken", nextToken);
    }
    if (nextUser) setUser(nextUser);
    return Boolean(nextUser);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // Fast path: cache token immediately if we have one (OAuth redirect, previous session).
        const storedToken = sessionStorage.getItem("accessToken");
        if (storedToken) setAccessToken(storedToken);

        // Prefer refresh-cookie session if available (rotates tokens on the backend).
        const refreshed = await silentRefresh();
        if (cancelled) return;

        if (refreshed) {
          setLoading(false);
          return;
        }

        // If we have a cached token but refresh-cookie failed (third‑party cookies blocked),
        // keep `loading` true until `/users/me` hydration succeeds (handled by the effect below).
        const hasToken = Boolean(sessionStorage.getItem("accessToken"));
        if (!hasToken) setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [silentRefresh]);

  useEffect(() => {
    // If we have an access token but no user yet, hydrate `/users/me` with retries.
    // This covers OAuth redirects + backend cold starts (Render) without trapping the user on `/auth/callback`.
    if (!accessToken || user) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const run = async () => {
      if (cancelled) return;
      setLoading(true);

      const ok = await hydrateMe(accessToken);
      if (cancelled) return;
      if (ok) {
        setLoading(false);
        return;
      }

      attempts += 1;
      if (attempts >= 3) {
        setLoading(false);
        return;
      }

      // Simple backoff between attempts.
      const delayMs = 1200 * attempts;
      retryTimer = setTimeout(() => void run(), delayMs);
    };

    void run();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [accessToken, hydrateMe, user]);

  const login = async (input: LoginInput): Promise<AuthResult> => {
    setLoading(true);
    try {
      const res = await authRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (!res) return { ok: false, error: "Failed to reach backend" };
      const json = await safeJson(res);
      const { user: nextUser, token: nextToken, error } = pickAuthPayload(json);
      if (!res.ok) return { ok: false, error: error ?? "Login failed" };

      if (nextToken) setAccessToken(nextToken);
      if (nextUser) setUser(nextUser);
      if (nextToken) sessionStorage.setItem("accessToken", nextToken);
      try {
        // Clear any stored post-login redirect once we have a session.
        sessionStorage.removeItem("postLoginRedirect");
      } catch {
        // ignore
      }
      return { ok: true, data: json ?? undefined };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (input: RegisterInput): Promise<AuthResult> => {
    setLoading(true);
    try {
      const res = await authRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (!res) return { ok: false, error: "Failed to reach backend" };
      const json = await safeJson(res);
      const { user: nextUser, token: nextToken, error } = pickAuthPayload(json);
      if (!res.ok) return { ok: false, error: error ?? "Registration failed" };

      if (nextToken) setAccessToken(nextToken);
      if (nextUser) setUser(nextUser);
      if (nextToken) sessionStorage.setItem("accessToken", nextToken);
      return { ok: true, data: json ?? undefined };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authRequest("/users/logout", { method: "POST" });
    } finally {
      setUser(null);
      setAccessToken(null);
      sessionStorage.removeItem("accessToken");
      setLoading(false);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        register,
        startGoogleLogin,
        logout,
        silentRefresh,
        hydrateMe,
        setUser,
        setAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
