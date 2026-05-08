/**
 * One-shot migration: copy every Vercel Blob page image to Cloudflare R2 and
 * rewrite pages.image_url + pages.thumb_url + documents.cover_image_url.
 *
 * Idempotent — re-running only re-uploads rows whose URL still points at
 * Vercel Blob. Safe to interrupt; resume by running again.
 *
 * Usage:
 *   pnpm tsx scripts/migrate-blob-to-r2.ts [--dry-run] [--concurrency=8]
 */
import "../lib/env-cli";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

type Args = { dryRun: boolean; concurrency: number };

function parseArgs(argv: string[]): Args {
  const flags: Record<string, string> = {};
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, v = "true"] = a.slice(2).split("=");
      flags[k] = v;
    }
  }
  return {
    dryRun: flags["dry-run"] === "true",
    concurrency: Number(flags.concurrency ?? 8),
  };
}

async function main() {
  const required = [
    "DATABASE_URL",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
    "R2_PUBLIC_BASE_URL",
  ];
  for (const r of required) {
    if (!process.env[r]) {
      console.error(`${r} is not set in .env.local`);
      process.exit(1);
    }
  }

  const args = parseArgs(process.argv.slice(2));
  console.log(
    `→ migrate Blob → R2 (dryRun=${args.dryRun}, concurrency=${args.concurrency})`,
  );

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  );

  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  const bucket = process.env.R2_BUCKET!;
  const publicBase = process.env.R2_PUBLIC_BASE_URL!.replace(/\/$/, "");

  const rows = (await sql`
    SELECT id, document_id, page, image_url, thumb_url
    FROM pages
    WHERE (image_url LIKE '%vercel-storage.com%' OR thumb_url LIKE '%vercel-storage.com%')
    ORDER BY document_id, page
  `) as Array<{
    id: string;
    document_id: string;
    page: number;
    image_url: string | null;
    thumb_url: string | null;
  }>;

  console.log(`  ${rows.length} pages with Blob URLs to migrate`);
  if (rows.length === 0) {
    console.log("  nothing to do.");
    return;
  }

  let done = 0;
  let failed = 0;
  let skipped = 0;
  const queue = [...rows];

  async function worker(workerId: number) {
    while (queue.length > 0) {
      const row = queue.shift();
      if (!row) return;
      try {
        const fullUrl = await uploadIfBlob(row.image_url, {
          docId: row.document_id,
          page: row.page,
          variant: "page",
        });
        const thumbUrl = await uploadIfBlob(row.thumb_url, {
          docId: row.document_id,
          page: row.page,
          variant: "thumb",
        });

        if (!args.dryRun) {
          await sql`
            UPDATE pages
            SET image_url = ${fullUrl ?? row.image_url},
                thumb_url = ${thumbUrl ?? row.thumb_url}
            WHERE id = ${row.id}
          `;
          // Also fix cover_image_url on the document if this was its cover.
          if (row.page === 1 && thumbUrl) {
            await sql`
              UPDATE documents
              SET cover_image_url = ${thumbUrl}
              WHERE id = ${row.document_id} AND cover_image_url LIKE '%vercel-storage.com%'
            `;
          }
        }
        done++;
        if (done % 25 === 0) {
          console.log(`  [w${workerId}] migrated ${done} so far…`);
        }
      } catch (e) {
        failed++;
        console.error(
          `  [w${workerId}] ✗ doc=${row.document_id} p${row.page}: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      }
    }

    async function uploadIfBlob(
      url: string | null,
      meta: { docId: string; page: number; variant: "page" | "thumb" },
    ): Promise<string | null> {
      if (!url) return null;
      if (!url.includes("vercel-storage.com")) {
        skipped++;
        return null;
      }
      const filename = `${meta.variant === "thumb" ? "thumb" : "page"}-${String(meta.page).padStart(4, "0")}.png`;
      const key = `pdfs/${meta.docId}/${filename}`;

      if (args.dryRun) {
        return `${publicBase}/${key}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`fetch ${url} → ${res.status}`);
      }
      const ab = await res.arrayBuffer();
      await r2.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: new Uint8Array(ab),
          ContentType: "image/png",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      return `${publicBase}/${key}`;
    }
  }

  const workers = Array.from({ length: args.concurrency }, (_, i) =>
    worker(i + 1),
  );
  await Promise.all(workers);

  console.log(
    `\nFinished — migrated ${done}, failed ${failed}, skipped ${skipped}.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
