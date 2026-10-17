"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";

type Payout = { enabled: boolean; canReceive?: boolean; account?: { status: string } | null };
type Plan = { id: string; name: string; priceCents: number; active: number };

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const STATUS: Record<string, string> = { pending: "Em análise pelo provedor", active: "Ativa", rejected: "Recusada" };

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const d = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(d.error || "Não foi possível concluir.");
  return d;
}

export default function ReceberTab() {
  const [payout, setPayout] = useState<Payout | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const load = useCallback(async () => {
    const [p, pl] = await Promise.all([fetch("/api/me/payout").then((r) => r.json()), fetch("/api/me/plans").then((r) => r.json())]);
    setPayout(p);
    setPlans(pl.plans ?? []);
  }, []);
  useEffect(() => {
    queueMicrotask(() => void load().catch(() => setPayout({ enabled: false })));
  }, [load]);

  if (!payout) return <p className="dash-muted" role="status">Carregando…</p>;
  if (!payout.enabled)
    return (
      <section className="glass ch-empty ch-card">
        <Wallet size={30} />
        <h3>Recebimentos em breve.</h3>
        <p>Assim que a plataforma liberar os pagamentos, você poderá cobrar pelos seus textos e receber direto aqui.</p>
      </section>
    );
  if (!payout.canReceive)
    return (
      <section className="glass ch-empty ch-card">
        <Wallet size={30} />
        <h3>Disponível para criadores.</h3>
        <p>Só criadores aprovados podem cobrar por conteúdo.</p>
      </section>
    );
  return (
    <div className="ch-stack">
      <Account payout={payout} onDone={load} />
      {payout.account && <Plans plans={plans} onChange={load} />}
    </div>
  );
}

function Account({ payout, onDone }: { payout: Payout; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  if (payout.account)
    return (
      <section className="glass ch-card">
        <div className="ch-card-head">
          <h3>Conta de recebimento</h3>
          <span>{STATUS[payout.account.status] ?? payout.account.status}</span>
        </div>
        <p className="ch-muted">O dinheiro das suas vendas cai direto na sua conta do provedor de pagamento. A plataforma só retém a comissão combinada.</p>
      </section>
    );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    setBusy(true);
    try {
      await call("/api/me/payout", "POST", {
        name: s("name"),
        cpfCnpj: s("cpfCnpj"),
        birthDate: s("birthDate") || undefined,
        mobilePhone: s("mobilePhone"),
        incomeValue: Number(s("incomeValue").replace(",", ".")) || 0,
        postalCode: s("postalCode"),
        address: s("address"),
        addressNumber: s("addressNumber"),
        province: s("province"),
        consent: f.get("consent") === "on",
      });
      toast.success("Conta enviada para análise.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="glass ch-card">
      <div className="ch-card-head">
        <h3>Abrir conta de recebimento</h3>
        <span>Uma vez só</span>
      </div>
      <p className="ch-muted">Para receber, o provedor de pagamento precisa confirmar quem você é. Os dados vão direto a ele e não ficam guardados na Revista.</p>
      <form className="ch-form" onSubmit={submit}>
        <label>Nome completo ou razão social<input name="name" required maxLength={120} autoComplete="name" /></label>
        <label>CPF ou CNPJ<input name="cpfCnpj" required inputMode="numeric" /></label>
        <label>Data de nascimento (só CPF)<input name="birthDate" type="date" /></label>
        <label>Celular com DDD<input name="mobilePhone" required inputMode="tel" autoComplete="tel" /></label>
        <label>Renda ou faturamento mensal (R$)<input name="incomeValue" required inputMode="decimal" /></label>
        <label>CEP<input name="postalCode" required inputMode="numeric" autoComplete="postal-code" /></label>
        <label>Endereço<input name="address" required maxLength={150} autoComplete="address-line1" /></label>
        <label>Número<input name="addressNumber" required maxLength={20} /></label>
        <label>Bairro<input name="province" required maxLength={80} /></label>
        <label className="ch-check"><input name="consent" type="checkbox" required /><span>Confirmo que os dados são meus e autorizo enviá-los ao provedor de pagamento.</span></label>
        <button className="primary" disabled={busy}>{busy ? "Enviando…" : "Abrir conta"}</button>
      </form>
    </section>
  );
}

function Plans({ plans, onChange }: { plans: Plan[]; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const reais = Number(String(f.get("price")).replace(",", "."));
    setBusy(true);
    try {
      await call("/api/me/plans", "POST", { name: String(f.get("name") ?? "").trim(), priceCents: Math.round(reais * 100) });
      form.reset();
      toast.success("Plano criado.");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }
  async function toggle(p: Plan) {
    try {
      await call("/api/me/plans", "PATCH", { id: p.id, active: !p.active });
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir.");
    }
  }
  return (
    <section className="glass ch-card">
      <div className="ch-card-head">
        <h3>Planos de assinatura</h3>
        <span>Até 3 ativos · cobrança mensal</span>
      </div>
      {plans.length === 0 ? (
        <p className="ch-muted">Você ainda não tem planos. Crie um para que leitores possam assinar o seu Caderno.</p>
      ) : (
        <ul className="ch-rows">
          {plans.map((p) => (
            <li key={p.id} className="ch-row">
              <div className="ch-row-main">
                <strong>{p.name}</strong>
                <small>{brl(p.priceCents)} por mês · {p.active ? "Aceitando assinantes" : "Pausado"}</small>
              </div>
              <button className="outline small" onClick={() => toggle(p)}>{p.active ? "Pausar" : "Reativar"}</button>
            </li>
          ))}
        </ul>
      )}
      <form className="ch-form ch-inline" onSubmit={create}>
        <label>Nome do plano<input name="name" required minLength={3} maxLength={60} placeholder="Apoiador" /></label>
        <label>Valor mensal (R$)<input name="price" required inputMode="decimal" placeholder="9,90" /></label>
        <button className="primary" disabled={busy}>{busy ? "Criando…" : "Criar plano"}</button>
      </form>
    </section>
  );
}
