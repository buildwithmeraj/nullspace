import Register from "@/components/auth/Register";
import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a new NullSpace account.",
};

export default function Page() {
  return <Register />;
}
