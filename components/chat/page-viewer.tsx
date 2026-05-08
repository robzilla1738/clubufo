"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import type { Source } from "./citation-chip";

type PageData = {
  id: string;
  documentId: string;
  documentTitle: string;
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

export function PageViewer({
  source,
  onClose,
}: {
  source: Source | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!source) return;
    setLoading(true);
    setData(null);
    fetch(`/api/pages/${source.pageId}`)
      .then((r) => r.json())
      .then((d) => setData(d.page ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [source]);

  return (
    <Sheet open={!!source} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="!w-full sm:!max-w-3xl lg:!max-w-5xl p-0 flex flex-col"
      >
        <SheetHeader className="border-b border-border/60 px-6 py-4">
          <SheetTitle className="font-display text-lg leading-tight tracking-tight">
            {source?.documentTitle ?? "Source"}
          </SheetTitle>
          <SheetDescription className="font-mono text-[11px] uppercase tracking-widest">
            Page {source?.page}
            {data?.documentType ? ` · ${data.documentType}` : ""}
            {data?.classification && data.classification !== "UNKNOWN"
              ? ` · ${data.classification}`
              : ""}
            {data?.inferredDate ? ` · ${data.inferredDate}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_1fr] overflow-hidden">
          {/* Left: page image */}
          <div className="relative bg-black/40 overflow-auto border-r border-border/60">
            {(source?.imageUrl ?? data?.imageUrl) ? (
              <div className="p-4 flex items-start justify-center min-h-full">
                <Image
                  src={(source?.imageUrl ?? data?.imageUrl)!}
                  alt={`Page ${source?.page} of ${source?.documentTitle}`}
                  width={1200}
                  height={1600}
                  unoptimized
                  className="max-w-full h-auto rounded-md shadow-2xl"
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm p-6 text-center">
                Page image not available.
              </div>
            )}
          </div>

          {/* Right: text + metadata */}
          <div className="overflow-auto">
            <div className="p-6 space-y-6">
              {data?.pageSummary ? (
                <section className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Page summary
                  </p>
                  <p className="text-[14px] leading-relaxed font-serif text-foreground/90">
                    {data.pageSummary}
                  </p>
                </section>
              ) : null}

              {data?.entities && data.entities.length > 0 ? (
                <section className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Entities ({data.entities.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.entities.slice(0, 24).map((e, i) => (
                      <Badge
                        key={`${e.name}-${i}`}
                        variant="secondary"
                        className="font-mono text-[10px]"
                      >
                        <span className="opacity-60 mr-1">{e.type}</span>
                        {e.name}
                      </Badge>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Cited passage
                </p>
                <blockquote className="border-l-2 border-primary/60 pl-4 py-1 text-[14px] leading-relaxed text-foreground/95 italic font-serif">
                  &ldquo;{source?.snippet}&rdquo;
                </blockquote>
              </section>

              <section className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Page transcript
                </p>
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                    <Loader2 className="size-3.5 animate-spin" />
                    Loading transcript…
                  </div>
                ) : data?.cleanedText ? (
                  <pre className="whitespace-pre-wrap text-[13px] leading-7 text-foreground/85 font-sans">
                    {renderHighlighted(
                      data.cleanedText,
                      source?.charStart ?? null,
                      source?.charEnd ?? null,
                    )}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Transcript not available.
                  </p>
                )}
              </section>

              {data?.redactions ? (
                <p className="text-[11px] text-muted-foreground italic">
                  This page contains redacted content.
                </p>
              ) : null}

              <div className="pt-4 border-t border-border/60 flex items-center gap-3 text-sm">
                <Link
                  href={`/library/${source?.documentId}#p-${source?.page}`}
                  className="inline-flex items-center gap-1.5 text-primary hover:brightness-110 transition-all"
                >
                  <FileText className="size-3.5" />
                  Open in library
                </Link>
                {data?.imageUrl ? (
                  <a
                    href={data.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="size-3.5" />
                    Full image
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
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
      <mark className="bg-primary/25 text-foreground rounded-sm px-0.5">
        {text.slice(safeStart, safeEnd)}
      </mark>
      {text.slice(safeEnd)}
    </>
  );
}
