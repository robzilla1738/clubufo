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

  const hasSources = sources.length > 0;

  return (
    <aside
      className={cn(
        "shrink-0 border-b hairline bg-card/30 flex-col min-h-0 md:flex md:w-[280px] md:border-b-0 md:border-r xl:w-[320px]",
        hasSources ? "flex max-h-[40dvh] md:max-h-none" : "hidden md:flex",
      )}
    >
      <div className="flex items-center justify-between border-b hairline px-4 py-2.5 ufo-kicker">
        <span>SOURCES</span>
        <span className="text-foreground/60 tabular-nums">
          [{sources.length.toString().padStart(2, "0")}]
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        {!hasSources ? (
          <div className="p-6 ufo-kicker text-muted-foreground/70 leading-relaxed">
            CITED PAGES WILL APPEAR HERE.
            <br />
            <br />
            OPEN ONE TO CHECK THE SOURCE.
          </div>
        ) : (
          <ol className="divide-y divide-border/60 md:block md:divide-y-0 md:space-y-2 md:divide-none md:p-3">
            {sources.map((s, i) => {
              const key = sourceKey(s);
              const active = activeKey === key;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => onOpenSource(s)}
                    className={cn(
                      "group flex w-full items-stretch gap-3 px-3 py-2.5 text-left transition-[background-color,border-color,scale] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 md:flex-col md:gap-0 md:overflow-hidden md:border md:p-0",
                      active
                        ? "bg-cyan/[0.06] md:border-cyan md:bg-cyan/5"
                        : "hover:bg-foreground/[0.03] md:hairline md:hover:border-foreground/30",
                    )}
                  >
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden border hairline bg-background/40 md:h-auto md:w-full md:aspect-[3/4] md:border-0 md:border-b">
                      {s.thumbUrl ? (
                        <Image
                          src={s.thumbUrl}
                          alt={`Page ${s.page}`}
                          fill
                          unoptimized
                          sizes="(min-width: 768px) 320px, 80px"
                          className={cn(
                            "object-cover object-top image-outline transition-opacity",
                            active ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                          )}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-wider text-muted-foreground">
                          [NONE]
                        </div>
                      )}
                      <span
                        className={cn(
                          "absolute top-1 left-1 inline-flex h-[16px] min-w-[16px] items-center justify-center px-0.5 font-mono text-[9px] md:top-1.5 md:left-1.5 md:h-[18px] md:min-w-[18px] md:px-1 md:text-[10px]",
                          active
                            ? "bg-cyan text-background"
                            : "bg-foreground text-background",
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="absolute bottom-1 right-1 font-mono text-[8px] tabular-nums bg-background/80 px-1 md:bottom-1.5 md:right-1.5 md:text-[9px] md:py-0.5">
                        P.{s.page}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 space-y-1 md:p-2.5">
                      <p className="line-clamp-2 text-[10px] uppercase leading-snug tracking-[0.1em] text-foreground/90">
                        {s.documentTitle}
                      </p>
                      <p className="line-clamp-2 text-[10px] leading-snug tracking-normal text-muted-foreground/80">
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
