"use client";
import ReviewCard, { type Action } from "../review-card";
import { Empty, Loading, fmtDate, send, useAdminList } from "../ui";

type Item = {
  id: string; kind: string; title: string; area: string; author: string; summary: string; methodology: string;
  references: string; budgetCents: number; status: string; reviewNote: string; createdAt: string;
  ownerName: string | null; ownerEmail: string | null;
};
const kind: Record<string, string> = {
  book: "Livro", "new-project": "Projeto NEW", article: "Artigo / ensaio", question: "Pergunta", application: "Candidatura", project: "Projeto de pesquisa",
};
const status: Record<string, [string, "ok" | "warn" | "bad" | "info"]> = {
  received: ["Recebido", "warn"], reviewing: ["Em análise", "info"], changes_requested: ["Ajustes pedidos", "warn"],
  accepted: ["Aceito", "ok"], rejected: ["Recusado", "bad"],
};
const money = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SubmissionsPanel() {
  const { items, error, reload } = useAdminList<Item>("/api/admin/submissions");
  if (!items) return <Loading />;
  return (
    <>
      {error && <p className="adm-error">{error}</p>}
      {!items.length && <Empty title="Nenhum envio" text="Artigos, livros e propostas enviados em “Pesquisador” aparecem aqui." />}
      <div className="adm-stack">
        {items.map((s) => {
          const open = ["received", "reviewing"].includes(s.status);
          const [label, tone] = status[s.status] ?? [s.status, undefined];
          return (
            <ReviewCard
              key={s.id}
              open={open}
              title={s.title}
              meta={`${kind[s.kind] ?? s.kind} · ${s.area} · ${s.author} (${s.ownerEmail ?? "—"}) · ${fmtDate(s.createdAt)}`}
              statusLabel={label}
              statusTone={tone}
              savedNote={s.reviewNote}
              sections={[
                { label: "Resumo", text: s.summary },
                { label: "Método / estrutura", text: s.methodology },
                { label: "Referências", text: s.references },
                { label: "Orçamento proposto", text: s.budgetCents ? money(s.budgetCents) : "" },
              ]}
              actions={([
                { label: "Aceitar", value: "accepted", tone: "primary" },
                { label: "Em análise", value: "reviewing" },
                { label: "Pedir ajustes", value: "changes_requested" },
                { label: "Recusar", value: "rejected", tone: "danger" },
              ] as Action[]).filter((a) => a.value !== s.status)}
              onDecide={async (st, note) => {
                await send("/api/admin/submissions", { id: s.id, status: st, note });
                await reload();
              }}
            />
          );
        })}
      </div>
    </>
  );
}
