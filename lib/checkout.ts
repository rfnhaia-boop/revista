import { AsaasError, cancelSubscription, createCustomer, createPixCharge, createSubscription, firstSubscriptionPaymentId, getPixQr, type PixQr } from "@/lib/asaas";
import { commissionPercent, splitOf } from "@/lib/checkout-validation";
import { database } from "@/lib/storage";

export class CheckoutError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type Buyer = { userId: string; name: string; email: string };
export type CheckoutResult = { paymentId: string; qr: PixQr | null };

async function customerFor(buyer: Buyer, cpfCnpj: string) {
  const db = database();
  const known = await db.prepare("SELECT provider_customer_id AS id FROM payment_customers WHERE owner_id=?").bind(buyer.userId).first<{ id: string }>();
  if (known) return known.id;
  const created = await createCustomer({ name: buyer.name, email: buyer.email, cpfCnpj });
  await db
    .prepare("INSERT INTO payment_customers (owner_id,provider_customer_id,created_at) VALUES (?,?,?) ON CONFLICT (owner_id) DO NOTHING")
    .bind(buyer.userId, created.id, new Date().toISOString())
    .run();
  return created.id;
}

async function creatorWallet(creatorOwnerId: string) {
  const w = await database().prepare("SELECT wallet_id AS walletId,status FROM payout_accounts WHERE owner_id=?").bind(creatorOwnerId).first<{ walletId: string; status: string }>();
  if (!w || !w.walletId || w.status === "creating" || w.status === "rejected") throw new CheckoutError(409, "Este criador ainda não pode receber pagamentos.");
  return w.walletId;
}

async function recordPayment(row: { id: string; providerPaymentId: string; payer: string; creator: string; kind: string; notebookId: string | null; subscriptionId: string | null; cents: number; commission: number }) {
  const now = new Date().toISOString();
  await database()
    .prepare(
      "INSERT INTO payments (id,provider_payment_id,payer_owner_id,creator_owner_id,kind,notebook_id,subscription_id,amount_cents,commission_cents,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,'pending',?,?) ON CONFLICT (provider_payment_id) DO NOTHING",
    )
    .bind(row.id, row.providerPaymentId, row.payer, row.creator, row.kind, row.notebookId, row.subscriptionId, row.cents, row.commission, now, now)
    .run();
}

/** Compra avulsa de um texto pago. */
export async function checkoutSingle(buyer: Buyer, notebookId: string, cpfCnpj: string): Promise<CheckoutResult> {
  const db = database();
  const n = await db
    .prepare("SELECT id,title,owner_id AS ownerId,price_cents AS priceCents FROM notebooks WHERE id=? AND status='published' AND access='paid'")
    .bind(notebookId)
    .first<{ id: string; title: string; ownerId: string; priceCents: number }>();
  if (!n) throw new CheckoutError(404, "Texto não encontrado.");
  if (n.ownerId === buyer.userId) throw new CheckoutError(409, "Este texto é seu.");
  const owned = await db
    .prepare("SELECT id FROM entitlements WHERE reader_owner_id=? AND status='active' AND creator_owner_id=? AND (ends_at IS NULL OR ends_at>?) AND (kind='subscription' OR notebook_id=?) LIMIT 1")
    .bind(buyer.userId, n.ownerId, new Date().toISOString(), n.id)
    .first();
  if (owned) throw new CheckoutError(409, "Você já tem acesso a este texto.");
  const wallet = await creatorWallet(n.ownerId);
  const customer = await customerFor(buyer, cpfCnpj);
  const { commissionCents, creatorPercent } = splitOf(n.priceCents, commissionPercent(process.env.COMMISSION_PERCENT));
  const id = crypto.randomUUID();
  const charge = await createPixCharge({ customer, cents: n.priceCents, description: n.title.slice(0, 100), reference: id, split: [{ walletId: wallet, percentualValue: creatorPercent }] });
  await recordPayment({ id, providerPaymentId: charge.id, payer: buyer.userId, creator: n.ownerId, kind: "single", notebookId: n.id, subscriptionId: null, cents: n.priceCents, commission: commissionCents });
  return { paymentId: id, qr: await getPixQr(charge.id).catch(() => null) };
}

