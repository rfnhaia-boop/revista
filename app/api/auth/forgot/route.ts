import { forgotSchema } from "@/lib/auth-validation";
import { requestReset } from "@/lib/password-reset";
import { clientIp, tooMany } from "@/lib/rate-limit";
import { validOrigin } from "@/lib/validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers });

const SAME = { ok: true, message: "Se o e-mail estiver cadastrado, enviamos um link para criar uma nova senha. Ele vale por 1 hora." };

export async function POST(request: Request) {
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  const parsed = forgotSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Informe um e-mail válido." }, 400);
  const { email } = parsed.data;
  if (tooMany("forgot-ip:" + clientIp(request), 10, 15 * 60_000) || tooMany("forgot:" + email, 3, 60 * 60_000))
    return json({ error: "Muitos pedidos. Aguarde um pouco e tente de novo." }, 429);
  try {
    await requestReset(email);
  } catch {
    /* mesma resposta: não revelamos o que aconteceu por dentro */
  }
  return json(SAME);
}
