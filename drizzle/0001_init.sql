CREATE TYPE "public"."claim_kind" AS ENUM('factual', 'witness', 'speculation', 'instruction');--> statement-breakpoint
CREATE TYPE "public"."doc_status" AS ENUM('pending', 'rendering', 'extracting', 'embedding', 'ready', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."page_status" AS ENUM('pending', 'rendered', 'extracted', 'failed');--> statement-breakpoint
CREATE TABLE "chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"page_id" uuid,
	"page" integer NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"token_count" integer,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"text" text NOT NULL,
	"char_start" integer,
	"char_end" integer,
	"kind" "claim_kind" DEFAULT 'factual' NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"filename" text NOT NULL,
	"sha256" text NOT NULL,
	"file_url" text,
	"cover_image_url" text,
	"page_count" integer,
	"file_size" bigint,
	"summary" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "doc_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"pages_processed" integer DEFAULT 0 NOT NULL,
	"pages_failed" integer DEFAULT 0 NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"search_tsv" text
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"citations" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"page" integer NOT NULL,
	"image_url" text,
	"thumb_url" text,
	"raw_text" text,
	"cleaned_text" text,
	"page_summary" text,
	"document_type" text,
	"classification" text,
	"inferred_date" date,
	"redactions" boolean DEFAULT false NOT NULL,
	"entities" jsonb,
	"raw_extraction" jsonb,
	"status" "page_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"extracted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chunks_document_idx" ON "chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "chunks_doc_page_idx" ON "chunks" USING btree ("document_id","page");--> statement-breakpoint
CREATE INDEX "chunks_page_idx" ON "chunks" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "claims_page_idx" ON "claims" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "claims_document_idx" ON "claims" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_sha256_uniq" ON "documents" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX "documents_uploaded_at_idx" ON "documents" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_tags_gin" ON "documents" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "messages_conv_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_doc_page_uniq" ON "pages" USING btree ("document_id","page");--> statement-breakpoint
CREATE INDEX "pages_status_idx" ON "pages" USING btree ("status");