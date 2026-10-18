"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Empty, Loading, Pill, fmtDate, send, useAdminList } from "../ui";

type Payment = {
  id: string; kind: string; amountCents: number; commissionCents: number; status: string; createdAt: string;
  payerName: string; payerEmail: string; creatorName: string; creatorOwnerId: string; title: string | null;
};
type Creator = {
  ownerId: string; name: string; email: string; payoutStatus: string | null; blockedReason: string | null;
  paidCents: number; commissionCents: number; refundedCents: number; activeSubscribers: number;
};
type Summary = { paidCents: number; commissionCents: number; refundedCents: number; pending: number; truncated: boolean };

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const STATUS: Record<string, [string, "ok" | "warn" | "bad" | "info"]> = {
  paid: ["Pago", "ok"], pending: ["Aguardando", "info"], overdue: ["Vencido", "warn"], refunded: ["Estornado", "bad"],
};
const PAYOUT: Record<string, string> = { pending: "Em análise", active: "Ativa", creating: "Criando", rejected: "Recusada" };

export default function PaymentsPanel() {
  const { items, extra, error, reload } = useAdminList<Payment>("/api/admin/payments");
  const [busy, setBusy] = useState("");
  if (!items) return <Loading />;
  const creators = (extra.creators as Creator[] | undefined) ?? [];
  const summary = extra.summary as Summary | undefined;
  const money = extra.moneyEnabled as boolean | undefined;

  async function run(key: string, body: unknown, ok: string) {
    setBusy(key);
    try {
      const r = await send<{ canceled?: number; failed?: number }>("/api/admin/payments", body);
      toast.success(r.canceled !== undefined ? `${ok} ${r.canceled} assinatura(s) cancelada(s)${r.failed ? `, ${r.failed} falharam` : ""}.` : ok);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setBusy("");
    }
  }

  function refund(p: Payment) {
    if (!confirm(`Estornar ${brl(p.amountCents)} de ${p.payerName}? O dinheiro volta ao pagador e o acesso é revogado. Não dá para desfazer.`)) return;
    void run("r" + p.id, { action: "refund", paymentId: p.id, note: "" }, "Pagamento estornado.");
  }
  function block(c: Creator) {
    const reason = prompt(`Motivo do bloqueio de ${c.name} (aparece só para a equipe):`);
    if (!reason || reason.trim().length < 5) return;
    const cancel = confirm("Cancelar também as assinaturas ativas deste criador? OK = cancelar e parar as cobranças. Cancelar = manter.");
    void run("b" + c.ownerId, { action: "block-creator", ownerId: c.ownerId, reason: reason.trim(), cancelSubscriptions: cancel }, "Criador bloqueado.");
  }

  return (
    <>
      {money === false && <p className="adm-muted">Pagamentos estão desligados neste ambiente (FEATURE_MONEY=0). Os dados abaixo são do que já existe no banco.</p>}
      {error && <p className="adm-error">{error}</p>}
      {summary && (
        <div className="adm-cards">
          <div className="glass adm-card"><strong>{brl(summary.paidCents)}</strong><span>Vendas pagas</span><small>valor bruto</small></div>
          <div className="glass adm-card hot"><strong>{brl(summary.commissionCents)}</strong><span>Comissão da NEW</span><small>sobre as vendas pagas</small></div>
          <div className="glass adm-card"><strong>{brl(summary.paidCents - summary.commissionCents)}</strong><span>Dos criadores</span><small>líquido, repassado pelo provedor</small></div>
          <div className="glass adm-card"><strong>{brl(summary.refundedCents)}</strong><span>Estornado</span><small>{summary.pending} pagamento(s) aguardando</small></div>
        </div>
      )}

      <h2 className="adm-sub">Criadores</h2>
      {creators.length === 0 ? (
        <Empty title="Nenhum criador com conta de recebimento ainda" />
      ) : (
        <div className="glass adm-table">
          <table>
            <thead><tr><th>Criador</th><th>Conta</th><th>Vendas</th><th>Líquido</th><th>Comissão</th><th>Estornos</th><th>Assinantes</th><th></th></tr></thead>
            <tbody>
              {creators.map((c) => (
                <tr key={c.ownerId}>
                  <td>{c.name}<br /><small>{c.email}</small>{c.blockedReason && <><br /><Pill tone="bad">Bloqueado</Pill> <small>{c.blockedReason}</small></>}</td>
                  <td>{c.payoutStatus ? PAYOUT[c.payoutStatus] ?? c.payoutStatus : "—"}</td>
                  <td>{brl(c.paidCents)}</td>
                  <td>{brl(c.paidCents - c.commissionCents)}</td>
                  <td>{brl(c.commissionCents)}</td>
                  <td>{brl(c.refundedCents)}</td>
                  <td>{c.activeSubscribers}</td>
                  <td>
                    {c.blockedReason ? (
                      <button className="outline small" disabled={busy === "u" + c.ownerId} onClick={() => void run("u" + c.ownerId, { action: "unblock-creator", ownerId: c.ownerId }, "Criador liberado.")}>Liberar</button>
                    ) : (
                      <button className="outline small" disabled={busy === "b" + c.ownerId} onClick={() => block(c)}>Bloquear</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="adm-sub">Pagamentos</h2>
      {items.length === 0 ? (
        <Empty title="Nenhum pagamento ainda" />
      ) : (
        <div className="glass adm-table">
          <table>
            <thead><tr><th>Data</th><th>Pagador</th><th>Criador</th><th>O quê</th><th>Valor</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {items.map((p) => {
                const [label, tone] = STATUS[p.status] ?? [p.status, "info" as const];
                return (
                  <tr key={p.id}>
                    <td>{fmtDate(p.createdAt)}</td>
                    <td>{p.payerName}<br /><small>{p.payerEmail}</small></td>
                    <td>{p.creatorName}</td>
                    <td>{p.kind === "subscription" ? "Assinatura mensal" : p.title ?? "Texto"}</td>
                    <td>{brl(p.amountCents)}<br /><small>NEW {brl(p.commissionCents)}</small></td>
                    <td><Pill tone={tone}>{label}</Pill></td>
                    <td>{p.status === "paid" && <button className="outline small" disabled={busy === "r" + p.id} onClick={() => refund(p)}>Estornar</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {summary?.truncated && <p className="adm-muted">Mostrando os 200 pagamentos mais recentes.</p>}
    </>
  );
}
