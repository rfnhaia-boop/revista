import { getCurrentUser } from "@/lib/auth";
import { LEGAL_VERSION } from "@/lib/legal";
import { hasAcceptedCurrent, recordAcceptance } from "@/lib/terms";
import { validOrigin } from "@/lib/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers });
const bodySchema = z.object({ version: z.string(), accept: z.literal(true) }).strict();

/** Aceite da versão vigente (usuários que já existiam ou quando os textos mudam). */
export async function POST(request: Request) {
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Pedido inválido." }, 400);
  if (parsed.data.version !== LEGAL_VERSION) return json({ error: "Os termos foram atualizados. Recarregue a página." }, 409);
  if (!(await hasAcceptedCurrent(user.userId))) await recordAcceptance(user.userId, "notice");
  return json({ ok: true });
}
