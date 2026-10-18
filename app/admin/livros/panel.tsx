"use client";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Empty, Loading, Pill, send, useAdminList } from "../ui";

type Book = { id: string; slug: string; title: string; author: string; year: number | null; description: string; license: string; licenseNote: string; status: string; chapters: number };
const LICENSES: [string, string][] = [["public_domain", "Domínio público"], ["licensed", "Licenciada (tenho autorização)"], ["original", "Obra original da NEW"]];
const LABEL = Object.fromEntries(LICENSES.map(([k, v]) => [k, v.split(" (")[0]]));

const EXAMPLE = `# Capítulo I — Do título

Primeiro parágrafo do capítulo.

Segundo parágrafo, separado por uma linha em branco.

# Capítulo II — Do livro

Cada linha começando com "# " abre um capítulo novo.`;

export default function BooksPanel() {
  const { items, error, reload } = useAdminList<Book>("/api/admin/books");
  const [editing, setEditing] = useState<{ id: string | null; book: Book | null; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!items) return <Loading />;

  async function edit(b: Book) {
    const r = await fetch(`/api/admin/books?id=${b.id}`, { cache: "no-store" });
    const d = (await r.json()) as { text?: string };
    setEditing({ id: b.id, book: b, text: d.text ?? "" });
  }

  async function status(b: Book, action: "publish" | "unpublish") {
    try {
      await send("/api/admin/books", { action, id: b.id });
      toast.success(action === "publish" ? "Livro publicado." : "Livro despublicado.");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir.");
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const year = String(f.get("year") ?? "").trim();
    const book = {
      title: String(f.get("title") ?? ""), author: String(f.get("author") ?? ""), year: year ? Number(year) : null,
      description: String(f.get("description") ?? ""), license: String(f.get("license") ?? ""), licenseNote: String(f.get("licenseNote") ?? ""), text: String(f.get("text") ?? ""),
    };
    setBusy(true);
    try {
      await send("/api/admin/books", editing?.id ? { action: "update", id: editing.id, book } : { action: "create", book });
      toast.success(editing?.id ? "Livro atualizado." : "Livro criado como rascunho.");
      setEditing(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    const b = editing.book;
    return (
      <form className="glass adm-form" onSubmit={submit}>
        <h2 className="adm-sub">{editing.id ? `Editar: ${b?.title}` : "Novo livro"}</h2>
        <label>Título<input name="title" required maxLength={160} defaultValue={b?.title} /></label>
        <label>Autor<input name="author" required maxLength={120} defaultValue={b?.author} /></label>
        <label>Ano da obra<input name="year" inputMode="numeric" defaultValue={b?.year ?? ""} /></label>
        <label>Sobre o livro<textarea name="description" maxLength={1200} rows={3} defaultValue={b?.description} /></label>
        <label>Licença do texto
          <select name="license" required defaultValue={b?.license ?? "public_domain"}>{LICENSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
        <label>Fonte e prova da licença (obrigatório)
          <textarea name="licenseNote" required minLength={10} maxLength={1000} rows={3} defaultValue={b?.licenseNote} placeholder="Ex.: Machado de Assis (m. 1908), obra em domínio público. Texto de [fonte/edição]. Para licenciada: contrato com [titular], vigência." />
        </label>
        <label>Texto do livro (cada &ldquo;# Título&rdquo; abre um capítulo; parágrafos separados por linha em branco)
          <textarea name="text" required rows={16} defaultValue={editing.text} placeholder={EXAMPLE} />
        </label>
        <p className="adm-muted">Mudar o texto de um livro já lido pode deslocar as anotações dos leitores (elas guardam a citação original).</p>
        <div className="adm-actions">
          <button className="primary" disabled={busy}>{busy ? "Salvando…" : "Salvar"}</button>
          <button type="button" className="outline" onClick={() => setEditing(null)}>Cancelar</button>
        </div>
      </form>
    );
  }

  return (
    <>
      <div className="adm-actions"><button className="primary" onClick={() => setEditing({ id: null, book: null, text: "" })}>+ Novo livro</button></div>
      {error && <p className="adm-error">{error}</p>}
      {items.length === 0 ? (
        <Empty title="Nenhum livro ainda" text="Cadastre o primeiro: título, licença e o texto dividido em capítulos." />
      ) : (
        <div className="glass adm-table">
          <table>
            <thead><tr><th>Livro</th><th>Licença</th><th>Capítulos</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <td>{b.title}<br /><small>{b.author}{b.year ? `, ${b.year}` : ""}</small></td>
                  <td>{LABEL[b.license] ?? b.license}</td>
                  <td>{b.chapters}</td>
                  <td><Pill tone={b.status === "published" ? "ok" : "warn"}>{b.status === "published" ? "Publicado" : "Rascunho"}</Pill></td>
                  <td className="adm-actions">
                    <button className="outline small" onClick={() => void edit(b)}>Editar</button>
                    {b.status === "published" ? (
                      <button className="outline small" onClick={() => void status(b, "unpublish")}>Despublicar</button>
                    ) : (
                      <button className="primary small" onClick={() => void status(b, "publish")}>Publicar</button>
                    )}
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
