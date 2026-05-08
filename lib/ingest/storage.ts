/**
 * Storage adapter for rendered page images.
 *
 * Resolution order at runtime:
 *   1. Cloudflare R2  (R2_ACCOUNT_ID + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY
 *      + R2_BUCKET + R2_PUBLIC_BASE_URL)  — preferred for public hosting,
 *      cheap storage, zero egress cost.
 *   2. Vercel Blob  (BLOB_READ_WRITE_TOKEN)  — fallback if R2 not configured.
 *   3. Local public/pages/<docId>/...  — dev fallback when neither cloud
 *      provider is configured.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export type StoredImage = { url: string };

type Backend = "r2" | "blob" | "local";

let cachedBackend: Backend | null = null;
let cachedR2: S3Client | null = null;

function resolveBackend(): Backend {
  if (cachedBackend) return cachedBackend;
  if (
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_BASE_URL
  ) {
    cachedBackend = "r2";
  } else if (process.env.BLOB_READ_WRITE_TOKEN) {
    cachedBackend = "blob";
  } else {
    cachedBackend = "local";
  }
  return cachedBackend;
}

function getR2(): S3Client {
  if (cachedR2) return cachedR2;
  cachedR2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return cachedR2;
}

export async function storePageImage(opts: {
  documentId: string;
  page: number;
  variant: "full" | "thumb";
  buffer: Buffer;
}): Promise<StoredImage> {
  const filename = `${
    opts.variant === "thumb" ? "thumb" : "page"
  }-${String(opts.page).padStart(4, "0")}.png`;
  const key = `pdfs/${opts.documentId}/${filename}`;
  const backend = resolveBackend();

  if (backend === "r2") {
    await getR2().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        Body: opts.buffer,
        ContentType: "image/png",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    const base = process.env.R2_PUBLIC_BASE_URL!.replace(/\/$/, "");
    return { url: `${base}/${key}` };
  }

  if (backend === "blob") {
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

export function activeBackend(): Backend {
  return resolveBackend();
}
