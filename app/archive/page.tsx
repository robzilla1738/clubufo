import Link from "next/link";
import { db, schema } from "@/lib/db/client";
import { and, desc, asc, eq, ilike, or, sql, inArray } from "drizzle-orm";
import { ArchiveFilters, type FilterFacet } from "@/components/archive/filters";

export const dynamic = "force-dynamic";

export const metadata = { title: "ARCHIVE" };

type SP = { q?: string; sort?: string; type?: string; tag?: string };

export default async function ArchivePage(props: {
  searchParams: Promise<SP>;
}) {
  const sp = await props.searchParams;
  const q = (sp.q ?? "").trim();
  const sort = sp.sort ?? "recent";
  const typeFilter = sp.type;
  const tagFilter = sp.tag;

  const conditions = [
    inArray(schema.documents.status, ["ready", "partial"]),
  ];
  if (q) {
    conditions.push(
      or(
        ilike(schema.documents.title, `%${q}%`),
        ilike(schema.documents.kicker, `%${q}%`),
        ilike(schema.documents.summary, `%${q}%`),
        ilike(schema.documents.filename, `%${q}%`),
      )!,
    );
  }
  if (typeFilter) {
    conditions.push(eq(schema.documents.documentType, typeFilter));
  }
  if (tagFilter) {
    conditions.push(sql`${tagFilter} = ANY(${schema.documents.tags})`);
  }

  const orderBy =
    sort === "title"
      ? asc(schema.documents.title)
      : sort === "pages"
        ? desc(schema.documents.pageCount)
        : desc(schema.documents.uploadedAt);

  type Row = {
    id: string;
    kicker: string | null;
    title: string;
    agency: string | null;
    documentType: string | null;
    incidentDate: string | null;
    incidentLocation: string | null;
    pageCount: number | null;
    tags: string[];
    uploadedAt: Date;
  };
  let rows: Row[] = [];
  let dbAvailable = true;
  let facets: FilterFacet[] = [];

  try {
    rows = (await db
      .select({
        id: schema.documents.id,
        kicker: schema.documents.kicker,
        title: schema.documents.title,
        agency: schema.documents.agency,
        documentType: schema.documents.documentType,
        incidentDate: schema.documents.incidentDate,
        incidentLocation: schema.documents.incidentLocation,
        pageCount: schema.documents.pageCount,
        tags: schema.documents.tags,
        uploadedAt: schema.documents.uploadedAt,
      })
      .from(schema.documents)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(500)) as Row[];

    // Compute facet counts from ALL ready/partial docs (not the filtered set —
    // we want to show what's available to filter to).
    const facetRows = await db
      .select({
        documentType: schema.documents.documentType,
        tags: schema.documents.tags,
        agency: schema.documents.agency,
      })
      .from(schema.documents)
      .where(inArray(schema.documents.status, ["ready", "partial"]));

    const typeCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();
    const agencyCounts = new Map<string, number>();
    for (const r of facetRows) {
      if (r.documentType)
        typeCounts.set(r.documentType, (typeCounts.get(r.documentType) ?? 0) + 1);
      if (r.agency)
        agencyCounts.set(r.agency, (agencyCounts.get(r.agency) ?? 0) + 1);
      for (const t of r.tags ?? []) {
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
    }
    const sortDesc = (m: Map<string, number>) =>
      Array.from(m.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

    facets = [
      { type: "type", values: sortDesc(typeCounts) },
      { type: "tag", values: sortDesc(tagCounts) },
      { type: "agency", values: sortDesc(agencyCounts) },
    ];
  } catch (e) {
    dbAvailable = false;
    console.error("[archive] db error", e);
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* PAGE HEADER */}
      <header className="px-6 lg:px-10 pt-14 pb-10 border-b hairline">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          &gt; <span className="text-cyan">ARCHIVE</span>
          <span className="opacity-40 mx-2">/</span>
          RELEASE 001
          <span className="opacity-40 mx-2">/</span>
          PUBLIC
        </p>
        <h1 className="mt-3 text-3xl md:text-5xl uppercase tracking-[0.02em] leading-[1.05]">
          FILE INDEX
        </h1>
      </header>

      <ArchiveFilters
        total={rows.length}
        facets={facets}
        initialQuery={q}
        initialSort={sort}
        initialType={typeFilter}
        initialTag={tagFilter}
      />

      <div className="flex-1 px-6 lg:px-10 py-6 overflow-x-auto">
        {!dbAvailable ? (
          <EmptyState
            title="[NO DB CONNECTION]"
            body="Database is unreachable. Check DATABASE_URL."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title={q ? `[NO MATCH FOR "${q.toUpperCase()}"]` : "[NO FILES]"}
            body="Adjust filters or run pnpm ingest to seed the corpus."
          />
        ) : (
          <ArchiveTable rows={rows} />
        )}
      </div>
    </div>
  );
}

function ArchiveTable({
  rows,
}: {
  rows: Array<{
    id: string;
    kicker: string | null;
    title: string;
    agency: string | null;
    documentType: string | null;
    incidentDate: string | null;
    incidentLocation: string | null;
    pageCount: number | null;
    uploadedAt: Date;
  }>;
}) {
  const fmtDate = (d: Date | string | null) => {
    if (!d) return "N/A";
    const date = typeof d === "string" ? new Date(d) : d;
    return `${String(date.getMonth() + 1)}/${date.getDate()}/${String(date.getFullYear()).slice(-2)}`;
  };
  return (
    <table className="w-full text-[11px] uppercase tracking-[0.06em] border-collapse">
      <thead>
        <tr>
          <th className="text-left font-normal text-cyan border-y hairline py-3 px-4 w-[42%]">
            <span className="tabular-nums tracking-[0.18em]">
              {rows.length.toLocaleString()} FILES
            </span>
          </th>
          <th className="text-left font-normal text-cyan border-y hairline py-3 px-4">
            AGENCY
          </th>
          <th className="text-left font-normal text-cyan border-y hairline py-3 px-4">
            INDEXED
          </th>
          <th className="text-left font-normal text-cyan border-y hairline py-3 px-4">
            INCIDENT
          </th>
          <th className="text-left font-normal text-cyan border-y hairline py-3 px-4">
            LOCATION
          </th>
          <th className="text-right font-normal text-cyan border-y hairline py-3 px-4">
            TYPE <span className="opacity-60">↑</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            className="border-b hairline group hover:bg-cyan/[0.035] transition-colors"
          >
            <td className="py-4 px-4 align-top">
              <Link
                href={`/archive/${r.id}`}
                className="group-hover:text-cyan transition-colors leading-[1.5] block"
              >
                {r.kicker ?? r.title}
              </Link>
            </td>
            <td className="py-4 px-4 text-muted-foreground align-top">
              <span data-bracket>{r.agency ?? "N/A"}</span>
            </td>
            <td className="py-4 px-4 text-muted-foreground align-top tabular-nums">
              <span data-bracket>{fmtDate(r.uploadedAt)}</span>
            </td>
            <td className="py-4 px-4 text-muted-foreground align-top tabular-nums">
              <span data-bracket>
                {r.incidentDate ? fmtDate(r.incidentDate) : "N/A"}
              </span>
            </td>
            <td className="py-4 px-4 text-muted-foreground align-top">
              <span data-bracket>{r.incidentLocation ?? "N/A"}</span>
            </td>
            <td className="py-4 px-4 text-right text-muted-foreground align-top">
              <span data-bracket>.PDF</span>
              {r.pageCount ? (
                <span className="ml-2 text-muted-foreground/50 tabular-nums">
                  {r.pageCount}p
                </span>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border hairline p-12 text-center space-y-3">
      <p className="text-cyan text-[12px] uppercase tracking-[0.18em]">
        {title}
      </p>
      <p className="text-muted-foreground text-[11px] uppercase tracking-[0.1em]">
        {body}
      </p>
    </div>
  );
}
