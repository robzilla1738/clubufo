"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";
import { useCommandStore } from "./command-menu";

const NAV: Array<{ href: string; label: string }> = [
  { href: "/library", label: "Library" },
  { href: "/chat", label: "Chat" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const open = useCommandStore((s) => s.setOpen);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4 px-5 sm:px-8 h-14">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    active
                      ? "text-foreground bg-accent/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => open(true)}
            className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border/60 bg-card/40 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            aria-label="Search documents"
          >
            <Search className="size-3.5" />
            <span>Search documents</span>
            <kbd className="ml-4 hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground/70">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </button>
          <Button asChild size="sm" className="h-9 gap-1.5">
            <Link href="/chat">
              <Sparkles className="size-3.5" />
              Ask the corpus
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