/** Assinatura mensal do Caderno de um criador. */
export async function checkoutSubscription(buyer: Buyer, planId: string, cpfCnpj: string): Promise<CheckoutResult> {
  const db = database();
  const plan = await db
    .prepare("SELECT id,name,owner_id AS ownerId,price_cents AS priceCents FROM plans WHERE id=? AND active=1")
    .bind(planId)
    .first<{ id: string; name: string; ownerId: string; priceCents: number }>();
  if (!plan) throw new CheckoutError(404, "Plano não encontrado.");
  if (plan.ownerId === buyer.userId) throw new CheckoutError(409, "Este plano é seu.");
  const existing = await db
    .prepare("SELECT id FROM subscriptions WHERE reader_owner_id=? AND creator_owner_id=? AND status IN ('pending','active')")
    .bind(buyer.userId, plan.ownerId)
    .first();
  if (existing) throw new CheckoutError(409, "Você já assina este criador.");
  const wallet = await creatorWallet(plan.ownerId);
  const customer = await customerFor(buyer, cpfCnpj);
  const { commissionCents, creatorPercent } = splitOf(plan.priceCents, commissionPercent(process.env.COMMISSION_PERCENT));
  const subId = crypto.randomUUID();
  const now = new Date().toISOString();
  const remote = await createSubscription({ customer, cents: plan.priceCents, description: plan.name.slice(0, 100), reference: subId, split: [{ walletId: wallet, percentualValue: creatorPercent }] });
  await db
    .prepare("INSERT INTO subscriptions (id,reader_owner_id,creator_owner_id,plan_id,provider_subscription_id,status,created_at,updated_at) VALUES (?,?,?,?,?,'pending',?,?)")
    .bind(subId, buyer.userId, plan.ownerId, plan.id, remote.id, now, now)
    .run();
  const firstId = await firstSubscriptionPaymentId(remote.id);
  if (!firstId) throw new CheckoutError(502, "Não foi possível gerar a cobrança agora.");
  const id = crypto.randomUUID();
  await recordPayment({ id, providerPaymentId: firstId, payer: buyer.userId, creator: plan.ownerId, kind: "subscription", notebookId: null, subscriptionId: subId, cents: plan.priceCents, commission: commissionCents });
  return { paymentId: id, qr: await getPixQr(firstId).catch(() => null) };
}

/** Status de um pagamento do próprio leitor; se ainda pendente, devolve de novo o QR. */
export async function paymentStatus(buyerId: string, paymentId: string) {
  const p = await database()
    .prepare("SELECT id,provider_payment_id AS providerId,status FROM payments WHERE id=? AND payer_owner_id=?")
    .bind(paymentId, buyerId)
    .first<{ id: string; providerId: string; status: string }>();
  if (!p) return null;
  const qr = p.status === "pending" ? await getPixQr(p.providerId).catch(() => null) : null;
  return { status: p.status, qr };
}

/** Cancela a assinatura: nenhuma cobrança nova; o acesso já pago vale até o fim do período. */
export async function cancelOwnSubscription(buyerId: string, subscriptionId: string) {
  const db = database();
  const s = await db
    .prepare("SELECT id,provider_subscription_id AS providerId,status FROM subscriptions WHERE id=? AND reader_owner_id=?")
    .bind(subscriptionId, buyerId)
    .first<{ id: string; providerId: string | null; status: string }>();
  if (!s) throw new CheckoutError(404, "Assinatura não encontrada.");
  if (s.status === "canceled") return;
  if (s.providerId) {
    try {
      await cancelSubscription(s.providerId);
    } catch (e) {
      if (!(e instanceof AsaasError && e.status === 404)) throw new CheckoutError(502, "Não foi possível cancelar agora. Tente novamente.");
    }
  }
  await db.prepare("UPDATE subscriptions SET status='canceled',updated_at=? WHERE id=?").bind(new Date().toISOString(), s.id).run();
}
