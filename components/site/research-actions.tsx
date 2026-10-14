"use client";
import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthGate, useSubmissions } from "./submissions";

/** Propor uma pergunta: vai para a triagem privada da equipe (Admin → Perguntas). */
export function ProposeQuestionButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  const { signedIn } = useSubmissions();
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "question",
          title: String(f.get("title")),
          context: String(f.get("context")),
          importance: String(f.get("importance")),
          consent,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Não foi possível enviar.");
      setOpen(false);
      setConsent(false);
      toast.success("Pergunta recebida. Ela passa por uma triagem antes de ser publicada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no envio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button className={className ?? "primary"} onClick={() => setOpen(true)}>
        {children ?? (
          <>
            <Plus size={17} /> Propor pergunta
          </>
        )}
      </button>
      <Dialog open={open} onOpenChange={(v) => !saving && setOpen(v)}>
        <DialogContent className="submission-dialog">
          <DialogTitle>Propor uma pergunta</DialogTitle>
          <DialogDescription>
            Ela não fica pública automaticamente. A equipe verifica clareza, relevância, segurança e possibilidade de investigação.
          </DialogDescription>
          {!signedIn ? (
            <AuthGate />
          ) : (
            <form className="submission-form" onSubmit={submit}>
              <label className="field">
                Pergunta
                <input name="title" required minLength={10} maxLength={220} placeholder="Qual problema você quer ver investigado?" />
              </label>
              <label className="field">
                Contexto
                <textarea name="context" required minLength={30} maxLength={3000} rows={4} placeholder="O que você observou? Onde isso acontece?" />
              </label>
              <label className="field">
                Por que isso importa?
                <textarea name="importance" required minLength={30} maxLength={2000} rows={3} />
              </label>
              <label className="consent">
                <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} />
                Autorizo a análise editorial e, se aprovada, a publicação da pergunta.
              </label>
              {error && <p className="error" role="alert">{error}</p>}
              <button className="primary full" disabled={saving || !consent}>
                {saving ? "Enviando…" : "Enviar para triagem"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Roteiro ilustrativo de teste técnico + atalho para candidatura. */
export function ExamButton() {
  const { open } = useSubmissions();
  const [show, setShow] = useState(false);
  return (
    <>
      <button className="outline full" onClick={() => setShow(true)}>
        Ver exemplo de teste técnico
      </button>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent>
          <DialogTitle>Exemplo de teste técnico</DialogTitle>
          <DialogDescription>Tema: IA na aprendizagem. Roteiro ilustrativo, não certificação.</DialogDescription>
          <ol className="exam-list">
            <li>Como distinguir melhoria de desempenho de uso da ferramenta para produzir respostas?</li>
            <li>Que comparação ou desenho de estudo permitiria investigar essa diferença?</li>
            <li>Quais variáveis podem confundir o resultado e como tratá-las?</li>
            <li>Como proteger participantes e registrar o protocolo antes da coleta?</li>
            <li>O que contaria como evidência contrária ou resultado inconclusivo?</li>
          </ol>
          <p className="fine">A seleção inclui avaliação humana, experiência, método e regras éticas do projeto.</p>
          <button
            className="primary"
            onClick={() => {
              setShow(false);
              open("application");
            }}
          >
            Apresentar candidatura
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ApplyButton({ children }: { children: React.ReactNode }) {
  const { open } = useSubmissions();
  return (
    <button className="textbutton" onClick={() => open("application")}>
      {children} <ChevronRight size={15} />
    </button>
  );
}
