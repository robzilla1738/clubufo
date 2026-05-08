"use client";

import { type UIMessage } from "ai";
import { CitationChip, type Source } from "./citation-chip";
import { Sparkles, User } from "lucide-react";
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
    <div className="flex flex-col gap-7">
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
    <div className="flex gap-3 items-start">
      <div
        className={cn(
          "size-8 shrink-0 rounded-md border flex items-center justify-center",
          isUser
            ? "border-border/60 bg-card/40 text-muted-foreground"
            : "border-primary/40 bg-primary/10 text-primary",
        )}
      >
        {isUser ? <User className="size-3.5" /> : <Sparkles className="size-3.5" />}
      </div>
      <div className="min-w-0 flex-1 space-y-2 pt-0.5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {isUser ? "You" : "Librarian"}
        </p>
        <div className="text-[15px] leading-7 text-foreground/90 whitespace-pre-wrap">
          {renderWithCitations(text, sources, onOpenSource)}
        </div>
      </div>
    </div>
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
    <div className="flex gap-3 items-start">
      <div className="size-8 shrink-0 rounded-md border border-primary/40 bg-primary/10 text-primary flex items-center justify-center">
        <Sparkles className="size-3.5 animate-pulse" />
      </div>
      <div className="pt-2">
        <span className="inline-flex gap-1">
          <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
          <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:200ms]" />
          <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:400ms]" />
        </span>
      </div>
    </div>
  );
}
