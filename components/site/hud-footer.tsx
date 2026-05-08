"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function HudFooter() {
  const [stamp, setStamp] = useState<string>("");

  useEffect(() => {
    const d = new Date();
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    setStamp(`${dd} ${hh} ${mm}`);
  }, []);

  return (
    <footer className="border-t hairline bg-background">
      <div className="px-6 lg:px-10 py-3 grid grid-cols-3 gap-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <div>
          © {new Date().getFullYear()} CLUBUFO //{" "}
          <span className="text-foreground/70">REL.01</span>
        </div>
        <div className="text-center">
          <Link
            href="https://github.com/robzilla1738/clubufo"
            target="_blank"
            rel="noreferrer"
            className="hover:text-cyan transition-colors"
          >
            SOURCE [GITHUB]
          </Link>
        </div>
        <div className="text-right tabular-nums">
          {stamp ? <>[{stamp}]</> : "[—— —— ——]"}
        </div>
      </div>
    </footer>
  );
}
