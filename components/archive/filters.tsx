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
  initialAgency,
}: {
  total: number;
  facets: FilterFacet[];
  initialQuery: string;
  initialSort: string;
  initialType?: string;
  initialTag?: string;
  initialAgency?: string;
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
      <div className="ufo-page-pad space-y-4 pb-4 pt-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
          <div className="flex w-full max-w-xl flex-1 items-center border-b hairline transition-colors focus-within:border-cyan">
            <span className="text-cyan text-[12px] mr-2">&gt;</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="FILTER…"
              className="block min-h-10 w-full border-0 bg-transparent py-2 text-[12px] uppercase tracking-[0.08em] outline-none placeholder:text-muted-foreground/40"
              aria-label="Filter archive"
            />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 tabular-nums shrink-0 ml-3">
              [{total.toString().padStart(3, "0")}]
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 ufo-kicker sm:gap-x-5">
            <span className="text-muted-foreground/60">SORT</span>
            {[
              { value: "recent", label: "RECENT" },
              { value: "title", label: "A→Z" },
              { value: "pages", label: "MOST PAGES" },
            ].map((s) => {
              const active = initialSort === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSort(s.value)}
                  className={cn(
                    "hit-target inline-flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
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
            <div key={f.type} className="grid gap-1.5 text-[10px] sm:grid-cols-[72px_1fr] sm:items-start sm:gap-4">
              <span className="flex shrink-0 items-center ufo-kicker text-muted-foreground/60 sm:min-h-10">
                {f.type === "type" ? "TYPE" : f.type === "tag" ? "TAG" : "AGENCY"}
              </span>
              <div className="flex flex-wrap gap-2">
                {f.values.slice(0, 18).map((v) => {
                  const active =
                    f.type === "agency" ? initialAgency === v.value : current === v.value;
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => toggle(f.type, v.value)}
                      title={v.value}
                      className={cn(
                        "hit-target inline-flex max-w-full items-center gap-1 border px-2 text-left uppercase leading-none tracking-[0.12em] transition-[background-color,border-color,color] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                        active
                          ? "border-cyan bg-cyan/5 text-cyan"
                          : "border-border/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                      )}
                    >
                      {active ? <span>&gt;</span> : null}
                      <span className="max-w-[11rem] truncate sm:max-w-[13rem]">
                        {formatFacetLabel(v.value)}
                      </span>
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

function formatFacetLabel(value: string) {
  return value.replaceAll("_", " ");
}
