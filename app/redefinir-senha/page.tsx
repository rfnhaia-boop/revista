import Link from "next/link";
import "../auth.css";
import { resetTokenValid } from "@/lib/password-reset";
import ResetForm from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nova senha · Revista NEW", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = ((await searchParams).token ?? "").slice(0, 200);
  const valid = token ? await resetTokenValid(token) : false;
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
          {valid ? (
            <>
              <h1>Nova senha</h1>
              <p className="auth-lead">Escolha uma senha nova para a sua conta. Você será desconectado dos outros aparelhos.</p>
              <ResetForm token={token} />
            </>
          ) : (
            <>
              <h1>Link inválido</h1>
              <p className="auth-lead">Este link expirou, já foi usado ou está incorreto. Peça um novo link na tela de entrada.</p>
              <Link className="auth-submit" href="/entrar" style={{ textAlign: "center", textDecoration: "none", display: "block", lineHeight: "52px" }}>Voltar para entrar</Link>
            </>
          )}
        </div>
        <p className="auth-foot">Uma iniciativa NEW Company</p>
      </section>
    </main>
  );
}
