"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";

const ALLOWED_WHEN_MISSING_USERNAME = new Set([
  "/login",
  "/register",
  "/auth/callback",
  "/profile",
  "/profile/edit",
]);

export default function UsernameGate() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { pushLocal } = useNotifications();

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const username = String(user.username ?? "").trim();
    if (username) return;

    if (ALLOWED_WHEN_MISSING_USERNAME.has(pathname)) return;

    // Notify once per session to avoid toast spam.
    const key = "needsUsernameToastShown";
    try {
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        pushLocal("You must complete your profile (set a username) to continue.");
      }
    } catch {
      // ignore
    }

    const next = pathname ? `&next=${encodeURIComponent(pathname)}` : "";
    router.replace(`/profile/edit?reason=complete_profile${next}`);
  }, [loading, pathname, pushLocal, router, user]);

  return null;
}
