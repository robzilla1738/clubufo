"use client";

export type Source = {
  chunkId?: string;
  claimId?: string;
  pageId: string;
  documentId: string;
  documentTitle: string;
  page: number;
  snippet: string;
  imageUrl: string | null;
  thumbUrl: string | null;
  charStart: number | null;
  charEnd: number | null;
  source: "chunk" | "claim";
};

export function CitationChip({
  index,
  source,
  onOpen,
}: {
  index: number;
  source: Source;
  onOpen: (s: Source) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(source)}
      className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 mx-0.5 rounded-sm bg-primary/15 text-primary text-[10px] font-mono align-text-top hover:bg-primary/25 transition-colors cursor-pointer"
      title={`${source.documentTitle} — p.${source.page}`}
    >
      {index}
    </button>
  );
}
