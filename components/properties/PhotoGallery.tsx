"use client";

import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

interface PhotoGalleryProps {
  images: string[];
  title?: string;
}

export function PhotoGallery({ images, title }: PhotoGalleryProps) {
  const [active, setActive] = useState<number | null>(null);

  const open = useCallback((i: number) => setActive(i), []);
  const close = useCallback(() => setActive(null), []);
  const prev = useCallback(() => {
    setActive((a) => (a !== null && a > 0 ? a - 1 : a));
  }, []);
  const next = useCallback(() => {
    setActive((a) => (a !== null && a < images.length - 1 ? a + 1 : a));
  }, [images.length]);

  useEffect(() => {
    if (active === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, close, prev, next]);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="text-center text-zinc-600">
          <ImageIcon className="mx-auto mb-2 h-8 w-8" />
          <p className="text-sm">No images</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => open(i)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-600"
          >
            <img
              src={url}
              alt={title ? `${title} — photo ${i + 1}` : `Photo ${i + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            {i > 3 && images.length > 4 && i === 3 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                +{images.length - 4}
              </div>
            )}
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                disabled={active === 0}
                className="absolute left-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 disabled:opacity-30"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                disabled={active === images.length - 1}
                className="absolute right-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 disabled:opacity-30"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <img
            src={images[active]}
            alt={title ? `${title} — photo ${active + 1}` : `Photo ${active + 1}`}
            className="z-0 max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
            {active + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
