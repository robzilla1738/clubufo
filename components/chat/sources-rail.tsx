"use client";

import Image from "next/image";
import { type UIMessage } from "ai";
import { type Source } from "./citation-chip";
import { FileText } from "lucide-react";

export function SourcesRail({
  messages,
  onOpenSource,
}: {
  messages: UIMessage[];
  onOpenSource: (s: Source) => void;
}) {
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const sources =
    ((lastAssistant as { metadata?: { sources?: Source[] } } | undefined)?.metadata
      ?.sources ?? []) as Source[];

  return (
    <aside className="hidden lg:flex flex-col gap-3 w-[340px] xl:w-[380px] shrink-0 border-l border-border/60 pl-6">
      <div className="sticky top-20 space-y-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Sources used
        </p>
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground/70 leading-relaxed">
            Source pages the assistant pulled will appear here, with the
            scanned page image and click-through to the highlighted text.
          </p>
        ) : (
          <ol className="space-y-3">
            {sources.map((s, i) => (
              <li key={`${s.source}-${s.chunkId ?? s.claimId}`}>
                <button
                  type="button"
                  onClick={() => onOpenSource(s)}
                  className="group block w-full text-left rounded-md border border-border/60 bg-card/40 hover:bg-card/70 hover:border-border transition-colors overflow-hidden"
                >
                  {s.thumbUrl ? (
                    <div className="relative w-full aspect-[3/4] bg-black/40 border-b border-border/60 overflow-hidden">
                      <Image
                        src={s.thumbUrl}
                        alt={`Page ${s.page} thumbnail`}
                        fill
                        unoptimized
                        sizes="380px"
                        className="object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <span className="absolute top-2 left-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-sm bg-primary text-primary-foreground text-[10px] font-mono">
                        {i + 1}
                      </span>
                      <span className="absolute bottom-2 right-2 font-mono text-[10px] bg-background/80 backdrop-blur px-1.5 py-0.5 rounded-sm">
                        p.{s.page}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 pt-3">
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-sm bg-primary/15 text-primary text-[10px] font-mono">
                        {i + 1}
                      </span>
                      <FileText className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground">
                        p.{s.page}
                      </span>
                    </div>
                  )}
                  <div className="p-3 space-y-1.5">
                    <p className="text-[12px] leading-snug font-display line-clamp-2">
                      {s.documentTitle}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 line-clamp-3 leading-relaxed">
                      {s.snippet}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}
