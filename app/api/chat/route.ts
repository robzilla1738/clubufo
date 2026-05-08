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

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUser ? extractText(lastUser) : "";

  let hits: SearchHit[] = [];
  if (userText.trim()) {
    try {
      const embedding = await embedQuery(userText);
      hits = await hybridSearch({
        query: userText,
        embedding,
        k: 8,
        documentId,
      });
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
    temperature: 0.3,
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
