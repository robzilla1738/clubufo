import { deepseek } from "@ai-sdk/deepseek";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { embedQuery } from "@/lib/ai/embed";
import { hybridSearch, type SearchHit } from "@/lib/search/hybrid";
import { SYSTEM_PROMPT, buildContextBlock } from "@/lib/ai/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  messages: UIMessage[];
  documentId?: string;
};

export async function POST(req: Request) {
  const { messages, documentId }: Body = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "No messages provided." }, { status: 400 });
  }

  const lastUserIndex = findLastUserIndex(messages);
  const lastUser = lastUserIndex >= 0 ? messages[lastUserIndex] : null;
  const userText = lastUser ? extractText(lastUser) : "";
  const retrievalQuery = buildRetrievalQuery(messages, lastUserIndex);

  let hits: SearchHit[] = [];
  if (userText.trim()) {
    try {
      const embedding = await embedQuery(retrievalQuery);
      const rawHits = await hybridSearch({
        query: userText,
        embedding,
        k: 18,
        documentId,
        perSignal: 32,
      });
      hits = curateHits(rawHits, 12);
    } catch (e) {
      console.error("[chat] retrieval error", e);
    }
  }

  const context = buildContextBlock(hits);
  const sourcesNote = hits.length
    ? `\n\nSOURCE EXCERPTS:\n${context}`
    : "\n\n(No relevant excerpts retrieved. Answer that the archive does not contain a clear answer.)";

  const result = streamText({
    model: deepseek("deepseek-chat"),
    system: `${SYSTEM_PROMPT}${sourcesNote}`,
    messages: await convertToModelMessages(messages),
    temperature: 0.15,
    maxOutputTokens: 1600,
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: () => ({
      sources: hits.map((h) => ({
        chunkId: h.chunkId,
        claimId: h.claimId,
        pageId: h.pageId,
        documentId: h.documentId,
        documentTitle: h.documentTitle,
        page: h.page,
        snippet: h.content.slice(0, 360),
        imageUrl: h.imageUrl,
        thumbUrl: h.thumbUrl,
        charStart: h.charStart,
        charEnd: h.charEnd,
        source: h.source,
      })),
    }),
  });
}

function findLastUserIndex(messages: UIMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return i;
  }
  return -1;
}

function extractText(m: UIMessage): string {
  const parts = (m as { parts?: Array<{ type: string; text?: string }> }).parts;
  if (Array.isArray(parts)) {
    return parts
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text as string)
      .join("\n");
  }
  const c = (m as { content?: unknown }).content;
  if (typeof c === "string") return c;
  return "";
}

function buildRetrievalQuery(messages: UIMessage[], lastUserIndex: number) {
  if (lastUserIndex < 0) return "";
  const current = extractText(messages[lastUserIndex]).trim();
  const recent = messages
    .slice(Math.max(0, lastUserIndex - 6), lastUserIndex)
    .map((m) => {
      const text = extractText(m).replace(/\s+/g, " ").trim();
      if (!text) return null;
      return `${m.role.toUpperCase()}: ${text.slice(0, 520)}`;
    })
    .filter(Boolean);

  if (recent.length === 0) return current;
  return [`CURRENT QUESTION: ${current}`, "RECENT THREAD:", ...recent].join("\n");
}

function curateHits(hits: SearchHit[], max: number) {
  const selected: SearchHit[] = [];
  const seenExact = new Set<string>();
  const pageCounts = new Map<string, number>();

  for (const hit of hits) {
    const exactKey = `${hit.source}:${hit.chunkId ?? hit.claimId ?? hit.pageId}`;
    if (seenExact.has(exactKey)) continue;

    const pageKey = `${hit.documentId}:${hit.page}`;
    const pageCount = pageCounts.get(pageKey) ?? 0;
    if (pageCount >= 2) continue;

    seenExact.add(exactKey);
    pageCounts.set(pageKey, pageCount + 1);
    selected.push(hit);
    if (selected.length >= max) return selected;
  }

  return selected;
}
