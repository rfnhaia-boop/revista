import { resetSchema } from "@/lib/auth-validation";
import { applyReset } from "@/lib/password-reset";
import { clientIp, tooMany } from "@/lib/rate-limit";
import { validOrigin } from "@/lib/validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers });

export async function POST(request: Request) {
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  if (tooMany("reset-ip:" + clientIp(request), 20, 15 * 60_000)) return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
  const parsed = resetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.message === "As senhas não conferem.") return json({ error: issue.message }, 400);
    return json({ error: "A nova senha precisa ter pelo menos 8 caracteres." }, 400);
  }
  const ok = await applyReset(parsed.data.token, parsed.data.password);
  if (!ok) return json({ error: "Este link expirou ou já foi usado. Peça um novo." }, 400);
  return json({ ok: true });
}
