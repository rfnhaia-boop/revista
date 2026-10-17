import { getCurrentUser } from "@/lib/auth";
import { AsaasError, createSubaccount } from "@/lib/asaas";
import { moneyEnabled } from "@/lib/features";
import { payoutSchema } from "@/lib/payout-validation";
import { clientIp, tooMany } from "@/lib/rate-limit";
import { database } from "@/lib/storage";
import { validOrigin } from "@/lib/validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers });
const canReceive = (role: string) => role === "creator" || role === "admin";

type Row = { status: string; createdAt: string };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  if (!moneyEnabled()) return json({ enabled: false });
  const row = await database()
    .prepare("SELECT status,created_at AS createdAt FROM payout_accounts WHERE owner_id=?")
    .bind(user.userId)
    .first<Row>();
  return json({ enabled: true, canReceive: canReceive(user.role), account: row ? { status: row.status, createdAt: row.createdAt } : null });
}

/** Abre a subconta do criador no provedor. Os dados pessoais vão ao provedor e não ficam guardados aqui. */
export async function POST(request: Request) {
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  if (!moneyEnabled()) return json({ error: "Recebimentos ainda não estão habilitados." }, 503);
  if (!canReceive(user.role)) return json({ error: "Só criadores aprovados podem receber." }, 403);
  if (tooMany("payout:" + user.userId, 5, 60 * 60_000) || tooMany("payout-ip:" + clientIp(request), 20, 60 * 60_000))
    return json({ error: "Muitas tentativas. Tente novamente mais tarde." }, 429);

  const parsed = payoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message || "Revise os dados." }, 400);
  const { consent: _consent, ...data } = parsed.data;
  void _consent;

  const db = database();
  const now = new Date().toISOString();
  // Reserva a vaga antes de chamar o provedor: duplo clique não abre duas subcontas.
  const claimed = await db
    .prepare("INSERT INTO payout_accounts (owner_id,provider,status,created_at,updated_at) VALUES (?,'asaas','creating',?,?) ON CONFLICT (owner_id) DO NOTHING RETURNING owner_id")
    .bind(user.userId, now, now)
    .first<{ owner_id: string }>();
  if (!claimed) return json({ error: "Você já tem uma conta de recebimento." }, 409);
  try {
    const account = await createSubaccount({ ...data, email: user.email });
    await db
      .prepare("UPDATE payout_accounts SET provider_account_id=?,wallet_id=?,status='pending',updated_at=? WHERE owner_id=?")
      .bind(account.id, account.walletId, new Date().toISOString(), user.userId)
      .run();
    await db
      .prepare("INSERT INTO audit_events (id,owner_id,entity_id,action,created_at) VALUES (?,?,?,?,?)")
      .bind(crypto.randomUUID(), user.userId, user.userId, "payout.created", new Date().toISOString())
      .run();
    return json({ ok: true, status: "pending" }, 201);
  } catch (e) {
    await db.prepare("DELETE FROM payout_accounts WHERE owner_id=? AND status='creating'").bind(user.userId).run();
    const message = e instanceof AsaasError && e.status < 500 && e.status !== 503 ? e.message : "Não foi possível abrir a conta agora. Tente novamente.";
    return json({ error: message }, e instanceof AsaasError && e.status === 400 ? 400 : 502);
  }
}
