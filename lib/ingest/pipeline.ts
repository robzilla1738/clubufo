import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { eq, and, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { renderPdfPages, pdfPageCount } from "./render";
import { storePageImage } from "./storage";
import { extractPageFromImage, type ExtractedPage } from "@/lib/ai/extract";
import { chunkPages } from "./chunk";
import { embedBatch } from "@/lib/ai/embed";

type Logger = (msg: string) => void;

export type IngestSummary = {
  documentId: string;
  pageCount: number;
  pagesExtracted: number;
  pagesFailed: number;
  chunkCount: number;
  claimCount: number;
  status: "ready" | "partial" | "failed";
  durationMs: number;
};

export type IngestOptions = {
  pdfPath: string;
  filename?: string;
  fileUrl?: string | null;
  tags?: string[];
  /** Number of pages extracted in parallel. */
  pageConcurrency?: number;
  log?: Logger;
};

export async function ingestPdfFile(opts: IngestOptions): Promise<IngestSummary> {
  const t0 = Date.now();
  const filename = opts.filename ?? basename(opts.pdfPath);
  const log = opts.log ?? (() => {});
  const pageConcurrency = opts.pageConcurrency ?? 4;

  const buffer = await readFile(opts.pdfPath);
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const fileSize = buffer.byteLength;

  // Idempotency.
  const existing = await db
    .select({ id: schema.documents.id, status: schema.documents.status })
    .from(schema.documents)
    .where(eq(schema.documents.sha256, sha256))
    .limit(1);
  if (existing[0] && existing[0].status === "ready") {
    log(`already ingested → ${existing[0].id}`);
    return {
      documentId: existing[0].id,
      pageCount: 0,
      pagesExtracted: 0,
      pagesFailed: 0,
      chunkCount: 0,
      claimCount: 0,
      status: "ready",
      durationMs: Date.now() - t0,
    };
  }

  const totalPages = await pdfPageCount(opts.pdfPath);
  log(`${filename} — ${totalPages} pages, sha=${sha256.slice(0, 8)}`);

  const title = deriveTitle(filename);

  const [doc] = existing[0]
    ? await db
        .update(schema.documents)
        .set({
          status: "rendering",
          pageCount: totalPages,
          fileSize,
          fileUrl: opts.fileUrl ?? null,
          error: null,
          pagesProcessed: 0,
          pagesFailed: 0,
        })
        .where(eq(schema.documents.id, existing[0].id))
        .returning()
    : await db
        .insert(schema.documents)
        .values({
          title,
          filename,
          sha256,
          fileUrl: opts.fileUrl ?? null,
          fileSize,
          pageCount: totalPages,
          tags: opts.tags ?? [],
          status: "rendering",
        })
        .returning();

  // Wipe any prior pages (cascades chunks + claims) for re-runs.
  await db.delete(schema.pages).where(eq(schema.pages.documentId, doc.id));

  let pagesExtracted = 0;
  let pagesFailed = 0;
  let chunkCount = 0;
  let claimCount = 0;
  let coverImageUrl: string | null = null;
  const pageSummaries: Array<{ page: number; summary: string }> = [];

  // Bounded-concurrency worker pulling from a streaming render queue.
  const renderQueue: Array<{
    page: number;
    png: Buffer;
    thumb: Buffer;
  }> = [];
  let renderDone = false;
  const renderError: { err?: unknown } = {};

  // Producer
  (async () => {
    try {
      for await (const p of renderPdfPages(opts.pdfPath, { dpi: 200 })) {
        renderQueue.push(p);
      }
    } catch (err) {
      renderError.err = err;
    } finally {
      renderDone = true;
    }
  })();

  await db
    .update(schema.documents)
    .set({ status: "extracting" })
    .where(eq(schema.documents.id, doc.id));

  await Promise.all(
    Array.from({ length: pageConcurrency }, () =>
      worker(),
    ),
  );

  if (renderError.err) throw renderError.err;

  async function worker() {
    while (true) {
      const item = renderQueue.shift();
      if (!item) {
        if (renderDone) return;
        await new Promise((r) => setTimeout(r, 30));
        continue;
      }
      try {
        await processPage(item);
      } catch (err) {
        pagesFailed++;
        log(
          `  ✗ p${item.page}: ${err instanceof Error ? err.message : String(err)}`,
        );
        await db
          .insert(schema.pages)
          .values({
            documentId: doc.id,
            page: item.page,
            status: "failed",
            error: err instanceof Error ? err.message : String(err),
          })
          .onConflictDoNothing();
      }
    }
  }

  async function processPage(item: {
    page: number;
    png: Buffer;
    thumb: Buffer;
  }) {
    // 1. Upload images.
    const [full, thumb] = await Promise.all([
      storePageImage({
        documentId: doc.id,
        page: item.page,
        variant: "full",
        buffer: item.png,
      }),
      storePageImage({
        documentId: doc.id,
        page: item.page,
        variant: "thumb",
        buffer: item.thumb,
      }),
    ]);
    if (item.page === 1) coverImageUrl = thumb.url;

    // 2. Gemini extraction.
    const extraction: ExtractedPage = await extractPageFromImage({
      imagePng: item.png,
      pageNumber: item.page,
      documentTitle: title,
      totalPages,
    });

    const inferredDate = normalizeDate(extraction.inferredDate);

    // 3. Insert page row.
    const [pageRow] = await db
      .insert(schema.pages)
      .values({
        documentId: doc.id,
        page: item.page,
        imageUrl: full.url,
        thumbUrl: thumb.url,
        cleanedText: extraction.cleanedText,
        pageSummary: extraction.pageSummary,
        documentType: extraction.documentType,
        classification: extraction.classification,
        inferredDate,
        redactions: extraction.redactionsPresent,
        entities: extraction.entities,
        rawExtraction: extraction.raw as object,
        status: "extracted",
        extractedAt: new Date(),
      })
      .returning();

    // 4. Chunk + embed page text. Skip if no real content.
    if (extraction.cleanedText.trim().length >= 60) {
      const chunked = chunkPages([
        { page: item.page, text: extraction.cleanedText },
      ]);
      if (chunked.length > 0) {
        const embeddings = await embedBatch(chunked.map((c) => c.content));
        await db.insert(schema.chunks).values(
          chunked.map((c, i) => ({
            documentId: doc.id,
            pageId: pageRow.id,
            page: item.page,
            chunkIndex: c.index,
            content: c.content,
            tokenCount: Math.round(c.content.length / 4),
            embedding: embeddings[i],
          })),
        );
        chunkCount += chunked.length;
      }
    }

    // 5. Claims (verbatim sentences).
    const validClaims = extraction.claims.filter(
      (c) => c.charStart !== null && c.charEnd !== null && c.text.length >= 10,
    );
    if (validClaims.length > 0) {
      const claimEmbeddings = await embedBatch(validClaims.map((c) => c.text));
      await db.insert(schema.claims).values(
        validClaims.map((c, i) => ({
          pageId: pageRow.id,
          documentId: doc.id,
          text: c.text,
          charStart: c.charStart!,
          charEnd: c.charEnd!,
          kind: c.kind,
          embedding: claimEmbeddings[i],
        })),
      );
      claimCount += validClaims.length;
    }

    pagesExtracted++;
    pageSummaries.push({
      page: item.page,
      summary: extraction.pageSummary,
    });
    await db
      .update(schema.documents)
      .set({ pagesProcessed: pagesExtracted, pagesFailed })
      .where(eq(schema.documents.id, doc.id));
    log(
      `  ✓ p${item.page} — ${extraction.documentType}, ${extraction.classification}, ${extraction.claims.length} claims`,
    );
  }

  // Final status.
  const successRatio = totalPages > 0 ? pagesExtracted / totalPages : 0;
  const status: IngestSummary["status"] =
    pagesExtracted === 0
      ? "failed"
      : successRatio >= 0.8
        ? "ready"
        : "partial";

  // Document-level summary from the page summaries (cheap one-shot LLM).
  let docSummary: string | null = null;
  if (pageSummaries.length > 0) {
    const joined = pageSummaries
      .sort((a, b) => a.page - b.page)
      .slice(0, 60) // cap for prompt size
      .map((p) => `p.${p.page}: ${p.summary}`)
      .join("\n");
    docSummary = joined.slice(0, 1200); // keep simple — first ~60 page summaries truncated
  }

  await db
    .update(schema.documents)
    .set({
      status,
      pagesProcessed: pagesExtracted,
      pagesFailed,
      summary: docSummary,
      coverImageUrl,
      processedAt: new Date(),
      error: status === "failed" ? "All pages failed extraction" : null,
    })
    .where(eq(schema.documents.id, doc.id));

  return {
    documentId: doc.id,
    pageCount: totalPages,
    pagesExtracted,
    pagesFailed,
    chunkCount,
    claimCount,
    status,
    durationMs: Date.now() - t0,
  };
}

function deriveTitle(filename: string): string {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/^\d{3}_/, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function normalizeDate(input: string | null): string | null {
  if (!input) return null;
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const parsed = Date.parse(input);
  if (Number.isNaN(parsed)) return null;
  const d = new Date(parsed);
  return d.toISOString().slice(0, 10);
}

/** Convenience for the admin upload route. */
export async function ingestPdfBuffer(opts: {
  buffer: Uint8Array;
  filename: string;
  title?: string;
  fileUrl?: string | null;
  fileSize?: number | null;
  tags?: string[];
}): Promise<IngestSummary> {
  // Write to temp file so render pipeline can pdftoppm it.
  const { writeFile, mkdtemp } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = await mkdtemp(join(tmpdir(), "ufo-upload-"));
  const path = join(dir, opts.filename);
  await writeFile(path, opts.buffer);
  return ingestPdfFile({
    pdfPath: path,
    filename: opts.filename,
    fileUrl: opts.fileUrl ?? null,
    tags: opts.tags,
  });
}
