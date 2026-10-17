import { activateSchema } from "@/lib/auth-validation";
import { createSession, sessionCookie } from "@/lib/auth";
import { ensureBootstrapAdmin } from "@/lib/admin";
import { resgatarCodigo } from "@/lib/cofre";
import { hashPassword } from "@/lib/password";
import { recordAcceptance } from "@/lib/terms";
import { clientIp, tooMany } from "@/lib/rate-limit";
import { database } from "@/lib/storage";
import { validOrigin } from "@/lib/validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  Response.json(data, { status, headers: { ...headers, ...extra } });

export async function POST(request: Request) {
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  if (tooMany("ativar:" + clientIp(request), 10, 15 * 60_000))
    return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
  const parsed = activateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Informe o código (XXXX-XXXX), o e-mail do seu cadastro e aceite os Termos." }, 400);
  const raw = parsed.data.codigo.replace("-", "");
  const codigo = raw.slice(0, 4) + "-" + raw.slice(4);

  const result = await resgatarCodigo(codigo, parsed.data.email);
  if (!result.ok) return json({ error: result.error }, result.status);
  if (result.jaAtivado)
    return json({ error: "Este código já foi ativado na Revista. Entre com seu e-mail e senha." }, 409);
  const { nome, email, telefone, senha } = result.cliente;
  if (email.trim().toLowerCase() !== parsed.data.email)
    return json({ error: "Código e e-mail não conferem." }, 400);
  if (!senha) return json({ error: "Não foi possível concluir a ativação." }, 502);

  const db = database();
  const mail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(senha);
  const existing = await db.prepare("SELECT id FROM users WHERE email=?").bind(mail).first<{ id: string }>();
  const now = new Date().toISOString();
  let userId = existing?.id;
  if (userId) {
    await db
      .prepare("UPDATE users SET name=?,phone=?,password_hash=? WHERE id=?")
      .bind(nome, telefone ?? "", passwordHash, userId)
      .run();
  } else {
    userId = crypto.randomUUID();
    await db
      .prepare("INSERT INTO users (id,email,name,phone,password_hash,created_at) VALUES (?,?,?,?,?,?)")
      .bind(userId, mail, nome, telefone ?? "", passwordHash, now)
      .run();
  }
  await db
    .prepare("INSERT INTO audit_events (id,owner_id,entity_id,action,created_at) VALUES (?,?,?,?,?)")
    .bind(crypto.randomUUID(), userId, userId, "auth.activated", now)
    .run();
  await recordAcceptance(userId, "activation");
  await ensureBootstrapAdmin(userId, mail);
  const s = await createSession(userId);
  return json({ ok: true, name: nome }, 200, { "Set-Cookie": sessionCookie(s.token, s.maxAge) });
}
