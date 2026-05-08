import type { MetadataRoute } from "next";
import { db, schema } from "@/lib/db/client";
import { inArray, desc } from "drizzle-orm";

const SITE = "https://chatufo.space";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/chat`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/archive`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.4 },
  ];

  let docs: MetadataRoute.Sitemap = [];
  try {
    const rows = await db
      .select({
        id: schema.documents.id,
        processedAt: schema.documents.processedAt,
        uploadedAt: schema.documents.uploadedAt,
      })
      .from(schema.documents)
      .where(inArray(schema.documents.status, ["ready", "partial"]))
      .orderBy(desc(schema.documents.uploadedAt))
      .limit(1000);
    docs = rows.map((r) => ({
      url: `${SITE}/archive/${r.id}`,
      lastModified: r.processedAt ?? r.uploadedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));
  } catch {
    // Allow build to succeed even if DB is unreachable.
  }

  return [...staticRoutes, ...docs];
}
