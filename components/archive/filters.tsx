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
      <div className="px-6 lg:px-10 pt-5 pb-4 space-y-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 max-w-md border-b hairline focus-within:border-cyan flex items-center transition-colors">
            <span className="text-cyan text-[12px] mr-2">&gt;</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="FILTER…"
              className="block w-full bg-transparent border-0 outline-none py-2 text-[12px] uppercase tracking-[0.08em] placeholder:text-muted-foreground/40"
            />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 tabular-nums shrink-0 ml-3">
              [{total.toString().padStart(3, "0")}]
            </span>
          </div>
          <div className="flex items-center gap-5 text-[10px] uppercase tracking-[0.2em]">
            <span className="text-muted-foreground/60">SORT</span>
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
                    "transition-colors",
                    active
                      ? "text-cyan"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active ? `>${s.label}` : s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Faceted filter rows */}
        {facets.map((f) => {
          if (f.values.length === 0) return null;
          const current =
            f.type === "type"
              ? initialType
              : f.type === "tag"
                ? initialTag
                : undefined;
          return (
            <div key={f.type} className="flex items-baseline gap-4 text-[10px]">
              <span className="uppercase tracking-[0.22em] text-muted-foreground/60 shrink-0 w-14">
                {f.type === "type" ? "TYPE" : f.type === "tag" ? "TAG" : "AGENCY"}
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {f.values.slice(0, 18).map((v) => {
                  const active = current === v.value;
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => toggle(f.type, v.value)}
                      className={cn(
                        "uppercase tracking-[0.14em] transition-colors flex items-center gap-1",
                        active
                          ? "text-cyan"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {active ? <span>&gt;</span> : null}
                      <span>{v.value}</span>
                      <span className="text-muted-foreground/40 tabular-nums">
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
