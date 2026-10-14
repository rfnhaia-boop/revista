"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Empty, Loading, fmtDate, send, useAdminList } from "../ui";

type Item = { id: string; name: string; email: string; createdAt: string; role: string };
const roles: [string, string][] = [
  ["member", "Membro"], ["creator", "Criador"], ["researcher", "Pesquisador"], ["editorial", "Editorial"], ["admin", "Administrador"],
];

export default function UsersPanel() {
  const { items, extra, error, reload } = useAdminList<Item>("/api/admin/users");
  const [query, setQuery] = useState("");
  const meId = extra.meId as string | undefined;
  if (!items) return <Loading />;
  const shown = items.filter((u) => (u.name + " " + u.email).toLowerCase().includes(query.toLowerCase()));

  async function change(u: Item, role: string) {
    if (role === "admin" && !confirm(`Tornar ${u.name} administrador? Ele terá acesso total à gestão.`)) return;
    try {
      await send("/api/admin/users", { userId: u.id, role });
      await reload();
      toast.success("Papel atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar.");
      await reload();
    }
  }

  return (
    <>
      <input className="adm-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou e-mail" aria-label="Buscar usuários" />
      {error && <p className="adm-error">{error}</p>}
      {!shown.length ? (
        <Empty title="Nenhum usuário encontrado" />
      ) : (
        <div className="glass adm-table">
          <table>
            <thead><tr><th>Nome</th><th>E-mail</th><th>Desde</th><th>Papel</th></tr></thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td>
                    <select value={u.role} disabled={u.id === meId} onChange={(e) => void change(u, e.target.value)} aria-label={`Papel de ${u.name}`}>
                      {roles.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    {u.id === meId && <small> · você</small>}
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
