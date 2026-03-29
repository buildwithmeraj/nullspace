import UpdateProfile from "@/components/auth/UpdateProfile";
import { Suspense } from "react";

export default function EditProfilePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-3 sm:px-4 py-6">
      <Suspense fallback={<p className="opacity-70 text-sm">Loading…</p>}>
        <UpdateProfile />
      </Suspense>
    </div>
  );
}
