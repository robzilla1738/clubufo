import Link from "next/link";
import { db, schema } from "@/lib/db/client";
import { eq, count, and, isNotNull, inArray } from "drizzle-orm";
import { HeroFileShelf, type HeroFile } from "@/components/site/hero-carousel";

export const dynamic = "force-dynamic";

const HOME_PREVIEW_LIMIT = 15;
const HOME_PREVIEW_DOCUMENT_IDS = [
  "f730f25e-db96-4ce2-a903-af46e4942414",
  "47e3e033-52a3-484c-841b-994a8c15c07b",
  "f9df882e-3d0a-476d-9efd-b84acd91c224",
  "6e989482-dc59-44a4-8a5c-8a9eb55d4d70",
  "db5d28bd-c38e-4695-88bf-857f69eece65",
  "fbb2b6f9-2b9e-4d49-a1fb-363f1a155822",
  "c280c72c-dda9-48a9-8247-9e17ea7afdba",
  "0f2eba29-fa4a-44bc-b0e5-4763ab48d039",
  "3e68522e-8553-416c-bc9d-4f644483caea",
  "28a483e0-bfeb-4712-8184-aff37b5c3a74",
  "b72c759c-c383-4aa2-8a34-690ae963d6b2",
  "a5ae13ed-75f5-4db1-9f65-20b0c46b3758",
  "6c936ed4-4de8-453c-8328-d6fd37760de0",
  "80c68a3e-7806-4e23-bd56-75c1c2fa3423",
  "e87570a7-f7ab-4118-a05d-0970b942b2a5",
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
          inArray(schema.documents.id, HOME_PREVIEW_DOCUMENT_IDS),
          eq(schema.pages.status, "extracted"),
          eq(schema.pages.page, 1),
          isNotNull(schema.documents.coverImageUrl),
        ),
      )
      .limit(HOME_PREVIEW_DOCUMENT_IDS.length);

    const rowsById = new Map(rows.map((row) => [row.id, row]));

    files = HOME_PREVIEW_DOCUMENT_IDS.map((id) => rowsById.get(id))
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
