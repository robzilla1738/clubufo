import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { and, desc, eq, ilike, or, sql, asc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const tag = searchParams.get("tag") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 60), 200);
  const sort = searchParams.get("sort") ?? "recent";

  const conditions = [eq(schema.documents.status, "ready")];
  if (q) {
    conditions.push(
      or(
        ilike(schema.documents.title, `%${q}%`),
        ilike(schema.documents.summary, `%${q}%`),
        ilike(schema.documents.filename, `%${q}%`),
      )!,
    );
  }
  if (tag) {
    conditions.push(sql`${tag} = ANY(${schema.documents.tags})`);
  }

  const orderBy =
    sort === "title"
      ? asc(schema.documents.title)
      : sort === "pages"
        ? desc(schema.documents.pageCount)
        : desc(schema.documents.uploadedAt);

  const rows = await db
    .select({
      id: schema.documents.id,
      title: schema.documents.title,
      filename: schema.documents.filename,
      pageCount: schema.documents.pageCount,
      summary: schema.documents.summary,
      tags: schema.documents.tags,
      uploadedAt: schema.documents.uploadedAt,
    })
    .from(schema.documents)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit);

  return NextResponse.json({ documents: rows });
}
