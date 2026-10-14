import { audit, json, readBody, requireStaffApi } from "@/lib/admin";
import { thoughtModerationSchema } from "@/lib/admin-validation";
import { database } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireStaffApi();
  if (me instanceof Response) return me;
  const { results } = await database()
    .prepare(
      "SELECT n.id,n.title,n.excerpt,n.format,n.area,n.status,n.created_at AS createdAt,p.name,p.slug FROM notebooks n JOIN profiles p ON p.id=n.profile_id WHERE n.status IN ('published','hidden') ORDER BY n.created_at DESC LIMIT 200",
    )
    .all();
  return json({ items: results });
}

export async function POST(request: Request) {
  const me = await requireStaffApi();
  if (me instanceof Response) return me;
  const body = await readBody(request, thoughtModerationSchema);
  if (body instanceof Response) return body;
  const db = database();
  const row = await db.prepare("SELECT status FROM notebooks WHERE id=?").bind(body.id).first<{ status: string }>();
  if (!row || !["published", "hidden"].includes(row.status)) return json({ error: "Texto não encontrado." }, 404);
  await db
    .prepare("UPDATE notebooks SET status=?,updated_at=? WHERE id=?")
    .bind(body.hidden ? "hidden" : "published", new Date().toISOString(), body.id)
    .run();
  await audit(me.userId, body.id, body.hidden ? "thought.hidden" : "thought.restored");
  return json({ saved: true });
}
