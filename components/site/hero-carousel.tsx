"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export type HeroFile = {
  id: string;
  title: string;
  agency: string | null;
  documentType: string | null;
  pageCount: number | null;
  coverImageUrl: string | null;
};

const PAGE_SIZE = 5;
const CYCLE_MS = 6500;

export function HeroFileShelf({ files }: { files: HeroFile[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(files.length / PAGE_SIZE));
  const activePage = page % pageCount;

  useEffect(() => {
    if (pageCount <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setPage((current) => (current + 1) % pageCount);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [pageCount]);

  const visibleFiles = useMemo(() => {
    const start = activePage * PAGE_SIZE;
    const slice = files.slice(start, start + PAGE_SIZE);
    if (slice.length === PAGE_SIZE || files.length <= PAGE_SIZE) return slice;
    return [...slice, ...files.slice(0, PAGE_SIZE - slice.length)];
  }, [activePage, files]);

  if (files.length === 0) return <EmptyShelf />;

  return (
    <div className="ufo-page-pad">
      <div className="mx-auto max-w-6xl border-y hairline">
        <div className="grid gap-px bg-border/70 md:grid-cols-5">
          {visibleFiles.map((file, index) => {
            const absoluteIndex = (activePage * PAGE_SIZE + index) % files.length;
            return (
              <Link
                key={`${activePage}-${file.id}`}
                href={`/archive/${file.id}`}
                className="group flex min-h-[340px] flex-col bg-background p-3 text-left transition-[background-color,scale] hover:bg-cyan/[0.035] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              >
                <div className="relative aspect-[3/4] overflow-hidden border hairline bg-card/30">
                  {file.coverImageUrl ? (
                    <Image
                      src={file.coverImageUrl}
                      alt={`Cover page for ${file.title}`}
                      fill
                      unoptimized
                      sizes="(min-width: 768px) 20vw, 100vw"
                      className="object-contain object-center image-outline transition-opacity group-hover:opacity-95"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      [NO COVER]
                    </div>
                  )}
                  <span className="absolute top-2 left-2 size-2 border-l border-t border-cyan/80" />
                  <span className="absolute top-2 right-2 size-2 border-r border-t border-cyan/80" />
                  <span className="absolute bottom-2 left-2 size-2 border-b border-l border-cyan/80" />
                  <span className="absolute bottom-2 right-2 size-2 border-b border-r border-cyan/80" />
                  <span className="absolute left-2 top-2 translate-y-3 bg-background/85 px-1.5 py-0.5 font-mono text-[10px] text-cyan tabular-nums">
                    {String(absoluteIndex + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute bottom-2 right-2 bg-background/85 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    .PDF
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between gap-4 pt-3">
                  <div className="space-y-2">
                    <p className="ufo-kicker text-muted-foreground">
                      SELECTED FILE
                    </p>
                    <h2 className="line-clamp-4 text-[12px] uppercase leading-[1.55] tracking-[0.12em] text-foreground/90 transition-colors group-hover:text-cyan">
                      {file.title}
                    </h2>
                  </div>

                  <div className="space-y-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <div className="grid grid-cols-[64px_1fr] gap-2">
                      <span className="text-muted-foreground/45">TYPE</span>
                      <span className="truncate text-foreground/70" data-bracket>
                        {formatFacetLabel(file.documentType ?? "N/A")}
                      </span>
                    </div>
                    <div className="grid grid-cols-[64px_1fr] gap-2">
                      <span className="text-muted-foreground/45">AGENCY</span>
                      <span className="truncate text-foreground/70" data-bracket>
                        {file.agency ?? "N/A"}
                      </span>
                    </div>
                    <div className="grid grid-cols-[64px_1fr] gap-2">
                      <span className="text-muted-foreground/45">PAGES</span>
                      <span className="tabular-nums text-foreground/70" data-bracket>
                        {file.pageCount ?? "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="flex min-h-9 flex-wrap items-center justify-between gap-2 border-t hairline px-3 py-2 ufo-kicker">
          <span className="text-muted-foreground tabular-nums">
            SELECTED PDFS WITH COVER PAGES
            <span className="mx-2 opacity-40">/</span>
            SET {String(activePage + 1).padStart(2, "0")} OF{" "}
            {String(pageCount).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-4">
            {pageCount > 1 ? (
              <div className="flex items-center gap-1" aria-label="Hero PDF preview sets">
                {Array.from({ length: pageCount }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPage(i)}
                    className="group hit-target flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                    aria-label={`Show selected PDF set ${i + 1}`}
                  >
                    <span
                      className={
                        i === activePage
                          ? "h-px w-7 bg-cyan"
                          : "h-px w-3 bg-muted-foreground/30 transition-colors group-hover:bg-muted-foreground/70"
                      }
                    />
                  </button>
                ))}
              </div>
            ) : null}
            <Link
              href="/archive"
              className="hit-target inline-flex items-center text-cyan transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            >
              OPEN FULL INDEX &gt;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatFacetLabel(value: string) {
  return value.replaceAll("_", " ");
}

function EmptyShelf() {
  return (
    <div className="ufo-page-pad">
      <div className="flex min-h-[220px] items-center justify-center border-y hairline">
        <div className="text-center space-y-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            [NO SELECTED FILES]
          </div>
          <div className="text-muted-foreground/70 text-[11px] uppercase tracking-[0.12em]">
            ARCHIVE EMPTY · ADD FILES TO CONTINUE
          </div>
        </div>
      </div>
    </div>
  );
}
