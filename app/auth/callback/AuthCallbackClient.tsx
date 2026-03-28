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
      if (token) {
        setAccessToken(token);
        sessionStorage.setItem("accessToken", token);
      }

      // Prefer the refresh-cookie flow to hydrate user + rotate tokens.
      const ok = await silentRefresh();

      if (cancelled) return;
      // If the backend passed an access token, let the user reach `/profile` even if refresh couldn't hydrate yet.
      router.replace(ok || Boolean(token) ? "/profile" : "/login");
    })();

    return () => {
      cancelled = true;
    };
  }, [params, router, setAccessToken, silentRefresh]);

  return <p>Logging you in...</p>;
}
