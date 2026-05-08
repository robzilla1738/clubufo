/**
 * Recursive character splitter, ~800 tokens per chunk, 100 token overlap.
 * Estimates 1 token ~ 4 characters which is close enough for English.
 */
const TARGET_CHARS = 3200;
const OVERLAP_CHARS = 400;

export type Chunk = {
  page: number;
  index: number; // index within the document (across all pages)
  content: string;
};

export function chunkPages(
  pages: { page: number; text: string }[],
): Chunk[] {
  const out: Chunk[] = [];
  let globalIdx = 0;
  for (const { page, text } of pages) {
    if (!text.trim()) continue;
    const pieces = splitRecursive(text, TARGET_CHARS, OVERLAP_CHARS);
    for (const piece of pieces) {
      const cleaned = piece.trim();
      if (cleaned.length < 40) continue; // skip nearly-empty fragments
      out.push({ page, index: globalIdx++, content: cleaned });
    }
  }
  return out;
}

function splitRecursive(
  text: string,
  size: number,
  overlap: number,
): string[] {
  if (text.length <= size) return [text];
  const separators = ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " "];
  return splitWithSeparators(text, separators, size, overlap);
}

function splitWithSeparators(
  text: string,
  seps: string[],
  size: number,
  overlap: number,
): string[] {
  const [sep, ...rest] = seps;
  if (!sep) return hardSplit(text, size, overlap);
  const parts = text.split(sep);
  const out: string[] = [];
  let buf = "";
  for (const p of parts) {
    const candidate = buf ? `${buf}${sep}${p}` : p;
    if (candidate.length <= size) {
      buf = candidate;
    } else {
      if (buf) out.push(buf);
      if (p.length > size) {
        // recurse on the oversize segment with finer separators
        out.push(...splitWithSeparators(p, rest, size, overlap));
        buf = "";
      } else {
        buf = p;
      }
    }
  }
  if (buf) out.push(buf);
  return addOverlap(out, overlap);
}

function hardSplit(text: string, size: number, overlap: number): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    out.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return out;
}

function addOverlap(parts: string[], overlap: number): string[] {
  if (overlap <= 0 || parts.length < 2) return parts;
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i === 0) {
      out.push(parts[i]);
    } else {
      const prevTail = parts[i - 1].slice(-overlap);
      out.push(`${prevTail}${parts[i]}`);
    }
  }
  return out;
}
