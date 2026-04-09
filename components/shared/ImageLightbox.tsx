"use client";

import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type LightboxImage = {
  url: string;
  alt?: string;
};

export default function ImageLightbox({
  images,
  index,
  open,
  onClose,
  onChange,
}: {
  images: LightboxImage[];
  index: number;
  open: boolean;
  onClose: () => void;
  onChange: (nextIndex: number) => void;
}) {
  const total = images.length;
  const safeIndex =
    total > 0 ? Math.min(Math.max(index, 0), total - 1) : 0;
  const active = images[safeIndex];

  useEffect(() => {
    if (!open || !total) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft" && total > 1) {
        onChange((safeIndex - 1 + total) % total);
      } else if (event.key === "ArrowRight" && total > 1) {
        onChange((safeIndex + 1) % total);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onChange, onClose, open, safeIndex, total]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open || !active) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-base-content/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <button
          type="button"
          className="btn btn-circle btn-sm sm:btn-md absolute top-3 right-3 sm:top-5 sm:right-5"
          onClick={onClose}
          aria-label="Close image viewer"
        >
          <X size={18} />
        </button>

        {total > 1 ? (
          <button
            type="button"
            className="btn btn-circle btn-sm sm:btn-md absolute left-3 sm:left-5"
            onClick={(event) => {
              event.stopPropagation();
              onChange((safeIndex - 1 + total) % total);
            }}
            aria-label="Previous image"
          >
            <ChevronLeft size={18} />
          </button>
        ) : null}

        <div
          className="max-h-full max-w-6xl w-full flex flex-col items-center gap-3"
          onClick={(event) => event.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={active.alt ?? "Image"}
            className="max-h-[82vh] w-auto max-w-full rounded-box object-contain shadow-2xl"
          />
          {total > 1 ? (
            <div className="badge badge-neutral badge-lg">
              {safeIndex + 1} / {total}
            </div>
          ) : null}
        </div>

        {total > 1 ? (
          <button
            type="button"
            className="btn btn-circle btn-sm sm:btn-md absolute right-3 sm:right-5"
            onClick={(event) => {
              event.stopPropagation();
              onChange((safeIndex + 1) % total);
            }}
            aria-label="Next image"
          >
            <ChevronRight size={18} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
