import { audit, json, readBody, requireStaffApi } from "@/lib/admin";
import { articleSchema } from "@/lib/admin-validation";
import { database } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireStaffApi();
  if (me instanceof Response) return me;
  const { results } = await database()
    .prepare(
      "SELECT id,slug,title,summary,area,kind,author_name AS authorName,reading_minutes AS readingMinutes,kicker,sort_order AS sortOrder,body,pullquote,references_text AS referencesText,status_note AS statusNote,version_note AS versionNote,status,published_at AS publishedAt,updated_at AS updatedAt FROM articles WHERE author_id IS NULL OR status <> 'draft' ORDER BY sort_order ASC, created_at DESC LIMIT 300",
    )
    .all();
  return json({ items: results });
}

export async function POST(request: Request) {
  const me = await requireStaffApi();
  if (me instanceof Response) return me;
  const p = await readBody(request, articleSchema);
  if (p instanceof Response) return p;
  const db = database();
  const now = new Date().toISOString();
  const clash = await db
    .prepare("SELECT id FROM articles WHERE slug=?")
    .bind(p.slug)
    .first<{ id: string }>();
  if (clash && clash.id !== p.id) return json({ error: "Já existe uma matéria com este endereço." }, 409);

  let id = p.id;
  if (id) {
    const existing = await db
      .prepare("SELECT status,published_at AS publishedAt FROM articles WHERE id=?")
      .bind(id)
      .first<{ status: string; publishedAt: string | null }>();
    if (!existing) return json({ error: "Matéria não encontrada." }, 404);
    const publishedAt = p.status === "published" ? (existing.publishedAt ?? now) : existing.publishedAt;
    await db
      .prepare(
        "UPDATE articles SET slug=?,title=?,summary=?,area=?,kind=?,author_name=?,reading_minutes=?,kicker=?,sort_order=?,body=?,pullquote=?,references_text=?,status_note=?,version_note=?,status=?,published_at=?,updated_at=? WHERE id=?",
      )
      .bind(p.slug, p.title, p.summary, p.area, p.kind, p.authorName, p.readingMinutes, p.kicker, p.sortOrder, p.body, p.pullquote, p.referencesText, p.statusNote, p.versionNote, p.status, publishedAt, now, id)
      .run();
  } else {
    id = crypto.randomUUID();
    await db
      .prepare(
        "INSERT INTO articles (id,slug,title,summary,area,kind,author_name,reading_minutes,kicker,sort_order,body,pullquote,references_text,status_note,version_note,status,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      )
      .bind(id, p.slug, p.title, p.summary, p.area, p.kind, p.authorName, p.readingMinutes, p.kicker, p.sortOrder, p.body, p.pullquote, p.referencesText, p.statusNote, p.versionNote, p.status, p.status === "published" ? now : null, now, now)
      .run();
  }
  await audit(me.userId, id, "article." + p.status);
  return json({ saved: true, id, slug: p.slug });
}
