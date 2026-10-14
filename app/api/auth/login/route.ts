import { loginSchema } from "@/lib/auth-validation";
import { createSession, sessionCookie } from "@/lib/auth";
import { ensureBootstrapAdmin } from "@/lib/admin";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clientIp, tooMany } from "@/lib/rate-limit";
import { database } from "@/lib/storage";
import { validOrigin } from "@/lib/validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  Response.json(data, { status, headers: { ...headers, ...extra } });
const DUMMY = hashPassword("dummy-password-for-timing");

export async function POST(request: Request) {
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Informe e-mail e senha." }, 400);
  const { email, senha } = parsed.data;
  if (tooMany("login:" + clientIp(request), 30, 15 * 60_000) || tooMany("login:" + email, 5, 15 * 60_000))
    return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);

  const user = await database()
    .prepare("SELECT id,password_hash FROM users WHERE email=?")
    .bind(email)
    .first<{ id: string; password_hash: string }>();
  const ok = await verifyPassword(senha, user?.password_hash ?? (await DUMMY));
  if (!user || !ok) return json({ error: "E-mail ou senha incorretos." }, 401);
  await ensureBootstrapAdmin(user.id, email);
  const s = await createSession(user.id);
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(s.token, s.maxAge) });
}
