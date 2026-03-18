import React from "react";
import Logo from "../utilities/Logo";

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
          className="input input-bordered w-24 md:w-auto"
        />
        <div className="dropdown dropdown-end">0</div>
      </div>
    </div>
  );
};

export default Navbar;
