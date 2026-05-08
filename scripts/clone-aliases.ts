/**
 * Walk a source directory and, for every file whose SHA matches an existing
 * document but whose filename does NOT, create an alias document row. The
 * alias copies all metadata + page rows + chunk rows + claim rows from the
 * canonical document so it shows up as its own entry in the archive.
 *
 * Used to make the archive's document count match war.gov's 161-file claim,
 * because the released bundle includes the same byte-identical content under
 * 4 distinct filenames.
 *
 * Idempotent: re-running just skips filenames that already exist.
 *
 * Usage:
 *   pnpm tsx scripts/clone-aliases.ts <source-dir> [--dry-run]
 */
import "../lib/env-cli";

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { createHash } from "node:crypto";

type Args = { dir: string; dryRun: boolean };

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, v = "true"] = a.slice(2).split("=");
      flags[k] = v;
    } else positional.push(a);
  }
  if (!positional[0]) {
    console.error("Usage: pnpm tsx scripts/clone-aliases.ts <source-dir> [--dry-run]");
    process.exit(1);
  }
  return { dir: positional[0], dryRun: flags["dry-run"] === "true" };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const stat = statSync(args.dir);
  if (!stat.isDirectory()) {
    console.error(`${args.dir} is not a directory`);
    process.exit(1);
  }

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  );

  const allFiles = readdirSync(args.dir)
    .filter((f) => /\.(pdf|png|jpe?g|mp4)$/i.test(f))
    .sort();

  console.log(`scanning ${allFiles.length} files in ${args.dir}…`);

  let cloned = 0;
  let skipped = 0;
  let unmatched = 0;

  for (const filename of allFiles) {
    const path = join(args.dir, filename);
    const buf = readFileSync(path);
    const sha = createHash("sha256").update(buf).digest("hex");

    // Already present under this filename?
    const exact = await sql`
      SELECT id FROM documents WHERE filename = ${filename} LIMIT 1
    `;
    if (exact.length > 0) {
      skipped++;
      continue;
    }

    // Same content under a different filename?
    const canonical = await sql`
      SELECT id FROM documents WHERE sha256 = ${sha} LIMIT 1
    `;
    if (canonical.length === 0) {
      // Not a duplicate; the regular ingest pipeline should pick this up.
      unmatched++;
      continue;
    }
    const canonicalId = (canonical[0] as { id: string }).id;

    if (args.dryRun) {
      console.log(`  would clone: ${filename}  (canonical=${canonicalId})`);
      cloned++;
      continue;
    }

    // 1. Clone the documents row, preserving everything except id + filename.
    const newId = await sql`
      INSERT INTO documents (
        title, filename, sha256, media_kind, duration_sec, file_url,
        cover_image_url, page_count, file_size, summary, kicker, agency,
        document_type, incident_date, incident_location, tags, status,
        pages_processed, pages_failed, processed_at
      )
      SELECT
        title, ${filename}, sha256, media_kind, duration_sec, file_url,
        cover_image_url, page_count, file_size, summary, kicker, agency,
        document_type, incident_date, incident_location, tags, status,
        pages_processed, pages_failed, processed_at
      FROM documents WHERE id = ${canonicalId}::uuid
      RETURNING id
    `;
    const aliasId = (newId[0] as { id: string }).id;

    // 2. Clone every page row (image_url + thumb_url already public, just reuse).
    //    We need to keep a mapping from old page_id → new page_id for chunks/claims.
    const oldPages = await sql`
      SELECT id, page, image_url, thumb_url, raw_text, cleaned_text,
             page_summary, document_type, classification, inferred_date,
             redactions, entities, raw_extraction, status, error, extracted_at
      FROM pages WHERE document_id = ${canonicalId}::uuid
      ORDER BY page
    `;
    const pageMap = new Map<string, string>();
    for (const p of oldPages as Array<Record<string, unknown>>) {
      const inserted = await sql`
        INSERT INTO pages (
          document_id, page, image_url, thumb_url, raw_text, cleaned_text,
          page_summary, document_type, classification, inferred_date,
          redactions, entities, raw_extraction, status, error, extracted_at
        ) VALUES (
          ${aliasId}::uuid, ${p.page}, ${p.image_url}, ${p.thumb_url},
          ${p.raw_text}, ${p.cleaned_text}, ${p.page_summary}, ${p.document_type},
          ${p.classification}, ${p.inferred_date}, ${p.redactions},
          ${JSON.stringify(p.entities)}::jsonb,
          ${JSON.stringify(p.raw_extraction)}::jsonb,
          ${p.status}, ${p.error}, ${p.extracted_at}
        )
        RETURNING id
      `;
      pageMap.set(p.id as string, (inserted[0] as { id: string }).id);
    }

    // 3. Clone chunks + 4. claims, page-by-page (cleaner than CASE-WHEN in SQL).
    for (const [oldPageId, newPageId] of pageMap.entries()) {
      await sql`
        INSERT INTO chunks (document_id, page_id, page, chunk_index, content, token_count, embedding)
        SELECT ${aliasId}::uuid, ${newPageId}::uuid, page, chunk_index, content, token_count, embedding
        FROM chunks WHERE page_id = ${oldPageId}::uuid
      `;
      await sql`
        INSERT INTO claims (page_id, document_id, text, char_start, char_end, kind, embedding)
        SELECT ${newPageId}::uuid, ${aliasId}::uuid, text, char_start, char_end, kind, embedding
        FROM claims WHERE page_id = ${oldPageId}::uuid
      `;
    }

    cloned++;
    console.log(`  ✓ cloned ${filename}  (${oldPages.length} pages copied)`);
  }

  console.log(
    `\nDone. cloned=${cloned}  already-present=${skipped}  not-a-duplicate=${unmatched}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
