import type { Metadata } from "next";
import PrivacyPageView from "@/components/pages/privacy/PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How NullSpace handles your data.",
};

export default function PrivacyPage() {
  return <PrivacyPageView />;
}
