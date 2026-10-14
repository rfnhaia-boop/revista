import { z } from "zod";

export const ARTICLE_AREAS = ["Psicologia", "Tecnologia", "Educação", "Sociedade", "Filosofia", "Negócios", "Literatura"] as const;
export const ARTICLE_KINDS = ["Ensaio", "Pesquisa teórica", "Resenha", "Reportagem", "Artigo"] as const;

export const MIN_BODY_CHARS = 800;

export const authorArticleSchema = z
  .object({
    id: z.string().uuid().optional(),
    action: z.enum(["save", "submit"]),
    title: z.string().trim().max(200),
    summary: z.string().trim().max(500),
    area: z.string().trim().max(60),
    kind: z.enum(ARTICLE_KINDS),
    authorName: z.string().trim().max(120),
    body: z.string().max(60000),
    referencesText: z.string().trim().max(4000),
  })
  .strict();

export type AuthorArticleInput = z.infer<typeof authorArticleSchema>;

/** Regras extras só no envio para revisão. Retorna a mensagem de erro ou null. */
export function validateForSubmit(p: AuthorArticleInput): string | null {
  if (p.area.length < 2) return "Informe a área do artigo (ex.: Educação).";
  if (p.title.length < 5) return "Dê um título ao artigo (mínimo 5 caracteres).";
  if (p.summary.length < 20) return "Escreva um resumo de pelo menos 20 caracteres.";
  if (p.authorName.length < 2) return "Informe o nome que aparecerá como autor.";
  if (p.body.trim().length < MIN_BODY_CHARS)
    return `O texto está curto. Escreva pelo menos ${MIN_BODY_CHARS} caracteres antes de enviar para revisão.`;
  return null;
}

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const readingMinutes = (body: string) =>
  Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 200));
