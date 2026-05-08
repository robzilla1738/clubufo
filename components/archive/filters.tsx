"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export type FilterFacet = {
  type: "type" | "tag" | "agency";
  values: { value: string; count: number }[];
};

export function ArchiveFilters({
  total,
  facets,
  initialQuery,
  initialSort,
  initialType,
  initialTag,
}: {
  total: number;
  facets: FilterFacet[];
  initialQuery: string;
  initialSort: string;
  initialType?: string;
  initialTag?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(initialQuery);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q) next.set("q", q);
      else next.delete("q");
      startTransition(() => {
        router.replace(`/archive?${next.toString()}`, { scroll: false });
      });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const toggle = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    router.replace(`/archive?${next.toString()}`, { scroll: false });
  };

  const setSort = (sort: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("sort", sort);
    router.replace(`/archive?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="border-b hairline">
      <div className="px-6 lg:px-10 py-5 space-y-4">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-2 flex-1 max-w-md">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              [{total.toString().padStart(3, "0")}] FILES MATCH
            </div>
            <div className="border hairline bg-card/40 focus-within:border-cyan flex items-center">
              <span className="pl-3 text-cyan text-[12px]">&gt;</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="FILTER FILES…"
                className="block w-full bg-transparent border-0 outline-none px-2 py-2 text-[12px] uppercase tracking-[0.08em] placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-1 border hairline">
            {[
              { value: "recent", label: "RECENT" },
              { value: "title", label: "A→Z" },
              { value: "pages", label: "LONGEST" },
            ].map((s) => {
              const active = initialSort === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSort(s.value)}
                  className={cn(
                    "px-3 h-8 text-[10px] uppercase tracking-[0.16em] transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter rows */}
        {facets.map((f) => {
          if (f.values.length === 0) return null;
          const current = f.type === "type" ? initialType : initialTag;
          return (
            <div key={f.type} className="flex items-baseline gap-3">
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground shrink-0 w-16">
                {f.type === "type" ? "TYPE:" : f.type === "tag" ? "TAG:" : "AGENCY:"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {f.values.slice(0, 16).map((v) => {
                  const active = current === v.value;
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => toggle(f.type, v.value)}
                      className={cn(
                        "px-2 h-6 border text-[10px] uppercase tracking-[0.12em] transition-colors flex items-center gap-1.5",
                        active
                          ? "border-cyan text-cyan bg-cyan/5"
                          : "hairline text-muted-foreground hover:text-foreground hover:border-foreground/30",
                      )}
                    >
                      {v.value}
                      <span className="text-muted-foreground/60 tabular-nums">
                        [{v.count}]
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
