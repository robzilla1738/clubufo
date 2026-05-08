"use client";

import Image from "next/image";
import { type UIMessage } from "ai";
import { type Source } from "./citation-chip";
import { cn } from "@/lib/utils";

export function SourcesRail({
  messages,
  activeKey,
  onOpenSource,
}: {
  messages: UIMessage[];
  activeKey: string | null;
  onOpenSource: (s: Source) => void;
}) {
  // Aggregate sources from ALL assistant messages, latest first.
  const sources: Source[] = [];
  const seen = new Set<string>();
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "assistant") continue;
    const list =
      ((m as { metadata?: { sources?: Source[] } }).metadata?.sources ?? []) as Source[];
    for (const s of list) {
      const key = sourceKey(s);
      if (seen.has(key)) continue;
      seen.add(key);
      sources.push(s);
    }
  }

  return (
    <aside className="w-[280px] xl:w-[320px] shrink-0 border-r hairline bg-card/30 flex flex-col min-h-0">
      <div className="px-4 py-3 border-b hairline flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>SOURCES</span>
        <span className="text-foreground/60 tabular-nums">
          [{sources.length.toString().padStart(2, "0")}]
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        {sources.length === 0 ? (
          <div className="p-6 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70 leading-relaxed">
            CITED PAGES APPEAR HERE.
            <br />
            <br />
            CLICK TO OPEN PREVIEW.
          </div>
        ) : (
          <ol className="p-3 space-y-2">
            {sources.map((s, i) => {
              const key = sourceKey(s);
              const active = activeKey === key;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => onOpenSource(s)}
                    className={cn(
                      "group block w-full text-left border transition-colors overflow-hidden",
                      active
                        ? "border-cyan bg-cyan/5"
                        : "hairline hover:border-foreground/30",
                    )}
                  >
                    <div className="relative w-full aspect-[3/4] bg-black/40 overflow-hidden border-b hairline">
                      {s.thumbUrl ? (
                        <Image
                          src={s.thumbUrl}
                          alt={`Page ${s.page}`}
                          fill
                          unoptimized
                          sizes="320px"
                          className={cn(
                            "object-cover object-top transition-opacity",
                            active ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                          )}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-wider text-muted-foreground">
                          [NO PREVIEW]
                        </div>
                      )}
                      <span
                        className={cn(
                          "absolute top-1.5 left-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-mono",
                          active
                            ? "bg-cyan text-black"
                            : "bg-foreground text-background",
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="absolute bottom-1.5 right-1.5 font-mono text-[9px] tabular-nums bg-background/80 px-1 py-0.5">
                        P.{s.page}
                      </span>
                    </div>
                    <div className="p-2.5 space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.1em] line-clamp-2 leading-snug">
                        {s.documentTitle}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 line-clamp-2 leading-snug normal-case tracking-normal">
                        {s.snippet}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </aside>
  );
}

function sourceKey(s: Source) {
  return `${s.source}:${s.chunkId ?? s.claimId ?? s.pageId}`;
}
