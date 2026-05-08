/**
 * Renders a PDF to per-page PNGs using poppler's pdftoppm. Local-only
 * (the bulk-ingest CLI runs on the user's machine where poppler is installed).
 */
import { spawn } from "node:child_process";
import { readFile, readdir, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

export type RenderedPage = {
  page: number;
  png: Buffer;
  thumb: Buffer;
};

export type RenderOptions = {
  /** Resolution in DPI for the full image. 200 is a good balance for typewritten scans. */
  dpi?: number;
  /** Target longest-side pixel size for the thumbnail. */
  thumbMaxDim?: number;
  /** Optional page range; defaults to all. */
  firstPage?: number;
  lastPage?: number;
};

/**
 * Streams pages out one-by-one. Lets the caller upload + extract while later
 * pages are still rendering — keeps wall-clock down on big PDFs.
 */
export async function* renderPdfPages(
  pdfPath: string,
  opts: RenderOptions = {},
): AsyncGenerator<RenderedPage> {
  const dpi = opts.dpi ?? 200;
  const thumbMaxDim = opts.thumbMaxDim ?? 360;

  const dir = join(tmpdir(), `ufo-render-${randomUUID()}`);
  await mkdir(dir, { recursive: true });

  try {
    const args = ["-png", "-r", String(dpi)];
    if (opts.firstPage) args.push("-f", String(opts.firstPage));
    if (opts.lastPage) args.push("-l", String(opts.lastPage));
    args.push(pdfPath, join(dir, "page"));

    await new Promise<void>((resolve, reject) => {
      const child = spawn("pdftoppm", args, { stdio: ["ignore", "ignore", "pipe"] });
      let stderr = "";
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.on("error", reject);
      child.on("close", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`pdftoppm exited ${code}: ${stderr}`)),
      );
    });

    const files = (await readdir(dir))
      .filter((f) => f.startsWith("page-") && f.endsWith(".png"))
      .sort((a, b) => extractPageNumber(a) - extractPageNumber(b));

    for (const file of files) {
      const png = await readFile(join(dir, file));
      const thumb = await sharp(png)
        .resize({
          width: thumbMaxDim,
          height: thumbMaxDim,
          fit: "inside",
          withoutEnlargement: true,
        })
        .png({ quality: 75, compressionLevel: 9 })
        .toBuffer();
      yield {
        page: extractPageNumber(file),
        png,
        thumb,
      };
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function extractPageNumber(filename: string): number {
  const m = filename.match(/page-(\d+)\.png$/);
  return m ? parseInt(m[1], 10) : 0;
}

export async function pdfPageCount(pdfPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn("pdfinfo", [pdfPath], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`pdfinfo exited ${code}: ${stderr}`));
      const m = stdout.match(/Pages:\s+(\d+)/);
      resolve(m ? parseInt(m[1], 10) : 0);
    });
  });
}
