import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div className="space-y-3">
          <Logo size="sm" />
          <p className="text-muted-foreground max-w-xs leading-relaxed">
            A reading room for the unexplained. Curated, searchable, citable.
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
            Explore
          </p>
          <ul className="space-y-1.5">
            <li>
              <Link
                href="/library"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Document library
              </Link>
            </li>
            <li>
              <Link
                href="/chat"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Chat with the archive
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                About the project
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
            Disclaimer
          </p>
          <p className="text-muted-foreground/80 leading-relaxed text-[13px]">
            Documents collected from public, declassified, and citizen-submitted
            sources. Answers from the chat assistant are generated and may be
            incorrect — always check the cited source.
          </p>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-4 flex items-center justify-between text-[11px] font-mono text-muted-foreground/70 uppercase tracking-wider">
          <span>© {new Date().getFullYear()} ClubUFO</span>
          <span>Transmission stable · v0.1</span>
        </div>
      </div>
    </footer>
  );
}
