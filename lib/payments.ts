import { database } from "@/lib/storage";
import { effectOf, SUBSCRIPTION_GRACE_DAYS, type AsaasWebhook } from "@/lib/payments-core";

export { asaasWebhookSchema, effectOf, tokenMatches, SUBSCRIPTION_GRACE_DAYS, type AsaasWebhook, type PaymentEffect } from "@/lib/payments-core";

export type WebhookResult = "applied" | "duplicate" | "ignored" | "unknown-payment";

type PaymentRow = {
  id: string;
  payerOwnerId: string;
  creatorOwnerId: string;
  kind: string;
  notebookId: string | null;
  subscriptionId: string | null;
  status: string;
};

/**
 * Aplica o evento uma única vez (idempotente por event id).
 * Pagamento só existe se o nosso checkout criou; evento de cobrança desconhecida é guardado e ignorado.
 */
export async function applyWebhook(evt: AsaasWebhook, now = new Date()): Promise<WebhookResult> {
  const db = database();
  const stamp = now.toISOString();
  const fresh = await db
    .prepare("INSERT INTO webhook_events (event_id,provider,event,payload,received_at) VALUES (?,?,?,?,?) ON CONFLICT (event_id) DO NOTHING RETURNING event_id")
    .bind(evt.id, "asaas", evt.event, JSON.stringify(evt).slice(0, 20000), stamp)
    .first<{ event_id: string }>();
  if (!fresh) return "duplicate";

  const done = db.prepare("UPDATE webhook_events SET processed_at=? WHERE event_id=?").bind(stamp, evt.id);
  const effect = effectOf(evt.event);
  const providerId = evt.payment?.id;
  if (effect === "ignore" || !providerId) {
    await done.run();
    return "ignored";
  }
  const payment = await db
    .prepare("SELECT id,payer_owner_id AS payerOwnerId,creator_owner_id AS creatorOwnerId,kind,notebook_id AS notebookId,subscription_id AS subscriptionId,status FROM payments WHERE provider_payment_id=?")
    .bind(providerId)
    .first<PaymentRow>();
  if (!payment) {
    await done.run();
    return "unknown-payment";
  }

  if (effect === "paid") {
    // Evento fora de ordem: depois de estornado, um "recebido" atrasado não reabre o acesso.
    if (payment.status === "refunded") {
      await done.run();
      return "ignored";
    }
    const endsAt = payment.kind === "subscription" ? new Date(now.getTime() + SUBSCRIPTION_GRACE_DAYS * 86400000).toISOString() : null;
    const statements = [
      db.prepare("UPDATE payments SET status='paid',updated_at=? WHERE id=?").bind(stamp, payment.id),
      db
        .prepare("INSERT INTO entitlements (id,reader_owner_id,creator_owner_id,kind,notebook_id,payment_id,starts_at,ends_at,status) VALUES (?,?,?,?,?,?,?,?,'active') ON CONFLICT (payment_id) DO NOTHING")
        .bind(crypto.randomUUID(), payment.payerOwnerId, payment.creatorOwnerId, payment.kind, payment.notebookId, payment.id, stamp, endsAt),
    ];
    if (payment.subscriptionId)
      statements.push(db.prepare("UPDATE subscriptions SET status='active',current_period_end=?,updated_at=? WHERE id=?").bind(endsAt, stamp, payment.subscriptionId));
    statements.push(done);
    await db.batch(statements);
  } else if (effect === "refunded") {
    await db.batch([
      db.prepare("UPDATE payments SET status='refunded',updated_at=? WHERE id=?").bind(stamp, payment.id),
      db.prepare("UPDATE entitlements SET status='revoked' WHERE payment_id=?").bind(payment.id),
      done,
    ]);
  } else {
    await db.batch([db.prepare("UPDATE payments SET status='overdue',updated_at=? WHERE id=? AND status='pending'").bind(stamp, payment.id), done]);
  }
  return "applied";
}

/** O leitor tem direito a ler este texto? (assinatura do criador ou compra avulsa, ainda válida) */
export async function hasAccess(readerOwnerId: string, creatorOwnerId: string, notebookId: string, now = new Date()) {
  const row = await database()
    .prepare(
      "SELECT id FROM entitlements WHERE reader_owner_id=? AND creator_owner_id=? AND status='active' AND (ends_at IS NULL OR ends_at>?) AND (kind='subscription' OR notebook_id=?) LIMIT 1",
    )
    .bind(readerOwnerId, creatorOwnerId, now.toISOString(), notebookId)
    .first<{ id: string }>();
  return !!row;
}
