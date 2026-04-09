import type { Metadata } from "next";
import AuthCallbackPageContent from "@/components/pages/auth/AuthCallbackPageContent";

export const metadata: Metadata = {
  title: "Authenticating",
  description: "Completing sign-in…",
};

export default function AuthCallbackPage() {
  return <AuthCallbackPageContent />;
}
