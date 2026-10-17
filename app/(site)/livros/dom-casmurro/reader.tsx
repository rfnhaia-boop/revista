"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Check, ChevronLeft, ChevronRight, Highlighter, MessageSquareText, PanelRightClose, PanelRightOpen, Quote, Tags, X } from "lucide-react";

const paragraphs = [
  "Uma noite destas, vindo da cidade para o Engenho Novo, encontrei no trem da Central um rapaz aqui do bairro, que eu conheço de vista e de chapéu.",
  "Cumprimentou-me, sentou-se ao pé de mim, falou da lua e dos ministros, e acabou recitando-me versos.",
  "A viagem era curta, e os versos pode ser que não fossem inteiramente maus. Sucedeu, porém, que, como eu estava cansado, fechei os olhos três ou quatro vezes; tanto bastou para que ele interrompesse a leitura e metesse os versos no bolso.",
  "No dia seguinte entrou a dizer de mim nomes feios, e acabou alcunhando-me Dom Casmurro.",
  "Não consultes dicionários. Casmurro não está aqui no sentido que eles lhe dão, mas no que lhe pôs o vulgo de homem calado e metido consigo.",
  "O título ficou, e ele, apesar da alcunha, não me zangou. Contei a anedota aos amigos da cidade, e eles, por graça, chamam-me assim, alguns em bilhetes: Dom Casmurro, domingo vou jantar com você.",
];
type Note = { id: string; paragraph: number; quote: string; body: string; tag: string };
const tags = ["Memória", "Narrador", "Psicologia", "Linguagem", "Dúvida"];

export default function InteractiveReader() {
  const [selected, setSelected] = useState<number | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [tag, setTag] = useState(tags[0]);
  const [panel, setPanel] = useState(true);
  const [saved, setSaved] = useState<number[]>([]);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try { setNotes(JSON.parse(localStorage.getItem("new-reader-dom-casmurro-notes") || "[]")); setSaved(JSON.parse(localStorage.getItem("new-reader-dom-casmurro-saved") || "[]")); } catch {}
      setStorageReady(true);
    });
  }, []);
  useEffect(() => { if (storageReady) localStorage.setItem("new-reader-dom-casmurro-notes", JSON.stringify(notes)); }, [notes, storageReady]);
  useEffect(() => { if (storageReady) localStorage.setItem("new-reader-dom-casmurro-saved", JSON.stringify(saved)); }, [saved, storageReady]);

  const progress = useMemo(() => Math.round(((selected ?? 0) + 1) / paragraphs.length * 100), [selected]);
  function addNote() {
    if (selected === null || !draft.trim()) return;
    setNotes((current) => [{ id: crypto.randomUUID(), paragraph: selected, quote: paragraphs[selected], body: draft.trim(), tag }, ...current]);
    setDraft("");
  }

  return (
    <main className={`reader-shell ${panel ? "panel-open" : ""}`}>
      <header className="reader-topbar">
        <Link href="/livros"><ArrowLeft size={17} /> Biblioteca</Link>
        <div><span>DOM CASMURRO</span><small>Capítulo I · Do título</small></div>
        <button onClick={() => setPanel(!panel)} aria-label="Abrir ou fechar caderno">{panel ? <PanelRightClose /> : <PanelRightOpen />}</button>
      </header>
      <div className="reader-progress"><span style={{ width: `${progress}%` }} /></div>
      <section className="reader-page">
        <div className="reader-book-meta"><span>EDIÇÃO INTERATIVA NEW · 01</span><span>OBRA EM DOMÍNIO PÚBLICO</span></div>
        <p className="reader-author">Machado de Assis</p><h1>Dom Casmurro</h1><div className="reader-chapter"><small>CAPÍTULO PRIMEIRO</small><h2>Do título</h2></div>
        <div className="reader-text">
          {paragraphs.map((text, index) => <p key={text} className={`${selected === index ? "selected" : ""} ${saved.includes(index) ? "saved" : ""}`} onClick={() => { setSelected(index); setPanel(true); }}><button aria-label={`Selecionar parágrafo ${index + 1}`}>{text}</button>{saved.includes(index) && <Bookmark size={14} fill="currentColor" />}</p>)}
        </div>
        <nav className="reader-nav"><button disabled><ChevronLeft size={17} /> Anterior</button><span>1 de 148</span><button>Próximo <ChevronRight size={17} /></button></nav>
      </section>
      <aside className="reader-notes">
        <div className="reader-notes-head"><div><span>MEU CADERNO</span><strong>{notes.length} anotações</strong></div><button onClick={() => setPanel(false)}><X size={18} /></button></div>
        {selected === null ? <div className="reader-empty"><Highlighter /><h3>Toque em um parágrafo</h3><p>Escolha qualquer trecho para marcar, etiquetar ou escrever ao lado dele.</p></div> : <>
          <blockquote><Quote size={16} />{paragraphs[selected]}</blockquote>
          <div className="reader-tools"><button className={saved.includes(selected) ? "active" : ""} onClick={() => setSaved((current) => current.includes(selected) ? current.filter((item) => item !== selected) : [...current, selected])}><Bookmark size={16} /> {saved.includes(selected) ? "Salvo" : "Salvar trecho"}</button></div>
          <label className="reader-label"><MessageSquareText size={15} /> O que este trecho provocou?</label><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escreva sua leitura, uma pergunta ou uma conexão…" />
          <label className="reader-label"><Tags size={15} /> Etiqueta</label><div className="reader-tags">{tags.map((item) => <button className={tag === item ? "active" : ""} onClick={() => setTag(item)} key={item}>{item}</button>)}</div>
          <button className="reader-save" onClick={addNote} disabled={!draft.trim()}><Check size={17} /> Guardar no caderno</button>
        </>}
        {!!notes.length && <div className="reader-note-list"><span>ANOTAÇÕES DESTA LEITURA</span>{notes.map((note) => <article key={note.id}><small>{note.tag} · § {note.paragraph + 1}</small><p>{note.body}</p><button onClick={() => setNotes((current) => current.filter((item) => item.id !== note.id))}>Excluir</button></article>)}</div>}
      </aside>
    </main>
  );
}
