"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Frontend auth state is a lightweight cache. The backend owns the real session via an httpOnly `refreshToken` cookie; we optionally cache a short-lived access token in `sessionStorage` for convenience.
type AuthResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error?: string };

type AuthUser = Record<string, unknown> & {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  image?: string;
  avatar?: string;
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
    window.location.assign(isAbsoluteUrl ? googlePath : toProxyUrl(googlePath));
  };

  const authRequest = async (path: string, init?: RequestInit) => {
    const base = getApiBaseUrl();
    // Always include cookies so the backend can read/rotate the refreshToken session cookie.
    const url =
      typeof window === "undefined"
        ? base
          ? `${base}${path}`
          : toProxyUrl(path)
        : toProxyUrl(path);
    try {
      return await fetch(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
        credentials: "include",
      });
    } catch {
      return null;
    }
  };

  const silentRefresh = async (): Promise<boolean> => {
    // Hydrates the session on page load (and rotates tokens on the backend).
    const res = await authRequest("/users/refresh", { method: "POST" });
    if (!res) return false;
    if (!res.ok) {
      // Refresh cookie is missing/invalid → treat as logged out and clear caches.
      setUser(null);
      setAccessToken(null);
      sessionStorage.removeItem("accessToken");
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
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fast path: show "logged in" UI immediately if we have a cached token.
        const storedToken = sessionStorage.getItem("accessToken");
        if (storedToken) setAccessToken(storedToken);
        await silentRefresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (input: LoginInput): Promise<AuthResult> => {
    setLoading(true);
    try {
      const res = await authRequest("/users/login", {
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
      const res = await authRequest("/users/register", {
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
        setUser,
        setAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
