"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Composer } from "@/components/chat/composer";
import { MessageList } from "@/components/chat/messages";
import { SourcesRail } from "@/components/chat/sources-rail";
import { PreviewPane } from "@/components/chat/preview-pane";
import type { Source } from "@/components/chat/citation-chip";

const STARTERS = [
  "WHAT PATTERNS SHOW UP IN WITNESS REPORTS?",
  "SHOW ME PILOT ENCOUNTERS WITH STRONG SOURCES.",
  "WHICH FILES MENTION NAVAL UAP SIGHTINGS?",
  "WHAT DID PROJECT BLUE BOOK OFFICIALLY CONCLUDE?",
];

export default function ChatClient() {
  const params = useSearchParams();
  const docId = params.get("doc") ?? undefined;
  const initialQ = params.get("q") ?? "";

  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/chat",
        body: () => ({ documentId: docId }),
      }),
    [docId],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    transport,
  });

  const [input, setInput] = useState(() => (initialQ ? "" : initialQ));
  const [scopedDocTitle, setScopedDocTitle] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Resolve scoped doc title.
  useEffect(() => {
    if (!docId) return;
    fetch(`/api/documents?limit=200`)
      .then((r) => r.json())
      .then((data: { documents: Array<{ id: string; kicker?: string; title: string }> }) => {
        const found = data.documents.find((d) => d.id === docId);
        if (found) setScopedDocTitle(found.kicker || found.title);
      })
      .catch(() => null);
  }, [docId]);

  // Send initial query from `?q=…`.
  useEffect(() => {
    if (initialQ && messages.length === 0) {
      void sendMessage({ text: initialQ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll thread.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Auto-select latest source on assistant turn complete.
  useEffect(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) return;
    const list =
      ((last as { metadata?: { sources?: Source[] } }).metadata?.sources ?? []) as Source[];
    if (list.length > 0 && !activeSource) {
      queueMicrotask(() => setActiveSource(list[0]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    void sendMessage({ text });
    setInput("");
    setActiveSource(null); // clear; auto-select new on response
  };

  const activeKey = activeSource ? sourceKey(activeSource) : null;

  return (
    <div className="flex h-[calc(100dvh-3.5rem-2.5rem)] min-h-0 flex-col overflow-hidden md:flex-row">
      {/* LEFT: sources */}
      <SourcesRail
        messages={messages}
        activeKey={activeKey}
        onOpenSource={setActiveSource}
      />

      {/* CENTER: thread and composer */}
      <section className="flex-1 flex flex-col min-h-0 min-w-0">
        <div className="ufo-page-pad flex min-h-10 items-center justify-between gap-3 border-b hairline ufo-kicker">
          <span className="text-muted-foreground truncate">
            <span className="text-cyan">&gt;</span>{" "}
            {scopedDocTitle
              ? `SCOPE / ${scopedDocTitle}`
              : "SCOPE / FULL ARCHIVE"}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {status === "streaming"
              ? "[STREAMING]"
              : status === "submitted"
                ? "[SEARCHING]"
                : "[READY]"}
          </span>
        </div>

        <div
          ref={scrollerRef}
          className="ufo-page-pad flex-1 overflow-y-auto py-7 scrollbar-none md:py-10"
        >
          {messages.length === 0 ? (
            <EmptyState onPick={(t) => setInput(t)} />
          ) : (
            <div className="mx-auto max-w-2xl md:mx-0">
              <MessageList
                messages={messages}
                status={status}
                onOpenSource={setActiveSource}
              />
            </div>
          )}
          {error ? (
            <div className="mx-auto mt-6 max-w-2xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-[11px] uppercase tracking-wider text-destructive md:mx-0">
              {error.message}
            </div>
          ) : null}
        </div>

        <div className="ufo-page-pad border-t hairline py-4 md:py-5">
          <div className="mx-auto max-w-2xl md:mx-0">
            <Composer
              value={input}
              onChange={setInput}
              onSubmit={submit}
              onStop={stop}
              status={status}
              placeholder={
                scopedDocTitle ? "ASK ABOUT THIS FILE…" : "ASK THE ARCHIVE…"
              }
            />
            <p className="mt-2.5 ufo-kicker text-[9px] text-muted-foreground/50">
              CHECK ANSWERS AGAINST THE CITED PAGE
            </p>
          </div>
        </div>
      </section>

      {/* RIGHT: preview */}
      <PreviewPane source={activeSource} />
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="h-full flex flex-col justify-center max-w-2xl mx-auto py-8 md:py-12">
      <div className="space-y-4">
        <p className="ufo-kicker ufo-kicker-strong">
          &gt; READY
        </p>
        <h2 className="ufo-headline">
          ASK THE ARCHIVE.
          <br />
          <span className="text-muted-foreground/80">
            EVERY ANSWER CITES A PAGE.
          </span>
        </h2>
      </div>

      <div className="mt-10 space-y-3 md:mt-12">
        <p className="ufo-kicker">
          TRY ONE
        </p>
        <ul className="divide-y divide-border/50 border-y hairline">
          {STARTERS.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => onPick(s)}
                className="group hit-target flex w-full items-center gap-3 px-1 py-3.5 text-left text-[12px] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              >
                <span className="text-cyan/60 group-hover:text-cyan">&gt;</span>
                <span className="flex-1">{s}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan">
                  ⏎
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function sourceKey(s: Source) {
  return `${s.source}:${s.chunkId ?? s.claimId ?? s.pageId}`;
}
