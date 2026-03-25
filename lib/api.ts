// lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

function getApiBaseUrl() {
  // Used for server-side requests; in the browser we prefer `/api/*` (Next rewrite) to avoid CORS.
  const base = process.env.NEXT_PUBLIC_API_URL;
  return base?.replace(/\/+$/, "") ?? "";
}

const api = axios.create({
  // Browser → same-origin proxy (`/api/*`). Server → direct backend base URL.
  baseURL: typeof window === "undefined" ? getApiBaseUrl() : "/api",
  withCredentials: true,
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };
type RefreshResponse = { accessToken: string };

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    if (error.response?.status === 401 && config && !config._retry) {
      // One-time token refresh + retry. Backend must read httpOnly refresh cookie.
      config._retry = true;
      const refreshUrl =
        typeof window === "undefined"
          ? `${getApiBaseUrl()}/users/refresh`
          : "/api/users/refresh";
      const { data } = await axios.post<RefreshResponse>(
        refreshUrl,
        {},
        { withCredentials: true },
      );
      config.headers = config.headers ?? {};
      config.headers["Authorization"] = `Bearer ${data.accessToken}`;
      return api(config); // retry original request
    }
    return Promise.reject(error);
  },
);
