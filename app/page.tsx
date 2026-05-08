import Link from "next/link";
import { Hero } from "@/components/site/hero";
import { db, schema } from "@/lib/db/client";
import { desc, eq, count } from "drizzle-orm";
import { DocCard, type DocCardItem } from "@/components/library/doc-card";
import { ArrowRight, FileText, Sparkles, Search, Quote } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  let total = 0;
  let featured: DocCardItem[] = [];

  try {
    const [{ value }] = await db
      .select({ value: count() })
      .from(schema.documents)
      .where(eq(schema.documents.status, "ready"));
    total = Number(value ?? 0);

    featured = (await db
      .select({
        id: schema.documents.id,
        title: schema.documents.title,
        pageCount: schema.documents.pageCount,
        summary: schema.documents.summary,
        tags: schema.documents.tags,
        uploadedAt: schema.documents.uploadedAt,
      })
      .from(schema.documents)
      .where(eq(schema.documents.status, "ready"))
      .orderBy(desc(schema.documents.uploadedAt))
      .limit(6)) as DocCardItem[];
  } catch (e) {
    console.warn("[home] db unavailable", e);
  }

  return (
    <>
      <Hero docCount={total || 161} />

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20 grid gap-10 md:grid-cols-3">
        <Feature
          icon={<Search className="size-4" />}
          title="Search every page"
          body="Hybrid vector + keyword search across the whole corpus, ranked so the most relevant passages surface first."
        />
        <Feature
          icon={<Sparkles className="size-4" />}
          title="Chat with citations"
          body="Every answer points back to the exact page in the exact document. No hallucinated history."
        />
        <Feature
          icon={<Quote className="size-4" />}
          title="Source-first"
          body="Read the raw text alongside metadata. The corpus is yours to skim, study, and second-guess."
        />
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-20">
        <div className="flex items-end justify-between gap-4 mb-6 border-b border-border/60 pb-4">
          <div className="space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Recent additions
            </p>
            <h2 className="font-display text-3xl tracking-tight">
              From the stacks
            </h2>
          </div>
          <Link
            href="/library"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {featured.length === 0 ? (
          <EmptyShelf />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((d) => (
              <DocCard key={d.id} doc={d} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 grid gap-10 md:grid-cols-2 items-center">
          <div className="space-y-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              How to use
            </p>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight max-w-md text-balance">
              Type a question. Read the source. Trust the citation.
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              Ask anything about UFOs, sightings, government programs, or
              individual cases. The librarian only answers from the corpus, and
              every claim links back to a specific page.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 text-primary hover:brightness-110 transition-all"
            >
              Start a conversation
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-5 space-y-3 font-mono text-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-widest">
              <span className="size-1.5 rounded-full bg-primary" />
              Example
            </div>
            <p className="text-muted-foreground">
              <span className="text-foreground/80">›</span> What did the
              military officially conclude about the 1947 incident?
            </p>
            <p className="leading-relaxed text-foreground/80">
              The official statement framed the recovered debris as a weather
              balloon
              <span className="inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-sm bg-primary/15 text-primary text-[9px] mx-0.5 align-text-top">
                1
              </span>
              , though the original press release described a
              &quot;flying disc&quot;
              <span className="inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-sm bg-primary/15 text-primary text-[9px] mx-0.5 align-text-top">
                2
              </span>
              .
            </p>
            <div className="border-t border-border/60 pt-3 space-y-1.5">
              <Source idx={1} title="Project Mogul Final Report" page={42} />
              <Source idx={2} title="RAAF Press Release, July 1947" page={1} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-3">
      <div className="size-9 rounded-md border border-border/70 bg-card/40 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="font-display text-xl tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function Source({
  idx,
  title,
  page,
}: {
  idx: number;
  title: string;
  page: number;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-sm bg-primary/15 text-primary text-[9px] font-mono">
        {idx}
      </span>
      <FileText className="size-3 text-muted-foreground/70" />
      <span className="truncate">{title}</span>
      <span className="text-muted-foreground/60">· p.{page}</span>
    </div>
  );
}

function EmptyShelf() {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-card/30 p-10 text-center space-y-2">
      <p className="font-display text-2xl">The shelves are empty</p>
      <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
        Set up the database, then run{" "}
        <code className="font-mono text-foreground">
          pnpm ingest &lt;path&gt;
        </code>{" "}
        to populate the library.
      </p>
    </div>
  );
}
