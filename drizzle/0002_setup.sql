-- Enables pgvector + adds hand-tuned indexes that drizzle-kit can't generate.
-- Idempotent — safe to run repeatedly.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Maintain documents.search_tsv off title + summary + tags.
CREATE OR REPLACE FUNCTION documents_search_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_search_tsv_update ON documents;
CREATE TRIGGER documents_search_tsv_update
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION documents_search_tsv_trigger();

CREATE INDEX IF NOT EXISTS documents_search_tsv_idx
  ON documents USING GIN ((search_tsv::tsvector));

CREATE INDEX IF NOT EXISTS documents_title_trgm_idx
  ON documents USING GIN (title gin_trgm_ops);

-- Per-chunk content tsvector (computed in queries) -- index as expression GIN.
CREATE INDEX IF NOT EXISTS chunks_content_tsv_idx
  ON chunks USING GIN (to_tsvector('english', content));

-- Per-claim text tsvector for keyword search over atomic claims.
CREATE INDEX IF NOT EXISTS claims_text_tsv_idx
  ON claims USING GIN (to_tsvector('english', text));

-- HNSW indexes for fast cosine similarity.
CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx
  ON chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS claims_embedding_hnsw_idx
  ON claims USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
