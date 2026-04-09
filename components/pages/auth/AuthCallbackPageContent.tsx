import { Suspense } from "react";
import AuthCallbackClient from "@/app/auth/callback/AuthCallbackClient";

export default function AuthCallbackPageContent() {
  return (
    <Suspense fallback={<p>Logging you in...</p>}>
      <AuthCallbackClient />
    </Suspense>
  );
}
