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
    <div className="flex flex-col gap-9">
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
    ((message as { metadata?: { sources?: Source[] } }).metadata?.sources ??
      []) as Source[];

  return (
    <article className="flex flex-col gap-2.5">
      <div
        className={cn(
          "ufo-kicker text-[9px]",
          isUser ? "text-muted-foreground/70" : "text-cyan",
        )}
      >
        {isUser ? "USER" : "LIBRARIAN"}
      </div>
      <div
        className={cn(
          "ufo-copy max-w-none text-[14px]",
          isUser ? "text-foreground/80" : "text-foreground",
        )}
      >
        {renderRich(text, sources, onOpenSource)}
      </div>
    </article>
  );
}

/**
 * Tiny markdown-to-React renderer for the librarian's prose. Handles:
 *   - paragraphs (blank-line separated)
 *   - unordered list blocks (lines starting with `- ` or `* `)
 *   - ordered list blocks (lines starting with `1.`)
 *   - inline: **bold**, *italic*, `code`
 *   - citations: [1] [2] ... → CitationChip
 */
function renderRich(
  text: string,
  sources: Source[],
  onOpenSource: (s: Source) => void,
): React.ReactNode {
  if (!text) return null;
  const blocks = splitBlocks(text);
  return blocks.map((b, i) => {
    if (b.kind === "ul") {
      return (
        <ul
          key={i}
          className="my-3 list-none space-y-2 pl-0 [&_li]:relative [&_li]:pl-4"
        >
          {b.items.map((item, j) => (
            <li key={j}>
              <span
                aria-hidden
                className="absolute left-0 top-[0.4em] size-1 bg-cyan"
              />
              {renderInline(item, sources, onOpenSource)}
            </li>
          ))}
        </ul>
      );
    }
    if (b.kind === "ol") {
      return (
        <ol key={i} className="my-3 list-none space-y-2 pl-0">
          {b.items.map((item, j) => (
            <li key={j} className="flex gap-3">
              <span className="text-cyan tabular-nums shrink-0">
                {String(j + 1).padStart(2, "0")}
              </span>
              <span className="flex-1">
                {renderInline(item, sources, onOpenSource)}
              </span>
            </li>
          ))}
        </ol>
      );
    }
    return (
      <p key={i} className="mb-3 last:mb-0">
        {renderInline(b.content, sources, onOpenSource)}
      </p>
    );
  });
}

type Block =
  | { kind: "p"; content: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

function splitBlocks(text: string): Block[] {
  const out: Block[] = [];
  const paragraphs = text.split(/\n\s*\n/);
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n");
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      out.push({
        kind: "ul",
        items: lines.map((l) => l.replace(/^\s*[-*]\s+/, "")),
      });
      continue;
    }
    if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
      out.push({
        kind: "ol",
        items: lines.map((l) => l.replace(/^\s*\d+\.\s+/, "")),
      });
      continue;
    }
    out.push({ kind: "p", content: trimmed });
  }
  return out;
}

const INLINE_RE =
  /(\[\d+\])|\*\*([^*\n]+?)\*\*|(?<![*\w])\*([^*\n]+?)\*(?!\w)|`([^`\n]+?)`/g;

function renderInline(
  text: string,
  sources: Source[],
  onOpenSource: (s: Source) => void,
): React.ReactNode {
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  // Reset state on every call.
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) {
      out.push(text.slice(last, m.index));
    }
    if (m[1]) {
      // Citation chip [N].
      const n = Number(m[1].slice(1, -1));
      const source = sources[n - 1];
      if (source) {
        out.push(
          <CitationChip
            key={`c-${key++}`}
            index={n}
            source={source}
            onOpen={onOpenSource}
          />,
        );
      } else {
        out.push(m[1]);
      }
    } else if (m[2]) {
      out.push(
        <strong key={`b-${key++}`} className="font-medium text-foreground">
          {m[2]}
        </strong>,
      );
    } else if (m[3]) {
      out.push(
        <em key={`i-${key++}`} className="italic text-foreground/95">
          {m[3]}
        </em>,
      );
    } else if (m[4]) {
      out.push(
        <code
          key={`k-${key++}`}
          className="font-mono text-[0.92em] text-cyan bg-card/60 border hairline px-1 py-px"
        >
          {m[4]}
        </code>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function ThinkingRow() {
  return (
    <article className="flex flex-col gap-2.5">
      <div className="ufo-kicker text-[9px] text-cyan">
        LIBRARIAN
      </div>
      <div className="flex items-center gap-2 ufo-kicker text-muted-foreground">
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
