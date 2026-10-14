import { audit, json, readBody, requireStaffApi } from "@/lib/admin";
import { questionDecisionSchema } from "@/lib/admin-validation";
import { database } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireStaffApi();
  if (me instanceof Response) return me;
  const { results } = await database()
    .prepare(
      "SELECT q.id,q.title,q.context,q.importance,q.status,q.review_note AS reviewNote,q.created_at AS createdAt,u.name,u.email FROM community_questions q LEFT JOIN users u ON u.id=q.owner_id ORDER BY (q.status IN ('submitted','reviewing')) DESC, q.created_at DESC LIMIT 200",
    )
    .all();
  return json({ items: results });
}

export async function POST(request: Request) {
  const me = await requireStaffApi();
  if (me instanceof Response) return me;
  const body = await readBody(request, questionDecisionSchema);
  if (body instanceof Response) return body;
  const db = database();
  const found = await db.prepare("SELECT id FROM community_questions WHERE id=?").bind(body.id).first();
  if (!found) return json({ error: "Pergunta não encontrada." }, 404);
  await db
    .prepare("UPDATE community_questions SET status=?,review_note=?,updated_at=? WHERE id=?")
    .bind(body.status, body.note, new Date().toISOString(), body.id)
    .run();
  await audit(me.userId, body.id, "question." + body.status);
  return json({ saved: true });
}
