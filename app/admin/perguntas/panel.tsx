"use client";
import ReviewCard, { type Action } from "../review-card";
import { Empty, Loading, fmtDate, send, useAdminList } from "../ui";

type Item = {
  id: string; title: string; context: string; importance: string; status: string; reviewNote: string;
  createdAt: string; name: string | null; email: string | null;
};
const status: Record<string, [string, "ok" | "warn" | "bad" | "info"]> = {
  submitted: ["Aguardando", "warn"], reviewing: ["Em análise", "info"], changes_requested: ["Ajustes pedidos", "warn"],
  published: ["Publicada", "ok"], selected: ["Selecionada", "ok"], rejected: ["Recusada", "bad"],
};

export default function QuestionsPanel() {
  const { items, error, reload } = useAdminList<Item>("/api/admin/questions");
  if (!items) return <Loading />;
  return (
    <>
      {error && <p className="adm-error">{error}</p>}
      {!items.length && <Empty title="Nenhuma pergunta" text="Perguntas enviadas pela comunidade entram aqui para triagem." />}
      <div className="adm-stack">
        {items.map((q) => {
          const open = ["submitted", "reviewing"].includes(q.status);
          const [label, tone] = status[q.status] ?? [q.status, undefined];
          return (
            <ReviewCard
              key={q.id}
              open={open}
              title={q.title}
              meta={`${q.name ?? "Usuário"} · ${q.email ?? ""} · ${fmtDate(q.createdAt)}`}
              statusLabel={label}
              statusTone={tone}
              savedNote={q.reviewNote}
              sections={[{ label: "Contexto", text: q.context }, { label: "Por que importa", text: q.importance }]}
              actions={([
                { label: "Publicar", value: "published", tone: "primary" },
                { label: "Selecionar", value: "selected", tone: "primary" },
                { label: "Em análise", value: "reviewing" },
                { label: "Pedir ajustes", value: "changes_requested" },
                { label: "Recusar", value: "rejected", tone: "danger" },
              ] as Action[]).filter((a) => a.value !== q.status)}
              onDecide={async (st, note) => {
                await send("/api/admin/questions", { id: q.id, status: st, note });
                await reload();
              }}
            />
          );
        })}
      </div>
    </>
  );
}
