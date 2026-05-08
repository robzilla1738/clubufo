import Link from "next/link";
import { db, schema } from "@/lib/db/client";
import { desc, eq, count, and, isNotNull, ne, inArray } from "drizzle-orm";
import { HeroFileShelf, type HeroFile } from "@/components/site/hero-carousel";

export const dynamic = "force-dynamic";

const HOME_PREVIEW_LIMIT = 15;
const HOME_PREVIEW_PREFIXES = [
  "FBI-UAP-S23, WITNESS INTERVIEW",
  "FBI-UAP-S23, WITNESS DEBRIEF",
  "USPER-UAP-2025, MISSION REPORT",
  "STATE-DEPT-CABLE, MEXICO POLITICAL BLOTTER",
  "STATE-DEPT-UAP-CABLE, ASHGABAT",
  "DOS-UAP-2001, DIPLOMATIC CABLE",
  "STATE-DEPT-UAP-CABLE, KAZAKHSTAN",
  "DOS-UAP-C1, CABLE REPORT",
  "NASA-UAP-D7",
  "NASA-UAP-D6",
  "NASA-UAP-D5",
  "NASA-UAP-D4",
  "NASA-UAP-D3",
  "NASA-UAP-D2",
  "NASA-UAP-D1",
];

export default async function Home() {
  let total = 0;
  let pageCount = 0;
  let claimCount = 0;
  let files: HeroFile[] = [];

  try {
    // Count every published document, including partials (1 PDF page failed
    // OCR but the doc is still searchable). This matches war.gov's 161-file
    // release count.
    const [{ value: docs }] = await db
      .select({ value: count() })
      .from(schema.documents)
      .where(inArray(schema.documents.status, ["ready", "partial"]));
    total = Number(docs ?? 0);

    const [{ value: pgs }] = await db
      .select({ value: count() })
      .from(schema.pages)
      .where(eq(schema.pages.status, "extracted"));
    pageCount = Number(pgs ?? 0);

    const [{ value: cls }] = await db
      .select({ value: count() })
      .from(schema.claims);
    claimCount = Number(cls ?? 0);

    const rows = await db
      .select({
        id: schema.pages.documentId,
        title: schema.documents.kicker,
        fallbackTitle: schema.documents.title,
        agency: schema.documents.agency,
        documentType: schema.documents.documentType,
        pageCount: schema.documents.pageCount,
        coverImageUrl: schema.documents.coverImageUrl,
      })
      .from(schema.pages)
      .innerJoin(schema.documents, eq(schema.documents.id, schema.pages.documentId))
      .where(
        and(
          eq(schema.documents.status, "ready"),
          eq(schema.documents.mediaKind, "pdf"),
          ne(schema.documents.documentType, "PHOTOGRAPH"),
          eq(schema.pages.status, "extracted"),
          eq(schema.pages.page, 1),
          isNotNull(schema.documents.coverImageUrl),
        ),
      )
      .orderBy(desc(schema.documents.uploadedAt))
      .limit(200);

    const rowsByPrefix = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const title = (row.title || row.fallbackTitle).toUpperCase();
      const prefix = HOME_PREVIEW_PREFIXES.find((p) => title.startsWith(p));
      if (prefix && !rowsByPrefix.has(prefix)) rowsByPrefix.set(prefix, row);
    }

    files = HOME_PREVIEW_PREFIXES.map((prefix) => rowsByPrefix.get(prefix))
      .filter((row): row is (typeof rows)[number] => Boolean(row))
      .slice(0, HOME_PREVIEW_LIMIT)
      .map((r) => ({
        id: r.id,
        title: r.title || r.fallbackTitle,
        agency: r.agency,
        documentType: r.documentType,
        pageCount: r.pageCount,
        coverImageUrl: r.coverImageUrl,
      }));
  } catch (e) {
    console.warn("[home] db unavailable", e);
  }

  return (
    <div className="flex-1 flex flex-col">
      <section className="flex-1 flex flex-col justify-center min-h-[70vh] py-10 sm:py-14 md:py-20">
        <div className="ufo-page-pad mb-8 grid gap-3 text-center ufo-kicker md:mb-12 md:grid-cols-3 md:items-end md:gap-4 md:text-left">
          <div className="order-2 md:order-none">
            &gt; <span className="text-foreground/80">RELEASE 01</span>
          </div>
          <div className="order-1 text-foreground/70 md:order-none md:text-center">
            DECLASSIFIED UAP FILES, READY TO SEARCH
          </div>
          <div className="order-3 flex flex-wrap justify-center gap-x-2 gap-y-1 tabular-nums md:order-none md:block md:text-right">
            <Stat value={total || 119} label="FILES" />
            <span className="hidden opacity-30 md:inline md:mx-2">·</span>
            <Stat value={pageCount} label="PAGES" />
            <span className="hidden opacity-30 md:inline md:mx-2">·</span>
            <Stat value={claimCount} label="CLAIMS" />
          </div>
        </div>

        <HeroFileShelf files={files} />

        <div className="ufo-page-pad mt-12 text-center md:mt-16">
          <h1 className="ufo-headline">
            <span className="text-muted-foreground">ASK THE ARCHIVE.</span>{" "}
            <span className="text-cyan">CHECK THE PAGE.</span>
          </h1>
          <div className="mx-auto mt-7 flex max-w-sm flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
            <Link
              href="/chat"
              className="ufo-action ufo-action-primary px-6 py-3 text-[11px] tracking-[0.22em]"
            >
              &gt; OPEN CHAT
            </Link>
            <Link
              href="/archive"
              className="ufo-action px-6 py-3 text-[11px] tracking-[0.22em]"
            >
              BROWSE FILES
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <span>
      <span className="text-foreground/80">
        [{value.toLocaleString()}]
      </span>{" "}
      {label}
    </span>
  );
}
