DROP INDEX "documents_sha256_uniq";--> statement-breakpoint
CREATE INDEX "documents_sha256_idx" ON "documents" USING btree ("sha256");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_filename_uniq" ON "documents" USING btree ("filename");