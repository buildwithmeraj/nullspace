// lib/api.ts
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

function getApiBaseUrl() {
  // Used for server-side requests; in the browser we prefer `/api/*` (Next rewrite) to avoid CORS.
  const base = process.env.NEXT_PUBLIC_API_URL;
  return base?.replace(/\/+$/, "") ?? "";
}

function getClientAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem("accessToken");
  } catch {
    return null;
  }
}

function setClientAccessToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem("accessToken", token);
  } catch {
    // ignore
  }
}

function clearClientAccessToken() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("accessToken");
  } catch {
    // ignore
  }
}

export const api = axios.create({
  // Prefer direct backend base URL (supports cross-site cookies on Vercel/Render).
  // Fallback to same-origin proxy only when the env var is missing.
  baseURL: getApiBaseUrl() || "/api",
  withCredentials: true,
  // Prevent UI hangs when the backend is unreachable.
  timeout: 12_000,
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };
type RefreshResponse = { accessToken: string };

api.interceptors.request.use((config) => {
  // Attach cached access token automatically in the browser (if caller didn't set it).
  if (typeof window === "undefined") return config;
  const token = getClientAccessToken();
  if (!token) return config;
  config.headers = config.headers ?? {};
  if (
    !("Authorization" in config.headers) &&
    !("authorization" in config.headers)
  ) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    if (error.response?.status === 401 && config && !config._retry) {
      // One-time token refresh + retry. Backend must read httpOnly refresh cookie.
      config._retry = true;
      const refreshUrl =
        `${getApiBaseUrl() || "/api"}/auth/refresh-token`;
      try {
        const { data } = await axios.post<RefreshResponse>(
          refreshUrl,
          {},
          { withCredentials: true, timeout: 12_000 },
        );
        if (!data?.accessToken) {
          clearClientAccessToken();
          return Promise.reject(error);
        }
        config.headers = config.headers ?? {};
        config.headers["Authorization"] = `Bearer ${data.accessToken}`;
        setClientAccessToken(data.accessToken);
        return api(config); // retry original request
      } catch {
        // Refresh cookie is missing/expired → clear cached token to avoid retry loops.
        clearClientAccessToken();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

type ProtectedRequestOptions = {
  /**
   * Provide an explicit access token (useful in server-side code). In the browser
   * this defaults to the cached `sessionStorage` token, and will try a refresh
   * request when missing.
   */
  accessToken?: string | null;
  /**
   * When true and running in the browser, stores refreshed tokens into
   * `sessionStorage` under `accessToken`. Defaults to true.
   */
  cacheToken?: boolean;
};

async function tryRefreshAccessToken(): Promise<string | null> {
  const refreshUrl = `${getApiBaseUrl() || "/api"}/auth/refresh-token`;
  try {
    const { data } = await axios.post<RefreshResponse>(
      refreshUrl,
      {},
      { withCredentials: true, timeout: 12_000 },
    );
    return typeof data?.accessToken === "string" ? data.accessToken : null;
  } catch {
    clearClientAccessToken();
    return null;
  }
}

// Makes an authenticated request using the shared `api` axios instance.

export async function protectedApiRequest<T = unknown>(
  config: AxiosRequestConfig,
  options: ProtectedRequestOptions = {},
): Promise<T> {
  const cacheToken = options.cacheToken ?? true;
  let token = options.accessToken ?? getClientAccessToken();

  if (!token && typeof window !== "undefined") {
    token = await tryRefreshAccessToken();
    if (token && cacheToken) setClientAccessToken(token);
  }

  const headers =
    token != null
      ? {
          ...(config.headers ?? {}),
          Authorization: `Bearer ${token}`,
        }
      : config.headers;

  const res = await api.request<T>({ ...config, headers });
  return res.data;
}

export default api;
