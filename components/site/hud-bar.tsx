"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCommandStore } from "./command-menu";
import { AlienIcon } from "./alien-icon";
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
      setTime(`${hh}:${mm}`);
    };
    tick();
    const id = setInterval(tick, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b hairline bg-background/85 backdrop-blur-md">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 lg:px-10 h-14 text-[10px] uppercase tracking-[0.2em]">
        {/* LEFT — wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group w-fit"
          aria-label="ChatUFO home"
        >
          <AlienIcon
            size={18}
            className="text-cyan transition-[filter] group-hover:[filter:drop-shadow(0_0_6px_var(--cyan))]"
          />
          <span className="text-foreground tracking-[0.24em]">CHATUFO</span>
          <span className="hidden md:inline text-muted-foreground/60">
            // ARCHIVE.001
          </span>
        </Link>

        {/* CENTER — nav */}
        <nav className="flex items-center gap-6 md:gap-8">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors relative",
                  active
                    ? "text-cyan"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active ? (
                  <>
                    <span aria-hidden className="text-cyan mr-1">
                      &gt;
                    </span>
                    {item.label}
                  </>
                ) : (
                  item.label
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => openCmd(true)}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            aria-label="Search"
          >
            <span className="opacity-70">⌘K</span>
          </button>
        </nav>

        {/* RIGHT — clock + status */}
        <div className="text-right text-muted-foreground tabular-nums flex items-center justify-end gap-4">
          <span className="hidden md:inline">38°53′N · 77°00′W</span>
          <span className="text-foreground/80">{time || "––:––"} UTC</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 bg-emerald-400 inline-block animate-pulse" />
            <span className="hidden md:inline">LIVE</span>
          </span>
        </div>
      </div>
    </header>
  );
}
