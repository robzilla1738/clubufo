/**
 * Video ingest. Lightweight by design:
 *   1. SHA dedup
 *   2. Upload original MP4 to R2 (so the site can <video> it)
 *   3. ffmpeg → single thumbnail frame for the cover
 *   4. ffmpeg → audio → Whisper transcript with timestamps (skipped silently
 *      if the clip has no audio track or Whisper refuses)
 *   5. One "page" containing the timestamped transcript text (or a short
 *      placeholder if there was no audio). The chat can cite the page;
 *      clicking the citation opens the document detail with the inline
 *      <video> player and transcript alongside.
 *   6. Document-level metadata pass (kicker, agency, type, tags) over the
 *      transcript and filename.
 */
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFile, mkdir, rm } from "node:fs/promises";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";
import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { storePageImage, storeAsset } from "./storage";
import { generateDocumentMetadata } from "@/lib/ai/tag";
import { embedBatch } from "@/lib/ai/embed";

export type VideoIngestResult = {
  documentId: string;
  status: "ready" | "partial" | "failed" | "already";
  durationSec: number;
  durationMs: number;
  transcribed: boolean;
};

export async function ingestVideoFile(opts: {
  videoPath: string;
  filename?: string;
  tags?: string[];
  log?: (msg: string) => void;
}): Promise<VideoIngestResult> {
  const t0 = Date.now();
  const log = opts.log ?? (() => {});
  const filename = opts.filename ?? basename(opts.videoPath);
  const buffer = await readFile(opts.videoPath);
  const sha256 = createHash("sha256").update(buffer).digest("hex");

  const existing = await db
    .select({ id: schema.documents.id, status: schema.documents.status })
    .from(schema.documents)
    .where(eq(schema.documents.sha256, sha256))
    .limit(1);
  if (existing[0] && existing[0].status === "ready") {
    log(`already ingested → ${existing[0].id}`);
    return {
      documentId: existing[0].id,
      status: "already",
      durationSec: 0,
      durationMs: Date.now() - t0,
      transcribed: false,
    };
  }

  const durationSec = await ffprobeDuration(opts.videoPath);
  log(`${filename}: video, ${durationSec.toFixed(1)}s, sha=${sha256.slice(0, 8)}`);
  const title = deriveTitle(filename);

  const [doc] = existing[0]
    ? await db
        .update(schema.documents)
        .set({
          status: "extracting",
          mediaKind: "video",
          fileSize: buffer.byteLength,
          durationSec: Math.round(durationSec),
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
          mediaKind: "video",
          fileSize: buffer.byteLength,
          durationSec: Math.round(durationSec),
          pageCount: 1,
          tags: opts.tags ?? [],
          status: "extracting",
        })
        .returning();

  await db.delete(schema.pages).where(eq(schema.pages.documentId, doc.id));

  const workDir = join(tmpdir(), `ufo-video-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  try {
    // 1. Upload original video so the site can play it.
    log(`  uploading source video…`);
    const videoAsset = await storeAsset({
      key: `videos/${doc.id}/source.mp4`,
      buffer,
      contentType: "video/mp4",
    });
    log(`  source: ${videoAsset.url}`);

    // 2. Single thumbnail frame at the midpoint (or 1s, whichever is sooner).
    const thumbTime = Math.min(1, durationSec * 0.5);
    const thumbJpgPath = join(workDir, "thumb.jpg");
    await runFfmpeg([
      "-y",
      "-ss", String(thumbTime),
      "-i", opts.videoPath,
      "-frames:v", "1",
      "-q:v", "2",
      thumbJpgPath,
    ]);
    const thumbJpg = await readFile(thumbJpgPath);
    const thumbPng = await sharp(thumbJpg)
      .resize({ width: 720, height: 720, fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const thumbSmall = await sharp(thumbJpg)
      .resize({ width: 360, height: 360, fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const [pageThumbFull, pageThumbSmall] = await Promise.all([
      storePageImage({ documentId: doc.id, page: 1, variant: "full", buffer: thumbPng }),
      storePageImage({ documentId: doc.id, page: 1, variant: "thumb", buffer: thumbSmall }),
    ]);

    // 3. Try transcription. Tolerate failure (no audio track, Whisper refusal).
    let transcript = "";
    let transcribed = false;
    try {
      const audioPath = join(workDir, "audio.mp3");
      await runFfmpeg([
        "-y",
        "-i", opts.videoPath,
        "-vn",
        "-acodec", "libmp3lame",
        "-ab", "64k",
        audioPath,
      ]);
      const r = await transcribeAudio(audioPath);
      if (r.text.trim()) {
        transcript = formatTranscript(r);
        transcribed = true;
        log(`  whisper: ${r.segments.length} segments, ${r.text.length} chars`);
      } else {
        log(`  no audio content`);
      }
    } catch (err) {
      log(`  no audio / whisper skipped: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 4. The single page row holds the transcript (or a placeholder).
    const pageBody = transcript || `[VIDEO CLIP — ${formatDuration(durationSec)}, no audio track or transcription unavailable]`;
    const pageSummary = transcribed
      ? `Transcript of a ${formatDuration(durationSec)} video clip.`
      : `Silent video clip, ${formatDuration(durationSec)}.`;

    const [pageRow] = await db
      .insert(schema.pages)
      .values({
        documentId: doc.id,
        page: 1,
        imageUrl: pageThumbFull.url,
        thumbUrl: pageThumbSmall.url,
        cleanedText: pageBody,
        pageSummary,
        documentType: "video",
        classification: "UNKNOWN",
        inferredDate: null,
        redactions: false,
        entities: [],
        rawExtraction: { transcribed, durationSec, videoUrl: videoAsset.url },
        status: "extracted",
        extractedAt: new Date(),
      })
      .returning();

    // 5. Embed transcript as a single chunk so chat can find it.
    if (pageBody.length >= 60) {
      const [embedding] = await embedBatch([pageBody]);
      await db.insert(schema.chunks).values({
        documentId: doc.id,
        pageId: pageRow.id,
        page: 1,
        chunkIndex: 0,
        content: pageBody,
        tokenCount: Math.round(pageBody.length / 4),
        embedding,
      });
    }

    // 6. Doc metadata pass.
    let metadataUpdate: Partial<typeof schema.documents.$inferInsert> = {};
    try {
      const meta = await generateDocumentMetadata({
        filename,
        fallbackTitle: title,
        pageSummaries: [{ page: 1, summary: pageSummary }],
        sampleTexts: transcript ? [transcript.slice(0, 1500)] : [],
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
      log(`  ◇ ${meta.kicker}`);
    } catch (err) {
      log(`  ⚠ metadata pass failed: ${err instanceof Error ? err.message : String(err)}`);
      metadataUpdate = { summary: pageSummary };
    }

    await db
      .update(schema.documents)
      .set({
        status: "ready",
        pagesProcessed: 1,
        pagesFailed: 0,
        coverImageUrl: pageThumbSmall.url,
        fileUrl: videoAsset.url,
        processedAt: new Date(),
        error: null,
        ...metadataUpdate,
      })
      .where(eq(schema.documents.id, doc.id));

    return {
      documentId: doc.id,
      status: "ready",
      durationSec,
      durationMs: Date.now() - t0,
      transcribed,
    };
  } catch (err) {
    await db
      .update(schema.documents)
      .set({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      })
      .where(eq(schema.documents.id, doc.id));
    throw err;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

type TranscriptSegment = { start: number; end: number; text: string };

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (_openai) return _openai;
  _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

async function transcribeAudio(
  audioPath: string,
): Promise<{ text: string; segments: TranscriptSegment[] }> {
  const file = await readFile(audioPath);
  const blob = new Blob([new Uint8Array(file)], { type: "audio/mpeg" });
  const fileForUpload = new File([blob], basename(audioPath), { type: "audio/mpeg" });
  const r = await getOpenAI().audio.transcriptions.create({
    file: fileForUpload,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });
  const segments: TranscriptSegment[] = ((r as unknown as { segments?: TranscriptSegment[] })
    .segments ?? []).map((s) => ({ start: s.start, end: s.end, text: s.text }));
  return { text: (r as unknown as { text: string }).text, segments };
}

function formatTranscript(r: { text: string; segments: TranscriptSegment[] }): string {
  if (r.segments.length === 0) return r.text.trim();
  return r.segments
    .map((s) => `[${formatTime(s.start)}] ${s.text.trim()}`)
    .filter(Boolean)
    .join("\n");
}

function formatTime(sec: number): string {
  const mm = Math.floor(sec / 60);
  const ss = Math.floor(sec % 60);
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec.toFixed(1)}s`;
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

function ffprobeDuration(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffprobe exited ${code}: ${stderr}`));
      resolve(parseFloat(stdout.trim()) || 0);
    });
  });
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-400)}`));
    });
  });
}

function deriveTitle(filename: string): string {
  return filename
    .replace(/\.mp4$/i, "")
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
