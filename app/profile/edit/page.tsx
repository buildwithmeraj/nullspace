import type { Metadata } from "next";
import EditProfileView from "@/components/pages/profile/EditProfilePage";

export const metadata: Metadata = {
  title: "Update Profile",
  description: "Update your username, name, and profile picture.",
};

export default function EditProfilePage() {
  return <EditProfileView />;
}
