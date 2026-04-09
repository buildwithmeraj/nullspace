import type { Metadata } from "next";
import TermsPageView from "@/components/pages/terms/TermsPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Basic terms for using NullSpace.",
};

export default function TermsPage() {
  return <TermsPageView />;
}
