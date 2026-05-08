/**
 * Standalone image ingest. Treats each image (PNG/JPG) as a 1-page document
 * with media_kind='image'. Skips pdftoppm rendering and feeds the original
 * pixels directly to Gemini.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { storePageImage } from "./storage";
import { extractPageFromImage, describeImageFreeform } from "@/lib/ai/extract";
import { generateDocumentMetadata } from "@/lib/ai/tag";
import { embedBatch } from "@/lib/ai/embed";

export type ImageIngestResult = {
  documentId: string;
  status: "ready" | "failed" | "already";
  durationMs: number;
};

export async function ingestImageFile(opts: {
  imagePath: string;
  filename?: string;
  tags?: string[];
  log?: (msg: string) => void;
}): Promise<ImageIngestResult> {
  const t0 = Date.now();
  const log = opts.log ?? (() => {});
  const filename = opts.filename ?? basename(opts.imagePath);
  const buffer = await readFile(opts.imagePath);
  const sha256 = createHash("sha256").update(buffer).digest("hex");

  const existing = await db
    .select({ id: schema.documents.id, status: schema.documents.status })
    .from(schema.documents)
    .where(eq(schema.documents.sha256, sha256))
    .limit(1);
  if (existing[0] && existing[0].status === "ready") {
    log(`already ingested → ${existing[0].id}`);
    return { documentId: existing[0].id, status: "already", durationMs: Date.now() - t0 };
  }

  // Normalize to PNG and produce a thumb.
  const fullPng = await sharp(buffer).png({ compressionLevel: 9 }).toBuffer();
  const thumbPng = await sharp(buffer)
    .resize({ width: 360, height: 360, fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const title = deriveTitle(filename);
  const ext = extname(filename).toLowerCase().slice(1);
  log(`${filename}: image (${ext}), sha=${sha256.slice(0, 8)}`);

  // Insert document row.
  const [doc] = existing[0]
    ? await db
        .update(schema.documents)
        .set({
          status: "extracting",
          mediaKind: "image",
          fileSize: buffer.byteLength,
          pageCount: 1,
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
          mediaKind: "image",
          fileSize: buffer.byteLength,
          pageCount: 1,
          tags: opts.tags ?? [],
          status: "extracting",
        })
        .returning();

  // Drop any prior pages so we re-insert cleanly.
  await db.delete(schema.pages).where(eq(schema.pages.documentId, doc.id));

  try {
    // Upload the full + thumb to R2/Blob.
    const [full, thumb] = await Promise.all([
      storePageImage({ documentId: doc.id, page: 1, variant: "full", buffer: fullPng }),
      storePageImage({ documentId: doc.id, page: 1, variant: "thumb", buffer: thumbPng }),
    ]);

    // Vision extraction. Try the strict structured pipeline first; if Gemini
    // refuses (common for pure photographs with little text), fall back to a
    // freeform description and shape it like a normal extraction.
    let extraction;
    try {
      extraction = await extractPageFromImage({
        imagePng: fullPng,
        pageNumber: 1,
        documentTitle: title,
        totalPages: 1,
      });
    } catch (err) {
      log(`  ⚠ structured extract failed, using freeform: ${err instanceof Error ? err.message : String(err)}`);
      extraction = await describeImageFreeform({
        imagePng: fullPng,
        documentTitle: title,
      });
    }

    const inferredDate = normalizeDate(extraction.inferredDate);

    const [pageRow] = await db
      .insert(schema.pages)
      .values({
        documentId: doc.id,
        page: 1,
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

    // Claims (often few/none for photos, but include if present).
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
    }

    // Document-level metadata.
    let metadataUpdate: Partial<typeof schema.documents.$inferInsert> = {};
    try {
      const meta = await generateDocumentMetadata({
        filename,
        fallbackTitle: title,
        pageSummaries: [{ page: 1, summary: extraction.pageSummary }],
        sampleTexts: extraction.cleanedText ? [extraction.cleanedText] : [],
      });
      metadataUpdate = {
        kicker: meta.kicker,
        agency: nullIfEmpty(meta.agency),
        documentType: meta.documentType,
        incidentDate: normalizeDate(meta.incidentDate),
        incidentLocation: nullIfEmpty(meta.incidentLocation),
        summary: meta.summary,
        tags: [...new Set([...(opts.tags ?? []), ...meta.tags])],
      };
      log(`  ◇ ${meta.kicker} [${meta.tags.slice(0, 4).join(", ")}]`);
    } catch (err) {
      log(`  ⚠ metadata pass failed: ${err instanceof Error ? err.message : String(err)}`);
      metadataUpdate = { summary: extraction.pageSummary };
    }

    await db
      .update(schema.documents)
      .set({
        status: "ready",
        pagesProcessed: 1,
        pagesFailed: 0,
        coverImageUrl: thumb.url,
        processedAt: new Date(),
        error: null,
        ...metadataUpdate,
      })
      .where(eq(schema.documents.id, doc.id));

    return { documentId: doc.id, status: "ready", durationMs: Date.now() - t0 };
  } catch (err) {
    await db
      .update(schema.documents)
      .set({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      })
      .where(eq(schema.documents.id, doc.id));
    throw err;
  }
}

function deriveTitle(filename: string): string {
  return filename
    .replace(/\.(png|jpe?g)$/i, "")
    .replace(/^\d{3}_/, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function normalizeDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^(unknown|n\/a|none|null|undated)$/i.test(trimmed)) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
}

function nullIfEmpty(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^(unknown|unknown\s+location|n\/a|none|null|undated|undisclosed)$/i.test(trimmed))
    return null;
  return trimmed.length === 0 ? null : trimmed;
}
