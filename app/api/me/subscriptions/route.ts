import { getCurrentUser } from "@/lib/auth";
import { CheckoutError, cancelOwnSubscription } from "@/lib/checkout";
import { cancelSchema } from "@/lib/checkout-validation";
import { database } from "@/lib/storage";
import { validOrigin } from "@/lib/validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers });

/** Assinaturas e compras avulsas do leitor, com até quando o acesso vale. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  const db = database();
  const subscriptions = await db
    .prepare(
      `SELECT s.id,s.status,s.current_period_end AS currentPeriodEnd,s.created_at AS createdAt,pl.name AS planName,pl.price_cents AS priceCents,p.name AS creatorName,p.slug AS creatorSlug
       FROM subscriptions s JOIN plans pl ON pl.id=s.plan_id JOIN profiles p ON p.owner_id=s.creator_owner_id
       WHERE s.reader_owner_id=? AND s.status<>'pending' ORDER BY s.created_at DESC LIMIT 50`,
    )
    .bind(user.userId)
    .all();
  const purchases = await db
    .prepare(
      `SELECT e.id,e.status,e.starts_at AS startsAt,n.id AS notebookId,n.title,p.name AS creatorName
       FROM entitlements e JOIN notebooks n ON n.id=e.notebook_id JOIN profiles p ON p.owner_id=e.creator_owner_id
       WHERE e.reader_owner_id=? AND e.kind='single' ORDER BY e.starts_at DESC LIMIT 100`,
    )
    .bind(user.userId)
    .all();
  return json({ subscriptions: subscriptions.results, purchases: purchases.results });
}

export async function DELETE(request: Request) {
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  const parsed = cancelSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Pedido inválido." }, 400);
  try {
    await cancelOwnSubscription(user.userId, parsed.data.id);
    return json({ ok: true });
  } catch (e) {
    if (e instanceof CheckoutError) return json({ error: e.message }, e.status);
    return json({ error: "Não foi possível cancelar agora." }, 502);
  }
}
