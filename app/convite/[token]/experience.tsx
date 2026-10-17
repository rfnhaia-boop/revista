"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Eye, EyeOff, Feather, Sparkles } from "lucide-react";

type Invite = { email: string; invitedName: string; message: string; role: string; expiresAt: string };

export default function InviteExperience({ token }: { token: string }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [stage, setStage] = useState<"opening" | "letter" | "register">("opening");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch(`/api/auth/invite?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Convite indisponível.");
        setInvite(data);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Convite indisponível."));
  }, [token]);

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: String(form.get("name")),
          password: String(form.get("password")),
          confirmPassword: String(form.get("confirmPassword")),
          consent: form.get("consent") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível aceitar o convite.");
      window.location.href = data.redirectTo || "/caderno";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível aceitar o convite.");
      setBusy(false);
    }
  }

  if (!invite && !error) return <main className="invite-loading"><span className="invite-orbit" /><p>Preparando seu convite…</p></main>;
  if (!invite) return <main className="invite-invalid"><div><span>REVISTA NEW</span><h1>Este convite não está mais disponível.</h1><p>{error}</p><Link href="/">Conhecer a revista</Link></div></main>;

  const firstName = invite.invitedName.trim().split(/\s+/)[0] || "Você";
  const role = invite.role === "researcher" ? "pesquisador(a)" : "autor(a)";

  return (
    <main className={`invite-page stage-${stage}`}>
      <div className="invite-aurora invite-aurora-one" /><div className="invite-aurora invite-aurora-two" />
      <header className="invite-header"><Link href="/" className="invite-brand"><small>Revista</small> NEW<span>.</span></Link><span>CONVITE PESSOAL · Nº {token.slice(0, 5).toUpperCase()}</span></header>

      {stage === "opening" && (
        <section className="invite-opening">
          <button className="invite-envelope" onClick={() => setStage("letter")} aria-label="Abrir convite">
            <span className="envelope-back" /><span className="envelope-letter"><Sparkles size={18} /><strong>Para {firstName}</strong><small>um convite da NEW</small></span><span className="envelope-front" /><span className="envelope-seal">N</span>
          </button>
          <p>Toque para abrir</p>
        </section>
      )}

      {stage === "letter" && (
        <section className="invite-letter-wrap">
          <article className="invite-letter">
            <div className="invite-letter-kicker"><Feather size={16} /> UM LUGAR PARA QUEM PENSA ALÉM</div>
            <p className="invite-to">{firstName},</p>
            <h1>Suas ideias merecem<br /><em>um lugar para crescer.</em></h1>
            <p className="invite-message">{invite.message || "Gostaríamos de convidar você para construir conhecimento com a Revista NEW — uma comunidade de pessoas que escrevem, investigam e compartilham novas formas de enxergar o mundo."}</p>
            <div className="invite-paths"><span><BookOpen size={17} /> Publique pensamentos no Caderno</span><span><Feather size={17} /> Envie artigos para a Revista</span></div>
            <p className="invite-note">Você entra como {role}. Artigos completos passam pela curadoria editorial antes da publicação.</p>
            <button className="invite-accept" onClick={() => setStage("register")}>Aceitar o convite <ArrowRight size={18} /></button>
          </article>
        </section>
      )}

      {stage === "register" && (
        <section className="invite-register-wrap">
          <div className="invite-register-intro"><span>SEU ESPAÇO COMEÇA AQUI</span><h1>Bem-vindo(a),<br /><em>{firstName}.</em></h1><p>Crie sua senha e entre direto no Caderno. Seu e-mail já foi confirmado pelo convite.</p><div><Check size={15} /> Convite pessoal verificado</div></div>
          <form className="invite-form" onSubmit={register}>
            <label><span>Seu nome</span><input name="name" required minLength={2} maxLength={100} defaultValue={invite.invitedName} autoComplete="name" /></label>
            <label><span>E-mail convidado</span><input value={invite.email} disabled /></label>
            <label><span>Crie uma senha</span><div className="invite-password"><input name="password" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" /><button type="button" onClick={() => setShow(!show)} aria-label={show ? "Ocultar senha" : "Mostrar senha"}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><small>Mínimo de 8 caracteres</small></label>
            <label><span>Repita a senha</span><input name="confirmPassword" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" /></label>
            <label className="invite-consent"><input name="consent" type="checkbox" required /><span>Confirmo que este convite foi enviado para mim, aceito participar da comunidade NEW e li os <a href="/termos" target="_blank">Termos de Uso</a> e a <a href="/privacidade" target="_blank">Política de Privacidade</a>.</span></label>
            {error && <p className="invite-error" role="alert">{error}</p>}
            <button className="invite-accept" disabled={busy}>{busy ? "Criando seu espaço…" : <>Entrar para a Revista NEW <ArrowRight size={18} /></>}</button>
          </form>
        </section>
      )}
      <footer className="invite-footer">NEW COMPANY · IDEIAS, CIÊNCIA E FUTURO</footer>
    </main>
  );
}
