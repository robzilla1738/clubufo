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
    toast.success("Ingestion complete");
  };

  return (
    <div className="mx-auto max-w-4xl w-full px-5 sm:px-8 py-12 space-y-8">
      <header className="space-y-2">
        <p className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
          Admin · Ingest
        </p>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Add documents to the corpus
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
          Drop PDFs to extract, chunk, embed, and index them. For the initial
          161-document import use{" "}
          <code className="font-mono text-foreground">pnpm ingest &lt;dir&gt;</code>{" "}
          on the server instead.
        </p>
      </header>

      <label
        className={cn(
          "flex flex-col items-center justify-center gap-3 py-16 rounded-xl border border-dashed border-border/70 bg-card/30 cursor-pointer hover:bg-card/50 transition-colors",
        )}
      >
        <Upload className="size-6 text-muted-foreground" />
        <div className="text-center space-y-1">
          <p className="font-display text-lg">Drop PDFs or click to choose</p>
          <p className="text-xs text-muted-foreground">
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
            className="bg-card/40"
          />
        </div>
        <Button
          onClick={run}
          disabled={files.length === 0 || running}
          className="gap-1.5"
        >
          {running ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {running ? "Processing…" : `Ingest ${files.length || ""}`}
        </Button>
      </div>

      {rows.length > 0 ? (
        <div className="rounded-xl border border-border/60 divide-y divide-border/60 overflow-hidden">
          {rows.map((r) => (
            <div
              key={r.filename}
              className="flex items-center gap-3 px-4 py-3 text-sm bg-card/30"
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
  return <span className="size-4 rounded-full border border-border/70" />;
}
