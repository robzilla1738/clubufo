/**
 * Document-level metadata + tag generation. Runs once per document after all
 * pages reach `extracted` status. Cheap second Gemini call over page summaries
 * to fill the archive table (kicker, agency, type, dates, location, tags).
 */
import { z } from "zod";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const MODEL_ID = "google/gemini-3.1-flash-lite";

let _openrouter: ReturnType<typeof createOpenRouter> | null = null;
function getProvider() {
  if (_openrouter) return _openrouter;
  _openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
    appName: "ClubUFO",
    appUrl: "https://clubufo.com",
  });
  return _openrouter;
}

export const DocumentMetadataSchema = z.object({
  kicker: z
    .string()
    .describe(
      "Compact archive-row title in the style of FBI/DoD case lists. ALL CAPS, comma-separated parts, like 'DOW-UAP-D32, MISSION REPORT, SYRIA, OCTOBER 2024'. Max 90 chars.",
    ),
  agency: z
    .string()
    .describe(
      "Originating agency in plain ALL CAPS, e.g. 'DEPARTMENT OF WAR', 'FBI', 'NASA', 'CIA', 'NAVY', 'AIR FORCE', 'PROJECT BLUE BOOK', 'UNKNOWN'. No brackets — UI adds them.",
    ),
  documentType: z
    .enum([
      "MEMO",
      "REPORT",
      "MISSION_REPORT",
      "WITNESS_STATEMENT",
      "TRANSCRIPT",
      "LETTER",
      "FORM",
      "PHOTOGRAPH",
      "PRESS_RELEASE",
      "DEBRIEF",
      "OTHER",
    ])
    .describe("Best single classification for the whole document."),
  incidentDate: z
    .string()
    .nullable()
    .describe(
      "ISO 8601 (YYYY-MM-DD) for the date the described incident occurred, NOT the release date. Null if no event date is identifiable.",
    ),
  incidentLocation: z
    .string()
    .nullable()
    .describe(
      "Location of the described incident, ALL CAPS. e.g. 'ROSWELL, NEW MEXICO', 'PERSIAN GULF', 'AEGEAN SEA'. Null if no location.",
    ),
  summary: z
    .string()
    .describe(
      "Two- to four-sentence neutral summary of the document. Used as the description in archive views and chat previews.",
    ),
  tags: z
    .array(z.string())
    .min(2)
    .max(8)
    .describe(
      "3–6 lowercase, kebab-case topic tags from a controlled vocabulary like: 'witness-report', 'pilot-encounter', 'radar-contact', 'declassified', 'project-blue-book', 'roswell', 'navy', 'photograph', 'press-release', 'redacted', 'cold-war', 'apollo', 'fbi'. Pick existing-style tags; reuse common ones rather than inventing new variants.",
    ),
});

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

export async function generateDocumentMetadata(opts: {
  filename: string;
  fallbackTitle: string;
  pageSummaries: Array<{ page: number; summary: string }>;
  sampleTexts: string[];
}): Promise<DocumentMetadata> {
  const summariesBlock = opts.pageSummaries
    .sort((a, b) => a.page - b.page)
    .slice(0, 80)
    .map((p) => `p.${p.page}: ${p.summary}`)
    .join("\n");

  const samples = opts.sampleTexts
    .slice(0, 3)
    .map((s, i) => `[sample ${i + 1}]\n${s.slice(0, 800)}`)
    .join("\n\n---\n\n");

  const { object } = await generateObject({
    model: getProvider().chat(MODEL_ID),
    schema: DocumentMetadataSchema,
    schemaName: "DocumentMetadata",
    schemaDescription:
      "Document-level metadata for archive listing and faceted search.",
    temperature: 0.1,
    maxRetries: 2,
    system: `You are cataloging declassified UAP/UFO documents for a public archive. Return strict, terse, archive-grade metadata.`,
    messages: [
      {
        role: "user",
        content: `Filename: ${opts.filename}
Fallback title: ${opts.fallbackTitle}

Page summaries:
${summariesBlock}

Sample passages:
${samples}

Generate the catalog entry.`,
      },
    ],
    providerOptions: {
      openrouter: {
        provider: { only: ["google-vertex"] },
      },
    },
  });

  return object;
}
