"use client";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Plus } from "lucide-react";
import { Empty, Loading, Pill, fmtDate, send, useAdminList } from "../ui";

type Article = {
  id: string; slug: string; title: string; summary: string; area: string; kind: string; authorName: string;
  readingMinutes: number; kicker: string; sortOrder: number; body: string; pullquote: string; referencesText: string;
  statusNote: string; versionNote: string; status: string; publishedAt: string | null; updatedAt: string;
};
const AREAS = ["Psicologia", "Tecnologia", "Educação", "Sociedade", "Filosofia", "Negócios", "Literatura"];
const KINDS = ["Ensaio editorial", "Pesquisa teórica em desenvolvimento", "Carta de princípios", "Entrevista", "Resenha", "Reportagem"];

const STATUS: Record<string, [string, "ok" | "warn" | "bad" | "info"]> = {
  draft: ["Rascunho", "warn"], published: ["Publicado", "ok"], submitted: ["Enviado ao Admin", "info"], reviewing: ["Em revisão", "info"],
  changes_requested: ["Ajustes pedidos", "warn"], rejected: ["Recusado", "bad"],
};
const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);

const blank = (order: number): Article => ({
  id: "", slug: "", title: "", summary: "", area: "Sociedade", kind: KINDS[0], authorName: "Editorial NEW",
  readingMinutes: 5, kicker: "", sortOrder: order, body: "", pullquote: "", referencesText: "",
  statusNote: "Não revisado por pares.", versionNote: "", status: "draft", publishedAt: null, updatedAt: "",
});

