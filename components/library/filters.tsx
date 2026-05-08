"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useTransition, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "recent", label: "Newest" },
  { value: "title", label: "A → Z" },
  { value: "pages", label: "Longest" },
] as const;

export function LibraryFilters({
  total,
  initialQuery,
  initialSort,
}: {
  total: number;
  initialQuery: string;
  initialSort: string;
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
        router.replace(`/library?${next.toString()}`, { scroll: false });
      });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const setSort = (sort: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("sort", sort);
    router.replace(`/library?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border/60 pb-6">
      <div className="space-y-2 max-w-xl flex-1">
        <p className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
          Library — {total} document{total === 1 ? "" : "s"}
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by title, summary, filename…"
            className="pl-9 h-10 bg-card/40 border-border/60"
          />
        </div>
      </div>
      <div className="flex items-center gap-1 p-1 rounded-md border border-border/60 bg-card/40 self-start md:self-end">
        {SORTS.map((s) => {
          const active = initialSort === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setSort(s.value)}
              className={cn(
                "px-3 h-8 rounded-sm text-xs transition-colors",
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
  );
}
