import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

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
