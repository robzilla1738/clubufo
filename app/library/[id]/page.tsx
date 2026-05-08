import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db/client";
import { eq, asc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DocumentPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  let doc;
  let chunks: { id: string; page: number; chunkIndex: number; content: string }[] = [];

  try {
    const [d] = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.id, id))
      .limit(1);
    if (!d) notFound();
    doc = d;
    chunks = await db
      .select({
        id: schema.chunks.id,
        page: schema.chunks.page,
        chunkIndex: schema.chunks.chunkIndex,
        content: schema.chunks.content,
      })
      .from(schema.chunks)
      .where(eq(schema.chunks.documentId, id))
      .orderBy(asc(schema.chunks.page), asc(schema.chunks.chunkIndex))
      .limit(400);
  } catch (e) {
    console.error("[doc] db error", e);
    notFound();
  }

  const byPage = new Map<number, typeof chunks>();
  for (const c of chunks) {
    const list = byPage.get(c.page) ?? [];
    list.push(c);
    byPage.set(c.page, list);
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-5 sm:px-8 py-10">
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-3.5" />
        Library
      </Link>

      <div className="grid gap-10 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
        <aside className="md:sticky md:top-20 self-start space-y-6">
          <div className="space-y-3">
            <p className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
              Document
            </p>
            <h1 className="font-display text-3xl leading-tight tracking-tight text-balance">
              {doc.title}
            </h1>
          </div>

          <dl className="space-y-2 text-sm border-t border-border/60 pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Pages</dt>
              <dd className="font-mono">{doc.pageCount ?? "—"}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Chunks</dt>
              <dd className="font-mono">{chunks.length}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-mono uppercase">{doc.status}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Filename</dt>
              <dd className="font-mono text-[11px] text-right truncate max-w-[12rem]">
                {doc.filename}
              </dd>
            </div>
          </dl>

          {doc.tags && doc.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {doc.tags.map((t) => (
                <Badge key={t} variant="secondary" className="font-mono text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="gap-1.5">
              <Link href={`/chat?doc=${doc.id}`}>
                <Sparkles className="size-3.5" />
                Ask about this document
              </Link>
            </Button>
            {doc.fileUrl ? (
              <Button asChild variant="outline" className="gap-1.5">
                <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  Open original PDF
                </a>
              </Button>
            ) : null}
          </div>
        </aside>

        <article className="min-w-0 space-y-10">
          {doc.summary ? (
            <section className="space-y-3 border-l-2 border-primary/40 pl-5">
              <p className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
                Summary
              </p>
              <p className="text-foreground/90 text-lg leading-relaxed font-serif">
                {doc.summary}
              </p>
            </section>
          ) : null}

          <section className="space-y-8">
            <p className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
              Reading view · {byPage.size} pages indexed
            </p>
            {Array.from(byPage.entries()).map(([page, items]) => (
              <div key={page} id={`p-${page}`} className="space-y-3">
                <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Page {page}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {items.length} chunk{items.length === 1 ? "" : "s"}
                  </span>
                </div>
                {items.map((c) => (
                  <p
                    key={c.id}
                    className="text-[15px] leading-7 text-foreground/85 whitespace-pre-wrap text-pretty"
                  >
                    {c.content}
                  </p>
                ))}
              </div>
            ))}
            {byPage.size === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-card/30 p-10 text-center text-muted-foreground text-sm">
                No chunks indexed yet. This document is still processing or
                the PDF contained no extractable text.
              </div>
            ) : null}
          </section>
        </article>
      </div>
    </div>
  );
}
