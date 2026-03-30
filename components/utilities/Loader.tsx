import React from "react";

export default function Loader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-sm opacity-80">
      <span className="loading loading-spinner loading-sm text-primary" />
      <span>{label}</span>
    </div>
  );
}

