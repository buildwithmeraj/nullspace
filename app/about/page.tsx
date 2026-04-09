import type { Metadata } from "next";
import AboutPageView from "@/components/pages/about/AboutPage";

export const metadata: Metadata = {
  title: "About",
  description: "Learn what NullSpace is and what it's for.",
};

export default function AboutPage() {
  return <AboutPageView />;
}
