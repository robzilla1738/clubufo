import Link from "next/link";

export const metadata = { title: "ABOUT" };

export default function AboutPage() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="ufo-page-header ufo-page-pad space-y-3">
        <p className="ufo-kicker ufo-kicker-strong">
          &gt; ABOUT
        </p>
        <h1 className="ufo-title">
          A LIBRARY,
          <br />
          NOT A VERDICT.
        </h1>
      </header>

      <div className="ufo-page-pad grid max-w-5xl gap-x-12 gap-y-10 py-10 md:grid-cols-2 md:py-12">
        <Section heading="WHAT THIS IS">
          <p>
            ChatUFO is a reading room for declassified UAP and UFO files:
            government memos, witness reports, mission debriefs, and FOIA
            releases gathered in one searchable archive.
          </p>
          <p>
            The site does not tell you what to believe. It helps you read the
            source material, compare files, and check citations for yourself.
          </p>
        </Section>

        <Section heading="HOW IT WORKS">
          <p>
            Each PDF is split page by page, transcribed, and indexed. When chat
            cites a passage, the app can point back to the exact page and text
            span behind the answer.
          </p>
          <p>
            Chat only answers from the archive. Inline citations open the page
            they came from, so you can read the file instead of trusting a
            summary.
          </p>
        </Section>

        <Section heading="SOURCE NOTE">
          <p>
            Documents are collected from public, declassified, and
            citizen-submitted sources. Some are official. Some are anecdotal.
            The cited page is the record. Read it before drawing a conclusion.
          </p>
        </Section>

        <Section heading="STACK">
          <ul className="space-y-1.5">
            <li>NEXT.JS · TAILWIND · SHADCN/UI</li>
            <li>NEON POSTGRES + PGVECTOR (HNSW, HYBRID SEARCH)</li>
            <li>GEMINI 3.1 FLASH LITE: VISION OCR + TAGGING</li>
            <li>OPENAI EMBEDDINGS (1536-DIM)</li>
            <li>DEEPSEEK V3.1: RAG ANSWERS</li>
            <li>VERCEL BLOB: PAGE IMAGES</li>
          </ul>
        </Section>
      </div>

      <div className="ufo-page-pad max-w-5xl border-t hairline py-10 md:py-12 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Link
          href="/archive"
          className="ufo-action ufo-action-primary"
        >
          &gt; BROWSE FILES
        </Link>
        <Link
          href="/chat"
          className="ufo-action"
        >
          OPEN CHAT
        </Link>
      </div>
    </div>
  );
}

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="ufo-kicker ufo-kicker-strong">
        &gt; {heading}
      </h2>
      <div className="space-y-3 ufo-copy [&_li]:text-[12px] [&_li]:uppercase [&_li]:tracking-[0.12em]">
        {children}
      </div>
    </section>
  );
}
