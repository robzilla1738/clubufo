"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  // Auto-advance.
  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next, total]);

  // Keyboard nav.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (total === 0) return <EmptyShelf />;

  const visible: CarouselSlide[] = [];
  // Build a window of -3 … +3 around the active index.
  for (let off = -3; off <= 3; off++) {
    const i = (index + off + total) % total;
    visible.push(slides[i]);
  }

  return (
    <div className="relative h-[440px] md:h-[520px] flex items-center justify-center">
      <button
        type="button"
        onClick={prev}
        aria-label="Previous"
        className="absolute left-6 lg:left-10 top-1/2 -translate-y-1/2 z-10 size-10 border hairline text-muted-foreground hover:text-cyan hover:border-cyan transition-colors flex items-center justify-center"
      >
        &lt;
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next"
        className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 z-10 size-10 border hairline text-muted-foreground hover:text-cyan hover:border-cyan transition-colors flex items-center justify-center"
      >
        &gt;
      </button>

      <div className="flex items-center gap-3 md:gap-5 px-12 md:px-24 select-none">
        {visible.map((slide, i) => {
          const distance = Math.abs(i - 3);
          const isCenter = i === 3;
          const dim = isCenter ? "h-[360px] md:h-[420px]" : "h-[140px] md:h-[180px]";
          const w = isCenter ? "w-[420px] md:w-[520px]" : "w-[120px] md:w-[160px]";
          const opacity =
            distance === 0
              ? "opacity-100"
              : distance === 1
                ? "opacity-50"
                : distance === 2
                  ? "opacity-30"
                  : "opacity-15";
          return (
            <Link
              key={`${slide.id}-${i}`}
              href={`/archive/${slide.id}`}
              className={`${dim} ${w} ${opacity} relative shrink-0 transition-all duration-700 ease-out border hairline overflow-hidden hover:border-cyan group`}
            >
              {slide.thumbUrl ? (
                <Image
                  src={slide.thumbUrl}
                  alt={slide.title}
                  fill
                  unoptimized
                  className="object-cover object-top"
                  sizes={isCenter ? "520px" : "160px"}
                />
              ) : (
                <div className="absolute inset-0 bg-card/40 flex items-center justify-center text-[10px] uppercase tracking-wider text-muted-foreground">
                  [NO PREVIEW]
                </div>
              )}
              {/* Bracket/crop marks on the center frame */}
              {isCenter ? (
                <>
                  <span className="absolute top-2 left-2 size-2 border-t border-l border-cyan" />
                  <span className="absolute top-2 right-2 size-2 border-t border-r border-cyan" />
                  <span className="absolute bottom-2 left-2 size-2 border-b border-l border-cyan" />
                  <span className="absolute bottom-2 right-2 size-2 border-b border-r border-cyan" />
                  <div className="absolute bottom-3 left-3 right-3 text-[10px] uppercase tracking-wider text-foreground/95 backdrop-blur-sm bg-black/40 px-2 py-1.5 flex items-center justify-between gap-3">
                    <span className="truncate">{slide.title}</span>
                    <span className="text-cyan tabular-nums shrink-0">
                      {String(index + 1).padStart(3, "0")} / {String(total).padStart(3, "0")}
                    </span>
                  </div>
                </>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Tick progress bar */}
      <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-1">
        {slides.map((_, i) => {
          const active = i === index;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-px transition-all ${
                active ? "w-6 bg-cyan" : "w-3 bg-muted-foreground/30 hover:bg-muted-foreground/60"
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
    <div className="h-[440px] md:h-[520px] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          [NO TRANSMISSIONS]
        </div>
        <div className="text-foreground/70 text-sm">
          Archive is empty. Run <code className="text-cyan">pnpm ingest</code> to populate.
        </div>
      </div>
    </div>
  );
}

// Animation wrapper kept for potential index transitions; currently unused.
export function _Anim({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
