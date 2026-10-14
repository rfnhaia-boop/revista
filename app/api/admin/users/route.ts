import { audit, json, readBody, requireStaffApi } from "@/lib/admin";
import { userRoleSchema } from "@/lib/admin-validation";
import { database } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireStaffApi(true);
  if (me instanceof Response) return me;
  const { results } = await database()
    .prepare(
      "SELECT u.id,u.name,u.email,u.created_at AS createdAt,COALESCE(m.role,'member') AS role FROM users u LEFT JOIN member_accounts m ON m.owner_id=u.id ORDER BY u.created_at DESC LIMIT 500",
    )
    .all();
  return json({ items: results, meId: me.userId });
}

export async function POST(request: Request) {
  const me = await requireStaffApi(true);
  if (me instanceof Response) return me;
  const body = await readBody(request, userRoleSchema);
  if (body instanceof Response) return body;
  if (body.userId === me.userId) return json({ error: "Você não pode alterar o próprio papel." }, 400);
  const db = database();
  const target = await db.prepare("SELECT id FROM users WHERE id=?").bind(body.userId).first();
  if (!target) return json({ error: "Usuário não encontrado." }, 404);
  const now = new Date().toISOString();
  await db
    .prepare(
      "INSERT INTO member_accounts (owner_id,role,created_at,updated_at) VALUES (?,?,?,?) ON CONFLICT (owner_id) DO UPDATE SET role=excluded.role,updated_at=excluded.updated_at",
    )
    .bind(body.userId, body.role, now, now)
    .run();
  await audit(me.userId, body.userId, "user.role." + body.role);
  return json({ saved: true });
}
