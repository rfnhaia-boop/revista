import { audit, json, readBody, requireStaffApi } from "@/lib/admin";
import { AdminPaymentError, blockCreator, listCreators, listPayments, paymentTotals, refundByAdmin, unblockCreator } from "@/lib/admin-payments";
import { paymentsActionSchema } from "@/lib/admin-validation";
import { moneyEnabled } from "@/lib/features";

export const dynamic = "force-dynamic";

/** Pagamentos e criadores. Só administrador (dinheiro). */
export async function GET() {
  const me = await requireStaffApi(true);
  if (me instanceof Response) return me;
  const [items, creators, totals] = await Promise.all([listPayments(), listCreators(), paymentTotals()]);
  return json({
    items,
    creators,
    moneyEnabled: moneyEnabled(),
    summary: { ...totals, truncated: totals.total > items.length },
  });
}

export async function POST(request: Request) {
  const me = await requireStaffApi(true);
  if (me instanceof Response) return me;
  const body = await readBody(request, paymentsActionSchema);
  if (body instanceof Response) return body;
  try {
    if (body.action === "refund") {
      await refundByAdmin(body.paymentId);
      await audit(me.userId, body.paymentId, "payment.refunded");
      return json({ ok: true });
    }
    if (body.action === "block-creator") {
      if (body.ownerId === me.userId) return json({ error: "Você não pode bloquear a si mesmo." }, 400);
      const result = await blockCreator(body.ownerId, me.userId, body.reason, body.cancelSubscriptions);
      await audit(me.userId, body.ownerId, "creator.blocked");
      return json({ ok: true, ...result });
    }
    await unblockCreator(body.ownerId);
    await audit(me.userId, body.ownerId, "creator.unblocked");
    return json({ ok: true });
  } catch (e) {
    if (e instanceof AdminPaymentError) return json({ error: e.message }, e.status);
    return json({ error: "Não foi possível concluir a ação." }, 500);
  }
}
