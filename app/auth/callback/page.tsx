import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authenticating",
  description: "Completing sign-in…",
};

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p>Logging you in...</p>}>
      <AuthCallbackClient />
    </Suspense>
  );
}
