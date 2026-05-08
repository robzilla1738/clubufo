"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Composer } from "@/components/chat/composer";
import { MessageList } from "@/components/chat/messages";
import { SourcesRail } from "@/components/chat/sources-rail";
import { PageViewer } from "@/components/chat/page-viewer";
import type { Source } from "@/components/chat/citation-chip";
import { Sparkles, FileText } from "lucide-react";
import Link from "next/link";

const STARTERS = [
  "What did Project Blue Book conclude?",
  "Summarize the most credible witness reports.",
  "What patterns appear across the Roswell documents?",
  "Which sightings involve military pilots?",
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
  const [scopedDoc, setScopedDoc] = useState<{ id: string; title: string } | null>(
    null,
  );
  const [openSource, setOpenSource] = useState<Source | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!docId) return;
    fetch(`/api/documents?limit=1`)
      .then((r) => r.json())
      .then((data: { documents: Array<{ id: string; title: string }> }) => {
        const found = data.documents.find((d) => d.id === docId);
        if (found) setScopedDoc({ id: found.id, title: found.title });
      })
      .catch(() => null);
  }, [docId]);

  useEffect(() => {
    if (initialQ && messages.length === 0) {
      void sendMessage({ text: initialQ });
      setInput("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    void sendMessage({ text });
    setInput("");
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-5 sm:px-8 py-8 flex-1 flex flex-col">
      <header className="flex items-end justify-between gap-4 pb-6 border-b border-border/60">
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Chat
          </p>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">
            {scopedDoc ? "Ask this document" : "Ask the corpus"}
          </h1>
          {scopedDoc ? (
            <Link
              href={`/library/${scopedDoc.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="size-3.5" />
              <span>Scoped to: {scopedDoc.title}</span>
            </Link>
          ) : (
            <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
              Every answer is grounded in the document corpus. Citations are
              clickable and link to the exact page.
            </p>
          )}
        </div>
      </header>

      <div className="flex-1 flex gap-8 min-h-0 pt-6">
        <div className="flex-1 flex flex-col min-w-0">
          <div
            ref={scrollerRef}
            className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-none"
          >
            {messages.length === 0 ? (
              <EmptyChat onPick={(t) => setInput(t)} />
            ) : (
              <div className="pb-6">
                <MessageList
                  messages={messages}
                  status={status}
                  onOpenSource={setOpenSource}
                />
              </div>
            )}
            {error ? (
              <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                {error.message}
              </div>
            ) : null}
          </div>

          <div className="pt-4 border-t border-border/60">
            <Composer
              value={input}
              onChange={setInput}
              onSubmit={submit}
              onStop={stop}
              status={status}
              placeholder={
                scopedDoc
                  ? `Ask about “${scopedDoc.title.slice(0, 40)}${scopedDoc.title.length > 40 ? "…" : ""}”`
                  : "Ask about the corpus…"
              }
            />
            <p className="mt-2 text-[11px] font-mono text-muted-foreground/60 text-center">
              Answers are AI-generated. Always verify against the cited source.
            </p>
          </div>
        </div>

        <SourcesRail messages={messages} onOpenSource={setOpenSource} />
      </div>

      <PageViewer source={openSource} onClose={() => setOpenSource(null)} />
    </div>
  );
}

function EmptyChat({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 gap-6">
      <div className="size-12 rounded-full border border-primary/40 bg-primary/10 text-primary flex items-center justify-center">
        <Sparkles className="size-5" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="font-display text-2xl tracking-tight">
          Start a conversation
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ask a question and the librarian will find supporting passages from
          the corpus before answering. Try one of these to begin.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 max-w-xl w-full">
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="text-left px-4 py-3 rounded-lg border border-border/60 bg-card/40 hover:bg-card/70 hover:border-border transition-colors text-[13px] leading-snug"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
