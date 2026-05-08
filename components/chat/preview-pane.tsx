"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
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

function usePageData(source: Source | null) {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!source) {
      queueMicrotask(() => setData(null));
      return;
    }
    queueMicrotask(() => {
      setLoading(true);
      setData(null);
    });
    fetch(`/api/pages/${source.pageId}`)
      .then((r) => r.json())
      .then((d) => setData(d.page ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [source]);

  return { data, loading };
}

export function PreviewPane({ source }: { source: Source | null }) {
  const { data, loading } = usePageData(source);

  if (!source) {
    return (
      <aside className="hidden lg:flex w-[440px] xl:w-[520px] shrink-0 border-l hairline bg-card/20 flex-col">
        <div className="border-b hairline px-4 py-3 ufo-kicker">
          PREVIEW
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="space-y-3 text-center">
            <div className="ufo-kicker text-muted-foreground/70">
              [NO SELECTION]
            </div>
            <p className="ufo-kicker max-w-[20ch] text-muted-foreground/60 leading-relaxed">
              OPEN A CITATION TO SEE THE PAGE.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex w-[440px] xl:w-[520px] shrink-0 border-l hairline bg-card/20 flex-col min-h-0">
      <PreviewHeader source={source} data={data} />
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <PreviewBody source={source} data={data} loading={loading} />
      </div>
    </aside>
  );
}

export function MobilePreviewSheet({
  source,
  onClose,
}: {
  source: Source | null;
  onClose: () => void;
}) {
  const { data, loading } = usePageData(source);
  const open = !!source;

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !source) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Page ${source.page} preview`}
      className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md lg:hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b hairline px-4 py-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="ufo-kicker truncate">{source.documentTitle}</div>
          <div className="ufo-kicker ufo-kicker-strong tabular-nums">
            PAGE {source.page}
            {data?.documentType ? ` · ${data.documentType}` : ""}
            {data?.classification && data.classification !== "UNKNOWN"
              ? ` · ${data.classification}`
              : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="hit-target shrink-0 -mr-2 -mt-2 inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        >
          <X aria-hidden="true" className="size-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b hairline px-4 py-2">
        <Link
          href={`/archive/${source.documentId}`}
          onClick={onClose}
          className="ufo-action px-2 py-1"
        >
          OPEN FILE&nbsp;[↗]
        </Link>
        <span className="ufo-kicker text-muted-foreground/60">
          [SOURCE]
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        <PreviewBody source={source} data={data} loading={loading} />
      </div>
    </div>
  );
}

function PreviewHeader({
  source,
  data,
}: {
  source: Source;
  data: PageData | null;
}) {
  return (
    <div className="px-4 py-3 border-b hairline flex items-start justify-between gap-3">
      <div className="space-y-1 min-w-0">
        <div className="ufo-kicker truncate">{source.documentTitle}</div>
        <div className="ufo-kicker ufo-kicker-strong tabular-nums">
          PAGE {source.page}
          {data?.documentType ? ` · ${data.documentType}` : ""}
          {data?.classification && data.classification !== "UNKNOWN"
            ? ` · ${data.classification}`
            : ""}
        </div>
      </div>
      <Link
        href={`/archive/${source.documentId}`}
        className="ufo-action shrink-0 px-2 py-1"
      >
        FILE&nbsp;[↗]
      </Link>
    </div>
  );
}

function PreviewBody({
  source,
  data,
  loading,
}: {
  source: Source;
  data: PageData | null;
  loading: boolean;
}) {
  return (
    <>
      {/* Page image */}
      <div className="relative bg-background border-b hairline">
        {(source.imageUrl ?? data?.imageUrl) ? (
          <div className="p-3">
            <div className="relative">
              <Image
                src={(source.imageUrl ?? data?.imageUrl)!}
                alt={`Page ${source.page} of ${source.documentTitle}`}
                width={900}
                height={1200}
                unoptimized
                className="w-full h-auto border hairline image-outline"
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
        <p className="ufo-kicker">CITED TEXT</p>
        <blockquote className="ufo-copy border border-cyan/45 bg-cyan/5 px-3 py-2 text-foreground/95">
          &ldquo;{source.snippet}&rdquo;
        </blockquote>
      </section>

      {/* Page summary */}
      {data?.pageSummary ? (
        <section className="px-4 py-4 border-b hairline space-y-2">
          <p className="ufo-kicker">PAGE SUMMARY</p>
          <p className="ufo-copy text-foreground/85">{data.pageSummary}</p>
        </section>
      ) : null}

      {/* Entities */}
      {data?.entities && data.entities.length > 0 ? (
        <section className="px-4 py-4 border-b hairline space-y-2">
          <p className="ufo-kicker">ENTITIES [{data.entities.length}]</p>
          <div className="flex flex-wrap gap-1">
            {data.entities.slice(0, 24).map((e, i) => (
              <span key={`${e.name}-${i}`} className="ufo-chip min-h-7 py-0.5">
                <span className="text-muted-foreground/70 mr-1">{e.type}</span>
                <span>{e.name}</span>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Transcript */}
      <section className="px-4 py-4 space-y-2">
        <p className="ufo-kicker">TRANSCRIPT</p>
        {loading ? (
          <div className="flex items-center gap-2 py-2 ufo-kicker text-muted-foreground">
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
          <p className="ufo-kicker text-muted-foreground">
            [PAGE TEXT UNAVAILABLE]
          </p>
        )}
      </section>

      {data?.redactions ? (
        <p className="px-4 pb-6 ufo-kicker text-destructive/80">
          [REDACTIONS PRESENT ON THIS PAGE]
        </p>
      ) : null}
    </>
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
