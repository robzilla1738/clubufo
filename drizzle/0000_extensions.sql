-- Required extensions. Must run BEFORE the schema migration since chunks/claims
-- use the vector(1536) type from pgvector.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
