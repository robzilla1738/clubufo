import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { ingestPdfBuffer } from "@/lib/ingest/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const tagsRaw = (form.get("tags") as string | null) ?? "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!(file instanceof Blob) || !("name" in file)) {
    return NextResponse.json({ error: "missing file" }, { status: 400 });
  }
  const filename = (file as File).name || "upload.pdf";
  const buffer = new Uint8Array(await file.arrayBuffer());

  let fileUrl: string | null = null;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`pdfs/${filename}`, file, {
        access: "public",
        addRandomSuffix: true,
      });
      fileUrl = blob.url;
    } catch (e) {
      console.warn("[admin/ingest] blob upload failed", e);
    }
  }

  try {
    const result = await ingestPdfBuffer({
      buffer,
      filename,
      fileSize: buffer.byteLength,
      fileUrl,
      tags,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
