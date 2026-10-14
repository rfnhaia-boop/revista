"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import RichEditor from "./rich-editor";

export const THOUGHT_FORMATS = ["Pensamento", "Anotação", "Reflexão", "Poesia"] as const;
export const THOUGHT_TOPICS = ["Psicologia", "Tecnologia", "Educação", "Sociedade", "Filosofia", "Negócios", "Literatura"] as const;
const MIN_TITLE = 5;
const MIN_BODY = 40;

export type EditableThought = {
  id: string;
  title: string;
  body: string;
  format: string;
  area: string;
  status: string; // draft | published | hidden
  isNew: boolean;
};

/** Resumo público automático: primeiras palavras do texto, sem marcas de Markdown. */
export function deriveExcerpt(title: string, body: string) {
  const plain = body
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[>#\-*\d.\s]+/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const base = plain.length >= 20 ? plain : `${title}. ${plain}`.trim();
  if (base.length <= 220) return base;
  const cut = base.slice(0, 220);
  return cut.slice(0, cut.lastIndexOf(" ") > 120 ? cut.lastIndexOf(" ") : 220).trimEnd() + "…";
}

type Save = "idle" | "saving" | "saved" | "error";

export default function ThoughtEditor({ initial }: { initial: EditableThought }) {
  const router = useRouter();
  const [t, setT] = useState(initial);
  const [save, setSave] = useState<Save>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const readOnly = initial.status === "hidden";
  const isPublished = initial.status === "published";
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const latest = useRef(t);
  const dirty = useRef(false);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlFixed = useRef(!initial.isNew);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [t.title]);

  const valid = (c: EditableThought) => c.title.trim().length >= MIN_TITLE && c.body.trim().length >= MIN_BODY;

  const persist = useCallback(async (status: "draft" | "published") => {
    const c = latest.current;
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "post",
        id: c.id,
        title: c.title.trim(),
        excerpt: deriveExcerpt(c.title, c.body),
        body: c.body.trim(),
        format: c.format,
        area: c.area,
        access: "free",
        priceCents: 0,
        status,
        consent: true,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false as const, error: data.error || "Não foi possível salvar." };
    if (!urlFixed.current) {
      urlFixed.current = true;
      window.history.replaceState(null, "", `/escrever/pensamento/${c.id}`);
    }
    return { ok: true as const };
  }, []);

  const autosave = useCallback(async function run(): Promise<void> {
    if (inFlight.current || !dirty.current || !valid(latest.current)) return;
    inFlight.current = true;
    dirty.current = false;
    setSave("saving");
    const r = await persist("draft");
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

  function change(patch: Partial<EditableThought>) {
    if (readOnly) return;
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setT(next);
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    if (!isPublished) timer.current = setTimeout(() => void autosave(), 2500);
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

  async function saveDraft() {
    if (timer.current) clearTimeout(timer.current);
    if (!valid(latest.current)) return toast.info(`Para salvar, escreva um título (${MIN_TITLE}+ letras) e um texto (${MIN_BODY}+ caracteres).`);
    setBusy(true);
    const r = await persist("draft");
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    dirty.current = false;
    setSave("saved");
    setSavedAt(new Date());
    toast.success("Rascunho salvo no seu Caderno.");
  }

  async function publish() {
    if (timer.current) clearTimeout(timer.current);
    if (!valid(latest.current)) return toast.info(`Para publicar, escreva um título (${MIN_TITLE}+ letras) e um texto (${MIN_BODY}+ caracteres).`);
    setBusy(true);
    const r = await persist("published");
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    dirty.current = false;
    toast.success(isPublished ? "Alterações publicadas." : "Pensamento publicado.");
    router.push(`/textos/${latest.current.id}`);
    router.refresh();
  }

  const words = t.body.trim() ? t.body.trim().split(/\s+/).length : 0;
  const ready = valid(t);
  const statusText =
    save === "saving"
      ? "Salvando…"
      : save === "saved" && savedAt
        ? `Salvo às ${savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
        : save === "error"
          ? "Falha ao salvar — tentando de novo"
          : isPublished
            ? "Publicado"
            : initial.isNew
              ? "Novo pensamento"
              : "Rascunho";

  return (
    <div className="writer">
      <header className="writer-bar">
        <Link
          href="/caderno"
          className="writer-back"
          onClick={(e) => {
            if (dirty.current && !window.confirm("Há alterações não salvas. Sair mesmo assim?")) e.preventDefault();
          }}
        >
          <ArrowLeft size={16} /> Meu Caderno
        </Link>
        <span className="writer-brand">
          Revista NEW<i>.</i>
        </span>
        <span className={"writer-status " + save}>
          {save === "saving" ? <Loader2 size={14} className="spin" /> : save === "saved" ? <Check size={14} /> : null} {statusText}
        </span>
        <span className="writer-spacer" />
        {!readOnly && (
          <>
            {!isPublished && (
              <button className="writer-btn" onClick={() => void saveDraft()} disabled={busy}>
                Salvar rascunho
              </button>
            )}
            <button className="writer-btn primary" onClick={() => void publish()} disabled={busy}>
              {busy ? "Publicando…" : isPublished ? "Salvar alterações" : "Publicar"}
            </button>
          </>
        )}
      </header>

      <main className="writer-page">
        {readOnly && <div className="writer-banner info">Este texto foi ocultado pela equipe e não pode ser editado.</div>}

        <div className="tw-chips" role="radiogroup" aria-label="Formato">
          {THOUGHT_FORMATS.map((f) => (
            <button key={f} role="radio" aria-checked={t.format === f} className={t.format === f ? "on" : ""} disabled={readOnly} onClick={() => change({ format: f })}>
              {f}
            </button>
          ))}
        </div>

        <textarea
          ref={titleRef}
          className="writer-title"
          rows={1}
          maxLength={180}
          placeholder="Dê um título ao seu pensamento"
          value={t.title}
          readOnly={readOnly}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              document.querySelector<HTMLElement>(".rte-content")?.focus();
            }
          }}
          onChange={(e) => change({ title: e.target.value.replace(/\n/g, " ") })}
        />

        <RichEditor
          value={t.body}
          onChange={(md) => change({ body: md })}
          editable={!readOnly}
          placeholder="Escreva livremente. Uma ideia, uma anotação, um poema — o que estiver na sua cabeça agora."
        />

        <div className="tw-topic">
          <span>Tema</span>
          <div className="tw-chips small" role="radiogroup" aria-label="Tema">
            {THOUGHT_TOPICS.map((x) => (
              <button key={x} role="radio" aria-checked={t.area === x} className={t.area === x ? "on" : ""} disabled={readOnly} onClick={() => change({ area: x })}>
                {x}
              </button>
            ))}
          </div>
        </div>

        <footer className="writer-foot">
          <span>{words.toLocaleString("pt-BR")} palavras</span>
          {!readOnly && !ready && <span className="hint">Falta pouco para salvar: título com {MIN_TITLE}+ letras e texto com {MIN_BODY}+ caracteres.</span>}
        </footer>
        <p className="tw-legal">
          Ao publicar, você confirma que tem direito de publicar este conteúdo. Ele aparece como conteúdo independente, sem avaliação da NEW.
        </p>
      </main>
    </div>
  );
}
