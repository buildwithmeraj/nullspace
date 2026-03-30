"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallbackClient() {
  const router = useRouter();
  const { setAccessToken, silentRefresh, hydrateMe } = useAuth();

  useEffect(() => {
    // Handle backend redirect (`?token=...`) and hydrate user before redirecting.
    let cancelled = false;
    (async () => {
      const token =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("token")
          : null;
      try {
        if (token) {
          // Don't block navigation on API calls (Render cold starts can take a while).
          // Store the access token immediately, redirect, then hydrate user in the background.
          setAccessToken(token);
          sessionStorage.setItem("accessToken", token);

          if (cancelled) return;
          const next = sessionStorage.getItem("postLoginRedirect")?.trim();
          sessionStorage.removeItem("postLoginRedirect");
          router.replace(next || "/profile");

          // Token-based hydration avoids issues when cross-site refresh cookies are blocked
          // (common on Vercel ↔ Render).
          void hydrateMe(token);
          // Best-effort token rotation via refresh cookie; don't block navigation.
          void silentRefresh();
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
    // This runs once on the callback page; we intentionally avoid re-running the
    // effect on auth state updates to prevent navigation races.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <p>Logging you in...</p>;
}
