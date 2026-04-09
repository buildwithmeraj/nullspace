import React from "react";
import Link from "next/link";
import Logo from "@/components/utilities/Logo";

const Footer = () => {
  return (
    <footer className="border-t border-base-200 bg-base-100">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 py-4 flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between">
        <div className="space-y-2">
          <div className="text-xl font-semibold">
            <Logo />
          </div>
          <p className="text-sm opacity-70 max-w-md">
            A developer-focused social space to share posts, code, and ideas.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Link className="link link-hover" href="/about">
            About
          </Link>
          <Link className="link link-hover" href="/privacy">
            Privacy Policy
          </Link>
          <Link className="link link-hover" href="/terms">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
