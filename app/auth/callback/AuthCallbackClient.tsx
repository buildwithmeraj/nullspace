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
      await silentRefresh();

      if (!cancelled) router.replace("/profile");
    })();

    return () => {
      cancelled = true;
    };
  }, [params, router, setAccessToken, silentRefresh]);

  return <p>Logging you in...</p>;
}
