import React from "react";
import Icon from "./Icon";

const Logo = () => {
  return (
    <span className="flex items-center gap-1 text-2xl logo">
      <Icon />
      <span className="logo-text">NullSpace</span>
    </span>
  );
};

export default Logo;
