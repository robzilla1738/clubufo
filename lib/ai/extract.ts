/**
 * Per-page vision extraction via Gemini 3.1 Flash Lite on OpenRouter.
 *
 * Returns a structured page record (cleaned text, claims, entities, metadata)
 * suitable for direct insertion into the `pages` and `claims` tables.
 */
import { z } from "zod";
import { generateObject, generateText } from "ai";
import { geminiModel } from "./google";

export const PageExtractionSchema = z.object({
  cleanedText: z
    .string()
    .describe(
      "The full text of the page, OCR'd and lightly cleaned. Preserve paragraph breaks. Use [REDACTED] for blacked-out text. Use [HANDWRITTEN: ...] for marginalia. Do not summarize.",
    ),
  documentType: z
    .enum([
      "memo",
      "report",
      "letter",
      "transcript",
      "form",
      "press-release",
      "photograph",
      "diagram",
      "cover-page",
      "blank",
      "other",
    ])
    .describe("Best classification of what this single page is."),
  classification: z
    .enum([
      "UNCLASSIFIED",
      "CONFIDENTIAL",
      "SECRET",
      "TOP_SECRET",
      "DECLASSIFIED",
      "UNKNOWN",
    ])
    .describe(
      "Security classification stamped on the page, or UNKNOWN if absent.",
    ),
  inferredDate: z
    .string()
    .nullable()
    .describe(
      "ISO 8601 date (YYYY-MM-DD) inferred from the page if any date is visible. Null if no date.",
    ),
  redactionsPresent: z
    .boolean()
    .describe("True if any portion of the page is visibly redacted/blacked out."),
  pageSummary: z
    .string()
    .describe(
      "One- or two-sentence neutral summary of what this page contains.",
    ),
  entities: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum([
          "person",
          "organization",
          "place",
          "aircraft",
          "vessel",
          "date",
          "callsign",
          "case-number",
          "coordinate",
          "other",
        ]),
      }),
    )
    .describe(
      "Named entities mentioned on the page. Deduplicate within a page.",
    ),
  claims: z
    .array(
      z.object({
        text: z
          .string()
          .describe(
            "The claim VERBATIM as it appears in cleanedText. Must be a substring of cleanedText.",
          ),
        kind: z.enum(["factual", "witness", "speculation", "instruction"]),
      }),
    )
    .describe(
      "Atomic claims extracted from the page. Each claim should be a single self-contained statement, taken VERBATIM from cleanedText so we can locate its character offsets. Skip blank/cover/photograph pages — return [].",
    ),
});

export type PageExtraction = z.infer<typeof PageExtractionSchema>;

export type ExtractedClaim = {
  text: string;
  kind: PageExtraction["claims"][number]["kind"];
  charStart: number | null;
  charEnd: number | null;
};

export type ExtractedPage = Omit<PageExtraction, "claims"> & {
  claims: ExtractedClaim[];
  raw: unknown;
};

const SYSTEM = `You are a document analyst transcribing declassified U.S. government UFO/UAP files.
The page may be a typewritten memo, an FBI form, a witness statement, a photograph, or a redacted scan.
Read every visible character carefully — preserve names, dates, case numbers, and exact wording.

OCR rules:
- Output paragraphs and line breaks roughly as they appear.
- Mark blacked-out spans as [REDACTED].
- Mark handwritten margin notes as [HANDWRITTEN: ...].
- Mark unreadable text as [ILLEGIBLE].
- Do NOT paraphrase or summarize cleanedText. Transcribe.

Claim extraction rules:
- Each claim text MUST appear verbatim in cleanedText (we use string-search to locate it).
- One claim = one factual statement, witness assertion, instruction, or speculation.
- Skip pure boilerplate (page numbers, headers, "DECLASSIFIED" stamps).
- For pages that are blank, cover sheets, or pure photographs with no text, return claims: [].`;

export async function extractPageFromImage(opts: {
  imagePng: Buffer;
  pageNumber: number;
  documentTitle: string;
  totalPages: number;
}): Promise<ExtractedPage> {
  const { object, response } = await generateObject({
    model: geminiModel(),
    schema: PageExtractionSchema,
    schemaName: "PageExtraction",
    schemaDescription: "Structured extraction of a single PDF page.",
    temperature: 0.1,
    maxRetries: 2,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Document: "${opts.documentTitle}"\nPage ${opts.pageNumber} of ${opts.totalPages}\n\nExtract this page following the rules above.`,
          },
          {
            type: "image",
            image: opts.imagePng,
            mediaType: "image/png",
          },
        ],
      },
    ],
  });

  const claims: ExtractedClaim[] = object.claims.map((c) => {
    const idx = object.cleanedText.indexOf(c.text);
    return {
      text: c.text,
      kind: c.kind,
      charStart: idx >= 0 ? idx : null,
      charEnd: idx >= 0 ? idx + c.text.length : null,
    };
  });

  const { claims: _unused, ...rest } = object;
  void _unused;
  return {
    ...rest,
    claims,
    raw: { object, response: { id: response?.id, modelId: response?.modelId } },
  };
}

/**
 * Freeform description fallback for images that the strict structured-output
 * call refuses (typically photographs with little or no text). Returns the
 * same ExtractedPage shape so callers don't need to branch.
 */
export async function describeImageFreeform(opts: {
  imagePng: Buffer;
  documentTitle: string;
}): Promise<ExtractedPage> {
  const { text } = await generateText({
    model: geminiModel(),
    temperature: 0.2,
    maxRetries: 2,
    system: `You are a museum cataloger describing a single photograph or image for a public archive of declassified UAP/UFO records.

Write 2-4 short paragraphs covering:
1. What is visibly in the image (subject, framing, lighting, background, time of day if guessable).
2. Any visible text, captions, dates, signatures, redactions, or watermarks — quoted verbatim.
3. Any context clues that suggest the source (FBI photo file, NASA mission still, hand-drawn diagram, declassification stamp, etc.).

Be neutral and observational. Do not speculate about whether anything is real or extraterrestrial. Do not invent details.`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Title: "${opts.documentTitle}"\n\nDescribe this image.`,
          },
          { type: "image", image: opts.imagePng, mediaType: "image/png" },
        ],
      },
    ],
  });

  const description = (text ?? "").trim();
  return {
    cleanedText: description,
    documentType: "photograph",
    classification: "UNKNOWN",
    inferredDate: null,
    redactionsPresent: false,
    pageSummary:
      description.split(/\n+/)[0]?.slice(0, 280) ?? "Image with no visible text.",
    entities: [],
    claims: [],
    raw: { freeform: true, text: description },
  };
}
