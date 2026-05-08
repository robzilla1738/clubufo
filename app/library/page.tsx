import { db, schema } from "@/lib/db/client";
import { and, desc, asc, eq, ilike, or, sql } from "drizzle-orm";
import { LibraryFilters } from "@/components/library/filters";
import { DocCard, type DocCardItem } from "@/components/library/doc-card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Library" };

type SP = { q?: string; sort?: string; tag?: string };

export default async function LibraryPage(props: {
  searchParams: Promise<SP>;
}) {
  const sp = await props.searchParams;
  const q = (sp.q ?? "").trim();
  const sort = sp.sort ?? "recent";
  const tag = sp.tag;

  const conditions = [eq(schema.documents.status, "ready")];
  if (q) {
    conditions.push(
      or(
        ilike(schema.documents.title, `%${q}%`),
        ilike(schema.documents.summary, `%${q}%`),
        ilike(schema.documents.filename, `%${q}%`),
      )!,
    );
  }
  if (tag) {
    conditions.push(sql`${tag} = ANY(${schema.documents.tags})`);
  }

  const orderBy =
    sort === "title"
      ? asc(schema.documents.title)
      : sort === "pages"
        ? desc(schema.documents.pageCount)
        : desc(schema.documents.uploadedAt);

  let rows: DocCardItem[] = [];
  let dbAvailable = true;
  try {
    rows = (await db
      .select({
        id: schema.documents.id,
        title: schema.documents.title,
        pageCount: schema.documents.pageCount,
        summary: schema.documents.summary,
        tags: schema.documents.tags,
        uploadedAt: schema.documents.uploadedAt,
      })
      .from(schema.documents)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(200)) as DocCardItem[];
  } catch (e) {
    dbAvailable = false;
    console.error("[library] db error", e);
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-5 sm:px-8 py-12 flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-balance">
          The reading room
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Every document in the corpus, indexed page by page. Open one to read,
          or hop straight into a chat that&apos;s already grounded in it.
        </p>
      </header>

      <LibraryFilters total={rows.length} initialQuery={q} initialSort={sort} />

      {!dbAvailable ? (
        <EmptyState
          title="Database not connected"
          body="Add DATABASE_URL to .env.local, run pnpm db:push and pnpm db:setup, then refresh."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title={q ? `No matches for “${q}”` : "Corpus is empty"}
          body={
            q
              ? "Try a different keyword, or browse everything by clearing the filter."
              : "Run pnpm ingest <path-to-pdf-dir> to seed the library."
          }
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((doc) => (
            <DocCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-card/30 p-12 text-center flex flex-col items-center gap-2">
      <p className="font-display text-2xl">{title}</p>
      <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
        {body}
      </p>
    </div>
  );
}
