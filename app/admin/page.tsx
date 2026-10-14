import Link from "next/link";
import { requireStaffPage } from "@/lib/admin";
import { database } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const user = await requireStaffPage();
  const db = database();
  const one = async (sql: string) => (await db.prepare(sql).first<{ n: number }>())?.n ?? 0;
  const [requests, questions, submissions, drafts, published, users, reviewing] = await Promise.all([
    user.isAdmin ? one("SELECT COUNT(*) AS n FROM role_requests WHERE status IN ('submitted','reviewing','changes_requested')") : 0,
    one("SELECT COUNT(*) AS n FROM community_questions WHERE status IN ('submitted','reviewing')"),
    one("SELECT COUNT(*) AS n FROM submissions WHERE status IN ('received','reviewing')"),
    one("SELECT COUNT(*) AS n FROM articles WHERE status='draft' AND author_id IS NULL"),
    one("SELECT COUNT(*) AS n FROM articles WHERE status='published'"),
    user.isAdmin ? one("SELECT COUNT(*) AS n FROM users") : 0,
    one("SELECT COUNT(*) AS n FROM articles WHERE author_id IS NOT NULL AND status IN ('submitted','reviewing')"),
  ]);

  const cards = [
    ...(user.isAdmin ? [{ href: "/admin/acessos", n: requests, label: "Pedidos de acesso", hint: "criadores e pesquisadores aguardando" }] : []),
    { href: "/admin/revisao", n: reviewing, label: "Artigos para revisar", hint: "enviados pelo público" },
    { href: "/admin/envios", n: submissions, label: "Outros envios", hint: "livros, projetos e candidaturas" },
    { href: "/admin/perguntas", n: questions, label: "Perguntas da comunidade", hint: "aguardando triagem" },
    { href: "/admin/artigos", n: drafts, label: "Artigos em rascunho", hint: `${published} publicado(s)` },
  ];

  return (
    <>
      <header className="adm-head">
        <div>
          <div className="eyebrow">GESTÃO</div>
          <h1>Olá, {user.displayName.split(" ")[0]}.</h1>
          <p>O que precisa da sua atenção agora.</p>
        </div>
        <Link href="/admin/artigos?novo=1" className="primary adm-btn">
          + Novo artigo
        </Link>
      </header>
      <div className="adm-cards">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className={"glass adm-card" + (c.n > 0 && c.label !== "Artigos em rascunho" ? " hot" : "")}>
            <strong>{c.n}</strong>
            <span>{c.label}</span>
            <small>{c.hint}</small>
          </Link>
        ))}
      </div>
      {user.isAdmin && <p className="adm-muted">{users} usuário(s) cadastrado(s) na Revista.</p>}
    </>
  );
}
