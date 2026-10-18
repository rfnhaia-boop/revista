import { getCurrentUser } from "@/lib/auth";
import { isCreatorBlocked } from "@/lib/admin-payments";
import { moneyEnabled } from "@/lib/features";
import { planSchema, planToggleSchema } from "@/lib/payout-validation";
import { database } from "@/lib/storage";
import { validOrigin } from "@/lib/validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers });
const canSell = (role: string) => role === "creator" || role === "admin";
const MAX_PLANS = 3;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  if (!moneyEnabled()) return json({ enabled: false, plans: [] });
  const plans = await database()
    .prepare('SELECT id,name,price_cents AS priceCents,"interval",active,created_at AS createdAt FROM plans WHERE owner_id=? ORDER BY created_at ASC')
    .bind(user.userId)
    .all();
  return json({ enabled: true, plans: plans.results });
}

export async function POST(request: Request) {
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  if (!moneyEnabled()) return json({ error: "Planos pagos ainda não estão habilitados." }, 503);
  if (!canSell(user.role)) return json({ error: "Só criadores aprovados podem criar planos." }, 403);
  if (await isCreatorBlocked(user.userId)) return json({ error: "Suas vendas estão suspensas. Fale com a equipe." }, 403);
  const parsed = planSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Nome de 3 a 60 caracteres e valor entre R$ 5 e R$ 1.000." }, 400);

  const db = database();
  const account = await db.prepare("SELECT status FROM payout_accounts WHERE owner_id=?").bind(user.userId).first<{ status: string }>();
  if (!account || account.status === "creating") return json({ error: "Abra sua conta de recebimento antes de criar um plano." }, 409);
  const count = await db.prepare("SELECT COUNT(*) AS n FROM plans WHERE owner_id=? AND active=1").bind(user.userId).first<{ n: number }>();
  if ((count?.n ?? 0) >= MAX_PLANS) return json({ error: `Você pode ter até ${MAX_PLANS} planos ativos.` }, 409);

  const id = crypto.randomUUID();
  await db
    .prepare("INSERT INTO plans (id,owner_id,name,price_cents,interval,active,created_at) VALUES (?,?,?,?,'monthly',1,?)")
    .bind(id, user.userId, parsed.data.name, parsed.data.priceCents, new Date().toISOString())
    .run();
  return json({ ok: true, id }, 201);
}

/** Ativa ou desativa um plano. Desativar só impede novas assinaturas; quem já assina continua. */
export async function PATCH(request: Request) {
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  if (!moneyEnabled()) return json({ error: "Planos pagos ainda não estão habilitados." }, 503);
  const parsed = planToggleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Pedido inválido." }, 400);
  if (parsed.data.active && (await isCreatorBlocked(user.userId))) return json({ error: "Suas vendas estão suspensas. Fale com a equipe." }, 403);
  const row = await database()
    .prepare("UPDATE plans SET active=? WHERE id=? AND owner_id=? RETURNING id")
    .bind(parsed.data.active ? 1 : 0, parsed.data.id, user.userId)
    .first<{ id: string }>();
  if (!row) return json({ error: "Plano não encontrado." }, 404);
  return json({ ok: true });
}
