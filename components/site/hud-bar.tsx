"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AlienIcon } from "./alien-icon";
import { cn } from "@/lib/utils";

const NAV: Array<{ href: string; label: string }> = [
  { href: "/chat", label: "CHAT" },
  { href: "/archive", label: "ARCHIVE" },
  { href: "/about", label: "ABOUT" },
];

export function HudBar() {
  const pathname = usePathname();
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
    <header className="sticky top-0 z-40 border-b hairline bg-background/90 backdrop-blur-md">
      <div className="grid h-14 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 text-[9px] uppercase tracking-[0.16em] sm:gap-5 sm:px-6 sm:text-[10px] sm:tracking-[0.2em] lg:px-10">
        {/* LEFT: wordmark */}
        <Link
          href="/"
          className="hit-target flex w-fit items-center gap-2.5 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          aria-label="ChatUFO home"
        >
          <AlienIcon
            size={18}
            className="text-cyan transition-[filter] group-hover:[filter:drop-shadow(0_0_6px_var(--cyan))]"
          />
          <span className="hidden text-foreground tracking-[0.24em] min-[430px]:inline">
            CHATUFO
          </span>
          <span className="hidden md:inline text-muted-foreground/60">
            {"// ARCHIVE.001"}
          </span>
        </Link>

        {/* CENTER: nav */}
        <nav className="flex min-w-0 items-center justify-center gap-1 sm:gap-3 md:gap-8">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "hit-target relative inline-flex items-center justify-center px-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 sm:px-2",
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
        </nav>

        {/* RIGHT: clock and status */}
        <div className="flex items-center justify-end gap-3 text-right text-muted-foreground tabular-nums sm:gap-4">
          <span className="hidden md:inline">38°53′N · 77°00′W</span>
          <span className="hidden text-foreground/80 sm:inline">
            {time || "––:––"} UTC
          </span>
          <span className="flex items-center gap-1.5" aria-label="Live archive status">
            <span className="size-1.5 bg-cyan inline-block animate-pulse" />
            <span className="hidden md:inline">LIVE</span>
          </span>
        </div>
      </div>
    </header>
  );
}
