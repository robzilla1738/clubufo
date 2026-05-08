import Link from "next/link";
import { db, schema } from "@/lib/db/client";
import { desc, eq, count, and, isNotNull, ne, sql } from "drizzle-orm";
import { HeroFileShelf, type HeroFile } from "@/components/site/hero-carousel";

export const dynamic = "force-dynamic";

const HOME_PREVIEW_LIMIT = 15;

export default async function Home() {
  let total = 0;
  let pageCount = 0;
  let claimCount = 0;
  let files: HeroFile[] = [];

  try {
    const [{ value: docs }] = await db
      .select({ value: count() })
      .from(schema.documents)
      .where(eq(schema.documents.status, "ready"));
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
          ne(schema.documents.documentType, "PHOTOGRAPH"),
          eq(schema.pages.status, "extracted"),
          eq(schema.pages.page, 1),
          isNotNull(schema.documents.coverImageUrl),
          sql`coalesce(${schema.documents.kicker}, ${schema.documents.title}) not ilike 'WUS-UAP-161%'`,
        ),
      )
      .orderBy(desc(schema.documents.uploadedAt))
      .limit(HOME_PREVIEW_LIMIT);

    files = rows.map((r) => ({
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
