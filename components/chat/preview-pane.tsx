"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { Source } from "./citation-chip";

type PageData = {
  id: string;
  documentId: string;
  documentTitle: string | null;
  page: number;
  imageUrl: string | null;
  cleanedText: string | null;
  pageSummary: string | null;
  documentType: string | null;
  classification: string | null;
  inferredDate: string | null;
  redactions: boolean;
  entities: Array<{ name: string; type: string }> | null;
};

export function PreviewPane({ source }: { source: Source | null }) {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!source) {
      setData(null);
      return;
    }
    setLoading(true);
    setData(null);
    fetch(`/api/pages/${source.pageId}`)
      .then((r) => r.json())
      .then((d) => setData(d.page ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [source]);

  if (!source) {
    return (
      <aside className="hidden lg:flex w-[440px] xl:w-[520px] shrink-0 border-l hairline bg-card/20 flex-col">
        <div className="px-4 py-3 border-b hairline text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          PREVIEW
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="space-y-3 text-center">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
              [NO SELECTION]
            </div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground/60 max-w-[18ch] leading-relaxed">
              CLICK A CITATION OR SOURCE TO VIEW THE PAGE.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex w-[440px] xl:w-[520px] shrink-0 border-l hairline bg-card/20 flex-col min-h-0">
      <div className="px-4 py-3 border-b hairline flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate">
            {source.documentTitle}
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-cyan tabular-nums">
            PAGE {source.page}
            {data?.documentType ? ` · ${data.documentType}` : ""}
            {data?.classification && data.classification !== "UNKNOWN"
              ? ` · ${data.classification}`
              : ""}
          </div>
        </div>
        <Link
          href={`/archive/${source.documentId}`}
          className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-cyan transition-colors shrink-0"
        >
          OPEN&nbsp;[↗]
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        {/* Page image */}
        <div className="relative bg-black border-b hairline">
          {(source.imageUrl ?? data?.imageUrl) ? (
            <div className="p-3">
              <div className="relative">
                <Image
                  src={(source.imageUrl ?? data?.imageUrl)!}
                  alt={`Page ${source.page} of ${source.documentTitle}`}
                  width={900}
                  height={1200}
                  unoptimized
                  className="w-full h-auto border hairline"
                />
                {/* Crop marks */}
                <span className="absolute top-3 left-3 size-2 border-t border-l border-cyan/80" />
                <span className="absolute top-3 right-3 size-2 border-t border-r border-cyan/80" />
                <span className="absolute bottom-3 left-3 size-2 border-b border-l border-cyan/80" />
                <span className="absolute bottom-3 right-3 size-2 border-b border-r border-cyan/80" />
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
              [NO IMAGE]
            </div>
          )}
        </div>

        {/* Cited passage */}
        <section className="px-4 py-4 border-b hairline space-y-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            CITED PASSAGE
          </p>
          <blockquote className="border-l-2 border-cyan pl-3 py-1 text-[12px] leading-[1.7] text-foreground/95">
            &ldquo;{source.snippet}&rdquo;
          </blockquote>
        </section>

        {/* Page summary */}
        {data?.pageSummary ? (
          <section className="px-4 py-4 border-b hairline space-y-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              PAGE SUMMARY
            </p>
            <p className="text-[12px] leading-[1.7] text-foreground/85 normal-case tracking-normal">
              {data.pageSummary}
            </p>
          </section>
        ) : null}

        {/* Entities */}
        {data?.entities && data.entities.length > 0 ? (
          <section className="px-4 py-4 border-b hairline space-y-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              ENTITIES [{data.entities.length}]
            </p>
            <div className="flex flex-wrap gap-1">
              {data.entities.slice(0, 24).map((e, i) => (
                <span
                  key={`${e.name}-${i}`}
                  className="border hairline px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
                >
                  <span className="text-muted-foreground/70 mr-1">{e.type}</span>
                  <span>{e.name}</span>
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {/* Transcript */}
        <section className="px-4 py-4 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            TRANSCRIPT
          </p>
          {loading ? (
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground py-2">
              <Loader2 className="size-3 animate-spin" />
              LOADING…
            </div>
          ) : data?.cleanedText ? (
            <pre className="whitespace-pre-wrap text-[12px] leading-[1.7] text-foreground/85 font-mono normal-case tracking-normal">
              {renderHighlighted(
                data.cleanedText,
                source.charStart,
                source.charEnd,
              )}
            </pre>
          ) : (
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              [TRANSCRIPT UNAVAILABLE]
            </p>
          )}
        </section>

        {data?.redactions ? (
          <p className="px-4 pb-6 text-[10px] uppercase tracking-[0.18em] text-amber-300/70">
            ⚠ REDACTIONS PRESENT ON THIS PAGE
          </p>
        ) : null}
      </div>
    </aside>
  );
}

function renderHighlighted(
  text: string,
  start: number | null,
  end: number | null,
): React.ReactNode {
  if (start === null || end === null || start < 0 || end <= start) return text;
  const safeStart = Math.max(0, Math.min(start, text.length));
  const safeEnd = Math.max(safeStart, Math.min(end, text.length));
  return (
    <>
      {text.slice(0, safeStart)}
      <mark className="bg-cyan/25 text-foreground px-0.5 rounded-none">
        {text.slice(safeStart, safeEnd)}
      </mark>
      {text.slice(safeEnd)}
    </>
  );
}
