"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Check, ChevronLeft, ChevronRight, Highlighter, MessageSquareText, PanelRightClose, PanelRightOpen, PenLine, Quote, Tags, X } from "lucide-react";
import { toast } from "sonner";

const TAGS = ["Memória", "Narrador", "Psicologia", "Linguagem", "Dúvida"];
type Note = { id: string; chapter: number; paragraph: number; quote: string; body: string; tag: string; createdAt: string };
type Props = {
  book: { id: string; slug: string; title: string; author: string; year: number | null; licenseLabel: string };
  toc: { position: number; title: string }[];
  chapter: { position: number; title: string; paragraphs: string[] };
  signedIn: boolean;
  initial: { notes: Note[]; marks: { chapter: number; paragraph: number }[]; startParagraph: number | null };
};

async function call(body: unknown) {
  const r = await fetch("/api/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = (await r.json().catch(() => ({}))) as { error?: string; id?: string; marked?: boolean };
  if (!r.ok) throw new Error(d.error || "Não foi possível concluir.");
  return d;
}

export default function Reader({ book, toc, chapter, signedIn, initial }: Props) {
  const [selected, setSelected] = useState<number | null>(initial.startParagraph);
  const [notes, setNotes] = useState<Note[]>(initial.notes);
  const [marks, setMarks] = useState<number[]>(initial.marks.filter((m) => m.chapter === chapter.position).map((m) => m.paragraph));
  const [draft, setDraft] = useState("");
  const [tag, setTag] = useState(TAGS[0]);
  const [panel, setPanel] = useState(true);
  const [busy, setBusy] = useState(false);

  const idx = toc.findIndex((c) => c.position === chapter.position);
  const prev = toc[idx - 1];
  const next = toc[idx + 1];
  const progress = Math.round((((selected ?? 0) + 1) / chapter.paragraphs.length) * 100);
  const here = notes.filter((n) => n.chapter === chapter.position);
  const login = `/entrar?return_to=${encodeURIComponent(`/livros/${book.slug}?cap=${chapter.position}`)}`;

  function pick(i: number) {
    setSelected(i);
    setPanel(true);
    if (signedIn) void call({ action: "progress", bookId: book.id, chapter: chapter.position, paragraph: i }).catch(() => {});
  }

  async function addNote() {
    if (selected === null || !draft.trim()) return;
    setBusy(true);
    try {
      const r = await call({ action: "note", bookId: book.id, chapter: chapter.position, paragraph: selected, body: draft.trim(), tag });
      setNotes((cur) => [{ id: r.id as string, chapter: chapter.position, paragraph: selected, quote: chapter.paragraphs[selected], body: draft.trim(), tag, createdAt: new Date().toISOString() }, ...cur]);
      setDraft("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function removeNote(id: string) {
    try {
      await call({ action: "delete-note", id });
      setNotes((cur) => cur.filter((n) => n.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir.");
    }
  }

  async function toggleMark(i: number) {
    try {
      const r = await call({ action: "toggle-mark", bookId: book.id, chapter: chapter.position, paragraph: i });
      setMarks((cur) => (r.marked ? [...cur, i] : cur.filter((x) => x !== i)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar o trecho.");
    }
  }

  return (
    <main className={`reader-shell ${panel ? "panel-open" : ""}`}>
      <header className="reader-topbar">
        <Link href="/livros"><ArrowLeft size={17} /> Biblioteca</Link>
        <div><span>{book.title.toUpperCase()}</span><small>{chapter.title}</small></div>
        <button onClick={() => setPanel(!panel)} aria-label="Abrir ou fechar caderno">{panel ? <PanelRightClose /> : <PanelRightOpen />}</button>
      </header>
      <div className="reader-progress"><span style={{ width: `${progress}%` }} /></div>
      <section className="reader-page">
        <div className="reader-book-meta"><span>EDIÇÃO INTERATIVA NEW</span><span>{book.licenseLabel.toUpperCase()}</span></div>
        <p className="reader-author">{book.author}</p><h1>{book.title}</h1>
        <div className="reader-chapter"><small>CAPÍTULO {chapter.position} DE {toc.length}</small><h2>{chapter.title}</h2></div>
        <div className="reader-text">
          {chapter.paragraphs.map((text, i) => (
            <p key={i} id={`p${i + 1}`} className={`${selected === i ? "selected" : ""} ${marks.includes(i) ? "saved" : ""}`} onClick={() => pick(i)}>
              <button aria-label={`Selecionar parágrafo ${i + 1}`}>{text}</button>
              {marks.includes(i) && <Bookmark size={14} fill="currentColor" />}
            </p>
          ))}
        </div>
        <nav className="reader-nav">
          {prev ? <Link href={`/livros/${book.slug}?cap=${prev.position}`}><ChevronLeft size={17} /> Anterior</Link> : <span />}
          <span>{chapter.position} de {toc.length}</span>
          {next ? <Link href={`/livros/${book.slug}?cap=${next.position}`}>Próximo <ChevronRight size={17} /></Link> : <span />}
        </nav>
      </section>
      <aside className="reader-notes">
        <div className="reader-notes-head"><div><span>MEU CADERNO</span><strong>{notes.length} anotações</strong></div><button onClick={() => setPanel(false)} aria-label="Fechar caderno"><X size={18} /></button></div>
        {!signedIn ? (
          <div className="reader-empty"><Highlighter /><h3>Guarde suas anotações</h3><p>Entre na sua conta para marcar trechos e escrever ao lado do texto. Elas ficam salvas em qualquer aparelho.</p><Link className="reader-save" href={login}>Entrar</Link></div>
        ) : selected === null ? (
          <div className="reader-empty"><Highlighter /><h3>Toque em um parágrafo</h3><p>Escolha qualquer trecho para marcar, etiquetar ou escrever ao lado dele.</p></div>
        ) : (
          <>
            <blockquote><Quote size={16} />{chapter.paragraphs[selected]}</blockquote>
            <div className="reader-tools"><button className={marks.includes(selected) ? "active" : ""} onClick={() => void toggleMark(selected)}><Bookmark size={16} /> {marks.includes(selected) ? "Salvo" : "Salvar trecho"}</button></div>
            <label className="reader-label" htmlFor="note-draft"><MessageSquareText size={15} /> O que este trecho provocou?</label>
            <textarea id="note-draft" value={draft} maxLength={2000} onChange={(e) => setDraft(e.target.value)} placeholder="Escreva sua leitura, uma pergunta ou uma conexão…" />
            <label className="reader-label"><Tags size={15} /> Etiqueta</label>
            <div className="reader-tags">{TAGS.map((t) => <button className={tag === t ? "active" : ""} onClick={() => setTag(t)} key={t}>{t}</button>)}</div>
            <button className="reader-save" onClick={() => void addNote()} disabled={!draft.trim() || busy}><Check size={17} /> {busy ? "Guardando…" : "Guardar no caderno"}</button>
          </>
        )}
        {!!here.length && (
          <div className="reader-note-list">
            <span>ANOTAÇÕES DESTE CAPÍTULO</span>
            {here.map((n) => (
              <article key={n.id}>
                <small>{n.tag ? `${n.tag} · ` : ""}§ {n.paragraph + 1}</small>
                <p>{n.body}</p>
                <div className="reader-note-actions">
                  <Link href={`/escrever/pensamento?cite=${n.id}`}><PenLine size={11} /> Citar em pensamento</Link>
                  <Link href={`/escrever?cite=${n.id}`}><PenLine size={11} /> Citar em artigo</Link>
                  <button onClick={() => void removeNote(n.id)}>Excluir</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </aside>
    </main>
  );
}
