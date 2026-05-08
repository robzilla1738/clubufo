import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl w-full px-5 sm:px-8 py-20 space-y-10">
      <header className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          About
        </p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-balance">
          A library, not a verdict.
        </h1>
      </header>

      <div className="space-y-5 text-foreground/85 leading-relaxed text-[17px] font-serif">
        <p>
          ClubUFO is a private reading room for declassified UFO documents,
          witness statements, and field reports — gathered from public
          archives, FOIA releases, and reader submissions.
        </p>
        <p>
          The site doesn&apos;t take a side on whether any of this is real. It
          just makes the source material easier to read, cite, and
          cross-reference. Every page in every PDF is indexed and searchable.
          The chat assistant only quotes what&apos;s in the corpus, and shows
          you the page it&apos;s pulling from.
        </p>
        <p>
          Treat the documents as primary sources of varying credibility. Some
          are official; some are anecdotal. The cited page is always the truth
          of what the assistant said — read it for yourself.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-primary hover:brightness-110 transition-all"
        >
          Browse the library
          <ArrowRight className="size-3.5" />
        </Link>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          Or start a conversation
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
