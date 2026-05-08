/**
 * Local CLI env bootstrap.
 *
 * Loads .env.local and then unsets VERCEL_OIDC_TOKEN — when present, the
 * Neon serverless driver routes each process to its own ephemeral branch,
 * which makes write-then-read across processes look like data loss.
 * The OIDC token is only relevant for runtime requests on Vercel itself.
 *
 * Import this BEFORE any module that touches @neondatabase/serverless.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

if (process.env.VERCEL_OIDC_TOKEN) {
  delete process.env.VERCEL_OIDC_TOKEN;
}
