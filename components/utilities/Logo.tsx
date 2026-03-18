import React from "react";
import Icon from "./Icon";

const Logo = () => {
  return (
    <span className="inline-flex items-center gap-1 text-2xl font-bold leading-none logo">
      <Icon />
      <span className="logo-text">NullSpace</span>
    </span>
  );
};

export default Logo;
