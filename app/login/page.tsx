"use client";

import { Suspense } from "react";
import LoginClient from "@/components/auth/LoginClient";

const Page = () => (
  <Suspense fallback={null}>
    <LoginClient />
  </Suspense>
);

export default Page;
