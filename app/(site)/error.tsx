"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="na-wrap"><div className="glass na-card" role="alert">
    <div className="eyebrow">TENTE NOVAMENTE</div>
    <h1>Não foi possível carregar esta página.</h1>
    <p>O conteúdo está temporariamente indisponível. Tente de novo ou volte à Revista para continuar navegando.</p>
    <div className="na-actions"><button className="primary" onClick={reset}>Tentar novamente</button><Link className="outline" href="/">Voltar à Revista</Link></div>
  </div></section>;
}
