import React from "react";
import Image from "next/image";
const Icon = () => {
  return (
    <div className="flex items-center">
      <Image
        src="/icon.svg"
        alt="Icon"
        width={0}
        height={0}
        className="w-10 h-10 block"
      />
    </div>
  );
};

export default Icon;
