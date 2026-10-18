import { AsaasError, cancelSubscription, refundPayment } from "@/lib/asaas";
import { database } from "@/lib/storage";

export class AdminPaymentError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function isCreatorBlocked(ownerId: string) {
  const row = await database().prepare("SELECT owner_id FROM creator_blocks WHERE owner_id=?").bind(ownerId).first();
  return !!row;
}

/** Estorna um pagamento pago: devolve no provedor e já revoga o acesso (o webhook confirma depois, sem duplicar). */
export async function refundByAdmin(paymentId: string) {
  const db = database();
  const p = await db
    .prepare("SELECT id,provider_payment_id AS providerId,status FROM payments WHERE id=?")
    .bind(paymentId)
    .first<{ id: string; providerId: string; status: string }>();
  if (!p) throw new AdminPaymentError(404, "Pagamento não encontrado.");
  if (p.status !== "paid") throw new AdminPaymentError(409, "Só pagamentos pagos podem ser estornados.");
  try {
    await refundPayment(p.providerId);
  } catch (e) {
    if (e instanceof AsaasError && e.status < 500 && e.status !== 503) throw new AdminPaymentError(400, e.message);
    throw new AdminPaymentError(502, "O provedor não respondeu. Nada foi alterado; tente de novo.");
  }
  const now = new Date().toISOString();
  await db.batch([
    db.prepare("UPDATE payments SET status='refunded',updated_at=? WHERE id=?").bind(now, p.id),
    db.prepare("UPDATE entitlements SET status='revoked' WHERE payment_id=?").bind(p.id),
  ]);
}

/** Bloqueia o criador: nenhuma venda nova. Opcionalmente cancela as assinaturas ativas para parar as cobranças. */
export async function blockCreator(ownerId: string, adminId: string, reason: string, cancelSubs: boolean) {
  const db = database();
  const exists = await db.prepare("SELECT id FROM users WHERE id=?").bind(ownerId).first();
  if (!exists) throw new AdminPaymentError(404, "Criador não encontrado.");
  const now = new Date().toISOString();
  await db
    .prepare("INSERT INTO creator_blocks (owner_id,reason,blocked_by,blocked_at) VALUES (?,?,?,?) ON CONFLICT (owner_id) DO UPDATE SET reason=excluded.reason,blocked_by=excluded.blocked_by,blocked_at=excluded.blocked_at")
    .bind(ownerId, reason, adminId, now)
    .run();
  await db.prepare("UPDATE plans SET active=0 WHERE owner_id=?").bind(ownerId).run();
  let canceled = 0;
  let failed = 0;
  if (cancelSubs) {
    const subs = await db
      .prepare("SELECT id,provider_subscription_id AS providerId FROM subscriptions WHERE creator_owner_id=? AND status IN ('pending','active')")
      .bind(ownerId)
      .all<{ id: string; providerId: string | null }>();
    for (const s of subs.results) {
      try {
        if (s.providerId) await cancelSubscription(s.providerId);
        await db.prepare("UPDATE subscriptions SET status='canceled',updated_at=? WHERE id=?").bind(new Date().toISOString(), s.id).run();
        canceled++;
      } catch (e) {
        // 404 = já não existe no provedor: tudo certo, só marcamos aqui.
        if (e instanceof AsaasError && e.status === 404) {
          await db.prepare("UPDATE subscriptions SET status='canceled',updated_at=? WHERE id=?").bind(new Date().toISOString(), s.id).run();
          canceled++;
        } else failed++;
      }
    }
  }
  return { canceled, failed };
}

export async function unblockCreator(ownerId: string) {
  await database().prepare("DELETE FROM creator_blocks WHERE owner_id=?").bind(ownerId).run();
}

export type PaymentRow = {
  id: string;
  kind: string;
  amountCents: number;
  commissionCents: number;
  status: string;
  createdAt: string;
  payerName: string;
  payerEmail: string;
  creatorName: string;
  creatorOwnerId: string;
  title: string | null;
};

export async function listPayments(limit = 200) {
  const r = await database()
    .prepare(
      `SELECT p.id,p.kind,p.amount_cents AS amountCents,p.commission_cents AS commissionCents,p.status,p.created_at AS createdAt,
        u.name AS payerName,u.email AS payerEmail,COALESCE(c.name,'—') AS creatorName,p.creator_owner_id AS creatorOwnerId,n.title
       FROM payments p JOIN users u ON u.id=p.payer_owner_id LEFT JOIN profiles c ON c.owner_id=p.creator_owner_id LEFT JOIN notebooks n ON n.id=p.notebook_id
       ORDER BY p.created_at DESC LIMIT ${Math.min(limit, 500)}`,
    )
    .all<PaymentRow>();
  return r.results;
}

/** Totais de todos os pagamentos (não só os 200 listados). */
export async function paymentTotals() {
  const r = await database()
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN status='paid' THEN amount_cents END),0)::int AS paidCents,
        COALESCE(SUM(CASE WHEN status='paid' THEN commission_cents END),0)::int AS commissionCents,
        COALESCE(SUM(CASE WHEN status='refunded' THEN amount_cents END),0)::int AS refundedCents,
        COUNT(*) FILTER (WHERE status='pending')::int AS pending,
        COUNT(*)::int AS total FROM payments`,
    )
    .first<{ paidCents: number; commissionCents: number; refundedCents: number; pending: number; total: number }>();
  return r ?? { paidCents: 0, commissionCents: 0, refundedCents: 0, pending: 0, total: 0 };
}

export type CreatorRow = {
  ownerId: string;
  name: string;
  email: string;
  payoutStatus: string | null;
  blockedReason: string | null;
  paidCents: number;
  commissionCents: number;
  refundedCents: number;
  activeSubscribers: number;
};

/** Por criador: quanto vendeu, quanto é dele (líquido), comissão da NEW e estornos. O repasse em si é feito pelo provedor (split). */
export async function listCreators() {
  const r = await database()
    .prepare(
      `SELECT u.id AS ownerId,COALESCE(pr.name,u.name) AS name,u.email,po.status AS payoutStatus,cb.reason AS blockedReason,
        COALESCE((SELECT SUM(amount_cents) FROM payments x WHERE x.creator_owner_id=u.id AND x.status='paid'),0)::int AS paidCents,
        COALESCE((SELECT SUM(commission_cents) FROM payments x WHERE x.creator_owner_id=u.id AND x.status='paid'),0)::int AS commissionCents,
        COALESCE((SELECT SUM(amount_cents) FROM payments x WHERE x.creator_owner_id=u.id AND x.status='refunded'),0)::int AS refundedCents,
        (SELECT COUNT(*) FROM subscriptions s WHERE s.creator_owner_id=u.id AND s.status='active')::int AS activeSubscribers
       FROM users u LEFT JOIN profiles pr ON pr.owner_id=u.id LEFT JOIN payout_accounts po ON po.owner_id=u.id LEFT JOIN creator_blocks cb ON cb.owner_id=u.id
       WHERE po.owner_id IS NOT NULL OR cb.owner_id IS NOT NULL OR EXISTS (SELECT 1 FROM payments x WHERE x.creator_owner_id=u.id)
       ORDER BY "paidCents" DESC, name ASC LIMIT 200`,
    )
    .all<CreatorRow>();
  return r.results;
}
