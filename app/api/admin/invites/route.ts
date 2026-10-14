import { createHash, randomBytes } from "node:crypto";
import { audit, json, readBody, requireStaffApi } from "@/lib/admin";
import { inviteSchema } from "@/lib/admin-validation";
import { database } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireStaffApi(true);
  if (me instanceof Response) return me;
  const { results } = await database()
    .prepare(
      "SELECT i.id,i.email,i.role,i.status,i.expires_at AS expiresAt,i.created_at AS createdAt,u.name AS acceptedName FROM creator_invitations i LEFT JOIN users u ON u.id=i.accepted_by ORDER BY i.created_at DESC LIMIT 200",
    )
    .all();
  return json({ items: results });
}

export async function POST(request: Request) {
  const me = await requireStaffApi(true);
  if (me instanceof Response) return me;
  const body = await readBody(request, inviteSchema);
  if (body instanceof Response) return body;
  const db = database();
  const now = new Date();
  if (body.action === "revoke") {
    await db.prepare("UPDATE creator_invitations SET status='revoked' WHERE id=? AND status='open'").bind(body.id).run();
    await audit(me.userId, body.id, "invite.revoked");
    return json({ saved: true });
  }
  const token = randomBytes(24).toString("base64url");
  const id = crypto.randomUUID();
  await db
    .prepare(
      "INSERT INTO creator_invitations (id,email,token_hash,role,status,expires_at,created_at) VALUES (?,?,?,?,'open',?,?)",
    )
    .bind(
      id,
      body.email,
      createHash("sha256").update(token).digest("hex"),
      body.role,
      new Date(now.getTime() + 14 * 86400000).toISOString(),
      now.toISOString(),
    )
    .run();
  await audit(me.userId, id, "invite.created");
  // O codigo so aparece agora; no banco fica apenas o hash.
  return json({ saved: true, id, token }, 201);
}
