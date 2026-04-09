import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Feed | NullSpace",
  description: "Your personalized developer feed on NullSpace.",
};

export default function Page() {
  return <HomeClient />;
}
