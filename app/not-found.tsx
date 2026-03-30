import type { Metadata } from "next";
import NotFoundState from "@/components/shared/NotFoundState";

export const metadata: Metadata = {
  title: "404",
  description: "The requested page could not be found.",
};

export default function NotFound() {
  return <NotFoundState />;
}

