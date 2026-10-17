"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type Sub = { id: string; status: string; currentPeriodEnd: string | null; planName: string; priceCents: number; creatorName: string; creatorSlug: string };
type Buy = { id: string; status: string; startsAt: string; notebookId: string; title: string; creatorName: string };

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const day = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const LABEL: Record<string, string> = { active: "Ativa", canceled: "Cancelada", pending: "Aguardando pagamento" };

export default function Subscriptions({ signedIn }: { signedIn: boolean }) {
  const [data, setData] = useState<{ subscriptions: Sub[]; purchases: Buy[] } | null>(null);
  const load = useCallback(async () => {
    const r = await fetch("/api/me/subscriptions", { cache: "no-store" });
    if (r.ok) setData(await r.json());
  }, []);
  useEffect(() => {
    if (signedIn) queueMicrotask(() => void load());
  }, [signedIn, load]);

  async function cancel(id: string) {
    if (!confirm("Cancelar esta assinatura? Você continua com acesso até o fim do período já pago.")) return;
    const r = await fetch("/api/me/subscriptions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const d = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) return toast.error(d.error || "Não foi possível cancelar.");
    toast.success("Assinatura cancelada.");
    void load();
  }

  if (!signedIn)
    return (
      <section className="subs">
        <h1>Minhas assinaturas</h1>
        <p><Link href="/entrar?return_to=/assinaturas">Entre na sua conta</Link> para ver suas assinaturas e compras.</p>
      </section>
    );
  if (!data) return <p className="dash-muted" role="status">Carregando…</p>;
  return (
    <section className="subs">
      <h1>Minhas assinaturas</h1>
      <h2>Assinaturas</h2>
      {data.subscriptions.length === 0 ? (
        <p className="dash-muted">Você ainda não assina nenhum criador.</p>
      ) : (
        <ul className="subs-list">
          {data.subscriptions.map((s) => (
            <li key={s.id} className="glass subs-row">
              <div>
                <strong><Link href={`/pessoas/${s.creatorSlug}`}>{s.creatorName}</Link> · {s.planName}</strong>
                <small>{brl(s.priceCents)}/mês · {LABEL[s.status] ?? s.status}{s.currentPeriodEnd ? ` · acesso até ${day(s.currentPeriodEnd)}` : ""}</small>
              </div>
              {s.status === "active" && <button className="outline small" onClick={() => cancel(s.id)}>Cancelar</button>}
            </li>
          ))}
        </ul>
      )}
      <h2>Textos comprados</h2>
      {data.purchases.length === 0 ? (
        <p className="dash-muted">Nenhuma compra avulsa ainda.</p>
      ) : (
        <ul className="subs-list">
          {data.purchases.map((b) => (
            <li key={b.id} className="glass subs-row">
              <div>
                <strong><Link href={`/textos/${b.notebookId}`}>{b.title}</Link></strong>
                <small>{b.creatorName} · {day(b.startsAt)}{b.status === "revoked" ? " · estornado" : ""}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
