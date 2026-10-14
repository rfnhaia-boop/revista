import { randomBytes } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { audit, json, readBody } from "@/lib/admin";
import { authorArticleSchema, readingMinutes, slugify, validateForSubmit } from "@/lib/author-validation";
import { tooMany } from "@/lib/rate-limit";
import { database } from "@/lib/storage";
import { validOrigin } from "@/lib/validation";

export const dynamic = "force-dynamic";

const EDITABLE = ["draft", "changes_requested"];
const COLS =
  "id,slug,title,summary,area,kind,author_name AS authorName,body,references_text AS referencesText,status,review_note AS reviewNote,updated_at AS updatedAt,submitted_at AS submittedAt";

/** GET /api/articles → meus artigos · GET /api/articles?id=… → um artigo meu, completo. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  const id = new URL(request.url).searchParams.get("id");
  const db = database();
  if (id) {
    const row = await db.prepare(`SELECT ${COLS} FROM articles WHERE id=? AND author_id=?`).bind(id, user.userId).first();
    return row ? json({ item: row }) : json({ error: "Artigo não encontrado." }, 404);
  }
  const { results } = await db
    .prepare(
      "SELECT id,slug,title,status,review_note AS reviewNote,updated_at AS updatedAt,submitted_at AS submittedAt FROM articles WHERE author_id=? ORDER BY updated_at DESC LIMIT 100",
    )
    .bind(user.userId)
    .all();
  return json({ items: results });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  const p = await readBody(request, authorArticleSchema);
  if (p instanceof Response) return p;
  if (tooMany("article-save:" + user.userId, 120, 10 * 60_000))
    return json({ error: "Muitas gravações seguidas. Aguarde um instante." }, 429);

  if (p.action === "submit") {
    const problem = validateForSubmit(p);
    if (problem) return json({ error: problem }, 400);
  }

  const db = database();
  const now = new Date().toISOString();
  const minutes = readingMinutes(p.body);
  let id = p.id;
  let slug = "";
  let status = p.action === "submit" ? "submitted" : "draft";

  if (id) {
    const existing = await db
      .prepare("SELECT status,slug FROM articles WHERE id=? AND author_id=?")
      .bind(id, user.userId)
      .first<{ status: string; slug: string }>();
    if (!existing) return json({ error: "Artigo não encontrado." }, 404);
    if (!EDITABLE.includes(existing.status))
      return json({ error: "Este artigo já foi enviado e não pode ser editado agora." }, 409);
    slug = existing.slug;
    if (p.action === "save") status = existing.status; // mantém "ajustes pedidos" até reenviar
    await db
      .prepare(
        "UPDATE articles SET title=?,summary=?,area=?,kind=?,author_name=?,reading_minutes=?,kicker=?,body=?,references_text=?,status=?,submitted_at=?,updated_at=? WHERE id=? AND author_id=?",
      )
      .bind(
        p.title, p.summary, p.area, p.kind, p.authorName || user.displayName, minutes, p.area.toUpperCase().slice(0, 40), p.body,
        p.referencesText, status, p.action === "submit" ? now : null, now, id, user.userId,
      )
      .run();
  } else {
    const count = await db
      .prepare("SELECT COUNT(*) AS n FROM articles WHERE author_id=? AND created_at>?")
      .bind(user.userId, new Date(Date.now() - 3600000).toISOString())
      .first<{ n: number }>();
    if ((count?.n ?? 0) >= 10) return json({ error: "Limite de novos artigos por hora atingido." }, 429);
    id = crypto.randomUUID();
    const base = slugify(p.title) || "artigo";
    for (let i = 0; i < 5; i++) {
      const candidate = `${base}-${randomBytes(3).toString("hex")}`;
      const taken = await db.prepare("SELECT id FROM articles WHERE slug=?").bind(candidate).first();
      if (!taken) {
        slug = candidate;
        break;
      }
    }
    if (!slug) return json({ error: "Não foi possível gerar o endereço do artigo." }, 500);
    await db
      .prepare(
        "INSERT INTO articles (id,slug,title,summary,area,kind,author_name,reading_minutes,kicker,sort_order,body,pullquote,references_text,status_note,version_note,status,author_id,review_note,submitted_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,0,?,'',?,?,?,?,?,'',?,?,?)",
      )
      .bind(
        id, slug, p.title, p.summary, p.area, p.kind, p.authorName || user.displayName, minutes, p.area.toUpperCase().slice(0, 40), p.body,
        p.referencesText, "Não revisado por pares.", "", status, user.userId, p.action === "submit" ? now : null, now, now,
      )
      .run();
  }
  if (p.action === "submit") await audit(user.userId, id, "article.submitted");
  return json({ saved: true, id, slug, status, updatedAt: now });
}

/** Autor apaga o próprio rascunho. */
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "Informe o artigo." }, 400);
  const db = database();
  const row = await db
    .prepare("SELECT status FROM articles WHERE id=? AND author_id=?")
    .bind(id, user.userId)
    .first<{ status: string }>();
  if (!row) return json({ error: "Artigo não encontrado." }, 404);
  if (row.status !== "draft") return json({ error: "Só rascunhos podem ser apagados." }, 409);
  await db.prepare("DELETE FROM articles WHERE id=? AND author_id=?").bind(id, user.userId).run();
  await audit(user.userId, id, "article.deleted");
  return json({ deleted: true });
}
