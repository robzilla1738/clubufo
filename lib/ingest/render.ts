/**
 * Renders a PDF to per-page PNGs using poppler's pdftoppm.
 *
 * Streams pages in small batches so the consumer can start processing
 * (Gemini extraction) while later pages are still rendering — keeps
 * wall-clock down on big multi-hundred-page PDFs.
 */
import { spawn } from "node:child_process";
import { readFile, mkdir, rm } from "node:fs/promises";
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
  /** Resolution in DPI for the full image. 200 is good for typewritten scans. */
  dpi?: number;
  /** Target longest-side pixel size for the thumbnail. */
  thumbMaxDim?: number;
  /** Render in batches of this many pages. */
  batchSize?: number;
};

/**
 * Streams pages out one batch at a time. Earlier batches are yielded before
 * later batches finish rendering.
 */
export async function* renderPdfPages(
  pdfPath: string,
  opts: RenderOptions = {},
): AsyncGenerator<RenderedPage> {
  const dpi = opts.dpi ?? 200;
  const thumbMaxDim = opts.thumbMaxDim ?? 360;
  const batchSize = opts.batchSize ?? 8;

  const totalPages = await pdfPageCount(pdfPath);
  if (totalPages === 0) return;

  const dir = join(tmpdir(), `ufo-render-${randomUUID()}`);
  await mkdir(dir, { recursive: true });

  try {
    for (let first = 1; first <= totalPages; first += batchSize) {
      const last = Math.min(first + batchSize - 1, totalPages);
      await runPdfToPpm({
        pdfPath,
        outDir: dir,
        firstPage: first,
        lastPage: last,
        dpi,
        prefix: `b${String(first).padStart(5, "0")}`,
      });

      // Yield each rendered page as we go.
      for (let page = first; page <= last; page++) {
        const filename = await findRenderedFile(dir, `b${String(first).padStart(5, "0")}`, page);
        if (!filename) continue;
        const png = await readFile(filename);
        const thumb = await sharp(png)
          .resize({
            width: thumbMaxDim,
            height: thumbMaxDim,
            fit: "inside",
            withoutEnlargement: true,
          })
          .png({ quality: 75, compressionLevel: 9 })
          .toBuffer();
        yield { page, png, thumb };
        // Free disk as we go.
        await rm(filename, { force: true });
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function findRenderedFile(
  dir: string,
  prefix: string,
  page: number,
): Promise<string | null> {
  // pdftoppm names files <prefix>-<page>.png with zero-padded width matching
  // the largest page number in the requested range.
  const { readdir } = await import("node:fs/promises");
  const all = await readdir(dir);
  const re = new RegExp(`^${prefix}-0*${page}\\.png$`);
  const found = all.find((f) => re.test(f));
  return found ? join(dir, found) : null;
}

function runPdfToPpm(opts: {
  pdfPath: string;
  outDir: string;
  firstPage: number;
  lastPage: number;
  dpi: number;
  prefix: string;
}): Promise<void> {
  const args = [
    "-png",
    "-r",
    String(opts.dpi),
    "-f",
    String(opts.firstPage),
    "-l",
    String(opts.lastPage),
    opts.pdfPath,
    join(opts.outDir, opts.prefix),
  ];
  return new Promise((resolve, reject) => {
    const child = spawn("pdftoppm", args, {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`pdftoppm exited ${code}: ${stderr}`));
    });
  });
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
