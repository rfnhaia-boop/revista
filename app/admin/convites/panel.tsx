"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Empty, Loading, Pill, fmtDate, send, useAdminList } from "../ui";

type Item = { id: string; email: string; invitedName: string; message: string; role: string; status: string; expiresAt: string; createdAt: string; acceptedName: string | null };
const role: Record<string, string> = { creator: "Criador", researcher: "Pesquisador" };

function state(i: Item): [string, "ok" | "warn" | "bad" | "info"] {
  if (i.status === "accepted") return ["Aceito", "ok"];
  if (i.status === "revoked") return ["Revogado", "bad"];
  if (new Date(i.expiresAt) < new Date()) return ["Expirado", "bad"];
  return ["Aberto", "info"];
}

export default function InvitesPanel() {
  const { items, error, reload } = useAdminList<Item>("/api/admin/invites");
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<{ email: string; value: string } | null>(null);

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    try {
      const email = String(f.get("email"));
      const r = await send<{ token: string }>("/api/admin/invites", { action: "create", email, invitedName: String(f.get("invitedName")), message: String(f.get("message")), role: String(f.get("role")) });
      const origin = window.location.origin;
      setToken({ email, value: `${origin}/convite/${r.token}` });
      form.reset();
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao criar.");
    } finally {
      setBusy(false);
    }
  }

  if (!items) return <Loading />;
  return (
    <>
      <form className="glass adm-form-inline" onSubmit={create}>
        <label>
          Nome da pessoa
          <input name="invitedName" required minLength={2} maxLength={100} placeholder="Como ela será recebida" />
        </label>
        <label>
          E-mail do convidado
          <input name="email" type="email" required maxLength={200} placeholder="pessoa@exemplo.com" />
        </label>
        <label>
          Perfil
          <select name="role" defaultValue="creator">
            <option value="creator">Criador</option>
            <option value="researcher">Pesquisador</option>
          </select>
        </label>
        <label className="adm-invite-message">
          Mensagem pessoal <small>(opcional)</small>
          <textarea name="message" maxLength={500} rows={3} placeholder="Escreva por que você quer essa pessoa na Revista NEW…" />
        </label>
        <button className="adm-act primary" disabled={busy}>{busy ? "Gerando…" : "Gerar convite"}</button>
      </form>

      {token && (
        <div className="glass adm-token" role="status">
          <div>
            <strong>Convite gerado para {token.email}</strong>
            <p>Envie este link à pessoa. Ela abrirá um convite personalizado, criará a senha e entrará direto no Caderno. O link vale por 14 dias e só pode ser usado uma vez.</p>
            <code>{token.value}</code>
          </div>
          <button className="adm-act primary" onClick={() => navigator.clipboard.writeText(token.value).then(() => toast.success("Código copiado."))}>
            <Copy size={15} /> Copiar link
          </button>
        </div>
      )}

      {error && <p className="adm-error">{error}</p>}
      {!items.length ? (
        <Empty title="Nenhum convite ainda" text="Convites dão acesso direto, sem passar pelo pedido de análise." />
      ) : (
        <div className="glass adm-table">
          <table>
            <thead><tr><th>E-mail</th><th>Perfil</th><th>Criado</th><th>Validade</th><th>Status</th><th /></tr></thead>
            <tbody>
              {items.map((i) => {
                const [label, tone] = state(i);
                return (
                  <tr key={i.id}>
                    <td>{i.email}{i.acceptedName ? <small> · {i.acceptedName}</small> : null}</td>
                    <td>{role[i.role] ?? i.role}</td>
                    <td>{fmtDate(i.createdAt)}</td>
                    <td>{fmtDate(i.expiresAt)}</td>
                    <td><Pill tone={tone}>{label}</Pill></td>
                    <td>
                      {label === "Aberto" && (
                        <button className="adm-act danger" onClick={async () => { await send("/api/admin/invites", { action: "revoke", id: i.id }); await reload(); toast.success("Convite revogado."); }}>
                          Revogar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
