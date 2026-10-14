import { database } from "@/lib/storage";
import type { Article } from "@/lib/article-types";

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

export async function listPublishedArticles(): Promise<Article[]> {
  try {
    const { results } = await database()
      .prepare(`SELECT ${COLUMNS} FROM articles WHERE status='published' ORDER BY sort_order ASC, published_at DESC`)
      .all<Row>();
    return results.map(toArticle);
  } catch {
    return [];
  }
}

export async function getPublishedArticle(slug: string): Promise<Article | null> {
  try {
    const row = await database()
      .prepare(`SELECT ${COLUMNS} FROM articles WHERE slug=? AND status='published'`)
      .bind(slug)
      .first<Row>();
    return row ? toArticle(row) : null;
  } catch {
    return null;
  }
}
