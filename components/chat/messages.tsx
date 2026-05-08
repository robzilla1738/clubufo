"use client";

import { type UIMessage } from "ai";
import { CitationChip, type Source } from "./citation-chip";
import { cn } from "@/lib/utils";

export function MessageList({
  messages,
  status,
  onOpenSource,
}: {
  messages: UIMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
  onOpenSource: (s: Source) => void;
}) {
  if (messages.length === 0) return null;
  return (
    <div className="flex flex-col gap-10">
      {messages.map((m) => (
        <Message key={m.id} message={m} onOpenSource={onOpenSource} />
      ))}
      {status === "submitted" ? <ThinkingRow /> : null}
    </div>
  );
}

function Message({
  message,
  onOpenSource,
}: {
  message: UIMessage;
  onOpenSource: (s: Source) => void;
}) {
  const isUser = message.role === "user";
  const text = (message.parts ?? [])
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
  const sources =
    ((message as { metadata?: { sources?: Source[] } }).metadata?.sources ?? []) as Source[];

  return (
    <article className="flex flex-col gap-2.5 group">
      <div
        className={cn(
          "text-[9px] uppercase tracking-[0.24em]",
          isUser ? "text-muted-foreground/70" : "text-cyan",
        )}
      >
        {isUser ? "USER" : "LIBRARIAN"}
      </div>
      <div
        className={cn(
          "text-[14px] leading-[1.75] whitespace-pre-wrap",
          isUser ? "text-foreground/80" : "text-foreground",
        )}
      >
        {renderWithCitations(text, sources, onOpenSource)}
      </div>
    </article>
  );
}

function renderWithCitations(
  text: string,
  sources: Source[],
  onOpenSource: (s: Source) => void,
): React.ReactNode {
  if (!sources || sources.length === 0) return text;
  const parts: React.ReactNode[] = [];
  const re = /\[(\d+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const idx = Number(m[1]);
    const source = sources[idx - 1];
    if (source) {
      parts.push(
        <CitationChip
          key={`c-${m.index}`}
          index={idx}
          source={source}
          onOpen={onOpenSource}
        />,
      );
    } else {
      parts.push(m[0]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function ThinkingRow() {
  return (
    <article className="flex flex-col gap-2.5">
      <div className="text-[9px] uppercase tracking-[0.24em] text-cyan">
        LIBRARIAN
      </div>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <span className="flex gap-1">
          <span className="size-1 bg-cyan inline-block animate-pulse" />
          <span className="size-1 bg-cyan inline-block animate-pulse [animation-delay:200ms]" />
          <span className="size-1 bg-cyan inline-block animate-pulse [animation-delay:400ms]" />
        </span>
        <span>SCANNING ARCHIVE</span>
      </div>
    </article>
  );
}
