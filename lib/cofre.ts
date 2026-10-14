export type CofreCliente = {
  nome: string;
  email: string;
  telefone: string;
  senha?: string;
};
export type CofreResult =
  | { ok: true; jaAtivado: boolean; cliente: CofreCliente }
  | { ok: false; status: number; error: string };

/** Chamada servidor-a-servidor ao Cofre. O segredo nunca vai ao navegador. */
export async function resgatarCodigo(codigo: string, email: string): Promise<CofreResult> {
  const base = process.env.COFRE_URL;
  const secret = process.env.APP_SECRET_REVISTA;
  if (!base || !secret) return { ok: false, status: 503, error: "Login indisponível no momento." };
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/integracao/resgatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Secret": secret },
      body: JSON.stringify({ codigo, email, app: "REVISTA" }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; jaAtivado?: boolean; cliente?: CofreCliente };
    if (!res.ok || !data.cliente) {
      if (res.status === 404) return { ok: false, status: 400, error: "Código e e-mail não conferem." };
      return { ok: false, status: 502, error: "Não foi possível validar o código agora." };
    }
    return { ok: true, jaAtivado: !!data.jaAtivado, cliente: data.cliente };
  } catch {
    return { ok: false, status: 502, error: "Não foi possível validar o código agora." };
  }
}
