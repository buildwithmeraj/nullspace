import React from "react";

const LoaderBlock = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-3 text-sm opacity-80">
        <span className="loading loading-spinner loading-md text-primary" />
        <span>Loading…</span>
      </div>
    </div>
  );
};

export default LoaderBlock;
