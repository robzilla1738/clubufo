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
      className="relative mx-0.5 inline-flex h-[18px] min-w-[18px] cursor-pointer items-center justify-center bg-primary/15 px-1 align-text-top font-mono text-[10px] text-primary transition-[background-color,scale] before:absolute before:-inset-2 hover:bg-primary/25 active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
      title={`${source.documentTitle}, p.${source.page}`}
    >
      {index}
    </button>
  );
}
