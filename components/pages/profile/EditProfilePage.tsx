import { Suspense } from "react";
import UpdateProfile from "@/components/auth/UpdateProfile";
import Loader from "@/components/utilities/Loader";

export default function EditProfilePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-3 sm:px-4 py-6">
      <Suspense fallback={<Loader label="Loading..." />}>
        <UpdateProfile />
      </Suspense>
    </div>
  );
}
