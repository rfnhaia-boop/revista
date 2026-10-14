import { getCurrentUser } from "@/lib/auth";
import { database } from "@/lib/storage";
import { validOrigin } from "@/lib/validation";
import { meSchema } from "@/lib/me-validation";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers });
const hash = async (v: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  try {
    const db = database(),
      uid = user.userId;
    const account = await db
      .prepare("SELECT role FROM member_accounts WHERE owner_id=?")
      .bind(uid)
      .first<{ role: string }>();
    const requests = await db
      .prepare(
        "SELECT id,requested_role AS requestedRole,status,review_note AS reviewNote,created_at AS createdAt FROM role_requests WHERE owner_id=? ORDER BY created_at DESC LIMIT 10",
      )
      .bind(uid)
      .all();
    const questions = await db
      .prepare(
        "SELECT id,title,status,review_note AS reviewNote,created_at AS createdAt FROM community_questions WHERE owner_id=? ORDER BY created_at DESC LIMIT 20",
      )
      .bind(uid)
      .all();
    const counts = await db
      .prepare(
        "SELECT (SELECT COUNT(*) FROM bookmarks WHERE owner_id=?) AS saved,(SELECT COUNT(*) FROM follows WHERE owner_id=?) AS following,(SELECT COUNT(*) FROM notebooks WHERE owner_id=?) AS notes,(SELECT COUNT(*) FROM knowledge_projects WHERE owner_id=?) AS projects",
      )
      .bind(uid, uid, uid, uid)
      .first();
    return json({
      role: account?.role || "member",
      requests: requests.results,
      questions: questions.results,
      counts: counts || { saved: 0, following: 0, notes: 0, projects: 0 },
      name: user.fullName || user.email || "Membro NEW",
    });
  } catch {
    return json({ error: "Não foi possível carregar sua área." }, 503);
  }
}
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json"))
    return json({ error: "Formato inválido." }, 415);
  let parsed;
  try {
    const raw = await request.text();
    if (raw.length > 20000)
      return json({ error: "Conteúdo muito grande." }, 413);
    parsed = meSchema.safeParse(JSON.parse(raw));
  } catch {
    return json({ error: "Dados inválidos." }, 400);
  }
  if (!parsed.success)
    return json({ error: "Revise os campos obrigatórios." }, 400);
  try {
    const db = database(),
      uid = user.userId,
      now = new Date().toISOString(),
      p = parsed.data;
    await db
      .prepare(
        "INSERT INTO member_accounts (owner_id,role,created_at,updated_at) VALUES (?,?,?,?) ON CONFLICT(owner_id) DO NOTHING",
      )
      .bind(uid, "member", now, now)
      .run();
    if (p.action === "role-request") {
      const account = await db
        .prepare("SELECT role FROM member_accounts WHERE owner_id=?")
        .bind(uid)
        .first<{ role: string }>();
      if (p.requestedRole === "researcher" && account?.role !== "creator")
        return json(
          {
            error: "O acesso de pesquisador exige perfil de criador aprovado.",
          },
          403,
        );
      if (p.requestedRole === "creator" && account?.role !== "member")
        return json({ error: "Seu perfil já possui acesso de criação." }, 409);
      const pending = await db
        .prepare(
          "SELECT id FROM role_requests WHERE owner_id=? AND requested_role=? AND status IN ('submitted','reviewing','changes_requested')",
        )
        .bind(uid, p.requestedRole)
        .first();
      if (pending)
        return json({ error: "Já existe uma solicitação em análise." }, 409);
      const id = crypto.randomUUID();
      await db.batch([
        db
          .prepare(
            "INSERT INTO role_requests (id,owner_id,requested_role,presentation,experience,portfolio,motivation,status,review_note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
          )
          .bind(
            id,
            uid,
            p.requestedRole,
            p.presentation,
            p.experience,
            p.portfolio,
            p.motivation,
            "submitted",
            "",
            now,
            now,
          ),
        db
          .prepare(
            "INSERT INTO audit_events (id,owner_id,entity_id,action,created_at) VALUES (?,?,?,?,?)",
          )
          .bind(crypto.randomUUID(), uid, id, "role-request.submitted", now),
      ]);
      return json({ saved: true, id });
    }
    if (p.action === "question") {
      const id = crypto.randomUUID();
      await db.batch([
        db
          .prepare(
            "INSERT INTO community_questions (id,owner_id,title,context,importance,status,review_note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
          )
          .bind(
            id,
            uid,
            p.title,
            p.context,
            p.importance,
            "submitted",
            "",
            now,
            now,
          ),
        db
          .prepare(
            "INSERT INTO audit_events (id,owner_id,entity_id,action,created_at) VALUES (?,?,?,?,?)",
          )
          .bind(crypto.randomUUID(), uid, id, "question.submitted", now),
      ]);
      return json({ saved: true, id });
    }
    const tokenHash = await hash(p.token);
    const invite = await db
      .prepare(
        "SELECT id,email,role,status,expires_at AS expiresAt FROM creator_invitations WHERE token_hash=?",
      )
      .bind(tokenHash)
      .first<{
        id: string;
        email: string;
        role: string;
        status: string;
        expiresAt: string;
      }>();
    if (
      !invite ||
      invite.status !== "open" ||
      Date.parse(invite.expiresAt) < Date.now()
    )
      return json({ error: "Convite inválido ou expirado." }, 400);
    if (!user.email || invite.email.toLowerCase() !== user.email.toLowerCase())
      return json({ error: "Este convite pertence a outra conta." }, 403);
    if (!["creator", "researcher"].includes(invite.role))
      return json({ error: "Convite inválido." }, 400);
    await db.batch([
      db
        .prepare(
          "UPDATE member_accounts SET role=?,updated_at=? WHERE owner_id=?",
        )
        .bind(invite.role, now, uid),
      db
        .prepare(
          "UPDATE creator_invitations SET status='accepted',accepted_by=? WHERE id=? AND status='open'",
        )
        .bind(uid, invite.id),
      db
        .prepare(
          "INSERT INTO audit_events (id,owner_id,entity_id,action,created_at) VALUES (?,?,?,?,?)",
        )
        .bind(crypto.randomUUID(), uid, invite.id, "invite.accepted", now),
    ]);
    return json({ saved: true, role: invite.role });
  } catch {
    return json({ error: "Não foi possível confirmar a alteração." }, 503);
  }
}
