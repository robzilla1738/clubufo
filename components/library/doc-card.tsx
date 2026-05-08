import Link from "next/link";
import { FileText, ArrowUpRight } from "lucide-react";

export type DocCardItem = {
  id: string;
  title: string;
  pageCount: number | null;
  summary: string | null;
  tags: string[] | null;
  uploadedAt: Date | string | null;
};

export function DocCard({ doc }: { doc: DocCardItem }) {
  return (
    <Link
      href={`/library/${doc.id}`}
      className="group relative flex flex-col gap-3 p-5 rounded-xl border border-border/60 bg-card/40 hover:bg-card/70 hover:border-border transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="size-9 rounded-md border border-border/70 bg-background/60 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/40 transition-colors">
          <FileText className="size-4" />
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
      <h3 className="font-display text-lg leading-snug text-foreground line-clamp-3 text-balance">
        {doc.title}
      </h3>
      {doc.summary ? (
        <p className="text-[13px] text-muted-foreground line-clamp-3 leading-relaxed">
          {doc.summary}
        </p>
      ) : null}
      <div className="mt-auto pt-3 flex items-center gap-3 text-[11px] font-mono text-muted-foreground/70 uppercase tracking-wider">
        {doc.pageCount ? <span>{doc.pageCount} pages</span> : <span>Unknown</span>}
        {doc.tags && doc.tags.length > 0 ? (
          <>
            <span className="opacity-40">·</span>
            <span className="truncate">{doc.tags.slice(0, 3).join(" · ")}</span>
          </>
        ) : null}
      </div>
    </Link>
  );
}
