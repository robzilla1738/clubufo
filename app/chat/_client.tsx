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
  "WHAT PATTERNS APPEAR ACROSS WITNESS REPORTS?",
  "SUMMARIZE THE MOST CREDIBLE PILOT ENCOUNTERS.",
  "WHICH DOCUMENTS DESCRIBE NAVAL UAP SIGHTINGS?",
  "WHAT WAS PROJECT BLUE BOOK'S OFFICIAL CONCLUSION?",
];

export default function ChatClient() {
  const params = useSearchParams();
  const docId = params.get("doc") ?? undefined;
  const initialQ = params.get("q") ?? "";
  const docIdRef = useRef<string | undefined>(docId);
  docIdRef.current = docId;

  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/chat",
        body: () => ({ documentId: docIdRef.current }),
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    transport,
  });

  const [input, setInput] = useState(initialQ);
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
      setInput("");
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
      setActiveSource(list[0]);
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
    <div className="flex h-[calc(100dvh-3.5rem-2.5rem)] min-h-0 overflow-hidden">
      {/* LEFT — sources */}
      <SourcesRail
        messages={messages}
        activeKey={activeKey}
        onOpenSource={setActiveSource}
      />

      {/* CENTER — thread + composer */}
      <section className="flex-1 flex flex-col min-h-0 min-w-0">
        <div className="border-b hairline h-10 px-6 flex items-center justify-between text-[10px] uppercase tracking-[0.2em]">
          <span className="text-muted-foreground truncate">
            <span className="text-cyan">&gt;</span>{" "}
            {scopedDocTitle
              ? `SCOPE / ${scopedDocTitle}`
              : "SCOPE / FULL CORPUS"}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {status === "streaming"
              ? "[STREAMING]"
              : status === "submitted"
                ? "[QUERYING]"
                : "[READY]"}
          </span>
        </div>

        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto px-8 py-10 scrollbar-none"
        >
          {messages.length === 0 ? (
            <EmptyState onPick={(t) => setInput(t)} />
          ) : (
            <div className="max-w-2xl">
              <MessageList
                messages={messages}
                status={status}
                onOpenSource={setActiveSource}
              />
            </div>
          )}
          {error ? (
            <div className="mt-6 max-w-2xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-[11px] uppercase tracking-wider text-destructive">
              {error.message}
            </div>
          ) : null}
        </div>

        <div className="border-t hairline px-8 py-5">
          <div className="max-w-2xl">
            <Composer
              value={input}
              onChange={setInput}
              onSubmit={submit}
              onStop={stop}
              status={status}
              placeholder={
                scopedDocTitle ? "QUERY THIS FILE…" : "QUERY THE ARCHIVE…"
              }
            />
            <p className="mt-2.5 text-[9px] uppercase tracking-[0.22em] text-muted-foreground/50">
              GENERATED · VERIFY AGAINST CITED PAGE
            </p>
          </div>
        </div>
      </section>

      {/* RIGHT — preview */}
      <PreviewPane source={activeSource} />
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="h-full flex flex-col justify-center max-w-2xl mx-auto py-12">
      <div className="space-y-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-cyan">
          &gt; READY
        </p>
        <h2 className="text-2xl md:text-3xl uppercase tracking-[0.04em] leading-[1.2]">
          QUERY THE CORPUS.
          <br />
          <span className="text-muted-foreground/80">
            EVERY ANSWER CITES ITS PAGE.
          </span>
        </h2>
      </div>

      <div className="mt-12 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          SUGGESTED
        </p>
        <ul className="divide-y divide-border/50 border-y hairline">
          {STARTERS.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => onPick(s)}
                className="w-full text-left flex items-center gap-3 py-3.5 px-1 text-[12px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors group"
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
