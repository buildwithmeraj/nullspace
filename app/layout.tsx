import type { Metadata } from "next";
import { Solitreo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import Providers from "../providers/Providers";

const solitreo = Solitreo({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-solitreo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NullSpace",
    template: "%s | NullSpace",
  },
  description:
    "A developer-focused social space for sharing posts, code, and ideas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${solitreo.variable} antialiased flex flex-col min-h-screen`}
      >
        <Providers>
          <header>
            <Navbar />
          </header>
          <main className="grow pt-16 mx-auto w-full max-w-6xl px-3 sm:px-4 py-6 mt-3">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
