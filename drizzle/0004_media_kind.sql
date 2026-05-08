CREATE TYPE "public"."media_kind" AS ENUM('pdf', 'image', 'video');--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "media_kind" "media_kind" DEFAULT 'pdf' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "duration_sec" integer;