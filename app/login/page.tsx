import { Suspense } from "react";
import Login from "@/components/auth/Login";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to your NullSpace account.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
