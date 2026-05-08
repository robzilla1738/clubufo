import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// When VERCEL_OIDC_TOKEN is present locally (it gets pulled by `vercel env pull`),
// the Neon driver routes each process to its own ephemeral branch — local dev
// would see writes vanish across page loads. Strip it so we always authenticate
// via the URL credentials. On Vercel itself, this module isn't shipped with
// VERCEL_OIDC_TOKEN in the runtime env (the platform provides it dynamically),
// so this is a no-op in production.
if (process.env.VERCEL !== "1" && process.env.VERCEL_OIDC_TOKEN) {
  delete process.env.VERCEL_OIDC_TOKEN;
}

const url = process.env.DATABASE_URL;
if (!url) {
  // Don't throw at import time during `next build` — only when actually used.
  if (process.env.NODE_ENV === "production") {
    console.warn("[db] DATABASE_URL is not set");
  }
}

const sql = neon(url ?? "postgres://user:pass@localhost/placeholder");

export const db = drizzle(sql, { schema });
export { schema };
