/**
 * Bulk ingest a directory of PDFs into ChatUFO.
 *
 * Usage:
 *   pnpm ingest <pdf-dir> [--doc-concurrency=2] [--page-concurrency=4]
 *                         [--limit=N] [--tag=foo,bar]
 */
import "../lib/env-cli";

import { readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { ingestPdfFile } from "../lib/ingest/pipeline";

type Args = {
  dir: string;
  docConcurrency: number;
  pageConcurrency: number;
  limit?: number;
  tags: string[];
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
      "Usage: pnpm ingest <pdf-dir> [--doc-concurrency=2] [--page-concurrency=4] [--limit=N] [--tag=tag1,tag2]",
    );
    process.exit(1);
  }
  return {
    dir: positional[0],
    docConcurrency: Number(flags["doc-concurrency"] ?? 2),
    pageConcurrency: Number(flags["page-concurrency"] ?? 4),
    limit: flags.limit ? Number(flags.limit) : undefined,
    tags: (flags.tag ? flags.tag.split(",") : []).filter(Boolean),
  };
}

async function main() {
  const required = ["DATABASE_URL", "OPENROUTER_API_KEY", "OPENAI_API_KEY"];
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
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .map((f) => join(args.dir, f))
    .sort();
  if (args.limit) files = files.slice(0, args.limit);

  if (files.length === 0) {
    console.log("No PDFs found.");
    return;
  }

  console.log(
    `\n→ ${files.length} PDFs in ${args.dir}, doc-concurrency=${args.docConcurrency}, page-concurrency=${args.pageConcurrency}\n`,
  );

  const queue = [...files];
  let done = 0;
  let failed = 0;
  let totalChunks = 0;
  let totalClaims = 0;

  async function worker(workerId: number) {
    while (queue.length > 0) {
      const path = queue.shift();
      if (!path) return;
      const filename = basename(path);
      const start = Date.now();
      try {
        const summary = await ingestPdfFile({
          pdfPath: path,
          filename,
          tags: args.tags,
          pageConcurrency: args.pageConcurrency,
          log: (m) => console.log(`[w${workerId}] ${m}`),
        });
        const ms = Date.now() - start;
        if (summary.status === "failed") {
          failed++;
          console.error(
            `[w${workerId}] ✗ ${filename}: 0 / ${summary.pageCount} pages (${ms}ms)`,
          );
        } else {
          done++;
          totalChunks += summary.chunkCount;
          totalClaims += summary.claimCount;
          console.log(
            `[w${workerId}] ✓ ${filename}: ${summary.pagesExtracted}/${summary.pageCount} pages, ${summary.chunkCount} chunks, ${summary.claimCount} claims (${(ms / 1000).toFixed(1)}s, status=${summary.status})\n`,
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

  const workers = Array.from({ length: args.docConcurrency }, (_, i) =>
    worker(i + 1),
  );
  await Promise.all(workers);

  console.log(
    `\nDone — ingested ${done}, failed ${failed}, total chunks ${totalChunks}, total claims ${totalClaims}.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
