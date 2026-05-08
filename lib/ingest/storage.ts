/**
 * Storage adapter for rendered page images.
 *
 * Production: Vercel Blob (BLOB_READ_WRITE_TOKEN set).
 * Dev fallback: writes to public/pages/<docId>/page-<N>.png so Next can serve them.
 */
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export type StoredImage = { url: string };

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function storePageImage(opts: {
  documentId: string;
  page: number;
  variant: "full" | "thumb";
  buffer: Buffer;
}): Promise<StoredImage> {
  const filename = `${opts.variant === "thumb" ? "thumb" : "page"}-${String(opts.page).padStart(4, "0")}.png`;
  const key = `pdfs/${opts.documentId}/${filename}`;

  if (useBlob) {
    const blob = await put(key, opts.buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/png",
      allowOverwrite: true,
    });
    return { url: blob.url };
  }

  // Dev fallback — write to public/pages/<docId>/...
  const dir = join(process.cwd(), "public", "pages", opts.documentId);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), opts.buffer);
  return { url: `/pages/${opts.documentId}/${filename}` };
}
