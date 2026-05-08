# ClubUFO

A reading room for the unexplained — a curated archive of declassified UFO
documents, sightings, and field reports. Browse the corpus, or chat with it via
RAG over Neon Postgres + pgvector.

## Stack

- Next.js 15 · React 19 · TypeScript
- Tailwind v4 + shadcn/ui (dark-first, editorial)
- Neon Postgres + pgvector (HNSW index, hybrid keyword + vector search)
- Drizzle ORM + drizzle-kit migrations
- AI SDK 6 — DeepSeek for chat, OpenAI `text-embedding-3-small` for embeddings
- `unpdf` for serverless-friendly PDF extraction
- Vercel Blob (optional) for storing the originals

## First-time setup

```bash
pnpm install
cp .env.example .env.local      # fill in DATABASE_URL, DEEPSEEK_API_KEY, OPENAI_API_KEY, ADMIN_PASSWORD

pnpm db:push                    # create tables in Neon
pnpm db:setup                   # enables pgvector + HNSW + tsvector indexes
```

## Bulk-ingest the 161 PDFs

```bash
pnpm ingest /path/to/pdfs --concurrency=2 --tag=declassified
```

Skips files whose filename already exists. Logs `pages × chunks × ms` per file.

## Run

```bash
pnpm dev          # http://localhost:3000
pnpm build        # production build
pnpm db:studio    # drizzle-kit studio against Neon
```

## Routes

| Path | Purpose |
|---|---|
| `/` | Hero + featured docs |
| `/library` | All documents with search + sort |
| `/library/[id]` | Document detail with paginated chunk reader |
| `/chat` | Streaming chat with citations |
| `/chat?doc=<id>` | Chat scoped to a single document |
| `/admin/ingest` | Drag-and-drop upload (basic-auth via `ADMIN_PASSWORD`) |
| `/api/chat` | RAG endpoint — embed query → hybrid search → DeepSeek |
| `/api/documents` | List/search documents (used by ⌘K palette) |

## Notes

- The chat answer cites sources as `[1]`, `[2]` — the UI maps those to the
  exact page in the source PDF.
- Admin routes are gated by HTTP Basic auth; the username is ignored, only
  `ADMIN_PASSWORD` is checked.
- HNSW index is configured for `m=16, ef_construction=64` — fine up to ~1M
  embeddings.

## Disclaimer

Documents are collected from public, declassified, and citizen-submitted
sources. The chat assistant generates prose grounded in the corpus; always
verify against the cited source.
