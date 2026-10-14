import { audit, json, readBody, requireStaffApi } from "@/lib/admin";
import { submissionDecisionSchema } from "@/lib/admin-validation";
import { database } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireStaffApi();
  if (me instanceof Response) return me;
  const { results } = await database()
    .prepare(
      "SELECT s.id,s.kind,s.title,s.area,s.author,s.summary,s.methodology,s.references_text AS \"references\",s.budget_cents AS budgetCents,s.status,s.review_note AS reviewNote,s.created_at AS createdAt,u.name AS ownerName,u.email AS ownerEmail FROM submissions s LEFT JOIN users u ON u.id=s.owner_id ORDER BY (s.status IN ('received','reviewing')) DESC, s.created_at DESC LIMIT 200",
    )
    .all();
  return json({ items: results });
}

export async function POST(request: Request) {
  const me = await requireStaffApi();
  if (me instanceof Response) return me;
  const body = await readBody(request, submissionDecisionSchema);
  if (body instanceof Response) return body;
  const db = database();
  const found = await db.prepare("SELECT id FROM submissions WHERE id=?").bind(body.id).first();
  if (!found) return json({ error: "Envio não encontrado." }, 404);
  await db.prepare("UPDATE submissions SET status=?,review_note=? WHERE id=?").bind(body.status, body.note, body.id).run();
  await audit(me.userId, body.id, "submission." + body.status);
  return json({ saved: true });
}
