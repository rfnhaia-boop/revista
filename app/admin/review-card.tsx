"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Pill } from "./ui";

export type Action = { label: string; value: string; tone?: "primary" | "danger" | "ghost" };

export default function ReviewCard({
  title,
  meta,
  sections,
  statusLabel,
  statusTone,
  savedNote,
  actions,
  open,
  onDecide,
}: {
  title: string;
  meta: string;
  sections: { label: string; text: string }[];
  statusLabel: string;
  statusTone?: "ok" | "warn" | "bad" | "info";
  savedNote?: string;
  actions: Action[];
  open: boolean;
  onDecide: (value: string, note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(open);

  async function decide(value: string) {
    setBusy(true);
    try {
      await onDecide(value, note);
      setNote("");
      toast.success("Decisão registrada.");
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
          <h3>{title}</h3>
          <small>{meta}</small>
        </div>
        <Pill tone={statusTone}>{statusLabel}</Pill>
      </header>
      {expanded && (
        <div className="adm-review-body">
          {sections.map((s) =>
            s.text ? (
              <div key={s.label}>
                <span>{s.label}</span>
                <p>{s.text}</p>
              </div>
            ) : null,
          )}
          {savedNote && (
            <div>
              <span>Nota da equipe</span>
              <p>{savedNote}</p>
            </div>
          )}
          <div className="adm-review-actions">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Nota para o autor (opcional, visível pra ele)"
            />
            <div>
              {actions.map((a) => (
                <button
                  key={a.value}
                  disabled={busy}
                  className={"adm-act " + (a.tone ?? "ghost")}
                  onClick={() => void decide(a.value)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
