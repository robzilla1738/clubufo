"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type DocHit = {
  id: string;
  title: string;
  kicker: string | null;
  pageCount: number | null;
};

type Store = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

let listeners: Array<(s: Store) => void> = [];
let state: Store = {
  open: false,
  setOpen: (v: boolean) => {
    state = { ...state, open: v };
    listeners.forEach((l) => l(state));
  },
};

export function useCommandStore<T>(selector: (s: Store) => T): T {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);
  return selector(state);
}

export function CommandMenu() {
  const router = useRouter();
  const open = useCommandStore((s) => s.open);
  const setOpen = useCommandStore((s) => s.setOpen);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<DocHit[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/documents?q=${encodeURIComponent(query)}&limit=10`,
          { signal: ctrl.signal },
        );
        if (res.ok) {
          const data = await res.json();
          setHits(data.documents ?? []);
        }
      } catch {
        /* ignore */
      }
    }, 100);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query, open]);

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="SEARCH ARCHIVE"
      description="Find a document, jump to a page, or query the corpus."
      className="font-mono"
    >
      <CommandInput
        placeholder="QUERY ARCHIVE…"
        value={query}
        onValueChange={setQuery}
        className="font-mono uppercase tracking-wider text-xs"
      />
      <CommandList>
        <CommandEmpty className="text-[11px] uppercase tracking-wider text-muted-foreground p-6 text-center">
          NO MATCHES
        </CommandEmpty>
        {query.trim().length > 1 && (
          <CommandGroup heading="QUERY THE CORPUS">
            <CommandItem
              onSelect={() => go(`/chat?q=${encodeURIComponent(query.trim())}`)}
              className="font-mono"
            >
              <span className="text-cyan">&gt;</span>
              <span className="uppercase tracking-wider text-[11px]">
                ASK: {query.trim()}
              </span>
            </CommandItem>
          </CommandGroup>
        )}
        {hits.length > 0 && (
          <CommandGroup heading="DOCUMENTS">
            {hits.map((d) => (
              <CommandItem
                key={d.id}
                value={`${d.title} ${d.kicker} ${d.id}`}
                onSelect={() => go(`/archive/${d.id}`)}
                className="font-mono items-start py-2"
              >
                <span className="text-muted-foreground">[FILE]</span>
                <div className="flex flex-col gap-0.5 truncate">
                  <span className="text-[11px] uppercase tracking-wider truncate">
                    {d.kicker ?? d.title}
                  </span>
                </div>
                {d.pageCount ? (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {d.pageCount}p
                  </span>
                ) : null}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandSeparator />
        <CommandGroup heading="NAVIGATE">
          <CommandItem
            onSelect={() => go("/")}
            className="font-mono uppercase tracking-wider text-[11px]"
          >
            <span className="text-cyan">&gt;</span> HOME
          </CommandItem>
          <CommandItem
            onSelect={() => go("/archive")}
            className="font-mono uppercase tracking-wider text-[11px]"
          >
            <span className="text-cyan">&gt;</span> ARCHIVE
          </CommandItem>
          <CommandItem
            onSelect={() => go("/chat")}
            className="font-mono uppercase tracking-wider text-[11px]"
          >
            <span className="text-cyan">&gt;</span> CHAT
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
