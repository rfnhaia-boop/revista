// Insere os artigos editoriais iniciais (idempotente: ignora slugs existentes).
import { randomUUID } from "node:crypto";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL ausente");

import { editorialSeed as articles, SEED_VERSION as VERSION, SEED_PULL as PULL } from "../lib/editorial-seed.mjs";

const client = new pg.Client({ connectionString: url });
await client.connect();
const now = new Date().toISOString();
for (const a of articles) {
  const r = await client.query(
    `INSERT INTO articles (id,slug,title,summary,area,kind,author_name,reading_minutes,kicker,sort_order,body,pullquote,references_text,status_note,version_note,status,published_at,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'published',$16,$16,$16)
     ON CONFLICT (slug) DO NOTHING`,
    [randomUUID(), a.slug, a.title, a.summary, a.area, a.kind, a.authorName, a.readingMinutes, a.kicker, a.sortOrder,
     a.body, PULL, a.referencesText, "Não revisado por pares.", VERSION, "2026-10-08T12:00:00.000Z"],
  );
  console.log(r.rowCount ? "inserido" : "já existia", a.slug);
}
void now;
await client.end();
