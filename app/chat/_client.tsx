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
    <div className="flex-1 flex min-h-0">
      {/* LEFT — sources */}
      <SourcesRail
        messages={messages}
        activeKey={activeKey}
        onOpenSource={setActiveSource}
      />

      {/* CENTER — thread + composer */}
      <section className="flex-1 flex flex-col min-h-0 min-w-0">
        <div className="border-b hairline px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[10px] uppercase tracking-[0.18em] text-cyan">
              &gt; CHAT
            </span>
            {scopedDocTitle ? (
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate">
                / SCOPED: {scopedDocTitle}
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                / FULL CORPUS
              </span>
            )}
          </div>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
            {status === "streaming" ? "[STREAMING]" : status === "submitted" ? "[QUERYING]" : "[READY]"}
          </span>
        </div>

        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto px-6 py-8 scrollbar-none"
        >
          {messages.length === 0 ? (
            <EmptyState onPick={(t) => setInput(t)} />
          ) : (
            <div className="max-w-3xl">
              <MessageList
                messages={messages}
                status={status}
                onOpenSource={setActiveSource}
              />
            </div>
          )}
          {error ? (
            <div className="mt-4 max-w-3xl border border-destructive/40 bg-destructive/10 p-3 text-[11px] uppercase tracking-wider text-destructive">
              {error.message}
            </div>
          ) : null}
        </div>

        <div className="border-t hairline px-6 py-4 space-y-2">
          <div className="max-w-3xl">
            <Composer
              value={input}
              onChange={setInput}
              onSubmit={submit}
              onStop={stop}
              status={status}
              placeholder={
                scopedDocTitle
                  ? `QUERY THIS FILE…`
                  : "QUERY THE ARCHIVE…"
              }
            />
            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
              ANSWERS ARE GENERATED. VERIFY VIA CITED PAGE.
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
    <div className="max-w-3xl space-y-12">
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-cyan">
          &gt; INTERROGATE THE CORPUS
        </p>
        <h2 className="text-2xl md:text-3xl uppercase tracking-tight leading-[1.15]">
          ASK A QUESTION.
          <br />
          <span className="text-muted-foreground">
            EVERY ANSWER IS GROUNDED IN THE ARCHIVE.
          </span>
        </h2>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          &gt; SUGGESTED QUERIES
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              className="text-left p-4 border hairline hover:border-cyan hover:bg-cyan/5 transition-colors text-[11px] uppercase tracking-[0.1em] leading-[1.6]"
            >
              <span className="text-cyan mr-1.5">&gt;</span>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function sourceKey(s: Source) {
  return `${s.source}:${s.chunkId ?? s.claimId ?? s.pageId}`;
}
