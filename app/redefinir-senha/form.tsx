"use client";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function ResetForm({ token }: { token: string }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: String(f.get("password")), confirmPassword: String(f.get("confirmPassword")) }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Não foi possível redefinir.");
      setDone(true);
      setTimeout(() => (window.location.href = "/entrar"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao redefinir.");
      setBusy(false);
    }
  }

  if (done) return <p role="status" className="auth-notice">Senha alterada. Levando você para a tela de entrada…</p>;
  return (
    <form onSubmit={submit} className="auth-form">
      <label className="auth-field">
        <span>Nova senha (mínimo 8 caracteres)</span>
        <div className="auth-pass">
          <input name="password" type={show ? "text" : "password"} required minLength={8} maxLength={200} autoComplete="new-password" autoFocus />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </label>
      <label className="auth-field">
        <span>Repita a nova senha</span>
        <input name="confirmPassword" type={show ? "text" : "password"} required minLength={8} maxLength={200} autoComplete="new-password" />
      </label>
      {error && <p role="alert" className="auth-error">{error}</p>}
      <button className="auth-submit" disabled={busy}>{busy ? "Aguarde…" : "Salvar nova senha"}</button>
    </form>
  );
}
