import Link from "next/link";
import { db, schema } from "@/lib/db/client";
import { desc, eq, count, and, isNotNull } from "drizzle-orm";
import { HeroCarousel, type CarouselSlide } from "@/components/site/hero-carousel";

export const dynamic = "force-dynamic";

export default async function Home() {
  let total = 0;
  let pageCount = 0;
  let claimCount = 0;
  let slides: CarouselSlide[] = [];

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
        page: schema.pages.page,
        thumbUrl: schema.pages.thumbUrl,
        imageUrl: schema.pages.imageUrl,
      })
      .from(schema.pages)
      .innerJoin(schema.documents, eq(schema.documents.id, schema.pages.documentId))
      .where(
        and(
          eq(schema.documents.status, "ready"),
          eq(schema.pages.page, 1),
          isNotNull(schema.pages.thumbUrl),
        ),
      )
      .orderBy(desc(schema.documents.uploadedAt))
      .limit(28);

    slides = rows.map((r) => ({
      id: r.id,
      title: r.title || r.fallbackTitle,
      page: r.page,
      thumbUrl: r.thumbUrl,
      imageUrl: r.imageUrl,
    }));
  } catch (e) {
    console.warn("[home] db unavailable", e);
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* HERO — carousel takes the room, text is minimal */}
      <section className="flex-1 flex flex-col justify-center min-h-[70vh] py-16 md:py-24">
        <div className="px-6 lg:px-10 mb-10 md:mb-14 grid grid-cols-3 items-end gap-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <div>
            &gt; <span className="text-foreground/80">RELEASE 01</span>
          </div>
          <div className="text-center">
            ARCHIVE OF DECLASSIFIED UAP RECORDS
          </div>
          <div className="text-right tabular-nums">
            <Stat value={total || 119} label="FILES" />
            <span className="mx-2 opacity-30">·</span>
            <Stat value={pageCount} label="PAGES" />
            <span className="mx-2 opacity-30">·</span>
            <Stat value={claimCount} label="CLAIMS" />
          </div>
        </div>

        <HeroCarousel slides={slides} />

        <div className="mt-16 md:mt-20 text-center px-6">
          <h1 className="text-2xl md:text-3xl uppercase tracking-[0.06em]">
            <span className="text-muted-foreground">QUERY THE CORPUS.</span>{" "}
            <span className="text-cyan">READ THE SOURCE.</span>
          </h1>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 border border-cyan text-cyan hover:bg-cyan hover:text-black transition-colors text-[11px] uppercase tracking-[0.22em]"
            >
              &gt; OPEN TERMINAL
            </Link>
            <Link
              href="/archive"
              className="inline-flex items-center gap-2 px-6 py-3 border hairline text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors text-[11px] uppercase tracking-[0.22em]"
            >
              BROWSE ARCHIVE
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
