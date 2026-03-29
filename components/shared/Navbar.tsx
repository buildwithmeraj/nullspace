"use client";

import React from "react";
import Logo from "../utilities/Logo";
import ThemeSwitcher from "./ThemeSwitcher";
import Link from "next/link";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import { useAuth } from "@/contexts/AuthContext";
import NavSearch from "@/components/shared/NavSearch";

const Navbar = () => {
  const { user, loading } = useAuth();
  return (
    <div className="navbar bg-base-100 shadow-sm fixed top-0 inset-x-0 z-50">
      <div className="flex-1">
        <Link className="font-bold text-xl flex items-center gap-2" href="/">
          <Logo />
        </Link>
      </div>
      <div className="flex gap-2">
        <NavSearch />
        {!loading && user ? <NotificationsBell /> : null}
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default Navbar;
