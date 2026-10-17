import { getCurrentUser } from "@/lib/auth";
import { AsaasError } from "@/lib/asaas";
import { CheckoutError, checkoutSingle, checkoutSubscription, paymentStatus } from "@/lib/checkout";
import { checkoutSchema } from "@/lib/checkout-validation";
import { moneyEnabled } from "@/lib/features";
import { clientIp, tooMany } from "@/lib/rate-limit";
import { validOrigin } from "@/lib/validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers });

/** Cria a cobrança Pix (compra avulsa ou assinatura). O valor vem do banco, nunca do navegador. */
export async function POST(request: Request) {
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  if (!moneyEnabled()) return json({ error: "Pagamentos ainda não estão habilitados." }, 503);
  if (tooMany("checkout:" + user.userId, 10, 60 * 60_000) || tooMany("checkout-ip:" + clientIp(request), 40, 60 * 60_000))
    return json({ error: "Muitas tentativas. Tente novamente mais tarde." }, 429);
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message || "Revise os dados." }, 400);
  const buyer = { userId: user.userId, name: user.fullName || user.displayName, email: user.email };
  try {
    const d = parsed.data;
    const result = d.type === "single" ? await checkoutSingle(buyer, d.notebookId, d.cpfCnpj) : await checkoutSubscription(buyer, d.planId, d.cpfCnpj);
    return json({ ok: true, paymentId: result.paymentId, qr: result.qr }, 201);
  } catch (e) {
    if (e instanceof CheckoutError) return json({ error: e.message }, e.status);
    if (e instanceof AsaasError && e.status === 400) return json({ error: e.message }, 400);
    return json({ error: "Não foi possível gerar o pagamento agora. Tente novamente." }, 502);
  }
}

/** Consulta o status de um pagamento do próprio leitor (a tela do Pix fica perguntando até pagar). */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Pagamento inválido." }, 400);
  if (tooMany("checkout-status:" + user.userId, 120, 10 * 60_000)) return json({ error: "Muitas consultas." }, 429);
  const status = await paymentStatus(user.userId, id);
  if (!status) return json({ error: "Pagamento não encontrado." }, 404);
  return json(status);
}
