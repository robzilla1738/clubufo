import Link from "next/link";

export const metadata = { title: "ABOUT" };

export default function AboutPage() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b hairline px-6 lg:px-10 py-12 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-cyan">
          &gt; ABOUT
        </p>
        <h1 className="text-3xl md:text-5xl uppercase tracking-tight leading-[1.05]">
          A LIBRARY,
          <br />
          NOT A VERDICT.
        </h1>
      </header>

      <div className="px-6 lg:px-10 py-12 grid gap-10 md:grid-cols-2 max-w-5xl">
        <Section heading="MISSION">
          <p>
            ChatUFO is a public reading room for declassified UAP / UFO
            documents — government memos, witness reports, mission debriefs,
            and FOIA releases — gathered into a single searchable archive.
          </p>
          <p>
            The site doesn&apos;t take a side on whether any of it is real.
            It just makes the source material easier to read, cite, and
            cross-reference.
          </p>
        </Section>

        <Section heading="HOW IT WORKS">
          <p>
            Every PDF is rendered to images and transcribed page-by-page by
            a vision model. Each page yields cleaned text, named entities,
            and a list of atomic claims with character offsets — so when the
            chat assistant cites a passage, we can highlight the exact span
            on the original page.
          </p>
          <p>
            The chat answers are streamed by a separate model. It only
            answers from the corpus, and inline citations are clickable
            links back to the source page.
          </p>
        </Section>

        <Section heading="DISCLAIMER">
          <p>
            Documents are collected from public, declassified, and
            citizen-submitted sources. Some are official; some are
            anecdotal. The cited page is always the truth of what the
            assistant said — read it for yourself.
          </p>
        </Section>

        <Section heading="STACK">
          <ul className="space-y-1.5">
            <li>NEXT.JS · TAILWIND · SHADCN/UI</li>
            <li>NEON POSTGRES + PGVECTOR (HNSW, HYBRID SEARCH)</li>
            <li>GEMINI 3.1 FLASH LITE — VISION OCR + TAGGING</li>
            <li>OPENAI EMBEDDINGS (1536-DIM)</li>
            <li>DEEPSEEK V3.1 — RAG ANSWERS</li>
            <li>VERCEL BLOB — PAGE IMAGES</li>
          </ul>
        </Section>
      </div>

      <div className="px-6 lg:px-10 py-12 border-t hairline flex flex-col sm:flex-row gap-4 max-w-5xl">
        <Link
          href="/archive"
          className="inline-flex items-center gap-2 border border-cyan text-cyan hover:bg-cyan hover:text-black transition-colors px-4 py-2 text-[10px] uppercase tracking-[0.18em]"
        >
          &gt; BROWSE THE ARCHIVE
        </Link>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 border hairline hover:border-foreground/50 transition-colors px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          QUERY THE CORPUS
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
      <h2 className="text-[10px] uppercase tracking-[0.18em] text-cyan">
        &gt; {heading}
      </h2>
      <div className="space-y-3 text-[12px] uppercase tracking-[0.06em] leading-[1.85] text-foreground/80 [&_p]:normal-case [&_p]:tracking-normal [&_p]:text-[13px] [&_li]:tracking-[0.12em]">
        {children}
      </div>
    </section>
  );
}
