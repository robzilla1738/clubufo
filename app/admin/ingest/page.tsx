"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Row = {
  filename: string;
  size: number;
  status: "pending" | "uploading" | "ok" | "err";
  message?: string;
  pageCount?: number;
  chunkCount?: number;
};

export default function AdminIngestPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);

  const onPick = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).filter((f) => f.name.endsWith(".pdf"));
    setFiles(next);
    setRows(
      next.map((f) => ({
        filename: f.name,
        size: f.size,
        status: "pending",
      })),
    );
  };

  const run = async () => {
    if (files.length === 0) return;
    setRunning(true);
    for (let i = 0; i < files.length; i++) {
      setRows((r) =>
        r.map((row, idx) =>
          idx === i ? { ...row, status: "uploading" } : row,
        ),
      );
      const form = new FormData();
      form.append("file", files[i]);
      form.append("tags", tags);
      try {
        const res = await fetch("/api/admin/ingest", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        setRows((r) =>
          r.map((row, idx) =>
            idx === i
              ? {
                  ...row,
                  status: res.ok ? "ok" : "err",
                  message: data.error,
                  pageCount: data.pageCount,
                  chunkCount: data.chunkCount,
                }
              : row,
          ),
        );
      } catch (e) {
        setRows((r) =>
          r.map((row, idx) =>
            idx === i
              ? {
                  ...row,
                  status: "err",
                  message: e instanceof Error ? e.message : String(e),
                }
              : row,
          ),
        );
      }
    }
    setRunning(false);
    toast.success("Files added to the archive");
  };

  return (
    <div className="ufo-page-pad mx-auto w-full max-w-4xl space-y-8 py-10 md:py-12">
      <header className="space-y-3 border-b hairline pb-6">
        <p className="ufo-kicker ufo-kicker-strong">
          &gt; ADMIN / INGEST
        </p>
        <h1 className="ufo-headline">
          ADD DOCUMENTS TO THE ARCHIVE
        </h1>
        <p className="ufo-copy max-w-2xl">
          Add PDFs to extract text, create citations, and make them searchable.
          For the initial 161-document import use{" "}
          <code className="font-mono text-foreground">pnpm ingest &lt;dir&gt;</code>{" "}
          on the server instead.
        </p>
      </header>

      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-border/70 bg-card/30 px-4 py-14 text-center transition-[background-color,border-color] hover:border-cyan/70 hover:bg-card/50 focus-within:border-cyan sm:py-16",
        )}
      >
        <Upload className="size-6 text-muted-foreground" />
        <div className="text-center space-y-1">
          <p className="font-display text-[13px] uppercase tracking-[0.18em]">
            DROP PDFS OR CLICK TO CHOOSE
          </p>
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {files.length > 0
              ? `${files.length} file${files.length === 1 ? "" : "s"} ready`
              : "Multiple files supported"}
          </p>
        </div>
        <input
          type="file"
          accept="application/pdf"
          multiple
          className="sr-only"
          onChange={(e) => onPick(e.target.files)}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Tags (comma separated)
          </label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="declassified, witness-report, 1947"
            className="h-10 bg-card/40 font-mono text-[12px]"
          />
        </div>
        <Button
          onClick={run}
          disabled={files.length === 0 || running}
          className="ufo-action ufo-action-primary bg-transparent"
        >
          {running ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {running ? "Adding files…" : `Add ${files.length || ""}`}
        </Button>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-hidden border border-border/60 divide-y divide-border/60">
          {rows.map((r) => (
            <div
              key={r.filename}
              className="flex items-center gap-3 bg-card/30 px-3 py-3 text-sm sm:px-4"
            >
              <StatusIcon status={r.status} />
              <span className="font-mono text-xs truncate flex-1">
                {r.filename}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {(r.size / 1024 / 1024).toFixed(1)}MB
              </span>
              {r.status === "ok" ? (
                <span className="font-mono text-[11px] text-muted-foreground">
                  {r.pageCount}p · {r.chunkCount}c
                </span>
              ) : null}
              {r.status === "err" ? (
                <span className="font-mono text-[11px] text-destructive truncate max-w-[12rem]">
                  {r.message}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StatusIcon({ status }: { status: Row["status"] }) {
  if (status === "ok")
    return <CheckCircle2 className="size-4 text-primary" />;
  if (status === "err") return <XCircle className="size-4 text-destructive" />;
  if (status === "uploading")
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  return <span className="size-4 border border-border/70" />;
}
