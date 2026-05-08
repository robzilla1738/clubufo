import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  timestamp,
  date,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  customType,
  pgEnum,
} from "drizzle-orm/pg-core";

/** pgvector column wrapper. Stores N-dim vectors as text on the wire. */
const vector = (name: string, dims: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${dims})`;
    },
    toDriver(value: number[]) {
      return `[${value.join(",")}]`;
    },
    fromDriver(value: string) {
      return value
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map(Number);
    },
  })(name);

export const docStatus = pgEnum("doc_status", [
  "pending",
  "rendering",
  "extracting",
  "embedding",
  "ready",
  "partial",
  "failed",
]);

export const pageStatus = pgEnum("page_status", [
  "pending",
  "rendered",
  "extracted",
  "failed",
]);

export const claimKind = pgEnum("claim_kind", [
  "factual",
  "witness",
  "speculation",
  "instruction",
]);

export const mediaKind = pgEnum("media_kind", ["pdf", "image", "video"]);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    filename: text("filename").notNull(),
    sha256: text("sha256").notNull(),
    mediaKind: mediaKind("media_kind").default("pdf").notNull(),
    durationSec: integer("duration_sec"),
    fileUrl: text("file_url"),
    coverImageUrl: text("cover_image_url"),
    pageCount: integer("page_count"),
    fileSize: bigint("file_size", { mode: "number" }),
    summary: text("summary"),
    kicker: text("kicker"),
    agency: text("agency"),
    documentType: text("document_type"),
    incidentDate: date("incident_date"),
    incidentLocation: text("incident_location"),
    tags: text("tags").array().default(sql`'{}'::text[]`).notNull(),
    status: docStatus("status").default("pending").notNull(),
    error: text("error"),
    pagesProcessed: integer("pages_processed").default(0).notNull(),
    pagesFailed: integer("pages_failed").default(0).notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    /** Maintained by trigger; queried as ::tsvector. */
    searchTsv: text("search_tsv"),
  },
  (t) => [
    uniqueIndex("documents_sha256_uniq").on(t.sha256),
    index("documents_uploaded_at_idx").on(t.uploadedAt),
    index("documents_status_idx").on(t.status),
    index("documents_tags_gin").using("gin", t.tags),
  ],
);

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    page: integer("page").notNull(),
    imageUrl: text("image_url"),
    thumbUrl: text("thumb_url"),
    rawText: text("raw_text"),
    cleanedText: text("cleaned_text"),
    pageSummary: text("page_summary"),
    documentType: text("document_type"),
    classification: text("classification"),
    inferredDate: date("inferred_date"),
    redactions: boolean("redactions").default(false).notNull(),
    entities: jsonb("entities").$type<
      Array<{ name: string; type: string }>
    >(),
    rawExtraction: jsonb("raw_extraction"),
    status: pageStatus("status").default("pending").notNull(),
    error: text("error"),
    extractedAt: timestamp("extracted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("pages_doc_page_uniq").on(t.documentId, t.page),
    index("pages_status_idx").on(t.status),
  ],
);

export const claims = pgTable(
  "claims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    charStart: integer("char_start"),
    charEnd: integer("char_end"),
    kind: claimKind("kind").default("factual").notNull(),
    embedding: vector("embedding", 1536),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("claims_page_idx").on(t.pageId),
    index("claims_document_idx").on(t.documentId),
  ],
);

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    pageId: uuid("page_id").references(() => pages.id, {
      onDelete: "cascade",
    }),
    page: integer("page").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    tokenCount: integer("token_count"),
    embedding: vector("embedding", 1536),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("chunks_document_idx").on(t.documentId),
    index("chunks_doc_page_idx").on(t.documentId, t.page),
    index("chunks_page_idx").on(t.pageId),
  ],
);

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title"),
  documentId: uuid("document_id").references(() => documents.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const messageRole = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
]);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: messageRole("role").notNull(),
    content: text("content").notNull(),
    citations: jsonb("citations").$type<
      Array<{
        chunkId?: string;
        claimId?: string;
        pageId: string;
        documentId: string;
        documentTitle: string;
        page: number;
        snippet: string;
        imageUrl: string | null;
        thumbUrl: string | null;
      }>
    >(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("messages_conv_idx").on(t.conversationId, t.createdAt)],
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type Claim = typeof claims.$inferSelect;
export type NewClaim = typeof claims.$inferInsert;
export type Chunk = typeof chunks.$inferSelect;
export type NewChunk = typeof chunks.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
