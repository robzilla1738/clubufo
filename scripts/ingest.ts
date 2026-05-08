/**
 * Bulk ingest a directory of media into ChatUFO.
 * Auto-detects file kind by extension:
 *   - .pdf       → page-by-page Gemini OCR pipeline
 *   - .png/.jpg  → single-image vision extraction
 *   - .mp4       → ffmpeg frame sampling + Whisper audio transcript
 *
 * Usage:
 *   pnpm ingest <dir> [--doc-concurrency=2] [--page-concurrency=4]
 *                     [--limit=N] [--tag=foo,bar] [--kinds=pdf,image,video]
 */
import "../lib/env-cli";

import { readdirSync, statSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { ingestPdfFile } from "../lib/ingest/pipeline";
import { ingestImageFile } from "../lib/ingest/image";
import { ingestVideoFile } from "../lib/ingest/video";

type Kind = "pdf" | "image" | "video";

type Args = {
  dir: string;
  docConcurrency: number;
  pageConcurrency: number;
  limit?: number;
  tags: string[];
  kinds: Set<Kind>;
};

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, v = "true"] = a.slice(2).split("=");
      flags[k] = v;
    } else {
      positional.push(a);
    }
  }
  if (!positional[0]) {
    console.error(
      "Usage: pnpm ingest <dir> [--doc-concurrency=2] [--page-concurrency=4] [--limit=N] [--tag=tag1,tag2] [--kinds=pdf,image,video]",
    );
    process.exit(1);
  }
  const allKinds: Kind[] = ["pdf", "image", "video"];
  const kinds = flags.kinds
    ? new Set(flags.kinds.split(",").filter((k): k is Kind => (allKinds as string[]).includes(k)))
    : new Set<Kind>(allKinds);
  return {
    dir: positional[0],
    docConcurrency: Number(flags["doc-concurrency"] ?? 2),
    pageConcurrency: Number(flags["page-concurrency"] ?? 4),
    limit: flags.limit ? Number(flags.limit) : undefined,
    tags: (flags.tag ? flags.tag.split(",") : []).filter(Boolean),
    kinds,
  };
}

function detectKind(path: string): Kind | null {
  const ext = extname(path).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") return "image";
  if (ext === ".mp4") return "video";
  return null;
}

async function main() {
  const required = ["DATABASE_URL", "GOOGLE_GENERATIVE_AI_API_KEY", "OPENAI_API_KEY"];
  for (const r of required) {
    if (!process.env[r]) {
      console.error(`${r} is not set in .env.local`);
      process.exit(1);
    }
  }

  const args = parseArgs(process.argv.slice(2));
  const stat = statSync(args.dir);
  if (!stat.isDirectory()) {
    console.error(`${args.dir} is not a directory`);
    process.exit(1);
  }

  let files = readdirSync(args.dir)
    .map((f) => ({ path: join(args.dir, f), kind: detectKind(f) }))
    .filter((f): f is { path: string; kind: Kind } => f.kind !== null && args.kinds.has(f.kind))
    .sort((a, b) => a.path.localeCompare(b.path));
  if (args.limit) files = files.slice(0, args.limit);

  if (files.length === 0) {
    console.log("No matching files found.");
    return;
  }

  const counts = files.reduce<Record<Kind, number>>(
    (acc, f) => ((acc[f.kind] = (acc[f.kind] ?? 0) + 1), acc),
    { pdf: 0, image: 0, video: 0 },
  );
  console.log(
    `\n→ ${files.length} files in ${args.dir} (pdf=${counts.pdf}, image=${counts.image}, video=${counts.video}), doc-concurrency=${args.docConcurrency}, page-concurrency=${args.pageConcurrency}\n`,
  );

  const queue = [...files];
  let done = 0;
  let failed = 0;

  async function worker(workerId: number) {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      const filename = basename(item.path);
      const start = Date.now();
      const log = (m: string) => console.log(`[w${workerId}] ${m}`);
      try {
        if (item.kind === "pdf") {
          const summary = await ingestPdfFile({
            pdfPath: item.path,
            filename,
            tags: args.tags,
            pageConcurrency: args.pageConcurrency,
            log,
          });
          done++;
          console.log(
            `[w${workerId}] ✓ ${filename}: ${summary.pagesExtracted}/${summary.pageCount} pages, ${summary.chunkCount} chunks, ${summary.claimCount} claims (${((Date.now() - start) / 1000).toFixed(1)}s, status=${summary.status})\n`,
          );
        } else if (item.kind === "image") {
          const r = await ingestImageFile({
            imagePath: item.path,
            filename,
            tags: args.tags,
            log,
          });
          done++;
          console.log(
            `[w${workerId}] ✓ ${filename} [image]: ${((Date.now() - start) / 1000).toFixed(1)}s, status=${r.status}\n`,
          );
        } else if (item.kind === "video") {
          const r = await ingestVideoFile({
            videoPath: item.path,
            filename,
            tags: args.tags,
            log,
          });
          done++;
          console.log(
            `[w${workerId}] ✓ ${filename} [video]: ${r.durationSec.toFixed(1)}s clip, transcribed=${r.transcribed} (${((Date.now() - start) / 1000).toFixed(1)}s wall, status=${r.status})\n`,
          );
        }
      } catch (e) {
        failed++;
        console.error(
          `[w${workerId}] ✗ ${filename}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  const workers = Array.from({ length: args.docConcurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log(`\nDone — ingested ${done}, failed ${failed}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
