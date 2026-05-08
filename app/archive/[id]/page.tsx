import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db/client";
import { eq, asc } from "drizzle-orm";
import { PageImageViewer } from "@/components/archive/page-image-viewer";

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
      <header className="border-b hairline">
        <div className="ufo-page-pad grid gap-8 py-8 md:grid-cols-[1fr_320px] md:py-10">
          <div className="space-y-3 min-w-0">
            <Link
              href="/archive"
              className="hit-target inline-flex items-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            >
              &lt; ARCHIVE
            </Link>
            <p className="ufo-kicker ufo-kicker-strong">
              &gt; FILE / {doc.id.slice(0, 8).toUpperCase()}
            </p>
            <h1 className="ufo-headline">
              {doc.kicker ?? doc.title}
            </h1>
            {doc.summary ? (
              <p className="ufo-copy max-w-2xl">
                {doc.summary}
              </p>
            ) : null}
            <div className="pt-3 flex flex-wrap gap-2">
              {(doc.tags ?? []).map((t) => (
                <Link
                  key={t}
                  href={`/archive?tag=${encodeURIComponent(t)}`}
                  className="ufo-chip"
                >
                  {t}
                </Link>
              ))}
            </div>
            <div className="pt-3">
              <Link
                href={`/chat?doc=${doc.id}`}
                className="ufo-action ufo-action-primary"
              >
                &gt; ASK ABOUT THIS FILE
              </Link>
            </div>
          </div>

          {/* META PANEL */}
          <dl className="self-start divide-y divide-border border hairline text-[10px] uppercase tracking-[0.12em]">
            <Meta label="AGENCY" value={doc.agency ?? "N/A"} />
            <Meta label="TYPE" value={doc.documentType ?? "N/A"} />
            <Meta label="INCIDENT DATE" value={doc.incidentDate ?? "N/A"} />
            <Meta label="LOCATION" value={doc.incidentLocation ?? "N/A"} />
            <Meta label="PAGES" value={String(doc.pageCount ?? "N/A")} />
            <Meta
              label="EXTRACTED"
              value={`${doc.pagesProcessed} / ${doc.pageCount ?? "N/A"}`}
            />
            <Meta label="STATUS" value={doc.status.toUpperCase()} />
            {doc.fileUrl ? (
              <div className="ufo-meta-grid">
                <dt className="text-muted-foreground">SOURCE</dt>
                <dd>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
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
      <section className="ufo-page-pad py-8 md:py-10">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="ufo-kicker">
            &gt; PAGES INDEXED [{pageRows.length.toString().padStart(3, "0")}]
          </p>
          <p className="ufo-kicker">
            OPEN A PAGE BELOW
          </p>
        </div>
        {pageRows.length === 0 ? (
          <div className="border hairline p-12 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
            [NO PAGES YET: DOCUMENT STILL PROCESSING]
          </div>
        ) : (
          <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {pageRows.map((p) => (
              <li key={p.id}>
                <a
                  href={`#p-${p.page}`}
                  className="group block border hairline transition-colors hover:border-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                >
                  <div className="relative aspect-[3/4] bg-background/40 overflow-hidden">
                    {p.thumbUrl ? (
                      <Image
                        src={p.thumbUrl}
                        alt={`Page ${p.page}`}
                        fill
                        unoptimized
                        sizes="240px"
                        className="object-cover object-top opacity-80 image-outline transition-opacity group-hover:opacity-100"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-wider text-muted-foreground">
                        [NO PREVIEW]
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

      {/* PAGE TEXT */}
      <section className="ufo-page-pad pb-16 md:pb-20">
        <p className="ufo-kicker mb-6">
          &gt; PAGE TEXT
        </p>
        <div className="max-w-4xl space-y-10 md:space-y-12">
          {pageRows.map((p) => (
            <article key={p.id} id={`p-${p.page}`} className="grid scroll-mt-20 gap-5 md:grid-cols-[160px_1fr]">
              <div className="space-y-2">
                <PageImageViewer
                  page={p.page}
                  thumbUrl={p.thumbUrl}
                  imageUrl={p.imageUrl}
                />
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
                  <p className="ufo-copy italic">
                    {p.pageSummary}
                  </p>
                ) : null}
                {p.cleanedText ? (
                  <pre className="whitespace-pre-wrap font-mono text-[12px] leading-[1.75] tracking-normal text-foreground/90">
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
    <div className="ufo-meta-grid">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        <span data-bracket className="text-foreground/85">
          {value}
        </span>
      </dd>
    </div>
  );
}
