"use client";

import { useCallback, useEffect } from "react";

export type LightboxItem = {
  url: string;
  isVideo: boolean;
  role?: "you" | "me" | null;
  caption?: string;
};

export default function Lightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const item = items[index];
  const many = items.length > 1;

  const go = useCallback(
    (dir: number) => {
      onIndex((index + dir + items.length) % items.length);
    },
    [index, items.length, onIndex]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [go, onClose]);

  if (!item) return null;

  const dot =
    item.role === "you"
      ? "bg-you"
      : item.role === "me"
        ? "bg-me"
        : "bg-muted";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/75 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-xl text-ink shadow-soft transition-transform hover:scale-105"
      >
        ✕
      </button>

      {many && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          aria-label="Previous"
          className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-ink shadow-soft transition-transform hover:scale-105 sm:left-6"
        >
          ‹
        </button>
      )}

      {/* Enlarged polaroid */}
      <figure
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-auto max-w-[92vw] rounded-md bg-white p-3 pb-5 shadow-soft-lg sm:p-4 sm:pb-6"
      >
        <div className="overflow-hidden rounded-sm bg-bg">
          {item.isVideo ? (
            <video
              src={item.url}
              controls
              autoPlay
              playsInline
              className="max-h-[74vh] w-auto max-w-full"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.url}
              alt={item.caption || "Memory"}
              className="max-h-[74vh] w-auto max-w-full object-contain"
            />
          )}
        </div>
        <figcaption className="mt-3 flex items-center justify-between gap-4 px-1">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
            {item.role && (
              <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
            )}
            {item.caption}
          </span>
          {many && (
            <span className="text-xs text-muted">
              {index + 1} / {items.length}
            </span>
          )}
        </figcaption>
      </figure>

      {many && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          aria-label="Next"
          className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-ink shadow-soft transition-transform hover:scale-105 sm:right-6"
        >
          ›
        </button>
      )}
    </div>
  );
}
