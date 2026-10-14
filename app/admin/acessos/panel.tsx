"use client";
import ReviewCard from "../review-card";
import { Empty, Loading, fmtDate, send, useAdminList } from "../ui";

type Item = {
  id: string; requestedRole: string; presentation: string; experience: string; portfolio: string;
  motivation: string; status: string; reviewNote: string; createdAt: string; name: string | null; email: string | null; currentRole: string;
};
const role: Record<string, string> = { creator: "Criador", researcher: "Pesquisador" };
const status: Record<string, [string, "ok" | "warn" | "bad" | "info"]> = {
  submitted: ["Aguardando", "warn"], reviewing: ["Em análise", "info"], changes_requested: ["Ajustes pedidos", "warn"],
  approved: ["Aprovado", "ok"], rejected: ["Recusado", "bad"],
};

export default function AccessPanel() {
  const { items, error, reload } = useAdminList<Item>("/api/admin/requests");
  if (!items) return <Loading />;
  return (
    <>
      {error && <p className="adm-error">{error}</p>}
      {!items.length && <Empty title="Nenhum pedido de acesso" text="Quando alguém solicitar o perfil de criador ou pesquisador, aparece aqui." />}
      <div className="adm-stack">
        {items.map((r) => {
          const open = ["submitted", "reviewing", "changes_requested"].includes(r.status);
          const [label, tone] = status[r.status] ?? [r.status, undefined];
          return (
            <ReviewCard
              key={r.id}
              open={open}
              title={`${r.name ?? "Usuário"} → ${role[r.requestedRole] ?? r.requestedRole}`}
              meta={`${r.email ?? ""} · ${fmtDate(r.createdAt)} · hoje: ${r.currentRole}`}
              statusLabel={label}
              statusTone={tone}
              savedNote={r.reviewNote}
              sections={[
                { label: "Apresentação", text: r.presentation },
                { label: "Experiência e temas", text: r.experience },
                { label: "Portfólio", text: r.portfolio },
                { label: "Por que produzir na NEW", text: r.motivation },
              ]}
              actions={open ? [
                { label: "Aprovar", value: "approve", tone: "primary" },
                { label: "Em análise", value: "reviewing" },
                { label: "Pedir ajustes", value: "changes" },
                { label: "Recusar", value: "reject", tone: "danger" },
              ] : []}
              onDecide={async (decision, note) => {
                await send("/api/admin/requests", { id: r.id, decision, note });
                await reload();
              }}
            />
          );
        })}
      </div>
    </>
  );
}
