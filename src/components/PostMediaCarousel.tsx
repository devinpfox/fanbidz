"use client";

import { useRef, useState, useEffect } from "react";

export default function PostMediaCarousel({
  images,
  className = "",
  showDots = true,
}: {
  images: string[];
  className?: string;
  showDots?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  // Snap to a slide
  const goTo = (i: number) => {
    const el = trackRef.current?.children[i] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center" });
  };

  // Update active index when user swipes
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const slides = Array.from(track.children) as HTMLElement[];
      if (!slides.length) return;
      const { scrollLeft, clientWidth } = track;
      // round to nearest slide
      const i = Math.round(scrollLeft / clientWidth);
      if (i !== idx) setIdx(i);
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [idx]);

  if (!images.length) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Slides */}
      <div
        ref={trackRef}
        className="mt-3 flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="shrink-0 w-full snap-center"
            style={{ scrollSnapAlign: "center" }}
          >
            <img
              src={src}
              alt={`Photo ${i + 1}`}
              className="w-full object-cover aspect-square"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Prev/Next (optional) */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => goTo(Math.max(0, idx - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white px-2 py-1 text-sm"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => goTo(Math.min(images.length - 1, idx + 1))}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white px-2 py-1 text-sm"
          >
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && images.length > 1 && (
        <div className="flex justify-center gap-2 py-3">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-8 bg-black/70" : "w-1.5 bg-black/20"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
