import React from "react";
import Logo from "../utilities/Logo";
import ThemeSwitcher from "./ThemeSwitcher";

const Navbar = () => {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-1">
        <a className="font-bold text-xl flex items-center gap-2">
          <Logo />
        </a>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search"
          className="input input-bordered"
        />
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default Navbar;
