import Link from "next/link";
import { AlienIcon } from "@/components/site/alien-icon";

export const metadata = { title: "[404] // SIGNAL LOST" };

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="max-w-lg text-center space-y-6">
        <AlienIcon size={48} className="mx-auto text-cyan opacity-60" />
        <p className="text-[10px] uppercase tracking-[0.24em] text-cyan">
          &gt; SIGNAL LOST
        </p>
        <h1 className="text-3xl md:text-4xl uppercase tracking-[0.04em] leading-[1.15]">
          404 — PAGE NOT IN
          <br />
          THE ARCHIVE
        </h1>
        <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
          THE TRANSMISSION YOU REQUESTED COULD NOT BE LOCATED.
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-cyan text-cyan hover:bg-cyan hover:text-black transition-colors text-[10px] uppercase tracking-[0.22em]"
          >
            &gt; RETURN HOME
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-5 py-2.5 border hairline text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors text-[10px] uppercase tracking-[0.22em]"
          >
            OPEN TERMINAL
          </Link>
        </div>
      </div>
    </div>
  );
}