export default function ArticlesPanel({ startNew }: { startNew: boolean }) {
  const { items, error, reload } = useAdminList<Article>("/api/admin/articles");
  const [editing, setEditing] = useState<Article | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState(false);

  if (!items) return <Loading />;
  if (startNew && !opened) {
    setOpened(true);
    setEditing(blank(items.length + 1));
  }

  const set = <K extends keyof Article>(k: K, v: Article[K]) => setEditing((a) => (a ? { ...a, [k]: v } : a));

  async function save(status: "draft" | "published") {
    if (!editing) return;
    setBusy(true);
    try {
      const { id, publishedAt, updatedAt, ...rest } = editing;
      void publishedAt;
      void updatedAt;
      const r = await send<{ id: string }>("/api/admin/articles", { ...rest, ...(id ? { id } : {}), status });
      toast.success(status === "published" ? "Publicado na Revista." : "Rascunho salvo.");
      await reload();
      setEditing({ ...editing, id: r.id, status });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="adm-editor">
        <button className="adm-back" onClick={() => setEditing(null)}>
          <ArrowLeft size={15} /> Voltar para a lista
        </button>
        <form className="glass adm-form" onSubmit={(e) => { e.preventDefault(); void save("published"); }}>
          <label>
            Título
            <input
              required minLength={5} maxLength={200} value={editing.title}
              onChange={(e) => { set("title", e.target.value); if (!slugTouched && !editing.id) set("slug", slugify(e.target.value)); }}
            />
          </label>
          <label>
            Endereço (URL)
            <input
              required pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={120} value={editing.slug}
              onChange={(e) => { setSlugTouched(true); set("slug", e.target.value.toLowerCase()); }}
            />
            <small>/revista/{editing.slug || "endereco-da-materia"}</small>
          </label>
          <label>
            Resumo (aparece na home e nos buscadores)
            <textarea required minLength={20} maxLength={500} rows={2} value={editing.summary} onChange={(e) => set("summary", e.target.value)} />
            <small>{editing.summary.length}/500</small>
          </label>
          <div className="adm-grid3">
            <label>Área
              <input list="areas" required minLength={2} maxLength={60} value={editing.area} onChange={(e) => set("area", e.target.value)} />
              <datalist id="areas">{AREAS.map((a) => <option key={a} value={a} />)}</datalist>
            </label>
            <label>Tipo
              <input list="kinds" required minLength={3} maxLength={80} value={editing.kind} onChange={(e) => set("kind", e.target.value)} />
              <datalist id="kinds">{KINDS.map((k) => <option key={k} value={k} />)}</datalist>
            </label>
            <label>Autoria
              <input required minLength={2} maxLength={120} value={editing.authorName} onChange={(e) => set("authorName", e.target.value)} />
            </label>
          </div>
          <div className="adm-grid3">
            <label>Leitura (min)
              <input type="number" min={1} max={120} required value={editing.readingMinutes} onChange={(e) => set("readingMinutes", Number(e.target.value) || 1)} />
            </label>
            <label>Selo do card (ex.: IDENTIDADE)
              <input maxLength={40} value={editing.kicker} onChange={(e) => set("kicker", e.target.value.toUpperCase())} />
            </label>
            <label>Ordem na home
              <input type="number" min={0} max={999} required value={editing.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} />
            </label>
          </div>
          <label>
            Texto
            <textarea className="adm-body" required minLength={40} maxLength={60000} rows={16} value={editing.body} onChange={(e) => set("body", e.target.value)} />
            <small>Separe os parágrafos com uma linha em branco.</small>
          </label>
          <label>
            Frase de destaque (opcional)
            <input maxLength={300} value={editing.pullquote} onChange={(e) => set("pullquote", e.target.value)} />
          </label>
          <div className="adm-grid2">
            <label>Estado da avaliação
              <input required minLength={2} maxLength={200} value={editing.statusNote} onChange={(e) => set("statusNote", e.target.value)} />
            </label>
            <label>Versão / histórico
              <input maxLength={300} value={editing.versionNote} onChange={(e) => set("versionNote", e.target.value)} placeholder="Ex.: Versão editorial v1.0 · 14/10/2026" />
            </label>
          </div>
          <label>
            Referências e manuscrito
            <textarea maxLength={4000} rows={3} value={editing.referencesText} onChange={(e) => set("referencesText", e.target.value)} />
          </label>
          <div className="adm-form-actions">
            <Pill tone={editing.status === "published" ? "ok" : "warn"}>{editing.status === "published" ? "Publicado" : "Rascunho"}</Pill>
            {editing.status === "published" && editing.slug && (
              <a className="adm-link" href={`/revista/${editing.slug}`} target="_blank" rel="noopener noreferrer">
                Ver na Revista <ExternalLink size={13} />
              </a>
            )}
            <span className="adm-spacer" />
            <button type="button" className="adm-act ghost" disabled={busy} onClick={() => void save("draft")}>
              {editing.status === "published" ? "Despublicar (voltar a rascunho)" : "Salvar rascunho"}
            </button>
            <button className="adm-act primary" disabled={busy}>{busy ? "Salvando…" : editing.status === "published" ? "Atualizar publicação" : "Publicar"}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="adm-toolbar">
        <button className="adm-act primary" onClick={() => { setSlugTouched(false); setEditing(blank(items.length + 1)); }}>
          <Plus size={15} /> Novo artigo
        </button>
      </div>
      {error && <p className="adm-error">{error}</p>}
      {!items.length ? (
        <Empty title="Nenhum artigo" text="Crie o primeiro artigo da Revista." />
      ) : (
        <div className="glass adm-table">
          <table>
            <thead><tr><th>#</th><th>Título</th><th>Área</th><th>Atualizado</th><th>Status</th><th /></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.sortOrder}</td>
                  <td><strong>{a.title}</strong><br /><small>/{a.slug}</small></td>
                  <td>{a.area}</td>
                  <td>{fmtDate(a.updatedAt)}</td>
                  <td><Pill tone={(STATUS[a.status] ?? ["", "warn"])[1]}>{(STATUS[a.status] ?? [a.status])[0]}</Pill></td>
                  <td className="adm-row-actions">
                    <button className="adm-act ghost" onClick={() => { setSlugTouched(true); setEditing(a); }}>Editar</button>
                    {a.status === "published" && <a className="adm-link" href={`/revista/${a.slug}`} target="_blank" rel="noopener noreferrer">Ver</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
