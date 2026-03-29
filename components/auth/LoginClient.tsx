"use client";

import InfoMsg from "@/components/utilities/Info";
import Login from "@/components/auth/Login";
import { useSearchParams } from "next/navigation";

export default function LoginClient() {
  const params = useSearchParams();
  const error = params.get("error");

  return (
    <div className="space-y-3">
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
      <Login />
    </div>
  );
}

