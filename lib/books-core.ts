import { z } from "zod";

export const LICENSES = ["public_domain", "licensed", "original"] as const;
export type License = (typeof LICENSES)[number];
export const LICENSE_LABEL: Record<License, string> = {
  public_domain: "Domínio público",
  licensed: "Licenciada",
  original: "Obra original da NEW",
};
export const NOTE_TAGS = ["Memória", "Narrador", "Psicologia", "Linguagem", "Dúvida"] as const;

/** Parágrafos de um capítulo: blocos separados por linha em branco. O índice é o endereço da nota. */
export function splitParagraphs(body: string): string[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

export type ParsedChapter = { title: string; body: string };

/**
 * Lê o livro colado em Markdown simples: cada linha "# Título" abre um capítulo.
 * Texto antes do primeiro título é ignorado.
 */
export function parseChapters(markdown: string): ParsedChapter[] {
  const out: ParsedChapter[] = [];
  let cur: { title: string; lines: string[] } | null = null;
  for (const line of markdown.replace(/\r\n/g, "\n").split("\n")) {
    const m = line.match(/^#\s+(.+?)\s*$/);
    if (m) {
      if (cur) out.push({ title: cur.title, body: cur.lines.join("\n").trim() });
      cur = { title: m[1].slice(0, 160), lines: [] };
    } else if (cur) cur.lines.push(line);
  }
  if (cur) out.push({ title: cur.title, body: cur.lines.join("\n").trim() });
  return out.filter((c) => splitParagraphs(c.body).length > 0);
}

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const id = z.string().uuid();

export const bookSchema = z
  .object({
    title: text(2, 160),
    author: text(2, 120),
    year: z.number().int().min(1000).max(2100).nullable(),
    description: z.string().trim().max(1200).default(""),
    license: z.enum(LICENSES),
    licenseNote: text(10, 1000),
    text: z.string().max(3_000_000),
  })
  .strict();

export const bookActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), book: bookSchema }).strict(),
  z.object({ action: z.literal("update"), id, book: bookSchema }).strict(),
  z.object({ action: z.literal("publish"), id }).strict(),
  z.object({ action: z.literal("unpublish"), id }).strict(),
]);

export const readerActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("note"), bookId: id, chapter: z.number().int().min(1).max(5000), paragraph: z.number().int().min(0).max(5000), body: text(1, 2000), tag: z.enum(NOTE_TAGS).or(z.literal("")) }).strict(),
  z.object({ action: z.literal("delete-note"), id }).strict(),
  z.object({ action: z.literal("toggle-mark"), bookId: id, chapter: z.number().int().min(1).max(5000), paragraph: z.number().int().min(0).max(5000) }).strict(),
  z.object({ action: z.literal("progress"), bookId: id, chapter: z.number().int().min(1).max(5000), paragraph: z.number().int().min(0).max(5000) }).strict(),
]);

/** Citação em Markdown, pronta para colar num artigo ou pensamento. */
export function citationMarkdown(q: { quote: string; author: string; title: string; chapterTitle: string; url: string }) {
  const quote = q.quote.replace(/\n+/g, " ").trim();
  return `> ${quote}\n>\n> — ${q.author}, [${q.title}](${q.url}), ${q.chapterTitle}\n\n`;
}
