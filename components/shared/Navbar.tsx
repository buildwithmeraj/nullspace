"use client";

import React from "react";
import Logo from "../utilities/Logo";
import ThemeSwitcher from "./ThemeSwitcher";
import Link from "next/link";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import { useAuth } from "@/contexts/AuthContext";
import NavSearch from "@/components/shared/NavSearch";
import { Search, X } from "lucide-react";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileSearchOpen(false);
  }, [pathname]);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-base-200 bg-base-100 shadow-sm">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 h-16 flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Link className="font-bold text-xl flex items-center gap-2" href="/">
            <Logo />
          </Link>
        </div>

        <div className="hidden md:flex flex-1 justify-center">
          <div className="w-full max-w-xl">
            <NavSearch
              inputClassName="w-full"
              dropdownClassName="left-0 w-full max-w-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            className="btn btn-ghost btn-circle md:hidden"
            aria-label="Search"
            onClick={() => setMobileSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </button>
          {!loading && user ? <NotificationsBell /> : null}
          <ThemeSwitcher />
        </div>
      </div>

      {mobileSearchOpen ? (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close search"
            onClick={() => setMobileSearchOpen(false)}
          />

          <div className="absolute inset-x-0 top-16 px-3 sm:px-4">
            <div className="mx-auto w-full max-w-6xl rounded-lg border border-base-200 bg-base-100 shadow-xl p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <NavSearch
                    autoFocus
                    inputClassName="w-full"
                    dropdownClassName="left-0 w-full max-w-none"
                    onNavigate={() => setMobileSearchOpen(false)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-circle"
                  aria-label="Close"
                  onClick={() => setMobileSearchOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;
