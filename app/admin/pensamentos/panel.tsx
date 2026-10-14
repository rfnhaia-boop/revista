"use client";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Empty, Loading, Pill, fmtDate, send, useAdminList } from "../ui";

type Item = { id: string; title: string; excerpt: string; format: string; area: string; status: string; createdAt: string; name: string; slug: string };

export default function ThoughtsPanel() {
  const { items, error, reload } = useAdminList<Item>("/api/admin/thoughts");
  const [query, setQuery] = useState("");
  if (!items) return <Loading />;
  const shown = items.filter((t) => (t.title + " " + t.name + " " + t.excerpt).toLowerCase().includes(query.toLowerCase()));

  async function toggle(t: Item) {
    const hide = t.status === "published";
    if (hide && !confirm("Ocultar este pensamento? Ele some do site, mas o autor continua vendo com o aviso.")) return;
    try {
      await send("/api/admin/thoughts", { id: t.id, hidden: hide, note: "" });
      toast.success(hide ? "Pensamento ocultado." : "Pensamento reexibido.");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar.");
    }
  }

  return (
    <>
      <input className="adm-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por título, autor ou trecho" aria-label="Buscar pensamentos" />
      {error && <p className="adm-error">{error}</p>}
      {!shown.length ? (
        <Empty title="Nenhum pensamento" text="Os pensamentos publicados nos Cadernos aparecem aqui para moderação." />
      ) : (
        <div className="glass adm-table">
          <table>
            <thead><tr><th>Pensamento</th><th>Autor</th><th>Data</th><th>Status</th><th /></tr></thead>
            <tbody>
              {shown.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.title}</strong>
                    <br />
                    <small>{t.format} · {t.area}</small>
                  </td>
                  <td>{t.name}</td>
                  <td>{fmtDate(t.createdAt)}</td>
                  <td><Pill tone={t.status === "published" ? "ok" : "bad"}>{t.status === "published" ? "Visível" : "Oculto"}</Pill></td>
                  <td className="adm-row-actions">
                    <a className="adm-link" href={`/textos/${t.id}`} target="_blank" rel="noopener noreferrer">
                      Ver <ExternalLink size={13} />
                    </a>
                    <button className={"adm-act " + (t.status === "published" ? "danger" : "ghost")} onClick={() => void toggle(t)}>
                      {t.status === "published" ? "Ocultar" : "Reexibir"}
                    </button>
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
