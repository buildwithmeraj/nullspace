"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallbackClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { setAccessToken, silentRefresh } = useAuth();

  useEffect(() => {
    // Handle backend redirect (`?token=...`) and then hydrate session via refresh cookie.
    let cancelled = false;
    (async () => {
      const token = params.get("token");
      try {
        if (token) {
          // If the backend gave us a token, don't block the redirect on a refresh call.
          setAccessToken(token);
          sessionStorage.setItem("accessToken", token);
          if (!cancelled) router.replace("/profile");
        }

        // Prefer the refresh-cookie flow to hydrate user + rotate tokens.
        const ok = await silentRefresh();

        if (cancelled) return;
        // If we didn't already redirect (token-less flow), decide where to land.
        if (!token) router.replace(ok ? "/profile" : "/login");
      } catch {
        if (!cancelled) router.replace(token ? "/profile" : "/login");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, router, setAccessToken, silentRefresh]);

  return <p>Logging you in...</p>;
}
