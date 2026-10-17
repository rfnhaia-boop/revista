import { createHash } from "node:crypto";
import { inviteRegistrationSchema } from "@/lib/auth-validation";
import { createSession, sessionCookie } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { clientIp, tooMany } from "@/lib/rate-limit";
import { database } from "@/lib/storage";
import { validOrigin } from "@/lib/validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  Response.json(data, { status, headers: { ...headers, ...extra } });

type Invite = { id: string; email: string; invitedName: string; message: string; role: string; status: string; expiresAt: string };
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

async function findInvite(token: string) {
  if (token.length < 20) return null;
  return database()
    .prepare("SELECT id,email,invited_name AS invitedName,message,role,status,expires_at AS expiresAt FROM creator_invitations WHERE token_hash=?")
    .bind(digest(token))
    .first<Invite>();
}

function usable(invite: Invite | null) {
  return !!invite && invite.status === "open" && Date.parse(invite.expiresAt) > Date.now();
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const invite = await findInvite(token);
  if (!usable(invite)) return json({ error: "Este convite é inválido, expirou ou já foi utilizado." }, 404);
  return json({ email: invite!.email, invitedName: invite!.invitedName, message: invite!.message, role: invite!.role, expiresAt: invite!.expiresAt });
}

export async function POST(request: Request) {
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  if (tooMany("invite-register:" + clientIp(request), 8, 15 * 60_000))
    return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
  const parsed = inviteRegistrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.message === "As senhas não conferem.") return json({ error: issue.message }, 400);
    if (issue?.path[0] === "consent") return json({ error: "Confirme o aceite para continuar." }, 400);
    return json({ error: "Revise seu nome e use uma senha com pelo menos 8 caracteres." }, 400);
  }
  const invite = await findInvite(parsed.data.token);
  if (!usable(invite)) return json({ error: "Este convite é inválido, expirou ou já foi utilizado." }, 400);
  if (!["creator", "researcher"].includes(invite!.role)) return json({ error: "Perfil de convite inválido." }, 400);

  const db = database();
  const existing = await db.prepare("SELECT id FROM users WHERE email=?").bind(invite!.email).first<{ id: string }>();
  if (existing) return json({ error: "Já existe uma conta com este e-mail. Entre normalmente e use o convite em Minha NEW." }, 409);

  const userId = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(parsed.data.password);
  await db.batch([
    db.prepare("INSERT INTO users (id,email,name,phone,password_hash,created_at) VALUES (?,?,?,?,?,?)").bind(userId, invite!.email, parsed.data.name, "", passwordHash, now),
    db.prepare("INSERT INTO member_accounts (owner_id,role,created_at,updated_at) VALUES (?,?,?,?)").bind(userId, invite!.role, now, now),
    db.prepare("INSERT INTO profiles (id,owner_id,slug,name,headline,location,bio,trajectory,interests,link,show_supporters,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(crypto.randomUUID(), userId, `autor-${userId.slice(0, 8)}`, parsed.data.name, "", "", "", "", "", "", 0, now),
    db.prepare("UPDATE creator_invitations SET status='accepted',accepted_by=? WHERE id=? AND status='open'").bind(userId, invite!.id),
    db.prepare("INSERT INTO audit_events (id,owner_id,entity_id,action,created_at) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), userId, invite!.id, "invite.accepted", now),
  ]);
  const session = await createSession(userId);
  return json({ ok: true, redirectTo: "/caderno?boas-vindas=1" }, 201, { "Set-Cookie": sessionCookie(session.token, session.maxAge) });
}
