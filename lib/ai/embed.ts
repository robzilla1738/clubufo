import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMS = 1536;

export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.textEmbeddingModel(EMBEDDING_MODEL),
    value: text,
  });
  return embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const out: number[][] = [];
  // OpenAI accepts up to 2048 inputs / ~8192 tokens per request; batch at 96 to stay safe.
  const BATCH = 96;
  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH);
    const { embeddings } = await embedMany({
      model: openai.textEmbeddingModel(EMBEDDING_MODEL),
      values: slice,
    });
    out.push(...embeddings);
  }
  return out;
}
