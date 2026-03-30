"use client";

import InfoMsg from "@/components/utilities/Info";
import Login from "@/components/auth/Login";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginClient() {
  const params = useSearchParams();
  const error = params.get("error");
  const next = params.get("next");
  const [storedNext] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem("postLoginRedirect");
    } catch {
      return null;
    }
  });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      {error === "use_credentials" ? (
        <InfoMsg
          message={
            <span className="text-sm">
              This email is registered with credentials. Please log in with
              email &amp; password.
            </span>
          }
        />
      ) : null}
      <Login nextPath={next ?? storedNext} />
    </div>
  );
}
