/**
 * Runs the hand-tuned SQL in drizzle/0000_setup.sql against the configured
 * Neon database. Use after `pnpm db:push` to enable pgvector + indexes.
 *
 * Usage:  pnpm db:setup
 */
import "../lib/env-cli";

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local first.");
  process.exit(1);
}
console.log(`Using endpoint: ${url.match(/@([^/]+)/)?.[1]} db=${url.match(/\/([^?]+)\?/)?.[1] ?? "?"}`);

const sql = neon(url);

async function main() {
  const dir = join(process.cwd(), "drizzle");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.warn("No SQL files in drizzle/. Skipping.");
    return;
  }

  for (const file of files) {
    const path = join(dir, file);
    const body = readFileSync(path, "utf-8");
    // Split on bare `;` boundaries that aren't inside dollar-quoted blocks.
    const stmts = splitSql(body);
    console.log(`\n→ ${file} (${stmts.length} statements)`);
    for (const stmt of stmts) {
      const head = stmt.slice(0, 80).replace(/\s+/g, " ");
      try {
        await sql.query(stmt);
        console.log(`  ✓ ${head}…`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // Tolerate the typical "already exists" / "duplicate object" cases —
        // these migrations are meant to be idempotent.
        if (
          /already exists|duplicate object|duplicate column|duplicate key/i.test(
            msg,
          )
        ) {
          console.log(`  • skip (exists): ${head}…`);
          continue;
        }
        console.error(`  ✗ ${head}…`);
        console.error(msg);
        throw e;
      }
    }
  }
  console.log("\nDone.");
}

function splitSql(src: string): string[] {
  const out: string[] = [];
  let buf = "";
  let inDollar = false;
  let dollarTag = "";
  const lines = src.split("\n");
  for (const raw of lines) {
    const line = raw.replace(/--.*$/, ""); // strip line comments
    let i = 0;
    while (i < line.length) {
      if (!inDollar) {
        const m = line.slice(i).match(/^\$([A-Za-z_]*)\$/);
        if (m) {
          inDollar = true;
          dollarTag = m[0];
          buf += dollarTag;
          i += dollarTag.length;
          continue;
        }
        const ch = line[i];
        buf += ch;
        if (ch === ";") {
          const s = buf.trim();
          if (s) out.push(s.replace(/;$/, ""));
          buf = "";
        }
        i += 1;
      } else {
        if (line.slice(i, i + dollarTag.length) === dollarTag) {
          buf += dollarTag;
          inDollar = false;
          i += dollarTag.length;
          continue;
        }
        buf += line[i];
        i += 1;
      }
    }
    buf += "\n";
  }
  const tail = buf.trim();
  if (tail) out.push(tail.replace(/;$/, ""));
  return out.filter((s) => s.trim().length > 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
