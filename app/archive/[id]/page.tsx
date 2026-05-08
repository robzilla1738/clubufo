import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db/client";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DocumentPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  let doc;
  type PageRow = {
    id: string;
    page: number;
    thumbUrl: string | null;
    imageUrl: string | null;
    pageSummary: string | null;
    documentType: string | null;
    classification: string | null;
    cleanedText: string | null;
  };
  let pageRows: PageRow[] = [];

  try {
    const [d] = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.id, id))
      .limit(1);
    if (!d) notFound();
    doc = d;
    pageRows = (await db
      .select({
        id: schema.pages.id,
        page: schema.pages.page,
        thumbUrl: schema.pages.thumbUrl,
        imageUrl: schema.pages.imageUrl,
        pageSummary: schema.pages.pageSummary,
        documentType: schema.pages.documentType,
        classification: schema.pages.classification,
        cleanedText: schema.pages.cleanedText,
      })
      .from(schema.pages)
      .where(eq(schema.pages.documentId, id))
      .orderBy(asc(schema.pages.page))) as PageRow[];
  } catch (e) {
    console.error("[doc] db error", e);
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* HEADER */}
      <header className="border-b hairline">
        <div className="px-6 lg:px-10 py-10 grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-3 min-w-0">
            <Link
              href="/archive"
              className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-cyan transition-colors"
            >
              &lt; ARCHIVE
            </Link>
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan">
              &gt; FILE / {doc.id.slice(0, 8).toUpperCase()}
            </p>
            <h1 className="text-2xl md:text-3xl uppercase tracking-tight leading-[1.15] text-balance">
              {doc.kicker ?? doc.title}
            </h1>
            {doc.summary ? (
              <p className="text-[12px] uppercase tracking-[0.06em] text-muted-foreground leading-[1.7] max-w-2xl normal-case">
                {doc.summary}
              </p>
            ) : null}
            <div className="pt-3 flex flex-wrap gap-2">
              {(doc.tags ?? []).map((t) => (
                <Link
                  key={t}
                  href={`/archive?tag=${encodeURIComponent(t)}`}
                  className="border hairline px-2 h-6 text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-cyan hover:border-cyan transition-colors flex items-center"
                >
                  {t}
                </Link>
              ))}
            </div>
            <div className="pt-3">
              <Link
                href={`/chat?doc=${doc.id}`}
                className="inline-flex items-center gap-2 border border-cyan text-cyan hover:bg-cyan hover:text-black transition-colors px-4 py-2 text-[10px] uppercase tracking-[0.18em]"
              >
                &gt; QUERY THIS FILE
              </Link>
            </div>
          </div>

          {/* META PANEL */}
          <dl className="border hairline divide-y divide-border text-[10px] uppercase tracking-[0.12em] self-start">
            <Meta label="AGENCY" value={doc.agency ?? "N/A"} />
            <Meta label="TYPE" value={doc.documentType ?? "N/A"} />
            <Meta label="INCIDENT DATE" value={doc.incidentDate ?? "N/A"} />
            <Meta label="LOCATION" value={doc.incidentLocation ?? "N/A"} />
            <Meta label="PAGES" value={String(doc.pageCount ?? "—")} />
            <Meta
              label="EXTRACTED"
              value={`${doc.pagesProcessed} / ${doc.pageCount ?? "—"}`}
            />
            <Meta label="STATUS" value={doc.status.toUpperCase()} />
            {doc.fileUrl ? (
              <div className="grid grid-cols-[110px_1fr] items-baseline gap-3 px-3 py-2.5">
                <dt className="text-muted-foreground">SOURCE</dt>
                <dd>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan hover:underline"
                  >
                    [↗ ORIGINAL]
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </header>

      {/* PAGES GRID */}
      <section className="px-6 lg:px-10 py-10">
        <div className="flex items-baseline justify-between mb-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            &gt; PAGES INDEXED [{pageRows.length.toString().padStart(3, "0")}]
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            CLICK FOR FULL READ
          </p>
        </div>
        {pageRows.length === 0 ? (
          <div className="border hairline p-12 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
            [NO PAGES YET — DOCUMENT STILL PROCESSING]
          </div>
        ) : (
          <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {pageRows.map((p) => (
              <li key={p.id}>
                <a
                  href={`#p-${p.page}`}
                  className="group block border hairline hover:border-cyan transition-colors"
                >
                  <div className="relative aspect-[3/4] bg-black/40 overflow-hidden">
                    {p.thumbUrl ? (
                      <Image
                        src={p.thumbUrl}
                        alt={`Page ${p.page}`}
                        fill
                        unoptimized
                        sizes="240px"
                        className="object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-wider text-muted-foreground">
                        [—]
                      </div>
                    )}
                    <span className="absolute top-1.5 right-1.5 font-mono text-[10px] tabular-nums bg-background/85 px-1.5 py-0.5">
                      P.{p.page}
                    </span>
                    {p.classification && p.classification !== "UNKNOWN" ? (
                      <span className="absolute top-1.5 left-1.5 font-mono text-[9px] uppercase tracking-wider bg-background/85 px-1.5 py-0.5 text-cyan">
                        {p.classification.slice(0, 8)}
                      </span>
                    ) : null}
                  </div>
                </a>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* FULL READ */}
      <section className="px-6 lg:px-10 pb-20">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-6">
          &gt; FULL READ
        </p>
        <div className="space-y-12 max-w-4xl">
          {pageRows.map((p) => (
            <article key={p.id} id={`p-${p.page}`} className="grid gap-5 md:grid-cols-[160px_1fr]">
              <div className="space-y-2">
                {p.thumbUrl ? (
                  <div className="relative aspect-[3/4] border hairline overflow-hidden">
                    <Image
                      src={p.thumbUrl}
                      alt={`Page ${p.page}`}
                      fill
                      unoptimized
                      sizes="160px"
                      className="object-cover object-top"
                    />
                  </div>
                ) : null}
                <p className="text-[10px] uppercase tracking-[0.18em] text-cyan tabular-nums">
                  PAGE {p.page}
                </p>
                {p.documentType ? (
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {p.documentType}
                  </p>
                ) : null}
              </div>
              <div className="space-y-3">
                {p.pageSummary ? (
                  <p className="text-[12px] leading-[1.7] text-foreground/80 normal-case tracking-normal italic">
                    {p.pageSummary}
                  </p>
                ) : null}
                {p.cleanedText ? (
                  <pre className="whitespace-pre-wrap text-[12px] leading-[1.75] text-foreground/90 normal-case tracking-normal font-mono">
                    {p.cleanedText}
                  </pre>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-baseline gap-3 px-3 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        <span data-bracket className="text-foreground/85">
          {value}
        </span>
      </dd>
    </div>
  );
}
