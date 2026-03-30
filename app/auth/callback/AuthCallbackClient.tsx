"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallbackClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { setAccessToken, silentRefresh, hydrateMe } = useAuth();

  useEffect(() => {
    // Handle backend redirect (`?token=...`) and hydrate user before redirecting.
    let cancelled = false;
    (async () => {
      const token = params.get("token");
      try {
        if (token) {
          // Token-based hydration avoids issues when cross-site refresh cookies are blocked
          // (common on Vercel ↔ Render).
          setAccessToken(token);
          sessionStorage.setItem("accessToken", token);
          const ok = await hydrateMe(token);
          // Best-effort token rotation via refresh cookie; don't block navigation.
          void silentRefresh();

          if (cancelled) return;
          const next =
            sessionStorage.getItem("postLoginRedirect")?.trim() || "/profile";
          if (ok) {
            sessionStorage.removeItem("postLoginRedirect");
            router.replace(next);
          } else {
            router.replace("/login");
          }
          return;
        }

        const ok = await silentRefresh();

        if (cancelled) return;
        const next =
          sessionStorage.getItem("postLoginRedirect")?.trim() || "/profile";
        if (ok) sessionStorage.removeItem("postLoginRedirect");
        router.replace(ok ? next : "/login");
      } catch {
        if (!cancelled) router.replace("/login");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrateMe, params, router, setAccessToken, silentRefresh]);

  return <p>Logging you in...</p>;
}
