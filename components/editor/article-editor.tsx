"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import RichEditor from "./rich-editor";
import { ARTICLE_AREAS, ARTICLE_KINDS, MIN_BODY_CHARS } from "@/lib/author-validation";

export type EditableArticle = {
  id: string | null;
  title: string;
  summary: string;
  area: string;
  kind: string;
  authorName: string;
  body: string;
  referencesText: string;
  status: string;
  reviewNote: string;
};

type Save = "idle" | "saving" | "saved" | "error";

export default function ArticleEditor({ initial, readOnlyReason }: { initial: EditableArticle; readOnlyReason?: string }) {
  const router = useRouter();
  const [a, setA] = useState(initial);
  const [save, setSave] = useState<Save>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const readOnly = !!readOnlyReason;
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [a.title]);

  const latest = useRef(a);
  const idRef = useRef<string | null>(initial.id);
  const dirty = useRef(false);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const words = a.body.trim() ? a.body.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  const chars = a.body.trim().length;

  const persist = useCallback(async (action: "save" | "submit"): Promise<{ ok: boolean; error?: string }> => {
    const cur = latest.current;
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(idRef.current ? { id: idRef.current } : {}),
        action,
        title: cur.title,
        summary: cur.summary,
        area: cur.area,
        kind: cur.kind,
        authorName: cur.authorName,
        body: cur.body,
        referencesText: cur.referencesText,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Não foi possível salvar." };
    if (data.id && !idRef.current) {
      idRef.current = data.id;
      window.history.replaceState(null, "", `/escrever/${data.id}`);
    }
    return { ok: true };
  }, []);

  const autosave = useCallback(async function run(): Promise<void> {
    if (inFlight.current || !dirty.current) return;
    inFlight.current = true;
    dirty.current = false;
    setSave("saving");
    const r = await persist("save");
    inFlight.current = false;
    if (r.ok) {
      setSave("saved");
      setSavedAt(new Date());
    } else {
      setSave("error");
      dirty.current = true;
    }
    if (dirty.current && r.ok) void run();
  }, [persist]);

  function change(patch: Partial<EditableArticle>) {
    if (readOnly) return;
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setA(next);
    if (!next.title.trim() && !next.body.trim()) return; // não cria rascunho vazio
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void autosave(), 2500);
  }

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function saveNow() {
    if (timer.current) clearTimeout(timer.current);
    if (!latest.current.title.trim() && !latest.current.body.trim()) {
      toast.info("Escreva algo antes de salvar.");
      return;
    }
    dirty.current = true;
    await autosave();
    if (!dirty.current) toast.success("Rascunho salvo.");
  }

  async function submit() {
    if (timer.current) clearTimeout(timer.current);
    if (
      !window.confirm(
        "Enviar para revisão da equipe?\n\nDepois de enviado você não poderá editar até a decisão. A equipe pode aprovar e publicar, pedir ajustes ou recusar.",
      )
    )
      return;
    setSubmitting(true);
    const r = await persist("submit");
    setSubmitting(false);
    if (!r.ok) {
      toast.error(r.error || "Não foi possível enviar.");
      return;
    }
    dirty.current = false;
    toast.success("Artigo enviado para revisão.");
    router.push("/minha-new");
    router.refresh();
  }

  const statusText =
    save === "saving" ? "Salvando…" : save === "saved" && savedAt ? `Salvo às ${savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : save === "error" ? "Falha ao salvar — tentando de novo ao editar" : a.id ? "Rascunho" : "Novo artigo";

  return (
    <div className="writer">
      <header className="writer-bar">
        <Link href="/minha-new" className="writer-back" onClick={(e) => { if (dirty.current && !window.confirm("Há alterações não salvas. Sair mesmo assim?")) e.preventDefault(); }}>
          <ArrowLeft size={16} /> Minha NEW
        </Link>
        <span className="writer-brand">Revista NEW<i>.</i></span>
        <span className={"writer-status " + save}>
          {save === "saving" ? <Loader2 size={14} className="spin" /> : save === "saved" ? <Check size={14} /> : null} {statusText}
        </span>
        <span className="writer-spacer" />
        {!readOnly && (
          <>
            <button className="writer-btn" onClick={() => void saveNow()} disabled={submitting}>Salvar rascunho</button>
            <button className="writer-btn primary" onClick={() => void submit()} disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar para revisão"}
            </button>
          </>
        )}
      </header>

      <main className="writer-page">
        {readOnlyReason && <div className="writer-banner info">{readOnlyReason}</div>}
        {a.status === "changes_requested" && a.reviewNote && (
          <div className="writer-banner warn">
            <strong>A equipe pediu ajustes:</strong> {a.reviewNote}
          </div>
        )}

        <textarea
          ref={titleRef}
          className="writer-title"
          rows={1}
          maxLength={200}
          placeholder="Título do artigo"
          value={a.title}
          readOnly={readOnly}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              document.querySelector<HTMLTextAreaElement>(".writer-summary")?.focus();
            }
          }}
          onChange={(e) => {
            const raw = e.target.value;
            change({ title: raw.replace(/\n/g, " ") });
            if (raw.includes("\n")) document.querySelector<HTMLTextAreaElement>(".writer-summary")?.focus();
          }}
        />
        <textarea
          className="writer-summary"
          rows={2}
          maxLength={500}
          placeholder="Resumo em uma ou duas frases — aparece na Revista e nos buscadores"
          value={a.summary}
          readOnly={readOnly}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              document.querySelector<HTMLElement>(".rte-content")?.focus();
            }
          }}
          onChange={(e) => {
            const raw = e.target.value;
            change({ summary: raw.replace(/\n/g, " ").trimStart() });
            if (raw.includes("\n")) document.querySelector<HTMLElement>(".rte-content")?.focus();
          }}
        />

        <div className="writer-meta">
          <label>
            Área
            <input list="area-sugestoes" value={a.area} maxLength={60} readOnly={readOnly} placeholder="Ex.: Educação" onChange={(ev) => change({ area: ev.target.value })} />
            <datalist id="area-sugestoes">
              {ARTICLE_AREAS.map((x) => <option key={x} value={x} />)}
            </datalist>
          </label>
          <label>
            Tipo
            <select value={a.kind} disabled={readOnly} onChange={(e) => change({ kind: e.target.value })}>
              {ARTICLE_KINDS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label>
            Assinatura (autoria)
            <input value={a.authorName} maxLength={120} readOnly={readOnly} onChange={(e) => change({ authorName: e.target.value })} />
          </label>
        </div>

        <RichEditor value={a.body} onChange={(md) => change({ body: md })} editable={!readOnly} placeholder="Escreva aqui o seu artigo. Use os botões acima para títulos, negrito, listas e citações." />

        <label className="writer-refs">
          Referências e fontes (opcional)
          <textarea rows={4} maxLength={4000} value={a.referencesText} readOnly={readOnly} onChange={(e) => change({ referencesText: e.target.value })} placeholder="Livros, artigos, links e dados em que o texto se apoia." />
        </label>

        <footer className="writer-foot">
          <span>{words.toLocaleString("pt-BR")} palavras · {minutes} min de leitura</span>
          {chars < MIN_BODY_CHARS && !readOnly && <span className="hint">Para enviar à revisão, escreva pelo menos {MIN_BODY_CHARS} caracteres ({Math.max(0, MIN_BODY_CHARS - chars)} restantes).</span>}
        </footer>
      </main>
    </div>
  );
}
