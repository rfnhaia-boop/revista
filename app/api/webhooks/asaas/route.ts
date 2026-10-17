import { applyWebhook, asaasWebhookSchema, tokenMatches } from "@/lib/payments";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

/** Webhook do Asaas. Autenticado pelo token que configuramos lá (header asaas-access-token). */
export async function POST(request: Request) {
  if (!tokenMatches(request.headers.get("asaas-access-token"), process.env.ASAAS_WEBHOOK_TOKEN))
    return Response.json({ error: "Não autorizado." }, { status: 401, headers });
  const parsed = asaasWebhookSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Evento inválido." }, { status: 400, headers });
  try {
    const result = await applyWebhook(parsed.data);
    return Response.json({ ok: true, result }, { headers });
  } catch {
    // 500 faz o Asaas tentar de novo; o event id garante que não aplica duas vezes.
    return Response.json({ error: "Falha ao processar." }, { status: 500, headers });
  }
}
