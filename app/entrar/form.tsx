"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

async function post(url: string, body: unknown): Promise<{ message?: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
  if (!res.ok) throw new Error(data.error || "Não foi possível continuar.");
  return data;
}

export default function EntrarForm({ returnTo }: { returnTo: string }) {
  const [mode, setMode] = useState<"login" | "ativar" | "forgot">("login");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      if (mode === "forgot") {
        const r = await post("/api/auth/forgot", { email: String(f.get("email")) });
        setNotice(r.message || "Se o e-mail estiver cadastrado, enviamos um link.");
        setBusy(false);
        return;
      }
      if (mode === "login")
        await post("/api/auth/login", { email: String(f.get("email")), senha: String(f.get("senha")) });
      else await post("/api/auth/ativar", { email: String(f.get("email")), codigo: String(f.get("codigo")), terms: f.get("terms") === "on" });
      window.location.href = returnTo;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar.");
      setBusy(false);
    }
  }

  function switchTo(next: "login" | "ativar" | "forgot") {
    setMode(next);
    setError("");
    setNotice("");
  }

  return (
    <main className="auth-split">
      <aside className="auth-art" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/neural-glass.png" alt="" />
        <div className="auth-art-shade" />
        <div className="auth-art-copy">
          <span>IDEIAS · CIÊNCIA · FUTURO</span>
          <p>
            Ciência começa
            <br />
            com uma <em>pergunta.</em>
          </p>
        </div>
      </aside>

      <section className="auth-panel">
        <Link href="/" className="wordmark auth-brand">
          <span>Revista</span> NEW<span className="wordmark-dot">.</span>
        </Link>

        <div className="auth-box">
          {mode !== "login" && (
            <button type="button" className="auth-back" onClick={() => switchTo("login")}>
              <ArrowLeft size={15} /> Voltar para entrar
            </button>
          )}
          <h1>{mode === "login" ? "Entrar" : mode === "forgot" ? "Nova senha" : "Primeiro acesso"}</h1>
          <p className="auth-lead">
            {mode === "login"
              ? "Use o e-mail e a senha do seu cadastro NEW."
              : mode === "forgot"
                ? "Informe o e-mail da sua conta e enviamos um link para criar uma nova senha."
                : "Informe o e-mail do seu cadastro e o código de ativação que você recebeu."}
          </p>

          <form onSubmit={submit} key={mode} className="auth-form">
            <label className="auth-field">
              <span>E-mail</span>
              <input name="email" type="email" required autoFocus autoComplete="email" maxLength={200} placeholder="voce@exemplo.com" />
            </label>

            {mode === "forgot" ? null : mode === "login" ? (
              <label className="auth-field">
                <span>Senha</span>
                <div className="auth-pass">
                  <input name="senha" type={show ? "text" : "password"} required autoComplete="current-password" maxLength={200} />
                  <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
            ) : (
              <label className="auth-field">
                <span>Código de ativação</span>
                <input name="codigo" required autoComplete="off" maxLength={9} placeholder="XXXX-XXXX" className="auth-code" />
              </label>
            )}

            {mode === "ativar" && (
              <label className="auth-terms">
                <input name="terms" type="checkbox" required />
                <span>Li e aceito os <Link href="/termos" target="_blank">Termos de Uso</Link> e a <Link href="/privacidade" target="_blank">Política de Privacidade</Link>.</span>
              </label>
            )}

            {notice && (
              <p role="status" className="auth-notice">
                {notice}
              </p>
            )}

            {error && (
              <p role="alert" className="auth-error">
                {error}
              </p>
            )}

            <button className="auth-submit" disabled={busy}>
              {busy ? "Aguarde…" : mode === "login" ? "Entrar" : mode === "forgot" ? "Enviar link" : "Ativar minha conta"}
            </button>
          </form>

          {mode === "login" && (
            <p className="auth-alt">
              <button type="button" onClick={() => switchTo("forgot")}>
                Esqueci minha senha
              </button>
              {" · "}
              Primeiro acesso?{" "}
              <button type="button" onClick={() => switchTo("ativar")}>
                Ative com seu código
              </button>
            </p>
          )}
        </div>

        <p className="auth-foot">Uma iniciativa NEW Company</p>
      </section>
    </main>
  );
}
