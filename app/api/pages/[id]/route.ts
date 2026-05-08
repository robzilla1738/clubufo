import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const [row] = await db
    .select({
      id: schema.pages.id,
      documentId: schema.pages.documentId,
      page: schema.pages.page,
      imageUrl: schema.pages.imageUrl,
      cleanedText: schema.pages.cleanedText,
      pageSummary: schema.pages.pageSummary,
      documentType: schema.pages.documentType,
      classification: schema.pages.classification,
      inferredDate: schema.pages.inferredDate,
      redactions: schema.pages.redactions,
      entities: schema.pages.entities,
      documentTitle: schema.documents.title,
    })
    .from(schema.pages)
    .leftJoin(schema.documents, eq(schema.pages.documentId, schema.documents.id))
    .where(eq(schema.pages.id, id))
    .limit(1);

  if (!row) return NextResponse.json({ page: null }, { status: 404 });
  return NextResponse.json({ page: row });
}
