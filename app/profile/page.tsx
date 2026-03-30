import Profile from "@/components/auth/Profile";
import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "View your profile and account details.",
};

export default function Page() {
  return <Profile />;
}
