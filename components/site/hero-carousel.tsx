"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type CarouselSlide = {
  id: string;
  title: string;
  page: number;
  thumbUrl: string | null;
  imageUrl: string | null;
};

export function HeroCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [index, setIndex] = useState(0);
  const total = slides.length;

  const next = useCallback(() => {
    setIndex((i) => (total > 0 ? (i + 1) % total : 0));
  }, [total]);
  const prev = useCallback(() => {
    setIndex((i) => (total > 0 ? (i - 1 + total) % total : 0));
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(next, 5500);
    return () => clearInterval(id);
  }, [next, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (total === 0) return <EmptyShelf />;

  // Symmetric window of -3..+3 around the active index.
  const visible: CarouselSlide[] = [];
  for (let off = -3; off <= 3; off++) {
    const i = (index + off + total) % total;
    visible.push(slides[i]);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={prev}
        aria-label="Previous"
        className="absolute left-6 lg:left-10 top-1/2 -translate-y-1/2 z-10 size-9 border hairline text-muted-foreground/70 hover:text-cyan hover:border-cyan transition-colors flex items-center justify-center"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next"
        className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 z-10 size-9 border hairline text-muted-foreground/70 hover:text-cyan hover:border-cyan transition-colors flex items-center justify-center"
      >
        ›
      </button>

      <div className="flex items-center justify-center gap-3 md:gap-4 px-12 md:px-24 select-none">
        {visible.map((slide, i) => {
          const distance = Math.abs(i - 3);
          const isCenter = i === 3;

          // Tiered sizing — quieter falloff on outer thumbs.
          const size = isCenter
            ? "h-[380px] md:h-[440px] w-[300px] md:w-[340px]"
            : distance === 1
              ? "h-[200px] md:h-[230px] w-[150px] md:w-[170px]"
              : distance === 2
                ? "h-[140px] md:h-[160px] w-[105px] md:w-[120px]"
                : "h-[100px] md:h-[110px] w-[75px] md:w-[80px]";
          const opacity =
            distance === 0
              ? "opacity-100"
              : distance === 1
                ? "opacity-50"
                : distance === 2
                  ? "opacity-25"
                  : "opacity-10";

          return (
            <Link
              key={`${slide.id}-${i}`}
              href={`/archive/${slide.id}`}
              className={`${size} ${opacity} relative shrink-0 transition-all duration-700 ease-out border hairline overflow-hidden ${
                isCenter ? "hover:border-cyan" : ""
              }`}
              tabIndex={isCenter ? 0 : -1}
            >
              {slide.thumbUrl ? (
                <Image
                  src={slide.thumbUrl}
                  alt={slide.title}
                  fill
                  unoptimized
                  className="object-cover object-top"
                  sizes={isCenter ? "340px" : "170px"}
                  priority={isCenter}
                />
              ) : (
                <div className="absolute inset-0 bg-card/40 flex items-center justify-center text-[10px] uppercase tracking-wider text-muted-foreground">
                  [—]
                </div>
              )}
              {isCenter ? (
                <>
                  <span className="absolute top-2 left-2 size-2 border-t border-l border-cyan" />
                  <span className="absolute top-2 right-2 size-2 border-t border-r border-cyan" />
                  <span className="absolute bottom-2 left-2 size-2 border-b border-l border-cyan" />
                  <span className="absolute bottom-2 right-2 size-2 border-b border-r border-cyan" />
                </>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Active title + counter, sitting just below the strip */}
      <div className="mt-7 px-6 lg:px-10 grid grid-cols-3 items-center text-[10px] uppercase tracking-[0.2em]">
        <div className="text-muted-foreground tabular-nums">
          {String(index + 1).padStart(3, "0")} / {String(total).padStart(3, "0")}
        </div>
        <div className="text-center text-foreground/85 truncate">
          {slides[index]?.title}
        </div>
        <div className="text-right text-muted-foreground">
          [.PDF · P.{slides[index]?.page ?? 1}]
        </div>
      </div>

      {/* Tick progress — 1px lines, monotone except active */}
      <div className="mt-3 px-6 lg:px-10 flex justify-center gap-[3px]">
        {slides.map((_, i) => {
          const active = i === index;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-px transition-all ${
                active ? "w-8 bg-cyan" : "w-3 bg-muted-foreground/25 hover:bg-muted-foreground/60"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function EmptyShelf() {
  return (
    <div className="h-[380px] flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          [NO TRANSMISSIONS]
        </div>
        <div className="text-muted-foreground/70 text-[11px] uppercase tracking-[0.12em]">
          ARCHIVE EMPTY · RUN INGEST TO POPULATE
        </div>
      </div>
    </div>
  );
}
