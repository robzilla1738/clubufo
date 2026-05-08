import Link from "next/link";

export function HudFooter() {
  return (
    <footer className="border-t hairline bg-background">
      <div className="px-6 lg:px-10 h-10 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
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
          className="hover:text-cyan transition-colors"
        >
          [GITHUB ↗]
        </Link>
      </div>
    </footer>
  );
}
