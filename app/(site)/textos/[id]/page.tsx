import Link from "next/link";
import type { Metadata } from "next";
import Markdown from "@/components/editor/markdown";
import { NotAvailableView } from "@/components/site/unavailable";
import NotebookConversation from "@/app/notebook-conversation";
import ThoughtOwnerBar from "@/app/thought-owner-bar";
import ThoughtShare from "@/app/thought-share";
import { getCurrentUser } from "@/lib/auth";
import { database } from "@/lib/storage";

type Row = {
  id: string; title: string; excerpt: string; body: string; format: string; area: string; access: string;
  priceCents: number; status: string; createdAt: string; ownerId: string; name: string; slug: string;
};

async function load(id: string, uid: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const r = await database()
    .prepare(
      "SELECT n.id,n.title,n.excerpt,n.body,n.format,n.area,n.access,n.price_cents AS priceCents,n.status,n.created_at AS createdAt,n.owner_id AS ownerId,p.name,p.slug FROM notebooks n JOIN profiles p ON p.id=n.profile_id WHERE n.id=? AND (n.status='published' OR n.owner_id=?)",
    )
    .bind(id, uid)
    .first<Row>();
  return r;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = await load(id, "");
  if (!r) return { title: "Texto de autor · Revista NEW", robots: { index: false } };
  return {
    title: `${r.title} · ${r.name} · Revista NEW`,
    description: r.excerpt,
    openGraph: { type: "article", title: r.title, description: r.excerpt, locale: "pt_BR", siteName: "Revista NEW" },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const uid = user?.userId || "";
  const r = await load(id, uid);
  if (!r) return <NotAvailableView signedIn={!!user} />;
  const mine = r.ownerId === uid;
  const locked = r.access === "paid" && !mine;
  const words = r.body.trim().split(/\s+/).length;
  const date = new Date(r.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  return (
    <article className="tv">
      <Link className="article-back" href={mine ? "/caderno" : "/explorar"}>
        ← {mine ? "Voltar ao meu Caderno" : "Voltar para Explorar"}
      </Link>
      {mine && r.status !== "published" && (
        <div className="tv-draft">
          {r.status === "draft" ? "Este pensamento é um rascunho: só você vê." : "Este texto foi ocultado pela equipe: só você vê."}
        </div>
      )}
      <header className="tv-head">
        <div className="eyebrow">{r.format.toUpperCase()} · {r.area.toUpperCase()}</div>
        <h1>{r.title}</h1>
        <div className="tv-by">
          <Link href={`/pessoas/${r.slug}`} className="author-inline">
            <span className="avatar-text">{r.name.slice(0, 1)}</span>
            <span>{r.name}<small>{date} · {Math.max(1, Math.ceil(words / 200))} min de leitura</small></span>
          </Link>
          <ThoughtShare id={r.id} title={r.title} />
        </div>
      </header>
      {mine && <ThoughtOwnerBar id={r.id} />}
      {locked ? (
        <div className="paid-lock glass">
          <h3>Acesso por compra avulsa</h3>
          <p>{r.excerpt}</p>
          <p className="fine">Pagamento ainda não disponível. Nenhuma cobrança ou liberação de acesso foi realizada.</p>
        </div>
      ) : (
        <div className="reading article-reading tv-body">
          <Markdown>{r.body}</Markdown>
        </div>
      )}
      <p className="tv-note">Conteúdo independente. Este texto não recebeu avaliação ou selo da NEW.</p>
      <NotebookConversation entry={{ id: r.id, status: r.status, isMine: mine }} signedIn={!!user} loginHref={`/entrar?return_to=${encodeURIComponent("/textos/" + r.id)}`} />
    </article>
  );
}
