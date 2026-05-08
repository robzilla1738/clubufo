/** One-off sanity check: render the first page of a small PDF and run Gemini against it. */
import "../lib/env-cli";

import { renderPdfPages, pdfPageCount } from "../lib/ingest/render";
import { extractPageFromImage } from "../lib/ai/extract";

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("usage: pnpm tsx scripts/test-extract.ts <pdf-path>");
    process.exit(1);
  }
  const totalPages = await pdfPageCount(path);
  console.log(`pages: ${totalPages}`);

  for await (const p of renderPdfPages(path, { batchSize: 1 })) {
    console.log(`rendered page ${p.page}, png ${p.png.length}B, thumb ${p.thumb.length}B`);
    const t0 = Date.now();
    const result = await extractPageFromImage({
      imagePng: p.png,
      pageNumber: p.page,
      documentTitle: path.split("/").pop() ?? "test.pdf",
      totalPages,
    });
    console.log(`extracted in ${Date.now() - t0}ms`);
    console.log("---");
    console.log("documentType:", result.documentType);
    console.log("classification:", result.classification);
    console.log("inferredDate:", result.inferredDate);
    console.log("redactions:", result.redactionsPresent);
    console.log("entities:", result.entities.length);
    console.log("claims:", result.claims.length);
    console.log("---");
    console.log(result.cleanedText.slice(0, 600));
    console.log("...");
    console.log("first claim:", result.claims[0]);
    break;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
