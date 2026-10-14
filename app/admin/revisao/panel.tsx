"use client";
import { useState } from "react";
import { toast } from "sonner";
import Markdown from "@/components/editor/markdown";
import { Empty, Loading, Pill, fmtDate, send, useAdminList } from "../ui";

type Item = {
  id: string; slug: string; title: string; summary: string; area: string; kind: string; authorName: string; body: string;
  referencesText: string; readingMinutes: number; status: string; reviewNote: string; submittedAt: string | null;
  updatedAt: string; ownerName: string; ownerEmail: string;
};
const status: Record<string, [string, "ok" | "warn" | "bad" | "info"]> = {
  submitted: ["Aguardando revisão", "warn"], reviewing: ["Em revisão", "info"],
  changes_requested: ["Ajustes pedidos", "warn"], rejected: ["Recusado", "bad"],
};

function ReviewArticle({ a, onDone }: { a: Item; onDone: () => Promise<void> }) {
  const open = ["submitted", "reviewing"].includes(a.status);
  const [expanded, setExpanded] = useState(open);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [label, tone] = status[a.status] ?? [a.status, undefined];

  async function decide(decision: "reviewing" | "changes" | "reject" | "publish") {
    if ((decision === "changes" || decision === "reject") && note.trim().length < 5) {
      toast.error("Escreva na nota o motivo para o autor.");
      return;
    }
    if (decision === "publish" && !confirm("Publicar este artigo na Revista agora?")) return;
    setBusy(true);
    try {
      await send("/api/admin/review", { id: a.id, decision, note });
      toast.success(decision === "publish" ? "Artigo publicado na Revista." : "Decisão registrada.");
      setNote("");
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao registrar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={"glass adm-review" + (open ? " open" : "")}>
      <header onClick={() => setExpanded(!expanded)}>
        <div>
          <h3>{a.title || "(sem título)"}</h3>
          <small>
            {a.authorName} ({a.ownerEmail}) · {a.kind} · {a.area} · {a.readingMinutes} min · {a.submittedAt ? fmtDate(a.submittedAt) : fmtDate(a.updatedAt)}
          </small>
        </div>
        <Pill tone={tone}>{label}</Pill>
      </header>
      {expanded && (
        <div className="adm-review-body">
          <div>
            <span>Resumo</span>
            <p>{a.summary}</p>
          </div>
          <div>
            <span>Texto completo</span>
            <div className="adm-article-preview reading article-reading">
              <Markdown>{a.body}</Markdown>
            </div>
          </div>
          {a.referencesText && (
            <div>
              <span>Referências</span>
              <p>{a.referencesText}</p>
            </div>
          )}
          {a.reviewNote && (
            <div>
              <span>Última nota da equipe</span>
              <p>{a.reviewNote}</p>
            </div>
          )}
          {open && (
            <div className="adm-review-actions">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Nota para o autor (obrigatória para pedir ajustes ou recusar; opcional ao publicar)"
              />
              <div>
                <button className="adm-act primary" disabled={busy} onClick={() => void decide("publish")}>
                  Aprovar e publicar
                </button>
                <button className="adm-act" disabled={busy} onClick={() => void decide("changes")}>
                  Pedir ajustes
                </button>
                {a.status === "submitted" && (
                  <button className="adm-act" disabled={busy} onClick={() => void decide("reviewing")}>
                    Marcar em revisão
                  </button>
                )}
                <button className="adm-act danger" disabled={busy} onClick={() => void decide("reject")}>
                  Recusar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function ReviewPanel() {
  const { items, error, reload } = useAdminList<Item>("/api/admin/review");
  if (!items) return <Loading />;
  return (
    <>
      {error && <p className="adm-error">{error}</p>}
      {!items.length && (
        <Empty title="Nenhum artigo para revisar" text="Quando alguém enviar um artigo para a Revista, ele aparece aqui com o texto completo." />
      )}
      <div className="adm-stack">
        {items.map((a) => (
          <ReviewArticle key={a.id} a={a} onDone={reload} />
        ))}
      </div>
    </>
  );
}
