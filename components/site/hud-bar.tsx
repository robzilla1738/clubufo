"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCommandStore } from "./command-menu";
import { cn } from "@/lib/utils";

const NAV: Array<{ href: string; label: string }> = [
  { href: "/chat", label: "CHAT" },
  { href: "/archive", label: "ARCHIVE" },
  { href: "/about", label: "ABOUT" },
];

export function HudBar() {
  const pathname = usePathname();
  const openCmd = useCommandStore((s) => s.setOpen);
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      const ss = String(d.getUTCSeconds()).padStart(2, "0");
      setTime(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b hairline bg-background/85 backdrop-blur-sm">
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-6 px-6 lg:px-10 py-4 text-[10px] uppercase tracking-[0.18em]">
        {/* LEFT — title block */}
        <Link href="/" className="block group">
          <div className="text-muted-foreground leading-[1.6]">
            CLUBUFO //
            <br />
            PUBLIC ARCHIVE FOR
            <br />
            DECLASSIFIED UAP RECORDS
          </div>
        </Link>

        {/* CENTER — nav columns. Two columns to mirror the inspiration. */}
        <nav className="flex items-start gap-10">
          <NavColumn pathname={pathname} items={NAV.slice(0, 2)} />
          <NavColumn
            pathname={pathname}
            items={NAV.slice(2)}
            extras={[
              {
                key: "search",
                label: "⌘K SEARCH",
                onClick: () => openCmd(true),
              },
            ]}
          />
        </nav>

        {/* RIGHT — clock + coordinates + status */}
        <div className="text-right text-muted-foreground leading-[1.6] tabular-nums">
          <div className="text-foreground/80">{time || "––:––:––"} <span className="opacity-50">UTC</span></div>
          <div>38°53′23″N · 77°00′32″W</div>
          <div className="flex justify-end items-center gap-1.5">
            <span className="size-1.5 bg-emerald-400 inline-block animate-pulse" />
            TRANSMISSION STABLE
          </div>
        </div>
      </div>
    </header>
  );
}

function NavColumn({
  pathname,
  items,
  extras,
}: {
  pathname: string | null;
  items: { href: string; label: string }[];
  extras?: { key: string; label: string; onClick: () => void }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/" && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "transition-colors",
              active
                ? "text-cyan"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? <>&gt;{item.label}</> : item.label}
          </Link>
        );
      })}
      {extras?.map((e) => (
        <button
          key={e.key}
          type="button"
          onClick={e.onClick}
          className="text-left text-muted-foreground hover:text-foreground transition-colors"
        >
          {e.label}
        </button>
      ))}
    </div>
  );
}
