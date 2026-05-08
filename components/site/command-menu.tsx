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
import { BookOpen, MessageSquare, Sparkles, FileText, Home } from "lucide-react";

type DocHit = { id: string; title: string; pageCount: number | null };

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
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/documents?q=${encodeURIComponent(query)}&limit=8`,
          { signal: ctrl.signal },
        );
        if (res.ok) {
          const data = await res.json();
          setHits(data.documents ?? []);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 120);
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
      title="Search ClubUFO"
      description="Find a document, jump to a page, or start a chat."
    >
      <CommandInput
        placeholder="Search 161 documents, ask a question…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Scanning the archive…" : "No matches yet."}
        </CommandEmpty>
        {query.trim().length > 1 && (
          <CommandGroup heading="Ask the corpus">
            <CommandItem
              onSelect={() =>
                go(`/chat?q=${encodeURIComponent(query.trim())}`)
              }
            >
              <Sparkles className="size-4" />
              <span>
                Ask: <span className="text-foreground">{query.trim()}</span>
              </span>
            </CommandItem>
          </CommandGroup>
        )}
        {hits.length > 0 && (
          <CommandGroup heading="Documents">
            {hits.map((d) => (
              <CommandItem
                key={d.id}
                value={`${d.title} ${d.id}`}
                onSelect={() => go(`/library/${d.id}`)}
              >
                <FileText className="size-4" />
                <span className="truncate">{d.title}</span>
                {d.pageCount ? (
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {d.pageCount}p
                  </span>
                ) : null}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/")}>
            <Home className="size-4" />
            Home
          </CommandItem>
          <CommandItem onSelect={() => go("/library")}>
            <BookOpen className="size-4" />
            Document library
          </CommandItem>
          <CommandItem onSelect={() => go("/chat")}>
            <MessageSquare className="size-4" />
            Chat with the archive
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
