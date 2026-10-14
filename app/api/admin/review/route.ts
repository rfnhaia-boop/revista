import { audit, json, readBody, requireStaffApi } from "@/lib/admin";
import { articleReviewSchema } from "@/lib/admin-validation";
import { database } from "@/lib/storage";

export const dynamic = "force-dynamic";

const OPEN = ["submitted", "reviewing"];

export async function GET() {
  const me = await requireStaffApi();
  if (me instanceof Response) return me;
  const { results } = await database()
    .prepare(
      "SELECT a.id,a.slug,a.title,a.summary,a.area,a.kind,a.author_name AS authorName,a.body,a.references_text AS referencesText,a.reading_minutes AS readingMinutes,a.status,a.review_note AS reviewNote,a.submitted_at AS submittedAt,a.updated_at AS updatedAt,u.name AS ownerName,u.email AS ownerEmail FROM articles a JOIN users u ON u.id=a.author_id WHERE a.status IN ('submitted','reviewing','changes_requested','rejected') ORDER BY (a.status IN ('submitted','reviewing')) DESC, a.submitted_at DESC NULLS LAST, a.updated_at DESC LIMIT 200",
    )
    .all();
  return json({ items: results });
}

export async function POST(request: Request) {
  const me = await requireStaffApi();
  if (me instanceof Response) return me;
  const body = await readBody(request, articleReviewSchema);
  if (body instanceof Response) return body;
  const db = database();
  const art = await db
    .prepare("SELECT status FROM articles WHERE id=? AND author_id IS NOT NULL")
    .bind(body.id)
    .first<{ status: string }>();
  if (!art) return json({ error: "Artigo não encontrado." }, 404);
  if (!OPEN.includes(art.status)) return json({ error: "Este artigo não está aguardando decisão." }, 409);
  if ((body.decision === "changes" || body.decision === "reject") && body.note.length < 5)
    return json({ error: "Explique o motivo na nota para o autor." }, 400);

  const now = new Date().toISOString();
  if (body.decision === "publish") {
    const date = new Date().toLocaleDateString("pt-BR");
    await db
      .prepare(
        "UPDATE articles SET status='published',published_at=?,sort_order=(SELECT COALESCE(MAX(sort_order),0)+1 FROM articles WHERE status='published'),status_note='Revisão editorial NEW. Não revisado por pares.',version_note=?,review_note=?,updated_at=? WHERE id=?",
      )
      .bind(now, `Publicado após revisão editorial · ${date}`, body.note, now, body.id)
      .run();
  } else {
    const status = { reviewing: "reviewing", changes: "changes_requested", reject: "rejected" }[body.decision];
    await db.prepare("UPDATE articles SET status=?,review_note=?,updated_at=? WHERE id=?").bind(status, body.note, now, body.id).run();
  }
  await audit(me.userId, body.id, "article.review." + body.decision);
  return json({ saved: true });
}
