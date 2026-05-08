import Link from "next/link";
import { db, schema } from "@/lib/db/client";
import { desc, eq, count, and, isNotNull } from "drizzle-orm";
import { HeroCarousel, type CarouselSlide } from "@/components/site/hero-carousel";

export const dynamic = "force-dynamic";

const TRUMP_QUOTE = `BASED ON THE TREMENDOUS INTEREST SHOWN, I WILL BE DIRECTING THE SECRETARY OF WAR, AND OTHER RELEVANT DEPARTMENTS AND AGENCIES, TO BEGIN THE PROCESS OF IDENTIFYING AND RELEASING GOVERNMENT FILES RELATED TO ALIEN AND EXTRATERRESTRIAL LIFE, UNIDENTIFIED AERIAL PHENOMENA (UAP), AND UNIDENTIFIED FLYING OBJECTS (UFOS), AND ANY AND ALL OTHER ANOMALOUS, UNEXPLAINED EVENTS RECORDED IN THE FILES OF THE U.S. GOVERNMENT.`;

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

    // Featured slides: first-page thumbnails of ready documents.
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
      .limit(24);

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
      {/* HERO */}
      <section className="relative pt-12 md:pt-16 pb-16 md:pb-24 overflow-hidden">
        <HeroCarousel slides={slides} />
      </section>

      {/* TRUMP QUOTE BAND */}
      <section className="border-t hairline">
        <div className="px-6 lg:px-10 py-8 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground space-y-1.5">
            <div className="text-foreground/80">DONALD J. TRUMP</div>
            <div>TRUTH SOCIAL</div>
          </div>
          <div className="col-span-12 md:col-span-9 text-[11px] md:text-[12px] uppercase tracking-[0.12em] leading-[1.9] text-foreground/85">
            {TRUMP_QUOTE}
          </div>
          <div className="col-span-12 md:col-span-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground text-right tabular-nums">
            [02 19 26]
          </div>
        </div>
      </section>

      {/* CTA + STATS */}
      <section className="border-t hairline">
        <div className="px-6 lg:px-10 py-12 md:py-20 grid gap-10 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan">
              &gt; INTERROGATE THE CORPUS
            </p>
            <h1 className="text-3xl md:text-5xl uppercase tracking-tight leading-[1.05]">
              ASK A QUESTION.
              <br />
              READ THE SOURCE.
              <br />
              <span className="text-cyan">TRUST THE CITATION.</span>
            </h1>
            <p className="text-[12px] md:text-[13px] uppercase tracking-[0.08em] leading-[1.8] text-muted-foreground max-w-md">
              Every answer is grounded in the archive. Each citation is
              clickable and opens the exact page of the original PDF, with the
              quoted span highlighted.
            </p>
            <div className="flex gap-3 pt-2">
              <Link
                href="/chat"
                className="inline-flex items-center gap-3 px-5 py-3 border border-cyan text-cyan hover:bg-cyan hover:text-black transition-colors text-[11px] uppercase tracking-[0.2em]"
              >
                &gt; OPEN TERMINAL <span className="cursor-blink"></span>
              </Link>
              <Link
                href="/archive"
                className="inline-flex items-center gap-3 px-5 py-3 border hairline text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors text-[11px] uppercase tracking-[0.2em]"
              >
                BROWSE [161] FILES
              </Link>
            </div>
          </div>

          {/* Stats panel */}
          <div className="grid grid-cols-3 gap-4 border hairline p-6">
            <Stat label="DOCUMENTS" value={total || 161} />
            <Stat label="PAGES INDEXED" value={pageCount} />
            <Stat label="CLAIMS EXTRACTED" value={claimCount} />
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2 border-l hairline pl-4 first:border-l-0 first:pl-0 md:border-l md:pl-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="text-3xl md:text-4xl tabular-nums text-cyan">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
