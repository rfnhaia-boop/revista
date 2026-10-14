import { json, readBody, requireStaffApi } from "@/lib/admin";
import { requestDecisionSchema } from "@/lib/admin-validation";
import { database } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireStaffApi(true);
  if (me instanceof Response) return me;
  const { results } = await database()
    .prepare(
      "SELECT r.id,r.requested_role AS requestedRole,r.presentation,r.experience,r.portfolio,r.motivation,r.status,r.review_note AS reviewNote,r.created_at AS createdAt,u.name,u.email,COALESCE(m.role,'member') AS currentRole FROM role_requests r LEFT JOIN users u ON u.id=r.owner_id LEFT JOIN member_accounts m ON m.owner_id=r.owner_id ORDER BY (r.status IN ('submitted','reviewing','changes_requested')) DESC, r.created_at DESC LIMIT 200",
    )
    .all();
  return json({ items: results });
}

const nextStatus = { approve: "approved", reviewing: "reviewing", changes: "changes_requested", reject: "rejected" } as const;

export async function POST(request: Request) {
  const me = await requireStaffApi(true);
  if (me instanceof Response) return me;
  const body = await readBody(request, requestDecisionSchema);
  if (body instanceof Response) return body;
  const db = database();
  const req = await db
    .prepare("SELECT owner_id AS ownerId,requested_role AS requestedRole,status FROM role_requests WHERE id=?")
    .bind(body.id)
    .first<{ ownerId: string; requestedRole: string; status: string }>();
  if (!req) return json({ error: "Pedido não encontrado." }, 404);
  if (!["submitted", "reviewing", "changes_requested"].includes(req.status))
    return json({ error: "Este pedido já foi decidido." }, 409);
  const now = new Date().toISOString();
  const status = nextStatus[body.decision];
  const stmts = [
    db
      .prepare("UPDATE role_requests SET status=?,review_note=?,updated_at=? WHERE id=?")
      .bind(status, body.note, now, body.id),
  ];
  if (body.decision === "approve")
    stmts.push(
      db
        .prepare(
          "INSERT INTO member_accounts (owner_id,role,created_at,updated_at) VALUES (?,?,?,?) ON CONFLICT (owner_id) DO UPDATE SET role=CASE WHEN member_accounts.role IN ('admin','editorial') THEN member_accounts.role ELSE excluded.role END,updated_at=excluded.updated_at",
        )
        .bind(req.ownerId, req.requestedRole, now, now),
    );
  stmts.push(
    db
      .prepare("INSERT INTO audit_events (id,owner_id,entity_id,action,created_at) VALUES (?,?,?,?,?)")
      .bind(crypto.randomUUID(), me.userId, body.id, "role-request." + status, now),
  );
  await db.batch(stmts);
  return json({ saved: true, status });
}
