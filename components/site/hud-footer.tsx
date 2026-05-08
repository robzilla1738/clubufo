import Link from "next/link";

export function HudFooter() {
  return (
    <footer className="border-t hairline bg-background">
      <div className="min-h-10 px-4 py-2 sm:px-6 lg:px-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.2em] text-muted-foreground">
        <div>
          © {new Date().getFullYear()} CHATUFO
          <span className="opacity-40 mx-2">/</span>
          <span className="text-foreground/60">REL.001</span>
        </div>
        <div className="hidden sm:block text-foreground/60">
          PUBLIC ARCHIVE · NON-COMMERCIAL
        </div>
        <Link
          href="https://github.com/robzilla1738/clubufo"
          target="_blank"
          rel="noreferrer"
          className="hit-target inline-flex items-center hover:text-cyan transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        >
          [GITHUB ↗]
        </Link>
      </div>
    </footer>
  );
}
