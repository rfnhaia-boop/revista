import { database } from "@/lib/storage";
import type { Article } from "@/lib/article-types";
import { cache } from "react";
import { editorialSeed, SEED_PULL, SEED_VERSION } from "./editorial-seed.mjs";

type Row = {
  slug: string; title: string; summary: string; area: string; kind: string; authorName: string;
  readingMinutes: number; kicker: string; sortOrder: number; body: string; pullquote: string;
  referencesText: string; statusNote: string; versionNote: string; publishedAt: string;
};

const COLUMNS =
  "slug,title,summary,area,kind,author_name AS authorName,reading_minutes AS readingMinutes,kicker,sort_order AS sortOrder,body,pullquote,references_text AS referencesText,status_note AS statusNote,version_note AS versionNote,published_at AS publishedAt";

const toArticle = (r: Row): Article => ({
  slug: r.slug,
  title: r.title,
  summary: r.summary,
  area: r.area,
  type: r.kind,
  author: r.authorName,
  time: `${r.readingMinutes} min`,
  kicker: r.kicker,
  number: r.sortOrder,
  body: r.body,
  pullquote: r.pullquote,
  references: r.referencesText,
  statusNote: r.statusNote,
  versionNote: r.versionNote,
  publishedAt: r.publishedAt,
});

const seededArticles = () => editorialSeed.map((article) => toArticle({
  ...article,
  pullquote: article.pullquote ?? SEED_PULL,
  statusNote: article.statusNote ?? "Não revisado por pares.",
  versionNote: article.versionNote ?? SEED_VERSION,
  publishedAt: article.publishedAt ?? "2026-10-08T12:00:00.000Z",
}));

export const listPublishedArticles = cache(async function listPublishedArticles(): Promise<Article[]> {
  try {
    const { results } = await database()
      .prepare(`SELECT ${COLUMNS} FROM articles WHERE status='published' ORDER BY sort_order ASC, published_at DESC`)
      .all<Row>();
    return results.length ? results.map(toArticle) : seededArticles();
  } catch {
    return seededArticles();
  }
});

export const getPublishedArticle = cache(async function getPublishedArticle(slug: string): Promise<Article | null> {
  if (!/^[a-z0-9][a-z0-9-]{0,199}$/.test(slug)) return null;
  try {
    const row = await database()
      .prepare(`SELECT ${COLUMNS} FROM articles WHERE slug=? AND status='published'`)
      .bind(slug)
      .first<Row>();
    return row ? toArticle(row) : (await listPublishedArticles()).find((article) => article.slug === slug) ?? null;
  } catch {
    return (await listPublishedArticles()).find((article) => article.slug === slug) ?? null;
  }
});
