/**
 * Shared Google AI Studio (Generative Language API) provider for ChatUFO.
 * We use Gemini 3.1 Flash Lite preview for both per-page extraction and
 * document-level tagging.
 */
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const GEMINI_MODEL_ID = "gemini-3.1-flash-lite-preview" as const;

let _provider: ReturnType<typeof createGoogleGenerativeAI> | null = null;

export function getGoogleProvider() {
  if (_provider) return _provider;
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY is not set. Add it to .env.local before running extraction.",
    );
  }
  _provider = createGoogleGenerativeAI({ apiKey });
  return _provider;
}

export function geminiModel() {
  return getGoogleProvider()(GEMINI_MODEL_ID);
}
