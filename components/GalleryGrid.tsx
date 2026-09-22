"use client";

import { useEffect, useState, useCallback } from "react";
import type { GalleryImage } from "@/lib/content";

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length]
  );
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, close, prev, next]);

  if (images.length === 0) {
    return (
      <p className="border border-line bg-white px-6 py-12 text-center text-sm text-ink/50">
        No photos yet — check back soon.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <button
            key={img.path}
            onClick={() => setOpenIndex(i)}
            className="group relative aspect-square overflow-hidden border border-line bg-paperdim"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL */}
            <img
              src={img.url}
              alt={img.caption || "ST Global Forwarding"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {img.caption && (
              <span className="absolute inset-x-0 bottom-0 bg-ink/70 px-2 py-1.5 text-left text-[11px] text-paper opacity-0 transition-opacity group-hover:opacity-100">
                {img.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center border border-paper/30 text-paper hover:border-paper"
          >
            ✕
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-paper/30 text-paper hover:border-paper sm:left-4"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-paper/30 text-paper hover:border-paper sm:right-4"
              >
                ›
              </button>
            </>
          )}

          <div className="flex max-h-full max-w-4xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[openIndex].url}
              alt={images[openIndex].caption || "ST Global Forwarding"}
              className="max-h-[80vh] max-w-full object-contain"
            />
            {images[openIndex].caption && (
              <p className="mt-3 text-center text-sm text-paper/80">{images[openIndex].caption}</p>
            )}
            <p className="mt-1 font-mono text-[11px] text-paper/40">
              {openIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
