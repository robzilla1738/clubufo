import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL ?? "");
  return _sql;
}

export type SearchHit = {
  chunkId?: string;
  claimId?: string;
  pageId: string;
  documentId: string;
  documentTitle: string;
  page: number;
  content: string;
  imageUrl: string | null;
  thumbUrl: string | null;
  charStart: number | null;
  charEnd: number | null;
  score: number;
  source: "chunk" | "claim";
};

/**
 * Hybrid search across chunks AND claims, fused by reciprocal rank.
 * Both indexes use cosine similarity. Claims also get a keyword pass.
 * Returns the top `k` results.
 */
export async function hybridSearch(opts: {
  query: string;
  embedding: number[];
  k?: number;
  documentId?: string;
  perSignal?: number;
}): Promise<SearchHit[]> {
  const k = opts.k ?? 8;
  const perSignal = opts.perSignal ?? 15;
  const emb = `[${opts.embedding.join(",")}]`;
  const docFilter = opts.documentId ? "AND c.document_id = $2::uuid" : "";
  const params: unknown[] = [emb];
  if (opts.documentId) params.push(opts.documentId);

  const chunkRows = (await sql().query(
    `SELECT
       'chunk'::text AS source,
       c.id, c.document_id, c.page_id, c.page, c.content,
       NULL::int AS char_start, NULL::int AS char_end,
       COALESCE(d.kicker, d.title) AS title, p.image_url, p.thumb_url
     FROM chunks c
     JOIN documents d ON d.id = c.document_id
     LEFT JOIN pages p ON p.id = c.page_id
     WHERE d.status IN ('ready','partial')
       AND c.embedding IS NOT NULL
       ${docFilter}
     ORDER BY c.embedding <=> $1::vector
     LIMIT ${perSignal}`,
    params,
  )) as Array<Record<string, unknown>>;

  const claimRows = (await sql().query(
    `SELECT
       'claim'::text AS source,
       cl.id, cl.document_id, cl.page_id, p.page, cl.text AS content,
       cl.char_start, cl.char_end,
       COALESCE(d.kicker, d.title) AS title, p.image_url, p.thumb_url
     FROM claims cl
     JOIN documents d ON d.id = cl.document_id
     JOIN pages p ON p.id = cl.page_id
     WHERE d.status IN ('ready','partial')
       AND cl.embedding IS NOT NULL
       ${docFilter.replace("c.document_id", "cl.document_id")}
     ORDER BY cl.embedding <=> $1::vector
     LIMIT ${perSignal}`,
    params,
  )) as Array<Record<string, unknown>>;

  const queryClean = opts.query.trim();
  const chunkKeywordRows: Array<Record<string, unknown>> =
    queryClean.length > 1
      ? ((await sql().query(
          `SELECT
             'chunk'::text AS source,
             c.id, c.document_id, c.page_id, c.page, c.content,
             NULL::int AS char_start, NULL::int AS char_end,
             COALESCE(d.kicker, d.title) AS title, p.image_url, p.thumb_url,
             ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', $1)) AS rank
           FROM chunks c
           JOIN documents d ON d.id = c.document_id
           LEFT JOIN pages p ON p.id = c.page_id
           WHERE d.status IN ('ready','partial')
             ${opts.documentId ? "AND c.document_id = $2::uuid" : ""}
             AND to_tsvector('english', c.content) @@ plainto_tsquery('english', $1)
           ORDER BY rank DESC
           LIMIT ${perSignal}`,
          opts.documentId ? [queryClean, opts.documentId] : [queryClean],
        )) as Array<Record<string, unknown>>)
      : [];

  const claimKeywordRows: Array<Record<string, unknown>> =
    queryClean.length > 1
      ? ((await sql().query(
          `SELECT
             'claim'::text AS source,
             cl.id, cl.document_id, cl.page_id, p.page, cl.text AS content,
             cl.char_start, cl.char_end,
             COALESCE(d.kicker, d.title) AS title, p.image_url, p.thumb_url,
             ts_rank(to_tsvector('english', cl.text), plainto_tsquery('english', $1)) AS rank
           FROM claims cl
           JOIN documents d ON d.id = cl.document_id
           JOIN pages p ON p.id = cl.page_id
           WHERE d.status IN ('ready','partial')
             ${opts.documentId ? "AND cl.document_id = $2::uuid" : ""}
             AND to_tsvector('english', cl.text) @@ plainto_tsquery('english', $1)
           ORDER BY rank DESC
           LIMIT ${perSignal}`,
          opts.documentId ? [queryClean, opts.documentId] : [queryClean],
        )) as Array<Record<string, unknown>>)
      : [];

  const RRF_K = 60;
  const scores = new Map<string, { hit: SearchHit; score: number }>();

  function add(rows: Array<Record<string, unknown>>) {
    rows.forEach((row, idx) => {
      const id = `${row.source}:${row.id}`;
      const inc = 1 / (RRF_K + idx + 1);
      const existing = scores.get(id);
      if (existing) {
        existing.score += inc;
        return;
      }
      const isClaim = row.source === "claim";
      scores.set(id, {
        score: inc,
        hit: {
          [isClaim ? "claimId" : "chunkId"]: row.id as string,
          pageId: row.page_id as string,
          documentId: row.document_id as string,
          documentTitle: row.title as string,
          page: Number(row.page),
          content: row.content as string,
          imageUrl: (row.image_url as string) ?? null,
          thumbUrl: (row.thumb_url as string) ?? null,
          charStart: (row.char_start as number) ?? null,
          charEnd: (row.char_end as number) ?? null,
          score: 0,
          source: row.source as "chunk" | "claim",
        } as SearchHit,
      });
    });
  }

  add(chunkRows);
  add(claimRows);
  add(chunkKeywordRows);
  add(claimKeywordRows);

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => ({ ...s.hit, score: s.score }));
}
