import Link from "next/link";
import { db, schema } from "@/lib/db/client";
import { and, desc, asc, eq, ilike, or, sql, inArray } from "drizzle-orm";
import { ArchiveFilters, type FilterFacet } from "@/components/archive/filters";

export const dynamic = "force-dynamic";

export const metadata = { title: "ARCHIVE" };

type SP = {
  q?: string;
  sort?: string;
  type?: string;
  tag?: string;
  agency?: string;
};

export default async function ArchivePage(props: {
  searchParams: Promise<SP>;
}) {
  const sp = await props.searchParams;
  const q = (sp.q ?? "").trim();
  const sort = sp.sort ?? "recent";
  const typeFilter = sp.type;
  const tagFilter = sp.tag;
  const agencyFilter = sp.agency;

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
  if (agencyFilter) {
    conditions.push(eq(schema.documents.agency, agencyFilter));
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

    // Compute facet counts from ALL ready/partial docs, not the filtered set.
    // We want to show what's available to filter to.
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
      <header className="ufo-page-header ufo-page-pad">
        <p className="ufo-kicker">
          &gt; <span className="ufo-kicker-strong">ARCHIVE</span>
          <span className="opacity-40 mx-2">/</span>
          RELEASE 001
          <span className="opacity-40 mx-2">/</span>
          PUBLIC
        </p>
        <h1 className="ufo-title mt-3">
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
        initialAgency={agencyFilter}
      />

      <div className="ufo-page-pad flex-1 py-5 md:overflow-x-auto md:py-6">
        {!dbAvailable ? (
          <EmptyState
            title="[NO DB CONNECTION]"
            body="Database is unreachable. Check DATABASE_URL."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title={q ? `[NO MATCH FOR "${q.toUpperCase()}"]` : "[NO FILES]"}
            body="Adjust filters or add files to the archive."
          />
        ) : (
          <>
            <ArchiveCardList rows={rows} />
            <ArchiveTable rows={rows} />
          </>
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
    <table className="hidden min-w-[980px] w-full table-fixed border-collapse text-[11px] tracking-[0.06em] md:table">
      <colgroup>
        <col className="w-[30%]" />
        <col className="w-[14%]" />
        <col className="w-[14%]" />
        <col className="w-[10%]" />
        <col className="w-[12%]" />
        <col className="w-[13%]" />
        <col className="w-[7%]" />
      </colgroup>
      <thead>
        <tr>
          <th className="text-left font-normal text-cyan border-y hairline py-3 px-4">
            <span className="tabular-nums tracking-[0.18em]">
              {rows.length.toLocaleString()} FILES
            </span>
          </th>
          <th className="text-left font-normal text-cyan border-y hairline py-3 px-4">
            TYPE
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
            PGS
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            className="group h-[76px] border-b hairline transition-colors hover:bg-cyan/[0.035]"
          >
            <td className="px-4 py-3 align-middle">
              <Link
                href={`/archive/${r.id}`}
                className="line-clamp-2 text-[12px] leading-[1.55] tracking-normal text-foreground/90 transition-colors group-hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              >
                {r.kicker ?? r.title}
              </Link>
            </td>
            <td className="px-4 py-3 align-middle uppercase text-muted-foreground">
              <span className="block truncate" data-bracket title={r.documentType ?? "N/A"}>
                {formatFacetLabel(r.documentType ?? "N/A")}
              </span>
            </td>
            <td className="px-4 py-3 align-middle uppercase text-muted-foreground">
              <span className="block truncate" data-bracket title={r.agency ?? "N/A"}>
                {r.agency ?? "N/A"}
              </span>
            </td>
            <td className="px-4 py-3 align-middle tabular-nums uppercase text-muted-foreground">
              <span data-bracket>{fmtDate(r.uploadedAt)}</span>
            </td>
            <td className="px-4 py-3 align-middle tabular-nums uppercase text-muted-foreground">
              <span data-bracket>
                {r.incidentDate ? fmtDate(r.incidentDate) : "N/A"}
              </span>
            </td>
            <td className="px-4 py-3 align-middle uppercase text-muted-foreground">
              <span className="line-clamp-2" data-bracket title={r.incidentLocation ?? "N/A"}>
                {r.incidentLocation ?? "N/A"}
              </span>
            </td>
            <td className="px-4 py-3 text-right align-middle uppercase text-muted-foreground">
              <span className="tabular-nums" data-bracket>
                {r.pageCount ?? "N/A"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ArchiveCardList({
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
    <ol className="divide-y divide-border/70 border-y hairline md:hidden">
      {rows.map((r) => (
        <li key={r.id}>
          <Link
            href={`/archive/${r.id}`}
            className="block min-h-[152px] px-1 py-4 transition-[background-color,scale] hover:bg-cyan/[0.035] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="line-clamp-2 text-[12px] leading-[1.55] tracking-normal text-foreground">
                {r.kicker ?? r.title}
              </h2>
              <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-cyan">
                [.PDF]
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <div>
                <dt className="text-muted-foreground/50">Agency</dt>
                <dd className="mt-0.5 truncate text-foreground/75" data-bracket>
                  {r.agency ?? "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground/50">Type</dt>
                <dd className="mt-0.5 truncate text-foreground/75" data-bracket>
                  {formatFacetLabel(r.documentType ?? "N/A")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground/50">Incident</dt>
                <dd className="mt-0.5 text-foreground/75 tabular-nums" data-bracket>
                  {r.incidentDate ? fmtDate(r.incidentDate) : "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground/50">Pages</dt>
                <dd className="mt-0.5 text-foreground/75 tabular-nums" data-bracket>
                  {r.pageCount ? `${r.pageCount}p` : "N/A"}
                </dd>
              </div>
            </dl>
            {r.incidentLocation ? (
              <p className="mt-3 line-clamp-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
                {r.incidentLocation}
              </p>
            ) : null}
          </Link>
        </li>
      ))}
    </ol>
  );
}

function formatFacetLabel(value: string) {
  return value.replaceAll("_", " ");
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border hairline p-8 text-center space-y-3 sm:p-12">
      <p className="ufo-kicker ufo-kicker-strong">
        {title}
      </p>
      <p className="ufo-copy mx-auto max-w-xl uppercase tracking-[0.1em]">
        {body}
      </p>
    </div>
  );
}
